import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { conditionalVisualEvidence, normalizeInspectionLedger } from '../scripts/verification-conditional-visual-evidence.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jqQAAAABJRU5ErkJggg==', 'base64');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const id = 'test-1.1';
const shot = (index, filename, bytes = png) => ({ index, phase: index ? 'restore' : 'default', conditional: index > 0, screenshot: filename, sha256: sha(bytes) });
const row = (theme, states) => ({ id, theme, status: 'passed', unresolvedControls: [], states, before: { contentHash: 'new-source' } });
const capture = (theme, states) => ({ path: `${theme}.json`, report: { schemaVersion: 1, complete: true, results: [row(theme, states)] } });
const ledger = rows => ({ path: 'review.json', report: { reviewer: 'agent', rows } });
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'atlas-visual-evidence-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, 'old.png'), png);
  return root;
}
const run = (root, captures, ledgers, expectedIds = [id]) => conditionalVisualEvidence({ root, captures, ledgers, expectedIds });

test('all four ledger shapes normalize, while findings and contact sheets cannot create image credit', () => {
  const image = shot(0, 'old.png'), base = { id, theme: 'light' };
  const reports = [
    { items: [{ ...base, screenshots: [{ stateIndex: 0, path: image.screenshot, sha256: image.sha256 }] }] },
    { entries: [{ ...base, states: [image] }] },
    { items: [{ id, themes: [{ theme: 'light', inspectedPngs: [{ index: 0, png: image.screenshot, sha256: image.sha256 }] }] }] },
    { rows: [{ ...base, states: [image] }] },
  ];
  for (const report of reports) {
    report.findings = [{ ...base, states: [image] }];
    report.contactSheets = [{ ...base, path: image.screenshot, digest: image.sha256 }];
    const normalized = normalizeInspectionLedger(report);
    assert.equal(normalized.images.length, 1);
    assert.equal(normalized.images[0].sha256, image.sha256);
    assert.equal(normalized.images[0].index, 0);
    assert.deepEqual(normalized.invalid, []);
  }
});

test('exact image identity survives changed collection hashes and deduplicates restoration images', t => {
  const root = fixture(t), states = [shot(0, 'old.png'), shot(1, 'old.png')];
  const captures = ['light', 'dark'].map(theme => capture(theme, states));
  const reviews = ledger([{ id, theme: 'light', contentHash: 'old-source', states: [shot(0, '/archived/old-location.png')] }]);
  const result = run(root, captures, [reviews]);
  assert.ok(Object.values(result.gates).every(Boolean));
  assert.deepEqual(result.summary, { requiredReferences: 4, currentUniqueImages: 1, reviewedReferences: 4, reviewedUniqueImages: 1, unreviewedReferences: 0 });
  assert.ok(result.reviewedImages.every(image => image.contentHash === 'new-source' && image.inspections[0].contentHash === 'old-source'));
  assert.equal(result.credit.source, false); assert.equal(result.credit.semantic, false); assert.equal(result.credit.human, false);
});

test('overwriting the same PNG path invalidates old inspection; an appended fresh review restores only exact-byte credit', t => {
  const root = fixture(t), changed = Buffer.concat([png, Buffer.from('new PNG metadata')]);
  const captures = ['light', 'dark'].map(theme => capture(theme, [shot(0, 'old.png')]));
  const old = ledger(['light', 'dark'].map(theme => ({ id, theme, states: [shot(0, 'old.png')] })));
  writeFileSync(join(root, 'old.png'), changed);
  const stale = run(root, captures, [old]);
  assert.equal(stale.summary.reviewedReferences, 0);
  assert.equal(stale.mismatchedImages.length, 2);
  assert.deepEqual(stale.mismatchedImages[0].inspectedHashes, [sha(png)]);
  const fresh = { path: 'refresh.json', report: { refreshRows: [{ id, theme: 'light', status: 'inspected', states: [shot(0, 'old.png', changed)] }] } };
  const result = run(root, captures, [old, fresh]);
  assert.equal(result.summary.reviewedReferences, 2);
  assert.equal(result.summary.reviewedUniqueImages, 1);
  assert.ok(Object.values(result.gates).every(Boolean));
});

