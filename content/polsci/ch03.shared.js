// Political Science & Social Choice — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
// Chapter 3 works voter by voter: a profile is an array of strict rankings (arrays of candidate indices, best
// first), one per voter, so that axioms quantifying over profiles can be checked exhaustively. Social outcomes are
// relations S[x][y] ∈ {1, 0, −1} (x above y, tie, below), possibly intransitive, or single winners for choice rules.
// The profile and drawing conventions of ch01.shared.js (candidate colours, chips) are kept.
import { CC, LET, sum, range, perms, txt, chip, rr, FONT, tops, positional, pairwise, bordaW } from './ch01.shared.js';
import { arrowPx, pill, pluralityW, bordaWin, irvW, copelandW, minimaxW, kemenyW, pairwiseT } from './ch02.shared.js';

export const R3 = perms(3);
/** Pairs of three alternatives in the order used by pairwise tables: AB, BC, AC. */
export const PAIRS3 = [[0, 1], [1, 2], [0, 2]];
export const pairName = (x, y) => LET[x] + LET[y];
export const voterName = (i) => `voter ${i + 1}`;
export const coalName = (mask, n) => (mask ? '{' + range(n).filter((i) => mask & (1 << i)).map((i) => i + 1).join(',') + '}' : '∅');
export const popc = (k) => { let c = 0; while (k) { c += k & 1; k >>= 1; } return c; };

// ================================================================== profiles and relations
/** All n-tuples of rankings drawn from `orders` (default all strict rankings of 3). */
export function profilesOf(n, orders = R3) {
  const out = [], cur = [];
  const rec = () => { if (cur.length === n) { out.push(cur.slice()); return; } for (const r of orders) { cur.push(r); rec(); cur.pop(); } };
  rec(); return out;
}
export const toBlocs = (prof, m) => ({ m: m ?? prof[0].length, blocs: prof.map((r) => ({ n: 1, r })) });
export const above = (r, x, y) => r.indexOf(x) < r.indexOf(y);
/** Pattern of pair (x, y): bit i set when voter i ranks x above y. */
export function patternOf(prof, x, y) { let p = 0; prof.forEach((r, i) => { if (above(r, x, y)) p |= 1 << i; }); return p; }
/** Relation matrix from scores (higher is better; equal scores tie). */
export function relFromScores(s) { const m = s.length; return range(m).map((x) => range(m).map((y) => Math.sign(s[x] - s[y]))); }
/** Relation matrix of a strict ranking. */
export const relOfRanking = (r) => { const m = r.length, pos = []; r.forEach((c, k) => { pos[c] = k; }); return range(m).map((x) => range(m).map((y) => Math.sign(pos[y] - pos[x]))); };
/** Is a complete relation (matrix) transitive as a weak order? */
export function isWeakOrder(S) {
  const m = S.length;
  for (let x = 0; x < m; x++) for (let y = 0; y < m; y++) for (let z = 0; z < m; z++) {
    if (x === y || y === z || x === z) continue;
    if (S[x][y] >= 0 && S[y][z] >= 0 && S[x][z] < 0) return false; // R transitive
  }
  return true;
}
/** Weak order as groups, best first ([[0], [1, 2]] = A > B ~ C), or null if not transitive. */
export function groupsOf(S) {
  if (!isWeakOrder(S)) return null;
  const m = S.length, wins = range(m).map((x) => sum(range(m).map((y) => (S[x][y] > 0 ? 1 : 0))));
  const lv = [...new Set(wins)].sort((a, b) => b - a);
  return lv.map((w) => range(m).filter((x) => wins[x] === w));
}
export const relStr = (S) => { const g = groupsOf(S); return g ? g.map((G) => G.map((x) => LET[x]).join('~')).join(' > ') : 'cycle'; };
export const tripleOf = (S) => PAIRS3.map(([x, y]) => S[x][y]);
export function relFromTriple(t) { const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; PAIRS3.forEach(([x, y], k) => { S[x][y] = t[k]; S[y][x] = -t[k]; }); return S; }
/** The 13 weak orders of three alternatives as triples [AB, BC, AC]. */
export const WEAK3 = (() => {
  const out = [];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) if (isWeakOrder(relFromTriple([a, b, c]))) out.push([a, b, c]);
  return out;
})();
/** ALLOW[a + 1][b + 1] = bitmask of AC values c (bit c + 1) that make [a, b, c] a weak order. */
export const ALLOW = (() => {
  const T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const [a, b, c] of WEAK3) T[a + 1][b + 1] |= 1 << (c + 1);
  return T;
})();

