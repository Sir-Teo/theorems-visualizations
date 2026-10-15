// Rudin, Principles of Mathematical Analysis — Chapter 9 (part b3): 9.39–9.42
// Derivatives of higher order, the rectangle lemma, equality of mixed partials, and
// differentiation under the integral sign. The chapter title lives in ch09.js.

// ---------------------------------------------------------------- shared helpers
/** Rudin's Exercise 27: g = xy(x²−y²)/(x²+y²), g(0,0) = 0, with its exact partial derivatives. */
const EX27 = {
  f: (x, y) => (x === 0 && y === 0 ? 0 : (x * y * (x * x - y * y)) / (x * x + y * y)),
  d1: (x, y) => (x === 0 && y === 0 ? 0 : (y * (x ** 4 + 4 * x * x * y * y - y ** 4)) / (x * x + y * y) ** 2),
  d2: (x, y) => (x === 0 && y === 0 ? 0 : (x * (x ** 4 - 4 * x * x * y * y - y ** 4)) / (x * x + y * y) ** 2),
  // D21 = D2 D1 and D12 = D1 D2 agree off the origin; at the origin they are −1 and +1
  d21: (x, y) => (x === 0 && y === 0 ? -1 : (x ** 6 + 9 * x ** 4 * y * y - 9 * x * x * y ** 4 - y ** 6) / (x * x + y * y) ** 3),
  d12: (x, y) => (x === 0 && y === 0 ? 1 : (x ** 6 + 9 * x ** 4 * y * y - 9 * x * x * y ** 4 - y ** 6) / (x * x + y * y) ** 3),
  d11: (x, y) => (x === 0 && y === 0 ? 0 : (4 * x * y ** 3 * (3 * y * y - x * x)) / (x * x + y * y) ** 3),
  d22: (x, y) => (x === 0 && y === 0 ? 0 : (4 * x ** 3 * y * (y * y - 3 * x * x)) / (x * x + y * y) ** 3),
};
/** Root of g on (lo, hi) nearest to the middle, by scanning for a sign change and bisecting; falls back to argmin |g|. */
function rootIn(g, lo, hi, n = 400) {
  if (hi < lo) [lo, hi] = [hi, lo];
  const xs = [], gs = [];
  for (let i = 1; i < n; i++) { const x = lo + ((hi - lo) * i) / n; xs.push(x); gs.push(g(x)); }
  let best = null, bd = Infinity; const mid = (lo + hi) / 2;
  for (let i = 0; i + 1 < xs.length; i++) {
    if (gs[i] === 0 || (gs[i] < 0) !== (gs[i + 1] < 0)) {
      let a = xs[i], b = xs[i + 1], ga = gs[i];
      for (let k = 0; k < 50; k++) { const m = (a + b) / 2, gm = g(m); if ((gm < 0) === (ga < 0)) { a = m; ga = gm; } else b = m; }
      const r = (a + b) / 2; if (Math.abs(r - mid) < bd) { bd = Math.abs(r - mid); best = r; }
    }
  }
  if (best != null) return best;
  let j = 0; for (let i = 1; i < gs.length; i++) if (Math.abs(gs[i]) < Math.abs(gs[j])) j = i;
  return xs[j];
}
const fmtM = (v, A, d = 3) => `\\begin{pmatrix}${A.map((r) => r.map((x) => v.fix(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

export default {
  collection: 'pma',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.39 second-order partials
    {
      num: '9.39',
      kind: 'Definition',
      name: 'Second-order partial derivatives; class 𝒞″',
      statement: String.raw`Let $f$ be a real function on an open set $E\subset\R^n$ with partial derivatives $D_1f,\dots,D_nf$. If each $D_jf$ is itself differentiable, the **second-order partial derivatives** of $f$ are
