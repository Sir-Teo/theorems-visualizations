import { mount, escapeHTML } from './viz/core.js';
import * as B from './bridge-models.js';

const TAU = 2 * Math.PI;
const plot = (v, title, x, y, xlabel, ylabel) => v.stage({ title, x, y, xlabel, ylabel, height: 290, axes: 'box', gutter: true, minWidth: 290 });
const curve = (s, f, lo, hi, color = 'accent', width = 2.4) => s.path(Array.from({ length: 181 }, (_, i) => { const x = lo + (hi - lo) * i / 180; return [x, f(x)]; }), { color, width });
const dot = (s, x, y, color = 'accent') => s.dot(x, y, { color, r: 5 });
const line = (s, p, q, color = 'muted', dash) => s.line(...p, ...q, { color, dash, width: 1.5 });
const fmt = x => Math.abs(x) >= 10000 ? x.toExponential(2) : x.toFixed(3);

function action(v, context) {
  const a = v.slider('Path amplitude a', -.5, .5, .25, { step: .01 });
  const s = plot(v, 'Fixed endpoints, neighboring paths', [-.04, 1.04], [-.6, 1.6], 'time t', 'position q');
  const e = plot(v, 'The chosen quadratic functional', [-.56, .56], [.45, 1.2], 'amplitude a', 'action J');
  v.render(() => { const m = B.actionModel(a.value); line(s, [0, 0], [1, 1], 'muted', [4, 4]); curve(s, m.path, 0, 1); dot(s, 0, 0); dot(s, 1, 1); curve(e, x => B.actionModel(x).action, -.5, .5); dot(e, a.value, m.action, 'orange'); });
  return () => { const m = B.actionModel(a.value); return `${['Free-particle kinetic action', 'A functional on paths', 'Euler–Lagrange condition: q″=0'][context()]}: current J=${fmt(m.action)}; dJ/da=${fmt(m.derivative)}.\nThe straight path a=0 is stationary and minimizes this quadratic example. Optical travel time is a different functional.`; };
}
function causality(v, context) {
  const q = v.slider('Treated high-risk share q', .05, .95, .8, { step: .01 }), delta = v.slider('Risk reduction δ', -.1, .1, .1, { step: .01 });
  const s = plot(v, 'Stratum-specific risks', [-.5, 1.5], [0, 1], 'stratum (0 low, 1 high)', 'risk');
  const e = plot(v, 'Crude and standardized comparisons', [-.5, 1.5], [0, 1], '0 crude / 1 standardized', 'mean risk');
  v.render(() => { const m = B.causalModel(q.value, delta.value); for (const j of [0, 1]) { line(s, [j, m.untreated[j]], [j, m.treated[j]], 'muted'); dot(s, j - .05, m.untreated[j], 'blue'); dot(s, j + .05, m.treated[j], 'orange'); } for (const [j, u, t] of [[0, m.mean0, m.mean1], [1, m.standardized0, m.standardized1]]) { line(e, [j, u], [j, t]); dot(e, j - .05, u, 'blue'); dot(e, j + .05, t, 'orange'); } });
  v.legend([['blue', 'untreated'], ['orange', 'treated']]);
  return () => { const m = B.causalModel(q.value, delta.value); return `${context() === 0 ? 'Observed' : 'Common 50/50 stratum weights'}: crude risk difference=${fmt(m.crude)}; standardized difference=${fmt(m.adjusted)}.\nBoth stratum differences are −δ. A causal interpretation additionally needs the stated identification assumptions.`; };
}
function contagion(v, context) {
  const mu = v.slider('Poisson mean μ', .2, 3, 1.6, { step: .02 });
  const s = plot(v, 'Generating function and its fixed points', [-.05, 1.05], [-.07, 1.07], 's', 'f(s)');
  const e = plot(v, 'The threshold depends on the model', [-.15, 3.15], [-.07, 1.07], 'mean μ', 'survival / giant fraction');
  v.render(() => { const m = B.contagionModel(mu.value); line(s, [0, 0], [1, 1], 'muted', [4, 4]); curve(s, m.pgf, 0, 1); if (m.extinction < .999) dot(s, 1, 1, 'muted'); dot(s, m.extinction, m.extinction, 'orange'); curve(e, x => B.contagionModel(x).giant, 0, 3); dot(e, mu.value, m.giant, 'orange'); });
  return () => { const m = B.contagionModel(mu.value); return context() === 0 ? `Poisson lineage: extinction q=${fmt(m.extinction)}, eventual survival 1−q=${fmt(m.giant)}.\nSurvival is a probability, not the expected population μⁿ.` : `Sparse random graph limit: giant fraction S=${fmt(m.giant)} solves S=1−exp(−μS).\nThis equals the Poisson survival probability in the stated limit; finite graphs and social thresholds differ.`; };
}
function diffusion(v, context) {
  const D = v.slider('Diffusivity D', .05, 1, .3, { step: .01 }), t = v.slider('Elapsed time t', 0, 3, .8, { step: .02 });
  const s = plot(v, 'The same normalized diffusion equation', [-6, 6], [0, .85], 'position x', 'density u');
  const e = plot(v, 'Variance grows linearly', [-.15, 3.15], [-.15, 6.65], 'time', 'variance');
  v.render(() => { const m = B.diffusionModel(D.value, t.value); curve(s, B.diffusionModel(D.value, 0).density, -6, 6, 'muted', 1.3); curve(s, m.density, -6, 6); curve(e, x => B.diffusionModel(D.value, x).variance, 0, 3); dot(e, t.value, m.variance, 'orange'); });
  v.legend([['muted', 'initial unit Gaussian'], ['accent', 'evolved density']]);
  return () => `${['Normalized heat content', 'Brownian-position probability', 'Normalized solute concentration'][context()]}: variance=${fmt(B.diffusionModel(D.value, t.value).variance)}; total mass on the whole line is exactly 1.\nThe plotted window omits small Gaussian tails; the initial variance is ¼, not a point mass.`;
}
function duality(v, context) {
  const k = v.slider('Curvature κ', .5, 2, 1, { step: .02 }), y = v.slider('Supporting slope y', -1.5, 1.5, .7, { step: .02 }), x = v.slider('Test point x', -1.5, 1.5, -.5, { step: .02 });
  const s = plot(v, 'A line that never exceeds the convex curve', [-3.3, 3.3], [-8, 11], 'x', 'function / affine bound');
  v.render(() => { const m = B.dualityModel(k.value, y.value, x.value); curve(s, z => .5 * k.value * z * z, -3.2, 3.2); curve(s, z => y.value * z - m.conjugate, -3.2, 3.2, 'orange'); dot(s, m.touching, .5 * k.value * m.touching ** 2, 'green'); line(s, [x.value, m.f], [x.value, y.value * x.value - m.conjugate], 'red'); });
  v.legend([['accent', 'quadratic f'], ['orange', 'supporting line'], ['green', 'touching point'], ['red', 'nonnegative gap']]);
  return () => { const m = B.dualityModel(k.value, y.value, x.value); return `${['Supporting-bound gap', 'Fenchel–Young gap', 'For U(S)=κS²/2, temperature T=y'][context()]}: gap=${fmt(m.gap)}; touching x*=y/κ=${fmt(m.touching)}.\nf*(y)=${fmt(m.conjugate)}; the thermodynamic intercept F(y)=−f*(y)=${fmt(m.freeEnergy)}.`; };
}
function entropy(v, context) {
  const p = v.slider('True probability p', .02, .98, .3, { step: .01 }), q = v.slider('Predicted probability q', .02, .98, .7, { step: .01 });
  const s = plot(v, 'Binary entropy and expected log loss', [.01, .99], [0, 4], 'true probability p', 'nats');
  v.render(() => { const units = context() === 0 ? Math.LN2 : 1; s.setLabels(undefined, context() === 0 ? 'bits' : context() === 1 ? 'S/kB (nats)' : 'nats'); s.setView([-.04, 1.04], context() === 2 ? [-.15, 4.15] : [0, [1.1, .8][context()]]); curve(s, x => B.entropyModel(x, q.value).entropy / units, .01, .99); if (context() === 2) curve(s, x => B.entropyModel(x, q.value).crossEntropy, .01, .99, 'orange'); dot(s, p.value, B.entropyModel(p.value, q.value).entropy / units); if (context() === 2) dot(s, p.value, B.entropyModel(p.value, q.value).crossEntropy, 'orange'); });
  v.legend([['accent', 'entropy of the true distribution'], ['orange', 'log loss when selected']]);
  return () => { const m = B.entropyModel(p.value, q.value); return `${['Shannon H', 'Gibbs S/kB', 'Expected binary log loss'][context()]}: H=${fmt(m.bits)} bits = ${fmt(m.entropy)} nats.\nFor prediction q, expected loss=${fmt(m.crossEntropy)} nats; excess loss D(p‖q)=${fmt(m.kl)} nats.`; };
}
function feedback(v, context) {
  const K = v.slider('Negative loop gain K', 0, 8, 2, { step: .05 });
  const s = plot(v, 'A stable first-order loop', [0, 5], [0, 1.05], 'normalized time', 'normalized response');
  v.render(() => { const m = B.feedbackModel(K.value), mode = context(); s.setTitle(['Step reference response', 'Step load-disturbance response', 'Local perturbation relaxation'][mode]); curve(s, mode === 0 ? m.reference : mode === 1 ? m.disturbance : m.perturbation, 0, 5); curve(s, mode === 2 ? t => Math.exp(-t) : mode === 0 ? t => 1 - Math.exp(-t) : t => 1 - Math.exp(-t), 0, 5, 'muted', 1.2); });
  v.legend([['accent', 'closed negative loop'], ['muted', 'reference first-order curve']]);
  return () => { const m = B.feedbackModel(K.value); return `Static sensitivity S(0)=${fmt(m.sensitivity)}; relaxation time τ=${fmt(m.tau)}.\n${context() === 0 ? `Reference gain K/(1+K)=${fmt(1 - m.sensitivity)}; this proportional loop retains a nonzero step error.` : context() === 1 ? 'The load enters at the plant input, so its step response has gain 1/(1+K).' : 'The autoregulation interpretation is a local perturbation model, not the full response from an empty cell.'}`; };
}
function fixedPoints(v, context) {
  const r = v.slider('Contraction / damping r', .05, .95, .7, { step: .01 }), n = v.slider('Iterations n', 0, 20, 6, { int: true });
  const s = plot(v, 'An iteration crosses the diagonal at its fixed point', [-.05, 1.05], [-.05, 1.05], 'x', 'g(x)');
  v.render(() => { const m = B.fixedPointModel(r.value, n.value); line(s, [0, 0], [1, 1], 'muted', [4, 4]); curve(s, m.map, 0, 1); let x = .9; for (let i = 0; i < n.value; i++) { const z = m.map(x); line(s, [x, x], [x, z], 'orange'); line(s, [x, z], [z, z], 'orange'); x = z; } dot(s, .5, .5, 'green'); });
  v.legend([['accent', 'the map g'], ['muted', 'diagonal'], ['orange', 'iteration'], ['green', 'fixed point']]);
  return () => { const m = B.fixedPointModel(r.value, n.value); return `${['Scalar contraction', 'Page-one probability in the chosen two-page chain', 'Iterating x−f(x), f=(1−r)(x−½)'][context()]}: xₙ=${fmt(m.value)}.\nExact error |xₙ−½|=rⁿ·0.4=${m.error.toExponential(3)}; the same control r is the contraction factor in this chosen model.`; };
}
function fourier(v, context) {
  const a = v.slider('Third harmonic amplitude a', 0, 1.2, .6, { step: .02 }), N = v.select('Retain frequencies ≤N', [1, 3, 5], 3);
  const s = plot(v, 'One finite periodic waveform', [-.25, TAU + .25], [-2.6, 2.6], 'phase x (radians)', 'signal');
  const e = plot(v, 'Mean-square contributions', [0, 6], [-.05, .8], 'harmonic number', 'amplitude² / 2');
  v.render(() => { const m = B.fourierModel(a.value, N.value); curve(s, x => m.value(x), 0, TAU, 'muted', 1.2); curve(s, x => m.value(x, true), 0, TAU); if (context() === 2) for (let j = 0; j < 32; j++) dot(s, TAU * j / 32, m.value(TAU * j / 32), 'orange'); for (const [k, amp] of m.harmonics) { line(e, [k, 0], [k, amp * amp / 2], k <= N.value ? 'accent' : 'orange'); dot(e, k, amp * amp / 2, k <= N.value ? 'accent' : 'orange'); } });
  v.legend([['muted', 'full three-term waveform'], ['accent', 'retained frequencies'], ['orange', 'omitted power / sample points']]);
  return () => { const m = B.fourierModel(a.value, N.value); return `${['Mean-square projection', 'Normalized periodic tone', '32 equally spaced samples; Nyquist harmonic 16'][context()]}: total mean square=${fmt(m.energy)}; omitted mean square=${fmt(m.error)}.\nThe coefficient identity is exact for this finite signal; no convergence or square-wave approximation is assumed.`; };
}
function harmonic(v, context) {
  const a = v.slider('Quadratic coefficient a', -.6, .6, .3, { step: .02 }), r = v.slider('Circle radius r', .2, .8, .6, { step: .02 });
  const s = v.stage({ title: 'A source-free potential and a test circle', x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 340 });
  const cx = .15, cy = -.1;
  v.render(() => { const m = B.harmonicModel(a.value); s.contour(m.value, [-1, -.5, 0, .5, 1], { color: 'muted', res: 40, labels: false }); s.circle(cx, cy, r.value, { color: 'orange', width: 2 }); dot(s, cx, cy, 'orange'); if (context() !== 0) for (let x = -.8; x <= .8; x += .4) for (let y = -.8; y <= .8; y += .4) { const g = m.gradient(x, y), sign = context() === 1 ? -1 : 1; s.arrow(x, y, x + sign * .12 * g[0], y + sign * .12 * g[1], { color: 'accent', width: 1.5 }); } });
  return () => { const m = B.harmonicModel(a.value); let avg = 0; for (let j = 0; j < 64; j++) avg += m.value(cx + r.value * Math.cos(TAU * j / 64), cy + r.value * Math.sin(TAU * j / 64)) / 64; return `Center value=${fmt(m.value(cx, cy))}; 64-point circle average=${fmt(avg)}; Laplacian=0 exactly.\n${['For this quadratic, the equally spaced circle sum also equals the exact integral.', 'Arrows show E=−∇u; a potential is not itself an electric field.', 'Arrows show velocity +∇u; incompressibility and irrotationality are both required.'][context()]}`; };
}
function inverse(v, context) {
  const eps = v.slider('Small singular value ε', .05, 1, .15, { step: .01 }), noise = v.slider('Second-channel noise', -.1, .1, .05, { step: .005 }), lambda = v.slider('Penalty amplitude λ', 0, .5, .15, { step: .01 });
  const s = plot(v, 'Coordinates before and after reconstruction', [.5, 2.5], [-2, 3], 'coordinate', 'coordinate value');
  v.render(() => { const m = B.inverseModel(eps.value, noise.value, lambda.value); for (let i = 0; i < 2; i++) { const x = i + 1; dot(s, x - .12, m.truth[i], 'green'); dot(s, x - .04, m.measured[i], 'muted'); dot(s, x + .04, m.inverse[i], 'orange'); dot(s, x + .12, m.ridge[i], 'accent'); } });
  v.legend([['green', 'true object'], ['muted', 'measurement'], ['orange', 'unregularized inverse'], ['accent', 'ridge']]);
  return () => { const m = B.inverseModel(eps.value, noise.value, lambda.value); return `${['Inverse sensitivity', 'Ridge bias / noise tradeoff', 'Two singular channels as an imaging analogy'][context()]}: condition number=1/ε=${fmt(1 / eps.value)}.\nSecond inverse coordinate=${fmt(m.inverse[1])}; ridge=${fmt(m.ridge[1])}; second filter factor=${fmt(m.factors[1])}. λ², not λ, multiplies the squared norm.`; };
}
function mapDistortion(v, context) {
  const lat = v.slider('Latitude φ (degrees)', 0, 70, 45, { step: 1 });
  const s = v.stage({ title: 'Unit tangent circle and local image', x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, height: 340, axes: false });
  const projections = ['mercator', 'equal-area', 'equirectangular'];
  v.render(() => { const m = B.distortionModel(lat.value, projections[context()]); s.circle(0, 0, 1, { color: 'muted', dash: [4, 4] }); s.path(Array.from({ length: 181 }, (_, i) => [m.a * Math.cos(TAU * i / 180), m.b * Math.sin(TAU * i / 180)]), { color: 'accent', width: 2.5 }); line(s, [-m.a, 0], [m.a, 0], 'orange'); line(s, [0, -m.b], [0, m.b], 'green'); });
  v.legend([['muted', 'unit tangent circle'], ['accent', 'infinitesimal image ellipse'], ['orange', 'east-west'], ['green', 'north-south']]);
  return () => { const m = B.distortionModel(lat.value, projections[context()]); return `Principal stretches=${fmt(m.a)}, ${fmt(m.b)}; local area scale=${fmt(m.area)}.\nAxis ratio=${fmt(m.ratio)}; maximum angle change=${fmt(m.angle * 180 / Math.PI)}°. These are derivatives at φ, not finite-shape distortions.`; };
}
function spectral(v, context) {
  const theta = v.slider('Axis rotation θ (degrees)', 0, 90, 30, { step: 1 }), ratio = v.slider('Second eigenvalue ρ', .2, 2.5, .5, { step: .02 });
  const s = v.stage({ title: 'The contour xᵀAx=1 and its axes', x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 340 });
  v.render(() => { const m = B.spectralModel(theta.value * Math.PI / 180, ratio.value); s.path(Array.from({ length: 181 }, (_, i) => m.ellipse(TAU * i / 180)), { color: 'accent', width: 2.5 }); for (let j = 0; j < 2; j++) { const e = m.axes[j], L = 1 / Math.sqrt(m.eigenvalues[j]); line(s, [-L * e[0], -L * e[1]], [L * e[0], L * e[1]], j ? 'orange' : 'green'); } });
  v.legend([['accent', 'unit quadratic contour'], ['green', 'eigenvalue 1'], ['orange', 'eigenvalue ρ']]);
  return () => { const m = B.spectralModel(theta.value * Math.PI / 180, ratio.value); return `${['Positive quadratic form', 'A positive inertia submatrix', 'Mass matrix M=I, stiffness K=A'][context()]}: eigenvalues 1, ${fmt(ratio.value)}; semiaxes 1, ${fmt(1 / Math.sqrt(ratio.value))}.\nFor the unit-mass mode interpretation, angular frequencies are 1 and ${fmt(Math.sqrt(ratio.value))}; equal eigenvalues make the axis directions nonunique.`; };
}
function stability(v, context) {
  const a = v.slider('Positive curvature / decay a', .2, 2, 1, { step: .02 }), h = v.slider('Step size h', .1, 2.2, 1.7, { step: .02 });
  const s = plot(v, 'Continuous decay versus discrete error', [-.55, 12.55], [-2, 2], 'step number n (t=nh)', 'error relative to x₀');
  let scale = 1;
  v.render(() => { const m = B.stabilityModel(a.value, h.value), values = Array.from({ length: 13 }, (_, n) => m.discrete(n)), extent = Math.max(1, ...values.map(Math.abs)); scale = extent > 10 ? extent : 1; s.setLabels(undefined, scale > 1 ? 'scaled error' : 'relative error'); s.setView([-.55, 12.55], [-extent * 1.15 / scale, extent * 1.15 / scale]); curve(s, n => m.exact(n) / scale, 0, 12, 'green'); s.path(values.map((y, n) => [n, y / scale]), { color: 'accent', width: 2 }); for (let n = 0; n <= 12; n++) dot(s, n, values[n] / scale); });
  v.legend([['green', 'continuous exp(−anh)'], ['accent', 'Euler / quadratic descent']]);
  return () => { const m = B.stabilityModel(a.value, h.value); return `${['Compare the continuous and discrete evolutions', 'Explicit Euler discretization', 'Gradient descent on ax²/2'][context()]}: multiplier 1−ha=${fmt(m.multiplier)}.\n${m.stable ? 'The discrete error converges to zero.' : Math.abs(m.multiplier) === 1 ? 'The discrete error does not decay at this boundary.' : 'The discrete error grows, even though the continuous equation is stable.'} Stable exactly when 0<ha<2. ${scale > 1 ? `Vertical values are divided by ${scale.toExponential(3)} to keep the full curve visible.` : ''}`; };
}
function symmetry(v, context) {
  const j = v.slider('First shift j', 0, 11, 1, { int: true }), k = v.slider('Then shift k', 0, 11, 2, { int: true });
  const s = v.stage({ title: 'A cyclic orbit and the composed shift', x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, axes: false });
  const orders = [3, 6, 12];
  v.render(() => { const n = orders[context()], m = B.symmetryModel(n, j.value, k.value); s.circle(0, 0, 1, { color: 'muted', width: 1 }); for (let i = 0; i < n; i++) { const angle = TAU * i / n; s.dot(Math.cos(angle), Math.sin(angle), { color: i === m.composition ? 'accent' : 'muted', r: i === m.composition ? 7 : 4 }); s.text(String(i), 1.22 * Math.cos(angle), 1.22 * Math.sin(angle), { color: 'ink', align: 'center', size: 12 }); } for (const [shift, color, radius] of [[m.j, 'orange', .65], [m.composition, 'accent', 1]]) s.arrow(0, 0, radius * Math.cos(TAU * shift / n), radius * Math.sin(TAU * shift / n), { color, width: 2.5 }); });
  v.legend([['orange', 'after first shift'], ['accent', 'after both shifts']]);
  return () => { const n = orders[context()], m = B.symmetryModel(n, j.value, k.value); return `Modulo ${n}: ${m.j} then ${m.k} gives ${m.composition}; RⱼRₖ=Rⱼ₊ₖ.\n${context() === 2 ? 'Pitch-class intervals are preserved. A twelve-step pitch clock is not a twelvefold crystal lattice.' : context() === 0 ? 'These are the three rotations of a triangle, not its full six-element reflection group.' : 'These six rotations are compatible with a hexagonal lattice; translations add further structure.'}`; };
}
const RENDERERS = { action, causality, contagion, diffusion, duality, entropy, feedback, 'fixed-points': fixedPoints, fourier, harmonic, 'inverse-problems': inverse, 'map-distortion': mapDistortion, spectral, stability, symmetry };

export function mountBridgePicture(host, slug, label = id => id) {
  const spec = B.BRIDGE_PICTURES[slug]; if (!spec) return () => {};
  host.innerHTML = `<section class="card bridge-picture" aria-labelledby="bridge-picture-title"><div class="eyebrow">Same picture, named contexts</div><h2 id="bridge-picture-title">${escapeHTML(spec.title)}</h2><p class="bridge-model"><b>Chosen model.</b> ${escapeHTML(spec.model)}</p><div class="bridge-picture-canvas"></div><p class="bridge-model-limit"><b>Scope of the connection.</b> ${escapeHTML(spec.limit)}</p><p class="bridge-picture-sources"><b>Written steps behind this model:</b> ${spec.anchors.map(id => `<a href="#/t/${id}">${escapeHTML(label(id))}</a>`).join(' · ')}</p></section>`;
  return mount(host.querySelector('.bridge-picture-canvas'), v => {
    const context = v.select('Read the picture as', spec.contexts.map((name, value) => ({ value, label: name })), 0);
    const read = RENDERERS[slug](v, () => context.value);
    v.readout(() => read());
  });
}
