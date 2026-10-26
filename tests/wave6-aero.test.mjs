import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/aero/ch06.shared.js';
import * as M from '../assets/js/viz/math.js';
import chapter from '../content/aero/ch06.js';
import syllabus from '../content/aero/syllabus.js';
const oracle=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-aero-reference.json',import.meta.url)));
const at=(o,path)=>path.split('.').reduce((v,k)=>v[k],o);
let comparisons=0,worst=0,worstPhysicalRelative=0;
const close=(a,b,label,tolerance=3e-11)=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');const relative=Math.abs(a-b)/Math.max(1e-270,Math.abs(a),Math.abs(b));worst=Math.max(worst,relative);assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} versus ${b}`);comparisons++;};
function unorderedPoles(actual,expected,label){const rest=actual.map(p=>p.slice());for(const b of expected){let j=0;for(let k=1;k<rest.length;k++)if(Math.hypot(rest[k][0]-b[0],rest[k][1]-b[1])<Math.hypot(rest[j][0]-b[0],rest[j][1]-b[1]))j=k;const a=rest.splice(j,1)[0];close(a[0],b[0],label+' real',2e-9);close(a[1],b[1],label+' imaginary',2e-9);}assert.equal(rest.length,0);}
for(const name of Object.keys(Object.groupBy(oracle.rows,r=>r.name)))test('AERO6 independent reference · '+name,()=>{
 for(const [j,row] of oracle.rows.filter(r=>r.name===name).entries()){
  const z=H[name](row.p),label=name+' '+j+' '+JSON.stringify(row.p);
  for(const[k,b]of Object.entries(row.quantities)){const a=at(z,k);assert.equal(a.sign,b.sign,label+' '+k+' sign');if(b.value===null)assert.ok(a.aboveRange,label+' '+k+' retained above range');else if(b.value===0&&b.sign!==0)assert.ok(a.belowRange,label+' '+k+' retained below range');else {close(a.value,b.value,label+' '+k);if(b.value!==0&&Math.abs(b.value)>1e-270){const error=Math.abs(a.value-b.value)/Math.abs(b.value);worstPhysicalRelative=Math.max(worstPhysicalRelative,error);assert.ok(error<3e-11,label+' '+k+' physical relative error '+error);}}if(b.sign)close(a.logMagnitude,b.logMagnitude,label+' '+k+' log',2e-10);comparisons+=2;}
  for(const[k,b]of Object.entries(row.scalars))close(at(z,k),b,label+' '+k);
  if(row.state)z.state.forEach((a,k)=>close(a,row.state[k],label+' state '+k));
  if(row.A)z.A.forEach((r,k)=>r.forEach((a,l)=>close(a,row.A[k][l],label+' matrix '+k+','+l)));
  if(row.status)assert.equal(z.status??z.poles.status,row.status,label+' status');
  if(row.poles)unorderedPoles(name==='flutter'?z.poles:z.poles.values,row.poles,label+' poles');
  if(name==='lateral'){const E=M.eig(z.A);for(const e of E.values){const p=z.coefficients.map(x=>x.value);const value=p.reduce((s,c,j)=>s.add(e.pow(p.length-1-j).scale(c)),M.cx(0,0));assert.ok(value.abs()<1e-9,'computed pole satisfies retained characteristic coefficients');comparisons++;}}
 }
});
test('AERO6 static translation and neutral point retain exact signs',()=>{
 assert.equal(H.staticAircraft({cg:.5}).cma.sign,0);
 assert.equal(H.staticAircraft({cg:M.nextDown?.(.5)??(.5-Number.EPSILON/4)}).cma.sign,-1);
 assert.equal(H.staticAircraft({cg:.5+Number.EPSILON/2}).cma.sign,1);
 const tiny=H.staticAircraft({tailArea:Number.MIN_VALUE,cg:.25,deltaAlpha:Number.MIN_VALUE});assert.equal(tiny.margin.sign,1);assert.equal(tiny.dMoment.sign,-1);assert.ok(tiny.dMoment.belowRange);assert.equal(tiny.dTail.sign,1);
 for(const h of[.05,.25,.5,.9]){const z=H.staticAircraft({cg:h}),sum=H.Q.add(z.constants.Cmac,H.Q.add(z.wingMoment.exact,z.tailMoment.exact));assert.equal(H.Q.sign(H.Q.sub(sum,z.moment.exact)),0);}
});
test('AERO6 no-tail trim distinguishes absent authority and infeasibility',()=>{
 const a=H.trimAircraft({tailArea:0});assert.equal(a.trim.valid,false);assert.match(a.trim.status,/inconsistent/);assert.equal(a.trim.elevator,null);
 const compatible=H.trimAircraft({tailArea:0,cg:.5,targetLift:.2});assert.match(compatible.trim.status,/nonunique/);assert.equal(compatible.trim.elevator,null);
 const z=H.trimAircraft({tailArea:.25});assert.equal(z.trim.liftResidual.sign,0);assert.equal(z.trim.momentResidual.sign,0);
});
test('AERO6 matrix exponential retains defective coalescence',()=>{
 const z=H.flutter({speed:16,damping:0,time:6});assert.match(z.status,/defective/);const direct=M.matVec(M.expm(z.A.map(r=>r.map(x=>6*x))),z.x0);z.state.forEach((x,j)=>close(x,direct[j],'defective state',3e-11));assert.ok(z.energy.value>H.flutter({speed:16,damping:0,time:0}).energy.value);
 const tiny=H.flutter({speed:16,damping:Number.MIN_VALUE});assert.equal(tiny.margin.sign,1);assert.equal(tiny.status,'asymptotically stable');
});
test('AERO6 rate feedback cannot stabilize positive bare pitch stiffness',()=>{
 for(const rateGain of[0,.1,1,4]){const z=H.feedback({cg:.65,mode:'rate only',rateGain});assert.equal(z.effectiveStiffness.sign,-1);assert.equal(z.poles.status,'unstable');assert.ok(z.poles.values.some(p=>p[0]>0));}
 assert.equal(H.feedback({cg:.65,mode:'attitude + rate',attitudeGain:2}).poles.status,'asymptotically stable');
});
test('AERO6 phugoid energy derivative and pulse continuity',()=>{
 const z=H.phugoid(),[u,gamma]=z.state,dx=H.mv(z.A,z.state),d=-z.A[0][0],derivative=u*dx[0]+z.parameters.speed**2/2*gamma*dx[1];close(derivative,-d*u*u,'positive mode energy dissipation');
 const a=H.shortPeriod({time:.5}),b=H.shortPeriod({time:.5+1e-10});a.state.forEach((x,j)=>close(x,b.state[j],'pulse switch continuous',1e-10));
});
test('AERO6 invalid model inputs are rejected',()=>{
 for(const[name,p]of[['staticAircraft',{cg:NaN}],['staticAircraft',{tailArea:-1}],['phugoid',{speed:0}],['shortPeriod',{pulse:0}],['directional',{fin:3}],['lateral',{dihedral:-1}],['feedback',{mode:'rate magic'}],['flutter',{damping:-.1}],['wright',{interference:2}]])assert.throws(()=>H[name](p));
});
test('AERO6 frozen identities, complete teaching content, chapter-local researched metadata',()=>{
 const frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='aero').items,outline=syllabus.chapters.find(c=>c.n===6).items;
 assert.equal(chapter.items.length,11);assert.equal(outline.length,11);
 chapter.items.forEach((item,j)=>{for(const k of['num','kind','name','deps','paper','introduces','verify','see'])assert.deepEqual(item[k],frozen[j][k],item.num+' '+k);for(const k of['num','kind','name','deps','refs'])assert.deepEqual(item[k],outline[j][k]);assert.equal(item.caption,outline[j].pic);for(const k of['statement','idea','caption','scope'])assert.ok(item[k].length>120,item.num+' complete '+k);assert.equal(typeof item.viz,'function');assert.ok(item.refs.length);});
});
test('AERO6 syllabus changes only its researched refs and captions',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-aero-syllabus-before.json',import.meta.url)));
 const omit=c=>c.n!==6?c:{...c,items:c.items.map(({refs,pic,...rest})=>rest)};
 assert.deepEqual({...syllabus,chapters:syllabus.chapters.map(omit)},{...before,chapters:before.chapters.map(omit)});
});
test.after(()=>console.log(JSON.stringify({referenceCases:oracle.rows.length,comparisons,worstPhysicalRelative,maxRelativeIncludingNearZeroAndLogDiagnostics:worst,note:'absolute-plus-relative numerical tolerance; exact quantity signs and range statuses checked separately'})));
