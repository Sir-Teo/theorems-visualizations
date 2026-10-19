// Psychology & Perception — Chapter 2: Signal detection theory (items 2.1–2.8; 2.9–2.15 are in ch02-b.js)
import { Phi, phi, zq, OBS, OC, pc, wilson, timers, sdt, rocPts, rocFrame, ROCOPT, cumROC, drawCum, fitRating, ratingProbs, dGrating, SCR, gabors, brackets, SCRTXT } from './ch02.shared.js';

/** Shade the four outcome regions under noise N(0,1) and signal N(d, 1) cut at k, over [lo, hi]. */
function shadeOutcomes(s, k, d, lo, hi, a = 1) {
  const fN = (x) => phi(x), fS = (x) => phi(x - d), z = () => 0, kk = Math.min(hi, Math.max(lo, k));
  if (kk > lo) { s.between(fS, z, lo, kk, { fill: OC.miss, fillAlpha: 0.28 * a }); s.between(fN, z, lo, kk, { fill: OC.cr, fillAlpha: 0.06 * a, hatch: OC.cr, hatchAlpha: 0.5 * a }); }
  if (kk < hi) { s.between(fS, z, kk, hi, { fill: OC.hit, fillAlpha: 0.26 * a }); s.between(fN, z, kk, hi, { fill: OC.fa, fillAlpha: 0.08 * a, hatch: OC.fa, hatchAlpha: 0.6 * a }); }
}
/** Noise and signal density curves with their names. */
function curves(s, d, lo, hi, o = {}) {
  s.fn((x) => phi(x), { domain: [lo, hi], color: 'muted', width: 2.2, n: 240 });
  s.fn((x) => phi(x - d), { domain: [lo, hi], color: 'accent', width: 2.6, n: 240, dash: o.dash });
  const y = phi(1);
  s.text('noise', -1, y, { dx: -7, align: 'right', color: 'muted', size: 12, weight: 600 });
  s.text(o.sname || 'signal + noise', d + 1, y, { dx: 7, align: 'left', color: 'accent', size: 12, weight: 600 });
}
const OUTLEG = [[OC.hit, 'hits', { area: true }], [OC.miss, 'misses', { area: true }], [OC.fa, 'false alarms', { area: true }], [OC.cr, 'correct rejections', { area: true }]];

