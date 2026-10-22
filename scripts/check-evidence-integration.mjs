// Rehearse the explicit production delta in a disposable accepted-base snapshot only.
import { readFile, writeFile, mkdir, readdir, lstat, symlink } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ROOT } from './lib.mjs';
import { preflight } from './check-exploration-integration.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const replacements = ['assets/js/app.js', 'scripts/build.mjs'];
const addition = path => /^(assets\/js\/evidence-(model|view)\.js|assets\/css\/evidence\.css|evidence\/manifest\.json|scripts\/(evidence-(sidecars|module-digest)|check-evidence-integration)\.mjs|tests\/evidence(?:-fixture|-ui\.test|\.test)\.mjs|docs\/(architecture\/legacy-evidence|verification\/universal-evidence(?:-ai-code)?|integration\/evidence-view)\.(?:md|json))$/.test(path);
async function inventory(root, prefix = '') {
  const values = {};
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) Object.assign(values, await inventory(root, path));
    else if (entry.isFile()) values[path] = hash(await readFile(join(root, path)));
    else throw new Error('Special snapshot entry: ' + path);
  }
  return values;
}
async function dataInventory(root) {
  const files = await inventory(join(root, 'data'));
  for (const path of ['index.json', 'home.json']) {
    const data = JSON.parse(await readFile(join(root, 'data', path), 'utf8'));
    delete data.generated; files[path] = hash(JSON.stringify(data));
  }
  return files;
}
export async function rehearseEvidence({ repo, base, ui = false }) {
  const manifest = JSON.parse(await readFile(join(ROOT, 'docs/integration/evidence-view.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.mode !== 'legacy-evidence-local-integration' || !Array.isArray(manifest.replacements) || !Array.isArray(manifest.additions)) throw new Error('Unknown evidence integration contract');
  if (manifest.replacements.map(x => x.path).sort().join(',') !== [...replacements].sort().join(',') || manifest.replacements.some(x => !/^[a-f0-9]{64}$/.test(x.baseSha256 || ''))) throw new Error('Unexpected production replacements');
  if (new Set(manifest.additions).size !== manifest.additions.length || !manifest.additions.every(addition)) throw new Error('Unexpected evidence additions');
  const initial = await preflight({ repo, base }), target = initial.snapshot, logDir = dirname(initial.report);
  if (initial.baseCommit !== manifest.baseCommit) throw new Error('Reconcile the evidence delta against the requested accepted base first');
  const before = await inventory(target), checks = [];
  async function run(args, label) {
    const log = join(logDir, 'evidence-' + label + '.log');
    try { const result = execFileSync(process.execPath, args, { cwd: target, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024, env: { ...process.env, ATLAS_EVIDENCE_SCREENSHOTS: join(logDir, 'evidence-screenshots') } }); await writeFile(log, result); checks.push({ command: 'node ' + args.join(' '), result: 'PASS', log }); }
    catch (error) { await writeFile(log, String(error.stdout || '') + String(error.stderr || '')); throw new Error('Evidence check failed; inspect ' + log); }
  }
  await run(['scripts/build.mjs', '--strict'], 'baseline-build');
  const oldData = await dataInventory(target);
  const edits = [];
  for (const entry of manifest.replacements) {
    if (hash(await readFile(join(target, entry.path))) !== entry.baseSha256) throw new Error('Production preimage differs; reconcile explicitly: ' + entry.path);
    edits.push({ path: entry.path, action: 'replace-pinned-base', bytes: await readFile(join(ROOT, entry.path)) });
  }
  for (const path of manifest.additions) {
    const stat = await lstat(join(ROOT, path));
    if (!stat.isFile()) throw new Error('Evidence addition must be a regular file: ' + path);
    const bytes = await readFile(join(ROOT, path));
    const existing = await lstat(join(target, path)).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (existing && (!existing.isFile() || hash(await readFile(join(target, path))) !== hash(bytes))) throw new Error('Evidence destination differs: ' + path);
    edits.push({ path, action: existing ? 'identical' : 'add', bytes });
  }
  for (const { path, bytes } of edits) { await mkdir(dirname(join(target, path)), { recursive: true }); await writeFile(join(target, path), bytes); }
  await run(['scripts/build.mjs', '--strict'], 'integrated-build');
  const newData = await dataInventory(target);
  for (const [path, digest] of Object.entries(oldData)) if (newData[path] !== digest) throw new Error('Existing production data changed: ' + path);
  const addedData = Object.keys(newData).filter(path => !Object.hasOwn(oldData, path));
  if (addedData.some(path => path !== 'evidence.json' && !/^evidence\/[a-z0-9.-]+\.json$/.test(path))) throw new Error('Unexpected generated data');
  await run(['scripts/check.mjs', '--static', '--quiet'], 'static');
  await run(['--test', 'tests/evidence.test.mjs', 'tests/share-state.test.mjs'], 'offline');
  if (ui) {
    await symlink(join(ROOT, 'node_modules'), join(target, 'node_modules'), 'dir');
    await run(['--test', '--test-concurrency=1', 'tests/evidence-ui.test.mjs', 'tests/ui.test.mjs'], 'native');
  }
  for (const [path, digest] of Object.entries(before)) if (!replacements.includes(path) && hash(await readFile(join(target, path))) !== digest) throw new Error('Unrelated snapshot file changed: ' + path);
  const report = { result: 'PASS', baseCommit: initial.baseCommit, snapshot: target, universalPreflight: initial.report, intentionalProductionReplacements: replacements, otherSnapshotFilesPreserved: Object.keys(before).length - replacements.length, existingDataFilesPreserved: Object.keys(oldData).length, ignoredDataDifference: 'Only generated timestamps in index.json/home.json are excluded from equality.', addedData, changes: edits.map(({ bytes, ...entry }) => ({ ...entry, sha256: hash(bytes) })), checks, scope: 'Local integration rehearsal only. No active Wave checkout, publication, acceptance count or deployment changed.' };
  const path = join(logDir, 'evidence-report.json'); await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  return { result: report.result, baseCommit: report.baseCommit, existingDataFilesPreserved: report.existingDataFilesPreserved, addedData, report: path, snapshot: target };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = {};
    while (args.length) { const flag = args.shift(); if (flag === '--ui') options.ui = true; else if (['--repo', '--base'].includes(flag)) options[flag.slice(2)] = args.shift(); else throw new Error('Unknown argument ' + flag); }
    console.log(JSON.stringify(await rehearseEvidence(options), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
