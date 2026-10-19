import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { makeHomeCatalog } from '../scripts/home-catalog.mjs';
const index = JSON.parse(await readFile(new URL('../data/index.json', import.meta.url))), homeText = await readFile(new URL('../data/home.json', import.meta.url)), home = JSON.parse(homeText);
const plannedRaw = JSON.parse(await readFile(new URL('../data/planned.json', import.meta.url)));
const planned = Object.entries(plannedRaw.cols).flatMap(([col, rows]) => rows.map(([num, c, k, name, deps, x, y, paper]) => ({ id: `${col}-${num}`, col, c, kind: plannedRaw.kinds[k], name, deps, planned: true, num, yr: paper?.y, au: paper?.a, intro: paper?.i })));

test('home payload has an enforced 300000-byte gzip ceiling and exact atlas-wide summary counts', () => {
  assert.ok(gzipSync(homeText).length <= 300000, `${gzipSync(homeText).length} gzip bytes`);
  assert.equal(home.home.itemCount, index.items.length);
  assert.equal(home.home.vizCount, index.items.filter(it => it.viz).length);
  assert.equal(home.home.edgeCount, index.items.reduce((sum, it) => sum + it.deps.length, 0));
  assert.deepEqual(home.fields, index.fields); assert.deepEqual(home.collections, index.collections);
  assert.deepEqual(home.bridges, index.bridges); assert.deepEqual(home.fieldEdges, index.fieldEdges);
});

test('home contains every landmark paper and every bridge target, with no truncation of timeline or field navigation', () => {
  const all = new Map([...index.items, ...planned].map(it => [it.id, it])), selected = new Map([...home.items, ...home.planned].map(it => [it.id, it]));
  const papers = [...all.values()].filter(it => it.kind === 'Paper');
  assert.equal(home.paperCount, papers.length);
  for (const paper of papers) { const q = selected.get(paper.id); assert.ok(q, paper.id); for (const key of ['name', 'kind', 'yr', 'au', 'intro', 'planned']) assert.deepEqual(q[key], paper[key], `${paper.id}: ${key}`); }
  for (const bridge of index.bridges) for (const step of bridge.steps) assert.equal(selected.get(step.id)?.col, all.get(step.id)?.col);
  assert.equal(home.collections.length, 85); assert.ok(home.items.length < index.items.length / 4);
});

test('home chain is a complete maximum-depth dependency path and workhorse citation counts use the whole graph', () => {
  const all = new Map(index.items.map(it => [it.id, it])), chain = home.home.chain;
  assert.equal(chain.length, 1 + Math.max(...index.items.map(it => it.depth)));
  for (let i = 1; i < chain.length; i++) assert.ok(all.get(chain[i]).deps.includes(chain[i - 1]));
  assert.equal(home.home.pillars.length, 12); const perCollection = new Map();
  for (const id of home.home.pillars) { const item = all.get(id); assert.ok(item && item.kind !== 'Definition'); assert.equal(home.home.cited[id], index.items.filter(it => it.deps.includes(id)).length); perCollection.set(item.col, (perCollection.get(item.col) || 0) + 1); }
  assert.ok([...perCollection.values()].every(n => n <= 4));
});

test('home builder preserves the same complete records when source order and planned inventory change', () => {
  const sample = { generated: 'test', fields: [], collections: [], fieldEdges: [], paperCount: 1, plannedCount: 2, bridges: [{ steps: [{ id: 'c-8' }] }], items: [
    { id: 'c-1', col: 'c', deps: [], depth: 0, desc: 3, viz: true, kind: 'Theorem' },
    { id: 'c-2', col: 'c', deps: ['c-1'], depth: 1, desc: 1, kind: 'Theorem' },
    { id: 'c-3', col: 'c', deps: ['c-2'], depth: 2, desc: 0, kind: 'Theorem' },
  ] }, ghosts = [{ id: 'c-8', col: 'c', kind: 'Concept', planned: true }, { id: 'c-9', col: 'c', kind: 'Paper', planned: true, yr: 1901, au: 'Example' }];
  const a = makeHomeCatalog(sample, ghosts), b = makeHomeCatalog({ ...sample, items: [...sample.items].reverse() }, ghosts);
  assert.deepEqual(a.home.chain, ['c-1', 'c-2', 'c-3']); assert.deepEqual(b.home.chain, a.home.chain);
  assert.deepEqual(new Set(a.planned.map(it => it.id)), new Set(['c-8', 'c-9'])); assert.equal(a.home.edgeCount, 2);
  assert.deepEqual(a.items.find(it => it.id === 'c-2'), sample.items[1]);
});
