import test from 'node:test';
import assert from 'node:assert/strict';
import chapter from '../content/geog/ch02.js';

function widget(){
 const controls=[],stages=[],labels=[];let draw,read;
 const ctl=value=>{const c={value};controls.push(c);return c};
 const v={legend(){},slider(l,a,b,x){return ctl(x)},toggle(l,x){return ctl(x)},stage(){const handles=[];const s=new Proxy({handles,handle(x,y,o){const h={x,y,...o};handles.push(h);return h},text(t,...a){labels.push({t,a})}},{get:(t,k)=>k in t?t[k]:()=>s});stages.push(s);return s},render(f){draw=f},readout(f){read=f}};
 chapter.items.find(x=>x.num==='2.4').viz(v);
 return {controls,labels,stages,setLatitude(phi){stages[0].handles[0].constrain(Math.cos(phi*Math.PI/180),Math.sin(phi*Math.PI/180))},draw(){labels.length=0;draw()},read:()=>read()};
}
test('navigation visibility follows geometric altitude on both sides of the equator',()=>{
 const w=widget();w.setLatitude(-.3);w.controls[1].value=0;w.draw();
 assert.match(w.read(),/Polaris: altitude 0\.360°/);assert.doesNotMatch(w.read(),/Polaris:.*not above/);assert.ok(w.labels.some(x=>x.t==='Polaris 0.36°'));
 w.controls[1].value=180;w.draw();assert.match(w.read(),/Polaris: geometric altitude -0\.960°.*not above/);
 w.setLatitude(.3);w.draw();assert.match(w.read(),/Polaris: geometric altitude -0\.360°.*not above/);
 w.setLatitude(-1);w.controls[1].value=0;w.draw();assert.match(w.read(),/Polaris: geometric altitude -0\.340°.*not above/);
});
test('navigation rejects a noon-Sun observation below the horizon in polar night',()=>{
 const w=widget();w.setLatitude(80);w.controls[0].value=355;w.draw();assert.match(w.read(),/Noon Sun: geometric altitude -13\.\d+°.*no usable noon-altitude observation/);
});
