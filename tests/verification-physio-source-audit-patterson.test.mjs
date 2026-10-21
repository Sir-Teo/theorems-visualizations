import test from'node:test';import assert from'node:assert/strict';
import{heartBeat}from'../content/physio/ch03.shared.js';import{restoreOutput,reservoirPressure}from'../content/physio/physio-source-audit-patterson.js';
const close=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Output inversion independently solves analytic monotone response and honestly rejects targets outside the pressure bracket',()=>{
 const f=p=>({CO:9*(1-Math.exp(-p/8)),EDV:50+2*p});for(const target of[2,4,6,8]){const r=restoreOutput(f,target),expected=-8*Math.log(1-target/9);close(r.Pv,expected);close(r.EDV,50+2*expected);close(r.CO,target);}assert.equal(restoreOutput(f,.1),null);assert.equal(restoreOutput(f,9),null);
});
test('Rounded reservoir conversion and actual model at all4 height/resistance corners; recovered target residual is below1e-6L/min',()=>{
 close(reservoirPressure(1),.7356);const base=heartBeat({Pv:reservoirPressure(14),R:1.25,HR:75});
 for(const R of[.7,2.6]){const f=Pv=>heartBeat({Pv,R,HR:75}),need=restoreOutput(f,base.CO);assert.ok(need&&need.Pv>=2&&need.Pv<=26);close(f(need.Pv).CO,base.CO,1e-7);assert.ok(f(need.Pv-.01).CO<base.CO&&f(need.Pv+.01).CO>base.CO);for(const height of[3,32]){const B=f(reservoirPressure(height));assert.ok(B.CO>0&&B.EDV>B.ESV);close(B.CO,B.SV*75/1000);}}
});
test('Higher model arterial load requires higher solved filling and end-diastolic volume; these are independently adjusted pressure curves, not fixed-inflow data',()=>{
 const base=heartBeat({Pv:reservoirPressure(14),R:1.25,HR:75}),A=restoreOutput(Pv=>heartBeat({Pv,R:.7,HR:75}),base.CO),B=restoreOutput(Pv=>heartBeat({Pv,R:2.6,HR:75}),base.CO);assert.ok(B.Pv>A.Pv&&B.EDV>A.EDV);
});
