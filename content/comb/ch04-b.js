// Combinatorics — Chapter 4: Generating functions (items 4.10–4.18; 4.1–4.9 are in ch04.js)
import {
  CAT, binom, fact, range, commas, allPerms, cyclesOf, setPartitions, stirling2,
  sMul, sInv, sCompose, sExp, sPow, numStr, fracTex, circlePts, DSU, pruferEncode, pruferDecode, edgeKey,
  catalanBig, motzkinBig, fibBig, partitionsBig, bigLog,
} from './ch04.shared.js';

const SQ = Math.sqrt;
const sameEdges = (a, b) => { const A = a.map(edgeKey).sort().join(), B = b.map(edgeKey).sort().join(); return A === B; };

// brute-force tables over all edge subsets of K_n (n <= 6): forests, trees, graphs, connected graphs
const graphCache = new Map();
function graphCounts(n) {
  if (graphCache.has(n)) return graphCache.get(n);
  const E = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) E.push([i, j]);
  let forests = 0, trees = 0, graphs = 0, conn = 0;
  for (let mask = 0; mask < 1 << E.length; mask++) {
    const d = new DSU(n); let acyc = true, comps = n, m = 0;
    for (let e = 0; e < E.length; e++) if ((mask >> e) & 1) { m++; if (!d.union(E[e][0], E[e][1])) acyc = false; else comps--; }
    graphs++; if (comps === 1) conn++; if (acyc) { forests++; if (comps === 1) trees++; }
  }
  const r = { forests, trees, graphs, conn }; graphCache.set(n, r); return r;
}

