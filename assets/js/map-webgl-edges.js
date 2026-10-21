// Experimental, isolated edge backend. The production map still uses Canvas.
// A stencil union preserves the once-per-style alpha of a Canvas stroke.
const pointLineDistance = (p, a, b) => {
  const x = b[0] - a[0], y = b[1] - a[1], d = x * x + y * y;
  const t = d ? Math.max(0, Math.min(1, ((p[0] - a[0]) * x + (p[1] - a[1]) * y) / d)) : 0;
  return Math.hypot(p[0] - a[0] - t * x, p[1] - a[1] - t * y);
};

/** Convex-hull flatness bounds the whole Bezier within tolerance of each chord. */
export function flattenBezier(points, tolerance, maxDepth = 14) {
  if (![3, 4].includes(points.length) || !points.every(p => p.length === 2 && p.every(Number.isFinite)) || !(tolerance > 0 && Number.isFinite(tolerance))) throw new TypeError('Invalid Bezier geometry');
  const output = [points[0]];
  const visit = (ps, depth) => {
    if (ps.slice(1, -1).every(p => pointLineDistance(p, ps[0], ps.at(-1)) <= tolerance)) { output.push(ps.at(-1)); return; }
    if (depth === maxDepth) throw new RangeError('Bezier subdivision budget exceeded');
    const left = [ps[0]], right = [ps.at(-1)]; let row = ps;
    while (row.length > 1) { row = row.slice(1).map((p, i) => [(p[0] + row[i][0]) / 2, (p[1] + row[i][1]) / 2]); left.push(row[0]); right.push(row.at(-1)); }
    visit(left, depth + 1); visit(right.reverse(), depth + 1);
  };
  visit(points, 0); return output;
}

/** Non-overlapping alpha is handled by the stencil, so segment/join triangles may overlap. */
export function strokeMesh(paths, { tolerance, cap = 'butt' } = {}) {
  if (!['butt', 'round'].includes(cap)) throw new TypeError('Unsupported cap');
  const vertices = [], vertex = (p, n) => vertices.push(p[0], p[1], n[0], n[1]);
  const triangle = (a, an, b, bn, c, cn) => { vertex(a, an); vertex(b, bn); vertex(c, cn); };
  let segments = 0;
  for (const path of paths) {
    const ps = flattenBezier(path, tolerance).filter((p, i, all) => !i || Math.hypot(p[0] - all[i - 1][0], p[1] - all[i - 1][1]) > 1e-10);
    if (ps.length < 2) continue;
    let previous = null;
    for (let i = 1; i < ps.length; i++) {
      const a = ps[i - 1], b = ps[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]), n = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length], neg = [-n[0], -n[1]];
      triangle(a, n, a, neg, b, n); triangle(a, neg, b, neg, b, n); segments++;
      if (previous) {
        // Canvas uses miter joins with its default limit of ten. Inner corners
        // are already covered by adjacent rectangles; fill only the outer wedge.
        const turn = previous[0] * n[1] - previous[1] * n[0], side = turn > 0 ? -1 : 1;
        const an = previous.map(v => v * side), bn = n.map(v => v * side), denominator = 1 + previous[0] * n[0] + previous[1] * n[1];
        const miter = denominator > 1e-10 ? [(an[0] + bn[0]) / denominator, (an[1] + bn[1]) / denominator] : null;
        triangle(a, an, a, [0, 0], a, bn);
        if (miter && Math.hypot(...miter) <= 10) triangle(a, an, a, miter, a, bn);
        else triangle(a, an, a, [0, 0], a, bn);
      }
      previous = n;
    }
    if (cap === 'round') for (const p of [ps[0], ps.at(-1)]) for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12;
      triangle(p, [0, 0], p, [Math.cos(a), Math.sin(a)], p, [Math.cos(b), Math.sin(b)]);
    }
  }
  return { vertices: new Float32Array(vertices), segments };
}

function program(gl, vertex, fragment) {
  const shaders = [];
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type); shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    }
    const result = gl.createProgram(); for (const shader of shaders) gl.attachShader(result, shader); gl.linkProgram(result);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) { const message = gl.getProgramInfoLog(result); gl.deleteProgram(result); throw new Error(message); }
    return result;
  } finally { for (const shader of shaders) gl.deleteShader(shader); }
}
const vertexSource = `#version 300 es
layout(location=0) in vec2 position;
layout(location=1) in vec2 normal;
uniform vec2 resolution;
uniform vec3 transform;
uniform float halfWidth;
void main(){ vec2 p=position*transform.x+transform.yz+normal*halfWidth; gl_Position=vec4(p/resolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.); }`;
const fragmentSource = `#version 300 es
precision highp float;
uniform vec4 color;
out vec4 pixel;
void main(){ pixel=vec4(color.rgb*color.a,color.a); }`;
const quadSource = `#version 300 es
void main(){ vec2 p=vec2((gl_VertexID==1||gl_VertexID==2)?1.:-1.,gl_VertexID>=2?1.:-1.); gl_Position=vec4(p,0.,1.); }`;

