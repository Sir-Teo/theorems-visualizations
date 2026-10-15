// Shared helpers for build/check: the atlas registry, content discovery, loading and validation.
//
//   content/fields.js            fields → areas (display order, colours)
//   content/<col>/collection.js  collection metadata
//   content/<col>/syllabus.js    planned inventory (optional)
//   content/<col>/chNN*.js       chapters (part files allowed)
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Theorem-like kinds for mathematics; the rest cover the breadth of the atlas (science, society, arts, history).
export const KINDS = ['Theorem', 'Lemma', 'Corollary', 'Proposition', 'Definition', 'Law', 'Principle', 'Postulate', 'Algorithm', 'Model',
  'Concept', 'Phenomenon', 'Method', 'Paradox', 'Hypothesis', 'Invention', 'Event', 'Paper'];
/** Item numbers: chapter.n or chapter.section.n, optional letter for an unnumbered corollary. */
export const NUM_RE = /^\d{1,2}(\.\d{1,3}){1,2}[a-z]?$/;
/** Any well-formed id (collection may be unknown). */
export const ID_RE = /^[a-z][a-z0-9]{1,7}-\d{1,2}(\.\d{1,3}){1,2}[a-z]?$/;
export const COL_RE = /^[a-z][a-z0-9]{1,7}$/;

/** Compare theorem numbers like "2.9" < "2.10" < "2.10a" < "2.10.1". */
export function cmpNum(a, b) {
  const pa = String(a).match(/^([\d.]+?)([a-z]?)$/), pb = String(b).match(/^([\d.]+?)([a-z]?)$/);
  if (!pa || !pb) return a < b ? -1 : a > b ? 1 : 0;
  const xa = pa[1].split('.').map(Number), xb = pb[1].split('.').map(Number);
  for (let i = 0; i < Math.max(xa.length, xb.length); i++) {
    const u = xa[i] ?? -1, v = xb[i] ?? -1;
    if (u !== v) return u - v;
  }
  return pa[2] < pb[2] ? -1 : pa[2] > pb[2] ? 1 : 0;
}

const imp = (file, bust) => import(pathToFileURL(file).href + (bust ? `?t=${Date.now()}` : ''));

/** Load content/fields.js and every content/<id>/collection.js. */
export async function loadRegistry({ bust = false } = {}) {
  const problems = [];
  const fields = (await imp(join(ROOT, 'content/fields.js'), bust)).default;
  const fieldIds = new Set(fields.map((f) => f.id));
  const collections = [];
  const dirs = (await readdir(join(ROOT, 'content'), { withFileTypes: true })).filter((d) => d.isDirectory() && d.name !== 'bridges').map((d) => d.name).sort();
  for (const d of dirs) {
    const f = join(ROOT, 'content', d, 'collection.js');
    if (!existsSync(f)) { problems.push({ level: 'warn', where: `content/${d}`, msg: 'folder has no collection.js (ignored)' }); continue; }
    let C;
    try { C = (await imp(f, bust)).default; } catch (e) { problems.push({ level: 'error', where: `content/${d}/collection.js`, msg: `cannot import: ${e.message}` }); continue; }
    const w = `content/${d}/collection.js`;
    if (C.id !== d) problems.push({ level: 'error', where: w, msg: `id "${C.id}" ≠ folder "${d}"` });
    if (!COL_RE.test(C.id || '')) problems.push({ level: 'error', where: w, msg: `bad collection id "${C.id}"` });
    if (!fieldIds.has(C.field)) problems.push({ level: 'error', where: w, msg: `unknown field "${C.field}"` });
    else if (!fields.find((F) => F.id === C.field).areas.some((A) => A.id === C.area)) problems.push({ level: 'error', where: w, msg: `unknown area "${C.area}" in field ${C.field}` });
    for (const k of ['short', 'title', 'blurb']) if (!C[k]) problems.push({ level: 'error', where: w, msg: `missing ${k}` });
    if (!['book', 'course'].includes(C.source?.type)) problems.push({ level: 'error', where: w, msg: 'source.type must be "book" or "course"' });
    collections.push({ ...C, id: d });
  }
  const fOrder = new Map(fields.map((F, i) => [F.id, i]));
  const aOrder = (C) => fields.find((F) => F.id === C.field)?.areas.findIndex((A) => A.id === C.area) ?? 99;
  collections.sort((a, b) => (fOrder.get(a.field) ?? 99) - (fOrder.get(b.field) ?? 99) || aOrder(a) - aOrder(b) || (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id));
  return { fields, collections, problems };
}

