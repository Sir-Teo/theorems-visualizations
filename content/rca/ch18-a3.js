// Rudin, Real and Complex Analysis — Chapter 18 (part 3): ideals, homomorphisms and Wiener's lemma

// ---------------------------------------------------------------- helpers shared by this file
// In-place iterative radix-2 FFT of (re, im) (length a power of 2): X_k = Σ_n x_n e^{∓2πikn/N}
// (sign −1 for the forward transform). No normalisation.
function fft(re, im, sign = -1) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = sign * 2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
// The eight characters of Z₈: h_k(x) = Σ_n x_n ω^{kn}, ω = e^{2πi/8}.
function dft8(x) {
  return x.map((_, k) => {
    let re = 0, im = 0;
    x.forEach((xn, n) => { re += xn * Math.cos(2 * Math.PI * k * n / 8); im += xn * Math.sin(2 * Math.PI * k * n / 8); });
    return [re, im];
  });
}

export default {
  collection: 'rca',
  chapter: 18,
  items: [
    // ------------------------------------------------------------------ ideals and homomorphisms
    {
      num: '18.10',
      kind: 'Definition',
      name: 'Ideals and maximal ideals',
      statement: String.raw`Let $A$ be a commutative complex algebra with unit $e$. A subset $J\subset A$ is an **ideal** if $J$ is a linear subspace of $A$ and $xy\in J$ whenever $x\in A$ and $y\in J$. An ideal $J\neq A$ is **proper**, and a **maximal ideal** is a proper ideal that is not contained in any strictly larger proper ideal.

A proper ideal contains no invertible element — if $x\in J$ were invertible, every $y=(yx^{-1})x$ would lie in $J$ — and in particular $e\notin J$. The kernel of a nonzero complex homomorphism (9.19) is always an ideal.`,
      idea: String.raw`Ideals are the kernels of algebra homomorphisms, and maximal ideals will turn out (18.17) to be exactly the kernels of complex homomorphisms. The basic example: in $C(X)$ the functions that vanish on a fixed nonempty closed set $K$ form a proper ideal $J_K$; it is maximal precisely when $K$ is a single point, and every proper closed ideal of $C(X)$ has this form.`,
      caption: String.raw`In $C[0,1]$ drag the ends of the set $K$ (orange). $f$ (blue) vanishes on $K$, so $f\in J_K$; multiply it by *any* $g$ (purple): the product $gf$ (green) still vanishes on $K$, which is the absorbing property of an ideal. The constant $e=1$ does not vanish on $K$, so $J_K$ is proper; collapse $K$ to a point to get a maximal ideal.`,
      deps: ['rca-18.1', 'rca-9.19'],
      tags: ['ideals', 'definitions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-0.03, 1.03], y: [-1.15, 1.6], height: 330, axes: true, xlabel: 't', full: true, xticks: [0.2, 0.4, 0.6, 0.8, 1] });
        const a = S.handle(0.38, 0, { color: 'orange', constrain: (x) => [M.clamp(x, 0, 1), 0] });
        const b = S.handle(0.6, 0, { color: 'orange', constrain: (x) => [M.clamp(x, 0, 1), 0] });
        const sg = v.slider('shape of $g$', 0, 6.28, 1.2, { step: 0.01 });
        v.button('make $K$ a point', () => { const m = (a.x + b.x) / 2; a.set(m, 0); b.set(m, 0); });
        let st = {};
        v.render(() => {
          const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x);
          const dK = (t) => (t < lo ? lo - t : t > hi ? t - hi : 0);
          const f = (t) => 2.2 * dK(t) * (1 + 0.35 * Math.sin(9 * t));
          const g = (t) => 0.75 * Math.cos(5 * t + sg.value) + 0.25;
          const gf = (t) => g(t) * f(t);
          S.vband(lo, hi + 1e-9, { color: 'orange', alpha: 0.16 });
          S.line(lo, 0, hi, 0, { color: 'orange', width: 6 });
          S.hline(1, { color: 'muted', width: 1.2, dash: [4, 4] });
          S.tex('e=1\\notin J_K', 0.2, 1, { baseline: 'bottom', dy: -4, color: 'muted', size: 14 });
          S.fn(g, { color: 'purple', width: 1.8, dash: [6, 4] });
          S.fn(f, { color: 'blue', width: 2.6 });
          S.fn(gf, { color: 'green', width: 2.6 });
          S.tex(lo === hi ? 'K=\\{p\\}' : 'K', (lo + hi) / 2, 0, { color: 'orange', baseline: 'top', dy: 10, size: 15 });
          S.tex('f', 0.04, f(0.04), { color: 'blue', align: 'left', dx: 6, dy: -12 });
          S.tex('g', (lo + hi) / 2, g((lo + hi) / 2), { color: 'purple', dy: g((lo + hi) / 2) < 0 ? 14 : -14 });
          S.tex('gf', 0.86, gf(0.86), { color: 'green', align: 'left', dx: 8, dy: 10 });
          let mx = 0; for (let k = 0; k <= 50; k++) { const t = lo + (hi - lo) * k / 50; mx = Math.max(mx, Math.abs(gf(t))); }
          S.corner(lo === hi ? `K = {${v.fmt(lo, 2)}}: J_K = {f : f(${v.fmt(lo, 2)}) = 0} is a maximal ideal` : 'J_K = {f : f = 0 on K} is a proper ideal', 'br', { color: lo === hi ? 'green' : 'ink', weight: 600 });
          v.legend([['blue', '$f\\in J_K$'], ['purple', 'any $g\\in C[0,1]$', { dash: true }], ['green', '$gf\\in J_K$'], ['orange', '$K$', { area: true }]]);
          st = { mx, lo, hi };
        });
        v.readout(() => `$\\sup_K\\abs{gf} = ${v.fix(st.mx || 0, 4)}$, so $gf\\in J_K$ whatever $g$ is. ` + (st.lo === st.hi ? 'A single point: no proper ideal is larger.' : `Shrinking $K$ enlarges $J_K$; the largest proper ones are $J_{\\{p\\}}$, $p\\in K$.`));
      },
    },
    {
      num: '18.11',
      kind: 'Theorem',
      name: 'Every proper ideal lies in a maximal ideal',
      statement: String.raw`If $A$ is a commutative complex algebra with unit, then every proper ideal of $A$ is contained in a maximal ideal of $A$.`,
      idea: String.raw`Order the proper ideals containing a given $J$ by inclusion. By the Hausdorff maximality theorem (4.21) there is a maximal totally ordered subfamily $\Omega$. The union $M$ of the members of $\Omega$ is an ideal — two elements of $M$ lie in a common member because $\Omega$ is a chain — and it is proper because $e$ belongs to no member. Any proper ideal strictly larger than $M$ could be added to $\Omega$, contradicting maximality; so $M$ is a maximal ideal containing $J$.`,
      caption: String.raw`The lattice of all ideals of two small commutative algebras, larger ideals higher up. In $C(X)$ with $X=\{1,2,3,4\}$ every ideal is $J_K=\{f:f|_K=0\}$; each node shows $K$ as filled dots. Click an ideal $J$: the gold path is a maximal chain of proper ideals through it, ending at a maximal ideal (green), and every maximal ideal above $J$ is ringed. The top node $A$ (red) is not proper — no chain may reach it, because $e$ lies in none of its links. In $\C[t]/(t^3)$ the ideals form a single chain with one maximal ideal $(t)$.`,
      deps: ['rca-18.10', 'rca-4.21'],
      tags: ['ideals', 'Zorn', 'maximal ideals'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('algebra', [{ value: 'cx', label: '$C(X)$, $X=\\{1,2,3,4\\}$' }, { value: 'loc', label: '$\\C[t]/(t^3)$' }], 'cx');
        const S = v.stage({ x: [0, 10], y: [-0.7, 4.7], height: 400, axes: false, full: true });
        // nodes of the Boolean lattice: K ⊂ {0,1,2,3} as bitmasks; row = |K| (row 0 = top = A)
        const nodes = [];
        for (let r = 0; r <= 4; r++) {
          const masks = M.range(16).filter((m) => [0, 1, 2, 3].filter((i) => m >> i & 1).length === r);
          masks.forEach((m, i) => nodes.push({ m, r, x: 5 + (i - (masks.length - 1) / 2) * (r === 2 ? 1.55 : 2.05), y: 4 - r }));
        }
        const loc = [{ lab: 'A = (1)', y: 4 }, { lab: '(t)', y: 3 }, { lab: '(t²)', y: 2 }, { lab: '{0}', y: 1 }];
        let sel = 0b1011, selLoc = 2;
        S.onClick((x, y) => {
          if (mode.value === 'cx') { let best = null, bd = 0.6; for (const n of nodes) { const d = Math.hypot((n.x - x) / 1.2, n.y - y); if (d < bd) { bd = d; best = n; } } if (best) sel = best.m; }
          else { const i = M.argmin(loc, (o) => Math.abs(o.y - y)); if (Math.abs(loc[i].y - y) < 0.5) selLoc = i; }
        });
        let st = {};
        v.render(() => {
          if (mode.value === 'cx') {
            const byMask = new Map(nodes.map((n) => [n.m, n]));
            const sub = (a, b) => (a & b) === a; // a ⊂ b
            // chain from K = sel up to a maximal ideal: drop points one at a time, keep the largest index
            const chain = [sel]; let cur = sel;
            if (sel) while ([0, 1, 2, 3].filter((i) => cur >> i & 1).length > 1) { const i = [0, 1, 2, 3].find((j) => cur >> j & 1); cur &= ~(1 << i); chain.push(cur); }
            // Hasse edges: K → K minus one point
            for (const n of nodes) for (let i = 0; i < 4; i++) if (n.m >> i & 1) { const p = byMask.get(n.m & ~(1 << i)); S.line(n.x, n.y, p.x, p.y, { color: 'grid', width: 1.2 }); }
            for (let k = 0; k + 1 < chain.length; k++) { const p = byMask.get(chain[k]), q = byMask.get(chain[k + 1]); S.line(p.x, p.y, q.x, q.y, { color: 'gold', width: 4 }); }
            for (const n of nodes) {
              const above = sel !== 0 && sub(n.m, sel) && n.m !== 0; // J_K ⊂ J_n  ⇔  n ⊂ K
              const isMax = n.r === 1, isTop = n.m === 0, isSel = n.m === sel;
              const W = 0.62, H = 0.24;
              S.rect(n.x - W, n.y - H, n.x + W, n.y + H, { fill: isTop ? 'red' : isSel ? 'blue' : above ? 'gold' : 'panel', fillAlpha: isTop ? 0.12 : isSel ? 0.22 : above ? 0.12 : 1, color: isSel ? 'blue' : isMax && above ? 'green' : isTop ? 'red' : 'faint', width: isSel || (isMax && above) ? 2.4 : 1.2 });
              for (let i = 0; i < 4; i++) S.dot(n.x - 0.39 + 0.26 * i, n.y, { r: 4.2, color: n.m >> i & 1 ? 'ink' : 'muted', hollow: !(n.m >> i & 1), width: 1.2 });
            }
            S.tex('A=J_\\varnothing\\ \\text{(not proper)}', 5.75, 4, { color: 'red', size: 14, align: 'left' });
            S.tex('\\text{maximal ideals } J_{\\{p\\}}', 0.1, 3.42, { color: 'green', size: 14, align: 'left', baseline: 'bottom' });
            S.tex('\\{0\\}=J_X', 5.75, 0, { color: 'muted', size: 14, align: 'left' });
            const pts = (m) => [0, 1, 2, 3].filter((i) => m >> i & 1).map((i) => i + 1);
            st = { cx: true, K: pts(sel), maxs: pts(sel), chainLen: chain.length, end: pts(chain[chain.length - 1]) };
            v.legend([['blue', 'chosen ideal $J$ (click a node)', { area: true }], ['gold', 'a maximal chain of proper ideals through $J$'], ['green', 'maximal ideals containing $J$'], ['red', '$A$ itself', { area: true }]]);
          } else {
            const x0 = 2.6;
            for (let i = 0; i + 1 < loc.length; i++) S.line(x0, loc[i].y, x0, loc[i + 1].y, { color: i >= 1 && i < selLoc ? 'gold' : 'grid', width: i >= 1 && i < selLoc ? 4 : 1.2 });
            loc.forEach((o, i) => {
              const isSel = i === selLoc, isTop = i === 0, isMax = i === 1;
              S.rect(x0 - 0.9, o.y - 0.26, x0 + 0.9, o.y + 0.26, { fill: isTop ? 'red' : isSel ? 'blue' : 'panel', fillAlpha: isTop ? 0.12 : isSel ? 0.22 : 1, color: isSel ? 'blue' : isMax ? 'green' : isTop ? 'red' : 'faint', width: isSel || isMax ? 2.4 : 1.2 });
              S.text(o.lab, x0, o.y, { align: 'center', size: 14, math: true });
            });
            S.text('the unique maximal ideal = all non-invertible elements a₁t + a₂t²', x0 + 1.1, 3, { color: 'green', size: 12 });
            S.text('not proper: a₀ + a₁t + a₂t² is invertible as soon as a₀ ≠ 0', x0 + 1.1, 4, { color: 'red', size: 12 });
            S.text('t²·(anything) — still inside (t)', x0 + 1.1, 2, { color: 'muted', size: 12 });
            st = { cx: false, sel: selLoc };
            v.legend([['blue', 'chosen ideal (click)', { area: true }], ['gold', 'chain up to the maximal ideal'], ['green', 'the maximal ideal $(t)$'], ['red', '$A$ itself', { area: true }]]);
          }
        });
        v.readout(() => {
          const s = st; if (s.cx == null) return '';
          if (!s.cx) return s.sel === 0 ? '$A$ is not a proper ideal; pick another node.' : `$${loc[s.sel].lab.replace('²', '^2').replace('{0}', '\\{0\\}')}\\subset (t)$: every proper ideal of this local algebra lies in the one maximal ideal $(t)$.`;
          if (!s.K.length) return '$J_\\varnothing=A$ is not proper — the theorem says nothing about it.';
          return `$J = J_{\\{${s.K.join(',')}\\}}$ lies in the maximal ideals ${s.maxs.map((p) => `$J_{\\{${p}\\}}$`).join(', ')}; the gold chain has ${s.chainLen} links and ends at $J_{\\{${s.end.join(',')}\\}}$.`;
        });
      },
    },
    {
      num: '18.12',
      kind: 'Theorem',
      name: 'Closures of proper ideals are proper; maximal ideals are closed',
      statement: String.raw`Let $A$ be a commutative Banach algebra.
(a) If $J$ is a proper ideal of $A$, then its closure $\overline J$ is also a proper ideal.
(b) Every maximal ideal of $A$ is closed.`,
      idea: String.raw`By 18.3, every $x$ with $\norm{e-x}<1$ is invertible, and a proper ideal contains no invertible element; hence $\norm{e-x}\ge1$ for all $x\in J$, an inequality that survives passage to the closure, so $e\notin\overline J$. Continuity of the algebra operations makes $\overline J$ an ideal. If $M$ is maximal, then $M\subset\overline M$ with $\overline M$ proper forces $\overline M=M$.`,
      caption: String.raw`In $C[0,1]$ let $J$ be the functions that vanish on some neighbourhood of $0$ — a proper ideal that is *not* closed. Shrink $\delta$: $f_\delta=g\varphi_\delta\in J$ (blue, zero on $[0,\delta]$) converges uniformly to $g$ (orange), which vanishes at $0$ only, so $\overline J=\{f:f(0)=0\}$. Yet every member of $J$ stays at distance $\ge1$ from $e$ (green): the green band is the ball $\norm{e-y}<1$ of invertible elements, and $f_\delta(0)=0$ sits on its edge.`,
      deps: ['rca-18.10', 'rca-18.3'],
      tags: ['ideals', 'closure'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sd = v.slider('$\\delta$', 0.004, 0.3, 0.12, { log: true, decimals: 3 });
        const L = v.stage({ x: [-0.13, 1.02], y: [-0.25, 2.2], height: 340, axes: 'box', weight: 1.5, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: 'functions on $[0,1]$' });
        const R = v.stage({ x: [-2.5, -0.45], y: [0, 1.25], height: 340, axes: 'box', xticks: [[-2.398, '0.004'], [-2, '0.01'], [-1.523, '0.03'], [-1, '0.1'], [-0.523, '0.3']], title: 'distances as $\\delta\\to0$' });
        const g = (t) => 1.25 * t * (1.7 - t) + 0.22 * t * Math.sin(9 * t);
        const phi = (d) => (t) => M.clamp((t - d) / d, 0, 1);
        const dist = (d) => { let m = 0; for (let k = 0; k <= 400; k++) { const t = 2 * d * k / 400; m = Math.max(m, Math.abs(g(t) * (1 - phi(d)(t)))); } return m; };
        let st = {};
        v.render(() => {
          const d = sd.value, f = (t) => g(t) * phi(d)(t);
          L.hband(0, 2, { color: 'green', alpha: 0.08 });
          L.hline(0, { color: 'green', width: 1, dash: [3, 4] }); L.hline(2, { color: 'green', width: 1, dash: [3, 4] });
          L.hline(1, { color: 'green', width: 2.2 });
          L.text('e', 1, 1, { dx: -8, dy: -10, color: 'green', math: true, align: 'right' });
          L.text('ball ‖e − y‖ < 1: invertible', 1, 2, { dx: -6, dy: 11, color: 'green', align: 'right', size: 11.5 });
          L.vband(0, d, { color: 'orange', alpha: 0.18 });
          L.fn(g, { color: 'orange', width: 2, dash: [6, 4] });
          L.fn(f, { color: 'blue', width: 2.6 });
          L.measure(0.0, 0, 0.0, 1, '≥ 1', { color: 'red', offset: -16, math: false, size: 12 });
          L.dot(0, 0, { color: 'blue', r: 4.5 });
          const ds = dist(d);
          // right panel: ‖g − f_δ‖ → 0, while ‖e − f_δ‖ ≥ 1
          const xs = M.linspace(-2.45, -0.5, 80);
          R.hline(1, { color: 'red', width: 2.2 });
          R.text('‖e − f_δ‖ ≥ 1 for all δ', -0.5, 1, { dy: -11, dx: -4, align: 'right', color: 'red', size: 11.5 });
          R.path(xs.map((u) => [u, dist(Math.pow(10, u))]), { color: 'blue', width: 2.2 });
          R.text('‖g − f_δ‖ → 0', -1.75, dist(Math.pow(10, -1.75)), { dy: -16, color: 'blue', size: 11.5, align: 'center' });
          R.vline(Math.log10(d), { color: 'gold', width: 1.2, dash: [3, 3] });
          R.dot(Math.log10(d), ds, { color: 'blue', r: 5 });
          v.legend([['green', '$e$ and the ball $\\norm{e-y}<1$', { area: true }], ['blue', '$f_\\delta\\in J$'], ['orange', '$g\\in\\overline J\\setminus J$', { dash: true }], ['orange', '$[0,\\delta]$', { area: true }]]);
          st = { ds, d, ef: Math.max(...M.linspace(0, 1, 201).map((t) => Math.abs(1 - f(t)))) };
        });
        v.readout(() => `$\\delta = ${v.fix(st.d || 0, 3)}$: $\\norm{g-f_\\delta}_\\infty = ${v.fix(st.ds || 0, 4)}$, while $\\norm{e-f_\\delta}_\\infty = ${v.fix(st.ef || 0, 3)}\\ge1$. So $g\\in\\overline J$, but $e\\notin\\overline J$: the closure $\\{f: f(0)=0\\}$ is still proper (indeed maximal).`);
      },
    },
    {
      num: '18.17',
      kind: 'Theorem',
      name: 'Gelfand: maximal ideals are kernels of homomorphisms',
      credit: 'Gelfand, 1941',
      statement: String.raw`Let $A$ be a commutative Banach algebra and $\Delta$ the set of all nonzero complex homomorphisms of $A$.
(a) Every maximal ideal of $A$ is the kernel of some $h\in\Delta$.
(b) If $h\in\Delta$, the kernel of $h$ is a maximal ideal of $A$.
(c) $x\in A$ is invertible in $A$ if and only if $h(x)\neq0$ for every $h\in\Delta$.
(d) $x\in A$ is invertible in $A$ if and only if $x$ lies in no proper ideal of $A$.
(e) $\lambda\in\sigma(x)$ if and only if $h(x)=\lambda$ for some $h\in\Delta$.

Writing $\hat x(h)=h(x)$, (e) says that $\sigma(x)$ is the range of the function $\hat x$ on $\Delta$; hence $\rho(x)=\sup_{h\in\Delta}\abs{h(x)}$.`,
      idea: String.raw`(b): $h(e)=1$, so $A=\ker h\oplus\C e$ and a codimension-one ideal is maximal. (a): a maximal ideal $M$ is closed (18.12), so $A/M$ is a commutative Banach algebra; if $x\notin M$, the ideal $\{ax+y:a\in A,\,y\in M\}$ is strictly larger than $M$, hence all of $A$, so $x+M$ is invertible. Thus $A/M$ is a division algebra, equal to $\C$ by Gelfand–Mazur (18.7), and the quotient map is the required $h$. (d): if $x$ is not invertible, $xA$ is a proper ideal containing it. (c) follows from (a), (b), (d) and 18.11; (e) is (c) applied to $\lambda e-x$.`,
      caption: String.raw`A concrete commutative Banach algebra: $\ell^1(\Z_8)$, sequences $x_0,\dots,x_7$ under cyclic convolution. Its complex homomorphisms are the eight characters $h_k(x)=\sum_n x_n\omega^{kn}$, $\omega=e^{2\pi i/8}$. Drag the bars of $x$. Right: the points $h_k(x)$ — by (e) they *are* $\sigma(x)$. As long as none is $0$, $x$ has a convolution inverse (bottom). Press the button to push $x$ into the maximal ideal $\ker h_k$: that point moves to $0$, and the inverse ceases to exist.`,
      deps: ['rca-18.7', 'rca-18.11', 'rca-18.12', 'rca-9.19', 'rca-9.20'],
      see: ['fa-11.5', 'rca-9.21'],
      tags: ['Gelfand theory', 'maximal ideals', 'complex homomorphisms'],
      verify: true,
      viz(v) {
        const M = v.M;
        const T = v.stage({ x: [-0.6, 7.6], y: [-1.3, 1.8], height: 300, axes: 'box', xticks: M.range(8), title: '$x\\in\\ell^1(\\Z_8)$ — drag the bars' });
        const P = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 300, title: '$\\sigma(x)=\\{h_0(x),\\dots,h_7(x)\\}$' });
        const B = v.stage({ x: [-0.6, 7.6], y: [-2, 2], height: 170, axes: 'box', full: true, xticks: M.range(8), title: 'the convolution inverse $x^{-1}$ (when it exists)' });
        const x0 = [0.25, 1, 0, 0.3, 0, 0, -0.15, 0];
        const hs = x0.map((y, n) => T.handle(n, y, { color: 'blue', r: 6, constrain: (_, yy) => [n, M.clamp(yy, -1.2, 1.7)] }));
        const sk = v.slider('character $k$', 0, 7, 3, { int: true });
        v.button('put $x$ into $\\ker h_k$', () => {
          const x = hs.map((h) => h.y), X = dft8(x), k = sk.value, kk = (8 - k) % 8;
          const kill = (j) => x.map((_, n) => (X[j][0] * Math.cos(2 * Math.PI * j * n / 8) + X[j][1] * Math.sin(2 * Math.PI * j * n / 8)) / 8);
          let y = x.map((xn, n) => xn - kill(k)[n]);
          if (kk !== k) { const k2 = kill(kk); y = y.map((yn, n) => yn - k2[n]); }
          y.forEach((yn, n) => { hs[n].y = M.clamp(yn, -1.2, 1.7); });
        });
        v.button('reset', () => x0.forEach((y, n) => hs[n].set(n, y)));
        let st = {};
        v.render(() => {
          const x = hs.map((h) => h.y), X = dft8(x), k = sk.value;
          const nrm = M.sum(x.map(Math.abs)), mods = X.map((z) => Math.hypot(z[0], z[1])), rho = Math.max(...mods), mn = Math.min(...mods);
          T.hline(0, { color: 'faint', width: 1 });
          T.bars(x, { x0: 0, color: 'blue', barWidth: 0.42, fillAlpha: 0.55 });
          T.corner(`‖x‖₁ = ${v.fmt(nrm, 3)}`, 'tr');
          // right: the spectrum
          P.circle(0, 0, nrm, { color: 'muted', width: 1.2, dash: [3, 5] });
          P.circle(0, 0, rho, { color: 'green', width: 1.6, dash: [7, 5] });
          P.path(X.concat([X[0]]), { color: 'faint', width: 1 });
          P.line(-0.12, -0.12, 0.12, 0.12, { color: 'ink', width: 1.5 }); P.line(-0.12, 0.12, 0.12, -0.12, { color: 'ink', width: 1.5 });
          X.forEach((z, j) => {
            const zero = mods[j] < 1e-3;
            P.dot(z[0], z[1], { color: zero ? 'red' : j === k ? 'purple' : 'blue', r: j === k ? 7 : 5.5, label: `h${'₀₁₂₃₄₅₆₇'[j]}`, labelPos: z[1] >= 0 ? 'ne' : 'se', labelSize: 12 });
          });
          // bottom: the inverse
          B.hline(0, { color: 'faint', width: 1 });
          let inv = null, invN = Infinity, convErr = NaN;
          if (mn > 1e-3) {
            inv = x.map((_, n) => { let s = 0; X.forEach((z, j) => { const d = z[0] * z[0] + z[1] * z[1]; s += (z[0] * Math.cos(2 * Math.PI * j * n / 8) - z[1] * Math.sin(2 * Math.PI * j * n / 8)) / d; }); return s / 8; });
            // self-check: the cyclic convolution x * x⁻¹ must be δ₀
            convErr = Math.max(...x.map((_, m) => Math.abs(x.reduce((acc, xn, n) => acc + xn * inv[(m - n + 8) % 8], 0) - (m === 0 ? 1 : 0))));
            invN = M.sum(inv.map(Math.abs));
            const top = Math.max(1.2, 1.15 * Math.max(...inv.map(Math.abs)));
            B.setView(null, [-top, top]);
            B.bars(inv, { x0: 0, color: 'green', barWidth: 0.42 });
            B.corner(`‖x⁻¹‖₁ = ${v.fmt(invN, 3)}`, 'tr', { color: 'green', weight: 600 });
          } else {
            B.setView(null, [-2, 2]);
            B.corner('some h_k(x) = 0  ⇒  x lies in the maximal ideal ker h_k and has no inverse', 'tl', { color: 'red', weight: 600 });
          }
          v.legend([['blue', '$x$ and the points $h_j(x)$'], ['purple', `the character $h_{${k}}$`], ['green', '$\\rho(x)=\\max_j\\abs{h_j(x)}$', { dash: true }], ['muted', '$\\norm x_1$', { dash: true }]]);
          st = { k, hk: X[k], mn, rho, nrm, invN, convErr, j0: M.argmin(mods) };
        });
        v.readout(() => {
          const s = st; if (s.k == null) return '';
          const z = `${v.fix(s.hk[0], 3)}${s.hk[1] < 0 ? '-' : '+'}${v.fix(Math.abs(s.hk[1]), 3)}i`;
          return `$h_{${s.k}}(x) = ${z}$; $\\;\\min_j\\abs{h_j(x)} = ${v.fix(s.mn, 4)}$` + (s.mn > 1e-3
            ? ` — no character kills $x$, so $x$ is invertible (c): $\\norm{x^{-1}}_1 = ${v.fix(s.invN, 3)}$ and $\\max_m\\abs{(x*x^{-1})_m-\\delta_{m0}} = ${v.sci(s.convErr, 2)}$. Also $\\rho(x) = ${v.fix(s.rho, 3)}\\le\\norm x_1 = ${v.fix(s.nrm, 3)}$.`
            : ` — $x\\in\\ker h_{${s.j0}}$, a maximal ideal (b), so $x$ is not invertible and $0\\in\\sigma(x)$ (e).`);
        });
      },
    },
    // ------------------------------------------------------------------ applications
    {
      num: '18.21',
      kind: 'Theorem',
      name: "Wiener's lemma: 1/f has an absolutely convergent Fourier series",
      credit: 'Wiener, 1932',
      statement: String.raw`Suppose $f$ is a continuous function on the unit circle whose Fourier series converges absolutely,
$$f(e^{it})=\sum_{n=-\infty}^{\infty}c_ne^{int},\qquad \sum_{n=-\infty}^{\infty}\abs{c_n}<\infty,$$
and $f(e^{it})\neq0$ for every real $t$. Then $1/f$ also has an absolutely convergent Fourier series.`,
      idea: String.raw`The functions with absolutely convergent Fourier series form a commutative Banach algebra $W$ under pointwise multiplication, with norm $\norm f=\sum\abs{c_n}$ (multiplication of functions is convolution of coefficient sequences, so $W\cong\ell^1(\Z)$). If $h$ is a complex homomorphism of $W$ and $z(e^{it})=e^{it}$, then $\abs{h(z)}\le\norm z=1$ and $\abs{h(1/z)}\le1$ (9.20), so $h(z)=e^{is}$ for some real $s$; hence $h(e^{int})=e^{ins}$ and, by continuity, $h(f)=f(e^{is})$. Every $h$ is a point evaluation, none of which vanishes at $f$, so $f$ is invertible in $W$ by 18.17(c). Wiener's original proof was a delicate local argument; Gelfand's theory makes it a few lines.`,
      caption: String.raw`$f=c+g$, where $g$ has coefficients $\hat g(n)$ of size $1/n^2$ — absolutely summable, but $g$ has a corner, so $f$ is not smooth. Left: the closed curve $f(\T)$, which is $\sigma(f)$ in $W$. Drag the constant term $c$ (moving the whole curve). Right: the Fourier coefficients of $1/f$ on a log scale (green), next to those of $f$ (grey). While $0\notin f(\T)$ they decay like $n^{-2}$ and $\sum\abs{\widehat{(1/f)}(n)}$ is finite — whether or not the curve winds around $0$. Pull the curve onto $0$ and the sum explodes.`,
      deps: ['rca-18.17', 'rca-9.20', 'rca-4.23', 'rca-4.26'],
      see: ['rca-9.21'],
      tags: ['Wiener', 'Fourier series', 'Gelfand theory'],
      verify: true,
      viz(v) {
        const M = v.M;
        const N = 2048, NC = 30, KAPPA = 0.35;
        // ĝ(1) = 0.95, ĝ(−2) = 0.38, plus κ/n² for every n ≠ 0 (a real 'kink' with a corner at t = 0)
        const gc = (n) => (n === 0 ? 0 : KAPPA / (n * n)) + (n === 1 ? 0.95 : 0) + (n === -2 ? 0.38 : 0);
        const gRe = new Float64Array(N), gIm = new Float64Array(N);
        for (let n = -N / 2 + 1; n < N / 2; n++) gRe[(n + N) % N] = gc(n);
        fft(gRe, gIm, +1); // samples g(e^{2πij/N})
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.75, 1.75], equal: true, height: 360, weight: 1, title: '$f(\\T)=\\sigma(f)$ in the Wiener algebra $W$' });
        const R = v.stage({ x: [-NC - 1, NC + 1], y: [-5.75, 0.7], height: 360, axes: 'box', weight: 1.2, yticks: [[0, '1'], [-1, '10⁻¹'], [-2, '10⁻²'], [-3, '10⁻³'], [-4, '10⁻⁴'], [-5, '10⁻⁵']], xticks: [-30, -20, -10, 0, 10, 20, 30], title: 'Fourier coefficients (log scale) against $n$' });
        const c = L.handle(-0.55, 0.08, { color: 'blue', label: 'c', labelPos: 'n' });
        let st = {};
        v.render(() => {
          const fr = new Float64Array(N), fi = new Float64Array(N);
          let mn = Infinity;
          for (let j = 0; j < N; j++) { const a = c.x + gRe[j], b = c.y + gIm[j], d = a * a + b * b; mn = Math.min(mn, Math.sqrt(d)); fr[j] = a / d; fi[j] = -b / d; }
          fft(fr, fi, -1);
          const coef = (n) => { const j = (n + N) % N; return Math.hypot(fr[j], fi[j]) / N; };
          let sum = 0; for (let n = -N / 2 + 1; n < N / 2; n++) sum += coef(n);
          // winding number of f(T) about 0
          let w = 0; for (let j = 0; j < N; j++) { const a0 = Math.atan2(c.y + gIm[j], c.x + gRe[j]), a1 = Math.atan2(c.y + gIm[(j + 1) % N], c.x + gRe[(j + 1) % N]); let d = a1 - a0; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; w += d; }
          w = Math.round(w / (2 * Math.PI));
          const bad = mn < 0.02;
          // left: the curve, the origin and the distance min|f|
          const pts = []; for (let j = 0; j <= N; j += 4) pts.push([c.x + gRe[j % N], c.y + gIm[j % N]]);
          L.circle(0, 0, mn, { color: bad ? 'red' : 'green', width: 1.4, dash: [4, 4], fill: bad ? null : 'green', fillAlpha: 0.08 });
          L.path(pts, { color: 'blue', width: 2.8 });
          L.dot(c.x + gRe[0], c.y + gIm[0], { color: 'blue', r: 4.5, label: 'corner (t = 0)', labelPos: 'nw', math: false, labelSize: 11.5 });
          L.line(-0.08, -0.08, 0.08, 0.08, { color: bad ? 'red' : 'ink', width: 2 }); L.line(-0.08, 0.08, 0.08, -0.08, { color: bad ? 'red' : 'ink', width: 2 });
          L.text('0', 0, 0, { dx: 7, dy: 9, color: bad ? 'red' : 'ink', math: true, size: 14 });
          L.corner(bad ? 'f vanishes on 𝕋: 1/f ∉ W' : `min |f| = ${v.fmt(mn, 3)},  winding about 0: ${w}`, 'br', { color: bad ? 'red' : 'green', weight: 600 });
          // right: coefficient magnitudes of f (grey) and of 1/f (green), with a fitted n^{-2} guide
          const fc = (n) => Math.abs(n === 0 ? Math.hypot(c.x, c.y) : gc(n));
          const ns = M.range(2 * NC + 1, -NC), bottom = -5.2;
          for (const n of ns) { const y = Math.log10(Math.max(fc(n), 1e-9)); R.line(n + 0.2, bottom, n + 0.2, y, { color: 'gray', width: 2.2, alpha: 0.55, cap: 'butt' }); }
          const tip = [];
          for (const n of ns) { const y = Math.log10(Math.max(coef(n), 1e-9)); tip.push([n - 0.2, y]); R.line(n - 0.2, bottom, n - 0.2, y, { color: bad ? 'red' : 'green', width: 2.6, cap: 'butt' }); }
          R.dots(tip, { color: bad ? 'red' : 'green', r: 2.4 });
          const Kp = coef(NC) * NC * NC, Km = coef(-NC) * NC * NC;
          R.fn((n) => Math.log10(Kp / (n * n)), { domain: [3, NC + 1], color: 'ink', width: 1.2, dash: [5, 4] });
          R.fn((n) => Math.log10(Km / (n * n)), { domain: [-NC - 1, -3], color: 'ink', width: 1.2, dash: [5, 4] });
          R.text('∝ n⁻²', NC * 0.62, Math.log10(Kp / (NC * NC * 0.384)), { dy: -12, color: 'ink', size: 12, align: 'center' });
          R.corner(bad ? 'Σ |coefficients of 1/f| explodes' : `Σₙ |coefficients of 1/f| = ${v.fmt(sum, 4)}`, 'tr', { color: bad ? 'red' : 'green', weight: 600 });
          v.legend([['blue', '$f(\\T)$'], [bad ? 'red' : 'green', 'disc of radius $\\min\\abs f$ about $0$', { dash: true }], ['green', '$\\abs{\\widehat{(1/f)}(n)}$', { area: true }], ['gray', '$\\abs{\\hat f(n)}$', { area: true }]]);
          st = { mn, sum, w, bad };
        });
        v.readout(() => {
          const s = st; if (s.mn == null) return '';
          return s.bad ? `$f$ (nearly) vanishes on $\\T$; the computed $\\sum\\abs{\\widehat{(1/f)}(n)}\\approx${v.fix(s.sum, 1)}$ is exploding — Wiener's hypothesis fails.`
            : `$\\min_\\T\\abs f = ${v.fix(s.mn, 3)} > 0$ and $\\sum_n\\abs{\\widehat{(1/f)}(n)} = ${v.fix(s.sum, 3)}$ (over $\\abs n<${N / 2}$): $1/f\\in W$. The curve winds ${s.w} time${Math.abs(s.w) === 1 ? '' : 's'} around $0$, which does not matter here.`;
        });
      },
    },
  ],
};
