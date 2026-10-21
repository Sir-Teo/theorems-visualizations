// Rudin, Principles of Mathematical Analysis — Chapter 9 (part b1): 9.24–9.31
// The inverse function theorem, open mappings, the implicit function theorem (linear and
// nonlinear), null space / range / rank, and projections. The chapter title lives in ch09.js.

// ---------------------------------------------------------------- shared helpers (2×2 linear algebra, contours)
const mv2 = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const inv2 = (A) => { const d = det2(A); return Math.abs(d) < 1e-13 ? null : [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
const sub2 = (A, B) => [[A[0][0] - B[0][0], A[0][1] - B[0][1]], [A[1][0] - B[1][0], A[1][1] - B[1][1]]];
/** Operator norm (largest singular value) of a 2×2 matrix. */
function opNorm2(A) {
  const f = A[0][0] ** 2 + A[0][1] ** 2 + A[1][0] ** 2 + A[1][1] ** 2, d = det2(A);
  return Math.sqrt((f + Math.sqrt(Math.max(0, f * f - 4 * d * d))) / 2);
}
/** Zero set {F = level} by marching squares, as one polyline list with null breaks. */
function contour(F, [x0, x1], [y0, y1], nx = 160, ny = 120, level = 0) {
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, V = [];
  for (let j = 0; j <= ny; j++) { const row = new Float64Array(nx + 1); for (let i = 0; i <= nx; i++) row[i] = F(x0 + i * dx, y0 + j * dy) - level; V.push(row); }
  const out = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i];
    const X = x0 + i * dx, Y = y0 + j * dy, pts = [];
    const edge = (p, q, P, Q) => { if (isFinite(p) && isFinite(q) && (p < 0) !== (q < 0)) { const t = p / (p - q); pts.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); } };
    edge(a, b, [X, Y], [X + dx, Y]); edge(b, c, [X + dx, Y], [X + dx, Y + dy]); edge(c, d, [X + dx, Y + dy], [X, Y + dy]); edge(d, a, [X, Y + dy], [X, Y]);
    if (pts.length >= 2) out.push(pts[0], pts[1], null);
    if (pts.length === 4) out.push(pts[2], pts[3], null);
  }
  return out;
}
/** Real roots of u ↦ F(u, w) on [lo, hi] (sign changes on n cells, refined by bisection). */
function rootsOn(F, w, lo, hi, n = 200) {
  const out = []; let pu = lo, pv = F(lo, w);
  for (let i = 1; i <= n; i++) {
    const u = lo + (hi - lo) * i / n, val = F(u, w);
    if (pv === 0) out.push(pu);
    else if (val !== 0 && (pv < 0) !== (val < 0)) {
      let a = pu, b = u, fa = pv;
      for (let k = 0; k < 40; k++) { const m = (a + b) / 2, fm = F(m, w); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; }
      out.push((a + b) / 2);
    }
    pu = u; pv = val;
  }
  return out;
}
const fmtM = (v, A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => v.fix(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

export default {
  collection: 'pma',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.24 inverse function theorem
    {
      num: '9.24',
      kind: 'Theorem',
      name: 'Inverse function theorem',
      statement: String.raw`Let $\mathbf f$ be a $\mathscr C'$-mapping of an open set $E\subset\R^n$ into $\R^n$, and suppose $\mathbf f'(\mathbf a)$ is invertible for some $\mathbf a\in E$. Put $\mathbf b=\mathbf f(\mathbf a)$. Then:
(a) there are open sets $U,V\subset\R^n$ with $\mathbf a\in U$ and $\mathbf b\in V$ such that $\mathbf f$ is one-to-one on $U$ and $\mathbf f(U)=V$;
(b) the inverse $\mathbf g:V\to U$ of $\mathbf f|_U$, defined by $\mathbf g(\mathbf f(\mathbf x))=\mathbf x$ for $\mathbf x\in U$, is again of class $\mathscr C'$.`,
      idea: String.raw`Let $A=\mathbf f'(\mathbf a)$ and pick $\lambda$ with $2\lambda\norm{A^{-1}}=1$. Continuity of $\mathbf f'$ gives a ball $U$ about $\mathbf a$ on which $\norm{\mathbf f'(\mathbf x)-A}<\lambda$. For a target $\mathbf y$, the map $\varphi_{\mathbf y}(\mathbf x)=\mathbf x+A^{-1}(\mathbf y-\mathbf f(\mathbf x))$ has $\norm{\varphi_{\mathbf y}'}<\tfrac12$ on $U$, so by the mean value estimate (9.19) it halves distances: it has at most one fixed point (so $\mathbf f$ is one-to-one on $U$), and the contraction principle (9.23) produces a fixed point for every $\mathbf y$ near any point of $\mathbf f(U)$, so $V=\mathbf f(U)$ is open. Finally $\mathbf f'(\mathbf x)$ stays invertible on $U$ (9.8), $\mathbf g'(\mathbf y)=\mathbf f'(\mathbf g(\mathbf y))^{-1}$, and continuity of inversion (9.8) makes $\mathbf g'$ continuous.`,
      caption: String.raw`Drag $\mathbf a$ and the gold target $\mathbf y$; resize the orange test disc $D$. The green dashed disc is the $U$ of the proof, where $\norm{\mathbf f'(\mathbf x)-\mathbf f'(\mathbf a)}<1/(2\norm{\mathbf f'(\mathbf a)^{-1}})$, and the gold dots are the proof's iteration $\mathbf x_{k+1}=\mathbf x_k+A^{-1}(\mathbf y-\mathbf f(\mathbf x_k))$ converging to $\mathbf g(\mathbf y)$. Grow $D$ over the red set where $J_{\mathbf f}=0$ (for $e^z$: past radius $\pi$, although $J_{\mathbf f}$ never vanishes) and two red points with the same image appear: the theorem is strictly local.`,
      deps: ['pma-9.23', 'pma-9.19', 'pma-9.8', 'pma-9.21', 'pma-9.15'],
      tags: ['inverse function theorem', 'differentiation', 'several variables'],
      viz(v) {
        const MAPS = {
          sq: {
            label: '$z^2=(x^2-y^2,\\,2xy)$', f: (x, y) => [x * x - y * y, 2 * x * y], J: (x, y) => [[2 * x, -2 * y], [2 * y, 2 * x]],
            dom: [[-1.3, 2.4], [-1.05, 1.75]], img: [[-2.4, 3.6], [-1.4, 3.6]], a: [0.9, 0.45], r: 0.85, grid: 0.5,
            snap: (x, y) => (Math.hypot(x, y) < 0.07 ? [0, 0] : null),
            clash: (a, r) => { const n = Math.hypot(a[0], a[1]); if (n >= r) return null; const u = n > 1e-9 ? [-a[1] / n, a[0] / n] : [1, 0]; const d = 0.75 * Math.sqrt(r * r - n * n); return [[d * u[0], d * u[1]], [-d * u[0], -d * u[1]]]; },
          },
          exp: {
            label: '$e^z=(e^x\\cos y,\\,e^x\\sin y)$', f: (x, y) => { const e = Math.exp(x); return [e * Math.cos(y), e * Math.sin(y)]; },
            J: (x, y) => { const e = Math.exp(x), c = e * Math.cos(y), s = e * Math.sin(y); return [[c, -s], [s, c]]; },
            dom: [[-4.4, 1.6], [-4.1, 4.1]], img: [[-4.2, 4.2], [-3.2, 3.2]], a: [-0.5, 0.5], r: 1.2, grid: 1,
            snap: () => null,
            clash: (a, r) => (r > Math.PI ? [[a[0], a[1] - Math.PI], [a[0], a[1] + Math.PI]] : null),
          },
          fold: {
            label: 'fold $(x,\\,y^2)$', f: (x, y) => [x, y * y], J: (x, y) => [[1, 0], [0, 2 * y]],
            dom: [[-2.1, 2.1], [-1.6, 1.6]], img: [[-2.3, 2.3], [-0.7, 2.7]], a: [0.2, 0.75], r: 0.5, grid: 0.5,
            snap: (x, y) => (Math.abs(y) < 0.05 ? [x, 0] : null),
            clash: (a, r) => { if (Math.abs(a[1]) >= r) return null; const d = 0.85 * (r - Math.abs(a[1])); return [[a[0], d], [a[0], -d]]; },
          },
        };
        const which = v.select('$\\mathbf f$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const rad = v.slider('radius of the test disc $D$', 0.1, 3.6, 0.85, { step: 0.01 });
        const warp = v.toggle('warped grid', true);
        const L = v.stage({ x: MAPS.sq.dom[0], y: MAPS.sq.dom[1], equal: true, height: 360, title: 'domain: $\\mathbf a$, the test disc $D$, the proof\'s $U$' });
        const R = v.stage({ x: MAPS.sq.img[0], y: MAPS.sq.img[1], equal: true, height: 360, title: 'target: $\\mathbf f(D)$, $V=\\mathbf f(U)$ and $\\mathbf y$' });
        const ha = L.handle(...MAPS.sq.a, { color: 'accent', label: 'a', constrain: (x, y) => MAPS[which.value].snap(x, y) || [x, y] });
        const hy = R.handle(0, 0, { color: 'gold', label: 'y' });
        let last = null, prevB = null, st = null;

        /** Largest r with ‖f′(x) − A‖ < λ = 1/(2‖A⁻¹‖) on the whole disc B(a, r) (Rudin's U). */
        function certRadius(F, a) {
          const A = F.J(a[0], a[1]), Ai = inv2(A); if (!Ai) return { r: 0, lam: 0 };
          const lam = 1 / (2 * opNorm2(Ai));
          let r = 0, mx = 0;
          while (r < 5) {
            const rn = r + Math.max(0.003, r * 0.015);
            for (let k = 0; k < 64; k++) { const t = (k * Math.PI) / 32; mx = Math.max(mx, opNorm2(sub2(F.J(a[0] + rn * Math.cos(t), a[1] + rn * Math.sin(t)), A))); }
            if (mx >= lam) break; r = rn;
          }
          return { r, lam, Ai };
        }
        function iterate(F, a, y, Ai) {
          const pts = [a.slice()]; let x = a.slice(), ok = false;
          for (let k = 0; k < 80; k++) {
            const fx = F.f(x[0], x[1]), res = [y[0] - fx[0], y[1] - fx[1]];
            if (Math.hypot(res[0], res[1]) < 1e-11) { ok = true; break; }
            const d = mv2(Ai, res); x = [x[0] + d[0], x[1] + d[1]];
            if (!isFinite(x[0]) || !isFinite(x[1]) || Math.hypot(x[0] - a[0], x[1] - a[1]) > 30) break;
            pts.push(x.slice());
          }
          return { pts, ok, x };
        }
        const mapCurve = (F, g) => (t) => { const p = g(t); return F.f(p[0], p[1]); };

        v.render(() => {
          const F = MAPS[which.value];
          if (last !== which.value) {
            last = which.value;
            L.setView(...F.dom); R.setView(...F.img);
            ha.x = F.a[0]; ha.y = F.a[1]; rad.value = F.r;
            const c0 = certRadius(F, F.a), b0 = F.f(...F.a);
            const q = F.f(F.a[0] + 0.45 * c0.r, F.a[1] + 0.35 * c0.r);
            hy.x = q[0] + 0.25 * (q[0] - b0[0]); hy.y = q[1] + 0.25 * (q[1] - b0[1]);
            prevB = null;
          }
          const a = [ha.x, ha.y], b = F.f(a[0], a[1]);
          if (prevB) { hy.x = v.M.clamp(hy.x + b[0] - prevB[0], ...R.bounds.x); hy.y = v.M.clamp(hy.y + b[1] - prevB[1], ...R.bounds.y); }
          prevB = b;
          const r = rad.value, cert = certRadius(F, a), y = [hy.x, hy.y];
          const [X0, X1] = L.bounds.x, [Y0, Y1] = L.bounds.y;
          // background grid and its warped image
          if (warp.value) {
            const g = F.grid;
            for (let x = Math.ceil(X0 / g) * g; x <= X1; x += g) { R.curve(mapCurve(F, (t) => [x, Y0 + (Y1 - Y0) * t]), 0, 1, { color: 'faint', width: 0.8, n: 160 }); L.vline(x, { color: 'grid', width: 1 }); }
            for (let y2 = Math.ceil(Y0 / g) * g; y2 <= Y1; y2 += g) { R.curve(mapCurve(F, (t) => [X0 + (X1 - X0) * t, y2]), 0, 1, { color: 'faint', width: 0.8, n: 160 }); L.hline(y2, { color: 'grid', width: 1 }); }
          }
          // critical set J_f = 0
          if (which.value === 'sq') L.dot(0, 0, { color: 'red', r: 4.5, label: 'J = 0', labelPos: 'sw' });
          if (which.value === 'fold') { L.hline(0, { color: 'red', width: 2 }); L.text('J = 0', X1, 0, { color: 'red', align: 'right', dx: -6, dy: -10, size: 12 }); }
          if (which.value === 'exp') L.corner('J = e²ˣ > 0 everywhere', 'bl', { color: 'muted' });
          // test disc D and its grid
          const circ = (c, rr) => (t) => [c[0] + rr * Math.cos(2 * Math.PI * t), c[1] + rr * Math.sin(2 * Math.PI * t)];
          L.circle(a[0], a[1], r, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.6 });
          R.curve(mapCurve(F, circ(a, r)), 0, 1, { n: 400, color: 'orange', width: 1.6, fill: 'orange', fillAlpha: 0.08 });
          for (let k = -4; k <= 4; k++) {
            const s = (r * k) / 5, w = Math.sqrt(r * r - s * s);
            const gh = (t) => [a[0] - w + 2 * w * t, a[1] + s], gv = (t) => [a[0] + s, a[1] - w + 2 * w * t];
            L.curve(gh, 0, 1, { n: 2, color: 'blue', width: 1, alpha: 0.6 }); L.curve(gv, 0, 1, { n: 2, color: 'teal', width: 1, alpha: 0.6 });
            R.curve(mapCurve(F, gh), 0, 1, { n: 90, color: 'blue', width: 1.1, alpha: 0.75 }); R.curve(mapCurve(F, gv), 0, 1, { n: 90, color: 'teal', width: 1.1, alpha: 0.75 });
          }
          // Rudin's U and V
          let it = null;
          if (cert.r > 0) {
            L.circle(a[0], a[1], cert.r, { color: 'green', width: 2.2, dash: [6, 4], fill: 'green', fillAlpha: 0.08 });
            R.curve(mapCurve(F, circ(a, cert.r)), 0, 1, { n: 300, color: 'green', width: 2.2, dash: [6, 4] });
            it = iterate(F, a, y, cert.Ai);
            L.path(it.pts.slice(0, 40), { color: 'gold', width: 1.3 });
            L.dots(it.pts.slice(1, 40), { color: 'gold', r: 3 });
            if (it.ok && Math.hypot(it.x[0] - a[0], it.x[1] - a[1]) < 30) L.dot(it.x[0], it.x[1], { color: 'gold', r: 5.5, label: 'g(y)', labelPos: 'e' });
          } else {
            L.corner("f′(a) is not invertible — no U exists here", 'tl', { color: 'red', weight: 600 });
          }
          // a pair of points in D with the same image
          const pair = F.clash(a, r);
          if (pair) {
            const [p, q] = pair, fp = F.f(p[0], p[1]);
            L.line(p[0], p[1], q[0], q[1], { color: 'red', width: 1, dash: [3, 3] });
            L.dot(p[0], p[1], { color: 'red', r: 4.5, label: 'p', labelPos: 'e' });
            L.dot(q[0], q[1], { color: 'red', r: 4.5, label: 'p′', labelPos: 'e' });
            R.dot(fp[0], fp[1], { color: 'red', r: 5, label: 'f(p) = f(p′)', labelPos: 'sw' });
          }
          R.dot(b[0], b[1], { color: 'accent', r: 4.5, label: 'b', labelPos: 'nw' });
          st = { F, a, b, r, cert, it, pair, J: det2(F.J(a[0], a[1])) };
          v.legend([['orange', 'test disc $D$ and $\\mathbf f(D)$', { area: true }], ['green', 'the proof\'s $U$ and $V=\\mathbf f(U)$', { dash: true }], ['gold', 'iterates $\\mathbf x_k\\to\\mathbf g(\\mathbf y)$', { dot: true }], ['red', 'where $\\mathbf f$ fails', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          let out = `$J_{\\mathbf f}(\\mathbf a)=${v.fix(s.J, 3)}$`;
          if (s.cert.r > 0) {
            out += `; $\\;$ proof's radius $r_*=${v.fix(s.cert.r, 3)}$ $\\big(\\lambda=${v.fix(s.cert.lam, 3)}\\big)$. `;
            const inU = s.it && s.it.ok && Math.hypot(s.it.x[0] - s.a[0], s.it.x[1] - s.a[1]) < s.cert.r;
            out += inU ? `$\\mathbf y\\in V$: the contraction reaches $\\mathbf g(\\mathbf y)=(${v.fix(s.it.x[0], 3)},\\,${v.fix(s.it.x[1], 3)})$ in ${s.it.pts.length - 1} steps. `
              : (s.it && s.it.ok ? 'Here $\\mathbf y\\notin V$; the iteration still found a preimage, but outside $U$. ' : 'Here $\\mathbf y\\notin V$ and the frozen-derivative iteration does not converge. ');
          } else out += ' — $\\mathbf f\'(\\mathbf a)$ is singular. ';
          out += s.pair ? '$\\mathbf f$ is **not** one-to-one on $D$.' : '$\\mathbf f$ is one-to-one on $D$.';
          return out;
        });
      },
    },
    // ------------------------------------------------------------------ 9.25 open mapping
    {
      num: '9.25',
      kind: 'Theorem',
      name: 'Invertible derivative everywhere ⇒ open mapping',
      verify: true,
      statement: String.raw`Let $\mathbf f$ be a $\mathscr C'$-mapping of an open set $E\subset\R^n$ into $\R^n$ such that $\mathbf f'(\mathbf x)$ is invertible for every $\mathbf x\in E$. Then $\mathbf f(W)$ is an open subset of $\R^n$ for every open $W\subset E$; in other words, $\mathbf f$ is an open mapping of $E$ into $\R^n$.`,
      idea: String.raw`Take $\mathbf y=\mathbf f(\mathbf x)$ with $\mathbf x\in W$ and apply part (a) of the inverse function theorem (9.24) to $\mathbf f$ restricted to the open set $W$: it yields an open $V\ni\mathbf y$ with $V=\mathbf f(U)\subset\mathbf f(W)$. So every point of $\mathbf f(W)$ is an interior point. The hypothesis is sufficient but not necessary — $z\mapsto z^2$ is open although its Jacobian vanishes at $0$ — yet at a *fold*, where $J_{\mathbf f}$ changes sign and the plane is creased, images of open sets acquire an edge.`,
      caption: String.raw`Drag the open disc $W$ (centre handle, radius slider) and the gold point $\mathbf p\in W$. The right panel shades $\mathbf f(W)$ and draws the largest disc about $\mathbf f(\mathbf p)$ inside it (radius $\rho$); its preimage near $\mathbf p$ is tinted green on the left. For $e^z$ the derivative is invertible everywhere and $\rho>0$ always. For the fold $(x,y)\mapsto(x,y^2)$, drop $\mathbf p$ onto the red line: $\rho=0$, the image contains part of its boundary and is not open.`,
      deps: ['pma-9.24'],
      tags: ['inverse function theorem', 'open sets'],
      viz(v) {
        const M = v.M;
        const MAPS = {
          exp: {
            label: '$e^z$', f: (x, y) => { const e = Math.exp(x); return [e * Math.cos(y), e * Math.sin(y)]; },
            pre: (u, w) => { const m = Math.hypot(u, w); if (m < 1e-12) return []; const l = Math.log(m), t = Math.atan2(w, u); return [-2, -1, 0, 1, 2].map((k) => [l, t + 2 * Math.PI * k]); },
            J: (x) => Math.exp(2 * x), dom: [[-2, 1.8], [-1.2, 2.5]], img: [[-1.5, 3.5], [-1.3, 2.9]], c: [-0.3, 0.7], R: 1.25, p: [0.35, 1.1], snap: () => null,
          },
          sq: {
            label: '$z^2$', f: (x, y) => [x * x - y * y, 2 * x * y],
            pre: (u, w) => { const z = new v.Cx(u, w).sqrt(); return [[z.re, z.im], [-z.re, -z.im]]; },
            J: (x, y) => 4 * (x * x + y * y), dom: [[-2, 2], [-1.6, 1.6]], img: [[-2.9, 2.9], [-2.2, 2.2]], c: [0.45, 0.3], R: 0.75, p: [0.6, 0.6],
            snap: (x, y) => (Math.hypot(x, y) < 0.07 ? [0, 0] : null),
          },
          fold: {
            label: 'fold $(x,y^2)$', f: (x, y) => [x, y * y],
            pre: (u, w) => (w < 0 ? [] : [[u, Math.sqrt(w)], [u, -Math.sqrt(w)]]),
            J: (x, y) => 2 * y, dom: [[-2, 2], [-1.6, 1.6]], img: [[-2.2, 2.2], [-0.8, 2.4]], c: [0.1, 0.35], R: 0.8, p: [0.5, 0.7],
            snap: (x, y) => (Math.abs(y) < 0.06 ? [x, 0] : null),
          },
        };
        const which = v.select('$\\mathbf f$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const rad = v.slider('radius of $W$', 0.2, 1.5, 1.25, { step: 0.01 });
        const L = v.stage({ x: MAPS.exp.dom[0], y: MAPS.exp.dom[1], equal: true, height: 340, title: 'domain: the open disc $W$ and $\\mathbf p\\in W$' });
        const R = v.stage({ x: MAPS.exp.img[0], y: MAPS.exp.img[1], equal: true, height: 340, title: '$\\mathbf f(W)$ and the largest disc about $\\mathbf f(\\mathbf p)$ inside it' });
        const hc = L.handle(...MAPS.exp.c, { color: 'blue', r: 6, label: 'W', labelPos: 'ne' });
        const hp = L.handle(...MAPS.exp.p, {
          color: 'gold', label: 'p',
          constrain: (x, y) => {
            const F = MAPS[which.value], Rr = rad.value * 0.97;
            const s = F.snap(x, y); if (s) [x, y] = s;
            const dx = x - hc.x, dy = y - hc.y, d = Math.hypot(dx, dy);
            if (d > Rr) { x = hc.x + (dx / d) * Rr; y = hc.y + (dy / d) * Rr; const s2 = F.snap(x, y); if (s2 && Math.hypot(s2[0] - hc.x, s2[1] - hc.y) < Rr) [x, y] = s2; }
            return [x, y];
          },
        });
        let prevC = [hc.x, hc.y], last = null, st = null;
        hc.onDrag = () => { hp.x += hc.x - prevC[0]; hp.y += hc.y - prevC[1]; prevC = [hc.x, hc.y]; };
        const blue = v.rgb('blue'), green = v.rgb('green');

        function rho(w0, inFW, span) {
          let best = Infinity, q = null; const step = span / 400;
          for (let k = 0; k < 144; k++) {
            const th = (k * Math.PI) / 72, d = [Math.cos(th), Math.sin(th)];
            let t = 0;
            while (t < best && inFW(w0[0] + (t + step) * d[0], w0[1] + (t + step) * d[1])) t += step;
            if (t >= best) continue;
            let lo = t, hi = t + step;
            for (let i = 0; i < 34; i++) { const m = (lo + hi) / 2; if (inFW(w0[0] + m * d[0], w0[1] + m * d[1])) lo = m; else hi = m; }
            if (lo < best) { best = lo; q = [w0[0] + lo * d[0], w0[1] + lo * d[1]]; }
          }
          return { r: best, q };
        }

        v.render(() => {
          const F = MAPS[which.value];
          if (last !== which.value) {
            last = which.value; L.setView(...F.dom); R.setView(...F.img);
            hc.x = F.c[0]; hc.y = F.c[1]; prevC = F.c.slice(); hp.x = F.p[0]; hp.y = F.p[1]; rad.value = F.R;
          }
          const Rr = rad.value, c = [hc.x, hc.y];
          // keep p inside W when the radius shrinks
          { const dx = hp.x - c[0], dy = hp.y - c[1], d = Math.hypot(dx, dy); if (d > Rr * 0.97) { hp.x = c[0] + (dx / d) * Rr * 0.97; hp.y = c[1] + (dy / d) * Rr * 0.97; } }
          const inW = (x, y) => (x - c[0]) ** 2 + (y - c[1]) ** 2 < Rr * Rr;
          const inFW = (u, w) => F.pre(u, w).some((p) => inW(p[0], p[1]));
          const p = [hp.x, hp.y], w0 = F.f(p[0], p[1]);
          const span = R.bounds.x[1] - R.bounds.x[0];
          const { r: rh, q } = rho(w0, inFW, span);
          const open = rh > span * 1e-4;
          const key = `${which.value}|${c}|${Rr}|${v.color('panel')}`;
          R.raster((u, w) => (inFW(u, w) ? [blue[0], blue[1], blue[2], 52] : null), { key, res: 2 });
          R.curve((t) => F.f(c[0] + Rr * Math.cos(2 * Math.PI * t), c[1] + Rr * Math.sin(2 * Math.PI * t)), 0, 1, { n: 360, color: 'blue', width: 1.4, alpha: 0.7 });
          // preimage (near p) of the ball B(f(p), ρ)
          if (open) L.raster((x, y) => { if (!inW(x, y)) return null; const z = F.f(x, y); return Math.hypot(z[0] - w0[0], z[1] - w0[1]) < rh ? [green[0], green[1], green[2], 70] : null; }, { key: `${key}|${p}|${rh}`, res: 2, id: 'pre' });
          L.circle(c[0], c[1], Rr, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 1.8 });
          // critical sets
          if (which.value === 'fold') {
            L.hline(0, { color: 'red', width: 2 }); L.text('J = 0', L.bounds.x[1], 0, { color: 'red', align: 'right', dx: -6, dy: -10, size: 12 });
            if (Math.abs(c[1]) < Rr) { const h = Math.sqrt(Rr * Rr - c[1] * c[1]); R.line(c[0] - h, 0, c[0] + h, 0, { color: 'red', width: 3.2 }); R.text('this edge belongs to f(W)', c[0], 0, { color: 'red', dy: 22, align: 'center', size: 11.5 }); }
          }
          if (which.value === 'sq') { L.dot(0, 0, { color: 'red', r: 4, label: 'J = 0', labelPos: 'sw' }); if (inW(0, 0)) R.dot(0, 0, { color: 'red', r: 4, hollow: true }); }
          if (which.value === 'exp') L.corner('J = e²ˣ ≠ 0 everywhere', 'bl', { color: 'muted' });
          // the ball about f(p)
          if (open) {
            R.circle(w0[0], w0[1], rh, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.14 });
            if (q) { R.line(w0[0], w0[1], q[0], q[1], { color: 'green', width: 1.3, dash: [3, 3] }); R.dot(q[0], q[1], { color: 'green', r: 3 }); }
          } else {
            R.circle(w0[0], w0[1], span * 0.03, { color: 'red', width: 2 });
          }
          R.dot(w0[0], w0[1], { color: 'gold', r: 5, label: 'f(p)', labelPos: 'ne' });
          R.corner(open ? `ρ = ${v.fmt(rh, 3)} > 0` : 'ρ = 0: f(W) is not open at f(p)', 'tr', { color: open ? 'green' : 'red', weight: 600 });
          st = { open, rh, J: F.J(p[0], p[1]), w0 };
          v.legend([['blue', '$W$ and $\\mathbf f(W)$', { area: true }], ['green', 'disc about $\\mathbf f(\\mathbf p)$ inside $\\mathbf f(W)$ and its preimage', { area: true }], ['red', '$J_{\\mathbf f}=0$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\mathbf f(\\mathbf p)=(${v.fix(s.w0[0], 3)},\\,${v.fix(s.w0[1], 3)})$, $\\;J_{\\mathbf f}(\\mathbf p)=${v.fix(s.J, 3)}$, $\\;\\rho=\\operatorname{dist}\\big(\\mathbf f(\\mathbf p),\\R^2\\setminus\\mathbf f(W)\\big)=${v.fix(s.rh, 4)}$` +
            (s.open ? (Math.abs(s.J) > 1e-9 ? ' — $\\mathbf f\'(\\mathbf p)$ is invertible, so 9.24 puts a whole neighbourhood of $\\mathbf f(\\mathbf p)$ inside $\\mathbf f(W)$.' : ' — $J_{\\mathbf f}(\\mathbf p)=0$, yet this image point is still interior: the hypothesis is not necessary.')
              : ' — $\\mathbf f(\\mathbf p)$ lies on the boundary of $\\mathbf f(W)$.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.27 linear implicit function theorem
    {
      num: '9.27',
      kind: 'Theorem',
      name: 'Implicit function theorem for linear maps',
      statement: String.raw`Let $A\in L(\R^{n+m},\R^n)$ and split it as $A(\mathbf h,\mathbf k)=A_x\mathbf h+A_y\mathbf k$ for $\mathbf h\in\R^n$, $\mathbf k\in\R^m$, where $A_x\in L(\R^n)$ and $A_y\in L(\R^m,\R^n)$. If $A_x$ is invertible, then for every $\mathbf k\in\R^m$ there is exactly one $\mathbf h\in\R^n$ with $A(\mathbf h,\mathbf k)=\mathbf 0$, namely
$$\mathbf h=-(A_x)^{-1}A_y\mathbf k .$$`,
      idea: String.raw`The equation $A(\mathbf h,\mathbf k)=\mathbf 0$ is $A_x\mathbf h=-A_y\mathbf k$, and an invertible $A_x$ solves it uniquely. Geometrically, the null space $\mathscr N(A)$ meets the "horizontal" subspace $\{\mathbf k=\mathbf 0\}$ only at $\mathbf 0$ exactly when $A_x$ is one-to-one, and then $\mathscr N(A)$ is the graph of the linear map $\mathbf k\mapsto-(A_x)^{-1}A_y\mathbf k$. This is the linear model of the implicit function theorem (9.28), where $A$ becomes $\mathbf f'(\mathbf a,\mathbf b)$.`,
      caption: String.raw`Here $n=2$, $m=1$. Drag the columns $A_x\mathbf e_1$ (blue), $A_x\mathbf e_2$ (teal) and $A_y$ (purple), and move $k$. Left: the solution $\mathbf h=(h_1,h_2)$ consists of the coordinates of $-kA_y$ in the basis formed by the columns of $A_x$ (green parallelogram). Right: $\mathscr N(A)\subset\R^3$ is a line, the graph of $k\mapsto\mathbf h(k)$ over the $k$-axis. Make the blue and teal columns parallel: $\det A_x\to0$, the coordinates blow up, and $\mathscr N(A)$ tips over into the plane $k=0$.`,
      deps: ['pma-9.4', 'pma-9.5', 'pma-9.6'],
      tags: ['implicit function theorem', 'linear algebra'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-3.1, 3.1], y: [-2.3, 2.3], equal: true, height: 360, title: 'solve $A_x\\mathbf h=-kA_y$ in $\\R^2$' });
        const S3 = v.stage3d({ range: 2.9, height: 360, yaw: -0.62, pitch: 0.3, axisLength: 2.3, labels: ['h₁', 'h₂', 'k'], title: '$\\mathscr N(A)$ in $\\R^3=\\R^2_{\\mathbf h}\\times\\R_k$' });
        // snap a column onto the line of the other one when nearly parallel, so det A_x = 0 can be reached exactly
        const snapTo = (other) => (x, y) => { const o = [other().x, other().y], n = Math.hypot(...o), r = Math.hypot(x, y); if (n < 1e-9 || r < 1e-9) return [x, y]; const cr = (o[0] * y - o[1] * x) / (n * r); if (Math.abs(cr) < 0.035) { const t = (x * o[0] + y * o[1]) / (n * n); return [t * o[0], t * o[1]]; } return [x, y]; };
        let c1 = null, c2 = null;
        c1 = L.handle(1.6, 0.35, { color: 'blue', constrain: snapTo(() => c2) }); c2 = L.handle(0.45, 1.3, { color: 'teal', constrain: snapTo(() => c1) });
        const d = L.handle(-1.25, 0.75, { color: 'purple' });
        const k = v.slider('$k$', -1.5, 1.5, 0.8, { step: 0.01 });
        let st = null;
        v.render(() => {
          const Ax = [[c1.x, c2.x], [c1.y, c2.y]], Ay = [d.x, d.y], kk = k.value;
          const D = det2(Ax), sing = Math.abs(D) < 1e-9;
          const w = [-kk * Ay[0], -kk * Ay[1]];
          const Ai = sing ? null : inv2(Ax);
          const h = Ai ? mv2(Ai, w) : null;
          const ext = 12;
          const span = (c, col) => L.line(-ext * c[0], -ext * c[1], ext * c[0], ext * c[1], { color: col, width: 1, dash: [4, 4], alpha: 0.6 });
          span([c1.x, c1.y], sing ? 'red' : 'blue'); span([c2.x, c2.y], sing ? 'red' : 'teal');
          if (h) {
            const p1 = [h[0] * c1.x, h[0] * c1.y], p2 = [h[1] * c2.x, h[1] * c2.y];
            L.poly([[0, 0], p1, w, p2], { fill: 'green', fillAlpha: 0.1, color: 'green', width: 1.2, dash: [5, 4] });
            L.arrow(0, 0, p1[0], p1[1], { color: 'blue', width: 3.2, alpha: 0.45 });
            L.arrow(p1[0], p1[1], w[0], w[1], { color: 'teal', width: 3.2, alpha: 0.45 });
            const ctr = [w[0] / 2, w[1] / 2];
            const sideLab = (s, P0, P1, col) => {
              const m = [(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2], t = [P1[0] - P0[0], P1[1] - P0[1]], n = Math.hypot(t[0], t[1]); if (n < 0.15) return;
              let nn = [-t[1] / n, t[0] / n]; if ((m[0] - ctr[0]) * nn[0] + (m[1] - ctr[1]) * nn[1] < 0) nn = [-nn[0], -nn[1]];
              L.tex(s, m[0] + 0.2 * nn[0], m[1] + 0.2 * nn[1], { color: col, size: 14 });
            };
            sideLab('h_1', [0, 0], p1, 'blue'); sideLab('h_2', p1, w, 'teal');
            L.dot(p1[0], p1[1], { color: 'blue', r: 3.2 });
          }
          L.line(0, 0, c1.x, c1.y, { color: 'blue', width: 2.4 }); L.line(0, 0, c2.x, c2.y, { color: 'teal', width: 2.4 }); L.line(0, 0, d.x, d.y, { color: 'purple', width: 2.4 });
          L.arrow(0, 0, w[0], w[1], { color: 'purple', width: 2.4, dash: [6, 4] });
          const lab = (s, p, col) => { const n = Math.hypot(p[0], p[1]) || 1; L.tex(s, p[0] + (0.36 * p[0]) / n, p[1] + (0.36 * p[1]) / n, { color: col, size: 14 }); };
          lab('A_x\\mathbf e_1', [c1.x, c1.y], 'blue'); lab('A_x\\mathbf e_2', [c2.x, c2.y], 'teal'); lab('A_y', [d.x, d.y], 'purple');
          if (Math.hypot(...w) > 0.15) lab('-kA_y', w, 'purple');
          L.dot(0, 0, { color: 'ink', r: 3 });
          if (sing) L.corner('det Aₓ = 0: the columns are parallel, no unique h', 'tl', { color: 'red', weight: 600 });
          // 3D: N(A) as a graph over the k-axis
          const B = 1.9;
          S3.poly([[-B, -B, 0], [B, -B, 0], [B, B, 0], [-B, B, 0]], { fill: 'gray', fillAlpha: 0.08, color: 'faint', width: 1 });
          if (Ai) {
            const n = mv2(Ai, [-Ay[0], -Ay[1]]);   // h(k) = k n
            const kmax = Math.min(2.2, B / Math.max(1e-9, Math.abs(n[0]), Math.abs(n[1])));
            S3.line([-kmax * n[0], -kmax * n[1], -kmax], [kmax * n[0], kmax * n[1], kmax], { color: 'green', width: 3 });
            S3.text('𝒩(A)', [kmax * n[0] * 1.08, kmax * n[1] * 1.08, kmax * 1.08], { color: 'green', size: 13 });
            S3.line([-kmax * n[0], -kmax * n[1], 0], [kmax * n[0], kmax * n[1], 0], { color: 'green', width: 1.2, dash: [5, 4], alpha: 0.7 });
            if (Math.abs(kk) <= kmax) {
              const P = [h[0], h[1], kk];
              S3.line(P, [h[0], h[1], 0], { color: 'gold', width: 1.4, dash: [4, 3] });
              S3.line(P, [0, 0, kk], { color: 'gold', width: 1.4, dash: [4, 3] });
              S3.dot([h[0], h[1], 0], { color: 'gold', r: 3 });
              S3.dot(P, { color: 'gold', r: 6, label: '(h, k)' });
            }
            S3.dot([0, 0, kk], { color: 'purple', r: 4.5, label: 'k' });
          } else {
            // null vector (h₁, h₂) of the singular A_x: h₁ A_x e₁ + h₂ A_x e₂ = 0
            const r1 = Math.hypot(Ax[0][0], Ax[0][1]) > Math.hypot(Ax[1][0], Ax[1][1]) ? Ax[0] : Ax[1];
            const nv = Math.hypot(r1[0], r1[1]) > 1e-9 ? M.normalize([r1[1], -r1[0]]) : [1, 0];
            S3.line([-B * nv[0], -B * nv[1], 0], [B * nv[0], B * nv[1], 0], { color: 'red', width: 3 });
            S3.text('𝒩(A) ⊂ {k = 0}', [B * nv[0], B * nv[1], 0.35], { color: 'red', size: 12 });
          }
          st = { Ax, Ay, D, h, kk };
          v.legend([['blue', '$A_x\\mathbf e_1$'], ['teal', '$A_x\\mathbf e_2$'], ['purple', '$A_y$ and $-kA_y$'], ['green', 'solution $\\mathbf h$ / $\\mathscr N(A)$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const A = [[s.Ax[0][0], s.Ax[0][1], s.Ay[0]], [s.Ax[1][0], s.Ax[1][1], s.Ay[1]]];
          return `$A=[A_x\\,|\\,A_y]=${fmtM(v, A)}$, $\\;\\det A_x=${v.fix(s.D, 3)}$` + (s.h ? `, $\\;\\mathbf h=-(A_x)^{-1}A_y\\,k=(${v.fix(s.h[0], 3)},\\,${v.fix(s.h[1], 3)})$ — the only solution of $A(\\mathbf h,k)=\\mathbf 0$.` : ' — $A_x$ is not invertible: $A(\\mathbf h,k)=\\mathbf 0$ has no solution or infinitely many.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.28 implicit function theorem
    {
      num: '9.28',
      kind: 'Theorem',
      name: 'Implicit function theorem',
      statement: String.raw`Let $\mathbf f$ be a $\mathscr C'$-mapping of an open set $E\subset\R^{n+m}$ into $\R^n$ with $\mathbf f(\mathbf a,\mathbf b)=\mathbf 0$ for some $(\mathbf a,\mathbf b)\in E$. Put $A=\mathbf f'(\mathbf a,\mathbf b)$ and assume $A_x$ is invertible. Then there are open sets $U\subset\R^{n+m}$ and $W\subset\R^m$, with $(\mathbf a,\mathbf b)\in U$ and $\mathbf b\in W$, such that for each $\mathbf y\in W$ there is exactly one $\mathbf x$ with $(\mathbf x,\mathbf y)\in U$ and $\mathbf f(\mathbf x,\mathbf y)=\mathbf 0$.

Calling this $\mathbf x=\mathbf g(\mathbf y)$, the map $\mathbf g$ is a $\mathscr C'$-mapping of $W$ into $\R^n$ with $\mathbf g(\mathbf b)=\mathbf a$, $\mathbf f(\mathbf g(\mathbf y),\mathbf y)=\mathbf 0$ for $\mathbf y\in W$, and
$$\mathbf g'(\mathbf b)=-(A_x)^{-1}A_y .$$`,
      idea: String.raw`Apply the inverse function theorem (9.24) to $\mathbf F(\mathbf x,\mathbf y)=(\mathbf f(\mathbf x,\mathbf y),\mathbf y)$, a $\mathscr C'$ map of $E$ into $\R^{n+m}$. Its derivative at $(\mathbf a,\mathbf b)$ is $(\mathbf h,\mathbf k)\mapsto(A(\mathbf h,\mathbf k),\mathbf k)$, which is one-to-one — hence invertible — by the linear case 9.27. So $\mathbf F$ maps some $U$ one-to-one onto an open $V$, and $\mathbf g(\mathbf y)$ is read off from $\mathbf F^{-1}(\mathbf 0,\mathbf y)$. Differentiating $\mathbf f(\mathbf g(\mathbf y),\mathbf y)=\mathbf 0$ with the chain rule (9.15) gives $A_x\mathbf g'(\mathbf b)+A_y=0$. (Rudin's Example 9.29 applies this to two equations in five unknowns.)`,
      caption: String.raw`Here $n=m=1$: the zero set $\{f=0\}$ is a curve and, as in Rudin, we solve for $x$ in terms of $y$ (or switch roles). Drag $(a,b)$ along the curve and set the size of the box $U$. The green band is the largest $W$ for which every line $y=\text{const}$ in it meets the curve *exactly once* inside the box; over $W$ the curve is the graph of $x=g(y)$ (thick green), with slope $g'(b)=-D_2f/D_1f$, and the dashed red line is where uniqueness first breaks. Drag the gold probe: the right panel is the slice $x\mapsto f(x,y)$, whose zero crossing is transversal when $A_x=D_1f(a,b)\ne0$ and so survives small changes of $y$. At the hollow red points $D_1f=0$ and no $W$ exists.`,
      deps: ['pma-9.24', 'pma-9.27', 'pma-9.15', 'pma-9.21'],
      tags: ['implicit function theorem', 'several variables'],
      viz(v) {
        const M = v.M;
        const c3 = Math.cbrt(2), c3s = c3 * c3, s3 = 1 / Math.sqrt(3), yc = Math.sqrt(-(s3 ** 3) + s3);
        const CURVES = {
          circ: { label: '$x^2+y^2=1$', f: (x, y) => x * x + y * y - 1, fx: (x) => 2 * x, fy: (x, y) => 2 * y, view: [[-1.9, 1.9], [-1.5, 1.5]], p: [0.6, 0.8], spec: [[0, 1], [0, -1], [1, 0], [-1, 0]] },
          fol: { label: 'folium $x^3+y^3=3xy$', f: (x, y) => x ** 3 + y ** 3 - 3 * x * y, fx: (x, y) => 3 * x * x - 3 * y, fy: (x, y) => 3 * y * y - 3 * x, view: [[-2.2, 2.3], [-2.2, 2.3]], p: [1.5, 0], spec: [[0, 0], [c3, c3s], [c3s, c3]] },
          cub: { label: '$y^2=x^3-x$', f: (x, y) => y * y - x ** 3 + x, fx: (x) => -3 * x * x + 1, fy: (x, y) => 2 * y, view: [[-1.6, 2.1], [-2, 2]], p: [1.4, 1.17], spec: [[-1, 0], [0, 0], [1, 0], [-s3, yc], [-s3, -yc]] },
        };
        const which = v.select('', Object.entries(CURVES).map(([value, o]) => ({ value, label: o.label })), 'circ');
        const solve = v.select('solve for', [{ value: 'x', label: '$x=g(y)$ (Rudin)' }, { value: 'y', label: '$y=g(x)$' }], 'x');
        const rho = v.slider('window half-width', 0.06, 0.9, 0.35, { step: 0.01 });
        const L = v.stage({ x: CURVES.circ.view[0], y: CURVES.circ.view[1], equal: true, height: 360, title: 'the zero set $\\{f=0\\}$ and a window about $(a,b)$' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], height: 360, title: 'slice' });
        const project = (x, y) => {
          const C = CURVES[which.value];
          for (const s of C.spec) if (Math.hypot(x - s[0], y - s[1]) < 0.07) return s.slice();
          for (let i = 0; i < 12; i++) { const g = [C.fx(x, y), C.fy(x, y)], n2 = g[0] * g[0] + g[1] * g[1]; if (n2 < 1e-12) break; const f = C.f(x, y); x -= (f * g[0]) / n2; y -= (f * g[1]) / n2; }
          return [x, y];
        };
        const P = L.handle(0.6, 0.8, { color: 'accent', label: '(a,b)', labelPos: 'sw', constrain: project });
        let tau = 0.3;
        const Q = L.handle(0, 0, {
          color: 'gold', r: 6,
          constrain: (x, y) => { const sx = solve.value === 'x', r = rho.value; tau = M.clamp(sx ? (y - P.y) / r : (x - P.x) / r, -1, 1); return sx ? [P.x + r, P.y + tau * r] : [P.x + tau * r, P.y + r]; },
        });
        let last = null, st = null;
        v.render(() => {
          const C = CURVES[which.value], sx = solve.value === 'x';
          if (last !== which.value) { last = which.value; L.setView(...C.view); [P.x, P.y] = project(...C.p); }
          // work in (u, w) = (solved variable, parameter)
          const F = sx ? (u, w) => C.f(u, w) : (u, w) => C.f(w, u);
          const Du = sx ? C.fx : C.fy, Dw = sx ? C.fy : C.fx;
          const toXY = (u, w) => (sx ? [u, w] : [w, u]);
          const a = P.x, b = P.y, u0 = sx ? a : b, w0 = sx ? b : a, r = rho.value;
          const du = Du(a, b), dw = Dw(a, b);
          // other level sets (faint) and the zero set
          const vx = L.bounds.x, vy = L.bounds.y;
          for (const lv of [-1.2, -0.6, 0.6, 1.2]) L.path(contour(C.f, vx, vy, 120, 100, lv), { color: 'faint', width: 0.9 });
          L.path(contour(C.f, vx, vy, 240, 200), { color: 'ink', width: 2.2 });
          for (const p of C.spec) if (Math.abs(Du(p[0], p[1])) < 1e-6) L.dot(p[0], p[1], { color: 'red', r: 5, hollow: true, width: 2 });
          // W = (w0 − δ, w0 + δ): largest δ ≤ r such that each line w = const in W meets {f = 0} exactly once in the box
          const cnt = (w) => rootsOn(F, w, u0 - r, u0 + r, 200);
          const okAt = (dl) => cnt(w0 - dl).length === 1 && cnt(w0 + dl).length === 1;
          let delta = 0, edge = null;
          if (cnt(w0).length === 1) {
            const NW = 48; delta = r;
            for (let j = 1; j <= NW; j++) if (!okAt((r * j) / NW)) { delta = (r * (j - 1)) / NW; edge = (r * j) / NW; break; }
            if (delta === 0) { let lo = 0, hi = r / NW; for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (okAt(m)) lo = m; else hi = m; } delta = lo; edge = hi; }
          }
          const good = delta > r * 2e-3;
          const failLine = (dl) => { for (const w of [w0 + dl, w0 - dl]) { const rt = cnt(w); if (rt.length !== 1) return { w, roots: rt }; } return null; };
          const [bx0, by0] = toXY(u0 - r, w0 - r), [bx1, by1] = toXY(u0 + r, w0 + r);
          L.rect(bx0, by0, bx1, by1, { color: good ? 'green' : 'red', width: 1.8, fill: good ? null : 'red', fillAlpha: 0.08 });
          if (good) {
            const [wx0, wy0] = toXY(u0 - r, w0 - delta), [wx1, wy1] = toXY(u0 + r, w0 + delta);
            L.rect(wx0, wy0, wx1, wy1, { fill: 'green', fillAlpha: 0.16, stroke: false });
            const pts = []; for (let j = 0; j <= 80; j++) { const w = w0 - delta + (2 * delta * j) / 80, rt = cnt(w); pts.push(rt.length === 1 ? toXY(rt[0], w) : null); }
            L.path(pts, { color: 'green', width: 4.5, alpha: 0.85 });
          }
          const fl = good ? (edge != null && edge <= r ? failLine(edge) : null) : failLine(Math.max(r * 0.15, 0.02));
          if (fl) {
            const [p0, p1] = [toXY(u0 - r, fl.w), toXY(u0 + r, fl.w)];
            L.line(p0[0], p0[1], p1[0], p1[1], { color: 'red', width: 1.4, dash: [5, 3], alpha: 0.8 });
            for (const u of fl.roots) { const p = toXY(u, fl.w); L.dot(p[0], p[1], { color: 'red', r: 3.5 }); }
          }
          // tangent line at (a,b)
          if (Math.hypot(du, dw) > 1e-9) { const t = M.normalize([-C.fy(a, b), C.fx(a, b)]); const Lt = 0.7; L.line(a - Lt * t[0], b - Lt * t[1], a + Lt * t[0], b + Lt * t[1], { color: 'accent', width: 1.5, dash: [6, 4] }); }
          // probe
          const wp = w0 + tau * r;
          [Q.x, Q.y] = sx ? [a + r, wp] : [wp, b + r];
          const pr = cnt(wp), pOK = pr.length === 1;
          { const [q0, q1] = [toXY(u0 - r, wp), toXY(u0 + r, wp)]; L.line(q0[0], q0[1], q1[0], q1[1], { color: 'gold', width: 1.5, dash: [3, 3] }); }
          for (const u of pr) { const p = toXY(u, wp); L.dot(p[0], p[1], { color: pOK ? 'gold' : 'red', r: 4.5 }); }
          // right: the slice u ↦ F(u, w) at the probe, and through (a,b)
          const ua = u0 - 1.7 * r, ub = u0 + 1.7 * r;
          let lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 120; i++) { const u = ua + ((ub - ua) * i) / 120; for (const w of [wp, w0]) { const val = F(u, w); if (isFinite(val)) { lo = Math.min(lo, val); hi = Math.max(hi, val); } } }
          const mg = Math.max(hi - lo, 0.05) * 0.15; lo = Math.min(lo, 0) - mg; hi = Math.max(hi, 0) + mg;
          R.setView([ua, ub], [lo, hi]);
          R.setTitle(sx ? 'slice $x\\mapsto f(x,y)$ at the probe height $y$' : 'slice $y\\mapsto f(x,y)$ at the probe position $x$');
          R.vband(u0 - r, u0 + r, { color: good ? 'green' : 'red', alpha: 0.07, edges: true });
          R.fn((u) => F(u, w0), { color: 'muted', width: 1.4, dash: [5, 4] });
          R.fn((u) => F(u, wp), { color: 'gold', width: 2.4 });
          R.hline(0, { color: 'ink', width: 1 });
          for (const u of pr) R.dot(u, 0, { color: pOK ? 'gold' : 'red', r: 4.5 });
          R.dot(u0, 0, { color: 'accent', r: 4, hollow: true });
          st = { a, b, du, dw, good, delta, sx, n: pr.length, inW: Math.abs(wp - w0) < delta };
          v.legend([['ink', '$\\{f=0\\}$'], ['green', sx ? 'the window: $x$-range $\\times$ $W$' : 'the window: $W\\times$ $y$-range', { area: true }], ['gold', 'probe line and slice'], ['muted', 'slice through $(a,b)$', { dash: true }], ['red', 'two roots or none', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const U = s.sx ? 'x' : 'y', W = s.sx ? 'y' : 'x', iu = s.sx ? 1 : 2, iw = s.sx ? 2 : 1, c = s.sx ? 'b' : 'a';
          let out = `$(a,b)=(${v.fix(s.a, 3)},\\,${v.fix(s.b, 3)})$, $\\;D_${iu}f=${v.fix(s.du, 3)}$, $\\;D_${iw}f=${v.fix(s.dw, 3)}$. `;
          if (s.good) out += `$${U}=g(${W})$ on $W=(${c}-\\delta,${c}+\\delta)$, $\\delta=${v.fix(s.delta, 3)}$, with $g'(${c})=-D_${iw}f/D_${iu}f=${v.fix(-s.dw / s.du, 3)}$ — the probe line meets the curve ${s.n === 1 ? 'once' : s.n === 0 ? 'not at all' : s.n + ' times'} in the box` + (s.inW ? ' (it lies in $W$).' : ' (it lies outside $W$).');
          else out += `$D_${iu}f(a,b)${Math.abs(s.du) < 1e-6 ? '=0' : '\\approx0'}$: no $W$ works — the curve is not a graph $${U}=g(${W})$ near $(a,b)$.`;
          return out;
        });
      },
    },
    // ------------------------------------------------------------------ 9.30 rank
    {
      num: '9.30',
      kind: 'Definition',
      name: 'Null space, range and rank',
      statement: String.raw`Let $X$ and $Y$ be vector spaces and $A\in L(X,Y)$. The **null space** of $A$ is $\mathscr N(A)=\{\mathbf x\in X: A\mathbf x=\mathbf 0\}$, a subspace of $X$; the **range** of $A$ is $\mathscr R(A)=A(X)$, a subspace of $Y$. The **rank** of $A$ is the dimension of $\mathscr R(A)$.`,
      idea: String.raw`For $X=\R^n$ the rank is the number of linearly independent columns of the matrix of $A$, and $\dim\mathscr N(A)+\operatorname{rank}A=n$. An operator on $\R^n$ is invertible exactly when its rank is $n$ (9.5); rank $0$ means $A=0$. Rank is *not* continuous: an arbitrarily small perturbation can raise it. The rank theorem (9.32) shows that a $\mathscr C'$ map whose derivative has *constant* rank $r$ looks, in suitable coordinates, like its own linear part.`,
      caption: String.raw`A linear map $A:\R^3\to\R^3$ of prescribed rank. Left: a cube and $\mathscr N(A)$ (red); right: the image of the cube inside $\mathscr R(A)$ (blue). Slide the gold point along a line parallel to $\mathscr N(A)$: its image does not move. Drag either panel to rotate it.`,
      deps: ['pma-9.1', 'pma-9.4'],
      tags: ['linear algebra', 'rank'],
      viz(v) {
        const M = v.M;
        // bases chosen so that the null plane / range plane face the default camera
        const Vb = M.gramSchmidt([[0.5, -0.5, 0.7], [1, 0.4, 0], [0, 0.3, 1]]);
        const Ub = (([n, e1, e2]) => [e1, e2, n])(M.gramSchmidt([[0.36, -0.43, 0.83], [1, 0.3, 0.1], [0.2, 1, 0]]));
        const SIG = { 3: [1.35, 1, 0.65], 2: [1.35, 1, 0], 1: [1.5, 0, 0], 0: [0, 0, 0] };
        const rank = v.select('rank $A$', [3, 2, 1, 0].map((r) => ({ value: r, label: String(r) })), 2);
        const t = v.slider('move $\\mathbf x$ along $\\mathscr N(A)$', -1, 1, 0.35, { step: 0.01 });
        const SL = v.stage3d({ range: 1.75, height: 340, yaw: -0.7, pitch: 0.38, axisLength: 1.4, labels: ['x₁', 'x₂', 'x₃'], title: 'domain $\\R^3$: cube and $\\mathscr N(A)$' });
        const SR = v.stage3d({ range: 1.75, height: 340, yaw: -0.7, pitch: 0.38, axisLength: 1.4, labels: ['y₁', 'y₂', 'y₃'], title: 'target $\\R^3$: $A(\\text{cube})\\subset\\mathscr R(A)$' });
        const Amap = (s, x) => { const out = [0, 0, 0]; for (let i = 0; i < 3; i++) { const c = s[i] * M.dot(Vb[i], x); for (let j = 0; j < 3; j++) out[j] += c * Ub[i][j]; } return out; };
        const h = 0.55, C = [];
        for (const a of [-h, h]) for (const b of [-h, h]) for (const c of [-h, h]) C.push([a, b, c]);
        const E = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = C[i].reduce((s, x, k) => s + (x !== C[j][k] ? 1 : 0), 0); if (d === 1) E.push([i, j]); }
        const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
        const patch = (u, w, s) => [M.vadd(M.vscale(u, s), M.vscale(w, s)), M.vadd(M.vscale(u, -s), M.vscale(w, s)), M.vadd(M.vscale(u, -s), M.vscale(w, -s)), M.vadd(M.vscale(u, s), M.vscale(w, -s))];
        let st = null;
        v.render(() => {
          const r = +rank.value, s = SIG[r];
          for (const [i, j] of E) SL.line(C[i], C[j], { color: 'ink', width: 1.2, alpha: 0.55 });
          // null space
          const nullDirs = [0, 1, 2].filter((i) => s[i] === 0).map((i) => Vb[i]);
          if (nullDirs.length === 1) { SL.line(M.vscale(nullDirs[0], -1.5), M.vscale(nullDirs[0], 1.5), { color: 'red', width: 3 }); SL.text('𝒩(A)', M.vscale(nullDirs[0], 1.65), { color: 'red', size: 13 }); }
          if (nullDirs.length === 2) { SL.poly(patch(nullDirs[0], nullDirs[1], 1.2), { fill: 'red', fillAlpha: 0.14, color: 'red', alpha: 0.6 }); SL.text('𝒩(A)', M.vadd(M.vscale(nullDirs[0], 1.3), M.vscale(nullDirs[1], 1.3)), { color: 'red', size: 13 }); }
          if (nullDirs.length === 0) SL.dot([0, 0, 0], { color: 'red', r: 5, label: '𝒩(A) = {0}' });
          // range and image of the cube
          const AC = C.map((p) => Amap(s, p));
          const rangeDirs = [0, 1, 2].filter((i) => s[i] !== 0).map((i) => Ub[i]);
          if (rangeDirs.length === 2) SR.poly(patch(rangeDirs[0], rangeDirs[1], 1.1), { fill: 'blue', fillAlpha: 0.07, color: 'blue', alpha: 0.35 });
          if (rangeDirs.length === 1) SR.line(M.vscale(rangeDirs[0], -1.6), M.vscale(rangeDirs[0], 1.6), { color: 'blue', width: 1.5, alpha: 0.5 });
          if (r > 0) { for (const f of FACES) SR.poly(f.map((i) => AC[i]), { fill: 'blue', fillAlpha: 0.1, color: 'blue', alpha: 0.25, width: 0.8 }); for (const [i, j] of E) SR.line(AC[i], AC[j], { color: 'blue', width: 1.5 }); }
          else SR.dot([0, 0, 0], { color: 'blue', r: 5, label: 'ℛ(A) = {0}' });
          if (r === 2) SR.text('ℛ(A)', M.vadd(M.vscale(rangeDirs[0], 1.0), M.vscale(rangeDirs[1], -1.0)), { color: 'blue', size: 13 });
          if (r === 1) SR.text('ℛ(A)', M.vscale(rangeDirs[0], 1.75), { color: 'blue', size: 13 });
          // the test point and the line through it parallel to N(A) (or to v₃ when N(A) = {0})
          const n = nullDirs[0] || Vb[2], x0 = M.vadd(M.vscale(Vb[0], 0.4), M.vscale(Vb[1], -0.5));
          const xt = M.vadd(x0, M.vscale(n, t.value));
          SL.line(M.vadd(x0, M.vscale(n, -1)), M.vadd(x0, M.vscale(n, 1)), { color: 'gold', width: 1.4, dash: [4, 3] });
          SL.dot(xt, { color: 'gold', r: 6, label: 'x' });
          const y0 = Amap(s, M.vadd(x0, M.vscale(n, -1))), y1 = Amap(s, M.vadd(x0, M.vscale(n, 1)));
          if (M.dist(y0, y1) > 1e-6) SR.line(y0, y1, { color: 'gold', width: 1.4, dash: [4, 3] });
          SR.dot(Amap(s, xt), { color: 'gold', r: 6, label: 'Ax' });
          st = { r, Ax: Amap(s, xt) };
          v.legend([['red', 'null space $\\mathscr N(A)$'], ['blue', 'range $\\mathscr R(A)$ and $A(\\text{cube})$'], ['gold', '$\\mathbf x$ and $A\\mathbf x$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\operatorname{rank}A=\\dim\\mathscr R(A)=${s.r}$, $\\;\\dim\\mathscr N(A)=${3 - s.r}$, $\\;$ sum $=3=\\dim\\R^3$. $\\;A\\mathbf x=(${s.Ax.map((x) => v.fix(x, 3)).join(',\\,')})$` + (s.r < 3 ? ' — unchanged as $\\mathbf x$ slides along $\\mathscr N(A)$.' : ' — $\\mathscr N(A)=\\{\\mathbf 0\\}$, so it moves.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.31 projections
    {
      num: '9.31',
      kind: 'Definition',
      name: 'Projections',
      statement: String.raw`An operator $P\in L(X)$ on a vector space $X$ is a **projection** if $P^2=P$. Every projection has the following properties, and projections onto any subspace exist:
(a) each $\mathbf x\in X$ has exactly one decomposition $\mathbf x=\mathbf x_1+\mathbf x_2$ with $\mathbf x_1\in\mathscr R(P)$ and $\mathbf x_2\in\mathscr N(P)$, namely $\mathbf x_1=P\mathbf x$; moreover $P\mathbf x=\mathbf x$ for all $\mathbf x\in\mathscr R(P)$;
(b) if $X$ is finite-dimensional and $X_1$ is a subspace of $X$, there is a projection $P$ in $X$ with $\mathscr R(P)=X_1$.`,
      idea: String.raw`(a) Since $P^2=P$, $P(\mathbf x-P\mathbf x)=\mathbf 0$, so $\mathbf x=P\mathbf x+(\mathbf x-P\mathbf x)$ is such a decomposition; it is unique because a vector in $\mathscr R(P)\cap\mathscr N(P)$ satisfies $\mathbf z=P\mathbf z=\mathbf 0$. (b) Extend a basis $\mathbf u_1,\dots,\mathbf u_r$ of $X_1$ to a basis of $X$ (9.3) and let $P$ keep the first $r$ coordinates and kill the others. The null space is far from unique — any complementary subspace will do. The rank theorem (9.32) uses such a $P$ to split the target space into $Y_1=\mathscr R(A)$ and $Y_2=\mathscr N(P)$.`,
      caption: String.raw`Drag the direction of $\mathscr R(P)$ (blue handle), the direction of $\mathscr N(P)$ (purple handle) and the point $\mathbf x$ (gold). $P\mathbf x$ is found by sliding $\mathbf x$ parallel to $\mathscr N(P)$ until it meets $\mathscr R(P)$; applying $P$ again changes nothing. Keep the blue line and turn the purple one: many projections share the same range, as (b) allows. The toggle shows the orthogonal choice.`,
      deps: ['pma-9.30', 'pma-9.3'],
      tags: ['linear algebra', 'projections'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 360 });
        const ortho = v.toggle('orthogonal projection ($\\mathscr N(P)\\perp\\mathscr R(P)$)', false);
        const flow = v.toggle('show $P$ acting on a grid', false);
        const onCircle = (rr) => (x, y) => { const n = Math.hypot(x, y) || 1; return [(rr * x) / n, (rr * y) / n]; };
        const hu = S.handle(1.85 * Math.cos(0.38), 1.85 * Math.sin(0.38), { color: 'blue', constrain: onCircle(1.85) });
        const hw = S.handle(1.45 * Math.cos(2.1), 1.45 * Math.sin(2.1), { color: 'purple', constrain: onCircle(1.45) });
        const hx = S.handle(0.6, 1.35, { color: 'gold', label: 'x' });
        let st = null;
        v.render(() => {
          const u = M.normalize([hu.x, hu.y]);
          let w = M.normalize([hw.x, hw.y]);
          if (ortho.value) { w = [-u[1], u[0]]; hw.x = 1.45 * w[0]; hw.y = 1.45 * w[1]; }
          hw.visible = !ortho.value;
          const B = [[u[0], w[0]], [u[1], w[1]]], Bi = inv2(B), D = det2(B);
          const ext = 12;
          S.line(-ext * u[0], -ext * u[1], ext * u[0], ext * u[1], { color: 'blue', width: 2 });
          S.line(-ext * w[0], -ext * w[1], ext * w[0], ext * w[1], { color: 'purple', width: 1.6, dash: [6, 4] });
          S.tex('\\mathscr R(P)', 2.7 * u[0], 2.7 * u[1] + 0.22, { color: 'blue', size: 15 });
          S.tex('\\mathscr N(P)', -1.75 * w[0] + 0.28, -1.75 * w[1], { color: 'purple', size: 15 });
          if (Math.abs(D) < 0.05) { S.corner('the two lines coincide: no complement, no projection', 'tl', { color: 'red', weight: 600 }); st = null; return; }
          const P = M.matMul(M.matMul(B, [[1, 0], [0, 0]]), Bi);
          if (flow.value) {
            for (let i = -5; i <= 5; i++) for (let j = -3; j <= 3; j++) { const p = [i * 0.55, j * 0.6], q = mv2(P, p); S.line(p[0], p[1], q[0], q[1], { color: 'purple', width: 0.8, alpha: 0.35 }); S.dot(p[0], p[1], { color: 'muted', r: 1.8 }); }
          }
          const x = [hx.x, hx.y], x1 = mv2(P, x), x2 = [x[0] - x1[0], x[1] - x1[1]];
          S.poly([[0, 0], x1, x, x2], { fill: 'gold', fillAlpha: 0.08, stroke: false });
          S.line(x[0], x[1], x1[0], x1[1], { color: 'purple', width: 1.5, dash: [4, 3] });
          S.arrow(0, 0, x[0], x[1], { color: 'gold', width: 2 });
          S.arrow(0, 0, x1[0], x1[1], { color: 'blue', width: 2.6 });
          S.arrow(0, 0, x2[0], x2[1], { color: 'purple', width: 2.6 });
          S.dot(x1[0], x1[1], { color: 'blue', r: 5.5, label: 'Px = P²x', labelPos: x1[1] >= 0 ? 'se' : 'ne' });
          S.tex('\\mathbf x_2=\\mathbf x-P\\mathbf x', x2[0] / 2, x2[1] / 2, { color: 'purple', size: 13, dx: -8, align: 'right' });
          S.dot(0, 0, { color: 'ink', r: 3 });
          const P2 = M.matMul(P, P); const err = Math.max(...[0, 1].flatMap((i) => [0, 1].map((j) => Math.abs(P2[i][j] - P[i][j]))));
          st = { P, err, tr: P[0][0] + P[1][1], x1, x2 };
          v.legend([['blue', '$\\mathscr R(P)$ and $\\mathbf x_1=P\\mathbf x$'], ['purple', '$\\mathscr N(P)$ and $\\mathbf x_2$', { dash: true }], ['gold', '$\\mathbf x=\\mathbf x_1+\\mathbf x_2$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return 'Choose two different lines.';
          return `$P=${fmtM(v, s.P, 3)}$, $\\;\\max|P^2-P|=${s.err < 1e-12 ? '0' : v.fmt(s.err, 2)}$ (to rounding), $\\;\\operatorname{tr}P=${v.fix(s.tr, 3)}=\\operatorname{rank}P$` + (ortho.value ? ' — orthogonal: $P$ is also symmetric.' : ' — an oblique projection: $P\\ne P^{\\mathsf T}$ in general.');
        });
      },
    },
  ],
};
