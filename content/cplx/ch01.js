// Computational Complexity — Chapter 1: Diagonalization and its limits
// Part 1 (this file, with the chapter title and summary): 1.1–1.7 — constructibility, the time and space hierarchy
// theorems, the nondeterministic hierarchy, linear speedup and the Hopcroft–Paul–Valiant pebbling theorem.
// Part 2 is ch01-b.js (1.8–1.13): Ladner, oracles and the relativization barrier, a provably intractable problem, and the
// Hartmanis–Stearns paper.
//
// Honesty notes. Turing machines in these pictures are real: a single-tape interpreter with a gallery of nine small
// machines (ch01.shared.js) is run for every number shown. Where an item says "illustrative" the picture is a model of
// a construction whose objects cannot be computed (e.g. an enumeration of *all* machines), and says so.
import {
  clamp, lerp, log2, sup, big, tbig, bitLen, popcount, bin, countdownFlips, countupFlips,
  runTM, MACHINES, machineById, padBits, minPebbles,
} from './ch01.shared.js';

export default {
  collection: 'cplx',
  chapter: 1,
  title: 'Diagonalization and its limits',
  summary: String.raw`More time or space buys strictly more power: the hierarchy theorems run a clock on a universal machine and diagonalize against every faster machine, separating P from EXPTIME and L from PSPACE. Ladner’s theorem uses a slower, lazier diagonalization to show that if P ≠ NP there are problems strictly in between. But oracles show the method’s limit — some worlds have P = NP and others P ≠ NP — so diagonalization alone cannot settle the big question.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Time- and space-constructible functions',
      statement: String.raw`A function $t:\N\to\N$ with $t(n)\ge n$ is **time-constructible** if the map $1^n\mapsto \langle t(n)\rangle$ (the number $t(n)$ in binary) can be computed by a Turing machine in $O(t(n))$ steps. A function $s$ with $s(n)\ge\log n$ is **space-constructible** if $1^n\mapsto\langle s(n)\rangle$ can be computed in $O(s(n))$ cells of work space.

Equivalently, a constructible bound can serve as an alarm clock: some machine runs for exactly $\Theta(t(n))$ steps (or marks off exactly $\Theta(s(n))$ cells) on every input of length $n$. Scope: $n$, $n\log n$, $n^k$, $2^n$, $2^{2^n}$ are all constructible, and the class is closed under sums, products, powers and composition; pathological, non-constructible bounds exist (Borodin's *gap theorem* gives computable $t$ with $\mathrm{TIME}(t)=\mathrm{TIME}(2^{t})$).`,
      idea: String.raw`To diagonalize against every machine that halts within $t(n)$ steps, the diagonalizing machine has to *stop* the simulation of each at step $t(n)$. That needs an alarm clock: a binary counter loaded with $t(n)$ and decremented once per simulated step. Loading the counter costs the time of constructing $t(n)$ — hence the definition — and decrementing a binary counter flips only $2$ bits per tick on average (the ruler sequence: bit $j$ flips every $2^j$ ticks), so ticking costs $O(t(n))$ in total and is absorbed into the simulation overhead. Without constructibility the clock could cost more than the run it times, and the hierarchy theorems (1.2, 1.3) fail.

The amortized clock bound uses the geometric series (pma-3.26): in a full countdown from $T$ to zero, bit $j$ flips $\lfloor T/2^j\rfloor$ times, with bit 0 the low bit. Thus the total flips are at most $T\sum_{j\ge0}2^{-j}=2T$, rather than $T\log T$; the finite counter never needs infinitely many bits.`,
      caption: String.raw`Pick a bound and an input length $n$. **Top**: the clock counter holds $t(n)$ in binary; drag **clock used** and watch it count down, with the bits flipped by the latest tick outlined in gold and the running total of bit flips compared with $2k$. **Bottom** (log scale): $t(n)$ (blue), the cost of *building* the counter from $1^n$ (green dots), and $4\,t(n)$ (dashed orange): the green dots stay below the dashed line for every $n$ — that is constructibility. The cost model counts bit operations of schoolbook arithmetic on a binary counter, which is a faithful model up to constants, not a literal Turing machine table.`,
      deps: ['toc-12.2', 'toc-14.1', 'pma-3.26'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Hartmanis & Stearns, 1965 (real-time countable functions); gap theorem: Trakhtenbrot 1964 / Borodin 1972',
      tags: ['time bounds', 'clocks'],
      viz(v) {
        const F = {
          n: { tex: 'n', t: (n) => n, c2: () => 0 },
          nlogn: { tex: 'n\\lceil\\log_2 n\\rceil', t: (n) => n * Math.ceil(log2(n)), c2: (n) => bitLen(n) ** 2 },
          n2: { tex: 'n^2', t: (n) => n * n, c2: (n) => bitLen(n) ** 2 },
          n3: { tex: 'n^3', t: (n) => n ** 3, c2: (n) => 2 * bitLen(n) ** 2 },
          exp: { tex: '2^n', t: (n) => 2 ** n, c2: (n) => n + 1 },
        };
        const cost = (f, n) => countupFlips(n) + f.c2(n);
        const sel = v.select('bound $t(n)$', [{ value: 'n', label: '$n$' }, { value: 'nlogn', label: '$n\\log n$' }, { value: 'n2', label: '$n^2$' }, { value: 'n3', label: '$n^3$' }, { value: 'exp', label: '$2^n$' }], 'n2');
        const nS = v.slider('$n$', 2, 40, 12, { int: true });
        const kS = v.slider('clock used', 0, 1000, 640, { int: true, fmt: (x) => `${(x / 10).toFixed(1)}%` });
        const A = v.stage({ x: [0, 1], y: [-1.6, 2.7], axes: false, height: 170, full: true });
        const B = v.stage({ x: [1.5, 41], y: [1, 1e6], ylog: true, axes: 'box', gutter: true, height: 270, full: true, xlabel: '$n$', ylabel: 'steps (log scale)' });
        v.render(() => {
          const f = F[sel.value], n = nS.value, T = BigInt(f.t(n)), K = BigInt(Math.floor(Number(T) * kS.value / 1000)), m = T - K;
          const nb = bitLen(T), bits = bin(m, nb), flipped = K > 0n ? bin((m + 1n) ^ m, nb) : '0'.repeat(nb);
          A.setView([-0.5, nb + 0.5], [-1.6, 2.7]);
          for (let i = 0; i < nb; i++) {
            const one = bits[i] === '1', fl = flipped[i] === '1';
            A.rect(i + 0.06, 0, i + 0.94, 1, { fill: one ? 'accent' : 'panel', fillAlpha: one ? 0.5 : 0, color: fl ? 'gold' : 'muted', width: fl ? 3 : 1.2, radius: 3 });
            A.text(bits[i], i + 0.5, 0.5, { align: 'center', baseline: 'middle', size: nb > 30 ? 10 : 15, weight: 700, halo: false });
            if (nb <= 22 || (nb - 1 - i) % 5 === 0) A.text(`2${sup(nb - 1 - i)}`, i + 0.5, -0.32, { align: 'center', size: 10, color: 'faint', halo: false });
          }
          A.text(`clock counter = ${big(m)}  (loaded with t(n) = ${big(T)}, ${big(K)} ticks used)`, nb / 2, 1.75, { align: 'center', size: 13, weight: 600 });
          const fl = countdownFlips(T, m);
          A.text(`bit flips so far: ${big(fl)}   ·   2 × ticks = ${big(2 * Number(K))}`, nb / 2, -1.1, { align: 'center', size: 12.5, color: fl <= 2 * Number(K) + nb ? 'green' : 'red', weight: 600 });
          // chart
          const top = Math.pow(10, Math.ceil(log2(f.t(40) * 6) / log2(10)));
          B.setView([1.5, 41], [1, Math.max(1e3, top)]);
          B.fn(f.t, { color: 'accent', width: 2.4, domain: [2, 40] });
          B.fn((x) => 4 * f.t(x), { color: 'orange', dash: true, width: 1.5, domain: [2, 40] });
          const pts = []; for (let k = 2; k <= 40; k++) pts.push([k, cost(f, k)]);
          B.dots(pts, { color: 'green', r: 3 });
          B.vline(n, { color: 'gold', dash: [4, 3] });
          B.dot(n, cost(f, n), { r: 6, color: 'green' });
        });
        v.legend([['accent', '$t(n)$'], ['green', 'cost of building $\\langle t(n)\\rangle$ from $1^n$', { dot: true }], ['orange', '$4\\,t(n)$', { dash: true }]]);
        v.readout(() => {
          const f = F[sel.value], n = nS.value, c = cost(f, n);
          let worst = 0; for (let k = 2; k <= 40; k++) worst = Math.max(worst, cost(f, k) / f.t(k));
          return `$t(n)=${f.tex}=${tbig(f.t(n))}$ · reading $1^{${n}}$ into binary: $${countupFlips(n)}$ flips, then writing $t(n)$: $${f.c2(n)}$ more → **${big(c)}** operations, i.e. **${(c / f.t(n)).toFixed(2)}** × $t(n)$ · worst ratio over $2\\le n\\le40$: **${worst.toFixed(2)}** $\\le 4$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Time hierarchy theorem',
      statement: String.raw`Let $f,g$ be time-constructible with $f(n)\log f(n)=o(g(n))$. Then
$$\mathrm{DTIME}(f(n))\subsetneq \mathrm{DTIME}(g(n)).$$
So, for example, $\mathrm{DTIME}(n)\subsetneq\mathrm{DTIME}(n^2)\subsetneq\mathrm{DTIME}(n^3)\subsetneq\cdots$. The theorem is for deterministic multitape Turing machines; the $\log$ factor is the cost of simulating an arbitrary machine with a fixed number of tapes in a universal machine (Hennie–Stearns).`,
      idea: String.raw`Build $D$ that on input $x$ treats $x$ as the description of a machine $M_x$ and runs a universal simulation of $M_x$ on $x$ *itself* (padding a description with extra symbols lets every machine appear as $M_x$ for infinitely many $x$), with a clock set to $f(|x|)$; $D$ answers the opposite of $M_x$ if the simulation halts in time, and rejects otherwise. The simulation costs $O(f\log f)=o(g)$, so $D\in\mathrm{DTIME}(g)$. If some machine $M$ decided $D$ within $c\,f(n)$ steps, take a long enough $x$ with $M_x=M$ so that the clock covers $c\,f$: then $D(x)=1-M(x)=1-D(x)$, a contradiction. The same flip-the-diagonal argument as Cantor's (toc-1.5) and the undecidability of acceptance (toc-9.6), now with a stopwatch; the universal machine is toc-7.9.`,
      caption: String.raw`**Rows**: nine real Turing machines (a gallery of small deciders, one of them non-halting); **columns**: their padded descriptions $w_0,\dots,w_8$ of length $n$ as inputs (even-numbered ones are padded into palindromes); each cell is the machine's answer (1 accept, 0 reject, ∞ never halts). The last row is the diagonalizer $D$: it runs $M_i$ on $w_i$ with the clock $T(n)=c\cdot g(n)$ and writes the *opposite* answer. A diagonal cell turns **green** when $D$ certifiably differs from $M_i$ and **orange** when $M_i$ outlives the clock (the small number is its true step count). Raise the clock and orange rows turn green; lower it and quadratic machines escape. Bars below compare each machine's own-input running time with the clock. Click a row for details. Machines are single-tape, so the log factor is absent from this toy; the readout still charges $D$ the universal-simulation price $T\log T$.`,
      deps: ['cplx-1.1', 'toc-9.6', 'toc-7.9'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Hartmanis & Stearns, 1965; sharp $\\log$ factor: Hennie & Stearns, 1966',
      tags: ['hierarchy', 'diagonalization'],
      viz(v) {
        const IDS = ['const', 'first0', 'parity', 'ends1', 'has11', 'sorted', 'palin', 'balanced', 'loop'];
        const NAMES = IDS.map((id, i) => `${i} ${machineById(id).name}`);
        const G = { n: (n) => n, nlogn: (n) => n * Math.ceil(log2(n)), n2: (n) => n * n };
        const gS = v.select('growth $g(n)$', [{ value: 'n', label: '$n$' }, { value: 'nlogn', label: '$n\\log n$' }, { value: 'n2', label: '$n^2$' }], 'n');
        const cS = v.slider('constant $c$', 1, 6, 3, { int: true });
        const nS = v.slider('input length $n$', 8, 30, 16, { int: true });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 372, full: true, title: 'machine $M_i$ (row) on input $w_j$ (column); last row: the diagonalizer $D$' });
        const s2 = v.stage({ x: [-0.6, 9.6], y: [0.5, 1e4], ylog: true, axes: 'box', gutter: true, height: 210, full: true, ylabel: 'steps on own description', xticks: IDS.map((_, i) => [i, String(i)]) });
        const T = v.table(s1, { rows: 10, cols: 9, square: false, maxCell: 40, cellAspect: 0.9, size: 14, labelSize: 12, rowLabels: (i) => (i < 9 ? NAMES[i] : 'D (flips diagonal)'), colLabels: (j) => `w${j}`, cornerLabel: '$M\\backslash w$', subSize: 9.5 });
        let sel = 6, cache = { n: -1 };
        const table = (n) => {
          if (cache.n === n) return cache;
          const W = IDS.map((_, j) => { if (j % 2) return padBits(j + 1, n, bin(j, 4)); const H = padBits(j + 1, Math.floor(n / 2), bin(j, 4)); return H + (n % 2 ? '0' : '') + H.split('').reverse().join(''); }), out = [], diag = [];
          IDS.forEach((id, i) => { const row = []; W.forEach((w, j) => { const r = runTM(machineById(id), w, { maxSteps: 3000 + 30 * n * n }); row.push(r.status === 'acc' ? 1 : r.status === 'rej' ? 0 : null); if (i === j) diag.push(r); }); out.push(row); });
          return (cache = { n, W, out, diag });
        };
        s1.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.i < 9) sel = c.i; });
        const clock = () => cS.value * G[gS.value](nS.value);
        const verdict = (i, tb, Tc) => {
          const r = tb.diag[i], ok = (r.status === 'acc' || r.status === 'rej') && r.steps <= Tc;
          return { ok, d: ok ? (r.status === 'acc' ? 0 : 1) : 0, r };
        };
        v.render(() => {
          const n = nS.value, tb = table(n), Tc = clock(), vd = IDS.map((_, i) => verdict(i, tb, Tc));
          T.draw({
            value: (i, j) => (i < 9 ? (tb.out[i][j] == null ? '∞' : tb.out[i][j]) : (vd[j].ok ? vd[j].d : '0*')),
            fill: (i, j) => (i === j && i < 9 ? [vd[i].ok ? 'green' : 'orange', 0.4] : i === 9 ? [vd[j].ok ? 'accent' : 'orange', 0.22] : null),
            sub: (i, j) => (i === j && i < 9 ? (vd[i].r.status === 'loop' ? '∞' : String(vd[i].r.steps)) : null),
            highlight: [[sel, sel], [9, sel]],
            activeRow: sel,
            textColor: (i, j) => (i < 9 && i !== j ? 'muted' : null),
          });
          // bars: steps on own description (log)
          s2.hline(Tc, { color: 'red', width: 2, dash: [6, 4] });
          s2.text(`clock T(n) = ${Tc}`, 9.5, Tc, { align: 'right', dy: -10, size: 12, weight: 700, color: 'red' });
          IDS.forEach((_, i) => {
            const r = tb.diag[i], val = r.status === 'loop' ? 8000 : Math.max(1, r.steps), col = vd[i].ok ? 'green' : 'orange';
            s2.rect(i - 0.32, 0.5, i + 0.32, val, { fill: col, fillAlpha: i === sel ? 0.7 : 0.4, color: col, width: i === sel ? 2.5 : 1.2 });
            s2.text(r.status === 'loop' ? '∞' : String(r.steps), i, val, { align: 'center', dy: -9, size: 11, weight: 700, halo: true });
          });
        });
        v.legend([['green', '$D$ differs from $M_i$ (diagonalized)', { dot: true }], ['orange', '$M_i$ outlives the clock: escapes', { dot: true }], ['red', 'clock $T(n)$', { dash: true }]]);
        v.readout(() => {
          const n = nS.value, tb = table(n), Tc = clock(), vd = IDS.map((_, i) => verdict(i, tb, Tc));
          const k = vd.filter((d) => d.ok).length, r = tb.diag[sel], e = vd[sel];
          const st = r.status === 'loop' ? 'never halts' : `${r.status === 'acc' ? 'accepts' : 'rejects'} after **${r.steps}** steps`;
          return `Clock $T(n)=${cS.value}\\cdot g(n)=${Tc}$ steps · $D$ differs from **${k}** of 9 machines; the other ${9 - k} outlive the clock on their own description · $D$ costs about $T\\log_2T\\approx${Math.round(Tc * log2(Tc))}$ steps (universal-simulation overhead)\n**${NAMES[sel]}** on $w_{${sel}}$ ${st}: ${e.ok ? `inside the clock, so $D(w_{${sel}})=${e.d}$ ≠ $M_{${sel}}(w_{${sel}})$` : `outside the clock, so $D$ answers $0$ by default and may agree with it — no contradiction yet`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Space hierarchy theorem',
      statement: String.raw`Let $s$ be space-constructible and $s'(n)=o(s(n))$. Then

$$\begin{gathered}\mathrm{DSPACE}(s'(n))\\
\subsetneq\mathrm{DSPACE}(s(n)).\end{gathered}$$

There is no logarithmic factor here (unlike time): a universal machine simulates any other with only a constant-factor blow-up in space. For example $\mathrm{DSPACE}(n)\subsetneq\mathrm{DSPACE}(n^2)$, and $\mathrm{DSPACE}(\log n)\subsetneq\mathrm{DSPACE}(\log^2 n)$ for $s(n)=\log^2 n$ (here the $o$ is taken with care for tiny bounds).`,
      idea: String.raw`The diagonalizer $D$ first *marks off* $s(n)$ cells (that is what space-constructibility buys) and then simulates $M_x$ on $x$ inside them. A machine that tries to leave the fence is stopped and answered arbitrarily. A machine that loops would make $D$ loop too, so $D$ also counts steps: for a fixed machine with $k$ work tapes, a length-$n$ read-only input and at most $s$ cells per work tape, there are at most $|Q|(n+2)(s+1)^k|\Gamma|^{ks}$ configurations (state, input-head position, work-head positions and tape symbols), so if it runs longer it repeats one and never halts, and $D$ may stop it and say what it likes. The logarithm of this count is $O(s+\log n)=O(s)$ for the constructible bounds $s\ge\log n$, so the step counter fits in the space budget. Otherwise $D$ answers the opposite of $M_x$. Any machine using $s'=o(s)$ cells fits inside the fence for long inputs, so $D$ differs from it.

The configuration bound is a product-rule count (comb-1.1): choose the state, each head position and the contents of each bounded tape. These choices describe a configuration even when some combinations are unreachable; counting a superset is enough for the stopping bound.

The pigeonhole principle (comb-1.2) then turns the finite configuration count into a time limit. Once a deterministic run visits more configurations than there are descriptions, two are equal, and their subsequent runs coincide. An accepting or rejecting halt cannot first occur after that repetition.`,
      caption: String.raw`A **fence** of $s(n)$ cells (red posts; cell $-1$ is the left end marker) is marked off first; then the simulation of the chosen machine on your input is stepped through. The bar under the tape is the meter of cells used, which turns red the moment the head crosses a post. Try the bounce-forever machine (a repeated configuration is detected) and the run-away machine (stopped at the fence). The chart compares the cells every machine in the gallery needs on this input with the fence: those below it are diagonalized. The input is edited as a binary string.`,
      deps: ['cplx-1.1', 'toc-14.1', 'comb-1.1', 'comb-1.2'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Stearns, Hartmanis & Lewis, 1965',
      tags: ['hierarchy', 'space'],
      viz(v) {
        const SP = ['const', 'parity', 'palin', 'balanced', 'loop', 'run'];
        const SHORT = ['accept', 'parity', 'palindr.', 'balanced', 'bounce', 'runaway'];
        const mS = v.select('machine $M$', SP.map((id, i) => ({ value: id, label: SHORT[i] })), 'palin', { onChange: () => S.reset() });
        const fS = v.select('fence $s(n)$', [{ value: 'small', label: '$\\lceil n/2\\rceil+1$' }, { value: 'fit', label: '$n+2$' }, { value: 'big', label: '$2n+2$' }], 'fit', { onChange: () => S.reset() });
        const inp = v.input('input $x$', '0110110', { width: 150, onChange: () => S.reset() });
        const A = v.stage({ x: [-2.5, 20], y: [-2.6, 2.4], axes: false, height: 230, full: true });
        const B = v.stage({ x: [-0.6, 5.6], y: [0, 24], axes: 'box', gutter: true, height: 190, full: true, ylabel: 'cells used', xticks: SHORT.map((s, i) => [i, s]) });
        const xs = () => (inp.value || '').replace(/[^01]/g, '').slice(0, 16) || '0';
        const fence = (n) => (fS.value === 'small' ? Math.ceil(n / 2) + 1 : fS.value === 'fit' ? n + 2 : 2 * n + 2);
        const run = () => { const x = xs(), s = fence(x.length); return { x, s, r: runTM(machineById(mS.value), x, { fence: s, fenceLo: -1, trace: 70, maxSteps: 200000 }) }; };
        const frames = () => {
          const { x, s, r } = run(), n = x.length, m = machineById(mS.value), out = [];
          const gam = new Set(['_', ...x.split(''), ...[...m.rules.values()].map((q) => q[1]).filter((c) => c !== '=')]).size;
          out.push({ cells: x, lo: 0, h: 0, q: m.start, step: 0, mark: true, note: `$D$ first marks off $s(n)=${s}$ cells (red posts) — a space-constructible bound can be laid out in $O(s)$ space. The input $x$ occupies $${n}$ of them. Now the simulation of $M$ on $x$ begins, with a configuration counter bounded by $|Q|\\,s\\,|\\Gamma|^s=${big(m.states.length * s * gam ** s)}$.` });
          r.trace.forEach((t, k) => { if (k) out.push({ ...t, step: k, note: `Step ${k}: state **${t.q}**, head on cell ${t.h}.` }); });
          const f = r.final, last = { ...f, step: r.steps, final: true, over: r.status === 'fence' };
          const dec = { acc: 'M **accepts** inside the fence, so $D$ **rejects**.', rej: 'M **rejects** inside the fence, so $D$ **accepts**.', loop: `A configuration repeated after **${r.steps}** steps: $M$ would run forever (the counter bound is far away). $D$ stops it and **accepts**, which differs from a machine that never accepts.`, fence: `The head reached cell ${f.h}, outside the fence: $M$ needs more than $s(n)=${s}$ cells, so it is not a $o(s)$ machine. $D$ aborts and **rejects**.`, timeout: 'Step budget exhausted.' }[r.status];
          out.push({ ...last, hold: 2, note: `${r.steps > 70 ? `After **${r.steps}** steps: ` : ''}${dec}` });
          return out;
        };
        const S = v.steps({ frames, still: 1000, codePos: 'below', code: ['mark off $s(n)$ cells; abort if this takes more than $O(s)$ space', 'simulate $M_x$ on $x$ inside the fence', '  if the head leaves the fence: reject', '  if the step count exceeds $|Q|\\,s\\,|\\Gamma|^s$ (a loop): accept', '  if $M_x$ accepts: reject;  if $M_x$ rejects: accept'], codeTitle: 'The diagonalizer D(x)' });
        v.render(() => {
          const { s } = run(), f = S.frame;
          A.setView([-2.6, Math.max(12, s + 1.4)], [-2.6, 2.4]);
          for (let i = -1; i < s + 2; i++) {
            const inside = i >= -1 && i <= s - 2, k = i - (f.lo ?? 0), ch = k >= 0 && k < (f.cells || '').length ? f.cells[k] : '_';
            A.rect(i - 0.46, -0.4, i + 0.46, 0.5, { fill: f.mark && inside ? 'orange' : inside ? 'accent' : 'muted', fillAlpha: f.mark && inside ? 0.22 : inside ? (ch === '_' ? 0.05 : 0.2) : 0.04, color: inside ? 'muted' : 'faint', width: 1, radius: 2 });
            if (ch !== '_') A.text(ch, i, 0.05, { align: 'center', baseline: 'middle', size: 15, weight: 700, halo: false });
            if (i === -1) A.text('⊢', i, 0.05, { align: 'center', baseline: 'middle', size: 14, color: 'faint', halo: false });
          }
          A.vline(-1.5, { color: 'red', width: 2.5 }); A.vline(s - 1.5, { color: 'red', width: 2.5 });
          A.measure(-1.5, -1.0, s - 1.5, -1.0, `s(n) = ${s} cells`);
          if (!f.mark) {
            const col = f.over ? 'red' : 'gold';
            A.arrow(f.h, 1.55, f.h, 0.62, { color: col, width: 2.4, head: 8 });
            A.text(f.q, f.h, 1.85, { align: 'center', size: 13, weight: 700, color: col });
          }
          // meter
          const used = f.mark ? (xs().length) : (f.cells || '').length, w = s;
          A.rect(-1.5, -2.35, s - 1.5, -1.8, { fill: 'muted', fillAlpha: 0.1, color: 'faint', width: 1, radius: 3 });
          A.rect(-1.5, -2.35, -1.5 + Math.min(w, used), -1.8, { fill: used > w || f.over ? 'red' : 'green', fillAlpha: 0.55, color: used > w || f.over ? 'red' : 'green', width: 1, radius: 3 });
          A.text(`cells touched: ${f.over ? '> ' + s : used} of ${s}`, s / 2 - 1.5, -2.07, { align: 'center', size: 12, weight: 700, halo: false });
          // chart
          const x = xs(); const fs = fence(x.length);
          const vals = SP.map((id) => { const r = runTM(machineById(id), x, { fence: 60, fenceLo: -1, maxSteps: 20000 }); return { c: r.status === 'fence' ? 60 : r.cells + (r.lo < 0 ? 0 : 1), st: r.status }; });
          B.setView([-0.6, 5.6], [0, Math.max(24, fs + 6)]);
          vals.forEach((o, i) => { const ok = o.c <= fs, col = ok ? 'green' : 'red'; B.rect(i - 0.32, 0, i + 0.32, o.c, { fill: col, fillAlpha: SP[i] === mS.value ? 0.65 : 0.35, color: col, width: SP[i] === mS.value ? 2.6 : 1.2 }); B.text(o.st === 'fence' ? '∞' : String(o.c), i, o.c, { align: 'center', dy: -9, size: 11, weight: 700 }); });
          B.hline(fs, { color: 'red', width: 2, dash: [6, 4] }); B.text(`fence s = ${fs}`, 5.55, fs, { align: 'right', dy: -10, size: 12, weight: 700, color: 'red' });
        });
        v.legend([['green', 'fits inside the fence: diagonalized', { dot: true }], ['red', 'needs more cells: escapes', { dot: true }]]);
        v.readout(() => {
          const { x, s, r } = run();
          return `$|x|=${x.length}$, fence $s=${s}$ cells · outcome: **${{ acc: 'accepted', rej: 'rejected', loop: 'loops', fence: 'overflow', timeout: 'timeout' }[r.status]}** after ${r.steps} steps, ${r.status === 'fence' ? `more than ${s}` : `**${r.cells + (r.lo < 0 ? 0 : 1) - 0}**`} cells touched · $D$ itself needs about $s+\\log_2 s$ cells: the marked fence plus a step counter`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'P ≠ EXPTIME and L ≠ PSPACE',
      statement: String.raw`$\mathrm P\subsetneq\mathrm{EXPTIME}$ and $\mathrm L\subsetneq\mathrm{PSPACE}$, where $\mathrm{EXPTIME}=\bigcup_k\mathrm{DTIME}(2^{n^k})$. In fact $\mathrm{P}\subseteq\mathrm{DTIME}(n^{\log n})\subsetneq\mathrm{DTIME}(2^n)\subseteq\mathrm{EXPTIME}$ and $\mathrm L\subseteq\mathrm{DSPACE}(\log^2 n)\subsetneq\mathrm{DSPACE}(n)\subseteq\mathrm{PSPACE}$. Consequently at least one of the inclusions $\mathrm L\subseteq\mathrm P\subseteq\mathrm{NP}\subseteq\mathrm{PSPACE}\subseteq\mathrm{EXPTIME}$ is strict at the ends — but the theorem cannot say which.`,
      idea: String.raw`Every polynomial $n^k$ is eventually below $n^{\log n}$, so $\mathrm P\subseteq\mathrm{DTIME}(n^{\log n})$; since $n^{\log n}\cdot\log(n^{\log n})=o(2^n)$ and both bounds are constructible, the time hierarchy theorem (1.2) gives the strict inclusion. For space, $\log n\le\log^2 n=o(n)$ and the space hierarchy theorem (1.3) applies. Each rung of the ladder below is a separate application of the same diagonal argument with a different clock.

The asymptotic separation uses exponential domination (pma-8.6(f)), not just a comparison of plotted values. Put $x=\log n$: $x^2e^{-x}\to0$ gives $(\log n)^2=o(n)$. The logarithm of $n^{\log n}\log(n^{\log n})/2^n$ therefore tends to $-\infty$, and $\log^2n/n\to0$ supplies the space gap as well; a different fixed logarithm base changes only constants.`,
      caption: String.raw`Switch between the **time** and **space** ladders and click a rung. The chart (log scale) draws every bound; the selected rung $f$ and the next one $g$ are bold. The readout below the chart reads out the hypothesis of the hierarchy theorem on the selected pair, $\log_2\!\big(f\log f/g\big)$ for time (resp. $\log_2(f/g)$ for space), at $n=2^{10},2^{20},2^{40},2^{80}$: it marches to $-\infty$. The separating language for the pair is displayed beneath.`,
      deps: ['cplx-1.2', 'cplx-1.3', 'pma-8.6'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Hartmanis & Stearns, 1965; Stearns, Hartmanis & Lewis, 1965',
      tags: ['hierarchy', 'separations'],
      viz(v) {
        // Each rung: tex name, log2 f(n) as a function of L = log2 n (n = 2^L).
        const TIME = [
          { tex: 'n', lg: (L) => L }, { tex: 'n^2', lg: (L) => 2 * L }, { tex: 'n^3', lg: (L) => 3 * L }, { tex: 'n^4', lg: (L) => 4 * L },
          { tex: 'n^{\\log n}', lg: (L) => L * L }, { tex: '2^n', lg: (L) => 2 ** L },
        ];
        const SPACE = [
          { tex: '\\log n', lg: (L) => log2(Math.max(L, 1)) }, { tex: '\\log^2 n', lg: (L) => 2 * log2(Math.max(L, 1)) }, { tex: 'n', lg: (L) => L },
          { tex: 'n^2', lg: (L) => 2 * L }, { tex: 'n^{\\log n}', lg: (L) => L * L }, { tex: '2^n', lg: (L) => 2 ** L },
        ];
        const mode = v.select('resource', [{ value: 'time', label: 'time' }, { value: 'space', label: 'space' }], 'time', { onChange: () => (sel = 1) });
        const A = v.stage({ x: [0, 10], y: [-0.2, 6.6], axes: false, height: 340, minWidth: 250, title: 'the ladder: click a rung' });
        const B = v.stage({ x: [1.5, 64], y: [1, 1e20], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: '$n$', ylabel: 'resource bound (log scale)' });
        let sel = 1;
        const rungs = () => (mode.value === 'time' ? TIME : SPACE), cls = () => (mode.value === 'time' ? 'TIME' : 'SPACE');
        const col = ['accent', 'teal', 'blue', 'purple', 'orange', 'red'];
        A.onClick((x, y) => { const k = Math.round(y - 0.4); if (k >= 0 && k < rungs().length) sel = clamp(k, 0, rungs().length - 2); });
        v.render(() => {
          const R = rungs(), N = R.length, name = cls();
          for (let k = 0; k < N; k++) {
            const on = k === sel || k === sel + 1, y = k + 0.4 + 0.0, w = 1.4 + 1.1 * k;
            A.rect(5 - w, y + 0.1 - 0.28, 5 + w, y + 0.1 + 0.28, { fill: col[k], fillAlpha: on ? 0.35 : 0.1, color: col[k], width: on ? 2.8 : 1.2, radius: 5 });
            A.text(`$\\mathrm{${name}}(${R[k].tex})$`, 5, y + 0.1, { align: 'center', baseline: 'middle', size: 13.5, weight: on ? 700 : 500 });
            if (k < N - 1) A.text('⊊', 9.6, y + 0.6, { align: 'center', baseline: 'middle', size: 15, color: k === sel ? 'green' : 'faint', weight: 700 });
          }
          // chart
          R.forEach((r, k) => {
            const on = k === sel || k === sel + 1;
            B.fn((x) => Math.pow(2, r.lg(log2(x))), { color: col[k], width: on ? 3 : 1.1, alpha: on ? 1 : 0.45, domain: [2, 64] });
          });
          const nn = 2 ** 5; B.vline(nn, { color: 'gold', dash: [3, 4], alpha: 0.5 });
        });
        v.legend([['accent', 'rungs of the ladder (bold: the selected pair $f\\subsetneq g$)']]);
        v.readout(() => {
          const R = rungs(), f = R[sel], g = R[sel + 1], tm = mode.value === 'time', name = cls();
          const rows = [10, 20, 40, 80].map((L) => {
            const lf = f.lg(L), lg = g.lg(L), val = tm ? lf + log2(Math.max(lf, 1)) - lg : lf - lg;
            return `$n=2^{${L}}$: **${val < -1e6 ? '≈ −' + tbig(-val) : v.fix(val, 1)}**`;
          });
          const dl = tm ? String.raw`D_f=\{x:\ M_x\text{ does not accept }x\text{ within }f(|x|)\text{ steps}\}` : String.raw`D_f=\{x:\ M_x\text{ does not accept }x\text{ using at most }f(|x|)\text{ cells}\}`;
          return `$\\mathrm{${name}}(${f.tex})\\subsetneq\\mathrm{${name}}(${g.tex})$ · ${tm ? '$\\log_2(f\\log f/g)$' : '$\\log_2(f/g)$'} at ${rows.join(' · ')}\nseparating language: $${dl}$, decided within $g$ but not within $f$` + (sel >= R.length - 3 ? `\n${tm ? 'every polynomial lies below $n^{\\log n}$, so $\\mathrm P\\subseteq\\mathrm{DTIME}(n^{\\log n})\\subsetneq\\mathrm{DTIME}(2^n)$' : '$\\mathrm L\\subseteq\\mathrm{DSPACE}(\\log^2 n)\\subsetneq\\mathrm{DSPACE}(n)\\subseteq\\mathrm{PSPACE}$'}` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Nondeterministic time hierarchy theorem',
      statement: String.raw`If $f,g$ are time-constructible and $f(n+1)=o(g(n))$, then
$$\mathrm{NTIME}(f(n))\subsetneq\mathrm{NTIME}(g(n)).$$
This is the nondeterministic analogue of the time hierarchy theorem (Cook 1973; Seiferas–Fischer–Meyer 1978 for the sharp form $f(n+1)=o(g(n))$). In particular $\mathrm{NTIME}(n)\subsetneq\mathrm{NTIME}(n^2)\subsetneq\cdots$ and $\mathrm{NP}\subsetneq\mathrm{NEXP}$.`,
      idea: String.raw`Direct diagonalization fails: a nondeterministic machine cannot cheaply *complement* another one's answer. The fix is **lazy diagonalization** (Žák 1983). Choose rapidly growing breakpoints $a_1<a_2<\cdots$ and let $D_i$ work on the lengths in $(a_i,a_{i+1}]$ against the $i$-th machine $M_i$: for $n<a_{i+1}$ it copies the answer of $M_i$ on the *next* length, $D(1^n)=M_i(1^{n+1})$ (affordable nondeterministically, as $f(n+1)=o(g(n))$); only at the last length does it spend exponential time — deterministically trying every computation of $M_i$ on $1^{a_i+1}$, which the huge gap pays for — and answer the opposite, $D(1^{a_{i+1}})=1-M_i(1^{a_i+1})$. If $M_i$ agreed with $D$ everywhere on the interval, the answers would chain $M_i(1^{a_i+1})=M_i(1^{a_i+2})=\cdots=M_i(1^{a_{i+1}})=1-M_i(1^{a_i+1})$, absurd. So each machine is beaten somewhere on its own interval, with only one flip per interval.`,
      caption: String.raw`**Top**: the number line cut at breakpoints $a_1<a_2<\cdots$ (here $a_{i+1}=2^{a_i}$, drawn with equal-width cells); pick the interval whose machine $M_i$ you want to test. **Bottom**: the lengths $a_i+1,\dots,a_{i+1}$ as columns. **Click the top row** to write any answers you like for $M_i$ (a toy: it is *any* function of the length). The diagonalizer's row is computed by the lazy rule: copy the *next* column, and flip the first one at the very end (arrows). The agreement row shows where $M_i$ and $D$ coincide. Try to make them agree everywhere: you can only reach $L-1$ of $L$ columns — one disagreement is forced, and that is the whole proof.`,
      deps: ['cplx-1.2', 'toc-12.11'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Cook, 1973; Seiferas, Fischer & Meyer, 1978; simple proof by Žák, 1983',
      tags: ['hierarchy', 'nondeterminism', 'lazy diagonalization'],
      viz(v) {
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, full: true });
        let M = [], seeded = 0;
        const Ls = v.slider('columns shown $L$', 4, 12, 8, { int: true, onChange: () => reset() });
        const iS = v.select('interval', [{ value: 0, label: '$(2,4]$' }, { value: 1, label: '$(4,16]$' }, { value: 2, label: '$(16,2^{16}]$' }, { value: 3, label: '$(2^{16},2^{2^{16}}]$' }], 0, { onChange: () => reset() });
        v.button('copy chain', () => { M = M.map(() => M[0] ?? 0); });
        v.button('random machine', () => { const r = v.rng(++seeded * 7 + 3); M = M.map(() => (r() < 0.5 ? 0 : 1)); });
        const reset = () => { const r = v.rng(11 + iS.value); M = Array.from({ length: Ls.value }, () => (r() < 0.5 ? 0 : 1)); };
        reset();
        const T = v.table(B, { rows: 3, cols: 8, square: false, cellAspect: 1.05, maxCell: 62, size: 17, labelSize: 12.5, rowLabels: ['M_i(n): you choose', 'D(n): lazy rule', 'D(n) = M_i(n) ?'] });
        const Dv = () => M.map((_, k) => (k < M.length - 1 ? M[k + 1] : 1 - M[0]));
        B.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i === 0 && c.j >= 0) M[c.j] = 1 - M[c.j]; });
        const BP = ['2', '4', '16', '2^{16}', '2^{65536}'];
        v.render(() => {
          const L = M.length, D = Dv(), sel = iS.value;
          // number line
          A.setView([-0.2, 4.2], [-1, 1.6]);
          for (let k = 0; k < 4; k++) {
            const on = k === sel;
            A.rect(k + 0.03, 0, k + 0.97, 0.8, { fill: on ? 'accent' : 'muted', fillAlpha: on ? 0.28 : 0.08, color: on ? 'accent' : 'faint', width: on ? 2.4 : 1, radius: 4 });
            A.text(`$(a_{${k + 1}},a_{${k + 2}}]$`, k + 0.5, 0.4, { align: 'center', baseline: 'middle', size: 13, weight: on ? 700 : 500 });
            A.dot(k + 0.97, 0, { r: 5, color: 'red' });
            A.text(`$${BP[k + 1]}$`, k + 1, -0.35, { align: 'center', size: 11.5, color: 'muted' });
          }
          A.dot(0.03, 0, { r: 4, color: 'muted' }); A.text(`$${BP[0]}$`, 0, -0.35, { align: 'center', size: 11.5, color: 'muted' });
          A.text('inside an interval: $D(1^n)=M_i(1^{n+1})$   ·   at the right end (red): $D=1-M_i(1^{a_i+1})$ by brute force', 2, 1.3, { align: 'center', size: 12.5, color: 'muted' });
          T.set({ cols: L });
          T.draw({
            value: (i, j) => (i === 0 ? M[j] : i === 1 ? D[j] : M[j] === D[j] ? '✓' : '✗'),
            colLabels: (j) => (j === 0 ? '$a_i{+}1$' : j === L - 1 ? '$a_{i+1}$' : `$+${j}$`),
            fill: (i, j) => (i === 0 ? ['accent', 0.14] : i === 1 ? [j === L - 1 ? 'red' : 'orange', 0.22] : [M[j] === D[j] ? 'green' : 'red', 0.3]),
          });
          for (let k = 0; k < L - 1; k++) T.arrow([0, k + 1], [1, k], { color: 'orange', width: 1.6 });
          T.arrow([0, 0], [1, L - 1], { color: 'red', width: 1.8, dash: true });
        });
        v.legend([['orange', 'copy the answer on the next length'], ['red', 'flip: the exponential-time step at the last length', { dash: true }]]);
        v.readout(() => {
          const L = M.length, D = Dv(), ag = M.filter((m, k) => m === D[k]).length;
          return `$M_i$ agrees with $D$ on **${ag}** of $L=${L}$ lengths · full agreement would need $M_i(a_i{+}1)=\\dots=M_i(a_{i+1})$ **and** $M_i(a_{i+1})=1-M_i(a_i{+}1)$ — ${ag === L ? 'impossible (check the table!)' : `so the best possible is $L-1=${L - 1}$`}${ag === L - 1 ? ' — you have reached it' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Theorem',
      name: 'Linear speedup theorem',
      statement: String.raw`Let $L$ be decided by a multitape Turing machine in time $t(n)$, with $t(n)/n\to\infty$ (more precisely $t(n)=\omega(n)$), and let $c>0$. Then $L$ is decided by another multitape machine in time $c\,t(n)$. Hence $\mathrm{DTIME}(t)=\mathrm{DTIME}(c\,t)$, and big-$O$ is the right way to state time bounds. For $t(n)=O(n)$ the same trick gives $n+\varepsilon n$ steps (the reading of the input cannot be sped up).`,
      idea: String.raw`Choose a block size $k$ and let the new machine use the alphabet $\Gamma^k$: one new symbol is a whole block of $k$ old symbols. After copying the input into blocks (cost $n+n/k$), it simulates $k$ old steps at a time: it looks at the current block and both neighbours (the old head cannot leave them in $k$ steps), computes the outcome of the next $k$ old steps *inside its finite control*, and rewrites the three blocks — at most five moves of its head. So $t$ old steps cost about $5t/k+n+n/k$ new ones: choose $k\ge 5/c$. Nothing here uses a hypothesis about the language, which is why constants are ignored, and why the hierarchy theorems (1.2) are stated with $o(\cdot)$.`,
      caption: String.raw`The machine is a real palindrome-checker run on $0^n$. **Left**: space–time diagram, head position against the step count; the faint vertical lines mark macro-steps of $k$ old steps, the orange staircase is the compressed machine's block position. **Right** (log scale): measured steps of the original machine for every input length (blue) against the compressed machine's total (orange, counted from the actual head trace: 3 to 5 moves per macro-step, plus compressing the input). Change the block size $k$ and watch the gap open by roughly $k/4$; for small $n$ the $n+n/k$ set-up cost dominates, which is why the theorem needs $t(n)=\omega(n)$.`,
      deps: ['toc-12.2'],
      refs: ['Arora–Barak ch. 1'],
      credit: 'Hartmanis & Stearns, 1965',
      tags: ['time bounds', 'constants'],
      viz(v) {
        const PAL = machineById('palin'), runs = {};
        const R = (n) => (runs[n] ??= runTM(PAL, '0'.repeat(n), { posTrace: true, loopCheck: false, maxSteps: 1e6 }));
        const blk = (p, k) => Math.floor(p / k);
        const comp = (n, k) => {
          const r = R(n), t = r.steps; let moves = 0, macro = 0;
          for (let s = 0; s < t; s += k) { moves += 3 + Math.abs(blk(r.pos[s], k) + 1 - blk(r.pos[Math.min(s + k, t)], k)); macro++; }
          const prep = n + Math.ceil(n / k);
          return { macro, moves, prep, total: prep + moves };
        };
        const kS = v.select('block size $k$', [1, 2, 4, 8, 16, 32].map((k) => ({ value: k, label: String(k) })), 16);
        const nS = v.slider('input length $n$', 6, 60, 36, { int: true });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 280, xlabel: 'step $t$', ylabel: 'head cell', title: 'space–time diagram of the palindrome machine' });
        const B = v.stage({ x: [4, 61], y: [3, 3e3], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 280, xlabel: 'input length $n$', ylabel: 'steps (log scale)' });
        v.render(() => {
          const n = nS.value, k = kS.value, r = R(n), t = r.steps, c = comp(n, k);
          A.setView([-t * 0.02, t * 1.03], [-2, n + 3]);
          for (let s = 0; s <= t && t / k <= 120; s += k) A.vline(s, { color: 'faint', width: 1, alpha: 0.5 });
          A.hline(n - 0.5, { color: 'faint', dash: true }); A.hline(-0.5, { color: 'faint', dash: true });
          A.path(r.pos.map((p, s) => [s, p]), { color: 'accent', width: 1.8 });
          const st = []; for (let s = 0; s <= t + k; s += k) { const q = Math.min(s, t); st.push([q, blk(r.pos[q], k) * k + k / 2 - 0.5]); }
          if (k > 1) A.path(st, { color: 'orange', width: 2.2 });
          B.fn((x) => 0.5 * x * x, { color: 'faint', dash: true, width: 1, domain: [4, 60] });
          const ts = [], cs = []; for (let m = 4; m <= 60; m++) { ts.push([m, R(m).steps]); cs.push([m, comp(m, k).total]); }
          B.path(ts, { color: 'accent', width: 2.4 }); B.path(cs, { color: 'orange', width: 2.4 });
          B.vline(n, { color: 'gold', dash: [4, 3] }); B.dot(n, t, { r: 5, color: 'accent' }); B.dot(n, c.total, { r: 5, color: 'orange' });
        });
        v.legend([['accent', 'original machine'], ['orange', 'compressed machine (blocks of $k$)'], ['faint', '$n^2/2$', { dash: true }]]);
        v.readout(() => {
          const n = nS.value, k = kS.value, t = R(n).steps, c = comp(n, k);
          return `$n=${n}$: original **${t}** steps · compressed: ${c.macro} macro-steps, ${c.moves} moves + ${c.prep} to compress the input = **${c.total}** steps · speed-up **${(t / c.total).toFixed(2)}**× (asymptotically about $k/4=${(k / 4).toFixed(2)}$ when $t\\gg n$) · answer unchanged: ${R(n).status === 'acc' ? 'accepts' : 'rejects'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Theorem',
      name: 'Hopcroft–Paul–Valiant: time t fits in space t/log t',
      statement: String.raw`For every time-constructible $t(n)\ge n$,
$$\mathrm{DTIME}(t(n))\subseteq\mathrm{DSPACE}\big(t(n)/\log t(n)\big).$$
This holds for multitape Turing machines; the trivial inclusion is $\mathrm{DTIME}(t)\subseteq\mathrm{DSPACE}(t)$. Combined with the space hierarchy theorem it gives $\mathrm{DTIME}(t)\subsetneq\mathrm{DSPACE}(t)$, i.e. space is strictly more powerful than time at the same bound.`,
      idea: String.raw`Cut the computation into $t/\log t$ blocks of $\log t$ steps; a block touches only a bounded number of tape segments, so the whole run becomes a bounded-degree DAG of $N\approx t/\log t$ nodes (each node: the contents of a few segments after a block). To evaluate the last node the simulator need not keep all intermediate values: it plays the **pebble game** on this DAG — a pebble on a node means "its value is stored"; a pebble may be placed on a node only when all its predecessors carry pebbles, and may be removed at any moment. The Hopcroft–Paul–Valiant lemma says every bounded-degree DAG can be pebbled with $O(N/\log N)$ pebbles, so the simulation stores $O(t/\log t)$ cells in all and recomputes what it has thrown away. (Paul, Tarjan and Celoni showed in 1977 that $N/\log N$ pebbles are really needed for some bounded-degree graphs, so the lemma is tight.)`,
      caption: String.raw`Play the **pebble game** on a computation graph (arrows run from the inputs of a step to the step). In *play* mode click a node to place a pebble (only when all its predecessors are pebbled; sources are free) or to take it off; get a pebble onto the gold output node using as few pebbles as you can. *Optimal strategy* steps through a shortest sequence of moves found by exhaustive search over all pebble placements, with the **provably minimum** number of pebbles. In *edit* mode drag nodes, click empty space to add a node, click two nodes in turn to add an arrow (Alt-click deletes), and the minimum is recomputed. Path: 2 pebbles whatever the length; binary tree of depth $d$: $d+1$; pyramid of height $h$: $h+1$.`,
      deps: ['toc-14.1'],
      refs: ['Arora–Barak ch. 4'],
      credit: 'Hopcroft, Paul & Valiant, 1977',
      tags: ['time vs space', 'pebbling'],
      viz(v) {
        const PRE = {
          path: () => ({ nodes: Array.from({ length: 10 }, (_, i) => ({ id: i, x: 0.6 + i * 1.2, y: 2.5 })), edges: Array.from({ length: 9 }, (_, i) => [i, i + 1]) }),
          pyramid: () => { const nodes = [], edges = [], id = (r, c) => r * 10 + c; for (let r = 0; r < 4; r++) for (let c = 0; c < 4 - r; c++) { nodes.push({ id: id(r, c), x: 3.1 + c * 1.9 + r * 0.95, y: 0.6 + r * 1.35 }); if (r) { edges.push([id(r - 1, c), id(r, c)]); edges.push([id(r - 1, c + 1), id(r, c)]); } } return { nodes, edges }; },
          tree: () => { const nodes = [], edges = []; for (let d = 0; d < 4; d++) for (let c = 0; c < 2 ** (3 - d); c++) { const x = (c + 0.5) * (12 / 2 ** (3 - d)), id = 100 * d + c; nodes.push({ id, x, y: 0.5 + d * 1.5 }); if (d) { edges.push([100 * (d - 1) + 2 * c, id]); edges.push([100 * (d - 1) + 2 * c + 1, id]); } } return { nodes, edges }; },
          grid: () => { const nodes = [], edges = [], id = (r, c) => r * 10 + c; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { nodes.push({ id: id(r, c), x: 2.5 + c * 2.4 + r * 0.0, y: 0.7 + r * 1.9 }); if (r) edges.push([id(r - 1, c), id(r, c)]); if (c) edges.push([id(r, c - 1), id(r, c)]); } return { nodes, edges }; },
        };
        const mode = v.select('mode', [{ value: 'play', label: 'play' }, { value: 'solve', label: 'optimal strategy' }, { value: 'edit', label: 'edit graph' }], 'play', { onChange: () => { peb = new Set(); S.reset(); } });
        const pre = v.select('graph', [{ value: 'path', label: 'path' }, { value: 'pyramid', label: 'pyramid' }, { value: 'tree', label: 'binary tree' }, { value: 'grid', label: 'grid' }], 'pyramid', { onChange: () => load() });
        const s = v.stage({ x: [0, 12], y: [-0.3, 5.7], axes: false, height: 330, full: true });
        let peb = new Set(), moves = 0, maxP = 0, info = null, solFrames = [];
        const G = v.graph(s, { directed: true, layout: 'none', editable: true, ...PRE.pyramid(), r: 15, fontSize: 11,
          onClick: ({ node }) => {
            if (mode.value === 'edit') return false;
            if (mode.value === 'play' && node) {
              const ps = structure().preds[idxOf(node.id)];
              if (peb.has(node.id)) { peb.delete(node.id); moves++; }
              else if (ps.every((p) => peb.has(G.nodes[p].id))) { peb.add(node.id); moves++; maxP = Math.max(maxP, peb.size); }
            }
            return true;
          },
          onChange: () => { peb = new Set(); recompute(); S.reset(); } });
        const idxOf = (id) => G.nodes.findIndex((n) => n.id === id);
        const structure = () => {
          const N = G.nodes.length, preds = Array.from({ length: N }, () => []), outd = new Array(N).fill(0);
          for (const e of G.edges) { const a = idxOf(e.from), b = idxOf(e.to); if (a < 0 || b < 0) continue; preds[b].push(a); outd[a]++; }
          const sinks = outd.map((d, i) => (d ? -1 : i)).filter((i) => i >= 0);
          // acyclic?
          const indeg = preds.map((p) => p.length), q = indeg.map((d, i) => (d ? -1 : i)).filter((i) => i >= 0); let seen = 0;
          const succ = Array.from({ length: N }, () => []); preds.forEach((ps, b) => ps.forEach((a) => succ[a].push(b)));
          while (q.length) { const u = q.pop(); seen++; succ[u].forEach((w) => { if (!--indeg[w]) q.push(w); }); }
          return { N, preds, sinks, acyclic: seen === N };
        };
        const recompute = () => {
          const st = structure(); info = null; solFrames = [];
          if (st.acyclic && st.sinks.length === 1 && st.N <= 16) {
            info = minPebbles(st.N, st.preds, st.sinks[0]);
            if (info) { let m = new Set(); solFrames = [{ peb: [], note: `Start: no pebbles. The minimum for this graph is **${info.p}** pebbles; the search explored ${info.states.toLocaleString('en-US')} placements.`, vars: { pebbles: 0 } }];
              info.moves.forEach((mv, k) => { const id = G.nodes[Math.abs(mv) - 1].id; if (mv > 0) m.add(id); else m.delete(id); solFrames.push({ peb: [...m], last: id, add: mv > 0, note: `${mv > 0 ? 'Place a pebble on' : 'Remove the pebble from'} node ${id}${mv > 0 ? ' (all its predecessors are pebbled)' : ' (its value is no longer needed)'}.`, vars: { pebbles: m.size, move: k + 1 } }); }); }
          }
          info = info ? { ...info, st } : { st };
        };
        function load() { G.set({ directed: true, layout: 'none', ...PRE[pre.value]() }); peb = new Set(); moves = 0; maxP = 0; recompute(); S.reset(); }
        const S = v.steps({ frames: () => solFrames, speed: 1.2, still: 2, note: true, counter: 'move' });
        recompute();
        v.render(() => {
          S.el.hidden = mode.value !== 'solve'; S.noteEl.hidden = mode.value !== 'solve';
          const st = info.st, goal = st.sinks.length === 1 ? G.nodes[st.sinks[0]].id : null;
          const cur = mode.value === 'solve' ? new Set(S.frame.peb || []) : peb;
          G.draw({ nodeFill: (id) => (cur.has(id) ? 'accent' : null), nodeRing: (id) => (id === goal ? 'gold' : null), nodeColor: (id) => (id === goal ? 'gold' : null), nodeLabel: (id) => (cur.has(id) ? '' : String(id)), edgeColor: (e) => (cur.has(e.from) ? 'accent' : null) });
        });
        v.legend([['accent', 'pebbled', { dot: true }], ['gold', 'output node to be pebbled']]);
        v.readout(() => {
          const st = info.st, N = st.N;
          if (!st.acyclic) return 'The graph has a directed **cycle** — a computation graph must be acyclic.';
          if (st.sinks.length !== 1) return `The graph needs exactly one output node (it has ${st.sinks.length}).`;
          if (!info.p) return `$N=${N}$ nodes — too many for exhaustive search (limit 16).`;
          const goal = G.nodes[st.sinks[0]].id, won = peb.has(goal);
          const base = `$N=${N}$ nodes: **${info.p}** pebbles suffice and are necessary (exhaustive search over all $2^{${N}}$ placements) · $N/\\log_2 N=${(N / log2(N)).toFixed(1)}$`;
          return mode.value === 'play' ? `${base}\nyour game: **${peb.size}** pebbles on now, **${maxP}** at most, ${moves} moves${won ? ` — output pebbled${maxP === info.p ? ', and with the minimum number of pebbles!' : maxP > info.p ? `, but ${info.p} would have sufficed` : ''}` : ''}` : base;
        });
      },
    },
  ],
};
