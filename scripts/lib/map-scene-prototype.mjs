import assert from 'node:assert/strict';
// Test-only wiring; the shipped Canvas renderer remains the complete fallback.
export function mapScenePrototype(source) {
  assert.ok(source.includes('  _draw() {') && source.includes('    this._bind();'));
  const start = source.indexOf('  _draw() {'), end = source.indexOf('  _paint({ layer', start), reference = source.slice(start, end).replace('_draw() {', '_drawCanvas() {');
  return "import { WebGLMapScene } from './map-webgl-scene.js';\n" + source
    .replace('    this._bind();', '    window.__mapAudit = this; this._bind();')
    .replace('this.W = r.width; this.H = r.height; this.canvas.width = this.W * d; this.canvas.height = this.H * d;', 'this.W = r.width; this.H = r.height; this.canvas.width = this.__scene?.active ? 1 : this.W * d; this.canvas.height = this.__scene?.active ? 1 : this.H * d;')
    .replace('  _draw() {', '  _draw() {\n    this.__scene ||= new WebGLMapScene(this); if (this.__scene.draw()) return; this.mapRaster=this.focusRaster=null; this._paint(); return;')
    .replace('  _paint({ layer', reference+'  _paint({ layer')
    .replace('  destroy() { this.dead = true;', '  destroy() { this.__scene?.destroy({restore:false}); this.dead = true;');
}
