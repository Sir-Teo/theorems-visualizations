// Inspect pinned commits and build only disposable local outputs. No checkout overlay.
import { readFile, writeFile, mkdir, mkdtemp, readdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'facab15e297c645d4826935f2c011a4cf367ee88';
const SOURCE = 'e61efc420e24427b44dc2e9cd02d958a1e702194';
const hash = x => createHash('sha256').update(x).digest('hex');
const json = x => JSON.stringify(x, null, 2) + '\n';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const assert = (x, message) => { if (!x) throw new Error(message); };
const safePath = p => typeof p === 'string' && p.length && !/[\\\x00-\x1f]/.test(p) && !p.startsWith('/') && p.split('/').every(x => x && x !== '.' && x !== '..' && x !== '.git');
const digest = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);

export function validateCandidateInventory(m, base, source) {
  assert(m.schemaVersion === 1 && m.mode === 'complete-universal-local-candidate', 'Unknown candidate contract');
  assert(/^[a-f0-9]{40}$/.test(m.acceptedBaseCommit) && /^[a-f0-9]{40}$/.test(m.sourceCommit), 'Use exact commit identities');
  for (const inventory of [base, source]) for (const [path, sha] of Object.entries(inventory)) assert(safePath(path) && digest(sha), 'Invalid inventory entry');
  assert(Object.keys(base).every(p => Object.hasOwn(source, p)), 'Source removes accepted-base files');
  const expected = Object.keys(source).sort().filter(p => base[p] !== source[p]).map(path => ({
    path, action: !Object.hasOwn(base, path) ? 'add' : path === 'MASTER_PLAN.md' ? 'manual-reconciliation' : 'replace',
    baseSha256: base[path] ?? null, sourceSha256: source[path],
  }));
  assert(Array.isArray(m.files) && same(m.files, expected), 'Inventory differs from complete commit delta');
  assert(expected.filter(f => f.action === 'replace').every(f => ['assets/js/app.js', 'scripts/build.mjs'].includes(f.path)), 'Undeclared production replacement');
  const counts = { baseFiles: Object.keys(base).length, sourceFiles: Object.keys(source).length,
    additions: expected.filter(f => f.action === 'add').length, replacements: expected.filter(f => f.action === 'replace').length,
    manualReconciliations: expected.filter(f => f.action === 'manual-reconciliation').length };
  assert(same(m.counts, counts), 'Candidate counts differ');
  const packages = Object.keys(source).filter(p => /^docs\/integration\/[^/]+\.json$/.test(p)).sort().map(path => ({ path, sha256: source[path] }));
  assert(same(m.packages, packages), 'Package references differ');
  return counts;
}

async function inventory(root, prefix = '') {
  const result = {};
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) Object.assign(result, await inventory(root, path));
    else { assert(entry.isFile(), 'Non-regular archived entry: ' + path); result[path] = hash(await readFile(join(root, path))); }
  }
  return result;
}

export async function checkCandidateHtmlLinks(output, canonicalBase) {
  const files = await inventory(output), base = new URL(canonicalBase);
  let pages = 0, links = 0;
  for (const path of Object.keys(files).filter(p => p.endsWith('.html'))) {
    pages++;
    const html = await readFile(join(output, path), 'utf8');
    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
      const value = match[1].replaceAll('&amp;', '&');
      if (value.startsWith('#')) continue;
      const url = new URL(value, new URL(path, base));
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin) continue;
      assert(url.pathname.startsWith(base.pathname), 'Local link escapes canonical prefix: ' + path + ' → ' + value);
      let target = decodeURIComponent(url.pathname.slice(base.pathname.length));
      if (!target || target.endsWith('/')) target += 'index.html';
      assert(Object.hasOwn(files, target), 'Missing candidate HTML target: ' + path + ' → ' + target);
      links++;
    }
  }
  return { pages, localTargets: links, scope: 'Quoted HTML href/src file targets; fragments, CSS/JS imports and external freshness are not checked.' };
}

