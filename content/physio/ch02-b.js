// Human Physiology — Chapter 2: Excitable cells and muscle (part b: 2.7–2.12)
import { clamp, trace, idxAt, peaks, hhRun, msRun, saRun, hillV, hillFopt } from './ch02.shared.js';

// ---------- helpers for this file ----------
const R_GAS = 8.314462618, FARADAY = 96485.33212;
const VT = (Tc) => (1000 * R_GAS * (Tc + 273.15)) / FARADAY;
/** Squid axon in seawater (mM), Hodgkin & Katz 1949, and their permeability ratios P_K : P_Na : P_Cl. */
const SQ = { K: { i: 345, o: 10 }, Na: { i: 72, o: 465 }, Cl: { i: 61, o: 587 } };
const PR_REST = { K: 1, Na: 0.04, Cl: 0.45 }, PR_PEAK = { K: 1, Na: 20, Cl: 0.45 };
function ghk(P, naFrac, Tc) {
  const num = P.K * SQ.K.o + P.Na * SQ.Na.o * naFrac + P.Cl * SQ.Cl.i, den = P.K * SQ.K.i + P.Na * SQ.Na.i + P.Cl * SQ.Cl.o;
  return VT(Tc) * Math.log(num / den);
}

// Twitch and tetanus (2.7): impulse-driven calcium proxy c (decays with tc), saturating activation A = c²/(c²+K²) and
// force with different rise and fall time constants (ms). Force is reported as a fraction of the 100 Hz tetanus (P.nrm).
const TW = {
  fast: { c1: 0.3, cmax: 1, K: 0.5, tc: 25, tr: 20, td: 45, nrm: 0.49 },
  slow: { c1: 0.3, cmax: 1, K: 0.5, tc: 80, tr: 60, td: 140, nrm: 0.69 },
};
function twitchRun(f, P, o = {}) {
  const dt = 0.5, tEnd = o.tEnd ?? 800, trainEnd = o.trainEnd ?? 600, T = 1000 / f, single = o.single, Fmax = P.nrm;
  let c = 0, F = 0, next = 20; const ts = [], Fs = [], cs = [], stim = [];
  for (let t = 0; t <= tEnd + 1e-9; t += dt) {
    if (t >= next - 1e-9 && next <= trainEnd + 20 && !(single && stim.length >= 1)) { c += P.c1 * (1 - c / P.cmax); stim.push(next); next += T; }
    const A = (c * c) / (c * c + P.K * P.K), tau = A > F ? P.tr : P.td;
    ts.push(t); Fs.push(F / Fmax); cs.push(c);
    F += (dt * (A - F)) / tau; c -= (dt * c) / P.tc;
  }
  return { t: ts, F: Fs, c: cs, stim };
}
/** Peak and trough of the force over the last two stimulus intervals (and the decay that follows the last stimulus). */
function windowStats(r, f) {
  const n = r.stim.length, T = 1000 / f, t0 = n >= 3 ? r.stim[n - 3] : r.stim[0], t1 = n >= 3 ? r.stim[n - 1] : r.stim[n - 1] + T;
  const seg = r.F.slice(idxAt(r.t, t0), idxAt(r.t, Math.min(r.t[r.t.length - 1], r.stim[n - 1] + T)) + 1), core = r.F.slice(idxAt(r.t, t0), idxAt(r.t, t1) + 1);
  return { max: Math.max(...seg), min: n >= 3 ? Math.min(...core) : 0, mean: core.reduce((a, b) => a + b, 0) / core.length };
}
const tetTable = {};
function tetanusCurve(type) {
  if (tetTable[type]) return tetTable[type];
  const P = TW[type], out = [];
  for (let k = 0; k <= 36; k++) { const f = Math.pow(10, (2 * k) / 36); out.push({ f, ...windowStats(twitchRun(f, P), f) }); }
  tetTable[type] = out; return out;
}

// Size principle (2.8)
const NU = 36;
function pool(R, seedPerm) {
  const sizes = Array.from({ length: NU }, (_, i) => Math.pow(R, i / (NU - 1))), thr = Array.from({ length: NU }, (_, i) => 0.04 + (0.86 * i) / (NU - 1));
  return { sizes, thr, perm: seedPerm };
}
function poolForce(sz, thr, D, width = 0.06) { let F = 0; for (let i = 0; i < sz.length; i++) F += sz[i] * clamp((D - thr[i]) / width, 0, 1); return F; }

// Nerve and ventricle (2.9)
function upEvents(ts, ys, thr, hold) {
  const o = [];
  for (let i = 1; i < ys.length; i++) if (ys[i] > thr && ys[i - 1] <= thr) { const j = idxAt(ts, ts[i] + hold); if (ys[j] > thr) o.push(ts[i]); }
  return o;
}
function nerveTrain(T) {
  const st = []; for (let t = 10; t < 490; t += T) st.push(t);
  const r = hhRun({ tEnd: 500, dt: 0.02, Tc: 20, stim: (t) => (st.some((s) => t >= s && t < s + 1) ? 20 : 0) });
  return { st, t: r.t, V: r.V, ev: upEvents(r.t, r.V, 0, 0.1) };
}
function heartTrain(T, tclose) {
  const st = []; for (let t = 10; t < 490; t += T) st.push(t);
  const r = msRun({ tEnd: 500, dt: 0.05, stimTimes: st, stimAmp: 0.3, tclose });
  return { st, t: r.t, V: r.mV, v: r.v, ev: upEvents(r.t, r.v, 0.5, 10) };
}
/** Shortest S1–S2 interval (ms) at which the second stimulus launches a second action potential. */
function nerveERP() {
  for (let d = 1; d < 40; d += 0.5) {
    const r = hhRun({ tEnd: d + 30, dt: 0.02, Tc: 20, stim: (t) => ((t >= 10 && t < 11) || (t >= 10 + d && t < 11 + d) ? 20 : 0) });
    if (upEvents(r.t, r.V, 0, 0.1).length >= 2) return d;
  }
  return null;
}
function heartERP(tclose) {
  for (let d = 20; d < 700; d += 5) {
    const m = msRun({ tEnd: d + 60, dt: 0.1, stimTimes: [10, 10 + d], stimAmp: 0.3, tclose });
    const i = idxAt(m.t, 10 + d - 1);
    if (m.v[i] < 0.2 && upEvents(m.t, m.v, 0.5, 10).length >= 2) return d;
  }
  return null;
}

