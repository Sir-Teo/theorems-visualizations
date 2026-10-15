// Search over the whole atlas: written and planned ideas, landmark papers, fields, collections, chapters, bridges.
//
// Query language (all parts optional, combined with AND):
//   words          every word must match the name or the description (prefix match; one typo allowed in long words)
//   "a phrase"     exact phrase
//   kind:theorem   kind (prefix: kind:thm, kind:paper, kind:def …)      field:physics   field id, short name or title
//   col:mech       collection id or short name (in: works too)            year:1900-1950  year:>1900  year:<1800  year:1905
//   by:shannon     author / credit                                        is:planned  is:written  is:paper
//   pma 4.16       a collection plus a number jumps straight to that item
// Everything is normalized: case, accents, TeX commands and Greek letters (λ ↔ lambda) do not matter.

const GREEK = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', ζ: 'zeta', η: 'eta', θ: 'theta', ι: 'iota', κ: 'kappa', λ: 'lambda', μ: 'mu', ν: 'nu', ξ: 'xi', π: 'pi', ρ: 'rho', σ: 'sigma', τ: 'tau', φ: 'phi', χ: 'chi', ψ: 'psi', ω: 'omega', Γ: 'gamma', Δ: 'delta', Θ: 'theta', Λ: 'lambda', Π: 'pi', Σ: 'sigma', Φ: 'phi', Ψ: 'psi', Ω: 'omega', ℝ: 'r reals', ℂ: 'c complex', ℤ: 'z integers', ℕ: 'n naturals', ℚ: 'q rationals', '∞': 'infinity', '∑': 'sum', '∫': 'integral', '∂': 'partial', '∇': 'nabla grad' };
const GREEK_RE = new RegExp(`[${Object.keys(GREEK).join('')}]`, 'g');

