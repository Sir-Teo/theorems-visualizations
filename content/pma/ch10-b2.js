// Rudin, Principles of Mathematical Analysis — Chapter 10 (part b2): 10.33–10.40
// Stokes' theorem, closed and exact forms, the lemma behind the Poincaré lemma, the Poincaré
// lemma in convex sets, and its transfer to sets that are C''-equivalent to convex ones.
// The chapter title lives in ch10.js.

const GLX = [0.0198550717512319, 0.1016667612931866, 0.2372337950418355, 0.4082826787521751, 0.5917173212478249, 0.7627662049581645, 0.8983332387068134, 0.9801449282487681];
const GLW = [0.0506142681451881, 0.1111905172266872, 0.1568533229389436, 0.1813418916891810, 0.1813418916891810, 0.1568533229389436, 0.1111905172266872, 0.0506142681451881];
/** Composite 8-point Gauss–Legendre rule for ∫_a^b f (m panels). */
function quad(f, a, b, m = 4) {
  const h = (b - a) / m; let s = 0;
  for (let i = 0; i < m; i++) for (let k = 0; k < 8; k++) s += GLW[k] * f(a + h * (i + GLX[k]));
  return s * h;
}
/** ∫ over the standard simplex Q² of g(u1, u2). */
function quadQ2(g, m = 2) { return quad((s) => (1 - s) * quad((t) => g(s, (1 - s) * t), 0, 1, m), 0, 1, m); }
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const sub2 = (p, q) => [p[0] - q[0], p[1] - q[1]];
const lerp2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const cen = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
/** ∫ of the 1-form w(x,y) = [a,b] along the curve g: [0,1] → R² (derivative by central differences). */
function lineInt(w, g, m = 4) {
  const h = 1e-5;
  return quad((t) => { const p = g(t), q = g(t + h), r = g(t - h); const [a, b] = w(p[0], p[1]); return a * (q[0] - r[0]) / (2 * h) + b * (q[1] - r[1]) / (2 * h); }, 0, 1, m);
}
/** Arrowhead centred at m, pointing along the data direction d. */
function headAt(S, m, d, st = {}) {
  const X = S.X(m[0]), Y = S.Y(m[1]);
  let dx = S.X(m[0] + d[0]) - X, dy = S.Y(m[1] + d[1]) - Y; const L = Math.hypot(dx, dy); if (!(L > 1e-12)) return;
  dx /= L; dy /= L; const hd = st.head ?? 9, len = hd * 2.3;
  const a = S.inv(X - dx * len / 2, Y - dy * len / 2), b = S.inv(X + dx * len / 2, Y + dy * len / 2);
  S.arrow(a[0], a[1], b[0], b[1], { color: st.color || 'ink', head: hd, width: st.width ?? 2, alpha: st.alpha });
}
function segArrow(S, p, q, st = {}) { S.line(p[0], p[1], q[0], q[1], st); headAt(S, lerp2(p, q, st.at ?? 0.55), sub2(q, p), st); }
function pathArrows(S, pts, st = {}, fr = [0.55]) {
  S.path(pts, st);
  for (const f of fr) { const x = f * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(x)); headAt(S, lerp2(pts[i], pts[i + 1], x - i), sub2(pts[i + 1], pts[i]), st); }
}
/** Colour of a scalar value with contour banding (lines every 1/k). */
function banded(v, t, val, k, name = 'viridis') {
  const c = v.M.cmap(t, name), b = 0.8 + 0.2 * Math.abs(2 * v.M.fract(val * k) - 1);
  return [c[0] * b, c[1] * b, c[2] * b];
}
/** The 1-form η = (x dy − y dx)/(x² + y²) of Example 10.36, as a coefficient vector [a, b]. */
const ETA = (x, y) => { const r2 = x * x + y * y; return [-y / r2, x / r2]; };
/** Does the segment p→q stay inside the set `inside`? (sampled) */
function segInside(inside, p, q, n = 60) { for (let i = 0; i <= n; i++) { const r = lerp2(p, q, i / n); if (!inside(r[0], r[1])) return false; } return true; }