/**
 * Tiled solid strokes. Unsupported/dashed groups use Canvas in the same order.
 * At most one 4M-pixel logical GL drawing buffer and 32MiB of vertex data are
 * retained. MSAA/depth-stencil/back buffers and driver copies add memory.
 */
export class WebGLEdges {
  constructor({ maxPixels = 4_000_000, maxBytes = 32 * 1024 * 1024, canvas = document.createElement('canvas') } = {}) {
    if (!Number.isInteger(maxPixels) || maxPixels < 1 || !Number.isInteger(maxBytes) || maxBytes < 1) throw new TypeError('Invalid edge resource budget');
    this.canvas = canvas; this.maxPixels = maxPixels; this.maxBytes = maxBytes; this.cache = new Map(); this.bytes = 0; this.dead = false; this.lost = false;
    this.gl = canvas.getContext('webgl2', { alpha: true, depth: false, stencil: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false });
    this.onLost = event => { event.preventDefault(); this.lost = true; this.cache.clear(); this.bytes = 0; };
    this.onRestored = () => { if (!this.dead) { this.lost = false; try { this.init(); } catch { this.lost = true; } } };
    canvas.addEventListener('webglcontextlost', this.onLost); canvas.addEventListener('webglcontextrestored', this.onRestored);
    try { if (this.gl) this.init(); } catch (error) { this.failure = error.message; this.lost = true; }
  }
  init() {
    const gl = this.gl, attributes = gl.getContextAttributes();
    if (!attributes?.antialias || !attributes.stencil || gl.getParameter(gl.SAMPLES) < 2 || gl.getParameter(gl.STENCIL_BITS) < 1) throw new Error('Multisample stencil unavailable');
    this.strokeProgram = program(gl, vertexSource, fragmentSource); this.quadProgram = program(gl, quadSource, fragmentSource);
    this.locations = Object.fromEntries(['resolution', 'transform', 'halfWidth', 'color'].map(name => [name, gl.getUniformLocation(this.strokeProgram, name)]));
    this.quadColor = gl.getUniformLocation(this.quadProgram, 'color'); this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0); gl.clearStencil(0); this.maxEdge = Math.min(4096, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), ...gl.getParameter(gl.MAX_VIEWPORT_DIMS));
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    this.capabilities = { renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), version: gl.getParameter(gl.VERSION), samples: gl.getParameter(gl.SAMPLES), stencilBits: gl.getParameter(gl.STENCIL_BITS), maxEdge: this.maxEdge, attributes };
  }
  get available() { return !!this.gl && !this.dead && !this.lost && !this.gl.isContextLost(); }
  evict(key) {
    const value = this.cache.get(key); if (!value) return;
    if (!this.lost) this.gl.deleteBuffer(value.buffer); this.bytes -= value.bytes; this.cache.delete(key);
  }
  mesh(group, k, dpr, beforeEviction) {
    // Round fidelity upward, so flattening error is at most .2 device pixels.
    const scale = 2 ** Math.ceil(Math.log2(k * dpr)), key = `${group.key}|${scale}|${group.cap || 'butt'}`;
    if (this.cache.has(key)) { const value = this.cache.get(key); this.cache.delete(key); this.cache.set(key, value); return value; }
    const mesh = strokeMesh(group.paths, { tolerance: .2 / scale, cap: group.cap || 'butt' }), gl = this.gl, bytes = mesh.vertices.byteLength;
    if (bytes > this.maxBytes) return null;
    if (this.bytes + bytes > this.maxBytes) beforeEviction();
    while (this.bytes + bytes > this.maxBytes) this.evict(this.cache.keys().next().value);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    const bounds = [Infinity, Infinity, -Infinity, -Infinity];
    for (const path of group.paths) for (const [x, y] of path) { bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y); bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y); }
    const value = { buffer, bytes, count: mesh.vertices.length / 4, segments: mesh.segments, bounds }; this.bytes += bytes; this.cache.set(key, value); return value;
  }
  canvasStroke(context, group, { k, tx, ty }) {
    context.beginPath();
    for (const ps of group.paths) {
      context.moveTo(ps[0][0] * k + tx, ps[0][1] * k + ty);
      const p = ps.slice(1).flatMap(([x, y]) => [x * k + tx, y * k + ty]);
      if (ps.length === 4) context.bezierCurveTo(...p); else context.quadraticCurveTo(...p);
    }
    context.strokeStyle = group.style; context.lineWidth = group.width; context.lineCap = group.cap || 'butt'; context.setLineDash(group.dash || []); context.stroke(); context.setLineDash([]);
  }
  draw(context, groups, { width, height, dpr, k, tx, ty }) {
    const view = { k, tx, ty }, gl = this.gl, stats = { gpuGroups: 0, canvasGroups: 0, tiles: 0, segments: 0, meshBytes: this.bytes, pixels: 0, available: this.available };
    if (!(width > 0 && height > 0 && dpr > 0 && k > 0 && [width, height, dpr, k, tx, ty].every(Number.isFinite))) throw new TypeError('Invalid edge viewport');
    let pending = [];
    const flush = () => {
      if (!pending.length) return;
      const pixelWidth = Math.ceil(width * dpr), pixelHeight = Math.ceil(height * dpr);
      const tileWidth = Math.min(this.maxEdge, pixelWidth, Math.floor(Math.sqrt(this.maxPixels))), tileHeight = Math.min(this.maxEdge, pixelHeight, Math.floor(this.maxPixels / tileWidth));
      if (this.canvas.width !== tileWidth || this.canvas.height !== tileHeight) { this.canvas.width = tileWidth; this.canvas.height = tileHeight; }
      gl.bindVertexArray(this.vao); gl.viewport(0, 0, tileWidth, tileHeight); gl.enable(gl.STENCIL_TEST);
      stats.pixels = tileWidth * tileHeight;
      for (let y = 0; y < pixelHeight; y += tileHeight) for (let x = 0; x < pixelWidth; x += tileWidth) {
        gl.disable(gl.SCISSOR_TEST); gl.colorMask(true, true, true, true); gl.stencilMask(0xff); gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        for (const { group, mesh } of pending) {
          const margin = group.width * 5 + 1, left = Math.max(0, Math.floor((mesh.bounds[0] * k + tx - margin) * dpr - x)), right = Math.min(tileWidth, Math.ceil((mesh.bounds[2] * k + tx + margin) * dpr - x));
          const top = Math.max(0, Math.floor((mesh.bounds[1] * k + ty - margin) * dpr - y)), bottom = Math.min(tileHeight, Math.ceil((mesh.bounds[3] * k + ty + margin) * dpr - y));
          if (right <= left || bottom <= top) continue;
          gl.enable(gl.SCISSOR_TEST); gl.scissor(left, tileHeight - bottom, right - left, bottom - top);
          gl.colorMask(false, false, false, false); gl.stencilMask(0xff); gl.stencilFunc(gl.ALWAYS, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
          gl.useProgram(this.strokeProgram); gl.uniform2f(this.locations.resolution, tileWidth / dpr, tileHeight / dpr); gl.uniform3f(this.locations.transform, k, tx - x / dpr, ty - y / dpr); gl.uniform1f(this.locations.halfWidth, group.width / 2);
          gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer); gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8); gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
          gl.colorMask(true, true, true, true); gl.stencilMask(0); gl.stencilFunc(gl.EQUAL, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); gl.useProgram(this.quadProgram); gl.uniform4fv(this.quadColor, group.rgba); gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
          gl.stencilMask(0xff); gl.clear(gl.STENCIL_BUFFER_BIT);
        }
        const w = Math.min(tileWidth, pixelWidth - x), h = Math.min(tileHeight, pixelHeight - y);
        context.drawImage(this.canvas, 0, 0, w, h, x / dpr, y / dpr, w / dpr, h / dpr); stats.tiles++;
      }
      gl.disable(gl.STENCIL_TEST); gl.disable(gl.SCISSOR_TEST); pending = [];
    };
    for (const group of groups) {
      if (!group.paths.length) continue;
      let mesh = null;
      if (this.available && !group.dash?.length && group.rgba?.length === 4 && group.rgba.every(Number.isFinite)) {
        try { mesh = this.mesh(group, k, dpr, flush); } catch { /* Bounded tessellation fails back to Canvas. */ }
      }
      if (mesh) { pending.push({ group, mesh }); stats.gpuGroups++; stats.segments += mesh.segments; }
      else { flush(); this.canvasStroke(context, group, view); stats.canvasGroups++; }
    }
    flush(); stats.meshBytes = this.bytes; return stats;
  }
  destroy() {
    if (this.dead) return; for (const key of this.cache.keys()) this.evict(key);
    this.dead = true; this.canvas.removeEventListener('webglcontextlost', this.onLost); this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    if (this.gl && !this.lost) { this.gl.deleteVertexArray(this.vao); this.gl.deleteProgram(this.strokeProgram); this.gl.deleteProgram(this.quadProgram); }
    this.canvas.width = this.canvas.height = 1;
  }
}
