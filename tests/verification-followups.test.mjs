import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archGeometry, archFeasible, thrustAt } from '../content/tech/ch04.shared.js';
import { spinDownTime } from '../content/geo/ch04.shared.js';
import { runPlankton, introducePlankton, planktonParameters } from '../content/ecol/plankton.shared.js';
import { mathieuFloquet } from '../content/ode/mathieu.shared.js';
import { matFlow, eye } from '../content/ode/ch03.shared.js';
import { competitionSystem, overlap } from '../content/ecol/competition-system.shared.js';
import { sensitivityDistribution, sensitivityHistogram } from '../content/climate/sensitivity.shared.js';

function threshold(N) {
  let lo = .08, hi = .15;
  for (let k = 0; k < 26; k++) {
    const mid = (lo + hi) / 2;
    if (archFeasible(archGeometry(mid, Math.PI / 2, N), 4, 4).ok) hi = mid; else lo = mid;
  }
  return hi;
}
test('the minimum semicircular ring converges to the published mean-radius benchmark', () => {
  const coarse = threshold(24), fine = threshold(96), finer = threshold(192);
  const mean = t => t / (1 + t / 2);
  assert.ok(Math.abs(mean(finer) - .10748) < 1e-5);
  assert.ok(Math.abs(finer - fine) < Math.abs(fine - coarse));
  assert.ok(fine > .1135 && fine < .1137, 'intrados and mean radius are different conventions');
});
test('a narrow admissible thrust interval cannot disappear between grid samples', () => {
  const a = archGeometry(.114, Math.PI / 2, 96);
  const r = archFeasible(a, 4, 4);
  assert.equal(r.ok, true);
  assert.ok(r.Hmax - r.Hmin < .002);
  assert.equal(archFeasible(archGeometry(.11, Math.PI / 2, 96), 4, 4).ok, false);
});
test('extreme and intermediate admissible thrust lines stay inside every radial joint', () => {
  for (const alpha of [Math.PI / 3, Math.PI / 2]) for (const t of [.114, .12, .16, .3]) {
    const a = archGeometry(t, alpha, 96), r = archFeasible(a);
    assert.equal(r.ok, true);
    for (const f of [0, .2, .5, .8, 1]) {
      const H = r.min.H * (1 - f) + r.max.H * f;
      const Q = r.min.H * r.min.yc * (1 - f) + r.max.H * r.max.yc * f;
      for (const rho of thrustAt(a, H, Q / H)) assert.ok(rho >= a.Ri - 1e-10 && rho <= a.Re + 1e-10, `${alpha}, ${t}, ${f}: ${rho}`);
    }
  }
});

test('two-lid spin-down uses the original half-depth L, with twice the one-lid damping', () => {
  // Greenspan & Howard (1963), §3: plate separation 2L and T=L/sqrt(nu*Omega).
  assert.ok(Math.abs(spinDownTime(.08, 1e-6, 3, 2) - 23.09401076758503) < 1e-12);
  assert.equal(spinDownTime(.08, 1e-6, 3, 1), 2 * spinDownTime(.08, 1e-6, 3, 2));
});

test('plankton introductions follow the original Methods, including later abundance 0.1', () => {
  const st = { N: Array(12).fill(0) };
  introducePlankton(st, [0, 1, 2, 3, 4], 0);
  for (let i = 0; i < 5; i++) assert.ok(Math.abs(st.N[i] - [.11, .12, .13, .14, .15][i]) < 1e-15);
  introducePlankton(st, [5, 6, 7], 1000);
  assert.deepEqual(st.N.slice(5, 8), [.1, .1, .1]);
  assert.deepEqual(st.N.slice(8), [0, 0, 0, 0]);
  const p = planktonParameters(12);
  assert.deepEqual(p.K[0], [.39, .22, .27, .30, .34]);
  assert.deepEqual(p.Q[11], [.03, .04, .01, .05, .04]);
  assert.deepEqual(p.S, [6, 10, 14, 4, 9]);
});

test('plankton step refinement approaches an independent high-accuracy ODE solution', () => {
  // SciPy 1.17 DOP853, rtol=1e-11, atol=1e-12, original equations (1)–(3).
  const times = [20, 50, 100, 200];
  const reference = [
    [14.260223079410471,27.11036091353193,39.48102781989509,14.558540530905649,22.533828954628156],
    [12.215864416370634,12.390420873823608,36.74213697762352,15.491806040382817,42.97426151120146],
    [8.516889361471021,21.445952272091052,36.3965512532041,11.884512409662014,42.06028981934554],
    [15.41251930032936,21.376338695915873,37.41025261321215,14.106134814409833,30.91521330308973],
  ];
  const a = runPlankton(5, 200, 0, .05), b = runPlankton(5, 200, 0, .025);
  for (let j = 0; j < times.length; j++) {
    const error = r => Math.max(...Array.from(r[times[j] / 5], (x, k) => Math.abs(x - reference[j][k])));
    assert.ok(error(b) < error(a) / 3);
    assert.ok(error(b) < .003);
  }
});

