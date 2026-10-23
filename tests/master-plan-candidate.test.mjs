import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateCandidateInventory, checkCandidateHtmlLinks } from '../scripts/check-master-plan-candidate.mjs';
const a = 'a'.repeat(64), b = 'b'.repeat(64), c = 'c'.repeat(64);
function fixture() {
  const base = { 'MASTER_PLAN.md': a, 'content/keep.js': a };
  const source = { 'MASTER_PLAN.md': b, 'content/keep.js': a, 'docs/new.md': c };
  const manifest = { schemaVersion: 1, mode: 'complete-universal-local-candidate', acceptedBaseCommit: 'a'.repeat(40), sourceCommit: 'b'.repeat(40),
    counts: { baseFiles: 2, sourceFiles: 3, additions: 1, replacements: 0, manualReconciliations: 1 }, packages: [],
    files: [{ path: 'MASTER_PLAN.md', action: 'manual-reconciliation', baseSha256: a, sourceSha256: b }, { path: 'docs/new.md', action: 'add', baseSha256: null, sourceSha256: c }] };
  return { base, source, manifest };
}
test('complete pinned delta distinguishes manual reconciliation from additive files', () => {
  const f = fixture(); assert.deepEqual(validateCandidateInventory(f.manifest, f.base, f.source), f.manifest.counts);
});
test('incomplete, duplicate, stale and misclassified manifests are refused', () => {
  for (const edit of [m => m.files.pop(), m => m.files.push(m.files[1]), m => m.files[1].sourceSha256 = a, m => m.files[0].baseSha256 = c, m => m.files[0].action = 'replace', m => m.counts.additions++]) {
    const f = fixture(); edit(f.manifest); assert.throws(() => validateCandidateInventory(f.manifest, f.base, f.source));
  }
});
test('deleted base files, unlisted changes and unsafe inventory paths are refused', () => {
  const removed = fixture(); delete removed.source['content/keep.js']; assert.throws(() => validateCandidateInventory(removed.manifest, removed.base, removed.source), /removes/);
  const changed = fixture(); changed.source['content/keep.js'] = b; assert.throws(() => validateCandidateInventory(changed.manifest, changed.base, changed.source), /delta/);
  const unsafe = fixture(); unsafe.source['../outside'] = a; assert.throws(() => validateCandidateInventory(unsafe.manifest, unsafe.base, unsafe.source), /Invalid inventory/);
  const forbidden = fixture(); forbidden.source['content/keep.js'] = b; forbidden.manifest.files.splice(1, 0, { path: 'content/keep.js', action: 'replace', baseSha256: a, sourceSha256: b });
  assert.throws(() => validateCandidateInventory(forbidden.manifest, forbidden.base, forbidden.source), /production replacement/);
});
test('package references must identify every pinned package with exact bytes', () => {
  const f = fixture(); f.source['docs/integration/one.json'] = c;
  f.manifest.files.splice(1, 0, { path: 'docs/integration/one.json', action: 'add', baseSha256: null, sourceSha256: c });
  f.manifest.counts.sourceFiles++; f.manifest.counts.additions++;
  assert.throws(() => validateCandidateInventory(f.manifest, f.base, f.source), /Package references/);
  f.manifest.packages = [{ path: 'docs/integration/one.json', sha256: c }]; validateCandidateInventory(f.manifest, f.base, f.source);
  f.manifest.packages[0].sha256 = a; assert.throws(() => validateCandidateInventory(f.manifest, f.base, f.source), /Package references/);
});
test('HTML target audit resolves canonical prefixes, encoded names and directory indexes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-candidate-links-'));
  try {
    await mkdir(join(dir, 'next')); await writeFile(join(dir, 'next/index.html'), '<a href="../index.html#ignored">Back</a>');
    await writeFile(join(dir, 'an image.svg'), '<svg/>');
    await writeFile(join(dir, 'index.html'), '<a href="next/?q=1&amp;b=2">Next</a><img src="https://example.org/project/an%20image.svg"><a href="#unknown">Fragment</a><a href="https://external.example/missing">External</a>');
    const result = await checkCandidateHtmlLinks(dir, 'https://example.org/project/'); assert.equal(result.pages, 2); assert.equal(result.localTargets, 3);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('HTML target audit catches missing local files and wrong canonical prefixes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-candidate-links-'));
  try {
    await writeFile(join(dir, 'index.html'), '<a href="missing/">Missing</a>'); await assert.rejects(checkCandidateHtmlLinks(dir, 'https://example.org/project/'), /Missing candidate/);
    await writeFile(join(dir, 'index.html'), '<a href="/outside.html">Wrong prefix</a>'); await assert.rejects(checkCandidateHtmlLinks(dir, 'https://example.org/project/'), /escapes canonical/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
