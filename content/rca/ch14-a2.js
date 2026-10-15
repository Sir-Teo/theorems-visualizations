// Rudin, Real and Complex Analysis — Chapter 14 (part 2): the class 𝒮

const TAU = 2 * Math.PI;
// ---- explicit members of 𝒮 (and a few non-members), on plain [re, im] pairs for speed
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const csqrt = (a) => { const m = Math.sqrt(Math.hypot(a[0], a[1])), t = Math.atan2(a[1], a[0]) / 2; return [m * Math.cos(t), m * Math.sin(t)]; };
// The map of U onto the square |Re w| + |Im w| < C:  f(z) = ∫_0^z (1 − w⁴)^{−1/2} dw  (a member of 𝒮).
const SQC = (() => { const c = []; let p = 1; for (let k = 0; k < 500; k++) { c.push(p / (4 * k + 1)); p *= (0.5 + k) / (k + 1); } return c; })();
function squareMap(z) {
  const r = Math.hypot(z[0], z[1]);
  if (r < 0.985) {
    const z2 = cmul(z, z), z4 = cmul(z2, z2); let s = [0, 0];
    for (let k = SQC.length - 1; k >= 0; k--) { s = cmul(s, z4); s[0] += SQC[k]; }
    return cmul(s, z);
  }
  // radial integral with t = 1 − u⁴ (tames the endpoint singularity at the corners)
  let sr = 0, si = 0; const N = 200;
  for (let q = 0; q < N; q++) {
    const u = (q + 0.5) / N, t = 1 - u ** 4, w = 4 * u ** 3 / N;
    const tz = [t * z[0], t * z[1]], t2 = cmul(tz, tz), t4 = cmul(t2, t2);
    const b = [1 - t4[0], -t4[1]], m = Math.pow(Math.hypot(b[0], b[1]), -0.5), a = -0.5 * Math.atan2(b[1], b[0]);
    sr += w * m * Math.cos(a); si += w * m * Math.sin(a);
  }
  return cmul([sr, si], z);
}
const SQ_C = 1.3110287771461; // f(1) = Γ(1/4)Γ(1/2) / (4Γ(3/4))
// Two-slit maps f_t(z) = z/(1 − 2z cos t + z²): t = 0 is the Koebe function.
const slitMap = (c) => (z) => { const z2 = cmul(z, z); return cdiv(z, [1 - 2 * c * z[0] + z2[0], -2 * c * z[1] + z2[1]]); };
const slitDeriv = (c) => (z) => { const z2 = cmul(z, z), q = [1 - 2 * c * z[0] + z2[0], -2 * c * z[1] + z2[1]]; return cdiv([1 - z2[0], -z2[1]], cmul(q, q)); };
// Image of a polar grid of U (circles and radii) under f, as polylines.
function polarImage(f, radii, nRays = 16, rmax = 0.995) {
  const circles = radii.map((r) => Array.from({ length: 361 }, (_, i) => f([r * Math.cos(TAU * i / 360), r * Math.sin(TAU * i / 360)])));
  const rays = Array.from({ length: nRays }, (_, k) => Array.from({ length: 161 }, (_, i) => { const r = rmax * (1 - (1 - i / 160) ** 1.6); return f([r * Math.cos(TAU * k / nRays), r * Math.sin(TAU * k / nRays)]); }));
  return { circles, rays };
}
// Break a polyline where it leaves a huge box (images of points near poles).
function tame(pts, lim = 60) { return pts.map((p) => (p && isFinite(p[0]) && isFinite(p[1]) && Math.hypot(p[0], p[1]) < lim ? p : null)); }
// Number of proper self-intersections of a closed polyline.
function selfCrossings(P) {
  const n = P.length - 1; let cnt = 0;
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = P[i], b = P[i + 1], c = P[j], d = P[j + 1];
    if (cr(a, b, c) * cr(a, b, d) < 0 && cr(c, d, a) * cr(c, d, b) < 0) cnt++;
  }
  return cnt;
}
const supStr = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
const logTicks = (y0, y1) => Array.from({ length: 41 }, (_, i) => i - 20).filter((k) => k >= y0 && k <= y1).map((k) => [k, k === 0 ? '1' : `10${supStr(k)}`]);

