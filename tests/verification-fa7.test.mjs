import {test} from 'node:test';import assert from 'node:assert/strict';import * as M from '../assets/js/viz/math.js';
import sobolev from '../content/fa/ch07-a3.js';import tempered from '../content/fa/ch07-a2.js';
function read(item,{selection,sliders={}}={}){
 let output;const render=[];const stage=()=>new Proxy({}, {get:()=>()=>{}});
 const v={M,stage,select:(_,options,value)=>({value:selection??value}),slider:(name,a,b,value)=>({value:sliders[name]??value}),legend(){},render:fn=>render.push(fn),readout:fn=>output=fn,fix:(x,n)=>x.toFixed(n),fmt:(x,n)=>x.toFixed(n),sci:(x,n)=>x.toExponential(n)};
 item.viz(v);render.forEach(fn=>fn());return output();
}
test('the actual Sobolev illustration recognizes beta=0 as the constant H1 function',()=>{
 const r=read(sobolev.items.find(x=>x.num==='7.25'),{sliders:{'$\\beta$ in $|x|^\\beta$':0}});
 assert.match(r,/L\^2\(-1,1\).*0\.000/);assert.doesNotMatch(r,/not even bounded|notin L/);
});
test('the actual exponential probe uses normalized Lebesgue measure',()=>{
 const item=tempered.items.find(x=>x.num==='7.11'),r=read(item,{selection:'exp'});
 const c=Number(r.match(/at \$c=([\d.]+)/)[1]);
 const expected=(Math.exp(c+1/8)/2).toExponential(3);
 assert.ok(r.includes(expected),`${expected}: ${r}`);
});
