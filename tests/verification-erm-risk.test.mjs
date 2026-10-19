import test from 'node:test';
import assert from 'node:assert/strict';
import chapter from '../content/ml/ch02.js';
import {makeDens, RECT, disagree, drawSample, rand, hashStr} from '../content/ml/ch02.shared.js';

function widget() {
  const controls=[],stages=[],buttons=new Map();let draw,read;
  const v={rgb:()=>[0,0,0],legend(){},slider(l,a,b,value){const c={value};controls.push(c);return c},button(l,f){buttons.set(l,f)},stage(){const handles=[];const s=new Proxy({handles,handle(x,y){const h={x,y,set(x,y){this.x=x;this.y=y}};handles.push(h);return h}},{get:(t,k)=>k in t?t[k]:()=>s});stages.push(s);return s},render(f){draw=f},readout(f){read=f}};
  chapter.items.find(x=>x.num==='2.1b').viz(v);
  return {controls,stages,buttons,draw:()=>draw(),read:()=>read()};
}
test('ERM visualization separates clean-rule error from independently flipped fresh-label risk',()=>{
  const w=widget(),d=makeDens(.5,.5,.45),f=RECT(.2,.3,.8,.75),h=RECT(.25,.4,.7,.7),clean=disagree(h,f,d);
  for(const eta of [0,.1,.3]){w.controls[1].value=eta;w.draw();const text=w.read();assert.ok(text.includes(`L_{\\rm noisy}(h)=${(eta+(1-2*eta)*clean).toFixed(3)}`));assert.ok(text.includes(`L_{\\mathcal D,f}(h)=${clean.toFixed(3)}`));assert.doesNotMatch(text,/NaN|undefined/)}
});
test('ERM button reaches an empty optimum for an all-negative sample',()=>{
  const w=widget(),d=makeDens(.5,.5,.45),f=RECT(.2,.3,.8,.75);w.controls[0].value=6;
  let seed=1;while(seed<1000){const S=drawSample(d,rand(hashStr('b'+seed)),6,f);if(S.L.every(x=>x===0))break;seed++;w.buttons.get('New sample')()}
  assert.ok(seed<1000,'deterministic all-negative sample exists');w.draw();w.buttons.get('ERM: snap to the best rectangle')();w.draw();
  assert.deepEqual(w.stages[0].handles.map(h=>[h.x,h.y]),[[0,0],[0,0]]);assert.match(w.read(),/L_S\(h\)=0\/6/);assert.match(w.read(),/it is an ERM output/);
});
