// Ordinary Differential Equations & Dynamical Systems — Chapter 4 (part b): boundary value problems and Sturm–Liouville theory, items 4.6–4.10
import { flow, flowEnd, slControls, slEigenvalues, slEigenpairs, slInner, slPath, slProblem, nodePts, nodeAt, thomas, simpson, SL_PRESETS } from './ch04.shared.js';

export default {
  collection: 'ode',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Boundary value problems: none, one or infinitely many',
      statement: String.raw`Consider $u''+\lambda u=0$ on $[0,L]$ with the boundary conditions $u(0)=0$, $u(L)=b$. If $\lambda\ne(n\pi/L)^2$ for all $n=1,2,\dots$ there is exactly one solution (for $b=0$ it is $u\equiv0$). If $\lambda=(n\pi/L)^2$, then either $b\neq0$ and there is **no** solution, or $b=0$ and there are **infinitely many**, namely all multiples $c\sin(n\pi x/L)$. Initial value problems for the same equation always have exactly one solution (2.4); the difference is that a boundary value problem asks the solution to meet conditions at two different points.`,
      idea: String.raw`The solutions with $u(0)=0$ are $u=s\,\varphi(x;\lambda)$, $\varphi=\sin(\sqrt\lambda x)/\sqrt\lambda$ (with $\sinh$ for $\lambda<0$), one for each initial slope $s$. The end condition becomes the *linear* equation $s\,\varphi(L;\lambda)=b$ in the single unknown $s$. A linear equation $\alpha s=b$ has one solution if $\alpha\ne0$, and if $\alpha=0$ it has none (for $b\ne0$) or all $s$ (for $b=0$). Here $\alpha=\varphi(L;\lambda)$ vanishes exactly at the eigenvalues $(n\pi/L)^2$. This trichotomy is the Fredholm alternative in its simplest form (4.15).`,
      caption: String.raw`Left: solutions of $u''+\lambda u=0$ shot from the origin with different slopes $s$, aiming at the red target $(L,b)$. Right: the end value $u(L)$ for $s=1$ as a function of $\lambda$; its zeros are the eigenvalues $(n\pi/L)^2$. Slide $\lambda$ (or press the button to land exactly on an eigenvalue) and switch the target between $u(L)=0$ and $u(L)=1$: for generic $\lambda$ exactly one shot (green) hits; at an eigenvalue every shot ends at $0$, so they all hit the target $0$ or all miss the target $1$.`,
      deps: ['mech-4.7', 'ode-3.13'],
      refs: ['Teschl §5.1'],
      tags: ['boundary value problem', 'eigenvalue', 'Fredholm alternative'],
      scope: String.raw`Dirichlet conditions $u(0)=0,\ u(L)=b$ for the constant-coefficient equation $u''+\lambda u=0$; the same trichotomy holds for every linear two-point problem.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Boundary_value_problem' },
      viz(v) {
        const sS = v.stage({ x: [0, 6.4], y: [-3.4, 3.4], axes: 'box', gutter: true, height: 330, xlabel: 'x', ylabel: 'u', title: "shooting from $u(0)=0$ with slope $u'(0)=s$", weight: 1.2, minWidth: 280 });
        const sG = v.stage({ x: [-6, 40], y: [-3, 3], axes: 'box', gutter: true, height: 330, xlabel: 'λ', ylabel: 'u(L)', title: "end value $u(L)$ for $u'(0)=1$", weight: 1, minWidth: 260 });
        const Ls = v.slider('length $L$', 2, 6.2, Math.PI, { step: 0.01 }), lam = v.slider('$\\lambda$', -6, 40, 2.2, { step: 0.005 });
        const tgt = v.select('target', [{ value: 0, label: '$u(L)=0$' }, { value: 1, label: '$u(L)=1$' }], 0);
        v.button('jump to nearest eigenvalue', () => { const L = Ls.value, n = Math.max(1, Math.round((Math.sqrt(Math.max(lam.value, 0)) * L) / Math.PI)); lam.set((n * Math.PI / L) ** 2); });
        v.legend([['green', 'solves the boundary value problem'], ['muted', 'misses the target'], ['red', 'target $(L,b)$']]);
        let info = null;
        const slopes = [-2.5, -1.5, -0.8, 0.8, 1.5, 2.5];
        v.render(() => {
          const L = Ls.value, l = lam.value, b = tgt.value, F = (x, [u, w]) => [w, -l * u];
          const g = flowEnd(F, 0, [0, 1], L, 300)[0], res = Math.abs(g) < 2e-3 * Math.max(1, L);
          sS.vline(L, { color: 'faint', dash: true });
          const shoot = (s, col, w) => { const pts = flow(F, 0, [0, s], L, 300).map(([x, y]) => [x, y[0]]); sS.clip(() => sS.path(pts, { color: col, width: w })); };
          let nsol = 0;
          if (res) { for (const s of slopes) shoot(s, b === 0 ? 'green' : 'muted', 1.8); nsol = b === 0 ? Infinity : 0; }
          else { for (const s of slopes) shoot(s, 'muted', 1.4); if (b === 0) { sS.line(0, 0, L, 0, { color: 'green', width: 3 }); } else shoot(b / g, 'green', 3); nsol = 1; }
          sS.dot(L, b, { r: 6, color: 'red', hollow: true }); sS.dot(0, 0, { r: 4, color: 'ink' });
          const gc = []; for (let i = 0; i <= 260; i++) { const x = -6 + (46 * i) / 260; gc.push([x, flowEnd((t, [u, w]) => [w, -x * u], 0, [0, 1], L, 120)[0]]); }
          sG.clip(() => sG.path(gc, { color: 'accent', width: 2.4 }));
          for (let n = 1; (n * Math.PI / L) ** 2 <= 40; n++) { const e = (n * Math.PI / L) ** 2; sG.dot(e, 0, { r: 4, color: 'orange' }); sG.text(String(n), e, 0.35, { size: 11, color: 'orange', align: 'center' }); }
          sG.dot(l, Math.max(-3, Math.min(3, g)), { r: 6, color: 'gold' });
          info = { L, l, g, res, nsol, b };
        });
        v.readout(() => {
          if (!info) return '';
          const { L, l, g, res, nsol, b } = info;
          const near = Math.max(1, Math.round((Math.sqrt(Math.max(l, 0)) * L) / Math.PI)), e = ((near * Math.PI) / L) ** 2;
          let r = `$L=${v.fix(L, 2)}$, $\\lambda=${v.fix(l, 3)}$; nearest eigenvalue $(${near}\\pi/L)^2=${v.fix(e, 3)}$. Shooting function $\\varphi(L;\\lambda)=${v.fix(g, 4)}$.\n`;
          if (res) r += b === 0 ? 'Resonance: every slope $s$ gives $u(L)=0$, so there are **infinitely many** solutions $c\\sin(n\\pi x/L)$.' : 'Resonance: every slope gives $u(L)=0\\ne1$, so there is **no** solution.';
          else r += b === 0 ? `No resonance: $s\\,\\varphi(L)=0$ forces $s=0$, so the **only** solution is $u\\equiv0$.` : `No resonance: $s=b/\\varphi(L)=${v.fix(1 / g, 3)}$ gives the **unique** solution.`;
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Sturm–Liouville problems',
      statement: String.raw`A (regular) *Sturm–Liouville problem* on $[0,1]$ consists of the equation
$$-(p\,u')'+q\,u=\lambda\,w\,u$$
with $p\in C^1$, $p>0$, $w>0$ and $q$ real and continuous on $[0,1]$, together with separated boundary conditions $\cos\alpha\,u(0)-\sin\alpha\,p(0)u'(0)=0$ and $\cos\beta\,u(1)-\sin\beta\,p(1)u'(1)=0$ (Dirichlet: $u=0$; Neumann: $u'=0$). A number $\lambda$ is an *eigenvalue* if there is a nonzero solution (an *eigenfunction*) satisfying both conditions. Equivalently $\tau u=\lambda u$ for $\tau=\frac1w\big(-\frac d{dx}p\frac d{dx}+q\big)$, a symmetric operator in $L^2([0,1];w\,dx)$.`,
      idea: String.raw`Almost every second-order linear equation can be put into this *self-adjoint* form by multiplying by an integrating factor ($p=e^{\int a_1}$ for $u''+a_1u'+\dots$), and almost every classical equation of mathematical physics (vibrating strings and rods, quantum wells, Bessel and Legendre equations on intervals) is of this kind. The eigenvalue problem is solved here by *shooting*: for each $\lambda$ solve the initial value problem that satisfies the left condition and look for the $\lambda$ at which the right condition also holds (compare 4.6, where this was done by hand).`,
      caption: String.raw`Choose a preset or type your own $p,q,w$ (functions of $x$; $p,w$ must stay positive) and the boundary conditions. The eigenvalues are found by shooting and bisection; the first eigenfunctions are drawn (their eigenvalues are listed under the picture) and the coefficient functions are shown on the right. A heavier right end ($w$ large) lowers the eigenvalues, a stiffer middle ($p$ large) raises them, and Neumann ends allow $\lambda=0$ when $q=0$.`,
      deps: ['ode-4.6'],
      refs: ['Teschl §5.3'],
      tags: ['Sturm–Liouville', 'eigenvalue problem', 'self-adjoint'],
      credit: 'C. Sturm & J. Liouville, 1836–1837',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm%E2%80%93Liouville_theory' },
      viz(v) {
        const sE = v.stage({ x: [0, 1], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 330, xlabel: 'x', ylabel: 'u_n', title: 'eigenfunctions', weight: 1.3, minWidth: 290 });
        const sC = v.stage({ x: [0, 1], y: [0, 6], axes: 'box', gutter: true, height: 330, xlabel: 'x', title: 'coefficients $p,\\ q,\\ w$', weight: 0.8, minWidth: 220 });
        const SL = slControls(v);
        const K = v.slider('eigenfunctions shown', 1, 6, 4, { int: true });
        const cols = ['accent', 'orange', 'green', 'purple', 'red', 'teal'];
        let info = null;
        v.render(() => {
          const pr = SL.prob(); if (!pr) return;
          const k = K.value, bc = SL.bc, eps = slEigenpairs(pr, bc, k);
          eps.forEach((e, i) => sE.path(nodePts(e.u), { color: cols[i], width: 2.2 }));
          const prof = (A) => Array.from({ length: pr.N / 2 + 1 }, (_, i) => [i / (pr.N / 2), A[4 * i]]);
          let hi = 1; for (let i = 0; i <= pr.N; i++) hi = Math.max(hi, pr.P[2 * i], pr.W[2 * i], Math.abs(pr.Q[2 * i]));
          sC.setView([0, 1], [Math.min(0, pr.minQ) - 0.2, hi * 1.08]);
          sC.path(prof(pr.P), { color: 'accent', width: 2.4 }); sC.path(prof(pr.Q), { color: 'green', width: 2.4 }); sC.path(prof(pr.W), { color: 'orange', width: 2.4 });
          sC.tex('p', 0.04, pr.P[0] + 0.1 * hi, { color: 'accent' }); sC.tex('q', 0.5, pr.Q[pr.N] + 0.06 * hi, { color: 'green' }); sC.tex('w', 0.96, pr.W[2 * pr.N] + 0.06 * hi, { color: 'orange' });
          const nrm = Math.max(...eps.map((e) => Math.max(...Array.from(e.u).map(Math.abs))));
          sE.setView([0, 1], [-1.15 * nrm, 1.15 * nrm]);
          info = { lams: eps.map((e) => e.lam), bc, S: pr.S };
        });
        v.legend([['accent', 'first eigenfunction'], ['orange', 'second'], ['green', 'third'], ['purple', 'fourth']]);
        v.readout(() => {
          const pr = SL.prob(); if (!info) return SL.note;
          const { lams, bc, S } = info, nm = { DD: 'Dirichlet–Dirichlet', NN: 'Neumann–Neumann', DN: 'Dirichlet at 0, Neumann at 1' }[bc];
          return `Eigenvalues (${nm}): ${lams.map((l, i) => `$\\lambda_${i + 1}=${v.fix(l, 3)}$`).join(', ')}.\nWeyl estimate $\\lambda_n\\approx(n\\pi/S)^2$ with $S=\\int_0^1\\sqrt{w/p}=${v.fix(S, 3)}$ (exact for large $n$ only).${SL.note ? '\n' + SL.note : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Green’s function of a boundary value problem',
      statement: String.raw`For $Lu=-(pu')'+qu$ with Dirichlet conditions $u(0)=u(1)=0$ such that $0$ is not an eigenvalue, let $u_1,u_2$ be solutions of $Lu=0$ with $u_1(0)=0$ and $u_2(1)=0$. The *Green's function* is
$$G(x,s)=\frac{u_1(\min(x,s))\,u_2(\max(x,s))}{C},\qquad C=p\,(u_1'u_2-u_1u_2')\ \text{(a nonzero constant)}.$$
It is continuous and symmetric, $G(x,s)=G(s,x)$, satisfies the boundary conditions in $x$, solves $LG(\cdot,s)=0$ away from $x=s$ and has the jump $p\,\partial_xG\big|_{s^-}^{s^+}=-1$ there (a unit point force at $s$). For every continuous $f$ the problem $Lu=f$, $u(0)=u(1)=0$ has the unique solution $u(x)=\int_0^1G(x,s)f(s)\,ds$.`,
      idea: String.raw`Fix $s$ and ask for the solution of $Lu=\delta_s$. To the left of $s$ it must satisfy the left boundary condition, so it is a multiple of $u_1$; to the right a multiple of $u_2$; the two multiples are fixed by continuity at $s$ and by the jump of $pu'$ equal to $-1$, which is where the constant $C$ (the Wronskian of $u_1,u_2$ times $p$, constant by Abel's identity 3.11) enters. Symmetry is visible from the formula. Superposing point forces gives $u=\int G f$: this is variation of constants (3.12) with boundary conditions in place of initial ones.`,
      caption: String.raw`The blue curve is the displacement $G(\cdot,s)$ of a string (or beam on an elastic foundation, or a tapered string) held at both ends under a unit force at $s$; the dashed orange curve is $G(\cdot,t)$ for a force at $t$. Drag the point $(t,s)$ in the right-hand map of $G(x,s)$: the two heights $G(t,s)$ and $G(s,t)$ (dots) are always equal. Pick a load $f$ to see the solution $\int Gf$ (green) match a direct finite-difference solution of $Lu=f$ (black dashed).`,
      deps: ['ode-4.7', 'ode-3.12'],
      refs: ['Teschl §5.3'],
      tags: ['Green function', 'boundary value problem', 'impulse response'],
      credit: 'G. Green, 1828 (Green’s functions); the one-dimensional boundary-value form is later',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Green%27s_function' },
      verify: true,
      viz(v) {
                const sA = v.stage({ x: [0, 1], y: [-0.03, 0.34], axes: 'box', gutter: true, height: 330, xlabel: 'x', ylabel: 'G', title: 'response to a unit force', weight: 1.2, minWidth: 290 });
        const sM = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 330, xlabel: 'x', ylabel: 's', title: 'the map of $G(x,s)$', weight: 0.9, minWidth: 250 });
        const op = v.select('operator', [{ value: 'string', label: '$-u^{\\prime\\prime}$ (string)' }, { value: 'found', label: '$-u^{\\prime\\prime}+40u$ (foundation)' }, { value: 'taper', label: '$-((1+3x)u^\\prime)^\\prime$ (taper)' }], 'string');
        const load = v.select('load $f$', [{ value: 'none', label: 'none' }, { value: 'one', label: '$1$' }, { value: 'sin', label: '$\\sin 3\\pi x$' }, { value: 'bump', label: 'bump at $0.7$' }], 'none');
        const H = sM.handle(0.7, 0.3, { color: 'red', label: '(t, s)', labelPos: 'ne', constrain: { x: [0.04, 0.96], y: [0.04, 0.96] } });
        const cache = {};
        const build = (key) => {
          if (cache[key]) return cache[key];
          const cp = { string: () => 1, found: () => 1, taper: (x) => 1 + 3 * x }[key];
          const pr = slProblem(cp, () => (key === 'found' ? 40 : 0), () => 1, 600), N = pr.N;
          const a = slPath(pr, 0, 0, 1, 1), b = slPath(pr, 0, 0, -1, -1), C = b.u[N / 2] * a.v[N / 2] - a.u[N / 2] * b.v[N / 2];
          const G = (x, s) => { const lo = Math.min(x, s), hi = Math.max(x, s); return (nodeAt(a.u, lo) * nodeAt(b.u, hi)) / C; };
          const fd = (f) => { // finite differences for -(p u')' + q u = f, u(0)=u(1)=0; f given at the N+1 nodes
            const n = N - 1, A = new Float64Array(n), B = new Float64Array(n), Cc = new Float64Array(n), R = new Float64Array(n), h2 = 1 / (N * N);
            for (let i = 1; i <= N - 1; i++) { const pm = pr.P[2 * i - 1], pp = pr.P[2 * i + 1]; A[i - 1] = -pm / h2; Cc[i - 1] = -pp / h2; B[i - 1] = (pm + pp) / h2 + pr.Q[2 * i]; R[i - 1] = f[i]; }
            const x = thomas(A, B, Cc, R), out = new Float64Array(N + 1); for (let i = 1; i < N; i++) out[i] = x[i - 1]; return out;
          };
          return (cache[key] = { pr, N, G, fd, C });
        };
        const ldf = { one: () => 1, sin: (x) => Math.sin(3 * Math.PI * x), bump: (x) => Math.exp(-((x - 0.7) ** 2) / (2 * 0.06 ** 2)) };
        v.legend([['accent', '$G(x,s)$, force at $s$'], ['orange', '$G(x,t)$, force at $t$', { dash: true }], ['green', '$u=\\int G f$'], ['ink', 'direct finite-difference solution', { dash: true }]]);
        let info = null;
        v.render(() => {
          const B = build(op.value), { N, G, fd } = B, t = H.x, s = H.y;
          let mx = 0; for (let i = 0; i <= 60; i++) mx = Math.max(mx, G(i / 60, 0.5));
          const sc = Math.max(0.05, mx * 1.35);
          sA.setView([0, 1], [-0.12 * sc, 1.12 * sc]);
          const xs = Array.from({ length: 201 }, (_, i) => i / 200);
          sA.path(xs.map((x) => [x, G(x, s)]), { color: 'accent', width: 2.6 });
          sA.path(xs.map((x) => [x, G(x, t)]), { color: 'orange', width: 2.2, dash: [6, 4] });
          sA.arrow(s, -0.1 * sc, s, 0, { color: 'accent', width: 2 }); sA.arrow(t, -0.1 * sc, t, 0, { color: 'orange', width: 2 });
          sA.dot(t, G(t, s), { r: 5, color: 'accent' }); sA.dot(s, G(s, t), { r: 5, color: 'orange', hollow: true });
          sM.raster((x, y) => { const g = G(x, y) / (mx || 1), c = v.ramp(Math.min(1, Math.max(0, g)), 'accent'); return [c[0], c[1], c[2], 1]; }, { res: 3, key: `G${op.value}${v.diverge(1).join()}` });
          sM.contour((x, y) => G(x, y), 7, { color: 'ink', alpha: 0.35, width: 1 });
          sM.line(0, 0, 1, 1, { color: 'muted', dash: [4, 4], width: 1 });
          sM.dot(s, t, { r: 5, color: 'orange', hollow: true, label: '(s, t)', labelPos: 'sw' });
          // two independent finite-difference impulse responses
          const imp = (pos) => { const f = new Float64Array(N + 1); const i = Math.round(pos * N); f[i] = N; return fd(f); };
          const gts = nodeAt(imp(s), t), gst = nodeAt(imp(t), s);
          let err = null;
          if (load.value !== 'none') {
            const f = ldf[load.value], M = 400, uq = (x) => simpson(Array.from({ length: M + 1 }, (_, j) => G(x, j / M) * f(j / M)), 1 / M);
            const uG = xs.map((x) => [x, uq(x)]), fn = new Float64Array(N + 1); for (let i = 0; i <= N; i++) fn[i] = f(i / N);
            const ud = fd(fn); let e = 0, un = 0; for (const [x, y] of uG) { e = Math.max(e, Math.abs(y - nodeAt(ud, x))); un = Math.max(un, Math.abs(y)); }
            sA.setView([0, 1], [-0.12 * Math.max(sc, un * 1.2), 1.12 * Math.max(sc, un * 1.2)]);
            sA.path(uG, { color: 'green', width: 3 }); sA.path(xs.map((x) => [x, nodeAt(ud, x)]), { color: 'ink', width: 1.6, dash: [6, 4] });
            err = { e, un };
          }
          info = { t, s, g1: G(t, s), g2: G(s, t), gts, gst, err, C: B.C };
        });
        v.readout(() => {
          if (!info) return '';
          const { t, s, g1, g2, gts, gst, err, C } = info;
          return `Wronskian constant $C=p(u_1'u_2-u_1u_2')=${v.fix(C, 4)}$. At $(t,s)=(${v.fix(t, 2)},${v.fix(s, 2)})$: $G(t,s)=${v.fix(g1, 5)}$ and $G(s,t)=${v.fix(g2, 5)}$ from the formula; the finite-difference responses to point forces give $${v.fix(gts, 5)}$ and $${v.fix(gst, 5)}$.${err ? `\nLoad: $\\max|\\int Gf-u_{\\rm FD}|=${v.sci(err.e, 2)}$ against $\\max|u|=${v.fix(err.un, 3)}$.` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Regular Sturm–Liouville eigenvalues and eigenfunctions',
      statement: String.raw`For a regular Sturm–Liouville problem (4.7) the eigenvalues are real and simple and form a sequence $\lambda_1<\lambda_2<\lambda_3<\cdots\to+\infty$ (bounded below). The eigenfunctions $u_n$ can be chosen real; eigenfunctions of different eigenvalues are orthogonal in $L^2([0,1];w\,dx)$, $\int_0^1u_mu_nw\,dx=0$ for $m\ne n$; and (4.10) they form an orthonormal basis of that space. Asymptotically $\lambda_n\sim\big(n\pi/\int_0^1\sqrt{w/p}\,dx\big)^2$.`,
      idea: String.raw`Self-adjointness does the work: for $\tau u=\lambda u$, $\tau v=\mu v$ integration by parts leaves only boundary terms, which vanish for separated conditions, so $(\lambda-\mu)\int uvw=0$; taking $v=\bar u$ shows $\lambda$ real, and different eigenvalues give orthogonal functions. Simplicity: both solutions of the initial value problem satisfying the left condition are multiples of one function, so the eigenspace is one-dimensional. Existence of infinitely many eigenvalues follows from the Green function (4.8) giving a compact self-adjoint inverse operator, to which the spectral theorem for compact operators applies (fa-12.30); the Weyl asymptotics follow from the Prüfer-angle argument behind 4.13.`,
      caption: String.raw`The first eigenfunctions are computed by shooting (left); the matrix in the middle is $\langle u_i,u_j\rangle_w$ computed by quadrature: ones on the diagonal and zeros (to about $10^{-8}$) elsewhere. Right: $\lambda_n$ divided by the Weyl prediction $(n\pi/S)^2$ approaches $1$. Edit $p,q,w$ or the boundary conditions — the structure survives, only the numbers move.`,
      deps: ['ode-4.8', 'fa-12.30', 'fa-4.25'],
      refs: ['Teschl §5.4', 'Teschl §5.2'],
      tags: ['Sturm–Liouville', 'spectral theorem', 'orthogonality'],
      credit: 'C. Sturm & J. Liouville, 1836–1837 (operator-theoretic proofs: Hilbert, Steklov, early 1900s)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm%E2%80%93Liouville_theory' },
      verify: true,
      viz(v) {
        const sE = v.stage({ x: [0, 1], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 300, xlabel: 'x', ylabel: 'u_n', title: 'eigenfunctions', weight: 1.1, minWidth: 260 });
        const sG = v.stage({ x: [-0.9, 6.15], y: [-0.2, 6.2], aspect: 1, axes: false, title: 'Gram matrix $\\langle u_i,u_j\\rangle_w$', weight: 0.9, minWidth: 250 });
        const sW = v.stage({ x: [0, 13], y: [0.4, 1.6], axes: 'box', gutter: true, height: 300, xlabel: 'n', ylabel: 'λₙ / Weyl', title: '$\\lambda_n$ against the asymptotic law', weight: 0.9, minWidth: 240 });
        const SL = slControls(v, { N: 600, init: 'heavy' });
        const cols = ['accent', 'orange', 'green', 'purple', 'red', 'teal'];
        let info = null;
        v.render(() => {
          const pr = SL.prob(); if (!pr) return;
          const bc = SL.bc, M = 12, eps = slEigenpairs(pr, bc, M), K = 6;
          let nrm = 1; eps.slice(0, K).forEach((e, i) => { sE.path(nodePts(e.u), { color: cols[i], width: 2 }); nrm = Math.max(nrm, ...Array.from(e.u).map(Math.abs)); });
          sE.setView([0, 1], [-1.15 * nrm, 1.15 * nrm]);
          let off = 0, dev = 0;
          for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
            const ip = slInner(pr, eps[i].u, eps[j].u); if (i !== j) off = Math.max(off, Math.abs(ip)); else dev = Math.max(dev, Math.abs(ip - 1));
            const c = v.ramp(Math.min(1, Math.abs(ip)), 'accent'); sG.rect(j + 0.04, 5 - i + 0.04, j + 0.96, 5 - i + 0.96, { fill: [c[0], c[1], c[2], 1], stroke: false });
            sG.text(Math.abs(ip) < 5e-7 ? '0' : v.fix(ip, 3), j + 0.5, 5 - i + 0.5, { size: 11, align: 'center', baseline: 'middle', color: i === j ? 'ink' : 'muted' });
          }
          for (let k = 0; k < K; k++) { sG.text(String(k + 1), k + 0.5, 6.0, { size: 11, align: 'center', color: 'muted' }); sG.text(String(k + 1), -0.1, 5 - k + 0.5, { size: 11, align: 'right', baseline: 'middle', color: 'muted' }); }
          const ratios = eps.map((e, i) => { const n = i + (bc === 'NN' ? 0 : 1); return [i + 1, e.lam / ((((bc === 'DN' ? n - 0.5 : n) * Math.PI) / pr.S) ** 2)]; }).filter((q) => isFinite(q[1]) && q[1] > 0 || (isFinite(q[1]) && q[1] === 0));
          sW.hline(1, { color: 'green', dash: true, width: 1.4 });
          sW.path(ratios, { color: 'accent', width: 1.6 }); sW.dots(ratios, { r: 4, color: 'accent' });
          let gaps = true; for (let i = 1; i < M; i++) if (!(eps[i].lam > eps[i - 1].lam)) gaps = false;
          info = { lams: eps.map((e) => e.lam), off, dev, gaps, ratios };
        });
        v.readout(() => {
          if (!info) return SL.note;
          const { lams, off, dev, gaps, ratios } = info;
          return `First twelve eigenvalues, strictly increasing (${gaps ? 'yes' : 'no'}): ${lams.slice(0, 6).map((l) => '$' + v.fix(l, 3) + '$').join(', ')}, …, $${v.fix(lams[11], 2)}$.\nOrthogonality in $L^2(w)$: largest off-diagonal Gram entry $${v.sci(off || 1e-17, 2)}$; diagonal deviates from $1$ by $${v.sci(dev || 1e-17, 2)}$. Weyl ratio at $n=12$: $${v.fix(ratios[ratios.length - 1][1], 4)}$.${SL.note ? '\n' + SL.note : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Eigenfunction expansions',
      statement: String.raw`Let $u_1,u_2,\dots$ be the orthonormal eigenfunctions of a regular Sturm–Liouville problem in $L^2([0,1];w\,dx)$. Every $f$ in this space is the $L^2$-limit of its eigenfunction series,
$$f=\sum_{n\ge1}c_nu_n,\qquad c_n=\int_0^1f\,u_n\,w\,dx,\qquad \|f\|_w^2=\sum_n|c_n|^2\ \ (\text{Parseval}),$$
i.e. $\big\|f-\sum_{n\le N}c_nu_n\big\|_w\to0$. If $f$ is also continuous, piecewise $C^1$ and satisfies the boundary conditions, the series converges absolutely and uniformly.`,
      idea: String.raw`The partial sums are orthogonal projections onto $\operatorname{span}(u_1,\dots,u_N)$, so by Pythagoras $\|f-S_N\|^2=\|f\|^2-\sum_{n\le N}c_n^2$ and Bessel's inequality holds. Parseval, i.e. completeness, is the nontrivial part: the eigenfunctions of the compact self-adjoint Green operator (4.8) span the orthogonal complement of its kernel, and the kernel is $\{0\}$ because $0$ is not an eigenvalue. Smoothness controls speed: integrating by parts twice with $\tau u_n=\lambda_nu_n$ gives $c_n=\langle\tau f,u_n\rangle/\lambda_n$, so $c_n$ decays like $n^{-2}$ if $f$ is smooth enough and satisfies the boundary conditions, and much more slowly otherwise.`,
      caption: String.raw`Pick a function or draw your own by dragging across the top panel, pick a Sturm–Liouville problem (the classical case $p=w=1$ gives sine or cosine series), and add terms with the slider: the partial sum (orange) approaches $f$ (blue) in mean square. Middle: the coefficients $c_n$. Right: the weighted $L^2$ error against $N$ on a log scale, together with the Parseval value $\sqrt{\|f\|^2-\sum c_n^2}$, which agrees with it. A function that violates the boundary conditions (the parabola with Dirichlet ends is fine; $1$ is not) converges slowly and shows the Gibbs effect near the ends.`,
      deps: ['ode-4.9', 'rca-4.18'],
      refs: ['Teschl §5.4'],
      tags: ['eigenfunction expansion', 'Fourier series', 'completeness'],
      credit: 'J. Fourier (special cases, 1822); general completeness: V. Steklov, 1896 onward',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm%E2%80%93Liouville_theory#Sturm%E2%80%93Liouville_theory' },
      verify: true,
      viz(v) {
        const sF = v.stage({ x: [0, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 300, xlabel: 'x', ylabel: 'f', title: 'function and partial sum (drag to draw)', weight: 1.3, minWidth: 290 });
        const sC = v.stage({ x: [0, 31], y: [-1, 1], axes: 'box', gutter: true, height: 300, xlabel: 'n', ylabel: 'c_n', title: 'coefficients', weight: 0.9, minWidth: 230 });
        const sR = v.stage({ x: [0, 31], y: [1e-3, 3], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'N', ylabel: '‖f − S_N‖', title: 'error against $N$', weight: 0.9, minWidth: 230 });
        const SL = slControls(v, { edit: false, N: 600 });
        const fsel = v.select('function', [{ value: 'tent', label: 'tent' }, { value: 'step', label: 'step' }, { value: 'par', label: '$x(1-x)$' }, { value: 'one', label: '$1$' }, { value: 'saw', label: 'sawtooth' }, { value: 'draw', label: 'drawn' }], 'tent');
        const Nn = v.slider('terms $N$', 1, 30, 6, { int: true });
        const FUN = { tent: (x) => (x < 0.5 ? 2 * x : 2 - 2 * x), step: (x) => (x < 0.4 ? 0 : x < 0.75 ? 1 : 0.4), par: (x) => 4 * x * (1 - x), one: () => 1, saw: (x) => 2 * ((3 * x) % 1) - 1 };
        const drawn = new Float64Array(201); for (let i = 0; i <= 200; i++) drawn[i] = Math.sin(5 * Math.PI * (i / 200)) * 0.5 + 0.5 * Math.sin(2 * Math.PI * (i / 200));
        let last = null;
        sF.onDrag((x, y, ph) => {
          if (x < 0 || x > 1) return; const i = Math.round(x * 200); fsel.set('draw');
          if (last !== null && ph !== 'start') { const a = Math.min(i, last), b = Math.max(i, last); for (let k = a; k <= b; k++) drawn[k] = last === i ? y : drawn[last] + ((y - drawn[last]) * (k - last)) / (i - last || 1); }
          drawn[i] = Math.max(-1.45, Math.min(1.45, y)); last = ph === 'end' ? null : i; v.invalidate();
        });
        v.legend([['accent', '$f$'], ['orange', 'partial sum $S_N$'], ['green', 'Parseval value', { dash: true }]]);
        let info = null;
        v.render(() => {
          const pr = SL.prob(); if (!pr) return;
          const bc = SL.bc, N = Nn.value, ep = slEigenpairs(pr, bc, 30), n = pr.N;
          const f = new Float64Array(n + 1), key = fsel.value;
          for (let i = 0; i <= n; i++) f[i] = key === 'draw' ? drawn[Math.round((i / n) * 200)] : FUN[key](i / n);
          const c = ep.map((e) => slInner(pr, f, e.u)), ff = slInner(pr, f, f);
          const S = new Float64Array(n + 1); for (let k = 0; k < N; k++) for (let i = 0; i <= n; i++) S[i] += c[k] * ep[k].u[i];
          const errAt = (m) => { const R = new Float64Array(n + 1); for (let i = 0; i <= n; i++) { let s = f[i]; for (let k = 0; k < m; k++) s -= c[k] * ep[k].u[i]; R[i] = s; } return Math.sqrt(slInner(pr, R, R)); };
          sF.path(nodePts(f), { color: 'accent', width: 2.4 }); sF.path(nodePts(S), { color: 'orange', width: 2.2 });
          const mc = Math.max(0.1, ...c.map(Math.abs)); sC.setView([0, 31], [-1.15 * mc, 1.15 * mc]);
          sC.bars(c, { x0: 1, color: (q, i) => (i < N ? 'accent' : 'faint') });
          const errs = [], par = []; let cum = 0;
          for (let m = 0; m <= 30; m++) { if (m > 0) cum += c[m - 1] ** 2; errs.push([m, Math.max(1e-6, errAt(m))]); par.push([m, Math.sqrt(Math.max(1e-12, ff - cum))]); }
          sR.setView([0, 31], [Math.max(1e-4, Math.min(...errs.slice(1).map((e) => e[1])) / 2), 2 * Math.max(...errs.map((e) => e[1]))]);
          sR.path(errs.slice(1), { color: 'orange', width: 2.2 }); sR.dots(errs.slice(1), { r: 3, color: 'orange' }); sR.path(par.slice(1), { color: 'green', width: 1.4, dash: [5, 4] });
          sR.vline(N, { color: 'ink', alpha: 0.5, dash: true });
          info = { N, e: errAt(N), pe: par[N][1], ff, cum: c.slice(0, N).reduce((a, q) => a + q * q, 0) };
        });
        v.readout(() => {
          if (!info) return SL.note;
          const { N, e, pe, ff, cum } = info;
          return `$N=${N}$: $\\|f\\|_w^2=${v.fix(ff, 5)}$, $\\sum_{n\\le N}c_n^2=${v.fix(cum, 5)}$ (Bessel: never exceeds $\\|f\\|^2$). Error $\\|f-S_N\\|_w=${v.fix(e, 5)}$; Parseval value $\\sqrt{\\|f\\|^2-\\sum c_n^2}=${v.fix(pe, 5)}$.${SL.note ? '\n' + SL.note : ''}`;
        });
      },
    },
  ],
};
