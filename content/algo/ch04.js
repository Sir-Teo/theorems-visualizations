// Algorithms — Chapter 4: Fast multiplication, geometry and the FFT (items 4.1–4.8; 4.9–4.15 in ch04-b.js)

const LG = Math.log2;
const TAU = 2 * Math.PI;
// TeX for a (possibly huge) number
function tnum(x, sig = 3) {
  if (!isFinite(x)) return '\\infty';
  const a = Math.abs(x);
  if (a >= 1e6) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${m.toFixed(sig - 1)}\\times10^{${e}}`; }
  if (Number.isInteger(x) || a >= 100) return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  return String(+x.toPrecision(sig));
}
// plain-text number with thin grouping
const grp = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pad = (x, n) => String(x).padStart(n, '0');
const mnus = (s) => String(s).replace(/-/g, '−');
const fx = (x, d = 2) => mnus((Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d));

// smallest n in [lo, N] from which f(n) < g(n) holds all the way to N (null if it fails at N)
function crossover(f, g, lo, N) {
  if (!(f(N) < g(N))) return null;
  let n = N; while (n - 1 >= lo && f(n - 1) < g(n - 1)) n--;
  return n;
}

// ---------------------------------------------------------------- 4.1 Karatsuba
const KA_CODE = [
  'Karatsuba(x, y, n):   ▷ x, y have n digits',
  '  if n = 1: return x · y        ▷ one digit multiplication',
  '  $m \\leftarrow \\lceil n/2\\rceil$;  split $x = a\\cdot 10^m + b$,  $y = c\\cdot 10^m + d$',
  '  $P_1 \\leftarrow$ Karatsuba(a, c, n − m)        ▷ ac',
  '  $P_2 \\leftarrow$ Karatsuba(b, d, m)            ▷ bd',
  '  $P_3 \\leftarrow$ Karatsuba(a + b, c + d, m)    ▷ a carry digit costs only additions',
  '  return $P_1\\cdot 10^{2m} + (P_3 - P_1 - P_2)\\cdot 10^m + P_2$',
];
function karaRun(X, Y, n) {
  const nodes = [], frames = []; let mults = 0;
  const snap = (o) => { frames.push({ mults, ...o }); return frames.length - 1; };
  (function rec(x, y, n, depth, role, parent, slot) {
    const nd = { id: nodes.length, x, y, n, depth, role, parent, slot, kids: [] };
    nodes.push(nd); if (parent) parent.kids.push(nd);
    if (n === 1) {
      mults++; nd.res = x * y;
      nd.t0 = nd.t1 = snap({ node: nd, line: 2, note: `$${x}\\times ${y} = ${nd.res}$: one-digit multiplication no. ${mults}.` });
      return nd.res;
    }
    const m = Math.ceil(n / 2), P = 10n ** BigInt(m), a = x / P, b = x % P, c = y / P, d = y % P;
    Object.assign(nd, { m, a, b, c, d });
    nd.t0 = snap({ node: nd, line: 3, note: `Split $x = ${pad(x, n)} = ${a}\\cdot 10^{${m}} + ${b}$ and $y = ${pad(y, n)} = ${c}\\cdot 10^{${m}} + ${d}$. Three recursive products, $ac$, $bd$ and $(a+b)(c+d)$, will replace the four products $ac, ad, bc, bd$.` });
    const p1 = rec(a, c, n - m, depth + 1, 'ac', nd, slot * 3);
    const p2 = rec(b, d, m, depth + 1, 'bd', nd, slot * 3 + 1);
    const s = a + b, t = c + d, al = s / P, ga = t / P, s0 = s % P, t0 = t % P;
    const q = rec(s0, t0, m, depth + 1, 'mid', nd, slot * 3 + 2);
    const p3 = q + (al * t0 + ga * s0) * P + al * ga * P * P, mid = p3 - p1 - p2;
    nd.res = p1 * P * P + mid * P + p2;
    Object.assign(nd, { p1, p2, p3, q, s, t, s0, t0, al, ga, mid });
    const carry = al || ga ? ` (${al && ga ? '$a+b$ and $c+d$ carry' : al ? '$a+b$ carries' : '$c+d$ carries'} into a digit 1, which only adds shifted copies to $${s0}\\times${t0}$)` : '';
    nd.t1 = snap({ node: nd, line: 7, hold: 1.4, note: `$P_1 = ${p1}$, $P_2 = ${p2}$, $P_3 = ${s}\\cdot${t} = ${p3}$${carry}. So $ad+bc = P_3-P_1-P_2 = ${mid}$ and $xy = ${p1}\\cdot10^{${2 * m}} + ${mid}\\cdot10^{${m}} + ${p2} = ${nd.res}$.` });
    return nd.res;
  })(X, Y, n, 0, 'root', null, 0);
  return { nodes, frames, mults, root: nodes[0] };
}
// exact operation counts of the digit-array implementation (cost model of 4.1 and 4.15)
//   schoolbook: n² digit products + n(n+1) digit additions;  Karatsuba node: 10⌈n/2⌉ + 4 digit additions
function karCosts(n0, N) {
  const K = new Float64Array(N + 1), M = new Float64Array(N + 1);
  for (let n = 1; n <= N; n++) {
    if (n <= n0) { K[n] = 2 * n * n + n; M[n] = n * n; } else { const m = Math.ceil(n / 2), h = n - m; K[n] = K[h] + 2 * K[m] + 10 * m + 4; M[n] = M[h] + 2 * M[m]; }
  }
  return { K, M };
}

// ---------------------------------------------------------------- 4.2 Strassen
// A and B entries in the order 11, 12, 21, 22; each product is (Σ α A)(Σ β B)
const ST_M = [
  { a: [1, 0, 0, 1], b: [1, 0, 0, 1], tex: '(A_{11}+A_{22})(B_{11}+B_{22})' },
  { a: [0, 0, 1, 1], b: [1, 0, 0, 0], tex: '(A_{21}+A_{22})\\,B_{11}' },
  { a: [1, 0, 0, 0], b: [0, 1, 0, -1], tex: 'A_{11}(B_{12}-B_{22})' },
  { a: [0, 0, 0, 1], b: [-1, 0, 1, 0], tex: 'A_{22}(B_{21}-B_{11})' },
  { a: [1, 1, 0, 0], b: [0, 0, 0, 1], tex: '(A_{11}+A_{12})\\,B_{22}' },
  { a: [-1, 0, 1, 0], b: [1, 1, 0, 0], tex: '(A_{21}-A_{11})(B_{11}+B_{12})' },
  { a: [0, 1, 0, -1], b: [0, 0, 1, 1], tex: '(A_{12}-A_{22})(B_{21}+B_{22})' },
];
const ST_COL = ['blue', 'orange', 'teal', 'purple', 'pink', 'gold', 'gray'];
const ST_C = { 11: [[0, 1], [3, 1], [4, -1], [6, 1]], 12: [[2, 1], [4, 1]], 21: [[1, 1], [3, 1]], 22: [[0, 1], [1, -1], [2, 1], [5, 1]] };
const ST_BCOL = [0, 2, 1, 3]; // grid columns: B11, B21, B12, B22

// ---------------------------------------------------------------- 4.3 / 4.4 closest pair
function blueNoise(rng, n, x0, x1, y0, y1, dmin, xw) {
  const pts = []; let tries = 0;
  while (pts.length < n && tries < 20000) {
    tries++;
    let x = rng.uniform(x0, x1);
    if (xw) { x = (x0 + x1) / 2 + rng.normal() * xw; if (x < x0 || x > x1) continue; }
    const p = [x, rng.uniform(y0, y1)];
    if (pts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) >= dmin)) pts.push(p);
  }
  return pts;
}
const dist2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
// split by x-rank, true δ on each side, the strip of half-width fac·δ sorted by y, and the 7-neighbour counts
function stripInfo(pts, fac) {
  const n = pts.length, order = pts.map((_, i) => i).sort((i, j) => pts[i][0] - pts[j][0] || pts[i][1] - pts[j][1]);
  const h = n >> 1, ell = (pts[order[h - 1]][0] + pts[order[h]][0]) / 2, side = new Array(n);
  order.forEach((id, r) => { side[id] = r < h ? 0 : 1; });
  const best = [{ d: Infinity, p: null }, { d: Infinity, p: null }];
  let cross = { d: Infinity, p: null };
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = dist2(pts[i], pts[j]);
    if (side[i] === side[j]) { if (d < best[side[i]].d) best[side[i]] = { d, p: [i, j] }; } else if (d < cross.d) cross = { d, p: [i, j] };
  }
  const delta = Math.min(best[0].d, best[1].d), du = delta * fac;
  const strip = pts.map((_, i) => i).filter((i) => Math.abs(pts[i][0] - ell) < du).sort((i, j) => pts[i][1] - pts[j][1] || pts[i][0] - pts[j][0]);
  const cnt = strip.map((id, r) => { let c = 0; for (let t = r + 1; t < strip.length && pts[strip[t]][1] - pts[id][1] < du; t++) c++; return c; });
  return { ell, side, best, cross, delta, du, strip, cnt };
}

// closest pair by divide and conquer; frames optional. Counts distance evaluations and all elementary steps.
function cpRun(pts, record = true) {
  const n = pts.length, cnt = { dist: 0, ops: 0 }, frames = [], calls = [];
  const snap = (o) => { if (!record) return 0; frames.push({ dist: cnt.dist, ops: cnt.ops, ...o }); return frames.length - 1; };
  const D = (i, j) => { cnt.dist++; cnt.ops++; return dist2(pts[i], pts[j]); };
  // merge sort by x with counted comparisons (the presort)
  const msort = (a, key) => { if (a.length < 2) return a; const m = a.length >> 1, L = msort(a.slice(0, m), key), R = msort(a.slice(m), key), out = []; let i = 0, j = 0; while (i < L.length && j < R.length) { cnt.ops++; out.push(key(L[i]) <= key(R[j]) ? L[i++] : R[j++]); } return out.concat(L.slice(i), R.slice(j)); };
  const P = msort(pts.map((_, i) => i), (i) => pts[i][0] + 1e-12 * pts[i][1]);
  const yk = (i) => pts[i][1];
  function rec(lo, hi, depth, parent) {
    const call = { lo, hi, depth, parent, x0: pts[P[lo]][0], x1: pts[P[hi - 1]][0], ids: P.slice(lo, hi) };
    calls.push(call);
    if (hi - lo <= 3) {
      let r = { d: Infinity, pair: null }; const pairs = [];
      for (let i = lo; i < hi; i++) for (let j = i + 1; j < hi; j++) { const d = D(P[i], P[j]); cnt.ops++; pairs.push([P[i], P[j]]); if (d < r.d) r = { d, pair: [P[i], P[j]] }; }
      const ys = msort(P.slice(lo, hi), yk);
      call.res = r;
      call.t0 = call.t1 = snap({ type: 'base', call, pairs, line: 2, note: `${hi - lo} points: check ${pairs.length === 1 ? 'the single pair' : `all ${pairs.length} pairs`} directly; closest distance ${r.d.toFixed(3)}.` });
      return { d: r.d, pair: r.pair, ys };
    }
    const mid = (lo + hi) >> 1, ell = (pts[P[mid - 1]][0] + pts[P[mid]][0]) / 2;
    call.ell = ell; call.mid = mid;
    call.t0 = snap({ type: 'split', call, line: [3, 4], note: `${hi - lo} points: split at the vertical line $x = ${ell.toFixed(2)}$ into ${mid - lo} + ${hi - mid} and recurse on each half.` });
    const L = rec(lo, mid, depth + 1, call), R = rec(mid, hi, depth + 1, call);
    let r = L.d <= R.d ? { d: L.d, pair: L.pair } : { d: R.d, pair: R.pair }; cnt.ops++;
    const delta = r.d, ys = []; let i = 0, j = 0;
    while (i < L.ys.length && j < R.ys.length) { cnt.ops++; ys.push(yk(L.ys[i]) <= yk(R.ys[j]) ? L.ys[i++] : R.ys[j++]); }
    while (i < L.ys.length) ys.push(L.ys[i++]); while (j < R.ys.length) ys.push(R.ys[j++]);
    const strip = ys.filter((id) => { cnt.ops++; return Math.abs(pts[id][0] - ell) < delta; });
    const compared = []; let improved = false;
    for (let a = 0; a < strip.length; a++) for (let b = a + 1; b < strip.length; b++) {
      cnt.ops++; if (yk(strip[b]) - yk(strip[a]) >= delta) break;
      const d = D(strip[a], strip[b]); cnt.ops++; compared.push([strip[a], strip[b]]);
      if (d < r.d) { r = { d, pair: [strip[a], strip[b]] }; improved = true; }
    }
    Object.assign(call, { res: r, delta, strip, compared, L: { d: L.d, pair: L.pair }, R: { d: R.d, pair: R.pair }, improved });
    call.t1 = snap({ type: 'combine', call, line: [5, 6, 7], hold: 1.5, note: `Halves return $\\delta_L = ${L.d.toFixed(3)}$ and $\\delta_R = ${R.d.toFixed(3)}$, so $\\delta = ${delta.toFixed(3)}$. The strip $|x-\\ell|<\\delta$ holds ${strip.length} point${strip.length === 1 ? '' : 's'}; scanning it by $y$ makes ${compared.length} distance check${compared.length === 1 ? '' : 's'}${improved ? ` and finds a closer pair across the line, at distance ${r.d.toFixed(3)}` : ', none closer than $\\delta$'}.` });
    return { d: r.d, pair: r.pair, ys };
  }
  const res = rec(0, n, 0, null);
  return { frames, calls, res, cnt };
}
// worst case for the distance count from the strip lemma: U(n) = U(⌈n/2⌉) + U(⌊n/2⌋) + 7n
const cpBound = (() => { const U = [0, 0, 1, 3]; return (n) => { for (let k = U.length; k <= n; k++) U[k] = U[Math.ceil(k / 2)] + U[k >> 1] + 7 * k; return U[n]; }; })();

// ---------------------------------------------------------------- 4.5 polynomial helpers
const vander = (xs, n) => xs.slice(0, n).map((x) => Array.from({ length: n }, (_, j) => x ** j));
const peval = (a, x) => a.reduceRight((acc, c) => acc * x + c, 0);

export default {
  collection: 'algo',
  chapter: 4,
  title: 'Fast multiplication, geometry and the FFT',
  summary: String.raw`Divide and conquer beats the obvious algorithm on problems that look too simple to improve: multiplying integers (Karatsuba), multiplying matrices (Strassen) and finding the closest pair of points. Each speed-up trades multiplications for additions or bookkeeping, so it pays only beyond a crossover size, which the operation counts locate. The most celebrated success is the fast Fourier transform, which evaluates a polynomial at the complex roots of unity by recursive halving; multiplying polynomials or long integers then becomes evaluation, pointwise multiplication and interpolation, all in $O(n\log n)$.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Algorithm',
      name: 'Karatsuba multiplication',
      statement: String.raw`To multiply two $n$-digit numbers, split each at $m=\lceil n/2\rceil$ digits from the right, $x=a\cdot10^m+b$ and $y=c\cdot10^m+d$, so that
$$xy = ac\cdot10^{2m}+(ad+bc)\cdot10^m+bd .$$
**Karatsuba's algorithm** computes the three products $P_1=ac$, $P_2=bd$ and $P_3=(a+b)(c+d)$ recursively and recovers the middle coefficient as $ad+bc=P_3-P_1-P_2$; everything else is shifting and adding. The number of one-digit multiplications satisfies $M(1)=1$, $M(n)=M(\lfloor n/2\rfloor)+2M(\lceil n/2\rceil)$, so $M(n)=3^{\lg n}=n^{\lg 3}\approx n^{1.585}$ when $n$ is a power of 2 (and $n^{\lg 3}\le M(n)\le 3^{\lceil\lg n\rceil}$ in general), and the running time is $\Theta(n^{\lg 3})$ against $\Theta(n^2)$ for the schoolbook method.`,
      idea: String.raw`Four half-size products are needed to write down $xy$, but only their combination $ad+bc$ matters in the middle, and it can be read off one product of sums: $(a+b)(c+d)=ac+ad+bc+bd$. Saving one product in four changes the recurrence from $4T(n/2)+\Theta(n)$, which is still $\Theta(n^2)$, to $3T(n/2)+\Theta(n)$, which the master theorem (2.7, case 1) solves as $\Theta(n^{\log_2 3})$. The price is a larger linear term (more additions and subtractions), so in practice the recursion stops at a cut-off size and multiplies small blocks the schoolbook way. A carry digit of $a+b$ is 0 or 1, so it contributes only shifted copies and no new multiplications.`,
      caption: String.raw`Step through the recursion on two numbers (pick the length, **New numbers**, or the all-9s input that makes every sum $a+b$ carry). The gold box is the running call, orange boxes wait on the call stack, green boxes have returned their product. The square shows the trick at the current call: the whole square is $(a+b)(c+d)$, so the two orange blocks $ad+bc$ never need their own products. Right: the count of one-digit products against $n^2$; switch to **all digit operations** to include the additions and move the cut-off to see where Karatsuba starts to pay.`,
      deps: ['algo-2.1', 'algo-2.7'],
      refs: ['KT §5.5', 'Erickson Ch. 1'],
      credit: 'Anatoly Karatsuba, 1960 (published 1962)',
      tags: ['divide and conquer', 'arithmetic'],
      viz(v) {
        const rng = v.rng(41);
        let X = 1234n, Y = 5678n, run = karaRun(X, Y, 4);
        const nS = v.slider('digits $n$', 2, 8, 4, { int: true, onChange: () => { newNums(); } });
        const randN = (n) => { let s = String(rng.int(1, 9)); for (let k = 1; k < n; k++) s += rng.int(0, 9); return BigInt(s); };
        function newNums() { X = randN(nS.value); Y = randN(nS.value); S.reset({ at: 'end' }); }
        const S = v.steps({ frames: () => (run = karaRun(X, Y, nS.value)).frames, code: KA_CODE, codeTitle: 'Karatsuba(x, y, n)', speed: 2, codePos: 'below', start: 'end', still: 'end' });
        v.button('New numbers', () => newNums());
        v.button('All 9s', () => { X = Y = 10n ** BigInt(nS.value) - 1n; S.reset({ at: 'end' }); });
        const mode = v.select('count', [{ value: 'mul', label: 'digit multiplications' }, { value: 'ops', label: 'all digit operations' }], 'mul', { onChange: () => { cut.el.hidden = mode.value !== 'ops'; } });
        const cut = v.slider('cut-off $n_0$ (schoolbook below)', 1, 64, 16, { int: true }); cut.el.hidden = true;
        const T = v.stage({ x: [0, 1], y: [-2.6, 0.55], axes: false, height: 290, full: true });
        const A = v.stage({ x: [-0.42, 1.12], y: [-0.38, 1.3], equal: true, axes: false, height: 290, weight: 0.85, title: 'the three-for-four trick at the current call' });
        const NMAX = 4096;
        const P = v.stage({ x: [1, NMAX], y: [1, 4e7], xlog: true, ylog: true, axes: 'box', height: 290, weight: 1.15, xlabel: 'n', title: 'one-digit products' });
        const cache = {}; const costs = (n0) => cache[n0] || (cache[n0] = karCosts(n0, NMAX));
        const ROLE = { ac: 'blue', bd: 'purple', mid: 'orange' };
        let cross = null;
        v.render(() => {
          const f = S.frame, i = S.i, n = nS.value, D = Math.ceil(LG(n));
          // ---- recursion tree
          T.setView([0, 1], [-(D + 0.48), 0.42]);
          const stack = new Set(); for (let q = f.node && f.node.parent; q; q = q.parent) stack.add(q);
          const pos = (nd) => [(nd.slot + 0.5) / 3 ** nd.depth, -nd.depth], bh = 0.3;
          for (const nd of run.nodes) if (nd.parent) {
            const [x, y] = pos(nd), [px, py] = pos(nd.parent), on = nd.t0 <= i;
            T.line(px, py - bh, x, y + bh, { color: ROLE[nd.role], width: on ? 2.2 : 1.2, alpha: on ? 0.9 : 0.3 });
            if (nd.depth === 1) T.text(nd.role === 'ac' ? 'ac' : nd.role === 'bd' ? 'bd' : '(a+b)(c+d)', (x + px) / 2 + (nd.role === 'mid' ? 0.012 : 0), (y + py) / 2, { align: nd.role === 'ac' ? 'right' : 'left', dx: nd.role === 'ac' ? -8 : 8, size: 11.5, color: ROLE[nd.role], weight: 700, math: nd.role !== 'mid' });
          }
          for (const nd of run.nodes) {
            const [x, y] = pos(nd), w = 0.44 / 3 ** nd.depth, Wpx = Math.abs(T.X(x + w) - T.X(x - w));
            const called = nd.t0 <= i, done = nd.t1 <= i, cur = f.node === nd, onS = stack.has(nd);
            if (!called) { T.rect(x - w, y - bh, x + w, y + bh, { color: 'faint', width: 1, dash: [3, 3] }); continue; }
            const col = cur ? 'gold' : onS ? 'orange' : done ? 'green' : 'muted';
            T.rect(x - w, y - bh, x + w, y + bh, { fill: col, fillAlpha: cur ? 0.28 : done ? 0.12 : 0.05, color: col, width: cur || onS ? 2.6 : 1.3 });
            const lab = `${pad(nd.x, nd.n)}×${pad(nd.y, nd.n)}`, sz = Math.min(13, (Wpx - 4) / (lab.length * 0.62));
            if (sz >= 6.5) T.text(lab, x, y + (done ? 0.11 : 0), { align: 'center', size: sz, weight: 600, halo: false });
            if (done) { const r = String(nd.res), z2 = Math.min(12.5, (Wpx - 4) / (r.length * 0.64)); if (z2 >= 6) T.text(r, x, y - 0.14, { align: 'center', size: z2, color: 'green', weight: 700, halo: false }); }
          }
          // ---- area model at the focused call
          const nd = f.node && f.node.n > 1 ? f.node : f.node ? f.node.parent : run.root;
          const k = nd.kids, know = (c) => c && c.t1 <= i, sm = (s) => (String(s).length > 9 ? String(s).slice(0, 8) + '…' : String(s));
          A.setTitle(`the three-for-four trick at $${pad(nd.x, nd.n)}\\times${pad(nd.y, nd.n)}$`);
          A.rect(0, 0.5, 0.5, 1, { fill: 'blue', fillAlpha: know(k[0]) ? 0.3 : 0.12, color: 'blue', width: 1.5 });
          A.rect(0.5, 0, 1, 0.5, { fill: 'purple', fillAlpha: know(k[1]) ? 0.3 : 0.12, color: 'purple', width: 1.5 });
          for (const [x0, y0] of [[0.5, 0.5], [0, 0]]) {
            A.rect(x0, y0, x0 + 0.5, y0 + 0.5, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.2 });
            A.clip(() => { for (let t = -0.5; t < 0.5; t += 0.06) A.line(x0 + t, y0, x0 + t + 0.5, y0 + 0.5, { color: 'orange', width: 1, alpha: 0.35 }); }, [x0, x0 + 0.5], [y0, y0 + 0.5]);
          }
          A.rect(0, 0, 1, 1, { color: 'orange', width: 2.6, dash: [7, 5] });
          A.tex(`a = ${nd.a}`, 0.25, 1.06, { size: 13, baseline: 'bottom' }); A.tex(`b = ${nd.b}`, 0.75, 1.06, { size: 13, baseline: 'bottom' });
          A.tex(`c = ${nd.c}`, -0.03, 0.75, { size: 13, align: 'right' }); A.tex(`d = ${nd.d}`, -0.03, 0.25, { size: 13, align: 'right' });
          A.tex(know(k[0]) ? `P_1 = ${sm(nd.p1)}` : 'P_1 = ac', 0.25, 0.75, { size: 13.5, color: 'blue' });
          A.tex(know(k[1]) ? `P_2 = ${sm(nd.p2)}` : 'P_2 = bd', 0.75, 0.25, { size: 13.5, color: 'purple' });
          A.tex('bc', 0.75, 0.75, { size: 14, color: 'orange' }); A.tex('ad', 0.25, 0.25, { size: 14, color: 'orange' });
          A.tex(know(k[2]) ? `\\text{whole square } P_3 = ${sm(nd.p3)}` : '\\text{whole square } P_3 = (a+b)(c+d)', 0.5, 1.22, { size: 12.5, color: 'orange', baseline: 'bottom' });
          A.tex(nd.t1 <= i ? `ad+bc = P_3-P_1-P_2 = ${sm(nd.mid)}` : 'ad+bc = P_3 - P_1 - P_2', 0.5, -0.08, { size: 13, baseline: 'top', color: 'ink' });
          A.text('4 block products, only 3 multiplied', 0.5, -0.3, { align: 'center', size: 11, color: 'muted' });
          // ---- cost plot
          const C1 = costs(1);
          if (mode.value === 'mul') {
            P.setTitle('one-digit products'); P.setView([1, NMAX], [1, 4e7]);
            P.fn((x) => x * x, { color: 'red', width: 2 });
            P.fn((x) => x ** LG(3), { color: 'muted', width: 1.4, dash: [5, 4] });
            const pts = []; for (let m = 1; m <= NMAX; m++) pts.push([m, C1.M[m]]); P.path(pts, { color: 'blue', width: 2 });
            P.dot(n, C1.M[n], { r: 5.5, color: 'gold' });
            P.text('schoolbook n²', 30, 900, { color: 'red', size: 11, align: 'right', dx: -6, dy: -8 });
            P.text('Karatsuba M(n)', 900, C1.M[900], { color: 'blue', size: 11, align: 'left', dx: 4, dy: 12 });
            P.text('n^lg 3', 3000, 3000 ** LG(3), { color: 'muted', size: 10.5, align: 'right', dy: -12 });
            cross = null;
          } else {
            const n0 = cut.value, C = costs(n0);
            P.setTitle(`digit operations (products + additions), cut-off $n_0 = ${n0}$`); P.setView([1, NMAX], [1, 1e8]);
            const sb = (m) => 2 * m * m + m;
            cross = crossover((m) => C.K[m], sb, 1, NMAX);
            if (cross) P.vband(cross, NMAX, { color: 'green', alpha: 0.07 });
            P.fn(sb, { color: 'red', width: 2 });
            const p1 = [], p2 = []; for (let m = 1; m <= NMAX; m++) { p1.push([m, C1.K[m]]); p2.push([m, C.K[m]]); }
            P.path(p1, { color: 'blue', width: 1.2, alpha: 0.45, dash: [4, 4] }); P.path(p2, { color: 'blue', width: 2 });
            if (cross) { P.vline(cross, { color: 'green', width: 1.5, dash: [5, 4] }); P.text(`Karatsuba wins from n = ${cross}`, cross, 3e7, { color: 'green', size: 11, weight: 700, dx: 6 }); }
            P.text('schoolbook', 3, sb(3), { color: 'red', size: 11, dy: -12 });
            P.text('pure Karatsuba (n₀ = 1)', 60, C1.K[60], { color: 'blue', size: 10.5, alpha: 0.8, dx: 4, dy: -12 });
          }
        });
        v.legend([['gold', 'running call', { area: true }], ['orange', 'on the call stack', { area: true }], ['green', 'returned', { area: true }], ['blue', 'Karatsuba count'], ['red', 'schoolbook']]);
        v.readout(() => {
          const f = S.frame, n = nS.value, M = costs(1).M[n], lo = n ** LG(3), hi = 3 ** Math.ceil(LG(n));
          let s = `one-digit products so far **${f.mults}**; in all $M(${n}) = ${M}$` + (S.atEnd ? (run.mults === M ? ' ✓' : ' ✗') : '') + `, and $n^{\\lg 3} = ${v.fix(lo, 1)} \\le ${M} \\le 3^{\\lceil\\lg n\\rceil} = ${hi}$ against schoolbook $n^2 = ${n * n}$`;
          if (S.atEnd) s += ` · $${X}\\times${Y} = ${run.root.res}$ ${run.root.res === X * Y ? '✓' : '✗'} (exact big-integer check)`;
          if (mode.value === 'ops') s += cross ? ` · with cut-off $n_0 = ${cut.value}$ Karatsuba needs fewer digit operations for every $n \\ge ${cross}$ (up to ${NMAX})` : ` · with cut-off $n_0 = ${cut.value}$ Karatsuba never catches up below ${NMAX}`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Algorithm',
      name: 'Strassen’s matrix multiplication',
      statement: String.raw`Split $n\times n$ matrices ($n$ a power of 2) into four $\tfrac n2\times\tfrac n2$ blocks, $A=\begin{pmatrix}A_{11}&A_{12}\\A_{21}&A_{22}\end{pmatrix}$ and likewise $B$. **Strassen's algorithm** forms seven block products
$$\begin{aligned}M_1&=(A_{11}+A_{22})(B_{11}+B_{22}), & M_2&=(A_{21}+A_{22})B_{11}, & M_3&=A_{11}(B_{12}-B_{22}),\\ M_4&=A_{22}(B_{21}-B_{11}), & M_5&=(A_{11}+A_{12})B_{22}, & M_6&=(A_{21}-A_{11})(B_{11}+B_{12}),\\ M_7&=(A_{12}-A_{22})(B_{21}+B_{22}),\end{aligned}$$
recursively and returns $C_{11}=M_1+M_4-M_5+M_7$, $C_{12}=M_3+M_5$, $C_{21}=M_2+M_4$, $C_{22}=M_1-M_2+M_3+M_6$, which equals $C=AB$. With $18$ block additions per level, $T(n)=7T(n/2)+\Theta(n^2)=\Theta(n^{\lg 7})\approx\Theta(n^{2.807})$, against $\Theta(n^3)$ for the definition. The identities never use commutativity, so they hold over any ring, in particular for blocks.`,
      idea: String.raw`Write the product as a $4\times4$ table of the sixteen products $A_{ik}B_{lj}$: each output block is the sum of two cells, eight cells in all, so the obvious method needs eight multiplications. A product of sums $(\sum\alpha A)(\sum\beta B)$ covers a rectangle of cells with signs, and Strassen found seven such rectangles whose signed sums hit exactly the four target patterns, every other cell cancelling. By the master theorem (2.7, case 1) the recurrence $7T(n/2)+18(n/2)^2$ is dominated by its $7^{\lg n}=n^{\lg7}$ leaves; the many additions make it slower than the definition for small $n$, so practical codes switch to the classical method below a cut-off.`,
      caption: String.raw`Click the top or bottom half of an entry of $A$ or $B$ to raise or lower it. Each product $M_k$ is drawn as two small grids: the blocks of $A$ and of $B$ it adds (green) or subtracts (red). Pick an output block and step: the $4\times4$ table of products $A_{ik}B_{lj}$ (cell values in the corners) accumulates the signed contributions, and all cells but the two dashed ones cancel. Bottom: scalar multiplications and all arithmetic, Strassen against the definition, with a movable cut-off.`,
      deps: ['algo-2.7'],
      refs: ['CLRS 4e §4.2'],
      credit: 'Volker Strassen, 1969',
      tags: ['divide and conquer', 'matrices'],
      viz(v) {
        const A = [3, 1, -2, 4], B = [5, -1, 2, 3];
        const tSel = v.select('output block', [{ value: '11', label: '$C_{11}$' }, { value: '12', label: '$C_{12}$' }, { value: '21', label: '$C_{21}$' }, { value: '22', label: '$C_{22}$' }], '11', { onChange: () => S.reset({ at: 'end' }) });
        const frames = () => {
          const terms = ST_C[tSel.value], out = [{ coef: Array(16).fill(0), used: [], note: `The definition needs the two dashed products for $C_{${tSel.value}}$. Strassen gets them from signed sums of the $M_k$.` }];
          const coef = Array(16).fill(0), used = [];
          terms.forEach(([k, sg]) => {
            const m = ST_M[k];
            for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) coef[r * 4 + c] += sg * m.a[r] * m.b[ST_BCOL[c]];
            used.push([k, sg]);
            out.push({ coef: coef.slice(), used: used.slice(), cur: k, note: `${sg > 0 ? 'Add' : 'Subtract'} $M_${k + 1} = ${m.tex}$: it covers ${m.a.filter((x) => x).length * m.b.filter((x) => x).length} cells of the product table.` });
          });
          out[out.length - 1].note += ' Every cell outside the target has cancelled.';
          return out;
        };
        const S = v.steps({ frames, speed: 1.2, start: 'end', still: 'end' });
        const L = v.stage({ x: [0, 12], y: [0, 10], axes: false, height: 400, weight: 1.15 });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1, title: 'the 16 products $A_{ik}B_{lj}$, signed contributions' });
        const TG = v.table(G, { rows: 4, cols: 4, rowLabels: ['$A_{11}$', '$A_{12}$', '$A_{21}$', '$A_{22}$'], colLabels: ['$B_{11}$', '$B_{21}$', '$B_{12}$', '$B_{22}$'], maxCell: 64, size: 17, subSize: 10.5, subColor: 'muted', region: [0, 0.18, 1, 1] });
        const mode = v.select('count', [{ value: 'mul', label: 'scalar multiplications' }, { value: 'ops', label: 'all arithmetic' }], 'mul', { onChange: () => { cut.el.hidden = mode.value !== 'ops'; } });
        const cut = v.slider('cut-off $n_0 = 2^j$, $j$', 0, 7, 3, { int: true, fmt: (j) => `${2 ** j}` }); cut.el.hidden = true;
        const Pl = v.stage({ x: [1, 4096], y: [1, 1e12], xlog: true, ylog: true, axes: 'box', height: 230, full: true, xlabel: 'n', title: 'cost for $n\\times n$ matrices, $n = 2^k$' });
        const cellA = (r, c) => [0.4 + c * 1.05, 8.1 - r * 1.05], cellB = (r, c) => [3.75 + c * 1.05, 8.1 - r * 1.05], cellC = (r, c) => [7.6 + c * 1.05, 8.1 - r * 1.05];
        L.onClick((x, y) => {
          for (const [M, cf] of [[A, cellA], [B, cellB]]) for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
            const [x0, y0] = cf(r, c);
            if (x >= x0 && x <= x0 + 1 && y >= y0 && y <= y0 + 1) { M[r * 2 + c] = Math.max(-9, Math.min(9, M[r * 2 + c] + (y > y0 + 0.5 ? 1 : -1))); v.invalidate(); return; }
          }
        });
        const Mval = () => ST_M.map((m) => { const sa = m.a.reduce((s, c, i) => s + c * A[i], 0), sb = m.b.reduce((s, c, i) => s + c * B[i], 0); return [sa, sb, sa * sb]; });
        const direct = () => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
        const fromM = (mv) => ['11', '12', '21', '22'].map((key) => ST_C[key].reduce((s, [k, sg]) => s + sg * mv[k][2], 0));
        const classical = (n) => 2 * n ** 3 - n * n;
        const strassen = (n, n0) => (n <= n0 ? classical(n) : 7 * strassen(n / 2, n0) + 18 * (n / 2) ** 2);
        let info = {};
        v.render(() => {
          const f = S.frame, mv = Mval(), Cd = direct(), Cm = fromM(mv), key = tSel.value, ti = +key[0] - 1, tj = +key[1] - 1;
          // ---- matrices
          const grid = (M, cf, name, col, hiCell) => {
            for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
              const [x0, y0] = cf(r, c), hi = hiCell && hiCell(r, c);
              L.rect(x0, y0, x0 + 1, y0 + 1, { fill: hi ? 'gold' : col, fillAlpha: hi ? 0.3 : 0.1, color: hi ? 'gold' : col, width: hi ? 2.4 : 1.2 });
              L.text(mnus(M[r * 2 + c]), x0 + 0.5, y0 + 0.5, { align: 'center', size: 17, weight: 600, halo: false });
            }
            const [xa] = cf(0, 0); L.tex(name, xa + 1.05, 9.55, { size: 16, color: col });
          };
          grid(A, cellA, 'A', 'accent'); grid(B, cellB, 'B', 'accent'); grid(Cm, cellC, 'C', 'green', (r, c) => r === ti && c === tj);
          L.text('×', 3.07, 8.1, { align: 'center', size: 22, color: 'muted' }); L.text('=', 6.92, 8.1, { align: 'center', size: 22, color: 'muted' });
          for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const [x0, y0] = cellC(r, c); L.text(Cm[r * 2 + c] === Cd[r * 2 + c] ? '✓' : '✗', x0 + 0.88, y0 + 0.16, { align: 'center', size: 10, color: Cm[r * 2 + c] === Cd[r * 2 + c] ? 'green' : 'red', halo: false }); }
          // ---- the seven products
          const used = new Map((f.used || []).map(([k, sg]) => [k, sg])), inTarget = new Map(ST_C[key].map(([k, sg]) => [k, sg]));
          const glyph = (x0, y0, coefs) => { for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const cf = coefs[r * 2 + c], X0 = x0 + c * 0.42, Y0 = y0 - r * 0.38; L.rect(X0, Y0 - 0.36, X0 + 0.4, Y0, { fill: cf > 0 ? 'green' : cf < 0 ? 'red' : 'faint', fillAlpha: cf ? 0.75 : 0.12, color: cf ? (cf > 0 ? 'green' : 'red') : 'faint', width: 0.8 }); } };
          ST_M.forEach((m, k) => {
            const y = 6.15 - k * 0.86, col = ST_COL[k], isUsed = used.has(k), cur = f.cur === k;
            if (cur) L.rect(0.08, y - 0.84, 11.92, y + 0.06, { fill: 'gold', fillAlpha: 0.14, color: 'gold', width: 1.6 });
            L.rect(0.2, y - 0.62, 1.1, y - 0.12, { fill: col, fillAlpha: 0.85, color: col, width: 1 });
            L.text(`M${'₁₂₃₄₅₆₇'[k]}`, 0.65, y - 0.37, { align: 'center', size: 12.5, weight: 700, color: 'panel', halo: false });
            glyph(1.35, y, m.a); L.text('×', 2.4, y - 0.37, { align: 'center', size: 13, color: 'muted' }); glyph(2.62, y, m.b);
            const [sa, sb, p] = mv[k];
            L.text(`= ${mnus(sa)} × ${mnus(sb)} = ${mnus(p)}`, 3.6, y - 0.37, { size: 13, weight: 600, color: isUsed || cur ? 'ink' : 'muted' });
            if (inTarget.has(k)) L.text(`${inTarget.get(k) > 0 ? '+' : '−'} in C${'₁₂'[ti]}${'₁₂'[tj]}`, 11.8, y - 0.37, { align: 'right', size: 12, weight: 700, color: isUsed ? (inTarget.get(k) > 0 ? 'green' : 'red') : 'faint' });
          });
          L.text('green: added, red: subtracted', 0.2, 0.1, { size: 10.5, color: 'muted', baseline: 'bottom' });
          // ---- product table
          const tgt = new Set([`${2 * ti}:${ST_BCOL.indexOf(tj)}`, `${2 * ti + 1}:${ST_BCOL.indexOf(2 + tj)}`]);
          const curM = f.cur != null ? ST_M[f.cur] : null;
          TG.draw({
            value: (r, c) => { const x = f.coef[r * 4 + c]; return x === 0 ? '' : (x > 0 ? '+' : '−') + Math.abs(x); },
            fill: (r, c) => { const x = f.coef[r * 4 + c]; return x > 0 ? ['green', 0.18 + 0.2 * Math.min(2, x)] : x < 0 ? ['red', 0.18 + 0.2 * Math.min(2, -x)] : null; },
            textColor: (r, c) => (f.coef[r * 4 + c] > 0 ? 'green' : 'red'),
            sub: (r, c) => mnus(A[r] * B[ST_BCOL[c]]),
            highlight: curM ? [].concat(...[0, 1, 2, 3].map((r) => [0, 1, 2, 3].filter((c) => curM.a[r] * curM.b[ST_BCOL[c]]).map((c) => [r, c, ST_COL[f.cur]]))) : [],
          });
          for (const t of tgt) { const [r, c] = t.split(':').map(Number); TG.box(r, c, r, c, { color: 'ink', dash: [4, 3], width: 2 }); }
          const ok = f.coef.every((x, idx) => (tgt.has(`${idx >> 2}:${idx & 3}`) ? x === 1 : x === 0));
          const partial = (f.used || []).reduce((s, [k, sg]) => s + sg * mv[k][2], 0);
          G.text(`${(f.used || []).map(([k, sg], q) => `${q ? (sg > 0 ? ' + ' : ' − ') : sg > 0 ? '' : '−'}M${'₁₂₃₄₅₆₇'[k]}`).join('') || '(nothing added yet)'}  =  ${mnus(partial)}`, 0.5, 0.11, { align: 'center', size: 13.5, weight: 600, color: ok ? 'green' : 'ink' });
          G.text(ok ? `= C${'₁₂'[ti]}${'₁₂'[tj]} = ${mnus(Cd[ti * 2 + tj])} ✓ all other cells cancel` : 'cells outside the dashed pair have not cancelled yet', 0.5, 0.04, { align: 'center', size: 11, color: ok ? 'green' : 'muted' });
          // ---- cost plot
          const ns = []; for (let k = 0; k <= 12; k++) ns.push(2 ** k);
          const series = (g) => ns.map((n) => [n, g(n)]);
          if (mode.value === 'mul') {
            Pl.setView([1, 4096], [1, 1e12]);
            Pl.path(series((n) => n ** 3), { color: 'red', width: 2 }); Pl.dots(series((n) => n ** 3), { r: 3, color: 'red' });
            Pl.path(series((n) => n ** LG(7)), { color: 'blue', width: 2 }); Pl.dots(series((n) => n ** LG(7)), { r: 3, color: 'blue' });
            Pl.text('definition: 8ᵏ = n³', 64, 64 ** 3, { color: 'red', size: 11, dx: -6, dy: -10, align: 'right' });
            Pl.text('Strassen: 7ᵏ = n^lg 7', 512, 512 ** LG(7), { color: 'blue', size: 11, dx: 6, dy: 12 });
            Pl.text(`at n = 4096: ${v.fix(4096 ** 3 / 4096 ** LG(7), 1)}× fewer`, 4096, 3e4, { color: 'muted', size: 11, align: 'right', dx: -8 });
            info.cross = null;
          } else {
            const n0 = 2 ** cut.value, cr = ns.find((n, idx) => ns.slice(idx).every((m) => strassen(m, n0) < classical(m)));
            Pl.setView([1, 4096], [1, 1e12]);
            if (cr) { Pl.vband(cr, 4096, { color: 'green', alpha: 0.07 }); Pl.vline(cr, { color: 'green', dash: [5, 4], width: 1.5 }); Pl.text(`Strassen wins from n = ${cr}`, cr, 3e10, { color: 'green', size: 11, weight: 700, dx: 6 }); }
            Pl.path(series(classical), { color: 'red', width: 2 }); Pl.dots(series(classical), { r: 3, color: 'red' });
            Pl.path(series((n) => strassen(n, 1)), { color: 'blue', width: 1.2, alpha: 0.45, dash: [4, 4] });
            Pl.path(series((n) => strassen(n, n0)), { color: 'blue', width: 2 }); Pl.dots(series((n) => strassen(n, n0)), { r: 3, color: 'blue' });
            Pl.text('definition 2n³ − n²', 8, classical(8), { color: 'red', size: 11, dx: -6, dy: -10, align: 'right' });
            Pl.text(`Strassen, cut-off ${n0}`, 1024, strassen(1024, n0), { color: 'blue', size: 11, dx: 6, dy: 12 });
            info.cross = cr;
          }
          info.ok = Cm.every((x, q) => x === Cd[q]);
        });
        v.legend([['green', 'added block / +1 cell', { area: true }], ['red', 'subtracted block / −1 cell', { area: true }], ['ink', 'cells the definition multiplies', { dash: true }]]);
        v.readout(() => {
          let s = `$C = AB$ from 7 products ${info.ok ? '✓ (all four blocks agree with the definition)' : '✗'} · this $2\\times2$ step: 7 multiplications and 18 additions, against 8 and 4`;
          if (mode.value === 'ops') s += info.cross ? ` · with cut-off $${2 ** cut.value}$, Strassen needs fewer operations for every $n = 2^k \\ge ${info.cross}$` : ' · with this cut-off Strassen never wins below 4096';
          else s += ` · at $n = 2^{12}$: $7^{12} = ${tnum(7 ** 12)}$ against $8^{12} = ${tnum(8 ** 12)}$`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Lemma',
      name: 'The strip lemma for closest pairs',
      statement: String.raw`Let a finite set of points be split by a vertical line $x=\ell$ into a left part $L$ and a right part $R$, and let $\delta=\min(\delta_L,\delta_R)$, where $\delta_L$ ($\delta_R$) is the smallest distance between two points of $L$ (of $R$). Then:
(a) if $p\in L$, $q\in R$ and $d(p,q)<\delta$, both $p$ and $q$ lie in the **strip** $|x-\ell|<\delta$;
(b) if the strip points are listed by increasing $y$, any two of them at distance less than $\delta$ are at most 7 places apart in that list. So the closest pair across the line is found by comparing each strip point with the next 7 only: $O(n)$ distance checks instead of $O(n^2)$.`,
      idea: String.raw`Part (a) is immediate: $|x_p-\ell|\le|x_p-x_q|\le d(p,q)<\delta$. For (b), if $q$ comes after $p$ and $d(p,q)<\delta$, then $q$ lies in the $2\delta\times\delta$ box above $p$, $[\ell-\delta,\ell+\delta]\times[y_p,y_p+\delta)$. Cut the box into eight squares of side $\delta/2$, four on each side of the line. A square has diameter $\delta/\sqrt2<\delta$ and lies on one side, so it holds at most one point (two points in it would be a same-side pair closer than $\delta$). Hence the box holds at most 8 points, $p$ included, and $q$ is among the next 7.`,
      caption: String.raw`Drag points (blue left of the line, purple right); click a strip point to make it $p$. The gold box above $p$ is cut into eight $\delta/2$ squares, each holding at most one point, and the labels $+1,\dots,+7$ count places after $p$ in $y$-order. Right: for every strip point, the number of later strip points within $\delta$ vertically, never above 7. Push **δ used** above 1 to pretend the same-side points are farther apart than they are: the boxes overfill and the bound breaks; below 1, close pairs across the line fall outside the strip.`,
      deps: ['algo-2.1'],
      refs: ['KT §5.4'],
      credit: 'Shamos & Hoey, 1975',
      tags: ['geometry'],
      viz(v) {
        const rng = v.rng(43);
        const presets = {
          spread: () => blueNoise(v.rng(7), 26, 0.4, 9.6, 0.4, 6.0, 1.05),
          line: () => blueNoise(v.rng(11), 26, 0.4, 9.6, 0.4, 6.0, 0.95, 1.1),
          hex: () => { const out = []; for (let r = 0; r < 7; r++) for (let c = -3; c <= 3; c++) { const x = 5 + (c + (r % 2 ? 0.5 : 0)) * 1.0 + 0.02 * r, y = 0.5 + r * 0.866; if (x > 0.3 && x < 9.7) out.push([x, y]); } return out; },
        };
        let pts = presets.spread(), sel = null, drag = null;
        const pre = v.select('points', [{ value: 'spread', label: 'spread out' }, { value: 'line', label: 'crowding the line' }, { value: 'hex', label: 'hexagonal lattice' }], 'spread', { onChange: () => { pts = presets[pre.value](); sel = null; } });
        const fac = v.slider('δ used ÷ true δ', 0.5, 2.5, 1, { step: 0.05 });
        v.button('Jiggle', () => { pts = pts.map(([x, y]) => [Math.min(9.7, Math.max(0.3, x + rng.uniform(-0.12, 0.12))), Math.min(6.1, Math.max(0.3, y + rng.uniform(-0.12, 0.12)))]); });
        const s = v.stage({ x: [0, 10], y: [0, 6.4], equal: true, axes: false, height: 360, weight: 1.45 });
        const B = v.stage({ x: [0, 10], y: [0, 9], axes: 'box', height: 360, weight: 1, minWidth: 240, title: 'later strip points within $\\delta$ vertically', xlabel: 'strip point (by y)' });
        let I = stripInfo(pts, 1);
        s.onDrag((x, y, ph) => {
          if (ph === 'start') { let b = -1, bd = 0.35; pts.forEach((p, k) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; b = k; } }); drag = b >= 0 ? { k: b, moved: false } : null; }
          else if (ph === 'move' && drag) { pts[drag.k] = [Math.min(9.8, Math.max(0.2, x)), Math.min(6.25, Math.max(0.15, y))]; drag.moved = true; }
          else if (ph === 'end') drag = null;
        });
        s.onClick((x, y) => { let b = null, bd = 0.4; I.strip.forEach((k) => { const d = Math.hypot(pts[k][0] - x, pts[k][1] - y); if (d < bd) { bd = d; b = k; } }); if (b != null) sel = b; });
        v.render(() => {
          I = stripInfo(pts, fac.value);
          const { ell, side, best, cross, delta, du, strip, cnt } = I;
          if (sel == null || !strip.includes(sel)) sel = strip.length ? strip[cnt.indexOf(Math.max(...cnt))] : null;
          s.vband(ell - du, ell + du, { color: 'orange', alpha: 0.1, edges: true });
          s.line(ell, 0, ell, 6.4, { color: 'ink', width: 1.5, dash: [6, 4] });
          s.text('ℓ', ell, 6.25, { align: 'center', size: 14, math: true, dx: 8 });
          // same-side closest pairs
          [0, 1].forEach((sd) => { const b = best[sd]; if (!b.p) return; const [i, j] = b.p, col = sd ? 'purple' : 'blue'; s.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: col, width: 3, alpha: 0.75 }); s.text(sd ? 'δ_R' : 'δ_L', (pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2, { color: col, size: 12, weight: 700, dy: -10, align: 'center' }); });
          // the box above p
          let inBox = [];
          if (sel != null) {
            const yp = pts[sel][1], rank = strip.indexOf(sel);
            s.rect(ell - du, yp, ell + du, yp + du, { fill: 'gold', fillAlpha: 0.08, color: 'gold', width: 2 });
            for (let c = 1; c < 4; c++) s.line(ell - du + c * du / 2, yp, ell - du + c * du / 2, yp + du, { color: 'gold', width: 1, alpha: c === 2 ? 0.9 : 0.55 });
            s.line(ell - du, yp + du / 2, ell + du, yp + du / 2, { color: 'gold', width: 1, alpha: 0.55 });
            const cellHas = {};
            pts.forEach((p, k) => { if (Math.abs(p[0] - ell) < du && p[1] >= yp && p[1] - yp < du) { inBox.push(k); const cx = Math.min(3, Math.floor((p[0] - ell + du) / (du / 2))), cy = Math.min(1, Math.floor((p[1] - yp) / (du / 2))); cellHas[cx + ':' + cy] = (cellHas[cx + ':' + cy] || 0) + 1; } });
            for (const [kk, c] of Object.entries(cellHas)) { const [cx, cy] = kk.split(':').map(Number); s.rect(ell - du + cx * du / 2, yp + cy * du / 2, ell - du + (cx + 1) * du / 2, yp + (cy + 1) * du / 2, { fill: c > 1 ? 'red' : 'gold', fillAlpha: c > 1 ? 0.35 : 0.16, stroke: false }); }
            for (let t = 1; t <= 7 && rank + t < strip.length; t++) {
              const q = strip[rank + t], within = pts[q][1] - yp < du;
              s.line(pts[sel][0], pts[sel][1], pts[q][0], pts[q][1], { color: within ? 'gold' : 'faint', width: within ? 1.6 : 1, dash: within ? null : [3, 3] });
              s.text(`+${t}`, pts[q][0], pts[q][1], { size: 10.5, weight: 700, color: within ? 'gold' : 'muted', dx: 8, dy: -8 });
            }
          }
          // cross pairs closer than the true δ
          let missed = 0;
          for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (side[i] !== side[j] && dist2(pts[i], pts[j]) < delta) {
            const inside = Math.abs(pts[i][0] - ell) < du && Math.abs(pts[j][0] - ell) < du; if (!inside) missed++;
            s.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: inside ? 'green' : 'red', width: 3.2 });
          }
          pts.forEach((p, k) => { const inS = Math.abs(p[0] - ell) < du; s.dot(p[0], p[1], { r: k === sel ? 7 : inS ? 5.5 : 4.5, color: k === sel ? 'gold' : side[k] ? 'purple' : 'blue', alpha: inS || k === sel ? 1 : 0.55 }); });
          if (sel != null) s.text('p', pts[sel][0], pts[sel][1], { size: 14, math: true, weight: 700, color: 'gold', dx: -10, dy: 10, align: 'right' });
          // bars
          const k = strip.length, mx = Math.max(8.5, ...cnt.map((c) => c + 1));
          B.setView([0.3, Math.max(k, 6) + 0.7], [0, mx]);
          B.setTicks(k <= 16 ? strip.map((_, r) => [r + 1, String(r + 1)]) : null, null);
          B.hband(7, mx, { color: 'red', alpha: 0.07 });
          B.hline(7, { color: 'red', dash: [5, 4], width: 1.5 }); B.text('7 (lemma)', 0.4, 7, { color: 'red', size: 11, dy: -9 });
          cnt.forEach((c, r) => { const col = c > 7 ? 'red' : strip[r] === sel ? 'gold' : side[strip[r]] ? 'purple' : 'blue'; B.rect(r + 1 - 0.34, 0, r + 1 + 0.34, Math.max(c, 0.06), { fill: col, fillAlpha: 0.65, color: col, width: 1 }); });
          I.missed = missed; I.inBox = inBox.length;
        });
        v.legend([['blue', 'left points', { dot: true }], ['purple', 'right points', { dot: true }], ['orange', 'strip $|x-\\ell|<\\delta$', { area: true }], ['green', 'cross pair closer than δ'], ['gold', 'box above p, next 7']]);
        v.readout(() => {
          const { best, delta, du, strip, cnt, missed, inBox } = I, mx = Math.max(0, ...cnt);
          const f = fac.value, hyp = Math.abs(f - 1) < 1e-9 ? '' : f > 1 ? ' — **the hypothesis is broken**: same-side points may be closer than the δ used' : ' — δ used is smaller than the true δ';
          return `$\\delta_L = ${best[0].d.toFixed(3)}$, $\\delta_R = ${best[1].d.toFixed(3)}$, $\\delta = ${delta.toFixed(3)}$, δ used ${du.toFixed(3)}${hyp} · strip: ${strip.length} of ${pts.length} points · box above $p$ holds ${inBox} point${inBox === 1 ? '' : 's'} ${inBox <= 8 ? '≤ 8 ✓' : '> 8 ✗'} · most later strip points within δ: **${mx}** ${mx <= 7 ? '≤ 7 ✓' : '> 7 ✗'}` + (missed ? ` · **${missed}** cross pair${missed > 1 ? 's' : ''} closer than δ lie outside the strip ✗` : ' · every cross pair closer than δ lies in the strip ✓');
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Algorithm',
      name: 'Closest pair of points in O(n log n)',
      statement: String.raw`Given $n\ge2$ points in the plane, the closest pair can be found in $O(n\log n)$ time. Sort the points by $x$ once. Recursively: if at most 3 points remain, compare all pairs; otherwise split at the median $x$-coordinate by a vertical line $\ell$, solve both halves, let $\delta$ be the smaller of the two answers, and then merge the halves' lists sorted by $y$, keep the points with $|x-\ell|<\delta$ and compare each with the following points of that list while their $y$-difference is below $\delta$ (at most 7, by 4.3). Return the best pair found. The running time obeys $T(n)=2T(n/2)+O(n)$, so $T(n)=O(n\log n)$, against $\binom n2$ distance computations for brute force.`,
      idea: String.raw`Correctness: the closest pair is inside the left half, inside the right half, or straddles $\ell$; in the last case its distance is below $\delta$, so both points lie in the strip and are at most 7 places apart in $y$-order (the strip lemma, 4.3). Time: returning each half sorted by $y$ and merging the two lists (as in merge sort, 2.3) keeps the work outside the recursive calls linear, so the master theorem (2.7, case 2) gives $\Theta(n\log n)$; re-sorting the strip in every call would cost $O(n\log^2 n)$. On tiny inputs the bookkeeping costs more than the $\binom n2$ comparisons it saves.`,
      caption: String.raw`Step through the recursion on points you can drag (or pick a layout and resample). The active call's points are coloured by half, the dashed line splits them, blue and purple segments are the halves' answers, and in the orange strip the gold segments are the only distances checked. Bars below the points are the calls, level by level (gold: running, orange: on the stack, green: returned). Right: counts measured on random points (blue) and on a square lattice (orange) against brute force $\binom n2$ and the strip-lemma bound; switch to **all steps** to include sorting and merging and see the crossover.`,
      deps: ['algo-4.3', 'algo-2.3', 'algo-2.7'],
      refs: ['KT §5.4'],
      credit: 'Shamos & Hoey, 1975',
      tags: ['geometry', 'divide and conquer'],
      viz(v) {
        const gen = {
          uniform: (n, r) => Array.from({ length: n }, () => [r.uniform(0.3, 9.7), r.uniform(0.3, 5.7)]),
          clusters: (n, r) => { const cs = [[2.5, 4], [6.5, 1.8], [7.8, 4.5]]; return Array.from({ length: n }, (_, k) => { const c = cs[k % 3]; return [Math.min(9.7, Math.max(0.3, c[0] + 0.9 * r.normal())), Math.min(5.7, Math.max(0.3, c[1] + 0.7 * r.normal()))]; }); },
          lattice: (n) => { const c = Math.ceil(Math.sqrt(n * 10 / 6)), out = []; for (let k = 0; k < n; k++) out.push([0.5 + (k % c) * 9 / Math.max(1, c - 1), 0.5 + Math.floor(k / c) * 9 / Math.max(1, c - 1)]); return out; },
          vertical: (n, r) => Array.from({ length: n }, (_, k) => [5 + 0.04 * r.normal(), 0.3 + 5.4 * (k + r.uniform(0.1, 0.9)) / n]),
        };
        let seed = 3, pts = gen.uniform(16, v.rng(seed)), run = cpRun(pts), drag = null;
        const lay = v.select('layout', [{ value: 'uniform', label: 'random' }, { value: 'clusters', label: 'clusters' }, { value: 'lattice', label: 'lattice' }, { value: 'vertical', label: 'on a line' }], 'uniform', { onChange: () => regen() });
        const nS = v.slider('n', 4, 48, 16, { int: true, onChange: () => regen() });
        function regen() { pts = gen[lay.value](nS.value, v.rng(seed)); S.reset({ at: 'end' }); }
        v.button('Resample', () => { seed++; regen(); });
        const S = v.steps({ frames: () => (run = cpRun(pts)).frames, code: ['ClosestPair(P):   ▷ P sorted by x', '  if |P| ≤ 3: try all pairs', '  ℓ ← median x;  split P into L, R', '  δ_L ← ClosestPair(L);  δ_R ← ClosestPair(R)', '  δ ← min(δ_L, δ_R);  merge L, R by y', '  S ← points with |x − ℓ| < δ, by y', '  compare each s ∈ S with the next ≤ 7', '  return the best pair'], codeTitle: 'closest pair', speed: 2, codePos: 'below', start: 'end', still: 'end' });
        const mode = v.select('count', [{ value: 'dist', label: 'distance checks' }, { value: 'ops', label: 'all steps' }], 'dist');
        const s = v.stage({ x: [0, 10], y: [-2.4, 6], axes: false, height: 400, full: true });
        const P = v.stage({ x: [4, 8192], y: [1, 1e8], xlog: true, ylog: true, axes: 'box', height: 250, full: true, xlabel: 'n' });
        s.onDrag((x, y, ph) => {
          if (ph === 'start') { let b = -1, bd = 0.35; pts.forEach((p, k) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; b = k; } }); drag = b >= 0 ? b : null; }
          else if (ph === 'move' && drag != null) { pts[drag] = [Math.min(9.8, Math.max(0.2, x)), Math.min(5.85, Math.max(0.15, y))]; S.reset({ at: 'end' }); }
          else if (ph === 'end') drag = null;
        });
        // measured counts on random inputs and on square lattices (computed once)
        const meas = { uni: [], lat: [] };
        for (let k = 2; k <= 13; k += 0.5) { const n = Math.round(2 ** k), r = cpRun(gen.uniform(n, v.rng(100 + n)), false); meas.uni.push([n, r.cnt.dist, r.cnt.ops]); }
        for (let c = 2; c <= 90; c = Math.ceil(c * 1.3)) { const pl = []; for (let i = 0; i < c; i++) for (let j = 0; j < c; j++) pl.push([i, j]); const r = cpRun(pl, false); meas.lat.push([c * c, r.cnt.dist, r.cnt.ops]); }
        let brute = null;
        v.render(() => {
          const f = S.frame, i = S.i, c = f.call, n = pts.length;
          const Dmax = Math.max(...run.calls.map((q) => q.depth)), yl = (d) => -0.45 - d * Math.min(0.42, 1.9 / (Dmax + 1));
          s.setView([0, 10], [yl(Dmax) - 0.35, 6]);
          s.line(0, 0, 10, 0, { color: 'faint', width: 1 });
          const stack = new Set(); for (let q = c && c.parent; q; q = q.parent) stack.add(q);
          const inCall = new Set(c ? c.ids : []);
          if (c) s.rect(c.x0 - 0.12, 0.08, c.x1 + 0.12, 5.95, { fill: 'accent', fillAlpha: 0.05, color: 'accent', width: 1, alpha: 0.4 });
          for (const q of stack) if (q.ell != null) s.line(q.ell, 0.08, q.ell, 5.95, { color: 'orange', width: 1, alpha: 0.5, dash: [2, 4] });
          const seg = (pr, col, w) => { if (pr) s.line(pts[pr[0]][0], pts[pr[0]][1], pts[pr[1]][0], pts[pr[1]][1], { color: col, width: w }); };
          if (c && f.type === 'combine') {
            s.vband(c.ell - c.delta, c.ell + c.delta, { color: 'orange', alpha: 0.13 });
            seg(c.L.pair, 'blue', 3); seg(c.R.pair, 'purple', 3);
            c.compared.forEach((pr) => seg(pr, 'gold', 1.4));
            seg(c.res.pair, 'green', c.improved ? 4 : 2.2);
          }
          if (c && f.type === 'base') { f.pairs.forEach((pr) => seg(pr, 'gold', 1.4)); seg(c.res.pair, 'green', 3); }
          if (c && c.ell != null) s.line(c.ell, 0.08, c.ell, 5.95, { color: 'ink', width: 1.6, dash: [6, 4] });
          if (S.atEnd) seg(run.res.pair, 'green', 4.5);
          pts.forEach((p, k) => {
            let col = 'muted', a = 0.4;
            if (inCall.has(k)) { a = 1; col = c.mid != null ? (run.calls && c.ids.indexOf(k) < c.mid - c.lo ? 'blue' : 'purple') : 'accent'; }
            if (S.atEnd && run.res.pair && run.res.pair.includes(k)) { col = 'green'; a = 1; }
            s.dot(p[0], p[1], { r: 4.6, color: col, alpha: a });
          });
          // calls, level by level
          run.calls.forEach((q) => {
            const done = q.t1 <= i, started = q.t0 <= i, cur = q === c, on = stack.has(q), y = yl(q.depth);
            const col = cur ? 'gold' : on ? 'orange' : done ? 'green' : 'faint';
            s.line(q.x0 - 0.06, y, q.x1 + 0.06, y, { color: col, width: cur ? 6 : 4, alpha: started || done ? 1 : 0.5 });
          });
          s.text('calls by level', 0.05, yl(0) + 0.27, { size: 10.5, color: 'muted' });
          s.corner(`distance checks ${f.dist} · all steps ${f.ops}`, 'tr', { color: 'gold', weight: 700 });
          // plot
          const md = mode.value === 'dist', col = md ? 1 : 2;
          P.setTitle(md ? 'distance checks' : 'all elementary steps (distances, comparisons, merge steps)');
          const br = md ? (m) => m * (m - 1) / 2 : (m) => m * (m - 1);
          const cr = crossover((m) => { const near = meas.uni.reduce((b, q) => (Math.abs(Math.log(q[0] / m)) < Math.abs(Math.log(b[0] / m)) ? q : b)); return near[col] * m / near[0]; }, br, 4, 8192);
          P.fn(br, { color: 'red', width: 2 });
          if (md) P.fn((m) => cpBound(Math.round(m)), { color: 'muted', width: 1.4, dash: [5, 4] });
          P.path(meas.uni.map((q) => [q[0], q[col]]), { color: 'blue', width: 2 }); P.dots(meas.uni.map((q) => [q[0], q[col]]), { r: 2.6, color: 'blue' });
          P.path(meas.lat.map((q) => [q[0], q[col]]), { color: 'orange', width: 1.5 }); P.dots(meas.lat.map((q) => [q[0], q[col]]), { r: 2.6, color: 'orange' });
          P.dot(n, run.cnt[md ? 'dist' : 'ops'], { r: 6, color: 'gold' });
          if (cr) { P.vline(cr, { color: 'green', dash: [5, 4], width: 1.4 }); P.text(`divide and conquer wins from n ≈ ${cr}`, cr, 3e7, { color: 'green', size: 11, weight: 700, dx: 6 }); }
          P.text(md ? 'brute force n(n−1)/2' : 'brute force n(n−1)', 60, br(60), { color: 'red', size: 11, dx: -6, dy: -8, align: 'right' });
          if (md) P.text('strip-lemma bound', 4000, cpBound(4000), { color: 'muted', size: 10.5, align: 'right', dy: -11 });
          // brute-force check of the answer
          let bd = Infinity; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) bd = Math.min(bd, dist2(pts[a], pts[b]));
          brute = bd;
        });
        v.legend([['blue', 'left half / random inputs'], ['purple', 'right half'], ['orange', 'strip / lattice inputs'], ['gold', 'distance checked'], ['green', 'best pair']]);
        v.readout(() => {
          const n = pts.length, f = S.frame;
          return `$n = ${n}$: distance checks so far **${f.dist}** (in all ${run.cnt.dist}, strip-lemma bound ${cpBound(n)}) against brute force $\\binom{${n}}{2} = ${n * (n - 1) / 2}$ · closest distance ${run.res.d.toFixed(4)}, brute force ${brute.toFixed(4)} ${Math.abs(run.res.d - brute) < 1e-12 ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Coefficient and point-value representations',
      statement: String.raw`A polynomial of **degree bound** $n$ is $A(x)=\sum_{j=0}^{n-1}a_jx^j$. It can be stored in two ways:
- **coefficient form**: the vector $(a_0,\dots,a_{n-1})$;
- **point-value form**: the $n$ pairs $(x_0,y_0),\dots,(x_{n-1},y_{n-1})$ with distinct $x_k$ and $y_k=A(x_k)$.

The two are related by the Vandermonde system $V\mathbf a=\mathbf y$ with $V_{kj}=x_k^{\,j}$, and $\det V=\prod_{j<k}(x_k-x_j)\neq0$ for distinct points, so every set of $n$ values at $n$ distinct points comes from exactly one polynomial of degree bound $n$ (**interpolation**). Evaluation (coefficients to values) takes $\Theta(n^2)$ operations with Horner's rule, interpolation $\Theta(n^2)$ with Lagrange's formula; addition is $\Theta(n)$ in both forms, and multiplication is $\Theta(n)$ in point-value form (given $2n-1$ points) but $\Theta(n^2)$ directly on coefficients.`,
      idea: String.raw`Evaluating at $n$ points is the linear map $\mathbf a\mapsto V\mathbf a$. The Vandermonde determinant is a product of the differences $x_k-x_j$, so the map is invertible exactly when the abscissas are distinct, and then interpolation is the inverse map. The fast algorithms of this chapter choose the points cleverly (complex roots of unity) so that both directions take only $O(n\log n)$.`,
      caption: String.raw`In **coefficients** mode drag the bars $a_0,\dots,a_{n-1}$: the graph and its values at the marked abscissas follow. In **point values** mode drag the points themselves, sideways too: the unique polynomial through them is redrawn and its coefficients are recomputed by solving $V\mathbf a=\mathbf y$ (table). Slide two points onto the same abscissa and $\det V\to0$: the values no longer determine the polynomial.`,
      deps: ['ladr-9.67'],
      refs: ['CLRS 4e §30.1'],
      tags: ['polynomials'],
      viz(v) {
        const NMAX = 6;
        let a = [0.6, -1.4, -0.3, 0.9, 0, 0], xs = [-1.5, -0.5, 0.5, 1.5, 0, 0], ys = new Array(NMAX).fill(0);
        const mode = v.select('edit', [{ value: 'coef', label: 'coefficients' }, { value: 'val', label: 'point values' }], 'coef', { onChange: () => vis() });
        const nSel = v.select('degree bound $n$', ['2', '3', '4', '5', '6'], '4', { onChange: () => { const n = +nSel.value; const L = v.M.linspace(-1.6, 1.6, n); for (let k = 0; k < n; k++) { xs[k] = n === 1 ? 0 : L[k]; hv[k].x = xs[k]; } for (let j = n; j < NMAX; j++) a[j] = 0; if (mode.value === 'val') { const V = vander(xs, n); ys = V.map((r) => r.reduce((s, c, j) => s + c * a[j], 0)); for (let k = 0; k < n; k++) hv[k].y = ys[k]; } vis(); } });
        const G = v.stage({ x: [-2.2, 2.2], y: [-4.2, 4.2], height: 320, weight: 1.25, title: 'the polynomial $A(x)$' });
        const Bs = v.stage({ x: [-0.6, 5.6], y: [-3.4, 3.4], height: 320, weight: 0.9, axes: 'box', title: 'its coefficients $a_j$', xticks: [0, 1, 2, 3, 4, 5].map((j) => [j, `a${'₀₁₂₃₄₅'[j]}`]) });
        const Ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true });
        const TT = v.table(Ts, { rows: 4, cols: 6, square: false, cellAspect: 1.55, maxCell: 40, size: 13 });
        const hb = Array.from({ length: NMAX }, (_, j) => Bs.handle(j, a[j], { constrain: (x, y) => [j, Math.max(-3.2, Math.min(3.2, y))], color: 'orange' }));
        const hv = Array.from({ length: NMAX }, (_, k) => G.handle(xs[k], 0, { constrain: (x, y) => [Math.max(-2.1, Math.min(2.1, x)), Math.max(-4.1, Math.min(4.1, y))], color: 'accent' }));
        function vis() { const n = +nSel.value, cm = mode.value === 'coef'; hb.forEach((h, j) => { h.visible = cm && j < n; }); hv.forEach((h, k) => { h.visible = !cm && k < n; }); }
        vis();
        let st = {};
        v.render(() => {
          const n = +nSel.value, cm = mode.value === 'coef';
          let sol = a.slice(0, n);
          if (cm) { for (let j = 0; j < n; j++) a[j] = hb[j].y; sol = a.slice(0, n); for (let k = 0; k < n; k++) { xs[k] = hv[k].x; ys[k] = peval(sol, xs[k]); hv[k].y = ys[k]; } }
          else { for (let k = 0; k < n; k++) { xs[k] = hv[k].x; ys[k] = hv[k].y; } const s0 = v.M.solve(vander(xs, n), ys.slice(0, n)); sol = s0 && s0.every(isFinite) ? s0 : null; if (sol) for (let j = 0; j < n; j++) { a[j] = sol[j]; hb[j].y = sol[j]; } }
          const V = vander(xs, n), det = v.M.det(V); let prod = 1; for (let k = 0; k < n; k++) for (let j = 0; j < k; j++) prod *= xs[k] - xs[j];
          const sing = Math.abs(det) < 1e-6 || !sol;
          // graph
          xs.slice(0, n).forEach((x) => G.vline(x, { color: sing ? 'red' : 'faint', width: 1, dash: [3, 4] }));
          if (sol) G.clip(() => G.fn((x) => peval(sol, x), { color: 'ink', width: 2.6 }));
          for (let k = 0; k < n; k++) if (cm) G.dot(xs[k], ys[k], { r: 5.5, color: 'accent', label: `y${'₀₁₂₃₄₅'[k]}`, labelPos: 'n', labelSize: 13 });
          if (!cm) for (let k = 0; k < n; k++) G.text(`(x${'₀₁₂₃₄₅'[k]}, y${'₀₁₂₃₄₅'[k]})`, hv[k].x, hv[k].y, { size: 11, color: 'accent', dy: -16, align: 'center' });
          if (sing) G.corner('two abscissas coincide: no unique polynomial', 'tl', { color: 'red', weight: 700 });
          // coefficient bars
          Bs.setView([-0.6, Math.max(n, 3) - 0.4], [-3.4, 3.4]);
          Bs.hline(0, { color: 'muted', width: 1 });
          for (let j = 0; j < n; j++) {
            const y = sol ? sol[j] : 0, yc = Math.max(-3.3, Math.min(3.3, y));
            Bs.rect(j - 0.28, 0, j + 0.28, yc, { fill: 'orange', fillAlpha: cm ? 0.55 : 0.35, color: 'orange', width: 1.2 });
            if (sol) Bs.text(fx(y), j, yc, { align: 'center', size: 11, dy: y >= 0 ? -16 : 16, color: Math.abs(y) > 3.3 ? 'red' : 'ink' });
          }
          // Vandermonde system
          TT.draw({
            rows: n, cols: n + 2,
            colLabels: (j) => (j < n ? `$x^{${j}}$` : j === n ? '$a_k$' : '$y_k$'),
            rowLabels: (k) => `$x_{${k}} = ${fx(xs[k])}$`,
            value: (k, j) => (j < n ? fx(V[k][j]) : j === n ? (sol ? fx(sol[k]) : '?') : fx(ys[k])),
            fill: (k, j) => (j === n ? ['orange', cm ? 0.3 : 0.14] : j === n + 1 ? ['accent', cm ? 0.12 : 0.3] : null),
            textColor: (k, j) => (j < n ? 'muted' : 'ink'),
          });
          Ts.text('V', 0.5, 0.06, { align: 'center', size: 11, color: 'muted' });
          st = { n, det, prod, sing, cm };
        });
        v.legend([['orange', 'coefficients $a_j$', { area: true }], ['accent', 'values $y_k = A(x_k)$', { dot: true }]]);
        v.readout(() => {
          const { n, det, prod, sing, cm } = st;
          return `$\\det V = ${fx(det, 4)}$, $\\prod_{j<k}(x_k-x_j) = ${fx(prod, 4)}$ ${Math.abs(det - prod) <= 1e-9 * Math.max(1, Math.abs(prod)) ? '✓' : '✗'}` + (sing ? ' · **singular**: two equal abscissas, the values do not determine a unique polynomial' : ` · ${cm ? `evaluating at the ${n} points: ${n} Horner passes of ${n - 1} multiplications` : `the ${n} values determine the ${n} coefficients uniquely`}`);
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Algorithm',
      name: 'Horner’s rule',
      statement: String.raw`To evaluate $A(x)=a_0+a_1x+\dots+a_nx^n$ at a point $x_0$, nest the multiplications:
$$A(x_0)=a_0+x_0\bigl(a_1+x_0(a_2+\dots+x_0(a_{n-1}+x_0a_n)\cdots)\bigr).$$
**Horner's rule** sets $b_n=a_n$ and $b_k=b_{k+1}x_0+a_k$ for $k=n-1,\dots,0$; then $b_0=A(x_0)$, after exactly $n$ multiplications and $n$ additions. Term-by-term evaluation that computes each power $x_0^k$ from scratch needs $1+2+\dots+n=n(n+1)/2$ multiplications. As a by-product, $A(x)=(x-x_0)(b_nx^{n-1}+\dots+b_2x+b_1)+b_0$ (synthetic division).`,
      idea: String.raw`The loop keeps the invariant $b_k=q_k(x_0)$, where $q_k(x)=a_k+a_{k+1}x+\dots+a_nx^{n-k}$ is the tail of $A$: indeed $q_k(x)=a_k+x\,q_{k+1}(x)$, and $q_0=A$. Each step costs one multiplication and one addition, so the cost is linear in the degree, and no algorithm evaluates every degree-$n$ polynomial with fewer multiplications in general (Pan, 1966). Evaluating at $n$ different points this way costs $\Theta(n^2)$, the cost the FFT will beat for the special points of 4.8.`,
      caption: String.raw`Drag $x_0$ along the axis and step through the loop. Each faint curve is a tail polynomial $q_k$, and the dot on it is $b_k=q_k(x_0)$; the gold curve is the current tail and the last one is $A$ itself. The table is the synthetic-division tableau. Drag $x_0$ onto a root (red tick): then $b_0=0$, and the row of $b$'s is $A(x)$ divided by $x-x_0$. The plot counts multiplications for every degree.`,
      deps: ['algo-4.5'],
      refs: ['CLRS 4e Prob. 2-3'],
      credit: 'W. G. Horner, 1819 (known to Qin Jiushao, 1247)',
      tags: ['polynomials'],
      viz(v) {
        const rng = v.rng(46);
        let a = [1.2, -1.7, -0.9, 0.8, 0.35, -0.15, 0.1, -0.05, 0.03];
        const nS = v.slider('degree $n$', 2, 8, 5, { int: true, onChange: () => S.reset({ at: 'end' }) });
        v.button('New polynomial', () => { a = a.map((_, j) => +(rng.uniform(-1.6, 1.6) / (1 + 0.6 * j)).toFixed(2)); S.reset({ at: 'end' }); });
        const G = v.stage({ x: [-2.2, 2.2], y: [-4, 4], height: 330, weight: 1.2, title: 'tails $q_k(x) = a_k + a_{k+1}x + \\dots$ and $b_k = q_k(x_0)$' });
        const C = v.stage({ x: [0.5, 16.5], y: [0, 140], axes: 'box', height: 330, weight: 0.85, minWidth: 240, xlabel: 'degree n', title: 'multiplications' });
        const Ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 170, full: true });
        const TT = v.table(Ts, { rows: 3, cols: 6, square: false, cellAspect: 1.45, maxCell: 42, size: 13.5, rowLabels: ['$a_k$', '$+\\;b_{k+1}x_0$', '$b_k$'] });
        const xh = G.handle(0.9, 0, { constrain: 'x', color: 'accent', label: 'x₀', labelPos: 's' });
        const frames = () => {
          const n = nS.value, x = xh.x, b = Array(n + 1).fill(null), pr = Array(n + 1).fill(null);
          b[n] = a[n];
          const out = [{ b: b.slice(), pr: pr.slice(), k: n, mults: 0, line: 2, note: `Start with the leading coefficient: $b_{${n}} = a_{${n}} = ${fx(a[n])}$.` }];
          for (let k = n - 1; k >= 0; k--) {
            pr[k] = b[k + 1] * x; b[k] = pr[k] + a[k];
            out.push({ b: b.slice(), pr: pr.slice(), k, mults: n - k, line: [3, 4], note: `$b_{${k}} = b_{${k + 1}}\\cdot x_0 + a_{${k}} = ${fx(b[k + 1])}\\cdot${fx(x)} ${a[k] < 0 ? '-' : '+'} ${fx(Math.abs(a[k]))} = ${fx(b[k], 3)}$` + (k === 0 ? `, which is $A(${fx(x)})$.` : '.') });
          }
          return out;
        };
        const S = v.steps({ frames, code: ['Horner(a₀..aₙ, x₀):', '  b ← aₙ', '  for k ← n − 1 downto 0:', '    b ← b · x₀ + a_k     ▷ one multiplication, one addition', '  return b'], codeTitle: 'Horner’s rule', start: 'end', still: 3, speed: 1.5 });
        xh.onDrag = () => S.reset({ at: 'keep' });
        const TAILC = ['teal', 'purple', 'pink', 'orange', 'blue', 'teal', 'purple', 'pink', 'orange'];
        v.render(() => {
          const n = nS.value, f = S.frame, x0 = xh.x, A = a.slice(0, n + 1);
          const tail = (k) => (x) => peval(a.slice(k, n + 1), x);
          const roots = v.M.polyRoots(A).filter((z) => Math.abs(z.im) < 1e-7 && Math.abs(z.re) < 2.2).map((z) => z.re);
          roots.forEach((r) => G.line(r, -0.25, r, 0.25, { color: 'red', width: 2.5 }));
          for (let k = n; k >= f.k; k--) if (k > 0) G.clip(() => G.fn(tail(k), { color: k === f.k ? 'gold' : TAILC[k], width: k === f.k ? 2.6 : 1.4, alpha: k === f.k ? 1 : 0.55 }));
          G.clip(() => G.fn(tail(0), { color: 'ink', width: f.k === 0 ? 3 : 2, alpha: f.k === 0 ? 1 : 0.35 }));
          G.vline(x0, { color: 'accent', width: 1, dash: [3, 4] });
          for (let k = n; k >= f.k; k--) {
            const y = f.b[k], yc = Math.max(-3.9, Math.min(3.9, y)), cur = k === f.k;
            G.dot(x0, yc, { r: cur ? 6 : 4.2, color: cur ? 'gold' : k === 0 ? 'ink' : TAILC[k] });
            if (cur || n - k < 2) G.text(`b${'₀₁₂₃₄₅₆₇₈'[k]}`, x0, yc, { size: 12, weight: 700, color: cur ? 'gold' : 'muted', dx: 9, dy: -7 });
          }
          // tableau
          TT.draw({
            cols: n + 1, colLabels: (j) => `$k=${n - j}$`,
            value: (r, j) => { const k = n - j; return r === 0 ? fx(a[k]) : r === 1 ? (f.pr[k] == null ? '' : fx(f.pr[k])) : f.b[k] == null ? '' : fx(f.b[k]); },
            fill: (r, j) => { const k = n - j; return k === f.k ? ['gold', 0.22] : r === 2 && f.b[k] != null ? (k === 0 ? ['green', 0.25] : ['accent', 0.1]) : null; },
            highlight: [[2, n - f.k, 'gold']],
          });
          // counts
          C.setView([0.5, 16.5], [0, 140]);
          const ds = v.M.range(1, 17);
          C.path(ds.map((d) => [d, d * (d + 1) / 2]), { color: 'red', width: 2 }); C.dots(ds.map((d) => [d, d * (d + 1) / 2]), { r: 2.6, color: 'red' });
          C.path(ds.map((d) => [d, 2 * d - 1]), { color: 'orange', width: 2 }); C.dots(ds.map((d) => [d, 2 * d - 1]), { r: 2.6, color: 'orange' });
          C.path(ds.map((d) => [d, d]), { color: 'green', width: 2 }); C.dots(ds.map((d) => [d, d]), { r: 2.6, color: 'green' });
          C.vline(n, { color: 'gold', width: 1.5, dash: [4, 4] });
          C.text('term by term n(n+1)/2', 11.6, 66, { color: 'red', size: 11, align: 'right', dx: -4 });
          C.text('powers reused 2n − 1', 16.3, 38, { color: 'orange', size: 11, align: 'right' });
          C.text('Horner n', 16.3, 9, { color: 'green', size: 11, align: 'right', dy: -6 });
          C.dot(n, f.mults, { r: 5.5, color: 'gold' });
        });
        v.legend([['ink', '$A = q_0$'], ['gold', 'current tail $q_k$ and $b_k$'], ['red', 'real roots of A', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, x0 = xh.x, f = S.frame, direct = peval(a.slice(0, n + 1), x0);
          let s = `multiplications so far **${f.mults}** of $n = ${n}$ (term by term: ${n * (n + 1) / 2})`;
          if (f.k === 0) {
            const t = 1.7, q = peval(f.b.slice(1), t) * (t - x0) + f.b[0], lhs = peval(a.slice(0, n + 1), t);
            s += ` · $b_0 = ${fx(f.b[0], 5)}$, direct evaluation $A(x_0) = ${fx(direct, 5)}$ ${Math.abs(direct - f.b[0]) < 1e-9 ? '✓' : '✗'} · synthetic division: $(t-x_0)(b_n t^{n-1}+\\dots+b_1)+b_0 = A(t)$ at $t = ${t}$: ${fx(q, 5)} vs ${fx(lhs, 5)} ${Math.abs(q - lhs) < 1e-9 ? '✓' : '✗'}`;
            if (Math.abs(f.b[0]) < 0.02) s += ' · $x_0$ is (almost) a root: the $b$ row is $A(x)/(x-x_0)$';
          }
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Convolution and polynomial multiplication',
      statement: String.raw`The **convolution** of sequences $a=(a_0,\dots,a_{n-1})$ and $b=(b_0,\dots,b_{m-1})$ is the sequence $c=a*b$ of length $n+m-1$ with
$$c_k=\sum_{i+j=k}a_ib_j=\sum_{i=\max(0,k-m+1)}^{\min(k,n-1)}a_i\,b_{k-i}.$$
It is exactly the coefficient sequence of the product of polynomials: if $A(x)=\sum a_ix^i$ and $B(x)=\sum b_jx^j$ then $A(x)B(x)=\sum_k c_kx^k$; it is the finite case of the Cauchy product of series. Computed from the definition it takes $nm$ multiplications, $\Theta(n^2)$ when $m=n$.`,
      idea: String.raw`Expanding $A(x)B(x)$ produces every product $a_ix^i\cdot b_jx^j$ once, and collecting powers groups them by $i+j=k$: in the $n\times m$ table of products these groups are the anti-diagonals. Reversing $b$ and sliding it along $a$ lines up exactly the pairs of one anti-diagonal, so each overlap's dot product is one coefficient $c_k$. The same sum appears for series (the Cauchy product, pma 3.48), for integer multiplication without carries ($x=10$), and for sums of independent random variables.`,
      caption: String.raw`Drag the stems of $a$ (top) and $b$ (middle) up or down to change the coefficients. Step through $k$: $b$ is reversed and shifted so that $b_{k-i}$ sits under $a_i$, the products of the aligned pairs are added, and the sum drops into $c_k$ (bottom). On the right the same products fill the table $a_i b_j$, and step $k$ sums its $k$-th anti-diagonal. The readout checks $A(x)B(x)=C(x)$ at $x=1$ and $x=10$.`,
      deps: ['algo-4.5', 'pma-3.48'],
      refs: ['CLRS 4e §30.1', 'KT §5.6'],
      tags: ['polynomials', 'convolution'],
      viz(v) {
        let a = [2, -1, 3, 1, 0, 0], b = [1, 2, -2, 1, 0, 0], drag = null;
        const nS = v.slider('length of $a$', 2, 6, 4, { int: true, onChange: () => S.reset({ at: 'keep' }) });
        const mS = v.slider('length of $b$', 2, 6, 4, { int: true, onChange: () => S.reset({ at: 'keep' }) });
        const conv = () => { const n = nS.value, m = mS.value, c = Array(n + m - 1).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) c[i + j] += a[i] * b[j]; return c; };
        const frames = () => {
          const n = nS.value, m = mS.value, c = conv(), out = [];
          for (let k = 0; k < n + m - 1; k++) {
            const lo = Math.max(0, k - m + 1), hi = Math.min(k, n - 1), terms = [];
            for (let i = lo; i <= hi; i++) terms.push(`${a[i] < 0 ? `(${mnus(a[i])})` : a[i]}\\cdot${b[k - i] < 0 ? `(${mnus(b[k - i])})` : b[k - i]}`);
            out.push({ k, lo, hi, prods: (k + 1) * 0 + out.reduce((s, q) => s, 0), note: `$c_{${k}} = ${terms.join(' + ')} = ${mnus(c[k])}$ (${hi - lo + 1} product${hi > lo ? 's' : ''})` });
          }
          let cum = 0; out.forEach((q) => { cum += q.hi - q.lo + 1; q.prods = cum; });
          return out;
        };
        const S = v.steps({ frames, speed: 1, start: 3, still: 3 });
        const s = v.stage({ x: [-4, 9], y: [-2.6, 8.6], axes: false, height: 380, weight: 1.35 });
        const Tst = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.9, minWidth: 240, title: 'products $a_ib_j$; anti-diagonals $i+j=k$' });
        const TT = v.table(Tst, { rows: 4, cols: 4, maxCell: 50, size: 14 });
        const YA = 6.6, YB = 3.5, YC = 0, SC = 0.42;
        s.onDrag((x, y, ph) => {
          const n = nS.value, m = mS.value, k = S.frame.k;
          if (ph === 'start') { drag = null; if (y > (YA + YB) / 2 - 0.4) { const i = Math.round(x); if (i >= 0 && i < n && Math.abs(x - i) < 0.45) drag = { arr: a, i, base: YA }; } else if (y > (YB + YC) / 2 + 0.6) { const j = k - Math.round(x); if (j >= 0 && j < m && Math.abs(x - Math.round(x)) < 0.45) drag = { arr: b, i: j, base: YB }; } }
          if ((ph === 'start' || ph === 'move') && drag) { drag.arr[drag.i] = Math.max(-3, Math.min(4, Math.round((y - drag.base) / SC))); S.reset({ at: 'keep' }); }
          if (ph === 'end') drag = null;
        });
        v.render(() => {
          const n = nS.value, m = mS.value, f = S.frame, k = f.k, c = conv(), cmax = Math.max(1, ...c.map(Math.abs)), cs = 2.1 / cmax;
          s.setView([-m + 0.2, n + m - 1.2], [-2.7, 8.6]);
          const stem = (x, base, val, col, sc, a1 = 1, lab) => {
            s.line(x, base, x, base + val * sc, { color: col, width: 3, alpha: a1 });
            s.dot(x, base + val * sc, { r: 5.5, color: col, alpha: a1 });
            if (lab != null) s.text(lab, x, base + val * sc, { align: 'center', size: 11.5, weight: 600, dy: val >= 0 ? -13 : 13, alpha: a1 });
          };
          const xl = -m + 0.35;
          s.text('a', xl, YA + 0.9, { size: 15, math: true, color: 'accent', weight: 700 });
          s.text('b reversed, shifted by k', xl, YB + 1.75, { size: 12, color: 'purple', weight: 600 });
          s.text('c = a ∗ b', xl, YC + 2.45, { size: 12.5, color: 'green', weight: 600 });
          s.line(-m + 0.3, YA, n + m - 1.3, YA, { color: 'faint', width: 1 }); s.line(-m + 0.3, YB, n + m - 1.3, YB, { color: 'faint', width: 1 }); s.line(-m + 0.3, YC, n + m - 1.3, YC, { color: 'faint', width: 1 });
          for (let i = f.lo; i <= f.hi; i++) {
            s.rect(i - 0.42, YB - 1.6, i + 0.42, YA + 1.8, { fill: 'gold', fillAlpha: 0.1, color: 'gold', width: 1, alpha: 0.6 });
            s.text(mnus(a[i] * b[k - i]), i, (YA + YB) / 2 + 0.05, { align: 'center', size: 12, weight: 700, color: 'gold' });
          }
          for (let i = 0; i < n; i++) stem(i, YA, a[i], 'accent', SC, 1, mnus(a[i]));
          for (let j = 0; j < m; j++) { const x = k - j, on = x >= 0 && x < n; stem(x, YB, b[j], 'purple', SC, on ? 1 : 0.45, mnus(b[j])); s.text(`b${'₀₁₂₃₄₅'[j]}`, x, YB - 1.3, { align: 'center', size: 10.5, color: 'purple', alpha: on ? 1 : 0.5 }); }
          for (let i = 0; i < n; i++) s.text(`a${'₀₁₂₃₄₅'[i]}`, i, YA - 1.25, { align: 'center', size: 10.5, color: 'accent' });
          for (let q = 0; q < n + m - 1; q++) {
            const done = q < k, cur = q === k;
            if (done || cur) stem(q, YC, c[q], cur ? 'gold' : 'green', cs, 1, mnus(c[q]));
            else s.dot(q, YC, { r: 3.5, color: 'faint', hollow: true });
            s.text(`c${'₀₁₂₃₄₅₆₇₈₉'[q] || q}`, q, YC - 2.35, { align: 'center', size: 10.5, color: cur ? 'gold' : 'green', alpha: done || cur ? 1 : 0.5 });
          }
          TT.draw({
            rows: n, cols: m, rowLabels: (i) => `$a_{${i}}=${mnus(a[i])}$`, colLabels: (j) => `$b_{${j}}=${mnus(b[j])}$`,
            value: (i, j) => mnus(a[i] * b[j]),
            fill: (i, j) => (i + j === k ? ['gold', 0.35] : i + j < k ? ['green', 0.12] : null),
            highlight: [],
          });
          const hi = []; for (let i = 0; i < n; i++) { const j = k - i; if (j >= 0 && j < m) hi.push([i, j]); }
          if (hi.length > 1) TT.arrow(hi[0], hi[hi.length - 1], { color: 'gold', width: 1.5, dash: [4, 3] });
        });
        v.legend([['accent', '$a$', { dot: true }], ['purple', '$b$ reversed', { dot: true }], ['gold', 'aligned pairs → $c_k$', { area: true }], ['green', 'coefficients done', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, m = mS.value, c = conv(), f = S.frame;
          const ev = (arr, len, x) => arr.slice(0, len).reduceRight((s, q) => s * x + BigInt(q), 0n);
          const A10 = ev(a, n, 10n), B10 = ev(b, m, 10n), C10 = c.reduceRight((s, q) => s * 10n + BigInt(q), 0n);
          const A1 = a.slice(0, n).reduce((s, q) => s + q, 0), B1 = b.slice(0, m).reduce((s, q) => s + q, 0), C1 = c.reduce((s, q) => s + q, 0);
          return `products used so far ${f.prods} of $n\\cdot m = ${n * m}$ · $A(1)B(1) = ${A1}\\cdot${B1} = ${A1 * B1}$, $C(1) = ${C1}$ ${A1 * B1 === C1 ? '✓' : '✗'} · $A(10)B(10) = ${A10}\\cdot${B10} = ${A10 * B10}$, $C(10) = ${C10}$ ${A10 * B10 === C10 ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Complex roots of unity',
      statement: String.raw`An **$n$-th root of unity** is a complex number $\omega$ with $\omega^n=1$. There are exactly $n$ of them, $e^{2\pi ik/n}=\cos\frac{2\pi k}{n}+i\sin\frac{2\pi k}{n}$ for $k=0,\dots,n-1$; they are the vertices of a regular $n$-gon inscribed in the unit circle, with one vertex at $1$. The **principal** root $\omega_n=e^{2\pi i/n}$ generates them all: $\omega_n^0,\omega_n^1,\dots,\omega_n^{n-1}$ are distinct, $\omega_n^{j}\omega_n^{k}=\omega_n^{(j+k)\bmod n}$, so they form a cyclic group of order $n$ under multiplication. For $n\ge2$ the roots sum to $0$.`,
      idea: String.raw`They are the zeros of $z^n-1$, a polynomial of degree $n$, so there are at most $n$; Euler's formula and the periodicity of $e^{iz}$ (pma 8.7) show that the $n$ numbers $e^{2\pi ik/n}$ are distinct zeros. Multiplying by $\omega_n$ rotates the plane by $2\pi/n$, so the powers walk around the polygon and return to $1$ after $n$ steps; a number off the unit circle has powers that spiral in or out and never return. The sum $1+\omega+\dots+\omega^{n-1}$ is unchanged by that rotation, and the only number fixed by a nontrivial rotation is $0$.`,
      caption: String.raw`The background colours $z^n-1$ by its argument; its $n$ zeros are the roots of unity, filled when primitive (they generate all the others). Drag $z$: snapped to a root, its powers $z^0,\dots,z^n$ (gold) step around the polygon and return to $1$; switch snapping off and drag $z$ off the circle to watch the powers spiral away. The slider $k$ marks $z^k$. Right: $1+z+\dots+z^{n-1}$ head to tail; it closes up to $0$ exactly when $z$ is a root of unity other than $1$.`,
      deps: ['pma-8.7'],
      refs: ['CLRS 4e §30.2'],
      tags: ['fft', 'complex numbers'],
      viz(v) {
        const Cx = v.Cx;
        const nS = v.slider('$n$', 2, 16, 8, { int: true, onChange: () => { if (snap.value) { const th = Math.atan2(z.y, z.x), n = nS.value, j = ((Math.round(th / TAU * n) % n) + n) % n; z.set(Math.cos(TAU * j / n), Math.sin(TAU * j / n)); } } });
        const kS = v.slider('power $k$', 0, 16, 3, { int: true });
        const snap = v.toggle('snap $z$ to the $n$-th roots', true);
        const C = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 360, title: 'the zeros of $z^n - 1$' });
        const Sm = v.stage({ x: [-1.3, 3.3], y: [-1.6, 2.4], equal: true, height: 360, title: 'head to tail: $1 + z + z^2 + \\dots + z^{n-1}$' });
        const z = C.handle(Math.cos(TAU / 8), Math.sin(TAU / 8), { color: 'gold', label: 'z', r: 8, constrain: (x, y) => { if (!snap.value) return [x, y]; const n = nS.value, j = ((Math.round(Math.atan2(y, x) / TAU * n) % n) + n) % n; return [Math.cos(TAU * j / n), Math.sin(TAU * j / n)]; } });
        let st = {};
        v.render(() => {
          const n = nS.value, k = kS.value, zc = v.cx(z.x, z.y);
          C.domain((w) => { let p = Cx.ONE || v.cx(1, 0); p = w.pow ? w.pow(n) : w; return p.sub(v.cx(1, 0)); }, { key: 'zn' + n, res: 3, fade: 0.62 });
          C.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          // roots, primitive ones filled
          for (let j = 0; j < n; j++) {
            const x = Math.cos(TAU * j / n), y = Math.sin(TAU * j / n), prim = v.M.gcd(j, n) === 1;
            C.line(0, 0, x, y, { color: 'muted', width: 0.8, alpha: 0.4 });
            C.dot(x, y, prim ? { r: 5.5, color: 'accent' } : { r: 5, color: 'accent', hollow: true, width: 2 });
          }
          C.text('1', 1, 0, { size: 13, weight: 700, dx: 10, dy: -8 });
          C.tex('\\omega_n', Math.cos(TAU / n), Math.sin(TAU / n), { size: 14, color: 'accent', dx: Math.cos(TAU / n) * 18, dy: -Math.sin(TAU / n) * 18 });
          // powers of z
          const pw = []; let p = v.cx(1, 0); for (let j = 0; j <= Math.max(n, k); j++) { pw.push(p); p = p.mul(zc); }
          C.clip(() => {
            C.path(pw.slice(0, n + 1).map((q) => [q.re, q.im]), { color: 'gold', width: 2, alpha: 0.85 });
            pw.slice(1, n + 1).forEach((q) => C.dot(q.re, q.im, { r: 2.6, color: 'gold' }));
          });
          const zk = pw[k];
          if (zk && zk.abs() < 2.4) {
            const th = Math.atan2(zk.im, zk.re), t1 = th < 0 ? th + TAU : th;
            C.curve((t) => [0.32 * Math.cos(t), 0.32 * Math.sin(t)], 0, t1, { color: 'orange', width: 2 });
            C.dot(zk.re, zk.im, { r: 7, color: 'orange', hollow: true, width: 2.5 });
            C.text(`z^${k}`, zk.re, zk.im, { color: 'orange', size: 13, weight: 700, dx: zk.re >= 0 ? 12 : -12, dy: zk.im >= 0 ? -10 : 12, align: zk.re >= 0 ? 'left' : 'right' });
          }
          // head-to-tail sum
          const chain = [[0, 0]]; let sx = 0, sy = 0; for (let j = 0; j < n; j++) { sx += pw[j].re; sy += pw[j].im; chain.push([sx, sy]); }
          const xsC = chain.map((q) => q[0]), ysC = chain.map((q) => q[1]);
          let x0 = Math.min(...xsC), x1 = Math.max(...xsC), y0 = Math.min(...ysC), y1 = Math.max(...ysC);
          const w = Math.max(x1 - x0, y1 - y0, 1.5) * 0.62, cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
          Sm.setView([cxm - w * 1.1, cxm + w * 1.1], [cym - w, cym + w]);
          for (let j = 0; j < n; j++) Sm.arrow(chain[j][0], chain[j][1], chain[j + 1][0], chain[j + 1][1], { color: j === 0 ? 'ink' : 'gold', width: 2, head: 8 });
          const sum = v.cx(sx, sy), closes = sum.abs() < 1e-9;
          Sm.dot(0, 0, { r: 4.5, color: 'ink', label: '0', labelPos: 'sw' });
          Sm.dot(sx, sy, { r: 6, color: closes ? 'green' : 'red' });
          Sm.corner(closes ? 'closes up: the sum is 0' : `ends at ${fx(sx, 3)} ${sy < 0 ? '−' : '+'} ${fx(Math.abs(sy), 3)}i`, 'tl', { color: closes ? 'green' : 'red', weight: 700 });
          const zn = pw[n];
          st = { n, k, zc, zn, sum, closes, phi: v.M.totient(n), r: zc.abs() };
        });
        v.legend([['accent', 'primitive root', { dot: true }], ['gold', 'powers of $z$'], ['orange', '$z^k$', { dot: true }]]);
        v.readout(() => {
          const { n, zc, zn, sum, phi, r } = st, isRoot = Math.abs(zn.re - 1) < 1e-9 && Math.abs(zn.im) < 1e-9;
          return `$|z| = ${fx(r, 3)}$, $\\arg z = ${fx(Math.atan2(zc.im, zc.re) / TAU * 360, 1)}^\\circ$ · $z^{${n}} = ${fx(zn.re, 4)} ${zn.im < 0 ? '-' : '+'} ${fx(Math.abs(zn.im), 4)}i$ ${isRoot ? '$= 1$ ✓ an $n$-th root of unity' : '$\\ne 1$'} · $\\sum_{j<n} z^j = ${fx(sum.re, 4)} ${sum.im < 0 ? '-' : '+'} ${fx(Math.abs(sum.im), 4)}i$ · primitive ${n}-th roots: $\\varphi(${n}) = ${phi}$`;
        });
      },
    },
  ],
};
