// Compose only into a fresh output outside the checkout. All prior source files remain read only.
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './lib.mjs';
import { loadJourneyContext, validateJourneyPlans } from './check-journey-plans.mjs';
import { prepareNavigation, buildDomainNavigation, inventory } from './build-domain-navigation.mjs';
import { JOURNEY_CODE, PLAN_FILES, hash, json, researchDigest, resolveJourneyReleases, deliveredTargets, renderJourneys, attachJourneyNavigation } from '../journeys/reader.mjs';

const read = async p => JSON.parse(await readFile(join(ROOT, p), 'utf8'));
const readEvidence = p => {
  const real = realpathSync(join(ROOT, p));
  if (!real.startsWith(realpathSync(ROOT) + '/')) throw new Error('Journey evidence escapes checkout');
  return readFileSync(real, 'utf8');
};
export async function journeyBinding(navigation) {
  const files = { ...navigation.binding.files };
  for (const p of [...JOURNEY_CODE, ...PLAN_FILES, 'navigation/releases.json']) files[p] = hash(await readFile(join(ROOT, p)));
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
  return { digest: hash(json(sorted)), files: sorted, navigationDigest: navigation.binding.digest };
}
export async function prepareJourneys({ mode = 'preview', base = null } = {}) {
  const navigation = await prepareNavigation({ mode, base }); base = navigation.base;
  const [plans, sources, targets, context, ledger] = await Promise.all([
    read('docs/journeys/plans.json'), read('docs/journeys/sources.json'), read('docs/journeys/targets.json'), loadJourneyContext(), read('journeys/releases.json'),
  ]);
  const counts = validateJourneyPlans(plans, sources, targets, context), data = { plans, sources, targets }, binding = await journeyBinding(navigation);
  const entries = mode === 'preview' ? plans.routes.map(r => ({ id: r.id, revision: plans.version, state: 'preview' })) : resolveJourneyReleases(ledger, data, { deliveryDigest: binding.digest, base, readEvidence });
  return { data, counts, context, navigation, binding, entries, mode, base };
}
export async function buildJourneys({ out, mode = 'preview', base = null } = {}) {
  const p = await prepareJourneys({ mode, base }); base = p.base;
  const predecessor = await buildDomainNavigation({ out, mode, base }), output = predecessor.output;
  if (predecessor.navigationDigest !== p.binding.navigationDigest) throw new Error('Navigation input binding changed during journey assembly');
  const before = await inventory(output), staticBuild = JSON.parse(await readFile(join(output, 'static-build.json'), 'utf8'));
  if (staticBuild.acceptedCommit !== p.context.accepted.acceptedCommit || staticBuild.snapshotDigest !== p.context.accepted.snapshotDigest) throw new Error('Delivered legacy snapshot differs from journey targets');
  const editions = JSON.parse(await readFile(join(output, 'explore/catalog.json'), 'utf8'));
  if (json(editions) !== json(p.navigation.catalog)) throw new Error('Delivered edition catalog changed during journey assembly');
  const legacyIds = p.context.accepted.ids.filter(id => Object.hasOwn(before, `ideas/${id}/index.html`));
  const availability = deliveredTargets(p.data.targets, { mode, legacyIds, editions });
  for (const t of p.data.targets.targets) if (availability.get(t.id) === 'available' && !Object.hasOwn(before, t.href + 'index.html')) throw new Error('Declared available target has no delivered page: ' + t.id);
  const domainCatalog = before['domains/catalog.json'] ? JSON.parse(await readFile(join(output, 'domains/catalog.json'), 'utf8')) : { domains: [] };
  const rendered = renderJourneys(p.data, p.entries, availability, { mode, base, domains: domainCatalog.domains });
  const writes = new Map(rendered.outputs);
  if (rendered.retainedCount) writes.set('assets/journeys/reader.css', await readFile(join(ROOT, 'journeys/style.css'), 'utf8'));
  const generatedFiles = [];
  for (const [path, bytes] of writes) {
    if (await lstat(join(output, path)).catch(e => { if (e.code === 'ENOENT') return null; throw e; })) throw new Error('Journey output collision: ' + path);
    await mkdir(dirname(join(output, path)), { recursive: true }); await writeFile(join(output, path), bytes, { flag: 'wx' }); generatedFiles.push({ path, sha256: hash(bytes) });
  }
  const replacements = [];
  if (rendered.retainedCount) for (const path of ['index.html', 'ideas/index.html', 'explore/index.html', 'domains/index.html', 'explore/notebooks/index.html']) {
    if (!Object.hasOwn(before, path)) continue;
    const original = await readFile(join(output, path), 'utf8'), adapted = attachJourneyNavigation(path, original);
    await writeFile(join(output, path), adapted); replacements.push({ path, beforeSha256: hash(original), afterSha256: hash(adapted) });
  }
  if (rendered.canonicalPaths.length) {
    const original = await readFile(join(output, 'sitemap.xml'), 'utf8');
    if (original.split('</urlset>').length !== 2) throw new Error('Unknown journey sitemap adapter');
    const xml = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
    const adapted = original.replace('</urlset>', rendered.canonicalPaths.map(path => `<url><loc>${xml(base + path)}</loc></url>`).join('') + '</urlset>');
    await writeFile(join(output, 'sitemap.xml'), adapted); replacements.push({ path: 'sitemap.xml', beforeSha256: hash(original), afterSha256: hash(adapted) });
  }
  const after = await inventory(output), allowed = new Set(replacements.map(r => r.path));
  for (const [path, sha] of Object.entries(before)) if (!allowed.has(path) && after[path] !== sha) throw new Error('Unrelated candidate changed: ' + path);
  const final = await prepareJourneys({ mode, base });
  if (final.binding.digest !== p.binding.digest || json(final.entries) !== json(p.entries)) throw new Error('Journey inputs or release evidence changed during assembly');
  const report = {
    schemaVersion: 1, mode, canonicalBase: base, acceptedLegacyCommit: staticBuild.acceptedCommit, legacyIdeas: staticBuild.items,
    planVersion: p.data.plans.version, researchDigest: researchDigest(p.data), deliveryDigest: p.binding.digest, deliveryFiles: p.binding.files,
    navigationDigest: predecessor.navigationDigest, availableJourneys: rendered.availableCount, retainedJourneys: rendered.retainedCount,
    canonicalJourneyPages: rendered.canonicalPaths.length, newLessons: 0, generatedFiles, replacements,
    generatedDigest: hash(json({ generatedFiles, replacements })), preexistingFilesPreserved: Object.keys(before).length - replacements.length,
    scope: 'Local composed candidate. Prior build reports describe their stages before these explicit navigation additions. No real release, new lesson acceptance, human observations or private-store reads/writes.'
  };
  await writeFile(join(output, 'journey-build.json'), json(report)); return { ...report, output };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = {};
    while (args.length) { const flag = args.shift(); if (flag === '--out') options.out = args.shift(); else if (flag === '--mode') options.mode = args.shift(); else if (flag === '--base-url') options.base = args.shift(); else throw new Error('Unknown argument ' + flag); }
    console.log(json(await buildJourneys(options)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
