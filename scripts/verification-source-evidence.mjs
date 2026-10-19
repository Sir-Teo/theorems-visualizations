// Source-review census. This never edits content flags or the shared source queue.
// node scripts/verification-source-evidence.mjs [--write | --check]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ID_RE, loadAll, ROOT } from './lib.mjs';

const DIR = 'docs/verification';
const REQUIRED = [
  'geology-owned-source-ledger.json', 'circuits-owned-source-disposition.json',
  'economics-social-owned-source-ledger.json', 'pure-math-source-alignment.json',
  'fa-source-alignment.json', 'physics-source-status.json', 'bio-followup-status.json',
  'physics-source-acquisition-pass.json',
];
const sort = (a, b) => a.localeCompare(b, 'en');
const strings = value => (Array.isArray(value) ? value.flatMap(strings) : typeof value === 'string' && value.trim() ? [value.trim()] : []);
const reportPath = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const path = value.trim();
  return path.startsWith('docs/') ? path : `${DIR}/${path}`;
};

export function normalizeStatus(raw, context = {}) {
  if (typeof raw !== 'string') return 'unknown';
  const status = raw.toLowerCase().replaceAll('_', '-');
  if (status === 'closed' || status.startsWith('closed:')) return 'closed';
  if (['reviewed-blocked', 'retained-source-gap'].includes(status)) return 'reviewed-blocked';
  if (status === 'retained' && ['reviewed', 'reviewed-blocked'].includes(context.reviewState)) return 'reviewed-blocked';
  if (status === 'transferred') return 'transferred';
  if (['unreviewed', 'pending', 'genuinely-unreviewed'].includes(status)) return 'unreviewed';
  return 'unknown';
}

// Explicit schema adapters: group membership supplies a status only where the
// ledger itself defines that group. Reports below are documented companion
// reports for alignment files whose original schema has no report field.
export function ledgerRecords(path, data) {
  const records = [];
  const add = (value, pointer, groupStatus, companionReport) => {
    const entry = typeof value === 'string' ? { id: value } : value;
    if (!entry || typeof entry !== 'object') {
      records.push({ ledger: path, pointer, id: null, rawStatus: null, status: 'unknown', report: null, missingEvidence: [] });
      return;
    }
    const rawStatus = entry.status ?? entry.disposition ?? groupStatus ?? null;
    const companion = typeof companionReport === 'function' ? companionReport(entry) : companionReport;
    const report = reportPath(entry.report ?? entry.reportpath ?? companion);
    records.push({
      ledger: path, pointer, id: entry.id ?? null, rawStatus,
      status: normalizeStatus(rawStatus, entry), report,
      reportOrigin: entry.report || entry.reportpath ? 'record' : companion ? 'documented-companion' : null,
      missingEvidence: strings(entry.missingEvidence ?? entry.missingFullSourceOrClaim ?? entry.missingSource ?? entry.sourceGap?.missingSource ?? entry.blocker ?? entry.gap),
      ...(entry.sourceGap?.claim ? { claim: entry.sourceGap.claim } : {}),
      ...(entry.owner ? { owner: entry.owner } : {}),
    });
  };
  const group = (key, status, report) => {
    for (const [i, entry] of (data[key] ?? []).entries()) add(entry, `#/${key}/${i}`, status, report);
  };
  if (Array.isArray(data)) {
    for (const [i, entry] of data.entries()) {
      const companion = path.endsWith('/pure-math-source-alignment.json') ? `${DIR}/pure-math-source-review.md`
        : path.endsWith('/fa-source-alignment.json') ? e => `${DIR}/${/^fa-1[23]\./.test(e.id) ? 'fa12-13-source-review.md' : 'fa-source-review.md'}` : null;
      add(entry, `#/${i}`, null, companion);
    }
  } else if (path.endsWith('/geology-owned-source-ledger.json') || path.endsWith('/physics-source-acquisition-pass.json')) group('entries');
  else if (path.endsWith('/circuits-owned-source-disposition.json') || path.endsWith('/economics-social-owned-source-ledger.json')) {
    group('retained'); group('additionalReviewedClosed', 'closed'); group('genuinelyUnreviewed', 'unreviewed');
  } else if (path.endsWith('/physics-source-status.json')) {
    group('reviewedBlocked', 'reviewed-blocked'); group('genuinelyUnreviewed', 'unreviewed');
  } else if (path.endsWith('/bio-followup-status.json')) {
    group('items'); group('priorCohortRetained'); group('genuinelyUnreviewed', 'unreviewed');
  } else if (path.endsWith('/fa12-13-closures.json')) {
    group('closedOriginalFlags', 'closed', `${DIR}/fa12-13-source-review.md`);
  } else {
    group('items'); group('genuinelyUnreviewed', 'unreviewed');
  }
  return records;
}

