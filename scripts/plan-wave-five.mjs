// Prepare the next breadth-first wave without crossing its verification gate.
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
  return { version: 1, wave: 5, status: 'prepared-not-started',
    gates: { sourceReviewsPending: sourceQueue.remainingFlags, automatedVerification: 'pending',
      note: 'Planning does not authorize the authoring phase to bypass MASTER_PLAN §7.3. Source evidence, automated checks and agent visual inspection must satisfy the remaining wave gates before starting.' },
    chapterCount: next.length, newItemCount: next.reduce((n, c) => n + c.items.length, 0),
    existingItemCount: next.reduce((n, c) => n + c.alreadyWritten.length, 0), chapters: next };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const atlas = await loadAll(), queue = JSON.parse(await readFile(join(ROOT, 'docs/verification/waves-3-4-open.json'), 'utf8'));
  const plan = planWaveFive(atlas, queue);
  await writeFile(join(ROOT, 'docs/wave-five-plan.json'), JSON.stringify(plan, null, 2) + '\n');
  const rows = plan.chapters.map(c => `| ${c.collection} | ${c.chapter} · ${c.title} | ${c.items.length} | ${c.alreadyWritten.length} | ${c.prerequisites.later.length} |`).join('\n');
  await writeFile(join(ROOT, 'docs/wave-five.md'), `# Wave 5 production inventory\n\nPrepared, **not started**. This inventory selects the earliest chapter with planned items in each unfinished collection. Existing items in partially written chapters are preserved.\n\n${plan.chapterCount} collections; ${plan.newItemCount} new items; ${plan.existingItemCount} items already written in those chapters. The [machine-readable plan](wave-five-plan.json) includes every item, source reference, picture brief and dependency classified as written, within the chapter, elsewhere in this wave, later, or unknown. Later prerequisites are visible authoring/reconciliation work, not silently treated as already available.\n\nThe source queue currently has **${queue.remainingFlags} pending reviews**. User review and subjective listening are not required. Start authoring only after the source and automated verification gates in [MASTER_PLAN §7.3](../MASTER_PLAN.md#73-gates-at-the-end-of-each-wave) are satisfied. This plan does not claim that those gates have passed.\n\nRegenerate with \`npm run wave5:plan\`. Syllabi remain authoritative; verify exact sources and hypotheses before authoring, keep dependencies acyclic, and review, reconcile and commit each collection separately.\n\n| Collection | Next chapter | New items | Already written | Later prerequisite IDs |\n|---|---|---:|---:|---:|\n${rows}\n`);
  console.log(`Prepared Wave 5: ${plan.chapterCount} chapters, ${plan.newItemCount} new items; source and automated gates remain open. No chapter content created.`);
}
