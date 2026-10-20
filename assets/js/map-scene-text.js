// Native Canvas rasterizes words only; the scene samples a bounded GPU atlas.
// There is no full-viewport Canvas -> WebGL or WebGL -> Canvas frame copy.
export class SceneTextAtlas {
  constructor(gl, budget, { width = 2048, height = 1024 } = {}) {
    this.gl = gl; this.budget = budget; this.width = width; this.height = height; this.cache = new Map(); this.texture = gl.createTexture();
    this.scratch = document.createElement('canvas'); this.scratch.width = width; this.scratch.height = height; // Connection preserves inherited font smoothing/features; detached Canvas
    // produces visibly different glyph coverage on the measured browser.
    this.scratch.setAttribute('aria-hidden', 'true'); this.scratch.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;pointer-events:none;opacity:0'; document.body.append(this.scratch); this.context = this.scratch.getContext('2d'); this.measure = this.context;
    try {
    budget.reserve(this.scratch, width * height * 4, () => { this.scratch.width = this.scratch.height = 1; this.scratch.remove(); });
    budget.reserve(this, width * height * 4, () => gl.deleteTexture(this.texture));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); if(gl.getError()!==gl.NO_ERROR)throw new RangeError('Native word texture allocation failed');this.clear();
    } catch (error) { budget.release(this); budget.release(this.scratch); gl.deleteTexture(this.texture); this.scratch.width = this.scratch.height = 1; this.scratch.remove(); throw error; }
  }
  clear() { this.cache.clear(); this.x = this.y = this.rowHeight = 0; this.generation = (this.generation || 0) + 1; }
  configure(context, { font, baseline = 'alphabetic', align = 'left', letterSpacing = '0px' }) {
    context.font = font; context.textBaseline = baseline; context.textAlign = align; context.letterSpacing = letterSpacing;
  }
  metrics(text, style) { this.configure(this.measure, style); return this.measure.measureText(text); }
  get(text, style, dpr, flush) {
    const { stroke = false, lineWidth = 1 } = style, key = JSON.stringify([text, style.font, style.baseline, style.align, style.letterSpacing, stroke, lineWidth, dpr, style.color || '#fff', style.phaseX || 0, style.phaseY || 0]);
    if (this.cache.has(key)) return this.cache.get(key);
    const phaseX = style.phaseX || 0, phaseY = style.phaseY || 0, metrics = this.metrics(text, style), pad = stroke ? lineWidth / 2 + 2 / dpr : 2 / dpr;
    const left = Math.floor((-metrics.actualBoundingBoxLeft - pad) * dpr + phaseX), top = Math.floor((-metrics.actualBoundingBoxAscent - pad) * dpr + phaseY), right = Math.ceil((metrics.actualBoundingBoxRight + pad) * dpr + phaseX), bottom = Math.ceil((metrics.actualBoundingBoxDescent + pad) * dpr + phaseY);
    const width = Math.max(1, right - left), height = Math.max(1, bottom - top);
    if (width + 2 > this.width || height + 2 > this.height) throw new RangeError('Native word exceeds scene atlas dimensions');
    if (this.x + width + 2 > this.width) { this.x = 0; this.y += this.rowHeight; this.rowHeight = 0; }
    if (this.y + height + 2 > this.height) { flush(); this.clear(); }
    const x = this.x + 1, y = this.y + 1; this.x += width + 2; this.rowHeight = Math.max(this.rowHeight, height + 2);
    const c = this.context; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, Math.max(width, this.previousWidth || 0), Math.max(height, this.previousHeight || 0)); this.previousWidth = width; this.previousHeight = height;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); this.configure(c, style); c.fillStyle = c.strokeStyle = style.color || '#fff'; c.lineWidth = lineWidth;
    const anchorX = (-left + phaseX) / dpr, anchorY = (-top + phaseY) / dpr;
    if (stroke) c.strokeText(text, anchorX, anchorY); else c.fillText(text, anchorX, anchorY);
    const gl = this.gl; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, this.scratch); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const value = { x: x / this.width, y: y / this.height, u: width / this.width, v: height / this.height, left: (left - phaseX) / dpr, top: (top - phaseY) / dpr, width: width / dpr, height: height / dpr, generation: this.generation };
    this.cache.set(key, value); return value;
  }
  destroy() { this.cache.clear(); this.budget.release(this); this.budget.release(this.scratch); this.scratch.width = this.scratch.height = 1; this.scratch.remove(); }
}
