// Future inventories are prepared explicitly; availability never certifies acceptance.
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAll, ROOT } from './lib.mjs';
import { planWaveFive, waveFiveProgress } from './plan-wave-five.mjs';

function requireWave(wave) {
  if (!Number.isSafeInteger(wave) || wave < 6) throw new Error('An explicit integer wave >= 6 is required.');
}
function validateInventory(plan, wave) {
  if (!plan || plan.wave !== wave || !Array.isArray(plan.chapters)) throw new Error(`Invalid saved Wave ${wave} inventory.`);
  const ids = new Set(), collections = new Set();
  for (const chapter of plan.chapters) {
    if (!chapter.collection || !Number.isInteger(chapter.chapter) || !Array.isArray(chapter.items) || collections.has(chapter.collection)) throw new Error(`Invalid Wave ${wave} chapter assignment.`);
    collections.add(chapter.collection);
    for (const item of chapter.items) {
      if (!item.id || ids.has(item.id)) throw new Error(`Invalid or duplicate Wave ${wave} frozen identity.`);
      ids.add(item.id);
    }
  }
}

export function requirePreviousComplete(wave, previous, atlas) {
  requireWave(wave);
  validateInventory(previous, wave - 1);
  if (previous.status !== 'complete') throw new Error(`Wave ${wave - 1} must be explicitly marked complete after acceptance before preparing Wave ${wave}.`);
  const written = new Set(atlas.items.map(item => item.id));
  const missingPreserved = previous.chapters.flatMap(chapter => chapter.alreadyWritten || []).filter(id => !written.has(id));
  if (missingPreserved.length) throw new Error(`Wave ${wave - 1} is missing preserved alreadyWritten item(s): ${missingPreserved.join(', ')}.`);
  const progress = waveFiveProgress(previous, atlas);
  if (progress.remaining !== 0) throw new Error(`Wave ${wave - 1} still has ${progress.remaining} frozen item(s) absent from actual content.`);
  return progress;
}

// Once saved, even an unstarted inventory is frozen. Refresh only availability.
// The caller/root marks independent acceptance complete in the saved plan;
// neither this function nor the CLI derives it from the written-item count.
export function planContentWave(atlas, { wave, previous, saved, start = false, startedAt } = {}) {
  requireWave(wave);
  requirePreviousComplete(wave, previous, atlas);
  if (typeof start !== 'boolean') throw new Error('start must be a boolean.');
  let plan;
  if (saved !== undefined) {
    validateInventory(saved, wave);
    if (!['prepared', 'in-progress', 'complete'].includes(saved.status)) throw new Error(`Invalid Wave ${wave} lifecycle status.`);
    plan = structuredClone(saved);
  } else {
    plan = planWaveFive(atlas, { remainingFlags: null });
    plan.wave = wave;
    plan.status = 'prepared';
    plan.previousWave = wave - 1;
    plan.gates = {
      previousWave: 'explicit-complete-status-and-zero-frozen-items-remaining',
      chapterAcceptance: 'independent-source-mathematical-browser-and-visual-review-required',
      mapPerformance: 'deferred-by-user',
      note: 'Prepared inventory only. Root must explicitly start authoring and mark independent acceptance complete; written availability alone does neither. Preserve existing source flags and access restrictions; map performance remains deferred by user direction.',
    };
    // Keep original Paper relationships and qualifiers as well as numbered identities.
    const planned = new Map(atlas.planned.map(item => [item.id, item]));
    for (const chapter of plan.chapters) for (const item of chapter.items) {
      const source = planned.get(item.id);
      for (const key of ['paper', 'introduces', 'see', 'verify']) if (source[key] !== undefined) item[key] = structuredClone(source[key]);
    }
    plan = structuredClone(plan); // Do not retain any caller-owned nested arrays.
  }
  if (start && plan.status === 'prepared') {
    if (typeof startedAt !== 'string' || !startedAt.trim()) throw new Error('Explicit start requires a nonempty startedAt timestamp.');
    plan.status = 'in-progress';
    plan.started = startedAt;
  }
  plan.progress = waveFiveProgress(plan, atlas);
  if (plan.status === 'complete' && plan.progress.remaining) throw new Error(`Saved complete Wave ${wave} has missing frozen content.`);
  return plan;
}

export function renderContentWave(plan) {
  const cell = value => String(value ?? '').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
  const progress = plan.progress;
  const lifecycle = plan.status === 'complete'
    ? '**Complete**, explicitly recorded by root; availability was checked separately.'
    : plan.status === 'in-progress' ? `**In progress**, explicitly started ${cell(plan.started)}.`
      : '**Prepared; authoring has not been started by this planner.**';
  const rows = plan.chapters.map(c => `| ${cell(c.collection)} | ${c.chapter} · ${cell(c.title)} | ${c.items.length} | ${c.alreadyWritten?.length ?? 0} | ${c.prerequisites?.later?.length ?? 0} |`).join('\n');
  return `# Wave ${plan.wave} production inventory\n\n${lifecycle}\n\nThe previous saved wave was explicitly marked complete and all its frozen items were present in actual content. This does not authorize automatic advancement or certify independent acceptance of the current wave.\n\n${progress.written}/${progress.total} frozen new items are written; ${progress.remaining} remain. Written counts describe availability, not review acceptance. The [machine-readable inventory](wave-${plan.wave}-plan.json) freezes chapter assignments and identities, including completed chapters. Refresh preserves these assignments. Syllabi remain authoritative for researched source/dependency corrections; preserve source flags and access restrictions.\n\nRun \`node scripts/plan-content-wave.mjs --wave ${plan.wave}\` to refresh. Only an explicit \`--start\` changes prepared to in-progress. Completion must be recorded by root after independent chapter and wave gates; this CLI has no completion switch.\n\n| Collection | Frozen chapter | New items | Preserved items | Later prerequisites at planning |\n|---|---|---:|---:|---:|\n${rows}\n`;
}

export function parseContentWaveArgs(args) {
  let wave, start = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--wave' && wave === undefined && /^\d+$/.test(args[i + 1] || '')) wave = Number(args[++i]);
    else if (args[i] === '--start' && !start) start = true;
    else throw new Error('Usage: node scripts/plan-content-wave.mjs --wave N [--start] (N >= 6)');
  }
  requireWave(wave);
  return { wave, start };
}
async function readOptional(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { wave, start } = parseContentWaveArgs(process.argv.slice(2));
  const previousPath = join(ROOT, `docs/wave-${wave - 1}-plan.json`);
  // Prefer the numbered file; a malformed/incomplete numbered file must not be
  // bypassed by falling back to a more permissive legacy inventory.
  let previous = await readOptional(previousPath);
  if (previous === undefined && wave === 6) previous = await readOptional(join(ROOT, 'docs/wave-five-plan.json'));
  if (previous === undefined) throw new Error(`Missing saved previous-wave inventory: ${previousPath}`);
  const output = join(ROOT, `docs/wave-${wave}-plan.json`);
  const saved = await readOptional(output), atlas = await loadAll();
  if (atlas.problems.some(problem => problem.level === 'error')) throw new Error('Actual content load has errors; no wave files written.');
  const plan = planContentWave(atlas, { wave, previous, saved, start, startedAt: new Date().toISOString() });
  const markdown = renderContentWave(plan);
  await writeFile(output, JSON.stringify(plan, null, 2) + '\n');
  await writeFile(join(ROOT, `docs/wave-${wave}.md`), markdown);
  console.log(`Wave ${wave} ${plan.status}: ${plan.progress.written}/${plan.progress.total} frozen items written; acceptance is explicit, not inferred.`);
}
