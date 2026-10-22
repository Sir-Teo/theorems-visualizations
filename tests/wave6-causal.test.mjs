import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as M from '../assets/js/viz/math.js';
import * as B from '../content/causal/ch06.shared.js';
import * as R from '../content/opt/ch06.shared.js';
const near = (a, b, tolerance = 2e-10) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('binary DAG enumeration agrees with independent reduced-form identities and exclusion failures', () => {
  for (const strength of [0, .137, .4]) for (const direct of [0, .2]) for (const association of [0, .8]) {
    const p = B.instrumentPopulation({ strength, direct, association });
    near(B.sum(p.cells.map(c => c.p)), 1); assert.ok(p.cells.every(c => c.p >= 0));
    near(p.first, strength + .2 * association); near(p.reduced, .25 * p.first + .25 * association + direct);
    if (strength && !direct && !association) near(p.ratio, .25);
  }
  assert.equal(B.instrumentPopulation({ strength: 0 }).ratio, null);
});
test('two-stage projection, Wald difference and moment equation coincide on deterministic data', () => {
  const data = Array.from({ length: 12 }, (_, i) => ({ z: +(i >= 6), a: .3 * i + Math.sin(i), y: -.7 * i + Math.cos(i) }));
  const s = B.ivStatistics(data), z = data.map(r => r.z), a = data.map(r => r.a), y = data.map(r => r.y);
  const x = M.lstsq(z.map(z => [1, z]), a), fitted = z.map(z => x[0] + x[1] * z), beta = M.lstsq(fitted.map(x => [1, x]), y);
  near(s.stage1.slope, x[1]); near(s.slope, beta[1]); near(s.stage2.slope, beta[1]);
  near(B.sum(data.map(r => (r.z - .5) * (r.y - s.slope * r.a))), 0);
  assert.equal(B.regression([1, 1], [2, 3]), null);
  assert.equal(B.ivStatistics(data.map(r => ({ ...r, a: 1 }))).slope, null);
});
test('AR inversion agrees with direct pooled two-sample t tests across weak and invalid instruments', () => {
  for (const strength of [0, .03, 1.2]) for (const direct of [0, .2]) {
    const data = B.linearSample(M, M.rng(45), { n: 40, strength, direct }), s = B.ivStatistics(data), c = M.dist.studentT(38).quantile(.975);
    const q = B.arCoefficients(s, c), intervals = B.quadraticSet(q);
    for (const candidate of [-100, -5, -.3, 0, .7, 2, 20, 100]) {
      const arms = [0, 1].map(z => data.filter(r => r.z === z).map(r => r.y - candidate * r.a));
      const m = arms.map(B.mean), pooled = B.sum(arms.flatMap((a, j) => a.map(x => (x - m[j]) ** 2))) / 38;
      const directAccept = (m[1] - m[0]) ** 2 <= c * c * pooled * (1 / arms[0].length + 1 / arms[1].length);
      assert.equal(B.polynomial(q, candidate) <= 0, directAccept);
      assert.equal(intervals.some(([lo, hi]) => lo <= candidate && candidate <= hi), directAccept);
    }
  }
});
test('quadratic confidence sets retain empty, singleton, half-line, two-ray and whole-line cases', () => {
  assert.deepEqual(B.quadraticSet([1, 0, 1]), []);
  assert.deepEqual(B.quadraticSet([-1, 0, -1]), [[-Infinity, Infinity]]);
  assert.deepEqual(B.quadraticSet([1, -2, 1]), [[1, 1]]);
  assert.deepEqual(B.quadraticSet([-1, 0, 1]), [[-Infinity, -1], [1, Infinity]]);
  assert.deepEqual(B.quadraticSet([0, 2, 4]), [[-Infinity, -2]]);
  assert.deepEqual(B.quadraticSet([0, -2, 4]), [[2, Infinity]]);
  assert.deepEqual(B.quadraticSet([0, 0, 0]), [[-Infinity, Infinity]]);
  assert.deepEqual(B.quadraticSet([0, 0, 1]), []);
  const roots = B.quadraticSet([1, -1e8, 1])[0]; near(roots[0], 1e-8, 1e-20); near(roots[1], 1e8);
});
test('Gaussian AR coverage remains nominal with zero first stage; finite ratio tails stay visible', () => {
  for (const strength of [0, .1, 1]) {
    const e = B.ivExperiment(M, { n: 40, reps: 6000, seed: 18, strength });
    assert.ok(Math.abs(e.ar.mean - .95) < 5 * e.ar.se);
    if (strength === 0) assert.ok(e.estimates.some(x => Math.abs(x) > 50));
  }
  const h = B.histogram([null, -Infinity, -4, -1, 0, 1, 4], -1, 1, 2);
  assert.deepEqual([h.left, h.right, h.unavailable, B.sum(h.counts)], [1, 1, 2, 3]);
  near(B.sum(h.density) * h.width, 3 / 7);
});
test('principal strata reveal signed defier weights and observational ambiguity', () => {
  for (const weights of [[0, 1, 0, 0], [3, 7, 0, 2], [3, 7, 2, 2], [0, 1, 1, 0], [0, 0, 0, 2]]) {
    const e = B.principal(weights, [-.2, .8, -.7, .5]);
    near(B.sum(e.cells[0].flat()), 1); near(B.sum(e.cells[1].flat()), 1);
    near(B.sum(e.cells[1][1]) - B.sum(e.cells[0][1]), e.first);
    if (weights[1] && !weights[2]) near(e.ratio, .8);
    if (weights[1] === weights[2]) assert.equal(e.ratio, null);
  }
  assert.equal(B.principal([0, 0, 0, 0]), null);
  // Same observed treatment rates, different latent strata: add equal complier/defier mass.
  assert.deepEqual(B.principal([1, 0, 0, 1]).cells.map(row => row.map(B.sum)), B.principal([0, 1, 1, 0]).cells.map(row => row.map(B.sum)));
});
test('Manski completions attain every interval point while preserving observations and monotone response', () => {
  for (const counts of [[6, 2, 3, 9], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) for (const monotone of [false, true]) for (const t of [0, .1234567, 1]) {
    const m = B.manski(counts, t, monotone); near(m.ate, m.low + t * (m.high - m.low));
    for (const a of [0, 1]) for (const y of [0, 1]) near(B.sum(m.cells.filter(c => c.a === a && c['y' + a] === y).map(c => c.p)), m.p[2 * a + y]);
    if (monotone) assert.ok(m.cells.every(c => !c.p || c.y1 >= c.y0)); else near(m.high - m.low, 1);
  }
  assert.equal(B.manski([0, 0, 0, 0]), null);
});

// Independent closed formulas read in Balke–Pearl (1997), PDF page 3, Eqs 4–5.
function publishedBounds(rows) {
  const p = (y, a, z) => rows[z][2 * a + y] / B.sum(rows[z]);
  const a = p(0, 0, 0), b = p(0, 1, 0), c = p(1, 0, 0), d = p(1, 1, 0), e = p(0, 0, 1), f = p(0, 1, 1), g = p(1, 0, 1), h = p(1, 1, 1);
  return [Math.max(a+h-1,e+h-1,d+e-1,a+d-1,2*a+d+g+h-2,a+2*d+e+f-2,c+d+2*e+h-2,a+b+e+2*h-2),
    Math.min(1-c-f,1-b-g,1-b-c,1-f-g,2-2*b-c-g-h,2-b-2*c-e-f,2-c-d-2*f-g,2-a-b-f-2*g)];
}
function fraction(s) { const [n, d = '1'] = s.split('/'); return R.R(BigInt(n), BigInt(d)); }
test('exact response-type LP agrees with published bounds, deterministic vertices and exact witness mixtures', () => {
  const rng = M.rng(77);
  for (let k = 0; k < 160; k++) {
    const weights = B.responseTypes.map((_, j) => k < 16 ? +(j === k) : Math.floor(rng() * 10)), rows = B.responseTable(weights);
    const r = B.balkePearl(rows, false, k % 101), expected = publishedBounds(rows);
    assert.equal(r.status, 'optimal'); near(r.low, expected[0]); near(r.high, expected[1]);
    const exact = r.weightsExact.map(fraction);
    B.responseMatrix.forEach((row, i) => assert.equal(R.cmp(R.dot(row, exact), R.R(rows[i >> 2][i & 3], B.sum(rows[i >> 2]))), 0));
    const truth = B.dot(weights, B.responseTypes.map(t => t.y1 - t.y0)) / B.sum(weights);
    assert.ok(r.low <= truth + 1e-12 && truth <= r.high + 1e-12);
    near(r.effect, r.low + (k % 101) / 100 * (r.high - r.low));
  }
});
test('bounds reject inconsistent tables, handle zero conditional rows, and retain monotonicity constraints', () => {
  assert.equal(B.balkePearl(B.tablePresets.incompatible).status, 'infeasible');
  assert.equal(B.balkePearl([[0, 0, 0, 0], [1, 0, 0, 0]]).status, 'undefined conditional row');
  const perfect = B.balkePearl(B.tablePresets.perfect); near(perfect.low, 1); near(perfect.high, 1);
  const reversed = [[0, 0, 1, 0], [1, 0, 0, 0]];
  assert.equal(B.balkePearl(reversed).status, 'optimal'); assert.equal(B.balkePearl(reversed, true).status, 'infeasible');
  const monoWeights = B.responseTypes.map(t => t.a0 <= t.a1 ? 1 + t.y0 + 2 * t.y1 : 0), rows = B.responseTable(monoWeights);
  const r = B.balkePearl(rows, true); assert.equal(r.status, 'optimal');
  B.responseTypes.forEach((t, j) => { if (t.a0 > t.a1) assert.equal(r.weights[j], 0); });
});
test('instrumental inequalities hold on every response vertex and detect a fixed-treatment outcome flip', () => {
  for (let j = 0; j < 16; j++) assert.ok(B.instrumentalInequality(B.responseTable(B.responseTypes.map((_, i) => +(i === j)))).maximum <= 1);
  assert.equal(B.instrumentalInequality(B.tablePresets.incompatible).maximum, 2);
  assert.equal(B.instrumentalInequality([[0, 0, 0, 0], [1, 0, 0, 0]]), null);
});
test('DiD isolates post-period trend and anticipation bias; flat pretrends do not rule out a post shock', () => {
  const p = B.didPopulation({ tau: .7, shock: .6 });
  near(p.treated[2] - p.treated[1], p.control[2] - p.control[1]); near(p.did, 1.3);
  for (const shape of ['normal', 'skewed', 'heavy tails']) {
    const e = B.didExperiment(M, { n: 20, reps: 4000, seed: 3, shape, trend: .2, shock: -.4, anticipation: .3 });
    near(e.expected, .2); assert.ok(Math.abs(e.measured.mean - e.expected) < 5 * e.measured.se);
    if (shape === 'normal') near(Math.sqrt(e.measured.variance), e.sd, .025);
  }
});
test('local linear cutoff coefficients reproduce affine functions and match independent weighted least squares', () => {
  for (const density of ['balanced', 'more above']) for (const bandwidth of [.2, .617, 1]) {
    const e = B.rdExperiment(M, { n: 80, density, bandwidth, reps: 1 }); assert.equal(e.status, 'fit');
    for (let side = 0; side < 2; side++) {
      const weights = B.localLinearWeights(e.xs, bandwidth, side); near(B.sum(weights.intercept), 1); near(B.dot(weights.intercept, e.xs), 0);
      const ii = e.xs.map((x, i) => ({ x, i })).filter(({ x }) => (side ? x >= 0 : x < 0) && Math.abs(x) < bandwidth);
      const rows = ii.map(({ x }) => [Math.sqrt(1 - Math.abs(x) / bandwidth), x * Math.sqrt(1 - Math.abs(x) / bandwidth)]);
      const ys = ii.map(({ x, i }) => e.first.ys[i] * Math.sqrt(1 - Math.abs(x) / bandwidth)), fit = M.lstsq(rows, ys);
      near(e.first.fits[side].intercept, fit[0]); near(e.first.fits[side].slope, fit[1]);
    }
  }
  assert.equal(B.rdExperiment(M, { n: 20, bandwidth: .05 }).status, 'insufficient local rank');
  for (const density of ['balanced', 'more above']) near(B.rdExperiment(M, { density, curvature: 0, sigma: 0, reps: 1 }).first.fits[1].intercept, .7);
});
test('RD conditional sampling moments match exact linear-weight predictions, separately from causal bias', () => {
  for (const shape of ['normal', 'skewed', 'heavy tails']) {
    const e = B.rdExperiment(M, { reps: 5000, n: 80, bandwidth: .6, seed: 6, shape, jump: .4 });
    assert.ok(Math.abs(e.measured.mean - e.expected) < 5 * e.measured.se);
    assert.ok(Math.abs(e.expected - e.tau) > .3);
    if (shape === 'normal') near(Math.sqrt(e.measured.variance), e.sd, .02);
  }
});
test('genetic association formulas agree with full ancestry/genotype enumeration', () => {
  for (const structure of [false, true]) for (const pleiotropy of [0, .4]) {
    const p = B.mrPopulation({ structure, pleiotropy, strength: .8 }), cells = [];
    for (const ancestry of [-1, 1]) for (let k = 0; k < 243; k++) {
      let j = k, mass = .5; const genes = [];
      for (let l = 0; l < 5; l++) { const g = j % 3; j = Math.floor(j / 3); const q = B.geneticFrequencies[l] + p.d[l] * ancestry; genes.push(g); mass *= g === 0 ? (1-q)**2 : g === 1 ? 2*q*(1-q) : q*q; }
      const centered = genes.map((g, i) => g - 2 * B.geneticFrequencies[i]), x = B.dot(p.gamma, centered) + p.kappa * ancestry;
      cells.push({ centered, mass, x, y: p.tau*x+p.kappa*ancestry+B.dot(p.alpha,centered) });
    }
    near(B.sum(cells.map(c => c.mass)), 1);
    for (let j = 0; j < 5; j++) {
      const variance = B.sum(cells.map(c => c.mass*c.centered[j]**2));
      near(B.sum(cells.map(c => c.mass*c.centered[j]*c.x))/variance,p.bx[j]);
      near(B.sum(cells.map(c => c.mass*c.centered[j]*c.y))/variance,p.by[j]);
    }
  }
  assert.deepEqual(B.mrPopulation({ strength: 0 }).ratios, [null,null,null,null,null]);
});

test('frozen identities and authored syllabus match; cross-chapter proof inputs are written',async()=>{
  const plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))),frozen=plan.chapters.find(c=>(c.col||c.collection)==='causal').items,parts=await Promise.all(['','-b'].map(p=>import(`../content/causal/ch06${p}.js`))),items=parts.flatMap(p=>p.default.items),syllabus=(await import('../content/causal/syllabus.js')).default.chapters.find(c=>c.n===6).items;
  assert.equal(items.length,12);assert.equal(frozen.length,12);
  for(const [j,item] of items.entries()){assert.equal('causal-'+item.num,frozen[j].id);for(const key of ['name','kind','verify','paper','introduces']){assert.deepEqual(item[key],frozen[j][key]);assert.deepEqual(item[key],syllabus[j][key]);}assert.deepEqual(item.deps,syllabus[j].deps);assert.deepEqual(item.refs,syllabus[j].refs);assert.equal(item.caption,syllabus[j].pic);for(const key of ['statement','idea','caption','scope'])assert.ok(item[key]?.length>100);assert.equal(typeof item.viz,'function');}
  for(const id of new Set(items.flatMap(i=>i.deps).filter(id=>!id.startsWith('causal-6.')))){const [col,num]=id.split('-'),chapter=num.split('.')[0].padStart(2,'0'),dir=new URL('../content/'+col+'/',import.meta.url);let found=false;for(const f of fs.readdirSync(dir).filter(f=>new RegExp('^ch'+chapter+'(?:-[a-z0-9]+)?\\.js$').test(f))){const m=(await import(new URL(f,dir))).default;if(m.items.some(i=>i.num===num))found=true;}assert.ok(found,id+' is written');}
});

test('synthetic genotype samples retain actual marginal projections under all three noise laws', () => {
  for (const structure of [false, true]) for (const shape of ['normal', 'skewed', 'heavy tails']) {
    const e = B.mrExperiment(M, { n: 40, reps: 100, seed: 13, shape, structure, pleiotropy: -.137, variant: 3 });
    for (let j = 0; j < 5; j++) {
      const X = e.first.data.map(r => [1, r.genes[j]]), bx = M.lstsq(X, e.first.data.map(r => r.x))[1], by = M.lstsq(X, e.first.data.map(r => r.y))[1];
      near(e.first.bx[j], bx); near(e.first.by[j], by); near(e.first.ratios[j], by / bx);
    }
    near(e.estimates[0], e.first.ratios[3]);
  }
});
