import assert from'node:assert/strict';
// Private source route only. No new atlas/scratch owner, no allocator/UV/shader/filter change.
export function guardedAtlasSource(source){let out=source;for(const[a,b]of[
['c.clearRect(0, 0, Math.max(width, this.previousWidth || 0), Math.max(height, this.previousHeight || 0)); this.previousWidth = width; this.previousHeight = height;','c.clearRect(0, 0, Math.max(width + 2, this.previousWidth || 0), Math.max(height + 2, this.previousHeight || 0)); this.previousWidth = width + 2; this.previousHeight = height + 2;'],
['c.setTransform(dpr, 0, 0, dpr, 0, 0);','c.setTransform(dpr, 0, 0, dpr, 1, 1);'],
['gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, this.scratch);','gl.texSubImage2D(gl.TEXTURE_2D, 0, x - 1, y - 1, width + 2, height + 2, gl.RGBA, gl.UNSIGNED_BYTE, this.scratch);']]){assert.equal(out.split(a).length,2,'exact original upload fragment');out=out.replace(a,b);}return out;}
