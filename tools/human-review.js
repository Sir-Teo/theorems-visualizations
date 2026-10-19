import { validateRecords, reviewSummary } from './review-state.js';
const $ = id => document.getElementById(id), storageKey = 'atlas-human-review-v1';
let manifest, records = [], selected, theme = 'light';
const message = text => { $('message').textContent = text; };
const recordFor = (id, type) => records.find(r => r.id === id && r.type === type);
const typesFor = entry => ['visual', 'audio'].filter(t => entry[t]);
const complete = entry => typesFor(entry).filter(t => $('queue').value === 'all' || $('queue').value === t).every(t => recordFor(entry.id, t)?.status === 'pass');
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, records })); }
  catch { message('The browser could not save locally. Export your reviews before leaving.'); }
}
function updateProgress() {
  const summary = reviewSummary(manifest, records);
  $('progress').textContent = `Visual: ${summary.visual.passed}/${summary.visual.total} passed · Listening: ${summary.audio.passed}/${summary.audio.total} passed · ${summary.visual.issues + summary.audio.issues} issues recorded`;
}
function renderList() {
  updateProgress();
  const entries = manifest.entries.filter(e => ($('queue').value === 'all' || e[$('queue').value]) && (!$('pending').checked || !complete(e)));
  $('items').replaceChildren(...entries.map(entry => {
    const button = document.createElement('button'); button.type = 'button';
    button.dataset.id = entry.id; button.setAttribute('aria-current', String(selected?.id === entry.id));
    const name = document.createElement('span'); name.textContent = `${entry.id} · ${entry.name}`;
    const status = document.createElement('small'); status.textContent = typesFor(entry).map(t => `${t}: ${recordFor(entry.id, t)?.status || 'pending'}`).join(' · ');
    button.append(name, status); button.onclick = () => openEntry(entry); return button;
  }));
  if (entries.length && !entries.some(e => e.id === selected?.id)) openEntry(entries[0]);
  if (!entries.length) { selected = null; $('review').textContent = 'No unfinished entries in this queue.'; $('example').removeAttribute('src'); }
}
function loadExample() {
  const width = Math.min(860, Math.max(280, $('example').clientWidth - 38));
  const params = new URLSearchParams({ file: selected.file, id: selected.id, theme, wait: '100', w: String(width) });
  $('example').src = `./harness.html?${params}`;
}
function openEntry(entry) {
  selected = entry; $('review').replaceChildren();
  const title = document.createElement('h2'); title.textContent = `${entry.id} · ${entry.name}`;
  const links = document.createElement('div'); links.className = 'actions';
  const full = document.createElement('a'); full.href = `../#/t/${entry.id}`; full.target = '_blank'; full.rel = 'noopener'; full.textContent = 'Open full idea and references'; links.append(full);
  for (const value of ['light', 'dark']) {
    const button = document.createElement('button'); button.textContent = `View ${value}`; button.type = 'button'; button.onclick = () => { theme = value; loadExample(); }; links.append(button);
  }
  $('review').append(title, links);
  if (entry.sourceReviewPending) { const p = document.createElement('p'); p.textContent = 'Source verification is still pending for this item. Record visual or listening observations separately.'; $('review').append(p); }
  for (const type of typesFor(entry).filter(t => $('queue').value === 'all' || $('queue').value === t)) {
    const prior = recordFor(entry.id, type), fieldset = document.createElement('fieldset'), legend = document.createElement('legend');
    legend.textContent = type === 'visual' ? 'Visual review' : 'Listening review'; fieldset.append(legend);
    const rubric = type === 'visual' ? { controls: 'I tested the controls and checked that the readout agrees with the picture.', light: 'I inspected the light theme for clipped, overlapping or unreadable content.', dark: 'I inspected the dark theme for clipped, overlapping or unreadable content.' } : { listened: 'I listened to each relevant sound control and compared the sound with the explanation.' };
    const checks = {};
    for (const [key, text] of Object.entries(rubric)) {
      const label = document.createElement('label'), checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = prior?.attestations[key] || false;
      checks[key] = checkbox; label.append(checkbox, text); fieldset.append(label);
    }
    const notes = document.createElement('textarea'); notes.value = prior?.notes || ''; notes.setAttribute('aria-label', `${type} observations`); notes.placeholder = 'Observations, including controls and settings that reveal an issue'; fieldset.append(notes);
    const actions = document.createElement('div'); actions.className = 'actions';
    for (const [status, label] of [['pass', `Pass ${type} review`], ['needs-fix', 'Record an issue']]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.onclick = () => {
        const reviewer = $('name').value.trim(), attestations = Object.fromEntries(Object.entries(checks).map(([key, el]) => [key, el.checked]));
        if (!reviewer) return message('Enter the reviewer name before saving.');
        if (status === 'pass' && !Object.values(attestations).every(Boolean)) return message('Complete the review steps before marking a pass.');
        if (status === 'needs-fix' && !notes.value.trim()) return message('Describe the issue and the settings that reveal it.');
        const record = { id: entry.id, type, fingerprint: entry.fingerprint, status, reviewer, notes: notes.value, attestations, reviewedAt: new Date().toISOString() };
        records = [...records.filter(r => r.id !== entry.id || r.type !== type), record]; persist(); renderList(); message(`Saved ${type} review for ${entry.id}.`);
      }; actions.append(button);
    }
    fieldset.append(actions); $('review').append(fieldset);
  }
  loadExample();
  for (const button of $('items').querySelectorAll('button')) button.setAttribute('aria-current', String(button.dataset.id === entry.id));
}
$('queue').onchange = () => { selected = null; renderList(); };
$('pending').onchange = renderList;
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (selected) loadExample(); }, 200); });
$('export').onclick = () => {
  const blob = new Blob([JSON.stringify({ version: 1, manifestFingerprint: manifest.fingerprint, records }, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'atlas-human-reviews.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('import').onchange = async event => {
  try {
    const file = event.target.files[0]; if (!file) return;
    const data = JSON.parse(await file.text()); if (data.version !== 1) throw new Error('Unsupported review file version.');
    const checked = validateRecords(manifest, data.records);
    const merged = new Map(records.map(r => [`${r.id}:${r.type}`, r]));
    for (const record of checked.accepted) { const key = `${record.id}:${record.type}`, current = merged.get(key); if (!current || Date.parse(record.reviewedAt) > Date.parse(current.reviewedAt)) merged.set(key, record); }
    records = [...merged.values()]; persist(); renderList(); if (selected) openEntry(selected);
    message(`Imported ${checked.accepted.length} valid records; ignored ${checked.rejected.length} stale, duplicate or invalid records.`);
  } catch (error) { message(`Import failed: ${error.message}`); }
  event.target.value = '';
};
try {
  const response = await fetch('../docs/verification/human-review-sample.json'); if (!response.ok) throw new Error('Run npm run review:prepare first.'); manifest = await response.json();
  let stale = 0;
  try { const saved = localStorage.getItem(storageKey); if (saved) { const checked = validateRecords(manifest, JSON.parse(saved).records); records = checked.accepted; stale = checked.rejected.length; } }
  catch { message('Saved reviews could not be read. Import a previously exported review file to recover them.'); }
  renderList();
  if (stale) message(`${stale} saved reviews need another review because their source changed or their records are incomplete.`);
} catch (error) { message(error.message); $('progress').textContent = 'Review sample unavailable.'; }
