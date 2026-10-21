import test from 'node:test';import assert from 'node:assert/strict';
import { heartVector, projectLead, leadAxis } from '../content/physio/physio-source-audit-ecg.js';
const close=(a,b,e=1e-12)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Potential-difference identity needs neither an equilateral body nor a dipole: arbitrary electrode potentials',()=>{
 for(let k=0;k<200;k++){const ra=3*Math.sin(k),la=2*Math.cos(k*.7),ll=k/15;const I=la-ra,II=ll-ra,III=ll-la;close(I+III,II);}
});
test('Actual equilateral lead-axis geometry independently reproduces electrode-potential differences for all601 vector angles',()=>{
 const ra=[-1.15,.7],la=[1.15,.7],ll=[0,.7-Math.sqrt(3)*1.15],phi=(h,x)=>(h[0]*x[0]+h[1]*x[1])/2.3;
 close(Math.hypot(ll[0]-ra[0],ll[1]-ra[1]),2.3);close(Math.hypot(ll[0]-la[0],ll[1]-la[1]),2.3);
 for(let k=0;k<=600;k++){const H=[2*Math.cos(k*.1),2*Math.sin(k*.1)];close(projectLead(H,0),phi(H,la)-phi(H,ra));close(projectLead(H,60),phi(H,ll)-phi(H,ra));close(projectLead(H,120),phi(H,ll)-phi(H,la));}
});
test('Complete model waveforms preserve Einthoven identity across211 slider angles×801 time samples and rotate without changing magnitude',()=>{
 for(let rot=-120;rot<=90;rot++)for(let j=0;j<=800;j++){const H=heartVector(j/1000,rot),B=heartVector(j/1000,0);close(projectLead(H,0)+projectLead(H,120),projectLead(H,60));close(Math.hypot(...H),Math.hypot(...B));}
 for(const a of[0,60,120]){const u=leadAxis(a),h=[-u[1],u[0]];close(projectLead(h,a),0);}
});
test('QRS model mean direction rotates by exactly the selected angle, avoiding unsupported clinical classification',()=>{
 function axis(rot){let x=0,y=0;for(let t=.055;t<.13;t+=.001){const h=heartVector(t,rot,['Q','R','S']);x+=h[0];y+=h[1];}return Math.atan2(-y,x)*180/Math.PI;}
 const base=axis(0);for(const rot of[-120,-60,0,30,90])close(axis(rot),base+rot);
});
