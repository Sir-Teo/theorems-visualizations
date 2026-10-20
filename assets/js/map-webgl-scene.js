// Isolated persistent scene experiment. Production graph.js does not import it.
import { resolveColor, withAlpha } from './viz/core.js';
import { SceneBudget, sceneColor } from './map-scene-gl.js';
import { ScenePainter } from './map-scene-painter.js';
import { SceneEdges } from './map-scene-edges.js';
import { worldCurve, fidelityScale, sceneNodeFlags } from './map-scene-model.js';
import { paintSceneDecorations } from './map-scene-decorations.js';

// Only background rectangles and words use this facade. Edges and nodes have
// persistent world-space GPU data, rather than replaying Canvas paths per frame.
class Decorations {
  constructor(painter) { this.painter = painter; this.state = { font: '10px sans-serif', textBaseline: 'alphabetic', textAlign: 'left', letterSpacing: '0px', fillStyle: '#000000', strokeStyle: '#000000', lineWidth: 1, clip: null }; this.stack = []; }
  save() { this.stack.push({ ...this.state }); }
  restore() { this.state = this.stack.pop(); }
  beginPath() { this.path = null; }
  roundRect(x, y, w, h, r) { this.path = [x, y, w, h, r]; }
  rect(x, y, w, h) { this.path = [x, y, w, h, 0]; }
  clip() { this.state.clip = this.path.slice(0, 4); }
  fill() { this.painter.rect(...this.path, this.state.fillStyle); }
  style(extra = {}) { const s = this.state; return { font: s.font, baseline: s.textBaseline, align: s.textAlign, letterSpacing: s.letterSpacing, ...extra }; }
  measureText(text) { return this.painter.measure(text, this.style()); }
  fillText(text, x, y) { this.painter.text(text, x, y, this.style(), this.state.fillStyle, this.state.clip); }
  strokeText(text, x, y) { this.painter.text(text, x, y, this.style({ stroke: true, lineWidth: this.state.lineWidth }), this.state.strokeStyle, this.state.clip); }
}
for (const key of ['font', 'textBaseline', 'textAlign', 'letterSpacing', 'fillStyle', 'strokeStyle', 'lineWidth']) Object.defineProperty(Decorations.prototype, key, { get() { return this.state[key]; }, set(value) { this.state[key] = value; } });

