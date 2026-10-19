// Check the master-plan connection quota without manufacturing prerequisites to fill it.
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAll, ROOT } from './lib.mjs';

export function crossFieldInventory(atlas, target = 25) {
  const collections = new Map(atlas.collections.map(c => [c.id, c]));
  const written = new Set(atlas.items.map(i => i.id));
  const byId = new Map([...atlas.items, ...atlas.planned].map(i => [i.id, i]));
  const entries = atlas.collections.filter(c => c.field !== 'math').map(collection => {
    const edges = [], unknown = [], seen = new Set();
    for (const item of [...atlas.items, ...atlas.planned].filter(i => i.col === collection.id)) for (const id of item.deps || []) {
      const key = `${item.id}>${id}`; if (seen.has(key)) continue; seen.add(key);
      const dep = byId.get(id);
      if (!dep) { unknown.push({ item: item.id, prerequisite: id }); continue; }
      const field = collections.get(dep.col)?.field;
      if (field && field !== collection.field) edges.push({ item: item.id, prerequisite: id, prerequisiteField: field,
        itemWritten: written.has(item.id), prerequisiteWritten: written.has(id) });
    }
    const writtenToWritten = edges.filter(e => e.itemWritten && e.prerequisiteWritten).length;
    const writtenToKnown = edges.filter(e => e.itemWritten).length;
    return { collection: collection.id, field: collection.field, target, writtenToWritten, writtenToKnown,
      wholeSyllabus: edges.length, publishedShortfall: Math.max(0, target - writtenToWritten), unknown, edges };
  });
  return { version: 1, target,
    counting: 'Unique directed prerequisite edges from a non-math collection to a different field; separate written and planned availability. Related links and same-field cross-collection links do not count.',
    limitation: 'Counts alone do not establish that any prerequisite is pedagogically or factually justified. Correct links require source/proof review; do not add arbitrary links to meet a quota.',
    collections: entries.length, publishedBelowTarget: entries.filter(e => e.writtenToWritten < target).length,
    wholeSyllabusBelowTarget: entries.filter(e => e.wholeSyllabus < target).length, entries };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = crossFieldInventory(await loadAll());
  await writeFile(join(ROOT, 'docs/verification/cross-field-dependencies.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.publishedBelowTarget}/${report.collections} non-math collections below ${report.target} published cross-field edges; ${report.wholeSyllabusBelowTarget} remain below target even including planned chapters. No dependencies changed.`);
}
