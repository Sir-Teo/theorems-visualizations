import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (condition, message) => { if (!condition) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const safe = value => text(value) && !/[\\\x00-\x1f]/.test(value) && !value.startsWith('/') &&
  value.split('/').every(part => part && !['.', '..', '.git'].includes(part));
const hash = value => createHash('sha256').update(value).digest('hex');
const transitions = {
  'waiting-evidence': ['waiting-evidence', 'ready-for-review'],
  'ready-for-review': ['waiting-evidence', 'ready-for-review', 'closed'],
  closed: ['waiting-evidence'],
};

function binding(value) {
  fail(value && safe(value.path) && /^[a-f0-9]{64}$/.test(value.sha256) && text(value.locator), 'Invalid evidence binding');
}

export function validateStewardship(ledger) {
  fail(ledger?.schemaVersion === 1 && text(ledger.scope) && date(ledger.asOf) && Array.isArray(ledger.issues), 'Invalid stewardship ledger');
  const ids = new Set();
  for (const issue of ledger.issues) {
    fail(/^S\d{3,}$/.test(issue.id) && !ids.has(issue.id), 'Invalid or duplicate issue ID'); ids.add(issue.id);
    fail(/^P\d{2}-L\d{2}$/.test(issue.target), 'Invalid follow-up target');
    fail(['witness-provenance', 'source-discrepancy', 'freshness-gap', 'research-update'].includes(issue.kind), 'Invalid issue kind');
    for (const key of ['title', 'description', 'nextAction', 'editionTrigger']) fail(text(issue[key]), 'Missing issue ' + key);
    fail(text(issue.responsibility?.role) && (issue.responsibility.assignee === null || text(issue.responsibility.assignee)), 'Invalid responsibility');
    fail(Array.isArray(issue.accessStops) && issue.accessStops.every(text), 'Invalid access stops');
    fail(Array.isArray(issue.evidence) && issue.evidence.length > 0, 'Issue requires exact evidence'); issue.evidence.forEach(binding);
    fail(Array.isArray(issue.events) && issue.events.length > 0, 'Issue requires history');
    let prior;
    for (const [index, event] of issue.events.entries()) {
      fail(event.sequence === index + 1 && date(event.at) && event.at <= ledger.asOf && text(event.note), 'Invalid history sequence/date/note');
      fail(prior ? event.at >= prior.at && transitions[prior.state].includes(event.state) : event.state === 'waiting-evidence', 'Invalid issue transition');
      fail(Array.isArray(event.evidence), 'Missing event evidence'); event.evidence.forEach(binding);
      if (event.state === 'ready-for-review' || event.state === 'closed') fail(event.evidence.length > 0, 'Review transition requires exact evidence');
      if (event.state === 'closed') {
        const r = event.resolution;
        fail(r && ['corrected', 'retained-qualified', 'excluded'].includes(r.outcome) &&
          ['reviewer', 'role', 'rationale'].every(key => text(r[key])), 'Closure requires an explicit scoped reviewer decision');
      } else fail(event.resolution === undefined, 'Only closure may carry a resolution');
      prior = event;
    }
  }
  return ledger;
}

export function assertHistoryPreserved(previous, current) {
  validateStewardship(previous); validateStewardship(current);
  fail(current.asOf >= previous.asOf, 'Ledger date moved backward');
  for (const old of previous.issues) {
    const next = current.issues.find(issue => issue.id === old.id);
    fail(next && JSON.stringify(next.events.slice(0, old.events.length)) === JSON.stringify(old.events), 'Issue history removed or rewritten');
    const metadata = ({ events, ...rest }) => JSON.stringify(rest);
    fail(metadata(old) === metadata(next) || next.events.length > old.events.length, 'Metadata change requires a new history event');
    fail(next.target === old.target, 'Issue target identity changed');
    fail(old.accessStops.every(stop => next.accessStops.includes(stop)), 'Recorded access stop removed');
  }
}

export async function auditStewardship(ledger, asOf, read = path => readFile(resolve(ROOT, path))) {
  validateStewardship(ledger);
  fail(date(asOf) && asOf >= ledger.asOf, 'Audit date must be valid and no earlier than the ledger');
  const rows = [];
  for (const issue of ledger.issues) {
    const bindings = [...issue.evidence, ...issue.events.flatMap(event => event.evidence)];
    const problems = [];
    for (const evidence of bindings) {
      try {
        const bytes = await read(evidence.path);
        if (hash(bytes) !== evidence.sha256) problems.push({ path: evidence.path, problem: 'changed-bytes' });
        else if (!bytes.toString('utf8').includes(evidence.locator)) problems.push({ path: evidence.path, problem: 'missing-locator' });
      } catch { problems.push({ path: evidence.path, problem: 'unavailable-local-evidence' }); }
    }
    const last = issue.events.at(-1);
    rows.push({ id: issue.id, target: issue.target, title: issue.title, recordedState: last.state,
      evidenceState: problems.length ? 'needs-reconciliation' : 'matches-recorded-bytes',
      responsibility: issue.responsibility, daysSinceRecordedAction: (Date.parse(asOf) - Date.parse(last.at)) / 86400000,
      nextAction: issue.nextAction, editionTrigger: issue.editionTrigger, accessStops: issue.accessStops, problems });
  }
  return { schemaVersion: 1, asOf, scope: ledger.scope,
    counts: { tracked: rows.length, open: rows.filter(r => r.recordedState !== 'closed').length,
      recordedClosed: rows.filter(r => r.recordedState === 'closed').length,
      needingEvidenceReconciliation: rows.filter(r => r.problems.length).length,
      unassigned: rows.filter(r => r.responsibility.assignee === null).length },
    limits: 'Local evidence integrity and recorded workflow only. Age is time since an action, not source freshness. Matching bytes do not validate a claim or authenticate a reviewer. No network retrieval, publication, withdrawal or acceptance is performed.', rows };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    fail(process.argv.length === 4 && process.argv[2] === '--as-of', 'Usage: node scripts/stewardship.mjs --as-of YYYY-MM-DD');
    const path = 'stewardship/issues.json';
    const current = JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
    validateStewardship(current);
    const queue = JSON.parse(await readFile(resolve(ROOT, 'docs/pilots/sequences/queue.json'), 'utf8'));
    fail(current.issues.every(issue => queue.items.some(item => item.id === issue.target)), 'Unknown follow-up target');
    const tracked = execFileSync('git', ['ls-tree', '--name-only', 'HEAD', '--', path], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (tracked) assertHistoryPreserved(JSON.parse(execFileSync('git', ['show', 'HEAD:' + path], { cwd: ROOT, encoding: 'utf8' })), current);
    const report = await auditStewardship(current, process.argv[3]);
    console.log(JSON.stringify(report, null, 2));
    if (report.counts.needingEvidenceReconciliation) process.exitCode = 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
