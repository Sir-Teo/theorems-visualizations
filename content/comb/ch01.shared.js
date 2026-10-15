// Combinatorics — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
//
// Two kinds of helper: exact enumerators (every picture in this chapter lists the objects it counts, so
// the numbers in the readouts come from actually generating them) and a small pixel-space pen for the
// galleries, which lay out many tiny diagrams in a grid.

/** Category colours for elements, blocks, cycles and parts (palette names only). */
export const CAT = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
export const LET = 'abcdefghijklmnopqrstuvwxyz';
/** Thousands separators (numbers, BigInts or digit strings). */
export const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ------------------------------------------------------------------ numbers
export function binom(n, k) {
  if (k < 0 || k > n || n < 0) return 0;
  k = Math.min(k, n - k); let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}
export function binomBig(n, k) {
  if (k < 0 || k > n) return 0n;
  k = Math.min(k, n - k); let r = 1n;
  for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
  return r;
}
export const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
/** Falling factorial n(n−1)…(n−k+1). */
export const fall = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; };
/** Rising factorial x(x+1)…(x+k−1) (x real). */
export const rise = (x, k) => { let r = 1; for (let i = 0; i < k; i++) r *= x + i; return r; };
/** Falling factorial x(x−1)…(x−k+1) for real x. */
export const fallX = (x, k) => { let r = 1; for (let i = 0; i < k; i++) r *= x - i; return r; };

/** Stirling numbers of the second kind S[n][k], 0 ≤ k ≤ n ≤ N, by S(n,k) = k S(n−1,k) + S(n−1,k−1). */
export function stirling2(N) {
  const S = Array.from({ length: N + 1 }, () => Array(N + 1).fill(0)); S[0][0] = 1;
  for (let n = 1; n <= N; n++) for (let k = 1; k <= n; k++) S[n][k] = k * S[n - 1][k] + S[n - 1][k - 1];
  return S;
}
/** Unsigned Stirling numbers of the first kind c[n][k], by c(n,k) = (n−1) c(n−1,k) + c(n−1,k−1). */
export function stirling1(N) {
  const c = Array.from({ length: N + 1 }, () => Array(N + 1).fill(0)); c[0][0] = 1;
  for (let n = 1; n <= N; n++) for (let k = 1; k <= n; k++) c[n][k] = (n - 1) * c[n - 1][k] + c[n - 1][k - 1];
  return c;
}
/** Number of partitions of n into exactly k parts, table p[n][k]: p(n,k) = p(n−1,k−1) + p(n−k,k). */
export function partsTable(N) {
  const p = Array.from({ length: N + 1 }, () => Array(N + 1).fill(0)); p[0][0] = 1;
  for (let n = 1; n <= N; n++) for (let k = 1; k <= n; k++) p[n][k] = p[n - 1][k - 1] + (n - k >= k ? p[n - k][k] : 0);
  return p;
}

