// Information & Coding Theory — Chapter 1: Entropy (items 1.1–1.6; 1.7–1.12 in ch01-b.js)
//
// House style for the collection. Logarithms are base 2 (bits) unless a control says otherwise. A probability
// distribution is drawn as blue bars the reader can drag: the dragged bar follows the pointer, the others
// rescale to keep the total 1, and a bar pulled down to the axis becomes an exact zero (0 log 0 = 0). Entropy
// values are green, bounds such as log n or H + 1 orange, sampled data gold, failures red; in two-variable
// pictures information about X alone is blue, about Y alone teal, and shared information purple. Every number
// in a readout is computed from the distribution on screen; randomness comes from v.rng seeded by the settings.

import { clamp, sum, H, h2, surpr, LET, commas, setProb, resizeP, dragBars, hashStr, viewPad, legender, titler, lensArea } from './ch01.shared.js';

// The opening of Lewis Carroll's *Alice's Adventures in Wonderland* (1865, public domain): the built-in English sample.
const ALICE = `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"
So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.
There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.
In another moment down went Alice after it, never once considering how in the world she was to get out again.
The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.
Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.`;
const ALPH = 'abcdefghijklmnopqrstuvwxyz ';
const ALPH_SHOW = (k) => (k === 26 ? '␣' : ALPH[k]);
let TS = null;
/** The sample reduced to 27 symbols (a–z and space), its symbol frequencies and the plug-in estimate Ĥ after each prefix. */
function textStats() {
  if (TS) return TS;
  const text = ALICE.toLowerCase().replace(/[^a-z]+/g, ' ').trim(), N = text.length;
  const codes = Uint8Array.from(text, (ch) => (ch === ' ' ? 26 : ch.charCodeAt(0) - 97));
  const cnt = new Array(27).fill(0), curve = []; let next = 10;
  for (let t = 1; t <= N; t++) { cnt[codes[t - 1]]++; if (t >= next || t === N) { curve.push([t, H(cnt)]); next = Math.max(t + 1, Math.ceil(t * 1.035)); } }
  const freq = cnt.map((c) => c / N);
  const countsAt = (n) => { const c = new Array(27).fill(0); for (let t = 0; t < n; t++) c[codes[t]]++; return c; };
  TS = { text, N, codes, freq, H: H(freq), curve, countsAt };
  return TS;
}
/** Draw the sample word-wrapped in a monospace grid, each symbol on a cell shaded by its surprisal. */
function drawPassage(s, v, T, surp, nRead) {
  const c = s.ctx, W = s.width, Ht = s.height, pad = 9, lh = 18;
  c.save(); c.font = '500 12.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const cw = c.measureText('m').width, cols = Math.max(12, Math.floor((W - 2 * pad) / cw)), rows = Math.floor((Ht - 2 * pad) / lh);
  const text = T.text, n = text.length; let row = 0, col = 0, k = 0, cursor = null;
  const cell = (q) => {
    const x = pad + col * cw, y = pad + row * lh, I = surp(T.codes[q]), read = q < nRead;
    if (I === Infinity) c.fillStyle = v.color('red', read ? 0.7 : 0.45);
    else c.fillStyle = v.color('orange', (0.05 + 0.8 * clamp((I - 1.6) / 7.4, 0, 1)) * (read ? 1 : 0.55));
    c.fillRect(x + 0.4, y + 1, cw - 0.8, lh - 2);
    c.fillStyle = v.color(text[q] === ' ' ? 'faint' : read ? 'ink' : 'muted');
    c.fillText(text[q] === ' ' ? '·' : text[q], x + cw / 2, y + lh / 2 + 0.5);
    if (q === nRead - 1) cursor = [x + cw, y];
  };
  while (k < n && row < rows) {
    let e = k; while (e < n && text[e] !== ' ') e++;
    if (col > 0 && col + (e - k) > cols) { row++; col = 0; if (row >= rows) break; }
    for (let q = k; q <= Math.min(e, n - 1) && col < cols; q++) { cell(q); col++; }
    k = e + 1;
  }
  if (cursor) { c.fillStyle = v.color('gold'); c.fillRect(cursor[0] - 1, cursor[1], 2.5, lh); }
  c.restore();
}
/** The surprisal profile of a distribution: rectangles of width p_i and height −log₂ p_i (area = entropy). */
function drawProfile(s, v, p, labels, ymax) {
  let x = 0;
  s.clip(() => p.forEach((pi, i) => {
    if (!(pi > 0)) return;
    const h = surpr(pi);
    s.rect(x, 0, x + pi, h, { fill: 'accent', fillAlpha: i % 2 ? 0.28 : 0.5, color: 'accent', width: 1 });
    if (s.X(x + pi) - s.X(x) > 11) s.text(labels(i), x + pi / 2, 0, { dy: -9, align: 'center', size: 11, color: 'ink', weight: 600 });
    if (h > ymax) s.text('↑', x + pi / 2, ymax, { dy: 7, align: 'center', size: 11, color: 'accent' });
    x += pi;
  }));
}

