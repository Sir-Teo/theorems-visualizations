// Bounded bibliographic discovery. A record is not the work, its rights, or evidence of reading it.
import {createHash} from 'node:crypto';

export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const insist = (ok, message) => { if (!ok) throw new Error(message); };
const text = x => typeof x === 'string' && x.trim().length > 0;
const list = x => { insist(Array.isArray(x) && x.every(text), 'Expected text array'); return [...x]; };
export const recordKey = (provider, id) => JSON.stringify([provider, provider === 'crossref' ? id.toLowerCase() : id]);

export function endpoint(provider, id) {
  if (provider === 'openlibrary') {
    insist(/^\/(?:works\/OL\d+W|books\/OL\d+M)$/.test(id), 'Use one exact Open Library work or edition');
    return 'https://openlibrary.org' + id + '.json';
  }
  insist(provider === 'crossref' && /^10\.\d{4,9}\/[^\s?#]+$/.test(id), 'Use one exact Crossref DOI');
  return 'https://api.crossref.org/works/' + encodeURIComponent(id);
}

export function projectRecord(provider, id, raw) {
  endpoint(provider, id);
  if (provider === 'openlibrary') {
    insist(raw?.key === id && text(raw.title) && Number.isInteger(raw.revision), 'Record identity/revision mismatch');
    const kind = id.startsWith('/works/') ? 'work' : 'edition';
    insist(raw.type?.key === '/type/' + kind, 'Work/edition kind mismatch');
    const field = key => Object.hasOwn(raw, key) ? {state: 'present', values: list(raw[key])} : {state: 'absent', values: null};
    const works = raw.works ?? [];
    insist(Array.isArray(works) && works.every(w => /^\/works\/OL\d+W$/.test(w?.key)), 'Invalid linked work');
    return {provider, id, kind, title: raw.title, revision: raw.revision, url: 'https://openlibrary.org' + id,
      published: raw.publish_date ?? null, modified: raw.last_modified?.value ?? null,
      linkedWorks: works.map(w => w.key), subjects: field('subjects'), classifications: field('lc_classifications'),
      authority: null, scheduleEdition: null, holdings: null, workRead: false,
      scope: 'Catalog assertions only. Work and edition fields stay separate; labels do not establish controlled authority or physical holdings.'};
  }
  const m = raw?.message;
  insist(raw.status === 'ok' && m && text(m.DOI) && m.DOI.toLowerCase() === id.toLowerCase(), 'DOI response mismatch');
  const dates = {};
  for (const key of ['published', 'published-print', 'published-online', 'created', 'deposited', 'indexed']) {
    const v = m[key];
    if (v !== undefined) {
      insist(v && Array.isArray(v['date-parts']) && v['date-parts'].every(a => Array.isArray(a) && a.length >= 1 && a.length <= 3 && a.every(Number.isInteger)), 'Invalid deposited date');
      dates[key] = {'date-parts': structuredClone(v['date-parts'])};
      if (v['date-time'] !== undefined) { insist(text(v['date-time']), 'Invalid timestamp'); dates[key]['date-time'] = v['date-time']; }
    }
  }
  return {provider, id: m.DOI, kind: m.type, title: list(m.title)[0], container: list(m['container-title'] ?? []),
    publisher: m.publisher ?? null, language: m.language ?? null, dates,
    url: 'https://doi.org/' + encodeURI(m.DOI), workRead: false,
    scope: 'Deposited bibliographic metadata only. Indexing/deposit dates are not publication dates; no abstract, article, clinical conclusion or reuse permission is imported.'};
}

export function validateCatalog(catalog) {
  insist(catalog?.schemaVersion === 1 && catalog.mode === 'local-snapshot' && Array.isArray(catalog.records), 'Invalid discovery catalog');
  const keys = new Set();
  for (const entry of catalog.records) {
    const {record, capture, projectionSha256} = entry;
    const key = recordKey(record.provider, record.id);
    insist(!keys.has(key), 'Duplicate provider identity'); keys.add(key);
    endpoint(record.provider, record.id);
    insist(text(record.title) && record.workRead === false, 'Metadata cannot claim a work was read');
    insist(capture?.status === 200 && /^\d{4}-\d{2}-\d{2}$/.test(capture.readOn) && /^[a-f0-9]{64}$/.test(capture.sha256), 'Missing successful capture binding');
    insist(sha(JSON.stringify(record)) === projectionSha256, 'Changed selected metadata');
    insist(Array.isArray(entry.domainIds) && entry.domainIds.length && entry.domainIds.every(x => /^D(?:0[1-9]|[12]\d|30)$/.test(x)), 'Invalid editorial domain route');
  }
  return {providers: new Set(catalog.records.map(x => x.record.provider)).size, records: keys.size, importedWorks: 0};
}

// Explicit one-record lookup only. Builds and readers never call this function.
export async function captureRecord(provider, id, {fetcher = fetch, now = () => new Date(), maxBytes = 2_000_000} = {}) {
  const url = endpoint(provider, id);
  const response = await fetcher(url, {redirect: 'error', signal: AbortSignal.timeout(20000), headers: {'Accept': 'application/json', 'User-Agent': 'AtlasLocalDiscovery/1.0 (single user-requested lookup)'}});
  insist(response.ok, 'Access stopped at HTTP ' + response.status + '; no automatic retry');
  insist(/application\/json/i.test(response.headers.get('content-type') || ''), 'Access stopped: expected JSON');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; insist(size <= maxBytes, 'Response too large; lookup stopped'); chunks.push(chunk); }
  const bytes = Buffer.concat(chunks), raw = JSON.parse(bytes.toString('utf8')), record = projectRecord(provider, id, raw);
  return {capture: {url, finalUrl: response.url || url, status: response.status, readOn: now().toISOString().slice(0, 10), bytes: bytes.length, sha256: sha(bytes)}, record,
    projectionSha256: sha(JSON.stringify(record)), scope: 'Candidate metadata selection. Inspect before registering it; no automatic acceptance or source freshness claim.'};
}

export function searchCatalog(catalog, query = '', provider = '') {
  validateCatalog(catalog);
  const q = query.trim().toLocaleLowerCase('en');
  return catalog.records.filter(e => (!provider || e.record.provider === provider) &&
    [e.record.title, e.record.id, ...(e.record.subjects?.values ?? [])].join(' ').toLocaleLowerCase('en').includes(q));
}