// ------------------------------------------------------------------ enumerators
/** All k-subsets of {0,…,n−1} in lexicographic order (arrays of indices). */
export function kSubsets(n, k) {
  const out = [], cur = [];
  const go = (start) => {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (let i = start; i <= n - (k - cur.length); i++) { cur.push(i); go(i + 1); cur.pop(); }
  };
  if (k >= 0 && k <= n) go(0);
  return out;
}
/** All permutations of an array, in lexicographic order of positions. */
export function perms(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((x, i) => { for (const p of perms(arr.filter((_, j) => j !== i))) out.push([x, ...p]); });
  return out;
}
/** Ordered selections of k distinct elements of {0,…,n−1} (lexicographic). */
export function kPerms(n, k) {
  const out = [], cur = [], used = Array(n).fill(false);
  const go = () => {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (let i = 0; i < n; i++) if (!used[i]) { used[i] = true; cur.push(i); go(); cur.pop(); used[i] = false; }
  };
  go();
  return out;
}
/** Set partitions of {0,…,n−1} as restricted growth strings a (a[0] = 0, a[i] ≤ 1 + max a[0..i−1]). */
export function setPartitions(n) {
  const out = [], a = Array(n).fill(0);
  const go = (i, m) => {
    if (i === n) { out.push(a.slice()); return; }
    for (let b = 0; b <= m + 1; b++) { a[i] = b; go(i + 1, Math.max(m, b)); }
  };
  if (n === 0) return [[]];
  a[0] = 0; go(1, 0);
  return out;
}
/** Blocks of a restricted growth string, ordered by least element. */
export function blocksOf(rgs) {
  const B = [];
  rgs.forEach((b, i) => { (B[b] ||= []).push(i); });
  return B;
}
/** Integer partitions of n with parts ≤ max, each weakly decreasing; listed in reverse lexicographic order. */
export function intPartitions(n, max = n) {
  const out = [], cur = [];
  const go = (rem, mx) => {
    if (rem === 0) { out.push(cur.slice()); return; }
    for (let p = Math.min(rem, mx); p >= 1; p--) { cur.push(p); go(rem - p, p); cur.pop(); }
  };
  go(n, max);
  return out;
}
/** Conjugate partition (transpose of the Ferrers diagram). */
export function conjugate(parts) {
  const out = [];
  for (let j = 0; j < (parts[0] || 0); j++) out.push(parts.filter((p) => p > j).length);
  return out;
}
/** Cycles of a permutation p (p[i] = image of i), each starting at its least element, sorted by that element. */
export function cyclesOf(p) {
  const seen = Array(p.length).fill(false), out = [];
  for (let i = 0; i < p.length; i++) {
    if (seen[i]) continue;
    const cyc = []; let j = i;
    while (!seen[j]) { seen[j] = true; cyc.push(j); j = p[j]; }
    out.push(cyc);
  }
  return out;
}

// ------------------------------------------------------------------ layout
/**
 * Lay out `count` items of shape h/w = aspect in a W×H box with gaps; picks the column count that
 * makes the items largest (centred, or top-aligned with valign = 'top'). Returns {cols, rows, w, h, th, at(i) → [x, y]}
 * (pixels, top-left corners; th = total height used).
 */
export function fitGrid(count, W, H, aspect = 1, gap = 6, maxW = Infinity, valign = 'center') {
  let best = null;
  for (let cols = 1; cols <= Math.max(1, count); cols++) {
    const rows = Math.ceil(count / cols);
    let w = (W - gap * (cols - 1)) / cols, h = w * aspect;
    if (rows * h + gap * (rows - 1) > H) { h = (H - gap * (rows - 1)) / rows; w = h / aspect; }
    w = Math.min(w, maxW); h = w * aspect;
    if (!best || w > best.w + 1e-9) best = { cols, rows, w, h };
  }
  const { cols, rows, w, h } = best;
  const tw = cols * w + (cols - 1) * gap, th = rows * h + (rows - 1) * gap;
  const x0 = (W - tw) / 2, y0 = valign === 'top' ? 0 : (H - th) / 2;
  return { cols, rows, w, h, gap, x0, y0, th, at: (i) => [x0 + (i % cols) * (w + gap), y0 + Math.floor(i / cols) * (h + gap)] };
}

/**
 * Pixel-space pen on a 2D stage (y grows downwards, origin top-left). Styles: {color, width, dash,
 * fill, fillAlpha (default 1), alpha, r (corner radius)}. Text goes through the stage's own text/TeX.
 */
