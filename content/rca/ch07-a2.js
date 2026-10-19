// Rudin, Real and Complex Analysis — Chapter 7 (part 2): Radon–Nikodym derivatives as limits,
// nicely shrinking sets, the fundamental theorem for Lebesgue integrals, metric density.

// ---------------------------------------------------------------- shared helpers (batch 2)
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
function logTicks(a, b) {
  const out = [];
  for (let k = Math.ceil(a); k <= b; k++) out.push([k, k === 0 ? '1' : k === 1 ? '10' : k === -1 ? '0.1' : '10' + String(k).split('').map((c) => SUP[c]).join('')]);
  return out;
}
const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => Math.pow(10, a + (b - a) * i / (n - 1)));
function pieces(S, f, a, b, breaks, st) {
  const cuts = [a, ...breaks.filter((c) => c > a && c < b).sort((u, w) => u - w), b];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? 1e-9 : 0), hi = cuts[i + 1] - (i + 2 < cuts.length ? 1e-9 : 0);
    if (hi > lo) S.fn(f, { ...st, domain: [lo, hi] });
  }
}
/** Signed area of (triangle 0,p,q) ∩ disc(0,r): split pq where it crosses the circle; inside pieces give triangles, outside pieces give sectors. */
function segDisc(p, q, r) {
  const dx = q[0] - p[0], dy = q[1] - p[1];
  const a = dx * dx + dy * dy, b = 2 * (p[0] * dx + p[1] * dy), c = p[0] * p[0] + p[1] * p[1] - r * r;
  const ts = [0], D = b * b - 4 * a * c;
  if (D > 0 && a > 0) { const s = Math.sqrt(D); for (const t of [(-b - s) / (2 * a), (-b + s) / (2 * a)]) if (t > 0 && t < 1) ts.push(t); }
  ts.push(1);
  let area = 0;
  for (let i = 0; i + 1 < ts.length; i++) {
    const u = [p[0] + dx * ts[i], p[1] + dy * ts[i]], w = [p[0] + dx * ts[i + 1], p[1] + dy * ts[i + 1]];
    const tm = (ts[i] + ts[i + 1]) / 2, mx = p[0] + dx * tm, my = p[1] + dy * tm;
    if (mx * mx + my * my <= r * r) area += (u[0] * w[1] - u[1] * w[0]) / 2;
    else { let ang = Math.atan2(w[1], w[0]) - Math.atan2(u[1], u[0]); if (ang > Math.PI) ang -= 2 * Math.PI; if (ang < -Math.PI) ang += 2 * Math.PI; area += r * r * ang / 2; }
  }
  return area;
}
/** Exact area of (simple polygon) ∩ (disc of radius r about c). */
function polyDisc(poly, c, r) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; s += segDisc([p[0] - c[0], p[1] - c[1]], [q[0] - c[0], q[1] - c[1]], r); }
  return Math.abs(s);
}
/** Area of {w in disc(0,r) : n·w > -g} for a unit vector n (the part of a disc on one side of a line at signed offset g). */
function halfDisc(g, r) { if (g >= r) return Math.PI * r * r; if (g <= -r) return 0; return r * r * Math.acos(-g / r) + g * Math.sqrt(r * r - g * g); }

