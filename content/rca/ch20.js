// Rudin, Real and Complex Analysis — Chapter 20: Uniform Approximation by Polynomials

// ---------------------------------------------------------------- helpers shared by this file
// Phase-portrait colour of w = re + i im (hue = arg w, light bands = log2|w|); `fade` blends toward bg.
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// A small "×" with a halo (a pole, a centre).
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
// Ticks [k, '10^k'] for the integers k in [lo, hi] (every `every`-th one).
function logTicks(lo, hi, every = 1) {
  const out = [];
  for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % every === 0) out.push([k, k === 0 ? '1' : k === 1 ? '10' : `10${sup(k)}`]);
  return out;
}
// √w with its branch cut along the ray e^{id}·[0,∞); so sqrtCut(z−s, d) is √(z−s) cut along s + e^{id}[0,∞).
function sqrtCut(re, im, d) {
  const psi = d - Math.PI, c = Math.cos(psi), s = Math.sin(psi);
  const ur = re * c + im * s, ui = im * c - re * s;
  const r = Math.sqrt(Math.hypot(ur, ui)), t = Math.atan2(ui, ur) / 2;
  const wr = r * Math.cos(t), wi = r * Math.sin(t), c2 = Math.cos(psi / 2), s2 = Math.sin(psi / 2);
  return [wr * c2 - wi * s2, wr * s2 + wi * c2];
}
// Discrete least-squares fit by polynomials of degree ≤ Nmax to the values fr + i fi at the points zs,
// in the orthonormal basis built by Arnoldi (stable at high degree on any point set).
// Returns the coefficients, the basis at other points, a pointwise evaluator and the monomial coefficients.
function polyFit(zs, fr, fi, Nmax) {
  const m = zs.length, xr = Float64Array.from(zs, (p) => p[0]), xi = Float64Array.from(zs, (p) => p[1]);
  const Qr = [new Float64Array(m).fill(1 / Math.sqrt(m))], Qi = [new Float64Array(m)];
  const H = [], cr = [], ci = [];
  const ip = (ar, ai, br, bi) => { let sr = 0, si = 0; for (let i = 0; i < m; i++) { sr += ar[i] * br[i] + ai[i] * bi[i]; si += ar[i] * bi[i] - ai[i] * br[i]; } return [sr, si]; };
  const c0 = ip(Qr[0], Qi[0], fr, fi); cr.push(c0[0]); ci.push(c0[1]);
  for (let k = 1; k <= Nmax; k++) {
    const pr = Qr[k - 1], pi = Qi[k - 1], vr = new Float64Array(m), vi = new Float64Array(m);
    for (let i = 0; i < m; i++) { vr[i] = xr[i] * pr[i] - xi[i] * pi[i]; vi[i] = xr[i] * pi[i] + xi[i] * pr[i]; }
    const hr = new Float64Array(k), hi = new Float64Array(k);
    for (let pass = 0; pass < 2; pass++) for (let j = 0; j < k; j++) {
      const [a, b] = ip(Qr[j], Qi[j], vr, vi); hr[j] += a; hi[j] += b;
      const qr = Qr[j], qi = Qi[j];
      for (let i = 0; i < m; i++) { vr[i] -= a * qr[i] - b * qi[i]; vi[i] -= a * qi[i] + b * qr[i]; }
    }
    let nrm = 0; for (let i = 0; i < m; i++) nrm += vr[i] * vr[i] + vi[i] * vi[i]; nrm = Math.sqrt(nrm);
    for (let i = 0; i < m; i++) { vr[i] /= nrm; vi[i] /= nrm; }
    Qr.push(vr); Qi.push(vi); H.push({ hr, hi, nrm });
    const c = ip(vr, vi, fr, fi); cr.push(c[0]); ci.push(c[1]);
  }
  const basis = (pts, N = Nmax) => {
    const n = pts.length, Br = [new Float64Array(n).fill(1 / Math.sqrt(m))], Bi = [new Float64Array(n)];
    const yr = Float64Array.from(pts, (p) => p[0]), yi = Float64Array.from(pts, (p) => p[1]);
    for (let k = 1; k <= N; k++) {
      const { hr, hi, nrm } = H[k - 1], pr = Br[k - 1], pi = Bi[k - 1];
      const vr = new Float64Array(n), vi = new Float64Array(n);
      for (let i = 0; i < n; i++) { vr[i] = yr[i] * pr[i] - yi[i] * pi[i]; vi[i] = yr[i] * pi[i] + yi[i] * pr[i]; }
      for (let j = 0; j < k; j++) { const a = hr[j], b = hi[j], qr = Br[j], qi = Bi[j]; for (let i = 0; i < n; i++) { vr[i] -= a * qr[i] - b * qi[i]; vi[i] -= a * qi[i] + b * qr[i]; } }
      for (let i = 0; i < n; i++) { vr[i] /= nrm; vi[i] /= nrm; }
      Br.push(vr); Bi.push(vi);
    }
    return [Br, Bi];
  };
  const evalAt = (x, y, N) => {
    const br = new Float64Array(N + 1), bi = new Float64Array(N + 1);
    br[0] = 1 / Math.sqrt(m); let sr = cr[0] * br[0], si = ci[0] * br[0];
    for (let k = 1; k <= N; k++) {
      const { hr, hi, nrm } = H[k - 1];
      let vr = x * br[k - 1] - y * bi[k - 1], vi = x * bi[k - 1] + y * br[k - 1];
      for (let j = 0; j < k; j++) { vr -= hr[j] * br[j] - hi[j] * bi[j]; vi -= hr[j] * bi[j] + hi[j] * br[j]; }
      br[k] = vr / nrm; bi[k] = vi / nrm;
      sr += cr[k] * br[k] - ci[k] * bi[k]; si += cr[k] * bi[k] + ci[k] * br[k];
    }
    return [sr, si];
  };
  // monomial coefficients of P_N, read off from its values on the unit circle by a discrete Fourier transform
  const mono = (N, MC = 128) => {
    const vals = Array.from({ length: MC }, (_, j) => evalAt(Math.cos(2 * Math.PI * j / MC), Math.sin(2 * Math.PI * j / MC), N));
    const ar = new Float64Array(N + 1), ai = new Float64Array(N + 1);
    for (let k = 0; k <= N; k++) {
      let sr = 0, si = 0;
      for (let j = 0; j < MC; j++) { const t = -2 * Math.PI * j * k / MC, c = Math.cos(t), s = Math.sin(t); sr += vals[j][0] * c - vals[j][1] * s; si += vals[j][0] * s + vals[j][1] * c; }
      ar[k] = sr / MC; ai[k] = si / MC;
    }
    return [ar, ai];
  };
  return { cr, ci, basis, evalAt, mono, m };
}
function horner(ar, ai, x, y) {
  let sr = 0, si = 0;
  for (let k = ar.length - 1; k >= 0; k--) { const t = sr * x - si * y + ar[k]; si = sr * y + si * x + ai[k]; sr = t; }
  return [sr, si];
}
// Three-stop colour ramp between palette colours (t in [0,1]) → [r,g,b].
function ramp3(v, a, b, c, t) {
  t = Math.max(0, Math.min(1, t));
  const [p, q, s] = t < 0.5 ? [a, b, 2 * t] : [b, c, 2 * t - 1];
  return [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, p[2] + (q[2] - p[2]) * s];
}

