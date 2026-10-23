// Rehearse the two exact source replacements against the complete committed
// predecessor. All outputs are disposable local candidates, never deployments.
import { readFile, writeFile, mkdir, mkdtemp, lstat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';
import { inventory } from './build-domain-navigation.mjs';
import { hash, json } from '../journeys/reader.mjs';
const predecessor = 'd11438852c631528b6f27d8107f025e9bf677b7e';
const replacements = [
  { path: 'scripts/exploration-editions.mjs', baseSha256: '80a90b689fa867ae1beadf6528213bc312db82e873a971c4a4e31014b0c8aa8e' },
  { path: 'scripts/domain-navigation.mjs', baseSha256: 'b71b38bac79298c6c961c8fcb4c88db7d948580d6fac613d36becac9b23746f1' },
];
const additions = [
  'docs/integration/release-material-validation.json', 'docs/integration/release-material-validation.md',
  'docs/verification/universal-release-material-validation.md', 'scripts/check-release-material-integration.mjs',
  'tests/release-material-validation.test.mjs',
].sort();
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const exists = path => lstat(path).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
export async function rehearseReleaseMaterials() {
  const manifest = await read(join(ROOT, 'docs/integration/release-material-validation.json'));
  assert(manifest.schemaVersion === 1 && manifest.mode === 'release-material-validation-delta' && manifest.predecessorCommit === predecessor && json(manifest.replacements) === json(replacements) && json(manifest.additions) === json(additions), 'Unknown release-material integration manifest');
  const work = await mkdtemp(join(tmpdir(), 'atlas-release-material-integration-')), snapshot = join(work, 'snapshot'), tar = join(work, 'predecessor.tar'); await mkdir(snapshot);
  execFileSync('git', ['archive', '--format=tar', '--output', tar, predecessor], { cwd: ROOT });
  execFileSync('tar', ['-xf', tar, '-C', snapshot]);
  const before = await inventory(snapshot), changes = [], checks = [];
  for (const path of additions) {
    assert((await lstat(join(ROOT, path))).isFile(), 'Addition must be regular: ' + path);
    assert(!await exists(join(snapshot, path)), 'Addition collides: ' + path);
    const bytes = await readFile(join(ROOT, path)); await mkdir(dirname(join(snapshot, path)), { recursive: true }); await writeFile(join(snapshot, path), bytes, { flag: 'wx' }); changes.push({ path, action: 'add', sha256: hash(bytes) });
  }
  async function run(args, name, expectedFailure = false) {
    let output, status = 0;
    try { output = execFileSync(process.execPath, args, { cwd: snapshot, encoding: 'utf8', maxBuffer: 24 * 1024 * 1024 }); }
    catch (e) { output = String(e.stdout || '') + String(e.stderr || ''); status = e.status; }
    const log = join(work, name + '.log'); await writeFile(log, output);
    if (expectedFailure) {
      assert(status === 1 && output.includes('not ok 1 - edition material decisions reject comma-combined') && output.includes('not ok 2 - domain material decisions reject comma-combined') && (output.match(/Missing expected exception:/g) || []).length === 2 && /# fail 2\b/.test(output), 'Predecessor did not reproduce both scoped findings; inspect ' + log);
    } else assert(status === 0, 'Release-material check failed; inspect ' + log);
    checks.push({ command: 'node ' + args.join(' '), result: expectedFailure ? 'EXPECTED_FAILURE' : 'PASS', log, sha256: hash(output) });
  }
  await run(['scripts/build.mjs', '--strict'], 'legacy-build');
  await run(['scripts/check.mjs', '--static', '--quiet'], 'legacy-static');
  await run(['--test', '--test-name-pattern=comma-combined', 'tests/release-material-validation.test.mjs'], 'predecessor-regressions', true);
  const outputs = {};
  for (const mode of ['preview', 'release']) {
    outputs['before-' + mode] = join(work, 'before-' + mode);
    await run(['scripts/build-journeys.mjs', '--out', outputs['before-' + mode], ...(mode === 'release' ? ['--mode', 'release', '--base-url', 'https://example.org/project/'] : [])], 'before-' + mode);
  }
  const baselineJourney = await read(join(outputs['before-preview'], 'journey-build.json')), baselineNav = await read(join(outputs['before-preview'], 'navigation-build.json'));
  assert(json(manifest.predecessorBindings) === json({ editionDeliveryDigest: baselineNav.editionDeliveryDigest, navigationDigest: baselineNav.navigationDigest, journeyDeliveryDigest: baselineJourney.deliveryDigest }), 'Predecessor delivery bindings differ');
  for (const { path, baseSha256 } of replacements) {
    assert(before[path] === baseSha256 && hash(await readFile(join(snapshot, path))) === baseSha256, 'Replacement preimage differs: ' + path);
    assert((await lstat(join(ROOT, path))).isFile(), 'Replacement must be regular: ' + path);
    const bytes = await readFile(join(ROOT, path)); assert(hash(bytes) !== baseSha256, 'Replacement did not change: ' + path);
    await writeFile(join(snapshot, path), bytes); changes.push({ path, action: 'replace', beforeSha256: baseSha256, sha256: hash(bytes) });
  }
  await run(['--test', '--test-concurrency=1', 'tests/release-material-validation.test.mjs', 'tests/exploration-editions.test.mjs', 'tests/domain-navigation.test.mjs', 'tests/journeys.test.mjs'], 'current-offline');
  const comparisons = [];
  for (const mode of ['preview', 'release']) {
    outputs[mode] = join(work, mode);
    await run(['scripts/build-journeys.mjs', '--out', outputs[mode], ...(mode === 'release' ? ['--mode', 'release', '--base-url', 'https://example.org/project/'] : [])], mode);
    const oldFiles = await inventory(outputs['before-' + mode]), newFiles = await inventory(outputs[mode]);
    assert(json(Object.keys(oldFiles).sort()) === json(Object.keys(newFiles).sort()), 'Candidate inventory changed: ' + mode);
    const differences = Object.keys(oldFiles).filter(p => oldFiles[p] !== newFiles[p]).sort();
    assert(json(differences) === json(['edition-build.json', 'journey-build.json', 'navigation-build.json']), 'Reader files changed: ' + mode + ' ' + differences.join(', '));
    for (const path of differences) {
      const old = await read(join(outputs['before-' + mode], path)), current = await read(join(outputs[mode], path));
      for (const key of ['deliveryDigest', 'deliveryFiles', 'navigationDigest', 'navigationFiles', 'editionDeliveryDigest']) { delete old[key]; delete current[key]; }
      assert(json(old) === json(current), 'Non-binding build report changed: ' + mode + ' ' + path);
    }
    comparisons.push({ mode, filesCompared: Object.keys(oldFiles).length, identicalFiles: Object.keys(oldFiles).length - differences.length, bindingReportsChanged: differences });
  }
  const previewBuild = await read(join(outputs.preview, 'journey-build.json')), releaseBuild = await read(join(outputs.release, 'journey-build.json'));
  assert(previewBuild.availableJourneys === 3 && previewBuild.newLessons === 0 && releaseBuild.availableJourneys === 0 && releaseBuild.generatedFiles.length === 0 && releaseBuild.replacements.length === 0, 'Candidate scope changed');
  const changedPaths = new Set(replacements.map(r => r.path));
  for (const [path, sha] of Object.entries(before)) if (!changedPaths.has(path)) assert(hash(await readFile(join(snapshot, path))) === sha, 'Preexisting source changed: ' + path);
  for (const c of changes) assert(hash(await readFile(join(ROOT, c.path))) === c.sha256 && hash(await readFile(join(snapshot, c.path))) === c.sha256, 'Delta changed during rehearsal: ' + c.path);
  const path = join(work, 'report.json'), report = { schemaVersion: 1, result: 'PASS', predecessorCommit: predecessor, snapshot, outputs, preexistingSourceFilesPreserved: Object.keys(before).length - replacements.length, changes, checks, comparisons, previewBuild, releaseBuild, scope: 'Local validation repair; exact preimages and reader-output parity. No new acceptance, independent final engineering approval, release decision, deployment or other-chat edit.' };
  await writeFile(path, json(report)); return { result: 'PASS', report: path, comparisons };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { assert(process.argv.length === 2, 'This checker takes no arguments'); console.log(json(await rehearseReleaseMaterials())); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
