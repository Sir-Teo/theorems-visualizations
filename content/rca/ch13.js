// Rudin, Real and Complex Analysis — Chapter 13: Approximation by Rational Functions

// ---------------------------------------------------------------- helpers shared by this file
// Phase-portrait colour of w = re + i im (same scheme as Stage.domain): hue = arg w, bands = log2|w|.
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// A small "×" marking a singular point, with a halo so it reads on top of a phase portrait.
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
// Stereographic projection of x + iy onto the unit sphere; ∞ goes to the north pole (0,0,1).
const stereo = (x, y) => { const q = x * x + y * y; return [2 * x / (q + 1), 2 * y / (q + 1), (q - 1) / (q + 1)]; };
// Distance from (px,py) to the segment [a,b].
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
// Signed angle subtended at (x,y) by the directed segment a → b (exact winding contribution).
function subtend(x, y, ax, ay, bx, by) {
  const ux = ax - x, uy = ay - y, vx = bx - x, vy = by - y;
  return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
}
// Complex number as TeX, e.g. "0.53 - 1.20\,i".
function cTeX(M, re, im, d = 2) {
  const r = Math.abs(re) < 0.5 * 10 ** -d ? 0 : re, i = Math.abs(im) < 0.5 * 10 ** -d ? 0 : im;
  if (i === 0) return M.fix(r, d).replace('−', '-');
  if (r === 0) return `${M.fix(i, d).replace('−', '-')}\\,i`;
  return `${M.fix(r, d).replace('−', '-')} ${i < 0 ? '-' : '+'} ${M.fix(Math.abs(i), d)}\\,i`;
}
const SUBS = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
const circlePts = (cx, cy, r, n = 160) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n), cy + r * Math.sin(2 * Math.PI * i / n)]);

// TeX scientific notation that rounds the mantissa correctly (9.97e-4 → 1.0×10^{-3}).
const sciT = (x, d = 2) => { if (!isFinite(x)) return '\\infty'; if (x === 0) return '0'; const a = Math.abs(x); if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d))); const [m, e] = x.toExponential(d - 1).split('e'); return `${m}\\times10^{${+e}}`; };

