// Rudin, Real and Complex Analysis — Chapter 16 (part 2): one-parameter families and the monodromy theorem

// ---------------------------------------------------------------- helpers shared by this file
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const csqrt = (a) => { const r = Math.sqrt(Math.hypot(a[0], a[1])), t = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; };
const wrapPi = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
// quadratic Bézier from a to b with control point c, and the one passing through m at s = 1/2
const bezC = (a, c, b) => (s) => [(1 - s) * (1 - s) * a[0] + 2 * s * (1 - s) * c[0] + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * s * (1 - s) * c[1] + s * s * b[1]];
const bez = (a, m, b) => bezC(a, [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2], b);
const lerp2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
// parameters (s,t) where the straight-line family (1−t)G0(s) + t G1(s) passes through p
function familyHits(G0, G1, p, N = 800) {
  const out = []; let prev = null;
  for (let k = 0; k <= N; k++) {
    const s = k / N, a = G0(s), b = G1(s);
    const cr = (a[0] - p[0]) * (b[1] - p[1]) - (a[1] - p[1]) * (b[0] - p[0]);
    if (prev && Math.sign(cr) !== Math.sign(prev.cr)) {
      const ss = prev.s + (s - prev.s) * prev.cr / (prev.cr - cr);
      const A = G0(ss), B = G1(ss), dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy;
      if (L2 > 1e-6) {
        const t = ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / L2;
        const q = [A[0] + t * dx - p[0], A[1] + t * dy - p[1]];
        if (t >= -1e-9 && t <= 1 + 1e-9 && Math.hypot(q[0], q[1]) < 0.02) out.push([ss, Math.min(1, Math.max(0, t))]);
      }
    }
    prev = { s, cr };
  }
  return out;
}
// Continue √(z − p) along a sampled curve from a starting value: returns the values at every sample, or null if the curve meets p.
function contSqrt(pts, p, w0) {
  const out = [w0]; let w = w0;
  for (let k = 1; k < pts.length; k++) {
    const a = [pts[k - 1][0] - p[0], pts[k - 1][1] - p[1]], b = [pts[k][0] - p[0], pts[k][1] - p[1]];
    if (Math.hypot(b[0], b[1]) < 1e-4) return null;
    w = cmul(w, csqrt(cdiv(b, a))); out.push(w);
  }
  return out;
}
// continuous argument of z along a sampled curve, starting from the principal value at the first point
function contArg(pts, c = [0, 0], start = null) {
  let th = start ?? Math.atan2(pts[0][1] - c[1], pts[0][0] - c[0]); const out = [th];
  for (let k = 1; k < pts.length; k++) {
    const a = Math.atan2(pts[k - 1][1] - c[1], pts[k - 1][0] - c[0]), b = Math.atan2(pts[k][1] - c[1], pts[k][0] - c[0]);
    th += wrapPi(b - a); out.push(th);
  }
  return out;
}
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)} ${z[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(z[1]), d)}\\,i`;

export default {
  collection: 'rca',
  chapter: 16,
  items: [
    // ------------------------------------------------------------------ 16.12
    {
      num: '16.12',
      kind: 'Definition',
      name: 'One-parameter family of curves',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Definition 16.12, p. 325'],
      statement: String.raw`Let $\alpha,\beta$ be points of a topological space $X$, and let $\varphi:I^2\to X$ ($I=[0,1]$) be continuous with
