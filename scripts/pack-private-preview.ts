import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { normalizeSource, previewFiles, sealOverlay, sourceHash, type Overlay } from './private-preview-overlay';

function argument(name: string) {
  const value = process.argv[process.argv.indexOf('--' + name) + 1];
  if (!process.argv.includes('--' + name) || !value) throw new Error('Missing --' + name);
  return resolve(value);
}
const source = argument('source'), base = argument('base'), output = argument('out');
if (output.startsWith(base + sep) || output.startsWith(source + sep)) throw new Error('Write the encrypted package outside Git checkouts.');
const secret = await readFile(argument('key-file'), 'utf8');
const files: Overlay['files'] = {};
for (const file of previewFiles) {
  const content = normalizeSource(await readFile(resolve(source, file), 'utf8'));
  files[file] = { base: sourceHash(await readFile(resolve(base, file), 'utf8')), hash: sourceHash(content), content };
}
const encrypted = sealOverlay({ version: 1, files }, secret);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, encrypted);
console.info('Encrypted private preview package prepared (2 files); contents omitted.');
