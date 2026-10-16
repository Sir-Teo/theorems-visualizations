// Philosophy & Reasoning — Chapter 3: Vagueness

// ---------- shared helpers ----------
const clampN = (x, a, b) => Math.max(a, Math.min(b, x));
/** 1234567 -> "1,234,567" (plain text, thin separators). */
const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pct = (x) => `${Math.round(100 * x)}%`;
/** Hexagonal-lattice grains of a half-disc mound, ordered from the centre of the base outwards. */
function moundGrains(R = 14) {
  const out = [];
  for (let j = 0; j <= R / 0.866; j++) {
    const y = 0.5 + j * 0.866, off = j % 2 ? 0.5 : 0;
    for (let i = -R - 1; i <= R + 1; i++) {
      const x = i + off;
      if (Math.hypot(x, y - 0.5) <= R && y >= 0.5) out.push([x, y]);
    }
  }
  return out.sort((p, q) => Math.hypot(p[0], p[1] * 1.15) - Math.hypot(q[0], q[1] * 1.15) || p[0] - q[0]);
}
const GRAINS = moundGrains();
/** Logistic degree of truth for "heap" with midpoint m and width w. */
const heapDegree = (n, m, w) => 1 / (1 + Math.exp(-(n - m) / w));

export default {
  collection: 'phil',
  chapter: 3,
  title: 'Vagueness',
  summary: String.raw`One grain of sand is not a heap, adding a single grain never turns a non-heap into a heap, and yet a million grains are a heap. The sorites is a valid-looking argument from apparently true premises to a false conclusion, and it can be run on any predicate with no sharp boundary: bald, tall, red, tired. Borderline cases and their own blurry edges are the data any theory must handle. Epistemicism keeps classical logic and says there is a sharp cut-off that nobody can know; supervaluationism keeps classical logical truths but lets the sentence about a particular borderline grain lack a truth value; degree theories let truth come in amounts, so that each step of the chain is almost, not fully, true. Two further pictures explain why the premise looks so compelling: indiscriminability is not transitive, and category labels can depend on the direction in which a series is traversed. The theories are still in competition, and each pays a different price.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Paradox',
      name: 'The sorites paradox',
      statement: String.raw`Consider the predicate “is a heap of sand”, and these three claims.

(a) *Base case.* One grain of sand is not a heap.
(b) *Tolerance.* For every number $n$, if $n$ grains do not make a heap then $n+1$ grains do not make a heap: one grain cannot make the difference.
(c) *Clear case.* One million grains, suitably piled, make a heap.

By (a) and $999\,999$ applications of (b) with modus ponens, one million grains do not make a heap, contradicting (c). The argument is valid by ordinary logic, (a) and (c) look true, and each instance of (b) looks true. The same pattern works for any vague predicate whose application changes by small steps (*bald*, *tall*, *red*, *adult*).`,
      idea: String.raw`Something must give. Either some instance of the tolerance premise is false, so there is a sharp boundary somewhere between $1$ and $10^6$ grains; or an inference step is invalid; or the base or the clear case is not true; or the notion of truth itself needs revising. The sorites is a fixed point for the whole theory of vagueness: the following items of this chapter are the main answers (epistemicism, supervaluationism, degrees of truth), and the two later items explain why (b) tempts us. The puzzle is attributed to the Megarian philosopher Eubulides of Miletus (4th century BC), and its name comes from the Greek *soros*, “heap”.`,
      caption: String.raw`Drag the grain count $n$ to build the pile (a sample of at most 355 grains is drawn; the label gives the real count). Drag the green handle on the right to choose *your* cut-off $c$: the smallest number of grains you call a heap. With *tolerance accepted*, the chain of modus ponens steps from 1 grain reaches every $n$ and concludes that $n$ grains are not a heap, which contradicts your verdict as soon as $n\ge c$. Switch tolerance off and every instance of the premise is true except the single red pair $(c-1,c)$, a sharp boundary that one grain crosses.`,
      deps: [],
      refs: ['Sainsbury ch. 3', 'SEP “Sorites Paradox”'],
      credit: 'Attributed to Eubulides of Miletus, 4th century BC (SEP “Sorites Paradox”)',
      tags: ['vagueness', 'paradox', 'tolerance'],
      links: { sep: 'https://plato.stanford.edu/entries/sorites-paradox/' },
      viz(v) {
        const tol = v.toggle('accept tolerance premise', true);
        const nS = v.slider('grains $n$', 1, 1e6, 40, { log: true, int: true, sig: 3 });
        const P = v.stage({ x: [-20, 20], y: [-1, 19], equal: true, axes: false, height: 290, title: 'a pile of $n$ grains' });
        const L = v.stage({ x: [1, 1e6], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 290, title: 'the chain from 1 grain to $n$ grains', xlabel: 'grains', yticks: [] });
        const hC = L.handle(300, 0.22, { color: 'green', r: 8, label: 'my cut-off c', labelPos: 'n', constrain: (x) => [clampN(Math.round(x), 2, 999999), 0.22] });
        let info = {};
        v.render(() => {
          const n = Math.round(nS.value), c = Math.round(clampN(hC.x, 2, 999999));
          // pile
          const isHeap = n >= c;
          const k = Math.min(n, GRAINS.length);
          if (n > GRAINS.length) {
            const t = Math.min(1, Math.log(n / GRAINS.length) / Math.log(1e6 / GRAINS.length));
            const r = 14 + 4 * t;
            const pts = []; for (let a = 0; a <= 40; a++) { const th = Math.PI * a / 40; pts.push([r * Math.cos(th), 0.3 + 0.9 * r * Math.sin(th) * (1 - 0.0 * t)]); }
            P.poly(pts, { fill: isHeap ? 'green' : 'orange', fillAlpha: 0.12, color: isHeap ? 'green' : 'orange', width: 1.5 });
          }
          for (let i = 0; i < k; i++) P.dot(GRAINS[i][0], GRAINS[i][1] * 0.95, { r: 6, color: isHeap ? 'green' : 'orange' });
          P.line(-19, 0.0, 19, 0.0, { color: 'muted', width: 2 });
          P.corner(`${grp(n)} grain${n === 1 ? '' : 's'}${n > GRAINS.length ? ' (a 355-grain sample is drawn)' : ''}`, 'tl', { color: 'ink', weight: 'bold' });
          P.corner(isHeap ? 'by your cut-off: a heap' : 'by your cut-off: not a heap', 'tr', { color: isHeap ? 'green' : 'orange' });
          // chain
          L.rect(1, 0.06, c, 0.38, { fill: 'orange', fillAlpha: 0.14, stroke: false });
          L.rect(c, 0.06, 1e6, 0.38, { fill: 'green', fillAlpha: 0.14, stroke: false });
          L.text('not a heap (yours)', Math.sqrt(c), 0.4, { color: 'orange', size: 12, baseline: 'bottom' });
          if (c < 3e5) L.text('heap (yours)', Math.sqrt(c * 1e6), 0.4, { color: 'green', size: 12, baseline: 'bottom' });
          if (tol.value) {
            L.arrow(1, 0.72, Math.max(n, 1.0001), 0.72, { color: n >= c ? 'red' : 'blue', width: 3 });
            L.dot(1, 0.72, { r: 5, color: 'blue' }); L.text('1 grain: not a heap', 1.3, 0.62, { color: 'blue', size: 12, baseline: 'top' });
            L.dot(n, 0.72, { r: 6, color: n >= c ? 'red' : 'blue' });
            L.text(`${grp(Math.max(n - 1, 0))} steps of “not a heap ⇒ still not a heap”`, 1.3, 0.9, { color: n >= c ? 'red' : 'blue', size: 12, baseline: 'bottom', align: 'left' });
          } else {
            L.vline(c, { color: 'red', width: 2 });
            L.text('the one false instance', c, 0.62, { color: 'red', size: 12, align: 'center' });
          }
          L.vline(n, { color: 'gold', width: 2, alpha: 0.8 });
          info = { n, c, isHeap };
        });
        v.readout(() => {
          const { n, c, isHeap } = info;
          if (tol.value) {
            return n >= c
              ? `Tolerance applied ${grp(n - 1)} times from “1 grain is not a heap” proves “${grp(n)} grains are not a heap”.\nYour own verdict: ${grp(n)} ≥ ${grp(c)} is a heap. **Contradiction**: something you accepted has to go.`
              : `Tolerance applied ${grp(Math.max(n - 1, 0))} times proves “${grp(n)} grains are not a heap”, which agrees with your verdict (${grp(n)} < ${grp(c)}).\nDrag $n$ up to ${grp(c)} and beyond to see where the chain collides with your cut-off.`;
          }
          return `Without tolerance your cut-off makes the premise false at exactly one pair: ${grp(c - 1)} grains are not a heap, ${grp(c)} are.\nThen one grain makes the difference between a heap and a non-heap, which is what tolerance denied. ${isHeap ? '' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Concept',
      name: 'Borderline cases and higher-order vagueness',
      statement: String.raw`A vague predicate has clear positive cases, clear negative cases and **borderline cases**, where competent speakers who know all the relevant facts hesitate or disagree. The three regions are not sharply separated: there is no precise number of grains at which the clear non-heaps stop and the borderline cases begin. This is **higher-order vagueness**: “borderline heap” is itself vague, so there are borderline borderline cases, and so on without a last order. A theory of vagueness that draws a sharp line around the borderline zone has put back the boundary it set out to remove, one level up.`,
      idea: String.raw`The sorites premise hides this structure. A sharp first-order cut-off is replaced by two boundaries (clear non-heap to borderline, borderline to clear heap), and those are as hard to place as the original. Each reader has a personal pair of thresholds, but the pair varies from reader to reader (and from occasion to occasion), so pooling many readers produces graded fractions instead of steps. Whether higher-order vagueness is a defect of a theory or a feature of the phenomenon, and whether it goes on forever, is itself debated.`,
      caption: String.raw`This picture is a *model*: a crowd of simulated readers, each with a personal pair of thresholds drawn from a log-normal spread (it is not experimental data). Curves show the share of readers who call $n$ grains a *clear non-heap* (blue, falling) and a *clear heap* (green, rising); the middle is borderline. Raise the spread and the transitions into and out of the borderline zone widen: the zone's own edges are blurry. The vertical probe reads the three-way split at $n$. Press Resample for a different crowd.`,
      deps: ['phil-3.1'],
      refs: ['Sainsbury ch. 3', 'SEP “Vagueness”'],
      scope: String.raw`The crowd is simulated and illustrative. Related experiments on how people actually treat borderline cases are reported by Bonini, Osherson, Viale and Williamson (*Mind & Language* 14, 1999); no data from that study are used here.`,
      tags: ['vagueness', 'borderline', 'higher-order'],
      viz(v) {
        const K = 400;
        let seed = 11, A = [], B = [], Z = [];
        const spread = v.slider('spread between readers', 0.05, 0.9, 0.35, { step: 0.01 });
        const ratio = v.slider('upper / lower threshold (median)', 2, 40, 9, { log: true, sig: 2 });
        const nS = v.slider('probe $n$', 1, 10000, 40, { log: true, int: true, sig: 3 });
        const rebuild = () => {
          const r = v.rng(seed);
          Z = Array.from({ length: K }, () => [r.normal(), r.normal()]);
        };
        rebuild();
        v.button('Resample', () => { seed += 17; rebuild(); });
        const S = v.stage({ x: [1, 10000], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 320, title: 'share of readers by verdict', xlabel: 'grains $n$', yticks: [0, 0.25, 0.5, 0.75, 1], full: true });
        v.legend([['blue', 'clear non-heap'], ['gold', 'borderline'], ['green', 'clear heap']]);
        let info = {};
        v.render(() => {
          const sg = spread.value, rt = ratio.value;
          A = Z.map((z) => 12 * Math.exp(sg * z[0])).sort((a, b) => a - b);
          B = Z.map((z, i) => Math.max(A.length ? 12 * Math.exp(sg * z[0]) * 1.5 : 0, 12 * rt * Math.exp(sg * z[1]))).sort((a, b) => a - b);
          const cnt = (arr, x) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m + 1; else hi = m; } return lo; };
          const pNot = (x) => 1 - cnt(A, x) / K;       // thresholds a_i > x : clear non-heap (blue)
          const pHeap = (x) => cnt(B, x) / K;           // thresholds b_i <= x : clear heap (green)
          S.between(() => 0, pNot, 1, 10000, { fill: 'blue', fillAlpha: 0.3 });
          S.between((x) => 1 - pHeap(x), () => 1, 1, 10000, { fill: 'green', fillAlpha: 0.3 });
          S.between(pNot, (x) => 1 - pHeap(x), 1, 10000, { fill: 'gold', fillAlpha: 0.22 });
          S.fn(pNot, { color: 'blue', width: 2.5, n: 400 });
          S.fn((x) => 1 - pHeap(x), { color: 'green', width: 2.5, n: 400 });
          const q = (arr, p) => arr[Math.min(K - 1, Math.floor(p * K))];
          S.interval(q(A, 0.1), q(A, 0.9), 0.03, { color: 'blue' });
          S.interval(q(B, 0.1), q(B, 0.9), 0.03, { color: 'green' });
          const n = Math.round(nS.value);
          S.vline(n, { color: 'ink', width: 1.5, dash: true });
          const a = pNot(n), h = pHeap(n);
          info = { n, a, h, a10: q(A, 0.1), a50: q(A, 0.5), a90: q(A, 0.9), b10: q(B, 0.1), b50: q(B, 0.5), b90: q(B, 0.9) };
        });
        v.readout(() => {
          const i = info;
          return `At $n=${grp(i.n)}$: ${pct(i.a)} say clear non-heap, ${pct(1 - i.a - i.h)} borderline, ${pct(i.h)} clear heap.\nThe borderline zone *begins* (median reader) at about ${grp(i.a50)} grains, but individual readers put that edge anywhere from ${grp(i.a10)} to ${grp(i.a90)} (10th to 90th percentile); it *ends* at about ${grp(i.b50)} (${grp(i.b10)} to ${grp(i.b90)}). The edges of the borderline zone are themselves blurry.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Epistemicism (Williamson)',
      statement: String.raw`**Epistemicism** keeps classical logic and bivalence. Every statement “$n$ grains make a heap” is either true or false; so there is a sharp cut-off $c^*$ with $c^*-1$ grains not a heap and $c^*$ grains a heap, and the tolerance premise has exactly one false instance. Vagueness is a kind of ignorance: we cannot know where $c^*$ lies. Timothy Williamson (*Vagueness*, Routledge 1994) explains the ignorance by a **margin-for-error principle**: one knows that $n$ grains make a heap only if every case close enough to $n$ is also a heap, and similarly for non-heaps. Cases within the margin of $c^*$ are then ones about which nothing can be known. The cut-off is fixed by the total pattern of use, but in a way that is too complex and unstable for anyone to read off.`,
      idea: String.raw`The view pays for classical logic with a hard-to-believe claim: that a precise boundary exists. The margin-for-error principle is the explanation: our belief that $n$ is a heap counts as knowledge only if it would not have been wrongly held about a slightly different case, and near $c^*$ every belief is of that fragile kind. So the sorites premise looks true because we cannot know of any instance that it is false. Critics reply that such a cut-off cannot be fixed by use, that margin-for-error principles do not hold for all inexact knowledge, and that the view is hard to believe. Defenders answer that the other solutions are untenable.`,
      caption: String.raw`The upper panel is a *toy* of the claim that the cut-off supervenes on use: sixty speakers each have a personal threshold (histogram), and $c^*$ is *defined here* as the average rounded up. This is only an illustration of how a tiny change in use can move a sharp boundary; it is not Williamson's own account of what fixes it. Drag one speaker's threshold with the slider and watch $c^*$ shift by a grain. The lower strip shows what can be known for margin $m$: only counts below $c^*-m$ are known to be non-heaps and only counts from $c^*+m$ are known to be heaps; the red zone holds the truth about the cut-off and nobody can know it. With $m=0$ the zone is empty.`,
      deps: ['phil-3.1'],
      refs: ['Sainsbury ch. 3', 'SEP “Vagueness”'],
      credit: 'Timothy Williamson, Vagueness, 1994',
      scope: String.raw`Williamson’s margin-for-error reasoning is contested (for example by Gómez-Torrente and Mahtani); the picture shows what the view claims, not that the claim is correct. The speaker-average cut-off is an illustrative toy.`,
      tags: ['vagueness', 'epistemicism', 'knowledge'],
      links: { sep: 'https://plato.stanford.edu/entries/vagueness/' },
      viz(v) {
        const NSP = 60;
        const r0 = v.rng(5);
        const base = Array.from({ length: NSP }, () => Math.round(clampN(100 + 14 * r0.normal(), 40, 170)));
        const mS = v.slider('margin for error $m$ (grains)', 0, 30, 8, { int: true });
        const oneS = v.slider('speaker 1’s threshold', 1, 200, base[0], { int: true });
        const reveal = v.toggle('show the cut-off $c^*$', true);
        const H = v.stage({ x: [0, 200], y: [0, 8], axes: 'box', gutter: true, height: 200, title: 'usage: each speaker’s personal threshold', xlabel: 'grains', yticks: [0, 5, 10], full: true });
        const T = v.stage({ x: [0, 200], y: [0, 1], axes: 'box', gutter: true, height: 160, title: 'what can be known, given margin $m$', xlabel: 'grains', yticks: [], full: true });
        let info = {};
        v.render(() => {
          const thr = base.slice(); thr[0] = oneS.value;
          const mean = thr.reduce((a, b) => a + b, 0) / NSP;
          const cs = Math.ceil(mean - 1e-9), m = mS.value;
          const bins = new Array(200).fill(0);
          thr.forEach((t) => { bins[clampN(Math.round(t), 0, 199)]++; });
          for (let i = 0; i < 200; i++) if (bins[i]) for (let j = 0; j < bins[i]; j++) H.dot(i + 0.5, j + 0.6, { r: 4.5, color: i === Math.round(thr[0]) && j === bins[i] - 1 ? 'gold' : 'blue' });
          if (reveal.value) H.vline(cs, { color: 'red', width: 2 }), H.text('$c^*$', cs, 7.2, { color: 'red', align: 'left', dx: 5 });
          // knowledge strip
          T.rect(0, 0.2, Math.max(cs - m, 0), 0.8, { fill: 'blue', fillAlpha: 0.25, stroke: false });
          T.rect(cs + m, 0.2, 200, 0.8, { fill: 'green', fillAlpha: 0.25, stroke: false });
          if (m > 0 && reveal.value) T.rect(cs - m, 0.2, cs + m, 0.8, { fill: 'red', fillAlpha: 0.3, hatch: 'red', stroke: false });
          T.text('known: not a heap', Math.max(cs - m, 0) / 2, 0.5, { color: 'blue', align: 'center', size: 12 });
          T.text('known: a heap', (cs + m + 200) / 2, 0.5, { color: 'green', align: 'center', size: 12 });
          if (reveal.value) T.vline(cs, { color: 'red', width: 2 });
          if (m > 0) T.text('unknowable zone', cs, 0.88, { color: 'red', align: 'center', size: 12 });
          info = { mean, cs, m };
        });
        v.readout(() => {
          const { mean, cs, m } = info;
          const n = 2 * m;
          return `Mean threshold ${v.fix(mean, 2)}, so in this toy $c^*=${cs}$: ${cs - 1} grains are not a heap and ${cs} are. ${n ? `Changing the lone speaker's threshold by 60 grains moves the mean by only ${v.fix(60 / NSP, 1)}.` : ''}\nWith margin $m=${m}$ nobody can know the status of the ${n} counts from ${Math.max(cs - m, 0)} to ${cs + m - 1}; $m=0$ would let us locate $c^*$ exactly.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Concept',
      name: 'Supervaluationism',
      statement: String.raw`A **precisification** (or sharpening) of a vague predicate replaces it by a precise one in a way that respects the clear cases and the **penumbral connections** among borderline cases (for instance, if $n$ grains are a heap then so are $n+1$). A sentence is **supertrue** if it is true under every admissible precisification, **superfalse** if false under all, and otherwise neither. Truth is identified with supertruth. Consequences: every classical logical truth is supertrue, so “$n$ grains are a heap or not” holds even for a borderline $n$; “there is a cut-off” is supertrue; but for no particular $n$ is “$n$ is the cut-off” supertrue, and for a borderline $n$ the sentence “$n$ grains are a heap” has no truth value. The universal tolerance premise is superfalse.`,
      idea: String.raw`The sorites premise is rejected, because on each precisification it fails at some point, but no instance of it is superfalse; the supervaluationist can say we feel the pull of every instance without identifying a false one. The approach was introduced by van Fraassen (1966) for truth-value gaps in free logic and applied to vagueness by Kit Fine (“Vagueness, truth and logic”, *Synthese* 30, 1975). It keeps classical consequence, but gives up bivalence and some familiar rules at the level of truth (for example, truth is no longer closed under a naive disquotational schema). It also raises the problem of higher-order vagueness: which precisifications are admissible is itself vague.`,
      caption: String.raw`Each row is one admissible sharpening of “heap” on the counts $0$ to $200$ (green is where it counts as a heap). Drag the two boundaries of the admissible range (the clear non-heaps below, the clear heaps above) and choose a sentence; the column on the right shows its truth value on each row, and the readout classifies it. Pick the probe $n$ inside the range: “$n$ is a heap” is true in some rows and false in others, so it is neither supertrue nor superfalse, while “heap or not heap” is supertrue. The sorites premise (“tolerance for all $n$”) is superfalse, yet each single instance is true or false depending on the row. Turn penumbral connections off, allowing arbitrary patterns inside the zone, and “if $n$ heap then $n{+}1$ heap” stops being supertrue.`,
      deps: ['phil-3.2'],
      refs: ['Sainsbury ch. 3', 'SEP “Vagueness”'],
      credit: 'van Fraassen, 1966; Kit Fine, “Vagueness, truth and logic”, Synthese 30, 1975',
      tags: ['vagueness', 'supervaluation', 'truth-value gaps'],
      links: { sep: 'https://plato.stanford.edu/entries/vagueness/' },
      viz(v) {
        const R = 28;
        const sent = v.select('', [
          { value: 'heap', label: '$n$ is a heap' },
          { value: 'lem', label: '$n$ is a heap or not' },
          { value: 'contra', label: '$n$ is a heap and not' },
          { value: 'cut', label: '$n$ is the cut-off' },
          { value: 'ex', label: 'there is a cut-off' },
          { value: 'tolI', label: 'if $n$ not heap then $n{+}1$ not' },
          { value: 'tolU', label: 'tolerance for all $n$' },
          { value: 'pen', label: 'if $n$ heap then $n{+}1$ heap' },
        ], 'heap');
        const pen = v.toggle('penumbral connections (monotone sharpenings)', true);
        const nS = v.slider('probe $n$', 1, 199, 100, { int: true });
        const S = v.stage({ x: [0, 232], y: [0, R], axes: 'box', gutter: true, height: 340, title: 'admissible sharpenings of “heap”', xlabel: 'grains $n$', yticks: [], full: true, xticks: [0, 50, 100, 150, 200] });
        const hl = S.handle(60, R + 0.0, { color: 'orange', r: 8, label: 'clear non-heaps end', labelPos: 'sw', constrain: (x) => [clampN(Math.round(x), 2, 196), R - 0.001] });
        const hh = S.handle(140, R + 0.0, { color: 'orange', r: 8, label: 'clear heaps start', labelPos: 'se', constrain: (x) => [clampN(Math.round(x), 4, 198), R - 0.001] });
        let H = null, key = '', info = {};
        const build = (lo, hi, mono) => {
          const r = v.rng(23);
          H = [];
          const base = Array.from({ length: R }, (_, i) => lo + Math.round((i + 0.5) / R * (hi - lo)));
          for (let s = 0; s < R; s++) {
            const row = new Array(201).fill(false);
            if (mono) for (let n = 0; n <= 200; n++) row[n] = n >= base[s];
            else for (let n = 0; n <= 200; n++) row[n] = n < lo ? false : n >= hi ? true : r() < (n - lo + 0.5) / (hi - lo);
            H.push(row);
          }
        };
        v.render(() => {
          let lo = Math.round(hl.x), hi = Math.round(hh.x);
          if (hi < lo + 6) { hi = lo + 6; hh.set(hi, R - 0.001); }
          const mono = pen.value, k = `${lo}|${hi}|${mono}`;
          if (k !== key) { key = k; build(lo, hi, mono); }
          for (let s = 0; s < R; s++) {
            let n0 = 0;
            for (let n = 1; n <= 201; n++) if (n === 201 || H[s][n] !== H[s][n0]) { S.rect(n0, s + 0.06, n, s + 0.94, { fill: H[s][n0] ? 'green' : 'blue', fillAlpha: H[s][n0] ? 0.55 : 0.2, stroke: false }); n0 = n; }
          }
          const n = Math.round(nS.value), q = sent.value;
          const hv = (s, m) => H[s][clampN(m, 0, 200)];
          const val = [];
          for (let s = 0; s < R; s++) {
            let t;
            if (q === 'heap') t = hv(s, n);
            else if (q === 'lem') t = hv(s, n) || !hv(s, n);
            else if (q === 'contra') t = hv(s, n) && !hv(s, n);
            else if (q === 'cut') t = hv(s, n) && !hv(s, n - 1);
            else if (q === 'ex') { t = false; for (let m = 1; m <= 200; m++) if (hv(s, m) && !hv(s, m - 1)) { t = true; break; } }
            else if (q === 'tolI') t = hv(s, n) || !hv(s, n + 1);
            else if (q === 'pen') t = !hv(s, n) || hv(s, n + 1);
            else { t = true; for (let m = 0; m < 200; m++) if (!hv(s, m) && hv(s, m + 1)) { t = false; break; } }
            val.push(t);
          }
          const probeQ = q !== 'ex' && q !== 'tolU';
          if (!probeQ) { /* no probe line */ }
          if (probeQ) S.vline(n + 0.5, { color: 'gold', width: 2 });
          val.forEach((t, s) => S.rect(206, s + 0.12, 226, s + 0.88, { fill: t ? 'green' : 'red', fillAlpha: 0.75, stroke: false }));
          S.text('true?', 216, R - 0.1, { size: 11, align: 'center', color: 'muted', baseline: 'top' });
          S.vline(lo, { color: 'orange', width: 1.5, dash: true }); S.vline(hi, { color: 'orange', width: 1.5, dash: true });
          const nt = val.filter(Boolean).length;
          info = { nt, kind: nt === R ? 'supertrue' : nt === 0 ? 'superfalse' : 'neither', n, lo, hi, probeQ, q };
        });
        v.readout(() => {
          const i = info;
          const names = { heap: `“${i.n} grains are a heap”`, lem: `“${i.n} grains are a heap or not a heap”`, contra: `“${i.n} grains are and are not a heap”`, cut: `“${i.n} is the cut-off”`, ex: '“there is a cut-off”', tolI: `“if ${i.n} grains are not a heap, ${i.n + 1} are not a heap”`, tolU: '“for every n, if n grains are not a heap then n+1 are not a heap” (the sorites premise)', pen: `“if ${i.n} grains are a heap, ${i.n + 1} are a heap” (a penumbral connection)` };
          return `${names[i.q]}: true on ${i.nt} of ${R} sharpenings, so it is **${i.kind}**.\nAdmissible zone ${i.lo} to ${i.hi}: clear cases are fixed by every sharpening, borderline ones by none.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Degrees of truth and fuzzy logic',
      statement: String.raw`**Degree theories** replace the two truth values by the interval $[0,1]$: “$n$ grains are a heap” has degree $d(n)$, rising smoothly from about $0$ to about $1$. Connectives are functions of degrees. In Łukasiewicz logic, $\neg A$ has degree $1-a$ and $A\to B$ has degree $\min(1,\,1-a+b)$; in Gödel logic $A\to B$ has degree $1$ if $a\le b$ and $b$ otherwise; in product logic it is $\min(1,b/a)$. With Łukasiewicz’s conditional, each tolerance instance has degree $1-(d(n+1)-d(n))$, very close to $1$ when the steps are small, so the premise looks almost true without being quite true. The conclusion at the end of the chain has degree $1-d(N)$, near $0$. The degree-theoretic diagnosis is that the argument is *valid* only in a weak sense: many small losses of truth add up.`,
      idea: String.raw`In Łukasiewicz logic the degree of a conjunction of premises falls by the sum of the losses of the individual premises, so a long chain of nearly-true premises can be wholly false in conjunction. This explains why the sorites feels convincing at each step and fails at the end. The price: precise numbers $d(n)$ look as artificial as precise cut-offs (a version of higher-order vagueness), logical connectives behave unusually, and the validity notion matters: if validity is preservation of the lowest premise degree (as Machina proposed in 1976), the conditional sorites is invalid. Fuzzy sets (Zadeh, “Fuzzy sets”, *Information and Control* 8, 1965) and Goguen’s “The logic of inexact concepts” (*Synthese* 19, 1969) are early sources of the idea.`,
      caption: String.raw`Choose the midpoint and width of the degree curve $d(n)$ and the length $N$ of the chain, and compare three readings of “if $n$ is not a heap then $n+1$ is not a heap”. The upper chart shows $d$ and the chain length; the lower chart plots, along the chain, the lowest premise degree, the degree of the conjunction of all premises used so far, and the degree of the conclusion. In Łukasiewicz logic every premise has degree above 0.9 yet the conjunction decays to the conclusion’s degree. In Gödel logic the conclusion’s degree equals the lowest premise degree (the argument passes the min-preservation test), but premises near the heap boundary are far from true. Sharpen the curve ($w\to0$) and one premise becomes fully false.`,
      deps: ['phil-3.1'],
      refs: ['Sainsbury ch. 3', 'SEP “Vagueness”'],
      credit: 'Zadeh, 1965; Goguen, 1969; Machina, 1976',
      scope: String.raw`The logistic curve $d(n)$ is an illustrative choice; degree theories do not say which function is right, which is part of the objection to them.`,
      tags: ['vagueness', 'fuzzy logic', 'degrees of truth'],
      links: { sep: 'https://plato.stanford.edu/entries/vagueness/' },
      viz(v) {
        const logic = v.select('', [{ value: 'luk', label: 'Łukasiewicz' }, { value: 'god', label: 'Gödel' }, { value: 'prod', label: 'product' }], 'luk');
        const mS = v.slider('midpoint $m$', 20, 180, 100, { int: true });
        const wS = v.slider('width $w$', 0.5, 40, 12, { step: 0.5 });
        const nS = v.slider('chain length $N$', 2, 200, 120, { int: true });
        const D = v.stage({ x: [0, 200], y: [-0.03, 1.1], axes: 'box', gutter: true, height: 220, title: 'degree of truth of “$n$ grains are a heap”', xlabel: 'grains $n$', yticks: [0, 0.5, 1] });
        const C = v.stage({ x: [1, 200], y: [-0.03, 1.1], axes: 'box', gutter: true, height: 220, title: 'degrees along the chain', xlabel: 'steps used $k$', yticks: [0, 0.5, 1] });
        v.legend([['blue', 'lowest premise degree'], ['orange', 'conjunction of premises'], ['red', 'conclusion “$k{+}1$ not a heap”']]);
        let info = {};
        v.render(() => {
          const m = mS.value, w = wS.value, N = nS.value, lg = logic.value;
          const d = (n) => heapDegree(n, m, w) - (n === 0 ? 0 : 0);
          const nh = (n) => 1 - d(n);
          D.fn(d, { color: 'green', width: 2.5, domain: [0, 200], fill: true });
          D.vline(N, { color: 'gold', width: 2 });
          D.text('chain end $N$', N, 1.07, { color: 'gold', align: 'left', dx: 4 });
          const cond = (a, b) => (lg === 'luk' ? Math.min(1, 1 - a + b) : lg === 'god' ? (a <= b ? 1 : b) : (a <= 0 ? 1 : Math.min(1, b / a)));
          const rowMin = [], rowConj = [], rowConc = [];
          let mn = nh(1), conj = nh(1);
          for (let k = 1; k < 200; k++) {
            // premise k : not-heap(k) -> not-heap(k+1)
            const p = cond(nh(k), nh(k + 1));
            mn = Math.min(mn, p);
            conj = lg === 'luk' ? Math.max(0, conj + p - 1) : lg === 'god' ? Math.min(conj, p) : conj * p;
            rowMin.push([k, mn]); rowConj.push([k, conj]); rowConc.push([k, nh(k + 1)]);
          }
          C.path(rowMin.slice(0, 200), { color: 'blue', width: 2.5 });
          C.path(rowConc, { color: 'red', width: 3 });
          C.path(rowConj, { color: 'orange', width: 2.5, dash: true });
          C.vline(N - 1, { color: 'gold', width: 2 });
          const at = Math.max(1, Math.min(198, Math.round(N) - 1));
          // lowest single premise degree in the chain up to N-1
          let minP = nh(1);
          for (let k = 1; k <= at; k++) minP = Math.min(minP, cond(nh(k), nh(k + 1)));
          info = { N, minP, conj: rowConj[at - 1][1], conc: nh(N), lg, maxStep: Math.max(...Array.from({ length: at }, (_, k) => d(k + 2) - d(k + 1))) };
        });
        v.readout(() => {
          const i = info;
          const verdict = i.conc >= i.minP - 1e-9 ? 'the conclusion is at least as true as the weakest premise (min-preservation holds here)' : 'the conclusion is far less true than the weakest premise (min-preservation fails)';
          return `After $N=${i.N}$: weakest premise ${v.fix(i.minP, 3)}, conjunction of premises ${v.fix(i.conj, 3)}, conclusion “${i.N} grains are not a heap” ${v.fix(i.conc, 3)}.\nLargest one-grain rise in $d$: ${v.fix(i.maxStep, 3)}. ${verdict[0].toUpperCase() + verdict.slice(1)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Concept',
      name: 'Non-transitive indiscriminability',
      statement: String.raw`Two stimuli are **indiscriminable** if an observer cannot tell them apart by looking at them side by side. Indiscriminability is *not transitive*: in a long series of patches of gradually changing shade, each patch can be indiscriminable from the next while the first and last are plainly different. Since sameness in the sense that matters for the tolerance premise (“the observable property of $a_i$ is the same as that of $a_{i+1}$”) is non-transitive, and the observational predicate “red” is applied on the basis of looks, the premise *every patch indiscriminable from a red patch is red* seems forced, and gives a sorites. The relation is modelled by a threshold: $x\sim y$ iff $|x-y|\le\delta$ (a **semiorder** in Luce’s sense), which is reflexive and symmetric but not transitive.`,
      idea: String.raw`If a relation of looking the same were transitive, patches would fall into classes and the sorites premise would be harmless. The threshold shows why it is not: each step stays below the just-noticeable difference (see the discussion of Weber’s law, psych-1.9, for how the threshold scales with intensity), yet differences accumulate. Luce (“Semiorders and a theory of utility discrimination”, *Econometrica* 24, 1956) formalised intransitive indifference with just-noticeable differences; Crispin Wright (“On the coherence of vague predicates”, *Synthese* 30, 1975) built an argument for the incoherence-or-tolerance of observational predicates on this fact, and Dummett (1975) drew the stronger conclusion that such predicates are incoherent. Raffman (*Philosophical Review* 103, 1994) notes that adjacent patches can look the same when judged as a pair but different when judged singly, which is why a context-sensitive account is attractive.`,
      caption: String.raw`A series of patches with equally spaced model brightness. Set the just-noticeable difference and the number of patches. Adjacent patches stay linked while the ends are far apart; the matrix shows the band of indiscriminable pairs (blue) around the diagonal, not an equivalence relation. Pick patches $i$ and $j$ (gold and orange) to test the pair. Switch to *Weber* and the threshold grows with brightness, so the band widens toward the bright end. Increase the spacing (fewer patches) until the threshold is smaller than one step, then the paradox disappears: neighbours are distinguishable. Turn on *forced transitivity* to see the one big class that tolerance would require.`,
      deps: ['phil-3.1', 'psych-1.9'],
      refs: ['SEP “Vagueness”'],
      credit: 'R. D. Luce, 1956; C. Wright, 1975',
      scope: String.raw`Brightness values are on an abstract model scale, not calibrated display luminance; the threshold model is a simplification of how real discrimination behaves (which depends on noise, context and mode of presentation).`,
      tags: ['vagueness', 'perception', 'semiorder'],
      links: { sep: 'https://plato.stanford.edu/entries/vagueness/' },
      viz(v) {
        const weber = v.select('', [{ value: 'abs', label: 'constant threshold' }, { value: 'web', label: 'Weber: threshold ∝ brightness' }], 'abs');
        const nS = v.slider('number of patches', 6, 60, 30, { int: true });
        const dS = v.slider('threshold $\\delta$ (brightness units)', 0.5, 20, 5, { step: 0.1 });
        const fS = v.slider('Weber fraction (percent)', 1, 30, 8, { step: 0.5 });
        const iS = v.slider('patch $i$ (clamped to the series)', 0, 59, 5, { int: true });
        const jS = v.slider('patch $j$ (clamped to the series)', 0, 59, 26, { int: true });
        const clos = v.toggle('forced transitivity', false);
        const P = v.stage({ x: [-0.5, 60.5], y: [-1.3, 1.9], axes: false, height: 150, full: true });
        const M = v.stage({ x: [0, 30], y: [0, 30], axes: 'box', gutter: true, height: 380, title: 'indiscriminable pairs ($i$ across, $j$ up)', xlabel: 'patch $i$', ylabel: 'patch $j$', equal: true, xticks: [], yticks: [] });
        let info = {};
        const lum = (i, L) => 20 + 60 * i / (L - 1);
        v.render(() => {
          const L = nS.value, web = weber.value === 'web';
          dS.el.hidden = web; fS.el.hidden = !web;
          const same = (a, b) => { const xa = lum(a, L), xb = lum(b, L); const th = web ? fS.value / 100 * Math.min(xa, xb) : dS.value; return Math.abs(xa - xb) <= th + 1e-9; };
          const i = Math.min(iS.value, L - 1), j = Math.min(jS.value, L - 1);
          // closure (connected components of the adjacent-link graph)
          const comp = []; let c = 0;
          for (let a = 0; a < L; a++) { if (a > 0 && !same(a - 1, a)) c++; comp.push(c); }
          const same2 = (a, b) => (clos.value ? comp[a] === comp[b] : same(a, b));
          P.setView([-0.5, L - 0.5], [-1.3, 1.9]);
          for (let a = 0; a < L; a++) {
            const g = Math.round(255 * lum(a, L) / 100 * 1.15);
            P.rect(a - 0.45, -0.3, a + 0.45, 0.9, { fill: `rgb(${Math.min(g, 255)},${Math.min(g, 255)},${Math.min(g, 255)})`, fillAlpha: 1, stroke: false });
          }
          P.rect(i - 0.45, -0.3, i + 0.45, 0.9, { color: 'gold', fill: false, width: 3 });
          P.rect(j - 0.45, -0.3, j + 0.45, 0.9, { color: 'orange', fill: false, width: 3 });
          P.text('i', i, -0.6, { color: 'gold', align: 'center' }); P.text('j', j, -0.6, { color: 'orange', align: 'center' });
          // adjacent links
          let adjOk = true; for (let a = 0; a + 1 < L; a++) { const s = same2(a, a + 1); if (!s) adjOk = false; P.line(a, 1.2, a + 1, 1.2, { color: s ? 'blue' : 'red', width: 3 }); }
          P.text('neighbouring patches look the same?', (L - 1) / 2, 1.6, { color: 'muted', align: 'center', size: 12 });
          M.setView([0, L], [0, L]);
          M.rect(0, 0, L, L, { fill: 'grid', fillAlpha: 0.25, stroke: false });
          for (let a = 0; a < L; a++) for (let b = 0; b < L; b++) if (same2(a, b)) M.rect(a, b, a + 1, b + 1, { fill: 'blue', fillAlpha: 0.6, stroke: false });
          M.rect(i, j, i + 1, j + 1, { color: 'gold', fill: false, width: 2.5 });
          M.rect(j, i, j + 1, i + 1, { color: 'orange', fill: false, width: 2 });
          info = { L, i, j, adjOk, ij: same2(i, j), end: same2(0, L - 1), nd: Math.abs(lum(0, L) - lum(L - 1, L)) };
        });
        v.readout(() => {
          const t = info;
          return `${t.adjOk ? 'Every neighbouring pair looks the same' : 'Some neighbouring pairs can be told apart'}; the darkest and brightest patches ${t.end ? 'also look the same' : 'are clearly different'}.\nPatches $i=${t.i+1}$ and $j=${t.j+1}$: ${t.ij ? 'indiscriminable' : 'distinguishable'}. ${t.adjOk && !t.end ? '**Indiscriminability is not transitive**: patch 1 ~ 2 ~ … ~ ' + t.L + ', yet 1 ≁ ' + t.L + '.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Hysteresis in categorisation',
      statement: String.raw`When a stimulus is morphed step by step along a continuum between two categories (a blue-to-green patch, the syllable change “say” to “stay”), the point where the observer’s label switches can depend on the *direction* of the sequence: with **hysteresis**, labelling stays with the category it started in for longer, so the switch going up occurs later than the switch going down; with **contrast** (adaptation), the opposite happens and the label switches earlier. Experiments on speech categorisation by Tuller, Case, Ding and Kelso (*Journal of Experimental Psychology: Human Perception and Performance* 20, 1994) reported shifts of the category boundary showing hysteresis, contrast and critical-boundary effects under different conditions. If the boundary depends on the path, then there is no single cut-off in the sorites series: the same patch can be called heap or non-heap depending on how it was reached.`,
      idea: String.raw`A simple dynamical model captures both effects. The observer’s state $z$ (between the two categories) follows $\dot z=-z+\tanh(a\,z+g\,s-c\,q)$, driven by the stimulus value $s$. Self-reinforcement $a>1$ makes the dynamics bistable on an interval of $s$, so the state sticks to the old category until its basin disappears; a slow fatigue variable $q$ (relaxing towards $z$) pushes the state away from the current category and produces contrast. The model is a standard picture of such effects (Tuller et al. use a related double-well potential model), not a reconstruction of their data. For vagueness, the effect supports contextualist responses, where the application of a vague predicate depends on the series being traversed.`,
      caption: String.raw`This is a *model* (not the experiments’ data). A simulated observer is swept slowly from the blue end to the green end (blue curve) and back (orange curve); each curve plots the internal state, whose sign is the label. With self-reinforcement $a>1$ the two switches are at different stimulus values, enclosing a hysteresis loop; the strip shows both switch positions on the morph. Raise the fatigue to see them reverse (contrast), lower $a$ below 1 and the loop closes into a single boundary. The probe slider reads the label at a stimulus for each direction of arrival; sweep time controls how slowly the stimulus moves.`,
      deps: ['phil-3.1'],
      refs: ['SEP “Vagueness”'],
      credit: 'Tuller, Case, Ding & Kelso, 1994 (speech categorisation); dynamical model illustrative',
      scope: String.raw`The curve is a qualitative model with arbitrary parameters; whether and how much real observers show hysteresis or contrast depends strongly on the stimuli and task. The vagueness-related interpretation is a philosophical suggestion, not a measured result.`,
      tags: ['vagueness', 'categorisation', 'hysteresis'],
      verify: true,
      viz(v) {
        const aS = v.slider('self-reinforcement $a$', 0.4, 3, 1.8, { step: 0.05 });
        const cS = v.slider('fatigue $c$', 0, 2.5, 0, { step: 0.05 });
        const tS = v.slider('sweep time', 40, 800, 300, { log: true, int: true, sig: 2 });
        const sS = v.slider('probe stimulus $s$', -1, 1, 0, { step: 0.01 });
        const G = 1.0, EPS = 0.025;
        const Z = v.stage({ x: [-1.05, 1.05], y: [-1.25, 1.25], axes: 'box', gutter: true, height: 300, title: 'observer state during an up-sweep and a down-sweep', xlabel: 'stimulus $s$ (blue to green)', yticks: [[-1, 'blue'], [0, ''], [1, 'green']] });
        const B = v.stage({ x: [-1.05, 1.05], y: [-1.1, 1.2], axes: false, height: 130, full: true });
        let key = '', up = [], dn = [];
        const run = () => {
          const a = aS.value, c = cS.value, T = tS.value, dt = 0.05, steps = Math.round(T / dt);
          let z = -1, q = -1; // start well inside blue; pre-equilibrate at s = -1
          const f = (z, q, s) => [-z + Math.tanh(a * z + G * 1.6 * s - c * q), EPS * (z - q)];
          for (let i = 0; i < 4000; i++) { const d = f(z, q, -1); z += d[0] * 0.05; q += d[1] * 0.05; }
          up = []; dn = [];
          for (let i = 0; i <= steps; i++) { const s = -1 + 2 * i / steps; up.push([s, z]); const d = f(z, q, s); z += d[0] * dt; q += d[1] * dt; }
          for (let i = 0; i <= steps; i++) { const s = 1 - 2 * i / steps; dn.push([s, z]); const d = f(z, q, s); z += d[0] * dt; q += d[1] * dt; }
        };
        const crossing = (arr, up_) => { for (let i = 1; i < arr.length; i++) { const [s0, z0] = arr[i - 1], [s1, z1] = arr[i]; if ((z0 < 0) !== (z1 < 0)) return s0 + (s1 - s0) * (0 - z0) / (z1 - z0); } return null; };
        const at = (arr, s) => { let best = arr[0], bd = 9; for (const p of arr) { const d = Math.abs(p[0] - s); if (d < bd) { bd = d; best = p; } } return best[1]; };
        let info = {};
        v.render(() => {
          const k = `${aS.value}|${cS.value}|${tS.value}`;
          if (k !== key) { key = k; run(); }
          Z.hline(0, { color: 'muted', width: 1, dash: true });
          Z.path(up, { color: 'blue', width: 3 });
          Z.path(dn, { color: 'orange', width: 3 });
          const su = crossing(up), sd = crossing(dn);
          if (su !== null) Z.vline(su, { color: 'blue', width: 1.5, dash: true });
          if (sd !== null) Z.vline(sd, { color: 'orange', width: 1.5, dash: true });
          const s = sS.value;
          Z.vline(s, { color: 'gold', width: 2, alpha: 0.8 });
          const zu = at(up, s), zd = at(dn, s);
          Z.dot(s, zu, { r: 6, color: 'blue' }); Z.dot(s, zd, { r: 6, color: 'orange' });
          // morph strip
          for (let i = 0; i < 60; i++) { const t = i / 59, x0 = -1 + 2 * t; B.rect(x0 - 0.02, 0, x0 + 0.02, 0.8, { fill: v.mix(v.color('blue'), v.color('green'), t), fillAlpha: 1, stroke: false }); }
          if (su !== null) { B.vline(su, { color: 'blue', width: 3 }); B.text('going up: switch to green', su, 1.0, { color: 'blue', size: 12, align: su > 0 ? 'right' : 'left', dx: su > 0 ? -4 : 4 }); }
          if (sd !== null) { B.vline(sd, { color: 'orange', width: 3 }); B.text('going down: switch to blue', sd, -0.7, { color: 'orange', size: 12, align: sd > 0 ? 'right' : 'left', dx: sd > 0 ? -4 : 4 }); }
          B.vline(s, { color: 'gold', width: 2 });
          info = { su, sd, s, zu, zd };
        });
        v.readout(() => {
          const { su, sd, s, zu, zd } = info;
          const lab = (z) => (z < 0 ? 'blue' : 'green');
          const loop = su !== null && sd !== null ? `Switch going up at $s=${v.fix(su, 2)}$, going down at $s=${v.fix(sd, 2)}$: loop width ${v.fix(su - sd, 2)} (${su - sd > 0.02 ? 'hysteresis' : su - sd < -0.02 ? 'contrast' : 'no path dependence'}).` : 'The state never switches in one of the sweeps.';
          return `${loop}\nAt $s=${v.fix(s, 2)}$: arriving from the blue end the label is **${lab(zu)}**; arriving from the green end it is **${lab(zd)}**.`;
        });
      },
    },
  ],
};