// ================================================================== IIA social welfare functions
/**
 * Exhaustive search over the social welfare functions that satisfy IIA, for n voters with strict rankings of three
 * alternatives. By IIA a rule is a triple of pairwise tables f_AB, f_BC, f_AC, each mapping a pattern (the set of
 * voters ranking the first alternative higher, as a bitmask) to 1, 0 or −1. o: { strict (social ties forbidden),
 * pareto, trans (social relation must be a weak order), domain (allowed individual rankings), keep (rules to return) }.
 * Returns { total (size of the family), count, dictators (dictatorial rules among them), rules: [{ f }], ms }.
 */
export function enumIIA(n, o = {}) {
  const t0 = Date.now(), NP = 1 << n, full = NP - 1, vals = o.strict ? [1, -1] : [1, 0, -1];
  const vmask = vals.reduce((a, c) => a | (1 << (c + 1)), 0);
  const profs = profilesOf(n, o.domain || R3);
  const PP = profs.map((pr) => PAIRS3.map(([x, y]) => patternOf(pr, x, y)));
  const seen = PAIRS3.map((_, k) => { const s = new Set(PP.map((q) => q[k])); return range(NP).filter((p) => s.has(p)); });
  // pair tables over the patterns that occur in the domain (others never matter)
  const tables = (k) => {
    const pats = seen[k], out = [], total = Math.pow(vals.length, pats.length);
    for (let code = 0; code < total; code++) {
      const f = Array(NP).fill(null); let t = code, ok = true;
      for (const p of pats) { f[p] = vals[t % vals.length]; t = Math.floor(t / vals.length); }
      if (o.pareto && ((f[full] !== null && f[full] !== 1) || (f[0] !== null && f[0] !== -1))) ok = false;
      if (ok) out.push(f);
    }
    return out;
  };
  const TA = tables(0), TB = tables(1), TC = tables(2);
  const total = TA.length * TB.length * TC.length;
  const keep = o.keep ?? 24, rules = [];
  let count = 0, dictators = 0;
  const isDict = (f, k, i) => seen[k].every((p) => f[p] === ((p >> i) & 1 ? 1 : -1));
  if (o.trans === false) {
    for (let a = 0; a < TA.length && rules.length < keep; a++) rules.push({ f: [TA[a], TB[(a * 3) % TB.length], TC[(a * 7) % TC.length]] });
    return { total, count: total, dictators: n, rules, ms: Date.now() - t0, seen };
  }
  // allowed AC values per pattern, as bitmasks; Pareto narrows the unanimous patterns
  const cMask = Array(NP).fill(vmask);
  if (o.pareto) { cMask[full] &= 1 << 2; cMask[0] &= 1; }
  const al = new Int32Array(NP);
  const bits = [0, 1, 1, 2, 1, 2, 2, 3];
  for (let a = 0; a < TA.length; a++) {
    const fa = TA[a];
    for (let b = 0; b < TB.length; b++) {
      const fb = TB[b];
      for (const p of seen[2]) al[p] = cMask[p];
      let dead = false;
      for (let q = 0; q < PP.length; q++) {
        const pq = PP[q], m2 = ALLOW[fa[pq[0]] + 1][fb[pq[1]] + 1];
        const nv = al[pq[2]] & m2; al[pq[2]] = nv;
        if (!nv) { dead = true; break; }
      }
      if (dead) continue;
      let prod = 1; for (const p of seen[2]) prod *= bits[al[p]];
      if (!prod) continue;
      count += prod;
      for (let i = 0; i < n; i++) if (isDict(fa, 0, i) && isDict(fb, 1, i)) { const okC = seen[2].every((p) => al[p] & (1 << (((p >> i) & 1 ? 1 : -1) + 1))); if (okC) dictators++; }
      if (rules.length < keep) {
        // expand a few explicit rules from the allowed sets (first choice, then varying one pattern)
        const pick = (variant) => { const fc = Array(NP).fill(null); let t = variant; for (const p of seen[2]) { const opts = vals.filter((c) => al[p] & (1 << (c + 1))); fc[p] = opts[t % opts.length]; t = Math.floor(t / opts.length); } return fc; };
        const nv = Math.min(prod, 3);
        for (let k = 0; k < nv && rules.length < keep; k++) rules.push({ f: [fa, fb, pick(k)] });
      }
    }
  }
  return { total, count, dictators, rules, ms: Date.now() - t0, seen };
}
/** Social relation of an IIA rule (pair tables) at a profile. */
export function iiaRel(rule, prof) {
  const t = PAIRS3.map(([x, y], k) => rule.f[k][patternOf(prof, x, y)] ?? 0);
  return relFromTriple(t);
}
/** Description of an IIA rule: dictator / inverse dictator / constant / … */
export function classifyIIA(rule, n, seen) {
  const pats = (k) => (seen ? seen[k] : range(1 << n));
  for (let i = 0; i < n; i++) if ([0, 1, 2].every((k) => pats(k).every((p) => rule.f[k][p] === ((p >> i) & 1 ? 1 : -1)))) return { kind: 'dictator', i, label: `dictator: voter ${i + 1}` };
  for (let i = 0; i < n; i++) if ([0, 1, 2].every((k) => pats(k).every((p) => rule.f[k][p] === ((p >> i) & 1 ? -1 : 1)))) return { kind: 'inverse', i, label: `inverse dictator: reverses voter ${i + 1}` };
  const constPair = [0, 1, 2].map((k) => new Set(pats(k).map((p) => rule.f[k][p])).size === 1);
  if (constPair.every(Boolean)) return { kind: 'constant', label: 'constant: ignores every ballot' };
  if (constPair.some(Boolean)) return { kind: 'imposed', label: `imposed on ${PAIRS3.filter((_, k) => constPair[k]).map(([x, y]) => pairName(x, y)).join(', ')}` };
  const maj = (p) => { const c = popc(p), d = n - c; return c > d ? 1 : c < d ? -1 : 0; };
  if ([0, 1, 2].every((k) => pats(k).every((p) => rule.f[k][p] === maj(p)))) return { kind: 'majority', label: 'pairwise majority' };
  return { kind: 'other', label: 'mixed pairwise rule' };
}
/** Coalition G is decisive for (x over y) under an IIA rule: every pattern where all of G rank x higher gives x. */
export function decisiveIIA(rule, n, G, k, dir, seen) {
  const pats = seen ? seen[k] : range(1 << n);
  return pats.every((p) => { const allG = dir > 0 ? (p & G) === G : (p & G) === 0; return !allG || rule.f[k][p] === dir; });
}

