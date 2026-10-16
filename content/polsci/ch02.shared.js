// Political Science & Social Choice — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
//
// Builds on the profile model of ch01.shared.js: P = { m, blocs: [{ n, r }] }, r a ranked ballot (best first) that
// may be truncated (candidates left off rank below every listed one). Every rule here is resolute: ties are broken by
// a fixed order (the earlier letter), so the searches below compare single winners.
import { CC, LET, sum, range, perms, tops, positional, bordaW as bordaVec, txt, chip, irv, drawSankey } from './ch01.shared.js';

// ================================================================== tallies with truncated ballots
/** N[x][y] = voters ranking x above y, a listed candidate counting above every unlisted one. */
export function pairwiseT(P) {
  const m = P.m, N = range(m).map(() => Array(m).fill(0));
  for (const b of P.blocs) {
    if (!b.n) continue;
    const listed = new Set(b.r);
    for (let i = 0; i < b.r.length; i++) {
      for (let j = i + 1; j < b.r.length; j++) N[b.r[i]][b.r[j]] += b.n;
      for (let y = 0; y < m; y++) if (!listed.has(y)) N[b.r[i]][y] += b.n;
    }
  }
  return N;
}
const first = (s, C) => { let w = C[0]; for (const c of C) if (s[c] > s[w] + 1e-9) w = c; return w; };
const last = (s, C) => { let w = C[0]; for (const c of C) if (s[c] <= s[w] + 1e-9) w = c; return w; };

// ================================================================== resolute rules (winner index)
export const cwOf = (N) => { const m = N.length; for (let x = 0; x < m; x++) { let ok = true; for (let y = 0; y < m; y++) if (y !== x && N[x][y] <= N[y][x]) { ok = false; break; } if (ok) return x; } return -1; };
export const pluralityW = (P) => first(tops(P), range(P.m));
export const bordaWin = (P) => first(positional(P, bordaVec(P.m)), range(P.m));
/** IRV winner and elimination order (the candidate with fewest votes goes; ties: the later letter). */
export function irvRun(P) {
  let alive = range(P.m); const out = [];
  for (;;) {
    const cnt = tops(P, alive), cont = sum(alive.map((c) => cnt[c])), lead = first(cnt, alive);
    if (alive.length === 1 || cnt[lead] > cont / 2) return { win: lead, out, last: cnt };
    const lo = last(cnt, alive); out.push(lo); alive = alive.filter((c) => c !== lo);
  }
}
export const irvW = (P) => irvRun(P).win;
export function copelandW(N, P) {
  const m = N.length, s = range(m).map((x) => sum(range(m).map((y) => (y === x ? 0 : N[x][y] > N[y][x] ? 1 : N[x][y] === N[y][x] ? 0.5 : 0))));
  const top = Math.max(...s), T = range(m).filter((x) => s[x] === top);
  if (T.length === 1) return T[0];
  const b = range(m).map((x) => sum(N[x])); return first(b, T); // ties: larger Borda score (row sum)
}
export function minimaxW(N) { const m = N.length, s = range(m).map((x) => Math.max(...range(m).filter((y) => y !== x).map((y) => N[y][x]))); return range(m).reduce((a, x) => (s[x] < s[a] ? x : a), 0); }
export function kemenyW(N) {
  let bestR = null, bs = Infinity;
  for (const R of perms(N.length)) { let d = 0; for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) d += N[R[j]][R[i]]; if (d < bs) { bs = d; bestR = R; } }
  return bestR[0];
}
/** Tideman's ranked pairs: lock majorities from the largest margin down unless they close a cycle. */
export function rankedPairsW(N) {
  const m = N.length, pairs = [];
  for (let x = 0; x < m; x++) for (let y = 0; y < m; y++) if (x !== y && N[x][y] > N[y][x]) pairs.push([x, y, N[x][y] - N[y][x]]);
  pairs.sort((a, b) => b[2] - a[2] || a[0] - b[0] || a[1] - b[1]);
  const L = range(m).map(() => Array(m).fill(false));
  const reach = (a, b) => { const seen = new Set([a]), st = [a]; while (st.length) { const u = st.pop(); if (u === b) return true; for (let w = 0; w < m; w++) if (L[u][w] && !seen.has(w)) { seen.add(w); st.push(w); } } return false; };
  for (const [x, y] of pairs) if (!reach(y, x)) L[x][y] = true;
  for (let x = 0; x < m; x++) if (range(m).every((y) => !L[y][x])) return x;
  return 0;
}
/** Schulze (beatpath) with margins. */
export function schulzeW(N) {
  const m = N.length, d = range(m).map((i) => range(m).map((j) => (i !== j && N[i][j] > N[j][i] ? N[i][j] - N[j][i] : 0)));
  for (let k = 0; k < m; k++) for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j && i !== k && j !== k) d[i][j] = Math.max(d[i][j], Math.min(d[i][k], d[k][j]));
  for (let x = 0; x < m; x++) if (range(m).every((y) => y === x || d[x][y] >= d[y][x])) return x;
  return 0;
}
/** Black: the Condorcet winner if there is one, else the Borda winner. */
export function blackW(N, P) { const c = cwOf(N); return c >= 0 ? c : first(range(N.length).map((x) => sum(N[x])), range(N.length)); }