/** Lowercase, accent-free, TeX-free, punctuation-free text. */
export function norm(s) {
  return String(s || '')
    .replace(GREEK_RE, (c) => ` ${GREEK[c]} `)
    .replace(/\\(mathbb|mathrm|mathcal|mathbf|operatorname|text|textbf|emph)\b/g, ' ')
    .replace(/\\([a-zA-Z]+)/g, ' $1 ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[’']s\b/g, 's').replace(/[^a-z0-9.]+/g, ' ').replace(/(^|\s)\.+|\.+(\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
}
const words = (s) => (s ? s.split(' ') : []);

/** Damerau–Levenshtein distance ≤ 1? (cheap check for typo tolerance) */
function near1(a, b) {
  if (a === b) return true; const la = a.length, lb = b.length; if (Math.abs(la - lb) > 1) return false;
  let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/**
 * Build the index. ctx: {G, chapterOf(col, n), fullLabel(it)}. Call again when statements or planned items arrive.
 */
export function buildIndex({ G, chapterOf }) {
  const entries = [];
  const all = [...G.items, ...(G.planned || [])];
  for (const it of all) {
    const C = G.colById.get(it.col); if (!C) continue; const F = G.fieldById.get(C.field); const Ch = chapterOf(it.col, it.c);
    const name = norm(it.name);
    const body = norm([it.kind, C.short, C.title, F?.short, F?.title, Ch?.title, (it.tags || []).join(' '), it.st, it.pic, it.credit, it.au, it.paper?.authors, it.paper?.title, it.paper?.venue].filter(Boolean).join(' '));
    entries.push({ t: 'item', it, name, nw: words(name), body, num: it.num, yr: it.yr, kind: it.kind, col: it.col, field: C.field, by: norm([it.credit, it.au, it.paper?.authors].filter(Boolean).join(' ')), planned: !!it.planned, w: it.planned ? Math.min(1.5, (G.allChildren?.get(it.id)?.length || 0) / 8) : 1.5 + Math.min(3, (it.desc || 0) / 30) });
  }
  for (const F of G.fields) { const name = norm(`${F.title} ${F.short}`); entries.push({ t: 'field', F, name, nw: words(name), body: norm((F.areas || []).map((a) => a.title || a).join(' ') + ' ' + (F.blurb || '')), field: F.id }); }
  for (const C of G.collections) {
    const name = norm(`${C.title} ${C.short} ${C.id}`);
    entries.push({ t: 'col', C, name, nw: words(name), body: norm(`${C.blurb || ''} ${C.source?.author || ''} ${C.source?.title || ''} ${(C.source?.refs || []).join(' ')}`), col: C.id, field: C.field });
    for (const Ch of C.chapters) if (Ch.title) { const nm = norm(Ch.title); entries.push({ t: 'ch', C, Ch, name: nm, nw: words(nm), body: norm(`${C.title} ${C.short} ${Ch.summary || ''}`), col: C.id, field: C.field }); }
  }
  for (const B of G.bridges || []) { const nm = norm(B.title); entries.push({ t: 'bridge', B, name: nm, nw: words(nm), body: norm(B.blurb) }); }
  return entries;
}

const KINDS = ['Theorem', 'Lemma', 'Corollary', 'Proposition', 'Definition', 'Law', 'Principle', 'Postulate', 'Algorithm', 'Model', 'Concept', 'Phenomenon', 'Method', 'Paradox', 'Hypothesis', 'Invention', 'Event', 'Paper'];
const KIND_ALIAS = { thm: 'Theorem', lem: 'Lemma', cor: 'Corollary', prop: 'Proposition', def: 'Definition', alg: 'Algorithm', algo: 'Algorithm' };

/** Parse a query into words, phrases and filters. Unknown operators are treated as words. */
export function parseQuery(q, G) {
  const out = { words: [], phrases: [], kind: null, field: null, col: null, yr: null, by: [], status: null, num: null, raw: q };
  const re = /"([^"]+)"|(\S+)/g; let m; const toks = [];
  while ((m = re.exec(q))) toks.push(m[1] != null ? { phrase: m[1] } : { tok: m[2] });
  const findCol = (v) => { v = v.toLowerCase(); return G.collections.find((C) => C.id === v || C.short.toLowerCase() === v)?.id || G.collections.find((C) => norm(C.title).startsWith(norm(v)))?.id || null; };
  const findField = (v) => { v = norm(v); return G.fields.find((F) => F.id === v || norm(F.short) === v)?.id || G.fields.find((F) => norm(F.title).startsWith(v))?.id || null; };
  for (const t of toks) {
    if (t.phrase) { const p = norm(t.phrase); if (p) out.phrases.push(p); continue; }
    const mm = /^([a-z]+):(.+)$/i.exec(t.tok);
    if (mm) {
      const [, op, v] = mm; const o = op.toLowerCase();
      if (o === 'kind' || o === 'type') { const k = KIND_ALIAS[v.toLowerCase()] || KINDS.find((K) => K.toLowerCase().startsWith(v.toLowerCase().replace(/s$/, ''))); if (k) { out.kind = k; continue; } }
      if (o === 'field') { const f = findField(v); if (f) { out.field = f; continue; } }
      if (o === 'col' || o === 'in' || o === 'collection') { const c = findCol(v); if (c) { out.col = c; continue; } }
      if (o === 'year' || o === 'yr') {
        let r = null, x;
        if ((x = /^(-?\d+)\s*-\s*(-?\d+)$/.exec(v))) r = [+x[1], +x[2]];
        else if ((x = /^([<>])=?(-?\d+)$/.exec(v))) r = x[1] === '<' ? [-1e9, +x[2]] : [+x[2], 1e9];
        else if ((x = /^(-?\d+)s$/.exec(v))) r = [+x[1], +x[1] + (+x[1] % 100 === 0 ? 99 : 9)]; // 1900s, 1920s
        else if (/^-?\d+$/.test(v)) r = [+v, +v];
        if (r) { out.yr = r; continue; }
      }
      if (o === 'by' || o === 'author') { out.by.push(norm(v)); continue; }
      if (o === 'is' || o === 'has') { const s = v.toLowerCase(); if (s === 'planned' || s === 'written') { out.status = s; continue; } if (s === 'paper' || s === 'papers') { out.kind = 'Paper'; continue; } }
    }
    if (/^\d+(\.\d+){1,2}[a-z]?$/.test(t.tok)) { out.num = t.tok; continue; }
    out.words.push(...words(norm(t.tok)));
  }
  // "pma 4.16": a bare collection code next to a number scopes the number
  if (out.num && !out.col) { const i = out.words.findIndex((w) => findColExact(G, w)); if (i >= 0) { out.col = findColExact(G, out.words[i]); out.words.splice(i, 1); } }
  return out;
}
const findColExact = (G, w) => G.collections.find((C) => C.id === w || C.short.toLowerCase() === w)?.id || null;

