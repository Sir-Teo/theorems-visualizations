// Isolated draft builder. Never invokes the production build or imports chapter modules.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadRegistry } from './lib.mjs';
import { validateExploration, contentDigest, textDigest, reviewArtifactDigest } from '../explorations/contract.mjs';
import { renderExploration, renderIndex } from '../explorations/render.mjs';

export async function loadExplorations(root = ROOT) {
  const json = async p => JSON.parse(await readFile(resolve(root, p), 'utf8'));
  const manifest = await json('explorations/manifest.json');
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) throw new Error('Invalid exploration manifest');
  if (manifest.maxUnaccepted !== 2) throw new Error('Changing review capacity requires an explicit contract review');
  const seen = new Set();
  for (const entry of manifest.entries) {
    if (!/^[a-z][a-z0-9-]*\.json$/.test(entry.file) || seen.has(entry.id)) throw new Error('Unsafe or duplicate exploration manifest entry');
    seen.add(entry.id);
  }
  const records = await Promise.all(manifest.entries.map(e => json('explorations/' + e.file)));
  records.forEach((r,i) => { if (r.id !== manifest.entries[i].id) throw new Error('Manifest/record identity mismatch'); });
  return { manifest, records };
}
export function checkCapacity(records, max = 2) {
  return records.filter(r => ['draft', 'in-review'].includes(r.status)).length <= max;
}
export async function buildExplorations({ checkOnly = false } = {}) {
  const [{ manifest, records }, runtime, coverage, receipts] = await Promise.all([
    loadExplorations(), loadRegistry(),
    readFile(resolve(ROOT, 'docs/coverage/registry.json'), 'utf8').then(JSON.parse),
    readFile(resolve(ROOT, 'docs/coverage/sources.json'), 'utf8').then(JSON.parse),
  ]);
  const context = { domainIds: coverage.domains.map(d => d.id), collectionIds: runtime.collections.map(c => c.id), sourceIds: receipts.sources.filter(s => ['body-read', 'table-read', 'file-read'].includes(s.access.status)).map(s => s.id) };
  const errors = runtime.problems.filter(p => p.level === 'error').map(p => p.msg);
  const codePaths = ['explorations/contract.mjs', 'explorations/route-state.mjs', 'explorations/render.mjs', 'explorations/ui.mjs', 'explorations/style.css', 'scripts/build-explorations.mjs'];
  const codeHashes = Object.fromEntries(await Promise.all(codePaths.map(async path => [path, textDigest(await readFile(resolve(ROOT, path), 'utf8'))])));
  const collectionTitles = Object.fromEntries(runtime.collections.map(c => [c.id, c.title]));
  const artifactDigest = r => reviewArtifactDigest(r, codeHashes, collectionTitles);
  if (!checkCapacity(records, manifest.maxUnaccepted)) errors.push('More than two explorations await independent acceptance');
  for (const r of records) errors.push(...validateExploration(r, { ...context, artifactDigest: artifactDigest(r) }));
  if (errors.length) throw new Error(errors.join('\n'));
  for (const r of records.filter(r => r.status === 'accepted')) for (const review of r.reviews) {
    if (!/^docs\/verification\/[a-z0-9/.-]+\.md$/.test(review.evidencePath) || review.evidencePath.includes('..')) throw new Error('Unsafe review receipt path');
    await readFile(resolve(ROOT, review.evidencePath), 'utf8');
  }
  const outputs = new Map([['labs/atlas/index.html', renderIndex(records)]]);
  for (const r of records) outputs.set('labs/atlas/' + r.id + '/index.html', renderExploration(r, collectionTitles));
  // Unexpected old draft directories are reported, never silently deleted.
  const dirs = await readdir(resolve(ROOT, 'labs/atlas'), { withFileTypes: true }).catch(() => []);
  for (const dir of dirs) if (dir.isDirectory() && dir.name.startsWith('x-') && !records.some(r => r.id === dir.name)) throw new Error('Stale draft directory requires explicit review: ' + dir.name);
  for (const [path, html] of outputs) {
    const absolute = resolve(ROOT, path);
    if (checkOnly) {
      const current = await readFile(absolute, 'utf8').catch(() => '');
      if (current !== html) throw new Error('Regenerate stale preview: ' + path);
    } else { await mkdir(dirname(absolute), { recursive: true }); await writeFile(absolute, html); }
  }
  return { pages: outputs.size, records: records.map(r => ({ id: r.id, revision: r.revision, digest: contentDigest(r), artifactDigest: artifactDigest(r), status: r.status })) };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await buildExplorations({ checkOnly: process.argv.includes('--check') }), null, 2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
