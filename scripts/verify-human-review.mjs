// Validate a human export without converting automated checks into human passes.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './lib.mjs';
import { createManifest } from './review-sample.mjs';
import { validateRecords, reviewSummary } from '../tools/review-state.js';

const manifest = JSON.parse(await readFile(join(ROOT, 'docs/verification/human-review-sample.json'), 'utf8'));
const current = await createManifest();
if (manifest.fingerprint !== current.fingerprint) {
  console.error('Review sample is stale. Run npm run review:prepare; changed sources require another human review.');
  process.exitCode = 1;
} else {
  const file = process.argv[2];
  const data = file ? JSON.parse(await readFile(file, 'utf8')) : { version: 1, records: [] };
  if (data.version !== 1) throw new Error('Unsupported review export version');
  const { accepted, rejected } = validateRecords(manifest, data.records);
  const summary = reviewSummary(manifest, accepted);
  for (const type of ['visual', 'audio']) {
    const s = summary[type]; console.log(`${type}: ${s.passed}/${s.total} human passes, ${s.issues} issues, ${s.pending} pending`);
  }
  console.log(`${rejected.length} stale or invalid records`);
  const passed = !rejected.length && Object.values(summary).every(s => s.complete);
  console.log(passed ? 'PASS human-review checks for the current sources. Other wave gates remain separate.' : 'OPEN human-review gate. No human completion is claimed.');
  if (!passed) process.exitCode = 1;
}
