// Plan the next breadth-first wave under the user-authorized content gates.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAll, ROOT } from './lib.mjs';

export function planWaveFive(atlas, sourceQueue) {
  const written = new Set(atlas.items.map(i => i.id));
  const known = new Set([...written, ...atlas.planned.map(i => i.id)]);
  const next = atlas.collections.flatMap(collection => {
    const remaining = atlas.planned.filter(i => i.col === collection.id);
    if (!remaining.length) return [];
    const chapter = Math.min(...remaining.map(i => i.chapter));
    const record = atlas.chapters.get(`${collection.id}/${chapter}`);
    return [{ collection: collection.id, field: collection.field, collectionTitle: collection.title, chapter,
      title: record.title, summary: record.summary || '', syllabus: `content/${collection.id}/syllabus.js`,
      collectionSource: collection.source,
      alreadyWritten: atlas.items.filter(i => i.col === collection.id && i.chapter === chapter).map(i => i.id),
      items: remaining.filter(i => i.chapter === chapter).map(i => ({ id: i.id, num: i.num, kind: i.kind, name: i.name,
        deps: i.deps || [], refs: i.refs || [], pic: i.pic || '' })) }];
  });
  const scheduled = new Set(next.flatMap(c => c.items.map(i => i.id)));
  for (const chapter of next) {
    const local = new Set(chapter.items.map(i => i.id));
    const groups = { written: new Set(), withinChapter: new Set(), elsewhereInWave: new Set(), later: new Set(), unknown: new Set() };
    for (const item of chapter.items) for (const id of item.deps) {
      const group = written.has(id) ? 'written' : local.has(id) ? 'withinChapter' : scheduled.has(id) ? 'elsewhereInWave' : known.has(id) ? 'later' : 'unknown';
      groups[group].add(id);
    }
    chapter.prerequisites = Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, [...values].sort()]));
  }
  return { version: 1, wave: 5, status: 'authoring-authorized',
    gates: { sourceReviewsPending: sourceQueue.remainingFlags, automatedVerification: 'required-per-chapter-and-wave', mapPerformance: 'deferred-by-user',
      note: 'The user authorized content waves on 2026-10-20 and removed map performance as a wave gate. Preserve existing source flags and restrictions; independently review and verify new chapters under MASTER_PLAN §7.3 before accepting them and advancing the wave.' },
    chapterCount: next.length, newItemCount: next.reduce((n, c) => n + c.items.length, 0),
    existingItemCount: next.reduce((n, c) => n + c.alreadyWritten.length, 0), chapters: next };
}

// Keep the original chapter assignments when authoring starts. Replanning from
// the live syllabus would move a finished collection straight into Wave 6.
export function waveFiveProgress(plan, atlas) {
  const written = new Set(atlas.items.map(item => item.id));
  const chapters = plan.chapters.map(chapter => {
    const ids = chapter.items.map(item => item.id);
    const writtenItems = ids.filter(id => written.has(id));
    return { collection: chapter.collection, chapter: chapter.chapter,
      total: ids.length, written: writtenItems.length, remaining: ids.length - writtenItems.length,
      writtenItems, status: writtenItems.length === ids.length ? 'written' : writtenItems.length ? 'in-progress' : 'planned' };
  });
  return { total: chapters.reduce((n, chapter) => n + chapter.total, 0),
    written: chapters.reduce((n, chapter) => n + chapter.written, 0),
    remaining: chapters.reduce((n, chapter) => n + chapter.remaining, 0),
    writtenChapters: chapters.filter(chapter => chapter.status === 'written').length, chapters };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const atlas = await loadAll(), queue = JSON.parse(await readFile(join(ROOT, 'docs/verification/waves-3-4-open.json'), 'utf8'));
  let saved;
  try { saved = JSON.parse(await readFile(join(ROOT, 'docs/wave-five-plan.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const started = saved?.status === 'in-progress' || saved?.status === 'complete';
  const plan = started ? saved : planWaveFive(atlas, queue);
  if (started) plan.progress = waveFiveProgress(plan, atlas);
  if (plan.status === 'complete' && plan.progress.remaining) throw new Error('Completed Wave 5 has missing frozen content; no progress documents written.');
  await writeFile(join(ROOT, 'docs/wave-five-plan.json'), JSON.stringify(plan, null, 2) + '\n');
  const rows = plan.chapters.map(c => `| ${c.collection} | ${c.chapter} · ${c.title} | ${c.items.length} | ${c.alreadyWritten.length} | ${c.prerequisites.later.length} |`).join('\n');
  if (started) {
    const progress = plan.progress;
    await writeFile(join(ROOT, 'docs/wave-five.md'), `# Wave 5 production inventory\n\n**${plan.status === 'complete' ? 'Complete' : 'In progress'}**, started ${plan.started}. The user directed authoring to proceed after confirming the previous work was done. Each new chapter still receives source, mathematical, browser and visual checks.\n\nThe frozen inventory contains ${plan.chapterCount} collections, ${plan.newItemCount} new items and ${plan.existingItemCount} preserved items. **${progress.written} new items are written in ${progress.writtenChapters} complete chapters; ${progress.remaining} remain.** Written counts describe content availability, not independent review acceptance; chapter reports record validation.\n\nThe [machine-readable plan](wave-five-plan.json) preserves the original chapter assignments and records current progress. Regenerate progress with \`npm run wave5:plan\`; completed collections stay in this wave. Syllabi remain authoritative for source and dependency corrections.\n\n| Collection | Wave 5 chapter | New items | Preserved items | Later prerequisite IDs at planning |\n|---|---|---:|---:|---:|\n${rows}\n`);
    console.log(`Wave 5 in progress: ${progress.written}/${progress.total} new items written, ${progress.writtenChapters}/${plan.chapterCount} chapters written. Original inventory preserved.`);
    process.exit(0);
  }
  await writeFile(join(ROOT, 'docs/wave-five.md'), `# Wave 5 production inventory\n\n**Authoring authorized; content has not yet started in this inventory.** Map performance is deferred by user direction on 2026-10-20. This inventory selects the earliest chapter with planned items in each unfinished collection. Existing items in partially written chapters are preserved.\n\n${plan.chapterCount} collections; ${plan.newItemCount} new items; ${plan.existingItemCount} items already written in those chapters. The [machine-readable plan](wave-five-plan.json) includes every item, source reference, picture brief and dependency classified as written, within the chapter, elsewhere in this wave, later, or unknown. Later prerequisites are visible authoring/reconciliation work, not silently treated as already available.\n\nThe source queue currently has **${queue.remainingFlags} pending reviews**. User review and subjective listening are not required. Start content authoring under the updated [MASTER_PLAN §7.3](../MASTER_PLAN.md#73-gates-at-the-end-of-each-wave). Preserve existing source flags and access restrictions; source-check, independently review and verify each new chapter before accepting it. Map performance is not a start or completion gate. See the [execution handoff](wave-continuation.md).\n\nRegenerate with \`npm run wave5:plan\`. Syllabi remain authoritative; verify exact sources and hypotheses before authoring, keep dependencies acyclic, and review, reconcile and commit each collection separately.\n\n| Collection | Next chapter | New items | Already written | Later prerequisite IDs |\n|---|---|---:|---:|---:|\n${rows}\n`);
  console.log(`Prepared Wave 5: ${plan.chapterCount} chapters, ${plan.newItemCount} new items; content authoring authorized, map performance deferred. Chapter acceptance still requires source review and content checks. No chapter content created.`);
}
