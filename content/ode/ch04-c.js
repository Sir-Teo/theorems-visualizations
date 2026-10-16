// Ordinary Differential Equations & Dynamical Systems — Chapter 4 (part c): Sturm theory, Rayleigh quotients and the Fredholm alternative, items 4.11–4.15
import { flow, slControls, slEigenpairs, slEigenvalues, slInner, slPath, nodePts, nodeAt, nodeZeros, catmull, simpson } from './ch04.shared.js';

/** Zeros (sign changes, linear interpolation) of a sampled curve [[x, y], …] strictly after the first point. */
function zerosOf(pts) {
  const z = [];
  for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i][1], b = pts[i + 1][1]; if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) z.push(pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * a) / (a - b)); }
  return z;
}

export default {
  collection: 'ode',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Sturm comparison theorem',
      statement: String.raw`Let $q_1\le q_2$ be continuous on an interval $I$, let $u_1\not\equiv0$ solve $u''+q_1u=0$ and let $u_2\not\equiv0$ solve $u''+q_2u=0$. If $a<b$ are consecutive zeros of $u_1$ in $I$, then $u_2$ has a zero in the open interval $(a,b)$, unless $q_1\equiv q_2$ on $[a,b]$ and $u_2$ is a multiple of $u_1$. In words: a larger coefficient makes every solution oscillate at least as fast.`,
      idea: String.raw`Assume $u_1>0$ on $(a,b)$ and, for contradiction, $u_2>0$ on $(a,b)$ too (replace by $-u$ if needed). The combination $W=u_1u_2'-u_1'u_2$ satisfies $W'=u_1u_2''-u_1''u_2=(q_1-q_2)\,u_1u_2\le0$ on $(a,b)$, so $W$ is non-increasing. At the endpoints $u_1=0$, so $W(a)=-u_1'(a)u_2(a)$ and $W(b)=-u_1'(b)u_2(b)$; since $u_1'(a)>0>u_1'(b)$ and $u_2\ge0$ there, $W(a)\le0\le W(b)$. A non-increasing function with $W(b)\le W(a)$ then forces $W(a)=W(b)=0$ and $W\equiv0$, hence $(q_1-q_2)u_1u_2\equiv0$, i.e. $q_1=q_2$ on $[a,b]$, and $u_2$ is proportional to $u_1$. That is the exceptional case; otherwise $u_2$ must change sign in $(a,b)$.`,
      caption: String.raw`Blue: the solution $u_1$ of $u''+(a+bx)u=0$ with $u_1(0)=0$; orange: a solution $u_2$ of $u''+(a+bx+D)u=0$ with initial data $(\cos\varphi,\sin\varphi)$. Shaded bands are the intervals between consecutive zeros of $u_1$ (including the zero at $0$); they are green when $u_2$ has a zero inside, red when it does not. With $D\ge0$ every band is green whatever the phase $\varphi$ (try it). Make $D$ negative — the hypothesis $q_1\le q_2$ fails — and $u_2$ becomes slower than $u_1$ and bands turn red.`,
      deps: ['ode-4.7'],
      refs: ['Teschl §5.5'],
      tags: ['Sturm', 'oscillation', 'comparison'],
      credit: 'C. Sturm, 1836',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm_comparison_theorem' },
      viz(v) {
        const s = v.stage({ x: [0, 6], y: [-1, 1], axes: 'box', gutter: true, height: 340, xlabel: 'x', ylabel: 'u', title: '$u_1$ and $u_2$ with their zeros' });
        const A = v.slider('$a$ in $q_1=a+bx$', 2, 14, 6, { step: 0.1 }), B = v.slider('$b$', -1, 6, 1.5, { step: 0.1 });
        const D = v.slider('$D$ in $q_2=q_1+D$', -4, 10, 3, { step: 0.1 }), Ph = v.slider('phase $\\varphi$ of $u_2$', 0, 3.14, 1.1, { step: 0.02 });
        v.legend([['accent', '$u_1^{\\prime\\prime}+q_1u_1=0$, $u_1(0)=0$'], ['orange', '$u_2^{\\prime\\prime}+q_2u_2=0$'], ['green', 'band: $u_2$ has a zero', { area: true }], ['red', 'band: no zero of $u_2$', { area: true }]]);
        let info = null;
        v.render(() => {
          const a = A.value, b = B.value, d = D.value, ph = Ph.value, X = 6, n = 1800;
          const F1 = (x, [u, w]) => [w, -(a + b * x) * u], F2 = (x, [u, w]) => [w, -(a + b * x + d) * u];
          const p1 = flow(F1, 0, [0, 1], X, n).map(([x, y]) => [x, y[0]]), p2 = flow(F2, 0, [Math.cos(ph), Math.sin(ph)], X, n).map(([x, y]) => [x, y[0]]);
          let mx = 0.2; for (const p of p1) mx = Math.max(mx, Math.abs(p[1])); for (const p of p2) mx = Math.max(mx, Math.abs(p[1]));
          s.setView([0, X], [-1.2 * mx, 1.2 * mx]);
          const z1 = [0, ...zerosOf(p1)], z2 = zerosOf(p2);
          let ok = 0, bad = 0;
          for (let i = 0; i + 1 < z1.length; i++) {
            const lo = z1[i], hi = z1[i + 1], has = z2.some((z) => z > lo - 1e-3 && z < hi + 1e-3), col = has ? 'green' : 'red';
            if (has) ok++; else bad++;
            s.vband(lo, hi, { color: col, alpha: 0.12 });
          }
          s.path(p2, { color: 'orange', width: 2.2 }); s.path(p1, { color: 'accent', width: 2.6 });
          for (const z of z1) s.dot(z, 0, { r: 4.5, color: 'accent' }); for (const z of z2) s.dot(z, 0, { r: 4.5, color: 'orange', hollow: true });
          info = { ok, bad, n1: z1.length - 1, n2: z2.length, d };
        });
        v.readout(() => {
          if (!info) return '';
          const { ok, bad, n1, n2, d } = info;
          return `$q_2-q_1=D=${v.fix(d, 1)}$ ${d >= 0 ? '(hypothesis $q_1\\le q_2$ holds)' : '(hypothesis violated)'}. $u_1$ has ${n1} positive zero(s) in $(0,6]$, $u_2$ has ${n2}.\nBands between consecutive zeros of $u_1$: ${ok} contain a zero of $u_2$, ${bad} do not.${d >= 0 ? (bad === 0 ? ' As the theorem says, none is empty.' : ' (The last band can look empty only if it is cut off by the window edge.)') : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Sturm separation theorem',
      statement: String.raw`Let $u_1,u_2$ be two linearly independent solutions of the same equation $u''+q(x)u=0$ (or of $(pu')'+qu=0$) on an interval $I$. Then their zeros are simple and *interlace*: between two consecutive zeros of $u_1$ there is exactly one zero of $u_2$, and vice versa. In particular no two independent solutions have a common zero.`,
      idea: String.raw`Independence means the Wronskian $W=u_1u_2'-u_1'u_2$ is a nonzero constant (3.11). At a zero of $u_1$ it reduces to $W=-u_1'u_2$, so $u_1'\ne0$ (simple zeros) and $u_2\ne0$ (no common zeros). Existence of a zero of $u_2$ between two zeros of $u_1$ is Sturm comparison (4.11) with $q_1=q_2$, uniqueness follows by exchanging the roles: two zeros of $u_2$ in between would force a zero of $u_1$ between them. Geometrically, the planar curve $x\mapsto(u_1,u_2)$ turns monotonically around the origin because $W\ne0$ is the rate of change of the angle times $u_1^2+u_2^2$.`,
      caption: String.raw`Edit the coefficient $q(x)$ and choose the initial data of the second solution: $u_1(0)=0,u_1'(0)=1$ and $u_2(0)=\sin\theta,u_2'(0)=\cos\theta$. Left: both solutions and their zeros, which alternate. Right: the curve $(u_1(x),u_2(x))$, which winds steadily around the origin; it crosses the $u_2$-axis at zeros of $u_1$ and the $u_1$-axis at zeros of $u_2$, alternately. Slide $\theta$ to $0$ so that $u_2=u_1$: the solutions become dependent, the curve collapses onto a line and the zeros coincide.`,
      deps: ['ode-4.11'],
      refs: ['Teschl §5.5'],
      tags: ['Sturm', 'oscillation', 'Wronskian'],
      credit: 'C. Sturm, 1836',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm_separation_theorem' },
      viz(v) {
        const sA = v.stage({ x: [0, 8], y: [-1, 1], axes: 'box', gutter: true, height: 320, xlabel: 'x', ylabel: 'u', title: 'two solutions of the same equation', weight: 1.3, minWidth: 290 });
        const sP = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: true, height: 320, title: 'the curve $(u_1,u_2)$', weight: 0.8, minWidth: 230 });
        const Q = v.input('$q(x)=$', '9 + 6 sin(1.5 x)', { vars: ['x'], width: 230 });
        const Th = v.slider('$\\theta$', 0, 3.14, 0.9, { step: 0.02 });
        v.legend([['accent', '$u_1$, zero of $u_1$'], ['orange', '$u_2$, zero of $u_2$ (hollow)']]);
        let info = null;
        v.render(() => {
          const qf = Q.fn; if (!qf) return;
          const th = Th.value, X = 8, n = 2400, F = (x, [u, w]) => { const q = qf(x); return [w, -(isFinite(q) ? q : 0) * u]; };
          const p1 = flow(F, 0, [0, 1], X, n), p2 = flow(F, 0, [Math.sin(th), Math.cos(th)], X, n);
          const a1 = p1.map(([x, y]) => [x, y[0]]), a2 = p2.map(([x, y]) => [x, y[0]]);
          let mx = 0.2; for (const p of a1.concat(a2)) mx = Math.max(mx, Math.abs(p[1]));
          sA.setView([0, X], [-1.2 * mx, 1.2 * mx]); sP.setView([-1.2 * mx, 1.2 * mx], [-1.2 * mx, 1.2 * mx]);
          const z1 = [0, ...zerosOf(a1)], z2 = zerosOf(a2), dep = Math.sin(th) < 0.03;
          sA.path(a2, { color: 'orange', width: 2.2 }); sA.path(a1, { color: 'accent', width: 2.6 });
          for (const z of z1) sA.dot(z, 0, { r: 4.5, color: 'accent' }); for (const z of z2) sA.dot(z, 0, { r: 4.5, color: 'orange', hollow: true });
          sP.path(a1.map((p, i) => [p[1], a2[i][1]]), { color: 'purple', width: 2 });
          sP.dot(a1[0][1], a2[0][1], { r: 4, color: 'gold' });
          const ev = [...z1.map((z) => [z, 1]), ...z2.map((z) => [z, 2])].sort((a, b) => a[0] - b[0]);
          let alt = true; for (let i = 1; i < ev.length; i++) if (ev[i][1] === ev[i - 1][1] || Math.abs(ev[i][0] - ev[i - 1][0]) < 1e-3) alt = false;
          const W = Math.sin(th);
          info = { z1: z1.length, z2: z2.length, alt, dep, W, last: ev.map((e) => e[1]).slice(0, 14).join('') };
        });
        v.readout(() => {
          if (!Q.fn) return 'Fix the formula for $q$.';
          if (!info) return '';
          const { z1, z2, alt, dep, W, last } = info;
          return `Wronskian $W=u_1u_2'-u_1'u_2=-\\sin\\theta=${v.fix(-W, 3)}$ (constant). Zeros of $u_1$ (including $x=0$): ${z1}; zeros of $u_2$: ${z2}. Order of the first zeros along the axis (1 = $u_1$, 2 = $u_2$): ${last}.\n${dep ? '$\\theta\\approx0$: $u_2$ is (almost) a multiple of $u_1$, the solutions are dependent and the zeros coincide.' : alt ? 'Strict alternation: yes, zeros of $u_1$ and $u_2$ interlace.' : 'The zeros are not alternating: the window may be cutting a final zero, or the solutions are numerically dependent.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Oscillation theorem: the n-th eigenfunction has n − 1 zeros',
      statement: String.raw`For a regular Sturm–Liouville problem with Dirichlet conditions, let $u(\cdot;\lambda)$ be the solution with $u(0)=0,\ pu'(0)=1$. The number of zeros of $u(\cdot;\lambda)$ in the open interval $(0,1)$ equals the number of eigenvalues smaller than $\lambda$. In particular the $n$-th eigenfunction (ordered by $\lambda_1<\lambda_2<\cdots$) has exactly $n-1$ zeros in $(0,1)$, and the eigenvalues can be located by counting zeros while $\lambda$ increases. (Other separated boundary conditions change the count by a fixed offset.)`,
      idea: String.raw`By the Sturm comparison theorem (4.11), if $\lambda$ increases then $u(\cdot;\lambda)$ oscillates faster: the zeros move monotonically to the left (towards $0$) as $\lambda$ grows, never coalescing, since zeros are simple. A new zero can therefore enter the interval only through the right endpoint $x=1$, which happens exactly when $u(1;\lambda)=0$, i.e. at an eigenvalue. Starting from $\lambda$ very negative, where $u$ has no zero, each eigenvalue passed adds exactly one zero. The Prüfer angle $\theta$, defined by $u=r\sin\theta$, $pu'=r\cos\theta$, makes this precise: $\theta(1;\lambda)$ is increasing in $\lambda$ and the eigenvalues are where it crosses multiples of $\pi$.`,
      caption: String.raw`Top: the shooting solution $u(x;\lambda)$ for the chosen problem, with its interior zeros marked. Middle: the end value $u(1;\lambda)$; its roots (orange) are the eigenvalues. Bottom: the number of interior zeros as a function of $\lambda$: a staircase that steps up exactly at each eigenvalue, together with the count of eigenvalues below $\lambda$ (dashed green). Slide $\lambda$ or press *next eigenvalue*: at $\lambda_n$ the solution touches $0$ at $x=1$ and has $n-1$ zeros inside.`,
      deps: ['ode-4.9', 'ode-4.11'],
      refs: ['Teschl §5.5'],
      tags: ['oscillation', 'Sturm–Liouville', 'zeros'],
      credit: 'C. Sturm, 1836 (Prüfer angle: H. Prüfer, 1926)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm%E2%80%93Liouville_theory#Sturm%E2%80%93Liouville_theory' },
      verify: true,
      viz(v) {
        const sS = v.stage({ x: [0, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, height: 260, xlabel: 'x', ylabel: 'u', title: 'shooting solution $u(x;\\lambda)$', weight: 1.1, minWidth: 280 });
        const sG = v.stage({ x: [0, 400], y: [-1, 1], axes: 'box', gutter: true, height: 260, xlabel: 'λ', ylabel: 'u(1; λ)', title: 'end value', weight: 1.1, minWidth: 260 });
        const sN = v.stage({ x: [0, 400], y: [-0.4, 8.4], axes: 'box', gutter: true, height: 260, xlabel: 'λ', ylabel: 'zeros', title: 'interior zeros', weight: 1.1, minWidth: 260 });
        const SL = slControls(v, { bc: false, bcFixed: 'DD', init: 'string' });
        const lam = v.slider('$\\lambda$', 0, 400, 20, { step: 0.05 });
        v.button('next eigenvalue', () => { const pr = SL.prob(); if (!pr) return; const ev = slEigenvalues(pr, 'DD', 8); const nx = ev.find((e) => e > lam.value + 1e-6); if (nx !== undefined) lam.set(nx); });
        v.button('previous', () => { const pr = SL.prob(); if (!pr) return; const ev = slEigenvalues(pr, 'DD', 8).filter((e) => e < lam.value - 1e-6); lam.set(ev.length ? ev[ev.length - 1] : 0); });
        let cache = { key: '', g: null, cnt: null };
        const countAt = (pr, l) => { const { u } = slPath(pr, l, 0, 1, 1); const N = pr.N; let c = 0; for (let i = 1; i < N - 1; i++) if ((u[i] < 0 && u[i + 1] >= 0) || (u[i] > 0 && u[i + 1] <= 0)) c++; return { c, u, end: u[N] }; };
        let info = null;
        v.render(() => {
          const pr = SL.prob(); if (!pr) return;
          const key = SL.P.value + '|' + SL.Q.value + '|' + SL.W.value;
          if (cache.key !== key) {
            const g = [], cnt = []; for (let i = 0; i <= 400; i++) { const l = i, r = countAt(pr, l); g.push([l, r.end]); cnt.push([l, r.c]); }
            cache = { key, g, cnt, ev: slEigenvalues(pr, 'DD', 8) };
          }
          const l = lam.value, r = countAt(pr, l), ev = cache.ev;
          let mx = 1e-9; for (let i = 0; i <= pr.N; i++) mx = Math.max(mx, Math.abs(r.u[i]));
          sS.setView([0, 1], [-1.25 * mx, 1.25 * mx]);
          const pts = nodePts(r.u); sS.path(pts, { color: 'accent', width: 2.6 });
          const zs = nodeZeros(r.u, 0).filter((z) => z < 0.998);
          for (const z of zs) sS.dot(z, 0, { r: 5, color: 'red' });
          sS.dot(1, r.end, { r: 5, color: 'gold' });
          const gm = Math.max(...cache.g.map((q) => Math.abs(q[1])), 0.1); sG.setView([0, 400], [-1.15 * gm, 1.15 * gm]);
          sG.path(cache.g, { color: 'accent', width: 1.6 }); for (const e of ev) if (e <= 400) { sG.dot(e, 0, { r: 4.5, color: 'orange' }); sN.vline(e, { color: 'orange', alpha: 0.35, width: 1 }); }
          sG.vline(l, { color: 'gold', width: 1.4 }); sN.vline(l, { color: 'gold', width: 1.4 });
          // staircase: zero counts
          const st = []; for (const [x, c] of cache.cnt) st.push([x, c]);
          sN.path(st, { color: 'accent', width: 2.4 });
          const below = []; for (let x = 0; x <= 400; x += 2) below.push([x, ev.filter((e) => e < x).length]); sN.path(below, { color: 'green', width: 1.6, dash: [3, 4] });
          sN.dot(l, zs.length, { r: 5, color: 'gold' });
          info = { l, zs: zs.length, below: ev.filter((e) => e < l - 1e-6).length, ev, end: r.end };
        });
        v.legend([['accent', 'interior zeros'], ['green', 'eigenvalues below $\\lambda$', { dash: true }], ['orange', 'eigenvalues', { dot: true }]]);
        v.readout(() => {
          if (!info) return SL.note;
          const { l, zs, below, ev, end } = info;
          return `$\\lambda=${v.fix(l, 3)}$: $u(1;\\lambda)=${v.fix(end, 4)}$; interior zeros of $u$: ${zs}; eigenvalues below $\\lambda$: ${below}.\nEigenvalues: ${ev.slice(0, 6).map((e, i) => `$\\lambda_${i + 1}=${v.fix(e, 2)}$`).join(', ')}, … The $n$-th eigenfunction has $n-1$ zeros.${SL.note ? '\n' + SL.note : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Rayleigh quotient and min–max for eigenvalues',
      statement: String.raw`For a regular Sturm–Liouville problem with Dirichlet conditions let $\mathcal R[\varphi]=\dfrac{\int_0^1\big(p\varphi'^2+q\varphi^2\big)dx}{\int_0^1w\varphi^2\,dx}$ for $\varphi\in C^1$ (or $H^1$) with $\varphi(0)=\varphi(1)=0$, $\varphi\neq0$. Then
$$\lambda_1=\min_\varphi\mathcal R[\varphi],\qquad \lambda_n=\min_{\varphi\perp u_1,\dots,u_{n-1}}\mathcal R[\varphi]=\min_{\dim V=n}\ \max_{\varphi\in V}\mathcal R[\varphi],$$
orthogonality being in $L^2(w\,dx)$. The minimum in the first formula is attained exactly at multiples of the ground state $u_1$.`,
      idea: String.raw`Expand $\varphi=\sum d_nu_n$ (4.10). Integration by parts, which uses the boundary conditions, gives $\int(p\varphi'^2+q\varphi^2)=\sum\lambda_nd_n^2$ while $\int w\varphi^2=\sum d_n^2$, so $\mathcal R[\varphi]=\sum\lambda_nd_n^2/\sum d_n^2$ is a *weighted average* of the eigenvalues. It cannot be smaller than $\lambda_1$, and equals it only if all weight sits on $u_1$; if $\varphi\perp u_1$ the weight on $\lambda_1$ is gone and the average is at least $\lambda_2$, and so on. This is why one can estimate eigenvalues from above by any trial function (the Rayleigh–Ritz method).`,
      caption: String.raw`Drag the five handles to shape a trial function $\varphi$ with fixed ends (left, gold; the green dashed curve is its projection onto the true ground state). Its Rayleigh quotient (gold marker on the eigenvalue axis) never falls below $\lambda_1$, and touches it when $\varphi$ becomes proportional to $u_1$ (press *snap to ground state*). Switch on *orthogonalise against $u_1$* and the quotient can no longer go below $\lambda_2$. The bars show the weights $d_n^2/\|\varphi\|^2$ of the average.`,
      deps: ['ode-4.9'],
      refs: ['Teschl §5.4'],
      tags: ['Rayleigh quotient', 'variational principle', 'min–max'],
      credit: 'Lord Rayleigh, 1877 (Theory of Sound); min–max principle: E. Fischer, 1905, R. Courant, 1920',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rayleigh_quotient' },
      verify: true,
      viz(v) {
        const sT = v.stage({ x: [0, 1], y: [-1.7, 1.7], axes: 'box', gutter: true, height: 320, xlabel: 'x', ylabel: 'φ', title: 'trial function', weight: 1.2, minWidth: 280 });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, title: 'Rayleigh quotient on the eigenvalue axis', weight: 1.4, minWidth: 300 });
        const sB = v.stage({ x: [0, 13], y: [0, 1], axes: 'box', gutter: true, height: 150, xlabel: 'n', ylabel: 'weight', title: 'weights $d_n^2/\\|\\varphi\\|^2$', weight: 1, minWidth: 240 });
        const SL = slControls(v, { bc: false, bcFixed: 'DD', edit: false, init: 'string' });
        const orth = v.toggle('orthogonalise against $u_1$', false);
        const xs = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1], H = [];
        [0.55, 1.0, 1.15, 0.95, 0.45].forEach((y, i) => H.push(sT.handle(xs[i + 1], y, { color: 'gold', r: 7, constrain: (x, yy) => [xs[i + 1], Math.max(-1.6, Math.min(1.6, yy))] })));
        let eps = null;
        v.button('snap to ground state', () => { if (!eps) return; const u = eps[0].u, m = Math.max(...Array.from(u).map(Math.abs)); H.forEach((h, i) => h.set(xs[i + 1], (nodeAt(u, xs[i + 1]) / m) * 1.2)); });
        v.button('random', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); H.forEach((h, i) => h.set(xs[i + 1], (r() - 0.5) * 2.4)); });
        let info = null;
        v.render(() => {
          const pr = SL.prob(); if (!pr) return;
          eps = slEigenpairs(pr, 'DD', 12); const N = pr.N, ev = eps.map((e) => e.lam);
          const f = catmull(xs, [0, ...H.map((h) => h.y), 0]), phi0 = new Float64Array(N + 1); for (let i = 0; i <= N; i++) phi0[i] = f(i / N);
          const c1 = slInner(pr, phi0, eps[0].u), phi = new Float64Array(N + 1); for (let i = 0; i <= N; i++) phi[i] = orth.value ? phi0[i] - c1 * eps[0].u[i] : phi0[i];
          const num = (() => { let a = new Float64Array(N + 1); for (let i = 0; i < N; i++) { const d = (phi[i + 1] - phi[i]) * N, mid = (phi[i] + phi[i + 1]) / 2; a[i] = pr.P[2 * i + 1] * d * d + pr.Q[2 * i + 1] * mid * mid; } let s = 0; for (let i = 0; i < N; i++) s += a[i] / N; return s; })();
          const den = slInner(pr, phi, phi), R = num / den;
          sT.path(nodePts(phi), { color: 'gold', width: 3 }); if (orth.value) sT.path(nodePts(phi0), { color: 'muted', width: 1.2, dash: [4, 4] });
          const sc = Math.max(1e-9, ...Array.from(eps[0].u).map(Math.abs)), proj = (orth.value ? 0 : c1);
          sT.path(nodePts(eps[0].u, proj), { color: 'green', width: 2, dash: [6, 4] });
          // eigenvalue axis
          const hi = Math.max(ev[3], R) * 1.08, X = (l) => l / hi;
          sL.setView([0, 1.04], [0, 1]);
          sL.line(0, 0.35, 1, 0.35, { color: 'ink', width: 1.4 });
          ev.slice(0, 6).forEach((l, i) => { if (X(l) <= 1) { sL.line(X(l), 0.3, X(l), 0.4, { color: 'orange', width: 3 }); sL.tex(`\\lambda_${i + 1}`, X(l), 0.18, { color: 'orange', size: 13, align: 'center' }); } });
          sL.dot(Math.min(1, X(R)), 0.35, { r: 8, color: 'gold' }); sL.tex('\\mathcal R', Math.min(1, X(R)), 0.68, { color: 'gold', size: 14, align: 'center' });
          const d = eps.map((e) => slInner(pr, phi, e.u)), tot = den;
          const wts = d.map((q) => (q * q) / tot); sB.bars(wts, { x0: 1, color: (q, i) => (i === 0 ? 'green' : 'accent') });
          const series = d.reduce((a, q, i) => a + ev[i] * q * q, 0) / d.reduce((a, q) => a + q * q, 0);
          info = { R, ev, orth: orth.value, c1, series, cap: d.reduce((a, q) => a + q * q, 0) / tot };
        });
        v.readout(() => {
          if (!info) return SL.note;
          const { R, ev, orth: o, series, cap } = info, bound = o ? ev[1] : ev[0];
          return `Rayleigh quotient $\\mathcal R[\\varphi]=${v.fix(R, 4)}$; ${o ? '$\\lambda_2' : '$\\lambda_1'}=${v.fix(bound, 4)}$ is the bound for this class of trial functions: $\\mathcal R-\\lambda_${o ? 2 : 1}=${v.fix(R - bound, 4)}\\ge0$.\nWeighted average of the first 12 eigenvalues with the weights shown: $${v.fix(series, 4)}$ (the 12 weights carry ${v.fix(100 * cap, 1)}% of $\\|\\varphi\\|^2$).${SL.note ? '\n' + SL.note : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Fredholm alternative for boundary value problems',
      statement: String.raw`Let $L$ be a regular Sturm–Liouville operator with separated (Dirichlet) boundary conditions on $[0,1]$ and $\mu\in\mathbb R$. Exactly one of the following holds.
(a) $\mu$ is not an eigenvalue of $L$: then $Lu-\mu u=f$ has a unique solution for every continuous $f$.
(b) $\mu$ is an eigenvalue with eigenfunction $u_0$ (simple): then $Lu-\mu u=f$ has a solution if and only if $\int_0^1f\,u_0\,dx=0$, and then the solutions form the one-parameter family $u_p+c\,u_0$.
In particular the homogeneous problem has a nonzero solution exactly when the adjoint problem does, and solvability is decided by orthogonality to the null space.`,
      idea: String.raw`Solutions of the inhomogeneous equation with $u(0)=0$ form the line $u=u_p+s\,\varphi$, with $u_p$ the solution with data $(0,0)$ and $\varphi$ the solution of the homogeneous equation with data $(0,1)$ (compare 4.6). The right boundary condition reads $u_p(1)+s\varphi(1)=0$: a single linear equation for $s$. If $\varphi(1)\ne0$ it has a unique root; if $\varphi(1)=0$ ($\mu$ an eigenvalue, $\varphi\propto u_0$) it is solvable iff $u_p(1)=0$. Green's identity applied to $u_p$ and $u_0$ gives $p\,(u_p'u_0-u_pu_0')\big|_0^1=-\int f\,u_0$ up to sign, i.e. $u_p(1)=\mp\frac1{p(1)u_0'(1)}\int fu_0$: solvability *is* orthogonality to $u_0$. For a compact operator on a Hilbert space this is the Fredholm alternative (fa-4.25) applied to the Green operator (4.8).`,
      caption: String.raw`The problem is $u''+\lambda u=f$ on $[0,\pi]$ with $u(0)=u(\pi)=0$, whose eigenvalues are $\lambda=1,4,9,\dots$ with eigenfunctions $\sin nx$. Choose a forcing $f$ (or draw one by dragging over the top panel). Solutions are shot from $0$ with slope $s$; the shot that lands on $0$ at $\pi$ is the solution. For generic $\lambda$ one shot lands. Press $\lambda=1$: all shots now arrive at the same height $u_p(\pi)$, which is exactly $\int_0^\pi f\sin x\,dx$ — zero for $f=\sin2x$ or $\cos x$ (infinitely many solutions, green), nonzero for $f=1$ or $\sin x$ (no solution, red). The forcing $x-\pi/2$ is odd about the midpoint while $\sin x$ is even, so it is orthogonal to $\sin x$ at $\lambda=1$ and $\lambda=9$ but not at $\lambda=4$.`,
      deps: ['ode-4.8', 'fa-4.25'],
      refs: ['Teschl §5.2'],
      tags: ['Fredholm alternative', 'solvability', 'orthogonality'],
      credit: 'I. Fredholm, 1900–1903 (integral equations)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fredholm_alternative' },
      verify: true,
      viz(v) {
        const sF = v.stage({ x: [0, Math.PI], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 250, xlabel: 'x', ylabel: 'f', title: 'forcing $f$ (drag to draw)', weight: 1, minWidth: 260 });
        const sU = v.stage({ x: [0, Math.PI], y: [-3, 3], axes: 'box', gutter: true, height: 250, xlabel: 'x', ylabel: 'u', title: 'shots from $u(0)=0$', weight: 1.2, minWidth: 280 });
        const lam = v.slider('$\\lambda$', 0.2, 16, 2.5, { step: 0.01 });
        for (const k of [1, 2, 3]) v.button(`λ = ${k * k}`, () => lam.set(k * k));
        const fsel = v.select('forcing', [{ value: 'sin1', label: '$\\sin x$' }, { value: 'sin2', label: '$\\sin 2x$' }, { value: 'cos1', label: '$\\cos x$' }, { value: 'one', label: '$1$' }, { value: 'x', label: '$x-\\pi/2$' }, { value: 'draw', label: 'drawn' }], 'one');
        const FS = { sin1: Math.sin, sin2: (x) => Math.sin(2 * x), cos1: Math.cos, one: () => 1, x: (x) => x - Math.PI / 2 };
        const M = 120, drawn = new Float64Array(M + 1); for (let i = 0; i <= M; i++) drawn[i] = 0.8 * Math.cos((3 * Math.PI * i) / M) + 0.3;
        let last = null;
        sF.onDrag((x, y, ph) => {
          if (x < 0 || x > Math.PI) return; const i = Math.round((x / Math.PI) * M); fsel.set('draw');
          if (last !== null && ph !== 'start') { const a = Math.min(i, last), b = Math.max(i, last); for (let k = a; k <= b; k++) drawn[k] = last === i ? y : drawn[last] + ((y - drawn[last]) * (k - last)) / (i - last || 1); }
          drawn[i] = Math.max(-1.55, Math.min(1.55, y)); last = ph === 'end' ? null : i; v.invalidate();
        });
        const fval = (x) => { if (fsel.value !== 'draw') return FS[fsel.value](x); const t = (x / Math.PI) * M, i = Math.min(M - 1, Math.floor(t)), w = t - i; return drawn[i] * (1 - w) + drawn[i + 1] * w; };
        v.legend([['green', 'solves the boundary value problem'], ['red', 'ends away from 0: not a solution'], ['gold', 'null function $\\sin nx$', { dash: true }]]);
        let info = null;
        v.render(() => {
          const l = lam.value, Lh = Math.PI;
          const F = (x, [u, w]) => [w, -l * u + fval(x)], G = (x, [u, w]) => [w, -l * u];
          const A = flow(F, 0, [0, 0], Lh, 600)[600][1][0], alpha = flow(G, 0, [0, 1], Lh, 600)[600][1][0];
          const n = Math.round(Math.sqrt(l)), res = Math.abs(alpha) < 2e-3, Mq = 800;
          // Duhamel / orthogonality: u_p(π) = ∫ f(t) sin(√λ (π − t))/√λ dt
          const sq = Math.sqrt(l), duh = simpson(Array.from({ length: Mq + 1 }, (_, j) => { const t = (Lh * j) / Mq; return fval(t) * Math.sin(sq * (Lh - t)) / sq; }), Lh / Mq);
          const ip = res ? simpson(Array.from({ length: Mq + 1 }, (_, j) => { const t = (Lh * j) / Mq; return fval(t) * Math.sin(n * t); }), Lh / Mq) : NaN;
          const xs = Array.from({ length: 121 }, (_, i) => (Lh * i) / 120);
          sF.path(xs.map((x) => [x, fval(x)]), { color: 'accent', width: 2.6 }); if (res) sF.path(xs.map((x) => [x, Math.sin(n * x)]), { color: 'gold', width: 1.4, dash: [5, 4] });
          const solvable = res ? Math.abs(A) < 2e-3 * Math.max(1, Math.abs(duh)) + 1e-6 : true;
          const shots = res ? [-2, -1, 0, 1, 2] : [-2, -1, 1, 2];
          const draw = (s, col, w) => { const pts = flow(F, 0, [0, s], Lh, 300).map(([x, y]) => [x, y[0]]); sU.clip(() => sU.path(pts, { color: col, width: w })); };
          if (res) { for (const s of shots) draw(s, solvable ? 'green' : 'red', solvable ? 2.2 : 1.8); sU.path(xs.map((x) => [x, Math.sin(n * x)]), { color: 'gold', width: 1.2, dash: [5, 4] }); }
          else { for (const s of shots) draw(s, 'muted', 1.4); draw(-A / alpha, 'green', 3.2); }
          sU.dot(Lh, 0, { r: 6, color: 'red', hollow: true });
          info = { l, A, alpha, res, n, duh, ip, solvable };
        });
        v.readout(() => {
          if (!info) return '';
          const { l, A, alpha, res, n, duh, ip, solvable } = info;
          let r = `$\\lambda=${v.fix(l, 2)}$: $\\varphi(\\pi)=\\sin(\\sqrt\\lambda\\pi)/\\sqrt\\lambda=${v.fix(alpha, 4)}$; particular solution (slope $0$) ends at $u_p(\\pi)=${v.fix(A, 4)}$, and the Duhamel integral $\\int_0^\\pi f(t)\\sin(\\sqrt\\lambda(\\pi-t))/\\sqrt\\lambda\\,dt=${v.fix(duh, 4)}$ agrees.\n`;
          if (!res) r += `Not an eigenvalue: unique solution with slope $s=-u_p(\\pi)/\\varphi(\\pi)=${v.fix(-A / alpha, 3)}$.`;
          else r += `Eigenvalue $n^2=${n * n}$: $\\int_0^\\pi f\\sin(${n}x)\\,dx=${v.fix(ip, 4)}$. ${solvable ? 'It vanishes: **infinitely many** solutions $u_p+c\\sin nx$.' : 'It does not vanish: **no** solution.'}`;
          return r;
        });
      },
    },
  ],
};
