// Test-only rewriting keeps the experimental backend out of the production map.
import assert from 'node:assert/strict';
export function mapWebGLPrototype(source) {
  const from = source.indexOf('  _paint({ layer'), to = source.indexOf('\n}\n\n// ------------------------------------------------------------ treemap', from);
  assert.ok(from > 0 && to > from, 'production map painter boundary');
  const reference = source.slice(from, to).replace('_paint({ layer', '_paintCanvas({ layer').replaceAll('this._paint(', 'this._paintCanvas(');
  let result = "import { WebGLEdges } from './map-webgl-edges.js';\n" + source;
  result = result.replace('    this._bind();', '    window.__mapAudit = this; this.__gpuEnabled = true; this._bind();');
  result = result.replace('  _draw() {', '  _draw() {\n    if (this.__gpuEnabled) { this.mapRaster = this.focusRaster = null; this._paint(); return; }');
  result = result.replace('  destroy() { this.dead = true;', '  destroy() { this.__gpu?.destroy(); this.dead = true;');
  const start = result.indexOf('    const drawEdges = (list, style, width, dash) => {'), end = result.indexOf('    const far = k < 0.13;', start);
  assert.ok(start > 0 && end > start, 'edge collector boundary');
  result = result.slice(0, start) + `    this.__gpu ||= new WebGLEdges();
    const edgeGroups = [];
    const addGroup = (key, paths, style, width, dash, cap = c.lineCap) => {
      const color = style.match(/[\\d.]+/g).map(Number);
      edgeGroups.push({ key, paths, style, rgba: [color[0]/255,color[1]/255,color[2]/255,color[3]??1], width, dash, cap });
    };
    const drawEdges = (list, style, width, dash) => {
      const paths = [], ids = [];
      for (const [a,b] of list) {
        const x1=this.sx(a.x),y1=this.sy(a.y),x2=this.sx(b.x),y2=this.sy(b.y);
        if (Math.max(x1,x2)<-50 || Math.min(x1,x2)>this.W+50 || Math.max(y1,y2)<-50 || Math.min(y1,y2)>this.H+50) continue;
        const dx=Math.max(20,Math.abs(b.x-a.x)*.45);
        paths.push([[a.x,a.y],[a.x+dx,a.y],[b.x-dx,b.y],[b.x,b.y]]); ids.push(a.order+','+b.order);
      }
      addGroup(ids.join('|'), paths, style, width, dash);
    };
` + result.slice(end);
  const bundleStart = result.indexOf('        c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2);', start), bundleEnd = result.indexOf('\n      }\n    } else if (!fc)', bundleStart);
  assert.ok(bundleStart > 0 && bundleEnd > bundleStart, 'bundle collector boundary');
  result = result.slice(0, bundleStart) + `        const t = Math.sqrt(n / this.maxBundle), worldMX=(A.x+B.x)/2, worldMY=(A.y+B.y)/2-Math.hypot(B.x-A.x,B.y-A.y)*.18;
        c.lineCap = 'round';
        addGroup('bundle:'+e.a+'>'+e.b, [[[A.x,A.y],[worldMX,worldMY],[B.x,B.y]]], withAlpha(e.a,(.06+.32*t)*(this.hl?.08:1)),.6+7*t,null,'round');` + result.slice(bundleEnd);
  result = result.replace('    // nodes\n    const rk', `    this.__gpuStats = this.__gpu.draw(c, edgeGroups, { width:this.W,height:this.H,dpr:this.dpr,k:this.k,tx:this.tx,ty:this.ty });
    // nodes
    const rk`);
  assert.ok(result.includes('this.__gpuStats ='), 'one edge flush');
  result = result.replace('  _paint({ layer', reference + '\n  _paint({ layer');
  return result;
}
