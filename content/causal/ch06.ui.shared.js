import * as B from './ch06.shared.js';
const colors = ['accent', 'orange', 'purple', 'green'];
const real = (v, label, a, b, x) => v.slider(label, a, b, x, { step: 'any', fmt: x => String(+x.toPrecision(5)).replace('-', '−') });
const integer = (v, label, a, b, x) => v.slider(label, a, b, x, { int: true });
const fmt = (v, x, n = 4) => x === null || x === undefined || Number.isNaN(x) ? 'unavailable' : !Number.isFinite(x) ? (x < 0 ? '−∞' : '∞') : x !== 0 && (Math.abs(x) < 10 ** -n || Math.abs(x) >= 1e6) ? x.toExponential(n) : v.fix(x, n);
const memo = fn => { let key, value; return options => { const next = JSON.stringify(options); if (next !== key) { key = next; value = fn(options); } return value; }; };
const panel = (v, title, xlabel = '', ylabel = '', options = {}) => v.stage({ title, xlabel, ylabel, x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 240, ...options });
function view(s, x, y, xticks = null, yticks = null) {
  s.end(); s.o.xticks = xticks; s.o.yticks = yticks; s.setView(x, y);
  if (!yticks) s.o.yticks = s._ticks('y').map(([x, label]) => [x, label.length > 7 ? x.toExponential(0) : label]);
  s.begin();
}
function frame(s, points, { zero = false, extra = [] } = {}) {
  const p = [...points, ...extra].filter(p => p.every(Number.isFinite));
  let x0 = p.length ? Math.min(...p.map(p => p[0])) : 0, x1 = p.length ? Math.max(...p.map(p => p[0])) : 1;
  let y0 = p.length ? Math.min(...p.map(p => p[1])) : 0, y1 = p.length ? Math.max(...p.map(p => p[1])) : 1;
  if (zero) { y0 = Math.min(0, y0); y1 = Math.max(0, y1); }
  if (x0 === x1) { x0 -= .5; x1 += .5; } if (y0 === y1) { y0 -= .5; y1 += .5; }
  view(s, [x0 - .12 * (x1 - x0), x1 + .12 * (x1 - x0)], [y0 - .15 * (y1 - y0), y1 + .18 * (y1 - y0)]);
}
function bars(s, values, labels, palette = colors) {
  const finite = values.filter(Number.isFinite), lo = Math.min(0, ...finite), hi = Math.max(0, ...finite), span = hi - lo || 1;
  view(s, [-.7, values.length - .3], [lo - .15 * span, hi + .2 * span], labels.map((x, i) => [i, x]));
  values.forEach((x, i) => { if (Number.isFinite(x)) s.rect(i - .3, Math.min(0, x), i + .3, Math.max(0, x), { fill: palette[i % palette.length], fillAlpha: .65, stroke: false }); });
}
function plotHistogram(s, values, lo, hi, references = [], density = null) {
  const h = B.histogram(values, lo, hi), curve = density ? Array.from({ length: 161 }, (_, i) => { const x = lo + i * (hi - lo) / 160; return [x, density.pdf(x)]; }) : [];
  const top = Math.max(.1, ...h.density, ...curve.map(p => p[1]));
  view(s, [lo - .05 * (hi - lo), hi + .05 * (hi - lo)], [-.06 * top, 1.18 * top]);
  h.density.forEach((d, i) => s.rect(lo + i * h.width, 0, lo + (i + 1) * h.width, d, { fill: 'accent', fillAlpha: .4, stroke: false }));
  if (curve.length) s.path(curve, { color: 'green', width: 2 });
  references.forEach(([x, color]) => { if (Number.isFinite(x) && x >= lo && x <= hi) s.line(x, 0, x, top, { color, width: 2 }); });
  return h;
}
function sampling(v, sizes = ['24', '80', '240'], initial = '80') {
  const n = v.select('sample size', sizes, initial), reps = v.select('independent samples', ['1', '100', '10000'], '100'), shape = v.select('noise law (mean 0, variance 1)', ['normal', 'skewed', 'heavy tails'], 'normal'), seed = integer(v, 'random seed', 1, 20, 1);
  return () => ({ n: +n.value, reps: +reps.value, shape: shape.value, seed: seed.value });
}
const tailNote = h => `${h.left} estimates below and ${h.right} above the displayed window; ${h.unavailable} unavailable. Histogram area keeps the full sample denominator.`;
const quantileNote = (v, xs) => { const a = xs.filter(Number.isFinite); return `Finite-sample median ${fmt(v, B.quantile(a, .5))}, quartiles ${fmt(v, B.quantile(a, .25))} / ${fmt(v, B.quantile(a, .75))}. Ratio means and mean standard errors are not reported.`; };
function ivControls(v) {
  const strength = real(v, 'instrument effect on treatment', 0, 1.5, .8), tau = real(v, 'constant treatment effect', -1, 1.5, .7), confounding = real(v, 'hidden confounder in treatment', 0, 2, 1), direct = real(v, 'direct instrument effect', 0, .4, 0), samples = sampling(v);
  return () => ({ ...samples(), strength: strength.value, tau: tau.value, confounding: confounding.value, direct: direct.value });
}

