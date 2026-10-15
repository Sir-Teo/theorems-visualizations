// Rudin, Principles of Mathematical Analysis — Chapter 4: Continuity

// ---------- shared helpers (batch 1) ----------
/**
 * Largest δ ≤ R (R = distance to the far end of [a,b]) such that |F(x) − c| < eps for every
 * sampled x in [a,b] with 0 < |x − p| < δ. Samples are geometric near p, then uniform.
 * Returns {d, fail}: d = 0 when points arbitrarily close to p violate the bound; fail = first bad x.
 */
function admissible(F, p, c, eps, a, b, n = 1600) {
  const R = Math.max(p - a, b - p);
  const ds = [];
  for (let j = 34; j >= 1; j--) ds.push((R / n) * Math.pow(0.5, j));
  for (let k = 1; k <= n; k++) ds.push((R * k) / n);
  const bad = (d) => { for (const s of [1, -1]) { const x = p + s * d; if (x >= a && x <= b && !(Math.abs(F(x) - c) < eps)) return x; } return null; };
  for (let i = 0; i < ds.length; i++) {
    if (bad(ds[i]) == null) continue;
    if (ds[i] < R * 1e-6) return { d: 0, fail: bad(ds[i]) };
    let lo = i ? ds[i - 1] : 0, hi = ds[i]; // refine the first violation between two samples
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (bad(m) != null) hi = m; else lo = m; }
    return { d: hi, fail: bad(hi) };
  }
  return { d: R, fail: null };
}
/** Draw y = f(x) on [a,b], broken at the listed points (no spurious vertical joins at jumps). */
function pieces(S, f, a, b, breaks, st) {
  const cuts = [a, ...breaks.filter((c) => c > a && c < b).sort((u, w) => u - w), b];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? 1e-9 : 0), hi = cuts[i + 1] - (i + 2 < cuts.length ? 1e-9 : 0);
    if (hi > lo) S.fn(f, { ...st, domain: [lo, hi] });
  }
}

