// Rudin, Real and Complex Analysis — Chapter 12: The Maximum Modulus Principle
// This file: the Schwarz lemma and the automorphisms of the disc (12.2–12.6).
// Part file ch12-a2.js: Phragmén–Lindelöf, interpolation, and the converse (12.7–12.13).

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
// φ_a(z) = (z − a)/(1 − ā z) on plain numbers → [re, im]
function phiXY(ar, ai, x, y) {
  const nr = x - ar, ni = y - ai;
  const dr = 1 - (ar * x + ai * y), di = -(ar * y - ai * x);
  const d = dr * dr + di * di;
  return [(nr * dr + ni * di) / d, (ni * dr - nr * di) / d];
}
// keep a handle inside the closed disc of radius R
const inDisc = (R) => (x, y) => { const r = Math.hypot(x, y); return r <= R ? [x, y] : [x * R / r, y * R / r]; };
// images of the polar grid (circles |z| = k/6, radii every 30°) under F(x, y) → [u, v]
function polarGrid(S, F, st = {}) {
  const n = st.n || 160;
  for (let k = 1; k <= 5; k++) {
    const r = k / 6, pts = [];
    for (let i = 0; i <= n; i++) { const t = TAU * i / n; pts.push(F(r * Math.cos(t), r * Math.sin(t))); }
    S.path(pts, { color: st.circ || 'teal', width: 1.25, alpha: 0.8 });
  }
  for (let j = 0; j < 12; j++) {
    const t = j * Math.PI / 6, pts = [];
    for (let i = 0; i <= 80; i++) { const r = 0.999 * i / 80; pts.push(F(r * Math.cos(t), r * Math.sin(t))); }
    S.path(pts, { color: st.rad || 'orange', width: 1.05, alpha: 0.7 });
  }
}
// eight palette colours for marked points on the circle T
const RING = ['red', 'orange', 'gold', 'green', 'teal', 'blue', 'purple', 'pink'];
// radius of the circle through three points
function circumR(p, q, r) {
  const a = Math.hypot(q[0] - r[0], q[1] - r[1]), b = Math.hypot(p[0] - r[0], p[1] - r[1]), c = Math.hypot(p[0] - q[0], p[1] - q[1]);
  const area = Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])) / 2;
  return a * b * c / (4 * area);
}
// phase-portrait colour of w: hue = arg w, light bands = log2 |w|
function phaseRGB(M, re, im) {
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}
const blend = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];

