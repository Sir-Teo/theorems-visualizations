// Reconcile agent screenshot inspection with exact current PNG bytes.
// Usage: node scripts/verification-conditional-visual-evidence.mjs ledger.json ...
//   [--light=docs/verification/conditional-modes-light.json] [--dark=...]
//   [--write=docs/verification/conditional-visual-evidence.json] [--strict]
// Native current-input coverage is gated separately by conditional-evidence.mjs.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const themes = ['light', 'dark'];
const rowKeys = ['items', 'entries', 'rows', 'themes', 'refreshRows', 'refreshedRows', 'refreshEntries', 'refreshedEntries'];
const imageKeys = ['states', 'screenshots', 'inspectedPngs', 'images'];
const stateKey = image => `${image.id}|${image.theme}|${image.index}`;
const notInspected = node => node.inspected === false || node.reviewed === false
  || /^(pending|unreviewed|not[_ -]inspected|not[_ -]reviewed)$/i.test(node.status || '');

/** Normalize the four review-ledger shapes and appended refreshRows. Findings,
 * contact-sheet digests and summary counts never create inspection credit. */
export function normalizeInspectionLedger(report, { path = '<ledger>' } = {}) {
  const images = [], invalid = [];
  function walk(node, inherited = {}) {
    if (Array.isArray(node)) { for (const child of node) walk(child, inherited); return; }
    if (!node || typeof node !== 'object' || notInspected(node)) return;
    const context = {
      ...inherited,
      ...(typeof node.id === 'string' ? { id: node.id } : {}),
      ...(typeof node.theme === 'string' ? { theme: node.theme } : {}),
      ...(typeof node.contentHash === 'string' ? { contentHash: node.contentHash } : {}),
    };
    for (const key of imageKeys) for (const image of Array.isArray(node[key]) ? node[key] : []) {
      if (!image || typeof image !== 'object' || notInspected(image)) continue;
      const screenshot = [image.screenshot, image.png, image.path].find(value => typeof value === 'string');
      // An uncaptured state is not an inspection claim.
      if (!screenshot) continue;
      const claim = {
        ...context, id: image.id ?? context.id, theme: image.theme ?? context.theme,
        index: image.index ?? image.stateIndex ?? image.state ?? null,
        screenshot, sha256: typeof image.sha256 === 'string' ? image.sha256.toLowerCase() : null, ledger: path,
        reviewer: report.reviewer ?? null,
      };
      if (!claim.id || !themes.includes(claim.theme) || !/^[a-f0-9]{64}$/.test(claim.sha256 || '')) {
        invalid.push({ ledger: path, id: claim.id ?? null, theme: claim.theme ?? null, screenshot,
          reason: 'An image inspection claim needs an item ID, light/dark theme and PNG SHA256.' });
      } else images.push(claim);
    }
    for (const key of rowKeys) if (Array.isArray(node[key])) walk(node[key], context);
  }
  walk(report);
  if (!rowKeys.some(key => Array.isArray(report?.[key]))) {
    invalid.push({ ledger: path, reason: 'No recognized inspection-row array.' });
  }
  return { images, invalid };
}

/** This grants only image-inspection credit. Collection/source hashes in review
 * ledgers are provenance; exact PNG identity is the criterion for image reuse. */