/** Load content/bridges/*.js: curated walks through items across collections. */
export async function loadBridges({ bust = false } = {}) {
  const dir = join(ROOT, 'content/bridges'); const out = [], problems = [];
  let files = []; try { files = (await readdir(dir)).filter((f) => f.endsWith('.js')).sort(); } catch { return { bridges: out, problems }; }
  for (const f of files) {
    try {
      const B = (await imp(join(dir, f), bust)).default;
      if (!B?.slug || !B.title || !Array.isArray(B.steps)) problems.push({ level: 'error', where: `content/bridges/${f}`, msg: 'needs slug, title and steps' });
      else out.push({ ...B, file: `content/bridges/${f}` });
    } catch (e) { problems.push({ level: 'error', where: `content/bridges/${f}`, msg: `cannot import: ${e.message}` }); }
  }
  return { bridges: out, problems };
}

/** List chapter files: [{col, file (repo-relative), chapter}] */
export async function listContentFiles(collections) {
  const out = [];
  for (const C of collections) {
    let files = [];
    try { files = await readdir(join(ROOT, 'content', C.id)); } catch { continue; }
    for (const f of files.sort()) {
      const m = f.match(/^ch(\d{2})(?:-[\w-]+)?\.js$/);
      if (m) out.push({ col: C.id, chapter: +m[1], file: `content/${C.id}/${f}` });
    }
  }
  return out;
}

/**
 * Import the registry and every content module.
 * Returns {fields, collections, chapters: Map "col/n" → chapter, items: [], planned: [], aliases: Map id → {to, col, chapter, …}, problems: []}.
 * A syllabus entry `{ num, alias: 'owner-id', name }` cross-lists another collection's item: it is not a node of its own,
 * references to it resolve to the owner, and the chapter page shows the owner's card.
 */
export async function loadAll({ bust = false } = {}) {
  const { fields, collections, problems } = await loadRegistry({ bust });
  const files = await listContentFiles(collections);
  const chapters = new Map();
  const items = [];
  const chap = (col, n, file) => {
    const key = `${col}/${n}`;
    let C = chapters.get(key);
    if (!C) { C = { col, chapter: n, title: null, summary: null, files: [], planned: true }; chapters.set(key, C); }
    if (file) { C.files.push(file); C.planned = false; }
    return C;
  };
  for (const f of files) {
    let mod;
    try { mod = await imp(join(ROOT, f.file), bust); }
    catch (e) { problems.push({ level: 'error', where: f.file, msg: `cannot import: ${e.message}` }); continue; }
    const ch = mod.default;
    if (!ch || typeof ch !== 'object') { problems.push({ level: 'error', where: f.file, msg: 'no default export' }); continue; }
    const col = ch.collection ?? ch.book;
    if (col !== f.col) problems.push({ level: 'error', where: f.file, msg: `collection "${col}" ≠ folder "${f.col}"` });
    if (ch.chapter !== f.chapter) problems.push({ level: 'error', where: f.file, msg: `chapter ${ch.chapter} ≠ filename ${f.chapter}` });
    const C = chap(f.col, f.chapter, f.file);
    if (ch.title) C.title = ch.title;
    if (ch.summary) C.summary = ch.summary;
    for (const it of ch.items || []) items.push({ ...it, col: f.col, chapter: f.chapter, file: f.file, id: `${f.col}-${it.num}` });
  }
  // syllabi: planned items that are not written yet
  const planned = [];
  const aliases = new Map();
  const written = new Set(items.map((it) => it.id));
  for (const Col of collections) {
    const sf = join(ROOT, 'content', Col.id, 'syllabus.js');
    if (!existsSync(sf)) continue;
    let S;
    try { S = (await imp(sf, bust)).default; } catch (e) { problems.push({ level: 'error', where: `content/${Col.id}/syllabus.js`, msg: `cannot import: ${e.message}` }); continue; }
    for (const ch of S.chapters || []) {
      const C = chap(Col.id, ch.n);
      if (!C.title && ch.title) C.title = ch.title;
      if (!C.summary && ch.summary) C.summary = ch.summary;
      C.syllabus = (C.syllabus || 0) + (ch.items || []).length;
      for (const it of ch.items || []) {
        const id = `${Col.id}-${it.num}`;
        // a cross-listing: this number stands for an idea owned by another collection
        if (it.alias) { aliases.set(id, { to: it.alias, col: Col.id, chapter: ch.n, num: it.num, name: it.name, file: `content/${Col.id}/syllabus.js` }); C.syllabus--; continue; }
        if (written.has(id)) continue;
        planned.push({ ...it, col: Col.id, chapter: ch.n, id, planned: true, file: `content/${Col.id}/syllabus.js`, deps: it.deps || [] });
      }
    }
  }
  for (const C of chapters.values()) if (!C.title) problems.push({ level: 'error', where: C.files[0] || `${C.col}/${C.chapter}`, msg: 'chapter has no title' });
  // resolve cross-listings: references to an alias point at its owner
  const known = new Set([...items, ...planned].map((it) => it.id));
  const resolve = (id) => { let k = 0; while (aliases.has(id) && k++ < 8) id = aliases.get(id).to; return id; };
  for (const [id, A] of aliases) {
    A.to = resolve(id);
    if (written.has(id)) problems.push({ level: 'error', where: `${A.file} ${A.num}`, msg: `${id} is written but cross-listed as ${A.to}` });
    else if (!known.has(A.to)) problems.push({ level: 'error', where: `${A.file} ${A.num}`, msg: `alias target ${A.to} does not exist` });
    else if (A.to.split('-')[0] === A.col) problems.push({ level: 'error', where: `${A.file} ${A.num}`, msg: `alias ${id} → ${A.to} stays inside its collection` });
  }
  if (aliases.size) for (const it of [...items, ...planned]) for (const k of ['deps', 'see', 'introduces']) {
    if (it[k]?.some((d) => aliases.has(d))) it[k] = [...new Set(it[k].map(resolve))].filter((d) => d !== it.id);
  }
  return { fields, collections, chapters, items, planned, aliases, problems };
}