export default {
  collection: 'physio',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'Twitch summation and tetanus',
      statement: String.raw`A single action potential in a skeletal muscle fibre produces a **twitch**: force rises to a peak in tens of milliseconds and falls back more slowly. If a second stimulus arrives before the twitch has ended, its force is added on top of the remaining first one (**summation**). A train of stimuli at increasing frequency produces first a rippling, **unfused tetanus**, whose force fluctuates between pulses, and then a smooth, **fused tetanus**, whose force is a steady several times (typically 3 to 10 times) that of a single twitch. The frequency at which fusion occurs is lower for slow muscles, whose twitches last longer, than for fast ones. Force then saturates when the contractile machinery is fully activated.`,
      idea: String.raw`The twitch is long compared with the action potential (2.3): calcium is released within a few ms, but its removal and the lag of force behind troponin occupancy stretch the twitch to tens of ms. Stimuli closer together than that find calcium still elevated, so each one adds calcium before the last has been pumped out, and the activation (steeply sigmoidal in calcium) climbs. Because the muscle membrane, unlike the heart (2.9), has a short refractory period, nothing prevents stimuli from arriving at 50 per second. The force–frequency relation thus encodes the neural firing rate in the force, which is how the nervous system grades contraction of one motor unit.`,
      caption: String.raw`A train of stimuli (gold ticks) is applied for 600 ms. Left: the force. The dashed trace is the single twitch for comparison. Right: the force–frequency curve: the peak (solid) and trough (dashed) of the force late in the train for every frequency, with the size of the ripple shaded. Raise the **frequency** from 1 Hz upwards: the twitches first stay separate, then merge. Switch between **fast** and **slow** muscle and see the fusion frequency move: a fast muscle needs about 40 Hz, a slow one about 10–15 Hz.`,
      scope: String.raw`A lumped, single-fibre model with first-order calcium removal and a saturating calcium–force relation; real muscle also shows a fatigue and potentiation (post-tetanic) history, which is ignored. Time constants correspond to a fast and a slow mammalian muscle at body temperature, but they are round numbers.`,
      deps: ['physio-2.3'],
      see: ['physio-2.8', 'physio-2.9'],
      refs: ['Guyton–Hall'],
      tags: ['muscle', 'tetanus'],
      credit: 'Summation and tetanus are described in Helmholtz’s 1850s experiments on frog muscle',
      viz(v) {
        const fr = v.slider('stimulation frequency', 1, 100, 20, { log: true, fmt: (x) => `${v.fix(x, x < 10 ? 1 : 0)} Hz` });
        const type = v.select('muscle', [{ value: 'fast', label: 'fast twitch' }, { value: 'slow', label: 'slow twitch' }], 'fast');
        const sf = v.stage({ x: [0, 800], y: [0, 1.05], height: 300, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'force (fraction of maximum)', weight: 1.3 });
        const ss = v.stage({ x: [1, 100], y: [0, 1.05], height: 300, axes: 'box', gutter: true, xlog: true, xlabel: 'stimulation frequency (Hz)', ylabel: 'force: peaks and troughs', weight: 1, minWidth: 260 });
        let key = '', run = null, one = null;
        const get = () => { const k = `${fr.value}|${type.value}`; if (k !== key) { key = k; run = twitchRun(fr.value, TW[type.value]); one = twitchRun(1, TW[type.value], { single: true, tEnd: 800 }); } return run; };
        v.render(() => {
          const r = get(), tw = Math.max(...one.F);
          sf.hline(tw, { color: 'faint', dash: [3, 4], width: 1 });
          sf.text('single-twitch peak', 795, tw, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
          trace(sf, one.t, one.F, { color: 'muted', width: 1.6, dash: [5, 4] });
          trace(sf, r.t, r.F, { color: 'accent', width: 2.4 });
          for (const t of r.stim) { sf.line(t, 0, t, 0.05, { color: 'gold', width: 2 }); }
          // force–frequency
          const tab = tetanusCurve(type.value);
          ss.poly([...tab.map((q) => [q.f, q.max]), ...tab.map((q) => [q.f, q.min]).reverse()], { fill: 'accent', fillAlpha: 0.18, stroke: false });
          ss.path(tab.map((q) => [q.f, q.max]), { color: 'accent', width: 2.4 });
          ss.path(tab.map((q) => [q.f, q.min]), { color: 'accent', width: 1.4, dash: [4, 3] });
          ss.vline(fr.value, { color: 'gold', width: 1.2 });
          const ws = windowStats(r, fr.value);
          ss.dot(fr.value, ws.max, { r: 6, color: 'gold' });
        });
        v.legend([['accent', 'force'], ['muted', 'single twitch', { dash: true }], ['gold', 'stimuli']]);
        v.readout(() => {
          const r = get(), tw = Math.max(...one.F), ws = windowStats(r, fr.value), mx = ws.max, mn = ws.min;
          const tab = tetanusCurve(type.value), full = tab[tab.length - 1].max;
          const verdict = r.stim.length < 3 ? 'separate twitches' : mn / mx > 0.9 ? 'fused tetanus' : mn / mx > 0.3 ? 'unfused tetanus' : 'separate twitches';
          return `$${v.fix(fr.value, 1)}$ Hz: **${verdict}**, force oscillates between $${v.fix(mn, 2)}$ and $${v.fix(mx, 2)}$ (ripple ratio $${v.fix(mn / Math.max(mx, 1e-9), 2)}$) · single twitch peak $${v.fix(tw, 2)}$, so the peak of this train is $${v.fix(mx / tw, 1)}\\times$ a twitch (100 Hz gives $${v.fix(full / tw, 1)}\\times$)`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Principle',
      name: 'Henneman’s size principle',
      statement: String.raw`A **motor unit** is one motor neuron and the muscle fibres it controls. Units in one muscle differ greatly in size: the smallest develop a few tenths of a newton, the largest a hundred times more. When the descending drive to the motor pool grows, units are recruited **in order of size**: the smallest first, the largest last, and in a fixed order that is the same from one contraction to the next. Because the order matches the size, the increment of force produced when each new unit joins is about the same fraction of the force already present. Fine control is therefore possible at low force and coarse control at high force, with a constant relative resolution.`,
      idea: String.raw`The mechanism is electrical. A small motor neuron has a small surface area and so a high input resistance: the same synaptic current produces a larger depolarization (Ohm's law) and it reaches threshold first. Henneman (1957) showed in cats that the smaller the axon, the lower the stimulus needed to fire it, and later work established the order in the intact human. The result is economical: slow, fatigue-resistant units carry the postural tasks, and the powerful but fatiguing ones are held back for effort. The size principle also means that relative force steps are small everywhere, a Weber-like property that any ordering other than by size would destroy.`,
      caption: String.raw`A pool of 36 motor units whose forces span a ratio you choose (top left, vertical axis logarithmic, bar colour from blue = smallest to red = largest). Drag the **drive** (dot on the force curve, bottom left). Units fire in order of their thresholds and ramp up to full force over a narrow band of drive. Bottom right: the force added by each unit as a fraction of the total before it. In the size order this fraction settles to an almost constant value after the first few units. Switch to a **random** order of the same units and the steps become wild: a large unit recruited early can double or triple the force at a stroke, while many small ones recruited late add almost nothing.`,
      scope: String.raw`Holds for voluntary and reflex contractions of a muscle with orderly recruitment. Order can deviate in some conditions (rapid ballistic movements, cutaneous reflexes, some inhibitory inputs), and in a few muscles the compartments are recruited separately. Here the thresholds are evenly spaced in rank, a simplification of the measured distribution.`,
      deps: ['physio-2.7'],
      see: ['physio-2.7'],
      refs: ['Guyton–Hall'],
      tags: ['muscle', 'motor units', 'recruitment'],
      credit: 'Elwood Henneman, 1957',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Henneman%27s_size_principle' },
      viz(v) {
        const R = v.slider('size range (largest / smallest)', 5, 100, 40, { log: true, fmt: (x) => `×${v.fix(x, 0)}` });
        const rand = v.toggle('random recruitment order instead of size order', false);
        const su = v.stage({ x: [0, NU + 1], y: [0.7, 140], ylog: true, height: 260, axes: 'box', gutter: true, xlabel: 'motor unit, in order of threshold', ylabel: 'unit force (rel.)', weight: 1.3 });
        const sf = v.stage({ x: [0, 1], y: [0, 1.05], height: 260, axes: 'box', gutter: true, xlabel: 'descending drive', ylabel: 'total force (fraction of max)', weight: 1, minWidth: 260 });
        const sd = v.stage({ x: [0, NU + 1], y: [0.01, 40], ylog: true, height: 200, axes: 'box', gutter: true, xlabel: 'motor unit, in order of recruitment', ylabel: 'ΔF / force before', full: true });
        const perm = v.rng(5).shuffle(Array.from({ length: NU }, (_, i) => i));
        const D = { value: 0.5 };
        const curveOf = (sz, thr) => { const Fm = poolForce(sz, thr, 1.2); const pts = []; for (let k = 0; k <= 200; k++) { const d = k / 200; pts.push([d, poolForce(sz, thr, d) / Fm]); } return { pts, Fm }; };
        const cur = () => { const p = pool(R.value); const sz = rand.value ? perm.map((j) => p.sizes[j]) : p.sizes, szS = p.sizes; return { sz, thr: p.thr, szS }; };
        const h = sf.handle(0.5, 0.5, { color: 'gold', r: 8, constrain: (x) => { const d = clamp(x, 0, 1), c = cur(); return [d, poolForce(c.sz, c.thr, d) / poolForce(c.sz, c.thr, 1.2)]; } });
        h.onDrag = () => { D.value = clamp(h.x, 0, 1); };
        v.render(() => {
          const c = cur(), Fm = poolForce(c.sz, c.thr, 1.2), d = D.value, F = poolForce(c.sz, c.thr, d) / Fm;
          h.set(d, F);
          const lo = 0.7, logR = Math.log(R.value);
          for (let i = 0; i < NU; i++) {
            const a = clamp((d - c.thr[i]) / 0.06, 0, 1), col = v.mix('blue', 'red', Math.log(c.sz[i]) / Math.max(logR, 1e-6));
            su.rect(i + 0.6, lo, i + 1.4, c.sz[i], { fill: 'panel', fillAlpha: 0, color: col, width: 1, alpha: 0.5 });
            if (a > 0) su.rect(i + 0.6, lo, i + 1.4, lo * Math.pow(c.sz[i] / lo, 1), { fill: col, fillAlpha: 0.15 + 0.7 * a, stroke: false });
          }
          // force curves: current order, and the other order faint
          const other = (() => { const p = pool(R.value); const sz = rand.value ? p.sizes : perm.map((j) => p.sizes[j]); return curveOf(sz, p.thr); })();
          sf.path(other.pts, { color: 'muted', width: 1.3, dash: [4, 4], alpha: 0.7 });
          sf.path(curveOf(c.sz, c.thr).pts, { color: 'accent', width: 2.4 });
          sf.vline(d, { color: 'gold', width: 1, alpha: 0.6 });
          // relative increments, each unit added to the full activation of all earlier ones
          let before = 0; const bars = [];
          for (let i = 0; i < NU; i++) { if (i > 0) bars.push([i, c.sz[i] / before]); before += c.sz[i]; }
          sd.hline(1, { color: 'faint', width: 1, dash: [3, 3] });
          for (const [i, r] of bars) sd.rect(i + 0.6, 0.01, i + 1.4, Math.max(0.011, r), { fill: r > 1 ? 'red' : 'accent', fillAlpha: 0.55, stroke: false });
          const mean = bars.reduce((a, b) => a + b[1], 0) / bars.length;
          sd.hline(mean, { color: 'green', width: 1.3, dash: [5, 3] });
          sd.text(`mean ${v.fix(mean, 2)}`, NU + 0.8, mean, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
        });
        v.legend([['accent', 'force, current order'], ['muted', 'force, the other order', { dash: true }]]);
        v.readout(() => {
          const c = cur(), Fm = poolForce(c.sz, c.thr, 1.2), d = D.value, F = poolForce(c.sz, c.thr, d) / Fm;
          const rec = c.thr.filter((t) => t < d).length;
          let before = 0, mx = 0, mn = 1e9; for (let i = 0; i < NU; i++) { if (i >= 6) { const r = c.sz[i] / before; mx = Math.max(mx, r); mn = Math.min(mn, r); } before += c.sz[i]; }
          return `drive $${v.fix(d, 2)}$: ${rec} of ${NU} units recruited, force $${v.fix(100 * F, 0)}\\%$ of maximum · from the 7th unit on, the relative step per added unit ranges from $${v.fix(mn, 2)}$ to $${v.fix(mx, 2)}$ (${rand.value ? 'random order: a factor ' + v.fix(mx / mn, 0) + ' between the smallest and largest step' : 'size order: a factor ' + v.fix(mx / mn, 1) + ' only'})`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Cardiac action potential plateau and refractoriness',
      statement: String.raw`A ventricular myocyte's action potential differs from a nerve's in its shape and duration. After a fast sodium-driven upstroke the voltage does not fall back at once but stays near 0 to $+20$ mV for 200 ms or more (the **plateau**), and only then repolarizes to $-85$ mV. The plateau is held by an inward L-type calcium current balanced against outward potassium currents. During the whole plateau and the early repolarization the cell cannot be re-excited: this **refractory period** is as long as the action potential itself, some 250–350 ms, against a few ms in a nerve. As a result a train of stimuli at 20–50 Hz that would produce a tetanus in skeletal muscle (2.7) produces a few beats at most: the heart cannot be tetanized.`,
      idea: String.raw`The refractory period is the time the sodium channels (here, the "gate" $h$) need to recover from inactivation. In a nerve (2.1) the potassium conductance returns the voltage to rest in a millisecond or two and the sodium channels recover almost immediately. In the heart the calcium current and the slow decline of the potassium current keep the voltage depolarized, so the sodium channels stay inactivated and the cell is unresponsive until repolarization ends. The mechanical significance is that each contraction is separated from the next by a relaxation, so the chambers can refill. Here the ventricular cell is the two-variable Mitchell–Schaeffer model, whose "gate" $h$ closes slowly during the plateau and reopens only after repolarization.`,
      caption: String.raw`The same train of 1 ms stimuli is delivered to a nerve axon (upper panel, Hodgkin–Huxley at 20 °C) and to a model ventricular cell (lower panel); green dots mark the stimuli that fire a spike, hollow red dots those that fail. Shorten the **stimulus interval**: the nerve follows every stimulus down to a few ms, the ventricle skips all those that fall within about 300 ms of the last spike, so the faster you drive it the more it misses. Shorten the **plateau** (a model parameter standing for faster calcium-current inactivation) and the refractory period shrinks with it. Read the two measured refractory periods below.`,
      scope: String.raw`The nerve is the space-clamped Hodgkin–Huxley axon with temperature-scaled gates; the ventricular cell is the reduced two-current Mitchell–Schaeffer model (2003), not a detailed ionic model. Human action potentials shorten at fast heart rates (restitution), which this model includes only in its simplest form.`,
      deps: ['physio-2.1'],
      see: ['physio-2.7', 'physio-2.1'],
      refs: ['Keener–Sneyd ch. 12'],
      tags: ['cardiac', 'action potential', 'refractory'],
      credit: 'C. C. Mitchell and D. G. Schaeffer, 2003 (model); the plateau was recorded by Draper & Weidmann, 1951',
      viz(v) {
        const T = v.slider('stimulus interval', 20, 600, 120, { step: 5, fmt: (x) => `${v.fix(x, 0)} ms` });
        const tc = v.slider('plateau time constant $\\tau_{\\mathrm{close}}$', 60, 250, 150, { step: 5, fmt: (x) => `${v.fix(x, 0)} ms` });
        const sn = v.stage({ x: [0, 500], y: [-95, 50], height: 190, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'nerve V (mV)', full: true });
        const sh = v.stage({ x: [0, 500], y: [-100, 50], height: 230, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'ventricle V (mV)', full: true });
        let kN = '', N = null, kH = '', H = null, erpN = null, kE = '', erpH = null;
        const getN = () => { const k = `${T.value}`; if (k !== kN) { kN = k; N = nerveTrain(T.value); } return N; };
        const getH = () => { const k = `${T.value}|${tc.value}`; if (k !== kH) { kH = k; H = heartTrain(T.value, tc.value); } return H; };
        const getE = () => { if (erpN == null) erpN = nerveERP(); if (kE !== `${tc.value}`) { kE = `${tc.value}`; erpH = heartERP(tc.value); } return [erpN, erpH]; };
        const respond = (ev, st, win) => st.map((s) => ev.some((e) => e >= s && e <= s + win));
        v.render(() => {
          const n = getN(), h = getH(), rn = respond(n.ev, n.st, 6), rh = respond(h.ev, h.st, 9);
          sn.hband(-95, -90, { color: 'faint', alpha: 0 });
          trace(sn, n.t.filter((_, i) => i % 3 === 0), n.V.filter((_, i) => i % 3 === 0), { color: 'blue', width: 1.8 });
          trace(sh, h.t.filter((_, i) => i % 2 === 0), h.V.filter((_, i) => i % 2 === 0), { color: 'red', width: 2 });
          // refractory windows (shaded) after each spike of the ventricle: spike onset to onset + the measured ERP
          const [en, eh] = getE();
          for (const e of h.ev) if (eh != null) sh.vband(e, e + eh, { color: 'red', alpha: 0.08 });
          for (const e of n.ev) if (en != null) sn.vband(e, e + en, { color: 'blue', alpha: 0.15 });
          n.st.forEach((s, i) => { sn.dot(s, -90, { r: 5, color: rn[i] ? 'green' : 'red', hollow: !rn[i] }); });
          h.st.forEach((s, i) => { sh.dot(s, -95, { r: 5, color: rh[i] ? 'green' : 'red', hollow: !rh[i] }); });
          sh.text('shaded: refractory period after each spike', 498, 42, { size: 10.5, color: 'muted', align: 'right', baseline: 'top' });
        });
        v.legend([['green', 'stimulus fires a spike', { dot: true }], ['red', 'stimulus fails (hollow)', { dot: true }]]);
        v.readout(() => {
          const n = getN(), h = getH(), [en, eh] = getE(), rn = respond(n.ev, n.st, 6), rh = respond(h.ev, h.st, 9);
          const apd = (() => { const i0 = h.v.findIndex((x) => x > 0.5); let last = i0; for (let i = i0; i < h.v.length && h.t[i] < h.t[i0] + 700 && (i < i0 + 10 || h.v[i - 1] > 0.13); i++) if (h.v[i] > 0.13) last = i; return h.t[last] - h.t[i0]; })();
          return `interval $${v.fix(T.value, 0)}$ ms (${v.fix(1000 / T.value, 1)} Hz): nerve fires ${rn.filter(Boolean).length} of ${n.st.length} stimuli, ventricle ${rh.filter(Boolean).length} of ${h.st.length} · refractory period (two-pulse test): nerve $\\approx ${en == null ? '?' : v.fix(en, 1)}$ ms, ventricle $\\approx ${eh == null ? '> 700' : v.fix(eh, 0)}$ ms; ventricular action potential lasts $${v.fix(apd, 0)}$ ms`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Model',
      name: 'Pacemaker potential and sinoatrial automaticity',
      statement: String.raw`The cells of the **sinoatrial (SA) node** have no stable resting potential. After each action potential the membrane voltage does not stay at its most negative value ($\approx -60$ mV) but drifts upward, the **diastolic depolarization** or pacemaker potential, until it reaches the threshold of the next spike. The rate of this drift, together with the threshold and the maximum diastolic potential, sets the heart rate. It is driven by a slowly activating inward "funny" current $I_f$ (carried by HCN channels, which open on hyperpolarization), reinforced by calcium currents and by the decline of the delayed-rectifier potassium current. **Sympathetic** stimulation (noradrenaline, through cAMP) shifts $I_f$ activation toward less negative voltages and steepens the ramp. **Vagal** stimulation (acetylcholine) does the opposite and also hyperpolarizes the cell through an extra potassium current: the heart slows.`,
      idea: String.raw`The cell is a relaxation oscillator whose slow variable is the gate of $I_f$ (and of the potassium current): after a spike the voltage is low, so the funny channels open slowly, their inward current depolarizes the cell until the calcium current takes over and fires the next spike; the spike closes the funny channels again, restarting the cycle. A larger $I_f$ or an activation curve shifted toward positive voltages shortens the ramp. The same logic as the nerve (2.1), with an automatic reset: the oscillation exists because the resting point (no spike, voltage constant) is unstable. Remove $I_f$ and the model cell sits at rest, which is the effect of ivabradine, a drug that blocks it to lower the heart rate.`,
      caption: String.raw`A reduced SA cell (a Morris–Lecar-type calcium, potassium and leak cell with an added funny current $I_f$) fires on its own. Upper panel: voltage; lower panel: the three currents, inward positive, with the ramp where $I_f$ (purple) is the largest inward current. Sliders: sympathetic tone shifts the funny-current gate to positive voltages and raises the calcium conductance; vagal tone shifts it negatively; the third slider scales the funny-current conductance (below about 0.8 the cell no longer fires). Push vagal tone too far and the node stops (sinus arrest).`,
      scope: String.raw`A caricature built to show the mechanism, with parameters from a search of the Morris–Lecar family for a cell that is quiescent without $I_f$, fires at about 75 beats/min with it, and responds to the autonomic inputs in the right directions; it is not a fit to SA-node data. Real nodal cells also have a calcium clock (rhythmic release of store calcium) which adds to the funny current.`,
      deps: ['physio-2.9'],
      see: ['physio-2.9', 'physio-3.1'],
      refs: ['Keener–Sneyd ch. 12'],
      tags: ['cardiac', 'pacemaker', 'automaticity'],
      credit: 'H. F. Brown, D. DiFrancesco and D. Noble, 1979 (the funny current, then identified in the SA node)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sinoatrial_node' },
      viz(v) {
        const sym = v.slider('sympathetic tone', 0, 1, 0, { step: 0.01 });
        const vag = v.slider('vagal tone', 0, 1, 0, { step: 0.01 });
        const fs = v.slider('funny-current conductance $I_f$', 0.7, 1.6, 1, { step: 0.01, fmt: (x) => `×${v.fix(x, 2)}` });
        const sv = v.stage({ x: [0, 4000], y: [-85, 25], height: 230, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', full: true });
        const si = v.stage({ x: [0, 4000], y: [-10, 16], height: 190, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'inward current (µA/cm²)', full: true });
        let key = '', R = null;
        const get = () => { const k = `${sym.value}|${vag.value}|${fs.value}`; if (k !== key) { key = k; R = saRun({ tEnd: 8000, skip: 4000, sym: sym.value, vag: vag.value, fScale: fs.value }); } return R; };
        const stats = (r) => {
          const pk = peaks(r.V, -20), per = pk.length > 2 ? (r.t[pk[pk.length - 1]] - r.t[pk[0]]) / (pk.length - 1) : 0;
          const mdp = Math.min(...r.V), thr = -45;
          let slope = null;
          if (per) { const i0 = r.V.indexOf(Math.min(...r.V.slice(pk[0], pk[1]))); const j = (() => { for (let i = i0; i < r.V.length; i++) if (r.V[i] > mdp + 12) return i; return i0 + 1; })(); slope = ((r.V[j] - r.V[i0]) / (r.t[j] - r.t[i0])) * 1000; }
          return { per, mdp, slope };
        };
        v.render(() => {
          const r = get();
          sv.hline(-45, { color: 'faint', dash: [3, 4], width: 1 });
          trace(sv, r.t, r.V, { color: 'accent', width: 2.2 });
          const pk = peaks(r.V, -20);
          if (pk.length > 2) {
            // mark one diastolic ramp: from the minimum after the second spike up to the next spike
            const a = pk[0], b = pk[1], i0 = r.V.indexOf(Math.min(...r.V.slice(a, b)));
            sv.dot(r.t[i0], r.V[i0], { r: 4, color: 'purple' });
            sv.text('diastolic depolarization', (r.t[i0] + r.t[b]) / 2, r.V[i0] - 7, { size: 10.5, color: 'purple', align: 'center', baseline: 'top' });
          }
          si.hline(0, { color: 'faint', width: 1 });
          trace(si, r.t, r.If.map((x) => -x), { color: 'purple', width: 2 });
          trace(si, r.t, r.ICa.map((x) => -x * 0.25), { color: 'orange', width: 1.6 });
          trace(si, r.t, r.IK.map((x) => -x * 0.25), { color: 'green', width: 1.6 });
        });
        v.legend([['purple', '$I_f$'], ['orange', '$I_{Ca}$ (×0.25)'], ['green', '$I_K$ (×0.25)'], ['accent', 'voltage']]);
        v.readout(() => {
          const r = get(), s = stats(r), tot = 60000 / (s.per || 1);
          if (!s.per) return `**no spontaneous firing**: the cell rests at $${v.fix(r.V[r.V.length - 1], 1)}$ mV (sinus arrest, or too little $I_f$)`;
          return `cycle $${v.fix(s.per, 0)}$ ms → **${v.fix(tot, 0)} beats/min** · maximum diastolic potential $${v.fix(s.mdp, 0)}$ mV · diastolic ramp $\\approx ${v.fix(s.slope, 0)}$ mV/s over its first 12 mV`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Paper',
      name: 'The Effect of Sodium Ions on the Giant Axon of the Squid',
      paper: { authors: 'A. L. Hodgkin and B. Katz', year: 1949, title: 'The effect of sodium ions on the electrical activity of the giant axon of the squid', venue: 'Journal of Physiology 108 (1): 37–77', doi: '10.1113/jphysiol.1949.sp004310' },
      introduces: ['physio-2.1', 'physio-1.9'],
      statement: String.raw`Hodgkin and Katz asked whether the action potential of the squid giant axon is carried by sodium. They replaced part of the sodium chloride in the seawater around an isolated axon by an osmotically equivalent amount of a non-penetrating substitute (choline chloride, or glucose), and found that the spike became smaller and slower, and that the size of the overshoot above zero varied with the external sodium concentration roughly as a sodium electrode would, about $58$ mV for a tenfold change. The resting potential was affected far less than the overshoot. They proposed that the membrane is almost impermeable to sodium at rest but that depolarization causes a large and transient rise of sodium permeability (the **sodium hypothesis**). With the constant-field equation of Goldman, a permeability ratio $P_{\mathrm K}:P_{\mathrm{Na}}:P_{\mathrm{Cl}} = 1 : 0.04 : 0.45$ at rest and $1 : 20 : 0.45$ at the peak describes both potentials.`,
      idea: String.raw`Before this paper the explanation, due to Bernstein (1902), was that the spike is a transient breakdown of membrane selectivity so that the potential falls to zero. Hodgkin and Huxley had measured overshoots of tens of millivolts (1939, 1945), which this could not explain. Katz and Hodgkin showed that the overshoot follows the sodium gradient, giving the Nernst equation (1.8) for sodium as the ceiling of the spike, and used the GHK equation (1.9) to show that a 20-fold rise of $P_{\mathrm{Na}}$ puts the peak near $E_{\mathrm{Na}}$ but not quite on it. Their work introduced the sodium hypothesis, which with the voltage clamp led directly to the Hodgkin–Huxley equations (2.1) three years later.`,
      caption: String.raw`**Left**: spikes of the Hodgkin–Huxley axon as the external sodium is reduced (choline substitution; each trace labelled by its percentage), with the simulated one at your setting highlighted. **Right**: peak voltage against external sodium on a logarithmic axis, for the Nernst potential of sodium (dashed), for the GHK equation with Hodgkin and Katz's permeabilities at the peak (solid black) and for the HH simulation (blue dots), with the resting potential from the GHK equation below. The two lines lie within about 10 mV of each other and have nearly the same slope, about 58 mV per decade at 20 °C: the overshoot follows the sodium gradient, as the sodium hypothesis requires, and sits a little below $E_{\\mathrm{Na}}$ because $P_{\\mathrm{Na}}$ is finite. The simulated peak lies lower still and falls faster as sodium is removed (about 70 mV per decade): in a fast spike the voltage turns around before sodium conductance has fully pulled it to $E_{\\mathrm{Na}}$, and with little sodium the spike no longer has enough inward current to reach its full height. Concentrations are those of seawater and the squid axoplasm, as in physio-1.9.`,
      scope: String.raw`Space-clamped squid giant axon; the simulation uses the 1952 Hodgkin–Huxley equations with $E_{\mathrm{Na}}$ recomputed from the Nernst equation as the external sodium is reduced, so it tests the 1949 hypothesis with the later model. Substitution was by choline or glucose in the paper; here "choline" simply means sodium is replaced by an inert cation. Reduction below about 10 % abolishes the spike in the simulation (and in the axon).`,
      deps: ['physio-1.8'],
      see: ['physio-1.9', 'physio-2.1'],
      refs: [],
      tags: ['sodium hypothesis', 'squid axon'],
      credit: 'A. L. Hodgkin and B. Katz, 1949',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1949.sp004310' },
      viz(v) {
        const Tc = v.slider('temperature', 6.3, 25, 20, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} °C` });
        const frac = v.slider('external sodium (% of seawater)', 5, 100, 50, { log: true, fmt: (x) => `${v.fix(x, 0)} %` });
        const st = v.stage({ x: [0, 8], y: [-100, 60], height: 300, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', weight: 1.1 });
        const sp = v.stage({ x: [4, 120], y: [-90, 70], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: 'external sodium (% of seawater)', ylabel: 'potential (mV)', weight: 1.1 });
        const FR = [100, 70, 50, 35, 25, 18, 12, 8, 6];
        let key = '', runs = null;
        const simAt = (pct, Tcv) => { const ENa = VT(Tcv) * Math.log((pct / 100) * SQ.Na.o / SQ.Na.i); return hhRun({ tEnd: 8, dt: 0.02, Tc: Tcv, ENa, stim: (t) => (t < 1 ? 20 : 0) }); };
        const table = () => { if (key !== `${Tc.value}`) { key = `${Tc.value}`; runs = FR.map((p) => ({ p, r: simAt(p, Tc.value) })); } return runs; };
        v.render(() => {
          const tab = table(), cur = simAt(frac.value, Tc.value);
          for (const { p, r } of tab) { trace(st, r.t, r.V, { color: 'blue', width: 1.2, alpha: 0.28 }); const j = r.V.indexOf(Math.max(...r.V)); if (Math.max(...r.V) > -60 && [100, 50, 25, 12].includes(p)) st.text(`${p}%`, r.t[j] + 0.1, r.V[j] + 3, { size: 10, color: 'muted', align: 'left', baseline: 'bottom' }); }
          trace(st, cur.t, cur.V, { color: 'accent', width: 2.6 });
          st.hline(VT(Tc.value) * Math.log((frac.value / 100) * SQ.Na.o / SQ.Na.i), { color: 'orange', dash: [5, 4], width: 1.2 });
          st.text('E_Na at your setting', 7.9, VT(Tc.value) * Math.log((frac.value / 100) * SQ.Na.o / SQ.Na.i), { size: 10.5, color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          // peak plot
          const xs = []; for (let k = 0; k <= 60; k++) xs.push(5 * Math.pow(100 / 5, k / 60));
          sp.path(xs.map((x) => [x, VT(Tc.value) * Math.log((x / 100) * SQ.Na.o / SQ.Na.i)]), { color: 'orange', width: 1.8, dash: [6, 4] });
          sp.path(xs.map((x) => [x, ghk(PR_PEAK, x / 100, Tc.value)]), { color: 'ink', width: 2.2 });
          sp.path(xs.map((x) => [x, ghk(PR_REST, x / 100, Tc.value)]), { color: 'green', width: 2 });
          sp.dots(tab.map(({ p, r }) => [p, Math.max(...r.V)]).filter((q) => q[1] > -35), { r: 4.5, color: 'blue' });
          sp.dot(frac.value, Math.max(...cur.V), { r: 7, color: 'accent' });
          sp.text('resting potential (GHK, P_Na/P_K = 0.04)', 118, -80, { size: 10.5, color: 'green', align: 'right', baseline: 'middle' });
        });
        v.legend([['orange', '$E_{\\mathrm{Na}}$ (Nernst)', { dash: true }], ['ink', 'GHK peak, $P_{\\mathrm{Na}}/P_{\\mathrm K} = 20$'], ['blue', 'HH simulation', { dot: true }], ['green', 'resting potential (GHK)']]);
        v.readout(() => {
          const t = Tc.value, slope = (a, b) => (b - a) / Math.log10(10);
          const sim = (p) => Math.max(...simAt(p, t).V);
          const nern = 2.302585 * VT(t), ghkS = ghk(PR_PEAK, 1, t) - ghk(PR_PEAK, 0.1, t), simS = sim(100) - sim(10), restShift = ghk(PR_REST, 0.1, t) - ghk(PR_REST, 1, t);
          return `at ${v.fix(t, 1)} °C, for a tenfold fall from 100 % to 10 % sodium: Nernst slope $${v.fix(nern, 1)}$ mV (the paper's “58 mV per tenfold change” is this number at 20 °C) · GHK peak falls $${v.fix(ghkS, 1)}$ mV · HH simulation $${v.fix(simS, 1)}$ mV · resting potential moves only $${v.fix(restShift, 1)}$ mV. At your setting the simulated peak is $${v.fix(sim(frac.value), 1)}$ mV, GHK predicts $${v.fix(ghk(PR_PEAK, frac.value / 100, t), 1)}$ mV, $E_{\\mathrm{Na}} = ${v.fix(VT(t) * Math.log((frac.value / 100) * SQ.Na.o / SQ.Na.i), 1)}$ mV.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Paper',
      name: 'The Heat of Shortening and the Dynamic Constants of Muscle',
      paper: { authors: 'A. V. Hill', year: 1938, title: 'The heat of shortening and the dynamic constants of muscle', venue: 'Proceedings of the Royal Society of London, Series B 126 (843): 136–195', doi: '10.1098/rspb.1938.0050' },
      introduces: ['physio-2.5'],
      statement: String.raw`Hill measured, with a fast thermopile, the heat produced by a frog sartorius that was stimulated and then allowed to shorten against a constant load. He found that in addition to the heat of the contraction itself the muscle gave out an extra amount of heat proportional to the distance shortened, $a\,x$, with a constant $a$ with the dimension of a force, independent of the load. Combining this with the work done $Px$ he obtained the total extra energy rate $(P+a)v$. He found that it is a linear function of the load, $b(P_0 - P)$, with $b$ a constant with the dimension of a velocity, and hence the **characteristic equation** $(P+a)(v+b) = (P_0+a)b$. The paper establishes the shortening heat, the force–velocity relation and the best load for maximum power, in the frog sartorius at about 0 °C.`,
      idea: String.raw`Fenn had found in 1923 that a muscle liberates more energy when it does work than when it contracts without shortening. The 1938 paper pinned down the quantitative law with fast thermal and mechanical recording. The picture is that the muscle's chemical energy release is controlled by the load: lighter loads allow faster shortening and faster liberation. The hyperbola is written into every later model of muscle (2.6), and the number $a/P_0 \approx 0.25$ turned out to be a property of the fibre type.`,
      caption: String.raw`A synthetic experiment in the spirit of the paper, since Hill's tables are not reproduced here: nine "isotonic releases" at loads between 5 % and 95 % of $P_0$, with velocities generated from a hyperbola with the constants you choose plus measurement scatter (**Resample** for another experiment). **Left**: velocity against load, with the fitted and true hyperbolas; choose whether the constants come from a least-squares fit of the hyperbola or from Hill's linear plot, which amplifies the scatter at high loads where $v$ is small. **Centre**: Hill's linearization, $(P_0-P)/v = (P+a)/b$, a straight line whose slope and intercept give $b$ and $a$ by regression. **Right**: the extra energy rate at the chosen load splits into work $Pv$ (green) and shortening heat $av$ (orange), which add to the straight line $b(P_0-P)$. The load of maximum power comes out at about a third of $P_0$.`,
      scope: String.raw`Holds for isotonic shortening of a fully tetanized muscle at a fixed temperature; the 1938 measurements were on frog sartorius at near 0 °C. The values of $a/P_0$ and $v_{\max}$ chosen here are typical orders of magnitude, not Hill's measured numbers; heat in the paper was measured separately from work, which is what the third panel reconstructs from the characteristic equation.`,
      deps: [],
      see: ['physio-2.5', 'physio-2.6'],
      refs: [],
      tags: ['muscle', 'heat', 'force–velocity'],
      credit: 'A. V. Hill, 1938',
      links: { doi: 'https://doi.org/10.1098/rspb.1938.0050' },
      viz(v) {
        const al = v.slider('true $a/P_0$', 0.1, 0.8, 0.25, { step: 0.01 });
        const vm = v.slider('true $v_{\\max}$', 0.5, 6, 1.5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} L₀/s` });
        const nz = v.slider('measurement scatter', 0, 10, 3, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} % of vmax` });
        const ld = v.slider('load shown in the energy panel', 0.05, 0.95, 0.4, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} P₀` });
        const meth = v.select('fit by', [{ value: 'lsq', label: 'least squares on v' }, { value: 'lin', label: 'Hill’s linear plot' }], 'lsq');
        let seed = 11;
        v.button('Resample', () => { seed = (seed * 7 + 3) % 1000; });
        const sv = v.stage({ x: [0, 1.05], y: [0, 7], height: 280, axes: 'box', gutter: true, xlabel: 'load P / P₀', ylabel: 'velocity v (L₀/s)', weight: 1.1, minWidth: 250 });
        const sl = v.stage({ x: [0, 1], y: [0, 6], height: 280, axes: 'box', gutter: true, xlabel: 'load P / P₀', ylabel: '(P₀ − P) / v  (s·P₀/L₀)', weight: 1, minWidth: 250 });
        const se = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: 'box', gutter: true, xlabel: 'load P / P₀', ylabel: 'extra energy rate / (P₀ L₀ s⁻¹)', weight: 1, minWidth: 250 });
        const loads = Array.from({ length: 9 }, (_, i) => 0.05 + 0.1 * i);
        const data = () => {
          const a = al.value, b = a * vm.value, r = v.rng(seed * 100 + Math.round(al.value * 100)), pts = [];
          for (const P of loads) { const vel = hillV(P, a, b) + (nz.value / 100) * vm.value * r.normal(); pts.push([P, Math.max(0.02 * vm.value, vel)]); }
          const lin = pts.map(([P, vel]) => [P, (1 - P) / vel]), reg = v.M.linreg(lin.map((q) => q[0]), lin.map((q) => q[1]));
          const bL = 1 / reg.slope, aL = reg.intercept * bL;
          const nm = v.M.nelderMead(([aa, bb]) => pts.reduce((sum, [P, vel]) => sum + (hillV(P, Math.abs(aa), Math.abs(bb)) - vel) ** 2, 0), [0.3, 0.5 * vm.value * 0.3], { step: [0.1, 0.2], tol: 1e-12 });
          const aN = Math.abs(nm.x[0]), bN = Math.abs(nm.x[1]);
          return { a, b, pts, lin, reg, aL, bL, aN, bN };
        };
        let key = '', D = null;
        const get = () => { const k = `${al.value}|${vm.value}|${nz.value}|${seed}|${meth.value}`; if (k !== key) { key = k; D = data(); D.aF = meth.value === 'lin' ? D.aL : D.aN; D.bF = meth.value === 'lin' ? D.bL : D.bN; D.vmF = D.bF / D.aF; } return D; };
        v.render(() => {
          const d = get(), vmax = vm.value;
          sv.setView([0, 1.05], [0, Math.max(1.1 * vmax, 1)]);
          sv.fn((P) => hillV(P, d.a, d.b), { domain: [0, 1], color: 'muted', width: 1.8, dash: [6, 4] });
          if (d.aF > 0 && d.bF > 0) sv.fn((P) => hillV(P, d.aF, d.bF), { domain: [0, 1], color: 'accent', width: 2.4 });
          sv.dots(d.pts, { r: 5, color: 'gold' });
          sl.setView([0, 1], [0, Math.max(...d.lin.map((q) => q[1])) * 1.15 + 0.2]);
          sl.line(0, d.reg.intercept, 1, d.reg.intercept + d.reg.slope, { color: meth.value === 'lin' ? 'accent' : 'blue', width: 2.2, alpha: meth.value === 'lin' ? 1 : 0.5 });
          sl.line(0, (1 + 0) / d.b * d.a, 1, (1 + d.a) / d.b, { color: 'muted', width: 1.5, dash: [6, 4] });
          sl.dots(d.lin, { r: 5, color: 'gold' });
          // energy
          const P = ld.value, a = d.a, b = d.b, tot = (x) => b * (1 - x), work = (x) => x * hillV(x, a, b), heat = (x) => a * hillV(x, a, b);
          se.setView([0, 1], [0, b * 1.05]);
          se.between(work, tot, 0.001, 0.999, { fill: 'orange', fillAlpha: 0.25 });
          se.between(() => 0, work, 0.001, 0.999, { fill: 'green', fillAlpha: 0.3 });
          se.fn(tot, { domain: [0, 1], color: 'ink', width: 2.2 });
          se.fn(work, { domain: [0, 1], color: 'green', width: 2 });
          se.vline(P, { color: 'gold', width: 1.3 });
          se.dot(P, tot(P), { r: 5, color: 'ink' }); se.dot(P, work(P), { r: 5, color: 'green' });
          se.text('b(P₀ − P)', 0.62, tot(0.62) + 0.04 * b, { size: 11, color: 'ink', align: 'left', baseline: 'bottom' });
        });
        v.legend([['gold', 'simulated release', { dot: true }], ['accent', 'fitted'], ['muted', 'true', { dash: true }], ['green', 'work $Pv$'], ['orange', 'shortening heat $av$']]);
        v.readout(() => {
          const d = get(), P = ld.value, v0 = hillV(P, d.a, d.b);
          const Fo = hillFopt(d.aF > 0 ? d.aF : d.a);
          return `fit (${meth.value === 'lin' ? 'linear plot' : 'least squares'}): $a/P_0 = ${v.fix(d.aF, 3)}$ (true $${v.fix(d.a, 3)}$), $b = ${v.fix(d.bF, 3)}$ L₀/s (true $${v.fix(d.b, 3)}$), $v_{\\max} = ${v.fix(d.vmF, 2)}$ L₀/s (true $${v.fix(vm.value, 2)}$) · maximum power at $P/P_0 = ${v.fix(Fo, 3)}$ · at load $${v.fix(P, 2)}P_0$: $(P+a)v = ${v.fix((P + d.a) * v0, 3)}$ equals $b(P_0-P) = ${v.fix(d.b * (1 - P), 3)}$; work $Pv = ${v.fix(P * v0, 3)}$, heat $av = ${v.fix(d.a * v0, 3)}$, thermodynamic efficiency (work / total extra) $= ${v.fix(P / (P + d.a), 2)}$`;
        });
      },
    },
  ],
};
