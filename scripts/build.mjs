// Build the atlas data from content/**:
//   data/index.json      registry, chapters, light item records, graph statistics, map layout
//   data/col/<id>.json   per-collection detail (statements, refs, scope, …), lazy-loaded by the app
//   data/atlas.css       collection and field colours (light + dark) as CSS custom properties
//   node scripts/build.mjs [--strict] [--verbose]
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { loadAll, validate, printProblems, cmpNum, ROOT } from './lib.mjs';

const strict = process.argv.includes('--strict');
const { fields, collections, chapters, items, planned, problems } = await loadAll();
const P = [...problems, ...validate(items, planned, collections)];
const st = printProblems(P, { quiet: !process.argv.includes('--verbose') });
console.log(`${items.length} items (+${planned.length} planned) in ${[...chapters.values()].filter((c) => !c.planned).length} chapters, ${collections.length} collections — ${st.errors} error(s), ${st.warnings} warning(s)`);
if (st.errors && strict) process.exit(1);

// ---------- de-duplicate & sort ----------
const colOrder = new Map(collections.map((C, i) => [C.id, i]));
const byId = new Map();
for (const it of items) if (!byId.has(it.id)) byId.set(it.id, it);
const all = [...byId.values()].sort((a, b) => colOrder.get(a.col) - colOrder.get(b.col) || cmpNum(a.num, b.num));
const plannedById = new Map();
for (const it of planned) if (!byId.has(it.id) && !plannedById.has(it.id)) plannedById.set(it.id, it);
const ghosts = [...plannedById.values()].sort((a, b) => colOrder.get(a.col) - colOrder.get(b.col) || cmpNum(a.num, b.num));
for (const it of all) {
  const deps = (it.deps || []).filter((d) => d !== it.id);
  it.pdeps = deps.filter((d) => plannedById.has(d));
  it.deps = deps.filter((d) => byId.has(d));
  it.see = (it.see || []).filter((d) => byId.has(d) && d !== it.id);
}
for (const it of ghosts) it.deps = (it.deps || []).filter((d) => d !== it.id && (byId.has(d) || plannedById.has(d)));

// ---------- graph statistics (written items only) ----------
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

