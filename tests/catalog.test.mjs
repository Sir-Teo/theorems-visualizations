import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { test } from 'node:test';
import { encodeCatalog, decodeCatalog } from '../assets/js/catalog.js';
import { loadAll } from '../scripts/lib.mjs';

test('catalog transport preserves graph links, optional values, and planned IDs', () => {
  const catalog = { fields: [], items: [
    { id: 'a-1', col: 'a', num: '1', kind: 'Theorem', file: 'a.js', deps: ['b-2'], pdeps: ['b-3'], viz: false, yr: 0, verify: 1 },
    { id: 'b-2', col: 'b', num: '2', kind: 'Definition', file: 'b.js', deps: [], see: ['a-1'], intro: ['b-3'] },
  ] };
  const packed = JSON.parse(JSON.stringify(encodeCatalog(catalog)));
  assert.deepEqual(decodeCatalog(packed), catalog);
  assert.deepEqual(decodeCatalog(catalog), catalog);
  assert.throws(() => decodeCatalog({ itemEncoding: 2 }), /Unsupported/);
});

test('generated light catalog retains every written item and fits home JSON budget', async () => {
  const json = readFileSync(new URL('../data/index.json', import.meta.url), 'utf8');
  assert.ok(gzipSync(json).length <= 300000, '300 KB compressed JSON budget');
  const catalog = decodeCatalog(JSON.parse(json));
  const { items } = await loadAll();
  const byId = new Map(catalog.items.map(it => [it.id, it]));
  const shards = new Map();
  assert.equal(byId.size, items.length);
  for (const source of items) {
    const actual = byId.get(source.id);
    assert.ok(actual, source.id);
    for (const key of ['name', 'kind', 'file']) assert.deepEqual(actual[key], source[key], `${source.id} ${key}`);
    assert.equal(Boolean(actual.verify), Boolean(source.verify), `${source.id} source-review flag`);
    assert.deepEqual(actual.deps, source.deps.filter(id => id !== source.id && byId.has(id)), `${source.id} written dependencies`);
    assert.deepEqual(actual.pdeps || [], source.deps.filter(id => id !== source.id && !byId.has(id)), `${source.id} planned dependencies`);
    if (!shards.has(source.col)) shards.set(source.col, JSON.parse(readFileSync(new URL(`../data/col/${source.col}.json`, import.meta.url))));
    const shard = shards.get(source.col);
    assert.deepEqual(shard[source.id].tags || [], source.tags || [], `${source.id} search tags`);
  }
});
