// Vector Calculus — Chapter 4: helpers shared by ch04.js and ch04-b.js
export * from './ch03.shared.js';

/** Composite Simpson rule for g on [a, b] with n (even) panels. */
export function simpson(g, a, b, n = 200) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Signed area of a polygon (counter-clockwise positive). */
export function polyArea(P) {
  let a = 0;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1];
  return a / 2;
}
/** Centroid of a simple polygon's region. */
export function polyCentroid(P) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const w = P[j][0] * P[i][1] - P[i][0] * P[j][1];
    a += w; cx += (P[j][0] + P[i][0]) * w; cy += (P[j][1] + P[i][1]) * w;
  }
  return [cx / (3 * a), cy / (3 * a)];
}
/** Even-odd point-in-polygon test. */
export function inPoly(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    if (P[i][1] > y !== P[j][1] > y && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
  }
  return c;
}
/** Log-spaced integers 1..n (deduplicated), for convergence plots. */
export function logInts(n, k = 24) {
  const out = new Set();
  for (let i = 0; i < k; i++) out.add(Math.max(1, Math.round(Math.exp((Math.log(n) * i) / (k - 1)))));
  return [...out].sort((a, b) => a - b);
}
