import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { validateStewardship, assertHistoryPreserved, auditStewardship } from '../scripts/stewardship.mjs';

const bytes = Buffer.from('# Witness\nUnresolved source issue.\n');
const evidence = { path: 'docs/witness.md', sha256: createHash('sha256').update(bytes).digest('hex'), locator: '# Witness' };
const fixture = () => ({ schemaVersion: 1, scope: 'Test issue, no publication.', asOf: '2026-10-23', issues: [{
  id: 'S001', target: 'P02-L03', kind: 'witness-provenance', title: 'Witness ambiguity', description: 'Two witnesses differ.',
  responsibility: { role: 'Source editor', assignee: null }, nextAction: 'Inspect exact provenance.', editionTrigger: 'Review changed attribution.',
  accessStops: ['Source A access stop.'], evidence: [structuredClone(evidence)],
  events: [{ sequence: 1, at: '2026-10-22', state: 'waiting-evidence', note: 'Recorded unresolved.', evidence: [] }],
}] });
const append = (x, state, extra = {}) => x.issues[0].events.push({ sequence: x.issues[0].events.length + 1,
  at: '2026-10-23', state, note: 'Explicit test decision.', evidence: [structuredClone(evidence)], ...extra });

test('the actual queue has four exact local evidence bindings, open and unassigned', async () => {
  const ledger = JSON.parse(await readFile(new URL('../stewardship/issues.json', import.meta.url)));
  const report = await auditStewardship(ledger, '2026-10-23');
  assert.deepEqual(report.counts, { tracked: 4, open: 4, recordedClosed: 0, needingEvidenceReconciliation: 0, unassigned: 4 });
  assert.deepEqual(ledger.issues.map(x => x.target), ['P02-L03', 'P05-L03', 'P03-L03', 'P01-L03']);
});

test('changed, absent and missing-locator evidence are distinguished without closing the issue', async () => {
  const x = fixture();
  let report = await auditStewardship(x, '2026-10-23', async () => Buffer.from('changed'));
  assert.equal(report.rows[0].problems[0].problem, 'changed-bytes');
  assert.equal(report.rows[0].recordedState, 'waiting-evidence');
  report = await auditStewardship(x, '2026-10-23', async () => { throw new Error('absent'); });
  assert.equal(report.rows[0].problems[0].problem, 'unavailable-local-evidence');
  x.issues[0].evidence[0].locator = '# Absent';
  report = await auditStewardship(x, '2026-10-23', async () => bytes);
  assert.equal(report.rows[0].problems[0].problem, 'missing-locator');
});

test('elapsed days never manufacture source freshness or resolution', async () => {
  const report = await auditStewardship(fixture(), '2026-11-01', async () => bytes);
  assert.equal(report.rows[0].daysSinceRecordedAction, 10);
  assert.equal(report.rows[0].evidenceState, 'matches-recorded-bytes');
  assert.equal(report.counts.open, 1);
  assert.match(report.limits, /not source freshness/);
  await assert.rejects(auditStewardship(fixture(), '2026-10-21'), /Audit date/);
  await assert.rejects(auditStewardship(fixture(), '2026-02-30'), /Audit date/);
});

test('duplicate IDs, unsafe references and invalid action histories fail', () => {
  for (const path of ['../outside', '/tmp/source', '.git/config', 'docs//source', 'docs\\source']) {
    const x = fixture(); x.issues[0].evidence[0].path = path;
    assert.throws(() => validateStewardship(x), /evidence binding/);
  }
  const duplicate = fixture(); duplicate.issues.push(structuredClone(duplicate.issues[0]));
  assert.throws(() => validateStewardship(duplicate), /duplicate/);
  for (const patch of [{ sequence: 2 }, { at: '2026-10-24' }, { at: '2026-02-30' }, { state: 'closed' }]) {
    const x = fixture(); Object.assign(x.issues[0].events[0], patch);
    assert.throws(() => validateStewardship(x));
  }
});

test('closure requires review readiness, exact evidence and an explicit scoped decision; reopening retains history', () => {
  const direct = fixture(); append(direct, 'closed');
  assert.throws(() => validateStewardship(direct), /transition/);
  const x = fixture(); append(x, 'ready-for-review', { evidence: [] });
  assert.throws(() => validateStewardship(x), /exact evidence/);
  x.issues[0].events[1].evidence = [structuredClone(evidence)];
  append(x, 'closed');
  assert.throws(() => validateStewardship(x), /reviewer decision/);
  x.issues[0].events[2].resolution = { outcome: 'retained-qualified', reviewer: 'Fixture reviewer', role: 'Source editor', rationale: 'Keep the ambiguity explicit.' };
  validateStewardship(x);
  const old = structuredClone(x); append(x, 'waiting-evidence');
  assertHistoryPreserved(old, x);
});

test('committed histories and access stops cannot silently disappear or be rewritten', () => {
  const old = fixture();
  for (const mutate of [x => { x.issues = []; }, x => { x.issues[0].events[0].note = 'Changed'; },
    x => { x.issues[0].title = 'Silent revision'; }, x => { append(x, 'waiting-evidence'); x.issues[0].accessStops = []; },
    x => { append(x, 'waiting-evidence'); x.issues[0].target = 'P01-L03'; }]) {
    const x = structuredClone(old); mutate(x); assert.throws(() => assertHistoryPreserved(old, x));
  }
  const x = structuredClone(old); append(x, 'waiting-evidence'); x.issues[0].nextAction = 'A newly recorded action.';
  assertHistoryPreserved(old, x);
});

test('CLI validates targets, reports changed evidence as failure, and compares against committed history', async () => {
  const root = await mkdtemp(join(tmpdir(), 'atlas-stewardship-test-'));
  try {
    for (const path of ['scripts', 'stewardship', 'docs/pilots/sequences']) await mkdir(join(root, path), { recursive: true });
    await copyFile(new URL('../scripts/stewardship.mjs', import.meta.url), join(root, 'scripts/stewardship.mjs'));
    const x = fixture();
    const save = () => writeFile(join(root, 'stewardship/issues.json'), JSON.stringify(x));
    await save();
    await writeFile(join(root, 'docs/witness.md'), bytes);
    await writeFile(join(root, 'docs/pilots/sequences/queue.json'), JSON.stringify({ items: [{ id: 'P02-L03' }] }));
    const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
    git(['init']); git(['add', '.']);
    git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Fixture baseline']);
    const run = () => spawnSync(process.execPath, ['scripts/stewardship.mjs', '--as-of', '2026-10-23'], { cwd: root, encoding: 'utf8' });
    assert.equal(run().status, 0);
    await writeFile(join(root, 'docs/witness.md'), 'changed');
    const changed = run(); assert.equal(changed.status, 1);
    assert.equal(JSON.parse(changed.stdout).counts.needingEvidenceReconciliation, 1);
    await writeFile(join(root, 'docs/witness.md'), bytes);
    x.issues[0].events[0].note = 'Silently rewritten'; await save();
    assert.match(run().stderr, /history removed or rewritten/);
    x.issues[0].target = 'P99-L99'; await save();
    assert.match(run().stderr, /Unknown follow-up target/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
