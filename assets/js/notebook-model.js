// Browser-safe note recovery. This module performs no network requests or automatic writes.
export const STORE = 'atlas.exploration.v1.';
export const JOURNAL = 'atlas.notebook.recovery.v1.';
export const MAX_FILE = 1024 * 1024;
export const MAX_RAW = 200000;
export const MAX_NOTES = 1500;
const idOK = v => typeof v === 'string' && v.length <= 100 && /^x-[a-z][a-z0-9-]*-[0-9]{4}$/.test(v);
const revOK = v => typeof v === 'string' && /^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.test(v);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const require = (ok, message) => { if (!ok) throw new Error(message); };
export function keyFor(id, revision) {
  require(idOK(id) && revOK(revision), 'Invalid exploration identity or edition.');
  return STORE + id + '.' + revision;
}
export function identityFor(key) {
  if (typeof key !== 'string' || !key.startsWith(STORE)) return null;
  const m = key.slice(STORE.length).match(/^(x-[a-z][a-z0-9-]*-[0-9]{4})\.(\d+\.\d+\.\d+)$/);
  return m && idOK(m[1]) && revOK(m[2]) ? {id:m[1], revision:m[2]} : null;
}
function boundedJSON(text, limit = MAX_RAW) {
  require(typeof text === 'string' && text.length <= limit, 'File or saved data exceeds the recovery limit. Nothing was changed.');
  const value = JSON.parse(text);
  let count = 0;
  function walk(v, depth) {
    require(++count <= 20000 && depth <= 24, 'JSON is too complex for recovery.');
    if (v && typeof v === 'object') for (const [k, child] of Object.entries(v)) {
      require(!['__proto__', 'prototype', 'constructor'].includes(k), 'Unsupported JSON property.');
      walk(child, depth + 1);
    }
  }
  walk(value, 0); return value;
}
export function readSaved(raw, revision) {
  try {
    const value = boundedJSON(raw);
    return object(value) && value.revision === revision && object(value.state) && typeof value.notes === 'string' ? value : null;
  } catch { return null; }
}
function entry(id, revision, raw, label = 'Imported notes') {
  keyFor(id, revision);
  require(typeof raw === 'string' && raw.length <= MAX_RAW, 'Saved data exceeds the import limit.');
  require(typeof label === 'string' && label.length <= 120, 'Invalid recovery label.');
  return {id, revision, raw, label, key:null};
}
export function importNotes(text) {
  require(typeof text === 'string' && new TextEncoder().encode(text).byteLength <= MAX_FILE, 'File exceeds 1 MiB.');
  const value = boundedJSON(text, MAX_FILE);
  require(object(value) && value.schemaVersion === 1, 'Unsupported note export version.');
  let rows;
  if (value.kind === 'atlas-note-backup') {
    require(Array.isArray(value.entries), 'Backup entries are missing.');
    rows = value.entries.map(x => entry(x?.id, x?.revision, x?.raw, x?.label));
  } else if (Array.isArray(value.earlier)) {
    rows = value.earlier.map(x => entry(value.explorationId, x?.revision, x?.savedData, 'Earlier edition export'));
  } else {
    keyFor(value.explorationId, value.revision);
    require(typeof value.notes === 'string' && object(value.selections), 'This is not a supported lesson note export.');
    rows = [entry(value.explorationId, value.revision, JSON.stringify({revision:value.revision, state:value.selections, notes:value.notes}), 'Lesson export')];
    if (Object.hasOwn(value, 'unrestoredSavedData')) rows.push(entry(value.explorationId, value.revision, value.unrestoredSavedData, 'Unrestored original bytes'));
  }
  require(rows.length > 0 && rows.length <= 100, 'Import between 1 and 100 note entries at a time.');
  return rows;
}
export function backupText(entries) {
  require(Array.isArray(entries) && entries.length > 0 && entries.length <= 100, 'Export between 1 and 100 entries.');
  const text = JSON.stringify({schemaVersion:1, kind:'atlas-note-backup', entries:entries.map(x => {
    const row = entry(x.id, x.revision, x.raw, x.label); delete row.key; return row;
  })}, null, 2) + '\n';
  require(new TextEncoder().encode(text).byteLength <= MAX_FILE, 'Backup is too large. Export its entries separately.');
  return text;
}
// JSON escaping preserves lone UTF-16 surrogates that a raw-text Blob would replace.
// This inspection envelope intentionally is not admitted through the bounded note importer.
export function rawRecoveryText(raw, identity = null) {
  require(typeof raw === 'string', 'Recovery data must be a string.');
  if (identity !== null) keyFor(identity.id, identity.revision);
  return JSON.stringify({schemaVersion:1, kind:'atlas-raw-recovery', ...(identity === null ? {} : {id:identity.id,revision:identity.revision}), raw}, null, 2) + '\n';
}
export function listNotes(storage) {
  const rows = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i), identity = identityFor(key);
    if (identity) { const raw = storage.getItem(key); if (raw !== null) rows.push({...identity, raw, key, label:'This browser'}); }
  }
  return rows.sort((a,b) => a.key.localeCompare(b.key));
}
function sourceCurrent(storage, source) {
  if (source.key !== null) {
    require(source.key === keyFor(source.id, source.revision), 'Invalid source store.');
    require(storage.getItem(source.key) === source.raw, 'Source changed. Refresh and prepare a new preview.');
  }
}
export function prepareCopy(storage, source, target, notes) {
  entry(source.id, source.revision, source.raw);
  require(source.key === null || typeof source.key === 'string', 'Invalid source.');
  require(target.id === source.id && ['preview','published'].includes(target.state), 'Choose an available edition of the same exploration.');
  const targetKey = keyFor(target.id, target.revision);
  require(source.key !== targetKey, 'The source stays untouched. Choose a different edition or import a backup.');
  require(typeof notes === 'string' && notes.length <= MAX_NOTES, 'Notes exceed 1,500 characters. Edit the draft explicitly; nothing is truncated.');
  sourceCurrent(storage, source);
  const before = storage.getItem(targetKey), existing = before === null ? null : readSaved(before, target.revision);
  require(before === null || existing !== null, 'Destination data is unreadable. Export it first; this manager will not overwrite it.');
  require(object(target.defaults), 'Destination defaults are missing.');
  const after = JSON.stringify(existing ? {...existing, notes} : {revision:target.revision, state:target.defaults, notes});
  require(after.length <= MAX_RAW && readSaved(after, target.revision), 'Destination data is unsupported.');
  require(before !== after, 'These notes are already saved at the destination.');
  return {schemaVersion:1, kind:'atlas-note-change', id:target.id, revision:target.revision, targetKey,
    source:{id:source.id, revision:source.revision, raw:source.raw, key:source.key}, before, after};
}
export function recoveryEntries(plan) {
  return [entry(plan.source.id, plan.source.revision, plan.source.raw, 'Original source'),
    ...(plan.before === null ? [] : [entry(plan.id, plan.revision, plan.before, 'Destination before copy')]),
    entry(plan.id, plan.revision, plan.after, 'Proposed destination')];
}
function validatePlan(plan) {
  require(object(plan) && plan.schemaVersion === 1 && plan.kind === 'atlas-note-change', 'Invalid recovery record.');
  require(plan.targetKey === keyFor(plan.id, plan.revision), 'Recovery target differs.');
  entry(plan.source?.id, plan.source?.revision, plan.source?.raw);
  require(plan.source.id === plan.id && (plan.source.key === null || plan.source.key === keyFor(plan.source.id, plan.source.revision)), 'Recovery source differs.');
  require(plan.source.key !== plan.targetKey && (plan.before === null || readSaved(plan.before, plan.revision)), 'Invalid destination backup.');
  const after = readSaved(plan.after, plan.revision);
  require(after && after.notes.length <= MAX_NOTES && plan.before !== plan.after, 'Invalid proposed destination.');
  if (plan.before !== null) require(JSON.stringify({...readSaved(plan.before, plan.revision), notes:after.notes}) === plan.after, 'A note copy cannot change saved selections.');
  return plan;
}
export function commitCopy(storage, plan, token) {
  validatePlan(plan);
  require(typeof token === 'string' && /^[a-f0-9-]{36}$/.test(token), 'Secure recovery identity unavailable.');
  const journalKey = JOURNAL + token;
  require(storage.getItem(journalKey) === null, 'Recovery identity already exists.');
  sourceCurrent(storage, plan.source);
  require(storage.getItem(plan.targetKey) === plan.before, 'Destination changed. Prepare a new preview.');
  const raw = JSON.stringify(plan);
  require(new TextEncoder().encode(raw).byteLength <= MAX_FILE, 'Recovery record is too large. No destination write attempted.');
  readJournal(raw);
  // Persist the complete before/after record first. Never clean it up on a failed write.
  storage.setItem(journalKey, raw);
  require(storage.getItem(journalKey) === raw, 'Recovery backup could not be verified. No destination write attempted.');
  sourceCurrent(storage, plan.source);
  require(storage.getItem(plan.targetKey) === plan.before, 'Destination changed after backup. Nothing was copied.');
  storage.setItem(plan.targetKey, plan.after);
  require(storage.getItem(plan.targetKey) === plan.after, 'Destination changed during copy. Check recovery; do not repeat blindly.');
  return journalKey;
}
export function readJournal(raw) { return validatePlan(boundedJSON(raw, MAX_FILE)); }
export function undoCopy(storage, journalKey, expectedRaw) {
  require(typeof journalKey === 'string' && new RegExp('^' + JOURNAL.replaceAll('.', '\\.') + '[a-f0-9-]{36}$').test(journalKey), 'Invalid recovery identity.');
  require(storage.getItem(journalKey) === expectedRaw, 'Recovery record changed. Refresh first.');
  const plan = readJournal(expectedRaw);
  require(storage.getItem(plan.targetKey) === plan.after, 'Destination has changed since this copy. Undo refused; export recovery instead.');
  if (plan.before === null) storage.removeItem(plan.targetKey); else storage.setItem(plan.targetKey, plan.before);
  require(storage.getItem(plan.targetKey) === plan.before, 'Undo could not be verified. Keep the recovery file.');
  // The immutable journal remains exportable, including after a crash or failed write.
  return plan;
}
