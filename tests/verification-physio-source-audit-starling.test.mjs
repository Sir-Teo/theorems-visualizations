import test from 'node:test';import assert from 'node:assert/strict';
import { oncoticPressure, frozenFiltration } from '../content/physio/physio-source-audit-starling.js';
const close=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Documented oncotic polynomial has exact0/7/10 anchors, positive derivative and convexity throughout the selected range',()=>{
 close(oncoticPressure(0),0);close(oncoticPressure(7),25.627);close(oncoticPressure(10),46);
 for(let j=1;j<100;j++){const c=j/10,h=1e-3,f=oncoticPressure;assert.ok((f(c+h)-f(c-h))/(2*h)>0);assert.ok((f(c+h)-2*f(c)+f(c-h))/(h*h)>0);}
});
test('Frozen Starling model at all8 actual Pc/protein/duration corners: independent pressure balance, signed mass and100g-to1kg conversion',()=>{
 for(const p of[0,50])for(const c of[0,10])for(const t of[5,120]){
  const S=frozenFiltration(p,c,t),protein=2.1*c+.16*c*c+.009*c*c*c,net=p-(-3)-protein;
  close(S.balance,-3+protein);close(S.flux,.01*net);close(S.gain,.01*net*t*10);close(frozenFiltration(S.balance,c,t).flux,0);
 }
 close(frozenFiltration(50,0,120).gain,636);close(frozenFiltration(0,10,120).gain,-516);
});
test('Linear frozen extrapolation scales with duration/mass/conductance and changes sign on either side of the exact balance',()=>{
 for(const c of[0,3.5,7,10]){const p=oncoticPressure(c)-3;assert.ok(frozenFiltration(p+1,c,60).gain>0);assert.ok(frozenFiltration(p-1,c,60).gain<0);}
 const A=frozenFiltration(30,7,60),B=frozenFiltration(30,7,120),C=frozenFiltration(30,7,60,{mass:2000}),D=frozenFiltration(30,7,60,{Kf:.02});close(B.gain,2*A.gain);close(C.gain,2*A.gain);close(D.gain,2*A.gain);
});
