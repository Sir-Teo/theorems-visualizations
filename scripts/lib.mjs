// Shared helpers for build/check: discover content modules, load and validate them.
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BOOKS = [
  { id: 'pma', short: 'PMA', title: 'Principles of Mathematical Analysis', edition: '3rd edition, 1976', nick: '“Baby Rudin”' },
  { id: 'rca', short: 'RCA', title: 'Real and Complex Analysis', edition: '3rd edition, 1987', nick: '“Papa Rudin”' },
  { id: 'fa', short: 'FA', title: 'Functional Analysis', edition: '2nd edition, 1991', nick: '“Grandpa Rudin”' },
];
export const KINDS = ['Theorem', 'Lemma', 'Corollary', 'Proposition', 'Definition'];
export const ID_RE = /^(pma|rca|fa)-\d{1,2}\.\d{1,3}[a-z]?$/;
export const NUM_RE = /^\d{1,2}\.\d{1,3}[a-z]?$/;

/** Compare theorem numbers like "2.9" < "2.10" < "2.10a". */
export function cmpNum(a, b) {
  const pa = a.match(/^(\d+)\.(\d+)([a-z]?)$/), pb = b.match(/^(\d+)\.(\d+)([a-z]?)$/);
  if (!pa || !pb) return a < b ? -1 : 1;
  return (+pa[1] - +pb[1]) || (+pa[2] - +pb[2]) || (pa[3] < pb[3] ? -1 : pa[3] > pb[3] ? 1 : 0);
}

/** List content files: [{book, file (repo-relative), chapter}] */
export async function listContentFiles() {
  const out = [];
  for (const b of BOOKS) {
    const dir = join(ROOT, 'content', b.id);
    let files = [];
    try { files = await readdir(dir); } catch { continue; }
    for (const f of files.sort()) {
      const m = f.match(/^ch(\d{2})(?:-[\w-]+)?\.js$/);
      if (m) out.push({ book: b.id, chapter: +m[1], file: `content/${b.id}/${f}` });
    }
  }
  return out;
}

/** Import every content module. Returns {chapters: Map key→chapter, items: [], problems: []} */
export async function loadAll({ bust = false } = {}) {
  const files = await listContentFiles();
  const problems = [];
  const chapters = new Map();
  const items = [];
  for (const f of files) {
    let mod;
    try { mod = await import(pathToFileURL(join(ROOT, f.file)).href + (bust ? `?t=${Date.now()}` : '')); }
    catch (e) { problems.push({ level: 'error', where: f.file, msg: `cannot import: ${e.message}` }); continue; }
    const ch = mod.default;
    if (!ch || typeof ch !== 'object') { problems.push({ level: 'error', where: f.file, msg: 'no default export' }); continue; }
    if (ch.book !== f.book) problems.push({ level: 'error', where: f.file, msg: `book "${ch.book}" ≠ folder "${f.book}"` });
    if (ch.chapter !== f.chapter) problems.push({ level: 'error', where: f.file, msg: `chapter ${ch.chapter} ≠ filename ${f.chapter}` });
    const key = `${f.book}/${f.chapter}`;
    let C = chapters.get(key);
    if (!C) { C = { book: f.book, chapter: f.chapter, title: null, summary: null, files: [] }; chapters.set(key, C); }
    C.files.push(f.file);
    if (ch.title) C.title = ch.title;
    if (ch.summary) C.summary = ch.summary;
    for (const it of ch.items || []) items.push({ ...it, book: f.book, chapter: f.chapter, file: f.file, id: `${f.book}-${it.num}` });
  }
  for (const C of chapters.values()) if (!C.title) problems.push({ level: 'error', where: C.files[0], msg: 'chapter has no title' });
  return { chapters, items, problems };
}

/** Validate items; returns list of problems ({level:'error'|'warn', where, msg}). */
export function validate(items) {
  const P = [];
  const ids = new Map();
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
    for (const field of ['statement', 'idea', 'caption']) {
      const s = it[field]; if (typeof s !== 'string') continue;
      const stripped = s.replace(/\\\$/g, '').replace(/\$\$[\s\S]*?\$\$/g, '');
      if ((stripped.match(/\$/g) || []).length % 2) P.push({ level: 'error', where: w, msg: `unbalanced $ in ${field}` });
    }
  }
  for (const it of items) {
    const w = `${it.file} ${it.num}`;
    for (const field of ['deps', 'see']) {
      for (const d of it[field] || []) {
        if (!ID_RE.test(d)) { P.push({ level: 'error', where: w, msg: `${field}: malformed id "${d}"` }); continue; }
        if (d === it.id) P.push({ level: 'error', where: w, msg: `${field}: self reference` });
        else if (!ids.has(d)) P.push({ level: 'warn', where: w, msg: `${field}: unknown id ${d}` });
      }
    }
  }
  // cycle detection on deps
  const state = new Map();
  const visit = (id, stack) => {
    const s = state.get(id); if (s === 2) return; if (s === 1) { P.push({ level: 'error', where: id, msg: `dependency cycle: ${[...stack, id].join(' → ')}` }); return; }
    state.set(id, 1); for (const d of ids.get(id)?.deps || []) if (ids.has(d)) visit(d, [...stack, id]); state.set(id, 2);
  };
  for (const id of ids.keys()) visit(id, []);
  return P;
}

export function printProblems(P, { quiet = false } = {}) {
  const errs = P.filter((p) => p.level === 'error'), warns = P.filter((p) => p.level === 'warn');
  for (const p of errs) console.log(`  ✗ ${p.where}: ${p.msg}`);
  if (!quiet) for (const p of warns) console.log(`  ! ${p.where}: ${p.msg}`);
  return { errors: errs.length, warnings: warns.length };
}
