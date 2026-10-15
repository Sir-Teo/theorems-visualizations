// Political Science & Social Choice — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
//
// One electorate model for the whole chapter. A profile is P = { m, blocs: [{ n, r }] }: m candidates
// (0 = A, 1 = B, …) and blocs of n voters who all cast the ranked ballot r (an array of candidate indices,
// best first). Every rule below reads that object, so the items count the same kind of electorate, and the
// editor (blocEditor) lets the reader change bloc sizes by dragging and rankings by clicking.
// A spatial electorate (voters and candidates as points of an issue space) is turned into the same object by
// ranking candidates by distance (spatialProfile).

/** Candidate colours (palette names) and letters. Gold marks winners, red eliminations, green "holds". */
export const CC = ['blue', 'orange', 'purple', 'teal', 'pink'];
export const LET = 'ABCDE';
export const FONT = (size, w = 600) => `${w} ${size}px Inter, system-ui, sans-serif`;
export const sum = (a) => a.reduce((s, x) => s + x, 0);
export const range = (n) => Array.from({ length: n }, (_, i) => i);
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const EPS = 1e-9;

// ================================================================== profiles
/** All permutations of 0..m−1 in lexicographic order. */
export function perms(m) {
  const out = [], cur = [], used = Array(m).fill(false);
  const go = () => {
    if (cur.length === m) { out.push(cur.slice()); return; }
    for (let i = 0; i < m; i++) if (!used[i]) { used[i] = true; cur.push(i); go(); cur.pop(); used[i] = false; }
  };
  go(); return out;
}
/** Profile from [[n, 'ABC'], …]. */
export function mkProfile(m, list) { return { m, blocs: list.map(([n, s]) => ({ n, r: [...s].map((ch) => LET.indexOf(ch)) })) }; }
export const copyProfile = (P) => ({ m: P.m, blocs: P.blocs.map((b) => ({ n: b.n, r: b.r.slice() })) });
export const setProfile = (P, Q) => { P.m = Q.m; P.blocs = copyProfile(Q).blocs; return P; };
export const total = (P) => sum(P.blocs.map((b) => b.n));
export const rkStr = (r, sep = '>') => r.map((c) => LET[c]).join(sep);
export const sameR = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const allC = (P) => range(P.m);
/** Candidates with the largest score among `cands` (several when tied). */
export function best(scores, cands) {
  const mx = Math.max(...cands.map((c) => scores[c]));
  return cands.filter((c) => Math.abs(scores[c] - mx) < EPS);
}
export function worst(scores, cands) {
  const mn = Math.min(...cands.map((c) => scores[c]));
  return cands.filter((c) => Math.abs(scores[c] - mn) < EPS);
}
/** 'A', or 'A, B (tie)'. */
export const names = (ws) => (ws.length === 1 ? LET[ws[0]] : ws.map((c) => LET[c]).join(', ') + ' (tie)');

// ================================================================== tallies
/** First preferences among the candidates in `alive` (all when omitted); ballots ranking none of them are skipped. */
export function tops(P, alive) {
  const s = Array(P.m).fill(0), ok = alive ? new Set(alive) : null;
  for (const b of P.blocs) { const t = ok ? b.r.find((c) => ok.has(c)) : b.r[0]; if (t != null) s[t] += b.n; }
  return s;
}
/** N[x][y] = number of voters ranking x above y. */
export function pairwise(P) {
  const N = range(P.m).map(() => Array(P.m).fill(0));
  for (const b of P.blocs) for (let i = 0; i < b.r.length; i++) for (let j = i + 1; j < b.r.length; j++) N[b.r[i]][b.r[j]] += b.n;
  return N;
}
/** Positional scores with weights w (w[k] for position k among the candidates in `alive`). */
export function positional(P, w, alive) {
  const s = Array(P.m).fill(0), ok = alive ? new Set(alive) : null;
  for (const b of P.blocs) { let k = 0; for (const c of b.r) { if (ok && !ok.has(c)) continue; s[c] += b.n * (w[k] ?? 0); k++; } }
  return s;
}
export const bordaW = (m) => range(m).map((k) => m - 1 - k);
export const borda = (P, alive) => positional(P, bordaW(alive ? alive.length : P.m), alive);

// ================================================================== rules
export function plurality(P, alive = allC(P)) { const s = tops(P, alive); return { scores: s, win: best(s, alive) }; }