export default {
  collection: 'rca',
  chapter: 20,
  title: 'Uniform Approximation by Polynomials',
  summary: String.raw`The last chapter answers the question behind Weierstrass's theorem and Runge's theorem completely: if a compact set $K\subset\C$ does not separate the plane, then every function that is continuous on $K$ and holomorphic in its interior is a uniform limit of polynomials on $K$ (Mergelyan's theorem). No holomorphy across $\partial K$ is required, and when $K$ has no interior every continuous function qualifies. The proof extends $f$ to the plane (Tietze), smooths it at a scale $\delta$ so that $\bar\partial$ of the smoothed function lives in a thin layer around $\partial K$, writes it as a Cauchy integral of its $\bar\partial$, and replaces the Cauchy kernel by functions whose singularities lie on small continua outside $K$ — with bounds furnished by conformal mapping and Koebe's one-quarter theorem. Runge's theorem finishes the job.`,
  items: [
    // ------------------------------------------------------------------ 20.2 the kernel lemma
    {
      num: '20.2',
      kind: 'Lemma',
      name: 'Moving the pole of the Cauchy kernel onto a continuum',
      verify: true,
      statement: String.raw`Let $D$ be an open disc of radius $r>0$, and let $E\subset D$ be compact and connected, with $\diam E\ge r$ and with $\Omega=S^2\setminus E$ connected. Then there are a function $g\in H(\Omega)$ and a constant $b$ such that the functions
$$Q_\zeta(z)=g(z)+(\zeta-b)\,g(z)^2$$
satisfy
$$|Q_\zeta(z)|<\frac{100}{r}\qquad\text{and}\qquad\Bigl|Q_\zeta(z)-\frac{1}{z-\zeta}\Bigr|<\frac{1000\,r^2}{|z-\zeta|^3}$$
for every $\zeta\in D$ and every $z\in\Omega$ (with $z\ne\zeta,\infty$ in the second inequality).`,
      idea: String.raw`Centre $D$ at $0$. The Riemann mapping theorem (14.8) gives a conformal map $F$ of $U$ onto $\Omega$ with $F(0)=\infty$, $F(w)=\alpha/w+c_0+c_1w+\cdots$; put $g=F^{-1}/\alpha$ and $b=c_0$. Then $g(z)=\frac{1}{z-b}+O(z^{-3})$ at $\infty$, so $Q_\zeta$ is the two-term truncation of $\frac{1}{z-\zeta}=\sum_n\frac{(\zeta-b)^n}{(z-b)^{n+1}}$ and agrees with it to third order at $\infty$ — but its only singularities lie on $E$. Sizes: Schwarz's lemma (12.2) applied to $w\mapsto F^{-1}(r/w)$ gives $|\alpha|\le r$; for $a\in E$ the function $\alpha/(F(w)-a)$ lies in the class $\mathscr S$, and the coefficient bound $|a_2|\le2$ (14.14) gives $|a-b|\le2|\alpha|$, hence $r\le\diam E\le4|\alpha|$. So $|g|<1/|\alpha|\le4/r$ and $|\zeta-b|<4r$, which yields the first bound. For the second, $(z-\zeta)^3\bigl(Q_\zeta(z)-\frac{1}{z-\zeta}\bigr)$ is holomorphic in $\Omega$ including $\infty$, and the maximum modulus theorem reduces it to the circle $|z-\zeta|=2r$, where the first bound applies.`,
      caption: String.raw`$D$ is the unit disc ($r=1$). Drag the ends of $E$ (or the centre and rim of the disc $E$) and the point $\zeta$. Left: the phase portrait of $Q_\zeta$, which is holomorphic off $E$ — there is no pole at $\zeta$ — and looks exactly like $\frac{1}{z-\zeta}$ far away (switch the panel to compare). Right: the measured $\max_{|z-\zeta|=s}|Q_\zeta-\frac{1}{z-\zeta}|$ decays like $s^{-3}$, far below Rudin's crude bound. Shrink $E$ below $\diam E=r$ to see the constants blow up.`,
      deps: ['rca-14.8', 'rca-14.14', 'rca-12.2', 'rca-10.24'],
      see: ['rca-13.6', 'rca-13.7'],
      tags: ['conformal mapping', 'Cauchy kernel', 'Koebe'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const shape = v.select('$E$ is', [{ value: 'seg', label: 'a segment' }, { value: 'disc', label: 'a closed disc' }], 'seg');
        const pic = v.select('left panel', [{ value: 'Q', label: '$Q_\\zeta$' }, { value: 'C', label: '$\\frac{1}{z-\\zeta}$' }], 'Q');
        const L = v.stage({ x: [-2.45, 2.45], y: [-1.8, 1.8], equal: true, height: 360, weight: 1.2, axes: false, title: 'phase portrait of $Q_\\zeta(z)=g(z)+(\\zeta-b)g(z)^2$' });
        const P = v.stage({ x: [-2.18, 1.5], y: [-6.2, 3.4], height: 360, axes: 'box', xlabel: 's', xticks: [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10']], yticks: logTicks(-6, 3, 2), title: '$\\max_{|z-\\zeta|=s}\\bigl|Q_\\zeta(z)-\\frac{1}{z-\\zeta}\\bigr|$ (log–log)' });
        const inD = (lim) => (x, y) => { const m = Math.hypot(x, y); return m > lim ? [x * lim / m, y * lim / m] : [x, y]; };
        const DEF = { seg: [[-0.62, -0.28], [0.52, 0.44]], disc: [[-0.18, 0.12], [0.4, 0.12]] };
        const hA = L.handle(...DEF.seg[0], { color: 'ink', r: 6, constrain: inD(0.97) });
        const hB = L.handle(...DEF.seg[1], { color: 'ink', r: 6, constrain: inD(0.97) });
        const hz = L.handle(0.2, -0.7, { color: 'accent', label: 'ζ', labelPos: 'se', constrain: inD(0.985) });
        let last = 'seg', st = null;
        v.render(() => {
          const kind = shape.value;
          if (kind !== last) { last = kind; hA.x = DEF[kind][0][0]; hA.y = DEF[kind][0][1]; hB.x = DEF[kind][1][0]; hB.y = DEF[kind][1][1]; }
          const zeta = new Cx(hz.x, hz.y);
          let E;
          if (kind === 'seg') {
            const p = new Cx(hA.x, hA.y), q = new Cx(hB.x, hB.y);
            const c = p.add(q).scale(0.5); let e = q.sub(p).scale(0.5);
            if (e.abs() < 0.02) e = new Cx(0.02, 0);
            const s2e = one.div(e).scale(2);
            const g = (z) => { const u = z.sub(c).div(e); return u.sub(u.sub(one).sqrt().mul(u.add(one).sqrt())).mul(s2e); };
            // boundary values of g on the two sides of E: z = c + e cos θ, g = (2/e) e^{iθ}
            const bdry = (t) => [c.add(e.scale(Math.cos(t))), s2e.mul(Cx.polar(1, t))];
            E = { b: c, g, bdry, diam: 2 * e.abs(), C: e.mul(e).scale(0.25).sub(zeta.sub(c).mul(zeta.sub(c))), inside: () => false };
          } else {
            const m = new Cx(hA.x, hA.y); let rho = Math.hypot(hB.x - hA.x, hB.y - hA.y);
            const rmax = 0.975 - m.abs();
            if (rho > rmax || rho < 0.04) {
              rho = Math.max(0.04, Math.min(rho, rmax));
              const a = Math.atan2(hB.y - hA.y, hB.x - hA.x) || 0; hB.x = m.re + rho * Math.cos(a); hB.y = m.im + rho * Math.sin(a);
            }
            const g = (z) => one.div(z.sub(m));
            const bdry = (t) => { const w = Cx.polar(1, t); return [m.add(w.scale(rho)), w.conj().scale(1 / rho)]; };
            E = { b: m, g, bdry, diam: 2 * rho, rho, C: zeta.sub(m).mul(zeta.sub(m)).neg(), inside: (x, y) => (x - m.re) ** 2 + (y - m.im) ** 2 < rho * rho };
          }
          const zb = zeta.sub(E.b);
          const Q = (z) => { const gz = E.g(z); return gz.add(zb.mul(gz.mul(gz))); };
          // ---- left: phase portrait
          const key = `${kind}|${pic.value}|${hA.x},${hA.y},${hB.x},${hB.y}|${hz.x},${hz.y}`;
          L.raster((x, y) => {
            if (E.inside(x, y)) return null;
            const z = new Cx(x, y), w = pic.value === 'Q' ? Q(z) : one.div(z.sub(zeta));
            return phaseRGB(v.M, w.re, w.im);
          }, { key, res: 2 });
          L.circle(0, 0, 1, { color: 'panel', width: 4.5, alpha: 0.7 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6, dash: [6, 4] });
          L.tex('D', 0.72, 0.72, { color: 'ink', size: 16, dx: 8, dy: -8 });
          if (kind === 'seg') {
            L.line(hA.x, hA.y, hB.x, hB.y, { color: 'panel', width: 8 });
            L.line(hA.x, hA.y, hB.x, hB.y, { color: 'ink', width: 4 });
          } else {
            L.circle(E.b.re, E.b.im, E.rho, { fill: 'ink', fillAlpha: 0.88, color: 'panel', width: 2.5 });
          }
          if (kind === 'seg') L.tex('E', (hA.x + hB.x) / 2, (hA.y + hB.y) / 2, { color: 'ink', size: 16, dx: -14, dy: -14 });
          else L.tex('E', E.b.re - 0.5 * E.rho, E.b.im + 0.42 * E.rho, { color: 'panel', size: 16 });
          xMark(L, E.b.re, E.b.im, kind === 'seg' ? 'ink' : 'panel', 4.5);
          L.tex('b', E.b.re, E.b.im, { color: kind === 'seg' ? 'ink' : 'panel', size: 14, dx: 12, dy: 10 });
          // ---- measured suprema over Ω, via boundary values on E (maximum modulus theorem)
          let supQ = 0, supG = 0;
          for (let k = 0; k < 720; k++) {
            const [z, gz] = E.bdry(2 * Math.PI * (k + 0.5) / 720);
            const q = gz.add(zb.mul(gz.mul(gz))); supQ = Math.max(supQ, q.abs());
            const d = z.sub(zeta), d2 = d.mul(d); supG = Math.max(supG, d2.mul(d).mul(q).sub(d2).abs());
          }
          supG = Math.max(supG, E.C.abs());
          // ---- right: radial profile of |Q − 1/(z−ζ)|
          const pts = [];
          for (let i = 0; i <= 110; i++) {
            const ls = -2 + 3.5 * i / 110, s = 10 ** ls; let e = 0;
            for (let k = 0; k < 96; k++) {
              const z = zeta.add(Cx.polar(s, 2 * Math.PI * (k + 0.5) / 96));
              if (E.inside(z.re, z.im)) continue;
              e = Math.max(e, Q(z).sub(one.div(z.sub(zeta))).abs());
            }
            pts.push(e > 0 ? [ls, Math.log10(e)] : null);
          }
          P.line(-2, 3 + 6, 1.5, 3 - 4.5, { color: 'green', width: 2, dash: [7, 5] });
          P.tex('1000\\,r^2/s^3', 0.55, 3 - 1.65, { color: 'green', size: 14, align: 'left', dx: 10, dy: -4 });
          const lc = Math.log10(E.C.abs() + 1e-300);
          if (lc > -8) {
            P.line(-0.2, lc + 0.6, 1.5, lc - 4.5, { color: 'gold', width: 1.8, dash: [2, 4] });
            P.tex('|C|/s^3', 1.42, lc - 4.26, { color: 'gold', size: 13, align: 'right', baseline: 'top', dy: 6 });
          }
          P.line(-2, 2, -0.6, 0.6, { color: 'muted', width: 1.5, dash: [2, 4] });
          P.tex('1/s', -0.75, 0.75, { color: 'muted', size: 13, align: 'left', baseline: 'top', dx: 2, dy: 6 });
          P.path(pts, { color: 'accent', width: 2.6 });
          P.vline(Math.log10(2), { color: 'muted', width: 1, dash: [3, 4] });
          P.text('s = 2r', Math.log10(2), -5.6, { color: 'muted', size: 11.5, dx: 5 });
          st = { supQ, supG, diam: E.diam, kind, C: E.C };
          v.legend([['ink', '$D$ (radius $r=1$) and the continuum $E$', { dash: true }], ['accent', 'measured $\\max_{|z-\\zeta|=s}$'], ['green', 'Rudin\u2019s bound', { dash: true }], ['gold', 'far-field $|C|/s^3$, $C=\\lim z^3(Q_\\zeta-\\frac1{z-\\zeta})$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const bad = s.diam < 1;
          const a = `$\\sup_\\Omega r|Q_\\zeta| = ${v.fmt(s.supQ, 3)}$ ${s.supQ < 100 ? '$<100$' : '$\\ge 100$ (bound broken)'}`;
          const b = `$\\sup_\\Omega \\tfrac{|z-\\zeta|^3}{r^2}\\bigl|Q_\\zeta-\\frac1{z-\\zeta}\\bigr| = ${v.fmt(s.supG, 3)}$ ${s.supG < 1000 ? '$<1000$' : '$\\ge 1000$ (bound broken)'}`;
          return `$\\diam E = ${v.fix(s.diam, 2)}\\,r$${bad ? ' — **hypothesis $\\diam E\\ge r$ fails**' : ''}. ${a}; ${b}. (Exact suprema: both functions are holomorphic in $\\Omega\\cup\\{\\infty\\}$, so they are read off on the two sides of $E$.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 20.3 Cauchy formula for C¹_c
    {
      num: '20.3',
      kind: 'Lemma',
      name: 'Cauchy formula for compactly supported $C^1$ functions',
      verify: true,
      statement: String.raw`Let $f\in C_c^1(\R^2)$, i.e. $f$ is a continuously differentiable complex function on the plane with compact support, and let $\bar\partial=\frac12\bigl(\frac{\partial}{\partial x}+i\frac{\partial}{\partial y}\bigr)$. Then for every $z\in\C$
$$f(z)=-\frac1\pi\iint_{\R^2}\frac{(\bar\partial f)(\zeta)}{\zeta-z}\,d\xi\,d\eta\qquad(\zeta=\xi+i\eta).$$`,
      idea: String.raw`The kernel $1/(\zeta-z)$ is locally integrable, so the integral converges absolutely. Use polar coordinates $\zeta=z+\rho e^{i\theta}$: there $\bar\partial=\frac12e^{i\theta}\bigl(\partial_\rho+\frac{i}{\rho}\partial_\theta\bigr)$ and $d\xi\,d\eta=\rho\,d\rho\,d\theta$, so the factor $e^{i\theta}\rho$ cancels the kernel and the integrand becomes $\frac12(\partial_\rho+\frac i\rho\partial_\theta)f$. The $\theta$-derivative integrates to $0$ around each circle, and since $f$ vanishes far out, $\int_\eps^\infty\partial_\rho f\,d\rho=-f(z+\eps e^{i\theta})$ (Fubini, 8.8, and the fundamental theorem of calculus). Hence the integral over $|\zeta-z|>\eps$ equals the mean of $f$ over the circle $|\zeta-z|=\eps$, which tends to $f(z)$. In Mergelyan's proof this represents a smoothed $f$ through $\bar\partial f$, which vanishes wherever $f$ is holomorphic.`,
      caption: String.raw`Left: $\bar\partial f$ (hue $=\arg$, intensity $=$ modulus), with $\chi$ a $C^1$ cut-off equal to $1$ on $|\zeta|\le0.55$ and $0$ beyond $|\zeta|\ge1.35$. Drag $z$ and change $\eps$. Right: the integral $I(\eps)$ over $|\zeta-z|>\eps$ (lines) coincides with the circle mean $m(\eps)$ of $f$ (dots) for every $\eps$, and both reach $f(z)$ (green) at $\eps=0$. For $e^\zeta\chi$ the integrand lives only on the ring where $\chi$ drops, yet it reproduces $e^z$ inside. Remove the compact support and the formula fails.`,
      deps: ['rca-11.1', 'rca-8.8', 'rca-2.9', 'pma-6.21'],
      see: ['rca-10.15', 'rca-10.7'],
      tags: ['Cauchy formula', '∂̄ operator'],
      viz(v) {
        const M = v.M;
        const A0 = 0.55, B0 = 1.35;
        const S = (t) => t * t * (3 - 2 * t);
        const chi = (r) => (r <= A0 ? 1 : r >= B0 ? 0 : 1 - S((r - A0) / (B0 - A0)));
        const dchi = (r) => { if (r <= A0 || r >= B0) return 0; const t = (r - A0) / (B0 - A0); return -6 * t * (1 - t) / (B0 - A0); };
        const FN = {
          exp: {
            label: '$e^{\\zeta}\\chi(|\\zeta|)$',
            f: (x, y) => { const e = Math.exp(x) * chi(Math.hypot(x, y)); return [e * Math.cos(y), e * Math.sin(y)]; },
            // ∂̄(hχ) = h·χ'(r)·ζ/(2r)
            db: (x, y) => { const r = Math.hypot(x, y); const d = dchi(r); if (!d) return [0, 0]; const e = Math.exp(x) * d / (2 * r), cr = e * Math.cos(y), ci = e * Math.sin(y); return [cr * x - ci * y, cr * y + ci * x]; },
            ring: (az) => [az >= A0 ? Math.max(0, az - B0) : A0 - az, az + B0],
          },
          conj: {
            label: '$\\bar\\zeta\\,\\chi(|\\zeta|)$',
            f: (x, y) => { const c = chi(Math.hypot(x, y)); return [x * c, -y * c]; },
            db: (x, y) => { const r = Math.hypot(x, y); return [chi(r) + 0.5 * r * dchi(r), 0]; },
            ring: (az) => [Math.max(0, az - B0), az + B0],
          },
          raw: {
            label: '$e^{\\zeta}$ (no compact support)',
            f: (x, y) => { const e = Math.exp(x); return [e * Math.cos(y), e * Math.sin(y)]; },
            db: () => [0, 0],
            ring: () => null,
          },
        };
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const epsS = v.slider('$\\varepsilon$', 0, 1.6, 0.3, { step: 0.01 });
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.6, 1.6], equal: true, height: 350, weight: 1.05, ticks: false, title: '$\\bar\\partial f$ and the excluded disc $|\\zeta-z|<\\varepsilon$' });
        const R = v.stage({ x: [0, 3], y: [-1, 2], height: 350, axes: 'box', xlabel: 'ε', title: '$I(\\varepsilon)=-\\frac1\\pi\\iint_{|\\zeta-z|>\\varepsilon}\\frac{\\bar\\partial f(\\zeta)}{\\zeta-z}$ and the circle mean $m(\\varepsilon)$' });
        const zH = L.handle(0.22, 0.18, { color: 'accent', label: 'z', labelPos: 'ne', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 1.45 ? [x * 1.45 / m, y * 1.45 / m] : [x, y]; } });
        const NT = 96, NR = 420;
        let st = null;
        v.render(() => {
          const F = FN[which.value], zx = zH.x, zy = zH.y, az = Math.hypot(zx, zy), eps = epsS.value;
          const Rmax = which.value === 'raw' ? 3 : az + B0 + 0.02;
          R.setView([-0.1 * Rmax, Rmax], null);
          // J(ρ) = ∫ ∂̄f(z+ρe^{iθ}) e^{−iθ} dθ  and  m(ρ) = (1/2π)∫ f(z+ρe^{iθ}) dθ
          const Jr = new Float64Array(NR + 1), Ji = new Float64Array(NR + 1), mr = new Float64Array(NR + 1), mi = new Float64Array(NR + 1);
          const cs = Array.from({ length: NT }, (_, k) => [Math.cos(2 * Math.PI * (k + 0.5) / NT), Math.sin(2 * Math.PI * (k + 0.5) / NT)]);
          for (let i = 0; i <= NR; i++) {
            const rho = Rmax * i / NR; let jr = 0, ji = 0, ar = 0, ai = 0;
            for (const [c, s] of cs) {
              const x = zx + rho * c, y = zy + rho * s;
              const [dr, di] = F.db(x, y); jr += dr * c + di * s; ji += di * c - dr * s;
              const [fr, fi] = F.f(x, y); ar += fr; ai += fi;
            }
            Jr[i] = jr * 2 * Math.PI / NT; Ji[i] = ji * 2 * Math.PI / NT; mr[i] = ar / NT; mi[i] = ai / NT;
          }
          // I(ρ) = −(1/π) ∫_ρ^Rmax J  (trapezoid, accumulated from the far end)
          const Ir = new Float64Array(NR + 1), Ii = new Float64Array(NR + 1), h = Rmax / NR;
          for (let i = NR - 1; i >= 0; i--) { Ir[i] = Ir[i + 1] - (Jr[i] + Jr[i + 1]) * h / (2 * Math.PI); Ii[i] = Ii[i + 1] - (Ji[i] + Ji[i + 1]) * h / (2 * Math.PI); }
          const fz = F.f(zx, zy);
          const at = (arr, e) => { const u = Math.min(NR, e / h), i = Math.floor(u), t = u - i; return i >= NR ? arr[NR] : arr[i] * (1 - t) + arr[i + 1] * t; };
          // ---- left: ∂̄f
          let mx = 0; for (let k = 0; k < 200; k++) { const r = B0 * k / 199; const [a, b] = F.db(r, 0); mx = Math.max(mx, Math.hypot(a, b), Math.hypot(...F.db(-r, 0)), Math.hypot(...F.db(0, r))); }
          const bg = v.rgb('panel');
          L.raster((x, y) => {
            const [a, b] = F.db(x, y), m = Math.hypot(a, b);
            if (!(m > 1e-12)) return [bg[0], bg[1], bg[2]];
            const c = phaseRGB(M, a, b), w = Math.pow(Math.min(1, m / mx), 0.6);
            return [bg[0] + (c[0] - bg[0]) * w, bg[1] + (c[1] - bg[1]) * w, bg[2] + (c[2] - bg[2]) * w];
          }, { key: which.value, res: 2 });
          if (which.value !== 'raw') {
            L.circle(0, 0, A0, { color: 'muted', width: 1.2, dash: [3, 4] });
            L.circle(0, 0, B0, { color: 'muted', width: 1.2, dash: [3, 4] });
            L.tex('\\operatorname{supp}f', B0 * 0.72, -B0 * 0.72, { color: 'muted', size: 13, align: 'left', dx: 6, dy: 8 });
          } else L.tex('\\bar\\partial f\\equiv0:\\ f \\text{ is entire, without compact support}', 0, 1.38, { color: 'red', size: 15 });
          if (which.value === 'exp') L.tex('\\bar\\partial f=0', 0, -0.32, { color: 'muted', size: 14 });
          if (eps > 0) {
            L.circle(zx, zy, eps, { fill: 'panel', fillAlpha: 0.72, stroke: false });
            L.circle(zx, zy, eps, { color: 'gold', width: 2.2 });
          }
          // ---- right: I(ε) and m(ε)
          const all = [...Ir, ...Ii, ...mr, ...mi, fz[0], fz[1]];
          const lo = Math.min(...all), hi = Math.max(...all), pad = Math.max(0.15, (hi - lo) * 0.12);
          R.setView(null, [lo - pad, hi + pad]);
          const ring = F.ring(az);
          if (ring) {
            R.vband(ring[0], Math.min(ring[1], Rmax), { color: 'orange', alpha: 0.08 });
            R.tex('\\text{circle meets }\\operatorname{supp}\\bar\\partial f', (ring[0] + Math.min(ring[1], Rmax)) / 2, hi + pad * 0.55, { color: 'orange', size: 13 });
            if (ring[0] > 0.12 * Rmax) R.text('plateau', ring[0] / 2, lo - pad * 0.5, { color: 'muted', size: 11.5, align: 'center' });
          }
          R.hline(0, { color: 'faint', width: 1 });
          R.path(Array.from(Ir, (y, i) => [i * h, y]), { color: 'blue', width: 2.4 });
          R.path(Array.from(Ii, (y, i) => [i * h, y]), { color: 'purple', width: 2.4 });
          for (let i = 0; i <= NR; i += 21) { R.dot(i * h, mr[i], { color: 'blue', r: 3.6, hollow: true, width: 1.6 }); R.dot(i * h, mi[i], { color: 'purple', r: 3.6, hollow: true, width: 1.6 }); }
          R.dot(0, fz[0], { color: 'green', r: 6.5 });
          R.dot(0, fz[1], { color: 'green', r: 6.5 });
          R.vline(eps, { color: 'gold', width: 1.6 });
          R.dot(eps, at(Ir, eps), { color: 'gold', r: 4.5 }); R.dot(eps, at(Ii, eps), { color: 'gold', r: 4.5 });
          st = { I: [at(Ir, eps), at(Ii, eps)], m: [at(mr, eps), at(mi, eps)], I0: [Ir[0], Ii[0]], fz, eps, raw: which.value === 'raw' };
          v.legend([['blue', '$\\operatorname{Re} I(\\varepsilon)$'], ['purple', '$\\operatorname{Im} I(\\varepsilon)$'], ['muted', 'circle means $m(\\varepsilon)$ (Re, Im)', { dot: true }], ['green', '$f(z)$', { dot: true }], ['gold', 'the chosen $\\varepsilon$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const c = (p) => `${v.fix(p[0], 4)} ${p[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(p[1]), 4)}\\,i`;
          const d = Math.hypot(s.I0[0] - s.fz[0], s.I0[1] - s.fz[1]);
          if (s.raw) return `$\\bar\\partial f\\equiv0$, so $I(\\varepsilon)=0$ for every $\\varepsilon$, while $f(z) = ${c(s.fz)}$ and every circle mean equals $f(z)$ (mean value property). Without compact support the boundary term at $\\infty$ survives and the formula fails.`;
          return `At $\\varepsilon=${v.fix(s.eps, 2)}$: $I(\\varepsilon)=${c(s.I)}$, circle mean $m(\\varepsilon)=${c(s.m)}$. Full integral $I(0)=${c(s.I0)}$ vs $f(z)=${c(s.fz)}$: difference $${v.sci(d, 1)}$ (quadrature error).`;
        });
      },
    },
    // ------------------------------------------------------------------ 20.4 Tietze
    {
      num: '20.4',
      kind: 'Theorem',
      name: "Tietze's extension theorem",
      credit: 'Tietze, 1915',
      verify: true,
      statement: String.raw`Let $K$ be a compact subset of a locally compact Hausdorff space $X$, and let $f\in C(K)$. Then there is a function $F\in C_c(X)$ with $F(x)=f(x)$ for every $x\in K$.`,
      idea: String.raw`Treat $\operatorname{Re}f$ and $\operatorname{Im}f$ separately and normalise to $-1\le f\le1$. Fix an open $W\supset K$ with compact closure (2.7). The sets $\{f\ge\frac13\}$ and $\{f\le-\frac13\}$ are disjoint compact subsets of $K$, so Urysohn's lemma (2.12) gives $g_1\in C_c(X)$, supported in $W$, equal to $\pm\frac13$ on them, with $|g_1|\le\frac13$; then $|f-g_1|\le\frac23$ on $K$. Repeating with the residual gives corrections $|g_n|\le\frac13(\frac23)^{n-1}$ and residuals $|f-\sum_{k\le n}g_k|\le(\frac23)^n$ on $K$. The series $F=\sum g_n$ converges uniformly (M-test, pma 7.10) to a continuous function that vanishes off $W$ and equals $f$ on $K$; moreover $|F|\le\sum\frac13(\frac23)^{n-1}=1$.`,
      caption: String.raw`Here $X=\R$ and $K$ is four closed intervals and a point. Drag the blue handles to change $f$ on $K$, and step the construction. Each correction $g_n$ (orange) is a pair of Urysohn tents: $+c_n$ on the set where the residual is $\ge c_n=\frac13(\frac23)^{n-1}$, $-c_n$ where it is $\le-c_n$, and $0$ off $W$. Below, the residual $f-F_n$ on $K$ stays in the band $\pm(\frac23)^n$; red and purple mark where the next step will act.`,
      deps: ['rca-2.12', 'rca-2.7', 'pma-7.10', 'pma-7.12'],
      see: ['rca-2.24'],
      tags: ['extension', 'Urysohn', 'continuous functions'],
      viz(v) {
        const M = v.M;
        const IV = [[-3.15, -2.25], [-1.6, -0.6], [0.12, 0.12], [0.65, 1.6], [2.2, 3.05]];
        const WAVE = [2, 3, 0, 1, 2], DW = 0.25, X0 = -3.75, X1 = 3.75;
        const steps = v.slider('steps $n$', 0, 10, 2, { int: true });
        const showG = v.toggle('show the last correction $g_n$', true);
        const T = v.stage({ x: [X0, X1], y: [-1.42, 1.3], height: 290, full: true, xticks: [-3, -2, -1, 0, 1, 2, 3], yticks: [-1, 0, 1], title: '$f$ on $K$ and the extension $F_n=g_1+\\dots+g_n$ on $\\R$' });
        const B = v.stage({ x: [X0, X1], y: [-1, 1], height: 180, full: true, axes: 'box', xticks: [-3, -2, -1, 0, 1, 2, 3], title: 'residual $f-F_n$ on $K$ (vertical scale follows the band $\\pm(2/3)^n$)' });
        const INIT = [[0.55, -0.25], [0.6, 0.75], [-0.8, -0.8], [-0.6, 0.4], [0.15, -0.75]];
        const handles = IV.map(([a, b], j) => (a === b
          ? [T.handle(a, INIT[j][0], { color: 'blue', r: 6, constrain: (x, y) => [a, M.clamp(y, -1, 1)] })]
          : [T.handle(a, INIT[j][0], { color: 'blue', r: 6, constrain: (x, y) => [a, M.clamp(y, -1, 1)] }), T.handle(b, INIT[j][1], { color: 'blue', r: 6, constrain: (x, y) => [b, M.clamp(y, -1, 1)] })]));
        const fOn = (j, x) => {
          const [a, b] = IV[j], hs = handles[j];
          if (a === b) return hs[0].y;
          const t = (x - a) / (b - a);
          return M.clamp(hs[0].y + (hs[1].y - hs[0].y) * t + 0.22 * Math.sin(WAVE[j] * Math.PI * t), -1, 1);
        };
        // samples of K (each component separately) and a grid on the line
        const KS = IV.map(([a, b]) => (a === b ? [a] : Array.from({ length: 260 }, (_, i) => a + (b - a) * i / 259)));
        const grid = Array.from({ length: 1500 }, (_, i) => X0 + (X1 - X0) * i / 1499);
        const dSet = (x, runs) => { let d = Infinity; for (const [lo, hi] of runs) d = Math.min(d, x < lo ? lo - x : x > hi ? x - hi : 0); return d; };
        const Kruns = IV.map(([a, b]) => [a, b]);
        const phi = (x) => Math.max(0, 1 - dSet(x, Kruns) / DW);
        // maximal runs of consecutive samples (within one component of K) where pred holds
        const runsOf = (r, pred) => {
          const out = [];
          KS.forEach((xs, j) => { let s = -1; for (let i = 0; i <= xs.length; i++) { const ok = i < xs.length && pred(r[j][i]); if (ok && s < 0) s = i; if (!ok && s >= 0) { out.push([xs[s], xs[i - 1]]); s = -1; } } });
          return out;
        };
        // Urysohn tents: 1 on each run, falling to 0 within half the distance to the other set (and within W)
        const gapTo = ([a1, a2], Bs) => { let d = Infinity; for (const [b1, b2] of Bs) d = Math.min(d, Math.max(0, b1 - a2, a1 - b2)); return d; };
        const tents = (A, Bs) => A.map((run) => [run[0], run[1], Math.min(DW, gapTo(run, Bs) / 2)]);
        const tentVal = (x, T) => { let u = 0; for (const [lo, hi, w] of T) { const d = x < lo ? lo - x : x > hi ? x - hi : 0; u = Math.max(u, 1 - d / w); } return u; };
        let st = null;
        v.render(() => {
          const n = steps.value;
          const fK = KS.map((xs, j) => xs.map((x) => fOn(j, x)));
          const r = fK.map((a) => a.slice());
          const F = new Float64Array(grid.length);
          let lastG = null;
          for (let k = 1; k <= n; k++) {
            const c = (1 / 3) * (2 / 3) ** (k - 1);
            const A = runsOf(r, (y) => y >= c), Bm = runsOf(r, (y) => y <= -c);
            const TA = tents(A, Bm), TB = tents(Bm, A);
            const g = (x) => c * (tentVal(x, TA) - tentVal(x, TB)) * phi(x);
            KS.forEach((xs, j) => xs.forEach((x, i) => { r[j][i] -= g(x); }));
            for (let i = 0; i < grid.length; i++) F[i] += g(grid[i]);
            if (k === n) lastG = g;
          }
          // ---- top
          const W = []; for (const [a, b] of IV) { const lo = a - DW, hi = b + DW; if (W.length && lo <= W[W.length - 1][1]) W[W.length - 1][1] = hi; else W.push([lo, hi]); }
          for (const [a, b] of W) T.vband(a, b, { color: 'orange', alpha: 0.07 });
          T.text('W', W[0][0] + 0.06, 1.18, { color: 'orange', size: 13, weight: 600, math: true });
          T.hline(1, { color: 'faint', width: 1, dash: [3, 4] }); T.hline(-1, { color: 'faint', width: 1, dash: [3, 4] });
          for (const [a, b] of IV) { if (a === b) T.dot(a, -1.3, { color: 'ink', r: 4.5 }); else T.line(a, -1.3, b, -1.3, { color: 'ink', width: 5, cap: 'butt' }); }
          T.text('K', IV[0][0] - 0.18, -1.3, { color: 'ink', size: 15, math: true, align: 'right' });
          if (showG.value && lastG) T.fn(lastG, { color: 'orange', width: 1.6, dash: [5, 4], n: 1500 });
          T.path(grid.map((x, i) => [x, F[i]]), { color: 'green', width: 2.3 });
          KS.forEach((xs, j) => { if (xs.length === 1) T.dot(xs[0], fK[j][0], { color: 'blue', r: 4 }); else T.path(xs.map((x, i) => [x, fK[j][i]]), { color: 'blue', width: 4.2, alpha: 0.75 }); });
          // ---- bottom: residual on K
          const band = (2 / 3) ** n, cn = band / 3;
          B.setView(null, [-1.3 * band, 1.3 * band]);
          B.setTicks(undefined, [[-band, `−(2/3)${sup(n)}`], [0, '0'], [band, `(2/3)${sup(n)}`]]);
          B.hband(-band, band, { color: 'green', alpha: 0.08, edges: true });
          B.hline(cn, { color: 'muted', width: 1, dash: [2, 4] }); B.hline(-cn, { color: 'muted', width: 1, dash: [2, 4] });
          let supR = 0;
          KS.forEach((xs, j) => {
            const pts = xs.map((x, i) => [x, r[j][i]]); for (const p of pts) supR = Math.max(supR, Math.abs(p[1]));
            if (xs.length === 1) { const y = pts[0][1]; B.dot(xs[0], y, { color: y >= cn ? 'red' : y <= -cn ? 'purple' : 'gold', r: 4.5 }); return; }
            B.path(pts, { color: 'gold', width: 2.2 });
            B.path(pts.map((p) => (p[1] >= cn ? p : null)), { color: 'red', width: 4 });
            B.path(pts.map((p) => (p[1] <= -cn ? p : null)), { color: 'purple', width: 4 });
          });
          B.text(`next threshold ±(2/3)${sup(n)}/3`, X1 - 0.08, cn, { color: 'muted', size: 11, align: 'right', baseline: 'bottom', dy: -3 });
          let supF = 0; for (const y of F) supF = Math.max(supF, Math.abs(y));
          st = { n, supR, band, supF };
          v.legend([['blue', '$f$ on $K$'], ['green', 'extension $F_n$'], ['orange', 'last correction $g_n$; $W$ shaded', { dash: true }], ['gold', 'residual $f-F_n$ on $K$'], ['red', 'where it is $\\ge c_{n+1}$'], ['purple', 'where it is $\\le -c_{n+1}$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$n=${s.n}$: $\\max_K|f-F_n| = ${v.fmt(s.supR, 3)}\\le(2/3)^{${s.n}} = ${v.fmt(s.band, 3)}$; $\\;\\max_{\\R}|F_n| = ${v.fix(s.supF, 3)}\\le1$, and $F_n=0$ outside $W$. As $n\\to\\infty$ the residual tends to $0$ uniformly, so $F=\\sum g_n$ extends $f$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 20.5 Mergelyan
    {
      num: '20.5',
      kind: 'Theorem',
      name: "Mergelyan's theorem",
      credit: 'Mergelyan, 1951',
      statement: String.raw`Let $K\subset\C$ be compact with connected complement $\C\setminus K$, and let $f$ be a continuous complex function on $K$ that is holomorphic in the interior of $K$. Then for every $\eps>0$ there is a polynomial $P$ with
$$|f(z)-P(z)|<\eps\qquad\text{for all }z\in K.$$`,
      idea: String.raw`All three hypotheses are needed: uniform limits of polynomials are continuous on $K$ and holomorphic in its interior, and a bounded component of $\C\setminus K$ obstructs (if $c$ lies in a hole, $\oint(\frac{1}{z-c}-P)\,dz=2\pi i$ around it). For the proof, extend $f$ to the plane (Tietze, 20.4) and let $\omega(\delta)$ be its modulus of continuity. Averaging $f$ against a radial bump of radius $\delta$ gives $\Phi\in C^1_c$ with $|f-\Phi|\le\omega(\delta)$ and $|\bar\partial\Phi|\le2\omega(\delta)/\delta$, and $\Phi=f$ near every point whose $\delta$-disc lies in the interior of $K$ (mean value property), so $\bar\partial\Phi$ lives in a layer $X$ of width $\delta$ along $\C\setminus\operatorname{int}K$. By 20.3, $\Phi$ is the Cauchy integral of $\bar\partial\Phi$ over $X$. Cover $X$ by finitely many discs of radius $\sim\delta$ centred off $K$; since $\C\setminus K$ is connected, each contains a piece $E_j$ of a path to $\infty$ that misses $K$. Replacing the kernel $\frac{1}{z-\zeta}$ for $\zeta$ in the $j$-th disc by $Q_\zeta$ from 20.2 gives $\Psi$, holomorphic off $\bigcup E_j$, hence near $K$, and the two estimates of 20.2 give $|\Phi-\Psi|\le C\,\omega(\delta)$ on $K$ with an absolute constant $C$. Runge's theorem (13.7) approximates $\Psi$ by a polynomial.`,
      caption: String.raw`$K$ is "Pac-Man": the closed unit disc minus an open sector of half-angle $\alpha$; colour shows the error $|f-P_N|$ of the least-squares polynomial $P_N$ on $K$. For $\sqrt{z-s}$, drag the branch point $s$ around $\partial K$: $f$ is continuous on $K$ and holomorphic inside but not near $s$, so Runge does not apply. Mergelyan still gives convergence, at an algebraic rate that depends on the boundary there (slowest at the mouth corner). The other examples break one hypothesis each — $\bar z$ (not holomorphic inside), $1/(z-c)$ with Pac-Man's eye cut out (a hole) — or show $\operatorname{int}K=\varnothing$: on an arc even $\bar z$ is approximable.`,
      deps: ['rca-20.4', 'rca-20.3', 'rca-20.2', 'rca-13.7', 'pma-4.19'],
      see: ['pma-7.26', 'pma-7.32', 'pma-7.33', 'rca-13.6'],
      tags: ['polynomial approximation', 'Mergelyan', 'Runge'],
      viz(v) {
        const M = v.M, DEG = Math.PI / 180, NMAX = 60;
        const EYE = [-0.16, 0.5], ER = 0.14;
        const MODES = [
          { value: 'sqrt', label: '$\\sqrt{z-s}$' },
          { value: 'conj', label: '$\\bar z$' },
          { value: 'eye', label: '$\\frac{1}{z-c}$, eye cut out' },
          { value: 'arc', label: '$\\bar z$ on an arc' },
        ];
        const mode = v.select('$f$:', MODES, 'sqrt');
        const Ns = v.slider('degree $N$', 1, NMAX, 24, { int: true });
        const aS = v.slider('mouth half-angle $\\alpha$', 8, 80, 32, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const L = v.stage({ x: [-1.22, 1.22], y: [-1.12, 1.12], equal: true, height: 370, weight: 1.15, axes: false, title: 'error $|f-P_N|$ on $K$' });
        const R = v.stage({ x: [-0.03, Math.log10(NMAX) + 0.04], y: [-4, 1], height: 370, axes: 'box', xlabel: 'N', xticks: [1, 2, 5, 10, 20, 50].map((n) => [Math.log10(n), String(n)]), title: '$\\max_K|f-P_N|$ against the degree (log–log)' });
        // ---- geometry of Pac-Man: ∂K = upper lip (0 → e^{iα}), arc, lower lip (e^{−iα} → 0)
        const geom = (al) => ({ al, Lam: 2 * Math.PI - 2 * al, len: 2 + 2 * Math.PI - 2 * al });
        const bd = (G, tau) => {
          tau = ((tau % G.len) + G.len) % G.len;
          if (tau <= 1) return [tau * Math.cos(G.al), tau * Math.sin(G.al)];
          if (tau <= 1 + G.Lam) { const th = G.al + tau - 1; return [Math.cos(th), Math.sin(th)]; }
          const t = 2 + G.Lam - tau; return [t * Math.cos(G.al), -t * Math.sin(G.al)];
        };
        let sPos = { piece: 1, u: 0 };   // the branch point: piece 0/2 = lips (t), piece 1 = arc (fraction u)
        const sTau = (G) => (sPos.piece === 0 ? sPos.t : sPos.piece === 1 ? 1 + sPos.u * G.Lam : 2 + G.Lam - sPos.t);
        const nearestBd = (x, y, al) => {
          const cand = [];
          for (const [piece, sg] of [[0, 1], [2, -1]]) { const t = M.clamp(x * Math.cos(al) + sg * y * Math.sin(al), 0, 1); const p = [t * Math.cos(al), sg * t * Math.sin(al)]; cand.push({ d: Math.hypot(x - p[0], y - p[1]), p, pos: { piece, t } }); }
          let th = Math.atan2(y, x); if (th < 0) th += 2 * Math.PI;
          th = th < al ? al : th > 2 * Math.PI - al ? 2 * Math.PI - al : th;
          const p = [Math.cos(th), Math.sin(th)]; cand.push({ d: Math.hypot(x - p[0], y - p[1]), p, pos: { piece: 1, u: (th - al) / (2 * Math.PI - 2 * al) } });
          return cand.reduce((a, b) => (b.d < a.d ? b : a));
        };
        const sH = L.handle(Math.cos(32 * DEG), Math.sin(32 * DEG), { color: 'gold', r: 6.5, label: 's', labelPos: 'ne', constrain: (x, y) => { const c = nearestBd(x, y, aS.value * DEG); sPos = c.pos; return c.p; } });
        const geoPts = (a, b, n) => Array.from({ length: n }, (_, i) => a * Math.pow(b / a, i / (n - 1)));
        const arcPts = (n) => Array.from({ length: n }, (_, i) => { const t = -Math.cos(Math.PI * i / (n - 1)); return [0.95 * t, 0.42 * Math.sin(Math.PI * t) + 0.08]; });
        const samples = (md, G, tS, dense) => {
          if (md === 'arc') return arcPts(dense ? 3000 : 700);
          const n = dense ? 2400 : 520, taus = [];
          for (let i = 0; i < n; i++) taus.push((i + 0.5) / n * G.len);
          const offs = geoPts(dense ? 1e-10 : 1e-7, 0.05, dense ? 60 : 26);
          const special = [0, 1, 1 + G.Lam]; if (md === 'sqrt') special.push(tS);
          for (const t0 of special) { taus.push(t0); for (const o of offs) taus.push(t0 + o, t0 - o); }
          const pts = taus.map((t) => bd(G, t));
          if (md === 'eye') { const ne = dense ? 700 : 160; for (let i = 0; i < ne; i++) { const th = 2 * Math.PI * (i + 0.5) / ne; pts.push([EYE[0] + ER * Math.cos(th), EYE[1] + ER * Math.sin(th)]); } }
          return pts;
        };
        const fFor = (md, s, d) => {
          if (md === 'sqrt') return (x, y) => sqrtCut(x - s[0], y - s[1], d);
          if (md === 'eye') return (x, y) => { const dx = x - EYE[0], dy = y - EYE[1], q = dx * dx + dy * dy; return [dx / q, -dy / q]; };
          return (x, y) => [x, -y];
        };
        let fit = null, fitKey = '', ras = null, rasKey = '', st = null;
        const lowC = v.rgb('panel'), blu = v.rgb('blue');
        v.render(() => {
          const md = mode.value, N = Ns.value, al = aS.value * DEG, G = geom(al);
          aS.el.hidden = md === 'arc';
          sH.visible = md === 'sqrt';
          const tS = sTau(G), s = bd(G, tS);
          sH.x = s[0]; sH.y = s[1];
          const cutDir = sPos.piece === 1 ? G.al + sPos.u * G.Lam : 0;
          const key = `${md}|${md === 'arc' ? '' : al}|${md === 'sqrt' ? tS : ''}`;
          if (key !== fitKey) {
            const f = fFor(md, s, cutDir);
            const fp = samples(md, G, tS, false), dp = samples(md, G, tS, true);
            const P = polyFit(fp, Float64Array.from(fp, (p) => f(p[0], p[1])[0]), Float64Array.from(fp, (p) => f(p[0], p[1])[1]), NMAX);
            const [Br, Bi] = P.basis(dp, NMAX);
            const gr = Float64Array.from(dp, (p) => f(p[0], p[1])[0]), gi = Float64Array.from(dp, (p) => f(p[0], p[1])[1]);
            const n = dp.length, pr = new Float64Array(n), pi = new Float64Array(n), curve = [];
            for (let k = 0; k <= NMAX; k++) {
              const a = P.cr[k], b = P.ci[k], qr = Br[k], qi = Bi[k]; let e = 0;
              for (let i = 0; i < n; i++) { pr[i] += a * qr[i] - b * qi[i]; pi[i] += a * qi[i] + b * qr[i]; const dr = pr[i] - gr[i], di = pi[i] - gi[i]; e = Math.max(e, dr * dr + di * di); }
              curve.push(Math.sqrt(e));
            }
            fit = { P, dp, Br, Bi, gr, gi, curve, f };
            fitKey = key;
          }
          const inK = (x, y) => {
            const r2 = x * x + y * y; if (r2 > 1) return false;
            if (md === 'eye' && (x - EYE[0]) ** 2 + (y - EYE[1]) ** 2 < ER * ER) return false;
            return Math.abs(Math.atan2(y, x)) >= al || r2 < 1e-12;
          };
          // pointwise error on the dense set at degree N; location of the maximum
          const n = fit.dp.length; let emax = 0, imax = 0; const errs = new Float64Array(n);
          for (let i = 0; i < n; i++) {
            let sr = 0, si = 0; for (let k = 0; k <= N; k++) { sr += fit.P.cr[k] * fit.Br[k][i] - fit.P.ci[k] * fit.Bi[k][i]; si += fit.P.cr[k] * fit.Bi[k][i] + fit.P.ci[k] * fit.Br[k][i]; }
            errs[i] = Math.hypot(sr - fit.gr[i], si - fit.gi[i]); if (errs[i] > emax) { emax = errs[i]; imax = i; }
          }
          const LO = -4, HI = md === 'eye' ? 1 : 0;
          const col = (e) => ramp3(v, [lowC[0] + (blu[0] - lowC[0]) * 0.22, lowC[1] + (blu[1] - lowC[1]) * 0.22, lowC[2] + (blu[2] - lowC[2]) * 0.22], v.rgb('gold'), v.rgb('red'), (Math.log10(e + 1e-300) - LO) / (HI - LO));
          // ---- left panel
          if (md !== 'arc') {
            const rk = `${fitKey}|${N}`;
            if (rk !== rasKey) {
              const [ar, ai] = fit.P.mono(N); let dev = 0;
              for (let i = 0; i < n; i += Math.floor(n / 23)) { const [a, b] = horner(ar, ai, fit.dp[i][0], fit.dp[i][1]), [c, d] = fit.P.evalAt(fit.dp[i][0], fit.dp[i][1], N); dev = Math.max(dev, Math.hypot(a - c, b - d) / (1 + Math.hypot(c, d))); }
              ras = dev < 1e-8 ? (x, y) => horner(ar, ai, x, y) : (x, y) => fit.P.evalAt(x, y, N);
              rasKey = rk;
            }
            L.raster((x, y) => { if (!inK(x, y)) return null; const [a, b] = ras(x, y), [c, d] = fit.f(x, y); return col(Math.hypot(a - c, b - d)); }, { key: rasKey, res: 2 });
            const outline = []; for (let i = 0; i <= 600; i++) outline.push(bd(G, G.len * i / 600));
            L.poly(outline, { color: 'ink', width: 1.6 });
            if (md === 'eye') { L.circle(EYE[0], EYE[1], ER, { color: 'ink', width: 1.6 }); xMark(L, EYE[0], EYE[1], 'ink', 4.5); L.tex('c', EYE[0], EYE[1], { color: 'ink', size: 14, dx: 9, dy: 8, align: 'left' }); }
            if (md === 'sqrt') {
              const d = [Math.cos(cutDir), Math.sin(cutDir)];
              L.line(s[0], s[1], s[0] + 3 * d[0], s[1] + 3 * d[1], { color: 'panel', width: 4.5 });
              L.line(s[0], s[1], s[0] + 3 * d[0], s[1] + 3 * d[1], { color: 'ink', width: 1.8, dash: [5, 4] });
            }
            L.tex('K', -0.62, -0.42, { color: 'ink', size: 18 });
          } else {
            const ap = fit.dp;
            L.path(ap, { color: 'ink', width: 10 });
            for (let i = 0; i + 1 < ap.length; i += 3) L.line(ap[i][0], ap[i][1], ap[Math.min(i + 4, ap.length - 1)][0], ap[Math.min(i + 4, ap.length - 1)][1], { color: col(errs[i]), width: 7, cap: 'butt' });
            L.tex('K', 0.25, 0.68, { color: 'ink', size: 18 });
          }
          const pm = fit.dp[imax];
          L.dot(pm[0], pm[1], { color: 'red', r: 9, hollow: true, width: 2.2 });
          { const a = Math.atan2(pm[1] - (md === 'arc' ? 0.6 : 0), pm[0]), cx = Math.cos(a), sy = Math.sin(a);
            L.text('max', pm[0], pm[1], { color: 'red', size: 12, weight: 600, dx: 16 * cx, dy: -16 * sy, align: cx > 0.35 ? 'left' : cx < -0.35 ? 'right' : 'center', baseline: sy > 0.35 ? 'bottom' : sy < -0.35 ? 'top' : 'middle' }); }
          // colour bar (bottom-left, in pixels)
          const bx = 12, by = L.height - 22, bw = 120;
          for (let i = 0; i < 40; i++) { const [x0, y0] = L.inv(bx + bw * i / 40, by - 7), [x1, y1] = L.inv(bx + bw * (i + 1) / 40 + 0.6, by); L.rect(x0, y1, x1, y0, { fill: col(10 ** (LO + (HI - LO) * (i + 0.5) / 40)), fillAlpha: 1, stroke: false }); }
          const [lx, ly] = L.inv(bx, by + 9), [rx] = L.inv(bx + bw, by);
          L.text(`10${sup(LO)}`, lx, ly, { color: 'muted', size: 10.5 }); L.text(HI >= 1 ? '10' : '1', rx, ly, { color: 'muted', size: 10.5, align: 'right' });
          // ---- right panel: error vs degree
          const ys = fit.curve.map((e) => Math.log10(e + 1e-300));
          const fail = md === 'conj' || md === 'eye';
          const bound = md === 'conj' ? 2 * (Math.PI - al) / (2 + 2 * Math.PI - 2 * al) : md === 'eye' ? 1 / ER : null;
          const ymin = Math.min(...ys.slice(1)), ymax = Math.max(...ys.slice(1));
          const y0 = Math.min(-2, Math.floor(ymin - 0.4)), y1 = Math.max(0.5, Math.ceil(ymax + 0.3));
          R.setView(null, [y0, y1]); R.setTicks(undefined, logTicks(y0, y1, y1 - y0 > 8 ? 2 : 1));
          if (bound) {
            const lb = Math.log10(bound);
            R.hband(y0 - 1, lb, { color: 'red', alpha: 0.06 });
            R.hline(lb, { color: 'red', width: 1.6, dash: [6, 4] });
            R.tex(md === 'conj' ? '\\max_K|\\bar z-P|\\ge 2|K|/|\\partial K|\\text{ for every }P' : '\\max_K|f-P|\\ge 1/\\rho\\text{ for every }P', Math.log10(NMAX), lb, { color: 'red', size: 13, align: 'right', baseline: 'top', dy: 7 });
            R.text('unreachable', Math.log10(NMAX), (y0 + lb) / 2, { color: 'red', size: 12, weight: 600, align: 'right', alpha: 0.55 });
          }
          const pts = ys.map((y, k) => (k ? [Math.log10(k), y] : null));
          R.path(pts, { color: fail ? 'red' : 'green', width: 2.5 });
          let slope = null;
          if (md === 'sqrt') {
            let sx = 0, sy = 0, sxx = 0, sxy = 0, c = 0;
            for (let k = 15; k <= NMAX; k++) { const x = Math.log10(k), y = ys[k]; sx += x; sy += y; sxx += x * x; sxy += x * y; c++; }
            slope = (c * sxy - sx * sy) / (c * sxx - sx * sx); const b0 = (sy - slope * sx) / c;
            R.line(0.6, b0 + slope * 0.6, Math.log10(NMAX) + 0.04, b0 + slope * (Math.log10(NMAX) + 0.04), { color: 'muted', width: 1.4, dash: [4, 4] });
            R.tex(`\\approx N^{${v.fix(slope, 2)}}`, 0.85, b0 + slope * 0.85, { color: 'muted', size: 14, align: 'right', baseline: 'top', dx: -4, dy: 6 });
          }
          R.vline(Math.log10(N), { color: 'muted', width: 1, dash: [3, 3] });
          R.dot(Math.log10(N), ys[N], { color: fail ? 'red' : 'green', r: 6 });
          L.setTitle(md === 'arc' ? 'error $|f-P_N|$ along the arc $K$ ($\\operatorname{int}K=\\varnothing$)' : md === 'eye' ? 'error on $K$ = Pac-Man minus its eye $D(c;\\rho)$' : 'error $|f-P_N|$ on $K$ (disc minus a sector)');
          st = { md, N, e: fit.curve[N], bound, slope, al, nd: fit.dp.length };
          const base = [['ink', '$\\partial K$']];
          if (md === 'sqrt') v.legend([...base, ['gold', 'branch point $s\\in\\partial K$ (drag)', { dot: true }], ['ink', 'branch cut, outside $K$', { dash: true }], ['green', '$\\max_K|f-P_N|$'], ['muted', 'fitted power law', { dash: true }], ['red', 'largest error', { dot: true }]]);
          else if (md === 'arc') v.legend([['ink', 'the arc $K$'], ['green', '$\\max_K|\\bar z-P_N|$'], ['red', 'largest error', { dot: true }]]);
          else v.legend([...base, ['red', md === 'conj' ? '$\\max_K|\\bar z-P_N|$' : '$\\max_K|\\frac1{z-c}-P_N|$'], ['red', 'lower bound valid for every polynomial', { dash: true }], ['red', 'largest error', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const e = `$\\max_K|f-P_{${s.N}}| = ${v.sci(s.e, 2)}$`;
          if (s.md === 'sqrt') return `${e}. All hypotheses hold, yet $f$ is not holomorphic on any neighbourhood of $s$, so this is beyond Runge's theorem. The error decays roughly like $N^{${v.fix(s.slope, 2)}}$: slowly, but to $0$. (Measured on ${s.nd} boundary points; by the maximum modulus theorem the maximum over $K$ is attained on $\\partial K$.)`;
          if (s.md === 'conj') return `${e}, never below $2|K|/|\\partial K| = ${v.fix(s.bound, 3)}$: since $\\oint_{\\partial K}\\bar z\\,dz = 2i\\,|K|$ while $\\oint_{\\partial K}P\\,dz=0$, every polynomial has $\\max_K|\\bar z-P|\\ge 2|K|/|\\partial K|$. The interior of $K$ is not empty and $\\bar z$ is not holomorphic there.`;
          if (s.md === 'eye') return `${e}, never below $1/\\rho = ${v.fix(s.bound, 2)}$: $f$ is holomorphic near $K$, but $c$ lies in a bounded component of $\\C\\setminus K$ and $\\oint_{|z-c|=\\rho}(f-P)\\,dz = 2\\pi i$ for every polynomial $P$.`;
          return `${e}. The arc has no interior points and does not separate the plane, so every continuous function on it — even $\\bar z$ — is a uniform limit of polynomials (for $K=[a,b]$ this is Weierstrass's theorem).`;
        });
      },
    },
  ],
};
