import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { applyOverlay, openOverlay, assembleOverlay, previewFiles, sealOverlay, sourceHash, type Overlay } from '../scripts/private-preview-overlay';

const secret = 'fixture-session-key-at-least-32-characters';
const base = 'export const fixture = "public";\n';
const content = 'export const fixture = "private fixture";\n';
function fixture(): Overlay {
  return { version: 1, files: Object.fromEntries(previewFiles.map(file => [file, { base: sourceHash(base), hash: sourceHash(content), content }])) };
}
test('private overlay is authenticated, confidential and limited to the two animation sources', () => {
  const data = fixture(), encrypted = sealOverlay(data, secret);
  expect(encrypted).not.toContain(content); expect(openOverlay(encrypted, secret)).toEqual(data);
  expect(() => openOverlay(encrypted, secret + 'wrong')).toThrow('validation failed');
  const parts = encrypted.split('.'); parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1);
  expect(() => openOverlay(parts.join('.'), secret)).toThrow('validation failed');
  const bad = fixture(); bad.files['worker/preview-auth.ts'] = bad.files[previewFiles[0]];
  expect(() => sealOverlay(bad, secret)).toThrow('allowlist');
  const traversed = fixture(); traversed.files['../outside.ts'] = traversed.files[previewFiles[0]];
  expect(() => sealOverlay(traversed, secret)).toThrow('allowlist');
});
test('overlay validates all original files before writing, supports CRLF and restores exact public source', async () => {
  const root = await mkdtemp(join(tmpdir(), 'telotia-overlay-test-'));
  try {
    for (const file of previewFiles) { await mkdir(dirname(join(root, file)), { recursive: true }); await writeFile(join(root, file), base.replaceAll('\n', '\r\n')); }
    const applied = await applyOverlay(fixture(), root);
    expect(applied.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(await readFile(join(root, previewFiles[0]), 'utf8')).toBe(content);
    await applied.restore();
    expect(await readFile(join(root, previewFiles[0]), 'utf8')).toBe(base.replaceAll('\n', '\r\n'));
    await writeFile(join(root, previewFiles[1]), 'changed upstream');
    await expect(applyOverlay(fixture(), root)).rejects.toThrow('base changed');
    expect(await readFile(join(root, previewFiles[0]), 'utf8')).toBe(base.replaceAll('\n', '\r\n'));
    if (process.platform !== 'win32') {
      await unlink(join(root, previewFiles[1]));
      await symlink(join(root, previewFiles[0]), join(root, previewFiles[1]));
      await expect(applyOverlay(fixture(), root)).rejects.toThrow('path is redirected');
    }
  } finally {
    const resolved = resolve(root);
    if (!resolved.startsWith(resolve(tmpdir()) + sep + 'telotia-overlay-test-')) throw new Error('Unsafe fixture cleanup path');
    await rm(resolved, { recursive: true });
  }
});

test('multipart envelopes preserve authentication and reject missing, oversized and reordered parts', () => {
  const data = fixture();
  // Incompressible synthetic source makes the envelope cross one secret boundary.
  const bytes = crypto.getRandomValues(new Uint8Array(42000));
  const text = Buffer.from(bytes).toString('base64');
  data.files[previewFiles[0]] = { base: sourceHash(base), hash: sourceHash(text), content: text };
  const sealed = sealOverlay(data, secret);
  expect(sealed.length).toBeGreaterThan(44000);
  const a = sealed.slice(0, 44000), b = sealed.slice(44000, 88000), c = sealed.slice(88000) || '-';
  expect(openOverlay(assembleOverlay([a,b,c]), secret)).toEqual(data);
  expect(() => openOverlay(assembleOverlay([a,'-','-']), secret)).toThrow();
  expect(() => openOverlay(assembleOverlay([b,a,c]), secret)).toThrow();
  expect(() => assembleOverlay(['',b,c])).toThrow();
  expect(() => assembleOverlay([a,'',b])).toThrow();
  expect(() => assembleOverlay(['x'.repeat(44001),'',''])).toThrow();
  expect(assembleOverlay(['','',''])).toBe('');
  expect(assembleOverlay([sealOverlay(fixture(),secret),'-','-'])).toStartWith('v1.');
});
