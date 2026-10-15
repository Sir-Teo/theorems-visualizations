// Algorithms — Chapter 2 (part b): items 2.8–2.14

const LG = Math.log2;
function tnum(x, sig = 3) {
  if (!isFinite(x)) return '\\infty';
  const a = Math.abs(x);
  if (a >= 1e6) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${m.toFixed(sig - 1)}\\times10^{${e}}`; }
  if (Number.isInteger(x) || a >= 100) return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  return String(+x.toPrecision(sig));
}
const popcount = (n) => { let c = 0; while (n) { c += n & 1; n >>>= 1; } return c; };

// complete a-ary tree drawn level by level (same picture as in ch02.js, kept local)
function treeLevels(s, a, L, x0, x1, ys, o = {}) {
  const cap = o.cap ?? 64, colOf = o.levelColor || (() => 'accent'), levels = [];
  for (let i = 0; i < L; i++) { const cnt = a ** i; levels.push(cnt > cap ? null : Array.from({ length: cnt }, (_, j) => x0 + (j + 0.5) * (x1 - x0) / cnt)); }
  for (let i = 1; i < L; i++) {
    const P = levels[i - 1], C = levels[i];
    if (P && C) C.forEach((x, j) => s.line(P[Math.floor(j / a)], ys(i - 1), x, ys(i), { color: 'muted', width: 1, alpha: 0.55 }));
    else if (P) { const w = (x1 - x0) / P.length; P.forEach((x, j) => s.poly([[x, ys(i - 1)], [x0 + (j + 1) * w, ys(i) + 0.18], [x0 + j * w, ys(i) + 0.18]], { fill: colOf(i), fillAlpha: 0.1, stroke: false })); }
  }
  for (let i = 0; i < L; i++) {
    const C = levels[i], y = ys(i), col = colOf(i);
    if (C) { const slot = Math.abs(s.X(x0 + (x1 - x0) / C.length) - s.X(x0)), r = Math.max(1.6, Math.min(o.r ?? 7, slot * 0.36)); C.forEach((x) => s.dot(x, y, { r, color: col })); }
    else { s.rect(x0, y - 0.18, x1, y + 0.18, { fill: col, fillAlpha: 0.22, color: col, width: 1 }); s.text(`${a ** i} nodes`, (x0 + x1) / 2, y, { align: 'center', size: 11, weight: 600 }); }
  }
}

// ---- 2.13 inversion counting frames
function invFrames(A) {
  const n = A.length, frames = [], order = [], segs = [];
  const snap = (o) => frames.push({ upto: order.length, segs: segs.slice(), ...o });
  snap({ line: 1, note: 'Each arc joins an inverted pair: a larger number to the left of a smaller one. Merge sort will count every arc exactly once.' });
  (function sort(lo, hi, dep) {
    if (hi - lo <= 1) return A.slice(lo, hi).map((v, t) => ({ v, p: lo + t }));
    const mid = lo + Math.ceil((hi - lo) / 2), L = sort(lo, mid, dep + 1), R = sort(mid, hi, dep + 1), cur = [lo, mid, hi, dep];
    let i = 0, j = 0, cnt = 0;
    snap({ cur, line: [2, 3], note: `Merge the sorted halves $[${lo}, ${mid})$ and $[${mid}, ${hi})$: this merge counts exactly the arcs with one end in each half.` });
    while (i < L.length && j < R.length) {
      if (L[i].v <= R[j].v) { i++; continue; }
      const k = L.length - i, b0 = order.length;
      for (let t = i; t < L.length; t++) order.push([L[t].p, R[j].p]);
      cnt += k;
      snap({ cur, batch: [b0, order.length], jump: R[j].p, line: [5, 6], note: `${R[j].v} from the right half is output before the ${k} remaining left-half element${k > 1 ? 's' : ''} (${L.slice(i).map((x) => x.v).join(', ')}), all larger: count **+${k}** in one step.` });
      j++;
    }
    segs.push([lo, hi, dep, cnt]);
    snap({ cur, line: 7, note: `This merge found ${cnt} cross inversion${cnt === 1 ? '' : 's'}.` });
    const out = []; let a = 0, b = 0; while (a < L.length || b < R.length) out.push(b >= R.length || (a < L.length && L[a].v <= R[b].v) ? L[a++] : R[b++]);
    return out;
  })(0, n, 0);
  frames[frames.length - 1].note = `Total: **${order.length}** inversions, counted with $O(n\\lg n)$ work although there can be $\\binom n2$ of them.`;
  return { frames, order };
}

// ---- 2.14 backtracking runs: tree nodes (alive placements) + stubs (pruned tries) + frames
function queensRun(n) {
  const nodes = [{ id: 'R', label: '', t0: 0, tDead: Infinity }], edges = [], stubs = [], frames = [], q = [];
  let found = false, tries = 0;
  frames.push({ q: [], cur: 'R', tries: 0, line: 1, note: 'Empty board. Try the columns of row 1 from left to right.' });
  (function go(r, pid) {
    if (r === n) { found = true; return; }
    for (let c = 0; c < n && !found; c++) {
      tries++;
      let att = -1; for (let i = 0; i < r; i++) if (q[i] === c || Math.abs(q[i] - c) === r - i) { att = i; break; }
      if (att >= 0) { stubs.push({ parent: pid, slot: c, k: n, t: frames.length }); frames.push({ q: q.slice(), tryAt: [r, c], att, cur: pid, tries, line: [3, 4], note: `Row ${r + 1}, column ${c + 1} is attacked by the queen in row ${att + 1}: prune this branch at once.` }); continue; }
      q[r] = c; const id = pid + '.' + c, node = { id, label: String(c + 1), t0: frames.length, tDead: Infinity };
      nodes.push(node); edges.push([pid, id]);
      frames.push({ q: q.slice(), cur: id, tries, line: 5, note: `Row ${r + 1}, column ${c + 1} is safe: place a queen${r + 1 < n ? ` and recurse on row ${r + 2}` : ''}.` });
      go(r + 1, id);
      if (!found) { q.length = r; node.tDead = frames.length; frames.push({ q: q.slice(), cur: pid, tries, line: 7, note: `No column of row ${r + 2} works below this queen: remove it and backtrack.` }); }
    }
  })(0, 'R');
  frames.push({ q: q.slice(), cur: null, sol: true, tries, line: 2, hold: 3, note: `All ${n} rows filled: a solution, after ${tries} tries.` });
  return { nodes, edges, stubs, frames, tries, blind: n ** n };
}
function subsetRun(xs, target) {
  const nodes = [{ id: 'R', label: '0', t0: 0, tDead: Infinity }], edges = [], stubs = [], frames = [], pick = [];
  const total = xs.reduce((a, b) => a + b, 0); let found = false, tries = 0;
  frames.push({ pick: [], sum: 0, cur: 'R', tries: 0, line: 1, note: `Find a subset of ${xs.join(', ')} with sum ${target}. Decide the items one at a time: take it, or leave it.` });
  (function go(i, sum, rest, pid) {
    if (sum === target) { found = true; return; }
    if (i === xs.length) return;
    for (const take of [true, false]) {
      if (found) return;
      tries++;
      const s2 = sum + (take ? xs[i] : 0), r2 = rest - xs[i], p2 = pick.slice(0, i).concat([take]);
      if (s2 > target || s2 + r2 < target) { stubs.push({ parent: pid, slot: take ? 0 : 1, k: 2, t: frames.length }); frames.push({ pick: p2, sum: s2, cur: pid, tries, dead: true, line: [3, 4], note: s2 > target ? `${take ? 'Taking' : 'Leaving'} ${xs[i]}: the sum ${s2} already exceeds ${target}. Prune.` : `${take ? 'Taking' : 'Leaving'} ${xs[i]}: even all the remaining items give only ${s2 + r2} < ${target}. Prune.` }); continue; }
      pick[i] = take; pick.length = i + 1;
      const id = pid + (take ? 'T' : 'F'), node = { id, label: String(s2), t0: frames.length, tDead: Infinity };
      nodes.push(node); edges.push({ from: pid, to: id, side: take ? 'left' : 'right' });
      frames.push({ pick: pick.slice(), sum: s2, cur: id, tries, line: 5, note: `${take ? 'Take' : 'Leave'} ${xs[i]}: partial sum ${s2}.` });
      go(i + 1, s2, r2, id);
      if (!found) { node.tDead = frames.length; pick.length = i; frames.push({ pick: pick.slice(), sum, cur: pid, tries, line: 7, note: `Nothing below works: undo the decision on ${xs[i]}.` }); }
    }
  })(0, 0, total, 'R');
  frames.push({ pick: pick.slice(), sum: found ? target : 0, cur: null, sol: found, tries, line: 2, hold: 3, note: found ? `Sum ${target} reached: ${xs.filter((_, i) => pick[i]).join(' + ')} = ${target}, after ${tries} tries.` : `No subset sums to ${target}; the search proved it after ${tries} tries.` });
  return { nodes, edges, stubs, frames, tries, blind: 2 ** (xs.length + 1) - 2 };
}

export default {
  collection: 'algo',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Lemma',
      name: 'Floors and ceilings do not change the growth rate',
      statement: String.raw`In a divide-and-conquer recurrence, replacing $n/b$ by $\lfloor n/b\rfloor$ or $\lceil n/b\rceil$, or by $\lfloor n/b\rfloor+h(n)$ with a bounded perturbation $|h(n)|\le C$, does not change the order of the solution, provided $f$ grows polynomially. For example
$$T(n)=T(\lceil n/2\rceil)+T(\lfloor n/2\rfloor)+n,\quad T(1)=0$$
has the exact solution $T(n)=n\lceil\lg n\rceil-2^{\lceil\lg n\rceil}+n=\Theta(n\lg n)$, the same order as $T(n)=2T(n/2)+n$; between consecutive powers of two $T(n)/(n\lg n)$ wobbles, but inside a fixed band. A perturbation that grows proportionally to $n$ is not bounded and does change the order.`,
      idea: String.raw`For $n$ between $2^{k-1}$ and $2^k$, monotonicity sandwiches $T(n)$ between $T(2^{k-1})$ and $T(2^k)$, which differ by a constant factor because $f$ is polynomially bounded; so the power-of-two solution of the master theorem (2.7) extends to all $n$. A bounded shift $\lfloor n/2\rfloor+C$ only enlarges the subproblem sizes by $C$, which after $\lg n$ levels changes them by at most a constant factor ($n/2^i+2C$), so the level costs of the recursion tree are perturbed by constant factors. A shift of $\eps n$ changes the branching ratio itself, from $2$ to $1/(\tfrac12+\eps)$.`,
      caption: String.raw`The exact $T(n)$ is computed for every $n\le 4096$ and divided by $n\lg n$; drag the gold point to read off single values. Faint curves are the other variants. Raise the constant shift $s$: the band moves but stays bounded. Raise the proportional shift $\eps$: the ratio climbs without bound.`,
      deps: ['algo-2.7'],
      refs: ['CLRS 4e §4.6'],
      tags: ['recurrences'],
      viz(v) {
        const V = {
          ms: [String.raw`T(\lceil n/2\rceil)+T(\lfloor n/2\rfloor)+n`, (T, n) => T[(n + 1) >> 1] + T[n >> 1] + n],
          fl: [String.raw`2T(\lfloor n/2\rfloor)+n`, (T, n) => 2 * T[n >> 1] + n],
          ce: [String.raw`2T(\lceil n/2\rceil)+n`, (T, n) => 2 * T[(n + 1) >> 1] + n],
          sh: [String.raw`2T(\lfloor n/2\rfloor+s+\lfloor\varepsilon n\rfloor)+n`, null],
        };
        const sel = v.select('$T(n) =$', Object.entries(V).map(([value, x]) => ({ value, label: `$${x[0]}$` })), 'ms', { onChange: () => vis() });
        const sS = v.slider('constant shift $s$', 0, 40, 5, { int: true });
        const eS = v.slider('proportional shift $\\varepsilon$', 0, 0.2, 0, { step: 0.01 });
        const vis = () => { sS.el.hidden = eS.el.hidden = sel.value !== 'sh'; };
        vis();
        const N = 4096;
        const s = v.stage({ x: [2, N], y: [0, 1.6], xlog: true, axes: 'box', height: 340, title: '$T(n)\\,/\\,(n\\lg n)$ for every $n \\le 4096$', xlabel: 'n' });
        const h = s.handle(300, 1, { color: 'gold', constrain: (x) => { const n = Math.round(v.M.clamp(x, 2, N)); return [n, cur ? cur[n] / (n * LG(n)) : 1]; } });
        const solve = (key) => {
          const T = new Float64Array(N + 1), sh = sS.value, ep = eS.value;
          for (let n = 2; n <= N; n++) {
            if (key !== 'sh') { T[n] = V[key][1](T, n); continue; }
            const m = (n >> 1) + sh + Math.floor(ep * n);
            T[n] = m < n ? 2 * T[m] + n : 0;
          }
          return T;
        };
        let cur = null, info = {};
        v.render(() => {
          const T = (cur = solve(sel.value)), R = (n) => T[n] / (n * LG(n));
          let lo = Infinity, hi = -Infinity; for (let n = 64; n <= N; n++) { lo = Math.min(lo, R(n)); hi = Math.max(hi, R(n)); }
          const others = Object.keys(V).filter((k) => k !== sel.value).map((k) => solve(k));
          s.setView([2, N], [0, Math.max(1.4, hi * 1.15)]);
          for (let k = 2; k <= 12; k++) s.vline(2 ** k, { color: 'faint', width: 1, alpha: 0.35 });
          s.hband(lo, hi, { color: 'green', alpha: 0.1, edges: true });
          s.hline(1, { color: 'muted', dash: true, width: 1.2 });
          others.forEach((O) => { const pts = []; for (let n = 2; n <= N; n++) pts.push([n, O[n] / (n * LG(n))]); s.path(pts, { color: 'muted', width: 1, alpha: 0.45 }); });
          const pts = []; for (let n = 2; n <= N; n++) pts.push([n, R(n)]);
          s.path(pts, { color: 'accent', width: 1.6 });
          const n0 = Math.round(h.x); h.y = R(n0);
          s.text('powers of two', 2 ** 11, s.bounds.y[1], { size: 10, color: 'muted', dy: 10, align: 'center' });
          let ok = true; if (sel.value === 'ms') for (let n = 2; n <= N; n++) { const c = Math.ceil(LG(n) - 1e-12); if (T[n] !== n * c - 2 ** c + n) { ok = false; break; } }
          info = { lo, hi, n0, T: T[n0], r: R(n0), ok, r8: R(256), r10: R(1024), r12: R(4096) };
        });
        v.legend([['accent', 'selected recurrence'], ['muted', 'the other variants'], ['green', 'band of the ratio for $n \\ge 64$', { area: true }], ['gold', 'read a value', { dot: true }]]);
        v.readout(() => {
          const { lo, hi, n0, T, r, ok, r8, r10, r12 } = info;
          const drift = r12 / r8 > 1.15 ? ' · **drifting upward: not $\\Theta(n\\lg n)$**' : ' · bounded ✓';
          return `$T(${n0}) = ${tnum(T)}$, ratio ${v.fix(r, 3)} · band over $64\\le n\\le 4096$: [${v.fix(lo, 3)}, ${v.fix(hi, 3)}] · ratio at $2^8, 2^{10}, 2^{12}$: ${v.fix(r8, 3)}, ${v.fix(r10, 3)}, ${v.fix(r12, 3)}${drift}` + (sel.value === 'ms' ? ` · closed form $n\\lceil\\lg n\\rceil-2^{\\lceil\\lg n\\rceil}+n$ matches at every $n$: ${ok ? '✓' : '✗'}` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Akra–Bazzi theorem (statement)',
      statement: String.raw`Let $T(n)=\sum_{i=1}^{k}a_i\,T(b_i n+h_i(n))+f(n)$ for large $n$, with constants $a_i>0$ and $0<b_i<1$, perturbations $|h_i(n)|=O(n/\lg^2 n)$ (floors and ceilings qualify), and $f$ nonnegative with polynomial growth ($f(cn)=\Theta(f(n))$ uniformly for $c$ in any interval $[\phi,1]$). Let $p$ be the unique real number with $\sum_i a_i b_i^{\,p}=1$. Then
$$T(n)=\Theta\!\left(n^p\left(1+\int_1^n\frac{f(u)}{u^{p+1}}\,du\right)\right).$$
For $f(n)=n^d$ this gives $\Theta(n^p)$ if $d<p$, $\Theta(n^p\lg n)$ if $d=p$ and $\Theta(n^d)$ if $d>p$; with one term it contains the master theorem.`,
      idea: String.raw`The function $\phi(p)=\sum a_i b_i^{\,p}$ is continuous and strictly decreasing from $+\infty$ to $0$, so the intermediate value theorem (pma 4.23) gives exactly one root, which bisection finds. The exponent $p$ is chosen so that $n^p$ solves the homogeneous recurrence exactly: $\sum a_i(b_i n)^p=n^p$. The integral (pma 6.1) plays the role of summing the recursion tree level by level (2.6), with the uneven splits handled by the weights $a_ib_i^p$, which sum to $1$ and act like probabilities of following each branch.`,
      caption: String.raw`Set two uneven splits $a_1T(b_1n)+a_2T(b_2n)+n^d$ (default: median of medians, $T(n/5)+T(7n/10)+n$). Left: $\varphi(p)$ with the bisection iterates closing in on its crossing of $1$; the dashed line marks $d$. Right: the exact recurrence (with floors, computed by memoised recursion) divided by the Akra–Bazzi prediction, which levels off.`,
      deps: ['algo-2.7', 'pma-4.23', 'pma-6.1'],
      refs: ['CLRS 4e §4.7'],
      credit: 'Akra & Bazzi, 1998; Leighton, 1996',
      tags: ['recurrences'],
      viz(v) {
        const a1 = v.slider('$a_1$', 0.5, 4, 1, { step: 0.5 }), b1 = v.slider('$b_1$', 0.1, 0.9, 0.2, { step: 0.05 });
        const a2 = v.slider('$a_2$', 0.5, 4, 1, { step: 0.5 }), b2 = v.slider('$b_2$', 0.1, 0.9, 0.7, { step: 0.05 });
        const dS = v.slider('$d$ in $f(n)=n^d$', 0, 3, 1, { step: 0.1 });
        const A = v.stage({ x: [-1, 4], y: [0, 3], axes: 'box', height: 290, title: '$\\varphi(p) = a_1b_1^{\\,p} + a_2b_2^{\\,p}$', xlabel: 'p' });
        const B = v.stage({ x: [10, 1e7], xlog: true, y: [0, 2], axes: 'box', height: 290, title: 'exact $T(n)$ ÷ prediction', xlabel: 'n' });
        let M = {};
        v.render(() => {
          const A1 = a1.value, B1 = b1.value, A2 = a2.value, B2 = b2.value, d = dS.value;
          const phi = (p) => A1 * B1 ** p + A2 * B2 ** p;
          let lo = -30, hi = 30; const its = [];
          for (let t = 0; t < 60; t++) { const m = (lo + hi) / 2; if (t < 12) its.push([m, phi(m) > 1]); if (phi(m) > 1) lo = m; else hi = m; }
          const p = (lo + hi) / 2;
          A.setView([p - 2, p + 2], [0, 3]);
          A.hline(1, { color: 'muted', dash: true, width: 1.2 });
          A.fn(phi, { color: 'accent', width: 2.4 });
          its.forEach(([m, above], t) => { if (m > p - 2 && m < p + 2) A.dot(m, 0.3 + 0.12 * (t % 2), { r: 3, color: 'gold' }); });
          A.vline(p, { color: 'green', width: 2 });
          A.dot(p, 1, { r: 5, color: 'green', label: `p = ${v.fix(p, 4)}`, labelPos: 'ne' });
          if (d > p - 2 && d < p + 2) { A.vline(d, { color: 'orange', dash: true, width: 1.5 }); A.text('d', d, 2.8, { color: 'orange', dx: 5, size: 12, math: true }); }
          // exact T with floors, memoised
          const memo = new Map();
          const T = (n) => { if (n < 2) return 1; let r = memo.get(n); if (r !== undefined) return r; r = A1 * T(Math.floor(B1 * n)) + A2 * T(Math.floor(B2 * n)) + n ** d; memo.set(n, r); return r; };
          // prediction n^p (1 + ∫_1^n u^{d-p-1} du), integral by Simpson in s = ln u
          const I = (n) => v.M.integrate((s) => Math.exp((d - p) * s), 0, Math.log(n), 200);
          const g = (n) => n ** p * (1 + I(n));
          const pts = []; for (let t = 0; t <= 60; t++) { const n = Math.round(10 * 1e6 ** (t / 60)); pts.push([n, T(n) / g(n)]); }
          const qm = Math.max(...pts.map((q) => q[1]));
          B.setView([10, 1e7], [0, qm * 1.25]);
          B.path(pts, { color: 'accent', width: 2 }); B.dots(pts, { r: 2, color: 'accent' });
          const rel = Math.abs(d - p) < 1e-9 ? '=' : d < p ? '<' : '>';
          const order = rel === '<' ? `n^{${v.fix(p, 3)}}` : rel === '=' ? `n^{${v.fix(p, 3)}}\\lg n` : `n^{${v.fix(d, 2)}}`;
          M = { p, ph: phi(p), rel, order, I7: I(1e7), q5: pts[40][1], q7: pts[60][1], memo: memo.size };
        });
        v.legend([['accent', '$\\varphi(p)$ / ratio'], ['gold', 'bisection iterates', { dot: true }], ['green', 'root $p$'], ['orange', '$d$', { dash: true }]]);
        v.readout(() => {
          const { p, ph, rel, order, I7, q5, q7, memo } = M;
          return `$p = ${v.fix(p, 5)}$ with $\\varphi(p) = ${v.fix(ph, 6)}$ · $d ${rel} p$ ⇒ $T(n) = \\Theta(${order})$ · $\\int_1^{10^7} f(u)u^{-p-1}du = ${tnum(I7)}$ · exact/prediction at $10^5$, $10^7$: ${v.fix(q5, 3)}, ${v.fix(q7, 3)} (${memo} distinct subproblems)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Method',
      name: 'Change of variables in recurrences',
      statement: String.raw`A recurrence whose argument shrinks by a power can often be turned into a standard one by substituting $n=2^m$. For $T(n)=2T(\sqrt n)+\lg n$, put $S(m)=T(2^m)$; then
$$S(m)=2S(m/2)+m,$$
so $S(m)=\Theta(m\lg m)$ by the master theorem and $T(n)=\Theta(\lg n\,\lg\lg n)$. Likewise $T(n)=T(\sqrt n)+1$ gives $S(m)=S(m/2)+1$ and $T(n)=\Theta(\lg\lg n)$, and $T(n)=2T(\sqrt n)+1$ gives $T(n)=\Theta(\lg n)$. (Rounding $\sqrt n$ to an integer does not affect the order.)`,
      idea: String.raw`Taking a square root halves the logarithm, so in the variable $m=\lg n$ the problem size halves at each level, exactly as in a divide-and-conquer recurrence. The two recursion trees are the same tree with different labels: the node holding $n^{1/2^i}$ in one holds $m/2^i$ in the other, and the costs agree level by level. The master theorem (2.7) applies to $S$, and translating back is just $m=\lg n$.`,
      caption: String.raw`Choose a recurrence and the depth. Left: the recursion tree of $T$, labelled by sizes $n^{1/2^i}$; right: the tree of $S$, labelled by $m/2^i$; the dashed lines pair up the levels and the middle column shows each level's cost, the same on both sides. Below: $T(n)$ and $S(\lg n)$ computed separately (they coincide) divided by the predicted order.`,
      deps: ['algo-2.7'],
      refs: ['CLRS 4e §4.3'],
      tags: ['recurrences'],
      viz(v) {
        const RS = {
          a: { T: String.raw`2T(\sqrt n)+\lg n`, S: String.raw`2S(m/2)+m`, a: 2, cost: (m) => m, pred: (m) => m * LG(m), ptex: String.raw`\lg n\,\lg\lg n` },
          b: { T: String.raw`T(\sqrt n)+1`, S: String.raw`S(m/2)+1`, a: 1, cost: () => 1, pred: (m) => LG(m), ptex: String.raw`\lg\lg n` },
          c: { T: String.raw`2T(\sqrt n)+1`, S: String.raw`2S(m/2)+1`, a: 2, cost: () => 1, pred: (m) => m, ptex: String.raw`\lg n` },
        };
        const sel = v.select('$T(n) =$', Object.entries(RS).map(([value, r]) => ({ value, label: `$${r.T}$` })), 'a');
        const jS = v.slider('depth: $m = \\lg n = 2^j$, $j$', 1, 6, 4, { int: true });
        const s = v.stage({ x: [0, 100], y: [-5.5, 1], axes: false, height: 330, full: true });
        const P = v.stage({ x: [2, 1000], xlog: true, y: [0, 2], axes: 'box', height: 170, full: true, title: 'computed $T(n)$ and $S(\\lg n)$ ÷ predicted order', xlabel: 'm = lg n' });
        let M = {};
        v.render(() => {
          const r = RS[sel.value], j = jS.value, m = 2 ** j, L = j + 1;
          s.setView([0, 100], [-(L - 0.3), 1.05]);
          s.tex(`T(n) = ${r.T}`, 27, 0.7, { align: 'center', size: 14, color: 'accent' });
          s.tex(`S(m) = ${r.S}`, 73, 0.7, { align: 'center', size: 14, color: 'purple' });
          s.text('level cost', 50, 0.7, { align: 'center', size: 11, color: 'muted' });
          treeLevels(s, r.a, L, 13, 41, (i) => -i, { cap: 32, levelColor: () => 'accent' });
          treeLevels(s, r.a, L, 59, 87, (i) => -i, { cap: 32, levelColor: () => 'purple' });
          for (let i = 0; i < L; i++) {
            const mi = m / 2 ** i, y = -i, c = r.a ** i * (i < L - 1 ? r.cost(mi) : 1);
            s.line(42, y, 58, y, { color: 'faint', dash: [4, 4], width: 1 });
            s.tex(i < L - 1 ? `2^{${mi}}` : `2^{${mi}}\\ (\\text{base})`, 11.5, y, { align: 'right', size: 12, color: 'accent' });
            s.tex(i < L - 1 ? String(mi) : `${mi}\\ (\\text{base})`, 88.5, y, { align: 'left', size: 12, color: 'purple' });
            s.text(String(c), 50, y, { align: 'center', size: 12, weight: 700, color: 'ink', dy: -9 });
          }
          // T on n directly, S on m directly
          const Tn = (n) => (n <= 2 ? 1 : (r.a === 2 ? 2 : 1) * Tn(Math.sqrt(n)) + (sel.value === 'a' ? LG(n) : 1));
          const Sm = (x) => (x <= 1 ? 1 : (r.a === 2 ? 2 : 1) * Sm(x / 2) + (sel.value === 'a' ? x : 1));
          const pts = [], pts2 = []; let err = 0;
          for (let t = 0; t <= 50; t++) { const x = 2 * 500 ** (t / 50), tv = Tn(2 ** x), sv = Sm(x); err = Math.max(err, Math.abs(tv - sv) / sv); pts.push([x, tv / r.pred(x)]); pts2.push([x, sv / r.pred(x)]); }
          const qm = Math.max(...pts.map((q) => q[1]));
          P.setView([2, 1000], [0, qm * 1.25]);
          P.path(pts, { color: 'accent', width: 4, alpha: 0.5 }); P.path(pts2, { color: 'purple', width: 1.6, dash: [5, 4] });
          let tot = 0; for (let i = 0; i < L; i++) tot += r.a ** i * (i < L - 1 ? r.cost(m / 2 ** i) : 1);
          M = { r, m, L, tot, Tm: Tn(2 ** m), err, last: pts[pts.length - 1][1] };
        });
        v.legend([['accent', '$T(n)$, sizes $n^{1/2^i}$'], ['purple', '$S(m)$, sizes $m/2^i$', { dash: true }]]);
        v.readout(() => {
          const { r, m, L, tot, Tm, err, last } = M;
          return `$n = 2^{${m}}$: ${L} levels on both sides, total $T(2^{${m}}) = S(${m}) = ${tnum(tot)}$ (direct recursion on $n$: ${tnum(Tm)}) · $T(n)$ and $S(\\lg n)$ agree to ${err < 1e-12 ? 'rounding' : v.fix(err, 3)} · ratio to $${r.ptex}$ at $\\lg n = 1000$: ${v.fix(last, 3)} ⇒ $T(n) = \\Theta(${r.ptex})$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Linear recurrences with constant coefficients',
      statement: String.raw`Let $a_n=c_1a_{n-1}+c_2a_{n-2}$ for $n\ge 2$, with $c_2\ne 0$, and let $r_1,r_2$ be the roots of the **characteristic polynomial** $x^2-c_1x-c_2$. If $r_1\ne r_2$, then $a_n=\alpha r_1^{\,n}+\beta r_2^{\,n}$; if $r_1=r_2=r$, then $a_n=(\alpha+\beta n)r^n$; the constants are fixed by $a_0,a_1$. Consequently, if one root strictly dominates, $|r_1|>|r_2|$, and $\alpha\ne0$, then $a_{n+1}/a_n\to r_1$ and $a_n=\Theta(|r_1|^n)$. For Fibonacci numbers, $r_{1,2}=(1\pm\sqrt5)/2$, giving Binet's formula $F_n=(\varphi^n-\bar\varphi^{\,n})/\sqrt5$. The same holds for order $k$ with $k$ roots (and powers of $n$ for repeated roots).`,
      idea: String.raw`Solutions form a 2-dimensional vector space (each is determined by $a_0,a_1$). Trying $a_n=x^n$ shows that $x^n$ is a solution exactly when $x^2=c_1x+c_2$, so for distinct roots $r_1^n$ and $r_2^n$ give a basis; for a double root, $nr^n$ is a second solution. Fitting $a_0,a_1$ fixes $\alpha,\beta$, which can be checked by substitution (2.5). The dominant root wins because $(r_2/r_1)^n\to0$ (a geometric sequence).`,
      caption: String.raw`Set $c_1,c_2$ and the initial values. Left: the roots of $x^2=c_1x+c_2$ in the complex plane with the unit circle. Right: the ratio $a_{n+1}/a_n$, which homes in on the dominant root (green line). Make the discriminant negative, or set $c_1=0$, so that $|r_1|=|r_2|$: the ratio never settles.`,
      deps: ['algo-2.4', 'algo-2.5'],
      refs: ['Erickson notes: Solving Recurrences'],
      credit: 'de Moivre, 1730; Binet, 1843',
      tags: ['recurrences'],
      viz(v) {
        const c1 = v.slider('$c_1$', -2, 2, 1, { step: 0.05 }), c2 = v.slider('$c_2$', -2, 2, 1, { step: 0.05 });
        const x0 = v.slider('$a_0$', -2, 2, 0, { step: 0.5 }), x1 = v.slider('$a_1$', -2, 2, 1, { step: 0.5 });
        v.button('Fibonacci', () => { c1.set(1); c2.set(1); x0.set(0); x1.set(1); });
        const C = v.stage({ x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, height: 300, title: 'roots of $x^2 = c_1x + c_2$' });
        const R = v.stage({ x: [0, 30], y: [-3, 3], axes: 'box', height: 300, title: '$a_{n+1}/a_n$', xlabel: 'n' });
        const Cx = v.Cx;
        let M = {};
        v.render(() => {
          const p = c1.value, q = c2.value, D = p * p + 4 * q, sq = Math.sqrt(Math.abs(D));
          const r1 = D >= 0 ? v.cx((p + sq) / 2, 0) : v.cx(p / 2, sq / 2), r2 = D >= 0 ? v.cx((p - sq) / 2, 0) : v.cx(p / 2, -sq / 2);
          const [big, small] = r1.abs() >= r2.abs() ? [r1, r2] : [r2, r1];
          const dom = D > 0 && big.abs() - small.abs() > 1e-9;
          C.circle(0, 0, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          if (dom) C.circle(0, 0, big.abs(), { color: 'green', width: 1, alpha: 0.6 });
          C.dot(r1.re, r1.im, { r: 6, color: 'accent', label: 'r₁', labelPos: D < 0 ? 'ne' : 'n' });
          C.dot(r2.re, r2.im, { r: 6, color: 'orange', label: 'r₂', labelPos: D < 0 ? 'se' : 's' });
          C.corner(D > 0 ? 'two real roots' : Math.abs(D) < 1e-12 ? 'double root' : 'complex pair', 'tl', { color: 'muted' });
          // sequence by iteration
          const a = [x0.value, x1.value]; for (let n = 2; n <= 31; n++) a.push(p * a[n - 1] + q * a[n - 2]);
          // closed form
          let cf = null;
          if (Math.abs(D) < 1e-12) { const r = p / 2; if (Math.abs(r) > 1e-12) { const al = a[0], be = a[1] / r - a[0]; cf = (n) => (al + be * n) * r ** n; } }
          else { const det = r2.sub(r1); const be = v.cx(a[1], 0).sub(r1.scale(a[0])).div(det), al = v.cx(a[0], 0).sub(be); cf = (n) => al.mul(r1.pow(n)).add(be.mul(r2.pow(n))).re; }
          const err = cf ? Math.abs(cf(30) - a[30]) / Math.max(1, Math.abs(a[30])) : NaN;
          const pts = []; for (let n = 0; n < 30; n++) pts.push(Math.abs(a[n]) > 1e-12 ? [n, a[n + 1] / a[n]] : null);
          const lim = dom ? big.re : null;
          R.setView([0, 30], [Math.min(-0.5, (lim ?? 0) - 2), Math.max(2, (lim ?? 0) + 2)]);
          if (lim != null) R.hline(lim, { color: 'green', width: 2, dash: true });
          R.path(pts.map((t) => (t && Math.abs(t[1]) < 50 ? t : null)), { color: 'accent', width: 1.4, alpha: 0.6 });
          pts.forEach((t) => { if (t) R.dot(t[0], v.M.clamp(t[1], R.bounds.y[0], R.bounds.y[1]), { r: 3, color: 'accent' }); });
          M = { r1, r2, D, dom, lim, a30: a[30], err, last: pts[29] ? pts[29][1] : NaN };
        });
        v.legend([['accent', '$a_{n+1}/a_n$', { dot: true }], ['green', 'dominant root', { dash: true }], ['orange', '$r_2$', { dot: true }]]);
        v.readout(() => {
          const { r1, r2, D, dom, lim, a30, err, last } = M;
          const rt = (z) => (Math.abs(z.im) < 1e-12 ? v.fix(z.re, 4) : `${v.fix(z.re, 3)} ${z.im < 0 ? '-' : '+'} ${v.fix(Math.abs(z.im), 3)}i`);
          const roots = `$r_1 = ${rt(r1)}$, $r_2 = ${rt(r2)}$`;
          const conv = dom ? `ratio after 30 steps ${v.fix(last, 6)} → $r_1 = ${v.fix(lim, 6)}$ ✓` : `no dominant root ($|r_1| = |r_2| = ${v.fix(r1.abs(), 3)}$): the ratio does not converge`;
          return `${roots} · closed form vs iteration at $n = 30$: $a_{30} = ${tnum(a30)}$, relative error ${isFinite(err) ? `$${v.sci(err, 1)}$` : '—'} · ${conv}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Algorithm',
      name: 'Exponentiation by repeated squaring',
      statement: String.raw`To compute $x^n$ ($n\ge1$) in any associative multiplication (numbers, residues mod $m$, matrices), use $x^n=(x^{\lfloor n/2\rfloor})^2\cdot x^{\,n\bmod 2}$: scanning the binary digits of $n$ from the top, square for every digit after the first and multiply by $x$ for every further 1-digit. This uses exactly
$$\lfloor\lg n\rfloor+\nu(n)-1$$
multiplications, where $\nu(n)$ is the number of 1s in binary, so between $\lg n$ and $2\lg n$, instead of the $n-1$ of repeated multiplication.`,
      idea: String.raw`The recursion halves the exponent at each call, so $M(n)=M(\lfloor n/2\rfloor)+1+[n\text{ odd}]$, $M(1)=0$ (2.4), which unrolls to one squaring per binary digit after the leading one plus one multiplication per extra 1-digit. Correctness is the invariant that after processing a prefix of the digits the register holds $x^{e}$ with $e$ = that prefix read in binary. The method is not always optimal ($x^{15}$ takes 6 here but 5 via $x^3$), but it is within a factor 2 of the lower bound $\lceil\lg n\rceil$.`,
      caption: String.raw`Choose an exponent and step through: each column is a binary digit of $n$; the register's exponent doubles on a squaring and gains 1 on a multiplication, and the small numbers are the actual values $x^e \bmod 1000$. Below, the multiplication count for every $n$ up to 1023 against $n-1$ (log–log); the gold dot is your $n$.`,
      deps: ['algo-2.1', 'algo-2.4'],
      refs: ['Erickson Ch. 1', 'CLRS 4e §31.6'],
      tags: ['divide and conquer'],
      viz(v) {
        const MOD = 1000;
        const nS = v.slider('exponent $n$', 1, 1023, 45, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const xS = v.slider('base $x$', 2, 9, 3, { int: true, onChange: () => S.reset({ at: 'keep' }) });
        const frames = () => {
          const n = nS.value, x = xS.value, bits = n.toString(2), L = bits.length, cells = [Array(L).fill(null), Array(L).fill(null)], out = [];
          let e = 1, r = x % MOD, mult = 0;
          cells[1][0] = [e, r];
          const snap = (o) => out.push({ cells: cells.map((c) => c.slice()), e, r, mult, L, bits, ...o });
          snap({ cur: [2, 0], line: 2, note: `The leading digit is 1: start with $r = x = x^1$.` });
          for (let i = 1; i < L; i++) {
            e *= 2; r = (r * r) % MOD; mult++; cells[0][i] = [e, r];
            snap({ cur: [1, i], line: [3, 4], note: `Next digit ${bits[i]}: square, $x^{${e / 2}}\\cdot x^{${e / 2}} = x^{${e}}$ (${mult} multiplication${mult > 1 ? 's' : ''} so far).` });
            if (bits[i] === '1') { e += 1; r = (r * x) % MOD; mult++; cells[1][i] = [e, r]; snap({ cur: [2, i], line: 5, note: `The digit is 1: multiply by $x$, giving $x^{${e}}$.` }); }
          }
          out[out.length - 1].note += ` Done: $x^{${n}}$ after **${mult}** multiplications.`;
          return out;
        };
        const S = v.steps({ frames, code: ['Power(x, n):   ▷ $n = (b_{L-1}\\cdots b_0)_2$ with $b_{L-1} = 1$', '  r ← x', '  for i ← L−2 downto 0:', '    r ← r · r        ▷ square', '    if $b_i = 1$:  r ← r · x', '  return r'], codeTitle: 'left-to-right binary method', start: 'end', speed: 2 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 190 });
        const Tb = v.table(ts, { rows: 3, cols: 6, rowLabels: ['bit', 'square', '× x'], maxCell: 58, size: 15, subSize: 10, subColor: 'muted' });
        const ps = v.stage({ x: [2, 1023], y: [1, 1023], xlog: true, ylog: true, axes: 'box', height: 230, title: 'multiplications for every $n \\le 1023$', xlabel: 'n' });
        const counts = []; for (let n = 2; n <= 1023; n++) counts.push([n, Math.floor(LG(n)) + popcount(n) - 1]);
        v.render(() => {
          const f = S.frame, L = f.L, n = nS.value;
          Tb.draw({
            cols: L, colLabels: (j) => `$2^{${L - 1 - j}}$`,
            value: (i, j) => (i === 0 ? f.bits[j] : f.cells[i - 1][j] ? `$x^{${f.cells[i - 1][j][0]}}$` : null),
            sub: (i, j) => (i > 0 && f.cells[i - 1][j] ? String(f.cells[i - 1][j][1]) : null),
            fill: (i, j) => (i === 0 ? (f.bits[j] === '1' ? ['accent', 0.22] : null) : f.cells[i - 1][j] ? [i === 1 ? 'teal' : 'orange', 0.2] : null),
            highlight: f.cur ? [[f.cur[0], f.cur[1], 'gold']] : [],
          });
          ps.fn((x) => x - 1, { color: 'red', width: 2 });
          ps.fn((x) => LG(x), { color: 'muted', dash: [4, 4], width: 1 });
          ps.fn((x) => 2 * LG(x), { color: 'muted', dash: [4, 4], width: 1 });
          ps.dots(counts.filter((c) => c[1] > 0), { r: 1.4, color: 'accent' });
          if (n >= 2) ps.dot(n, counts[n - 2][1], { r: 6, color: 'gold' });
          ps.text('n − 1 (naive)', 60, 59, { color: 'red', size: 11, dx: -8, dy: -10, align: 'right' });
          ps.text('2 lg n', 1000, 2 * LG(1000), { color: 'muted', size: 10, dy: -10, align: 'right' });
          ps.text('lg n', 1000, LG(1000), { color: 'muted', size: 10, dy: 10, align: 'right' });
        });
        v.legend([['teal', 'after squaring', { area: true }], ['orange', 'after × x', { area: true }], ['accent', 'count for each $n$', { dot: true }], ['red', 'naive $n-1$']]);
        v.readout(() => {
          const n = nS.value, x = xS.value, f = S.frame, k = Math.floor(LG(n)), nu = popcount(n), want = v.M.modpow(x, n, MOD);
          return `$n = ${n} = ${n.toString(2)}_2$: $\\lfloor\\lg n\\rfloor + \\nu(n) - 1 = ${k} + ${nu} - 1 = ${k + nu - 1}$ multiplications vs $n - 1 = ${n - 1}$ · register $x^{${f.e}} \\bmod ${MOD} = ${f.r}$` + (S.atEnd ? ` · direct check $${x}^{${n}} \\bmod ${MOD} = ${want}$ ${want === f.r ? '✓' : '✗'}` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Algorithm',
      name: 'Counting inversions by merging',
      statement: String.raw`An **inversion** of a sequence $A[1..n]$ of distinct numbers is a pair $i<j$ with $A[i]>A[j]$; the count measures how far $A$ is from sorted (e.g. how differently two people rank the same items), and can be as large as $\binom n2$. *Sort-and-count* computes it in $O(n\lg n)$ time: count the inversions within each half recursively, and count the **cross** inversions while merging, adding the number of elements still waiting in the left half every time an element of the right half is output.`,
      idea: String.raw`Every inversion lies either inside one half or across the split, so the total is left + right + cross. While merging two sorted halves (2.3), when the head $R[j]$ of the right half is smaller than the head $L[i]$, it is smaller than *all* of $L[i..]$, so it forms exactly $|L|-i$ cross inversions, counted in one step. The work is that of merge sort, $T(n)=2T(n/2)+\Theta(n)=\Theta(n\lg n)$ (2.7); each inversion is counted at exactly one merge, the one where its two ends are first separated.`,
      caption: String.raw`Drag a number sideways to reorder the sequence; every arc is an inverted pair. Step through the merges: each batch (gold) adds all arcs from one right-half element to the left-half elements still waiting, and counted arcs turn green. The bars below are the merges, level by level, with the cross inversions found at each. The final count equals the number of arcs.`,
      deps: ['algo-2.3', 'algo-2.7'],
      refs: ['KT §5.3'],
      tags: ['divide and conquer'],
      viz(v) {
        const rng = v.rng(8);
        let arr = [3, 7, 1, 9, 4, 10, 2, 6, 8, 5], run = invFrames(arr), drag = null;
        const nS = v.slider('n', 4, 14, 10, { int: true, onChange: () => { arr = rng.shuffle(Array.from({ length: nS.value }, (_, i) => i + 1)); S.reset(); } });
        const S = v.steps({ frames: () => (run = invFrames(arr)).frames, code: ['Sort-and-Count(A):', '  split A into halves; count each half recursively', '  merge the halves L and R:', '    if L[i] ≤ R[j]: output L[i]', '    else: output R[j];', '         count += |L| − i    ▷ all of L[i..] exceed R[j]', '  return left + right + cross'], codeTitle: 'counting inversions', speed: 1.5, start: 13, codePos: 'below' });
        v.button('Shuffle', () => { arr = rng.shuffle(arr); S.reset(); });
        v.button('Sorted', () => { arr = arr.slice().sort((a, b) => a - b); S.reset(); });
        v.button('Reversed', () => { arr = arr.slice().sort((a, b) => b - a); S.reset(); });
        const s = v.stage({ x: [-0.7, 9.7], y: [-4, 5.4], axes: false, height: 400 });
        s.onDrag((x, y, ph) => {
          const n = arr.length;
          if (ph === 'start') { const p = Math.round(v.M.clamp(x, 0, n - 1)); drag = { p, x }; }
          else if (ph === 'move' && drag) drag.x = v.M.clamp(x, -0.5, n - 0.5);
          else if (ph === 'end' && drag) { const q = Math.round(v.M.clamp(drag.x, 0, n - 1)), it = arr[drag.p]; if (q !== drag.p) { arr = arr.slice(); arr.splice(drag.p, 1); arr.splice(q, 0, it); drag = null; S.reset(); } drag = null; }
        });
        const brute = (A) => { let c = 0; for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) if (A[i] > A[j]) c++; return c; };
        v.render(() => {
          const n = arr.length, f = S.frame, D = Math.ceil(LG(n)), yl = (d) => -1.1 - d * 0.62;
          s.setView([-0.7, n - 0.3], [yl(D) - 0.5, Math.max(3.2, 0.48 * (n - 1) + 0.9)]);
          const counted = new Map(); run.order.forEach(([p, q], t) => counted.set(p + ':' + q, t));
          const xpos = (p) => (drag && drag.p === p ? drag.x : p);
          for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
            if (arr[p] <= arr[q]) continue;
            const t = counted.get(p + ':' + q), inBatch = f.batch && t >= f.batch[0] && t < f.batch[1], done = t < f.upto && !inBatch;
            const xa = xpos(p), xb = xpos(q), H = 0.48 * Math.abs(xb - xa) + 0.15;
            s.curve((u) => [(xa + xb) / 2 - (xb - xa) / 2 * Math.cos(u), 0.42 + H * Math.sin(u)], 0, Math.PI, { n: 40, color: inBatch ? 'gold' : done ? 'green' : 'red', width: inBatch ? 3 : 1.6, alpha: inBatch || done ? 0.95 : 0.35 });
          }
          const [lo, mid, hi] = f.cur || [-1, -1, -1];
          for (let p = 0; p < n; p++) {
            const inL = p >= lo && p < mid, inR = p >= mid && p < hi, col = f.jump === p ? 'gold' : inL ? 'blue' : inR ? 'purple' : 'muted';
            s.dot(xpos(p), 0, { r: 13, color: col });
            s.text(String(arr[p]), xpos(p), 0, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false });
          }
          // merges level by level
          const all = []; (function seg(a, b, d) { if (b - a > 1) { all.push([a, b, d]); const m = a + Math.ceil((b - a) / 2); seg(a, m, d + 1); seg(m, b, d + 1); } })(0, n, 0);
          const done = new Map(f.segs.map(([a, b, , c]) => [a + ':' + b, c]));
          for (const [a, b, d] of all) {
            const cur = a === lo && b === hi, c = done.get(a + ':' + b);
            s.line(a - 0.35, yl(d), b - 0.65, yl(d), { color: cur ? 'gold' : c != null ? 'green' : 'faint', width: cur ? 5 : 3.5 });
            if (c != null || cur) s.text(cur && c == null ? `+${f.upto - (run.frames.find((g) => g.cur && g.cur[0] === a && g.cur[2] === b)?.upto ?? f.upto)}` : String(c), (a + b - 1) / 2, yl(d), { align: 'center', size: 10.5, weight: 700, color: cur ? 'gold' : 'green', dy: -9 });
          }
        });
        v.legend([['red', 'inversion not yet counted'], ['gold', 'counted in this step'], ['green', 'counted'], ['blue', 'left half', { dot: true }], ['purple', 'right half', { dot: true }]]);
        v.readout(() => { const b = brute(arr), f = S.frame; return `Arcs (pairs checked one by one): **${b}** · counted by merging so far: **${f.upto}**` + (S.atEnd ? ` · final ${run.order.length} ${run.order.length === b ? '✓' : '✗'}` : '') + ` · maximum $\\binom{${arr.length}}{2} = ${arr.length * (arr.length - 1) / 2}$`; });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Method',
      name: 'Backtracking: n queens and subset sum',
      statement: String.raw`**Backtracking** searches a space of partial solutions built one decision at a time. A recursive procedure extends the current partial solution in every possible way; as soon as an extension violates a constraint (or can no longer lead to a solution), that whole subtree of the search tree is abandoned and the last decision is undone. Examples: placing $n$ queens on an $n\times n$ board row by row so that no two attack each other; choosing a subset of positive integers with a prescribed sum, item by item, pruning when the partial sum overshoots or the remaining items cannot reach the target. Backtracking is correct because it explores every branch that could contain a solution, and its cost is the size of the pruned search tree, often far smaller than the $n^n$ or $2^n$ candidates, though still exponential in the worst case.`,
      idea: String.raw`It is divide and conquer (2.1) over choices: the subproblems are "complete this partial solution", one per possible next decision, and the answers are combined by "any of them succeeds". Pruning is sound when the test is monotone: once two queens attack each other, or the partial sum exceeds the target, no extension can repair it, so the discarded subtree contains no solution. The recursion keeps only one path of the tree in memory, so the space is linear in the depth.`,
      caption: String.raw`Step through the search (or play it). For queens: the board on the left, the search tree on the right, where each node is a placed queen labelled by its column; red ticks under a node are tries pruned on the spot, grey nodes are dead ends that were undone, and the green path is the solution. The readout compares the tries with the $n^n$ placements of a blind search. Switch to subset sum and move the target.`,
      deps: ['algo-2.1'],
      refs: ['Erickson Ch. 2'],
      credit: 'Bezzel, 1848 (8 queens); Walker, 1960 (the term)',
      tags: ['recursion', 'search'],
      viz(v) {
        const XS = [8, 6, 7, 5, 3, 10, 9];
        const QCODE = ['PlaceQueens(r):', '  if r = n: report the solution', '  for c ← 1 to n:', '    if some earlier queen attacks (r, c): skip  ▷ prune', '    Q[r] ← c;  PlaceQueens(r + 1)', '    if a solution was found: stop', '    remove the queen from row r  ▷ backtrack'];
        const SCODE = ['Subset(i, sum):', '  if sum = target: report the solution', '  for choice in (take x_i, leave x_i):', '    if sum′ > target or sum′ + rest < target: skip  ▷ prune', '    Subset(i + 1, sum′)', '    if a solution was found: stop', '    undo the choice  ▷ backtrack'];
        const mode = v.select('', [{ value: 'q', label: 'n queens' }, { value: 's', label: 'subset sum' }], 'q', { onChange: () => { nS.el.hidden = mode.value !== 'q'; tS.el.hidden = mode.value !== 's'; S.setCode(mode.value === 'q' ? QCODE : SCODE); S.reset({ at: 'end' }); } });
        const nS = v.slider('board size $n$', 4, 8, 6, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const tS = v.slider('target', 1, 48, 15, { int: true, onChange: () => S.reset({ at: 'end' }) });
        tS.el.hidden = true;
        const B = v.stage({ x: [0, 6], y: [0, 6], equal: true, axes: false, height: 330 });
        const Ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330 });
        const G = v.graph(Ts, { nodes: [], edges: [], layout: 'none', r: 9, draggable: false, fontSize: 10, autoRadius: false });
        let run = null;
        const build = () => {
          run = mode.value === 'q' ? queensRun(nS.value) : subsetRun(XS, tS.value);
          const small = run.nodes.length > 45;
          G.set({ nodes: run.nodes.map((x) => ({ ...x, label: small ? '' : x.label })), edges: run.edges, r: small ? 4.5 : 9 }).layout('tree', { root: 'R' });
          const ys = G.nodes.map((x) => x.y), y0 = Math.min(...ys), y1 = Math.max(...ys);
          if (y1 > y0) for (const x of G.nodes) x.y = 0.1 + 0.8 * (x.y - y0) / (y1 - y0);
          return run.frames;
        };
        const S = v.steps({ frames: build, code: QCODE, codeTitle: 'backtracking', speed: 4, start: 95 });
        v.render(() => {
          const f = S.frame, i = S.i, q = mode.value === 'q';
          // left: board or items
          if (q) {
            const n = nS.value; B.setView([0, n], [0, n]);
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) B.rect(c, n - r - 1, c + 1, n - r, { fill: (r + c) % 2 ? 'muted' : 'faint', fillAlpha: (r + c) % 2 ? 0.25 : 0.12, stroke: false });
            f.q.forEach((c, r) => { B.dot(c + 0.5, n - r - 0.5, { r: Math.min(16, 140 / n), color: f.sol ? 'green' : 'accent' }); B.text('Q', c + 0.5, n - r - 0.5, { align: 'center', size: Math.min(15, 120 / n), weight: 700, color: 'panel', halo: false }); });
            if (f.tryAt) {
              const [r, c] = f.tryAt, ar = f.att;
              B.line(f.q[ar] + 0.5, n - ar - 0.5, c + 0.5, n - r - 0.5, { color: 'red', width: 2.5, dash: [5, 4] });
              B.line(c + 0.2, n - r - 0.8, c + 0.8, n - r - 0.2, { color: 'red', width: 3 }); B.line(c + 0.2, n - r - 0.2, c + 0.8, n - r - 0.8, { color: 'red', width: 3 });
            }
          } else {
            const T = tS.value; B.setView([-0.3, 7.3], [-0.6, 6.6]);
            XS.forEach((x, k) => {
              const st = f.pick[k], col = st === true ? 'green' : st === false ? 'muted' : 'accent';
              B.rect(k + 0.1, 4.6, k + 0.9, 5.6, { fill: col, fillAlpha: st === true ? 0.75 : st === false ? 0.12 : 0.15, color: col, width: 1.5 });
              B.text(String(x), k + 0.5, 5.1, { align: 'center', size: 14, weight: 700, color: st === true ? 'panel' : 'ink', halo: false });
              if (st === false) B.line(k + 0.15, 4.65, k + 0.85, 5.55, { color: 'muted', width: 1.5 });
            });
            const sc = 6.8 / Math.max(T, XS.reduce((a, b) => a + b, 0) / 2);
            B.rect(0.1, 2.2, 0.1 + Math.min(7, f.sum * sc), 3.2, { fill: f.sum > T ? 'red' : f.sol ? 'green' : 'gold', fillAlpha: 0.65, stroke: false });
            B.line(0.1 + T * sc, 1.9, 0.1 + T * sc, 3.5, { color: 'ink', width: 2 });
            B.text(`target ${T}`, 0.1 + T * sc, 3.5, { align: 'center', size: 11, dy: -8 });
            B.text(`sum ${f.sum}`, 0.1, 1.6, { size: 12, weight: 700, color: f.sum > T ? 'red' : 'ink' });
            B.text('items (green = taken, struck out = left)', 0.1, 6.2, { size: 11, color: 'muted' });
          }
          // right: search tree
          for (const nd of G.nodes) nd.hidden = nd.t0 > i;
          const solPath = new Set(); if (f.sol) for (const nd of G.nodes) if (nd.tDead === Infinity) solPath.add(nd.id);
          G.draw({ nodeFill: (id, nd) => (id === f.cur ? 'gold' : solPath.has(id) ? 'green' : nd.tDead <= i ? null : 'accent'), nodeColor: (id, nd) => (nd.tDead <= i ? 'faint' : null), labelColor: (id, nd) => (nd.tDead <= i ? 'muted' : null), edgeColor: (e) => (solPath.has(e.to) ? 'green' : null) });
          const sx = Ts.X(1) - Ts.X(0), sy = Ts.Y(0) - Ts.Y(1), rr = G.nodes.length > 45 ? 4.5 : 9;
          for (const st of run.stubs) {
            if (st.t > i) continue; const pn = G.node(st.parent); if (!pn) continue;
            const ang = (st.k === 2 ? (st.slot ? 0.5 : -0.5) : (st.slot - (st.k - 1) / 2) / st.k * 1.8), len = rr + 9;
            Ts.line(pn.x + Math.sin(ang) * rr / sx, pn.y - Math.cos(ang) * rr / sy, pn.x + Math.sin(ang) * len / sx, pn.y - Math.cos(ang) * len / sy, { color: 'red', width: st.t === i ? 3 : 1.6 });
          }
        });
        v.legend([['gold', 'current', { dot: true }], ['accent', 'on the current path', { dot: true }], ['red', 'pruned try'], ['green', 'solution path', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, q = mode.value === 'q', n = nS.value;
          const alive = G.nodes.filter((x) => x.t0 <= S.i).length - 1;
          return `Tries so far **${f.tries}** (${alive} kept, ${run.stubs.filter((st) => st.t <= S.i).length} pruned on the spot) · whole search: ${run.tries} tries vs ${q ? `$n^n = ${tnum(run.blind)}$ blind placements (one queen per row)` : `$${run.blind}$ nodes of the full decision tree`}`;
        });
      },
    },
  ],
};