export default {
  book: 'rca',
  chapter: 13,
  title: 'Approximation by Rational Functions',
  summary: String.raw`Which holomorphic functions are uniform limits of rational functions, and where must the poles be put? After adjoining the point $\infty$ to get the Riemann sphere and recalling partial fractions, Rudin builds a cycle that reproduces Cauchy's formula on any compact set, and with Hahn–Banach and the Riesz representation theorem proves Runge's theorem: on a compact $K$, it is enough to have one pole in each component of $S^2\setminus K$, and if that complement is connected, polynomials suffice. An exhaustion of open sets by compact sets carries this over to open sets, which gives the Mittag-Leffler theorem on prescribing principal parts. The chapter ends with nine equivalent descriptions of simply connected plane regions.`,
  items: [
    // ------------------------------------------------------------------ preparation
    {
      num: '13.1',
      kind: 'Definition',
      name: 'The Riemann sphere $S^2$',
      statement: String.raw`The **Riemann sphere** is $S^2=\C\cup\{\infty\}$. Its open sets are the open subsets of $\C$ together with all sets $(\C\setminus K)\cup\{\infty\}$ where $K\subset\C$ is compact; so the sets $\{z:|z|>R\}\cup\{\infty\}$ form a base of neighbourhoods of $\infty$. With this topology $S^2$ is the one-point compactification of $\C$, and stereographic projection is a homeomorphism of $S^2$ onto the unit sphere of $\R^3$ that takes $\infty$ to the north pole.

Behaviour at $\infty$ is defined through $z\mapsto 1/z$: a function $f$ defined in a punctured neighbourhood of $\infty$ has a removable singularity, a zero of order $m$, or a pole of order $m$ at $\infty$ exactly when $f(1/z)$ has that property at $0$. Holomorphic and meromorphic functions in open subsets of $S^2$ are defined accordingly.`,
      idea: String.raw`The map $z\mapsto1/z$ (with $0\leftrightarrow\infty$) is a homeomorphism of $S^2$ onto itself; on the sphere it is the half-turn about the real axis. It transports every local notion from the point $0$ to the point $\infty$. The payoff in this chapter is that for compact $K\subset\C$, the unbounded component of $\C\setminus K$ becomes an ordinary component of $S^2\setminus K$, namely the one containing $\infty$, and "a pole at $\infty$" means a polynomial term.`,
      caption: String.raw`Drag $z$: the ray from the north pole $N=\infty$ through $z$ meets the sphere at its image $P$. Points with $|z|>R$ (orange) fill a polar cap around $N$; increasing $R$ shrinks the cap, so these sets are neighbourhoods of $\infty$. The line through the two purple points becomes a circle through $N$. With $1/z$ switched on, the green point is the image of $1/z$: the sphere has been turned half a turn about the real axis.`,
      deps: ['rca-10.21'],
      see: ['pma-2.41'],
      tags: ['Riemann sphere', 'topology'],
      viz(v) {
        const TAU = 2 * Math.PI;
        const L = v.stage({ x: [-3, 3], y: [-2.25, 2.25], equal: true, height: 350, title: 'the plane $\\C$' });
        const S = v.stage3d({ range: 1.5, height: 350, yaw: -0.62, pitch: 0.36, axes: false, title: '$S^2$ as the unit sphere; $\\infty$ is the north pole' });
        const Rs = v.slider('$R$ for the neighbourhood $\\{|z|>R\\}\\cup\\{\\infty\\}$', 0.4, 4, 1.7, { step: 0.05 });
        const inv = v.toggle('show $1/z$', true);
        const z = L.handle(1.3, 0.75, { color: 'accent', label: 'z', labelPos: 'ne' });
        const A = L.handle(-2.5, -1.3, { color: 'purple', r: 6 });
        const B = L.handle(0.9, -1.85, { color: 'purple', r: 6 });
        const N = [0, 0, 1];
        let st = null;
        v.render(() => {
          const R = Rs.value;
          // ---- plane
          L.rings([[[-60, -60], [60, -60], [60, 60], [-60, 60]], circlePts(0, 0, R, 180)], { evenodd: true, fill: 'orange', fillAlpha: 0.12, stroke: false });
          L.circle(0, 0, R, { color: 'orange', width: 1.6, dash: [5, 4] });
          L.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [2, 3] });
          if (R < 2.1) L.tex('|z|=R', R * Math.cos(2.4), R * Math.sin(2.4), { color: 'orange', size: 13, align: 'right', dx: -6, dy: -8 });
          L.tex('|z|=1', Math.cos(-2.2), Math.sin(-2.2), { color: 'muted', size: 12, align: 'right', dx: -4, dy: 8 });
          const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
          L.line(A.x - ux * 30, A.y - uy * 30, A.x + ux * 30, A.y + uy * 30, { color: 'purple', width: 2 });
          const q = z.x * z.x + z.y * z.y;
          const w = [z.x / q, -z.y / q];
          if (inv.value && Math.hypot(...w) < 3.2) L.dot(w[0], w[1], { color: 'green', r: 5, label: '1/z', labelPos: 'se' });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // ---- sphere (cap and rest drawn separately so they do not fight in the depth sort)
          const thR = Math.acos((R * R - 1) / (R * R + 1));
          const sph = (u, t) => [Math.sin(u) * Math.cos(t), Math.sin(u) * Math.sin(t), Math.cos(u)];
          S.surface(sph, [thR, Math.PI], [0, TAU], { nu: 16, nv: 40, color: 'gray', alpha: 0.16 });
          S.surface(sph, [0, thR], [0, TAU], { nu: 6, nv: 40, color: 'orange', alpha: 0.42 });
          // plane z = 0 (grid), the unit circle = the equator, and |z| = R with its image
          for (let k = -4; k <= 4; k++) {
            S.line([k / 2, -2, 0], [k / 2, 2, 0], { color: 'grid', width: 1 });
            S.line([-2, k / 2, 0], [2, k / 2, 0], { color: 'grid', width: 1 });
          }
          S.curve((t) => [Math.cos(t), Math.sin(t), 0], 0, TAU, { color: 'muted', width: 1.4, n: 120 });
          if (R < 2.8) S.curve((t) => [R * Math.cos(t), R * Math.sin(t), 0], 0, TAU, { color: 'orange', width: 1.4, dash: [4, 3], n: 120 });
          S.curve((t) => [Math.sin(thR) * Math.cos(t), Math.sin(thR) * Math.sin(t), Math.cos(thR)], 0, TAU, { color: 'orange', width: 2.2, n: 120 });
          // the line and its image circle through N
          const foot = [A.x - (A.x * ux + A.y * uy) * ux, A.y - (A.x * ux + A.y * uy) * uy];
          const linePt = (s) => { const t = Math.tan(s); return [foot[0] + t * ux, foot[1] + t * uy]; };
          S.curve((s) => { const [x, y] = linePt(s); return stereo(x, y); }, -Math.PI / 2 + 1e-3, Math.PI / 2 - 1e-3, { color: 'purple', width: 2.4, n: 220 });
          const inBox = []; for (let i = 0; i <= 80; i++) { const p = linePt(-1.4 + 2.8 * i / 80); inBox.push(Math.abs(p[0]) <= 2 && Math.abs(p[1]) <= 2 ? [p[0], p[1], 0] : null); }
          S.path(inBox, { color: 'purple', width: 1.4, alpha: 0.55 });
          // z, its image P, and the projecting ray
          const P = stereo(z.x, z.y), Z0 = [z.x, z.y, 0];
          S.line(N, q >= 1 ? Z0 : P, { color: 'accent', width: 1.6, dash: [5, 4] });
          S.dot(Z0, { color: 'accent', r: 4, label: 'z' });
          S.dot(P, { color: 'accent', r: 6, label: 'P' });
          if (inv.value) {
            S.line([-1.35, 0, 0], [1.35, 0, 0], { color: 'green', width: 1, dash: [3, 4], alpha: 0.7 });
            S.dot([P[0], -P[1], -P[2]], { color: 'green', r: 5.5, label: '1/z' });
          }
          S.dot(N, { color: 'ink', r: 4.5 });
          S.text('N = ∞', [0, 0, 1.17], { color: 'ink', size: 13 });
          S.dot([0, 0, -1], { color: 'ink', r: 3.5 });
          S.text('0', [0.07, 0, -1.13], { color: 'ink', math: true });
          st = { P, R, q, thR, inside: Math.sqrt(q) > R };
          v.legend([['orange', 'neighbourhood $\\{|z|>R\\}\\cup\\{\\infty\\}$', { area: true }], ['purple', 'a line in $\\C$ = a circle through $\\infty$'], ['accent', '$z$ and its image $P$', { dot: true }], ['green', '$1/z$ (half-turn of the sphere)', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const lev = (s.R * s.R - 1) / (s.R * s.R + 1);
          return `$P = (${v.fix(s.P[0], 3)},\\ ${v.fix(s.P[1], 3)},\\ ${v.fix(s.P[2], 3)})$; distance on the sphere to $\\infty$: $|P-N| = 2/\\sqrt{1+|z|^2} = ${v.fix(2 / Math.sqrt(1 + s.q), 3)}$. $\\;|z| = ${v.fix(Math.sqrt(s.q), 3)}$ ${s.inside ? '$>$' : '$\\le$'} $R$ exactly when the height $${v.fix(s.P[2], 3)}$ ${s.inside ? '$>$' : '$\\le$'} $\\frac{R^2-1}{R^2+1} = ${v.fix(lev, 3)}$, the edge of the cap.`;
        });
      },
    },
    {
      num: '13.2',
      kind: 'Definition',
      name: 'Rational functions, principal parts, partial fractions',
      statement: String.raw`A **rational function** is a quotient $f=P/Q$ of polynomials without common zeros, $Q\not\equiv0$. On $S^2$ it is meromorphic: its poles in $\C$ are the zeros of $Q$, and at $\infty$ it has a pole of order $\deg P-\deg Q$ if this is positive (otherwise $f$ is holomorphic at $\infty$).

If $f$ has a pole of order $m$ at $\alpha\in\C$, then near $\alpha$
$$f(z)=\sum_{k=1}^{m}\frac{c_k}{(z-\alpha)^k}+g(z)$$
with $c_m\neq0$ and $g$ holomorphic at $\alpha$; the sum is the **principal part** of $f$ at $\alpha$. The principal part at $\infty$ is the polynomial without constant term obtained in the same way from $f(1/z)$ at $0$.

**Partial fractions.** If $Q_1,\dots,Q_k$ are the principal parts of $f$ at its poles in $\C$ and $Q_\infty$ the one at $\infty$, then $f-Q_\infty-\sum_j Q_j$ is constant. Hence every rational function is a linear combination of $1$, the powers $z^n$ and the powers $(z-\alpha_j)^{-n}$.`,
      idea: String.raw`Subtracting all principal parts removes every pole, including the one at $\infty$. What is left is holomorphic on all of the compact space $S^2$, hence bounded on $\C$, and Liouville's theorem makes it constant. This is why rational functions with poles in a set $A$ are exactly the linear combinations of $z^n$ (if $\infty\in A$) and $(z-\alpha)^{-n}$, $\alpha\in A\cap\C$. Runge's theorem approximates by combinations of exactly these functions.`,
      caption: String.raw`Drag the zeros (black) and the poles $\alpha_1,\alpha_2,\alpha_3$ (red; $\alpha_2$ is a double pole) and choose $\deg P$. Every coefficient $c_{j,k}$ is computed numerically from $f$ by a contour integral around $\alpha_j$. The right panel is $f-Q_1-Q_2-Q_3$, evaluated directly from $f$: all poles in $\C$ have vanished, and what remains is a polynomial of degree $\max(0,\deg P-\deg Q)$, namely the constant plus the principal part at $\infty$.`,
      deps: ['rca-13.1', 'rca-10.21', 'rca-10.23'],
      tags: ['rational functions', 'principal part'],
      viz(v) {
        const { TAU } = v.M;
        const deg = v.select('$\\deg P$', [{ value: 3, label: '$3$ (then $f(\\infty)=0$)' }, { value: 4, label: '$4$' }, { value: 5, label: '$5$ (pole at $\\infty$)' }], 5);
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.65, 1.65], equal: true, height: 330, axes: false, title: 'phase portrait of $f=P/Q$, $\\;Q=(z-\\alpha_1)(z-\\alpha_2)^2(z-\\alpha_3)$' });
        const Rt = v.stage({ x: [-2.2, 2.2], y: [-1.65, 1.65], equal: true, height: 330, axes: false, title: '$f-(Q_1+Q_2+Q_3)$: no poles left in $\\C$' });
        const zh = [[-1.35, -0.95], [0.25, -1.2], [1.45, 0.95], [-0.55, 1.2], [1.6, -0.75]].map(([x, y]) => L.handle(x, y, { color: 'ink', r: 5 }));
        const ORD = [1, 2, 1];
        const ph = [L.handle(-0.95, 0.15, { color: 'red', r: 6.5, label: 'α₁', labelPos: 'nw' }), L.handle(0.6, 0.35, { color: 'red', r: 6.5, label: 'α₂', labelPos: 'ne' }), L.handle(0.2, -0.5, { color: 'red', r: 6.5, label: 'α₃', labelPos: 'se' })];
        // f(x+iy) as [re, im]
        const fXY = (Z, Pp, x, y) => {
          let nr = 1, ni = 0;
          for (const [a, b] of Z) { const ur = x - a, ui = y - b, t = nr * ur - ni * ui; ni = nr * ui + ni * ur; nr = t; }
          let dr = 1, di = 0;
          Pp.forEach(([a, b], j) => { for (let k = 0; k < ORD[j]; k++) { const ur = x - a, ui = y - b, t = dr * ur - di * ui; di = dr * ui + di * ur; dr = t; } });
          const q = dr * dr + di * di; return [(nr * dr + ni * di) / q, (ni * dr - nr * di) / q];
        };
        // Σ_j Q_j(x+iy), the principal parts with coefficients C[j][k-1]
        const ppXY = (Pp, C, x, y) => {
          let sr = 0, si = 0;
          Pp.forEach(([a, b], j) => {
            const ur = x - a, ui = y - b, q = ur * ur + ui * ui; const ir = ur / q, ii = -ui / q; // 1/(z-α)
            let pr = ir, pi = ii;
            for (let k = 0; k < ORD[j]; k++) { const [cr, ci] = C[j][k]; sr += cr * pr - ci * pi; si += cr * pi + ci * pr; const t = pr * ir - pi * ii; pi = pr * ii + pi * ir; pr = t; }
          });
          return [sr, si];
        };
        let st = null;
        v.render(() => {
          const d = deg.value;
          zh.forEach((h, i) => { h.visible = i < d; });
          const Z = zh.slice(0, d).map((h) => [h.x, h.y]), Pp = ph.map((h) => [h.x, h.y]);
          // principal parts by the trapezoid rule on small circles:  c_k = (1/2π) ∫ f(α+ρe^{iθ}) (ρe^{iθ})^k dθ
          const MQ = 256;
          const C = Pp.map(([a, b], j) => {
            let rho = 0.35; Pp.forEach(([c, e], i) => { if (i !== j) rho = Math.min(rho, 0.45 * Math.hypot(a - c, b - e)); });
            const out = [];
            for (let k = 1; k <= ORD[j]; k++) {
              let sr = 0, si = 0;
              for (let t = 0; t < MQ; t++) { const th = TAU * t / MQ, [fr, fi] = fXY(Z, Pp, a + rho * Math.cos(th), b + rho * Math.sin(th)); const wr = rho ** k * Math.cos(k * th), wi = rho ** k * Math.sin(k * th); sr += fr * wr - fi * wi; si += fr * wi + fi * wr; }
              out.push([sr / MQ, si / MQ]);
            }
            return out;
          });
          // polynomial part: Taylor coefficients of g = f − ΣQ_j on a large circle
          const r8 = 1 + Math.max(...Pp.map(([a, b]) => Math.hypot(a, b)), ...Z.map(([a, b]) => Math.hypot(a, b)));
          const bco = [];
          for (let n = 0; n <= 3; n++) {
            let sr = 0, si = 0;
            for (let t = 0; t < MQ; t++) { const th = TAU * t / MQ, x = r8 * Math.cos(th), y = r8 * Math.sin(th); const [fr, fi] = fXY(Z, Pp, x, y), [pr, pi] = ppXY(Pp, C, x, y); const gr = fr - pr, gi = fi - pi, wr = r8 ** -n * Math.cos(-n * th), wi = r8 ** -n * Math.sin(-n * th); sr += gr * wr - gi * wi; si += gr * wi + gi * wr; }
            bco.push([sr / MQ, si / MQ]);
          }
          const pdeg = Math.max(0, d - 4);
          // check the decomposition on a grid
          let err = 0, scale = 0;
          for (let i = 0; i < 30; i++) for (let j = 0; j < 22; j++) {
            const x = -2.1 + 4.2 * i / 29, y = -1.55 + 3.1 * j / 21;
            if (Pp.some(([a, b]) => Math.hypot(x - a, y - b) < 0.08)) continue;
            const [fr, fi] = fXY(Z, Pp, x, y), [pr, pi] = ppXY(Pp, C, x, y);
            let qr = pr, qi = pi, zr = 1, zi = 0;
            for (let n = 0; n <= pdeg; n++) { qr += bco[n][0] * zr - bco[n][1] * zi; qi += bco[n][0] * zi + bco[n][1] * zr; const t = zr * x - zi * y; zi = zr * y + zi * x; zr = t; }
            err = Math.max(err, Math.hypot(fr - qr, fi - qi)); scale = Math.max(scale, Math.hypot(fr, fi));
          }
          const key = `${d}|${Z.flat().map((t) => t.toFixed(4))}|${Pp.flat().map((t) => t.toFixed(4))}`;
          L.raster((x, y) => { const [re, im] = fXY(Z, Pp, x, y); return phaseRGB(v.M, re, im); }, { key, res: 2 });
          const zero = pdeg === 0 && Math.hypot(...bco[0]) < 1e-9;
          if (zero) {
            Rt.rect(-9, -9, 9, 9, { fill: 'green', fillAlpha: 0.08, stroke: false });
            Rt.tex('f-(Q_1+Q_2+Q_3)\\equiv 0', 0, 0.25, { color: 'green', size: 20 });
            Rt.text(`computed values: |f − ΣQⱼ| ≤ ${v.fmt(err + 1e-300, 1)} on the grid`, 0, -0.35, { color: 'muted', size: 12.5, align: 'center' });
          } else Rt.raster((x, y) => { const [fr, fi] = fXY(Z, Pp, x, y), [pr, pi] = ppXY(Pp, C, x, y); return phaseRGB(v.M, fr - pr, fi - pi); }, { key, res: 2 });
          if (!zero) Pp.forEach(([a, b], j) => {
            Rt.circle(a, b, 0.09, { color: 'ink', width: 1.2, dash: [2, 3], alpha: 0.8 });
            Rt.text(`α${SUBS(j + 1)}`, a, b, { color: 'ink', size: 12, dx: 9, dy: -11, alpha: 0.85 });
          });
          Rt.corner(zero ? 'f vanishes at ∞: it is the sum of its principal parts' : pdeg === 0 ? 'a constant: f is holomorphic at ∞' : `a polynomial of degree ${pdeg}: f has a pole of order ${pdeg} at ∞`, 'bl', { color: 'green', weight: 600 });
          st = { C, bco, pdeg, err, scale };
          v.legend([['ink', 'zeros of $P$ (drag)', { dot: true }], ['red', 'poles = zeros of $Q$ (drag)', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const M = v.M;
          const pp = [`\\frac{${cTeX(M, ...s.C[0][0])}}{z-\\alpha_1}`, `\\frac{${cTeX(M, ...s.C[1][0])}}{z-\\alpha_2}+\\frac{${cTeX(M, ...s.C[1][1])}}{(z-\\alpha_2)^2}`, `\\frac{${cTeX(M, ...s.C[2][0])}}{z-\\alpha_3}`];
          const poly = Math.hypot(...s.bco[0]) > 1e-9 ? [`${cTeX(M, ...s.bco[0])}`] : [];
          for (let n = 1; n <= s.pdeg; n++) poly.push(`(${cTeX(M, ...s.bco[n])})${n === 1 ? 'z' : `z^${n}`}`);

          const hi = Math.max(...s.bco.slice(s.pdeg + 1).map(([a, b]) => Math.hypot(a, b)));
          const what = !poly.length ? 'the principal parts at $\\alpha_1,\\alpha_2,\\alpha_3$ alone' : `constant ${s.pdeg ? '$+$ principal part at $\\infty$ ' : ''}$+$ principal parts at $\\alpha_1,\\alpha_2,\\alpha_3$`;
          return `$f(z) = ${poly.length ? poly.join('+') + '\\;+\\;' : ''}${pp.join('+')}$ $\\quad$ (${what}). The coefficients of $z^{${s.pdeg + 1}},z^{${s.pdeg + 2}},\\dots$ in $f-\\sum Q_j$ are below $${sciT(hi + 1e-300, 1)}$, and the decomposition matches $f$ to $${sciT(s.err + 1e-300, 1)}$ on a grid where $|f|$ reaches $${v.fmt(s.scale, 3)}$.`;
        });
      },
    },
    {
      num: '13.3',
      kind: 'Theorem',
      name: 'Exhaustion of an open set by compact sets',
      statement: String.raw`For every open set $\Omega\subset\C$ there are compact sets $K_1,K_2,K_3,\dots$ with $\Omega=\bigcup_n K_n$ such that
(a) $K_n$ lies in the interior of $K_{n+1}$;
(b) every compact subset of $\Omega$ is contained in some $K_n$;
(c) every component of $S^2\setminus K_n$ contains a component of $S^2\setminus\Omega$.`,
      idea: String.raw`Take $K_n=\{z:|z|\le n,\ \dist(z,\C\setminus\Omega)\ge 1/n\}$: closed and bounded, hence compact, with union $\Omega$. Because $z\mapsto\dist(z,\C\setminus\Omega)$ is continuous, $K_n$ lies in the open set $\{|z|<n+1,\ \dist>1/(n+1)\}\subset K_{n+1}$, which is (a); so the interiors of the $K_n$ form an increasing open cover of $\Omega$, and a compact $K\subset\Omega$ lies in one of them, which is (b). For (c), take $z\notin K_n$. If $|z|>n$, the connected set $\{|w|>n\}\cup\{\infty\}$ misses $K_n$ and joins $z$ to $\infty$. Otherwise some $w\notin\Omega$ has $|z-w|<1/n$, and the disc $D(w;1/n)$ misses $K_n$ and joins $z$ to $w$. Either way the component of $z$ meets, and therefore contains, a component of $S^2\setminus\Omega$.`,
      caption: String.raw`Here $\Omega=\C$ minus a closed disc, a segment and a point, so $S^2\setminus\Omega$ has four components (counting $\{\infty\}$). Move $n$: $K_n$ (blue) grows and fills $\Omega$, the outline of $K_{n-1}$ always sits inside it, and each tinted component of $S^2\setminus K_n$ visibly contains one of the dark pieces or reaches past $|z|=n$ to $\infty$. Drag the probe $q$ to identify a component, and drag the small green compact set $L$ to see the first $n$ with $L\subset K_n$.`,
      deps: ['pma-2.41', 'rca-13.1'],
      tags: ['compact exhaustion', 'topology'],
      viz(v) {
        const D1 = { c: [-1.4, 0.3], r: 0.55 }, SEG = [0.55, -1.2, 1.65, 0.3], PT = [0.15, 0.95];
        const pieceDist = (x, y) => [Math.max(0, Math.hypot(x - D1.c[0], y - D1.c[1]) - D1.r), segDist(x, y, ...SEG), Math.hypot(x - PT[0], y - PT[1])];
        const dOut = (x, y) => Math.min(...pieceDist(x, y));
        const nS = v.slider('$n$', 1, 9, 3, { int: true });
        const S = v.stage({ x: [-3.3, 3.3], y: [-2.3, 2.3], equal: true, height: 400, full: true });
        const q = S.handle(-1.45, -0.42, { color: 'gold', label: 'q', labelPos: 'sw' });
        const Lh = S.handle(-0.35, -0.55, { color: 'green', r: 6 });
        const LR = 0.22;
        const PIECES = ['the disc $D$', 'the segment $I$', 'the point $p$', '$\\infty$'];
        const TINT = ['red', 'purple', 'teal', 'gray'];
        let st = null;
        v.render(() => {
          const n = nS.value;
          // classify a grid of cells: 1 = in K_n, else free; label free cells by connectivity
          const cs = 3, W = Math.ceil(S.width / cs), H = Math.ceil(S.height / cs);
          const tol = 0.75 * cs / S.scale;
          const inK = new Uint8Array(W * H), inKp = new Uint8Array(W * H), piece = new Int8Array(W * H).fill(-1);
          const cx = new Float64Array(W), cy = new Float64Array(H);
          for (let i = 0; i < W; i++) cx[i] = S.invX((i + 0.5) * cs);
          for (let j = 0; j < H; j++) cy[j] = S.invY((j + 0.5) * cs);
          for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
            const x = cx[i], y = cy[j], pd = pieceDist(x, y), d = Math.min(...pd), r = Math.hypot(x, y), k = j * W + i;
            inK[k] = r <= n && d >= 1 / n ? 1 : 0;
            inKp[k] = n > 1 && r <= n - 1 && d >= 1 / (n - 1) ? 1 : 0;
            if (d <= tol) piece[k] = pd.indexOf(d); else if (r > n) piece[k] = 3;
          }
          const lab = new Int32Array(W * H).fill(-1); const comps = [];
          const stack = [];
          for (let s0 = 0; s0 < W * H; s0++) {
            if (inK[s0] || lab[s0] >= 0) continue;
            const id = comps.length, has = new Set(); let edge = false; lab[s0] = id; stack.push(s0);
            while (stack.length) {
              const k = stack.pop(), i = k % W, j = (k - i) / W;
              if (piece[k] >= 0) has.add(piece[k]);
              if (i === 0 || j === 0 || i === W - 1 || j === H - 1) edge = true;
              for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= W || b >= H) continue;
                const kk = b * W + a; if (!inK[kk] && lab[kk] < 0) { lab[kk] = id; stack.push(kk); }
              }
            }
            comps.push({ has: [...has].sort(), edge });
          }
          // {|z| > n} ∪ {∞} is connected in S², so all pieces of it that the window cuts apart are one component
          const inf = comps.map((c, i) => (c.has.includes(3) ? i : -1)).filter((i) => i >= 0);
          if (inf.length > 1) {
            const keep = inf[0], drop = new Set(inf.slice(1));
            comps[keep].has = [...new Set(inf.flatMap((i) => comps[i].has))].sort();
            const remap = []; let m = 0; comps.forEach((c, i) => { remap[i] = drop.has(i) ? -1 : m++; }); inf.slice(1).forEach((i) => { remap[i] = remap[keep]; });
            for (let k = 0; k < lab.length; k++) if (lab[k] >= 0) lab[k] = remap[lab[k]];
            for (let i = comps.length - 1; i >= 0; i--) if (drop.has(i)) comps.splice(i, 1);
          }
          const qi = Math.min(W - 1, Math.max(0, Math.floor(S.X(q.x) / cs))), qj = Math.min(H - 1, Math.max(0, Math.floor(S.Y(q.y) / cs)));
          const qc = inK[qj * W + qi] ? -1 : lab[qj * W + qi];
          const tints = TINT.map((c) => v.rgb(c)), blue = v.rgb('accent'), bg = v.rgb('panel');
          const mixc = (c, a) => [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a];
          S.raster((x, y) => {
            const i = Math.min(W - 1, Math.max(0, Math.floor(S.X(x) / cs))), j = Math.min(H - 1, Math.max(0, Math.floor(S.Y(y) / cs))), k = j * W + i;
            if (inK[k]) {
              const bd = inKp[k] && ((i > 0 && !inKp[k - 1]) || (i < W - 1 && !inKp[k + 1]) || (j > 0 && !inKp[k - W]) || (j < H - 1 && !inKp[k + W]));
              return bd ? mixc(blue, 0.95) : mixc(blue, inKp[k] ? 0.42 : 0.3);
            }
            const c = comps[lab[k]]; const p = c.has.length ? c.has[0] : 3;
            return mixc(tints[p], lab[k] === qc ? 0.34 : 0.15);
          }, { key: `${n}|${qc}|${S.width}`, res: 1 });
          if (n * S.scale < 1.5 * S.width) S.circle(0, 0, n, { color: 'muted', width: 1.3, dash: [6, 4] });
          // the pieces of S² \ Ω
          S.circle(D1.c[0], D1.c[1], D1.r, { fill: 'ink', fillAlpha: 0.78, color: 'ink', width: 1.5 });
          S.line(SEG[0], SEG[1], SEG[2], SEG[3], { color: 'ink', width: 3.2 });
          S.dot(PT[0], PT[1], { color: 'ink', r: 4 });
          S.tex('D', D1.c[0], D1.c[1], { color: 'panel', size: 16 });
          S.tex('I', SEG[2], SEG[3], { color: 'ink', size: 15, dx: 9, dy: -8 });
          S.tex('p', PT[0], PT[1], { color: 'ink', size: 15, dx: 9, dy: -9 });
          S.tex(`K_{${n}}`, 1.95, -1.85, { color: 'accent', size: 17 });
          // compact probe L
          const dL = dOut(Lh.x, Lh.y) - LR, rL = Math.hypot(Lh.x, Lh.y) + LR;
          const nL = dL > 0 ? Math.max(1, Math.ceil(Math.max(rL, 1 / dL) - 1e-9)) : Infinity;
          S.circle(Lh.x, Lh.y, LR, { fill: dL > 0 ? 'green' : 'red', fillAlpha: 0.3, color: dL > 0 ? 'green' : 'red', width: 2 });
          S.tex('L', Lh.x - LR, Lh.y + LR, { color: dL > 0 ? 'green' : 'red', size: 15, dx: -4, dy: -4 });
          st = { n, comps, qc, nL, dL };
          v.legend([['accent', '$K_n$', { area: true }], ['accent', 'outline of $K_{n-1}$'], ['ink', '$\\C\\setminus\\Omega$: disc $D$, segment $I$, point $p$', { area: true }], ['muted', '$|z|=n$', { dash: true }], ['gold', 'probe $q$', { dot: true }], ['green', 'compact $L\\subset\\Omega$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const names = (c) => c.has.map((p) => PIECES[p]).join(', ');
          const parts = s.comps.map((c) => names(c) || '?');
          const qtxt = s.qc < 0 ? 'The probe $q$ lies in $K_n$' : `The component of $q$ contains ${names(s.comps[s.qc])}`;
          const ltxt = isFinite(s.nL) ? `$L\\subset K_m$ for all $m\\ge ${s.nL}$ ${s.n >= s.nL ? '(true now)' : '(not yet)'}` : '$L$ meets $\\C\\setminus\\Omega$, so it is not a compact subset of $\\Omega$';
          return `$S^2\\setminus K_{${s.n}}$ has ${s.comps.length} component${s.comps.length > 1 ? 's' : ''}; they contain: ${parts.join(' $\\mid$ ')}. ${qtxt}. ${ltxt}.`;
        });
      },
    },
    {
      num: '13.5',
      kind: 'Theorem',
      name: 'A cycle in $\\Omega\\setminus K$ that gives Cauchy’s formula on $K$',
      statement: String.raw`Let $K$ be a compact subset of an open set $\Omega\subset\C$. Then there is a cycle $\Gamma$ in $\Omega\setminus K$ such that
$$f(z)=\frac{1}{2\pi i}\int_\Gamma\frac{f(\zeta)}{\zeta-z}\,d\zeta$$
for every $f\in H(\Omega)$ and every $z\in K$.`,
      idea: String.raw`Choose $\eta>0$ so small that every closed square of side $\eta$ that meets $K$ lies in $\Omega$ (e.g. $\sqrt2\,\eta<\dist(K,\C\setminus\Omega)$). Cover the plane by a grid of such squares, keep the squares $Q_1,\dots,Q_m$ meeting $K$, and add up their positively oriented boundaries; edges shared by two kept squares cancel. An edge that meets $K$ is shared by two squares that both meet $K$, so the surviving edges form a cycle $\Gamma$ in $\Omega\setminus K$. Then $\Ind_\Gamma=\sum_r\Ind_{\partial Q_r}$ is $1$ inside the squares and $0$ off them, in particular on $\C\setminus\Omega$, so the global Cauchy formula (10.35) applies; it gives the identity at interior points of the squares and, by continuity, on all of $K$.`,
      caption: String.raw`$\Omega$ is the region inside the outer curve minus the dark disc, and $K$ (blue) is a ring around that hole together with a small disc. $f$ has its singularities in the hole and outside $\Omega$ (×). Change $\eta$: the squares meeting $K$ are drawn in orange, cancelled edges are faint, and the surviving edges form $\Gamma$. Drag $z$: the readout compares $f(z)$ with the integral over $\Gamma$ (index and integral computed exactly edge by edge). Make $\eta$ too large and squares leave $\Omega$ (red); near the top of the range a square swallows the singularity $s_1$ in the hole, $\Gamma$ winds around it, and the formula breaks.`,
      deps: ['rca-10.35', 'rca-10.10', 'rca-10.34'],
      tags: ['Cauchy formula', 'cycles'],
      viz(v) {
        const M = v.M;
        const HOLE = { c: [-0.3, 0.1], r: 0.3 }, RING = { a: 0.62, b: 0.95 }, K2 = { c: [1.1, -0.55], r: 0.22 };
        const OUT = M.blob(0, 0, 1.95, 7, 0.045, 220);
        const SH = [HOLE.c[0] + 0.17, HOLE.c[1] - 0.17], SO = [2.25, 1.2];
        const fXY = (x, y) => { // 1/(z − s_h) + 1/(z − s_o)²
          let ur = x - SH[0], ui = y - SH[1], q = ur * ur + ui * ui; const ar = ur / q, ai = -ui / q;
          ur = x - SO[0]; ui = y - SO[1]; const sr = ur * ur - ui * ui, si = 2 * ur * ui; q = sr * sr + si * si;
          return [ar + sr / q, ai - si / q];
        };
        const inK = (x, y) => { const d = Math.hypot(x - HOLE.c[0], y - HOLE.c[1]); return (d >= RING.a && d <= RING.b) || Math.hypot(x - K2.c[0], y - K2.c[1]) <= K2.r; };
        const sqMinMax = (c, x0, y0, e) => { const dx = Math.max(x0 - c[0], 0, c[0] - x0 - e), dy = Math.max(y0 - c[1], 0, c[1] - y0 - e); const fx = Math.max(Math.abs(x0 - c[0]), Math.abs(x0 + e - c[0])), fy = Math.max(Math.abs(y0 - c[1]), Math.abs(y0 + e - c[1])); return [Math.hypot(dx, dy), Math.hypot(fx, fy)]; };
        const etaS = v.slider('grid size $\\eta$', 0.07, 0.56, 0.16, { step: 0.005 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.12, 2.12], equal: true, height: 420, full: true, axes: false });
        const z = S.handle(HOLE.c[0] + 0.78, HOLE.c[1] + 0.12, { color: 'gold', label: 'z', labelPos: 'ne' });
        const GL = [[-0.9061798459, 0.2369268851], [-0.5384693101, 0.4786286705], [0, 0.5688888889], [0.5384693101, 0.4786286705], [0.9061798459, 0.2369268851]];
        let st = null;
        v.render(() => {
          const e = etaS.value;
          // squares of the η-grid meeting K
          const sq = []; const N0 = Math.floor(-2.1 / e), N1 = Math.ceil(2.1 / e);
          for (let i = N0; i <= N1; i++) for (let j = N0; j <= N1; j++) {
            const x0 = i * e, y0 = j * e;
            const [mn, mx] = sqMinMax(HOLE.c, x0, y0, e), [m2] = sqMinMax(K2.c, x0, y0, e);
            if (!((mn <= RING.b && mx >= RING.a) || m2 <= K2.r)) continue;
            let ok = mn > HOLE.r;
            for (let t = 0; t <= 8 && ok; t++) { const s = t / 8 * e; for (const [px, py] of [[x0 + s, y0], [x0 + e, y0 + s], [x0 + e - s, y0 + e], [x0, y0 + e - s]]) if (!M.pointInPoly([px, py], OUT)) { ok = false; break; } }
            sq.push({ i, j, x0, y0, ok });
          }
          // boundary edges; an edge cancels against its reverse
          const E = new Map(); const kf = (a, b, c, d) => `${a},${b},${c},${d}`;
          for (const { i, j } of sq) {
            for (const [a, b, c, d] of [[i, j, i + 1, j], [i + 1, j, i + 1, j + 1], [i + 1, j + 1, i, j + 1], [i, j + 1, i, j]]) {
              const r = kf(c, d, a, b); if (E.has(r)) E.delete(r); else E.set(kf(a, b, c, d), [a * e, b * e, c * e, d * e]);
            }
          }
          const G = [...E.values()];
          const bad = sq.filter((s) => !s.ok).length;
          // index and Cauchy integral at z
          const ind = (x, y) => G.reduce((s, [a, b, c, d]) => s + subtend(x, y, a, b, c, d), 0) / M.TAU;
          let Ir = 0, Ii = 0, dmin = Infinity;
          for (const [a, b, c, d] of G) {
            const dd = segDist(z.x, z.y, a, b, c, d); dmin = Math.min(dmin, dd);
            const dq = Math.min(dd, segDist(SH[0], SH[1], a, b, c, d), segDist(SO[0], SO[1], a, b, c, d));
            const pieces = Math.min(200, Math.max(1, Math.ceil(2 * e / Math.max(dq, 1e-4))));
            for (let p = 0; p < pieces; p++) for (const [g, w] of GL) {
              const t = (p + (g + 1) / 2) / pieces, x = a + (c - a) * t, y = b + (d - b) * t;
              const [fr, fi] = fXY(x, y), ur = x - z.x, ui = y - z.y, q = ur * ur + ui * ui;
              const hr = (fr * ur + fi * ui) / q, hi = (fi * ur - fr * ui) / q; // f/(ζ−z)
              const dzr = (c - a) * w / 2 / pieces, dzi = (d - b) * w / 2 / pieces;
              Ir += hr * dzr - hi * dzi; Ii += hr * dzi + hi * dzr;
            }
          }
          const cr = Ii / M.TAU, ci = -Ir / M.TAU; // divide by 2πi
          // ---- draw
          S.rings([[[-9, -9], [9, -9], [9, 9], [-9, 9]], OUT], { evenodd: true, fill: 'gray', fillAlpha: 0.3, stroke: false });
          S.poly(OUT, { color: 'muted', width: 1.4 });
          S.circle(HOLE.c[0], HOLE.c[1], HOLE.r, { fill: 'gray', fillAlpha: 0.55, color: 'muted', width: 1.4 });
          S.rings([circlePts(HOLE.c[0], HOLE.c[1], RING.b), circlePts(HOLE.c[0], HOLE.c[1], RING.a)], { evenodd: true, fill: 'accent', fillAlpha: 0.38, stroke: false });
          S.circle(K2.c[0], K2.c[1], K2.r, { fill: 'accent', fillAlpha: 0.38, stroke: false });
          for (const s of sq) S.rect(s.x0, s.y0, s.x0 + e, s.y0 + e, { fill: s.ok ? 'orange' : 'red', fillAlpha: s.ok ? 0.1 : 0.32, color: s.ok ? 'orange' : 'red', width: 0.8, alpha: 0.45 });
          for (const [a, b, c, d] of G) {
            S.line(a, b, c, d, { color: 'ink', width: 2.4 });
            if (e >= 0.1) { const mx = (a + c) / 2, my = (b + d) / 2, ux = (c - a) / e, uy = (d - b) / e, h = Math.min(0.075, 0.36 * e); S.arrow(mx - ux * h, my - uy * h, mx + ux * h, my + uy * h, { color: 'ink', head: 11, width: 2.4 }); }
          }
          xMark(S, SH[0], SH[1], 'ink', 6); xMark(S, SO[0], SO[1], 'ink', 6);
          S.text('s₁', SH[0], SH[1], { color: 'ink', math: true, dx: 10, dy: -10 });
          S.text('s₂', SO[0], SO[1], { color: 'ink', math: true, dx: 10, dy: -10 });
          S.tex('\\C\\setminus\\Omega', -2.2, -1.8, { color: 'ink', size: 15 });
          S.tex('K', HOLE.c[0] - 0.79, HOLE.c[1] + 0.05, { color: 'accent', size: 17 });
          S.tex('K', K2.c[0], K2.c[1], { color: 'accent', size: 15 });
          S.tex('\\Gamma', 0.62, 1.15, { color: 'ink', size: 16 });
          const [fzr, fzi] = fXY(z.x, z.y), Iz = ind(z.x, z.y);
          st = { e, sq: sq.length, bad, edges: G.length, Iz, I1: ind(SH[0], SH[1]), I2: ind(SO[0], SO[1]), fz: [fzr, fzi], cz: [cr, ci], dmin, inKz: inK(z.x, z.y), dist: Math.min(RING.a - HOLE.r, 0.32) };
          S.corner(bad ? `${bad} square${bad > 1 ? 's' : ''} not inside Ω — η is too large` : `${sq.length} squares meet K; ${G.length} edges survive`, 'tl', { color: bad ? 'red' : 'green', weight: 600 });
          v.legend([['accent', 'compact $K$', { area: true }], ['gray', '$\\C\\setminus\\Omega$', { area: true }], ['orange', 'grid squares meeting $K$', { area: true }], ['ink', 'the cycle $\\Gamma$ (uncancelled edges)'], ['gold', 'test point $z$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.dmin < 1e-6) return '$z$ lies on $\\Gamma$; move it off.';
          const where = s.inKz ? '$z\\in K$' : '$z\\notin K$';
          const err = Math.hypot(s.fz[0] * Math.round(s.Iz) - s.cz[0], s.fz[1] * Math.round(s.Iz) - s.cz[1]);
          const ok = Math.round(s.Iz) === 1 && Math.hypot(s.fz[0] - s.cz[0], s.fz[1] - s.cz[1]) < 1e-6;
          return `${where}: $\\Ind_\\Gamma(z) = ${Math.round(s.Iz)}$, $\\Ind_\\Gamma(s_1) = ${Math.round(s.I1)}$, $\\Ind_\\Gamma(s_2) = ${Math.round(s.I2)}$. $\\;f(z) = ${cTeX(v.M, ...s.fz, 4)}$, $\\;\\frac{1}{2\\pi i}\\int_\\Gamma\\frac{f(\\zeta)}{\\zeta-z}d\\zeta = ${cTeX(v.M, ...s.cz, 4)}$` + (ok ? (s.bad ? ' — equal here, although squares leave $\\Omega$: $\\Gamma$ happens not to wind around a singularity of $f$.' : ` — equal (difference $${sciT(Math.hypot(s.fz[0] - s.cz[0], s.fz[1] - s.cz[1]) + 1e-300, 1)}$), as the theorem says.`) : s.bad && (Math.round(s.I1) || Math.round(s.I2)) ? ' — **not** equal: $\\Gamma$ has left $\\Omega$ and winds around a singularity of $f$.' : `. (Off the squares the integral is $0$; here $|f(z)\\Ind_\\Gamma(z) - \\text{integral}| = ${sciT(err + 1e-300, 1)}$.)`);
        });
      },
    },
  ],
};
