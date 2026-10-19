import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { isPrivatePreview } from '../worker/private-preview';
import { applyOverlay, openOverlay } from './private-preview-overlay';

async function snapshot(root: string) {
  const hashes = new Map<string, string>();
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) hashes.set(relative(root, path).replaceAll('\\', '/'), createHash('sha256').update(await readFile(path)).digest('hex'));
      else throw new Error('Unexpected asset type.');
    }
  }
  await walk(root); return hashes;
}
async function quiet(command: string[]) {
  const child = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });
  const result = await Promise.all([child.exited, new Response(child.stdout).arrayBuffer(), new Response(child.stderr).arrayBuffer()]);
  if (result[0] !== 0) throw new Error('Private preview validation/build failed; reproduce locally. Source diagnostics suppressed.');
}
const encrypted = process.env.PREVIEW_PRIVATE_SOURCE_BUNDLE;
if (!encrypted) {
  console.info('No private preview overlay configured; dev build is unchanged.');
} else {
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REF !== 'refs/heads/dev') throw new Error('Private preview builds only run on dev.');
  const overlay = openOverlay(encrypted, process.env.PREVIEW_SESSION_SECRET || '');
  const before = await snapshot('dist');
  const applied = await applyOverlay(overlay, process.cwd());
  try {
    await quiet(['bun', 'run', 'check']);
    await quiet(['bun', 'test']);
    await quiet(['bun', 'run', 'build:dev']);
    const after = await snapshot('dist');
    const changed = [...new Set([...before.keys(), ...after.keys()])].filter(path => before.get(path) !== after.get(path));
    if (!changed.length || changed.some(path => !isPrivatePreview('/' + path))) throw new Error('Private build would alter public assets; deployment refused.');
    await mkdir('dist/private-preview', { recursive: true });
    await writeFile('dist/private-preview/revision.json', JSON.stringify({ revision: applied.revision, files: 2, assets: changed.filter(path => after.has(path)) }));
    console.info('Private preview built and checked; public assets are byte-identical. Source contents omitted.');
  } finally { await applied.restore(); }
}
