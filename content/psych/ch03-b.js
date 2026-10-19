// Psychology & Perception — Chapter 3: Scaling sensation (items 3.6–3.10; 3.1–3.5 are in ch03.js)
import { relativeToneGains } from './verification-models.js';
import { Phi, zq, logTicks, sig } from './ch03.shared.js';

export default {
  collection: 'psych',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Method',
      name: 'Category scaling and range–frequency effects',
      statement: String.raw`In **category scaling** (rating) the observer assigns each stimulus to one of a small number of ordered categories (1 to 7, say) according to how large it seems. The resulting ratings are not a function of the stimulus alone but of the *set of stimuli* presented. The **range–frequency model** says that a stimulus $s$ in a context with smallest and largest values $s_{\min},s_{\max}$ gets the judgment
$$J(s)=w\,R(s)+(1-w)\,F(s),\qquad R(s)=\frac{s-s_{\min}}{s_{\max}-s_{\min}},\quad F(s)=\text{fraction of the context stimuli below }s,$$
and the rating is $J$ mapped onto the category scale (here $1+6J$). The **range value** $R$ places $s$ within the context's range; the **frequency value** $F$ is its percentile rank. The weight $w\in[0,1]$ is fitted to data and depends on the task. In a context crowded with small stimuli, the same medium stimulus has a higher percentile rank and so gets a *higher* rating than in a context crowded with large ones.`,
      idea: String.raw`Category ratings lack the anchor that a standard and a ratio instruction give magnitude estimation (3.1): the observer must spread a fixed number of categories over whatever stimuli appear. Two natural strategies are to divide the range into equal subranges and to use each category equally often; the model says that people compromise between them. Because $F$ depends on the distribution of the context, any rating experiment confounds the stimulus with its context: skewing the distribution is the simplest way to shift the ratings of an unchanged stimulus (and, in everyday terms, why a fixed salary or a fixed temperature feels different depending on the company it is judged in).`,
      caption: String.raw`Three contexts, each made of the same 21 stimuli between 1 and 10 (the squares' side, in arbitrary units): many **small** squares (skewed), evenly spaced (**uniform**), and many **large**. Drag the **gold** handle to choose a test stimulus: the **right** panel shows the 1–7 rating it would get in each context. With the range weight $w=1$ the three curves coincide (a pure range rule); with $w=0$ the ratings follow only the percentile rank and differ most. The curves are the model's predictions for chosen contexts, not data.`,
      deps: ['psych-3.1'],
      refs: ['Gescheider ch. 10'],
      tags: ['category scaling', 'context effects', 'range–frequency'],
      credit: 'A. Parducci, “Category judgment: a range-frequency model”, Psychological Review 72 (1965): 407–418',
      scope: String.raw`A descriptive model of category ratings of a single dimension with a fixed stimulus set; the weight $w$ is fitted, varies with the task and instructions, and the model says nothing about judgments of an isolated stimulus. The qualitative effect (ratings follow the skew of the context) is the part most often reported; the exact weights depend on the study.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Range%E2%80%93frequency_theory' },
      viz(v) {
        const M = v.M, NS = 21, LO = 1, HI = 10;
        const CTX = [
          { id: 'small', label: 'many small', c: 'orange', g: (u) => u * u },
          { id: 'unif', label: 'uniform', c: 'accent', g: (u) => u },
          { id: 'large', label: 'many large', c: 'green', g: (u) => 1 - (1 - u) * (1 - u) },
        ].map((c) => ({ ...c, xs: M.range(NS).map((k) => LO + (HI - LO) * c.g(k / (NS - 1))) }));
        const wSl = v.slider('range weight $w$', 0, 1, 0.5, { step: 0.01 });
        const st1 = v.stage({ x: [0.3, 10.7], y: [-0.2, 4.2], axes: false, height: 290, weight: 1, minWidth: 290, title: 'three contexts: the same range, different crowding' });
        const st2 = v.stage({ x: [1, 10], y: [1, 7], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 270, xlabel: 'test stimulus size', ylabel: 'rating (1–7)', yticks: [1, 2, 3, 4, 5, 6, 7], title: 'rating of the test stimulus in each context' });
        const hs = st1.handle(5.5, 3.75, { color: 'gold', r: 9, constrain: (x) => [M.clamp(x, LO, HI), 3.75] });
        const Fv = (c, s) => { const xs = c.xs; if (s <= xs[0]) return 0; if (s >= xs[NS - 1]) return 1; let k = 0; while (xs[k + 1] < s) k++; return (k + (s - xs[k]) / (xs[k + 1] - xs[k])) / (NS - 1); };
        const rate = (c, s, w) => 1 + 6 * (w * (s - LO) / (HI - LO) + (1 - w) * Fv(c, s));
        v.legend(CTX.map((c) => [c.c, c.label, { dot: true }]));
        let st = null;
        v.render(() => {
          const w = wSl.value, s = hs.x;
          CTX.forEach((c, i) => {
            const y = 2.7 - i * 1.15;
            st1.line(LO, y, HI, y, { color: 'grid', width: 1 });
            for (const x of c.xs) st1.dot(x, y, { r: 3.8, color: c.c, ring: false });
            st1.text(c.label, LO, y, { dy: 17, align: 'left', size: 11.5, color: c.c, weight: 700 });
          });
          st1.line(s, -0.1, s, 3.75, { color: 'gold', dash: [4, 3], width: 1.6 });
          st1.text('test stimulus  ' + v.fix(s, 1), s, 4.1, { align: 'center', size: 12, weight: 700, color: 'ink' });
          for (let k = 1; k <= 7; k++) st2.line(1, k, 10, k, { color: 'grid', width: 0.8 });
          for (const c of CTX) st2.fn((x) => rate(c, x, w), { domain: [LO, HI], color: c.c, width: 2.8, n: 220 });
          st2.line(s, 1, s, 7, { color: 'gold', dash: [4, 3], width: 1.4 });
          for (const c of CTX) st2.dot(s, rate(c, s, w), { r: 6, color: c.c });
          st = { s, w, r: CTX.map((c) => rate(c, s, w)) };
        });
        v.readout(() => st ? `Test size ${v.fix(st.s, 2)}, $w$ = ${v.fix(st.w, 2)}: rating ${v.fix(st.r[0], 2)} among many small, ${v.fix(st.r[1], 2)} among uniform, ${v.fix(st.r[2], 2)} among many large · context shifts the rating of the unchanged stimulus by up to ${v.fix(Math.max(...st.r) - Math.min(...st.r), 2)} categories (0 when $w=1$)` : '');
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Law',
      name: 'Thurstone’s law of comparative judgment',
      statement: String.raw`Suppose each of $m$ stimuli $i$ produces on each presentation a value of a “discriminal process” $x_i$, normally distributed with mean $S_i$ (the stimulus's position on the sensory scale) and standard deviation $\sigma_i$. In a paired comparison the observer says the stimulus with the larger momentary value is the “greater”. The **law of comparative judgment** gives the probability $p_{ij}=P(i\text{ judged greater than }j)$ through the normal quantile:
$$z_{ij}=\Phi^{-1}(p_{ij})=\frac{S_i-S_j}{\sqrt{\sigma_i^2+\sigma_j^2-2r_{ij}\sigma_i\sigma_j}} .$$
In **Case V**, the processes have equal spread and are uncorrelated, so $z_{ij}=(S_i-S_j)/(\sigma\sqrt2)$: the matrix of $z$ scores is a matrix of differences, and the scale values (up to origin and unit $\sigma\sqrt2$) are the row means $\bar z_i=\frac1m\sum_j z_{ij}=(S_i-\bar S)/(\sigma\sqrt2)$, with $z_{ii}=0$.`,
      idea: String.raw`It is the equal-variance Gaussian model of detection (psych-2.1) applied to two stimuli instead of signal and noise: the probability that $x_i>x_j$ is $\Phi$ of the mean difference over the standard deviation of the difference, so the z-transformed proportions are *linear* in the unknown scale values and a one-line average inverts them. The unit of the scale is the spread $\sigma$ of the noise itself, which is how the law turns proportions of choices (ordinal data) into an interval scale. Proportions of 0 or 1 give infinite $z$ and must be adjusted or dropped, which is why the stimuli must be close enough to be confusable.`,
      caption: String.raw`Five stimuli (think of lifted weights) with true positions $S_i$ on the sensory scale, each drawn as its bell curve of momentary values. Drag the **handles** to move the stimuli and the **noise** slider to widen the curves. Each pair is compared $n$ times by a simulated observer: the **table** shows the proportion of trials on which the row stimulus was judged greater, and the **scatter** plots the scale values recovered from the $z$ scores (Case V) against the true ones; they fall on the diagonal, closer for more trials. *New judgments* resamples. Simulated data.`,
      deps: ['psych-2.1'],
      refs: ['Gescheider ch. 9'],
      tags: ['Thurstone', 'paired comparison', 'scaling'],
      credit: 'L. L. Thurstone, “A law of comparative judgment”, Psychological Review 34 (1927): 273–286',
      scope: String.raw`Holds for the stated Gaussian model; Case V assumes equal discriminal dispersions and no correlation between the processes. Proportions near 0 or 1 give unstable $z$ scores. Real judgments often violate transitivity or equal dispersions (cases I–IV relax this), and the law fits choice proportions without saying that the scale measures a unit of sensation.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_comparative_judgment' },
      viz(v) {
        const M = v.M, NI = 5, NAME = 'ABCDE', COL = ['accent', 'orange', 'green', 'purple', 'red'];
        let seed = 12, TR = null, tKey = '';
        const sg = v.slider('noise $\\sigma$', 0.3, 2, 0.8, { step: 0.05 });
        const nn = v.slider('judgments per pair $n$', 5, 400, 60, { step: 1, int: true });
        v.button('New judgments', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const sc = v.stage({ x: [0, 7], y: [-0.18, 0.56], axes: 'box', gutter: true, height: 250, weight: 1, minWidth: 320, full: true, xlabel: 'sensory scale (true positions $S_i$)', yticks: [], title: 'the discriminal processes' });
        const tb = v.stage({ x: [-0.2, 6.2], y: [-0.2, 6.4], axes: false, height: 300, weight: 1, minWidth: 260, title: 'proportion judged greater: row over column' });
        const sp = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: 'box', gutter: true, height: 300, weight: 0.9, minWidth: 260, xlabel: 'true scale value $(S_i-\\bar S)/(\\sigma\\sqrt2)$', ylabel: 'recovered $\\bar z_i$', title: 'Case V recovers the scale' });
        const S0 = [1.0, 2.1, 2.7, 4.2, 5.8];
        const H = S0.map((s, i) => sc.handle(s, 0.0, { color: COL[i], r: 8, label: NAME[i], constrain: (x) => [M.clamp(x, 0.3, 6.7), 0] }));
        const cnt = (S, s, n) => {
          const key = seed + '|' + n; if (key !== tKey) { const R = v.rng(seed); TR = []; for (let i = 0; i < NI; i++) { TR.push([]); for (let j = 0; j < NI; j++) TR[i].push(j > i ? M.range(400).map(() => [R.normal(), R.normal()]) : null); } tKey = key; }
          const P = M.zeros(NI, NI);
          for (let i = 0; i < NI; i++) for (let j = i + 1; j < NI; j++) { let k = 0; for (let t = 0; t < n; t++) { const [a, b] = TR[i][j][t]; if (S[i] + s * a > S[j] + s * b) k++; } P[i][j] = k; P[j][i] = n - k; }
          return P;
        };
        v.legend([['accent', 'recovered scale value', { dot: true }], ['muted', 'perfect recovery', { dash: true }]]);
        let st = null;
        v.render(() => {
          const s = sg.value, n = nn.value, S = H.map((h) => h.x), Sb = M.mean(S), P = cnt(S, s, n);
          const dens = (x, mu) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
          const top = Math.max(...S.map((m) => dens(m, m)));
          sc.setView([0, 7], [-0.14 * top, top * 1.12]);
          S.forEach((m, i) => { sc.fn((x) => dens(x, m), { domain: [0, 7], color: COL[i], width: 2.2, n: 160, fill: true }); sc.line(m, 0, m, dens(m, m), { color: COL[i], dash: [3, 3], width: 1 }); });
          // table
          const x0 = 0.6, y0 = 5.2, cw = 1.1, ch = 0.95;
          for (let j = 0; j < NI; j++) tb.text(NAME[j], x0 + (j + 0.5) * cw, y0 + 0.6, { align: 'center', size: 13, weight: 700, color: COL[j] });
          const z = M.zeros(NI, NI);
          for (let i = 0; i < NI; i++) {
            tb.text(NAME[i], x0 - 0.3, y0 - (i + 0.5) * ch, { align: 'center', size: 13, weight: 700, color: COL[i] });
            for (let j = 0; j < NI; j++) {
              const cx = x0 + j * cw, cy = y0 - (i + 1) * ch, pr = i === j ? 0.5 : P[i][j] / n;
              tb.rect(cx + 0.03, cy + 0.03, cx + cw - 0.03, cy + ch - 0.03, { fill: i === j ? 'faint' : 'accent', fillAlpha: i === j ? 0.1 : 0.08 + 0.55 * pr, stroke: false });
              tb.text(i === j ? '—' : pr.toFixed(2).replace(/^0/, ''), cx + cw / 2, cy + ch / 2, { align: 'center', size: 13, weight: 600, color: i === j ? 'muted' : 'ink' });
              z[i][j] = i === j ? 0 : zq(M, (P[i][j] + 0.5) / (n + 1));
            }
          }
          // recovered scale
          const est = z.map((r) => M.mean(r)), tru = S.map((x) => (x - Sb) / (s * Math.SQRT2));
          sp.setView([-1.5, 1.5], [-1.5, 1.5]);
          sp.line(-1.5, -1.5, 1.5, 1.5, { color: 'muted', dash: [5, 4], width: 1.4 });
          const lim = Math.max(1.5, ...tru.map(Math.abs), ...est.map(Math.abs)) * 1.05; sp.setView([-lim, lim], [-lim, lim]);
          est.forEach((e, i) => { sp.dot(tru[i], e, { r: 7, color: COL[i], label: NAME[i], labelPos: 'ne' }); });
          const rms = Math.sqrt(M.mean(est.map((e, i) => (e - tru[i]) ** 2)));
          st = { rms, n, s, nTot: n * 10 };
        });
        v.readout(() => st ? `${st.n} judgments × 10 pairs = ${st.nTot} trials · root-mean-square error of the recovered scale values: ${v.fix(st.rms, 3)} (in units of $\\sigma\\sqrt2$) · the table's proportions are $\\Phi$ of scale differences, e.g. a pair $1\\sigma\\sqrt2$ apart is judged correctly ${(100 * Phi(M, 1)).toFixed(0)}% of the time` : '');
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Principle',
      name: 'Luce’s choice axiom (Bradley–Terry–Luce)',
      statement: String.raw`**Luce's choice axiom** says that the odds of choosing $i$ over $j$ do not depend on what other options are available: if $P(i\mid S)$ is the probability of choosing $i$ from the set $S$, then for $i,j\in S\subseteq T$,
$$\frac{P(i\mid S)}{P(j\mid S)}=\frac{P(i\mid T)}{P(j\mid T)} .$$
When every pairwise choice probability is strictly between0and1, this is equivalent to the existence of positive **strengths** $v_i$ with
$$P(i\mid S)=\frac{v_i}{\sum_{k\in S}v_k}.$$
For two options this is the **Bradley–Terry–Luce** model of paired comparison, $P(i\succ j)=v_i/(v_i+v_j)$. It implies independence from irrelevant alternatives: adding an option removes probability from every other option *in proportion to its strength*. Real choices break this when options are similar.`,
      idea: String.raw`Each option is assigned a single number and choosing is a lottery weighted by those numbers, so removing or adding an option can only renormalise. That is what makes the model easy to fit (strengths are estimated from pairwise counts, as in rating players of a game) and it is the same shape as Thurstone's Case V (3.7) with a logistic instead of a normal curve for the pairwise probabilities. The bus-color variant discussed in Luce’s own2008 exposition shows a possible violation of IIA: if a car and a red bus are chosen equally often, adding a blue bus that is just a recolouring of the red bus should leave the car at one half, but the axiom assigns one third to each option. This bus variant should not be attributed literally to Debreu’s different1960 example.`,
      caption: String.raw`Drag the **bar tops** to set the strengths $v_A,\dots,v_D$, and use the switches to decide which options are on offer. The right panel shows the choice probabilities; the small rings mark each option's probability when only $A$ and $B$ were offered. Under **Luce's axiom** the ratio $P(A)/P(B)$ stays equal to $v_A/v_B$ whatever else is offered. Switch on *C is a near-copy of B* (a blue bus next to a red one, $v_C$ locked to $v_B$) and change the model to **copies count once**: a simple model of our own where near-identical options form a group whose strength is that of its strongest member; now adding $C$ leaves $A$'s probability where it was and splits $B$'s between the two copies, so the ratio $P(A)/P(B)$ changes. Illustrative models, not experimental data.`,
      deps: ['psych-3.7'],
      refs: ['Gescheider ch. 9'],
      tags: ['choice axiom', 'Bradley–Terry', 'IIA'],
      credit: 'R. Duncan Luce,1959; complete author exposition, “Luce’s choice axiom”, Scholarpedia3(12):8077(2008), equations4 and7',
      scope: String.raw`An exact statement about choice probabilities when the axiom holds; similarity, decoy and compromise effects can violate it. Whether it fits a particular set of options is an empirical question, not guaranteed by dissimilarity alone.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Independence_of_irrelevant_alternatives' },
      viz(v) {
        const M = v.M, NAME = 'ABCD', COL = ['accent', 'orange', 'green', 'purple'], V0 = [4, 3, 3, 1];
        const tg = NAME.split('').map((n, i) => v.toggle('offer ' + n, i < 3));
        const copy = v.toggle('C is a near-copy of B', true);
        const model = v.select('model', [{ value: 'luce', label: 'Luce’s axiom' }, { value: 'nest', label: 'copies count once' }], 'luce');
        const sv = v.stage({ x: [0, 4], y: [0, 10], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 260, xticks: [[0.5, 'A'], [1.5, 'B'], [2.5, 'C'], [3.5, 'D']], ylabel: 'strength $v_i$', title: 'strengths (drag the bar tops)' });
        const pb = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 260, xticks: [[0.5, 'A'], [1.5, 'B'], [2.5, 'C'], [3.5, 'D']], ylabel: 'choice probability', title: 'probability of choosing each offered option' });
        const H = V0.map((x, i) => sv.handle(i + 0.5, x, { color: COL[i], r: 8, constrain: (xx, y) => [i + 0.5, M.clamp(y, 0.3, 10)] }));
        v.legend([['muted', '$P(\\cdot\\mid\\{A,B\\})$', { dot: true }]]);
        let st = null;
        const probs = (vs, inc, mod, cp) => {
          const P = [0, 0, 0, 0], idx = [0, 1, 2, 3].filter((i) => inc[i]);
          if (mod === 'luce' || !(cp && inc[1] && inc[2])) { const T = M.sum(idx.map((i) => vs[i])); idx.forEach((i) => { P[i] = vs[i] / T; }); return P; }
          const grp = [[0], [1, 2], [3]].map((g) => g.filter((i) => inc[i])).filter((g) => g.length), gs = grp.map((g) => Math.max(...g.map((i) => vs[i]))), T = M.sum(gs);
          grp.forEach((g, k) => { const tt = M.sum(g.map((i) => vs[i])); g.forEach((i) => { P[i] = (gs[k] / T) * (vs[i] / tt); }); });
          return P;
        };
        v.render(() => {
          if (copy.value) H[2].set(2.5, H[1].y);
          const vs = H.map((h) => h.y), inc = tg.map((t) => !!t.value), cp = copy.value, mod = model.value;
          vs.forEach((x, i) => { sv.rect(i + 0.15, 0, i + 0.85, x, { fill: COL[i], fillAlpha: inc[i] ? 0.38 : 0.1, color: COL[i], width: inc[i] ? 1.8 : 0.8 }); });
          const P = probs(vs, inc, mod, cp), P2 = probs(vs, [true, true, false, false], mod, cp);
          for (let i = 0; i < 4; i++) if (inc[i]) {
            pb.rect(i + 0.15, 0, i + 0.85, P[i], { fill: COL[i], fillAlpha: 0.45, color: COL[i], width: 1.8 });
            pb.text(P[i].toFixed(2), i + 0.5, Math.max(P[i], i < 2 && (inc[2] || inc[3]) ? P2[i] : 0), { dy: -16, align: 'center', size: 12, weight: 700, color: COL[i] });
          } else pb.text('not offered', i + 0.5, 0.04, { align: 'center', size: 10.5, color: 'muted' });
          for (const i of [0, 1]) if (inc[2] || inc[3]) pb.dot(i + 0.5, P2[i], { r: 6, color: 'muted', hollow: true, width: 2 });
          st = { vs, inc, P, P2, mod, cp };
        });
        v.readout(() => {
          if (!st) return '';
          const { vs, inc, P, P2 } = st;
          if (!(inc[0] && inc[1])) return 'Offer both $A$ and $B$ to compare their choice odds.';
          const r = P[0] / P[1], r2 = P2[0] / P2[1], extra = inc[2] || inc[3];
          return `Strengths: ${vs.map((x, i) => 'ABCD'[i] + '=' + v.fix(x, 1)).join(', ')} · $P(A)/P(B)$ = ${v.fix(r, 3)} in this set, ${v.fix(r2, 3)} in $\\{A,B\\}$, $v_A/v_B$ = ${v.fix(vs[0] / vs[1], 3)} · ${extra ? (Math.abs(r - r2) < 1e-9 ? 'the odds are unchanged: independence of irrelevant alternatives holds' : 'the odds changed when options were added: the choice axiom fails in this model') : 'only $A$ and $B$ on offer'} · pairwise (Bradley–Terry) $P(A\\succ B)$ = ${v.fix(vs[0] / (vs[0] + vs[1]), 3)}${inc[2] && st.cp ? ` · $P(\\text{car }A)$ = ${v.fix(P[0], 3)} with the copy, vs ${v.fix(P2[0], 3)} without it` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Law',
      name: 'Loudness in sones: doubling per 10 dB',
      statement: String.raw`The **sone** is the unit of perceived loudness, defined so that a 1 kHz tone at a loudness level of 40 phon (40 dB SPL for that tone) has loudness 1 sone. Above about 40 phon, loudness $N$ in sones doubles with every 10 dB increase in level $L$:
$$N=2^{(L-40)/10}\quad(L\gtrsim40),$$
equivalently $N\propto I^{\,0.3}$ in sound *intensity* $I$ (since $10$ dB is a factor $10$ in intensity and $10^{0.301}=2$), or about $p^{0.6}$ in sound pressure. A tone that is $\Delta$ dB louder than another therefore sounds $2^{\Delta/10}$ times as loud. Below 40 phon loudness falls off faster than this rule says.`,
      idea: String.raw`The sone scale is Stevens' power law (3.2) for loudness, with an exponent near $0.3$ for intensity (about $0.6$–$0.67$ for pressure in Stevens' table) found by magnitude estimation (3.1) and by fractionation (“set a tone half as loud as this one”). The level in decibels is itself a log of intensity, so a power law in intensity is a straight line in dB on a log-loudness axis: the “10 dB per doubling” is just $10\log_{10}2/0.3$. The exponent in dB terms is $3.01/m$ for an intensity exponent $m$. Equal-loudness contours (music-1.9) say how level and frequency map to phons; the sone then maps phons to a ratio scale.`,
      caption: String.raw`**Left:** loudness in sones (log axis) against the level of a 1 kHz tone; drag the **gold** handle for the level $L$ of the first tone. The **dashed** continuation is the doubling rule extended below 40 phon, where it is not valid; the solid curve there is an illustrative steeper extension, unverified against the ISO loudness standard. **Right:** the loudness ratio produced by $\Delta$ dB of extra level, for the intensity exponent $m$ you choose. Use *Hear L, then L+Δ* to judge for yourself whether $10$ dB sounds twice as loud (your device volume sets the absolute level; the electronic amplitude ratio is set by the level-difference slider; your playback system is not calibrated to the displayed absolute SPL). Estimates of how many dB make a doubling vary between studies and listeners.`,
      deps: ['psych-3.2', 'music-1.9'],
      refs: ['Goldstein ch. 11'],
      tags: ['loudness', 'sone', 'psychoacoustics'],
      credit: 'S. S. Stevens, “A scale for the measurement of a psychological magnitude: loudness”, Psychological Review 43 (1936): 405–416 (the sone); Stevens 1956, 1957 (the power-law exponent)',
      scope: String.raw`For a 1 kHz tone (or loudness level in phons for other tones, via equal-loudness contours) between about 40 and 100 dB; the doubling interval found in experiments depends on the method and listener (about 10 dB is the classical figure, smaller values have also been reported), and below 40 phon the sone scale is steeper; complex sounds need a loudness model.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sone' },
      viz(v) {
        const M = v.M;
        const dl = v.slider('extra level $\\Delta$ (dB)', 1, 30, 10, { step: 0.5, fmt: (x) => x.toFixed(1) + ' dB' });
        const mSl = v.slider('intensity exponent $m$', 0.2, 0.5, 0.301, { step: 0.001 });
        const exact = v.toggle('apply the illustrative below-40 phon extension', true);
        const N = (L, m, below) => (L >= 40 ? Math.pow(10, (m * (L - 40)) / 10) : below ? Math.max(1e-3, Math.pow(L / 40, 2.86) - 0.005) : Math.pow(10, (m * (L - 40)) / 10));
        const s1 = v.stage({ x: [10, 100], y: [-2.3, 2.2], axes: 'box', gutter: true, height: 320, weight: 1.1, minWidth: 290, xlabel: 'level of a 1 kHz tone $L$ (dB SPL = phon)', ylabel: 'loudness (sones)', yticks: logTicks(-2.3, 2.2, { mult: [1] }), title: 'loudness against level' });
        const s2 = v.stage({ x: [0, 30], y: [0, 9], axes: 'box', gutter: true, height: 320, weight: 0.9, minWidth: 250, xlabel: 'level difference $\\Delta$ (dB)', ylabel: 'loudness ratio', title: 'how many times as loud?' });
        const hL = s1.handle(50, 0, { color: 'gold', r: 8, constrain: (x) => [M.clamp(x, 12, 100-dl.value), 0] });
        v.soundButton('Hear two tones $\\Delta$ dB apart', (snd) => { const [g0,g1]=relativeToneGains(dl.value); snd.tone(1000, { duration: 1, gain: g0 }); snd.tone(1000, { duration: 1, gain: g1, delay: 1.5 }); });
        v.legend([['accent', 'sones'], ['muted', 'doubling rule extended', { dash: true }], ['gold', 'chosen levels', { dot: true }]]);
        let st = null;
        v.render(() => {
          const m = mSl.value, D = dl.value, L = Math.min(hL.x,100-D), b = exact.value, f = (x) => Math.log10(N(x, m, b));
          s1.setView([10,100],[-2.3,Math.max(2.2,f(100)+.2)]);
          s2.setView([0,30],[0,Math.max(9,Math.pow(10,m*3)*1.12)]);
          s1.fn(f, { domain: [10, 100], color: 'accent', width: 3, n: 220 });
          s1.fn((x) => Math.log10(N(x, m, false)), { domain: [10, 40], color: 'muted', width: 1.6, n: 40, dash: [5, 4] });
          s1.line(40, -2.3, 40, 0, { color: 'faint', dash: [2, 3] }); s1.text('1 sone at 40 phon', 39, -2.0, { align: 'right', size: 11, color: 'muted' });
          hL.set(L, f(L));
          const L2 = L + D;
          s1.line(L, -2.3, L, f(L), { color: 'gold', dash: [3, 3] }); s1.line(L2, -2.3, L2, f(L2), { color: 'gold', dash: [3, 3] });
          s1.dot(L, f(L), { r: 5.5, color: 'gold' }); s1.dot(L2, f(L2), { r: 5.5, color: 'gold' });
          s1.text(sig(N(L, m, b)) + ' sone', L, f(L), { dx: -10, dy: -10, align: 'right', size: 11.5, weight: 700, color: 'ink' });
          s1.text(sig(N(L2, m, b)) + ' sone', L2, f(L2), { dx: -10, dy: -10, align: 'right', size: 11.5, weight: 700, color: 'ink' });
          s2.fn((x) => Math.pow(10, (m * x) / 10), { domain: [0, 30], color: 'accent', width: 2.8, n: 120 });
          s2.fn((x) => Math.pow(2, x / 10), { domain: [0, 30], color: 'muted', width: 1.4, dash: [5, 4], n: 60 });
          s2.line(0, 2, 3.01 / m, 2, { color: 'green', dash: [3, 3] }); s2.line(3.01 / m, 0, 3.01 / m, 2, { color: 'green', dash: [3, 3] });
          s2.text('doubling at ' + v.fix(3.01 / m, 1) + ' dB', 3.01 / m, 2, { dx: 8, dy: -10, align: 'left', size: 11.5, color: 'green', weight: 700 });
          s2.dot(D, Math.pow(10, (m * D) / 10), { r: 6, color: 'gold' });
          st = { m, D, L, L2, ratio: Math.pow(10, (m * D) / 10), r2: N(L2, m, b) / N(L, m, b), N1: N(L, m, b), N2: N(L2, m, b) };
        });
        v.readout(() => st ? `$L$ = ${v.fix(st.L, 1)} dB → ${sig(st.N1)} sone; $L+\\Delta$ = ${v.fix(st.L2, 1)} dB → ${sig(st.N2)} sone (ratio ${v.fix(st.r2, 2)}) · rule: $10^{m\\Delta/10}$ = ${v.fix(st.ratio, 2)}, equal to $2^{\\Delta/10}$ = ${v.fix(Math.pow(2, st.D / 10), 2)} when $m=0.301$ · loudness doubles every ${v.fix(3.01 / st.m, 1)} dB for this $m$` : '');
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Method',
      name: 'Multidimensional scaling of similarity',
      statement: String.raw`**Multidimensional scaling (MDS)** takes judged dissimilarities $\delta_{ij}$ between $m$ stimuli and finds points $y_1,\dots,y_m$ in a low-dimensional space whose distances $d_{ij}=\lVert y_i-y_j\rVert$ reproduce them. In **classical (Torgerson) MDS**, with squared dissimilarities $\Delta^{(2)}=[\delta_{ij}^2]$ and the centring matrix $J=I-\frac1m\mathbf 1\mathbf 1^{\!\top}$, the matrix $B=-\tfrac12J\Delta^{(2)}J$ is symmetric; if the $\delta_{ij}$ are exact Euclidean distances between points, then $B=YY^{\!\top}$ and the coordinates are the top eigenvectors of $B$, scaled by the square roots of their eigenvalues. This page measures fit by a **normalized distance error**
$$s=\Big(\sum_{i<j}(\delta_{ij}-d_{ij})^2\Big/\sum_{i<j}\delta_{ij}^2\Big)^{1/2},$$
and plotting this error against dimension shows what is lost by keeping fewer dimensions. This normalization uses squared judged dissimilarities; it is not Kruskal’s nonmetric Stress1, whose denominator uses fitted distances. The solution is determined only up to rotation, reflection and shift.`,
      idea: String.raw`Squared distances determine inner products once the origin is moved to the centroid ($B$ is that double-centred matrix), so the real spectral theorem (ladr-7.29) supplies an orthonormal eigenbasis and a spectral decomposition recovers the configuration whenever one exists; noise in the judgments puts small eigenvalues on the “spurious” directions and the stress shows how much is lost by keeping the first few. The method grew out of Thurstone-style scaling (3.7), which turns choices into one-dimensional scale values; MDS turns *dissimilarity ratings* into a configuration in several dimensions, and the picture can reveal structure (a circle, clusters) that no single rating scale shows. Torgerson's 1952 paper gave the classical solution; later nonmetric versions (Shepard, Kruskal) use only the rank order of the dissimilarities.`,
      caption: String.raw`**Left:** the *true* configuration of 12 stimuli, a hidden psychological space; drag the points to reshape it or choose a preset (a hue circle, a line, clusters). A simulated judge rates every pair's dissimilarity as the true distance times random noise (slider). **Middle:** the configuration recovered by classical MDS from those ratings alone, rotated and scaled to sit on the truth (thin lines show the errors). **Right:** stress against dimension: it drops to near zero at the true dimension (2 for a circle or clusters, 1 for a line) when the noise is small (classical MDS minimises a different criterion, the strain of $B$, so stress can wobble as dimensions are added). Simulated judgments. For real colour data, Ekman's 1954 similarity ratings of 14 spectral colours are often cited as an example in which MDS arranges the colours around a circle.`,
      deps: ['psych-3.7', 'ladr-7.29'],
      refs: ['Gescheider ch. 10'],
      tags: ['multidimensional scaling', 'similarity', 'stress'],
      credit: 'W. S. Torgerson, “Multidimensional scaling: I. Theory and method”, Psychometrika 17 (1952): 401–419; J. B. Kruskal (1964) for stress and nonmetric MDS',
      scope: String.raw`Classical MDS is exact for Euclidean distances and approximate otherwise; real similarity judgments are noisy, may be non-Euclidean or asymmetric, and the number of dimensions is chosen by judgment from the stress plot. The map is unique only up to rotation, reflection and translation.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multidimensional_scaling' },
      viz(v) {
        const M = v.M, NP = 12;
        let seed = 31, Z = null, zSeed = -1;
        const PRE = { circle: M.range(NP).map((k) => [1.5 * Math.cos((2 * Math.PI * k) / NP), 1.5 * Math.sin((2 * Math.PI * k) / NP)]),
          line: M.range(NP).map((k) => [-1.8 + (3.6 * k) / (NP - 1), 0]),
          clusters: M.range(NP).map((k) => { const c = [[-1.4, 1.0], [1.4, 0.7], [0, -1.5]][k % 3], a = (k * 2.399) % 6.28; return [c[0] + 0.45 * Math.cos(a), c[1] + 0.45 * Math.sin(a)]; }) };
        const noise = v.slider('judgment noise (log-SD)', 0, 0.6, 0.1, { step: 0.01 });
        const cfg = v.select('preset', [{ value: 'circle', label: 'hue circle' }, { value: 'line', label: 'line' }, { value: 'clusters', label: 'clusters' }], 'circle', { onChange: (c) => PRE[c].forEach((p, i) => H[i].set(p[0], p[1])) });
        v.button('New judgments', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const tr = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 290, weight: 1, minWidth: 220, title: 'true configuration (drag)' });
        const rc = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 290, weight: 1, minWidth: 220, title: 'recovered by classical MDS' });
        const sb = v.stage({ x: [0.4, 4.6], y: [0, 0.6], axes: 'box', gutter: true, height: 290, weight: 0.85, minWidth: 220, xlabel: 'number of dimensions', ylabel: 'stress', xticks: [1, 2, 3, 4], title: 'stress by dimension' });
        const colr = (i) => M.hsl2rgb(i / NP, 0.7, 0.5);
        const H = PRE.circle.map((p, i) => tr.handle(p[0], p[1], { color: colr(i), r: 8, constrain: (x, y) => [M.clamp(x, -2.3, 2.3), M.clamp(y, -2.3, 2.3)] }));
        let st = null;
        v.render(() => {
          if (zSeed !== seed) { const R = v.rng(seed); Z = M.zeros(NP, NP); for (let i = 0; i < NP; i++) for (let j = i + 1; j < NP; j++) { Z[i][j] = R.normal(); Z[j][i] = Z[i][j]; } zSeed = seed; }
          const X = H.map((h) => [h.x, h.y]), sd = noise.value;
          const dist = (A, i, j) => Math.hypot(...A[i].map((a, k) => a - A[j][k]));
          const Dm = M.zeros(NP, NP); for (let i = 0; i < NP; i++) for (let j = 0; j < NP; j++) if (i !== j) Dm[i][j] = dist(X, i, j) * Math.exp(sd * Z[i][j]);
          const D2 = Dm.map((r) => r.map((x) => x * x)), rm = D2.map((r) => M.mean(r)), gm = M.mean(rm);
          const B = D2.map((r, i) => r.map((x, j) => -0.5 * (x - rm[i] - rm[j] + gm)));
          const E = M.eigSym(B), lam = E.values;
          const coord = (k) => E.vecs.slice(0, k).map((ev, a) => ev.map((x) => x * Math.sqrt(Math.max(lam[a], 0)))); // k lists of m
          const stress = (k) => { const C = coord(k); let num = 0, den = 0; for (let i = 0; i < NP; i++) for (let j = i + 1; j < NP; j++) { let d2 = 0; for (let a = 0; a < k; a++) d2 += (C[a][i] - C[a][j]) ** 2; num += (Dm[i][j] - Math.sqrt(d2)) ** 2; den += Dm[i][j] ** 2; } return den>0 ? Math.sqrt(num / den) : 0; };
          const sts = [1, 2, 3, 4].map(stress);
          // align 2-D solution to truth: reflect?, rotate, scale
          const C2 = coord(2), Y = M.range(NP).map((i) => [C2[0][i], C2[1][i]]), cx = M.mean(X.map((p) => p[0])), cy = M.mean(X.map((p) => p[1])), Xc = X.map((p) => [p[0] - cx, p[1] - cy]);
          let best = null;
          for (const refl of [1, -1]) {
            const Yr = Y.map((p) => [p[0], refl * p[1]]); const my0 = M.mean(Yr.map((p) => p[0])), my1 = M.mean(Yr.map((p) => p[1])), Yc = Yr.map((p) => [p[0] - my0, p[1] - my1]);
            let a = 0, b = 0, nn = 0; for (let i = 0; i < NP; i++) { a += Xc[i][0] * Yc[i][0] + Xc[i][1] * Yc[i][1]; b += Yc[i][0] * Xc[i][1] - Yc[i][1] * Xc[i][0]; nn += Yc[i][0] ** 2 + Yc[i][1] ** 2; }
            const th = Math.atan2(b, a), c = Math.cos(th), s = Math.sin(th), sc = nn > 1e-12 ? Math.hypot(a, b) / nn : 1;
            const R = Yc.map((p) => [sc * (c * p[0] - s * p[1]), sc * (s * p[0] + c * p[1])]);
            const err = Math.sqrt(M.mean(R.map((p, i) => (p[0] - Xc[i][0]) ** 2 + (p[1] - Xc[i][1]) ** 2)));
            if (!best || err < best.err) best = { R, err };
          }
          const rad = Math.sqrt(M.mean(Xc.map((p) => p[0] ** 2 + p[1] ** 2)));
          best.R.forEach((p, i) => { rc.line(Xc[i][0], Xc[i][1], p[0], p[1], { color: 'muted', alpha: 0.6, width: 1.2 }); rc.dot(Xc[i][0], Xc[i][1], { r: 3.5, color: 'muted', hollow: true, width: 1.4 }); rc.dot(p[0], p[1], { r: 7, color: colr(i), label: String(i + 1), labelPos: 'ne' }); });
          sts.forEach((s, k) => { sb.rect(k + 1 - 0.3, 0, k + 1 + 0.3, s, { fill: k === 1 ? 'accent' : 'muted', fillAlpha: k === 1 ? 0.5 : 0.25, color: k === 1 ? 'accent' : 'muted', width: 1.6 }); sb.text(s.toFixed(3), k + 1, s, { dy: -10, align: 'center', size: 11.5, weight: 700, color: 'ink' }); });
          sb.setView([0.4, 4.6], [0, Math.max(0.2, Math.max(...sts) * 1.18)]);
          st = { sts, err: best.err, rad, lam: lam.slice(0, 4) };
        });
        v.readout(() => st ? `Stress for 1, 2, 3, 4 dimensions: ${st.sts.map((s) => v.fix(s, 3)).join(', ')} · root-mean-square position error of the 2-D map after alignment: ${v.fix(st.err, 3)} (${v.fix(st.rad>0?(100*st.err)/st.rad:0,0)}% of the configuration's radius) · leading eigenvalues of $B$: ${st.lam.map((l) => v.fix(l, 2)).join(', ')} · with no noise and a planar truth the stress at 2 dimensions is 0` : '');
      },
    },
  ],
};
