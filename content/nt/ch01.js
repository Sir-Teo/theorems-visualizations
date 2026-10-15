// Number Theory — Chapter 1: Divisibility and primes
// Part 1 (this file): division with remainder, gcd, Euclid's algorithm, Bézout, Euclid's lemma, unique factorization
// and a monoid where it fails (1.1–1.7). Part 2 (ch01-b.js): infinitely many primes, the sieve, Fermat numbers,
// prime gaps, linear Diophantine equations and the coin problem (1.8–1.14).

// ---------- shared helpers ----------
const PALETTE = ['blue', 'teal', 'purple', 'orange', 'pink', 'gold', 'green', 'red'];
/** Rounded rectangle in pixel coordinates (stage S), filled and/or stroked with palette colours. */
function rbox(v, S, X, Y, W, H, r, st = {}) {
  const c = S.ctx; c.save(); c.beginPath();
  if (c.roundRect) c.roundRect(X, Y, W, H, r); else c.rect(X, Y, W, H);
  if (st.fill) { c.fillStyle = v.color(st.fill, st.fillAlpha ?? 1); c.fill(); }
  if (st.stroke) { c.lineWidth = st.width ?? 1.5; c.strokeStyle = v.color(st.stroke, st.alpha ?? 1); c.setLineDash(st.dash || []); c.stroke(); }
  c.restore();
}
/** Disc of pixel radius r centred at pixel (X, Y): opaque panel underneath, then a tint and an outline. */
function pdisc(v, S, X, Y, r, st = {}) {
  const c = S.ctx; c.save(); c.beginPath(); c.arc(X, Y, r, 0, 2 * Math.PI);
  if (st.base !== false) { c.fillStyle = v.color('panel'); c.fill(); }
  if (st.fill) { c.fillStyle = v.color(st.fill, st.fillAlpha ?? 0.25); c.fill(); }
  if (st.stroke) { c.lineWidth = st.width ?? 1.6; c.strokeStyle = v.color(st.stroke, st.alpha ?? 1); c.setLineDash(st.dash || []); c.stroke(); }
  c.restore();
}
/** Prime factorisation as TeX, e.g. 360 → 2^{3}\cdot 3^{2}\cdot 5 (works for Numbers and BigInts). */
function facTex(M, n) {
  if (n == 1) return '1';
  return M.factor(n).map(([p, e]) => (Number(e) > 1 ? `${p}^{${e}}` : `${p}`)).join('\\cdot ');
}
/** a·s + b·t written as TeX with tidy signs: lin(3, 52, -7, 22) → "3\cdot 52 - 7\cdot 22". */
function lin(s, A, t, B) {
  const first = s === 1 ? `${A}` : s === -1 ? `-${A}` : `${s}\\cdot ${A}`;
  if (t === 0) return first;
  const at = Math.abs(t), sec = at === 1 ? `${B}` : `${at}\\cdot ${B}`;
  return s === 0 ? (t < 0 ? `-${sec}` : sec) : `${first} ${t < 0 ? '-' : '+'} ${sec}`;
}
/** Wrap a negative number in parentheses for products: par(-7) → "(-7)". */
const par = (x) => (x < 0 ? `(${x})` : `${x}`);
/** Divisors of n (n ≥ 1), ascending. */
function divisorsOf(n) { const lo = [], hi = []; for (let d = 1; d * d <= n; d++) if (n % d === 0) { lo.push(d); if (d * d !== n) hi.unshift(n / d); } return lo.concat(hi); }
/** Extended Euclid as a table: rows {r, q, x, y} with r = a·x + b·y, ending with the row r = 0. */
function extRows(a, b) {
  const rows = [{ r: a, q: null, x: 1, y: 0 }, { r: b, q: null, x: 0, y: 1 }];
  while (rows[rows.length - 1].r !== 0) {
    const P = rows[rows.length - 2], Q = rows[rows.length - 1], q = Math.floor(P.r / Q.r);
    Q.q = q; rows.push({ r: P.r - q * Q.r, q: null, x: P.x - q * Q.x, y: P.y - q * Q.y });
  }
  return rows;
}

