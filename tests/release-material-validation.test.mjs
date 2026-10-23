import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadEditionArchive, deliveryBinding } from '../scripts/build-exploration-editions.mjs';
import { resolveReleases, jsonBytes, sha } from '../scripts/exploration-editions.mjs';
import { prepareNavigation } from '../scripts/build-domain-navigation.mjs';
import { resolveDomainReleases } from '../scripts/domain-navigation.mjs';
import { overviewDigest } from '../orientation/contract.mjs';

const archive = await loadEditionArchive(), delivery = await deliveryBinding(), nav = await prepareNavigation();
const base = 'https://example.org/project/';
const predecessor = JSON.parse(await readFile(new URL('../docs/integration/release-material-validation.json', import.meta.url), 'utf8')).predecessorBindings;
// All decisions and receipts below are synthetic, in-memory test data. No real
// authorization, reviewer credentials or release-ledger entry is created.
const receipt = 'Synthetic material-validation fixture. No actual permission or review.';
const ref = { path: 'docs/releases/material-fixture-review.md', sha256: sha(receipt) };
const reviewer = { id: 'synthetic-independent-reviewer', role: 'Fixture only; no credentials', independent: true };
const material = id => ({ id, basis: 'Fixture only', territories: 'Fixture only', scope: 'Fixture only', reviewer, evidence: ref });
const common = () => ({ schemaVersion: 1, authorizedBy: 'Fixture only', authorizedOn: '2026-10-22', scope: 'Fixture only', engineering: { reviewer, evidence: ref }, canonicalBase: base });

function fixture(kind, selection) {
  const files = new Map([[ref.path, receipt]]), approvalPath = 'docs/releases/material-fixture-approval.json';
  let decision, event, resolve, withdrawal;
  if (kind === 'edition') {
    const { bundle, entry } = selection;
    decision = { ...common(), decision: 'approve-public-distribution', id: bundle.id, revision: bundle.revision, bundleSha256: entry.sha256, deliveryDigest: delivery.digest,
      materials: [...bundle.record.sources.map(s => s.id), 'original-editorial-material', 'software-runtime', ...Object.keys(bundle.supplements).map(p => 'supplement:' + p)].map(material) };
    event = { type: 'publish', id: bundle.id, revision: bundle.revision, bundleSha256: entry.sha256, evidence: { path: approvalPath, sha256: '' } };
    resolve = events => resolveReleases({ schemaVersion: 1, events }, archive.bundles, { deliveryDigest: delivery.digest, base, readEvidence: p => { assert.ok(files.has(p)); return files.get(p); } });
    withdrawal = () => ({ schemaVersion: 1, decision: 'withdraw-public-edition', id: bundle.id, revision: bundle.revision, bundleSha256: entry.sha256, authorizedBy: 'Fixture only', authorizedOn: '2026-10-22', reason: 'Synthetic withdrawal' });
  } else {
    const ids = selection, sources = [...new Set(nav.data.catalog.overviews.filter(r => ids.includes(r.domainId)).flatMap(r => r.sourceIds))];
    decision = { ...common(), decision: 'approve-domain-navigation', domains: ids.map(id => ({ id, revision: nav.data.catalog.overviews.find(r => r.domainId === id).revision })), catalogVersion: nav.data.catalog.catalogVersion,
      sourceDigest: overviewDigest(nav.data, ids), sourceArtifactDigest: nav.verification.artifactDigest, navigationDigest: nav.binding.digest,
      materials: [...sources, 'original-editorial-material', 'navigation-software'].map(material) };
    event = { type: 'publish', evidence: { path: approvalPath, sha256: '' } };
    resolve = events => resolveDomainReleases({ schemaVersion: 1, events }, nav.data, { navigationDigest: nav.binding.digest, sourceArtifactDigest: nav.verification.artifactDigest, base, readEvidence: p => { assert.ok(files.has(p)); return files.get(p); } });
    withdrawal = () => ({ schemaVersion: 1, decision: 'withdraw-domain-orientations', domains: structuredClone(decision.domains), authorizedBy: 'Fixture only', authorizedOn: '2026-10-22', reason: 'Synthetic withdrawal' });
  }
  const sync = () => { const bytes = jsonBytes(decision); files.set(approvalPath, bytes); event.evidence.sha256 = sha(bytes); };
  const withdrawEvent = () => {
    const path = 'docs/releases/material-fixture-withdrawal.json', bytes = jsonBytes(withdrawal()); files.set(path, bytes);
    return { ...event, type: 'withdraw', evidence: { path, sha256: sha(bytes) } };
  };
  sync(); return { kind, decision, event, sync, withdrawEvent, resolve: (events = [event]) => resolve(events) };
}
const editionCases = [...archive.bundles.values()].map(s => ['edition', s]);
const ids = nav.data.catalog.overviews.map(r => r.domainId);
const domainCases = [ids, ...ids.map(id => [id]), ['D01', 'D02']].map(s => ['domain', s]);
const cases = [...editionCases, ...domainCases];
const sorted = f => f.decision.materials.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const materialError = /Distribution decision must cover/;

