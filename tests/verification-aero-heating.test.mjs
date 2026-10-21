import test from 'node:test';import assert from 'node:assert/strict';
import {heatingState,NASA_HEATING_EXAMPLE,EARTH_HEATING_K,RADIATION_SIGMA} from '../content/aero/source-audit-heating.js';
const close=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('The independent NASA course worked example and positive quartic root reproduce the published rounded heat flux/temperature',()=>{
  const {density,radius,speed,emissivity}=NASA_HEATING_EXAMPLE,p=heatingState(density,radius,speed,emissivity);
  assert.ok(Math.abs(p.heatFlux/1e4-13.6)<.05);assert.ok(Math.abs(p.radiationTemperature-1316)<2);
  let lo=0,hi=20000;for(let i=0;i<100;i++){const x=(lo+hi)/2;if(emissivity*RADIATION_SIGMA*x**4<p.heatFlux)lo=x;else hi=x;}close(p.radiationTemperature,(lo+hi)/2);close(p.emitted,p.heatFlux);
});
test('Independent dimensional log expressions, all density/radius/emissivity/speed corners and exact similarity ratios verify the heating and balance scalings',()=>{
  for(const rho of[1e-6,3.1459e-4,.1])for(const R of[.01,1,3])for(const e of[.4,.8,.95])for(const V of[1000,3535,7500,12000]){
    const p=heatingState(rho,R,V,e),q=Math.exp(Math.log(EARTH_HEATING_K)+.5*(Math.log(rho)-Math.log(R))+3*Math.log(V));close(p.heatFlux,q);close(p.emitted,q);close(p.kineticEnthalpy,V*V/2);
    const q2=heatingState(4*rho,4*R,2*V,e/2);close(q2.heatFlux/p.heatFlux,8);close(q2.radiationTemperature/p.radiationTemperature,2);
    assert.ok(Number.isFinite(p.radiationTemperature)&&p.radiationTemperature>0);
  }
});
