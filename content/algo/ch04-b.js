// Algorithms — Chapter 4 (part b): items 4.9–4.15

const LG = Math.log2;
const TAU = 2 * Math.PI;
function tnum(x, sig = 3) {
  if (!isFinite(x)) return '\\infty';
  const a = Math.abs(x);
  if (a >= 1e6) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${m.toFixed(sig - 1)}\\times10^{${e}}`; }
  if (Number.isInteger(x) || a >= 100) return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  return String(+x.toPrecision(sig));
}
const mnus = (s) => String(s).replace(/-/g, '−');
const fx = (x, d = 2) => mnus((Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d));
const cfx = (re, im, d = 3) => `${fx(re, d)} ${im < 0 && Math.abs(im) >= 0.5 * 10 ** -d ? '-' : '+'} ${fx(Math.abs(im), d)}i`;
const SUB = (k) => String(k).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');
const SUP = (k) => String(k).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
const PAIRC = ['blue', 'orange', 'teal', 'purple', 'pink', 'gold', 'green', 'red'];
const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };
function crossover(f, g, xs) { // first sample from which f < g holds to the end of xs
  let k = xs.length - 1; if (!(f(xs[k]) < g(xs[k]))) return null;
  while (k > 0 && f(xs[k - 1]) < g(xs[k - 1])) k--;
  return xs[k];
}
// complex helpers on [re, im]
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const root = (n, k) => [Math.cos(TAU * k / n), Math.sin(TAU * k / n)]; // ω_n^k = e^{2πik/n}

// the DFT in the convention of the chapter, y_k = A(ω_n^k) with ω_n = e^{2πi/n}, via v.M.fft (which uses e^{−2πi/n})
function dftCLRS(M, re, im) { const r = re.slice(), i = (im || re.map(() => 0)).map((x) => -x); M.fft(r, i); return [r, i.map((x) => -x)]; }
// inverse: a_j = (1/n) Σ y_k ω_n^{−jk}, which is exactly the e^{−2πi/n} transform divided by n
function idftCLRS(M, re, im) { const r = re.slice(), i = im.slice(); M.fft(r, i); const n = r.length; return [r.map((x) => x / n), i.map((x) => x / n)]; }
// naive evaluation y_k = Σ a_j ω^{jk}
function dftNaive(a) { const n = a.length; return Array.from({ length: n }, (_, k) => { let s = [0, 0]; for (let j = 0; j < n; j++) s = cadd(s, cmul(a[j], root(n, j * k))); return s; }); }

// small dial showing a complex value: circle of radius R px, needle of length ∝ |z|
function phasor(v, s, x, y, z, sc, R, col, st = {}) {
  const X = s.X(x), Y = s.Y(y), c = s.ctx, m = cabs(z), L = Math.min(1, m * sc) * (R - 2), th = Math.atan2(z[1], z[0]);
  c.save();
  c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fillStyle = v.color(st.fill || 'panel', st.fillAlpha ?? 1); c.fill();
  c.lineWidth = st.ring || 1.2; c.strokeStyle = v.color(st.ringColor || 'faint'); c.stroke();
  if (L > 0.6) {
    const ex = X + L * Math.cos(th), ey = Y - L * Math.sin(th);
    c.beginPath(); c.moveTo(X, Y); c.lineTo(ex, ey); c.strokeStyle = v.color(col); c.lineWidth = st.width || 2; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(ex, ey, 2.4, 0, TAU); c.fillStyle = v.color(col); c.fill();
  } else { c.beginPath(); c.arc(X, Y, 1.6, 0, TAU); c.fillStyle = v.color(col); c.fill(); }
  c.restore();
}

// ---- 4.11 recursive FFT with recorded frames
function fftRecRun(a) {
  const nodes = [], frames = []; let mul = 0, add = 0, last = null;
  const snap = (o) => { frames.push({ mul, add, last, ...o }); return frames.length - 1; };
  (function rec(idx, depth, slot, parent) {
    const n = idx.length, nd = { idx, depth, slot, parent, kids: [], n };
    nodes.push(nd); if (parent) parent.kids.push(nd);
    if (n === 1) { nd.y = [[a[idx[0]], 0]]; nd.t0 = nd.t1 = snap({ node: nd, line: 2, note: `A single coefficient is its own transform: $y_0 = a_{${idx[0]}} = ${fx(a[idx[0]])}$.` }); return nd.y; }
    nd.t0 = snap({ node: nd, line: [3, 4], note: `Size ${n}: split $(${idx.map((i) => `a_{${i}}`).join(',')})$ into the even-indexed and the odd-indexed half, $A(x) = A^{[0]}(x^2) + x\\,A^{[1]}(x^2)$.` });
    const E = rec(idx.filter((_, i) => i % 2 === 0), depth + 1, slot * 2, nd);
    const O = rec(idx.filter((_, i) => i % 2 === 1), depth + 1, slot * 2 + 1, nd);
    const y = new Array(n).fill(null); Object.assign(nd, { E, O, y });
    for (let k = 0; k < n / 2; k++) {
      const w = root(n, k), t = cmul(w, O[k]); mul++;
      y[k] = cadd(E[k], t); y[k + n / 2] = csub(E[k], t); add += 2;
      last = { node: nd, k, w, E: E[k], T: t, ys: y.slice() };
      snap({ node: nd, bf: true, line: [5, 6, 7], hold: k === n / 2 - 1 ? 1.4 : 1, note: `Butterfly $k = ${k}$ at size ${n}: $t = \\omega_{${n}}^{${k}}\\,y^{[1]}_{${k}} = ${cfx(t[0], t[1], 2)}$, then $y_{${k}} = y^{[0]}_{${k}} + t = ${cfx(y[k][0], y[k][1], 2)}$ and $y_{${k + n / 2}} = y^{[0]}_{${k}} - t = ${cfx(y[k + n / 2][0], y[k + n / 2][1], 2)}$.` });
    }
    nd.t1 = frames.length - 1;
    return y;
  })(a.map((_, i) => i), 0, 0, null);
  return { nodes, frames, mul, add, root: nodes[0] };
}

// ---- 4.14 iterative FFT with recorded frames (CLRS convention)
const bitrev = (i, L) => { let r = 0; for (let b = 0; b < L; b++) r |= ((i >> b) & 1) << (L - 1 - b); return r; };
function fftIterRun(a, skipRev, record = true) {
  const n = a.length, L = Math.round(LG(n)), A = a.map((x) => [x, 0]), frames = [];
  const cols = [A.map((z) => z.slice())]; let bf = 0, mul = 0;
  const snap = (o) => { if (record) frames.push({ cols: cols.map((c) => c.map((z) => (z ? z.slice() : null))), bf, mul, ...o }); };
  snap({ phase: 'input', line: 1, note: 'The input in natural order, $a_0, a_1, \\dots$ (real numbers: every needle points left or right).' });
  const P = A.map(() => null); cols.push(P);
  if (!skipRev) {
    for (let i = 0; i < n; i++) { const r = bitrev(i, L); if (i <= r) { P[i] = A[r].slice(); P[r] = A[i].slice(); if (i < r) snap({ phase: 'perm', swap: [i, r], line: 2, note: `Swap positions ${i} = ${i.toString(2).padStart(L, '0')}₂ and ${r} = ${r.toString(2).padStart(L, '0')}₂: each index goes to the position with its ${L} bits reversed.` }); } }
  } else for (let i = 0; i < n; i++) P[i] = A[i].slice();
  for (let i = 0; i < n; i++) A[i] = P[i].slice();
  snap({ phase: 'perm', line: 2, note: skipRev ? '**Bit reversal skipped**: the butterflies will run on the natural order.' : 'Bit-reversed order: the leaves of the recursion tree of 4.11, read left to right.' });
  for (let s = 1; s <= L; s++) {
    const m = 2 ** s, C = A.map(() => null); cols.push(C);
    for (let k = 0; k < n; k += m) for (let j = 0; j < m / 2; j++) {
      const w = root(m, j), t = cmul(w, A[k + j + m / 2]), u = A[k + j];
      A[k + j] = cadd(u, t); A[k + j + m / 2] = csub(u, t); bf++; mul++;
      C[k + j] = A[k + j].slice(); C[k + j + m / 2] = A[k + j + m / 2].slice();
      snap({ phase: 'bf', s, m, k, j, pos: [k + j, k + j + m / 2], line: [4, 5, 6, 7], note: `Stage ${s} (blocks of ${m}): butterfly on positions ${k + j} and ${k + j + m / 2} with twiddle $\\omega_{${m}}^{${j}}$: $u \\pm \\omega_{${m}}^{${j}}\\,v$, written back in place.` });
    }
  }
  return { frames, out: A, L, bf };
}

// ---- 4.15 cost models (elementary operations; see captions)
function karCostsTo(n0, N) {
  const K = new Float64Array(N + 1);
  for (let n = 1; n <= N; n++) K[n] = n <= n0 ? 2 * n * n + n : K[n - Math.ceil(n / 2)] + 2 * K[Math.ceil(n / 2)] + 10 * Math.ceil(n / 2) + 4;
  return K;
}
const fftMulCost = (n, b) => { const K = Math.ceil(n / b), N = nextPow2(2 * K - 1), l = Math.max(1, LG(N)); return 15 * N * l + 9 * N + 4 * K + n; };
// float FFT convolution of integer blocks: returns raw floating results
function fftConv(M, xa, ya) {
  const L = xa.length + ya.length - 1, N = nextPow2(L), ar = new Array(N).fill(0), ai = new Array(N).fill(0), br = new Array(N).fill(0), bi = new Array(N).fill(0);
  xa.forEach((x, i) => { ar[i] = x; }); ya.forEach((y, i) => { br[i] = y; });
  M.fft(ar, ai); M.fft(br, bi);
  const cr = ar.map((x, k) => x * br[k] - ai[k] * bi[k]), ci = ar.map((x, k) => x * bi[k] + ai[k] * br[k]);
  M.ifft(cr, ci);
  return cr.slice(0, L);
}
const toBlocks = (X, b) => { const B = 10n ** BigInt(b), out = []; let t = X; do { out.push(Number(t % B)); t /= B; } while (t > 0n); return out; };

export default {
  collection: 'algo',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Lemma',
      name: 'Cancellation, halving and summation lemmas',
      statement: String.raw`Let $\omega_n=e^{2\pi i/n}$. For integers $n\ge1$, $d\ge1$, $k$ and $j$:
(a) **Cancellation:** $\omega_{dn}^{dk}=\omega_n^k$. In particular $\omega_n^{n/2}=\omega_2=-1$ for even $n$.
(b) **Halving:** if $n$ is even, the squares of the $n$ complex $n$-th roots of unity are exactly the $n/2$ complex $(n/2)$-th roots of unity, each obtained twice, since $(\omega_n^{k+n/2})^2=(\omega_n^k)^2=\omega_{n/2}^k$.
(c) **Summation:** $\displaystyle\sum_{k=0}^{n-1}\left(\omega_n^{j}\right)^k=\begin{cases}n & \text{if } n\mid j,\\ 0 & \text{otherwise.}\end{cases}$`,
      idea: String.raw`All three follow from $\omega_n^k=e^{2\pi ik/n}$ (4.8). Cancellation is the identity $e^{2\pi i\,dk/(dn)}=e^{2\pi ik/n}$. Halving: squaring doubles angles, and the angles $2\pi k/n$ and $2\pi(k+n/2)/n$ differ by $\pi$, so they double to the same angle; this is what lets the FFT replace $n$ evaluation points by $n/2$ at each level. Summation: for $\omega_n^j\neq1$ the geometric sum is $\frac{(\omega_n^j)^n-1}{\omega_n^j-1}=0$ because $(\omega_n^n)^j=1$; geometrically, $n$ unit steps turning by the same angle each time close up into a (possibly star-shaped) polygon.`,
      caption: String.raw`**Cancellation**: the $dn$-th roots (small dots) contain the $n$-th roots (big dots); $dk$ small steps land where $k$ big steps do. **Halving**: slide $t$ to square every root continuously (angles grow by a factor $1+t$); partners $k$ and $k+n/2$ share a colour and meet, two by two, on the $(n/2)$-gon. Pick an odd $n$ to see squaring merely permute the roots. **Summation**: the powers $\omega^{jk}$ visit the circle and their unit steps, laid head to tail, close into a star polygon unless $n$ divides $j$.`,
      deps: ['algo-4.8'],
      refs: ['CLRS 4e §30.2'],
      tags: ['fft'],
      viz(v) {
        const lem = v.select('lemma', [{ value: 'cancel', label: 'cancellation' }, { value: 'halve', label: 'halving' }, { value: 'sum', label: 'summation' }], 'halve', { onChange: () => vis() });
        const nS = v.slider('$n$', 2, 16, 8, { int: true });
        const dS = v.slider('$d$', 1, 4, 2, { int: true });
        const kS = v.slider('$k$', 0, 15, 3, { int: true });
        const tS = v.slider('squaring progress $t$', 0, 1, 1, { step: 0.01 });
        const jS = v.slider('$j$', 0, 32, 3, { int: true });
        function vis() { const l = lem.value; dS.el.hidden = kS.el.hidden = l !== 'cancel'; tS.el.hidden = l !== 'halve'; jS.el.hidden = l !== 'sum'; }
        vis();
        const C = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: 350 });
        const D = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350 });
        let info = {};
        v.render(() => {
          const l = lem.value, n = nS.value;
          C.circle(0, 0, 1, { color: 'muted', width: 1.2 }); C.line(-1.5, 0, 1.5, 0, { color: 'grid', width: 1 }); C.line(0, -1.5, 0, 1.5, { color: 'grid', width: 1 });
          if (l === 'cancel') {
            const d = dS.value, k = Math.min(kS.value, n - 1), N = d * n;
            C.setTitle(`$\\omega_{${N}}^{${d * k}} = \\omega_{${n}}^{${k}}$`); D.setTitle('the same angle, measured in turns');
            for (let j = 0; j < N; j++) { const [x, y] = root(N, j); C.dot(x, y, { r: 2.8, color: 'muted' }); }
            for (let j = 0; j < n; j++) { const [x, y] = root(n, j); C.dot(x, y, { r: 6, color: 'accent', hollow: true, width: 2 }); }
            const th = TAU * k / n;
            C.curve((t) => [1.14 * Math.cos(t), 1.14 * Math.sin(t)], 0, th, { color: 'orange', width: 2.4 });
            C.curve((t) => [0.86 * Math.cos(t), 0.86 * Math.sin(t)], 0, th, { color: 'gold', width: 2.4, dash: [2, 3] });
            for (let j = 1; j <= d * k; j++) { const [x, y] = root(N, j); C.dot(0.86 * x, 0.86 * y, { r: 2, color: 'gold' }); }
            for (let j = 1; j <= k; j++) { const [x, y] = root(n, j); C.dot(1.14 * x, 1.14 * y, { r: 3, color: 'orange' }); }
            const [px, py] = root(n, k); C.dot(px, py, { r: 7.5, color: 'green' });
            C.text(`${d * k} small steps`, 0, -0.32, { align: 'center', size: 11.5, color: 'gold', weight: 600 });
            C.text(`${k} big steps`, 0, -0.5, { align: 'center', size: 11.5, color: 'orange', weight: 600 });
            // number line in turns
            D.setView([-0.06, 1.06], [0, 1]);
            D.line(0, 0.5, 1, 0.5, { color: 'muted', width: 1.5 });
            for (let j = 0; j <= N; j++) D.line(j / N, 0.47, j / N, 0.53, { color: 'muted', width: 1 });
            for (let j = 0; j <= n; j++) { D.line(j / n, 0.42, j / n, 0.58, { color: 'accent', width: 2 }); D.text(`${j}/${n}`, j / n, 0.62, { align: 'center', size: 10.5, color: 'accent' }); }
            D.arrow(0, 0.36, k / n, 0.36, { color: 'gold', width: 2 }); D.text(`${d * k}/${N}`, k / n, 0.3, { align: 'center', size: 12, color: 'gold', weight: 700 });
            D.arrow(0, 0.72, k / n, 0.72, { color: 'orange', width: 2 }); D.text(`${k}/${n}`, k / n, 0.79, { align: 'center', size: 12, color: 'orange', weight: 700 });
            D.dot(k / n, 0.5, { r: 6, color: 'green' });
            if (n % 2 === 0) D.text(`corollary: ω${SUB(n)}${SUP(n / 2)} = e^(iπ) = −1 (half a turn)`, 0.5, 0.12, { align: 'center', size: 11, color: 'muted' });
            const a = root(N, d * k), b = root(n, k); info = { l, txt: `$\\omega_{${N}}^{${d * k}} = ${cfx(a[0], a[1], 5)}$ and $\\omega_{${n}}^{${k}} = ${cfx(b[0], b[1], 5)}$ ${Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-12 ? '✓ equal' : '✗'}` };
          } else if (l === 'halve') {
            const t = tS.value, even = n % 2 === 0, h = even ? n / 2 : n;
            C.setTitle(`squaring the ${n}-th roots: $z \\mapsto z^{1+t}$ along the circle`); D.setTitle(even ? `$k \\mapsto k \\bmod ${n / 2}$: two roots per square` : `$k \\mapsto 2k \\bmod ${n}$: a permutation`);
            if (even) for (let j = 0; j < h; j++) { const [x, y] = root(h, j), [x2, y2] = root(h, j + 1); C.line(x, y, x2, y2, { color: 'faint', width: 1, dash: [3, 3] }); }
            for (let j = 0; j < n; j++) {
              const th = TAU * j / n, col = PAIRC[(even ? j % h : j) % PAIRC.length];
              C.dot(Math.cos(th), Math.sin(th), { r: 4, color: col, hollow: true, width: 1.5, alpha: 0.6 });
              C.curve((u) => [Math.cos(u), Math.sin(u)], th, th * (1 + t), { color: col, width: 1.4, alpha: 0.3 });
              C.dot(Math.cos(th * (1 + t)), Math.sin(th * (1 + t)), { r: 6.5 - (j >= h && even ? 2.2 : 0), color: col });
            }
            if (t > 0.999 && even) for (let j = 0; j < h; j++) { const [x, y] = root(h, j); C.text('×2', 1.17 * x, 1.17 * y, { align: 'center', size: 11, weight: 700, color: PAIRC[j % PAIRC.length] }); }
            // mapping diagram
            D.setView([0, 1], [-0.5, n - 0.5]);
            for (let k = 0; k < n; k++) {
              const tgt = even ? k % h : (2 * k) % n, col = PAIRC[(even ? k % h : k) % PAIRC.length], yl = n - 1 - k, yr = even ? (n - 1) - (tgt * (n - 1)) / Math.max(1, h - 1) * (h > 1 ? 1 : 0) : n - 1 - tgt;
              D.line(0.28, yl, 0.72, yr, { color: col, width: 2, alpha: 0.8 });
              D.text(`ω${SUB(n)}${SUP(k)}`, 0.24, yl, { align: 'right', size: 11, color: col });
              if (!even || k < h) D.text(even ? `ω${SUB(h)}${SUP(tgt)}` : `ω${SUB(n)}${SUP(tgt)}`, 0.76, yr, { size: 11, color: even ? PAIRC[tgt % PAIRC.length] : PAIRC[k % PAIRC.length] });
            }
            const sq = new Set(); for (let k = 0; k < n; k++) { const [x, y] = root(n, 2 * k); sq.add(`${Math.round(x * 1e6) + 0}:${Math.round(y * 1e6) + 0}`); }
            info = { l, txt: even ? `squares of the ${n} roots: **${sq.size}** distinct values $= n/2$ ✓, each hit twice; they are the ${h}-th roots of unity, so an FFT of size $n$ needs its halves evaluated at only $n/2$ points` : `$n = ${n}$ is odd: the ${n} squares are **${sq.size}** distinct values, all ${n} roots again — no halving, which is why the radix-2 FFT wants $n$ a power of 2` };
          } else {
            const j = jS.value, g = v.M.gcd(j, n) || n, om = root(n, j);
            C.setTitle(`the powers $(\\omega_{${n}}^{${j}})^k$, $k = 0, \\dots, ${n - 1}$`); D.setTitle('head to tail: $\\sum_k (\\omega_n^{j})^k$');
            const hits = new Array(n).fill(0); for (let k = 0; k < n; k++) hits[(j * k) % n]++;
            for (let q = 0; q < n; q++) { const [x, y] = root(n, q); C.dot(x, y, hits[q] ? { r: 5 + Math.min(4, hits[q]), color: 'accent' } : { r: 4, color: 'muted', hollow: true, width: 1.5 }); if (hits[q] > 1) C.text(`×${hits[q]}`, 1.2 * x, 1.2 * y, { align: 'center', size: 10.5, color: 'accent', weight: 700 }); }
            C.arrow(0, 0, om[0], om[1], { color: 'gold', width: 2 }); C.tex(`\\omega_{${n}}^{${j}}`, om[0] * 0.6, om[1] * 0.6, { size: 13, color: 'gold', dx: 12, dy: -10 });
            const ch = [[0, 0]]; let p = [0, 0]; for (let k = 0; k < n; k++) { p = cadd(p, root(n, j * k)); ch.push(p.slice()); }
            const xs = ch.map((q) => q[0]), ys = ch.map((q) => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = Math.max(x1 - x0, y1 - y0, 1.4) * 0.6;
            D.setView([(x0 + x1) / 2 - w * 1.05, (x0 + x1) / 2 + w * 1.05], [(y0 + y1) / 2 - w, (y0 + y1) / 2 + w]);
            for (let k = 0; k < n; k++) D.arrow(ch[k][0], ch[k][1], ch[k + 1][0], ch[k + 1][1], { color: k === 0 ? 'ink' : 'gold', width: 2, head: 7 });
            const closes = cabs(p) < 1e-9; D.dot(0, 0, { r: 4.5, color: 'ink' }); D.dot(p[0], p[1], { r: 6, color: closes ? 'green' : 'red' });
            D.corner(closes ? `closes up: sum 0 (n ∤ j)` : `straight line: sum n = ${n} (n | j)`, 'tl', { color: closes ? 'green' : 'red', weight: 700 });
            info = { l, txt: `$\\sum_{k=0}^{${n - 1}} \\omega_{${n}}^{${j}k} = ${cfx(p[0], p[1], 6)}$ ${closes ? `$= 0$ ✓ since $${n} \\nmid ${j}$` : `$= ${n}$ ✓ since $${n} \\mid ${j}$`} · the powers visit ${n / g} distinct roots, each ${g} time${g > 1 ? 's' : ''} ($\\gcd(${j}, ${n}) = ${g}$)` };
          }
        });
        v.readout(() => info.txt || '');
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Definition',
      name: 'Discrete Fourier transform',
      statement: String.raw`The **discrete Fourier transform** of $a=(a_0,\dots,a_{n-1})\in\C^n$ is the vector $y=\mathrm{DFT}_n(a)$ with
$$y_k=\sum_{j=0}^{n-1}a_j\,\omega_n^{kj}=A(\omega_n^k),\qquad k=0,\dots,n-1,$$
where $\omega_n=e^{2\pi i/n}$ and $A(x)=\sum_j a_jx^j$. In words, the DFT evaluates the polynomial with coefficient vector $a$ at the $n$ complex $n$-th roots of unity: it is the passage from coefficient form to point-value form (4.5) at those special points, $y=V_na$ with the Vandermonde matrix $(V_n)_{kj}=\omega_n^{kj}$. Signal processing usually writes $e^{-2\pi i kj/n}$; that only conjugates the roots, and for real $a$ it replaces $y_k$ by $\overline{y_k}=y_{n-k}$. Computed from the definition it costs $\Theta(n^2)$ operations.`,
      idea: String.raw`Two readings of one formula. As algebra, $y_k$ is the value of $A$ at the point $\omega_n^k$ of the unit circle, so the DFT samples the closed curve $\theta\mapsto A(e^{i\theta})$ at $n$ equally spaced angles. As analysis, $a_j=\frac1n\sum_k y_k\omega_n^{-kj}$ (4.12) writes the signal as a sum of $n$ complex exponentials, and $|y_k|$ measures how much of frequency $k$ the samples contain; for real $a$, frequencies $k$ and $n-k$ pair up into one real cosine. The geometry of the roots (4.8, 4.9) is what makes both readings work.`,
      caption: String.raw`Drag the samples $a_j$ (top left) or pick a signal. Bottom left: the evaluation points $\omega_n^k$ on the unit circle. Bottom right: the curve $A(e^{i\theta})$, the image of the unit circle under $A$, with the DFT values $y_k$ on it; for the chosen $k$ the gold chain adds $a_0+a_1\omega^k+a_2\omega^{2k}+\cdots$ head to tail and ends at $y_k$. Top right: the spectrum $|y_k|$; click a bar to choose $k$, and the gold curve over the samples is the frequency-$k$ component $\tfrac2n\,\mathrm{Re}(y_k\,\omega_n^{-kj})$.`,
      deps: ['algo-4.8', 'algo-4.5'],
      refs: ['CLRS 4e §30.2'],
      tags: ['fft'],
      viz(v) {
        const SIG = {
          cos: (n) => Array.from({ length: n }, (_, j) => +(1.6 * Math.cos(TAU * 2 * j / n + 0.4)).toFixed(2)),
          two: (n) => Array.from({ length: n }, (_, j) => +(1.2 * Math.cos(TAU * j / n) + 0.8 * Math.sin(TAU * 3 * j / n)).toFixed(2)),
          pulse: (n) => Array.from({ length: n }, (_, j) => (j < n / 4 ? 1.5 : 0)),
          rand: (n) => { const r = v.rng(31 + n); return Array.from({ length: n }, () => +r.uniform(-2, 2).toFixed(1)); },
        };
        const nSel = v.select('$n$', ['8', '16'], '8', { onChange: () => { a = SIG[pre.value](+nSel.value); sel = Math.min(sel, +nSel.value - 1); } });
        const pre = v.select('signal', [{ value: 'cos', label: 'cosine, $k=2$' }, { value: 'two', label: 'two tones' }, { value: 'pulse', label: 'pulse' }, { value: 'rand', label: 'random' }], 'two', { onChange: () => { a = SIG[pre.value](+nSel.value); } });
        let a = SIG.two(8), sel = 3, drag = null;
        const Sg = v.stage({ x: [-0.6, 7.6], y: [-2.6, 2.6], axes: 'box', height: 250, weight: 1.15, minWidth: 370, title: 'samples $a_j$ (drag), frequency-$k$ part', xlabel: 'j' });
        const Sp = v.stage({ x: [-0.6, 7.6], y: [0, 10], axes: 'box', height: 250, weight: 1, minWidth: 330, title: 'spectrum $|y_k|$ (click a bar)', xlabel: 'k' });
        const Dm = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 300, weight: 0.75, minWidth: 260, title: 'evaluation points $\\omega_n^k$' });
        const Im = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 300, weight: 1.4, minWidth: 380, title: 'values: $y_k = A(\\omega_n^k)$ on the curve $A(e^{i\\theta})$' });
        Sg.onDrag((x, y, ph) => {
          const n = a.length;
          if (ph === 'start') { const j = Math.round(x); drag = j >= 0 && j < n ? j : null; }
          if ((ph === 'start' || ph === 'move') && drag != null) { const j = Math.round(Math.max(0, Math.min(n - 1, x))); a[j] = Math.round(Math.max(-2.5, Math.min(2.5, y)) * 10) / 10; }
          if (ph === 'end') drag = null;
        });
        Sp.onClick((x) => { const k = Math.round(x); if (k >= 0 && k < a.length) sel = k; });
        Dm.onClick((x, y) => { const n = a.length, k = ((Math.round(Math.atan2(y, x) / TAU * n) % n) + n) % n; sel = k; });
        let st = {};
        v.render(() => {
          const n = a.length, k = sel, Y = dftNaive(a.map((x) => [x, 0])), mags = Y.map(cabs);
          // samples + component
          Sg.setView([-0.6, n - 0.4], [-2.7, 2.7]);
          const comp = (t) => { const kk = k <= n / 2 ? k : n - k, yk = Y[kk], f = kk === 0 || 2 * kk === n ? 1 / n : 2 / n, ang = -TAU * kk * t / n; return f * (yk[0] * Math.cos(ang) - yk[1] * Math.sin(ang)); };
          Sg.hline(0, { color: 'muted', width: 1 });
          Sg.fn(comp, { domain: [-0.3, n - 0.7], color: 'gold', width: 2.2 });
          for (let j = 0; j < n; j++) { Sg.line(j, 0, j, a[j], { color: 'accent', width: 3.5 }); Sg.dot(j, a[j], { r: 5, color: 'accent' }); Sg.dot(j, comp(j), { r: 3, color: 'gold' }); }
          // spectrum
          const mx = Math.max(1, ...mags) * 1.18;
          Sp.setView([-0.6, n - 0.4], [-0.09 * mx, mx]);
          for (let q = 0; q < n; q++) { const col = q === k ? 'gold' : (q === n - k && k !== 0 && 2 * k !== n) ? 'orange' : 'accent'; Sp.rect(q - 0.36, 0, q + 0.36, mags[q], { fill: col, fillAlpha: 0.6, color: col, width: 1.2 }); if ((n <= 8 || q === k) && mags[q] > 0.05) Sp.text(fx(mags[q], 1), q, mags[q], { align: 'center', size: 10.5, dy: -9, color: q === k ? 'gold' : 'muted' }); }
          // domain
          Dm.circle(0, 0, 1, { color: 'muted', width: 1.2 });
          for (let q = 0; q < n; q++) { const [x, y] = root(n, q); Dm.line(0, 0, x, y, { color: q === k ? 'gold' : 'grid', width: q === k ? 2 : 1 }); Dm.dot(x, y, { r: q === k ? 7 : 4.5, color: q === k ? 'gold' : 'accent' }); }
          const [rx, ry] = root(n, k); Dm.tex(`\\omega_{${n}}^{${k}}`, 1.25 * rx, 1.2 * ry, { size: 13, color: 'gold' });
          // image of the circle
          const curve = []; for (let t = 0; t <= 360; t++) { const th = TAU * t / 360; let re = 0, im = 0; for (let j = 0; j < n; j++) { re += a[j] * Math.cos(j * th); im += a[j] * Math.sin(j * th); } curve.push([re, im]); }
          const cxs = curve.map((p) => p[0]).concat(0), cys = curve.map((p) => p[1]).concat(0);
          const bx0 = Math.min(...cxs), bx1 = Math.max(...cxs), by0 = Math.min(...cys), by1 = Math.max(...cys), half = Math.max(1, (by1 - by0) / 2, (bx1 - bx0) / 3.2) * 1.15, mxc = (bx0 + bx1) / 2, myc = (by0 + by1) / 2;
          Im.setView([mxc - 1.6 * half, mxc + 1.6 * half], [myc - half, myc + half]);
          const R = 2 * half;
          Im.line(mxc - 2 * R, 0, mxc + 2 * R, 0, { color: 'grid', width: 1 }); Im.line(0, myc - R, 0, myc + R, { color: 'grid', width: 1 });
          Im.path(curve, { color: 'muted', width: 1.5 });
          let p = [0, 0];
          for (let j = 0; j < n; j++) { const q = cadd(p, cmul([a[j], 0], root(n, j * k))); Im.arrow(p[0], p[1], q[0], q[1], { color: 'gold', width: 1.8, head: 7, alpha: 0.9 }); p = q; }
          const groups = new Map();
          Y.forEach((yq, q) => { Im.dot(yq[0], yq[1], { r: q === k ? 7 : 4, color: q === k ? 'gold' : 'accent' }); const key = `${Math.round(yq[0] * 1e6)}:${Math.round(yq[1] * 1e6)}`; if (!groups.has(key)) groups.set(key, { p: yq, ks: [] }); groups.get(key).ks.push(q); });
          for (const g of groups.values()) if (n <= 8 || g.ks.includes(k)) Im.text('k = ' + g.ks.join(', '), g.p[0], g.p[1], { size: 10.5, color: g.ks.includes(k) ? 'gold' : 'accent', dx: 8, dy: -8, weight: 600 });
          const [fr, fi] = dftCLRS(v.M, a, null), err = Math.max(...Y.map((yq, q) => Math.hypot(yq[0] - fr[q], yq[1] - fi[q])));
          st = { n, k, y: Y[k], m: mags[k], err };
        });
        v.legend([['accent', 'samples / values', { dot: true }], ['gold', 'chosen frequency $k$', { dot: true }], ['orange', 'its partner $n-k$', { area: true }]]);
        v.readout(() => {
          const { n, k, y, m, err } = st;
          return `$y_{${k}} = A(\\omega_{${n}}^{${k}}) = \\sum_j a_j\\,\\omega_{${n}}^{${k}j} = ${cfx(y[0], y[1])}$, $|y_{${k}}| = ${fx(m, 3)}$ · all $n$ values from the definition: $n^2 = ${n * n}$ multiplications · agrees with the library FFT to $${v.sci(err || 1e-17, 1)}$ ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Algorithm',
      name: 'Fast Fourier transform (Cooley–Tukey)',
      statement: String.raw`For $n$ a power of 2, the **fast Fourier transform** computes $y=\mathrm{DFT}_n(a)$ recursively. Split $A(x)=A^{[0]}(x^2)+x\,A^{[1]}(x^2)$, where $A^{[0]}$ has the even-indexed and $A^{[1]}$ the odd-indexed coefficients; compute $y^{[0]}=\mathrm{DFT}_{n/2}(a_0,a_2,\dots)$ and $y^{[1]}=\mathrm{DFT}_{n/2}(a_1,a_3,\dots)$ recursively, and combine with $n/2$ **butterflies**
$$y_k=y^{[0]}_k+\omega_n^k\,y^{[1]}_k,\qquad y_{k+n/2}=y^{[0]}_k-\omega_n^k\,y^{[1]}_k,\qquad 0\le k<n/2 .$$
It uses $\tfrac n2\lg n$ complex multiplications and $n\lg n$ complex additions, so $T(n)=2T(n/2)+\Theta(n)=\Theta(n\log n)$ instead of $\Theta(n^2)$.`,
      idea: String.raw`Evaluating $A$ at the $n$-th roots of unity means evaluating $A^{[0]}$ and $A^{[1]}$ at their squares, and by the halving lemma (4.9) those squares are just the $n/2$ roots of order $n/2$: two problems of half the size, which is exactly the recursion. The pair $\omega_n^k$ and $\omega_n^{k+n/2}=-\omega_n^k$ (cancellation lemma) share the same square, so one product $t=\omega_n^ky^{[1]}_k$ serves both outputs, $y^{[0]}_k\pm t$: geometrically, the two diagonals of the parallelogram spanned by $y^{[0]}_k$ and $t$. The master theorem (2.7, case 2) gives $\Theta(n\log n)$.`,
      caption: String.raw`Step through the recursion (the tree shows which coefficients each call receives; gold = running, orange = on the call stack, green = returned). At each butterfly the plane shows $y^{[0]}_k$ (blue), the twisted odd value $t=\omega_n^k y^{[1]}_k$ (purple) added and subtracted at its tip, and the two outputs $y_k$ (green) and $y_{k+n/2}$ (teal); earlier butterflies of the same call stay faint. Right: complex multiplications, the FFT's $\tfrac n2\lg n$ against the $n^2$ of the definition.`,
      deps: ['algo-4.10', 'algo-4.9', 'algo-2.7'],
      refs: ['CLRS 4e §30.2', 'KT §5.6'],
      see: ['sig-8.8'],
      credit: 'Cooley & Tukey, 1965 (anticipated by Gauss, c. 1805)',
      tags: ['fft', 'divide and conquer'],
      viz(v) {
        const rng = v.rng(411);
        const nSel = v.select('$n$', ['4', '8', '16'], '8', { onChange: () => { newA(); } });
        let a = [2, 1, -1, 3, 0, -2, 1, 1], run = fftRecRun(a);
        function newA() { const n = +nSel.value; a = Array.from({ length: n }, () => rng.int(-3, 3)); S.reset({ at: 'end' }); }
        const frames0 = run.frames, still = frames0.findIndex((f) => f.bf && f.node.n === 8 && f.last.k === 1);
        const S = v.steps({ frames: () => (run = fftRecRun(a)).frames, code: ['FFT(a):   ▷ n = |a| a power of 2', '  if n = 1: return a', '  $y^{[0]} \\leftarrow$ FFT($a_0, a_2, \\dots, a_{n-2}$)', '  $y^{[1]} \\leftarrow$ FFT($a_1, a_3, \\dots, a_{n-1}$)', '  for k ← 0 to n/2 − 1:', '    $t \\leftarrow \\omega_n^k\\, y^{[1]}_k$', '    $y_k \\leftarrow y^{[0]}_k + t$;  $y_{k+n/2} \\leftarrow y^{[0]}_k - t$', '  return y'], codeTitle: 'recursive FFT', speed: 2, codePos: 'below', start: still, still });
        v.button('New coefficients', () => newA());
        const T = v.stage({ x: [0, 1], y: [-3.5, 0.5], axes: false, height: 240, full: true });
        const B = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 300, weight: 1.1, title: 'the butterfly $y^{[0]}_k \\pm t$' });
        const P = v.stage({ x: [2, 65536], y: [1, 1e10], xlog: true, ylog: true, axes: 'box', height: 300, weight: 1, xlabel: 'n', title: 'complex multiplications' });
        v.render(() => {
          const f = S.frame, i = S.i, n = a.length, D = Math.round(LG(n));
          // tree
          T.setView([0, 1], [-(D + 0.5), 0.5]);
          const stack = new Set(); for (let q = f.node && f.node.parent; q; q = q.parent) stack.add(q);
          const pos = (nd) => [(nd.slot + 0.5) / 2 ** nd.depth, -nd.depth], bh = 0.3;
          for (const nd of run.nodes) if (nd.parent) { const [x, y] = pos(nd), [px, py] = pos(nd.parent); T.line(px, py - bh, x, y + bh, { color: nd.slot % 2 ? 'purple' : 'blue', width: nd.t0 <= i ? 2 : 1, alpha: nd.t0 <= i ? 0.85 : 0.3 }); }
          for (const nd of run.nodes) {
            const [x, y] = pos(nd), w = 0.46 / 2 ** nd.depth, called = nd.t0 <= i, done = nd.t1 <= i, cur = f.node === nd, onS = stack.has(nd);
            const col = cur ? 'gold' : onS ? 'orange' : done ? 'green' : 'faint';
            T.rect(x - w, y - bh, x + w, y + bh, { fill: called ? col : null, fillAlpha: cur ? 0.26 : 0.1, color: col, width: cur || onS ? 2.4 : 1.2, dash: called ? null : [3, 3] });
            const lab = nd.idx.map((q) => `a${SUB(q)}`).join(' '), Wpx = Math.abs(T.X(x + w) - T.X(x - w)), sz = Math.min(12.5, (Wpx - 4) / (lab.length * 0.6));
            if (sz >= 6.5) T.text(lab, x, y, { align: 'center', size: sz, weight: 600, color: called ? 'ink' : 'faint', halo: false });
          }
          T.text('even', 0.25, -0.5, { size: 10.5, color: 'blue', align: 'right', dx: -6 }); T.text('odd', 0.75, -0.5, { size: 10.5, color: 'purple', dx: 6 });
          // butterfly plane
          const L = f.last;
          if (L) {
            const nd = L.node, m = nd.n, pts = [];
            for (let k = 0; k <= L.k; k++) { const t = cmul(root(m, k), nd.O[k]); pts.push(nd.E[k], cadd(nd.E[k], t), csub(nd.E[k], t)); }
            const R = Math.max(1, ...pts.map(cabs)) * 1.15;
            B.setView([-R * 1.1, R * 1.1], [-R, R]);
            B.line(-R * 1.2, 0, R * 1.2, 0, { color: 'grid', width: 1 }); B.line(0, -R, 0, R, { color: 'grid', width: 1 });
            for (let k = 0; k <= L.k; k++) {
              const cur = k === L.k, al = cur ? 1 : 0.28, E = nd.E[k], t = cmul(root(m, k), nd.O[k]), yp = cadd(E, t), ym = csub(E, t);
              B.arrow(0, 0, E[0], E[1], { color: 'blue', width: cur ? 2.6 : 1.4, alpha: al });
              B.arrow(E[0], E[1], yp[0], yp[1], { color: 'purple', width: cur ? 2.4 : 1.2, alpha: al });
              B.arrow(E[0], E[1], ym[0], ym[1], { color: 'purple', width: cur ? 2.4 : 1.2, alpha: al, dash: [4, 3] });
              B.dot(yp[0], yp[1], { r: cur ? 6.5 : 4, color: 'green', alpha: cur ? 1 : 0.5 }); B.dot(ym[0], ym[1], { r: cur ? 6.5 : 4, color: 'teal', alpha: cur ? 1 : 0.5 });
              if (cur) {
                B.tex(`y_{${k}}`, yp[0], yp[1], { size: 13, color: 'green', dx: 14, dy: -12 }); B.tex(`y_{${k + m / 2}}`, ym[0], ym[1], { size: 13, color: 'teal', dx: 14, dy: 12 });
                B.tex(`y^{[0]}_{${k}}`, E[0] / 2, E[1] / 2, { size: 12, color: 'blue', dx: -14, dy: -10 });
              }
            }
            B.corner(`call of size ${m}, twiddle ω${SUB(m)}${SUP(L.k)}`, 'tl', { color: 'muted' });
          } else {
            B.setView([-3.3, 3.3], [-3, 3]);
            B.line(-3.5, 0, 3.5, 0, { color: 'grid', width: 1 });
            a.forEach((x, j) => B.dot(x, 0, { r: 5, color: 'accent' }));
            B.corner('inputs are real: they sit on the real axis', 'tl', { color: 'muted' });
          }
          // costs
          P.fn((x) => x * x, { color: 'red', width: 2 });
          P.fn((x) => (x / 2) * LG(x), { color: 'blue', width: 2 });
          const ks = []; for (let q = 1; q <= 16; q++) ks.push([2 ** q, 2 ** (q - 1) * q]); P.dots(ks, { r: 2.6, color: 'blue' });
          P.dot(n, f.mul, { r: 6, color: 'gold' });
          P.text('definition n²', 60, 3600, { color: 'red', size: 11, align: 'right', dx: -6, dy: -8 });
          P.text('FFT (n/2) lg n', 2000, 1000 * 11, { color: 'blue', size: 11, dy: 14 });
          P.text(`n = 65536: ${tnum(65536 ** 2 / (32768 * 16)).replace(/\{,\}/g, ',')}× fewer`, 65536, 30, { color: 'muted', size: 11, align: 'right', dx: -8 });
        });
        v.legend([['blue', '$y^{[0]}_k$ (even half)'], ['purple', '$\\pm t = \\pm\\omega_n^k y^{[1]}_k$'], ['green', '$y_k$', { dot: true }], ['teal', '$y_{k+n/2}$', { dot: true }]]);
        v.readout(() => {
          const n = a.length, f = S.frame, L = Math.round(LG(n));
          let s = `complex multiplications so far **${f.mul}** of $\\tfrac n2\\lg n = ${(n / 2) * L}$ (additions ${f.add} of $n\\lg n = ${n * L}$) against $n^2 = ${n * n}$ for the definition`;
          if (S.atEnd) { const Y = dftNaive(a.map((x) => [x, 0])), err = Math.max(...Y.map((y, k) => Math.hypot(y[0] - run.root.y[k][0], y[1] - run.root.y[k][1]))); s += ` · output equals $A(\\omega_n^k)$ evaluated directly, error $${v.sci(err || 1e-17, 1)}$ ✓`; }
          return s + ' · in operation count the FFT is ahead at every $n \\ge 2$: there is no crossover';
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Inverting the DFT',
      statement: String.raw`The DFT is invertible: if $y=\mathrm{DFT}_n(a)$, then
$$a_j=\frac1n\sum_{k=0}^{n-1}y_k\,\omega_n^{-kj},\qquad j=0,\dots,n-1,$$
that is, $V_n^{-1}=\frac1n\overline{V_n}$: interpolation at the roots of unity is the same computation as evaluation, with $\omega_n$ replaced by $\omega_n^{-1}=\overline{\omega_n}$ and a final division by $n$. In particular the inverse DFT also takes $\Theta(n\log n)$ time with the FFT (4.11).`,
      idea: String.raw`Multiply the claimed inverse by $V_n$: the $(j,j')$ entry is $\frac1n\sum_k\omega_n^{-kj}\omega_n^{kj'}=\frac1n\sum_k(\omega_n^{j'-j})^k$, which is $1$ if $j=j'$ and $0$ otherwise by the summation lemma (4.9), since $|j'-j|<n$. So $\frac1n\overline{V_n}V_n=I$: the columns of $V_n/\sqrt n$ are orthonormal, the finite counterpart of an orthonormal Fourier system (pma 8.10). Using $\omega_n$ instead of its conjugate gives $\frac1n V_nV_n$, which sends $a_j$ to $a_{-j}$ and reverses the signal; forgetting the $1/n$ scales it by $n$.`,
      caption: String.raw`Draw a signal with the mouse. Its spectrum (middle) can be edited: click a bar to remove that frequency, or narrow the band with the slider; the inverse transform (green) then rebuilds a smoothed signal, and with nothing removed it lands exactly on the samples. Switch the inverse to **same roots** or **no ÷ n** to break the theorem: the reconstruction comes out reversed or $n$ times too tall. Right: the matrix (inverse)·$V_n$ as a heat map, the identity only for the correct inverse.`,
      deps: ['algo-4.10', 'algo-4.9', 'pma-8.10'],
      refs: ['CLRS 4e §30.2'],
      see: ['sig-8.15'],
      tags: ['fft'],
      viz(v) {
        const mk = (n) => Array.from({ length: n }, (_, j) => { const t = j / n; return +(1.1 * Math.sin(TAU * t) + 0.5 * Math.sin(TAU * 3 * t + 1) + (t > 0.55 && t < 0.8 ? 0.9 : 0)).toFixed(3); });
        const nSel = v.select('$n$', ['16', '32', '64'], '32', { onChange: () => { a = mk(+nSel.value); off.clear(); band.set(+nSel.value / 2); } });
        const meth = v.select('inverse', [{ value: 'ok', label: 'conjugate roots, ÷ n' }, { value: 'same', label: 'same roots, ÷ n' }, { value: 'noscale', label: 'conjugate roots, no ÷ n' }], 'ok');
        const band = v.slider('keep frequencies $\\min(k, n-k) \\le$', 0, 32, 32, { int: true });
        v.button('Restore all', () => { off.clear(); band.set(a.length / 2); });
        let a = mk(32), drag = null; const off = new Set();
        const Sg = v.stage({ x: [-0.5, 31.5], y: [-3, 3], axes: 'box', height: 260, full: true, title: 'signal $a_j$ (draw on it) and the reconstruction', xlabel: 'j' });
        const Sp = v.stage({ x: [-0.6, 31.6], y: [0, 10], axes: 'box', height: 240, weight: 1.35, title: 'spectrum $|y_k|$: click to remove a frequency', xlabel: 'k' });
        const Mx = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 240, weight: 0.8, minWidth: 220 });
        Sg.onDrag((x, y, ph) => {
          const n = a.length, j = Math.round(Math.max(0, Math.min(n - 1, x))), yy = Math.max(-2.8, Math.min(2.8, y));
          if (ph === 'start') drag = j;
          if ((ph === 'start' || ph === 'move') && drag != null) { const lo = Math.min(drag, j), hi = Math.max(drag, j); for (let q = lo; q <= hi; q++) a[q] = hi === lo ? yy : a[drag] + (yy - a[drag]) * (q - drag) / (j - drag || 1); a[j] = yy; drag = j; }
          if (ph === 'end') drag = null;
        });
        Sp.onClick((x) => { const k = Math.round(x), n = a.length; if (k < 0 || k >= n) return; const p = (n - k) % n; if (off.has(k)) { off.delete(k); off.delete(p); } else { off.add(k); off.add(p); } });
        const mcache = {};
        const matrix = (n, mth) => {
          const key = n + mth; if (mcache[key]) return mcache[key];
          const sg = mth === 'same' ? 1 : -1, sc = mth === 'noscale' ? 1 : 1 / n, M = [];
          for (let j = 0; j < n; j++) { const row = []; for (let jp = 0; jp < n; jp++) { let re = 0, im = 0; for (let k = 0; k < n; k++) { const th = TAU * (sg * k * j + k * jp) / n; re += Math.cos(th); im += Math.sin(th); } row.push(Math.hypot(re, im) * sc); } M.push(row); }
          return (mcache[key] = M);
        };
        let st = {};
        v.render(() => {
          const n = a.length, mth = meth.value, K = Math.min(band.value, n / 2);
          const [yr, yi] = dftCLRS(v.M, a, null);
          const keep = (k) => !off.has(k) && Math.min(k, n - k) <= K;
          const zr = yr.map((x, k) => (keep(k) ? x : 0)), zi = yi.map((x, k) => (keep(k) ? x : 0));
          let rec;
          if (mth === 'ok') rec = idftCLRS(v.M, zr, zi)[0];
          else if (mth === 'same') rec = dftCLRS(v.M, zr, zi)[0].map((x) => x / n);
          else rec = idftCLRS(v.M, zr, zi)[0].map((x) => x * n);
          const removed = yr.filter((_, k) => !keep(k)).length;
          const err = Math.max(...a.map((x, j) => Math.abs(x - rec[j])));
          const E = (k) => yr[k] ** 2 + yi[k] ** 2, Et = yr.reduce((s, _, k) => s + E(k), 0), Ek = yr.reduce((s, _, k) => s + (keep(k) ? E(k) : 0), 0);
          // signal
          const top = Math.max(3, ...rec.map(Math.abs)) * 1.05;
          Sg.setView([-0.5, n - 0.5], [-Math.min(top, 3 * n), Math.min(top, 3 * n)]);
          Sg.hline(0, { color: 'muted', width: 1 });
          for (let j = 0; j < n; j++) { Sg.line(j, 0, j, a[j], { color: 'accent', width: n > 32 ? 2 : 3, alpha: 0.55 }); Sg.dot(j, a[j], { r: n > 32 ? 2.5 : 3.5, color: 'accent' }); }
          const good = mth === 'ok';
          Sg.path(rec.map((x, j) => [j, x]), { color: good ? 'green' : 'red', width: 2.4 });
          rec.forEach((x, j) => Sg.dot(j, x, { r: 2.4, color: good ? 'green' : 'red' }));
          // spectrum
          const mags = yr.map((x, k) => Math.hypot(x, yi[k])), mx = Math.max(1, ...mags) * 1.15;
          Sp.setView([-0.6, n - 0.4], [-0.09 * mx, mx]);
          for (let k = 0; k < n; k++) { const on = keep(k); Sp.rect(k - 0.36, 0, k + 0.36, mags[k], on ? { fill: 'accent', fillAlpha: 0.6, color: 'accent', width: 1 } : { color: 'red', width: 1.2, dash: [3, 2] }); }
          // matrix
          const M = matrix(n, mth), cell = 0.86 / n, mmax = mth === 'noscale' ? n : 1;
          Mx.setTitle(mth === 'ok' ? '$\\tfrac1n\\overline{V_n}\\,V_n = I$' : mth === 'same' ? '$\\tfrac1n V_nV_n$ = reversal' : '$\\overline{V_n}\\,V_n = n\\,I$');
          for (let j = 0; j < n; j++) for (let jp = 0; jp < n; jp++) { const val = M[j][jp] / mmax; if (val > 1e-6) Mx.rect(0.07 + jp * cell, 0.93 - (j + 1) * cell, 0.07 + (jp + 1) * cell, 0.93 - j * cell, { fill: good ? 'green' : 'red', fillAlpha: 0.15 + 0.8 * val, stroke: false }); }
          Mx.rect(0.07, 0.07, 0.93, 0.93, { color: 'muted', width: 1 });
          Mx.text(mth === 'noscale' ? `entries n = ${n}` : 'entries 0 or 1', 0.5, 0.025, { align: 'center', size: 10.5, color: 'muted' });
          st = { n, removed, err, kept: Ek / Et, mth };
        });
        v.legend([['accent', 'samples $a_j$', { dot: true }], ['green', 'inverse DFT of the kept spectrum'], ['red', 'removed frequency / wrong inverse', { dash: true }]]);
        v.readout(() => {
          const { n, removed, err, kept, mth } = st;
          const head = mth === 'ok' ? '' : mth === 'same' ? '**same roots**: the result is $a_{-j}$, the signal reversed ✗ · ' : '**no ÷ n**: the result is $n\\,a_j$ ✗ · ';
          return head + (removed === 0 ? `nothing removed: $\\max_j |a_j - \\tilde a_j| = ${v.sci(err || 1e-17, 1)}$` + (mth === 'ok' ? ' — exact up to rounding ✓' : '') : `${removed} of ${n} frequencies removed, ${fx(100 * kept, 1)}% of the energy $\\sum|y_k|^2$ kept; largest deviation ${fx(err, 3)}`);
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Convolution theorem: multiplying polynomials in O(n log n)',
      statement: String.raw`Let $a$ and $b$ be coefficient vectors of length $n$, padded with zeros to length $N\ge 2n-1$. Then
$$a*b=\mathrm{DFT}_N^{-1}\bigl(\mathrm{DFT}_N(a)\cdot\mathrm{DFT}_N(b)\bigr),$$
with $\cdot$ the componentwise product. Taking $N$ the least power of 2 with $N\ge2n-1$ and computing the three transforms by the FFT, two polynomials of degree bound $n$ are multiplied in $\Theta(n\log n)$ operations instead of $\Theta(n^2)$. If $N<2n-1$, the same computation returns the **cyclic** convolution, $c_k$ plus $c_{k+N}$: the high coefficients wrap around.`,
      idea: String.raw`Evaluation at a point turns a product of polynomials into a product of numbers: $C(\omega_N^k)=A(\omega_N^k)\,B(\omega_N^k)$. So the DFT of $c$ is the pointwise product of the DFTs, and since $C$ has degree bound $2n-1\le N$, its $N$ values determine it (4.5) and the inverse DFT (4.12) recovers it. With fewer than $2n-1$ points the values only determine $C$ modulo $x^N-1$, which is the wrap-around. Cost: three FFTs of size $N\le4n$ plus $N$ products, $\Theta(n\log n)$ by 4.11; the constants (complex arithmetic, padding to a power of 2) are why schoolbook multiplication still wins for short inputs.`,
      caption: String.raw`Drag the coefficients of $A$ (blue) and $B$ (purple). The middle grid evaluates both at the $N$-th roots of unity: each dial is a complex value (needle = modulus and angle), and the bottom row multiplies the columns one by one. Click a column to read it out. Bottom left: the inverse FFT of the products (bars) against the schoolbook convolution (rings). Switch on **too few points** to take $N<2n-1$ and watch the top coefficients wrap around. Bottom right: real arithmetic operations, FFT route against schoolbook, with the crossover.`,
      deps: ['algo-4.7', 'algo-4.11', 'algo-4.12'],
      refs: ['CLRS 4e §30.2', 'KT §5.6'],
      see: ['sig-8.6'],
      tags: ['fft', 'convolution'],
      viz(v) {
        let A = [2, -1, 3, 1, 0, 0, 0, 0], B = [1, 2, -2, 1, 0, 0, 0, 0], sel = 1, drag = null;
        const nS = v.slider('coefficients per polynomial $n$', 2, 8, 4, { int: true });
        const few = v.toggle('too few points: $N \\ge n$ only', false);
        const Co = v.stage({ x: [-0.6, 7.6], y: [-6.5, 6.5], axes: false, height: 290, weight: 0.8, minWidth: 230, title: 'coefficients of $A$ and $B$ (drag)' });
        const Gs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1.4, title: 'values at the roots: evaluate, then multiply column by column' });
        const Rs = v.stage({ x: [-0.6, 14.6], y: [-20, 20], axes: 'box', height: 250, weight: 1, title: 'inverse FFT of the products vs schoolbook', xlabel: 'k' });
        const Pl = v.stage({ x: [1, 1e5], y: [1, 1e11], xlog: true, ylog: true, axes: 'box', height: 250, weight: 1.2, xlabel: 'n', title: 'real arithmetic operations' });
        const YA = 3.2, YB = -3.2, SC = 0.62;
        Co.onDrag((x, y, ph) => {
          const n = nS.value;
          if (ph === 'start') { const j = Math.round(x); drag = j >= 0 && j < n && Math.abs(x - j) < 0.45 ? { arr: y > 0 ? A : B, j, base: y > 0 ? YA : YB } : null; }
          if ((ph === 'start' || ph === 'move') && drag) drag.arr[drag.j] = Math.max(-4, Math.min(4, Math.round((y - drag.base) / SC)));
          if (ph === 'end') drag = null;
        });
        let geo = null, st = {};
        Gs.onClick((x) => { if (!geo) return; const k = Math.floor((x - geo.x0) / geo.cw); if (k >= 0 && k < geo.N) sel = k; });
        const schoolOps = (n) => n * n + (n - 1) * (n - 1), ALLN = Array.from({ length: 100000 }, (_, i) => i + 1);
        const fftOps = (n) => { const N = nextPow2(2 * n - 1), l = Math.max(1, LG(N)); return 15 * N * l + 8 * N; };
        v.render(() => {
          const n = nS.value, N = few.value ? nextPow2(n) : nextPow2(2 * n - 1);
          if (sel >= N) sel = N - 1;
          const a = A.slice(0, n), b = B.slice(0, n), pa = a.concat(new Array(N - n).fill(0)), pb = b.concat(new Array(N - n).fill(0));
          const [ar, ai] = dftCLRS(v.M, pa, null), [br, bi] = dftCLRS(v.M, pb, null);
          const cr = ar.map((x, k) => x * br[k] - ai[k] * bi[k]), ci = ar.map((x, k) => x * bi[k] + ai[k] * br[k]);
          const [rr, ri] = idftCLRS(v.M, cr, ci);
          const school = new Array(2 * n - 1).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) school[i + j] += a[i] * b[j];
          // coefficients
          Co.setView([-0.8, Math.max(n, 4) - 0.2], [-6.5, 6.5]);
          for (const [arr, Y0, col, nm] of [[a, YA, 'blue', 'A'], [b, YB, 'purple', 'B']]) {
            Co.line(-0.5, Y0, n - 0.5, Y0, { color: 'faint', width: 1 }); Co.text(nm, -0.75, Y0 + 2.4, { size: 15, math: true, color: col, weight: 700 });
            arr.forEach((c, j) => { Co.line(j, Y0, j, Y0 + c * SC, { color: col, width: 3 }); Co.dot(j, Y0 + c * SC, { r: 5.5, color: col }); Co.text(mnus(c), j, Y0 + c * SC, { align: 'center', size: 11, dy: c >= 0 ? -12 : 12 }); });
          }
          // glyph grid
          const lw = 0.16, cw = Math.min(0.105, (0.98 - lw) / N), x0 = lw, rows = [['ωᵏ', null, 'muted'], ['A(ωᵏ)', [ar, ai], 'blue'], ['B(ωᵏ)', [br, bi], 'purple'], ['C = A·B', [cr, ci], 'green']];
          geo = { x0, cw, N };
          const Rpx = Math.max(6, Math.min(16, Math.abs(Gs.X(cw) - Gs.X(0)) * 0.42, Math.abs(Gs.Y(0) - Gs.Y(0.1)) * 0.75));
          Gs.rect(x0 + sel * cw, 0.04, x0 + (sel + 1) * cw, 0.9, { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 1.2 });
          rows.forEach(([lab, z, col], r) => {
            const y = 0.78 - r * 0.2;
            Gs.text(lab, x0 - 0.015, y, { align: 'right', size: 11.5, color: col, weight: 600 });
            const mags = z ? z[0].map((x, k) => Math.hypot(x, z[1][k])) : null, mx = mags ? Math.max(1e-9, ...mags) : 1;
            for (let k = 0; k < N; k++) phasor(v, Gs, x0 + (k + 0.5) * cw, y, z ? [z[0][k], z[1][k]] : root(N, k), 1 / mx, Rpx, col, { ringColor: k === sel ? 'gold' : 'faint' });
            if (r === 2) Gs.line(x0, y - 0.1, x0 + N * cw, y - 0.1, { color: 'muted', width: 1 });
          });
          for (let k = 0; k < N; k++) Gs.text(String(k), x0 + (k + 0.5) * cw, 0.94, { align: 'center', size: 10, color: k === sel ? 'gold' : 'muted' });
          Gs.text(`N = ${N} points`, 0.02, 0.02, { size: 10.5, color: N < 2 * n - 1 ? 'red' : 'muted', weight: 600, baseline: 'bottom' });
          Gs.text('k', x0 - 0.015, 0.94, { align: 'right', size: 10.5, color: 'muted', math: true });
          // result
          const L = Math.max(2 * n - 1, N), top = Math.max(4, ...school.map(Math.abs), ...rr.map(Math.abs)) * 1.25;
          Rs.setView([-0.6, L - 0.4], [-top, top]);
          Rs.hline(0, { color: 'muted', width: 1 });
          let wrong = 0;
          for (let k = 0; k < N; k++) { const ok = Math.abs(rr[k] - (school[k] || 0)) < 1e-6; if (!ok) wrong++; const col = ok ? 'green' : 'red'; Rs.rect(k - 0.32, 0, k + 0.32, rr[k], { fill: col, fillAlpha: 0.55, color: col, width: 1 }); }
          school.forEach((c, k) => Rs.dot(k, c, { r: 4.5, color: 'ink', hollow: true, width: 1.8 }));
          if (N < 2 * n - 1) Rs.vband(N - 0.5, L - 0.4, { color: 'red', alpha: 0.07 });
          // costs
          const cr2 = crossover(fftOps, schoolOps, ALLN);
          if (cr2) { Pl.vband(cr2, 1e5, { color: 'green', alpha: 0.07 }); Pl.vline(cr2, { color: 'green', dash: [5, 4], width: 1.4 }); Pl.text(`FFT wins from n ≈ ${cr2}`, cr2, 3e10, { color: 'green', size: 11, weight: 700, dx: 6 }); }
          Pl.fn(schoolOps, { color: 'red', width: 2 });
          const fp = []; for (let m = 1; m <= 1e5; m = Math.max(m + 1, Math.round(m * 1.05))) fp.push([m, fftOps(m)]);
          Pl.path(fp, { color: 'blue', width: 2 });
          Pl.dot(n, schoolOps(n), { r: 5, color: 'gold' }); Pl.dot(n, fftOps(n), { r: 5, color: 'gold' });
          Pl.text('schoolbook ≈ 2n²', 30, schoolOps(30), { color: 'red', size: 11, dx: 4, dy: 14 });
          Pl.text('3 FFTs + products', 3000, fftOps(3000), { color: 'blue', size: 11, dy: 14 });
          const imax = Math.max(...ri.map(Math.abs));
          st = { n, N, wrong, imax, sel, A: [ar[sel], ai[sel]], B: [br[sel], bi[sel]], C: [cr[sel], ci[sel]], cr: cr2 };
        });
        v.legend([['blue', '$A$', { dot: true }], ['purple', '$B$', { dot: true }], ['green', 'coefficients from the FFT route', { area: true }], ['ink', 'schoolbook $c_k$', { dot: true }], ['red', 'wrapped (wrong) coefficient', { area: true }]]);
        v.readout(() => {
          const { n, N, wrong, imax, sel, A: za, B: zb, C: zc, cr } = st;
          const col = `column $k = ${sel}$: $A = ${cfx(za[0], za[1], 2)}$, $B = ${cfx(zb[0], zb[1], 2)}$, $AB = ${cfx(zc[0], zc[1], 2)}$ (moduli multiply: ${fx(cabs(za), 2)} · ${fx(cabs(zb), 2)} = ${fx(cabs(zc), 2)})`;
          const res = N >= 2 * n - 1 ? `$N = ${N} \\ge 2n-1 = ${2 * n - 1}$: all ${2 * n - 1} coefficients match the schoolbook product ✓ (imaginary parts below $${v.sci(imax || 1e-17, 1)}$)` : `$N = ${N} < 2n-1 = ${2 * n - 1}$: **${wrong}** coefficient${wrong === 1 ? '' : 's'} wrong — the top ones wrapped around ✗`;
          return `${res} · ${col}` + (cr ? ` · operation count: FFT route cheaper from $n \\approx ${cr}$` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Algorithm',
      name: 'Iterative FFT and the bit-reversal permutation',
      statement: String.raw`The recursion of 4.11 can be unrolled into loops that work **in place**. First permute the input so that $a_j$ moves to position $\mathrm{rev}(j)$, the index whose $\lg n$ binary digits are those of $j$ reversed. Then for $s=1,\dots,\lg n$, with $m=2^s$: for each block of $m$ consecutive positions $k,\dots,k+m-1$ and each $0\le j<m/2$, replace the pair $(u,v)=(A[k+j],A[k+j+m/2])$ by $(u+\omega_m^jv,\;u-\omega_m^jv)$. After stage $\lg n$ the array holds $\mathrm{DFT}_n(a)$ in natural order. The work is $\tfrac n2\lg n$ butterflies, with no recursion and no extra arrays.`,
      idea: String.raw`The leaves of the recursion tree of 4.11 hold the coefficients in a scrambled order: at each level a coefficient goes left or right according to one more bit of its index, starting from the least significant one, so reading the leaves left to right lists the indices with their bits reversed. Running the combine steps bottom-up, level by level, then finds the two halves of every subproblem side by side, in adjacent blocks; each butterfly reads two cells and writes back the same two cells. The diagram of these butterflies is the **butterfly network**, also the blueprint of hardware FFT circuits.`,
      caption: String.raw`Step through: the crossing lines on the left are the bit-reversal swaps (binary labels), then each stage combines blocks of size $2, 4, 8, \dots$; the gold butterfly is running, with its twiddle $\omega_m^j$. Each dial is a complex value in the array at that stage (needles scaled per column). Switch on **skip bit reversal** to run the same butterflies on the natural order: the outputs no longer match the DFT. The plot counts butterflies for every size, exactly $\tfrac n2\lg n$.`,
      deps: ['algo-4.11'],
      refs: ['CLRS 4e §30.3', 'Erickson notes: Fast Fourier Transforms'],
      tags: ['fft'],
      viz(v) {
        const rng = v.rng(414);
        const nSel = v.select('$n$', ['8', '16'], '8', { onChange: () => { newA(); } });
        const skip = v.toggle('skip bit reversal', false, { onChange: () => S.reset({ at: 'end' }) });
        let a = [3, 1, -2, 2, 0, -1, 2, 1], run = fftIterRun(a, false);
        function newA() { const n = +nSel.value; a = Array.from({ length: n }, () => rng.int(-3, 3)); S.reset({ at: 'end' }); }
        const still = run.frames.findIndex((f) => f.phase === 'bf' && f.s === 2 && f.j === 1);
        const S = v.steps({ frames: () => (run = fftIterRun(a, skip.value)).frames, code: ['Iterative-FFT(a):', '  copy a into A in bit-reversed order', '  for s ← 1 to lg n:   ▷ m = 2^s', '    for k ← 0 to n − 1 step m:', '      for j ← 0 to m/2 − 1:', '        $t \\leftarrow \\omega_m^j A[k+j+m/2]$;  $u \\leftarrow A[k+j]$', '        $A[k+j] \\leftarrow u + t$;  $A[k+j+m/2] \\leftarrow u - t$'], codeTitle: 'iterative FFT', speed: 3, codePos: 'below', start: still, still });
        v.button('New input', () => newA());
        const N = v.stage({ x: [-1, 6], y: [-8, 1], axes: false, height: 430, full: true });
        const P = v.stage({ x: [2, 4096], y: [1, 2e7], xlog: true, ylog: true, axes: 'box', height: 200, full: true, xlabel: 'n', title: 'butterflies (each one complex multiplication)' });
        const counts = []; for (let q = 1; q <= 12; q++) { const r = fftIterRun(new Array(2 ** q).fill(1), false, false); counts.push([2 ** q, r.bf]); }
        v.render(() => {
          const f = S.frame, n = a.length, L = Math.round(LG(n)), cols = f.cols, XS = (c) => (c === 0 ? 0 : c === 1 ? 1.15 : 1.15 + (c - 1) * 1.05);
          const xEnd = XS(L + 1);
          N.setView([-1.05, xEnd + 0.75], [-(n - 0.4), 1.05]);
          const yr = (i) => -i;
          // column headers
          N.text('input', XS(0), 0.75, { align: 'center', size: 11, color: 'muted', weight: 600 });
          N.text(skip.value ? 'not permuted' : 'bit-reversed', XS(1), 0.75, { align: 'center', size: 11, color: skip.value ? 'red' : 'muted', weight: 600 });
          for (let s = 1; s <= L; s++) N.text(s === L ? `stage ${s}: output` : `stage ${s} (m = ${2 ** s})`, XS(s + 1), 0.75, { align: 'center', size: 11, color: f.s === s ? 'gold' : 'muted', weight: 600 });
          // permutation lines
          for (let i = 0; i < n; i++) { const r = skip.value ? i : bitrev(i, L), sw = f.swap && (f.swap[0] === i || f.swap[1] === i); N.line(XS(0), yr(i), XS(1), yr(r), { color: sw ? 'gold' : i === r ? 'faint' : 'orange', width: sw ? 2.6 : 1.4, alpha: sw || i === r ? 1 : 0.6 }); }
          // butterfly wires
          for (let s = 1; s <= L; s++) {
            const m = 2 ** s;
            for (let k = 0; k < n; k += m) for (let j = 0; j < m / 2; j++) {
              const p = k + j, q = p + m / 2, cur = f.phase === 'bf' && f.s === s && f.k === k && f.j === j, done = cols[s + 1] && cols[s + 1][p];
              const col = cur ? 'gold' : done ? 'accent' : 'faint', w = cur ? 2.6 : 1.2, al = cur ? 1 : done ? 0.55 : 0.5;
              N.line(XS(s), yr(p), XS(s + 1), yr(p), { color: col, width: w, alpha: al }); N.line(XS(s), yr(q), XS(s + 1), yr(q), { color: col, width: w, alpha: al });
              N.line(XS(s), yr(p), XS(s + 1), yr(q), { color: col, width: w, alpha: al }); N.line(XS(s), yr(q), XS(s + 1), yr(p), { color: col, width: w, alpha: al });
              if (cur) N.tex(`\\omega_{${m}}^{${j}}`, XS(s) + 0.25, yr(q), { size: 13, color: 'gold', dy: q === n - 1 ? -13 : 12 });
            }
          }
          // dials
          // needles scaled per column (by the largest value that column will hold)
          const lastCols = S.frames[S.n - 1].cols;
          const colMax = lastCols.map((c) => Math.max(1e-9, ...c.filter(Boolean).map(cabs)));
          const R = Math.max(6, Math.min(12, Math.abs(N.Y(0) - N.Y(1)) * 0.36));
          cols.forEach((c, ci) => { const mx = colMax[ci]; c.forEach((z, i) => { if (!z) return; const hot = f.pos && ci === f.s + 1 && f.pos.includes(i); phasor(v, N, XS(ci), yr(i), z, 1 / mx, R, ci === 0 ? 'accent' : ci === L + 1 ? 'green' : 'teal', { ringColor: hot ? 'gold' : 'faint', ring: hot ? 2.4 : 1.2 }); }); });
          for (let i = 0; i < n; i++) {
            N.text(`${i}  ${i.toString(2).padStart(L, '0')}`, XS(0) - 0.2, yr(i), { align: 'right', size: 10.5, color: 'muted' });
            if (cols[L + 1] && cols[L + 1][i]) N.text(`y${SUB(i)}`, xEnd + 0.22, yr(i), { size: 11, color: 'green', weight: 600 });
          }
          // counts plot
          P.fn((x) => x * x, { color: 'red', width: 2 }); P.fn((x) => (x / 2) * LG(x), { color: 'blue', width: 1.6, dash: [5, 4] });
          P.dots(counts, { r: 3, color: 'blue' }); P.dot(n, f.bf, { r: 6, color: 'gold' });
          P.text('direct DFT n²', 40, 1600, { color: 'red', size: 11, dx: -6, dy: -8, align: 'right' });
          P.text('(n/2) lg n butterflies (dots: counted)', 300, 150 * LG(300), { color: 'blue', size: 11, dy: 14 });
        });
        v.legend([['accent', 'input', { dot: true }], ['teal', 'after a stage', { dot: true }], ['green', 'output', { dot: true }], ['gold', 'current butterfly / swap'], ['orange', 'bit-reversal moves']]);
        v.readout(() => {
          const n = a.length, L = Math.round(LG(n)), f = S.frame;
          let s = `butterflies so far **${f.bf}** of $\\tfrac n2\\lg n = ${(n / 2) * L}$ (direct DFT: $n^2 = ${n * n}$ multiplications)`;
          if (S.atEnd) { const Y = dftNaive(a.map((x) => [x, 0])), bad = Y.filter((y, k) => Math.hypot(y[0] - run.out[k][0], y[1] - run.out[k][1]) > 1e-9).length; s += bad ? ` · **${bad} of ${n} outputs differ** from the DFT ✗ (the butterflies need the bit-reversed order)` : ` · all ${n} outputs equal $A(\\omega_n^k)$ ✓, in natural order`; }
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Algorithm',
      name: 'Integer multiplication via the FFT',
      statement: String.raw`To multiply two $n$-digit integers, cut each into $K=\lceil n/b\rceil$ blocks of $b$ digits, read them as the coefficients of polynomials $X(t),Y(t)$ with $X(10^b)=x$, $Y(10^b)=y$, and compute the convolution $c=$ (blocks of $x$) $*$ (blocks of $y$) by the FFT (4.13). Then $xy=\sum_kc_k10^{bk}$; a final pass propagates carries ($c_k+$carry $=q\cdot10^b+r$: keep $r$, carry $q$) to obtain the decimal digits. With floating-point FFTs this takes $O(n\log n)$ arithmetic operations as long as the $c_k$ (up to $K(10^b-1)^2$) are small enough to be rounded exactly; exact versions use number-theoretic transforms, and Harvey and van der Hoeven (2019) reached $O(n\log n)$ bit operations.`,
      idea: String.raw`An integer written in base $B=10^b$ is a polynomial evaluated at $B$, so multiplying integers is multiplying polynomials (the carries come afterwards, since $c_k$ may exceed $B$). The FFT computes all $c_k$ at once in $O(K\log K)$, and rounding the floating-point results to the nearest integers is exact as long as the rounding error stays below $1/2$; the error grows with the size of the $c_k$, so large blocks or very long numbers break it. Against Karatsuba (4.1) the FFT route has a large constant, which places its crossover at much longer inputs.`,
      caption: String.raw`Choose the length and the block size, then step: the digits are grouped into blocks (alternating colours), the block convolution $c_k$ comes out of the FFT (bars), and the carries ripple from right to left into the product, checked against exact big-integer arithmetic. Top right: the largest rounding error of the floating-point convolution for every block size, on your numbers and on 2000-digit numbers of all 9s; above $1/2$ (red) the rounded result is wrong. Bottom: elementary operations of the three methods (digit operations for schoolbook and Karatsuba, floating-point operations for the FFT route), with both crossovers.`,
      deps: ['algo-4.13', 'algo-4.1'],
      refs: ['CLRS 4e Ch. 30', 'Erickson notes: Fast Fourier Transforms'],
      credit: 'Schönhage & Strassen, 1971; Harvey & van der Hoeven, 2019',
      tags: ['fft', 'arithmetic'],
      viz(v) {
        const rng = v.rng(415);
        const randN = (n) => { let s = String(rng.int(1, 9)); for (let k = 1; k < n; k++) s += rng.int(0, 9); return BigInt(s); };
        let X = 31415926535897932n, Y = 27182818284590452n;
        const nS = v.slider('digits $n$', 4, 24, 17, { int: true, onChange: () => { X = randN(nS.value); Y = randN(nS.value); S.reset({ at: 'end' }); } });
        const bS = v.slider('block size $b$ (digits)', 1, 8, 3, { int: true, onChange: () => S.reset({ at: 'end' }) });
        v.button('New numbers', () => { X = randN(nS.value); Y = randN(nS.value); S.reset({ at: 'end' }); });
        v.button('All 9s', () => { X = Y = 10n ** BigInt(nS.value) - 1n; S.reset({ at: 'end' }); });
        let run = null;
        const frames = () => {
          const b = bS.value, xb = toBlocks(X, b), yb = toBlocks(Y, b), raw = fftConv(v.M, xb, yb), c = raw.map(Math.round), err = Math.max(...raw.map((r, k) => Math.abs(r - c[k])));
          const B = 10n ** BigInt(b), out = [], res = []; let carry = 0n;
          out.push({ step: 'split', line: 1, note: `Cut both numbers into blocks of ${b} digit${b > 1 ? 's' : ''} from the right: base $10^{${b}}$, ${xb.length} and ${yb.length} blocks.` });
          out.push({ step: 'conv', line: [2, 3], note: `FFT convolution of the blocks: ${c.length} coefficients $c_k = \\sum_{i+j=k} x_i y_j$, largest ${Math.max(...c)}; the floating-point results are within $${v.sci(err || 1e-17, 1)}$ of integers and are rounded.` });
          for (let k = 0; k < c.length || carry > 0n; k++) {
            const t = BigInt(c[k] || 0) + carry, r = t % B, q = t / B;
            res.push(r);
            out.push({ step: 'carry', k, res: res.slice(), carry: q, line: 4, note: `Block ${k}: $c_{${k}} + \\text{carry} = ${c[k] || 0} + ${carry} = ${t}$; write ${String(r).padStart(b, '0')}, carry ${q}.` });
            carry = q;
          }
          run = { b, xb, yb, raw, c, err, res };
          out[out.length - 1].note += ' Done.';
          return out;
        };
        const S = v.steps({ frames, code: ['FFT-Multiply(x, y, b):', '  split x, y into base-$10^b$ blocks $x_i$, $y_j$', '  $c \\leftarrow$ inverse-FFT(FFT($x$) · FFT($y$))   ▷ 4.13', '  round every $c_k$ to the nearest integer', '  propagate carries: $c_k$ + carry $= q\\cdot 10^b + r$'], codeTitle: 'integer multiplication by FFT', speed: 2, codePos: 'below', start: 'end', still: 'end' });
        const Sh = v.stage({ x: [-50, 2], y: [-1.6, 7.2], axes: false, height: 330, full: true });
        const Pe = v.stage({ x: [0.5, 8.5], y: [1e-16, 1e4], ylog: true, axes: 'box', height: 250, weight: 0.85, minWidth: 240, title: 'largest rounding error', xlabel: 'block size b', xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const Pc = v.stage({ x: [10, 1e5], y: [10, 1e11], xlog: true, ylog: true, axes: 'box', height: 250, weight: 1.2, xlabel: 'digits n', title: 'elementary operations' });
        // rounding errors on 2000-digit all-9s numbers, for every block size (computed once)
        const big = 10n ** 2000n - 1n, bigErr = [];
        for (let b = 1; b <= 8; b++) {
          const xb = toBlocks(big, b), raw = fftConv(v.M, xb, xb), K = xb.length, exact = new Array(2 * K - 1).fill(0n);
          if (K * (10 ** b - 1) ** 2 < 2 ** 52) { const ex = new Array(2 * K - 1).fill(0); for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) ex[i + j] += xb[i] * xb[j]; bigErr.push(Math.max(...raw.map((r, k) => Math.abs(r - ex[k])))); }
          else { for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) exact[i + j] += BigInt(xb[i]) * BigInt(xb[j]); bigErr.push(Math.max(...raw.map((r, k) => Math.abs(r - Number(exact[k]))))); }
        }
        const KC = karCostsTo(16, 100000);
        v.render(() => {
          const f = S.frame, b = run.b, n = nS.value, xs = String(X), ys = String(Y), prod = X * Y, ps = String(prod), D = 2 * n + 1;
          Sh.setView([-D - 3.2, 1.2], [-1.7, 7.2]);
          const blockCol = (p) => (Math.floor(p / b) % 2 ? 'teal' : 'blue');
          const digits = (str, y, colF, alphaF) => { for (let p = 0; p < str.length; p++) { const ch = str[str.length - 1 - p]; Sh.text(ch, -p, y, { align: 'center', size: 14, weight: 600, color: colF(p), alpha: alphaF ? alphaF(p) : 1, halo: false }); } };
          const blockBands = (len, y) => { for (let k = 0; k * b < len; k++) { const p0 = k * b, p1 = Math.min(len, (k + 1) * b) - 1; Sh.rect(-p1 - 0.45, y - 0.32, -p0 + 0.45, y + 0.32, { fill: blockCol(p0), fillAlpha: f.step === 'split' || f.step === 'conv' ? 0.18 : 0.1, stroke: false }); } };
          Sh.text('x', -D - 2.9, 6.4, { size: 15, math: true, color: 'blue' }); Sh.text('y', -D - 2.9, 5.5, { size: 15, math: true, color: 'blue' });
          blockBands(xs.length, 6.4); blockBands(ys.length, 5.5);
          digits(xs, 6.4, () => 'ink'); digits(ys, 5.5, () => 'ink');
          Sh.line(-D - 0.5, 4.95, 0.6, 4.95, { color: 'muted', width: 1 });
          // convolution bars, one per block
          const c = run.c, cmax = Math.max(1, ...c);
          Sh.text('cₖ', -D - 2.9, 3.3, { size: 15, math: true, color: 'purple' });
          c.forEach((ck, k) => {
            const p0 = k * b, xm = -(p0 + (b - 1) / 2), h = 2.6 * ck / cmax, cur = f.step === 'carry' && f.k === k, used = f.step === 'carry' && f.k > k;
            if (xm < -D - 0.5) return;
            Sh.rect(xm - b * 0.42, 1.9, xm + b * 0.42, 1.9 + h, { fill: cur ? 'gold' : 'purple', fillAlpha: used ? 0.2 : 0.55, color: cur ? 'gold' : 'purple', width: 1 });
            if (b >= 3 || cur || c.length <= 12) Sh.text(String(ck), xm, 1.9 + h, { align: 'center', size: b >= 3 ? 10.5 : 9.5, dy: -8, color: cur ? 'gold' : 'muted', weight: cur ? 700 : 500 });
          });
          Sh.line(-D - 0.5, 1.9, 0.6, 1.9, { color: 'faint', width: 1 });
          // result being formed
          Sh.text('xy', -D - 2.9, 0.9, { size: 15, math: true, color: 'green' });
          if (f.step === 'carry') {
            let rstr = f.res.map((r) => String(r).padStart(b, '0')).reverse().join('');
            if (S.atEnd) rstr = rstr.replace(/^0+(?=\d)/, '');
            digits(rstr, 0.9, (p) => (Math.floor(p / b) === f.k ? 'gold' : 'green'));
            if (f.carry > 0n) { const xp = -(f.k + 1) * b; Sh.text(`carry ${f.carry}`, xp - (b - 1) / 2, 1.55, { align: 'center', size: 10.5, color: 'gold', weight: 700 }); }
          }
          if (S.atEnd) { Sh.text('exact', -D - 2.9, -0.6, { size: 11, color: 'muted' }); digits(ps, -0.6, () => 'muted'); }
          // rounding errors
          const myErr = []; for (let bb = 1; bb <= 8; bb++) { const xb = toBlocks(X, bb), yb = toBlocks(Y, bb), raw = fftConv(v.M, xb, yb); let exact = new Array(xb.length + yb.length - 1).fill(0n); for (let i = 0; i < xb.length; i++) for (let j = 0; j < yb.length; j++) exact[i + j] += BigInt(xb[i]) * BigInt(yb[j]); myErr.push(Math.max(1e-17, ...raw.map((r, k) => Math.abs(r - Number(exact[k]))))); }
          Pe.hband(0.5, 1e4, { color: 'red', alpha: 0.08 }); Pe.hline(0.5, { color: 'red', dash: [5, 4], width: 1.4 }); Pe.text('½: rounding fails above', 0.6, 0.5, { size: 10.5, color: 'red', dy: -9, weight: 600 });
          Pe.vband(b - 0.45, b + 0.45, { color: 'gold', alpha: 0.12 });
          Pe.path(myErr.map((e, q) => [q + 1, Math.max(e, 1e-16)]), { color: 'blue', width: 1.8 }); myErr.forEach((e, q) => Pe.dot(q + 1, Math.max(e, 1e-16), { r: 4, color: e > 0.5 ? 'red' : 'blue' }));
          Pe.path(bigErr.map((e, q) => [q + 1, Math.max(e, 1e-16)]), { color: 'orange', width: 1.8 }); bigErr.forEach((e, q) => Pe.dot(q + 1, Math.max(e, 1e-16), { r: 4, color: e > 0.5 ? 'red' : 'orange' }));
          // costs
          const sb = (m) => 2 * m * m + m, ka = (m) => KC[Math.min(100000, Math.round(m))], ff = (m) => fftMulCost(Math.round(m), b);
          const ns = Array.from({ length: 99991 }, (_, i) => i + 10);
          const cK = crossover(ka, sb, ns), cF = crossover(ff, ka, ns);
          Pc.fn(sb, { color: 'red', width: 2 }); Pc.fn(ka, { color: 'purple', width: 2 }); Pc.fn(ff, { color: 'blue', width: 2 });
          if (cK) { Pc.vline(cK, { color: 'purple', dash: [4, 4], width: 1.2 }); Pc.text(`Karatsuba < schoolbook from ${cK}`, cK, 4e10, { size: 10.5, color: 'purple', dx: 5, weight: 600 }); }
          if (cF) { Pc.vline(cF, { color: 'blue', dash: [4, 4], width: 1.2 }); Pc.text(`FFT < Karatsuba from ${cF}`, cF, 4e9, { size: 10.5, color: 'blue', dx: 5, weight: 600 }); }
          Pc.dot(n, ff(n), { r: 5, color: 'gold' });
          Pc.text('schoolbook', 3e4, sb(3e4), { color: 'red', size: 11, dx: -8, dy: -4, align: 'right' });
          Pc.text(`FFT, b = ${b}`, 2e4, ff(2e4), { color: 'blue', size: 11, dy: 14, align: 'right' });
          Pc.text('Karatsuba (n₀ = 16)', 2e4, ka(2e4), { color: 'purple', size: 11, dy: -12, align: 'right' });
          run.cK = cK; run.cF = cF; run.myErr = myErr;
        });
        v.legend([['blue', 'your numbers / blocks / FFT route'], ['orange', '2000 digits of 9s'], ['purple', 'block convolution $c_k$ / Karatsuba', { area: true }], ['gold', 'current block and carry'], ['red', 'schoolbook / rounding fails']]);
        v.readout(() => {
          const prod = X * Y, b = run.b, got = run.res.reduceRight((s, r) => s * 10n ** BigInt(b) + r, 0n), ok = got === prod, e = run.err, f = S.frame;
          let s = `$x\\cdot y$ ${S.atEnd ? (ok ? `$= ${prod}$ ✓ equal to the exact product` : '✗ differs from the exact product') : `(carry step ${f.step === 'carry' ? f.k : '—'})`} · rounding error $${v.sci(e || 1e-17, 1)}$ ${e < 0.5 ? '< ½ ✓' : '≥ ½ ✗'}`;
          s += ` · on 2000-digit numbers block size ${b} gives error $${v.sci(Math.max(bigErr[b - 1], 1e-17), 1)}$${bigErr[b - 1] < 0.5 ? '' : ' — **too large: wrong digits**'}`;
          if (run.cK && run.cF) s += ` · in this cost model Karatsuba beats schoolbook from ${run.cK} digits and the FFT route beats Karatsuba from ${run.cF} digits`;
          return s;
        });
      },
    },
  ],
};
