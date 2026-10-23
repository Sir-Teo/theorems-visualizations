// Replay the complete committed predecessor, then add only this declared delta.
import { readFile, writeFile, mkdir, mkdtemp, lstat, symlink } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';
import { inventory } from './build-domain-navigation.mjs';
import { hash, json } from '../journeys/reader.mjs';
const predecessor = '49612b3dddceada66c998cde1bf896bd032d9f8e';
const additions = [
  'journeys/releases.json', 'journeys/reader.mjs', 'journeys/style.css',
  'scripts/build-journeys.mjs', 'scripts/check-journey-integration.mjs', 'tests/journeys.test.mjs', 'tests/journeys-ui.test.mjs',
  'docs/architecture/journey-reader.md', 'docs/integration/journey-reader.json', 'docs/integration/journey-reader.md',
  'docs/verification/universal-journey-reader.md', 'docs/verification/universal-journey-reader-ai-code.md', 'docs/verification/universal-journey-reader-ai-content.md',
].sort();
export async function rehearseJourneys({ base = 'https://example.org/project/', ui = false } = {}) {
  const m = JSON.parse(await readFile(join(ROOT, 'docs/integration/journey-reader.json'), 'utf8'));
  if (m.schemaVersion !== 1 || m.mode !== 'journey-reader-delta' || m.predecessorCommit !== predecessor || json(m.replacements) !== '[]\n' || json(m.additions?.slice().sort()) !== json(additions)) throw new Error('Unknown journey integration manifest');
  const work = await mkdtemp(join(tmpdir(), 'atlas-journey-integration-')), snapshot = join(work, 'snapshot'), tar = join(work, 'predecessor.tar'); await mkdir(snapshot);
  execFileSync('git', ['archive', '--format=tar', '--output', tar, predecessor], { cwd: ROOT });
  execFileSync('tar', ['-xf', tar, '-C', snapshot]);
  const before = await inventory(snapshot), changes = [];
  for (const path of additions) {
    if (!(await lstat(join(ROOT, path))).isFile()) throw new Error('Journey addition must be a regular file: ' + path);
    if (await lstat(join(snapshot, path)).catch(e => { if (e.code === 'ENOENT') return null; throw e; })) throw new Error('Journey addition collides: ' + path);
    const bytes = await readFile(join(ROOT, path)); await mkdir(dirname(join(snapshot, path)), { recursive: true }); await writeFile(join(snapshot, path), bytes, { flag: 'wx' }); changes.push({ path, sha256: hash(bytes) });
  }
  const preview = join(work, 'preview'), release = join(work, 'release'), checks = [];
  async function run(args, name) {
    const log = join(work, name + '.log');
    try {
      const output = execFileSync(process.execPath, args, { cwd: snapshot, encoding: 'utf8', maxBuffer: 24 * 1024 * 1024, env: {
        ...process.env, ATLAS_JOURNEY_CANDIDATE: preview, ATLAS_JOURNEY_SCREENSHOTS: join(work, 'journey-screenshots'),
        ATLAS_DOMAIN_NAVIGATION_CANDIDATE: preview, ATLAS_DOMAIN_NAVIGATION_SCREENSHOTS: join(work, 'domain-screenshots'),
      } });
      await writeFile(log, output); checks.push({ command: 'node ' + args.join(' '), result: 'PASS', log, sha256: hash(output) });
    } catch (error) { await writeFile(log, String(error.stdout || '') + String(error.stderr || '')); throw new Error('Journey check failed; inspect ' + log); }
  }
  // Generated legacy data is intentionally absent from Git archives. Regenerate it
  // inside this disposable snapshot; downstream assembly verifies its frozen digest.
  await run(['scripts/build.mjs', '--strict'], 'legacy-build');
  await run(['scripts/check.mjs', '--static', '--quiet'], 'legacy-static');
  await run(['--test', '--test-concurrency=1', 'tests/journey-plans.test.mjs', 'tests/journeys.test.mjs'], 'offline');
  await run(['scripts/build-journeys.mjs', '--out', preview], 'preview');
  await run(['scripts/build-journeys.mjs', '--out', release, '--mode', 'release', '--base-url', base], 'release');
  const previewBuild = JSON.parse(await readFile(join(preview, 'journey-build.json'), 'utf8')), releaseBuild = JSON.parse(await readFile(join(release, 'journey-build.json'), 'utf8'));
  if (previewBuild.availableJourneys !== 3 || previewBuild.retainedJourneys !== 3 || previewBuild.canonicalJourneyPages || previewBuild.generatedFiles.length !== 7 || previewBuild.replacements.length !== 5) throw new Error('Unexpected journey preview scope');
  if (releaseBuild.availableJourneys || releaseBuild.retainedJourneys || releaseBuild.canonicalJourneyPages || releaseBuild.generatedFiles.length || releaseBuild.replacements.length) throw new Error('Empty release leaked journeys');
  for (const path of ['journeys', 'assets/journeys']) if (await lstat(join(release, path)).catch(() => null)) throw new Error('Empty release leaked journey files');
  for (const path of ['index.html', 'sitemap.xml']) if ((await readFile(join(release, path), 'utf8')).includes('journeys/')) throw new Error('Empty release leaked journey navigation');
  if (ui) {
    await symlink(join(ROOT, 'node_modules'), join(snapshot, 'node_modules'), 'dir');
    await run(['--test', '--test-concurrency=1', 'tests/journeys-ui.test.mjs', 'tests/domain-navigation-ui.test.mjs'], 'native');
  }
  for (const [path, sha] of Object.entries(before)) if (hash(await readFile(join(snapshot, path))) !== sha) throw new Error('Preexisting source changed: ' + path);
  const report = { schemaVersion: 1, result: 'PASS', predecessorCommit: predecessor, snapshot, preview, release, preexistingSourceFilesPreserved: Object.keys(before).length, changes, previewBuild, releaseBuild, checks, scope: 'Local journey reader rehearsal. No new lesson acceptance, real distribution decisions, human observations, private-note migration or other-chat edits.' };
  const path = join(work, 'report.json'); await writeFile(path, json(report)); return { result: 'PASS', report: path, preview, release };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const args = process.argv.slice(2), options = {}; while (args.length) { const flag = args.shift(); if (flag === '--ui') options.ui = true; else if (flag === '--base-url') options.base = args.shift(); else throw new Error('Unknown argument ' + flag); } console.log(json(await rehearseJourneys(options))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
