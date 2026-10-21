import test from 'node:test';import assert from 'node:assert/strict';
import {SMEATON_UNDER,SMEATON_OVER,SMEATON_SAILS,SMEATON_ANGLES,smeatonWater,smeatonWind,wheelPower,waterWheels} from '../content/tech/source-audit-power.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('actual printed-column corrections remain independent of rounded ratios',()=>{
 assert.equal(SMEATON_UNDER.length,27);assert.equal(SMEATON_OVER.length,16);assert.deepEqual(SMEATON_UNDER[10],[4800,1505,3.075]);assert.deepEqual(SMEATON_OVER[1],[1530,1360,1060,6.9,7.8]);
 // Separate readings of the source's effect column, not an effect reconstructed from its printed ratio.
 assert.deepEqual(SMEATON_UNDER.map(x=>x[1]),[1411,1266,1044,901.4,735.7,561.8,442.5,328,213.7,117,1505,1223,975,774,549,390,212,1210,878,541,317,1006,686,385,783,450,534]);
 assert.deepEqual(SMEATON_OVER.map(x=>x[2]),[556,1060,1167,1245,1500,1476,1868,1755,1914,2221,1230,2153,2846,1466,2467,2981]);
 for(const basis of['whole','wheel']){const p=smeatonWater(basis,11,2);assert.notEqual(p.selectedUnder.ratio,.3075);assert.ok(Math.abs(p.selectedUnder.residual)>.05);assert.equal(p.selectedOver.effect,1060);}
});
test('all forty-three sets retain their denominator, arithmetic residual and unweighted finite mean',()=>{
 for(const basis of['whole','wheel']){const p=smeatonWater(basis,27,16);let s=0,t=0;for(let i=0;i<27;i++){const [P,E,r]=SMEATON_UNDER[i],a=p.under[i];near(a.ratio*P,E);near(a.residual+r,10*E/P);s+=E/P;}for(let i=0;i<16;i++){const row=SMEATON_OVER[i],a=p.over[i],P=row[basis==='whole'?0:1];near(a.ratio*P,row[2]);near(a.residual+row[basis==='whole'?3:4],10*row[2]/P);t+=row[2]/P;assert.ok(a.residual>p.residualY[0]&&a.residual<p.residualY[1]);}near(p.meanUnder,s/27);near(p.meanOver,t/16);assert.equal(p.selectedUnder.row,27);assert.equal(p.selectedOver.row,16);}
 for(let u=1;u<=27;u++)assert.equal(smeatonWater('whole',u,1).selectedUnder.row,u);
 for(let o=1;o<=16;o++)assert.equal(smeatonWater('whole',1,o).selectedOver.row,o);
});
test('nineteen sail products retain cloth-area confounding and six footnote stations are exact complements',()=>{
 const products=[318,441,464,462,462,518,527,442,553,585,639,634,580,799,820,799,762,1059,1165];assert.deepEqual(SMEATON_SAILS.map(r=>r[3]),products);assert.deepEqual(SMEATON_ANGLES,[18,19,18,16,12.5,7]);
 for(let row=1;row<=19;row++)for(const basis of['product','area']){const p=smeatonWind(row,basis,'plane'),q=smeatonWind(row,basis,'axis');for(let i=0;i<19;i++){const area=i<13?404:i<17?505:i===17?854:1146;near(p.points[i][1],basis==='product'?products[i]:products[i]/area);assert.ok(p.points[i][1]>p.y[0]&&p.points[i][1]<p.y[1]);}assert.deepEqual(p.selected,p.points[row-1]);for(let i=0;i<6;i++){near(p.angles[i][0],(i+1)/6);near(p.angles[i][1]+q.angles[i][1],90);}}
 assert.ok(1165/1146<820/505,'largest raw product is not largest product per cloth area');
});
test('one-direction impulse model has its own analytical half-jet optimum and explicit captured-flow factor',()=>{
 for(const H of[1,4.123456789,10])for(const Q of[.05,.23456789,1]){const v=Math.sqrt(19.62*H),u=v/2,P0=9810*Q*H;near(wheelPower('under',u,H,Q),.375*P0);near(wheelPower('under',v,H,Q),0);near(wheelPower('under',15,H,Q),0);for(const f of[0,.123456789,.5,.9,1])near(wheelPower('under',f*v,H,Q)/P0,1.5*f*(1-f));}
});
test('all authored wheel powers obey the energy ceiling, full-grid bounds and exact flow scaling',()=>{
 for(const H of[1,2.23456789,10])for(let i=0;i<=600;i++){const u=i/40;for(const kind of['under','breast','over']){const P=wheelPower(kind,u,H,.05),Q=wheelPower(kind,u,H,1);near(20*P,Q);assert.ok(P>=0&&P<=9810*.05*H+1e-8);}}
 for(const H of[1,4.123456789,10])for(const Q of[.05,1])for(const kind of['under','breast','over']){const p=waterWheels(H,Q,15,5,kind);assert.equal(p.u,15,'no hidden jet-speed clamp');p.curves.forEach((c,i)=>{assert.equal(c.length,601);assert.equal(c[0][0],0);assert.equal(c.at(-1)[0],15);let peak=-Infinity;for(const[x,y]of c){near(y,Math.max(0,wheelPower(['under','breast','over'][i],x,H,Q))/p.available);peak=Math.max(peak,y);}near(p.peaks[i][1],peak);});}
});
test('diagram uses physical radius and elapsed time while numerical power does not depend on phase',()=>{
 for(const H of[1,3.123456789,10])for(const u of[0,.123456789,15])for(const kind of['under','breast','over']){const a=waterWheels(H,.2,u,0,kind),b=waterWheels(H,.2,u,5,kind);near(b.radius,H*(kind==='breast'?.4:.45));near(b.phase*b.radius,(kind==='over'?1:-1)*u*5);assert.equal(a.phase===0,true);assert.deepEqual(a.power,b.power);}
});
test('finite source and authored domains reject malformed saved values',()=>{
 for(const a of[['bad'],['whole',0],['whole',1,17],['wheel',1.5]])assert.throws(()=>smeatonWater(...a),RangeError);
 for(const a of[[0],[20],[1,'bad'],[1,'area','bad']])assert.throws(()=>smeatonWind(...a),RangeError);
 for(const a of[[0],[11],[1,0],[1,.2,16],[1,.2,1,6],[1,.2,1,1,'bad']])assert.throws(()=>waterWheels(...a),RangeError);
});
