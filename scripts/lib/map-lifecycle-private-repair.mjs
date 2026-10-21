// Explicit-only source proposal. Existing runtime/static runners do not import this helper.
// Inputs are reconstructed completely except the three exact declared source snippets.
import assert from 'node:assert/strict';
export const PRIVATE_LIFECYCLE_REPAIRS = Object.freeze({
 scene: Object.freeze([
  Object.freeze(["this.worker.onerror = () => { this.fallback('geometry worker failed'); if (!this.dead) map.draw(); };", "this.worker.onerror = () => { if (this.dead || generation !== this.generation) return; this.fallback('geometry worker failed'); this.map.draw(); };"]),
  Object.freeze(["this.geometry(kind, scale).catch(error => { this.failed.add(key); this.fallback(error.message); });", "const generation = this.generation; this.geometry(kind, scale).catch(error => { if (this.dead || generation !== this.generation) return; this.failed.add(key); this.fallback(error.message); });"])
 ]),
 chunk: Object.freeze([
  Object.freeze(['g.buffer&&d.coverage===g.coverage', 'g.buffer&&this.budget.entries.has(g)&&d.coverage===g.coverage'])
 ])
});
function apply(source, replacements) {
 let result = source;
 for (const [before, after] of replacements) {
  assert.equal(result.split(before).length, 2, 'private repair requires exactly one original snippet');
  assert.equal(result.includes(after), false, 'private repair is not already applied');
  result = result.replace(before, () => after);
 }
 let reconstructed = result;
 for (const [before, after] of [...replacements].reverse()) {
  assert.equal(reconstructed.split(after).length, 2, 'private repair output snippet is unique');
  reconstructed = reconstructed.replace(after, () => before);
 }
 assert.equal(reconstructed, source, 'complete source preserved outside declared snippets');
 return result;
}
export const privateLifecycleSceneSource = source => apply(source, PRIVATE_LIFECYCLE_REPAIRS.scene);
export const privateLifecycleChunkSource = source => apply(source, PRIVATE_LIFECYCLE_REPAIRS.chunk);
