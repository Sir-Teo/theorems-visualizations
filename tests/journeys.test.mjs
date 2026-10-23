import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareJourneys } from '../scripts/build-journeys.mjs';
import { hash, json, researchDigest, deliveredTargets, renderJourneys, resolveJourneyReleases, attachJourneyNavigation } from '../journeys/reader.mjs';
const p = await prepareJourneys(), base = 'https://example.org/project/';
const availability = () => deliveredTargets(p.data.targets, { mode: 'preview', legacyIds: p.context.accepted.ids, editions: p.navigation.catalog });
const render = (states = p.entries, a = availability(), data = p.data) => renderJourneys(data, states, a, { domains: p.navigation.rendered.domains });
const escaped = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
// These approvals exist only in memory as synthetic fixtures, never as actual release evidence.
function fixture(ids = p.data.plans.routes.map(r => r.id)) {
  const receipt = 'Synthetic test receipt, no real reviewer or authorization.', ref = { path: 'docs/releases/journey-test-review.md', sha256: hash(receipt) };
  const reviewer = { id: 'synthetic-independent-reviewer', role: 'Test fixture only', independent: true };
  const sources = [...new Set(p.data.plans.routes.filter(r => ids.includes(r.id)).flatMap(r => r.steps.flatMap(s => s.sourceIds)))];
  const decision = { schemaVersion: 1, decision: 'approve-journey-delivery', routes: ids.map(id => ({ id, revision: p.data.plans.version })), researchDigest: researchDigest(p.data), deliveryDigest: p.binding.digest, canonicalBase: base, authorizedBy: 'Fixture only', authorizedOn: '2026-10-22', scope: 'Synthetic scope', openChecks: ['Synthetic test only'], materials: [...sources, 'original-journey-prose', 'journey-software'].map(id => ({ id, basis: 'Fixture', scope: 'Fixture', territories: 'Fixture', reviewer, evidence: ref })), reviews: ['content', 'access', 'engineering'].map(dimension => ({ dimension, scope: 'Fixture', reviewer, evidence: ref })) };
  const files = new Map([[ref.path, receipt]]), path = 'docs/releases/journey-test-approval.json', event = { type: 'publish', evidence: { path, sha256: '' } };
  function sync() { const bytes = json(decision); files.set(path, bytes); event.evidence.sha256 = hash(bytes); } sync();
  return { decision, event, files, sync, context: { base, deliveryDigest: p.binding.digest, readEvidence: path => { assert.ok(files.has(path)); return files.get(path); } } };
}
const resolve = (f, events = [f.event], data = p.data) => resolveJourneyReleases({ schemaVersion: 1, events }, data, f.context);
function withdrawal(f, ids = p.data.plans.routes.map(r => r.id)) {
  const d = { schemaVersion: 1, decision: 'withdraw-journeys', routes: ids.map(id => ({ id, revision: p.data.plans.version })), authorizedBy: 'Fixture only', authorizedOn: '2026-10-22', reason: 'Synthetic <withdrawal>' }, path = 'docs/releases/journey-test-withdraw.json', bytes = json(d);
  f.files.set(path, bytes); return { type: 'withdraw', evidence: { path, sha256: hash(bytes) } };
}
test('three static routes reuse ten accepted targets, three readings and one non-lesson gap', () => {
  const before = json(p.data), r = render(), c = JSON.parse(r.outputs.get('journeys/catalog.json'));
  assert.equal(r.outputs.size, 6); assert.equal(r.availableCount, 3); assert.equal(r.canonicalPaths.length, 0); assert.equal(c.newLessons, 0);
  const stops = c.journeys.flatMap(j => j.stops); assert.equal(stops.filter(s => s.href).length, 10); assert.equal(new Set(stops.filter(s => s.href).map(s => s.targetId)).size, 10);
  assert.equal(stops.filter(s => s.kind === 'external-reading').length, 3); assert.equal(stops.filter(s => s.kind === 'gap').length, 1);
  const all = [...r.outputs.values()].join('\n'); assert.ok(!all.includes('x-craft-0001')); assert.ok(!all.includes('x-performance-0001')); assert.ok(!all.includes('<script')); assert.ok(!all.includes('rel="canonical"'));
  assert.equal(json(p.data), before);
});
test('all non-gap tasks, entry support, checks, limitations and exact source scopes survive rendering', () => {
  const r = render();
  for (const plan of p.data.plans.routes) {
    const html = r.outputs.get(`journeys/${plan.id}/index.html`);
    for (const value of [plan.scope, plan.outcome, plan.transfer, ...plan.gaps]) assert.ok(html.includes(escaped(value)), value);
    for (const step of plan.steps) {
      for (const key of ['title', 'question', 'limit', ...(step.kind === 'gap' ? [] : ['check', 'entrySupport'])]) assert.ok(html.includes(escaped(step[key])), step.id + ':' + key);
      if (step.id === 'practice') { assert.ok(html.includes('Read the retained source descriptions below and, if accessible, their linked pages.')); assert.ok(!html.includes('Use the retained Asare/Dento Mills research brief')); assert.ok(html.includes('Separate a self-description and advertised workshop from evidence of a particular object, making session or learner outcome.')); }
      else if (step.kind !== 'gap') assert.ok(html.includes(escaped(step.task)));
      if (step.kind === 'gap') { assert.ok(!html.includes(escaped(step.task))); assert.ok(!html.includes('type="checkbox"')); }
    }
    for (const id of new Set(plan.steps.flatMap(s => s.sourceIds))) {
      const source = p.data.sources.sources.find(s => s.id === id);
      for (const key of ['url', 'edition', 'locator', 'finding', 'limits', 'reuse', 'readAt']) assert.ok(html.includes(escaped(source[key])), id + ':' + key);
    }
  }
});
test('missing exact editions withhold the entire dependent narrative and its source details', () => {
  const editions = { schemaVersion: 1, mode: 'release', explorations: [] }, a = deliveredTargets(p.data.targets, { mode: 'release', legacyIds: p.context.accepted.ids, editions });
  const states = p.entries.map(e => ({ ...e, state: 'published' })), r = renderJourneys(p.data, states, a, { mode: 'release', base });
  assert.equal(r.availableCount, 1); assert.equal(r.rows.filter(r => r.state === 'unavailable').length, 2);
  const all = [...r.outputs.values()].join('\n');
  for (const id of ['woven-cloth', 'account-evidence']) {
    const plan = p.data.plans.routes.find(r => r.id === id); for (const value of [plan.title, plan.scope, plan.outcome, plan.transfer, ...plan.steps.map(s => s.task)]) assert.ok(!all.includes(escaped(value)), value);
  }
  assert.ok(!all.includes('kwasiasare.com')); assert.ok(!all.includes('reutersagency.com')); assert.ok(!all.includes('href="../../explore/x-history-0001/'));
  assert.deepEqual(r.canonicalPaths.sort(), ['journeys/', 'journeys/water-city/']); assert.ok(!all.includes('href="../../domains/'));
});
test('withdrawn target version is unavailable even when another version is published', () => {
  const t = p.data.targets.targets.find(t => t.id === 'x-history-0001');
  const editions = { mode: 'release', explorations: [{ id: t.id, state: 'published', versions: [{ revision: t.revision, state: 'withdrawn', href: t.href }, { revision: '0.1.3', state: 'published', href: 'explore/x-history-0001/versions/0.1.3/' }] }] };
  const a = deliveredTargets(p.data.targets, { mode: 'release', legacyIds: p.context.accepted.ids, editions }); assert.equal(a.get(t.id), 'withdrawn');
  const r = renderJourneys(p.data, [{ id: 'account-evidence', revision: '0.1.0', state: 'published' }], a, { mode: 'release', base });
  assert.equal(r.availableCount, 0); assert.equal(r.canonicalPaths.length, 0); assert.ok(![...r.outputs.values()].join('').includes('What can two documents establish?'));
  const bad = structuredClone(editions); bad.explorations[0].versions[0].href = 'explore/other/'; assert.throws(() => deliveredTargets(p.data.targets, { mode: 'release', legacyIds: [], editions: bad }), /path/);
});
test('missing legacy target and unknown availability fail closed without a false lesson promise', () => {
  const a = availability(); a.set('fluid-2.9', 'missing'); assert.equal(render(p.entries, a).rows.find(r => r.id === 'water-city').state, 'unavailable');
  a.delete('fluid-2.9'); assert.throws(() => render(p.entries, a), /Unknown target availability/);
  assert.throws(() => deliveredTargets(p.data.targets, { mode: 'release', legacyIds: [], editions: p.navigation.catalog }), /modes differ/);
});
test('empty real ledger produces no journey page, catalog, canonical route or acceptance', async () => {
  const real = await prepareJourneys({ mode: 'release', base }); assert.deepEqual(real.entries, []);
  const r = renderJourneys(real.data, real.entries, new Map(), { mode: 'release', base }); assert.equal(r.outputs.size, 0); assert.equal(r.retainedCount, 0);
  assert.deepEqual(JSON.parse(await readFile(new URL('../journeys/releases.json', import.meta.url))).events, []);
  await assert.rejects(() => prepareJourneys({ mode: 'unknown' })); await assert.rejects(() => prepareJourneys({ mode: 'preview', base })); await assert.rejects(() => prepareJourneys({ mode: 'release' }));
});
test('future delivery needs exact source/code/destination, selected materials and independent scoped reviews', () => {
  assert.equal(resolve(fixture()).length, 3);
  for (const change of [d => delete d.authorizedBy, d => d.researchDigest = '0'.repeat(64), d => d.deliveryDigest = '0'.repeat(64), d => d.canonicalBase = 'https://elsewhere.example/', d => d.routes[0].revision = '9.0.0', d => d.materials.pop(), d => d.materials[0].basis = '', d => d.reviews.pop(), d => d.reviews[0].reviewer.independent = false, d => delete d.openChecks]) {
    const f = fixture(); change(f.decision); f.sync(); assert.throws(() => resolve(f));
  }
  const f = fixture(); f.files.set('docs/releases/journey-test-review.md', 'Changed'); assert.throws(() => resolve(f), /evidence changed/);
  const g = fixture(); g.event.evidence.path = '../escape'; assert.throws(() => resolve(g), /Unsafe/);
  const h = fixture(), data = structuredClone(p.data); data.plans.routes[0].outcome += ' changed'; assert.throws(() => resolve(h, [h.event], data), /research binding/);
});
test('partial route releases include only selected tasks, sources and canonical pages', () => {
  const f = fixture(['water-city']), states = resolve(f), r = renderJourneys(p.data, states, availability(), { mode: 'release', base });
  assert.equal(r.availableCount, 1); assert.deepEqual(r.canonicalPaths.sort(), ['journeys/', 'journeys/water-city/']);
  const all = [...r.outputs.values()].join(''); assert.ok(!all.includes('A woven cloth')); assert.ok(!all.includes('reutersagency.com')); assert.ok(!all.includes('kwasiasare.com'));
});
test('withdrawal removes tasks, titles, sources and targets throughout a fresh output', () => {
  const f = fixture(), w = withdrawal(f), states = resolve(f, [f.event, w]), r = renderJourneys(p.data, states, availability(), { mode: 'release', base });
  assert.equal(r.availableCount, 0); assert.equal(r.retainedCount, 3); assert.equal(r.canonicalPaths.length, 0);
  const all = [...r.outputs.values()].join('');
  for (const plan of p.data.plans.routes) for (const value of [plan.title, plan.outcome, plan.scope, ...plan.steps.map(s => s.task)]) assert.ok(!all.includes(escaped(value)), value);
  for (const s of p.data.sources.sources) assert.ok(!all.includes(s.url)); assert.ok(all.includes('&lt;withdrawal&gt;'));
  assert.throws(() => resolve(f, [w]), /previous release/); assert.throws(() => resolve(f, [f.event, w, f.event]), /new reviewed revision/);
});
test('new prose is escaped and navigation adapters fail closed on changed or repeated markup', () => {
  const data = structuredClone(p.data); data.plans.routes[0].steps[0].task = '<img src=x onerror=alert(1)>';
  const html = render(p.entries, availability(), data).outputs.get('journeys/water-city/index.html'); assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('<img'));
  for (const path of ['index.html', 'ideas/index.html', 'explore/index.html', 'domains/index.html', 'explore/notebooks/index.html']) {
    const original = path === 'index.html' ? '<main><a href="explore/">Explore</a>Existing</main>' : '<main>Existing</main>';
    const result = attachJourneyNavigation(path, original); assert.ok(result.includes('Existing')); assert.ok(result.includes('data-journey-entry'));
    assert.throws(() => attachJourneyNavigation(path, result), /repeated/); assert.throws(() => attachJourneyNavigation(path, 'unknown'), /Unknown/);
  }
  assert.equal(attachJourneyNavigation('ideas/alg-3.5a/index.html', 'Unchanged lesson'), 'Unchanged lesson');
});

