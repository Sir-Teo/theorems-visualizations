// Rudin, Real and Complex Analysis — Chapter 15 (part 2): Weierstrass products, interpolation, ideals

// ---------------------------------------------------------------- helpers shared by this file
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// Same colouring from a logarithm: lm = log|w|, ar = arg w (any branch). Lets us colour products whose
// modulus would overflow if the factors were multiplied out.
function phaseLogRGB(M, lm, ar, fade = 0, bg = null, band = Math.LN2) {
  if (!isFinite(lm) || !isFinite(ar)) return lm === -Infinity ? [20, 20, 20] : bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(lm / band);
  const c = M.hsl2rgb(M.fract(ar / M.TAU), 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// log E_p(w) for w = x + iy, written into out = [re, im]. For |w| < 1/2 the series −Σ_{k>p} w^k/k is used
// (it is tiny when p is large); otherwise log(1 − w) + Σ_{k≤p} w^k/k.
function logE(p, x, y, out) {
  const r2 = x * x + y * y;
  if (r2 < 0.25) {
    const lr = 0.5 * Math.log(r2 + 1e-300);
    if ((p + 1) * lr < -34) { out[0] = 0; out[1] = 0; return out; }
    const th = Math.atan2(y, x), r = Math.sqrt(r2);
    let k = p + 1, mag = Math.exp(k * lr), sr = 0, si = 0;
    while (mag > 1e-17 && k < p + 80) { sr -= mag * Math.cos(k * th) / k; si -= mag * Math.sin(k * th) / k; k++; mag *= r; }
    out[0] = sr; out[1] = si; return out;
  }
  let sr = 0.5 * Math.log((1 - x) * (1 - x) + y * y), si = Math.atan2(-y, 1 - x);
  let wr = x, wi = y;
  for (let k = 1; k <= p; k++) { sr += wr / k; si += wi / k; const t = wr * x - wi * y; wi = wr * y + wi * x; wr = t; }
  out[0] = sr; out[1] = si; return out;
}
// |1 − e^L| for a complex logarithm L = [a, b], accurate also when L is tiny.
function oneMinusExp(a, b) {
  if (a * a + b * b < 1e-6) { const re = a + (a * a - b * b) / 2, im = b + a * b; return Math.hypot(re, im); }
  const e = Math.exp(a); return Math.hypot(e * Math.cos(b) - 1, e * Math.sin(b));
}
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
const logTicks = (lo, hi, step = 1) => { const out = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % step === 0) out.push([k, k === 0 ? '1' : `10${sup(k)}`]); return out; };
// complex log Γ (Lanczos, reflection for Re z < 1/2); only needed modulo 2πi
const LGC = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function logGamma(Cx, z) {
  if (z.re < 0.5) return new Cx(Math.log(Math.PI), 0).sub(z.scale(Math.PI).sin().log()).sub(logGamma(Cx, new Cx(1 - z.re, -z.im)));
  const zz = z.sub(1); let x = new Cx(LGC[0], 0);
  for (let i = 1; i < 9; i++) x = x.add(new Cx(LGC[i], 0).div(zz.add(i)));
  const t = zz.add(7.5);
  return new Cx(0.5 * Math.log(2 * Math.PI), 0).add(zz.add(0.5).mul(t.log())).sub(t).add(x.log());
}
const GOLD = Math.PI * (3 - Math.sqrt(5)); // golden angle
// an unfilled ring of pixel radius px (so the phase portrait underneath stays visible)
function ring(v, S, x, y, px, color, width = 2.2) {
  const c = S.ctx, X = S.X(x), Y = S.Y(y);
  c.save();
  for (const [col, w] of [['panel', width + 2.5], [color, width]]) { c.beginPath(); c.arc(X, Y, px, 0, 2 * Math.PI); c.strokeStyle = v.color(col); c.lineWidth = w; c.stroke(); }
  c.restore();
}
// complex number for TeX, with negligible parts dropped
function ctex(M, z, d = 4) {
  const re = Math.abs(z.re) < 1e-12 ? 0 : z.re, im = Math.abs(z.im) < 1e-9 * Math.max(1, Math.abs(z.re)) ? 0 : z.im;
  if (!im) return M.fmt(re, d);
  if (!re) return `${M.fmt(im, d)}\\,i`;
  return `${M.fmt(re, d)} ${im < 0 ? '-' : '+'} ${M.fmt(Math.abs(im), d)}\\,i`;
}

export default {
  collection: 'rca',
  chapter: 15,
  items: [
    {
      num: '15.9',
      kind: 'Theorem',
      name: 'Entire functions with prescribed zeros',
      credit: 'Weierstrass, 1876',
      statement: String.raw`Let $\{z_n\}$ be complex numbers with $z_n\ne0$ and $|z_n|\to\infty$, and put $r_n=|z_n|$. If $\{p_n\}$ are nonnegative integers such that
$$\sum_{n=1}^\infty\Big(\frac{r}{r_n}\Big)^{1+p_n}<\infty\qquad\text{for every }r>0,$$
then $P(z)=\prod_{n=1}^\infty E_{p_n}(z/z_n)$ is an entire function whose zeros are exactly the points $z_n$: if $\alpha$ occurs $m$ times in the sequence, $P$ has a zero of order $m$ at $\alpha$. The condition always holds with $p_n=n-1$.`,
      idea: String.raw`On $|z|\le r$ we have $|z/z_n|\le r/r_n\le1$ for all large $n$, so Lemma 15.8 gives $|1-E_{p_n}(z/z_n)|\le(r/r_n)^{1+p_n}$. The hypothesis makes $\sum|1-E_{p_n}(z/z_n)|$ converge uniformly on every disc, and Theorem 15.6 delivers an entire product whose zero multiplicities add up factor by factor; $E_p$ vanishes only at $1$. With $p_n=n-1$, $r/r_n<\frac12$ eventually, so the series is dominated by $\sum2^{-n}$.`,
      caption: String.raw`Pick a zero sequence and a rule for $p_n$. Left: phase portrait of $P_N=\prod_{n\le N}E_{p_n}(z/z_n)$ (computed through logarithms, so nothing overflows) and a test point $w$ with its circle $|z|=r$. Right: Weierstrass's series $\sum_{n\le N}(r/r_n)^{1+p_n}$ for all four rules (selected one bold): when it levels off the product converges near $w$; when it keeps growing, raising $N$ keeps repainting the picture. Zeros at $\sqrt n$ need $p\ge2$; zeros at $\log(n+1)$ defeat every constant $p$ — only growing $p_n$ work.`,
      deps: ['rca-15.6', 'rca-15.7', 'rca-15.8'],
      see: ['rca-15.10', 'pma-8.17'],
      tags: ['Weierstrass products', 'entire functions', 'zeros'],
      viz(v) {
        const NMAX = 150;
        const FAM = {
          lin: { label: '$z_n=n$', z: (n) => [n, 0] },
          sun: { label: '$z_n=\\sqrt n\\,e^{in\\phi}$', z: (n) => [Math.sqrt(n) * Math.cos(n * GOLD), Math.sqrt(n) * Math.sin(n * GOLD)] },
          log: { label: '$z_n=1.6\\log(n+1)\\,e^{in\\phi}$', z: (n) => { const r = 1.6 * Math.log(n + 1); return [r * Math.cos(n * GOLD), r * Math.sin(n * GOLD)]; } },
        };
        const RULES = { p0: { label: '$p_n=0$', p: () => 0, col: 'red' }, p1: { label: '$p_n=1$', p: () => 1, col: 'orange' }, p2: { label: '$p_n=2$', p: () => 2, col: 'purple' }, pn: { label: '$p_n=n-1$', p: (n) => n - 1, col: 'green' } };
        const fam = v.select('zeros', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'sun');
        const rule = v.select('', Object.entries(RULES).map(([value, o]) => ({ value, label: o.label })), 'p2');
        const Ns = v.slider('zeros used $N$', 1, NMAX, 60, { int: true });
        const L = v.stage({ x: [-4.6, 4.6], y: [-3.3, 3.3], equal: true, height: 350, weight: 1.25, title: 'phase of $P_N(z)=\\prod_{n\\le N}E_{p_n}(z/z_n)$' });
        const R = v.stage({ x: [-0.05, 4.05], y: [-2, 3], height: 350, axes: 'box', xlabel: 'N', xticks: [[0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴']], title: '$\\sum_{n\\le N}(r/r_n)^{1+p_n}$, $\\;r=|w|$ (log–log)' });
        const w = L.handle(1.6, 1.25, { color: 'ink', label: 'w', labelPos: 'ne' });
        const out = [0, 0];
        const logP = (zs, ps, N, x, y) => { let a = 0, b = 0; for (let n = 0; n < N; n++) { const [ur, ui] = zs[n], d = ur * ur + ui * ui; logE(ps[n], (x * ur + y * ui) / d, (y * ur - x * ui) / d, out); a += out[0]; b += out[1]; } return [a, b]; };
        let st = null;
        v.render(() => {
          const F = FAM[fam.value], Rl = RULES[rule.value], N = Ns.value;
          const zs = Array.from({ length: NMAX }, (_, i) => F.z(i + 1)), ps = Array.from({ length: NMAX }, (_, i) => Rl.p(i + 1));
          L.raster((x, y) => { const [a, b] = logP(zs, ps, N, x, y); return phaseLogRGB(v.M, a, b, 0, null, 2); }, { key: `${fam.value},${rule.value},${N}`, res: 2 });
          const r = Math.hypot(w.x, w.y);
          L.circle(0, 0, r, { color: 'panel', width: 3.5 }); L.circle(0, 0, r, { color: 'ink', width: 1.3, dash: [5, 4] });
          for (let n = 0; n < N; n++) { const [a, b] = zs[n]; if (Math.abs(a) < 4.8 && Math.abs(b) < 3.5) L.dot(a, b, { color: 'ink', r: 2.8 }); }
          // right: the series for every rule, up to n = 10^4, against log10 n
          const series = {}, NS = 10000, marks = new Set();
          for (let j = 0; j <= 320; j++) marks.add(Math.round(Math.pow(10, 4 * j / 320)));
          let lo = Infinity, hi = -Infinity;
          const rAt = (n) => (n <= NMAX ? Math.hypot(...zs[n - 1]) : Math.hypot(...F.z(n)));
          for (const [key, o] of Object.entries(RULES)) {
            let s = 0; const pts = []; let atN = 0;
            for (let n = 1; n <= NS; n++) { s += Math.pow(r / rAt(n), 1 + o.p(n)); if (n === N) atN = s; if (marks.has(n)) { const y = Math.log10(s); pts.push([Math.log10(n), y]); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
            series[key] = { pts, atN, end: s };
          }
          lo = Math.max(lo, -6);
          const y0 = Math.floor(lo) - 0.2, y1 = Math.ceil(hi) + 0.3;
          R.setView(null, [y0, y1]);
          R.setTicks(undefined, logTicks(y0, y1, hi - lo > 8 ? 2 : 1));
          for (const [key, o] of Object.entries(RULES)) if (key !== rule.value) R.path(series[key].pts, { color: o.col, width: 1.4, alpha: 0.45 });
          R.path(series[rule.value].pts, { color: Rl.col, width: 3 });
          R.vline(Math.log10(N), { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(Math.log10(N), Math.log10(series[rule.value].atN), { color: Rl.col, r: 5 });
          const ends = Object.entries(RULES).map(([key, o]) => [o, Math.log10(series[key].end)]).sort((a, b) => b[1] - a[1]);
          let prevY = Infinity; const minGap = 15 / R.sy;
          for (const [o, y] of ends) { const yy = Math.min(y, prevY - minGap); prevY = yy; R.text(o.label.replace(/\$/g, '').replace('p_n', 'pₙ'), 4, yy, { color: o.col, size: 11, align: 'right', dy: -8, dx: -4 }); }
          // the value of the product at w, and how much it moved over the last half of the factors
          const a1 = logP(zs, ps, N, w.x, w.y), a0 = logP(zs, ps, Math.max(1, Math.floor(N / 2)), w.x, w.y);
          st = { r, N, S: series[rule.value].atN, Sfull: series[rule.value].end, mod: a1[0], move: Math.hypot(a1[0] - a0[0], Math.atan2(Math.sin(a1[1] - a0[1]), Math.cos(a1[1] - a0[1]))), rl: Rl.label };
          v.legend([['ink', 'zeros $z_1,\\dots,z_N$', { dot: true }], ['ink', 'circle $|z|=r$ through $w$', { dash: true }], [Rl.col, 'Weierstrass series for the chosen $p_n$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `${s.rl}, $r=|w|=${v.fix(s.r, 2)}$: $\\sum_{n\\le ${s.N}}(r/r_n)^{1+p_n} = ${v.sci(s.S, 3)}$ (at $N=10^4$: $${v.sci(s.Sfull, 3)}$). $\\;\\log|P_N(w)| = ${v.fix(s.mod, 3)}$; between $N/2$ and $N$ factors, $\\log P_N(w)$ moved by $${v.sci(s.move, 2)}$.`;
        });
      },
    },
    {
      num: '15.10',
      kind: 'Theorem',
      name: 'Weierstrass factorization theorem',
      credit: 'Weierstrass, 1876',
      statement: String.raw`Let $f$ be an entire function, not identically $0$, with a zero of order $k\ge0$ at the origin, and let $z_1,z_2,z_3,\dots$ be its other zeros, each listed as often as its multiplicity. Then there is an entire function $g$ such that
$$f(z)=z^k\,e^{g(z)}\prod_{n=1}^\infty E_{n-1}\Big(\frac{z}{z_n}\Big).$$
(If $f$ has only finitely many zeros the product is finite; the factorization holds with any $p_n$ satisfying the condition of 15.9, with a corresponding $g$.)`,
      idea: String.raw`List the zeros by increasing modulus; since they cannot accumulate, $|z_n|\to\infty$, and Theorem 15.9 with $p_n=n-1$ gives an entire $P$ with exactly the zeros $z_n$. Then $f/(z^kP)$ has only removable singularities and no zeros, so it is a zero-free entire function. The plane is simply connected, so it has a holomorphic logarithm $g$ (13.11).`,
      caption: String.raw`Left: phase portrait of $f$ and its zeros. Right: the quotient $q_N=f/(z^k\prod_{n\le N}E_{p_n}(z/z_n))$; every zero that has been divided out (hollow ring) disappears from the picture, and once all visible zeros are gone what is left is the zero-free factor $e^{g}$. With the economical choice $p_n=1$ the readout recovers $g$ explicitly: $\log\pi$ for $\sin\pi z$, $\gamma z$ for $1/\Gamma$ (Euler's constant), $z/2$ for $e^z-1$, and $z^2+\log\pi$ when the factor $e^{z^2}$ is hidden in $f$.`,
      deps: ['rca-15.9', 'rca-13.11', 'rca-10.18'],
      see: ['pma-8.17', 'pma-8.19', 'rca-15.11'],
      tags: ['Weierstrass products', 'entire functions', 'factorization'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const alt = (n) => (n % 2 ? (n + 1) / 2 : -n / 2); // 1, −1, 2, −2, …
        const FN = {
          sin: { label: '$\\sin\\pi z$', logf: (z) => z.scale(Math.PI).sin().log(), zero: (n) => [alt(n), 0], view: [[-4.6, 4.6], [-2.5, 2.5]], g: () => new Cx(Math.log(Math.PI), 0), gtex: 'g=\\log\\pi' },
          gam: { label: '$1/\\Gamma(z)$', logf: (z) => logGamma(Cx, z).neg(), zero: (n) => [-n, 0], view: [[-6.3, 2.3], [-2.4, 2.4]], g: (z) => z.scale(0.5772156649015329), gtex: 'g(z)=\\gamma z' },
          exp: { label: '$e^z-1$', logf: (z) => z.exp().sub(1).log(), zero: (n) => [0, 2 * Math.PI * alt(n)], view: [[-14, 14], [-20, 20]], g: (z) => z.scale(0.5), gtex: 'g(z)=z/2' },
          sexp: { label: '$e^{z^2}\\sin\\pi z$', logf: (z) => z.scale(Math.PI).sin().log().add(z.mul(z)), zero: (n) => [alt(n), 0], view: [[-4.6, 4.6], [-2.5, 2.5]], g: (z) => z.mul(z).add(Math.log(Math.PI)), gtex: 'g(z)=z^2+\\log\\pi' },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'gam');
        const rule = v.select('', [{ value: 'one', label: '$p_n=1$' }, { value: 'can', label: '$p_n=n-1$ (as in the proof)' }], 'one');
        const Ns = v.slider('zeros divided out $N$', 0, 30, 4, { int: true });
        const L = v.stage({ x: [-6.3, 2.3], y: [-2.4, 2.4], equal: true, height: 300, title: 'phase of $f$' });
        const R = v.stage({ x: [-6.3, 2.3], y: [-2.4, 2.4], equal: true, height: 300, title: 'phase of $q_N=f\\,/\\,\\big(z^k\\prod_{n\\le N}E_{p_n}(z/z_n)\\big)$' });
        const out = [0, 0];
        const logq = (F, N, can, z) => {
          let l = F.logf(z).sub(z.log()); // k = 1 for all four examples
          for (let n = 1; n <= N; n++) { const [a, b] = F.zero(n), d = a * a + b * b; logE(can ? n - 1 : 1, (z.re * a + z.im * b) / d, (z.im * a - z.re * b) / d, out); l = l.sub(new Cx(out[0], out[1])); }
          return l;
        };
        let last = null, st = null;
        v.render(() => {
          const key = which.value, F = FN[key], N = Ns.value, can = rule.value === 'can';
          if (last !== key) { last = key; L.setView(...F.view); R.setView(...F.view); }
          L.raster((x, y) => { const l = F.logf(new Cx(x, y)); return phaseLogRGB(v.M, l.re, l.im, 0, null, 1.5); }, { key, res: 2 });
          R.raster((x, y) => { const l = logq(F, N, can, new Cx(x, y)); return phaseLogRGB(v.M, l.re, l.im, 0, null, 1.5); }, { key: `${key},${N},${rule.value}`, res: 2 });
          const [vx, vy] = [L.bounds.x, L.bounds.y];
          const inView = (a, b) => a > vx[0] && a < vx[1] && b > vy[0] && b < vy[1];
          L.dot(0, 0, { color: 'ink', r: 3.5 }); ring(v, R, 0, 0, 6, 'ink', 1.6);
          for (let n = 1; n <= 60; n++) {
            const [a, b] = F.zero(n); if (!inView(a, b)) continue;
            L.dot(a, b, { color: 'ink', r: 3.2 });
            if (n <= N) ring(v, R, a, b, 6, 'ink', 1.6); else R.dot(a, b, { color: 'ink', r: 3.2 });
          }
          L.text('k = 1', 0, 0, { color: 'ink', size: 11.5, dx: 6, dy: -11 });
          R.dot(0.5, 0, { color: 'gold', r: 4.5, label: '½', labelPos: 'ne', math: false });
          const qh = logq(F, N, can, new Cx(0.5, 0)), qe = can ? null : F.g(new Cx(0.5, 0));
          let left = 0; for (let n = N + 1; n <= 60; n++) { const [a, b] = F.zero(n); if (inView(a, b)) left++; }
          st = { N, left, qh, qe, F, can };
          v.legend([['ink', 'zeros of $f$ (including $z=0$, order $k=1$)', { dot: true }], ['gold', 'test point $z=\\tfrac12$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const q = s.qh.exp(), gq = `\\log q_{${s.N}}(\\tfrac12) = ${ctex(v.M, s.qh, 5)}`;
          const rest = s.left ? `Rings: zeros already divided out; ${s.left} zero${s.left > 1 ? 's' : ''} of $f$ in view still to go.` : 'No zeros of $q_N$ left in view: $q_N\\to e^{g}$, zero-free.';
          if (s.can) return `${rest} $\\;${gq}$ — with $p_n=n-1$ the factor $e^g$ is a different (less tidy) entire function.`;
          return `${rest} $\\;${gq}$, $\\;q_{${s.N}}(\\tfrac12) = ${ctex(v.M, q, 5)}$; the limit is $e^{g(1/2)}$ with $${s.F.gtex}$, i.e. $g(\\tfrac12) = ${ctex(v.M, s.qe, 5)}$.`;
        });
      },
    },
    {
      num: '15.11',
      kind: 'Theorem',
      name: 'Prescribed zeros in an arbitrary open set',
      statement: String.raw`Let $\Omega$ be an open subset of the Riemann sphere $S^2$ with $\Omega\ne S^2$. Let $A\subset\Omega$ have no limit point in $\Omega$, and attach to each $\alpha\in A$ a positive integer $m(\alpha)$. Then there is an $f\in H(\Omega)$ whose zeros all lie in $A$ and which has a zero of order exactly $m(\alpha)$ at every $\alpha\in A$.`,
      idea: String.raw`After a Möbius change of variable one may assume $\infty\in\Omega$ is not in $A$ — or simply that $A$ is bounded with $\infty\notin\Omega$. List $A$ with multiplicities as $\alpha_1,\alpha_2,\dots$ and pick $\beta_n\in S^2\setminus\Omega$ nearest to $\alpha_n$; since $A$ has no limit point in $\Omega$, $|\alpha_n-\beta_n|\to0$. Put $f(z)=\prod E_n\big(\frac{\alpha_n-\beta_n}{z-\beta_n}\big)$. On a compact $K\subset\Omega$, $|z-\beta_n|\ge\dist(K,S^2\setminus\Omega)=\delta$, so the arguments are $\le\frac12$ for large $n$ and Lemma 15.8 bounds the $n$-th term of $\sum|1-E_n|$ by $2^{-n-1}$; 15.6 finishes.`,
      caption: String.raw`$\Omega$ is the unit disc and $A$ crowds the boundary (the first point counts twice). Each zero $\alpha_n$ is paired with the nearest boundary point $\beta_n$ (grey segment). Left: phase portrait of the partial product (drawn for $|z|<0.93$; beyond that the factors become enormous). Right, for the compact disc $K=\{|z|\le\rho\}$: $\sup_K|1-E_n(\cdot)|$ (gold) under the bound $t_n^{n+1}$ from 15.8, $t_n=|\alpha_n-\beta_n|/(1-\rho)$ (orange) — summable, although here $\sum(1-|\alpha_n|)=\infty$, so (by 15.23) no *bounded* function has these zeros.`,
      deps: ['rca-15.6', 'rca-15.8', 'rca-15.7'],
      see: ['rca-15.21', 'rca-15.23'],
      tags: ['Weierstrass products', 'zeros', 'open sets'],
      viz(v) {
        const NMAX = 80;
        const SEQ = {
          circ: { label: 'spiralling to the whole circle', a: (n) => { const r = 1 - 0.55 / Math.sqrt(n + 1); return [r * Math.cos(n * GOLD + 0.4), r * Math.sin(n * GOLD + 0.4)]; } },
          point: { label: 'converging to $z=1$', a: (n) => { const t = 0.9 * Math.pow(n + 1, -0.7), th = Math.PI + (n % 2 ? 0.75 : -0.75) * (1 - 0.5 / n); return [1 + t * Math.cos(th), t * Math.sin(th)]; } },
        };
        const which = v.select('$A$', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'circ');
        const Ns = v.slider('factors $N$', 1, NMAX, 40, { int: true });
        const rho = v.slider('$K=\\{|z|\\le\\rho\\}$, $\\rho$', 0.2, 0.9, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 350, axes: false, title: '$\\prod_{n\\le N}E_n\\big(\\frac{\\alpha_n-\\beta_n}{z-\\beta_n}\\big)$ in $\\Omega=U$' });
        const R = v.stage({ x: [0.5, NMAX + 0.5], y: [-16, 1], height: 350, axes: 'box', xlabel: 'n', yticks: logTicks(-16, 0, 4), title: '$\\sup_K|1-E_n|$ and the bound $t_n^{\\,n+1}$ (log scale)' });
        const out = [0, 0];
        let st = null;
        v.render(() => {
          const S = SEQ[which.value], N = Ns.value, r0 = rho.value;
          // α_1 is listed twice (multiplicity 2)
          const al = [S.a(1)].concat(Array.from({ length: NMAX - 1 }, (_, i) => S.a(i + 1)));
          const be = al.map(([x, y]) => { const m = Math.hypot(x, y); return [x / m, y / m]; });
          const term = (n, x, y) => { const [a, b] = al[n], [c, d] = be[n]; const nr = a - c, ni = b - d, dr = x - c, di = y - d, q = dr * dr + di * di; return logE(n + 1, (nr * dr + ni * di) / q, (ni * dr - nr * di) / q, out); };
          const bg = v.rgb('panel');
          L.raster((x, y) => {
            const m2 = x * x + y * y; if (m2 > 1) return null; if (m2 > 0.93 * 0.93) return [bg[0] * 0.9, bg[1] * 0.9, bg[2] * 0.9];
            let A = 0, B = 0; for (let n = 0; n < N; n++) { term(n, x, y); A += out[0]; B += out[1]; } return phaseLogRGB(v.M, A, B);
          }, { key: `${which.value},${N}`, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 2 });
          L.circle(0, 0, r0, { color: 'panel', width: 4 }); L.circle(0, 0, r0, { color: 'ink', width: 1.6, dash: [6, 4] });
          L.tex('K', r0 * Math.SQRT1_2, -r0 * Math.SQRT1_2, { color: 'ink', size: 14, dx: 9, dy: 9 });
          for (let n = 1; n < Math.min(N, 40); n++) L.line(al[n][0], al[n][1], be[n][0], be[n][1], { color: 'muted', width: 1 });
          for (let n = 0; n < N; n++) L.dot(al[n][0], al[n][1], { color: 'ink', r: 2.6 });
          L.text('2', al[0][0], al[0][1], { color: 'ink', size: 12, weight: 700, dx: 7, dy: -8 });
          // right: per-factor deviation on K (max on |z| = ρ, by the maximum principle)
          const sups = [], bnd = []; let sum = 0, bsum = 0;
          for (let n = 0; n < NMAX; n++) {
            let s = 0; for (let j = 0; j < 72; j++) { const t = 2 * Math.PI * (j + 0.5) / 72; term(n, r0 * Math.cos(t), r0 * Math.sin(t)); s = Math.max(s, oneMinusExp(out[0], out[1])); }
            sups.push([n + 1, Math.max(-16, Math.log10(s + 1e-300))]); sum += s;
            const tn = Math.hypot(al[n][0] - be[n][0], al[n][1] - be[n][1]) / (1 - r0);
            if (tn <= 1) { const b = (n + 2) * Math.log10(tn); bnd.push([n + 1, Math.max(-16, b)]); bsum += Math.pow(tn, n + 2); } else bnd.push(null);
          }
          R.hline(0, { color: 'faint', width: 1 });
          R.path(bnd, { color: 'orange', width: 1.8, dash: [6, 4] });
          R.dots(sups, { color: 'faint', r: 2.4 });
          R.dots(sups.slice(0, N), { color: 'gold', r: 3.2 });
          let blas = 0; for (let n = 1; n < NMAX; n++) blas += 1 - Math.hypot(...al[n]);
          st = { N, r0, sum, bsum, blas };
          v.legend([['ink', 'zeros $\\alpha_n$ (first one double)', { dot: true }], ['muted', '$\\alpha_n\\to\\beta_n\\in\\partial U$'], ['gold', '$\\sup_K|1-E_n|$, factors in use', { dot: true }], ['orange', 'bound $t_n^{n+1}$ (15.8)', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `On $K$ ($\\rho=${v.fix(s.r0, 2)}$): $\\sum_{n\\le80}\\sup_K|1-E_n| = ${v.fmt(s.sum, 4)}$ — finite, so the product converges uniformly on $K$. Meanwhile $\\sum_{n\\le80}(1-|\\alpha_n|) = ${v.fix(s.blas, 2)}$ and growing.`;
        });
      },
    },
    {
      num: '15.12',
      kind: 'Theorem',
      name: 'Meromorphic functions are quotients of holomorphic ones',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 15.12 and proof, p. 304'],
      statement: String.raw`If $f$ is meromorphic in an open set $\Omega\subset\C$, there are $g,h\in H(\Omega)$ with $f=g/h$ (and $h$ not identically $0$ on any component of $\Omega$).`,
      idea: String.raw`The poles of $f$ form a set $A$ without limit point in $\Omega$. By Theorem 15.11 there is $h\in H(\Omega)$ whose zeros are exactly the poles, each with the order of the pole. Then $g=hf$ has only removable singularities, so $g\in H(\Omega)$ and $f=g/h$. The converse is obvious, so the meromorphic functions on a region form the field of fractions of the integral domain $H(\Omega)$.`,
      caption: String.raw`$\Omega=U$; $f$ has simple poles at points $\alpha_n$ accumulating at the circle (first 30 used) and a pole of adjustable order $m$ at the draggable point $a$. Left: $f$ (around a pole the colours wind backwards). Middle: $h$, the 15.11 product with a zero of the same order at each pole. Right: $g=hf$ — the poles are gone. The readout compares $\max|f|$ and $\max|g|$ on a tiny circle around $a$.`,
      deps: ['rca-15.11'],
      tags: ['meromorphic', 'Weierstrass products'],
      viz(v) {
        const { Cx } = v.M;
        const NP = 30;
        const al = Array.from({ length: NP }, (_, i) => { const n = i + 1, r = 1 - 0.42 * Math.pow(n, -0.55), t = 1.1 * n + 0.3 * Math.sin(n); return [r * Math.cos(t), r * Math.sin(t)]; });
        const cs = Array.from({ length: NP }, (_, i) => Cx.polar(0.2 * Math.pow(i + 1, -0.6), 2.1 * i));
        const mS = v.slider('order $m$ of the pole at $a$', 1, 3, 2, { int: true });
        const stg = (t) => v.stage({ x: [-1.04, 1.04], y: [-1.04, 1.04], equal: true, height: 270, axes: false, minWidth: 230, title: t });
        const F = stg('$f$ (poles)'), H = stg('$h$ from 15.11 (zeros)'), G = stg('$g=hf\\in H(U)$');
        const a = F.handle(0.32, 0.18, { color: 'ink', label: 'a', labelPos: 'ne', constrain: (x, y) => { const m = Math.hypot(x, y); const c = v.M.clamp(m, 0.12, 0.8); return [x * c / (m || 1), y * c / (m || 1)]; } });
        const out = [0, 0];
        let st = null;
        v.render(() => {
          const m = mS.value, A = [a.x, a.y];
          const pts = al.slice(), idx = al.map((_, i) => i + 1);
          for (let j = 0; j < m; j++) { pts.unshift(A); }
          const be = pts.map(([x, y]) => { const r = Math.hypot(x, y); return [x / r, y / r]; });
          const fXY = (x, y) => { let re = 0, im = 0; for (let i = 0; i < NP; i++) { const dx = x - al[i][0], dy = y - al[i][1], q = dx * dx + dy * dy, c = cs[i]; re += (c.re * dx + c.im * dy) / q; im += (c.im * dx - c.re * dy) / q; } let dr = x - A[0], di = y - A[1]; let pr = 1, pi = 0; for (let j = 0; j < m; j++) { const t = pr * dr - pi * di; pi = pr * di + pi * dr; pr = t; } const q = pr * pr + pi * pi; re += 0.06 * pr / q; im -= 0.06 * pi / q; return [re, im]; };
          const logh = (x, y) => { let s0 = 0, s1 = 0; for (let n = 0; n < pts.length; n++) { const [p, q] = pts[n], [c, d] = be[n]; const nr = p - c, ni = q - d, dr = x - c, di = y - d, w = dr * dr + di * di; logE(n + 1, (nr * dr + ni * di) / w, (ni * dr - nr * di) / w, out); s0 += out[0]; s1 += out[1]; } return [s0, s1]; };
          const inside = (x, y) => x * x + y * y < 0.95 * 0.95;
          const key = `${a.x},${a.y},${m}`;
          F.raster((x, y) => { if (!inside(x, y)) return null; const [re, im] = fXY(x, y); return phaseRGB(v.M, re, im); }, { key, res: 2 });
          H.raster((x, y) => { if (!inside(x, y)) return null; const [p, q] = logh(x, y); return phaseLogRGB(v.M, p, q); }, { key, res: 2 });
          G.raster((x, y) => { if (!inside(x, y)) return null; const [re, im] = fXY(x, y), [p, q] = logh(x, y); return phaseLogRGB(v.M, p + 0.5 * Math.log(re * re + im * im), q + Math.atan2(im, re)); }, { key, res: 2 });
          for (const S of [F, H, G]) { S.circle(0, 0, 1, { color: 'ink', width: 1.8 }); S.circle(0, 0, 0.95, { color: 'muted', width: 1, dash: [2, 4] }); }
          for (const [x, y] of al) { if (x * x + y * y < 0.95 * 0.95) { xMark(F, x, y, 'ink', 3); H.dot(x, y, { color: 'ink', r: 2.2 }); } }
          H.dot(A[0], A[1], { color: 'ink', r: 3.5 }); H.text(String(m), A[0], A[1], { color: 'ink', size: 12, weight: 700, dx: 7, dy: -9 });
          ring(v, G, A[0], A[1], 7, 'ink', 1.5);
          // sizes on a small circle around a
          let mf = 0, mg = 0;
          for (let j = 0; j < 48; j++) { const t = 2 * Math.PI * j / 48, x = A[0] + 0.015 * Math.cos(t), y = A[1] + 0.015 * Math.sin(t); const [re, im] = fXY(x, y), [p] = logh(x, y); const lf = 0.5 * Math.log(re * re + im * im); mf = Math.max(mf, lf); mg = Math.max(mg, lf + p); }
          st = { m, mf: Math.exp(mf), mg: Math.exp(mg) };
          v.legend([['ink', 'poles of $f$ / zeros of $h$ (number = order)', { dot: true }], ['muted', '$|z|=0.95$: drawing stops here', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `Pole of order $${s.m}$ at $a$: on $|z-a|=0.015$, $\\;\\max|f| = ${v.sci(s.mf, 3)}$ but $\\max|g| = ${v.sci(s.mg, 3)}$ — $g=hf$ is bounded there, so the singularity is removable.`;
        });
      },
    },
    // ------------------------------------------------------------------ interpolation
    {
      num: '15.13',
      kind: 'Theorem',
      name: 'Interpolation: prescribing values and derivatives',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 15.13 and complete proof, pp. 304–305'],
      statement: String.raw`Let $\Omega\subset\C$ be open and let $A\subset\Omega$ have no limit point in $\Omega$. Suppose that to each $\alpha\in A$ there are assigned an integer $m(\alpha)\ge0$ and complex numbers $w_{n,\alpha}$, $0\le n\le m(\alpha)$. Then there is $f\in H(\Omega)$ with
$$f^{(n)}(\alpha)=n!\,w_{n,\alpha}\qquad(\alpha\in A,\ 0\le n\le m(\alpha)),$$
i.e. near each $\alpha$, $f(z)=\sum_{n\le m(\alpha)}w_{n,\alpha}(z-\alpha)^n+O\big((z-\alpha)^{m(\alpha)+1}\big)$.`,
      idea: String.raw`Take $g\in H(\Omega)$ with a zero of order exactly $m(\alpha)+1$ at each $\alpha\in A$ and no other zeros (15.11). Near $\alpha$, $g(z)=(z-\alpha)^{m+1}(b_0+b_1(z-\alpha)+\cdots)$ with $b_0\ne0$, so one can solve successively for a principal part $P_\alpha(z)=\sum_{j=1}^{m+1}c_j(z-\alpha)^{-j}$ with $gP_\alpha=w_{0,\alpha}+w_{1,\alpha}(z-\alpha)+\cdots+w_{m,\alpha}(z-\alpha)^m+\cdots$. The Mittag-Leffler theorem (13.10) gives $h$ meromorphic in $\Omega$ with exactly these principal parts, and $f=gh$ works: the poles of $h$ are cancelled by the zeros of $g$.`,
      caption: String.raw`$\Omega=\C$, $A=\Z$. Drag the prescribed values $f(n)=w_n$ (blue handles; $w_n=0$ for $|n|\ge5$) and, with $m=1$, the prescribed slopes $f'(n)$ (orange handles). Top: the interpolant $f=gh$ on the real axis, with $g=(\frac{\sin\pi z}{\pi})^{m+1}$ dashed. Below: the Mittag-Leffler function $h=\sum_n P_n$, with poles on $A$, and the product $f=gh$, entire (rings: the former poles) — the same proof as in the book, with every ingredient explicit.`,
      deps: ['rca-15.11', 'rca-13.10'],
      tags: ['interpolation', 'Mittag-Leffler'],
      viz(v) {
        const { Cx } = v.M;
        const NS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
        const W0 = [0.4, -0.3, 0.9, 0.2, 1.1, -0.6, 0.5, 1.0, -0.2], S0 = [0.8, -1, 0, 1.4, 0, -1.2, 1.5, -0.4, 0.6];
        const mode = v.select('', [{ value: 0, label: 'values only ($m=0$)' }, { value: 1, label: 'values and slopes ($m=1$)' }], 1);
        const T = v.stage({ x: [-5.6, 5.6], y: [-1.6, 2.1], height: 260, full: true, xlabel: 'x', title: 'the interpolant $f=gh$ on $\\mathbb R$' });
        const Hs = v.stage({ x: [-5.6, 5.6], y: [-1.1, 1.1], height: 120, full: true, axes: false, title: 'phase of $h=\\sum_n P_n$ (Mittag-Leffler: poles on $A$)' });
        const Fs = v.stage({ x: [-5.6, 5.6], y: [-1.1, 1.1], height: 120, full: true, axes: false, title: 'phase of $f=gh$ (entire)' });
        const DX = 0.42;
        const vh = NS.map((n, i) => T.handle(n, W0[i], { color: 'blue', r: 6, constrain: (x, y) => [n, v.M.clamp(y, -1.4, 1.9)] }));
        const sh = NS.map((n, i) => T.handle(n + DX, W0[i] + DX * S0[i], { color: 'orange', r: 5, constrain: (x, y) => [n + DX, v.M.clamp(y, -1.55, 2.05)] }));
        vh.forEach((h, i) => { let prev = h.y; h.onDrag = () => { sh[i].y += h.y - prev; prev = h.y; }; h._sync = () => { prev = h.y; }; });
        let st = null;
        v.render(() => {
          const m = mode.value;
          const w = vh.map((h) => h.y), s = sh.map((h, i) => (h.y - vh[i].y) / DX);
          vh.forEach((h) => h._sync());
          sh.forEach((h) => { h.visible = m === 1; });
          // f = g h  with  g = (sin πz / π)^{m+1},  h = Σ P_n
          const fR = (x) => { const n0 = Math.round(x), g = (n0 % 2 ? -1 : 1) * Math.sin(Math.PI * (x - n0)) / Math.PI; let h = 0; NS.forEach((n, i) => { const d = x - n; if (m === 0) h += (n % 2 ? -1 : 1) * w[i] / d; else h += w[i] / (d * d) + s[i] / d; }); const G = m === 0 ? g : g * g; const val = G * h; return isFinite(val) ? val : null; };
          const hC = (z) => { let h = new Cx(0, 0); NS.forEach((n, i) => { const d = z.sub(n); if (m === 0) h = h.add(new Cx((n % 2 ? -1 : 1) * w[i], 0).div(d)); else h = h.add(new Cx(w[i], 0).div(d.mul(d))).add(new Cx(s[i], 0).div(d)); }); return h; };
          const gC = (z) => { const g = z.scale(Math.PI).sin().scale(1 / Math.PI); return m === 0 ? g : g.mul(g); };
          T.fn((x) => { const g = Math.sin(Math.PI * x) / Math.PI; return m === 0 ? g : g * g; }, { color: 'muted', width: 1.4, dash: [5, 4] });
          T.fn((x) => { const y = fR(x); return y == null ? fR(x + 1e-7) : y; }, { color: 'green', width: 2.8, n: 1400 });
          for (let n = -5; n <= 5; n++) if (Math.abs(n) === 5) T.dot(n, 0, { color: 'blue', r: 3.5 });
          if (m === 1) NS.forEach((n, i) => { T.line(n - DX, w[i] - DX * s[i], n + DX, w[i] + DX * s[i], { color: 'orange', width: 2, alpha: 0.85 }); });
          const key = `${m}|${w.map((x) => x.toFixed(3))}|${m ? s.map((x) => x.toFixed(3)) : ''}`;
          Hs.domain(hC, { key, res: 2 });
          Fs.domain((z) => gC(z).mul(hC(z)), { key, res: 2 });
          for (const n of NS) { xMark(Hs, n, 0, 'ink', 3.5); ring(v, Fs, n, 0, 5, 'ink', 1.4); }
          // numerical check of the interpolation conditions
          let errV = 0, errS = 0;
          NS.forEach((n, i) => { const e = 1e-4; const f0 = (fR(n + e) + fR(n - e)) / 2; errV = Math.max(errV, Math.abs(f0 - w[i])); if (m === 1) errS = Math.max(errS, Math.abs((fR(n + e) - fR(n - e)) / (2 * e) - s[i])); });
          st = { m, errV, errS };
          v.legend(m === 1 ? [['green', '$f=gh$'], ['muted', '$g=(\\sin\\pi z/\\pi)^2$', { dash: true }], ['blue', 'prescribed $f(n)=w_{0,n}$', { dot: true }], ['orange', 'prescribed slope $f\'(n)=w_{1,n}$']] : [['green', '$f=gh$'], ['muted', '$g=\\sin\\pi z/\\pi$', { dash: true }], ['blue', 'prescribed $f(n)=w_{0,n}$', { dot: true }]]);
        });
        v.readout(() => {
          const q = st; if (!q) return '';
          const pp = q.m === 1 ? '$P_n(z)=\\frac{w_{0,n}}{(z-n)^2}+\\frac{w_{1,n}}{z-n}$' : '$P_n(z)=\\frac{(-1)^n\\,w_{0,n}}{z-n}$';
          return `Principal parts ${pp}. Measured: $\\max_n|f(n)-w_{0,n}| = ${v.sci(q.errV, 2)}$${q.m === 1 ? `, $\\;\\max_n|f'(n)-w_{1,n}| = ${v.sci(q.errS, 2)}$` : ''} (finite differences), and $f(n)=0$ for $|n|\\ge5$.`;
        });
      },
    },
    {
      num: '15.14',
      kind: 'Definition',
      name: 'Ideals in $H(\\Omega)$; principal ideals',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Definition 15.14, p. 305'],
      statement: String.raw`$H(\Omega)$ is a commutative ring under pointwise operations (an integral domain when $\Omega$ is a region). For $g_1,\dots,g_n\in H(\Omega)$, the **ideal generated** by them is
$$[g_1,\dots,g_n]=\Big\{\textstyle\sum_{i=1}^n f_ig_i:\ f_1,\dots,f_n\in H(\Omega)\Big\}.$$
An ideal is **finitely generated** if it has this form and **principal** if it is generated by a single function: $[g]=\{fg:f\in H(\Omega)\}$. Note $[1]=H(\Omega)$. For $f\in H(\Omega)$ not identically $0$ near $\alpha$, $m(f;\alpha)$ is the order of the zero of $f$ at $\alpha$ ($0$ if $f(\alpha)\ne0$).`,
      idea: String.raw`Every element of $[g_1,\dots,g_n]$ vanishes at least to order $\min_i m(g_i;\alpha)$ at each $\alpha$, so the common zeros (with their minimal multiplicities) are the only information an ideal can see. Theorem 15.15 shows that, for finitely generated ideals, this information determines the ideal completely.`,
      deps: ['rca-10.18'],
      tags: ['ideals', 'algebra'],
    },
    {
      num: '15.15',
      kind: 'Theorem',
      name: 'Finitely generated ideals of $H(\\Omega)$ are principal',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 15.15 and complete proof, p. 306'],
      statement: String.raw`Every finitely generated ideal in $H(\Omega)$ is principal. More precisely: given $g_1,\dots,g_n\in H(\Omega)$ there are $g,f_i,h_i\in H(\Omega)$ such that
$$g=\sum_{i=1}^nf_ig_i\qquad\text{and}\qquad g_i=h_ig\quad(1\le i\le n).$$
On a component where some generator is not identically zero, $g$ vanishes exactly at the common zeros, to the minimum of the finite multiplicities of the nonzero generators. On a component where every generator is identically zero, take $g=0$.`,
      idea: String.raw`Work on a region and induct on $n$, proving: if $g_1,\dots,g_n$ have no common zero then $[g_1,\dots,g_n]=[1]$. Given the case $n-1$, use 15.11 to factor out $\varphi$ with $m(\varphi;\alpha)=\min_{i<n}m(g_i;\alpha)$; then $[g_1,\dots,g_n]=[\varphi,g_n]$, and $g_n\ne0$ on the zeros of $\varphi$. The interpolation theorem 15.13 produces $h$ with $1-hg_n$ vanishing at every zero of $\varphi$ to at least its order, so $f=(1-hg_n)/\varphi\in H(\Omega)$ and $1=f\varphi+hg_n$. For general generators divide first by a function carrying the common zeros with minimal multiplicities.`,
      caption: String.raw`$g_1=\sin\pi z$ (zeros: all integers) and $g_2=(z-a)(z-b)(z-c)$ with draggable roots; a root dropped near an integer snaps onto it and becomes a common zero (green). The gcd $\varphi$ carries exactly the common zeros. Bottom left: the coefficient $H=(1-F\,G_1)/G_2$ with $G_i=g_i/\varphi$, where the polynomial $F$ interpolates $1/G_1$ at the roots of $G_2$ (the 15.13 step) — it is entire: no poles at the red points. Bottom right: $Fg_1+Hg_2$, computed from the four functions; only the common zeros survive, so it equals $\varphi$. With no common zero the combination is the constant $1$: the ideal is everything.`,
      deps: ['rca-15.13', 'rca-15.11', 'rca-15.14'],
      tags: ['ideals', 'interpolation', 'algebra'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const VX = [-3.3, 3.3], VY = [-1.45, 1.45];
        const mk = (t) => v.stage({ x: VX, y: VY, equal: true, height: 185, axes: false, minWidth: 300, title: t });
        const G1 = mk('$g_1(z)=\\sin\\pi z$'), G2 = mk('$g_2(z)=(z-a)(z-b)(z-c)$ — drag the roots');
        const HH = mk('$H=(1-F\\,G_1)/G_2$, entire'), PH = mk('$F\\,g_1+H\\,g_2=\\varphi$');
        const snap = (x, y) => { const n = Math.round(x); return Math.abs(x - n) < 0.16 && Math.abs(y) < 0.16 ? [n, 0] : [x, y]; };
        const H3 = [[1, 0], [-1.6, 0.7], [0.45, -0.75]].map(([x, y], i) => G2.handle(x, y, { color: 'red', r: 6, label: 'abc'[i], labelPos: 'ne', constrain: (x2, y2) => snap(x2, y2) }));
        let st = null;
        v.render(() => {
          // separate the roots (keep them ≥ 0.25 apart; at most one root per integer)
          const R = H3.map((h) => [h.x, h.y]);
          const isInt = (p) => p[1] === 0 && Number.isInteger(p[0]);
          for (let i = 0; i < 3; i++) for (let j = 0; j < i; j++) if (Math.hypot(R[i][0] - R[j][0], R[i][1] - R[j][1]) < 0.25) { R[i] = [R[i][0] + 0.3, R[i][1] + 0.3]; H3[i].x = R[i][0]; H3[i].y = R[i][1]; }
          const common = R.filter(isInt).map((p) => p[0]), other = R.filter((p) => !isInt(p)).map(([x, y]) => new Cx(x, y));
          const phi = (z) => common.reduce((p, c) => p.mul(z.sub(c)), one);
          const g1 = (z) => z.scale(Math.PI).sin(), g2 = (z) => R.reduce((p, [x, y]) => p.mul(z.sub(new Cx(x, y))), one);
          const Gs1 = (z) => g1(z).div(phi(z)), Gs2 = (z) => other.reduce((p, r) => p.mul(z.sub(r)), one);
          // F = Lagrange interpolant of 1/G_1 at the roots of G_2
          const vals = other.map((r) => one.div(Gs1(r)));
          const F = (z) => other.reduce((acc, r, i) => { let L = vals[i]; other.forEach((q, j) => { if (j !== i) L = L.mul(z.sub(q)).div(r.sub(q)); }); return acc.add(L); }, new Cx(0, 0));
          const Hf = (z) => (other.length ? one.sub(F(z).mul(Gs1(z))).div(Gs2(z)) : one);
          const key = R.map((p) => p.join(',')).join('|');
          G1.domain(g1, { key: 'g1', res: 2 });
          G2.domain(g2, { key, res: 2 });
          HH.domain(Hf, { key, res: 2 });
          PH.domain((z) => F(z).mul(g1(z)).add(Hf(z).mul(g2(z))), { key, res: 2 });
          for (let n = -3; n <= 3; n++) { const c = common.includes(n); G1.dot(n, 0, { color: c ? 'green' : 'blue', r: 4 }); if (c) { ring(v, G2, n, 0, 9, 'green', 2.4); ring(v, PH, n, 0, 9, 'green', 2.4); } }
          for (const r of other) ring(v, HH, r.re, r.im, 8, 'red', 2);
          // residual check on a grid
          let res = 0; for (let i = -6; i <= 6; i++) for (let j = -2; j <= 2; j++) { const z = new Cx(i * 0.47 + 0.013, j * 0.53 + 0.007); res = Math.max(res, F(z).mul(g1(z)).add(Hf(z).mul(g2(z))).sub(phi(z)).abs() / Math.max(1, phi(z).abs())); }
          st = { common, nOther: other.length, res, Fdeg: Math.max(0, other.length - 1) };
          v.legend([['blue', 'zeros of $g_1$', { dot: true }], ['red', 'roots of $g_2$', { dot: true }], ['green', 'common zeros = zeros of $\\varphi$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const ph = s.common.length ? `\\varphi(z)=${s.common.map((c) => `(z${c < 0 ? '+' + -c : c === 0 ? '' : '-' + c})`).join('')}` : '\\varphi\\equiv1';
          return `Common zeros: ${s.common.length ? `$${s.common.join(',\\ ')}$` : 'none'}, so $[g_1,g_2]=[\\varphi]$ with $${ph}$. $F$ has degree $\\le ${s.Fdeg}$; relative residual of $Fg_1+Hg_2-\\varphi$ on a test grid: $${v.sci(s.res, 2)}$.`;
        });
      },
    },
  ],
};