$$\varphi(0,t)=\alpha,\qquad \varphi(1,t)=\beta\qquad(t\in I).$$
The curves $\gamma_t(s)=\varphi(s,t)$ ($0\le s\le1$) then form a **one-parameter family** $\{\gamma_t\}$ ($0\le t\le1$) **of curves from $\alpha$ to $\beta$ in $X$**: a deformation of $\gamma_0$ into $\gamma_1$ through curves in $X$ that keeps both end points fixed.`,
      idea: String.raw`This is a homotopy with fixed end points, the open-curve analogue of the homotopy of closed curves in 10.38. Every horizontal segment $t=\text{const}$ of the square becomes a curve from $\alpha$ to $\beta$. The two vertical sides collapse to the points $\alpha$ and $\beta$. Everything must stay in $X$: when $X$ is the plane with a singular point removed, the family may never sweep across that point.`,
      caption: String.raw`Left: the parameter square. Right: its image under $\varphi(s,t)=(1-t)\Gamma_0(s)+t\,\Gamma_1(s)$, the straight-line family between the blue curve $\Gamma_0$ and the teal curve $\Gamma_1$ (drag their midpoints and the end points). Drag the gold point $(s,t)$ in the square. Its row is the gold curve $\gamma_t$, its column is traced in orange, and the left and right edges of the square are crushed to $\alpha$ and $\beta$. Now drag the puncture $p$ into the swept region. Some $\gamma_t$ then passes through $p$, its preimage appears in red in the square, and the curves are no longer a family in $X=\C\setminus\{p\}$.`,
      deps: ['rca-10.38'],
      tags: ['homotopy', 'curves'],
      viz(v) {
        const M = v.M;
        const Sq = v.stage({ x: [-0.12, 1.12], y: [-0.12, 1.12], equal: true, height: 360, axes: false, weight: 0.8, minWidth: 240, title: 'parameter square $I^2$' });
        const X = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, height: 360, ticks: false, weight: 1.2, title: '$X=\\C\\setminus\\{p\\}$ and the curves $\\gamma_t=\\varphi(\\cdot,t)$' });
        const st0 = Sq.handle(0.42, 0.62, { color: 'gold', constrain: { x: [0, 1], y: [0, 1] } });
        const A = X.handle(-1.6, -0.3, { color: 'accent', label: 'α', labelPos: 'w' });
        const B = X.handle(1.6, -0.2, { color: 'accent', label: 'β', labelPos: 'e' });
        const C0 = X.handle(0.0, -1.0, { color: 'blue', r: 6 });
        const C1 = X.handle(0.0, 0.95, { color: 'teal', r: 6 });
        const P = X.handle(1.05, 0.95, { color: 'red', r: 6, label: 'p', labelPos: 'ne' });
        let st = null;
        v.legend([['blue', '$\\gamma_0=\\Gamma_0$ (row $t=0$)'], ['teal', '$\\gamma_1=\\Gamma_1$ (row $t=1$)'], ['gold', 'the row $t$ and its curve $\\gamma_t$'], ['orange', 'the column $s$ and its track'], ['red', 'preimage of the puncture $p$']]);
        v.render(() => {
          const a = [A.x, A.y], b = [B.x, B.y], p = [P.x, P.y];
          const G0 = bez(a, [C0.x, C0.y], b), G1 = bez(a, [C1.x, C1.y], b);
          const phi = (s, t) => lerp2(G0(s), G1(s), t);
          const s0 = st0.x, t0 = st0.y;
          const hits = familyHits(G0, G1, p);
          // image side
          for (let k = 1; k < 12; k++) X.curve((s) => phi(s, k / 12), 0, 1, { color: v.mix('blue', 'teal', k / 12), width: 1, alpha: 0.55, n: 120 });
          X.curve(G0, 0, 1, { color: 'blue', width: 3 });
          X.curve(G1, 0, 1, { color: 'teal', width: 3 });
          for (const [, th] of hits) X.curve((s) => phi(s, th), 0, 1, { color: 'red', width: 2.2, dash: [6, 4] });
          X.curve((t) => phi(s0, t), 0, 1, { color: 'orange', width: 2.4 });
          X.curve((s) => phi(s, t0), 0, 1, { color: 'gold', width: 3.2 });
          const q = phi(s0, t0);
          X.dot(q[0], q[1], { color: 'gold', r: 6, label: 'φ(s,t)', labelPos: 'ne' });
          xMark(X, p[0], p[1], hits.length ? 'red' : 'ink', 7);
          const m0 = G0(0.5), m1 = G1(0.5);
          X.tex('\\Gamma_0', m0[0], m0[1], { color: 'blue', dx: 22, dy: 18 });
          X.tex('\\Gamma_1', m1[0], m1[1], { color: 'teal', dx: 22, dy: -18 });
          X.corner(hits.length ? `γ_t meets p for t = ${hits.map(([, th]) => v.fix(th, 2)).join(', ')}: not a family in X` : 'p is never hit: {γ_t} is a family in X', 'tl', { color: hits.length ? 'red' : 'green', weight: 600 });
          // parameter square
          for (let k = 1; k < 10; k++) { Sq.line(k / 10, 0, k / 10, 1, { color: 'grid', width: 1 }); Sq.line(0, k / 10, 1, k / 10, { color: 'grid', width: 1 }); }
          for (let k = 1; k < 12; k++) Sq.line(0, k / 12, 1, k / 12, { color: v.mix('blue', 'teal', k / 12), width: 1, alpha: 0.55 });
          Sq.line(0, 0, 1, 0, { color: 'blue', width: 4 }); Sq.line(0, 1, 1, 1, { color: 'teal', width: 4 });
          Sq.line(0, 0, 0, 1, { color: 'accent', width: 4 }); Sq.line(1, 0, 1, 1, { color: 'accent', width: 4 });
          for (const [, th] of hits) Sq.line(0, th, 1, th, { color: 'red', width: 2, dash: [6, 4] });
          Sq.line(s0, 0, s0, 1, { color: 'orange', width: 2.4 });
          Sq.line(0, t0, 1, t0, { color: 'gold', width: 3 });
          for (const [sh, th] of hits) Sq.dot(sh, th, { color: 'red', r: 6 });
          Sq.tex('\\alpha', -0.06, 0.5, { color: 'accent' }); Sq.tex('\\beta', 1.06, 0.5, { color: 'accent' });
          Sq.tex('t=0', 0.5, -0.06, { color: 'blue', size: 13 }); Sq.tex('t=1', 0.5, 1.06, { color: 'teal', size: 13 });
          Sq.text('s →', 0.86, -0.06, { color: 'muted', size: 12 });
          st = { s0, t0, q, hits };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$(s,t) = (${v.fix(s.s0, 2)}, ${v.fix(s.t0, 2)})\\mapsto \\varphi(s,t) = ${fmtC(v, s.q, 2)}$. ` + (s.hits.length ? `The curve $\\gamma_{${v.fix(s.hits[0][1], 2)}}$ passes through $p$, so $\\varphi(I^2)\\not\\subset X$.` : 'Every $\\gamma_t$ runs from $\\alpha$ to $\\beta$ inside $X$.');
        });
      },
    },
    // ------------------------------------------------------------------ 16.13
    {
      num: '16.13',
      kind: 'Theorem',
      name: 'Continuation along a one-parameter family',
      statement: String.raw`Suppose $\{\gamma_t\}$ is a one-parameter family of curves from $\alpha$ to $\beta$ in the plane, $D$ is a disc centred at $\alpha$, and the function element $(f,D)$ admits an analytic continuation along every $\gamma_t$, to an element $(g_t,D_t)$. Then $g_1=g_0$: the terminal elements obtained along $\gamma_0$ and along $\gamma_1$ agree on $D_0\cap D_1$.`,
      idea: String.raw`Fix $t$ and a chain of discs covering $\gamma_t$. Since $\varphi$ is uniformly continuous on the compact square and the discs are open, the same chain still covers $\gamma_u$ for every $u$ close to $t$. By uniqueness of continuation along that chain (16.11), $(g_u,D_u)\sim(g_t,D_t)$. So $t\mapsto g_t$ is locally constant on $[0,1]$, and the connected interval $[0,1]$ makes it constant.`,
      caption: String.raw`The family $\gamma_t$ runs from the blue curve to the teal one (drag the midpoints of the two outer curves, $\alpha$, $\beta$, the singular point $p$, and the slider $t$). The element $\sqrt{z-p}$ at $\alpha$ is continued along the gold curve $\gamma_t$, and the discs show a chain that does it. Right: the values $\sqrt{\gamma_t(s)-p}$ along the way, ending at $g_t(\beta)$, one of the two square roots of $\beta-p$. The strip at the bottom colours each $t$ by which root it reaches. While the family avoids $p$, every $t$ gives the same answer. Drag $p$ into the swept region: at the $t$ where $\gamma_t$ hits $p$ the hypothesis fails, and the answer flips.`,
      deps: ['rca-16.12', 'rca-16.11', 'rca-16.9'],
      tags: ['analytic continuation', 'homotopy'],
      viz(v) {
        const M = v.M;
        const tS = v.slider('$t$', 0, 1, 0.35, { step: 0.005 });
        const X = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, height: 360, ticks: false, weight: 1.25, title: 'the family $\\gamma_t$ and a chain along the current curve' });
        const W = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 360, ticks: false, weight: 1, title: 'values $\\sqrt{\\gamma_t(s)-p}$ along $\\gamma_t$' });
        const L = v.stage({ x: [0, 1], y: [0, 1], height: 82, full: true, axes: 'box', xlabel: 't', yticks: [], title: 'which root of $\\beta-p$ is reached, as a function of $t$' });
        const A = X.handle(-1.6, -0.3, { color: 'accent', label: 'α', labelPos: 'w' });
        const B = X.handle(1.6, -0.2, { color: 'accent', label: 'β', labelPos: 'e' });
        const C0 = X.handle(0.0, -1.0, { color: 'blue', r: 6 });
        const C1 = X.handle(0.0, 0.95, { color: 'teal', r: 6 });
        const P = X.handle(0.2, 1.25, { color: 'red', r: 6, label: 'p', labelPos: 'ne' });
        const NS = 240;
        let st = null;
        v.render(() => {
          const a = [A.x, A.y], b = [B.x, B.y], p = [P.x, P.y];
          const G0 = bez(a, [C0.x, C0.y], b), G1 = bez(a, [C1.x, C1.y], b);
          const curveAt = (t) => { const out = []; for (let k = 0; k <= NS; k++) out.push(lerp2(G0(k / NS), G1(k / NS), t)); return out; };
          const w0 = csqrt([a[0] - p[0], a[1] - p[1]]);
          const root = csqrt([b[0] - p[0], b[1] - p[1]]);
          const hits = familyHits(G0, G1, p);
          // end values for many t
          const NT = 160, sgn = [];
          for (let k = 0; k <= NT; k++) { const vals = contSqrt(curveAt(k / NT), p, w0); sgn.push(vals ? Math.sign(vals[NS][0] * root[0] + vals[NS][1] * root[1]) : 0); }
          const t = tS.value, cur = curveAt(t), vals = contSqrt(cur, p, w0);
          // left: the family, the current curve, a chain of discs around it
          for (let k = 0; k <= 10; k++) X.path(curveAt(k / 10), { color: v.mix('blue', 'teal', k / 10), width: k % 10 ? 1 : 2.6, alpha: k % 10 ? 0.5 : 1 });
          for (const [, th] of hits) X.path(curveAt(th), { color: 'red', width: 2, dash: [6, 4] });
          if (vals) {
            let i = 0; const discs = [];
            while (true) { const c = cur[i], r = Math.min(0.5, 0.7 * Math.hypot(c[0] - p[0], c[1] - p[1])); discs.push([c, r]); if (i === NS) break; let j = i; while (j < NS && Math.hypot(cur[j + 1][0] - c[0], cur[j + 1][1] - c[1]) < 0.8 * r) j++; if (j === i) break; i = j; }
            for (const [c, r] of discs) X.circle(c[0], c[1], r, { color: 'gold', width: 1, fill: 'gold', fillAlpha: 0.07 });
          }
          X.path(cur, { color: 'panel', width: 6 }); X.path(cur, { color: vals ? 'gold' : 'red', width: 3 });
          xMark(X, p[0], p[1], 'red', 7);
          X.corner(hits.length ? `γ_t meets p at t = ${hits.map(([, th]) => v.fix(th, 2)).join(', ')}` : 'the family avoids p', 'tl', { color: hits.length ? 'red' : 'green', weight: 600 });
          // right: the w-plane
          const R = Math.max(1.3, Math.hypot(root[0], root[1]) * 1.5, ...(vals || []).map((q) => Math.hypot(q[0], q[1]) * 1.15));
          W.setView([-R, R], [-R, R]);
          if (vals) W.path(vals, { color: 'gold', width: 2.6 });
          W.dot(w0[0], w0[1], { color: 'accent', r: 5, label: 'f(α)', labelPos: 'w' });
          W.dot(root[0], root[1], { color: 'green', r: 8, hollow: true, width: 2.4, label: '+√(β−p)', labelPos: 'ne' });
          W.dot(-root[0], -root[1], { color: 'red', r: 8, hollow: true, width: 2.4, label: '−√(β−p)', labelPos: 'sw' });
          if (vals) { const e = vals[NS]; W.dot(e[0], e[1], { color: 'gold', r: 5.5 }); }
          // bottom strip: + / − for each t
          const base = sgn[0];
          for (let k = 0; k < NT; k++) { const s = sgn[k]; L.rect(k / NT, 0.2, (k + 1) / NT, 0.8, { fill: s === 0 ? 'faint' : s === base ? 'green' : 'red', fillAlpha: 0.75, stroke: false }); }
          for (const [, th] of hits) L.vline(th, { color: 'red', width: 2 });
          L.vline(t, { color: 'gold', width: 3 });
          L.text('same root as γ₀', 0.01, 0.5, { size: 11, color: 'panel', halo: false });
          st = { vals, root, hits, end: vals ? vals[NS] : null, flips: sgn.some((s) => s && s !== base) };
          v.legend([['gold', 'current $\\gamma_t$, its chain, and $\\sqrt{\\gamma_t(s)-p}$'], ['green', '$g_t(\\beta)=g_0(\\beta)$', { area: true }], ['red', 'other root / curve through $p$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.vals) return 'The current curve passes through $p$: there is no continuation along it.';
          const same = s.end[0] * s.root[0] + s.end[1] * s.root[1] > 0;
          return `$g_t(\\beta) = ${fmtC(v, s.end)}$ $= ${same ? '+' : '-'}\\sqrt{\\beta-p}$. ` + (s.hits.length ? 'Some $\\gamma_t$ passes through $p$, so the hypothesis fails — and indeed $g_t$ is not constant in $t$.' : 'The family avoids $p$, every $\\gamma_t$ allows continuation, and $g_t(\\beta)$ is the same for all $t$.');
        });
      },
    },
    // ------------------------------------------------------------------ 16.14
    {
      num: '16.14',
      kind: 'Lemma',
      name: 'Curves in a simply connected space are joined by a family',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 16.14 and complete proof, p. 326'],
      statement: String.raw`Let $\Gamma_0$ and $\Gamma_1$ be curves in a topological space $X$ with the same initial point $\alpha$ and the same end point $\beta$. If $X$ is simply connected, there is a one-parameter family $\{\gamma_t\}$ of curves from $\alpha$ to $\beta$ in $X$ with $\gamma_0=\Gamma_0$ and $\gamma_1=\Gamma_1$.`,
      idea: String.raw`Run $\Gamma_0$ and then $\Gamma_1$ backwards. This closed curve is null-homotopic because $X$ is simply connected. A contraction of a loop can be reparametrised over the square so that the two vertical sides stay at $\alpha$ and $\beta$. For a plane region one can be concrete: a simply connected region is homeomorphic to a convex one (13.11, 14.8), and there the straight-line family $(1-t)\Gamma_0+t\Gamma_1$ works and can be carried back. In a region with a hole the loop can wind around it, and the winding number, a homotopy invariant (10.40), forbids any family.`,
      caption: String.raw`Drag $\alpha$, $\beta$ and the midpoints of $\Gamma_0$ (blue) and $\Gamma_1$ (teal); the slider moves through the family. In the **disc** (convex) the straight-line family works. In the **horseshoe** (simply connected, not convex) a straight-line family need not stay inside, but interpolating in polar coordinates, which is a homeomorphism onto a rectangle, always does. In the **annulus** the same polar family works only if the two curves pass the hole on the same side. Otherwise its end point drifts around the hole (red), and in fact no family exists, because $\Gamma_0$ followed by $\Gamma_1$ backwards winds around the hole.`,
      deps: ['rca-16.12', 'rca-10.38', 'rca-10.40', 'rca-13.11', 'rca-14.8'],
      tags: ['homotopy', 'simply connected'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        const RIN = 0.55, ROUT = 1.6, GAP = 0.78 * PI;
        const REG = {
          disc: { label: 'disc (convex)', inside: (x, y) => Math.hypot(x, y) < ROUT },
          horse: { label: 'horseshoe (simply connected)', inside: (x, y) => { const r = Math.hypot(x, y); return r > RIN && r < ROUT && Math.abs(Math.atan2(y, x)) < GAP; } },
          ann: { label: 'annulus (not simply connected)', inside: (x, y) => { const r = Math.hypot(x, y); return r > RIN && r < ROUT; } },
        };
        const reg = v.select('$X=$', Object.entries(REG).map(([value, o]) => ({ value, label: o.label })), 'horse');
        const tS = v.slider('$t$', 0, 1, 0.5, { step: 0.01 });
        const S = v.stage({ x: [-2, 2], y: [-1.75, 1.75], equal: true, height: 420, ticks: false });
        const clampTo = (x, y) => {
          const R = REG[reg.value]; if (R.inside(x, y)) return [x, y];
          let r = Math.hypot(x, y), th = Math.atan2(y, x);
          if (reg.value !== 'disc') r = Math.max(RIN + 0.04, r);
          r = Math.min(ROUT - 0.04, r);
          if (reg.value === 'horse') th = Math.max(-GAP + 0.04, Math.min(GAP - 0.04, th));
          return [r * Math.cos(th), r * Math.sin(th)];
        };
        const pol = (r, deg) => [r * Math.cos(deg * PI / 180), r * Math.sin(deg * PI / 180)];
        const PRE = {
          disc: [[-1.0, -0.75], [-0.9, 0.8], [1.15, -0.55], [0.35, 1.05]],
          horse: [pol(1.05, -118), pol(1.05, 118), pol(1.45, -5), pol(0.72, 10)],
          ann: [pol(1.05, -118), pol(1.05, 118), pol(1.35, -5), pol(1.2, 178)],
        };
        const [A, B, M0, M1] = PRE.horse.map((q, k) => S.handle(q[0], q[1], [
          { color: 'accent', label: 'α', labelPos: 'sw', constrain: clampTo }, { color: 'accent', label: 'β', labelPos: 'nw', constrain: clampTo },
          { color: 'blue', r: 6, constrain: clampTo }, { color: 'teal', r: 6, constrain: clampTo }][k]));
        let st = null, lastReg = 'horse';
        v.legend([['blue', '$\\Gamma_0$'], ['teal', '$\\Gamma_1$'], ['gold', '$\\gamma_t$'], ['red', 'where the attempted family fails']]);
        v.render(() => {
          const key = reg.value, R = REG[key], BG = v.rgb('panel');
          if (key !== lastReg) { lastReg = key; [A, B, M0, M1].forEach((h, k) => { h.x = PRE[key][k][0]; h.y = PRE[key][k][1]; }); }
          for (const h of [A, B, M0, M1]) { const q = clampTo(h.x, h.y); h.x = q[0]; h.y = q[1]; }
          const Gc = v.rgb('accent');
          S.raster((x, y) => (R.inside(x, y) ? [BG[0] + (Gc[0] - BG[0]) * 0.13, BG[1] + (Gc[1] - BG[1]) * 0.13, BG[2] + (Gc[2] - BG[2]) * 0.13] : null), { key, res: 2 });
          if (key === 'disc') S.circle(0, 0, ROUT, { color: 'accent', width: 1.4 });
          else if (key === 'ann') { S.circle(0, 0, ROUT, { color: 'accent', width: 1.4 }); S.circle(0, 0, RIN, { color: 'accent', width: 1.4 }); }
          else { const out = []; for (let k = 0; k <= 120; k++) { const th = -GAP + 2 * GAP * k / 120; out.push([ROUT * Math.cos(th), ROUT * Math.sin(th)]); } for (let k = 120; k >= 0; k--) { const th = -GAP + 2 * GAP * k / 120; out.push([RIN * Math.cos(th), RIN * Math.sin(th)]); } S.poly(out, { color: 'accent', width: 1.4 }); }
          const a = [A.x, A.y], b = [B.x, B.y], m0 = [M0.x, M0.y], m1 = [M1.x, M1.y];
          const N = 200;
          let G0, G1, fam, wind = 0, drift = false;
          if (key === 'disc') {
            const poly = (m) => (s) => (s < 0.5 ? lerp2(a, m, 2 * s) : lerp2(m, b, 2 * s - 1));
            G0 = poly(m0); G1 = poly(m1);
            fam = (s, t) => lerp2(G0(s), G1(s), t);
          } else {
            const pol = (q) => [Math.hypot(q[0], q[1]), Math.atan2(q[1], q[0])];
            const pa = pol(a), pb = pol(b);
            const lift = (m) => { const pm = pol(m); if (key === 'horse') return [pa, pm, pb]; const t1 = pa[1] + wrapPi(pm[1] - pa[1]); const t2 = t1 + wrapPi(pb[1] - pm[1]); return [pa, [pm[0], t1], [pb[0], t2]]; };
            const L0 = lift(m0), L1 = lift(m1);
            const polar = (Lp) => (s) => (s < 0.5 ? lerp2(Lp[0], Lp[1], 2 * s) : lerp2(Lp[1], Lp[2], 2 * s - 1));
            const P0 = polar(L0), P1 = polar(L1);
            const toXY = (q) => [q[0] * Math.cos(q[1]), q[0] * Math.sin(q[1])];
            G0 = (s) => toXY(P0(s)); G1 = (s) => toXY(P1(s));
            fam = (s, t) => toXY(lerp2(P0(s), P1(s), t));
            wind = Math.round((L0[2][1] - L1[2][1]) / (2 * PI));
            drift = wind !== 0;
          }
          // the family: faint curves, and the current one
          const t = tS.value;
          const bad = (s, tt) => { const q = fam(s, tt); return !R.inside(q[0], q[1]); };
          for (let k = 1; k < 10; k++) S.curve((s) => fam(s, k / 10), 0, 1, { color: v.mix('blue', 'teal', k / 10), width: 1, alpha: 0.5, n: N });
          let leaves = false;
          for (let k = 0; k <= 20 && !leaves; k++) for (let j = 0; j <= 60; j++) if (bad(j / 60, k / 20)) { leaves = true; break; }
          S.curve(G0, 0, 1, { color: 'blue', width: 3, n: N }); S.curve(G1, 0, 1, { color: 'teal', width: 3, n: N });
          const cur = []; for (let j = 0; j <= N; j++) cur.push(fam(j / N, t));
          S.path(cur, { color: 'panel', width: 6 });
          S.path(cur, { color: 'gold', width: 3.2 });
          for (let j = 0; j < N; j++) if (bad(j / N, t) || bad((j + 1) / N, t)) S.line(cur[j][0], cur[j][1], cur[j + 1][0], cur[j + 1][1], { color: 'red', width: 3.6 });
          if (drift) {
            const ends = []; for (let k = 0; k <= 60; k++) ends.push(fam(1, k / 60));
            S.path(ends, { color: 'red', width: 2.4, dash: [5, 4] });
            const e = fam(1, t); S.dot(e[0], e[1], { color: 'red', r: 6, label: 'γ_t(1) ≠ β', labelPos: 'ne' });
          }
          const g0m = G0(0.5), g1m = G1(0.5);
          S.tex('\\Gamma_0', g0m[0], g0m[1], { color: 'blue', dx: 16, dy: 12 }); S.tex('\\Gamma_1', g1m[0], g1m[1], { color: 'teal', dx: -16, dy: -12 });
          if (key !== 'disc') xMark(S, 0, 0, 'muted', 5);
          let msg, col;
          if (drift) { msg = `Γ₀ then Γ₁ backwards winds ${Math.abs(wind)}× around the hole: no family exists`; col = 'red'; }
          else if (leaves) { msg = 'this family leaves X'; col = 'red'; }
          else { msg = key === 'disc' ? 'straight-line family stays in the convex disc' : 'polar family: a valid one-parameter family in X'; col = 'green'; }
          S.corner(msg, 'tl', { color: col, weight: 600 });
          st = { key, wind, drift, leaves };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.key === 'disc') return 'A convex region: $\\gamma_t=(1-t)\\Gamma_0+t\\Gamma_1$ never leaves it, whatever the curves.';
          if (s.key === 'horse') return 'The horseshoe is simply connected but not convex. The polar-coordinate homeomorphism onto a rectangle turns straight-line interpolation of $(r,\\theta)$ into a family inside $X$.';
          return s.drift ? `In the annulus, $\\Gamma_0$ followed by $\\Gamma_1$ backwards has winding number $${s.wind}$ about the hole. Winding numbers are invariant under homotopy (10.40), so these curves are **not** joined by any one-parameter family in $X$.` : 'Both curves pass the hole on the same side (winding number $0$), and the polar family joins them inside the annulus.';
        });
      },
    },
    // ------------------------------------------------------------------ 16.15
    {
      num: '16.15',
      kind: 'Theorem',
      name: 'The monodromy theorem',
      statement: String.raw`Suppose $\Omega$ is a simply connected region, $(f,D)$ is a function element with $D\subset\Omega$, and $(f,D)$ can be analytically continued along every curve in $\Omega$ that starts at the centre of $D$. Then there exists $g\in H(\Omega)$ with $g(z)=f(z)$ for all $z\in D$.`,
      idea: String.raw`For $\beta\in\Omega$ pick any curve $\Gamma$ in $\Omega$ from the centre $\alpha$ of $D$ to $\beta$, and let $g(\beta)$ be the value at $\beta$ of the continuation along $\Gamma$. Another such curve is joined to $\Gamma$ by a one-parameter family in $\Omega$ (16.14), and 16.13 shows that the terminal element does not change, so $g$ is well defined. Near $\beta$, $g$ agrees with that terminal element, hence $g$ is holomorphic.`,
      caption: String.raw`Left: a region $\Omega$ and a closed curve in it from $\alpha$ (drag the three corner points). The element is a branch of $\log z$ at $\alpha$. Right: its continuation drawn as a lift onto the Riemann surface of $\log$ (height $=\Im f$; drag to rotate). In the simply connected regions, the slit plane and a disc avoiding $0$, there is a single sheet: every closed curve lifts to a closed curve, and the colours on the left are the global branch $g$. In the annulus every curve still allows continuation, but a loop around $0$ climbs to the next sheet and returns with $f+2\pi i$. The hypothesis "simply connected" cannot be dropped. Segments that leave $\Omega$ are drawn in red.`,
      deps: ['rca-16.13', 'rca-16.14', 'rca-16.11'],
      tags: ['monodromy', 'simply connected', 'analytic continuation'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        const DC = [0.95, 0.35], DR = 0.82;
        const REG = {
          slit: { label: '$\\C\\setminus(-\\infty,0]$', inside: (x, y) => !(y === 0 && x <= 0) && Math.hypot(x, y) > 0.08 && !(Math.abs(y) < 0.03 && x < 0), sc: true },
          disc: { label: 'disc avoiding $0$', inside: (x, y) => Math.hypot(x - DC[0], y - DC[1]) < DR, sc: true },
          ann: { label: 'annulus around $0$', inside: (x, y) => { const r = Math.hypot(x, y); return r > 0.45 && r < 1.65; }, sc: false },
        };
        const reg = v.select('$\\Omega=$', Object.entries(REG).map(([value, o]) => ({ value, label: o.label })), 'ann');
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.75, 1.75], equal: true, height: 380, ticks: false, title: '$\\Omega$, the loop, and (if it exists) the global branch $g$' });
        const S3 = v.stage3d({ height: 380, range: 2.1, yaw: -0.55, pitch: 0.42, title: 'lift to the Riemann surface of $\\log$ (height $\\propto\\Im f$)', labels: null, axes: false });
        const HZ = 0.2;
        const A = S.handle(1.2, -0.15, { color: 'accent', label: 'α', labelPos: 'e' });
        const H = [[0.55, 1.15], [-1.15, 0.2], [0.05, -1.15]].map((p) => S.handle(p[0], p[1], { color: 'gold', r: 6 }));
        let st = null, lastReg = 'ann';
        const presets = { ann: [[1.2, -0.15], [0.55, 1.15], [-1.15, 0.2], [0.05, -1.15]], slit: [[1.2, -0.15], [0.35, 1.25], [-1.25, 0.45], [-0.25, 0.25]], disc: [[1.25, 0.2], [1.05, 0.95], [0.4, 0.45], [1.25, -0.3]] };
        v.legend([['gold', 'the loop and its lift'], ['red', 'parts outside $\\Omega$ / lift does not close'], ['green', 'lift closes: $f$ returns to itself']]);
        v.render(() => {
          const key = reg.value, R = REG[key], BG = v.rgb('panel');
          if (key !== lastReg) { lastReg = key; const P = presets[key]; A.x = P[0][0]; A.y = P[0][1]; H.forEach((h, k) => { h.x = P[k + 1][0]; h.y = P[k + 1][1]; }); }
          // Ω, coloured by the global branch Im g when Ω is simply connected
          S.raster((x, y) => {
            if (!R.inside(x, y)) return null;
            if (!R.sc) { const g = v.rgb('accent'); return [BG[0] + (g[0] - BG[0]) * 0.14, BG[1] + (g[1] - BG[1]) * 0.14, BG[2] + (g[2] - BG[2]) * 0.14]; }
            const c = M.cmap((Math.atan2(y, x) + PI) / (2 * PI) * 0.8 + 0.1, 'viridis'); return [c[0] + (BG[0] - c[0]) * 0.35, c[1] + (BG[1] - c[1]) * 0.35, c[2] + (BG[2] - c[2]) * 0.35];
          }, { key, res: 2 });
          if (key === 'slit') { S.line(-2, 0, 0, 0, { color: 'red', width: 2.4 }); }
          if (key === 'ann') { S.circle(0, 0, 0.45, { color: 'accent', width: 1.3 }); S.circle(0, 0, 1.65, { color: 'accent', width: 1.3 }); }
          if (key === 'disc') S.circle(DC[0], DC[1], DR, { color: 'accent', width: 1.3 });
          xMark(S, 0, 0, 'ink', 5.5);
          // the loop
          const corners = [[A.x, A.y], ...H.map((h) => [h.x, h.y]), [A.x, A.y]];
          const pts = []; for (let k = 0; k < 4; k++) for (let j = 0; j < 60; j++) pts.push(lerp2(corners[k], corners[k + 1], j / 60)); pts.push(corners[4]);
          const passes0 = pts.some((q) => Math.hypot(q[0], q[1]) < 0.02);
          const th = contArg(pts);
          const out = pts.map((q) => !R.inside(q[0], q[1]));
          S.path(pts, { color: 'panel', width: 6 });
          for (let k = 0; k + 1 < pts.length; k++) S.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], { color: out[k] || out[k + 1] ? 'red' : 'gold', width: 3, dash: out[k] || out[k + 1] ? [5, 4] : null });
          for (let k = 0; k < 4; k++) { const m = lerp2(corners[k], corners[k + 1], 0.55), n = lerp2(corners[k], corners[k + 1], 0.6); S.arrow(m[0], m[1], n[0], n[1], { color: 'ink', head: 9 }); }
          const dTh = th[th.length - 1] - th[0], wind = Math.round(dTh / (2 * PI));
          const anyOut = out.some(Boolean);
          S.corner(passes0 ? 'the loop passes through 0' : anyOut ? 'the loop leaves Ω' : wind ? `continuation returns with f + ${wind > 0 ? '' : '−'}${Math.abs(wind) === 1 ? '' : Math.abs(wind)}2πi` : 'continuation returns to f', 'tl', { color: !passes0 && !anyOut && !wind ? 'green' : 'red', weight: 600 });
          // 3D: the relevant part of the Riemann surface and the lifted loop
          const colorOf = (h) => { const c = M.cmap(M.clamp((h / HZ + PI) / (2 * PI) * 0.8 + 0.1, 0, 1), 'viridis'); return [c[0], c[1], c[2]]; };
          if (key !== 'ann') S3.surface((u, w) => [u * Math.cos(w), u * Math.sin(w), HZ * w], [0.3, 1.7], [-PI, 3 * PI], { nu: 4, nv: 120, alpha: 0.1, shade: false, colorFn: () => v.rgb('muted') });
          if (key === 'disc') S3.surface((u, w) => { const x = DC[0] + u * Math.cos(w), y = DC[1] + u * Math.sin(w); return [x, y, HZ * Math.atan2(y, x)]; }, [0.02, DR], [0, 2 * PI], { nu: 8, nv: 48, alpha: 0.72, colorFn: (u, w, q) => colorOf(q[2]) });
          else {
            const lo = key === 'slit' ? -PI + 0.02 : Math.min(-PI, Math.min(...th) - 0.6), hi = key === 'slit' ? PI - 0.02 : Math.max(PI, Math.max(...th) + 0.6);
            const r0 = key === 'slit' ? 0.12 : 0.45, r1 = key === 'slit' ? 1.75 : 1.65;
            S3.surface((u, w) => [u * Math.cos(w), u * Math.sin(w), HZ * w], [r0, r1], [lo, hi], { nu: 7, nv: Math.round((hi - lo) / 0.09), alpha: 0.62, colorFn: (u, w, q) => colorOf(q[2]) });
          }
          const lift = pts.map((q, k) => [q[0], q[1], HZ * th[k]]);
          S3.path(lift, { color: 'gold', width: 3.4, bias: -6 });
          S3.dot(lift[0], { color: 'accent', r: 6, bias: -7, label: 'start' });
          const e = lift[lift.length - 1];
          S3.dot(e, { color: wind ? 'red' : 'green', r: 6, bias: -8, label: wind ? 'end' : '' });
          if (wind) S3.line(lift[0], e, { color: 'red', width: 1.6, dash: [4, 4], bias: -6 });
          st = { key, wind, anyOut, passes0, sc: R.sc, f0: [Math.log(Math.hypot(A.x, A.y)), th[0]], f1: [Math.log(Math.hypot(A.x, A.y)), th[th.length - 1]] };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.passes0) return 'The loop runs through the singular point $0$, so there is no continuation along it.';
          const head = `Start: $f(\\alpha) = ${fmtC(v, s.f0)}$; after the loop: $${fmtC(v, s.f1)}$. `;
          if (s.sc) return head + (s.anyOut ? 'This loop leaves $\\Omega$, so it is not covered by the theorem.' : 'In the simply connected $\\Omega$ every loop returns to the same element, and the global branch $g\\in H(\\Omega)$ exists.');
          return head + (s.wind ? `The annulus is not simply connected: the loop winds ${Math.abs(s.wind)}× around $0$, and no $g\\in H(\\Omega)$ extends $f$.` : 'This loop does not wind around $0$, so it returns — but other loops in the annulus do not.');
        });
      },
    },
  ],
};
