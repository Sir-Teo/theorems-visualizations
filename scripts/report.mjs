// Coverage and consistency report: per-chapter counts, unresolved ids (with nearest
// existing candidates), items without a visualization, and verify flags.
//   node scripts/report.mjs [--json]
import { loadAll, cmpNum, BOOKS, ID_RE } from './lib.mjs';

const { chapters, items } = await loadAll();
const ids = new Map(items.map((it) => [it.id, it]));
const rows = [];
for (const B of BOOKS) {
  const chs = [...chapters.values()].filter((c) => c.book === B.id).sort((a, b) => a.chapter - b.chapter);
  for (const C of chs) {
    const its = items.filter((it) => it.book === B.id && it.chapter === C.chapter);
    const by = (k) => its.filter((it) => it.kind === k).length;
    rows.push({ key: `${B.id}/${C.chapter}`, title: C.title, n: its.length, thm: by('Theorem') + by('Lemma') + by('Corollary') + by('Proposition'), def: by('Definition'), viz: its.filter((it) => typeof it.viz === 'function').length, verify: its.filter((it) => it.verify).length });
  }
}
const unresolved = [];
for (const it of items) for (const f of ['deps', 'see']) for (const d of it[f] || []) {
  if (!ID_RE.test(d) || ids.has(d)) continue;
  const [book, num] = d.split('-'); const ch = +num.split('.')[0];
  const near = items.filter((x) => x.book === book && x.chapter === ch).sort((a, b) => Math.abs(parseFloat(a.num) - parseFloat(num)) - Math.abs(parseFloat(b.num) - parseFloat(num))).slice(0, 3).map((x) => `${x.id} “${x.name}”`);
  unresolved.push({ from: it.id, field: f, id: d, near });
}
const noViz = items.filter((it) => it.kind !== 'Definition' && typeof it.viz !== 'function').map((it) => it.id);

if (process.argv.includes('--json')) { console.log(JSON.stringify({ rows, unresolved, noViz }, null, 1)); process.exit(0); }
console.log('chapter      items  thm  def  viz  verify  title');
for (const r of rows) console.log(`${r.key.padEnd(10)} ${String(r.n).padStart(6)} ${String(r.thm).padStart(4)} ${String(r.def).padStart(4)} ${String(r.viz).padStart(4)} ${String(r.verify).padStart(6)}  ${r.title}`);
const tot = rows.reduce((s, r) => ({ n: s.n + r.n, thm: s.thm + r.thm, def: s.def + r.def, viz: s.viz + r.viz, verify: s.verify + r.verify }), { n: 0, thm: 0, def: 0, viz: 0, verify: 0 });
console.log(`TOTAL      ${String(tot.n).padStart(6)} ${String(tot.thm).padStart(4)} ${String(tot.def).padStart(4)} ${String(tot.viz).padStart(4)} ${String(tot.verify).padStart(6)}`);
console.log(`\n${unresolved.length} unresolved reference(s):`);
for (const u of unresolved) console.log(`  ${u.from} ${u.field} → ${u.id}   nearest: ${u.near.join('; ') || '(chapter missing)'}`);
if (noViz.length) console.log(`\nresults without a visualization: ${noViz.join(', ')}`);
