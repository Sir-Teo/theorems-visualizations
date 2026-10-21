// Rudin, Real and Complex Analysis — Chapter 4, part 4: the Hausdorff maximality theorem,
// maximal orthonormal sets, and trigonometric series (4.21–4.26).

/** q̂_k(n) = C(2k,k+n)/C(2k,k), the Fourier coefficients of Q_k = c_k((1+cos t)/2)^k, for n = 0..k. */
function kernelCoeffs(k) {
  const q = [1];
  for (let n = 1; n <= k; n++) q.push(q[n - 1] * (k - n + 1) / (k + n));
  return q;
}
/** c_k = 1 / [(1/2π)∫((1+cos t)/2)^k dt] = 4^k / C(2k,k). */
function kernelConst(k) { let p = 1; for (let j = 1; j <= k; j++) p *= (2 * j - 1) / (2 * j); return 1 / p; }
/** Real trig coefficients (a_n, b_n), n ≤ nmax, of samples ys on the midpoint grid ts of [-π,π]; f ~ a0/2 + Σ a_n cos nt + b_n sin nt. */
function trigCoeffsGrid(ts, ys, nmax) {
  const N = ts.length, a = [], b = [];
  for (let n = 0; n <= nmax; n++) {
    let sa = 0, sb = 0;
    for (let i = 0; i < N; i++) { sa += ys[i] * Math.cos(n * ts[i]); sb += ys[i] * Math.sin(n * ts[i]); }
    a.push(2 * sa / N); b.push(2 * sb / N);
  }
  return { a, b };
}
/** Evaluate a0/2 + Σ_{n≤K} w_n (a_n cos nt + b_n sin nt) on the points ts. */
function trigEvalAll(ts, { a, b }, K, w = null) {
  return ts.map((t) => {
    let s = a[0] / 2;
    for (let n = 1; n <= K; n++) { const wn = w ? w[n] : 1; if (wn) s += wn * (a[n] * Math.cos(n * t) + b[n] * Math.sin(n * t)); }
    return s;
  });
}
const L2n = (ys) => Math.sqrt(ys.reduce((s, y) => s + y * y, 0) / ys.length); // (1/2π)∫|·|² on a uniform grid
/** TeX scientific notation for small numbers */
const sci = (x) => { if (x === 0) return '0'; if (Math.abs(x) >= 1e-3) return x.toFixed(4); const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(1)}\\times10^{${e}}`; };

export default {
  collection: 'rca',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.21
    {
      num: '4.21',
      kind: 'Theorem',
      name: 'Hausdorff maximality theorem',
      credit: 'Hausdorff, 1914',
      statement: String.raw`Every nonempty partially ordered set contains a maximal totally ordered subset.`,
      idea: String.raw`This is equivalent to the axiom of choice (and to Zorn's lemma); Rudin proves it in the Appendix from the axiom of choice. Starting from any chain one keeps adjoining comparable elements; for infinite sets the "keep going" step is made rigorous by a transfinite/fixed-point argument, which is where choice enters.`,
      caption: String.raw`A finite instance: $\{2,\dots,30\}$ ordered by divisibility, drawn by number of prime factors. Click numbers to build a subset; green nodes form your chain, orange rings mark the elements comparable with *every* member — the only ones that can be added. When no orange ring is left the chain is maximal. Maximal chains need not be large: $\{17\}$ is already maximal, while $\{2,4,8,16\}$ is too. (In a finite set this greedy process ends; the theorem's content is that it can be completed in every partially ordered set.)`,
      deps: ['rca-4.20'],
      tags: ['order', 'axiom of choice'],
      viz(v) {
        const M = v.M;
        const P = M.range(29, 2);
        const omega = (n) => { let c = 0; for (let p = 2; p * p <= n; p++) while (n % p === 0) { n /= p; c++; } return c + (n > 1 ? 1 : 0); };
        const le = (a, b) => b % a === 0; // a | b
        const comp = (a, b) => le(a, b) || le(b, a);
        const layers = [1, 2, 3, 4].map((L) => P.filter((n) => omega(n) === L));
        const pos = {};
        layers[0].forEach((n, i) => { pos[n] = [0.6 + 8.8 * i / (layers[0].length - 1), 1]; });
        for (let L = 1; L < 4; L++) {
          const row = layers[L].map((n) => { const ds = P.filter((d) => d !== n && le(d, n) && omega(d) === L); return [n, M.mean(ds.map((d) => pos[d][0]))]; }).sort((a, b) => a[1] - b[1]);
          const span = Math.min(8.8, 0.95 * (row.length - 1));
          row.forEach(([n], i) => { pos[n] = [5 - span / 2 + (row.length > 1 ? span * i / (row.length - 1) : span / 2), L + 1]; });
        }
        const edges = [];
        for (const a of P) for (const b of P) if (a !== b && le(a, b) && omega(b) === omega(a) + 1) edges.push([a, b]);
        let chain = new Set([3, 6]);
        const S = v.stage({ x: [0, 10], y: [0.45, 4.55], height: 340, axes: false });
        S.onClick((x, y) => {
          let best = null, bd = 0.3;
          for (const n of P) { const d = Math.hypot(pos[n][0] - x, pos[n][1] - y); if (d < bd) { bd = d; best = n; } }
          if (best != null) { if (chain.has(best)) chain.delete(best); else chain.add(best); }
        });
        const candidates = () => P.filter((n) => !chain.has(n) && [...chain].every((m) => comp(n, m)));
        let seed = 1;
        v.button('add one comparable element', () => { const c = candidates(); if (c.length) chain.add(c[0]); });
        v.button('random maximal chain', () => {
          const R = M.rng(seed++); chain = new Set([R.pick(P)]);
          for (;;) { const c = candidates(); if (!c.length) break; chain.add(R.pick(c)); }
        });
        v.button('clear', () => { chain = new Set(); });
        let st = {};
        v.render(() => {
          const ch = [...chain].sort((a, b) => a - b);
          const bad = new Set();
          for (const a of ch) for (const b of ch) if (a < b && !comp(a, b)) { bad.add(a); bad.add(b); }
          const total = bad.size === 0;
          const cand = total ? candidates() : [];
          for (const [a, b] of edges) {
            const on = chain.has(a) && chain.has(b) && total;
            S.line(pos[a][0], pos[a][1], pos[b][0], pos[b][1], { color: on ? 'green' : 'faint', width: on ? 3 : 1, alpha: on ? 1 : 0.7 });
          }
          // chain links that skip a layer (e.g. 3 | 12): dashed
          for (let i = 0; i + 1 < ch.length && total; i++) {
            const a = ch[i], b = ch[i + 1];
            if (omega(b) > omega(a) + 1) S.line(pos[a][0], pos[a][1], pos[b][0], pos[b][1], { color: 'green', width: 2, dash: [5, 4] });
          }
          for (const n of P) {
            const [x, y] = pos[n];
            const inC = chain.has(n), isBad = bad.has(n), isCand = cand.includes(n);
            if (isCand) S.dot(x, y, { r: 17, color: 'orange', hollow: true, width: 3 });
            S.dot(x, y, { r: 13, color: isBad ? 'red' : inC ? 'green' : 'muted', hollow: !(inC || isBad), width: 1.4 });
            S.text(String(n), x, y, { align: 'center', size: 12, weight: 600, color: inC || isBad ? 'panel' : 'ink', halo: false });
          }
          S.text('primes', 0.1, 1, { size: 11, color: 'muted', align: 'left', dy: 26 });
          const msg = !ch.length ? ['the empty chain — click a number', 'muted'] : !total ? ['not totally ordered: the red elements are incomparable', 'red'] : cand.length ? [`chain, not maximal: ${cand.length} element(s) can still be added`, 'orange'] : ['maximal totally ordered subset', 'green'];
          S.corner(msg[0], 'tl', { color: msg[1], weight: 600 });
          v.legend([['green', 'the chain $\\Omega$', { dot: true }], ['orange', 'comparable with every element of $\\Omega$', { dot: true }], ['red', 'incomparable pair', { dot: true }]]);
          st = { ch, cand, total };
        });
        v.readout(() => {
          const s = st; if (!s.ch) return '';
          const set = (a) => `\\{${a.join(',\\,')}\\}`;
          if (!s.ch.length) return 'Click any number to start a chain.';
          if (!s.total) return `$\\Omega = ${set(s.ch)}$ is not totally ordered (some pair divides neither way).`;
          return `$\\Omega = ${set(s.ch)}$ is totally ordered; ` + (s.cand.length ? `it can be enlarged by any of $${set(s.cand)}$.` : 'no element of $\\{2,\\dots,30\\}$ is comparable with all of it, so it is **maximal**.');
        });
      },
    },

    // ------------------------------------------------------------------ 4.22
    {
      num: '4.22',
      kind: 'Theorem',
      name: 'Every orthonormal set extends to a maximal one',
      statement: String.raw`Every orthonormal set $B$ in a Hilbert space $H$ is contained in a maximal orthonormal set in $H$.`,
      idea: String.raw`Let $\mathscr P$ be the family of orthonormal sets containing $B$, partially ordered by inclusion; it is nonempty since $B\in\mathscr P$. By the Hausdorff maximality theorem (4.21) it has a maximal totally ordered subfamily $\Omega$. The union $S$ of the members of $\Omega$ is orthonormal (any two of its vectors lie in a common member of the chain) and contains $B$. If some orthonormal $S^*\supsetneq S$ existed, $\Omega\cup\{S^*\}$ would be a larger chain; so $S$ is maximal.`,
      caption: String.raw`In $\R^3$: $B=\{u_1\}$ (set its direction). Step through a chain $\{u_1\}\subset\{u_1,u_2\}\subset\{u_1,u_2,u_3\}$. At each stage the orange set shows every unit vector that could still be added — the whole circle $u_1^\perp\cap S^2$, then just the two points $\pm u_3$, then nothing: the set is maximal (and, by 4.18, an orthonormal basis). Many different maximal extensions exist; in infinite dimensions the chain may be infinite, and Hausdorff's theorem replaces the step-by-step choice.`,
      deps: ['rca-4.21', 'rca-4.13'],
      tags: ['orthonormal basis', 'axiom of choice'],
      viz(v) {
        const M = v.M;
        const step = v.select('chain', [{ value: 1, label: '$\\{u_1\\}$' }, { value: 2, label: '$\\{u_1,u_2\\}$' }, { value: 3, label: '$\\{u_1,u_2,u_3\\}$' }], 2);
        const th = v.slider('direction of $u_1$', -1.2, 1.2, 0.35, { step: 0.01 });
        const ps = v.slider('position of $u_2$ on the circle', 0, 6.28, 1.0, { step: 0.01 });
        const S3 = v.stage3d({ range: 1.2, height: 400, yaw: -0.55, pitch: 0.32, axes: false });
        let st = {};
        v.render(() => {
          const k = +step.value;
          const u1 = M.normalize([Math.sin(th.value) * 0.6, Math.sin(th.value) * 0.8, Math.cos(th.value)]);
          // orthonormal basis of u1-perp
          const a = M.normalize(M.cross3(u1, Math.abs(u1[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])), b = M.cross3(u1, a);
          const circ = (s) => M.vadd(M.vscale(a, Math.cos(s)), M.vscale(b, Math.sin(s)));
          const u2 = circ(ps.value), u3 = M.cross3(u1, u2);
          // faint sphere
          for (let i = 1; i < 6; i++) { const z = -1 + 2 * i / 6, r = Math.sqrt(1 - z * z); S3.curve((s) => [r * Math.cos(s), r * Math.sin(s), z], 0, M.TAU, { color: 'grid', width: 0.8, n: 80 }); }
          for (let i = 0; i < 6; i++) { const p = Math.PI * i / 6; S3.curve((s) => [Math.cos(p) * Math.sin(s), Math.sin(p) * Math.sin(s), Math.cos(s)], 0, M.TAU, { color: 'grid', width: 0.8, n: 80 }); }
          // candidates for extension
          if (k === 1) S3.curve(circ, 0, M.TAU, { color: 'orange', width: 3.2, n: 160 });
          if (k >= 2) S3.curve(circ, 0, M.TAU, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.6, n: 160 });
          if (k === 2) {
            S3.poly(M.range(48).map((i) => M.vadd(M.vscale(u1, Math.cos(i * M.TAU / 48)), M.vscale(u2, Math.sin(i * M.TAU / 48)))), { fill: 'purple', fillAlpha: 0.1, color: 'purple', alpha: 0.35 });
            for (const sg of [1, -1]) S3.dot(M.vscale(u3, sg), { r: 8, color: 'orange' });
            S3.line(M.vscale(u3, -1.25), M.vscale(u3, 1.25), { color: 'orange', width: 1.2, dash: [4, 4] });
          }
          S3.arrow([0, 0, 0], u1, { color: 'accent', width: 3 });
          S3.dot(u1, { r: 4, color: 'accent', label: 'u₁' });
          if (k >= 2) { S3.arrow([0, 0, 0], u2, { color: 'purple', width: 3 }); S3.dot(u2, { r: 4, color: 'purple', label: 'u₂' }); }
          if (k >= 3) { S3.arrow([0, 0, 0], u3, { color: 'teal', width: 3 }); S3.dot(u3, { r: 4, color: 'teal', label: 'u₃' }); }
          S3.dot([0, 0, 0], { r: 3, color: 'ink' });
          const vs = [u1, u2, u3].slice(0, k);
          let err = 0; vs.forEach((p, i) => vs.forEach((q, j) => { err = Math.max(err, Math.abs(M.dot(p, q) - (i === j ? 1 : 0))); }));
          v.legend([['accent', '$u_1\\in B$'], ['purple', '$u_2$'], ['teal', '$u_3$'], ['orange', 'unit vectors orthogonal to the current set']]);
          st = { k, err };
        });
        v.readout(() => {
          const s = st; if (!s.k) return '';
          const what = ['a whole circle of unit vectors is orthogonal to it: not maximal', 'exactly two unit vectors $\\pm u_3$ remain: not maximal', 'no unit vector is orthogonal to all three: **maximal**'][s.k - 1];
          return `stage ${s.k}: $\\dim(\\operatorname{span})^\\perp = ${3 - s.k}$, $\\;\\max|(u_i,u_j)-\\delta_{ij}| = ${sci(s.err)}$ — ${what}.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.23
    {
      num: '4.23',
      kind: 'Definition',
      name: 'The circle T, L^p(T) and the trigonometric system',
      statement: String.raw`Let $T$ be the unit circle in $\C$. Functions on $T$ are identified with $2\pi$-periodic functions on $\R$ via $f(t)=F(e^{it})$. $L^p(T)$ is the space of (classes of) measurable $2\pi$-periodic $f$ with
$$\|f\|_p=\Big\{\frac1{2\pi}\int_{-\pi}^{\pi}|f(t)|^p\,dt\Big\}^{1/p}<\infty,$$
and $C(T)$ the continuous ones with the sup norm. $L^2(T)$ is a Hilbert space with $(f,g)=\frac1{2\pi}\int_{-\pi}^{\pi}f(t)\overline{g(t)}\,dt$. A *trigonometric polynomial* is a finite sum $a_0+\sum_{n=1}^N(a_n\cos nt+b_n\sin nt)=\sum_{n=-N}^{N}c_ne^{int}$. With $u_n(t)=e^{int}$ $(n\in\Z)$, the set $\{u_n\}$ is orthonormal in $L^2(T)$: the *trigonometric system*.`,
      idea: String.raw`Orthonormality is the computation $\frac1{2\pi}\int_{-\pi}^{\pi}e^{i(m-n)t}\,dt=\delta_{mn}$: for $m\ne n$ the integrand winds $|m-n|$ times around the circle and averages to $0$. The rest of the chapter applies 4.17–4.18 to this system once it is known to be maximal (4.24).`,
      caption: String.raw`Pick $m$ and $n$. Left: as $t$ runs over $[-\pi,\pi]$ the product $u_m(t)\overline{u_n(t)}=e^{i(m-n)t}$ winds $|m-n|$ times around $T$ (drawn as a slowly widening spiral so the turns are visible); its average (the inner product) is the green centre of mass. Right: real and imaginary parts, whose signed areas cancel unless $m=n$.`,
      deps: ['rca-4.13', 'rca-3.11'],
      tags: ['Fourier', 'orthonormal'],
      viz(v) {
        const M = v.M;
        const mS = v.slider('$m$', -5, 5, 3, { int: true });
        const nS = v.slider('$n$', -5, 5, 1, { int: true });
        const C = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, height: 300, minWidth: 260, weight: 0.8, axes: false, title: '$e^{i(m-n)t}$ on $T$ (spread out radially)' });
        const R = v.stage({ x: [-Math.PI - 0.45, Math.PI], y: [-1.35, 1.35], height: 300, minWidth: 320, weight: 1.2, axes: 'box', yticks: [-1, 0, 1], xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], title: 'real and imaginary parts of $u_m\\overline{u_n}$' });
        let st = {};
        v.render(() => {
          const d = mS.value - nS.value;
          C.line(-1.3, 0, 1.3, 0, { color: 'grid', width: 1 }); C.line(0, -1.3, 0, 1.3, { color: 'grid', width: 1 });
          C.circle(0, 0, 1, { color: 'faint', width: 1.2, dash: [3, 4] });
          const rad = (t) => 0.78 + 0.3 * (t + Math.PI) / M.TAU;
          C.curve((t) => [Math.cos(d * t) * rad(t), Math.sin(d * t) * rad(t)], -Math.PI, Math.PI, { color: 'accent', width: 2.2, n: 800 });
          C.dot(Math.cos(-d * Math.PI) * rad(-Math.PI), Math.sin(-d * Math.PI) * rad(-Math.PI), { color: 'accent', r: 4 });
          C.tex('T', Math.SQRT1_2, Math.SQRT1_2, { color: 'muted', dx: 12, dy: -12, size: 14 });
          // numerical average
          const N = 2000; let re = 0, im = 0;
          for (let i = 0; i < N; i++) { const t = -Math.PI + M.TAU * (i + 0.5) / N; re += Math.cos(d * t); im += Math.sin(d * t); }
          re /= N; im /= N;
          C.dot(re, im, { color: 'green', r: 6.5 });
          C.tex('(u_m,u_n)', re, im, { color: 'green', dy: 18, size: 13 });
          R.line(-Math.PI, 0, Math.PI, 0, { color: 'faint', width: 1 });
          R.fn((t) => Math.cos(d * t), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.12, domain: [-Math.PI, Math.PI] });
          R.fn((t) => Math.sin(d * t), { color: 'orange', width: 1.8, dash: [6, 4], domain: [-Math.PI, Math.PI] });
          v.legend([['accent', '$\\cos (m-n)t$', { area: true }], ['orange', '$\\sin (m-n)t$', { dash: true }], ['green', 'average $=(u_m,u_n)$', { dot: true }]]);
          st = { d, re, im };
        });
        v.readout(() => {
          const s = st; if (s.d == null) return '';
          const cl = (x) => (Math.abs(x) < 5e-5 ? 0 : x);
          return `$(u_m,u_n) = \\frac1{2\\pi}\\int_{-\\pi}^{\\pi}e^{i(m-n)t}\\,dt = ${v.fix(cl(s.re), 4)} ${cl(s.im) < 0 ? '-' : '+'} ${v.fix(Math.abs(cl(s.im)), 4)}\\,i$` + (s.d === 0 ? ' — $m=n$: unit length.' : ` — orthogonal (the curve winds ${Math.abs(s.d)} time${Math.abs(s.d) > 1 ? 's' : ''}).`);
        });
      },
    },

    // ------------------------------------------------------------------ 4.24
    {
      num: '4.24',
      kind: 'Theorem',
      name: 'Completeness of the trigonometric system',
      statement: String.raw`The trigonometric polynomials are dense in $L^2(T)$; equivalently (4.18), the trigonometric system $\{e^{int}:n\in\Z\}$ is a maximal orthonormal set in $L^2(T)$.`,
      idea: String.raw`By 4.18 it suffices to approximate every $f\in L^2(T)$ by trigonometric polynomials. Since $C(T)$ is dense in $L^2(T)$ (3.14; $T$ is compact) there is a continuous $g$ with $\|f-g\|_2<\eps$, and since $\|h\|_2\le\|h\|_\infty$ it is enough to find a trigonometric polynomial $P$ with $\|g-P\|_\infty<\eps$. Rudin obtains such $P$ as $g*Q_k$ with the positive kernels $Q_k=c_k\big(\frac{1+\cos t}2\big)^k$; the uniform estimate is stated as Theorem 4.25.`,
      caption: String.raw`The proof as a chain of approximations. A discontinuous $f\in L^2(T)$ (black) is first replaced by a continuous $g$ — here its moving average over windows of width $w$ (orange) — and $g$ by the trigonometric polynomial $P=g*Q_k$ of degree $k$ (green). The bars check $\|f-P\|_2\le\|f-g\|_2+\|g-P\|_\infty$: shrink $w$ and raise $k$ and the trigonometric polynomials get as close to $f$ in $L^2$ as you like.`,
      deps: ['rca-4.18', 'rca-4.23', 'rca-3.14', 'rca-4.25'],
      see: ['pma-8.15'],
      verify: true,
      tags: ['Fourier', 'density'],
      viz(v) {
        const M = v.M;
        const NG = 2048, ts = M.range(NG).map((i) => -Math.PI + M.TAU * (i + 0.5) / NG);
        const FX = {
          ind: { label: '$\\chi_{[-1,1.5]}$', f: (t) => (t >= -1 && t <= 1.5 ? 1 : 0) },
          saw: { label: 'sawtooth $t/\\pi$', f: (t) => t / Math.PI },
          stair: { label: 'staircase', f: (t) => Math.floor((t + Math.PI) / (M.TAU / 4)) / 3 - 0.5 },
        };
        const which = v.select('$f$', Object.entries(FX).map(([value, F]) => ({ value, label: F.label })), 'ind');
        const wS = v.slider('window $w$', 0.02, 1.2, 0.5, { step: 0.01 });
        const kS = v.slider('degree $k$', 1, 120, 12, { int: true });
        const T = v.stage({ x: [-Math.PI, Math.PI], y: [-1.3, 1.5], height: 290, full: true, axes: 'box', yticks: [0, 1], xticks: [[-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2']], title: '$f\\in L^2(T)$, a continuous $g$, and a trigonometric polynomial $P$' });
        const B = v.stage({ x: [0, 1], y: [0, 3.4], height: 150, full: true, axes: false });
        let st = {};
        v.render(() => {
          const F = FX[which.value].f, w = wS.value, k = kS.value;
          // periodic samples and moving average via prefix sums (exact for the sampled f)
          const fs = ts.map(F);
          const pre = [0]; for (let i = 0; i < 3 * NG; i++) pre.push(pre[i] + fs[i % NG]);
          const h = Math.max(1, Math.round(w / (M.TAU / NG) / 2));
          const gs = ts.map((_, i) => (pre[i + NG + h + 1] - pre[i + NG - h]) / (2 * h + 1));
          const co = trigCoeffsGrid(ts, gs, k);
          const q = kernelCoeffs(k);
          const Ps = trigEvalAll(ts, co, k, q);
          const efg = L2n(fs.map((x, i) => x - gs[i]));
          const egP = Math.max(...gs.map((x, i) => Math.abs(x - Ps[i])));
          const efP = L2n(fs.map((x, i) => x - Ps[i]));
          const lo = Math.min(...fs, ...Ps), hi = Math.max(...fs, ...Ps), pad = 0.12 * (hi - lo);
          T.setView(null, [lo - pad, hi + pad]);
          const pts = (arr) => ts.map((t, i) => (i % 2 ? null : [t, arr[i]])).filter(Boolean);
          T.path(pts(fs), { color: 'ink', width: 2.4 });
          T.path(pts(gs), { color: 'orange', width: 2.2 });
          T.path(pts(Ps), { color: 'green', width: 2.4 });
          // bars
          const top = Math.max(efg + egP, efP, 0.05) * 1.1;
          B.setView([-0.32 * top, top], null);
          const bar = (y, x0, x1, col, lab) => { B.rect(x0, y - 0.32, x1, y + 0.32, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 }); B.tex(lab, -0.02 * top, y, { align: 'right', size: 13 }); };
          bar(2.6, 0, efg, 'orange', '\\|f-g\\|_2');
          bar(1.7, 0, egP, 'green', '\\|g-P\\|_\\infty');
          bar(0.8, 0, efP, 'accent', '\\|f-P\\|_2');
          B.rect(efg, 0.8 - 0.32, efg + egP, 0.8 + 0.32, { color: 'muted', width: 1.2, dash: [4, 3] });
          B.line(efg, 0.4, efg, 3.0, { color: 'faint', width: 1, dash: [2, 3] });
          v.legend([['ink', '$f$'], ['orange', '$g$: moving average (continuous)'], ['green', `$P=g*Q_{${k}}$, degree $${k}$`]]);
          st = { efg, egP, efP };
        });
        v.readout(() => {
          const s = st; if (s.efg == null) return '';
          return `$\\|f-P\\|_2 = ${v.fix(s.efP, 4)} \\le \\|f-g\\|_2 + \\|g-P\\|_2 \\le \\|f-g\\|_2+\\|g-P\\|_\\infty = ${v.fix(s.efg, 4)} + ${v.fix(s.egP, 4)}$ (dashed box).`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.25
    {
      num: '4.25',
      kind: 'Theorem',
      name: 'Trigonometric polynomials are uniformly dense in C(T)',
      credit: 'Weierstrass, 1885',
      statement: String.raw`If $f\in C(T)$ and $\eps>0$, there is a trigonometric polynomial $P$ with $|f(t)-P(t)|<\eps$ for every real $t$.`,
      idea: String.raw`Use trigonometric polynomials $Q_k\ge0$ with $\frac1{2\pi}\int Q_k=1$ whose mass concentrates at $0$: $\eta_k(\delta)=\sup_{\delta\le|t|\le\pi}Q_k(t)\to0$ for each $\delta>0$. Rudin takes $Q_k(t)=c_k\big(\frac{1+\cos t}2\big)^k$. Then $P_k=f*Q_k$ is a trigonometric polynomial and $|P_k(t)-f(t)|\le\frac1{2\pi}\int|f(t-s)-f(t)|Q_k(s)\,ds$; split at $|s|=\delta$ and use uniform continuity of $f$ near $0$ and $\eta_k(\delta)\to0$ away from it.`,
      caption: String.raw`Drag the handles to shape a continuous periodic $f$ (black) and raise $k$. Top: the trigonometric polynomial $P_k=f*Q_k$ (green), with the largest error $\|f-P_k\|_\infty$ marked in red. Bottom: the kernel $Q_k$; outside the window $|t|<\delta$ its height $\eta_k(\delta)$ goes to $0$ while its average stays $1$. The convergence is slow but uniform — exactly what the theorem promises.`,
      deps: ['rca-4.23'],
      see: ['pma-8.15', 'pma-7.26'],
      tags: ['Fourier', 'approximation', 'kernel'],
      viz(v) {
        const M = v.M;
        const NG = 1536, ts = M.range(NG).map((i) => -Math.PI + M.TAU * (i + 0.5) / NG);
        const KMAX = 300;
        const kS = v.slider('$k$', 1, KMAX, 16, { int: true });
        const dS = v.slider('$\\delta$', 0.1, 1.5, 0.6, { step: 0.01 });
        const T = v.stage({ x: [-Math.PI, Math.PI], y: [-1.5, 1.5], height: 290, full: true, axes: 'box', yticks: [-1, 0, 1], xticks: [[-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2']], title: '$f\\in C(T)$ and $P_k=f*Q_k$' });
        const K = v.stage({ x: [-Math.PI, Math.PI], y: [0, 10], height: 200, full: true, axes: 'box', xticks: [[-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2']], title: 'the kernel $Q_k(t)=c_k\\left(\\frac{1+\\cos t}{2}\\right)^k$' });
        const XS = M.range(7).map((i) => -Math.PI + M.TAU * i / 7);
        const Y0 = [0.2, 0.9, -0.3, -0.9, 0.6, 1.1, -0.5];
        const H = XS.map((x, i) => T.handle(x, Y0[i], { color: 'accent', r: 6.5, constrain: (px, py) => [x, M.clamp(py, -1.4, 1.4)] }));
        const f = (t) => {
          const u = ((t + Math.PI) % M.TAU + M.TAU) % M.TAU, seg = M.TAU / 7, i = Math.min(6, Math.floor(u / seg)), s = (u - i * seg) / seg;
          return H[i].y * (1 - s) + H[(i + 1) % 7].y * s;
        };
        let key = '', co = null, fs = null;
        let st = {};
        v.render(() => {
          const k = kS.value, dl = dS.value;
          const kk = H.map((h) => h.y.toFixed(4)).join(',');
          if (kk !== key) { key = kk; fs = ts.map(f); co = trigCoeffsGrid(ts, fs, KMAX); }
          const q = kernelCoeffs(k);
          const Ps = trigEvalAll(ts, co, k, q);
          let imax = 0, emax = 0; fs.forEach((x, i) => { const e = Math.abs(x - Ps[i]); if (e > emax) { emax = e; imax = i; } });
          T.fn(f, { color: 'ink', width: 2.4 });
          T.path(ts.map((t, i) => [t, Ps[i]]), { color: 'green', width: 2.4 });
          T.line(ts[imax], fs[imax], ts[imax], Ps[imax], { color: 'red', width: 3 });
          T.dot(ts[imax], Ps[imax], { color: 'red', r: 3.5 });
          // kernel
          const ck = kernelConst(k), Q = (t) => ck * ((1 + Math.cos(t)) / 2) ** k;
          const eta = Q(dl);
          K.setView(null, [0, Math.max(2, ck * 1.12)]);
          K.vband(-dl, dl, { color: 'orange', alpha: 0.1, edges: true });
          K.fn(Q, { color: 'purple', width: 2.4, fill: 'purple', fillAlpha: 0.15, n: 900 });
          K.line(-Math.PI, eta, -dl, eta, { color: 'red', width: 1.6, dash: [5, 4] });
          K.line(dl, eta, Math.PI, eta, { color: 'red', width: 1.6, dash: [5, 4] });
          K.tex(`\\eta_k(\\delta)=${v.fix(eta, 3)}`, Math.PI, eta, { color: 'red', align: 'right', baseline: 'bottom', dy: -4, size: 13 });
          K.tex(`c_k=Q_k(0)=${v.fix(ck, 2)}`, 0, ck, { color: 'purple', align: 'right', dx: -24, baseline: 'top', dy: 2, size: 13 });
          v.legend([['ink', '$f$ (drag the handles)'], ['green', `$P_k$, a trigonometric polynomial of degree $${k}$`], ['red', '$\\|f-P_k\\|_\\infty$'], ['purple', '$Q_k$', { area: true }]]);
          st = { k, emax, eta, ck, avg: M.integrate(Q, -Math.PI, Math.PI, 2000) / M.TAU };
        });
        v.readout(() => {
          const s = st; if (s.k == null) return '';
          return `$\\sup_t|f(t)-P_k(t)| = ${v.fix(s.emax, 4)}$ for $k=${s.k}$; $\\;\\eta_k(\\delta) = ${v.fix(s.eta, 4)}$, $\\;\\frac1{2\\pi}\\int_{-\\pi}^{\\pi} Q_k = ${v.fix(s.avg, 6)}$, $\\;Q_k\\ge0$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.26
    {
      num: '4.26',
      kind: 'Theorem',
      name: 'Riesz–Fischer and Parseval theorems for Fourier series',
      statement: String.raw`For $f\in L^1(T)$ let $\hat f(n)=\frac1{2\pi}\int_{-\pi}^{\pi}f(t)e^{-int}\,dt$ and $s_N(t)=\sum_{n=-N}^{N}\hat f(n)e^{int}$. Since the trigonometric system is complete (4.24):
(a) **Riesz–Fischer.** If $\sum_{n\in\Z}|c_n|^2<\infty$, there is $f\in L^2(T)$ with $\hat f(n)=c_n$ for all $n$.
(b) **Parseval.** For $f,g\in L^2(T)$, $\sum_{n\in\Z}\hat f(n)\overline{\hat g(n)}=\frac1{2\pi}\int_{-\pi}^{\pi}f\bar g$, the series converging absolutely; in particular $\sum|\hat f(n)|^2=\|f\|_2^2$.
(c) For $f\in L^2(T)$, $\|f-s_N\|_2\to0$, since $\|f-s_N\|_2^2=\sum_{|n|>N}|\hat f(n)|^2$.
Thus $f\mapsto\hat f$ is a Hilbert space isomorphism of $L^2(T)$ onto $\ell^2(\Z)$.`,
      idea: String.raw`These are Theorems 4.17 and 4.18 for the maximal orthonormal set $\{e^{int}\}$: surjectivity onto $\ell^2(\Z)$ is (a), condition (iv) of 4.18 is (b), and applying (b) to $f-s_N$, whose coefficients are those of $f$ with $|n|>N$, gives (c). Note that (c) is convergence in $L^2$ only: pointwise or uniform convergence of Fourier series is a far more delicate matter.`,
      caption: String.raw`Partial sums $s_N$ (gold) of three classical Fourier series. Bottom left: the energies $|\hat f(n)|^2+|\hat f(-n)|^2$; the red tail beyond $N$ is exactly $\|f-s_N\|_2^2$ (Parseval). Bottom right, on a log scale: the $L^2$ error always goes to $0$, but for the square wave and the sawtooth the uniform error does not — the Gibbs overshoot near each jump stays at about $9\%$ of the jump however large $N$ is. For the continuous triangle wave both errors vanish.`,
      deps: ['rca-4.17', 'rca-4.18', 'rca-4.24', 'rca-4.25'],
      see: ['pma-8.16', 'rca-9.13'],
      verify: true,
      tags: ['Fourier series', 'Parseval', 'Riesz–Fischer'],
      viz(v) {
        const M = v.M;
        const NMAX = 80, NT = 4000, PI = Math.PI;
        const ts = M.range(NT).map((i) => -PI + M.TAU * (i + 0.5) / NT);
        const FX = {
          sq: { label: 'square wave', f: (t) => Math.sign(t), a: () => 0, b: (n) => (n % 2 ? 4 / (PI * n) : 0), a0: 0, norm2: 1, jump: 2 },
          saw: { label: 'sawtooth', f: (t) => t / PI, a: () => 0, b: (n) => 2 * (n % 2 ? 1 : -1) / (PI * n), a0: 0, norm2: 1 / 3, jump: 2 },
          tri: { label: 'triangle', f: (t) => Math.abs(t), a: (n) => (n % 2 ? -4 / (PI * n * n) : 0), b: () => 0, a0: PI, norm2: PI * PI / 3, jump: 0 },
        };
        const cache = {};
        const errs = (key) => {
          if (cache[key]) return cache[key];
          const F = FX[key], fs = ts.map(F.f), s = ts.map(() => F.a0 / 2);
          const sup = [], l2 = [], l2d = [], over = [];
          let tail = F.norm2 - F.a0 * F.a0 / 4;
          for (let N = 1; N <= NMAX; N++) {
            const an = F.a(N), bn = F.b(N);
            for (let i = 0; i < NT; i++) s[i] += an * Math.cos(N * ts[i]) + bn * Math.sin(N * ts[i]);
            tail -= (an * an + bn * bn) / 2;
            let m = 0, mx = -Infinity, e2 = 0;
            for (let i = 0; i < NT; i++) { const d = fs[i] - s[i]; m = Math.max(m, Math.abs(d)); mx = Math.max(mx, s[i]); e2 += d * d; }
            // l2: predicted by Parseval from the coefficient tail; l2d: measured directly on the grid
            sup.push(m); l2.push(Math.sqrt(Math.max(tail, 0))); l2d.push(Math.sqrt(e2 / NT)); over.push(mx - (key === 'tri' ? PI : 1));
          }
          return (cache[key] = { fs, sup, l2, l2d, over });
        };
        const which = v.select('$f$', Object.entries(FX).map(([value, F]) => ({ value, label: F.label })), 'sq');
        const NN = v.slider('$N$', 1, NMAX, 9, { int: true });
        const T = v.stage({ x: [-PI, PI], y: [-1.4, 1.4], height: 270, full: true, axes: 'box', yticks: [-1, 0, 1], xticks: [[-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2']], title: '$f$ and its Fourier partial sum $s_N$' });
        const E = v.stage({ x: [-4, 41], y: [-6, 0.3], height: 210, minWidth: 300, axes: 'box', yticks: [[-6, '10⁻⁶'], [-4, '10⁻⁴'], [-2, '10⁻²'], [0, '1']], xticks: [1, 10, 20, 30, 40], title: 'energy $|\\hat f(n)|^2+|\\hat f(-n)|^2$ by frequency (log scale)' });
        const G = v.stage({ x: [-8, NMAX + 1], y: [-3.2, 0.4], height: 210, minWidth: 300, axes: 'box', xticks: [1, 20, 40, 60, 80], yticks: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']], title: 'errors versus $N$ (log scale)' });
        let st = {};
        v.render(() => {
          const F = FX[which.value], N = NN.value, X = errs(which.value);
          const sN = (t) => { let s = F.a0 / 2; for (let n = 1; n <= N; n++) s += F.a(n) * Math.cos(n * t) + F.b(n) * Math.sin(n * t); return s; };
          const ylo = which.value === 'tri' ? -0.4 : -1.45, yhi = which.value === 'tri' ? 3.6 : 1.45;
          T.setView(null, [ylo, yhi]);
          T.between(F.f, sN, -PI, PI, { fill: 'red', fillAlpha: 0.12, n: 1200 });
          T.fn(F.f, { color: 'ink', width: 2.4, n: 1200 });
          T.fn(sN, { color: 'gold', width: 2.2, n: 1200 });
          if (F.jump) { T.hline(1 + 0.0895 * F.jump, { color: 'red', width: 1, dash: [3, 4] }); T.tex('\\text{Gibbs: }1+0.09\\cdot\\text{jump}', PI, 1 + 0.0895 * F.jump, { color: 'red', align: 'right', baseline: 'bottom', dy: -2, size: 12 }); }
          // energy spectrum
          const en = M.range(40, 1).map((n) => (F.a(n) ** 2 + F.b(n) ** 2) / 2);
          en.forEach((e, i) => { if (e > 1e-12) E.rect(i + 1 - 0.35, -6, i + 1 + 0.35, Math.log10(e), { fill: i + 1 <= N ? 'gold' : 'red', fillAlpha: i + 1 <= N ? 0.8 : 0.55, stroke: false }); });
          E.vline(N + 0.5, { color: 'muted', width: 1, dash: [3, 3] });
          if (N < 36) E.tex('\\text{red tail: }\\sum_{|n|>N}|\\hat f(n)|^2=\\|f-s_N\\|_2^2', 40.5, -0.3, { color: 'red', align: 'right', baseline: 'top', size: 12.5 });
          // error curves
          const lg = (x) => Math.log10(Math.max(x, 1e-4));
          G.path(X.l2.map((e, i) => [i + 1, lg(e)]), { color: 'accent', width: 2.4 });
          G.path(X.sup.map((e, i) => [i + 1, lg(e)]), { color: 'red', width: 2.4 });
          G.vline(N, { color: 'gold', width: 1.2, dash: [3, 3] });
          G.dot(N, lg(X.l2[N - 1]), { color: 'accent', r: 4.5 });
          G.dot(N, lg(X.sup[N - 1]), { color: 'red', r: 4.5 });
          v.legend([['ink', '$f$'], ['gold', '$s_N$'], ['accent', '$\\|f-s_N\\|_2$'], ['red', '$\\sup|f-s_N|$ / tail energy']]);
          st = { N, l2: X.l2[N - 1], l2d: X.l2d[N - 1], sup: X.sup[N - 1], norm2: F.norm2, cap: F.norm2 - X.l2[N - 1] ** 2, over: X.over[N - 1], jump: F.jump };
        });
        v.readout(() => {
          const s = st; if (s.N == null) return '';
          return `$\\sum_{|n|\\le ${s.N}}|\\hat f(n)|^2 = ${v.fix(s.cap, 4)}$, $\\;\\|f\\|_2^2 = ${v.fix(s.norm2, 4)}$; Parseval predicts $\\|f-s_N\\|_2 = ${v.fix(s.l2, 4)}$, measured directly $${v.fix(s.l2d, 4)}$; $\\;\\sup|f-s_N| = ${v.fix(s.sup, 4)}$` + (s.jump ? `, overshoot $\\max s_N - \\sup f = ${v.fix(s.over, 4)}$ (Gibbs: $\\approx 0.179$).` : ' — continuous $f$, uniform convergence too.');
        });
      },
    },
  ],
};
