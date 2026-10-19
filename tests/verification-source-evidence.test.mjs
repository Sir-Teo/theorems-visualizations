import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { buildCensus, ledgerRecords, normalizeStatus } from '../scripts/verification-source-evidence.mjs';

const item = (id, verify = true) => ({ id, verify, file: `content/${id.split('-')[0]}/ch03.js`, name: id, refs: [] });
const ledger = entries => ({ path: 'docs/verification/geology-owned-source-ledger.json', data: { entries } });
const census = (items, entries, reportExists = () => true, queue = null) => buildCensus({ items, ledgers: [ledger(entries)], queue, reportExists });

test('explicit status aliases normalize without treating test results as closure', () => {
  assert.equal(normalizeStatus('closed: full source read'), 'closed');
  assert.equal(normalizeStatus('retained_source_gap'), 'reviewed-blocked');
  assert.equal(normalizeStatus('retained', { reviewState: 'reviewed' }), 'reviewed-blocked');
  assert.equal(normalizeStatus('retained'), 'unknown');
  assert.equal(normalizeStatus('passed'), 'unknown');
});

test('blocked review requires both a recorded source gap and an existing report', () => {
  const entries = [
    { id: 'geol-3.1', status: 'reviewed-blocked', report: 'geol.md', missingEvidence: 'Full original table not yet acquired.' },
    { id: 'geol-3.2', status: 'reviewed-blocked', report: 'missing.md', missingEvidence: 'Full original proof not yet acquired.' },
    { id: 'geol-3.3', status: 'reviewed-blocked', report: 'geol.md' },
    { id: 'geol-3.4', status: 'closed', numericalChecks: 'passed' },
  ];
  const result = census(entries.map(e => item(e.id)), entries, path => !path.endsWith('missing.md'));
  assert.deepEqual(result.open.map(e => e.status), ['reviewed-blocked', 'unreviewed', 'unreviewed', 'unreviewed']);
  assert.ok(result.open.every(e => e.remainsOpen));
  assert.ok(result.issues.some(e => e.type === 'missing-report-file'));
  assert.ok(result.issues.some(e => e.type === 'missing-evidence-gap'));
  assert.ok(result.issues.some(e => e.type === 'closed-record-still-flagged'));
});

test('successor evidence overrides a transfer-only gap without discarding either record', () => {
  const result = buildCensus({ items: [item('neuro-3.1')], reportExists: () => true, queue: null, ledgers: [
    ledger([{ id: 'neuro-3.1', disposition: 'transferred' }]),
    { path: 'docs/verification/bio-followup-status.json', data: { items: [{ id: 'neuro-3.1', status: 'retained_source_gap', report: 'neuro.md', sourceGap: { missingSource: 'Complete original experiment.' } }] } },
  ] });
  assert.equal(result.open[0].status, 'reviewed-blocked');
  assert.equal(result.open[0].evidence.length, 2);
  assert.equal(result.records.length, 2);
  assert.equal(census([item('neuro-3.1')], [{ id: 'neuro-3.1', disposition: 'transferred' }]).open[0].reason, 'only-transfer-records');
});

test('all nested cohorts, source-gap aliases and documented companion reports are retained', () => {
  const bio = ledgerRecords('docs/verification/bio-followup-status.json', { items: [], priorCohortRetained: [{ id: 'geo-3.9', status: 'retained_source_gap', missingSource: 'Holland original', report: 'geo.md' }] });
  assert.equal(bio[0].id, 'geo-3.9');
  assert.deepEqual(bio[0].missingEvidence, ['Holland original']);
  const physics = ledgerRecords('docs/verification/physics-source-status.json', { reviewedBlocked: [{ id: 'rel-1.3', missingFullSourceOrClaim: 'Complete experiment', report: 'rel.md' }] });
  assert.equal(physics[0].status, 'reviewed-blocked');
  const math = ledgerRecords('docs/verification/pure-math-source-alignment.json', [{ id: 'dg-3.12', status: 'reviewed-blocked', gap: 'Equality case' }]);
  assert.equal(math[0].report, 'docs/verification/pure-math-source-review.md');
  assert.equal(math[0].reportOrigin, 'documented-companion');
});

test('unknown IDs/statuses and stale retained records surface as issues', () => {
  const result = census([item('geol-3.1', false)], [
    { id: 'geol-3.1', status: 'reviewed-blocked', missingEvidence: 'Original source', report: 'geol.md' },
    { id: 'geol-3.99', status: 'mystery' },
  ]);
  assert.equal(result.open.length, 0);
  assert.ok(result.issues.some(e => e.type === 'blocked-record-no-live-flag'));
  assert.ok(result.issues.some(e => e.type === 'unknown-live-id'));
  assert.ok(result.issues.some(e => e.type === 'unknown-status'));
});

