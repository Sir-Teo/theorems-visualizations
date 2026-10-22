// Planning-only validation. Never imports chapters, syllabi, accepted manifests or build outputs.
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadRegistry } from './lib.mjs';

// Pin the selected editions, including every residual code. Changing an inventory
// requires an explicit edition review, not merely deleting both sides of a crosswalk.
const INVENTORIES = {
  'isced-f': [149, '267cdcbdf00d0f6f9d4d3b2c339c82d35d497c498e75d85cf06363b1ac2584f1'],
  ford: [42, 'c0ef8b4c356db45010e0b39672725e28f208eea9fc0c41a2f71c5022d9481cf6'],
  lcc: [21, '23ca713b60fe4255fd0595ca55abd6331f03900b2ae9fb22919901eb0521e251'],
  ich: [5, '2d6c0c2c0403dc1c55112e6f65c137c7e141679c90513055c8b135e254723d04'],
};
const METHODS = new Set(['proof', 'model', 'experiment', 'observation', 'argument', 'trace',
  'design', 'practice', 'map', 'case', 'source-comparison', 'annotation', 'performance']);
const ACCESS = new Set(['body-read', 'table-read', 'file-read', 'metadata-read', 'indexed-only', 'blocked']);
const BODY = new Set(['body-read', 'table-read', 'file-read']);
const nonempty = (x) => typeof x === 'string' && x.trim().length > 0;
const sha = (codes) => createHash('sha256').update([...codes].sort().join('\n')).digest('hex');
const unique = (xs) => new Set(xs).size === xs.length;

