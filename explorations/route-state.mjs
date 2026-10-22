// Browser-safe public route and state contract. No private notes enter URLs.
const expId = /^x-[a-z][a-z0-9-]*-[0-9]{4}$/;
const legacyId = /^[a-z][a-z0-9]{1,7}-\d{1,2}(?:\.\d{1,3}){1,2}[a-z]?$/;
export function basePath(base = '/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('Use a root-relative deployment base ending in /');
  return base;
}
export function draftHref(id, base = '/') {
  if (!expId.test(id)) throw new Error('Invalid exploration ID');
  return basePath(base) + 'labs/atlas/' + id + '/';
}
export function proposedPublicHref(id, base = '/') {
  if (!expId.test(id)) throw new Error('Invalid exploration ID');
  return basePath(base) + 'explore/' + id + '/'; // Reserved proposal, not deployed by the pilot builder.
}
export function legacyHref(id, params = '', base = '/') {
  if (!legacyId.test(id)) throw new Error('Invalid legacy item ID');
  const query = new URLSearchParams(params).toString();
  return basePath(base) + '#/t/' + encodeURIComponent(id) + (query ? '?' + query : '');
}
export function normalizeState(record, raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
  const a = record.activity, state = { v: '1' };
  if (a.type === 'source-comparison') {
    state.task = a.prompts.some(x => x.id === raw.task) ? raw.task : a.prompts[0].id;
    state.evidence = ['none', ...record.passages.map(x => x.id)].includes(raw.evidence) ? raw.evidence : 'none';
    state.category = ['direct', 'inference', 'unsupported'].includes(raw.category) ? raw.category : 'direct';
  } else {
    state.lens = a.lenses.some(x => x.id === raw.lens) ? raw.lens : a.lenses[0].id;
    state.category = ['observation', 'interpretation', 'needs-language-evidence'].includes(raw.category) ? raw.category : 'observation';
  }
  return state;
}
export function parseState(record, hash = '') {
  if (hash.length > 1000) return { state: normalizeState(record), warning: 'This saved state is too long; defaults restored.' };
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (p.size && p.get('v') !== '1') return { state: normalizeState(record), warning: 'This saved-state version is unsupported; defaults restored.' };
  return { state: normalizeState(record, Object.fromEntries(p)), warning: '' };
}
export function serializeState(record, state) {
  return '#' + new URLSearchParams(normalizeState(record, state)).toString();
}
export function assessHistory(record, state) {
  const s = normalizeState(record, state), p = record.activity.prompts.find(x => x.id === s.task);
  return { classificationMatches: s.category === p.answer, evidenceMatches: p.evidenceIds.includes(s.evidence), explanation: p.feedback };
}
export function legacyEvidence(item) {
  // This adapter never infers independent acceptance from written content or verify.
  return { target: { kind: 'legacy-item', id: item.id }, legacy: { kind: item.kind, verify: item.verify === true },
    uncertainty: item.verify === true ? 'Legacy verification flag; inspect its original scope.' : 'No added review information.',
    reviews: [], prerequisites: [...(item.deps || [])] };
}
