// Isolated draft builder. Never invokes the production build or imports chapter modules.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadRegistry } from './lib.mjs';
import { validateExploration, contentDigest, textDigest, reviewArtifactDigest } from '../explorations/contract.mjs';
import { renderExploration, renderIndex } from '../explorations/render.mjs';

export const EXPLORATION_CODE = ['explorations/contract.mjs', 'explorations/route-state.mjs', 'explorations/render.mjs', 'explorations/ui.mjs', 'explorations/style.css', 'explorations/method-models.mjs', 'explorations/method-views.mjs', 'explorations/method-ui.mjs', 'explorations/water-ledger.mjs', 'explorations/reasoning-lab.mjs', 'explorations/profession-models.mjs', 'explorations/profession-views.mjs', 'explorations/profession-ui.mjs', 'explorations/practice-model.mjs', 'explorations/performance-model.mjs', 'explorations/studio-views.mjs', 'explorations/studio-ui.mjs', 'scripts/build-explorations.mjs'];
export async function explorationCodeHashes() {
  return Object.fromEntries(await Promise.all(EXPLORATION_CODE.map(async path => [path, textDigest(await readFile(resolve(ROOT, path), 'utf8'))])));
}
export async function loadExplorationSourceIds(root = ROOT) {
  const canonical = JSON.parse(await readFile(resolve(root, 'docs/coverage/sources.json'), 'utf8'));
  const supplemental = JSON.parse(await readFile(resolve(root, 'explorations/source-receipts.json'), 'utf8'));
  if (supplemental.schemaVersion !== 1 || !Array.isArray(supplemental.sources)) throw new Error('Invalid supplemental source register');
  const ids = canonical.sources.filter(s => ['body-read', 'table-read', 'file-read'].includes(s.access.status)).map(s => s.id);
  const used = new Set(canonical.sources.map(s=>s.id));
  for (const source of supplemental.sources) {
    if (!/^[a-z][a-z0-9-]+$/.test(source.id || '') || used.has(source.id)) throw new Error('Duplicate or invalid supplemental source identity');
    if (!/^docs\/pilots\/sequences\/preparation\/[a-z0-9-]+\.json$/.test(source.evidence?.path || '')) throw new Error('Unsafe supplemental source evidence path');
    const bytes = await readFile(resolve(root, source.evidence.path), 'utf8');
    if (textDigest(bytes) !== source.evidence.sha256) throw new Error('Supplemental source preparation changed: ' + source.id);
    const original = JSON.parse(bytes).sources?.find(s=>s.id === source.evidence.sourceId && s.url === source.url);
    if (!original || !['read', 'downloaded', 'body-read-and-local-html-snapshot'].includes(original.status || original.access)) throw new Error('Supplemental source lacks a read preparation record: ' + source.id);
    used.add(source.id); ids.push(source.id);
  }
  return ids;
}
export async function loadExplorations(root = ROOT) {
  const json = async p => JSON.parse(await readFile(resolve(root, p), 'utf8'));
  const manifest = await json('explorations/manifest.json');
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) throw new Error('Invalid exploration manifest');
  if (manifest.maxUnaccepted !== 2) throw new Error('Local authoring uses two drafts per batch');
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
  const context = { domainIds: coverage.domains.map(d => d.id), collectionIds: runtime.collections.map(c => c.id), sourceIds: await loadExplorationSourceIds() };
  const errors = runtime.problems.filter(p => p.level === 'error').map(p => p.msg);
  const codeHashes = await explorationCodeHashes();
  const collectionTitles = Object.fromEntries(runtime.collections.map(c => [c.id, c.title]));
  const artifactDigest = r => reviewArtifactDigest(r, codeHashes, collectionTitles);
  if (!checkCapacity(records, manifest.maxUnaccepted)) errors.push('More than two explorations await local author checks');
  for (const r of records) errors.push(...validateExploration(r, { ...context, artifactDigest: artifactDigest(r) }));
  if (errors.length) throw new Error(errors.join('\n'));
  for (const r of records.filter(r => r.status === 'accepted')) for (const review of [...r.reviews, ...(r.authorVerification ? [r.authorVerification] : [])]) {
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
