// List likely duplicate ideas across collections (same or nearly the same name) that are not yet linked.
//   node scripts/dupes.mjs [--all] [--min=0.75] [col …]
// Pairs already joined by deps, see or a cross-listing are skipped, and so are pairs between two
// book-anchored collections (books legitimately repeat each other) unless --all is given.
// Resolve a real duplicate with scripts/crosslist.mjs, or add `see` / `deps` if the two differ in scope.
import { loadAll } from './lib.mjs';

const args = process.argv.slice(2);
const all = args.includes('--all');
const min = +(args.find((a) => a.startsWith('--min='))?.slice(6) || 0.75);
const only = new Set(args.filter((a) => !a.startsWith('--')));
const { collections, items, planned } = await loadAll();
const book = new Set(collections.filter((C) => C.source?.type === 'book').map((C) => C.id));
const nodes = [...items, ...planned];
const STOP = new Set('the a an of and in on for to with its is as by theorem law principle lemma corollary proposition definition s from via at or'.split(' '));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\\[a-z]+/g, ' ').replace(/[’']s\b/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w && !STOP.has(w));
const linked = (a, b) => [a.deps, a.see].some((L) => L?.includes(b.id)) || [b.deps, b.see].some((L) => L?.includes(a.id));
const T = nodes.map((it) => ({ it, t: new Set(norm(it.name)) })).filter((x) => x.t.size);
const out = [];
for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
  const A = T[i], B = T[j];
  if (A.it.col === B.it.col || linked(A.it, B.it)) continue;
  if (only.size && !only.has(A.it.col) && !only.has(B.it.col)) continue;
  if (!all && book.has(A.it.col) && book.has(B.it.col)) continue;
  let inter = 0; for (const w of A.t) if (B.t.has(w)) inter++;
  const jac = inter / (A.t.size + B.t.size - inter);
  if (jac >= min && (inter >= 2 || (jac === 1 && [...A.t][0].length > 5))) out.push({ jac, A: A.it, B: B.it });
}
out.sort((a, b) => b.jac - a.jac || a.A.id.localeCompare(b.A.id));
const tag = (it) => `${it.id}${it.planned ? '' : '*'}`;
for (const { jac, A, B } of out) console.log(`${jac.toFixed(2)}  ${tag(A).padEnd(13)} ${A.name.slice(0, 48).padEnd(48)}  ${tag(B).padEnd(13)} ${B.name.slice(0, 48)}`);
console.log(`\n${out.length} candidate pair(s)  (* = written)`);