/** Menu of rules for the participation search: id, label, condorcet?, winner(P). */
export const RULES = [
  { id: 'copeland', label: 'Copeland', cond: true, win: (P) => copelandW(pairwiseT(P), P) },
  { id: 'minimax', label: 'minimax', cond: true, win: (P) => minimaxW(pairwiseT(P)) },
  { id: 'kemeny', label: 'Kemeny', cond: true, win: (P) => kemenyW(pairwiseT(P)) },
  { id: 'rp', label: 'ranked pairs', cond: true, win: (P) => rankedPairsW(pairwiseT(P)) },
  { id: 'schulze', label: 'Schulze', cond: true, win: (P) => schulzeW(pairwiseT(P)) },
  { id: 'black', label: 'Black', cond: true, win: (P) => blackW(pairwiseT(P), P) },
  { id: 'borda', label: 'Borda (not Condorcet)', cond: false, win: (P) => bordaWin(P) },
];

// ================================================================== profile surgery
export const cloneP = (P) => ({ m: P.m, blocs: P.blocs.map((b) => ({ n: b.n, r: b.r.slice() })) });
/** Ballot r with candidate w moved to the top, the others in the same order. */
export const raise = (r, w) => [w, ...r.filter((c) => c !== w)];
/** P with k voters of bloc i switched to ballot r2 (appended as a new bloc). */
export function shift(P, i, k, r2) { const Q = cloneP(P); Q.blocs[i].n -= k; Q.blocs.push({ n: k, r: r2.slice() }); return Q; }
/** P plus g voters casting ballot r. */
export function addGroup(P, r, g) { const Q = cloneP(P); Q.blocs.push({ n: g, r: r.slice() }); return Q; }
/** Random complete-ballot profile: nb blocs with random rankings and sizes in [lo, hi]. */
export function randomProfile(rng, m, nb, lo, hi) {
  const R = perms(m);
  return { m, blocs: range(nb).map(() => ({ n: lo + Math.floor(rng() * (hi - lo + 1)), r: R[Math.floor(rng() * R.length)].slice() })) };
}
/** Merge blocs with the same ballot, drop empty ones. */
export function tidy(P) {
  const map = new Map();
  for (const b of P.blocs) { if (b.n <= 0) continue; const k = b.r.join(','); if (map.has(k)) map.get(k).n += b.n; else map.set(k, { n: b.n, r: b.r.slice() }); }
  return { m: P.m, blocs: [...map.values()] };
}

/**
 * Monotonicity search for a rule: in P, try moving the winner w to the top of k ballots of one bloc. Returns the
 * smallest such move that makes w lose, as { i, k, before: w, after, Q } — or null.
 */
