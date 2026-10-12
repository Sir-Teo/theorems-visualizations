// Rudin, Real and Complex Analysis — Chapter 7 (part 4): differentiable transformations
// and the change-of-variables theorem.

// ---------------------------------------------------------------- shared helpers (batch 4)
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
function logTicks(a, b) {
  const out = [];
  for (let k = Math.ceil(a); k <= b; k++) out.push([k, k === 0 ? '1' : k === 1 ? '10' : k === -1 ? '0.1' : '10' + String(k).split('').map((c) => SUP[c]).join('')]);
  return out;
}
const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => Math.pow(10, a + (b - a) * i / (n - 1)));
/** A smooth map of the plane with positive Jacobian on [-1.6,1.6]², its derivative matrix, and a kinked map. */
const SMOOTH = {
  T: ([u, v]) => [u + 0.3 * Math.sin(1.5 * v) + 0.15 * u * u, 0.8 * v + 0.25 * u * u + 0.1 * u * v],
  D: ([u, v]) => [[1 + 0.3 * u, 0.45 * Math.cos(1.5 * v)], [0.5 * u + 0.1 * v, 0.8 + 0.1 * u]],
};
const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const mv = (A, h) => [A[0][0] * h[0] + A[0][1] * h[1], A[1][0] * h[0] + A[1][1] * h[1]];
function polyArea(P) { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return a / 2; }
/** Cantor function c on [0,1]. */
function cantor(x, depth = 34) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  let y = 0, s = 0.5;
  for (let i = 0; i < depth; i++) { x *= 3; if (x < 1) { /* left */ } else if (x < 2) return y + s; else { y += s; x -= 2; } s /= 2; }
  return y;
}
function cantorLevel(n) { let I = [[0, 1]]; for (let k = 0; k < n; k++) I = I.flatMap(([a, b]) => { const d = (b - a) / 3; return [[a, a + d], [b - d, b]]; }); return I; }