export default {
  book: 'pma',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.33
    {
      num: '10.33',
      kind: 'Theorem',
      name: "Stokes' theorem",
      statement: String.raw`**Stokes' theorem.** Take a $k$-chain $\Psi$ of class $\mathscr{C}''$ in an open set $V\subset\R^m$ and a $(k-1)$-form $\omega$ of class $\mathscr{C}'$ on $V$. Integrating the derivative $d\omega$ over $\Psi$ gives the same number as integrating $\omega$ itself over the boundary chain $\partial\Psi$:
$$\int_\Psi d\omega=\int_{\partial\Psi}\omega .$$`,
      idea: String.raw`Both sides are additive over the simplexes of $\Psi$, so take $\Psi=\Phi=T\circ\sigma$. Pulling back along $T$ (10.25) and using $d(\omega_T)=(d\omega)_T$ (10.22) reduces the claim to the affine simplex $\sigma$ in $\R^k$ and the form $\omega_T$; by 10.27 one may take $\sigma=[0,e_1,\dots,e_k]$. For a single term $f\,dx_1\wedge\dots\wedge\widehat{dx_r}\wedge\dots\wedge dx_k$ the left side is an iterated integral of $D_rf$ over $Q^k$; integrating in $x_r$ first (fundamental theorem of calculus, 6.21) leaves exactly the contributions of the faces of $Q^k$ with the signs prescribed by $\partial$. The cases $k=1$, $k=m=2$ and $k=m=3$ are the fundamental theorem of calculus, Green's theorem and the divergence theorem.`,
      caption: String.raw`Drag $a,b,c,d$ (left) and bend the map $T$. The chain $\Psi=T\sigma_1+T\sigma_2$ lives in $V$ (right), shaded by the coefficient of $d\omega$; the shared edge is traversed in opposite directions and cancels, so $\partial\Psi$ is the green outer loop. The bottom strip accumulates $\int\omega$ as the gold point runs along $\partial\Psi$; it ends exactly at $\int_\Psi d\omega$ (dashed). Replace $\Phi_2$ by $-\Phi_2$: the inner edge no longer cancels, both sides change, and they still agree.`,
      deps: ['pma-10.30', 'pma-10.25', 'pma-10.22', 'pma-10.27', 'pma-6.21'],
      see: ['rca-10.13', 'rca-10.14', 'rca-10.35'],
      tags: ['Stokes', 'differential forms'],
      viz(v) {
        const FORMS = {
          wave: { label: '$\\omega=\\sin 2y\\,dx+(x\\cos y+\\tfrac12x^3)\\,dy$', w: (x, y) => [Math.sin(2 * y), x * Math.cos(y) + 0.5 * x ** 3], curl: (x, y) => Math.cos(y) + 1.5 * x * x - 2 * Math.cos(2 * y), r: 3 },
          rot: { label: '$\\omega=-y\\,dx+x\\,dy$', w: (x, y) => [-y, x], curl: () => 2, r: 3 },
          ex: { label: '$\\omega=d(x^2y)$', w: (x, y) => [2 * x * y, x * x], curl: () => 0, r: 3 },
        };
        const fm = v.select('', Object.entries(FORMS).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const beta = v.slider('bending of $T$', 0, 0.45, 0.32, { step: 0.01 });
        const flip = v.toggle('use $-\\Phi_2$', false);
        const E = v.stage({ x: [-1.5, 1.5], y: [-1.35, 1.35], equal: true, height: 300, axes: false, weight: 0.62, minWidth: 220, title: 'affine chain $\\sigma_1\\pm\\sigma_2$ in $E$' });
        const V = v.stage({ x: [-2.1, 2.1], y: [-1.6, 1.6], equal: true, height: 300, axes: false, title: '$\\Psi=T\\sigma_1\\pm T\\sigma_2$ in $V$, shaded by $d\\omega$' });
        const B = v.stage({ x: [0, 1], y: [-1, 1], height: 150, full: true, axes: 'box', xticks: [], title: 'running integral of $\\omega$ along $\\partial\\Psi$' });
        const H = [[-1.15, -0.85], [1.1, -0.95], [1.0, 0.95], [-1.0, 1.0]].map(([x, y], i) => E.handle(x, y, { color: 'ink', label: 'abcd'[i], labelPos: ['sw', 'se', 'ne', 'nw'][i] }));
        const T = (x, y, b) => [x + b * Math.sin(1.4 * y + 0.3), y + b * Math.sin(1.2 * x)];
        const JT = (x, y, b) => 1 - 1.68 * b * b * Math.cos(1.4 * y + 0.3) * Math.cos(1.2 * x);
        v.legend([['red', '$d\\omega>0$', { area: true }], ['blue', '$d\\omega<0$', { area: true }], ['green', '$\\partial\\Psi$'], ['muted', 'cancelling edge', { dash: true }], ['gold', 'running $\\int_{\\partial\\Psi}\\omega$']]);
        let st = null;
        v.animate((t) => {
          const F = FORMS[fm.value], b = beta.value;
          const P = H.map((h) => [h.x, h.y]);
          const simps = [{ v: [P[0], P[1], P[3]], s: 1, n: '1' }, { v: [P[2], P[3], P[1]], s: flip.value ? -1 : 1, n: '2' }];
          // ---- area side: Σ s_i ∫_{Q²} (dω)(T σ_i(u)) J_T J_σi du
          let area = 0;
          for (const sm of simps) {
            const [p0, p1, p2] = sm.v, A1 = sub2(p1, p0), A2 = sub2(p2, p0), Js = det2(A1, A2);
            area += sm.s * quadQ2((u1, u2) => { const x = p0[0] + u1 * A1[0] + u2 * A2[0], y = p0[1] + u1 * A1[1] + u2 * A2[1]; const q = T(x, y, b); return F.curl(q[0], q[1]) * JT(x, y, b) * Js; }, 3);
          }
          // ---- boundary side: oriented edges of every ∂(s_i σ_i), normalised to sign +1, cancelling reversed pairs
          const edges = [];
          for (const sm of simps) { const [p0, p1, p2] = sm.v; for (const [x, y] of [[p1, p2], [p2, p0], [p0, p1]]) edges.push(sm.s > 0 ? { p: x, q: y } : { p: y, q: x }); }
          const same = (x, y) => Math.abs(x[0] - y[0]) < 1e-12 && Math.abs(x[1] - y[1]) < 1e-12;
          const used = new Array(edges.length).fill(false);
          for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) if (!used[i] && !used[j] && same(edges[i].p, edges[j].q) && same(edges[i].q, edges[j].p)) { used[i] = used[j] = true; edges[i].cancel = edges[j].cancel = true; edges[i].first = true; }
          const rem = edges.filter((e) => !e.cancel);
          const img = (e) => (s) => { const r = lerp2(e.p, e.q, s); return T(r[0], r[1], b); };
          // ---- drawing: E
          for (const sm of simps) {
            E.poly(sm.v, { fill: sm.s > 0 ? 'accent' : 'red', fillAlpha: 0.13, stroke: false });
            const c = cen(sm.v); E.tex(`${sm.s > 0 ? '' : '-'}\\sigma_${sm.n}`, c[0], c[1], { color: sm.s > 0 ? 'accent' : 'red', size: 15 });
          }
          edges.forEach((e, i) => { if (e.cancel && e.first) E.segment(e.p, e.q, { color: 'muted', width: 1.4, dash: [5, 5] }); });
          for (const e of rem) segArrow(E, e.p, e.q, { color: 'green', width: 2.4, head: 10 });
          // ---- drawing: V
          const m = Math.max(0.5, F.r);
          V.heat(F.curl, { range: [-m, m], cmap: 'diverging', res: 3, alpha: 0.4, key: fm.value });
          for (let k = -4; k <= 4; k++) { const c = k * 0.4; V.curve((s) => T(c, s, b), -1.6, 1.6, { color: 'ink', alpha: 0.12, width: 1, n: 60 }); V.curve((s) => T(s, c, b), -1.6, 1.6, { color: 'ink', alpha: 0.12, width: 1, n: 60 }); }
          for (const sm of simps) {
            const out = [];
            for (const [x, y] of [[sm.v[0], sm.v[1]], [sm.v[1], sm.v[2]], [sm.v[2], sm.v[0]]]) for (let i = 0; i < 30; i++) out.push(T(...lerp2(x, y, i / 30), b));
            V.poly(out, { fill: sm.s > 0 ? 'accent' : 'red', fillAlpha: 0.14, stroke: false });
          }
          for (const e of edges) if (e.cancel && e.first) V.curve(img(e), 0, 1, { color: 'ink', width: 1.6, dash: [5, 5], n: 40 });
          // doubled edges (when −Φ2 is used) are drawn thicker
          rem.forEach((e, i) => {
            const twin = rem.findIndex((f, j) => j !== i && same(f.p, e.p) && same(f.q, e.q));
            const pts = []; for (let k = 0; k <= 50; k++) pts.push(img(e)(k / 50));
            pathArrows(V, pts, { color: 'green', width: twin >= 0 ? 5 : 3, head: 12 }, [0.5]);
            if (twin > i) { const q = img(e)(0.5); V.text('×2', q[0], q[1], { color: 'green', dx: 16, dy: -12, weight: 700 }); }
          });
          // ---- running integral along ∂Ψ (edges in order)
          const Ns = 40, run = [[0, 0]]; let acc = 0;
          rem.forEach((e, i) => {
            const g = img(e);
            for (let k = 0; k < Ns; k++) { acc += lineInt(F.w, (s) => g((k + s) / Ns), 1); run.push([(i + (k + 1) / Ns) / rem.length, acc]); }
          });
          const lo = Math.min(0, area, ...run.map((r) => r[1])), hi = Math.max(0, area, ...run.map((r) => r[1])), pad = Math.max(0.2, (hi - lo) * 0.15);
          B.setView([0, 1], [lo - pad, hi + pad]);
          B.hline(0, { color: 'faint', width: 1 });
          for (let i = 1; i < rem.length; i++) B.vline(i / rem.length, { color: 'grid', width: 1 });
          B.hline(area, { color: 'ink', width: 1.4, dash: [6, 4] });
          B.tex('\\int_\\Psi d\\omega', 0.995, area, { color: 'ink', align: 'right', baseline: 'top', dy: 4, size: 14 });
          B.path(run, { color: 'gold', width: 3 });
          const s = Math.min(1, (t % 8) / 7), idx = Math.min(rem.length - 1, Math.floor(s * rem.length)), fr = s * rem.length - idx;
          const gp = img(rem[idx])(Math.min(1, fr));
          V.dot(gp[0], gp[1], { color: 'gold', r: 6 });
          const kk = Math.min(run.length - 1, Math.round(s * (run.length - 1)));
          B.dot(run[kk][0], run[kk][1], { color: 'gold', r: 5 });
          st = { area, bd: acc, n: rem.length, c: edges.length - rem.length };
        }, { period: 8 });
        v.readout(() => {
          if (!st) return '';
          return `$\\int_\\Psi d\\omega = ${v.fix(st.area, 5)}$ (a double integral over the pieces), $\\;\\int_{\\partial\\Psi}\\omega = ${v.fix(st.bd, 5)}$ (line integrals over the ${st.n} surviving edges; ${st.c} cancelled).`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.34
    {
      num: '10.34',
      kind: 'Definition',
      name: 'Closed and exact forms',
      statement: String.raw`A $k$-form $\omega$ on an open set $E\subset\R^n$ is called *exact* in $E$ when it is the derivative $d\lambda$ of some $(k-1)$-form $\lambda$ on $E$, and *closed* when it is of class $\mathscr{C}'$ and $d\omega=0$.

Since $d(d\lambda)=0$ (10.20), exact forms of class $\mathscr{C}'$ are closed. Whether closed forms are exact depends on $E$: the form
$$\eta=\frac{x\,dy-y\,dx}{x^2+y^2}$$
is closed on $\R^2\setminus\{0\}$ but not exact there.`,
      idea: String.raw`By Stokes' theorem an exact form integrates to $0$ over every closed chain (one with $\partial\Gamma=0$), and a closed form integrates to $0$ over every chain that is a boundary in $E$. For $\eta$, a circle around the origin gives $\int\eta=2\pi\ne0$, so $\eta$ cannot be exact in the punctured plane; locally $\eta=d\theta$ for a branch of the polar angle, but no branch is continuous all the way around the origin. Whether a closed form must be exact is a property of the region: it is so in convex sets (10.39).`,
      caption: String.raw`Choose a form and drag the loop $\gamma$ (centre $c$, grey handle for the size). The right panel accumulates $\int_\gamma\omega$ around the loop. For $\eta$ the result is $2\pi$ times the number of times $\gamma$ winds around the excluded origin, and $0$ otherwise; the dashed red ray is where any would-be potential $\theta$ jumps by $2\pi$. The exact form gives $0$ for every loop; the non-closed form $-y\,dx+x\,dy$ gives twice the enclosed area.`,
      deps: ['pma-10.20', 'pma-10.18'],
      tags: ['closed forms', 'exact forms'],
      viz(v) {
        const FORMS = {
          eta: { label: '$\\eta$ (closed, not exact)', w: ETA, curl: () => 0 },
          ex: { label: '$d(x^2-y^2)$ (exact)', w: (x, y) => [2 * x, -2 * y], curl: () => 0 },
          nc: { label: '$-y\\,dx+x\\,dy$ (not closed)', w: (x, y) => [-y, x], curl: () => 2 },
        };
        const fm = v.select('$\\omega=$', Object.entries(FORMS).map(([value, o]) => ({ value, label: o.label })), 'eta');
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, height: 340, axes: false, title: 'the form $\\omega$ and a closed curve $\\gamma$' });
        const B = v.stage({ x: [0, 1], y: [-1, 7], height: 340, axes: 'box', weight: 0.62, minWidth: 220, xlabel: 't', xticks: [0, 0.5, 1], title: '$\\int_{\\gamma|_{[0,t]}}\\omega$' });
        const c = S.handle(0.45, 0.4, { color: 'accent', label: 'c', labelPos: 'ne' });
        const rh = S.handle(1.55, 0.4, { color: 'gray', r: 6 });
        let prev = [c.x, c.y];
        c.onDrag = () => { rh.x += c.x - prev[0]; rh.y += c.y - prev[1]; prev = [c.x, c.y]; };
        let st = null;
        v.render(() => {
          const F = FORMS[fm.value];
          prev = [c.x, c.y];
          const R = Math.max(0.15, Math.hypot(rh.x - c.x, rh.y - c.y)), a0 = Math.atan2(rh.y - c.y, rh.x - c.x);
          const gam = (t) => { const th = a0 + 2 * Math.PI * t, r = R * (1 + 0.16 * Math.sin(3 * th)); return [c.x + r * Math.cos(th), c.y + r * Math.sin(th)]; };
          S.field((x, y) => { const w = F.w(x, y); const L = Math.hypot(w[0], w[1]); return L > 1e-9 ? [w[0] / L, w[1] / L] : [0, 0]; }, { spacing: 30, color: 'muted', alpha: 0.5 });
          if (fm.value === 'eta') {
            S.line(0, 0, -5, 0, { color: 'red', width: 1.6, dash: [6, 5], alpha: 0.8 });
            S.tex('\\theta\\ \\text{jumps by }2\\pi', -1.35, 0, { color: 'red', dy: -14, size: 13 });
            S.dot(0, 0, { hollow: true, color: 'red', r: 5, label: '0 ∉ E', labelPos: 's' });
          }
          // running integral
          const N = 400, run = [[0, 0]]; let acc = 0;
          for (let i = 0; i < N; i++) { acc += lineInt(F.w, (s) => gam((i + s) / N), 1); run.push([(i + 1) / N, acc]); }
          const pts = []; for (let i = 0; i <= 240; i++) pts.push(gam(i / 240));
          S.poly(pts, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          pathArrows(S, pts, { color: 'accent', width: 3, head: 12 }, [0.2, 0.53, 0.86]);
          const lo = Math.min(-0.5, ...run.map((r) => r[1])), hi = Math.max(7, ...run.map((r) => r[1]));
          B.setView([0, 1], [lo - 0.4, hi + 0.4]);
          B.hline(0, { color: 'faint', width: 1 });
          const tp = 2 * Math.PI;
          for (const k of [-1, 1]) if (tp * k > lo - 0.4 && tp * k < hi + 0.4) { B.hline(tp * k, { color: 'green', width: 1.2, dash: [5, 4] }); B.tex(k > 0 ? '2\\pi' : '-2\\pi', 0.02, tp * k, { color: 'green', align: 'left', baseline: 'bottom', dy: -2, size: 14 }); }
          B.path(run, { color: 'accent', width: 3 });
          B.dot(1, acc, { color: 'accent', r: 5 });
          const g = v.M.winding((t) => new v.Cx(...gam(t)), new v.Cx(0, 0), 600);
          // dω at c, by finite differences of the coefficients
          const h = 1e-4, w = F.w;
          const curl = (w(c.x + h, c.y)[1] - w(c.x - h, c.y)[1]) / (2 * h) - (w(c.x, c.y + h)[0] - w(c.x, c.y - h)[0]) / (2 * h);
          st = { acc, g, curl, f: fm.value };
        });
        v.readout(() => {
          if (!st) return '';
          const { acc, g, curl, f } = st;
          const head = `numerically $d\\omega = ${v.fix(curl, 4)}\\,dx\\wedge dy$ at $c$; $\\;\\oint_\\gamma\\omega = ${v.fix(acc, 4)}$`;
          if (f === 'eta') return head + `$\\;=2\\pi\\cdot ${g}$, where $${g}$ is the winding number of $\\gamma$ about $0$. ` + (g ? 'A nonzero value rules out $\\eta=d\\lambda$.' : 'Move $\\gamma$ around the origin.');
          if (f === 'ex') return head + ' — exact forms integrate to $0$ over every closed curve.';
          return head + ' — this form is not closed, so it is certainly not exact.';
        });
      },
    },
    // ------------------------------------------------------------------ 10.38
    {
      num: '10.38',
      kind: 'Theorem',
      name: 'Partial antiderivatives in a convex set',
      statement: String.raw`Fix an integer $p$ with $1\le p\le n$ and a convex open set $E\subset\R^n$. If $f\in\mathscr{C}'(E)$ has $D_jf=0$ throughout $E$ for every $j>p$, then $f$ has an antiderivative in the variable $x_p$ that is still independent of $x_{p+1},\dots,x_n$: some $F\in\mathscr{C}'(E)$ satisfies
$$D_pF=f\quad\text{and}\quad D_jF=0\ \ (p<j\le n)\qquad\text{everywhere in }E.$$`,
      idea: String.raw`By convexity, $f$ depends only on $x_1,\dots,x_p$, so it is a function $\varphi$ on the projection $V$ of $E$ to $\R^p$, which is again convex. If $p=1$, $V$ is an interval and $F(x)=\int_c^{x_1}\varphi(t)\,dt$. If $p>1$, choose a $\mathscr{C}'$ function $\alpha$ whose graph $x_p=\alpha(x_1,\dots,x_{p-1})$ lies in $V$, and integrate along the $x_p$-fibre from the graph: $F(x)=\int_{\alpha(x')}^{x_p}\varphi(x',t)\,dt$. Convexity keeps the whole fibre inside $V$, and differentiation under the integral sign (9.42) gives $F\in\mathscr{C}'$.`,
      caption: String.raw`**$p=2$:** drag the point $x$ in the convex set $E$; $F(x)$ integrates $f$ up the vertical fibre (gold) from the orange graph of $\alpha$, and the shading shows $F$ (bands are level lines). The readout compares $D_2F(x)$ with $f(x)$. **$p=1$:** $f$ does not depend on $x_2$ and $F(x)=\int^{x_1}f$. In the annulus $f$ is a bump on the upper arc and $0$ on the lower arc, so $D_2f=0$ still holds — yet $F$ would have to grow by $\int f$ along the top and stay constant along the bottom: no such $F$ exists.`,
      deps: ['pma-6.20', 'pma-9.42'],
      tags: ['convexity', 'Poincaré lemma'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'p2', label: '$p=2$, convex $E$' }, { value: 'p1', label: '$p=1$, convex $E$' }, { value: 'ann', label: '$p=1$, annulus (not convex)' }], 'p2');
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.45, 1.45], equal: true, height: 360, axes: false, full: true });
        const X = S.handle(0.3, 0.95, { color: 'accent', label: 'x' });
        X.constrain = (x, y) => (inside(x, y) ? [x, y] : [X.x, X.y]);
        // the rotated ellipse (p = 2), the disc (p = 1) and the annulus
        const ph = 0.3, Ae = 2.35, Be = 1.0, cph = Math.cos(ph), sph = Math.sin(ph);
        const inEll = (x, y) => { const u = x * cph + y * sph, w = -x * sph + y * cph; return (u / Ae) ** 2 + (w / Be) ** 2 < 1; };
        const chord = (x) => { // y-range of the vertical line through x inside the ellipse
          const a = (sph / Ae) ** 2 + (cph / Be) ** 2, b = 2 * x * (cph * sph / Ae ** 2 - sph * cph / Be ** 2), c = (x * cph / Ae) ** 2 + (x * sph / Be) ** 2 - 1;
          const D = b * b - 4 * a * c; if (D <= 0) return null; const r = Math.sqrt(D); return [(-b - r) / (2 * a), (-b + r) / (2 * a)];
        };
        const Rd = 1.3, Ri = 0.6;
        const inAnn = (x, y) => { const r = Math.hypot(x, y); return r < Rd && r > Ri; };
        const inside = (x, y) => (mode.value === 'ann' ? inAnn(x, y) : inEll(x, y));
        const f2 = (x, y) => Math.cos(1.6 * x) + 0.8 * y + 0.3 * x * y;          // p = 2: any C' function
        const phi = (x) => 1.4 * Math.exp(-(((x + 0.1) / 0.32) ** 2));             // p = 1: a function of x1 only
        const bump = (x) => (Math.abs(x) < Ri ? Math.exp(-1 / (1 - (x / Ri) ** 2) + 1) : 0); // supported in (−Ri, Ri)
        const alpha = (x) => { const c = chord(x); return c ? c[0] + (c[1] - c[0]) * (0.45 + 0.25 * Math.sin(2.2 * x)) : NaN; };
        const F2 = (x, y) => { const a = alpha(x); return quad((t) => f2(x, t), a, y, 2); };
        const XM = Math.sqrt((Ae * cph) ** 2 + (Be * sph) ** 2) - 1e-3;
        const F1 = (x) => quad(phi, -XM, x, 4);
        let last = null, st = null;
        v.render(() => {
          const m = mode.value;
          if (m !== last) { last = m; S.setView(m === 'ann' ? [-2.9, 2.9] : [-2.6, 2.6], m === 'ann' ? [-1.8, 1.8] : [-1.45, 1.45]); if (!inside(X.x, X.y)) X.set(0.3, 0.95); }
          if (m === 'p2') {
            S.setTitle('$p=n=2$: $F(x)=\\int_{\\alpha(x_1)}^{x_2}f(x_1,t)\\,dt$, with $f=\\cos 1.6x_1+0.8x_2+0.3x_1x_2$');
            S.raster((x, y) => { if (!inEll(x, y)) return null; const val = F2(x, y); return banded(v, M.clamp(0.5 + val / 2.4, 0, 1), val, 4, 'diverging'); }, { res: 2, key: 'p2', alpha: 0.8 });
            S.curve((t) => [Ae * cph * Math.cos(t) - Be * sph * Math.sin(t), Ae * sph * Math.cos(t) + Be * cph * Math.sin(t)], 0, 2 * Math.PI, { color: 'ink', width: 2 });
            S.fn(alpha, { domain: [-XM, XM], color: 'orange', width: 3 });
            S.tex('x_2=\\alpha(x_1)\\ \\ (F=0)', 1.25, alpha(1.25), { color: 'orange', dy: 24, size: 14 });
            const a = alpha(X.x);
            S.line(X.x, a, X.x, X.y, { color: 'panel', width: 6 }); S.line(X.x, a, X.x, X.y, { color: 'gold', width: 3.2 });
            S.dot(X.x, a, { color: 'orange', r: 5 });
            const h = 1e-4, d2 = (F2(X.x, X.y + h) - F2(X.x, X.y - h)) / (2 * h);
            st = { m, F: F2(X.x, X.y), d2, f: f2(X.x, X.y) };
          } else if (m === 'p1') {
            S.setTitle('$p=1$: $f(x)=\\varphi(x_1)$ does not depend on $x_2$, and $F(x)=\\int_{c}^{x_1}\\varphi(t)\\,dt$');
            S.raster((x, y) => { if (!inEll(x, y)) return null; const val = F1(x); return banded(v, M.clamp(val / 1.0, 0, 1), val, 6); }, { res: 3, key: 'p1', alpha: 0.75 });
            S.curve((t) => [Ae * cph * Math.cos(t) - Be * sph * Math.sin(t), Ae * sph * Math.cos(t) + Be * cph * Math.sin(t)], 0, 2 * Math.PI, { color: 'ink', width: 2 });
            const yb = -1.3;
            S.line(-XM, yb, XM, yb, { color: 'muted', width: 3 });
            S.line(-XM, yb, X.x, yb, { color: 'gold', width: 4 });
            S.dot(-XM, yb, { color: 'muted', r: 4, label: 'c', labelPos: 'w' });
            S.line(X.x, X.y, X.x, yb, { color: 'gold', width: 1.2, dash: [4, 4] });
            S.dot(X.x, yb, { color: 'gold', r: 4.5 });
            S.text('projection of E onto the x₁-axis', XM + 0.1, yb, { color: 'muted', size: 12 });
            const h = 1e-4;
            st = { m, F: F1(X.x), d1: (F1(X.x + h) - F1(X.x - h)) / (2 * h), f: phi(X.x), d2: 0 };
          } else {
            S.setTitle('$p=1$ in an annulus: $f=\\varphi(x_1)$ on the upper arc, $0$ on the lower arc, so $D_2f=0$');
            S.raster((x, y) => { if (!inAnn(x, y)) return null; const val = y > 0 ? bump(x) : 0; return M.cmap(0.15 + 0.8 * val, 'viridis'); }, { res: 3, key: 'ann', alpha: 0.6 });
            S.circle(0, 0, Rd, { color: 'ink', width: 2 }); S.circle(0, 0, Ri, { color: 'ink', width: 2 });
            // the two routes from the left part to the right part
            const R0 = (Rd + Ri) / 2;
            S.curve((t) => [-R0 * Math.cos(t), R0 * Math.sin(t)], 0.08, Math.PI - 0.08, { color: 'gold', width: 3 });
            S.curve((t) => [-R0 * Math.cos(t), -R0 * Math.sin(t)], 0.08, Math.PI - 0.08, { color: 'teal', width: 3 });
            headAt(S, [0, R0], [1, 0], { color: 'gold', head: 11 }); headAt(S, [0, -R0], [1, 0], { color: 'teal', head: 11 });
            const I = quad(bump, -Ri, Ri, 6);
            S.dot(-R0, 0, { color: 'ink', r: 5 }); S.text('F = 0 here', -Rd - 0.1, 0, { color: 'ink', align: 'right', weight: 600 });
            S.text(`along the top F gains ∫φ = ${v.fix(I, 3)}`, 0, Rd + 0.22, { color: 'gold', align: 'center', weight: 600 });
            S.text('along the bottom F gains 0', 0, -Rd - 0.22, { color: 'teal', align: 'center', weight: 600 });
            S.dot(R0, 0, { color: 'red', r: 6 }); S.text(`F = ${v.fix(I, 3)} or F = 0 ?`, Rd + 0.1, 0, { color: 'red', align: 'left', weight: 600 });
            st = { m, I };
          }
          X.visible = m !== 'ann';
        });
        v.readout(() => {
          if (!st) return '';
          if (st.m === 'p2') return `$F(x)=${v.fix(st.F, 4)}$; $\\;D_2F(x)=${v.fix(st.d2, 4)}$ (finite difference) and $f(x)=${v.fix(st.f, 4)}$. The fibre from the graph of $\\alpha$ to $x$ stays in $E$ because $E$ is convex.`;
          if (st.m === 'p1') return `$D_1F(x)=${v.fix(st.d1, 4)} = f(x)=${v.fix(st.f, 4)}$ and $D_2F=0$: the level lines of $F$ are vertical.`;
          return `A function with $D_2F=0$ is constant on each vertical segment in $E$, and $D_1F=f$ makes it grow by ${v.fix(st.I, 3)} along the top arc but not along the bottom one. Both cannot hold, so the conclusion of 10.38 fails without convexity.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.39
    {
      num: '10.39',
      kind: 'Theorem',
      name: 'Poincaré lemma: closed forms are exact in convex sets',
      statement: String.raw`**Poincaré's lemma.** On a convex open set $E\subset\R^n$, every closed form of positive degree is exact: if $\omega$ is a $k$-form of class $\mathscr{C}'$ on $E$ with $k\ge1$ and $d\omega=0$, then $\omega=d\lambda$ for a suitable $(k-1)$-form $\lambda$ on $E$.`,
      idea: String.raw`Rudin argues by induction on the number $p$ of coordinate differentials that occur in $\omega$. If only $dx_1,\dots,dx_p$ occur, write $\omega=\alpha+\sum_I f_I\,dx_I\wedge dx_p$ with $\alpha$ free of $dx_p$; closedness forces $D_jf_I=0$ for $j>p$, so 10.38 supplies $F_I$ with $D_pF_I=f_I$ that still do not depend on $x_{p+1},\dots,x_n$. Then $\omega-d\big(\sum_I F_I\,dx_I\big)$ is closed and involves only $dx_1,\dots,dx_{p-1}$, and induction finishes. For $1$-forms the result says $\lambda(x)=\int_{[a,x]}\omega$ is a potential: convexity keeps segments and triangles inside $E$, and Stokes' theorem on the triangle $[a,m,x]$ makes the integral path-independent. (The same holds in star-shaped sets, but Rudin states the convex case.)`,
      caption: String.raw`The form is $\eta=(x\,dy-y\,dx)/(x^2+y^2)$, closed wherever it is defined. Drag the base point $a$, the waypoint $m$ and the point $x$. Shading is $\lambda(x)=\int_{[a,x]}\eta$ (bands are level lines). In the convex set the straight path (blue) and the broken path through $m$ (orange) always give the same value. In the annulus, segments may leave $E$ (red), and when the triangle $[a,m,x]$ surrounds the hole the two paths differ by $2\pi$: no potential exists.`,
      deps: ['pma-10.38', 'pma-10.34', 'pma-10.20', 'pma-10.33'],
      see: ['rca-10.14'],
      tags: ['Poincaré lemma', 'closed forms', 'convexity'],
      viz(v) {
        const M = v.M;
        const reg = v.select('$E$:', [{ value: 'cvx', label: 'convex (avoids $0$)' }, { value: 'ann', label: 'annulus around $0$' }], 'cvx');
        const S = v.stage({ x: [-1.2, 4.6], y: [-1.3, 1.3], equal: true, height: 380, axes: false, full: true });
        const ph = -0.2, A = 1.75, Bq = 1.05, C0 = [1.95, 0.05], cp = Math.cos(ph), sp = Math.sin(ph);
        const inCvx = (x, y) => { const X = x - C0[0], Y = y - C0[1]; const u = X * cp + Y * sp, w = -X * sp + Y * cp; return (u / A) ** 2 + (w / Bq) ** 2 < 1; };
        const R1 = 1.45, R0 = 0.45;
        const inAnn = (x, y) => { const r = Math.hypot(x, y); return r > R0 && r < R1; };
        const inside = (x, y) => (reg.value === 'cvx' ? inCvx(x, y) : inAnn(x, y));
        const a = S.handle(0.75, -0.25, { color: 'ink', label: 'a', labelPos: 'sw' });
        const mm = S.handle(2.35, 0.75, { color: 'orange', label: 'm', labelPos: 'ne' });
        const xx = S.handle(3.1, -0.45, { color: 'accent', label: 'x', labelPos: 'se' });
        for (const hd of [a, mm, xx]) hd.constrain = (x, y) => (inside(x, y) ? [x, y] : [hd.x, hd.y]);
        const segI = (p, q) => lineInt(ETA, (t) => lerp2(p, q, t), 3);
        v.legend([['accent', 'segment $[a,x]$'], ['orange', 'broken path $[a,m]+[m,x]$'], ['red', 'leaves $E$', { dash: true }]]);
        let last = null, st = null;
        v.render(() => {
          const R = reg.value;
          if (R !== last) {
            last = R;
            if (R === 'cvx') { S.setView([-1.2, 4.6], [-1.3, 1.3]); a.set(0.75, -0.25); mm.set(2.35, 0.75); xx.set(3.1, -0.45); }
            else { S.setView([-2.9, 2.9], [-1.55, 1.55]); a.set(-0.95, 0.35); mm.set(0.95, 0.75); xx.set(0.75, -0.95); }
          }
          const A0 = [a.x, a.y];
          // potential λ(x) = ∫_[a,x] η, where the segment stays in E
          S.raster((x, y) => {
            if (!inside(x, y)) return null;
            if (!segInside(inside, A0, [x, y], 24)) return [150, 150, 150, 120];
            const val = segI(A0, [x, y]);
            return banded(v, M.clamp(0.5 + val / 2.4, 0, 1), val, 4, 'diverging');
          }, { res: 3, key: `${R}|${a.x.toFixed(4)}|${a.y.toFixed(4)}`, alpha: 0.8 });
          if (R === 'cvx') S.curve((t) => { const u = A * Math.cos(t), w = Bq * Math.sin(t); return [C0[0] + u * cp - w * sp, C0[1] + u * sp + w * cp]; }, 0, 2 * Math.PI, { color: 'ink', width: 2 });
          else { S.circle(0, 0, R1, { color: 'ink', width: 2 }); S.circle(0, 0, R0, { color: 'ink', width: 2 }); }
          S.dot(0, 0, { hollow: true, color: 'red', r: 5, label: '0', labelPos: 'n' });
          const P = [A0, [mm.x, mm.y], [xx.x, xx.y]];
          S.poly(P, { fill: 'green', fillAlpha: 0.1, stroke: false });
          const draw = (p, q, col) => { const ok = segInside(inside, p, q); segArrow(S, p, q, { color: ok ? col : 'red', width: 3, head: 11, dash: ok ? null : [6, 4] }); return ok; };
          const ok1 = draw(A0, P[2], 'accent'), ok2 = draw(A0, P[1], 'orange'), ok3 = draw(P[1], P[2], 'orange');
          const I1 = segI(A0, P[2]), I2 = segI(A0, P[1]) + segI(P[1], P[2]);
          const wind = M.winding((t) => { const s = 3 * t, i = Math.min(2, Math.floor(s)); const p = lerp2(P[i], P[(i + 1) % 3], s - i); return new v.Cx(p[0], p[1]); }, new v.Cx(0, 0), 900);
          // dλ = η at x: gradient of λ by finite differences
          const h = 1e-4, gx = (segI(A0, [xx.x + h, xx.y]) - segI(A0, [xx.x - h, xx.y])) / (2 * h), gy = (segI(A0, [xx.x, xx.y + h]) - segI(A0, [xx.x, xx.y - h])) / (2 * h);
          st = { I1, I2, ok: ok1 && ok2 && ok3, wind, g: [gx, gy], e: ETA(xx.x, xx.y), R };
        });
        v.readout(() => {
          if (!st) return '';
          const { I1, I2, ok, wind, g, e } = st;
          const eq = Math.abs(I1 - I2) < 1e-6;
          const tail = eq ? (ok ? ' — equal: the triangle $[a,m,x]$ lies in $E$, where $d\\eta=0$.' : ' — equal here because the triangle misses $0$, although the paths leave $E$.') : ` — they differ by $${v.fix(I1 - I2, 4)}=2\\pi\\cdot(${-wind})$: the triangle $[a,m,x]$ surrounds the hole of $E$.`;
          return `$\\int_{[a,x]}\\eta = ${v.fix(I1, 4)}$, $\\;\\int_{[a,m]}\\eta+\\int_{[m,x]}\\eta = ${v.fix(I2, 4)}$${tail}` + (ok && eq ? ` At $x$: $\\nabla\\lambda=(${v.fix(g[0], 3)},${v.fix(g[1], 3)})$, coefficients of $\\eta$: $(${v.fix(e[0], 3)},${v.fix(e[1], 3)})$.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 10.40
    {
      num: '10.40',
      kind: 'Theorem',
      name: "Exactness passes to C''-equivalent sets",
      statement: String.raw`Let $1\le k\le n$, and suppose $E\subset\R^n$ is an open set on which every closed $k$-form is exact. If $U=T(E)$ for a one-to-one $\mathscr{C}''$-mapping $T$ of $E$ onto an open set $U\subset\R^n$ whose inverse $S:U\to E$ is also of class $\mathscr{C}''$, then closed $k$-forms are exact on $U$ as well.

Combined with 10.39: on any open set that is $\mathscr{C}''$-equivalent to a convex open set, closed forms are exact.`,
      idea: String.raw`Let $\omega$ be closed in $U$. Its pullback $\omega_T$ is a $k$-form in $E$ with $d(\omega_T)=(d\omega)_T=0$ (10.22), so $\omega_T=d\lambda$ for some $\lambda$ in $E$. Pulling back again along $S$ and using $(\omega_T)_S=\omega_{TS}=\omega$ (10.23) gives $\omega=(d\lambda)_S=d(\lambda_S)$. The picture: a potential on the simple set $E$ is transported to $U$ by composing with $S=T^{-1}$.`,
      caption: String.raw`$T(r,\theta)=(r\cos\theta,r\sin\theta)$ maps the convex rectangle $E$ (left) onto an annular sector $U$ (right), which is not convex. The closed form $\eta$ on $U$ pulls back to $\eta_T=d\theta$ on $E$, with potential $\lambda=\theta$; transported back, $\lambda_S$ is a continuous angle on $U$ (shading; the pale lines are level sets $\theta=k\pi/4$). Drag the point in $U$ and widen the opening: up to $2\pi$ everything works, beyond $2\pi$ the map $T$ is no longer one-to-one, $U$ becomes the full annulus, and the overlap receives two angles that differ by $2\pi$.`,
      deps: ['pma-10.39', 'pma-10.22', 'pma-10.23'],
      tags: ['Poincaré lemma', 'change of variables'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI;
        const op = v.slider('opening angle $\\Theta$', 0.8, 2.35 * Math.PI, 1.55 * Math.PI, { step: 0.01, fmt: (x) => `${(x / Math.PI).toFixed(2)}π` });
        const r0 = 0.45, r1 = 1.3, th0 = -0.6;
        const L = v.stage({ x: [0.2, 1.55], y: [-1, 7.6], height: 360, axes: 'box', weight: 0.55, minWidth: 200, xlabel: 'r', ylabel: 'θ', yticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π']], xticks: [0.5, 1], title: '$E$: $\\eta_T=d\\theta$, potential $\\lambda=\\theta$' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.45], equal: true, height: 360, axes: false, title: '$U=T(E)$: $\\eta$ and the potential $\\lambda_S=\\lambda\\circ T^{-1}$' });
        const p = R.handle(0.0, 0.9, { color: 'accent', label: 'y' });
        p.constrain = (x, y) => { const r = Math.hypot(x, y); return r > r0 && r < r1 ? [x, y] : [p.x, p.y]; };
        let st = null;
        v.render(() => {
          const Th = op.value, th1 = th0 + Th, over = Th > TAU;
          // left: the rectangle, the constant field dθ, level lines of θ
          L.raster((r, th) => (r > r0 && r < r1 && th > th0 && th < th1 ? M.cmap(M.clamp((th - th0) / (2.35 * Math.PI), 0, 1)) : null), { res: 2, key: `L${Th}`, alpha: 0.6 });
          const lev = []; for (let k = Math.ceil(th0 / (Math.PI / 4)); k * Math.PI / 4 < th1; k++) lev.push(k * Math.PI / 4);
          for (const th of lev) L.line(r0, th, r1, th, { color: 'panel', width: 1.2, alpha: 0.8 });
          L.rect(r0, th0, r1, th1, { color: 'ink', width: 2 });
          if (over) { L.rect(r0, th0 + TAU, r1, th1, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.5 }); L.rect(r0, th0, r1, th1 - TAU, { fill: 'red', fillAlpha: 0.12, color: 'red', width: 1, dash: [4, 4] }); L.hline(th0 + TAU, { color: 'red', width: 1, dash: [3, 3] }); }
          for (let r = 0.55; r < r1; r += 0.25) for (let th = th0 + 0.4; th < th1; th += 0.8) L.arrow(r, th - 0.22, r, th + 0.22, { color: 'muted', width: 1.4, head: 6 });
          // right: the sector, η and the transported potential
          const angle = (x, y) => { let a = Math.atan2(y, x); while (a < th0) a += TAU; return a; }; // θ ∈ [th0, th0 + 2π)
          R.raster((x, y) => {
            const r = Math.hypot(x, y); if (r <= r0 || r >= r1) return null;
            const a = angle(x, y);
            const in1 = a < th1, in2 = a + TAU < th1;
            if (!in1) return null;
            const c = M.cmap(M.clamp((a - th0) / (2.35 * Math.PI), 0, 1));
            return in2 ? [c[0] * 0.55 + 110, c[1] * 0.4, c[2] * 0.4] : c;
          }, { res: 2, key: `R${Th}`, alpha: 0.6 });
          R.field((x, y) => { const r = Math.hypot(x, y); if (r <= r0 || r >= r1) return [0, 0]; const a = angle(x, y); if (a >= th1) return [0, 0]; const e = ETA(x, y), l = Math.hypot(...e); return [e[0] / l, e[1] / l]; }, { spacing: 28, color: 'ink', alpha: 0.35 });
          const arc = (rr, t0, t1) => R.curve((t) => [rr * Math.cos(t), rr * Math.sin(t)], t0, t1, { color: 'ink', width: 2 });
          const e1 = Math.min(th1, th0 + TAU);
          arc(r0, th0, e1); arc(r1, th0, e1);
          if (!over) { R.line(r0 * Math.cos(th0), r0 * Math.sin(th0), r1 * Math.cos(th0), r1 * Math.sin(th0), { color: 'ink', width: 2 }); R.line(r0 * Math.cos(th1), r0 * Math.sin(th1), r1 * Math.cos(th1), r1 * Math.sin(th1), { color: 'ink', width: 2 }); }
          else R.line(r0 * Math.cos(th0), r0 * Math.sin(th0), r1 * Math.cos(th0), r1 * Math.sin(th0), { color: 'red', width: 2.4, dash: [6, 4] });
          for (const th of lev) if (th < th0 + 2 * Math.PI) R.line(r0 * Math.cos(th), r0 * Math.sin(th), r1 * Math.cos(th), r1 * Math.sin(th), { color: 'panel', width: 1.2, alpha: 0.8 });
          R.dot(0, 0, { hollow: true, color: 'muted', r: 4 });
          // the probe and its preimage(s)
          const a = angle(p.x, p.y), r = Math.hypot(p.x, p.y);
          const inU = a < th1;
          const pre = [a, a + TAU].filter((t) => t < th1);
          for (const t of pre) L.dot(r, t, { color: pre.length > 1 ? 'red' : 'accent', r: 6, label: pre.length > 1 ? 'S(y)?' : 'S(y)', labelPos: 'e' });
          if (inU) R.line(0, 0, p.x, p.y, { color: 'accent', width: 1, dash: [3, 4] });
          st = { Th, over, inU, pre, r };
          R.corner(over ? 'Θ > 2π: T not one-to-one' : 'U ≅ E (C″-equivalent)', 'tl', { color: over ? 'red' : 'green', weight: 600 });
        });
        v.readout(() => {
          if (!st) return '';
          const { over, inU, pre } = st;
          if (!inU) return 'Move the point $y$ into $U$.';
          const vals = pre.map((t) => v.fix(t, 4)).join('$ and $');
          if (over && pre.length > 1) return `This point of $U$ has two preimages, so $\\lambda_S$ would have to equal both $${vals}$ — they differ by $2\\pi$. On the full annulus $\\int_{|y|=1}\\eta=2\\pi\\ne0$, so $\\eta$ is not exact there.`;
          return `$\\lambda_S(y)=\\theta(S(y))=${vals}$; $\\;d(\\lambda_S)=\\eta$ on $U$, so $\\eta$ is exact in $U$ even though $U$ is not convex.`;
        });
      },
    },
  ],
};