export function monoFail(P, winF) {
  const w = winF(P); let bestM = null;
  P.blocs.forEach((b, i) => {
    if (!b.n || b.r[0] === w) return;
    const r2 = raise(b.r, w);
    for (let k = 1; k <= b.n; k++) {
      if (bestM && k >= bestM.k) break;
      const Q = shift(P, i, k, r2), a = winF(Q);
      if (a !== w) { bestM = { i, k, before: w, after: a, Q, r2 }; break; }
    }
  });
  return bestM;
}
/** No-show search: a group of g ≤ gmax voters with ballot r whose arrival changes the winner to one they like less. */
export function noShowFail(P, winF, gmax, ballots = perms(P.m)) {
  const w0 = winF(P); let bestM = null;
  for (const r of ballots) for (let g = 1; g <= gmax; g++) {
    if (bestM && g >= bestM.g) break;
    const w1 = winF(addGroup(P, r, g));
    if (w1 !== w0 && r.indexOf(w0) < r.indexOf(w1)) { bestM = { r, g, without: w0, with: w1 }; break; }
  }
  return bestM;
}

// ================================================================== drawing
/** Arrow in pixels from (x0, y0) to (x1, y1), trimmed by t0/t1 px; o = {color, width, alpha, dash, head, bend}. */
export function arrowPx(v, c, x0, y0, x1, y1, o = {}) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const t0 = o.t0 ?? 0, t1 = o.t1 ?? 0, bend = o.bend ?? 0;
  const ax = x0 + ux * t0, ay = y0 + uy * t0, bx = x1 - ux * t1, by = y1 - uy * t1;
  const mx = (ax + bx) / 2 - uy * bend, my = (ay + by) / 2 + ux * bend;
  c.save(); c.strokeStyle = v.color(o.color || 'muted', o.alpha ?? 1); c.fillStyle = c.strokeStyle; c.lineWidth = o.width ?? 2; c.lineCap = 'round';
  if (o.dash) c.setLineDash(o.dash);
  c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by); c.stroke(); c.setLineDash([]);
  const hx = bx - mx, hy = by - my, hl = Math.hypot(hx, hy) || 1, h = o.head ?? 10, ex = hx / hl, ey = hy / hl;
  c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - ex * h - ey * h * 0.5, by - ey * h + ex * h * 0.5); c.lineTo(bx - ex * h + ey * h * 0.5, by - ey * h - ex * h * 0.5); c.closePath(); c.fill();
  c.restore();
  return { mx: (ax + 2 * mx + bx) / 4, my: (ay + 2 * my + by) / 4 };
}
/**
 * A majority tournament in pixels: chips at pos[k] = [X, Y] for candidates cand[k]; an arrow winner → loser with the
 * tally on a pill. o = { r, labels (cand → string), color(x, y) → colour, width(x, y), label(x, y, a, b) → string,
 * ring(x) → colour, alpha(x) }.
 */