export default {
  book: 'rca',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.22
    {
      num: '7.22',
      kind: 'Definition',
      name: 'Differentiable transformations and the Jacobian',
      statement: String.raw`Let $V$ be an open set in $\R^k$ and $T:V\to\R^k$. If $x\in V$ and there is a linear operator $A$ on $\R^k$ such that
$$\lim_{h\to0}\frac{|T(x+h)-T(x)-Ah|}{|h|}=0 ,$$
then $T$ is **differentiable** at $x$ and $T'(x)=A$ (the operator $A$ is unique). The determinant $J_T(x)=\det T'(x)$ is the **Jacobian** of $T$ at $x$.`,
      idea: String.raw`Near $x$, $T$ is an affine map $h\mapsto T(x)+Ah$ up to an error that is small *relative to* $|h|$. Linear maps multiply Lebesgue measure by $|\det A|$ (2.20), so $|J_T(x)|$ is the natural candidate for the local factor by which $T$ distorts volume — which is what 7.24 proves. Uniqueness of $A$: two candidates differ by a linear map $B$ with $|Bh|/|h|\to0$, forcing $B=0$.`,
      caption: String.raw`Drag $x$ and shrink the window $s$. Left: a grid on the square of half-width $s$ about $x$. Right: its image under $T$ (blue) and under the affine map $T(x)+T'(x)h$ (orange, dashed), both magnified by $1/s$ about $T(x)$. For a differentiable $T$ the two grids merge as $s\to0$. For the kinked map $(u,v)\mapsto(u+\tfrac12|v|,v)$, at points with $v=0$ the image keeps its corner at every scale: no linear $A$ fits.`,
      deps: ['rca-2.20'],
      see: ['pma-9.11'],
      tags: ['differentiable maps', 'Jacobian'],
      viz(v) {
        const M = v.M;
        const MAPS = {
          smooth: { label: 'a smooth map', T: SMOOTH.T, D: SMOOTH.D },
          kink: { label: '$(u,v)\\mapsto(u+\\frac12|v|,\\,v)$', T: ([u, w]) => [u + 0.5 * Math.abs(w), w], D: ([, w]) => [[1, 0.5 * Math.sign(w)], [0, 1]] },
        };
        const which = v.select('$T$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const sS = v.slider('window $s$', 0.003, 0.8, 0.45, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 320, title: 'domain: the square of half-width $s$ about $x$' });
        const R = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, height: 320, axes: false, title: 'image, magnified by $1/s$ about $T(x)$' });
        const xh = L.handle(0.5, 0.35, { color: 'accent', label: 'x', constrain: (x, y) => [x, which.value === 'kink' && Math.abs(y) < 0.06 ? 0 : y] });
        let st = {};
        v.legend([['accent', '$T$ applied to the grid'], ['orange', 'affine approximation $T(x)+T\'(x)h$', { dash: true }]]);
        v.render(() => {
          const F = MAPS[which.value], s = sS.value, x = [xh.x, xh.y];
          const T0 = F.T(x), A = F.D(x);
          L.rect(x[0] - s, x[1] - s, x[0] + s, x[1] + s, { color: 'accent', width: 1.6, fill: 'accent', fillAlpha: 0.1 });
          if (which.value === 'kink') L.hline(0, { color: 'red', dash: [5, 4], width: 1.2 });
          const n = 8, lines = [];
          for (let i = 0; i <= n; i++) { const c = -1 + 2 * i / n; lines.push((t) => [c, t], (t) => [t, c]); }
          let worst = 0;
          for (const g of lines) {
            const ptsT = [], ptsA = [];
            for (let k = 0; k <= 40; k++) {
              const h = g(-1 + 2 * k / 40).map((q) => q * s);
              const y = F.T([x[0] + h[0], x[1] + h[1]]), a = mv(A, h);
              ptsT.push([(y[0] - T0[0]) / s, (y[1] - T0[1]) / s]); ptsA.push([a[0] / s, a[1] / s]);
              const nh = Math.hypot(h[0], h[1]); if (nh > 0) worst = Math.max(worst, Math.hypot(y[0] - T0[0] - a[0], y[1] - T0[1] - a[1]) / nh);
            }
            R.path(ptsA, { color: 'orange', width: 1.4, dash: [5, 4] });
            R.path(ptsT, { color: 'accent', width: 1.5 });
            L.path(ptsT.map((_, k) => { const h = g(-1 + 2 * k / 40); return [x[0] + h[0] * s, x[1] + h[1] * s]; }), { color: 'accent', width: 0.8, alpha: 0.6 });
          }
          R.dot(0, 0, { color: 'ink', r: 3.5, label: 'T(x)', labelPos: 'sw' });
          R.corner(`sup |T(x+h) − T(x) − T′(x)h| / |h| = ${v.fmt(worst, 3)}`, 'tl', { color: worst < 0.05 ? 'green' : 'ink', weight: 600 });
          st = { A, J: det2(A), worst, kinkHere: which.value === 'kink' && x[1] === 0 };
        });
        v.readout(() => `$T'(x)=\\begin{pmatrix}${v.fix(st.A[0][0], 3)}&${v.fix(st.A[0][1], 3)}\\\\${v.fix(st.A[1][0], 3)}&${v.fix(st.A[1][1], 3)}\\end{pmatrix}$, $\\;J_T(x)=${v.fix(st.J, 4)}$; worst relative error over the window: $${v.fix(st.worst, 4)}$` + (st.kinkHere ? ' — it does not go to $0$: $T$ is not differentiable on the line $v=0$.' : '.'));
      },
    },
    // ------------------------------------------------------------------ 7.23
    {
      num: '7.23',
      kind: 'Lemma',
      name: 'A perturbation of the identity covers a smaller ball',
      verify: true,
      statement: String.raw`Let $B$ be the open unit ball of $\R^k$, $\bar B$ its closure and $S$ its boundary sphere. If $F:\bar B\to\R^k$ is continuous, $0<\eps<1$, and $|F(x)-x|<\eps$ for every $x\in S$, then
$$F(B)\supset B(0,1-\eps).$$`,
      idea: String.raw`Suppose some $a$ with $|a|<1-\eps$ is not a value of $F$ on $\bar B$. Then $G(x)=\dfrac{a-F(x)}{|a-F(x)|}$ is a continuous map of $\bar B$ into $S\subset\bar B$, so by Brouwer's fixed point theorem $G(x)=x$ for some $x$, necessarily with $|x|=1$. Then $\langle x,F(x)-x\rangle=\langle x,a\rangle-|a-F(x)|-1<|a|-1<-\eps$, contradicting $|F(x)-x|<\eps$. So $a\in F(\bar B)$, and $a\notin F(S)$ because $F(S)$ lies within $\eps$ of $S$; hence $a\in F(B)$. In the plane this is the statement that the loop $F(S)$ winds once around every point of $B(0,1-\eps)$.`,
      caption: String.raw`$F$ moves boundary points by less than $\eps$ (the image of the circle stays in the orange annulus) but may fold the interior wildly (raise the distortion). Drag the test point $a$ anywhere in the green disc $B(0,1-\eps)$: the winding number of the loop $F(S)$ about $a$ stays $1$, and a preimage $x\in B$ with $F(x)=a$ is found numerically and marked on the left. Points outside the annulus's inner rim need not be covered.`,
      deps: ['rca-7.22'],
      tags: ['Brouwer fixed point', 'topology'],
      viz(v) {
        const M = v.M;
        const eS = v.slider('$\\varepsilon$', 0.08, 0.6, 0.3, { step: 0.01 });
        const bS = v.slider('interior distortion', 0, 1.6, 0.9, { step: 0.01 });
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 320, axes: false, title: 'domain $\\bar B$ with a polar grid' });
        const R = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 320, axes: false, title: 'image $F(\\bar B)$' });
        const ah = R.handle(0.35, -0.25, { color: 'gold', label: 'a' });
        const Fz = (x, y, e, b) => {
          const w = [Math.cos(3 * x + 1) * 0.66, Math.sin(2 * y + 0.5) * 0.66];         // |w| < 1 on S, so |F − id| < ε there
          const q = 1 - (x * x + y * y);                                                   // vanishes on S
          return [x + e * w[0] + b * q * Math.sin(3 * y + 0.4), y + e * w[1] + b * q * Math.cos(2.5 * x - 0.3)];
        };
        let st = {};
        v.legend([['accent', 'images of the grid circles and rays'], ['orange', 'annulus $1-\\varepsilon<|w|<1+\\varepsilon$', { area: true }], ['green', '$B(0,1-\\varepsilon)$', { area: true }], ['gold', 'test point $a$ and a preimage']]);
        v.render(() => {
          const e = eS.value, b = bS.value, F = (p) => Fz(p[0], p[1], e, b);
          // annulus and target disc
          R.rings([M.range(120).map((k) => [(1 + e) * Math.cos(k * M.TAU / 120), (1 + e) * Math.sin(k * M.TAU / 120)]), M.range(120).map((k) => [(1 - e) * Math.cos(-k * M.TAU / 120), (1 - e) * Math.sin(-k * M.TAU / 120)])], { fill: 'orange', fillAlpha: 0.14, stroke: false });
          R.circle(0, 0, 1 - e, { fill: 'green', fillAlpha: 0.14, color: 'green', width: 1.4, dash: [5, 4] });
          // grid and its image
          for (let i = 1; i <= 6; i++) { const r = i / 6; const circ = (t) => [r * Math.cos(t), r * Math.sin(t)]; L.curve(circ, 0, M.TAU, { color: 'accent', width: i === 6 ? 2.4 : 1, n: 160 }); R.curve((t) => F(circ(t)), 0, M.TAU, { color: 'accent', width: i === 6 ? 2.6 : 1, alpha: i === 6 ? 1 : 0.7, n: 240 }); }
          for (let j = 0; j < 16; j++) { const t = j * M.TAU / 16, ray = (s) => [s * Math.cos(t), s * Math.sin(t)]; L.curve(ray, 0, 1, { color: 'accent', width: 0.8, alpha: 0.6, n: 2 }); R.curve((s) => F(ray(s)), 0, 1, { color: 'accent', width: 0.8, alpha: 0.6, n: 60 }); }
          // boundary deviation, winding number, preimage
          let dev = 0; for (let k = 0; k < 400; k++) { const t = k * M.TAU / 400, p = [Math.cos(t), Math.sin(t)], q = F(p); dev = Math.max(dev, Math.hypot(q[0] - p[0], q[1] - p[1])); }
          const a = [ah.x, ah.y];
          const wind = M.winding((s) => F([Math.cos(M.TAU * s), Math.sin(M.TAU * s)]), a, 900);
          let best = null, bd = Infinity;
          for (let i = 0; i <= 90; i++) for (let j = 0; j <= 90; j++) { const p = [-1 + 2 * i / 90, -1 + 2 * j / 90]; if (p[0] * p[0] + p[1] * p[1] >= 1) continue; const q = F(p), d = Math.hypot(q[0] - a[0], q[1] - a[1]); if (d < bd) { bd = d; best = p; } }
          for (let it = 0; it < 25 && best; it++) { // Newton with a numerical Jacobian
            const h = 1e-6, q = F(best), qx = F([best[0] + h, best[1]]), qy = F([best[0], best[1] + h]);
            const J = [[(qx[0] - q[0]) / h, (qy[0] - q[0]) / h], [(qx[1] - q[1]) / h, (qy[1] - q[1]) / h]], dt = det2(J);
            if (Math.abs(dt) < 1e-12) break;
            const r0 = a[0] - q[0], r1 = a[1] - q[1];
            let nx = best[0] + (J[1][1] * r0 - J[0][1] * r1) / dt, ny = best[1] + (-J[1][0] * r0 + J[0][0] * r1) / dt;
            const nr = Math.hypot(nx, ny); if (nr >= 0.999) { nx *= 0.999 / nr; ny *= 0.999 / nr; }
            best = [nx, ny];
          }
          const res = best ? Math.hypot(F(best)[0] - a[0], F(best)[1] - a[1]) : Infinity;
          if (best && res < 1e-6) L.dot(best[0], best[1], { color: 'gold', r: 6, label: 'x', labelPos: 'ne' });
          const inside = Math.hypot(a[0], a[1]) < 1 - e;
          R.corner(`winding number of F(S) about a: ${wind}`, 'tl', { color: wind === 1 ? 'green' : 'red', weight: 600 });
          st = { e, dev, wind, res, best, inside };
        });
        v.readout(() => `$\\max_S|F(x)-x|=${v.fix(st.dev, 3)}<\\varepsilon=${v.fix(st.e, 2)}$; ` + (st.res < 1e-6 ? `a preimage of $a$ is $x=(${v.fix(st.best[0], 3)},${v.fix(st.best[1], 3)})$, $|x|=${v.fix(Math.hypot(st.best[0], st.best[1]), 3)}<1$.` : 'no preimage was found in $B$') + (st.inside ? '' : ' ($a$ lies outside $B(0,1-\\varepsilon)$, where the lemma promises nothing.)'));
      },
    },
    // ------------------------------------------------------------------ 7.24
    {
      num: '7.24',
      kind: 'Theorem',
      name: 'Local volume distortion equals |J_T|',
      statement: String.raw`Let $V$ be open in $\R^k$, let $T:V\to\R^k$ be continuous, and suppose $T$ is differentiable at the point $x\in V$. Then
$$\lim_{r\to0}\frac{m(T(B(x,r)))}{m(B(x,r))}=|J_T(x)| .$$`,
      idea: String.raw`Put $A=T'(x)$; translating, $x=0=T(x)$. If $A$ is invertible, $F=A^{-1}T$ satisfies $F(h)=h+o(|h|)$, so on $\bar B(0,r)$ it moves the boundary sphere by less than $\eps r$ for small $r$. Then $F(B(0,r))$ lies in $B(0,(1+\eps)r)$ and, by the covering lemma 7.23, contains $B(0,(1-\eps)r)$; applying $A$ multiplies volumes by $|\det A|$ (2.20). If $A$ is singular, $A$ maps $\R^k$ into a hyperplane, and $T(B(0,r))$ lies in an $\eps r$-neighbourhood of a bounded piece of it, whose volume is $O(\eps r^k)$.`,
      caption: String.raw`Drag $x$ and shrink $r$. The blue region is the true image $T(B(x,r))$ (its area computed from the image of the boundary circle); the dashed orange ellipse is the linear prediction $T(x)+T'(x)B(0,r)$. Both are magnified to a common size on the right. The lower panel tracks $m(T(B(x,r)))/m(B(x,r))$ against $\log r$, converging to $|J_T(x)|$. For $z\mapsto z|z|$ at $0$ the derivative is $0$ and the ratio dies like $r^2$; $z\mapsto z/\sqrt{|z|}$ is not differentiable at $0$, and the ratio blows up.`,
      deps: ['rca-7.22', 'rca-7.23', 'rca-2.23'],
      tags: ['Jacobian', 'change of variables'],
      viz(v) {
        const M = v.M;
        const MAPS = {
          smooth: { label: 'a smooth map', T: ([u, w]) => [u + 0.35 * w * w + 0.3 * Math.sin(2 * u), w + 0.4 * u * u], D: ([u, w]) => [[1 + 0.6 * Math.cos(2 * u), 0.7 * w], [0.8 * u, 1]], x0: [0.45, -0.3], free: true },
          sq: { label: '$z\\mapsto z|z|$', T: ([u, w]) => { const n = Math.hypot(u, w); return [u * n, w * n]; }, D: ([u, w]) => { const n = Math.hypot(u, w); if (n === 0) return [[0, 0], [0, 0]]; return [[n + u * u / n, u * w / n], [u * w / n, n + w * w / n]]; }, x0: [0, 0], free: true },
          root: { label: '$z\\mapsto z/\\sqrt{|z|}$', T: ([u, w]) => { const n = Math.hypot(u, w); return n === 0 ? [0, 0] : [u / Math.sqrt(n), w / Math.sqrt(n)]; }, D: null, x0: [0, 0], free: true },
        };
        const which = v.select('$T$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'smooth', { onChange: (k) => { xh.set(...MAPS[k].x0); } });
        const rS = v.slider('radius $r$', 0.002, 0.6, 0.5, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, height: 290, title: 'domain: $B(x,r)$' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 290, axes: false, title: 'image $T(B(x,r))$, rescaled' });
        const P = v.stage({ x: [-2.75, -0.2], y: [0, 1.5], height: 180, full: true, axes: 'box', xticks: logTicks(-2, -1).concat([[Math.log10(0.3), '0.3']]), title: '$m(T(B(x,r)))/m(B(x,r))$ against $r$ (log scale)' });
        const xh = L.handle(0.45, -0.3, { color: 'accent', label: 'x', constrain: (x, y) => { const n = Math.hypot(x, y); return n < 0.05 ? [0, 0] : n > 0.8 ? [0.8 * x / n, 0.8 * y / n] : [x, y]; } });
        const ratio = (F, x, r) => { const pts = M.range(360).map((k) => F.T([x[0] + r * Math.cos(k * M.TAU / 360), x[1] + r * Math.sin(k * M.TAU / 360)])); return Math.abs(polyArea(pts)) / (Math.PI * r * r); };
        let st = {};
        v.legend([['accent', '$T(B(x,r))$', { area: true }], ['orange', '$T(x)+T\'(x)\\,B(0,r)$', { dash: true }], ['green', '$|J_T(x)|$', { dash: true }]]);
        v.render(() => {
          const F = MAPS[which.value], r = rS.value, x = [xh.x, xh.y];
          const T0 = F.T(x), A = F.D ? F.D(x) : null, J = A ? Math.abs(det2(A)) : Infinity;
          L.circle(x[0], x[1], r, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 2 });
          // image boundary, rescaled to a common size
          const bd = M.range(240).map((k) => F.T([x[0] + r * Math.cos(k * M.TAU / 240), x[1] + r * Math.sin(k * M.TAU / 240)]));
          const ext = Math.max(...bd.map((p) => Math.hypot(p[0] - T0[0], p[1] - T0[1]))) || 1;
          const k = 1.2 / ext;
          R.poly(bd.map((p) => [(p[0] - T0[0]) * k, (p[1] - T0[1]) * k]), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          if (A) R.poly(M.range(120).map((j) => { const h = [r * Math.cos(j * M.TAU / 120), r * Math.sin(j * M.TAU / 120)], a = mv(A, h); return [a[0] * k, a[1] * k]; }), { color: 'orange', width: 1.8, dash: [6, 4] });
          R.dot(0, 0, { color: 'ink', r: 3, label: 'T(x)', labelPos: 'sw' });
          R.corner(`scale ×${v.fmt(k, 3)}`, 'br', { size: 11 });
          // ratio against r
          const RS = logspace(-2.75, Math.log10(0.6), 56), qs = RS.map((s) => ratio(F, x, s));
          let top = M.clamp(Math.max(...qs, isFinite(J) ? J : 0) * 1.35, 0.5, 6), bot0 = -0.08 * top;
          if (which.value === 'smooth') { const lo = Math.min(...qs, J), hi = Math.max(...qs, J), pad = Math.max(0.04, (hi - lo) * 0.6); top = hi + pad; bot0 = lo - pad; }
          P.setView(null, [bot0, top]);
          if (isFinite(J)) { P.hline(J, { color: 'green', dash: [6, 4], width: 1.6 }); P.text(`|J_T(x)| = ${v.fmt(J, 4)}`, -2.7, J, { align: 'left', dy: 12, color: 'green', size: 11.5 }); }
          P.path(RS.map((s, i) => [Math.log10(s), qs[i]]), { color: 'accent', width: 2.4 });
          const q = ratio(F, x, r);
          P.dot(Math.log10(r), q, { color: 'accent', r: 5 });
          st = { q, J, r, which: which.value, at0: x[0] === 0 && x[1] === 0 };
        });
        v.readout(() => `$r=${v.fmt(st.r, 3)}$: $\\;m(T(B(x,r)))/m(B(x,r))=${v.fix(st.q, 4)}$` + (isFinite(st.J) ? `, $\\;|J_T(x)|=${v.fix(st.J, 4)}$.` : st.at0 ? ' — grows like $1/r$: $T$ is not differentiable at $0$.' : '.'));
      },
    },
    // ------------------------------------------------------------------ 7.25
    {
      num: '7.25',
      kind: 'Lemma',
      name: 'Pointwise Lipschitz maps send null sets to null sets',
      verify: true,
      statement: String.raw`Let $E\subset\R^k$ with $m(E)=0$, and let $T:E\to\R^k$ satisfy
$$\limsup_{y\to x,\ y\in E}\frac{|T(y)-T(x)|}{|y-x|}<\infty\qquad\text{for every }x\in E .$$
Then $m(T(E))=0$. In particular, a map $T:V\to\R^k$ ($V$ open) that is differentiable at every point of a null set $E\subset V$ maps $E$ onto a null set.`,
      idea: String.raw`Write $E=\bigcup_n E_n$, where $E_n$ consists of the $x\in E$ with $|T(y)-T(x)|\le n|y-x|$ whenever $y\in E$ and $|y-x|<1/n$. Cover $E_n$ by an open set of measure $<\eps$ and split it into disjoint small cubes $Q$ of diameter $<1/n$ (2.19). Each $T(Q\cap E_n)$ lies in a ball of radius $n\operatorname{diam}Q$, whose measure is a constant $c_k n^k$ times $m(Q)$. Summing over $Q$ gives $m^*(T(E_n))\le c_kn^k\eps$. The Cantor function shows that continuity alone is not enough.`,
      caption: String.raw`$E=C\times C$, the product of two Cantor sets: $m(E)=0$, and the $4^n$ orange squares of side $3^{-n}$ cover it with total area $(4/9)^n$. On the right are their images. Under a smooth map the image squares are slightly distorted and their total area also tends to $0$. Under the continuous map $(u,v)\mapsto(c(u),c(v))$, $c$ the Cantor function, whose difference quotients are unbounded on $E$, the images tile the whole unit square at every stage: $T(E)=[0,1]^2$.`,
      deps: ['rca-2.19', 'rca-2.20', 'rca-7.22'],
      tags: ['null sets', 'Lipschitz'],
      viz(v) {
        const M = v.M;
        const MAPS = {
          smooth: { label: 'a smooth map', T: ([u, w]) => [u + 0.22 * Math.sin(3 * w) + 0.1 * u * w, w + 0.18 * Math.sin(2.6 * u)], view: [[-0.15, 1.35], [-0.15, 1.3]] },
          cantor: { label: '$(c(u),c(v))$', T: ([u, w]) => [cantor(u), cantor(w)], view: [[-0.08, 1.08], [-0.08, 1.08]] },
        };
        const which = v.select('$T$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'cantor');
        const nS = v.slider('stage $n$', 1, 6, 3, { int: true });
        const L = v.stage({ x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, height: 320, title: 'cover of $E=C\\times C$' });
        const R = v.stage({ x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, height: 320, title: 'images under $T$' });
        let st = {};
        v.legend([['orange', '$4^n$ squares covering $E$', { area: true }], ['accent', 'their images', { area: true }]]);
        v.render(() => {
          const F = MAPS[which.value], n = nS.value, I = cantorLevel(n);
          R.setView(...F.view);
          let cover = 0, img = 0;
          const m = 6;
          for (const [a, b] of I) for (const [c, d] of I) {
            L.rect(a, c, b, d, { fill: 'orange', fillAlpha: 0.75, stroke: n <= 3, color: 'orange', width: 1 });
            cover += (b - a) * (d - c);
            let P;
            if (which.value === 'cantor') { const p = F.T([a, c]), q = F.T([b, d]); P = [[p[0], p[1]], [q[0], p[1]], [q[0], q[1]], [p[0], q[1]]]; }
            else { P = []; for (let k = 0; k < m; k++) P.push(F.T([a + (b - a) * k / m, c])); for (let k = 0; k < m; k++) P.push(F.T([b, c + (d - c) * k / m])); for (let k = 0; k < m; k++) P.push(F.T([b - (b - a) * k / m, d])); for (let k = 0; k < m; k++) P.push(F.T([a, d - (d - c) * k / m])); }
            img += Math.abs(polyArea(P));
            R.poly(P, { fill: 'accent', fillAlpha: 0.6, stroke: n <= 3, color: 'accent', width: 1 });
          }
          if (which.value === 'smooth') R.poly([...M.linspace(0, 1, 30).map((t) => F.T([t, 0])), ...M.linspace(0, 1, 30).map((t) => F.T([1, t])), ...M.linspace(1, 0, 30).map((t) => F.T([t, 1])), ...M.linspace(1, 0, 30).map((t) => F.T([0, t]))], { color: 'muted', width: 1, dash: [4, 4] });
          else R.rect(0, 0, 1, 1, { color: 'muted', width: 1, dash: [4, 4] });
          st = { n, cover, img, which: which.value };
        });
        v.readout(() => `Stage $${st.n}$: total area of the cover $=(4/9)^{${st.n}}=${v.fix(st.cover, 4)}$; total area of the images $=${v.fix(st.img, 4)}$` + (st.which === 'cantor' ? ' — always $1$: a continuous map can blow a null set up to positive measure.' : ' $\\to0$.'));
      },
    },
    // ------------------------------------------------------------------ 7.26
    {
      num: '7.26',
      kind: 'Theorem',
      name: 'Change of variables in multiple integrals',
      statement: String.raw`Suppose that
(i) $X\subset V\subset\R^k$, $V$ is open, and $T:V\to\R^k$ is continuous;
(ii) $X$ is Lebesgue measurable, $T$ is one-to-one on $X$, and $T$ is differentiable at every point of $X$;
(iii) $m(T(V\setminus X))=0$.
Then, with $Y=T(X)$,
$$\int_Y f\,dm=\int_X(f\circ T)\,|J_T|\,dm$$
for every measurable $f:\R^k\to[0,\infty]$.`,
      idea: String.raw`First, $T$ maps measurable subsets of $V$ to measurable sets, and null sets to null sets (7.25). Hence $\mu(E)=m(T(E\cap X))$ is a measure on the Borel sets of $V$ — countably additive because $T$ is one-to-one on $X$ — and $\mu\ll m$. By Radon–Nikodym and 7.8 its density is the limit of $\mu(B(x,r))/m(B(x,r))$, which equals $|J_T(x)|$ by 7.24 and (iii). So $m(T(E))=\int_E|J_T|\,dm$ for measurable $E\subset X$; this is the formula for $f=\chi_{T(E)}$, and simple functions plus monotone convergence (1.26) give the general case.`,
      caption: String.raw`Left: the parameter domain $X$, coloured by $(f\circ T)|J_T|$; right: $Y=T(X)$ coloured by $f$, a bump you can drag (gold handle). Both integrals are computed independently on grids (the right one without using $T$). Drag the small square $Q$ on the left: its image has area $\approx|J_T|\,m(Q)$. With polar coordinates or a smooth injective map the two integrals agree. Let $\theta$ run over $(0,4\pi)$ instead and $T$ is no longer one-to-one on $X$: the right side counts every point twice.`,
      deps: ['rca-7.24', 'rca-7.25', 'rca-7.8', 'rca-6.10', 'rca-1.26'],
      see: ['pma-10.9'],
      tags: ['change of variables', 'Jacobian'],
      viz(v) {
        const M = v.M;
        const RAD = 1.45;
        const MAPS = {
          polar: { label: 'polar, $\\theta\\in(0,2\\pi)$', X: [[0, RAD], [0, M.TAU]], T: ([r, t]) => [r * Math.cos(t), r * Math.sin(t)], J: ([r]) => r, inY: (x, y) => x * x + y * y < RAD * RAD, mult: 1, Q0: [0.8, 2.2], s: 0.16 },
          polar2: { label: 'polar, $\\theta\\in(0,4\\pi)$', X: [[0, RAD], [0, 2 * M.TAU]], T: ([r, t]) => [r * Math.cos(t), r * Math.sin(t)], J: ([r]) => r, inY: (x, y) => x * x + y * y < RAD * RAD, mult: 2, Q0: [0.8, 2.2], s: 0.16 },
          smooth: { label: 'a smooth injective map', X: [[-1, 1], [-1, 1]], T: SMOOTH.T, J: (p) => det2(SMOOTH.D(p)), inY: null, mult: 1, Q0: [0.3, 0.2], s: 0.16 },
        };
        const which = v.select('$T$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'polar', { onChange: (k) => { const G = MAPS[k]; L.setView(...G.X); qh.set(...G.Q0); } });
        const L = v.stage({ x: MAPS.polar.X[0], y: MAPS.polar.X[1], height: 320, axes: 'box', title: 'parameter domain $X$: $(f\\circ T)\\,|J_T|$' });
        const R = v.stage({ x: [-1.65, 1.65], y: [-1.65, 1.65], equal: true, height: 320, axes: false, title: '$Y=T(X)$: the function $f$' });
        const qh = L.handle(0.8, 2.2, { color: 'orange', label: 'Q', labelPos: 'ne' });
        const ch = R.handle(0.45, 0.35, { color: 'gold', label: 'f' });
        const W = 0.42;
        const f = (x, y) => Math.exp(-((x - ch.x) ** 2 + (y - ch.y) ** 2) / (W * W));
        // Y for the smooth map: the image of the boundary of X as a polygon; membership mask cached on the integration grid
        const smoothY = (() => { const G = MAPS.smooth, B = []; const e = (u, w) => G.T([u, w]); for (const t of M.linspace(-1, 1, 80)) B.push(e(t, -1)); for (const t of M.linspace(-1, 1, 80)) B.push(e(1, t)); for (const t of M.linspace(1, -1, 80)) B.push(e(t, 1)); for (const t of M.linspace(1, -1, 80)) B.push(e(-1, t)); return B; })();
        MAPS.smooth.inY = (x, y) => M.pointInPoly([x, y], smoothY);
        const NG = 240, GX = M.linspace(-1.65, 1.65, NG + 1), HG = 3.3 / NG;
        const masks = {};
        const mask = (key) => { if (masks[key]) return masks[key]; const G = MAPS[key], out = new Uint8Array(NG * NG); for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) out[i * NG + j] = G.inY(GX[i] + HG / 2, GX[j] + HG / 2) ? 1 : 0; return (masks[key] = out); };
        let st = {};
        v.legend([['accent', 'heat: integrands'], ['orange', 'square $Q$ and its image $T(Q)$', { area: true }], ['gold', 'centre of the bump $f$']]);
        v.render(() => {
          const G = MAPS[which.value];
          // left heat map of (f∘T)|J| and right heat map of f
          const key = [which.value, ch.x.toFixed(3), ch.y.toFixed(3)].join(':');
          L.heat((a, b) => { const p = G.T([a, b]); return f(p[0], p[1]) * Math.abs(G.J([a, b])); }, { range: [0, 1.15], cmap: 'viridis', key, res: 3, alpha: 0.9 });
          L.axes();
          const mk = mask(which.value);
          R.heat((x, y) => (G.inY(x, y) ? f(x, y) : NaN), { range: [0, 1.15], cmap: 'viridis', key, res: 3, alpha: 0.9 });
          // outline of Y
          if (which.value === 'smooth') R.poly(smoothY, { color: 'ink', width: 1.4 }); else R.circle(0, 0, RAD, { color: 'ink', width: 1.4 });
          // integrals: right side on the X grid (midpoint rule), left side on a Cartesian grid over Y (no use of T)
          const [xr, yr] = G.X, nx = 220, ny = 220, hx = (xr[1] - xr[0]) / nx, hy = (yr[1] - yr[0]) / ny;
          let rhs = 0; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const p = [xr[0] + (i + 0.5) * hx, yr[0] + (j + 0.5) * hy], q = G.T(p); rhs += f(q[0], q[1]) * Math.abs(G.J(p)); }
          rhs *= hx * hy;
          let lhs = 0; for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) if (mk[i * NG + j]) lhs += f(GX[i] + HG / 2, GX[j] + HG / 2);
          lhs *= HG * HG;
          // the small square and its image
          const s = G.s * (which.value === 'smooth' ? 1 : 1), q0 = [qh.x, qh.y];
          const sq = [[q0[0], q0[1]], [q0[0] + s, q0[1]], [q0[0] + s, q0[1] + s], [q0[0], q0[1] + s]];
          L.poly(sq, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 2 });
          const img = []; for (let e = 0; e < 4; e++) { const p = sq[e], q = sq[(e + 1) % 4]; for (let k = 0; k < 16; k++) img.push(G.T([p[0] + (q[0] - p[0]) * k / 16, p[1] + (q[1] - p[1]) * k / 16])); }
          R.poly(img, { fill: 'orange', fillAlpha: 0.4, color: 'orange', width: 2 });
          const ratio = Math.abs(polyArea(img)) / (s * s), Jc = Math.abs(G.J([q0[0] + s / 2, q0[1] + s / 2]));
          st = { lhs, rhs, ratio, Jc, mult: G.mult };
        });
        v.readout(() => `$\\int_Y f\\,dm=${v.fix(st.lhs, 4)}$, $\\;\\int_X (f\\circ T)|J_T|\\,dm=${v.fix(st.rhs, 4)}$` + (st.mult > 1 ? ` — twice as large: $T$ covers $Y$ twice.` : ' — equal up to discretisation.') + ` Square: $m(T(Q))/m(Q)=${v.fix(st.ratio, 3)}$, $|J_T|$ at its centre $=${v.fix(st.Jc, 3)}$.`);
      },
    },
  ],
};
