// Combinatorics — Chapter 1: Basic counting (items 1.11–1.19; 1.1–1.10 are in ch01.js)
import { CAT, LET, commas, binom, binomBig, fact, fall, fallX, stirling1, stirling2, partsTable, kSubsets, perms, setPartitions, blocksOf, intPartitions, conjugate, cyclesOf, fitGrid, pen, toPx, drawArcPartition, drawFerrers } from './ch01.shared.js';

/** Multiset permutations of a word given as letter counts [a, b, c, …] (lexicographic, letters 0, 1, 2, …). */
function wordsOf(counts) {
  const out = [], cur = [], c = counts.slice(), n = counts.reduce((a, b) => a + b, 0);
  const go = () => {
    if (cur.length === n) { out.push(cur.slice()); return; }
    for (let i = 0; i < c.length; i++) if (c[i]) { c[i]--; cur.push(i); go(); cur.pop(); c[i]++; }
  };
  go();
  return out;
}
/** Number of distinct arrangements of a word, by depth-first enumeration (no formula used). */
function countArrangements(word) {
  const m = new Map(); for (const ch of word) m.set(ch, (m.get(ch) || 0) + 1);
  const c = [...m.values()], n = word.length; let cnt = 0;
  const go = (d) => { if (d === n) { cnt++; return; } for (let i = 0; i < c.length; i++) if (c[i]) { c[i]--; go(d + 1); c[i]++; } };
  go(0);
  return cnt;
}
/** Partition drawn as coloured blobs: points on a circle, each block a rounded convex region. */
function drawBlobs(v, P, rgs, cx, cy, R, st = {}) {
  const n = rgs.length, c = P.ctx, pad = st.pad ?? Math.max(3, R * 0.3);
  const pts = Array.from({ length: n }, (_, i) => [cx + R * Math.sin((2 * Math.PI * i) / n), cy - R * Math.cos((2 * Math.PI * i) / n)]);
  blocksOf(rgs).forEach((blk, b) => {
    const col = CAT[b % CAT.length];
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 2 * pad;
    c.strokeStyle = v.color(col, 0.32); c.fillStyle = v.color(col, 0.32);
    c.beginPath();
    if (blk.length === 1) { c.arc(pts[blk[0]][0], pts[blk[0]][1], pad, 0, 2 * Math.PI); c.fill(); }
    else { blk.forEach((i, t) => (t ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]))); if (blk.length > 2) { c.closePath(); c.fill(); } c.stroke(); }
    c.restore();
  });
  pts.forEach(([x, y], i) => {
    P.dot(x, y, Math.max(1.6, pad * 0.55), { fill: CAT[rgs[i] % CAT.length] });
    if (st.labels) P.text(String(i + 1), x, y, { align: 'center', size: Math.max(7, pad * 0.85), color: 'panel', weight: 700, halo: false });
  });
}
/** Seating chart of a permutation: one round table per cycle, guests clockwise in cycle order. */
function drawTables(v, P, p, x, y, w, h, st = {}) {
  const cyc = cyclesOf(p), n = p.length, gap = w * 0.04;
  const wts = cyc.map((c) => 0.8 + c.length * 0.45), tot = wts.reduce((a, b) => a + b, 0);
  let cx = x + gap / 2;
  cyc.forEach((c, t) => {
    const cw = ((w - gap * cyc.length) * wts[t]) / tot, R = Math.min(cw / 2, h / 2) * 0.62, ox = cx + cw / 2, oy = y + h / 2;
    P.circle(ox, oy, R * (c.length === 1 ? 0.55 : 0.78), { fill: 'muted', fillAlpha: 0.12, color: 'faint', width: 1 });
    const pr = Math.max(2.2, Math.min(R * 0.42, (Math.PI * R) / Math.max(2, c.length) * 0.7));
    c.forEach((g, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / c.length, gx = ox + (c.length === 1 ? 0 : R * Math.cos(a)), gy = oy + (c.length === 1 ? -R * 0.55 - pr * 0.2 : R * Math.sin(a));
      if (c.length >= 3 && st.arrows) { const a2 = a + (2 * Math.PI) / c.length; P.arc(ox, oy, R * 0.55, a + 0.35, a2 - 0.35, { color: 'muted', width: 1 }); }
      P.dot(gx, gy, pr, { fill: CAT[g % CAT.length] });
      if (st.ring && st.ring(g)) P.circle(gx, gy, pr + 2, { color: 'ink', width: 1.4 });
      if (pr >= 6) P.text(String(g + 1), gx, gy, { align: 'center', size: pr * 1.15, color: 'panel', weight: 700, halo: false });
    });
    cx += cw + gap;
  });
  return n;
}
/** Signed Stirling numbers of the first kind s(n,k) = (−1)^{n−k} c(n,k). */
const sgnS1 = (c, n, k) => ((n - k) % 2 ? -1 : 1) * c[n][k];
/** Symmetric log transform for plots that span many orders of magnitude around 0. */
const slog = (y) => Math.sign(y) * Math.log10(1 + Math.abs(y));
/** Split a panel of height H into a top and a bottom gallery so that the smaller item size is as large as possible. */
function splitHeight(H, W, nTop, aspTop, nBot, aspBot, maxTop = Infinity, maxBot = Infinity, head = 30) {
  if (!nTop) return 34; if (!nBot) return H - 34;
  let best = H / 2, bs = -1;
  for (let h = 60; h <= H - 60; h += 6) {
    const score = Math.min(fitGrid(nTop, W, h - head, aspTop, 6, maxTop).h, fitGrid(nBot, W, H - h - head, aspBot, 8, maxBot).h);
    if (score > bs + 1e-9) { bs = score; best = h; }
  }
  return best;
}