export function instrument(v) {
  const strength = real(v, 'Z → A coefficient', 0, .4, .35), direct = v.toggle('add direct Z → Y', false), common = v.toggle('add common cause U → Z', false);
  const s = panel(v, 'A candidate instrument inside a declared causal model', '', '', { axes: false, gutter: false }), t = panel(v, 'Exact conditional means', 'assignment Z', 'conditional mean'); let p;
  v.render(() => {
    p = B.instrumentPopulation({ strength: strength.value, direct: direct.value ? .2 : 0, association: common.value ? .8 : 0 });
    view(s, [-.5, 3.1], [-.6, 2], [], []);
    const nodes = [[0, 0, 'Z'], [1.3, 0, 'A'], [2.6, 0, 'Y'], [1.3, 1.4, 'U']];
    const edge = (i, j, color, bend = false) => { const a = nodes[i], b = nodes[j], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), pad = .23; if (bend) { s.path([[a[0], -.23], [a[0], -.4], [b[0], -.4]], { color, width: 2 }); s.arrow(b[0], -.4, b[0], -.23, { color, width: 2 }); } else s.arrow(a[0] + pad * dx / d, a[1] + pad * dy / d, b[0] - pad * dx / d, b[1] - pad * dy / d, { color, width: 2 }); };
    if (strength.value > 0) edge(0, 1, 'accent'); edge(1, 2, 'green'); edge(3, 1, 'muted'); edge(3, 2, 'muted');
    if (common.value) edge(3, 0, 'red'); if (direct.value) edge(0, 2, 'red', true);
    nodes.forEach(([x, y, label]) => { s.dot(x, y, { color: 'gold', r: 16 }); s.text(label, x, y, { size: 14, color: 'ink', baseline: 'middle', align: 'center' }); });
    view(t, [-.2, 1.2], [0, 1], [[0, '0'], [1, '1']]);
    for (let j = 0; j < 2; j++) { const points = p.means.map((r, z) => [z, r[j]]); t.path(points, { color: colors[j] }); points.forEach(q => t.dot(...q, { color: colors[j], r: 4 })); }
  });
  v.legend([['accent', 'mean treatment'], ['orange', 'mean outcome'], ['red', 'added invalid path'], ['muted', 'hidden common cause U']]);
  v.readout(() => `Treatment contrast ${fmt(v, p.first)}; outcome contrast ${fmt(v, p.reduced)}; ratio ${fmt(v, p.ratio)}; actual ATE 0.25. Relevance: ${p.first === 0 ? 'fails' : 'present'}. Exclusion: ${direct.value ? 'fails' : 'holds in this model'}. Instrument exchangeability: ${common.value ? 'fails' : 'holds in this model'}. The graph declares assumptions; observed associations cannot certify them in a real study.`);
}
export function wald(v) {
  const options = ivControls(v), calc = memo(o => B.ivExperiment(v.M, o)), s = panel(v, 'Population and sample assignment contrasts', 'mean treatment A', 'mean outcome Y'), h = panel(v, 'Repeated Wald estimates', 'estimated treatment effect', 'density'); let e, histogram;
  v.render(() => { const o = options(); e = calc(o); const q = e.first.stats, points = [[0, 0], [o.strength, e.population.reduced]], sample = q.ma.map((a, j) => [a, q.my[j]]); frame(s, [...points, ...sample, [1.5, 1.5 * o.tau]]); s.line(0, 0, 1.5, 1.5 * o.tau, { color: 'green', width: 2 }); s.path(points, { color: 'orange', width: 3 }); s.path(sample, { color: 'gold', dash: [4, 3] }); points.forEach(p => s.dot(...p, { color: 'orange', r: 5 })); sample.forEach(p => s.dot(...p, { color: 'gold', r: 4 })); histogram = plotHistogram(h, e.estimates, o.tau - 5, o.tau + 5, [[o.tau, 'green'], [e.population.wald, 'orange'], [e.population.ols, 'purple']]); });
  v.legend([['green', 'true constant effect'], ['orange', 'population IV'], ['gold', 'first sample means'], ['purple', 'population OLS'], ['accent', 'repeated Wald estimates']]);
  v.readout(() => `Population IV ${fmt(v, e.population.wald)}; population OLS ${fmt(v, e.population.ols)}. First sample Wald ${fmt(v, e.first.stats.slope)}, OLS ${fmt(v, e.first.stats.ols.slope)}. ${quantileNote(v, e.estimates)} ${tailNote(histogram)} At zero population first stage, the population ratio is undefined even when a sample ratio exists.`);
}
export function twoStage(v) {
  const options = ivControls(v), calc = memo(o => B.ivExperiment(v.M, o)), s = panel(v, 'Stage 1: treatment on assignment', 'Z (display jitter only)', 'treatment A'), t = panel(v, 'Stage 2: outcome on fitted treatment', 'fitted treatment', 'outcome Y'), h = panel(v, 'Repeated two-stage estimates', 'estimated treatment effect', 'density', { full: true, height: 230 }); let e, histogram;
  v.render(() => { const o = options(); e = calc(o); const q = e.first.stats, data = e.first.data, left = data.map((r, i) => [r.z + .025 * Math.sin(i), r.a]), right = data.map(r => [q.stage1.predict(r.z), r.y]); frame(s, left); frame(t, right); left.forEach(p => s.dot(...p, { color: 'accent', r: 2.6 })); right.forEach(p => t.dot(...p, { color: 'orange', r: 2.6 })); s.line(0, q.stage1.predict(0), 1, q.stage1.predict(1), { color: 'green', width: 2 }); if (q.stage2) t.line(q.ma[0], q.stage2.predict(q.ma[0]), q.ma[1], q.stage2.predict(q.ma[1]), { color: 'green', width: 2 }); histogram = plotHistogram(h, e.estimates, o.tau - 5, o.tau + 5, [[o.tau, 'green'], [e.population.wald, 'orange']]); });
  v.legend([['accent', 'stage 1 observations / repeated estimates'], ['orange', 'stage 2 observations / population IV'], ['green', 'fitted lines / true treatment effect']]);
  v.readout(() => `First-stage slope ${fmt(v, e.first.stats.da)}; F ${fmt(v, e.first.stats.firstF)}. Stage-2 slope ${fmt(v, e.first.stats.stage2?.slope)}; Wald ratio ${fmt(v, e.first.stats.slope)}. Both stages include an intercept. Stage 2 uses the actual projection; the treatment jitter is only a drawing aid. ${quantileNote(v, e.estimates)} ${tailNote(histogram)} A finite estimate need not equal the causal effect.`);
}
export function weak(v) {
  const options = ivControls(v), calc = memo(o => B.ivExperiment(v.M, o)), h = panel(v, 'Ratio instability near a zero first stage', 'Wald estimate', 'density'), s = panel(v, 'Invert the first sample’s AR test', 'candidate effect b', 'scaled quadratic (accept ≤ 0)'); let e, histogram;
  v.render(() => { const o = options(); e = calc(o); histogram = plotHistogram(h, e.estimates, o.tau - 5, o.tau + 5, [[o.tau, 'green']]); const lo = o.tau - 5, hi = o.tau + 5, points = Array.from({ length: 161 }, (_, i) => { const x = lo + i * (hi - lo) / 160; return [x, B.polynomial(e.first.q, x)]; }), scale = Math.max(1e-30, ...points.map(p => Math.abs(p[1]))); view(s, [lo - .3, hi + .3], [-1.2, 1.25]); s.hline(0, { color: 'muted' }); s.path(points.map(([x, y]) => [x, y / scale]), { color: 'accent', width: 2 }); for (const [a, b] of e.first.set) if (Math.max(a, lo) <= Math.min(b, hi)) s.line(Math.max(a, lo), -1.08, Math.min(b, hi), -1.08, { color: 'green', width: 5 }); });
  v.legend([['accent', 'sampled ratios / AR quadratic'], ['green', 'true effect / accepted candidates'], ['muted', 'AR boundary']]);
  v.readout(() => { const interval = e.first.set.length ? e.first.set.map(([a, b]) => `[${fmt(v, a)}, ${fmt(v, b)}]`).join(' ∪ ') : 'empty set'; return `First-stage F ${fmt(v, e.first.stats.firstF)}. Full AR set: ${interval}; the plot shows only a bounded window. Across ${e.estimates.length} independent samples: AR coverage ${fmt(v, e.ar.mean)} ± ${fmt(v, e.ar.se)} Monte Carlo SE; normal-Wald coverage ${fmt(v, e.wald.mean)} ± ${fmt(v, e.wald.se)}. Exact 95% AR coverage requires valid exclusion and iid Gaussian structural errors; skewed/heavy-tailed modes are experiments, not exact guarantees. ${tailNote(histogram)}`; });
}

