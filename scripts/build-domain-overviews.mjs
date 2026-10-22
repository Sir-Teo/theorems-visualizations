// Isolated orientation builder. Does not load chapters, change pilot artifacts or publish pages.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { ROOT } from './lib.mjs';
import { loadExplorations } from './build-explorations.mjs';
import { validateOverviews, overviewDigest, overviewArtifactDigest, reviewPath } from '../orientation/contract.mjs';
import { renderOverviewIndex, renderOverview } from '../orientation/render.mjs';
export const codePaths = ['orientation/contract.mjs', 'orientation/render.mjs', 'orientation/style.css', 'orientation/ui.mjs', 'scripts/build-domain-overviews.mjs'];
export async function readOrientation(root = ROOT) {
  const json = async p => JSON.parse(await readFile(resolve(root, p), 'utf8'));
  const { loadRegistry } = await import(pathToFileURL(resolve(root, 'scripts/lib.mjs')).href);
  const [catalog, sources, registry, runtime, { records }] = await Promise.all([
    json('docs/coverage/overviews.json'), json('docs/coverage/overview-sources.json'), json('docs/coverage/registry.json'), loadRegistry(), loadExplorations(root)
  ]);
  const problems = runtime.problems.filter(p => p.level === 'error');
  if (problems.length) throw new Error(problems.map(p => p.msg).join('\n'));
  const collectionLinks = registry.collectionMappings.map(m => ({ ...m, title: runtime.collections.find(c => c.id === m.collectionId)?.title }));
  if (collectionLinks.some(m => !m.title)) throw new Error('Orientation references missing collection metadata');
  const pilotLinks = records.flatMap(p => p.domainIds.map(domainId => ({ domainId, id: p.id, title: p.title, revision: p.revision, status: p.status })));
  return { catalog, sources, registry, collectionLinks, pilotLinks };
}
export async function orientationHashes(root = ROOT) {
  return Object.fromEntries(await Promise.all(codePaths.map(async p => [p, createHash('sha256').update(await readFile(resolve(root,p))).digest('hex')])));
}
export async function validateOverviewReviewFiles(data, root = ROOT) {
  const errors = [];
  if (!Array.isArray(data?.catalog?.review?.receipts)) return ['Orientation receipts must be an array'];
  for (const r of data.catalog.review.receipts) {
    if (!r || !reviewPath(r.evidencePath)) { errors.push('Unsafe orientation evidence path'); continue; }
    try {
      const body = await readFile(resolve(root, r.evidencePath), 'utf8');
      for (const hash of [r.contentDigest, ...(r.dimension === 'engineering' ? [r.artifactDigest] : [])]) {
        if (!/^[a-f0-9]{64}$/.test(hash || '') || !body.includes(hash)) errors.push('Orientation evidence does not name exact digest: ' + r.evidencePath);
      }
    } catch { errors.push('Missing orientation evidence: ' + r.evidencePath); }
  }
  return errors;
}
export async function buildDomainOverviews({ checkOnly = false, root = ROOT } = {}) {
  const data = await readOrientation(root), hashes = await orientationHashes(root), artifactDigest = overviewArtifactDigest(data, hashes);
  const errors = [...validateOverviews(data, artifactDigest), ...await validateOverviewReviewFiles(data, root)];
  if (errors.length) throw new Error(errors.join('\n'));
  const outputs = new Map([['labs/atlas/domains/index.html', renderOverviewIndex(data)]]);
  for (const r of data.catalog.overviews) outputs.set('labs/atlas/domains/' + r.domainId + '/index.html', renderOverview(data, r));
  const dirs = await readdir(resolve(root, 'labs/atlas/domains'), { withFileTypes: true }).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
  for (const d of dirs) if (d.isDirectory() && !data.catalog.overviews.some(r => r.domainId === d.name)) throw new Error('Unexpected orientation directory requires review: ' + d.name);
  for (const [path, html] of outputs) {
    if (checkOnly) {
      const current = await readFile(resolve(root, path), 'utf8');
      if (current !== html) throw new Error('Regenerate stale orientation: ' + path);
    } else { await mkdir(dirname(resolve(root, path)), { recursive: true }); await writeFile(resolve(root, path), html); }
  }
  return { pages: outputs.size, overviews: data.catalog.overviews.length, reviewStatus: data.catalog.review.status, contentDigest: overviewDigest(data, data.catalog.overviews.map(r => r.domainId)), artifactDigest, publication: data.catalog.publication };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await buildDomainOverviews({ checkOnly: process.argv.includes('--check') }), null, 2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
