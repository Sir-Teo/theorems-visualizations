import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { daily, data, acf, DAILY_YEAR_START } from '../content/fin/ch05.shared.js';
import { dailyCalendar } from '../content/fin/source-audit-daily-calendar.js';
import { signRule, wealthPath, newsLevel, benchmarkExperiment, splitIllustration, fundIllustration } from '../content/fin/source-audit-efficiency.js';
const near = (a, b, t = 3e-11) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('The full source observation calendar has the independent canonical digest, actual year starts and exceptional exchange closures', () => {
  const { dates, years } = dailyCalendar();
  assert.equal(dates.length, 15897); assert.equal(dates[0], 19630701); assert.equal(dates.at(-1), 20260831);
  assert.equal(createHash('sha256').update(Array.from(dates).join(',')).digest('hex'), 'a963335f0b6ce1fbcd9eb4b6793f78a253924205da71bdf5eeb199804edac42b');
  const starts = [];
  dates.forEach((date, i) => {
    const year = Math.floor(date / 10000), month = Math.floor(date / 100) % 100, day = date % 100;
    if (!i || Math.floor(dates[i - 1] / 10000) !== year) starts.push(i);
    const time = Date.UTC(year, month - 1, day), end = Date.UTC(year + 1, 0, 1), start = Date.UTC(year, 0, 1);
    near(years[i], year + (time - start) / (end - start));
    if (i) assert.ok(years[i] > years[i - 1]);
  });
  assert.deepEqual(starts, DAILY_YEAR_START);
  const sep = Array.from(dates).indexOf(20010910); assert.equal(dates[sep + 1], 20010917);
  const crash = Array.from(dates).indexOf(19871019); near(daily().r[crash], -.1741);
});

test('Independent position and wealth accounting includes entry, reversal and liquidation for all offered costs and all actual sample days', () => {
  const synthetic = [0, .1, -.2, .05, -.1], a = signRule(synthetic, 1, 5, 10);
  assert.deepEqual(a.positions, [1, 1, -1, 1]); assert.equal(a.turnover, 6);
  a.net.forEach((r, i) => near(r, [0.099, -.2, -.052, -.103][i]));
  const D = daily(), { years } = dailyCalendar();
  for (let bp = 0; bp <= 10; bp += .25) for (const [start, end] of [[1, D.n], [1, D.yearStart[27]], [D.yearStart[27], D.n]]) {
    const a = signRule(D.r, start, end, bp); let units = 2, prev = Math.sign(D.r[start - 1]) || 1, wealth = 1;
    for (let i = start + 1; i < end; i++) { const pos = Math.sign(D.r[i - 1]) || 1; units += Math.abs(pos - prev); prev = pos; }
    assert.equal(a.turnover, units); near(a.gross.reduce((s, x) => s + x, 0) - a.net.reduce((s, x) => s + x, 0), units * bp * 1e-4, 1e-9);
    const path = wealthPath(a.net, start, years); assert.equal(path.length, end - start + 1); assert.deepEqual(path[0], [years[start - 1], 0]);
    for (let j = 0; j < a.net.length; j++) { wealth *= 1 + a.net[j]; near(path[j + 1][1], Math.log10(wealth)); assert.equal(path[j + 1][0], years[start + j]); }
  }
});

test('Every finite-state control pair separates raw expected gain, benchmark compensation and conditional abnormal means', () => {
  for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) {
    const beta = i / 10, gamma = j / 10, m = benchmarkExperiment(beta, gamma); let raw = 0, compensation = 0, abnormal = 0;
    for (const x of [-1, 1]) {
      const states = m.states.filter(s => s.x === x), mean = states.reduce((a, s) => a + s.r / 2, 0), b = .5 + gamma * x;
      near(mean, .5 + beta * x); near(mean - b, (beta - gamma) * x);
      for (const s of states) { near(s.probability, .25); raw += x * s.r / 4; compensation += x * b / 4; abnormal += x * (s.r - b) / 4; }
      // Subtracting the true conditional mean is zero regardless of the benchmark's failure.
      near(states.reduce((a, s) => a + (s.r - mean) / 2, 0), 0);
    }
    near(m.rawRule, raw); near(m.benchmarkRule, compensation); near(m.abnormalRule, abnormal);
    if (i === j && i) { assert.ok(raw > 0); near(abnormal, 0); }
  }
});

test('All split weights, including zero-weight groups, have the claimed weighted aggregate at every date', () => {
  for (let i = 0; i <= 20; i++) {
    const p = i / 20, m = splitIllustration(p);
    for (let j = 0; j <= 60; j++) { const t = j - 30, expected = .9 * Math.min(j, 30); near(p * m.increase[j][1] + (1 - p) * m.decrease[j][1], expected); near(m.aggregate[j][1], expected); assert.equal(m.aggregate[j][0], t); }
    near(m.pre, m.aggregate[30][1] - m.aggregate[0][1]); near(m.post, m.aggregate[60][1] - m.aggregate[30][1]);
  }
});

test('Fund scores use known Gaussian standard errors and retain every sample, including extreme values beyond the former fixed histogram', () => {
  for (let k = 0; k <= 30; k++) {
    let r = 0, n = 0;
    const m = fundIllustration(() => ((r++ % 100) + .5) / 100, () => [20, -20, 0, 1][n++ % 4], k / 100);
    assert.equal(m.bins.reduce((a, b) => a + b, 0), 400); assert.equal(m.skilled, 4 * k);
    let expectedHits = 0; for (let j = 0; j < 400; j++) {
      const expected = ((j % 100) + .5 < k ? 3 : -.8) / (4 / Math.sqrt(10)) + [20, -20, 0, 1][j % 4];
      near(m.values[j], expected); expectedHits += +(expected > 1.96); assert.ok(expected > m.lo && expected < m.hi);
    }
    assert.equal(m.hits, expectedHits);
  }
});

test('News level and all 120 real industry autocorrelations agree with independently evaluated definitions', () => {
  for (let i = 0; i <= 100; i++) for (const tau of [.2, 5, 60]) for (const t of [-30, -10, 0, .5, 30]) {
    const L = i / 100, expected = t < 0 ? L * (1 + t / 30) : 1 - (1 - L) * Math.exp(-t / tau);
    near(newsLevel(t, L, tau), expected); assert.ok(newsLevel(t, L, tau) >= 0 && newsLevel(t, L, tau) <= 1);
  }
  for (const series of data().ind) for (let lag = 1; lag <= 12; lag++) {
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    const centered = Array.from(series, x => x - mean), numerator = centered.slice(lag).reduce((a, x, i) => a + x * centered[i], 0), denominator = centered.reduce((a, x) => a + x * x, 0);
    near(acf(series, lag), numerator / denominator);
  }
});
