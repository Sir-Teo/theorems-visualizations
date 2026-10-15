// Rudin, Real and Complex Analysis — Chapter 13 (part 3): Mittag-Leffler; simply connected regions

// ---------------------------------------------------------------- helpers shared by this file
// Least-squares polynomial approximation on sample points (Arnoldi orthogonalisation; see ch13-a2.js).
function polyFit(zs, fr, fi, c, s, N) {
  const m = zs.length;
  const ur = Float64Array.from(zs.map(([x]) => (x - c[0]) / s)), ui = Float64Array.from(zs.map(([, y]) => (y - c[1]) / s));
  const Qr = [new Float64Array(m).fill(1 / Math.sqrt(m))], Qi = [new Float64Array(m)];
  const rr = Float64Array.from(fr), ri = Float64Array.from(fi);
  const proj = (j) => {
    const a = Qr[j], b = Qi[j]; let cr = 0, ci = 0;
    for (let i = 0; i < m; i++) { cr += a[i] * rr[i] + b[i] * ri[i]; ci += a[i] * ri[i] - b[i] * rr[i]; }
    for (let i = 0; i < m; i++) { rr[i] -= cr * a[i] - ci * b[i]; ri[i] -= cr * b[i] + ci * a[i]; }
  };
  proj(0);
  for (let k = 1; k <= N; k++) {
    const pr = Qr[k - 1], pi = Qi[k - 1], vr = new Float64Array(m), vi = new Float64Array(m);
    for (let i = 0; i < m; i++) { vr[i] = ur[i] * pr[i] - ui[i] * pi[i]; vi[i] = ur[i] * pi[i] + ui[i] * pr[i]; }
    for (let pass = 0; pass < 2; pass++) for (let j = 0; j < Qr.length; j++) {
      const a = Qr[j], b = Qi[j]; let cr = 0, ci = 0;
      for (let i = 0; i < m; i++) { cr += a[i] * vr[i] + b[i] * vi[i]; ci += a[i] * vi[i] - b[i] * vr[i]; }
      for (let i = 0; i < m; i++) { vr[i] -= cr * a[i] - ci * b[i]; vi[i] -= cr * b[i] + ci * a[i]; }
    }
    let nrm = 0; for (let i = 0; i < m; i++) nrm += vr[i] * vr[i] + vi[i] * vi[i]; nrm = Math.sqrt(nrm);
    if (!(nrm > 1e-10)) break;
    for (let i = 0; i < m; i++) { vr[i] /= nrm; vi[i] /= nrm; }
    Qr.push(vr); Qi.push(vi); proj(Qr.length - 1);
  }
  let e = 0; for (let i = 0; i < m; i++) e = Math.max(e, Math.hypot(rr[i], ri[i]));
  return e;
}
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
function xMark(S, x, y, color = 'ink', size = 5.5, alpha = 1) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 4.5], [color, 2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w, alpha });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w, alpha });
  }
}
const blend = (bg, c, a) => [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a];
const SUP = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
function cTeX(M, re, im, d = 3) {
  const r = Math.abs(re) < 0.5 * 10 ** -d ? 0 : re, i = Math.abs(im) < 0.5 * 10 ** -d ? 0 : im;
  if (i === 0) return M.fix(r, d).replace('−', '-');
  if (r === 0) return `${M.fix(i, d).replace('−', '-')}\\,i`;
  return `${M.fix(r, d).replace('−', '-')} ${i < 0 ? '-' : '+'} ${M.fix(Math.abs(i), d)}\\,i`;
}

// TeX scientific notation that rounds the mantissa correctly (9.97e-4 → 1.0×10^{-3}).
const sciT = (x, d = 2) => { if (!isFinite(x)) return '\\infty'; if (x === 0) return '0'; const a = Math.abs(x); if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d))); const [m, e] = x.toExponential(d - 1).split('e'); return `${m}\\times10^{${+e}}`; };