// ================================================================== checking a social welfare function exhaustively
/**
 * Check Arrow's conditions for F: profile → relation matrix, over all profiles of n voters (strict rankings of m).
 * Returns { order: {ok, ex}, pareto: {ok, ex}, iia: {ok, ex}, nd: {ok, dict}, nProf }. Counterexamples:
 * order.ex = { prof, S } (intransitive); pareto.ex = { prof, S, x, y }; iia.ex = { p1, p2, S1, S2, x, y }.
 */
export function checkArrow(F, n, m = 3, orders) {
  const profs = profilesOf(n, orders || perms(m)), out = { nProf: profs.length };
  const rel = profs.map((p) => F(p));
  // ordering
  out.order = { ok: true };
  for (let i = 0; i < profs.length; i++) if (!isWeakOrder(rel[i])) { out.order = { ok: false, ex: { prof: profs[i], S: rel[i] } }; break; }
  // weak Pareto
  out.pareto = { ok: true };
  outer: for (let i = 0; i < profs.length; i++) for (let x = 0; x < m; x++) for (let y = 0; y < m; y++) {
    if (x !== y && profs[i].every((r) => above(r, x, y)) && rel[i][x][y] !== 1) { out.pareto = { ok: false, ex: { prof: profs[i], S: rel[i], x, y } }; break outer; }
  }
  // IIA: profiles with the same pattern on {x, y} must give the same social relation on {x, y}
  out.iia = { ok: true };
  outer2: for (let x = 0; x < m; x++) for (let y = x + 1; y < m; y++) {
    const firstSeen = new Map();
    for (let i = 0; i < profs.length; i++) {
      const p = patternOf(profs[i], x, y), s = rel[i][x][y];
      if (!firstSeen.has(p)) firstSeen.set(p, i);
      else { const j = firstSeen.get(p); if (rel[j][x][y] !== s) { out.iia = { ok: false, ex: { p1: profs[j], p2: profs[i], S1: rel[j], S2: rel[i], x, y } }; break outer2; } }
    }
  }
  // dictators: voter i whose strict preference is always followed strictly
  const dict = range(n).filter((i) => profs.every((p, k) => { for (let x = 0; x < m; x++) for (let y = 0; y < m; y++) if (x !== y && above(p[i], x, y) && rel[k][x][y] !== 1) return false; return true; }));
  out.nd = { ok: dict.length === 0, dict };
  return out;
}