export default {
  book: 'rca',
  chapter: 12,
  title: 'The Maximum Modulus Principle',
  summary: String.raw`The maximum modulus theorem says that $\abs f$ has no interior maxima; this chapter shows how much that single fact can do. Applied to $f(z)/z$ it gives Schwarz's lemma, which in turn identifies every conformal automorphism of the disc as a rotated Möbius map $\lambda\varphi_\alpha$. On unbounded regions the principle needs a growth condition, and the Phragmén–Lindelöf method supplies it: damping factors give the three-lines theorem and a sharp double-exponential bound in a strip. The three-lines theorem then proves an interpolation theorem for operators on $L^p$ spaces, and the chapter ends with a converse: continuous functions whose whole module obeys the maximum principle must be holomorphic.`,
  items: [
    // ------------------------------------------------------------------ 12.2 Schwarz's lemma
    {
      num: '12.2',
      kind: 'Theorem',
      name: "Schwarz's lemma",
      statement: String.raw`Let $f\in H^\infty$, the bounded holomorphic functions in the open unit disc $U$, with $\norm{f}_\infty\le1$ and $f(0)=0$. Then
$$\abs{f(z)}\le\abs{z}\quad(z\in U)\qquad\text{and}\qquad\abs{f'(0)}\le1 .$$
If $\abs{f(z)}=\abs{z}$ for even one point $z\in U$ other than $0$, or if $\abs{f'(0)}=1$, then $f(z)=\lambda z$ for a constant $\lambda$ with $\abs\lambda=1$.`,
      idea: String.raw`Since $f(0)=0$, the quotient $g(z)=f(z)/z$, completed by $g(0)=f'(0)$, is holomorphic in $U$ (power series, 10.16). On the circle $\abs z=r<1$ we have $\abs g\le1/r$, so the maximum modulus theorem (10.24) gives $\abs g\le1/r$ on the whole disc $\abs z\le r$; letting $r\to1$ yields $\abs g\le1$ in $U$, which is both inequalities. Equality at an interior point means $\abs g$ attains its maximum inside $U$, so $g$ is a constant of modulus $1$.`,
      caption: String.raw`Build a self-map with $f(0)=0$: drag the zero $a$ of the Möbius factor, set the blend $t$ and the rotation $\lambda$. Left: the shading is $\abs{f(z)}/\abs z$ (the proof's $\abs g$) — it never exceeds $1$, and is identically $1$ only at $t=0$, a rotation. Right: the image of the circle through $z_0$ never leaves the disc of radius $\abs{z_0}$. Bottom: $M(r)/r$ rises from $\abs{f'(0)}$ but stays below $1$. The last choice breaks the hypothesis $f(0)=0$ and the inequality fails near $0$ (red).`,
      deps: ['rca-10.24', 'rca-10.16'],
      tags: ['Schwarz lemma', 'maximum modulus', 'unit disc'],
      viz(v) {
        const M = v.M, { Cx } = M;
        const mode = v.select('', [
          { value: 'blend', label: String.raw`$f=z\,[(1-t)\lambda+t\,\varphi_a(z)]$` },
          { value: 'sin', label: String.raw`$f=\sin z/\sinh 1$` },
          { value: 'moved', label: String.raw`break it: $f=\varphi_{-a}(\lambda z)$, $f(0)=a$` },
        ], 'blend');
        const tS = v.slider('blend $t$', 0, 1, 0.4, { step: 0.01 });
        const lS = v.slider(String.raw`$\arg\lambda$`, -3.14, 3.14, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 320, axes: false, title: String.raw`domain $U$, shaded by $\abs{f(z)}/\abs{z}$` });
        const R = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 320, axes: false, title: String.raw`image of the circle $\abs z=\abs{z_0}$` });
        const B = v.stage({ x: [-0.035, 1.01], y: [0, 1.3], height: 165, full: true, axes: 'box', xlabel: 'r', xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: String.raw`$M(r)/r$ with $M(r)=\max_{\abs z=r}\abs{f(z)}$ — Schwarz: never above $1$` });
        const aH = L.handle(0.5, 0.3, { color: 'orange', label: 'a', constrain: inDisc(0.9) });
        const zH = L.handle(-0.52, -0.3, { color: 'gold', label: 'z₀', constrain: inDisc(0.97) });
        v.legend([['accent', String.raw`circle $\abs z=\abs{z_0}$ and its image`], ['green', String.raw`disc of radius $\abs{z_0}$`, { area: true }], ['red', String.raw`where $\abs{f(z)}>\abs z$`], ['orange', String.raw`$M(r)/r$`]]);
        let st = null;

        v.render(() => {
          const m = mode.value, t = tS.value, lam = Cx.polar(1, lS.value), a = new Cx(aH.x, aH.y);
          tS.el.hidden = m !== 'blend'; lS.el.hidden = m === 'sin'; aH.visible = m !== 'sin';
          const sh1 = Math.sinh(1);
          const F = m === 'blend' ? (z) => z.mul(lam.scale(1 - t).add(z.sub(a).div(new Cx(1, 0).sub(a.conj().mul(z))).scale(t)))
            : m === 'sin' ? (z) => z.sin().scale(1 / sh1)
              : (z) => { const w = lam.mul(z); return w.add(a).div(new Cx(1, 0).add(a.conj().mul(w))); };
          const fp0 = m === 'blend' ? lam.scale(1 - t).sub(a.scale(t)).abs() : m === 'sin' ? 1 / sh1 : 1 - a.abs2();
          // ---- left: |f(z)|/|z|
          const pan = v.rgb('panel'), acc = v.rgb('accent'), red = v.rgb('red');
          L.raster((x, y) => {
            const r2 = x * x + y * y; if (r2 >= 1) return null;
            const q = F(new Cx(x, y)).abs() / Math.sqrt(r2);
            if (q > 1 + 1e-9) return blend(pan, red, 0.3 + 0.45 * Math.min(1, (q - 1) / 1.5));
            return blend(pan, acc, 0.06 + 0.6 * q * q);
          }, { key: `${m}|${t}|${lS.value}|${aH.x},${aH.y}|${pan}`, res: 2 });
          for (const r of [0.25, 0.5, 0.75]) L.circle(0, 0, r, { color: 'panel', width: 1, alpha: 0.6 });
          L.circle(0, 0, 1, { color: 'ink', width: 2 });
          const r0 = Math.hypot(zH.x, zH.y);
          L.circle(0, 0, r0, { color: 'accent', width: 2, dash: [5, 4] });
          L.dot(0, 0, { color: 'ink', r: 3.5 });
          if (m === 'blend' && t > 0.5) { // second zero of f: φ_a(z) = −(1−t)λ/t
            const w = lam.scale(-(1 - t) / t); const z2 = w.add(a).div(new Cx(1, 0).add(a.conj().mul(w)));
            L.dot(z2.re, z2.im, { color: 'ink', r: 4, hollow: true, label: 'zero', labelPos: 'se', labelSize: 12 });
          }
          // ---- right: image of |z| = r0 inside the disc of radius r0
          R.circle(0, 0, r0, { fill: 'green', fillAlpha: 0.13, color: 'green', width: 1.4, dash: [5, 4] });
          R.circle(0, 0, 1, { color: 'ink', width: 2 });
          for (const r of [0.25, 0.5, 0.75]) R.curve((s) => F(Cx.polar(r, TAU * s)), 0, 1, { color: 'muted', width: 1, alpha: 0.4, n: 240 });
          const img = [], bad = [];
          for (let i = 0; i <= 360; i++) {
            const w = F(Cx.polar(r0, TAU * i / 360)); img.push([w.re, w.im]);
            bad.push(w.abs() > r0 * (1 + 1e-6) ? [w.re, w.im] : null);
          }
          R.path(img, { color: 'accent', width: 2.4 });
          R.path(bad, { color: 'red', width: 3.2 });
          const fz = F(new Cx(zH.x, zH.y));
          R.line(0, 0, fz.re, fz.im, { color: 'gold', width: 1.2, dash: [3, 3] });
          R.dot(fz.re, fz.im, { color: 'gold', r: 5.5, label: 'f(z₀)', labelPos: (fz.im >= 0 ? 'n' : 's') + (fz.re >= 0 ? 'e' : 'w') });
          const f0 = F(new Cx(0, 0));
          if (m === 'moved') R.dot(f0.re, f0.im, { color: 'red', r: 4.5, label: 'f(0) = a', labelPos: 'sw', labelSize: 13 });
          else R.dot(0, 0, { color: 'ink', r: 3 });
          // ---- bottom: M(r)/r
          const rs = M.linspace(0.006, 0.995, 130);
          const ratio = rs.map((r) => { let mx = 0; for (let i = 0; i < 160; i++) mx = Math.max(mx, F(Cx.polar(r, TAU * i / 160)).abs()); return mx / r; });
          const top = m === 'moved' ? 3.2 : 1.3;
          B.setView(null, [0, top]);
          B.hband(1, top + 1, { color: 'red', alpha: 0.07 });
          B.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
          B.path(rs.map((r, i) => [r, ratio[i]]), { color: 'orange', width: 2.4 });
          if (m !== 'moved') B.dot(0, fp0, { color: 'ink', r: 4.5, hollow: true, label: "|f′(0)|", labelPos: fp0 > 0.85 ? 'se' : 'ne', labelSize: 13 });
          B.vline(r0, { color: 'accent', width: 1, dash: [3, 3] });
          let mr0 = 0; for (let i = 0; i < 360; i++) mr0 = Math.max(mr0, F(Cx.polar(r0, TAU * i / 360)).abs());
          B.dot(r0, mr0 / r0, { color: 'accent', r: 4.5 });
          st = { m, t, r0, fz: fz.abs(), fp0, maxRatio: Math.max(...ratio) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$\\abs{z_0}=${v.fix(s.r0, 3)}$, $\\;\\abs{f(z_0)}=${v.fix(s.fz, 3)}$, $\\;\\abs{f'(0)}=${v.fix(s.fp0, 3)}$ — `;
          if (s.m === 'moved') return head + 'the hypothesis $f(0)=0$ fails, and indeed $\\abs{f(z)}>\\abs z$ near $0$.';
          if (s.m === 'blend' && s.t === 0) return head + 'a rotation $\\lambda z$: equality $\\abs{f(z)}=\\abs z$ everywhere, the extremal case.';
          return head + `$\\sup_{0<r<1} M(r)/r = ${v.fix(s.maxRatio, 3)} < 1$ — strict inequality, since $f$ is not a rotation.`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.3 φ_α
    {
      num: '12.3',
      kind: 'Definition',
      name: 'The Möbius maps φ_α of the disc',
      statement: String.raw`For each $\alpha$ in the open unit disc $U$ put
$$\varphi_\alpha(z)=\frac{z-\alpha}{1-\bar\alpha z}.$$
This is a rational function of $z$; for $\alpha\ne0$ its only singularity is a simple pole at $1/\bar\alpha$, which lies outside $\bar U$, so $\varphi_\alpha$ is holomorphic on a neighbourhood of the closed disc.`,
      idea: String.raw`Writing $1-\bar\alpha z=-\bar\alpha\,(z-1/\bar\alpha)$ shows that $\abs{\varphi_\alpha(z)}=\abs{z-\alpha}\,/\,\big(\abs\alpha\,\abs{z-\alpha^*}\big)$, where $\alpha^*=1/\bar\alpha$ is the reflection of $\alpha$ in the unit circle. So the level sets of $\abs{\varphi_\alpha}$ are the Apollonius circles of the pair $\alpha,\alpha^*$, and the unit circle is the one on which the ratio of distances equals $\abs\alpha$. Algebraically this is the identity $\abs{1-\bar\alpha z}^2-\abs{z-\alpha}^2=(1-\abs\alpha^2)(1-\abs z^2)$.`,
      caption: String.raw`Drag $\alpha$ and the test point $z$. Blue shading marks $\abs{\varphi_\alpha}<1$, red marks $\abs{\varphi_\alpha}>1$; the white curves are the level sets $\abs{\varphi_\alpha}=c$, circles around the zero $\alpha$ and the pole $\alpha^*=1/\bar\alpha$. The unit circle is exactly the level set $c=1$. The readout checks the identity behind it at your $z$.`,
      deps: [],
      tags: ['Möbius transformation', 'unit disc'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-1.45, 1.45], equal: true, height: 360, axes: false, title: String.raw`level sets of $\abs{\varphi_\alpha}$ in the plane` });
        const aH = S.handle(0.52, 0.3, { color: 'accent', label: 'α', constrain: inDisc(0.85) });
        const zH = S.handle(-0.95, 0.75, { color: 'gold', label: 'z' });
        v.legend([['blue', String.raw`$\abs{\varphi_\alpha}<1$`, { area: true }], ['red', String.raw`$\abs{\varphi_\alpha}>1$`, { area: true }], ['ink', String.raw`unit circle $=\{\abs{\varphi_\alpha}=1\}$`], ['accent', String.raw`$\abs{z-\alpha}$`], ['orange', String.raw`$\abs{z-\alpha^*}$`]]);
        let st = null;
        v.render(() => {
          const ar = aH.x, ai = aH.y, aa = Math.hypot(ar, ai);
          const pan = v.rgb('panel'), blu = v.rgb('blue'), red = v.rgb('red');
          S.raster((x, y) => {
            const w = phiXY(ar, ai, x, y); const L = Math.log(Math.hypot(w[0], w[1]));
            if (!isFinite(L)) return L < 0 ? blu : red;
            const k = Math.min(1, Math.abs(L) / 2.4);
            return blend(pan, L < 0 ? blu : red, 0.1 + 0.5 * Math.sqrt(k));
          }, { key: `${ar},${ai}|${pan}`, res: 2 });
          // level circles |φ_α| = c, drawn as φ_{−α}(c e^{iθ})
          for (const c of [0.2, 0.4, 0.6, 0.8, 1.25, 1.7, 2.5, 4]) {
            if (Math.abs(c * aa - 1) < 0.04) continue;
            const pts = M.linspace(0, TAU, 361).map((t) => phiXY(-ar, -ai, c * Math.cos(t), c * Math.sin(t)));
            S.path(pts, { color: 'panel', width: 1.3, alpha: 0.95 });
          }
          S.circle(0, 0, 1, { color: 'ink', width: 2.4 });
          S.tex('T', -0.84, -0.86, { color: 'ink', size: 17 });
          // pole α* = 1/ᾱ
          let star = null;
          if (aa > 1e-3) {
            star = [ar / (aa * aa), ai / (aa * aa)];
            const vis = inside(S, star);
            if (vis) {
              const d = 6 / S.scale;
              for (const [col, w] of [['panel', 5], ['red', 2.4]]) { S.line(star[0] - d, star[1] - d, star[0] + d, star[1] + d, { color: col, width: w }); S.line(star[0] - d, star[1] + d, star[0] + d, star[1] - d, { color: col, width: w }); }
              S.tex(String.raw`\alpha^*=1/\bar\alpha`, star[0], star[1], { color: 'red', dy: -16, size: 14 });
            } else {
              const b = S.bounds, u = [ar / aa, ai / aa], k = 0.92 * Math.min((b.x[1] - 0.15) / Math.abs(u[0] || 1e-9), (b.y[1] - 0.12) / Math.abs(u[1] || 1e-9));
              S.arrow(u[0] * (k - 0.45), u[1] * (k - 0.45), u[0] * k, u[1] * k, { color: 'red', width: 2 });
              S.text('pole 1/ᾱ', u[0] * (k - 0.5), u[1] * (k - 0.5), { color: 'red', size: 12, align: 'center', dy: -12 });
            }
            S.line(zH.x, zH.y, ar, ai, { color: 'accent', width: 2 });
            if (vis) S.line(zH.x, zH.y, star[0], star[1], { color: 'orange', width: 2, dash: [6, 4] });
          }
          S.dot(0, 0, { color: 'ink', r: 3 });
          // the identity at z
          const x = zH.x, y = zH.y;
          const w = phiXY(ar, ai, x, y), mod = Math.hypot(w[0], w[1]);
          const num = Math.hypot(x - ar, y - ai), den = Math.hypot(1 - (ar * x + ai * y), -(ar * y - ai * x));
          const lhs = den * den - num * num, rhs = (1 - aa * aa) * (1 - x * x - y * y);
          st = { mod, num, den, lhs, rhs, zin: x * x + y * y < 1, aa, dstar: star ? Math.hypot(x - star[0], y - star[1]) : null };
        });
        function inside(S, p) { const b = S.bounds; return p[0] > b.x[0] && p[0] < b.x[1] && p[1] > b.y[0] && p[1] < b.y[1]; }
        v.readout(() => {
          const s = st; if (!s) return '';
          const ratio = s.dstar != null ? `$\\;=\\;\\abs{z-\\alpha}/(\\abs\\alpha\\,\\abs{z-\\alpha^*}) = ${v.fix(s.num, 3)}/(${v.fix(s.aa, 3)}\\cdot${v.fix(s.dstar, 3)})$` : '';
          return `$\\abs{\\varphi_\\alpha(z)} = ${v.fix(s.mod, 4)}$${ratio}. $\\;\\abs{1-\\bar\\alpha z}^2-\\abs{z-\\alpha}^2 = ${v.fix(s.lhs, 4)}$ and $(1-\\abs\\alpha^2)(1-\\abs z^2) = ${v.fix(s.rhs, 4)}$ — both ${s.zin ? 'positive: $z\\in U$, so $\\abs{\\varphi_\\alpha(z)}<1$' : 'non-positive: $z\\notin U$, so $\\abs{\\varphi_\\alpha(z)}\\ge1$'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.4 properties of φ_α
    {
      num: '12.4',
      kind: 'Theorem',
      name: 'φ_α is a bijection of the disc moving α to 0',
      statement: String.raw`Fix $\alpha\in U$. Then $\varphi_\alpha$ is one-to-one, maps the unit circle $T$ onto $T$, the disc $U$ onto $U$, and $\alpha$ to $0$. Its inverse is $\varphi_{-\alpha}$, and
$$\varphi_\alpha'(0)=1-\abs\alpha^2,\qquad \varphi_\alpha'(\alpha)=\frac{1}{1-\abs\alpha^2}.$$`,
      idea: String.raw`A direct computation shows $\varphi_{-\alpha}(\varphi_\alpha(z))=z$, so $\varphi_\alpha$ is invertible with inverse $\varphi_{-\alpha}$. For $\abs z=1$, $\abs{1-\bar\alpha z}=\abs{\bar z-\bar\alpha}=\abs{z-\alpha}$, so $\abs{\varphi_\alpha}=1$ on $T$; the maximum modulus theorem (10.24) then puts $\varphi_\alpha(U)$ inside $U$, and the same for $\varphi_{-\alpha}$ gives "onto". The derivative is $\varphi_\alpha'(z)=(1-\abs\alpha^2)/(1-\bar\alpha z)^2$; evaluate at $0$ and at $\alpha$.`,
      caption: String.raw`Drag $\alpha$. The polar grid of the disc (left) is carried by $\varphi_\alpha$ to the grid on the right: circles go to circles, the coloured points on $T$ stay on $T$ (in the same cyclic order), and $\alpha$ lands at the centre. The small gold disc about $\alpha$ is magnified by about $1/(1-\abs\alpha^2)$, the purple disc about $0$ shrinks by about $1-\abs\alpha^2$ — the two derivatives. Shrink $\rho$ to see the ratios converge.`,
      deps: ['rca-12.3', 'rca-10.24'],
      tags: ['Möbius transformation', 'unit disc', 'automorphism'],
      viz(v) {
        const M = v.M;
        const rho = v.slider(String.raw`radius $\rho$ of the small discs`, 0.01, 0.16, 0.07, { step: 0.005 });
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 330, axes: false, title: String.raw`the $z$-disc, with $D(\alpha,\rho)$ and $D(0,\rho)$` });
        const R = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 330, axes: false, title: String.raw`its image under $\varphi_\alpha$` });
        const aH = L.handle(0.45, 0.3, { color: 'accent', label: 'α', constrain: inDisc(0.85) });
        v.legend([['teal', 'circles $\\abs z=k/6$'], ['orange', 'radii'], ['gold', String.raw`$D(\alpha,\rho)$ and its image, about $\varphi_\alpha(\alpha)=0$`, { area: true }], ['purple', String.raw`$D(0,\rho)$ and its image, about $\varphi_\alpha(0)=-\alpha$`, { area: true }]]);
        let st = null;
        v.render(() => {
          const ar = aH.x, ai = aH.y, a2 = ar * ar + ai * ai;
          const F = (x, y) => phiXY(ar, ai, x, y);
          polarGrid(L, (x, y) => [x, y]); polarGrid(R, F);
          L.circle(0, 0, 1, { color: 'ink', width: 2.2 }); R.circle(0, 0, 1, { color: 'ink', width: 2.2 });
          let tErr = 0;
          for (let j = 0; j < 8; j++) {
            const t = j * TAU / 8 + 0.3, x = Math.cos(t), y = Math.sin(t), w = F(x, y);
            tErr = Math.max(tErr, Math.abs(Math.hypot(w[0], w[1]) - 1));
            L.dot(x, y, { color: RING[j], r: 5.5 }); R.dot(w[0], w[1], { color: RING[j], r: 5.5 });
          }
          const r = rho.value;
          const circ = (cx, cy) => M.linspace(0, TAU, 121).map((t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)]);
          const cA = circ(ar, ai), c0 = circ(0, 0);
          const iA = cA.map(([x, y]) => F(x, y)), i0 = c0.map(([x, y]) => F(x, y));
          L.poly(cA, { fill: 'gold', fillAlpha: 0.4, color: 'gold', width: 1.8 });
          L.poly(c0, { fill: 'purple', fillAlpha: 0.35, color: 'purple', width: 1.8 });
          R.poly(iA, { fill: 'gold', fillAlpha: 0.4, color: 'gold', width: 1.8 });
          R.poly(i0, { fill: 'purple', fillAlpha: 0.35, color: 'purple', width: 1.8 });
          R.dot(0, 0, { color: 'ink', r: 3 });
          const rA = circumR(iA[0], iA[40], iA[80]), r0 = circumR(i0[0], i0[40], i0[80]);
          R.dot(-ar, -ai, { color: 'purple', r: 3 });
          // measured radii of the image discs (Möbius maps send circles to circles)
          // inverse check on a grid
          let inv = 0;
          for (let i = 0; i < 24; i++) for (let k = 1; k < 8; k++) {
            const t = TAU * i / 24, s = k / 8, x = s * Math.cos(t), y = s * Math.sin(t), w = F(x, y), z = phiXY(-ar, -ai, w[0], w[1]);
            inv = Math.max(inv, Math.hypot(z[0] - x, z[1] - y));
          }
          st = { a2, rA: rA / r, r0: r0 / r, tErr, inv };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `Image radii: gold $/\\rho = ${v.fix(s.rA, 4)}$ vs $\\varphi_\\alpha'(\\alpha)=1/(1-\\abs\\alpha^2) = ${v.fix(1 / (1 - s.a2), 4)}$; $\\;$ purple $/\\rho = ${v.fix(s.r0, 4)}$ vs $\\varphi_\\alpha'(0)=1-\\abs\\alpha^2 = ${v.fix(1 - s.a2, 4)}$. $\\;\\max_T\\big|\\abs{\\varphi_\\alpha}-1\\big| = ${v.sci(s.tErr + 1e-17, 1)}$, $\\;\\max\\abs{\\varphi_{-\\alpha}(\\varphi_\\alpha(z))-z} = ${v.sci(s.inv + 1e-17, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.5 extremal problem
    {
      num: '12.5',
      kind: 'Theorem',
      name: 'How large can |f′(α)| be when f(α) = β?',
      statement: String.raw`Let $\alpha,\beta\in U$ and let $f\in H^\infty$ satisfy $\norm{f}_\infty\le1$ and $f(\alpha)=\beta$. Then
$$\abs{f'(\alpha)}\le\frac{1-\abs\beta^2}{1-\abs\alpha^2}.$$
Equality holds for $f=\varphi_{-\beta}\circ(\lambda\varphi_\alpha)$ with $\abs\lambda=1$, and only for these functions.`,
      idea: String.raw`Move both points to the origin: $g=\varphi_\beta\circ f\circ\varphi_{-\alpha}$ maps $U$ into $\bar U$ (in fact into $U$) and fixes $0$, so Schwarz's lemma (12.2) gives $\abs{g'(0)}\le1$. By the chain rule and the derivatives in 12.4, $g'(0)=\varphi_\beta'(\beta)\,f'(\alpha)\,\varphi_{-\alpha}'(0)=f'(\alpha)\,(1-\abs\alpha^2)/(1-\abs\beta^2)$. Equality forces $g(z)=\lambda z$, i.e. $f=\varphi_{-\beta}\circ(\lambda\varphi_\alpha)$.`,
      caption: String.raw`Drag $\alpha$ (left) and the prescribed value $\beta$ (right). The test function is $f=\varphi_{-\beta}\big(\varphi_\alpha\cdot[(1-t)+t\varphi_c]\big)$, so $f(\alpha)=\beta$; $t=0$ is the extremal map. The orange disc $\{\abs{\varphi_\alpha}<s\}$ is mapped into the green disc $\{\abs{\varphi_\beta}<s\}$ — Schwarz's lemma for $g$. As $s\to0$ this inclusion becomes the derivative bound. Push $\beta$ toward the circle and watch the allowed derivative collapse.`,
      deps: ['rca-12.2', 'rca-12.4'],
      tags: ['Schwarz lemma', 'extremal problem', 'unit disc'],
      verify: true,
      viz(v) {
        const { Cx } = v.M;
        const sS = v.slider(String.raw`radius $s$ of the discs $\{\abs{\varphi_\alpha}<s\}$`, 0.05, 0.9, 0.5, { step: 0.01 });
        const tS = v.slider(String.raw`$t$ ($0$ = extremal)`, 0, 1, 0.3, { step: 0.01 });
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 330, axes: false, title: String.raw`domain: $\alpha$ and the disc $\{\abs{\varphi_\alpha}<s\}$` });
        const R = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 330, axes: false, title: String.raw`image: $f(\{\abs{\varphi_\alpha}<s\})\subset\{\abs{\varphi_\beta}<s\}$` });
        const aH = L.handle(-0.3, 0.22, { color: 'accent', label: 'α', constrain: inDisc(0.9) });
        const cH = L.handle(0.45, -0.5, { color: 'purple', label: 'c', r: 6, constrain: inDisc(0.9) });
        const bH = R.handle(0.42, 0.3, { color: 'accent', label: 'β', constrain: inDisc(0.95) });
        v.legend([['orange', String.raw`$\{\abs{\varphi_\alpha}<s\}$`, { area: true }], ['accent', 'its image under $f$', { area: true }], ['green', String.raw`$\{\abs{\varphi_\beta}<s\}$`, { area: true }]]);
        let st = null;
        v.render(() => {
          const a = new Cx(aH.x, aH.y), b = new Cx(bH.x, bH.y), c = new Cx(cH.x, cH.y), t = tS.value, s = sS.value;
          const one = new Cx(1, 0);
          const phi = (p) => (z) => z.sub(p).div(one.sub(p.conj().mul(z)));
          const pa = phi(a), pc = phi(c), pmb = phi(b.neg());
          const F = (z) => pmb(pa(z).mul(one.scale(1 - t).add(pc(z).scale(t))));
          const disc = (p, rad) => (u) => phi(p.neg())(Cx.polar(rad, TAU * u));
          // left
          L.circle(0, 0, 1, { color: 'ink', width: 2.2 });
          for (const s2 of [0.3, 0.6, 0.85]) L.curve(disc(a, s2), 0, 1, { color: 'muted', width: 1, alpha: 0.5, n: 200 });
          L.curve(disc(a, s), 0, 1, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.2, n: 300, close: true });
          // right
          R.circle(0, 0, 1, { color: 'ink', width: 2.2 });
          for (const s2 of [0.3, 0.6, 0.85]) R.curve(disc(b, s2), 0, 1, { color: 'muted', width: 1, alpha: 0.5, n: 200 });
          R.curve(disc(b, s), 0, 1, { color: 'green', width: 1.8, dash: [6, 4], fill: 'green', fillAlpha: 0.14, n: 300, close: true });
          R.curve((u) => F(disc(a, s)(u)), 0, 1, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.22, n: 400, close: true });
          // derivative: closed form and numerical check
          const G = one.scale(1 - t).add(pc(a).scale(t));
          const bound = (1 - b.abs2()) / (1 - a.abs2());
          const h = 1e-5, num = F(a.add(new Cx(h, 0))).sub(F(a.sub(new Cx(h, 0)))).scale(1 / (2 * h));
          // largest pseudo-hyperbolic distance from β reached by f on the boundary of the orange disc
          let worst = 0;
          for (let i = 0; i < 240; i++) { const w = F(disc(a, s)(i / 240)); worst = Math.max(worst, phi(b)(w).abs()); }
          st = { d: num.abs(), bound, G: G.abs(), worst, s, t };
        });
        v.readout(() => {
          const r = st; if (!r) return '';
          return `$\\abs{f'(\\alpha)} = ${v.fix(r.d, 4)}\\;\\le\\;\\dfrac{1-\\abs\\beta^2}{1-\\abs\\alpha^2} = ${v.fix(r.bound, 4)}$ (ratio $${v.fix(r.d / r.bound, 4)}$${r.t === 0 ? ' — equality: the extremal map' : ''}). On the edge of the orange disc, $\\max\\abs{\\varphi_\\beta\\circ f} = ${v.fix(r.worst, 4)}\\le s = ${v.fix(r.s, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.6 automorphisms of U
    {
      num: '12.6',
      kind: 'Theorem',
      name: 'Every automorphism of the disc is λφ_α',
      statement: String.raw`Let $f\in H(U)$ be one-to-one with $f(U)=U$, and let $\alpha\in U$ be the point with $f(\alpha)=0$. Then there is a constant $\lambda$ with $\abs\lambda=1$ such that
$$f(z)=\lambda\,\varphi_\alpha(z)\qquad(z\in U).$$`,
      idea: String.raw`Let $g$ be the inverse of $f$; it is holomorphic (10.33) and maps $U$ onto $U$ with $g(0)=\alpha$. Applying 12.5 to $f$ at $\alpha$ and to $g$ at $0$ gives $\abs{f'(\alpha)}\le1/(1-\abs\alpha^2)$ and $\abs{g'(0)}\le1-\abs\alpha^2$. Since $f'(\alpha)\,g'(0)=1$, both are equalities, and the equality case of 12.5 (Schwarz's lemma, 12.2) forces $f=\lambda\varphi_\alpha$.`,
      caption: String.raw`The right panel is a colour wheel on $U$ (hue = argument, rings = modulus); the left panel colours each $z$ by the value $f(z)$, i.e. pulls the wheel back. For an automorphism built from the half-plane ($C(z)=i\frac{1+z}{1-z}$, then $w\mapsto aw+b$, then $C^{-1}$) every colour appears exactly once, recentred at $\alpha=f^{-1}(0)$ — and the readout confirms $f=\lambda\varphi_\alpha$ to machine precision. $z^2$ shows every colour twice; the third map misses the shaded part of $U$.`,
      deps: ['rca-12.5', 'rca-12.4', 'rca-12.2', 'rca-10.33'],
      tags: ['automorphism', 'Möbius transformation', 'Schwarz lemma'],
      viz(v) {
        const M = v.M, { Cx } = M;
        const mode = v.select('', [
          { value: 'auto', label: String.raw`$C^{-1}(aC+b)$: bijective` },
          { value: 'sq', label: String.raw`$z^2$: onto, not one-to-one` },
          { value: 'into', label: String.raw`$\tfrac23\big(z+\tfrac{z^2}{2}\big)$: one-to-one, not onto` },
        ], 'auto');
        const aS = v.slider('dilation $a$', 0.25, 4, 2.2, { log: true, decimals: 2 });
        const bS = v.slider('shift $b$', -2, 2, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 330, axes: false, title: String.raw`$z\in U$, coloured by the value $f(z)$` });
        const R = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 330, axes: false, title: String.raw`$w\in U$: the colour wheel` });
        const zH = L.handle(0.38, 0.5, { color: 'gold', constrain: inDisc(0.96) });
        const one = new Cx(1, 0), I = new Cx(0, 1);
        const C = (z) => I.mul(one.add(z)).div(one.sub(z)), Ci = (w) => w.sub(I).div(w.add(I));
        let st = null;
        const boundary = M.linspace(0, TAU, 400).map((t) => { const z = Cx.polar(1, t); const w = z.add(z.mul(z).scale(0.5)).scale(2 / 3); return [w.re, w.im]; });
        v.render(() => {
          const m = mode.value, A = aS.value, Bb = bS.value;
          aS.el.hidden = bS.el.hidden = m !== 'auto';
          const F = m === 'auto' ? (z) => Ci(C(z).scale(A).add(new Cx(Bb, 0)))
            : m === 'sq' ? (z) => z.mul(z) : (z) => z.add(z.mul(z).scale(0.5)).scale(2 / 3);
          const pan = v.rgb('panel'), red = v.rgb('red');
          L.raster((x, y) => {
            if (x * x + y * y >= 1) return null;
            const w = F(new Cx(x, y)); return phaseRGB(M, w.re, w.im);
          }, { key: `${m}|${A}|${Bb}`, res: 1 });
          R.raster((x, y) => {
            if (x * x + y * y >= 1) return null;
            const c = phaseRGB(M, x, y);
            if (m === 'into' && !M.pointInPoly([x, y], boundary)) return blend(blend(c, pan, 0.84), red, 0.1);
            return c;
          }, { key: `${m}|${pan}`, res: 1 });
          L.circle(0, 0, 1, { color: 'ink', width: 2 }); R.circle(0, 0, 1, { color: 'ink', width: 2 });
          if (m === 'into') { R.poly(boundary, { color: 'ink', width: 1.6, dash: [5, 4] }); R.text('missed by f', -0.71, 0.42, { color: 'ink', size: 12, align: 'center' }); }
          const z = new Cx(zH.x, zH.y), w = F(z);
          R.dot(w.re, w.im, { color: 'gold', r: 6.5, label: 'f(z)', labelPos: 'ne', labelColor: 'ink' });
          L.text('z', z.re, z.im, { color: 'ink', math: true, size: 17, dx: 11, dy: -11 });
          R.dot(0, 0, { color: 'ink', r: 3.5 });
          let alpha, lam = null, err = null;
          if (m === 'auto') {
            alpha = Ci(new Cx(-Bb, 1).scale(1 / A));          // C(α) = (i − b)/a
            // f'(α) by the chain rule: (C⁻¹)'(w) = 2i/(w+i)², C'(z) = 2i/(1−z)²
            const W = C(alpha).scale(A).add(new Cx(Bb, 0));
            const d = new Cx(0, 2).div(W.add(I).mul(W.add(I))).scale(A).mul(new Cx(0, 2).div(one.sub(alpha).mul(one.sub(alpha))));
            lam = d.scale(1 - alpha.abs2());                   // λ = f'(α)(1 − |α|²), predicted to have |λ| = 1
            err = 0;
            for (let i = 0; i < 36; i++) for (let k = 1; k <= 9; k++) {
              const q = Cx.polar(0.99 * k / 9, TAU * i / 36);
              const g = lam.mul(q.sub(alpha).div(one.sub(alpha.conj().mul(q))));
              err = Math.max(err, F(q).sub(g).abs());
            }
            R.dot(lam.re, lam.im, { color: 'accent', r: 5, hollow: true, width: 2.4, label: 'λ', labelPos: lam.im >= 0 ? 'ne' : 'se' });
          } else alpha = new Cx(0, 0);
          L.dot(alpha.re, alpha.im, { color: 'ink', r: 5, label: 'α', labelPos: alpha.im > 0.6 ? 's' : 'n', labelSize: 18 });
          if (m === 'sq') L.dot(-z.re, -z.im, { color: 'red', r: 6.5, label: '−z', labelPos: 'sw', labelColor: 'ink', labelSize: 17 });
          st = { m, alpha, lam, err, fp0: m === 'into' ? 2 / 3 : 0, z, w };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.m === 'auto') return `$\\alpha = f^{-1}(0) = ${s.alpha.toString(3)}$, $\\;\\lambda = f'(\\alpha)(1-\\abs\\alpha^2) = ${s.lam.toString(3)}$ with $\\abs\\lambda = ${v.fix(s.lam.abs(), 6)}$; $\\;\\max_{\\text{grid}}\\abs{f(z)-\\lambda\\varphi_\\alpha(z)} = ${v.sci(s.err + 1e-17, 1)}$ — the automorphism is $\\lambda\\varphi_\\alpha$.`;
          if (s.m === 'sq') return `$f(z)=f(-z)=${s.w.toString(3)}$: not one-to-one. Here $\\alpha=0$, yet $\\abs{f(z)}=\\abs z^2<\\abs z$, so $f$ is not $\\lambda\\varphi_0=\\lambda z$ — every colour of the wheel is used twice.`;
          return `One-to-one, $f(0)=0$, but $f'(0)=\\tfrac23$: by Schwarz's lemma $f$ is not a rotation $\\lambda z$, and indeed $f(U)\\ne U$ — the inverse is only defined on the unshaded region, so the argument of 12.6 cannot start.`;
        });
      },
    },
  ],
};