export default {
  collection: 'psych',
  chapter: 2,
  title: 'Signal detection theory',
  summary: String.raw`A threshold experiment mixes up two things that signal detection theory pulls apart: how well an observer can tell signal from noise (the sensitivity $d'$) and how willing the observer is to say “yes” (the criterion). Noise trials and signal trials each produce a distribution of internal evidence, and the observer cuts that evidence at a criterion set by payoffs and base rates. Sweeping the criterion traces the ROC curve: its shape tests the model (equal or unequal variances, thresholds or none), its area equals forced-choice accuracy, and the best criterion is the likelihood ratio that the stakes dictate. The chapter ends with the ideal observer, the rare-target problem of screening, and the 1954 paper that brought the theory from radar into psychology.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Equal-variance Gaussian detection model',
      statement: String.raw`The **equal-variance Gaussian model** of a yes/no detection task makes three assumptions:

(a) every trial produces a single number $x$, the observer's internal *evidence*;
(b) on noise-alone trials $x\sim N(0,1)$, on signal trials $x\sim N(d',1)$: the signal shifts the mean by $d'$ noise standard deviations and leaves the spread unchanged;
(c) the observer answers “yes” exactly when $x$ exceeds a fixed criterion $k$.

Each trial then has one of four outcomes, whose probabilities are areas under the two curves on either side of $k$:
$$H=P(\text{yes}\mid\text{signal})=\Phi(d'-k),\qquad F=P(\text{yes}\mid\text{noise})=\Phi(-k),$$
with miss rate $1-H$ and correct-rejection rate $1-F$. Two parameters describe all of the observer's behaviour: $d'$, how separable the two kinds of trial are (set by the stimulus and the senses), and $k$, where the observer chooses to cut (set by the observer). In the language of hypothesis testing (stat-6.2) a false alarm is a type I error and a miss a type II error.`,
      idea: String.raw`Evidence is the sum of many small independent fluctuations (photon counts, spontaneous neural firing, wandering attention), so by the central limit theorem it is close to Gaussian, and a weak signal shifts it without changing its spread much. A yes/no answer keeps only which side of one cut $x$ fell on, so the probability of each outcome is the area of the relevant curve on that side of $k$. The model turns the psychometric function of chapter 1 inside out: there the criterion was fixed and the stimulus varied (psych-1.3); here the stimulus is fixed and the criterion can move, which is what lets sensitivity and willingness be measured separately (2.3, 2.4).`,
      caption: String.raw`Each simulated trial draws one evidence value, from the noise curve (bottom strip, **N**) or from the signal curve (the strip above it, **S**); it lands left or right of the **purple** criterion and takes its outcome's colour, while the table on the right counts the outcomes as the trials stream in. Drag the **purple** handle to move the criterion and the **blue** handle to move the signal distribution: the same evidence values are reclassified at once, and the observed rates follow the shaded areas.`,
      deps: ['psych-1.3', 'stat-6.2'],
      see: ['epi-2.1'],
      refs: ['M&C ch. 1', 'Gescheider ch. 5'],
      tags: ['signal detection', 'model'],
      credit: 'Thurstone, 1927 (Gaussian discriminal processes); Peterson, Birdsall & Fox and Tanner & Swets, 1954',
      scope: String.raw`Holds when one number summarises each trial and both distributions are Gaussian with the same spread, a good description of many simple detection tasks with a fixed, known signal in noise. Recognition memory and many perceptual tasks show unequal variances (2.8); if the criterion drifts from trial to trial, its variability is absorbed into the noise and lowers the apparent $d'$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Detection_theory' },
      viz(v) {
        const M = v.M, NMAX = 400, PER = 18, YC = 0.5, SN = [-0.215, -0.145], SS = [-0.12, -0.05], LO = -3.6, HI = 6.6;
        let seed = 5, T = null, tSeed = -1, st = null;
        v.button('New trials', () => { seed = 1 + ((Math.random() * 1e9) | 0); v.restart(); });
        const ev = v.stage({ x: [LO, HI], y: [-0.29, 0.54], height: 350, axes: 'box', weight: 1.35, xlabel: 'evidence $x$ (noise SD units)', yticks: [], title: 'inside the observer: one evidence value per trial' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, weight: 0.72, minWidth: 240, title: 'the outcome table' });
        const crit = ev.handle(0.9, YC, { color: 'purple', constrain: (x) => [M.clamp(x, -3, 6), YC] });
        const sig = ev.handle(1.7, phi(0), { color: 'accent', constrain: (x) => [M.clamp(x, 0, 4.5), phi(0)] });
        const tab = v.table(tb, { rows: 2, cols: 2, square: false, cellAspect: 1.2, maxCell: 78, size: 21, weight: () => 700, rowLabels: ['signal', 'noise'], colLabels: ['“yes”', '“no”'], region: [0, 0.36, 1, 1] });
        const trials = () => { if (tSeed !== seed) { const R = v.rng(seed); T = M.range(NMAX).map(() => ({ s: R() < 0.5, z: R.normal(), j: R() })); tSeed = seed; } return T; };
        v.legend([...OUTLEG, ['purple', 'criterion $k$'], ['gold', 'latest trial', { dot: true }]]);
        v.animate((t) => {
          const d = sig.x, k = crit.x, n = Math.max(1, Math.min(NMAX, Math.round(NMAX * Math.pow(Math.min(1, t / (PER - 4)), 1.25)))), TR = trials();
          // ---- the two distributions and the four areas
          shadeOutcomes(ev, k, d, LO, HI);
          curves(ev, d, LO, HI, { sdy: 17 });
          ev.line(0, 0, 0, phi(0), { color: 'muted', dash: [3, 3], width: 1 }); ev.line(d, 0, d, phi(0), { color: 'accent', dash: [3, 3], width: 1 });
          if (d > 0.35) ev.measure(0, 0.445, d, 0.445, "d′", { color: 'ink', math: true, offset: 12 });
          // ---- trial strips
          for (const [a, b, lab] of [[SN[0], SN[1], 'N'], [SS[0], SS[1], 'S']]) { ev.rect(LO, a, HI, b, { fill: 'faint', fillAlpha: 0.14, stroke: false }); ev.text(lab, LO + 0.08, (a + b) / 2, { align: 'left', color: 'muted', size: 11, weight: 700 }); }
          const cnt = { hit: 0, miss: 0, fa: 0, cr: 0 };
          for (let i = 0; i < n; i++) {
            const q = TR[i], x = q.z + (q.s ? d : 0), yes = x > k, o = q.s ? (yes ? 'hit' : 'miss') : (yes ? 'fa' : 'cr');
            cnt[o]++;
            const band = q.s ? SS : SN;
            ev.dot(x, band[0] + 0.008 + (band[1] - band[0] - 0.016) * q.j, { r: 2.4, color: OC[o], ring: false });
          }
          const L = TR[n - 1], xl = L.z + (L.s ? d : 0), bl = L.s ? SS : SN;
          ev.dot(xl, bl[0] + 0.008 + (bl[1] - bl[0] - 0.016) * L.j, { r: 6, color: 'gold', hollow: true, width: 2 });
          ev.line(k, -0.29, k, YC, { color: 'purple', width: 2 });
          ev.text('criterion k', k, YC, { dx: k > 4.2 ? -12 : 12, align: k > 4.2 ? 'right' : 'left', color: 'purple', weight: 700, size: 12 });
          // ---- the table
          const nS = cnt.hit + cnt.miss, nN = cnt.fa + cnt.cr, H = nS ? cnt.hit / nS : NaN, F = nN ? cnt.fa / nN : NaN;
          tab.draw({
            value: (i, j) => [[cnt.hit, cnt.miss], [cnt.fa, cnt.cr]][i][j],
            fill: (i, j) => [[[OC.hit, 0.3], [OC.miss, 0.3]], [[OC.fa, 0.3], [OC.cr, 0.3]]][i][j],
            sub: (i, j) => [['hits', 'misses'], ['false alarms', 'correct rej.']][i][j], subSize: 10.5,
          });
          const mH = Phi(M, d - k), mF = Phi(M, -k);
          tb.text(`hit rate H = ${cnt.hit}/${nS} = ${nS ? v.fix(H, 2) : '—'}`, 0.5, 0.27, { align: 'center', color: OC.hit, weight: 700, size: 12.5 });
          tb.text(`model Φ(d′ − k) = ${v.fix(mH, 2)}`, 0.5, 0.2, { align: 'center', color: 'muted', size: 11.5 });
          tb.text(`false-alarm rate F = ${cnt.fa}/${nN} = ${nN ? v.fix(F, 2) : '—'}`, 0.5, 0.11, { align: 'center', color: OC.fa, weight: 700, size: 12.5 });
          tb.text(`model Φ(−k) = ${v.fix(mF, 2)}`, 0.5, 0.04, { align: 'center', color: 'muted', size: 11.5 });
          st = { n, cnt, H, F, mH, mF, d, k, nS, nN };
        }, { period: PER, still: PER - 1 });
        v.readout(() => {
          if (!st) return '';
          const { n, H, F, mH, mF, d, k, nS, nN } = st;
          const seH = nS ? Math.sqrt((mH * (1 - mH)) / nS) : NaN, seF = nN ? Math.sqrt((mF * (1 - mF)) / nN) : NaN;
          return `${n} trials (${nS} signal, ${nN} noise) · hit rate $H$ = ${nS ? v.fix(H, 3) : '—'}, model $\\Phi(d'-k)$ = ${v.fix(mH, 3)} (binomial SD ${v.fix(seH, 3)}) · false-alarm rate $F$ = ${nN ? v.fix(F, 3) : '—'}, model $\\Phi(-k)$ = ${v.fix(mF, 3)} (SD ${v.fix(seF, 3)}) · misses $1-H$, correct rejections $1-F$ · parameters: $d'$ = ${v.fix(d, 2)}, $k$ = ${v.fix(k, 2)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Hits, misses, false alarms and correct rejections',
      statement: String.raw`In a yes/no task every trial has one of two stimulus types (signal present, or noise alone) and gets one of two responses, so the results form a $2\times2$ table:

- a **hit**: signal present, response “yes”;
- a **miss**: signal present, response “no”;
- a **false alarm**: noise alone, response “yes”;
- a **correct rejection**: noise alone, response “no”.

The **hit rate** $H$ = hits/(hits + misses) is the proportion of signal trials answered “yes”, and the **false-alarm rate** $F$ = false alarms/(false alarms + correct rejections) is the proportion of noise trials answered “yes”. Each row of the table sums to one, so the miss rate is $1-H$ and the correct-rejection rate is $1-F$: the pair $(F,H)$ holds everything the table says about the observer. Because the two rates are conditional on the stimulus, they do not depend on how often signals occur; overall percent correct, $\pi H+(1-\pi)(1-F)$ for signal probability $\pi$, does. In medical testing $H$ is the *sensitivity* and $1-F$ the *specificity* of a test (epi-2.1).`,
      idea: String.raw`The hit rate alone cannot measure detection: an observer who says “yes” on every trial scores $H=1$. The false-alarm rate is the control, the same willingness to say “yes” applied to trials with nothing to detect. Classical psychophysics tried to keep false alarms near zero with a few “catch trials” and treated those that occurred as guesses (psych-1.12); detection theory treats $H$ and $F$ as two equally informative measurements of one decision process (2.1), which the following items convert into a sensitivity and a criterion.`,
      caption: String.raw`A faint 1 kHz tone in white noise. The default subject is a simulated listener (seeded random numbers): each tile of the log is one trial, coloured by its outcome, and the table and the running rates update as trials arrive (press *20 more trials*). Switch to **you**: first set a comfortable volume with *Hear the tone, then the tone in noise*, then press *▶ Next trial*, listen to the 0.6 s burst of noise and say whether the tone was in it; the next trial follows by itself. The **tone level** is the tone's energy relative to the noise, $E/N_0$ (headphones help).`,
      deps: ['psych-2.1'],
      see: ['epi-2.1', 'stat-6.2'],
      refs: ['M&C ch. 1'],
      tags: ['signal detection', 'hit rate'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Confusion_matrix' },
      viz(v) {
        const M = v.M, after = timers(v), FS = 44100, TN = 0.6, TT = 0.3, F0 = 1000, SIG = 0.09, NC = 20, NR = 4, C0 = 0.35, L1 = 9, NMAX = 400;
        const dOf = (L) => Math.pow(10, (L - L1) / 20);
        let phase = 'idle', cur = null, you = [], simN = 60, seed = 21, sim = null, sSeed = -1;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; v.sound().stop(); } });
        const lev = v.slider('tone level $E/N_0$', 0, 24, 13, { step: 0.5, fmt: (x) => x.toFixed(1) + ' dB' });
        /** 0.6 s of Gaussian white noise (SD SIG) with, if sigOn, a 0.3 s tone of energy-to-noise-density ratio L dB in the middle. */
        const clip = (sigOn, L, noise = true) => {
          const n = Math.round(TN * FS), out = new Float32Array(n), A = 2 * SIG * Math.sqrt(Math.pow(10, L / 10) / (TT * FS)), t0 = (TN - TT) / 2;
          for (let i = 0; i < n; i++) {
            const t = i / FS; let x = 0;
            if (noise) { const u = 1 - Math.random(), w = Math.random(); x = SIG * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w) * Math.min(1, t / 0.01, (TN - t) / 0.01); }
            if (sigOn && t >= t0 && t <= t0 + TT) { const e = Math.min(1, (t - t0) / 0.02, (t0 + TT - t) / 0.02); x += A * Math.sin(2 * Math.PI * F0 * t) * (0.5 - 0.5 * Math.cos(Math.PI * e)); }
            out[i] = Math.max(-1, Math.min(1, x));
          }
          return out;
        };
        v.soundButton('Hear the tone, then the tone in noise', (snd) => { snd.samples(clip(true, lev.value + 12, false), FS, { gain: 0.8, normalize: false }); snd.samples(clip(true, lev.value), FS, { gain: 0.8, normalize: false, delay: 0.9 }); });
        const bNext = v.soundButton('▶ Next trial', () => next());
        const bYes = v.button('Tone', () => answer(true));
        const bNo = v.button('No tone', () => answer(false));
        const bMore = v.button('20 more trials', () => { simN = Math.min(NMAX, simN + 20); });
        v.button('Reset', () => { after.clear(); phase = 'idle'; if (who.value === 'you') you = []; else { simN = 60; seed = 1 + ((Math.random() * 1e9) | 0); } });
        const Ry = v.rng(606);
        const next = () => {
          if (who.value !== 'you' || phase === 'play') return;
          cur = { s: Ry() < 0.5, L: lev.value };
          const snd = v.sound(); snd.stop(); snd.samples(clip(cur.s, cur.L), FS, { gain: 0.8, normalize: false });
          phase = 'play'; after(TN * 1000 + 60, () => { phase = 'wait'; });
        };
        const answer = (r) => { if (who.value !== 'you' || phase !== 'wait') return; you.push({ s: cur.s, r }); phase = 'idle'; after(450, next); };
        const simTrials = () => {
          if (sSeed !== seed) { const R = v.rng(seed); sim = M.range(NMAX).map(() => ({ s: R() < 0.5, u: R() })); sSeed = seed; }
          const d = dOf(lev.value), k = d / 2 + C0;
          return sim.slice(0, simN).map((q) => ({ s: q.s, r: q.u < (q.s ? Phi(M, d - k) : Phi(M, -k)) }));
        };
        const lg = v.stage({ x: [0, NC], y: [0, NR], axes: false, height: 150, full: true, title: 'trial log (most recent last)' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, weight: 0.95, title: 'the 2 × 2 table' });
        const rt = v.stage({ x: [0, 60], y: [-0.04, 1.06], height: 250, axes: 'box', weight: 1.05, yticks: [0, 0.25, 0.5, 0.75, 1], title: 'the two rates against the number of trials' });
        const tab = v.table(tb, { rows: 2, cols: 3, square: false, cellAspect: 1.05, maxCell: 64, size: 18, colWeights: [1, 1, 1.5], rowLabels: ['tone', 'no tone'], colLabels: ['“yes”', '“no”', 'rate'], region: [0, 0.12, 1, 1] });
        const outc = (q) => (q.s ? (q.r ? 'hit' : 'miss') : (q.r ? 'fa' : 'cr'));
        const SHORT = { hit: 'H', miss: 'M', fa: 'FA', cr: 'CR' };
        v.legend([[OC.hit, 'hit', { area: true }], [OC.miss, 'miss', { area: true }], [OC.fa, 'false alarm', { area: true }], [OC.cr, 'correct rejection', { area: true }]]);
        let stt = null;
        v.render(() => {
          const isYou = who.value === 'you';
          bNext.hidden = bYes.hidden = bNo.hidden = !isYou; bMore.hidden = isYou;
          const tr = isYou ? you : simTrials(), N = tr.length;
          // ---- log
          const first = Math.max(0, N - NC * NR + (isYou ? 1 : 0)), shown = tr.slice(first);
          shown.forEach((q, i) => {
            const o = outc(q), cx = (i % NC) + 0.5, cy = NR - 0.5 - Math.floor(i / NC);
            lg.rect(cx - 0.44, cy - 0.42, cx + 0.44, cy + 0.42, { fill: OC[o], fillAlpha: 0.55, color: OC[o], width: 1, radius: 4 });
            lg.text(SHORT[o], cx, cy, { align: 'center', color: 'ink', size: 11.5, weight: 700, halo: false });
          });
          if (isYou) {
            const i = shown.length, cx = (i % NC) + 0.5, cy = NR - 0.5 - Math.floor(i / NC);
            lg.rect(cx - 0.44, cy - 0.42, cx + 0.44, cy + 0.42, { color: 'gold', width: 2.2, radius: 4, dash: phase === 'idle' ? [3, 3] : null });
            lg.text(phase === 'play' ? '♪' : phase === 'wait' ? '?' : '▶', cx, cy, { align: 'center', color: 'gold', size: 13, weight: 700 });
            if (!N) lg.text(phase === 'idle' ? 'press ▶ Next trial: was there a tone in the noise?' : '', NC / 2, NR / 2, { align: 'center', color: 'muted', size: 13 });
          }
          if (first > 0) lg.corner(`${first} earlier trials not shown`, 'br', { size: 10.5 });
          // ---- table
          const c = { hit: 0, miss: 0, fa: 0, cr: 0 }; for (const q of tr) c[outc(q)]++;
          const nS = c.hit + c.miss, nN = c.fa + c.cr, H = nS ? c.hit / nS : NaN, F = nN ? c.fa / nN : NaN;
          tab.draw({
            value: (i, j) => (j < 2 ? [[c.hit, c.miss], [c.fa, c.cr]][i][j] : i === 0 ? `H = ${nS ? v.fix(H, 2) : '—'}` : `F = ${nN ? v.fix(F, 2) : '—'}`),
            fill: (i, j) => (j < 2 ? [[[OC.hit, 0.3], [OC.miss, 0.3]], [[OC.fa, 0.3], [OC.cr, 0.3]]][i][j] : null),
            textColor: (i, j) => (j < 2 ? 'ink' : i === 0 ? OC.hit : OC.fa), weight: (i, j) => (j < 2 ? 600 : 700), size: 17,
            sub: (i, j) => (j < 2 ? [['hits', 'misses'], ['false al.', 'corr. rej.']][i][j] : `of ${i ? nN : nS}`), subSize: 10,
          });
          tb.text(`percent correct ${N ? pc((c.hit + c.cr) / N) : '—'} · ${nS} tone and ${nN} no-tone trials`, 0.5, 0.05, { align: 'center', color: 'muted', size: 11.5 });
          // ---- running rates
          const xm = Math.max(20, N + 2); rt.setView([0, xm], null);
          const hp = [], fp = []; let h = 0, s = 0, f = 0, n0 = 0;
          tr.forEach((q, i) => { if (q.s) { s++; if (q.r) h++; } else { n0++; if (q.r) f++; } if (s) hp.push([i + 1, h / s]); if (n0) fp.push([i + 1, f / n0]); });
          if (!isYou) { const d = dOf(lev.value), k = d / 2 + C0; rt.hline(Phi(M, d - k), { color: OC.hit, dash: [5, 4], width: 1.2, alpha: 0.7 }); rt.hline(Phi(M, -k), { color: OC.fa, dash: [5, 4], width: 1.2, alpha: 0.7 }); }
          if (hp.length) { rt.path(hp, { color: OC.hit, width: 2.2 }); rt.text('H', hp[hp.length - 1][0], hp[hp.length - 1][1], { dx: 7, align: 'left', color: OC.hit, weight: 700, size: 13 }); }
          if (fp.length) { rt.path(fp, { color: OC.fa, width: 2.2 }); rt.text('F', fp[fp.length - 1][0], fp[fp.length - 1][1], { dx: 7, align: 'left', color: OC.fa, weight: 700, size: 13 }); }
          if (!N) rt.text('no trials yet', xm / 2, 0.5, { align: 'center', color: 'muted', size: 13 });
          stt = { N, c, H, F, nS, nN, isYou };
        });
        v.readout(() => {
          if (!stt) return '';
          const { N, c, H, F, nS, nN, isYou } = stt;
          if (!N) return 'No trials yet. Press **▶ Next trial** and answer *Tone* or *No tone* for each burst of noise. Guess when unsure: a guess is data too.';
          const d = dOf(lev.value), k = d / 2 + C0;
          const truth = isYou ? '' : ` · simulated listener: true $H$ = ${v.fix(Phi(M, d - k), 3)}, $F$ = ${v.fix(Phi(M, -k), 3)} (dashed lines)`;
          return `${N} trials · hits ${c.hit}, misses ${c.miss}, false alarms ${c.fa}, correct rejections ${c.cr} · hit rate $H$ = ${c.hit}/${nS} = **${nS ? v.fix(H, 3) : '—'}**, miss rate $1-H$ = ${nS ? v.fix(1 - H, 3) : '—'} · false-alarm rate $F$ = ${c.fa}/${nN} = **${nN ? v.fix(F, 3) : '—'}**, correct-rejection rate $1-F$ = ${nN ? v.fix(1 - F, 3) : '—'}${truth}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Sensitivity d′',
      statement: String.raw`**Sensitivity** $d'$ is the distance between the means of the signal and the noise distributions, in units of their common standard deviation:
$$d'=\frac{\mu_S-\mu_N}{\sigma}.$$
In the equal-variance Gaussian model (2.1) $H=\Phi(d'-k)$ and $F=\Phi(-k)$, so applying the inverse normal distribution function $z=\Phi^{-1}$ to both rates and subtracting removes the criterion:
$$d'=z(H)-z(F).$$
$d'=0$ means the stimuli cannot be told apart ($H=F$); $d'\approx1$ is a weak signal; $d'\approx2$ ($H=0.84$, $F=0.16$ for an unbiased observer) a clear one; above 3 detection is nearly perfect. A rate of exactly 0 or 1 has infinite $z$, so counts are corrected; here every rate is replaced by $(k+\tfrac12)/(n+1)$ (the log-linear correction). With $n_S$ signal and $n_N$ noise trials the estimate has approximate standard error
$$\mathrm{SE}(d')=\sqrt{\frac{H(1-H)}{n_S\,\varphi(z_H)^2}+\frac{F(1-F)}{n_N\,\varphi(z_F)^2}}\qquad\text{(Gourevitch \& Galanter, 1967)}.$$`,
      idea: String.raw`$z(F)=-k$ locates the criterion relative to the noise mean and $z(H)=d'-k$ relative to the signal mean, both in standard deviations; their difference is the distance between the two means whatever the criterion, which is why $d'$ does not change when the observer becomes more cautious (2.5). The standard error comes from the delta method: each rate is a binomial proportion, and $z$ stretches its sampling error by $1/\varphi(z)$, so rates near 0 or 1 give unstable estimates.`,
      caption: String.raw`Simulated observer: drag the **blue** handle to set the true separation and the **purple** handle to set the criterion. The responses are simulated (seeded) and $d'$ is computed from them alone, as $z(H)-z(F)$; it is drawn as the dashed curve on the left and as the point, with 95% intervals, on the ROC. The screen shows a noise patch and a grating at the contrast that gives this $d'$ for the simulated observer. Switch to **you**: *▶ Flash* shows a patch of noise for a quarter of a second, with a faint vertical grating on half the trials; answer *Yes, stripes* or *No*. Your hit and false-alarm rates give your $d'$ and criterion, your evidence distributions are redrawn from them, and your point lands on the ROC.`,
      deps: ['psych-2.1', 'psych-2.2'],
      refs: ['M&C ch. 1'],
      tags: ['sensitivity', 'signal detection'],
      credit: 'Tanner & Swets, 1954',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sensitivity_index' },
      viz(v) {
        const M = v.M, after = timers(v), NMAX = 400, LO = -3.4, HI = 6, YC = 0.49;
        let phase = 'idle', cur = null, tid = 0, you = [], seed = 11, U = null, uSeed = -1, last = null;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; } });
        const nT = v.slider('trials per stimulus type', 10, NMAX, 100, { int: true });
        const con = v.slider('grating contrast', 1, 15, 6, { step: 0.1, fmt: (x) => x.toFixed(1) + '%' });
        const bNew = v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const bFl = v.button('▶ Flash', () => flash());
        const bY = v.button('Yes, stripes', () => answer(true));
        const bN = v.button('No', () => answer(false));
        const bRes = v.button('Reset', () => { after.clear(); phase = 'idle'; you = []; last = null; });
        const sc = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 280, weight: 0.72, minWidth: 220, title: 'the screen' });
        const ev = v.stage({ x: [LO, HI], y: [-0.075, 0.53], height: 280, axes: 'box', weight: 1.1, xlabel: 'evidence $x$', yticks: [], title: 'evidence distributions' });
        const ro = v.stage({ ...ROCOPT, height: 280, weight: 0.85, minWidth: 230, title: 'the observer on the ROC' });
        const crit = ev.handle(0.7, YC, { color: 'purple', constrain: (x) => [M.clamp(x, -2.5, 5), YC] });
        const sig = ev.handle(1.5, phi(0), { color: 'accent', constrain: (x) => [M.clamp(x, 0, 4), phi(0)] });
        const Ry = v.rng(3030);
        const flash = () => { if (who.value !== 'you' || phase !== 'idle') return; cur = { s: Ry() < 0.5, c: con.value }; tid++; phase = 'flash'; after(250, () => { phase = 'wait'; }); };
        const answer = (r) => { if (who.value !== 'you' || phase !== 'wait') return; you.push({ s: cur.s, r }); last = { s: cur.s, r }; phase = 'idle'; after(500, flash); };
        const counts = () => {
          if (who.value === 'you') { let h = 0, nS = 0, f = 0, nN = 0; for (const q of you) { if (q.s) { nS++; if (q.r) h++; } else { nN++; if (q.r) f++; } } return { h, nS, f, nN }; }
          if (uSeed !== seed) { const R = v.rng(seed); U = { s: M.range(NMAX).map(() => R()), n: M.range(NMAX).map(() => R()) }; uSeed = seed; }
          const n = nT.value, pH = Phi(M, sig.x - crit.x), pF = Phi(M, -crit.x);
          let h = 0, f = 0; for (let i = 0; i < n; i++) { if (U.s[i] < pH) h++; if (U.n[i] < pF) f++; }
          return { h, nS: n, f, nN: n };
        };
        v.legend([['muted', 'noise'], ['accent', 'signal: true (solid), from the responses (dashed)'], ['purple', 'criterion'], ['ink', 'observed $(F, H)$, 95% intervals', { dot: true }]]);
        let stt = null;
        v.render(() => {
          const isYou = who.value === 'you';
          nT.el.hidden = bNew.hidden = isYou; bFl.hidden = bY.hidden = bN.hidden = bRes.hidden = !isYou; con.el.hidden = !isYou;
          crit.visible = sig.visible = !isYou;
          const C = counts(), ok = C.nS > 0 && C.nN > 0, E = ok ? sdt(M, C.h, C.nS, C.f, C.nN) : null;
          ev.setTitle(isYou ? 'your distributions, from your answers' : 'evidence distributions');
          // ---- screen
          sc.rect(-2, -2, 2, 2, { fill: [SCR.BG, SCR.BG, SCR.BG], fillAlpha: 1, stroke: false });
          if (!isYou) {
            const cc = 5 * Math.pow(sig.x, 2 / 3);
            gabors(sc, M, [[-0.5, 0.05, 0], [0.5, 0.05, cc]], 'sim' + cc.toFixed(2), 41);
            sc.text('noise', -0.5, -0.55, { align: 'center', color: SCRTXT, halo: false, size: 12 });
            sc.text('signal', 0.5, -0.55, { align: 'center', color: SCRTXT, halo: false, size: 12 });
            sc.text(`contrast ${v.fix(cc, 1)}% gives d′ = ${v.fix(sig.x, 2)}`, 0, 0.72, { align: 'center', color: SCRTXT, halo: false, size: 12 });
          } else {
            if (phase === 'flash') gabors(sc, M, [[0, 0, cur.s ? cur.c : 0]], 'y' + tid, 977 + tid * 7919);
            brackets(sc, 0, 0, 0.5, 0.12, 180);
            const msg = phase === 'wait' ? 'Were there stripes?' : phase === 'flash' ? '' : 'press ▶ Flash';
            if (msg) sc.text(msg, 0, -0.74, { align: 'center', color: SCRTXT, halo: false, size: 13 });
            if (last && phase === 'idle') sc.text(`last: ${last.s ? 'stripes' : 'noise only'}, you said ${last.r ? 'yes' : 'no'}`, 0, 0.74, { align: 'center', color: SCRTXT, halo: false, size: 11.5 });
          }
          // ---- distributions
          if (!isYou) {
            const d = sig.x, k = crit.x;
            shadeOutcomes(ev, k, d, LO, HI, 0.75);
            curves(ev, d, LO, HI, { sdy: 17 });
            ev.line(k, -0.075, k, YC, { color: 'purple', width: 2 });
            if (E) {
              ev.fn((x) => phi(x - E.d), { domain: [LO, HI], color: 'accent', width: 1.8, dash: [6, 4] });
              ev.measure(0, 0.075, E.d, 0.075, null, { color: 'ink' });
              ev.text(`z(H) − z(F) = ${v.fix(E.d, 2)}`, E.d / 2, 0.075, { dy: -10, align: 'center', color: 'ink', size: 11.5, weight: 600 });
            }
          } else if (E && you.length >= 4) {
            const d = Math.max(0, E.d), k = d / 2 + E.c;
            shadeOutcomes(ev, k, d, LO, HI, 0.75);
            curves(ev, d, LO, HI, { sname: 'your signal' });
            ev.line(k, -0.075, k, YC, { color: 'purple', width: 2 });
            ev.text('your criterion', k, YC, { dx: 8, align: 'left', color: 'purple', size: 11.5, weight: 600 });
          } else ev.text('answer a few trials first', (LO + HI) / 2, 0.25, { align: 'center', color: 'muted', size: 13 });
          // ---- ROC
          rocFrame(ro, M);
          if (!isYou) ro.path(rocPts(M, sig.x), { color: 'accent', width: 2.2 });
          if (E && (!isYou || you.length >= 4)) {
            ro.path(rocPts(M, Math.max(0, E.d)), { color: 'accent', width: 1.8, dash: [6, 4] });
            const [a, b] = wilson(C.f, C.nN), [c, d] = wilson(C.h, C.nS);
            ro.line(a, E.H, b, E.H, { color: 'ink', width: 1.3, alpha: 0.55 }); ro.line(E.F, c, E.F, d, { color: 'ink', width: 1.3, alpha: 0.55 });
            ro.dot(E.F, E.H, { r: 5.5, color: isYou ? 'gold' : 'ink' });
            ro.text(isYou ? 'you' : `d′ = ${v.fix(E.d, 2)}`, E.F, E.H, { dx: 9, dy: 10, align: 'left', color: isYou ? 'gold' : 'ink', weight: 700, size: 12 });
          }
          stt = { C, E, isYou };
        });
        v.readout(() => {
          if (!stt) return '';
          const { C, E, isYou } = stt;
          if (!E || (isYou && you.length < 4)) return isYou ? 'No answers yet. Press **▶ Flash**, look at the centre of the brackets and answer honestly; when unsure, follow your impression.' : '';
          const ci = `${v.fix(E.d, 2)} ± ${v.fix(1.96 * E.seD, 2)}`;
          const truth = isYou ? '' : ` · true separation $d'$ = ${v.fix(sig.x, 2)}, true $c$ = $k-d'/2$ = ${v.fix(crit.x - sig.x / 2, 2)}`;
          return `${C.nS} signal and ${C.nN} noise trials · $H$ = ${C.h}/${C.nS} = ${v.fix(E.H, 3)}, $F$ = ${C.f}/${C.nN} = ${v.fix(E.F, 3)} · $z(H)$ = ${v.fix(E.zH, 2)}, $z(F)$ = ${v.fix(E.zF, 2)} (log-linear corrected) · $\\hat d' = z(H)-z(F)$ = **${ci}** (95%) · criterion $\\hat c=-\\tfrac12[z(H)+z(F)]$ = ${v.fix(E.c, 2)}${truth}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Response criterion c and likelihood-ratio bias β',
      statement: String.raw`Two standard measures say where the criterion $k$ sits in the equal-variance model (2.1):

- the **criterion location** $c=k-\tfrac{d'}{2}=-\tfrac12\,[z(H)+z(F)]$, the criterion's distance from the point midway between the two means, in standard deviations. $c=0$ is *neutral* (misses and false alarms equally frequent), $c>0$ *conservative* (fewer “yes” answers), $c<0$ *liberal*;
- the **likelihood ratio** at the criterion, $\beta=f_S(k)/f_N(k)$, the ratio of the heights of the signal and noise densities there. For equal-variance Gaussians $\ln\beta=c\,d'$, so $\beta=1$ exactly when $c=0$; $\beta$ is the quantity that an optimal observer sets from payoffs and prior probabilities (2.12).

The *relative criterion* $c'=c/d'$ gives the location as a fraction of the separation. The measures can disagree about which of two observers with different $d'$ is more biased: for the same $c$, $\beta$ grows with $d'$. Macmillan and Creelman favour $c$ as the bias index of the equal-variance model.`,
      idea: String.raw`From 2.1, $z(F)=-k$ and $z(H)=d'-k$, so their mean is $d'/2-k=-c$. The density ratio is $\exp\{-\tfrac12(k-d')^2+\tfrac12k^2\}=\exp\{d'(k-d'/2)\}=e^{c\,d'}$. As the criterion moves, $H$ and $F$ rise or fall together: they slide along one curve, the observer's ROC (2.6), and $c$ and $\beta$ say where along it the observer sits; the faint curves of constant $c$ and of constant $\beta$ cross that curve at different angles, which is the sense in which they are different measures of bias.`,
      caption: String.raw`Drag the **purple** criterion. The two bars standing on the criterion are the heights of the signal (blue) and noise (grey) densities there, and their ratio is $\beta$; the arrow from the dashed midpoint is $c$. On the right, the observer's point slides along a single iso-sensitivity curve while the faint purple curves join points of equal bias. Switch them between **iso-$c$** and **iso-$\beta$** to see how differently the two measures divide the square, and change $d'$ with the slider.`,
      deps: ['psych-2.1', 'psych-2.3'],
      refs: ['M&C ch. 2'],
      tags: ['criterion', 'bias'],
      credit: 'Tanner & Swets, 1954 (β); Macmillan & Creelman, 1990 (the case for c)',
      viz(v) {
        const M = v.M, LO = -3.4, HI = 6.2, YC = 0.5;
        const dS = v.slider("sensitivity $d'$", 0.2, 3.5, 1.5, { step: 0.01 });
        const fam = v.select('equal-bias curves', [{ value: 'c', label: 'iso-$c$' }, { value: 'b', label: 'iso-$\\beta$' }], 'c');
        const ev = v.stage({ x: [LO, HI], y: [-0.08, 0.54], height: 320, axes: 'box', weight: 1.2, xlabel: 'evidence $x$', yticks: [], title: 'where the criterion sits' });
        const ro = v.stage({ ...ROCOPT, height: 320, weight: 0.85, minWidth: 240, title: 'one observer, one curve' });
        const crit = ev.handle(1.3, YC, { color: 'purple', constrain: (x) => [M.clamp(x, -2.8, 5.6), YC] });
        v.legend([['muted', 'noise density $f_N$'], ['accent', 'signal density $f_S$'], ['muted', 'midpoint between the means', { dash: true }], ['purple', 'criterion, and curves of equal bias'], ['accent', "iso-sensitivity curve for this $d'$"]]);
        let st = null;
        v.render(() => {
          const d = dS.value, k = crit.x, c = k - d / 2, fN = phi(k), fS = phi(k - d), beta = fS / fN, H = Phi(M, d - k), F = Phi(M, -k);
          // ---- distributions
          if (k < HI) { ev.between((x) => phi(x - d), () => 0, k, HI, { fill: OC.hit, fillAlpha: 0.16 }); ev.between((x) => phi(x), () => 0, k, HI, { fill: OC.fa, fillAlpha: 0.05, hatch: OC.fa, hatchAlpha: 0.5 }); }
          curves(ev, d, LO, HI, { sdy: 11 });
          ev.line(d / 2, -0.08, d / 2, 0.45, { color: 'muted', dash: [4, 4], width: 1.2 });
          ev.line(k, -0.08, k, YC, { color: 'purple', width: 2 });
          ev.line(k - 0.07, 0, k - 0.07, fN, { color: 'muted', width: 5, cap: 'butt' }); ev.line(k + 0.07, 0, k + 0.07, fS, { color: 'accent', width: 5, cap: 'butt' });
          ev.dot(k - 0.07, fN, { r: 3.5, color: 'muted' }); ev.dot(k + 0.07, fS, { r: 3.5, color: 'accent' });
          ev.tex('f_N(k)', k - 0.07, Math.max(0.03, fN / 2), { dx: -7, align: 'right', color: 'muted', size: 14 });
          ev.tex('f_S(k)', k + 0.07, Math.max(0.03, fS / 2), { dx: 7, align: 'left', color: 'accent', size: 14 });
          if (Math.abs(c) > 0.12) ev.arrow(d / 2, 0.43, k, 0.43, { color: 'purple', width: 1.8, head: 7 });
          ev.text(`c = ${v.fix(c, 2)}`, (d / 2 + k) / 2, 0.43, { dy: -10, align: 'center', color: 'purple', weight: 700, size: 12.5 });
          const regime = Math.abs(c) < 0.05 ? 'neutral' : c > 0 ? 'conservative: fewer “yes”' : 'liberal: more “yes”';
          ev.text(`β = ${v.fix(beta, 2)}`, LO + 0.12, 0.47, { align: 'left', color: 'purple', size: 15, weight: 700 });
          ev.text(regime, LO + 0.12, 0.425, { align: 'left', color: 'purple', size: 11.5, weight: 600 });
          // ---- ROC with bias families
          rocFrame(ro, M);
          const ds = M.linspace(0.02, 7, 160);
          if (fam.value === 'c') for (const cc of [-1, -0.5, 0, 0.5, 1]) {
            ro.path(ds.map((dd) => [Phi(M, -dd / 2 - cc), Phi(M, dd / 2 - cc)]), { color: 'purple', width: 1, alpha: 0.4 });
            const x0 = Phi(M, -cc); ro.text(`c = ${cc}`, x0, x0, { dx: 5, dy: 9, align: 'left', color: 'purple', size: 10, alpha: 0.85 });
          } else for (const b of [0.25, 0.5, 1, 2, 4]) {
            const lb = Math.log(b);
            ro.path(ds.map((dd) => [Phi(M, -dd / 2 - lb / dd), Phi(M, dd / 2 - lb / dd)]), { color: 'purple', width: 1, alpha: 0.4 });
            const dd = 1.6, x0 = Phi(M, -dd / 2 - lb / dd), y0 = Phi(M, dd / 2 - lb / dd);
            ro.text(`β = ${b}`, x0, y0, { dx: 5, dy: 9, align: 'left', color: 'purple', size: 10, alpha: 0.85 });
          }
          ro.path(rocPts(M, d), { color: 'accent', width: 2.4 });
          ro.dot(F, H, { r: 6, color: 'purple' });
          st = { d, k, c, beta, H, F };
        });
        v.readout(() => {
          if (!st) return '';
          const { d, k, c, beta, H, F } = st, zH = zq(M, H), zF = zq(M, F);
          return `criterion $k$ = ${v.fix(k, 2)}, $d'$ = ${v.fix(d, 2)}: $H$ = ${v.fix(H, 3)}, $F$ = ${v.fix(F, 3)} · $c = k-d'/2$ = ${v.fix(c, 3)}; from the rates $-\\tfrac12[z(H)+z(F)]$ = ${v.fix(-(zH + zF) / 2, 3)} · $\\beta$ = ratio of heights = ${v.fix(beta, 3)}; $e^{c\\,d'}$ = ${v.fix(Math.exp(c * d), 3)}, $\\ln\\beta$ = ${v.fix(Math.log(beta), 3)} · relative criterion $c' = c/d'$ = ${v.fix(c / d, 3)} · ${Math.abs(c) < 0.05 ? 'neutral' : c > 0 ? 'conservative' : 'liberal'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Sensitivity and bias are separable',
      statement: String.raw`In the equal-variance Gaussian model the map
$$(d',c)\longmapsto(F,H)=\big(\Phi(-d'/2-c),\ \Phi(d'/2-c)\big)$$
is a bijection from $[0,\infty)\times\mathbb R$ onto the part of the open unit square on or above the diagonal, with inverse $d'=z(H)-z(F)$, $c=-\tfrac12\,[z(H)+z(F)]$. So the two rates measured in a yes/no experiment determine sensitivity and criterion separately, and:

(a) a manipulation that affects only the criterion (payoffs, signal probability, instructions) moves $(F,H)$ along one iso-sensitivity curve and leaves the estimate of $d'$ unchanged up to sampling error;
(b) one that affects only discriminability (stimulus strength) changes $d'$;
(c) percent correct, $\tfrac12(H+1-F)$ when signals occur on half the trials, mixes the two and can rank observers or conditions the wrong way round.

The separation holds within the model only: if an observer's true iso-sensitivity curves have another shape (a high-threshold observer, psych-1.12, or unequal variances, 2.8), $z(H)-z(F)$ changes with the criterion.`,
      idea: String.raw`$z$ is strictly increasing, so $(F,H)\mapsto(z(F),z(H))$ is a bijection onto $\mathbb R^2$, and the linear map $(z_F,z_H)\mapsto\big(z_H-z_F,\,-\tfrac12(z_H+z_F)\big)$ is invertible. A payoff that makes false alarms expensive moves the criterion to the right: both rates fall, along the curve of constant $d'$, and $d'$ computed from the new rates is unchanged. Percent correct is largest for a neutral criterion and falls as the criterion moves either way, so the same observer scores differently under different payoffs, and a less sensitive observer with a neutral criterion can outscore a more sensitive one with a skewed criterion.`,
      caption: String.raw`One simulated observer ($d'$ = 1.5) runs five blocks under different stakes, from false alarms costing four times what a hit earns (left) to hits worth four times a false alarm (right), and in each block puts its criterion where the expected payoff is largest. Left: $d'$ (blue) and $c$ (purple) estimated from each block, with 95% intervals, and percent correct above each block. Right: the blocks on the ROC. With the **Gaussian** observer $c$ swings while $d'$ stays on the dashed true value. Switch the **true observer** to **high threshold** (same rates in the middle block) and $z(H)-z(F)$ is no longer constant. Turn on **observer B** ($d'$ = 1.1, neutral criterion) and compare percent correct.`,
      deps: ['psych-2.3', 'psych-2.4', 'ladr-3.63'],
      see: ['psych-2.9'],
      refs: ['M&C ch. 2'],
      tags: ['sensitivity', 'criterion'],
      credit: 'Green & Swets, 1966',
      viz(v) {
        const M = v.M, D = 1.5, DB = 1.1, LB = [Math.log(4), Math.log(2), 0, -Math.log(2), -Math.log(4)], NMAX = 1000;
        const kind = v.select('true observer', [{ value: 'g', label: 'Gaussian' }, { value: 'ht', label: 'high threshold' }], 'g');
        const nT = v.slider('trials per block (each type)', 20, NMAX, 200, { int: true });
        const obB = v.toggle('observer B', false);
        let seed = 52, U = null, uSeed = -1;
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const bl = v.stage({ x: [0.4, 5.6], y: [-1.7, 3.35], height: 320, axes: 'box', weight: 1.15, xticks: [[1, '4 : 1'], [2, '2 : 1'], [3, '1 : 1'], [4, '1 : 2'], [5, '1 : 4']], yticks: [-1, 0, 1, 2, 3], title: 'five payoff blocks (false-alarm cost : hit value)' });
        const ro = v.stage({ ...ROCOPT, height: 320, weight: 0.85, minWidth: 240, title: 'the five blocks on the ROC' });
        const cOf = (i) => LB[i] / D, P0 = (Phi(M, D / 2) - Phi(M, -D / 2)) / (1 - Phi(M, -D / 2));
        const rates = (i) => {
          const c = cOf(i), F = Phi(M, -D / 2 - c);
          return kind.value === 'g' ? { H: Phi(M, D / 2 - c), F } : { H: P0 + (1 - P0) * F, F };
        };
        v.legend([['accent', "$d'$ estimate, 95% CI", { dot: true }], ['purple', '$c$ estimate, 95% CI', { dot: true }], ['accent', "true $d'$", { dash: true }], ['red', 'high-threshold ROC (a straight line)'], ['gray', 'observer B', { dot: true }]]);
        let st = null;
        v.render(() => {
          if (uSeed !== seed) { const R = v.rng(seed); U = LB.map(() => ({ s: M.range(NMAX).map(() => R()), n: M.range(NMAX).map(() => R()) })); U.B = { s: M.range(NMAX).map(() => R()), n: M.range(NMAX).map(() => R()) }; uSeed = seed; }
          const n = nT.value, ht = kind.value === 'ht';
          const est = LB.map((_, i) => { const r = rates(i), u = U[i]; let h = 0, f = 0; for (let j = 0; j < n; j++) { if (u.s[j] < r.H) h++; if (u.n[j] < r.F) f++; } return { ...sdt(M, h, n, f, n), pcor: (h + n - f) / (2 * n), r }; });
          let B = null;
          if (obB.value) { let h = 0, f = 0; const pH = Phi(M, DB / 2), pF = Phi(M, -DB / 2); for (let j = 0; j < n; j++) { if (U.B.s[j] < pH) h++; if (U.B.n[j] < pF) f++; } B = { ...sdt(M, h, n, f, n), pcor: (h + n - f) / (2 * n) }; }
          // ---- blocks panel
          bl.hline(0, { color: 'faint', width: 1 });
          bl.hline(D, { color: 'accent', dash: [6, 4], width: 1.4 });
          bl.text("true d′", 5.55, D, { dy: -9, align: 'right', color: 'accent', size: 11 });
          if (!ht) bl.path(LB.map((_, i) => [i + 1 + 0.13, cOf(i)]), { color: 'purple', dash: [6, 4], width: 1.2, alpha: 0.6 });
          est.forEach((e, i) => {
            const x = i + 1;
            bl.line(x - 0.13, e.d - 1.96 * e.seD, x - 0.13, e.d + 1.96 * e.seD, { color: 'accent', width: 2, alpha: 0.6 });
            bl.dot(x - 0.13, e.d, { r: 5, color: 'accent' });
            bl.line(x + 0.13, e.c - 1.96 * e.seC, x + 0.13, e.c + 1.96 * e.seC, { color: 'purple', width: 2, alpha: 0.6 });
            bl.dot(x + 0.13, e.c, { r: 5, color: 'purple' });
            bl.text(`PC ${pc(e.pcor)}`, x, 3.12, { align: 'center', color: 'ink', size: 11.5, weight: 600 });
          });
          if (B) { bl.hline(B.d, { color: 'gray', dash: [2, 4], width: 1.2 }); bl.text(`B: d′ ${v.fix(B.d, 2)}, PC ${pc(B.pcor)}`, 0.45, B.d, { dy: B.d > D ? -9 : 10, align: 'left', color: 'gray', size: 11, weight: 600 }); }
          // ---- ROC panel
          rocFrame(ro, M);
          ro.path(rocPts(M, D), { color: 'accent', width: 2, dash: ht ? [6, 4] : null, alpha: ht ? 0.6 : 1 });
          if (ht) ro.line(0, P0, 1, 1, { color: 'red', width: 2.2 });
          est.forEach((e, i) => { ro.dot(e.F, e.H, { r: 5.5, color: 'purple' }); ro.text(String(i + 1), e.F, e.H, { dx: 7, dy: 8, align: 'left', color: 'purple', size: 11, weight: 700 }); });
          if (B) { ro.path(rocPts(M, DB), { color: 'gray', width: 1.2, dash: [2, 4] }); ro.dot(B.F, B.H, { r: 5.5, color: 'gray' }); ro.text('B', B.F, B.H, { dx: -7, dy: -8, align: 'right', color: 'gray', size: 11, weight: 700 }); }
          st = { est, B, ht };
        });
        v.readout(() => {
          if (!st) return '';
          const { est, B, ht } = st, ds = est.map((e) => e.d), cs = est.map((e) => e.c), ps = est.map((e) => e.pcor);
          const rng = (a) => `${v.fix(Math.min(...a), 2)} to ${v.fix(Math.max(...a), 2)}`;
          const bTxt = B ? ` · observer B ($d'$ = ${DB}, neutral) scores ${pc(B.pcor)}, more than observer A in blocks ${est.map((e, i) => (e.pcor < B.pcor ? i + 1 : null)).filter((x) => x).join(', ') || 'none'}: percent correct ranks the less sensitive observer higher there` : '';
          return `estimated $d'$ across the blocks: ${rng(ds)} ${ht ? '(a high-threshold observer: $z(H)-z(F)$ is smallest in the middle and grows towards both ends, so it is not criterion-free)' : `(true ${D}: constant within sampling error)`} · estimated $c$: ${rng(cs)} (optimal: ${est.map((_, i) => v.fix(cOf(i), 2)).join(', ')}) · percent correct: ${ps.map(pc).join(', ')}, best for the neutral block${bTxt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'The ROC curve',
      statement: String.raw`The **receiver operating characteristic** (ROC) of an observer is the curve traced by the point $(F,H)$ as the criterion $k$ sweeps from $+\infty$ (never “yes”: the corner $(0,0)$) to $-\infty$ (always “yes”: $(1,1)$). For the equal-variance Gaussian model
$$H=\Phi\big(d'+z(F)\big),$$
a concave curve, symmetric about the negative diagonal and bowed towards $(0,1)$ by an amount set by $d'$; $d'=0$ gives the chance diagonal $H=F$. Each curve is an **iso-sensitivity curve**: its points differ only in criterion. The slope of the ROC at the point produced by criterion $k$ is the likelihood ratio there,
$$\frac{dH}{dF}=\frac{f_S(k)}{f_N(k)}=\beta(k),$$
steep near $(0,0)$ and flat near $(1,1)$. The ROC depends only on how the two distributions are ordered against each other, so any increasing transformation of the evidence leaves it unchanged; its shape is therefore a test of the model's assumptions about the distributions (2.8, 2.9).`,
      idea: String.raw`Lowering the criterion by $dk$ raises $F=P(x_N>k)$ by $f_N(k)\,dk$ and $H=P(x_S>k)$ by $f_S(k)\,dk$, so the slope of the curve is the density ratio at $k$. For equal-variance Gaussians that ratio, $e^{d'(k-d'/2)}$, decreases as $k$ decreases, so the curve is concave. It is the same object as the ROC of a statistical test (stat-6.5), with $F$ the size and $H$ the power; the Neyman–Pearson lemma (stat-6.4) says the likelihood-ratio cut gives the highest $H$ at every $F$, and for this model a cut on $x$ is such a cut.`,
      caption: String.raw`The criterion sweeps back and forth by itself and its point traces the ROC on the right; the purple tangent there has slope $\beta$, the ratio of the two density heights at the criterion (the bars on the left). Drag the **purple** handle to take over (the sweep pauses; press play to resume). Raise or lower $d'$: the bow fattens or flattens, and at $d'=0$ it collapses onto the diagonal. The faint curves are the ROCs for $d'$ = 0.5, 1, 2 and 3.`,
      deps: ['psych-2.3', 'stat-6.5'],
      see: ['epi-2.7', 'stat-6.4'],
      refs: ['M&C ch. 3'],
      tags: ['ROC', 'signal detection'],
      credit: 'Peterson, Birdsall & Fox, 1954 (radar); Tanner & Swets, 1954 (perception)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Receiver_operating_characteristic' },
      viz(v) {
        const M = v.M, LO = -3.4, HI = 6.4, YC = 0.49, PER = 10;
        const dS = v.slider("sensitivity $d'$", 0, 4, 1.5, { step: 0.01 });
        const ev = v.stage({ x: [LO, HI], y: [-0.08, 0.53], height: 320, axes: 'box', weight: 1.15, xlabel: 'evidence $x$', yticks: [], title: 'the criterion sweeps across the evidence' });
        const ro = v.stage({ ...ROCOPT, height: 320, weight: 0.85, minWidth: 240, title: 'the ROC it traces' });
        let dragged = false, st = null;
        const crit = ev.handle(0.75, YC, { color: 'purple', constrain: (x) => [M.clamp(x, -3, 6), YC] });
        crit.onDrag = () => { dragged = true; if (v.playing) v.pause(); };
        v.legend([['accent', 'ROC: all criteria, this $d\'$'], ['purple', 'the current criterion, its point and the tangent of slope $\\beta$'], ['faint', "ROCs for other $d'$"]]);
        v.animate((t) => {
          if (v.playing) dragged = false;
          const d = dS.value, a = -2.6, b = d + 2.6, u = (t % PER) / PER, tri = u < 0.5 ? 2 * u : 2 - 2 * u;
          const k = dragged ? crit.x : b - (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * tri));
          if (!dragged) crit.set(k, YC);
          const H = Phi(M, d - k), F = Phi(M, -k), fN = phi(k), fS = phi(k - d), beta = fS / fN;
          // ---- left
          shadeOutcomes(ev, k, d, LO, HI, 0.7);
          curves(ev, d, LO, HI, { sdy: 17 });
          ev.line(k, -0.08, k, YC, { color: 'purple', width: 2 });
          ev.line(k - 0.06, 0, k - 0.06, fN, { color: 'muted', width: 4.5, cap: 'butt' }); ev.line(k + 0.06, 0, k + 0.06, fS, { color: 'accent', width: 4.5, cap: 'butt' });
          ev.text(`F = ${v.fix(F, 2)}`, k, 0.44, { dx: -8, align: 'right', color: OC.fa, weight: 700, size: 12 });
          ev.text(`H = ${v.fix(H, 2)}`, k, 0.44, { dx: 8, align: 'left', color: OC.hit, weight: 700, size: 12 });
          // ---- right
          rocFrame(ro, M, { family: [0.5, 1, 2, 3] });
          ro.path(rocPts(M, d), { color: 'accent', width: 2.6 });
          const L = 0.17 / Math.sqrt(1 + beta * beta);
          ro.clip(() => ro.line(F - L, H - beta * L, F + L, H + beta * L, { color: 'purple', width: 2, dash: [5, 3] }));
          ro.line(F, 0, F, H, { color: OC.fa, width: 1, dash: [2, 3] }); ro.line(0, H, F, H, { color: OC.hit, width: 1, dash: [2, 3] });
          ro.dot(F, H, { r: 6, color: 'purple' });
          ro.text(`slope β = ${v.fmt(beta, 3)}`, F, H, { dx: F > 0.55 ? -10 : 10, dy: 15, align: F > 0.55 ? 'right' : 'left', color: 'purple', size: 11.5, weight: 700 });
          st = { d, k, H, F, beta };
        }, { period: PER, still: 2.4 });
        v.readout(() => {
          if (!st) return '';
          const { d, k, H, F, beta } = st, e = 1e-4;
          const num = (Phi(M, d - k + e) - Phi(M, d - k - e)) / (Phi(M, -k + e) - Phi(M, -k - e));
          return `criterion $k$ = ${v.fix(k, 2)}: point $(F,H)$ = (${v.fix(F, 3)}, ${v.fix(H, 3)}) · slope of the ROC there (finite difference) = ${v.fmt(num, 4)}; likelihood ratio $f_S(k)/f_N(k)$ = ${v.fmt(beta, 4)} · on this curve $z(H)-z(F)$ = ${v.fix(zq(M, H) - zq(M, F), 3)} = $d'$ at every point · area under the curve $\\Phi(d'/\\sqrt2)$ = ${v.fix(Phi(M, d / Math.SQRT2), 3)}${d < 0.02 ? ' — chance: the curve is the diagonal' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Method',
      name: 'Rating experiments and the empirical ROC',
      statement: String.raw`In a **rating experiment** the observer answers every trial on an ordered confidence scale, for instance 1 = “sure no” … 6 = “sure yes”, instead of yes/no. In the detection model this amounts to holding $m-1$ criteria $b_1<\dots<b_{m-1}$ at once: rating $r$ means $b_{r-1}<x\le b_r$. Counting ratings of at least $j$ as “yes” gives a hit rate and a false-alarm rate for each $j$,
$$H_j=\frac{\#\{\text{signal trials rated}\ge j\}}{n_S},\qquad F_j=\frac{\#\{\text{noise trials rated}\ge j\}}{n_N},$$
so a single session yields $m-1$ points of the **empirical ROC** instead of one. The binormal model (noise $N(0,1)$, signal $N(\mu,\sigma^2)$, $m-1$ boundaries) is fitted to the rating counts by maximum likelihood (Dorfman & Alf, 1969). The method assumes that the criteria stay put through the session and that ratings and yes/no decisions rest on the same evidence; it is much quicker than running separate yes/no blocks under different payoffs and gives nearly the same ROCs (Egan, Schulman & Greenberg, 1959).`,
      idea: String.raw`A rating is a yes/no answer at several criteria at once: a trial rated 5 counts as “yes” for every split that puts 5 on the yes side. Cumulating the counts from the confident-yes end gives nested ROC points, each computed from all the trials, so they climb monotonically from $(0,0)$ to $(1,1)$. The likelihood of the counts is a product of two multinomials over the rating categories, whose probabilities are differences of normal distribution functions at adjacent boundaries; maximising it over $(\mu,\sigma,b_1,\dots,b_{m-1})$ fits the whole curve at once and weights every point by its real sampling error, which fitting a straight line to z-transformed points does not.`,
      caption: String.raw`The simulated observer rates 150 noise and 150 grating trials (seeded; change the number with the slider, the grating's strength with the contrast). Middle: how often each rating was given on noise (grey) and on signal (blue) trials, with the fitted model's expected proportions as dots. Right: the five cumulative ROC points with 95% intervals and the maximum-likelihood binormal curve. Switch to **you**: *▶ Flash* shows a noise patch with a grating on half the trials; then rate how sure you are that it contained stripes, from **1** (sure there were none) to **6** (sure there were).`,
      deps: ['psych-2.6', 'stat-3.5'],
      refs: ['M&C ch. 3'],
      tags: ['ROC', 'method'],
      credit: 'Egan, Schulman & Greenberg, 1959; Dorfman & Alf, 1969 (maximum-likelihood fit)',
      viz(v) {
        const M = v.M, after = timers(v), NMAX = 500, MR = 6, SIGS = 1.2, BND = [-0.35, 0.25, 0.75, 1.3, 1.9];
        let phase = 'idle', cur = null, tid = 0, you = [], seed = 77, Z = null, zSeed = -1, fit = null, fKey = '', last = null;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; } });
        const con = v.slider('grating contrast', 1, 15, 6, { step: 0.1, fmt: (x) => x.toFixed(1) + '%' });
        const nT = v.slider('trials per stimulus type', 20, NMAX, 150, { int: true });
        const bNew = v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const bFl = v.button('▶ Flash', () => flash());
        const LAB = ['1 sure no', '2', '3', '4', '5', '6 sure yes'];
        const bR = LAB.map((lab, i) => v.button(lab, () => rate(i)));
        const bRes = v.button('Reset', () => { after.clear(); phase = 'idle'; you = []; last = null; });
        const sc = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 270, weight: 0.7, minWidth: 210, title: 'the screen' });
        const ba = v.stage({ x: [-0.25, 6.6], y: [0, 0.6], height: 270, axes: 'box', weight: 1, xticks: M.range(MR).map((i) => [i + 1, String(i + 1)]), title: 'use of ratings 1 (sure no) … 6 (sure yes)' });
        const ro = v.stage({ ...ROCOPT, height: 270, weight: 0.9, minWidth: 230, title: 'the empirical ROC' });
        const Ry = v.rng(7171);
        const flash = () => { if (who.value !== 'you' || phase !== 'idle') return; cur = { s: Ry() < 0.5, c: con.value }; tid++; phase = 'flash'; after(250, () => { phase = 'wait'; }); };
        const rate = (r) => { if (who.value !== 'you' || phase !== 'wait') return; you.push({ s: cur.s, r }); last = { s: cur.s, r }; phase = 'idle'; after(500, flash); };
        const counts = () => {
          const nC = new Array(MR).fill(0), sC = new Array(MR).fill(0);
          if (who.value === 'you') { for (const q of you) (q.s ? sC : nC)[q.r]++; return { nC, sC }; }
          if (zSeed !== seed) { const R = v.rng(seed); Z = { n: M.range(NMAX).map(() => R.normal()), s: M.range(NMAX).map(() => R.normal()) }; zSeed = seed; }
          const mu = dGrating(con.value), cat = (x) => { let r = 0; while (r < MR - 1 && x > BND[r]) r++; return r; };
          for (let i = 0; i < nT.value; i++) { nC[cat(Z.n[i])]++; sC[cat(mu + SIGS * Z.s[i])]++; }
          return { nC, sC };
        };
        v.legend([['muted', 'noise trials', { area: true }], ['accent', 'signal trials', { area: true }], ['ink', 'cumulative ROC points, 95% intervals', { dot: true }], ['accent', 'maximum-likelihood binormal fit']]);
        let stt = null;
        v.render(() => {
          const isYou = who.value === 'you';
          nT.el.hidden = bNew.hidden = isYou; bFl.hidden = bRes.hidden = !isYou; for (const b of bR) b.hidden = !isYou;
          const { nC, sC } = counts(), Nn = M.sum(nC), Ns = M.sum(sC), key = nC.join() + '|' + sC.join();
          if (key !== fKey) { fKey = key; fit = fitRating(M, nC, sC); }
          // ---- screen
          sc.rect(-2, -2, 2, 2, { fill: [SCR.BG, SCR.BG, SCR.BG], fillAlpha: 1, stroke: false });
          if (!isYou) {
            gabors(sc, M, [[-0.5, 0.05, 0], [0.5, 0.05, con.value]], 'sim' + con.value.toFixed(2), 43);
            sc.text('noise', -0.5, -0.55, { align: 'center', color: SCRTXT, halo: false, size: 12 });
            sc.text(`signal, ${v.fix(con.value, 1)}%`, 0.5, -0.55, { align: 'center', color: SCRTXT, halo: false, size: 12 });
          } else {
            if (phase === 'flash') gabors(sc, M, [[0, 0, cur.s ? cur.c : 0]], 'y' + tid, 991 + tid * 6151);
            brackets(sc, 0, 0, 0.5, 0.12, 180);
            const msg = phase === 'wait' ? 'How sure are you there were stripes?' : phase === 'flash' ? '' : 'press ▶ Flash';
            if (msg) sc.text(msg, 0, -0.74, { align: 'center', color: SCRTXT, halo: false, size: 12 });
            if (last && phase === 'idle') sc.text(`last: ${last.s ? 'stripes' : 'noise only'}, rated ${last.r + 1}`, 0, 0.74, { align: 'center', color: SCRTXT, halo: false, size: 11.5 });
          }
          // ---- bars
          const pN = nC.map((x) => (Nn ? x / Nn : 0)), pS = sC.map((x) => (Ns ? x / Ns : 0));
          const ex = fit ? ratingProbs(M, fit) : null, ym = Math.max(0.3, ...pN, ...pS, ...(ex ? [...ex.pN, ...ex.pS] : [])) * 1.15;
          ba.setView(null, [-0.07 * ym, ym]);
          for (let r = 0; r < MR; r++) {
            const x = r + 1;
            ba.rect(x - 0.36, 0, x - 0.02, pN[r], { fill: 'muted', fillAlpha: 0.45, color: 'muted', width: 1 });
            ba.rect(x + 0.02, 0, x + 0.36, pS[r], { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 });
            if (ex) { ba.dot(x - 0.19, ex.pN[r], { r: 3.5, color: 'ink' }); ba.dot(x + 0.19, ex.pS[r], { r: 3.5, color: 'ink' }); }
          }
          if (!Nn && !Ns) ba.text('no ratings yet', 3.5, ym / 2, { align: 'center', color: 'muted', size: 13 });
          // ---- ROC
          rocFrame(ro, M);
          const pts = cumROC(nC, sC);
          if (fit) ro.path(rocPts(M, fit.mu, fit.sig), { color: 'accent', width: 2.4 });
          if (Nn && Ns) { drawCum(ro, pts); pts.forEach((p) => ro.text(`≥${p.j + 1}`, p.F, p.H, { dx: 8, dy: 9, align: 'left', color: 'muted', size: 10.5 })); }
          stt = { nC, sC, Nn, Ns, fit, pts, isYou };
        });
        v.readout(() => {
          if (!stt) return '';
          const { nC, sC, Nn, Ns, fit, isYou } = stt;
          if (!Nn || !Ns) return isYou ? 'No ratings yet. Press **▶ Flash** and rate each patch from 1 (sure: no stripes) to 6 (sure: stripes). Use the whole scale.' : '';
          const fitTxt = fit ? `maximum-likelihood fit: signal mean $\\hat\\mu$ = ${v.fix(fit.mu, 2)}, SD $\\hat\\sigma_S$ = ${v.fix(fit.sig, 2)} (z-ROC slope ${v.fix(1 / fit.sig, 2)}), area $A_z=\\Phi(\\mu/\\sqrt{1+\\sigma^2})$ = ${v.fix(Phi(M, fit.mu / Math.sqrt(1 + fit.sig * fit.sig)), 3)}` : 'not enough trials for a fit yet';
          const truth = isYou ? '' : ` (simulated observer: $\\mu$ = ${v.fix(dGrating(con.value), 2)}, $\\sigma_S$ = ${SIGS})`;
          return `${Nn} noise and ${Ns} signal trials give ${MR - 1} ROC points · rating counts, noise: ${nC.join(' · ')}; signal: ${sC.join(' · ')} · ${fitTxt}${truth}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Model',
      name: 'Unequal-variance model and the z-ROC slope',
      statement: String.raw`If signal trials are more (or less) variable than noise trials, $x_N\sim N(0,1)$ and $x_S\sim N(\mu,\sigma_S^2)$ with $\sigma_S\ne1$, the ROC loses its symmetry about the negative diagonal, but on **z-coordinates** it is still a straight line:
$$z(H)=\frac{\mu}{\sigma_S}+\frac{1}{\sigma_S}\,z(F),$$
with slope $1/\sigma_S=\sigma_N/\sigma_S$ and intercept $\mu/\sigma_S$. A z-ROC slope of 1 is the signature of equal variances; recognition memory typically gives slopes near 0.8 (Ratcliff, Sheu & Gronlund, 1992), so studied items are more variable in familiarity than new ones. With unequal variances $z(H)-z(F)$ changes with the criterion and is no longer a sensitivity index; the usual replacements are
$$d_a=\mu\sqrt{\frac{2}{1+\sigma_S^2}},\qquad A_z=\Phi\big(d_a/\sqrt2\big)=\Phi\Big(\frac{\mu}{\sqrt{1+\sigma_S^2}}\Big),$$
the second being the area under the binormal ROC. A z-ROC that is curved rather than straight shows that the evidence is not binormal, for instance when some signal trials are detected outright, as dual-process models of recognition memory propose (Yonelinas, 1994).`,
      idea: String.raw`$F=\Phi(-k)$ gives $k=-z(F)$, and $H=\Phi\big((\mu-k)/\sigma_S\big)$ gives $z(H)=(\mu+z(F))/\sigma_S$, a linear function of $z(F)$ for every $\mu$ and $\sigma_S$: the z-transform straightens any binormal ROC. A slope below 1 makes the ROC rise steeply at the left and run close to the top edge at the right. If instead a fraction $R$ of signal trials is detected outright (a threshold process), $H=R+(1-R)\,\Phi((\mu-k)/\sigma_S)$ never falls below $R$, so $z(H)$ levels off at $z(R)$ on the left and the line bends; tests of z-ROC curvature are how threshold-like and dual-process accounts of memory are confronted with data.`,
      caption: String.raw`Widen the signal distribution with $\sigma_S$: the ROC (middle) leans away from the dotted line it was symmetric about, while the z-ROC (right) stays straight with slope $1/\sigma_S$. The points come from a simulated rating experiment with five criteria (seeded); the gold line is the maximum-likelihood binormal fit to them (2.7), straight on z-coordinates, and the faint dashed line has slope 1. Set $\sigma_S$ = 1.25 for the typical recognition-memory slope of 0.8. Switch the **signal trials** so that 40% of them are **detected outright** (always rated “sure yes”, as in dual-process models of recognition memory): the ROC no longer starts at the origin and the z-ROC bends away from the straight fit.`,
      deps: ['psych-2.7'],
      refs: ['M&C ch. 3'],
      tags: ['ROC', 'unequal variance'],
      credit: 'Egan, 1958 (recognition memory); Ratcliff, Sheu & Gronlund, 1992',
      scope: String.raw`Holds when both kinds of trial give Gaussian evidence on some common scale (any increasing transformation of the evidence is allowed): a good description of most detection and recognition-memory ROCs. It fails when some trials are detected outright or answered by pure guessing (threshold components), which bend the z-ROC.`,
      viz(v) {
        const M = v.M, NMAX = 3000, BND = [-0.6, 0.2, 0.9, 1.6, 2.4], MIX = 0.4, LO = -3.4, HI = 7.4;
        const mS = v.slider('signal mean $\\mu$', 0, 3.5, 1.5, { step: 0.01 });
        const sS = v.slider('signal SD $\\sigma_S$', 0.5, 2.5, 1.25, { step: 0.01 });
        const shape = v.select('signal trials', [{ value: 'g', label: 'all Gaussian' }, { value: 'mix', label: '40% detected outright' }], 'g');
        const nT = v.slider('trials per type', 50, NMAX, 2000, { int: true, log: true });
        let seed = 86, Z = null, zSeed = -1, fit = null, fKey = '';
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const ev = v.stage({ x: [LO, HI], y: [-0.075, 0.47], height: 280, axes: 'box', weight: 1.1, xlabel: 'evidence $x$', yticks: [], title: 'the two distributions and five criteria' });
        const ro = v.stage({ ...ROCOPT, height: 280, weight: 0.85, minWidth: 220, title: 'ROC' });
        const zr = v.stage({ x: [-3, 2.6], y: [-2.4, 3.2], equal: true, height: 280, weight: 0.85, minWidth: 220, xlabel: '$z(F)$', ylabel: '$z(H)$', xticks: [-2, -1, 1, 2], yticks: [-2, -1, 1, 2], title: 'z-ROC' });
        const mix = () => shape.value === 'mix';
        const Hof = (k) => { const g = Phi(M, (mS.value - k) / sS.value); return mix() ? MIX + (1 - MIX) * g : g; };
        v.legend([['accent', 'model'], ['ink', 'simulated rating data, 95% intervals', { dot: true }], ['gold', 'maximum-likelihood binormal fit (a line on z-coordinates)'], ['muted', 'slope 1 (equal variances)', { dash: true }]]);
        let st = null;
        v.render(() => {
          if (zSeed !== seed) { const R = v.rng(seed); Z = { n: M.range(NMAX).map(() => R.normal()), s: M.range(NMAX).map(() => R.normal()), u: M.range(NMAX).map(() => R()), m: M.range(NMAX).map(() => R.normal()) }; zSeed = seed; }
          const mu = mS.value, sg = sS.value, n = nT.value, isMix = mix();
          const cat = (x) => { let r = 0; while (r < 5 && x > BND[r]) r++; return r; };
          const nC = new Array(6).fill(0), sC = new Array(6).fill(0);
          for (let i = 0; i < n; i++) { nC[cat(Z.n[i])]++; sC[isMix && Z.u[i] < MIX ? 5 : cat(mu + sg * Z.s[i])]++; }
          const pts = cumROC(nC, sC);
          // ---- distributions
          const fS = (x) => (isMix ? (1 - MIX) : 1) * phi((x - mu) / sg) / sg;
          for (const b of BND) ev.line(b, -0.075, b, 0.44, { color: 'purple', width: 1.2, alpha: 0.55, dash: [4, 3] });
          ev.fn((x) => phi(x), { domain: [LO, HI], color: 'muted', width: 2.2 });
          ev.fn(fS, { domain: [LO, HI], color: 'accent', width: 2.6, n: 300 });
          ev.text('noise', -1.2, phi(1.2), { dx: -6, align: 'right', color: 'muted', size: 12, weight: 600 });
          const xs = mu + 1.2 * sg; ev.text(isMix ? 'signal (60%)' : 'signal', xs, fS(xs), { dx: 6, dy: -4, align: 'left', color: 'accent', size: 12, weight: 600 });
          if (isMix) { ev.arrow(HI - 1.3, 0.12, HI - 0.25, 0.12, { color: 'accent', width: 2.2, head: 8 }); ev.text('40%: sure “yes”', HI - 0.2, 0.12, { dy: -12, align: 'right', color: 'accent', size: 11.5, weight: 700 }); }
          ev.text('criteria', BND[4], 0.44, { dx: 5, align: 'left', color: 'purple', size: 11 });
          // ---- ROC
          rocFrame(ro, M);
          ro.line(1, 0, 0, 1, { color: 'muted', dash: [1, 3], width: 1.2 });
          const curve = M.linspace(HI + 2, LO - 2, 260).map((k) => [Phi(M, -k), Hof(k)]);
          ro.path(curve, { color: 'accent', width: 2.4 });
          drawCum(ro, pts, { line: false, r: 4 });
          // ---- z-ROC
          zr.clip(() => zr.path(M.linspace(4, -4, 220).map((k) => { const H = Hof(k); return H > 1e-6 && H < 1 - 1e-6 ? [-k, zq(M, H)] : null; }), { color: 'accent', width: 2.4 }));
          const zp = pts.filter((p) => p.kF > 0 && p.kF < p.Nn && p.kH > 0 && p.kH < p.Ns).map((p) => [zq(M, p.F), zq(M, p.H), p]);
          const key = nC.join() + '|' + sC.join();
          if (key !== fKey) { fKey = key; fit = fitRating(M, nC, sC, { se: true }); }
          const L = fit ? { slope: 1 / fit.sig, intercept: fit.mu / fit.sig, predict: (x) => (fit.mu + x) / fit.sig } : null;
          const a0 = L ? L.predict(0) : mu / sg;
          zr.clip(() => zr.line(-3, a0 - 3, 3, a0 + 3, { color: 'muted', dash: [5, 4], width: 1.2 }));
          if (L) zr.clip(() => zr.line(-3, L.predict(-3), 3, L.predict(3), { color: 'gold', width: 2 }));
          for (const [x, y, p] of zp) {
            const sx = Math.sqrt((p.F * (1 - p.F)) / p.Nn) / phi(x), sy = Math.sqrt((p.H * (1 - p.H)) / p.Ns) / phi(y);
            zr.line(x - 1.96 * sx, y, x + 1.96 * sx, y, { color: 'ink', width: 1.1, alpha: 0.45 }); zr.line(x, y - 1.96 * sy, x, y + 1.96 * sy, { color: 'ink', width: 1.1, alpha: 0.45 });
            zr.dot(x, y, { r: 4, color: 'ink' });
          }
          // curvature: largest deviation of the points from the straight line, and the model's yes/no d′ at the strictest and laxest criteria
          let dev = NaN, pG = NaN; // goodness of fit of the binormal model: G² on 12 cells, 3 degrees of freedom
          if (fit) { const e = ratingProbs(M, fit), obs = [...nC, ...sC], ex = [...e.pN.map((q) => q * n), ...e.pS.map((q) => q * n)]; dev = 0; obs.forEach((o, i) => { if (o > 0) dev += 2 * o * Math.log(o / Math.max(1e-300, ex[i])); }); pG = 1 - M.dist.chi2(3).cdf(dev); }
          const dpr = (k) => zq(M, Hof(k)) - zq(M, Phi(M, -k));
          st = { mu, sg, L, dev, pG, d1: dpr(BND[4]), d5: dpr(BND[0]), isMix, n, fit };
        });
        v.readout(() => {
          if (!st) return '';
          const { mu, sg, L, dev, pG, d1, d5, isMix, n, fit } = st, da = mu * Math.sqrt(2 / (1 + sg * sg));
          const ci = fit && isFinite(fit.seLs) ? ` ± ${v.fix(1.96 * L.slope * fit.seLs, 3)}` : '';
          const fitTxt = L ? `maximum-likelihood binormal fit to ${n} + ${n} simulated trials: z-ROC slope ${v.fix(L.slope, 3)}${ci} (95%), intercept ${v.fix(L.intercept, 3)}; goodness of fit $G^2$ = ${v.fix(dev, 1)} on 3 degrees of freedom, p = ${pG < 0.001 ? '< 0.001' : v.fix(pG, 3)}${pG < 0.01 ? ' — the binormal line is rejected' : ''}` : 'too few trials for a fit';
          const model = isMix ? 'with 40% of signal trials detected outright the ROC starts at (0, 0.4) and the z-ROC is curved, so no single slope describes it' : `model slope $1/\\sigma_S$ = ${v.fix(1 / sg, 3)}, intercept $\\mu/\\sigma_S$ = ${v.fix(mu / sg, 3)}, $d_a$ = ${v.fix(da, 3)}, $A_z$ = ${v.fix(Phi(M, mu / Math.sqrt(1 + sg * sg)), 3)}`;
          return `${model} · ${fitTxt} · yes/no $z(H)-z(F)$ at the strictest criterion ${v.fix(d1, 2)}, at the laxest ${v.fix(d5, 2)}${Math.abs(d1 - d5) > 0.05 ? ': it depends on the criterion' : ': the same, as with equal variances'}`;
        });
      },
    },
  ],
};
