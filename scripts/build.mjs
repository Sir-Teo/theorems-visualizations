// Build data/catalog.json from content/**: metadata for every item, dependency
// statistics, and a precomputed layout for the global map.
//   node scripts/build.mjs [--strict]
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { loadAll, validate, printProblems, cmpNum, BOOKS, ROOT } from './lib.mjs';

const strict = process.argv.includes('--strict');
const { chapters, items, problems } = await loadAll();
const P = [...problems, ...validate(items)];
const st = printProblems(P, { quiet: !process.argv.includes('--verbose') });
console.log(`${items.length} items in ${chapters.size} chapters — ${st.errors} error(s), ${st.warnings} warning(s)`);
if (st.errors && strict) process.exit(1);

// ---------- de-duplicate & sort ----------
const byId = new Map();
for (const it of items) if (!byId.has(it.id)) byId.set(it.id, it);
const bookOrder = Object.fromEntries(BOOKS.map((b, i) => [b.id, i]));
const all = [...byId.values()].sort((a, b) => bookOrder[a.book] - bookOrder[b.book] || cmpNum(a.num, b.num));
const known = (id) => byId.has(id);
for (const it of all) { it.deps = (it.deps || []).filter((d) => known(d) && d !== it.id); it.see = (it.see || []).filter((d) => known(d) && d !== it.id); }

// ---------- graph statistics ----------
const children = new Map(all.map((it) => [it.id, []]));
for (const it of all) for (const d of it.deps) children.get(d).push(it.id);
const memoAnc = new Map();
function ancestors(id) {
  if (memoAnc.has(id)) return memoAnc.get(id);
  memoAnc.set(id, new Set()); // cycle guard
  const s = new Set();
  for (const d of byId.get(id).deps) { s.add(d); for (const a of ancestors(d)) s.add(a); }
  memoAnc.set(id, s); return s;
}
const memoDepth = new Map();
function depth(id, guard = new Set()) {
  if (memoDepth.has(id)) return memoDepth.get(id);
  if (guard.has(id)) return 0; guard.add(id);
  const d = Math.max(0, ...byId.get(id).deps.map((x) => depth(x, guard) + 1));
  memoDepth.set(id, d); return d;
}
const descCount = new Map(all.map((it) => [it.id, 0]));
for (const it of all) for (const a of ancestors(it.id)) descCount.set(a, descCount.get(a) + 1);