export async function rehearseMasterPlanCandidate() {
  const manifestPath = join(ROOT, 'docs/integration/master-plan-candidate.json');
  const manifestBytes = await readFile(manifestPath), m = JSON.parse(manifestBytes);
  assert(m.acceptedBaseCommit === BASE && m.sourceCommit === SOURCE, 'This checker pins the reviewed candidate inventory checkpoint');
  execFileSync('git', ['merge-base', '--is-ancestor', BASE, SOURCE], { cwd: ROOT });
  const work = await mkdtemp(join(tmpdir(), 'atlas-master-candidate-')), directories = {};
  for (const [kind, commit] of [['base', BASE], ['source', SOURCE]]) {
    const tree = execFileSync('git', ['ls-tree', '-r', '-z', commit], { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    for (const row of tree.split('\0').filter(Boolean)) {
      const tab = row.indexOf('\t');
      assert(row.slice(0, tab).startsWith('100644 blob ') && safePath(row.slice(tab + 1)), 'Unexpected Git tree mode/path');
    }
    const target = join(work, kind), tar = join(work, kind + '.tar'); await mkdir(target);
    execFileSync('git', ['archive', '--format=tar', '--output', tar, commit], { cwd: ROOT });
    execFileSync('tar', ['-xf', tar, '-C', target]); directories[kind] = target;
  }
  const before = await inventory(directories.source), base = await inventory(directories.base);
  const counts = validateCandidateInventory(m, base, before), checks = [];
  async function run(args, label) {
    const log = join(work, label + '.log');
    try {
      const output = execFileSync(process.execPath, args, { cwd: directories.source, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      await writeFile(log, output); checks.push({ args, result: 'PASS', log, sha256: hash(output) });
    } catch (e) { await writeFile(log, String(e.stdout || '') + String(e.stderr || '')); throw new Error('Candidate check failed; inspect ' + log); }
  }
  for (const [label, args] of [
    ['coverage', ['scripts/validate-coverage.mjs']], ['pilots', ['scripts/build-explorations.mjs', '--check']],
    ['overviews', ['scripts/build-domain-overviews.mjs', '--check']], ['dashboard', ['scripts/build-coverage-dashboard.mjs']],
    ['legacy-build', ['scripts/build.mjs', '--strict']], ['legacy-static', ['scripts/check.mjs', '--static', '--quiet']],
  ]) await run(args, label);
  const tests = m.files.map(f => f.path).filter(p => p.startsWith('tests/') && p.endsWith('.test.mjs') && !p.endsWith('-ui.test.mjs') && p !== 'tests/explorations-ui.test.mjs');
  assert(tests.length === 15, 'Unexpected composed offline test scope');
  await run(['--test', '--test-concurrency=1', ...tests], 'offline');
  const outputs = {}, links = {}, builds = {};
  for (const mode of ['preview', 'release']) {
    outputs[mode] = join(work, mode);
    const baseUrl = 'https://example.org/project/';
    await run(['scripts/build-journeys.mjs', '--out', outputs[mode], '--mode', mode, ...(mode === 'release' ? ['--base-url', baseUrl] : [])], mode);
    builds[mode] = {};
    for (const stage of ['static', 'edition', 'navigation', 'journey']) builds[mode][stage] = JSON.parse(await readFile(join(outputs[mode], stage + '-build.json'), 'utf8'));
    links[mode] = await checkCandidateHtmlLinks(outputs[mode], mode === 'release' ? baseUrl : 'https://candidate.invalid/');
  }
  assert(builds.preview.static.items === 7751 && builds.release.static.items === 7751, 'Legacy roster changed');
  assert(builds.preview.edition.currentExplorations === 4 && builds.preview.edition.retainedEditions === 4 && builds.release.edition.currentExplorations === 0 && builds.release.edition.retainedEditions === 0, 'Edition candidate scope changed');
  assert(builds.preview.navigation.liveOrientations === 30 && builds.release.navigation.liveOrientations === 0 && builds.release.navigation.retainedOrientations === 0, 'Domain candidate scope changed');
  assert(builds.preview.journey.availableJourneys === 3 && builds.release.journey.availableJourneys === 0, 'Journey candidate scope changed');
  for (const path of ['editions/releases.json', 'navigation/releases.json', 'journeys/releases.json']) {
    const ledger = JSON.parse(await readFile(join(directories.source, path), 'utf8')); assert(ledger.events.length === 0, 'Real release decisions changed');
  }
  const releaseFiles = await inventory(outputs.release);
  assert(!Object.keys(releaseFiles).some(p => p.startsWith('domains/') || p.startsWith('journeys/')), 'Empty release exposes domain or journey candidates');
  assert(!Object.keys(releaseFiles).some(p => /^explore\/x-/.test(p)), 'Empty release exposes exploration editions');
  for (const [path, sha] of Object.entries(before)) assert(hash(await readFile(join(directories.source, path))) === sha, 'Committed source changed during build: ' + path);
  const report = { schemaVersion: 1, result: 'PASS', acceptedBaseCommit: BASE, sourceCommit: SOURCE,
    manifestSha256: hash(manifestBytes), checkerSha256: hash(await readFile(fileURLToPath(import.meta.url))),
    counts, unchangedAcceptedBaseFiles: counts.baseFiles - counts.replacements - counts.manualReconciliations,
    preservedSourceFiles: Object.keys(before).length, packageManifests: m.packages.length, directories, outputs, checks, links, builds,
    scope: 'Author rehearsal of the pinned complete candidate. No independent final engineering approval, new acceptance, professional/human evidence, real release, deployment or other-checkout writes.' };
  const path = join(work, 'report.json'); await writeFile(path, json(report));
  return { result: 'PASS', report: path, counts, outputs, links };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { assert(process.argv.length === 2, 'This pinned candidate checker takes no arguments'); console.log(json(await rehearseMasterPlanCandidate())); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