export function buildCensus({ items, ledgers, queue, reportExists }) {
  const byId = new Map(items.map(item => [item.id, item]));
  if (byId.size !== items.length) throw new Error('Duplicate live IDs: source census cannot reconcile ambiguous content.');
  const issues = [];
  const records = [];
  const sources = [];
  for (const ledger of [...ledgers].sort((a, b) => sort(a.path, b.path))) {
    if (!ledger.data) {
      issues.push({ type: 'missing-ledger', ledger: ledger.path });
      sources.push({ path: ledger.path, exists: false, records: 0 });
      continue;
    }
    const entries = ledgerRecords(ledger.path, ledger.data);
    sources.push({ path: ledger.path, exists: true, sha256: ledger.sha256 ?? null, records: entries.length });
    if (!entries.length) issues.push({ type: 'empty-or-unsupported-ledger', ledger: ledger.path });
    for (const record of entries) {
      const ref = `${record.ledger}${record.pointer}`;
      record.ref = ref;
      record.reportExists = !!record.report && reportExists(record.report);
      record.substantiveBlockedRecord = record.status === 'reviewed-blocked' && record.reportExists && record.missingEvidence.length > 0;
      if (!ID_RE.test(record.id ?? '')) issues.push({ type: 'invalid-id', record: ref, id: record.id });
      else if (!byId.has(record.id)) issues.push({ type: 'unknown-live-id', record: ref, id: record.id });
      if (record.status === 'unknown') issues.push({ type: 'unknown-status', record: ref, id: record.id, rawStatus: record.rawStatus });
      if (['closed', 'reviewed-blocked'].includes(record.status) && !record.reportExists) {
        issues.push({ type: record.report ? 'missing-report-file' : 'missing-report-link', record: ref, id: record.id, report: record.report });
      }
      if (record.status === 'reviewed-blocked' && !record.missingEvidence.length) issues.push({ type: 'missing-evidence-gap', record: ref, id: record.id });
      const item = byId.get(record.id);
      if (item?.verify === true && record.status === 'closed') issues.push({ type: 'closed-record-still-flagged', record: ref, id: record.id });
      if (item && item.verify !== true && record.status === 'reviewed-blocked') issues.push({ type: 'blocked-record-no-live-flag', record: ref, id: record.id });
      records.push(record);
    }
  }
  const recordsById = new Map();
  for (const record of records) {
    if (!recordsById.has(record.id)) recordsById.set(record.id, []);
    recordsById.get(record.id).push(record);
  }
  const open = items.filter(item => item.verify === true).sort((a, b) => sort(a.id, b.id)).map(item => {
    const evidence = recordsById.get(item.id) ?? [];
    const blocked = evidence.filter(record => record.substantiveBlockedRecord);
    return {
      id: item.id, file: item.file, name: item.name,
      status: blocked.length ? 'reviewed-blocked' : 'unreviewed',
      remainsOpen: true,
      ...(blocked.length ? {} : { reason: !evidence.length ? 'no-ledger-record' : evidence.every(r => r.status === 'transferred') ? 'only-transfer-records' : 'no-substantive-reviewed-blocked-record' }),
      evidence: evidence.map(record => record.ref),
      reports: [...new Set(blocked.map(record => record.report))].sort(sort),
      missingEvidence: [...new Set(blocked.flatMap(record => record.missingEvidence))].sort(sort),
      ...(evidence.some(record => record.status === 'closed') ? { contradictoryClosedRecord: true } : {}),
    };
  });
  const currentQueue = items.filter(item => item.verify === true).map(item => ({ id: item.id, file: item.file, name: item.name, refs: item.refs || [] })).sort((a, b) => sort(a.id, b.id));
  const queued = new Map((queue?.queue ?? []).map(item => [item.id, item]));
  const current = new Map(currentQueue.map(item => [item.id, item]));
  const queueState = {
    path: `${DIR}/open-source-reviews.json`, exists: !!queue,
    recordedWrittenItems: queue?.writtenItems ?? null, liveWrittenItems: items.length,
    recordedRemaining: queue?.remaining ?? null, liveRemaining: open.length,
    duplicateIds: [...new Set((queue?.queue ?? []).map(item => item.id))].filter(id => (queue?.queue ?? []).filter(item => item.id === id).length > 1).sort(sort),
    missingFromQueue: [...current.keys()].filter(id => !queued.has(id)).sort(sort),
    noLongerFlagged: [...queued.keys()].filter(id => !current.has(id)).sort(sort),
    changedMetadata: [...current.keys()].filter(id => queued.has(id) && JSON.stringify(current.get(id)) !== JSON.stringify(queued.get(id))).sort(sort),
  };
  queueState.matchesLive = queueState.exists && queueState.recordedWrittenItems === items.length && queueState.recordedRemaining === open.length && !queueState.duplicateIds.length && !queueState.missingFromQueue.length && !queueState.noLongerFlagged.length && !queueState.changedMetadata.length;
  const count = status => open.filter(item => item.status === status).length;
  const byCollection = Object.fromEntries([...new Set(open.map(item => item.id.split('-')[0]))].sort(sort).map(col => {
    const subset = open.filter(item => item.id.startsWith(`${col}-`));
    return [col, { open: subset.length, reviewedBlocked: subset.filter(item => item.status === 'reviewed-blocked').length, unreviewed: subset.filter(item => item.status === 'unreviewed').length }];
  }));
  return {
    schemaVersion: 1,
    meaning: 'Live verify:true flags are authoritative. Reviewed-blocked means an explicit review status, a nonempty evidence gap and an existing report are recorded; the source check remains open. Unreviewed means this census has no such substantive record, not proof that no review occurred. Ledger closures are recorded claims, never inferred from tests and never applied to content.',
    reproduction: 'node scripts/verification-source-evidence.mjs --write; node scripts/verification-source-evidence.mjs --check',
    summary: { writtenItems: items.length, open: open.length, reviewedBlocked: count('reviewed-blocked'), unreviewed: count('unreviewed'), ledgerRecords: records.length, recordedClosed: records.filter(r => r.status === 'closed').length, issues: issues.length },
    queue: queueState, byCollection, sources, open,
    records: records.sort((a, b) => sort(a.id ?? '', b.id ?? '') || sort(a.ref, b.ref)),
    issues: issues.sort((a, b) => sort(JSON.stringify(a), JSON.stringify(b))),
  };
}