export function pen(v, s) {
  const c = s.ctx;
  const paint = (st) => {
    if (st.fill) { c.fillStyle = v.color(st.fill, st.fillAlpha ?? 1); c.fill(); }
    if (st.color || st.width || !st.fill) {
      c.strokeStyle = v.color(st.color || 'ink', st.alpha); c.lineWidth = st.width ?? 1.5;
      c.setLineDash(st.dash === true ? [5, 4] : st.dash || []); c.lineCap = 'round'; c.lineJoin = 'round';
      c.stroke(); c.setLineDash([]);
    }
  };
  return {
    W: s.width, H: s.height, ctx: c,
    rect(x, y, w, h, st = {}) { c.beginPath(); if (st.r && c.roundRect) c.roundRect(x, y, w, h, st.r); else c.rect(x, y, w, h); paint(st); },
    line(x1, y1, x2, y2, st = {}) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); paint({ color: 'ink', ...st, fill: null }); },
    path(pts, st = {}) { if (pts.length < 2) return; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (st.close) c.closePath(); paint(st); },
    dot(x, y, r, st = {}) { c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI); paint({ fill: 'ink', ...st }); },
    circle(x, y, r, st = {}) { c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI); paint(st); },
    arc(x, y, r, a0, a1, st = {}) { c.beginPath(); c.arc(x, y, r, a0, a1); paint({ ...st, fill: null }); },
    quad(x1, y1, cx, cy, x2, y2, st = {}) { c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); paint({ ...st, fill: null }); },
    arrow(x1, y1, x2, y2, st = {}) {
      const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return;
      const ux = (x2 - x1) / L, uy = (y2 - y1) / L, hs = Math.min(st.head ?? 7, L * 0.5);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * hs * 0.7, y2 - uy * hs * 0.7); paint({ color: 'ink', ...st, fill: null });
      c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - ux * hs - uy * hs * 0.45, y2 - uy * hs + ux * hs * 0.45); c.lineTo(x2 - ux * hs + uy * hs * 0.45, y2 - uy * hs - ux * hs * 0.45); c.closePath();
      c.fillStyle = v.color(st.color || 'ink', st.alpha); c.fill();
    },
    text(str, x, y, st = {}) { s.textPx(String(str), x, y, st); },
    tex(str, x, y, st = {}) { s.texPx(str, x, y, st); },
    clip(x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); try { fn(); } finally { c.restore(); } },
  };
}
/** Pixel coordinates of a click delivered in data coordinates. */
export const toPx = (s, x, y) => [s.X(x), s.Y(y)];

/**
 * Arc diagram of a set partition: n points on a baseline, consecutive elements of a block joined by
 * arcs above it, blocks coloured by order of least element. rgs = restricted growth string.
 */
export function drawArcPartition(P, rgs, x, y, w, h, st = {}) {
  const n = rgs.length, dx = w / n, base = y + h * 0.78, r = Math.max(1.8, Math.min(st.r ?? 4.5, dx * 0.28));
  const B = blocksOf(rgs);
  B.forEach((blk, b) => {
    const col = st.colorOf ? st.colorOf(b, blk) : CAT[b % CAT.length];
    for (let t = 0; t + 1 < blk.length; t++) {
      const xa = x + (blk[t] + 0.5) * dx, xb = x + (blk[t + 1] + 0.5) * dx, top = base - Math.min(h * 0.72, (xb - xa) * 0.62 + 2);
      P.quad(xa, base, (xa + xb) / 2, top - (top - base) * 0.35, xb, base, { color: col, width: st.width ?? 1.6 });
    }
  });
  for (let i = 0; i < n; i++) {
    const col = st.colorOf ? st.colorOf(rgs[i], B[rgs[i]]) : CAT[rgs[i] % CAT.length];
    P.dot(x + (i + 0.5) * dx, base, r, { fill: col });
    if (st.ring && st.ring(i)) P.circle(x + (i + 0.5) * dx, base, r + 2.2, { color: 'ink', width: 1.3 });
    if (st.labels && dx > 11) P.text(String(i + 1), x + (i + 0.5) * dx, base + r + 6, { size: Math.min(10, dx * 0.6), color: 'muted', align: 'center', halo: false });
  }
}

/** Ferrers diagram (English convention: largest part on top) with top-left corner (x, y) and cell size q. */
export function drawFerrers(P, parts, x, y, q, st = {}) {
  parts.forEach((p, i) => {
    for (let j = 0; j < p; j++) {
      const col = st.colorOf ? st.colorOf(i, j) : st.color || 'blue';
      if (st.boxes) P.rect(x + j * q + 0.5, y + i * q + 0.5, q - 1, q - 1, { fill: col, fillAlpha: st.alpha ?? 0.8, color: col, width: 0.8 });
      else P.dot(x + (j + 0.5) * q, y + (i + 0.5) * q, Math.max(1.1, q * (st.dotScale ?? 0.36)), { fill: col });
    }
  });
}
