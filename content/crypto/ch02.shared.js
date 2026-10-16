// Cryptography — Chapter 2 shared helpers (perfect secrecy).
// Re-exports what chapter 1 already built, and adds entropy helpers and a tiny bitmap font.
export {
  A, mod, clamp, norm, code, vigC, randomKey, shuffled, LOGP, LOGB, H2, GETTYSBURG, LOG2_FACT26,
  equivocation, topAt, pix, letterRow, tile, dashedBox,
} from './ch01.shared.js';

export const LOG2_26 = Math.log2(26);
/** Shannon entropy in bits of a probability vector. */
export const ent = (p) => -p.reduce((s, x) => (x > 0 ? s + x * Math.log2(x) : s), 0);
export const normalize = (w) => { const t = w.reduce((a, b) => a + b, 0) || 1; return w.map((x) => x / t); };
export const bits = (n, w) => n.toString(2).padStart(w, '0');

// ------------------------------------------------------------------ 5x7 bitmap font (capital letters) and pictures
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
};
/** A W×H bitmap (Uint8Array, row-major) with the text drawn in the 5×7 font at the given integer scale, centred. */
export function textBitmap(str, W, H, scale = 2) {
  const out = new Uint8Array(W * H), chars = [...String(str).toUpperCase()].filter((c) => FONT[c] || c === ' ').slice(0, Math.floor(W / (6 * scale)));
  const tw = chars.length * 6 * scale - scale, x0 = Math.floor((W - tw) / 2), y0 = Math.floor((H - 7 * scale) / 2);
  chars.forEach((ch, i) => {
    const g = FONT[ch]; if (!g) return;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r][c] === '#') for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const x = x0 + i * 6 * scale + c * scale + dx, y = y0 + r * scale + dy;
      if (x >= 0 && x < W && y >= 0 && y < H) out[y * W + x] = 1;
    }
  });
  return out;
}
/** A smiling face (ring, two eyes, mouth) centred in a W×H bitmap. */
export function smileyBitmap(W, H) {
  const out = new Uint8Array(W * H), cx = (W - 1) / 2, cy = (H - 1) / 2, R = Math.min(W, H) / 2 - 1.5;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    const ring = d <= R && d >= R - 2.2;
    const eye = Math.hypot(dx + R * 0.36, dy + R * 0.28) <= R * 0.13 + 0.8 || Math.hypot(dx - R * 0.36, dy + R * 0.28) <= R * 0.13 + 0.8;
    const dm = Math.hypot(dx, dy - R * 0.05), mouth = dm <= R * 0.58 && dm >= R * 0.58 - 2.2 && dy > R * 0.2;
    if (ring || eye || mouth) out[y * W + x] = 1;
  }
  return out;
}
/** Fill the 1-pixels of a bitmap as one path on a stage's canvas, in CSS pixels at (x, y) with total width w. */
export function paintBits(s, color, bitsArr, GW, GH, x, y, w) {
  const ctx = s.ctx, cs = w / GW; ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (bitsArr[j * GW + i]) ctx.rect(x + i * cs, y + j * cs, cs + 0.35, cs + 0.35);
  ctx.fill(); ctx.restore();
}
export const xorBits = (a, b) => { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] ^ b[i]; return o; };
export const randBits = (r, n) => { const o = new Uint8Array(n); for (let i = 0; i < n; i++) o[i] = r() < 0.5 ? 1 : 0; return o; };
