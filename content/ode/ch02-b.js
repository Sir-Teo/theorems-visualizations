// Ordinary Differential Equations & Dynamical Systems — Chapter 2 (part b): Peano, maximal solutions, comparison, perturbation
import { flow, flowEnd, scalarFlow, spline, sampleAt, PLANAR } from './ch02.shared.js';

/** Euler polygon x_{n+1} = x_n + h f(x_n) for x' = f(x) from x0 on [0, T]; optional kick added at step index nk. */
function euler(f, x0, h, T, nk = -1, kick = 0) {
  const n = Math.round(T / h), out = [[0, x0]]; let x = x0;
  for (let i = 0; i < n; i++) { x = x + h * f(x) + (i === nk ? kick : 0); out.push([(i + 1) * h, x]); }
  return out;
}
/** Least-squares slope of log y against log x. */
function logSlope(pts) {
  const P = pts.filter(([a, b]) => a > 0 && b > 0).map(([a, b]) => [Math.log(a), Math.log(b)]), n = P.length;
  if (n < 2) return NaN;
  const mx = P.reduce((s, p) => s + p[0], 0) / n, my = P.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0; for (const [a, b] of P) { sxy += (a - mx) * (b - my); sxx += (a - mx) * (a - mx); }
  return sxy / sxx;
}

