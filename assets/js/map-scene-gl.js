// Utilities used only by the isolated scene prototype.
export function sceneProgram(gl, vertex, fragment) {
  const shaders = []; let result;
  try {
    for (const [kind, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(kind); shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    }
    result = gl.createProgram(); for (const shader of shaders) gl.attachShader(result, shader); gl.linkProgram(result);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result));
    return result;
  } catch (error) { if (result) gl.deleteProgram(result); throw error; }
  finally { for (const shader of shaders) gl.deleteShader(shader); }
}

/** Counts explicit buffers/textures and native text canvas storage; excludes the primary buffer and driver copies. */
export class SceneBudget {
  constructor(limit = 64_000_000) { this.limit = limit; this.bytes = 0; this.peak = 0; this.entries = new Map(); }
  reserve(key, bytes, release, { evictable = false } = {}) {
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw new TypeError('Invalid scene allocation');
    this.release(key);
    while (this.bytes + bytes > this.limit) {
      const victim = [...this.entries].find(([, value]) => value.evictable);
      if (!victim) throw new RangeError('Scene GPU resource budget exceeded');
      this.release(victim[0]);
    }
    this.entries.set(key, { bytes, release, evictable }); this.bytes += bytes; this.peak = Math.max(this.peak, this.bytes);
  }
  touch(key) { const value = this.entries.get(key); if (value) { this.entries.delete(key); this.entries.set(key, value); } }
  release(key) { const value = this.entries.get(key); if (!value) return; this.entries.delete(key); this.bytes -= value.bytes; value.release(); }
  clear() { for (const key of this.entries.keys()) this.release(key); }
}

export const sceneQuadVertex = `#version 300 es
out vec2 uv;
void main(){uv=vec2((gl_VertexID==1||gl_VertexID==2)?1.:0.,gl_VertexID>=2?1.:0.);gl_Position=vec4(uv*2.-1.,0.,1.);}`;
export const sceneColor = style => {
  const match = style.match(/^rgba?\(([^)]+)\)$/);
  if (match) { const c = match[1].split(/[, /]+/).map(Number); return [c[0] / 255, c[1] / 255, c[2] / 255, c[3] ?? 1]; }
  if (/^#[0-9a-f]{6}$/i.test(style)) return [parseInt(style.slice(1, 3), 16) / 255, parseInt(style.slice(3, 5), 16) / 255, parseInt(style.slice(5, 7), 16) / 255, 1];
  throw new TypeError(`Unsupported scene color ${style}`);
};