test('twelve-species simulation preserves introduction times and finite nonnegative abundances', () => {
  const r = runPlankton(12);
  for (const [time, ids] of [[1000,[5,6,7]], [3000,[8,9]], [5000,[10,11]]]) {
    for (const i of ids) { assert.equal(r[time / 5 - 1][i], 0); assert.equal(r[time / 5][i], .1); }
  }
  for (const row of r) for (const x of row) assert.ok(Number.isFinite(x) && x >= 0);
  assert.ok(r.at(-1).every(x => x > .01), 'finite-run persistence at the displayed threshold');
});

test('the fixed-size Mathieu integrator agrees with the existing general matrix flow', () => {
  for (const [d, e, c] of [[.3,.5,0], [.01,1.48,.4], [1.58,1.48,0], [1,0,.2]]) {
    const reference = matFlow(t => [[0,1],[-(d+e*Math.cos(t)),-c]], eye(2), 0, 2*Math.PI, 64);
    const actual = mathieuFloquet(d,e,c).matrix;
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)assert.ok(Math.abs(reference[i][j]-actual[i][j])<1e-11);
  }
});
test('Mathieu damping obeys Liouville’s determinant and includes the delta shift', () => {
  for(const [d,e,c] of [[.3,.5,.2],[1,.8,.4]]) {
    const damped=mathieuFloquet(d,e,c,256), shifted=mathieuFloquet(d-c*c/4,e,0,256);
    assert.ok(Math.abs(damped.determinant-Math.exp(-c*2*Math.PI))<1e-7);
    assert.ok(Math.abs(damped.growth-(shifted.growth-c/2))<1e-7);
  }
  assert.ok(Math.abs(mathieuFloquet(1,0,.2,256).growth+.1)<1e-7);
});

test('overlap kernels agree with independent analytic autocorrelations', () => {
  assert.equal(overlap('b', 0), 1); assert.equal(overlap('b', 2), 0);
  assert.ok(Math.abs(overlap('g', 2) - 1 / Math.E) < 1e-15);
  assert.ok(Math.abs(overlap('l', 1) - 2 / Math.E) < 1e-15);
});
test('unresolved packed Gaussian systems cannot be reported as species losses', () => {
  const p = competitionSystem('g', 9, .2);
  assert.ok(p.rcond < 1e-10);
  assert.equal(p.solve(Array(9).fill(1)).status, 'unresolved');
});
test('resolved overlap equilibria satisfy the resource equations', () => {
  for (const kind of ['g','l','b']) {
    const p = competitionSystem(kind, 5, 2), K = [1,1.02,.98,1.01,1];
    const r = p.solve(K); assert.equal(r.status,'feasible');
    for(let i=0;i<5;i++)assert.ok(Math.abs(p.M[i].reduce((s,a,j)=>s+a*r.x[j],0)-K[i])<1e-10);
  }
});

test('stable-branch climate quantiles invert the same conditioned distribution', () => {
  for(const [mu,sigma,D] of [[.65,.15,1.2],[.85,.35,1.6],[.2,.02,.8]]) {
    const d=sensitivityDistribution(mu,sigma,D);
    // Phi uses the existing A&S 7.1.26 approximation (~1e-7 accuracy), so
    // inversion is checked against that accuracy rather than machine epsilon.
    for(const p of [.05,.5,.95]) assert.ok(Math.abs(d.cdf(d.quantile(p))-p)<2e-7);
    assert.equal(d.quantile(0),0); assert.equal(d.quantile(1),Infinity);
    assert.equal(d.mean,Infinity);
  }
  const d=sensitivityDistribution(.85,.35,1.2);
  assert.ok(d.quantile(.5)<1.2/(1-.85), 'conditioning changes the median when excluded mass is appreciable');
});
test('conditioned climate densities normalize on the full positive half-line', () => {
  for(const [mu,sigma,D] of [[.65,.15,1.2],[.85,.35,1.6],[.2,.02,.8]]) {
    const d=sensitivityDistribution(mu,sigma,D), n=12000;
    const asymptote=D*Math.exp(-.5*((1-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI)*d.stable);
    const f=x=>x===0?0:x===1?asymptote:d.pdf(x/(1-x))/(1-x)**2;
    let sum=f(0)+f(1);for(let k=1;k<n;k++)sum+=(k%2?4:2)*f(k/n);
    assert.ok(Math.abs(sum/(3*n)-1)<1e-6);
  }
});
test('stable exceedance probability excludes runaway draws', () => {
  const d=sensitivityDistribution(.85,.35,1.2);
  // Independent SciPy normal-CDF values, rounded below to seven decimals.
  assert.ok(Math.abs(d.runaway-.3341175709)<2e-7);
  assert.ok(d.tail(4.5)>0 && d.tail(4.5)<.5);
  assert.ok(Math.abs(d.tail(4.5)+d.cdf(4.5)-1)<1e-15);
});
test('climate histogram mass beyond the plot window is not renormalized away', () => {
  const h=sensitivityHistogram([1,2,3,20],12,12);
  assert.equal(h.outside,1);
  assert.equal(h.density.reduce((s,x)=>s+x,0),.75);
});