export default {
  collection: 'ode',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Peano existence theorem',
      statement: String.raw`Let $f$ be continuous on the box $R=\{|t-t_0|\le a,\ |x-x_0|\le b\}$ and $M=\max_R|f|$, $\delta=\min(a,b/M)$. Then the initial value problem $\dot x=f(t,x)$, $x(t_0)=x_0$ has at least one solution on $[t_0-\delta,t_0+\delta]$. Without a Lipschitz condition there may be many: for $\dot x=\sqrt{|x|}$, $x(0)=0$, every function $x(t)=\tfrac14(t-c)_+^2$ with $c\ge0$ (and $x\equiv0$) is a solution.`,
      idea: String.raw`Build Euler polygons with step $h\to0$ (or, equivalently, solutions of smoothed problems). They stay in the box, have slopes bounded by $M$ and are therefore equicontinuous and uniformly bounded; the Arzelà–Ascoli theorem (Rudin 7.25) extracts a uniformly convergent subsequence, and passing to the limit in the integral equation (2.2) shows the limit is a solution. Which solution one gets can depend on the subsequence: continuity alone cannot select one.`,
      caption: String.raw`Euler polygons for $\dot x=\sqrt{|x|}$ (or $\dot x=x^{1/3}$) started at $0$ with a tiny kick of size $h^2$ at time $c$: as $h\to0$ they converge uniformly to $\tfrac14(t-c)^2$, a *different* solution for every $c$. With no kick the polygon stays at $0$. The right panel shows the distance to the limit shrinking, but the distance to the zero solution stays large.`,
      deps: ['ode-2.2', 'pma-7.25'],
      refs: ['Teschl §2.7'],
      credit: 'Peano, 1886',
      tags: ['existence', 'compactness', 'non-uniqueness'],
      viz(v) {
        const FS = {
          sqrt: { label: '$\\sqrt{|x|}$', f: (x) => Math.sqrt(Math.abs(x)), lim: (t, c, sg) => (t > c ? 0.25 * (t - c) * (t - c) : 0), top: (t) => 0.25 * t * t, Y: [-0.3, 1.1] },
          cube: { label: '$x^{1/3}$', f: (x) => Math.cbrt(x), lim: (t, c, sg) => (t > c ? sg * Math.pow((2 * (t - c)) / 3, 1.5) : 0), top: (t) => Math.pow((2 * t) / 3, 1.5), Y: [-1.4, 1.4] },
        };
        const which = v.select('$\\dot x=f(x)=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'sqrt');
        const pert = v.select('perturbation', [{ value: '0', label: 'none' }, { value: '+', label: 'kick $+$' }, { value: '-', label: 'kick $-$' }], '+');
        const ks = v.slider('step $h=2^{-k}$, $k$', 1, 9, 4, { int: true });
        const cs = v.slider('kick time $c$', 0, 1.5, 0.6, { step: 0.05 });
        const T = 2;
        const s = v.stage({ x: [0, T], y: [-0.3, 1.1], axes: 'box', gutter: true, height: 340, xlabel: 't', ylabel: 'x', title: 'Euler polygons from $x(0)=0$', weight: 1.3 });
        const sd = v.stage({ x: [1 / 1024, 0.6], y: [1e-4, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'h', ylabel: 'sup distance', title: 'distance to the limit and to $0$', weight: 1, minWidth: 250 });
        v.legend([['accent', 'Euler polygon'], ['green', 'limit solution', { dash: true }], ['muted', 'other solutions through $(0,0)$'], ['red', 'distance to $x\\equiv0$', { dot: true }], ['green', 'distance to the limit', { dot: true }]]);
        let info = null;
        v.render(() => {
          const F = FS[which.value], sg = pert.value === '-' ? -1 : 1, hasKick = pert.value !== '0', c = cs.value;
          s.setView([0, T], F.Y);
          const poly = (h) => { const nk = hasKick ? Math.round(c / h) : -1; return euler(F.f, 0, h, T, nk, sg * h * h); };
          // funnel of solutions through the origin
          const env = [], envn = [];
          for (let i = 0; i <= 120; i++) { const t = (T * i) / 120; env.push([t, F.top(t)]); envn.push([t, which.value === 'cube' ? -F.top(t) : 0]); }
          s.between((t) => F.top(t), (t) => (which.value === 'cube' ? -F.top(t) : 0), 0, T, { fill: 'muted', fillAlpha: 0.1 });
          s.path(env, { color: 'muted', width: 1.4 }); if (which.value === 'cube') s.path(envn, { color: 'muted', width: 1.4 });
          for (const cc of [0.4, 0.8, 1.2, 1.6]) { s.fn((t) => F.lim(t, cc, 1), { color: 'muted', width: 1, alpha: 0.6, domain: [0, T] }); if (which.value === 'cube') s.fn((t) => F.lim(t, cc, -1), { color: 'muted', width: 1, alpha: 0.6, domain: [0, T] }); }
          s.hline(0, { color: 'muted', width: 1, alpha: 0.6 });
          const lim = (t) => (hasKick ? F.lim(t, c, sg) : 0);
          s.fn(lim, { color: 'green', width: 2.6, dash: [6, 4], domain: [0, T], n: 400 });
          for (let k = 1; k < ks.value; k++) s.path(poly(Math.pow(2, -k)), { color: 'accent', width: 1.2, alpha: 0.25 });
          const P = poly(Math.pow(2, -ks.value));
          s.path(P, { color: 'accent', width: 2.8 });
          if (hasKick) s.dot(c, 0, { r: 4, color: 'red', hollow: true });
          // distance plot
          const dl = [], dz = [];
          for (let k = 1; k <= 10; k++) {
            const h = Math.pow(2, -k), Q = poly(h); let a = 0, b = 0;
            for (const [t, x] of Q) { a = Math.max(a, Math.abs(x - lim(t))); b = Math.max(b, Math.abs(x)); }
            dl.push([h, Math.max(a, 1e-5)]); dz.push([h, Math.max(b, 1e-5)]);
          }
          sd.path(dl, { color: 'green', width: 2.2 }); sd.path(dz, { color: 'red', width: 2.2 });
          dl.forEach(([h, y]) => sd.dot(h, y, { r: 3, color: 'green' })); dz.forEach(([h, y]) => sd.dot(h, y, { r: 3, color: 'red' }));
          const hc = Math.pow(2, -ks.value), j = ks.value - 1;
          sd.dot(hc, dl[j][1], { r: 6, color: 'gold' });
          // residual of the limit solution
          let res = 0; if (hasKick) for (let i = 1; i < 400; i++) { const t = (T * i) / 400, d = 1e-5, x = lim(t); if (Math.abs(t - c) < 2e-4) continue; res = Math.max(res, Math.abs((lim(t + d) - lim(t - d)) / (2 * d) - F.f(x))); }
          let M = 0; for (let i = 1; i < P.length; i++) M = Math.max(M, Math.abs(P[i][1] - P[i - 1][1]) / (P[i][0] - P[i - 1][0]));
          info = { dlast: dl[j][1], dzero: dz[j][1], res, hasKick, M, h: hc };
        });
        v.readout(() => {
          if (!info) return '';
          const { dlast, dzero, res, hasKick, M, h } = info;
          if (!hasKick) return `No perturbation: Euler from $0$ is stuck at the fixed point $0$ for every $h$ — it converges to the solution $x\\equiv0$, and only to that one.`;
          return `$h=${v.sci(h, 2)}$: polygon slopes are at most $M=${v.fix(M, 2)}$ (equicontinuity); $\\sup|\\text{polygon}-\\text{limit}|=${v.fix(dlast, 4)}$, $\\sup|\\text{polygon}-0|=${v.fix(dzero, 3)}$. The limit satisfies the ODE: residual $${v.sci(Math.max(res, 1e-13), 1)}$ away from the corner. Change $c$ or the sign of the kick and the polygons converge to a different solution of the same IVP.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Method',
      name: 'Euler’s method as a constructive proof',
      statement: String.raw`For $\dot x=f(t,x)$, $x(t_0)=x_0$, the *Euler polygon* with step $h$ is the piecewise linear curve through $x_{j+1}=x_j+h\,f(t_j,x_j)$, $t_j=t_0+jh$. If $f$ is continuous, polygons with $h\to0$ have uniformly convergent subsequences whose limits are solutions (Peano, 2.9). If $f$ is also Lipschitz in $x$ with constant $L$ and $|\ddot x|\le K$ along the solution, then the whole family converges, with error
$$\max_{t_j\le T}|x_j-x(t_j)|\le\frac{K h}{2L}\big(e^{L(T-t_0)}-1\big)=O(h).$$`,
      idea: String.raw`The local truncation error of one step is $\tfrac12Kh^2$ (Taylor, Rudin 5.15). Errors propagate: a discrepancy $e_j$ is multiplied by at most $(1+hL)$ by the Lipschitz condition, giving the discrete recursion $e_{j+1}\le(1+hL)e_j+\tfrac12Kh^2$, whose solution is the discrete form of Grönwall's inequality (2.5). Hence global error $=$ (number of steps $\sim1/h$) $\times$ local error $O(h^2)=O(h)$.`,
      caption: String.raw`Halve the step with the slider $k$ ($h=2^{-k}$) and watch the polygon (orange) approach the exact solution. The right panel plots the maximum error over $[0,2]$ against $h$ on log–log axes: the points lie on a line of slope $1$ (grey dashed guide), i.e. error $\propto h$, with the fitted slope in the readout.`,
      deps: ['ode-2.9'],
      refs: ['Teschl §2.7'],
      credit: 'Euler, 1768',
      tags: ['euler method', 'numerical'],
      viz(v) {
        const T = 2;
        const FS = {
          forced: { label: '$\\cos t-x$', f: (t, x) => Math.cos(t) - x, x0: 1 },
          logi: { label: '$x(1-x)$', f: (t, x) => x * (1 - x), x0: 0.1 },
          quad: { label: '$t-x^2$', f: (t, x) => t - x * x, x0: 0.5 },
        };
        const which = v.select('$\\dot x=f(t,x)=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'forced');
        const ks = v.slider('step $h=2^{-k}$, $k$', 1, 9, 3, { int: true });
        const s = v.stage({ x: [0, T], y: [-1, 2], axes: 'box', gutter: true, height: 340, xlabel: 't', ylabel: 'x', title: 'Euler polygon and exact solution', weight: 1.3 });
        const se = v.stage({ x: [1 / 1024, 1], y: [1e-4, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'h', ylabel: 'max error', title: 'error against step', weight: 1, minWidth: 250 });
        v.legend([['green', 'exact solution (RK4, $2\\cdot10^4$ steps)'], ['orange', 'Euler polygon'], ['muted', 'coarser polygons'], ['accent', 'error', { dot: true }], ['muted', 'slope 1', { dash: true }]]);
        let info = null;
        v.render(() => {
          const E = FS[which.value], x0 = E.x0, ex = scalarFlow(E.f, 0, x0, T, 20000, 1e9);
          const exAt = (t) => sampleAt(ex, t);
          let lo = Infinity, hi = -Infinity; for (let i = 0; i < ex.length; i += 40) { lo = Math.min(lo, ex[i][1]); hi = Math.max(hi, ex[i][1]); }
          const pad = 0.25 * (hi - lo + 0.2); s.setView([0, T], [lo - pad, hi + pad]);
          const eul = (h) => { const n = Math.round(T / h), out = [[0, x0]]; let x = x0; for (let i = 0; i < n; i++) { x += h * E.f(i * h, x); out.push([(i + 1) * h, x]); } return out; };
          s.path(ex.filter((_, i) => i % 20 === 0), { color: 'green', width: 2.6 });
          for (let k = 1; k < ks.value; k++) s.path(eul(Math.pow(2, -k)), { color: 'muted', width: 1.2, alpha: 0.4 });
          const P = eul(Math.pow(2, -ks.value));
          s.path(P, { color: 'orange', width: 2.4 }); s.dots(P.filter((_, i) => P.length < 40 || i % 8 === 0), { r: 3, color: 'orange' });
          const errs = [];
          for (let k = 1; k <= 10; k++) { const h = Math.pow(2, -k), Q = eul(h); let m = 0; for (const [t, x] of Q) m = Math.max(m, Math.abs(x - exAt(t))); errs.push([h, Math.max(m, 1e-5)]); }
          se.path(errs, { color: 'accent', width: 2.2 }); errs.forEach(([h, e]) => se.dot(h, e, { r: 3, color: 'accent' }));
          const j = ks.value - 1; se.dot(errs[j][0], errs[j][1], { r: 6, color: 'gold' });
          const ref = errs[4][1] / errs[4][0]; se.path([[1 / 1024, ref / 1024], [1, ref]], { color: 'muted', width: 1.4, dash: [5, 4] });
          info = { sl: logSlope(errs.slice(2, 9)), e: errs[j][1], h: errs[j][0], ratio: errs[j][1] / errs[j][0] };
        });
        v.readout(() => {
          if (!info) return '';
          const { sl, e, h, ratio } = info;
          return `$h=${v.sci(h, 2)}$: maximum error $${v.sci(e, 2)}$, error$/h=${v.fix(ratio, 3)}$. Fitted slope of $\\log(\\text{error})$ against $\\log h$ over the range: $${v.fix(sl, 3)}$ — halving $h$ halves the error (order $1$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Maximal solutions and the escape lemma',
      statement: String.raw`Let $f:U\to\R^n$ be continuous and locally Lipschitz in $x$ on the open set $U\subset\R\times\R^n$. Every initial value problem $x(t_0)=x_0$ with $(t_0,x_0)\in U$ has a unique *maximal solution* $\varphi:(\alpha,\omega)\to\R^n$: it cannot be extended, and every other solution is a restriction of it. Moreover (*escape lemma*) if $\omega<\infty$ then for every compact $K\subset U$ there is $\tau<\omega$ with $(t,\varphi(t))\notin K$ for all $t\in(\tau,\omega)$ — the graph leaves every compact subset of $U$ — and likewise at $\alpha$. In $U=\R\times\R^n$ with $\omega<\infty$ this means $|\varphi(t)|\to\infty$ along a subsequence.`,
      idea: String.raw`Local existence and uniqueness (2.4) let solutions be glued: take the union of all solutions through the point, which agree on overlaps. For the escape lemma, suppose the graph returned to a compact $K\subset U$ infinitely often as $t\to\omega$. On $K$ the field is bounded and Lipschitz, so a solution starting in $K$ exists for a uniform time $\delta>0$ (the Picard–Lindelöf time $\min(a,b/M)$ of 2.4 depends only on $K$), contradicting $\omega<\infty$ once we start within $\delta$ of $\omega$. Compactness (Rudin 2.32) supplies the uniform constants.`,
      caption: String.raw`Drag the initial point; the maximal solution is computed in both time directions. Choose the compact box $K$ by sliding its walls. For $\dot x=x^2$ it escapes through the top wall in finite time; for $\dot x=1/x$ on $U=\{x>0\}$ it escapes by running into the boundary of $U$ — leaving every compact subset of $U$ without growing — and when the box reaches $x\le0$ it is no longer a compact subset of $U$. For $\sin x$ the solution lives for ever and leaves $K$ only through the time walls $t=\pm2.5$.`,
      deps: ['ode-2.4', 'pma-2.32'],
      refs: ['Teschl §2.6'],
      tags: ['maximal solution', 'blow-up'],
      viz(v) {
        const FS = {
          sq: { label: '$x^2$', f: (t, x) => x * x, inU: () => true, dom: 'on all of $\\R^2$', ex: (x0) => ({ w: x0 > 0 ? 1 / x0 : Infinity, a: x0 < 0 ? 1 / x0 : -Infinity }) },
          inv: { label: '$1/x$ on $x>0$', f: (t, x) => 1 / x, inU: (t, x) => x > 1e-3, dom: 'on $U=\\{x>0\\}$', ex: (x0) => ({ w: Infinity, a: -(x0 * x0) / 2 }) },
          sin: { label: '$\\sin x$', f: (t, x) => Math.sin(x), inU: () => true, dom: 'on all of $\\R^2$', ex: () => ({ w: Infinity, a: -Infinity }) },
        };
        const which = v.select('$\\dot x=f(x)=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const hiS = v.slider('top wall of $K$', 0.5, 6, 3, { step: 0.1 });
        const loS = v.slider('bottom wall of $K$', -4, 2, -3, { step: 0.1 });
        const TW = 2.5;
        const s = v.stage({ x: [-3, 3], y: [-4.5, 6.5], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'x', title: 'the maximal solution and a compact box $K$' });
        const P = s.handle(0, 0.8, { color: 'accent', label: '$(t_0,x_0)$', labelPos: 'ne', constrain: (x, y) => [Math.max(-1.5, Math.min(1.5, x)), Math.max(-3.5, Math.min(5.5, y))] });
        v.legend([['accent', 'maximal solution'], ['gold', 'inside $K$', ], ['orange', 'the box $K$'], ['red', 'exit of $K$', { dot: true }]]);
        const march = (E, t0, x0, dir) => {
          const out = [[t0, x0]]; let t = t0, x = x0, esc = null;
          for (let i = 0; i < 60000; i++) {
            const fx = E.f(t, x), dt = Math.min(0.01, (0.02 * Math.max(Math.abs(x), 0.02)) / Math.max(Math.abs(fx), 1e-9));
            // RK4 step in direction dir
            const h = dir * dt, k1 = fx, k2 = E.f(t + h / 2, x + (h / 2) * k1), k3 = E.f(t + h / 2, x + (h / 2) * k2), k4 = E.f(t + h, x + h * k3);
            const xn = x + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
            if (!isFinite(xn) || Math.abs(xn) > 60 || !E.inU(t + h, xn)) { esc = { t: t + h, x: xn }; break; }
            t += h; x = xn; out.push([t, x]);
            if (Math.abs(t) > 4) break;
          }
          out.esc = esc; return out;
        };
        let info = null;
        v.render(() => {
          const E = FS[which.value], t0 = P.x; let x0 = P.y;
          if (!E.inU(t0, x0)) { x0 = 0.5; }
          P.set(t0, x0);
          const hi = hiS.value, lo = loS.value, inK = (t, x) => Math.abs(t) <= TW && x >= lo && x <= hi;
          const bad = which.value === 'inv' && lo <= 0;
          if (which.value === 'inv') s.rect(-3, -4.5, 3, 0, { fill: 'muted', fillAlpha: 0.12, hatch: true, stroke: false });
          s.rect(-TW, lo, TW, hi, { color: bad ? 'red' : 'orange', width: 2, fill: 'orange', fillAlpha: 0.07, dash: bad ? [6, 4] : false });
          const fw = march(E, t0, x0, 1), bw = march(E, t0, x0, -1), full = bw.slice().reverse().concat(fw.slice(1));
          s.clip(() => {
            s.path(full, { color: 'accent', width: 2.6 });
            // part inside K in gold
            let seg = []; const segs = [];
            for (const [t, x] of full) { if (inK(t, x)) seg.push([t, x]); else if (seg.length) { segs.push(seg); seg = []; } }
            if (seg.length) segs.push(seg);
            for (const q of segs) if (q.length > 1) s.path(q, { color: 'gold', width: 4 });
          });
          // exit points of K
          const exits = [];
          for (const half of [fw, bw]) { for (let i = 1; i < half.length; i++) { if (inK(half[i - 1][0], half[i - 1][1]) && !inK(half[i][0], half[i][1])) { exits.push(half[i]); break; } } }
          // the time walls at |t| = TW are the box sides: also mark the end of the time frame
          for (const [t, x] of exits) s.dot(t, x, { r: 5, color: 'red' });
          for (const half of [fw, bw]) if (half.esc && Math.abs(half.esc.x) <= 60 && which.value === 'inv') s.dot(half.esc.t, Math.max(half.esc.x, 0), { r: 5, color: 'red', hollow: true });
          s.vline(t0, { color: 'muted', width: 1, alpha: 0.4, dash: [2, 4] });
          const ex = E.ex(x0);
          info = { fw, bw, ex, t0, x0, bad, exits };
        });
        v.readout(() => {
          if (!info) return '';
          const { fw, bw, ex, t0, x0, bad } = info, E = FS[which.value];
          const om = fw.esc ? t0 + ((which.value === 'sq' && x0 > 0) ? 1 / x0 : 0) : Infinity;
          const parts = [];
          if (which.value === 'sq') {
            parts.push(`$x(t)=x_0/(1-x_0(t-t_0))$: ${x0 > 0 ? `maximal interval ends at $\\omega=t_0+1/x_0=${v.fix(t0 + 1 / x0, 3)}$ (the integration stops at $${v.fix(fw.esc ? fw.esc.t : NaN, 3)}$ when $x$ exceeds $60$), $x\\to+\\infty$` : x0 < 0 ? `blow-up in the past at $\\alpha=t_0+1/x_0=${v.fix(t0 + 1 / x0, 3)}$, forward solution decays to $0$` : '$x\\equiv0$ lives for ever'}.`);
          } else if (which.value === 'inv') {
            parts.push(`$x^2=x_0^2+2(t-t_0)$: the solution exists for $t>\\alpha=t_0-x_0^2/2=${v.fix(t0 - (x0 * x0) / 2, 3)}$ and runs into the boundary $x=0$ of $U$ there (computed exit $t\\approx${bw.esc ? v.fix(bw.esc.t, 3) : '—'}$): $x$ stays bounded, but the graph leaves every compact subset of $U$.`);
          } else parts.push(`$\\sin x$ is globally Lipschitz and bounded: the solution exists for all $t$ and tends to the nearest zero of $\\sin$; it leaves $K$ only through the sides $t=\\pm${2.5}$.`);
          if (bad) parts.push('The box now reaches the boundary of $U$: it is **not** a compact subset of $U$, so the lemma says nothing about it.');
          return parts.join('\n');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Corollary',
      name: 'Global existence under linear growth',
      statement: String.raw`Let $f:\R\times\R^n\to\R^n$ be continuous and locally Lipschitz in $x$, with the *linear growth bound*
$$|f(t,x)|\le a+b|x|\qquad\text{for all }(t,x)$$
($a,b\ge0$ constants, or continuous functions of $t$). Then every maximal solution of $\dot x=f(t,x)$ is defined for all $t\in\R$, and
$$|x(t)|\le\Big(|x_0|+\frac ab\Big)e^{b|t-t_0|}-\frac ab .$$
Superlinear growth gives no such conclusion: $\dot x=|x|^p$, $p>1$, blows up in finite time from every $x_0>0$.`,
      idea: String.raw`From the integral equation (2.2), $|x(t)|\le|x_0|+\int_{t_0}^t(a+b|x|)\,ds$; Grönwall (2.5) applied to $u=a+b|x|$ gives the exponential bound, so the solution stays in a compact set on every bounded time interval. By the escape lemma (2.11) a solution with finite $\omega$ would have to leave every compact set, which is impossible: hence $\omega=\infty$. With $|x|^p$, $p>1$, no linear bound holds and the lemma allows escape.`,
      caption: String.raw`Drag $p$ in $\dot x=x^p$ ($x_0=1$, logarithmic height). For $p\le1$ the solution stays under the exponential envelope $(x_0+1)e^t-1$ (green) which comes from $|f|\le1+|x|$. For $p>1$ the right panel shows the growth bound failing and the solution leaves the envelope and escapes at the exact time $T^*=x_0^{1-p}/(p-1)$ (red line).`,
      deps: ['ode-2.11', 'ode-2.5'],
      refs: ['Teschl §2.6'],
      tags: ['global existence', 'growth'],
      viz(v) {
        const ps = v.slider('exponent $p$', 0.4, 2.2, 1.0, { step: 0.05 });
        const x0s = v.slider('$x_0$', 0.3, 3, 1, { step: 0.05 });
        const TM = 5;
        const s = v.stage({ x: [0, TM], y: [0.1, 2000], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 't', ylabel: 'x', title: 'solution of $\\dot x=x^p$ and the linear-growth envelope', weight: 1.4 });
        const sf = v.stage({ x: [0, 8], y: [0, 14], axes: 'box', gutter: true, height: 340, xlabel: 'x', ylabel: 'f(x)', title: 'is $|f|\\le 1+|x|$ ?', weight: 1, minWidth: 250 });
        v.legend([['accent', 'solution'], ['green', 'envelope $(x_0+1)e^t-1$'], ['red', 'escape time $T^*$', { dash: true }], ['orange', '$f(x)=x^p$'], ['ink', '$1+x$', { dash: true }]]);
        let info = null;
        v.render(() => {
          const p = ps.value, x0 = x0s.value, f = (t, x) => Math.pow(Math.max(x, 0), p);
          const sol = scalarFlow(f, 0, x0, TM, 6000, 5e3);
          const envf = (t) => (x0 + 1) * Math.exp(t) - 1;
          s.fn(envf, { color: 'green', width: 2.4, domain: [0, TM], n: 200 });
          s.path(sol, { color: 'accent', width: 2.8 });
          let Ts = null;
          if (Math.abs(p - 1) > 1e-9 && p > 1) { Ts = Math.pow(x0, 1 - p) / (p - 1); if (Ts < TM) s.vline(Ts, { color: 'red', width: 1.6, dash: [6, 4] }); }
          if (sol.escape != null) s.dot(sol.escape, Math.min(sol[sol.length - 1][1], 2000), { r: 5, color: 'red' });
          sf.fn((x) => Math.pow(x, p), { color: 'orange', width: 2.6, domain: [0, 8] });
          sf.fn((x) => 1 + x, { color: 'ink', width: 1.8, dash: true, domain: [0, 8] });
          sf.dot(x0, Math.pow(x0, p), { r: 5, color: 'accent' });
          let cross = null; for (let x = 0; x <= 8; x += 0.01) if (Math.pow(x, p) > 1 + x + 1e-9) { cross = x; break; }
          const last = sol[sol.length - 1];
          let over = 0; for (const [t, x] of sol) over = Math.max(over, x - envf(t));
          info = { p, Ts, esc: sol.escape, cross, over, tEnd: last[0], x0, xEnd: last[1] };
        });
        v.readout(() => {
          if (!info) return '';
          const { p, Ts, esc, cross, over, tEnd, x0 } = info;
          if (p <= 1 + 1e-9) return `$p=${v.fix(p, 2)}\\le1$: $x^p\\le1+x$ for all $x\\ge0$, so the linear growth bound holds and the solution exists for all $t$ (computed up to $t=5$: $x(5)=${v.sci(Math.max(info.xEnd, 1e-9), 3)}$). It stays under the envelope: largest excess $${v.fix(Math.min(over, 0), 3)}\\le0$.`;
          return `$p=${v.fix(p, 2)}>1$: $x^p$ exceeds $1+x$ for $x>${v.fix(cross ?? NaN, 2)}$ — no linear bound. Exact blow-up time $T^*=x_0^{1-p}/(p-1)=${v.fix(Ts, 3)}$; the computation ${esc != null ? `stops at $t=${v.fix(esc, 3)}$ when $x$ passes $5000$` : 'has not blown up by $t=5$'}. The solution is ${over > 0 ? `**above** the envelope (by $${v.sci(over, 2)}$)` : 'still below the envelope'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Comparison principle for scalar equations',
      statement: String.raw`Let $f(t,x)$ be continuous and locally Lipschitz in $x$ on an open set in $\R^2$, and let $x$ solve $\dot x=f(t,x)$ on $[t_0,t_1]$. Suppose $\alpha,\beta$ are $C^1$ with
$$\dot\alpha\le f(t,\alpha),\qquad \dot\beta\ge f(t,\beta)\qquad\text{on }[t_0,t_1]$$
(a *sub-solution* and a *super-solution*) and $\alpha(t_0)\le x(t_0)\le\beta(t_0)$. Then $\alpha(t)\le x(t)\le\beta(t)$ on $[t_0,t_1]$. The solution is trapped in the corridor between them.`,
      idea: String.raw`Suppose $x(t_2)<\alpha(t_2)$ somewhere. Let $\sigma$ be the last time before $t_2$ with $x=\alpha$; on $(\sigma,t_2]$ the difference $d=x-\alpha$ is negative with $d(\sigma)=0$ and satisfies $\dot d\ge f(t,x)-f(t,\alpha)\ge-L|d|$ by the Lipschitz bound, so $\dot d\ge Ld$ (as $d<0$), and Grönwall (2.5) applied to $-d$ forces $d\equiv0$ — a contradiction. In essence, a curve that is sub-solution on top of a solution cannot cross it from below because the field pushes it back. Uniqueness (2.4) is what the Lipschitz estimate encodes.`,
      caption: String.raw`Five handles each shape a lower curve $\alpha$ (green when $\dot\alpha\le f(t,\alpha)$ holds, red where it fails) and an upper curve $\beta$ (green when $\dot\beta\ge f$). The ink curve is the solution from the black handle at $t=0$. While both barriers are green and enclose $x_0$, the solution stays in the shaded corridor; drag a barrier so that it turns red and the solution can slip through.`,
      deps: ['ode-2.4'],
      refs: ['Teschl §1.5'],
      tags: ['comparison', 'barriers'],
      viz(v) {
        const T = 5, ts = [0, 1.25, 2.5, 3.75, 5], m = 0.35;
        const FS = {
          decay: { label: '$\\sin 2t-x$', f: (t, x) => Math.sin(2 * t) - x, x0: 0.3, Y: [-1.6, 1.6] },
          logi: { label: '$x(1-x)+0.4\\sin 3t$', f: (t, x) => x * (1 - x) + 0.4 * Math.sin(3 * t), x0: 0.4, Y: [-0.8, 2] },
        };
        const which = v.select('$f(t,x)=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'decay');
        const s = v.stage({ x: [0, T], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'x', title: 'sub-solution, super-solution and the trapped solution' });
        const A = ts.map((t) => s.handle(t, 0, { color: 'teal', r: 7, constrain: (x, y) => [t, Math.max(-2.5, Math.min(3.5, y))] }));
        const B = ts.map((t) => s.handle(t, 0, { color: 'purple', r: 7, constrain: (x, y) => [t, Math.max(-2.5, Math.min(3.5, y))] }));
        const X0 = s.handle(0, 0.3, { color: 'ink', r: 8, label: '$x_0$', labelPos: 'e', constrain: (x, y) => [0, Math.max(-2.5, Math.min(3.5, y))] });
        let cur = '', hold = false;
        const reset = () => {
          const E = FS[which.value], lo = scalarFlow((t, x) => E.f(t, x) - m, 0, E.x0 - 0.3, T, 600), hi = scalarFlow((t, x) => E.f(t, x) + m, 0, E.x0 + 0.3, T, 600);
          ts.forEach((t, i) => { A[i].set(t, sampleAt(lo, t)); B[i].set(t, sampleAt(hi, t)); });
          X0.set(0, E.x0);
        };
        v.button('Reset valid barriers', reset);
        v.legend([['teal', 'sub-solution $\\alpha$'], ['purple', 'super-solution $\\beta$'], ['ink', 'solution $x$'], ['red', 'inequality violated'], ['orange', 'corridor']]);
        let info = null;
        v.render(() => {
          const E = FS[which.value];
          if (cur !== which.value) { cur = which.value; s.setView([0, T], E.Y); reset(); }
          const al = spline(ts, A.map((h) => h.y)), be = spline(ts, B.map((h) => h.y)), N = 300, d = 1e-4;
          const sol = scalarFlow(E.f, 0, X0.y, T, 1500, 50);
          const run = (g, sgn, col) => {
            let seg = [], ok = true, bad = 0; const out = [];
            for (let i = 0; i <= N; i++) {
              const t = (T * i) / N, y = g(t), dy = (g(Math.min(T, t + d)) - g(Math.max(0, t - d))) / (Math.min(T, t + d) - Math.max(0, t - d)), good = sgn * (dy - E.f(t, y)) <= 1e-9;
              if (!good) bad++;
              out.push({ t, y, good });
            }
            let cur2 = [out[0]];
            for (let i = 1; i <= N; i++) { if (out[i].good === cur2[0].good) cur2.push(out[i]); else { cur2.push(out[i]); s.path(cur2.map((q) => [q.t, q.y]), { color: cur2[0].good ? col : 'red', width: cur2[0].good ? 2.8 : 4.2 }); cur2 = [out[i]]; } }
            s.path(cur2.map((q) => [q.t, q.y]), { color: cur2[0].good ? col : 'red', width: cur2[0].good ? 2.8 : 4.2 });
            return bad;
          };
          const lo = [], hi = [];
          for (let i = 0; i <= N; i++) { const t = (T * i) / N; lo.push([t, al(t)]); hi.push([t, be(t)]); }
          s.between((t) => al(t), (t) => be(t), 0, T, { fill: 'orange', fillAlpha: 0.1 });
          const bA = run(al, 1, 'teal'), bB = run(be, -1, 'purple');
          s.path(sol, { color: 'ink', width: 2.8 });
          const ini = al(0) <= X0.y + 1e-9 && X0.y <= be(0) + 1e-9;
          let out = 0, mn = Infinity;
          for (const [t, x] of sol) { const dlo = x - al(t), dhi = be(t) - x; mn = Math.min(mn, dlo, dhi); if (dlo < -1e-6 || dhi < -1e-6) out++; }
          info = { bA, bB, ini, inside: out === 0, mn, N };
        });
        v.readout(() => {
          if (!info) return '';
          const { bA, bB, ini, inside, mn } = info;
          const ok = bA === 0 && bB === 0 && ini;
          return `Sub-solution inequality: ${bA === 0 ? 'holds' : '**fails** at ' + bA + ' of ' + (info.N + 1) + ' sample points'}; super-solution: ${bB === 0 ? 'holds' : '**fails** at ' + bB + ' of ' + (info.N + 1) + ' points'}; $\\alpha(0)\\le x_0\\le\\beta(0)$: ${ini ? 'yes' : '**no**'}.\n${ok ? `All hypotheses hold, and indeed $x$ stays in the corridor (smallest distance to a barrier $${v.fix(mn, 3)}>0$).` : inside ? 'A hypothesis is broken, but the solution happens to stay inside; the theorem makes no promise.' : 'A hypothesis is broken and the solution **leaves** the corridor.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: 'Regular perturbation expansion',
      statement: String.raw`Let $f(t,x,\varepsilon)$ be $C^{k+1}$ in all variables and let $\varphi(t;\varepsilon)$ solve $\dot x=f(t,x,\varepsilon)$, $x(t_0)=\xi$, where the unperturbed problem ($\varepsilon=0$) has the solution $\varphi_0$ on $[t_0,T]$. Then for $|\varepsilon|$ small, $\varphi(\cdot;\varepsilon)$ exists on $[t_0,T]$ and
$$\varphi(t;\varepsilon)=\varphi_0(t)+\varepsilon\varphi_1(t)+\dots+\varepsilon^k\varphi_k(t)+O(\varepsilon^{k+1})$$
uniformly on $[t_0,T]$, where $\varphi_1=\partial_\varepsilon\varphi|_{0}$ solves $\dot\varphi_1=D_xf(t,\varphi_0,0)\varphi_1+\partial_\varepsilon f(t,\varphi_0,0)$, $\varphi_1(t_0)=0$, and the higher $\varphi_j$ solve similar linear equations. The constant in $O(\varepsilon^{k+1})$ typically grows with $T$: the expansion is valid on bounded time intervals only.`,
      idea: String.raw`This is Taylor's theorem (Rudin 5.15) applied to the smooth map $\varepsilon\mapsto\varphi(t;\varepsilon)$, whose existence and smoothness come from dependence on parameters (2.8). The coefficients are the successive derivatives in $\varepsilon$, computed by differentiating the ODE: the first is the sensitivity equation of 2.8, the others solve the same linear equation with forcing built from the lower orders. Nothing controls how the remainder depends on $T$ — and for oscillators it grows linearly in $T$ (secular terms like $t\sin t$).`,
      caption: String.raw`Choose the equation and slide $\varepsilon$. The ink curve is the numerical solution; blue is the zeroth-order approximation $\varphi_0$ and orange is $\varphi_0+\varepsilon\varphi_1$. The right panel plots the maximum errors against $\varepsilon$ on log–log axes: slopes $1$ and $2$. For the Duffing oscillator lengthen $T$ and the expansion fails on time scales of order $1/\varepsilon$.`,
      deps: ['ode-2.8'],
      refs: ['Teschl §2.5'],
      tags: ['perturbation', 'asymptotics'],
      viz(v) {
        const SYS = {
          bern: { label: '$\\dot x=-x+\\varepsilon x^2$', F: (e) => (t, z) => [-z[0] + e * z[0] * z[0]], x0: [1], p0: (t) => Math.exp(-t), p1: (t) => Math.exp(-t) - Math.exp(-2 * t), Tmax: 8, T0: 4, Y: [-0.1, 1.3], eps: [0.01, 0.8, 0.3] },
          duff: { label: '$\\ddot x+x+\\varepsilon x^3=0$', F: (e) => (t, z) => [z[1], -z[0] - e * z[0] * z[0] * z[0]], x0: [1, 0], p0: (t) => Math.cos(t), p1: (t) => -0.375 * t * Math.sin(t) + (Math.cos(3 * t) - Math.cos(t)) / 32, Tmax: 40, T0: 12, Y: [-1.6, 1.6], eps: [0.01, 0.5, 0.1] },
        };
        const which = v.select('equation', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'bern');
        const es = v.slider('$\\varepsilon$', 0.01, 0.8, 0.3, { step: 0.01 });
        const Ts = v.slider('interval $[0,T]$', 1, 8, 4, { step: 0.1 });
        const s = v.stage({ x: [0, 4], y: [-0.1, 1.3], axes: 'box', gutter: true, height: 340, xlabel: 't', ylabel: 'x', title: 'solution and expansions', weight: 1.3 });
        const se = v.stage({ x: [0.005, 1], y: [1e-8, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'ε', ylabel: 'max error on [0,T]', title: 'errors of the truncations', weight: 1, minWidth: 250 });
        v.legend([['ink', 'numerical solution'], ['blue', '$\\varphi_0$', { dash: true }], ['orange', '$\\varphi_0+\\varepsilon\\varphi_1$'], ['blue', 'error of $\\varphi_0$', { dot: true }], ['orange', 'error of $\\varphi_0+\\varepsilon\\varphi_1$', { dot: true }]]);
        let lastSys = '', info = null;
        v.render(() => {
          const S = SYS[which.value];
          if (lastSys !== which.value) { lastSys = which.value; Ts.set(S.T0); s.setView([0, S.T0], S.Y); es.set(S.eps[2]); }
          const T = Ts.value, e = es.value, N = Math.round(T * 50);
          s.setView([0, T], S.Y);
          const sol = flow(S.F(e), 0, S.x0, T, N).map(([t, z]) => [t, z[0]]);
          const a0 = (t) => S.p0(t), a1 = (t) => S.p0(t) + e * S.p1(t);
          s.fn(a0, { color: 'blue', width: 2, dash: [6, 4], domain: [0, T], n: 300 });
          s.fn(a1, { color: 'orange', width: 2.6, domain: [0, T], n: 300 });
          s.path(sol, { color: 'ink', width: 2.6 });
          const errs = (ee) => { const q = flow(S.F(ee), 0, S.x0, T, N); let m0 = 0, m1 = 0; for (const [t, z] of q) { m0 = Math.max(m0, Math.abs(z[0] - S.p0(t))); m1 = Math.max(m1, Math.abs(z[0] - S.p0(t) - ee * S.p1(t))); } return [m0, m1]; };
          const E0 = [], E1 = [];
          for (let j = 0; j < 12; j++) { const ee = 0.005 * Math.pow(0.8 / 0.005, j / 11) , [m0, m1] = errs(ee); E0.push([ee, Math.max(m0, 1e-8)]); E1.push([ee, Math.max(m1, 1e-8)]); }
          se.setView([0.005, 1], [1e-8, 10]);
          se.path(E0, { color: 'blue', width: 2 }); se.path(E1, { color: 'orange', width: 2 });
          E0.forEach(([x, y]) => se.dot(x, y, { r: 3, color: 'blue' })); E1.forEach(([x, y]) => se.dot(x, y, { r: 3, color: 'orange' }));
          const [c0, c1] = errs(e); se.dot(e, Math.max(c0, 1e-8), { r: 6, color: 'gold' }); se.dot(e, Math.max(c1, 1e-8), { r: 6, color: 'gold' });
          info = { c0, c1, s0: logSlope(E0.slice(0, 7)), s1: logSlope(E1.slice(0, 7)), e };
        });
        v.readout(() => {
          if (!info) return '';
          const { c0, c1, s0, s1, e } = info;
          return `$\\varepsilon=${v.fix(e, 2)}$: error of $\\varphi_0$ is $${v.sci(c0, 2)}$ (about $${v.fix(c0 / e, 3)}\\,\\varepsilon$), error of $\\varphi_0+\\varepsilon\\varphi_1$ is $${v.sci(Math.max(c1, 1e-12), 2)}$ (about $${v.fix(c1 / (e * e), 3)}\\,\\varepsilon^2$). Fitted slopes at small $\\varepsilon$: $${v.fix(s0, 2)}$ and $${v.fix(s1, 2)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.15
    {
      num: '2.15',
      kind: 'Theorem',
      name: 'Solutions cannot cross (uniqueness in the phase space)',
      statement: String.raw`Let $f:U\to\R^n$ be locally Lipschitz on an open $U\subset\R^n$ and consider the autonomous system $\dot x=f(x)$. Through every point of $U$ passes exactly one orbit (the image of the maximal solution): two orbits are either disjoint or identical, and an orbit that returns to a point is periodic or a fixed point. Distinct orbits therefore never cross and never merge in finite time. Without the Lipschitz condition this fails: for $\dot x=1,\ \dot y=3|y|^{2/3}$ the two solutions $y\equiv0$ and $y=(x-c)_+^3$ pass through the same point $(c,0)$ and then separate.`,
      idea: String.raw`If two solutions $\varphi,\psi$ of the autonomous system meet, $\varphi(s)=\psi(u)$, then $t\mapsto\psi(t-s+u)$ is also a solution through the point $\varphi(s)$ at time $s$; by uniqueness (2.4) it equals $\varphi$ near $s$, and by continuation (2.11) everywhere. So the two orbits coincide up to a time shift. Autonomy is essential: for non-autonomous systems the *graphs in $(t,x)$* cannot cross, but orbits in $x$-space can.`,
      caption: String.raw`Drag the two start points in the phase plane (the whole orbits are drawn, forward and backward). On the right the coordinate $x(t)$ of each solution *does* cross as a function of time, yet the points $(x,y)$ never coincide at the same time and, the readout shows, the orbits stay a positive distance apart. Drag one start point onto the other's orbit and they become the same orbit. Switch to the non-Lipschitz field: the orbit through the gold point runs into the line $y=0$ and can continue along it or along any cubic $(x-c)^3$ — non-uniqueness.`,
      deps: ['ode-2.4'],
      refs: ['Strogatz §6.2'],
      tags: ['uniqueness', 'phase space'],
      viz(v) {
        const FS = { ...PLANAR, branch: { label: 'non-Lipschitz', view: [[-3, 3], [-3, 3]], start: [0.2, 0.6] } };
        const which = v.select('system', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'pend');
        const s = v.stage({ x: PLANAR.pend.view[0], y: PLANAR.pend.view[1], axes: 'box', gutter: true, height: 360, xlabel: 'x', ylabel: 'y', title: 'orbits in the phase plane', weight: 1.4 });
        const sr = v.stage({ x: [0, 8], y: [-4, 4], axes: 'box', gutter: true, height: 360, xlabel: 't', ylabel: 'x(t)', title: 'the first coordinates as functions of time', weight: 1, minWidth: 250 });
        const A = s.handle(1.2, 0.4, { color: 'accent', label: 'A', labelPos: 'nw' });
        const B = s.handle(-0.8, 0.9, { color: 'purple', label: 'B', labelPos: 'ne' });
        v.legend([['accent', 'orbit through A'], ['purple', 'orbit through B'], ['red', 'branch point', { dot: true }]]);
        let lastSys = '', info = null;
        v.render(() => {
          const S = FS[which.value];
          if (lastSys !== which.value) {
            lastSys = which.value; s.setView(S.view[0], S.view[1]);
            if (which.value === 'branch') { A.set(S.start[0], S.start[1]); B.visible = false; sr.el.style.display = 'none'; }
            else { A.set(S.start[0], S.start[1]); B.set(S.start[0] - 1.4, S.start[1] + 0.5); B.visible = true; sr.el.style.display = ''; }
          }
          if (which.value === 'branch') {
            const xa = A.x, ya = Math.max(A.y, 0.02); A.set(xa, ya);
            const ca = xa - Math.cbrt(ya), q = (x, c) => (x > c ? Math.pow(x - c, 3) : 0);
            s.fn((x) => q(x, ca), { color: 'accent', width: 3, domain: [ca, 3] });
            s.hline(0, { color: 'accent', width: 2.4, dash: [6, 4] });
            for (const c of [ca + 0.5, ca + 1, ca + 1.5]) s.fn((x) => q(x, c), { color: 'muted', width: 1.3, alpha: 0.6, domain: [c, 3] });
            s.dot(ca, 0, { r: 6, color: 'red' });
            let res = 0; for (let i = 1; i < 300; i++) { const x = ca + (3 - ca) * i / 300, d = 1e-5; res = Math.max(res, Math.abs((q(x + d, ca) - q(x - d, ca)) / (2 * d) - 3 * Math.pow(Math.abs(q(x, ca)), 2 / 3))); }
            info = { branch: true, ca, res };
            return;
          }
          const T = 9, N = 450;
          const orb = (p) => ({ f: flow(S.F, 0, [p.x, p.y], T, N), b: flow(S.F, 0, [p.x, p.y], -T, N) });
          const oa = orb(A), ob = orb(B), geo = (o) => o.b.slice().reverse().concat(o.f.slice(1)).map(([t, z]) => z).filter((z) => Math.abs(z[0]) < 50 && Math.abs(z[1]) < 50);
          const ga = geo(oa), gb = geo(ob);
          s.path(ga, { color: 'accent', width: 2.4 }); s.path(gb, { color: 'purple', width: 2.4 });
          sr.setView([0, 8], [S.view[0][0], S.view[0][1]]);
          sr.path(oa.f.map(([t, z]) => [t, z[0]]), { color: 'accent', width: 2.4 }); sr.path(ob.f.map(([t, z]) => [t, z[0]]), { color: 'purple', width: 2.4 });
          let dmin = Infinity;
          for (let i = 0; i < ga.length; i += 2) for (let j = 0; j < gb.length; j += 2) { const d = Math.hypot(ga[i][0] - gb[j][0], ga[i][1] - gb[j][1]); if (d < dmin) dmin = d; }
          // crossings in time
          const cr = []; for (let i = 1; i < oa.f.length; i++) { const d0 = oa.f[i - 1][1][0] - ob.f[i - 1][1][0], d1 = oa.f[i][1][0] - ob.f[i][1][0]; if (d0 * d1 < 0) { const w = d0 / (d0 - d1), t = oa.f[i - 1][0] + w * (oa.f[i][0] - oa.f[i - 1][0]); cr.push([t, oa.f[i - 1][1][0] + w * (oa.f[i][1][0] - oa.f[i - 1][1][0]), Math.abs(oa.f[i - 1][1][1] - ob.f[i - 1][1][1])]); } }
          for (const [t, x] of cr) sr.dot(t, x, { r: 4.5, color: 'red' });
          let dy = cr.length ? cr[0][2] : null;
          info = { branch: false, dmin, ncross: cr.length, dy };
        });
        v.readout(() => {
          if (!info) return '';
          if (info.branch) return `The solution through the gold point is $y=(x-c)^3$ with $c=${v.fix(info.ca, 3)}$; it reaches $y=0$ at the red point, where $f(y)=3|y|^{2/3}$ is not Lipschitz. There the solution $y\\equiv0$ also passes, and so does $(x-c')_+^3$ for every $c'\\ge c$: several orbits through one point, residual of the ODE for each $<${v.sci(Math.max(info.res, 1e-9), 1)}$.`;
          const { dmin, ncross, dy } = info;
          return `Smallest distance between the two orbits (sampled): $${v.fix(dmin, 3)}$${dmin < 0.06 ? ' — the same orbit, shifted in time' : ' — they never meet'}. The curves $x_A(t),x_B(t)$ cross ${ncross} time${ncross === 1 ? '' : 's'}${dy != null ? `; at the first crossing the $y$-coordinates still differ by $${v.fix(dy, 3)}$, so the points are not the same` : ''}.`;
        });
      },
    },
  ],
};
