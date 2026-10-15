// Algorithms — Chapter 4 (papers): Cooley & Tukey, "An Algorithm for the Machine Calculation of Complex Fourier Series" (1965)

const TAU = 2 * Math.PI;
// complex numbers as [re, im]
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const Wp = (N, e) => [Math.cos((TAU * e) / N), Math.sin((TAU * e) / N)]; // W^e with the paper's W = e^{2πi/N}
const bits = (x, m) => x.toString(2).padStart(m, '0');
const SUP = (k) => String(k).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
const rev = (x, m) => { let r = 0; for (let b = 0; b < m; b++) if (x & (1 << b)) r |= 1 << (m - 1 - b); return r; };
/** Direct evaluation of the paper's eq. (1): X(j) = Σ_k A(k) W^{jk}. */
function directSum(A) { const N = A.length; return Array.from({ length: N }, (_, j) => A.reduce((s, a, k) => cadd(s, cmul(a, Wp(N, (j * k) % N))), [0, 0])); }
/** Radix-2 arrays A_0 … A_m of the paper's eqs. (19)–(21): in place, natural-order input, bit-reversed output. */
function radix2Stages(A0) {
  const N = A0.length, m = Math.round(Math.log2(N)), out = [A0.map((z) => z.slice())];
  let A = out[0];
  for (let l = 1; l <= m; l++) {
    const h = 1 << (m - l), B = A.map((z) => z.slice()), tw = new Array(N).fill(0);
    for (let p = 0; p < N; p++) {
      if (p & h) continue;
      let J = 0; for (let i = 0; i <= l - 2; i++) if (p & (1 << (m - 1 - i))) J |= 1 << i; // bits j0 … j_{l−2} sit in the high places
      const e = (J << (m - l)) % N, t = cmul(A[p + h], Wp(N, e));
      B[p] = cadd(A[p], t); B[p + h] = csub(A[p], t); tw[p] = e;
    }
    out.push(B); out[l].tw = tw; A = B;
  }
  return out;
}
/** Two-factor algorithm of eqs. (3)–(7): N = r1·r2, j = j1·r1 + j0, k = k1·r2 + k0. */
function twoFactor(A, r1, r2) {
  const N = r1 * r2, A1 = [], X = new Array(N);
  for (let j0 = 0; j0 < r1; j0++) {
    A1.push([]);
    for (let k0 = 0; k0 < r2; k0++) { let s = [0, 0]; for (let k1 = 0; k1 < r1; k1++) s = cadd(s, cmul(A[k1 * r2 + k0], Wp(N, (j0 * k1 * r2) % N))); A1[j0].push(s); }
  }
  for (let j1 = 0; j1 < r2; j1++) for (let j0 = 0; j0 < r1; j0++) {
    let s = [0, 0]; const j = j1 * r1 + j0;
    for (let k0 = 0; k0 < r2; k0++) s = cadd(s, cmul(A1[j0][k0], Wp(N, (j * k0) % N)));
    X[j] = s;
  }
  return { A1, X };
}
/** Sum of prime factors with multiplicity: the paper's T(N)/N for the finest factorization. */
function sopfr(n) { let s = 0; for (let p = 2; p * p <= n; p++) while (n % p === 0) { s += p; n /= p; } return n > 1 ? s + n : s; }
/** Small dial for a complex value: circle of radius R px, needle ∝ |z|·sc. */
function dial(v, s, x, y, z, sc, R, col, st = {}) {
  const X = s.X(x), Y = s.Y(y), c = s.ctx, L = Math.min(1, cabs(z) * sc) * (R - 2), th = Math.atan2(z[1], z[0]);
  c.save();
  c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fillStyle = v.color('panel'); c.fill();
  c.lineWidth = st.ring || 1.2; c.strokeStyle = v.color(st.ringColor || 'faint'); c.stroke();
  if (st.empty) { c.restore(); return; }
  if (L > 0.6) {
    const ex = X + L * Math.cos(th), ey = Y - L * Math.sin(th);
    c.beginPath(); c.moveTo(X, Y); c.lineTo(ex, ey); c.strokeStyle = v.color(col); c.lineWidth = 2; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(ex, ey, 2.2, 0, TAU); c.fillStyle = v.color(col); c.fill();
  } else { c.beginPath(); c.arc(X, Y, 1.5, 0, TAU); c.fillStyle = v.color(col); c.fill(); }
  c.restore();
}
const colMax = (arr) => Math.max(1e-9, ...arr.map(cabs));
const CODE_R2 = [
  'k = Σ k_ν 2^ν,  j = Σ j_ν 2^ν   (binary digits)        ▷ eq. (14)',
  'for l = 1, 2, …, m:',
  '  for every pair of places differing in the 2^(m−l) bit:',
  '    A_l = A_{l−1}(…0…) ± A_{l−1}(…1…) · W^(…)         ▷ eq. (20): 2 operations per output',
  'X(j_{m−1} … j_0) = A_m(j_0 … j_{m−1})   ▷ eq. (22): bits reversed',
];
const CODE_MIX = [
  'j = j₁r₁ + j₀,   k = k₁r₂ + k₀                          ▷ eq. (3)',
  'A₁(j₀, k₀) = Σ_{k₁} A(k₁, k₀) · W^(j₀k₁r₂)         ▷ eq. (6): N·r₁ operations',
  'X(j₁, j₀) = Σ_{k₀} A₁(j₀, k₀) · W^((j₁r₁ + j₀)k₀)   ▷ eq. (7): N·r₂ operations',
  'T = N(r₁ + r₂);  with N = r₁r₂⋯r_m:  T = N(r₁ + ⋯ + r_m)   ▷ eqs. (8)–(9)',
];
// The paper's IBM 7094 timings (three-dimensional 2^a × 2^b × 2^c arrays): [a, b, c, minutes]
// The paper's table of r / log2 r, as printed (two decimals, truncated: 3/log2 3 = 1.893…, 6/log2 6 = 2.321…)
const PAPER_TABLE = ['2.00', '1.88', '2.00', '2.15', '2.31', '2.49', '2.67', '2.82', '3.01'];
const IBM7094 = [[4, 4, 3, 0.02], [11, 0, 0, 0.02], [4, 4, 4, 0.04], [12, 0, 0, 0.07], [5, 4, 4, 0.10], [5, 5, 3, 0.12], [13, 0, 0, 0.13]];

