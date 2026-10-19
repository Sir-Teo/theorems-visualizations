import test from 'node:test';
import assert from 'node:assert/strict';
import { PENALTY_SCORING, PENALTY_OBSERVED, penaltyEquilibrium } from '../content/game/ch02-b.js';
import { supportEnum, regret } from '../content/game/ch02.shared.js';

test('Palacios-Huerta p.402 matrix reproduces published row and column mixtures', () => {
  const A = PENALTY_SCORING, B = A.map(row => row.map(x => 100 - x));
  const eq = penaltyEquilibrium(A), [independent] = supportEnum(A, B);
  assert.ok(Math.abs(100 * eq.p - 38.54) < .01);
  assert.ok(Math.abs(100 * eq.q - 41.99) < .01);
  assert.ok(Math.abs(eq.p - independent.x[0]) < 1e-12);
  assert.ok(Math.abs(eq.q - independent.y[0]) < 1e-12);
  assert.ok(regret(A, B, independent.x, independent.y) < 1e-10);
  assert.equal(PENALTY_OBSERVED.p, .3998); assert.equal(PENALTY_OBSERVED.q, .4231);
});

test('penalty mixtures make each opponent indifferent and correctly handle boundaries', () => {
  const A = PENALTY_SCORING, eq = penaltyEquilibrium(A);
  const rows = A.map(row => row[0] * eq.q + row[1] * (1 - eq.q));
  const columns = [0, 1].map(j => eq.p * A[0][j] + (1 - eq.p) * A[1][j]);
  for (const value of [...rows, ...columns]) assert.ok(Math.abs(value - eq.val) < 1e-10);
  assert.equal(penaltyEquilibrium([[100, 100], [100, 100]]), null);
  assert.equal(penaltyEquilibrium([[100, 100], [30, 40]]), null);
});


import { entrySPE } from '../content/game/ch04.js';
import { leaf, dec, prep, isLeaf, backward, pureStrategies, asBeh, playBeh, kuhnBehaviour, mixedOutcome } from '../content/game/ch04.shared.js';

test('entry-game SPE includes both tie boundaries, checked against every pure deviation', () => {
  for (const f of [-2, 0, 1, 2, 3]) for (const l of [-3, -1, 0]) {
    const P = prep(dec(1, [['Out', leaf(0, 2)], ['In', dec(2, [['Fight', leaf(l, f)], ['Accept', leaf(1, 1)]])]]));
    const S = [pureStrategies(P, 1), pureStrategies(P, 2)], valid = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const b = asBeh(P, S[0][i], S[1][j]), u = playBeh(P, b).u;
      const rootOK = S.every((ss, k) => ss.every(s => playBeh(P, asBeh(P, k === 0 ? s : S[0][i], k === 1 ? s : S[1][j])).u[k] <= u[k]));
      const subgameOK = (j === 0 ? f : 1) >= Math.max(f, 1);
      if (rootOK && subgameOK) valid.push([i, j]);
    }
    assert.deepEqual(entrySPE(f, l), valid);
  }
  assert.equal(entrySPE(1, 0).length, 3);
});

test('Kuhn conditional construction handles correlated plans, unreachable sets, chance and all opponent plans', () => {
  const P = prep(dec(1, [['U', dec(0, [['left', dec(1, [['a', leaf(1, 0)], ['b', leaf(2, 0)]], 'B'), .3], ['right', dec(2, [['l', leaf(3, 1)], ['r', leaf(4, 2)]], 'X'), .7]])], ['D', dec(2, [['l', dec(1, [['a', leaf(5, 0)], ['b', leaf(6, 0)]], 'E')], ['r', dec(1, [['a', leaf(7, 0)], ['b', leaf(8, 0)]], 'E')]], 'Y')]], 'A'));
  const S = pureStrategies(P, 1), O = pureStrategies(P, 2);
  const mixtures = [S.map(s => +(s.A === s.B && s.B === s.E)), S.map(s => +(s.A === 0)), S.map((s, i) => i === 0 ? 1 : i === S.length - 1 ? 1e-14 : 0)];
  for (const w of mixtures) {
    const total = w.reduce((a, b) => a + b), mu = w.map(x => x / total), own = kuhnBehaviour(P, 1, S, mu);
    for (const opponent of O) {
      const others = asBeh(P, S[0], opponent), expected = mixedOutcome(P, 1, S, mu, others), actual = playBeh(P, { ...others, ...own });
      P.leaves.forEach((l, i) => assert.ok(Math.abs((actual.leafP.get(l) || 0) - expected[i]) < 1e-15));
      assert.ok(Math.abs(expected.reduce((a, b) => a + b) - 1) < 1e-14);
    }
  }
});