test('pending or explicitly uninspected rows, missing hashes and summary totals cannot certify PNGs', t => {
  const root = fixture(t), image = shot(0, 'old.png');
  const reviews = { path: 'review.json', report: { inspectedPNGCount: 999, rows: [
    { id, theme: 'light', status: 'pending', states: [image] },
    { id, theme: 'dark', states: [{ ...image, inspected: false }] },
  ], refreshedRows: [{ id, theme: 'light', states: [{ ...image, sha256: undefined }] }] } };
  const result = run(root, ['light', 'dark'].map(theme => capture(theme, [image])), [reviews]);
  assert.equal(result.summary.reviewedReferences, 0);
  assert.equal(result.invalidClaims.length, 1);
  assert.equal(result.gates.validInspectionClaims, false);
  assert.equal(result.missingInspections.length, 2);
});

test('required missing PNGs fail even when their old bytes were inspected; uncaptured root/restoration alternatives are excluded', t => {
  const root = fixture(t), missing = shot(1, 'gone.png');
  const states = [shot(0, 'old.png'), missing, { index: 2, phase: 'choice', conditional: false }, { index: 3, phase: 'restore', conditional: false }];
  const result = run(root, ['light', 'dark'].map(theme => capture(theme, states)), [ledger([{ id, theme: 'light', states: [shot(0, 'old.png')] }])]);
  assert.equal(result.summary.requiredReferences, 4);
  assert.equal(result.summary.reviewedReferences, 2);
  assert.equal(result.missingImages.length, 2);
  assert.equal(result.gates.lightVisualImages, false); assert.equal(result.gates.darkVisualImages, false);
});

test('strict population gate cannot pass a partial, failed, unresolved or duplicate current capture', t => {
  const root = fixture(t), image = shot(0, 'old.png'), review = ledger([{ id, theme: 'light', states: [image] }]);
  const partial = capture('light', [image]); partial.report.complete = false;
  let result = run(root, [partial], [review], [id, 'test-1.2']);
  assert.equal(result.gates.completeCapturePopulation, false);
  assert.equal(result.missingItemThemes.length, 3);
  const invalid = capture('light', [image, image]); invalid.report.results[0].status = 'unresolved'; invalid.report.results[0].unresolvedControls = [{ key: 'hidden' }];
  result = run(root, [invalid, capture('light', [image]), capture('dark', [image])], [review]);
  assert.equal(result.gates.completeCapturePopulation, false);
  assert.ok(result.captureIssues.some(issue => /unresolved/.test(issue.reason)));
  assert.ok(result.captureIssues.some(issue => /screenshot-state index/.test(issue.reason)));
  assert.ok(result.captureIssues.some(issue => /Duplicate current/.test(issue.reason)));
});

test('CLI writes its census and strict mode rejects incomplete population even when supplied PNGs were inspected', t => {
  const root = fixture(t), inventory = JSON.parse(readFileSync(new URL('../docs/verification/conditional-control-inventory.json', import.meta.url)));
  const actualId = inventory.items[0].id, image = shot(0, join(root, 'old.png'));
  const captures = ['light', 'dark'].map(theme => {
    const report = capture(theme, [image]).report; report.results[0].id = actualId;
    const path = join(root, `${theme}.json`); writeFileSync(path, JSON.stringify(report)); return path;
  });
  const review = join(root, 'review.json'), output = join(root, 'census.json');
  writeFileSync(review, JSON.stringify(ledger([{ id: actualId, theme: 'light', states: [image] }]).report));
  const script = fileURLToPath(new URL('../scripts/verification-conditional-visual-evidence.mjs', import.meta.url));
  const args = [script, review, `--light=${captures[0]}`, `--dark=${captures[1]}`, `--write=${output}`];
  const loose = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(loose.status, 0, loose.stderr);
  const result = JSON.parse(readFileSync(output));
  assert.equal(result.summary.reviewedReferences, 2);
  assert.equal(result.missingItemThemes.length, 2 * (inventory.items.length - 1));
  const strict = spawnSync(process.execPath, [...args, '--strict'], { encoding: 'utf8' });
  assert.equal(strict.status, 1, strict.stderr);
});
