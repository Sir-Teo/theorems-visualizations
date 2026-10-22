import { createHash } from 'node:crypto';
const text = x => typeof x === 'string' && x.trim().length > 0;
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const strings = x => Array.isArray(x) && x.length > 0 && x.every(text) && new Set(x).size === x.length;
const canonical = x => Array.isArray(x) ? x.map(canonical) : object(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
export const digest = x => createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
export const reviewPath = path => typeof path === 'string' && /^docs\/coverage\/reviews\/orientation-[a-z0-9-]+\.md$/.test(path);
export function overviewDigest(data, domainIds) {
  const ids = new Set(domainIds), rows = data.catalog.overviews.filter(r => ids.has(r.domainId));
  const sources = new Set(rows.flatMap(r => r.sourceIds));
  const related = new Set(rows.flatMap(r => r.relatedDomainIds));
  return digest({ version: data.catalog.catalogVersion, purpose: data.catalog.purpose, framing: data.catalog.framing,
    rows, sources: data.sources.sources.filter(s => sources.has(s.id)),
    domains: data.registry.domains.filter(d => ids.has(d.id) || related.has(d.id)).map(d => ({ id: d.id, title: d.title, methods: d.methods, gaps: d.gaps, maintainerRole: d.stewardship.maintainerRole })),
    collectionLinks: data.collectionLinks.filter(m => ids.has(m.domainId)), pilotLinks: data.pilotLinks.filter(p => ids.has(p.domainId)) });
}
export function overviewArtifactDigest(data, hashes) {
  return digest({ content: overviewDigest(data, data.catalog.overviews.map(r => r.domainId)), hashes });
}
export function validateOverviews(data, artifactDigest) {
  const errors = [], check = (ok, message) => { if (!ok) errors.push(message); };
  if (!object(data) || !object(data.catalog) || !object(data.sources) || !object(data.registry)) return ['Missing orientation objects'];
  const { catalog, sources, registry } = data;
  for (const [name, rows] of Object.entries({ overviews: catalog.overviews, sources: sources.sources, domains: registry.domains, collectionLinks: data.collectionLinks, pilotLinks: data.pilotLinks })) {
    check(Array.isArray(rows) && rows.every(object), name + ': expected object array');
  }
  if (errors.length) return errors;
  check(catalog.schemaVersion === 1 && sources.schemaVersion === 1 && catalog.catalogVersion === '0.1.0', 'Unsupported orientation version');
  check(catalog.publication === 'local-preview', 'Only local orientation previews are supported');
  check(text(catalog.purpose) && text(catalog.framing), 'Missing editorial scope');
  const domains = new Set(registry.domains.map(d => d.id)), ids = new Set(catalog.overviews.map(r => r.domainId));
  check(catalog.overviews.length === 30 && ids.size === 30 && domains.size === 30 && [...domains].every(id => ids.has(id)), 'Expected each of the 30 domains exactly once');
  const sourceMap = new Map(sources.sources.map(s => [s.id, s]));
  check(sourceMap.size === sources.sources.length, 'Duplicate orientation source');
  check(Array.isArray(sources.unavailableCandidates) && sources.unavailableCandidates.every(object), 'Unavailable candidates must be an object array');
  for (const d of registry.domains) {
    check(text(d.title) && strings(d.methods) && text(d.stewardship?.maintainerRole) && Array.isArray(d.gaps) && d.gaps.every(g => object(g) && text(g.description)), d.id + ': malformed domain context');
  }
  for (const m of data.collectionLinks) check(domains.has(m.domainId) && /^[a-z0-9-]+$/.test(m.collectionId || '') && text(m.title) && ['primary', 'cross-listed', 'reference-only'].includes(m.relationship), 'Invalid collection link');
  for (const p of data.pilotLinks) check(domains.has(p.domainId) && /^x-[a-z0-9-]+-\d{4}$/.test(p.id || '') && text(p.title) && text(p.revision) && ['draft', 'in-review', 'accepted', 'withdrawn'].includes(p.status), 'Invalid pilot link');
  if (errors.length) return errors;
  for (const s of sources.sources) {
    check(text(s.id) && strings(s.domainIds) && s.domainIds.every(id => domains.has(id)), 'Source identity/domain mismatch');
    for (const key of ['title', 'publisher', 'edition', 'language', 'summary', 'limitations', 'reuse']) check(text(s[key]), s.id + ': missing ' + key);
    let safe = false; try { const u = new URL(s.url); safe = u.protocol === 'https:' && !u.username && !u.password; } catch {}
    check(safe, s.id + ': unsafe source URL');
    check(s.access?.status === 'body-read' && /^\d{4}-\d{2}-\d{2}$/.test(s.access?.checkedOn || '') && text(s.access?.locator), s.id + ': missing scoped body receipt');
    check(!sources.unavailableCandidates.some(c => c.url === s.url), s.id + ': unavailable candidate cannot support overview');
  }
  for (const r of catalog.overviews) {
    check(/^D(?:0[1-9]|[12][0-9]|30)$/.test(r.domainId) && /^\d+\.\d+\.\d+$/.test(r.revision || ''), 'Invalid overview identity/revision');
    check(text(r.summary), r.domainId + ': missing summary');
    for (const key of ['territory', 'questions', 'waysToExplore', 'boundaries', 'sourceIds', 'relatedDomainIds']) check(strings(r[key]), r.domainId + ': missing or repeated ' + key);
    check(object(r.representationGaps) && Object.keys(r.representationGaps).length === 3 && ['place', 'language', 'practice'].every(key => text(r.representationGaps[key])), r.domainId + ': representation gaps must be exactly place, language and practice');
    check(Array.isArray(r.relatedDomainIds) && r.relatedDomainIds.every(id => domains.has(id) && id !== r.domainId), r.domainId + ': unknown/self domain relation');
    check(Array.isArray(r.sourceIds) && r.sourceIds.every(id => Array.isArray(sourceMap.get(id)?.domainIds) && sourceMap.get(id).domainIds.includes(r.domainId)), r.domainId + ': unresolved or out-of-scope source');
    check(text(r.nextStep?.task) && text(r.nextStep?.preparation) && Array.isArray(r.sourceIds) && r.sourceIds.includes(r.nextStep?.sourceId), r.domainId + ': next step must use an inspected source');
    check(!('activity' in r) && !('accepted' in r) && !('prerequisiteItemIds' in r), r.domainId + ': orientation cannot claim lesson acceptance or prerequisite edges');
  }
  const review = catalog.review;
  check(object(review) && text(review.author) && ['in-review', 'reviewed-local'].includes(review.status) && Array.isArray(review.receipts), 'Invalid overview review state');
  if (errors.length) return errors;
  for (const r of review.receipts) {
    check(object(r) && ['source-content', 'engineering'].includes(r.dimension) && r.result === 'passed' && strings(r.domainIds) && r.domainIds.every(id => domains.has(id)), 'Malformed orientation review receipt');
    check(r?.reviewer?.kind === 'ai' && r.reviewer.independent === true && text(r.reviewer.id) && r.reviewer.id !== review.author, 'Independent AI reviewer required');
    check(/^[a-f0-9]{64}$/.test(r?.contentDigest || '') && reviewPath(r?.evidencePath) && /^\d{4}-\d{2}-\d{2}$/.test(r?.reviewedOn || ''), 'Invalid orientation evidence binding');
  }
  if (errors.length) return errors;
  if (review.status === 'reviewed-local') for (const id of domains) {
    const current = dimension => review.receipts.filter(r => r.dimension === dimension && r.domainIds.includes(id)).at(-1);
    const source = current('source-content'), engineering = current('engineering');
    for (const r of [source, engineering]) check(r && r.contentDigest === overviewDigest(data, r.domainIds), id + ': source or engineering review missing/stale');
    check(engineering && artifactDigest && engineering.artifactDigest === artifactDigest, id + ': artifact review missing/stale');
    check(source && engineering && source.reviewer.id !== engineering.reviewer.id, id + ': source and engineering reviewers must be separate');
  }
  return errors;
}