export default {
  collection: 'nt',
  chapter: 1,
  title: 'Divisibility and primes',
  summary: String.raw`Division with remainder leads to the greatest common divisor, to Euclid’s algorithm and to Bézout’s identity, and from these to Euclid’s lemma and unique factorization into primes — a theorem, not a triviality, as simple multiplicative monoids where it fails show. There are infinitely many primes (Euclid’s product-plus-one, the variant for primes $\equiv 3 \pmod 4$, the pairwise coprime Fermat numbers), the sieve of Eratosthenes finds them, and yet there are arbitrarily long stretches without any. Linear Diophantine equations and the Frobenius coin problem are the first applications.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Divisibility and the division algorithm',
      statement: String.raw`For integers $a$ and $b$, $b$ *divides* $a$, written $b\mid a$, if $a=bk$ for some integer $k$; then $b$ is a *divisor* of $a$ and $a$ is a *multiple* of $b$. Otherwise we write $b\nmid a$.

**Division algorithm.** For every integer $a$ and every integer $b\ge1$ there is exactly one pair of integers $(q,r)$ with
$$a=qb+r,\qquad 0\le r<b .$$
The *quotient* is $q=\lfloor a/b\rfloor$ and $r$, the *remainder*, is written $a \bmod b$. In particular $b\mid a$ exactly when $r=0$.`,
      idea: String.raw`Among the multiples of $b$ that do not exceed $a$, take the largest one, $qb$ — it exists because the multiples of $b$ are spaced $b$ apart and unbounded in both directions (this is the well-ordering of $\N$, applied to the set of nonnegative numbers $a-kb$). Then $r=a-qb\ge0$, and $r<b$, since otherwise $(q+1)b$ would still not exceed $a$. Two admissible remainders differ by a multiple of $b$ and both lie in $[0,b)$, so they coincide: that is uniqueness. The normalisation $0\le r$ matters — allow $|r|<b$ instead and, whenever $b\nmid a$, both $r$ and $r-b$ qualify.`,
      caption: String.raw`Set $a$ and $b$ with the sliders, or click a cell of the table. The bar of length $a$ is cut into $q$ whole blocks of length $b$; the gold leftover is the remainder, always shorter than one block (for negative $a$ the blocks overshoot to $qb\le a$ and the remainder climbs back up to $a$). The table shades $a \bmod b$ for every pair, and its green cells are exactly the pairs with $b\mid a$. Switch on *drop $0\le r$* and a second, red decomposition appears: uniqueness is gone.`,
      deps: [],
      tags: ['divisibility'],
      credit: 'Euclid, Elements VII, c. 300 BC',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euclidean_division' },
      viz(v) {
        const A = v.slider('$a$', -60, 100, 47, { int: true });
        const B = v.slider('$b$', 1, 24, 9, { int: true });
        const loose = v.toggle('drop $0 \\le r$ (allow $|r| < b$)', false);
        const R = v.stage({ x: [-2, 50], y: [-1.05, 2.75], height: 200, axes: false, full: true });
        const T = v.stage({ x: [-4.5, 73], y: [-2.3, 19.2], height: 296, axes: false, full: true, title: 'the remainder $a \\bmod b$ for $0 \\le a \\le 72$, $1 \\le b \\le 18$ — darker = larger remainder, green = remainder $0$ · click a cell' });
        T.onClick((x, y) => { const a = Math.round(x), b = Math.round(y); if (a >= 0 && a <= 72 && b >= 1 && b <= 18) { A.set(a); B.set(b); } });
        v.render(() => {
          const a = A.value, b = B.value, q = Math.floor(a / b), r = a - q * b;
          const lo = Math.min(0, q * b, a), hi = Math.max(0, a, (q + 1) * b), pad = (hi - lo) * 0.04 + 0.6;
          R.setView([lo - pad, hi + pad], [-1.05, 2.75]);
          // the ruler, marked every b
          R.line(lo - pad, 0, hi + pad, 0, { color: 'muted', width: 1.2 });
          const k0 = Math.ceil((lo - pad) / b), k1 = Math.floor((hi + pad) / b), px = b * R.scale;
          const every = px >= 30 ? 1 : px >= 15 ? 2 : px >= 7 ? 5 : 10;
          for (let k = k0; k <= k1; k++) {
            R.line(k * b, -0.13, k * b, 0.13, { color: 'muted', width: 1 });
            if (k % every === 0) R.text(v.fmt(k * b), k * b, -0.45, { align: 'center', size: 11, color: k === q ? 'ink' : 'muted', weight: k === q ? 650 : 500 });
          }
          R.line(0, -0.25, 0, 2.6, { color: 'faint', width: 1 });
          // the bar of length a
          if (a !== 0) {
            R.rect(Math.min(0, a), 2.05, Math.max(0, a), 2.55, { fill: 'ink', fillAlpha: 0.1, color: 'ink', width: 1.4 });
            R.text(`a = ${v.fmt(a)}`, a / 2, 2.3, { align: 'center', size: 12.5, weight: 600 });
          }
          // q whole blocks of length b
          const qa = Math.abs(q);
          for (let j = 0; j < qa; j++) {
            const x0 = q > 0 ? j * b : -(j + 1) * b, col = j % 2 ? 'teal' : 'blue';
            R.rect(x0, 1.05, x0 + b, 1.6, { fill: col, fillAlpha: 0.32, color: col, width: 1.2 });
            if (px >= 18) R.text(String(q > 0 ? j + 1 : -(j + 1)), x0 + b / 2, 1.325, { align: 'center', size: 11, color: col, weight: 650 });
          }
          if (q !== 0) R.text(`q = ${v.fmt(q)} block${qa === 1 ? '' : 's'} of length b = ${b}`, q > 0 ? 0 : q * b, 1.83, { align: 'left', size: 11.5, color: 'blue', dx: 2 });
          else R.text('q = 0: no whole block fits', 0, 1.325, { align: 'left', size: 11.5, color: 'blue', dx: 4 });
          // the remainder (and, without 0 ≤ r, the rival negative remainder)
          R.line(q * b, 0, q * b, 1.6, { color: 'gold', width: 1, dash: [3, 3] });
          R.line(a, 0, a, 2.55, { color: 'ink', width: 1, dash: [3, 3], alpha: 0.6 });
          const showRival = loose.value && r > 0, wpx = (w) => w * R.scale;
          if (r > 0) {
            R.rect(q * b, 0.3, a, 0.82, { fill: 'gold', fillAlpha: 0.55, color: 'gold', width: 1.4 });
            const lab = `r = ${r}`;
            if (wpx(r) >= 46) R.text(lab, (q * b + a) / 2, 0.56, { align: 'center', size: 12, weight: 650, color: 'ink' });
            else if (showRival) R.text(lab, q * b, 0.56, { align: 'right', size: 12, weight: 650, color: 'gold', dx: -6 });
            else R.text(lab, a, 0.56, { align: 'left', size: 12, weight: 650, color: 'gold', dx: 6 });
          } else R.text('r = 0', a, 0.56, { align: 'left', size: 12, weight: 650, color: 'green', dx: 6 });
          if (showRival) {
            R.rect(a, 0.3, (q + 1) * b, 0.82, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1.4 });
            const lab = `r − b = ${v.fmt(r - b)}`;
            if (wpx(b - r) >= 80) R.text(lab, (a + (q + 1) * b) / 2, 0.56, { align: 'center', size: 11.5, weight: 650, color: 'ink' });
            else R.text(lab, (q + 1) * b, 0.56, { align: 'left', size: 11.5, weight: 650, color: 'red', dx: 6 });
          }
          // the table of remainders
          for (let bb = 1; bb <= 18; bb++) for (let aa = 0; aa <= 72; aa++) {
            const rr = aa % bb;
            T.rect(aa - 0.5, bb - 0.5, aa + 0.5, bb + 0.5, rr === 0 ? { fill: 'green', fillAlpha: 0.75, stroke: false } : { fill: 'accent', fillAlpha: 0.05 + (0.5 * rr) / bb, stroke: false });
          }
          for (let aa = 0; aa <= 72; aa += 6) T.text(String(aa), aa, -0.55, { align: 'center', size: 10.5, color: 'muted' });
          for (const bb of [1, 3, 6, 9, 12, 15, 18]) T.text(String(bb), -1.4, bb, { align: 'right', size: 10.5, color: 'muted' });
          T.text('a', -1.4, -0.55, { align: 'right', size: 13, color: 'muted', math: true });
          T.text('b', -3.6, 18.4, { align: 'center', size: 13, color: 'muted', math: true });
          if (b <= 18) T.rect(-0.5, b - 0.5, 72.5, b + 0.5, { color: 'ink', width: 1, alpha: 0.45 });
          if (a >= 0 && a <= 72 && b <= 18) T.rect(a - 0.5, b - 0.5, a + 0.5, b + 0.5, { color: 'ink', width: 2.4 });
        });
        v.readout(() => {
          const a = A.value, b = B.value, q = Math.floor(a / b), r = a - q * b;
          let s = `$${a} = ${par(q)}\\cdot ${b} + ${r}$ with $0 \\le r = ${r} < b = ${b}$: ` + (r === 0 ? `the remainder is $0$, so $${b} \\mid ${a}$.` : `$${b} \\nmid ${a}$.`);
          if (loose.value && r > 0) s += ` Without $0 \\le r$ there is a second pair: $${a} = ${par(q + 1)}\\cdot ${b} + (${r - b})$ with $\\lvert ${r - b}\\rvert < ${b}$ — **two** pairs $(q, r)$, so uniqueness fails.`;
          else if (loose.value) s += ' With $r = 0$ the rival $r - b = -b$ is not allowed even then, so this case stays unique.';
          if (a < 0 && r > 0) s += ` (A programming language's truncating remainder gives ${a % b} here; the division algorithm uses $q = \\lfloor a/b \\rfloor$.)`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Greatest common divisor',
      statement: String.raw`Let $a,b$ be integers, not both $0$. A *common divisor* of $a$ and $b$ is an integer $d$ with $d\mid a$ and $d\mid b$. Common divisors exist ($\pm1$) and are bounded by $\max(|a|,|b|)$, so there is a largest one: the *greatest common divisor* $\gcd(a,b)\ge1$. One also sets $\gcd(0,0)=0$. The numbers $a,b$ are *coprime* (relatively prime) when $\gcd(a,b)=1$.

The gcd is characterised by divisibility alone: it is the unique $g\ge0$ that divides $a$ and $b$ and is divisible by every common divisor of $a$ and $b$ (a consequence of Bézout’s identity, 1.4).`,
      idea: String.raw`Order the positive divisors by divisibility: $d$ sits below $e$ when $d\mid e$. The divisors of $a$ form a lattice (a box, one side per prime of $a$, of length its exponent), and so do the divisors of $b$; the common divisors are their overlap, which is again a box — the divisors of a single number. The top of the overlap is the gcd, and it is not merely the *largest* common divisor in size: every common divisor lies below it, i.e. divides it. In this picture $\gcd(a,b)$ is the *meet* of $a$ and $b$, and $\operatorname{lcm}(a,b)$ is their join.`,
      caption: String.raw`Choose $a$ and $b$. The Hasse diagram draws every divisor of $a$ (blue) or of $b$ (orange); a line goes up from $d$ to $dp$ for each prime $p$, one direction per prime. Green nodes divide both: they form the divisor box of the gcd (gold ring). Click any node: for a common divisor the green path climbs to the gcd, showing it divides the gcd; for any other node the path shows which of $a$, $b$ it divides.`,
      deps: ['nt-1.1'],
      tags: ['divisibility', 'gcd'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Greatest_common_divisor' },
      viz(v) {
        const M = v.M;
        const A = v.slider('$a$', 1, 240, 60, { int: true });
        const B = v.slider('$b$', 1, 240, 72, { int: true });
        const S = v.stage({ x: [-3, 3], y: [-0.5, 4], equal: true, axes: false, height: 430 });
        const NICE = { 2: [[1, 0.6], [-1, 0.6]], 3: [[1, 0.42], [-0.62, 0.62], [0.1, 1.05]], 4: [[1, 0.42], [-0.62, 0.62], [0.1, 1.05], [-1.05, 0.3]] };
        const dirCache = new Map();
        /**
         * Directions (one per prime, all pointing upward) for the Hasse diagram, chosen to keep nodes apart: the
         * "nice" set and ~150 seeded random sets are scored by the smallest node–node and node–edge gap in pixels.
         */
        const chooseDirs = (key, E, edges, k) => {
          if (k <= 1) return [[0, 1]];
          if (dirCache.has(key)) return dirCache.get(key);
          const rr = v.rng(97 + k), cands = NICE[k] ? [NICE[k]] : [];
          for (let i = 0; i < 150; i++) { const d = []; for (let j = 0; j < k; j++) { const th = rr.uniform(0.15, Math.PI - 0.15), len = rr.uniform(0.75, 1.25); d.push([Math.cos(th) * len, Math.sin(th) * len * 0.8 + 0.22]); } cands.push(d); }
          const W = Math.max(300, S.width), H = Math.max(200, S.height);
          let best = cands[0], bs = -1;
          for (const d of cands) {
            const P = E.map((e) => { let x = 0, y = 0; for (let i = 0; i < k; i++) { x += e[i] * d[i][0]; y += e[i] * d[i][1]; } return [x, y]; });
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
            const sc = Math.min(W / (x1 - x0 + 1.1), H / (y1 - y0 + 1.35));
            let md = Infinity;
            for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) md = Math.min(md, Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]));
            for (const [i, j] of edges) {
              const [ax, ay] = P[i], dx = P[j][0] - ax, dy = P[j][1] - ay, L2 = dx * dx + dy * dy;
              for (let m = 0; m < P.length; m++) {
                if (m === i || m === j) continue;
                const t = Math.max(0, Math.min(1, ((P[m][0] - ax) * dx + (P[m][1] - ay) * dy) / L2));
                md = Math.min(md, 1.5 * Math.hypot(P[m][0] - ax - t * dx, P[m][1] - ay - t * dy));
              }
            }
            const score = sc * md * (d === cands[0] && NICE[k] ? 1.15 : 1);
            if (score > bs) { bs = score; best = d; }
          }
          dirCache.set(key, best); return best;
        };
        let sel = 4, nodes = [], rad = 13;
        S.onClick((x, y) => {
          const X = S.X(x), Y = S.Y(y); let best = null, bd = rad + 6;
          for (const nd of nodes) { const d = Math.hypot(S.X(nd.x) - X, S.Y(nd.y) - Y); if (d < bd) { bd = d; best = nd; } }
          sel = best ? (sel === best.d ? null : best.d) : null;
        });
        v.legend([['blue', 'divides $a$ only', { dot: true }], ['orange', 'divides $b$ only', { dot: true }], ['green', 'divides both — the divisors of the gcd', { dot: true }], ['gold', '$\\gcd(a,b)$', { dot: true }]]);
        v.render(() => {
          const a = A.value, b = B.value, g = M.gcd(a, b), L = M.lcm(a, b);
          const fs = M.factor(L).sort((u, w) => w[1] - u[1] || u[0] - w[0]), ps = fs.map(([p]) => p), k = ps.length;
          const set = new Set([...divisorsOf(a), ...divisorsOf(b)]), list = [...set].sort((u, w) => u - w);
          const expo = (d) => ps.map((p) => { let e = 0; while (d % p === 0) { d /= p; e++; } return e; });
          const E = list.map(expo), idx = new Map(list.map((d, i) => [d, i]));
          const edgeIdx = []; list.forEach((d, i) => ps.forEach((p) => { if (idx.has(d * p)) edgeIdx.push([i, idx.get(d * p)]); }));
          const dirs = chooseDirs(`${a}|${b}`, E, edgeIdx, k);
          nodes = list.map((d, i) => { let x = 0, y = 0; E[i].forEach((e, j) => { x += e * dirs[j][0]; y += e * dirs[j][1]; }); return { d, x, y }; });
          const byD = new Map(nodes.map((nd) => [nd.d, nd]));
          const xs = nodes.map((nd) => nd.x), ys = nodes.map((nd) => nd.y);
          const m = 0.55; S.setView([Math.min(...xs) - m, Math.max(...xs) + m], [Math.min(...ys) - m, Math.max(...ys) + m + 0.25]);
          // node size from the closest pair on screen
          let dmin = 60; for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) dmin = Math.min(dmin, Math.hypot(S.X(nodes[i].x) - S.X(nodes[j].x), S.Y(nodes[i].y) - S.Y(nodes[j].y)));
          rad = M.clamp(dmin * 0.42, 8, 16);
          const memb = (d) => (g % d === 0 ? 'green' : a % d === 0 ? 'blue' : 'orange');
          // covering edges d — dp
          for (const nd of nodes) for (const p of ps) {
            const up = byD.get(nd.d * p); if (!up) continue;
            S.line(nd.x, nd.y, up.x, up.y, { color: memb(up.d), width: 1.6, alpha: 0.55 });
          }
          // the selected node's path upward
          const target = sel == null || !set.has(sel) ? null : g % sel === 0 ? g : a % sel === 0 ? a : b;
          if (target != null) {
            let cur = sel; const col = memb(sel);
            while (cur !== target) { const p = ps.find((pp) => (target / cur) % pp === 0); const nx = cur * p; S.line(byD.get(cur).x, byD.get(cur).y, byD.get(nx).x, byD.get(nx).y, { color: col === 'green' ? 'green' : col, width: 5, alpha: 0.85 }); cur = nx; }
          }
          // nodes
          const fsz = M.clamp(rad * 0.82, 8.5, 13);
          for (const nd of nodes) {
            const X = S.X(nd.x), Y = S.Y(nd.y), col = memb(nd.d);
            if (nd.d === g) pdisc(v, S, X, Y, rad + 4, { stroke: 'gold', width: 3.2 });
            pdisc(v, S, X, Y, rad, { fill: col, fillAlpha: nd.d === sel ? 0.6 : 0.22, stroke: col, width: nd.d === sel ? 2.6 : 1.6 });
            S.textPx(String(nd.d), X, Y + 0.5, { align: 'center', size: nd.d >= 100 ? fsz * 0.86 : fsz, weight: 650, halo: false });
          }
          const tag = (d, txt, col, pos) => { const nd = byD.get(d); if (nd) S.text(txt, nd.x, nd.y, { color: col, size: 12.5, weight: 650, align: pos === 'l' ? 'right' : 'left', dx: pos === 'l' ? -(rad + 7) : rad + 7, dy: -rad * 0.7 }); };
          if (a === b) tag(a, 'a = b', 'ink', 'r');
          else { tag(a, 'a', 'blue', 'r'); tag(b, 'b', 'orange', 'l'); }
          if (g !== a && g !== b) tag(g, 'gcd', 'gold', 'r');
          S.corner(`${k} prime${k === 1 ? '' : 's'} in play: ${ps.join(', ') || '—'}`, 'tl', { size: 11.5 });
        });
        v.readout(() => {
          const a = A.value, b = B.value, g = M.gcd(a, b), da = divisorsOf(a), db = divisorsOf(b), dg = divisorsOf(g);
          let s = `$\\gcd(${a}, ${b}) = ${g}$ ($${a} = ${facTex(M, a)}$, $${b} = ${facTex(M, b)}$). Common divisors: $\\{${dg.join(', ')}\\}$ — exactly the ${dg.length} divisors of $${g}$; $a$ has ${da.length}, $b$ has ${db.length}.`;
          if (sel != null && (a % sel === 0 || b % sel === 0)) {
            if (g % sel === 0) s += ` Selected $d = ${sel}$: it divides both, and indeed $${g} = ${sel}\\cdot ${g / sel}$ — it lies below the gcd.`;
            else s += ` Selected $d = ${sel}$ divides $${a % sel === 0 ? a : b}$ but not $${a % sel === 0 ? b : a}$, so it is not a common divisor.`;
          }
          return s + ` Join: $\\operatorname{lcm}(${a}, ${b}) = ${M.lcm(a, b)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Algorithm',
      name: 'Euclidean algorithm',
      statement: String.raw`**Input:** integers $a\ge b\ge1$. **Step:** divide with remainder, $a=qb+r$ with $0\le r<b$ (1.1), and replace $(a,b)$ by $(b,r)$. **Stop** when the remainder is $0$; the last nonzero remainder is $\gcd(a,b)$. Written out:
$$a=q_1b+r_1,\quad b=q_2r_1+r_2,\quad r_1=q_3r_2+r_3,\quad\dots,\quad r_{n-2}=q_nr_{n-1}+0,$$
and $\gcd(a,b)=r_{n-1}$. The remainders strictly decrease, so the algorithm stops after at most $b$ steps (in fact $O(\log b)$ steps).`,
      idea: String.raw`If $a=qb+r$, then a number divides both $a$ and $b$ exactly when it divides both $b$ and $r=a-qb$. So the *set* of common divisors — and in particular the gcd — never changes from one line to the next, and at the end $\gcd(r_{n-1},0)=r_{n-1}$. Geometrically: cut as many $b\times b$ squares as possible off an $a\times b$ rectangle, then repeat on the leftover rectangle. The last square fits a whole number of times into every earlier square, so its side measures both $a$ and $b$. The process stops because the sides are positive *integers* that keep decreasing; with incommensurable sides (the golden rectangle, $\sqrt2:1$) it goes on for ever.`,
      caption: String.raw`Step through with ◀ ▶ (it opens on the finished tiling). Each step cuts squares of one colour and adds one line $a=q\cdot b+r$ to the table; the final frame lays a grid of side $\gcd(a,b)$ over the rectangle — it tiles every square. Change $a$ and $b$, or pick a rectangle with irrational ratio: the squares then shrink for ever and no last square exists.`,
      deps: ['nt-1.2', 'nt-1.1'],
      see: ['algo-1.7'],
      tags: ['gcd', 'algorithms'],
      credit: 'Euclid, Elements VII.1–2, c. 300 BC',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euclidean_algorithm' },
      viz(v) {
        const PHI = (1 + Math.sqrt(5)) / 2;
        const mode = v.select('', [{ value: 'int', label: 'integer sides' }, { value: 'phi', label: 'golden rectangle $\\varphi : 1$' }, { value: 'r2', label: '$\\sqrt2 : 1$' }], 'int');
        const A = v.slider('$a$', 1, 1200, 1071, { int: true });
        const B = v.slider('$b$', 1, 1200, 462, { int: true });
        const R = v.stage({ x: [0, 1071], y: [0, 462], equal: true, axes: false, height: 310, weight: 1.75 });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, weight: 0.9, minWidth: 250, title: 'division with remainder, line by line' });
        const num = (x, real) => (real ? x.toFixed(2) : String(x));
        const build = () => {
          const m = mode.value, real = m !== 'int';
          let a, b;
          if (real) { b = 100; a = m === 'phi' ? 100 * PHI : 100 * Math.SQRT2; } else { a = Math.max(A.value, B.value); b = Math.min(A.value, B.value); }
          const W = a, H = b; let x = 0, y = 0, w = W, h = H;
          const squares = [], rows = [];
          const frames = [{ squares: [], rows: [], rest: [0, 0, W, H], W, H, real, note: real ? `A rectangle whose sides have ratio $${m === 'phi' ? '\\varphi' : '\\sqrt2'}$: is there a length that measures both sides?` : `An $${a}\\times${b}$ rectangle${A.value < B.value ? ' (sides swapped so that $a \\ge b$)' : ''}. Cut off squares as large as possible.` }];
          for (let k = 0; k < (real ? 8 : 60) && w > 1e-9 && h > 1e-9; k++) {
            const horiz = w >= h, big = horiz ? w : h, s = horiz ? h : w, q = Math.floor(big / s + 1e-9), r = Math.max(0, big - q * s);
            for (let j = 0; j < q; j++) squares.push({ x: horiz ? x + j * s : x, y: horiz ? y : y + j * s, s, k });
            if (horiz) { x += q * s; w -= q * s; } else { y += q * s; h -= q * s; }
            rows.push({ a: big, q, b: s, r });
            const done = r < 1e-9;
            frames.push({
              squares: squares.slice(), rows: rows.slice(), rest: [x, y, w, h], cur: k, W, H, real,
              note: `Step ${k + 1}: $${num(big, real)} = ${q}\\cdot ${num(s, real)} + ${num(r, real)}$ — cut ${q} square${q === 1 ? '' : 's'} of side ${num(s, real)}. ` + (done ? 'Nothing is left over.' : `The leftover $${num(s, real)}\\times${num(r, real)}$ rectangle has the same common divisors: whatever divides $${num(big, real)}$ and $${num(s, real)}$ divides $${num(r, real)} = ${num(big, real)} - ${q}\\cdot${num(s, real)}$, and conversely.`),
            });
            if (done) break;
          }
          const last = rows[rows.length - 1];
          if (real) frames.push({ ...frames[frames.length - 1], cur: -1, infinite: true, note: `…and so on for ever: the quotients are ${rows.map((r) => r.q).join(', ')}, … and the squares shrink geometrically but never fit exactly. No length measures both sides — the ratio is irrational. For integer sides the remainders are positive integers that decrease, so they must reach $0$.` });
          else frames.push({ ...frames[frames.length - 1], cur: -1, final: true, g: last.b, a, b, note: `The last square has side $g = ${last.b}$. It fits a whole number of times into every earlier square, so the grid of $g\\times g$ cells tiles the whole rectangle: $g \\mid ${a}$ and $g \\mid ${b}$. Any common divisor of $${a}$ and $${b}$ divides every remainder, hence divides $g$. So $\\gcd(${a}, ${b}) = ${last.b}$.` });
          return frames;
        };
        const S = v.steps({ frames: build, speed: 0.8, start: 'end', still: 'end', counter: 'frame' });
        let key = '';
        v.render(() => {
          const m = mode.value, real = m !== 'int';
          A.el.hidden = B.el.hidden = real;
          const k = `${m}|${A.value}|${B.value}`;
          if (k !== key) { if (key) S.reset({ at: 'end' }); key = k; }
          const f = S.frame; if (!f.W) return;
          R.setView([-f.W * 0.015, f.W * 1.015], [-f.H * 0.015, f.H * 1.015]);
          R.rect(0, 0, f.W, f.H, { color: 'ink', width: 1.5 });
          for (const sq of f.squares) {
            const col = PALETTE[sq.k % 6], now = sq.k === f.cur;
            R.rect(sq.x, sq.y, sq.x + sq.s, sq.y + sq.s, { fill: col, fillAlpha: now ? 0.5 : 0.25, color: col, width: now ? 2.4 : 1.2 });
            if (sq.s * R.scale >= 34) R.text(num(sq.s, real), sq.x + sq.s / 2, sq.y + sq.s / 2, { align: 'center', size: Math.min(15, 9 + sq.s * R.scale / 30), weight: 650, color: col });
          }
          const [rx, ry, rw, rh] = f.rest;
          if (rw > 1e-9 && rh > 1e-9) R.rect(rx, ry, rx + rw, ry + rh, { color: 'accent', width: 2, dash: [6, 4] });
          if (f.final) {
            const g = f.g, sp = g * R.scale;
            if (sp >= 3.5) {
              for (let x = g; x < f.W - 1e-9; x += g) R.line(x, 0, x, f.H, { color: 'gold', width: 0.7, alpha: 0.55 });
              for (let y = g; y < f.H - 1e-9; y += g) R.line(0, y, f.W, y, { color: 'gold', width: 0.7, alpha: 0.55 });
            } else R.corner(`the ${g}×${g} grid is too fine to draw here`, 'br', { size: 11 });
            const lastSq = f.squares[f.squares.length - 1];
            R.rect(lastSq.x, lastSq.y, lastSq.x + g, lastSq.y + g, { fill: 'gold', fillAlpha: 0.75, color: 'gold', width: 2 });
          }
          // the table
          const n = f.rows.length + (f.final || f.infinite ? 1 : 0), H = T.height, W = T.width;
          const rowH = Math.min(28, (H - 18) / Math.max(n, 1)), fs = Math.max(10.5, Math.min(15, rowH * 0.58));
          f.rows.forEach((row, i) => {
            const Y = 14 + rowH * (i + 0.5), now = i === f.cur;
            if (now) rbox(v, T, 6, Y - rowH / 2 + 1, W - 12, rowH - 2, 6, { fill: 'accent', fillAlpha: 0.13 });
            T.textPx(String(i + 1), 22, Y, { align: 'right', size: 11, color: 'muted' });
            T.texPx(`${num(row.a, real)} = ${row.q}\\cdot ${num(row.b, real)} + ${num(row.r, real)}`, 34, Y, { align: 'left', size: fs, color: row.r < 1e-9 ? 'green' : now ? 'ink' : 'muted' });
          });
          if (f.final) T.texPx(`\\gcd(${f.a}, ${f.b}) = ${f.g}`, 34, 14 + rowH * (f.rows.length + 0.5), { align: 'left', size: fs + 1, color: 'green' });
          if (f.infinite) T.texPx('\\cdots\\ \\text{(never terminates)}', 34, 14 + rowH * (f.rows.length + 0.5), { align: 'left', size: fs, color: 'red' });
        });
        v.readout(() => {
          const f = S.frame; if (!f.rows) return '';
          if (f.real) return `Ratio $a/b = ${(f.W / f.H).toFixed(6)}\\ldots$; quotients so far ${f.rows.map((r) => r.q).join(', ')}, … — the continued fraction of $a/b$, which never ends for an irrational ratio.`;
          const rows = build().slice(-2)[0].rows, g = rows[rows.length - 1].b;
          return `$\\gcd(${Math.max(A.value, B.value)}, ${Math.min(A.value, B.value)}) = ${g}$ after ${rows.length} division step${rows.length === 1 ? '' : 's'}; quotients ${rows.map((r) => r.q).join(', ')}. On screen: ${S.i === 0 ? 'the uncut rectangle' : S.i > rows.length ? 'the finished tiling with the gcd grid' : `division step ${S.i} of ${rows.length}`}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'Bézout’s identity',
      statement: String.raw`Let $a,b$ be integers, not both $0$, and $g=\gcd(a,b)$. Then there are integers $x,y$ with
$$ax+by=g .$$
More precisely, the set $\{ax+by : x,y\in\Z\}$ of all integer combinations of $a$ and $b$ is exactly the set $g\Z$ of multiples of $g$; in particular $g$ is its smallest positive element, and every common divisor of $a$ and $b$ divides $g$.`,
      idea: String.raw`Run Euclid’s algorithm (1.3) and carry along, for each remainder, a way of writing it as $ax+by$: $a=a\cdot1+b\cdot0$, $b=a\cdot0+b\cdot1$, and if $r_{k+1}=r_{k-1}-q_kr_k$ then the coefficients obey the same recursion. The last nonzero remainder is $g$, with its coefficients (equivalently, back-substitute the division lines from the bottom up). Conversely $g$ divides $a$ and $b$, hence every $ax+by$; so the combinations are exactly $g\Z$, and a common divisor $d$ of $a,b$ divides $ax+by=g$. The coefficients must be allowed to be negative: with $x,y\ge0$ the smallest positive value is $\min(a,b)$.`,
      caption: String.raw`Two rulers are marked at the multiples of $a$ (blue, above) and of $b$ (orange, below). Every remainder of the extended algorithm is a gap between an $a$-mark and a $b$-mark — $r_k = a x_k + b y_k$ with $x_k, y_k$ of opposite signs — and the gaps shrink down to $g$ (green): the Bézout pair can be read off the two marks. Click a gap or a table row; switch the table to *back-substitution* to climb the division lines instead. The strip below shows all values $ax+by$ — the multiples of $g$ — and what is left when only $x,y\ge0$ are allowed.`,
      deps: ['nt-1.3'],
      tags: ['gcd', 'linear combinations'],
      credit: 'Bachet, 1624 (integers); Bézout, 1779 (polynomials)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/B%C3%A9zout%27s_identity' },
      viz(v) {
        const M = v.M;
        const A = v.slider('$a$', 1, 99, 52, { int: true });
        const B = v.slider('$b$', 1, 99, 22, { int: true });
        const tab = v.select('table', [{ value: 'fwd', label: 'extended Euclid' }, { value: 'back', label: 'back-substitution' }], 'fwd');
        const pos = v.toggle('only $x, y \\ge 0$', false);
        const R = v.stage({ x: [0, 170], y: [-1.2, 5], axes: false, height: 330, weight: 1.3, minWidth: 330, title: 'two rulers: multiples of $a$ (above) and of $b$ (below)' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, minWidth: 300 });
        const N = v.stage({ x: [-100, 100], y: [-1, 1.4], axes: false, height: 96, full: true });
        let sel = null, st = null, lanes = [], tgeo = null, lastKey = '';
        R.onClick((x, y) => { let best = null, bd = 0.5; for (const ln of lanes) { const d = Math.abs(ln.y - y); if (d < bd) { bd = d; best = ln.k; } } if (best != null) sel = best; });
        T.onClick((x, y) => { if (!tgeo) return; const k = Math.round((T.Y(y) - tgeo.y0) / tgeo.h); if (k >= 0 && k < tgeo.n) sel = k; });
        v.render(() => {
          const a = A.value, b = B.value, g = M.gcd(a, b), rows = extRows(a, b), n = rows.length - 2; // rows[n].r = g
          const key = `${a}|${b}`; if (key !== lastKey) { lastKey = key; sel = n; }
          // ---- the two rulers and the remainder gaps
          lanes = [];
          for (let k = 2; k <= n; k++) if (rows[k].x * rows[k].y < 0) lanes.push({ k, XA: Math.abs(rows[k].x) * a, XB: Math.abs(rows[k].y) * b });
          const Xmax = Math.max(2 * Math.max(a, b), ...lanes.map((l) => Math.max(l.XA, l.XB))) * 1.05;
          const L = lanes.length, top = 0.95 + Math.max(0, L - 1) + 0.75;
          lanes.forEach((ln, i) => { ln.y = 0.95 + (L - 1 - i); });
          R.setView([-Xmax * 0.03, Xmax * 1.02], [-1.25, Math.max(top, 2.2)]);
          R.line(0, 0, Xmax, 0, { color: 'muted', width: 1.2 });
          const usedA = new Set(lanes.map((l) => l.XA)), usedB = new Set(lanes.map((l) => l.XB));
          for (let m = 0; m * a <= Xmax; m++) {
            R.line(m * a, 0, m * a, 0.34, { color: 'blue', width: usedA.has(m * a) ? 2.4 : 1.4 });
            if (usedA.has(m * a) || a * R.scale >= 26) R.text(m === 0 ? '0' : m === 1 ? 'a' : `${m}a`, m * a, 0.52, { align: 'center', size: 10.5, color: 'blue', weight: usedA.has(m * a) ? 650 : 500 });
          }
          for (let m = 0; m * b <= Xmax; m++) {
            R.line(m * b, 0, m * b, -0.34, { color: 'orange', width: usedB.has(m * b) ? 2.4 : 1.4 });
            if (usedB.has(m * b) || b * R.scale >= 26) R.text(m === 0 ? '0' : m === 1 ? 'b' : `${m}b`, m * b, -0.55, { align: 'center', size: 10.5, color: 'orange', weight: usedB.has(m * b) ? 650 : 500 });
          }
          if (!L) R.corner(n <= 1 ? `b divides a: g = b = 0·a + 1·b` : 'no gaps to show', 'tr', { size: 12, color: 'green', weight: 650 });
          for (const ln of lanes) {
            const r = rows[ln.k], isG = ln.k === n, isSel = ln.k === sel, col = isG ? 'green' : 'gold';
            if (isSel) R.hband(ln.y - 0.38, ln.y + 0.38, { color: col, alpha: 0.1 });
            R.line(ln.XA, 0.34, ln.XA, ln.y, { color: 'blue', width: 1, dash: [3, 3], alpha: 0.6 });
            R.line(ln.XB, 0, ln.XB, ln.y, { color: 'orange', width: 1, dash: [3, 3], alpha: 0.6 });
            let lo = Math.min(ln.XA, ln.XB), hi = Math.max(ln.XA, ln.XB);
            const minW = 9 / R.scale; if (hi - lo < minW) { const c = (lo + hi) / 2; lo = c - minW / 2; hi = c + minW / 2; }
            R.line(lo, ln.y, hi, ln.y, { color: col, width: isSel ? 4 : 2.6 });
            R.line(lo, ln.y - 0.17, lo, ln.y + 0.17, { color: col, width: 2 }); R.line(hi, ln.y - 0.17, hi, ln.y + 0.17, { color: col, width: 2 });
            const tex = `${r.r} = ${lin(r.x, a, r.y, b)}`, wEst = 9.6 * (String(r.r).length + String(Math.abs(r.x)).length + String(Math.abs(r.y)).length + 10);
            const right = R.X(hi) + 10 + wEst < R.width;
            R.tex(tex, right ? hi : lo, ln.y, { align: right ? 'left' : 'right', dx: right ? 10 : -10, size: 13.5, color: isG ? 'green' : 'ink' });
          }
          // ---- the table
          const W = T.width, Ht = T.height;
          tgeo = null;
          if (tab.value === 'fwd') {
            T.setTitle('extended Euclid: every remainder as $a x_k + b y_k$');
            const cols = [0.07, 0.2, 0.33, 0.47, 0.61, 0.83].map((t) => t * W);
            const heads = ['k', 'r_k', 'q_k', 'x_k', 'y_k', `${a}x_k + ${b}y_k`];
            const rowH = Math.min(30, (Ht - 40) / (rows.length + 1)), fs = Math.max(10.5, Math.min(14.5, rowH * 0.56));
            tgeo = { y0: 16 + rowH, h: rowH, n: rows.length };
            heads.forEach((h, j) => T.texPx(h, cols[j], 16, { size: fs, color: 'muted' }));
            rows.forEach((r, k) => {
              const Y = 16 + rowH * (k + 1);
              if (k === n) rbox(v, T, 4, Y - rowH / 2 + 1, W - 8, rowH - 2, 6, { fill: 'green', fillAlpha: 0.16 });
              if (k === sel) rbox(v, T, 4, Y - rowH / 2 + 1, W - 8, rowH - 2, 6, { stroke: k === n ? 'green' : 'gold', width: 2 });
              const col = k === rows.length - 1 ? 'muted' : 'ink';
              [k, r.r, r.q ?? '', r.x, r.y, a * r.x + b * r.y].forEach((val, j) => { if (val !== '') T.texPx(String(val), cols[j], Y, { size: fs, color: j === 5 ? (k === n ? 'green' : 'teal') : col }); });
            });
            T.textPx('each row = (row two above) − q × (row above) · click a row', W / 2, Ht - 10, { align: 'center', size: 11, color: 'muted' });
          } else {
            T.setTitle('back-substitution: climb the division lines from the bottom');
            const lines = [];
            if (n <= 1) lines.push({ eq: `${g} = ${lin(0, a, 1, b)}`, why: `$${b} \\mid ${a}$, so $g = b$` });
            else {
              let s = 1, t = -rows[n - 1].q; // g = s·r_{n-2} + t·r_{n-1}
              lines.push({ eq: `${g} = ${lin(s, rows[n - 2].r, t, rows[n - 1].r)}`, why: `line ${n - 1}: $${rows[n - 2].r} = ${rows[n - 1].q}\\cdot${rows[n - 1].r} + ${g}$` });
              for (let k = n - 1; k >= 2; k--) {
                const ns = t, nt = s - t * rows[k - 1].q; s = ns; t = nt;
                lines.push({ eq: `${g} = ${lin(s, rows[k - 2].r, t, rows[k - 1].r)}`, why: `substitute $${rows[k].r} = ${rows[k - 2].r} - ${rows[k - 1].q}\\cdot ${rows[k - 1].r}$` });
              }
            }
            const rowH = Math.min(46, (Ht - 50) / Math.max(1, lines.length)), fs = Math.max(11, Math.min(15, rowH * 0.42));
            lines.forEach((ln, i) => {
              const Y = 22 + rowH * (i + 0.5), last = i === lines.length - 1;
              if (last) rbox(v, T, 4, Y - rowH / 2 + 2, W - 8, rowH - 4, 6, { fill: 'green', fillAlpha: 0.16 });
              T.texPx(ln.eq, 14, Y - fs * 0.45, { align: 'left', size: fs, color: last ? 'green' : 'ink' });
              T.texPx(ln.why, 22, Y + fs * 0.75, { align: 'left', size: fs * 0.78, color: 'muted', rich: true });
            });
          }
          // ---- number line of the values ax + by
          const Mx = Math.max(a, b) * 1.5;
          N.setView([pos.value ? -Mx * 0.08 : -Mx, Mx], [-1, 1.4]);
          N.line(N.bounds.x[0], 0, Mx, 0, { color: 'muted', width: 1 });
          const vals = [];
          if (pos.value) { for (let x = 0; x * a <= Mx; x++) for (let y = 0; x * a + y * b <= Mx; y++) vals.push(x * a + y * b); }
          else for (let t = Math.ceil(-Mx / g); t * g <= Mx; t++) vals.push(t * g);
          N.dots([...new Set(vals)].map((t) => [t, 0]), { r: 2.3, color: 'accent' });
          const mark = (x, lab, col, up = true) => { N.line(x, 0, x, up ? 0.55 : -0.55, { color: col, width: 1.5 }); N.text(lab, x, up ? 0.85 : -0.82, { align: 'center', size: 11.5, weight: 650, color: col }); };
          mark(0, '0', 'muted', false);
          const sp = pos.value ? Math.min(a, b) : g;
          mark(sp, pos.value ? `smallest > 0: ${sp}` : `g = ${g}`, pos.value ? 'red' : 'green');
          if (pos.value && g < sp) { N.dot(g, 0, { r: 4.5, hollow: true, color: 'green' }); N.text(`g = ${g} unreachable`, g, 0.62, { align: 'left', size: 11, color: 'green', weight: 650, dx: 4 }); }
          if (!pos.value && sel != null && rows[sel] && rows[sel].r !== sp && rows[sel].r <= Mx && rows[sel].r > 0) mark(rows[sel].r, `r = ${rows[sel].r}`, 'gold', false);
          N.corner(pos.value ? 'values ax + by with x, y ≥ 0 only' : 'all values ax + by (x, y any integers): exactly the multiples of g', 'tl', { size: 11 });
          st = { a, b, g, rows, n };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, g, rows, n } = st, bz = rows[n], r = rows[sel] ?? bz;
          let s = `$\\gcd(${a}, ${b}) = ${g} = ${a}\\cdot ${par(bz.x)} + ${b}\\cdot ${par(bz.y)}$ ✓.`;
          if (sel != null && rows[sel]) {
            s += ` Row ${sel}: $r_{${sel}} = ${r.r} = ${a}\\cdot ${par(r.x)} + ${b}\\cdot ${par(r.y)}$`;
            if (r.x * r.y < 0) s += ` — on the rulers, the marks $${Math.abs(r.x)}a = ${Math.abs(r.x) * a}$ and $${Math.abs(r.y)}b = ${Math.abs(r.y) * b}$ are ${r.r} apart.`;
            else s += '.';
          }
          if (pos.value) s += ` With $x, y \\ge 0$ the smallest positive value is $\\min(a, b) = ${Math.min(a, b)}$` + (Math.min(a, b) > g ? ', not $g$: a gap between two marks needs a minus sign, so negative coefficients are essential.' : ' (here $g$ itself, because one number divides the other).');
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Lemma',
      name: 'Euclid’s lemma',
      statement: String.raw`Let $p$ be a prime and $a,b$ integers. If $p\mid ab$, then $p\mid a$ or $p\mid b$. More generally, if $n\mid ab$ and $\gcd(n,a)=1$, then $n\mid b$.

The hypothesis that $p$ is prime cannot be dropped: $6\mid 4\cdot 3$, yet $6\nmid4$ and $6\nmid3$.`,
      idea: String.raw`Suppose $p\nmid a$. The only positive divisors of $p$ are $1$ and $p$, so $\gcd(p,a)=1$, and Bézout (1.4) gives $px+ay=1$. Multiply by $b$: $b=p(bx)+(ab)y$. Both terms on the right are multiples of $p$ (the second because $p\mid ab$), so $p\mid b$. For composite $n$ the argument stops at the first line — $\gcd(n,a)$ can be a proper divisor of $n$, and then no certificate $nx+ay=1$ exists.`,
      caption: String.raw`Each cell $(a,b)$ is coloured when $n\mid ab$: blue when $n\mid a$, orange when $n\mid b$, green when both. For prime $n$ the coloured cells are exactly these stripes. Slide $n$ to a composite number and red cells appear — $n\mid ab$ with $n$ dividing neither factor. Click a cell to see the Bézout certificate that forces $p\mid b$, or why it does not exist.`,
      deps: ['nt-1.4'],
      tags: ['primes', 'divisibility'],
      credit: 'Euclid, Elements VII.30, c. 300 BC',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euclid%27s_lemma' },
      viz(v) {
        const M = v.M, NMAX = 30;
        const n = v.slider('$n$', 2, 30, 7, { int: true });
        const S = v.stage({ x: [-1.6, NMAX + 0.6], y: [-1.4, NMAX + 0.6], equal: true, axes: false, height: 440, weight: 1.15, minWidth: 330, title: 'cells with $n \\mid ab$' });
        const Rw = v.stage({ x: [-0.8, 7], y: [-1.4, NMAX + 0.6], axes: false, height: 440, weight: 0.85, minWidth: 250 });
        let sel = [10, 21];
        S.onClick((x, y) => { const a = Math.round(x), b = Math.round(y); if (a >= 1 && a <= NMAX && b >= 1 && b <= NMAX) sel = [a, b]; });
        v.legend([['blue', '$n \\mid a$', { area: true }], ['orange', '$n \\mid b$', { area: true }], ['green', 'both', { area: true }], ['red', '$n \\mid ab$ although $n \\nmid a$ and $n \\nmid b$', { area: true }]]);
        let rogue = 0;
        v.render(() => {
          const N = n.value; rogue = 0;
          for (let a = 1; a <= NMAX; a++) for (let b = 1; b <= NMAX; b++) {
            const da = a % N === 0, db = b % N === 0, dab = (a * b) % N === 0;
            let st = null;
            if (da && db) st = { fill: 'green', fillAlpha: 0.6 };
            else if (da) st = { fill: 'blue', fillAlpha: 0.45 };
            else if (db) st = { fill: 'orange', fillAlpha: 0.45 };
            else if (dab) { st = { fill: 'red', fillAlpha: 0.8 }; rogue++; }
            if (st) S.rect(a - 0.5, b - 0.5, a + 0.5, b + 0.5, { ...st, stroke: false });
          }
          for (let k = 0; k <= NMAX; k += 5) { S.line(k + 0.5, 0.5, k + 0.5, NMAX + 0.5, { color: 'grid', width: 1 }); S.line(0.5, k + 0.5, NMAX + 0.5, k + 0.5, { color: 'grid', width: 1 }); }
          S.rect(0.5, 0.5, NMAX + 0.5, NMAX + 0.5, { color: 'muted', width: 1 });
          for (let k = 5; k <= NMAX; k += 5) { S.text(String(k), k, -0.2, { align: 'center', size: 10.5, color: 'muted' }); S.text(String(k), -0.2, k, { align: 'right', size: 10.5, color: 'muted' }); }
          S.text('a', NMAX / 2, -1.0, { math: true, color: 'muted', align: 'center' }); S.text('b', -1.3, 17.5, { math: true, color: 'muted', align: 'center' });
          const [a, b] = sel; S.rect(a - 0.5, b - 0.5, a + 0.5, b + 0.5, { color: 'ink', width: 2.6 });
          S.setTitle(M.isPrime(N) ? `cells with $n \\mid ab$ — $n = ${N}$ is prime: **no red cells**` : `cells with $n \\mid ab$ — $n = ${N} = ${M.primeFactors(N).join('\\cdot ')}$: **${rogue} red cells**`);
          // the selected row a, sliced: remainders of ab mod n, aligned with the rows b of the grid
          const yb = S.bounds.y; Rw.setView([-0.12 * N - 0.6, N + 0.4], yb);
          Rw.setTitle(`row $a = ${a}$: remainders $ab \\bmod ${N}$`);
          for (let bb = 1; bb <= NMAX; bb++) {
            const rem = (a * bb) % N, rogueCell = rem === 0 && a % N !== 0 && bb % N !== 0;
            if (rem) Rw.rect(0, bb - 0.36, rem, bb + 0.36, { fill: 'accent', fillAlpha: 0.32, color: 'accent', width: 1 });
            else Rw.rect(-0.09 * N - 0.3, bb - 0.36, 0, bb + 0.36, { fill: rogueCell ? 'red' : a % N === 0 ? (bb % N === 0 ? 'green' : 'blue') : 'orange', fillAlpha: 0.8, stroke: false });
            if (bb === b) Rw.rect(-0.12 * N - 0.5, bb - 0.5, N + 0.3, bb + 0.5, { color: 'ink', width: 1.6 });
          }
          Rw.line(0, 0.5, 0, NMAX + 0.5, { color: 'muted', width: 1.2 });
          Rw.text('0', 0, -0.2, { align: 'center', size: 10.5, color: 'muted' });
          const zeros = []; for (let bb = 1; bb <= NMAX; bb++) if ((a * bb) % N === 0) zeros.push(bb);
          Rw.corner(a % N === 0 ? 'n | a: every b works' : M.gcd(a, N) === 1 ? `zero only at multiples of ${N}` : `extra zeros: gcd(${a}, ${N}) = ${M.gcd(a, N)}`, 'br', { size: 11, color: a % N !== 0 && M.gcd(a, N) > 1 ? 'red' : 'muted', weight: 600 });
        });
        v.readout(() => {
          const N = n.value, [a, b] = sel, ab = a * b, prime = M.isPrime(N);
          const head = `Cell $(a, b) = (${a}, ${b})$: $ab = ${ab}$, $${ab} \\bmod ${N} = ${ab % N}$. `;
          if (ab % N !== 0) return head + `$${N} \\nmid ab$, so the lemma says nothing here.` + (prime ? '' : ` (Red cells so far: ${rogue}.)`);
          if (a % N === 0) return head + `$${N} \\mid a$ directly.`;
          const gg = M.gcd(N, a);
          if (gg === 1) {
            const { x, y } = M.egcd(N, a);
            return head + `$${N} \\nmid a$, but $\\gcd(${N}, ${a}) = 1$ and Bézout gives $${N}\\cdot ${par(x)} + ${a}\\cdot ${par(y)} = 1$. Multiply by $b$: $${b} = ${N}\\cdot ${par(b * x)} + ${ab}\\cdot ${par(y)}$ — both terms are multiples of $${N}$, so $${N} \\mid ${b}$ ✓.`;
          }
          return head + `$${N} \\mid ab$, yet $${N} \\nmid ${a}$ and $${N} \\nmid ${b}$: **the lemma fails**. The proof breaks because $\\gcd(${N}, ${a}) = ${gg} \\ne 1$, so there is no certificate $${N}x + ${a}y = 1$ — the factors of $${N} = ${M.primeFactors(N).join('\\cdot ')}$ are shared out between $a$ and $b$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Theorem',
      name: 'Fundamental theorem of arithmetic',
      statement: String.raw`Every integer $n\ge2$ is a product of primes,
$$n=p_1p_2\cdots p_k ,$$
and this factorization is unique apart from the order of the factors. Equivalently, $n=\prod_p p^{v_p(n)}$ with exponents $v_p(n)\ge0$ that are uniquely determined by $n$ (and zero for all but finitely many $p$).`,
      idea: String.raw`*Existence:* if $n$ is not prime, split it as $n=de$ with $1<d,e<n$ and factor $d$ and $e$ — this stops because the factors shrink (strong induction). *Uniqueness:* if $p_1\cdots p_k=q_1\cdots q_l$, then $p_1$ divides the right side, so by Euclid’s lemma (1.5, applied repeatedly) $p_1\mid q_j$ for some $j$, hence $p_1=q_j$; cancel and repeat. It is Euclid’s lemma that makes the theorem true — in number systems where irreducible elements are not "prime" in that sense, factor trees can end differently (see 1.7).`,
      caption: String.raw`Two factor trees of the same $n$. Click any blue (composite) node to split it a different way — every node can be re-split — or press *shuffle routes*. However the trees grow, the leaves are always the same multiset of primes. Then switch to the even numbers $2\mathbb Z$, where the "atoms" are the numbers $2\times$odd: the same game now ends in different multisets.`,
      deps: ['nt-1.5'],
      tags: ['primes', 'factorization'],
      credit: 'Euclid, Elements VII–IX; first complete proof Gauss, 1801',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fundamental_theorem_of_arithmetic' },
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 4, 3000, 360, { int: true });
        const uni = v.select('numbers', [{ value: 'Z', label: 'integers $\\mathbb Z$' }, { value: '2Z', label: 'even numbers $2\\mathbb Z$' }], 'Z', { onChange: (u) => { if (u === '2Z') nS.set(72); else nS.set(360); } });
        let seed = 1;
        v.button('shuffle routes', () => { seed++; const r = v.rng(seed * 7919); trees = [grow(N, (sp) => r.int(0, sp.length - 1)), grow(N, (sp) => r.int(0, sp.length - 1))]; });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'route 1: split near $\\sqrt m$ first' });
        const Rr = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'route 2: split off the smallest factor first' });
        const stages = [L, Rr];
        const even = () => uni.value === '2Z';
        const splits = (m) => { const out = []; for (let d = 2; d * d <= m; d++) if (m % d === 0 && (!even() || (d % 2 === 0 && (m / d) % 2 === 0))) out.push(d); return out; };
        const grow = (m, pick) => { const sp = splits(m); if (!sp.length) return { n: m, sp, i: -1, kids: null }; const i = pick(sp, m); return { n: m, sp, i, kids: [grow(sp[i], pick), grow(m / sp[i], pick)] }; };
        const near = (sp) => sp.length - 1, small = () => 0;
        const LEAF = ['green', 'orange', 'purple', 'pink', 'teal', 'gold', 'red'];
        let N = 0, trees = [];
        const leaves = (t) => (t.kids ? leaves(t.kids[0]).concat(leaves(t.kids[1])) : [t.n]);
        const cnt = new Map();
        const countTrees = (m) => {
          if (cnt.has(m)) return cnt.get(m);
          const sp = splits(m); let c = sp.length ? 0 : 1;
          for (const d of sp) { const e = m / d; c += d === e ? (countTrees(d) * (countTrees(d) + 1)) / 2 : countTrees(d) * countTrees(e); }
          cnt.set(m, c); return c;
        };
        let geo = [[], []];
        stages.forEach((S, si) => S.onClick((x, y) => {
          const X = S.X(x), Y = S.Y(y);
          for (const nd of geo[si]) if (Math.hypot(nd.X - X, nd.Y - Y) <= nd.r + 3 && nd.t.kids && nd.t.sp.length > 1) {
            const t = nd.t; t.i = (t.i + 1) % t.sp.length; t.kids = [grow(t.sp[t.i], near), grow(t.n / t.sp[t.i], near)]; return;
          }
        }));
        let key = '';
        v.render(() => {
          let n = nS.value; if (even() && n % 2) n++;
          const k = `${uni.value}|${n}`;
          if (k !== key) { key = k; N = n; cnt.clear(); trees = [grow(N, near), grow(N, small)]; }
          const sorted = trees.map((t) => leaves(t).sort((p, q) => p - q));
          const atoms = [...new Set(sorted.flat())].sort((p, q) => p - q);
          const same = sorted[0].join() === sorted[1].join();
          stages.forEach((S, si) => {
            const t = trees[si];
            let leaf = 0, depth = 0;
            const walk = (nd, dep) => { nd.dep = dep; depth = Math.max(depth, dep); if (!nd.kids) { nd.x = leaf++; return; } walk(nd.kids[0], dep + 1); walk(nd.kids[1], dep + 1); nd.x = (nd.kids[0].x + nd.kids[1].x) / 2; };
            walk(t, 0);
            const W = S.width, H = S.height, top = 26, bot = 44;
            const dx = (W - 30) / Math.max(1, leaf), dy = depth ? Math.min(80, (H - top - bot) / depth) : 0;
            const X = (nd) => 15 + dx * (nd.x + 0.5), Y = (nd) => top + dy * nd.dep;
            const r = M.clamp(Math.min(dx * 0.46, dy ? dy * 0.42 : 30, 6 + 3.6 * String(N).length), 8, 22);
            geo[si] = [];
            const draw = (nd) => {
              if (nd.kids) for (const kd of nd.kids) { S.ctx.save(); S.ctx.strokeStyle = v.color('muted', 0.8); S.ctx.lineWidth = 1.6; S.ctx.beginPath(); S.ctx.moveTo(X(nd), Y(nd)); S.ctx.lineTo(X(kd), Y(kd)); S.ctx.stroke(); S.ctx.restore(); draw(kd); }
            };
            draw(t);
            const nodesDraw = (nd) => {
              const col = nd.kids ? 'blue' : LEAF[atoms.indexOf(nd.n) % LEAF.length], X0 = X(nd), Y0 = Y(nd);
              pdisc(v, S, X0, Y0, r, { fill: col, fillAlpha: nd.kids ? 0.18 : 0.35, stroke: col, width: nd.kids && nd.sp.length > 1 ? 2 : 1.5, dash: nd.kids && nd.sp.length > 1 ? null : null });
              const s = String(nd.n), fs = Math.min(13, (r * 2.1) / Math.max(1.6, s.length * 0.62));
              S.textPx(s, X0, Y0 + 0.5, { align: 'center', size: fs, weight: 650, halo: false, color: 'ink' });
              geo[si].push({ X: X0, Y: Y0, r, t: nd });
              if (nd.kids) nd.kids.forEach(nodesDraw);
            };
            nodesDraw(t);
            const txt = 'leaves: ' + sorted[si].join(' · ');
            S.textPx(txt.length > 70 ? txt.slice(0, 68) + '…' : txt, W / 2, H - 16, { align: 'center', size: 12.5, weight: 650, color: same ? 'green' : 'red' });
          });
        });
        v.legend([['blue', 'composite — click to split another way', { dot: true }], ['green', 'leaves (atoms), one colour per value', { dot: true }]]);
        v.readout(() => {
          if (!trees.length) return '';
          const s0 = leaves(trees[0]).sort((p, q) => p - q), s1 = leaves(trees[1]).sort((p, q) => p - q), same = s0.join() === s1.join();
          if (!even()) return M.isPrime(N) ? `$n = ${N}$ is prime: its factor tree is a single node.` : `$n = ${N} = ${facTex(M, N)}$. Both routes end in the same primes ${same ? '✓' : '✗'} — and so do all **${countTrees(N)}** different factor trees of $${N}$.`;
          return `In $2\\mathbb Z$ the atoms are the even numbers that are not a product of two even numbers: $2, 6, 10, 14, 18, \\dots$ ($2\\times$odd). ` + (same ? `For $${N}$ these two routes agree (${s0.join('·')}) — try another split, or $n = 72$ or $180$.` : (() => { const u = s0.find((p) => !s1.includes(p)) ?? s0[0], w = s1.find((x) => x % u === 0 && x !== u); return `Here $${N} = ${s0.join('\\cdot ')} = ${s1.join('\\cdot ')}$: **two different factorizations into atoms**. There is no Euclid’s lemma in $2\\mathbb Z$: the atom $${u}$ divides $${N} = ${u}\\cdot ${N / u}$ inside $2\\mathbb Z$ (the cofactor is even), yet it divides none of the atoms $${s1.join(', ')}$ there` + (w ? ` — even $${w} = ${u}\\cdot ${w / u}$ does not count, since $${w / u}$ is odd.` : '.'); })());
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Proposition',
      name: 'Unique factorization fails in the monoid 1 + 4ℕ',
      statement: String.raw`The set $H=\{1,5,9,13,\dots\}=\{n\ge1 : n\equiv1 \pmod 4\}$ is closed under multiplication. Call $h\in H$, $h>1$, *irreducible in $H$* if it is not a product of two elements of $H$ that are both $>1$. Every $h>1$ in $H$ is a product of irreducibles of $H$, but not uniquely:
$$441=9\cdot49=21\cdot21,$$
where $9$, $21$ and $49$ are all irreducible in $H$. Correspondingly Euclid’s lemma fails in $H$: $9\mid 21\cdot21$ but $9\nmid21$. The same happens in $1+m\N$ for every $m\ge3$, while $1+2\N$ (the odd numbers) factors uniquely.`,
      idea: String.raw`Existence works exactly as in $\Z$ (split while you can; elements shrink). Uniqueness fails because the primes $\equiv3 \pmod 4$ are not in $H$ — only their *products in pairs* are — and the same four primes $3,3,7,7$ can be paired up as $(3\cdot3)(7\cdot7)$ or as $(3\cdot7)(3\cdot7)$. The proof of 1.6 breaks at Euclid’s lemma: its proof used Bézout, which needs subtraction, and $H$ is not closed under subtraction. For the odd numbers no pairing problem arises, because every prime factor of an odd number is itself odd.`,
      caption: String.raw`The grid lists the first elements of the monoid $1+m\N$. Green: irreducible and prime in $\Z$; purple: irreducible in the monoid although composite in $\Z$; red: elements with two or more factorizations into irreducibles. Click an element: the right panel lays out its primes in $\Z$ and, one row per factorization, how they are grouped into irreducible factors. Change $m$ — only $m=2$ is free of red.`,
      deps: ['nt-1.6'],
      see: ['nt-13.3'],
      tags: ['factorization', 'counterexamples'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hilbert_number' },
      viz(v) {
        const M = v.M, COLS = 15, ROWS = 12;
        const mS = v.select('monoid', [2, 3, 4, 5, 7].map((m) => ({ value: m, label: m === 2 ? '$1 + 2\\mathbb N$ (odd)' : `$1 + ${m}\\mathbb N$` })), 4, { onChange: () => { sel = null; } });
        const G = v.stage({ x: [-0.5, COLS - 0.5], y: [-ROWS + 0.5, 0.5], equal: true, axes: false, height: 400, weight: 1.15, minWidth: 330 });
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1, minWidth: 300 });
        let sel = null, data = null;
        const build = (m) => {
          const els = []; for (let i = 0; i < COLS * ROWS; i++) els.push(1 + m * i);
          const inH = (x) => x >= 1 && x % m === 1 % m;
          const irr = new Map();
          const isIrr = (h) => { if (h === 1) return false; if (irr.has(h)) return irr.get(h); let ok = true; for (let d = 2; d * d <= h; d++) if (h % d === 0 && inH(d) && inH(h / d)) { ok = false; break; } irr.set(h, ok); return ok; };
          const facts = (h, lo) => { if (h === 1) return [[]]; const out = []; for (let d = lo; d <= h; d++) { if (h % d || !inH(d) || !isIrr(d)) continue; for (const rest of facts(h / d, d)) out.push([d, ...rest]); } return out; };
          const info = els.map((h) => ({ h, irr: isIrr(h), facts: h === 1 ? [[]] : facts(h, 2) }));
          return { m, els, info };
        };
        G.onClick((x, y) => { const c = Math.round(x), r = -Math.round(y); if (c >= 0 && c < COLS && r >= 0 && r < ROWS) sel = data.els[r * COLS + c]; });
        v.render(() => {
          const m = mS.value;
          if (!data || data.m !== m) data = build(m);
          if (sel == null) sel = m === 4 ? 441 : m === 2 ? 315 : (data.info.find((d) => d.facts.length > 1) || data.info[20]).h;
          // grid
          data.info.forEach((d, i) => {
            const c = i % COLS, r = Math.floor(i / COLS), x = c, y = -r;
            let st = null;
            if (d.h === 1) st = { fill: 'gray', fillAlpha: 0.25 };
            else if (d.irr) st = M.isPrime(d.h) ? { fill: 'green', fillAlpha: 0.3 } : { fill: 'purple', fillAlpha: 0.4 };
            else if (d.facts.length > 1) st = { fill: 'red', fillAlpha: 0.32 };
            if (st) G.rect(x - 0.47, y - 0.47, x + 0.47, y + 0.47, { ...st, stroke: false });
            if (d.facts.length > 1) G.rect(x - 0.47, y - 0.47, x + 0.47, y + 0.47, { color: 'red', width: 1.4 });
            if (d.h === sel) G.rect(x - 0.5, y - 0.5, x + 0.5, y + 0.5, { color: 'ink', width: 2.6 });
            const s = String(d.h);
            G.text(s, x, y, { align: 'center', size: Math.min(11.5, (G.scale * 0.92) / Math.max(2.2, s.length * 0.6)), weight: d.irr ? 650 : 500, color: d.irr || d.facts.length > 1 ? 'ink' : 'muted', halo: false });
          });
          // panel: the selected element
          const W = P.width, H = P.height, info = data.info.find((d) => d.h === sel);
          if (!info) return;
          const zf = M.primeFactors(sel);
          P.texPx(`${sel} = ${sel === 1 ? '1' : facTex(M, sel)}\\ \\text{in } \\mathbb Z`, W / 2, 24, { size: 16 });
          const cw = Math.min(46, (W - 40) / Math.max(1, zf.length)), x0 = W / 2 - (cw * zf.length) / 2, cy = 66;
          zf.forEach((p, i) => {
            const res = p % m, ok = res === 1 % m, col = ok ? 'green' : 'orange';
            rbox(v, P, x0 + i * cw + 3, cy - 14, cw - 6, 28, 7, { fill: col, fillAlpha: 0.22, stroke: col, width: 1.4 });
            P.textPx(String(p), x0 + (i + 0.5) * cw, cy, { align: 'center', size: 13, weight: 650, halo: false });
            P.textPx(`≡${res}`, x0 + (i + 0.5) * cw, cy + 22, { align: 'center', size: 10, color: col, halo: false });
          });
          P.textPx(`primes in ℤ, with residues mod ${m}`, W / 2, cy + 38, { align: 'center', size: 10.5, color: 'muted' });
          // one row per factorization: the same primes, grouped into irreducible factors of the monoid
          const fl = info.facts.slice(0, 4), laneH = Math.min(70, (H - cy - 64) / Math.max(1, fl.length));
          fl.forEach((fac, j) => {
            const Y = cy + 66 + laneH * j;
            P.texPx(`${sel} = ${fac.length ? fac.join('\\cdot ') : '1'}`, 12, Y, { align: 'left', size: 14, color: info.facts.length > 1 ? 'red' : 'ink' });
            const groups = fac.map((h) => M.primeFactors(h)), total = groups.reduce((t, gp) => t + gp.length, 0);
            const gw = Math.min(30, (W - 40 - 12 * groups.length) / Math.max(1, total)), rowW = total * gw + 12 * (groups.length - 1);
            let X = W / 2 - rowW / 2;
            const Yc = Y + laneH * 0.48;
            groups.forEach((gp, gi) => {
              const shade = PALETTE[(j * 2 + gi) % 6];
              rbox(v, P, X - 3, Yc - 13, gp.length * gw + 6, 26, 8, { fill: shade, fillAlpha: 0.12, stroke: shade, width: 1.8 });
              gp.forEach((p, pi) => { const ok = p % m === 1 % m; P.textPx(String(p), X + (pi + 0.5) * gw, Yc, { align: 'center', size: 12.5, weight: 650, color: ok ? 'green' : 'orange', halo: false }); });
              P.textPx(String(fac[gi]), X + (gp.length * gw) / 2, Yc + 21, { align: 'center', size: 10.5, weight: 650, color: shade });
              X += gp.length * gw + 12;
            });
          });
          if (info.facts.length > 4) P.textPx(`… ${info.facts.length - 4} more`, 12, H - 12, { size: 11, color: 'muted' });
        });
        v.legend([['green', 'irreducible, prime in $\\mathbb Z$', { area: true }], ['purple', 'irreducible, composite in $\\mathbb Z$', { area: true }], ['red', 'two or more factorizations', { area: true }]]);
        v.readout(() => {
          if (!data) return '';
          const m = data.m, info = data.info.find((d) => d.h === sel), nonU = data.info.filter((d) => d.facts.length > 1).length;
          let s = `$1 + ${m}\\mathbb N$: ${nonU} of the ${COLS * ROWS} elements shown factor in more than one way. `;
          if (m === 2) s += 'Odd numbers: every prime factor of an odd number is odd, so the irreducibles are just the odd primes and factorization is unique — the control case. ';
          if (info && info.facts.length > 1) {
            const [F1, F2] = info.facts, u = F1.find((h) => !F2.includes(h)) ?? F1[0], w = F2.find((h) => h % u !== 0) ?? F2[0];
            s += `$${sel} = ${F1.join('\\cdot ')} = ${F2.join('\\cdot ')}$. Euclid’s lemma fails: the irreducible $${u}$ divides $${F2.join('\\cdot ')}$ but does not divide the factor $${w}$` + (F2.every((h) => h % u !== 0) ? ' — nor any other factor.' : '.');
          } else if (info) s += `$${sel}$ ${info.irr ? 'is irreducible in the monoid' : `has the single factorization $${info.facts[0].join('\\cdot ')}$`}.`;
          return s;
        });
      },
    },
  ],
};
