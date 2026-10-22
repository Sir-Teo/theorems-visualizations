import { canonicalEvidence, evidenceContent, legacyEvidenceSnapshot, LEGACY_EVIDENCE_ID, EVIDENCE_MAX_CHARS, validateEvidenceRecord } from './evidence-model.js';

async function sha(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function readJSON(url, fetcher) {
  const response = await fetcher(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error('Evidence request failed');
  const text = await response.text();
  if (text.length > EVIDENCE_MAX_CHARS) throw new Error('Evidence response exceeds its size limit');
  return { text, data: JSON.parse(text) };
}
export async function loadEvidence(item, collection, { fetcher = fetch, base = new URL('../../data/', import.meta.url) } = {}) {
  try {
    const { data: catalog } = await readJSON(new URL('evidence.json', base), fetcher);
    if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.entries) || new Set(catalog.entries.map(e => e?.targetId)).size !== catalog.entries.length ||
      !catalog.entries.every(e => e && LEGACY_EVIDENCE_ID.test(e.targetId) && e.path === 'evidence/' + e.targetId + '.json' && /^[a-f0-9]{64}$/.test(e.sha256 || '') && /^[a-f0-9]{64}$/.test(e.targetDigest || '') && ['public', 'withdrawn'].includes(e.publication))) throw new Error('Invalid evidence catalog');
    const entry = catalog.entries.find(x => x.targetId === item.id);
    if (!entry) return { kind: 'none' };
    const { text, data } = await readJSON(new URL(entry.path, base), fetcher);
    if (await sha(text) !== entry.sha256) throw new Error('Evidence file does not match its catalog');
    if (entry.publication === 'withdrawn') {
      if (data.schemaVersion !== 1 || data.targetId !== item.id || data.publication !== 'withdrawn' || typeof data.withdrawal?.reason !== 'string' || typeof data.withdrawal?.withdrawnOn !== 'string') throw new Error('Invalid withdrawal notice');
      return { kind: 'withdrawn', reason: data.withdrawal.reason, withdrawnOn: data.withdrawal.withdrawnOn };
    }
    const targetDigest = await sha(canonicalEvidence(legacyEvidenceSnapshot(item, collection)));
    if (entry.targetDigest !== targetDigest) return { kind: 'stale' };
    if (data.record?.targetId !== item.id || data.record?.publication !== 'public' || data.binding?.targetDigest !== targetDigest) throw new Error('Invalid evidence target');
    const contentDigest = await sha(canonicalEvidence(evidenceContent(data.record)));
    if (data.binding?.contentDigest !== contentDigest || validateEvidenceRecord(data.record, { ...data.binding, contentDigest, targetDigest }).length) throw new Error('Invalid evidence reviews');
    return { kind: 'record', record: data.record };
  } catch { return { kind: 'unavailable' }; }
}

const node = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
const para = (parent, text) => parent.append(node('p', text));
function section(parent, title) {
  const el = node('section'); el.append(node('h3', title)); parent.append(el); return el;
}
function list(parent, values) {
  const ul = node('ul'); values.forEach(x => ul.append(node('li', x))); parent.append(ul);
}
function sourceLink(parent, title, href) {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Unsafe source');
    const a = node('a', title); a.href = url.href; parent.append(a);
  } catch { parent.append(node('span', title)); }
}
function stylesheet() {
  if (document.getElementById('evidence-styles')) return;
  const link = node('link'); link.id = 'evidence-styles'; link.rel = 'stylesheet'; link.href = new URL('../css/evidence.css', import.meta.url).href; document.head.append(link);
}
export function renderEvidenceView(item, collection, result, { detailsAvailable = true } = {}) {
  stylesheet();
  const root = node('div', undefined, 'evidence-view');
  const legacy = section(root, 'Existing explanation');
  para(legacy, item.verify === true || item.verify === 1
    ? 'This item carries a legacy verification flag. Its original uncertainty remains open; the flag is not a completed review.'
    : 'This item has no legacy verification flag. That does not establish independent review or acceptance.');
  if (!detailsAvailable) para(legacy, 'The detailed references could not be loaded. Their absence here is not evidence that the explanation has none.');
  else {
    if (item.scope) { legacy.append(node('h4', 'Stated limits')); para(legacy, item.scope); }
    if (item.refs?.length) { legacy.append(node('h4', 'Item references')); list(legacy, item.refs); }
    else para(legacy, 'No item-level reference list is recorded in the current explanation.');
    if (item.links && Object.keys(item.links).length) {
      const ul = node('ul');
      for (const [label, href] of Object.entries(item.links)) { const li = node('li'); sourceLink(li, label, href); ul.append(li); }
      legacy.append(ul);
    }
  }
  const source = collection.source;
  if (source) {
    const context = section(root, 'Collection source');
    if (source.type === 'book') {
      para(context, [source.author, source.title, source.edition].filter(Boolean).join(' · '));
      if (source.url) sourceLink(context, 'Open the collection’s source link', source.url);
      if (source.license) para(context, 'Recorded collection licence: ' + source.license);
    } else if (source.refs?.length) list(context, source.refs);
    else para(context, 'The collection is identified as a curated course; no source list is recorded here.');
    para(context, 'A collection citation identifies a reading route. It is not an item-specific reading or review receipt.');
  }
  const reviews = section(root, 'Additional evidence and reviews');
  const messages = {
    none: 'No additional evidence record is published for this item. Existing references and verification flags retain their original scope.',
    unavailable: 'Additional evidence could not be verified or loaded. No conclusion about review completion can be drawn from this failure.',
    stale: 'The additional evidence record refers to an earlier version of this explanation. It is not displayed as a current review.',
  };
  if (messages[result.kind]) para(reviews, messages[result.kind]);
  else if (result.kind === 'withdrawn') { para(reviews, 'The additional evidence record was withdrawn on ' + result.withdrawnOn + '.'); para(reviews, result.reason); }
  else if (result.kind === 'record') {
    const r = result.record;
    para(reviews, r.scope); para(reviews, 'Evidence record ' + r.revision + ' · updated ' + r.updatedOn + '. This review applies to the stated claims and scope.');
    for (const claim of r.claims) {
      const box = section(reviews, 'Claim'); para(box, claim.text); para(box, claim.qualification);
      para(box, 'Source locators: ' + claim.sourceIds.map(id => { const s = r.sources.find(x => x.id === id); return s.title + ' — ' + s.locator; }).join('; '));
    }
    for (const s of r.sources) {
      const box = section(reviews, s.title); sourceLink(box, 'Open source', s.url);
      para(box, [s.creator, s.edition, s.locator].join(' · ')); para(box, 'Inspected on ' + s.readOn + '. ' + s.boundary); para(box, 'Reuse scope: ' + s.reuse);
    }
    for (const dimension of r.reviewRequirements) {
      const review = r.reviews.filter(x => x.dimension === dimension).at(-1);
      const box = section(reviews, dimension[0].toUpperCase() + dimension.slice(1) + ' review');
      para(box, review.reviewer.id + ' · ' + review.reviewer.role + ' · ' + review.reviewedOn); para(box, review.summary);
    }
    if (r.limitations.length) { reviews.append(node('h4', 'Remaining limitations')); list(reviews, r.limitations); }
  }
  return root;
}