export async function main(args = process.argv.slice(2)) {
  if (args.some(arg => !['--write', '--check'].includes(arg)) || (args.includes('--write') && args.includes('--check'))) throw new Error('Usage: node scripts/verification-source-evidence.mjs [--write | --check]');
  const { items, problems } = await loadAll();
  if (problems.some(problem => problem.level === 'error')) throw new Error('Content imports have errors; source census was not rewritten.');
  const names = [...new Set([...REQUIRED, ...readdirSync(join(ROOT, DIR)).filter(name => name.endsWith('-source-status.json') || name === 'fa12-13-closures.json')])].sort(sort);
  const ledgers = names.map(name => {
    const path = `${DIR}/${name}`;
    if (!existsSync(join(ROOT, path))) return { path, data: null };
    const raw = readFileSync(join(ROOT, path), 'utf8');
    return { path, data: JSON.parse(raw), sha256: createHash('sha256').update(raw).digest('hex') };
  });
  const queuePath = join(ROOT, DIR, 'open-source-reviews.json');
  const queue = existsSync(queuePath) ? JSON.parse(readFileSync(queuePath, 'utf8')) : null;
  const data = buildCensus({ items, ledgers, queue, reportExists: path => existsSync(join(ROOT, path)) });
  const path = join(ROOT, DIR, 'source-evidence.json');
  const json = JSON.stringify(data, null, 2) + '\n';
  if (args.includes('--write')) writeFileSync(path, json);
  if (args.includes('--check') && (!existsSync(path) || readFileSync(path, 'utf8') !== json)) throw new Error('Source evidence census is stale or missing. Review ledger/live-flag changes and regenerate with --write.');
  if (args.includes('--check') && data.summary.issues) throw new Error(`Source evidence census contains ${data.summary.issues} ledger integrity issues. See its issues array; source blockers themselves do not fail this check.`);
  if (args.includes('--check') && !data.queue.matchesLive) throw new Error('Shared source queue differs from live imports. Census records the drift but never rewrites the shared queue.');
  console.log(`${data.summary.open} open source checks: ${data.summary.reviewedBlocked} reviewed-blocked, ${data.summary.unreviewed} without substantive review records; ${data.summary.issues} ledger issues; shared queue ${data.queue.matchesLive ? 'current' : 'stale'}.`);
  return data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