$$D_{ij}f=D_iD_jf\qquad(i,j=1,\dots,n).$$
If all the functions $D_{ij}f$ are continuous in $E$, $f$ is said to be **of class $\mathscr C''(E)$**, written $f\in\mathscr C''(E)$. A mapping $\mathbf f$ of $E$ into $\R^m$ is of class $\mathscr C''$ if each of its components is.`,
      idea: String.raw`In $D_{ij}f=D_i(D_jf)$ the operator next to $f$ acts first: differentiate in $x_j$, then in $x_i$. Whether the order matters is the subject of 9.40–9.41: for $f\in\mathscr C''$ it does not, so the matrix $\big(D_{ij}f(\mathbf x)\big)$ is symmetric. Continuity is essential: Rudin's Exercise 27, $f=xy\,\frac{x^2-y^2}{x^2+y^2}$, has all second partials at every point, yet $D_{12}f(0,0)=1\ne-1=D_{21}f(0,0)$.`,
      caption: String.raw`The four second-order partials of $f$ as heat maps (blue $>0$, red $<0$), with a shared draggable point $\mathbf p$. For the smooth $f$ the two mixed-partial maps, $D_{12}f$ and $D_{21}f$, are identical and continuous. For Exercise 27 they agree off the origin but swirl through every value in $[-\sqrt2,\sqrt2]$ near it — none of the four is continuous at $\mathbf 0$, so $f\notin\mathscr C''$; put $\mathbf p$ at the origin (it snaps) to see $D_{12}f\ne D_{21}f$.`,
      deps: ['pma-9.16', 'pma-9.21'],
      tags: ['higher derivatives', 'several variables'],
      viz(v) {
        const SM = {
          f: (x, y) => Math.sin(1.6 * x) * Math.cos(y) + 0.3 * x * y * y,
          d11: (x, y) => -2.56 * Math.sin(1.6 * x) * Math.cos(y),
          d22: (x, y) => -Math.sin(1.6 * x) * Math.cos(y) + 0.6 * x,
          d12: (x, y) => -1.6 * Math.cos(1.6 * x) * Math.sin(y) + 0.6 * y,
          d21: (x, y) => -1.6 * Math.cos(1.6 * x) * Math.sin(y) + 0.6 * y,
        };
        const FN = { sm: { label: '$\\sin(1.6x)\\cos y+0.3xy^2$', F: SM, R: 2.6, view: 1.6 }, ex: { label: 'Exercise 27: $xy\\frac{x^2-y^2}{x^2+y^2}$', F: EX27, R: 2, view: 1 } };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sm');
        const KEYS = [['d11', '$D_{11}f$'], ['d12', '$D_{12}f=D_1(D_2f)$'], ['d21', '$D_{21}f=D_2(D_1f)$'], ['d22', '$D_{22}f$']];
        const S = KEYS.map(([, t]) => v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 210, minWidth: 330, title: t }));
        let P = [0.7, 0.45];
        const snap = (x, y) => (which.value === 'ex' && Math.hypot(x, y) < 0.06 ? [0, 0] : [x, y]);
        const H = S.map((s) => s.handle(P[0], P[1], { color: 'gold', r: 6, constrain: snap }));
        H.forEach((h) => { h.onDrag = () => { P = [h.x, h.y]; H.forEach((g) => { g.x = P[0]; g.y = P[1]; }); }; });
        let last = null, st = null;
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) { last = which.value; const w = F.view; S.forEach((s) => s.setView([-w, w], [-w, w])); P = which.value === 'ex' ? [0.35, 0.2] : [0.7, 0.45]; H.forEach((g) => { g.x = P[0]; g.y = P[1]; }); }
          KEYS.forEach(([k], i) => {
            S[i].heat((x, y) => -F.F[k](x, y), { range: [-F.R, F.R], cmap: 'diverging', res: 2, key: `${which.value}|${k}|${v.color('panel')}` });
            S[i].axes();
            const val = F.F[k](P[0], P[1]);
            S[i].corner(`${v.fix(val, 3)}`, 'tr', { color: 'ink', weight: 600 });
          });
          st = { F: F.F, P };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const [x, y] = s.P, H2 = [[s.F.d11(x, y), s.F.d12(x, y)], [s.F.d21(x, y), s.F.d22(x, y)]];
          return `At $\\mathbf p=(${v.fix(x, 2)},\\,${v.fix(y, 2)})$: $\\big(D_{ij}f(\\mathbf p)\\big)=${fmtM(v, H2)}$, $\\;|D_{12}f-D_{21}f|=${v.fix(Math.abs(H2[0][1] - H2[1][0]), 3)}$` + (Math.abs(H2[0][1] - H2[1][0]) > 1e-9 ? ' — the mixed partials differ here.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.40 rectangle lemma
    {
      num: '9.40',
      kind: 'Theorem',
      name: 'Second difference over a rectangle',
      statement: String.raw`Suppose $f$ is defined in an open set $E\subset\R^2$ and $D_1f$ and $D_{21}f$ exist at every point of $E$. Let $Q\subset E$ be a closed rectangle with sides parallel to the coordinate axes and opposite vertices $(a,b)$ and $(a+h,b+k)$, where $h\ne0$, $k\ne0$, and put
$$\Delta(f,Q)=f(a+h,b+k)-f(a+h,b)-f(a,b+k)+f(a,b).$$
Then there is a point $(x,y)$ in the interior of $Q$ such that $\Delta(f,Q)=hk\,(D_{21}f)(x,y)$.`,
      idea: String.raw`Let $u(t)=f(t,b+k)-f(t,b)$, so that $\Delta(f,Q)=u(a+h)-u(a)$. The mean value theorem (5.10) gives $x$ between $a$ and $a+h$ with $\Delta(f,Q)=h\,u'(x)=h\big[(D_1f)(x,b+k)-(D_1f)(x,b)\big]$. Applied once more, to $s\mapsto(D_1f)(x,s)$ on the interval between $b$ and $b+k$, it yields $y$ with $(D_1f)(x,b+k)-(D_1f)(x,b)=k\,(D_{21}f)(x,y)$.`,
      caption: String.raw`Drag the corners of $Q$. Top: $D_{21}f$ as a heat map, the green level curve $\{D_{21}f=\Delta(f,Q)/hk\}$ (it must cross the interior of $Q$), and the point $(x,y)$ produced by the proof. Bottom: the two mean value steps — $u(t)=f(t,b+k)-f(t,b)$ with its secant and the parallel tangent at $x$, then $s\mapsto D_1f(x,s)$ with its secant and the parallel tangent at $y$.`,
      deps: ['pma-5.10', 'pma-9.39'],
      tags: ['higher derivatives', 'mean value theorem'],
      viz(v) {
        const M = v.M;
        const FN = {
          a: {
            label: '$\\sin(1.3x)\\cos y+\\frac14x^2y$',
            f: (x, y) => Math.sin(1.3 * x) * Math.cos(y) + 0.25 * x * x * y,
            d1: (x, y) => 1.3 * Math.cos(1.3 * x) * Math.cos(y) + 0.5 * x * y,
            d21: (x, y) => -1.3 * Math.cos(1.3 * x) * Math.sin(y) + 0.5 * x,
          },
          b: {
            label: '$e^{0.6xy}\\cos x$',
            f: (x, y) => Math.exp(0.6 * x * y) * Math.cos(x),
            d1: (x, y) => Math.exp(0.6 * x * y) * (0.6 * y * Math.cos(x) - Math.sin(x)),
            d21: (x, y) => Math.exp(0.6 * x * y) * (0.6 * x * (0.6 * y * Math.cos(x) - Math.sin(x)) + 0.6 * Math.cos(x)),
          },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'a');
        const T = v.stage({ x: [-2.4, 2.4], y: [-1.6, 1.6], equal: true, height: 300, full: true, title: '$D_{21}f$, the rectangle $Q$ and the point $(x,y)$' });
        const U = v.stage({ x: [0, 1], y: [0, 1], height: 190, axes: 'box', title: 'step 1: $u(t)=f(t,b+k)-f(t,b)$' });
        const W = v.stage({ x: [0, 1], y: [0, 1], height: 190, axes: 'box', title: 'step 2: $s\\mapsto D_1f(x,s)$' });
        const c0 = T.handle(-0.6, -0.5, { color: 'accent', label: '(a,b)', labelPos: 'sw' });
        const c1 = T.handle(0.9, 0.7, { color: 'accent', label: '(a+h, b+k)', labelPos: 'ne' });
        let st = null;
        v.render(() => {
          const F = FN[which.value];
          const a = c0.x, b = c0.y, h = c1.x - c0.x, k = c1.y - c0.y;
          T.heat((x, y) => -F.d21(x, y), { range: [-2, 2], cmap: 'diverging', res: 3, alpha: 0.75, key: `${which.value}|${v.color('panel')}` });
          T.axes();
          const ok = Math.abs(h) > 1e-3 && Math.abs(k) > 1e-3;
          T.rect(a, b, a + h, b + k, { color: 'ink', width: 2, fill: 'panel', fillAlpha: 0.12 });
          if (!ok) { T.corner('h and k must be nonzero', 'tl', { color: 'red', weight: 600 }); st = null; return; }
          const D = F.f(a + h, b + k) - F.f(a + h, b) - F.f(a, b + k) + F.f(a, b), q = D / (h * k);
          // the whole level set {D21 f = q}, emphasised inside Q
          const lvl = [], [X0, X1] = T.bounds.x, [Y0, Y1] = T.bounds.y, nx = 150, ny = 100;
          const g = (x, y) => F.d21(x, y) - q;
          for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            const x0 = X0 + ((X1 - X0) * i) / nx, x1 = X0 + ((X1 - X0) * (i + 1)) / nx, y0 = Y0 + ((Y1 - Y0) * j) / ny, y1 = Y0 + ((Y1 - Y0) * (j + 1)) / ny;
            const vs = [g(x0, y0), g(x1, y0), g(x1, y1), g(x0, y1)], P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], pts = [];
            for (let e = 0; e < 4; e++) { const p = vs[e], r = vs[(e + 1) % 4]; if ((p < 0) !== (r < 0)) { const t = p / (p - r); pts.push([P[e][0] + t * (P[(e + 1) % 4][0] - P[e][0]), P[e][1] + t * (P[(e + 1) % 4][1] - P[e][1])]); } }
            if (pts.length >= 2) lvl.push(pts[0], pts[1], null);
          }
          T.path(lvl, { color: 'green', width: 1.2, alpha: 0.55 });
          const inQ = (p) => p && p[0] > Math.min(a, a + h) && p[0] < Math.max(a, a + h) && p[1] > Math.min(b, b + k) && p[1] < Math.max(b, b + k);
          T.path(lvl.map((p) => (inQ(p) ? p : null)), { color: 'green', width: 3.2 });
          // the proof: two mean value steps
          const u = (t) => F.f(t, b + k) - F.f(t, b), du = (t) => F.d1(t, b + k) - F.d1(t, b);
          const x = rootIn((t) => du(t) - D / h, a, a + h);
          const w = (s) => F.d1(x, s);
          const y = rootIn((s) => F.d21(x, s) - q, b, b + k);
          T.line(x, Math.min(b, b + k), x, Math.max(b, b + k), { color: 'gold', width: 1.2, dash: [4, 3] });
          T.dot(x, y, { color: 'gold', r: 6, label: '(x, y)', labelPos: 'e' });
          // step 1 panel
          const lo = Math.min(a, a + h), hi = Math.max(a, a + h), pad = (hi - lo) * 0.08;
          let ymin = Infinity, ymax = -Infinity; for (let i = 0; i <= 80; i++) { const val = u(lo + ((hi - lo) * i) / 80); ymin = Math.min(ymin, val); ymax = Math.max(ymax, val); }
          const yp = Math.max(ymax - ymin, 0.05) * 0.25; U.setView([lo - pad, hi + pad], [ymin - yp, ymax + yp]);
          U.fn(u, { domain: [lo, hi], color: 'ink', width: 2 });
          U.line(a, u(a), a + h, u(a + h), { color: 'muted', width: 1.4, dash: [5, 4] });
          const ux = u(x), sl1 = du(x), L1 = (hi - lo) * 0.3;
          U.line(x - L1, ux - sl1 * L1, x + L1, ux + sl1 * L1, { color: 'gold', width: 2 });
          U.dot(x, ux, { color: 'gold', r: 4.5, label: 'x', labelPos: 's' });
          // step 2 panel
          const lo2 = Math.min(b, b + k), hi2 = Math.max(b, b + k), pad2 = (hi2 - lo2) * 0.08;
          ymin = Infinity; ymax = -Infinity; for (let i = 0; i <= 80; i++) { const val = w(lo2 + ((hi2 - lo2) * i) / 80); ymin = Math.min(ymin, val); ymax = Math.max(ymax, val); }
          const yp2 = Math.max(ymax - ymin, 0.05) * 0.25; W.setView([lo2 - pad2, hi2 + pad2], [ymin - yp2, ymax + yp2]);
          W.fn(w, { domain: [lo2, hi2], color: 'ink', width: 2 });
          W.line(b, w(b), b + k, w(b + k), { color: 'muted', width: 1.4, dash: [5, 4] });
          const wy = w(y), sl2 = F.d21(x, y), L2 = (hi2 - lo2) * 0.3;
          W.line(y - L2, wy - sl2 * L2, y + L2, wy + sl2 * L2, { color: 'gold', width: 2 });
          W.dot(y, wy, { color: 'gold', r: 4.5, label: 'y', labelPos: 's' });
          st = { D, h, k, q, x, y, d21: F.d21(x, y) };
          v.legend([['green', 'level curve $D_{21}f=\\Delta(f,Q)/hk$'], ['gold', 'the proof\'s point and tangents'], ['muted', 'secants', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return 'Make both sides of $Q$ nonzero.';
          return `$\\Delta(f,Q)=${v.fix(s.D, 4)}$, $\\;hk=${v.fix(s.h * s.k, 4)}$, $\\;\\Delta/hk=${v.fix(s.q, 4)}$; $\\;$ at $(x,y)=(${v.fix(s.x, 3)},\\,${v.fix(s.y, 3)})$: $\\;D_{21}f(x,y)=${v.fix(s.d21, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.41 equality of mixed partials
    {
      num: '9.41',
      kind: 'Theorem',
      name: 'Equality of mixed partial derivatives',
      statement: String.raw`Suppose $f$ is defined in an open set $E\subset\R^2$, that $D_1f$, $D_{21}f$ and $D_2f$ exist at every point of $E$, and that $D_{21}f$ is continuous at some point $(a,b)\in E$. Then $D_{12}f$ exists at $(a,b)$ and
$$(D_{12}f)(a,b)=(D_{21}f)(a,b).$$`,
      idea: String.raw`Put $A=(D_{21}f)(a,b)$ and fix $\eps>0$. For every small rectangle $Q$ with vertices $(a,b)$ and $(a+h,b+k)$, 9.40 writes $\Delta(f,Q)/hk$ as a value of $D_{21}f$ inside $Q$, so continuity at $(a,b)$ gives $|\Delta(f,Q)/hk-A|<\eps$. Keep $h$ fixed and let $k\to0$: because $D_2f$ exists, $\Delta(f,Q)/hk\to\big[(D_2f)(a+h,b)-(D_2f)(a,b)\big]/h$, which therefore stays within $\eps$ of $A$. These are precisely the difference quotients defining $D_1(D_2f)=D_{12}f$ at $(a,b)$.`,
      caption: String.raw`Top left: $D_{21}f$ near the base point $(a,b)$ (drag it). Top right: $\Delta(f,Q)/hk$ for the rectangle with corners $(a,b)$, $(a+h,b+k)$, as a function of $(h,k)$; drag the gold $(h,k)$ and follow the two routes to $(0,0)$. Bottom: the quotients after the first limit — letting $k\to0$ leaves $[D_2f(a+h,b)-D_2f(a,b)]/h\to D_{12}f$ (blue), letting $h\to0$ leaves $[D_1f(a,b+k)-D_1f(a,b)]/k\to D_{21}f$ (orange). For the smooth $f$ they meet. For Exercise 27 at the origin $\Delta/hk=\frac{h^2-k^2}{h^2+k^2}$ depends only on the direction, $D_{21}f$ is discontinuous there, and the limits are $+1$ and $-1$.`,
      deps: ['pma-9.40', 'pma-9.39'],
      tags: ['higher derivatives', 'several variables'],
      viz(v) {
        const SM = {
          f: (x, y) => Math.sin(2 * x) * Math.cos(y) + 0.5 * x * y * y,
          d1: (x, y) => 2 * Math.cos(2 * x) * Math.cos(y) + 0.5 * y * y,
          d2: (x, y) => -Math.sin(2 * x) * Math.sin(y) + x * y,
          d21: (x, y) => -2 * Math.cos(2 * x) * Math.sin(y) + y,
          d12: (x, y) => -2 * Math.cos(2 * x) * Math.sin(y) + y,
        };
        const FN = { ex: { label: 'Exercise 27: $xy\\frac{x^2-y^2}{x^2+y^2}$', F: EX27, p: [0, 0], R: 1.5 }, sm: { label: '$\\sin 2x\\cos y+\\frac12xy^2$', F: SM, p: [0.35, 0.45], R: 2.5 } };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'ex');
        const del = 0.6;
        const L = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 270, minWidth: 300, title: '$D_{21}f$ near $(a,b)$' });
        const R = v.stage({ x: [-del, del], y: [-del, del], equal: true, height: 270, minWidth: 300, xlabel: 'h', ylabel: 'k', title: '$\\Delta(f,Q)/hk$ as a function of $(h,k)$' });
        const B = v.stage({ x: [-del, del], y: [-1.6, 1.6], height: 190, full: true, axes: true, title: 'after the first limit: $\\frac{D_2f(a+h,b)-D_2f(a,b)}{h}$ (blue, against $h$) and $\\frac{D_1f(a,b+k)-D_1f(a,b)}{k}$ (orange, against $k$)' });
        const hb = L.handle(0, 0, { color: 'accent', label: '(a,b)', labelPos: 'ne', constrain: (x, y) => (Math.hypot(x, y) < 0.05 ? [0, 0] : [x, y]) });
        const hk = R.handle(0.4, 0.22, { color: 'gold', label: '(h,k)', labelPos: 'ne' });
        let last = null, st = null;
        v.render(() => {
          const Fo = FN[which.value], F = Fo.F;
          if (last !== which.value) { last = which.value; hb.x = Fo.p[0]; hb.y = Fo.p[1]; }
          const a = hb.x, b = hb.y;
          L.setView([a - 1, a + 1], [b - 1, b + 1]);
          L.heat((x, y) => -F.d21(x, y), { range: [-Fo.R, Fo.R], cmap: 'diverging', res: 2, key: `${which.value}|${a}|${b}|${v.color('panel')}` });
          L.axes();
          const q = (h, k) => (F.f(a + h, b + k) - F.f(a + h, b) - F.f(a, b + k) + F.f(a, b)) / (h * k);
          R.heat((h, k) => (Math.abs(h * k) < 1e-12 ? NaN : -q(h, k)), { range: [-Fo.R, Fo.R], cmap: 'diverging', res: 2, key: `${which.value}|${a}|${b}|${v.color('panel')}` });
          R.axes();
          const H = hk.x, K = hk.y;
          // the two routes to (0,0)
          R.arrow(H, K, H, 0, { color: 'blue', width: 2, dash: [5, 4] }); R.arrow(H, 0, 0, 0, { color: 'blue', width: 2.6 });
          R.arrow(H, K, 0, K, { color: 'orange', width: 2, dash: [5, 4] }); R.arrow(0, K, 0, 0, { color: 'orange', width: 2.6 });
          R.text('k → 0 first', H, 0, { color: 'blue', dy: K > 0 ? 14 : -14, align: 'center', size: 11.5 });
          R.text('h → 0 first', 0, K, { color: 'orange', dx: H > 0 ? -8 : 8, align: H > 0 ? 'right' : 'left', size: 11.5 });
          // iterated quotients
          const g1 = (h) => (F.d2(a + h, b) - F.d2(a, b)) / h, g2 = (k) => (F.d1(a, b + k) - F.d1(a, b)) / k;
          let lo = Infinity, hi = -Infinity; for (let i = 1; i <= 60; i++) { const t = (del * i) / 60; for (const val of [g1(t), g1(-t), g2(t), g2(-t)]) if (isFinite(val)) { lo = Math.min(lo, val); hi = Math.max(hi, val); } }
          const pd = Math.max(0.4, (hi - lo) * 0.25); B.setView(null, [lo - pd, hi + pd]);
          B.fn((t) => (Math.abs(t) < 1e-9 ? NaN : g1(t)), { color: 'blue', width: 2.4 });
          B.fn((t) => (Math.abs(t) < 1e-9 ? NaN : g2(t)), { color: 'orange', width: 2.4 });
          const d12 = F.d12 ? F.d12(a, b) : g1(1e-5), d21 = F.d21(a, b);
          B.dot(0, d12, { color: 'blue', r: 5.5, hollow: true, width: 2.2, label: `D₁₂f = ${v.fix(d12, 3)}`, labelPos: 'ne' });
          B.dot(0, d21, { color: 'orange', r: 5.5, hollow: true, width: 2.2, label: `D₂₁f = ${v.fix(d21, 3)}`, labelPos: 'se' });
          B.dot(H, g1(H), { color: 'blue', r: 3.5 }); B.dot(K, g2(K), { color: 'orange', r: 3.5 });
          const agree = Math.abs(d12 - d21) < 1e-4;
          L.corner(agree ? 'D₂₁f continuous at (a,b)' : 'D₂₁f is not continuous at (a,b)', 'tl', { color: agree ? 'green' : 'red', weight: 600 });
          st = { a, b, d12, d21, qv: q(H, K), H, K, agree };
          v.legend([['blue', 'route $k\\to0$, then $h\\to0$: $D_{12}f$'], ['orange', 'route $h\\to0$, then $k\\to0$: $D_{21}f$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$(a,b)=(${v.fix(s.a, 2)},\\,${v.fix(s.b, 2)})$, $\\;\\Delta(f,Q)/hk=${v.fix(s.qv, 4)}$ at $(h,k)=(${v.fix(s.H, 2)},${v.fix(s.K, 2)})$; $\\;D_{12}f(a,b)=${v.fix(s.d12, 4)}$, $\\;D_{21}f(a,b)=${v.fix(s.d21, 4)}$` + (s.agree ? ' — equal, as the theorem predicts.' : ' — different: the continuity hypothesis fails at this point.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.41a corollary
    {
      num: '9.41a',
      kind: 'Corollary',
      name: 'Mixed partials of a 𝒞″ function commute',
      verify: true,
      statement: String.raw`If $f\in\mathscr C''(E)$ for an open set $E\subset\R^2$, then $D_{21}f=D_{12}f$ at every point of $E$.`,
      idea: String.raw`A $\mathscr C''$ function satisfies the hypotheses of 9.41 at every point. Consequently the matrix of second partials is symmetric, and so is the second directional derivative: $D_{\mathbf v}D_{\mathbf u}f=\sum_{i,j}v_iu_j\,D_{ij}f$ is unchanged when $\mathbf u$ and $\mathbf v$ are swapped. (The same argument in each pair of variables gives the result in $\R^n$, and by induction for derivatives of every order.)`,
      caption: String.raw`Left: level curves of $f$ and a parallelogram at $\mathbf p$ with sides $\varepsilon\mathbf u$ (blue) and $\varepsilon\mathbf v$ (orange); drag $\mathbf p$ and the tips. Right: the same parallelogram lifted to the graph. Its fourth corner misses the plane through the other three by the second difference $\Delta=f(\mathbf p+\varepsilon\mathbf u+\varepsilon\mathbf v)-f(\mathbf p+\varepsilon\mathbf u)-f(\mathbf p+\varepsilon\mathbf v)+f(\mathbf p)$ (red), and $\Delta/\varepsilon^2$ tends to both $D_{\mathbf v}D_{\mathbf u}f$ and $D_{\mathbf u}D_{\mathbf v}f$. For Exercise 27 at the origin the two iterated derivatives differ.`,
      deps: ['pma-9.41', 'pma-9.39'],
      tags: ['higher derivatives', 'several variables'],
      viz(v) {
        const M = v.M;
        const SM = { f: (x, y) => 0.55 * Math.sin(1.4 * x) * Math.cos(1.1 * y) + 0.18 * x * y };
        const FN = { sm: { label: 'a $\\mathscr C^\\infty$ function', f: SM.f, p: [0.05, -0.85] }, ex: { label: 'Exercise 27, halved: $\\frac12xy\\frac{x^2-y^2}{x^2+y^2}$', f: (x, y) => 0.5 * EX27.f(x, y), p: [0, 0] } };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sm');
        const eps = v.slider('$\\varepsilon$', 0.02, 1, 0.4, { log: true });
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 330, title: 'level curves of $f$ and the stencil at $\\mathbf p$' });
        const S3 = v.stage3d({ range: 1.5, height: 330, yaw: -0.6, pitch: 0.5, labels: ['x', 'y', 'f'], axisLength: 1.3, title: 'the graph of $f$ and the lifted stencil' });
        const hp = L.handle(0.05, -0.85, { color: 'gold', label: 'p', labelPos: 'sw', constrain: (x, y) => (which.value === 'ex' && Math.hypot(x, y) < 0.06 ? [0, 0] : [x, y]) });
        let U = [1, 0.15], V = [-0.1, 1];
        const hu = L.handle(0, 0, { color: 'blue', r: 6, label: 'u', constrain: (x, y) => [x, y] });
        const hv = L.handle(0, 0, { color: 'orange', r: 6, label: 'v', constrain: (x, y) => [x, y] });
        const SC = 0.9; // a handle sits at p + SC·u
        hu.onDrag = () => { U = [(hu.x - hp.x) / SC, (hu.y - hp.y) / SC]; };
        hv.onDrag = () => { V = [(hv.x - hp.x) / SC, (hv.y - hp.y) / SC]; };
        let last = null, st = null, segCache = null;
        // iterated directional derivatives D_b(D_a f)(p), inner step much smaller than the outer one
        const DD = (f, p, a, b) => {
          const H = 1e-3, k = 1e-6;
          const Da = (q) => (f(q[0] + k * a[0], q[1] + k * a[1]) - f(q[0] - k * a[0], q[1] - k * a[1])) / (2 * k);
          return (Da([p[0] + H * b[0], p[1] + H * b[1]]) - Da([p[0] - H * b[0], p[1] - H * b[1]])) / (2 * H);
        };
        v.render(() => {
          const F = FN[which.value], f = F.f;
          if (last !== which.value) { last = which.value; hp.x = F.p[0]; hp.y = F.p[1]; U = which.value === 'ex' ? [1, 0] : [1, 0.15]; V = which.value === 'ex' ? [0, 1] : [-0.1, 1]; }
          if (!hu.dragging) { hu.x = hp.x + SC * U[0]; hu.y = hp.y + SC * U[1]; }
          if (!hv.dragging) { hv.x = hp.x + SC * V[0]; hv.y = hp.y + SC * V[1]; }
          const p = [hp.x, hp.y], e = eps.value;
          // level curves (cached: they depend only on f and the view)
          const [X0, X1] = L.bounds.x, [Y0, Y1] = L.bounds.y, ckey = `${which.value}|${X0}|${X1}|${Y0}|${Y1}`;
          if (!segCache || segCache.key !== ckey) {
            const nx = 120, ny = 120, G = [], segs = [];
            for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) row.push(f(X0 + ((X1 - X0) * i) / nx, Y0 + ((Y1 - Y0) * j) / ny)); G.push(row); }
            for (const lv of M.linspace(-0.65, 0.65, 14)) {
              for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
                const x0 = X0 + ((X1 - X0) * i) / nx, x1 = X0 + ((X1 - X0) * (i + 1)) / nx, y0 = Y0 + ((Y1 - Y0) * j) / ny, y1 = Y0 + ((Y1 - Y0) * (j + 1)) / ny;
                const P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], vs = [G[j][i] - lv, G[j][i + 1] - lv, G[j + 1][i + 1] - lv, G[j + 1][i] - lv], pts = [];
                for (let r = 0; r < 4; r++) { const s0 = vs[r], s1 = vs[(r + 1) % 4]; if ((s0 < 0) !== (s1 < 0)) { const t = s0 / (s0 - s1); pts.push([P[r][0] + t * (P[(r + 1) % 4][0] - P[r][0]), P[r][1] + t * (P[(r + 1) % 4][1] - P[r][1])]); } }
                if (pts.length >= 2) segs.push(pts[0], pts[1], null);
              }
            }
            segCache = { key: ckey, segs };
          }
          const segs = segCache.segs;
          L.path(segs, { color: 'faint', width: 1 });
          const q1 = [p[0] + e * U[0], p[1] + e * U[1]], q3 = [p[0] + e * V[0], p[1] + e * V[1]], q2 = [q1[0] + e * V[0], q1[1] + e * V[1]];
          L.poly([p, q1, q2, q3], { color: 'ink', width: 1.2, fill: 'gold', fillAlpha: 0.15 });
          L.line(p[0], p[1], hu.x, hu.y, { color: 'blue', width: 1.2, dash: [4, 3] }); L.line(p[0], p[1], hv.x, hv.y, { color: 'orange', width: 1.2, dash: [4, 3] });
          L.arrow(p[0], p[1], q1[0], q1[1], { color: 'blue', width: 2.4 }); L.arrow(p[0], p[1], q3[0], q3[1], { color: 'orange', width: 2.4 });
          // 3D: the surface and the lifted stencil
          const Z = (x, y) => f(x, y);
          S3.surface((x, y) => [x, y, Z(x, y)], [-1.2, 1.2], [-1.2, 1.2], { n: 30, color: 'teal', alpha: 0.55, wire: true });
          const P0 = [p[0], p[1], Z(...p)], P1 = [q1[0], q1[1], Z(...q1)], P2 = [q2[0], q2[1], Z(...q2)], P3 = [q3[0], q3[1], Z(...q3)];
          const P2lin = [P1[0] + P3[0] - P0[0], P1[1] + P3[1] - P0[1], P1[2] + P3[2] - P0[2]];
          S3.poly([P0, P1, P2lin, P3], { fill: 'gold', fillAlpha: 0.25, color: 'gold', alpha: 0.9, width: 1.5, bias: -0.3 });
          S3.line(P0, P1, { color: 'blue', width: 2.6, bias: -0.4 }); S3.line(P0, P3, { color: 'orange', width: 2.6, bias: -0.4 });
          S3.line(P1, P2, { color: 'orange', width: 1.6, dash: [4, 3], bias: -0.4 }); S3.line(P3, P2, { color: 'blue', width: 1.6, dash: [4, 3], bias: -0.4 });
          S3.line(P2lin, P2, { color: 'red', width: 3, bias: -0.5 });
          S3.dot(P2, { color: 'red', r: 4.5, bias: -0.5 }); S3.dot(P0, { color: 'gold', r: 5, label: 'p', bias: -0.5 });
          const Dl = f(...q2) - f(...q1) - f(...q3) + f(...p);
          const dvu = DD(f, p, U, V), duv = DD(f, p, V, U);
          st = { Dl, e, dvu, duv, U, V };
          v.legend([['blue', '$\\varepsilon\\mathbf u$'], ['orange', '$\\varepsilon\\mathbf v$'], ['red', 'the second difference $\\Delta$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const same = Math.abs(s.dvu - s.duv) < 1e-4;
          return `$\\Delta/\\varepsilon^2=${v.fix(s.Dl / (s.e * s.e), 4)}$; $\\;D_{\\mathbf v}(D_{\\mathbf u}f)(\\mathbf p)=${v.fix(s.dvu, 4)}$, $\\;D_{\\mathbf u}(D_{\\mathbf v}f)(\\mathbf p)=${v.fix(s.duv, 4)}$` + (same ? ' — equal, as they must be for $f\\in\\mathscr C\'\'$.' : ' — different: $f$ is not $\\mathscr C\'\'$ near this point.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.42 differentiation under the integral sign
    {
      num: '9.42',
      kind: 'Theorem',
      name: 'Differentiation under the integral sign',
      statement: String.raw`Suppose
(a) $\varphi(x,t)$ is defined for $a\le x\le b$, $c\le t\le d$;
(b) $\alpha$ is an increasing function on $[a,b]$;
(c) $\varphi^t\in\mathscr R(\alpha)$ for every $t\in[c,d]$, where $\varphi^t(x)=\varphi(x,t)$;
(d) $c<s<d$, and to every $\eps>0$ there is $\delta>0$ such that $|(D_2\varphi)(x,t)-(D_2\varphi)(x,s)|<\eps$ for all $x\in[a,b]$ and all $t\in(s-\delta,s+\delta)$.

Define $f(t)=\int_a^b\varphi(x,t)\,d\alpha(x)$ for $c\le t\le d$. Then $(D_2\varphi)^s\in\mathscr R(\alpha)$, $f'(s)$ exists, and
$$f'(s)=\int_a^b(D_2\varphi)(x,s)\,d\alpha(x).$$`,
      idea: String.raw`Consider the difference quotients $\psi(x,t)=\frac{\varphi(x,t)-\varphi(x,s)}{t-s}$. By the mean value theorem (5.10), $\psi(x,t)=(D_2\varphi)(x,u)$ for some $u$ between $s$ and $t$, so hypothesis (d) gives $|\psi(x,t)-(D_2\varphi)(x,s)|<\eps$ for all $x$ once $0<|t-s|<\delta$: the quotients converge to $(D_2\varphi)^s$ *uniformly* on $[a,b]$. Since $\int\psi^t\,d\alpha=\frac{f(t)-f(s)}{t-s}$, the theorem on integrating uniform limits (7.16) finishes the proof. Rudin's Example 9.43 uses it to evaluate $\int_{-\infty}^{\infty}e^{-x^2}\cos(xt)\,dx=\sqrt\pi\,e^{-t^2/4}$.`,
      caption: String.raw`Pick an integrand and an integrator $\alpha$ ($\alpha(x)=x$, or $x$ plus a unit jump at the marked point, which adds $\varphi(\cdot,t)$ evaluated there), and move $s$. Top: $x\mapsto\varphi(x,s)$ and $x\mapsto D_2\varphi(x,s)$, dashed at a nearby $t=s+\eta$; the readout tracks $\sup_x|D_2\varphi(x,s\pm\eta)-D_2\varphi(x,s)|$, which hypothesis (d) requires to tend to $0$ with $\eta$. Bottom: $f(t)=\int\varphi(x,t)\,d\alpha(x)$, with the green tangent of slope $\int D_2\varphi(x,s)\,d\alpha(x)$. In the tent example ($\varphi(\cdot,t)$ a tent of height $\sqrt t$ on $[0,2\sqrt t]$, odd in $t$) the tent sweeps past every $x$ so fast that hypothesis (d) fails at $s=0$: $D_2\varphi(x,0)=0$ for every $x$, yet $f(t)=t$ has slope $1$.`,
      deps: ['pma-5.10', 'pma-7.16', 'pma-6.2'],
      see: ['rca-1.34'],
      tags: ['integration', 'uniform convergence', 'differentiation'],
      viz(v) {
        const M = v.M;
        const tent = (x, t) => { const r = Math.sqrt(Math.abs(t)), sg = Math.sign(t); if (r === 0 || x >= 2 * r) return 0; return sg * (x <= r ? x : 2 * r - x); };
        const tentD = (x, t) => { const r = Math.sqrt(Math.abs(t)); if (r === 0) return 0; return x > r && x < 2 * r ? 1 / r : 0; };
        const PH = {
          gauss: { label: 'Example 9.43: $e^{-x^2}\\cos xt$', a: -4, b: 4, c: -4, d: 4, s0: 1.2, jump: 0.5, phi: (x, t) => Math.exp(-x * x) * Math.cos(x * t), d2: (x, t) => -x * Math.exp(-x * x) * Math.sin(x * t), n: 800 },
          sin: { label: '$\\sin(xt)$ on $[0,2]$', a: 0, b: 2, c: -3, d: 3, s0: 0.9, jump: 1.3, phi: (x, t) => Math.sin(x * t), d2: (x, t) => x * Math.cos(x * t), n: 600 },
          tent: { label: 'moving tent (hypothesis (d) fails)', a: 0, b: 1, c: -0.2, d: 0.2, s0: 0, jump: 0.5, phi: tent, d2: tentD, n: 4000 },
        };
        const which = v.select('$\\varphi$', Object.entries(PH).map(([value, o]) => ({ value, label: o.label })), 'gauss');
        const alpha = v.select('$\\alpha$', [{ value: 'x', label: '$\\alpha(x)=x$' }, { value: 'j', label: '$x$ + unit jump' }], 'x');
        const sS = v.slider('$s$', -1, 1, 0.3, { step: 0.001 });
        const TL = v.stage({ x: [0, 1], y: [-1, 1], height: 200, axes: true, minWidth: 300, xlabel: 'x', title: '$\\varphi(x,s)$' });
        const TR = v.stage({ x: [0, 1], y: [-1, 1], height: 200, axes: true, minWidth: 300, xlabel: 'x', title: '$D_2\\varphi(x,s)$' });
        const BT = v.stage({ x: [0, 1], y: [-1, 1], height: 230, axes: true, full: true, xlabel: 't', title: '$f(t)=\\int_a^b\\varphi(x,t)\\,d\\alpha(x)$ and the tangent predicted at $t=s$' });
        let last = null, cache = null, st = null;
        const integ = (g, P) => { let tot = M.integrate(g, P.a, P.b, P.n); return tot; };
        v.render(() => {
          const P = PH[which.value], J = alpha.value === 'j';
          if (last !== which.value) {
            last = which.value;
            sS.input.min = P.c * 0.95; sS.input.max = P.d * 0.95; sS.input.step = (P.d - P.c) / 2000; sS.set(P.s0);
            TL.setView([P.a, P.b], null); TR.setView([P.a, P.b], null); BT.setView([P.c, P.d], null);
          }
          let s = sS.value; if (which.value === 'tent' && Math.abs(s) < 0.004) s = 0;
          const fAt = (t) => integ((x) => P.phi(x, t), P) + (J ? P.phi(P.jump, t) : 0);
          const key = `${which.value}|${J}`;
          if (!cache || cache.key !== key) { const ts = M.linspace(P.c, P.d, 241); cache = { key, ts, fs: ts.map(fAt) }; }
          // top: φ(·, s), D2φ(·, s), and (faint) the same at a nearby t = s + η
          const xs = M.linspace(P.a, P.b, 600), eta = (P.d - P.c) * 0.04;
          const ph = xs.map((x) => P.phi(x, s)), d2 = xs.map((x) => P.d2(x, s));
          const phE = xs.map((x) => P.phi(x, s + eta)), d2E = xs.map((x) => P.d2(x, s + eta));
          const rng = (arr, m) => { let lo = Math.min(0, ...arr), hi = Math.max(0, ...arr); if (hi - lo < m) { hi += m / 2; lo -= m / 2; } const p = (hi - lo) * 0.15; return [lo - p, hi + p]; };
          TL.setView(null, rng(ph.concat(phE), 0.2)); TR.setView(null, rng(d2.concat(d2E), 0.2));
          TL.path(xs.map((x, i) => [x, phE[i]]), { color: 'accent', width: 1.3, dash: [4, 4], alpha: 0.55 });
          TR.path(xs.map((x, i) => [x, d2E[i]]), { color: 'orange', width: 1.3, dash: [4, 4], alpha: 0.55 });
          TL.path(xs.map((x, i) => [x, ph[i]]), { color: 'accent', width: 2.2 });
          TR.path(xs.map((x, i) => [x, d2[i]]), { color: 'orange', width: 2.2 });
          if (J) { TL.dot(P.jump, P.phi(P.jump, s), { color: 'purple', r: 5, label: 'jump of α', labelPos: 'ne' }); TR.dot(P.jump, P.d2(P.jump, s), { color: 'purple', r: 5 }); }
          // hypothesis (d): ω(η) = sup_x |D2φ(x, s±η) − D2φ(x, s)| should shrink with η
          const om = (e) => { let m = 0; for (const x of xs) m = Math.max(m, Math.abs(P.d2(x, s + e) - P.d2(x, s)), Math.abs(P.d2(x, s - e) - P.d2(x, s))); return m; };
          const w1 = om(eta), w2 = om(eta / 10), unif = w2 < 1e-9 || w2 < 0.35 * w1;
          // bottom: f, the predicted tangent and the actual slope
          const lo = Math.min(...cache.fs), hi = Math.max(...cache.fs), pad = Math.max(0.05, (hi - lo) * 0.15);
          BT.setView(null, [lo - pad, hi + pad]);
          BT.path(cache.ts.map((t, i) => [t, cache.fs[i]]), { color: 'ink', width: 2.2 });
          const fs = fAt(s), pred = integ((x) => P.d2(x, s), P) + (J ? P.d2(P.jump, s) : 0);
          const hh = (P.d - P.c) * 1e-4, actual = (fAt(s + hh) - fAt(s - hh)) / (2 * hh);
          const Lt = (P.d - P.c) * 0.22, good = Math.abs(pred - actual) < 1e-3 * Math.max(1, Math.abs(actual));
          BT.line(s - Lt, fs - pred * Lt, s + Lt, fs + pred * Lt, { color: good ? 'green' : 'red', width: 2.6 });
          if (!good) BT.line(s - Lt, fs - actual * Lt, s + Lt, fs + actual * Lt, { color: 'muted', width: 1.4, dash: [5, 4] });
          BT.dot(s, fs, { color: 'accent', r: 5, label: 's', labelPos: 'nw' });
          if (which.value === 'gauss' && !J) BT.fn((t) => Math.sqrt(Math.PI) * Math.exp(-t * t / 4), { color: 'gold', width: 1.4, dash: [3, 4] });
          st = { s, pred, actual, good, gauss: which.value === 'gauss' && !J, w1, w2, eta, unif };
          v.legend([['accent', '$\\varphi(\\cdot,s)$ and $f$'], ['orange', '$D_2\\varphi(\\cdot,s)$'], [good ? 'green' : 'red', 'slope $\\int D_2\\varphi(x,s)\\,d\\alpha(x)$'], ...(good ? [] : [['muted', 'true slope $f\'(s)$', { dash: true }]]), ...(which.value === 'gauss' && !J ? [['gold', '$\\sqrt\\pi\\,e^{-t^2/4}$', { dash: true }]] : [])]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const hyp = `Hypothesis (d): $\\sup_x|D_2\\varphi(x,s\\pm\\eta)-D_2\\varphi(x,s)|=${v.fmt(s.w1, 3)}$ for $\\eta=${v.fmt(s.eta, 2)}$ and $${v.fmt(s.w2, 3)}$ for $\\eta/10$` + (s.unif ? ' — shrinking, as required.' : ' — **not** shrinking.');
          return `${hyp} At $s=${v.fix(s.s, 3)}$: $\\;f'(s)\\approx${v.fix(s.actual, 5)}$ (difference quotient), $\\;\\int_a^bD_2\\varphi(x,s)\\,d\\alpha(x)=${v.fix(s.pred, 5)}$` + (s.good ? ' — equal.' : ' — **not** equal.') + (s.gauss ? ' The dotted curve $\\sqrt\\pi e^{-t^2/4}$ is Example 9.43.' : '');
        });
      },
    },
  ],
};