test('backward-induction profile survives exhaustive deviations in every subgame', () => {
  for (let seed = 0; seed < 32; seed++) {
    const make = (depth, path) => depth === 0 ? leaf((path * 7 + seed) % 5, (path * 11 + seed * 3) % 5) : dec(depth % 2 + 1, [['a', make(depth - 1, path * 2)], ['b', make(depth - 1, path * 2 + 1)]]);
    const P = prep(make(3, 1)); backward(P.root);
    const profile = Object.fromEntries(P.nodes.filter(n => !isLeaf(n)).map(n => [n.key, n.bi[0]]));
    for (const node of P.nodes.filter(n => !isLeaf(n))) {
      const Q = prep(structuredClone((() => { const clean = n => isLeaf(n) ? leaf(...n.u) : dec(n.p, n.kids.map(k => [k.a, clean(k.n)]), n.key); return clean(node); })()));
      const payoff = playBeh(Q, asBeh(Q, profile, profile)).u;
      for (const player of [1, 2]) for (const dev of pureStrategies(Q, player)) assert.ok(playBeh(Q, asBeh(Q, player === 1 ? dev : profile, player === 2 ? dev : profile)).u[player - 1] <= payoff[player - 1]);
    }
  }
});


import { blotto } from '../content/game/ch03-b.js';
import { solveZS, guarantee, ceiling } from '../content/game/ch03.shared.js';
import { chainStrat, chainValue, chainEntry } from '../content/game/ch04-b.js';

test('discrete Blotto LP verifies every pure reply and its pure-security claim for all displayed budgets', () => {
  for (let N = 3; N <= 12; N++) {
    const { al, A, sol, pure } = blotto(N);
    assert.equal(al.length, (N + 1) * (N + 2) / 2);
    assert.equal(pure.maxmin, N === 3 ? 0 : -.5);
    assert.ok(Math.abs(sol.v) < 1e-9);
    for (let i = 0; i < al.length; i++) {
      assert.ok(A[i].reduce((s, x, j) => s + x * sol.y[j], 0) < 1e-8);
      assert.ok(A.reduce((s, row, j) => s + sol.x[j] * row[i], 0) > -1e-8);
      for (let j = 0; j < al.length; j++) assert.ok(Math.abs(A[i][j] + A[j][i]) < 1e-12);
    }
  }
});

test('LP game solver matches independent bimatrix support enumeration on rectangular and degenerate games', () => {
  const games = [[[2,-1],[0,3]], [[1,1],[1,1]], [[2,-3,1],[-1,2,0]], [[-4,2],[3,-2],[1,0]]];
  for (const A of games) {
    const solved = solveZS(A), equilibria = supportEnum(A, A.map(r => r.map(x => -x)));
    assert.ok(equilibria.length > 0);
    assert.ok(Math.abs(solved.v - A.reduce((sum, row, i) => sum + equilibria[0].x[i] * row.reduce((s, x, j) => s + x * equilibria[0].y[j], 0), 0)) < 1e-8);
    assert.ok(Math.abs(guarantee(A, solved.x) - solved.v) < 1e-8);
    assert.ok(Math.abs(ceiling(A, solved.y) - solved.v) < 1e-8);
  }
});

test('chain-store recursion satisfies both players one-shot-deviation inequalities including belief thresholds', () => {
  for (let k = 1; k <= 12; k++) for (const p of [.002, .05, .2, .5, 2 ** -k, (2 ** -k) * .99, (2 ** -k) * 1.01]) {
    const {e,s} = chainStrat(k,p), q = p + (1-p)*s;
    const entrantIn = 2*(1-q), out = 1;
    if(e > 1e-8) assert.ok(entrantIn >= out - 1e-7);
    if(e < 1-1e-8) assert.ok(out >= entrantIn - 1e-7);
    const fight = q > 0 ? chainValue(k-1,p/q) : 0, accommodate = 2*k;
    if(s > 1e-8) assert.ok(fight >= accommodate - 1e-7);
    if(s < 1-1e-8) assert.ok(accommodate >= fight - 1e-7);
    assert.ok(e>=0 && e<=1 && s>=-1e-12 && s<=1);
    const r = chainEntry(k,p);
    for(const value of r.ent) assert.ok(value >= -1e-10 && value <= 1+1e-10);
  }
});


import { continuousThresholdAcceptance } from '../content/game/ch04-b.js';
import * as MathTools from '../assets/js/viz/math.js';
test('continuous normal thresholds accept half at their mean, without a half-unit continuity shift', () => {
  const erf = MathTools.erf;
  assert.equal(continuousThresholdAcceptance(3, 3, 1.5, erf), .5);
  assert.ok(Math.abs(continuousThresholdAcceptance(4.5, 3, 1.5, erf) - .841344746068543) < 1e-7);
  assert.ok(Math.abs(continuousThresholdAcceptance(1.5, 3, 1.5, erf) - .158655253931457) < 1e-7);
});