export default {
  collection: 'pma',
  chapter: 4,
  title: 'Continuity',
  summary: String.raw`Limits of functions and continuity between metric spaces, phrased through open sets so that compactness and connectedness can be pushed forward. Continuous images of compact sets are compact (hence extreme values are attained, and continuity becomes uniform), continuous images of connected sets are connected (the intermediate value theorem), and the chapter ends with a catalogue of discontinuities and monotone functions.`,
  items: [
    {
      num: '4.19',
      kind: 'Theorem',
      name: 'Continuity on a compact space is uniform',
      credit: 'Heine, 1872',
      statement: String.raw`Let $f$ be a continuous map from a compact metric space $X$ into a metric space $Y$. Then $f$ is uniformly continuous on $X$: for every $\eps>0$ there is a single $\delta>0$ such that $d_Y(f(p),f(q))<\eps$ whenever $d_X(p,q)<\delta$.`,
      idea: String.raw`Continuity gives each point $p$ its own radius $\delta(p)$. The balls of radius $\tfrac12\delta(p)$ cover $X$; compactness extracts finitely many, and the smallest of their radii works everywhere. Without compactness the radii can shrink to $0$, as they do for $1/x$ near $0$.`,
      caption: String.raw`Drag the point $p$ and change $\eps$. The lower panel plots the largest admissible $\delta(p)$ at every $p$: on a compact interval its minimum stays positive; on $(0,1]$ it collapses to $0$.`,
      deps: ['pma-4.18', 'pma-2.32', 'pma-4.8'],
      tags: ['compactness', 'continuity'],
      viz(v) {
        const FUNCS = {
          sq: { label: '$x^2$ on $[0,2]$', f: (x) => x * x, a: 0, b: 2, y: [-0.4, 4.4], compact: true },
          wig: { label: '$x\\sin(1/x)$ on $[0,1]$', f: (x) => (x === 0 ? 0 : x * Math.sin(1 / x)), a: 0, b: 1, y: [-0.75, 0.95], compact: true },
          inv: { label: '$1/x$ on $(0,1]$', f: (x) => 1 / x, a: 0.04, b: 1, y: [-1, 26], compact: false },
          osc: { label: '$\\sin(1/x)$ on $(0,1]$', f: (x) => Math.sin(1 / x), a: 0.02, b: 1, y: [-1.6, 1.6], compact: false },
        };
        const which = v.select('', Object.entries(FUNCS).map(([value, F]) => ({ value, label: F.label })), 'sq');
        const eps = v.slider('$\\varepsilon$', 0.05, 1, 0.4, { step: 0.01 });
        const top = v.stage({ x: [-0.1, 2.1], y: [-0.4, 4.4], height: 300, xlabel: 'x', full: true });
        const bot = v.stage({ x: [-0.1, 2.1], y: [0, 1], height: 150, axes: 'box', full: true, title: 'largest admissible $\\delta(p)$ at each $p$' });
        const p = top.handle(1.2, 0, { color: 'accent', constrain: (x) => { const F = FUNCS[which.value]; const xx = v.M.clamp(x, F.a, F.b); return [xx, F.f(xx)]; } });

        let last = null;
        // δ(p) = distance to the nearest point where |f - f(p)| reaches ε (scan outward).
        function deltaAt(F, x, e) {
          const h = (F.b - F.a) / 1500; const fx = F.f(x);
          let r = Infinity, l = Infinity;
          for (let y = x + h; y <= F.b; y += h) if (Math.abs(F.f(y) - fx) >= e) { r = y - x; break; }
          for (let y = x - h; y >= F.a; y -= h) if (Math.abs(F.f(y) - fx) >= e) { l = x - y; break; }
          return Math.min(r, l, F.b - F.a);
        }

        v.render(() => {
          const F = FUNCS[which.value], e = eps.value;
          if (last !== which.value) {
            last = which.value;
            const pad = (F.b - F.a) * 0.05;
            top.setView([Math.min(0, F.a) - pad, F.b + pad], F.y);
            bot.setView([Math.min(0, F.a) - pad, F.b + pad], null);
            p.x = v.M.clamp(F.compact ? (F.a + F.b) * 0.6 : F.a + (F.b - F.a) * 0.25, F.a, F.b);
          }
          p.y = F.f(p.x);
          // δ profile across the domain
          const xs = v.M.linspace(F.a, F.b, 220);
          const ds = xs.map((x) => deltaAt(F, x, e));
          const dmin = Math.min(...ds), dmax = Math.max(...ds);
          bot.setView(null, [0, Math.max(0.05, dmax * 1.15)]);
          const d = deltaAt(F, p.x, e);
          // top: ε band, δ window, graph
          const fp = F.f(p.x);
          top.hband(fp - e, fp + e, { color: 'accent', alpha: 0.1, edges: true });
          top.vband(p.x - d, p.x + d, { color: 'orange', alpha: 0.12, edges: true });
          top.fn(F.f, { domain: [F.a, F.b], color: 'ink', width: 2.2 });
          top.fn(F.f, { domain: [Math.max(F.a, p.x - d), Math.min(F.b, p.x + d)], color: 'accent', width: 3.4 });
          if (!F.compact) top.dot(F.a, F.f(F.a), { hollow: true, color: 'ink', r: 4 });
          top.tex('\\varepsilon', top.bounds.x[1], fp + e, { align: 'right', baseline: 'bottom', color: 'accent', dx: -6, dy: -2 });
          top.tex('\\delta(p)', p.x + d, top.bounds.y[1], { align: 'left', baseline: 'top', color: 'orange', dx: 5, dy: 6 });
          // bottom: δ(p) profile and its infimum
          bot.path(xs.map((x, i) => [x, ds[i]]), { color: 'orange', width: 2 });
          bot.path(xs.map((x, i) => [x, ds[i]]).concat([[F.b, 0], [F.a, 0]]), { fill: 'orange', fillAlpha: 0.12, stroke: false, close: true });
          bot.hline(dmin, { color: F.compact ? 'green' : 'red', dash: true, width: 1.5 });
          bot.dot(p.x, d, { color: 'accent', r: 4.5 });
          bot.corner(F.compact ? `min δ = ${v.fmt(dmin, 2)} > 0 — one δ works everywhere` : `inf δ → 0 near x = 0 — no single δ works`, 'tr', { color: F.compact ? 'green' : 'red', weight: 600 });
          v.legend([['ink', '$y=f(x)$'], ['accent', '$\\varepsilon$-band about $f(p)$', { area: true }], ['orange', '$\\delta(p)$-window', { area: true }]]);
        });
        v.readout(() => {
          const F = FUNCS[which.value]; const d = deltaAt(F, p.x, eps.value);
          return `$p = ${v.fix(p.x, 3)}$, $\\;\\delta(p) = ${v.fix(d, 4)}$` + (F.compact ? ' — the domain is compact, so $\\inf_p \\delta(p) > 0$.' : ' — the domain is not compact; push $p$ toward $0$ and watch $\\delta(p)\\to 0$.');
        });
      },
    },
    // ------------------------------------------------------------------ limits of functions
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Limit of a function',
      statement: String.raw`Let $X$ and $Y$ be metric spaces, $E\subset X$, $f$ a map of $E$ into $Y$, and $p$ a limit point of $E$. We write $f(x)\to q$ as $x\to p$, or $\lim_{x\to p}f(x)=q$, when the point $q\in Y$ has this property: for every $\eps>0$ there is a $\delta>0$ such that $d_Y(f(x),q)<\eps$ for every $x\in E$ with $0<d_X(x,p)<\delta$.

The point $p$ need not belong to $E$, and even when it does, the value $f(p)$ plays no role: only points $x\neq p$ are ever tested.`,
      idea: String.raw`The condition constrains $f$ only on *punctured* neighbourhoods of $p$, so it records what $f(x)$ approaches rather than what happens at $p$. Requiring $p$ to be a limit point of $E$ guarantees that every punctured neighbourhood meets $E$, so the condition is never vacuous — which is what makes the limit unique (4.2a).`,
      caption: String.raw`Pick an example, then drag the candidate limit $q$ and shrink $\eps$. The orange window is the largest punctured $\delta$-neighbourhood of $p$ whose graph stays inside the $\eps$-band about $q$. Only the true limit admits a $\delta$ for *every* $\eps$, and the value $f(p)$ (when it exists) never matters.`,
      deps: ['pma-2.15', 'pma-2.18'],
      tags: ['limits', 'metric spaces'],
      viz(v) {
        const EX = {
          sinc: { label: '$\\sin(3x)/(3x)$', f: (x) => Math.sin(3 * x) / (3 * x), p: 0, L: 1, fp: null, br: [0], x: [-1.6, 1.6], y: [-0.45, 1.55] },
          moved: { label: 'moved value', f: (x) => 0.4 + 0.6 * x * x, p: 1, L: 1, fp: 1.75, br: [], x: [-0.2, 2.2], y: [-0.15, 2.55] },
          damp: { label: '$x\\sin(1/x)$', f: (x) => x * Math.sin(1 / x), p: 0, L: 0, fp: null, br: [0], x: [-0.45, 0.45], y: [-0.4, 0.5] },
          jump: { label: 'jump', f: (x) => 0.6 + 0.4 * x + (x >= 0 ? 0.7 : 0), p: 0, L: null, fp: 1.3, q0: 0.95, br: [0], x: [-1, 1], y: [-0.1, 2.1] },
          wild: { label: '$\\sin(1/x)$', f: (x) => Math.sin(1 / x), p: 0, L: null, fp: null, q0: 0, br: [0], x: [-0.5, 0.5], y: [-1.45, 1.45] },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'moved');
        const eps = v.slider('$\\varepsilon$', 0.03, 0.8, 0.3, { step: 0.01 });
        const S = v.stage({ x: EX.moved.x, y: EX.moved.y, height: 340, xlabel: 'x' });
        const q = S.handle(1, 1, {
          color: 'accent', label: 'q',
          constrain: (x, y) => { const E = EX[which.value]; const span = E.y[1] - E.y[0]; return [E.p, E.L != null && Math.abs(y - E.L) < span * 0.025 ? E.L : y]; },
        });
        q.labelPos = 'nw';
        let last = null, state = null;
        v.legend([['ink', '$y=f(x)$'], ['accent', '$\\varepsilon$-band about $q$', { area: true }], ['orange', 'punctured $\\delta$-window', { area: true }]]);
        v.render(() => {
          const E = EX[which.value], e = eps.value;
          if (last !== which.value) { last = which.value; S.setView(E.x, E.y); q.x = E.p; q.y = E.L ?? E.q0; }
          const [a, b] = E.x;
          const { d, fail } = admissible(E.f, E.p, q.y, e, a, b);
          const nS = which.value === 'wild' ? 6000 : undefined;
          S.hband(q.y - e, q.y + e, { color: 'accent', alpha: 0.1, edges: true });
          if (d > 0) S.vband(E.p - d, E.p + d, { color: 'orange', alpha: 0.13, edges: true });
          S.vline(E.p, { color: 'muted', dash: [2, 4], width: 1 });
          pieces(S, E.f, a, b, E.br, { color: 'ink', width: which.value === 'wild' ? 1.3 : 2, n: nS });
          if (d > 0) pieces(S, E.f, Math.max(a, E.p - d), Math.min(b, E.p + d), [E.p], { color: 'accent', width: 3.4, n: nS });
          if (E.L != null) S.dot(E.p, E.L, { hollow: true, r: 4.5, color: 'ink' });
          if (E.fp != null) S.dot(E.p, E.fp, { r: 4.5, color: 'ink', label: 'f(p)', labelPos: 'e' });
          if (d > 0 && fail != null) S.dot(fail, E.f(fail), { color: 'red', r: 4 });
          S.tex('\\varepsilon', S.bounds.x[1], q.y + e, { align: 'right', baseline: 'bottom', color: 'accent', dx: -6, dy: -2 });
          if (d > 0) S.tex('\\delta', E.p + d, S.bounds.y[1], { align: 'left', baseline: 'top', color: 'orange', dx: 5, dy: 6 });
          S.corner(d > 0 ? `δ = ${v.fmt(d, 3)} works for this q and ε` : 'no δ > 0 works for this q and ε', which.value === 'damp' ? 'bl' : 'tl', { color: d > 0 ? 'green' : 'red', weight: 600 });
          state = { E, d, e };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const { E, d, e } = s;
          let t = d > 0
            ? `Largest admissible $\\delta = ${v.fmt(d, 3)}$: every $x\\ne p$ with $|x-p|<\\delta$ has $|f(x)-q|<${v.fix(e, 2)}$.`
            : `No $\\delta>0$ works for $q = ${v.fix(q.y, 3)}$ and $\\varepsilon = ${v.fix(e, 2)}$.`;
          if (E.L != null) t += ` Here $\\lim_{x\\to p}f(x) = ${E.L}$` + (E.fp != null ? `, although $f(p) = ${E.fp}$: the value at $p$ is never tested.` : ', although $f$ is not even defined at $p$.');
          else t += ' Once $\\varepsilon$ is small no $q$ survives: this $f$ has no limit at $p$.';
          return t;
        });
      },
    },
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Limits through sequences',
      statement: String.raw`Let $X$, $Y$, $E$, $f$ and $p$ be as in Definition 4.1. Then $\lim_{x\to p}f(x)=q$ if and only if $\lim_{n\to\infty}f(p_n)=q$ for every sequence $\{p_n\}$ in $E$ such that $p_n\neq p$ and $p_n\to p$.`,
      idea: String.raw`If the $\eps$–$\delta$ condition holds, every such sequence eventually lies in the punctured $\delta$-ball, so $f(p_n)$ is eventually $\eps$-close to $q$. Conversely, if $f(x)\not\to q$, some $\eps$ defeats every $\delta$; taking $\delta=1/n$ and a bad point $p_n$ for each $n$ yields $p_n\to p$ with $d_Y(f(p_n),q)\ge\eps$ for all $n$.`,
      caption: String.raw`The gold points are $p_n=\pm 1/(2\pi n+\theta)$, all different from $0$ and tending to $0$. For $\sin(1/x)$ the values $f(p_n)$ converge to $\sin\theta$ (to $-\sin\theta$ from the left), so turning $\theta$ realises every number in $[-1,1]$ as a sequential limit — the function has no limit at $0$. The teal reference sequence $r_n$ always gives $-1$. For $x\sin(1/x)$ every sequence gives $0$.`,
      deps: ['pma-4.1', 'pma-3.1'],
      tags: ['limits', 'sequences'],
      viz(v) {
        const FN = {
          wild: { label: '$\\sin(1/x)$', f: (x) => Math.sin(1 / x), y: [-1.35, 1.35] },
          damp: { label: '$x\\sin(1/x)$', f: (x) => x * Math.sin(1 / x), y: [-0.2, 0.2] },
          sgn: { label: '$\\operatorname{sgn} x$', f: (x) => Math.sign(x), y: [-1.45, 1.45] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'wild');
        const side = v.select('$p_n$', [{ value: 'r', label: 'from the right' }, { value: 'l', label: 'from the left' }, { value: 'a', label: 'alternating' }], 'r');
        const th = v.slider('$\\theta$', 0, 2 * Math.PI, 1.1, { step: 0.01 });
        const N = v.slider('terms $N$', 4, 60, 30, { int: true });
        const top = v.stage({ x: [-0.19, 0.19], y: FN.wild.y, height: 270, xlabel: 'x', full: true, xticks: [[-0.15, '−0.15'], [-0.05, '−0.05'], [0.05, '0.05'], [0.15, '0.15']], yticks: [], title: 'the graph near $p=0$ with the points $(p_n, f(p_n))$ and $(r_n, f(r_n))$' });
        const bot = v.stage({ x: [0, 31], y: FN.wild.y, height: 170, full: true, xlabel: 'n', title: 'the sequences $f(p_n)$ (gold) and $f(r_n)$ (teal) against $n$' });
        const sgnOf = (n) => (side.value === 'r' ? 1 : side.value === 'l' ? -1 : (n % 2 ? -1 : 1));
        function seqLimit() {
          const k = which.value, s = side.value, a = Math.sin(th.value);
          if (k === 'damp') return 0;
          if (k === 'wild') return s === 'r' ? a : s === 'l' ? -a : (Math.abs(a) < 1e-9 ? 0 : null);
          return s === 'r' ? 1 : s === 'l' ? -1 : null;
        }
        let state = null;
        v.legend([['gold', '$p_n = \\pm 1/(2\\pi n+\\theta)$', { dot: true }], ['teal', 'reference $r_n = 1/(2\\pi n + 3\\pi/2)$', { dot: true }], ['green', 'limit of $f(p_n)$', { dash: true }]]);
        v.render(() => {
          const F = FN[which.value], n = N.value;
          top.setView(null, F.y); bot.setView([0, n + 1], F.y);
          const pts = [];
          for (let k = 1; k <= n; k++) { const x = sgnOf(k) / (2 * Math.PI * k + th.value); pts.push([x, F.f(x)]); }
          // fixed reference sequence r_n = 1/(2πn + 3π/2) from the right (sin(1/r_n) = −1)
          const ref = [];
          for (let k = 1; k <= n; k++) { const x = 1 / (2 * Math.PI * k + 1.5 * Math.PI); ref.push([x, F.f(x)]); }
          const L = seqLimit();
          if (L != null) { top.hline(L, { color: 'green', dash: [6, 4], width: 1.4 }); bot.hline(L, { color: 'green', dash: [6, 4], width: 1.4 }); }
          top.fn(F.f, { domain: [-0.19, -1e-9], color: 'ink', width: which.value === 'wild' ? 1.1 : 1.8, n: 6000, alpha: 0.75 });
          top.fn(F.f, { domain: [1e-9, 0.19], color: 'ink', width: which.value === 'wild' ? 1.1 : 1.8, n: 6000, alpha: 0.75 });
          pts.slice(0, 8).forEach(([x, y]) => top.line(x, 0, x, y, { color: 'gold', width: 1, alpha: 0.6, dash: [2, 3] }));
          top.dots(pts.map(([x]) => [x, 0]), { color: 'gold', r: 2.2 });
          pts.forEach(([x, y]) => top.dot(x, y, { color: 'gold', r: 3.6 }));
          if (pts.length) top.tex('p_1', pts[0][0], 0, { color: 'gold', baseline: 'top', dy: 5, size: 13 });
          ref.forEach(([x, y]) => top.dot(x, y, { color: 'teal', r: 3 }));
          bot.path(ref.map(([, y], i) => [i + 1, y]), { color: 'teal', width: 1, alpha: 0.45 });
          ref.forEach(([, y], i) => bot.dot(i + 1, y, { color: 'teal', r: 2.8 }));
          bot.path(pts.map(([, y], i) => [i + 1, y]), { color: 'gold', width: 1, alpha: 0.5 });
          pts.forEach(([, y], i) => bot.dot(i + 1, y, { color: 'gold', r: 3.4 }));
          if (L != null) bot.tex(`\\to ${v.fix(L, 3)}`, n + 1, L, { color: 'green', align: 'right', baseline: 'bottom', dx: -4, dy: -3, size: 14 });
          state = { L, pts };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const k = which.value;
          let t = s.L != null ? `Along this sequence $f(p_n)\\to ${v.fix(s.L, 3)}$.` : `Along this sequence $f(p_n)$ keeps alternating between $${v.fix(s.pts[0][1], 3)}$ and $${v.fix(s.pts[1][1], 3)}$, so it has no limit.`;
          if (k === 'wild') t += ' The limit $\\pm\\sin\\theta$ changes with $\\theta$, while $f(r_n) = -1$ throughout: by 4.2, $\\sin(1/x)$ has no limit at $0$.';
          else if (k === 'damp') t += ' Every admissible sequence gives $0$, as it must, since $x\\sin(1/x)\\to 0$.';
          else t += ' Right-hand sequences give $1$ and left-hand ones $-1$: no limit at $0$.';
          return t;
        });
      },
    },
    {
      num: '4.2a',
      kind: 'Corollary',
      name: 'Limits are unique',
      statement: String.raw`If $f$ has a limit at $p$ in the sense of Definition 4.1, that limit is unique: if $f(x)\to q$ and $f(x)\to q'$ as $x\to p$, then $q=q'$.`,
      idea: String.raw`Because $p$ is a limit point of $E$ there is a sequence $p_n\to p$ in $E$ with $p_n\neq p$. By 4.2, $f(p_n)$ converges both to $q$ and to $q'$, and a sequence in a metric space has at most one limit (3.2). Geometrically: with $\eps=\frac12 d_Y(q,q')$ the two $\eps$-balls are disjoint, yet $f(x)$ would have to lie in both for $x$ near $p$.`,
      caption: String.raw`Here $f$ maps $E=[-1,1]\setminus\{0\}$ into the plane, spiralling in as $t\to0$. Drag the candidates $q$ and $q'$: the balls of radius $\eps=\tfrac12 d(q,q')$ are disjoint, so the gold tail $f(\{0<|t|<\delta\})$ can sit inside at most one of them. On the right, the distances from $f(t)$ to the two candidates: as $t\to0$ they tend to $d(L,q)$ and $d(L,q')$, which add up to at least $2\eps$, so at most one candidate gets a positive $\delta$ (dashed lines).`,
      deps: ['pma-4.2', 'pma-3.2'],
      tags: ['limits'],
      viz(v) {
        const L = [0.1, 0.05];
        // a double logarithmic spiral: E = [-1,1] \ {0} → R², f(t) → L as t → 0
        const f = (t) => { const r = 1.15 * Math.abs(t), ph = 5.5 * Math.log(1 / Math.abs(t)) + (t < 0 ? Math.PI : 0); return [L[0] + r * Math.cos(ph), L[1] + r * Math.sin(ph)]; };
        const S = v.stage({ x: [-1.4, 1.8], y: [-1.35, 1.35], equal: true, axes: false, height: 320, weight: 1.1, title: 'values $f(t)$ in the plane $Y$' });
        const T = v.stage({ x: [-1.05, 1.05], y: [0, 2.6], height: 320, axes: 'box', xlabel: 't', xticks: [-0.5, 0, 0.5], title: "distances $d(f(t),q)$, $d(f(t),q')$ against $t$" });
        const dl = v.slider('tail $\\delta$', 0.02, 1, 0.3, { step: 0.01 });
        const q1 = S.handle(L[0], L[1], { color: 'blue', label: 'q' });
        const q2 = S.handle(1.2, -0.75, { color: 'red', label: 'q′' });
        const US = v.M.linspace(Math.log(1e-7), 0, 2600);
        function deltaFor(c, eps) {
          for (const u of US) { const t = Math.exp(u); for (const s of [1, -1]) { const P = f(s * t); if (!(Math.hypot(P[0] - c[0], P[1] - c[1]) < eps)) return t < 1e-6 ? 0 : t; } }
          return 1;
        }
        const arm = (s, t1, st) => S.curve((u) => f(s * Math.exp(u)), Math.log(0.0015), Math.log(t1), { n: 1400, ...st });
        let state = null;
        v.legend([['ink', 'the curve $f(E)$'], ['gold', 'tail $f(\\{0<|t|<\\delta\\})$'], ['blue', '$B(q,\\varepsilon)$', { area: true }], ['red', "$B(q',\\varepsilon)$", { area: true }]]);
        v.render(() => {
          const a = [q1.x, q1.y], b = [q2.x, q2.y];
          const eps = Math.max(1e-6, Math.hypot(a[0] - b[0], a[1] - b[1]) / 2);
          const d1 = deltaFor(a, eps), d2 = deltaFor(b, eps), dt = dl.value;
          // values
          S.circle(a[0], a[1], eps, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 1.5 });
          S.circle(b[0], b[1], eps, { fill: 'red', fillAlpha: 0.12, color: 'red', width: 1.5 });
          S.line(a[0], a[1], b[0], b[1], { color: 'muted', width: 1, dash: [3, 4] });
          for (const s of [1, -1]) arm(s, 1, { color: 'ink', width: 1.2, alpha: 0.5 });
          for (const s of [1, -1]) arm(s, dt, { color: 'gold', width: 2.6 });
          const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          S.tex('\\varepsilon', (a[0] + 3 * m[0]) / 4, (a[1] + 3 * m[1]) / 4, { color: 'muted', dy: -11, size: 14 });
          const win = d1 > 0 && d2 === 0 ? 'only q can be the limit' : d2 > 0 && d1 === 0 ? 'only q′ can be the limit' : d1 === 0 && d2 === 0 ? 'neither candidate is the limit' : '';
          S.corner(win, 'tl', { color: d1 > 0 || d2 > 0 ? 'green' : 'red', weight: 600 });
          // distances against t
          const da = (t) => Math.hypot(f(t)[0] - a[0], f(t)[1] - a[1]), db = (t) => Math.hypot(f(t)[0] - b[0], f(t)[1] - b[1]);
          let ymax = 1;
          for (const t of v.M.linspace(-1, 1, 201)) if (t !== 0) ymax = Math.max(ymax, da(t), db(t));
          T.setView(null, [0, ymax * 1.08]);
          T.vband(-dt, dt, { color: 'gold', alpha: 0.13 });
          T.hline(eps, { color: 'muted', dash: [5, 4], width: 1.3 });
          T.tex('\\varepsilon', T.bounds.x[1], eps, { color: 'muted', align: 'right', baseline: 'bottom', dx: -5, dy: -2 });
          for (const [F, col] of [[da, 'blue'], [db, 'red']]) { T.fn(F, { domain: [-1, -5e-4], n: 1600, color: col, width: 1.8 }); T.fn(F, { domain: [5e-4, 1], n: 1600, color: col, width: 1.8 }); }
          T.dot(0, Math.hypot(L[0] - a[0], L[1] - a[1]), { hollow: true, color: 'blue', r: 4 });
          T.dot(0, Math.hypot(L[0] - b[0], L[1] - b[1]), { hollow: true, color: 'red', r: 4 });
          for (const [d, col, lab] of [[d1, 'blue', '\\delta(q)'], [d2, 'red', "\\delta(q')"]]) if (d > 0) {
            for (const s of [1, -1]) T.vline(s * Math.min(d, 1), { color: col, dash: [2, 3], width: 1.3 });
            T.tex(lab, Math.min(d, 1), T.bounds.y[1], { color: col, align: 'left', baseline: 'top', dx: 4, dy: 5, size: 13 });
          }
          state = { eps, d1, d2, dt };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const inA = s.d1 >= s.dt, inB = s.d2 >= s.dt;
          return `$\\varepsilon = \\tfrac12 d(q,q') = ${v.fix(s.eps, 3)}$. Largest admissible $\\delta$: $${v.fmt(s.d1, 3)}$ for $q$, $${v.fmt(s.d2, 3)}$ for $q'$. `
            + (inA ? 'The gold tail lies in $B(q,\\varepsilon)$.' : inB ? "The gold tail lies in $B(q',\\varepsilon)$." : 'The gold tail lies in neither ball — shrink $\\delta$, or move a candidate to the centre of the spiral.');
        });
      },
    },
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Limits of sums, products and quotients',
      statement: String.raw`Let $E\subset X$, where $X$ is a metric space, let $p$ be a limit point of $E$, and let $f,g$ be complex functions on $E$ with $\lim_{x\to p}f(x)=A$ and $\lim_{x\to p}g(x)=B$. Then
(a) $\lim_{x\to p}(f+g)(x)=A+B$;
(b) $\lim_{x\to p}(fg)(x)=AB$;
(c) $\lim_{x\to p}(f/g)(x)=A/B$, provided $B\neq0$.

For maps $\mathbf f,\mathbf g$ into $\R^k$, (a) remains true and (b) becomes $\lim_{x\to p}(\mathbf f\cdot\mathbf g)(x)=\mathbf A\cdot\mathbf B$.`,
      idea: String.raw`By 4.2 it is enough to test sequences $p_n\to p$ with $p_n\ne p$, and for sequences these are the limit rules of 3.3. In $\eps$–$\delta$ language the triangle inequality does the work, e.g. $|fg-AB|\le|f-A|\,|g-B|+|A|\,|g-B|+|B|\,|f-A|$, so the error of the combination is squeezed by the errors of $f$ and $g$; for the quotient one also needs $|g|$ bounded away from $0$ near $p$, which is where $B\ne0$ enters.`,
      caption: String.raw`Choose an operation and the limit $B$ of $g$. The bottom panel plots $|f-A|$, $|g-B|$ and $|h-C|$ for $h=f+g$, $fg$ or $f/g$, together with the triangle-inequality bound (dashed) used in the proof. Drag the gold marker toward $p=1$: everything is squeezed to $0$ — except $f/g$ when $B=0$.`,
      deps: ['pma-4.2', 'pma-3.3', 'pma-4.1'],
      tags: ['limits', 'algebra of limits'],
      viz(v) {
        const p = 1, A = 1.2;
        const f = (x) => A + 0.6 * (x - p) * Math.sin(2.5 / (x - p));
        const op = v.select('$h=$', [{ value: 'sum', label: '$f+g$' }, { value: 'prod', label: '$fg$' }, { value: 'quot', label: '$f/g$' }], 'prod');
        const Bs = v.slider('$B=\\lim g$', -1, 1.5, 0.8, { step: 0.05 });
        const g = (x) => Bs.value + 0.8 * (x - p) + 0.5 * (x - p) ** 2;
        const H = (x) => (op.value === 'sum' ? f(x) + g(x) : op.value === 'prod' ? f(x) * g(x) : f(x) / g(x));
        const X = [0.3, 1.7];
        const SL = v.stage({ x: X, y: [0.5, 2], height: 250, minWidth: 300, title: '$f$ (blue) and $g$ (purple) near $p=1$' });
        const SR = v.stage({ x: X, y: [-2, 3], height: 250, minWidth: 300, title: '$h$' });
        const SD = v.stage({ x: X, y: [0, 1], height: 170, full: true, axes: 'box', title: 'errors $|f-A|$, $|g-B|$, $|h-C|$ and the bound from the proof' });
        const xm = SR.handle(1.45, 0, { color: 'gold', constrain: (x) => { const xx = v.M.clamp(x, X[0] + 0.01, X[1] - 0.01); const y = H(xx); return [xx, isFinite(y) ? y : 0]; } });
        let state = null;
        v.legend([['blue', '$|f-A|$'], ['purple', '$|g-B|$'], ['green', '$|h-C|$'], ['ink', 'bound', { dash: true }]]);
        v.render(() => {
          const B = Bs.value, Bz = Math.abs(B) < 1e-9, o = op.value;
          const C = o === 'sum' ? A + B : o === 'prod' ? A * B : Bz ? NaN : A / B;
          const bound = (x) => {
            const ef = Math.abs(f(x) - A), eg = Math.abs(g(x) - B);
            return o === 'sum' ? ef + eg : o === 'prod' ? ef * eg + Math.abs(A) * eg + Math.abs(B) * ef : (Math.abs(B) * ef + Math.abs(A) * eg) / (Math.abs(g(x)) * Math.abs(B));
          };
          SL.setView(null, [Math.min(0.6, B - 0.45), Math.max(1.8, B + 0.95)]);
          // right panel range from robust quantiles of h
          const hs = v.M.linspace(X[0], X[1], 300).filter((x) => Math.abs(x - p) > 1e-6).map(H).filter(isFinite).sort((a, b) => a - b);
          let lo = hs[Math.floor(hs.length * 0.04)], hi = hs[Math.floor(hs.length * 0.96)];
          if (isFinite(C)) { lo = Math.min(lo, C); hi = Math.max(hi, C); }
          const pad = (hi - lo) * 0.15 + 0.1;
          SR.setView(null, [lo - pad, hi + pad]);
          SR.setTitle(`$h = ${o === 'sum' ? 'f+g' : o === 'prod' ? 'fg' : 'f/g'}$ (green) and $C = ${o === 'sum' ? 'A+B' : o === 'prod' ? 'AB' : 'A/B'}$`);
          xm.y = H(xm.x); if (!isFinite(xm.y)) xm.y = 0;
          const x0 = xm.x;
          for (const S of [SL, SR, SD]) S.vline(x0, { color: 'gold', dash: [3, 4], width: 1.2 });
          // left: f and g
          pieces(SL, f, X[0], X[1], [p], { color: 'blue', width: 2, n: 2400 });
          pieces(SL, g, X[0], X[1], [p], { color: 'purple', width: 2 });
          SL.dot(p, A, { hollow: true, color: 'blue', r: 4.5 }); SL.dot(p, B, { hollow: true, color: 'purple', r: 4.5 });
          SL.tex('A', p, A, { color: 'blue', align: 'right', dx: -9, dy: -12 }); SL.tex('B', p, B, { color: 'purple', align: 'left', dx: 9, dy: 12 });
          SL.dot(x0, f(x0), { color: 'blue', r: 3.5 }); SL.dot(x0, g(x0), { color: 'purple', r: 3.5 });
          // right: h
          if (o === 'quot') SR.hline(0, { color: 'faint' });
          pieces(SR, H, X[0], X[1], [p], { color: 'green', width: 2.2, n: 2400 });
          if (isFinite(C)) { SR.dot(p, C, { hollow: true, color: 'green', r: 4.5 }); SR.tex('C', p, C, { color: 'green', align: 'right', dx: -9, dy: -12 }); }
          else SR.corner('B = 0: part (c) does not apply', 'tl', { color: 'red', weight: 600 });
          // bottom: errors
          const xs = v.M.linspace(X[0] + 0.002, X[1] - 0.002, 900).filter((x) => Math.abs(x - p) > 1e-6);
          let ymax = 0.2;
          if (isFinite(C)) for (const x of xs) if (Math.abs(x - p) < 0.35) { const bb = bound(x); if (isFinite(bb)) ymax = Math.max(ymax, bb); }
          ymax = Math.min(ymax * 1.1, 4);
          SD.setView(null, [0, ymax]);
          const curve = (F, st) => SD.path(xs.map((x) => { const y = F(x); return isFinite(y) ? [x, Math.min(y, ymax * 3)] : null; }), st);
          curve((x) => Math.abs(f(x) - A), { color: 'blue', width: 1.2, alpha: 0.7 });
          curve((x) => Math.abs(g(x) - B), { color: 'purple', width: 1.2, alpha: 0.7 });
          if (isFinite(C)) { curve(bound, { color: 'ink', width: 1.5, dash: [5, 4] }); curve((x) => Math.abs(H(x) - C), { color: 'green', width: 2.2 }); }
          SD.dot(p, 0, { color: 'green', r: 4 });
          state = { C, x0, B, o, bound: isFinite(C) ? bound(x0) : NaN };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const { x0 } = s;
          const ef = Math.abs(f(x0) - A), eg = Math.abs(g(x0) - s.B);
          if (!isFinite(s.C)) return `With $B=0$ the quotient is not covered by the theorem: near $p$ the denominator $g$ tends to $0$ while $f\\to A=${A}\\neq0$, so $|f/g|$ is unbounded.`;
          const eh = Math.abs(H(x0) - s.C);
          return `At $x = ${v.fix(x0, 3)}$: $|f-A| = ${v.fmt(ef, 3)}$, $|g-B| = ${v.fmt(eg, 3)}$, and $|h-C| = ${v.fmt(eh, 3)} \\le ${v.fmt(s.bound, 3)}$ (bound), with $C = ${v.fix(s.C, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ continuous functions
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Continuity at a point',
      statement: String.raw`Let $X,Y$ be metric spaces, $E\subset X$, $p\in E$, and $f:E\to Y$. Then $f$ is *continuous at $p$* if for every $\eps>0$ there is a $\delta>0$ such that $d_Y(f(x),f(p))<\eps$ for all $x\in E$ with $d_X(x,p)<\delta$. If $f$ is continuous at every point of $E$, it is *continuous on $E$*.

Unlike a limit, this requires $f$ to be defined at $p$; and if $p$ is an isolated point of $E$, every function on $E$ is continuous at $p$.`,
      idea: String.raw`Compared with the limit of 4.1, the target is now the actual value $f(p)$ and the point $x=p$ is allowed. At an isolated point a small enough $\delta$-ball contains no point of $E$ other than $p$, so the condition holds trivially; at a limit point of $E$ it says exactly that $f(x)\to f(p)$ (4.6).`,
      caption: String.raw`The domain $E$ (bottom strip) is two intervals plus two isolated points. Drag $p$ along $E$ and shrink $\eps$: the orange window is the largest admissible $\delta$, and the points of $E$ inside it are lit up. At the isolated points $\delta$ stays positive however small $\eps$ is; switch on the jump and park $p$ at $x=1.2$ to watch continuity fail.`,
      deps: ['pma-2.15', 'pma-2.18'],
      see: ['rca-1.2'],
      tags: ['continuity'],
      viz(v) {
        const PIECES = [[0, 2], [2.6, 2.6], [3.1, 3.1], [3.6, 5]];
        const ISO = [[2.6, 2.25], [3.1, -0.35]];
        const base = (x) => 1 + 0.6 * Math.sin(1.4 * x) + 0.1 * x;
        const jump = v.toggle('jump at $x=1.2$', false);
        const eps = v.slider('$\\varepsilon$', 0.03, 1, 0.3, { step: 0.01 });
        const F = (x) => { for (const [xi, yi] of ISO) if (Math.abs(x - xi) < 1e-9) return yi; return base(x) + (jump.value && x > 1.2 && x <= 2 ? 0.6 : 0); };
        const inE = (x) => PIECES.some(([a, b]) => x >= a - 1e-12 && x <= b + 1e-12);
        const snap = (x) => { let best = 0, bd = Infinity; for (const [a, b] of PIECES) { const c = Math.min(b, Math.max(a, x)); if (Math.abs(c - x) < bd) { bd = Math.abs(c - x); best = c; } } return best; };
        const S = v.stage({ x: [-0.3, 5.3], y: [-1.05, 2.8], height: 340, xlabel: 'x' });
        const P = S.handle(0.7, F(0.7), { color: 'accent', label: 'p', constrain: (x) => { const s = snap(x); return [s, F(s)]; } });
        const isoAt = (x) => ISO.some(([xi]) => Math.abs(x - xi) < 1e-9);
        function deltaStar(px, e) {
          const fp = F(px), R = 5.5, n = 2200;
          let best = R;
          const ds = []; for (let j = 34; j >= 1; j--) ds.push((R / n) * 0.5 ** j); for (let k = 1; k <= n; k++) ds.push((R * k) / n);
          outer: for (const d of ds) for (const s of [1, -1]) { const x = px + s * d; if (!inE(x)) continue; if (!(Math.abs(F(x) - fp) < e)) { best = d < 1e-6 ? 0 : d; break outer; } }
          for (const [xi] of ISO) if (Math.abs(xi - px) > 1e-9 && !(Math.abs(F(xi) - fp) < e)) best = Math.min(best, Math.abs(xi - px));
          return best;
        }
        const yE = -0.72;
        let state = null;
        v.legend([['ink', 'graph of $f$ on $E$'], ['accent', '$\\varepsilon$-band about $f(p)$', { area: true }], ['orange', '$\\delta$-window', { area: true }]]);
        v.render(() => {
          P.y = F(P.x);
          const px = P.x, fp = P.y, e = eps.value, d = deltaStar(px, e);
          S.hband(fp - e, fp + e, { color: 'accent', alpha: 0.1, edges: true });
          if (d > 0) S.vband(px - d, px + d, { color: 'orange', alpha: 0.12, edges: true });
          // the domain E as a strip
          S.text('E', -0.18, yE, { math: true, color: 'muted', align: 'center' });
          for (const [a, b] of PIECES) if (b > a) S.line(a, yE, b, yE, { color: 'faint', width: 6, cap: 'butt' });
          for (const [a, b] of PIECES) { const lo = Math.max(a, px - d), hi = Math.min(b, px + d); if (b > a && hi > lo) S.line(lo, yE, hi, yE, { color: 'orange', width: 6, cap: 'butt' }); }
          for (const [xi] of ISO) S.dot(xi, yE, { r: 4.5, color: Math.abs(xi - px) < d ? 'orange' : 'faint' });
          // graph
          const br = jump.value ? [1.2] : [];
          pieces(S, F, 0, 2, br, { color: 'ink', width: 2.2 });
          S.fn(F, { domain: [3.6, 5], color: 'ink', width: 2.2 });
          for (const [a, b] of [[0, 2], [3.6, 5]]) { const lo = Math.max(a, px - d), hi = Math.min(b, px + d); if (hi > lo) pieces(S, F, lo, hi, br, { color: 'accent', width: 3.6 }); }
          if (jump.value) { S.dot(1.2, base(1.2) + 0.6, { hollow: true, r: 4, color: 'ink' }); S.dot(1.2, base(1.2), { r: 4, color: 'ink' }); }
          for (const [xi, yi] of ISO) S.dot(xi, yi, { r: 4.5, color: Math.abs(xi - px) < d ? 'accent' : 'ink' });
          S.tex('\\varepsilon', S.bounds.x[1], fp + e, { align: 'right', baseline: 'bottom', color: 'accent', dx: -6, dy: -2 });
          if (d > 0 && d < 5) S.tex('\\delta', Math.min(px + d, 5.2), S.bounds.y[1], { align: 'left', baseline: 'top', color: 'orange', dx: 5, dy: 6 });
          S.corner(d > 0 ? 'continuous at p for this ε' : 'no δ works — not continuous at p', 'tr', { color: d > 0 ? 'green' : 'red', weight: 600 });
          state = { px, d, e, iso: isoAt(px) };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.iso) return `$p = ${v.fix(s.px, 2)}$ is an isolated point of $E$: a ball of radius $\\le 0.5$ about $p$ meets $E$ only in $p$, so the condition holds for every $\\varepsilon$ (here the largest admissible $\\delta$ is $${v.fmt(s.d, 3)}$).`;
          if (s.d > 0) return `$p = ${v.fix(s.px, 3)}$: largest admissible $\\delta = ${v.fmt(s.d, 3)}$ for $\\varepsilon = ${v.fix(s.e, 2)}$.`;
          return `$p = ${v.fix(s.px, 3)}$: points of $E$ arbitrarily close to $p$ have $|f(x)-f(p)|\\ge\\varepsilon$, so no $\\delta$ works and $f$ is not continuous at $p$.`;
        });
      },
    },
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Continuity at a limit point via limits',
      statement: String.raw`In the setting of Definition 4.5, suppose in addition that $p$ is a limit point of $E$. Then $f$ is continuous at $p$ if and only if $\lim_{x\to p}f(x)=f(p)$.`,
      idea: String.raw`Compare Definitions 4.1 and 4.5 with $q=f(p)$: they differ only in whether the point $x=p$ is tested, and there the inequality $d_Y(f(p),f(p))=0<\eps$ holds automatically. The limit-point hypothesis is needed only so that $\lim_{x\to p}f(x)$ is meaningful.`,
      caption: String.raw`Drag the value $f(p)$ up and down. The lower panel plots, for each $\eps$, the largest $\delta$ that continuity at $p$ allows; it vanishes for every $\eps\le|f(p)-L|$ (red strip), where $L=\lim_{x\to p}f(x)$ is the hole in the graph. Snap $f(p)$ onto the hole and the strip disappears: then $\delta>0$ for every $\eps$, and the curve coincides with the dashed one for the limit.`,
      deps: ['pma-4.1', 'pma-4.5'],
      tags: ['continuity', 'limits'],
      viz(v) {
        const p = 0.6, f = (x) => 1 + 0.55 * Math.sin(2.2 * (x - 0.3)) - 0.12 * (x - 1) ** 2, Lim = f(p);
        const X = [-0.6, 2.6];
        const eps = v.slider('$\\varepsilon$', 0.03, 1.2, 0.3, { step: 0.01 });
        const top = v.stage({ x: X, y: [-0.15, 2.4], height: 270, xlabel: 'x', full: true });
        const bot = v.stage({ x: [0, 1.25], y: [0, 1.75], height: 170, axes: 'box', full: true, title: 'largest $\\delta$ that continuity at $p$ allows, as a function of $\\varepsilon$' });
        const FP = top.handle(p, Lim + 0.5, { color: 'accent', label: 'f(p)', constrain: (x, y) => [p, Math.abs(y - Lim) < 0.05 ? Lim : y] });
        const ES = v.M.linspace(0.004, 1.25, 130);
        let cacheKey = null, curveC = [], curveL = null, state = null;
        v.legend([['orange', 'continuity at $p$ with value $f(p)$'], ['muted', 'limit $L$ at $p$ (value ignored)', { dash: true }], ['red', 'no $\\delta$ exists', { area: true }]]);
        v.render(() => {
          const fp = FP.y, e = eps.value, gap = Math.abs(fp - Lim);
          if (!curveL) curveL = ES.map((t) => [t, admissible(f, p, Lim, t, X[0], X[1], 500).d]);
          if (cacheKey !== fp) { cacheKey = fp; curveC = ES.map((t) => [t, t <= gap ? 0 : admissible(f, p, fp, t, X[0], X[1], 500).d]); }
          const d = e <= gap ? 0 : admissible(f, p, fp, e, X[0], X[1]).d;
          // top
          top.hband(fp - e, fp + e, { color: 'accent', alpha: 0.1, edges: true });
          if (d > 0) top.vband(p - d, p + d, { color: 'orange', alpha: 0.13, edges: true });
          top.vline(p, { color: 'muted', dash: [2, 4], width: 1 });
          top.fn(f, { domain: [X[0], p - 1e-9], color: 'ink', width: 2.2 }); top.fn(f, { domain: [p + 1e-9, X[1]], color: 'ink', width: 2.2 });
          if (d > 0) { top.fn(f, { domain: [Math.max(X[0], p - d), p - 1e-9], color: 'accent', width: 3.4 }); top.fn(f, { domain: [p + 1e-9, Math.min(X[1], p + d)], color: 'accent', width: 3.4 }); }
          if (gap > 0) { top.dot(p, Lim, { hollow: true, r: 4.5, color: 'ink' }); top.tex('L', p, Lim, { color: 'ink', align: 'right', dx: -9, dy: 10 }); }
          top.tex('\\varepsilon', top.bounds.x[1], fp + e, { align: 'right', baseline: 'bottom', color: 'accent', dx: -6, dy: -2 });
          if (d > 0) top.tex('\\delta', p + d, top.bounds.y[1], { align: 'left', baseline: 'top', color: 'orange', dx: 5, dy: 6 });
          top.corner(gap === 0 ? 'f(p) = lim f: continuous at p' : 'f(p) ≠ lim f: not continuous at p', 'tl', { color: gap === 0 ? 'green' : 'red', weight: 600 });
          // bottom
          if (gap > 0) { bot.vband(0, Math.min(gap, 1.25), { color: 'red', alpha: 0.12 }); bot.text('no δ for ε ≤ |f(p) − L|', Math.min(gap, 1.25) / 2, 1.45, { color: 'red', align: 'center', size: 11.5 }); }
          bot.path(curveL, { color: 'muted', width: 1.4, dash: [5, 4] });
          bot.path(curveC, { color: 'orange', width: 2.4 });
          bot.vline(e, { color: 'accent', dash: [3, 4], width: 1.2 });
          bot.dot(e, d, { color: 'accent', r: 4.5 });
          bot.text('ε', 1.22, 0.1, { math: true, color: 'muted' });
          state = { fp, gap, d, e };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$L = \\lim_{x\\to p} f(x) = ${v.fix(Lim, 3)}$ and $f(p) = ${v.fix(s.fp, 3)}$` + (s.gap === 0
            ? ' coincide, so $f$ is continuous at $p$: some $\\delta>0$ works for every $\\varepsilon>0$.'
            : ` differ by $${v.fix(s.gap, 3)}$: every $\\varepsilon \\le ${v.fix(s.gap, 3)}$ defeats continuity, although the limit exists.`);
        });
      },
    },
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Composition of continuous maps',
      statement: String.raw`Let $X,Y,Z$ be metric spaces, $E\subset X$, $f:E\to Y$, $g:f(E)\to Z$, and define $h:E\to Z$ by $h(x)=g(f(x))$. If $f$ is continuous at $p\in E$ and $g$ is continuous at $f(p)$, then $h$ is continuous at $p$.`,
      idea: String.raw`Chain the two definitions. Given $\eps>0$, continuity of $g$ at $f(p)$ gives $\eta>0$ with $d_Z(g(y),g(f(p)))<\eps$ whenever $d_Y(y,f(p))<\eta$, $y\in f(E)$. Continuity of $f$ at $p$, applied with $\eta$ in place of $\eps$, gives $\delta>0$ with $d_Y(f(x),f(p))<\eta$ whenever $d_X(x,p)<\delta$. This $\delta$ works for $h$.`,
      caption: String.raw`Drag $p$ and change $\eps$. The $\eps$-band (blue) on $g$ produces the window $\eta$ (purple); the $\eta$-band on $f$ produces $\delta$ (orange); on the right, the $\delta$-window indeed lands $h$ inside the $\eps$-band (the green dashed lines show the largest $\delta$ that works for $h$ directly). Toggle the jump to break continuity of $g$ at $f(p)$: the chain fails — though $h$ may still be continuous at $p$; try $p$ at a peak of $f$.`,
      deps: ['pma-4.5'],
      see: ['rca-1.7'],
      tags: ['continuity', 'composition'],
      viz(v) {
        const f = (x) => 0.95 + 0.75 * Math.sin(1.25 * x);
        const g0 = (y) => 0.4 + 1.05 * Math.sin(2.3 * y - 0.9);
        const eps = v.slider('$\\varepsilon$', 0.05, 1, 0.35, { step: 0.01 });
        const jump = v.toggle('$g$ jumps at $f(p)$', false);
        const X = [-2.3, 2.8], Yv = [-0.05, 1.95], Yf = [0.2, 1.7], Zr = [-1, 2.25];
        const o = { height: 290, minWidth: 230 };
        const SF = v.stage({ x: X, y: Yv, ...o, title: '$f: X\\to Y$', xlabel: 'x' });
        const SG = v.stage({ x: Yv, y: Zr, ...o, title: '$g: Y\\to Z$', xlabel: 'y' });
        const SH = v.stage({ x: X, y: Zr, ...o, title: '$h=g\\circ f: X\\to Z$', xlabel: 'x' });
        const P = SF.handle(0.3, f(0.3), { color: 'accent', label: 'p', constrain: (x) => [x, f(x)] });
        let state = null;
        v.legend([['accent', '$\\varepsilon$-band', { area: true }], ['purple', '$\\eta$-window / band', { area: true }], ['orange', '$\\delta$-window', { area: true }]]);
        v.render(() => {
          const p = P.x, y0 = f(p), z0 = g0(y0), e = eps.value, J = jump.value;
          const G = (y) => g0(y) + (J && y > y0 ? 0.6 : 0);
          const H = (x) => G(f(x));
          const eta = admissible(G, y0, z0, e, Yf[0], Yf[1]).d;
          const del = eta > 0 ? admissible(f, p, y0, eta, X[0], X[1]).d : 0;
          const dh = admissible(H, p, z0, e, X[0], X[1]).d;
          // f panel
          if (eta > 0) SF.hband(y0 - eta, y0 + eta, { color: 'purple', alpha: 0.12, edges: true });
          if (del > 0) SF.vband(p - del, p + del, { color: 'orange', alpha: 0.13, edges: true });
          SF.fn(f, { color: 'ink', width: 2.2 });
          if (del > 0) SF.fn(f, { domain: [p - del, p + del], color: 'accent', width: 3.4 });
          if (eta > 0) SF.tex('\\eta', SF.bounds.x[1], y0 + eta, { align: 'right', baseline: 'bottom', color: 'purple', dx: -5, dy: -2 });
          if (del > 0) SF.tex('\\delta', p + del, SF.bounds.y[1], { align: 'left', baseline: 'top', color: 'orange', dx: 4, dy: 5 });
          // g panel
          SG.hband(z0 - e, z0 + e, { color: 'accent', alpha: 0.1, edges: true });
          if (eta > 0) SG.vband(y0 - eta, y0 + eta, { color: 'purple', alpha: 0.12, edges: true });
          pieces(SG, G, Yf[0], Yf[1], J ? [y0] : [], { color: 'ink', width: 2.2 });
          if (eta > 0) pieces(SG, G, Math.max(Yf[0], y0 - eta), Math.min(Yf[1], y0 + eta), [], { color: 'accent', width: 3.4 });
          if (J) SG.dot(y0, z0 + 0.6, { hollow: true, r: 4, color: 'ink' });
          SG.dot(y0, z0, { color: 'accent', r: 4.5 });
          SG.tex('f(p)', y0, SG.bounds.y[0], { color: 'accent', baseline: 'bottom', dy: -4, size: 13 });
          SG.tex('\\varepsilon', SG.bounds.x[1], z0 + e, { align: 'right', baseline: 'bottom', color: 'accent', dx: -5, dy: -2 });
          if (eta > 0) SG.tex('\\eta', y0 + eta, SG.bounds.y[1], { align: 'left', baseline: 'top', color: 'purple', dx: 4, dy: 5 });
          // h panel
          SH.hband(z0 - e, z0 + e, { color: 'accent', alpha: 0.1, edges: true });
          if (del > 0) SH.vband(p - del, p + del, { color: 'orange', alpha: 0.13, edges: true });
          if (dh > 0) { SH.vline(p - dh, { color: 'green', dash: [2, 3], width: 1.2 }); SH.vline(p + dh, { color: 'green', dash: [2, 3], width: 1.2 }); }
          const brk = [];
          if (J) { const xs = v.M.linspace(X[0], X[1], 600); for (let i = 1; i < xs.length; i++) if ((f(xs[i - 1]) - y0) * (f(xs[i]) - y0) <= 0) brk.push(v.M.bisect((x) => f(x) - y0, xs[i - 1], xs[i])); }
          pieces(SH, H, X[0], X[1], brk, { color: 'ink', width: 2.2 });
          if (del > 0) pieces(SH, H, p - del, p + del, brk, { color: 'accent', width: 3.4 });
          SH.dot(p, z0, { color: 'accent', r: 4.5 });
          SH.tex('\\varepsilon', SH.bounds.x[1], z0 + e, { align: 'right', baseline: 'bottom', color: 'accent', dx: -5, dy: -2 });
          state = { e, eta, del, dh, J };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.eta === 0) return `$g$ jumps by $0.6$ at $f(p)$, so for $\\varepsilon = ${v.fix(s.e, 2)}$ no $\\eta$ exists and the theorem is silent. Directly, the largest $\\delta$ for $h$ is $${v.fmt(s.dh, 3)}$` + (s.dh > 0 ? ' — $h$ happens to be continuous here.' : ' — $h$ is discontinuous at $p$.');
          return `$\\varepsilon = ${v.fix(s.e, 2)}\\;\\to\\;\\eta = ${v.fmt(s.eta, 3)}$ (continuity of $g$ at $f(p)$) $\\;\\to\\;\\delta = ${v.fmt(s.del, 3)}$ (continuity of $f$ at $p$). The largest $\\delta$ that works for $h$ directly is $${v.fmt(s.dh, 3)} \\ge \\delta$.`;
        });
      },
    },
  ],
};