// ================================================================== resolute choice rules on voter-level profiles
const B = (prof) => toBlocs(prof);
export function antipluralityW(P) { const s = positional(P, [1, 1, 1, 1, 1].slice(0, P.m - 1).concat([0]), null); let w = 0; for (let c = 1; c < P.m; c++) if (s[c] > s[w] + 1e-9) w = c; return w; }
/** Menu of resolute rules (ties broken alphabetically). w(prof) → winner index; range = possible winners. */
export const SCF = [
  { id: 'plurality', label: 'plurality', w: (p) => pluralityW(B(p)) },
  { id: 'borda', label: 'Borda', w: (p) => bordaWin(B(p)) },
  { id: 'irv', label: 'IRV', w: (p) => irvW(B(p)) },
  { id: 'copeland', label: 'Copeland', w: (p) => { const P = B(p); return copelandW(pairwiseT(P), P); } },
  { id: 'antiplurality', label: 'anti-plurality', w: (p) => antipluralityW(B(p)) },
  { id: 'kemeny', label: 'Kemeny', w: (p) => kemenyW(pairwiseT(B(p))) },
  { id: 'dictator', label: 'dictator (voter 1)', w: (p) => p[0][0], dictator: true },
  { id: 'ab', label: 'A vs B majority only', w: (p) => { let a = 0; for (const r of p) if (above(r, 0, 1)) a++; return a * 2 >= p.length ? 0 : 1; }, two: true },
];
/**
 * Every profitable misreport of one voter in prof under rule w: [{ i, lie, before, after, gain }], best first
 * (gain = how many places the voter's sincere ranking moves the outcome up).
 */
export function manipulations(prof, w, rankings = perms(prof[0].length)) {
  const before = w(prof), out = [];
  prof.forEach((r, i) => {
    for (const lie of rankings) {
      if (lie.every((c, k) => c === r[k])) continue;
      const q = prof.slice(); q[i] = lie;
      const after = w(q);
      if (after !== before && above(r, after, before)) out.push({ i, lie, before, after, gain: r.indexOf(before) - r.indexOf(after) });
    }
  });
  return out.sort((a, b) => b.gain - a.gain || a.i - b.i);
}

// ================================================================== drawing
/** A ranking as a vertical column of chips (best on top). o = { r, gap, ring(c), alpha(c), mark(c) → colour }. */
export function drawBallot(v, c, X, Y, r, o = {}) {
  const rad = o.r ?? 10, gap = o.gap ?? 2 * rad + 6;
  r.forEach((cand, k) => chip(v, c, X, Y + k * gap, cand, { r: rad, ring: o.ring?.(cand, k), alpha: o.alpha?.(cand, k) ?? 1 }));
  return Y + (r.length - 1) * gap;
}
/**
 * A social relation of three or more alternatives: a weak order as a vertical stack (ties side by side); a cycle as
 * a small triangle of arrows in red. Returns the bottom y.
 */