/** Order candidates by score (desc), ties broken alphabetically. */
const byScore = (s, cands) => cands.slice().sort((a, b) => s[b] - s[a] || a - b);

/** Two-round runoff on ranked ballots (contingent vote). o.majority: a first-round majority ends it (default true). */
export function runoff(P, o = {}) {
  const alive = allC(P), n = total(P), r1 = tops(P, alive), ord = byScore(r1, alive);
  const majority = o.majority !== false && r1[ord[0]] > n / 2;
  if (majority) return { r1, ord, majority: true, finalists: [ord[0]], r2: r1, win: [ord[0]], n };
  const finalists = ord.slice(0, 2), r2 = tops(P, finalists);
  return { r1, ord, majority: false, finalists, r2, win: best(r2, finalists), n };
}

/**
 * Instant-runoff voting. Each round counts ballots for their top continuing candidate; a majority of the continuing
 * ballots wins, otherwise the candidate with fewest votes is eliminated (ties: the later letter goes) and its ballots
 * move on. o.toEnd: keep eliminating until one candidate is left.
 * Returns { rounds: [{ alive, counts, cont, out, flows: Map('from>to' → n) }], win }.
 * flows records where every bloc's ballot sits in this round and the next ('x' = exhausted).
 */
export function irv(P, o = {}) {
  let alive = allC(P); const rounds = [];
  for (;;) {
    const counts = tops(P, alive), cont = sum(alive.map((c) => counts[c])), lead = byScore(counts, alive)[0];
    const R = { alive: alive.slice(), counts, cont, out: null, flows: new Map() };
    rounds.push(R);
    if (alive.length === 1 || (!o.toEnd && counts[lead] > cont / 2)) { R.win = [lead]; break; }
    const lo = worst(counts, alive); const out = lo[lo.length - 1];
    R.out = out; const next = alive.filter((c) => c !== out), okA = new Set(alive), okN = new Set(next);
    for (const b of P.blocs) {
      if (!b.n) continue;
      const f = b.r.find((c) => okA.has(c)), t = b.r.find((c) => okN.has(c));
      if (f == null) continue;
      const key = `${f}>${t == null ? 'x' : t}`; R.flows.set(key, (R.flows.get(key) || 0) + b.n);
    }
    alive = next;
  }
  return { rounds, win: rounds[rounds.length - 1].win };
}

/** Pairwise majority analysis: winner/loser (−1 if none), Copeland (wins + ½ ties), minimax (largest opposition), Smith set. */
export function condorcet(P, N = pairwise(P)) {
  const m = P.m, C = range(m);
  const beats = (x, y) => N[x][y] > N[y][x];
  const winner = C.find((x) => C.every((y) => y === x || beats(x, y))) ?? -1;
  const loser = C.find((x) => C.every((y) => y === x || beats(y, x))) ?? -1;
  const copeland = C.map((x) => sum(C.map((y) => (y === x ? 0 : beats(x, y) ? 1 : N[x][y] === N[y][x] ? 0.5 : 0))));
  const minimax = C.map((x) => Math.max(...C.filter((y) => y !== x).map((y) => N[y][x])));
  // Smith set: the smallest non-empty set whose members all beat every outsider (subsets checked by size)
  let smith = C;
  const subs = range((1 << m) - 1).map((k) => k + 1).sort((a, b) => popc(a) - popc(b));
  for (const mask of subs) {
    const S = C.filter((c) => mask & (1 << c)), T = C.filter((c) => !(mask & (1 << c)));
    if (S.every((x) => T.every((y) => beats(x, y)))) { smith = S; break; }
  }
  return { N, beats, winner, loser, copeland, minimax, smith, copWin: best(copeland, C), mmWin: worst(minimax, C) };
}
const popc = (k) => { let c = 0; while (k) { c += k & 1; k >>= 1; } return c; };

/** Sequential pairwise voting along an agenda (array of candidates). Ties keep the earlier survivor. */
export function agendaRun(N, order) {
  let cur = order[0]; const matches = [];
  for (let k = 1; k < order.length; k++) {
    const ch = order[k], a = N[cur][ch], b = N[ch][cur], w = b > a ? ch : cur;
    matches.push({ inc: cur, ch, a, b, w }); cur = w;
  }
  return { matches, win: cur };
}

