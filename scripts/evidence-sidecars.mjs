import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { canonicalEvidence, evidenceContent, legacyEvidenceSnapshot, LEGACY_EVIDENCE_ID, EVIDENCE_MAX_CHARS, validateEvidenceRecord } from '../assets/js/evidence-model.js';
const digest = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : canonicalEvidence(value)).digest('hex');
export const EVIDENCE_CODE = ['assets/js/evidence-model.js', 'assets/js/evidence-view.js', 'assets/css/evidence.css', 'assets/css/style.css', 'assets/js/app.js', 'assets/js/viz/core.js', 'assets/js/share-state.js', 'scripts/evidence-sidecars.mjs', 'scripts/evidence-module-digest.mjs', 'scripts/build.mjs'];
export async function evidenceCodeHashes(root) {
  const paths = new Set(EVIDENCE_CODE);
  async function visit(path) {
    for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
      const child = path + '/' + entry.name;
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile()) paths.add(child);
      else throw new Error('Special files are not supported in the reviewed runtime: ' + child);
    }
  }
  await visit('assets');
  return Object.fromEntries(await Promise.all([...paths].sort().map(async p => [p, digest(await readFile(join(root, p)))])));
}
export async function implementationDigest(root, entry) {
  // Node's parser supplies static import/re-export specifiers without evaluating authored code.
  return execFileSync(process.execPath, ['--experimental-vm-modules', fileURLToPath(new URL('./evidence-module-digest.mjs', import.meta.url)), root, entry], { encoding: 'utf8', env: { ...process.env, NODE_NO_WARNINGS: '1' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
export async function prepareEvidenceSidecars({ root, items, collections }) {
  const manifest = JSON.parse(await readFile(join(root, 'evidence/manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) throw new Error('Invalid evidence manifest');
  const entries = manifest.entries, ids = new Set(), files = new Set();
  for (const e of entries) {
    if (!e || !LEGACY_EVIDENCE_ID.test(e.targetId) || !/^[a-z][a-z0-9-]*\.json$/.test(e.file || '') || ids.has(e.targetId) || files.has(e.file)) throw new Error('Unsafe or duplicate evidence entry');
    ids.add(e.targetId); files.add(e.file);
  }
  const codeHashes = await evidenceCodeHashes(root);
  const byId = new Map(items.map(x => [x.id, x])), byCollection = new Map(collections.map(x => [x.id, x]));
  const catalog = { schemaVersion: 1, entries: [] }, outputs = new Map(), bindings = [], targetImplementations = new Map();
  for (const entry of entries) {
    const item = byId.get(entry.targetId), collection = byCollection.get(item?.col);
    if (!item || !collection) throw new Error('Evidence must target a canonical written idea: ' + entry.targetId);
    const record = JSON.parse(await readFile(join(root, 'evidence', entry.file), 'utf8'));
    if (record.targetId !== entry.targetId) throw new Error('Evidence target/manifest mismatch');
    const sourceDigest = await implementationDigest(root, item.file);
    const targetDigest = digest(legacyEvidenceSnapshot({ ...item, evidenceImplementationDigest: sourceDigest }, collection));
    const contentDigest = digest(evidenceContent(record));
    const artifactDigest = digest({ contentDigest, targetDigest, codeHashes });
    const errors = validateEvidenceRecord(record, { targetDigest, contentDigest, artifactDigest });
    if (errors.length) throw new Error(entry.targetId + ': ' + errors.join('; '));
    bindings.push({ targetId: entry.targetId, targetDigest, contentDigest, artifactDigest, publication: record.publication });
    if (record.publication === 'local-only') continue;
    targetImplementations.set(record.targetId, sourceDigest);
    if (record.publication === 'public') for (const review of record.reviews) {
      const report = (await readFile(join(root, review.evidencePath), 'utf8')).toLowerCase();
      const required = [record.targetId, review.revision, review.reviewer.id, review.dimension, review.contentDigest, review.artifactDigest];
      if (!required.every(value => report.includes(value.toLowerCase()))) throw new Error('Review report does not bind this exact receipt: ' + review.evidencePath);
    }
    // Withdrawal is a minimal identity-reserving notice; old sources and claims are not exported.
    const payload = record.publication === 'withdrawn'
      ? { schemaVersion: 1, targetId: record.targetId, revision: record.revision, publication: 'withdrawn', withdrawal: { reason: record.withdrawal.reason, withdrawnOn: record.withdrawal.withdrawnOn } }
      : { record, binding: { targetDigest, contentDigest, artifactDigest } };
    const bytes = JSON.stringify(payload), path = 'evidence/' + record.targetId + '.json';
    if (bytes.length > EVIDENCE_MAX_CHARS) throw new Error('Evidence payload exceeds browser size limit: ' + record.targetId);
    outputs.set(path, bytes);
    catalog.entries.push({ targetId: record.targetId, path, sha256: digest(bytes), targetDigest, publication: record.publication });
  }
  catalog.entries.sort((a, b) => a.targetId.localeCompare(b.targetId));
  const catalogBytes = JSON.stringify(catalog);
  if (catalogBytes.length > EVIDENCE_MAX_CHARS) throw new Error('Evidence catalog exceeds browser size limit');
  outputs.set('evidence.json', catalogBytes);
  return { outputs, bindings, targetImplementations, publicRecords: catalog.entries.filter(x => x.publication === 'public').length };
}