/** Validate items (and planned items, more leniently); returns problems ({level:'error'|'warn', where, msg}). */
export function validate(items, planned = [], collections = []) {
  const P = [];
  const ids = new Map();
  const colIds = new Set(collections.map((C) => C.id));
  for (const it of items) {
    const w = `${it.file} ${it.num ?? '?'}`;
    if (!NUM_RE.test(it.num || '')) { P.push({ level: 'error', where: w, msg: `bad num "${it.num}"` }); continue; }
    if (+it.num.split('.')[0] !== it.chapter) P.push({ level: 'error', where: w, msg: `num ${it.num} not in chapter ${it.chapter}` });
    if (ids.has(it.id)) P.push({ level: 'error', where: w, msg: `duplicate id ${it.id} (also in ${ids.get(it.id).file})` });
    ids.set(it.id, it);
    if (!KINDS.includes(it.kind)) P.push({ level: 'error', where: w, msg: `kind "${it.kind}" not in ${KINDS.join('/')}` });
    if (!it.name || typeof it.name !== 'string') P.push({ level: 'error', where: w, msg: 'missing name' });
    if (!it.statement || typeof it.statement !== 'string') P.push({ level: 'error', where: w, msg: 'missing statement' });
    if (!it.idea) P.push({ level: 'warn', where: w, msg: 'missing idea' });
    if (!it.caption && it.viz) P.push({ level: 'warn', where: w, msg: 'missing caption' });
    if (typeof it.viz !== 'function' && it.kind !== 'Definition') P.push({ level: 'error', where: w, msg: 'missing viz(v) function' });
    if (it.viz != null && typeof it.viz !== 'function') P.push({ level: 'error', where: w, msg: 'viz must be a function' });
    if (!Array.isArray(it.deps)) P.push({ level: 'error', where: w, msg: 'deps must be an array' });
    for (const k of ['refs', 'tags', 'see']) if (it[k] != null && !Array.isArray(it[k])) P.push({ level: 'error', where: w, msg: `${k} must be an array` });
    if (it.links != null && typeof it.links !== 'object') P.push({ level: 'error', where: w, msg: 'links must be an object' });
    for (const field of ['statement', 'idea', 'caption', 'scope']) {
      const s = it[field]; if (typeof s !== 'string') continue;
      const stripped = s.replace(/\\\$/g, '').replace(/\$\$[\s\S]*?\$\$/g, '');
      if ((stripped.match(/\$/g) || []).length % 2) P.push({ level: 'error', where: w, msg: `unbalanced $ in ${field}` });
    }
  }
  // landmark papers: citation metadata is required, `introduces` lists the ideas the paper first put forward
  const paperCheck = (it, w) => {
    if (it.kind !== 'Paper') { if (it.paper || it.introduces) P.push({ level: 'warn', where: w, msg: 'paper/introduces only make sense on kind Paper' }); return; }
    const p = it.paper;
    if (!p || typeof p !== 'object') { P.push({ level: 'error', where: w, msg: 'Paper needs paper: {authors, year, title, venue?, doi?|url?}' }); return; }
    if (!p.authors || typeof p.authors !== 'string') P.push({ level: 'error', where: w, msg: 'paper.authors must be a string' });
    if (!Number.isInteger(p.year) || p.year < -3000 || p.year > 2100) P.push({ level: 'error', where: w, msg: 'paper.year must be an integer year' });
    if (!p.title || typeof p.title !== 'string') P.push({ level: 'error', where: w, msg: 'paper.title must be a string' });
    if (p.doi && !/^10\.\d{4,9}\/\S+$/.test(p.doi)) P.push({ level: 'warn', where: w, msg: `paper.doi "${p.doi}" does not look like a DOI (10.xxxx/…)` });
    if (it.introduces != null && !Array.isArray(it.introduces)) P.push({ level: 'error', where: w, msg: 'introduces must be an array' });
  };
  for (const it of items) paperCheck(it, `${it.file} ${it.num}`);
  const all = new Map(ids);
  for (const it of planned) {
    const w = `${it.file} ${it.num ?? '?'}`;
    if (!NUM_RE.test(it.num || '')) { P.push({ level: 'error', where: w, msg: `bad num "${it.num}"` }); continue; }
    if (+it.num.split('.')[0] !== it.chapter) P.push({ level: 'error', where: w, msg: `num ${it.num} not in chapter ${it.chapter}` });
    if (all.has(it.id) && all.get(it.id).planned) P.push({ level: 'error', where: w, msg: `duplicate planned id ${it.id}` });
    if (!KINDS.includes(it.kind)) P.push({ level: 'error', where: w, msg: `kind "${it.kind}" not in ${KINDS.join('/')}` });
    if (!it.name) P.push({ level: 'error', where: w, msg: 'missing name' });
    if (!Array.isArray(it.deps)) P.push({ level: 'error', where: w, msg: 'deps must be an array' });
    paperCheck(it, w);
    all.set(it.id, it);
  }
  for (const it of [...items, ...planned]) {
    const w = `${it.file} ${it.num}`;
    for (const field of ['deps', 'see', 'introduces']) {
      for (const d of it[field] || []) {
        if (!ID_RE.test(d)) { P.push({ level: 'error', where: w, msg: `${field}: malformed id "${d}"` }); continue; }
        if (d === it.id) P.push({ level: 'error', where: w, msg: `${field}: self reference` });
        else if (colIds.size && !colIds.has(d.split('-')[0])) P.push({ level: 'warn', where: w, msg: `${field}: unknown collection in ${d}` });
        else if (!all.has(d)) P.push({ level: 'warn', where: w, msg: `${field}: unknown id ${d}` });
        else if (field === 'deps' && !it.planned && all.get(d).planned) P.push({ level: 'info', where: w, msg: `deps: ${d} is planned, not written yet` });
      }
    }
  }
  // cycle detection on deps (written + planned)
  const state = new Map();
  const visit = (id, stack) => {
    const s = state.get(id); if (s === 2) return; if (s === 1) { P.push({ level: 'error', where: id, msg: `dependency cycle: ${[...stack, id].join(' → ')}` }); return; }
    state.set(id, 1); for (const d of all.get(id)?.deps || []) if (all.has(d)) visit(d, [...stack, id]); state.set(id, 2);
  };
  for (const id of all.keys()) visit(id, []);
  return P;
}

export function printProblems(P, { quiet = false } = {}) {
  const errs = P.filter((p) => p.level === 'error'), warns = P.filter((p) => p.level === 'warn');
  for (const p of errs) console.log(`  ✗ ${p.where}: ${p.msg}`);
  if (!quiet) for (const p of warns) console.log(`  ! ${p.where}: ${p.msg}`);
  return { errors: errs.length, warnings: warns.length };
}