/** Kendall tau distance between two rankings: the number of pairs they order differently. */
export function kendall(r, s) {
  const pos = []; s.forEach((c, k) => { pos[c] = k; });
  let d = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (pos[r[i]] > pos[r[j]]) d++;
  return d;
}
/** Kemeny score of ranking R: Σ over pairs (x above y in R) of N[y][x] = total Kendall distance to the ballots. */
export function kemenyScore(N, R) {
  let d = 0; for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) d += N[R[j]][R[i]];
  return d;
}

/** Approval totals when bloc b approves its top ks[b] candidates (ks a number or an array). */
export function approvalTops(P, ks) {
  const s = Array(P.m).fill(0);
  P.blocs.forEach((b, i) => { const k = Array.isArray(ks) ? ks[i] : ks; for (let j = 0; j < k && j < b.r.length; j++) s[b.r[j]] += b.n; });
  return s;
}

// ================================================================== spatial electorates
/** Candidates ranked by distance from point p (dim 1 uses x only). Ties broken by letter. */
export function rankFrom(p, cands, dim = 2) {
  const d = cands.map((c) => (dim === 1 ? Math.abs(p[0] - c[0]) : Math.hypot(p[0] - c[0], p[1] - c[1])));
  return range(cands.length).sort((a, b) => d[a] - d[b] || a - b);
}
/** Profile from voters (points [x, y] or [x, y, weight]) and candidate points, aggregated by ranking. */
export function spatialProfile(voters, cands, dim = 2) {
  const map = new Map();
  for (const p of voters) {
    const r = rankFrom(p, cands, dim), k = r.join('');
    if (!map.has(k)) map.set(k, { n: 0, r });
    map.get(k).n += p[2] ?? 1;
  }
  return { m: cands.length, blocs: [...map.values()].sort((a, b) => b.n - a.n) };
}

// ================================================================== pixel drawing
/** Rounded-rectangle path. */
export function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
}
/** Text in pixels: o = {size, weight, color, alpha, align, baseline, halo}. */
export function txt(v, c, str, X, Y, o = {}) {
  c.save(); c.font = FONT(o.size ?? 12, o.weight ?? 600); c.textAlign = o.align || 'center'; c.textBaseline = o.baseline || 'middle';
  if (o.halo) { c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = v.color('panel', 0.9); c.strokeText(str, X, Y); }
  c.fillStyle = v.color(o.color || 'ink', o.alpha ?? 1); c.fillText(str, X, Y); c.restore();
}
/** A candidate chip: filled disc in the candidate's colour with its letter. o = {r, alpha, ring, strike, hollow, label}. */
export function chip(v, c, X, Y, cand, o = {}) {
  const r = o.r ?? 10, col = o.color || CC[cand], a = o.alpha ?? 1;
  c.save();
  if (o.ring) { c.beginPath(); c.arc(X, Y, r + 3.2, 0, 2 * Math.PI); c.strokeStyle = v.color(o.ring); c.lineWidth = 2.4; c.stroke(); }
  c.beginPath(); c.arc(X, Y, r, 0, 2 * Math.PI);
  if (o.hollow) { c.fillStyle = v.color('panel'); c.fill(); c.strokeStyle = v.color(col, a); c.lineWidth = 1.8; c.stroke(); }
  else { c.fillStyle = v.color(col, a); c.fill(); }
  c.font = FONT(Math.round(r * 1.15), 700); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = o.hollow ? v.color(col, a) : v.color('panel', a < 1 ? Math.min(1, a + 0.35) : 1);
  c.fillText(o.label ?? LET[cand], X, Y + 0.5);
  if (o.strike) { c.strokeStyle = v.color('red', 0.85); c.lineWidth = 2; c.beginPath(); c.moveTo(X - r - 2, Y + r + 2); c.lineTo(X + r + 2, Y - r - 2); c.stroke(); }
  c.restore();
}
/** Crown-free winner badge: a gold ring + small "winner" tag above (X, Y). */
export function winTag(v, c, X, Y, text = 'winner', color = 'gold') {
  c.save(); c.font = FONT(10.5, 700); const w = c.measureText(text).width + 10;
  rr(c, X - w / 2, Y - 9, w, 17, 8); c.fillStyle = v.color(color, 0.18); c.fill(); c.strokeStyle = v.color(color); c.lineWidth = 1.2; c.stroke();
  c.fillStyle = v.color(color); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, X, Y); c.restore();
}

