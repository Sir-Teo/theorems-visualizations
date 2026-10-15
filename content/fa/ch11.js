// Rudin, Functional Analysis — Chapter 11: Commutative Banach Algebras (part 1: ideals, homomorphisms, Gelfand transforms)
//
// Numbering checked where possible against Google Books snippet views (2nd ed. and the 1st, which agrees at every
// point checked) and Jordan Bell's page-numbered citations; items carry `verify: true`.

const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const cscale = (a, k) => [a[0] * k, a[1] * k];
/** Convolution of finite two-sided sequences stored as {lo, c: [complex]} (indices lo, lo+1, …). */
function convZ(a, b) { const c = Array.from({ length: a.c.length + b.c.length - 1 }, () => [0, 0]); a.c.forEach((x, i) => b.c.forEach((y, j) => { c[i + j] = cadd(c[i + j], cmul(x, y)); })); return { lo: a.lo + b.lo, c }; }
const l1 = (a) => a.c.reduce((s, z) => s + cabs(z), 0);
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), d)}i`;

export default {
  collection: 'fa',
  chapter: 11,
  title: 'Commutative Banach Algebras',
  summary: String.raw`In a commutative Banach algebra the maximal ideals are exactly the kernels of the complex homomorphisms, so an element is invertible precisely when no homomorphism kills it, and its spectrum is the set of its values under homomorphisms. The set $\Delta$ of homomorphisms, with the weak* topology, is a compact Hausdorff space, and the Gelfand transform $x\mapsto\hat x$ represents $A$ by continuous functions on $\Delta$ — faithfully modulo the radical, with $\|\hat x\|_\infty=\rho(x)$. Classical examples: $\ell^1(\Z)$ has $\Delta=\T$ (Wiener's lemma), the disc algebra has $\Delta=\overline U$. With an involution and the $B^*$ identity $\|xx^*\|=\|x\|^2$, the Gelfand transform is an isometric $*$-isomorphism onto all of $C(\Delta)$ (Gelfand–Naimark); spectra are then the same in every closed $*$-subalgebra, and positive functionals are automatically bounded.`,
  items: [
    {
      num: '11.1',
      kind: 'Definition',
      name: 'The maximal ideal space Δ',
      credit: 'Gelfand, 1941',
      statement: String.raw`Throughout the chapter $A$ is a commutative complex Banach algebra with unit $e$. Its **maximal ideal space** $\Delta$ is the set of all complex homomorphisms $h:A\to\C$ (nonzero, linear, multiplicative). Each $h\in\Delta$ satisfies $h(e)=1$ and $|h(x)|\le\norm x$, so $\Delta$ lies in the closed unit ball of $A^*$.`,
      idea: String.raw`The bound $|h(x)|\le\norm x$ is 10.7(c): if $|h(x)|>\norm x$, then $e-x/h(x)$ would be invertible yet killed by $h$. The name anticipates 11.5: the kernels of the elements of $\Delta$ are exactly the maximal ideals. For $C(K)$, $\Delta$ is $K$ (point evaluations); for the disc algebra it is the closed disc.`,
      caption: String.raw`The disc algebra $A$ (uniform limits of polynomials on $\T$, sup norm). For any $w\in\C$, $h_w(p)=p(w)$ is multiplicative on polynomials; it extends to a homomorphism of $A$ only if it is bounded. Drag $w$: the bars are $|h_w(z^n)|=|w|^n$ against $\norm{z^n}=1$ — bounded exactly when $|w|\le1$. The lower panel tests the bound on a polynomial $p$: $|p(w)|\le\max_\T|p|$ inside the disc (maximum modulus), not outside. So $\Delta$ is the closed unit disc.`,
      deps: ['fa-10.4', 'fa-10.7'],
      tags: ['commutative Banach algebras', 'maximal ideal space'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, height: 300, axes: true, title: 'the point $w$ and the closed unit disc' });
        const B = v.stage({ x: [-0.6, 20.6], y: [0, 3], height: 300, axes: 'box', xlabel: 'n', title: '$|h_w(z^n)|=|w|^n$ against $\\|z^n\\|=1$' });
        const P = v.stage({ x: [0, 2 * Math.PI], y: [0, 3], height: 170, full: true, axes: 'box', xticks: [[0, '0'], [Math.PI, 'π'], [2 * Math.PI, '2π']], xlabel: 'θ', title: '$|p(e^{i\\theta})|$ for $p(z)=1+z-z^3/2$, and $|p(w)|$' });
        const hw = L.handle(0.7, 0.4, { color: 'blue', label: 'w' });
        const p = (z) => cadd(cadd([1, 0], z), cscale(cmul(z, cmul(z, z)), -0.5));
        let st = {};
        v.legend([['blue', '$|w|^n$'], ['ink', 'bound $1$', { dash: true }], ['orange', '$|p(w)|$', { dash: true }]]);
        v.render(() => {
          const w = [hw.x, hw.y], r = cabs(w), ok = r <= 1 + 1e-9;
          L.circle(0, 0, 1, { color: 'ink', width: 2, fill: 'green', fillAlpha: 0.08 });
          L.corner(ok ? 'w ∈ D̄: h_w ∈ Δ' : '|w| > 1: h_w unbounded', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          const bars = []; for (let n = 0; n <= 20; n++) bars.push(Math.pow(r, n));
          B.setView(null, [0, Math.max(1.4, Math.min(8, Math.max(...bars) * 1.1))]);
          B.bars(bars.map((b) => Math.min(b, 8)), { x0: 0, dx: 1, color: ok ? 'blue' : 'red' });
          B.hline(1, { color: 'ink', width: 1.4, dash: [5, 4] });
          const vals = M.linspace(0, 2 * Math.PI, 361).map((t) => cabs(p([Math.cos(t), Math.sin(t)])));
          const mx = Math.max(...vals), pw = cabs(p(w));
          P.setView(null, [0, Math.max(mx, pw) * 1.15]);
          P.path(M.linspace(0, 2 * Math.PI, 361).map((t, i) => [t, vals[i]]), { color: 'ink', width: 2 });
          P.hline(pw, { color: pw <= mx + 1e-9 ? 'orange' : 'red', width: 2, dash: [6, 4] });
          st = { r, pw, mx };
        });
        v.readout(() => `$|w| = ${v.fix(st.r, 3)}$: $\\;|p(w)| = ${v.fix(st.pw, 3)} ${st.pw <= st.mx + 1e-9 ? '\\le' : '>'} \\|p\\|_\\infty = ${v.fix(st.mx, 3)}$.` + (st.r <= 1 ? ' Inside the disc every $h_w$ is a bounded homomorphism.' : ' Outside, $h_w$ is unbounded on $A$, so it is not in $\\Delta$.'));
      },
    },
    {
      num: '11.2',
      kind: 'Definition',
      name: 'Ideals, maximal ideals, quotient algebras',
      statement: String.raw`A subspace $J\subset A$ is an **ideal** if $xy\in J$ whenever $x\in A$, $y\in J$; it is **proper** if $J\ne A$, and **maximal** if it is proper and contained in no larger proper ideal. If $J$ is a closed proper ideal, the quotient space $A/J$ with $(x+J)(y+J)=xy+J$ and the quotient norm $\norm{x+J}=\inf\{\norm{x+y}:y\in J\}$ is again a commutative Banach algebra with unit $e+J$.`,
      idea: String.raw`The quotient is a Banach space by 1.41; multiplication is well defined because $J$ is an ideal, and $\norm{(x+J)(y+J)}\le\norm{x+J}\norm{y+J}$ follows by taking infima. That $\norm{e+J}=1$ uses that $J$ is proper and closed: $\norm{e-y}<1$ would make $y\in J$ invertible (10.7).`,
      deps: ['fa-1.41', 'fa-10.1'],
      tags: ['commutative Banach algebras', 'ideals'],
      verify: true,
    },
    {
      num: '11.3',
      kind: 'Proposition',
      name: 'Basic facts about ideals',
      statement: String.raw`(a) No proper ideal of $A$ contains an invertible element.
(b) The closure of an ideal is an ideal.
(c) Every proper ideal is contained in a maximal ideal.
(d) Every maximal ideal is closed.`,
      idea: String.raw`(a) If $x\in J$ is invertible, then $y=yx^{-1}x\in J$ for every $y$. (b) Continuity of the operations. (c) Zorn's lemma, using (a): a union of a chain of proper ideals still misses $e$. (d) $G(A)$ is open and contains $e$, so the closure of a proper ideal still misses $G(A)$ by (a); it is proper, hence equal to the maximal ideal.`,
      caption: String.raw`$A=C[0,1]$. The ideal generated by two functions $f_1,f_2$ (drag their zeros $a$ and $b$) contains $g=f_1^2+f_2^2$. If $f_1,f_2$ have no common zero, $g$ is bounded below, hence invertible, and the ideal is all of $A$ by (a). Slide $a$ onto $b$: $g$ acquires a zero, the ideal becomes proper, and it sits inside the maximal ideal $M_b=\{f:f(b)=0\}$, as (c) predicts.`,
      deps: ['fa-11.2', 'fa-10.12'],
      tags: ['ideals', 'commutative Banach algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [0, 1], y: [-0.8, 1.4], height: 330, full: true, axes: true, title: '$f_1$, $f_2$ and $g=f_1^2+f_2^2$' });
        const ha = S.handle(0.3, 0, { color: 'blue', label: 'a', labelPos: 's', constrain: (x) => [M.clamp(x, 0.02, 0.98), 0] });
        const hb = S.handle(0.62, 0, { color: 'orange', label: 'b', labelPos: 's', constrain: (x) => [M.clamp(x, 0.02, 0.98), 0] });
        let st = {};
        v.legend([['blue', '$f_1(t)=(t-a)(1+0.4\\sin5t)$'], ['orange', '$f_2(t)=(t-b)\\cos2t$'], ['green', '$g=f_1^2+f_2^2$']]);
        v.render(() => {
          const a = ha.x, b = hb.x;
          const f1 = (t) => (t - a) * (1 + 0.4 * Math.sin(5 * t)), f2 = (t) => (t - b) * Math.cos(2 * t), g = (t) => f1(t) ** 2 + f2(t) ** 2;
          S.fn(f1, { color: 'blue', width: 2 });
          S.fn(f2, { color: 'orange', width: 2 });
          S.fn(g, { color: 'green', width: 2.6, fill: 'green', fillAlpha: 0.12 });
          let mn = Infinity, at = 0; for (let i = 0; i <= 2000; i++) { const t = i / 2000, y = g(t); if (y < mn) { mn = y; at = t; } }
          S.dot(at, mn, { color: mn < 1e-4 ? 'red' : 'green', r: 5 });
          st = { mn, at, common: Math.abs(a - b) < 0.005 };
        });
        v.readout(() => (st.common ? `Common zero at $t=${v.fix(st.at, 3)}$: $g$ vanishes there, the ideal $(f_1,f_2)$ is proper and lies in the maximal ideal $M_{${v.fix(st.at, 2)}}$.` : `$\\min g = ${v.sci(st.mn, 2)}$ at $t=${v.fix(st.at, 3)}$: $g$ is invertible in $C[0,1]$, so $e=g\\cdot g^{-1}\\in(f_1,f_2)$ and the ideal is all of $A$.`));
      },
    },
    {
      num: '11.4',
      kind: 'Theorem',
      name: 'Quotients by closed ideals; A/M ≅ ℂ',
      statement: String.raw`If $J$ is a closed proper ideal of $A$, then $A/J$ is a commutative Banach algebra with unit (11.2). If $M$ is a maximal ideal, then $A/M$ is a field, and by the Gelfand–Mazur theorem it is isometrically isomorphic to $\C$: there is $h\in\Delta$ with $x-h(x)e\in M$ for every $x$, and $\norm{x+M}=|h(x)|$.`,
      idea: String.raw`In $A/M$ every nonzero element is invertible: if $x\notin M$, the ideal $\{ax+y:a\in A,y\in M\}$ is larger than $M$, hence equals $A$ and contains $e$. So $A/M$ is a Banach division algebra, i.e. $\C$ (10.14). The composite $A\to A/M\cong\C$ is the homomorphism $h$ with kernel $M$.`,
      caption: String.raw`$A=C[0,1]$ with the sup norm, and a closed ideal: the maximal ideal $M_p=\{f:f(p)=0\}$ or the ideal $J_K=\{f:f=0\text{ on }K\}$ of a closed interval $K$. The coset $f+J$ consists of all functions that agree with $f$ on the zero set (faint: a few of them). Its norm is attained by the green representative: the constant $f(p)$ for $M_p$, and $f$ clipped at height $\max_K|f|$ for $J_K$. So $\norm{f+M_p}=|f(p)|$ — $A/M_p\cong\C$ — and $\norm{f+J_K}=\max_K|f|$ — $A/J_K\cong C(K)$.`,
      deps: ['fa-11.3', 'fa-10.14', 'fa-1.41'],
      tags: ['ideals', 'quotient algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const kind = v.select('ideal', [{ value: 'pt', label: 'maximal $M_p$' }, { value: 'iv', label: '$J_K$, $K$ an interval' }], 'pt');
        const S = v.stage({ x: [0, 1], y: [-1.6, 1.6], height: 340, full: true, axes: true, title: 'the coset $f+J$ and its smallest-norm representative' });
        const hp = S.handle(0.35, -1.45, { color: 'purple', label: 'p', labelPos: 'n', constrain: (x) => [M.clamp(x, 0, 1), -1.45] });
        const hq = S.handle(0.65, -1.45, { color: 'purple', label: 'K', labelPos: 'n', constrain: (x) => [M.clamp(x, 0, 1), -1.45] });
        const f = (t) => 0.9 * Math.sin(7 * t) + 0.5 * Math.cos(3 * t) - 0.2;
        const rnd = v.rng(5), others = M.range(6).map(() => [rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(2, 9)]);
        let st = {};
        v.legend([['blue', '$f$'], ['muted', 'other representatives $f+g$, $g\\in J$'], ['green', 'smallest-norm representative'], ['purple', 'zero set of $J$']]);
        v.render(() => {
          const pt = kind.value === 'pt';
          hq.visible = !pt;
          const a = pt ? hp.x : Math.min(hp.x, hq.x), b = pt ? hp.x : Math.max(hp.x, hq.x);
          const vanish = (t) => (t >= a && t <= b ? 0 : Math.min(1, Math.min(Math.abs(t - a), Math.abs(t - b)) * 6));   // a function in J (0 on the zero set)
          for (const [c1, c2, w] of others) S.fn((t) => f(t) + vanish(t) * (c1 + c2 * Math.sin(w * t)), { color: 'muted', width: 1, alpha: 0.45 });
          S.fn(f, { color: 'blue', width: 2.4 });
          let m;
          if (pt) { m = Math.abs(f(a)); S.hline(f(a), { color: 'green', width: 2.6 }); S.dot(a, f(a), { color: 'purple', r: 5 }); }
          else { m = 0; for (let i = 0; i <= 400; i++) { const t = a + (b - a) * i / 400; m = Math.max(m, Math.abs(f(t))); } S.fn((t) => M.clamp(f(t), -m, m), { color: 'green', width: 2.6 }); S.line(a, -1.45, b, -1.45, { color: 'purple', width: 5 }); S.hband(-m, m, { color: 'green', alpha: 0.06 }); }
          S.vband(a, b, { color: 'purple', alpha: 0.06 });
          st = { pt, m, a, b, fp: f(a) };
        });
        v.readout(() => (st.pt ? `$\\|f+M_p\\| = |f(p)| = ${v.fix(st.m, 4)}$ with $p=${v.fix(st.a, 3)}$: the quotient map is $f\\mapsto f(p)$, an isometric isomorphism $A/M_p\\to\\C$.` : `$\\|f+J_K\\| = \\max_{K}|f| = ${v.fix(st.m, 4)}$ for $K=[${v.fix(st.a, 2)},${v.fix(st.b, 2)}]$: $A/J_K\\cong C(K)$, which is not a field.`));
      },
    },
    {
      num: '11.5',
      kind: 'Theorem',
      name: "Gelfand's theorem: maximal ideals are kernels of homomorphisms",
      credit: 'Gelfand, 1941',
      statement: String.raw`(a) Every maximal ideal of $A$ is the kernel of some $h\in\Delta$.
(b) If $h\in\Delta$, the kernel of $h$ is a maximal ideal.
(c) An element $x\in A$ is invertible if and only if $h(x)\ne0$ for every $h\in\Delta$.
(d) $x$ is invertible if and only if $x$ lies in no proper ideal of $A$.
(e) $\lambda\in\sigma(x)$ if and only if $h(x)=\lambda$ for some $h\in\Delta$.`,
      idea: String.raw`(a) is 11.4; (b) holds because $\ker h$ has codimension $1$. (d): a non-invertible $x$ generates the proper ideal $xA$; conversely (11.3(a)). (c): if $x$ is not invertible, $xA$ lies in a maximal ideal $=\ker h$ by (a), so $h(x)=0$; the converse is 10.5. (e) is (c) applied to $\lambda e-x$.`,
      caption: String.raw`A finite-dimensional commutative algebra with a radical: $A=\C[z]/\big((z-z_1)^2(z-z_2)^2(z-z_3)^2\big)$, polynomials remembered only through their values **and first derivatives** at three points $z_k$ (blue, draggable). $\Delta=\{h_1,h_2,h_3\}$ with $h_k(p)=p(z_k)$. Take $x=p$ with roots $r_1,r_2$ (red). Right: $|h_k(x)|$ and the size of $x^{-1}$, computed by Hermite interpolation ($q(z_k)=1/p(z_k)$, $q'(z_k)=-p'(z_k)/p(z_k)^2$). Drag a root onto some $z_k$: $h_k(x)=0$, $x$ falls into the maximal ideal $\ker h_k$, and the inverse blows up.`,
      deps: ['fa-11.4', 'fa-11.3', 'fa-10.5'],
      see: ['rca-18.17'],
      tags: ['commutative Banach algebras', 'Gelfand theory', 'maximal ideals'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, height: 320, axes: true, title: 'points $z_k$ (the homomorphisms) and roots of $p$' });
        const R = v.stage({ x: [0.3, 4.7], y: [-4, 3], height: 320, axes: 'box', xticks: [[1, 'h₁(x)'], [2, 'h₂(x)'], [3, 'h₃(x)'], [4, '‖x⁻¹‖']], title: 'sizes, on a log scale' });
        const Z = [[-1.1, 0.4], [0.2, -0.8], [1.2, 0.6]].map(([a, b], k) => L.handle(a, b, { color: 'blue', r: 6, label: `z${'₁₂₃'[k]}` }));
        const Rt = [[0.6, 0.9], [-0.9, -0.6]].map(([a, b], k) => L.handle(a, b, { color: 'red', r: 6, label: `r${'₁₂'[k]}` }));
        let st = {};
        v.render(() => {
          const z = Z.map((h) => [h.x, h.y]), r = Rt.map((h) => [h.x, h.y]);
          const p = (w) => cmul(csub(w, r[0]), csub(w, r[1])), dp = (w) => cadd(csub(w, r[0]), csub(w, r[1]));
          L.domain((w) => { const q = p([w.re, w.im]); return new v.Cx(q[0], q[1]); }, { key: JSON.stringify(r), res: 3 });
          L.axes();
          const hv = z.map(p), mags = hv.map(cabs);
          // Hermite data of the inverse; its size measured as max_k (|q(z_k)| + |q'(z_k)|)
          let inv = 0, ok = true;
          z.forEach((zk, k) => { const pk = hv[k]; if (cabs(pk) < 1e-9) { ok = false; return; } const q0 = cdiv([1, 0], pk), q1 = cscale(cdiv(dp(zk), cmul(pk, pk)), -1); inv = Math.max(inv, cabs(q0) + cabs(q1)); });
          const vals = [...mags.map((m) => Math.log10(m + 1e-12)), ok ? Math.log10(inv) : 3];
          vals.forEach((y, i) => R.rect(i + 1 - 0.3, -4, i + 1 + 0.3, Math.min(y, 2.9), { fill: i < 3 ? (mags[i] < 0.02 ? 'red' : 'blue') : ok ? 'green' : 'red', fillAlpha: 0.75, stroke: false }));
          R.setTicks([[1, 'h₁(x)'], [2, 'h₂(x)'], [3, 'h₃(x)'], [4, '‖x⁻¹‖']], [-4, -2, 0, 2].map((k) => [k, p10(k)]));
          st = { hv, ok, inv, kill: mags.findIndex((m) => m < 0.02) };
        });
        v.readout(() => {
          const s = st;
          const sp = `$\\sigma(x)=\\{h_k(x)\\}=\\{${s.hv.map((w) => fmtC(v, w, 2)).join(',\\;')}\\}$. `;
          if (s.kill >= 0) return sp + `$h_{${s.kill + 1}}(x)\\approx0$: $x$ is (nearly) in the maximal ideal $\\ker h_{${s.kill + 1}}$ and has no inverse.`;
          return sp + `No homomorphism kills $x$, so $x$ is invertible; size of $x^{-1}$: $${v.fix(s.inv, 3)}$. (The element $(z-z_1)(z-z_2)(z-z_3)$ is killed by all $h_k$ yet is not $0$: it is in the radical.)`;
        });
      },
    },
    {
      num: '11.8',
      kind: 'Definition',
      name: 'Radical; semisimple algebras',
      statement: String.raw`The **radical** of $A$, $\operatorname{rad}A$, is the intersection of all maximal ideals of $A$. $A$ is **semisimple** if $\operatorname{rad}A=\{0\}$. By 11.5, $x\in\operatorname{rad}A$ iff $h(x)=0$ for every $h\in\Delta$, iff $\sigma(x)=\{0\}$, iff $\lim\norm{x^n}^{1/n}=0$ ($x$ is quasinilpotent).`,
      idea: String.raw`$C(K)$, $\ell^1(\Z)$ and the disc algebra are semisimple; the algebras of 11.5 with repeated points, or the algebra generated by the Volterra operator, are not — their radicals consist of nilpotent or quasinilpotent elements, invisible to every homomorphism.`,
      deps: ['fa-11.5', 'fa-10.13'],
      tags: ['commutative Banach algebras', 'radical'],
      verify: true,
    },
    {
      num: '11.9',
      kind: 'Theorem',
      name: 'The Gelfand transform',
      credit: 'Gelfand, 1941',
      statement: String.raw`For $x\in A$ define $\hat x:\Delta\to\C$ by $\hat x(h)=h(x)$, and give $\Delta$ the weakest topology making every $\hat x$ continuous (the **Gelfand topology**, the weak* topology inherited from $A^*$). Then
(a) $\Delta$ is a compact Hausdorff space;
(b) $x\mapsto\hat x$ is a homomorphism of $A$ onto a subalgebra $\hat A$ of $C(\Delta)$ that separates points and contains the constants, with kernel $\operatorname{rad}A$;
(c) $\hat x(\Delta)=\sigma(x)$ and $\norm{\hat x}_\infty=\rho(x)\le\norm x$.`,
      idea: String.raw`$\Delta$ is a weak*-closed subset of the unit ball of $A^*$ (multiplicativity and $h(e)=1$ are preserved under pointwise limits), hence compact by Banach–Alaoglu. $\hat x(\Delta)=\sigma(x)$ is 11.5(e), and then $\norm{\hat x}_\infty=\rho(x)$ by definition of the spectral radius; the kernel is the radical by 11.8.`,
      caption: String.raw`$A=\ell^1(\Z)$, whose maximal ideal space is the circle (11.13): $\hat x(e^{i\theta})=\sum_nx_ne^{in\theta}$. Drag the bar tops of $x$ (left). Middle: $\hat x(\T)=\sigma(x)$ in the plane, with the circles of radius $\norm{\hat x}_\infty=\rho(x)$ (green) and $\norm x_1$ (orange). Right: $\norm{x^n}_1^{1/n}$ (convolution powers) against $n$, decreasing to $\norm{\hat x}_\infty$ — the spectral radius formula computed two ways.`,
      deps: ['fa-11.5', 'fa-11.8', 'fa-3.15', 'fa-10.13'],
      tags: ['Gelfand transform', 'commutative Banach algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const B = v.stage({ x: [-3.6, 3.6], y: [-1.2, 1.2], height: 300, minWidth: 220, axes: true, xticks: [-3, -2, -1, 0, 1, 2, 3], title: '$x=(x_n)\\in\\ell^1(\\Z)$' });
        const C = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 300, minWidth: 220, axes: true, title: '$\\sigma(x)=\\hat x(\\T)$' });
        const P = v.stage({ x: [0, 31], y: [0, 3], height: 300, minWidth: 220, axes: 'box', xlabel: 'n', title: '$\\|x^n\\|_1^{1/n}$' });
        const X0 = [0.3, 0.6, -0.4, 0.5, 0.45, 0.2, -0.55];
        const H = X0.map((a, k) => B.handle(k - 3, a, { color: 'blue', r: 5.5, constrain: (x, y) => [k - 3, M.clamp(Math.round(y * 20) / 20, -1.1, 1.1)] }));
        let st = {};
        v.legend([['blue', '$x$, $\\hat x(\\T)$'], ['green', '$\\|\\hat x\\|_\\infty=\\rho(x)$', { dash: true }], ['orange', '$\\|x\\|_1$', { dash: true }]]);
        v.render(() => {
          const x = { lo: -3, c: H.map((h) => [h.y, 0]) };
          B.bars(H.map((h) => h.y), { x0: -3, dx: 1, color: 'blue', barWidth: 0.45 });
          const pts = M.linspace(0, 2 * Math.PI, 361).map((t) => x.c.reduce((s, z, i) => cadd(s, cmul(z, [Math.cos((i - 3) * t), Math.sin((i - 3) * t)])), [0, 0]));
          const sup = Math.max(...pts.map(cabs)), n1 = l1(x);
          C.circle(0, 0, sup, { color: 'green', width: 2, dash: [6, 4] });
          C.circle(0, 0, n1, { color: 'orange', width: 2, dash: [6, 4] });
          C.path(pts, { color: 'blue', width: 2.4 });
          let pw = { lo: 0, c: [[1, 0]] }; const seq = [];
          for (let n = 1; n <= 30; n++) { pw = convZ(pw, x); seq.push([n, Math.pow(l1(pw), 1 / n)]); }
          P.setView(null, [0, Math.max(n1, 0.5) * 1.15]);
          P.hline(sup, { color: 'green', width: 2, dash: [6, 4] });
          P.hline(n1, { color: 'orange', width: 1.6, dash: [6, 4] });
          P.dots(seq, { color: 'blue', r: 3 });
          st = { sup, n1, last: seq[29][1] };
        });
        v.readout(() => `$\\|\\hat x\\|_\\infty = ${v.fix(st.sup, 4)}$, $\\;\\|x^{30}\\|_1^{1/30} = ${v.fix(st.last, 4)}$, $\\;\\|x\\|_1 = ${v.fix(st.n1, 4)}$: $\\rho(x)=\\|\\hat x\\|_\\infty\\le\\|x\\|_1$.`);
      },
    },
  ],
};
