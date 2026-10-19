import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { applyOverlay, openOverlay, previewFiles, sealOverlay, sourceHash, type Overlay } from '../scripts/private-preview-overlay';

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
  } finally {
    const resolved = resolve(root);
    if (!resolved.startsWith(resolve(tmpdir()) + sep + 'telotia-overlay-test-')) throw new Error('Unsafe fixture cleanup path');
    await rm(resolved, { recursive: true });
  }
});
