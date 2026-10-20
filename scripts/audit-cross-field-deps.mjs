// Check the master-plan connection quota without manufacturing prerequisites to fill it.
import { readFile, writeFile } from 'node:fs/promises';
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

// Accepted accounting must not silently adopt a frozen candidate or erase its record.
export function acceptedCrossFieldInventory(atlas, acceptance, target = 25) {
  const all = new Map([...atlas.items, ...atlas.planned].map(item => [item.id, item]));
  const excluded = new Map();
  for (const edge of acceptance?.excludedUnacceptedEdges || []) {
    const item = all.get(edge.item), key = `${edge.item}>${edge.prerequisite}`;
    if (!item?.deps?.includes(edge.prerequisite) || !all.has(edge.prerequisite)) throw new Error(`Stale or unknown accepted-inventory exclusion: ${key}`);
    if (excluded.has(key)) throw new Error(`Duplicate accepted-inventory exclusion: ${key}`);
    excluded.set(key, true);
  }
  const filter = item => ({ ...item, deps: item.deps?.filter(id => !excluded.has(`${item.id}>${id}`)) });
  const report = crossFieldInventory({ ...atlas, items: atlas.items.map(filter), planned: atlas.planned.map(filter) }, target);
  if (acceptance) report.acceptance = structuredClone(acceptance);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const atlas = await loadAll();
  if (process.argv.includes('--raw')) {
    console.log(JSON.stringify(crossFieldInventory(atlas), null, 2));
  } else {
    const path = join(ROOT, 'docs/verification/cross-field-dependencies.json');
    const previous = JSON.parse(await readFile(path, 'utf8'));
    const report = acceptedCrossFieldInventory(atlas, previous.acceptance);
    await writeFile(path, JSON.stringify(report, null, 2) + '\n');
    console.log(`${report.publishedBelowTarget}/${report.collections} non-math collections below ${report.target} published cross-field edges; ${report.wholeSyllabusBelowTarget} remain below target even including planned chapters. Acceptance metadata and explicit exclusions preserved; no dependencies changed.`);
  }
}