/**
 * The profile editor: one row per bloc — its ballot as candidate chips (best → worst), then a bar whose length is
 * the bloc size. Drag a bar to resize the bloc; with o.rank, click a candidate to move it up one place.
 * o: { max (largest bloc, default 20), rank, dim(b, k, c) → true to fade a chip, ring(b, k, c) → colour,
 *      note(b, k, c) → small text under a chip, barColor(b) → colour, tag(b) → {text, color} after the count,
 *      alive (Set of candidates still on the ballot; others are struck through), hint (header text), onEdit(kind, i) }.
 * Returns { draw(), hit(x, y) → row index or −1, geom }.
 */
export function blocEditor(v, s, P, o = {}) {
  let G = null, drag = -1;
  const max = () => (typeof o.max === 'function' ? o.max() : o.max ?? 20);
  const geom = () => {
    const W = s.width, H = s.height, nb = P.blocs.length, m = P.m;
    const head = 24, rowH = Math.min(o.rowMax ?? 38, (H - head - 6) / nb);
    const cr = Math.max(7, Math.min(10.5, rowH * 0.33)), step = 2 * cr + 9;
    const cx0 = 14 + cr, chipsEnd = cx0 + (m - 1) * step + cr;
    const bx0 = chipsEnd + 18, bx1 = W - 40;
    return { W, H, nb, m, head, rowH, cr, step, cx0, bx0, bx1, top: head + 2 };
  };
  const rowAt = (py) => { const i = Math.floor((py - G.top) / G.rowH); return i >= 0 && i < G.nb ? i : -1; };
  const setN = (i, px) => { const b = P.blocs[i]; const n = Math.round(clamp((px - G.bx0) / (G.bx1 - G.bx0), 0, 1) * max()); if (n !== b.n) { b.n = n; o.onEdit?.('size', i); } };
  s.onDrag((x, y, ph) => {
    if (!G) return; const px = s.X(x), py = s.Y(y);
    if (ph === 'start') { const i = rowAt(py); drag = i >= 0 && px >= G.bx0 - 8 ? i : -1; if (drag >= 0) setN(drag, px); }
    else if (ph === 'move' && drag >= 0) setN(drag, px);
    else if (ph === 'end') { if (drag >= 0) o.onEdit?.('size-end', drag); drag = -1; }
  });
  s.onClick((x, y) => {
    if (!G || !o.rank) return; const px = s.X(x), py = s.Y(y), i = rowAt(py); if (i < 0 || px > G.bx0 - 10) return;
    const k = Math.round((px - G.cx0) / G.step); if (k < 1 || k >= G.m) return;
    const r = P.blocs[i].r; [r[k - 1], r[k]] = [r[k], r[k - 1]]; o.onEdit?.('rank', i);
  });
  return {
    get geom() { return G; },
    hit(x, y) { return G ? rowAt(s.Y(y)) : -1; },
    draw() {
      G = geom(); const c = s.ctx, mx = max(), alive = typeof o.alive === 'function' ? o.alive() : o.alive;
      txt(v, c, o.hint ?? (o.rank ? 'ballot (best → worst) · click a letter to move it up' : 'ballot (best → worst)'), 12, 12, { size: 11, weight: 500, color: 'muted', align: 'left' });
      txt(v, c, 'voters', G.bx1 + 34, 12, { size: 11, weight: 500, color: 'muted', align: 'right' });
      // scale ticks
      c.save(); c.strokeStyle = v.color('grid'); c.lineWidth = 1;
      for (let t = 0; t <= mx; t += mx > 24 ? 10 : 5) { const X = G.bx0 + (t / mx) * (G.bx1 - G.bx0); c.beginPath(); c.moveTo(Math.round(X) + 0.5, G.top); c.lineTo(Math.round(X) + 0.5, G.top + G.nb * G.rowH); c.stroke(); }
      c.restore();
      P.blocs.forEach((b, i) => {
        const Y = G.top + (i + 0.5) * G.rowH;
        if (i % 2 === 0) { c.fillStyle = v.color('muted', 0.05); c.fillRect(4, G.top + i * G.rowH, G.W - 8, G.rowH); }
        b.r.forEach((cand, k) => {
          const X = G.cx0 + k * G.step;
          const dead = alive && !alive.has(cand);
          chip(v, c, X, Y, cand, { r: G.cr, alpha: dead ? 0.22 : o.dim?.(b, k, cand) ? 0.3 : 1, ring: o.ring?.(b, k, cand), strike: dead });
          if (k < G.m - 1) txt(v, c, '›', X + G.step / 2, Y, { size: 12, color: 'faint' });
          const nt = o.note?.(b, k, cand); if (nt != null && nt !== '') txt(v, c, nt, X, Y + G.cr + 6, { size: 9.5, weight: 700, color: 'muted' });
        });
        const w = (b.n / mx) * (G.bx1 - G.bx0), bh = Math.min(16, G.rowH * 0.48), col = o.barColor?.(b, i) || CC[b.r[0]];
        rr(c, G.bx0, Y - bh / 2, Math.max(w, 2), bh, 4); c.fillStyle = v.color(col, drag === i ? 0.55 : 0.32); c.fill(); c.strokeStyle = v.color(col, 0.9); c.lineWidth = 1.3; c.stroke();
        // grip
        c.fillStyle = v.color(col); c.beginPath(); c.arc(G.bx0 + w, Y, 4.5, 0, 2 * Math.PI); c.fill();
        txt(v, c, String(b.n), G.bx0 + w + 9, Y, { size: 12.5, weight: 700, align: 'left', halo: true });
        const tg = o.tag?.(b, i); if (tg) txt(v, c, tg.text, G.W - 6, Y, { size: 10.5, weight: 700, color: tg.color || 'muted', align: 'right', halo: true });
      });
    },
  };
}

