import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadAll, ROOT } from '../scripts/lib.mjs';
import { projectIdeas, selectFrozenIdeas, digest } from '../scripts/static-ideas.mjs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('merged reading roster retains the exact old projection plus 570 frozen author-verified ideas', async () => {
  // This receipt describes the historical merge, not the moving reading roster.
  const manifest = JSON.parse(execFileSync('git', ['show', 'a5c0d50be3dcd37fbb7dcac48ca1676db5f64417:static-pages/accepted.json'], { cwd: ROOT, encoding: 'utf8' }));
  const bytes = await readFile(join(ROOT, manifest.sourceReconciliation.evidencePath));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.sourceReconciliation.evidenceSha256);
  const receipt = JSON.parse(bytes), data = await loadAll();
  assert.equal(receipt.baseCommit, 'facab15e297c645d4826935f2c011a4cf367ee88');
  assert.equal(receipt.sourceCommit, manifest.acceptedCommit);
  assert.equal(receipt.baseIdeas, 7751);
  assert.equal(receipt.addedIdeas, 570);
  assert.equal(receipt.mergedIdeas, 8321);
  const added = new Set(receipt.addedIds);
  assert.equal(added.size, 570);
  const plan = JSON.parse(await readFile(join(ROOT, 'docs/wave-6-plan.json'), 'utf8'));
  const frozen = new Set(plan.chapters.flatMap(c => c.items.map(i => i.id)));
  assert.ok([...added].every(id => frozen.has(id) && manifest.ids.includes(id)));
  const baseIds = manifest.ids.filter(id => !added.has(id));
  assert.equal(baseIds.length, 7751);
  const base = projectIdeas(data, baseIds, manifest.aliases);
  assert.deepEqual(receipt.changedRetainedItems.map(r => [r.id, r.fields]), [['mat-2.4', ['scope']]]);
  for (const change of receipt.changedRetainedItems) {
    const item = base.selected.find(p => p.item.id === change.id).item;
    assert.equal(item.scope, change.after);
    assert.equal(change.before.replaceAll('\\,^\\circ$C', '\\,{}^\\circ\\mathrm{C}$'), change.after);
    item.scope = change.before;
  }
  assert.equal(digest(base), receipt.baseSnapshotDigest);
  assert.equal(selectFrozenIdeas(data, manifest).selected.length, 8321);
});
