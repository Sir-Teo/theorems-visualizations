// Big History — Chapter 3 shared helpers (imported by ch03.js and ch03-b.js). Chapters 1 and 2 have no shared file to re-export.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** Superscript digits for powers of ten in plain canvas text. */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const pow10 = (k) => `10${String(k).split('').map((ch) => SUP[ch]).join('')}`;

/** Age in Ma as text: 538.8 → "538.8 Ma", 2400 → "2.4 Ga". */
export function fmtAge(ma, d = 1) {
  return Math.abs(ma) >= 1000 ? `${(ma / 1000).toFixed(d)} Ga` : `${ma.toFixed(ma % 1 ? d : 0)} Ma`;
}

/** Text width in px for canvas text at a given size/weight. */
export function textW(s, str, size = 12, weight = 500) {
  const c = s.ctx; c.save(); c.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
  const w = c.measureText(str).width; c.restore(); return w;
}

/** Smoothstep from 0 (x <= a) to 1 (x >= b). */
export const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Thomas algorithm for a tridiagonal system (lower a, diagonal b, upper c, right-hand side d); returns the solution. */
export function tridiag(a, b, c, d) {
  const n = d.length, cp = new Array(n), dp = new Array(n), x = new Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}
