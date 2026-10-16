// Optimization — Chapter 1: Optimization problems and optimality (items 1.1–1.5; 1.6–1.10 in ch01-b.js)
//
// House style: contour maps of an objective f(x, y) the reader can retype, a draggable point carrying the local
// information (gradient, Hessian eigen-directions, constraint gradients), and a numerical check beside every analytic
// statement: stationary points found by Newton's method and classified by the Hessian are compared with brute-force
// sampling, constrained optima found by grid refinement are compared with the multiplier condition.
import {
  clamp, gradNum, hessNum, eig2, classify, CLS, descend, landScale, drawLand, landscape, EX, fx, fv,
  memo1, analyze, nearest, drawStat, gridMin,
} from './ch01.shared.js';

export default {
  collection: 'opt',
  chapter: 1,
  title: 'Optimization problems and optimality',
  summary: String.raw`An optimization problem asks for the point of a feasible set where an objective is smallest. Compactness or coercivity guarantees that a minimizer exists, and calculus characterizes candidates: the gradient vanishes at interior minima and the Hessian tells minima from saddles. Least squares and linear programming are the two classical problem classes that can be solved reliably; general nonconvex problems have many local minima and narrow, badly conditioned valleys.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Optimization problems: objective, constraints, optimal value',
      statement: String.raw`An **optimization problem** is
$$\text{minimize } f(x)\quad\text{subject to}\quad g_i(x)\le 0\ (i=1,\dots,m),\qquad h_j(x)=0\ (j=1,\dots,p),$$
with variable $x\in\R^n$, **objective** $f:\R^n\to\R$ and constraint functions $g_i,h_j$. The **feasible set** $F=\{x: g_i(x)\le0,\ h_j(x)=0\}$ is where all constraints hold. The **optimal value** is $p^\star=\inf\{f(x):x\in F\}$, with the conventions $p^\star=+\infty$ if $F=\emptyset$ (infeasible) and $p^\star=-\infty$ if $f$ is unbounded below on $F$. A point $x^\star\in F$ with $f(x^\star)=p^\star$ is an **optimal point** (a minimizer); it need not exist even when $p^\star$ is finite, and need not be unique. A constraint with $g_i(x^\star)=0$ is **active** at $x^\star$. Maximizing $f$ is minimizing $-f$.`,
      idea: String.raw`Everything in the course is a statement about this object. The picture to keep is a sweep: the sublevel sets $\{f\le c\}$ grow as $c$ increases, and $p^\star$ is the first value of $c$ at which a sublevel set meets $F$; the point where they first touch is the minimizer. If that touching point is interior to $F$ the constraints are irrelevant there, and if it lies on the boundary the active constraints are what stop the sweep. Existence of a touching point is the subject of the next item (opt-1.2), and what happens at the touch is the subject of the optimality conditions (opt-1.4, opt-1.9).`,
      caption: String.raw`Retype the objective $f(x,y)$ or pick an example. Drag the two blue handles to move the line (the feasible side is switched by *flip*), drag the centre and rim handles of the disc, and add a third constraint $g(x,y)\le0$ of your own. The green region is $F$; the gold region is the sublevel set $\{f\le c\}$ for the level $c$ set by the slider (measured from $p^\star$). Slide $c$ up from below $p^\star$: the gold set misses the green until the level reaches $p^\star$, where it first touches $F$ at the minimizer $x^\star$. Make the constraints incompatible and $F$ disappears ($p^\star=+\infty$).`,
      deps: ['pma-1.8'],
      refs: ['Boyd–Vandenberghe §4.1'],
      tags: ['feasible set', 'optimal value', 'constraints'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mathematical_optimization' },
      viz(v) {
        const view = { x: [-4.5, 4.5], y: [-3.4, 3.4] };
        const PRE = [
          { key: 'bowl', label: 'bowl', src: '(x+1.8)^2+0.7*(y-1.6)^2', view },
          { key: 'lin', label: 'linear', src: 'x+y', view },
          { key: 'ring', label: 'ring', src: '(x^2+y^2-9)^2/10', view },
          { ...EX.himmel, view },
        ];
        const L = landscape(v, PRE, 'bowl');
        const useH = v.toggle('line', true), flipH = v.toggle('flip line side', false);
        const useD = v.toggle('disc', true), flipD = v.toggle('disc: outside', false);
        const useG = v.toggle('curve $g\\le 0$', false);
        const Gi = v.input('$g(x,y)=$', 'x*y-1.5', { vars: ['x', 'y'], width: 200 });
        const cS = v.slider('level $c-p^\\star$ (in spreads of $f$)', -1, 1, -0.4, { step: 0.01 });
        v.button('sweep to $p^\\star$', () => cS.set(0));
        const s = v.stage({ ...view, equal: true, axes: 'box', gutter: true, height: 410, xlabel: '$x$', ylabel: '$y$', title: 'feasible set, level sets and the sweep' });
        const A = s.handle(-3.2, -1.1, { color: 'accent', label: 'a', labelPos: 'sw' });
        const B = s.handle(3.4, 0.7, { color: 'accent', label: 'b', labelPos: 'ne' });
        const C = s.handle(0.4, 0.9, { color: 'orange', label: 'c', labelPos: 'n' });
        const R = s.handle(2.2, 0.9, { color: 'orange', r: 6 });
        const hs = [A, B, C, R];
        const Gf = (x, y) => (Gi.fn ? Gi.fn(x, y) : NaN);
        const mem = memo1();
        let info = null;
        v.render(() => {
          const f = L.f, rad = Math.hypot(R.x - C.x, R.y - C.y);
          A.visible = B.visible = useH.value; C.visible = R.visible = useD.value;
          const ex = B.x - A.x, ey = B.y - A.y, el = Math.hypot(ex, ey) || 1;
          const cons = [];
          if (useH.value) cons.push({ name: 'line', tol: 0.015, g: (x, y) => ((flipH.value ? 1 : -1) * (ex * (y - A.y) - ey * (x - A.x))) / el });
          if (useD.value) cons.push({ name: 'disc', tol: 0.015, g: (x, y) => (flipD.value ? rad - Math.hypot(x - C.x, y - C.y) : Math.hypot(x - C.x, y - C.y) - rad) });
          if (useG.value) cons.push({ name: 'curve', tol: 0.03, g: Gf });
          const feas = (x, y) => cons.every((c) => c.g(x, y) <= 0);
          const stKey = [...hs.map((h) => h.x.toFixed(3) + ',' + h.y.toFixed(3)), useH.value, flipH.value, useD.value, flipD.value, useG.value, Gi.value, L.key].join('|');
          const sol = mem(stKey, () => ({ con: gridMin(f, view, feas), unc: gridMin(f, view), sc: landScale(f, view.x, view.y) }));
          const { con, unc, sc } = sol, spread = sc.scale * 1.2;
          const pstar = con ? con.f : NaN, c = (con ? pstar : unc.f) + cS.value * spread;
          s.raster((x, y) => {
            const fe = feas(x, y), sub = f(x, y) <= c;
            if (fe && sub) return [...v.rgb('gold').slice(0, 3), 190];
            if (fe) return [...v.rgb('green').slice(0, 3), 70];
            if (sub) return [...v.rgb('gold').slice(0, 3), 45];
            return null;
          }, { res: 3, key: 'F|' + stKey + '|' + c.toFixed(5) });
          const lv = []; for (let k = 1; k <= 14; k++) lv.push(sc.level(k, 14));
          s.contour(f, lv, { color: 'ink', alpha: 0.28, width: 1, res: 110 });
          s.contour(f, [c], { color: 'gold', width: 2.8, res: 160 });
          if (useH.value) { s.line(A.x - 60 * ex, A.y - 60 * ey, A.x + 60 * ex, A.y + 60 * ey, { color: 'accent', width: 2 }); }
          if (useD.value) s.circle(C.x, C.y, rad, { color: 'orange', width: 2, stroke: true });
          if (useG.value) s.contour(Gf, [0], { color: 'purple', width: 2.2, res: 160 });
          s.dot(unc.x, unc.y, { r: 5, color: 'muted', hollow: true, width: 2 });
          if (con) {
            s.dot(con.x, con.y, { r: 6.5, color: 'green' });
            s.tex(String.raw`x^\star`, con.x, con.y, { color: 'green', dx: 12, dy: -14, size: 15 });
          }
          v.legend([['green', 'feasible set $F$', { area: true }], ['gold', 'sublevel set $\\{f\\le c\\}$', { area: true }], ['muted', 'unconstrained minimizer', { dot: true }], ['green', 'constrained minimizer $x^\\star$', { dot: true }]]);
          const act = con ? cons.filter((k) => k.g(con.x, con.y) > -k.tol).map((k) => k.name) : [];
          const edge = con && (Math.abs(con.x - view.x[0]) < 0.03 || Math.abs(con.x - view.x[1]) < 0.03 || Math.abs(con.y - view.y[0]) < 0.03 || Math.abs(con.y - view.y[1]) < 0.03);
          info = { pstar, con, unc, act, c, edge, ncons: cons.length };
        });
        v.readout(() => {
          if (!info) return '';
          const { pstar, con, unc, act, c, edge, ncons } = info;
          if (!con) return String.raw`The constraints leave **no feasible point** in the window: $F=\emptyset$ and $p^\star=+\infty$ by convention. Move or flip a constraint.`;
          let s = String.raw`optimal value $p^\star=${fx(v, pstar, 3)}$ at $x^\star=${fv(v, [con.x, con.y], 3)}$ · unconstrained minimum of $f$ in the window: ${fx(v, unc.f, 3)} · level $c=${fx(v, c, 3)}$ ${c < pstar - 1e-6 ? '**below** $p^\\star$: the sublevel set misses $F$' : Math.abs(c - pstar) < 1e-6 ? '**equals** $p^\\star$: the sublevel set just touches $F$' : '**above** $p^\\star$: the sublevel set meets $F$'}`;
          s += act.length ? ` · active constraints at $x^\\star$: **${act.join(', ')}**` : (ncons ? ' · no constraint is active: $x^\\star$ is an unconstrained minimizer inside $F$' : '');
          if (edge) s += ' · the minimizer sits on the window edge: $f$ may be unbounded below beyond it';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Existence of minimizers: compactness and coercivity',
      credit: 'Bolzano, 1830s (published 1930); Weierstrass, 19th century',
      statement: String.raw`Let $D\subseteq\R^n$ be nonempty and closed and let $f:D\to\R$ be continuous (lower semicontinuity suffices). If either
(i) $D$ is bounded (so $D$ is compact), or
(ii) $f$ is **coercive**: $f(x)\to+\infty$ as $\norm{x}\to\infty$ in $D$,
then $f$ attains its minimum on $D$: there is $x^\star\in D$ with $f(x^\star)=\inf_D f$. More generally it is enough that one sublevel set $\{x\in D: f(x)\le\alpha\}$ is nonempty and compact. Each hypothesis is needed: $e^x$ on $\R$ (not coercive), $x$ on $(0,2]$ (not closed) and a function with a downward jump missing from its value (not lower semicontinuous) all have a finite infimum that is never attained.`,
      idea: String.raw`Take a minimizing sequence $f(x_k)\to\inf_D f$. Compactness of a sublevel set (opt-1.2 case (ii) reduces to it, because coercivity makes every sublevel set bounded, and closedness plus continuity makes it closed) lets the Bolzano–Weierstrass theorem (pma-2.37, pma-3.6) extract a convergent subsequence $x_{k_j}\to x^\star$. Closedness keeps $x^\star$ in $D$, and lower semicontinuity gives $f(x^\star)\le\liminf f(x_{k_j})=\inf_D f$. Remove any of the three ingredients — closed, bounded (or coercive), semicontinuous — and the minimizing sequence escapes to infinity, to a missing boundary point, or to a jump.`,
      caption: String.raw`Left, one variable: pick a case and drag $\alpha$. The black bar is the domain $D$ and the bar below it is the sublevel set $\{f\le\alpha\}$: **green** when it is compact, **red** when it is not (unbounded, or missing an end point). Gold dots are a minimizing sequence. Right, two variables: the shaded sublevel set of a typed $f$ in a window; for the coercive examples it shrinks to a point, for $(xy-1)^2+x^2$ or $x^2+e^y$ it stays a channel leading off the window and the infimum is not attained.`,
      deps: ['opt-1.1', 'pma-4.16'],
      refs: ['Nocedal–Wright ch. 2'],
      tags: ['existence', 'compactness', 'coercivity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Extreme_value_theorem' },
      viz(v) {
        const AX = [-4.2, 4.2];
        const CASES = {
          exp: { label: '$e^x$ on $\\mathbb R$', f: Math.exp, dom: [-Infinity, Infinity, false, false], inf: 0, arg: null,
            sub: (a) => (a > 0 ? [{ lo: -Infinity, hi: Math.log(a), loC: false, hiC: true }] : []), seq: (k) => -k,
            why: 'not coercive: $e^x\\to0$ as $x\\to-\\infty$, so the minimizing sequence runs off to $-\\infty$' },
          expc: { label: '$e^x$ on $[-2,2]$', f: Math.exp, dom: [-2, 2, true, true], inf: Math.exp(-2), arg: -2,
            sub: (a) => (a >= Math.exp(-2) ? [{ lo: -2, hi: Math.min(2, Math.log(a)), loC: true, hiC: true }] : []), seq: null,
            why: 'compact domain and continuous $f$: the minimum is attained (at the end point)' },
          coer: { label: '$x^2/2+2\\sin 2x$', f: (x) => x * x / 2 + 2 * Math.sin(2 * x), dom: [-Infinity, Infinity, false, false], inf: null, arg: null, num: true,
            sub: null, seq: null, why: 'coercive: every sublevel set is bounded, closed and nonempty above the minimum' },
          open: { label: '$x$ on $(0,2]$', f: (x) => x, dom: [0, 2, false, true], inf: 0, arg: null,
            sub: (a) => (a > 0 ? [{ lo: 0, hi: Math.min(2, a), loC: false, hiC: true }] : []), seq: (k) => 2 ** (1 - k),
            why: 'bounded but not closed: the minimizing sequence tends to the missing point $0\\notin D$' },
          jump: { label: 'jump at 0', f: (x) => (x === 0 ? 1 : x), dom: [0, 2, true, true], inf: 0, arg: null,
            sub: (a) => (a <= 0 ? [] : a < 1 ? [{ lo: 0, hi: a, loC: false, hiC: true }] : [{ lo: 0, hi: Math.min(2, a), loC: true, hiC: true }]), seq: (k) => 2 ** (1 - k),
            why: 'compact domain but $f$ is not lower semicontinuous at $0$ ($f(0)=1$ while $f(x)=x\\to0$): the infimum $0$ is not attained' },
        };
        const csel = v.select('one variable', Object.entries(CASES).map(([k, c]) => ({ value: k, label: c.label })), 'exp');
        const aS = v.slider('level $\\alpha$ (1D)', 0.05, 5, 1.2, { step: 0.01 });
        const PRE2 = [
          { key: 'coer', label: 'coercive', src: 'x^2+y^2+2*sin(2*x)*cos(2*y)', view: { x: [-3.5, 3.5], y: [-3, 3] } },
          { key: 'quart', label: '$x^4+y^4-3xy$', src: 'x^4+y^4-3*x*y', view: { x: [-2, 2], y: [-2, 2] } },
          { key: 'valley', label: '$(xy-1)^2+x^2$', src: '(x*y-1)^2+x^2', view: { x: [-3, 3], y: [-3, 3] } },
          { key: 'expy', label: '$x^2+e^y$', src: 'x^2+exp(y)', view: { x: [-3, 3], y: [-4, 3] } },
        ];
        const L = landscape(v, PRE2, 'coer', { width: 260, label: '$f(x,y)=$', onChange: (cur) => s2.setView(cur.view.x, cur.view.y) });
        const uS = v.slider('level $\\alpha$ (2D)', 0, 1, 0.25, { step: 0.005 });
        const s1 = v.stage({ x: AX, y: [-1.3, 6], axes: 'box', gutter: true, height: 340, xlabel: '$x$', ylabel: '$f(x)$', title: 'one variable: domain, graph, sublevel set', weight: 1 });
        const s2 = v.stage({ ...L.view, equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$x$', ylabel: '$y$', title: 'two variables: sublevel set in a window', weight: 1 });
        const m2 = memo1();
        let i1 = null, i2 = null;
        v.render(() => {
          // ---- one variable
          const C = CASES[csel.value], a = aS.value, f = C.f;
          const lo = Math.max(C.dom[0], AX[0]), hi = Math.min(C.dom[1], AX[1]);
          s1.hline(0, { color: 'faint', width: 1 });
          s1.fn(f, { domain: [lo, hi], color: 'accent', width: 2.6, n: 600 });
          if (C.dom[2] === false && Number.isFinite(C.dom[0])) s1.dot(C.dom[0], f(C.dom[0] + 1e-9), { r: 4.5, hollow: true, color: 'accent', width: 2 });
          if (csel.value === 'jump') { s1.dot(0, 1, { r: 4.5, color: 'accent' }); s1.dot(0, 0, { r: 4.5, hollow: true, color: 'accent', width: 2 }); }
          else if (C.dom[2] && Number.isFinite(C.dom[0])) s1.dot(C.dom[0], f(C.dom[0]), { r: 4, color: 'accent' });
          if (C.dom[3] && Number.isFinite(C.dom[1])) s1.dot(C.dom[1], f(C.dom[1]), { r: 4, color: 'accent' });
          s1.hline(a, { color: 'gold', width: 1.6, dash: [6, 4] });
          // domain bar and sublevel bar
          s1.interval(lo, hi, -0.55, { open: [!C.dom[2] && Number.isFinite(C.dom[0]), !C.dom[3] && Number.isFinite(C.dom[1])], color: 'ink' });
          let sub;
          if (C.num) { // numeric sublevel set of the coercive example
            sub = []; const N = 4000; let cur = null;
            for (let i = 0; i <= N; i++) {
              const x = -8 + (16 * i) / N, ok = f(x) <= a;
              if (ok && !cur) cur = { lo: x, hi: x, loC: true, hiC: true }; else if (ok) cur.hi = x; else if (cur) { sub.push(cur); cur = null; }
            }
            if (cur) sub.push(cur);
          } else sub = C.sub(a);
          const compact = sub.every((q) => Number.isFinite(q.lo) && Number.isFinite(q.hi) && q.loC && q.hiC);
          for (const q of sub) {
            const l = Math.max(q.lo, AX[0]), h = Math.min(q.hi, AX[1]);
            s1.interval(l, h, -0.95, { open: [!q.loC && Number.isFinite(q.lo), !q.hiC && Number.isFinite(q.hi)], color: compact ? 'green' : 'red' });
            s1.vband(l, h, { color: compact ? 'green' : 'red', alpha: 0.07 });
          }
          let inf = C.inf, arg = C.arg;
          if (C.num) { let b = -8; for (let i = 0; i <= 8000; i++) { const x = -8 + (16 * i) / 8000; if (f(x) < f(b)) b = x; } arg = b; inf = f(b); }
          if (arg != null) { s1.dot(arg, inf, { r: 6.5, color: 'green' }); s1.tex('x^\\star', arg, inf, { color: 'green', dx: 14, dy: -14, size: 15 }); }
          else {
            s1.hline(inf, { color: 'red', width: 1.4, dash: [2, 4] });
            if (C.seq) for (let k = 1; k <= 7; k++) { const x = C.seq(k); if (x >= AX[0] && x <= AX[1]) s1.dot(x, f(x), { r: 3.8, color: 'gold' }); }
            s1.tex('\\inf f=' + v.fix(inf, 2) + '\\text{ not attained}', AX[1] - 0.2, inf, { color: 'red', align: 'right', dy: -13, size: 13 });
          }
          i1 = { compact, empty: !sub.length, inf, attained: arg != null, why: C.why, a };
          // ---- two variables
          const f2 = L.f, view = L.view;
          const an = m2(L.key, () => {
            const all = gridMin(f2, view, null, 150, 110);
            const band = 0.04, inner = { x: [view.x[0] + band * (view.x[1] - view.x[0]), view.x[1] - band * (view.x[1] - view.x[0])], y: [view.y[0] + band * (view.y[1] - view.y[0]), view.y[1] - band * (view.y[1] - view.y[0])] };
            const inn = gridMin(f2, inner, null, 150, 110);
            return { all, inn, sc: landScale(f2, view.x, view.y) };
          });
          const atEdge = an.all && an.inn && an.all.f < an.inn.f - 1e-9;
          const alpha = an.all.f + uS.value * an.sc.scale * 2.4;
          s2.raster((x, y) => (f2(x, y) <= alpha ? [...v.rgb('accent').slice(0, 3), 120] : null), { res: 3, key: 'S|' + L.key + '|' + alpha.toFixed(5) });
          const lv = []; for (let k = 1; k <= 12; k++) lv.push(an.sc.level(k, 12));
          s2.contour(f2, lv, { color: 'ink', alpha: 0.25, width: 1, res: 110 });
          s2.contour(f2, [alpha], { color: 'accent', width: 2.4, res: 160 });
          // does the sublevel set reach the window edge?
          let touches = false; const nb = 160;
          for (let i = 0; i <= nb && !touches; i++) {
            const t = i / nb, X = view.x[0] + t * (view.x[1] - view.x[0]), Y = view.y[0] + t * (view.y[1] - view.y[0]);
            if (f2(X, view.y[0]) <= alpha || f2(X, view.y[1]) <= alpha || f2(view.x[0], Y) <= alpha || f2(view.x[1], Y) <= alpha) touches = true;
          }
          if (!atEdge) { s2.dot(an.all.x, an.all.y, { r: 6.5, color: 'green' }); s2.tex('x^\\star', an.all.x, an.all.y, { color: 'green', dx: 14, dy: -14, size: 15 }); }
          else s2.dot(an.all.x, an.all.y, { r: 5.5, color: 'red', hollow: true, width: 2.4 });
          i2 = { all: an.all, atEdge, touches, alpha };
          v.legend([['green', 'compact sublevel set / minimizer'], ['red', 'non-compact sublevel set / escaping minimizer'], ['gold', 'minimizing sequence', { dot: true }], ['accent', '2D sublevel set $\\{f\\le\\alpha\\}$', { area: true }]]);
        });
        v.readout(() => {
          if (!i1 || !i2) return '';
          const { compact, empty, inf, attained, why, a } = i1;
          let s = String.raw`**1D:** $\alpha=${v.fix(a, 2)}$: ${empty ? 'the sublevel set is empty (below the infimum)' : compact ? 'the sublevel set is **compact** and nonempty, so a minimizer exists' : 'the sublevel set is **not compact**'} · $\inf f=${fx(v, inf, 3)}$, ${attained ? '**attained**' : '**not attained**'} — ${why}.`;
          s += '\n' + String.raw`**2D:** smallest value found in the window ${fx(v, i2.all.f, 4)} at ${fv(v, [i2.all.x, i2.all.y], 2)} · ${i2.atEdge ? '**on the window edge**: the infimum is approached only far away, so it is probably **not attained**' : 'strictly inside the window, so **attained**'} · the level-$\alpha$ set ${i2.touches ? '**reaches the window edge** (unbounded as far as the window can tell)' : 'stays inside the window (bounded, closed: compact)'}`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Local and global minimizers',
      statement: String.raw`Let $f:D\to\R$. A point $x^\star\in D$ is a **global minimizer** if $f(x^\star)\le f(x)$ for all $x\in D$. It is a **local minimizer** if there is a neighbourhood radius $\delta>0$ with $f(x^\star)\le f(x)$ for all $x\in D$ with $\norm{x-x^\star}<\delta$, and a **strict** local minimizer if the inequality is strict for $x\ne x^\star$. Every global minimizer is local; the converse fails in general (it holds for convex functions, opt-3.11). Local minimizers are all that an algorithm can recognise from nearby information, which is why the distinction drives the whole subject.`,
      idea: String.raw`The quantifier order does the work: "there exists $\delta$" makes the local test a statement about one small ball, so a point passes it for some $\delta$ yet fails for a larger one the moment a deeper valley comes into range. Shrinking $\delta$ only makes the test easier; growing it to the diameter of $D$ turns it into the global test. Hence local minimizers are exactly the points that pass the test for all sufficiently small $\delta$, and the global minimizers are the points that pass for every $\delta$.`,
      caption: String.raw`Drag the nine blue handles to sketch a landscape on $[-4,4]$ (or press *Rugged*). The orange marks along the bottom are the points that pass the $\delta$-test for the current radius $\delta$ (slider); green dots are the genuine local minimizers (the points that pass for small $\delta$); the gold ring is the global minimizer. Drag the gold probe along the curve: the orange band is its $\delta$-neighbourhood, and a red arrow points to a lower point inside it if the test fails. Make $\delta$ large: only the global minimizer survives. Make $\delta$ small: every local minimizer, including shallow ones and boundary points, passes.`,
      deps: ['opt-1.1'],
      refs: ['Nocedal–Wright ch. 2'],
      tags: ['local minimum', 'global minimum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maxima_and_minima' },
      viz(v) {
        const XS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
        const base = [0.6, 0.0, -0.9, 0.2, 1.1, 0.1, -1.4, -0.3, 0.9];
        const dS = v.slider('neighbourhood radius $\\delta$', 0.05, 8, 0.6, { log: true, sig: 2 });
        const s = v.stage({ x: [-4.4, 4.4], y: [-2.9, 2.4], axes: 'box', gutter: true, height: 380, xlabel: '$x$', ylabel: '$f(x)$', title: 'a landscape you shape on D = [−4, 4]' });
        const hs = XS.map((x, i) => s.handle(x, base[i], { color: 'accent', r: 6.5, constrain: { x: [x, x], y: [-2, 2] } }));
        const F = (x) => { // C¹ cubic Hermite (Catmull–Rom) through the knots
          const t0 = clamp(x, -4, 4), i = Math.min(7, Math.floor(t0 + 4)), t = t0 + 4 - i, y = hs.map((h) => h.y);
          const m = (k) => (k === 0 ? y[1] - y[0] : k === 8 ? y[8] - y[7] : (y[k + 1] - y[k - 1]) / 2);
          const a = y[i], b = y[i + 1], ma = m(i), mb = m(i + 1);
          return (2 * t ** 3 - 3 * t ** 2 + 1) * a + (t ** 3 - 2 * t ** 2 + t) * ma + (-2 * t ** 3 + 3 * t ** 2) * b + (t ** 3 - t ** 2) * mb;
        };
        const probe = s.handle(2.2, 0, { color: 'gold', r: 8, label: '$x$', labelPos: 'n', constrain: (x) => { const X = clamp(x, -4, 4); return [X, F(X)]; } });
        v.button('Rugged', () => { const r = v.rng(7 + Math.floor(Math.random() * 1000)); hs.forEach((h) => h.set(h.x, r.uniform(-1.8, 1.8))); });
        v.button('Two valleys', () => hs.forEach((h, i) => h.set(h.x, base[i])));
        v.button('One valley', () => hs.forEach((h) => h.set(h.x, 0.12 * h.x * h.x - 1.2)));
        const N = 801, dx = 8 / (N - 1);
        let info = null;
        v.render(() => {
          const ys = new Float64Array(N); for (let i = 0; i < N; i++) ys[i] = F(-4 + i * dx);
          const del = dS.value, m = Math.max(1, Math.round(del / dx));
          // pass[i]: f(x_i) is minimal on the delta-neighbourhood (within D)
          const pass = new Uint8Array(N);
          for (let i = 0; i < N; i++) { let mn = Infinity; for (let j = Math.max(0, i - m); j <= Math.min(N - 1, i + m); j++) if (ys[j] < mn) mn = ys[j]; pass[i] = ys[i] <= mn + 1e-12 ? 1 : 0; }
          // true local minimizers: strict local minima of the sampled curve (interior or end points)
          const locs = [];
          for (let i = 0; i < N; i++) {
            const l = i > 0 ? ys[i - 1] : Infinity, r = i < N - 1 ? ys[i + 1] : Infinity;
            if (ys[i] < l - 1e-13 && ys[i] <= r) locs.push(i);
          }
          let gi = 0; for (let i = 1; i < N; i++) if (ys[i] < ys[gi]) gi = i;
          s.hline(0, { color: 'faint', width: 1 });
          s.path(Array.from({ length: N }, (_, i) => [-4 + i * dx, ys[i]]), { color: 'accent', width: 2.8 });
          s.vline(-4, { color: 'faint', width: 1 }); s.vline(4, { color: 'faint', width: 1 });
          // passing marks along the bottom
          let run = null; const yb = -2.65;
          for (let i = 0; i <= N; i++) {
            if (i < N && pass[i]) { if (run === null) run = i; } else if (run !== null) { s.line(-4 + run * dx, yb, -4 + (i - 1) * dx, yb, { color: 'orange', width: 6 }); run = null; }
          }
          for (const i of locs) { const x = -4 + i * dx; s.dot(x, ys[i], { r: 5, color: 'green' }); s.vline(x, { color: 'green', alpha: 0.25, width: 1 }); }
          s.dot(-4 + gi * dx, ys[gi], { r: 11, color: 'gold', hollow: true, width: 3 });
          s.tex('\\text{global}', -4 + gi * dx, ys[gi], { color: 'gold', dy: 22, size: 13, align: 'center' });
          // probe
          const px = clamp(probe.x, -4, 4); probe.set(px, F(px));
          s.vband(px - del, px + del, { color: 'orange', alpha: 0.12 });
          let bj = 0, bv = Infinity; for (let j = Math.max(0, Math.round((px - del + 4) / dx)); j <= Math.min(N - 1, Math.round((px + del + 4) / dx)); j++) if (ys[j] < bv) { bv = ys[j]; bj = j; }
          const fp = F(px), ok = fp <= bv + 1e-9;
          if (!ok) { const bx = -4 + bj * dx; s.arrow(px, fp, bx, bv, { color: 'red', width: 2 }); s.dot(bx, bv, { r: 4.5, color: 'red', hollow: true, width: 2 }); }
          v.legend([['accent', '$f$'], ['orange', 'points passing the $\\delta$-test', {}], ['green', 'local minimizers', { dot: true }], ['gold', 'global minimizer', { dot: true }]]);
          const npass = pass.reduce((a, b) => a + b, 0);
          info = { del, ok, fp, bv, nloc: locs.length, locs: locs.map((i) => [-4 + i * dx, ys[i]]), g: [-4 + gi * dx, ys[gi]], px, npass, probeLocal: locs.some((i) => Math.abs(-4 + i * dx - px) < 0.03), allPassing: npass };
        });
        v.readout(() => {
          if (!info) return '';
          const { del, ok, fp, bv, nloc, locs, g, px, probeLocal } = info;
          const list = locs.map(([x, y]) => `(${v.fix(x, 2)}, ${v.fix(y, 2)})`).join(', ');
          return String.raw`**${nloc}** local minimizer${nloc === 1 ? '' : 's'} on $[-4,4]$: ${list} · global minimum $f^\star=${v.fix(g[1], 3)}$ at $x=${v.fix(g[0], 2)}$` +
            '\n' + String.raw`probe $x=${v.fix(px, 2)}$, $f(x)=${v.fix(fp, 3)}$, $\delta=${v.fix(del, 2)}$: the lowest value within $\delta$ is ${v.fix(bv, 3)} → the $\delta$-test ${ok ? '**passes**' : '**fails**'}` +
            (probeLocal ? ' · it sits at a local minimizer.' : ok ? ' · it passes for this $\\delta$ but is not a local minimizer: shrink $\\delta$ to see the test fail on a slope... or it lies on a flat stretch.' : '.');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'First-order necessary condition: ∇f = 0',
      credit: 'Fermat, c. 1636 (one variable)',
      statement: String.raw`Let $f:\R^n\to\R$ be differentiable at an interior point $x^\star$ of its domain. If $x^\star$ is a local minimizer, then $\nabla f(x^\star)=0$. More precisely, if $\nabla f(x)\ne0$ then every direction $d$ with $\nabla f(x)^{\mathsf T}d<0$ is a **descent direction**: $f(x+td)<f(x)$ for all sufficiently small $t>0$, so $x$ is not a local minimizer. The condition is only necessary: points with $\nabla f=0$ (**stationary points**) may be minimizers, maximizers or saddle points, and at a boundary minimizer of a constrained problem the gradient need not vanish.`,
      idea: String.raw`By differentiability, $f(x+td)=f(x)+t\,\nabla f(x)^{\mathsf T}d+o(t)$ (pma-5.8 for $n=1$, vcalc-2.12 in general). If $\nabla f(x)^{\mathsf T}d<0$ the linear term beats the $o(t)$ remainder for small $t$ and $f$ decreases. A local minimizer cannot have a descent direction, and $d=-\nabla f(x)$ is one unless $\nabla f(x)=0$. Nothing in the argument looks at second-order behaviour, which is why maxima and saddles pass the test too.`,
      caption: String.raw`Drag the gold point over the landscape (or retype $f$). The green arrow is $-\nabla f$ and its length shrinks to zero at a stationary point (points snap to stationary points when you get close). The ring of dots is $f(p+t\,u)$ for 72 unit directions $u$ at the step length $t$ you choose: green means $f$ went down, red up; the shaded half-disc is the set $\{\nabla f\cdot u<0\}$ predicted by the theorem. They agree for small $t$. At a minimum the whole ring is red, at a maximum green, and at a saddle the ring is split even though $\nabla f=0$ — the first-order test cannot tell them apart. Switch on the descent path to watch gradient descent end where $\nabla f=0$.`,
      deps: ['opt-1.3', 'vcalc-2.12', 'pma-5.8'],
      refs: ['Nocedal–Wright ch. 2'],
      tags: ['gradient', 'necessary condition', 'stationary point'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fermat%27s_theorem_(stationary_points)' },
      viz(v) {
        const PR = [EX.himmel, EX.egg, EX.bowl, EX.cubic, EX.saddle, EX.peak];
        const an = memo1();
        const L = landscape(v, PR, 'himmel', { onChange: (cur) => { s.setView(cur.view.x, cur.view.y); const A = an(L.key, () => analyze(L.f, L.view)); const q = nearest(A.pts, 0, 0); const [x0, x1] = cur.view.x, [y0, y1] = cur.view.y; p.set(x0 + 0.62 * (x1 - x0), y0 + 0.62 * (y1 - y0)); void q; } });
        const tS = v.slider('step length $t$ (fraction of the window)', 0.004, 0.2, 0.06, { log: true, sig: 2 });
        const showStat = v.toggle('mark stationary points', true);
        const showPath = v.toggle('descent path', false);
        v.button('jump to nearest stationary point', () => { const A = an(L.key, () => analyze(L.f, L.view)); const q = nearest(A.pts, p.x, p.y); if (q) p.set(q.x, q.y); });
        const s = v.stage({ x: L.view.x, y: L.view.y, equal: true, axes: 'box', gutter: true, height: 420, xlabel: '$x$', ylabel: '$y$', title: 'gradient and descent directions at p' });
        const p = s.handle(1.9, 1.3, {
          color: 'gold', r: 8, label: '$p$', labelPos: 'ne',
          constrain: (x, y) => {
            const view = L.view, A = an(L.key, () => analyze(L.f, L.view)), W = view.x[1] - view.x[0], q = nearest(A.pts, x, y);
            if (q && Math.hypot(q.x - x, q.y - y) < 0.03 * W) return [q.x, q.y];
            return [clamp(x, view.x[0], view.x[1]), clamp(y, view.y[0], view.y[1])];
          },
        });
        let info = null;
        v.render(() => {
          const f = L.f, view = L.view, W = view.x[1] - view.x[0], A = an(L.key, () => analyze(f, view));
          drawLand(s, f, view, L.key + '|' + view.x);
          if (showStat.value) drawStat(s, A.pts);
          const x = p.x, y = p.y, g = gradNum(f, x, y), gn = Math.hypot(g[0], g[1]), fp = f(x, y), t = tS.value * W;
          if (showPath.value) {
            const d = descend(f, x, y, { keep: true, maxIt: 400 });
            s.path(d.path, { color: 'gold', width: 2.2 });
            s.dot(d.x, d.y, { r: 5, color: 'gold', hollow: true, width: 2 });
          }
          // predicted descent half-disc
          if (gn > 1e-9) {
            const ang = Math.atan2(-g[1], -g[0]), pts = [[x, y]];
            for (let k = 0; k <= 30; k++) { const th = ang - Math.PI / 2 + (Math.PI * k) / 30; pts.push([x + t * Math.cos(th), y + t * Math.sin(th)]); }
            s.poly(pts, { fill: 'green', fillAlpha: 0.14, stroke: false });
            s.line(x - t * Math.cos(ang + Math.PI / 2), y - t * Math.sin(ang + Math.PI / 2), x + t * Math.cos(ang + Math.PI / 2), y + t * Math.sin(ang + Math.PI / 2), { color: 'ink', width: 1.2, dash: [4, 3] });
          }
          const K = 72; let pred = 0, act = 0, agree = 0;
          for (let k = 0; k < K; k++) {
            const th = (2 * Math.PI * k) / K, ux = Math.cos(th), uy = Math.sin(th);
            const dd = g[0] * ux + g[1] * uy, down = f(x + t * ux, y + t * uy) < fp - 1e-12, pr = dd < -1e-9;
            if (pr) pred++; if (down) act++; if (pr === down) agree++;
            s.dot(x + t * ux, y + t * uy, { r: 3, color: down ? 'green' : 'red' });
          }
          if (gn > 1e-7) {
            const Lg = 0.2 * W * Math.tanh(gn / (1.5 * A.gs));
            s.arrow(x, y, x - (Lg * g[0]) / gn, y - (Lg * g[1]) / gn, { color: 'green', width: 3 });
            s.arrow(x, y, x + (0.5 * Lg * g[0]) / gn, y + (0.5 * Lg * g[1]) / gn, { color: 'ink', width: 1.6, alpha: 0.7 });
          }
          s.dot(x, y, { r: 3, color: 'ink' });
          v.legend([['green', '$-\\nabla f(p)$ (steepest descent)'], ['ink', '$\\nabla f(p)$ (half length)'], ['green', '$f$ decreases at $p+tu$', { dot: true }], ['red', '$f$ increases at $p+tu$', { dot: true }], ['green', 'minimum', { dot: true }], ['purple', 'saddle', { dot: true }], ['red', 'maximum', { dot: true }]]);
          const dm = f(x - (t * g[0]) / (gn || 1), y - (t * g[1]) / (gn || 1));
          info = { gn, fp, pred, act, agree, K, t, dm, A, cls: A.pts.length && gn < 1e-6 ? nearest(A.pts, x, y) : null };
        });
        v.readout(() => {
          if (!info) return '';
          const { gn, fp, pred, act, agree, K, t, dm, A, cls } = info;
          const cnt = (c) => A.pts.filter((q) => q.cls === c).length;
          let s = String.raw`$f(p)=${fx(v, fp, 3)}$, $\norm{\nabla f(p)}=${gn < 1e-6 ? '0' : v.sci(gn, 3)}$ · of the ${K} sampled directions at $t=${v.fix(t, 3)}$, the theorem predicts ${pred} descent directions and ${act} actually descend (they agree on ${agree})`;
          if (gn < 1e-6) s += String.raw` · **$\nabla f(p)=0$: stationary.** The necessary condition holds but is silent${cls ? ` — the second-order test (opt-1.5) calls this a **${CLS[cls.cls].short}**` : ''}.`;
          else s += String.raw` · $\nabla f(p)\ne0$, so $p$ is **not** a local minimizer: stepping along $-\nabla f$ lowers $f$ to ${fx(v, dm, 3)}.`;
          s += '\n' + String.raw`Stationary points found in the window by Newton's method: ${A.pts.length} (${cnt('min')} minima, ${cnt('max')} maxima, ${cnt('saddle')} saddles${cnt('flat') ? `, ${cnt('flat')} degenerate` : ''}) — every local minimizer is among them, but so are the others.`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Second-order optimality conditions',
      statement: String.raw`Let $f:\R^n\to\R$ be twice continuously differentiable near $x^\star$.
(a) **Necessary:** if $x^\star$ is a local minimizer, then $\nabla f(x^\star)=0$ and the Hessian $\nabla^2 f(x^\star)$ is positive semidefinite.
(b) **Sufficient:** if $\nabla f(x^\star)=0$ and $\nabla^2f(x^\star)$ is positive definite, then $x^\star$ is a strict local minimizer.
At a stationary point with an indefinite Hessian (eigenvalues of both signs) $x^\star$ is a **saddle point**: not a local minimizer or maximizer. Negative definite gives a strict local maximizer. When the Hessian is only semidefinite the test is inconclusive: $x^2+y^4$ and $x^2-y^4$ both have Hessian $\mathrm{diag}(2,0)$ at the origin, yet the first has a minimum and the second a saddle, while $x^3$ has no extremum at all.`,
      idea: String.raw`Taylor's formula at a stationary point (vcalc-2.13) reads $f(x^\star+d)=f(x^\star)+\tfrac12 d^{\mathsf T}\nabla^2f(x^\star)\,d+o(\norm d^2)$. If the quadratic form is positive on the unit sphere, its minimum $\lambda_{\min}>0$ gives $\ge\tfrac12\lambda_{\min}\norm d^2$, which beats the $o(\norm d^2)$ remainder, so $f$ increases in every direction. If some eigenvalue is negative, moving along its eigenvector lowers $f$ (and a positive one raises it), which rules out a minimum. When $\lambda_{\min}=0$ the quadratic term vanishes along a direction and the remainder, hence higher derivatives, decides.`,
      caption: String.raw`Drag the gold point (it snaps to stationary points; or press the button). The axes are the Hessian eigen-directions, coloured by the sign of the curvature (green positive, red negative), and the green/red curves are the level sets $\tfrac12 d^{\mathsf T}Hd=\pm\varepsilon$ of the local quadratic model. The right panel is a numerical check: $f(p+\rho u(\theta))-f(p)$ on a small circle, against the quadratic prediction (dashed). All positive: minimum; all negative: maximum; sign changes: saddle. Try $x^2+y^4$, $x^2-y^4$ and $x^4+y^4$ to see the Hessian test go silent while the circle profile still decides.`,
      deps: ['opt-1.4', 'vcalc-2.13'],
      refs: ['Nocedal–Wright ch. 2'],
      tags: ['Hessian', 'saddle point', 'sufficient condition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Second_partial_derivative_test' },
      viz(v) {
        const PR = [EX.himmel, EX.egg, EX.cubic, EX.saddle, EX.peak, EX.quart1, EX.quart2, EX.quart3];
        const an = memo1();
        const snapFirst = () => { const A = an(L.key, () => analyze(L.f, L.view)), view = L.view; const q = nearest(A.pts, (view.x[0] + view.x[1]) / 2 + 0.3, (view.y[0] + view.y[1]) / 2 + 0.2); if (q) p.set(q.x, q.y); };
        const L = landscape(v, PR, 'himmel', { onChange: (cur) => { s.setView(cur.view.x, cur.view.y); snapFirst(); } });
        const rS = v.slider('circle radius $\\rho$ (fraction of the window)', 0.004, 0.25, 0.05, { log: true, sig: 2 });
        v.button('jump to nearest stationary point', () => { const A = an(L.key, () => analyze(L.f, L.view)); const q = nearest(A.pts, p.x, p.y); if (q) p.set(q.x, q.y); });
        const s = v.stage({ x: L.view.x, y: L.view.y, equal: true, axes: 'box', gutter: true, height: 400, xlabel: '$x$', ylabel: '$y$', title: 'curvature at p', weight: 1.1 });
        const s2 = v.stage({ x: [0, 360], y: [-1, 1], axes: 'box', gutter: true, height: 400, xlabel: 'direction $\\theta$ (degrees)', ylabel: '$f(p+\\rho u)-f(p)$', title: 'numerical probe on a small circle', weight: 0.9, minWidth: 250, xticks: [0, 90, 180, 270, 360] });
        const p = s.handle(3, 2, {
          color: 'gold', r: 8, label: '$p$', labelPos: 'ne',
          constrain: (x, y) => {
            const view = L.view, A = an(L.key, () => analyze(L.f, L.view)), W = view.x[1] - view.x[0], q = nearest(A.pts, x, y);
            if (q && Math.hypot(q.x - x, q.y - y) < 0.03 * W) return [q.x, q.y];
            return [clamp(x, view.x[0], view.x[1]), clamp(y, view.y[0], view.y[1])];
          },
        });
        let info = null;
        v.render(() => {
          const f = L.f, view = L.view, W = view.x[1] - view.x[0], A = an(L.key, () => analyze(f, view));
          drawLand(s, f, view, L.key + '|' + view.x);
          drawStat(s, A.pts);
          const x = p.x, y = p.y, g = gradNum(f, x, y), gn = Math.hypot(g[0], g[1]), H = hessNum(f, x, y), E = eig2(H), f0 = f(x, y);
          const cls = classify(H, 1e-6), stat = gn < 1e-5 * Math.max(1, A.gs);
          // level curves of the quadratic form  ±ε
          const eps = 0.5 * Math.max(Math.abs(E.l1), Math.abs(E.l2), 1e-6) * (0.1 * W) ** 2, cap = 0.3 * W;
          for (const sg of [1, -1]) {
            const pts = [];
            for (let k = 0; k <= 360; k++) {
              const th = (2 * Math.PI * k) / 360, ux = Math.cos(th), uy = Math.sin(th), q = ux * (H[0][0] * ux + H[0][1] * uy) + uy * (H[1][0] * ux + H[1][1] * uy);
              if (sg * q <= 1e-12) { pts.push(null); continue; }
              const r = Math.sqrt((2 * eps) / (sg * q)); pts.push(r > cap ? null : [x + r * ux, y + r * uy]);
            }
            s.path(pts, { color: sg > 0 ? 'green' : 'red', width: 2.2 });
          }
          for (const [lam, vec] of [[E.l1, E.v1], [E.l2, E.v2]]) {
            const col = lam > 1e-5 * Math.max(1, Math.abs(E.l2), Math.abs(E.l1)) ? 'green' : lam < -1e-5 * Math.max(1, Math.abs(E.l2), Math.abs(E.l1)) ? 'red' : 'orange';
            const h = 0.14 * W;
            s.arrow(x - h * vec[0], y - h * vec[1], x + h * vec[0], y + h * vec[1], { color: col, width: 2.4, both: true });
          }
          s.dot(x, y, { r: 3, color: 'ink' });
          // probe circle
          const rho = rS.value * W, ang = [], dif = [], mod = [];
          for (let k = 0; k <= 180; k++) {
            const th = (2 * Math.PI * k) / 180, ux = Math.cos(th), uy = Math.sin(th);
            ang.push((360 * k) / 180); dif.push(f(x + rho * ux, y + rho * uy) - f0);
            mod.push(rho * (g[0] * ux + g[1] * uy) + 0.5 * rho * rho * (ux * (H[0][0] * ux + H[0][1] * uy) + uy * (H[1][0] * ux + H[1][1] * uy)));
          }
          s.circle(x, y, rho, { color: 'gold', width: 1.4, alpha: 0.9 });
          const lo = Math.min(...dif, ...mod, 0), hi = Math.max(...dif, ...mod, 0), pad = 0.12 * (hi - lo || 1);
          s2.setView([0, 360], [lo - pad, hi + pad]);
          s2.hline(0, { color: 'ink', width: 1.2 });
          s2.path(ang.map((a, i) => [a, mod[i]]), { color: 'purple', width: 1.8, dash: [6, 4] });
          s2.path(ang.map((a, i) => [a, dif[i]]), { color: 'accent', width: 2.8 });
          for (const [vec, col] of [[E.v1, 'orange'], [E.v2, 'orange']]) {
            const a0 = ((Math.atan2(vec[1], vec[0]) * 180) / Math.PI + 360) % 360;
            for (const a of [a0, (a0 + 180) % 360]) s2.vline(a, { color: col, alpha: 0.5, width: 1.2, dash: [3, 4] });
          }
          v.legend([['accent', 'true $f(p+\\rho u)-f(p)$'], ['purple', 'quadratic model', { dash: true }], ['orange', 'eigen-directions', { dash: true }], ['green', '$\\tfrac12d^{\\mathsf T}Hd=+\\varepsilon$'], ['red', '$\\tfrac12d^{\\mathsf T}Hd=-\\varepsilon$']]);
          const mn = Math.min(...dif), mx = Math.max(...dif), tol = 1e-9;
          const probe = mn > tol ? 'min' : mx < -tol ? 'max' : mn < -tol && mx > tol ? 'saddle' : 'flat';
          info = { gn, stat, E, cls, probe, mn, mx, rho, A };
        });
        v.readout(() => {
          if (!info) return '';
          const { gn, stat, E, cls, probe, mn, mx, rho, A } = info;
          const cnt = (c) => A.pts.filter((q) => q.cls === c).length;
          let s = String.raw`$\norm{\nabla f(p)}=${gn < 1e-6 ? '0' : v.sci(gn, 2)}$ · Hessian eigenvalues $\lambda_1=${fx(v, E.l1, 3)}$, $\lambda_2=${fx(v, E.l2, 3)}$`;
          if (!stat) return s + String.raw` · **$p$ is not stationary**: the circle profile is dominated by the first-order term (a sine wave, dashed model), so the second-order conditions do not apply — press *jump to nearest stationary point*.`;
          s += String.raw` → Hessian test: **${CLS[cls].name}**`;
          if (cls === 'flat') s += ' (inconclusive: $\\nabla^2f$ is only semidefinite)';
          s += '\n' + String.raw`numerical probe at $\rho=${v.fix(rho, 3)}$: $f(p+\rho u)-f(p)$ ranges over $[${v.sci(mn, 2)},\,${v.sci(mx, 2)}]$ → **${CLS[probe].name}**. `;
          s += probe === cls ? 'Hessian test and probe **agree** ✓.' : cls === 'flat' ? 'The probe decides what the Hessian could not (the answer may change with a smaller $\\rho$ when higher-order terms are involved).' : 'They differ: shrink $\\rho$ (the quadratic model is only local).';
          s += String.raw` · All stationary points in the window: ${cnt('min')} minima, ${cnt('max')} maxima, ${cnt('saddle')} saddles${cnt('flat') ? `, ${cnt('flat')} degenerate` : ''}.`;
          return s;
        });
      },
    },
  ],
};