test('release lists cannot conflate multiple reviews or materials into comma-joined identities', () => {
  const f = fixture(); f.decision.reviews = [{ ...f.decision.reviews[0], dimension: 'access,content,engineering' }]; f.sync(); assert.throws(() => resolve(f), /decisions required/);
  const g = fixture(), sorted = [...g.decision.materials].sort((a, b) => a.id.localeCompare(b.id));
  g.decision.materials = [{ ...sorted[0], id: sorted[0].id + ',' + sorted[1].id }, ...sorted.slice(2)]; g.sync(); assert.throws(() => resolve(g), /exact materials/);
});
test('a malformed anchor accepted by the planning shape cannot inject reader HTML', () => {
  const data = structuredClone(p.data), malicious = 'x"><img src=x onerror=alert(1)>';
  data.plans.routes[0].steps[0].id = malicious; data.plans.routes[0].transitions[0].fromStep = malicious;
  assert.throws(() => render(p.entries, availability(), data), /Unsafe journey step anchor/);
});

test('Asare reader adaptation cannot silently accept a changed source instruction', () => {
  const data = structuredClone(p.data); data.plans.routes[1].steps[4].task = 'Changed source task';
  assert.throws(() => render(p.entries, availability(), data), /Unknown Asare reader instruction/);
});
