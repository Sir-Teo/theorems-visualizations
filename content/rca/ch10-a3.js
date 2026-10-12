// Rudin, Real and Complex Analysis — Chapter 10 (part 3): Cauchy in a convex set, power series, Morera, zeros

// ---------------------------------------------------------------- helpers shared by this file
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
function hornerXY(cr, ci, x, y) {
  let sr = 0, si = 0;
  for (let n = cr.length - 1; n >= 0; n--) { const t = sr * x - si * y + cr[n]; si = sr * y + si * x + ci[n]; sr = t; }
  return [sr, si];
}
// Distance from p to the segment [a, b] (all [x, y]).
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
const GL3 = [[0.1127016653792583, 5 / 18], [0.5, 8 / 18], [0.8872983346207417, 5 / 18]];
const cxs = (w, d = 4) => w.toString(d).replace('i', '\\,i');

export default {
  book: 'rca',
  chapter: 10,
  items: [
    {
      num: '10.14',
      kind: 'Theorem',
      name: "Cauchy's theorem in a convex set",
      statement: String.raw`Suppose $\Omega$ is a convex open set, $p\in\Omega$, $f$ is continuous on $\Omega$, and $f\in H(\Omega\setminus\{p\})$. Then $f=F'$ for some $F\in H(\Omega)$. Hence
$$\int_\gamma f(z)\,dz=0$$
for every closed path $\gamma$ in $\Omega$.`,
      idea: String.raw`Fix $a\in\Omega$ and put $F(z)=\int_{[a,z]}f(\zeta)\,d\zeta$; convexity is exactly what keeps every segment $[a,z]$ inside $\Omega$. For $z,z_0\in\Omega$ the whole triangle $a,z_0,z$ lies in $\Omega$, so Cauchy–Goursat (10.13) gives $F(z)-F(z_0)=\int_{[z_0,z]}f$. Dividing by $z-z_0$ and using the continuity of $f$ at $z_0$ yields $F'(z_0)=f(z_0)$. Since $F'=f$ is continuous, 10.12 finishes the proof.`,
      caption: String.raw`Two regions, the same $f(z)=1/z$ (holomorphic on both, since $0\notin\Omega$). In each, drag the base point $a$, the probe $z$ and the gold circle $\gamma$ (centre and rim). The colours show $F(z)=\int_{[a,z]}d\zeta/\zeta$ at every point whose segment from $a$ stays in $\Omega$; grey points cannot be reached that way. In the convex disc every point is reached, $F$ is a primitive on all of $\Omega$, and every closed path gives $0$. In the annulus the hole casts a shadow, and a circle around the hole gives $2\pi i$.`,
      deps: ['rca-10.13', 'rca-10.12', 'pma-2.17'],
      see: ['rca-10.35'],
      tags: ['Cauchy', 'convexity', 'primitive'],
      viz(v) {
        const { Cx, TAU, contourIntegral } = v.M;
        const DC = [1.0, 0.1], DR = 0.95, R0 = 0.5, R1 = 1.6;
        const PAN = [
          { name: 'disc', title: 'convex: a disc $\\Omega$ with $0\\notin\\Omega$', view: { x: [-0.25, 2.2], y: [-1.05, 1.25] },
            inside: (x, y) => Math.hypot(x - DC[0], y - DC[1]) < DR, segOK: () => true,
            proj: (x, y) => { const dx = x - DC[0], dy = y - DC[1], r = Math.hypot(dx, dy), m = DR * 0.95; return r > m ? [DC[0] + dx * m / r, DC[1] + dy * m / r] : [x, y]; },
            init: { a: [0.55, -0.4], z: [1.5, 0.65], c: [1.05, 0.15], r: 0.55 } },
          { name: 'ann', title: 'not convex: the annulus $0.5<|z|<1.6$', view: { x: [-1.75, 1.75], y: [-1.75, 1.75] },
            inside: (x, y) => { const r = Math.hypot(x, y); return r > R0 && r < R1; }, segOK: (a, z) => segDist([0, 0], a, z) > R0,
            proj: (x, y) => { const r = Math.hypot(x, y) || 1, rr = Math.min(R1 * 0.96, Math.max(R0 * 1.1, r)); return [x * rr / r, y * rr / r]; },
            init: { a: [1.05, -0.45], z: [-0.95, 0.55], c: [0.05, 0.05], r: 1.05 } },
        ];
        for (const P of PAN) {
          P.S = v.stage({ ...P.view, equal: true, height: 330, ticks: false, title: P.title });
          P.a = P.S.handle(...P.init.a, { color: 'ink', label: 'a', labelPos: 'sw', constrain: P.proj });
          P.z = P.S.handle(...P.init.z, { color: 'accent', label: 'z', labelPos: 'ne', constrain: P.proj });
          P.c = P.S.handle(...P.init.c, { color: 'gold', r: 5.5 });
          P.rh = P.S.handle(P.init.c[0] + P.init.r, P.init.c[1], { color: 'gold', r: 5 });
          P.prev = [P.c.x, P.c.y];
          P.c.onDrag = () => { P.rh.x += P.c.x - P.prev[0]; P.rh.y += P.c.y - P.prev[1]; P.prev = [P.c.x, P.c.y]; };
        }
        const st = [];
        v.render(() => {
          const bg = v.rgb('panel'), gr = v.rgb('muted');
          PAN.forEach((P, idx) => {
            const S = P.S, A = [P.a.x, P.a.y];
            P.prev = [P.c.x, P.c.y];
            S.raster((x, y) => {
              if (!P.inside(x, y)) return null;
              if (!P.segOK(A, [x, y])) return [bg[0] + (gr[0] - bg[0]) * 0.38, bg[1] + (gr[1] - bg[1]) * 0.38, bg[2] + (gr[2] - bg[2]) * 0.38];
              // ∫_[a,z] dζ/ζ = log|z/a| + i·(angle swept by the segment) = principal Log(z/a), because 0 ∉ [a,z]
              const q = new Cx(x, y).div(new Cx(A[0], A[1])); return phaseRGB(v.M, Math.log(q.abs()), q.arg());
            }, { key: `${A}`, res: 2 });
            if (P.name === 'disc') S.circle(DC[0], DC[1], DR, { color: 'ink', width: 2 });
            else { S.circle(0, 0, R1, { color: 'ink', width: 2 }); S.circle(0, 0, R0, { color: 'ink', width: 2 }); }
            xMark(S, 0, 0, 'red');
            const ok = P.segOK(A, [P.z.x, P.z.y]);
            S.line(P.a.x, P.a.y, P.z.x, P.z.y, { color: 'panel', width: 5 });
            S.line(P.a.x, P.a.y, P.z.x, P.z.y, { color: ok ? 'green' : 'red', width: 2.4, dash: ok ? null : [6, 4] });
            const cc = new Cx(P.c.x, P.c.y), r = Math.max(0.12, Math.hypot(P.rh.x - P.c.x, P.rh.y - P.c.y));
            const g = (t) => cc.add(Cx.polar(r, TAU * t));
            S.curve(g, 0, 1, { color: 'panel', width: 5 }); S.curve(g, 0, 1, { color: 'gold', width: 2.4 });
            for (const t of [0.2, 0.53, 0.86]) { const p = g(t), q = g(t + 0.03); S.arrow(p.re, p.im, q.re, q.im, { color: 'gold', head: 11, width: 2.2 }); }
            S.text('γ', g(0.375).re, g(0.375).im, { color: 'gold', math: true, size: 18, dx: -12, dy: -10 });
            let inOm = true; for (let k = 0; k < 120; k++) { const p = g(k / 120); if (!P.inside(p.re, p.im)) { inOm = false; break; } }
            const I = Math.abs(cc.abs() - r) > 1e-3 ? contourIntegral((w) => new Cx(1, 0).div(w), g, 1200) : null;
            const zero = I && I.abs() < 1e-6;
            S.corner(!inOm ? 'γ leaves Ω' : zero ? '∮γ dz/z = 0' : `∮γ dz/z = ${v.fmt(I.im, 4)} i`, 'tl', { color: !inOm ? 'muted' : zero ? 'green' : 'red', weight: 600 });
            st[idx] = { ok, I, inOm, Fz: ok ? new Cx(P.z.x, P.z.y).div(new Cx(P.a.x, P.a.y)).log() : null };
          });
          v.legend([['green', 'segment $[a,z]\\subset\\Omega$'], ['red', 'segment leaves $\\Omega$', { dash: true }], ['gold', 'closed path $\\gamma$'], ['muted', 'not reachable by a segment from $a$', { area: true }]]);
        });
        v.readout(() => {
          if (!st[1]) return '';
          const part = (s, nm) => {
            const fz = s.ok ? `$F(z) = ${cxs(s.Fz, 3)}$` : '$[a,z]\\not\\subset\\Omega$, $F(z)$ undefined';
            const gi = !s.inOm ? '$\\gamma\\not\\subset\\Omega$' : `$\\oint_\\gamma\\frac{dz}{z} = ${cxs(s.I, 4)}$`;
            return `**${nm}:** ${fz}, ${gi}`;
          };
          return `${part(st[0], 'disc')}. $\\quad$ ${part(st[1], 'annulus')}` + (st[1].inOm && st[1].I && st[1].I.abs() > 1 ? ' $= 2\\pi i$: no primitive of $1/z$ exists on the annulus.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ power series representation
    {
      num: '10.16',
      kind: 'Theorem',
      name: 'Holomorphic functions are representable by power series',
      statement: String.raw`For every open set $\Omega$ in the plane, every $f\in H(\Omega)$ is representable by power series in $\Omega$: if $D(a;R)\subset\Omega$, then $f(z)=\sum_{n\ge0}c_n(z-a)^n$ for all $z\in D(a;R)$.`,
      idea: String.raw`Take $D(a;R)\subset\Omega$ and $r<R$. Cauchy's formula in the convex set $D(a;R)$ (10.15, with the circle of radius $r$, for which $\Ind=1$ inside by 10.11) writes $f(z)=\frac1{2\pi i}\int_{|\zeta-a|=r}\frac{f(\zeta)\,d\zeta}{\zeta-z}$ for $|z-a|<r$. This is a Cauchy-type integral of a finite measure on the circle, so 10.7 expands it in powers of $z-a$; the coefficients $c_n=\frac1{2\pi i}\int\frac{f(\zeta)\,d\zeta}{(\zeta-a)^{n+1}}$ do not depend on $r$ (they equal $f^{(n)}(a)/n!$), so one series works on all of $D(a;R)$.`,
      caption: String.raw`Drag the centre $a$. The coefficients are computed exactly as in the proof, by the Cauchy integral over a circle inside $\Omega$. Left: $f$; right: the partial sum $S_N$ — identical inside the green disc $D(a;R)$, the largest disc in $\Omega$, and unrelated outside. Bottom: real parts along the horizontal line through $a$. $\frac{1}{1+z^2}$ is perfectly smooth on $\R$, yet its series about $0$ stops at $|x|=1$: the poles $\pm i$ are invisible on the real line.`,
      deps: ['rca-10.15', 'rca-10.7', 'rca-10.11', 'rca-10.5'],
      see: ['pma-8.1', 'pma-3.39', 'fa-3.31'],
      tags: ['power series', 'Taylor series'],
      viz(v) {
        const { Cx, TAU } = v.M;
        const one = new Cx(1, 0);
        const FN = {
          rat: { label: '$\\frac{1}{1+z^2}$', f: (z) => one.div(one.add(z.mul(z))), sing: [new Cx(0, 1), new Cx(0, -1)], a: [0, 0] },
          tan: { label: '$\\tan z$', f: (z) => z.sin().div(z.cos()), sing: [-3, -1, 1, 3].map((k) => new Cx(k * Math.PI / 2, 0)), a: [0.35, 0.3] },
          log: { label: '$\\operatorname{Log}(1+z)$', f: (z) => one.add(z).log(), sing: [new Cx(-1, 0)], slit: true, a: [-0.2, 0.35] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'rat');
        const Ns = v.slider('terms $N$', 1, 40, 12, { int: true });
        const view = { x: [-2.6, 2.6], y: [-1.8, 1.8] };
        const L = v.stage({ ...view, equal: true, height: 300, ticks: false, title: '$f$ and the largest disc $D(a;R)\\subset\\Omega$' });
        const R = v.stage({ ...view, equal: true, height: 300, ticks: false, title: 'the partial sum $S_N(z)=\\sum_{n\\le N}c_n(z-a)^n$' });
        const B = v.stage({ x: view.x, y: [-2, 2], height: 190, full: true, axes: true, title: 'real parts along the horizontal line through $a$: $f$ (ink) and $S_N$ (gold)' });
        const a = L.handle(0, 0, { color: 'ink', label: 'a', labelPos: 'ne' });
        const distOm = (F, p) => { let d = Math.min(...F.sing.map((s) => s.sub(p).abs())); if (F.slit) d = Math.min(d, p.re <= -1 ? Math.abs(p.im) : p.sub(new Cx(-1, 0)).abs()); return d; };
        let last = null, st = null;
        v.render(() => {
          const key = which.value, F = FN[key], N = Ns.value;
          if (last !== key) { last = key; [a.x, a.y] = F.a; }
          let ac = new Cx(a.x, a.y);
          if (distOm(F, ac) < 0.08) { a.x += 0.1; ac = new Cx(a.x, a.y); }
          const Rad = distOm(F, ac), rho = 0.8 * Rad, M = 128, NC = 41;
          // Cauchy-integral coefficients: c_n = (1/2πi)∮_{|ζ−a|=ρ} f(ζ)(ζ−a)^{−n−1} dζ, by the trapezoid rule
          const cr = new Float64Array(NC), ci = new Float64Array(NC);
          for (let k = 0; k < M; k++) {
            const th = TAU * k / M, w = F.f(ac.add(Cx.polar(rho, th)));
            for (let n = 0; n < NC; n++) { const e = Cx.polar(rho ** -n / M, -n * th), t = w.mul(e); cr[n] += t.re; ci[n] += t.im; }
          }
          const sr = cr.subarray(0, N + 1), si = ci.subarray(0, N + 1);
          L.domain(F.f, { key, res: 2 });
          R.raster((x, y) => { const [re, im] = hornerXY(sr, si, x - ac.re, y - ac.im); return phaseRGB(v.M, re, im); }, { key: `${key}|${a.x},${a.y},${N}`, res: 2 });
          for (const S of [L, R]) {
            if (F.slit) { S.line(-1, 0, -9, 0, { color: 'panel', width: 6 }); S.line(-1, 0, -9, 0, { color: 'ink', width: 3 }); }
            S.circle(ac.re, ac.im, Rad, { color: 'panel', width: 5 });
            S.circle(ac.re, ac.im, Rad, { color: 'green', width: 2.4 });
            for (const s of F.sing) xMark(S, s.re, s.im);
          }
          R.dot(ac.re, ac.im, { color: 'ink', r: 4.5, label: 'a', labelPos: 'ne' });
          // root test on the computed coefficients
          let ls = 0; for (let n = 22; n < NC; n++) ls = Math.max(ls, Math.hypot(cr[n], ci[n]) ** (1 / n));
          const Rroot = 1 / ls, nearest = Math.min(...F.sing.map((s) => s.sub(ac).abs()));
          // bottom: real parts along y = Im a
          const yy = ac.im;
          B.vband(ac.re - Rad, ac.re + Rad, { color: 'green', alpha: 0.1, edges: true });
          B.fn((x) => F.f(new Cx(x, yy)).re, { color: 'ink', width: 2.4 });
          B.fn((x) => hornerXY(sr, si, x - ac.re, 0)[0], { color: 'gold', width: 2.2 });
          B.dot(ac.re, F.f(ac).re, { color: 'ink', r: 4 });
          st = { Rad, Rroot, nearest, key, N, slitNear: F.slit && Rroot > Rad * 1.05 };
          v.legend([['green', 'largest disc $D(a;R)$ in $\\Omega$'], ['ink', 'singularities / slit of $f$', { dot: true }], ['gold', '$\\Re S_N$ on the line']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          let out = `$R = \\operatorname{dist}(a,\\C\\setminus\\Omega) = ${v.fix(s.Rad, 3)}$; root test on the computed coefficients: $1/\\limsup|c_n|^{1/n} \\approx ${v.fix(s.Rroot, 3)}$; nearest singularity at distance $${v.fix(s.nearest, 3)}$.`;
          if (s.slitNear) out += ' The series converges beyond $D(a;R)$ — but across the slit it sums to a different branch of the logarithm; the theorem only promises $D(a;R)$.';
          return out;
        });
      },
    },
    {
      num: '10.16a',
      kind: 'Corollary',
      name: 'The derivative of a holomorphic function is holomorphic',
      verify: true,
      statement: String.raw`If $f\in H(\Omega)$, then $f'\in H(\Omega)$. Consequently every $f\in H(\Omega)$ has complex derivatives of all orders in $\Omega$, all of them holomorphic.`,
      idea: String.raw`By 10.16, $f$ is representable by power series in $\Omega$; by 10.6, $f'$ is then representable by power series too, hence holomorphic. Iterating gives all higher derivatives. Nothing like this holds for real functions: one derivative on $\R$ does not even make the derivative continuous.`,
      caption: String.raw`Left, the real contrast: $g(x)=x^2\sin(1/x)$, $g(0)=0$, is differentiable everywhere, but $g'$ (orange) keeps oscillating between $\pm1$ at every zoom level, so $g'$ is not continuous at $0$, let alone differentiable. Right: the $k$-th derivative of $f(z)=1/(1+z^2)$ on $\Omega=\C\setminus\{\pm i\}$; raise $k$ — each one is again holomorphic (smooth phase, poles of order $k+1$). Drag $w$ to test complex differentiability of $f^{(k)}$ numerically.`,
      deps: ['rca-10.16', 'rca-10.6'],
      see: ['pma-5.12a'],
      tags: ['holomorphic', 'derivatives'],
      viz(v) {
        const { Cx, TAU, factorial } = v.M;
        const zoom = v.slider('zoom on $\\R$: window $[-w,w]$', 0.002, 0.5, 0.25, { log: true, fmt: (x) => v.fmt(x, 2) });
        const kS = v.slider('order $k$ of $f^{(k)}$', 0, 5, 1, { int: true });
        const L = v.stage({ x: [-0.25, 0.25], y: [-1.35, 1.35], height: 330, axes: true, xlabel: 'x', title: "real: the derivative of $g(x)=x^2\\sin\\frac1x$ on $[-w,w]$" });
        const R = v.stage({ x: [-2.2, 2.2], y: [-1.65, 1.65], equal: true, height: 330, ticks: false, title: 'complex: the phase of $f^{(k)}$, $f(z)=\\frac{1}{1+z^2}$' });
        const w = R.handle(0.7, 0.45, { color: 'ink', label: 'w', labelPos: 'ne' });
        const I = new Cx(0, 1);
        // f = (1/2i)[(z−i)^{-1} − (z+i)^{-1}],  f^{(k)} = (1/2i)(−1)^k k! [(z−i)^{−k−1} − (z+i)^{−k−1}]
        const dk = (z, k) => { const c = factorial(k) * (k % 2 ? -1 : 1); return new Cx(1, 0).div(z.sub(I).pow(k + 1)).sub(new Cx(1, 0).div(z.add(I).pow(k + 1))).scale(c).div(new Cx(0, 2)); };
        let st = null;
        v.render(() => {
          const W = zoom.value, k = kS.value;
          L.setView([-W, W], null);
          L.setTicks([-W, W].map((x) => [x * 0.9, v.fmt(x * 0.9, 2)]), null);
          const gp = (x) => (x === 0 ? 0 : 2 * x * Math.sin(1 / x) - Math.cos(1 / x));
          L.hband(-1, 1, { color: 'orange', alpha: 0.06 });
          L.fn(gp, { color: 'orange', width: 1.4, n: 4000 });
          L.dot(0, 0, { color: 'red', r: 5, label: "g′(0) = 0", labelPos: 'ne' });
          L.corner(`|g(x)| ≤ x² ≤ ${v.fmt(W * W, 2)} here, yet g′ still swings over [−1, 1]`, 'bl');
          // complex side
          R.domain((z) => dk(z, k), { key: 'k' + k, res: 2 });
          xMark(R, 0, 1); xMark(R, 0, -1);
          const wc = new Cx(w.x, w.y), h = 1e-3;
          let spread = 0; const qs = [];
          for (let j = 0; j < 8; j++) { const e = Cx.polar(h, TAU * j / 8); qs.push(dk(wc.add(e), k).sub(dk(wc, k)).div(e)); }
          for (const p of qs) for (const q of qs) spread = Math.max(spread, p.sub(q).abs());
          R.circle(wc.re, wc.im, 0.12, { color: 'ink', width: 1.4, dash: [3, 3] });
          st = { k, spread, q: qs[0], exact: dk(wc, k + 1) };
          v.legend([['orange', "$g'(x)=2x\\sin\\frac1x-\\cos\\frac1x$ — no limit at $0$"], ['red', "$g'(0)=\\lim_{h\\to0}h\\sin\\frac1h=0$", { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `At $w$: difference quotients of $f^{(${s.k})}$ with $|h| = 10^{-3}$ in 8 directions agree to within $${v.fmt(s.spread, 2)}$, and approximate $f^{(${s.k + 1})}(w) = ${cxs(s.exact, 4)}$ — so $f^{(${s.k})}$ is again complex differentiable.`;
        });
      },
    },
    {
      num: '10.17',
      kind: 'Theorem',
      name: "Morera's theorem",
      statement: String.raw`Suppose $f$ is a continuous complex function in an open set $\Omega$ such that
$$\int_{\partial\Delta}f(z)\,dz=0$$
for every closed triangle $\Delta\subset\Omega$. Then $f\in H(\Omega)$.`,
      idea: String.raw`Holomorphy is local, so work in a disc $V\subset\Omega$. As in the proof of 10.14, $F(z)=\int_{[a,z]}f$ satisfies $F(z)-F(z_0)=\int_{[z_0,z]}f$ thanks to the vanishing triangle integrals, and continuity of $f$ gives $F'=f$ in $V$. So $F\in H(V)$, and by 10.16a its derivative $f$ is holomorphic too. Together with Cauchy–Goursat this makes "all triangle integrals vanish" an exact characterisation of holomorphy for continuous functions.`,
      caption: String.raw`Drag the triangle's vertices: its boundary integral is in the readout. The right panel is a "Morera detector": at every point it integrates $f$ around a tiny triangle and divides by the area (log scale; dark means $0$). For $e^z\sin z$ it vanishes everywhere. For $\bar z$ it equals $2$ everywhere — $\bar z$ is continuous but no triangle integral is $0$. For the principal $\sqrt z$ it is $0$ except along $(-\infty,0]$, where $\sqrt z$ is not even continuous.`,
      deps: ['rca-10.14', 'rca-10.16a'],
      see: ['rca-10.13'],
      tags: ['Morera', 'holomorphic', 'triangles'],
      viz(v) {
        const { Cx } = v.M;
        const FN = {
          hol: { label: '$e^z\\sin z$', f: (z) => z.exp().mul(z.sin()) },
          conj: { label: '$\\bar z$', f: (z) => z.conj() },
          sqrt: { label: '$\\sqrt z$ (principal)', f: (z) => z.sqrt() },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sqrt');
        const L = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, height: 330, ticks: false, title: 'phase of $f$ and a triangle $\\Delta$' });
        const R = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, height: 330, ticks: false, title: '$\\log_{10}\\bigl(|\\int_{\\partial T}f|\\,/\\,\\text{area}(T)\\bigr)$ for tiny $T$ at each point' });
        const V = [L.handle(-1.4, 0.35, { color: 'ink' }), L.handle(-0.4, -0.9, { color: 'ink' }), L.handle(0.3, 0.95, { color: 'ink' })];
        const triInt = (f, T) => { let s = new Cx(0, 0); for (let e = 0; e < 3; e++) { const u = T[e], w = T[(e + 1) % 3], d = w.sub(u); for (const [x, wt] of GL3) s = s.add(f(u.add(d.scale(x))).mul(d).scale(wt)); } return s; };
        const triIntFine = (f, T) => { let s = new Cx(0, 0); for (let e = 0; e < 3; e++) { const u = T[e], w = T[(e + 1) % 3], d = w.sub(u); const m = 200; for (let j = 0; j < m; j++) for (const [x, wt] of GL3) s = s.add(f(u.add(d.scale((j + x) / m))).mul(d).scale(wt / m)); } return s; };
        const EPS = 0.035, area = 0.75 * Math.sqrt(3) * EPS * EPS;
        const off = [0, 1, 2].map((j) => Cx.polar(EPS, Math.PI / 2 + j * 2 * Math.PI / 3));
        let st = null;
        v.render(() => {
          const key = which.value, f = FN[key].f;
          L.domain(f, { key, res: 2 });
          R.heat((x, y) => { const c = new Cx(x, y); const s = triInt(f, off.map((o) => c.add(o))); return Math.log10(s.abs() / area + 1e-300); }, { key, range: [-3, 2.2], cmap: 'magma', res: 3 });
          const T = V.map((h) => new Cx(h.x, h.y)), pts = T.map((w) => [w.re, w.im]);
          for (const S of [L, R]) { S.poly(pts, { color: 'panel', width: 5 }); S.poly(pts, { color: S === L ? 'ink' : 'gold', width: 2.2, fill: S === L ? 'ink' : null, fillAlpha: 0.08 }); }
          for (let e = 0; e < 3; e++) { const u = T[e], w = T[(e + 1) % 3], m = u.add(w).scale(0.5), m2 = u.add(w.sub(u).scale(0.56)); L.arrow(m.re, m.im, m2.re, m2.im, { color: 'ink', head: 11, width: 2.2 }); }
          if (key === 'sqrt') { L.line(0, 0, -9, 0, { color: 'panel', width: 3 }); L.line(0, 0, -9, 0, { color: 'ink', width: 1.4, dash: [5, 4] }); }
          R.corner('black: the triangle integrals vanish', 'bl', { color: 'gray', halo: false });
          const I = triIntFine(f, T);
          let ar = 0; for (let e = 0; e < 3; e++) ar += (T[e].re * T[(e + 1) % 3].im - T[(e + 1) % 3].re * T[e].im) / 2;
          let cross = false; if (key === 'sqrt') for (let e = 0; e < 3; e++) { const u = T[e], w = T[(e + 1) % 3]; if ((u.im > 0) !== (w.im > 0)) { const xr = u.re + (w.re - u.re) * (0 - u.im) / (w.im - u.im); if (xr < 0) cross = true; } }
          st = { I, key, ar, cross };
          v.legend([['ink', 'triangle $\\Delta$ (left), its outline (right, gold)'], ['muted', 'magma scale: dark $=0$, bright $\\ge 10^{2}$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const val = `$\\int_{\\partial\\Delta}f(z)\\,dz = ${cxs(s.I, 4)}$`;
          if (s.key === 'hol') return `${val}: zero for every triangle, and $f$ is holomorphic — the two conditions are equivalent (Goursat + Morera).`;
          if (s.key === 'conj') return `${val} $= 2i\\cdot\\text{area}$ (signed area $${v.fix(s.ar, 3)}$): never $0$ for a genuine triangle, so $\\bar z$ is not holomorphic.`;
          return `${val}: ` + (s.cross ? 'the triangle straddles the cut $(-\\infty,0)$, where $\\sqrt z$ jumps.' : 'zero — this triangle misses the cut; move it across $(-\\infty,0)$ to break it.');
        });
      },
    },
    // ------------------------------------------------------------------ the set of zeros
    {
      num: '10.18',
      kind: 'Theorem',
      name: 'Zeros of a holomorphic function are isolated',
      statement: String.raw`Let $\Omega$ be a region (a connected open set), $f\in H(\Omega)$, and $Z(f)=\{a\in\Omega: f(a)=0\}$. Then either $Z(f)=\Omega$, or $Z(f)$ has no limit point in $\Omega$. In the latter case, to each $a\in Z(f)$ corresponds a unique positive integer $m=m(a)$, the **order** of the zero, such that
$$f(z)=(z-a)^m g(z)\qquad(z\in\Omega)$$
with $g\in H(\Omega)$ and $g(a)\ne0$; moreover $Z(f)$ is at most countable.`,
      idea: String.raw`Let $A$ be the set of limit points of $Z(f)$ in $\Omega$; it is closed in $\Omega$. If $a\in Z(f)$ and not all Taylor coefficients at $a$ vanish, let $c_m$ be the first nonzero one: then $f=(z-a)^mg$ with $g(a)=c_m\ne0$, so by continuity $g\ne0$ near $a$ and $a$ is an isolated zero. Hence a point of $A$ has all its coefficients $0$, so $f\equiv0$ on a disc around it, and $A$ is open as well. Connectedness forces $A=\emptyset$ or $A=\Omega$. Countability: each compact subset of $\Omega$ contains finitely many zeros.`,
      caption: String.raw`Drag the zeros $a$, $b$, $c$ of $f(z)=(z-a)^m(z-b)(z-c)^2e^{z/2}$ and set the order $m$. Around a zero of order $m$ every colour appears $m$ times: the readout counts how often $f$ winds around $0$ along the dashed circle. Right: $g=f/(z-a)^m$ — the zero at $a$ is gone, $g(a)\ne0$. Push $b$ onto $a$ and the orders add up.`,
      deps: ['rca-10.16', 'rca-10.6a', 'rca-10.2'],
      see: ['pma-8.5'],
      tags: ['zeros', 'identity theorem'],
      viz(v) {
        const { Cx, TAU } = v.M;
        const mS = v.slider('order $m$ of the zero at $a$', 1, 5, 3, { int: true });
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, height: 340, ticks: false, title: 'phase of $f(z)=(z-a)^m(z-b)(z-c)^2e^{z/2}$' });
        const R = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, height: 340, ticks: false, title: 'phase of $g(z)=f(z)/(z-a)^m$' });
        const a = L.handle(-0.75, 0.25, { color: 'ink', label: 'a', labelPos: 'nw' });
        const b = L.handle(0.65, 0.75, { color: 'ink', label: 'b', labelPos: 'ne' });
        const c = L.handle(0.85, -0.65, { color: 'ink', label: 'c', labelPos: 'se' });
        let st = null;
        v.render(() => {
          const m = mS.value, A = new Cx(a.x, a.y), Bz = new Cx(b.x, b.y), Cz = new Cx(c.x, c.y);
          const g = (z) => z.sub(Bz).mul(z.sub(Cz).pow(2)).mul(z.scale(0.5).exp());
          const f = (z) => z.sub(A).pow(m).mul(g(z));
          const key = [a.x, a.y, b.x, b.y, c.x, c.y, m].join(',');
          L.domain(f, { key, res: 2, contours: false });
          R.domain(g, { key: key + 'g', res: 2, contours: false });
          const others = [Bz, Cz].map((w) => w.sub(A).abs());
          const rho = Math.max(0.12, Math.min(0.35, 0.5 * Math.min(...others.filter((d) => d > 0.12)), 0.35));
          L.circle(A.re, A.im, rho, { color: 'panel', width: 4 }); L.circle(A.re, A.im, rho, { color: 'ink', width: 1.6, dash: [4, 3] });
          // winding number of f along |z − a| = ρ
          let tot = 0, prev = f(A.add(Cx.polar(rho, 0))).arg();
          for (let k = 1; k <= 720; k++) { const t = f(A.add(Cx.polar(rho, TAU * k / 720))).arg(); let d = t - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; tot += d; prev = t; }
          const wind = Math.round(tot / TAU);
          L.text(`m = ${m}`, A.re, A.im - rho, { color: 'ink', align: 'center', dy: 13, size: 12, weight: 600 });
          L.text('1', Bz.re, Bz.im, { color: 'ink', align: 'center', dy: 15, size: 12, weight: 600 });
          L.text('2', Cz.re, Cz.im, { color: 'ink', align: 'center', dy: 15, size: 12, weight: 600 });
          R.dot(A.re, A.im, { color: 'ink', r: 4.5, label: 'a', labelPos: 'nw' });
          R.dot(Bz.re, Bz.im, { color: 'muted', r: 3.5 }); R.dot(Cz.re, Cz.im, { color: 'muted', r: 3.5 });
          const ga = g(A);
          st = { m, wind, ga, inside: others.filter((d) => d < rho).length };
          v.legend([['ink', 'dashed circle $|z-a|=\\rho$ used for counting', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `Along the dashed circle $f(z)$ winds $${s.wind}$ times around $0$` + (s.inside ? ` — the circle also encloses another zero, so this is $m$ plus that zero's order` : ` — exactly $m$, the order of the zero at $a$`) + `. $\\;g(a) = ${cxs(s.ga, 3)}$` + (s.ga.abs() > 1e-9 ? ' $\\ne 0$.' : ' — $b$ or $c$ sits on $a$, so the true order at $a$ is larger.');
        });
      },
    },
    {
      num: '10.18a',
      kind: 'Corollary',
      name: 'Identity theorem',
      statement: String.raw`If $\Omega$ is a region, $f,g\in H(\Omega)$, and $f(z)=g(z)$ for all $z$ in some set that has a limit point in $\Omega$, then $f(z)=g(z)$ for all $z\in\Omega$.`,
      idea: String.raw`Apply 10.18 to $f-g$: its zero set has a limit point in $\Omega$, so it is all of $\Omega$. The limit point must lie *in* $\Omega$: $\sin(\pi/z)$ vanishes at every $1/k$, yet is not $0$ on $\C\setminus\{0\}$, because the points $1/k$ accumulate only at $0\notin\Omega$.`,
      caption: String.raw`Each choice shows two functions that agree on the gold set. Euler's formula $e^{iz}=\cos z+i\sin z$, once known on $\R$, is forced on all of $\C$: the two phase portraits are identical, and the profile of $\log_{10}|f-g|$ along the dashed line through the probe sits at rounding level. Replace $\cos z+i\sin z$ by the non-holomorphic $e^{i\Re z}$ and the agreement stops at $\R$. With $\sin(\pi/z)$ and $0$ the agreement set $\{1/k\}$ piles up at $0$, which is not in $\Omega$.`,
      deps: ['rca-10.18'],
      see: ['pma-8.5'],
      tags: ['identity theorem', 'zeros'],
      viz(v) {
        const { Cx } = v.M;
        const I = new Cx(0, 1);
        const MODES = {
          euler: { label: '$e^{iz}$ vs $\\cos z+i\\sin z$', f: (z) => I.mul(z).exp(), g: (z) => z.cos().add(I.mul(z.sin())), set: 'R', view: [[-3, 3], [-2, 2]], gt: 'phase of $g(z)=\\cos z+i\\sin z$' },
          fake: { label: '$e^{iz}$ vs $e^{i\\Re z}$', f: (z) => I.mul(z).exp(), g: (z) => Cx.polar(1, z.re), set: 'R', view: [[-3, 3], [-2, 2]], gt: 'phase of $g(z)=e^{i\\Re z}$ (not holomorphic)' },
          sin: { label: '$\\sin(\\pi/z)$ vs $0$ on $\\C\\setminus\\{0\\}$', f: (z) => new Cx(Math.PI, 0).div(z).sin(), g: () => new Cx(0, 0), set: 'seq', view: [[-0.25, 1.15], [-0.5, 0.5]], gt: '$\\log_{10}|f-g|=\\log_{10}|\\sin(\\pi/z)|$ (dark: zeros)' },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'euler');
        const L = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 290, ticks: false, title: 'phase of $f$; the agreement set in gold' });
        const R = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 290, ticks: false, title: 'phase of $g$' });
        const B = v.stage({ x: [-2, 2], y: [-19, 2], height: 170, full: true, axes: 'box', yticks: [[-15, '10⁻¹⁵'], [-10, '10⁻¹⁰'], [-5, '10⁻⁵'], [0, '1']], title: '$\\log_{10}|f-g|$ along the dashed line' });
        const p = L.handle(1.3, 0.8, { color: 'ink', r: 6, label: 'probe', labelPos: 'ne' });
        let last = null, st = null;
        v.render(() => {
          const key = which.value, Mo = MODES[key], seq = Mo.set === 'seq';
          if (last !== key) { last = key; L.setView(...Mo.view); R.setView(...Mo.view); [p.x, p.y] = seq ? [0.6, 0.2] : [1.3, 0.8]; R.setTitle(Mo.gt); }
          L.domain(Mo.f, { key, res: 2 });
          if (seq) R.heat((x, y) => Math.log10(Mo.f(new Cx(x, y)).abs() + 1e-300), { key, range: [-4, 1.5], cmap: 'magma', res: 2 });
          else R.domain(Mo.g, { key, res: 2 });
          for (const S of [L, R]) {
            if (!seq) { S.hline(0, { color: 'panel', width: 5 }); S.hline(0, { color: 'gold', width: 2.6 }); S.vline(p.x, { color: 'ink', width: 1.2, dash: [5, 4] }); }
            else { const pts = []; for (let k = 1; k <= 80; k++) pts.push([1 / k, 0]); S.dots(pts, { color: 'gold', r: 2.6 }); S.dot(0, 0, { color: 'red', r: 5, hollow: true, width: 2.2 }); S.hline(0, { color: 'ink', width: 1, dash: [5, 4] }); }
          }
          if (seq) L.tex('0\\notin\\Omega', 0, 0, { color: 'red', size: 14, dy: 18 });
          // profile of log10|f − g|: vertical line through the probe (cases on ℝ), or the positive real axis (sequence case)
          const prof = [];
          if (!seq) { B.setView([Mo.view[1][0], Mo.view[1][1]], null); for (let i = 0; i <= 400; i++) { const y = Mo.view[1][0] + (Mo.view[1][1] - Mo.view[1][0]) * i / 400; const z = new Cx(p.x, y); prof.push([y, Math.max(-16, Math.log10(Mo.f(z).sub(Mo.g(z)).abs() + 1e-300))]); } }
          else {
            B.setView([0, 1.15], null);
            const xs = []; for (let i = 1; i <= 3000; i++) xs.push(1.15 * i / 3000);
            for (let k = 1; k <= 300; k++) xs.push(1 / k);          // include the agreement points themselves
            xs.sort((u, w) => u - w);
            for (const x of xs) prof.push([x, Math.max(-16, Math.log10(Mo.f(new Cx(x, 0)).abs() + 1e-300))]);
          }
          B.setTitle(seq ? '$\\log_{10}|\\sin(\\pi/x)|$ on $0<x\\le1.15$: zeros at every $1/k$, crowding toward $0\\notin\\Omega$' : `$\\log_{10}|f-g|$ along the dashed line $x = ${v.fix(p.x, 2)}$, as a function of $y=\\Im z$`);
          if (!seq) B.vline(0, { color: 'gold', width: 2 }); else { for (let k = 1; k <= 12; k++) B.vline(1 / k, { color: 'gold', width: 1, alpha: 0.6 }); }
          B.path(prof, { color: 'accent', width: 2 });
          const z = new Cx(p.x, p.y), diff = Mo.f(z).sub(Mo.g(z)).abs();
          let mx = 0; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 30; j++) { const w = new Cx(Mo.view[0][0] + (Mo.view[0][1] - Mo.view[0][0]) * i / 40, Mo.view[1][0] + (Mo.view[1][1] - Mo.view[1][0]) * j / 30); const d = Mo.f(w).sub(Mo.g(w)).abs(); if (isFinite(d)) mx = Math.max(mx, d); }
          st = { key, diff, mx };
          v.legend([['gold', 'where $f=g$ is given'], ['accent', '$\\log_{10}|f-g|$ (bottom)']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const at = `$|f-g| = ${v.fmt(s.diff, 3)}$ at the probe`;
          if (s.key === 'euler') return `${at}; largest value on the view $${v.fmt(s.mx, 2)}$ — rounding error only: both sides are entire and agree on $\\R$, so they agree everywhere.`;
          if (s.key === 'fake') return `${at}: $e^{i\\Re z}$ agrees with $e^{iz}$ on $\\R$ but is not holomorphic, so nothing forces agreement off the line ($|e^{iz}| = e^{-\\Im z}$, $|e^{i\\Re z}|=1$).`;
          return `${at}: $f$ and $0$ agree at every $1/k$, but $f\\not\\equiv0$ — the only limit point of $\\{1/k\\}$ is $0$, which is not in $\\Omega=\\C\\setminus\\{0\\}$.`;
        });
      },
    },
  ],
};
