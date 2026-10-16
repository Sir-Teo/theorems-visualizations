// Psychology — Chapter 9, landmark paper: Ebbinghaus (1885).
//
// Data (verified):
// - Ebbinghaus, Über das Gedächtnis (1885), §§28–29, in the Ruger & Bussenius translation (1913) as transcribed at
//   psychclassics.yorku.ca (tables are page scans, read by eye): savings Q (% of original learning time) after
//   0.33, 1, 8.8, 24, 48, 6×24 and 31×24 hours = 58.2, 44.2, 35.8, 33.7, 27.8, 25.4, 21.1 with probable errors
//   1, 1, 1, 1.2, 1.4, 1.3, 0.8; his formula b = 100k/((log t)^c + k), t in minutes counted from one minute before
//   the end of learning (t = 20, 64, 526, 1440, 2880, 8640, 44640), k = 1.84, c = 1.25, and his calculated values
//   57.0, 46.7, 34.5, 30.4, 28.1, 24.9, 21.2. Recomputing the formula reproduces them to ±0.1.
// - Replication: Murre & Dros (2015), PLoS ONE 10(7): e0120644, Table 2: savings Q = (S1 − S2)/S1 for 10 lists
//   (9 at 9 h) per interval, one subject (Dros). The printed 6-day average reads "0"; the mean of its ten listed
//   values is 0.181, used here.

const EBB = { t: [20, 64, 526, 1440, 2880, 8640, 44640], b: [58.2, 44.2, 35.8, 33.7, 27.8, 25.4, 21.1], pe: [1, 1, 1, 1.2, 1.4, 1.3, 0.8], calc: [57.0, 46.7, 34.5, 30.4, 28.1, 24.9, 21.2], lab: ['20 min', '1 h', '8.8 h', '1 day', '2 days', '6 days', '31 days'] };
// Murre & Dros 2015, interval (minutes) and the per-list savings
const MD = [
  [20, [0.523, 0.342, 0.399, 0.560, 0.533, 0.259, 0.456, 0.499, 0.318, 0.325]],
  [60, [0.243, 0.257, 0.403, 0.397, 0.299, 0.337, 0.330, 0.344, 0.360, 0.358]],
  [540, [0.317, 0.242, 0.302, 0.361, 0.280, 0.264, 0.254, 0.252, 0.187]],
  [1440, [0.338, 0.280, 0.376, 0.216, 0.248, 0.289, 0.304, 0.411, 0.306, 0.356]],
  [2880, [0.301, 0.180, 0.190, 0.256, 0.180, 0.303, 0.238, 0.300, 0.233, 0.189]],
  [8640, [0.230, 0.028, 0.174, 0.106, 0.146, 0.089, 0.211, 0.178, 0.326, 0.325]],
  [44640, [0.068, 0.137, 0.136, -0.049, -0.067, 0.056, 0.039, 0.212, 0.154, 0.184]],
];
const ebbF = (t, k, c) => (100 * k) / (Math.log10(Math.max(t, 1.0001)) ** c + k);

function fitPower(M, ts, bs) { const r = M.linreg(ts.map(Math.log), bs.map(Math.log)); return { a: Math.exp(r.intercept), d: -r.slope }; }
function fitExp(M, ts, bs) { // b = A e^{-t/τ}, least squares on b via Nelder–Mead in (ln A, ln τ)
  const f = (p) => ts.reduce((s, t, i) => s + (bs[i] - Math.exp(p[0] - t / Math.exp(p[1]))) ** 2, 0);
  const r = M.nelderMead(f, [Math.log(50), Math.log(3000)], { maxIt: 3000 }); return { A: Math.exp(r.x[0]), tau: Math.exp(r.x[1]) };
}
function fitEbb(M, ts, bs) { const f = (p) => ts.reduce((s, t, i) => s + (bs[i] - ebbF(t, p[0], p[1])) ** 2, 0); const r = M.nelderMead(f, [1.84, 1.25], { maxIt: 3000 }); return { k: r.x[0], c: r.x[1] }; }
const rms = (ts, bs, g) => Math.sqrt(ts.reduce((s, t, i) => s + (bs[i] - g(t)) ** 2, 0) / ts.length);

