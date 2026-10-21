// Rudin, Functional Analysis — Chapter 13 (part 4): maximal symmetric operators, Ψ(f) for unbounded f,
// change of measure, the spectral theorem for normal operators, and more on semigroups
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const cconj = (a) => [a[0], -a[1]];
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : k === 1 ? '10' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
const decTicks = (lo, hi, step = 1) => { const t = []; for (let k = Math.ceil(lo / step) * step; k <= Math.floor(hi); k += step) t.push([k, p10(k)]); return t; };
const bump = (x, c, r) => { const t = (x - c) / r, s = 1 - t * t; return s > 0 ? Math.E * Math.exp(-1 / s) : 0; };
/** In-place radix-2 FFT, forward sign e^{−2πi jk/n}. */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
/** Operator norm of a complex 2×2 matrix [[a, b], [c, d]] (largest singular value). */
function norm22(a, b, c, d) {
  const p = cabs(a) ** 2 + cabs(c) ** 2, q = cabs(b) ** 2 + cabs(d) ** 2, r = cadd(cmul(cconj(a), b), cmul(cconj(c), d));
  return Math.sqrt((p + q) / 2 + Math.sqrt(((p - q) / 2) ** 2 + cabs(r) ** 2));
}

export default {
  collection: 'fa',
  chapter: 13,
  items: [
    // ------------------------------------------------------------------ 13.21
    {
      num: '13.21',
      kind: 'Theorem',
      name: 'Maximal symmetric operators',
      statement: String.raw`Let $T$ be closed, symmetric and densely defined, with deficiency indices $n_\pm$ (13.20). Then $T$ has no proper symmetric extension — it is **maximal symmetric** — if and only if $n_+=0$ or $n_-=0$. If $n_+\ne n_-$, then $T$ has no self-adjoint extension. Example: $T=-i\,d/dx$ on $\{f\in L^2(0,\infty):f\text{ absolutely continuous},\,f'\in L^2,\,f(0)=0\}$ has $(n_+,n_-)=(1,0)$: it is maximal symmetric but not self-adjoint.`,
      idea: String.raw`Symmetric extensions of $T$ correspond to isometric extensions of its Cayley transform $U$ (13.19). $U$ maps $\mathscr R(T+iI)$ onto $\mathscr R(T-iI)$, and the orthogonal complements have dimensions $n_+$ and $n_-$. An isometry can be enlarged exactly when both complements are nonzero: map a vector of one onto a vector of the other. A unitary extension, which is what self-adjointness requires, must map one complement onto the other, so it needs $n_+=n_-$. In the example $\mathscr N(T^*-i)$ is spanned by $e^{-x}$, while $e^{x}\notin L^2$.`,
      caption: String.raw`What the missing self-adjoint extension would have to do. $-iT$ generates the right shifts $V_tf(x)=f(x-t)$ ($t\ge0$) on $L^2(0,\infty)$, which are isometries. A self-adjoint extension $A$ would give a unitary group $e^{-itA}$ (Stone, 13.38) that could also be run backwards. Drag $t$ below $0$: shifting left pushes part of $f$ (red) through the boundary point $0$, and the norm drops (bottom). No boundary condition at $0$ can repair this, because the deficiency is one-sided.`,
      deps: ['fa-13.20', 'fa-13.19'],
      tags: ['symmetric operators', 'deficiency indices', 'self-adjoint extensions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const tS = v.slider('$t$', -4, 4, -0.8, { step: 0.01 });
        const cS = v.slider('centre of $f$', 0.6, 4, 1.3, { step: 0.01 });
        const T = v.stage({ x: [-3, 9], y: [-0.25, 1.3], height: 240, full: true, axes: true, title: '$f$ (faint) and its shift $f(x-t)$ restricted to $(0,\\infty)$' });
        const B = v.stage({ x: [-4, 4], y: [0, 1.15], height: 190, full: true, axes: 'box', xlabel: 't', title: '$\\|V_tf\\|/\\|f\\|$: isometric for $t\\ge0$, lossy for $t<0$' });
        let st = {};
        v.legend([['blue', 'shifted $f$ on $(0,\\infty)$'], ['red', 'pushed through $0$ and lost'], ['green', 'deficiency vector $e^{-x}$']]);
        v.render(() => {
          const t = tS.value, c = cS.value, r = 0.9;
          const f = (x) => (x > 0 ? bump(x, c, r) : 0);
          const nf = M.integrate((x) => f(x) ** 2, 0, c + r + 0.01, 800);
          T.vband(-3, 0, { color: 'muted', alpha: 0.1 });
          T.vline(0, { color: 'ink', width: 2 });
          T.fn((x) => Math.exp(-x) * 0.6, { domain: [0, 9], color: 'green', width: 1.4, dash: [5, 4] });
          T.fn(f, { color: 'blue', width: 1.4, alpha: 0.35, domain: [0, 9] });
          T.fn((x) => bump(x - t, c, r), { domain: [0, 9], color: 'blue', width: 2.6, fill: 'blue', fillAlpha: 0.15, n: 700 });
          if (t < 0) T.fn((x) => bump(x - t, c, r), { domain: [-3, 0], color: 'red', width: 2.6, fill: 'red', fillAlpha: 0.15, n: 300 });
          const ratio = (s) => Math.sqrt(M.integrate((x) => bump(x - s, c, r) ** 2, Math.max(0, c + s - r), Math.max(0, c + s + r), 400) / nf);
          const ts = M.linspace(-4, 4, 161);
          B.path(ts.map((s) => [s, ratio(s)]), { color: 'ink', width: 2.4 });
          B.hline(1, { color: 'green', width: 1.2, dash: [5, 4] });
          B.dot(t, ratio(t), { color: t < 0 ? 'red' : 'blue', r: 5 });
          st = { t, rt: ratio(t) };
        });
        v.readout(() => `$\\|V_tf\\|/\\|f\\|=${v.fix(st.rt, 4)}$ at $t=${v.fix(st.t, 2)}$. The deficiency spaces: $\\mathscr N(T^*-i)=\\operatorname{span}\\{e^{-x}\\}$ ($n_+=1$), while $e^{x}\\notin L^2(0,\\infty)$ ($n_-=0$). The Cayley transform cannot be extended at all, let alone to a unitary.`);
      },
    },
    // ------------------------------------------------------------------ 13.24
    {
      num: '13.24',
      kind: 'Theorem',
      name: 'Ψ(f) = ∫ f dE for unbounded f',
      statement: String.raw`Let $E$ be a resolution of the identity on $(\Omega,\mathfrak M)$ in $H$, $f:\Omega\to\C$ measurable, and
$$\mathscr D_f=\Big\{x\in H:\int_\Omega|f|^2dE_{x,x}<\infty\Big\}.$$
Then $\mathscr D_f$ is dense, and there is a unique closed normal operator $\Psi(f)$ with domain $\mathscr D_f$ such that $(\Psi(f)x,y)=\int_\Omega f\,dE_{x,y}$ for $x\in\mathscr D_f$, $y\in H$. Moreover:
(a) $\norm{\Psi(f)x}^2=\int|f|^2dE_{x,x}$ for $x\in\mathscr D_f$;
(b) $\Psi(f)^*=\Psi(\bar f)$;
(c) $\Psi(f)\Psi(g)\subset\Psi(fg)$, with $\mathscr D(\Psi(f)\Psi(g))=\mathscr D_g\cap\mathscr D_{fg}$, so the two are equal when $\mathscr D_{fg}\subset\mathscr D_g$;
(d) $\Psi(f)+\Psi(g)\subset\Psi(f+g)$.`,
      idea: String.raw`Truncate: on $\omega_n=\{|f|<n\}$ the function $f_n=f\chi_{\omega_n}$ is bounded, and $\Psi(f_n)$ is the bounded operator of 12.21. For $x\in\mathscr D_f$, $\norm{\Psi(f_n)x-\Psi(f_m)x}^2=\int_{\omega_n\setminus\omega_m}|f|^2dE_{x,x}\to0$, so $\Psi(f)x=\lim\Psi(f_n)x$ exists. $\mathscr D_f$ contains every range $E(\omega_n)H$, and these exhaust a dense set because $E(\omega_n)\to I$ strongly. The identities hold for the $f_n$ and pass to the limit. In (c), $x\in\mathscr D(\Psi(f)\Psi(g))$ means $x\in\mathscr D_g$ and $\Psi(g)x\in\mathscr D_f$, and $\int|f|^2dE_{\Psi(g)x,\Psi(g)x}=\int|fg|^2dE_{x,x}$. Closedness and normality follow from (a) and (b).`,
      caption: String.raw`Take for $E$ the resolution of the identity of multiplication by $x$ on $L^2(\R)$, where $E(\omega)$ multiplies by $\chi_\omega$. Then $\Psi(f)$ is multiplication by $f(x)$ and $\mathscr D_f=\{h:fh\in L^2\}$. For $h=(1+x^2)^{-\alpha}$, membership is a decay condition: $x^kh\in L^2$ iff $\alpha>\frac k2+\frac14$. Left: $x\,|x^kh(x)|^2$ on log–log axes; $x^kh\in L^2$ exactly when the curve eventually goes down (green). Right: the domains in (c) and (d), as sets of exponents $\alpha$, for $f=x$ and $g=x^2$. $\Psi(g)+\Psi(-g)$ lives only on $\mathscr D_g$, while $\Psi(g-g)=0$ is defined everywhere, so (d) is a strict inclusion. $\Psi(f)\Psi(g)$ lives on $\mathscr D_g\cap\mathscr D_{fg}=\mathscr D_{x^3}$.`,
      deps: ['fa-12.17', 'fa-12.21', 'fa-12.24', 'fa-13.3'],
      tags: ['resolution of the identity', 'functional calculus', 'unbounded operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('decay exponent $\\alpha$ of $h=(1+x^2)^{-\\alpha}$', 0.3, 2.5, 1.1, { step: 0.01 });
        const A = v.stage({ x: [0, 4], y: [-8, 8], height: 330, axes: 'box', xticks: decTicks(0, 4), xlabel: 'x', title: '$x\\,|x^kh(x)|^2$, $k=0,1,2,3$ (log–log)' });
        const B = v.stage({ x: [0.3, 2.5], y: [-0.6, 6.6], height: 330, axes: 'box', xlabel: 'α', yticks: [], xticks: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5].map((t) => [t, String(t)]), title: 'domains as sets of exponents $\\alpha$' });
        const rows = [
          ['\\mathscr D_f\\;(f=x)', 0.75],
          ['\\mathscr D_g\\;(g=x^2)', 1.25],
          ['\\mathscr D(\\Psi(g)+\\Psi(-g))=\\mathscr D_g', 1.25],
          ['\\mathscr D(\\Psi(g-g))=\\mathscr D(\\Psi(0))=H', 0.25],
          ['\\mathscr D(\\Psi(f)\\Psi(g))=\\mathscr D_g\\cap\\mathscr D_{fg}', 1.75],
          ['\\mathscr D_{fg}\\;(fg=x^3)', 1.75],
        ];
        let st = {};
        v.legend([['green', '$x^kh\\in L^2$'], ['red', '$x^kh\\notin L^2$'], ['muted', 'slope $0$ (the borderline)', { dash: true }]]);
        v.render(() => {
          const a = aS.value, ts = M.linspace(0, 4, 201);
          const curves = [0, 1, 2, 3].map((k) => ts.map((t) => [t, t + 2 * k * t - 2 * a * Math.log10(1 + 10 ** (2 * t))]));
          A.setView(null, span(curves.flat().map((p) => p[1]), 4, 0.06));
          A.setTicks(decTicks(0, 4), decTicks(...A.bounds.y, 2));
          A.hline(curves[0][0][1], { color: 'muted', width: 1, dash: [5, 4] });
          curves.forEach((c, k) => {
            const ok = 1 + 2 * k - 4 * a < 0;
            A.path(c, { color: ok ? 'green' : 'red', width: 2.4 });
            A.text(`k=${k}`, 3.95, c[c.length - 1][1], { color: ok ? 'green' : 'red', size: 12, align: 'right', dy: -10 });
          });
          rows.forEach(([lab, th], i) => {
            const y = 6 - i * 1.15, inn = a > th;
            B.line(th, y, 2.5, y, { color: inn ? 'green' : 'muted', width: 9, alpha: inn ? 0.75 : 0.35 });
            B.dot(th, y, { color: inn ? 'green' : 'muted', r: 5, hollow: true });
            B.tex(lab, 0.33, y + 0.42, { color: 'ink', size: 13, align: 'left' });
          });
          B.vline(a, { color: 'blue', width: 2 });
          st = { a };
        });
        v.readout(() => {
          const a = st.a;
          const sum = a > 1.25 ? '$h\\in\\mathscr D_g$, and $\\Psi(g)h+\\Psi(-g)h=0=\\Psi(0)h$.' : '**$h\\notin\\mathscr D(\\Psi(g)+\\Psi(-g))$**, although $\\Psi(g-g)=0$ is defined at $h$: the inclusion $\\Psi(f)+\\Psi(g)\\subset\\Psi(f+g)$ is strict.';
          const prod = a > 1.75 ? ' $h\\in\\mathscr D(\\Psi(f)\\Psi(g))=\\mathscr D_{fg}$, and $\\Psi(f)\\Psi(g)h=\\Psi(fg)h=x^3h$.' : ' $h\\notin\\mathscr D_{fg}$, so neither $\\Psi(f)\\Psi(g)$ nor $\\Psi(fg)$ is defined at $h$; here $\\mathscr D_{fg}\\subset\\mathscr D_g$, so they are equal.';
          return `$\\alpha=${v.fix(a, 2)}$: ` + sum + prod;
        });
      },
    },
    // ------------------------------------------------------------------ 13.28
    {
      num: '13.28',
      kind: 'Theorem',
      name: 'Change of measure for resolutions of the identity',
      statement: String.raw`Let $E$ be a resolution of the identity on a measurable space $(\Omega,\mathfrak M)$ and $\varphi:\Omega\to\Omega'$ a measurable map into $(\Omega',\mathfrak M')$. Then
$$E'(\omega')=E\big(\varphi^{-1}(\omega')\big)\qquad(\omega'\in\mathfrak M')$$
is a resolution of the identity on $\Omega'$, and
$$\int_{\Omega'}f\,dE'=\int_\Omega(f\circ\varphi)\,dE$$
for every bounded measurable $f$ on $\Omega'$; for unbounded $f$ the two operators have the same domain and agree. In particular, if $T=\int\lambda\,dE(\lambda)$, then $\varphi(T)=\int\mu\,dE'(\mu)$: the spectral measure of $\varphi(T)$ is the image of that of $T$.`,
      idea: String.raw`$\omega'\mapsto\varphi^{-1}(\omega')$ preserves complements, intersections and countable unions, so every defining property of a resolution of the identity passes from $E$ to $E'$. For each $x,y$, $E'_{x,y}$ is the image of the complex measure $E_{x,y}$ under $\varphi$, so $\int f\,dE'_{x,y}=\int f\circ\varphi\,dE_{x,y}$. The operator identity follows because both sides are characterised by these scalar integrals (12.21); unbounded $f$ are handled by truncation.`,
      caption: String.raw`$T=-d^2/dx^2$ on $[0,\pi]$ with Dirichlet conditions: $E_{x,x}$ puts mass $|c_k|^2$ at $\lambda=k^2$ (top row, positions $\sqrt\lambda=k$). Choose $\varphi$. The bottom row is the image measure $E'_{x,x}$, on the $\mu$-axis: each atom moves to $\varphi(k^2)$, and atoms that land on the same point merge. Faint lines show where each atom goes. The readout checks $\int\mu\,dE'_{x,x}=\int\varphi\,dE_{x,x}=(\varphi(T)x,x)$ and the same with $\mu^2$.`,
      deps: ['fa-12.17', 'fa-12.21'],
      tags: ['resolution of the identity', 'spectral theorem', 'functional calculus'],
      verify: true,
      viz(v) {
        const M = v.M;
        const phiS = v.select('$\\varphi(\\lambda)=$', [{ value: 'cos', label: '$\\cos(s\\sqrt\\lambda)$' }, { value: 'heat', label: '$e^{-s\\lambda}$' }, { value: 'mod', label: '$\\sqrt\\lambda\\bmod s$' }], 'cos');
        const sS = v.slider('$s/\\pi$', 0.02, 1.3, 0.5, { step: 0.01 });
        const xS = v.select('$x=$', [{ value: 'tent', label: 'tent' }, { value: 'step', label: 'step' }, { value: 'mix', label: '$\\sin x+\\frac12\\sin3x+\\dots$' }], 'step');
        const S = v.stage({ x: [-0.06, 1.06], y: [-0.25, 2.3], height: 380, axes: false, ticks: false, title: '$E_{x,x}$ on $\\sigma(T)$ (top) and its image $E\'_{x,x}=E_{x,x}\\circ\\varphi^{-1}$ (bottom)' });
        const K = 16;
        let st = {};
        v.legend([['blue', 'atoms of $E_{x,x}$ at $\\lambda=k^2$'], ['purple', 'atoms of $E\'_{x,x}$ at $\\mu=\\varphi(k^2)$']]);
        v.render(() => {
          const s = Math.PI * sS.value, pk = phiS.value;
          const phi = pk === 'cos' ? (l) => Math.cos(s * Math.sqrt(l)) : pk === 'heat' ? (l) => Math.exp(-s * l) : (l) => { const q = Math.sqrt(l) % s; return q > s - 1e-9 ? 0 : q; };
          const coef = (k) => (xS.value === 'tent' ? Math.sin(k * Math.PI / 2) / (k * k) : xS.value === 'step' ? (1 - Math.cos(k * Math.PI / 2)) / k : (k % 2 ? 1 / k : 0));
          let c = M.range(K).map((i) => coef(i + 1) ** 2); const tot = c.reduce((a, b) => a + b, 0); c = c.map((x) => x / tot);
          const mus = c.map((_, i) => phi((i + 1) ** 2));
          const lo = Math.min(...mus, pk === 'cos' ? -1 : 0), hi = Math.max(...mus, pk === 'cos' ? 1 : pk === 'mod' ? s : 1);
          const xb = (m) => (m - lo) / (hi - lo || 1), xt = (k) => (k - 0.5) / K;
          // merge atoms of the image measure
          const merged = [];
          mus.forEach((m, i) => { const j = merged.findIndex((q) => Math.abs(q[0] - m) < 1e-9); if (j >= 0) merged[j][1] += c[i]; else merged.push([m, c[i]]); });
          const cmax = Math.max(...c), mmax = Math.max(...merged.map((q) => q[1]));
          S.line(0, 1.35, 1, 1.35, { color: 'muted', width: 1.2 }); S.line(0, 0, 1, 0, { color: 'muted', width: 1.2 });
          c.forEach((m, i) => { S.line(xt(i + 1), 1.35, xb(mus[i]), 0.85 * (merged.find((q) => Math.abs(q[0] - mus[i]) < 1e-9)[1] / mmax), { color: 'muted', width: 1, alpha: 0.25 }); });
          c.forEach((m, i) => S.rect(xt(i + 1) - 0.012, 1.35, xt(i + 1) + 0.012, 1.35 + 0.85 * m / cmax, { color: 'blue', fill: 'blue', fillAlpha: 0.6 }));
          merged.forEach(([m, w]) => S.rect(xb(m) - 0.008, 0, xb(m) + 0.008, 0.85 * w / mmax, { color: 'purple', fill: 'purple', fillAlpha: 0.6 }));
          for (let k = 1; k <= K; k += k < 4 ? 1 : 3) S.text(`${k}`, xt(k), 1.27, { color: 'muted', size: 11 });
          S.text('√λ', 1.03, 1.27, { color: 'muted', size: 11 });
          [lo, (lo + hi) / 2, hi].forEach((m) => S.text(v.fmt(m, 2), xb(m), -0.09, { color: 'muted', size: 11 }));
          S.text('μ', 1.03, -0.09, { color: 'muted', size: 11 });
          const I1 = merged.reduce((a, [m, w]) => a + m * w, 0), J1 = c.reduce((a, w, i) => a + w * mus[i], 0);
          const I2 = merged.reduce((a, [m, w]) => a + m * m * w, 0), J2 = c.reduce((a, w, i) => a + w * mus[i] ** 2, 0);
          st = { I1, J1, I2, J2, n: merged.length };
        });
        v.readout(() => {
          const s = st;
          return `$\\int\\mu\\,dE'_{x,x}=${v.fix(s.I1, 6)}$, $\\int\\varphi\\,dE_{x,x}=${v.fix(s.J1, 6)}$; $\\int\\mu^2dE'_{x,x}=${v.fix(s.I2, 6)}$, $\\int\\varphi^2dE_{x,x}=${v.fix(s.J2, 6)}$. The ${K} atoms of $E_{x,x}$ land on ${s.n} point(s).`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.33
    {
      num: '13.33',
      kind: 'Theorem',
      name: 'The spectral theorem for unbounded normal operators',
      statement: String.raw`If $T$ is a closed, densely defined, normal operator in $H$, there is a unique resolution of the identity $E$ on the Borel sets of $\C$ such that
$$(Tx,y)=\int_\C\lambda\,dE_{x,y}(\lambda)\qquad(x\in\mathscr D(T),\ y\in H),\qquad\mathscr D(T)=\Big\{x:\int|\lambda|^2dE_{x,x}<\infty\Big\}.$$
$E$ is concentrated on $\sigma(T)$. Moreover, if $S\in B(H)$ and $ST\subset TS$, then $S$ commutes with every $E(\omega)$, hence with every $f(T)$.`,
      idea: String.raw`Use von Neumann's bounded pair (13.13): $B=(I+T^*T)^{-1}$ and $C=TB$ are bounded, and normality makes them commuting normal operators. They generate a commutative $B^*$-algebra of operators, which is $\int\hat a\,dE_0$ for one resolution $E_0$ on its maximal ideal space (12.22). Since $\hat b>0$ and $T=C B^{-1}$, $T$ is $\int\hat c/\hat b\,dE_0$, and pushing $E_0$ forward by $\hat c/\hat b$ (13.28) gives $E$ on $\C$. If $ST\subset TS$, then $S$ commutes with $B$ and $C$, hence with everything they generate, including all $E(\omega)$.`,
      caption: String.raw`On $L^2(\T)$, $T=-b\,\frac{d^2}{d\theta^2}+a\,\frac d{d\theta}$ is normal and unbounded, with eigenvalues $\lambda_k=bk^2+iak$ on a parabola (dots). For $x=\sum c_ke^{ik\theta}$, $E_{x,x}$ has mass $|c_k|^2$ at $\lambda_k$ (dot area). Drag the disc $\omega$; $E(\omega)$ keeps the frequencies with $\lambda_k\in\omega$. Choose $S$. A rotation $R_\alpha$ commutes with $T$ and keeps every mass where it is (orange rings coincide with the dots), so $SE(\omega)=E(\omega)S$. Multiplication by $e^{i\theta}$ does not commute with $T$: it shifts mass from $\lambda_k$ to $\lambda_{k+1}$, and the commutator $SE(\omega)-E(\omega)S$ is nonzero.`,
      deps: ['fa-13.13', 'fa-12.22', 'fa-13.28', 'fa-12.24'],
      see: ['fa-12.23', 'fa-13.30'],
      tags: ['spectral theorem', 'normal operators', 'unbounded operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('$a$', 0, 3, 1.6, { step: 0.01 });
        const bS = v.slider('$b$', 0, 1, 0.35, { step: 0.01 });
        const rS = v.slider('radius of $\\omega$', 0.5, 12, 4, { step: 0.05 });
        const Ssel = v.select('$S=$', [{ value: 'rot', label: 'rotation $R_\\alpha$' }, { value: 'mul', label: 'multiplication by $e^{i\\theta}$' }], 'rot');
        const P = v.stage({ x: [-4, 40], y: [-18, 18], height: 380, full: true, axes: true, title: '$\\sigma(T)=\\{\\lambda_k\\}$, the masses of $E_{x,x}$ (blue) and $E_{Sx,Sx}$ (orange rings), and $\\omega$' });
        const hw = P.handle(4, 3, { color: 'green', label: 'ω' });
        const K = 10, ks = M.range(2 * K + 1).map((i) => i - K);
        const c = ks.map((k) => [Math.exp(-((k - 1) ** 2) / 10), 0.3 * Math.exp(-((k + 2) ** 2) / 6)]);
        const nc = Math.sqrt(c.reduce((s, z) => s + cabs(z) ** 2, 0)); c.forEach((z, i) => { c[i] = [z[0] / nc, z[1] / nc]; });
        let st = {};
        v.legend([['blue', '$|c_k|^2$ at $\\lambda_k$'], ['orange', 'masses of $Sx$'], ['green', '$\\omega$', { area: true }]]);
        v.render(() => {
          const a = aS.value, b = bS.value, R = rS.value, rot = Ssel.value === 'rot', alpha = 0.9;
          const lam = ks.map((k) => [b * k * k, a * k]);
          const ext = Math.max(10, ...lam.map((z) => z[0])) * 1.05, ey = Math.max(6, a * K * 1.15);
          P.setView([-0.12 * ext, ext], [-ey, ey]);
          P.circle(hw.x, hw.y, R, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.1 });
          P.curve((t) => [b * t * t, a * t], -K - 0.5, K + 0.5, { color: 'muted', width: 1, dash: [3, 3], n: 200 });
          const Sc = rot ? ks.map((k, i) => cmul(c[i], [Math.cos(k * alpha), -Math.sin(k * alpha)])) : ks.map((k, i) => (i > 0 ? c[i - 1] : [0, 0]));
          const inW = lam.map((z) => Math.hypot(z[0] - hw.x, z[1] - hw.y) <= R);
          const mx = Math.max(...c.map((z) => cabs(z) ** 2), ...Sc.map((z) => cabs(z) ** 2));
          lam.forEach((z, i) => { const ms = cabs(Sc[i]) ** 2; if (ms > 1e-6) P.dot(z[0], z[1], { color: 'orange', r: 5 + 13 * Math.sqrt(ms / mx), hollow: true }); });
          lam.forEach((z, i) => { const m = cabs(c[i]) ** 2; P.dot(z[0], z[1], { color: inW[i] ? 'blue' : 'muted', r: 2 + 13 * Math.sqrt(m / mx) }); });
          // ‖S E(ω) x − E(ω) S x‖ in coefficient space
          const Ex = c.map((z, i) => (inW[i] ? z : [0, 0]));
          const SEx = rot ? ks.map((k, i) => cmul(Ex[i], [Math.cos(k * alpha), -Math.sin(k * alpha)])) : ks.map((k, i) => (i > 0 ? Ex[i - 1] : [0, 0]));
          const ESx = Sc.map((z, i) => (inW[i] ? z : [0, 0]));
          const comm = Math.sqrt(SEx.reduce((s, z, i) => s + cabs(csub(z, ESx[i])) ** 2, 0));
          const mass = Ex.reduce((s, z) => s + cabs(z) ** 2, 0), dom = c.reduce((s, z, i) => s + cabs(z) ** 2 * cabs(lam[i]) ** 2, 0);
          st = { comm, mass, dom, rot };
        });
        v.readout(() => {
          const s = st;
          return `$\\|E(\\omega)x\\|^2=E_{x,x}(\\omega)=${v.fix(s.mass, 4)}$; $\\int|\\lambda|^2dE_{x,x}=${v.fix(s.dom, 2)}<\\infty$, so $x\\in\\mathscr D(T)$. $\\|SE(\\omega)x-E(\\omega)Sx\\|=${v.fix(s.comm, 4)}$` + (s.rot ? ' — $S$ commutes with $T$, hence with $E(\\omega)$.' : ' — $S$ does not commute with $T$, and not with $E(\\omega)$.');
        });
      },
    },
    // ------------------------------------------------------------------ 13.36
    {
      num: '13.36',
      kind: 'Theorem',
      name: 'Uniformly continuous semigroups have bounded generators',
      statement: String.raw`Let $\{Q(t)\}_{t\ge0}$ be a semigroup of bounded operators on a Banach space $X$. Then $\norm{Q(t)-I}\to0$ as $t\downarrow0$ if and only if
$$Q(t)=e^{tA}=\sum_{n\ge0}\frac{t^nA^n}{n!}$$
for some $A\in B(X)$; $A$ is then the infinitesimal generator, defined on all of $X$. Semigroups with unbounded generators (heat, transport, Schrödinger) are therefore only strongly continuous.`,
      idea: String.raw`If $A$ is bounded, $\norm{e^{tA}-I}\le e^{t\norm A}-1$. Conversely, for small $s$ the average $V_s=\frac1s\int_0^sQ(t)\,dt$ is within $1$ of $I$ in norm, hence invertible (10.7). From $Q(h)V_s-V_s=\frac1s\big(\int_s^{s+h}-\int_0^h\big)Q$ one finds $\frac{Q(h)-I}h\to\frac1s(Q(s)-I)V_s^{-1}=:A$ in norm, so $A$ is bounded and generates $Q$. Both $Q(t)$ and $e^{tA}$ solve $u'=Au$, $u(0)=I$, so they coincide.`,
      caption: String.raw`Left: $\norm{Q(t)-I}$ against $\log_{10}t$. For the matrix semigroup $e^{tA}$ (bounded generator, blue) it goes to $0$, like $t\norm A$. For the heat semigroup on $L^2[0,\pi]$ (multipliers $e^{-k^2t}$) it is $1$ for every $t>0$ (red dashed). Truncating to the first $K$ modes (orange) gives a bounded generator, and the curve falls to $0$ only for $t\ll K^{-2}$. Strong continuity is still there: $\norm{Q(t)f-f}\to0$ for each fixed $f$ (green). Right: the multipliers $1-e^{-k^2t}$ of $Q(t)-I$ at the current $t$. However small $t$ is, they reach $1$ at high frequencies.`,
      deps: ['fa-13.35', 'fa-10.7'],
      tags: ['semigroups', 'generators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const KS = v.slider('truncation $K$', 2, 200, 20, { int: true, log: true });
        const tS = v.slider('$\\log_{10}t$', -4, 0, -1.5, { step: 0.01 });
        const L = v.stage({ x: [-4, 0], y: [0, 1.12], height: 300, axes: 'box', xticks: decTicks(-4, 0), xlabel: 't', title: '$\\|Q(t)-I\\|$ and $\\|Q(t)f-f\\|$' });
        const R = v.stage({ x: [0, 60], y: [0, 1.1], height: 300, axes: 'box', xlabel: 'k', title: 'multipliers $1-e^{-k^2t}$ at the current $t$' });
        const A = [[-1, 3], [-2, -0.5]];
        const expm = (t) => { let S = [[1, 0], [0, 1]], P = [[1, 0], [0, 1]]; for (let n = 1; n < 40; n++) { P = [[(P[0][0] * A[0][0] + P[0][1] * A[1][0]) * t / n, (P[0][0] * A[0][1] + P[0][1] * A[1][1]) * t / n], [(P[1][0] * A[0][0] + P[1][1] * A[1][0]) * t / n, (P[1][0] * A[0][1] + P[1][1] * A[1][1]) * t / n]]; S = [[S[0][0] + P[0][0], S[0][1] + P[0][1]], [S[1][0] + P[1][0], S[1][1] + P[1][1]]]; } return S; };
        const nr = (X) => norm22([X[0][0], 0], [X[0][1], 0], [X[1][0], 0], [X[1][1], 0]);
        const cf = M.range(400).map((i) => 1 / (i + 1) ** 2), ncf = Math.sqrt(cf.reduce((s, x) => s + x * x, 0));
        let st = {};
        v.legend([['blue', '$e^{tA}$, $A\\in B(\\R^2)$'], ['red', 'heat semigroup', { dash: true }], ['orange', 'heat, first $K$ modes'], ['green', '$\\|Q(t)f-f\\|$, heat, $f_k=k^{-2}$']]);
        v.render(() => {
          const K = KS.value, lt = tS.value, t = 10 ** lt, ls = M.linspace(-4, 0, 161);
          L.path(ls.map((l) => [l, nr([[expm(10 ** l)[0][0] - 1, expm(10 ** l)[0][1]], [expm(10 ** l)[1][0], expm(10 ** l)[1][1] - 1]])]).map(([x, y]) => (y > 1.12 ? null : [x, y])), { color: 'blue', width: 2.4 });
          L.hline(1, { color: 'red', width: 2, dash: [6, 4] });
          L.path(ls.map((l) => [l, 1 - Math.exp(-K * K * 10 ** l)]), { color: 'orange', width: 2.2 });
          L.path(ls.map((l) => { const s = 10 ** l; let e = 0; for (let k = 1; k <= 400; k++) e += ((1 - Math.exp(-k * k * s)) * cf[k - 1]) ** 2; return [l, Math.sqrt(e) / ncf]; }), { color: 'green', width: 2.2 });
          L.vline(lt, { color: 'muted', width: 1, dash: [3, 3] });
          for (let k = 1; k <= 60; k++) { const m = 1 - Math.exp(-k * k * t); R.rect(k - 0.4, 0, k + 0.4, m, { color: k <= K ? 'orange' : 'red', fill: k <= K ? 'orange' : 'red', fillAlpha: 0.5, width: 0.6 }); }
          if (K < 60) R.vline(K + 0.5, { color: 'orange', width: 1.4, dash: [4, 3] });
          const E = expm(t);
          st = { t, mat: nr([[E[0][0] - 1, E[0][1]], [E[1][0], E[1][1] - 1]]), trunc: 1 - Math.exp(-K * K * t), K };
        });
        v.readout(() => {
          const s = st;
          return `$t=${v.sci(s.t, 2)}$: $\\|e^{tA}-I\\|=${v.fix(s.mat, 4)}$; heat semigroup $\\|Q(t)-I\\|=1$; first $${s.K}$ modes: $${v.fix(s.trunc, 4)}$. A generator is bounded exactly when the semigroup is norm-continuous at $0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.37
    {
      num: '13.37',
      kind: 'Theorem',
      name: 'The Yosida approximation',
      credit: 'Yosida, 1948',
      statement: String.raw`Let $A$ generate a strongly continuous contraction semigroup $Q(t)$ on a Banach space $X$, so that $\norm{(\lambda I-A)^{-1}}\le1/\lambda$ for $\lambda>0$. Put
$$A_\lambda=\lambda A(\lambda I-A)^{-1}=\lambda^2(\lambda I-A)^{-1}-\lambda I\in B(X).$$
Then $\norm{e^{tA_\lambda}}\le1$, $A_\lambda x\to Ax$ for $x\in\mathscr D(A)$, and $e^{tA_\lambda}x\to Q(t)x$ as $\lambda\to\infty$, uniformly for $t$ in compact intervals.`,
      idea: String.raw`$J_\lambda=\lambda(\lambda I-A)^{-1}$ has norm $\le1$ and $J_\lambda x\to x$ (first on $\mathscr D(A)$, where $J_\lambda x-x=(\lambda I-A)^{-1}Ax$, then everywhere by density), so $A_\lambda x=J_\lambda Ax\to Ax$. Next $e^{tA_\lambda}=e^{-\lambda t}e^{\lambda tJ_\lambda}$ has norm $\le e^{-\lambda t}e^{\lambda t}=1$. Finally $e^{tA_\lambda}x-e^{tA_\mu}x=\int_0^te^{(t-s)A_\mu}e^{sA_\lambda}(A_\lambda-A_\mu)x\,ds$ is Cauchy, and the limit is the semigroup generated by $A$ (13.35). This is Yosida's half of the Hille–Yosida theorem.`,
      caption: String.raw`$A=d/dx$ on $L^2$ of the circle generates the rotations $Q(t)f(x)=f(x+t)$. On the frequency $e^{ikx}$, $A$ multiplies by $ik$ and $A_\lambda$ by $\frac{\lambda ik}{\lambda-ik}$: the imaginary axis is folded onto the circle of radius $\lambda/2$ about $-\lambda/2$ (bottom left), a bounded set, and high frequencies are damped (bottom right). Top: $Q(t)f$ (green) and $e^{tA_\lambda}f$ (gold), computed by FFT. For small $\lambda$ the approximation lags and smears out high frequencies; as $\lambda$ grows it locks onto the true translate.`,
      deps: ['fa-13.35', 'fa-13.36'],
      tags: ['semigroups', 'Hille–Yosida', 'Yosida approximation'],
      verify: true,
      viz(v) {
        const M = v.M;
        const tS = v.slider('$t$', 0, 3, 1.6, { step: 0.01 });
        const lS = v.slider('$\\log_{10}\\lambda$', 0, 3, 1.1, { step: 0.01 });
        const fS = v.select('$f=$', [{ value: 'box', label: 'box' }, { value: 'bump', label: 'bump' }], 'box');
        const T = v.stage({ x: [0, 2 * Math.PI], y: [-0.3, 1.3], height: 250, full: true, axes: true, xticks: [[0, '0'], [Math.PI, 'π'], [2 * Math.PI, '2π']], title: '$f$ (faint), $Q(t)f$ (green), $e^{tA_\\lambda}f$ (gold)' });
        const S = v.stage({ x: [-30, 4], y: [-25, 25], equal: true, height: 280, axes: true, title: 'spectra: $ik$ (green) and $\\frac{\\lambda ik}{\\lambda-ik}$ (gold), $|k|\\le40$' });
        const W = v.stage({ x: [0, 40], y: [0, 1.08], height: 280, axes: 'box', xlabel: 'k', title: 'damping $|e^{tA_\\lambda}|$ on $e^{ikx}$ (gold) vs $|Q(t)|=1$' });
        const N = 512, xs = M.range(N).map((j) => 2 * Math.PI * j / N);
        let cache = { key: '' }, st = {};
        v.legend([['green', '$Q(t)f$; $\\sigma(A)$'], ['gold', '$e^{tA_\\lambda}f$; $\\sigma(A_\\lambda)$']]);
        v.render(() => {
          const t = tS.value, lam = 10 ** lS.value, fk = fS.value;
          const f = fk === 'box' ? (x) => (x > 1 && x < 2.4 ? 1 : 0) : (x) => bump(x, 1.7, 0.8);
          if (cache.key !== fk) { const re = Float64Array.from(xs, f), im = new Float64Array(N); fft(re, im); cache = { key: fk, re, im }; }
          const out = (mult) => {          // inverse FFT of the multiplied spectrum
            const re = new Float64Array(N), im = new Float64Array(N);
            for (let j = 0; j < N; j++) { const k = j < N / 2 ? j : j - N, m = mult(k), z = cmul([cache.re[j], cache.im[j]], m); re[j] = z[0]; im[j] = -z[1]; }
            fft(re, im); return Array.from(re, (x) => x / N);
          };
          const exact = out((k) => [Math.cos(k * t), Math.sin(k * t)]);
          const yos = out((k) => { const z = cdiv([0, lam * k], [lam, -k]); return cexp([z[0] * t, z[1] * t]); });
          T.fn(f, { color: 'muted', width: 1.2, alpha: 0.5, n: 600 });
          T.path(xs.map((x, j) => [x, exact[j]]), { color: 'green', width: 2.4 });
          T.path(xs.map((x, j) => [x, yos[j]]), { color: 'gold', width: 2.4 });
          for (let k = -40; k <= 40; k++) { S.line(-0.6, k, 0.6, k, { color: 'green', width: 1.4 }); const z = cdiv([0, lam * k], [lam, -k]); if (z[0] > -30) S.dot(z[0], z[1], { color: 'gold', r: 3 }); }
          if (lam / 2 < 60) S.circle(-lam / 2, 0, lam / 2, { color: 'gold', width: 1, dash: [3, 3], alpha: 0.7 });
          W.hline(1, { color: 'green', width: 2 });
          W.fn((k) => Math.exp(-t * lam * k * k / (lam * lam + k * k)), { color: 'gold', width: 2.4 });
          let e2 = 0, n2 = 0; for (let j = 0; j < N; j++) { e2 += (yos[j] - exact[j]) ** 2; n2 += exact[j] ** 2; }
          st = { err: Math.sqrt(e2 / n2), lam };
        });
        v.readout(() => `$\\lambda=${v.fix(st.lam, 1)}$: $\\|e^{tA_\\lambda}f-Q(t)f\\|/\\|f\\|=${v.fix(st.err, 4)}$; $\\|A_\\lambda\\|=\\lambda$ is finite, though $A$ is unbounded.`);
      },
    },
    // ------------------------------------------------------------------ 13.39
    {
      num: '13.39',
      kind: 'Theorem',
      name: 'Dissipative generators (Lumer–Phillips)',
      credit: 'Lumer & Phillips, 1961',
      statement: String.raw`Let $A$ be a densely defined operator in a Hilbert space $H$. Then $A$ generates a strongly continuous contraction semigroup if and only if
(a) $A$ is **dissipative**: $\operatorname{Re}(Ax,x)\le0$ for all $x\in\mathscr D(A)$, and
(b) $\mathscr R(I-A)=H$.
For a matrix, (b) is automatic, and $\norm{e^{tA}}\le1$ for all $t\ge0$ exactly when the numerical range $\{(Ax,x):\norm x=1\}$ lies in the closed left half-plane.`,
      idea: String.raw`If $A$ is dissipative, then for $\lambda>0$, $\norm{(\lambda I-A)x}\norm x\ge\operatorname{Re}((\lambda I-A)x,x)\ge\lambda\norm x^2$. So $\lambda I-A$ is one-to-one with $\norm{(\lambda I-A)^{-1}}\le1/\lambda$ on its range, and (b) makes the range everything. These are the Hille–Yosida hypotheses of 13.35. Conversely, $\operatorname{Re}(Q(t)x-x,x)\le\norm{Q(t)x}\norm x-\norm x^2\le0$, and dividing by $t$ gives (a). For matrices, $\frac d{dt}\norm{e^{tA}x}^2=2\operatorname{Re}(Ae^{tA}x,e^{tA}x)$.`,
      caption: String.raw`$A=\begin{pmatrix}\lambda_1&k\\0&\lambda_2\end{pmatrix}$. Drag the eigenvalues and set the non-normality $k$. Left: the numerical range $W(A)$, an ellipse with foci $\lambda_1,\lambda_2$ and minor axis $k$. Right: $\norm{e^{tA}}$ against $t$, with the bound $e^{t\omega}$, $\omega=\max\operatorname{Re}W(A)$ (dashed). With both eigenvalues in the left half-plane but $k$ large, the ellipse pokes into $\operatorname{Re}>0$ (red) and $\norm{e^{tA}}$ rises above $1$ before it decays. Eigenvalues alone do not decide contractivity; the numerical range does.`,
      deps: ['fa-13.35', 'fa-13.37'],
      tags: ['semigroups', 'dissipative operators', 'numerical range'],
      verify: true,
      viz(v) {
        const M = v.M;
        const kS = v.slider('non-normality $k$', 0, 5, 2.6, { step: 0.01 });
        const L = v.stage({ x: [-4, 2], y: [-2.5, 2.5], equal: true, height: 330, axes: true, title: 'eigenvalues and numerical range $W(A)$' });
        const R = v.stage({ x: [0, 6], y: [0, 2.5], height: 330, axes: 'box', xlabel: 't', title: '$\\|e^{tA}\\|$' });
        const h1 = L.handle(-0.6, 0.8, { color: 'blue', label: 'λ₁' });
        const h2 = L.handle(-1.4, -0.5, { color: 'blue', label: 'λ₂' });
        let st = {};
        v.legend([['purple', '$W(A)$', { area: true }], ['ink', '$\\|e^{tA}\\|$'], ['orange', '$e^{t\\omega}$', { dash: true }]]);
        v.render(() => {
          const l1 = [h1.x, h1.y], l2 = [h2.x, h2.y], k = kS.value;
          L.rect(0, -3, 3, 3, { color: 'red', fill: 'red', fillAlpha: 0.07, stroke: false });
          const cen = [(l1[0] + l2[0]) / 2, (l1[1] + l2[1]) / 2], d = cabs(csub(l2, l1)), u = d > 1e-9 ? [(l2[0] - l1[0]) / d, (l2[1] - l1[1]) / d] : [1, 0];
          const sa = Math.sqrt(d * d / 4 + k * k / 4), sb = k / 2;
          L.curve((th) => [cen[0] + sa * Math.cos(th) * u[0] - sb * Math.sin(th) * u[1], cen[1] + sa * Math.cos(th) * u[1] + sb * Math.sin(th) * u[0]], 0, 2 * Math.PI, { color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.15, n: 240 });
          const om = (l1[0] + l2[0]) / 2 + Math.sqrt(((l1[0] - l2[0]) / 2) ** 2 + k * k / 4);
          L.vline(om, { color: 'orange', width: 1.6, dash: [5, 4] });
          const ts = M.linspace(0, 6, 241);
          const nrm = (t) => {
            const e1 = cexp([l1[0] * t, l1[1] * t]), e2 = cexp([l2[0] * t, l2[1] * t]);
            const off = d > 1e-9 ? cmul([k, 0], cdiv(csub(e1, e2), csub(l1, l2))) : cmul([k * t, 0], e1);
            return norm22(e1, off, [0, 0], e2);
          };
          const vals = ts.map(nrm), peak = Math.max(...vals);
          R.setView(null, [0, Math.max(1.3, Math.min(peak, 8) * 1.12)]);
          R.hline(1, { color: 'muted', width: 1.2, dash: [3, 3] });
          R.fn((t) => Math.exp(om * t), { domain: [0, 6], color: 'orange', width: 1.6, dash: [5, 4] });
          R.path(ts.map((t, i) => [t, vals[i]]), { color: peak > 1 + 1e-9 ? 'red' : 'ink', width: 2.6 });
          st = { om, peak, re: Math.max(l1[0], l2[0]) };
        });
        v.readout(() => {
          const s = st;
          return `$\\max\\operatorname{Re}\\sigma(A)=${v.fix(s.re, 3)}$, $\\omega=\\max\\operatorname{Re}W(A)=${v.fix(s.om, 3)}$, $\\sup_t\\|e^{tA}\\|=${v.fix(s.peak, 3)}$. ` + (s.om <= 1e-9 ? '**Dissipative**: $e^{tA}$ is a contraction semigroup.' : s.re < 0 ? 'Stable eigenvalues, but $A$ is not dissipative, and $e^{tA}$ is not a contraction.' : 'An eigenvalue has $\\operatorname{Re}\\lambda\\ge0$: no decay.');
        });
      },
    },
  ],
};