function weightControls(v) { const controls = B.strata.map((s, i) => integer(v, s.name + ' weight', 0, 20, [3, 10, 0, 3][i])); return () => controls.map(x => x.value); }
function stacked(s, columns, labels, palette = colors, ymax = 1) { view(s, [-.7, columns.length - .3], [-.07 * ymax, 1.15 * ymax], labels.map((x, i) => [i, x])); columns.forEach((c, i) => { let y = 0; c.forEach((w, j) => { if (w) s.rect(i - .3, y, i + .3, y + w, { fill: palette[j], fillAlpha: .75, stroke: false }); y += w; }); }); }
export function compliance(v) {
  const weights = weightControls(v), s = panel(v, 'The latent principal strata', 'type: N, C, D, A', 'population mass'), t = panel(v, 'Observed cells combine latent types', 'cell ZA', 'conditional mass given Z'); let p;
  v.render(() => { p = B.principal(weights()); if (!p) { view(s, [0, 1], [0, 1]); view(t, [0, 1], [0, 1]); s.text('Add positive population weight', .5, .5, { size: 12, align: 'center' }); return; } bars(s, p.p, ['N', 'C', 'D', 'A']); stacked(t, p.cells.flat(), ['00', '01', '10', '11']); });
  v.legend(B.strata.map((s, i) => [colors[i], s.name]));
  v.readout(() => p ? `First-stage contrast ${fmt(v, p.first)} = complier mass ${fmt(v, p.p[1])} − defier mass ${fmt(v, p.p[2])}. For Z=1,A=1 the observed cell combines compliers and always-takers. Each assignment arm sums to one; the four displayed cells therefore sum to two. These latent types are supplied by the model, not individually observed.` : 'All weights are zero; no population distribution is defined.');
}
export function late(v) {
  const weights = weightControls(v), c = real(v, 'complier treatment effect', -1, 1, .8), d = real(v, 'defier treatment effect', -1, 1, -.4), s = panel(v, 'Contributions to the outcome contrast', 'principal type', 'signed contribution'), t = panel(v, 'Three different effect summaries', 'summary', 'effect'); let p;
  v.render(() => { p = B.principal(weights(), [.2, c.value, d.value, .1]); if (!p) { view(s, [0, 1], [0, 1]); view(t, [0, 1], [0, 1]); return; } bars(s, [0, p.p[1] * c.value, -p.p[2] * d.value, 0], ['N', 'C', 'D', 'A']); bars(t, [p.ratio, p.complier, p.ate], ['Wald', 'CACE', 'ATE'], ['accent', 'orange', 'green']); });
  v.legend([['accent', 'Wald ratio'], ['orange', 'complier effect'], ['purple', 'negative defier contribution'], ['green', 'population ATE']]);
  v.readout(() => p ? `Outcome contrast ${fmt(v, p.reduced)}, treatment contrast ${fmt(v, p.first)}. Wald ${fmt(v, p.ratio)}, CACE ${fmt(v, p.complier)}, ATE ${fmt(v, p.ate)}. Never-taker effect stays 0.2; always-taker effect stays 0.1. With positive complier mass and no defiers, the ratio equals CACE. Equal complier/defier masses make the ratio undefined; no compliers makes CACE undefined.` : 'Add positive population weight.');
}
function interval(s, low, high, effect) { view(s, [-1.15, 1.15], [0, 1], [[-1, '−1'], [0, '0'], [1, '1']], []); s.line(low, .5, high, .5, { color: 'accent', width: 5 }); s.dot(low, .5, { color: 'accent', r: 5 }); s.dot(high, .5, { color: 'accent', r: 5 }); if (Number.isFinite(effect)) s.dot(effect, .5, { color: 'gold', r: 6 }); }
export function noAssumptions(v) {
  const counts = ['A0 Y0', 'A0 Y1', 'A1 Y0', 'A1 Y1'].map((x, i) => integer(v, x + ' weight', 0, 20, [6, 2, 3, 9][i])), completion = real(v, 'missing-outcome completion', 0, 1, .5), monotone = v.toggle('assume monotone treatment response', false), s = panel(v, 'The observed table stays fixed', 'observed cell AY', 'probability'), t = panel(v, 'Effects compatible with those observations', 'average treatment effect', '', { height: 220 }); let p;
  v.render(() => { p = B.manski(counts.map(x => x.value), completion.value, monotone.value); if (!p) { view(s, [0, 1], [0, 1]); view(t, [-1.15, 1.15], [0, 1]); return; } bars(s, p.p, ['00', '01', '10', '11']); interval(t, p.low, p.high, p.ate); });
  v.legend([['accent', 'identified interval'], ['gold', 'effect of the chosen completion']]);
  v.readout(() => p ? `Sharp interval [${fmt(v, p.low)}, ${fmt(v, p.high)}], width ${fmt(v, p.high - p.low)}. This completion has ATE ${fmt(v, p.ate)} and preserves every observed cell. ${monotone.value ? 'Extra assumption: Y(1) ≥ Y(0) for every unit. It constrains outcome response, not treatment compliance.' : 'Only consistency and binary potential outcomes are imposed; the unrestricted interval has width one.'} These are population identification bounds, not a sampling confidence interval.` : 'All observed weights are zero; no distribution is defined.');
}
function tableControls(v) {
  const controls = [0, 1].map(z => ['A0 Y0', 'A0 Y1', 'A1 Y0', 'A1 Y1'].map((label, i) => integer(v, `Z${z}: ${label} weight`, 0, 30, B.tablePresets.mixed[z][i])));
  for (const name of ['mixed', 'perfect', 'incompatible']) v.button(name + ' table', () => controls.forEach((row, z) => row.forEach((c, i) => c.set(B.tablePresets[name][z][i]))));
  return () => controls.map(row => row.map(c => c.value));
}
export function bounds(v) {
  const counts = tableControls(v), monotone = v.toggle('exclude defiers', false), percent = integer(v, 'mix toward upper-bound population (%)', 0, 100, 50), s = panel(v, 'Exact sharp population bounds', 'average treatment effect', '', { height: 220 }), t = panel(v, 'An attaining response-type population', 'treatment type: N, C, D, A', 'population mass'); let p;
  const calc = memo(o => B.balkePearl(o.counts, o.monotone, o.percent));
  v.render(() => { p = calc({ counts: counts(), monotone: monotone.value, percent: percent.value }); if (p.status !== 'optimal') { view(s, [-1.15, 1.15], [0, 1]); view(t, [-.7, 3.7], [0, 1]); s.text(p.status === 'infeasible' ? 'No compatible population' : p.status === 'undefined conditional row' ? 'A conditional row is undefined' : 'Solver stopped before a bound', 0, .5, { size: 12, align: 'center' }); return; } interval(s, p.low, p.high, p.effect); stacked(t, Array.from({ length: 4 }, (_, j) => p.weights.slice(4 * j, 4 * j + 4)), ['N', 'C', 'D', 'A']); });
  v.legend([['accent', 'Y(0)Y(1)=00 / interval'], ['orange', 'Y(0)Y(1)=01'], ['purple', 'Y(0)Y(1)=10'], ['green', 'Y(0)Y(1)=11'], ['gold', 'chosen population effect']]);
  v.readout(() => p.status === 'optimal' ? `Exact interval [${p.lowExact}, ${p.highExact}]; selected effect ${p.effectExact}. All eight conditional cell constraints hold exactly for the displayed population; its nonnegative weights sum to one. The lower and upper populations attain both ends, and their mixtures fill the interval. ${monotone.value ? 'Defiers are excluded as an additional assumption.' : 'Defiers are allowed.'} Integer input weights are normalized separately within each Z arm. These are known population tables, not sampling confidence limits.` : p.status === 'infeasible' ? 'The edited table is incompatible with the stated binary response-type model. No effect bounds are reported for an empty feasible set. This does not diagnose which causal assumption failed.' : p.status === 'undefined conditional row' ? 'Each assignment arm needs positive total weight to define P(A,Y | Z).' : `Solver status: ${p.status}. No unverified bound is displayed.`);
}
export function inequality(v) {
  const counts = tableControls(v), s = panel(v, 'Observed conditional probabilities', 'cell AY', 'probability given Z'), t = panel(v, 'A necessary instrumental restriction', 'fixed treatment A', 'sum of outcome-wise maxima'); let p;
  v.render(() => { p = B.instrumentalInequality(counts()); if (!p) { view(s, [0, 1], [0, 1]); view(t, [0, 1], [0, 1]); return; } view(s, [-.7, 3.7], [-.05, 1.15], ['00', '01', '10', '11'].map((x, i) => [i, x])); p.p.forEach((row, z) => row.forEach((x, i) => s.rect(i - .32 + .32 * z, 0, i - .04 + .32 * z, x, { fill: colors[z], fillAlpha: .7, stroke: false }))); stacked(t, p.terms, ['0', '1'], ['purple', 'green'], 2); t.hline(1, { color: 'red', width: 2 }); });
  v.legend([['accent', 'Z=0'], ['orange', 'Z=1'], ['purple', 'maximum for Y=0'], ['green', 'maximum for Y=1'], ['red', 'upper bound 1']]);
  v.readout(() => p ? `For A=0 the sum is ${fmt(v, p.sums[0])}; for A=1 it is ${fmt(v, p.sums[1])}. ${p.maximum > 1 + 1e-12 ? 'VIOLATION: no valid binary instrumental model can generate this population table.' : 'The necessary restriction passes. Passing does not establish that the real instrument is valid.'} Maxima may choose different assignment arms for the two outcomes. We treat the edited table as population probabilities; empirical frequencies need a separate sampling test.` : 'An assignment arm has zero weight; its conditional probabilities are undefined.');
}

