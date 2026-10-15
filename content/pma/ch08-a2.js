// Rudin, Principles of Mathematical Analysis — Chapter 8 (part 2): the exponential function,
// the trigonometric functions and π, the fundamental theorem of algebra, trigonometric
// polynomials and orthonormal systems (8.6–8.10).

/** A number as TeX (scientific notation as m×10^e when very small or large). */
function texNum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const e = Math.floor(Math.log10(a));
  return `${(x / 10 ** e).toFixed(Math.max(0, d - 1))}\\times10^{${e}}`;
}
/** Partial sum E_N(x) = Σ_{n≤N} x^n/n! of the exponential series (real x). */
function expPartial(x, N) { let s = 0, t = 1; for (let n = 0; n <= N; n++) { s += t; t *= x / (n + 1); } return s; }
/** E(it) = Σ (it)^n/n! summed directly: returns [Re, Im] = [C(t), S(t)]. */
function expIt(t, terms = 80) {
  let re = 0, im = 0, tr = 1, ti = 0;
  for (let n = 0; n < terms; n++) { re += tr; im += ti; const nr = (-ti * t) / (n + 1), ni = (tr * t) / (n + 1); tr = nr; ti = ni; }
  return [re, im];
}

export default {
  collection: 'pma',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.6
    {
      num: '8.6',
      kind: 'Theorem',
      name: 'Properties of the exponential function',
      statement: String.raw`Define $E(z)=\sum_{n=0}^{\infty} z^n/n!$ for complex $z$; the series converges absolutely for every $z$, and $E(z+w)=E(z)E(w)$. For real $x$ write $e^x=E(x)$ (this agrees with $e=E(1)$ and with rational powers of $e$). Then:
(a) $e^x$ is continuous and differentiable on $\R$;
(b) $(e^x)'=e^x$;
(c) $e^x$ is strictly increasing and positive;
(d) $e^{x+y}=e^xe^y$;
(e) $e^x\to+\infty$ as $x\to+\infty$ and $e^x\to0$ as $x\to-\infty$;
(f) $\lim_{x\to+\infty}x^ne^{-x}=0$ for every $n$.

Consequently $e^x$ has an inverse $\log:(0,\infty)\to\R$, with $(\log y)'=1/y$ and $\log(uv)=\log u+\log v$; it is used to define $x^\alpha=e^{\alpha\log x}$ for $x>0$.`,
      idea: String.raw`Absolute convergence (ratio test) and Mertens' theorem on Cauchy products (3.50) give the addition formula $E(z)E(w)=E(z+w)$ by the binomial theorem. Then $\frac{E(z+h)-E(z)}{h}=E(z)\frac{E(h)-1}{h}\to E(z)$, which is (a) and (b). For $x>0$ every term is positive, so $E(x)>1$; with $E(x)E(-x)=1$ this gives (c) and (e). Finally $e^x>\frac{x^{n+1}}{(n+1)!}$ for $x>0$, so $0<x^ne^{-x}<\frac{(n+1)!}{x}\to0$, which is (f).`,
      caption: String.raw`Drag $x$ along the graph and change $N$: gold is the partial sum $E_N$ of the series. The orange tangent at $x$ always meets the axis exactly $1$ unit to the left — that is $(e^x)'=e^x$. Right: $x^ne^{-x}$ peaks at $x=n$ and then dies, squeezed under the bound $(n+1)!/x$ from the proof.`,
      deps: ['pma-3.50', 'pma-3.30', 'pma-8.1'],
      see: ['rca-0.1', 'rca-0.3', 'rca-0.4'],
      tags: ['exponential', 'logarithm'],
      viz(v) {
        const M = v.M;
        const E = (x) => expPartial(x, 90);
        const nS = v.slider('terms $N$ in $E_N$', 0, 12, 3, { int: true });
        const kS = v.slider('power $n$ in $x^ne^{-x}$', 1, 10, 4, { int: true });
        const showLog = v.toggle('show $\\log$ (the inverse function)', false);
        const L = v.stage({ x: [-3.6, 2.5], y: [-1.6, 8.2], height: 340, xlabel: 'x', title: '$e^x=E(x)$ and the partial sum $E_N$' });
        const R = v.stage({ x: [0, 20], y: [-8, 2], height: 340, axes: 'box', xlabel: 'x', title: '(f): $x^ne^{-x}\\to0$ (log scale)',
          yticks: [-8, -6, -4, -2, 0, 2, 4, 6, 8].map((k) => [k, k === 0 ? '1' : `10${String(k).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`]) });
        const hx = L.handle(0.9, E(0.9), { color: 'accent', label: 'x', constrain: (x) => { const xx = M.clamp(x, -3.2, 2.0); return [xx, E(xx)]; } });
        let st = null;
        v.render(() => {
          const N = nS.value, n = kS.value;
          const x0 = hx.x, y0 = E(x0); hx.y = y0;
          // left: exponential, partial sum, tangent with subtangent 1
          if (showLog.value) {
            L.line(-4, -4, 9, 9, { color: 'faint', width: 1, dash: [3, 4] });
            L.fn((x) => (x > 0 ? Math.log(x) : NaN), { domain: [0.0005, 8.5], color: 'purple', width: 2, dash: [6, 4] });
            L.text('log x', 1.35, Math.log(1.35) + 0.35, { color: 'purple', math: true, baseline: 'bottom' });
          }
          L.fn((x) => expPartial(x, N), { color: 'gold', width: 2.2 });
          L.fn(E, { color: 'ink', width: 2.6 });
          L.line(x0 - 1.6, y0 * (1 - 1.6), x0 + 0.9, y0 * 1.9, { color: 'orange', width: 2 });
          L.line(x0, 0, x0, y0, { color: 'muted', dash: [3, 3], width: 1 });
          L.measure(x0 - 1, 0, x0, 0, '1', { color: 'green', offset: -13, size: 15 });
          L.dot(x0 - 1, 0, { color: 'orange', r: 4 });
          L.tex(`E_{${N}}`, -3.3, expPartial(-3.3, N), { color: 'gold', align: 'left', baseline: 'bottom', dy: -4, size: 14 });
          // right: x^n e^{-x} and the bound (n+1)!/x
          const X = 4 * n + 30, peak = (n / Math.E) ** n;
          const lg = Math.log10, top = Math.max(1, Math.ceil(lg(peak)) + 1.6);
          R.setView([0, X], [-8.4, top]);
          const fact = M.factorial(n + 1);
          R.fn((x) => lg(fact / x), { domain: [0.01, X], color: 'orange', width: 2, dash: [6, 4] });
          R.fn((x) => lg(x ** n * Math.exp(-x)), { domain: [0.02, X], color: 'blue', width: 2.6, fill: 'blue', fillAlpha: 0.1, base: -8.4 });
          R.dot(n, lg(peak), { color: 'blue', r: 4.5, label: `max (n/e)ⁿ at x = n = ${n}`, labelPos: 'se', labelColor: 'blue', labelSize: 13 });
          R.text('(n+1)!/x', X * 0.97, lg(fact / (X * 0.97)), { align: 'right', baseline: 'bottom', dy: -5, color: 'orange', size: 15, math: true });
          const xr = X * 0.97;
          st = { x0, y0, N, EN: expPartial(x0, N), slope: (E(x0 + 1e-5) - E(x0 - 1e-5)) / 2e-5, prod: E(x0) * E(1) - E(x0 + 1), inv: E(x0) * E(-x0), n, tail: xr ** n * Math.exp(-xr), xr };
          v.legend([['ink', '$e^x=E(x)$'], ['gold', '$E_N(x)=\\sum_{k\\le N}x^k/k!$'], ['orange', 'tangent at $x$'], ['blue', '$x^ne^{-x}$'], ['orange', 'bound $(n+1)!/x$', { dash: true }], ...(showLog.value ? [['purple', '$\\log$', { dash: true }]] : [])]);
        });
        v.readout(() => {
          if (!st) return '';
          return `$x=${v.fix(st.x0, 3)}$: $e^x=${v.fix(st.y0, 5)}$, $E_{${st.N}}(x)=${v.fix(st.EN, 5)}$; numerical slope $${v.fix(st.slope, 5)}$ (= $e^x$). Checks: $e^xe^{-x}=${v.fix(st.inv, 12)}$, $\\;e^xe^1-e^{x+1}=${texNum(st.prod, 2)}$. At $x=${v.fix(st.xr, 1)}$: $x^{${st.n}}e^{-x}=${texNum(st.tail)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.7
    {
      num: '8.7',
      kind: 'Theorem',
      name: 'Periodicity of $E$; the definition of $\\pi$',
      statement: String.raw`Put $C(x)=\Re E(ix)$ and $S(x)=\Im E(ix)$ for real $x$, so that $E(ix)=C(x)+iS(x)$, $|E(ix)|=1$, $C'=-S$ and $S'=C$. The function $C$ has positive zeros; let $\pi$ be the number for which $\pi/2$ is the smallest of them. Then:
(a) $E$ is periodic with period $2\pi i$;
(b) $C$ and $S$ are periodic with period $2\pi$;
(c) if $0<t<2\pi$, then $E(it)\ne1$;
(d) if $|z|=1$, there is exactly one $t\in[0,2\pi)$ with $E(it)=z$.`,
      idea: String.raw`If $C$ had no positive zero, then $S'=C>0$ would make $S$ increasing, and $C(y)-C(x)=-\int_x^y S$ would force $C$ to become negative — a contradiction. With $C(\pi/2)=0$ and $C^2+S^2=1$ one gets $S(\pi/2)=1$ (as $S$ increases on $[0,\pi/2]$), so $E(\pi i/2)=i$, hence $E(\pi i)=-1$, $E(2\pi i)=1$ and $E(z+2\pi i)=E(z)$. For (c), (d) one studies the quadrants: on $(0,\pi/2)$ both $C$ and $S$ are positive and monotone, so $E(it)$ sweeps the first quarter circle exactly once (intermediate value theorem 4.23, monotonicity 5.11), and multiplication by $i$ handles the others.`,
      caption: String.raw`The point $t$ runs along the imaginary axis (left, laid flat) while $E(it)$ winds around the unit circle (right). $\pi/2$ is *defined* as the first zero of $C$; the green marks show $E(\pi i/2)=i$, $E(\pi i)=-1$ and the return $E(2\pi i)=1$. Drag the point on the circle to find its unique $t\in[0,2\pi)$; the readout confirms that the arc length travelled equals $t$.`,
      deps: ['pma-8.6', 'pma-4.23', 'pma-5.11'],
      see: ['rca-0.5', 'rca-0.6', 'rca-0.7'],
      tags: ['trigonometric functions', 'pi'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI;
        const C = (t) => expIt(t)[0], S = (t) => expIt(t)[1];
        const half = M.bisect(C, 1, 2, 1e-13);   // first positive zero of C, computed from the series
        const PER = 11, TMAX = 2 * TAU;
        const Lt = v.stage({ x: [-0.4, TMAX + 0.35], y: [-1.45, 1.55], height: 320, xlabel: 't', title: '$C(t)=\\Re E(it)$ and $S(t)=\\Im E(it)$' });
        const Ci = v.stage({ x: [-1.75, 1.75], y: [-1.4, 1.4], equal: true, axes: false, height: 320, title: '$E(it)$ on the unit circle' });
        const hz = Ci.handle(1, 0, { color: 'gold', r: 7, constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        hz.onDrag = (h) => { v.pause(); const ang = M.mod(Math.atan2(h.y, h.x), TAU); v.t = (ang / TMAX) * PER; };
        let st = null;
        v.animate((tt) => {
          const tau = (tt / PER) * TMAX;
          const [c, s] = expIt(tau);
          if (!hz.dragging) { hz.x = c; hz.y = s; }
          // left panel
          for (const [k, lab] of [[1, 'π/2'], [2, 'π'], [3, '3π/2'], [4, '2π'], [8, '4π']]) {
            const tk = k * half;
            Lt.vline(tk, { color: k === 1 || k === 4 || k === 8 ? 'green' : 'faint', width: k === 1 ? 1.8 : 1.2, dash: k === 1 ? null : [4, 4] });
            Lt.text(lab, tk, 1.5, { align: 'center', baseline: 'middle', color: k === 1 || k === 4 || k === 8 ? 'green' : 'muted', size: 12, weight: 600 });
          }
          Lt.fn(C, { domain: [-0.4, TMAX + 0.35], color: 'blue', width: 2.4 });
          Lt.fn(S, { domain: [-0.4, TMAX + 0.35], color: 'purple', width: 2.4 });
          Lt.dot(half, 0, { color: 'green', r: 5.5 });
          Lt.text('π/2 := first zero of C', half + 0.12, -1.3, { align: 'left', color: 'green', size: 11.5, weight: 600 });
          Lt.vband(0, tau, { color: 'gold', alpha: 0.08 });
          Lt.vline(tau, { color: 'gold', width: 2 });
          Lt.dot(tau, c, { color: 'blue', r: 5 }); Lt.dot(tau, s, { color: 'purple', r: 5 });
          // circle panel
          Ci.line(-1.3, 0, 1.3, 0, { color: 'faint', width: 1 }); Ci.line(0, -1.3, 0, 1.3, { color: 'faint', width: 1 });
          Ci.circle(0, 0, 1, { color: 'faint', width: 1.5 });
          const lap = Math.floor(tau / TAU + 1e-9);
          if (lap >= 1) Ci.curve((u) => expIt(u), 0, TAU, { color: 'gold', width: 5, alpha: 0.25, n: 240 });
          const t0 = lap * TAU;
          if (tau > t0 + 1e-6) Ci.curve((u) => expIt(u), t0, tau, { color: 'gold', width: 3.6, n: 240 });
          Ci.line(0, 0, c, s, { color: 'ink', width: 1.2 });
          Ci.line(c, 0, c, s, { color: 'purple', width: 2, dash: [3, 3] });
          Ci.line(0, 0, c, 0, { color: 'blue', width: 3 });
          for (const [k, lab, pos] of [[0, '1 = E(2πi)', 'se'], [1, 'i = E(πi/2)', 'ne'], [2, '−1 = E(πi)', 'nw'], [3, '−i = E(3πi/2)', 'se']]) {
            const [px, py] = expIt(k * half);
            Ci.dot(px, py, { color: 'green', r: 4, label: lab, labelPos: pos, labelColor: 'green' });
          }
          Ci.corner(lap >= 1 ? `lap ${lap + 1}: E(it) = E(i(t − 2π))` : `t = ${v.fix(tau, 3)}`, 'tl', { color: lap >= 1 ? 'green' : 'muted', weight: 600 });
          // arc length of t ↦ E(it) on [0, τ]
          let len = 0, prev = [1, 0]; const K = 500;
          for (let j = 1; j <= K; j++) { const p = expIt((tau * j) / K); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; }
          st = { tau, c, s, len, half };
          v.legend([['blue', '$C(t)$'], ['purple', '$S(t)$'], ['gold', 'path of $E(it)$'], ['green', '$\\pi/2$ and multiples', { dot: true }]]);
        }, { period: PER });
        v.readout(() => {
          if (!st) return '';
          const { tau, c, s, len, half } = st;
          return `$t=${v.fix(tau, 4)}$: $E(it)=${v.fix(c, 4)}${s < 0 ? '' : '+'}${v.fix(s, 4)}\\,i$, $|E(it)|=${v.fix(Math.hypot(c, s), 10)}$, arc length on $[0,t]$ $=${v.fix(len, 4)}$. First zero of $C$ (from the series): $\\pi/2=${v.fix(half, 10)}$, so $\\pi=${v.fix(2 * half, 10)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.8
    {
      num: '8.8',
      kind: 'Theorem',
      name: 'Fundamental theorem of algebra',
      credit: 'Gauss, 1799',
      statement: String.raw`Let $a_0,\dots,a_n$ be complex numbers with $n\ge1$ and $a_n\ne0$, and put $P(z)=\sum_{k=0}^n a_kz^k$. Then $P(z)=0$ for some complex number $z$.`,
      idea: String.raw`Let $\mu=\inf_{\C}|P|$. Since $|P(z)|\ge|z|^n\bigl(|a_n|-|a_{n-1}||z|^{-1}-\dots-|a_0||z|^{-n}\bigr)\to\infty$, the infimum is the infimum over a closed disc, where it is attained at some $z_0$ (4.16). If $P(z_0)\ne0$, write $P(z_0+w)/P(z_0)=1+b_kw^k+\dots+b_nw^n$ with $b_k\ne0$, and use 8.7(d) to pick $\theta$ with $e^{ik\theta}b_k=-|b_k|$. Then for small $r>0$, $|P(z_0+re^{i\theta})|/|P(z_0)|\le1-r^k\bigl(|b_k|-r|b_{k+1}|-\dots\bigr)<1$, contradicting minimality. So $\mu=|P(z_0)|=0$.`,
      caption: String.raw`Left: $\log|P|$ over the plane (dark = small; bands are level curves). Outside the orange circle $|P|>|P(0)|$, so the minimum lies in the disc. Drag $z_0$: the green arrows are the $k$ descent directions $e^{i\theta}$ from the proof, and the gold path repeats the proof's step until it lands on a root. Right: the surface $|P|$ over the disc, funnelling down to $0$ at each root.`,
      deps: ['pma-4.16', 'pma-8.7', 'pma-2.41'],
      tags: ['complex numbers', 'polynomials'],
      viz(v) {
        const M = v.M, { Cx } = v;
        const POLY = {
          a: { label: '$z^3-3z+3$', c: [3, -3, 0, 1] },
          b: { label: '$z^4+1$', c: [1, 0, 0, 0, 1] },
          c: { label: '$z^5-z+1$', c: [1, -1, 0, 0, 0, 1] },
        };
        const evalP = (c, z) => { let s = new Cx(0, 0); for (let k = c.length - 1; k >= 0; k--) s = s.mul(z).add(c[k]); return s; };
        const absP = (c, x, y) => { let re = 0, im = 0; for (let k = c.length - 1; k >= 0; k--) { const nr = re * x - im * y + c[k]; im = re * y + im * x; re = nr; } return Math.hypot(re, im); };
        // Taylor coefficients of P about z0 by repeated synthetic division
        function taylorAt(c, z0) {
          let a = c.map((t) => Cx.of(t)); const out = [];
          while (a.length) { const m = a.length - 1, q = new Array(m); let acc = a[m]; for (let k = m - 1; k >= 0; k--) { q[k] = acc; acc = a[k].add(acc.mul(z0)); } out.push(acc); a = q; }
          return out;
        }
        // one step of the proof: move along e^{iθ} with e^{ikθ} b_k = −|b_k|
        function step(c, z) {
          const d = taylorAt(c, z), A = d[0].abs(); if (A < 1e-13) return null;
          let k = 1; while (k < d.length - 1 && d[k].abs() < 1e-12 * A) k++;
          const bk = d[k].div(d[0]); const theta = (Math.PI - bk.arg()) / k;
          let r = Math.pow(0.5 / bk.abs(), 1 / k), z1 = z;
          for (let it = 0; it < 50; it++) { z1 = z.add(Cx.polar(r, theta)); if (evalP(c, z1).abs() < A) break; r /= 2; }
          return { z1, k, theta, bk };
        }
        function descend(c, z, n = 90) { const path = [z]; for (let i = 0; i < n; i++) { const s = step(c, z); if (!s) break; z = s.z1; path.push(z); } return path; }
        const which = v.select('$P(z)=$', Object.entries(POLY).map(([value, o]) => ({ value, label: o.label })), 'a');
        const Lp = v.stage({ x: [-2.5, 2.5], y: [-2.1, 2.1], equal: true, height: 360, title: '$\\log|P|$ in the plane, and the descent from $z_0$' });
        const S3 = v.stage3d({ range: 2.6, height: 360, yaw: -0.75, pitch: 0.55, labels: ['Re z', 'Im z', '|P|'], title: 'the surface $|P(z)|$ over the disc' });
        const hz = Lp.handle(0.2, 1.3, { color: 'gold', label: 'z₀' });
        v.button('put $z_0$ at a critical point ($k\\ge2$)', () => {
          const c = POLY[which.value].c; const dc = c.slice(1).map((a, i) => a * (i + 1));
          let best = null;
          for (const s of [[1, 0.3], [-1, 0.3], [0.2, 1], [0.2, -1], [0, 0.1]]) { const p = descend(dc, new Cx(s[0], s[1]), 120); const z = p[p.length - 1]; if (evalP(dc, z).abs() < 1e-8 && evalP(c, z).abs() > 1e-6 && (!best || z.abs() < best.abs())) best = z; }
          if (best) hz.set(best.re, best.im);
        });
        let last = null, cache = null, st = null;
        v.render(() => {
          const o = POLY[which.value], c = o.c;
          if (last !== which.value) {
            last = which.value;
            // roots (descent from many starts) and R0 with |P| > |P(0)| outside the disc
            const roots = [];
            for (let j = 0; j < 24; j++) { const p = descend(c, Cx.polar(2.2, (j * 2 * Math.PI) / 24 + 0.1), 200); const z = p[p.length - 1]; if (evalP(c, z).abs() < 1e-8 && !roots.some((w) => w.sub(z).abs() < 1e-5)) roots.push(z); }
            const P0 = Math.abs(c[0]); let R0 = 0;
            for (let r = 3; r > 0; r -= 0.005) { let mn = Infinity; for (let j = 0; j < 180; j++) mn = Math.min(mn, absP(c, r * Math.cos((j * 2 * Math.PI) / 180), r * Math.sin((j * 2 * Math.PI) / 180))); if (mn <= P0) { R0 = r + 0.005; break; } }
            cache = { roots, R0 };
          }
          const { roots, R0 } = cache;
          const lo = -1.6, hi = 1.6;
          Lp.raster((x, y) => {
            const L = Math.log10(absP(c, x, y) + 1e-12); const t = (M.clamp(L, lo, hi) - lo) / (hi - lo);
            const col = M.cmap(t, 'viridis'); const band = 0.86 + 0.14 * Math.abs(2 * M.fract(L * 3) - 1);
            return [col[0] * band, col[1] * band, col[2] * band];
          }, { key: which.value, res: 2 });
          Lp.circle(0, 0, R0, { color: 'orange', width: 2, dash: [6, 4] });
                    const z0 = new Cx(hz.x, hz.y);
          const path = descend(c, z0);
          const s0 = step(c, z0);
          if (s0) for (let j = 0; j < s0.k; j++) { const th = s0.theta + (2 * Math.PI * j) / s0.k; Lp.arrow(z0.re, z0.im, z0.re + 0.45 * Math.cos(th), z0.im + 0.45 * Math.sin(th), { color: 'green', width: 2.6, head: 9 }); }
          Lp.path(path.map((z) => [z.re, z.im]), { color: 'panel', width: 4.5 });
          Lp.path(path.map((z) => [z.re, z.im]), { color: 'gold', width: 2.2 });
          Lp.dots(path.slice(1, 25).map((z) => [z.re, z.im]), { color: 'gold', r: 2.4 });
          for (const r of roots) Lp.dot(r.re, r.im, { color: 'green', r: 4.5 });
          const end = path[path.length - 1];
          // 3D surface of |P| over the disc of radius Rd
          const Rd = 2.1, cap = 6, zs = 1.6 / cap, hgt = (x, y) => Math.min(absP(c, x, y), cap) * zs;
          S3.surface((u, w) => { const x = u * Math.cos(w), y = u * Math.sin(w); return [x, y, hgt(x, y)]; }, [0, Rd], [0, 2 * Math.PI], { nu: 30, nv: 56, alpha: 0.82, colorFn: (u, w, p) => v.mix('green', 'blue', Math.min(1, p[2] / 1.6)) });
          S3.path(path.map((z) => [z.re, z.im, hgt(z.re, z.im) + 0.03]), { color: 'gold', width: 3, bias: -0.5 });
          S3.dot([z0.re, z0.im, hgt(z0.re, z0.im) + 0.03], { color: 'gold', r: 5.5, bias: -0.6 });
          for (const r of roots) S3.dot([r.re, r.im, 0], { color: 'green', r: 5, bias: -0.6 });
          st = { A: evalP(c, z0).abs(), k: s0 ? s0.k : 0, after: s0 ? evalP(c, s0.z1).abs() : 0, end, endA: evalP(c, end).abs(), steps: path.length - 1, R0, nr: roots.length };
          v.legend([['green', 'roots of $P$', { dot: true }], ['gold', 'descent path from $z_0$'], ['green', 'directions $e^{i\\theta}$ with $e^{ik\\theta}b_k=-|b_k|$'], ['orange', '$|z|=R_0$: outside it $|P|>|P(0)|$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          if (st.A < 1e-9) return `$z_0$ is a root: $P(z_0)=0$.`;
          return `$|P(z_0)|=${texNum(st.A)}$; the first nonzero Taylor coefficient at $z_0$ has order $k=${st.k}$, and one step lowers $|P|$ to $${texNum(st.after)}$. After ${st.steps} steps: $z=${v.fix(st.end.re, 5)}${st.end.im < 0 ? '' : '+'}${v.fix(st.end.im, 5)}\\,i$ with $|P(z)|=${texNum(st.endA, 2)}$. A minimum of $|P|$ can only sit at a root; $P$ has ${st.nr} distinct roots, all inside $|z|<R_0=${v.fix(st.R0, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.9
    {
      num: '8.9',
      kind: 'Definition',
      name: 'Trigonometric polynomials and series',
      statement: String.raw`A **trigonometric polynomial** is a finite sum $f(x)=a_0+\sum_{n=1}^N(a_n\cos nx+b_n\sin nx)$ ($x$ real, $a_n,b_n$ complex). By the Euler formulas it can be written as
$$f(x)=\sum_{n=-N}^{N}c_ne^{inx},$$
and every trigonometric polynomial has period $2\pi$. Because $\frac1{2\pi}\int_{-\pi}^{\pi}e^{inx}\,dx$ is $1$ for $n=0$ and $0$ otherwise, the coefficients are recovered by $c_m=\frac1{2\pi}\int_{-\pi}^{\pi}f(x)e^{-imx}\,dx$ for $|m|\le N$; and $f$ is real-valued exactly when $c_{-n}=\overline{c_n}$ for all $n$. A **trigonometric series** is a series $\sum_{-\infty}^{\infty}c_ne^{inx}$, its $N$-th partial sum being the sum over $|n|\le N$.`,
      idea: String.raw`The coefficient formula is orthogonality: multiply $f$ by $e^{-imx}$ and integrate term by term; every term with $n\ne m$ integrates to $0$ over a full period.`,
      caption: String.raw`Drag the coefficients $c_1,c_2$ (blue, purple) and $c_{-1},c_{-2}$ (teal, pink) in the complex plane and set $c_0$. With "real-valued" on, the negative-index coefficients are tied to the conjugates of the positive ones and $f$ is real; switch it off and an imaginary part appears. The readout recomputes every $c_m$ from $f$ by numerical integration.`,
      deps: ['pma-8.7'],
      see: ['rca-4.23'],
      tags: ['Fourier series', 'trigonometric polynomials'],
      viz(v) {
        const M = v.M;
        const real = v.toggle('real-valued: $c_{-n}=\\overline{c_n}$', true);
        const c0 = v.slider('$c_0$', -1, 1, 0.2, { step: 0.01 });
        const F = v.stage({ x: [-Math.PI, Math.PI], y: [-3, 3], height: 320, xlabel: 'x', title: '$f(x)=\\sum_{|n|\\le2}c_ne^{inx}$ on $[-\\pi,\\pi]$',
          xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']] });
        const Cp = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, ticks: false, height: 320, title: 'coefficients $c_n$ in $\\mathbb{C}$ (unit circle for scale)' });
        const h1 = Cp.handle(0.55, 0.35, { color: 'blue', label: 'c₁' });
        const h2 = Cp.handle(-0.2, 0.45, { color: 'purple', label: 'c₂' });
        const m1 = Cp.handle(0.55, -0.35, { color: 'teal', r: 6, label: 'c₋₁' });
        const m2 = Cp.handle(-0.2, -0.45, { color: 'pink', r: 6, label: 'c₋₂' });
        const tie = () => { if (real.value) { m1.x = h1.x; m1.y = -h1.y; m2.x = h2.x; m2.y = -h2.y; } };
        h1.onDrag = tie; h2.onDrag = tie;
        m1.onDrag = () => { if (real.value) { h1.x = m1.x; h1.y = -m1.y; } };
        m2.onDrag = () => { if (real.value) { h2.x = m2.x; h2.y = -m2.y; } };
        let st = null;
        v.render(() => {
          tie();
          const cs = { [-2]: [m2.x, m2.y], [-1]: [m1.x, m1.y], 0: [c0.value, 0], 1: [h1.x, h1.y], 2: [h2.x, h2.y] };
          const f = (x) => { let re = 0, im = 0; for (let n = -2; n <= 2; n++) { const [a, b] = cs[n], cn = Math.cos(n * x), sn = Math.sin(n * x); re += a * cn - b * sn; im += a * sn + b * cn; } return [re, im]; };
          // recover coefficients numerically
          const rec = {}; const K = 512;
          for (let m = -3; m <= 3; m++) { let re = 0, im = 0; for (let j = 0; j < K; j++) { const x = -Math.PI + (2 * Math.PI * (j + 0.5)) / K, [fr, fi] = f(x), c = Math.cos(m * x), s = Math.sin(m * x); re += fr * c + fi * s; im += fi * c - fr * s; } rec[m] = [re / K, im / K]; }
          const imMax = Math.max(...M.linspace(-Math.PI, Math.PI, 200).map((x) => Math.abs(f(x)[1])));
          F.hline(0, { color: 'faint', width: 1 });
          F.fn((x) => f(x)[1], { color: 'orange', width: 2, dash: [6, 4] });
          F.fn((x) => f(x)[0], { color: 'blue', width: 2.6 });
          F.vline(-Math.PI, { color: 'muted', dash: [2, 4], width: 1 }); F.vline(Math.PI, { color: 'muted', dash: [2, 4], width: 1 });
          Cp.circle(0, 0, 1, { color: 'faint', width: 1 });
          Cp.line(-1.25, 0, 1.25, 0, { color: 'faint', width: 1 });
          if (real.value) { Cp.line(h1.x, h1.y, m1.x, m1.y, { color: 'muted', dash: [2, 3], width: 1 }); Cp.line(h2.x, h2.y, m2.x, m2.y, { color: 'muted', dash: [2, 3], width: 1 }); }
          Cp.dot(c0.value, 0, { color: 'ink', r: 5, label: 'c₀', labelPos: 's' });
          st = { rec, imMax };
          v.legend([['blue', '$\\Re f$'], ['orange', '$\\Im f$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const z = (p) => `${v.fix(p[0], 2)}${p[1] < 0 ? '-' : '+'}${v.fix(Math.abs(p[1]), 2)}i`;
          const list = [-2, -1, 0, 1, 2].map((m) => `c_{${m}}=${z(st.rec[m])}`).join(',\\;');
          return `From $\\frac1{2\\pi}\\int f(x)e^{-imx}dx$: $${list}$, and $c_{\\pm3}=${v.fix(Math.hypot(...st.rec[3]), 3)}$. $\\max|\\Im f|=${v.fix(st.imMax, 3)}$` + (st.imMax < 1e-9 ? ' — $f$ is real.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 8.10
    {
      num: '8.10',
      kind: 'Definition',
      name: 'Orthonormal systems and Fourier coefficients',
      statement: String.raw`A sequence $\{\phi_n\}$ of complex functions on $[a,b]$ is an **orthogonal system** if $\int_a^b\phi_n\overline{\phi_m}\,dx=0$ whenever $n\ne m$, and **orthonormal** if in addition $\int_a^b|\phi_n|^2dx=1$ for all $n$. For example, $\{(2\pi)^{-1/2}e^{inx}\}$ is orthonormal on $[-\pi,\pi]$. If $\{\phi_n\}$ is orthonormal and
$$c_n=\int_a^b f(t)\overline{\phi_n(t)}\,dt,$$
then $c_n$ is the $n$-th **Fourier coefficient** of $f$ relative to $\{\phi_n\}$, and one writes $f(x)\sim\sum c_n\phi_n(x)$, the **Fourier series** of $f$ (with no claim of convergence).`,
      idea: String.raw`Orthonormality makes the coefficient of $\phi_n$ in a finite combination $\sum\gamma_m\phi_m$ equal to its inner product with $\phi_n$; Fourier coefficients extend this recipe to arbitrary $f$, and Theorems 8.11–8.12 explain why it is the right one.`,
      caption: String.raw`The grid shows the Gram matrix $\bigl(\int_a^b\phi_n\overline{\phi_m}\bigr)_{n,m}$ of eight functions, computed by numerical integration: an orthonormal system gives the identity. The monomials $1,x,\dots,x^7$ on $[0,1]$ are far from orthogonal; switch on Gram–Schmidt to turn them into an orthonormal system (shifted Legendre polynomials).`,
      deps: ['pma-6.1'],
      see: ['rca-4.13'],
      tags: ['Fourier series', 'orthonormal systems'],
      viz(v) {
        const M = v.M;
        const NS = 8, K = 1200;
        const legendre = (n, x) => { let p0 = 1, p1 = x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const p2 = ((2 * k + 1) * x * p1 - k * p0) / (k + 1); p0 = p1; p1 = p2; } return p1; };
        const SYS = {
          trig: { label: '$e^{inx}/\\sqrt{2\\pi}$ on $[-\\pi,\\pi]$', a: -Math.PI, b: Math.PI, f: (k, x) => { const n = k - 3; return [Math.cos(n * x) / Math.sqrt(2 * Math.PI), Math.sin(n * x) / Math.sqrt(2 * Math.PI)]; }, names: (k) => `n=${k - 3}` },
          leg: { label: 'Legendre on $[-1,1]$', a: -1, b: 1, f: (k, x) => [Math.sqrt((2 * k + 1) / 2) * legendre(k, x), 0], names: (k) => `P${k}` },
          mono: { label: '$x^n$ on $[0,1]$', a: 0, b: 1, f: (k, x) => [x ** k, 0], names: (k) => `x${'⁰¹²³⁴⁵⁶⁷'[k]}` },
        };
        const which = v.select('', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'mono');
        const gs = v.toggle('apply Gram–Schmidt', false);
        const G = v.stage({ x: [-0.6, NS + 0.1], y: [-NS - 0.1, 0.6], equal: true, axes: false, height: 340, title: 'Gram matrix $\\int_a^b\\phi_n\\overline{\\phi_m}\\,dx$' });
        const P = v.stage({ x: [0, 1], y: [-3, 3], height: 340, axes: true, title: 'the first four functions (real parts)' });
        const cache = {};
        function system(key, ortho) {
          const id = key + ortho; if (cache[id]) return cache[id];
          const o = SYS[key], xs = M.linspace(o.a, o.b, K + 1), h = (o.b - o.a) / K;
          const w = xs.map((_, j) => (j === 0 || j === K ? 1 : j % 2 ? 4 : 2) * h / 3);   // Simpson weights
          // complex functions as [re..., im...] concatenated sample vectors
          let vecs = M.range(NS).map((k) => { const re = [], im = []; for (const x of xs) { const [a, b] = o.f(k, x); re.push(a); im.push(b); } return re.concat(im); });
          const ipRe = (u, z) => { let s = 0; for (let j = 0; j <= K; j++) s += w[j] * (u[j] * z[j] + u[j + K + 1] * z[j + K + 1]); return s; };
          const ipIm = (u, z) => { let s = 0; for (let j = 0; j <= K; j++) s += w[j] * (u[j + K + 1] * z[j] - u[j] * z[j + K + 1]); return s; };
          if (ortho) vecs = M.gramSchmidt(vecs, ipRe);   // all systems here are real when Gram–Schmidt is used
          const gram = vecs.map((u) => vecs.map((z) => Math.hypot(ipRe(u, z), ipIm(u, z))));
          return (cache[id] = { xs, vecs, gram });
        }
        let st = null;
        v.render(() => {
          const o = SYS[which.value], sys = system(which.value, gs.value && which.value === 'mono');
          for (let n = 0; n < NS; n++) for (let m = 0; m < NS; m++) {
            const g = sys.gram[n][m], diag = n === m;
            const bad = diag ? Math.abs(g - 1) > 1e-6 : g > 1e-6;
            G.rect(m + 0.04, -n - 0.04, m + 0.96, -n - 0.96, { fill: bad ? 'red' : diag ? 'green' : 'blue', fillAlpha: bad ? 0.12 + 0.6 * Math.min(1, diag ? Math.abs(g - 1) : g) : diag ? 0.55 : 0.05, color: 'grid', width: 1 });
            G.text(g < 5e-4 ? '0' : v.fmt(g, 2).replace(/^0\./, '.'), m + 0.5, -n - 0.5, { align: 'center', size: 10, color: 'ink', weight: diag ? 600 : 500 });
          }
          for (let k = 0; k < NS; k++) { const lab = gs.value && which.value === 'mono' ? `φ${k}` : o.names(k); G.text(lab, k + 0.5, 0.25, { align: 'center', size: 9.5, color: 'muted' }); G.text(lab, -0.08, -k - 0.5, { align: 'right', size: 9.5, color: 'muted' }); }
          P.setView([o.a, o.b], which.value === 'trig' ? [-0.5, 0.5] : [-3.2, 3.2]);
          const cols = ['blue', 'orange', 'purple', 'teal'];
          for (let k = 0; k < 4; k++) P.path(sys.xs.map((x, j) => [x, sys.vecs[k][j]]), { color: cols[k], width: 2.2 });
          let off = 0, dev = 0; for (let n = 0; n < NS; n++) for (let m = 0; m < NS; m++) { if (n === m) dev = Math.max(dev, Math.abs(sys.gram[n][n] - 1)); else off = Math.max(off, sys.gram[n][m]); }
          st = { off, dev };
          v.legend([['green', 'diagonal $=1$', { area: true }], ['red', 'deviation from the identity', { area: true }], ...cols.map((c, k) => [c, `$\\phi_${k}$`])]);
        });
        v.readout(() => st && (`max off-diagonal $|\\int\\phi_n\\overline{\\phi_m}|=${texNum(st.off, 2)}$, max $|\\int|\\phi_n|^2-1|=${texNum(st.dev, 2)}$` + (st.off < 1e-6 && st.dev < 1e-6 ? ' — an orthonormal system.' : ' — not orthonormal.')));
      },
    },
  ],
};