export function drawTourney(v, c, N, cand, pos, o = {}) {
  const r = o.r ?? 15;
  for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
    const x = cand[i], y = cand[j], a = N[x][y], b = N[y][x];
    const [w, l, pw, pl] = a >= b ? [i, j, a, b] : [j, i, b, a];
    const col = o.color?.(cand[w], cand[l]) || 'muted', wd = o.width?.(cand[w], cand[l]) ?? 2;
    let M;
    if (a === b) {
      c.save(); c.strokeStyle = v.color('faint'); c.lineWidth = 1.6; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(...pos[i]); c.lineTo(...pos[j]); c.stroke(); c.restore();
      M = { mx: (pos[i][0] + pos[j][0]) / 2, my: (pos[i][1] + pos[j][1]) / 2 };
    } else M = arrowPx(v, c, pos[w][0], pos[w][1], pos[l][0], pos[l][1], { color: col, width: wd, t0: r + 3, t1: r + 4, head: 11, bend: typeof o.bend === 'function' ? o.bend(cand[w], cand[l]) : o.bend ?? 0 });
    const lab = o.label ? o.label(cand[w], cand[l], pw, pl) : `${fmtK(pw)}–${fmtK(pl)}`;
    if (lab) pill(v, c, lab, M.mx, M.my, { color: a === b ? 'muted' : col === 'muted' ? 'ink' : col });
  }
  cand.forEach((x, k) => chip(v, c, pos[k][0], pos[k][1], x, { r, ring: o.ring?.(x), label: o.labels?.(x), alpha: o.alpha?.(x) ?? 1 }));
}
/** Text on a rounded halo pill. */
export function pill(v, c, s, X, Y, o = {}) {
  c.save(); c.font = `700 ${o.size ?? 11}px Inter, system-ui, sans-serif`; const w = c.measureText(s).width + 10, h = (o.size ?? 11) + 7;
  c.beginPath(); if (c.roundRect) c.roundRect(X - w / 2, Y - h / 2, w, h, h / 2); else c.rect(X - w / 2, Y - h / 2, w, h);
  c.fillStyle = v.color('panel', 0.94); c.fill(); c.strokeStyle = v.color(o.border || 'faint'); c.lineWidth = 1; c.stroke(); c.restore();
  txt(v, c, s, X, Y + 0.5, { size: o.size ?? 11, weight: 700, color: o.color || 'ink' });
}
/** 12345 → "12,345". */
export const fmtK = (x) => (Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('en-US') : String(+(+x).toFixed(1)));

/**
 * IRV rounds as a Sankey in pixel box [x0, y0, x1, y1] (round headers drawn above y0). Ballots that run out of
 * listed candidates collect in an "exhausted" node. o = { lab(c), col(c), upto (rounds shown, fractional = growing),
 * big (thousands separators), dim }. Returns the irv() result.
 */
export function drawIRV(v, s, P, box, o = {}) {
  const I = irv(P), R = I.rounds, K = R.length, tot = sum(P.blocs.map((b) => b.n));
  const lab = (c) => (o.lab ? o.lab(c) : LET[c]), col = (c) => (o.col ? o.col(c) : CC[c]);
  const cols = R.map((Rd, k) => {
    const nodes = Rd.alive.map((c) => ({ id: c, label: lab(c), color: col(c), value: Rd.counts[c], out: Rd.out === c, win: k === K - 1 && I.win.includes(c), text: Rd.out === c ? 'red' : k === K - 1 && I.win.includes(c) ? 'green' : 'ink' }));
    const ex = tot - Rd.cont; if (ex > 0) nodes.push({ id: 'x', label: 'exhausted', color: 'gray', value: ex, text: 'muted' });
    return nodes;
  });
  const flows = R.slice(0, -1).map((Rd, k) => {
    const f = [...Rd.flows].map(([key, val]) => { const [a, b] = key.split('>'); return { from: +a, to: b === 'x' ? 'x' : +b, value: val, color: col(+a) }; });
    const ex = tot - Rd.cont; if (ex > 0) f.push({ from: 'x', to: 'x', value: ex, color: 'gray' });
    return f;
  });
  const c = s.ctx, colX = (j) => box[0] + (K === 1 ? 0 : (j * (box[2] - box[0] - 14)) / (K - 1));
  const upto = o.upto ?? K;
  for (let j = 0; j < K; j++) txt(v, c, `round ${j + 1}`, colX(j) + 7, box[1] - 14, { size: 11, weight: 600, color: j < Math.ceil(upto) ? 'muted' : 'faint' });
  drawSankey(v, s, cols, flows, box, { upto, colX, labels: (nd) => `${nd.label} ${o.big ? fmtK(nd.value) : +nd.value.toFixed(1)}${nd.out ? ' ✗' : ''}${nd.win ? ' wins' : ''}` });
  return I;
}
export { CC, LET };