/**
 * Pairwise matrix N in pixel box [x0, y0, x1, y1]: row x, column y holds N[x][y] (voters ranking x above y),
 * tinted green where x beats y and red where x loses. o: { cand (list of candidates, default all), maxCell,
 * fill(i, j) → [colour, alpha] | null (overrides), outline(i, j) → colour, value(i, j) → string, title }.
 */
export function drawMatrix(v, s, N, box, o = {}) {
  const c = s.ctx, C = o.cand || range(N.length), m = C.length;
  const lab = 26, cs = Math.min(o.maxCell ?? 46, (box[2] - box[0] - lab) / m, (box[3] - box[1] - lab - (o.title ? 16 : 0)) / m);
  const X0 = Math.round((box[0] + box[2] - lab - m * cs) / 2 + lab), Y0 = Math.round(box[1] + (o.title ? 16 : 0) + lab + ((box[3] - box[1] - (o.title ? 16 : 0) - lab - m * cs) / 2));
  if (o.title) txt(v, c, o.title, X0 + (m * cs) / 2 - lab / 2, Y0 - lab - 10, { size: 11, weight: 600, color: 'muted' });
  C.forEach((x, i) => {
    chip(v, c, X0 - 14, Y0 + (i + 0.5) * cs, x, { r: Math.min(9, cs * 0.3) });
    chip(v, c, X0 + (i + 0.5) * cs, Y0 - 14, x, { r: Math.min(9, cs * 0.3) });
  });
  C.forEach((x, i) => C.forEach((y, j) => {
    const X = X0 + j * cs, Y = Y0 + i * cs;
    c.fillStyle = v.color('panel'); c.fillRect(X, Y, cs, cs);
    if (i === j) { c.fillStyle = v.color('muted', 0.12); c.fillRect(X, Y, cs, cs); return; }
    const f = o.fill ? o.fill(i, j, x, y) : undefined;
    const ff = f !== undefined ? f : N[x][y] > N[y][x] ? ['green', 0.2] : N[x][y] < N[y][x] ? ['red', 0.1] : ['gold', 0.15];
    if (ff) { c.fillStyle = v.color(ff[0], ff[1]); c.fillRect(X, Y, cs, cs); }
    txt(v, c, o.value ? o.value(i, j, x, y) : String(+N[x][y].toFixed(1)), X + cs / 2, Y + cs / 2, { size: Math.min(14, cs * 0.36), weight: 650, color: N[x][y] > N[y][x] ? 'ink' : 'muted' });
  }));
  c.save(); c.strokeStyle = v.color('faint', 0.8); c.lineWidth = 1;
  for (let k = 0; k <= m; k++) { c.beginPath(); c.moveTo(X0, Y0 + k * cs + 0.5); c.lineTo(X0 + m * cs, Y0 + k * cs + 0.5); c.stroke(); c.beginPath(); c.moveTo(X0 + k * cs + 0.5, Y0); c.lineTo(X0 + k * cs + 0.5, Y0 + m * cs); c.stroke(); }
  c.restore();
  if (o.outline) C.forEach((x, i) => C.forEach((y, j) => { const col = i !== j && o.outline(i, j, x, y); if (col) { c.strokeStyle = v.color(col); c.lineWidth = 2.4; c.strokeRect(X0 + j * cs + 2, Y0 + i * cs + 2, cs - 4, cs - 4); } }));
  return { X0, Y0, cs, m, hit(px, py) { const j = Math.floor((px - X0) / cs), i = Math.floor((py - Y0) / cs); return i >= 0 && i < m && j >= 0 && j < m ? { i, j } : null; } };
}