export function difference(v) {
  const tau = real(v, 'post-treatment effect', -1, 1.5, .7), trend = real(v, 'untreated trend difference', -.5, .5, 0), shock = real(v, 'hidden post-period shock', -.8, .8, 0), anticipation = real(v, 'effect in the last pre-period', -.5, .5, 0), samples = sampling(v, ['12', '40', '120'], '40'), s = panel(v, 'Before and after: observed and counterfactual paths', 'time (treatment at 1)', 'group mean outcome'), h = panel(v, 'Repeated difference-in-differences estimates', 'estimated effect', 'density'); let e, histogram;
  const calc = memo(o => B.didExperiment(v.M, o));
  v.render(() => { const o = { ...samples(), tau: tau.value, trend: trend.value, shock: shock.value, anticipation: anticipation.value }; e = calc(o); const p = e.population, paths = [p.times.map((t, i) => [t, e.first.averages[0][i]]), p.times.map((t, i) => [t, e.first.averages[1][i]]), p.times.map((t, i) => [t, p.untreated[i]])], copied = e.first.averages[1][2] + e.first.averages[0][3] - e.first.averages[0][2]; frame(s, paths.flat(), { extra: [[1, copied]] }); paths.forEach((points, j) => s.path(points, { color: ['accent', 'orange', 'muted'][j], dash: j === 2 ? [4, 4] : [] })); s.line(0, e.first.averages[1][2], 1, copied, { color: 'purple', dash: [4, 3] }); s.line(1, copied, 1, e.first.averages[1][3], { color: 'gold', width: 3 }); const lo = Math.min(o.tau, e.expected - 4 * e.sd), hi = Math.max(o.tau, e.expected + 4 * e.sd); histogram = plotHistogram(h, e.estimates, lo, hi, [[o.tau, 'gold'], [e.expected, 'orange']], o.shape === 'normal' ? v.M.dist.normal(e.expected, e.sd) : null); });
  v.legend([['accent', 'control / empirical density'], ['orange', 'treated / population DiD'], ['muted', 'true untreated treated-group path'], ['purple', 'copied control change'], ['gold', 'estimated contrast / true effect'], ['green', 'exact Gaussian sampling law']]);
  v.readout(() => `Each group has ${samples().n} independent units observed in all four periods. First estimate ${fmt(v, e.estimates[0])}; expected estimate ${fmt(v, e.expected)}, true effect ${fmt(v, e.population.tau)}, bias ${fmt(v, e.population.bias)}. Measured mean ${fmt(v, e.measured.mean)} ± ${fmt(v, e.measured.se)} Monte Carlo SE; measured SD ${fmt(v, e.measured.variance === null ? null : Math.sqrt(e.measured.variance))}, exact SD ${fmt(v, e.sd)}. A post-period shock can bias DiD despite perfectly parallel pre-period population trends. ${tailNote(histogram)}`);
}
export function discontinuity(v) {
  const bandwidth = real(v, 'bandwidth', .05, 1, .5), curvature = real(v, 'right-side curvature', 0, 3, 1), jump = real(v, 'untreated outcome jump at cutoff', 0, .8, 0), density = v.select('running-variable design', ['balanced', 'more above'], 'balanced'), samples = sampling(v, ['20', '80', '240'], '80'), s = panel(v, 'Separate local linear fits at the cutoff', 'running variable', 'outcome'), h = panel(v, 'Repeated noise on the same running-variable design', 'estimated cutoff jump', 'density'); let e, histogram;
  const calc = memo(o => B.rdExperiment(v.M, o));
  v.render(() => { const o = { ...samples(), bandwidth: bandwidth.value, curvature: curvature.value, jump: jump.value, density: density.value }; e = calc(o); if (e.status !== 'fit') { frame(s, e.xs.map((x, i) => [x, e.means[i]])); e.xs.forEach((x, i) => s.dot(x, e.means[i], { color: 'muted', r: 3 })); view(h, [-1, 2], [0, 1]); h.text('Too few distinct local inputs', .5, .5, { size: 12, align: 'center' }); return; } const points = e.xs.map((x, i) => [x, e.first.ys[i]]); frame(s, points, { extra: [[-1, -.5], [1, 1.2 + o.jump + o.curvature]] }); points.forEach(p => s.dot(...p, { color: Math.abs(p[0]) < o.bandwidth ? 'gold' : 'muted', r: 2.5 })); e.first.fits.forEach((f, j) => { const a = j ? 0 : -o.bandwidth, b = j ? o.bandwidth : 0; s.line(a, f.intercept + f.slope * a, b, f.intercept + f.slope * b, { color: colors[j], width: 3 }); }); s.vline(0, { color: 'muted', dash: [4, 4] }); const lo = Math.min(e.tau, e.expected - 4 * e.sd), hi = Math.max(e.observedLimit, e.expected + 4 * e.sd); histogram = plotHistogram(h, e.estimates, lo, hi, [[e.tau, 'gold'], [e.observedLimit, 'purple'], [e.expected, 'orange']], o.shape === 'normal' ? v.M.dist.normal(e.expected, e.sd) : null); });
  v.legend([['gold', 'local data / causal effect 0.7'], ['muted', 'data outside bandwidth'], ['accent', 'left fit / empirical density'], ['orange', 'right fit / conditional mean estimate'], ['purple', 'observed population jump'], ['green', 'exact Gaussian sampling law']]);
  v.readout(() => e.status !== 'fit' ? 'Each side needs at least two distinct inputs with positive triangular weight. The bandwidth currently fails that rank condition; no estimate or histogram is fabricated.' : `Local counts ${e.fits[0].count} / ${e.fits[1].count}. First jump ${fmt(v, e.estimates[0])}; exact conditional mean ${fmt(v, e.expected)}, observed limiting jump ${fmt(v, e.observedLimit)}, causal effect 0.7. Measured mean ${fmt(v, e.measured.mean)} ± ${fmt(v, e.measured.se)} Monte Carlo SE; measured SD ${fmt(v, e.measured.variance === null ? null : Math.sqrt(e.measured.variance))}, exact SD ${fmt(v, e.sd)}. Repeats hold the running inputs fixed. Unequal input density alone does not break continuity; the explicit untreated jump does. ${tailNote(histogram)}`);
}
export function genetics(v) {
  const strength = real(v, 'genetic effects on exposure', 0, 1.5, 1), pleiotropy = real(v, 'direct effect of selected variant', -.5, .5, 0), variant = v.select('selected variant', ['1', '2', '3', '4', '5'], '3'), structure = v.toggle('add shared ancestry structure', false), samples = sampling(v, ['40', '200', '600'], '200'), s = panel(v, 'Genetic associations with exposure and outcome', 'association with exposure', 'association with outcome'), h = panel(v, 'Repeated ratios for the selected variant', 'estimated exposure effect', 'density'); let e, histogram;
  const calc = memo(o => B.mrExperiment(v.M, o));
  v.render(() => { const o = { ...samples(), strength: strength.value, pleiotropy: pleiotropy.value, variant: +variant.value - 1, structure: structure.value }; e = calc(o); const p = e.population, population = p.bx.map((x, i) => [x, p.by[i]]), sample = e.first.bx.map((x, i) => [x, e.first.by[i]]).filter(q => q.every(Number.isFinite)); const xmax = Math.max(.5, ...population.map(p => p[0]), ...sample.map(p => p[0])); frame(s, [...population, ...sample], { extra: [[0, 0], [xmax, .7 * xmax]] }); s.line(0, 0, xmax, .7 * xmax, { color: 'green', width: 2 }); population.forEach((point, j) => { s.line(0, 0, ...point, { color: j === o.variant ? 'orange' : 'muted', width: 1 }); s.dot(...point, { color: j === o.variant ? 'orange' : 'accent', r: j === o.variant ? 5 : 3.5 }); if (e.first.bx[j] !== null && e.first.by[j] !== null) s.dot(e.first.bx[j], e.first.by[j], { color: 'gold', r: 3 }); }); histogram = plotHistogram(h, e.estimates, -4.3, 5.7, [[.7, 'green'], [p.ratios[o.variant], 'orange']]); });
  v.legend([['green', 'true exposure effect 0.7'], ['accent', 'population variant associations'], ['orange', 'selected population ratio'], ['gold', 'first-sample associations'], ['muted', 'other population ratio slopes']]);
  v.readout(() => `Selected population ratio ${fmt(v, e.population.ratios[+variant.value - 1])}; first-sample ratio ${fmt(v, e.first.ratios[+variant.value - 1])}. ${quantileNote(v, e.estimates)} ${tailNote(histogram)} Five synthetic biallelic variants are conditionally independent given ancestry. Shared ancestry can correlate them and confound exposure/outcome associations; direct effects violate exclusion. A genetic label does not establish IV assumptions or identify the effect of a particular clinical intervention.`);
}
