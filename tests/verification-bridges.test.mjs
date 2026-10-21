// Structural publication gates for the curated, written-item bridge inventory.
// A semantic/source review remains necessary; these checks prevent broken or
// planned-only journeys from silently meeting the numerical master-plan target.
import test from 'node:test';
import assert from 'node:assert/strict';
import { basename } from 'node:path';
import { loadAll, loadBridges } from '../scripts/lib.mjs';

const atlas = await loadAll();
const { bridges, problems } = await loadBridges();
const byId = new Map(atlas.items.map((item) => [item.id, item]));
const collections = new Map(atlas.collections.map((collection) => [collection.id, collection]));

test('the bridge inventory has fifteen distinct routes and no import errors', () => {
  assert.deepEqual(problems, []);
  assert.ok(bridges.length >= 15, `${bridges.length} bridges`);
  assert.equal(new Set(bridges.map((bridge) => bridge.slug)).size, bridges.length);
  assert.equal(new Set(bridges.map((bridge) => bridge.title)).size, bridges.length);
  assert.equal(new Set(bridges.map((bridge) => bridge.steps.map((step) => step.id).join('|'))).size, bridges.length);
  for (const bridge of bridges) {
    assert.match(bridge.slug, /^[a-z]+(?:-[a-z]+)*$/);
    assert.equal(basename(bridge.file), `${bridge.slug}.js`);
  }
});

for (const bridge of bridges) test(`${bridge.slug}: a complete cross-field journey through written, source-anchored ideas`, () => {
  assert.ok(bridge.blurb?.trim(), 'introductory connecting prose');
  assert.ok(bridge.steps.length >= 6, 'a journey needs more than a pair of related links');
  const fields = new Set(), cols = new Set(), seen = new Set();
  for (const step of bridge.steps) {
    assert.ok(!seen.has(step.id), `repeated step ${step.id}`); seen.add(step.id);
    const item = byId.get(step.id);
    assert.ok(item, `${step.id} must be written, rather than only planned or aliased`);
    assert.ok(item.statement?.trim(), `${step.id} has a statement to support the connection`);
    assert.equal(typeof item.viz, 'function', `${step.id} has an explorable picture`);
    assert.ok(step.note?.trim(), `${step.id} has connecting prose`);
    const collection = collections.get(item.col);
    cols.add(item.col); fields.add(collection.field);
    assert.ok(collection.source.type === 'book' || item.refs?.length || item.paper,
      `${step.id} must have a book anchor, explicit references, or original-paper metadata`);
  }
  assert.ok(cols.size >= 2, 'crosses collections');
  assert.ok(fields.size >= 2, 'crosses fields');
});

test('the seven new journeys add concepts beyond the original eight walks', () => {
  const original = new Set(['action', 'contagion', 'diffusion', 'entropy', 'fixed-points', 'fourier', 'spectral', 'symmetry']);
  const oldIds = new Set(bridges.filter((bridge) => original.has(bridge.slug)).flatMap((bridge) => bridge.steps.map((step) => step.id)));
  for (const bridge of bridges.filter((bridge) => !original.has(bridge.slug))) {
    assert.ok(bridge.steps.filter((step) => !oldIds.has(step.id)).length >= 4,
      `${bridge.slug} needs at least four written ideas not already used by the original narratives`);
  }
});