export default {
  collection: 'algo',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Paper',
      name: 'Machine Calculation of Complex Fourier Series',
      paper: { authors: 'James W. Cooley and John W. Tukey', year: 1965, title: 'An Algorithm for the Machine Calculation of Complex Fourier Series', venue: 'Mathematics of Computation 19 (90): 297–301', doi: '10.1090/S0025-5718-1965-0178586-1' },
      introduces: ['algo-4.11', 'sig-8.8', 'nla-10.7'],
      credit: 'J. W. Cooley and J. W. Tukey, 1965 (received August 1964)',
      statement: String.raw`The paper gives an algorithm for the complex Fourier sums $X(j)=\sum_{k=0}^{N-1}A(k)\,W^{jk}$, $j=0,\dots,N-1$, $W=e^{2\pi i/N}$, whose direct evaluation takes $N^2$ "operations" (a complex multiplication followed by a complex addition).

(a) If $N=r_1r_2$, writing $j=j_1r_1+j_0$ and $k=k_1r_2+k_0$ splits the sum into $r_2$ sums of length $r_1$ followed by $r_1$ sums of length $r_2$ (with twiddle factors between them), for $T=N(r_1+r_2)$ operations; repeating the split for $N=r_1r_2\cdots r_m$ gives $T=N(r_1+\dots+r_m)$. With all $r_i=r$ this is $T=rN\log_rN$, so the cost is proportional to $N\log N$ instead of $N^2$.

(b) Per binary digit of $N$ the cost is $r/\log_2 r$, smallest for $r=3$ (1.88), but only about 6% below $r=2$ or $4$ (2.00), which suit binary machines; so one should choose $N$ highly composite.

(c) For $N=2^m$ each step combines pairs of storage locations whose indices differ in one bit, the whole calculation runs in place in the $N$ locations of the data in fewer than $2N\log_2N$ operations, and the results come out with their index bits in reverse order.`,
      idea: String.raw`Fourier sums were computed term by term, so $N^2$ grew too fast for the large records that seismology, crystallography and spectroscopy were producing; Richard Garwin, who wanted to monitor nuclear tests from seismic records, brought Tukey's idea to Cooley at IBM, and the program Cooley wrote for the IBM 7094 transformed $2^{13}=8192$ points in 0.13 minutes. The key observation is that $W^{jk}$ factors when the indices are written in mixed radix, so the $N\times N$ Fourier matrix is a product of $m\approx\log N$ sparse factors (nla-10.7) — an idea present in Good's 1958 "interaction algorithm" and Yates's method for factorial experiments, which the paper cites, and, as was found later, in an unpublished manuscript of Gauss from about 1805. The paper turned the DFT (4.10) into the fast Fourier transform (4.11, sig-8.8): digital spectral analysis, fast convolution and polynomial multiplication (4.13), JPEG, OFDM radio and MRI reconstruction all rest on it. Later work refined the constant, not the order: a radix-2 butterfly needs one complex multiplication for its two outputs, so $\tfrac N2\log_2 N$ multiplications suffice, and split-radix and other variants cut the real arithmetic further; whether $N\log N$ itself can be beaten is still open.`,
      caption: String.raw`**Radix 2** (choose $N=8$ or $16$): step through the paper's in-place network. Each dial is a complex value (needle = modulus and phase, scaled per column); at each stage the gold butterflies combine places whose binary indices differ in one bit, and the last column reads the results back in natural order along the bit-reversal wires. **Two factors**: the data are laid out as an $r_1\times r_2$ array by $k=k_1r_2+k_0$; step 1 transforms the columns, step 2 twists and transforms the rows, and the output comes out transposed. Bottom left: operations against $N$ — red the direct sum $N^2$, blue the paper's radix-2 count $2N\log_2N$, and one grey dot for every $N\le 4096$ at its best factorization, $T=N\cdot(\text{sum of prime factors})$: primes sit on the red line. Bottom right: the paper's own table of $r/\log_2 r$, labelled with its printed values (which are truncated: $3/\log_2 3 = 1.893\ldots$ appears as 1.88). The readout checks every result against the direct sum and uses the paper's IBM 7094 timing table.`,
      deps: ['algo-4.10', 'algo-4.8'],
      see: ['algo-4.14', 'algo-4.13', 'algo-4.12'],
      refs: [],
      tags: ['fft', 'divide and conquer', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm' },
      viz(v) {
        const M = v.M;
        const mode = v.select('algorithm', [{ value: 'r2', label: 'radix 2 (eq. 20)' }, { value: 'mix', label: 'two factors (eqs. 6–7)' }], 'r2', { onChange: () => { syncCtl(); S.setCode(mode.value === 'r2' ? CODE_R2 : CODE_MIX, mode.value === 'r2' ? 'N = 2^m, in place' : 'N = r₁ r₂'); S.reset(undefined, { at: 2 }); } });
        const Nsel = v.select('$N$', [{ value: 8, label: '8' }, { value: 16, label: '16' }], 16, { onChange: () => S.reset(undefined, { at: 2 }) });
        const fac = v.select('$N = r_1 \\times r_2$', [{ value: '3x4', label: '3 × 4' }, { value: '4x3', label: '4 × 3' }, { value: '3x5', label: '3 × 5' }, { value: '4x4', label: '4 × 4' }], '3x4', { onChange: () => S.reset(undefined, { at: 2 }) });
        const sig = v.select('signal', [{ value: 'tones', label: 'two tones' }, { value: 'impulse', label: 'impulse' }, { value: 'square', label: 'square' }, { value: 'random', label: 'random' }], 'tones', { onChange: () => S.reset({ at: 'keep' }) });
        let seed = 5;
        v.button('New random signal', () => { seed++; sig.set('random'); S.reset({ at: 'keep' }); });
        const syncCtl = () => { Nsel.el.hidden = mode.value !== 'r2'; fac.el.hidden = mode.value === 'r2'; };
        syncCtl();
        const dims = () => (mode.value === 'r2' ? { N: +Nsel.value } : (([a, b]) => ({ N: a * b, r1: a, r2: b }))(fac.value.split('x').map(Number)));
        const signal = (N) => {
          const r = v.rng(seed * 13 + N);
          return Array.from({ length: N }, (_, k) => {
            if (sig.value === 'impulse') return [k === 1 ? 1 : 0, 0];
            if (sig.value === 'square') return [k < N / 2 ? 1 : -0.6, 0];
            if (sig.value === 'random') return [r.normal(), 0];
            return [Math.cos((TAU * k) / N) + 0.7 * Math.cos((TAU * 3 * k) / N + 0.6), 0];
          });
        };
        const frames = () => {
          const d = dims();
          if (mode.value === 'r2') {
            const m = Math.round(Math.log2(d.N)), F = [{ stage: 0, line: 1, ops: 0, note: `$N = ${d.N} = 2^${m}$: the data $A(k)$ sit in natural order in ${d.N} storage locations.` }];
            for (let l = 1; l <= m; l++) F.push({ stage: l, line: [2, 3, 4], ops: 2 * d.N * l, note: `Stage ${l}: pairs of places whose indices differ in the $2^{${m - l}} = ${1 << (m - l)}$ bit are combined — ${d.N / 2} butterflies, $2N = ${2 * d.N}$ operations in the paper's count.` });
            F.push({ stage: m + 1, line: 5, ops: 2 * d.N * m, note: `Done in place after ${m} stages: $X(j)$ is found at the location whose index is $j$ with its ${m} bits reversed.` });
            return F;
          }
          return [
            { phase: 0, line: 1, ops: 0, note: `$N = ${d.N} = ${d.r1}\\cdot${d.r2}$: lay $A(k)$ out as a ${d.r1} × ${d.r2} array, row $k_1$ and column $k_0$ with $k = k_1\\cdot${d.r2} + k_0$.` },
            { phase: 1, line: 2, ops: d.N * d.r1, note: `Step 1 (eq. 6): every column is summed against $W^{j_0k_1r_2}$ — ${d.r2} transforms of length ${d.r1}, $N r_1 = ${d.N * d.r1}$ operations.` },
            { phase: 2, line: 3, ops: d.N * (d.r1 + d.r2), note: `Step 2 (eq. 7): every row is multiplied by the twiddles $W^{j_0k_0}$ and summed — ${d.r1} transforms of length ${d.r2}, $N r_2 = ${d.N * d.r2}$ more operations.` },
            { phase: 3, line: 4, ops: d.N * (d.r1 + d.r2), note: `Read the result column by column: $X(j)$ with $j = j_1\\cdot${d.r1} + j_0$. Total $T = N(r_1 + r_2) = ${d.N * (d.r1 + d.r2)}$ against $N^2 = ${d.N * d.N}$.` },
          ];
        };
        const S = v.steps({ frames, code: CODE_R2, codeTitle: 'N = 2^m, in place', codePos: 'below', speed: 1.2, start: 2, still: 2 });
        const G = v.stage({ x: [0, 10], y: [-17, 1], axes: false, height: 390, full: true });
        const P = v.stage({ x: [2, 16384], y: [2, 3e8], xlog: true, ylog: true, axes: 'box', height: 270, weight: 1.3, xlabel: 'N', title: 'operations to compute all $N$ sums' });
        const Tb = v.stage({ x: [1.3, 10.7], y: [-0.32, 3.5], axes: 'box', height: 270, weight: 1, xticks: [2, 3, 4, 5, 6, 7, 8, 9, 10], title: 'the paper’s table: $r/\\log_2 r$ for radix $r$' });
        const allT = []; for (let n = 2; n <= 4096; n++) allT.push([n, n * sopfr(n)]);
        let last = { err: 0, N: 16, T: 0 };
        v.render(() => {
          const f = S.frame, d = dims(), N = d.N, A = signal(N), Xd = directSum(A);
          if (mode.value === 'r2') {
            const m = Math.round(Math.log2(N)), St = radix2Stages(A), cur = f.stage ?? 0;
            const nc = m + 2; G.setView([-1.7, nc - 1 + 1.4], [-N + 0.35, 1.15]);
            const rowPx = G.height / (N + 0.8), R = Math.max(5, Math.min(12, rowPx * 0.4)), yOf = (p) => -p;
            // wires
            for (let l = 1; l <= m; l++) {
              const h = 1 << (m - l), done = l <= cur, now = l === cur;
              for (let p = 0; p < N; p++) {
                if (p & h) continue;
                const col = now ? 'gold' : done ? 'muted' : 'faint', w = now ? 2 : 1.2;
                G.line(l - 1, yOf(p), l, yOf(p), { color: col, width: w }); G.line(l - 1, yOf(p + h), l, yOf(p + h), { color: col, width: w });
                G.line(l - 1, yOf(p), l, yOf(p + h), { color: col, width: w }); G.line(l - 1, yOf(p + h), l, yOf(p), { color: col, width: w });
                if (now && N <= 16) { const e = St[l].tw[p]; if (e) G.text('W' + SUP(e), l - 0.5, yOf(p + h), { size: 10, color: 'gold', align: 'center', baseline: 'bottom', dy: -3 }); }
              }
            }
            // bit-reversal wires to natural order
            const reord = cur >= m + 1;
            for (let j = 0; j < N; j++) G.line(m, yOf(rev(j, m)), m + 1, yOf(j), { color: reord ? 'green' : 'faint', width: reord ? 1.6 : 1, dash: reord ? null : [3, 4] });
            // dials
            for (let c = 0; c <= m + 1; c++) {
              const arr = c <= m ? St[c] : Array.from({ length: N }, (_, j) => St[m][rev(j, m)]), sc = 1 / colMax(arr), shown = c <= cur;
              for (let p = 0; p < N; p++) dial(v, G, c, yOf(p), arr[p], sc, R, c === 0 ? 'blue' : c === m + 1 ? 'green' : 'purple', { empty: !shown, ringColor: shown ? (c === cur ? 'gold' : 'muted') : 'faint', ring: c === cur ? 2 : 1.2 });
            }
            for (let p = 0; p < N; p++) {
              G.text(`${p}  ${bits(p, m)}`, -0.42, yOf(p), { align: 'right', size: N > 8 ? 10 : 11.5, color: 'blue' });
              G.text(`${bits(p, m)}  ${p}`, m + 1.42, yOf(p), { align: 'left', size: N > 8 ? 10 : 11.5, color: 'green' });
            }
            G.text('k', -1.15, 0.72, { size: 13, color: 'blue', math: true, align: 'center' });
            G.text('j', m + 2.0, 0.72, { size: 13, color: 'green', math: true, align: 'center' });
            for (let c = 0; c <= m; c++) G.text(c === 0 ? 'A = A₀' : `A${'₀₁₂₃₄₅'[c]}`, c, 0.72, { size: 11, color: c === cur ? 'gold' : 'muted', align: 'center', weight: c === cur ? 700 : 500 });
            G.text('X', m + 1, 0.72, { size: 13, color: 'green', math: true, align: 'center' });
            let err = 0; for (let j = 0; j < N; j++) err = Math.max(err, cabs(csub(St[m][rev(j, m)], Xd[j])));
            last = { err, N, T: 2 * N * m, fac: `2^${m}`, rs: [2] };
          } else {
            const { r1, r2 } = d, { A1, X } = twoFactor(A, r1, r2), ph = f.phase ?? 0, gap = 2.2, W = r2;
            const x0s = [0, W + gap, 2 * (W + gap)];
            G.setView([-1.3, 3 * W + 2 * gap + 1.1], [-r1 - 1.25, 1.6]);
            const cellPx = Math.min(G.X(1) - G.X(0), G.Y(0) - G.Y(1)), R = Math.max(6, Math.min(17, cellPx * 0.36));
            const grids = [
              { val: (i, c) => A[i * r2 + c], lab: (i, c) => `k=${i * r2 + c}`, col: 'blue', title: 'A(k₁, k₀)', rows: 'k₁', cols: 'k₀', on: true },
              { val: (i, c) => A1[i][c], lab: null, col: 'purple', title: 'A₁(j₀, k₀)', rows: 'j₀', cols: 'k₀', on: ph >= 1 },
              { val: (i, c) => X[c * r1 + i], lab: (i, c) => `j=${c * r1 + i}`, col: 'green', title: 'X(j₁ r₁ + j₀)', rows: 'j₀', cols: 'j₁', on: ph >= 2 },
            ];
            grids.forEach((g, gi) => {
              const x0 = x0s[gi], vals = []; for (let i = 0; i < r1; i++) for (let c = 0; c < r2; c++) vals.push(g.val(i, c));
              const sc = 1 / colMax(vals);
              G.rect(x0, -r1, x0 + r2, 0, { color: g.on ? g.col : 'faint', width: 1.4, fill: g.col, fillAlpha: g.on ? 0.05 : 0 });
              for (let i = 0; i < r1; i++) for (let c = 0; c < r2; c++) {
                const cx = x0 + c + 0.5, cy = -i - 0.5;
                dial(v, G, cx, cy, g.val(i, c), sc, R, g.col, { empty: !g.on, ringColor: g.on ? 'muted' : 'faint' });
                if (g.lab && g.on && R >= 9) G.text(g.lab(i, c), cx, cy - 0.5 + 0.02, { size: 9, color: 'muted', align: 'center', baseline: 'bottom', dy: -1 });
              }
              G.text(g.title, x0 + r2 / 2, 1.05, { size: 12.5, color: g.on ? g.col : 'faint', align: 'center', weight: 600 });
              for (let i = 0; i < r1; i++) G.text(String(i), x0 - 0.2, -i - 0.5, { size: 10.5, color: 'muted', align: 'right' });
              for (let c = 0; c < r2; c++) G.text(String(c), x0 + c + 0.5, 0.32, { size: 10.5, color: 'muted', align: 'center' });
              G.text(g.rows + ' ↓', x0 - 0.2, 0.32, { size: 10.5, color: 'muted', align: 'right' });
              G.text(g.cols + ' →', x0 + r2 + 0.1, 0.32, { size: 10.5, color: 'muted', align: 'left' });
            });
            // the two steps
            const arrowY = -r1 / 2, st1 = ph === 1, st2 = ph === 2;
            G.arrow(x0s[0] + r2 + 0.35, arrowY, x0s[1] - 0.45, arrowY, { color: st1 ? 'gold' : ph > 1 ? 'muted' : 'faint', width: st1 ? 2.4 : 1.4, head: 8 });
            G.arrow(x0s[1] + r2 + 0.35, arrowY, x0s[2] - 0.45, arrowY, { color: st2 ? 'gold' : ph > 2 ? 'muted' : 'faint', width: st2 ? 2.4 : 1.4, head: 8 });
            G.text(`step 1: ${r2} columns`, (x0s[0] + r2 + x0s[1]) / 2, -r1 - 0.5, { size: 10.5, color: st1 ? 'gold' : 'muted', align: 'center' });
            G.text(`length ${r1} each`, (x0s[0] + r2 + x0s[1]) / 2, -r1 - 0.9, { size: 10.5, color: st1 ? 'gold' : 'muted', align: 'center' });
            G.text(`step 2: ${r1} rows`, (x0s[1] + r2 + x0s[2]) / 2, -r1 - 0.5, { size: 10.5, color: st2 ? 'gold' : 'muted', align: 'center' });
            G.text(`twiddle, length ${r2}`, (x0s[1] + r2 + x0s[2]) / 2, -r1 - 0.9, { size: 10.5, color: st2 ? 'gold' : 'muted', align: 'center' });
            if (st1) for (let c = 0; c < r2; c++) G.rect(x0s[0] + c + 0.06, -r1 + 0.06, x0s[0] + c + 0.94, -0.06, { color: 'gold', width: 1.8, dash: [4, 3] });
            if (st2) for (let i = 0; i < r1; i++) G.rect(x0s[1] + 0.06, -i - 0.94, x0s[1] + r2 - 0.06, -i - 0.06, { color: 'gold', width: 1.8, dash: [4, 3] });
            if (ph === 3) { // natural order: row by row in the input, column by column in the output
              const pin = [], pout = [];
              for (let k = 0; k < r1 * r2; k++) pin.push([x0s[0] + (k % r2) + 0.5, -Math.floor(k / r2) - 0.5]);
              for (let j = 0; j < r1 * r2; j++) pout.push([x0s[2] + Math.floor(j / r1) + 0.5, -(j % r1) - 0.5]);
              G.path(pin, { color: 'blue', width: 1.6, alpha: 0.55 }); G.path(pout, { color: 'green', width: 1.6, alpha: 0.7 });
              G.text('natural order k: along rows', x0s[0] + r2 / 2, -r1 - 0.55, { size: 10.5, color: 'blue', align: 'center' });
              G.text('natural order j: down columns', x0s[2] + r2 / 2, -r1 - 0.55, { size: 10.5, color: 'green', align: 'center' });
            }
            let err = 0; for (let j = 0; j < N; j++) err = Math.max(err, cabs(csub(X[j], Xd[j])));
            last = { err, N, T: N * (r1 + r2), fac: `${r1}·${r2}`, rs: [r1, r2] };
          }
          // ---- operation counts
          const xs = [2, 16384];
          P.dots(allT, { r: 1.3, color: 'muted', alpha: 0.45 });
          P.fn((x) => x * x, { domain: xs, color: 'red', width: 2 });
          P.fn((x) => 2 * x * Math.log2(x), { domain: xs, color: 'blue', width: 2 });
          P.dot(last.N, last.N * last.N, { r: 5.5, hollow: true, color: 'red', width: 2 });
          P.dot(last.N, last.T, { r: 6.5, color: 'gold' });
          P.text('N²', 3000, 3000 * 3000 * 2.2, { size: 12, color: 'red', align: 'center' });
          P.text('2N log₂ N', 9000, 2 * 9000 * Math.log2(9000) * 0.28, { size: 11.5, color: 'blue', align: 'center' });
          // ---- the paper's table
          for (let r = 2; r <= 10; r++) {
            const val = r / Math.log2(r), used = last.rs.includes(r), best = r === 3;
            Tb.rect(r - 0.36, 0, r + 0.36, val, { fill: best ? 'green' : 'accent', fillAlpha: best ? 0.55 : 0.3, color: used ? 'gold' : best ? 'green' : 'accent', width: used ? 2.6 : 1.2 });
            Tb.text(PAPER_TABLE[r - 2], r, val + 0.18, { size: 10.5, color: best ? 'green' : 'ink', align: 'center' });
          }
          Tb.hline(2, { color: 'muted', width: 1, dash: [4, 4] });
        });
        v.legend([['red', 'direct sum $N^2$'], ['blue', 'radix 2: $2N\\log_2 N$'], ['muted', 'every $N$ at its best factorization', { dot: true }], ['gold', 'the case shown', { dot: true }]]);
        v.readout(() => {
          const N = last.N, sp = (N * N) / last.T, t13 = IBM7094.find((r) => r[0] === 13)[3], n13 = 8192, ratio13 = (n13 * n13) / (2 * n13 * 13);
          return `$N = ${N} = ${last.fac}$: the paper's count $T = ${last.T}$ operations against $N^2 = ${N * N}$ (${v.fix(sp, 2)}× fewer) · largest difference from the direct sum $${v.sci(Math.max(last.err, 1e-17), 2)}$ (rounding only) · IBM 7094, 1964 (the paper's table): $2^{13} = 8192$ points in 0.13 min; at the same cost per operation the direct sum, $${v.sci(n13 * n13, 2)}$ operations instead of $2N\\log_2N = ${v.sci(2 * n13 * 13, 2)}$, would have taken about ${Math.round(t13 * ratio13)} min (our extrapolation)` + (mode.value === 'r2' ? ` · a modern radix-2 butterfly shares one multiplication between its two outputs: $\\tfrac N2\\log_2N = ${(N / 2) * Math.round(Math.log2(N))}$ complex multiplications` : '');
        });
      },
    },
  ],
};