/** Pure checks used by CLI and mutation tests. Returns errors rather than modifying data. */
export function validateCoverage({ registry, inventory, sources, pilots }, runtimeIds, fieldCount = 13) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  for (const [name, value] of Object.entries({ registry, inventory, sources, pilots }))
    check(value?.schemaVersion === 1, name + ': unsupported schemaVersion');
  const lists = [
    ['domains', registry?.domains], ['collectionMappings', registry?.collectionMappings],
    ['crosswalks', registry?.crosswalks], ['schemes', inventory?.schemes],
    ['sources', sources?.sources], ['pilots', pilots?.pilots],
  ];
  for (const [name, value] of lists) check(Array.isArray(value) && value.every(x => x && typeof x === 'object'), name + ': expected object array');
  if (errors.length) return errors;
  const { domains, collectionMappings, crosswalks } = registry;
  const schemes = inventory.schemes, sourceRows = sources.sources, pilotRows = pilots.pilots;
  const domainIds = new Set(domains.map(x => x.id));
  const sourceIds = new Set(sourceRows.map(x => x.id));
  const pilotIds = new Set(pilotRows.map(x => x.id));
  const runtime = new Set(runtimeIds);
  const refs = (xs, set, label, allowEmpty = false) => {
    check(Array.isArray(xs) && (allowEmpty || xs.length > 0), label + ': missing reference list');
    if (!Array.isArray(xs)) return;
    check(unique(xs), label + ': duplicate reference');
    for (const x of xs) check(set.has(x), label + ': unknown reference ' + x);
  };
  check(registry.registryVersion === '0.2.0', 'registryVersion: update validator when migrating contract');
  check(nonempty(registry.purpose) && nonempty(registry.countingPolicy), 'registry: missing scope/counting policy');
  check(domains.length === 30 && domainIds.size === 30, 'domains: expected 30 unique domains');
  for (let i = 1; i <= 30; i++) check(domainIds.has('D' + String(i).padStart(2, '0')), 'domains: missing D' + String(i).padStart(2, '0'));
  check(registry.baseline?.collectionCount === runtime.size, 'baseline: runtime collection count drift');
  check(registry.baseline?.fieldCount === fieldCount, 'baseline: runtime field count drift');
  check(registry.baseline?.domainCount === domains.length, 'baseline: domain count drift');
  check(registry.baseline?.pilotCount === pilotRows.length, 'baseline: pilot count drift');
  check(sourceIds.size === sourceRows.length, 'sources: duplicate ID');
  for (const s of sourceRows) {
    check(nonempty(s.id) && nonempty(s.title) && nonempty(s.locator), 'source: missing identity or locator');
    try { check(new URL(s.url).protocol === 'https:', s.id + ': source URL must use https'); } catch { check(false, s.id + ': invalid source URL'); }
    check(ACCESS.has(s.access?.status), s.id + ': unknown access state');
    check(nonempty(s.access?.checkedOn) && nonempty(s.access?.scope), s.id + ': missing access receipt');
    check(nonempty(s.rights?.plan), s.id + ': missing rights plan');
    if (s.access?.status === 'blocked') check(nonempty(s.stop?.reason) && nonempty(s.stop?.action), s.id + ': missing stop receipt');
    if (s.sha256) check(/^[a-f0-9]{64}$/.test(s.sha256), s.id + ': malformed source hash');
  }
  for (const d of domains) {
    for (const key of ['title', 'scope', 'bibliographyStatus']) check(nonempty(d[key]), d.id + ': missing ' + key);
    for (const key of ['aliases', 'exclusions', 'essentialQuestions', 'explorationIdeas'])
      check(Array.isArray(d[key]) && d[key].length > 0 && d[key].every(nonempty), d.id + ': missing ' + key);
    refs(d.methods, METHODS, d.id + ' methods');
    refs(d.sourceIds, sourceIds, d.id + ' sources');
    refs(d.pilotIds, pilotIds, d.id + ' pilots', true);
    check(Array.isArray(d.gaps) && d.gaps.length > 0 && d.gaps.every(x => nonempty(x.id) && nonempty(x.description) && x.status === 'open'), d.id + ': gaps must remain explicit');
    check(Array.isArray(d.candidateCollections) && d.candidateCollections.length > 0 && d.candidateCollections.every(x => nonempty(x.id) && nonempty(x.title) && x.status === 'proposal' && x.runtimeCollectionId === null), d.id + ': candidate cannot become a runtime collection through planning metadata');
    check(d.coverage?.orientation === 'planned' && d.coverage?.introductory === 'not-assessed' && d.coverage?.advanced === 'not-assessed' && d.coverage?.productionAcceptance === 'not-tracked-here', d.id + ': planning metadata cannot claim production acceptance');
    for (const key of ['place', 'language', 'practice']) check(nonempty(d.representationGaps?.[key]), d.id + ': missing representation gap ' + key);
    check(nonempty(d.stewardship?.maintainerRole) && d.stewardship?.assignee === null && d.stewardship?.reviewStatus === 'unreviewed' && nonempty(d.stewardship?.lastDeskReview) && nonempty(d.stewardship?.nextReviewTrigger), d.id + ': stewardship must distinguish proposed role from appointed reviewer');
  }
  const primary = new Map(), pairs = new Set();
  for (const m of collectionMappings) {
    check(runtime.has(m.collectionId), 'collection mapping: unknown collection ' + m.collectionId);
    check(domainIds.has(m.domainId), 'collection mapping: unknown domain ' + m.domainId);
    check(['primary', 'cross-listed', 'reference-only'].includes(m.relationship), 'collection mapping: invalid relationship');
    check(nonempty(m.rationale), 'collection mapping: missing rationale');
    const pair = m.collectionId + ':' + m.domainId;
    check(!pairs.has(pair), 'collection mapping: duplicate pair ' + pair); pairs.add(pair);
    if (m.relationship === 'primary') {
      check(!primary.has(m.collectionId), 'collection mapping: duplicate primary ' + m.collectionId);
      primary.set(m.collectionId, m.domainId);
    }
  }
  for (const id of runtime) check(primary.has(id), 'collection mapping: missing primary ' + id);
  check(unique(schemes.map(x => x.id)) && schemes.length === 4, 'inventory: expected four unique schemes');
  const schemeMap = new Map(schemes.map(x => [x.id, x]));
  for (const [id, [count, hash]] of Object.entries(INVENTORIES)) {
    const s = schemeMap.get(id);
    check(!!s, 'inventory: missing ' + id);
    if (!s) continue;
    check(Array.isArray(s.codes) && s.codes.every(nonempty), id + ': invalid code list');
    if (!Array.isArray(s.codes)) continue;
    check(unique(s.codes) && s.codes.length === count && s.expectedCount === count, id + ': inventory count or duplicate mismatch');
    check(sha(s.codes) === hash && s.codesSha256 === hash, id + ': pinned inventory hash mismatch');
    check(sourceIds.has(s.sourceId) && nonempty(s.edition) && nonempty(s.level), id + ': missing source, edition or scope');
  }
  const seen = new Set();
  for (const c of crosswalks) {
    const key = c.schemeId + ':' + c.code, s = schemeMap.get(c.schemeId);
    check(!!s && s.codes?.includes(c.code), 'crosswalk: unknown category ' + key);
    check(!seen.has(key), 'crosswalk: duplicate category ' + key); seen.add(key);
    check(['mapped', 'review', 'excluded'].includes(c.disposition), key + ': invalid disposition');
    refs(c.domainIds, domainIds, key + ' domains', c.disposition === 'excluded');
    if (c.disposition === 'excluded') check(c.domainIds?.length === 0, key + ': excluded category cannot claim domains');
    check(nonempty(c.rationale), key + ': missing mapping rationale');
  }
  for (const s of schemes) for (const code of s.codes || []) check(seen.has(s.id + ':' + code), 'crosswalk: missing category ' + s.id + ':' + code);
  check(pilotRows.length === 8 && pilotIds.size === 8, 'pilots: expected eight unique briefs');
  for (let i = 1; i <= 8; i++) check(pilotIds.has('P0' + i), 'pilots: missing P0' + i);
  for (const p of pilotRows) {
    check(nonempty(p.title) && /^docs\/pilots\/0[1-8]-[a-z-]+\.md$/.test(p.briefPath), p.id + ': invalid brief path/title');
    refs(p.domainIds, domainIds, p.id + ' domains');
    refs(p.sourceIds, sourceIds, p.id + ' sources');
    refs(p.relatedCollectionIds, runtime, p.id + ' related collections');
    check(Array.isArray(p.prerequisiteItemIds) && p.prerequisiteItemIds.length === 0, p.id + ': exact prerequisites require a separate accepted-item audit');
    const prototype = ['prototype', 'reviewed-local'].includes(p.status);
    check(['researched-with-gates', 'prototype', 'reviewed-local'].includes(p.status) && p.authored === prototype && p.accepted === false, p.id + ': research or prototype cannot claim accepted production status or inconsistent authorship');
    if (p.status === 'reviewed-local') check(p.localReviewStatus === 'accepted' && /^\d+\.\d+\.\d+$/.test(p.reviewedRevision), p.id + ': local review must name its state and revision');
    check(p.rightsStatus === (prototype ? 'prototype-text-scoped' : 'scoped-plan-not-asset-clearance'), p.id + ': source reading is not unrestricted asset clearance');
    if (prototype) check(/^labs\/atlas\/x-[a-z0-9-]+\/index\.html$/.test(p.prototypePath) && /^explorations\/[a-z-]+\.json$/.test(p.contentPath), p.id + ': prototype must name actual content and preview paths');
    check(Array.isArray(p.openGates) && p.openGates.length > 0 && p.openGates.every(nonempty) && nonempty(p.nextAction), p.id + ': missing publication gates');
    check(Array.isArray(p.reviewers) && p.reviewers.length > 0 && p.reviewers.every(x => nonempty(x.role) && x.assignee === null && x.status === 'unassigned'), p.id + ': reviewer role is not an assignment or approval');
    check(Array.isArray(p.contexts) && p.contexts.length > 0 && p.contexts.every(nonempty), p.id + ': missing cultural/temporal scope');
    check(Array.isArray(p.sourceLanguagesInspected) && p.sourceLanguagesInspected.length > 0 && p.sourceLanguagesInspected.every(x => /^[a-z]{2,3}$/.test(x)), p.id + ': invalid source-language list');
    const used = sourceRows.filter(s => p.sourceIds?.includes(s.id));
    check(used.some(s => BODY.has(s.access?.status)), p.id + ': needs at least one directly inspected source');
    check(!used.some(s => s.access?.status === 'blocked'), p.id + ': blocked source cannot support pilot claims');
    for (const d of domains) check((p.domainIds?.includes(d.id) || false) === (d.pilotIds?.includes(p.id) || false), p.id + ': asymmetric domain link ' + d.id);
  }
  check(pilotRows.filter(p => p.status === 'prototype').length <= 2, 'pilots: at most two unaccepted prototypes');
  return errors;
}

