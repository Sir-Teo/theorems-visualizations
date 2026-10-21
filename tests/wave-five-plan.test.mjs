import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadAll } from '../scripts/lib.mjs';
import { planWaveFive, waveFiveProgress } from '../scripts/plan-wave-five.mjs';

test('Wave 5 covers each unfinished collection once, preserves existing items and exposes prerequisite readiness', async () => {
  const atlas = await loadAll(), plan = planWaveFive(atlas, { remainingFlags: 265 });
  const unfinished = new Set(atlas.planned.map(i => i.col));
  assert.equal(plan.chapterCount, unfinished.size);
  assert.deepEqual(new Set(plan.chapters.map(c => c.collection)), unfinished);
  assert.equal(plan.chapters.length, unfinished.size);
  const scheduled = new Set(plan.chapters.flatMap(c => c.items.map(i => i.id)));
  assert.equal(plan.newItemCount, scheduled.size);
  assert.equal(plan.existingItemCount, plan.chapters.reduce((sum, chapter) => sum + chapter.alreadyWritten.length, 0));
  for (const chapter of plan.chapters) {
    assert.equal(chapter.chapter, Math.min(...atlas.planned.filter(i => i.col === chapter.collection).map(i => i.chapter)));
    assert.deepEqual(chapter.alreadyWritten, atlas.items.filter(i => i.col === chapter.collection && i.chapter === chapter.chapter).map(i => i.id));
    assert.deepEqual(chapter.items.map(i => i.id), atlas.planned.filter(i => i.col === chapter.collection && i.chapter === chapter.chapter).map(i => i.id));
    assert.equal(chapter.prerequisites.unknown.length, 0);
    for (const id of chapter.prerequisites.later) assert.ok(!scheduled.has(id) && !atlas.items.some(i => i.id === id));
  }
  assert.equal(plan.status, 'authoring-authorized');
  assert.equal(plan.gates.sourceReviewsPending, 265);
  assert.equal(plan.gates.automatedVerification, 'required-per-chapter-and-wave');
  assert.equal(plan.gates.mapPerformance, 'deferred-by-user');
  assert.equal('humanVisualReview' in plan.gates, false);
  assert.equal('humanListeningReview' in plan.gates, false);
});

test('refreshing an active wave keeps its original chapter and excludes later-wave content from progress', () => {
  const plan = { chapters: [
    { collection: 'first', chapter: 5, alreadyWritten: ['first-5.1'], items: [{ id: 'first-5.2' }, { id: 'first-5.3' }] },
    { collection: 'second', chapter: 5, alreadyWritten: [], items: [{ id: 'second-5.1' }] },
  ] };
  const before = structuredClone(plan);
  const progress = waveFiveProgress(plan, { items: [
    { id: 'first-5.1' }, { id: 'first-5.2' }, { id: 'first-5.3' }, { id: 'first-6.1' },
  ] });
  assert.deepEqual(plan, before);
  assert.equal(progress.total, 3);
  assert.equal(progress.written, 2);
  assert.equal(progress.remaining, 1);
  assert.equal(progress.writtenChapters, 1);
  assert.equal(progress.chapters[0].chapter, 5);
  assert.deepEqual(progress.chapters[0].writtenItems, ['first-5.2', 'first-5.3']);
  assert.equal(progress.chapters[0].status, 'written');
  assert.equal(progress.chapters[1].status, 'planned');
  const partial = waveFiveProgress(plan, { items: [{ id: 'first-5.2' }] });
  assert.equal(partial.chapters[0].status, 'in-progress');
});