export default {
  collection: 'psych',
  chapter: 9,
  items: [
    {
      num: '9.17',
      kind: 'Paper',
      name: 'Über das Gedächtnis',
      paper: { authors: 'Hermann Ebbinghaus', year: 1885, title: 'Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie', venue: 'Leipzig: Duncker & Humblot', url: 'https://archive.org/details/berdasgedcht00ebbi' },
      introduces: ['psych-9.8', 'psych-9.10'],
      statement: String.raw`Memorising lists of 13 nonsense syllables to a criterion of two error-free recitations and relearning them after a delay, Ebbinghaus measured retention by the **savings** in relearning time,
$$b = 100\,\frac{L - W\!L}{L}\ \%,$$
and found that forgetting is fast at first and then ever slower: 58% of the work was saved after 20 minutes, 44% after an hour, about a third after a day and still a fifth after a month. All seven values fit $b = 100k/((\log t)^c + k)$ with $k = 1.84$, $c = 1.25$ ($t$ in minutes).

In modern terms this is the forgetting curve (psych-9.8), close to a power law $b \propto t^{-d}$ rather than an exponential, measured by the method of savings (psych-9.10). The scope is narrow, as he stressed himself: one subject (himself), one kind of material, one learning criterion; the shape, not the constants, is what generalises.`,
      idea: String.raw`Before Ebbinghaus, memory was studied by introspection and anecdote. He invented a controlled material (about 2,300 consonant–vowel–consonant syllables, chosen to be free of meaning), a fixed procedure (read the list at 150 beats per minute until it could be recited twice without error) and a quantity that is still positive when nothing can be recalled: the time saved on relearning. Over 163 double tests in 1879–80 he learned 8 lists per test and relearned them after one of seven delays, and found the curve that bears his name, together with the probable errors that showed it was not noise. The book made higher mental processes a subject for experiment and statistics. The curve has been replicated many times, most closely by Murre and Dros (2015), who repeated his procedure for 70 hours with one subject; its power-law shape (Wixted and Ebbesen 1991) and the bump at one day, which Ebbinghaus himself suspected, are still discussed in terms of consolidation during sleep.`,
      caption: String.raw`Ebbinghaus's seven savings with their probable errors (blue, his §28 table), his formula (green, drag $k$ and $c$; the defaults are his) and a fitted **power law** or **exponential** for comparison. Switch the time axis between **log** and **linear** time: on a linear axis the curve looks like a sudden drop, on a log axis it is almost straight. **Replication** overlays Murre and Dros (2015): ten lists per delay (dots) and their means (red squares). **Click** in the plot to add your own savings point (e.g. from learning a list yourself); **Clear** removes them.`,
      deps: [],
      refs: [],
      tags: ['memory', 'forgetting', 'history'],
      credit: 'Hermann Ebbinghaus, 1885',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Forgetting_curve' },
      viz(v) {
        const M = v.M;
        const axis = v.select('time axis', [{ value: 'log', label: 'log time' }, { value: 'lin', label: 'linear time' }], 'log');
        const model = v.select('compare with', [{ value: 'pow', label: 'power law' }, { value: 'exp', label: 'exponential' }, { value: 'none', label: 'nothing' }], 'pow');
        const rep = v.toggle('replication (Murre & Dros 2015)', true);
        const kS = v.slider('$k$', 0.5, 4, 1.84, { step: 0.01 });
        const cS = v.slider('$c$', 0.5, 2.5, 1.25, { step: 0.01 });
        let mine = [];
        v.button('Clear my points', () => { mine = []; });
        const pw = fitPower(M, EBB.t, EBB.b), ex = fitExp(M, EBB.t, EBB.b), best = fitEbb(M, EBB.t, EBB.b);
        const mdMean = MD.map(([t, q]) => [t, (100 * q.reduce((a, b) => a + b, 0)) / q.length]);
        const s = v.stage({ x: [8, 110000], xlog: true, y: [-10, 102], axes: 'box', gutter: true, height: 380, full: true, xlabel: 'time since learning', ylabel: 'savings in relearning (%)', xticks: [[20, '20 min'], [60, '1 h'], [480, '8 h'], [1440, '1 day'], [10080, '1 week'], [43200, '1 month']], title: 'the forgetting curve' });
        s.onClick((x, y) => { if (y > -5 && y < 100) mine.push([x, y]); v.invalidate(); });
        let st = null;
        v.render(() => {
          const lin = axis.value === 'lin';
          if (lin) s.setScale({ xlog: false, x: [-1500, 48500] }); else s.setScale({ xlog: true, x: [8, 110000] });
          s.setTicks(lin ? [[0, '0'], [10080, '1 wk'], [20160, '2 wk'], [30240, '3 wk'], [44640, '31 d']] : [[20, '20 min'], [60, '1 h'], [480, '8 h'], [1440, '1 day'], [10080, '1 week'], [43200, '1 month']], undefined);
          s.hline(0, { color: 'faint', width: 1 });
          s.hline(100, { color: 'faint', width: 1, dash: [3, 4] });
          const dom = lin ? [1.05, 48500] : [1.05, 110000];
          if (model.value === 'pow') s.fn((t) => pw.a * t ** -pw.d, { color: 'purple', width: 2, dash: [7, 5], domain: [5, dom[1]] });
          if (model.value === 'exp') s.fn((t) => ex.A * Math.exp(-t / ex.tau), { color: 'red', width: 2, dash: [7, 5], domain: [0, dom[1]] });
          s.fn((t) => ebbF(t, kS.value, cS.value), { color: 'green', width: 2.6, domain: dom, n: 400 });
          if (rep.value) {
            MD.forEach(([t, q], j) => q.forEach((x, i) => s.dot(t * (1 + (lin ? 0 : 0.035 * (i - 4.5))), 100 * x, { r: 2.6, color: 'red', alpha: 0.45 })));
            for (const [t, b] of mdMean) s.rect(lin ? t - 250 : t * 0.93, b - 1.4, lin ? t + 250 : t * 1.075, b + 1.4, { fill: 'red', fillAlpha: 0.9, color: 'red' });
          }
          EBB.t.forEach((t, i) => {
            s.line(t, EBB.b[i] - 2 * EBB.pe[i], t, EBB.b[i] + 2 * EBB.pe[i], { color: 'blue', width: 2 });
            s.dot(t, EBB.b[i], { r: 5.5, color: 'blue' });
            if (!lin || i >= 3) s.text(EBB.lab[i], t, EBB.b[i] + 2 * EBB.pe[i], { dy: -9, size: 11, color: 'blue', weight: 600 });
          });
          for (const [x, y] of mine) s.dot(x, y, { r: 6, color: 'gold' });
          const g = (t) => ebbF(t, kS.value, cS.value);
          st = { rE: rms(EBB.t, EBB.b, g), rP: rms(EBB.t, EBB.b, (t) => pw.a * t ** -pw.d), rX: rms(EBB.t, EBB.b, (t) => ex.A * Math.exp(-t / ex.tau)), g };
        });
        v.legend([['blue', 'Ebbinghaus 1885 (±2 P.E.)', { dot: true }], ['green', 'his formula'], ['purple', 'power law', { dash: true }], ['red', 'exponential / replication', { dash: true }], ['gold', 'your points', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const calc = EBB.t.map((t) => v.fix(st.g(t), 1)).join(', ');
          return `formula with $k = ${v.fix(kS.value, 2)}$, $c = ${v.fix(cS.value, 2)}$: ${calc} (his printed values 57.0, 46.7, 34.5, 30.4, 28.1, 24.9, 21.2; observed 58.2, 44.2, 35.8, 33.7, 27.8, 25.4, 21.1) · rms error **${v.fix(st.rE, 2)}** points\n` +
            `power law $b = ${v.fix(pw.a, 1)}\\,t^{-${v.fix(pw.d, 3)}}$: rms ${v.fix(st.rP, 2)} · best exponential (τ = ${v.fix(ex.tau / 1440, 1)} days): rms **${v.fix(st.rX, 1)}** — no single exponential bends enough · least-squares $k = ${v.fix(best.k, 2)}$, $c = ${v.fix(best.c, 2)}$ (his were “approximate estimates”) · Murre & Dros 2015 means: ${mdMean.map(([, b]) => v.fix(b, 0)).join(', ')}%`;
        });
      },
    },
  ],
};