test('exact per-material decisions work for every retained edition, supplement and single or combined domain selection', () => {
  assert.equal(editionCases.length, 4); assert.equal(domainCases.length, 32);
  assert.ok(editionCases.some(([, s]) => Object.keys(s.bundle.supplements).length > 0));
  for (const args of cases) {
    const f = fixture(...args), expected = args[0] === 'edition' ? 1 : args[1].length;
    assert.equal(f.resolve().length, expected);
    f.decision.materials.reverse(); f.sync(); assert.equal(f.resolve().length, expected);
  }
  console.log(JSON.stringify({ validSelections: cases.length, validMaterialOrders: cases.length * 2 }));
});
for (const [kind, selected] of [['edition', editionCases], ['domain', domainCases]]) test(kind + ' material decisions reject comma-combined required identities', () => {
  let checked = 0;
  for (const args of selected) {
    const count = fixture(...args).decision.materials.length;
    for (let i = 0; i < count - 1; i++) {
      const f = fixture(...args); sorted(f);
      const [left, right] = f.decision.materials.splice(i, 2);
      f.decision.materials.push({ ...left, id: left.id + ',' + right.id }); f.sync();
      assert.throws(() => f.resolve(), materialError, kind + ' pair ' + i); checked++;
    }
  }
  console.log(JSON.stringify({ kind, combinedMaterialPairsRejected: checked }));
});
test('missing, repeated, unknown and non-string material identities cannot inherit a distinct source decision', () => {
  const changes = [
    d => d.materials.pop(), d => d.materials.push(structuredClone(d.materials[0])),
    d => d.materials[0].id = 'unknown-fixture-material', d => d.materials[0].id = [d.materials[0].id],
    d => d.materials[0].id = null, d => d.materials[0] = null,
  ];
  for (const args of cases) for (const change of changes) { const f = fixture(...args); change(f.decision); f.sync(); assert.throws(() => f.resolve(), materialError); }
  console.log(JSON.stringify({ malformedMaterialDecisionsRejected: cases.length * changes.length }));
});
test('changed delivery code requires new live decisions while valid historical decisions still support withdrawal', () => {
  assert.notEqual(delivery.digest, predecessor.editionDeliveryDigest);
  assert.notEqual(nav.binding.digest, predecessor.navigationDigest);
  for (const args of cases) {
    const f = fixture(...args); f.decision[f.kind === 'edition' ? 'deliveryDigest' : 'navigationDigest'] = predecessor[f.kind === 'edition' ? 'editionDeliveryDigest' : 'navigationDigest']; f.sync();
    assert.throws(() => f.resolve(), /binding changed|does not bind/);
    const result = f.resolve([f.event, f.withdrawEvent()]); assert.ok(result.length > 0); assert.ok(result.every(s => s.state === 'withdrawn'));
    const g = fixture(...args); sorted(g); const [a, b] = g.decision.materials.splice(0, 2); g.decision.materials.push({ ...a, id: a.id + ',' + b.id }); g.sync();
    assert.throws(() => g.resolve([g.event, g.withdrawEvent()]), materialError);
  }
});
test('real release ledgers stay empty and source acceptance is not publication permission', async () => {
  for (const path of ['editions/releases.json', 'navigation/releases.json', 'journeys/releases.json']) assert.deepEqual(JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8')).events, []);
  for (const { bundle } of archive.bundles.values()) assert.equal(bundle.record.publication, 'local-preview');
});