function scoreText(e, Q) {
  let s = 0;
  for (const w of Q.words) {
    let best = 0;
    for (const nw of e.nw) {
      if (nw === w) { best = 16; break; }
      if (nw.startsWith(w)) best = Math.max(best, w.length >= 2 ? 12 : 6);
      else if (w.length >= 5 && nw.length >= 4 && near1(nw, w)) best = Math.max(best, 6);
    }
    if (!best && w.length >= 3 && e.name.includes(w)) best = 8;
    if (!best && e.body) { if ((' ' + e.body).includes(' ' + w)) best = 4; else if (w.length >= 4 && e.body.includes(w)) best = 2; }
    if (!best) return 0;
    s += best;
  }
  for (const p of Q.phrases) { if (e.name.includes(p)) s += 14; else if (e.body?.includes(p)) s += 5; else return 0; }
  if (Q.words.length && e.name === Q.words.join(' ')) s += 20;
  return s;
}

/** Run a query. Returns {items, pages, total, facets: {field, kind, status}} (items sorted by relevance). */
export function runSearch(index, q, G, { limit = 60 } = {}) {
  const Q = typeof q === 'string' ? parseQuery(q, G) : q;
  const hasText = Q.words.length || Q.phrases.length;
  const filtered = Q.kind || Q.field || Q.col || Q.yr || Q.by.length || Q.status || Q.num;
  if (!hasText && !filtered) return { Q, items: [], pages: [], total: 0, facets: { field: {}, kind: {}, status: {} } };
  const items = [], pages = [];
  for (const e of index) {
    if (e.t !== 'item') {
      if (!hasText || Q.kind || Q.yr || Q.by.length || Q.status || Q.num) continue;
      if ((Q.field && e.field !== Q.field) || (Q.col && e.col !== Q.col)) continue;
      const s = scoreText(e, Q); if (s) pages.push([s + (e.t === 'field' ? 4 : e.t === 'col' ? 3 : e.t === 'bridge' ? 2 : 0), e]);
      continue;
    }
    if (Q.kind && e.kind !== Q.kind) continue;
    if (Q.field && e.field !== Q.field) continue;
    if (Q.col && e.col !== Q.col) continue;
    if (Q.status && (Q.status === 'planned') !== e.planned) continue;
    if (Q.yr && !(e.yr != null && e.yr >= Q.yr[0] && e.yr <= Q.yr[1])) continue;
    if (Q.by.length && !Q.by.every((b) => (' ' + e.by).includes(' ' + b) || e.by.includes(b))) continue;
    let s = 1;
    if (Q.num) { if (e.num === Q.num) s += 100; else if (e.num.startsWith(Q.num + '.') || e.num.startsWith(Q.num)) s += 20; else continue; }
    if (hasText) { const t = scoreText(e, Q); if (!t) continue; s += t; }
    items.push([s + e.w + (e.kind === 'Paper' && Q.by.length ? 2 : 0), e]);
  }
  items.sort((a, b) => b[0] - a[0]); pages.sort((a, b) => b[0] - a[0]);
  const facets = { field: {}, kind: {}, status: { written: 0, planned: 0 } };
  for (const [, e] of items) { facets.field[e.field] = (facets.field[e.field] || 0) + 1; facets.kind[e.kind] = (facets.kind[e.kind] || 0) + 1; facets.status[e.planned ? 'planned' : 'written']++; }
  return { Q, items: items.slice(0, limit).map((x) => x[1].it), all: items.map((x) => x[1].it), pages: pages.slice(0, 6).map((x) => x[1]), total: items.length, facets };
}

/** Wrap matched words of a plain string in <mark> (input must already be HTML-escaped plain text). */
export function highlight(html, Q) {
  const ws = [...Q.words.filter((w) => w.length >= 2), ...Q.phrases].sort((a, b) => b.length - a.length);
  if (!ws.length) return html;
  const re = new RegExp(`(${ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, text) => (tag ? tag : text.replace(re, '<mark>$1</mark>')));
}
