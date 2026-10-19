import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as M from '../assets/js/viz/math.js';
import chapter from '../content/fa/ch04.js';

test('Quotient visualization snaps the zero class and avoids dividing by its zero norm',()=>{
  const stages=[],controls=new Map();let draw,read;
  const ctl=(label,value)=>{const q={value,el:{style:{}}};controls.set(label,q);return q};
  const v={M,fix:(x,n)=>Number(x).toFixed(n),legend(){},select(l,o,x){return ctl(l,x)},slider(l,a,b,x){return ctl(l,x)},stage(){const handles=[];const s=new Proxy({handles,handle(x,y,o){const h={x,y,...o};handles.push(h);return h}},{get(t,k){return k in t?t[k]:()=>s}});stages.push(s);return s},render(f){draw=f},readout(f){read=f}};
  chapter.items.find(x=>x.num==='4.9').viz(v);controls.get('').value='b';draw();
  const x=stages[0].handles[0],ann=stages[1].handles[1],theta=32*Math.PI/180;
  const [sx,sy]=x.constrain(Math.cos(theta)+.01*Math.sin(theta),Math.sin(theta)-.01*Math.cos(theta));
  assert.ok(Math.abs(sx*Math.sin(theta)-sy*Math.cos(theta))<1e-14);
  x.x=sx;x.y=sy;draw();assert.match(read(),/ratio.*undefined at the zero class/);
  assert.doesNotMatch(read(),/NaN|Infinity/);
  assert.deepEqual(ann.constrain(.001,.002),[0,0]);
  ann.x=0;ann.y=0;x.x=.9;x.y=-.9;draw();assert.match(read(),/0\.0000/);
});