export default {
  collection: 'comb',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'Multisets: stars and bars',
      statement: String.raw`A **multiset** of size $n$ on a $k$-element set is a choice of $n$ elements with repetition allowed and order ignored — equivalently a solution of $x_1+\cdots+x_k = n$ in nonnegative integers ($x_i$ = multiplicity of element $i$), or a way of giving $n$ identical sweets to $k$ children. Their number is
$$\left(\!\binom kn\!\right) = \binom{n+k-1}{k-1} = \binom{n+k-1}{n}.$$
If every child must get at least one sweet ($x_i\ge 1$) the number is $\binom{n-1}{k-1}$.`,
      idea: String.raw`Write the $n$ sweets as stars and separate the children's shares by $k-1$ bars: every distribution is a row of $n+k-1$ symbols, and every row is a distribution. Choosing where the bars go among the $n+k-1$ positions is choosing a $(k-1)$-subset (1.6). If every share must be nonempty, the bars must sit in distinct gaps *between* stars — $k-1$ of the $n-1$ gaps.`,
      caption: String.raw`Drag the bars along the row. The stars between consecutive bars go to one child (colours match the boxes below), so the row *is* the distribution. The gallery lists every arrangement, with yours highlighted; click one to load it. Turn on "everyone gets at least one" to restrict the bars to the gaps between stars.`,
      deps: ['comb-1.6'],
      refs: ['Stanley EC1 §1.2'],
      tags: ['multisets', 'bijections'],
      viz(v) {
        const nS = v.slider('sweets $n$', 1, 8, 5, { int: true, onChange: () => reset() });
        const kS = v.slider('children $k$', 2, 4, 3, { int: true, onChange: () => reset() });
        const pos = v.toggle('everyone gets at least one', false, { onChange: () => reset() });
        const A = v.stage({ x: [-0.8, 6.8], y: [-2.2, 1.75], axes: false, height: 220, full: true });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true, title: 'every arrangement (click one)' });
        const cands = () => { const n = nS.value, k = kS.value; return pos.value ? Array.from({ length: Math.max(0, n - 1) }, (_, g) => g + 0.5) : Array.from({ length: n + k - 1 }, (_, i) => i); };
        const hs = Array.from({ length: 3 }, () => A.handle(0, 1, { color: 'ink', r: 9 }));
        hs.forEach((h, idx) => {
          h.constrain = (x) => {
            const taken = hs.filter((g, j) => j !== idx && g.visible).map((g) => g.x); let best = null, bd = Infinity;
            for (const c of cands()) { if (taken.some((t) => Math.abs(t - c) < 1e-6)) continue; const d = Math.abs(c - x); if (d < bd) { bd = d; best = c; } }
            return [best ?? h.x, 1];
          };
        });
        function setDist(d) { // bars from a distribution d (k parts)
          const k = kS.value; let acc = 0;
          for (let j = 0; j < 3; j++) {
            hs[j].visible = j < k - 1;
            if (j < k - 1) { acc += d[j]; hs[j].x = pos.value ? acc - 0.5 : acc + j; hs[j].y = 1; }
          }
          v.invalidate();
        }
        function reset() {
          const n = nS.value, k = kS.value;
          if (pos.value && n < k) { hs.forEach((h) => { h.visible = false; }); v.invalidate(); return; }
          const d = Array.from({ length: k }, (_, i) => Math.floor((n + i) / k)); // as even as possible
          if (!pos.value && n >= 3) { d[0] += d[1]; d[1] = 0; } // show an empty share by default
          setDist(d);
        }
        reset();
        const distOf = () => {
          const n = nS.value, k = kS.value, bars = hs.slice(0, k - 1).map((h) => h.x).sort((a, b) => a - b);
          if (pos.value) { if (n < k) return null; const g = [0, ...bars.map((b) => b + 0.5), n]; return g.slice(1).map((x, i) => x - g[i]); }
          const S = n + k - 1, p = [-1, ...bars, S]; return p.slice(1).map((x, i) => x - p[i] - 1);
        };
        let gal = null;
        B.onClick((x, y) => {
          if (!gal) return; const [px, py] = toPx(B, x, y);
          gal.items.forEach((bars, i) => { const [gx, gy] = gal.g.at(i); if (px >= gx && px <= gx + gal.g.w && py >= gy && py <= gy + gal.g.h) { const n = nS.value, k = kS.value; const d = []; let prev = pos.value ? 0 : -1; bars.forEach((b) => { d.push(pos.value ? b + 1 - prev : b - prev - 1); prev = pos.value ? b + 1 : b; }); d.push(pos.value ? n - prev : n + k - 2 - prev); setDist(d); } });
        });
        v.render(() => {
          const n = nS.value, k = kS.value, d = distOf(), S = pos.value ? n : n + k - 1;
          A.setView([-0.8, S - 0.2], [-2.2, 1.75]);
          if (!d) {
            A.text(`with k = ${k} children and only n = ${n} sweets nobody can be left out of — impossible`, (S - 1) / 2, 0.2, { align: 'center', size: 13, color: 'red', weight: 600 });
          } else {
            const owner = []; // child receiving the star in each slot
            if (pos.value) { let c = 0, acc = d[0]; for (let i = 0; i < n; i++) { while (i >= acc) { c++; acc += d[c]; } owner.push(c); } }
            A.line(-0.6, 0.42, S - 0.4, 0.42, { color: 'faint', width: 1 });
            const bars = hs.slice(0, k - 1).map((h) => h.x);
            if (pos.value) for (let g = 1; g < n; g++) A.line(g - 0.5, 0.55, g - 0.5, 0.75, { color: 'faint', width: 1.5 });
            let child = 0;
            for (let i = 0; i < S; i++) {
              if (!pos.value && bars.some((b) => Math.abs(b - i) < 1e-6)) { child++; continue; }
              const c = pos.value ? owner[i] : child;
              A.text('★', i, 1, { align: 'center', size: 26, color: CAT[c % CAT.length], halo: false });
            }
            bars.forEach((b) => A.line(b, 0.48, b, 1.55, { color: 'ink', width: 3.2 }));
            A.text(pos.value ? `${n} stars, bars in ${k - 1} of the ${n - 1} gaps` : `${S} slots: ${n} stars and ${k - 1} bars`, -0.6, 1.62, { size: 12, color: 'muted', weight: 600, baseline: 'top' });
            // children
            const span = S + 0.2, bw = span / k;
            for (let c = 0; c < k; c++) {
              const x0 = -0.6 + c * bw + bw * 0.06, x1 = x0 + bw * 0.88;
              A.rect(x0, -2.05, x1, -0.45, { fill: CAT[c % CAT.length], fillAlpha: 0.08, color: CAT[c % CAT.length], width: 1.5 });
              A.text(`child ${c + 1}: ${d[c]}`, (x0 + x1) / 2, -0.62, { align: 'center', size: 12, weight: 700, color: CAT[c % CAT.length], baseline: 'top' });
              for (let t = 0; t < d[c]; t++) { const per = Math.max(1, Math.floor((x1 - x0 - 0.2) / 0.5)); A.text('★', x0 + 0.35 + (t % per) * 0.5, -1.35 - Math.floor(t / per) * 0.45, { size: 19, color: CAT[c % CAT.length], halo: false }); }
            }
          }
          // gallery
          const P = pen(v, B), W = P.W, H = P.H;
          const items = pos.value ? (n >= k ? kSubsets(n - 1, k - 1) : []) : kSubsets(n + k - 1, k - 1);
          if (!items.length) { P.text('no arrangements', W / 2, H / 2, { align: 'center', size: 13, color: 'muted' }); gal = null; return; }
          const g = fitGrid(items.length, W - 12, H - 10, 0.34, 5, 150);
          gal = { items, g };
          const cur = hs.slice(0, k - 1).map((h) => (pos.value ? h.x - 0.5 : h.x)).sort((a, b) => a - b);
          items.forEach((bars, i) => {
            const [x, y] = g.at(i), X = x + 6, Y = y + 5, isCur = bars.every((b, j) => b === cur[j]);
            P.rect(X, Y, g.w, g.h, { fill: isCur ? 'gold' : 'muted', fillAlpha: isCur ? 0.25 : 0.05, color: isCur ? 'gold' : 'faint', width: isCur ? 2 : 1, r: 3 });
            const step = g.w / (S + 0.4);
            if (pos.value) {
              for (let t = 0; t < n; t++) P.dot(X + step * (t + 0.7), Y + g.h / 2, Math.max(1.4, step * 0.22), { fill: CAT[bars.filter((b) => b < t).length % CAT.length] });
              bars.forEach((b) => P.line(X + step * (b + 1.2), Y + g.h * 0.18, X + step * (b + 1.2), Y + g.h * 0.82, { color: 'ink', width: 1.6 }));
            } else {
              for (let t = 0, ch = 0; t < S; t++) {
                if (bars.includes(t)) { ch++; P.line(X + step * (t + 0.7), Y + g.h * 0.18, X + step * (t + 0.7), Y + g.h * 0.82, { color: 'ink', width: 1.6 }); }
                else P.dot(X + step * (t + 0.7), Y + g.h / 2, Math.max(1.4, step * 0.22), { fill: CAT[ch % CAT.length] });
              }
            }
          });
        });
        v.readout(() => {
          const n = nS.value, k = kS.value, d = distOf();
          const cnt = pos.value ? binom(n - 1, k - 1) : binom(n + k - 1, k - 1);
          const formula = pos.value ? `\\binom{n-1}{k-1} = \\binom{${n - 1}}{${k - 1}}` : `\\binom{n+k-1}{k-1} = \\binom{${n + k - 1}}{${k - 1}}`;
          return (d ? `Distribution $(${d.join(', ')})$, total $${d.join('+')} = ${n}$ ✓. ` : '') + `Arrangements: $${formula} = ${cnt}$ — the gallery lists ${cnt}.` + (pos.value ? ' Giving each child one sweet first leaves the same count as distributing $n-k$ freely: $\\binom{n-1}{k-1} = \\binom{(n-k)+k-1}{k-1}$.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'Multinomial theorem',
      statement: String.raw`For $a_1+\cdots+a_m = n$ (nonnegative integers) the **multinomial coefficient**
$$\binom{n}{a_1,\dots,a_m} = \frac{n!}{a_1!\,a_2!\cdots a_m!}$$
counts the words of length $n$ containing exactly $a_i$ copies of letter $i$ (the distinct rearrangements of such a word). For all $x_1,\dots,x_m$ in a commutative ring,
$$(x_1+\cdots+x_m)^n = \sum_{a_1+\cdots+a_m = n}\binom{n}{a_1,\dots,a_m}x_1^{a_1}\cdots x_m^{a_m}.$$`,
      idea: String.raw`Give the copies of each letter subscripts so that all $n$ symbols are distinct: there are $n!$ arrangements, and erasing the subscripts identifies exactly $a_1!\cdots a_m!$ of them with each word (product rule over the letters), which proves the count. Expanding the product chooses one variable from each of the $n$ brackets, i.e. writes a word, and the words with $a_i$ copies of $x_i$ all give the same monomial — as in the binomial theorem (1.7), which is the case $m=2$.`,
      caption: String.raw`The triangle holds the coefficients of $(x+y+z)^n$, obtained by expanding all $3^n$ words and tallying monomials (the corners are $x^n$, $y^n$, $z^n$). Click a coefficient: every word with that many $x$'s (blue), $y$'s (orange) and $z$'s (green) is listed on the right, and the list has exactly $n!/(a!\,b!\,c!)$ entries.`,
      deps: ['comb-1.7'],
      refs: ['Stanley EC1 §1.2'],
      tags: ['multinomial', 'words'],
      viz(v) {
        let sel = [2, 2, 2];
        const nS = v.slider('$n$', 1, 7, 6, { int: true, onChange: () => { const n = nS.value; let [a, b] = sel; a = Math.min(a, n); b = Math.min(b, n - a); sel = [a, b, n - a - b]; } });
        const A = v.stage({ x: [-0.2, 1.2], y: [-0.17, 0.99], axes: false, equal: true, height: 360, weight: 1, title: 'coefficients of $(x+y+z)^n$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.25 });
        const cache = new Map();
        const tally = (n) => {
          if (cache.has(n)) return cache.get(n);
          const T = new Map(), N = 3 ** n;
          for (let w = 0; w < N; w++) { let r = w, a = 0, b = 0; for (let i = 0; i < n; i++) { const d = r % 3; r = (r - d) / 3; if (d === 0) a++; else if (d === 1) b++; } const key = a + ',' + b; T.set(key, (T.get(key) || 0) + 1); }
          cache.set(n, T); return T;
        };
        const place = (a, b, c, n) => [(b + c / 2) / n, (c * Math.sqrt(3)) / 2 / n];
        A.onClick((x, y) => {
          const n = nS.value; let best = null, bd = 0.6 / n;
          for (let c = 0; c <= n; c++) for (let b = 0; b <= n - c; b++) { const a = n - b - c, [px, py] = place(a, b, c, n); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = [a, b, c]; } }
          if (best) sel = best;
        });
        const MISS = countArrangements('MISSISSIPPI');
        v.render(() => {
          const n = nS.value, T = tally(n), [sa, sb, sc] = sel, r = Math.min(0.37 / n, 0.12);
          A.poly([[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]], { fill: 'muted', fillAlpha: 0.04, color: 'faint', width: 1 });
          for (let c = 0; c <= n; c++) for (let b = 0; b <= n - c; b++) {
            const a = n - b - c, [x, y] = place(a, b, c, n), val = T.get(a + ',' + b) || 0, isSel = a === sa && b === sb;
            A.circle(x, y, r, { fill: isSel ? 'gold' : 'panel', fillAlpha: isSel ? 0.9 : 1, color: isSel ? 'gold' : 'muted', width: isSel ? 2 : 1 });
            A.text(String(val), x, y, { align: 'center', size: Math.min(13, r * A.scale * (val > 99 ? 0.62 : 0.8)), weight: isSel ? 700 : 500, color: isSel ? 'panel' : 'ink', halo: false });
          }
          A.tex(`x^{${n}}`, -r, -r, { dx: -4, dy: 6, align: 'right', baseline: 'top', color: 'blue', size: 15 });
          A.tex(`y^{${n}}`, 1 + r, -r, { dx: 4, dy: 6, align: 'left', baseline: 'top', color: 'orange', size: 15 });
          A.tex(`z^{${n}}`, 0.5 + r, Math.sqrt(3) / 2 + r * 0.6, { dx: 6, align: 'left', baseline: 'bottom', color: 'green', size: 15 });
          // words
          const P = pen(v, B), W = P.W, H = P.H, words = wordsOf([sa, sb, sc]), COL = ['blue', 'orange', 'green'], L3 = ['x', 'y', 'z'];
          P.text(`${words.length} words with ${sa} x, ${sb} y, ${sc} z`, 10, 14, { size: 12.5, color: 'muted', weight: 600 });
          const g = fitGrid(words.length, W - 16, H - 34, 1 / (n * 1.1), 5, n * 26), q = g.w / n;
          words.forEach((wd, i) => {
            const [x, y] = g.at(i), X = x + 8, Y = y + 28;
            wd.forEach((l, t) => { P.rect(X + t * q + 0.4, Y, q - 0.8, g.h, { fill: COL[l], fillAlpha: 0.85 }); if (q >= 13) P.text(L3[l], X + (t + 0.5) * q, Y + g.h / 2, { align: 'center', size: Math.min(13, q * 0.6), color: 'panel', weight: 700, math: true, halo: false }); });
          });
        });
        v.readout(() => {
          const n = nS.value, [a, b, c] = sel, T = tally(n), val = T.get(a + ',' + b) || 0, f = fact(n) / (fact(a) * fact(b) * fact(c));
          return `Coefficient of $x^{${a}}y^{${b}}z^{${c}}$ (from tallying all $3^{${n}} = ${3 ** n}$ words): **${val}**; listed words: ${wordsOf([a, b, c]).length}; formula $\\frac{${n}!}{${a}!\\,${b}!\\,${c}!} = ${f}$ ✓. The coefficients sum to $3^{${n}}$. Enumerating the distinct rearrangements of MISSISSIPPI finds ${commas(MISS)} $= \\frac{11!}{1!\\,4!\\,4!\\,2!}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Definition',
      name: 'Set partitions and Stirling numbers of the second kind',
      statement: String.raw`A **partition** of a finite set $X$ is a set of nonempty, pairwise disjoint subsets (**blocks**) whose union is $X$. The **Stirling number of the second kind** $S(n,k)$ is the number of partitions of an $n$-element set into exactly $k$ blocks. With $S(0,0)=1$ and $S(n,0)=S(0,k)=0$ otherwise, they satisfy
$$S(n,k) = S(n-1,k-1) + k\,S(n-1,k)\qquad(n,k\ge1).$$`,
      idea: String.raw`Look at where element $n$ goes. Either it forms a block by itself, and removing it leaves a partition of $\{1,\dots,n-1\}$ into $k-1$ blocks; or it lies in a larger block, and removing it leaves a partition into $k$ blocks, from which the original is recovered by choosing which of the $k$ blocks $n$ joins. The sum and product rules (1.1) give the recurrence.`,
      caption: String.raw`Click an entry of the triangle (rows $n\le 6$). Every partition of $\{1,\dots,n\}$ into $k$ blocks is drawn as an arc diagram (arcs join consecutive elements of a block; colours = blocks) with element $n$ ringed. Top: $n$ alone, one for each partition counted by the orange parent. Bottom: $n$ joins a block — boxed in groups of $k$, one group per partition counted by the teal parent.`,
      deps: ['comb-1.1'],
      refs: ['Stanley EC1 §1.9', 'Aigner ch. 1'],
      tags: ['set partitions', 'Stirling numbers'],
      viz(v) {
        let sel = [5, 3], pick = null;
        const NMAX = 7, S2 = stirling2(NMAX);
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.5 });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1, title: 'the triangle $S(n,k)$ (click)' });
        const T = v.table(B, { rows: NMAX + 1, cols: NMAX + 1, size: 12, maxCell: 40, labelSize: 11.5, rowLabels: (i) => `n=${i}`, colLabels: (j) => `k=${j}` });
        B.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 1 && c.i <= 6 && c.j >= 1 && c.j <= c.i) { sel = [c.i, c.j]; pick = null; } });
        let boxes = [];
        A.onClick((x, y) => { const [px, py] = toPx(A, x, y); const b = boxes.find((r) => px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3]); pick = b ? b[4] : null; });
        v.render(() => {
          const [n, k] = sel;
          T.draw({
            value: (i, j) => (j <= i ? S2[i][j] : ''),
            fill: (i, j) => (i === n && j === k ? ['gold', 0.85] : i === n - 1 && j === k - 1 ? ['orange', 0.45] : i === n - 1 && j === k ? ['teal', 0.4] : j > i ? ['muted', 0.06] : null),
            sub: (i, j) => (i === n - 1 && j === k && k > 0 ? `×${k}` : null), subColor: 'teal',
            weight: (i, j) => (i === n && j === k ? 700 : 500),
          });
          // gallery
          const P = pen(v, A), W = P.W, H = P.H, all = setPartitions(n).filter((r) => Math.max(...r) + 1 === k);
          const alone = all.filter((r) => !r.slice(0, n - 1).includes(r[n - 1]));
          const join = all.filter((r) => r.slice(0, n - 1).includes(r[n - 1]));
          const baseKey = (r) => r.slice(0, n - 1).join('');
          join.sort((p, q) => (baseKey(p) < baseKey(q) ? -1 : baseKey(p) > baseKey(q) ? 1 : p[n - 1] - q[n - 1]));
          const groups = []; join.forEach((r) => { const key = baseKey(r); if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, items: [] }); groups[groups.length - 1].items.push(r); });
          boxes = [];
          const aspect = 0.62, hA = splitHeight(H, W - 16, alone.length, aspect, groups.length, aspect / k, 120, 120 * k);
          const ring = (i) => i === n - 1, isPick = (r) => pick && r.join('') === pick.join('');
          P.text(`${n} alone: ${alone.length} = S(${n - 1},${k - 1})`, 8, 12, { size: 12, color: 'orange', weight: 700 });
          if (alone.length) {
            const g = fitGrid(alone.length, W - 16, hA - 30, aspect, 6, 120);
            alone.forEach((r, i) => { const [x, y] = g.at(i), X = x + 8, Y = y + 24; P.rect(X, Y, g.w, g.h, { fill: isPick(r) ? 'gold' : 'orange', fillAlpha: isPick(r) ? 0.3 : 0.07, r: 4 }); drawArcPartition(P, r, X + 2, Y + 2, g.w - 4, g.h - 4, { ring, labels: true }); boxes.push([X, Y, g.w, g.h, r]); });
          } else P.text('none', 8, 34, { size: 12, color: 'muted' });
          P.line(6, hA, W - 6, hA, { color: 'faint', width: 1, dash: [4, 4] });
          P.text(`${n} joins one of the ${k} blocks: ${join.length} = ${k} × S(${n - 1},${k})`, 8, hA + 14, { size: 12, color: 'teal', weight: 700 });
          if (groups.length) {
            const g = fitGrid(groups.length, W - 16, H - hA - 30, aspect / k, 8, 120 * k);
            groups.forEach((G, gi) => {
              const [x, y] = g.at(gi), X = x + 8, Y = y + hA + 26, iw = g.w / k;
              P.rect(X - 2, Y - 2, g.w + 4, g.h + 4, { fill: 'teal', fillAlpha: 0.07, color: 'teal', width: 1, r: 5, alpha: 0.5 });
              G.items.forEach((r, t) => { const ix = X + t * iw; if (isPick(r)) P.rect(ix, Y, iw, g.h, { fill: 'gold', fillAlpha: 0.3, r: 3 }); drawArcPartition(P, r, ix + 2, Y + 2, iw - 4, g.h - 4, { ring, labels: true }); boxes.push([ix, Y, iw, g.h, r]); });
            });
          } else P.text('none', 8, hA + 36, { size: 12, color: 'muted' });
        });
        v.readout(() => {
          const [n, k] = sel; let t = `$S(${n},${k}) = S(${n - 1},${k - 1}) + ${k}\\cdot S(${n - 1},${k}) = ${S2[n - 1][k - 1]} + ${k}\\cdot${S2[n - 1][k]} = ${S2[n][k]}$ partitions drawn.`;
          if (pick) t += ` Selected: ${blocksOf(pick).map((b) => '{' + b.map((i) => i + 1).join(',') + '}').join(' ')}.`;
          else t += ' Click a diagram to read it as blocks.';
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Definition',
      name: 'Bell numbers',
      statement: String.raw`The **Bell number** $B(n)$ is the number of partitions of an $n$-element set into any number of blocks, $B(n) = \sum_{k=0}^n S(n,k)$: $1, 1, 2, 5, 15, 52, 203, 877, \dots$ ($B(0)=1$). They satisfy
$$B(n+1) = \sum_{i=0}^{n}\binom ni B(i),$$
and can be generated by the **Bell triangle**: start with $1$; each row begins with the last entry of the row above, and every further entry is its left neighbour plus the entry above that neighbour. The first entries of the rows are $B(0), B(1), B(2),\dots$.`,
      idea: String.raw`For the recurrence, remove the block containing element $n+1$: if it has $n-i$ other elements, they can be chosen in $\binom n{n-i} = \binom ni$ ways and the remaining $i$ elements are partitioned in $B(i)$ ways. For the triangle, induction on Pascal's rule (1.8) shows that entry $j$ of row $m$ equals $\sum_{t}\binom jt B(m-j+t)$; at the end of row $m$ this is $\sum_t\binom mt B(t) = B(m+1)$, which is exactly what the next row starts with.`,
      caption: String.raw`Step the player to build the Bell triangle: each new entry (gold) is its left neighbour (orange) plus the entry above that (teal), and each row starts by copying the last entry of the row above. The green numbers down the left edge are the Bell numbers. On the right every partition of a small set is drawn as coloured blobs, sorted by the number of blocks, so $B(n) = \sum_k S(n,k)$ can be counted on screen.`,
      deps: ['comb-1.13'],
      see: ['comb-4.11'],
      refs: ['Aigner ch. 1'],
      tags: ['set partitions', 'Bell numbers'],
      credit: 'Peirce, 1880 (the triangle); Bell, 1934',
      viz(v) {
        const R = 8, tri = [[1]];
        for (let i = 1; i < R; i++) { const row = [tri[i - 1][i - 1]]; for (let j = 1; j <= i; j++) row.push(row[j - 1] + tri[i - 1][j - 1]); tri.push(row); }
        const frames = [];
        for (let i = 0; i < R; i++) for (let j = 0; j <= i; j++) frames.push({ i, j, note: i === 0 ? 'Start with 1.' : j === 0 ? String.raw`Row ${i} starts with the last entry of row ${i - 1}: $B(${i}) = ${tri[i][0]}$.` : String.raw`$${tri[i][j - 1]} + ${tri[i - 1][j - 1]} = ${tri[i][j]}$` });
        const S = v.steps({ frames, start: 'end', still: 'end', speed: 4 });
        const nSel = v.select('partitions of', [{ value: 3, label: '$\\{1,2,3\\}$' }, { value: 4, label: '$\\{1,\\dots,4\\}$' }, { value: 5, label: '$\\{1,\\dots,5\\}$' }], 4);
        const A = v.stage({ x: [-1.4, R - 0.4], y: [-R + 0.4, 0.9], axes: false, equal: true, height: 360, weight: 1, title: 'Bell triangle' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.25 });
        const S2 = stirling2(6);
        v.render(() => {
          const f = S.frame, idx = S.i;
          let t = 0;
          for (let i = 0; i < R; i++) for (let j = 0; j <= i; j++, t++) {
            const grown = t <= idx, cur = i === f.i && j === f.j, left = f.j > 0 && i === f.i && j === f.j - 1, up = f.j > 0 && i === f.i - 1 && j === f.j - 1;
            const copy = f.j === 0 && f.i > 0 && i === f.i - 1 && j === f.i - 1, edge = j === 0;
            const col = cur ? 'gold' : left || copy ? 'orange' : up ? 'teal' : null;
            A.rect(j - 0.45, -i - 0.36, j + 0.45, -i + 0.36, { fill: col || (edge && grown ? 'green' : 'panel'), fillAlpha: col ? 0.85 : edge && grown ? 0.16 : 1, color: col || (grown ? 'muted' : 'faint'), width: col ? 2 : 1 });
            if (grown) A.text(String(tri[i][j]), j, -i, { align: 'center', size: Math.min(12.5, A.scale * 0.3), weight: col || edge ? 700 : 500, color: col ? 'panel' : edge ? 'green' : 'ink', halo: false });
          }
          if (f.j === 0 && f.i > 0) A.arrow(f.i - 1, -f.i + 1 - 0.1, 0.35, -f.i + 0.2, { color: 'orange', width: 1.8, head: 8 });
          for (let i = 0; i < R; i++) A.text(`B(${i})`, -0.6, -i, { align: 'right', size: 10.5, color: 'green', weight: 600, halo: false });
          // blob gallery
          const P = pen(v, B), W = P.W, H = P.H, n = +nSel.value, parts = setPartitions(n);
          const byK = []; for (let k = 1; k <= n; k++) byK.push(parts.filter((r) => Math.max(...r) + 1 === k));
          const rowsNeeded = byK.map((L) => Math.ceil(L.length / Math.max(1, Math.floor((W - 80) / 46))));
          const totRows = rowsNeeded.reduce((a, b) => a + b, 0);
          let y = 6;
          byK.forEach((L, ki) => {
            const h = ((H - 12) * rowsNeeded[ki]) / totRows;
            P.text(`k = ${ki + 1}`, 8, y + h / 2 - 7, { size: 11.5, color: 'muted', weight: 600 });
            P.text(`S = ${S2[n][ki + 1]}`, 8, y + h / 2 + 8, { size: 11, color: CAT[ki % CAT.length], weight: 700 });
            const g = fitGrid(L.length, W - 76, h - 4, 1, 4, 70);
            L.forEach((r, i) => { const [x, yy] = g.at(i); drawBlobs(v, P, r, 70 + x + g.w / 2, y + 2 + yy + g.h / 2, g.w * 0.3, { pad: Math.max(3, g.w * 0.12), labels: g.w > 40 }); });
            y += h;
            if (ki < n - 1) P.line(6, y, W - 6, y, { color: 'faint', width: 1, dash: [3, 4] });
          });
        });
        v.readout(() => {
          const n = +nSel.value, terms = []; for (let k = 1; k <= n; k++) terms.push(S2[n][k]);
          const bell = tri.map((r) => r[0]);
          return `$B(${n}) = \\sum_k S(${n},k) = ${terms.join(' + ')} = ${terms.reduce((a, b) => a + b, 0)}$ partitions drawn. Left edge of the triangle: ${bell.join(', ')}, …; recurrence check: $B(${n}) = \\sum_i\\binom{${n - 1}}{i}B(i) = ${Array.from({ length: n }, (_, i) => `${binom(n - 1, i)}\\cdot${bell[i]}`).join('+')} = ${bell[n]}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Definition',
      name: 'Stirling numbers of the first kind',
      statement: String.raw`The (unsigned) **Stirling number of the first kind** $c(n,k)$, also written $\left[{n\atop k}\right]$, is the number of permutations of an $n$-element set with exactly $k$ cycles — equivalently, the number of ways to seat $n$ people at $k$ indistinguishable round tables, none empty, where only each person's left neighbour matters. They are the coefficients of the rising factorial:
$$x(x+1)(x+2)\cdots(x+n-1) = \sum_{k=0}^{n} c(n,k)\,x^k,$$
and satisfy $c(n,k) = c(n-1,k-1) + (n-1)\,c(n-1,k)$. The signed numbers $s(n,k) = (-1)^{n-k}c(n,k)$ are the coefficients of the falling factorial $x^{\underline n}$.`,
      idea: String.raw`Seat the people one at a time. Person $n$ either opens a new table (from a seating of $n-1$ people at $k-1$ tables) or sits to the left of one of the $n-1$ people already seated ($n-1$ ways, from a seating at $k$ tables). That is the recurrence, and it is also what multiplying by $(x + n-1)$ does to the coefficients: the factor $x$ shifts them (new table) and the factor $n-1$ multiplies them. Substituting $-x$ turns the rising factorial into $(-1)^n x^{\underline n}$, which gives the signed version.`,
      caption: String.raw`Choose $n$ and click a bar to choose $k$. Every seating of $n$ people at $k$ round tables is drawn (guests clockwise in cycle order, person $n$ ringed): first those where $n$ sits alone, then those where $n$ squeezed in to the left of someone. The bars are the coefficients of $x(x+1)\cdots(x+n-1)$ and match the number of seatings in every column.`,
      deps: ['comb-1.5'],
      see: ['comb-2.2'],
      refs: ['Stanley EC1 §1.3', 'Aigner ch. 1'],
      tags: ['permutations', 'Stirling numbers'],
      viz(v) {
        let k = 2;
        const C = stirling1(6);
        const nS = v.slider('people $n$', 1, 5, 4, { int: true, onChange: () => { k = Math.min(k, nS.value); } });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.6 });
        const B = v.stage({ x: [0.3, 5.7], y: [0, 60], axes: 'box', height: 360, weight: 1, title: 'coefficients of $x(x+1)\\cdots(x+n-1)$' });
        B.onClick((x) => { const kk = Math.round(x); if (kk >= 1 && kk <= nS.value) k = kk; });
        v.render(() => {
          const n = nS.value, all = perms(Array.from({ length: n }, (_, i) => i)).filter((p) => cyclesOf(p).length === k);
          const alone = all.filter((p) => p[n - 1] === n - 1), ins = all.filter((p) => p[n - 1] !== n - 1);
          const P = pen(v, A), W = P.W, H = P.H, ring = (g) => g === n - 1;
          const asp = 0.42 + 0.12 / k, hA = splitHeight(H, W - 16, alone.length, asp, ins.length, asp, 46 * k + 30, 46 * k + 30);
          P.text(`${n} sits alone: ${alone.length} = c(${n - 1},${k - 1})`, 8, 12, { size: 12, color: 'orange', weight: 700 });
          if (alone.length) { const g = fitGrid(alone.length, W - 16, hA - 30, asp, 6, 46 * k + 30); alone.forEach((p, i) => { const [x, y] = g.at(i); P.rect(x + 8, y + 24, g.w, g.h, { fill: 'orange', fillAlpha: 0.07, r: 4 }); drawTables(v, P, p, x + 8, y + 24, g.w, g.h, { ring, arrows: true }); }); }
          else P.text('none', 8, 34, { size: 12, color: 'muted' });
          P.line(6, hA, W - 6, hA, { color: 'faint', width: 1, dash: [4, 4] });
          P.text(`${n} sits to the left of one of the ${n - 1} others: ${ins.length} = ${n - 1} × c(${n - 1},${k})`, 8, hA + 14, { size: 12, color: 'teal', weight: 700 });
          if (ins.length) { const g = fitGrid(ins.length, W - 16, H - hA - 30, asp, 6, 46 * k + 30); ins.forEach((p, i) => { const [x, y] = g.at(i); P.rect(x + 8, y + hA + 26, g.w, g.h, { fill: 'teal', fillAlpha: 0.07, r: 4 }); drawTables(v, P, p, x + 8, y + hA + 26, g.w, g.h, { ring, arrows: true }); }); }
          else P.text('none', 8, hA + 36, { size: 12, color: 'muted' });
          // bars
          const ymax = Math.max(...C[n].slice(1, n + 1)) * 1.2;
          B.setView([0.3, n + 0.7], [-ymax * 0.09, ymax]);
          B.setTicks(Array.from({ length: n }, (_, i) => [i + 1, `x^${i + 1}`.replace('x^1', 'x')]), null);
          B.hline(0, { color: 'muted', width: 1 });
          for (let kk = 1; kk <= n; kk++) {
            const val = C[n][kk], on = kk === k;
            B.rect(kk - 0.34, 0, kk + 0.34, val, { fill: on ? 'gold' : 'blue', fillAlpha: on ? 0.8 : 0.35, color: on ? 'gold' : 'blue', width: 1.4 });
            B.text(String(val), kk, val, { dy: -9, align: 'center', size: 12, weight: 700, color: on ? 'gold' : 'blue' });
          }
          B.corner(`total ${fact(n)} = ${n}!`, 'tr', { color: 'muted' });
        });
        v.readout(() => {
          const n = nS.value, poly = [];
          for (let kk = n; kk >= 1; kk--) { const c = C[n][kk]; poly.push(`${c === 1 ? '' : c}x${kk > 1 ? `^{${kk}}` : ''}`); }
          return `$${Array.from({ length: n }, (_, i) => (i ? `(x+${i})` : 'x')).join('')} = ${poly.join(' + ')}$. Seatings at ${k} table${k > 1 ? 's' : ''}: ${C[n][k]} $= c(${n - 1},${k - 1}) + ${n - 1}\\,c(${n - 1},${k}) = ${C[n - 1][k - 1]} + ${n - 1}\\cdot${C[n - 1][k]}$; all columns together: ${fact(n)} $= ${n}!$ permutations.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16',
      kind: 'Definition',
      name: 'Integer partitions and Ferrers diagrams',
      statement: String.raw`A **partition** of a positive integer $n$ is a way of writing $n$ as a sum of positive integers, order disregarded; we list the parts in weakly decreasing order, $\lambda = (\lambda_1\ge\lambda_2\ge\cdots\ge\lambda_k)$ with $\sum\lambda_i = n$, and write $\lambda\vdash n$. The number of partitions is $p(n)$, and $p_k(n)$ counts those with exactly $k$ parts ($p(0)=1$). The **Ferrers diagram** of $\lambda$ has $\lambda_i$ dots in row $i$, left-justified; reflecting it in its main diagonal gives the **conjugate** partition $\lambda'$, with $\lambda'_j = |\{i : \lambda_i\ge j\}|$.`,
      idea: String.raw`Unlike set partitions (1.13), nothing is labelled: only the multiset of block sizes survives, which is why no closed formula exists and $p(n)$ is studied through generating functions (comb-6.1). Ferrers diagrams turn identities into pictures: conjugation is a bijection between partitions with exactly $k$ parts and partitions whose largest part is $k$, since the number of rows becomes the length of the first row.`,
      caption: String.raw`Choose $n$ and a filter; every partition of $n$ passing it is drawn as a Ferrers diagram. "Conjugate" transposes every diagram: with "exactly $k$ parts" the highlighted first column becomes the first row, so the same number of partitions have largest part $k$. Click a diagram to see it large next to its conjugate (colours follow the rows of $\lambda$). The counts of partitions into odd parts and into distinct parts always agree — Euler's theorem (comb-6.3).`,
      deps: ['comb-1.1'],
      see: ['comb-6.2', 'comb-6.3'],
      refs: ['Stanley EC1 §1.8', 'Aigner ch. 1'],
      tags: ['integer partitions', 'Ferrers diagrams'],
      viz(v) {
        let pick = [4, 2, 1];
        const nS = v.slider('$n$', 1, 12, 7, { int: true, onChange: () => { pick = null; } });
        const flt = v.select('show', [{ value: 'all', label: 'all' }, { value: 'k', label: 'exactly $k$ parts' }, { value: 'odd', label: 'odd parts' }, { value: 'dist', label: 'distinct parts' }], 'k');
        const kS = v.slider('$k$', 1, 12, 3, { int: true });
        const conj = v.toggle('conjugate (transpose)', false);
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.6 });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1 });
        let boxes = [];
        A.onClick((x, y) => { const [px, py] = toPx(A, x, y); const b = boxes.find((r) => px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3]); if (b) pick = b[4]; });
        const pass = (lam, f, k) => (f === 'all' ? true : f === 'k' ? lam.length === k : f === 'odd' ? lam.every((p) => p % 2) : lam.every((p, i) => i === 0 || p < lam[i - 1]));
        v.render(() => {
          const n = nS.value, f = flt.value, k = Math.min(kS.value, n); kS.el.hidden = f !== 'k';
          const all = intPartitions(n), shown = all.filter((l) => pass(l, f, k));
          if (!pick || pick.reduce((a, b) => a + b, 0) !== n) pick = shown[0] || all[0];
          const P = pen(v, A), W = P.W, H = P.H;
          const title = f === 'k' ? (conj.value ? `conjugates of the ${shown.length} partitions with ${k} parts: largest part ${k}` : `${shown.length} partitions of ${n} with exactly ${k} parts`) : `${shown.length} of the ${all.length} partitions of ${n}` + (conj.value ? ' (conjugated)' : '');
          P.text(title, 8, 12, { size: 12, color: 'muted', weight: 600 });
          boxes = [];
          if (!shown.length) { P.text('none', W / 2, H / 2, { align: 'center', size: 13, color: 'muted' }); }
          else {
            const g = fitGrid(shown.length, W - 12, H - 30, 1.18, 6, 150);
            shown.forEach((lam, i) => {
              const [x, y] = g.at(i), X = x + 6, Y = y + 24, d = conj.value ? conjugate(lam) : lam, isP = pick && lam.join() === pick.join();
              const lab = g.w > 34, q = Math.min((g.w - 6) / n, (g.h - (lab ? 16 : 6)) / n);
              P.rect(X, Y, g.w, g.h, { fill: isP ? 'gold' : 'muted', fillAlpha: isP ? 0.25 : 0.05, r: 4 });
              const colorOf = (r, c) => (f === 'k' ? ((conj.value ? r === 0 : c === 0) ? 'orange' : 'blue') : f === 'odd' ? 'green' : f === 'dist' ? 'purple' : 'blue');
              drawFerrers(P, d, X + 4, Y + 4, q, { colorOf, dotScale: 0.38 });
              if (lab) P.text(d.join('+'), X + g.w / 2, Y + g.h - 7, { align: 'center', size: Math.min(10.5, (g.w / (d.join('+').length + 1)) * 1.6), color: 'muted', halo: false });
              boxes.push([X, Y, g.w, g.h, lam]);
            });
          }
          // big diagram and its conjugate
          const Q = pen(v, B), BW = Q.W, BH = Q.H, lam = pick, lc = conjugate(lam);
          const q = Math.min((BW - 50) / (lam[0] + lc[0]), (BH - 90) / Math.max(lam.length, lc.length), 30);
          const x1 = 16, x2 = 16 + q * lam[0] + 26, y0 = 52;
          Q.text('λ', x1, 20, { size: 15, math: true, weight: 600 }); Q.text(`= (${lam.join(', ')})`, x1 + 12, 20, { size: 12.5 });
          Q.text('λ′', x2, 20, { size: 15, math: true, weight: 600 }); Q.text(`= (${lc.join(', ')})`, x2 + 16, 20, { size: 12.5 });
          drawFerrers(Q, lam, x1, y0, q, { boxes: true, colorOf: (r) => CAT[r % CAT.length] });
          drawFerrers(Q, lc, x2, y0, q, { boxes: true, colorOf: (r, c) => CAT[c % CAT.length] });
          Q.line(x1, y0, x1 + q * Math.min(lam[0], lam.length) + q * 0.4, y0 + q * Math.min(lam[0], lam.length) + q * 0.4, { color: 'ink', width: 1.2, dash: [4, 4] });
          Q.text(`rows of λ = columns of λ′ · ${lam.length} parts ↔ largest part ${lc[0]}`, 12, BH - 14, { size: 11.5, color: 'muted' });
        });
        v.readout(() => {
          const n = nS.value, all = intPartitions(n), k = Math.min(kS.value, n);
          const pk = all.filter((l) => l.length === k).length, big = all.filter((l) => l[0] === k).length;
          const odd = all.filter((l) => l.every((p) => p % 2)).length, dist = all.filter((l) => l.every((p, i) => i === 0 || p < l[i - 1])).length;
          return `$p(${n}) = ${all.length}$. Exactly ${k} parts: ${pk}; largest part ${k}: ${big} (equal, by conjugation). Odd parts only: ${odd}; distinct parts: ${dist}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.17
    {
      num: '1.17',
      kind: 'Concept',
      name: 'The twelvefold way',
      credit: 'Rota (popularised by Stanley)',
      statement: String.raw`Count the ways to put $n$ balls into $x$ boxes — that is, maps $f: N\to X$ with $|N| = n$, $|X| = x$ — when the balls may be distinguishable or not, the boxes may be distinguishable or not, and $f$ may be arbitrary, injective (at most one ball per box) or surjective (no empty box). Identifying configurations that differ only by relabelling indistinguishable balls or boxes, the twelve answers are:

- distinct balls, distinct boxes: $x^n$, $\;x^{\underline n}$, $\;x!\,S(n,x)$;
- identical balls, distinct boxes: $\binom{x+n-1}{n}$, $\;\binom xn$, $\;\binom{n-1}{x-1}$;
- distinct balls, identical boxes: $\sum_{k\le x}S(n,k)$, $\;[n\le x]$, $\;S(n,x)$;
- identical balls, identical boxes: $\sum_{k\le x}p_k(n)$, $\;[n\le x]$, $\;p_x(n)$.`,
      idea: String.raw`Each entry is an earlier result in disguise. Distinct balls into distinct boxes are just functions (1.1), injections (1.5) and, via the blocks of preimages, ordered set partitions (1.13). Making the balls identical keeps only how many land in each box: multisets (1.11), subsets (1.6), positive compositions. Making the boxes identical keeps only which balls share a box: set partitions (1.13). Making both identical keeps only the box sizes: integer partitions (1.16). Injective maps into identical boxes all look alike, hence $[n\le x]$.`,
      caption: String.raw`Set the numbers of balls and boxes. Each cell enumerates all $x^n$ maps, keeps the injective or surjective ones, identifies those that differ only by relabelling identical balls (grey) or identical boxes (dashed), and shows a gallery of the survivors next to the formula; the two numbers always agree. Click a cell to see its configurations large below.`,
      deps: ['comb-1.5', 'comb-1.11', 'comb-1.13', 'comb-1.16'],
      refs: ['Stanley EC1 §1.9'],
      tags: ['counting', 'balls into boxes'],
      viz(v) {
        let sel = [1, 0];
        const nS = v.slider('balls $n$', 1, 5, 4, { int: true });
        const xS = v.slider('boxes $x$', 1, 4, 3, { int: true });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 486, full: true });
        const D = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const ROWS = [['distinct balls', 'distinct boxes'], ['identical balls', 'distinct boxes'], ['distinct balls', 'identical boxes'], ['identical balls', 'identical boxes']];
        const COLS = ['any map', 'injective: ≤ 1 per box', 'surjective: ≥ 1 per box'];
        const FORM = [
          [String.raw`x^n`, String.raw`x^{\underline n}`, String.raw`x!\,S(n,x)`],
          [String.raw`\binom{x+n-1}{n}`, String.raw`\binom{x}{n}`, String.raw`\binom{n-1}{x-1}`],
          [String.raw`\sum_{k\le x}S(n,k)`, String.raw`[n\le x]`, String.raw`S(n,x)`],
          [String.raw`\sum_{k\le x}p_k(n)`, String.raw`[n\le x]`, String.raw`p_x(n)`],
        ];
        const S2 = stirling2(6), PT = partsTable(6);
        const formula = (r, c, n, x) => {
          if (r === 0) return [x ** n, fall(x, n), fact(x) * S2[n][x]][c];
          if (r === 1) return [binom(x + n - 1, n), binom(x, n), binom(n - 1, x - 1)][c];
          if (r === 2) return [S2[n].slice(1, x + 1).reduce((a, b) => a + b, 0), n <= x ? 1 : 0, S2[n][x]][c];
          return [PT[n].slice(1, x + 1).reduce((a, b) => a + b, 0), n <= x ? 1 : 0, PT[n][x]][c];
        };
        const cache = new Map();
        function enumerate(n, x) { // → table[r][c] = list of configurations (each: array of boxes, each box an array of balls)
          const key = n + ',' + x; if (cache.has(key)) return cache.get(key);
          const out = [0, 1, 2, 3].map(() => [new Map(), new Map(), new Map()]);
          const N = x ** n;
          for (let w = 0; w < N; w++) {
            const f = []; let r = w; for (let i = 0; i < n; i++) { f.push(r % x); r = Math.floor(r / x); }
            const boxes = Array.from({ length: x }, () => []); f.forEach((b, i) => boxes[b].push(i));
            const cnt = boxes.map((b) => b.length), inj = cnt.every((c) => c <= 1), sur = cnt.every((c) => c >= 1);
            const rgsMap = new Map(), rgs = f.map((b) => { if (!rgsMap.has(b)) rgsMap.set(b, rgsMap.size); return rgsMap.get(b); });
            const keys = [f.join(','), cnt.join(','), rgs.join(','), cnt.slice().sort((a, b) => b - a).join(',')];
            const reps = [
              boxes,
              boxes,
              [...blocksOf(rgs), ...Array.from({ length: x - rgsMap.size }, () => [])],
              cnt.slice().sort((a, b) => b - a).map((c, j) => Array.from({ length: c }, (_, t) => j * 10 + t)),
            ];
            for (let rr = 0; rr < 4; rr++) [true, inj, sur].forEach((ok, c) => { if (ok && !out[rr][c].has(keys[rr])) out[rr][c].set(keys[rr], reps[rr]); });
          }
          const res = out.map((row) => row.map((m) => [...m.values()]));
          cache.set(key, res); return res;
        }
        function glyph(P, boxes, X, Y, w, h, lb, lx, big) {
          const x = boxes.length, bw = w / x, n = nS.value;
          boxes.forEach((balls, j) => {
            const x0 = X + j * bw + bw * 0.08, ww = bw * 0.84;
            P.rect(x0, Y, ww, h - (big ? 14 : 0), { color: lx ? 'ink' : 'muted', width: big ? 1.6 : 1, dash: lx ? null : [3, 2], fill: 'panel' });
            const rr = Math.max(1.3, Math.min(ww * 0.3, (h - (big ? 14 : 0)) / (2.3 * Math.max(2, n))));
            balls.forEach((b, t) => {
              const cy = Y + h - (big ? 14 : 0) - rr * 1.25 - t * rr * 2.3;
              P.dot(x0 + ww / 2, cy, rr, { fill: lb ? CAT[b % CAT.length] : 'gray' });
              if (big && lb && rr >= 6) P.text(String(b + 1), x0 + ww / 2, cy, { align: 'center', size: rr * 1.15, weight: 700, color: 'panel', halo: false });
            });
            if (big && lx) P.text(String(j + 1), x0 + ww / 2, Y + h - 5, { align: 'center', size: 10, color: 'muted', halo: false });
          });
        }
        let geo = null;
        G.onClick((x, y) => { if (!geo) return; const [px, py] = toPx(G, x, y); const c = Math.floor((px - geo.lw) / geo.cw), r = Math.floor((py - geo.th) / geo.ch); if (r >= 0 && r < 4 && c >= 0 && c < 3) sel = [r, c]; });
        v.render(() => {
          const n = nS.value, x = xS.value, E = enumerate(n, x), P = pen(v, G), W = P.W, H = P.H;
          const lw = 112, th = 34, cw = (W - lw - 4) / 3, ch = (H - th - 4) / 4;
          geo = { lw, th, cw, ch };
          COLS.forEach((t, c) => P.text(t, lw + (c + 0.5) * cw, th / 2, { align: 'center', size: 12, weight: 700, color: 'muted' }));
          ROWS.forEach((t, r) => { P.text(t[0], 8, th + (r + 0.5) * ch - 9, { size: 11.5, weight: 600 }); P.text(t[1], 8, th + (r + 0.5) * ch + 8, { size: 11.5, weight: 600, color: 'muted' }); });
          for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
            const X = lw + c * cw + 3, Y = th + r * ch + 3, w = cw - 6, h = ch - 6, list = E[r][c], isSel = sel[0] === r && sel[1] === c, f = formula(r, c, n, x);
            P.rect(X, Y, w, h, { fill: isSel ? 'gold' : 'muted', fillAlpha: isSel ? 0.13 : 0.04, color: isSel ? 'gold' : 'faint', width: isSel ? 2.2 : 1, r: 6 });
            P.tex(FORM[r][c], X + 8, Y + 15, { align: 'left', size: 13.5 });
            P.text(`${list.length}`, X + w - 10, Y + 15, { align: 'right', size: 16, weight: 700, color: list.length === f ? 'green' : 'red' });
            const area = [X + 6, Y + 32, w - 12, h - 38];
            if (!list.length) { P.text(c === 1 ? `none: ${n} balls, ${x} boxes` : `none: ${x} boxes, ${n} balls`, X + w / 2, Y + h / 2 + 10, { align: 'center', size: 11.5, color: 'muted' }); continue; }
            const cap = 40, shown = list.length > cap ? cap - 1 : list.length;
            const g = fitGrid(shown + (list.length > cap ? 1 : 0), area[2], area[3], 1.15 / x, 3, 16 * x);
            for (let i = 0; i < shown; i++) { const [gx, gy] = g.at(i); glyph(P, list[i], area[0] + gx, area[1] + gy, g.w, g.h, r === 0 || r === 2, r < 2, false); }
            if (list.length > cap) { const [gx, gy] = g.at(shown); P.text(`+${list.length - shown}`, area[0] + gx + g.w / 2, area[1] + gy + g.h / 2, { align: 'center', size: 11, color: 'muted', weight: 700 }); }
          }
          // detail
          const Q = pen(v, D), DW = Q.W, DH = Q.H, [r, c] = sel, list = E[r][c], cap = 72, shown = Math.min(cap, list.length);
          Q.text(`${ROWS[r][0]}, ${ROWS[r][1]}, ${COLS[c].split(':')[0]}: ${list.length} configuration${list.length === 1 ? '' : 's'}` + (list.length > cap ? ` (first ${cap} shown)` : ''), 8, 12, { size: 12, weight: 700, color: 'muted' });
          if (!list.length) { Q.text('none', DW / 2, DH / 2, { align: 'center', size: 13, color: 'muted' }); return; }
          const g = fitGrid(shown, DW - 16, DH - 30, 1.3 / x, 8, 30 * x);
          for (let i = 0; i < shown; i++) { const [gx, gy] = g.at(i); glyph(Q, list[i], 8 + gx, 26 + gy, g.w, g.h, r === 0 || r === 2, r < 2, true); }
        });
        v.legend([['blue', 'distinct balls (coloured)', { dot: true }], ['gray', 'identical balls', { dot: true }], ['ink', 'distinct boxes (numbered)'], ['muted', 'identical boxes', { dash: true }]]);
        v.readout(() => {
          const n = nS.value, x = xS.value, [r, c] = sel, E = enumerate(n, x);
          return `Selected: ${ROWS[r].join(', ')}, ${COLS[c].split(':')[0]} — enumeration finds **${E[r][c].length}**, the formula $${FORM[r][c]}$ gives ${formula(r, c, n, x)} (with $n = ${n}$, $x = ${x}$). All twelve cells were computed from the same $x^n = ${x ** n}$ maps.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.18
    {
      num: '1.18',
      kind: 'Theorem',
      name: 'Stirling numbers as a change of basis',
      statement: String.raw`In the vector space of real polynomials, the powers $1, x, x^2, \dots$ and the falling factorials $x^{\underline 0}, x^{\underline 1}, x^{\underline 2}, \dots$ are two bases, and the Stirling numbers are the matrices that convert between them:
$$x^n = \sum_{k=0}^n S(n,k)\,x^{\underline k}, \qquad x^{\underline n} = \sum_{k=0}^n s(n,k)\,x^k,$$
where $s(n,k) = (-1)^{n-k}c(n,k)$. Consequently the lower-triangular matrices $[S(n,k)]$ and $[s(n,k)]$ are inverse to each other: $\sum_k s(n,k)S(k,m) = \sum_k S(n,k)s(k,m) = [n=m]$.`,
      idea: String.raw`Both sides of the first identity are polynomials of degree $n$, so it suffices to check it at the positive integers $x$. There $x^n$ counts all maps $[n]\to[x]$; grouping a map by the partition of $[n]$ into its fibres (say $k$ blocks, $S(n,k)$ ways) and then assigning distinct values to the blocks ($x^{\underline k}$ ways, 1.5) gives the right-hand side. The second identity is 1.15. Converting one way and back is the identity, so the matrices are inverse.`,
      caption: String.raw`The top panel (symmetric log scale) plots $x^n$ (black) and the terms $S(n,k)\,x^{\underline k}$; the gold curve adds the first $m$ terms. It always meets $x^n$ at $x = 0,1,\dots,m$ (green dots), because $x^{\underline k}$ vanishes there for $k>x$ — and with all $n$ terms it coincides everywhere. The bottom panel multiplies the two Stirling matrices; click a cell of the product to see the row-times-column sum that makes it $0$ or $1$.`,
      deps: ['comb-1.13', 'comb-1.15'],
      refs: ['Stanley EC1 §1.9', 'Aigner ch. 2'],
      tags: ['Stirling numbers', 'polynomials'],
      viz(v) {
        let cell = [3, 1];
        const dir = v.select('', [{ value: 'S', label: '$x^n$ in falling factorials' }, { value: 's', label: '$x^{\\underline n}$ in powers' }], 'S');
        const nS = v.slider('$n$', 1, 6, 4, { int: true, onChange: () => { if (mS.value > nS.value) mS.set(nS.value); cell = [Math.min(cell[0], nS.value), Math.min(cell[1], nS.value)]; } });
        const mS = v.slider('terms $m$', 1, 6, 2, { int: true, onChange: () => { if (mS.value > nS.value) mS.set(nS.value); } });
        const A = v.stage({ x: [-1.3, 4.7], y: [-3, 3], height: 280, full: true, xlabel: 'x' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true });
        const N = 7, S2 = stirling2(N), C1 = stirling1(N);
        const mats = () => ({ S: S2.map((r) => r.slice()), s: C1.map((r, n) => r.map((_, k) => sgnS1(C1, n, k))) });
        const TT = [0, 1, 2].map((t) => v.table(B, { rows: 3, cols: 3, size: 12, maxCell: 34, labelSize: 10.5, region: [[0.0, 0, 0.31, 0.93], [0.345, 0, 0.655, 0.93], [0.69, 0, 1, 0.93]][t] }));
        B.onClick((x, y) => { const h = TT[2].hit(x, y); if (h && h.i >= 0 && h.j >= 0) cell = [h.i, h.j]; });
        v.render(() => {
          const n = nS.value, m = Math.min(mS.value, n), d = dir.value; mS.el.hidden = d !== 'S';
          const x0 = -1.3, x1 = n + 0.7;
          const target = d === 'S' ? (x) => x ** n : (x) => fallX(x, n);
          const term = d === 'S' ? (k) => (x) => S2[n][k] * fallX(x, k) : (k) => (x) => sgnS1(C1, n, k) * x ** k;
          const upto = d === 'S' ? m : n, part = (x) => { let s = 0; for (let k = 0; k <= upto; k++) s += term(k)(x); return s; };
          const ymax = slog(Math.max(Math.abs(target(x1)), Math.abs(target(x0)), 10)) * 1.08;
          A.setView([x0, x1], [-ymax * 0.55, ymax]);
          const ticks = []; for (let e = 0; 10 ** e <= 10 ** ymax; e++) { ticks.push([slog(10 ** e), e === 0 ? '1' : `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e]}`]); if (slog(-(10 ** e)) > -ymax * 0.55) ticks.push([slog(-(10 ** e)), e === 0 ? '−1' : `−10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e]}`]); }
          A.setTicks(null, ticks);
          for (let k = 1; k <= n; k++) { const f = term(k); if (d === 'S' && k > m) A.fn((x) => slog(f(x)), { color: CAT[k % CAT.length], width: 1.2, dash: [4, 4], alpha: 0.5 }); else A.fn((x) => slog(f(x)), { color: CAT[k % CAT.length], width: 1.6, alpha: 0.85 }); }
          A.fn((x) => slog(target(x)), { color: 'ink', width: 4 });
          A.fn((x) => slog(part(x)), { color: 'gold', width: 2.6, dash: d === 'S' && m < n ? [8, 5] : null });
          if (d === 'S') for (let j = 0; j <= Math.min(m, Math.floor(x1)); j++) A.dot(j, slog(j ** n), { r: 5.5, color: 'green' });
          // matrices
          const M = mats(), L = d === 'S' ? M.S : M.s, R2 = d === 'S' ? M.s : M.S, sz = n + 1;
          const prod = Array.from({ length: sz }, (_, i) => Array.from({ length: sz }, (_, j) => { let s = 0; for (let k = 0; k < sz; k++) s += L[i][k] * R2[k][j]; return s; }));
          const [ci, cj] = cell;
          const spec = (Mx, hl) => ({ rows: sz, cols: sz, rowLabels: (i) => String(i), colLabels: (j) => String(j), value: (i, j) => (j <= i ? Mx[i][j] : ''), ...hl });
          TT[0].draw(spec(L, { activeRow: ci, fill: (i, j) => (j > i ? ['muted', 0.05] : null), textColor: (i, j) => (L[i][j] < 0 ? 'red' : 'ink') }));
          TT[1].draw(spec(R2, { activeCol: cj, fill: (i, j) => (j > i ? ['muted', 0.05] : null), textColor: (i, j) => (R2[i][j] < 0 ? 'red' : 'ink') }));
          TT[2].draw({ rows: sz, cols: sz, rowLabels: (i) => String(i), colLabels: (j) => String(j), value: (i, j) => prod[i][j], fill: (i, j) => (prod[i][j] ? ['green', 0.35] : null), highlight: [[ci, cj, 'gold']], textColor: (i, j) => (prod[i][j] ? 'ink' : 'faint') });
          B.text('×', 0.3275, 0.45, { align: 'center', size: 20, color: 'muted' });
          B.text('=', 0.6725, 0.45, { align: 'center', size: 20, color: 'muted' });
          B.text(d === 'S' ? 'S(n,k)' : 's(n,k)', 0.155, 0.97, { align: 'center', size: 12, weight: 700, color: 'muted', baseline: 'top' });
          B.text(d === 'S' ? 's(n,k)' : 'S(n,k)', 0.5, 0.97, { align: 'center', size: 12, weight: 700, color: 'muted', baseline: 'top' });
          B.text('product = identity', 0.845, 0.97, { align: 'center', size: 12, weight: 700, color: 'green', baseline: 'top' });
        });
        v.legend([['ink', 'target polynomial'], ['gold', 'sum of the terms included'], ['green', 'agreement at $x=0,\\dots,m$', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, m = Math.min(mS.value, n), d = dir.value, M = mats(), L = d === 'S' ? M.S : M.s, R2 = d === 'S' ? M.s : M.S, [ci, cj] = cell;
          let t;
          if (d === 'S') {
            const terms = []; for (let k = n; k >= 1; k--) terms.push(`${S2[n][k] === 1 ? '' : S2[n][k]}x^{\\underline{${k}}}`);
            t = `$x^{${n}} = ${terms.join(' + ')}$. With $m = ${m}$ term${m > 1 ? 's' : ''} the partial sum matches $x^{${n}}$ at $x = ${Array.from({ length: m + 1 }, (_, j) => j).join(', ')}$` + (m < n ? ` but not at $x = ${m + 1}$ (${v.fmt(Array.from({ length: m + 1 }, (_, k) => S2[n][k] * fallX(m + 1, k)).reduce((a, b) => a + b, 0), 6)} vs ${(m + 1) ** n}).` : ' — and everywhere.');
          } else {
            const terms = []; for (let k = n; k >= 1; k--) { const c = sgnS1(C1, n, k); terms.push(`${c < 0 ? '-' : terms.length ? '+' : ''}${Math.abs(c) === 1 ? '' : Math.abs(c)}x^{${k}}`); }
            t = `$x^{\\underline{${n}}} = ${terms.join(' ')}$ — the black and gold curves coincide.`;
          }
          let dot = 0; const parts = []; for (let k = 0; k <= Math.max(ci, cj); k++) { dot += L[ci][k] * R2[k][cj]; if (L[ci][k] && R2[k][cj]) parts.push(`(${L[ci][k]})(${R2[k][cj]})`); }
          return t + ` Product entry $(${ci},${cj})$: ${parts.length ? parts.join(' + ') : '0'} $= ${dot}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.19
    {
      num: '1.19',
      kind: 'Theorem',
      name: 'Growth of the central binomial coefficient',
      statement: String.raw`As $n\to\infty$,
$$\binom{2n}{n} \sim \frac{4^n}{\sqrt{\pi n}},$$
and more precisely $\dfrac{4^n}{\sqrt{\pi(n+\frac12)}} \le \dbinom{2n}{n} \le \dfrac{4^n}{\sqrt{\pi(n+\frac14)}}$ for every $n\ge1$, so that the relative error $1 - \binom{2n}n\sqrt{\pi n}/4^n$ lies between $0$ and $\frac1{8n}$ and equals $\frac1{8n} + O(n^{-2})$. The elementary bounds $\frac{4^n}{2n+1}\le\binom{2n}n\le 4^n$ are off by polynomial factors.`,
      idea: String.raw`$\binom{2n}{n} = (2n)!/(n!)^2$, and Stirling's formula (pma-8.22) $m!\sim\sqrt{2\pi m}\,(m/e)^m$ gives $\sqrt{4\pi n}(2n/e)^{2n}\big/\bigl(2\pi n\,(n/e)^{2n}\bigr) = 4^n/\sqrt{\pi n}$. The elementary bounds only use that $\binom{2n}{n}$ is the largest of the $2n+1$ terms of $(1+1)^{2n} = 4^n$ (1.7). The ratio $r_n = \binom{2n}n\sqrt{\pi n}/4^n$ satisfies $r_{n+1}/r_n = \frac{2n+1}{2n+2}\sqrt{\frac{n+1}{n}}$, which is how the plots compute it exactly up to $n = 1000$.`,
      caption: String.raw`Top (log–log): $\binom{2n}n/4^n$ (blue dots) against the Stirling prediction $1/\sqrt{\pi n}$ (green) and the elementary bounds $1$ and $1/(2n+1)$ (dashed) — only the Stirling curve has the right slope, $-\tfrac12$. Bottom left: the ratio $r_n$ creeps up to $1$ inside the shaded band of the two-sided bound. Bottom right: the relative error $1 - r_n$ and $1/(8n)$ merge. Slide $n$ up to $1000$.`,
      deps: ['comb-1.6', 'pma-8.22'],
      see: ['prob-3.1.2', 'comb-5.13'],
      refs: ['Aigner ch. 1'],
      tags: ['asymptotics', 'binomial coefficients'],
      viz(v) {
        const NMAX = 1000, r = [NaN, (2 * Math.sqrt(Math.PI)) / 4];
        for (let n = 1; n < NMAX; n++) r.push(r[n] * ((2 * n + 1) / (2 * n + 2)) * Math.sqrt((n + 1) / n));
        const nS = v.slider('$n$', 1, 1000, 12, { log: true, int: true });
        const A = v.stage({ x: [1, 1000], y: [1e-4, 2], xlog: true, ylog: true, height: 240, full: true, axes: 'box', xlabel: 'n', title: '$\\binom{2n}{n}/4^n$ on log–log axes' });
        const B = v.stage({ x: [1, 1000], y: [0.8, 1.01], xlog: true, height: 230, weight: 1, axes: 'box', xlabel: 'n', title: 'ratio $r_n = \\binom{2n}{n}\\sqrt{\\pi n}/4^n$' });
        const C = v.stage({ x: [1, 1000], y: [5e-5, 0.3], xlog: true, ylog: true, height: 230, weight: 1, axes: 'box', xlabel: 'n', title: 'relative error $1-r_n$ vs $1/(8n)$' });
        const pts = []; for (let n = 1; n <= NMAX; n++) if (n <= 40 || n % Math.ceil(n / 25) === 0) pts.push(n);
        v.render(() => {
          const N = Math.round(nS.value);
          A.fn((x) => 1, { color: 'red', width: 1.6, dash: [6, 4] });
          A.fn((x) => 1 / (2 * x + 1), { color: 'orange', width: 1.6, dash: [6, 4] });
          A.fn((x) => 1 / Math.sqrt(Math.PI * x), { color: 'green', width: 2.6 });
          A.dots(pts.map((n) => [n, r[n] / Math.sqrt(Math.PI * n)]), { r: 2.6, color: 'blue' });
          A.vline(N, { color: 'faint', dash: true });
          A.dot(N, r[N] / Math.sqrt(Math.PI * N), { r: 5.5, color: 'gold' });
          A.text('upper bound 1', 1.2, 1, { dy: -9, size: 11, color: 'red' });
          A.text('lower bound 1/(2n+1)', 300, 1 / 601, { dy: 12, align: 'center', size: 11, color: 'orange' });
          A.text('1/√(πn)', 300, 1 / Math.sqrt(Math.PI * 300), { dy: -12, align: 'center', size: 11.5, color: 'green', weight: 600 });
          B.between((x) => Math.sqrt(x / (x + 0.25)), (x) => Math.sqrt(x / (x + 0.5)), 1, 1000, { fill: 'green', fillAlpha: 0.14 });
          B.hline(1, { color: 'muted', dash: [5, 4] });
          B.fn((x) => 1 - 1 / (8 * x), { color: 'purple', width: 1.4, dash: [4, 3] });
          B.path(r.slice(1).map((y, i) => [i + 1, y]), { color: 'blue', width: 2.2 });
          B.dot(N, r[N], { r: 5.5, color: 'gold' });
          C.fn((x) => 1 / (8 * x), { color: 'purple', width: 2, dash: [6, 4] });
          C.path(r.slice(1).map((y, i) => [i + 1, 1 - y]), { color: 'blue', width: 2.2 });
          C.dot(N, 1 - r[N], { r: 5.5, color: 'gold' });
        });
        v.legend([['blue', 'exact (from the ratio recursion)'], ['green', '$1/\\sqrt{\\pi n}$, the two-sided bound band'], ['purple', '$1/(8n)$ correction', { dash: true }], ['red', 'elementary bounds', { dash: true }]]);
        v.readout(() => {
          const N = Math.round(nS.value), big = binomBig(2 * N, N).toString(), ap = 4 ** N / Math.sqrt(Math.PI * N);
          const exact = big.length <= 18 ? commas(big) : `${big[0]}.${big.slice(1, 7)}\\times10^{${big.length - 1}}`;
          const approx = ap < 1e15 ? commas(Math.round(ap)) : `${(ap / 10 ** Math.floor(Math.log10(ap))).toFixed(6)}\\times10^{${Math.floor(Math.log10(ap))}}`;
          return `$n = ${N}$: $\\binom{${2 * N}}{${N}} = ${big.length <= 18 ? exact : exact}$ (${big.length} digits, exact BigInt), $4^n/\\sqrt{\\pi n} \\approx ${approx}$. Ratio $r_n = ${r[N].toFixed(8)}$; relative error $${v.sci(1 - r[N], 4)}$ vs $1/(8n) = ${v.sci(1 / (8 * N), 4)}$ (their ratio ${((1 - r[N]) * 8 * N).toFixed(5)} → 1).`;
        });
      },
    },
  ],
};
