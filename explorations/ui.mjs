import { normalizeState, parseState, serializeState, assessHistory } from './route-state.mjs';
const record = JSON.parse(document.querySelector('#exploration-data').textContent);
const $ = id => document.getElementById(id);
const key = 'atlas.exploration.v1.' + record.id + '.' + record.revision;
let saved = {}, storageAvailable = true, unreadableSaved = false;
try {
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    try {
      const value = JSON.parse(raw);
      if (!value || value.revision !== record.revision || !value.state || typeof value.state !== 'object' || Array.isArray(value.state) || typeof value.notes !== 'string') throw new Error('Unrecognized saved notes');
      saved = value;
    } catch { unreadableSaved = true; }
  }
} catch { storageAvailable = false; }
const isPageAnchor = hash => /^#[a-z][a-z0-9-]*$/.test(hash) && !!document.getElementById(hash.slice(1));
const parsed = parseState(record, isPageAnchor(location.hash) ? '' : location.hash);
let state = location.hash && !isPageAnchor(location.hash) ? parsed.state : normalizeState(record, saved.state);
$('notes').value = typeof saved.notes === 'string' ? saved.notes.slice(0, 1500) : '';
function saveStatus(message) { if ($('save-status').textContent !== message) $('save-status').textContent = message; }
const unreadableMessage = 'Existing saved notes could not be restored and have not been overwritten. Export them before using reset; new notes stay on this page.';
function save() {
  if (unreadableSaved) { saveStatus(unreadableMessage); return; }
  try {
    localStorage.setItem(key, JSON.stringify({ revision: record.revision, state, notes: $('notes').value.slice(0, 1500) }));
    storageAvailable = true; saveStatus('Saved in this browser.');
  } catch {
    storageAvailable = false;
    saveStatus('Browser storage is unavailable. Your notes remain on this page; export them before leaving.');
  }
}
function lensDetail() {
  if (record.activity.type !== 'annotation') return;
  const lens = record.activity.lenses.find(x => x.id === state.lens), target = $('lens-detail');
  target.replaceChildren();
  for (const [tag, text] of [['h3', lens.label], ['p', lens.observation], ['p', lens.question]]) {
    const el = document.createElement(tag); el.textContent = text; target.append(el);
  }
  const ul = document.createElement('ul');
  for (const reading of lens.readings) { const li = document.createElement('li'); li.textContent = reading; ul.append(li); }
  target.append(ul);
  const boundary = document.createElement('p'); boundary.className = 'boundary'; boundary.textContent = lens.boundary; target.append(boundary);
}
function apply() {
  for (const [k,v] of Object.entries(state)) if ($(k)) $(k).value = v;
  if ($('current-claim')) $('current-claim').textContent = record.activity.prompts.find(p => p.id === state.task).claim;
  for (const card of document.querySelectorAll('[data-passage]')) card.classList.toggle('selected', card.dataset.passage === state.evidence);
  if ($('feedback')) $('feedback').textContent = '';
  $('share-label').hidden = true; $('share-url').hidden = true; $('share-url').value = '';
  lensDetail();
}
for (const control of document.querySelectorAll('.interactive select')) control.addEventListener('change', () => {
  state = normalizeState(record, { ...state, [control.id]: control.value });
  apply(); $('state-status').textContent = ''; history.replaceState(null, '', serializeState(record, state)); save();
});
$('notes').addEventListener('input', save);
$('check')?.addEventListener('click', () => {
  const result = assessHistory(record, state);
  $('feedback').textContent = (result.classificationMatches && result.evidenceMatches
    ? 'Your selection fits this guide. '
    : !result.classificationMatches ? 'Reconsider the kind of support. ' : 'Reconsider which passage supplies the support. ')
    + result.explanation;
});
$('share').addEventListener('click', async () => {
  const url = new URL(location.href); url.hash = serializeState(record, state); url.search = '';
  $('share-url').value = url.href; $('share-url').hidden = false; $('share-label').hidden = false;
  const stillCurrent = () => !$('share-url').hidden && $('share-url').value === url.href;
  try { await navigator.clipboard.writeText(url.href); if (stillCurrent()) $('state-status').textContent = 'Link copied. Your notes are not included.'; }
  catch { if (stillCurrent()) { $('share-url').focus(); $('share-url').select(); $('state-status').textContent = 'Copy the displayed link. Your notes are not included.'; } }
});
function download(data, suffix) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = record.id + suffix + '.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('export').addEventListener('click', () => {
  const data = { schemaVersion: 1, explorationId: record.id, revision: record.revision, selections: state, notes: $('notes').value };
  if (unreadableSaved) try { data.unrestoredSavedData = localStorage.getItem(key); } catch { /* Current notes still export. */ }
  download(data, '-notes');
});
try {
  const earlier = (record.previousRevisions || []).map(revision => ({ revision, savedData: localStorage.getItem('atlas.exploration.v1.' + record.id + '.' + revision) })).filter(x => x.savedData !== null);
  if (earlier.length) {
    $('previous-notes').hidden = false;
    $('previous-notes').addEventListener('click', () => download({ schemaVersion: 1, explorationId: record.id, earlier }, '-earlier-notes'));
  }
} catch { /* Earlier notes remain optional when browser storage is blocked. */ }
$('reset').addEventListener('click', () => {
  let erased = false;
  try { localStorage.removeItem(key); erased = localStorage.getItem(key) === null; } catch { /* Report failed erasure accurately. */ }
  unreadableSaved = !erased;
  $('notes').value = ''; state = normalizeState(record); apply();
  history.replaceState(null, '', location.pathname);
  $('share-label').hidden = true; $('share-url').hidden = true; $('share-url').value = '';
  saveStatus(erased ? 'Selections reset and this revision’s saved notes erased. Earlier revisions are unchanged.' : 'Selections reset on this page, but saved-note erasure could not be confirmed. Browser storage may still contain them.'); $('state-status').textContent = '';
});
window.addEventListener('hashchange', () => {
  if (isPageAnchor(location.hash)) return;
  const next = parseState(record, location.hash); state = next.state; apply();
  $('state-status').textContent = next.warning; save();
});
document.querySelectorAll('.interactive').forEach(el => { el.hidden = false; });
apply(); $('state-status').textContent = parsed.warning;
saveStatus(unreadableSaved ? unreadableMessage : storageAvailable ? 'Notes are saved only in this browser.' : 'Browser storage is unavailable; export notes before leaving.');
