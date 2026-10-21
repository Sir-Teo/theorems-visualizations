// Rudin, Functional Analysis — Chapter 7 (part 3): convolution in 𝒮′, Paley–Wiener theorems, Sobolev's lemma
//
// Conventions as in part 1: dm(x) = (2π)^{-1/2} dx, f̂(t) = ∫ f(x) e^{-ixt} dm(x).
// Numbering recalled, not checked against the book; uncertain items carry `verify: true`.

const RT2PI = Math.sqrt(2 * Math.PI);
function psi0(x) { const s = 1 - x * x; return s > 0 ? Math.exp(-1 / s) : 0; }
function simpson(f, a, b, n) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
const logTicks = (lo, hi, step = 1) => { const out = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % step === 0) out.push([k, p10(k)]); return out; };
/** Complex numbers as [re, im]. */
const cexp = (re, im) => { const e = Math.exp(re); return [e * Math.cos(im), e * Math.sin(im)]; };
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cabs = (a) => Math.hypot(a[0], a[1]);
/** ∫_a^b g(t) e^{-izt} dt for complex z = x + iy, by Simpson (g real). */
function laplaceLike(g, a, b, x, y, n) {
  if (n % 2) n++;
  const h = (b - a) / n; let re = 0, im = 0;
  for (let i = 0; i <= n; i++) {
    const t = a + i * h, w = (i === 0 || i === n ? 1 : i % 2 ? 4 : 2), gt = g(t);
    if (gt === 0) continue;
    const m = gt * Math.exp(y * t);           // e^{-i(x+iy)t} = e^{yt} e^{-ixt}
    re += w * m * Math.cos(x * t); im -= w * m * Math.sin(x * t);
  }
  return [re * h / 3, im * h / 3];
}
/** Phase colour with log-modulus shading. */
function phaseRGB(M, re, im) {
  if (!isFinite(re) || !isFinite(im)) return [245, 245, 245];
  const mod = Math.hypot(re, im), t = M.fract(Math.log2(mod + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}

export default {
  collection: 'fa',
  chapter: 7,
  items: [
    {
      num: '7.19',
      kind: 'Theorem',
      name: 'Convolution with tempered distributions; (u∗φ)^ = φ̂û',
      statement: String.raw`If $u\in\mathscr S_n'$ and $\varphi\in\mathscr S_n$, then $u*\varphi$, defined by $(u*\varphi)(x)=u(\tau_x\check\varphi)$, is a $C^\infty$ function of at most polynomial growth (so a tempered distribution), and
$$(u*\varphi)^\wedge=\hat\varphi\,\hat u .$$
Moreover $u*(\varphi*\psi)=(u*\varphi)*\psi$ for $\varphi,\psi\in\mathscr S_n$.`,
      idea: String.raw`Smoothness is as in 6.30, now with difference quotients converging in $\mathscr S_n$. Polynomial growth: $|u(\psi)|\le C\|\psi\|_N$, and the $\mathscr S$-norms of $\tau_x\check\varphi$ grow like $(1+|x|^2)^N$. For the transform, test against $\psi\in\mathscr S_n$ and use Fubini on $\int(u*\varphi)\hat\psi$ together with $\hat\psi*\check\varphi=(\psi\,\hat{\check\varphi})^\wedge$ — the convolution theorem 7.8 for Schwartz functions — to move everything onto $u$.`,
      caption: String.raw`$u=\mathrm{p.v.}\frac1x$ (so $u*\varphi$ is a multiple of the Hilbert transform) and $\varphi(x)=e^{-x^2/2\sigma^2}\cos\omega x$. Left: $u*\varphi$ computed directly as a principal-value integral (purple), and computed on the Fourier side — multiply $\hat\varphi$ by $\hat u=-i\sqrt{\pi/2}\,\operatorname{sgn}t$ and invert (green dots). Right: $\hat\varphi$ (blue) and $(u*\varphi)^\wedge/i$ (purple). Note that $u*\varphi$ is smooth but decays only like $1/x$ when $\hat\varphi(0)\ne0$: it is in $\mathscr S_1'$, not in $\mathscr S_1$.`,
      deps: ['fa-7.15', 'fa-7.8', 'fa-6.30'],
      tags: ['tempered distributions', 'convolution', 'Hilbert transform'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sS = v.slider('width $\\sigma$', 0.3, 2, 0.8, { step: 0.01 });
        const wS = v.slider('frequency $\\omega$', 0, 4, 1.5, { step: 0.01 });
        const L = v.stage({ x: [-10, 10], y: [-1.5, 1.5], height: 280, weight: 1.3, axes: true, title: '$x$: $\\varphi$ and $u*\\varphi$, two ways' });
        const R = v.stage({ x: [-6, 6], y: [-1, 1], height: 280, axes: true, title: '$t$: $\\hat\\varphi$ and $(u*\\varphi)^\\wedge/i=-\\sqrt{\\pi/2}\\,\\operatorname{sgn}(t)\\hat\\varphi$' });
        let st = {};
        v.legend([['blue', '$\\varphi$, $\\hat\\varphi$'], ['purple', '$u*\\varphi$ (principal value in $x$)'], ['green', 'via $\\hat\\varphi\\,\\hat u$ and inversion', { dot: true }]]);
        v.render(() => {
          const sg = sS.value, w = wS.value;
          const ph = (x) => Math.exp(-x * x / (2 * sg * sg)) * Math.cos(w * x);
          const phHat = (t) => (sg / 2) * (Math.exp(-sg * sg * (t - w) ** 2 / 2) + Math.exp(-sg * sg * (t + w) ** 2 / 2));
          const Y = 8 * sg + 1;
          const direct = (x) => simpson((y) => { const t = Math.max(y, 1e-6); return (ph(x - t) - ph(x + t)) / t; }, 0, Math.abs(x) + Y, 1600) / RT2PI;
          const T = w + 9 / sg;
          const viaF = (x) => simpson((t) => phHat(t) * Math.sin(x * t), 0, T, 1600);
          L.fn(ph, { color: 'blue', width: 2, alpha: 0.85, n: 900 });
          const xs = M.linspace(-10, 10, 201), D = xs.map(direct);
          L.setView(null, span([...D, 1, -0.3], 1, 0.12));
          L.path(xs.map((x, i) => [x, D[i]]), { color: 'purple', width: 2.6 });
          const dots = xs.filter((_, i) => i % 6 === 3).map((x) => [x, viaF(x)]);
          L.dots(dots, { color: 'green', r: 3.6 });
          R.fn(phHat, { color: 'blue', width: 2.2, n: 900 });
          R.fn((t) => -Math.sqrt(Math.PI / 2) * Math.sign(t) * phHat(t), { color: 'purple', width: 2.4, n: 1200 });
          R.setView(null, span([sg, -Math.sqrt(Math.PI / 2) * sg, 0.3], 1, 0.12));
          const err = Math.max(...dots.map(([x, y]) => Math.abs(y - direct(x))));
          st = { err, x10: direct(10), h0: phHat(0) };
        });
        v.readout(() => {
          const s = st;
          return `$\\max|$direct$-$Fourier$| = ${v.sci(s.err + 1e-16, 2)}$. Tail: $(u*\\varphi)(10) = ${v.fix(s.x10, 4)}$ vs. $\\hat\\varphi(0)/10 = ${v.fix(s.h0 / 10, 4)}$ — decay like $\\hat\\varphi(0)/x$` + (s.h0 < 1e-3 ? ' (here $\\hat\\varphi(0)\\approx0$, so it decays faster).' : ', so $u*\\varphi\\notin\\mathscr S_1$.');
        });
      },
    },
    // ------------------------------------------------------------------ Paley–Wiener
    {
      num: '7.22',
      kind: 'Theorem',
      name: 'Paley–Wiener theorem for test functions',
      credit: 'Paley & Wiener, 1934',
      statement: String.raw`(a) If $\varphi\in\mathscr D(\R^n)$ has support in the ball $rB$, then
$$f(z)=\int_{\R^n}\varphi(t)\,e^{-iz\cdot t}\,dm_n(t)\qquad(z\in\C^n)$$
is an entire function, and for every $N$ there is $\gamma_N<\infty$ with
$$|f(z)|\le\gamma_N\,(1+|z|)^{-N}e^{r|\operatorname{Im}z|}\qquad(z\in\C^n).$$
(b) Conversely, every entire function satisfying these estimates is of this form, with $\varphi\in\mathscr D(\R^n)$ supported in $rB$; on $\R^n$, $f=\hat\varphi$.`,
      idea: String.raw`(a) Differentiating under the integral sign makes $f$ entire; integrating by parts $N$ times moves powers of $z$ onto derivatives of $\varphi$, and $|e^{-iz\cdot t}|=e^{\operatorname{Im}z\cdot t}\le e^{r|\operatorname{Im}z|}$ on the support. (b) Define $\varphi=\check f$ on $\R^n$; the decay makes it smooth. To see that $\varphi$ vanishes outside $rB$, shift the inversion integral to $\R^n+i\eta$ by Cauchy's theorem: the estimate gives $|\varphi(x)|\le\gamma e^{r|\eta|-\eta\cdot x}$ for every $\eta$, and letting $\eta=\lambda x/|x|$ with $\lambda\to\infty$ kills $\varphi(x)$ whenever $|x|>r$.`,
      caption: String.raw`Choose $\varphi$: a smooth bump on $[-r,r]$, a lopsided smooth bump, or — for contrast — a B-spline (compact support but only finitely smooth). Top: phase portrait of the entire function $f$ on the strip $|\operatorname{Im}z|\le3$; its modulus grows like $e^{r|\operatorname{Im}z|}$ away from the real axis. Bottom: along the horizontal line $\operatorname{Im}z=y$, the normalised size $|f(x+iy)|\,e^{-r|y|}$ against $1+|x|$ on log–log axes, with dashed slopes $-2,-4,-6$. The smooth bumps fall below every slope (faster than any power); the B-spline of order $k$ only like $|x|^{-k}$.`,
      deps: ['fa-7.7', 'fa-6.2', 'rca-10.14'],
      see: ['rca-19.3'],
      tags: ['Paley–Wiener', 'entire functions', 'Fourier transform'],
      verify: true,
      viz(v) {
        const M = v.M;
        const F = {
          bump: { label: 'smooth bump' },
          lop: { label: 'lopsided bump' },
          b2: { label: 'B-spline, $k=2$' },
          b4: { label: 'B-spline, $k=4$' },
        };
        const which = v.select('$\\varphi=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const rS = v.slider('support radius $r$', 0.5, 2, 1, { step: 0.01 });
        const yS = v.slider('line $\\operatorname{Im}z=y$', -3, 3, 1.5, { step: 0.01 });
        const D = v.stage({ x: [-12, 12], y: [-3, 3], height: 230, full: true, ticks: true, axes: true, title: 'phase portrait of $f(z)=\\int\\varphi(t)e^{-izt}dm(t)$' });
        const B = v.stage({ x: [0, 2], y: [-12, 1], height: 240, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100']], xlabel: '1+|x|', title: '$|f(x+iy)|\\,e^{-r|y|}$ against $1+|x|$ (log–log)' });
        const make = (key, r) => {
          if (key === 'bump') return { g: (t) => psi0(t / r), a: -r, b: r, r };
          if (key === 'lop') return { g: (t) => psi0(t / r) * (1 + 0.8 * t / r) ** 2, a: -r, b: r, r };
          const k = key === 'b2' ? 2 : 4;
          return { k, r: k / 2 };
        };
        const fval = (P, x, y) => {
          if (P.k) {   // B-spline: B̂_k(z) = (sin(z/2)/(z/2))^k / √(2π)
            const zr = x / 2, zi = y / 2;
            const sinz = [Math.sin(zr) * Math.cosh(zi), Math.cos(zr) * Math.sinh(zi)], d = zr * zr + zi * zi;
            let q = d < 1e-14 ? [1, 0] : cmul(sinz, [zr / d, -zi / d]), out = [1, 0];
            for (let i = 0; i < P.k; i++) out = cmul(out, q);
            return [out[0] / RT2PI, out[1] / RT2PI];
          }
          const n = Math.max(160, Math.ceil(Math.abs(x) * (P.b - P.a) * 2.5) * 2);
          const z = laplaceLike(P.g, P.a, P.b, x, y, n); return [z[0] / RT2PI, z[1] / RT2PI];
        };
        let st = {};
        v.legend([['purple', '$|f(x+iy)|e^{-r|y|}$', { dot: true }], ['muted', 'slopes $-2,-4,-6$', { dash: true }]]);
        v.render(() => {
          const key = which.value, P = make(key, rS.value), y = yS.value, r = P.r;
          rS.el.hidden = !!P.k;
          D.domain((z) => { const q = fval(P, z.re, z.im); return new v.Cx(q[0], q[1]); }, { key: `${key}|${r.toFixed(3)}`, res: 3 });
          D.axes();
          D.line(-12, y, 12, y, { color: 'ink', width: 1.6, dash: [6, 4] });
          D.corner(`type r = ${v.fmt(r, 3)}`, 'tl', { color: 'ink', weight: 600 });
          // decay along the line
          const ls = M.linspace(0, 2, 81), pts = ls.map((l) => { const x = 10 ** l - 1; const q = fval(P, x, y); return [l, Math.log10(cabs(q) * Math.exp(-r * Math.abs(y)) + 1e-300)]; });
          const lo = Math.max(-16, Math.min(...pts.map((p) => p[1])) - 0.5), hi = Math.max(...pts.map((p) => p[1])) + 0.6;
          B.setView(null, [lo, hi]);
          B.setTicks([[0, '1'], [1, '10'], [2, '100']], logTicks(lo, hi, hi - lo > 8 ? 2 : 1));
          [2, 4, 6].forEach((s) => B.line(0, pts[0][1], 2, pts[0][1] - 2 * s, { color: 'muted', width: 1, dash: [4, 4] }));
          B.path(pts, { color: 'purple', width: 2.4 });
          // exponential type estimate along the imaginary axis
          const typeEst = Math.log(cabs(fval(P, 0, 80)) / cabs(fval(P, 0, 40))) / 40;
          st = { spline: !!P.k, r, typeEst, last: pts[pts.length - 1][1] };
        });
        v.readout(() => {
          const s = st;
          return `Growth along the imaginary axis: $\\log\\frac{|f(80i)|}{|f(40i)|}/40 = ${v.fix(s.typeEst, 3)}$, approaching the support radius $r=${v.fix(s.r, 2)}$ (exponential type $r$). At $|x|=99$: normalised size $10^{${v.fix(s.last, 1)}}$` + (s.spline ? ' — only polynomial decay: a B-spline is not $C^\\infty$.' : ' — faster than any power, as for every test function.');
        });
      },
    },
    {
      num: '7.23',
      kind: 'Theorem',
      name: 'Paley–Wiener–Schwartz theorem',
      statement: String.raw`(a) If $u\in\mathscr D'(\R^n)$ has support in $rB$ and order $N$, then $f(z)=u(e_{-z})$, where $e_{-z}(t)=e^{-iz\cdot t}$, is an entire function, its restriction to $\R^n$ is $\hat u$, and for some $\gamma<\infty$
$$|f(z)|\le\gamma\,(1+|z|)^{N}e^{r|\operatorname{Im}z|}\qquad(z\in\C^n).$$
(b) Conversely, every entire function with such a bound (for some $N$) is the Fourier–Laplace transform of a distribution supported in $rB$.`,
      idea: String.raw`Since $u$ has compact support it acts on the smooth functions $t\mapsto e^{-iz\cdot t}$ (6.24), and $z\mapsto e_{-z}$ is holomorphic into $C^\infty$, so $f$ is entire. The order-$N$ estimate with a cutoff equal to $1$ near $rB$ bounds $|u(e_{-z})|$ by derivatives of $e_{-z}$ of order $\le N$ on a slightly larger ball: each derivative contributes a factor $|z|$ and the exponential contributes $e^{(r+\varepsilon)|\operatorname{Im}z|}$; a cutoff adapted to $|z|$ removes the $\varepsilon$. For (b), regularise: $f\cdot\hat h_\varepsilon$ satisfies the hypotheses of 7.22, and the corresponding test functions converge to the desired $u$.`,
      caption: String.raw`Distributions with compact support: point masses, a dipole, $\delta''$, or the indicator of $[-1,1]$. Top: phase portrait of $\hat u(z)=u(e_{-z})$ — closed forms like $e^{-iaz}$, $ize^{-iaz}$, $-z^2$. Bottom: on the line $\operatorname{Im}z=y$, $|\hat u(x+iy)|e^{-r|y|}$ against $1+|x|$ on log–log axes. It grows at most like $(1+|x|)^N$ with $N$ the order (the dashed line of slope $N$); the indicator function, of order $0$, even decays.`,
      deps: ['fa-7.22', 'fa-6.24', 'fa-7.15'],
      see: ['rca-19.3'],
      tags: ['Paley–Wiener', 'distributions', 'entire functions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const U = {
          pt: { label: '$\\delta_{0.8}$', N: 0, r: 0.8, f: (x, y) => cexp(0.8 * y, -0.8 * x) },
          dip: { label: "$\\delta'_{-1}+\\tfrac12\\delta_{0.5}$", N: 1, r: 1, f: (x, y) => { const a = cmul([-y, x], cexp(-y, x)); const b = cexp(0.5 * y, -0.5 * x); return [a[0] + 0.5 * b[0], a[1] + 0.5 * b[1]]; } },
          d2: { label: "$\\delta''+\\delta_1$", N: 2, r: 1, f: (x, y) => { const z2 = [x * x - y * y, 2 * x * y], e = cexp(y, -x); return [-z2[0] + e[0], -z2[1] + e[1]]; } },
          box: { label: '$1_{[-1,1]}$', N: 0, r: 1, f: (x, y) => { const sinz = [Math.sin(x) * Math.cosh(y), Math.cos(x) * Math.sinh(y)], d = x * x + y * y; const q = d < 1e-14 ? [1, 0] : cmul(sinz, [x / d, -y / d]); return [2 * q[0] / RT2PI, 2 * q[1] / RT2PI]; } },
        };
        // δ'_a(e_{-z}) = −(d/dt)e^{-izt}|_{t=a} = iz e^{-iza}; δ''(e_{-z}) = (−iz)² = −z²
        const which = v.select('$u=$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'dip');
        const yS = v.slider('line $\\operatorname{Im}z=y$', -3, 3, 1, { step: 0.01 });
        const D = v.stage({ x: [-12, 12], y: [-3, 3], height: 230, full: true, axes: true, title: 'phase portrait of $\\hat u(z)=u(e_{-z})$' });
        const B = v.stage({ x: [0, 2], y: [-3, 5], height: 240, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100']], xlabel: '1+|x|', title: '$|\\hat u(x+iy)|\\,e^{-r|y|}$ against $1+|x|$ (log–log)' });
        let st = {};
        v.legend([['purple', '$|\\hat u(x+iy)|e^{-r|y|}$'], ['green', 'slope $N$ = order of $u$', { dash: true }]]);
        v.render(() => {
          const key = which.value, Uk = U[key], y = yS.value;
          D.domain((z) => { const q = Uk.f(z.re, z.im); return new v.Cx(q[0], q[1]); }, { key, res: 3 });
          D.axes();
          D.line(-12, y, 12, y, { color: 'ink', width: 1.6, dash: [6, 4] });
          D.corner(`order N = ${Uk.N}, support in [−${Uk.r}, ${Uk.r}]`, 'tl', { color: 'ink', weight: 600 });
          const ls = M.linspace(0, 2, 161), pts = ls.map((l) => { const x = 10 ** l - 1; return [l, Math.log10(cabs(Uk.f(x, y)) * Math.exp(-Uk.r * Math.abs(y)) + 1e-300)]; });
          const ratio = Math.max(...ls.map((l) => { const x = 10 ** l - 1; return cabs(Uk.f(x, y)) * Math.exp(-Uk.r * Math.abs(y)) / (1 + Math.hypot(x, y)) ** Uk.N; }));
          const lo = Math.max(-6, Math.min(...pts.map((p) => p[1])) - 0.5), hi = Math.max(...pts.map((p) => p[1]), Math.log10(ratio) + 2 * Uk.N) + 0.5;
          B.setView(null, [lo, hi]);
          B.setTicks([[0, '1'], [1, '10'], [2, '100']], logTicks(lo, hi, 1));
          B.line(0, Math.log10(ratio), 2, Math.log10(ratio) + 2 * Uk.N, { color: 'green', width: 1.6, dash: [6, 4] });
          B.path(pts, { color: 'purple', width: 2.2 });
          st = { N: Uk.N, ratio };
        });
        v.readout(() => `On this line $\\sup_x |\\hat u(x+iy)|\\,e^{-r|y|}/(1+|z|)^{${st.N}} = ${v.fix(st.ratio, 4)}$: bounded, as the theorem says, with $N=${st.N}$ the order of $u$.`);
      },
    },
    // ------------------------------------------------------------------ Sobolev
    {
      num: '7.25',
      kind: 'Theorem',
      name: "Sobolev's lemma",
      credit: 'Sobolev, 1938',
      statement: String.raw`Suppose $\Omega\subset\R^n$ is open, $p$ and $r$ are integers with $p>r+\frac n2$, and $f\in L^2_{loc}(\Omega)$ is such that its distribution derivatives $D^\alpha f$ belong to $L^2_{loc}(\Omega)$ for all $|\alpha|\le p$. Then $f$ agrees almost everywhere with a function in $C^{(r)}(\Omega)$. In particular, if $D^\alpha f\in L^2_{loc}$ for every $\alpha$, then $f$ is (a.e. equal to) a $C^\infty$ function.`,
      idea: String.raw`Localise with a cutoff, so $f$ has compact support and $D^\alpha f\in L^2$ for $|\alpha|\le p$. By Plancherel, $(1+|t|)^p\hat f\in L^2$. Cauchy–Schwarz then gives
$$\int|t|^r|\hat f|\le\Big(\int(1+|t|)^{2p}|\hat f|^2\Big)^{1/2}\Big(\int(1+|t|)^{2r-2p}\Big)^{1/2},$$
and the last integral is finite exactly when $2p-2r>n$. So $t^\alpha\hat f\in L^1$ for $|\alpha|\le r$, and the inversion formula exhibits $f$ as a $C^{(r)}$ function. The condition $p>n/2$ (for $r=0$) is sharp, as the examples show.`,
      caption: String.raw`Left ($n=1$, $p=1$): $f(x)=|x|^\beta$. Its derivative is in $L^2$ iff $\beta>\frac12$, and then Cauchy–Schwarz traps the graph inside the envelope $f(0)\pm\|f'\|_2|x|^{1/2}$ (dashed): continuity with Hölder exponent $\frac12$. For $\beta\le\frac12$ the hypothesis fails (the envelope disappears), and for $\beta\le0$ continuity really is lost. Right ($n=2$): $f=\log\log(e/|x|)$, truncated at radius $\varepsilon$. Shrink $\varepsilon$: the maximum $\log\log(e/\varepsilon)$ blows up while $\int|\nabla f|^2$ stays below $2\pi$ — $f\in H^1$ but unbounded, because $p=1$ is not $>n/2=1$.`,
      deps: ['fa-7.9', 'fa-7.7', 'fa-6.32'],
      tags: ['Sobolev', 'regularity', 'Plancherel'],
      verify: true,
      viz(v) {
        const M = v.M;
        const bS = v.slider('$\\beta$ in $|x|^\\beta$', -0.4, 1.5, 0.75, { step: 0.01 });
        const eS = v.slider('$\\log_{10}\\varepsilon$', -8, -0.3, -2, { step: 0.05, fmt: (x) => `ε = ${(10 ** x).toExponential(1)}` });
        const L = v.stage({ x: [-1, 1], y: [-0.6, 2.2], height: 300, axes: true, title: '$n=1$: $|x|^\\beta$ and the Sobolev envelope' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 300, axes: false, ticks: false, title: '$n=2$: $\\log\\log(e/|x|)$, truncated at $|x|=\\varepsilon$' });
        let st = {};
        v.legend([['blue', '$f$'], ['green', '$f(0)\\pm\\|f\'\\|_2|x|^{1/2}$', { dash: true }]]);
        v.render(() => {
          const b = bS.value, eps = 10 ** eS.value;
          const f = (x) => Math.pow(Math.abs(x), b);
          const fin = b > 0.5, nd = fin ? Math.sqrt(2 * b * b / (2 * b - 1)) : Infinity;
          L.fn((x) => Math.min(f(x), 3), { color: 'blue', width: 2.6, n: 1200 });
          if (fin) {
            const f0 = 0;
            L.fn((x) => f0 + nd * Math.sqrt(Math.abs(x)), { color: 'green', width: 1.6, dash: [6, 4] });
            L.fn((x) => f0 - nd * Math.sqrt(Math.abs(x)), { color: 'green', width: 1.6, dash: [6, 4] });
            L.between((x) => nd * Math.sqrt(Math.abs(x)), (x) => -nd * Math.sqrt(Math.abs(x)), -1, 1, { fill: 'green', fillAlpha: 0.06 });
          }
          L.corner(fin ? `‖f′‖₂ = ${v.fmt(nd, 3)}: f ∈ H¹` : `‖f′‖₂ = ∞: hypothesis fails`, 'tl', { color: fin ? 'green' : 'red', weight: 600 });
          // 2D
          const Lg = (r) => Math.log(Math.log(Math.E / Math.max(r, eps)));
          const top = Lg(eps);
          R.raster((x, y) => { const r = Math.hypot(x, y); if (r > 1) return null; return M.cmap(Lg(r) / Math.max(top, 1e-9), 'magma'); }, { key: eS.value.toFixed(3), res: 2 });
          R.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          R.circle(0, 0, Math.max(eps, 0.004), { color: 'green', width: 1.6 });
          const E = 2 * Math.PI * (1 - 1 / Math.log(Math.E / eps));
          R.corner(`max f = ${v.fmt(top, 3)}`, 'tl', { color: 'ink', weight: 600 });
          R.corner(`∫|∇f|² = ${v.fmt(E, 4)} < 2π`, 'bl', { color: 'green', weight: 600 });
          st = { b, fin, nd, top, E, eps };
        });
        v.readout(() => {
          const s = st;
          const one = s.fin ? `$\\beta=${v.fix(s.b, 2)}$: $\\|f'\\|_{L^2(-1,1)} = ${v.fix(s.nd, 3)}$, so $|f(x)-f(0)|\\le${v.fix(s.nd, 3)}\\,|x|^{1/2}$.` : `$\\beta=${v.fix(s.b, 2)}$: $f'\\notin L^2$ ` + (s.b > 0 ? '(yet $f$ happens to be continuous).' : 'and $f$ is not even bounded near $0$.');
          return `${one} In the plane: $\\max f = ${v.fix(s.top, 3)}\\to\\infty$ while $\\int|\\nabla f|^2 = ${v.fix(s.E, 4)}\\le2\\pi$.`;
        });
      },
    },
  ],
};