export async function readCoverage(root = ROOT) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [registry, inventory, sources, pilots] = await Promise.all([
    read('docs/coverage/registry.json'), read('docs/coverage/classification-inventory.json'),
    read('docs/coverage/sources.json'), read('docs/pilots/pilots.json'),
  ]);
  return { registry, inventory, sources, pilots };
}

export async function validateBriefFiles(data, root = ROOT) {
  const errors = [];
  for (const p of data.pilots.pilots) {
    if (typeof p.briefPath !== 'string') { errors.push('Missing brief path'); continue; }
    const path = resolve(root, p.briefPath), rel = relative(root, path);
    if (isAbsolute(rel) || rel.startsWith('..')) { errors.push(p.id + ': brief escapes repository'); continue; }
    try { await access(path); } catch { errors.push(p.id + ': brief file missing: ' + p.briefPath); continue; }
    const text = await readFile(path, 'utf8');
    for (const id of p.sourceIds) if (!text.includes('`' + id + '`')) errors.push(p.id + ': source receipt missing from brief: ' + id);
    for (const heading of ['## Reader task', '## Acceptance checks', '## Rights, review'])
      if (!text.includes(heading)) errors.push(p.id + ': missing brief section ' + heading);
    if (p.status === 'prototype') for (const target of [p.prototypePath, p.contentPath, p.sourceResolutionPath]) {
      if (typeof target !== 'string' || !/^(labs\/atlas\/|explorations\/|docs\/pilots\/research\/)[a-z0-9/.-]+$/.test(target) || target.includes('..')) { errors.push(p.id + ': unsafe/missing prototype reference'); continue; }
      try { await access(resolve(root, target)); } catch { errors.push(p.id + ': prototype reference missing: ' + target); }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [data, runtime] = await Promise.all([readCoverage(), loadRegistry()]);
    const errors = runtime.problems.filter(x => x.level === 'error').map(x => x.where + ': ' + x.msg);
    errors.push(...validateCoverage(data, runtime.collections.map(x => x.id), runtime.fields.length));
    errors.push(...await validateBriefFiles(data));
    if (errors.length) {
      console.error(errors.map(x => '- ' + x).join('\n')); process.exitCode = 1;
    } else {
      const dispositions = Object.fromEntries(['mapped', 'review', 'excluded'].map(k => [k, data.registry.crosswalks.filter(x => x.disposition === k).length]));
      console.log(JSON.stringify({ result: 'PASS', domains: data.registry.domains.length,
        primaryCollections: data.registry.collectionMappings.filter(x => x.relationship === 'primary').length,
        crossListings: data.registry.collectionMappings.filter(x => x.relationship === 'cross-listed').length,
        classificationEntries: data.registry.crosswalks.length, dispositions,
        sourceReceipts: data.sources.sources.length, pilotBriefs: data.pilots.pilots.length,
        scope: 'Planning structure only; no production or specialist acceptance asserted.' }, null, 2));
    }
  } catch (error) { console.error('Coverage validation failed: ' + error.message); process.exitCode = 1; }
}
