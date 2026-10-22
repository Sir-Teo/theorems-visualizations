import { createHash } from 'node:crypto';

export const EXP_ID = /^x-[a-z][a-z0-9-]*-[0-9]{4}$/;
export const LEGACY_ID = /^[a-z][a-z0-9]{1,7}-\d{1,2}(?:\.\d{1,3}){1,2}[a-z]?$/;
export const MODES = ['formal', 'empirical', 'historical', 'interpretive', 'normative', 'procedural', 'creative'];
export const RELATIONS = ['applies', 'analogous-to', 'contrasts-with', 'influenced-by', 'evidence-for', 'challenges', 'part-of', 'translation-of', 'version-of'];
const text = x => typeof x === 'string' && x.trim().length > 0;
const unique = xs => new Set(xs).size === xs.length;
export const textDigest = value => createHash('sha256').update(value, 'utf8').digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
// Lifecycle/review additions do not change the reviewed content, but all reader-facing
// text, source/rights metadata, activity logic and requirements do.
export function contentDigest(record) {
  const { reviews, status, publication, ...content } = record;
  return textDigest(canonical(content));
}
export function reviewArtifactDigest(record, codeHashes) {
  return textDigest(canonical({ contentDigest: contentDigest(record), codeHashes }));
}
export function validateExploration(r, { domainIds, collectionIds, sourceIds, knownItemIds = [], artifactDigest }) {
  const errors = [], check = (ok, why) => { if (!ok) errors.push((r?.id || 'record') + ': ' + why); };
  if (!r || typeof r !== 'object' || Array.isArray(r)) return ['record must be an object'];
  check(r.schemaVersion === 1, 'unsupported schemaVersion');
  check(EXP_ID.test(r.id), 'invalid namespaced exploration ID');
  check(/^P0[1-8]$/.test(r.pilotId), 'unknown pilot');
  check(/^\d+\.\d+\.\d+$/.test(r.revision), 'revision must be semver');
  if (r.previousRevisions !== undefined) check(Array.isArray(r.previousRevisions) && unique(r.previousRevisions) && r.previousRevisions.every(x => /^\d+\.\d+\.\d+$/.test(x) && x !== r.revision), 'previous revisions must be distinct version identifiers');
  check(['draft', 'in-review', 'accepted', 'withdrawn'].includes(r.status), 'invalid lifecycle state');
  check(['local-preview', 'published', 'withdrawn'].includes(r.publication), 'invalid publication state');
  check(r.publication !== 'published' || r.status === 'accepted', 'unaccepted content cannot be published');
  check(r.publication !== 'published', 'public release is reserved for a later publishing contract; this builder only produces previews');
  check(r.publication !== 'withdrawn' || r.status === 'withdrawn', 'withdrawn publication needs withdrawn lifecycle state');
  for (const k of ['title', 'subtitle', 'summary', 'audience', 'scope', 'author', 'updatedOn']) check(text(r[k]), 'missing ' + k);
  const refs = (xs, known, label, empty = false) => {
    check(Array.isArray(xs) && (empty || xs.length > 0), 'missing ' + label);
    if (!Array.isArray(xs)) return;
    check(unique(xs), 'duplicate ' + label);
    for (const x of xs) check(known.includes(x), 'unknown ' + label + ': ' + x);
  };
  refs(r.domainIds, domainIds, 'domain');
  refs(r.relatedCollectionIds, collectionIds, 'related collection', true);
  refs(r.knowledgeModes, MODES, 'knowledge mode');
  refs(r.methods, ['source-comparison', 'annotation'], 'implemented method');
  refs(r.prerequisites, knownItemIds, 'prerequisite', true);
  for (const k of ['sources', 'passages', 'claims', 'context', 'timeline', 'relations', 'reviews', 'reviewRequirements'])
    check(Array.isArray(r[k]), k + ' must be an array');
  if (errors.length) return errors;
  for (const k of ['timeline', 'relations']) check(r[k].every(x => x && typeof x === 'object' && !Array.isArray(x)), k + ' entries must be objects');
  for (const k of ['sources', 'passages', 'claims']) {
    check(r[k].length > 0 && r[k].every(x => x && typeof x === 'object' && !Array.isArray(x)), 'missing ' + k);
    check(unique(r[k].map(x => x?.id)), 'duplicate ' + k + ' identity');
  }
  if (errors.length) return errors;
  const sourceSet = r.sources.map(x => x.id), passageSet = r.passages.map(x => x.id);
  for (const s of r.sources) {
    check(sourceIds.includes(s.id), 'unknown source receipt ' + s.id);
    for (const k of ['title', 'locator', 'creator', 'date', 'language']) check(text(s[k]), s.id + ': missing ' + k);
    try { const u = new URL(s.url); check(u.protocol === 'https:' && !u.username && !u.password, 'source URL must be public https'); } catch { check(false, 'invalid source URL'); }
    check(s.rights?.decision === 'usable-for-prototype' && text(s.rights?.basis) && text(s.rights?.scope), s.id + ': missing bounded rights decision');
  }
  for (const p of r.passages) {
    check(/^[a-z][a-z0-9-]*$/.test(p.id), 'invalid passage ID');
    check(sourceSet.includes(p.sourceId), 'passage source missing');
    check(['quotation', 'paraphrase', 'original'].includes(p.form), 'passage form missing');
    check(text(p.text) && text(p.context) && text(p.title) && /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(p.language), 'passage text/context/language missing');
    check(text(p.text) && textDigest(p.text) === p.sha256, 'passage digest mismatch: ' + p.id);
  }
  for (const c of r.claims) {
    check(text(c.id) && text(c.text) && text(c.qualification), 'claim identity/text/boundary missing');
    check(['formal', 'empirical', 'historical', 'textual', 'interpretive', 'normative', 'procedural', 'creative'].includes(c.kind), 'unknown claim kind');
    refs(c.passageIds, passageSet, 'claim evidence');
  }
  check(r.context.length > 0 && r.context.every(text), 'context must be explicit');
  for (const t of r.timeline) check(text(t.date) && ['day', 'month', 'year', 'approximate'].includes(t.precision) && text(t.event) && sourceSet.includes(t.sourceId), 'timeline precision/source missing');
  for (const rel of r.relations) {
    check(RELATIONS.includes(rel.type), 'unknown semantic relation; prerequisites are separate');
    check(knownItemIds.includes(rel.targetId), 'unresolved relation target');
    check(text(rel.rationale), 'relation requires rationale');
    if (['influenced-by', 'evidence-for', 'challenges', 'translation-of'].includes(rel.type)) refs(rel.sourceIds, sourceSet, 'relation evidence');
  }
  const a = r.activity;
  check(['source-comparison', 'annotation'].includes(a?.type), 'unsupported activity type');
  check(r.methods.includes(a?.type), 'activity type must be declared in methods');
  check(text(a?.transfer) && Array.isArray(a?.rubric) && a.rubric.length > 0 && a.rubric.every(text), 'transfer task/rubric missing');
  if (a?.type === 'source-comparison') {
    check(Array.isArray(a.prompts) && a.prompts.length > 0, 'source prompts missing');
    const ps = Array.isArray(a.prompts) ? a.prompts : [];
    if (!ps.every(x => x && typeof x === 'object' && !Array.isArray(x))) return [...errors, 'source prompts must be objects'];
    check(unique(ps.map(p => p.id)), 'duplicate prompt ID');
    for (const p of ps) {
      check(/^[a-z][a-z0-9-]*$/.test(p.id) && text(p.claim) && text(p.feedback), 'prompt incomplete');
      check(['direct', 'inference', 'unsupported'].includes(p.answer), 'unknown evidence classification');
      refs(p.evidenceIds, [...passageSet, 'none'], 'answer evidence');
      check(p.answer !== 'unsupported' || (Array.isArray(p.evidenceIds) && p.evidenceIds.every(x => x === 'none')), 'unsupported claim must not fabricate evidence');
      check(p.answer === 'unsupported' || (Array.isArray(p.evidenceIds) && !p.evidenceIds.includes('none')), 'supported claim must name an evidence passage');
    }
  } else if (a?.type === 'annotation') {
    check(Array.isArray(a.lenses) && a.lenses.length > 0, 'annotation lenses missing');
    const ls = Array.isArray(a.lenses) ? a.lenses : [];
    if (!ls.every(x => x && typeof x === 'object' && !Array.isArray(x))) return [...errors, 'annotation lenses must be objects'];
    check(unique(ls.map(x => x.id)), 'duplicate lens ID');
    for (const l of ls) {
      check(/^[a-z][a-z0-9-]*$/.test(l.id), 'invalid annotation lens ID');
      for (const k of ['id', 'label', 'observation', 'question', 'boundary']) check(text(l[k]), 'incomplete reading lens');
      check(Array.isArray(l.readings) && l.readings.length >= 2 && l.readings.every(text), 'allow multiple supported readings');
    }
  }
  const dimensions = ['content', 'provenance', 'language', 'rights', 'accessibility', 'learning'];
  refs(r.reviewRequirements, dimensions, 'review requirement');
  for (const dimension of ['content', 'rights', 'accessibility', 'learning'])
    check(r.reviewRequirements.includes(dimension), 'mandatory review requirement missing: ' + dimension);
  for (const review of r.reviews) {
    if (!review || typeof review !== 'object' || Array.isArray(review)) { check(false, 'review must be an object'); continue; }
    check(dimensions.includes(review.dimension) && ['passed', 'changes-requested'].includes(review.result), 'invalid review dimension/result');
    check(text(review.reviewer?.id) && text(review.reviewer?.role) && review.reviewer?.independent === true && review.reviewer.id !== r.author, 'review must identify independent reviewer');
    check(text(review.evidencePath) && text(review.reviewedOn), 'review receipt/date missing');
    check(/^\d+\.\d+\.\d+$/.test(review.revision) && /^[a-f0-9]{64}$/.test(review.contentDigest || '') && /^[a-f0-9]{64}$/.test(review.artifactDigest || ''), 'review version/digests missing');
  }
  if (r.status === 'accepted') {
    for (const dimension of r.reviewRequirements) {
      const latest = r.reviews.filter(x => x?.dimension === dimension).at(-1);
      check(latest?.result === 'passed', 'acceptance missing review: ' + dimension);
      if (!latest) continue;
      check(latest.revision === r.revision && latest.contentDigest === contentDigest(r), 'review is stale for this exact content: ' + dimension);
      check(/^[a-f0-9]{64}$/.test(artifactDigest || '') && latest.artifactDigest === artifactDigest, 'review is stale or unbound for this rendered artifact: ' + dimension);
    }
  }
  check(r.extensions && typeof r.extensions === 'object' && !Array.isArray(r.extensions) && Object.keys(r.extensions).every(x => /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(x)), 'extensions must use namespaced keys');
  return errors;
}
