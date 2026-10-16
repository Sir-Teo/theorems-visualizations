// Numerical Analysis — Chapter 1: Floating point and the anatomy of error (items 1.7–1.12)
import {
  FORMATS, clamp, logspace, sci, tsci, rnd, mkOps, ulpOf, ratioNum, px, exactDecimal,
} from './ch01.shared.js';

const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const sciTex = (x, d = 2) => tsci(x, d);
/** Word-wrap a string to lines of at most n characters. */
function wrap(str, n) { const out = []; let cur = ''; for (const w of str.split(' ')) { if ((cur + ' ' + w).length > n && cur) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) out.push(cur); return out; }

export default {
  collection: 'num',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Phenomenon',
      name: 'Truncation versus rounding in finite differences',
      statement: String.raw`Approximating $f'(x)$ by the forward difference $D_h=\dfrac{f(x+h)-f(x)}{h}$ has two competing errors. The **truncation error** is $\tfrac h2|f''(\xi)|$, shrinking linearly in $h$. The **rounding error** comes from evaluating $f(x+h)-f(x)$ with absolute noise of order $u\,(|f|+|xf'|)$ and dividing by $h$: it grows like $u/h$. The total is U-shaped with its minimum near $h^\ast\approx\sqrt{u}$ (about $10^{-8}$ in binary64), where the best attainable error is only about $\sqrt u\approx10^{-8}$, half of the digits. A central difference has truncation $O(h^2)$ and optimum $h^\ast\sim u^{1/3}$ with error $\sim u^{2/3}$; a five-point formula $O(h^4)$ with $h^\ast\sim u^{1/5}$ and error $\sim u^{4/5}$.`,
      idea: String.raw`Taylor's theorem with remainder bounds the truncation error by $C h^p$ with $p=1,2,4$. For small $h$ the two values $f(x+h)$ and $f(x)$ agree in most leading bits, so their difference is a cancellation (1.4): its absolute error is the rounding noise of $f$, and dividing by $h$ amplifies that noise by $1/h$. Balancing $Ch^p$ against $u/h$ gives $h^\ast\sim u^{1/(p+1)}$ and an optimal error of order $u^{p/(p+1)}$: higher-order formulas help but can never reach $u$.`,
      caption: String.raw`The measured relative error (blue) against the step $h$ on log–log axes, with the predicted truncation line (orange, slope $p$) and rounding line (red, slope $-1$); the green line marks the best $h$ found. Change function, formula and precision, and drag $x$ and $h$. **Right:** zoom to $h$ of a few ulps: the computed quotient is a staircase, because $x+h$ and $f(x+h)$ are rounded.`,
      deps: ['num-1.4', 'pma-5.15'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['finite differences', 'rounding'],
      viz(v) {
        const FN = {
          sin: { lab: 'sin x', f: Math.sin, d: (k, x) => Math.sin(x + k * Math.PI / 2) },
          exp: { lab: 'eˣ', f: Math.exp, d: (k, x) => Math.exp(x) },
          log: { lab: 'ln x', f: Math.log, d: (k, x) => (k === 0 ? Math.log(x) : (k % 2 ? 1 : -1) * fact(k - 1) / x ** k) },
        };
        const METH = {
          fwd: { lab: 'forward', p: 1, C: 1 / 2, k: 2, tex: '\\tfrac h2|f\'\'|', q: (f, x, h, o) => o.div(o.sub(f(o.r(x + h)), f(x)), h) },
          ctr: { lab: 'central', p: 2, C: 1 / 6, k: 3, tex: '\\tfrac{h^2}{6}|f\'\'\'|', q: (f, x, h, o) => o.div(o.sub(f(o.r(x + h)), f(o.r(x - h))), o.r(2 * h)) },
          five: { lab: 'five-point', p: 4, C: 1 / 30, k: 5, tex: '\\tfrac{h^4}{30}|f^{(5)}|', q: (f, x, h, o) => { const a = o.sub(f(o.r(x - 2 * h)), f(o.r(x + 2 * h))), b = o.mul(8, o.sub(f(o.r(x + h)), f(o.r(x - h)))); return o.div(o.add(a, b), o.r(12 * h)); } },
        };
        const fn = v.select('function', Object.entries(FN).map(([k, f]) => ({ value: k, label: f.lab })), 'sin');
        const me = v.select('formula', Object.entries(METH).map(([k, m]) => ({ value: k, label: m.lab })), 'fwd');
        const pr = v.select('precision', [{ value: 'single', label: 'binary32' }, { value: 'double', label: 'binary64' }], 'double');
        const sx = v.slider('$x$', 0.3, 3, 1, { step: 0.05 });
        const sh = v.slider('$h$', 1e-17, 1, 1e-6, { log: true, sig: 2, fmt: (x) => sci(x, 2) });
        const sE = v.stage({ x: [1e-17, 1], y: [1e-14, 30], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 340, xlabel: 'step h', ylabel: 'relative error of the derivative', title: 'the V-shaped error curve' });
        const sS = v.stage({ x: [0, 40], y: [-0.5, 3], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'h in units of ulp(x)', ylabel: 'computed quotient / f′(x)', title: 'forward difference with h of a few ulps' });
        const setup = () => {
          const F = FORMATS[pr.value], o = mkOps(F), f = (t) => o.r(FN[fn.value].f(t)), x = o.r(sx.value), M = METH[me.value];
          const fd = FN[fn.value].d, d1 = fd(1, x), u = F.u;
          const trunc = (h) => Math.abs(M.C * fd(M.k, x)) * h ** M.p / Math.abs(d1);
          const round = (h) => u * (Math.abs(fd(0, x)) + Math.abs(x * d1)) / h / Math.abs(d1);
          return { F, o, f, x, M, d1, trunc, round, err: (h) => Math.abs(M.q(f, x, h, o) - d1) / Math.abs(d1) };
        };
        let S = null;
        v.render(() => {
          S = setup();
          const hs = logspace(1e-17, 1, 360), E = hs.map((h) => [h, Math.max(S.err(h), 1e-15)]);
          sE.path(hs.map((h) => [h, S.trunc(h)]), { color: 'orange', width: 1.8, dash: true });
          sE.path(hs.map((h) => [h, S.round(h)]), { color: 'red', width: 1.8, dash: true });
          sE.path(E, { color: 'blue', width: 2.2 });
          let best = E[0]; for (const e of E) if (e[1] < best[1]) best = e;
          const hopt = hs.reduce((a, h) => (S.trunc(h) + S.round(h) < S.trunc(a) + S.round(a) ? h : a), hs[0]);
          S.best = best; S.hopt = hopt;
          sE.vline(hopt, { color: 'green', width: 1.5, dash: true }); sE.vline(sh.value, { color: 'gold', width: 1.8 });
          sE.dot(sh.value, Math.max(S.err(sh.value), 1e-15), { r: 5.5, color: 'gold' });
          sE.text('truncation', 1e-1, S.trunc(0.1) * 0.25, { size: 11, color: 'orange', align: 'right' });
          sE.text('rounding ≈ u(|f|+|xf′|)/h', 1e-13, S.round(1e-13) * 8, { size: 11, color: 'red', align: 'left' });
          // staircase
          const g = ulpOf(S.x, S.F), pts = [];
          for (let k = 0; k <= 600; k++) { const t = 0.05 + k * 39.95 / 600, h = t * g, q = METH.fwd.q(S.f, S.x, h, S.o); pts.push([t, q / S.d1]); }
          sS.hline(1, { color: 'green', dash: true });
          sS.path(pts, { color: 'blue', width: 1.6 });
          sS.text('exact f′(x)', 39.5, 1.08, { align: 'right', size: 11, color: 'green' });
        });
        v.legend([['blue', 'measured error'], ['orange', 'truncation $\\approx Ch^p$', { dash: true }], ['red', 'rounding $\\approx u/h$', { dash: true }], ['green', 'best $h$', { dash: true }], ['gold', 'chosen $h$']]);
        v.readout(() => {
          if (!S) return '';
          const e = S.err(sh.value), M = S.M, p = M.p;
          return `${M.lab} formula (order $p=${p}$), $x=${S.x}$: at $h=${sciTex(sh.value)}$ the relative error is **${sci(e, 2)}**; model: truncation ${sci(S.trunc(sh.value), 2)}, rounding ${sci(S.round(sh.value), 2)}.\nBest measured error **${sci(S.best[1], 2)}** at $h\\approx${sciTex(S.best[0])}$; the model's optimum is $h^\\ast\\approx${sciTex(S.hopt)}$, near $u^{1/${p + 1}}=${sciTex(S.F.u ** (1 / (p + 1)))}$ ($u=${sciTex(S.F.u, 3)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Method',
      name: 'Complex-step differentiation',
      statement: String.raw`If $f$ is real-analytic with real values on the real axis, then
$$f(x+ih)=f(x)+ihf'(x)-\tfrac{h^2}{2}f''(x)-\tfrac{ih^3}{6}f'''(x)+\cdots,\qquad\text{so}\qquad f'(x)=\frac{\operatorname{Im}f(x+ih)}{h}+O(h^2).$$
The formula involves **no subtraction of nearby numbers**, so $h$ can be taken absurdly small (say $10^{-200}$) until the truncation error $\tfrac{h^2}{6}|f'''|$ is below $u$, and the derivative is then accurate to machine precision. Requirements: $f$ must be evaluated in complex arithmetic, and must be analytic (no $|x|$, $\max$ or comparisons).`,
      idea: String.raw`The real part of $f(x+ih)$ carries $f(x)$ and the imaginary part carries $hf'(x)$ on a different axis, so the tiny derivative information is never added to the big function value and never lost in a cancellation. The imaginary part is computed with the same *relative* accuracy as any other floating-point quantity; dividing by $h$ is exact scaling. It trades the cancellation barrier of 1.7 for the cost of complex arithmetic.`,
      caption: String.raw`Error against $h$ (down to $10^{-300}$) for forward and central differences and the complex step. The finite differences are V-shaped; the complex-step error falls like $h^2$ and then stays at the noise floor forever. Try the hard function $e^x/\sqrt{\sin^3x+\cos^3x}$ (Squire and Trapp's test). **Right:** $\operatorname{Im}f(x+ih)/h$ against $h$ on a linear axis, approaching $f'(x)$.`,
      deps: ['num-1.7', 'rca-10.5'],
      refs: ['Süli–Mayers ch. 2'],
      credit: 'Lyness & Moler (1967) introduced the idea; Squire & Trapp, SIAM Review 40 (1998), popularised it.',
      tags: ['differentiation', 'complex step'],
      viz(v) {
        const Cx = v.Cx;
        const FN = {
          sin: { lab: 'sin x', f: Math.sin, c: (x, h) => new Cx(x, h).sin(), d: Math.cos, dom: [0.1, 3] },
          exp: { lab: 'eˣ', f: Math.exp, c: (x, h) => new Cx(x, h).exp(), d: Math.exp, dom: [0.1, 3] },
          log: { lab: 'ln x', f: Math.log, c: (x, h) => new Cx(x, h).log(), d: (x) => 1 / x, dom: [0.2, 3] },
          hard: { lab: 'eˣ/√(sin³x+cos³x)', f: (x) => Math.exp(x) / Math.sqrt(Math.sin(x) ** 3 + Math.cos(x) ** 3),
            c: (x, h) => { const z = new Cx(x, h), s = z.sin(), c = z.cos(); return z.exp().div(s.mul(s).mul(s).add(c.mul(c).mul(c)).sqrt()); },
            d: (x) => { const S = Math.sin(x), C = Math.cos(x), f = Math.exp(x) / Math.sqrt(S ** 3 + C ** 3); return f * (1 - 1.5 * (S * S * C - C * C * S) / (S ** 3 + C ** 3)); }, dom: [0.1, 2.2] },
        };
        const fn = v.select('function', Object.entries(FN).map(([k, f]) => ({ value: k, label: f.lab })), 'sin', { onChange: () => { const d = FN[fn.value].dom; if (sx.value < d[0] || sx.value > d[1]) sx.set(clamp(sx.value, d[0], d[1])); } });
        const sx = v.slider('$x$', 0.1, 3, 0.8, { step: 0.05 });
        const rng = v.select('range of h', [{ value: 1e-30, label: '10⁻³⁰ … 1' }, { value: 1e-300, label: '10⁻³⁰⁰ … 1' }], 1e-30);
        const sh = v.slider('$h$', 1e-300, 1, 1e-20, { log: true, sig: 2, fmt: (x) => sci(x, 2) });
        const sE = v.stage({ x: [1e-30, 1], y: [1e-17, 30], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 340, xlabel: 'step h', ylabel: 'relative error of f′(x)', title: 'error against step size' });
        const sI = v.stage({ x: [0, 2], y: [0, 1], axes: 'box', gutter: true, height: 340, minWidth: 280, xlabel: 'h', ylabel: 'Im f(x+ih) / h', title: 'the complex-step quotient' });
        let S = null;
        const evalAll = (h) => {
          const F = FN[fn.value], x = sx.value, d = F.d(x);
          const fw = (F.f(x + h) - F.f(x)) / h, ce = (F.f(x + h) - F.f(x - h)) / (2 * h), im = F.c(x, h).im / h;
          return { d, fw, ce, im, ef: Math.abs(fw - d) / Math.abs(d), ec: Math.abs(ce - d) / Math.abs(d), ei: Math.abs(im - d) / Math.abs(d) };
        };
        v.render(() => {
          const F = FN[fn.value], x = sx.value, d = F.d(x), hs = logspace(rng.value, 1, 420);
          sE.setView([rng.value, 1], [1e-17, 30]);
          const A = hs.map((h) => evalAll(h));
          const flo = (e) => Math.max(e, 1e-17);
          sE.path(hs.map((h, i) => [h, flo(A[i].ef)]), { color: 'red', width: 2 });
          sE.path(hs.map((h, i) => [h, flo(A[i].ec)]), { color: 'orange', width: 2 });
          sE.path(hs.map((h, i) => [h, flo(A[i].ei)]), { color: 'green', width: 2.4 });
          sE.hline(FORMATS.double.u, { color: 'muted', dash: true }); sE.vline(sh.value, { color: 'gold', width: 1.8 });
          const hq = Array.from({ length: 160 }, (_, k) => 0.005 + k * 1.995 / 159);
          const qs = hq.map((h) => F.c(x, h).im / h), lo = Math.min(...qs, d), hi = Math.max(...qs, d), pad = (hi - lo) * 0.25 + 1e-9;
          sI.setView([0, 2], [lo - pad, hi + pad]);
          sI.hline(d, { color: 'green', dash: true }); sI.path(hq.map((h, i) => [h, qs[i]]), { color: 'blue', width: 2.2 });
          if (sh.value <= 2) sI.dot(sh.value, F.c(x, sh.value).im / sh.value, { r: 5.5, color: 'gold' });
          sI.text('f′(x)', 1.95, d, { align: 'right', size: 11, color: 'green', dy: -12 });
        });
        v.legend([['red', 'forward difference'], ['orange', 'central difference'], ['green', 'complex step'], ['gold', 'chosen $h$']]);
        v.readout(() => {
          const A = evalAll(sh.value), h = sh.value, F = FN[fn.value], im = F.c(sx.value, h).im;
          return `$f'(x)=${A.d.toPrecision(16)}$ (analytic). At $h=${sciTex(h)}$: forward ${A.fw.toPrecision(16)} (rel. error ${sci(A.ef, 2)}), central ${A.ce.toPrecision(16)} (${sci(A.ec, 2)}), **complex step ${A.im.toPrecision(16)} (${A.ei === 0 ? 'exact to the last bit' : sci(A.ei, 2)})**.\nThe imaginary part of $f(x+ih)$ is $${sciTex(im, 4)}$: tiny, but stored with full relative precision.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'Unstable recurrences',
      statement: String.raw`The integrals $I_n=\int_0^1x^ne^{x-1}\,dx$ satisfy $I_0=1-e^{-1}$ and, by integration by parts, $I_n=1-nI_{n-1}$, with $0<I_n<\tfrac1n$ and $I_n\to0$. Run **forward**, an error $\varepsilon_0$ in $I_0$ becomes $(-1)^nn!\,\varepsilon_0$ in $I_n$: in binary64 the computed values are garbage beyond $n\approx17$ and eventually enormous. Run **backward**, $I_{n-1}=(1-I_n)/n$ starting from *any* guess at some large $N$, the error is multiplied by $1/n$ at each step and the result converges to the true values.`,
      idea: String.raw`A recurrence is a linear map applied repeatedly; whether a perturbation grows or decays depends on its multiplier ($-n$ forward, $-1/n$ backward), not on how accurately each step is carried out. A forward step with multiplier of size $>1$ amplifies all earlier rounding errors, so the algorithm is unstable even though each step is correctly rounded. The cure is to change the direction (or choose the other solution of the recurrence): *stability is a property of the algorithm*, not the problem, since the integrals themselves are perfectly well conditioned.`,
      caption: String.raw`**Left:** the true $I_n$ (green), the forward run (red) and the backward run (blue), starting from a crude guess. **Right:** their errors on a log axis against the prediction $n!\,|\varepsilon_0|$ (dashed): the forward error is exactly $n!$ times the rounding error of $I_0$. Raise $n_{\max}$, switch to binary32, or start the backward run from a very wrong value, and it still converges.`,
      deps: ['num-1.2'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['stability', 'recurrence'],
      viz(v) {
        const M = 120, SC = 300, two = 2n ** BigInt(SC);
        // exact values by a backward run in 300-bit fixed point from I_M = 0
        const exact = new Array(M + 1); { let I = 0n; exact[M] = I; for (let n = M; n >= 1; n--) { I = ((1n << BigInt(SC)) - I) / BigInt(n); exact[n - 1] = I; } }
        const exNum = (n) => ratioNum(exact[n], two);
        const errOf = (c) => { if (!Number.isFinite(c)) return Infinity; return n_ => 0; };
        const err = (c, n) => (Number.isFinite(c) ? Math.abs(ratioNum(BigInt(c * 2 ** SC) - exact[n], two)) : Infinity);
        const pr = v.select('precision', [{ value: 'single', label: 'binary32' }, { value: 'double', label: 'binary64' }], 'double');
        const nm = v.slider('$n_{\\max}$', 10, 45, 30, { int: true });
        const st = v.select('backward start $I_N$', [{ value: 0, label: '0' }, { value: 1, label: '1 (far off)' }], 0);
        const run = () => {
          const F = FORMATS[pr.value], o = mkOps(F), N = nm.value;
          const fw = [o.sub(1, o.r(Math.exp(-1)))]; for (let n = 1; n <= N; n++) fw.push(o.sub(1, o.mul(n, fw[n - 1])));
          const bw = new Array(N + 1); bw[N] = st.value; for (let n = N; n >= 1; n--) bw[n - 1] = o.div(o.sub(1, bw[n]), n);
          return { fw, bw, N, e0: err(fw[0], 0), eN: err(bw[N], N), F };
        };
        let R = null;
        const sV = v.stage({ x: [-0.5, 45.5], y: [-0.25, 1.05], axes: 'box', gutter: true, height: 320, minWidth: 320, xlabel: 'n', ylabel: 'Iₙ', title: 'the computed values' });
        const sE = v.stage({ x: [-0.5, 45.5], y: [1e-20, 1e45], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 320, xlabel: 'n', ylabel: '|computed − exact|', title: 'the errors' });
        v.render(() => {
          R = run(); const { fw, bw, N, e0, eN } = R, ns = Array.from({ length: N + 1 }, (_, i) => i);
          sV.hline(0, { color: 'faint' });
          sV.path(ns.map((n) => [n, exNum(n)]), { color: 'green', width: 7, alpha: 0.4 });
          const cut = fw.findIndex((x) => !(Math.abs(x) < 1.2)), keep = ns.filter((n) => cut < 0 || n < cut);
          sV.path(keep.map((n) => [n, fw[n]]), { color: 'red', width: 2 }); sV.dots(keep.map((n) => [n, fw[n]]), { r: 3, color: 'red' });
          if (cut >= 0) { sV.arrow(cut, 0.7, cut, 1.0, { color: 'red', width: 2.2, head: 8 }); sV.text(`forward values leave the picture from n = ${cut}`, cut + 0.8, 0.82, { size: 11, color: 'red', align: 'left' }); }
          sV.path(ns.map((n) => [n, bw[n]]), { color: 'blue', width: 2 }); sV.dots(ns.map((n) => [n, bw[n]]), { r: 3, color: 'blue' });
          const eF = ns.map((n) => [n, Math.max(err(fw[n], n), 1e-20)]), eB = ns.map((n) => [n, Math.max(err(bw[n], n), 1e-20)]);
          sE.path(eF.filter((p) => Number.isFinite(p[1])), { color: 'red', width: 2 }); sE.path(eB, { color: 'blue', width: 2 });
          sE.path(ns.map((n) => [n, Math.max(fact(n) * e0, 1e-20)]), { color: 'orange', width: 1.8, dash: true });
          sE.path(ns.map((n) => [n, Math.max(eN * fact(n) / fact(N), 1e-20)]), { color: 'purple', width: 1.8, dash: true });
          sE.hline(R.F.u, { color: 'muted', dash: true });
          sE.vline(N, { color: 'muted', alpha: 0.5 });
        });
        v.legend([['green', 'exact $I_n$', { area: true }], ['red', 'forward run'], ['blue', 'backward run'], ['orange', '$n!\\,|\\varepsilon_0|$', { dash: true }], ['purple', 'backward prediction', { dash: true }]]);
        v.readout(() => {
          const { fw, bw, N, e0, F } = R, nb = Math.min(N, 40);
          const firstBad = fw.findIndex((x, n) => !(err(x, n) < 0.5 * exNum(n)));
          return `$I_0=1-e^{-1}$ was stored with error $\\varepsilon_0=${sciTex(e0)}$ (${F.name}). Forward at $n=${N}$: $I_N=${Number.isFinite(fw[N]) ? sciTex(fw[N], 3) : '\\infty'}$ (true value ${exNum(N).toPrecision(5)}); the forward run first loses all accuracy at $n=${firstBad < 0 ? '>' + N : firstBad}$.\nBackward from $I_{${N}}=${st.value}$: $I_0=${bw[0].toPrecision(F.key === 'single' ? 8 : 16)}$, true ${exNum(0).toPrecision(F.key === 'single' ? 8 : 16)}, error ${sci(err(bw[0], 0), 2)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Method',
      name: 'Avoiding overflow: the log-sum-exp trick',
      statement: String.raw`To compute $\operatorname{LSE}(x)=\log\sum_{i}e^{x_i}$ (or the softmax $p_i=e^{x_i}/\sum_je^{x_j}$) do **not** evaluate the exponentials directly: $e^{x}$ overflows for $x>\log(\text{realmax})\approx709.78$ (binary64; $88.72$ in binary32) and underflows to $0$ below about $-745$. With $m=\max_ix_i$ use the identity
$$\log\sum_ie^{x_i}=m+\log\sum_ie^{x_i-m},$$
in which every exponent is $\le0$, the largest term is exactly $1$, so the sum lies in $[1,n]$: no overflow, and no total underflow.`,
      idea: String.raw`The identity is exact algebra: factor $e^{m}$ out of the sum. Numerically it moves the problem from a range where exponentials leave the floating-point range to one where all arguments of $\exp$ lie in $[-\infty,0]$ and the dominant term is $1$. Small terms may still underflow to $0$, but they contribute below $u$ to the sum anyway. Softmax is shift-invariant for the same reason, which is why every machine-learning library subtracts the maximum.`,
      caption: String.raw`Drag the four values $x_i$ (the red zones are where $e^{x}$ overflows, the grey zone where it underflows to $0$ in the chosen format). The bars show the base-10 exponent of each term in the naive formula (red) and after shifting by the maximum (green): the naive terms leave the representable band; the shifted ones never do. The readout compares both results.`,
      deps: ['num-1.1'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['overflow', 'softmax'],
      viz(v) {
        const fmt = v.select('format', [{ value: 'half', label: 'binary16' }, { value: 'single', label: 'binary32' }, { value: 'double', label: 'binary64' }], 'double');
        const sH = v.stage({ x: [-1100, 1100], y: [0, 1], axes: false, height: 200, full: true, title: 'the inputs xᵢ (drag)' });
        const sB = v.stage({ x: [0, 5], y: [-500, 500], axes: 'box', gutter: true, height: 300, full: true, ylabel: 'log₁₀ of the term', title: 'size of each exponential, as a power of ten' });
        const ys = [0.8, 0.6, 0.4, 0.2], cols = ['blue', 'orange', 'purple', 'teal'], init = [1000, 1001, 999, 500];
        const hs = ys.map((y, i) => sH.handle(init[i], y, { color: cols[i], label: 'x' + (i + 1), constrain: (x) => [clamp(x, -1090, 1090), y] }));
        const run = () => {
          const F = FORMATS[fmt.value], o = mkOps(F), xs = hs.map((h) => h.x), m = Math.max(...xs);
          const naiveTerms = xs.map((x) => o.r(Math.exp(x))), shiftTerms = xs.map((x) => o.r(Math.exp(o.sub(x, m))));
          let sn = 0, ss = 0; for (const t of naiveTerms) sn = o.add(sn, t); for (const t of shiftTerms) ss = o.add(ss, t);
          const naive = o.r(Math.log(sn)), stable = o.add(m, o.r(Math.log(ss)));
          let ref = 0; for (const x of xs) ref += Math.exp(x - m); const refv = m + Math.log(ref);
          return { F, xs, m, naiveTerms, shiftTerms, sn, ss, naive, stable, refv, probs: shiftTerms.map((t) => o.div(t, ss)) };
        };
        let R = null;
        v.render(() => {
          R = run(); const F = R.F, lnMax = Math.log(F.max), lnMin = (F.emin - F.fb - 1) * Math.LN2;
          sH.vband(lnMax, 1100, { color: 'red', alpha: 0.12 }); sH.vband(-1100, lnMin, { color: 'muted', alpha: 0.18 });
          sH.line(-1100, 0.08, 1100, 0.08, { color: 'faint', width: 1.5 });
          for (const t of [-1000, -750, -500, -250, 0, 250, 500, 750, 1000]) { sH.line(t, 0.05, t, 0.11, { color: 'faint' }); sH.text(String(t), t, 0.0, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' }); }
          sH.vline(R.m, { color: 'green', width: 1.5, dash: true });
          sH.text(`eˣ overflows for x > ${lnMax.toFixed(2)}`, 1090, 0.95, { size: 11, color: 'red', align: 'right' });
          sH.text(`eˣ rounds to 0 for x < ${lnMin.toFixed(1)}`, -1090, 0.95, { size: 11, color: 'muted', align: 'left' });
          sH.text('max', R.m, 0.12, { size: 10.5, color: 'green', align: 'center' });
          // bars
          const L = Math.log10(F.max), Lm = Math.log10(F.sub / 2);
          sB.hband(L, 500, { color: 'red', alpha: 0.12 }); sB.hband(-500, Lm, { color: 'muted', alpha: 0.2 });
          sB.hline(0, { color: 'faint' });
          R.xs.forEach((x, i) => {
            const a = x / Math.LN10, b = (x - R.m) / Math.LN10, x0 = i + 0.5, over = !Number.isFinite(R.naiveTerms[i]);
            sB.rect(x0 - 0.38, 0, x0 - 0.02, clamp(a, -500, 500), { fill: 'red', fillAlpha: over ? 0.7 : 0.45, color: 'red', width: 1 });
            sB.rect(x0 + 0.02, 0, x0 + 0.38, b, { fill: 'green', fillAlpha: 0.5, color: 'green', width: 1 });
            sB.text('x' + (i + 1), x0, -478, { align: 'center', size: 11, color: cols[i] });
            if (over) sB.text('∞', x0 - 0.2, clamp(a, -500, 500) + 24, { align: 'center', size: 15, weight: 800, color: 'red' });
            else if (R.naiveTerms[i] === 0) sB.text('0', x0 - 0.2, -22, { align: 'center', size: 13, weight: 800, color: 'red' });
          });
          sB.text(`largest ${F.name} number ≈ ${sci(F.max, 2)}`, 4.95, Math.max(L + 14, 40), { size: 11, color: 'red', align: 'right' });
          sB.text(`smallest (subnormal) ${F.name} number ≈ ${sci(F.sub, 2)}`, 4.95, Math.min(Lm - 18, -40), { size: 11, color: 'muted', align: 'right' });
        });
        v.legend([['red', 'naive: $e^{x_i}$'], ['green', 'shifted: $e^{x_i-m}$']]);
        v.readout(() => {
          const r = R, f = (x) => (Number.isFinite(x) ? x.toPrecision(r.F.key === 'half' ? 5 : r.F.key === 'single' ? 8 : 16) : x > 0 ? '∞' : x < 0 ? '−∞' : 'NaN');
          const naiveTxt = Number.isFinite(r.naive) ? f(r.naive) : (r.sn === Infinity ? '**∞** (the sum overflowed)' : '**−∞** (every term underflowed to 0)');
          return `Naive $\\log\\sum e^{x_i}$: ${naiveTxt}.  Shifted by $m=${r.m.toFixed(1)}$: **${f(r.stable)}** (reference ${r.refv.toPrecision(16)}).\nSoftmax from the shifted terms: ${r.probs.map((p) => p.toPrecision(4)).join(', ')} (sum ${r.probs.reduce((a, b) => a + b, 0).toPrecision(5)}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Concept',
      name: 'Condition number of evaluating a function',
      statement: String.raw`The **relative condition number** of evaluating a differentiable function $f$ at $x$ (with $f(x)\neq0$) is
$$\kappa_f(x)=\lim_{\delta\to0}\ \sup_{|\Delta x|\le\delta|x|}\ \frac{|f(x+\Delta x)-f(x)|/|f(x)|}{|\Delta x|/|x|}=\left|\frac{x\,f'(x)}{f(x)}\right|.$$
It is the factor by which a relative error in the input is magnified in the output, *whatever algorithm is used*: even a correctly rounded $\mathrm{fl}(f(x))$ for the rounded input has relative error about $\kappa_f(x)\,u$. A problem with large $\kappa$ is **ill-conditioned**; examples are $\log x$ near $1$, $\tan x$ near $\pi/2$ and $x-1$ near $1$ (subtraction is ill-conditioned exactly when its result is small, which is 1.4 seen from the problem's side).`,
      idea: String.raw`To first order $f(x+\Delta x)-f(x)\approx f'(x)\Delta x$, so dividing by $|f(x)|$ and writing $\Delta x=\delta x$ gives $|\Delta f/f|\approx|xf'/f|\,\delta$. The condition number belongs to the *problem*; stability (1.9) belongs to the *algorithm*. A stable algorithm applied to an ill-conditioned problem still loses $\log_{10}\kappa$ digits.`,
      caption: String.raw`Choose a function and drag the point along its graph. The orange band on the $x$-axis is the input uncertainty $\pm\delta x$ and the green band on the $y$-axis the resulting spread of $f$. **Right:** 400 random relative perturbations as points (input change, output change); they fall on the line of slope $\pm\kappa$ predicted to first order (curvature shows at large $\delta$). **Bottom:** $\kappa(x)$ on a log scale.`,
      deps: ['nla-3.1', 'num-1.2'],
      refs: ['Süli–Mayers ch. 2'],
      tags: ['conditioning'],
      viz(v) {
        const FN = {
          log: { lab: 'ln x', f: Math.log, k: (x) => Math.abs(1 / Math.log(x)), dom: [0.05, 4], yr: [-3.2, 1.8], x0: 1.15 },
          tan: { lab: 'tan x', f: Math.tan, k: (x) => Math.abs(2 * x / Math.sin(2 * x)), dom: [0.05, 3], yr: [-8, 8], x0: 1.4 },
          sub: { lab: 'x − 1', f: (x) => x - 1, k: (x) => Math.abs(x / (x - 1)), dom: [0.05, 3], yr: [-1.2, 2.2], x0: 1.15 },
          sqrt: { lab: '√x', f: Math.sqrt, k: () => 0.5, dom: [0.02, 4], yr: [0, 2.4], x0: 1.5 },
          exp: { lab: 'eˣ', f: Math.exp, k: (x) => Math.abs(x), dom: [-3, 3], yr: [0, 20], x0: 2 },
          sin: { lab: 'sin x', f: Math.sin, k: (x) => Math.abs(x / Math.tan(x)), dom: [0.05, 6.3], yr: [-1.4, 1.4], x0: 3 },
        };
        const fn = v.select('function', Object.entries(FN).map(([k, f]) => ({ value: k, label: f.lab })), 'log', { onChange: () => { const F = FN[fn.value]; h.set(F.x0, 0); setupView(); } });
        const sd = v.slider('relative perturbation $\\delta$', 1e-8, 0.1, 0.02, { log: true, sig: 2, fmt: (x) => sci(x, 2) });
        const sA = v.stage({ x: [0, 4], y: [-3, 2], axes: true, height: 330, minWidth: 320, title: 'graph of f and the uncertainty bands' });
        const sC = v.stage({ x: [-1, 1], y: [-1, 1], axes: true, height: 330, minWidth: 300, title: 'random perturbations: input change vs output change' });
        const sK = v.stage({ x: [0, 4], y: [0.1, 1000], ylog: true, axes: 'box', gutter: true, height: 200, full: true, xlabel: 'x', ylabel: 'κ(x)', title: 'relative condition number' });
        const h = sA.handle(FN.log.x0, 0, { color: 'accent', label: 'x', constrain: (x) => { const F = FN[fn.value], xx = clamp(x, F.dom[0], F.dom[1]); return [xx, clamp(F.f(xx), F.yr[0], F.yr[1])]; } });
        function setupView() { const F = FN[fn.value]; sA.setView(F.dom, F.yr); sK.setView(F.dom, [0.1, 1000]); }
        setupView();
        let R = null;
        v.render(() => {
          const F = FN[fn.value], x = clamp(h.x, F.dom[0], F.dom[1]), fx = F.f(x), d = sd.value, kap = F.k(x), r = v.rng(3);
          const pts = Array.from({ length: 400 }, () => { const e = (r() * 2 - 1) * d, y = F.f(x * (1 + e)); return [e, (y - fx) / fx]; });
          const outs = pts.map((p) => p[1]), lo = Math.min(...outs), hi = Math.max(...outs), ratio = Math.max(...pts.map((p) => Math.abs(p[1]) / Math.max(Math.abs(p[0]), 1e-300)));
          R = { x, fx, kap, ratio, lo, hi };
          sA.setView(F.dom, F.yr);
          sA.fn(F.f, { color: 'accent', width: 2.2 });
          const flo = F.f(x * (1 - d)), fhi = F.f(x * (1 + d)), a = Math.min(flo, fhi), b = Math.max(flo, fhi);
          sA.vband(x * (1 - d), x * (1 + d), { color: 'orange', alpha: 0.28 });
          sA.hband(a, b, { color: 'green', alpha: 0.28 });
          sA.dot(x, clamp(fx, F.yr[0], F.yr[1]), { r: 5, color: 'accent' });
          const m = Math.max(...pts.map((p) => Math.abs(p[1])), kap * d) * 1.1;
          sC.setView([-d * 1.1, d * 1.1], [-m, m]);
          const sl = (F.f(x * (1 + 1e-7)) - fx) / fx / 1e-7; sC.line(-d, -sl * d, d, sl * d, { color: 'green', width: 2, dash: true });
          sC.dots(pts, { r: 2.2, color: 'blue' });
          sC.text('slope = ±κ (first-order prediction)', -d * 1.04, m * 0.8, { align: 'left', size: 11, color: 'green' });
          sC.text('input change Δx/x', d * 1.05, 0, { align: 'right', size: 11, color: 'muted', dy: -12 });
          sC.text('output change Δf/f', 0, m * 0.93, { align: 'left', size: 11, color: 'muted', dx: 6 });
          sK.fn((t) => Math.min(Math.max(F.k(t), 0.1), 1000), { color: 'purple', width: 2.2 });
          sK.hline(1, { color: 'muted', dash: true }); sK.vline(x, { color: 'gold', width: 1.6 }); sK.dot(x, clamp(kap, 0.1, 1000), { r: 5, color: 'gold' });
        });
        v.legend([['accent', 'f(x)'], ['orange', 'input band', { area: true }], ['green', 'output band', { area: true }], ['blue', 'random perturbations', { dot: true }], ['purple', 'κ(x)']]);
        v.readout(() => {
          const { x, kap, ratio, lo, hi } = R;
          return `At $x=${x.toFixed(3)}$: $\\kappa=|xf'/f|=\\mathbf{${kap < 1e5 ? kap.toPrecision(4) : sciTex(kap, 3)}}$. A relative input perturbation up to $\\delta=${sciTex(sd.value)}$ changes $f$ by between ${sci(lo, 2)} and ${sci(hi, 2)} (relative); the largest measured amplification is **${ratio.toPrecision(4)}**.\nIn binary64 ($u=1.1\\times10^{-16}$) the unavoidable error from rounding the input alone is about $\\kappa u=${sciTex(kap * 1.11e-16, 2)}$, i.e. about ${Math.max(0, 16 - Math.log10(Math.max(kap, 1))).toFixed(1)} digits survive.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Event',
      name: 'The Patriot missile clock drift (1991)',
      statement: String.raw`On 25 February 1991, during the Gulf War, a Patriot battery at Dhahran, Saudi Arabia, failed to engage an incoming Iraqi Scud, which struck a barracks and killed 28 US soldiers. The US General Accounting Office (report GAO/IMTEC-92-26, 1992) traced the failure to a software error in time-keeping: the system counted time in tenths of a second as an integer and converted to seconds by multiplying by $0.1$ stored in a **24-bit** register. The binary expansion of $\tfrac1{10}=0.0001100110011\ldots_{(2)}$ does not terminate, and the stored, *chopped* value $0.00011001100110011001100_{(2)}$ is too small by about $9.5\times10^{-8}$. The error is the same sign at every tick, so after $n$ ticks the clock error is $n\cdot9.5\times10^{-8}$ s: about $0.34$ s after roughly $100$ hours of continuous operation, during which a Scud travels over half a kilometre, outside the area where the tracking software looked for it.`,
      idea: String.raw`This is 1.3 and 1.6 in the wild: a decimal fraction that is not a binary fraction (1.1), converted with a one-sided rounding rule (chopping), so the representation error is a *bias* and accumulates linearly in the number of operations. Rounding to nearest would have reduced the error per tick (here to about $2\times10^{-8}$) but not removed the bias; the real remedy is not to store time as a rounded real at all, but to keep the integer tick count and convert only at the end (or to restart the system, the stopgap advised before a software update arrived).`,
      caption: String.raw`Choose the representation of $0.1$ and the number of fractional bits (the system had 23) and drag the uptime. The blue curve is the resulting tracking error for a Scud at the chosen speed; the simulation multiplies the exact tick count by the stored $0.1$, as the system did. The bit rows show $0.1$ and what the register keeps. Add a regular reboot to see the error saw-tooth. The 100-hour figures are *computed* here from the 24-bit model; the speed 1,676 m/s is the value quoted by secondary accounts, not a measurement.`,
      deps: ['num-1.1', 'num-1.6'],
      refs: ['Süli–Mayers ch. 2'],
      credit: 'US General Accounting Office, "Patriot Missile Defense: Software Problem Led to System Failure at Dhahran, Saudi Arabia", GAO/IMTEC-92-26, February 1992.',
      tags: ['rounding', 'case study'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/MIM-104_Patriot#Failure_at_Dhahran' },
      viz(v) {
        const rep = v.select('how 0.1 is stored', [{ value: 'chop', label: 'chopped (as in the Patriot)' }, { value: 'near', label: 'rounded to nearest' }, { value: 'int', label: 'integer ticks, no conversion' }], 'chop');
        const sb = v.slider('fraction bits $f$', 16, 32, 23, { int: true });
        const sh = v.slider('uptime (hours)', 0, 150, 100, { step: 1 });
        const sv = v.slider('Scud speed (m/s)', 500, 2500, 1676, { step: 10 });
        const sr = v.slider('reboot every (h, 0 = never)', 0, 100, 0, { int: true });
        const TPH = 36000; // ticks of 0.1 s per hour
        const perTick = () => {
          const f = BigInt(sb.value), two = 1n << f;
          if (rep.value === 'int') return { e: 0, c: null };
          const c = rep.value === 'chop' ? two / 10n : (2n * two + 10n) / 20n;
          return { e: ratioNum(two - 10n * c, 10n * two), c };
        };
        const errAt = (hrs) => { const T = sr.value ? hrs % sr.value : hrs; return perTick().e * T * TPH; };
        const sE = v.stage({ x: [0, 150], y: [-100, 1000], axes: 'box', gutter: true, height: 320, minWidth: 340, xlabel: 'hours since power-up', ylabel: 'tracking error (m)', title: 'where the Scud really is versus where the clock says' });
        const sB = v.stage({ axes: false, height: 320, minWidth: 320, title: 'the register: 0.1 in binary' });
        v.render(() => {
          const pt = perTick(), spd = sv.value, hrs = sh.value;
          const top = Math.max(300, ...[8, 20, 48, 72, 100, 150].map((t) => errAt(t) * spd)) * 1.15;
          sE.setView([0, 150], [-top * 0.08, top]);
          const hh = Array.from({ length: 301 }, (_, i) => i * 0.5);
          sE.path(hh.map((t) => [t, errAt(t) * spd]), { color: 'blue', width: 2.4 });
          if (!sr.value && pt.e > 0) for (const t of [8, 20, 48, 72, 100]) { const e = pt.e * t * TPH; sE.dot(t, e * spd, { r: 4, color: 'blue' }); sE.text(`${t} h: ${e.toFixed(3)} s`, t, e * spd, { size: 10.5, color: 'muted', align: t >= 100 ? 'right' : 'left', dx: t >= 100 ? -10 : 7, dy: t >= 100 ? -16 : 12 }); }
          sE.hline(500, { color: 'red', dash: true, alpha: 0.6 }); sE.text('half a kilometre', 148, 500, { align: 'right', size: 11, color: 'red', dy: 11 });
          sE.vline(hrs, { color: 'gold', width: 1.6 }); sE.dot(hrs, errAt(hrs) * spd, { r: 6, color: 'gold' });
          // bits
          const { w, h, Y } = px(sB), f = sb.value, nb = f + 10, left = 14, cw = Math.min(17, (w - 2 * left) / nb);
          const bit = (j) => Math.floor(0.1 * 2 ** j) % 2;
          const cell = (j, py, kept, label) => { const x0 = left + (j - 1) * cw, on = kept ? bit(j) : 0; sB.rect(x0, Y(py + 20), x0 + cw - 1.2, Y(py), { fill: kept ? 'blue' : 'red', fillAlpha: on ? 0.6 : 0.06, color: kept ? 'blue' : 'red', width: 0.8, radius: 2 }); };
          sB.text('true 0.1 = 0.0001100110011…₂', left, Y(24), { size: 12, color: 'ink', weight: 600 });
          for (let j = 1; j <= nb; j++) { const x0 = left + (j - 1) * cw; sB.rect(x0, Y(52), x0 + cw - 1.2, Y(32), { fill: j <= f ? 'blue' : 'red', fillAlpha: bit(j) ? 0.6 : 0.06, color: j <= f ? 'blue' : 'red', width: 0.8, radius: 2 }); }
          sB.line(left + f * cw - 0.6, Y(28), left + f * cw - 0.6, Y(100), { color: 'ink', width: 1.6, dash: true });
          sB.text(`${f}-bit register ends here`, left + f * cw - 6, Y(112), { size: 11, color: 'ink', align: 'right' });
          sB.text('bits beyond: lost', left + f * cw + 6, Y(112), { size: 11, color: 'red', align: 'left' });
          sB.text('stored value', left, Y(138), { size: 12, color: 'ink', weight: 600 });
          if (rep.value === 'int') { sB.text('time is kept as an integer count of tenths:', left, Y(170), { size: 13, color: 'green' }); sB.text('no conversion, no error', left, Y(192), { size: 13, color: 'green' }); }
          else {
            const lastBit = rep.value === 'near' ? Number((pt.c & 1n)) : bit(f);
            for (let j = 1; j <= nb; j++) {
              const x0 = left + (j - 1) * cw, on = j <= f ? Number((pt.c >> BigInt(f - j)) & 1n) : 0;
              sB.rect(x0, Y(166), x0 + cw - 1.2, Y(146), { fill: 'green', fillAlpha: on ? 0.6 : 0.06, color: 'green', width: 0.8, radius: 2 });
            }
            const val = Number(pt.c) / 2 ** f;
            sB.text(`${val.toFixed(12)}`, left, Y(188), { size: 12.5, color: 'green', weight: 600 });
            sB.text(`error per tick  0.1 − stored = ${sci(pt.e, 3)} s`, left, Y(210), { size: 12.5, color: 'ink' });
          }
          sB.text(`${(TPH).toLocaleString('en-US')} ticks per hour`, left, Y(h - 30), { size: 11, color: 'muted' });
          sB.text(`${pt.e ? (pt.e * TPH).toExponential(2) : '0'} s of drift per hour of uptime`, left, Y(h - 12), { size: 11, color: 'muted' });
        });
        v.readout(() => {
          const pt = perTick(), hrs = sh.value, e = errAt(hrs), dist = e * sv.value;
          return `After **${hrs} h** (${(hrs * TPH).toLocaleString('en-US')} ticks${sr.value ? `, ${hrs % sr.value} h since the last reboot` : ''}): clock error **${e.toFixed(4)} s**, so a target at ${sv.value} m/s is mislocated by **${dist.toFixed(0)} m**.\nPer tick the stored 0.1 is off by ${sci(pt.e, 3)} s (the Patriot's 24-bit register: $9.5\\times10^{-8}$ s). ${rep.value === 'int' ? 'Nothing is converted, so nothing drifts.' : `The error is one-sided, so it grows linearly with the tick count${rep.value === 'near' ? ' (rounding to nearest shrinks it here but the bias remains)' : ''}.`}`;
        });
      },
    },
  ],
};