test('queue differences and census serialization are deterministic and do not mutate inputs', () => {
  const items = [item('geol-3.2'), item('geol-3.1')];
  const entries = [{ id: 'geol-3.1', status: 'closed', report: 'geol.md' }];
  const queue = { writtenItems: 2, remaining: 2, queue: [{ id: 'geol-3.1', file: 'old.js', name: 'old', refs: [] }, item('geol-3.3')] };
  const before = JSON.stringify({ items, entries, queue });
  const first = census(items, entries, undefined, queue);
  assert.deepEqual(first.queue.missingFromQueue, ['geol-3.2']);
  assert.deepEqual(first.queue.noLongerFlagged, ['geol-3.3']);
  assert.deepEqual(first.queue.changedMetadata, ['geol-3.1']);
  assert.equal(first.queue.matchesLive, false);
  assert.equal(JSON.stringify(first), JSON.stringify(census(items, entries, undefined, queue)));
  assert.equal(before, JSON.stringify({ items, entries, queue }));
  assert.throws(() => census([item('geol-3.1'), item('geol-3.1')], []), /Duplicate live IDs/);
});

test('CLI writes deterministic evidence and rejects stale output, queue drift and invalid ledger records', () => {
  const root = mkdtempSync(join(tmpdir(), 'source-census-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'docs/verification'), { recursive: true });
    copyFileSync(new URL('../scripts/verification-source-evidence.mjs', import.meta.url), join(root, 'scripts/verification-source-evidence.mjs'));
    const live = item('geol-3.1');
    writeFileSync(join(root, 'scripts/lib.mjs'), `export const ROOT=${JSON.stringify(root)}; export const ID_RE=/^[a-z]+-\\d+\\.\\d+$/; export async function loadAll(){return {items:[${JSON.stringify(live)}],problems:[]}}`);
    const entry = { id: live.id, status: 'reviewed-blocked', report: 'test.md', missingEvidence: 'Complete original table has not been acquired.' };
    const fixtures = {
      'geology-owned-source-ledger.json': { entries: [entry] },
      'circuits-owned-source-disposition.json': { retained: [entry] },
      'economics-social-owned-source-ledger.json': { retained: [entry] },
      'pure-math-source-alignment.json': [entry],
      'fa-source-alignment.json': [entry],
      'physics-source-status.json': { reviewedBlocked: [entry] },
      'physics-source-acquisition-pass.json': { entries: [entry] },
      'economics-social-acquisition-source-status.json': { items: [entry] },
      'bio-followup-status.json': { items: [entry] },
    };
    for (const [name, data] of Object.entries(fixtures)) writeFileSync(join(root, 'docs/verification', name), JSON.stringify(data));
    writeFileSync(join(root, 'docs/verification/test.md'), 'Inspected source and exact remaining claim.');
    const queuePath = join(root, 'docs/verification/open-source-reviews.json');
    const queue = { writtenItems: 1, remaining: 1, queue: [{ id: live.id, file: live.file, name: live.name, refs: live.refs }] };
    writeFileSync(queuePath, JSON.stringify(queue));
    const run = flag => spawnSync(process.execPath, [join(root, 'scripts/verification-source-evidence.mjs'), flag], { encoding: 'utf8' });
    assert.equal(run('--write').status, 0);
    const outputPath = join(root, 'docs/verification/source-evidence.json');
    const first = readFileSync(outputPath, 'utf8');
    assert.ok(JSON.parse(first).sources.some(source => source.path.endsWith('/economics-social-acquisition-source-status.json')), 'new source-status ledgers are discovered');
    assert.equal(run('--check').status, 0);
    assert.equal(run('--write').status, 0);
    assert.equal(readFileSync(outputPath, 'utf8'), first);
    writeFileSync(outputPath, '{}\n');
    assert.match(run('--check').stderr, /stale or missing/);
    run('--write');
    writeFileSync(queuePath, JSON.stringify({ ...queue, remaining: 0, queue: [] }));
    assert.match(run('--check').stderr, /stale or missing/);
    run('--write');
    assert.match(run('--check').stderr, /Shared source queue differs/);
    writeFileSync(queuePath, JSON.stringify(queue));
    writeFileSync(join(root, 'docs/verification/geology-owned-source-ledger.json'), JSON.stringify({ entries: [{ ...entry, status: 'mystery' }] }));
    run('--write');
    assert.match(run('--check').stderr, /ledger integrity issues/);
    assert.notEqual(run('--unsupported').status, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
