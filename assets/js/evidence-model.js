// Shared, browser-safe sidecar contract. Evidence metadata never enters the prerequisite graph.
export const LEGACY_EVIDENCE_ID = /^[a-z][a-z0-9]{1,7}-\d{1,2}(?:\.\d{1,3}){1,2}[a-z]?$/;
export const EVIDENCE_MAX_CHARS = 500000;
const sha = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const text = (x, max = 4000) => typeof x === 'string' && x.trim().length > 0 && x.length <= max;
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const unique = xs => new Set(xs).size === xs.length;
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().slice(0, 10) === x;
const only = (value, keys) => Object.keys(value).every(k => keys.includes(k));
const dimensions = ['content', 'rights', 'provenance', 'language', 'accessibility', 'learning'];
export function canonicalEvidence(value) {
  if (Array.isArray(value)) return '[' + value.map(x => canonicalEvidence(x) ?? 'null').join(',') + ']';
  if (object(value)) return '{' + Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonicalEvidence(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export function evidenceContent(record) {
  const { reviews, ...content } = record;
  return content;
}
export function legacyEvidenceSnapshot(item, collection) {
  return {
    id: item.id, title: item.name, kind: item.kind, verificationFlag: item.verify === true || item.verify === 1,
    implementationDigest: item.evidenceImplementationDigest || '',
    statement: item.st ?? item.statement ?? '', scope: item.scope ?? '', credit: item.credit ?? '',
    references: [...(item.refs || [])], links: { ...(item.links || {}) },
    prerequisites: [...(item.deps || [])], plannedPrerequisites: [...(item.pdeps || [])],
    collectionSource: collection.source || null,
  };
}
export function evidenceRoute(hash, direction = 'evidence') {
  const from = direction === 'evidence' ? 't' : 'evidence';
  const to = direction === 'evidence' ? 'evidence' : 't';
  const match = new RegExp('^#/' + from + '/([^?]+)([\\s\\S]*)$').exec(hash);
  if (!match || !LEGACY_EVIDENCE_ID.test(decodeURIComponent(match[1]))) throw new Error('Invalid idea route');
  // Keep the entire suffix opaque: saved states and unknown parameters belong to their owners.
  return '#/' + to + '/' + match[1] + match[2];
}
export function validateEvidenceRecord(r, binding = {}) {
  const errors = [], check = (ok, message) => { if (!ok) errors.push(message); };
  if (!object(r)) return ['Evidence record must be an object'];
  check(only(r, ['schemaVersion', 'targetId', 'revision', 'publication', 'author', 'scope', 'updatedOn', 'targetDigest', 'sources', 'claims', 'limitations', 'reviewRequirements', 'reviews', 'withdrawal']), 'Unknown evidence fields are not publishable');
  check(r.schemaVersion === 1, 'Unsupported evidence schema');
  check(LEGACY_EVIDENCE_ID.test(r.targetId), 'Invalid legacy target');
  check(/^\d+\.\d+\.\d+$/.test(r.revision || ''), 'Revision must be semver');
  check(['local-only', 'public', 'withdrawn'].includes(r.publication), 'Unknown evidence publication state');
  check(text(r.author, 200) && text(r.scope), 'Author and scope are required');
  check(date(r.updatedOn), 'A real update date is required');
  check(sha(r.targetDigest), 'Legacy target digest is required');
  if (binding.targetDigest) check(r.targetDigest === binding.targetDigest, 'Evidence is stale for the legacy item');
  if (r.publication === 'withdrawn') {
    check(object(r.withdrawal) && only(r.withdrawal, ['reason', 'withdrawnOn']) && text(r.withdrawal.reason) && date(r.withdrawal.withdrawnOn), 'Withdrawal reason and date are required');
    return errors;
  }
  check(Array.isArray(r.sources) && r.sources.length > 0 && r.sources.length <= 50, 'One to fifty source records are required');
  check(Array.isArray(r.claims) && r.claims.length > 0 && r.claims.length <= 50, 'One to fifty bounded claims are required');
  check(Array.isArray(r.limitations) && r.limitations.every(x => text(x)), 'Limitations must be a text list');
  check(Array.isArray(r.reviewRequirements) && unique(r.reviewRequirements) && r.reviewRequirements.every(x => dimensions.includes(x)) && ['content', 'rights'].every(x => r.reviewRequirements.includes(x)), 'Content/rights and valid additional review requirements are required');
  check(Array.isArray(r.reviews), 'Review history is required');
  if (errors.length) return errors;
  check(r.sources.every(object) && unique(r.sources.map(x => x?.id)), 'Source records need unique identities');
  check(r.claims.every(object) && unique(r.claims.map(x => x?.id)), 'Claims need unique identities');
  if (errors.length) return errors;
  for (const s of r.sources) {
    check(only(s, ['id', 'title', 'creator', 'edition', 'locator', 'boundary', 'url', 'access', 'readOn', 'reuse']), 'Unknown source fields are not publishable');
    check(/^[a-z][a-z0-9-]*$/.test(s.id || ''), 'Invalid source identity');
    check(['title', 'creator', 'edition', 'locator', 'boundary'].every(k => text(s[k])), 'Source version, locator and boundary are required');
    try { const u = new URL(s.url); check(u.protocol === 'https:' && !u.username && !u.password, 'Source link must be public HTTPS'); } catch { check(false, 'Invalid source URL'); }
    check(['body-read', 'table-read', 'file-read'].includes(s.access) && date(s.readOn), 'Discovery alone is not source reading');
    check(text(s.reuse), 'Source reuse scope is required');
  }
  for (const c of r.claims) {
    check(only(c, ['id', 'text', 'qualification', 'sourceIds']), 'Unknown claim fields are not publishable');
    check(/^[a-z][a-z0-9-]*$/.test(c.id || '') && text(c.text) && text(c.qualification), 'Claim and qualification are required');
    check(Array.isArray(c.sourceIds) && c.sourceIds.length > 0 && unique(c.sourceIds) && c.sourceIds.every(id => r.sources.some(s => s.id === id)), 'Claim source does not resolve');
  }
  for (const review of r.reviews) {
    if (!object(review)) { check(false, 'Review must be an object'); continue; }
    check(only(review, ['dimension', 'result', 'reviewer', 'reviewedOn', 'summary', 'evidencePath', 'revision', 'contentDigest', 'artifactDigest']) && object(review.reviewer) && only(review.reviewer, ['id', 'role', 'independent']), 'Unknown review fields are not publishable');
    check(dimensions.includes(review.dimension) && ['passed', 'changes-requested'].includes(review.result), 'Invalid review dimension/result');
    check(text(review.reviewer?.id, 200) && review.reviewer.id !== r.author && text(review.reviewer?.role, 500) && review.reviewer.independent === true, 'Independent reviewer identity and scope are required');
    check(date(review.reviewedOn) && text(review.summary), 'Review date and bounded summary are required');
    check(/^docs\/verification\/[a-z0-9/-]+\.md$/.test(review.evidencePath || '') && !review.evidencePath.includes('..'), 'Unsafe review evidence path');
    check(/^\d+\.\d+\.\d+$/.test(review.revision || '') && sha(review.contentDigest) && sha(review.artifactDigest), 'Exact review binding is required');
  }
  if (r.publication === 'public') for (const dimension of r.reviewRequirements) {
    const latest = r.reviews.filter(x => x?.dimension === dimension).at(-1);
    check(latest?.result === 'passed', 'Missing passing review: ' + dimension);
    check(latest?.revision === r.revision && sha(binding.contentDigest) && latest?.contentDigest === binding.contentDigest, 'Stale content review: ' + dimension);
    check(sha(binding.artifactDigest) && latest?.artifactDigest === binding.artifactDigest, 'Stale artifact review: ' + dimension);
  }
  return errors;
}
