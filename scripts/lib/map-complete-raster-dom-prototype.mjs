// Isolated presentation-only source adapter. No application imports this file.
import assert from 'node:assert/strict';
export function completeRasterDOMPrototype(source){
 const begin=source.indexOf('  _draw() {'),end=source.indexOf('  _paint({ layer',begin);assert.ok(begin>0&&end>begin);const original=source.slice(begin,end),tail=`    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.W, this.H);
    const scale = this.k / cache.k;
    const x = Math.round((this.tx - cache.tx * scale) * this.dpr) / this.dpr - cache.pad * scale;
    const y = Math.round((this.ty - cache.ty * scale) * this.dpr) / this.dpr - cache.pad * scale;
    c.drawImage(cache.canvas, x, y, cache.width * scale, cache.height * scale);`;
 assert.equal(original.split(tail).length,2,'exact production presentation');
 const miss='    if (!cache || cache.key !== key || cache.highlight !== this.hl || !zoomMatches || !covered) {';
 let adapted=original.replace('  _draw() {','  _drawDOM() {').replace(miss,miss+'\n      this.__rasterDOM.unmount();').replace(tail,`    const scale = this.k / cache.k;
    const x = Math.round((this.tx - cache.tx * scale) * this.dpr) / this.dpr - cache.pad * scale;
    const y = Math.round((this.ty - cache.ty * scale) * this.dpr) / this.dpr - cache.pad * scale;
    this.__rasterDOM.present(cache, x, y, scale);`);
 // A dimension change is a cache miss already; zero-first avoids transient mixed allocations.
 adapted=adapted.replace("      const canvas = cache?.canvas || document.createElement('canvas');", "      const canvas = cache?.canvas || document.createElement('canvas');\n      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = 0; canvas.height = 0; }");
 const wrapper=`  _draw() {\n    this.__rasterDOM ||= new CompleteRasterDOM(this);\n    const eligible=!this.__originalOnly&&(this.zooming||this.dragging)&&!this.sel&&!this.hover&&!this.hl;\n    if(!eligible){this.__rasterDOM.unmount();this._drawProduction();return;}\n    this._drawDOM();\n    // Resource fallback returns before presentation; hide any obsolete DOM picture.\n    if(!this.mapRaster)this.__rasterDOM.unmount();\n  }\n`;
 let result=source.slice(0,begin)+wrapper+original.replace('  _draw() {','  _drawProduction() {')+adapted+source.slice(end);
 result="import {CompleteRasterDOM} from '/scripts/lib/map-complete-raster-dom-runtime.mjs';\n"+result;
 result=result.replace('    this._bind();','    window.__mapAudit=this; this._bind();');
 result=result.replace('  destroy() { this.dead = true;', '  destroy() { this.__rasterDOM?.unmount(); this.dead = true;');
 // Detach before a real resize; retained object/key remain under original ownership.
 result=result.replace('  resize() {\n    const r = this.host.getBoundingClientRect();', '  resize() {\n    this.__rasterDOM?.unmount();\n    const r = this.host.getBoundingClientRect();');
 return result;
}