export function conditionalVisualEvidence({ captures, ledgers, expectedIds, root = ROOT }) {
  const expected = new Set(expectedIds), claims = [], invalidClaims = [], sources = [];
  for (const source of ledgers) {
    const normalized = normalizeInspectionLedger(source.report, { path: source.path });
    claims.push(...normalized.images); invalidClaims.push(...normalized.invalid);
    sources.push({ path: source.path, kind: 'inspection-ledger', sha256: source.sha256 ?? null,
      reviewer: source.report.reviewer ?? null, imageClaims: normalized.images.length,
      invalidClaims: normalized.invalid.length });
  }
  const byHash = new Map(), byState = new Map();
  for (const claim of claims) {
    for (const [map, key] of [[byHash, claim.sha256], [byState, stateKey(claim)]]) {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(claim);
    }
  }
  const imageCache = new Map(), seenRows = new Set(), required = [], captureIssues = [];
  const missingImages = [], missingInspections = [], mismatchedImages = [];
  const hashImage = screenshot => {
    const path = resolve(root, screenshot);
    if (!imageCache.has(path)) {
      try { imageCache.set(path, { sha256: sha256(readFileSync(path)) }); }
      catch (error) { imageCache.set(path, { error: error.code || error.message }); }
    }
    return imageCache.get(path);
  };
  for (const source of captures) {
    const report = source.report;
    sources.push({ path: source.path, kind: 'conditional-capture', sha256: source.sha256 ?? null,
      complete: report.complete === true });
    if (report.complete !== true || report.schemaVersion !== 1 || !Array.isArray(report.results)) {
      captureIssues.push({ path: source.path, reason: 'Capture report is incomplete or unsupported.' });
    }
    for (const row of Array.isArray(report.results) ? report.results : []) {
      if (!expected.has(row.id) || !themes.includes(row.theme)) {
        captureIssues.push({ path: source.path, id: row.id, theme: row.theme, reason: 'Unknown item or theme.' }); continue;
      }
      const key = `${row.id}|${row.theme}`;
      if (seenRows.has(key)) { captureIssues.push({ id: row.id, theme: row.theme, reason: 'Duplicate current capture row.' }); continue; }
      seenRows.add(key);
      if (row.status !== 'passed' || !Array.isArray(row.unresolvedControls) || row.unresolvedControls.length
        || !Array.isArray(row.states) || !row.states.some(state => state.phase === 'default')) {
        captureIssues.push({ id: row.id, theme: row.theme, reason: 'Capture row failed, is unresolved, or has no default state.' });
      }
      const indices = new Set();
      for (const state of Array.isArray(row.states) ? row.states : []) {
        if (state.phase !== 'default' && state.conditional !== true) continue;
        const image = { id: row.id, theme: row.theme, index: state.index, phase: state.phase,
          conditional: state.conditional === true, screenshot: state.screenshot ?? null,
          captureReport: source.path, contentHash: row.before?.contentHash ?? null, reviewed: false };
        if (!Number.isInteger(state.index) || indices.has(state.index)) {
          captureIssues.push({ id: row.id, theme: row.theme, index: state.index, reason: 'Invalid or duplicate screenshot-state index.' });
        }
        indices.add(state.index); required.push(image);
        if (typeof state.screenshot !== 'string' || !state.screenshot) {
          missingImages.push({ ...image, reason: 'Required state has no screenshot path.' }); continue;
        }
        const current = hashImage(state.screenshot);
        if (current.error) { missingImages.push({ ...image, reason: current.error }); continue; }
        image.sha256 = current.sha256;
        const matches = byHash.get(current.sha256) || [];
        if (matches.length) {
          image.reviewed = true;
          image.inspections = matches.map(({ ledger, reviewer, id, theme, index, contentHash }) => ({ ledger, reviewer, id, theme, index, contentHash }));
        } else {
          const previous = byState.get(stateKey(image)) || [];
          if (previous.length) mismatchedImages.push({ ...image,
            inspectedHashes: [...new Set(previous.map(claim => claim.sha256))],
            reason: 'Current PNG bytes differ from the images recorded as inspected for this state.' });
          else missingInspections.push({ ...image, reason: 'No recorded inspection matches these current PNG bytes.' });
        }
      }
    }
  }
  const missingItemThemes = [];
  for (const id of expected) for (const theme of themes) if (!seenRows.has(`${id}|${theme}`)) missingItemThemes.push({ id, theme });
  const summarize = rows => ({
    requiredReferences: rows.length, currentUniqueImages: new Set(rows.map(row => row.sha256).filter(Boolean)).size,
    reviewedReferences: rows.filter(row => row.reviewed).length,
    reviewedUniqueImages: new Set(rows.filter(row => row.reviewed).map(row => row.sha256)).size,
    unreviewedReferences: rows.filter(row => !row.reviewed).length,
  });
  const perTheme = Object.fromEntries(themes.map(theme => [theme, summarize(required.filter(row => row.theme === theme))]));
  return {
    schemaVersion: 1,
    meaning: 'Agent inspection of exact current default/conditional PNG bytes, including conditional restorations. Unchanged image bytes retain image-inspection credit across collection/source-hash changes. This does not transfer semantic, mathematical, source, computational or human-review credit, certify defect resolution, or replace the current-input native-coverage census. Independent sibling combinations and uncaptured states are excluded.',
    credit: { agentImageInspection: true, semantic: false, mathematical: false, source: false, computational: false, human: false },
    expectedItems: expected.size, summary: summarize(required), themes: perTheme,
    gates: {
      completeCapturePopulation: captureIssues.length === 0 && missingItemThemes.length === 0,
      validInspectionClaims: invalidClaims.length === 0,
      lightVisualImages: perTheme.light.requiredReferences > 0 && perTheme.light.unreviewedReferences === 0,
      darkVisualImages: perTheme.dark.requiredReferences > 0 && perTheme.dark.unreviewedReferences === 0,
    },
    missingItemThemes, captureIssues, invalidClaims, missingImages, missingInspections, mismatchedImages,
    reviewedImages: required.filter(image => image.reviewed), sources,
  };
}

function main() {
  const args = process.argv.slice(2), paths = args.filter(arg => !arg.startsWith('--'));
  if (!paths.length) throw Error('Supply agent conditional-visual inspection ledgers.');
  const value = (key, fallback) => args.find(arg => arg.startsWith(key + '='))?.slice(key.length + 1) ?? fallback;
  const read = path => { const absolute = resolve(path), bytes = readFileSync(absolute); return { path: absolute, sha256: sha256(bytes), report: JSON.parse(bytes) }; };
  const captures = themes.map(theme => read(value(`--${theme}`, `docs/verification/conditional-modes-${theme}.json`)));
  const inventory = JSON.parse(readFileSync(resolve(ROOT, 'docs/verification/conditional-control-inventory.json')));
  const result = conditionalVisualEvidence({ captures, ledgers: paths.map(read), expectedIds: inventory.items.map(item => item.id) });
  const output = value('--write', null);
  if (output) writeFileSync(resolve(output), JSON.stringify(result, null, 2) + '\n');
  for (const [theme, counts] of Object.entries(result.themes)) console.log(`${theme}: ${counts.reviewedReferences}/${counts.requiredReferences} current PNG references inspected, ${counts.reviewedUniqueImages}/${counts.currentUniqueImages} unique images`);
  console.log(`${result.missingImages.length} missing PNGs, ${result.mismatchedImages.length} changed images, ${result.missingInspections.length} missing inspections, ${result.captureIssues.length + result.missingItemThemes.length} capture-population issues`);
  if (args.includes('--strict') && Object.values(result.gates).some(gate => !gate)) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
