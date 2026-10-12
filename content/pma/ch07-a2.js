// Rudin, Principles of Mathematical Analysis — Chapter 7 (part 2): 7.12–7.17
// Uniform convergence and continuity, Dini, the space C(X), integration and differentiation.
// (7.18, the nowhere-differentiable function, and everything after it live in ch07-b*.js.)

/** Draw a limit function that may jump: pieces between jump points, hollow one-sided limits, filled value. */
function drawLimit(s, F, st = {}) {
  const col = st.color || 'green';
  const J = F.jumps || [];
  const cuts = [F.a, ...J, F.b];
  const eta = (F.b - F.a) * 1e-6;
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? eta : 0), hi = cuts[i + 1] - (i + 1 < cuts.length - 1 ? eta : 0);
    s.fn(F.lim, { domain: [lo, hi], color: col, width: st.width ?? 2.6 });
  }
  for (const j of J) {
    if (j > F.a) s.dot(j, F.lim(j - eta), { hollow: true, color: col, r: 4.5, width: 2 });
    if (j < F.b) s.dot(j, F.lim(j + eta), { hollow: true, color: col, r: 4.5, width: 2 });
    s.dot(j, F.lim(j), { color: col, r: 4.5 });
  }
}

/** Unicode subscript digits for canvas labels. */
const sub = (k) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[+d]);

