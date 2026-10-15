// Coverage and consistency report: per-chapter counts (written / planned), unresolved ids
// (with nearest existing candidates), items without a visualization, and verify flags.
//   node scripts/report.mjs [collection|field ...] [--json]
import { loadAll, ID_RE } from './lib.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const { collections, chapters, items, planned } = await loadAll();
const want = (C) => !args.length || args.includes(C.id) || args.includes(C.field);
const ids = new Map([...items, ...planned].map((it) => [it.id, it]));
const rows = [];
for (const C of collections.filter(want)) {
  const chs = [...chapters.values()].filter((c) => c.col === C.id).sort((a, b) => a.chapter - b.chapter);
  for (const Ch of chs) {
    const its = items.filter((it) => it.col === C.id && it.chapter === Ch.chapter);
    const pl = planned.filter((it) => it.col === C.id && it.chapter === Ch.chapter).length;
    rows.push({ key: `${C.id}/${Ch.chapter}`, title: Ch.title, n: its.length, planned: pl, def: its.filter((it) => it.kind === 'Definition').length, viz: its.filter((it) => typeof it.viz === 'function').length, verify: its.filter((it) => it.verify).length });
  }
}
const unresolved = [];
for (const it of items.filter((x) => want(collections.find((C) => C.id === x.col)))) for (const f of ['deps', 'see']) for (const d of it[f] || []) {
  if (!ID_RE.test(d) || ids.has(d)) continue;
  const [col, num] = d.split('-'); const ch = +num.split('.')[0];
  const near = items.filter((x) => x.col === col && x.chapter === ch).sort((a, b) => Math.abs(parseFloat(a.num) - parseFloat(num)) - Math.abs(parseFloat(b.num) - parseFloat(num))).slice(0, 3).map((x) => `${x.id} “${x.name}”`);
  unresolved.push({ from: it.id, field: f, id: d, near });
}
const noViz = items.filter((it) => it.kind !== 'Definition' && typeof it.viz !== 'function').map((it) => it.id);

if (process.argv.includes('--json')) { console.log(JSON.stringify({ rows, unresolved, noViz }, null, 1)); process.exit(0); }
console.log('chapter      items planned  def  viz  verify  title');
for (const r of rows) console.log(`${r.key.padEnd(12)} ${String(r.n).padStart(5)} ${String(r.planned).padStart(7)} ${String(r.def).padStart(4)} ${String(r.viz).padStart(4)} ${String(r.verify).padStart(7)}  ${r.title}`);
const tot = rows.reduce((s, r) => ({ n: s.n + r.n, planned: s.planned + r.planned, def: s.def + r.def, viz: s.viz + r.viz, verify: s.verify + r.verify }), { n: 0, planned: 0, def: 0, viz: 0, verify: 0 });
console.log(`TOTAL        ${String(tot.n).padStart(5)} ${String(tot.planned).padStart(7)} ${String(tot.def).padStart(4)} ${String(tot.viz).padStart(4)} ${String(tot.verify).padStart(7)}`);
console.log(`\n${unresolved.length} unresolved reference(s):`);
for (const u of unresolved) console.log(`  ${u.from} ${u.field} → ${u.id}   nearest: ${u.near.join('; ') || '(chapter missing)'}`);
if (noViz.length) console.log(`\nresults without a visualization: ${noViz.join(', ')}`);