export class WebGLMapScene {
  constructor(map, { limit = 64_000_000, unavailable = false } = {}) {
    this.map = map; this.limit = limit; this.dead = false; this.active = false; this.generation = 0; this.pending = new Map(); this.models = new Map(); this.groups = new Map(); this.failed = new Set(); this.serial = 0; this.cap = 'butt'; this.status = 'initializing';
    this.canvas = document.createElement('canvas'); this.canvas.setAttribute('aria-hidden', 'true'); this.canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none'; map.canvas.after(this.canvas);
    this.onLost = event => { event.preventDefault(); this.fallback('context lost'); this.disposeResources(); if (!this.dead) map.draw(); };
    this.onRestored = () => { if (!this.dead) this.initialize(); };
    this.onFonts = () => { this.painter?.atlas.clear(); if (!this.dead) map.draw(); };
    this.onFocus = () => { if (!this.dead) map.draw(); }; map.canvas.addEventListener('focus', this.onFocus); map.canvas.addEventListener('blur', this.onFocus);
    this.canvas.addEventListener('webglcontextlost', this.onLost); this.canvas.addEventListener('webglcontextrestored', this.onRestored); document.fonts?.addEventListener('loadingdone', this.onFonts);
    this.unavailable = unavailable; this.initialize();
  }
  initialize() {
    if (this.dead) return;
    this.generation++; this.status = 'initializing';
    try {
      const gl = this.unavailable ? null : this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl || gl.isContextLost()) throw new Error('WebGL2 unavailable');
      this.gl = gl; this.samples = gl.getParameter(gl.SAMPLES); this.budget = new SceneBudget(this.limit); this.painter = new ScenePainter(gl, this.budget, {height:512}); this.decorations = new Decorations(this.painter); this.edges = new SceneEdges(gl, this.budget);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this.paths = this.map.edges.map(([a, b]) => worldCurve(a, b)); this.bundlePaths = []; this.bundleEntries = [];
      for (const bundle of this.map.bundles) { const a = this.map.centers.get(bundle.a), b = this.map.centers.get(bundle.b); if (!a || !b) continue; this.bundlePaths.push([[a.x, a.y], [(a.x + b.x) / 2, (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * .18], [b.x, b.y]]); this.bundleEntries.push(bundle); }
      this.uploadNodes();
      const generation = this.generation;
      this.worker = new Worker(new URL('./map-scene-worker.js', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }) => {
        const pending = this.pending.get(data.request); if (!pending || generation !== this.generation || this.dead) return;
        this.pending.delete(data.request);
        if (data.error) { pending.reject(new Error(data.error)); return; }
        try { const model = this.edges.upload(data.geometry, pending.paths, { evictable: true }); model.constructionMS = data.constructionMS; this.models.set(pending.key, model); pending.resolve(model); if (!this.dead) this.map.draw(); }
        catch (error) { pending.reject(error); }
      };
      this.worker.onerror = () => { this.fallback('geometry worker failed'); if (!this.dead) map.draw(); };
      this.ready = Promise.all([this.geometry('edges', .5), this.geometry('edges', 4), this.geometry('bundles', .5)]).then(() => { if (!this.dead && generation === this.generation) { this.status = 'ready'; this.map.draw(); } }).catch(error => { if (!this.dead && generation === this.generation) this.fallback(error.message); });
    } catch (error) { this.fallback(error.message); this.disposeResources(); this.ready = Promise.resolve(); }
  }
  geometry(kind, scale) {
    const key = `${kind}:${scale}`, model = this.models.get(key);
    if (model && !model.released) return Promise.resolve(model);
    for (const pending of this.pending.values()) if (pending.key === key) return pending.promise;
    const paths = kind === 'edges' ? this.paths : this.bundlePaths, request = ++this.serial;
    let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    this.pending.set(request, { key, paths, resolve, reject, promise }); this.worker.postMessage({ request, paths, scale }); return promise;
  }
  uploadNodes() {
    const gl = this.gl, map = this.map; this.colIndex = new Map(map.G.collections.map((c, i) => [c.id, i]));
    if (this.colIndex.size > 128) throw new RangeError('Scene palette exceeded');
    this.nodeHeight = Math.max(1, Math.ceil(map.nodes.length / 1024)); this.flagHeight = Math.max(1, Math.ceil(map.nodes.length / 256));
    const nodes = new Float32Array(1024 * this.nodeHeight * 4); map.nodes.forEach((n, i) => nodes.set([n.x, n.y, n.r, this.colIndex.get(n.it.col)], i * 4));
    const owner = this.nodeOwner = {}; this.budget.reserve(owner, nodes.byteLength + 256 * this.flagHeight, () => { gl.deleteTexture(this.nodeTexture); gl.deleteTexture(this.flagsTexture); });
    this.nodeTexture = this.edges.texture(1024, this.nodeHeight, gl.RGBA32F, gl.RGBA, gl.FLOAT, nodes); this.flagsTexture = this.edges.texture(256, this.flagHeight, gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE, null);
  }
  invalidate() { this.controlKey = null; this.painter?.atlas.clear(); }
  fallback(reason) {
    this.status = reason; this.active = false; this.canvas.style.display = 'none'; if (this.canvas.width !== 1 || this.canvas.height !== 1) this.canvas.width = this.canvas.height = 1; const map = this.map;
    if (map.canvas.style.opacity === '0') { map.canvas.style.opacity = ''; map.canvas.width = Math.round(map.W * map.dpr); map.canvas.height = Math.round(map.H * map.dpr); map.mapRaster = map.focusRaster = null; }
  }
  group(model, key, ids, style) {
    const map = this.map, bundle = key.startsWith('bundle:'), required = [(-50-map.tx)/map.k,(-50-map.ty)/map.k,(map.W+50-map.tx)/map.k,(map.H+50-map.ty)/map.k], cacheKey = `${model.scale}:${key}`; let group = this.groups.get(cacheKey);
    if (group && group.model === model && !model.released && (bundle || required[0]>=group.coverage[0]&&required[1]>=group.coverage[1]&&required[2]<=group.coverage[2]&&required[3]<=group.coverage[3])) return group;
    if (group) { this.edges.releaseGroup(group); this.groups.delete(cacheKey); }
    const pad = 256/map.k, coverage = [required[0]-pad,required[1]-pad,required[2]+pad,required[3]+pad];
    const indices = [], bounds = [Infinity, Infinity, -Infinity, -Infinity], paths = key.startsWith('bundle:') ? this.bundlePaths : this.paths;
    for (const id of ids) { const path=paths[id],a=path[0],b=path.at(-1);if(!bundle&&(Math.max(a[0],b[0])<coverage[0]||Math.min(a[0],b[0])>coverage[2]||Math.max(a[1],b[1])<coverage[1]||Math.min(a[1],b[1])>coverage[3]))continue; const range = model.ranges[id]; for (let i = 0; i < range.segments; i++) indices.push(range.startPoint + i); for (const p of path) { bounds[0] = Math.min(bounds[0], p[0]); bounds[1] = Math.min(bounds[1], p[1]); bounds[2] = Math.max(bounds[2], p[0]); bounds[3] = Math.max(bounds[3], p[1]); } }
    group = this.edges.group(new Uint32Array(indices), { ...style, bounds }); group.model = model; group.coverage=coverage; this.groups.set(cacheKey, group); return group;
  }
  controls(focus, closure) {
    const map = this.map, key = [map.show.defs, map.show.planned, [...map.show.fields].join(','), map.hl ? [...map.hl].join(',') : '', focus?.it.id, map.sel?.it.id, document.documentElement.dataset.theme, getComputedStyle(document.documentElement).getPropertyValue('--c-ink')].join('|');
    if (key === this.controlKey) return;
    this.controlKey = key; for (const group of this.groups.values()) this.edges.releaseGroup(group); this.groups.clear();
    const data = new Uint8Array(256 * this.flagHeight); data.set(sceneNodeFlags(map.nodes, { visible: n => map.visible(n), focus, selection: map.sel, closure, highlight: map.hl }));
    const gl = this.gl; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.flagsTexture); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, this.flagHeight, gl.RED_INTEGER, gl.UNSIGNED_BYTE, data);
    this.visibleEdges = []; this.byCol = new Map(); this.ghostEdges = []; this.ancestorEdges = []; this.descendantEdges = [];
    const ancestors = closure ? new Set([...closure.anc, focus.it.id]) : null, descendants = closure ? new Set([...closure.desc, focus.it.id]) : null;
    map.edges.forEach(([a, b], i) => { if (!map.visible(a) || !map.visible(b)) return; this.visibleEdges.push(i); if (a.ghost || b.ghost) this.ghostEdges.push(i); else { const list = this.byCol.get(a.it.col) || []; list.push(i); this.byCol.set(a.it.col, list); } if (ancestors?.has(a.it.id) && ancestors.has(b.it.id)) this.ancestorEdges.push(i); if (descendants?.has(a.it.id) && descendants.has(b.it.id)) this.descendantEdges.push(i); });
    this.palette = new Float32Array(128 * 4); for (const [col, index] of this.colIndex) this.palette.set(sceneColor(resolveColor(col)), index * 4);
  }
  draw() {
    if (this.dead || !this.gl || this.gl.isContextLost() || !this.edges || this.status === 'initializing') return false;
    const map = this.map, focus = map.hover || map.sel, closure = focus ? focus === map.sel ? map.selClosure : map.closure(focus) : null, far = map.k < .13 && !focus, kind = far ? 'bundles' : 'edges', wanted = fidelityScale(map.k, map.dpr), scale = kind === 'bundles' ? Math.max(.5, wanted) : wanted <= .5 ? .5 : wanted <= 4 ? 4 : wanted;
    const model = this.models.get(`${kind}:${scale}`);
    if (!model || model.released) { const key = `${kind}:${scale}`; if (this.failed.has(key)) return false; for (const candidate of this.models.values()) { const entry = this.budget.entries.get(candidate); if (entry) entry.evictable = true; } this.geometry(kind, scale).catch(error => { this.failed.add(key); this.fallback(error.message); }); this.fallback('preparing geometry'); return false; }
    try {
      for (const [key, group] of this.groups) if (group.model.released) { this.edges.releaseGroup(group); this.groups.delete(key); }
      for (const candidate of this.models.values()) { const entry = this.budget.entries.get(candidate); if (entry) entry.evictable = candidate !== model; } this.budget.touch(model);
      this.controls(focus, closure); const gl = this.gl, width = Math.round(map.W * map.dpr), height = Math.round(map.H * map.dpr);
      if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; if(gl.drawingBufferWidth!==width||gl.drawingBufferHeight!==height)throw new RangeError('Scene drawing buffer size unavailable');this.painter.atlas.clear(); } this.canvas.style.width = map.W + 'px'; this.canvas.style.height = map.H + 'px';
      map.mapRaster = map.focusRaster = null; if (map.canvas.width !== 1 || map.canvas.height !== 1) map.canvas.width = map.canvas.height = 1; map.canvas.style.opacity = '0'; this.canvas.style.display = 'block'; this.active = true;
      this.canvas.style.outline = map.canvas.matches(':focus-visible') ? '2px solid var(--c-accent)' : ''; this.canvas.style.outlineOffset = '-3px';
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, width, height); gl.disable(gl.SCISSOR_TEST); gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      this.painter.view(map.W, map.H, map.dpr, map.zooming || map.dragging); paintSceneDecorations.call(map, this.decorations, 'background');
      const view = { width: map.W, height: map.H, dpr: map.dpr, k: map.k, tx: map.tx, ty: map.ty }, line = (key, ids, color, lineWidth, dash = false) => this.group(model, key, ids, { color: sceneColor(color), width: lineWidth, dash, cap: this.cap });
      const paintLines = groups => { for (const group of groups) group.cap = this.cap; this.edges.union(model, groups.filter(g => g.count), view); };
      const gray = () => line('gray', this.visibleEdges, withAlpha('ink', .05), .7), up = () => line('up', this.ancestorEdges, withAlpha('accent', .55), Math.max(1, Math.min(2, map.k * 1.2))), down = () => line('down', this.descendantEdges, withAlpha('green', .55), Math.max(1, Math.min(2, map.k * 1.2)));
      const nodes = layer => this.painter.nodes({ texture: this.nodeTexture, flags: this.flagsTexture, count: map.nodes.length, k: map.k, tx: map.tx, ty: map.ty, far, layer, highlight: !!map.hl, focus: !!focus, palette: this.palette, ink: resolveColor('ink'), panel: resolveColor('panel'), accent: resolveColor('accent') });
      if (far) {
        const groups = []; this.bundleEntries.forEach((bundle, id) => { if (!map.show.fields.has(map.fieldOf.get(bundle.a)) || !map.show.fields.has(map.fieldOf.get(bundle.b))) return; const n = map.show.planned ? bundle.n : bundle.written; if (!n) return; const t = Math.sqrt(n / map.maxBundle); this.cap = 'round'; groups.push(this.group(model, `bundle:${id}`, [id], { color: sceneColor(withAlpha(bundle.a, (.06 + .32 * t) * (map.hl ? .08 : 1))), width: .6 + 7 * t, cap: 'round', cullEndpoints: false })); }); this.edges.direct(model, groups, view); nodes(0);
      } else if (!focus) {
        const groups = []; for (const [col, ids] of this.byCol) { const group = line(`col:${col}`, ids, withAlpha(col, map.hl ? .05 : .16), Math.max(.6, Math.min(1.3, map.k))); group.width = Math.max(.6, Math.min(1.3, map.k)); groups.push(group); } if (map.show.planned) groups.push(line('ghost', this.ghostEdges, withAlpha('muted', .12), .7, true)); paintLines(groups); nodes(0);
      } else {
        paintLines([gray()]); if (map.hover && map.hover !== map.sel) nodes(1);
        const a = up(), d = down(); a.width = d.width = Math.max(1, Math.min(2, map.k * 1.2)); paintLines([a, d]); nodes(map.hover && map.hover !== map.sel ? 2 : 0);
      }
      paintSceneDecorations.call(map, this.decorations, 'labels');
      this.status = 'ready'; return true;
    } catch (error) { this.fallback(error.message); return false; }
  }
  resources() {
    const gl = this.gl, bytes = key => this.budget?.entries.get(key)?.bytes || 0, geometry = [...this.models.values()].filter(m => !m.released), fontGPU = bytes(this.painter?.atlas), fontSource = bytes(this.painter?.atlas.scratch), geometryBytes = geometry.reduce((n,m)=>n+bytes(m),0), indices = [...this.groups.values()].reduce((n,g)=>n+bytes(g),0), coverage = bytes(this.edges?.mask), nodes = bytes(this.nodeOwner);
    return { logicalRetainedBytes: this.budget?.bytes || 0, logicalPeakBytes: this.budget?.peak || 0, logicalLimitBytes: this.limit, components: { worldPointsAndCurveMetadata: geometryBytes, segmentIndices: indices, nativeWordTexture: fontGPU, nativeWordSourceCanvas: fontSource, singleChannelCoverage: coverage, nodeAndFlagTextures: nodes }, componentSum: geometryBytes+indices+fontGPU+fontSource+coverage+nodes, primaryDrawingBufferBytes: this.canvas.width * this.canvas.height * 4, primarySamples: this.samples || 0, requestedDepth: false, requestedStencil: false, maskPixels: this.edges?.mask ? this.edges.mask.width * this.edges.mask.height : 0, retainedModels: geometry.map(m => ({ scale: m.scale, points: m.pointCount, segments: m.segmentCount })), indexBuffers: this.groups.size, inputCanvasPixels: this.map.canvas.width * this.map.canvas.height, contextRestore: 'Terminate worker and release all owned resources before constructing a replacement generation.', excluded: 'Logical dimensions are not a physical GPU-memory ceiling. Driver alignment, shader/VAO storage, compositor surfaces, swap-chain/backbuffer copies and delayed deallocation are not exposed by WebGL.' };
  }
  disposeResources() {
    this.generation++; this.worker?.terminate(); this.worker = null; for (const pending of this.pending.values()) pending.reject(new Error('Scene generation disposed')); this.pending.clear(); this.edges?.destroy(); this.painter?.destroy(); this.budget?.clear(); this.edges = this.painter = null; this.models.clear(); this.groups.clear(); this.failed.clear(); this.controlKey = null;
  }
  destroy({ restore = true } = {}) {
    this.dead = true; if (restore) this.fallback('destroyed'); this.disposeResources(); this.canvas.removeEventListener('webglcontextlost', this.onLost); this.canvas.removeEventListener('webglcontextrestored', this.onRestored); document.fonts?.removeEventListener('loadingdone', this.onFonts); this.map.canvas.removeEventListener('focus', this.onFocus); this.map.canvas.removeEventListener('blur', this.onFocus); this.canvas.remove();
  }
}