export default {
  book: 'pma',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Theorem',
      name: 'A uniform limit of continuous functions is continuous',
      statement: String.raw`If $\{f_n\}$ is a sequence of continuous functions on $E$ and $f_n\to f$ uniformly on $E$, then $f$ is continuous on $E$.`,
      idea: String.raw`At a limit point $x$ of $E$, continuity of $f_n$ says $\lim_{t\to x}f_n(t)=f_n(x)$, and 7.11 lets the limits in $t$ and $n$ be exchanged, so $\lim_{t\to x}f(t)=f(x)$. Unwound, this is the "$\eps/3$ argument": pick one $n$ with $\|f_n-f\|<\eps/3$, take $\delta$ from the continuity of that single $f_n$, and then $|f(t)-f(x)|\le|f(t)-f_n(t)|+|f_n(t)-f_n(x)|+|f_n(x)-f(x)|<\eps$. The converse is false: $nx/(1+n^2x^2)$ tends to the continuous function $0$, but not uniformly.`,
      caption: String.raw`The blue tube has half-width $\eps/3$ about $f_n$; the orange window is a $\delta$ that works for $f_n$ at $x_0$ with tolerance $\eps/3$. When $\|f_n-f\|<\eps/3$ the graph of $f$ is trapped in the tube, so over the window it stays inside the box of height $2\eps$ — continuity of $f$ at $x_0$. For Rudin's Example 7.3 and for $\tfrac2\pi\arctan nx$ the convergence is not uniform, no $n$ qualifies, and at $x_0=0$ the limit escapes every box.`,
      deps: ['pma-7.11', 'pma-4.6', 'pma-7.7'],
      tags: ['uniform convergence', 'continuity'],
      viz(v) {
        const M = v.M;
        const S73 = (n, x) => (x === 0 ? 0 : (1 + x * x) * (1 - Math.pow(1 / (1 + x * x), n + 1)));
        const supCache = {};
        const FAM = {
          exp: { label: '$(1+x/n)^n$ on $[-1,1]$', a: -1, b: 1, y: [-0.35, 3.3], x0: 0.45, f: (n, x) => Math.pow(1 + x / n, n), lim: Math.exp,
            Mn(n) { const c = supCache.exp ||= []; if (c[n] == null) { let m = 0; for (let i = 0; i <= 800; i++) { const x = -1 + 2 * i / 800; m = Math.max(m, Math.abs(Math.exp(x) - Math.pow(1 + x / n, n))); } c[n] = m; } return c[n]; } },
          ser: { label: 'Example 7.3: $\\sum_{k=0}^n\\frac{x^2}{(1+x^2)^k}$', a: -1, b: 1, y: [-0.7, 2.6], x0: 0, jumps: [0], f: S73, lim: (x) => (x === 0 ? 0 : 1 + x * x), Mn: () => 1 },
          atan: { label: '$\\frac{2}{\\pi}\\arctan nx$ on $[-1,1]$', a: -1, b: 1, y: [-1.6, 1.6], x0: 0, jumps: [0], f: (n, x) => 2 / Math.PI * Math.atan(n * x), lim: (x) => Math.sign(x), Mn: () => 1 },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'exp');
        const nS = v.slider('$n$', 1, 60, 12, { int: true });
        const eS = v.slider('$\\varepsilon$', 0.1, 1.5, 0.6, { step: 0.01 });
        const S = v.stage({ x: [-1.1, 1.1], y: [-0.35, 3.3], height: 380, full: true, title: 'the $\\varepsilon/3$ argument at a point $x_0$' });
        const h = S.handle(0.45, 0, { color: 'gold', constrain: (x) => { const F = FAM[which.value]; const xx = M.clamp(x, F.a, F.b); return [xx, F.lim(xx)]; } });
        let last = null, info = {};
        v.legend([['accent', '$f_n$'], ['accent', 'tube $f_n\\pm\\varepsilon/3$', { area: true }], ['green', 'limit $f$'], ['orange', '$\\delta$-window for $f_n$', { area: true }], ['muted', 'box $|f(t)-f(x_0)|<\\varepsilon$', { dash: true }]]);
        v.render(() => {
          const F = FAM[which.value], n = nS.value, e = eS.value, w = F.b - F.a;
          if (last !== which.value) { last = which.value; S.setView([F.a - 0.04 * w, F.b + 0.04 * w], F.y); h.x = F.x0; }
          h.y = F.lim(h.x);
          const x0 = h.x, fx = F.lim(x0), fn = (x) => F.f(n, x), Mn = F.Mn(n), good = Mn < e / 3;
          // δ for f_n at x0 with tolerance ε/3
          const step = w / 4000, fnx = fn(x0);
          let dr = F.b - x0, dl = x0 - F.a;
          for (let t = x0 + step; t <= F.b; t += step) if (Math.abs(fn(t) - fnx) >= e / 3) { dr = t - x0; break; }
          for (let t = x0 - step; t >= F.a; t -= step) if (Math.abs(fn(t) - fnx) >= e / 3) { dl = x0 - t; break; }
          const d = Math.max(step, Math.min(dr, dl));
          const lo = Math.max(F.a, x0 - d), hi = Math.min(F.b, x0 + d);
          // largest |f(t) − f(x0)| on the window (jump points included)
          let worst = 0; const ts = M.linspace(lo, hi, 700); for (const j of F.jumps || []) if (j > lo && j < hi) ts.push(j, j - 1e-9, j + 1e-9);
          for (const t of ts) worst = Math.max(worst, Math.abs(F.lim(t) - fx));
          const inBox = worst < e;
          // drawing
          S.vband(lo, hi, { color: 'orange', alpha: 0.12, edges: true });
          S.between((x) => fn(x) + e / 3, (x) => fn(x) - e / 3, F.a, F.b, { fill: 'accent', fillAlpha: 0.13, n: 700 });
          S.fn(fn, { domain: [F.a, F.b], color: 'accent', width: 2.4 });
          drawLimit(S, F, { width: 2.4 });
          S.rect(lo, fx - e, hi, fx + e, { color: inBox ? 'green' : 'red', width: 2, dash: [6, 4] });
          // the part of f leaving the box, in red
          const out = []; for (let i = 0; i <= 600; i++) { const t = lo + (hi - lo) * i / 600; const y = F.lim(t); out.push(Math.abs(y - fx) >= e ? [t, y] : null); }
          S.path(out, { color: 'red', width: 4 });
          S.measure(hi, fx, hi, fx + e, 'ε', { color: inBox ? 'green' : 'red', offset: 12 });
          S.tex('\\delta\\text{-window}', x0, S.bounds.y[1], { color: 'orange', baseline: 'top', dy: 6 });
          S.tex('x_0', x0, S.bounds.y[0], { color: 'gold', baseline: 'bottom', dy: -4, dx: 10 });
          S.corner(good ? `‖f${sub(n)} − f‖ = ${v.fmt(Mn, 3)} < ε/3: the argument applies` : `‖f${sub(n)} − f‖ = ${v.fmt(Mn, 3)} ≥ ε/3: no guarantee`, 'tl', { color: good ? 'green' : 'red', weight: 600 });
          info = { F, n, e, Mn, d, worst, inBox, good, x0 };
        });
        v.readout(() => {
          const { F, e, Mn, d, worst, inBox, good, x0 } = info; if (!F) return '';
          return `$x_0=${v.fix(x0, 3)}$, $\\;\\|f_n-f\\| = ${v.fmt(Mn, 3)}$ ${good ? '$<$' : '$\\ge$'} $\\varepsilon/3 = ${v.fix(e / 3, 3)}$, $\\;\\delta = ${v.fmt(d, 3)}$; $\\;\\sup_{|t-x_0|<\\delta}|f(t)-f(x_0)| = ${v.fmt(worst, 3)}$ ${inBox ? '$<\\varepsilon$ ✓' : '$\\ge\\varepsilon$ ✗'}` +
            (good ? '' : (inBox ? ' (here $f$ happens to be continuous at $x_0$ anyway).' : ' — the limit is discontinuous at $x_0$.'));
        });
      },
    },

    // ------------------------------------------------------------------ 7.13
    {
      num: '7.13',
      kind: 'Theorem',
      name: "Dini's theorem",
      statement: String.raw`Suppose $K$ is compact and
(a) $\{f_n\}$ is a sequence of continuous functions on $K$,
(b) $f_n\to f$ pointwise on $K$, where $f$ is continuous on $K$,
(c) $f_n(x)\ge f_{n+1}(x)$ for every $x\in K$ and $n=1,2,3,\dots$
Then $f_n\to f$ uniformly on $K$.`,
      idea: String.raw`Put $g_n=f_n-f$: these are continuous, $g_n\ge g_{n+1}\ge0$, and $g_n\to0$ pointwise. Fix $\eps>0$ and let $K_n=\{x\in K: g_n(x)\ge\eps\}$. Each $K_n$ is closed (4.8), hence compact (2.35); the sets are nested, $K_n\supset K_{n+1}$; and no point lies in all of them, since $g_n(x)\to0$. By the finite intersection property (2.36) some $K_N$ is empty, and then $0\le g_n<\eps$ on $K$ for all $n\ge N$.`,
      caption: String.raw`Top: the error functions $g_k=f_k-f$ and the current one in blue; the red interval is $K_n=\{g_n\ge\eps\}$. Bottom: the whole stack $K_1\supset K_2\supset\cdots$. With all hypotheses the stack runs dry at a finite $N$. Break one at a time: on the non-compact $(0,1)$ the $K_k$ shrink toward the missing endpoint but never vanish; with the discontinuous limit of $x^n$ they are not closed; for the travelling bump they are not nested — and each time uniform convergence fails.`,
      deps: ['pma-7.7', 'pma-2.35', 'pma-2.36', 'pma-4.8'],
      tags: ['uniform convergence', 'compactness', 'monotone sequences'],
      viz(v) {
        const M = v.M, KMAX = 30;
        const uRoots = (e) => [M.bisect((u) => u * Math.exp(1 - u) - e, 0, 1), M.bisect((u) => e - u * Math.exp(1 - u), 1, 80)];
        const FAM = {
          sqrt: { label: '$\\sqrt{x^2+1/n}\\downarrow|x|$ on $[-1,1]$', a: -1, b: 1, y: [-0.3, 1.12], hyp: [true, true, true],
            g: (n, x) => Math.sqrt(x * x + 1 / n) - Math.abs(x), sup: (n) => 1 / Math.sqrt(n),
            K: (n, e) => { const r = (1 / n - e * e) / (2 * e); return r < 0 ? [] : [{ lo: -Math.min(r, 1), hi: Math.min(r, 1), lo_: false, hi_: false }]; } },
          open: { label: '$\\frac{1}{nx+1}\\downarrow0$ on $(0,1)$', a: 0, b: 1, y: [-0.3, 1.12], hyp: [false, true, true], openEnds: [true, true],
            g: (n, x) => 1 / (n * x + 1), sup: () => 1,
            K: (n, e) => { if (e >= 1) return []; const r = (1 / e - 1) / n; return [{ lo: 0, hi: Math.min(r, 1), lo_: true, hi_: r >= 1 }]; } },
          jump: { label: '$x^n\\downarrow$ a discontinuous $f$ on $[0,1]$', a: 0, b: 1, y: [-0.3, 1.12], hyp: [true, false, true], jumps: [1],
            g: (n, x) => (x < 1 ? Math.pow(x, n) : 0), sup: () => 1,
            K: (n, e) => (e >= 1 ? [] : [{ lo: Math.pow(e, 1 / n), hi: 1, lo_: false, hi_: true }]) },
          bump: { label: '$nx\\,e^{1-nx}\\to0$, not monotone', a: 0, b: 1, y: [-0.3, 1.12], hyp: [true, true, false],
            g: (n, x) => n * x * Math.exp(1 - n * x), sup: (n) => (n >= 1 ? 1 : n * Math.exp(1 - n)),
            K: (n, e) => { if (e >= 1) return []; const [u1, u2] = uRoots(e); const lo = u1 / n, hi = Math.min(u2 / n, 1); return lo > 1 ? [] : [{ lo, hi, lo_: false, hi_: false }]; } },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'sqrt');
        const nS = v.slider('$n$', 1, KMAX, 6, { int: true });
        const eS = v.slider('$\\varepsilon$', 0.05, 0.6, 0.22, { step: 0.01 });
        const T = v.stage({ x: [-1.1, 1.1], y: [-0.3, 1.12], height: 280, full: true, yticks: [], title: 'the error functions $g_k=f_k-f\\ge0$ and the set $K_n=\\{x: g_n(x)\\ge\\varepsilon\\}$' });
        const B = v.stage({ x: [-1.1, 1.1], y: [-KMAX - 1.2, 0.2], height: 250, full: true, axes: false, title: 'the stack $K_1, K_2, \\dots, K_{30}$' });
        let last = null, info = {};
        v.legend([['accent', '$g_n$'], ['faint', '$g_k$, $k\\ne n$'], ['accent', 'level $\\varepsilon$', { dash: true }], ['red', '$K_k=\\{g_k\\ge\\varepsilon\\}$']]);
        const drawK = (s, Ks, y, st) => { for (const I of Ks) s.interval(I.lo, I.hi, y, { color: 'red', open: [I.lo_, I.hi_], width: st.width, r: st.r }); };
        v.render(() => {
          const F = FAM[which.value], n = nS.value, e = eS.value, w = F.b - F.a;
          if (last !== which.value) { last = which.value; T.setView([F.a - 0.06 * w, F.b + 0.04 * w], F.y); B.setView([F.a - 0.06 * w, F.b + 0.04 * w], null); }
          const eta = w * 1e-5, a = F.a + (F.openEnds ? eta : 0), b = F.b - (F.openEnds ? eta : 0);
          for (let k = 1; k <= KMAX; k++) if (k !== n) T.fn((x) => F.g(k, x), { domain: [a, F.jumps ? b - eta : b], color: 'faint', width: 1, alpha: 0.55 });
          T.hline(e, { color: 'accent', dash: [6, 4], width: 1.4 });
          T.tex('\\varepsilon', T.bounds.x[1], e, { color: 'accent', align: 'right', baseline: 'bottom', dx: -6, dy: -2 });
          T.fn((x) => F.g(n, x), { domain: [a, F.jumps ? b - eta : b], color: 'accent', width: 2.6 });
          if (F.jumps) { T.dot(1, 1, { hollow: true, color: 'accent', r: 4.5 }); T.dot(1, 0, { color: 'accent', r: 4.5 }); }
          if (F.openEnds) { T.dot(F.a, F.g(n, F.a + eta), { hollow: true, color: 'accent', r: 4.5 }); T.dot(F.b, F.g(n, F.b - eta), { hollow: true, color: 'accent', r: 4.5 }); }
          const Kn = F.K(n, e);
          drawK(T, Kn, -0.15, { width: 6, r: 5 });
          if (!Kn.length) T.text('K = ∅', F.a + w / 2, -0.15, { color: 'green', weight: 600, align: 'center' });
          const marks = ['compact', 'f continuous', 'decreasing'].map((s, i) => `${s} ${F.hyp[i] ? '✓' : '✗'}`).join('   ');
          T.corner(marks, 'tr', { color: F.hyp.every(Boolean) ? 'green' : 'red', weight: 600 });
          // the stack
          let N = null, nested = true, prev = null;
          for (let k = 1; k <= KMAX; k++) {
            const Kk = F.K(k, e);
            if (k === n) B.rect(B.bounds.x[0], -k - 0.5, B.bounds.x[1], -k + 0.5, { fill: 'accent', fillAlpha: 0.1, stroke: false });
            B.line(F.a, -k, F.b, -k, { color: 'grid', width: 1 });
            drawK(B, Kk, -k, { width: 3.2, r: 2.6 });
            if (!Kk.length && N == null) N = k;
            if (Kk.length) N = null;
            if (prev && Kk.length && (Kk[0].lo < prev[0].lo - 1e-12 || Kk[0].hi > prev[0].hi + 1e-12)) nested = false;
            if (prev && Kk.length && !prev.length) nested = false;
            prev = Kk;
          }
          for (const k of [1, 10, 20, 30]) B.text(`K${sub(k)}`, B.bounds.x[0], -k, { size: 11.5, color: 'muted', align: 'left', dx: 4, halo: false });
          if (N) { B.rect(F.a, -KMAX - 0.6, F.b, -N + 0.5, { fill: 'green', fillAlpha: 0.08, stroke: false }); B.text(`K${sub(N)} = ∅, and so are all later ones: gₙ < ε on K for n ≥ ${N}`, F.a + w / 2, -(N + KMAX) / 2, { color: 'green', weight: 600, align: 'center' }); }
          info = { F, n, e, N, nested, Kn };
        });
        v.readout(() => {
          const { F, n, N, nested } = info; if (!F) return '';
          const bad = F.hyp[0] ? F.hyp[1] ? 'the sets $K_k$ are not nested' : 'the sets $K_k=[\\varepsilon^{1/k},1)$ are not closed' : 'the sets $K_k$ are closed in $(0,1)$ but not compact';
          return `$\\sup_K g_{${n}} = ${v.fmt(F.sup(n), 3)}$. ` + (N ? `The nested compact sets $K_k$ are empty from $N = ${N}$ on, so $\\sup_K|f_n-f|<\\varepsilon$ for $n\\ge ${N}$.` : `No $K_k$ is empty: ${bad}, and $\\sup_K|f_n-f|$ does not tend to $0$.`);
        });
      },
    },

    // ------------------------------------------------------------------ 7.14
    {
      num: '7.14',
      kind: 'Definition',
      name: 'The space C(X) with the supremum norm',
      statement: String.raw`For a metric space $X$, $\mathscr C(X)$ denotes the set of all complex-valued, continuous, bounded functions on $X$. To each $f\in\mathscr C(X)$ one assigns its *supremum norm*
$$\|f\|=\sup_{x\in X}|f(x)|<\infty .$$
Because $\|f+g\|\le\|f\|+\|g\|$, setting $d(f,g)=\|f-g\|$ makes $\mathscr C(X)$ a metric space, and by 7.9 a sequence $f_n$ converges to $f$ in this metric exactly when $f_n\to f$ uniformly on $X$. Closed subsets of $\mathscr C(X)$ are called *uniformly closed*, and the closure of $\mathscr A\subset\mathscr C(X)$ is its *uniform closure*. (If $X$ is compact, boundedness is automatic.)`,
      idea: String.raw`Measuring the distance between two functions by the largest gap between their graphs turns uniform convergence into ordinary convergence in a metric space. All the vocabulary of Chapter 2 — balls, closed sets, completeness, compactness — then applies to spaces of functions: completeness of $\mathscr C(X)$ is 7.15, its compact subsets are described by Arzelà–Ascoli (7.25), and its dense subalgebras by Stone–Weierstrass (7.32).`,
      caption: String.raw`Here $X=[0,1]$. Drag the handles to reshape $g$, and change the radius $r$. The shaded tube is the open ball $\{h:\|h-f\|<r\}$ around $f$; $g$ lies in it exactly when its whole graph stays inside the tube. The lower panel plots $|f-g|$, whose highest point is the distance $\|f-g\|$.`,
      deps: ['pma-2.15', 'pma-4.5', 'pma-7.9'],
      see: ['rca-5.1', 'pma-7.25', 'pma-7.32'],
      tags: ['function spaces', 'sup norm', 'metric spaces'],
      viz(v) {
        const M = v.M;
        const f = (x) => 0.55 + 0.32 * Math.sin(2 * Math.PI * x) * Math.exp(-0.6 * x);
        const XS = [0, 0.2, 0.4, 0.6, 0.8, 1];
        const init = [0.42, 1.12, 0.74, 0.3, 0.46, 0.66];
        const rS = v.slider('radius $r$', 0.05, 0.6, 0.25, { step: 0.01 });
        const S = v.stage({ x: [-0.06, 1.06], y: [-0.3, 1.45], height: 300, full: true, yticks: [0, 0.5, 1], title: '$f$, the ball $B(f,r)$ in $\\mathscr C([0,1])$, and a function $g$' });
        const D = v.stage({ x: [-0.06, 1.06], y: [-0.2, 0.9], height: 170, full: true, title: 'the gap $|f(x)-g(x)|$; its maximum is $\\|f-g\\|$' });
        const H = XS.map((x, i) => S.handle(x, init[i], { color: 'purple', r: 6.5, constrain: (_, y) => [x, M.clamp(y, -0.2, 1.25)] }));
        // Catmull–Rom spline through the handles
        const g = (x) => {
          const P = H.map((h) => h.y), n = P.length - 1;
          const u = M.clamp(x, 0, 1) * n, i = Math.min(n - 1, Math.floor(u)), t = u - i;
          const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
          return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
        };
        let info = {};
        v.legend([['accent', '$f$'], ['accent', 'ball $\\|h-f\\|<r$', { area: true }], ['purple', '$g$'], ['red', 'part of $g$ outside the ball'], ['orange', '$|f-g|$', { area: true }]]);
        v.render(() => {
          const r = rS.value;
          let best = 0, at = 0, nf = 0, ng = 0;
          for (let i = 0; i <= 1000; i++) { const x = i / 1000, d = Math.abs(f(x) - g(x)); if (d > best) { best = d; at = x; } nf = Math.max(nf, Math.abs(f(x))); ng = Math.max(ng, Math.abs(g(x))); }
          const inside = best < r;
          S.between((x) => f(x) + r, (x) => f(x) - r, 0, 1, { fill: 'accent', fillAlpha: 0.13 });
          S.fn((x) => f(x) + r, { domain: [0, 1], color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
          S.fn((x) => f(x) - r, { domain: [0, 1], color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
          S.fn(f, { domain: [0, 1], color: 'accent', width: 2.6 });
          S.fn(g, { domain: [0, 1], color: 'purple', width: 2.4 });
          const esc = []; for (let i = 0; i <= 600; i++) { const x = i / 600; esc.push(Math.abs(g(x) - f(x)) >= r ? [x, g(x)] : null); }
          S.path(esc, { color: 'red', width: 3.4 });
          S.line(at, f(at), at, g(at), { color: inside ? 'green' : 'red', width: 2.6 });
          S.tex('f', 1, f(1), { color: 'accent', align: 'left', dx: 6 });
          S.tex('g', 1, g(1), { color: 'purple', align: 'left', dx: 6, dy: Math.abs(g(1) - f(1)) < 0.08 ? (g(1) > f(1) ? -10 : 10) : 0 });
          S.corner(inside ? `‖f − g‖ = ${v.fmt(best, 3)} < r: g ∈ B(f, r)` : `‖f − g‖ = ${v.fmt(best, 3)} ≥ r: g ∉ B(f, r)`, 'tl', { color: inside ? 'green' : 'red', weight: 600 });
          D.fn((x) => Math.abs(f(x) - g(x)), { domain: [0, 1], color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.2 });
          D.hline(r, { color: 'accent', dash: [6, 4], width: 1.4 });
          D.tex('r', 1.04, r, { color: 'accent', align: 'right', baseline: 'bottom', dy: -2 });
          D.dot(at, best, { color: inside ? 'green' : 'red', r: 5 });
          D.tex('\\|f-g\\|', at, best, { color: inside ? 'green' : 'red', align: at > 0.8 ? 'right' : 'left', baseline: 'bottom', dx: at > 0.8 ? -6 : 6, dy: -4, size: 14 });
          info = { best, nf, ng, inside, r };
        });
        v.readout(() => {
          const { best, nf, ng, inside } = info; if (best == null) return '';
          return `$\\|f\\| = ${v.fix(nf, 3)}$, $\\;\\|g\\| = ${v.fix(ng, 3)}$, $\\;d(f,g)=\\|f-g\\| = ${v.fix(best, 3)}$ ${inside ? '$<r$' : '$\\ge r$'}. Triangle inequality: $\\|g\\| \\le \\|f\\| + \\|g-f\\|$, i.e. $${v.fix(ng, 3)}\\le ${v.fix(nf + best, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.15
    {
      num: '7.15',
      kind: 'Theorem',
      name: 'C(X) is a complete metric space',
      statement: String.raw`With the metric $d(f,g)=\|f-g\|$ of 7.14, $\mathscr C(X)$ is a complete metric space: every Cauchy sequence in $\mathscr C(X)$ converges to an element of $\mathscr C(X)$.`,
      idea: String.raw`If $\{f_n\}$ is Cauchy in $\mathscr C(X)$, then it is uniformly Cauchy on $X$, so by the Cauchy criterion (7.8) it converges uniformly to some function $f$. By 7.12 the limit $f$ is continuous, and it is bounded because $|f(x)|\le|f_n(x)|+1\le\|f_n\|+1$ for an $n$ with $\|f_n-f\|<1$. Thus $f\in\mathscr C(X)$, and $\|f_n-f\|\to0$ by 7.9.`,
      caption: String.raw`Here $X=[0,1]$ and each $f_n:X\to\C$ is drawn as its image curve. The thin whiskers join $f_n(x)$ to the limit $f(x)$ at many points $x$; the longest is $\|f_n-f\|$. Slide $x$ to follow the numerical sequence $f_1(x),f_2(x),\dots$ (gold) to $f(x)$. For the lacunary series the bars $\sup_{m>n}\|f_m-f_n\|$ shrink to $0$ and the limit is a continuous (if wild) closed curve. For $e^{i\pi x^n}$ the bars stay at $2$ — the sequence is not Cauchy — and its pointwise limit jumps from $1$ to $-1$ at $x=1$.`,
      deps: ['pma-7.14', 'pma-3.12', 'pma-7.8', 'pma-7.12', 'pma-7.9'],
      see: ['rca-5.1', 'rca-3.17', 'pma-7.25'],
      tags: ['function spaces', 'completeness', 'uniform convergence'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI, NMAX = 12;
        const c = 0.6;
        // lacunary partial sums f_n(x) = Σ_{k<n} c^k e^{2πi(−2)^k x}, on a fine grid
        const G = 16384;
        let LAC = null;
        function lac() {
          if (LAC) return LAC;
          const re = [], im = [];
          let pr = new Float64Array(G + 1), pi = new Float64Array(G + 1);
          re.push(pr); im.push(pi);
          for (let k = 0; k < NMAX + 2; k++) {
            const a = Math.pow(c, k), m = Math.pow(-2, k);
            const nr = new Float64Array(G + 1), ni = new Float64Array(G + 1);
            for (let j = 0; j <= G; j++) { const th = TAU * m * j / G; nr[j] = pr[j] + a * Math.cos(th); ni[j] = pi[j] + a * Math.sin(th); }
            re.push(nr); im.push(ni); pr = nr; pi = ni;
          }
          // the limit: partial sum with NMAX + 2 terms (remaining tail ≤ c^14/(1−c) < 0.002)
          LAC = { re, im, fre: re[NMAX + 2], fim: im[NMAX + 2] };
          return LAC;
        }
        const FAM = {
          lac: { label: 'lacunary series $\\sum_{k<n}(0.6)^k e^{2\\pi i(-2)^k x}$', view: 2.75 },
          bad: { label: '$e^{i\\pi x^n}$ (not Cauchy)', view: 1.45 },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'lac');
        const nS = v.slider('$n$', 1, NMAX, 3, { int: true });
        const xS = v.slider('$x$', 0, 1, 0.37, { step: 0.001, decimals: 3 });
        const P = v.stage({ x: [-2.75, 2.75], y: [-2.75, 2.75], equal: true, height: 400, xlabel: 'Re', ylabel: 'Im', title: 'image curves $f_n(X)$ and $f(X)$ in $\\C$' });
        const B = v.stage({ x: [-1.2, NMAX + 0.8], y: [-0.25, 2.4], height: 400, axes: 'box', xticks: [1, 4, 8, 12], title: 'the Cauchy tails $\\sup_{m>k}\\|f_m-f_k\\|$' });
        let last = null, info = {};
        v.legend([['accent', '$f_n(X)$'], ['faint', '$f_k(X)$, $k<n$'], ['green', 'limit $f(X)$'], ['red', 'whiskers $|f_n(x)-f(x)|$'], ['gold', '$f_1(x), f_2(x), \\dots$', { dot: true }]]);
        const val = (key, n, x) => {
          if (key === 'bad') { const t = Math.PI * Math.pow(x, n); return [Math.cos(t), Math.sin(t)]; }
          const L = lac(), j = Math.round(x * G); return [L.re[n][j], L.im[n][j]];
        };
        const lim = (key, x) => {
          if (key === 'bad') return x < 1 ? [1, 0] : [-1, 0];
          const L = lac(), j = Math.round(x * G); return [L.fre[j], L.fim[j]];
        };
        v.render(() => {
          const key = which.value, F = FAM[key], n = nS.value, x = xS.value;
          if (last !== key) { last = key; if (key === 'lac') P.setView([-F.view, F.view], [-F.view, F.view]); else P.setView([-1.4, 1.4], [-0.75, 1.3]); }
          const curve = (k, st) => {
            if (key === 'bad') { P.curve((t) => val(key, k, t), 0, 1, { n: 300, ...st }); return; }
            const L = lac(), step = Math.max(1, Math.floor(G / Math.min(G, 64 * Math.pow(2, k)))); const pts = [];
            for (let j = 0; j <= G; j += step) pts.push([L.re[k][j], L.im[k][j]]);
            P.path(pts, st);
          };
          // limit
          if (key === 'lac') { const L = lac(); const pts = []; for (let j = 0; j <= G; j += 2) pts.push([L.fre[j], L.fim[j]]); P.path(pts, { color: 'green', width: 1.6 }); }
          else { P.dot(1, 0, { color: 'green', r: 6 }); P.dot(-1, 0, { color: 'green', r: 6 }); P.text('f(x) = 1 for x < 1', 1, 0, { color: 'green', dy: 30, align: 'right', size: 12, weight: 600 }); P.text('f(1) = −1', -1, 0, { color: 'green', dy: 30, align: 'left', size: 12, weight: 600 }); }
          for (let k = 1; k < n; k++) curve(k, { color: 'accent', width: 1, alpha: 0.12 + 0.25 * k / n });
          curve(n, { color: 'accent', width: 1.8 });
          // whiskers f_n(x_j) → f(x_j)
          let worst = 0;
          for (let j = 0; j <= 96; j++) {
            const xj = key === 'bad' ? 1 - Math.pow(1 - j / 96, 2) * 1 : j / 96;
            const p = val(key, n, Math.min(xj, key === 'bad' ? 0.9999 : 1)), q = lim(key, Math.min(xj, key === 'bad' ? 0.9999 : 1));
            P.line(p[0], p[1], q[0], q[1], { color: 'red', width: 0.9, alpha: 0.55 });
          }
          if (key === 'lac') { const L = lac(); for (let j = 0; j <= G; j += 4) worst = Math.max(worst, Math.hypot(L.re[n][j] - L.fre[j], L.im[n][j] - L.fim[j])); }
          else worst = 2;
          // the Cauchy sequence f_k(x)
          const seq = []; for (let k = 1; k <= NMAX; k++) seq.push(val(key, k, x));
          P.path(seq, { color: 'gold', width: 1.2, alpha: 0.8 });
          seq.forEach((p, i) => P.dot(p[0], p[1], { color: 'gold', r: i + 1 === n ? 5.5 : 3.2 }));
          const fx = lim(key, x);
          P.dot(fx[0], fx[1], { hollow: true, color: 'green', r: 7, width: 2.4 });
          // Cauchy tails: sup_{m>k} ||f_m − f_k|| = Σ_{j≥k} c^j (attained at x = 0) for the lacunary series; 2 for e^{iπx^n}
          const tails = []; for (let k = 1; k <= NMAX; k++) tails.push(key === 'lac' ? Math.pow(c, k) / (1 - c) : 2);
          B.bars(tails, { x0: 1, color: (t, i) => (i + 1 === n ? 'gold' : key === 'lac' ? 'accent' : 'red'), fillAlpha: 0.75 });
          B.corner(key === 'lac' ? 'tails → 0: Cauchy in 𝒞(X)' : 'tails = 2: not Cauchy', 'tr', { color: key === 'lac' ? 'green' : 'red', weight: 600 });
          info = { key, n, x, worst, tail: tails[n - 1], fx };
        });
        v.readout(() => {
          const { key, n, worst, tail } = info; if (!key) return '';
          if (key === 'lac') return `$\\sup_{m>${n}}\\|f_m-f_{${n}}\\| = \\sum_{k\\ge ${n}}(0.6)^k = ${v.fmt(tail, 3)}$, $\\;\\|f_{${n}}-f\\| \\approx ${v.fmt(worst, 3)}$: the uniform limit $f$ is continuous and bounded ($\\|f\\|\\le 2.5$), so it lies in $\\mathscr C(X)$.`;
          return `$\\sup_{m>${n}}\\|f_m-f_{${n}}\\| = 2$ for every $n$: not a Cauchy sequence in $\\mathscr C(X)$. The pointwise limit exists but is discontinuous at $x=1$, so it is not in $\\mathscr C(X)$ — completeness says nothing here.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.16
    {
      num: '7.16',
      kind: 'Theorem',
      name: 'Uniform convergence and integration',
      statement: String.raw`Let $\alpha$ be monotonically increasing on $[a,b]$. Suppose $f_n\in\mathscr R(\alpha)$ on $[a,b]$ for $n=1,2,3,\dots$, and $f_n\to f$ uniformly on $[a,b]$. Then $f\in\mathscr R(\alpha)$ on $[a,b]$, and
$$\int_a^b f\,d\alpha=\lim_{n\to\infty}\int_a^b f_n\,d\alpha$$
(in particular, the limit on the right exists).`,
      idea: String.raw`Let $\eps_n=\sup_{[a,b]}|f_n-f|$. Then $f_n-\eps_n\le f\le f_n+\eps_n$, so the upper and lower integrals of $f$ lie between $\int(f_n-\eps_n)\,d\alpha$ and $\int(f_n+\eps_n)\,d\alpha$ and differ by at most $2\eps_n[\alpha(b)-\alpha(a)]$. Since $\eps_n\to0$ (7.9), $f\in\mathscr R(\alpha)$, and the same sandwich gives $\bigl|\int f\,d\alpha-\int f_n\,d\alpha\bigr|\le\eps_n[\alpha(b)-\alpha(a)]\to0$.`,
      caption: String.raw`Here $\alpha(x)=x$ on $[0,1]$. The shaded area is $\int_0^1 f_n$; below, the dots are $\int f_n$ against $n$ beside the green line $\int f$. For the uniformly convergent ripples the dots $\int f_n=\tfrac2\pi+\tfrac{2}{\pi\sqrt n}$ stay inside the blue funnel $\int f\pm\sup|f_n-f|$, which squeezes them onto the line. Rudin's bumps $n^2x(1-x^2)^n$ and $nx(1-x^2)^n$ (Example 7.6) tend to $0$ at every point, yet their integrals run off to $\infty$ or settle at $\tfrac12$.`,
      deps: ['pma-6.2', 'pma-6.6', 'pma-6.12', 'pma-7.9'],
      see: ['rca-1.26', 'rca-1.34'],
      tags: ['integration', 'uniform convergence'],
      viz(v) {
        const M = v.M, PI = Math.PI, KMAX = 40;
        const FAM = {
          wig: { label: '$\\sin\\pi x+\\frac{|\\sin n\\pi x|}{\\sqrt n}$', f: (n, x) => Math.sin(PI * x) + Math.abs(Math.sin(n * PI * x)) / Math.sqrt(n), lim: (x) => Math.sin(PI * x),
            I: (n) => 2 / PI + 2 / (PI * Math.sqrt(n)), If: 2 / PI, Iftex: '2/\\pi', Mn: (n) => 1 / Math.sqrt(n), uniform: true },
          n2: { label: '$n^2x(1-x^2)^n$', f: (n, x) => n * n * x * Math.pow(1 - x * x, n), lim: () => 0, I: (n) => n * n / (2 * n + 2), If: 0, Iftex: '0',
            Mn: (n) => { const x = 1 / Math.sqrt(2 * n + 1); return n * n * x * Math.pow(1 - x * x, n); }, uniform: false, Itex: (n) => `\\tfrac{${n}^2}{2\\cdot${n}+2}` },
          n1: { label: '$nx(1-x^2)^n$', f: (n, x) => n * x * Math.pow(1 - x * x, n), lim: () => 0, I: (n) => n / (2 * n + 2), If: 0, Iftex: '0',
            Mn: (n) => { const x = 1 / Math.sqrt(2 * n + 1); return n * x * Math.pow(1 - x * x, n); }, uniform: false, Itex: (n) => `\\tfrac{${n}}{2\\cdot${n}+2}` },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'wig');
        const nS = v.slider('$n$', 1, KMAX, 6, { int: true });
        const S = v.stage({ x: [-0.04, 1.04], y: [-1.2, 2.2], height: 280, full: true, title: '$f_n$ with the area $\\int_0^1 f_n\\,dx$, and the limit $f$' });
        const B = v.stage({ x: [-2, KMAX + 1], y: [-0.5, 1.8], height: 200, full: true, axes: 'box', xticks: [1, 10, 20, 30, 40], title: '$\\int_0^1 f_k\\,dx$ against $k$, and $\\int_0^1 f\\,dx$' });
        let last = null, info = {};
        v.render(() => {
          const key = which.value, F = FAM[key], n = nS.value;
          v.legend([['accent', '$f_n$ and its area', { area: true }], ['green', 'limit $f$ and $\\int f$'], ...(F.uniform ? [['accent', 'funnel $\\int f\\pm\\sup|f_k-f|$', { area: true }]] : []), ['gold', '$\\int f_n$ (current)', { dot: true }]]);
          // views
          const top = Math.max(1.15, F.Mn(n) + (F.uniform ? 1 : 0)) * 1.12;
          S.setView(null, F.uniform ? [-0.3, 2.2] : [-0.08 * top, top]);
          if (last !== key) {
            last = key; const vals = M.range(KMAX, 1).map(F.I).concat([F.If]);
            const lo = Math.min(...vals, F.uniform ? F.If - 1.05 : 0), hi = Math.max(...vals, F.uniform ? F.If + 1.05 : 0);
            const sp = hi - lo; B.setView(null, [lo - 0.16 * sp, hi + 0.08 * sp]);
          }
          const fn = (x) => F.f(n, x);
          S.fn(fn, { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.2, n: 1400 });
          S.fn(F.lim, { domain: [0, 1], color: 'green', width: 2.4 });
          S.corner(`∫ f${sub(n)} = ${v.fmt(F.I(n), 4)}     ∫ f = ${v.fmt(F.If, 4)}`, 'tr', { color: 'ink', weight: 600 });
          // bottom: integrals
          if (F.uniform) {
            const up = [], dn = []; for (let k = 1; k <= KMAX; k++) { up.push([k, F.If + F.Mn(k)]); dn.push([k, F.If - F.Mn(k)]); }
            B.path(up.concat(dn.reverse()), { fill: 'accent', fillAlpha: 0.14, stroke: false, close: true });
          }
          B.line(0.5, F.If, KMAX + 0.5, F.If, { color: 'green', width: 2, dash: [7, 4] });
          if (!F.uniform && key === 'n1') B.line(0.5, 0.5, KMAX + 0.5, 0.5, { color: 'red', width: 1.4, dash: [3, 3] });
          for (let k = 1; k <= KMAX; k++) B.dot(k, F.I(k), { color: k === n ? 'gold' : F.uniform ? 'accent' : 'red', r: k === n ? 5.5 : 3.2 });
          B.tex(`\\int f = ${F.Iftex}`, KMAX + 0.5, F.If, { color: 'green', align: 'right', baseline: F.uniform ? 'top' : 'bottom', dy: F.uniform ? 22 : -6, size: 14 });
          if (key === 'n1') B.tex('\\lim\\int f_n = \\tfrac12', KMAX + 0.5, 0.5, { color: 'red', align: 'right', baseline: 'top', dy: 6, size: 14 });
          info = { F, n, key };
        });
        v.readout(() => {
          const { F, n, key } = info; if (!F) return '';
          const d = Math.abs(F.I(n) - F.If);
          if (F.uniform) return `$\\bigl|\\int f_{${n}}-\\int f\\bigr| = ${v.fmt(d, 3)}\\;\\le\\;\\sup|f_{${n}}-f|\\cdot(b-a) = 1/\\sqrt{${n}} = ${v.fmt(F.Mn(n), 3)}$ — and both tend to $0$.`;
          return `$\\int_0^1 f_{${n}} = ${F.Itex(n)} = ${v.fmt(F.I(n), 4)}$ but $\\int_0^1 f = 0$; here $\\sup|f_{${n}}-f| = ${v.fmt(F.Mn(n), 3)}$ ${key === 'n2' ? 'grows' : 'grows like $\\sqrt n$'}, so the convergence is not uniform and the theorem does not apply.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.16a
    {
      num: '7.16a',
      kind: 'Corollary',
      name: 'Uniformly convergent series can be integrated term by term',
      statement: String.raw`If $f_n\in\mathscr R(\alpha)$ on $[a,b]$ and the series
$$f(x)=\sum_{n=1}^\infty f_n(x)\qquad(a\le x\le b)$$
converges uniformly on $[a,b]$, then
$$\int_a^b f\,d\alpha=\sum_{n=1}^\infty\int_a^b f_n\,d\alpha .$$`,
      idea: String.raw`Apply 7.16 to the partial sums $s_N=\sum_{n\le N}f_n$, which converge uniformly to $f$. By linearity of the integral (6.12), $\int s_N\,d\alpha=\sum_{n\le N}\int f_n\,d\alpha$, so these partial sums of the integrated series converge to $\int f\,d\alpha$.`,
      caption: String.raw`Geometric series on $[0,r]$: each colour band is one term $t^k$, stacked up to $1/(1-t)$, and its area $\int_0^r t^k\,dt=\frac{r^{k+1}}{k+1}$ is a bar below; the running total climbs to $\int_0^r\frac{dt}{1-t}=-\log(1-r)$. The M-test with $M_k=r^k$ makes the convergence uniform on $[0,r]$ for every $r<1$. The telescoping bumps $\sum(g_k-g_{k-1})$ with $g_k=kx(1-x^2)^k$ converge to $0$ at every point but not uniformly, and the integrals of their terms add up to nearly $\tfrac12$, not $0$.`,
      deps: ['pma-7.16', 'pma-6.12'],
      see: ['rca-1.27', 'rca-1.38'],
      tags: ['integration', 'series of functions'],
      viz(v) {
        const M = v.M, KMAX = 40;
        const gk = (k, x) => (k <= 0 ? 0 : k * x * Math.pow(1 - x * x, k));
        const Ig = (k, r) => (k <= 0 ? 0 : k / (2 * k + 2) * (1 - Math.pow(1 - r * r, k + 1)));
        const FAM = {
          geo: { label: 'geometric $\\sum_{k\\ge0}t^k$', term: (k, t) => Math.pow(t, k), S: (n, t) => (1 - Math.pow(t, n)) / (1 - t), lim: (t) => 1 / (1 - t),
            Iterm: (k, r) => Math.pow(r, k + 1) / (k + 1), If: (r) => -Math.log(1 - r), uniform: true },
          tel: { label: 'telescoping bumps $\\sum_{k\\ge1}(g_k-g_{k-1})$', term: (k, t) => gk(k + 1, t) - gk(k, t), S: (n, t) => gk(n, t), lim: () => 0,
            Iterm: (k, r) => Ig(k + 1, r) - Ig(k, r), If: () => 0, uniform: false },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'geo');
        const nS = v.slider('terms $n$', 1, KMAX, 8, { int: true });
        const rS = v.slider('upper limit $r$', 0.3, 0.95, 0.8, { step: 0.01 });
        const S = v.stage({ x: [-0.03, 1.03], y: [0, 5.6], height: 280, full: true, title: 'the terms stacked into the partial sum $s_n$ on $[0,r]$' });
        const B = v.stage({ x: [-2.5, KMAX + 0.5], y: [-0.4, 2], height: 200, full: true, axes: 'box', xticks: [1, 10, 20, 30, 40], title: 'bars: $\\int_0^r f_k$; line: running total $\\sum_{k\\le n}\\int_0^r f_k$; green: $\\int_0^r f$' });
        let info = {};
        v.render(() => {
          const key = which.value, F = FAM[key], n = nS.value, r = rS.value;
          v.legend(key === 'geo' ? [['accent', 'one term $t^k$ (band)', { area: true }], ['ink', 'partial sum $s_n$'], ['green', 'sum $1/(1-t)$'], ['gold', 'running total of $\\int_0^r t^k$']]
            : [['faint', 'terms $g_k-g_{k-1}$'], ['ink', 'partial sum $s_n=g_n$'], ['accent', '$\\int_0^r s_n$', { area: true }], ['green', 'sum $f=0$'], ['gold', 'running total of $\\int_0^r(g_k-g_{k-1})$']]);
          const If = F.If(r);
          if (key === 'geo') {
            S.setView(null, [-0.15, Math.min(1 / (1 - r), 21) * 1.12]);
            for (let k = 0; k < n; k++) {
              S.between((t) => F.S(k + 1, t), (t) => F.S(k, t), 0, r, { fill: k % 2 ? 'teal' : 'accent', fillAlpha: 0.32 - 0.004 * k, n: 160 });
            }
            S.fn((t) => F.S(n, t), { domain: [0, r], color: 'ink', width: 1.8 });
            S.fn(F.lim, { domain: [0, r], color: 'green', width: 2.4 });
            S.fn(F.lim, { domain: [r, Math.min(0.99, 1 - 1 / (S.bounds.y[1] + 1))], color: 'green', width: 1.4, dash: [4, 4] });
          } else {
            const top = Math.max(1, ...M.linspace(0, 1, 200).map((t) => F.S(n, t))) * 1.15;
            S.setView(null, [-0.08 * top, top]);
            S.fn((t) => F.S(n, t), { domain: [0, r], color: 'accent', width: 0.1, fill: 'accent', fillAlpha: 0.22 });
            for (let k = 0; k < n; k++) S.fn((t) => F.term(k, t), { domain: [0, 1], color: 'faint', width: 1, alpha: 0.6 });
            S.fn((t) => F.S(n, t), { domain: [0, 1], color: 'ink', width: 2 });
            S.fn(F.lim, { domain: [0, 1], color: 'green', width: 2.4 });
          }
          S.vline(r, { color: 'orange', width: 1.4, dash: [5, 4] });
          S.tex('r', r, S.bounds.y[0], { color: 'orange', align: 'left', baseline: 'bottom', dx: 5, dy: -24 });
          // bottom: bars of term integrals and running total
          const bars = [], run = []; let tot = 0;
          for (let k = 0; k < KMAX; k++) { const a = F.Iterm(k, r); bars.push(a); tot += a; run.push([k + 1, tot]); }
          const lo = Math.min(0, ...bars), hi = Math.max(If, ...run.map((p) => p[1]), ...bars);
          const sp = hi - lo || 1; B.setView(null, [lo - 0.16 * sp, hi + 0.12 * sp]);
          B.bars(bars, { x0: 1, color: (a, i) => (i < n ? (i % 2 ? 'teal' : 'accent') : 'faint'), fillAlpha: 0.7 });
          B.line(0.5, If, KMAX + 0.5, If, { color: 'green', width: 2, dash: [7, 4] });
          B.tex(key === 'geo' ? '\\int_0^r f = -\\log(1-r)' : '\\int_0^r f = 0', KMAX + 0.5, If, { color: 'green', align: 'right', baseline: key === 'geo' ? 'top' : 'bottom', dx: -6, dy: key === 'geo' ? 6 : -6, size: 14 });
          B.path(run.slice(0, n), { color: 'gold', width: 2.2 });
          B.path(run.slice(n - 1), { color: 'gold', width: 1.2, alpha: 0.45, dash: [3, 3] });
          B.dot(n, run[n - 1][1], { color: 'gold', r: 5 });
          info = { key, n, r, If, partial: run[n - 1][1] };
        });
        v.readout(() => {
          const { key, n, r, If, partial } = info; if (!key) return '';
          if (key === 'geo') return `$\\sum_{k<${n}}\\frac{r^{k+1}}{k+1} = ${v.fix(partial, 4)}\\;\\to\\;\\int_0^{${v.fix(r, 2)}}\\frac{dt}{1-t} = -\\log(1-r) = ${v.fix(If, 4)}$ — the series of integrals is the series of $-\\log(1-r)$.`;
          return `$\\sum_{k\\le ${n}}\\int_0^r(g_k-g_{k-1}) = \\int_0^r g_{${n}} = ${v.fix(partial, 4)}\\to\\tfrac12$, while $\\int_0^r\\sum_k(g_k-g_{k-1}) = \\int_0^r 0 = 0$: without uniform convergence the two sides differ.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.17
    {
      num: '7.17',
      kind: 'Theorem',
      name: 'Uniform convergence and differentiation',
      statement: String.raw`Suppose $\{f_n\}$ is a sequence of functions, differentiable on $[a,b]$, such that $\{f_n(x_0)\}$ converges for some point $x_0\in[a,b]$. If $\{f_n'\}$ converges uniformly on $[a,b]$, then $\{f_n\}$ converges uniformly on $[a,b]$ to a function $f$, and
$$f'(x)=\lim_{n\to\infty}f_n'(x)\qquad(a\le x\le b).$$`,
      idea: String.raw`The mean value theorem (5.10) applied to $f_n-f_m$ gives $|(f_n-f_m)(x)-(f_n-f_m)(t)|\le|x-t|\,\sup|f_n'-f_m'|$; together with convergence at $x_0$ this makes $\{f_n\}$ uniformly Cauchy (7.8). The same estimate shows that the difference quotients $\frac{f_n(t)-f_n(x)}{t-x}$ converge uniformly for $t\ne x$, and 7.11 then lets $t\to x$ and $n\to\infty$ be interchanged. Continuity of the $f_n'$ is never needed.`,
      caption: String.raw`Left: $f_n$ and $f$, with tangent lines at the draggable point; right: the derivatives $f_n'$ and their limit. When the $f_n'$ converge uniformly the two tangents merge. For $\sin(nx)/\sqrt n$ (Example 7.5) $f_n\to0$ uniformly, yet $f_n'=\sqrt n\cos nx$ explodes; for $\sqrt{x^2+1/n}$ the derivatives converge only pointwise, to a jump, and the limit $|x|$ has a corner at $0$.`,
      deps: ['pma-5.10', 'pma-7.8', 'pma-7.11', 'pma-5.1'],
      see: ['rca-10.28', 'pma-7.18'],
      tags: ['differentiation', 'uniform convergence'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI;
        // Σ sin(kx)/k³ and its derivative series Σ cos(kx)/k² (limits on a grid; truncation error < 2e-6)
        const G = 2000; let CL = null;
        function cl() {
          if (CL) return CL;
          const f = new Float64Array(G + 1), g = new Float64Array(G + 1);
          for (let j = 0; j <= G; j++) { const x = TAU * j / G; let a = 0, b = 0; for (let k = 1; k <= 600; k++) { a += Math.sin(k * x) / (k * k * k); b += Math.cos(k * x) / (k * k); } f[j] = a; g[j] = b; }
          return (CL = { f, g });
        }
        const interp = (arr, x) => { const u = M.clamp(x / TAU, 0, 1) * G, i = Math.min(G - 1, Math.floor(u)), t = u - i; return arr[i] * (1 - t) + arr[i + 1] * t; };
        const FAM = {
          cube: { label: '$\\sum_{k\\le n}\\frac{\\sin kx}{k^3}$', a: 0, b: TAU, y: [-1.3, 1.3], yd: [-1.15, 2.1], x0: 2.3,
            f: (n, x) => { let s = 0; for (let k = 1; k <= n; k++) s += Math.sin(k * x) / (k * k * k); return s; },
            df: (n, x) => { let s = 0; for (let k = 1; k <= n; k++) s += Math.cos(k * x) / (k * k); return s; },
            lim: (x) => interp(cl().f, x), dlim: (x) => interp(cl().g, x), sup: (n) => { let s = 0; for (let k = n + 1; k < n + 100000; k++) s += 1 / (k * k); return s; }, ok: true },
          ex75: { label: 'Example 7.5: $\\frac{\\sin nx}{\\sqrt n}$', a: 0, b: TAU, y: [-1.3, 1.3], yd: null, x0: 1.3,
            f: (n, x) => Math.sin(n * x) / Math.sqrt(n), df: (n, x) => Math.sqrt(n) * Math.cos(n * x), lim: () => 0, dlim: () => 0, noDlim: true, ok: false },
          abs: { label: '$\\sqrt{x^2+1/n}\\to|x|$', a: -1, b: 1, y: [-0.15, 1.5], yd: [-1.5, 1.5], x0: 0.25, jumps: [0],
            f: (n, x) => Math.sqrt(x * x + 1 / n), df: (n, x) => x / Math.sqrt(x * x + 1 / n), lim: Math.abs, dlim: (x) => Math.sign(x), corner: true, ok: false },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'cube');
        const nS = v.slider('$n$', 1, 40, 2, { int: true });
        const L = v.stage({ x: [0, TAU], y: [-1.3, 1.3], height: 320, title: '$f_n$, $f$ and their tangents at $x$' });
        const R = v.stage({ x: [0, TAU], y: [-1.1, 2.3], height: 320, title: 'derivatives $f_n\'$ and $\\lim f_n\'$' });
        const h = L.handle(2.3, 0, { color: 'gold', label: 'x', constrain: (x) => { const F = FAM[which.value]; const xx = M.clamp(x, F.a, F.b); return [xx, F.lim(xx)]; } });
        let last = null, info = {};
        v.legend([['accent', '$f_n$, $f_n\'$'], ['green', '$f=\\lim f_n$, $\\lim f_n\'$'], ['accent', 'tangent to $f_n$', { dash: true }], ['green', 'tangent to $f$', { dash: true }]]);
        v.render(() => {
          const F = FAM[which.value], n = nS.value, w = F.b - F.a;
          const amp = Math.sqrt(n) * 1.15;
          if (last !== which.value) { last = which.value; L.setView([F.a - 0.03 * w, F.b + 0.03 * w], F.y); R.setView([F.a - 0.03 * w, F.b + 0.03 * w], F.yd || [-amp, amp]); h.x = F.x0; }
          if (!F.yd) R.setView(null, [-Math.max(1.3, amp), Math.max(1.3, amp)]);
          h.y = F.lim(h.x);
          const x = h.x, fnx = F.f(n, x), dfn = F.df(n, x), fx = F.lim(x);
          const hasD = !(F.corner && Math.abs(x) < 1e-9), dfx = F.noDlim ? 0 : F.dlim(x);
          // left
          L.fn((t) => F.f(n, t), { domain: [F.a, F.b], color: 'accent', width: 2.4, n: 1600 });
          L.fn(F.lim, { domain: [F.a, F.b], color: 'green', width: 2.4 });
          const span = 0.18 * w;
          L.line(x - span, fnx - dfn * span, x + span, fnx + dfn * span, { color: 'accent', width: 1.8, dash: [6, 4] });
          if (hasD) L.line(x - span, fx - dfx * span, x + span, fx + dfx * span, { color: 'green', width: 1.8, dash: [6, 4] });
          L.dot(x, fnx, { color: 'accent', r: 4 });
          // right
          if (F.jumps) { R.fn(F.dlim, { domain: [F.a, -1e-6], color: 'green', width: 2.4 }); R.fn(F.dlim, { domain: [1e-6, F.b], color: 'green', width: 2.4 }); R.dot(0, -1, { hollow: true, color: 'green', r: 4.5 }); R.dot(0, 1, { hollow: true, color: 'green', r: 4.5 }); R.dot(0, 0, { color: 'green', r: 4.5 }); }
          else if (!F.noDlim) R.fn(F.dlim, { domain: [F.a, F.b], color: 'green', width: 2.4 });
          R.fn((t) => F.df(n, t), { domain: [F.a, F.b], color: 'accent', width: 2, n: 1600 });
          R.vline(x, { color: 'gold', dash: [4, 4], width: 1.2 });
          R.dot(x, dfn, { color: 'accent', r: 4.5 });
          if (!F.noDlim) R.dot(x, dfx, { color: 'green', r: 4.5 });
          let msg, ok;
          if (F.ok) { msg = `sup |f′ₙ − lim f′ₖ| ≤ ${v.fmt(F.sup(n), 3)} → 0`; ok = true; }
          else if (F.noDlim) { msg = `sup |f′ₙ| = √n = ${v.fmt(Math.sqrt(n), 3)}: no limit`; ok = false; }
          else { msg = 'sup |f′ₙ − sgn x| = 1: not uniform'; ok = false; }
          R.corner(msg, 'br', { color: ok ? 'green' : 'red', weight: 600 });
          info = { F, n, x, dfn, dfx, hasD };
        });
        v.readout(() => {
          const { F, n, x, dfn, dfx } = info; if (!F) return '';
          const head = `At $x=${v.fix(x, 3)}$: $\\;f_{${n}}'(x) = ${v.fix(dfn, 4)}$`;
          if (F.ok) return head + `, $\\;f'(x) = \\lim_k f_k'(x) = ${v.fix(dfx, 4)}$ — the derivative of the limit is the limit of the derivatives.`;
          if (F.noDlim) return head + `, while $f\\equiv0$ has $f'(x)=0$. Here $\\|f_{${n}}-f\\| = 1/\\sqrt{${n}}\\to0$, but $f_n'(x)$ does not converge (except where $\\cos nx$ happens to settle).`;
          return head + (Math.abs(x) < 1e-9 ? ', but $f=|x|$ has no derivative at $0$.' : `, $\\;f'(x) = \\operatorname{sgn}x = ${dfx}$. The convergence $f_n'\\to\\operatorname{sgn}$ is not uniform near $0$, where the limit $|x|$ is not differentiable.`);
        });
      },
    },

  ],
};
