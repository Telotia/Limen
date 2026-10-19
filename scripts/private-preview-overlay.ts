import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';

export const previewFiles = ['src/scripts/task-loop-cinematic.ts', 'src/scripts/task-loop.ts'] as const;
const context = 'Telotia dev private preview source v1';
type Entry = { base: string; hash: string; content: string };
export type Overlay = { version: 1; files: Record<string, Entry> };
export const normalizeSource = (text: string) => text.replaceAll('\r\n', '\n');
export const sourceHash = (text: string) => createHash('sha256').update(normalizeSource(text)).digest('hex');
function key(secret: string) {
  if (secret.trim().length < 32) throw new Error('Private preview encryption is not configured.');
  return Buffer.from(hkdfSync('sha256', Buffer.from(secret.trim()), Buffer.from(context), Buffer.from('source-overlay-only'), 32));
}
function validate(value: unknown): Overlay {
  const data = value as Overlay;
  if (!data || data.version !== 1 || !data.files || Object.keys(data.files).sort().join('|') !== [...previewFiles].sort().join('|')) throw new Error('Invalid private preview file allowlist.');
  for (const file of previewFiles) {
    const entry = data.files[file];
    if (!entry || typeof entry.content !== 'string' || entry.content.length > 128000 || !/^[a-f0-9]{64}$/.test(entry.base) || entry.hash !== sourceHash(entry.content)) throw new Error('Invalid private preview source manifest.');
  }
  return data;
}
export function sealOverlay(data: Overlay, secret: string): string {
  validate(data);
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(gzipSync(JSON.stringify(data))), cipher.final()]);
  const envelope = ['v1', iv.toString('base64url'), encrypted.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.');
  if (envelope.length > 44000) throw new Error('Private preview package exceeds the secret size limit.');
  return envelope;
}
export function openOverlay(envelope: string, secret: string): Overlay {
  try {
    if (envelope.length > 44000) throw new Error();
    const parts = envelope.trim().split('.');
    if (parts.length !== 4 || parts[0] !== 'v1' || parts.slice(1).some(p => !/^[A-Za-z0-9_-]+$/.test(p))) throw new Error();
    const iv = Buffer.from(parts[1], 'base64url'), tag = Buffer.from(parts[3], 'base64url');
    if (iv.length !== 12 || tag.length !== 16) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm', key(secret), iv);
    decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(tag);
    const compressed = Buffer.concat([decipher.update(Buffer.from(parts[2], 'base64url')), decipher.final()]);
    return validate(JSON.parse(gunzipSync(compressed, { maxOutputLength: 512000 }).toString('utf8')));
  } catch { throw new Error('Private preview package validation failed; source contents suppressed.'); }
}
export async function applyOverlay(data: Overlay, root: string) {
  validate(data);
  const base = await realpath(root), originals = new Map<string, string>();
  // Validate every path and base before writing anything. Cross-platform line endings are normalized.
  for (const file of previewFiles) {
    const target = await realpath(resolve(base, file));
    if (!target.startsWith(base + sep)) throw new Error('Private preview path escapes checkout.');
    const content = await readFile(target, 'utf8');
    if (sourceHash(content) !== data.files[file].base) throw new Error('Private preview base changed; regenerate the encrypted package locally.');
    originals.set(target, content);
  }
  const restore = async () => { for (const [file, content] of originals) await writeFile(file, content); };
  try {
    for (const file of previewFiles) await writeFile(resolve(base, file), normalizeSource(data.files[file].content));
  } catch (error) { await restore(); throw error; }
  const revision = createHash('sha256').update(previewFiles.map(file => data.files[file].hash).join(':')).digest('hex');
  return { restore, revision };
}
