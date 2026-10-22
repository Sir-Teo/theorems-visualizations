import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planContentWave, requirePreviousComplete, renderContentWave, parseContentWaveArgs } from '../scripts/plan-content-wave.mjs';

function fixture() {
  const item = (col, chapter, num, extra = {}) => ({ id: `${col}-${chapter}.${num}`, col, chapter, num: `${chapter}.${num}`, kind: 'Theorem', name: `${col} ${chapter}.${num}`, ...extra });
  return { collections: ['aa', 'bb', 'done'].map(id => ({ id, field: 'math', title: id, source: { type: 'course', refs: [] } })),
    chapters: new Map([['aa/6', { title: 'Six' }], ['aa/7', { title: 'Seven' }], ['bb/4', { title: 'Four' }]]),
    items: [item('aa', 5, 1), item('bb', 3, 1), item('aa', 6, 1)],
    planned: [item('aa', 7, 1), item('aa', 6, 2, { deps: ['bb-4.1', 'aa-7.1', 'aa-5.1'], kind: 'Paper', paper: { authors: 'A', year: 2000, title: 'T' }, introduces: ['bb-4.1'], verify: true }), item('bb', 4, 1)] };
}
function previous() { return { wave: 5, status: 'complete', chapters: [{ collection: 'aa', chapter: 5, items: [{ id: 'aa-5.1' }] }, { collection: 'bb', chapter: 3, items: [{ id: 'bb-3.1' }] }] }; }

test('future wave selects the earliest unwritten chapter per unfinished collection with frozen metadata', () => {
  const atlas = fixture(), before = structuredClone(atlas), p = planContentWave(atlas, { wave: 6, previous: previous() });
  assert.deepEqual(p.chapters.map(c => [c.collection, c.chapter]), [['aa', 6], ['bb', 4]]);
  assert.deepEqual(p.chapters[0].alreadyWritten, ['aa-6.1']);
  assert.deepEqual(p.chapters[0].prerequisites.elsewhereInWave, ['bb-4.1']);
  assert.deepEqual(p.chapters[0].prerequisites.later, ['aa-7.1']);
  assert.deepEqual(p.chapters[0].items[0].paper, atlas.planned[1].paper);
  assert.deepEqual(p.chapters[0].items[0].introduces, ['bb-4.1']);
  assert.equal(p.chapters[0].items[0].verify, true);
  assert.equal(p.gates.mapPerformance, 'deferred-by-user');
  assert.match(p.gates.note, /Preserve existing source flags and access restrictions/);
  p.chapters[0].items[0].introduces.push('other');
  assert.deepEqual(atlas, before);
});

test('all saved assignments stay frozen on refresh even when a collection is finished', () => {
  const atlas = fixture(), saved = planContentWave(atlas, { wave: 6, previous: previous() });
  const original = structuredClone(saved);
  atlas.items.push(...atlas.planned.filter(i => i.chapter !== 7));
  atlas.planned = atlas.planned.filter(i => i.chapter === 7);
  const refreshed = planContentWave(atlas, { wave: 6, previous: previous(), saved });
  assert.deepEqual(refreshed.chapters, original.chapters);
  assert.equal(refreshed.progress.remaining, 0);
  assert.equal(refreshed.status, 'prepared');
  assert.deepEqual(saved, original);
});

test('previous explicit acceptance and zero actual remaining are both mandatory', () => {
  for (const status of ['prepared', 'in-progress', 'authoring-authorized', undefined]) {
    assert.throws(() => planContentWave(fixture(), { wave: 6, previous: { ...previous(), status } }), /explicitly marked complete/);
  }
  const atlas = fixture(); atlas.items = atlas.items.filter(i => i.id !== 'aa-5.1');
  const prior = { ...previous(), progress: { remaining: 0 } };
  assert.throws(() => requirePreviousComplete(6, prior, atlas), /1 frozen item/);
  assert.throws(() => requirePreviousComplete(6, undefined, atlas), /Invalid saved/);
  const preserved = previous();
  preserved.chapters[0].alreadyWritten = ['aa-6.1'];
  const completeAtlas = fixture();
  assert.equal(requirePreviousComplete(6, preserved, completeAtlas).remaining, 0);
  completeAtlas.items = completeAtlas.items.filter(item => item.id !== 'aa-6.1');
  assert.throws(() => requirePreviousComplete(6, preserved, completeAtlas), /missing preserved alreadyWritten.*aa-6\.1/);
});

test('preparing and refreshing never mutate the previous inventory', () => {
  const prior = previous(), before = structuredClone(prior), atlas = fixture();
  const saved = planContentWave(atlas, { wave: 6, previous: prior });
  planContentWave(atlas, { wave: 6, previous: prior, saved, start: true, startedAt: '2026-10-22' });
  assert.deepEqual(prior, before);
});

test('starting is explicit and availability never marks an active wave complete', () => {
  const atlas = fixture(), prior = previous();
  const saved = planContentWave(atlas, { wave: 6, previous: prior, start: true, startedAt: '2026-10-22' });
  assert.equal(saved.status, 'in-progress'); assert.equal(saved.started, '2026-10-22');
  atlas.items.push(...atlas.planned);
  const refreshed = planContentWave(atlas, { wave: 6, previous: prior, saved });
  assert.equal(refreshed.progress.remaining, 0); assert.equal(refreshed.status, 'in-progress');
  assert.match(renderContentWave(refreshed), /availability, not review acceptance/);
  assert.throws(() => planContentWave(fixture(), { wave: 6, previous: prior, start: true }), /startedAt/);
});

test('root completion is preserved but inconsistent complete inventories fail safely', () => {
  const atlas = fixture(), saved = planContentWave(atlas, { wave: 6, previous: previous() }); saved.status = 'complete';
  assert.throws(() => planContentWave(atlas, { wave: 6, previous: previous(), saved }), /missing frozen content/);
  atlas.items.push(...atlas.planned);
  assert.equal(planContentWave(atlas, { wave: 6, previous: previous(), saved }).status, 'complete');
  const next = planContentWave(atlas, { wave: 7, previous: saved });
  assert.equal(next.wave, 7); assert.equal(next.status, 'prepared');
});

test('CLI demands an explicit future wave and rejects implicit starts, completion and unknown options', () => {
  assert.deepEqual(parseContentWaveArgs(['--wave', '6']), { wave: 6, start: false });
  assert.deepEqual(parseContentWaveArgs(['--start', '--wave', '12']), { wave: 12, start: true });
  for (const args of [[], ['6'], ['--wave', '5'], ['--wave', '6.5'], ['--wave', '6', '--complete'], ['--wave', '6', '--wave', '7']]) assert.throws(() => parseContentWaveArgs(args));
});

test('malformed or wrong-wave frozen inventories cannot bypass gates', () => {
  const atlas = fixture();
  for (const prior of [{ ...previous(), wave: 4 }, { ...previous(), chapters: null }, { ...previous(), chapters: [...previous().chapters, previous().chapters[0]] }]) assert.throws(() => requirePreviousComplete(6, prior, atlas));
  assert.throws(() => planContentWave(atlas, { wave: 6, previous: previous(), saved: { ...previous(), wave: 7 } }));
});
