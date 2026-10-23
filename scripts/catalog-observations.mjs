import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assert = (x, message) => { if (!x) throw new Error(message); };
const text = x => typeof x === 'string' && x.length > 0;
const hash = x => createHash('sha256').update(x).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Observation identities refer to fields of a captured catalog record, not authority records.
export function observeCatalogRecord(record, subjectIndexes) {
  assert(record && /^\/(books\/OL\d+M|works\/OL\d+W)$/.test(record.key), 'Invalid catalog record identity');
  assert(record.type?.key === (record.key.startsWith('/books/') ? '/type/edition' : '/type/work'), 'Record kind mismatch');
  assert(Number.isInteger(record.revision) && record.revision > 0 && text(record.title), 'Missing catalog revision/title');
  assert(Array.isArray(subjectIndexes) && new Set(subjectIndexes).size === subjectIndexes.length, 'Invalid subject selection');
  const field = name => {
    if (!Object.hasOwn(record, name)) return { state: 'absent', values: null };
    assert(Array.isArray(record[name]) && record[name].every(text), 'Malformed catalog field: ' + name);
    return { state: 'present', values: [...record[name]] };
  };
  const subjects = field('subjects'), classifications = field('lc_classifications');
  assert(subjectIndexes.every(i => Number.isInteger(i) && i >= 0 && subjects.values && i < subjects.values.length), 'Subject selection outside observed field');
  const linkedWorks = record.works ?? [];
  assert(Array.isArray(linkedWorks) && linkedWorks.every(w => /^\/works\/OL\d+W$/.test(w?.key)), 'Invalid linked work');
  return { catalog: 'Open Library', recordId: record.key, recordKind: record.type.key, revision: record.revision,
    title: record.title, publishDate: record.publish_date ?? null, lastModified: record.last_modified?.value ?? null,
    linkedWorkIds: linkedWorks.map(w => w.key),
    classificationField: { name: 'lc_classifications', ...classifications, schemeEdition: null, physicalLocation: null,
      interpretation: 'Reported catalog values only; no independent classification assignment, schedule edition or shelf location is established.' },
    subjectField: { name: 'subjects', state: subjects.state, totalValues: subjects.values?.length ?? null,
      selected: subjectIndexes.map(index => ({ index, value: subjects.values[index], authority: null, authorityIdentifier: null, labelLanguage: null })),
      interpretation: 'Record-local labels; no authority identity, controlled vocabulary or per-label language is inferred.' } };
}

export async function checkCatalogPacket(packet, sourceDir) {
  assert(packet.schemaVersion === 1 && packet.status === 'research-preparation', 'Unknown catalog packet');
  assert(Array.isArray(packet.records) && packet.records.length > 0, 'Missing captured records');
  const ids = new Set();
  for (const entry of packet.records) {
    const capture = entry.capture;
    assert(/^[a-z0-9-]+\.body$/.test(capture?.filename) && /^[a-f0-9]{64}$/.test(capture.sha256), 'Invalid capture binding');
    const bytes = await readFile(resolve(sourceDir, capture.filename));
    assert(bytes.length === capture.bytes && hash(bytes) === capture.sha256, 'Changed captured source bytes');
    let record = JSON.parse(bytes);
    if (entry.entryIndex !== null) {
      assert(Number.isInteger(entry.entryIndex) && entry.entryIndex >= 0 && Array.isArray(record.entries) && entry.entryIndex < record.entries.length, 'Invalid list entry locator');
      record = record.entries[entry.entryIndex];
    }
    const actual = observeCatalogRecord(record, entry.subjectIndexes);
    assert(!ids.has(actual.recordId), 'Duplicate captured record'); ids.add(actual.recordId);
    assert(same(actual, entry.observation), 'Selected catalog observation differs');
  }
  return { result: 'PASS', capturedRecords: ids.size, importedAuthorityRecords: 0,
    scope: 'Pinned metadata selections only; no authority resolution, physical holdings, source-content accuracy or publication decision.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert(process.argv.length === 4 && process.argv[2] === '--source-dir', 'Usage: node scripts/catalog-observations.mjs --source-dir PATH');
    const packet = JSON.parse(await readFile(resolve(ROOT, 'docs/coverage/research/catalog-record-20261023/packet.json'), 'utf8'));
    console.log(JSON.stringify(await checkCatalogPacket(packet, process.argv[3]), null, 2));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
