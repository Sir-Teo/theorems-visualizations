import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'docs/coverage/research/library-context-20261022.json';
const OUTPUT = 'coverage-references/library-context.json';
const requireThat = (x, message) => { if (!x) throw new Error(message); };
const text = x => typeof x === 'string' && x.trim().length > 0 && !/[\x00-\x1f]/.test(x);
const hash = x => createHash('sha256').update(x).digest('hex');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function edition(e) {
  requireThat(e && ['dated-edition', 'retrieval-snapshot'].includes(e.kind) && text(e.value), 'An explicit edition or snapshot is required');
  return [e.kind, e.value];
}

export function classificationKey(ref) {
  requireThat(ref?.kind === 'classification' && ['scheme', 'variant', 'code'].every(k => text(ref[k])), 'Classification requires scheme, variant and exact code');
  return JSON.stringify(['classification', ref.scheme, ref.variant, ...edition(ref.edition), ref.code]);
}

export function headingKey(ref) {
  requireThat(ref?.kind === 'subject-heading' && text(ref.authority) && text(ref.identifier), 'Heading requires authority and stable identifier');
  requireThat(Array.isArray(ref.labels) && ref.labels.length > 0 && ref.labels.every(l => text(l.text) && text(l.language)), 'Heading labels require text and declared language');
  return JSON.stringify(['subject-heading', ref.authority, ...edition(ref.edition), ref.identifier]);
}

export function validateResourceReferences(record, classifications, headings) {
  requireThat(record && text(record.catalog) && text(record.recordId), 'Resource needs a catalog and record identity');
  for (const [field, refs, key] of [['classifications', classifications, classificationKey], ['subjectHeadings', headings, headingKey]]) {
    requireThat(Array.isArray(record[field]), 'Separate classification and heading arrays are required');
    const keys = refs.map(key); requireThat(new Set(keys).size === keys.length, 'Duplicate authority reference');
    requireThat(new Set(record[field]).size === record[field].length && record[field].every(k => keys.includes(k)), 'Unknown or duplicate ' + field + ' reference');
  }
  return record;
}

export function buildLibraryReferences(bytes) {
  const source = JSON.parse(bytes);
  requireThat(source.schemaVersion === 1 && Array.isArray(source.sources), 'Unknown research packet');
  const specs = [
    ['proposedLccRoutes', 'lcc-outline', 'lcc', 'subclass-outline', 'retrieval-snapshot', 'snapshot'],
    ['archivedScheduleSamples', 'lcc-schedule', 'lcc', 'full-schedule', 'dated-edition', 'edition'],
    ['localSchemeComparisons', 'xwi7xwa-bc-brian-deer', 'brian-deer', 'xwi7xwa-british-columbia', 'dated-edition', 'edition'],
  ];
  const references = [];
  for (const [section, originalScheme, scheme, variant, editionKind, dateField] of specs) {
    requireThat(Array.isArray(source[section]), 'Missing research section');
    for (const [index, row] of source[section].entries()) {
      requireThat(row.scheme === originalScheme && text(row.code) && text(row[dateField]), 'Unexpected source namespace');
      requireThat(source.sources.filter(s => s.id === row.sourceId).length === 1, 'Source receipt must resolve uniquely');
      const ref = { kind: 'classification', scheme, variant, edition: { kind: editionKind, value: row[dateField] }, code: row.code,
        original: structuredClone(row), sourcePointer: '/' + section + '/' + index };
      references.push({ key: classificationKey(ref), ...ref });
    }
  }
  requireThat(new Set(references.map(r => r.key)).size === references.length, 'Duplicate classification identity');
  return { schemaVersion: 1, adapterVersion: '0.1.0',
    scope: 'Research-only references from three distinct evidence layers. Not canonical mappings, taught subjects, cataloging assignments, official equivalences or current community vocabulary.',
    source: { path: SOURCE, sha256: hash(bytes), packetId: source.id, packetVersion: source.version },
    sourceReceipts: structuredClone(source.sources),
    schemeIdentityPolicy: 'Scheme/variant labels are adapter identifiers; exact original source rows and editions remain attached. Retrieval snapshots are not official editions.',
    classifications: references, subjectHeadings: [], resourceRecords: [],
    counts: { outlineRows: source.proposedLccRoutes.length, archivedScheduleRows: source.archivedScheduleSamples.length,
      historicalLocalRows: source.localSchemeComparisons.length, referenceRows: references.length, importedHeadingRecords: 0, catalogRecords: 0 },
    retainedGates: structuredClone(source.retainedGates), accessLimits: structuredClone(source.unavailableCandidates) };
}

export function validateLibraryReferences(bundle, sourceBytes) {
  const expected = buildLibraryReferences(sourceBytes);
  requireThat(equal(bundle, expected), 'Adapter differs from exact research input; regenerate and review the change');
  return bundle.counts;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    requireThat(process.argv.length === 3 && ['--check', '--write'].includes(process.argv[2]), 'Usage: node scripts/coverage-references.mjs --check|--write');
    const bytes = await readFile(resolve(ROOT, SOURCE));
    const bundle = buildLibraryReferences(bytes);
    if (process.argv[2] === '--write') await writeFile(resolve(ROOT, OUTPUT), JSON.stringify(bundle, null, 2) + '\n');
    else validateLibraryReferences(JSON.parse(await readFile(resolve(ROOT, OUTPUT), 'utf8')), bytes);
    console.log(JSON.stringify({ result: 'PASS', mode: process.argv[2], counts: bundle.counts,
      scope: 'Local adapter reproducibility only. No source retrieval, canonical registry change, equivalence or acceptance.' }, null, 2));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
