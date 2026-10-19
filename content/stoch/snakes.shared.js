// Hasbro A4756 official product photographs: all 19 endpoints checked together
// against the full board and overhead play view; see stoch-source-review.md.
export const HASBRO_JUMPS = Object.freeze({ 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100, 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 });
/** One roll, with at most one jump. Hasbro A4756's exact-finish rule is the
 * default; overshoot-wins is an explicitly selectable mathematical variant.
 */
export function snakeLanding(s, d, jumps = HASBRO_JUMPS, overshootWins = false) {
  if (s === 100) return 100;
  const t = s + d;
  if (t > 100) return overshootWins ? 100 : s;
  return t === 100 ? 100 : (jumps[t] ?? t);
}
export function snakesMatrix(jumps = HASBRO_JUMPS, overshootWins = false) {
  return Array.from({ length: 101 }, (_, s) => {
    const row = Array(101).fill(0);
    if (s === 100) { row[100] = 1; return row; }
    for (let d = 1; d <= 6; d++) row[snakeLanding(s, d, jumps, overshootWins)] += 1 / 6;
    return row;
  });
}
