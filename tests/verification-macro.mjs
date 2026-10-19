// Independent mathematical checks for the chapter 4 verification corrections.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rckModel } from '../content/macro/ch04.js';
import { malthus } from '../content/macro/ch04-b.js';
import { growthAccounts } from '../content/macro/ch03-b.js';
import { capitalAt, ideaGrowthAt, AJR_DATA, iv1, ols } from '../content/macro/ch04.shared.js';

const close = (actual, expected, tol = 1e-9) => assert.ok(Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected)), `${actual} versus ${expected}`);

test('Ramsey stable arm agrees with the independently soluble theta=alpha case', () => {
  // Substituting c=B k into both Euler and resource equations gives B below.
  for (const rho of [.005, .03, .1]) {
    const a = .5, d = .05, m = rckModel(1, a, d, rho, a);
    const B = (rho + (1 - a) * d) / a;
    for (const k of [.03 * 2 * m.kg, .2 * m.ks, m.ks, 1.9 * m.kg]) close(m.saddle(k), B * k, 2e-8);
    close(m.saddle(m.ks), m.cs);
    close(m.fp(m.ks), d + rho);
    assert.ok(m.ks < m.kg);
  }
});

test('Ramsey computed arm obeys both differential equations across slider extremes', () => {
  for (const [a, rho, theta] of [[.2, .1, .5], [.33, .03, 2], [.5, .005, 5]]) {
    const m = rckModel(1, a, .05, rho, theta);
    for (const ratio of [.2, .45, .8, 1.2, 2]) {
      const k = ratio * m.ks, h = 1e-4 * m.ks, c = m.saddle(k);
      const dcDk = (m.saddle(k + h) - m.saddle(k - h)) / (2 * h);
      const [dk, dc] = m.F(k, c);
      assert.ok(Math.abs(dcDk * dk - dc) / Math.max(1e-6, Math.abs(dc)) < .005);
      assert.equal(Math.sign(dk), Math.sign(m.ks - k));
    }
  }
});

test('AK trajectories have exact log slopes and switch continuously at year 50', () => {
  for (const s of [.05, .2, .4]) for (const d of [.02, .12]) {
    const k = capitalAt(1, 150, s, .35, 1, d);
    close(Math.log(k), (s * .35 - d) * 150);
    const k50 = capitalAt(1, 50, s, .35, 1, d);
    close(capitalAt(k50, 100, .3, .35, 1, d), Math.exp((s * .35 - d) * 50 + (.3 * .35 - d) * 100));
  }
});

test('diminishing-return capital flow satisfies the resource ODE and steady state', () => {
  for (const a of [.5, .75, .99]) {
    const s = .2, A = .35, d = .06, kStar = (s * A / d) ** (1 / (1 - a));
    close(capitalAt(kStar, 150, s, A, a, d), kStar);
    const t = 40, h = .001, k = capitalAt(1, t, s, A, a, d);
    const deriv = (capitalAt(1, t + h, s, A, a, d) - capitalAt(1, t - h, s, A, a, d)) / (2 * h);
    close(deriv, s * A * k ** a - d * k, 1e-8);
  }
});

test('Jones growth uses the full horizon, its zero-population limit, and phi=0 closed form', () => {
  const g0 = .02, n = Math.log(23) / 84;
  close(ideaGrowthAt(84, g0, 1, n, 1) / g0, 23);
  for (const lambda of [.3, 1]) {
    const q = lambda * n, t = 84;
    // phi=0: integrate A'=g0 exp(qt) from A(0)=1 directly.
    const A = 1 + g0 * (Math.exp(q * t) - 1) / q;
    close(ideaGrowthAt(t, g0, lambda, n, 0), g0 * Math.exp(q * t) / A);
    close(ideaGrowthAt(t, g0, lambda, 0, -.9), g0 / (1 + 1.9 * g0 * t));
  }
  const phi = 1 - n / g0;
  close(ideaGrowthAt(84, g0, 1, n, phi), g0);
});

test('Malthus shock preserves population at impact and the income-production identity', () => {
  const a = .7, eta = .01, boost = 1.8, path = malthus(a, eta, boost, 0, 10000);
  close(path[299][1], 1); close(path[300][1], 1); close(path[300][2], boost);
  for (const [t, N, y, lnA] of path) close(Math.log(y), lnA - (1 - a) * Math.log(N));
  close(path.at(-1)[1], boost ** (1 / (1 - a)), 1e-10);
  close(path.at(-1)[2], 1, 1e-10);
});

test('sustained progress requires above-subsistence Malthusian income', () => {
  const a = .7, eta = .01, g = .001, p = malthus(a, eta, 1, g, 10000);
  const y = p.at(-1)[2], n = Math.log(p.at(-1)[1] / p.at(-2)[1]);
  close(y, Math.exp(g / (eta * (1 - a))), 1e-10);
  close(n, g / (1 - a), 1e-10);
  assert.ok(y > 1);
});

test('rounded AJR base data reproduce published slopes to the reported precision', () => {
  const rows = AJR_DATA.split(' ').map(r => r.split(','));
  assert.equal(rows.length, 64);
  const x = rows.map(r => +r[1]), y = rows.map(r => +r[2]), z = rows.map(r => +r[3]);
  const e = iv1(x, y, z, ols);
  close(e.ols.slope, .52, .005); close(e.fs.slope, -.61, .005); close(e.tsls.slope, .94, .005);
  // The just-identified IV slope is also cov(z,y)/cov(z,x).
  const cov = (a, b) => a.reduce((s, v, i) => s + (v - a.reduce((s, x) => s + x, 0) / a.length) * b[i], 0);
  close(e.tsls.slope, cov(z, y) / cov(z, x));
  assert.ok(e.tsls.se > 0 && Number.isFinite(e.tsls.se));
});

test('growth accounting recovers synthetic Hicks-neutral productivity growth', () => {
  const a = 1 / 3, gA = .03, gK = .02, gL = .01, gh = .005;
  const records = [0, 10, 19].map(t => ['TEST', 2000 + t,
    Math.exp((gA + a * gK + (1 - a) * (gL + gh)) * t),
    Math.exp(gK * t), Math.exp(gL * t), Math.exp(gh * t), 1 - a]);
  const result = growthAccounts(records, 'third');
  for (const row of result.intervals) close(row.tfp, gA);
  close(result.average.tfp, gA); close(result.years, 19);
});

test('unequal growth-accounting intervals aggregate to endpoint log growth', () => {
  const records = [['TEST', 2000, 1, 1, 1, 1, .6],
    ['TEST', 2010, Math.exp(.02 * 10), 1, 1, 1, .6],
    ['TEST', 2019, Math.exp(.02 * 10 + .1 * 9), 1, 1, 1, .6]];
  const { average } = growthAccounts(records);
  close(average.gY, Math.log(records[2][2] / records[0][2]) / 19);
  assert.ok(Math.abs(average.gY - (.02 + .1) / 2) > .001);
});
