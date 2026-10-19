// Reconcile the bounded source inventory of conditional controls with actual
// branch-aware browser captures. This does not claim Cartesian-product coverage.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadAll, ROOT } from './lib.mjs';
import { externalContentHashes } from './verification-external-imports.mjs';

const args = process.argv.slice(2), paths = args.filter(arg => !arg.startsWith('--')).map(path => resolve(path));
if (!paths.length) throw Error('Supply conditional-control browser reports.');
const hashFiles = files => {
  const hash = createHash('sha256');
  for (const file of [...files].sort()) { hash.update(file); hash.update(readFileSync(join(ROOT, file))); }
  return hash.digest('hex');
};
const inventoryFile = 'docs/verification/conditional-control-inventory.json';
const runnerFile = 'tests/verification-conditional-modes-browser.mjs';
const inventory = JSON.parse(readFileSync(join(ROOT, inventoryFile), 'utf8'));
const inventoryHash = hashFiles([inventoryFile]), runnerHash = hashFiles([runnerFile]);
// Keep this policy identical to the supplemental runner's commonFiles list.
const runtimeHash = hashFiles(['scripts/check.mjs', 'scripts/browser.mjs', 'scripts/serve.mjs',
  'scripts/verification-external-imports.mjs', runnerFile, inventoryFile, 'tools/harness.html', 'data/atlas.css',
  ...readdirSync(join(ROOT, 'assets/js/viz'), { recursive: true }).filter(file => file.endsWith('.js')).map(file => `assets/js/viz/${file}`),
  ...readdirSync(join(ROOT, 'assets/css'), { recursive: true }).filter(file => file.endsWith('.css')).map(file => `assets/css/${file}`)]);
const { items, problems } = await loadAll();
if (problems.some(problem => problem.level === 'error')) throw Error('Cannot reconcile incomplete content.');
const written = new Map(items.filter(item => typeof item.viz === 'function').map(item => [item.id, item]));
const candidates = new Map(inventory.items.map(item => [item.id, item]));
if (candidates.size !== inventory.items.length || [...candidates.keys()].some(id => !written.has(id))) {
  throw Error('Conditional inventory has duplicate or unwritten visualization IDs.');
}
const expectedInputs = new Map();
for (const id of candidates.keys()) {
  const col = written.get(id).col;
  if (expectedInputs.has(col)) continue;
  expectedInputs.set(col, {
    contentHash: hashFiles(readdirSync(join(ROOT, 'content', col)).filter(file => file.endsWith('.js')).map(file => `content/${col}/${file}`)),
    externalContentHashes: externalContentHashes(col), runtimeHash,
  });
}
const accepted = { light: new Map(), dark: new Map() }, sources = [];
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const path of paths) {
  const bytes = readFileSync(path), report = JSON.parse(bytes);
  const tally = { accepted: 0, failed: [], stale: [], unsupported: [], missingScreenshots: [] };
  for (const row of report.results || []) {
    if (!candidates.has(row.id)) continue;
    if (report.schemaVersion !== 1 || report.inventoryHash !== inventoryHash || report.runnerHash !== runnerHash
      || !accepted[row.theme] || !['both', row.theme].includes(report.theme)
      || report.scope?.assets !== 'pinned local KaTeX 0.16.11') {
      tally.unsupported.push(row.id); continue;
    }
    const expected = expectedInputs.get(written.get(row.id).col);
    if (!equal(row.before, expected) || !equal(row.after, expected)) { tally.stale.push(row.id); continue; }
    const cleanState = state => ['errors', 'tex', 'blank', 'pageErrors'].every(key => Array.isArray(state[key]) && state[key].length === 0)
      && Array.isArray(state.consoleErrors) && state.consoleErrors.every(message => /favicon|Failed to load resource/.test(message))
      && state.katexErrors === 0;
    const countsMatch = Array.isArray(row.states) && row.counts
      && row.counts.rootVisibleStates === row.states.filter(state => state.phase !== 'restore' && !state.conditional).length
      && row.counts.newConditionalStates === row.states.filter(state => state.phase !== 'restore' && state.conditional).length
      && row.counts.restorationStates === row.states.filter(state => state.phase === 'restore').length;
    if (row.status !== 'passed' || row.renderer !== 'KaTeX 0.16.11' || !Array.isArray(row.unresolvedControls)
      || row.unresolvedControls.length || !Array.isArray(row.states) || !row.states.length || !row.states.every(cleanState)
      || !row.states.some(state => state.phase === 'default') || !countsMatch) {
      tally.failed.push(row.id); continue;
    }
    const required = row.states.filter(state => state.conditional || state.phase === 'default');
    if (!required.length || required.some(state => !state.screenshot || !existsSync(state.screenshot))) {
      tally.missingScreenshots.push(row.id); continue;
    }
    accepted[row.theme].set(row.id, {
      rootVisibleStates: row.counts.rootVisibleStates, newConditionalStates: row.counts.newConditionalStates,
      restorationStates: row.counts.restorationStates, screenshots: required.length,
    });
    tally.accepted++;
  }
  sources.push({ path, sha256: createHash('sha256').update(bytes).digest('hex'), complete: report.complete === true, ...tally });
}
const themes = Object.fromEntries(Object.entries(accepted).map(([theme, rows]) => [theme, {
  passingItems: rows.size,
  rootVisibleStates: [...rows.values()].reduce((sum, row) => sum + row.rootVisibleStates, 0),
  newConditionalStates: [...rows.values()].reduce((sum, row) => sum + row.newConditionalStates, 0),
  restorationStates: [...rows.values()].reduce((sum, row) => sum + row.restorationStates, 0),
  screenshots: [...rows.values()].reduce((sum, row) => sum + row.screenshots, 0),
  missing: [...candidates.keys()].filter(id => !rows.has(id)),
}]));
const result = {
  schemaVersion: 1,
  meaning: 'Current-input supplemental evidence for the source-discovered conditional-control inventory. Individual default-visible alternatives and recursively revealed/signature-changed controls are exercised, with listed bounded non-mode triggers. Independent sibling Cartesian products and unrestricted text/range/pointer inputs are excluded. Unreachable hidden controls and failed, stale or missing captures cannot pass. This does not establish sources, subjective picture quality or human review.',
  inventory: { path: inventoryFile, hash: inventoryHash, candidates: candidates.size }, runnerHash, runtimeHash,
  gates: { lightConditionalControls: themes.light.missing.length === 0, darkConditionalControls: themes.dark.missing.length === 0 },
  themes, sources,
};
const output = args.find(arg => arg.startsWith('--write='))?.slice('--write='.length);
if (output) writeFileSync(resolve(output), JSON.stringify(result, null, 2) + '\n');
for (const [theme, tally] of Object.entries(themes)) console.log(`${theme}: ${tally.passingItems}/${candidates.size} conditional-inventory items, ${tally.newConditionalStates} new conditional states, ${tally.missing.length} missing`);
if (args.includes('--strict') && Object.values(result.gates).some(gate => !gate)) process.exitCode = 1;
