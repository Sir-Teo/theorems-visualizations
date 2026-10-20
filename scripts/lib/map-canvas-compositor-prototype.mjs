// Explicit-only module rewrite: production graph.js and application wiring stay unchanged.
import assert from 'node:assert/strict';
export function mapCanvasCompositorPrototype(source) {
 const start=source.indexOf('  _paint({ layer'),end=source.indexOf('\n}\n\n// ------------------------------------------------------------ treemap',start);
 assert.ok(start>0&&end>start,'map painter boundaries');
 const painter=source.slice(start,end),decorStart=painter.indexOf('    if (!overlay) {\n      // field regions'),edgeStart=painter.indexOf('    // edges'),labelStart=painter.indexOf('    // labels'),bodyEnd=painter.lastIndexOf('\n  }');
 assert.ok(decorStart>0&&edgeStart>decorStart&&labelStart>edgeStart&&bodyEnd>labelStart,'complete painter passes');
 const decorators=painter.slice(decorStart,edgeStart),geometry=painter.slice(edgeStart,labelStart).replace('    if (base) return;',''),labels=painter.slice(labelStart,bodyEnd);
 const passes=`\n  _paintCompositorPart(pass) {\n    const focus=null,fc=null,overlay=false,base=false,c=this.ctx,k=this.k;\n    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.W,this.H);\n    const off=(x0,y0,x1,y1)=>x1<0||x0>this.W||y1<0||y0>this.H;\n    if(pass==='underlay'){\n${decorators}\n      return;\n    }\n    if(pass==='geometry'){\n${geometry}\n      return;\n    }\n    const rk=Math.max(.55,Math.min(1.5,k));\n${labels}\n  }\n`;
 let result="import {CanvasMapCompositor} from '/scripts/lib/map-canvas-compositor-runtime.mjs';\n"+source;
 result=result.replace('    this._bind();','    window.__mapAudit=this; this._bind();');
 result=result.replace('  _draw() {',`  _draw() {\n    this.__compositor ||= new CanvasMapCompositor(this);\n    if(this.__compositor.draw()) return;\n    this._drawOriginal();\n  }\n  _drawOriginal() {`);
 result=result.replace('  destroy() { this.dead = true;', '  destroy() { this.__compositor?.destroy(); this.dead = true;');
 result=result.replace('  resize() {\n    const r = this.host.getBoundingClientRect();', '  resize() {\n    this.__compositor?.invalidate();\n    const r = this.host.getBoundingClientRect();');
 result=result.replace('this.onTheme = () => { this.mapRaster', 'this.onTheme = () => { this.__compositor?.invalidate(); this.mapRaster');
 result=result.replace('this.onFonts = () => { if (!this.dead) { this.mapRaster', 'this.onFonts = () => { if (!this.dead) { this.__compositor?.invalidate(); this.mapRaster');
 return result.slice(0,result.indexOf('  _paint({ layer'))+passes+result.slice(result.indexOf('  _paint({ layer'));
}