export default {
  collection: 'rca',
  chapter: 13,
  items: [
    {
      num: '13.10',
      kind: 'Theorem',
      name: 'Mittag-Leffler theorem',
      statement: String.raw`Let $\Omega\subset\C$ be open and let $A\subset\Omega$ have no limit point in $\Omega$. Suppose that to each $\alpha\in A$ are assigned a positive integer $m(\alpha)$ and a rational function
$$P_\alpha(z)=\sum_{j=1}^{m(\alpha)}\frac{c_{j,\alpha}}{(z-\alpha)^j}.$$
Then there is a function $f$, meromorphic in $\Omega$, whose principal part at every $\alpha\in A$ is $P_\alpha$ and which has no other poles in $\Omega$.`,
      idea: String.raw`Simply adding the $P_\alpha$ usually diverges. Take the compact sets $K_n$ of 13.3 and let $Q_n$ be the sum of the $P_\alpha$ over the finitely many $\alpha\in A$ in $K_n\setminus K_{n-1}$. Then $Q_n$ is holomorphic near $K_{n-1}$, and by Runge's theorem (13.6) — applicable because each component of $S^2\setminus K_{n-1}$ meets $S^2\setminus\Omega$ — there is a rational $R_n$ with poles in $S^2\setminus\Omega$ and $|Q_n-R_n|<2^{-n}$ on $K_{n-1}$. The series $f=Q_1+\sum_{n\ge2}(Q_n-R_n)$ converges uniformly on each $K_N$ after removing finitely many terms; the tail is holomorphic there (10.28), and the finitely many remaining terms supply exactly the prescribed principal parts.`,
      caption: String.raw`$\Omega$ is the unit disc and $A$ consists of the points $\times$, more and more of them in each shell $K_n\setminus K_{n-1}$ (dashed circles $|z|=1-1/n$) as they crowd toward $\partial\Omega$. Every $P_\alpha$ has $P_\alpha(0)=1$, so the naive sum diverges. Here $S^2\setminus\Omega$ is connected, so the corrections $R_n$ can be polynomials: Taylor polynomials of $Q_n$ at $0$, of the least degree $d_n$ that gives $|Q_n-R_n|<2^{-n}$ on $K_{n-1}$. Right: the size of each block on $K_{n-1}$ — red for $Q_n$ (not summable), green for $Q_n-R_n$ (under the dashed $2^{-n}$). Drag $z_0$ and add shells: the corrected sums settle down, the naive ones run away.`,
      deps: ['rca-13.3', 'rca-13.6', 'rca-13.2', 'rca-10.28'],
      see: ['rca-15.11', 'rca-13.9'],
      tags: ['Mittag-Leffler', 'meromorphic functions'],
      viz(v) {
        const M = v.M;
        const shells = []; let jj = 0;
        for (let n = 2; n <= 9; n++) {
          const r = 1 - 1 / (n - 0.5), pts = [];
          for (let i = 0; i < n - 1; i++, jj++) { const t = 0.9 + jj * 2.399963; pts.push([r * Math.cos(t), r * Math.sin(t)]); }
          shells.push({ n, r, pts, rin: n === 2 ? 0 : 1 - 1 / (n - 1) });
        }
        // w = z/α; principal part P = (1−w)^{−type}; remainder after the Taylor terms of degree < m
        const term = (type, m, ar, ai, x, y, out) => {
          const q = ar * ar + ai * ai, wr = (x * ar + y * ai) / q, wi = (y * ar - x * ai) / q;
          const dr = 1 - wr, di = -wi, dq = dr * dr + di * di;
          let pr = dr / dq, pi = -di / dq; // 1/(1−w)
          if (type === 2) { const t = pr * pr - pi * pi; pi = 2 * pr * pi; pr = t; }
          if (m < 0) { out[0] += pr; out[1] += pi; return; } // the full principal part
          const lw = Math.hypot(wr, wi); if (lw === 0) { if (m === 0) { out[0] += pr; out[1] += pi; } return; }
          const mag = Math.exp(m * Math.log(lw)), ang = m * Math.atan2(wi, wr); let fr = mag * Math.cos(ang), fi = mag * Math.sin(ang);
          if (type === 2) { const cr = (m + 1) - m * wr, ci = -m * wi, t = fr * cr - fi * ci; fi = fr * ci + fi * cr; fr = t; }
          out[0] += fr * pr - fi * pi; out[1] += fr * pi + fi * pr;
        };
        const supOn = (type, sh, m, r) => { // sup over |z| = r of |Σ_{α∈shell} (remainder or P_α)|
          const K = r === 0 ? 1 : 256; let e = 0; const o = [0, 0];
          for (let k = 0; k < K; k++) { const t = 2 * Math.PI * k / K; o[0] = 0; o[1] = 0; for (const [a, b] of sh.pts) term(type, m, a, b, r * Math.cos(t), r * Math.sin(t), o); e = Math.max(e, Math.hypot(o[0], o[1])); }
          return e;
        };
        const plan = {};
        for (const type of [1, 2]) {
          plan[type] = shells.map((sh) => {
            const target = 2 ** -sh.n;
            let hi = 1; while (supOn(type, sh, hi, sh.rin) >= target && hi < 1e5) hi *= 2;
            let lo = 0; if (supOn(type, sh, 0, sh.rin) < target) hi = 0;
            while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (supOn(type, sh, mid, sh.rin) < target) hi = mid; else lo = mid; }
            return { m: hi, corr: supOn(type, sh, hi, sh.rin), naive: supOn(type, sh, -1, sh.rin) };
          });
        }
        const typeS = v.select('principal parts', [{ value: 1, label: '$P_\\alpha(z)=\\frac{\\alpha}{\\alpha-z}$' }, { value: 2, label: '$P_\\alpha(z)=\\frac{\\alpha^2}{(\\alpha-z)^2}$' }], 1);
        const sumS = v.select('', [{ value: 'ml', label: 'Mittag-Leffler $\\sum_n(Q_n-R_n)$' }, { value: 'naive', label: 'naive $\\sum_n Q_n$' }], 'ml');
        const NS = v.slider('shells used $N$', 2, 9, 7, { int: true });
        const L = v.stage({ x: [-1.06, 1.06], y: [-1.06, 1.06], equal: true, height: 380, axes: false, title: 'partial sum over the shells $n\\le N$ (faded outside $K_N$)' });
        const R = v.stage({ x: [1.05, 9.6], y: [-4.75, 3.6], height: 380, axes: 'box', title: 'block sizes on $K_{n-1}$ (log); numbers: degree $d_n$ of $R_n$', xticks: [2, 3, 4, 5, 6, 7, 8, 9] });
        const z0 = L.handle(0.18, -0.32, { color: 'gold', label: 'z₀', labelPos: 'ne', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 0.97 ? [x * 0.97 / m, y * 0.97 / m] : [x, y]; } });
        const sumAt = (type, mode, N, x, y) => { const o = [0, 0]; for (const sh of shells) { if (sh.n > N) break; const m = mode === 'ml' ? plan[type][sh.n - 2].m : -1; for (const [a, b] of sh.pts) term(type, m, a, b, x, y, o); } return o; };
        let st = null;
        v.render(() => {
          const type = typeS.value, mode = sumS.value, N = NS.value, P = plan[type];
          const bg = v.rgb('panel'), gray = v.rgb('gray');
          L.raster((x, y) => { const r = Math.hypot(x, y); if (r >= 1) return blend(bg, gray, 0.28); const [a, b] = sumAt(type, mode, N, x, y); return phaseRGB(M, a, b, r > 1 - 1 / N ? 0.62 : 0, bg); }, { key: `${type}|${mode}|${N}`, res: 2 });
          for (const sh of shells) if (sh.n <= N + 1 && sh.rin > 0) L.circle(0, 0, sh.rin, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.55 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.8 });
          for (const sh of shells) for (const [a, b] of sh.pts) { if (sh.n <= N) xMark(L, a, b, 'ink', 4.2); else L.dot(a, b, { color: 'ink', r: 1.8, alpha: 0.5 }); }
          L.tex('K_1=\\{0\\}', 0, 0, { color: 'ink', size: 12, dy: 11 }); L.dot(0, 0, { color: 'ink', r: 2.2 });
          L.tex(`K_{${N}}`, 0, -(1 - 1 / N), { color: 'ink', size: 13, dy: 10 });
          // right: bar chart of block sizes
          const top = Math.max(3.6, Math.ceil(Math.max(...P.map((p) => Math.log10(p.naive)))) + 0.4);
          R.setView(null, [-4.75, top]);
          const yv = (e) => M.clamp(Math.log10(e + 1e-300), -4.2, top);
          R.setTicks([2, 3, 4, 5, 6, 7, 8, 9], [[-4, '10⁻⁴'], [-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴'], [5, '10⁵']]);
          P.forEach((p, i) => {
            const n = i + 2, on = n <= N ? 0.85 : 0.25;
            R.rect(n - 0.36, -4.2, n - 0.02, yv(p.naive), { fill: 'red', fillAlpha: on, stroke: false });
            if (p.corr > 0) R.rect(n + 0.02, -4.2, n + 0.36, yv(p.corr), { fill: 'green', fillAlpha: on, stroke: false });
            R.line(n - 0.42, Math.log10(2 ** -n), n + 0.42, Math.log10(2 ** -n), { color: 'accent', width: 1.6, dash: [4, 3] });
            R.text(`${p.m - 1}`, n + 0.19, Math.max(-4.2, yv(p.corr)), { color: 'green', size: 10.5, align: 'center', baseline: 'bottom', dy: -3, weight: 600 });
          });
          // values at z0
          const ml = sumAt(type, 'ml', N, z0.x, z0.y), nv = sumAt(type, 'naive', N, z0.x, z0.y);
          const mlPrev = sumAt(type, 'ml', N - 1, z0.x, z0.y);
          const mz = Math.max(1, Math.ceil(1 / (1 - Math.hypot(z0.x, z0.y)) - 1e-9));
          st = { ml, nv, step: Math.hypot(ml[0] - mlPrev[0], ml[1] - mlPrev[1]), N, mz, ms: P.map((p) => p.m - 1), mode };
          v.legend([['ink', 'points of $A$ ($\\times$); faint: shells not yet used'], ['red', '$\\sup_{K_{n-1}}|Q_n|$', { area: true }], ['green', '$\\sup_{K_{n-1}}|Q_n-R_n|$', { area: true }], ['accent', '$2^{-n}$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `At $z_0$ (which lies in $K_{${s.mz}}$): Mittag-Leffler sum $= ${cTeX(v.M, ...s.ml)}$, changed by ${s.step < 1e-15 ? 'less than $10^{-15}$' : `$${sciT(s.step, 1)}$`} when shell ${s.N} was added; naive sum $= ${cTeX(v.M, ...s.nv)}$. Degrees $d_n$ of the Taylor corrections: ${s.ms.join(', ')} — they grow fast because the poles of $Q_n$ crowd in on $K_{n-1}$.`;
        });
      },
    },
    {
      num: '13.11',
      kind: 'Theorem',
      name: 'Simply connected regions: nine equivalent conditions',
      statement: String.raw`For a region $\Omega$ in the plane (open and connected) the following are equivalent:
(a) $\Omega$ is homeomorphic to the open unit disc $U$.
(b) $\Omega$ is simply connected.
(c) $\Ind_\gamma(\alpha)=0$ for every closed path $\gamma$ in $\Omega$ and every $\alpha\in S^2\setminus\Omega$.
(d) $S^2\setminus\Omega$ is connected.
(e) Every $f\in H(\Omega)$ is a limit of polynomials, uniformly on compact subsets of $\Omega$.
(f) $\int_\gamma f(z)\,dz=0$ for every $f\in H(\Omega)$ and every closed path $\gamma$ in $\Omega$.
(g) Every $f\in H(\Omega)$ has a primitive: $F'=f$ for some $F\in H(\Omega)$.
(h) If $f\in H(\Omega)$ and $1/f\in H(\Omega)$, then $f=e^g$ for some $g\in H(\Omega)$.
(i) If $f\in H(\Omega)$ and $1/f\in H(\Omega)$, then $f=\varphi^2$ for some $\varphi\in H(\Omega)$.`,
      idea: String.raw`Go round the circle (a)⇒(b)⇒…⇒(i)⇒(a). A homeomorphism carries null-homotopies, so (a)⇒(b); homotopic closed paths have equal index (10.40), giving (b)⇒(c). For (c)⇒(d): if $S^2\setminus\Omega$ split into disjoint closed sets $A\not\ni\infty$ and $B\ni\infty$, the cycle of 13.5 built around the compact set $A$ inside $\C\setminus B$ would be a sum of closed paths in $\Omega$ with index $1$ at points of $A$. Runge's theorem in the form 13.9 gives (d)⇒(e); polynomials have zero integrals over closed paths, so (e)⇒(f); (f) makes path integrals path-independent, which defines primitives, (f)⇒(g); a primitive of $f'/f$ is a logarithm, (g)⇒(h); and $\varphi=e^{g/2}$ gives (h)⇒(i). Finally (i)⇒(a): square roots are all that the proof of the Riemann mapping theorem (14.8) needs to map $\Omega\ne\C$ conformally onto $U$, and $\C$ is homeomorphic to $U$ via $z/(1+|z|)$.`,
      caption: String.raw`Choose a region and drag the five handles of the closed curve $\gamma$ (it must stay in $\Omega$; parts that leave it turn red). $\alpha^*$ is a point of $S^2\setminus\Omega$ — the hole, the puncture, the tip of the slit, or a boundary point. The table tests every condition on this $\gamma$, with $f(z)=1/(z-\alpha^*)$ for (e)–(g) and $f(z)=z-\alpha^*$ for (h)–(i): the index, the integral, the best degree-24 polynomial on $\gamma^*$ and the continuation of $\log$ and $\sqrt{\ }$ are all computed. For the disc and the spiral-slit disc everything holds; for the annulus or the punctured disc a loop around $\alpha^*$ breaks (b)–(i) at once.`,
      deps: ['rca-10.38', 'rca-10.40', 'rca-13.5', 'rca-13.9'],
      see: ['rca-14.8', 'rca-10.35'],
      tags: ['simply connected', 'topology', 'Runge'],
      viz(v) {
        const M = v.M, RO = 1.7, RH = 0.55, PP = [0.22, 0.12];
        const SLIT = Array.from({ length: 140 }, (_, i) => { const t = i / 139, r = RO - 1.22 * t, th = 0.35 + 7.2 * t; return [r * Math.cos(th), r * Math.sin(th)]; });
        const TIP = SLIT[SLIT.length - 1];
        const PRE = {
          disc: { label: 'disc', sc: true, alpha: [RO * Math.cos(-0.7), RO * Math.sin(-0.7)], H: [[0.75, 0.2], [0.15, 0.85], [-0.75, 0.35], [-0.55, -0.6], [0.4, -0.7]] },
          slit: { label: 'disc minus a spiral slit', sc: true, alpha: TIP, H: [[-0.35, 0.95], [-0.95, 0.55], [-1.05, -0.25], [-0.6, -0.15], [-0.45, 0.45]] },
          ann: { label: 'annulus', sc: false, alpha: [0, 0], H: [[1.1, 0.1], [0.3, 1.1], [-0.95, 0.6], [-0.8, -0.75], [0.45, -1.05]] },
          punct: { label: 'punctured disc', sc: false, alpha: PP, H: [[0.95, 0.25], [0.3, 0.85], [-0.5, 0.35], [-0.3, -0.55], [0.6, -0.5]] },
        };
        const pre = v.select('$\\Omega$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'ann');
        const L = v.stage({ x: [-1.95, 1.95], y: [-1.85, 1.85], equal: true, height: 400, axes: false, minWidth: 300, title: '$\\Omega$ (unshaded), $S^2\\setminus\\Omega$ (shaded), a closed path $\\gamma$' });
        const T = v.stage({ x: [0, 1], y: [0, 1], height: 400, axes: false, weight: 1.25, minWidth: 340, title: 'the nine conditions, tested on this $\\gamma$' });
        const H = PRE.ann.H.map(([x, y]) => L.handle(x, y, { color: 'accent', r: 6 }));
        const segX = (p, q, a, b) => { const d = (q[0] - p[0]) * (b[1] - a[1]) - (q[1] - p[1]) * (b[0] - a[0]); if (Math.abs(d) < 1e-14) return false; const t = ((a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0])) / d, u = ((a[0] - p[0]) * (q[1] - p[1]) - (a[1] - p[1]) * (q[0] - p[0])) / d; return t >= 0 && t <= 1 && u >= 0 && u <= 1; };
        const inOmega = (key, x, y) => {
          const r = Math.hypot(x, y); if (r >= RO) return false;
          if (key === 'ann') return r > RH;
          if (key === 'punct') return Math.hypot(x - PP[0], y - PP[1]) > 0.012;
          return true;
        };
        const ROWS = [
          ['a', '\\Omega\\ \\text{is homeomorphic to}\\ U'],
          ['b', '\\Omega\\ \\text{is simply connected}'],
          ['c', '\\Ind_\\gamma(\\alpha)=0\\ \\text{for closed}\\ \\gamma\\subset\\Omega,\\ \\alpha\\notin\\Omega'],
          ['d', 'S^2\\setminus\\Omega\\ \\text{is connected}'],
          ['e', '\\text{polynomials approximate each}\\ f\\in H(\\Omega)'],
          ['f', '\\textstyle\\int_\\gamma f=0\\ \\text{for}\\ f\\in H(\\Omega),\\ \\gamma\\ \\text{closed}'],
          ['g', '\\text{each}\\ f\\in H(\\Omega)\\ \\text{has a primitive}'],
          ['h', '\\text{each nonvanishing}\\ f\\in H(\\Omega)\\ \\text{is}\\ e^{g}'],
          ['i', '\\text{each nonvanishing}\\ f\\in H(\\Omega)\\ \\text{is}\\ \\varphi^2'],
        ];
        let last = 'ann', st = null;
        v.render(() => {
          const key = pre.value, P = PRE[key];
          if (key !== last) { last = key; P.H.forEach(([x, y], i) => { H[i].x = x; H[i].y = y; }); }
          // closed Catmull–Rom curve through the handles
          const pts = H.map((h) => [h.x, h.y]), K = pts.length, curve = [];
          for (let i = 0; i < K; i++) {
            const p0 = pts[(i + K - 1) % K], p1 = pts[i], p2 = pts[(i + 1) % K], p3 = pts[(i + 2) % K];
            for (let s = 0; s < 120; s++) {
              const t = s / 120, t2 = t * t, t3 = t2 * t;
              curve.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
            }
          }
          const n = curve.length, bad = new Uint8Array(n);
          for (let i = 0; i < n; i++) {
            const p = curve[i], q = curve[(i + 1) % n];
            if (!inOmega(key, p[0], p[1])) bad[i] = 1;
            else if (key === 'slit') for (let j = 0; j + 1 < SLIT.length; j++) if (segX(p, q, SLIT[j], SLIT[j + 1])) { bad[i] = 1; break; }
          }
          const inside = !bad.some(Boolean);
          // ---- left panel
          const bg = v.rgb('panel'), gray = v.rgb('gray'), red = v.rgb('red');
          L.raster((x, y) => {
            const r = Math.hypot(x, y);
            if (r >= RO) return blend(bg, gray, 0.32);
            if (key === 'ann' && r <= RH) return blend(bg, red, 0.22);
            return null;
          }, { key, res: 2 });
          L.circle(0, 0, RO, { color: 'muted', width: 1.4 });
          if (key === 'ann') { L.circle(0, 0, RH, { color: 'red', width: 1.4 }); L.text('bounded component', 0, -0.3, { color: 'red', size: 11, align: 'center' }); }
          if (key === 'slit') { L.path(SLIT, { color: 'gray', width: 6 }); L.path(SLIT, { color: 'muted', width: 2 }); }
          if (key === 'punct') L.dot(PP[0], PP[1], { color: 'red', r: 4.5 });
          L.text('S² ∖ Ω  ∋ ∞', -1.9, -1.72, { color: 'muted', size: 12, weight: 600 });
          const al = P.alpha;
          xMark(L, al[0], al[1], P.sc ? 'ink' : 'red', 5.5);
          L.tex('\\alpha^*', al[0], al[1], { color: 'ink', size: 14, dx: key === 'disc' ? 16 : 13, dy: key === 'disc' ? 8 : -12 });
          // γ with orientation arrows, bad parts in red
          L.path(curve.concat([curve[0]]), { color: 'panel', width: 5.5 });
          L.path(curve.concat([curve[0]]), { color: 'accent', width: 2.6 });
          for (let i = 0; i < n; i++) if (bad[i]) L.line(curve[i][0], curve[i][1], curve[(i + 1) % n][0], curve[(i + 1) % n][1], { color: 'red', width: 4 });
          for (const f of [0.1, 0.43, 0.76]) { const i = Math.floor(f * n), a = curve[i], b = curve[(i + 30) % n]; L.arrow(a[0], a[1], b[0], b[1], { color: 'accent', head: 15, width: 2.6 }); }
          L.tex('\\gamma', curve[Math.floor(0.25 * n)][0], curve[Math.floor(0.25 * n)][1], { color: 'accent', size: 16, dx: 12, dy: -10 });
          // ---- the witnesses, computed on γ
          let wind = 0, len = 0, Ir = 0, Ii = 0;
          for (let i = 0; i < n; i++) {
            const p = curve[i], q = curve[(i + 1) % n];
            const ux = p[0] - al[0], uy = p[1] - al[1], vx = q[0] - al[0], vy = q[1] - al[1];
            wind += Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
            len += Math.hypot(q[0] - p[0], q[1] - p[1]);
            const mx = (p[0] + q[0]) / 2 - al[0], my = (p[1] + q[1]) / 2 - al[1], mq = mx * mx + my * my, dx = q[0] - p[0], dy = q[1] - p[1];
            Ir += (mx * dx + my * dy) / mq; Ii += (mx * dy - my * dx) / mq; // ∫ dz/(z−α*)
          }
          const k = Math.round(wind / (2 * Math.PI));
          const zs = curve.filter((_, i) => i % 2 === 0);
          const fr = Float64Array.from(zs.map(([x, y]) => (x - al[0]) / ((x - al[0]) ** 2 + (y - al[1]) ** 2))), fi = Float64Array.from(zs.map(([x, y]) => -(y - al[1]) / ((x - al[0]) ** 2 + (y - al[1]) ** 2)));
          const cx = M.mean(zs.map((p) => p[0])), cy = M.mean(zs.map((p) => p[1])), sc = Math.max(...zs.map(([x, y]) => Math.hypot(x - cx, y - cy)));
          const pe = polyFit(zs, fr, fi, [cx, cy], sc, 24);
          const bound = 2 * Math.PI * Math.abs(k) / len;
          // ---- the table
          const sc0 = P.sc, Wd = T.width, rowH = (T.height - 16) / 9;
          ROWS.forEach(([tag, tx], i) => {
            const Y = 12 + rowH * i + rowH * 0.32;
            T.textPx(sc0 ? '✓' : '✗', 12, Y, { color: sc0 ? 'green' : 'red', size: 16, weight: 700 });
            T.textPx(`(${tag})`, 30, Y, { color: 'ink', size: 12.5, weight: 600 });
            T.texPx(tx, 56, Y, { color: 'ink', size: 13.5, align: 'left' });
          });
          const wit = (i, str, col = 'muted') => T.textPx(str, 56, 12 + rowH * i + rowH * 0.74, { color: col, size: 11.5 });
          const fails = k !== 0;
          const comp = key === 'ann' ? 'two components: the closed hole and the outside' : key === 'punct' ? 'two components: the point and the outside' : key === 'slit' ? 'one component: the slit is attached to the outside' : 'one component, containing ∞';
          if (!inside) {
            for (let i = 0; i < 9; i++) wit(i, i === 0 ? (sc0 ? 'via the Riemann mapping theorem (14.8)' : 'no — (b) fails') : i === 3 ? comp : 'γ leaves Ω — drag the handles back into Ω', i === 0 || i === 3 ? 'muted' : 'red');
          } else {
            wit(0, sc0 ? 'via the Riemann mapping theorem (14.8)' : 'no: a homeomorphism would preserve (b)');
            wit(1, fails ? `this γ is not null-homotopic: its index at α* is ${k} (10.40)` : sc0 ? 'every closed curve contracts to a point' : 'this γ contracts — but a loop around α* would not', fails ? 'red' : 'muted');
            wit(2, `Ind_γ(α*) = ${k}`, fails ? 'red' : 'green');
            wit(3, comp, sc0 ? 'green' : 'red');
            wit(4, `degree-24 fit of 1/(z−α*) on γ*: error ${v.fmt(pe, 2)}${fails ? ` ≥ 2π|k|/len(γ) = ${v.fmt(bound, 2)}` : ''}`, fails ? 'red' : 'green');
            wit(5, `∫_γ dz/(z−α*) = ${Math.abs(Ir) < 5e-4 ? '' : v.fix(Ir, 3) + (Ii < 0 ? ' − ' : ' + ')}${Math.abs(Ii) < 5e-4 ? (Math.abs(Ir) < 5e-4 ? '0' : '') : `${Math.abs(Ir) < 5e-4 && Ii < 0 ? '−' : ''}${v.fix(Math.abs(Ii), 3)} i`}${fails ? `  = 2πi·${k}` : ''}`, fails ? 'red' : 'green');
            wit(6, fails ? `a primitive of 1/(z−α*) would change by 2πi·${k} around γ` : 'log(z−α*) is a primitive along γ: no change around γ', fails ? 'red' : 'green');
            wit(7, `log(z−α*) continued once around γ changes by 2πi·${k}`, fails ? 'red' : 'green');
            wit(8, `√(z−α*) continued once around γ is multiplied by ${k % 2 ? '−1' : '+1'}`, k % 2 ? 'red' : 'green');
          }
          st = { k, inside, pe, bound, key, sc0 };
          v.legend([['accent', 'closed path $\\gamma$ (drag the handles)'], ['gray', 'unbounded component of $S^2\\setminus\\Omega$', { area: true }], ['red', 'bounded component', { area: true }], ['ink', '$\\alpha^*\\in S^2\\setminus\\Omega$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.inside) return '$\\gamma$ is not a path **in** $\\Omega$; the conditions only speak about such paths.';
          if (s.sc0) return `$\\Omega$ is simply connected: whatever closed $\\gamma$ you draw in $\\Omega$, $\\Ind_\\gamma(\\alpha^*) = ${s.k}$ and every computed witness agrees — (a)–(i) all hold.`;
          return s.k ? `$\\Ind_\\gamma(\\alpha^*) = ${s.k}\\neq0$: this single loop breaks (b), (c) and, through $f=1/(z-\\alpha^*)$ and $f=z-\\alpha^*$, also (e)–(i) — and (d) fails because $S^2\\setminus\\Omega$ is disconnected.` : 'This $\\gamma$ does not wind around $\\alpha^*$, so it witnesses nothing; drag it around the hole to see (b)–(i) fail together.';
        });
      },
    },
  ],
};
