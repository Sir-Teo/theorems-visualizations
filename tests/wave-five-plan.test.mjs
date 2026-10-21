import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadAll } from '../scripts/lib.mjs';
import { planWaveFive } from '../scripts/plan-wave-five.mjs';

test('Wave 5 covers each unfinished collection once, preserves existing items and exposes prerequisite readiness', async () => {
  const atlas = await loadAll(), plan = planWaveFive(atlas, { remainingFlags: 265 });
  const unfinished = new Set(atlas.planned.map(i => i.col));
  assert.equal(plan.chapterCount, 80);
  assert.deepEqual(new Set(plan.chapters.map(c => c.collection)), unfinished);
  assert.equal(plan.chapters.length, unfinished.size);
  const scheduled = new Set(plan.chapters.flatMap(c => c.items.map(i => i.id)));
  assert.equal(plan.newItemCount, scheduled.size);
  assert.equal(plan.existingItemCount, 2);
  assert.ok(plan.chapters.find(c => c.collection === 'info').alreadyWritten.length);
  assert.ok(plan.chapters.find(c => c.collection === 'sysbio').alreadyWritten.length);
  for (const chapter of plan.chapters) {
    assert.equal(chapter.chapter, Math.min(...atlas.planned.filter(i => i.col === chapter.collection).map(i => i.chapter)));
    assert.deepEqual(chapter.items.map(i => i.id), atlas.planned.filter(i => i.col === chapter.collection && i.chapter === chapter.chapter).map(i => i.id));
    assert.equal(chapter.prerequisites.unknown.length, 0);
    for (const id of chapter.prerequisites.later) assert.ok(!scheduled.has(id) && !atlas.items.some(i => i.id === id));
  }
  assert.equal(plan.status, 'prepared-not-started');
  assert.equal(plan.gates.sourceReviewsPending, 265);
  assert.equal(plan.gates.automatedVerification, 'pending');
  assert.equal('humanVisualReview' in plan.gates, false);
  assert.equal('humanListeningReview' in plan.gates, false);
});
