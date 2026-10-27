import {authorPinBytes} from './wave6-arch-ling-pins.shared.mjs';
import test,{after}from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{createHash}from'node:crypto';
import*as H from'../content/arch/ch06.shared.js';
import chapter from'../content/arch/ch06.js';
import syllabus from'../content/arch/syllabus.js';
import{archSyllabusAtWave5}from'./wave6-arch-preservation.shared.mjs';
const bytes=fs.readFileSync(new URL('./fixtures/wave6-arch-reference.json',import.meta.url)),fixture=JSON.parse(bytes),sha=b=>createHash('sha256').update(b).digest('hex');
const stats={cases:0,comparisons:0,numerical:0,exact:0,maxNormalizedError:0,worst:null};
function compare(a,b,path){
 if(b!==null&&typeof b==='object'){assert.equal(Array.isArray(a),Array.isArray(b),path);assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path+' complete keys');for(const[k,v]of Object.entries(b))compare(a[k],v,path+'.'+k);return;}
 stats.comparisons++;
 if(typeof b!=='number'){assert.deepEqual(a,b,path);stats.exact++;return;}
 assert.equal(typeof a,'number',path);assert.ok(Number.isFinite(a),path);stats.numerical++;const budget=2e-11+3e-11*Math.abs(b),error=Math.abs(a-b)/budget;
 if(error>stats.maxNormalizedError){stats.maxNormalizedError=error;stats.worst={path,actual:a,expected:b,absoluteError:Math.abs(a-b),budget};}assert.ok(error<=1,JSON.stringify({path,a,b,error,budget}));
}
for(const family of Object.keys(fixture.families))test('ARCH6 complete independent '+family+' objects',()=>{for(const row of fixture.cases.filter(r=>r.family===family)){compare(H[family](row.args),row.expected,family+' '+JSON.stringify(row.args));stats.cases++;}});
after(()=>console.log('ARCH6_REFERENCE_STATS '+JSON.stringify(stats)));
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);
test('ARCH6 independent corpus retains all413cases in11families and its certified bytes',()=>{assert.equal(fixture.cases.length,413);assert.equal(Object.keys(fixture.families).length,11);assert.equal(sha(bytes),'90e1f11c96e4dff3fa0e2ba3ac9618af7afdded5f8f775e7ef8fc9bd92466811');for(const[f,n]of Object.entries(fixture.families))assert.equal(fixture.cases.filter(r=>r.family===f).length,n);});
test('ARCH6 all frozen metadata and property absence survive; whole syllabus restores exactly',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-arch-syllabus-before.json',import.meta.url))),rows=before.chapters.find(c=>c.n===6).items,now=syllabus.chapters.find(c=>c.n===6).items;assert.equal(chapter.items.length,11);
 for(let i=0;i<11;i++){const old=rows[i],body=chapter.items[i];for(const key of new Set([...Object.keys(old).filter(k=>!['refs','pic'].includes(k)),'verify','paper','introduces','see'])){assert.equal(Object.hasOwn(body,key),Object.hasOwn(old,key),body.num+' '+key+' presence');assert.deepEqual(body[key],old[key],body.num+' '+key);}assert.deepEqual(body.refs,now[i].refs);assert.equal(body.caption,now[i].pic);assert.equal(typeof body.viz,'function');for(const k of['statement','idea','caption','scope'])assert.ok(body[k].length>60,k);}
 assert.deepEqual(archSyllabusAtWave5(syllabus),before);
 const changed=structuredClone(syllabus);changed.chapters.find(c=>c.n===6).items[0].verify=false;assert.throws(()=>archSyllabusAtWave5(changed));const other=structuredClone(syllabus);other.chapters[0].title+=' changed';assert.throws(()=>archSyllabusAtWave5(other));
});
test('ARCH6 all892 prior raw files and supplemental historical plan witness remain exact',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../docs/verification/wave6-arch-preimages.json',import.meta.url)));assert.equal(Object.keys(p.rawPins).length,894);let n=0;
 for(const[path,hash]of Object.entries(p.rawPins))if(!['content/arch/syllabus.js','tests/wave5-arch.test.mjs'].includes(path)){assert.equal(sha(authorPinBytes(new URL('../'+path,import.meta.url),hash)),hash,path);n++;}assert.equal(n,892);
 for(const[path,hash]of Object.entries(p.supplementalFrozenPlans))assert.equal(sha(fs.readFileSync(new URL('../'+path,import.meta.url))),hash,path);
});
test('ARCH6 historical ARCH5 test reconstructs in full after exactly the metadata adapter',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../docs/verification/wave6-arch-preimages.json',import.meta.url)));let text=fs.readFileSync(new URL('./wave5-arch.test.mjs',import.meta.url),'utf8');
 const imported="import {archSyllabusAtWave5} from './wave6-arch-preservation.shared.mjs';\n",adapted='const restored=archSyllabusAtWave5(syllabus);const non5={...restored,chapters:restored.chapters.filter(c=>c.n!==5)};',original='const non5={...syllabus,chapters:syllabus.chapters.filter(c=>c.n!==5)};';assert.equal(text.split(imported).length,2);assert.equal(text.split(adapted).length,2);text=text.replace(imported,'').replace(adapted,original);assert.equal(sha(text),p.historicalGuardPreimage.sha256);
});
test('ARCH6 curvature analogue conserves volume and exposes a mechanism or numerical-range failure',()=>{
 for(const rise of[0,.01,.3,.7])for(const thin of[.02,.12]){const z=H.curvedStiffness({rise,thin});near(z.volume,2*thin);near(z.axialK,2*thin*rise**2/(1+rise**2)**2);if(rise===0)assert.equal(z.axialDeflection,null);else near(z.axialDeflection*z.axialK,z.force);}
 for(const rise of[Number.MIN_VALUE,1e-170,1e-160,1e-150]){const z=H.curvedStiffness({rise});assert.ok(z.axialDeflection===null||Number.isFinite(z.axialDeflection));}
});
test('ARCH6 actual3D rulings are straight and a hypar generally is not minimal',()=>{
 const z=H.hypar({curvature:1.2,x:.7,y:.6});assert.ok(z.K<0&&Math.abs(z.H)>.01);for(const line of z.rulings){const d=H.sub(line.at(-1),line[0]);for(const p of line)near(H.norm(H.cross(H.sub(p,line[0]),d)),0);}assert.equal(H.hypar({curvature:0}).K,0);assert.equal(H.hypar({x:0}).H,0);
});
test('ARCH6 normal balance permits flat pretension and pressure-supported synclastic curvature',()=>{assert.equal(H.tensionPatch({k1:0,k2:0,pressure:0}).shape,'flat');assert.equal(H.tensionPatch({k1:0,k2:0,pressure:0}).residual,0);const z=H.tensionPatch({k1:-.5,k2:-.5,T1:1,T2:1,pressure:1});assert.equal(z.shape,'synclastic');assert.equal(z.residual,0);});
test('ARCH6 signed pressure balances actual two-sided tangent forces, including a convex inflated patch',()=>{
 const eps=1e-5;
 for(const[k1,k2,T1,T2]of[[.6,-.4,1,2],[-.5,-.5,1,1],[.5,.5,1,1],[0,0,2,3]]){
  // At each side of a circular normal section the outgoing unit tangents
  // have the same vertical component sin(kappa*eps). Divide their force
  // sum by patch width2eps; it converges to +N*kappa along the upward normal.
  const pairs=[[k1,T1],[k2,T2]],internal=pairs.reduce((s,[k,T])=>s+(T*Math.sin(k*eps)+T*Math.sin(k*eps))/(2*eps),0),external=-(T1*k1+T2*k2),z=H.tensionPatch({k1,k2,T1,T2,pressure:external});near(internal+external,0,2e-11);near(z.requiredPressure,external);near(z.residual,0);
 }
 const cap=H.pneumatic({a:1,N:1,alpha:.6}),curvature=-1/cap.small.radius,patch=H.tensionPatch({k1:curvature,k2:curvature,T1:1,T2:1,pressure:cap.pressure});near(patch.residual,0);near(patch.requiredPressure,cap.pressure);
});
test('ARCH6 Scherk identity, shared boundary and area minimum are separate from finite quadrature',()=>{
 for(const a of[0,1e-15,.000101,.8,1.2]){const z=H.minimalGraph({a});assert.equal(z.selected.H,0);near(z.selected.floatingMeanResidual,0);for(const trial of[-.4,.4]){const w=H.minimalGraph({a,trial});assert.deepEqual(w.boundary,z.boundary);assert.ok(w.area>=z.area-1e-10);for(let i=0;i<13;i++)for(const j of[0,12])assert.deepEqual(w.grid[i][j],z.grid[i][j]);}}
});
test('ARCH6 anchored density solve satisfies joint, global force and moment balance',()=>{
 for(const qX of[.25,4])for(const qY of[.25,4]){const z=H.cableNet({qX,qY,load:-2});assert.ok(z.maximumResidual<2e-13);near(H.norm(z.forcePolygon.at(-1)),0);const forces=z.loads.map(f=>[...f]);z.fixed.forEach((k,i)=>forces[k]=H.add(forces[k],z.reactions[i]));near(H.norm(forces.reduce(H.add,[0,0,0])),0);near(H.norm(forces.map((f,i)=>H.cross(z.coordinates[i],f)).reduce(H.add,[0,0,0])),0);const u=[1,-2,3,0,-1,2,1,0,-3];assert.ok(H.dot(u,z.L.map(row=>H.dot(row,u)))>0);}
 const a=H.cableNet({qX:.25}),b=H.cableNet({qX:4});assert.ok(H.norm(H.sub(a.coordinates[a.free[4]],b.coordinates[b.free[4]]))>.1);
});
test('ARCH6 inversion keeps matched-load balance and exposes each changed-load residual',()=>{
 for(const loadChange of[.5,1,1.5]){const z=H.hangingModel({loadChange});z.net.free.forEach((k,i)=>near(z.residuals[i],Math.abs(loadChange-1)*H.norm(z.net.loads[k])));assert.ok(z.compression.every(T=>T<0));}
});
test('ARCH6 relaxation obeys the recurrence, initial zero velocity and a uniform spectral step bound',()=>{
 const z=H.dynamicRelaxation({steps:120});near(z.history[0].kinetic,0);assert.ok(z.frame.errorNorm<z.history[0].errorNorm/10000);for(let n=0;n<120;n++)for(let i=0;i<9;i++){const now=z.history[n],next=z.history[n+1];near(next.z[i]-now.z[i],z.dt*(n===0?z.dt*now.residual[i]/2:(now.z[i]-z.history[n-1].z[i])/z.dt*z.B+z.A*now.residual[i]));}
 const undamped=H.dynamicRelaxation({damping:0,steps:120});assert.ok(undamped.history.some((f,i,a)=>i&&f.kinetic>a[i-1].kinetic+1e-5));assert.ok(undamped.frame.errorNorm>z.frame.errorNorm*100);assert.ok(H.dynamicRelaxation({qX:4,qY:4,dt:.3}).stepFraction<1);
});
test('ARCH6 roof sketch measures stretch while the separate rhombus preserves every side',()=>{for(const shear of[-35,0,35])for(const brace of[false,true]){const z=H.gridshell({shear,brace});z.sideLengths.forEach(x=>near(x,1));if(!brace)assert.equal(z.energy,0);else near(z.energy,.5*(z.diagonal-Math.SQRT2)**2);assert.ok(z.maximumExtension>.1);}near(H.gridshell({rise:0}).maximumExtension,0);});
test('ARCH6 prism self-stress balances all6joints and held twist exposes external forces',()=>{
 for(const radius of[.5,1.5])for(const height of[1,3])for(const prestress of[0,2]){const z=H.tensegrity({radius,height,prestress});assert.equal(z.types.filter(t=>t==='strut').length,3);assert.equal(z.types.filter(t=>t!=='strut').length,9);assert.ok(z.maximumResidual<3e-13);if(prestress>0)assert.ok(z.memberForces.every((f,i)=>z.types[i]==='strut'?f<0:f>0));near(z.symmetricTwistStiffness,3*Math.sqrt(3)*prestress*radius**2);}
 const z=H.tensegrity({twist:10});assert.ok(z.maximumResidual>.1);assert.ok(z.energyChange>0);const e=.001*180/Math.PI,plus=H.tensegrity({twist:e}).energyChange,minus=H.tensegrity({twist:-e}).energyChange;near((plus+minus)/.001**2,H.tensegrity().symmetricTwistStiffness,2e-5);
 const zero=H.tensegrity({prestress:0});assert.ok(zero.memberForces.every(f=>f===0));assert.equal(zero.current.energy,0);assert.equal(zero.energyChange,0);assert.equal(zero.symmetricTwistStiffness,0);assert.ok(H.tensegrity({prestress:0,twist:1e-8}).energyChange>0);assert.ok(H.tensegrity({prestress:1e-20}).memberForces.some(f=>f>0));
});
test('ARCH6 spherical-cap branches obey pressure, geometry and constrained energy classifications',()=>{
 for(const alpha of[.02,.6,.999999999999,1]){const z=H.pneumatic({alpha});for(const record of[z.small,z.large]){near(record.pressureCheck,z.pressure);near(record.area,Math.PI*(z.a**2+record.h**2));near(record.volume,Math.PI*record.h*(3*z.a**2+record.h**2)/6);}assert.ok(z.small.h<=z.a&&z.large.h>=z.a);if(alpha<1){assert.equal(z.small.stability,'minimum');assert.equal(z.large.stability,'maximum');}else assert.equal(z.small.stability,'fold');}
 const zero=H.pneumatic({alpha:0});assert.equal(zero.small.h,0);assert.equal(zero.small.radius,null);assert.equal(zero.large,null);assert.equal(H.pneumatic({alpha:0,branch:'tall'}).selected,null);assert.equal(H.pneumatic({alpha:1.2}).selected,null);
});
test('ARCH6 source-domain evaluation leaves unsupported and unresolved correlations undefined',()=>{
 const outside=H.shellThinness({ratio:50,angle:5});assert.equal(outside.sourceDomain,'outside');assert.equal(outside.factor,null);assert.equal(outside.correlated,null);const a=H.shellThinness({ratio:100}),b=H.shellThinness({ratio:200});near(a.classical/b.classical,4);near(a.spanThickness,2*100*Math.sin(Math.PI/6));const nu=.3,ratio=50,angle=2*Math.asin(1/((12*(1-nu**2))**.25*Math.sqrt(ratio)))*180/Math.PI;const edge=H.shellThinness({ratio,nu,angle});assert.equal(edge.sourceDomain,'unresolved boundary');assert.equal(edge.factor,null);assert.ok(H.shellThinness({ratio:1500,angle:75}).correlationCurve.at(-1)[0]>H.shellThinness({ratio:1500,angle:75}).lambda);
});
test('ARCH6 steep correlation trace has a subpixel vertical interpolation bound across its whole domain',()=>{
 const curve=H.shellThinness().correlationCurve;let worst=0;
 assert.ok(curve[0][0]>2);assert.ok(.94-curve[0][1]<1e-6,'unresolved boundary sliver stays far below a pixel');assert.equal(curve.at(-1)[0],100);
 for(let i=1;i<curve.length;i++){
  const[a,b]=[curve[i-1][0],curve[i][0]],bound=(19.2/a**4)*(b-a)**2/8;
  // For f(lambda)=.14+3.2/lambda², f''=19.2/lambda⁴ decreases on this
  // positive interval. Standard linear-interpolation error is ≤M h²/8.
  worst=Math.max(worst,bound);assert.ok(bound<.0016);
  for(let j=1;j<10;j++){const t=j/10,x=a+t*(b-a),line=curve[i-1][1]+t*(curve[i][1]-curve[i-1][1]);assert.ok(Math.abs(line-(.14+3.2/x**2))<=bound+2e-15);}
 }
 assert.ok(worst*281/.97<.5,'<0.5CSSpixel at largest declared plot height');
 const a=curve.findIndex(p=>p[0]>=2.5),left=curve[a-1],right=curve[a],t=(2.5-left[0])/(right[0]-left[0]),line=left[1]+t*(right[1]-left[1]);assert.ok(Math.abs(line-.652)<.0016);
});
test('ARCH6 finite domains reject nonfinite, fractional, discrete and unsupported tiny-pressure states',()=>{
 for(const[name,key]of[['curvedStiffness','rise'],['hypar','curvature'],['tensionPatch','T1'],['minimalGraph','a'],['cableNet','qX'],['hangingModel','weight'],['dynamicRelaxation','damping'],['gridshell','rise'],['tensegrity','prestress'],['pneumatic','alpha'],['shellThinness','ratio']])for(const bad of[NaN,Infinity,-Infinity,'1',null])assert.throws(()=>H[name]({[key]:bad}),name+' '+key);
 assert.throws(()=>H.cableNet({selected:.5}));assert.throws(()=>H.cableNet({flatBoundary:1}));assert.throws(()=>H.dynamicRelaxation({steps:.5}));assert.throws(()=>H.gridshell({brace:1}));assert.throws(()=>H.pneumatic({alpha:1e-20}));assert.throws(()=>H.pneumatic({branch:'other'}));
});
