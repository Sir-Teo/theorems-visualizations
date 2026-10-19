// Reconcile checkpointed browser reports against the current content, rather
// than adding old pass counts to newer populations. Does not certify visual
// judgment, computational accuracy, sources, or the human sample.
// Usage: node scripts/verification-browser-evidence.mjs report.json ...
//        [--write=docs/verification/browser-evidence.json] [--strict]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadAll, ROOT } from './lib.mjs';
import { externalContentHashes } from './verification-external-imports.mjs';

const args = process.argv.slice(2);
const paths = args.filter(a => !a.startsWith('--')).map(p => resolve(p));
if (!paths.length) throw Error('Supply one or more scripts/check.mjs JSON reports.');
const { items, problems } = await loadAll();
if (problems.some(p => p.level === 'error')) throw Error('Cannot reconcile an incompletely loaded population.');
const population = items.filter(it => typeof it.viz === 'function');
// Keep this fingerprint policy identical to scripts/check.mjs. Reports predating
// fingerprints are context only and can never satisfy current evidence gates.
const hashFiles = files => {
  const hash = createHash('sha256');
  for (const file of files.sort()) { hash.update(file); hash.update(readFileSync(join(ROOT, file))); }
  return hash.digest('hex');
};
const commonHash = hashFiles(['scripts/check.mjs', 'scripts/browser.mjs', 'scripts/serve.mjs', 'tools/harness.html', 'data/atlas.css',
  ...readdirSync(join(ROOT, 'assets/js/viz'), { recursive: true }).filter(f => f.endsWith('.js')).map(f => `assets/js/viz/${f}`),
  ...readdirSync(join(ROOT, 'assets/css'), { recursive: true }).filter(f => f.endsWith('.css')).map(f => `assets/css/${f}`)]);
const fingerprints = Object.fromEntries([...new Set(population.map(it => it.col))].map(col => [col,
  hashFiles(readdirSync(join(ROOT, 'content', col)).filter(f => f.endsWith('.js')).map(f => `content/${col}/${f}`))]));
const externalFingerprints = Object.fromEntries(await Promise.all(Object.keys(fingerprints).map(async col => [col, await externalContentHashes(col)])));
const byId = new Map(population.map(it => [it.id, it]));
const passed = r => ['errs', 'tex', 'blank', 'qual'].every(k => Array.isArray(r[k]) && r[k].length === 0)
  && r.renderer === 'KaTeX 0.16.11';
const accepted = { light: new Map(), dark: new Map() };
const sources = [];
for (const path of paths) {
  const bytes = readFileSync(path), report = JSON.parse(bytes);
  const tally = { accepted: 0, failed: [], stale: [], externalDependenciesMissing: [], externalDependenciesStale: [], missingScreenshots: [], unsupported: [] };
  const supported = report.schemaVersion === 2 && report.commonHash === commonHash && report.modes === true
    && report.verificationConfig?.width === 860 && report.verificationConfig?.still === true
    && report.verificationConfig?.screenshots === true
    && report.verificationConfig?.assets === 'local-katex-stable-cache-v1'
    && report.verificationConfig?.settling === 'fonts-frames-css-transitions-v1' && accepted[report.theme];
  for (const r of report.results || []) {
    const it = byId.get(r.id);
    if (!it) continue;
    if (!supported) { tally.unsupported.push(r.id); continue; }
    if (r.contentHash !== fingerprints[it.col]) { tally.stale.push(r.id); continue; }
    const external = externalFingerprints[it.col];
    if (Object.keys(external).length) {
      const guard = report.externalImportGuard;
      if (guard?.policy !== 'literal-content-import-closure-v1' || !r.externalContentHashes) {
        tally.externalDependenciesMissing.push(r.id); continue;
      }
      if (guard.stable !== true || JSON.stringify(guard.before) !== JSON.stringify(guard.after)
        || JSON.stringify(r.externalContentHashes) !== JSON.stringify(external)
        || JSON.stringify(guard.before) !== JSON.stringify(external)) {
        tally.externalDependenciesStale.push(r.id); continue;
      }
    }
    if (!passed(r) || !Number.isInteger(r.modeStates) || r.modeStates < 0) { tally.failed.push(r.id); continue; }
    const suffix = report.theme === 'dark' ? '.dark' : '';
    const shots = [join(ROOT, 'shots', `${r.id}${suffix}.png`),
      ...Array.from({ length: r.modeStates }, (_, k) => join(ROOT, 'shots', `${r.id}~${k + 1}${suffix}.png`))];
    if (!shots.every(existsSync)) { tally.missingScreenshots.push(r.id); continue; }
    accepted[report.theme].set(r.id, r.modeStates);
    tally.accepted++;
  }
  sources.push({ path, sha256: createHash('sha256').update(bytes).digest('hex'), theme: report.theme,
    complete: report.complete === true, totalReported: report.summary?.total ?? null, ...tally });
}
const themes = Object.fromEntries(Object.entries(accepted).map(([theme, map]) => [theme, {
  passingItems: map.size, alternateStates: [...map.values()].reduce((a, b) => a + b, 0),
  missing: population.filter(it => !map.has(it.id)).map(it => it.id),
}]));
const result = { schemaVersion: 1,
  meaning: 'Current-input default and visible default-state segmented/toggle alternatives, exercised individually. Focused native checks cover additional conditional controls. A passing report requires actual KaTeX, no runtime/TeX/blank/quality errors, matching collection/runtime fingerprints, guarded hashes for cross-collection content imports, the standard viewport/still setting, and existing default/alternate PNGs. Reports can be partial; duplicate IDs count once. Historical reports without fingerprints cannot certify current code.',
  population: population.length, commonHash, fingerprints, externalFingerprints,
  gates: { lightModes: themes.light.missing.length === 0, darkModes: themes.dark.missing.length === 0 },
  themes, sources };
const output = args.find(a => a.startsWith('--write='))?.slice('--write='.length);
if (output) writeFileSync(resolve(output), JSON.stringify(result, null, 2) + '\n');
for (const [theme, summary] of Object.entries(themes)) console.log(`${theme}: ${summary.passingItems}/${population.length} current passing items, ${summary.alternateStates} alternate states, ${summary.missing.length} missing`);
if (args.includes('--strict') && Object.values(result.gates).some(v => !v)) process.exitCode = 1;
