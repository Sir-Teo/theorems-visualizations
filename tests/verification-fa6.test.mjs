import {test} from 'node:test';import assert from 'node:assert/strict';import * as M from '../assets/js/viz/math.js';
import derivatives from '../content/fa/ch06-a2.js';
function mount(item,k){
 const callbacks=[],stages=[];let read;const stage=()=>{const s=new Proxy({handle:(x,y)=>({x,y})},{get:(o,key)=>key in o?o[key]:()=>{}});stages.push(s);return s;};
 const v={M,stage,select:(_,o,value)=>({value:k??value}),slider:(_,lo,hi,value)=>({value}),legend(){},render:fn=>callbacks.push(fn),readout:fn=>read=fn,fmt:(x,n)=>x.toFixed(n),fix:(x,n)=>x.toFixed(n),sci:(x,n)=>x.toExponential(n)};
 item.viz(v);callbacks.forEach(f=>f());return read();
}
test('the actual BV derivative picture retains jump mass and the derived second derivative dipole',()=>{
 const item=derivatives.items.find(x=>x.num==='6.14');
 assert.equal(item.kind,'Model');assert.match(item.statement,/Stieltjes/);
 for(const k of[1,2]){
  const r=mount(item,k),a=Number(r.match(/dx = ([\d.e+-]+)/)[1]),b=Number(r.match(/\(sum \$([\d.e+-]+)/)[1]);
  assert.ok(Math.abs(a-b)<3e-4,`${k}: ${r}`);assert.match(r,/classical derivative alone misses/);
 }
});
test('one compact convolution factor does not suffice for three-factor associativity',()=>{
 // Rudin Chapter 6 Exercise 24: with H'=δ, δ'*H=δ, while 1*δ'=0.
 // H and the constant 1 are noncompact. Both parenthesizations exist,
 // yet give respectively the constant1 and zero.
 const phi=x=>Math.exp(-x*x),dphi=x=>-2*x*phi(x),A=8,N=20000,h=2*A/N;
 let integral=0,derivativeIntegral=0;for(let j=0;j<N;j++){const x=-A+(j+.5)*h;integral+=h*phi(x);derivativeIntegral+=h*dphi(x);}
 assert.ok(Math.abs(derivativeIntegral)<1e-12);assert.ok(integral>1.7);
});