export function drawRel(v, c, X, Y, S, o = {}) {
  const rad = o.r ?? 10, gap = o.gap ?? 2 * rad + 6, G = groupsOf(S);
  if (G) {
    const sp = 2 * rad + 13;
    G.forEach((grp, k) => {
      const w = (grp.length - 1) * sp;
      grp.forEach((cand, j) => chip(v, c, X - w / 2 + j * sp, Y + k * gap, cand, { r: rad, ring: o.ring?.(cand) }));
      for (let j = 1; j < grp.length; j++) txt(v, c, '~', X - w / 2 + (j - 0.5) * sp, Y + k * gap, { size: 13, color: 'muted', weight: 800 });
    });
    return Y + (G.length - 1) * gap;
  }
  // cycle: triangle
  const m = S.length, R = rad * 1.9, cy = Y + R * 0.8;
  const pos = range(m).map((k) => [X + R * Math.sin((2 * Math.PI * k) / m), cy - R * Math.cos((2 * Math.PI * k) / m)]);
  for (let x = 0; x < m; x++) for (let y = 0; y < m; y++) if (S[x][y] > 0) arrowPx(v, c, pos[x][0], pos[x][1], pos[y][0], pos[y][1], { color: 'red', width: 1.6, t0: rad + 1, t1: rad + 2, head: 6 });
  range(m).forEach((k) => chip(v, c, pos[k][0], pos[k][1], k, { r: rad * 0.85 }));
  return cy + R;
}
/** Compact social relation text with candidate-coloured letters, centred at (X, Y). */
export function relText(v, c, S, X, Y, o = {}) {
  const G = groupsOf(S), size = o.size ?? 12;
  const parts = [];
  if (G) G.forEach((grp, k) => { if (k) parts.push({ s: ' > ', col: 'muted' }); grp.forEach((x, j) => { if (j) parts.push({ s: '~', col: 'muted' }); parts.push({ s: LET[x], col: CC[x] }); }); });
  else parts.push({ s: 'cycle', col: 'red' });
  c.save(); c.font = FONT(size, 750);
  const w = sum(parts.map((p) => c.measureText(p.s).width));
  let x0 = o.align === 'left' ? X : X - w / 2;
  for (const p of parts) { c.fillStyle = v.color(p.col); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(p.s, x0, Y); x0 += c.measureText(p.s).width; }
  c.restore();
  return w;
}
/** A coloured status tag (✓ / ✗ + text) in pixels, left-aligned at (X, Y). Returns its width. */
export function tag(v, c, ok, text, X, Y, o = {}) {
  const col = ok === null ? 'muted' : ok ? 'green' : 'red', size = o.size ?? 11.5;
  c.save(); c.font = FONT(size, 700); const w = c.measureText(text).width + 30, h = size + 9;
  rr(c, X, Y - h / 2, w, h, h / 2); c.fillStyle = v.color(col, o.sel ? 0.28 : 0.12); c.fill(); c.strokeStyle = v.color(col, o.sel ? 1 : 0.6); c.lineWidth = o.sel ? 2 : 1; c.stroke(); c.restore();
  txt(v, c, ok === null ? '–' : ok ? '✓' : '✗', X + 12, Y + 0.5, { size: size + 1, weight: 800, color: col });
  txt(v, c, text, X + 23, Y + 0.5, { size, weight: 650, color: 'ink', align: 'left' });
  return w;
}
/** The lattice of coalitions of n ≤ 3 voters (a cube's Hasse diagram) in a pixel box; fill(mask) → [colour, alpha]. */
export function drawLattice(v, c, box, n, o = {}) {
  const [x0, y0, x1, y1] = box, levels = range(n + 1).map((k) => range(1 << n).filter((m) => popc(m) === k));
  const pos = [];
  levels.forEach((L, k) => L.forEach((mask, j) => { pos[mask] = [x0 + ((j + 1) * (x1 - x0)) / (L.length + 1), y1 - (k * (y1 - y0)) / n]; }));
  c.save(); c.strokeStyle = v.color('faint'); c.lineWidth = 1.2;
  for (let a = 0; a < 1 << n; a++) for (let i = 0; i < n; i++) if (!(a & (1 << i))) { const b = a | (1 << i); c.beginPath(); c.moveTo(...pos[a]); c.lineTo(...pos[b]); c.stroke(); }
  c.restore();
  const rw = o.w ?? 46, rh = o.h ?? 22;
  for (let a = 0; a < 1 << n; a++) {
    const [X, Y] = pos[a], f = o.fill?.(a) || ['panel', 1];
    rr(c, X - rw / 2, Y - rh / 2, rw, rh, 7); c.fillStyle = v.color('panel'); c.fill(); c.fillStyle = v.color(f[0], f[1]); c.fill();
    c.strokeStyle = v.color(o.stroke?.(a) || 'muted'); c.lineWidth = o.stroke?.(a) ? 2 : 1; c.stroke();
    txt(v, c, coalName(a, n), X, Y + 0.5, { size: 11.5, weight: 700, color: o.text?.(a) || 'ink' });
  }
  return pos;
}
export { CC, LET, sum, range, perms, txt, chip, rr, FONT, arrowPx, pill, tops, pairwise, bordaW };