// ---------- map layout ----------
// Each collection is cut into one or more rows (collection.mapRows, else one row, auto-split when
// very wide). Inside a row, chapters run left→right; inside a chapter, columns follow the
// intra-chapter dependency level and rows are ordered by barycentre sweeps. Rows are then packed
// into field regions (masonry columns) so the whole atlas has a sane aspect ratio.
const COL = 32, CH_GAP = 64, ROW = 21, ROW_GAP = 120, FIELD_GAP = 260, COLUMN_GAP = 200, MAX_ROW_W = 4200;
const node = new Map([...all.map((it) => [it.id, it]), ...ghosts.map((it) => [it.id, it])]);
const succAll = new Map([...node.keys()].map((id) => [id, []]));
for (const it of node.values()) for (const d of [...(it.deps || []), ...(it.pdeps || [])]) succAll.get(d)?.push(it.id);
function layoutChapter(its) {
  const inCh = new Set(its.map((i) => i.id));
  const depsOf = (it) => [...(it.deps || []), ...(it.pdeps || [])].filter((d) => inCh.has(d));
  const lvl = new Map();
  const L = (it) => { if (lvl.has(it.id)) return lvl.get(it.id); lvl.set(it.id, 0); const v = Math.max(0, ...depsOf(it).map((d) => L(node.get(d)) + 1)); lvl.set(it.id, v); return v; };
  its.forEach(L);
  const maxL = Math.max(...lvl.values());
  const squeeze = maxL > 11 ? 11 / maxL : 1; // at most 12 columns per chapter
  const cols = new Map();
  for (const it of its) { const c = Math.round(lvl.get(it.id) * squeeze); if (!cols.has(c)) cols.set(c, []); cols.get(c).push(it); }
  const colIdx = [...cols.keys()].sort((a, b) => a - b);
  const y = new Map();
  for (const c of colIdx) cols.get(c).forEach((it, i) => y.set(it.id, (i - (cols.get(c).length - 1) / 2) * ROW));
  for (let sweep = 0; sweep < 8; sweep++) {
    const seq = sweep % 2 ? colIdx.slice().reverse() : colIdx;
    for (const c of seq) {
      const col = cols.get(c);
      const bary = (it) => {
        const nb = (sweep % 2 ? succAll.get(it.id) : depsOf(it)).filter((k) => y.has(k)).map((k) => y.get(k));
        return nb.length ? nb.reduce((p, q) => p + q, 0) / nb.length : y.get(it.id);
      };
      const bv = new Map(col.map((it) => [it.id, bary(it)]));
      col.sort((a, b) => bv.get(a.id) - bv.get(b.id) || cmpNum(a.num, b.num));
      col.forEach((it, i) => y.set(it.id, (i - (col.length - 1) / 2) * ROW));
    }
  }
  const local = new Map();
  for (const c of colIdx) for (const it of cols.get(c)) local.set(it.id, { x: colIdx.indexOf(c) * COL, y: y.get(it.id) });
  return { local, w: (colIdx.length - 1) * COL };
}
// row blocks
const blocks = [];
for (const Col of collections) {
  const chs = [...chapters.values()].filter((c) => c.col === Col.id).sort((a, b) => a.chapter - b.chapter);
  const laid = [];
  for (const C of chs) {
    const its = [...node.values()].filter((it) => it.col === Col.id && it.chapter === C.chapter);
    if (!its.length) continue;
    laid.push({ C, ...layoutChapter(its) });
  }
  if (!laid.length) continue;
  let groups;
  if (Col.mapRows) groups = Col.mapRows.map(([a, b, label]) => ({ label, chs: laid.filter((l) => l.C.chapter >= a && l.C.chapter <= b) })).filter((g) => g.chs.length);
  else {
    const total = laid.reduce((s, l) => s + l.w + CH_GAP, 0);
    const k = Math.max(1, Math.ceil(total / MAX_ROW_W)); const per = total / k;
    groups = []; let cur = []; let acc = 0;
    for (const l of laid) { if (cur.length && acc + l.w / 2 > per * (groups.length + 1) && groups.length < k - 1) { groups.push({ chs: cur }); cur = []; } cur.push(l); acc += l.w + CH_GAP; }
    groups.push({ chs: cur });
    if (groups.length > 1) groups.forEach((g) => { g.label = `chapters ${g.chs[0].C.chapter}–${g.chs[g.chs.length - 1].C.chapter}`; });
  }
  for (const g of groups) {
    let x = 0; const pts = new Map(); const bands = [];
    for (const l of g.chs) {
      for (const [id, p] of l.local) pts.set(id, { x: x + p.x, y: p.y });
      bands.push({ col: Col.id, chapter: l.C.chapter, x0: x - COL / 2, x1: x + l.w + COL / 2 });
      x += l.w + CH_GAP;
    }
    const ys = [...pts.values()].map((p) => p.y);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    blocks.push({ col: Col.id, field: Col.field, label: g.label ? `${Col.title} · ${g.label}` : Col.title, pts, bands, w: x - CH_GAP + COL, h: hi - lo + 70, lo });
  }
}
// pack blocks: each field becomes a region of masonry columns (roughly square), then the field
// regions are shelf-packed into rows so the whole atlas has a landscape aspect ratio
const pos = new Map(); const rowsOut = []; const fieldBoxes = [];
const regions = [];
for (const F of fields) {
  const fb = blocks.filter((b) => b.field === F.id);
  if (!fb.length) continue;
  const fArea = fb.reduce((s, b) => s + (b.w + COLUMN_GAP) * (b.h + ROW_GAP), 0);
  const Hf = Math.max(Math.max(...fb.map((b) => b.h)), Math.sqrt(fArea * 0.8));
  let cx = 0, cy = 0, colW = 0, maxY = 0; const placed = [];
  for (const b of fb) {
    if (cy > 0 && cy + b.h > Hf) { cx += colW + COLUMN_GAP; cy = 0; colW = 0; }
    placed.push({ b, x: cx, y: cy });
    colW = Math.max(colW, b.w); cy += b.h + ROW_GAP; maxY = Math.max(maxY, cy);
  }
  regions.push({ F, placed, w: cx + colW, h: maxY - ROW_GAP });
}
const totalArea = regions.reduce((s, r) => s + (r.w + FIELD_GAP) * (r.h + FIELD_GAP), 0);
const targetW = Math.max(Math.max(0, ...regions.map((r) => r.w)), Math.sqrt(totalArea * 1.7));
let sx = 0, sy = 0, shelfH = 0;
for (const R of regions) {
  if (sx > 0 && sx + R.w > targetW) { sx = 0; sy += shelfH + FIELD_GAP + 160; shelfH = 0; }
  for (const { b, x, y } of R.placed) {
    const ox = sx + x, oy = sy + y;
    const dy = oy + 46 - b.lo; // 46 px header for chapter labels
    for (const [id, p] of b.pts) pos.set(id, { x: ox + p.x, y: p.y + dy });
    for (const band of b.bands) { band.x0 += ox; band.x1 += ox; band.y0 = oy; band.y1 = oy + b.h; }
    rowsOut.push({ col: b.col, field: b.field, label: b.label, x: ox - COL / 2, y: oy, x1: ox + b.w, y1: oy + b.h, bands: b.bands });
  }
  fieldBoxes.push({ field: R.F.id, title: R.F.title, x0: sx - COL, y0: sy - 70, x1: sx + R.w, y1: sy + R.h + 20 });
  sx += R.w + FIELD_GAP; shelfH = Math.max(shelfH, R.h);
}
const bandOf = new Map(rowsOut.flatMap((r) => r.bands.map((b) => [`${b.col}/${b.chapter}`, b])));