export default {
  collection: 'comb',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Exponential formula',
      statement: String.raw`Let $c_n$ be the number of **connected** structures of some type on an $n$-element label set ($c_0=0$), where a structure on a label set is, canonically, a set of connected structures on the blocks of a set partition of the labels, and let $a_n$ be the number of all structures ($a_0=1$). Then
$$\sum_{n\ge0}a_n\frac{x^n}{n!}=\exp\Big(\sum_{n\ge1}c_n\frac{x^n}{n!}\Big),\qquad\text{equivalently}\qquad a_{n}=\sum_{k=1}^{n}\binom{n-1}{k-1}c_k\,a_{n-k}.$$
Examples: permutations ($c_n=(n-1)!$ cyclic ones, $a_n=n!$), set partitions ($c_n=1$), forests ($c_n=n^{n-2}$ trees), graphs ($c_n$ = connected graphs, $a_n=2^{\binom n2}$).`,
      idea: String.raw`Decompose by the component containing the label $1$: choose its other $k-1$ labels in $\binom{n-1}{k-1}$ ways, a connected structure on them in $c_k$ ways, and any structure on the remaining $n-k$ labels in $a_{n-k}$ ways. In generating functions this is $A'(x)=C'(x)A(x)$ with $A(0)=1$, whose solution is $A=\exp C$ (4.1's $\exp$ of a series with zero constant term). The same statement says: a structure is a **set** of connected pieces, and "set of" is the operation $\exp$ on EGFs, from the product rule 4.9 divided by the $m!$ orderings of $m$ pieces.`,
      caption: String.raw`Choose the species and $n\le6$. The picture is one random structure (*Resample*), with each connected component coloured. The table counts, **by brute force over all permutations / set partitions / edge subsets of $K_n$**, the connected structures $c_n$ (blue) and all structures $a_n$ (green); the rings are $a_n$ recomputed from the $c_k$ by the exponential formula. They sit exactly on the green dots.`,
      deps: ['comb-4.9'],
      refs: ['Aigner ch. 3'],
      tags: ['generating functions', 'labelled structures'],
      viz(v) {
        const SP = { cyc: 'permutations (connected = one cycle)', set: 'set partitions (connected = one block)', tree: 'forests (connected = tree)', graph: 'graphs (connected = connected graph)' };
        const sSel = v.select('species', Object.keys(SP).map((k) => ({ value: k, label: { cyc: 'permutations', set: 'set partitions', tree: 'forests', graph: 'graphs' }[k] })), 'graph');
        const nS = v.slider('labels $n$', 1, 6, 5, { int: true });
        let seed = 7; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 340, weight: 1, title: 'one random structure; components coloured' });
        const B = v.stage({ x: [0.5, 6.5], y: [0.5, 1e5], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: '$n$', ylabel: 'number of structures', title: 'connected vs all structures' });
        const tab = {};
        const table = (sp) => {
          if (tab[sp]) return tab[sp];
          const conn = [0], all = [1];
          for (let n = 1; n <= 6; n++) {
            if (sp === 'cyc') { const P = allPerms(n); all.push(P.length); conn.push(P.filter((p) => cyclesOf(p).length === 1).length); }
            else if (sp === 'set') { const P = setPartitions(n); all.push(P.length); conn.push(P.filter((r) => Math.max(...r) === 0).length); }
            else { const g = graphCounts(n); if (sp === 'tree') { all.push(g.forests); conn.push(g.trees); } else { all.push(g.graphs); conn.push(g.conn); } }
          }
          return (tab[sp] = { conn, all });
        };
        const expFormula = (c) => { const a = [1]; for (let n = 1; n < c.length; n++) { let s = 0; for (let k = 1; k <= n; k++) s += binom(n - 1, k - 1) * c[k] * a[n - k]; a.push(s); } return a; };
        let info = {};
        v.render(() => {
          const sp = sSel.value, n = nS.value, { conn, all } = table(sp), fm = expFormula(conn);
          const r = v.rng(seed * 31 + n), pts = circlePts(n, 1.1);
          const edges = [], d = new DSU(n); let arcs = [];
          if (sp === 'cyc') { const w = r.shuffle(range(n)); w.forEach((j, i) => { edges.push([i, j]); d.union(i, j); }); arcs = edges; }
          else if (sp === 'set') { const rgs = range(n).map(() => r.int(0, Math.min(2, n - 1))); for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (rgs[i] === rgs[j]) { d.union(i, j); } const last = {}; rgs.forEach((b, i) => { if (last[b] !== undefined) edges.push([last[b], i]); last[b] = i; }); }
          else { const all2 = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) all2.push([i, j]); r.shuffle(all2).forEach(([i, j]) => { if (sp === 'graph' ? r() < 0.4 : (r() < 0.75 && d.find(i) !== d.find(j))) { edges.push([i, j]); d.union(i, j); } }); }
          const roots = [...new Set(range(n).map((i) => d.find(i)))], colOf = (i) => CAT[roots.indexOf(d.find(i)) % CAT.length];
          edges.forEach(([i, j]) => {
            if (i === j) { A.circle(pts[i][0] * 1.22, pts[i][1] * 1.22, 0.12, { color: colOf(i), width: 2.2 }); return; }
            if (sp === 'cyc') A.arrow(pts[i][0], pts[i][1], pts[j][0] * 0.9 + pts[i][0] * 0.1, pts[j][1] * 0.9 + pts[i][1] * 0.1, { color: colOf(i), width: 2, head: 9 });
            else A.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: colOf(i), width: 2.4 });
          });
          pts.forEach(([x, y], i) => { A.dot(x, y, { r: 12, color: colOf(i) }); A.text(String(i + 1), x, y, { color: 'panel', size: 12, align: 'center', baseline: 'middle', weight: 700 }); });
          const sizes = roots.map((rt) => range(n).filter((i) => d.find(i) === rt).length).sort((a, b) => b - a);
          A.corner(`${roots.length} component${roots.length > 1 ? 's' : ''}: sizes ${sizes.join(' + ')}`, 'tl', { plate: true });
          B.setView([0.5, 6.5], [0.5, Math.max(...all) * 2.5]);
          B.path(range(6).map((i) => [i + 1, conn[i + 1]]), { color: 'accent', width: 1.4, alpha: 0.5 }); B.path(range(6).map((i) => [i + 1, all[i + 1]]), { color: 'green', width: 1.4, alpha: 0.5 });
          range(6).forEach((i) => { B.dot(i + 1, conn[i + 1], { r: i + 1 === n ? 7 : 4.5, color: 'accent' }); B.dot(i + 1, all[i + 1], { r: i + 1 === n ? 7 : 4.5, color: 'green' }); B.dot(i + 1, Math.max(0.5, fm[i + 1]), { r: 9, hollow: true, color: 'orange' }); });
          // EGF check through series exp
          const C = [0, ...range(6).map((i) => conn[i + 1] / fact(i + 1))], X = sExp(C, 7);
          info = { sp, n, conn, all, fm, egf: X[n] * fact(n), parts: sizes };
        });
        v.legend([['accent', 'connected $c_n$', { dot: true }], ['green', 'all $a_n$', { dot: true }], ['orange', '$a_n$ from the exponential formula', { dot: true }]]);
        v.readout(() => {
          const { n, conn, all, fm, egf } = info;
          const terms = range(n).map((i) => `\\binom{${n - 1}}{${i}}\\cdot${conn[i + 1]}\\cdot${all[n - i - 1]}`).join('+');
          return String.raw`$n=${n}$: $c_k=${conn.slice(1, n + 1).join(', ')}$ and $a_k=${all.slice(1, n + 1).join(', ')}$ for $k=1..${n}$ (all counted by brute force). Recurrence: $a_${n}=${terms}=${fm[n]}$ ${fm[n] === all[n] ? '✓' : '✗'}; $n!\,[x^{${n}}]\exp C(x)=${Math.round(egf)}$ ${Math.round(egf) === all[n] ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Bell numbers: EGF and Dobiński’s formula',
      credit: 'Dobiński, 1877',
      statement: String.raw`The Bell numbers $B_n$ (the number of partitions of an $n$-element set, 1.14) satisfy
$$\sum_{n\ge0}B_n\frac{x^n}{n!}=\exp\!\big(e^x-1\big),\qquad B_n=\frac1e\sum_{k=0}^{\infty}\frac{k^n}{k!}\quad(n\ge1\text{; for }n=0\text{ read }0^0=1).$$
In particular the series on the right, a sum of positive terms, always evaluates to an **integer** after division by $e$.`,
      idea: String.raw`A set partition is a set of non-empty blocks and a block is a non-empty set, so by the exponential formula (4.10) with $c_k=1$ the EGF is $\exp(e^x-1)$. Dobiński: write $\exp(e^x-1)=e^{-1}\sum_{k\ge0}e^{kx}/k!$ (expand $\exp(e^x)$ in powers of $e^x$) and read off the coefficient of $x^n/n!$ from $e^{kx}=\sum k^nx^n/n!$. The interchange of the two sums is justified because every term is non-negative.`,
      caption: String.raw`Left: the Dobiński terms $k^n/(e\,k!)$ as bars and their running sum (gold) climbing to the integer $B_n$ (green line); the terms peak near $k\approx n/\ln n$ and then die factorially. Right: $\exp(e^x-1)$ against its Taylor polynomial of degree $d$ whose coefficients $B_k/k!$ are the Bell numbers — slide $d$ upwards and the polynomial hugs the curve ever longer.`,
      deps: ['comb-4.10', 'comb-1.14'],
      refs: ['Aigner ch. 3'],
      tags: ['Bell numbers', 'exponential generating function'],
      viz(v) {
        const nS = v.slider('$n$', 1, 12, 6, { int: true });
        const KS = v.slider('terms used $K$', 1, 40, 12, { int: true });
        const dS = v.slider('Taylor degree $d$', 0, 12, 5, { int: true });
        const A = v.stage({ x: [-1, 41], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: '$k$', ylabel: 'terms and running sum', title: 'Dobiński: $\\frac1e\\sum_k k^n/k!$' });
        const B = v.stage({ x: [-2.5, 2], y: [0, 12], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '$x$', ylabel: '$y$', title: '$\\exp(e^x-1)$ and Taylor polynomials' });
        const S2 = stirling2(14);
        const ser = sExp(range(15).map((i) => (i === 0 ? 0 : 1 / fact(i))), 14); // e^x − 1 has coefficients 1/k! for k ≥ 1
        let info = {};
        v.render(() => {
          const n = nS.value, K = KS.value, d = dS.value;
          const lf = [0]; for (let k = 1; k <= 40; k++) lf.push(lf[k - 1] + Math.log(k));
          const t = range(41).map((k) => (k === 0 ? 0 : Math.exp(n * Math.log(k) - lf[k] - 1)));
          let acc = 0; const run = t.map((u) => (acc += u));
          const Bn = S2[n].reduce((a, b) => a + b, 0);
          const hi = Math.max(Bn * 1.15, ...t);
          A.setView([-1, 41], [0, hi]);
          A.bars(t.map((u, k) => (k <= K ? u : 0)), { x0: 0, color: 'accent' });
          A.hline(Bn, { color: 'green', dash: true, width: 2 });
          A.path(run.slice(0, K + 1).map((y, k) => [k, y]), { color: 'gold', width: 2 }); run.slice(0, K + 1).forEach((y, k) => A.dot(k, y, { r: 3, color: 'gold' }));
          A.text(`$B_{${n}}=${Bn}$`, 40.5, Bn, { color: 'green', align: 'right', baseline: 'bottom', size: 13 });
          const f = (x) => Math.exp(Math.exp(x) - 1), tay = (x) => range(d + 1).reduce((s, k) => s + ser[k] * x ** k, 0);
          B.fn(f, { color: 'ink', width: 2.4 }); B.fn(tay, { color: 'orange', width: 2 });
          info = { n, K, d, Bn, partial: run[K], egf: ser[n] * fact(n), term: t };
        });
        v.legend([['accent', 'terms $k^n/(e\\,k!)$', { dot: true }], ['gold', 'running sum', { dot: true }], ['ink', '$\\exp(e^x-1)$'], ['orange', 'Taylor polynomial']]);
        v.readout(() => {
          const { n, K, d, Bn, partial, egf } = info;
          return String.raw`$B_{${n}}=\sum_k S(${n},k)=${commas(Bn)}$ (Stirling numbers of 1.13). Dobiński with $k\le${K}$: $${partial.toFixed(6)}$ — gap $${v.sci(Math.abs(Bn - partial), 2)}$ ${Math.abs(Bn - partial) < 1e-6 ? '✓' : ''}. Coefficient of the Taylor series: $${n}!\,[x^{${n}}]\exp(e^x-1)=${Math.round(egf)}$ ${Math.round(egf) === Bn ? '✓' : '✗'}; the degree-$${d}$ polynomial uses $B_0..B_{${d}}=${range(d + 1).map((k) => S2[k].reduce((a, b) => a + b, 0)).join(', ')}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'André’s theorem: alternating permutations',
      credit: 'Désiré André, 1879–1881',
      statement: String.raw`A permutation $w_1\dots w_n$ of $[n]$ is **up–down** (alternating) if $w_1<w_2>w_3<w_4>\cdots$. Let $E_n$ be the number of them ($E_0=E_1=1$). Then
$$\sum_{n\ge0}E_n\frac{x^n}{n!}=\sec x+\tan x,$$
so $E_n=1,1,1,2,5,16,61,272,1385,7936,\dots$ (the *Euler zigzag numbers*; $E_{2m}$ are the secant numbers, $E_{2m+1}$ the tangent numbers).`,
      idea: String.raw`Count the permutations of $[n+1]$ ($n\ge1$) that alternate in either direction: there are $2E_{n+1}$ of them. The largest letter $n+1$ must be a peak; if it has $k$ letters before it, then cutting there leaves an alternating word on $k$ letters and one on $n-k$ letters, with directions forced by the position. Choosing which labels go left gives $2E_{n+1}=\sum_k\binom nkE_kE_{n-k}$ (the product rule 4.9), i.e. $2y'=1+y^2$ for $y=\sum E_nx^n/n!$. With $y(0)=1$ this differential equation is solved by $\sec x+\tan x$.`,
      caption: String.raw`Slide $n$: the first up–down permutations are drawn as zigzag graphs (found by a depth-first search that only builds alternating prefixes), and the full count is compared with $n!\,[x^n]$ of the series for $\sec x+\tan x$ computed as $1/\cos x+\sin x/\cos x$ with the series of 4.1. Right: the function and its Taylor polynomial of degree $n$ (coefficients $E_k/k!$), which blows up at $x=\pi/2$ — the dominant singularity (4.16) that makes $E_n/n!\approx2(2/\pi)^{n+1}$.`,
      deps: ['comb-4.9', 'comb-2.1'],
      refs: ['Stanley EC1 §1.6'],
      tags: ['alternating permutations', 'generating functions'],
      viz(v) {
        const nS = v.slider('$n$', 1, 10, 6, { int: true });
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 340, weight: 1.35, title: 'up–down permutations $w_1<w_2>w_3<\\cdots$' });
        const B = v.stage({ x: [-1.7, 1.7], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: '$x$', ylabel: '$y$', title: '$\\sec x+\\tan x$ and its Taylor polynomial' });
        const cosS = range(16).map((k) => (k % 2 ? 0 : (k / 2 % 2 ? -1 : 1) / fact(k))), sinS = range(16).map((k) => (k % 2 ? ((k - 1) / 2 % 2 ? -1 : 1) / fact(k) : 0));
        const inv = sInv(cosS, 16), tanS = sMul(sinS, inv, 16), ser = inv.map((x, i) => x + tanS[i]);
        const cache = new Map();
        const zig = (n) => { if (cache.has(n)) return cache.get(n);
          const list = []; let count = 0; const w = [], used = Array(n + 1).fill(false);
          const rec = () => { if (w.length === n) { count++; if (list.length < 40) list.push(w.slice()); return; }
            for (let x = 1; x <= n; x++) { if (used[x]) continue; const L = w.length; if (L >= 1) { const up = L % 2 === 1; if (up ? w[L - 1] > x : w[L - 1] < x) continue; } used[x] = true; w.push(x); rec(); w.pop(); used[x] = false; } };
          rec(); const r = { list, count }; cache.set(n, r); return r; };
        let info = {};
        v.render(() => {
          const n = nS.value, { list, count } = zig(n), shown = Math.min(list.length, n >= 8 ? 24 : 40);
          const wI = n + 0.8, hI = n + 1.2, cols = Math.max(1, Math.round(Math.sqrt(1.9 * shown * wI * hI) / wI)), rows = Math.ceil(shown / cols);
          A.setView([-0.4, cols * wI], [-0.3, rows * hI]);
          list.slice(0, shown).forEach((w, i) => {
            const ox = (i % cols) * wI, oy = (rows - 1 - Math.floor(i / cols)) * hI;
            A.path(w.map((x, j) => [ox + j * 0.78 + 0.3, oy + x * 0.9 - 0.2]), { color: 'accent', width: 1.5, alpha: 0.8 });
            w.forEach((x, j) => A.dot(ox + j * 0.78 + 0.3, oy + x * 0.9 - 0.2, { r: 2.6, color: j % 2 ? 'orange' : 'accent' }));
          });
          A.corner(`showing ${shown} of ${count}`, 'tl', { plate: true });
          const E = range(16).map((k) => Math.round(ser[k] * fact(k)));
          B.fn((x) => 1 / Math.cos(x) + Math.tan(x), { domain: [-1.7, 1.55], color: 'ink', width: 2.4 });
          B.fn((x) => range(n + 1).reduce((s, k) => s + ser[k] * x ** k, 0), { color: 'orange', width: 2 });
          B.vline(Math.PI / 2, { color: 'red', dash: true, width: 1.6 });
          info = { n, count, E, approx: 2 * (2 / Math.PI) ** (n + 1) * fact(n) };
        });
        v.legend([['accent', 'peaks / valleys', { dot: true }], ['ink', '$\\sec x+\\tan x$'], ['orange', 'Taylor polynomial of degree $n$'], ['red', '$x=\\pi/2$', { dash: true }]]);
        v.readout(() => {
          const { n, count, E, approx } = info;
          return String.raw`$n=${n}$: up–down permutations found by search: **${commas(count)}**; $n!\,[x^{${n}}](\sec x+\tan x)=${E[n]}$ ${count === E[n] ? '✓' : '✗'}. Zigzag numbers $E_0..E_{10}=${E.slice(0, 11).join(', ')}$. Dominant-pole estimate $2\,n!\,(2/\pi)^{n+1}=${approx.toFixed(1)}$ (ratio ${(E[n] / approx).toFixed(3)}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Lagrange inversion formula',
      credit: 'Lagrange, 1770 (generalised by Bürmann, 1790s)',
      statement: String.raw`Let $\varphi(u)=\varphi_0+\varphi_1u+\cdots$ be a formal power series with $\varphi_0\ne0$. Then $T=x\,\varphi(T)$ has a unique formal power series solution $T(x)=\sum_{n\ge1}t_nx^n$ with $T(0)=0$, and
$$t_n=[x^n]T=\frac1n\,[u^{n-1}]\,\varphi(u)^n\qquad(n\ge1),$$
and more generally $[x^n]H(T(x))=\frac1n[u^{n-1}]\big(H'(u)\varphi(u)^n\big)$ for any series $H$.`,
      idea: String.raw`Existence: the equation determines $t_n$ from $t_1,\dots,t_{n-1}$ (the right side's coefficient of $x^n$ involves only lower ones), so fixed-point iteration $T\mapsto x\varphi(T)$ fixes one more coefficient each step. For the formula, write $T=x\varphi(T)$ as $x=T/\varphi(T)$, i.e. $T$ is the compositional inverse of $f(u)=u/\varphi(u)$, and use the residue calculus (rca-10.42): $t_n=\frac1{2\pi i}\oint \frac{T\,dx}{x^{n+1}}$, change variables $x=f(u)$ and integrate by parts to get $\frac1n\frac{1}{2\pi i}\oint \varphi(u)^n u^{-n}\,du$.`,
      caption: String.raw`Choose $\varphi(u)=(1+u)^k e^{cu}$ (e.g. $k=2,c=0$: Catalan numbers; $k=0,c=1$: rooted labelled trees $n^{n-1}/n!$). Left: after $m$ fixed-point iterations the coefficients of $T$ (blue) agree with the Lagrange formula (green rings) in the first $m$ places. Right: the formula as a residue integral, $t_n=\frac1{2\pi}\int_0^{2\pi}\frac1n\varphi(u)^nu^{1-n}d\theta$ on the circle $|u|=r$: the **average** of the plotted curve is $t_n$ for every radius $r$ — drag $r$ and it does not move.`,
      deps: ['comb-4.1', 'rca-10.42'],
      refs: ['Aigner ch. 3'],
      tags: ['Lagrange inversion', 'residues'],
      viz(v) {
        const kS = v.slider('$k$ in $(1+u)^k$', 0, 4, 2, { int: true });
        const cS = v.slider('$c$ in $e^{cu}$', 0, 2, 0, { step: 0.5 });
        const mS = v.slider('iterations $m$', 0, 10, 3, { int: true });
        const nS = v.slider('coefficient $n$', 1, 9, 4, { int: true });
        const rS = v.slider('contour radius $r$', 0.1, 2, 0.8, { step: 0.05 });
        const A = v.stage({ x: [0.4, 9.6], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: '$n$', ylabel: '$\\log_{10}(1+t_n)$', title: '$T$ after $m$ iterations vs Lagrange' });
        const B = v.stage({ x: [0, 6.2832], y: [-1, 1], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: '$\\theta$ ($u=re^{i\\theta}$)', ylabel: '$\\mathrm{Re}\\,g$', title: 'the residue integral on $|u|=r$' });
        const N = 11;
        let info = {};
        v.render(() => {
          const k = kS.value, c = cS.value, m = mS.value, n = nS.value, r = rS.value;
          const bin = range(N).map((j) => binom(k, j)), ex = range(N).map((j) => c ** j / fact(j)), phi = sMul(bin, ex, N);
          let T = Array(N).fill(0);
          for (let i = 0; i < m; i++) { const c2 = sCompose(phi, T, N); T = [0, ...c2.slice(0, N - 1)]; }
          let Tstar = Array(N).fill(0);
          for (let i = 0; i < N + 1; i++) { const c2 = sCompose(phi, Tstar, N); Tstar = [0, ...c2.slice(0, N - 1)]; }
          const lag = range(N).map((j) => (j === 0 ? 0 : sPow(phi, j, N)[j - 1] / j));
          const sl = (x) => Math.log10(1 + Math.abs(x));
          const hi = Math.max(0.3, ...lag.slice(1, 10).map(sl)) * 1.2;
          A.setView([0.4, 9.6], [0, hi]); A.setTicks(range(9).map((i) => i + 1), null);
          A.bars(T.slice(1, 10).map(sl), { x0: 1, color: (val, i) => (Math.abs(T[i + 1] - lag[i + 1]) < 1e-9 ? 'accent' : 'red') });
          lag.slice(1, 10).forEach((y, i) => A.dot(i + 1, sl(y), { r: 9, hollow: true, color: 'green' }));
          // residue integral
          const g = (th) => {
            const ur = r * Math.cos(th), ui = r * Math.sin(th), rho = Math.hypot(1 + ur, ui), al = Math.atan2(ui, 1 + ur);
            const ang = k * n * al + c * n * ui + (1 - n) * th, mag = rho ** (k * n) * Math.exp(c * n * ur) * r ** (1 - n) / n;
            return [mag * Math.cos(ang), mag * Math.sin(ang)];
          };
          const M = 400; let sRe = 0, sIm = 0; for (let i = 0; i < M; i++) { const q = g((2 * Math.PI * i) / M); sRe += q[0] / M; sIm += q[1] / M; }
          const ys = range(200).map((i) => g((2 * Math.PI * i) / 200)[0]), mm = Math.max(1e-9, ...ys.map(Math.abs), Math.abs(sRe)) * 1.15;
          B.setView([0, 6.2832], [-mm, mm]);
          B.hline(0, { color: 'faint' }); B.fn((th) => g(th)[0], { color: 'accent', width: 2 }); B.hline(sRe, { color: 'green', dash: true, width: 2.2 });
          const correct = range(N).findIndex((j, i) => i >= 1 && Math.abs(T[j] - lag[j]) > 1e-9);
          info = { k, c, m, n, r, lag, sRe, sIm, T, correct: correct < 0 ? N - 1 : correct - 1, phi, Tstar };
        });
        v.legend([['accent', '$T$ after $m$ iterations', { dot: true }], ['red', 'not yet correct', { dot: true }], ['green', 'Lagrange formula / contour average', { dot: true }]]);
        v.readout(() => {
          const { k, c, m, n, r, lag, sRe, sIm, correct, Tstar } = info;
          const phiTex = `(1+u)^{${k}}${c ? `e^{${c === 1 ? '' : c}u}` : ''}`;
          return String.raw`$\varphi(u)=${phiTex}$. After $m=${m}$ iterations the first **${Math.min(correct, 9)}** coefficients of $T$ are exact. $T=${Tstar.slice(0, 7).map((x, i) => (Math.abs(x) < 1e-12 ? '' : `${i ? '+' : ''}${fracTex(x) === '1' && i ? '' : fracTex(x)}${i === 1 ? 'x' : i > 1 ? `x^{${i}}` : ''}`)).join('').replace(/^\+/, '')}+\cdots$.` + '\n' +
            String.raw`$t_{${n}}=\frac1{${n}}[u^{${n - 1}}]\varphi^{${n}}=${numStr(lag[n])}$; contour average on $|u|=${r.toFixed(2)}$: $${sRe.toFixed(6)}${Math.abs(sIm) > 1e-9 ? '' : ''}$ ${Math.abs(sRe - lag[n]) < 1e-6 * Math.max(1, Math.abs(lag[n])) ? '✓ (imaginary part $<10^{-9}$)' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Prüfer codes',
      credit: 'Prüfer, 1918',
      statement: String.raw`For $n\ge2$ the map $T\mapsto(p_1,\dots,p_{n-2})$ defined by repeatedly deleting the smallest-labelled leaf of the tree $T$ on $[n]$ and recording the label of the neighbour it was attached to, is a **bijection** from labelled trees on $[n]$ onto words in $[n]^{n-2}$. The degree of $v$ in $T$ equals $1+(\text{number of occurrences of }v\text{ in the code})$; the inverse joins, at step $i$, the smallest label not occurring in $p_i,\dots,p_{n-2}$ and not yet used to $p_i$, and finally joins the last two unused labels.`,
      idea: String.raw`Leaves are exactly the vertices that never appear in the code, because a vertex is recorded once for each deleted neighbour, i.e. $\deg-1$ times. Hence from the code alone we can tell which leaf was deleted first (the smallest label missing from the word), and its neighbour is $p_1$; deleting it leaves a tree whose code is $p_2\dots p_{n-2}$ — induction on $n$ gives the inverse and shows the two maps are mutually inverse. A tree always has at least two leaves, so the process never runs out.`,
      caption: String.raw`A random labelled tree on a circle (*New tree*). **Encode:** slide the step $t$ and watch leaves being deleted (grey) while the code grows underneath. **Decode:** the same code is given, and the edges are rebuilt one by one by always joining the smallest unused label that is missing from the remaining code. The readout checks both composites, $\mathrm{decode}\circ\mathrm{encode}=\mathrm{id}$ and $\mathrm{encode}\circ\mathrm{decode}=\mathrm{id}$.`,
      deps: ['comb-1.4'],
      refs: ['Aigner ch. 3'],
      tags: ['trees', 'bijections'],
      viz(v) {
        const nS = v.slider('vertices $n$', 4, 12, 8, { int: true });
        const mode = v.select('direction', [{ value: 'enc', label: 'encode: tree → code' }, { value: 'dec', label: 'decode: code → tree' }], 'enc');
        const tS = v.slider('step $t$', 0, 11, 0, { int: true });
        let seed = 11; v.button('New tree', () => { seed++; });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.55], equal: true, axes: false, height: 360, weight: 1, title: 'the tree' });
        const B = v.stage({ x: [0, 12], y: [-1, 1], axes: false, height: 360, weight: 0.8, title: 'the code $(p_1,\\dots,p_{n-2})$', minWidth: 220 });
        let info = {};
        v.render(() => {
          const n = nS.value, r = v.rng(seed * 977 + n);
          const word = range(n - 2).map(() => r.int(0, n - 1)), dec = pruferDecode(n, word), edges = dec.edges, enc = pruferEncode(n, edges);
          const back = pruferDecode(n, enc.code);
          const t = Math.min(tS.value, n - 1); tS.set(t); const isEnc = mode.value === 'enc';
          const pts = circlePts(n, 1.15);
          const E = edges.map((e, i) => ({ e, i }));
          // edge i < n-2 is (leaf_i, code_i); edge n-2 is the last one
          E.forEach(({ e, i }) => {
            const gone = isEnc ? i < t : i >= t;
            const [a, b] = e;
            if (isEnc) A.line(pts[a][0], pts[a][1], pts[b][0], pts[b][1], { color: gone ? 'faint' : 'ink', width: gone ? 1.2 : 2.6, dash: gone ? true : undefined, alpha: gone ? 0.6 : 1 });
            else if (!gone) A.line(pts[a][0], pts[a][1], pts[b][0], pts[b][1], { color: i === t - 1 ? 'gold' : i === n - 2 ? 'green' : 'ink', width: i === t - 1 ? 4 : 2.6 });
            if (isEnc && i === t - 1) A.line(pts[a][0], pts[a][1], pts[b][0], pts[b][1], { color: 'gold', width: 4 });
          });
          const removed = new Set(isEnc ? dec.leaves.slice(0, Math.min(t, n - 2)) : []);
          const remainingCode = word.slice(isEnc ? 0 : t);
          const nextLeaf = isEnc ? (t < n - 2 ? dec.leaves[t] : -1) : (t < n - 2 ? dec.leaves[t] : -1);
          pts.forEach(([x, y], i) => {
            const col = removed.has(i) ? 'faint' : i === nextLeaf ? 'gold' : 'accent';
            A.dot(x, y, { r: 13, color: col, alpha: removed.has(i) ? 0.5 : 1 }); A.text(String(i + 1), x, y, { color: 'panel', size: 12, align: 'center', baseline: 'middle', weight: 700 });
          });
          // code strip
          B.setView([0, 12], [-1, 1]);
          const shown = isEnc ? Math.min(t, n - 2) : n - 2;
          range(n - 2).forEach((i) => {
            const xx = 0.7 + i * (10.6 / (n - 2));
            const live = isEnc ? i < shown : i >= t;
            B.rect(xx - 0.4, -0.35, xx + 0.4, 0.35, { fill: live ? (i === shown - 1 && isEnc ? 'gold' : 'accent') : 'faint', fillAlpha: live ? 0.35 : 0.08, color: live ? 'accent' : 'faint', width: 1.4 });
            if (live || !isEnc) B.text(String(word[i] + 1), xx, 0, { size: 15, color: live ? 'ink' : 'muted', align: 'center', baseline: 'middle' });
            B.text(`$p_{${i + 1}}$`, xx, -0.7, { size: 10, color: 'muted', align: 'center' });
          });
          B.text(isEnc ? 'leaves deleted: ' + dec.leaves.slice(0, shown).map((x) => x + 1).join(', ') : 'edges built: ' + edges.slice(0, Math.min(t, n - 1)).map(([a, b]) => `${a + 1}–${b + 1}`).join(', '), 0.2, 0.8, { size: 12, color: 'muted', align: 'left' });
          info = { n, t, word, ok1: sameEdges(back.edges, edges), ok2: enc.code.join() === word.join(), degOk: range(n).every((i) => edges.filter(([a, b]) => a === i || b === i).length === 1 + word.filter((x) => x === i).length), leaves: dec.leaves, remainingCode, nextLeaf, isEnc };
        });
        v.legend([['accent', 'vertex', { dot: true }], ['gold', 'current leaf / edge', { dot: true }], ['faint', 'deleted', { dot: true }]]);
        v.readout(() => {
          const { n, t, word, ok1, ok2, degOk, nextLeaf, remainingCode, isEnc } = info;
          return String.raw`Code $(${word.map((x) => x + 1).join(',')})$ has ${word.length} letters, so there are $${n}^{${n - 2}}=${commas(n ** (n - 2))}$ possible codes. ` +
            (t < n - 2 ? String.raw`Step $t=${t}$: ${isEnc ? 'the smallest leaf is' : 'the smallest label missing from the remaining code $(' + remainingCode.map((x) => x + 1).join(',') + ')$ is'} **${nextLeaf + 1}**, joined to $p_{${t + 1}}=${word[t] + 1}$.` : t === n - 2 ? 'All letters used: two vertices remain and they are joined by the last edge.' : 'Complete.') + '\n' +
            String.raw`decode(encode($T$)) $=T$ ${ok1 ? '✓' : '✗'}; encode(decode(code)) $=$ code ${ok2 ? '✓' : '✗'}; $\deg v=1+\#\{v\text{ in code}\}$ for all $v$ ${degOk ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Cayley’s formula nⁿ⁻² for labelled trees',
      credit: 'Cayley’s formula',
      statement: String.raw`The number of trees on the vertex set $[n]$ is $n^{\,n-2}$ for $n\ge1$. For $n=1$ the single vertex has degree $0$. For $n\ge2$, the number of them in which vertex $1$ has degree $d$ is $\binom{n-2}{d-1}(n-1)^{\,n-1-d}$, so under the uniform distribution $\deg(1)-1\sim\mathrm{Bin}(n-2,\tfrac1n)$.`,
      idea: String.raw`By the Prüfer bijection (4.14) trees correspond to words in $[n]^{n-2}$, and there are $n^{n-2}$ of those. The degree statement also falls out: $\deg(1)=1+\#\{i:p_i=1\}$, and the number of words with exactly $d-1$ ones is $\binom{n-2}{d-1}(n-1)^{n-1-d}$. A uniform random word gives a uniform random labelled tree, which is how the sampler on the right works.`,
      caption: String.raw`Left: for small $n$ **every** set of $n-1$ edges of $K_n$ is tested (is it acyclic?), the trees are tallied by the degree of vertex 1 (bars), and the formula $\binom{n-2}{d-1}(n-1)^{n-1-d}$ is overlaid (rings). Middle: random Prüfer words → uniform random trees on $n'$ vertices: the empirical law of $\deg(1)-1$ from the sample (bars) against $\mathrm{Bin}(n'-2,1/n')$ (rings). Right: the last sampled tree.`,
      deps: ['comb-4.14'],
      refs: ['Cameron, Notes on Counting, Theorem7.1 and Proposition7.2, pp.85–86'],
      tags: ['trees', 'Cayley'],
      viz(v) {
        const nS = v.slider('exact: $n$', 3, 7, 6, { int: true });
        const mS = v.slider('sampled: $n\'$', 5, 24, 12, { int: true });
        const NS = v.slider('sample size', 200, 5000, 2000, { step: 100, int: true });
        let seed = 5; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0.4, 7.6], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'degree $d$ of vertex 1', ylabel: 'number of trees', title: 'all trees on $[n]$, by $\\deg(1)$' });
        const B = v.stage({ x: [-0.6, 6.6], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: '$\\deg(1)-1$', ylabel: 'frequency', title: 'random trees from random codes' });
        const C = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 300, weight: 0.8, title: 'one sample', minWidth: 220 });
        const cache = new Map();
        const exact = (n) => { if (cache.has(n)) return cache.get(n);
          const E = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) E.push([i, j]);
          const deg1 = Array(n + 1).fill(0); let trees = 0; const pick = [];
          const rec = (start, dsu) => {
            if (pick.length === n - 1) { trees++; deg1[pick.filter(([a]) => a === 0).length]++; return; }
            for (let e = start; e < E.length; e++) { const d2 = new DSU(n); pick.forEach(([a, b]) => d2.union(a, b)); if (d2.find(E[e][0]) === d2.find(E[e][1])) continue; pick.push(E[e]); rec(e + 1); pick.pop(); }
          };
          rec(0); const r = { trees, deg1 }; cache.set(n, r); return r; };
        let info = {};
        v.render(() => {
          const n = nS.value, np = mS.value, NN = NS.value, { trees, deg1 } = exact(n);
          const form = range(n).map((i) => (i === 0 ? 0 : binom(n - 2, i - 1) * (n - 1) ** (n - 1 - i)));
          A.setView([0.4, n + 0.6], [0, Math.max(...deg1, ...form) * 1.15]); A.setTicks(range(n).slice(1), null);
          A.bars(deg1.slice(1, n), { x0: 1, color: 'accent' }); form.slice(1).forEach((y, i) => A.dot(i + 1, y, { r: 9, hollow: true, color: 'green' }));
          const r = v.rng(seed * 13 + np); let last = null; const cnt = Array(np).fill(0), degSum = Array(np).fill(0);
          for (let s = 0; s < NN; s++) {
            const code = range(np - 2).map(() => r.int(0, np - 1)); const k = code.filter((x) => x === 0).length; cnt[k]++;
            if (s === 0) last = code;
          }
          const bin = range(np - 1).map((k) => binom(np - 2, k) * (1 / np) ** k * (1 - 1 / np) ** (np - 2 - k));
          const maxK = Math.min(6, np - 2);
          B.setView([-0.6, maxK + 0.6], [0, Math.max(...cnt.slice(0, maxK + 1).map((c) => c / NN), ...bin.slice(0, maxK + 1)) * 1.2]); B.setTicks(range(maxK + 1), null);
          B.bars(cnt.slice(0, maxK + 1).map((c) => c / NN), { x0: 0, color: 'accent' }); bin.slice(0, maxK + 1).forEach((y, k) => B.dot(k, y, { r: 9, hollow: true, color: 'green' }));
          const dec = pruferDecode(np, last), P = circlePts(np, 1.15);
          dec.edges.forEach(([a, b]) => C.line(P[a][0], P[a][1], P[b][0], P[b][1], { color: 'ink', width: 2 }));
          P.forEach(([x, y], i) => { C.dot(x, y, { r: np > 14 ? 8 : 12, color: i === 0 ? 'gold' : 'accent' }); if (np <= 14) C.text(String(i + 1), x, y, { color: 'panel', size: 11, align: 'center', baseline: 'middle', weight: 700 }); });
          const meanDeg = (2 * (np - 1)) / np;
          info = { n, trees, np, NN, mean1: cnt.reduce((s, c, k) => s + c * (k + 1), 0) / NN, expect: 1 + (np - 2) / np, tv: 0.5 * bin.reduce((s, q, k) => s + Math.abs(q - cnt[k] / NN), 0), meanDeg, allDist: range(n).slice(1).every((d) => deg1[d] === form[d]) };
        });
        v.legend([['accent', 'counted / sampled', { dot: true }], ['green', 'formula', { dot: true }]]);
        v.readout(() => {
          const { n, trees, np, NN, mean1, expect, tv, allDist } = info;
          return String.raw`$n=${n}$: of the $\binom{${n * (n - 1) / 2}}{${n - 1}}=${commas(binom(n * (n - 1) / 2, n - 1))}$ edge sets with $n-1$ edges, exactly **${commas(trees)}** are trees; $n^{n-2}=${commas(n ** (n - 2))}$ ${trees === n ** (n - 2) ? '✓' : '✗'}; the degree-of-vertex-1 counts equal $\binom{n-2}{d-1}(n-1)^{n-1-d}$ ${allDist ? '✓' : '✗'}.` + '\n' +
            String.raw`Sample of ${commas(NN)} random trees on $n'=${np}$ vertices: mean $\deg(1)=${mean1.toFixed(3)}$ vs $1+(n'-2)/n'=${expect.toFixed(3)}$; total-variation distance to the binomial law $=${tv.toFixed(3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Theorem',
      name: 'Exponential growth from the dominant singularity',
      statement: String.raw`Let $A(x)=\sum a_nx^n$ be a power series with positive radius of convergence $\rho$ (the distance from $0$ to the nearest singularity of the function it defines; Cauchy–Hadamard). Then
$$\limsup_{n\to\infty}|a_n|^{1/n}=\frac1\rho .$$
So $a_n$ grows like $\rho^{-n}$ up to subexponential factors: $a_n=\rho^{-n+o(n)}$. If $\rho=0$ the coefficients grow faster than any exponential, and if $\rho=\infty$ slower than any. For coefficients $\ge0$ the dominant singularity lies on the positive real axis at $x=\rho$ (Pringsheim, which is why one looks along the positive axis).`,
      idea: String.raw`This is the root test for power series from analysis (pma-3.39: the radius of convergence is $1/\limsup|a_n|^{1/n}$), together with the identification of the radius with the closest singularity: a power series is analytic in its disc of convergence and cannot be continued analytically past a singularity on the boundary circle. The *size* of the correction is the interesting part: a pole of order $m$ gives $n^{m-1}\rho^{-n}$, a square-root branch point $n^{-3/2}\rho^{-n}$, which is why the $n$-th roots converge only slowly.`,
      caption: String.raw`Pick a generating function. Left: $a_n^{1/n}$ (blue) and the ratios $a_{n+1}/a_n$ (orange) tend to $1/\rho$ (green line), but slowly — the polynomial factor $n^{-3/2}$ for Catalan, $n^{-3/2}$ for Motzkin, the constant for Fibonacci (a pole), and the subexponential $e^{\pi\sqrt{2n/3}}$ for partitions ($\rho=1$, natural boundary). Right: the singularities in the $x$-plane, with the disc of radius $\rho$ ending at the nearest one.`,
      scope: String.raw`Coefficients are exact integers (big-integer arithmetic) up to $n=150$; the singularities drawn are those of the closed forms $1/(1-x-x^2)$, $\frac{1-\sqrt{1-4x}}{2x}$, $\frac{1-x-\sqrt{1-2x-3x^2}}{2x^2}$ and $\prod(1-x^k)^{-1}$ (unit circle: natural boundary).`,
      deps: ['comb-4.1', 'pma-3.39'],
      refs: ['Stanley EC1 §4.1'],
      tags: ['asymptotics', 'singularities'],
      viz(v) {
        const NMAX = 150;
        const G = {
          fib: { nm: 'Fibonacci', tex: '\\frac1{1-x-x^2}', a: fibBig(NMAX + 3).slice(1), rho: (SQ(5) - 1) / 2, sing: [[(SQ(5) - 1) / 2, 0, 'pole'], [-(SQ(5) + 1) / 2, 0, 'pole']], R: 2 },
          cat: { nm: 'Catalan', tex: '\\frac{1-\\sqrt{1-4x}}{2x}', a: catalanBig(NMAX + 2), rho: 0.25, sing: [[0.25, 0, 'branch']], R: 0.6 },
          mot: { nm: 'Motzkin', tex: '\\frac{1-x-\\sqrt{1-2x-3x^2}}{2x^2}', a: motzkinBig(NMAX + 2), rho: 1 / 3, sing: [[1 / 3, 0, 'branch'], [-1, 0, 'branch']], R: 1.35 },
          par: { nm: 'partitions', tex: '\\prod_k\\frac1{1-x^k}', a: partitionsBig(NMAX + 2), rho: 1, sing: [], R: 1.35 },
        };
        const sel = v.select('generating function', Object.keys(G).map((k) => ({ value: k, label: G[k].nm })), 'cat');
        const nS = v.slider('$n$', 5, NMAX, 60, { int: true });
        const A = v.stage({ x: [0, NMAX + 3], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.3, xlabel: '$n$', ylabel: 'estimate of $1/\\rho$', title: '$a_n^{1/n}$ and $a_{n+1}/a_n$' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: true, height: 330, weight: 1, title: 'singularities in the $x$-plane' });
        let info = {};
        v.render(() => {
          const g = G[sel.value], n = nS.value, lg = g.a.map((b) => bigLog(b));
          const root = (m) => Math.exp(lg[m] / m), ratio = (m) => Math.exp(lg[m + 1] - lg[m]);
          const target = 1 / g.rho, ms = range(NMAX).map((i) => i + 2), hi = Math.max(target * 1.25, ...ms.map(root).filter(isFinite).map((x) => Math.min(x, target * 3)));
          A.setView([0, NMAX + 3], [target > 1.5 ? 1 : 0.8, hi]);
          A.hline(target, { color: 'green', dash: true, width: 2 });
          A.path(ms.map((m) => [m, root(m)]), { color: 'accent', width: 2 }); A.path(ms.slice(0, -1).map((m) => [m, ratio(m)]), { color: 'orange', width: 2 });
          A.vline(n, { color: 'gold', width: 1.5 }); A.dot(n, root(n), { r: 6, color: 'accent' }); A.dot(n, ratio(n), { r: 6, color: 'orange' });
          B.setView([-g.R, g.R], [-g.R, g.R]);
          B.circle(0, 0, g.rho, { fill: 'green', fillAlpha: 0.12, color: 'green', width: 2 });
          if (sel.value === 'par') B.circle(0, 0, 1, { color: 'red', width: 3, dash: [2, 5] });
          if (sel.value === 'cat') B.segment([0.25, 0], [g.R, 0], { color: 'red', width: 3 });
          if (sel.value === 'mot') { B.segment([1 / 3, 0], [g.R, 0], { color: 'red', width: 3 }); B.segment([-g.R, 0], [-1, 0], { color: 'red', width: 3 }); }
          g.sing.forEach(([x, y]) => B.dot(x, y, { r: 6, color: 'red' }));
          B.text('$\\rho$', g.rho * 0.5, 0, { color: 'green', size: 13, dy: -12 });
          info = { g, n, r: root(n), q: ratio(n), target };
        });
        v.legend([['accent', '$a_n^{1/n}$', { dot: true }], ['orange', '$a_{n+1}/a_n$', { dot: true }], ['green', '$1/\\rho$', { dash: true }], ['red', 'singularities / cut', { dot: true }]]);
        v.readout(() => {
          const { g, n, r, q, target } = info;
          return String.raw`$A(x)=${g.tex}$, $\rho=${g.rho.toFixed(4)}$, so $1/\rho=${target.toFixed(4)}$. At $n=${n}$: $a_n^{1/n}=${r.toFixed(4)}$ (${((r / target - 1) * 100).toFixed(1)}% off), ratio $a_{n+1}/a_n=${q.toFixed(4)}$ (${((q / target - 1) * 100).toFixed(1)}% off). ` + (info.g.nm === 'partitions' ? 'Here $1/\\rho=1$: $p(n)$ grows only subexponentially, like $e^{\\pi\\sqrt{2n/3}}$.' : 'Both estimates converge to $1/\\rho$ as $n\\to\\infty$.');
        });
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Theorem',
      name: 'Zeckendorf’s theorem',
      credit: 'Zeckendorf’s representation theorem',
      statement: String.raw`Every positive integer $n$ can be written **uniquely** as a sum of Fibonacci numbers $F_{i_1}+F_{i_2}+\cdots+F_{i_r}$ with $i_1>i_2>\cdots>i_r\ge2$ and $i_j-i_{j+1}\ge2$ (no two consecutive Fibonacci numbers; $F_2=1,F_3=2,F_4=3,F_5=5,\dots$). The representation is produced by the greedy algorithm: repeatedly subtract the largest Fibonacci number not exceeding what is left.`,
      idea: String.raw`Existence by the greedy step: if $F_k\le n<F_{k+1}$ then $n-F_k<F_{k+1}-F_k=F_{k-1}$, so the remainder is smaller than $F_{k-1}$ and the next chosen index is at most $k-2$ — never consecutive. Uniqueness: a sum of non-consecutive Fibonacci numbers with largest term $F_k$ is at most $F_k+F_{k-2}+\cdots=F_{k+1}-1<F_{k+1}$ (telescoping $F_{j}=F_{j+1}-F_{j-1}$), so the largest term must be the greedy $F_k$ with $F_k\le n<F_{k+1}$; then induct on the remainder.`,
      caption: String.raw`Move $n$. Top: the greedy algorithm cuts $[0,n]$ into Fibonacci blocks, largest first. Middle: which Fibonacci numbers were used (gold) — never two neighbours. Bottom: for every $m\le 300$, in how many ways $m$ is a sum of **distinct** Fibonacci numbers if neighbours *are* allowed (dots; found by testing all $2^{13}$ subsets): usually many, but **exactly one** of those ways has no neighbours. The readout counts both.`,
      deps: ['comb-4.3'],
      refs: ['Knuth, Fibonacci Multiplication (1988), pp.57–58; greedy and uniqueness induction given here'],
      tags: ['Fibonacci', 'number representation'],
      viz(v) {
        const nS = v.slider('$n$', 1, 300, 100, { int: true });
        const FI = range(13).map((i) => i + 2), F = fibBig(16).map(Number);
        const A = v.stage({ x: [0, 300], y: [0, 1], axes: false, height: 120, full: true, title: 'greedy decomposition of $[0,n]$' });
        const B = v.stage({ x: [1.2, 14.8], y: [0, 1], axes: false, height: 150, weight: 1, title: 'Fibonacci numbers used', minWidth: 300 });
        const C = v.stage({ x: [0, 300], y: [0, 1], axes: 'box', gutter: true, height: 210, weight: 1.4, xlabel: '$m$', ylabel: 'representations', title: 'representations as sums of distinct Fibonacci numbers' });
        // all subsets of F_2..F_14
        const rep = Array(401).fill(0), nonc = Array(401).fill(0);
        for (let mask = 0; mask < 1 << 13; mask++) {
          let s = 0; for (let b = 0; b < 13; b++) if ((mask >> b) & 1) s += F[b + 2];
          if (s <= 400) { rep[s]++; if ((mask & (mask >> 1)) === 0) nonc[s]++; }
        }
        let info = {};
        v.render(() => {
          const n = nS.value; let rest = n; const used = [];
          while (rest > 0) { let k = 2; while (F[k + 1] <= rest) k++; used.push(k); rest -= F[k]; }
          A.setView([0, Math.max(300, n)], [0, 1]);
          let x = 0; used.forEach((k, j) => { A.rect(x, 0.15, x + F[k], 0.85, { fill: CAT[j % CAT.length], fillAlpha: 0.75, color: CAT[j % CAT.length], width: 1.2 }); if (F[k] > 12) A.text(`$F_{${k}}=${F[k]}$`, x + F[k] / 2, 0.5, { size: 12, color: 'panel', align: 'center', baseline: 'middle' }); x += F[k]; });
          for (const k of FI) { const used2 = used.includes(k); B.rect(k - 0.42, 0.25, k + 0.42, 0.9, { fill: used2 ? 'gold' : 'faint', fillAlpha: used2 ? 0.7 : 0.1, color: used2 ? 'gold' : 'faint', width: 1.2 }); B.text(String(F[k]), k, 0.58, { size: used2 ? 13 : 11, color: used2 ? 'ink' : 'muted', align: 'center', baseline: 'middle' }); B.text(`$F_{${k}}$`, k, 0.08, { size: 10, color: 'muted', align: 'center', baseline: 'middle' }); }
          C.setView([0, 300], [0, Math.max(...rep.slice(1, 301)) * 1.12]);
          for (let m = 1; m <= 300; m++) C.dot(m, rep[m], { r: m === n ? 6 : 2.2, color: m === n ? 'gold' : 'accent', alpha: m === n ? 1 : 0.7 });
          C.hline(1, { color: 'green', dash: true, width: 1.6 });
          info = { n, used, sum: used.reduce((s, k) => s + F[k], 0), consec: used.some((k, j) => j && used[j - 1] - k < 2), allR: rep[n], uniq: nonc[n] };
        });
        v.legend([['gold', 'used', { dot: true }], ['green', 'exactly one non-adjacent representation', { dash: true }]]);
        v.readout(() => {
          const { n, used, sum, consec, allR, uniq } = info;
          return String.raw`$${n}=${used.map((k) => `F_{${k}}`).join('+')}=${used.map((k) => F[k]).join('+')}$, sum ${sum === n ? '✓' : '✗'}; indices differ by at least 2: ${consec ? '✗' : '✓'}. Testing all $2^{13}$ subsets: **${uniq}** subset${uniq === 1 ? '' : 's'} with no two neighbouring Fibonacci numbers sums to $${n}$ ${uniq === 1 ? '✓ (unique)' : '✗'}, while ${allR} subsets of distinct Fibonacci numbers do.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Theorem',
      name: 'Ehrhart polynomials and reciprocity',
      credit: 'Ehrhart, 1962 (polynomiality) and 1967; Macdonald, 1971 (reciprocity)',
      statement: String.raw`Let $P\subset\R^d$ be a convex polytope with integer vertices, and $L_P(t)=\#(tP\cap\Z^d)$ for integers $t\ge0$. Then $L_P(t)$ is a polynomial in $t$ of degree $\dim P$, with leading coefficient $\mathrm{vol}\,P$ and constant term $1$ (and next coefficient half the boundary volume). Moreover **reciprocity** holds:
$$L_P(-t)=(-1)^{\dim P}\,\#\big(\mathrm{int}(tP)\cap\Z^d\big)\qquad(t\ge1).$$
For a lattice polygon: $L_P(t)=At^2+\tfrac b2t+1$ with $A$ the area and $b$ the number of boundary lattice points (this is Pick's theorem at $t=1$).`,
      idea: String.raw`Triangulate $P$ into lattice simplices and count points in each by the half-open decomposition: the generating function $\sum_t L_P(t)x^t$ is a proper rational function with denominator $(1-x)^{d+1}$, which by 4.4 means $L_P$ is a polynomial of degree $\le d$. Reciprocity comes from Stanley's reading of the same rational function: $\sum_{t\ge1}L_P(-t)x^t=-F(1/x)$, which turns into the generating function of interior points (Ehrhart–Macdonald). In the plane, the coefficients come from Pick's theorem applied to the dilates.`,
      caption: String.raw`Drag the four vertices (they snap to the integer grid; the polygon is their convex hull) and dilate by $t$. Lattice points of $tP$: blue = interior, orange = boundary. Right: the counts $L(0),\dots,L(6)$ (dots) lie on a quadratic whose leading coefficient is the area; **extend it to negative $t$**: at $-t$ its value equals the number of interior points of $tP$ (green rings), which is reciprocity.`,
      deps: ['comb-4.4'],
      refs: ['Stanley EC1 §4.6'],
      tags: ['Ehrhart', 'lattice points'],
      viz(v) {
        const tS = v.slider('dilation $t$', 1, 3, 2, { int: true });
        const A = v.stage({ x: [-1, 13], y: [-1, 13], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.3, title: 'lattice polygon $P$ (handles) and its dilate $tP$' });
        const B = v.stage({ x: [-7, 7], y: [-2, 30], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: '$t$', ylabel: '$L_P(t)$', title: 'Ehrhart polynomial, extended to $t<0$' });
        const init = [[0, 0], [3, 0], [3, 2], [1, 3]];
        const snap = (x, y) => [Math.max(0, Math.min(4, Math.round(x))), Math.max(0, Math.min(4, Math.round(y)))];
        const hs = init.map((p, i) => A.handle(p[0], p[1], { color: ['accent', 'accent', 'accent', 'accent'][i], r: 8, constrain: snap }));
        const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
        const hull = (P) => { const pts = [...new Map(P.map((p) => [p.join(), p])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (pts.length < 3) return pts;
          const lo = []; for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
          const up = []; for (const p of [...pts].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
          return lo.slice(0, -1).concat(up.slice(0, -1)); };
        const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
        const status = (H, t, x, y) => { // 2 interior, 1 boundary, 0 outside (relative to the polygon tH in the plane)
          if (H.length >= 3) { let on = false; for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], c = cross([t * a[0], t * a[1]], [t * b[0], t * b[1]], [x, y]); if (c < 0) return 0; if (c === 0) on = true; } return on ? 1 : 2; }
          return 0; };
        const countsOf = (H, t) => { // [closed, interior] counts of tH
          if (H.length === 1) return [1, 1];
          if (H.length === 2) { const g = gcd(H[1][0] - H[0][0], H[1][1] - H[0][1]); return [g * t + 1, Math.max(0, g * t - 1)]; }
          let c = 0, i2 = 0; const xs = H.map((p) => p[0] * t), ys = H.map((p) => p[1] * t);
          for (let x = Math.min(...xs); x <= Math.max(...xs); x++) for (let y = Math.min(...ys); y <= Math.max(...ys); y++) { const s = status(H, t, x, y); if (s) c++; if (s === 2) i2++; }
          return [c, i2]; };
        let info = {};
        v.render(() => {
          const t = tS.value, H = hull(hs.map((h) => [h.x, h.y])), d = H.length >= 3 ? 2 : H.length === 2 ? 1 : 0;
          for (let x = -1; x <= 13; x++) for (let y = -1; y <= 13; y++) { const s = H.length >= 3 ? status(H, t, x, y) : 0; A.dot(x, y, { r: s ? 4.2 : 1.8, color: s === 2 ? 'blue' : s === 1 ? 'orange' : 'faint', alpha: s ? 1 : 0.6 }); }
          if (H.length >= 2) { A.poly(H.map(([x, y]) => [x * t, y * t]), { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.07 }); A.poly(H, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.12 }); }
          if (H.length === 2) A.segment([H[0][0] * t, H[0][1] * t], [H[1][0] * t, H[1][1] * t], { color: 'ink', width: 2 });
          const L = range(7).map((i) => countsOf(H, i)[0]), I = range(7).map((i) => (i ? countsOf(H, i)[1] : 0));
          // fit quadratic through t = 0, 1, 2
          const q = (x) => { const y0 = L[0], y1 = L[1], y2 = L[2]; return y0 * (x - 1) * (x - 2) / 2 - y1 * x * (x - 2) + y2 * x * (x - 1) / 2; };
          const cA = (L[2] - 2 * L[1] + L[0]) / 2, cB = L[1] - L[0] - cA, dev = Math.max(...L.map((y, i) => Math.abs(q(i) - y)));
          const rec = range(6).map((i) => [-(i + 1), (d % 2 ? -1 : 1) * I[i + 1]]);
          const recDev = Math.max(...rec.map(([x, y]) => Math.abs(q(x) - y)));
          const ymax = Math.max(...L, 5) * 1.1, ymin = Math.min(...rec.map((r) => r[1]), q(-3.5), 0, ...range(15).map((i) => q(-7 + i)));
          B.setView([-7, 7], [Math.min(ymin * 1.1, -1), ymax]); B.setTicks(range(15).map((i) => i - 7), null);
          B.vline(0, { color: 'faint' }); B.hline(0, { color: 'faint' });
          B.fn(q, { domain: [-7, 7], color: 'orange', width: 2 });
          L.forEach((y, i) => B.dot(i, y, { r: i === t ? 8 : 5, color: i === t ? 'gold' : 'accent' }));
          rec.forEach(([x, y]) => B.dot(x, y, { r: 8, hollow: true, color: 'green' }));
          let area2 = 0, bd = 0; for (let i = 0; i < H.length && H.length >= 3; i++) { const a = H[i], b = H[(i + 1) % H.length]; area2 += a[0] * b[1] - a[1] * b[0]; bd += gcd(b[0] - a[0], b[1] - a[1]); }
          info = { H, d, t, L, I, cA, cB, dev, recDev, area: area2 / 2, bd };
        });
        v.legend([['accent', '$L(t)=\\#(tP\\cap\\Z^2)$', { dot: true }], ['green', '$(-1)^d\\,\\#\\mathrm{int}(tP)$ at $-t$', { dot: true }], ['orange', 'fitted quadratic', {}]]);
        v.readout(() => {
          const { H, d, t, L, I, cA, cB, dev, recDev, area, bd } = info;
          if (d < 2) return String.raw`The four points span a ${d === 1 ? 'segment' : 'point'} (dimension $${d}$): $L(t)=${numStr(cA)}t^2+${numStr(cB)}t+1$ — a polynomial of degree $${d}$ ${dev < 1e-9 ? '✓' : '✗'}. Drag the vertices apart for a polygon.`;
          return String.raw`$L(0..6)=${L.join(', ')}$ fits $L(t)=${numStr(cA)}t^2+${numStr(cB)}t+1$ exactly (largest miss $${dev < 1e-9 ? '0' : numStr(dev)}$ ${dev < 1e-9 ? '✓' : '✗'}). Area $A=${numStr(area)}$ ${Math.abs(area - cA) < 1e-9 ? '= leading coefficient ✓' : '✗'}; boundary points $b=${bd}$, $b/2=${numStr(bd / 2)}$ ${Math.abs(bd / 2 - cB) < 1e-9 ? '= linear coefficient ✓ (Pick)' : '✗'}.` + '\n' +
            String.raw`Reciprocity: $L(-t)$ vs interior points of $tP$ for $t=1..6$ — interior counts $${I.slice(1).join(', ')}$, and $L(-t)=${range(6).map((i) => numStr(cA * (i + 1) ** 2 - cB * (i + 1) + 1)).join(', ')}$ ${recDev < 1e-9 ? '✓ equal' : '✗'}. Currently showing $${t}P$.`;
        });
      },
    },
  ],
};