/**
 * Saari's representation triangle for three candidates in pixel box: vertices A (top), B (bottom left), C (bottom right);
 * the six small triangles are the six rankings (closest vertex first), each showing how many voters hold it.
 * counts: array over perms(3) order [ABC, ACB, BAC, BCA, CAB, CBA]. Pairwise tallies are written beside each edge.
 */
export function drawRepTriangle(v, s, counts, box, o = {}) {
  const c = s.ctx, w = box[2] - box[0], h = box[3] - box[1];
  const side = Math.min(w - 90, (h - 26 - 36) / 0.866), cx = (box[0] + box[2]) / 2, top = box[1] + 26 + Math.max(0, (h - 62 - side * 0.866) / 2);
  const V = [[cx, top], [cx - side / 2, top + side * 0.866], [cx + side / 2, top + side * 0.866]];
  const mid = (a, b) => [(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2];
  const Gc = [(V[0][0] + V[1][0] + V[2][0]) / 3, (V[0][1] + V[1][1] + V[2][1]) / 3];
  const R = perms(3), n = sum(counts) || 1, mx = Math.max(1, ...counts);
  R.forEach((r, k) => {
    const [x, y] = r, M = mid(x, y), pts = [V[x], M, Gc];
    c.beginPath(); c.moveTo(...pts[0]); c.lineTo(...pts[1]); c.lineTo(...pts[2]); c.closePath();
    c.fillStyle = v.color(CC[x], 0.06 + 0.42 * (counts[k] / mx)); c.fill();
    const cen = [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3];
    txt(v, c, String(+counts[k].toFixed(1)), cen[0], cen[1] - 5, { size: 13, weight: 700, halo: true });
    txt(v, c, rkStr(r, ''), cen[0], cen[1] + 9, { size: 9, weight: 600, color: 'muted', halo: true });
  });
  c.save(); c.strokeStyle = v.color('faint'); c.lineWidth = 1; c.setLineDash([3, 3]);
  for (let k = 0; k < 3; k++) { const M = mid((k + 1) % 3, (k + 2) % 3); c.beginPath(); c.moveTo(...V[k]); c.lineTo(...M); c.stroke(); }
  c.setLineDash([]); c.strokeStyle = v.color('muted'); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(...V[0]); c.lineTo(...V[1]); c.lineTo(...V[2]); c.closePath(); c.stroke(); c.restore();
  chip(v, c, V[0][0], V[0][1] - 14, 0, { r: 10 }); chip(v, c, V[1][0] - 14, V[1][1] + 6, 1, { r: 10 }); chip(v, c, V[2][0] + 14, V[2][1] + 6, 2, { r: 10 });
  if (o.pairs !== false) {
    // pairwise tallies: x over y = sum of the three regions on x's side of the bisector of edge xy
    const tally = (x, y) => sum(R.map((r, k) => (r.indexOf(x) < r.indexOf(y) ? counts[k] : 0)));
    const edges = [[0, 1, -1], [0, 2, 1], [1, 2, 0]];
    for (const [x, y, side2] of edges) {
      const M = mid(x, y), a = tally(x, y), b = tally(y, x);
      const out = side2 === 0 ? [M[0], M[1] + 22] : [M[0] + side2 * 36, M[1] - 10];
      const wcol = a > b ? CC[x] : b > a ? CC[y] : 'muted';
      txt(v, c, `${LET[x]} ${+a.toFixed(1)} : ${+b.toFixed(1)} ${LET[y]}`, out[0], out[1], { size: 11.5, weight: 700, color: wcol, halo: true });
    }
  }
  return { V, Gc, side };
}

/** Counts of a 3-candidate profile in perms(3) order. */
export function counts3(P) {
  const R = perms(3); const out = Array(6).fill(0);
  for (const b of P.blocs) { const k = R.findIndex((r) => sameR(r, b.r)); if (k >= 0) out[k] += b.n; }
  return out;
}

/**
 * A Sankey diagram of vote flows in pixel box. cols: [[{ id, label, value, color }]] (top to bottom),
 * flows: [[{ from, to, value, color }]] between column k and k+1 (ids). o: { upto (columns shown; a fraction grows
 * the last flows), nodeW, gap, labels: (node, k) → string, colX(k) }.
 */
export function drawSankey(v, s, cols, flows, box, o = {}) {
  const c = s.ctx, K = cols.length, nodeW = o.nodeW ?? 14, gap = o.gap ?? 7;
  const tot = Math.max(...cols.map((col) => sum(col.map((n) => n.value))));
  const maxNodes = Math.max(...cols.map((col) => col.length));
  const scale = (box[3] - box[1] - gap * (maxNodes - 1)) / tot;
  const colX = (k) => (o.colX ? o.colX(k) : box[0] + (K === 1 ? 0 : (k * (box[2] - box[0] - nodeW)) / (K - 1)));
  const pos = cols.map((col, k) => { let y = box[1]; const m = new Map(); for (const nd of col) { const hgt = nd.value * scale; m.set(nd.id, { y, h: hgt, nd, inY: y, outY: y }); y += hgt + (hgt > 0 ? gap : 0); } return m; });
  const upto = o.upto ?? K, full = Math.floor(upto), frac = upto - full;
  // flows
  for (let k = 0; k < K - 1; k++) {
    const grow = k + 1 < full ? 1 : k + 1 === full && frac > 0 ? frac : 0;
    if (grow <= 0) continue;
    const A = pos[k], B = pos[k + 1];
    const fl = (flows[k] || []).filter((f) => f.value > 0 && A.has(f.from) && B.has(f.to));
    const ordA = [...A.keys()], ordB = [...B.keys()];
    fl.sort((p, q) => ordA.indexOf(p.from) - ordA.indexOf(q.from) || ordB.indexOf(p.to) - ordB.indexOf(q.to));
    const outOrder = fl.slice().sort((p, q) => ordA.indexOf(p.from) - ordA.indexOf(q.from) || ordB.indexOf(p.to) - ordB.indexOf(q.to));
    const inOrder = fl.slice().sort((p, q) => ordB.indexOf(p.to) - ordB.indexOf(q.to) || (p.from === p.to ? -1 : q.from === q.to ? 1 : ordA.indexOf(p.from) - ordA.indexOf(q.from)));
    const ys = new Map();
    for (const f of outOrder) { const a = A.get(f.from); ys.set(f, { y0: a.outY }); a.outY += f.value * scale; }
    for (const f of inOrder) { const b = B.get(f.to); ys.get(f).y1 = b.inY; b.inY += f.value * scale; }
    const x0 = colX(k) + nodeW, x1 = colX(k + 1), xm = (x0 + x1) / 2;
    c.save(); c.beginPath(); c.rect(x0 - 1, 0, (x1 - x0 + 2) * grow, s.height); c.clip();
    for (const f of fl) {
      const { y0, y1 } = ys.get(f), hgt = f.value * scale;
      c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(xm, y0, xm, y1, x1, y1); c.lineTo(x1, y1 + hgt); c.bezierCurveTo(xm, y1 + hgt, xm, y0 + hgt, x0, y0 + hgt); c.closePath();
      c.fillStyle = v.color(f.color, f.from === f.to ? 0.16 : 0.42); c.fill();
    }
    c.restore();
  }
  // nodes
  cols.forEach((col, k) => {
    const a = k < full ? 1 : k === full && frac > 0 ? frac : 0;
    if (a <= 0) return;
    for (const [, p] of pos[k]) {
      if (p.h <= 0) continue;
      rr(c, colX(k), p.y, nodeW, Math.max(p.h, 1.5), 3); c.fillStyle = v.color(p.nd.color, 0.9 * a); c.fill();
      const lab = o.labels ? o.labels(p.nd, k) : `${p.nd.label} ${p.nd.value}`;
      if (lab) txt(v, c, lab, k === K - 1 ? colX(k) + nodeW + 6 : k === 0 ? colX(k) - 6 : colX(k) + nodeW + 5, p.y + p.h / 2, { size: 11, weight: 650, align: k === 0 ? 'right' : 'left', halo: true, alpha: a, color: p.nd.text || 'ink' });
    }
  });
  return { colX, pos };
}