// ---------- chapter- and collection-level edges ----------
const chEdges = new Map(), colEdges = new Map();
for (const it of all) for (const d of it.deps) {
  const D = byId.get(d); const a = `${D.col}/${D.chapter}`, b = `${it.col}/${it.chapter}`;
  if (a !== b) chEdges.set(`${a}>${b}`, (chEdges.get(`${a}>${b}`) || 0) + 1);
  if (D.col !== it.col) colEdges.set(`${D.col}>${it.col}`, (colEdges.get(`${D.col}>${it.col}`) || 0) + 1);
}
const edgeList = (m) => [...m].map(([k, n]) => { const [from, to] = k.split('>'); return { from, to, n }; });

// ---------- colours ----------
// sRGB ↔ OKLCH, for deriving collection shades from the field hue
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4), gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function hex2oklch(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}
function oklch2hex(L, C, h) {
  for (let c = C; c >= 0; c -= 0.005) {
    const A = c * Math.cos((h * Math.PI) / 180), B = c * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) return '#' + rgb.map((v) => Math.round(gam(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0')).join('');
  }
  return '#888888';
}
const colorOf = new Map();
for (const F of fields) {
  const [, , h0] = hex2oklch(F.color[0]);
  const auto = collections.filter((C) => C.field === F.id && !C.color);
  auto.forEach((C, i) => {
    const t = auto.length > 1 ? i / (auto.length - 1) - 0.5 : 0;
    const h = h0 + t * 64 + (i % 2 ? 9 : -9) * (auto.length > 4 ? 1 : 0);
    const Lt = 0.5 + (i % 3) * 0.035, Ld = 0.76 + (i % 3) * 0.03;
    colorOf.set(C.id, [oklch2hex(Lt, 0.15, h), oklch2hex(Ld, 0.13, h)]);
  });
  for (const C of collections) if (C.field === F.id && C.color) colorOf.set(C.id, C.color);
}
const cssVars = (i) => [...collections.map((C) => `--c-${C.id}:${colorOf.get(C.id)[i]}`), ...fields.map((F) => `--f-${F.id}:${F.color[i]};--c-field-${F.id}:${F.color[i]}`)].join(';');
const css = `/* generated by scripts/build.mjs — collection and field colours */
:root{${cssVars(0)}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${cssVars(1)}}}
:root[data-theme="dark"]{${cssVars(1)}}
${collections.map((C) => `[data-col="${C.id}"]{--bc:var(--c-${C.id});--fc:var(--f-${C.field})}`).join('\n')}
${fields.map((F) => `[data-field="${F.id}"]{--fc:var(--f-${F.id})}`).join('\n')}
`;

// ---------- write ----------
const chapterRecord = (c) => {
  const its = all.filter((it) => it.col === c.col && it.chapter === c.chapter);
  const pl = ghosts.filter((it) => it.col === c.col && it.chapter === c.chapter).length;
  return { n: c.chapter, title: c.title, summary: c.summary || undefined, files: c.files.length ? c.files : undefined, count: its.length, viz: its.filter((it) => typeof it.viz === 'function').length, planned: pl || undefined, band: bandOf.get(`${c.col}/${c.chapter}`) || null };
};
const index = {
  generated: new Date().toISOString(),
  fields: fields.map((F) => ({ id: F.id, title: F.title, short: F.short, blurb: F.blurb, areas: F.areas, color: F.color })),
  collections: collections.map((C) => {
    const its = all.filter((it) => it.col === C.id);
    return {
      id: C.id, short: C.short, title: C.title, field: C.field, area: C.area, nick: C.nick, source: C.source, blurb: C.blurb,
      chapterLabels: C.chapterLabels, color: colorOf.get(C.id),
      count: its.length, viz: its.filter((it) => typeof it.viz === 'function').length, planned: ghosts.filter((it) => it.col === C.id).length,
      verify: its.filter((it) => it.verify).length,
      chapters: [...chapters.values()].filter((c) => c.col === C.id).sort((a, b) => a.chapter - b.chapter).map(chapterRecord),
    };
  }),
  items: all.map((it) => ({
    id: it.id, col: it.col, c: it.chapter, num: it.num, kind: it.kind, name: it.name,
    deps: it.deps, pdeps: it.pdeps.length ? it.pdeps : undefined, see: it.see.length ? it.see : undefined, tags: it.tags?.length ? it.tags : undefined,
    file: it.file, viz: typeof it.viz === 'function', x: Math.round(pos.get(it.id)?.x ?? 0), y: Math.round(pos.get(it.id)?.y ?? 0),
    anc: ancestors(it.id).size, desc: descCount.get(it.id), depth: depth(it.id), verify: it.verify ? 1 : undefined,
  })),
  planned: ghosts.map((it) => ({ id: it.id, col: it.col, c: it.chapter, num: it.num, kind: it.kind, name: it.name, deps: it.deps, x: Math.round(pos.get(it.id)?.x ?? 0), y: Math.round(pos.get(it.id)?.y ?? 0) })),
  map: { rows: rowsOut.map(({ bands, ...r }) => r), fields: fieldBoxes },
  chapterEdges: edgeList(chEdges),
  collectionEdges: edgeList(colEdges),
};
await rm(join(ROOT, 'data'), { recursive: true, force: true });
await mkdir(join(ROOT, 'data/col'), { recursive: true });
await writeFile(join(ROOT, 'data/index.json'), JSON.stringify(index));
for (const C of collections) {
  const its = all.filter((it) => it.col === C.id), pl = ghosts.filter((it) => it.col === C.id);
  if (!its.length && !pl.length) continue;
  const det = {};
  for (const it of its) det[it.id] = { st: it.statement, refs: it.refs?.length ? it.refs : undefined, scope: it.scope || undefined, credit: it.credit || undefined, links: it.links || undefined };
  for (const it of pl) det[it.id] = { pic: it.pic || undefined, refs: it.refs?.length ? it.refs : undefined, tags: it.tags?.length ? it.tags : undefined };
  await writeFile(join(ROOT, `data/col/${C.id}.json`), JSON.stringify(det));
}
await writeFile(join(ROOT, 'data/atlas.css'), css);
console.log(`wrote data/index.json (${(JSON.stringify(index).length / 1024).toFixed(0)} KB), data/col/*.json, data/atlas.css`);
