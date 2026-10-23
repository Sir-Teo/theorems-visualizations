import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadJourneyContext, validateJourneyPlans } from '../scripts/check-journey-plans.mjs';

const read = async name => JSON.parse(await readFile(new URL('../docs/journeys/' + name, import.meta.url)));
const original = [await read('plans.json'), await read('sources.json'), await read('targets.json'), await loadJourneyContext()];
const fixture = () => structuredClone(original);
const run = args => validateJourneyPlans(...args);
test('the real plans distinguish lessons, external readings and the legal gap', () => {
  assert.deepEqual(run(fixture()), { routes: 3, steps: 14, lessonStops: 10, uniqueAcceptedTargets: 10, externalReadingStops: 3, gapStops: 1, transitions: 11, sources: 5, stoppedCandidates: 2, newLessons: 0, acceptedJourneys: 0, publishedJourneys: 0 });
});
test('a lesson changing after the snapshot cannot inherit a target binding', () => {
  const a = fixture(); a[3].legacy.get('fluid-2.9').item.scope = 'Changed assumptions';
  assert.throws(() => run(a), /target absent, flagged or changed/);
});
test('an unaccepted craft prototype cannot replace an accepted target', () => {
  const a = fixture(); a[0].routes[1].steps[1].targetId = 'x-craft-0001';
  assert.throws(() => run(a), /unaccepted lesson target/);
});
test('an edition link cannot drift to the latest or an invented version path', () => {
  const a = fixture(), t = a[2].targets.find(t => t.id === 'x-history-0001');
  t.href = 'explore/x-history-0001/';
  assert.throws(() => run(a), /Edition title, path or prerequisite/);
});
test('an external reading or gap cannot masquerade as a lesson link', () => {
  for (const [route, step] of [[0, 3], [2, 3]]) {
    const a = fixture(); a[0].routes[route].steps[step].targetId = 'stat-1.2';
    assert.throws(() => run(a), /must not invent a lesson/);
  }
});
test('sequence order cannot fabricate a prerequisite or evidence edge', () => {
  for (const kind of ['prerequisite', 'evidence']) {
    const a = fixture(); a[0].routes[0].transitions[0].kind = kind;
    assert.throws(() => run(a), /not authorized by this research contract/);
  }
});
test('stopped or changed retained source receipts cannot be used silently', () => {
  const a = fixture(); a[1].stoppedCandidates.push({ url: a[1].sources[0].url });
  assert.throws(() => run(a), /Unread or stopped source/);
  const b = fixture(); b[3].retained.sources.find(s => s.id === 'seq-asare-context').limits = 'Changed scope';
  assert.throws(() => run(b), /Retained source receipt changed/);
});
test('planning does not confer acceptance, publication or automatic dependency closure', () => {
  for (const field of ['published', 'acceptedJourney']) {
    const a = fixture(); a[0].routes[0][field] = true;
    assert.throws(() => run(a), /does not grant acceptance/);
  }
  const b = fixture(); b[2].targets[0].declaredPrerequisites = [];
  assert.throws(() => run(b), /prerequisite mismatch/);
});
