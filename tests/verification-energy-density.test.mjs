import test from 'node:test';
import assert from 'node:assert/strict';
import {ENERGY_DENSITY_AUDIT as items,densityRequirementAudit as requirement} from '../content/energy/source-audit-density.shared.js';
const near=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=key=>items.find(x=>x.key===key);
test('fuel LHV conversions and declared density assumptions close independently',()=>{
  // US gallon = 231 cubic inches; international-table Btu, exact inch definition.
  const galL=231*.0254**3*1000,btuJ=1055.05585262;
  const [low,high]=[112114,116090].map(x=>x*btuJ/1e6/galL);
  near(get('gasoline').L,(low+high)/2);near(get('gasoline').kg*.75,get('gasoline').L);
  near(get('diesel').L,128488*btuJ/1e6/galL);near(get('diesel').kg*.84,get('diesel').L);
  near(get('h2-liquid').kg,33.3*3600000/1e6);near(get('h2-liquid').L/get('h2-liquid').kg,.071);near(get('h2-gas').L/get('h2-gas').kg,.040);
  assert.ok(get('h2-system').kg<get('h2-gas').kg/20);near(get('h2-system').kg,1.4*3.6);near(get('h2-system').L,.8*3.6);
});
test('manufacturer battery proxies use their inspected mass and geometric envelopes',()=>{
  // Convert rated coulombs × voltage directly to joules, and use SI geometry.
  const liJ=3.25*3600*3.6,liM3=Math.PI*.0186**2/4*.0653;
  near(get('li').kg,liJ/.0475/1e6);near(get('li').L,liJ/(liM3*1000)/1e6);
  const leadJ=7*3600*12,leadL=.151*.065*.0975*1000;
  near(get('lead').kg,leadJ/2.2/1e6);near(get('lead').L,leadJ/leadL/1e6);
  assert.ok(get('li').kg>get('lead').kg*6);
});
test('nuclear heat reference unit conversions distinguish full fission from chosen burnup',()=>{
  const atomsPerKg=1000/235.0439301*6.02214076e23;
  near(get('u235').kg,atomsPerKg*200e6*1.602176634e-19/1e6);
  near(get('u235').L/get('u235').kg,18.95);
  const thermalJPerTonne=50*1e9*24*60*60;
  near(get('lwr').kg,thermalJPerTonne/1000/1e6);near(get('lwr').L/get('lwr').kg,9.2);
  assert.ok(get('lwr').kg<get('u235').kg/15);
});
test('all target and conversion corners close delivered energy and respect comparison boundaries',()=>{
  for(const target of [100,5000])for(const useful of [false,true])for(let mask=0;mask<8;mask++){
    const options={useful,engine:mask&1?.4:.15,electric:mask&2?.95:.7,fuelcell:mask&4?.65:.3};
    for(const item of items){const r=requirement(item.key,target,options);
      if(useful&&item.group==='nuclear'){assert.equal(r,null);continue;}
      near(r.kg*item.kg*r.eta,target);near(r.L*item.L*r.eta,target);near(r.stored*r.eta,target);
      assert.ok(r.kg>0&&r.L>0&&Number.isFinite(r.kg+r.L));
      const doubled=requirement(item.key,target*2,options);near(doubled.kg,2*r.kg);near(doubled.L,2*r.L);
    }
  }
  assert.throws(()=>requirement('unknown',100));
});
