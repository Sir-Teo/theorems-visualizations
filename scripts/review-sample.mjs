// Reproducible Wave 3–4 human sample plus an atlas-wide listening queue.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAll, ROOT } from './lib.mjs';

export const SAMPLE_SEED = 'atlas-wave-3-4-human-v1';
const hash = value => createHash('sha256').update(value).digest('hex');

// Hash ordering is a reproducible pseudorandom draw without replacement. Start
// with one item per field, then draw the remaining places from the whole pool.
export function selectSample(items, count, seed = SAMPLE_SEED) {
  if (count < new Set(items.map(i => i.field)).size || count > items.length) throw new Error('invalid sample size');
  const ranked = items.map(i => ({ ...i, rank: hash(`${seed}\0${i.id}`) })).sort((a, b) => a.rank.localeCompare(b.rank));
  const selected = new Map(), fields = new Set();
  for (const item of ranked) if (!fields.has(item.field)) { fields.add(item.field); selected.set(item.id, item); }
  for (const item of ranked) { if (selected.size >= count) break; selected.set(item.id, item); }
  return [...selected.values()].sort((a, b) => a.rank.localeCompare(b.rank)).map(({ rank, ...item }) => item);
}

async function treeHash(file, seen = new Set()) {
  const absolute = resolve(ROOT, file);
  if (!absolute.startsWith(resolve(ROOT) + '/')) throw new Error('source outside workspace');
  if (seen.has(absolute)) return '';
  seen.add(absolute);
  const source = await readFile(absolute, 'utf8');
  const imports = [...source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+\.js)['"]/g)].map(m => resolve(dirname(absolute), m[1])).sort();
  const dependencies = [];
  for (const dependency of imports) dependencies.push(await treeHash(dependency, seen));
  return hash(JSON.stringify([relative(ROOT, absolute), source, dependencies]));
}

async function runtimeHash(directory = join(ROOT, 'assets/js/viz')) {
  const entries = await readdir(directory, { withFileTypes: true }), parts = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) parts.push(await runtimeHash(file));
    else if (entry.name.endsWith('.js')) parts.push([relative(ROOT, file), await readFile(file, 'utf8')]);
  }
  return hash(JSON.stringify(parts));
}

export async function createManifest() {
  const ledger = JSON.parse(await readFile(join(ROOT, 'docs/verification/waves-3-4-open.json'), 'utf8'));
  const { items, collections, fields } = await loadAll();
  const fieldByCollection = new Map(collections.map(c => [c.id, c.field]));
  const changed = new Set(execFileSync('git', ['diff', '--name-only', ledger.scope.from, ledger.scope.through, '--', 'content'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n'));
  const inventory = items.filter(i => changed.has(i.file)).map(i => ({ ...i, field: fieldByCollection.get(i.col) }));
  if (inventory.length !== ledger.scope.items) throw new Error('review inventory differs from the source ledger');
  const visual = selectSample(inventory, Math.ceil(inventory.length * .05));
  // This deliberately includes earlier chapters: the atlas-wide queue is broader
  // than the 51 sound-bearing items checked automatically in the original report.
  const audio = items.filter(i => /\.sound(?:Button)?\(/.test(String(i.viz)));
  const selected = new Map(visual.map(i => [i.id, { item: i, visual: true, audio: false }]));
  for (const i of audio) {
    const entry = selected.get(i.id) || { item: i, visual: false, audio: false };
    entry.audio = true; selected.set(i.id, entry);
  }
  const runtime = hash(JSON.stringify([await runtimeHash(), await readFile(join(ROOT, 'assets/css/style.css'), 'utf8'),
    await readFile(join(ROOT, 'content/fields.js'), 'utf8'), await readFile(join(ROOT, 'tools/harness.html'), 'utf8')])), fileHashes = new Map();
  const entries = [];
  for (const { item, visual, audio } of selected.values()) {
    if (!fileHashes.has(item.file)) fileHashes.set(item.file, await treeHash(item.file));
    entries.push({ id: item.id, name: item.name, kind: item.kind, field: fieldByCollection.get(item.col), collection: item.col,
      chapter: item.chapter, file: item.file, visual, audio, sourceReviewPending: !!item.verify,
      fingerprint: hash(`${item.id}\0${runtime}\0${fileHashes.get(item.file)}`) });
  }
  const manifest = { version: 1, seed: SAMPLE_SEED, scope: ledger.scope, sampleRate: .05,
    visualCount: visual.length, audioCount: audio.length,
    fields: fields.map(f => ({ id: f.id, name: f.name || f.title || f.id })), entries };
  return { ...manifest, fingerprint: hash(JSON.stringify(manifest)) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await createManifest();
  await writeFile(join(ROOT, 'docs/verification/human-review-sample.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Prepared ${manifest.visualCount} visual reviews (5% of ${manifest.scope.items}, every field represented) and ${manifest.audioCount} listening reviews; no human reviews marked complete.`);
}
