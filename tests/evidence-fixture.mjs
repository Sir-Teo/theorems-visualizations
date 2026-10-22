// Synthetic review receipts for tests only. Never registered in the real evidence manifest.
import { createHash } from 'node:crypto';
import { evidenceCodeHashes, implementationDigest } from '../scripts/evidence-sidecars.mjs';
import { canonicalEvidence, evidenceContent, legacyEvidenceSnapshot } from '../assets/js/evidence-model.js';
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : canonicalEvidence(value)).digest('hex');
export function fixtureRecord(id = 'pma-4.19') {
  return { schemaVersion: 1, targetId: id, revision: '1.0.0', publication: 'local-only', author: 'test-author', scope: 'Synthetic fixture: no actual source or review approval.', updatedOn: '2026-10-22', targetDigest: '0'.repeat(64),
    sources: [{ id: 'test-source', title: 'Fixture source', creator: 'Test fixture', edition: 'Test edition', locator: 'Test section', boundary: 'No reading occurred.', url: 'https://example.org/source', access: 'body-read', readOn: '2026-10-22', reuse: 'Test data only; not release clearance.' }],
    claims: [{ id: 'test-claim', text: 'Test claim', qualification: 'Not a production claim.', sourceIds: ['test-source'] }], limitations: ['No human or professional evidence.'], reviewRequirements: ['content', 'rights'], reviews: [] };
}
export async function sealFixture(root, record, item, collection) {
  const target = { ...item, evidenceImplementationDigest: await implementationDigest(root, item.file) };
  record.targetDigest = hash(legacyEvidenceSnapshot(target, collection));
  const contentDigest = hash(evidenceContent(record));
  const artifactDigest = hash({ contentDigest, targetDigest: record.targetDigest, codeHashes: await evidenceCodeHashes(root) });
  record.reviews = record.reviewRequirements.map(dimension => ({ dimension, result: 'passed', reviewer: { id: 'test-reviewer', role: 'Synthetic fixture only; no qualification or observed review', independent: true }, reviewedOn: '2026-10-22', summary: 'Test binding only; no actual acceptance.', evidencePath: 'docs/verification/test-evidence.md', revision: record.revision, contentDigest, artifactDigest }));
  return { target, binding: { targetDigest: record.targetDigest, contentDigest, artifactDigest } };
}