export default {
  collection: 'rca',
  chapter: 14,
  items: [
    {
      num: '14.10',
      kind: 'Definition',
      name: 'The class 𝒮 of normalized schlicht functions',
      statement: String.raw`$\mathscr S$ is the class of all $f\in H(U)$ that are one-to-one in $U$ and satisfy $f(0)=0$, $f'(0)=1$. Every $f\in\mathscr S$ therefore has an expansion
$$f(z)=z+\sum_{n=2}^\infty a_nz^n\qquad(z\in U).$$
The **Koebe function** $k(z)=\dfrac{z}{(1-z)^2}=\sum_{n\ge1}nz^n$ belongs to $\mathscr S$; it maps $U$ onto the plane minus the ray $(-\infty,-\tfrac14]$.`,
      idea: String.raw`Any one-to-one $\varphi\in H(U)$ has $\varphi'(0)\ne0$ (10.33), so $(\varphi-\varphi(0))/\varphi'(0)\in\mathscr S$: the normalization only removes the trivial freedom of translating and rotating–scaling the image. By the Riemann mapping theorem, the members of $\mathscr S$ are exactly the normalized Riemann maps of simply connected regions $\ne\C$. Bieberbach conjectured $|a_n|\le n$ (1916), with equality only for rotations of $k$; de Branges proved it in 1984. The chapter proves the case $n=2$.`,
      caption: String.raw`Pick a function: the polar grid of $U$ (left) and its image (middle), the omitted set $\C\setminus f(U)$ in red, and the coefficients $|a_n|$ against de Branges' bound $n$ (right). The Koebe function meets the bound for every $n$. The last choice $z+z^2$ has $f(0)=0$, $f'(0)=1$ but $f'(-\tfrac12)=0$: it is not one-to-one, and the image circles cross themselves.`,
      deps: ['rca-14.7', 'rca-10.33'],
      see: ['rca-14.8'],
      tags: ['univalent functions', 'Koebe function'],
      viz(v) {
        const FN = {
          id: { label: '$z$', f: (z) => z, a: (n) => (n === 1 ? 1 : 0), view: [[-1.4, 1.4], [-1.4, 1.4]] },
          half: { label: '$\\frac{z}{1-z}$', f: (z) => cdiv(z, [1 - z[0], -z[1]]), a: () => 1, view: [[-1.2, 2.4], [-1.8, 1.8]] },
          two: { label: '$\\frac{z}{1-z^2}$', f: (z) => { const q = cmul(z, z); return cdiv(z, [1 - q[0], -q[1]]); }, a: (n) => n % 2, view: [[-1.8, 1.8], [-1.8, 1.8]] },
          koebe: { label: '$\\frac{z}{(1-z)^2}$', f: slitMap(1), a: (n) => n, view: [[-1.3, 1.7], [-1.5, 1.5]] },
          bad: { label: '$z+z^2$ (not in $\\mathscr S$)', f: (z) => { const q = cmul(z, z); return [z[0] + q[0], z[1] + q[1]]; }, a: (n) => (n <= 2 ? 1 : 0), view: [[-1.2, 2.4], [-1.8, 1.8]] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'koebe');
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 270, axes: false, minWidth: 220, title: 'polar grid of $U$' });
        const R = v.stage({ x: [-1.3, 1.7], y: [-1.5, 1.5], equal: true, height: 270, axes: false, minWidth: 220, title: 'its image $f(U)$' });
        const B = v.stage({ x: [0.3, 10.7], y: [0, 11], height: 270, axes: 'box', minWidth: 220, xticks: [1, 2, 4, 6, 8, 10], yticks: [0, 2, 4, 6, 8, 10], title: '$|a_n|$ and the bound $n$' });
        const RADII = [0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 0.98];
        const cache = {};
        let st = null;
        v.render(() => {
          const key = which.value, F = FN[key];
          R.setView(...F.view);
          if (!cache[key]) {
            const G = polarImage(F.f, RADII);
            const outer = Array.from({ length: 721 }, (_, i) => F.f([0.97 * Math.cos(TAU * i / 720), 0.97 * Math.sin(TAU * i / 720)]));
            cache[key] = { G, cross: selfCrossings(outer) };
          }
          const { G, cross } = cache[key];
          // left: the polar grid
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          RADII.forEach((r) => L.circle(0, 0, r, { color: 'teal', width: 1.1, alpha: 0.7 }));
          for (let k = 0; k < 16; k++) L.line(0, 0, 0.995 * Math.cos(TAU * k / 16), 0.995 * Math.sin(TAU * k / 16), { color: 'purple', width: 1, alpha: 0.6 });
          if (key === 'bad') { L.dot(-0.5, 0, { color: 'red', r: 5, label: "f′ = 0", labelPos: 's' }); }
          // middle: images
          const [[x0, x1], [y0, y1]] = [R.bounds.x, R.bounds.y];
          if (key === 'half') R.rect(x0, y0, -0.5, y1, { fill: 'red', fillAlpha: 0.08, stroke: false });
          G.circles.forEach((c) => R.path(tame(c), { color: 'teal', width: 1.1, alpha: 0.75 }));
          G.rays.forEach((c) => R.path(tame(c), { color: 'purple', width: 1, alpha: 0.6 }));
          if (key === 'id') R.circle(0, 0, 1, { color: 'red', width: 2.6 });
          if (key === 'half') R.line(-0.5, y0, -0.5, y1, { color: 'red', width: 2.6 });
          if (key === 'two') { R.line(0, 0.5, 0, y1, { color: 'red', width: 3 }); R.line(0, -0.5, 0, y0, { color: 'red', width: 3 }); }
          if (key === 'koebe') { R.line(x0, 0, -0.25, 0, { color: 'red', width: 3 }); R.dot(-0.25, 0, { color: 'red', r: 4.5, label: '−1/4', labelPos: 'nw' }); }
          if (key === 'bad') { R.dot(-0.25, 0, { color: 'red', r: 5, label: 'f(−½)', labelPos: 'n' }); }
          R.dot(0, 0, { color: 'ink', r: 3.5 });
          // right: coefficients
          B.path([[0.3, 0.3], [10.7, 10.7]], { color: 'green', width: 2, dash: [6, 4] });
          B.bars(Array.from({ length: 10 }, (_, i) => F.a(i + 1)), { x0: 1, color: (y, i) => (y > i + 1 + 1e-9 ? 'red' : 'accent'), fillAlpha: 0.75 });
          B.text('|aₙ| = n', 7.6, 9.6, { color: 'green', size: 12, weight: 600, align: 'right' });
          st = { key, cross };
          v.legend([['teal', 'circles $|z|=r$'], ['purple', 'radii'], ['red', 'omitted set $\\C\\setminus f(U)$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const txt = {
            id: 'The identity: $f(U)=U$, all $a_n=0$ for $n\\ge2$.',
            half: '$\\frac{z}{1-z}=\\sum z^n$ maps $U$ onto the half-plane $\\Re w>-\\frac12$; $|a_n|=1\\le n$.',
            two: '$\\frac{z}{1-z^2}=z+z^3+z^5+\\cdots$ is odd and omits two rays of the imaginary axis.',
            koebe: '$k(z)=\\sum nz^n$ attains $|a_n|=n$ for every $n$ and omits $(-\\infty,-\\frac14]$ — the extremal member of $\\mathscr S$.',
            bad: '$f(0)=0$ and $f\'(0)=1$, but $f(z)=f(-1-z)$: e.g. $f(-\\frac12+t)=f(-\\frac12-t)$, so $f$ is not one-to-one in $U$.',
          }[s.key];
          return `${txt} Image of $|z|=0.97$: ${s.cross ? `${s.cross} self-crossing${s.cross === 1 ? '' : 's'}` : 'a simple closed curve'}.`;
        });
      },
    },
    {
      num: '14.11',
      kind: 'Theorem',
      name: 'Odd square-root transform: g(z)² = f(z²)',
      verify: true,
      statement: String.raw`If $f\in\mathscr S$, there is a function $g\in\mathscr S$ with
$$g(z)^2=f(z^2)\qquad(z\in U).$$
This $g$ is odd: $g(-z)=-g(z)$.`,
      idea: String.raw`Since $f$ is one-to-one with $f(0)=0$, $f(z)\ne0$ for $z\ne0$, so $h(z)=f(z)/z$ has no zero in $U$ and $h(0)=1$. In the simply connected disc $h$ has a holomorphic square root $\varphi$ with $\varphi(0)=1$ (13.11); put $g(z)=z\,\varphi(z^2)$. Then $g^2(z)=z^2h(z^2)=f(z^2)$, $g(0)=0$, $g'(0)=1$, and $g$ is odd. If $g(z_1)=g(z_2)$ then $f(z_1^2)=f(z_2^2)$, so $z_1=\pm z_2$; and $z_1=-z_2$ would give $g(z_1)=-g(z_1)=0$, i.e. $z_1=0$. Hence $g$ is one-to-one.`,
      caption: String.raw`Drag $z$ (its mirror $-z$ follows). Left: $U$; middle: $f(U)$ with the point $f(z^2)$; right: $g(U)$ with $g(z)$ and $g(-z)=-g(z)$, whose common square is $f(z^2)$. $g(U)$ is symmetric under $w\mapsto-w$, and the squaring map folds it onto $f(U)$. For the Koebe function, $g(z)=\frac{z}{1-z^2}$.`,
      deps: ['rca-14.10', 'rca-13.11'],
      tags: ['univalent functions', 'square root'],
      viz(v) {
        // g(z) = z √(h(z²)), h(w) = f(w)/w; for these f, Re h > 0 on U, so the principal root is the holomorphic one
        const FN = {
          koebe: { label: '$\\frac{z}{(1-z)^2}$', f: slitMap(1), view: [[-2.4, 2.4], [-2.2, 2.2]], gview: [[-2.4, 2.4], [-2.2, 2.2]] },
          half: { label: '$\\frac{z}{1-z}$', f: (z) => cdiv(z, [1 - z[0], -z[1]]), view: [[-1.4, 3.4], [-2.4, 2.4]], gview: [[-2.4, 2.4], [-2.4, 2.4]] },
          cub: { label: '$z+\\frac{z^2}{2}$', f: (z) => { const q = cmul(z, z); return [z[0] + q[0] / 2, z[1] + q[1] / 2]; }, view: [[-1.1, 1.9], [-1.5, 1.5]], gview: [[-1.5, 1.5], [-1.5, 1.5]] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'koebe');
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 260, axes: false, minWidth: 220, title: '$U$' });
        const M = v.stage({ x: [-2.4, 2.4], y: [-2.2, 2.2], equal: true, height: 260, axes: false, minWidth: 220, title: '$f(U)$' });
        const R = v.stage({ x: [-2.4, 2.4], y: [-2.2, 2.2], equal: true, height: 260, axes: false, minWidth: 220, title: '$g(U)$, $\\;g(z)^2=f(z^2)$' });
        const zh = L.handle(0.45, 0.4, { color: 'gold', label: 'z', labelPos: 'ne', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 0.9 ? [x * 0.9 / m, y * 0.9 / m] : [x, y]; } });
        const RADII = [0.3, 0.5, 0.7, 0.85, 0.95];
        const cache = {};
        let st = null;
        v.render(() => {
          const key = which.value, F = FN[key], f = F.f;
          const g = (z) => { const z2 = cmul(z, z); if (Math.hypot(z2[0], z2[1]) < 1e-14) return z; const h = cdiv(f(z2), z2); return cmul(z, csqrt(h)); };
          M.setView(...F.view); R.setView(...F.gview);
          if (!cache[key]) cache[key] = { Gf: polarImage(f, RADII), Gg: polarImage(g, RADII) };
          const { Gf, Gg } = cache[key];
          L.circle(0, 0, 1, { color: 'ink', width: 1.5 });
          RADII.forEach((r) => L.circle(0, 0, r, { color: 'teal', width: 1, alpha: 0.6 }));
          for (let k = 0; k < 16; k++) L.line(0, 0, Math.cos(TAU * k / 16), Math.sin(TAU * k / 16), { color: 'purple', width: 1, alpha: 0.5 });
          for (const [S, G] of [[M, Gf], [R, Gg]]) { G.circles.forEach((c) => S.path(tame(c), { color: 'teal', width: 1, alpha: 0.7 })); G.rays.forEach((c) => S.path(tame(c), { color: 'purple', width: 1, alpha: 0.55 })); }
          if (key === 'koebe') {
            M.line(M.bounds.x[0], 0, -0.25, 0, { color: 'red', width: 3 });
            R.line(0, 0.5, 0, R.bounds.y[1], { color: 'red', width: 3 }); R.line(0, -0.5, 0, R.bounds.y[0], { color: 'red', width: 3 });
          }
          const z = [zh.x, zh.y], mz = [-z[0], -z[1]], z2 = cmul(z, z);
          L.dot(mz[0], mz[1], { color: 'orange', r: 6, label: '−z', labelPos: 'sw' });
          L.dot(z2[0], z2[1], { color: 'ink', r: 4.5, label: 'z²', labelPos: 'e' });
          const fz2 = f(z2), gz = g(z), gmz = g(mz);
          M.dot(fz2[0], fz2[1], { color: 'ink', r: 6, label: 'f(z²)', labelPos: 'ne' });
          R.line(gz[0], gz[1], gmz[0], gmz[1], { color: 'muted', width: 1.2, dash: [4, 4] });
          R.dot(0, 0, { color: 'muted', r: 3 });
          R.dot(gz[0], gz[1], { color: 'gold', r: 6, label: 'g(z)', labelPos: 'ne' });
          R.dot(gmz[0], gmz[1], { color: 'orange', r: 6, label: 'g(−z)', labelPos: 'sw' });
          const sq = cmul(gz, gz), sqm = cmul(gmz, gmz);
          st = { err: Math.max(Math.hypot(sq[0] - fz2[0], sq[1] - fz2[1]), Math.hypot(sqm[0] - fz2[0], sqm[1] - fz2[1])), odd: Math.hypot(gz[0] + gmz[0], gz[1] + gmz[1]), gz };
          v.legend([['gold', '$z$ and $g(z)$', { dot: true }], ['orange', '$-z$ and $g(-z)$', { dot: true }], ['ink', '$z^2$ and $f(z^2)$', { dot: true }]].concat(key === 'koebe' ? [['red', 'omitted sets']] : []));
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$g(z) = ${v.fix(s.gz[0], 3)}${s.gz[1] < 0 ? '-' : '+'}${v.fix(Math.abs(s.gz[1]), 3)}\\,i$; $\\;\\max|g(\\pm z)^2-f(z^2)| = ${v.sci(s.err, 2)}$, $\\;|g(z)+g(-z)| = ${v.sci(s.odd, 2)}$ — $g$ is odd, and one-to-one because $f$ is.`;
        });
      },
    },
    {
      num: '14.12',
      kind: 'Theorem',
      name: 'The area theorem',
      credit: 'Gronwall, 1914',
      verify: true,
      statement: String.raw`Let $V=\{\zeta:|\zeta|>1\}$ and let $F\in H(V)$ be one-to-one in $V$, with
$$F(\zeta)=\zeta+\sum_{n=0}^\infty\alpha_n\zeta^{-n}\qquad(\zeta\in V).$$
Then $\displaystyle\sum_{n=1}^\infty n|\alpha_n|^2\le1$.`,
      idea: String.raw`For $r>1$ the image $\Gamma_r=F(\{|\zeta|=r\})$ is a Jordan curve (as $F$ is one-to-one), traversed positively, and the bounded region it encloses is the complement of $F(\{|\zeta|>r\})$; its area is nonnegative. Computing that area as $\frac1{2i}\int_{\Gamma_r}\bar w\,dw$ and expanding in Fourier series (orthogonality of $e^{in\theta}$, as in 10.22) gives exactly $\pi\big(r^2-\sum n|\alpha_n|^2r^{-2n}\big)\ge0$. Let $r\downarrow1$.`,
      caption: String.raw`Drag the coefficients $\alpha_1$ (blue) and $\alpha_2$ (orange) of $F(\zeta)=\zeta+\alpha_1/\zeta+\alpha_2/\zeta^2$. Middle: the curves $\Gamma_r=F(|\zeta|=r)$; the thick one is $r=1.02$. Right: the signed area enclosed by $\Gamma_r$, measured by the shoelace formula (dots), against $\pi(r^2-\sum n|\alpha_n|^2r^{-2n})$. When $|\alpha_1|^2+2|\alpha_2|^2>1$ the area becomes negative near $r=1$ — impossible for a Jordan curve, and indeed $\Gamma_r$ crosses itself: $F$ is not one-to-one.`,
      deps: ['rca-10.22', 'rca-7.26'],
      tags: ['univalent functions', 'area theorem'],
      viz(v) {
        const C = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 270, axes: true, minWidth: 220, title: 'coefficients $\\alpha_1,\\alpha_2$' });
        const R = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 270, axes: false, minWidth: 220, title: '$\\Gamma_r=F(\\{|\\zeta|=r\\})$' });
        const P = v.stage({ x: [1, 2], y: [-3, 12], height: 270, axes: 'box', minWidth: 220, xlabel: 'r', title: 'area enclosed by $\\Gamma_r$' });
        const a1 = C.handle(0.6, 0.25, { color: 'blue', label: 'α₁', labelPos: 'ne', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 1.2 ? [x * 1.2 / m, y * 1.2 / m] : [x, y]; } });
        const a2 = C.handle(0.12, -0.1, { color: 'orange', label: 'α₂', labelPos: 'sw', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 1.2 ? [x * 1.2 / m, y * 1.2 / m] : [x, y]; } });
        const RS = [1.02, 1.15, 1.35, 1.6, 1.9];
        let st = null;
        v.render(() => {
          const A1 = [a1.x, a1.y], A2 = [a2.x, a2.y];
          const S = A1[0] ** 2 + A1[1] ** 2 + 2 * (A2[0] ** 2 + A2[1] ** 2);
          const F = (z) => { const iz = cdiv([1, 0], z), iz2 = cmul(iz, iz), t1 = cmul(A1, iz), t2 = cmul(A2, iz2); return [z[0] + t1[0] + t2[0], z[1] + t1[1] + t2[1]]; };
          // coefficient plane: |α1| ≤ 1 when α2 = 0, |α2| ≤ 1/√2 when α1 = 0
          C.circle(0, 0, 1, { color: 'blue', width: 1.4, dash: [5, 4], fill: 'blue', fillAlpha: 0.05 });
          C.circle(0, 0, Math.SQRT1_2, { color: 'orange', width: 1.4, dash: [5, 4] });
          C.corner(`Σ n|αₙ|² = ${v.fix(S, 3)}`, 'tl', { color: S <= 1 ? 'green' : 'red', weight: 600 });
          // image curves
          const curve = (r) => Array.from({ length: 721 }, (_, i) => F([r * Math.cos(TAU * i / 720), r * Math.sin(TAU * i / 720)]));
          const shoelace = (P) => { let a = 0; for (let i = 0; i + 1 < P.length; i++) a += P[i][0] * P[i + 1][1] - P[i + 1][0] * P[i][1]; return a / 2; };
          const curves = RS.map(curve);
          curves.forEach((c, k) => R.path(c, { color: k ? 'muted' : (S <= 1 ? 'accent' : 'red'), width: k ? 1.1 : 2.6, alpha: k ? 0.7 : 1 }));
          const cross = selfCrossings(curves[0]);
          // region inside Γ_{1.02}, shaded by the even–odd rule
          R.rings([curves[0]], { fill: S <= 1 ? 'accent' : 'red', fillAlpha: 0.14, stroke: false, evenodd: true });
          R.dot(0, 0, { color: 'muted', r: 2.5 });
          // area plot
          const A = (r) => Math.PI * (r * r - (A1[0] ** 2 + A1[1] ** 2) / r ** 2 - 2 * (A2[0] ** 2 + A2[1] ** 2) / r ** 4);
          const rs = Array.from({ length: 101 }, (_, i) => 1 + i / 100);
          const hi = A(2) * 1.08, lo = Math.min(-0.2 * hi, A(1) * 1.15);
          P.setView(null, [lo, hi]);
          P.hband(lo, 0, { color: 'red', alpha: 0.08 });
          P.hline(0, { color: 'ink', width: 1 });
          P.path(rs.map((r) => [r, A(r)]), { color: 'green', width: 2.4 });
          const meas = [1.02, 1.1, 1.2, 1.35, 1.5, 1.7, 1.9].map((r) => [r, shoelace(curve(r))]);
          P.dots(meas, { color: 'accent', r: 4 });
          P.text('negative: impossible for a Jordan curve', 1.97, lo * 0.3, { color: 'red', size: 11.5, align: 'right', weight: 600 });
          st = { S, A1: A(1), cross, m: meas[0][1], f: A(1.02) };
          v.legend([['green', '$\\pi(r^2-\\sum n|\\alpha_n|^2r^{-2n})$'], ['accent', 'shoelace area of $\\Gamma_r$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$\\sum n|\\alpha_n|^2 = ${v.fix(s.S, 3)}$; area at $r=1.02$: shoelace $${v.fix(s.m, 4)}$, formula $${v.fix(s.f, 4)}$.`;
          return s.S <= 1 ? `${head} The limit area $\\pi(1-\\sum n|\\alpha_n|^2)=${v.fix(s.A1, 3)}\\ge0$, as the theorem requires${s.cross ? ` (but $\\Gamma_{1.02}$ has ${s.cross} self-crossing${s.cross === 1 ? '' : 's'}: the condition is necessary, not sufficient)` : ''}.`
            : `${head} The sum exceeds $1$, so no such $F$ is one-to-one: $\\Gamma_{1.02}$ has ${s.cross} self-crossing${s.cross === 1 ? '' : 's'}.`;
        });
      },
    },
    {
      num: '14.13',
      kind: 'Theorem',
      name: "|a₂| ≤ 2 and Koebe's one-quarter theorem",
      credit: 'Bieberbach, 1916',
      verify: true,
      statement: String.raw`If $f\in\mathscr S$ and $f(z)=z+\sum_{n\ge2}a_nz^n$, then
(a) $|a_2|\le2$, and
(b) $f(U)\supset D(0;\tfrac14)$: every $w$ with $|w|<\tfrac14$ is a value of $f$.`,
      idea: String.raw`(a) Take the odd root $g\in\mathscr S$ of 14.11, $g(z)=z+\tfrac12a_2z^3+\cdots$, and put $F(\zeta)=1/g(1/\zeta)=\zeta-\tfrac12a_2\zeta^{-1}+\cdots$ on $|\zeta|>1$. $F$ is one-to-one, so the area theorem 14.12 gives $|\tfrac12a_2|^2\le1$. (b) If $w\notin f(U)$, then $h=\frac{wf}{w-f}$ is one-to-one (a Möbius map of $f$), holomorphic, normalized, and $h(z)=z+(a_2+\frac1w)z^2+\cdots$, so $h\in\mathscr S$. By (a), $|\tfrac1w|\le|a_2|+|a_2+\tfrac1w|\le4$. The Koebe function, which omits $-\tfrac14$, shows both constants are sharp.`,
      caption: String.raw`Choose $f\in\mathscr S$ (for the two-slit maps $\frac{z}{1-2z\cos t+z^2}$ move $t$). Left: $f(U)$ with its omitted set in red and the disc $|w|<\frac14$ in green — it always fits. Drag the omitted value $w$ (it stays in the red set). Right: the coefficient plane; $a_2$ and the second coefficient $a_2+\frac1w$ of $h=\frac{wf}{w-f}\in\mathscr S$ both lie in $|c|\le2$, so the gap $|\frac1w|$ is at most $4$.`,
      deps: ['rca-14.10', 'rca-14.11', 'rca-14.12'],
      tags: ['univalent functions', 'Koebe quarter theorem', 'Bieberbach'],
      viz(v) {
        const which = v.select('$f$', [{ value: 'slit', label: 'two slits $\\frac{z}{1-2z\\cos t+z^2}$' }, { value: 'sq', label: 'square map' }, { value: 'card', label: '$z+\\frac{z^2}{2}$' }], 'slit');
        const tS = v.slider('$t$', 0, Math.PI, 0.9, { step: 0.01 });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.4, 1.4], equal: true, height: 320, axes: false, title: '$f(U)$, its omitted set, and $D(0;\\frac14)$' });
        const Rt = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 320, axes: false, title: 'second coefficients: $a_2$ and $a_2+\\frac1w$' });
        // constrain the omitted value to the complement of f(U)
        const cardB = Array.from({ length: 721 }, (_, i) => { const t = TAU * i / 720; return [Math.cos(t) + Math.cos(2 * t) / 2, Math.sin(t) + Math.sin(2 * t) / 2]; });
        const inCard = (x, y) => { let wn = 0; for (let i = 0; i < 720; i++) { const a = Math.atan2(cardB[i][1] - y, cardB[i][0] - x), b = Math.atan2(cardB[i + 1][1] - y, cardB[i + 1][0] - x); let d = b - a; d -= TAU * Math.round(d / TAU); wn += d; } return Math.abs(wn) > Math.PI; };
        const project = (x, y) => {
          const key = which.value;
          if (key === 'slit') {
            const c = Math.cos(tS.value), l = -1 / (2 + 2 * c), r = c < 1 - 1e-9 ? 1 / (2 - 2 * c) : Infinity;
            if (x < 0 && isFinite(l)) return [Math.min(x, l), 0];
            if (isFinite(r)) return [Math.max(x, r), 0];
            return [Math.min(x, l), 0];
          }
          if (key === 'sq') { const s = Math.abs(x) + Math.abs(y); if (s >= SQ_C) return [x, y]; const k = SQ_C / Math.max(s, 1e-6); return [x * k, y * k]; }
          if (!inCard(x, y)) return [x, y];
          let lo = 1, hi = 4; const m = Math.hypot(x, y) || 1e-6; if (m < 1e-6) { x = 1e-3; }
          for (let q = 0; q < 30; q++) { const md = (lo + hi) / 2; if (inCard(x * md, y * md)) lo = md; else hi = md; }
          return [x * hi, y * hi];
        };
        const w = L.handle(-0.6, 0, { color: 'orange', label: 'w', labelPos: 'n', constrain: (x, y) => project(x, y) });
        let st = null, last = null;
        v.render(() => {
          const key = which.value; tS.el.hidden = key !== 'slit';
          const c = Math.cos(tS.value);
          let f, a2, dist, near = [];
          if (key === 'slit') { f = slitMap(c); a2 = [2 * c, 0]; const l = 1 / (2 + 2 * c), r = c < 1 - 1e-9 ? 1 / (2 - 2 * c) : Infinity; dist = Math.min(l, r); if (l <= r) near.push([-l, 0]); if (r <= l) near.push([r, 0]); L.setView([-1.7, 1.7], [-1.4, 1.4]); }
          else if (key === 'sq') { f = squareMap; a2 = [0, 0]; dist = SQ_C / Math.SQRT2; near = [[dist / Math.SQRT2, dist / Math.SQRT2], [-dist / Math.SQRT2, dist / Math.SQRT2], [-dist / Math.SQRT2, -dist / Math.SQRT2], [dist / Math.SQRT2, -dist / Math.SQRT2]]; L.setView([-1.7, 1.7], [-1.4, 1.4]); }
          else { f = (z) => { const q = cmul(z, z); return [z[0] + q[0] / 2, z[1] + q[1] / 2]; }; a2 = [0.5, 0]; dist = 0.5; near = [[-0.5, 0]]; L.setView([-1.5, 2.1], [-1.6, 1.6]); }
          if (last !== key + tS.value) { last = key + tS.value; const p = project(w.x, w.y); w.x = p[0]; w.y = p[1]; }
          const [[x0, x1], [y0, y1]] = [L.bounds.x, L.bounds.y];
          // omitted set
          if (key === 'slit') {
            const l = -1 / (2 + 2 * c), r = c < 1 - 1e-9 ? 1 / (2 - 2 * c) : Infinity;
            if (isFinite(l)) L.line(x0, 0, l, 0, { color: 'red', width: 3.2 });
            if (isFinite(r)) L.line(r, 0, x1, 0, { color: 'red', width: 3.2 });
          } else if (key === 'sq') {
            L.rect(x0, y0, x1, y1, { fill: 'red', fillAlpha: 0.1, stroke: false });
            L.poly([[SQ_C, 0], [0, SQ_C], [-SQ_C, 0], [0, -SQ_C]], { fill: 'panel', fillAlpha: 1, color: 'red', width: 2.4 });
          } else {
            L.rect(x0, y0, x1, y1, { fill: 'red', fillAlpha: 0.1, stroke: false });
            L.poly(cardB, { fill: 'panel', fillAlpha: 1, color: 'red', width: 2.4 });
          }
          const G = polarImage(f, [0.25, 0.5, 0.7, 0.85, 0.95], 16, key === 'sq' ? 0.985 : 0.995);
          G.circles.forEach((q) => L.path(tame(q, 40), { color: 'teal', width: 1, alpha: 0.6 }));
          G.rays.forEach((q) => L.path(tame(q, 40), { color: 'purple', width: 1, alpha: 0.5 }));
          L.circle(0, 0, 0.25, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.25 });
          L.circle(0, 0, dist, { color: 'green', width: 1.4, dash: [5, 4] });
          near.forEach((p) => L.dot(p[0], p[1], { color: 'red', r: 4.5 }));
          L.dot(0, 0, { color: 'ink', r: 3 });
          // coefficient plane
          const iw = cdiv([1, 0], [w.x, w.y]), b2 = [a2[0] + iw[0], a2[1] + iw[1]];
          Rt.circle(0, 0, 2, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.08 });
          Rt.tex('|c|\\le 2', 1.45, 1.75, { color: 'green', size: 14 });
          Rt.arrow(a2[0], a2[1], b2[0], b2[1], { color: 'orange', width: 2 });
          const nx = -(b2[1] - a2[1]), ny = b2[0] - a2[0], nl = Math.hypot(nx, ny) || 1;
          Rt.tex('1/w', (a2[0] + b2[0]) / 2 + 0.22 * nx / nl, (a2[1] + b2[1]) / 2 + 0.22 * ny / nl, { color: 'orange', size: 14 });
          const out = (p) => { const m = Math.hypot(p[0], p[1]); return m < 1e-6 ? 'se' : (p[1] >= 0 ? 'n' : 's') + (p[0] >= 0 ? 'e' : 'w'); };
          Rt.dot(a2[0], a2[1], { color: 'accent', r: 6, label: 'a₂(f)', labelPos: out([a2[0] - b2[0], a2[1] - b2[1]]) });
          Rt.dot(b2[0], b2[1], { color: 'orange', r: 6, label: 'a₂(h)', labelPos: out([b2[0] - a2[0], b2[1] - a2[1]]) });
          st = { a2: Math.hypot(a2[0], a2[1]), dist, iw: Math.hypot(iw[0], iw[1]), b2: Math.hypot(b2[0], b2[1]) };
          v.legend([['red', 'omitted set $\\C\\setminus f(U)$'], ['green', '$D(0;\\frac14)$ and the largest disc in $f(U)$', { area: true }], ['orange', 'omitted value $w$; $a_2(h)=a_2+\\frac1w$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$|a_2| = ${v.fix(s.a2, 3)}\\le2$, $\\;|a_2(h)| = ${v.fix(s.b2, 3)}\\le2$, so $|\\frac1w| = ${v.fix(s.iw, 3)}\\le4$. The omitted set stays at distance $${v.fix(s.dist, 4)}\\ge\\frac14$ from $0$ (equality only for rotations of the Koebe function: $t=0$ or $t=\\pi$).`;
        });
      },
    },
    {
      num: '14.14',
      kind: 'Theorem',
      name: 'Growth and distortion bounds on 𝒮',
      verify: true,
      statement: String.raw`If $f\in\mathscr S$ and $|z|=r<1$, then
$$\frac{r}{(1+r)^2}\le|f(z)|\le\frac{r}{(1-r)^2},\qquad \frac{1-r}{(1+r)^3}\le|f'(z)|\le\frac{1+r}{(1-r)^3}.$$
In particular $\mathscr S$ is uniformly bounded on each compact subset of $U$.`,
      idea: String.raw`Compose $f$ with a disc automorphism: for $a\in U$ the normalized function $\big(f(\varphi(z))-f(a)\big)/\big((1-|a|^2)f'(a)\big)$, $\varphi(z)=\frac{z+a}{1+\bar az}$, is again in $\mathscr S$. Its second coefficient is $\frac12(1-|a|^2)\frac{f''(a)}{f'(a)}-\bar a$, so $|a_2|\le2$ (14.13) gives $\big|z\frac{f''(z)}{f'(z)}-\frac{2|z|^2}{1-|z|^2}\big|\le\frac{4|z|}{1-|z|^2}$. Integrating this along radii bounds $\log|f'|$, which gives the distortion estimate; integrating $|f'|$ gives the upper growth bound, and the lower one follows from the quarter theorem. The Koebe function attains all four bounds.`,
      caption: String.raw`Pick $f\in\mathscr S$ and drag the radius $r$. Left: the image of the circle $|z|=r$ (thick) must lie in the green annulus $\frac{r}{(1+r)^2}\le|w|\le\frac{r}{(1-r)^2}$. Right: $\max$ and $\min$ of $|f|$ (or $|f'|$) on $|z|=r$, computed on 720 points, inside the band between the bounds (log scale). The Koebe function touches both edges, along $z>0$ and $z<0$.`,
      deps: ['rca-14.13', 'rca-12.4'],
      see: ['rca-14.15'],
      tags: ['univalent functions', 'distortion'],
      viz(v) {
        const FN = {
          koebe: { label: 'Koebe', f: slitMap(1), d: slitDeriv(1) },
          slit: { label: '$t=\\frac\\pi3$', f: slitMap(0.5), d: slitDeriv(0.5) },
          half: { label: '$\\frac{z}{1-z}$', f: (z) => cdiv(z, [1 - z[0], -z[1]]), d: (z) => { const q = [1 - z[0], -z[1]]; return cdiv([1, 0], cmul(q, q)); } },
          sq: { label: 'square', f: squareMap, d: (z) => { const z2 = cmul(z, z), z4 = cmul(z2, z2); const b = csqrt([1 - z4[0], -z4[1]]); return cdiv([1, 0], b); } },
          card: { label: '$z+\\frac{z^2}{2}$', f: (z) => { const q = cmul(z, z); return [z[0] + q[0] / 2, z[1] + q[1] / 2]; }, d: (z) => [1 + z[0], z[1]] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'koebe');
        const mode = v.select('plot', [{ value: 'f', label: '$|f|$' }, { value: 'd', label: "$|f'|$" }], 'f');
        const rS = v.slider('$r$', 0.05, 0.9, 0.55, { step: 0.01 });
        const L = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 320, axes: false, title: '$f(\\{|z|=r\\})$ inside the growth annulus' });
        const P = v.stage({ x: [0, 0.92], y: [-1.5, 2], height: 320, axes: 'box', xlabel: 'r', title: 'max / min over $|z|=r$ (log scale)' });
        let st = null;
        v.render(() => {
          const F = FN[which.value], r = rS.value, m = mode.value;
          const lo = r / (1 + r) ** 2, hi = r / (1 - r) ** 2;
          const R = Math.max(1, hi * 1.15);
          L.setView([-R, R], [-R, R]);
          // annulus
          L.circle(0, 0, hi, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.12 });
          L.circle(0, 0, lo, { color: 'green', width: 1.6, fill: 'panel', fillAlpha: 1 });
          const G = polarImage(F.f, [0.3, 0.6, 0.8, 0.9], 12, 0.95);
          G.circles.forEach((q) => L.path(tame(q, 3 * R), { color: 'teal', width: 1, alpha: 0.45 }));
          G.rays.forEach((q) => L.path(tame(q, 3 * R), { color: 'purple', width: 1, alpha: 0.4 }));
          const img = Array.from({ length: 721 }, (_, i) => F.f([r * Math.cos(TAU * i / 720), r * Math.sin(TAU * i / 720)]));
          L.path(img, { color: 'accent', width: 2.8 });
          let iMax = 0, iMin = 0; img.forEach((p, i) => { const a = Math.hypot(p[0], p[1]); if (a > Math.hypot(img[iMax][0], img[iMax][1])) iMax = i; if (a < Math.hypot(img[iMin][0], img[iMin][1])) iMin = i; });
          L.dot(img[iMax][0], img[iMax][1], { color: 'red', r: 5 }); L.dot(img[iMin][0], img[iMin][1], { color: 'orange', r: 5 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // profile over r
          const rs = Array.from({ length: 90 }, (_, i) => 0.01 + 0.9 * i / 89);
          const ext = (rr) => { let mx = 0, mn = Infinity; for (let i = 0; i < 720; i++) { const z = [rr * Math.cos(TAU * i / 720), rr * Math.sin(TAU * i / 720)]; const w = m === 'f' ? F.f(z) : F.d(z); const a = Math.hypot(w[0], w[1]); mx = Math.max(mx, a); mn = Math.min(mn, a); } return [mx, mn]; };
          const up = (rr) => (m === 'f' ? rr / (1 - rr) ** 2 : (1 + rr) / (1 - rr) ** 3), dn = (rr) => (m === 'f' ? rr / (1 + rr) ** 2 : (1 - rr) / (1 + rr) ** 3);
          const lg = Math.log10;
          const y0 = Math.floor(lg(dn(0.9)) - 0.3), y1 = Math.ceil(lg(up(0.9)) + 0.1);
          const yy0 = m === 'f' ? -2.2 : y0;
          P.setView(null, [yy0, y1]); P.setTicks(null, logTicks(yy0, y1));
          P.between((x) => lg(up(x)), (x) => lg(dn(x)), 0.01, 0.92, { fill: 'green', fillAlpha: 0.12 });
          P.fn((x) => lg(up(x)), { domain: [0.01, 0.92], color: 'green', width: 1.8 });
          P.fn((x) => lg(dn(x)), { domain: [0.01, 0.92], color: 'green', width: 1.8 });
          const E = rs.map(ext);
          P.path(rs.map((x, i) => [x, lg(E[i][0])]), { color: 'red', width: 2.2 });
          P.path(rs.map((x, i) => [x, lg(E[i][1])]), { color: 'orange', width: 2.2 });
          P.vline(r, { color: 'accent', width: 1.2, dash: [4, 4] });
          const e = ext(r);
          st = { r, lo, hi, mx: Math.hypot(img[iMax][0], img[iMax][1]), mn: Math.hypot(img[iMin][0], img[iMin][1]), m, e, up: up(r), dn: dn(r) };
          v.legend([['green', 'Koebe bounds', { area: true }], ['red', 'max over $|z|=r$'], ['orange', 'min over $|z|=r$'], ['accent', 'image of $|z|=r$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return s.m === 'f'
            ? `On $|z|=${v.fix(s.r, 2)}$: $\\;${v.fix(s.lo, 4)}\\le\\min|f| = ${v.fix(s.mn, 4)}\\le\\max|f| = ${v.fix(s.mx, 4)}\\le${v.fix(s.hi, 4)}$.`
            : `On $|z|=${v.fix(s.r, 2)}$: $\\;${v.fix(s.dn, 4)}\\le\\min|f'| = ${v.fix(s.e[1], 4)}\\le\\max|f'| = ${v.fix(s.e[0], 4)}\\le${v.fix(s.up, 4)}$.`;
        });
      },
    },
    {
      num: '14.15',
      kind: 'Theorem',
      name: '𝒮 is compact',
      verify: true,
      statement: String.raw`$\mathscr S$ is a compact subset of $H(U)$ (topology of uniform convergence on compact sets): every sequence in $\mathscr S$ has a subsequence converging uniformly on compact subsets of $U$, and every such limit belongs to $\mathscr S$.`,
      idea: String.raw`By the growth bound $|f(z)|\le|z|(1-|z|)^{-2}$ (14.14), $\mathscr S$ is uniformly bounded on compact sets, hence normal by Montel (14.6). If $f_n\to f$ locally uniformly, then $f(0)=0$ and $f'(0)=\lim f_n'(0)=1$ (10.28), so $f$ is not constant; a locally uniform limit of one-to-one holomorphic functions is either constant or one-to-one (argument principle / Hurwitz, as in the proof of 14.8). So $f\in\mathscr S$. The normalization $f'(0)=1$ is what prevents both escape to $\infty$ and collapse to a constant.`,
      caption: String.raw`Choose a sequence and move along it. Left: images of the circle $|z|=\frac12$ under $f_1,\dots,f_n$ (older ones fainter), the limit (green) and the growth bound of 14.14 (dashed). Right: $\sup_{|z|\le1/2}|f_n-f|$ (log scale). Two-slit maps converge to the Koebe function; $z+a_nz^2$ with $|a_n|\uparrow\frac12$ converge to $z+\frac12z^2$, still in $\mathscr S$. Dropping the normalization breaks compactness: $z/n$ collapses to the constant $0$, and $nz$ has no convergent subsequence.`,
      deps: ['rca-14.14', 'rca-14.6', 'rca-10.28'],
      see: ['fa-1.45'],
      tags: ['univalent functions', 'compactness', 'normal families'],
      viz(v) {
        const NMAX = 40, RHO = 0.5;
        const SEQ = {
          slit: { label: 'two-slit $\\to$ Koebe', f: (n) => slitMap(Math.cos(Math.PI / (n + 1))), lim: slitMap(1), inS: true, view: [[-1.1, 2.5], [-1.8, 1.8]] },
          poly: { label: '$z+a_nz^2\\to z+\\frac{z^2}{2}$', f: (n) => { const a = 0.5 * (1 - 1 / (n + 1)), ph = 2.2 / (n + 1); return (z) => { const q = cmul(z, z), c = [a * Math.cos(ph), a * Math.sin(ph)], t = cmul(c, q); return [z[0] + t[0], z[1] + t[1]]; }; }, lim: (z) => { const q = cmul(z, z); return [z[0] + q[0] / 2, z[1] + q[1] / 2]; }, inS: true, view: [[-1, 1], [-1, 1]] },
          shrink: { label: "$z/n$ ($f'(0)=\\frac1n$)", f: (n) => (z) => [z[0] / n, z[1] / n], lim: () => [0, 0], inS: false, view: [[-0.6, 0.6], [-0.6, 0.6]] },
          grow: { label: "$nz$ ($f'(0)=n$)", f: (n) => (z) => [z[0] * n, z[1] * n], lim: null, inS: false, view: null },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'slit');
        const nS = v.slider('$n$', 1, NMAX, 12, { int: true });
        const L = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, height: 310, axes: false, title: 'images of $|z|=\\frac12$ under $f_1,\\dots,f_n$' });
        const P = v.stage({ x: [0.5, NMAX + 0.5], y: [-4, 1], height: 310, axes: 'box', xlabel: 'n', title: '$\\sup_{|z|\\le1/2}|f_n-f|$ (log scale)' });
        const circ = (f) => Array.from({ length: 241 }, (_, i) => f([RHO * Math.cos(TAU * i / 240), RHO * Math.sin(TAU * i / 240)]));
        let st = null;
        v.render(() => {
          const key = which.value, S = SEQ[key], n = nS.value;
          if (S.view) L.setView(...S.view); else { const V = Math.max(1.2, n * RHO * 1.15); L.setView([-V, V], [-V, V]); }
          const bound = RHO / (1 - RHO) ** 2;
          if (S.inS) L.circle(0, 0, bound, { color: 'muted', width: 1.4, dash: [5, 4] });
          for (let k = 1; k <= n; k++) L.path(circ(S.f(k)), { color: 'accent', width: k === n ? 2.6 : 1, alpha: k === n ? 1 : 0.15 + 0.5 * k / n });
          if (S.lim) { const c = circ(S.lim); if (key === 'shrink') L.dot(0, 0, { color: 'green', r: 6, label: 'limit 0', labelPos: 'ne' }); else L.path(c, { color: 'green', width: 2.2, dash: [6, 4] }); }
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          // distances
          const lg = (x) => Math.log10(Math.max(x, 1e-12));
          const ds = Array.from({ length: NMAX }, (_, i) => { const f = S.f(i + 1); const c = circ(f); if (!S.lim) return lg(Math.max(...c.map((p) => Math.hypot(p[0], p[1])))); const g = circ(S.lim); let m = 0; c.forEach((p, q) => { m = Math.max(m, Math.hypot(p[0] - g[q][0], p[1] - g[q][1])); }); return lg(m); });
          const y0 = Math.floor(Math.min(...ds) - 0.3), y1 = Math.ceil(Math.max(...ds) + 0.3);
          P.setView(null, [y0, y1]); P.setTicks(null, logTicks(y0, y1));
          P.path(ds.map((y, i) => [i + 1, y]), { color: S.lim ? 'accent' : 'red', width: 2.2 });
          P.dot(n, ds[n - 1], { color: 'gold', r: 5.5 });
          st = { key, n, d: Math.pow(10, ds[n - 1]), bound };
          v.legend(S.lim ? [['accent', '$f_n$ on $|z|=\\frac12$'], ['green', key === 'shrink' ? 'the limit $0$ (constant)' : 'the limit $f$', { dash: key !== 'shrink', dot: key === 'shrink' }]].concat(S.inS ? [['muted', 'growth bound $|w|=\\frac{0.5}{(1-0.5)^2}$', { dash: true }]] : [])
            : [['accent', '$f_n$ on $|z|=\\frac12$'], ['red', '$\\sup_{|z|\\le1/2}|f_n|$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.key === 'slit' || s.key === 'poly') return `$\\sup_{|z|\\le1/2}|f_{${s.n}}-f| = ${v.sci(s.d, 2)}\\to0$; all $|f_n|\\le\\frac{1/2}{(1-1/2)^2}=${v.fix(s.bound, 2)}$ on that disc, and the limit is again in $\\mathscr S$ (one-to-one, $f'(0)=1$).`;
          if (s.key === 'shrink') return `Each $z/n$ is one-to-one, but $f_n'(0)=\\frac1n\\to0$ and $f_n\\to0$, a constant: without $f'(0)=1$ the limit can leave the class.`;
          return `Each $nz$ is one-to-one, but $\\sup_{|z|\\le1/2}|nz| = ${v.fix(s.d, 1)}\\to\\infty$: without $f'(0)=1$ the family is not even bounded, so no subsequence converges.`;
        });
      },
    },
  ],
};