export default {
  collection: 'rca',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.8
    {
      num: '7.8',
      kind: 'Theorem',
      name: 'The Radon–Nikodym derivative is a derivative',
      statement: String.raw`Let $\mu$ be a complex Borel measure on $\R^k$ with $\mu\ll m$, and let $f\in L^1(\R^k)$ be its Radon–Nikodym derivative with respect to $m$. Then $D\mu=f$ a.e. $[m]$, and therefore
$$\mu(E)=\int_E(D\mu)\,dm$$
for every Borel set $E\subset\R^k$.`,
      idea: String.raw`By 6.10, $\mu(B(x,r))=\int_{B(x,r)}f\,dm$, hence
$$|(Q_r\mu)(x)-f(x)|\le\frac{1}{m(B_r)}\int_{B(x,r)}|f-f(x)|\,dm ,$$
which tends to $0$ at every Lebesgue point of $f$, i.e. almost everywhere by 7.7. So the abstract density $d\mu/dm$ is recovered as a limit of mass-to-volume ratios.`,
      caption: String.raw`A measure $d\mu=f\,dm$ on the plane: the density (colour) has a smooth hill, a jump across a line and an integrable pole $c/|z-p|$. Drag $x$ and change $r$; $\mu(B(x,r))$ is computed exactly for the jump and the pole and by quadrature for the hill. On the right, $Q_r\mu(x)$ converges to $f(x)$ (green). Drop $x$ onto the line (it snaps): there the limit is the mean of the two sides — a failure on a null set, which the theorem allows. At $p$ the quotients blow up.`,
      deps: ['rca-6.10', 'rca-7.7', 'rca-7.2'],
      tags: ['Radon–Nikodym', 'derivative of a measure'],
      viz(v) {
        const M = v.M;
        const HILL = [0.75, -0.4], HA = 1.1, HW = 0.35;
        const NRM = M.normalize([-0.45, 0.89]), DL = 0.32, JB = 0.9;  // half-plane {n·z > d}, jump b
        const P = [-1.05, -0.5], PC = 0.12;                              // pole c/|z − p|
        const hill = (x, y) => HA * Math.exp(-((x - HILL[0]) ** 2 + (y - HILL[1]) ** 2) / HW);
        const side = (x, y) => NRM[0] * x + NRM[1] * y - DL;
        const f = (x, y) => hill(x, y) + (side(x, y) > 0 ? JB : 0) + PC / Math.hypot(x - P[0], y - P[1]);
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.45, 1.45], equal: true, axes: false, height: 330, weight: 1.35 });
        const R = v.stage({ x: [-3.2, 0.1], y: [0, 3], height: 330, weight: 1, minWidth: 240, axes: 'box', xticks: logTicks(-3, 0), title: '$Q_r\\mu(x)$ against $r$ (log scale)' });
        const rS = v.slider('radius $r$', 0.002, 1, 0.45, { log: true, fmt: (x) => v.fmt(x, 2) });
        const xh = S.handle(0.15, 0.1, {
          color: 'gold', label: 'x', constrain: (x, y) => {
            const g = side(x, y); if (Math.abs(g) < 0.05) { x -= g * NRM[0]; y -= g * NRM[1]; }
            if (Math.hypot(x - P[0], y - P[1]) < 0.06) return [P[0], P[1]];
            return [x, y];
          },
        });
        // μ(B(x,r)): hill by equal-area polar quadrature, jump by the exact circular segment, pole by integrating chord lengths seen from p
        const NR = 14, NT = 30, NP = 240;
        function muBall(x, y, r) {
          let h = 0;
          for (let i = 0; i < NR; i++) { const rho = r * Math.sqrt((i + 0.5) / NR); for (let j = 0; j < NT; j++) { const t = (j + 0.5 + 0.5 * (i % 2)) * M.TAU / NT; h += hill(x + rho * Math.cos(t), y + rho * Math.sin(t)); } }
          h *= Math.PI * r * r / (NR * NT);
          const jump = JB * halfDisc(side(x, y), r);
          // directions θ from p that meet the ball: all of them if p is inside, else a cone of half-width asin(r/d)
          let pole = 0; const cx = P[0] - x, cy = P[1] - y, q = cx * cx + cy * cy - r * r, dd = Math.hypot(cx, cy);
          const inside = dd < r, th0 = Math.atan2(-cy, -cx), half = inside ? Math.PI : Math.asin(r / dd);
          for (let j = 0; j < NP; j++) {
            const t = th0 - half + (j + 0.5) * 2 * half / NP, ux = Math.cos(t), uy = Math.sin(t), b = ux * cx + uy * cy, D = b * b - q;
            if (D <= 0) continue; const s = Math.sqrt(D), r1 = -b - s, r2 = -b + s;
            if (r2 > 0) pole += r2 - Math.max(0, r1);
          }
          pole *= PC * 2 * half / NP;
          return h + jump + pole;
        }
        const Q = (x, y, r) => muBall(x, y, r) / (Math.PI * r * r);
        let st = {};
        v.legend([['gold', 'the ball $B(x,r)$', { area: true }], ['accent', '$r\\mapsto Q_r\\mu(x)$'], ['green', '$f(x)$', { dash: true }]]);
        v.render(() => {
          const x = xh.x, y = xh.y, r = rS.value;
          S.heat((a, b) => f(a, b), { range: [0, 2.2], cmap: 'viridis', key: 'f', res: 2, alpha: 0.85 });
          S.line(-3, (DL + 3 * NRM[0]) / NRM[1], 3, (DL - 3 * NRM[0]) / NRM[1], { color: 'red', width: 1.4, dash: [5, 4], alpha: 0.85 });
          S.circle(x, y, r, { color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.18 });
          S.dot(P[0], P[1], { color: 'red', r: 3.5, label: 'p', labelPos: 'sw', labelColor: 'ink' });
          const onLine = Math.abs(side(x, y)) < 1e-9, atP = x === P[0] && y === P[1];
          const fx = atP ? Infinity : f(x, y);
          const lim = atP ? Infinity : onLine ? hill(x, y) + JB / 2 + PC / Math.hypot(x - P[0], y - P[1]) : fx;
          const RS = logspace(-3.2, 0.1, 60), qs = RS.map((s) => Q(x, y, s));
          const top = M.clamp(Math.max(...qs, isFinite(fx) ? fx : 0) * 1.15, 1, 6);
          R.setView(null, [-0.08 * top, top]);
          if (isFinite(fx)) R.hline(fx, { color: 'green', dash: [6, 4], width: 1.6 });
          if (onLine) { R.hline(lim, { color: 'red', dash: [2, 3], width: 1.3 }); R.text('mean of the two sides', -3.15, lim, { color: 'red', dy: -9, size: 11 }); }
          R.path(RS.map((s, i) => [Math.log10(s), qs[i]]), { color: 'accent', width: 2.4 });
          const q = Q(x, y, r);
          R.vline(Math.log10(r), { color: 'gold', dash: [3, 3], width: 1.2 });
          R.dot(Math.log10(r), q, { color: 'gold', r: 5 });
          R.corner(atP ? 'x = p: the quotients blow up' : onLine ? 'x on the jump line (a null set): limit ≠ f(x)' : 'Q_r μ(x) → f(x)', 'tr', { color: atP || onLine ? 'red' : 'green', weight: 600, size: 11.5 });
          st = { x, y, r, q, fx, mu: muBall(x, y, r), onLine, atP };
        });
        v.readout(() => `$x=(${v.fix(st.x, 2)},${v.fix(st.y, 2)}),\\ r=${v.fmt(st.r, 3)}$: $\\;\\mu(B(x,r))=${v.fix(st.mu, 4)}$, $\\;Q_r\\mu(x)=${v.fix(st.q, 4)}$, $\\;f(x)=${isFinite(st.fx) ? v.fix(st.fx, 4) : '\\infty'}$.`);
      },
    },
    // ------------------------------------------------------------------ 7.9
    {
      num: '7.9',
      kind: 'Definition',
      name: 'Sets that shrink to a point nicely',
      statement: String.raw`Let $x\in\R^k$. A sequence $\{E_i\}$ of Borel sets in $\R^k$ **shrinks to $x$ nicely** if there is a number $\alpha>0$ and a sequence of radii $r_i\to0$ such that
$$E_i\subset B(x,r_i)\quad\text{and}\quad m(E_i)\ge\alpha\,m(B(x,r_i))\qquad(i=1,2,3,\dots).$$
It is not required that $x\in E_i$, nor even that $x$ lie in the closure of $E_i$.`,
      idea: String.raw`The condition says that $E_i$ occupies a fixed proportion of a ball about $x$ of comparable size. That is exactly what is needed to dominate averages over $E_i$ by averages over balls: $\frac{1}{m(E_i)}\int_{E_i}|g|\le\frac{1}{\alpha\,m(B(x,r_i))}\int_{B(x,r_i)}|g|$. Squares with a corner at $x$, half-annuli around $x$, or small discs off to one side all qualify; thin rectangles whose area is a vanishing fraction of the enclosing ball do not.`,
      caption: String.raw`Choose a family and step through the sequence. Left: the sets $E_i$ (orange) inside the balls $B(x,r_i)$ (dashed), drawn at true size. Right: the current $E_i$ magnified by $1/r_i$, so that $B(x,r_i)$ becomes the unit disc. For a nicely shrinking family the magnified picture never degenerates and the ratio $m(E_i)/m(B(x,r_i))$ (bars) stays above some $\alpha>0$; the thin rectangles collapse onto a segment and the ratios tend to $0$.`,
      deps: ['rca-2.20'],
      tags: ['nicely shrinking sets', 'differentiation'],
      viz(v) {
        const M = v.M;
        const FAM = {
          sq: { label: 'squares with a corner at $x$', nice: true, shape: (r) => { const s = r / Math.SQRT2; return [[0, 0], [s, 0], [s, s], [0, s]]; } },
          ann: { label: 'half-annuli', nice: true, shape: (r) => { const out = []; for (let k = 0; k <= 40; k++) { const t = Math.PI * k / 40; out.push([r * Math.cos(t), r * Math.sin(t)]); } for (let k = 40; k >= 0; k--) { const t = Math.PI * k / 40; out.push([0.5 * r * Math.cos(t), 0.5 * r * Math.sin(t)]); } return out; } },
          off: { label: 'discs beside $x$', nice: true, shape: (r) => M.range(48).map((k) => [0.62 * r + 0.34 * r * Math.cos(k * M.TAU / 48), 0.34 * r * Math.sin(k * M.TAU / 48)]) },
          thin: { label: 'thin rectangles (not nice)', nice: false, shape: (r) => [[0, -0.5 * r * r], [0.98 * r, -0.5 * r * r], [0.98 * r, 0.5 * r * r], [0, 0.5 * r * r]] },
        };
        const which = v.select('', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'ann');
        const iS = v.slider('index $i$', 0, 9, 3, { int: true });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.1, 1.1], equal: true, axes: false, height: 300, weight: 1.25 });
        const Rz = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 300, weight: 1, minWidth: 220, title: '$E_i$ magnified by $1/r_i$' });
        const B = v.stage({ x: [-0.6, 9.6], y: [0, 0.45], height: 140, full: true, axes: 'box', xticks: M.range(10).map((k) => [k, String(k)]), title: 'ratios $m(E_i)/m(B(x,r_i))$' });
        const xh = L.handle(-0.35, -0.25, { color: 'accent', label: 'x', labelPos: 'sw' });
        const rad = (i) => 0.95 * Math.pow(0.6, i);
        let st = {};
        v.legend([['orange', 'the sets $E_i$', { area: true }], ['muted', 'the balls $B(x,r_i)$', { dash: true }], ['green', 'ratio $\\ge\\alpha$', { area: true }], ['red', 'ratio $\\to0$', { area: true }]]);
        v.render(() => {
          const F = FAM[which.value], i = iS.value, x = [xh.x, xh.y];
          const ratios = M.range(10).map((k) => { const r = rad(k); return Math.abs(M.polyArea(F.shape(r))) / (Math.PI * r * r); });
          for (let k = 0; k < 10; k++) {
            const r = rad(k), cur = k === i;
            L.circle(x[0], x[1], r, { color: cur ? 'ink' : 'muted', width: cur ? 1.6 : 1, dash: [4, 4], alpha: cur ? 0.9 : 0.5 });
            L.poly(F.shape(r).map(([a, b]) => [x[0] + a, x[1] + b]), { fill: 'orange', fillAlpha: cur ? 0.55 : 0.16, color: 'orange', width: cur ? 2 : 1, alpha: cur ? 1 : 0.6 });
          }
          L.dot(x[0], x[1], { color: 'accent', r: 3 });
          L.corner(`r_${i} = ${v.fmt(rad(i), 3)}`, 'tr');
          // magnified copy
          const r = rad(i);
          Rz.circle(0, 0, 1, { color: 'ink', width: 1.4, dash: [5, 4] });
          Rz.poly(F.shape(r).map(([a, b]) => [a / r, b / r]), { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 2 });
          Rz.dot(0, 0, { color: 'accent', r: 4, label: 'x', labelPos: 'sw' });
          Rz.corner(`ratio = ${v.fmt(ratios[i], 3)}`, 'bl', { color: F.nice ? 'green' : 'red', weight: 600 });
          // bars
          const alpha = Math.min(...ratios);
          B.bars(ratios, { x0: 0, dx: 1, barWidth: 0.6, color: (val, k) => (k === i ? (F.nice ? 'green' : 'red') : F.nice ? 'green' : 'red'), fillAlpha: 0.5 });
          B.rect(i - 0.3, 0, i + 0.3, ratios[i], { color: 'ink', width: 1.6 });
          if (F.nice) { B.hline(alpha, { color: 'green', dash: [5, 4], width: 1.4 }); B.text('α = ' + v.fmt(alpha, 3), 9.55, alpha, { dy: -9, color: 'green', size: 11.5, align: 'right' }); }
          else B.text('ratios ≈ r_i/π → 0: no α > 0 works', 9.55, 0.4, { color: 'red', size: 11.5, align: 'right', weight: 600 });
          st = { i, r, ratio: ratios[i], alpha, nice: F.nice };
        });
        v.readout(() => `$i=${st.i}$: $\\;r_i=${v.fmt(st.r, 3)}$, $\\;m(E_i)/m(B(x,r_i))=${v.fix(st.ratio, 4)}$` + (st.nice ? ` — the family shrinks to $x$ nicely with $\\alpha=${v.fix(st.alpha, 3)}$.` : ' — tends to $0$, so this family does not shrink nicely.'));
      },
    },
    // ------------------------------------------------------------------ 7.10
    {
      num: '7.10',
      kind: 'Theorem',
      name: 'Averages over nicely shrinking sets',
      statement: String.raw`Suppose that to each $x\in\R^k$ is assigned a sequence $\{E_i(x)\}$ that shrinks to $x$ nicely, and let $f\in L^1(\R^k)$. Then
$$f(x)=\lim_{i\to\infty}\frac{1}{m(E_i(x))}\int_{E_i(x)}f\,dm$$
at every Lebesgue point $x$ of $f$, hence almost everywhere $[m]$.`,
      idea: String.raw`If $E_i\subset B(x,r_i)$ and $m(E_i)\ge\alpha\,m(B(x,r_i))$, then
$$\Bigl|\frac{1}{m(E_i)}\int_{E_i}f\,dm-f(x)\Bigr|\le\frac{1}{m(E_i)}\int_{E_i}|f-f(x)|\,dm\le\frac{1}{\alpha\,m(B(x,r_i))}\int_{B(x,r_i)}|f-f(x)|\,dm ,$$
and the right side tends to $0$ at every Lebesgue point (7.6), which is almost every point by 7.7.`,
      caption: String.raw`The test function is $f=\chi_C$ for the cusp $C=\{(u,v):0<u<1,\ |v|<u^2\}$, and $x=0$ is its tip. Since $m(C\cap B(0,r))\approx\tfrac23r^3$, the point $0$ is a Lebesgue point with $f(0)=0$. Drag $r$ (the view zooms with it). Averages over discs, over squares with a corner at $0$, and over small discs beside $0$ — all nicely shrinking — tend to $f(0)=0$. Averages over the thin rectangles $[\tfrac r2,r]\times[-\tfrac{r^2}{8},\tfrac{r^2}{8}]$, which lie inside the cusp, are identically $1$.`,
      deps: ['rca-7.9', 'rca-7.6', 'rca-7.7'],
      tags: ['nicely shrinking sets', 'Lebesgue points'],
      viz(v) {
        const M = v.M;
        // m(C ∩ {(u,v): u in [a,b], |v - c| < w}) for the cusp |v| < u², via ∫ length of the v-slice
        const sliceInt = (a, b, len) => M.integrate((u) => Math.max(0, len(u)), a, b, 400);
        const cuspIn = (u, lo, hi) => Math.max(0, Math.min(hi, u * u) - Math.max(lo, -u * u));
        const FAM = {
          disc: { label: 'discs $B(0,r)$', color: 'green', nice: true, area: (r) => Math.PI * r * r, inter: (r) => sliceInt(0, Math.min(r, 1), (u) => cuspIn(u, -Math.sqrt(Math.max(0, r * r - u * u)), Math.sqrt(Math.max(0, r * r - u * u)))), draw: (S, r, st) => S.circle(0, 0, r, st) },
          sq: { label: 'squares $[0,r]\\times[-\\frac r2,\\frac r2]$', color: 'teal', nice: true, area: (r) => r * r, inter: (r) => sliceInt(0, r, (u) => cuspIn(u, -r / 2, r / 2)), draw: (S, r, st) => S.rect(0, -r / 2, r, r / 2, st) },
          side: { label: 'discs beside $0$', color: 'purple', nice: true, area: (r) => Math.PI * (r / 4) ** 2, inter: (r) => sliceInt(0.25 * r, 0.75 * r, (u) => { const h = Math.sqrt(Math.max(0, (r / 4) ** 2 - (u - r / 2) ** 2)); return cuspIn(u, r * 0.55 - h, r * 0.55 + h); }), draw: (S, r, st) => S.circle(r / 2, 0.55 * r, r / 4, st) },
          thin: { label: 'thin rectangles (not nice)', color: 'red', nice: false, area: (r) => (r / 2) * (r * r / 4), inter: (r) => sliceInt(r / 2, r, (u) => cuspIn(u, -r * r / 8, r * r / 8)), draw: (S, r, st) => S.rect(r / 2, -r * r / 8, r, r * r / 8, st) },
        };
        const which = v.select('average over', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'thin');
        const rS = v.slider('size $r$', 0.004, 0.9, 0.5, { log: true, fmt: (x) => v.fmt(x, 2) });
        const S = v.stage({ x: [-0.7, 0.7], y: [-0.5, 0.5], equal: true, axes: false, height: 320, weight: 1.2 });
        const P = v.stage({ x: [-2.45, 0], y: [-0.08, 1.12], height: 320, weight: 1, minWidth: 240, axes: 'box', xticks: logTicks(-2, 0), yticks: [0, 0.5, 1], title: 'average of $f$ over $E(r)$, against $r$' });
        const RS = logspace(-2.4, Math.log10(0.9), 50);
        const curves = Object.fromEntries(Object.entries(FAM).map(([k, F]) => [k, RS.map((r) => F.inter(r) / F.area(r))]));
        let st = {};
        v.legend(Object.values(FAM).map((F) => [F.color, F.label]).concat([['ink', '$f(0)=0$', { dash: true }]]));
        v.render(() => {
          const F = FAM[which.value], r = rS.value, w = 1.35 * r;
          S.setView([-w * 0.55, w * 1.25], [-w * 0.6, w * 0.6]);
          // the cusp, sampled finely enough at every zoom
          const us = M.linspace(0, Math.min(1, w * 1.4), 300);
          S.poly(us.map((u) => [u, u * u]).concat(us.slice().reverse().map((u) => [u, -u * u])), { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.4 });
          S.circle(0, 0, F.nice && which.value !== 'thin' ? (which.value === 'sq' ? r * Math.sqrt(1.25) : r) : r, { color: 'muted', dash: [4, 4], width: 1 });
          F.draw(S, r, { fill: F.color, fillAlpha: 0.3, color: F.color, width: 2 });
          S.dot(0, 0, { color: 'ink', r: 3.5, label: '0', labelPos: 'w' });
          S.text('C', w * 1.05, (w * 1.05) ** 2 + 0.08 * w, { color: 'accent', math: true, size: 16, baseline: 'bottom' });
          S.corner(`zoom: window width ${v.fmt(1.8 * w, 2)}`, 'bl', { size: 11 });
          P.hline(0, { color: 'ink', dash: [6, 4], width: 1.2 });
          for (const [k, G] of Object.entries(FAM)) P.path(RS.map((s, i) => [Math.log10(s), curves[k][i]]), { color: G.color, width: k === which.value ? 3 : 1.6, alpha: k === which.value ? 1 : 0.55 });
          const avg = F.inter(r) / F.area(r);
          P.vline(Math.log10(r), { color: 'muted', dash: [3, 3], width: 1 });
          P.dot(Math.log10(r), avg, { color: F.color, r: 5.5 });
          st = { r, avg, F, ratio: F.area(r) / (Math.PI * r * r) };
        });
        v.readout(() => `$r=${v.fmt(st.r, 3)}$: average of $f$ over $E(r)$ $=${v.fix(st.avg, 4)}$` + (st.F.nice ? ` $\\to f(0)=0$.` : ` — stays $1\\ne f(0)$; here $m(E)/m(B(0,r))=${v.sci(st.ratio, 2)}\\to0$, so the family is not nicely shrinking.`));
      },
    },
    // ------------------------------------------------------------------ 7.11
    {
      num: '7.11',
      kind: 'Theorem',
      name: 'Fundamental theorem of calculus for Lebesgue integrals',
      credit: 'Lebesgue, 1904',
      statement: String.raw`If $f\in L^1(\R)$ and
$$F(x)=\int_{-\infty}^x f\,dm\qquad(-\infty<x<\infty),$$
then $F'(x)=f(x)$ at every Lebesgue point of $f$; in particular $F'=f$ almost everywhere.`,
      idea: String.raw`For $h>0$,
$$\frac{F(x+h)-F(x)}{h}-f(x)=\frac1h\int_{[x,x+h]}(f-f(x))\,dm ,$$
and the intervals $[x,x+h]$ shrink to $x$ nicely (with $\alpha=\tfrac12$); the same holds for $h<0$ with $[x+h,x]$. So 7.10 gives $F'(x)=f(x)$ at each Lebesgue point. Compare PMA 6.20, where continuity of $f$ at $x$ is assumed.`,
      caption: String.raw`$f$ has a jump at $a$, a single wrong value at $b$ (the dot), and an integrable singularity at $c$. Drag $x$ along the graph of $F$ (it snaps to $a$, $b$, $c$). The lower panel shows the right and left difference quotients of $F$ against $\log|h|$. At ordinary points both converge to $f(x)$. At $a$ they converge to the two one-sided values of $f$; at $b$ they agree, but with the limit of $f$, not with the value $f(b)$; at $c$ they diverge. None of $a$, $b$, $c$ is a Lebesgue point — and they form a null set.`,
      deps: ['rca-7.10', 'rca-7.7', 'rca-7.6'],
      see: ['pma-6.20', 'pma-6.21'],
      tags: ['fundamental theorem of calculus', 'Lebesgue points'],
      viz(v) {
        const M = v.M;
        const A = -0.9, Bp = 0.45, C = 1.35, L0 = -2.5, L1 = 2.5;
        const base = (t) => 0.55 + 0.3 * Math.sin(2 * t);
        const fRaw = (t) => (t < L0 || t > L1 ? 0 : base(t) + (t > A ? 0.6 : 0) + 0.18 / Math.sqrt(Math.abs(t - C)));
        const f = (t) => (t === Bp ? 2.2 : fRaw(t));
        const cl = (t) => M.clamp(t, L0, L1);
        const F = (x) => {
          const t = cl(x);
          const b = 0.55 * (t - L0) - 0.15 * (Math.cos(2 * t) - Math.cos(2 * L0));
          const j = 0.6 * Math.max(0, t - A);
          const sq = (s) => (s <= C ? -2 * Math.sqrt(C - s) : 2 * Math.sqrt(s - C));
          return b + j + 0.18 * (sq(t) - sq(L0));
        };
        const top = v.stage({ x: [-2.3, 2.3], y: [-0.1, 2.7], height: 170, full: true, title: 'the integrand $f$' });
        const mid = v.stage({ x: [-2.3, 2.3], y: [-0.2, 6.3], height: 200, full: true, title: '$F(x)=\\int_{-\\infty}^x f\\,dm$ and the secants from $x$' });
        const bot = v.stage({ x: [-4.1, 0.05], y: [0, 3], height: 190, full: true, axes: 'box', xticks: logTicks(-4, 0), title: 'difference quotients $\\frac{F(x\\pm h)-F(x)}{\\pm h}$ against $|h|$ (log scale)' });
        const hS = v.slider('$|h|$', 0.0005, 0.8, 0.3, { log: true, fmt: (x) => v.fmt(x, 2) });
        const SNAP = [A, Bp, C];
        const xh = mid.handle(Bp, F(Bp), { color: 'accent', label: 'x', labelPos: 'nw', constrain: (x) => { let t = M.clamp(x, -2.2, 2.2); for (const s of SNAP) if (Math.abs(t - s) < 0.05) t = s; return [t, F(t)]; } });
        let st = {};
        v.legend([['accent', 'right quotients ($h>0$)'], ['purple', 'left quotients ($h<0$)'], ['green', '$f(x)$', { dash: true }]]);
        v.render(() => {
          const x = xh.x, h = hS.value;
          xh.y = F(x);
          // top: f with its three special points
          pieces(top, fRaw, -2.3, 2.3, [A, C], { color: 'ink', width: 2, n: 1500 });
          top.dot(Bp, 2.2, { color: 'red', r: 4.5, label: 'f(b)', labelPos: 'e' });
          top.dot(Bp, fRaw(Bp + 1e-9), { hollow: true, r: 4, color: 'ink' });
          for (const [s, lab] of [[A, 'a'], [Bp, 'b'], [C, 'c']]) { top.vline(s, { color: 'muted', dash: [2, 4], width: 1 }); top.text(lab, s, 2.66, { math: true, color: 'muted', dx: 6, baseline: 'top' }); }
          top.vline(x, { color: 'accent', width: 1.2, alpha: 0.6 });
          // middle: F and secants
          mid.fn(F, { color: 'ink', width: 2.2 });
          const xr = x + h, xl = x - h;
          mid.line(x, F(x), xr, F(xr), { color: 'accent', width: 1.8 });
          mid.line(x, F(x), xl, F(xl), { color: 'purple', width: 1.8 });
          mid.dot(xr, F(xr), { color: 'accent', r: 3.5 }); mid.dot(xl, F(xl), { color: 'purple', r: 3.5 });
          // bottom: quotients
          const HS = logspace(-4.1, 0, 120);
          const qr = HS.map((s) => (F(x + s) - F(x)) / s), ql = HS.map((s) => (F(x) - F(x - s)) / s);
          const fx = x === C ? Infinity : f(x);
          const ymax = M.clamp(Math.max(...qr.slice(0, 60), ...ql.slice(0, 60), isFinite(fx) ? fx : 0) * 1.2, 2, 6);
          bot.setView(null, [-0.08 * ymax, ymax]);
          if (isFinite(fx)) bot.hline(fx, { color: 'green', dash: [6, 4], width: 1.6 });
          bot.path(HS.map((s, i) => [Math.log10(s), qr[i]]), { color: 'accent', width: 2.4 });
          bot.path(HS.map((s, i) => [Math.log10(s), ql[i]]), { color: 'purple', width: 2.4, dash: [7, 4] });
          bot.vline(Math.log10(h), { color: 'muted', dash: [3, 3], width: 1 });
          const R0 = qr[0], L00 = ql[0];
          const kind = x === A ? 'jump' : x === Bp ? 'value' : x === C ? 'pole' : 'ok';
          const msg = { ok: 'Lebesgue point: both quotients → f(x)', jump: 'x = a: one-sided limits differ, F′(a) does not exist', value: 'x = b: F′(b) exists but differs from f(b)', pole: 'x = c: quotients → ∞' }[kind];
          bot.corner(msg, 'tr', { color: kind === 'ok' ? 'green' : 'red', weight: 600, size: 11.5 });
          st = { x, h, fx, R: (F(x + h) - F(x)) / h, L: (F(x) - F(x - h)) / h, R0, L00 };
        });
        v.readout(() => `$x=${v.fix(st.x, 3)}$, $|h|=${v.fmt(st.h, 3)}$: $\\;\\frac{F(x+h)-F(x)}{h}=${v.fix(st.R, 4)}$, $\\;\\frac{F(x)-F(x-h)}{h}=${v.fix(st.L, 4)}$, $\\;f(x)=${isFinite(st.fx) ? v.fix(st.fx, 4) : '\\infty'}$.`);
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Definition',
      name: 'Metric density of a measurable set',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 7.12, p. 141'],
      statement: String.raw`Let $E\subset\R^k$ be Lebesgue measurable. The **metric density** of $E$ at a point $x\in\R^k$ is
$$\lim_{r\to0}\frac{m(E\cap B(x,r))}{m(B(x,r))},$$
whenever this limit exists. Applying 7.8 (or 7.10) to $f=\chi_E$ shows that the metric density of $E$ equals $1$ at almost every point of $E$ and $0$ at almost every point of the complement of $E$. In particular, for no $\eps>0$ is there a measurable $E\subset\R$ with $\eps<m(E\cap I)/m(I)<1-\eps$ for every segment $I$.`,
      idea: String.raw`The quotient is $Q_r\mu(x)$ for $d\mu=\chi_E\,dm$, so its limit is $\chi_E(x)$ almost everywhere. The surprising consequence: a measurable set cannot be "evenly spread" at every scale — near almost every point it either fills almost everything or almost nothing. Points where the density is strictly between $0$ and $1$ (or fails to exist) do occur, for instance on the boundary of a polygon, but they always form a null set.`,
      caption: String.raw`$E$ is a polygon. Drag $x$ (it snaps to the vertices) and shrink $r$; the right panel plots $m(E\cap B(x,r))/m(B(x,r))$ against $\log r$, computed exactly. Inside $E$ it tends to $1$, outside to $0$, on an edge to $\tfrac12$, and at a vertex to (interior angle)$/2\pi$ — values other than $0$ and $1$ occur only on the boundary, a set of measure zero.`,
      deps: ['rca-7.8', 'rca-7.10'],
      tags: ['metric density', 'Lebesgue density theorem'],
      viz(v) {
        const M = v.M;
        const E = [[-1.35, -0.9], [1.05, -0.9], [1.05, 0.05], [1.95, 0.55], [0.45, 0.05], [-0.15, 0.05], [-0.15, 0.95], [-1.35, 0.95]];
        const n = E.length;
        const angleAt = (i) => {
          const p = E[i], a = E[(i + n - 1) % n], b = E[(i + 1) % n];
          const t1 = Math.atan2(a[1] - p[1], a[0] - p[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
          let d = t1 - t2; while (d < 0) d += M.TAU; while (d >= M.TAU) d -= M.TAU;
          return M.polyArea(E) > 0 ? d : M.TAU - d; // interior angle for a CCW polygon
        };
        const ANG = E.map((_, i) => angleAt(i));
        const S = v.stage({ x: [-1.65, 2.45], y: [-1.2, 1.25], equal: true, axes: false, height: 320, weight: 1.3 });
        const R = v.stage({ x: [-4.1, 0.1], y: [-0.08, 1.08], height: 320, weight: 1, minWidth: 230, axes: 'box', xticks: logTicks(-4, 0), yticks: [0, 0.25, 0.5, 0.75, 1], title: 'density ratio against $r$ (log scale)' });
        const rS = v.slider('radius $r$', 0.001, 1, 0.22, { log: true, fmt: (x) => v.fmt(x, 2) });
        const xh = S.handle(1.5, 0.35, { color: 'gold', label: 'x', labelPos: 'ne', constrain: (x, y) => { for (const p of E) if (Math.hypot(x - p[0], y - p[1]) < 0.07) return [p[0], p[1]]; return [x, y]; } });
        let st = {};
        v.legend([['accent', '$E$', { area: true }], ['gold', '$E\\cap B(x,r)$', { area: true }], ['gold', 'density ratio']]);
        v.render(() => {
          const x = [xh.x, xh.y], r = rS.value;
          S.poly(E, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          S.circle(x[0], x[1], r, { color: 'gold', width: 2 });
          // shade E ∩ B by clipping: draw the disc with the polygon as clip
          const c = S.ctx; c.save(); c.beginPath(); E.forEach((p, i) => (i ? c.lineTo(S.X(p[0]), S.Y(p[1])) : c.moveTo(S.X(p[0]), S.Y(p[1])))); c.closePath(); c.clip();
          S.circle(x[0], x[1], r, { fill: 'gold', fillAlpha: 0.45, stroke: false }); c.restore();
          const RS = logspace(-4.1, 0.1, 90), ds = RS.map((s) => polyDisc(E, x, s) / (Math.PI * s * s));
          const vi = E.findIndex((p) => p[0] === x[0] && p[1] === x[1]);
          const target = vi >= 0 ? ANG[vi] / M.TAU : null;
          if (target != null) { R.hline(target, { color: 'green', dash: [6, 4], width: 1.5 }); R.text(`angle/2π = ${v.fmt(target, 3)}`, 0.05, target, { dy: target > 0.85 ? 11 : -9, align: 'right', color: 'green', size: 11.5 }); }
          R.path(RS.map((s, i) => [Math.log10(s), ds[i]]), { color: 'gold', width: 2.6 });
          const d = polyDisc(E, x, r) / (Math.PI * r * r);
          R.vline(Math.log10(r), { color: 'muted', dash: [3, 3], width: 1 });
          R.dot(Math.log10(r), d, { color: 'gold', r: 5 });
          if (vi >= 0) S.text(`${v.fmt(ANG[vi] * 180 / Math.PI, 3)}°`, x[0], x[1], { dx: 10, dy: 14, color: 'ink', size: 11.5 });
          st = { r, d, lim: ds[0], vi };
        });
        v.readout(() => `$r=${v.fmt(st.r, 3)}$: $\\;m(E\\cap B(x,r))/m(B(x,r))=${v.fix(st.d, 4)}$; at $r=10^{-4}$ it is $${v.fix(st.lim, 4)}$` + (st.vi >= 0 ? ' (a vertex of $E$).' : Math.abs(st.lim - Math.round(st.lim)) < 1e-3 ? (Math.round(st.lim) === 1 ? ' — $x$ is a density point of $E$.' : ' — $E$ has density $0$ at $x$.') : ' — $x$ lies on the boundary of $E$.'));
      },
    },
    // ------------------------------------------------------------------ 7.1 (restored source number)
    {
      num: '7.1',
      kind: 'Theorem',
      name: 'Derivative of a distribution function via segments',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 7.1, pp. 135–136'],
      statement: String.raw`Let $\mu$ be a complex Borel measure on $\R$ and $F(x)=\mu((-\infty,x])$. For $x\in\R$ and $A\in\C$ the following are equivalent:
(a) $F$ is differentiable at $x$ and $F'(x)=A$;
(b) for every $\eps>0$ there is $\delta>0$ such that $\bigl|\mu(I)/m(I)-A\bigr|<\eps$ for every open segment $I$ that contains $x$ and has length $m(I)<\delta$.`,
      idea: String.raw`For $a<x<b$, $\mu((a,b))=F(b-)-F(a)$. If $F'(x)=A$, then $F$ is continuous at $x$ and both endpoint increments equal $A$ times their distances to $x$, with errors $o(b-x)$ and $o(x-a)$. The estimate for $F(b-)$ follows by taking a left limit in the derivative estimate. Dividing by $b-a$ proves (b), including intervals with atoms at their endpoints. Conversely, (b) excludes an atom at $x$ (otherwise arbitrarily short intervals have unbounded quotients); let one endpoint tend to $x$ to recover each one-sided difference quotient, using continuity of the measure on monotone sets. Symmetric quotients alone are insufficient: they can converge where $F'$ does not.`,
      caption: String.raw`$\mu=f\,dm+c\,\delta_q$ where $f$ has a jump at $a$. Drag $x$ along the graph of $F$ (it snaps to $a$ and $q$) and shrink $\delta$. The square shows every segment $I=(x-s,x+t)$ with $0<s,t<\delta$, coloured by $\mu(I)/m(I)-A$: green where it is within $\eps$ of $A$, blue below, red above. At an ordinary point the whole square turns green as $\delta\to0$. At $a$ the diagonal $s=t$ stays green (the symmetric derivative exists) but the corners never do — $F$ has a corner. At $q$ everything blows up.`,
      deps: ['rca-1.19', 'rca-7.2'],
      tags: ['distribution function', 'derivative of a measure'],
      viz(v) {
        const M = v.M;
        const A0 = 0.5, Q0 = -0.8, CQ = 0.35, L0 = -2.5;
        const f = (t) => (t < L0 ? 0 : 0.6 + 0.35 * Math.sin(1.7 * t) + (t > A0 ? 0.8 : 0));
        const Fc = (t) => { if (t < L0) return 0; return 0.6 * (t - L0) - (0.35 / 1.7) * (Math.cos(1.7 * t) - Math.cos(1.7 * L0)) + 0.8 * Math.max(0, t - A0); };
        const F = (t) => Fc(t) + (t >= Q0 ? CQ : 0);
        const muI = (a, b) => Fc(b) - Fc(a) + (a < Q0 && Q0 < b ? CQ : 0); // μ((a,b))
        const top = v.stage({ x: [-2.2, 2.2], y: [-0.3, 4.6], height: 300, weight: 1.25, title: '$F(x)=\\mu((-\\infty,x])$' });
        const H = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 300, weight: 1, minWidth: 240, axes: 'box', xlabel: 's', ylabel: 't', xticks: [[0, '0'], [1, 'δ']], yticks: [[1, 'δ']], title: '$\\mu(I)/m(I)-A$ over $I=(x-s,x+t)$' });
        const dS = v.slider('$\\delta$', 0.002, 0.8, 0.5, { log: true, fmt: (x) => v.fmt(x, 2) });
        const eS = v.slider('$\\varepsilon$', 0.02, 0.6, 0.15, { step: 0.01 });
        const xh = top.handle(A0, F(A0), { color: 'accent', label: 'x', labelPos: 'nw', constrain: (x) => { let t = M.clamp(x, -2.1, 2.1); for (const s of [A0, Q0]) if (Math.abs(t - s) < 0.06) t = s; return [t, F(t)]; } });
        const G = v.rgb('green'), Bc = v.rgb('blue'), Rc = v.rgb('red');
        let st = {};
        v.legend([['green', '$|\\mu(I)/m(I)-A|<\\varepsilon$', { area: true }], ['blue', 'below $A-\\varepsilon$', { area: true }], ['red', 'above $A+\\varepsilon$', { area: true }]]);
        v.render(() => {
          const x = xh.x, d = dS.value, e = eS.value;
          xh.y = F(x);
          const atA = x === A0, atQ = x === Q0;
          const Aval = atA ? (f(A0 - 1e-9) + f(A0 + 1e-9)) / 2 : f(x);
          top.vband(x - d, x + d, { color: 'orange', alpha: 0.12, edges: true });
          pieces(top, F, -2.2, 2.2, [Q0], { color: 'ink', width: 2.2 });
          top.dot(Q0, F(Q0), { color: 'ink', r: 3.5 }); top.dot(Q0, Fc(Q0), { hollow: true, r: 3.5, color: 'ink' });
          top.text('q', Q0, Fc(Q0), { math: true, dx: 8, dy: 10, color: 'muted' }); top.text('a', A0, F(A0), { math: true, dx: 8, dy: 12, color: 'muted' });
          top.line(x - 0.6, F(x) - 0.6 * Aval, x + 0.6, F(x) + 0.6 * Aval, { color: 'accent', width: 1.2, dash: [5, 4] });
          // heat square: s horizontal, t vertical, both in (0, δ]
          let worst = 0, diagWorst = 0;
          const N = 40;
          for (let i = 1; i <= N; i++) for (let j = 1; j <= N; j++) {
            const s = d * i / N, t = d * j / N, q = muI(x - s, x + t) / (s + t) - Aval;
            worst = Math.max(worst, Math.abs(q)); if (i === j) diagWorst = Math.max(diagWorst, Math.abs(q));
          }
          H.raster((a, b) => {
            if (a <= 0 || b <= 0 || a > 1 || b > 1) return null;
            const s = a * d, t = b * d, q = muI(x - s, x + t) / (s + t) - Aval;
            if (Math.abs(q) < e) return [G[0], G[1], G[2], 150];
            const k = Math.min(1, (Math.abs(q) - e) / (3 * e)), c = q > 0 ? Rc : Bc;
            return [c[0], c[1], c[2], 70 + 150 * k];
          }, { res: 3, key: [x, d, e].join(':') });
          H.line(0, 0, 1, 1, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 });
          H.text('s = t', 0.72, 0.72, { dx: -4, dy: -10, align: 'right', size: 11, color: 'ink' });
          st = { x, d, e, Aval, worst, diagWorst, atA, atQ };
        });
        v.readout(() => `$A=${v.fix(st.Aval, 3)}$${st.atA ? ' (mean of the one-sided derivatives)' : ''}: $\\;\\sup_{0<s,t<\\delta}\\bigl|\\tfrac{\\mu(I)}{m(I)}-A\\bigr|=${st.worst > 1e3 ? '\\infty' : v.fix(st.worst, 3)}$, along the diagonal $s=t$: $${st.diagWorst > 1e3 ? '\\infty' : v.fix(st.diagWorst, 3)}$` + (st.atA ? ' — the symmetric derivative exists, $F\'(a)$ does not.' : st.atQ ? ' — an atom: no derivative.' : '.'));
      },
    },
  ],
};