// ---------- layout for the global map ----------
// One horizontal row per book; chapters left→right; inside a chapter, columns by
// intra-chapter dependency level and rows ordered by barycentre of predecessors.
const COL = 34, CH_GAP = 70, ROW = 19, BOOK_GAP = 170;
const pos = new Map();
const bands = [];
let cursor = 0;
for (const B of BOOKS) {
  const chs = [...chapters.values()].filter((c) => c.book === B.id).sort((a, b) => a.chapter - b.chapter);
  let x = 0; const rowBands = []; const placed = [];
  for (const C of chs) {
    const its = all.filter((it) => it.book === B.id && it.chapter === C.chapter);
    if (!its.length) continue;
    const inCh = new Set(its.map((i) => i.id));
    const lvl = new Map();
    const L = (it) => { if (lvl.has(it.id)) return lvl.get(it.id); lvl.set(it.id, 0); const v = Math.max(0, ...it.deps.filter((d) => inCh.has(d)).map((d) => L(byId.get(d)) + 1)); lvl.set(it.id, v); return v; };
    its.forEach(L);
    const maxL = Math.max(...lvl.values());
    const squeeze = maxL > 11 ? 11 / maxL : 1; // at most 12 columns per chapter
    const cols = new Map();
    for (const it of its) { const c = Math.round(lvl.get(it.id) * squeeze); if (!cols.has(c)) cols.set(c, []); cols.get(c).push(it); }
    const colIdx = [...cols.keys()].sort((a, b) => a - b);
    const y = new Map();
    for (const c of colIdx) cols.get(c).forEach((it, i) => y.set(it.id, (i - (cols.get(c).length - 1) / 2) * ROW));
    const yOf = (id) => y.has(id) ? y.get(id) : (pos.has(id) && byId.get(id).book === B.id ? pos.get(id).y : null);
    for (let sweep = 0; sweep < 8; sweep++) {
      const seq = sweep % 2 ? colIdx.slice().reverse() : colIdx;
      for (const c of seq) {
        const col = cols.get(c);
        const bary = (it) => {
          const nb = it.deps.map(yOf).concat(sweep % 2 ? (children.get(it.id) || []).filter((k) => y.has(k)).map((k) => y.get(k)) : []).filter((v) => v != null);
          return nb.length ? nb.reduce((p, q) => p + q, 0) / nb.length : y.get(it.id);
        };
        const bv = new Map(col.map((it) => [it.id, bary(it)]));
        col.sort((a, b) => bv.get(a.id) - bv.get(b.id) || cmpNum(a.num, b.num));
        col.forEach((it, i) => y.set(it.id, (i - (col.length - 1) / 2) * ROW));
      }
    }
    for (const c of colIdx) for (const it of cols.get(c)) { pos.set(it.id, { x: x + colIdx.indexOf(c) * COL, y: y.get(it.id) }); placed.push(it.id); }
    const x1 = x + (colIdx.length - 1) * COL;
    rowBands.push({ book: B.id, chapter: C.chapter, x0: x - COL / 2, x1: x1 + COL / 2 });
    x = x1 + CH_GAP;
  }
  if (!placed.length) continue;
  const ys = placed.map((id) => pos.get(id).y); const lo = Math.min(...ys), hi = Math.max(...ys);
  const shift = cursor - lo;
  for (const id of placed) pos.get(id).y += shift;
  for (const b of rowBands) bands.push({ ...b, y0: cursor - 46, y1: hi + shift + 24 });
  cursor = hi + shift + BOOK_GAP;
}

// ---------- chapter-level edges ----------
const chEdges = new Map();
for (const it of all) for (const d of it.deps) {
  const D = byId.get(d); const a = `${D.book}/${D.chapter}`, b = `${it.book}/${it.chapter}`;
  if (a === b) continue; const k = `${a}>${b}`; chEdges.set(k, (chEdges.get(k) || 0) + 1);
}

// ---------- write ----------
const stripTeX = (s) => s;
const catalog = {
  generated: new Date().toISOString(),
  books: BOOKS.map((B) => ({
    ...B,
    chapters: [...chapters.values()].filter((c) => c.book === B.id).sort((a, b) => a.chapter - b.chapter).map((c) => {
      const its = all.filter((it) => it.book === B.id && it.chapter === c.chapter);
      return { n: c.chapter, title: c.title, summary: c.summary, files: c.files, count: its.length, viz: its.filter((it) => typeof it.viz === 'function').length, band: bands.find((b) => b.book === B.id && b.chapter === c.chapter) || null };
    }),
  })),
  items: all.map((it) => ({
    id: it.id, b: it.book, c: it.chapter, num: it.num, kind: it.kind, name: it.name, st: stripTeX(it.statement),
    deps: it.deps, see: it.see.length ? it.see : undefined, tags: it.tags?.length ? it.tags : undefined,
    file: it.file, viz: typeof it.viz === 'function', x: Math.round(pos.get(it.id)?.x ?? 0), y: Math.round(pos.get(it.id)?.y ?? 0),
    anc: ancestors(it.id).size, desc: descCount.get(it.id), depth: depth(it.id), verify: it.verify ? 1 : undefined,
  })),
  chapterEdges: [...chEdges].map(([k, n]) => { const [from, to] = k.split('>'); return { from, to, n }; }),
};
await mkdir(join(ROOT, 'data'), { recursive: true });
await writeFile(join(ROOT, 'data/catalog.json'), JSON.stringify(catalog));
console.log(`wrote data/catalog.json (${(JSON.stringify(catalog).length / 1024).toFixed(0)} KB)`);
