// Political Science & Social Choice — Chapter 2: Voting paradoxes and fairness criteria (part b: agendas, the chair, Saari, compound majorities, judgments, real elections)
import {
  CC, LET, sum, range, clamp, perms, mkProfile, copyProfile, setProfile, total, rkStr, best, names,
  tops, pairwise, positional, borda, irv, condorcet, rr, txt, chip, winTag, blocEditor, drawRepTriangle, counts3,
} from './ch01.shared.js';
import { pairwiseT, cwOf, irvW, irvRun, cloneP, raise, shift, addGroup, tidy, arrowPx, drawTourney, pill, fmtK, drawIRV } from './ch02.shared.js';

// ---------- local helpers
function linePx(v, c, x0, y0, x1, y1, col, w = 1.5, dash = null, alpha = 1) {
  c.save(); c.strokeStyle = v.color(col, alpha); c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
}
function hlinePx(v, c, x0, x1, Y, col, dash, w = 1.3) { linePx(v, c, x0, Math.round(Y) + 0.5, x1, Math.round(Y) + 0.5, col, w, dash); }
const ring = (m, cx, cy, R, rot = 0) => range(m).map((k) => [cx + R * Math.sin((2 * Math.PI * k) / m + rot), cy - R * Math.cos((2 * Math.PI * k) / m + rot)]);
const ord = (k) => ['first', 'second', 'third', 'fourth', 'fifth'][k];
const pct = (a, n, d = 0) => `${((100 * a) / (n || 1)).toFixed(d)}%`;
/** Majority winner of a vs b (ties keep a). */
const maj = (N, a, b) => (N[b][a] > N[a][b] ? b : a);

export default {
  collection: 'polsci',
  chapter: 2,
  items: [
  ],
};
