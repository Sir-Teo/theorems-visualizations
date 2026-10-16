// Manifolds & Riemannian Geometry — Chapter 1: Smooth manifolds (items 1.7–1.11; 1.1–1.6 in ch01.js)
import { TAU, clamp, wrap, minus, g, step, torusPt, bumpPolys, bumpDeriv, svd22 } from './ch01.shared.js';

const PI = Math.PI;
const BP = bumpPolys(8);

export default {
  collection: 'mfd',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Proposition',
      name: 'Open subsets and GL(n, ℝ)',
      statement: String.raw`Every open subset $W$ of a smooth $n$-manifold $M$ is itself a smooth $n$-manifold, with the charts $(U\cap W,\varphi|_{U\cap W})$ of $M$. In particular the general linear group $GL(n,\R)=\{A\in\R^{n\times n}:\det A\ne0\}$, an open subset of $\R^{n\times n}\cong\R^{n^2}$ (since $\det$ is continuous), is a smooth manifold of dimension $n^2$. Quantitatively, if $A$ is invertible with smallest singular value $\sigma_{\min}$, every matrix $B$ with $\|B-A\|_{\mathrm{op}}<\sigma_{\min}$ is invertible, and the bound is sharp.`,
      idea: String.raw`Restricting a chart to an open subset still gives a homeomorphism onto an open set, and transition maps are restrictions of smooth maps, so smoothness is inherited. For $GL(n,\R)$ openness is the continuity of $\det$; the singular value gives a quantitative version: $\|Ax\|\ge\sigma_{\min}\|x\|$, hence $\|Bx\|\ge(\sigma_{\min}-\|B-A\|)\|x\|>0$, so $B$ is injective. Sharpness: $A-\sigma_{\min}u\,v^{\mathsf T}$ (with $v$ the right singular vector of $\sigma_{\min}$, $u=Av/\sigma_{\min}$) is singular at distance exactly $\sigma_{\min}$ (Eckart–Young). The set $GL(n,\R)$ has two components, $\det>0$ and $\det<0$, which a path cannot join without crossing the singular matrices.`,
      caption: String.raw`The left panel is a two-dimensional slice of $\R^4$: the entries $a,d$ move while $b,c$ (sliders) stay fixed, and the plane is coloured by the sign of $\det$ with the singular matrices ($ad=bc$) in red. Drag the gold matrix $A$: the green disc has radius $\sigma_{\min}(A)$ and never touches the red curve. The right panel follows $A+tE$ for random matrices $E$ of operator norm $1$ and the sharp one (red): inside the green band $|t|<\sigma_{\min}$ no curve reaches $\det=0$. The cloud of dots is a random perturbation of size $\rho\sigma_{\min}$; green means the perturbed matrix is in the same component as $A$.`,
      deps: ['mfd-1.2', 'pma-9.8'],
      refs: ['Lee SM Ch. 1'],
      tags: ['open subset', 'general linear group'],
      viz(v) {
        const bs = v.slider('$b$', -2, 2, 0.7, { step: 0.01 });
        const cs = v.slider('$c$', -2, 2, -0.5, { step: 0.01 });
        const rho = v.slider('perturbation size $\\rho$ ($\\times\\sigma_{\\min}$)', 0.2, 3, 0.9, { step: 0.01 });
        let seed = 7;
        v.button('Resample', () => { seed += 1; });
        const SL = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: true, height: 400, title: 'slice of $\\mathbb R^4$: $(a,d)$ move, $b,c$ fixed', weight: 1 });
        const LN = v.stage({ x: [-2.5, 2.5], y: [-3, 3], axes: 'box', gutter: true, height: 400, title: '$\\det(A+t\\sigma_{\\min}E)$ along unit directions $E$', xlabel: 't', ylabel: 'det', weight: 1 });
        const H = SL.handle(1.3, 0.9, { color: 'gold', label: 'A', constrain: (x, y) => [clamp(x, -2.5, 2.5), clamp(y, -2.5, 2.5)] });
        const rgbA = (n, a) => { const c = v.rgb(n); return [c[0], c[1], c[2], a]; };
        let st = null;
        v.render(() => {
          const b = bs.value, c = cs.value, a = H.x, d = H.y;
          const det0 = a * d - b * c;
          const sv = svd22(a, b, c, d), sig = sv.s2;
          SL.raster((x, y) => (x * y - b * c > 0 ? rgbA('blue', 70) : rgbA('orange', 70)), { res: 3, key: `${b.toFixed(3)}|${c.toFixed(3)}` });
          SL.contour((x, y) => x * y - b * c, [0], { color: 'red', width: 2.6, res: 220 });
          SL.axes();
          SL.circle(a, d, sig, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2 });
          // distance from (a,d) to the singular set within the slice
          let dmin = Infinity;
          const k = b * c;
          if (Math.abs(k) < 1e-9) dmin = Math.min(Math.abs(a), Math.abs(d));
          else for (let i = 0; i <= 4000; i++) { const t = -6 + (12 * i) / 4000; const x = Math.sign(t || 1) * Math.pow(10, -3 + 3.8 * Math.abs(t) / 6); const y = k / x; if (Math.abs(y) < 8) dmin = Math.min(dmin, Math.hypot(x - a, y - d)); }
          // random perturbations (all four entries), plotted at (a + e11, d + e22)
          const r = v.rng(seed);
          let same = 0, tot = 260;
          for (let i = 0; i < tot; i++) {
            const e = [r.normal(), r.normal(), r.normal(), r.normal()];
            const nn = svd22(e[0], e[1], e[2], e[3]).s1 || 1, sc = (rho.value * sig * Math.pow(r(), 0.5)) / nn;
            const E = e.map((x) => x * sc);
            const dt = (a + E[0]) * (d + E[3]) - (b + E[1]) * (c + E[2]);
            const ok = dt * det0 > 0; if (ok) same++;
            SL.dot(a + E[0], d + E[3], { r: 2.4, color: ok ? 'green' : 'red', alpha: 0.85 });
          }
          SL.dot(a, d, { r: 6, color: 'gold' });
          // lines A + t sigma E
          const rr = v.rng(11 + seed);
          const sw = [], rootMin = [];
          let ymax = 1;
          const curves = [];
          for (let i = 0; i < 14; i++) {
            const th = rr.uniform(0, PI), ph = rr.uniform(0, TAU);
            // unit-operator-norm matrix R(th) diag(1, s) R(ph)
            const s2 = rr.uniform(-1, 1);
            const R1 = [[Math.cos(th), -Math.sin(th)], [Math.sin(th), Math.cos(th)]], R2 = [[Math.cos(ph), -Math.sin(ph)], [Math.sin(ph), Math.cos(ph)]];
            const D = [[1, 0], [0, s2]];
            const mm = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
            const E = mm(mm(R1, D), R2);
            curves.push(E);
          }
          const star = [[-sv.u2[0] * sv.v2[0], -sv.u2[0] * sv.v2[1]], [-sv.u2[1] * sv.v2[0], -sv.u2[1] * sv.v2[1]]];
          const detAt = (E, s) => (a + s * E[0][0]) * (d + s * E[1][1]) - (b + s * E[0][1]) * (c + s * E[1][0]);
          const T = []; for (let i = 0; i <= 120; i++) T.push(-2.5 + (5 * i) / 120);
          const all = curves.concat([star]);
          let mx = 0; all.forEach((E) => T.forEach((t) => { mx = Math.max(mx, Math.abs(detAt(E, t * sig))); }));
          ymax = Math.min(8, Math.max(1.5, mx * 1.05));
          LN.setView([-2.5, 2.5], [-ymax, ymax]);
          LN.vband(-1, 1, { color: 'green', alpha: 0.12 }); LN.hline(0, { color: 'red', width: 1.5 });
          let minRoot = Infinity;
          curves.forEach((E) => {
            LN.path(T.map((t) => [t, detAt(E, t * sig)]), { color: 'accent', width: 1.2, alpha: 0.65 });
            // roots in units of sigma: det(A) + s*l + s^2 detE
            const l = a * E[1][1] + d * E[0][0] - b * E[1][0] - c * E[0][1], q = E[0][0] * E[1][1] - E[0][1] * E[1][0];
            const rts = Math.abs(q) < 1e-12 ? (Math.abs(l) > 1e-12 ? [-det0 / l] : []) : (() => { const D2 = l * l - 4 * q * det0; return D2 < 0 ? [] : [(-l + Math.sqrt(D2)) / (2 * q), (-l - Math.sqrt(D2)) / (2 * q)]; })();
            rts.forEach((s) => { minRoot = Math.min(minRoot, Math.abs(s) / (sig || 1e-12)); });
          });
          LN.path(T.map((t) => [t, detAt(star, t * sig)]), { color: 'red', width: 3 });
          LN.dot(1, detAt(star, sig), { r: 6, color: 'red' });
          LN.text('sharp direction −uvᵀ', -2.4, ymax * 0.8, { size: 12, color: 'red', align: 'left', plate: true });
          st = { sig, det0, dmin, same, tot, minRoot, s1: sv.s1, starDet: detAt(star, sig) };
        });
        v.legend([['blue', '$\\det>0$', { area: true }], ['orange', '$\\det<0$', { area: true }], ['red', 'singular matrices $\\det=0$'], ['green', 'ball of radius $\\sigma_{\\min}$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          return `$\\det A=${f(st.det0)}$, singular values $${f(st.s1)}$ and $\\sigma_{\\min}=${f(st.sig)}$. Distance from $(a,d)$ to the singular set inside the slice: $${f(st.dmin)}\\ge\\sigma_{\\min}$ ✓.\nSmallest $|t|$ at which any of the 14 random lines hits $\\det=0$: $${Number.isFinite(st.minRoot) ? f(st.minRoot) : '\\infty'}\\ge1$ ✓; the sharp direction reaches $\\det=${v.sci(Math.abs(st.starDet), 1)}\\approx0$ exactly at $t=1$. With $\\rho=${f(rho.value)}$, **${st.same}** of ${st.tot} random perturbations stay in the component of $A$${rho.value < 1 ? ' (all of them, as the theorem guarantees)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Manifolds with boundary',
      statement: String.raw`Let $\mathbb H^n=\{x\in\R^n: x_n\ge0\}$ be the closed upper half-space. A **smooth $n$-manifold with boundary** is a Hausdorff, second countable space covered by charts $\varphi\colon U\to\varphi(U)$ onto open subsets of $\R^n$ or of $\mathbb H^n$, with smooth transition maps (smoothness at points of $\partial\mathbb H^n$ means: extends smoothly to a neighbourhood in $\R^n$). A point is an **interior point** if some chart sends it to $\operatorname{Int}\mathbb H^n=\{x_n>0\}$ and a **boundary point** if some chart sends it to $\partial\mathbb H^n=\{x_n=0\}$; these are exclusive — no point is both, whatever charts are used — so $\partial M$ is well defined. $\partial M$ is a smooth $(n-1)$-manifold without boundary.`,
      idea: String.raw`Suppose a transition map $\Phi$ sent a boundary point $p$ (with $x_n=0$) to an interior point of $\mathbb H^n$. $\Phi$ is a diffeomorphism, so by the inverse function theorem it maps a neighbourhood of $p$ in $\R^n$ onto an open set; but the half-ball around $p$ is sent into an open set around an *interior* point, and pulling back an interior full ball gives a full ball around $p$ inside $\mathbb H^n$ — impossible. Hence boundary points go to boundary points, and the bookkeeping is chart-independent. The disc has the circle as boundary, the solid torus has the torus, and the Möbius band — whose two visible edges are *one* circle of twice the length — has a boundary circle, shown here by following the boundary parameter around twice.`,
      caption: String.raw`Pick a space and drag the probe $p$ in its parameter picture (snap to the edge for boundary points). The right panel shows a small neighbourhood of $p$ in a chart into the half-plane $\mathbb H^2$: at an interior point it is a full disc away from the line $x_2=0$; at a boundary point a half-disc sitting *on* the line. Turn on the second chart $\Phi(x)=(x_1+\kappa x_2,\ x_2e^{\kappa x_1})$ (orange): it deforms the picture but boundary points stay on the line. For the solid torus the picture is the cross-section at angle $\theta$.`,
      deps: ['mfd-1.2'],
      refs: ['Lee SM Ch. 1'],
      tags: ['boundary', 'half-space'],
      viz(v) {
        const shape = v.select('space', [{ value: 'disc', label: 'closed disc' }, { value: 'solid', label: 'solid torus' }, { value: 'mob', label: 'Möbius band' }], 'disc', { onChange: () => reset() });
        const th = v.slider('cross-section angle $\\theta$', 0.3, 5.6, 1.0, { step: 0.01 });
        const eps = v.slider('neighbourhood radius', 0.08, 0.45, 0.25, { step: 0.01 });
        const second = v.toggle('second chart $\\Phi\\circ\\varphi$', true);
        const kap = v.slider('$\\kappa$', 0, 1.6, 0.8, { step: 0.01 });
        const PS = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 320, title: 'parameter picture', weight: 1, minWidth: 230 });
        const S3 = v.stage3d({ range: 1.6, height: 320, yaw: -0.8, pitch: 0.55, axes: false, title: 'the space in $\\mathbb R^3$', weight: 1, minWidth: 230 });
        const CH = v.stage({ x: [-1.3, 1.3], y: [-0.4, 1.0], equal: true, axes: false, height: 320, title: 'a chart into $\\mathbb H^2$', weight: 1, minWidth: 230 });
        const R = 1, rt = 0.45;
        const clampDisc = (x, y) => { const r = Math.hypot(x, y); if (r > 0.95) return [x / r, y / r]; return [x, y]; };
        const H = PS.handle(0.5, 0.4, { color: 'gold', label: 'p', constrain: (x, y) => {
          if (shape.value === 'mob') { const X = clamp(x, 0.02, TAU - 0.02); let Y = clamp(y, -1, 1); if (Math.abs(Y) > 0.93) Y = Math.sign(Y); return [X, Y]; }
          return clampDisc(x, y);
        } });
        function reset() { if (shape.value === 'mob') H.set(PI * 0.5, 0.55); else H.set(0.5, 0.4); v.invalidate(); }
        // maps from parameter point q (unrolled) to R^3 and to chart coordinates around p
        const X3 = (q) => {
          if (shape.value === 'disc') return [q[0], q[1], 0];
          if (shape.value === 'solid') { const rho = Math.hypot(q[0], q[1]), ph = Math.atan2(q[1], q[0]); return [(R + rt * rho * Math.cos(ph)) * Math.cos(th.value), (R + rt * rho * Math.cos(ph)) * Math.sin(th.value), rt * rho * Math.sin(ph)]; }
          const t = q[0], w = q[1]; const rr = 1 + 0.5 * w * Math.cos(t / 2); return [rr * Math.cos(t), rr * Math.sin(t), 0.5 * w * Math.sin(t / 2)];
        };
        const inM = (q) => (shape.value === 'mob' ? Math.abs(q[1]) <= 1 + 1e-9 : Math.hypot(q[0], q[1]) <= 1 + 1e-9);
        const chart = (p, q) => {
          if (shape.value === 'mob') { const up = p[1] >= 0; const interior = Math.abs(p[1]) < 0.5; if (interior) return [q[0] - p[0], 0.35 + (q[1] - p[1])]; return [(q[0] - p[0]) * (up ? 1 : -1), up ? 1 - q[1] : 1 + q[1]]; }
          const rp = Math.hypot(p[0], p[1]);
          if (rp < 0.5) return [q[0] - p[0], 0.35 + (q[1] - p[1])];
          const dth = ((Math.atan2(q[1], q[0]) - Math.atan2(p[1], p[0]) + 3 * PI) % TAU) - PI;
          return [dth * rp, 1 - Math.hypot(q[0], q[1])];
        };
        let st = null;
        v.render(() => {
          const mob = shape.value === 'mob', sol = shape.value === 'solid';
          th.el.hidden = !sol;
          const p = [H.x, H.y], e = eps.value;
          if (mob) PS.setView([-0.35, TAU + 0.35], [-1.35, 1.35]); else PS.setView([-1.25, 1.25], [-1.25, 1.25]);
          // parameter picture
          if (mob) {
            PS.rect(0, -1, TAU, 1, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.2 });
            PS.line(0, 1, TAU, 1, { color: 'green', width: 3.5 }); PS.line(0, -1, TAU, -1, { color: 'green', width: 3.5 });
            PS.line(0, -1, 0, 1, { color: 'red', width: 2, dash: [5, 4] }); PS.line(TAU, -1, TAU, 1, { color: 'red', width: 2, dash: [5, 4] });
            PS.text('glued with a flip: (0, w) ~ (2π, −w)', PI, -1.2, { size: 11.5, color: 'red', align: 'center' });
            PS.text('θ →', PI * 1.8, 0.12, { size: 12, color: 'muted' }); PS.text('boundary', PI, 1.12, { size: 12, color: 'green', align: 'center' });
          } else {
            PS.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.1, color: 'green', width: 3.5 });
            if (sol) PS.text('cross-section ρ ≤ 1', 0, -1.17, { size: 11.5, color: 'muted', align: 'center' });
          }
          PS.circle(p[0], p[1], e, { color: 'gold', width: 1.2, dash: true });
          // neighbourhood samples
          const nb = [], dots = [];
          const m = 22;
          for (let i = -m; i <= m; i++) for (let j = -m; j <= m; j++) { const q = [p[0] + (e * i) / m, p[1] + (e * j) / m]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) > e) continue; if (!inM(q)) continue; nb.push(q); }
          const kk = kap.value;
          const Phi = ([x1, x2]) => [x1 + kk * x2, x2 * Math.exp(kk * x1)];
          const img = nb.map((q) => chart(p, q));
          PS.dots(nb, { r: 1.7, color: 'gold', alpha: 0.7 });
          PS.dot(p[0], p[1], { r: 6.5, color: 'gold' });
          // 3D
          if (shape.value === 'disc') S3.surface((r, a) => [r * Math.cos(a), r * Math.sin(a), 0], [0, 1], [0, TAU], { nu: 10, nv: 48, alpha: 0.85 });
          else if (sol) {
            S3.surface((a, b) => torusPt(a, b, R, rt), [th.value + 0.55, th.value + TAU], [0, TAU], { nu: 64, nv: 28, alpha: 0.55 });
            S3.surface((r, ph) => X3([r * Math.cos(ph), r * Math.sin(ph)]), [0, 1], [0, TAU], { nu: 8, nv: 40, alpha: 0.95, colorFn: () => 'teal' });
          } else S3.surface((t, w) => X3([t, w]), [0, TAU], [-1, 1], { nu: 90, nv: 10, alpha: 0.9, colorFn: (t, w) => (Math.abs(w) > 0.94 ? 'green' : 'accent') });
          const bnd = shape.value === 'mob' ? [(t) => X3([t, 1]), (t) => X3([t, -1])] : shape.value === 'disc' ? [(t) => X3([Math.cos(t), Math.sin(t)])] : [];
          bnd.forEach((f) => S3.curve(f, 0, TAU, { n: 120, color: 'green', width: 3 }));
          S3.dots ? 0 : 0;
          nb.forEach((q) => S3.dot(X3(q).map((c, i) => c + (shape.value === 'disc' ? [0, 0, 0.01][i] : 0)), { r: 1.4, color: 'gold', ring: false }));
          S3.dot(X3(p), { r: 7, color: 'gold', label: 'p' });
          // chart image
          CH.rect(-1.3, -0.4, 1.3, 0, { fill: 'muted', fillAlpha: 0.12, hatch: true, color: 'muted', width: 0 });
          CH.line(-1.3, 0, 1.3, 0, { color: 'green', width: 3.5 }); CH.text('∂ℍ² (x₂ = 0)', 1.25, 0.1, { size: 12, color: 'green', align: 'right' });
          CH.text('x₂ < 0 is outside ℍ²', -1.25, -0.25, { size: 11, color: 'muted', align: 'left' });
          CH.dots(img, { r: 1.9, color: 'accent', alpha: 0.75 });
          const p0 = chart(p, p);
          CH.dot(p0[0], p0[1], { r: 6, color: 'gold' });
          let minX2b = NaN;
          if (second.value) { const img2 = img.map(Phi); CH.dots(img2, { r: 1.9, color: 'orange', alpha: 0.7 }); const q0 = Phi(p0); CH.dot(q0[0], q0[1], { r: 5, color: 'orange' }); minX2b = Math.min(...img2.map((c) => c[1])); }
          const x2s = img.map((c) => c[1]);
          const bdry = Math.abs(p0[1]) < 1e-9;
          let bpar = NaN;
          if (mob && bdry) bpar = p[1] > 0 ? p[0] : p[0] + TAU;
          st = { p0, bdry, minX2: Math.min(...x2s), minX2b, bpar, n: nb.length };
        });
        v.legend([['gold', 'probe $p$ and its neighbourhood', { dot: true }], ['green', 'boundary'], ['accent', 'neighbourhood in the chart', { dot: true }], ['orange', 'in the second chart', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          let s = st.bdry ? `$p$ is a **boundary point**: its chart coordinate is $x_2=0$, and the neighbourhood is a half-disc resting on the line (lowest $x_2=${f(st.minX2)}$).` : `$p$ is an **interior point**: $x_2=${f(st.p0[1])}>0$ and the whole neighbourhood stays above the line (lowest $x_2=${f(st.minX2)}$).`;
          if (second.value) s += `\nIn the second chart the lowest $x_2'$ is $${f(st.minX2b)}$ — ${st.bdry ? 'again on the line' : 'still above the line'}: boundary/interior is chart-independent.`;
          if (shape.value === 'mob' && st.bdry) s += `\nBoundary parameter $\\theta+2\\pi[w<0]=${f(st.bpar)}\\in[0,4\\pi)$: top and bottom edge together form **one** circle.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Smooth bump functions',
      statement: String.raw`The function $f(x)=e^{-1/x}$ for $x>0$, $f(x)=0$ for $x\le0$, is $C^\infty$ on $\R$ with $f^{(n)}(0)=0$ for every $n$; it is not analytic at $0$. Consequently $h(x)=f(x)/\big(f(x)+f(1-x)\big)$ is a smooth step ($0$ for $x\le0$, $1$ for $x\ge1$) and $\psi(x)=h\big((r_2-|x|)/(r_2-r_1)\big)$ is a smooth function on $\R^n$ ($|x|$ the Euclidean norm) equal to $1$ on the ball of radius $r_1$ and supported in the ball of radius $r_2$. On a smooth manifold, a **bump function** for a closed set $A\subset U$ ($U$ open) is a smooth $\psi\colon M\to[0,1]$ with $\psi=1$ on $A$ and $\operatorname{supp}\psi\subset U$; such functions exist for every pair (closed $A$, open $U\supset A$) — for $A$ compact this is built from the model bump in charts.`,
      idea: String.raw`For $x>0$ every derivative of $e^{-1/x}$ has the form $q_n(1/x)e^{-1/x}$ with $q_n$ a polynomial ($q_{n+1}(s)=s^2(q_n-q_n')$); since $e^{-s}$ beats every power of $s$, each derivative tends to $0$ as $x\downarrow0$, so gluing to $0$ is smooth to all orders. All Taylor coefficients at $0$ vanish while $f>0$ on $x>0$: the Taylor series converges but not to $f$, which is why smooth is strictly weaker than analytic and why a partition-of-unity argument (1.10) needs smooth, not analytic, functions. Composing with $|x|^2$ and taking products or differences of such functions produces bumps of any prescribed round, box or ring shape.`,
      caption: String.raw`Left: $f$ (blue) and its zero Taylor polynomial at $0$ (red) — they agree to infinite order but not at all for $x>0$; drag $x_0$ to read the exact $f,f',f''$ from the polynomial recursion. Middle: $|f^{(n)}(x)|$ for $n=0,\dots,6$ on log–log axes against the dashed power $x^m$: every curve dives below every power as $x\to0$. Right: a plateau bump on $\R^2$ built from the smooth step; choose its profile and the radii $r_1<r_2$.`,
      deps: ['mfd-1.2'],
      refs: ['Lee SM Ch. 2'],
      credit: 'A. L. Cauchy, 1823 (the function e^{-1/x²}, smooth but not analytic)',
      tags: ['bump function', 'smooth', 'analytic'],
      viz(v) {
        const mm = v.slider('power $m$ in $x^m$', 1, 10, 4, { int: true });
        const r1 = v.slider('inner radius $r_1$', 0.1, 1.5, 0.6, { step: 0.01 });
        const r2 = v.slider('outer radius $r_2$', 0.3, 1.9, 1.3, { step: 0.01 });
        const prof = v.select('shape', [{ value: 'round', label: 'round' }, { value: 'box', label: 'box (product)' }, { value: 'ring', label: 'ring (difference)' }], 'round');
        const A = v.stage({ x: [-1.2, 2.4], y: [-0.2, 1.1], axes: 'box', gutter: true, height: 320, title: '$f(x)=e^{-1/x}$ and its Taylor polynomial', xlabel: 'x', weight: 1, minWidth: 260 });
        const B = v.stage({ x: [0.01, 2], y: [1e-45, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, title: '$|f^{(n)}(x)|$, $n=0..6$', xlabel: 'x', weight: 1.1, minWidth: 260 });
        const C = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 320, title: 'a plateau bump on $\\mathbb R^2$', weight: 1, minWidth: 260 });
        const fn = (x) => g(x);
        const H = A.handle(0.4, fn(0.4), { color: 'gold', label: 'x₀', constrain: (x) => { const X = clamp(x, -1.1, 2.3); return [X, fn(X)]; } });
        const cols = ['accent', 'blue', 'teal', 'green', 'gold', 'orange', 'red'];
        const plateau = (r, a, b) => 1 - step((r - a) / (b - a));
        const bump2 = (x, y) => {
          const a = Math.min(r1.value, r2.value - 0.05), b = r2.value;
          if (prof.value === 'round') return plateau(Math.hypot(x, y), a, b);
          if (prof.value === 'box') return plateau(Math.abs(x), a, b) * plateau(Math.abs(y), a, b);
          return plateau(Math.hypot(x, y), a, b) - plateau(Math.hypot(x, y), a * 0.35, a * 0.8);
        };
        let st = null;
        v.render(() => {
          const x0 = H.x;
          A.fn(fn, { color: 'accent', width: 3, domain: [-1.2, 2.4], n: 400 });
          A.line(-1.2, 0, 2.4, 0, { color: 'red', width: 2, dash: [5, 4] });
          A.tex('T_0^{(N)}f\\equiv0', -0.55, 0.12, { color: 'red', size: 14 });
          A.dot(x0, fn(x0), { r: 6, color: 'gold' });
          // log-log derivatives
          const xs = []; for (let i = 0; i <= 160; i++) xs.push(0.01 * Math.pow(200, i / 160));
          for (let n = 0; n <= 6; n++) B.path(xs.map((x) => [x, Math.max(Math.abs(bumpDeriv(BP, n, x)), 1e-300)]), { color: cols[n], width: n === 0 ? 3 : 1.8 });
          B.path(xs.map((x) => [x, Math.pow(x, mm.value)]), { color: 'muted', width: 2, dash: [6, 4] });
          if (x0 > 0.01) B.vline(x0, { color: 'gold', width: 1.2, dash: [3, 3] });
          // heat map of the bump
          C.heat(bump2, { range: [0, 1], cmap: 'viridis', res: 4, key: `${prof.value}|${r1.value}|${r2.value}` });
          const a = Math.min(r1.value, r2.value - 0.05), b = r2.value;
          if (prof.value === 'box') { C.rect(-a, -a, a, a, { color: 'ink', width: 1, dash: true }); C.rect(-b, -b, b, b, { color: 'ink', width: 1 }); } else { C.circle(0, 0, a, { color: 'ink', width: 1, dash: true }); C.circle(0, 0, b, { color: 'ink', width: 1 }); }
          // readouts
          const d = [0, 1, 2].map((n) => bumpDeriv(BP, n, x0));
          let worst = 0; for (let n = 0; n <= 6; n++) worst = Math.max(worst, x0 > 0 ? Math.abs(bumpDeriv(BP, n, x0)) / Math.pow(x0, mm.value) : 0);
          st = { x0, d, worst };
        });
        v.legend([['accent', '$f$'], ['red', 'Taylor polynomial at $0$'], ['muted', '$x^m$ (dashed)']]);
        v.readout(() => {
          if (!st) return '';
          return `At $x_0=${minus(v.fix(st.x0, 3))}$: $f=${v.sci(st.d[0], 3)}$, $f'=${v.sci(st.d[1], 3)}$, $f''=${v.sci(st.d[2], 3)}$ (exact recursion, no differencing). $\\max_{n\\le6}|f^{(n)}(x_0)|/x_0^{${mm.value}}=${v.sci(st.worst, 2)}$ — it tends to $0$ as $x_0\\to0^+$ for every $m$, so all derivatives vanish at $0$ while $f(x_0)>0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Smooth partitions of unity',
      statement: String.raw`Let $M$ be a smooth manifold (Hausdorff, second countable) and $\{U_\alpha\}_{\alpha\in A}$ an open cover. There exists a smooth **partition of unity subordinate to the cover**: smooth functions $\rho_\alpha\colon M\to[0,1]$ with $\operatorname{supp}\rho_\alpha\subset U_\alpha$, such that the family of supports is locally finite and $\sum_\alpha\rho_\alpha\equiv1$.`,
      idea: String.raw`Cover $M$ by countably many coordinate balls, each contained in some $U_\alpha$, so that the closed balls form a locally finite family (second countability and local compactness give an exhaustion by compacts). Use the smooth bump $\psi_i$ of 1.9 on each ball, positive exactly on the ball, extended by $0$. Local finiteness makes $\Psi=\sum\psi_i$ a smooth function, and it is strictly positive *because the balls cover $M$*. Then $\rho_i=\psi_i/\Psi$ is smooth, supported in the $i$-th ball, and $\sum\rho_i=1$. Group the $\rho_i$ by the index $\alpha$ with ball $\subset U_\alpha$.`,
      caption: String.raw`**Circle**: three open arcs (drag the gold handles; the slider widens them) each carry a smooth bump $\psi_i=g\big(1-(d/w)^2\big)$; the coloured layers are $\rho_i=\psi_i/\sum\psi_j$, stacked to height exactly $1$. Shrink the arcs until a gap opens: $\sum\psi_j=0$ there, the normalization is $0/0$ and the stack collapses (red) — the cover hypothesis. **Sphere**: four caps around the vertices of a tetrahedron, with $\psi_i(p)=g(p\cdot c_i-\cos\alpha)$; the surface colour is the blend of the $\rho_i$ and the stack plots them along a great circle (tilt it with the slider). Below the covering radius $\alpha\approx70.5^\circ$ a gap appears.`,
      deps: ['mfd-1.9', 'top-6.15'],
      see: ['pma-10.8', 'fa-6.20'],
      refs: ['Lee SM Ch. 2'],
      tags: ['partition of unity', 'bump function'],
      viz(v) {
        const mode = v.select('manifold', [{ value: 'circ', label: 'circle with three arcs' }, { value: 'sph', label: 'sphere with four caps' }], 'circ');
        const wid = v.slider('arc half-width $w$', 0.6, 2.9, 1.65, { step: 0.01 });
        const alpha = v.slider('cap radius $\\alpha$ (degrees)', 50, 120, 85, { step: 0.5 });
        const tilt = v.slider('tilt of the great circle', 0, 3.1, 0.9, { step: 0.01 });
        const ST = v.stage({ x: [0, TAU], y: [-0.62, 1.12], axes: 'box', gutter: true, height: 360, title: 'the layers $\\rho_i$ (stacked) and $\\sum\\psi_i$ (dashed)', xlabel: 'θ  or  φ along the great circle', weight: 1.25, minWidth: 320,
          xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']] });
        const S3 = v.stage3d({ range: 1.35, height: 360, yaw: -0.9, pitch: 0.6, axes: false, title: 'the manifold coloured by the blend of $\\rho_i$', weight: 1, minWidth: 300 });
        const y0 = [-0.14, -0.28, -0.42];
        const hs = [1.0, 3.3, 5.4].map((c, i) => ST.handle(c, y0[i], { color: ['accent', 'orange', 'green'][i], constrain: (x) => [clamp(wrap(x), 0.01, TAU - 0.01), y0[i]] }));
        const pal = ['blue', 'orange', 'green', 'purple'];
        const cap = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((c) => c.map((x) => x / Math.sqrt(3)));
        const dcirc = (t, c) => Math.abs(wrap(t - c + PI) - PI);
        const psiC = (t, i) => { const d = dcirc(t, hs[i].x); return g(1 - (d / wid.value) ** 2); };
        const psiS = (p, i) => g(p[0] * cap[i][0] + p[1] * cap[i][1] + p[2] * cap[i][2] - Math.cos((alpha.value * PI) / 180));
        const gc = (phi) => { const ct = Math.cos(tilt.value), s = Math.sin(tilt.value); return [Math.cos(phi), Math.sin(phi) * ct, Math.sin(phi) * s]; };
        const css = (rgb) => `rgb(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])})`;
        let st = null;
        v.render(() => {
          const circ = mode.value === 'circ', K = circ ? 3 : 4;
          wid.el.hidden = !circ; alpha.el.hidden = circ; tilt.el.hidden = circ;
          hs.forEach((h) => { h.visible = circ; });
          const col = pal.map((n) => v.rgb(n));
          const psi = circ ? (u, i) => psiC(u, i) : (u, i) => psiS(gc(u), i);
          const sumP = (u) => { let s = 0; for (let i = 0; i < K; i++) s += psi(u, i); return s; };
          const N = 480;
          // stacked layers
          const rho = (u, i) => { const S = sumP(u); return S > 0 ? psi(u, i) / S : 0; };
          for (let i = 0; i < K; i++) ST.between((u) => { let s = 0; for (let j = 0; j < i; j++) s += rho(u, j); return s; }, (u) => { let s = 0; for (let j = 0; j <= i; j++) s += rho(u, j); return s; }, 0, TAU, { fill: pal[i], fillAlpha: 0.55, color: pal[i], n: N });
          // gaps
          let minS = Infinity, maxErr = 0, gapA = null;
          let inGap = false;
          for (let k = 0; k <= N; k++) {
            const u = (TAU * k) / N, S = sumP(u); minS = Math.min(minS, S);
            let sr = 0; for (let i = 0; i < K; i++) sr += rho(u, i); maxErr = Math.max(maxErr, S > 0 ? Math.abs(sr - 1) : 0);
            if (S < 1e-14) { if (!inGap) { gapA = u; inGap = true; } ST.rect(u - 0.5 * TAU / N, 0, u + 0.5 * TAU / N, 1, { fill: 'red', fillAlpha: 0.35, stroke: false, hatch: true }); } else inGap = false;
          }
          ST.path(Array.from({ length: N + 1 }, (_, k) => [(TAU * k) / N, sumP((TAU * k) / N)]), { color: 'ink', width: 1.6, dash: [5, 4] });
          ST.hline(1, { color: 'ink', width: 1, alpha: 0.6 });
          ST.tex('1', 0.12, 1.06, { color: 'ink', size: 13 });
          if (circ) hs.forEach((h, i) => { const c = h.x, w = wid.value, y = y0[i]; [-TAU, 0, TAU].forEach((sh) => { const a = Math.max(0, c - w + sh), b = Math.min(TAU, c + w + sh); if (b > a) ST.line(a, y, b, y, { color: ['accent', 'orange', 'green'][i], width: 5, alpha: 0.85 }); }); });
          else ST.text('great circle through the caps', PI, -0.3, { size: 12, color: 'muted', align: 'center' });
          // 3D object
          const mix = (cs) => { let S = 0; const w = cs.map((c) => { S += c; return c; }); if (S < 1e-14) return [200, 40, 40]; const out = [0, 0, 0]; w.forEach((x, i) => { for (let k = 0; k < 3; k++) out[k] += (x / S) * col[i][k]; }); return out; };
          if (circ) {
            const M = 200;
            for (let k = 0; k < M; k++) { const t0 = (TAU * k) / M, t1 = (TAU * (k + 1)) / M, um = (t0 + t1) / 2; const c = mix([0, 1, 2].map((i) => psiC(um, i))); S3.line([Math.cos(t0), Math.sin(t0), 0], [Math.cos(t1), Math.sin(t1), 0], { color: css(c), width: 7 }); }
            S3.text('S¹', [0, 0, 0], { size: 16, color: 'muted', math: true });
          } else {
            S3.surface((a, b) => [Math.sin(b) * Math.cos(a), Math.sin(b) * Math.sin(a), Math.cos(b)], [0, TAU], [0.001, PI - 0.001], { nu: 64, nv: 32, alpha: 1, colorFn: (a, b, p) => css(mix([0, 1, 2, 3].map((i) => psiS(p, i)))) });
            S3.curve((phi) => gc(phi).map((x) => x * 1.01), 0, TAU, { n: 160, color: 'ink', width: 2 });
            cap.forEach((c, i) => S3.dot(c.map((x) => x * 1.03), { r: 5, color: pal[i], label: String(i + 1) }));
          }
          // integral check on a coarse sample of the manifold (sphere)
          st = { minS, maxErr, gap: minS < 1e-14, gapA };
        });
        v.legend([['blue', '$\\rho_1$', { area: true }], ['orange', '$\\rho_2$', { area: true }], ['green', '$\\rho_3$', { area: true }], ['purple', '$\\rho_4$ (sphere)', { area: true }], ['red', 'not covered: $\\sum\\psi_i=0$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.gap) return `**The sets do not cover**: $\\sum_i\\psi_i$ vanishes on an interval/region (red), so $\\rho_i=\\psi_i/\\sum\\psi_j$ is undefined there — no partition of unity from these bumps. Everywhere else the layers still stack to $1$ (max error $${v.sci(Math.max(st.maxErr, 1e-17), 1)}$).`;
          return `Covered: $\\min\\sum_i\\psi_i=${v.sci(st.minS, 2)}>0$, and $\\max\\big|\\sum_i\\rho_i-1\\big|${st.maxErr < 1e-12 ? '<10^{-12}' : '=' + v.sci(st.maxErr, 1)}$ over ${480} sample points — the layers stack to exactly $1$, each $\\rho_i$ vanishing outside its ${mode.value === 'circ' ? 'arc' : 'cap'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Every closed set is the zero set of a smooth function',
      statement: String.raw`Let $M$ be a smooth manifold and $A\subset M$ any closed subset. There is a smooth function $f\colon M\to[0,\infty)$ with $f^{-1}(0)=A$.`,
      idea: String.raw`The complement $M\setminus A$ is open, so it is covered by countably many coordinate balls $B_k$ (taken locally finite in $M\setminus A$, shrinking toward $A$), each with a bump $\psi_k>0$ exactly on $B_k$ (1.9, 1.10). Put $f=\sum_k\varepsilon_k\psi_k$, with weights $\varepsilon_k>0$ so small that all derivatives up to order $k$ of $\varepsilon_k\psi_k$ are bounded by $2^{-k}$ — then every derivative series converges uniformly and $f$ is smooth. It is positive on $M\setminus A$ (the balls cover it) and vanishes on $A$ (no ball meets $A$). The weights must decay faster than any power of the ball size, which is what makes $f$ flat to infinite order at $A$: no analytic function could do this.`,
      caption: String.raw`**Top:** the Cantor set in $[0,1]$. Each removed middle third carries a bump of weight $\varepsilon=\exp(-\sqrt{1/\text{length}})$; the plot is logarithmic, so $f=0$ on the set sits on the bottom edge. Raise the number of generations: more gaps are filled, $f$ stays smooth. **Bottom:** a closed set in the plane (choose one, or click to add points), covered by a Whitney decomposition (squares of size comparable to their distance to the set, down to the chosen resolution, faint squares); each square carries a bump disc of weight $\exp(-1/2s)$. The height field is $f/\max f$: flat to every order along the set. The readout tests $f=0$ on the set and $f>0$ off it.`,
      deps: ['mfd-1.10'],
      refs: ['Lee SM Ch. 2'],
      tags: ['closed set', 'zero set', 'bump function'],
      viz(v) {
        const gens = v.slider('generations of gaps (Cantor set)', 1, 7, 5, { int: true });
        const sel = v.select('closed set in the plane', [{ value: 'sine', label: 'topologist’s sine curve' }, { value: 'dust', label: 'Cantor dust' }, { value: 'ring', label: 'circle and a segment' }, { value: 'click', label: 'click to add points' }], 'sine');
        const lv = v.slider('resolution (levels of squares)', 3, 7, 7, { int: true });
        v.button('Clear clicked points', () => { clicked.length = 0; ver++; });
        const CS = v.stage({ x: [0, 1], y: [1e-15, 2], ylog: true, axes: 'box', gutter: true, height: 270, full: true, title: '$f$ for the Cantor set (log scale)', xlabel: 'x', ylabel: 'f(x)' });
        const P2 = v.stage({ x: [-0.9, 1.9], y: [-1.4, 1.4], equal: true, axes: false, height: 400, title: 'the set and its Whitney squares', weight: 1, minWidth: 300 });
        const S3 = v.stage3d({ range: 1.9, height: 400, yaw: -0.7, pitch: 0.75, axes: false, title: 'height field $f/\\max f$', weight: 1.1, minWidth: 300 });
        const clicked = [[0.5, 0.35], [1.25, -0.6], [0.0, -0.9]];
        let ver = 0;
        P2.onClick((x, y) => { if (sel.value !== 'click') return; if (x > -0.85 && x < 1.85 && y > -1.35 && y < 1.35) { clicked.push([x, y]); ver++; v.invalidate(); } });
        // ---------------- Cantor set: gaps
        const gapsOf = (L) => { const out = []; const rec = (a, b, j) => { if (j > L) return; const l = (b - a) / 3; out.push([a + l, b - l, j]); rec(a, a + l, j + 1); rec(b - l, b, j + 1); }; rec(0, 1, 1); return out; };
        const inCantor = (x) => { for (let k = 0; k < 40; k++) { x *= 3; const d = Math.floor(x); if (d === 1 && x !== 1) return false; x -= d; if (x === 0) return true; } return true; };
        const eps1 = (len) => Math.exp(-Math.sqrt(1 / len));
        const bumpAt = (x, a, b) => { const c = (a + b) / 2, h = (b - a) / 2, t = 1 - ((x - c) / h) ** 2; return t > 0 ? Math.exp(1 - 1 / t) : 0; };
        // ---------------- planar sets
        const cloud = (kind) => {
          const pts = [];
          if (kind === 'sine') { for (let t = 1; t <= 26; t += 0.004) pts.push([1 / t, Math.sin(t)]); for (let y = -1; y <= 1; y += 0.004) pts.push([0, y]); }
          else if (kind === 'dust') { const L = 6, cs = []; const rec = (a, j) => { if (j === L) { cs.push(a + 0.5 / Math.pow(3, L)); return; } rec(a, j + 1); rec(a + 2 / Math.pow(3, j + 1), j + 1); }; rec(0, 0); const sc = 1.1, ox = -0.05, oy = -0.55; cs.forEach((cx) => cs.forEach((cy) => pts.push([ox + sc * cx, oy + sc * cy]))); }
          else if (kind === 'ring') { for (let k = 0; k < 1800; k++) pts.push([0.45 + 0.7 * Math.cos((TAU * k) / 1800), 0.1 + 0.7 * Math.sin((TAU * k) / 1800)]); for (let t = 0; t <= 1; t += 0.003) pts.push([-0.7 + 0.5 * t, -1.0 + 0.2 * t]), pts.push([1.5, -0.2 + 0.9 * t]); }
          else clicked.forEach(([cx, cy]) => { for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i * i + j * j <= 9) pts.push([cx + 0.012 * i, cy + 0.012 * j]); });
          return pts;
        };
        const BUCK = 0.05;
        const buildGrid = (pts) => { const m = new Map(); pts.forEach((p, i) => { const k = Math.floor(p[0] / BUCK) * 100003 + Math.floor(p[1] / BUCK); (m.get(k) || m.set(k, []).get(k)).push(i); }); return m; };
        const nearest = (grid, pts, x, y, Rmax) => {
          const bx = Math.floor(x / BUCK), by = Math.floor(y / BUCK), n = Math.ceil(Rmax / BUCK);
          let best = Infinity;
          for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) { const l = grid.get((bx + i) * 100003 + by + j); if (!l) continue; for (const id of l) { const d = Math.hypot(pts[id][0] - x, pts[id][1] - y); if (d < best) best = d; } }
          return best;
        };
        const epsS = (s) => Math.exp(-0.5 / s);
        let cache = { key: '', data: null };
        const build = () => {
          const key = `${sel.value}|${lv.value}|${ver}`;
          if (cache.key === key) return cache.data;
          const pts = cloud(sel.value), grid = buildGrid(pts);
          const s0 = 2.8, smin = s0 / Math.pow(2, lv.value), sq = [];
          const rec = (cx, cy, s) => {
            const d = nearest(grid, pts, cx, cy, 3 * s);
            if (d >= 3 * s) { sq.push([cx, cy, s]); return; }
            if (s / 2 < smin) return;
            const h = s / 4; rec(cx - h, cy - h, s / 2); rec(cx + h, cy - h, s / 2); rec(cx - h, cy + h, s / 2); rec(cx + h, cy + h, s / 2);
          };
          rec(0.5, 0, s0);
          // bucket the discs
          const G = 48, x0 = -0.9, y0 = -1.4, cell = 2.8 / G, cells = Array.from({ length: G * G }, () => []);
          const discs = sq.map(([cx, cy, s]) => ({ cx, cy, r: 0.75 * s, w: epsS(s) }));
          discs.forEach((D, id) => { const i0 = Math.max(0, Math.floor((D.cx - D.r - x0) / cell)), i1 = Math.min(G - 1, Math.floor((D.cx + D.r - x0) / cell)), j0 = Math.max(0, Math.floor((D.cy - D.r - y0) / cell)), j1 = Math.min(G - 1, Math.floor((D.cy + D.r - y0) / cell)); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) cells[i * G + j].push(id); });
          const fv = (x, y) => { const i = Math.floor((x - x0) / cell), j = Math.floor((y - y0) / cell); if (i < 0 || j < 0 || i >= G || j >= G) return 0; let s = 0; for (const id of cells[i * G + j]) { const D = discs[id], r2 = (x - D.cx) ** 2 + (y - D.cy) ** 2, t = 1 - r2 / (D.r * D.r); if (t > 0) s += D.w * Math.exp(1 - 1 / t); } return s; };
          cache = { key, data: { pts, grid, sq, smin, fv } };
          return cache.data;
        };
        let st = null;
        v.render(() => {
          // ---- 1D Cantor
          const L = gens.value, gaps = gapsOf(L);
          const f1 = (x) => { let s = 0; for (const [a, b] of gaps) if (x > a && x < b) s += eps1(b - a) * bumpAt(x, a, b); return s; };
          gaps.forEach(([a, b, j]) => CS.path(Array.from({ length: 41 }, (_, k) => [a + ((b - a) * k) / 40, Math.max(eps1(b - a) * bumpAt(a + ((b - a) * k) / 40, a, b), 1e-300)]), { color: ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'][(j - 1) % 7], width: 1.4, alpha: 0.8 }));
          // the closed set A_L (intervals) on the bottom edge
          const ints = [[0, 1]]; let cur = [[0, 1]]; for (let j = 1; j <= L; j++) { cur = cur.flatMap(([a, b]) => { const l = (b - a) / 3; return [[a, a + l], [b - l, b]]; }); }
          cur.forEach(([a, b]) => CS.line(a, 2e-15, b, 2e-15, { color: 'red', width: 6, cap: 'butt' }));
          CS.text('the set after the first gaps (f = 0 on it)', 0.5, 2e-14, { size: 11.5, color: 'red', align: 'center', plate: true });
          // ---- 2D set
          const D = build();
          P2.rect(-0.9, -1.4, 1.9, 1.4, { color: 'faint', width: 1 });
          if (D.sq.length < 7000) D.sq.forEach(([cx, cy, s]) => P2.rect(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2, { color: 'accent', width: 0.5, alpha: 0.35, fill: false }));
          const sub = Math.max(1, Math.floor(D.pts.length / 1500));
          P2.dots(D.pts.filter((_, i) => i % sub === 0), { r: sel.value === 'click' ? 3.4 : 1.9, color: 'red' });
          // ---- height field
          const NG = 56; let fmax = 0; const zs = [];
          for (let i = 0; i <= NG; i++) { zs.push([]); for (let j = 0; j <= NG; j++) { const z = D.fv(-0.9 + (2.8 * i) / NG, -1.4 + (2.8 * j) / NG); zs[i].push(z); fmax = Math.max(fmax, z); } }
          const sc = 1.1 / (fmax || 1);
          S3.surface((x, y) => { const i = Math.round(((x + 0.9) / 2.8) * NG), j = Math.round(((y + 1.4) / 2.8) * NG); return [x - 0.5, y, zs[i][j] * sc - 0.45]; }, [-0.9, 1.9], [-1.4, 1.4], { nu: NG, nv: NG, alpha: 0.95, wire: true, colorFn: (x, y) => { const z = zs[Math.round(((x + 0.9) / 2.8) * NG)][Math.round(((y + 1.4) / 2.8) * NG)] * sc; return z <= 1e-12 ? 'red' : 'accent'; } });
          const sub2 = Math.max(1, Math.floor(D.pts.length / 400));
          D.pts.forEach((p, i) => { if (i % sub2 === 0) S3.dot([p[0] - 0.5, p[1], -0.45], { r: 1.8, color: 'red', ring: false }); });
          // ---- tests
          let maxOnA = 0; D.pts.forEach((p, i) => { if (i % 3 === 0) maxOnA = Math.max(maxOnA, D.fv(p[0], p[1])); });
          let farZero = 0, nz = 0, minPos = Infinity, npos = 0;
          for (let i = 0; i <= NG; i++) for (let j = 0; j <= NG; j++) { const x = -0.9 + (2.8 * i) / NG, y = -1.4 + (2.8 * j) / NG, z = zs[i][j]; if (z === 0) { nz++; farZero = Math.max(farZero, nearest(D.grid, D.pts, x, y, 1.0)); } else { npos++; minPos = Math.min(minPos, z); } }
          st = { n: D.sq.length, smin: D.smin, maxOnA, farZero, nz, npos, minPos, fmax, L, ng: gaps.length };
        });
        v.legend([['red', 'the closed set / where $f=0$'], ['accent', 'bumps and Whitney squares']]);
        v.readout(() => {
          if (!st) return '';
          return `Cantor set: $${st.ng}$ gaps carry bumps (generations $1$–$${st.L}$); the infinite sum over all generations is smooth and vanishes exactly on the Cantor set.\nPlanar set: ${st.n} Whitney squares down to size $${v.fix(st.smin, 3)}$. $\\max f$ on the set $=${v.sci(st.maxOnA, 1)}$ (zero: no bump disc meets it); at the ${st.npos} grid points where $f>0$ the smallest value is $${v.sci(st.minPos, 2)}$; the ${st.nz} grid points with $f=0$ all lie within $${v.fix(st.farZero, 3)}$ of the set (the resolution limit) — $f^{-1}(0)$ is the set up to that resolution, and exactly the set as the levels go to infinity.`;
        });
      },
    },
  ],
};
