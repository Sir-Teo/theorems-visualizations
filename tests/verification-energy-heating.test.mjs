import test from 'node:test';
import assert from 'node:assert/strict';
import {HEATING_FUELS_AUDIT as fuels,fuelHeatingAudit as heat,FUEL_LATENT_AUDIT as latent} from '../content/energy/source-audit-heating.shared.js';
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('selected formation data reproduce independent reaction enthalpy arithmetic',()=>{
  const expected=[[285.830,241.826],[890.570,802.562],[2219.150,2043.134],[5470.250,5074.214]];
  fuels.slice(0,4).forEach((f,i)=>{const q=heat(f);near(q.hhv*f.M,expected[i][0]);near(q.lhv*f.M,expected[i][1]);});
  near(heat(fuels[0]).hhv,141.78919380121832);near(heat(fuels[0]).lhv,119.96051352263031);
});
test('HHV minus LHV equals the full water phase-change enthalpy on either mass basis',()=>{
  near(latent,44.004/18.01528);
  for(const f of fuels)for(const M of [0,.2,.5,.6]){const q=heat(f,M);near(q.hhv-q.lhv,latent*q.mw);assert.ok(q.hhv>q.lhv&&q.lhv>0);}
});
test('burner mass closes with ash and liquid feed moisture included',()=>{
  for(const f of fuels)for(const M of [0,.3,.6]){const q=heat(f,M);near(1+q.o2,q.co2+q.mw+q.ash,2e-6);assert.ok(q.o2>0);}
  const coal=heat(fuels[4]),wood=heat(fuels[5],.5);
  near(coal.ash,.05);near(wood.ash,.02);
  // Independent elemental oxygen budget: oxygen mass demanded in products,
  // less oxygen already present in dry fuel and its liquid moisture.
  for(const f of fuels.slice(4))for(const M of [0,.5,.6]){
    const wet=f.key==='wood'?M:0,dry=1-wet,q=heat(f,M);
    const oxygenForCarbon=f.c*dry*31.9988/12.0107,oxygenForHydrogen=f.h*dry*15.9994/2.01588;
    near(q.o2,oxygenForCarbon+oxygenForHydrogen-f.o*dry,2e-6);
  }
});
test('wet wood loses sensible fuel fraction plus vaporization of incoming water',()=>{
  const dry=heat(fuels[5],0),half=heat(fuels[5],.5);
  near(half.hhv,dry.hhv/2);near(half.lhv,dry.lhv/2-latent/2);
  assert.ok(half.lhv<dry.lhv/2);
  for(const eta of [.6,.9,1])near((eta*dry.hhv/dry.lhv)*dry.lhv,eta*dry.hhv);
});