export default {
  collection: 'info',
  chapter: 1,
  title: 'Entropy',
  summary: String.raw`Shannon measures the information in an outcome by its surprise, $-\log p$, and the entropy of a source by its average surprise. Entropy counts the well-chosen yes/no questions needed, on average, to pin down an outcome; it is largest for the uniform distribution, adds up along a chain of questions and can only fall when outcomes are merged. These properties single out the logarithmic formula among all measures of uncertainty, while variants such as min-entropy measure uncertainty for other purposes, from guessing passwords to extracting randomness.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Surprisal (self-information)',
      statement: String.raw`The **surprisal** or **self-information** of an event $A$ with probability $P(A)=p>0$ is
$$I(A)=\log\frac1p=-\log p .$$
With base-2 logarithms it is measured in **bits**, with natural logarithms in **nats** ($1$ nat $=\log_2 e\approx1.443$ bits), with base 10 in **hartleys**. Surprisal is $0$ for a certain event, strictly decreasing in $p$, and tends to $\infty$ as $p\to0$; an event of probability $2^{-k}$ is exactly as surprising as $k$ fair coins all landing heads. For **independent** events surprisals add:
$$P(A\cap B)=P(A)P(B)\quad\Longrightarrow\quad I(A\cap B)=I(A)+I(B).$$
For dependent events the discrepancy $I(A)+I(B)-I(A\cap B)=\log\frac{P(A\cap B)}{P(A)P(B)}$ (positive or negative) measures how much one event tells about the other.`,
      idea: String.raw`If the surprise of an event is to depend on its probability alone, decrease as the probability grows and add over independent events, it must satisfy $f(pq)=f(p)+f(q)$; written in the variable $u=-\log p$ this is Cauchy's equation $g(u+v)=g(u)+g(v)$, whose monotone solutions are linear, so $f(p)=-K\log p$ and the constant $K$ is just the choice of unit. Bits count halvings: every halving of the probability adds exactly one bit, which is why the curve becomes a straight line on a logarithmic $p$-axis. Independence (prob-2.1.1a) is what makes the probabilities multiply; for dependent events the product rule $P(A\cap B)=P(A)\,P(B\mid A)$ still gives $I(A\cap B)=I(A)+I(B\mid A)$, the surprise of $B$ once $A$ is known.`,
      caption: String.raw`Drag the handles $A$ and $B$ along the curve to set $P(A)$ and $P(B)$; the green dot is the event "both", $A\cap B$. The two columns at the top right compare $I(A)+I(B)$ (blue on orange) with $I(A\cap B)$ (green): for independent events they match. On the right the same probabilities are areas in the unit square. Move the dependence slider away from $0$ (positive: $B$ tends to happen with $A$; $-1$ with $P(A)+P(B)\le1$: they exclude each other) and the columns part. Switch on the logarithmic axis to push $p$ down to $0.001$: the faint dots at $p=\tfrac12,\tfrac14,\tfrac18,\dots$ are one bit apart.`,
      deps: ['prob-1.1.1a', 'prob-2.1.1a'],
      refs: ['Cover–Thomas §2.1', 'MacKay ch. 2'],
      tags: ['surprisal', 'information'],
      credit: 'Hartley, 1928; Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Information_content' },
      viz(v) {
        const unit = v.select('unit', [{ value: 'bits', label: 'bits ($\\log_2$)' }, { value: 'nats', label: 'nats ($\\ln$)' }, { value: 'hart', label: 'hartleys ($\\log_{10}$)' }], 'bits');
        const logX = v.toggle('logarithmic $p$-axis', false);
        const dep = v.slider('dependence of $A$ and $B$ (0 = independent)', -1, 1, 0, { step: 0.01 });
        const sC = v.stage({ x: [0, 1], y: [0, 11], height: 340, axes: 'box', weight: 1.5, title: 'surprisal $I(p) = -\\log p$' });
        const sQ = v.stage({ x: [-0.06, 1.06], y: [-0.2, 1.14], height: 340, equal: true, axes: false, title: 'the same probabilities as areas' });
        const PMIN = 0.001, BASE = { bits: 2, nats: Math.E, hart: 10 }, UNIT = { bits: 'bits', nats: 'nats', hart: 'hartleys' };
        const lb = () => Math.log(BASE[unit.value]);
        const I = (p) => (p > 0 ? -Math.log(p) / lb() : Infinity);
        const onCurve = (x) => { const p = clamp(x, PMIN, 1); return [p, I(p)]; };
        const hA = sC.handle(0.25, 2, { color: 'accent', label: 'A', labelPos: 'ne', constrain: onCurve });
        const hB = sC.handle(0.5, 1, { color: 'orange', label: 'B', labelPos: 'ne', constrain: onCurve });
        const joint = () => { const p = hA.x, q = hB.x, k = dep.value, ind = p * q; return k >= 0 ? ind + k * (Math.min(p, q) - ind) : ind + k * (ind - Math.max(0, p + q - 1)); };
        v.legend([['accent', 'event $A$'], ['orange', 'event $B$'], ['green', 'both: $A\\cap B$']]);
        v.render(() => {
          const lx = logX.value, ymax = (11 * Math.LN2) / lb(), pa = hA.x, pb = hB.x, pab = joint();
          sC.o.xlog = lx;
          viewPad(sC, lx ? [PMIN, 1] : [0, 1], [0, ymax], { xlog: lx });
          hA.y = I(pa); hB.y = I(pb);
          const b = sC.bounds;
          // dyadic probabilities: one bit apart
          for (let k = 1; k <= 9; k++) { const q = 2 ** -k; if (q >= b.x[0]) sC.dot(q, I(q), { r: 2.6, color: 'muted', alpha: 0.6 }); }
          sC.curve((t) => { const q = 10 ** t; return [q, I(q)]; }, -3.3, 0, { color: 'ink', width: 2.4, n: 400 });
          const guide = (q, col) => {
            const y = I(q); if (!(y < b.y[1]) || q < b.x[0]) return;
            sC.line(q, b.y[0], q, y, { color: col, width: 1.2, dash: [4, 4] }); sC.line(b.x[0], y, q, y, { color: col, width: 1.2, dash: [4, 4] });
          };
          guide(pa, 'accent'); guide(pb, 'orange');
          if (pab > 0 && pab >= b.x[0] && I(pab) < b.y[1]) { guide(pab, 'green'); sC.dot(pab, I(pab), { r: 6, color: 'green' }); sC.text('A∩B', pab, I(pab), { dx: -9, dy: 10, align: 'right', color: 'green', size: 12, weight: 600 }); }
          // the two columns, I(A) + I(B) stacked against I(A∩B), on an inset where the curve is out of the way
          const W = sC.width, L0 = lx ? 42 : W - 104, X = (px) => sC.invX(px), IA = I(pa), IB = I(pb), IAB = I(pab);
          sC.ctx.save(); sC.ctx.fillStyle = v.color('panel'); sC.ctx.strokeStyle = v.color('faint'); sC.ctx.lineWidth = 1;
          const T0 = Math.max(6, sC.Y(Math.min(ymax, Math.max(IA + IB, IAB === Infinity ? ymax : IAB))) - 30);
          sC.ctx.beginPath(); sC.ctx.rect(L0, T0, 98, sC.Y(0) - T0); sC.ctx.fill(); sC.ctx.stroke(); sC.ctx.restore();
          sC.clip(() => {
            sC.rect(X(L0 + 10), 0, X(L0 + 38), IA, { fill: 'accent', fillAlpha: 0.8, stroke: false });
            sC.rect(X(L0 + 10), IA, X(L0 + 38), IA + IB, { fill: 'orange', fillAlpha: 0.8, stroke: false });
            if (IAB < Infinity) sC.rect(X(L0 + 56), 0, X(L0 + 84), IAB, { fill: 'green', fillAlpha: 0.8, stroke: false });
          });
          const lab = (str, px, top, col) => sC.textPx(str, px, Math.max(14, sC.Y(Math.min(top, ymax)) - 9), { align: 'center', size: 11, weight: 700, color: col });
          lab(IA + IB > ymax ? 'A + B ↑' : 'A + B', L0 + 24, IA + IB, 'ink');
          lab(IAB === Infinity ? 'A∩B: ∞' : IAB > ymax ? 'A∩B ↑' : 'A∩B', L0 + 70, IAB === Infinity ? 0 : IAB, IAB === Infinity ? 'red' : 'green');
          // the unit square: A is a vertical strip, B has height P(B|A) inside it and P(B|not A) outside
          const r = pa > 0 ? pab / pa : 0, s = pa < 1 ? clamp((pb - pab) / (1 - pa), 0, 1) : 0;
          sQ.rect(0, 0, pa, 1, { fill: 'accent', fillAlpha: 0.12, stroke: false });
          sQ.rect(0, 0, pa, r, { fill: 'orange', fillAlpha: 0.3, stroke: false });
          sQ.rect(pa, 0, 1, s, { fill: 'orange', fillAlpha: 0.3, stroke: false });
          if (Math.abs(pab - pa * pb) > 1e-9) sQ.line(0, pb, 1, pb, { color: 'orange', width: 1.3, dash: [5, 4] });
          if (pab > 0) sQ.rect(0, 0, pa, r, { color: 'green', width: 2.6 });
          sQ.line(pa, 0, pa, 1, { color: 'accent', width: 2 });
          sQ.rect(0, 0, 1, 1, { color: 'muted', width: 1.3 });
          if (pa > 0.07) sQ.tex('A', pa / 2, 1, { dy: -11, color: 'accent', size: 15 });
          if (pa < 0.9) sQ.tex('\\text{not }A', (1 + pa) / 2, 1, { dy: -11, color: 'muted', size: 14 });
          if (pab > 0 && sQ.X(pa) - sQ.X(0) > 40 && sQ.Y(0) - sQ.Y(r) > 22) sQ.tex('A\\cap B', pa / 2, r / 2, { color: 'green', size: 14 });
          sQ.tex(`P(A) = ${v.fix(pa, 3)}`, 0, 0, { dy: 16, align: 'left', color: 'accent', size: 13 });
          sQ.tex(`P(B) = ${v.fix(pb, 3)}`, 1, 0, { dy: 16, align: 'right', color: 'orange', size: 13 });
          sQ.tex(`P(A\\cap B) = ${v.fix(pab, 3)}`, 0.5, 0, { dy: 36, color: 'green', size: 13 });
        });
        v.readout(() => {
          const pa = hA.x, pb = hB.x, pab = joint(), IA = I(pa), IB = I(pb), IAB = I(pab), u = UNIT[unit.value], f = (x) => (x === Infinity ? '\\infty' : v.fix(x, 3));
          let s = `$I(A) = ${f(IA)}$, $I(B) = ${f(IB)}$ ${u} · $I(A\\cap B) = ${f(IAB)}$`;
          if (Math.abs(pab - pa * pb) < 1e-12) s += ` $= I(A) + I(B)$ ✓ (independent)`;
          else if (pab === 0) s += ` — $A$ and $B$ exclude each other, so "both" is impossible`;
          else s += ` $\\neq I(A) + I(B) = ${f(IA + IB)}$; the gap $\\log\\frac{P(A\\cap B)}{P(A)P(B)} = ${f(IA + IB - IAB)}$ is what $A$ tells about $B$`;
          if (unit.value === 'bits') s += ` · $A$ is as surprising as ${v.fix(IA, 2)} fair coins all landing heads`;
          else s += ` · ${f(IA)} ${u} $= ${v.fix(IA * lb() / Math.LN2, 3)}$ bits`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Shannon entropy',
      statement: String.raw`The **entropy** of a discrete random variable $X$ with distribution $p(x)=P(X=x)$ on a finite or countable set $\mathcal X$ is its expected surprisal,
$$H(X)=\mathbb E\Big[\log_2\frac1{p(X)}\Big]=-\sum_{x\in\mathcal X}p(x)\log_2 p(x)\qquad\text{bits},$$
with the convention $0\log 0=0$, so outcomes of probability zero contribute nothing. $H$ depends only on the list of probabilities, not on the values of $X$; it is $0$ exactly when $X$ is constant (almost surely), it is at most $\log_2|\mathcal X|$ for a finite alphabet (1.4), and it may be infinite for a countable one. For i.i.d. samples $X_1,X_2,\dots$ the average surprisal $\frac1n\sum_{i\le n}\log_2\frac1{p(X_i)}$ converges to $H(X)$ almost surely, by the law of large numbers.`,
      idea: String.raw`Entropy is surprisal (1.1) averaged with the weights $p(x)$, so it can be drawn as an area: stand a rectangle of width $p(x)$ and height $-\log_2 p(x)$ over each outcome, and the total area is $H$, the mean height of this profile. Likely outcomes give wide, low rectangles and rare ones narrow, tall ones; the convention $0\log0=0$ is the limit $p\log\frac1p\to0$, a rectangle that grows taller more slowly than it becomes thin. Because $H$ is an expectation (prob-1.6.1a), averaging the surprisals of sampled outcomes estimates it, which is also how the entropy of real text is measured: count symbol frequencies and compute the entropy of the counts (the *plug-in estimate*, slightly too small on short samples, and confident that a symbol it has not yet seen is impossible).`,
      caption: String.raw`**Your distribution:** drag the blue bars (pull one to the axis for an exact zero). The numbers above the bars are surprisals; the middle panel stands each outcome's surprisal on a base as wide as its probability, so the green line, the mean height, is $H$. Gold rings show frequencies in the samples, and the running average of their surprisal (bottom) settles on $H$. **English text:** the opening of *Alice in Wonderland*, reduced to 27 symbols (a–z and space). Each symbol is shaded by its surprisal under the frequencies of the first $n$ characters, set by the slider (red: not seen yet, estimated probability $0$); the bottom panel shows how the estimate $\hat H$ settles as more text is read.`,
      deps: ['info-1.1', 'prob-1.6.1a'],
      see: ['prob-2.4.1', 'ling-4.8'],
      refs: ['Cover–Thomas §2.1', 'MacKay ch. 2'],
      tags: ['entropy'],
      credit: 'Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entropy_(information_theory)' },
      viz(v) {
        const T = textStats(), CAP = 60000;
        let p = [0.46, 0.2, 0.13, 0.1, 0.07, 0.04], seed = 1, N = 2000;
        const src = v.select('source', [{ value: 'own', label: 'your distribution' }, { value: 'text', label: 'English text' }], 'own');
        const nS = v.slider('outcomes $n$', 2, 10, 6, { int: true, onChange: (n) => { p = resizeP(p, n); } });
        const rd = v.slider('characters read $n$', 10, T.N, 300, { int: true, log: true });
        const bMore = v.button('Draw 10,000 more', () => { N = Math.min(CAP, N + 10000); });
        const bNew = v.button('New samples', () => { seed++; N = 2000; });
        const sA = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: 'box' });
        const sB = v.stage({ x: [0, 1], y: [0, 6], height: 290, axes: 'box', title: 'surprisal profile: width $p_i$, height $-\\log_2 p_i$' });
        const sC = v.stage({ x: [1, 1e4], y: [0, 4], xlog: true, height: 210, axes: 'box', full: true });
        const tA = titler(sA), tC = titler(sC), lg = legender(v);
        const DB = dragBars(sA, () => (src.value === 'own' ? p : null));
        let U = null, Useed = null;
        const unif = () => { if (Useed !== seed) { const r = v.rng(hashStr('info-1.2|' + seed)); U = new Float64Array(CAP); for (let i = 0; i < CAP; i++) U[i] = r(); Useed = seed; } return U; };
        // samples X_t = F⁻¹(U_t) from a fixed stream of uniforms, so dragging a bar moves the whole picture continuously
        const sim = () => {
          const u = unif(), n = p.length, C = []; let c = 0; for (const x of p) { c += x; C.push(c); }
          const I = p.map(surpr), cnt = new Array(n).fill(0), path = []; let s = 0, next = 1;
          for (let t = 0; t < N; t++) {
            let k = 0; while (k < n - 1 && u[t] >= C[k]) k++;
            while (p[k] === 0 && k > 0) k--; while (p[k] === 0 && k < n - 1) k++;
            cnt[k]++; s += I[k];
            if (t + 1 >= next || t === N - 1) { path.push([t + 1, s / (t + 1)]); next = Math.ceil((t + 1) * 1.02); }
          }
          return { cnt, path, avg: N ? s / N : NaN };
        };
        v.render(() => {
          const own = src.value === 'own';
          nS.el.hidden = !own; bMore.hidden = !own; bNew.hidden = !own; rd.el.hidden = own;
          const n = own ? p.length : 27, nr = rd.value;
          const dist = own ? p : T.countsAt(nr).map((c) => c / nr), Hd = H(dist), name = own ? (i) => LET[i] : ALPH_SHOW;
          if (own) {
            const S = sim();
            sA.o.axes = 'box';
            tA('drag the bars: your distribution $p$');
            viewPad(sA, [-0.6, n - 0.4], [0, DB.fit(p, 0.5)]); sA.setTicks(p.map((_, i) => [i, LET[i]]), null);
            p.forEach((pi, i) => {
              sA.rect(i - 0.36, 0, i + 0.36, pi, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.5 });
              sA.text(pi > 0 ? v.fix(surpr(pi), 2) : '∞', i, pi, { dy: -10, align: 'center', size: 10.5, color: pi > 0 ? 'muted' : 'red', weight: 600 });
              sA.dot(i, S.cnt[i] / Math.max(1, N), { r: 4.5, color: 'gold', hollow: true, width: 2.2 });
            });
            sA.corner('numbers: surprisal −log₂ pᵢ in bits', 'tr', { size: 11 });
            tC(`running average of the surprisal $-\\log_2 p(X_t)$ of ${commas(N)} samples`);
            viewPad(sC, [1, Math.max(N, 100)], [0, Math.max(2, Math.log2(n) + 1.2)], { xlog: true });
            sC.hline(Hd, { color: 'green', width: 2, dash: [7, 4] });
            sC.text(`H = ${v.fix(Hd, 3)}`, sC.bounds.x[1], Hd, { align: 'right', dx: -8, dy: -10, color: 'green', weight: 600 });
            sC.clip(() => sC.path(S.path, { color: 'gold', width: 2.2 }));
            if (S.path.length) { const [t, a] = S.path[S.path.length - 1]; sC.dot(t, a, { r: 4, color: 'gold' }); }
            lg([['accent', 'probabilities $p_i$', { area: true }], ['gold', 'samples: frequencies and average surprisal'], ['green', 'entropy $H$'], ['orange', 'maximum $\\log_2 n$', { dash: true }]]);
          } else {
            sA.o.axes = false;
            tA('the text, shaded by surprisal $-\\log_2\\hat p$ (red: $\\hat p = 0$)');
            drawPassage(sA, v, T, (code) => surpr(dist[code]), nr);
            tC('plug-in estimate $\\hat H$ from the first $n$ characters');
            viewPad(sC, [10, T.N], [2.6, 5.0], { xlog: true }); sC.setTicks(null, null);
            sC.hline(T.H, { color: 'green', width: 2, dash: [7, 4] });
            sC.hline(Math.log2(27), { color: 'orange', width: 1.5, dash: [3, 4] });
            sC.text(`log₂ 27 = ${v.fix(Math.log2(27), 3)}`, sC.bounds.x[0], Math.log2(27), { dx: 40, dy: -9, color: 'orange', size: 11.5 });
            sC.text(`whole passage: H = ${v.fix(T.H, 3)}`, sC.bounds.x[1], T.H, { align: 'right', dx: -8, dy: 11, color: 'green', weight: 600 });
            sC.path(T.curve, { color: 'gold', width: 2.2 });
            sC.vline(nr, { color: 'muted', width: 1, dash: [3, 3] }); sC.dot(nr, Hd, { r: 5, color: 'gold' });
            lg([['orange', 'surprisal of each symbol', { area: true }], ['accent', 'profile of $\\hat p$', { area: true }], ['gold', 'estimate $\\hat H$ after $n$ characters'], ['green', '$H$ of the whole passage', { dash: true }]]);
          }
          const ymax = own ? Math.max(4, Math.ceil(Math.log2(n) + 2.2)) : 9;
          viewPad(sB, [0, 1], [0, ymax]);
          drawProfile(sB, v, dist, name, ymax);
          // labels go on the side where the profile is lower
          const nz = dist.map((x, i) => [x, i]).filter(([x]) => x > 0), hl = nz.length ? surpr(nz[0][0]) : 0, hr = nz.length ? surpr(nz[nz.length - 1][0]) : 0;
          const L = hl <= hr, lx = L ? 0 : 1, al = L ? 'left' : 'right', ddx = L ? 6 : -6;
          sB.hline(Math.log2(n), { color: 'orange', width: 1.5, dash: [6, 4] });
          sB.text(`log₂ ${n}`, lx, Math.log2(n), { align: al, dx: ddx, dy: -9, color: 'orange', size: 11.5 });
          sB.hline(Hd, { color: 'green', width: 2.4 });
          sB.text(`H = ${v.fix(Hd, 3)} bits`, lx, Hd, { align: al, dx: ddx, dy: (L ? hl : hr) < Hd - 0.4 ? 11 : -10, color: 'green', weight: 700 });
        });
        v.readout(() => {
          if (src.value === 'own') {
            const S = sim(), z = p.filter((x) => x === 0).length, Hd = H(p);
            return String.raw`$H(p) = -\sum_i p_i\log_2 p_i = ${v.fix(Hd, 3)}$ bits, the mean height of the profile (at most $\log_2 ${p.length} = ${v.fix(Math.log2(p.length), 3)}$) · average surprisal of ${commas(N)} samples: $${v.fix(S.avg, 3)}$` + (z ? ` · ${z} outcome${z > 1 ? 's' : ''} of probability $0$: infinitely surprising but never seen, ${z > 1 ? 'they contribute' : 'it contributes'} $0\\log 0 = 0$` : '');
          }
          const nr = rd.value, c = T.countsAt(nr), un = c.filter((x) => x === 0).length;
          return String.raw`first ${commas(nr)} characters: $\hat H = ${v.fix(H(c), 3)}$ bits per symbol · whole passage (${commas(T.N)} characters): $H = ${v.fix(T.H, 3)}$ bits, against $\log_2 27 = ${v.fix(Math.log2(27), 3)}$ for 27 equally likely symbols` + (un ? ` · ${un} of the 27 symbols not seen yet: the plug-in model gives them probability $0$` : ' · every symbol has been seen');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Binary entropy function',
      statement: String.raw`The entropy of a coin that lands heads with probability $p$ is the **binary entropy function**
$$h(p)=-p\log_2 p-(1-p)\log_2(1-p),\qquad 0\le p\le1,\quad h(0)=h(1)=0 .$$
It is symmetric, $h(p)=h(1-p)$; strictly concave; increasing on $[0,\tfrac12]$ with its maximum $h(\tfrac12)=1$ bit; and its slope $h'(p)=\log_2\frac{1-p}{p}$ is infinite at both ends, so near $p=0$ it rises like $p\log_2\frac1p$, faster than any linear function. Near the top, $h(p)\approx 1-\frac{2}{\ln2}\big(p-\tfrac12\big)^2$.`,
      idea: String.raw`$h$ is entropy (1.2) on two outcomes, the sum of the two terms $p\log_2\frac1p$ and $(1-p)\log_2\frac1{1-p}$, each of which is concave; swapping the labels heads and tails swaps the terms, hence the symmetry. Differentiating, $h'(p)=\log_2\frac{1-p}{p}$ vanishes only at $\tfrac12$ and $h''(p)=-\frac{1}{p(1-p)\ln2}<0$, which gives the single peak, the concavity and the quadratic shape near the top; at the ends $h'\to\pm\infty$ because $\log\frac1p$ is unbounded. Operationally, a long run of flips of a $p$-coin carries about $h(p)$ bits per flip: a fair coin is incompressible, while flips of a coin with $p=0.1$ can be stored in under half a bit each.`,
      caption: String.raw`Drag $p$ along the curve. The green line is the tangent (its slope is in the readout), the hollow dot at $1-p$ shows the symmetry, and with *show the two terms* on, the dashed curves are $p\log_2\frac1p$ and $(1-p)\log_2\frac1{1-p}$, stacked under the handle to make $h(p)$. *Zoom near $p=0$* shows the tangent standing up as $p\to0$. On the right, 200 flips of the $p$-coin (gold = heads; *New flips* redraws): at $p=\tfrac12$ they look random, near the ends they become predictable, and their surprisal per flip tracks $h(p)$.`,
      deps: ['info-1.2'],
      refs: ['Cover–Thomas §2.1'],
      tags: ['entropy', 'binary entropy'],
      credit: 'Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Binary_entropy_function' },
      viz(v) {
        const view = v.select('view', [{ value: 'all', label: 'whole curve' }, { value: 'zoom', label: 'zoom near $p = 0$' }], 'all', { onChange: (m) => { if (m === 'zoom' && hP.x > 0.05) hP.set(0.012, h2(0.012)); } });
        const terms = v.toggle('show the two terms', true);
        let seed = 3; v.button('New flips', () => { seed++; });
        const sL = v.stage({ x: [0, 1], y: [0, 1.12], height: 340, axes: 'box', weight: 1.4, title: '$h(p) = -p\\log_2 p-(1-p)\\log_2(1-p)$' });
        const sR = v.stage({ x: [-0.2, 20.2], y: [-3.4, 13.2], height: 340, equal: true, axes: false, title: '200 flips with $P(\\text{heads}) = p$' });
        const dom = () => (view.value === 'zoom' ? [0, 0.05] : [0, 1]);
        const hP = sL.handle(0.2, h2(0.2), { color: 'accent', label: 'p', labelPos: 'n', constrain: (x) => { const [a, b] = dom(); const q = clamp(x, a, b); return [q, h2(q)]; } });
        let U = null, Us = null;
        const flips = () => { if (Us !== seed) { const r = v.rng(hashStr('flips|' + seed)); U = Array.from({ length: 200 }, () => r()); Us = seed; } return U; };
        const t1 = (x) => (x > 0 ? -x * Math.log2(x) : 0), t2 = (x) => t1(1 - x);
        v.legend([['accent', '$h(p)$'], ['orange', '$p\\log_2\\frac1p$', { dash: true }], ['purple', '$(1-p)\\log_2\\frac1{1-p}$', { dash: true }], ['green', 'tangent at $p$']]);
        v.render(() => {
          const z = view.value === 'zoom', [a, b] = dom(), p = hP.x, hp = h2(p);
          viewPad(sL, [a, b], [0, z ? 0.34 : 1.12]); hP.y = hp;
          const P = (t) => (z ? b * t * t : (1 - Math.cos(Math.PI * t)) / 2);
          if (!z) { sL.vline(0.5, { color: 'faint', dash: [3, 4] }); sL.dot(0.5, 1, { r: 3.5, color: 'muted' }); sL.text('1 bit at p = ½', 0.5, 1, { dy: -11, align: 'center', color: 'muted', size: 11.5 }); }
          if (terms.value) {
            sL.curve((t) => [P(t), t1(P(t))], 0, 1, { color: 'orange', width: 1.6, dash: [6, 4], n: 300 });
            sL.curve((t) => [P(t), t2(P(t))], 0, 1, { color: 'purple', width: 1.6, dash: [6, 4], n: 300 });
          }
          sL.curve((t) => [P(t), h2(P(t))], 0, 1, { color: 'accent', width: 2.8, n: 500 });
          const w = b - a;
          if (p > 0 && p < 1) { const m = Math.log2((1 - p) / p); sL.clip(() => sL.line(p - w, hp - m * w, p + w, hp + m * w, { color: 'green', width: 1.8 })); }
          else sL.vline(p, { color: 'green', width: 1.8 });
          if (!z && Math.abs(p - 0.5) > 0.004) { sL.line(p, hp, 1 - p, hp, { color: 'muted', width: 1.2, dash: [4, 4] }); sL.dot(1 - p, hp, { r: 5, color: 'accent', hollow: true, width: 2 }); }
          if (terms.value && hp > 0) {
            sL.line(p, 0, p, t1(p), { color: 'orange', width: 5, cap: 'butt' });
            sL.line(p, t1(p), p, hp, { color: 'purple', width: 5, cap: 'butt' });
          }
          // the flips
          const u = flips(); let k = 0;
          u.forEach((x, i) => {
            const col = i % 20, row = Math.floor(i / 20), cx = col + 0.5, cy = 12.9 - row - 0.5, hd = x < p; if (hd) k++;
            if (hd) sR.rect(cx - 0.38, cy - 0.38, cx + 0.38, cy + 0.38, { fill: 'gold', fillAlpha: 0.9, color: 'gold', width: 1 });
            else sR.rect(cx - 0.38, cy - 0.38, cx + 0.38, cy + 0.38, { color: 'muted', width: 1, alpha: 0.6 });
          });
          const bpf = (k ? -k * Math.log2(p) : 0) / 200 + (200 - k ? -(200 - k) * Math.log2(1 - p) : 0) / 200;
          const y0 = sR.Y(2.9), xm = sR.X(10);
          sR.textPx(`${k} heads, ${200 - k} tails`, xm, y0 + 16, { align: 'center', size: 12.5, weight: 600, color: 'ink' });
          sR.texPx(`\\text{these flips: } -\\tfrac1{200}\\log_2 P = ${v.fix(bpf, 3)}\\text{ bits each}`, xm, y0 + 42, { size: 14, color: 'gold' });
          sR.texPx(`\\text{entropy: } h(p) = ${v.fix(hp, 3)}\\text{ bits per flip}`, xm, y0 + 68, { size: 14, color: 'accent' });
        });
        v.readout(() => {
          const p = hP.x, hp = h2(p), m = p > 0 && p < 1 ? v.fix(Math.log2((1 - p) / p), 3) : p === 0 ? '+\\infty' : '-\\infty';
          return String.raw`$h(${v.fix(p, 3)}) = ${v.fix(hp, 4)}$ bits $= h(${v.fix(1 - p, 3)})$ · slope $h'(p) = \log_2\frac{1-p}{p} = ${m}$ · maximum $h(\tfrac12) = 1$ bit` + (Math.abs(p - 0.5) < 0.2 ? ` · near the top $h(p)\\approx $1-\\frac{2}{\\ln 2}(p-\\tfrac12)^2 = ${v.fix(1 - (2 / Math.LN2) * (p - 0.5) ** 2, 4)}$` : p < 0.06 ? ` · near $0$, $h(p)\\approx p\\log_2\\frac1p = ${v.fix(-p * Math.log2(Math.max(p, 1e-12)), 4)}$` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'The uniform distribution maximizes entropy',
      statement: String.raw`If $X$ takes at most $n$ values, then
$$0\le H(X)\le\log_2 n ,$$
with $H(X)=0$ exactly when $X$ is constant and $H(X)=\log_2 n$ exactly when $X$ is uniform on $n$ values. More precisely, $H(X)\le\log_2|\supp p|$, where $\supp p=\{x:p(x)>0\}$, with equality exactly for the uniform distribution on the support; and moving probability from a more likely outcome to a less likely one, without reversing their order, never decreases $H$.`,
      idea: String.raw`Apply Jensen's inequality (rca-3.3) to the concave logarithm and the random variable $1/p(X)$, which takes values only on the support: $H(X)=\mathbb E\log_2\frac1{p(X)}\le\log_2\mathbb E\frac1{p(X)}=\log_2\sum_{x\in\supp p}1=\log_2|\supp p|\le\log_2 n$. Equality in Jensen holds only when $1/p(X)$ is constant, i.e. $p$ is uniform on its support, and the second inequality is an equality only when nothing has probability zero. So the gap $\log_2 n-H$ splits into a part due to impossible outcomes and a Jensen part due to unequal probabilities; it equals the relative entropy $D(p\,\|\,u)$ from the uniform distribution (info-2.1). The transfer statement is the concavity and symmetry of $H$: a "Robin Hood" transfer moves $p$ along a segment toward the centre of the simplex.`,
      caption: String.raw`**Three outcomes:** every distribution $(p_a,p_b,p_c)$ is a point of the triangle, shaded darker where $H$ is larger, with contours of $H$ in bits. Drag $p$: $H$ never passes $\log_2 3$, which is reached only at the centre, and on an edge (one outcome impossible) it cannot exceed $1$ bit. *Robin Hood transfer* moves a third of the difference from the most to the least likely outcome; the gold trail climbs the contours. **27 letters:** the letter frequencies of the *Alice* sample against the uniform level $1/27$; the slider mixes them toward uniform and the right panel shows $H$ rising, concave, to $\log_2 27$ only at the end.`,
      deps: ['info-1.2', 'rca-3.3'],
      refs: ['Cover–Thomas §2.6'],
      tags: ['entropy', 'jensen', 'maximum entropy'],
      viz(v) {
        const T = textStats(), S3 = Math.sqrt(3) / 2, LOG3 = Math.log2(3), L27 = Math.log2(27);
        const mode = v.select('outcomes', [{ value: '3', label: 'three (the simplex)' }, { value: 'text', label: '27 letters of English' }], '3');
        const mix = v.slider('mix toward uniform $t$', 0, 1, 0.3, { step: 0.01 });
        let trail = [];
        const toXY = (q) => [q[1] + 0.5 * q[2], S3 * q[2]];
        const toP = (x, y) => { const c = y / S3, b = x - 0.5 * c; return [1 - b - c, b, c]; };
        const proj = (x, y) => { let q = toP(x, y).map((t) => Math.max(0, t)); const s = sum(q); q = q.map((t) => t / s); q = q.map((t) => (t < 0.004 ? 0 : t)); const s2 = sum(q); return toXY(q.map((t) => t / s2)); };
        const sT = v.stage({ x: [-0.1, 1.1], y: [-0.13, 0.98], height: 330, equal: true, axes: false, title: 'distributions on three outcomes, shaded by $H$' });
        const sG = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', title: 'the bars, and $H$ against its ceiling' });
        const sL = v.stage({ x: [0, 1], y: [0, 0.2], height: 330, axes: 'box', title: 'letter frequencies (sorted) mixed toward uniform' });
        const sM = v.stage({ x: [0, 1], y: [3.9, 4.9], height: 330, axes: 'box', title: '$H$ of the mixture against $t$' });
        const hP = sT.handle(...toXY([0.62, 0.28, 0.1]), { color: 'accent', label: 'p', constrain: proj });
        hP.onDrag = () => { trail = []; };
        const cur = () => toP(hP.x, hP.y).map((t) => Math.max(0, t));
        const rh = v.button('Robin Hood transfer', () => {
          const q = cur(), i = q.indexOf(Math.max(...q)), j = q.indexOf(Math.min(...q)), t = (q[i] - q[j]) / 3;
          if (t < 1e-4) return; if (!trail.length) trail.push(q.slice());
          q[i] -= t; q[j] += t; trail.push(q.slice()); hP.set(...toXY(q));
        });
        const order = T.freq.map((f, k) => [f, k]).sort((a, b) => b[0] - a[0]);
        const pt = (t) => order.map(([f]) => (1 - t) * f + t / 27);
        const lg = legender(v);
        v.render(() => {
          const three = mode.value === '3';
          sT.el.style.display = sG.el.style.display = three ? '' : 'none';
          sL.el.style.display = sM.el.style.display = three ? 'none' : '';
          mix.el.hidden = three; rh.hidden = !three;
          // ── simplex
          const A = v.rgb('accent');
          sT.raster((x, y) => { const q = toP(x, y); if (q[0] < -0.003 || q[1] < -0.003 || q[2] < -0.003) return null; const h = H(q.map((t) => Math.max(0, t))) / LOG3; return [A[0], A[1], A[2], Math.round(18 + 150 * h * h)]; }, { res: 3, key: 'simplex|' + v.color('accent') });
          sT.contour((x, y) => { const q = toP(x, y); return q[0] < 0 || q[1] < 0 || q[2] < 0 ? NaN : H(q); }, [0.5, 1, 1.3, 1.5], { color: 'muted', width: 1, labels: true, fmt: (L) => v.fix(L, 1) });
          const V = [[0, 0], [1, 0], [0.5, S3]];
          sT.poly(V, { color: 'ink', width: 1.6 });
          ['a', 'b', 'c'].forEach((nm, i) => sT.text(`${nm} certain: H = 0`, V[i][0], V[i][1], { dx: i === 0 ? -4 : i === 1 ? 4 : 0, dy: i === 2 ? -11 : 14, align: i === 0 ? 'left' : i === 1 ? 'right' : 'center', size: 11, color: 'muted' }));
          sT.dot(0.5, S3 / 3, { r: 5, color: 'green' }); sT.text('uniform', 0.5, S3 / 3, { dy: 13, align: 'center', color: 'green', size: 11.5, weight: 600 });
          if (trail.length > 1) { sT.path(trail.map(toXY), { color: 'gold', width: 2 }); trail.forEach((q) => sT.dot(...toXY(q), { r: 3, color: 'gold' })); }
          const q = cur(), Hq = H(q), supp = q.filter((t) => t > 0).length;
          viewPad(sG, [-0.6, 3.9], [0, 1.05]); sG.setTicks([[0, 'a'], [1, 'b'], [2, 'c']], [0, 0.25, 0.5, 0.75, 1]);
          q.forEach((t, i) => sG.rect(i - 0.34, 0, i + 0.34, t, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.5 }));
          sG.line(-0.45, 1 / 3, 2.45, 1 / 3, { color: 'orange', width: 1.5, dash: [6, 4] }); sG.text('⅓', 2.45, 1 / 3, { dx: 3, color: 'orange', size: 12 });
          const gx = 3.25, gw = 0.32;
          sG.line(2.8, 0, 2.8, 1.02, { color: 'faint', width: 1 });
          sG.rect(gx - gw, 0, gx + gw, Hq / LOG3, { fill: 'green', fillAlpha: 0.6, color: 'green', width: 1.2 });
          sG.rect(gx - gw, Hq / LOG3, gx + gw, 1, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.2 });
          sG.text('log₂3', gx, 1, { dy: -9, align: 'center', size: 11, color: 'orange', weight: 600 });
          sG.text(`H ${v.fix(Hq, 3)}`, gx, Math.min(0.9, Hq / LOG3 / 2), { align: 'center', size: 10.5, color: 'ink', weight: 600 });
          if (1 - Hq / LOG3 > 0.09) sG.text(`gap ${v.fix(LOG3 - Hq, 3)}`, gx, (1 + Hq / LOG3) / 2, { align: 'center', size: 10.5, color: 'red', weight: 600 });
          if (supp < 3) sG.corner(`${3 - supp} outcome${supp === 1 ? 's' : ''} impossible: H ≤ log₂ ${supp}`, 'tl', { color: 'red', size: 11.5 });
          // ── letters
          const t = mix.value, P = pt(t), P0 = pt(0), Ht = H(P);
          viewPad(sL, [-0.8, 26.8], [0, 0.215]); sL.setTicks(order.map(([, k], i) => [i, ALPH_SHOW(k)]), null);
          P.forEach((x, i) => { sL.rect(i - 0.38, 0, i + 0.38, x, { fill: 'accent', fillAlpha: 0.5, stroke: false }); if (t > 0) sL.line(i - 0.38, P0[i], i + 0.38, P0[i], { color: 'muted', width: 1.3 }); });
          sL.hline(1 / 27, { color: 'orange', width: 1.5, dash: [6, 4] }); sL.text('uniform 1/27', 26.8, 1 / 27, { align: 'right', dy: -9, color: 'orange', size: 11.5 });
          viewPad(sM, [0, 1], [3.95, 4.85]);
          sM.line(0, H(P0), 1, L27, { color: 'muted', width: 1.2, dash: [4, 4] });
          sM.hline(L27, { color: 'orange', width: 1.5, dash: [6, 4] }); sM.text(`log₂ 27 = ${v.fix(L27, 3)}`, 0.02, L27, { dx: 30, dy: -9, color: 'orange', size: 11.5 });
          sM.fn((s) => H(pt(s)), { domain: [0, 1], color: 'accent', width: 2.6, n: 120 });
          sM.line(t, Ht, t, L27, { color: 'red', width: 3 }); sM.dot(t, Ht, { r: 5.5, color: 'green' });
          sM.text(`H = ${v.fix(Ht, 3)}`, t, Ht, { dx: t > 0.7 ? -10 : 10, dy: 12, align: t > 0.7 ? 'right' : 'left', color: 'green', weight: 600 });
          lg(three ? [['accent', 'darker: larger $H$', { area: true }], ['green', 'uniform: $H = \\log_2 3$', { dot: true }], ['gold', 'Robin Hood transfers'], ['red', 'gap $\\log_2 3 - H$', { area: true }]]
            : [['accent', 'mixed frequencies $(1-t)p + t/27$', { area: true }], ['muted', 'English frequencies $p$'], ['orange', 'uniform', { dash: true }], ['red', 'gap to $\\log_2 27$']]);
        });
        v.readout(() => {
          if (mode.value === '3') {
            const q = cur(), Hq = H(q), supp = q.filter((t) => t > 0).length;
            return String.raw`$p = (${q.map((t) => v.fix(t, 3)).join(',\\ ')})$: $H(p) = ${v.fix(Hq, 3)}\le\log_2 3 = ${v.fix(LOG3, 3)}$ bits · gap $${v.fix(LOG3 - Hq, 3)}$ $=$ $${v.fix(LOG3 - Math.log2(supp), 3)}$ (impossible outcomes, $\log_2 3-\log_2|\supp p|$) $+$ $${v.fix(Math.log2(supp) - Hq, 3)}$ (Jensen gap, unequal probabilities)` + (trail.length > 1 ? ` · ${trail.length - 1} transfer${trail.length > 2 ? 's' : ''}: $H$ went ${trail.map((r) => v.fix(H(r), 3)).join(' → ')}` : '');
          }
          const t = mix.value, Ht = H(pt(t));
          return String.raw`English letters and space: $H = ${v.fix(T.H, 3)}$ bits · mixed with $t = ${v.fix(t, 2)}$: $H = ${v.fix(Ht, 3)}$, still ${v.fix(L27 - Ht, 3)} below $\log_2 27 = ${v.fix(L27, 3)}$ (equal only at $t = 1$) · redundancy of the letter frequencies $1 - H/\log_2 27 = ${v.fix(100 * (1 - T.H / L27), 1)}$%`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Concept',
      name: 'Entropy as the number of yes/no questions',
      statement: String.raw`In the game of twenty questions an object $X$ is drawn from a known distribution $p$ and identified by asking questions of the form "is $X$ in the set $S$?". A questioning strategy is a binary tree whose leaves are the objects; if object $x$ sits at depth $d(x)$, the expected number of questions is $L=\sum_x p(x)\,d(x)$. Every strategy needs at least $H(X)$ questions on average, and the best strategy needs fewer than $H(X)+1$:
$$H(X)\le L^*<H(X)+1 ,$$
with $L^*=H(X)$ exactly when every probability is a power of $\tfrac12$. The best tree is found by Huffman's algorithm: repeatedly join the two least likely groups under a new question.`,
      idea: String.raw`Reading the answers yes/no as bits, a strategy is a prefix code with codeword lengths $d(x)$, so $\sum_x2^{-d(x)}\le1$ (Kraft, info-4.3). Then $L-H=\sum_xp(x)\log_2\frac{p(x)}{2^{-d(x)}}\ge0$ by Gibbs' inequality, with equality only if $p(x)=2^{-d(x)}$: an ideal question splits the remaining probability exactly in half and so delivers one full bit. Rounding the ideal depths $\log_2\frac1{p(x)}$ up to integers still satisfies Kraft and costs less than one extra question, which gives $L^*<H+1$; Huffman's greedy merging (algo-10.10) attains the optimum. The expected number of questions also equals the sum of the probabilities written on the internal nodes, since each question is asked exactly when the object lies below it.`,
      caption: String.raw`Build your own strategy: click a group, then another, to join them under a question ("is it on the left?"); the number on a question node is the probability that it gets asked. When one tree remains, each object shows its number of questions and its yes/no path. *Best tree* runs Huffman's merging; *Play* draws hidden objects and counts the questions your tree asks. On the right, the best tree always lands in the green band $[H,\,H+1)$, whereas a careless tree can fall outside it; the *dyadic* set reaches $H$ exactly, and *nearly certain* shows why the $+1$ is needed.`,
      deps: ['info-1.2', 'algo-10.10'],
      see: ['info-4.3', 'info-4.5', 'algo-10.11'],
      refs: ['MacKay ch. 4', 'Cover–Thomas §5.6'],
      tags: ['entropy', 'questions', 'huffman'],
      viz(v) {
        const NAMES = ['cat', 'dog', 'owl', 'fox', 'cow', 'bat', 'yak', 'emu'];
        const PRE = { skewed: [0.3, 0.2, 0.15, 0.12, 0.09, 0.07, 0.04, 0.03], uniform: new Array(8).fill(0.125), dyadic: [64, 32, 16, 8, 4, 2, 1, 1].map((x) => x / 128), sure: [0.93, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01] };
        let P = PRE.skewed.slice(), nodes = [], sel = null, game = null, played = null, gseed = 1;
        const reset = () => { nodes = P.map((w, i) => ({ id: i, w, kids: null, parent: null, leaf: i })); sel = null; game = null; played = null; };
        const merge = (a, b) => { const nd = { id: nodes.length, w: nodes[a].w + nodes[b].w, kids: [a, b], parent: null }; nodes[a].parent = nd.id; nodes[b].parent = nd.id; nodes.push(nd); game = null; played = null; };
        const roots = () => nodes.filter((n) => n.parent === null);
        const rootOf = (id) => { while (nodes[id].parent !== null) id = nodes[id].parent; return id; };
        const halving = () => { reset(); let lv = nodes.map((n) => n.id); while (lv.length > 1) { const nx = []; for (let i = 0; i + 1 < lv.length; i += 2) { merge(lv[i], lv[i + 1]); nx.push(nodes.length - 1); } if (lv.length % 2) nx.push(lv[lv.length - 1]); lv = nx; } };
        const huffman = () => { reset(); while (roots().length > 1) { const r = roots().sort((a, b) => a.w - b.w || a.id - b.id); merge(r[0].id, r[1].id); } };
        const bestL = () => { let w = P.slice(), c = 0; while (w.length > 1) { w.sort((a, b) => a - b); const m = w[0] + w[1]; c += m; w = [m, ...w.slice(2)]; } return c; };
        const depth = (i) => { let d = 0, id = i; while (nodes[id].parent !== null) { id = nodes[id].parent; d++; } return d; };
        const complete = () => roots().length === 1;
        halving();
        v.select('objects', [{ value: 'skewed', label: 'skewed' }, { value: 'uniform', label: 'equally likely' }, { value: 'dyadic', label: 'dyadic ($\\tfrac12, \\tfrac14, \\dots$)' }, { value: 'sure', label: 'nearly certain' }], 'skewed', { onChange: (k) => { P = PRE[k].slice(); halving(); } });
        v.button('Undo', () => { const last = nodes[nodes.length - 1]; if (last.kids) { nodes.pop(); last.kids.forEach((k) => (nodes[k].parent = null)); sel = null; game = null; played = null; } });
        v.button('Clear', reset);
        v.button('Halving tree', halving);
        v.button('Best tree (Huffman)', huffman);
        const draw = (r) => { let u = r(), i = 0; while (i < 7 && u >= P[i]) { u -= P[i]; i++; } return i; };
        v.button('Play a game', () => { if (!complete()) return; const r = v.rng(hashStr('game|' + gseed++)); const i = draw(r); const path = [i]; let id = i; while (nodes[id].parent !== null) { id = nodes[id].parent; path.push(id); } game = { leaf: i, path }; });
        v.button('Play 1,000 games', () => { if (!complete()) return; const r = v.rng(hashStr('games|' + gseed++)); let s = 0; for (let k = 0; k < 1000; k++) s += depth(draw(r)); played = { n: 1000, avg: s / 1000 }; });
        const s = v.stage({ x: [-0.6, 7.6], y: [-2, 4], height: 360, axes: false, weight: 1.7, title: 'your question tree (click two groups to join them)' });
        const sR = v.stage({ x: [0, 1], y: [0, 4], height: 360, axes: 'box', title: 'expected number of questions' });
        let lay = null;
        const layout = () => {
          const minLeaf = (id) => (nodes[id].kids ? Math.min(...nodes[id].kids.map(minLeaf)) : nodes[id].leaf);
          const rs = roots().sort((a, b) => minLeaf(a.id) - minLeaf(b.id)), pos = {}, kidsOrd = {}; let x = 0, maxH = 0;
          const place = (id) => {
            const nd = nodes[id]; if (!nd.kids) { pos[id] = [x++, 0]; return 0; }
            const ks = nd.kids.slice().sort((a, b) => minLeaf(a) - minLeaf(b)); kidsOrd[id] = ks;
            const hgt = 1 + Math.max(...ks.map(place)); pos[id] = [(pos[ks[0]][0] + pos[ks[1]][0]) / 2, hgt]; return hgt;
          };
          rs.forEach((r) => (maxH = Math.max(maxH, place(r.id))));
          return { pos, kidsOrd, maxH };
        };
        s.onClick((x, y) => {
          if (!lay) return; let best = null, bd = 24;
          for (const nd of nodes) { const [nx, ny] = lay.pos[nd.id]; const d = Math.hypot(s.X(nx) - s.X(x), s.Y(ny) - s.Y(y)); if (d < bd) { bd = d; best = nd.id; } }
          if (best === null) { sel = null; return; }
          const r = rootOf(best);
          if (sel === null) sel = r; else if (sel === r) sel = null; else { merge(sel, r); sel = null; }
        });
        const pathOf = (i) => { let id = i, code = ''; while (nodes[id].parent !== null) { const par = nodes[id].parent; code = (lay.kidsOrd[par][0] === id ? 'Y' : 'N') + code; id = par; } return code; };
        v.render(() => {
          lay = layout();
          const { pos, kidsOrd, maxH } = lay, top = Math.max(3, maxH) + 1.15, done = complete(), onPath = new Set(game ? game.path : []);
          s.setView([-0.6, 7.6], [-2.45, top]);
          for (const nd of nodes) if (nd.kids) {
            const [xn, yn] = pos[nd.id];
            kidsOrd[nd.id].forEach((k, j) => {
              const [xk, yk] = pos[k], hot = onPath.has(k) && onPath.has(nd.id);
              s.path([[xk, yk], [xk, yn], [xn, yn]], { color: hot ? 'gold' : 'muted', width: hot ? 3.4 : 1.6 });
              s.text(j === 0 ? 'yes' : 'no', xk, yn - 0.32, { align: 'center', size: 9.5, color: 'muted' });
            });
          }
          for (const nd of nodes) {
            const [x, y] = pos[nd.id];
            if (nd.kids) {
              const isRoot = nd.parent === null;
              if (sel === nd.id) s.dot(x, y, { r: 21, color: 'gold', alpha: 0.35 });
              s.dot(x, y, { r: 15, color: isRoot && done ? 'green' : 'accent', hollow: true, width: 2.2 });
              s.text(v.fix(nd.w, 2).replace(/^0/, ''), x, y, { align: 'center', size: 10.5, weight: 700, color: 'ink' });
            } else {
              const r = 6 + 17 * Math.sqrt(nd.w);
              if (sel === nd.id) s.dot(x, y, { r: r + 6, color: 'gold', alpha: 0.35 });
              s.dot(x, y, { r, color: onPath.has(nd.id) ? 'gold' : 'accent', alpha: 0.75 });
              s.text(NAMES[nd.leaf], x, -0.62, { align: 'center', size: 12.5, weight: 600, color: 'ink' });
              s.text(v.fix(nd.w, 3).replace(/^0/, ''), x, -1.02, { align: 'center', size: 11, color: 'muted' });
              if (done) { s.text(`${depth(nd.id)} question${depth(nd.id) === 1 ? '' : 's'}`, x, -1.5, { align: 'center', size: 10.5, color: 'teal', weight: 600 }); s.text(pathOf(nd.id), x, -1.9, { align: 'center', size: 10.5, color: 'teal', weight: 700 }); }
            }
          }
          if (!done) s.corner(`${roots().length} groups: click two to join them under one question`, 'tl', { size: 12 });
          else if (game) s.corner(`it was the ${NAMES[game.leaf]}: found with ${game.path.length - 1} questions`, 'tl', { color: 'gold', weight: 600, size: 12 });
          // comparison
          const Hp = H(P), Ls = bestL(), L = done ? sum(nodes.filter((n) => n.kids).map((n) => n.w)) : NaN, ymax = Math.max(Hp + 1, done ? L : 0, played ? played.avg : 0) + 0.45;
          viewPad(sR, [-0.6, 3.6], [0, ymax]); sR.setTicks([[0, 'H'], [1, 'best'], [2, 'yours'], [3, 'played']], null);
          sR.hband(Hp, Hp + 1, { color: 'green', alpha: 0.1 });
          sR.hline(Hp + 1, { color: 'orange', width: 1.5, dash: [6, 4] }); sR.text('H + 1', 3.6, Hp + 1, { align: 'right', dy: -9, color: 'orange', size: 11.5 });
          const bar = (i, val, col, hollow) => { if (!(val > 0)) return; sR.rect(i - 0.3, 0, i + 0.3, val, hollow ? { color: col, width: 2 } : { fill: col, fillAlpha: 0.6, color: col, width: 1.3 }); sR.text(v.fix(val, 3), i, val, { dy: -9, align: 'center', size: 11, weight: 700, color: col }); };
          bar(0, Hp, 'green'); bar(1, Ls, 'accent'); bar(2, L, 'gold'); if (played) bar(3, played.avg, 'gold', true);
          if (!done) sR.text('unfinished', 2, 0.25, { align: 'center', size: 10.5, color: 'muted' });
        });
        v.legend([['accent', 'objects (size: probability)', { dot: true }], ['accent', 'question nodes: probability of being asked'], ['teal', 'questions needed · yes/no path'], ['green', 'band $[H, H+1)$', { area: true }]]);
        v.readout(() => {
          const Hp = H(P), Ls = bestL();
          if (!complete()) return String.raw`${roots().length} groups left · $H = ${v.fix(Hp, 3)}$ bits; the best tree needs $L^* = ${v.fix(Ls, 3)}$ questions on average`;
          const L = sum(nodes.filter((n) => n.kids).map((n) => n.w));
          return String.raw`your tree: $L = \sum_x p(x)d(x) = ${v.fix(L, 3)}$ questions on average (the sum of the numbers on its question nodes) · best tree $L^* = ${v.fix(Ls, 3)}$ · $H = ${v.fix(Hp, 3)}\le L^* < H + 1$ ✓` + (L > Hp + 1 + 1e-9 ? ' · your tree needs more than $H + 1$: only the best tree is guaranteed to stay below' : Math.abs(L - Ls) < 1e-9 ? ' · yours is optimal' : '') + (played ? ` · ${commas(played.n)} games played: ${v.fix(played.avg, 3)} questions each on average` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Joint and conditional entropy',
      statement: String.raw`For discrete random variables $X,Y$ with joint distribution $p(x,y)$, the **joint entropy** is the entropy of the pair,
$$H(X,Y)=-\sum_{x,y}p(x,y)\log_2 p(x,y),$$
and the **conditional entropy** of $Y$ given $X$ is the average, over $x$, of the entropy of the conditional distribution $p(y\mid x)$:
$$H(Y\mid X)=\sum_x p(x)\,H(Y\mid X=x)=-\sum_{x,y}p(x,y)\log_2 p(y\mid x).$$
It is the uncertainty left about $Y$ once $X$ is known. $H(Y\mid X)=0$ exactly when $Y$ is a function of $X$, and $H(Y\mid X)=H(Y)$ when $X$ and $Y$ are independent; in general $H(Y\mid X)\ne H(X\mid Y)$, but the two orders agree after adding the remaining marginal: $H(X)+H(Y\mid X)=H(X,Y)=H(Y)+H(X\mid Y)$ (1.7).`,
      idea: String.raw`Both definitions are the entropy of 1.2 applied to the right distribution: the joint one to the table $p(x,y)$ viewed as one distribution on pairs, the conditional one row by row to the rows $p(\cdot\mid x)=p(x,\cdot)/p(x)$, then averaged with the row weights. The pieces fit into an area diagram: draw discs of areas $H(X)$ and $H(Y)$ overlapping in the amount $H(X)+H(Y)-H(X,Y)$, the information they share (the mutual information of info-2.5); then the union is $H(X,Y)$ and the two crescents are $H(X\mid Y)$ and $H(Y\mid X)$. The diagram is honest bookkeeping for two variables, not a picture of sets.`,
      caption: String.raw`Drag up or down inside a cell of the joint table to change its probability (the others rescale; drag to the bottom for a $0$). The right margin shows each row's weight $p(x)$ and the entropy $H(Y\mid X=x)$ of that row as a teal bar; $H(Y\mid X)$ is their average. On the right the discs have areas $H(X)$ and $H(Y)$ and overlap by exactly the shared information, so the crescents are the conditional entropies and the whole shaded area is $H(X,Y)$. Presets: *independent* makes the discs just touch, *Y = f(X)* puts the $Y$ disc inside the $X$ disc, *Y = X* makes them coincide.`,
      deps: ['info-1.2'],
      refs: ['Cover–Thomas §2.2'],
      tags: ['joint entropy', 'conditional entropy'],
      credit: 'Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Conditional_entropy' },
      viz(v) {
        const PRE = {
          noisy: [[0.36, 0.02, 0.02], [0.06, 0.2, 0.09], [0.05, 0.05, 0.15]],
          indep: [0.5, 0.3, 0.2].map((a) => [0.45, 0.35, 0.2].map((b) => a * b)),
          func: [[0.3, 0, 0], [0.3, 0, 0], [0, 0.4, 0]],
          same: [[0.5, 0, 0], [0, 0.3, 0], [0, 0, 0.2]],
        };
        let P = PRE.noisy.flat();
        v.select('table', [{ value: 'noisy', label: 'noisy copy' }, { value: 'indep', label: 'independent' }, { value: 'func', label: '$Y = f(X)$' }, { value: 'same', label: '$Y = X$' }], 'noisy', { onChange: (k) => { P = PRE[k].flat(); } });
        const sT = v.stage({ x: [-0.75, 4.8], y: [-3.95, 0.75], height: 320, equal: true, axes: false, title: 'joint table $p(x, y)$ — drag inside a cell' });
        const sV = v.stage({ x: [-3, 3], y: [-2.35, 2.45], height: 320, equal: true, axes: false, title: 'areas: $H(X)$, $H(Y)$ and what they share' });
        let drag = null;
        sT.onDrag((x, y, phase) => {
          if (phase === 'start') { const j = Math.floor(x), i = Math.floor(-y); drag = i >= 0 && i < 3 && j >= 0 && j < 3 ? { k: 3 * i + j, p0: P[3 * i + j], y0: y } : null; }
          else if (drag) setProb(P, drag.k, drag.p0 + (y - drag.y0) * 0.35);
          if (phase === 'end') drag = null;
        });
        const stats = () => {
          const px = [0, 1, 2].map((i) => P[3 * i] + P[3 * i + 1] + P[3 * i + 2]), py = [0, 1, 2].map((j) => P[j] + P[3 + j] + P[6 + j]);
          const rowH = [0, 1, 2].map((i) => H(P.slice(3 * i, 3 * i + 3)));
          const HX = H(px), HY = H(py), HXY = H(P), HYgX = sum(px.map((w, i) => w * rowH[i]));
          return { px, py, rowH, HX, HY, HXY, HYgX, HXgY: HXY - HY, I: Math.max(0, HX + HY - HXY) };
        };
        v.legend([['accent', '$H(X\\mid Y)$: only about $X$', { area: true }], ['purple', 'shared', { area: true }], ['teal', '$H(Y\\mid X)$: only about $Y$', { area: true }]]);
        v.render(() => {
          const S = stats();
          // ── the table
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const q = P[3 * i + j], x0 = j, y0 = -i - 1, side = 0.72 * Math.sqrt(q);
            sT.rect(x0 + 0.03, y0 + 0.03, x0 + 0.97, y0 + 0.97, { color: drag && drag.k === 3 * i + j ? 'gold' : 'faint', width: drag && drag.k === 3 * i + j ? 2.2 : 1.2 });
            if (q > 0) sT.rect(x0 + 0.5 - side / 2, y0 + 0.6 - side / 2, x0 + 0.5 + side / 2, y0 + 0.6 + side / 2, { fill: 'accent', fillAlpha: 0.45, stroke: false });
            sT.text(q > 0 ? v.fix(q, 3) : '0', x0 + 0.5, y0 + 0.15, { align: 'center', size: 11.5, weight: 600, color: q > 0 ? 'ink' : 'muted', halo: false });
          }
          for (let k = 0; k < 3; k++) {
            sT.tex(`y_${k + 1}`, k + 0.5, 0.3, { color: 'teal', size: 15 });
            sT.tex(`x_${k + 1}`, -0.35, -k - 0.5, { color: 'accent', size: 15 });
            sT.text(v.fix(S.py[k], 2), k + 0.5, -3.45, { align: 'center', size: 12, color: 'teal', weight: 600 });
            sT.text(v.fix(S.px[k], 2), 3.38, -k - 0.5, { align: 'center', size: 12, color: 'accent', weight: 600 });
            const bw = (0.75 * S.rowH[k]) / Math.log2(3);
            sT.rect(3.72, -k - 0.66, 3.72 + bw, -k - 0.34, { fill: 'teal', fillAlpha: 0.55, stroke: false });
            sT.text(v.fix(S.rowH[k], 2), 3.72 + bw, -k - 0.5, { dx: 4, size: 11, color: 'teal' });
          }
          sT.tex('p(y)', -0.3, -3.45, { color: 'teal', size: 13, align: 'right' });
          sT.tex('p(x)', 3.38, 0.3, { color: 'accent', size: 13 });
          sT.tex('H(Y|x)', 4.15, 0.3, { color: 'teal', size: 13 });
          // ── area diagram (1 bit = K units of area)
          const K = 1.45, rX = Math.sqrt((K * S.HX) / Math.PI), rY = Math.sqrt((K * S.HY) / Math.PI), target = K * S.I;
          let d;
          if (rX < 1e-9 || rY < 1e-9) d = rX + rY;
          else if (target <= 1e-9) d = rX + rY + 0.02;
          else if (target >= Math.PI * Math.min(rX, rY) ** 2 - 1e-9) d = Math.abs(rX - rY);
          else { let lo = Math.abs(rX - rY), hi = rX + rY; for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (lensArea(rX, rY, m) > target) lo = m; else hi = m; } d = (lo + hi) / 2; }
          const sh = -(Math.min(-rX, d - rY) + Math.max(rX, d + rY)) / 2;
          const cX = sh, cY = sh + d, cyv = -0.2, xl = cX - rX, xr = cX + rX, yl = cY - rY, yr = cY + rY;
          if (rX > 0) sV.circle(cX, cyv, rX, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          if (rY > 0) sV.circle(cY, cyv, rY, { fill: 'teal', fillAlpha: 0.22, color: 'teal', width: 2 });
          // the lens in purple
          if (S.I > 1e-6 && rX > 0 && rY > 0) {
            const pts = [];
            if (d <= Math.abs(rX - rY) + 1e-9) { const r = Math.min(rX, rY), c = rX < rY ? cX : cY; for (let k = 0; k <= 80; k++) pts.push([c + r * Math.cos((k / 80) * 2 * Math.PI), cyv + r * Math.sin((k / 80) * 2 * Math.PI)]); }
            else {
              const a = Math.acos(clamp((d * d + rX * rX - rY * rY) / (2 * d * rX), -1, 1)), b = Math.acos(clamp((d * d + rY * rY - rX * rX) / (2 * d * rY), -1, 1));
              for (let k = 0; k <= 40; k++) { const t = -a + (2 * a * k) / 40; pts.push([cX + rX * Math.cos(t), cyv + rX * Math.sin(t)]); }
              for (let k = 0; k <= 40; k++) { const t = Math.PI - b + (2 * b * k) / 40; pts.push([cY + rY * Math.cos(t), cyv + rY * Math.sin(t)]); }
            }
            sV.poly(pts, { fill: 'purple', fillAlpha: 0.45, color: 'purple', width: 1.5 });
          }
          // labels above, with leaders to their regions
          const regions = [
            ['H(X\\mid Y)', S.HXgY, 'accent', -2.05, (xl + Math.min(yl, xr)) / 2],
            ['\\text{shared}', S.I, 'purple', 0, (Math.max(xl, yl) + Math.min(xr, yr)) / 2],
            ['H(Y\\mid X)', S.HYgX, 'teal', 2.05, (yr + Math.max(xr, yl)) / 2],
          ];
          for (const [nm, val, col, lx, rx] of regions) {
            sV.tex(nm, lx, 2.25, { color: col, size: 14 });
            sV.text(v.fix(val, 3) + ' bits', lx, 1.9, { align: 'center', color: col, size: 11.5, weight: 600 });
            if (val > 0.003) sV.line(lx, 1.76, rx, cyv + 0.05, { color: col, width: 1, alpha: 0.7 });
          }
          if (rX > 0) sV.tex(`H(X) = ${v.fix(S.HX, 3)}`, cX - 0.72 * rX, cyv - 0.72 * rX, { dx: -4, dy: 4, color: 'accent', size: 13, align: 'right', baseline: 'top' });
          if (rY > 0) sV.tex(`H(Y) = ${v.fix(S.HY, 3)}`, cY + 0.72 * rY, cyv - 0.72 * rY, { dx: 4, dy: 4, color: 'teal', size: 13, align: 'left', baseline: 'top' });
          sV.tex(`\\text{union} = H(X,Y) = ${v.fix(S.HXY, 3)}`, 0, -2.25, { color: 'ink', size: 13, baseline: 'bottom' });
          const sq = Math.sqrt(K / 4); sV.rect(2.95 - sq, -2.15, 2.95, -2.15 + sq, { color: 'muted', width: 1, dash: [3, 3] }); sV.text('¼ bit', 2.95 - sq / 2, -2.15 + sq, { dy: -8, align: 'center', size: 10.5, color: 'muted' });
        });
        v.readout(() => {
          const S = stats();
          return String.raw`$H(X) = ${v.fix(S.HX, 3)}$, $H(Y) = ${v.fix(S.HY, 3)}$, $H(X,Y) = ${v.fix(S.HXY, 3)}$ bits · $H(Y\mid X) = \sum_x p(x)H(Y\mid X=x) = ${S.px.map((w, i) => v.fix(w, 2) + '\\cdot' + v.fix(S.rowH[i], 2)).join('+')} = ${v.fix(S.HYgX, 3)}$ · chain rule: $H(X) + H(Y\mid X) = ${v.fix(S.HX + S.HYgX, 3)} = H(X,Y)$ ✓ · $H(X\mid Y) = ${v.fix(S.HXgY, 3)}$`;
        });
      },
    },
  ],
};
