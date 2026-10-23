// Read-only checks for editorial plans. This does not build or release a journey.
import { readFile, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadAll } from './lib.mjs';
import { digest, selectFrozenIdeas } from './static-ideas.mjs';
import { editionPath, validateBundle } from './exploration-editions.mjs';

const insist = (ok, message) => { if (!ok) throw new Error(message); };
const text = x => typeof x === 'string' && x.trim().length > 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const unique = (xs, label) => {
  insist(Array.isArray(xs) && xs.every(text) && new Set(xs).size === xs.length, 'Duplicate or invalid ' + label);
  return xs;
};
export const JOURNEY_AUTHOR_CODE = ['journeys/reader.mjs','journeys/style.css','scripts/build-journeys.mjs','scripts/check-journey-plans.mjs'];
export function journeyAuthorDigest(plans,sources,targets) { const {authorVerification,...content}=plans; return digest({plans:content,sources,targets}); }
export async function journeyAuthorCodeDigest() { return digest(Object.fromEntries(await Promise.all(JOURNEY_AUTHOR_CODE.map(async path=>[path,digest(await readFile(join(ROOT,path),'utf8'))])))); }
const read = async path => JSON.parse(await readFile(join(ROOT, path), 'utf8'));
export async function loadJourneyContext() {
  const accepted = await read('static-pages/accepted.json');
  const frozen = selectFrozenIdeas(await loadAll(), accepted);
  const manifest = await read('editions/manifest.json'), bundles = new Map();
  const targets=await read('docs/journeys/targets.json');
  for (const target of targets.targets.filter(t=>t.kind==='locally-accepted-exploration')) {
    const id=target.id,entry=manifest.bundles.find(x => x.id === id && x.revision === target.revision);
    insist(entry && entry.path === `editions/bundles/${id}/${entry.revision}.json`, 'Expected retained edition missing');
    const bundle = await read(entry.path);
    insist(/^[a-f0-9]{64}$/.test(bundle.runtimeDigest), 'Invalid retained runtime identity');
    const runtime = await read(`editions/runtimes/${bundle.runtimeDigest}.json`);
    validateBundle(bundle, runtime, entry);
    bundles.set(id, { entry, bundle });
  }
  const plans=await read('docs/journeys/plans.json');
  if(plans.authorVerification){
    const path=plans.authorVerification.evidencePath;
    insist(/^docs\/verification\/[a-z0-9-]+\.md$/.test(path||''),'Unsafe journey author evidence path');
    const actual=await realpath(join(ROOT,path));
    insist(actual.startsWith(await realpath(ROOT)+'/'),'Journey author evidence escapes checkout');
    insist((await readFile(actual,'utf8')).trim().length>0,'Journey author evidence empty');
  }
  return {
    accepted, legacy: new Map(frozen.selected.map(x => [x.item.id, x])), bundles,
    domains: (await read('docs/coverage/registry.json')).domains.map(d => d.id),
    retained: await read('docs/pilots/sequences/sources.json'), authorArtifactDigest: await journeyAuthorCodeDigest(),
  };
}
export function validateJourneyPlans(plans, sources, targets, context) {
  insist(plans?.schemaVersion === 1 && ['0.1.0','0.2.0'].includes(plans.version) && text(plans.author) && text(plans.scope), 'Unsupported journey planning contract');
  insist(sources?.schemaVersion === 1 && targets?.schemaVersion === 1, 'Unsupported source or target contract');
  insist(targets.acceptedCommit === context.accepted.acceptedCommit && targets.snapshotDigest === context.accepted.snapshotDigest, 'Accepted snapshot binding changed');
  unique(targets.targets.map(t => t.id), 'target IDs');
  const byTarget = new Map();
  for (const t of targets.targets) {
    if (t.kind === 'legacy-accepted') {
      const p = context.legacy.get(t.id);
      insist(p && !p.item.verify && t.projectionDigest === digest(p), 'Legacy target absent, flagged or changed: ' + t.id);
      insist(t.title === p.item.name && t.href === `ideas/${t.id}/` && same(t.declaredPrerequisites, p.item.deps || []), 'Legacy title, path or prerequisite mismatch: ' + t.id);
    } else {
      insist(t.kind === 'locally-accepted-exploration', 'Unknown target kind');
      const x = context.bundles.get(t.id);
      insist(x && x.bundle.record.status === 'accepted', 'Exploration not locally accepted: ' + t.id);
      const { entry, bundle } = x;
      insist(t.bundlePath === entry.path && t.bundleSha256 === entry.sha256 && t.revision === entry.revision, 'Edition binding changed: ' + t.id);
      insist(t.title === bundle.record.title && t.href === editionPath(t.id, t.revision) && same(t.declaredPrerequisites, bundle.record.prerequisites), 'Edition title, path or prerequisite mismatch: ' + t.id);
    }
    byTarget.set(t.id, t);
  }
  unique(sources.sources.map(s => s.id), 'source IDs');
  const bySource = new Map(sources.sources.map(s => [s.id, s]));
  insist(Array.isArray(sources.stoppedCandidates), 'Missing access-stop record');
  const stopped = new Set(sources.stoppedCandidates.map(s => s.url));
  for (const s of sources.sources) {
    insist(['body-read-scoped', 'retained-scoped-receipt'].includes(s.access) && !stopped.has(s.url), 'Unread or stopped source used: ' + s.id);
    const url = new URL(s.url);
    insist(url.protocol === 'https:' && !url.username && !url.password, 'Invalid source URL');
    for (const key of ['title', 'creator', 'edition', 'readAt', 'locator', 'finding', 'limits', 'reuse']) insist(text(s[key]), 'Missing source scope: ' + key);
    if (s.access === 'retained-scoped-receipt') {
      const ref = s.retainedRecord;
      insist(ref?.path === 'docs/pilots/sequences/sources.json', 'Unknown retained source path');
      const old = context.retained.sources.find(x => x.id === ref.id);
      insist(old && ref.sha256 === digest(old) && old.urls.includes(s.url) && s.readAt === old.readAt, 'Retained source receipt changed');
    }
  }
  unique(plans.routes.map(r => r.id), 'route IDs');
  insist(same(plans.routes.map(r => r.id), ['water-city', 'woven-cloth', 'account-evidence']), 'Unexpected route inventory');
  const usedTargets = new Set(), usedSources = new Set();
  let lessonStops = 0, readingStops = 0, gapStops = 0, transitions = 0;
  for (const r of plans.routes) {
    insist(r.published === false && (r.status === 'research-prepared' && r.acceptedJourney === false || plans.authorVerification?.kind === 'author-check' && r.status === 'accepted-local' && r.acceptedJourney === true), 'Research does not grant acceptance or publication');
    for (const key of ['title', 'scope', 'outcome', 'transfer']) insist(text(r[key]), 'Missing route ' + key);
    insist(Array.isArray(r.gaps) && r.gaps.length > 0 && r.gaps.every(text), 'Route gaps must remain explicit');
    unique(r.steps.map(s => s.id), 'step IDs');
    const byStep = new Map(r.steps.map(s => [s.id, s]));
    for (const s of r.steps) {
      for (const key of ['title', 'question', 'task', 'check', 'limit', 'entrySupport']) insist(text(s[key]), 'Missing step ' + key);
      insist(!Object.hasOwn(s, 'href'), 'Steps resolve paths through accepted targets only');
      unique(s.domainIds, 'step domains');
      insist(s.domainIds.length && s.domainIds.every(d => context.domains.includes(d)), 'Unknown domain');
      unique(s.sourceIds, 'step sources');
      for (const id of s.sourceIds) { insist(bySource.has(id), 'Unknown source: ' + id); usedSources.add(id); }
      if (s.kind === 'accepted-lesson') {
        insist(byTarget.has(s.targetId), 'Unknown or unaccepted lesson target: ' + s.targetId);
        usedTargets.add(s.targetId); lessonStops++;
      } else {
        insist(['external-reading', 'gap'].includes(s.kind) && s.targetId === null, 'Reading or gap must not invent a lesson');
        if (s.kind === 'external-reading') { insist(s.sourceIds.length > 0, 'Reading requires an inspected source'); readingStops++; }
        else { insist(s.sourceIds.length === 0, 'Gap is not an available reading step'); gapStops++; }
      }
    }
    insist(r.transitions.length === r.steps.length - 1, 'Every sequence transition needs an explicit limit');
    for (const [i, e] of r.transitions.entries()) {
      insist(byStep.has(e.fromStep) && byStep.has(e.toStep) && e.fromStep === r.steps[i].id && e.toStep === r.steps[i + 1].id, 'Transition differs from sequence');
      // v1 only sequences comparisons. New evidential/prerequisite edges need a separately reviewed contract.
      insist(['analogy', 'question-shift'].includes(e.kind), 'Evidence/prerequisite edges are not authorized by this research contract');
      insist(text(e.reason) && text(e.limit) && text(plans.relationTypes[e.kind]), 'Missing transition rationale or limit'); transitions++;
    }
  }
  insist(usedTargets.size === byTarget.size && usedSources.size === bySource.size, 'Unused targets or sources inflate the inventory');
  if(plans.authorVerification!==undefined){const v=plans.authorVerification;insist(v.kind==='author-check' && v.author===plans.author && v.scope==='local-preview' && /^\d{4}-\d{2}-\d{2}$/.test(v.checkedOn||'') && v.contentDigest===journeyAuthorDigest(plans,sources,targets) && v.artifactDigest===context.authorArtifactDigest && /^docs\/verification\/[a-z0-9-]+\.md$/.test(v.evidencePath||''),'Journey author verification missing/stale');}
  return { routes: plans.routes.length, steps: lessonStops + readingStops + gapStops, lessonStops, uniqueAcceptedTargets: usedTargets.size, externalReadingStops: readingStops, gapStops, transitions, sources: usedSources.size, stoppedCandidates: stopped.size, newLessons: 0, acceptedJourneys: plans.routes.filter(r=>r.acceptedJourney).length, publishedJourneys: 0 };
}
export async function checkJourneyPlans() {
  const [plans, sources, targets, context] = await Promise.all([
    read('docs/journeys/plans.json'), read('docs/journeys/sources.json'), read('docs/journeys/targets.json'), loadJourneyContext(),
  ]);
  return validateJourneyPlans(plans, sources, targets, context);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await checkJourneyPlans(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
