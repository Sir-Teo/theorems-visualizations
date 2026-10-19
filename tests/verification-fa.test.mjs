import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as M from '../assets/js/viz/math.js';
import a from '../content/fa/ch01-a3.js';
import b from '../content/fa/ch01-a5.js';
import c from '../content/fa/ch03-a4.js';
import d from '../content/fa/ch04-a4.js';

function run(item, initial = {}) {
  const controls = [], stages = []; let draw, read;
  const v = { M, fix: (x,n=3)=>Number(x).toFixed(n), legend() {},
    select(label,options,value) { const q={value:initial[label]??value,set(x){this.value=x}};controls.push(q);return q; },
    slider(label,min,max,value) { const q={value:initial[label]??value,set(x){this.value=x}};controls.push(q);return q; },
    stage(options) {
      const calls=[],handles=[];
      const s=new Proxy({options,calls,handles,handle(x,y,opts={}){
        const h={x,y,set(x,y){if(opts.constrain)[x,y]=opts.constrain(x,y);this.x=x;this.y=y;}};handles.push(h);return h;
      }},{get(t,k){return k in t?t[k]:(...args)=>{calls.push([k,...args]);return s;}}});stages.push(s);return s;
    }, render(f){draw=f},readout(f){read=f},
  };
  item.viz(v);const render=()=>{for(const s of stages)s.calls.length=0;draw();return read()};render();
  return{controls,stages,render};
}
const item=(m,n)=>m.items.find(i=>i.num===n);

test('Rudin1.26 graph model expands distances; its failure examples miss an image limit',()=>{
  const r=run(item(a,'1.26'));
  for(const amp of [0,.4,2]) for(const t of [-1.7,-.2,1.6]){
    r.controls[1].value=amp;r.stages[0].handles[0].set(t,0);r.render();
    const segment=r.stages[0].calls.find(q=>q[0]==='line'&&q.at(-1).color==='gold');
    assert.ok(Math.abs(Math.hypot(segment[3],segment[4])-Math.hypot(t,amp*Math.sin(t)))<1e-12);
    assert.ok(Math.hypot(segment[3],segment[4])>=Math.abs(t));
  }
  for(const mode of ['contract','incomplete']){
    r.controls[0].value=mode;r.controls[2].value=80;const text=r.render();
    assert.match(text,/outside the image/);
    const dots=r.stages[0].calls.filter(q=>q[0]==='dot');
    const limit=dots.find(q=>q.at(-1).hollow)[1], chosen=dots.find(q=>q.at(-1).color==='gold')[1];
    assert.ok(Math.abs(limit-chosen)>0&&Math.abs(limit-chosen)<.013);
  }
});

test('Rudin1.43 quotient by the seminorm kernel preserves values on every coset',()=>{
  const r=run(item(b,'1.43'));
  for(const th of [0,.4,Math.PI/2,2.9])for(const shift of [-3,0,2]){
    r.controls[0].value=th;const u=[Math.cos(th),Math.sin(th)],w=[-u[1],u[0]];
    r.stages[0].handles[0].set(.8+shift*u[0],-.3+shift*u[1]);r.render();
    const projection=r.stages[0].calls.find(q=>q[0]==='dot'&&q.at(-1).color==='gold');
    const signed=.8*w[0]-.3*w[1];
    assert.ok(Math.hypot(projection[1]-signed*w[0],projection[2]-signed*w[1])<1e-12);
  }
  assert.match(item(b,'1.42').name,/Closed plus finite/);
  assert.match(item(b,'1.43').statement,/N=\\\{x:p\(x\)=0/);
});

test('Rudin3.24 nonconvex finite-set demo generates its hull from extreme points of K',()=>{
  const r=run(item(c,'3.24'));
  for(const p of [[.1,.2],[1.9,1.4],[-1.9,-1.4]]){
    r.stages[0].handles[5].set(...p);r.render();
    const H=r.stages[0].calls.find(q=>q[0]==='poly')[1],K=r.stages[0].handles;
    for(const h of H)assert.ok(K.some(p=>Math.hypot(p.x-h[0],p.y-h[1])<1e-12));
    // Every point lies on the same side of each oriented hull edge.
    const area=H.reduce((s,p,i)=>{const q=H[(i+1)%H.length];return s+p[0]*q[1]-p[1]*q[0]},0);
    for(const k of K)for(let i=0;i<H.length;i++){
      const p=H[i],q=H[(i+1)%H.length];
      assert.ok(Math.sign(area)*((q[0]-p[0])*(k.y-p[1])-(q[1]-p[1])*(k.x-p[0]))>=-1e-10);
    }
  }
  assert.match(item(c,'3.24').statement,/Convexity of \$K\$ is not required/);
});


test('Riesz lemma demo keeps its selected representative strictly inside the admissible window',()=>{
  const r=run(item(d,'4.22'));
  for(const p of [1,2,Infinity])for(const rad of [1.01,1.5,2.5])for(const choice of [-1,1]){
    r.controls[0].value=p;r.controls[1].value=rad;r.controls[2].value=choice;r.render();
    const q=r.stages[0].calls.find(q=>q[0]==='dot'&&q.at(-1).label==='x');
    const norm=p===Infinity?Math.max(Math.abs(q[1]),Math.abs(q[2])):(Math.abs(q[1])**p+Math.abs(q[2])**p)**(1/p);
    assert.ok(norm<rad, `p=${p},r=${rad},choice=${choice},norm=${norm}`);
  }
  r.controls[1].value=1;assert.match(r.render(),/lemma requires/);
});
