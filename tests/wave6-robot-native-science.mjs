import assert from 'node:assert/strict';
import * as H from '../content/robot/ch06.shared.js';
const {Q}=H;
const providers=[null,H.rigidBody,H.prescribedMotion,H.massEllipse,H.prescribedMotion,H.recursiveDynamics,H.taskDynamics,H.gearedDynamics,H.freeElbow,H.constrainedDynamics];
const functions=[null,'rigidBody','prescribedMotion','massEllipse','prescribedMotion','recursiveDynamics','taskDynamics','gearedDynamics','freeElbow','constrainedDynamics'];
const quantity=x=>typeof x==='number'?H.quantity(x):x;
const abs=x=>Q.sign(x)<0?Q.neg(x):Q.exact(x);
const unit=xs=>{let m=Q.ZERO;for(const x of xs.filter(Boolean)){const a=abs(quantity(x).exact);if(Q.sign(Q.sub(a,m))>0)m=a;}return H.quantity(Q.sign(m)?m:1);};
const ratio=(x,s)=>Q.approximate(Q.div(quantity(x).exact,s.exact));
const cache=new Map();
function expectedState(id,p){const key=id+JSON.stringify(p);if(!cache.has(key)){if(cache.size>12000)cache.clear();cache.set(key,providers[id](p));}return cache.get(key);}
export function robotScience(id,capture){
 let comparisons=0;
 const near=(a,b,label,rel=3e-11,absolute=3e-12)=>{comparisons++;assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=Math.max(absolute,rel*Math.max(Math.abs(a),Math.abs(b))),`${label}: ${a} versus ${b}`);};
 const eq=(a,b,label)=>{comparisons++;assert.deepEqual(a,b,label);};
 const expected=expectedState(id,capture.model.parameters);eq(capture.modelName,functions[id],'actual provider');
 const packed=x=>{if(Array.isArray(x))return x.map(packed);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>k!=='exact').map(([k,v])=>[k,packed(v)]));return x;};
 function compare(a,b,path='model'){
  if(b&&typeof b==='object'&&'exact'in b&&'sign'in b){
   assert.ok(a&&typeof a.value==='number',path+' quantity');
   const geometric=/worldAngularMomentum|referenceAngularMomentum|worldAngularVelocity/.test(path),residual=/energyResidual|relativeInvariantResidual/.test(path);
   if(geometric||residual){const scale=Math.max(1,expected.momentumMagnitude?.value??0,expected.energy?.value??0);near(a.value,b.value,path,id===8?2e-9:3e-11,scale*(id===8?2e-9:3e-11));return;}
   if(Number.isFinite(b.value))near(a.value,b.value,path,id===8?2e-9:3e-11,2*Number.MIN_VALUE);else eq(a.value,b.value,path+' overflow');
   for(const k of['sign','belowRange','aboveRange'])eq(a[k],b[k],path+'.'+k);
   if(b.sign)near(a.logMagnitude,b.logMagnitude,path+' log',0,3e-9);else eq(a.logMagnitude,-Infinity,path+' zero log');return;
  }
  if(Array.isArray(b)){eq(a?.length,b.length,path+' length');b.forEach((x,i)=>compare(a[i],x,path+'.'+i));return;}
  if(b&&typeof b==='object'){for(const[k,v]of Object.entries(b))if(k!=='exact')compare(a?.[k],v,path+'.'+k);return;}
  if(typeof b==='number')near(a,b,path,id===8?2e-9:3e-11);else eq(a,b,path);
 }
 compare(capture.model,expected);
 const armStages=id===1?[]:id===5?[0,1]:[0];
 for(const j of armStages){const s=capture.stages[j];near(s.sx,s.sy,'physical x/y scale',3e-12);const rods=s.lines.filter(a=>a.style.width===6);eq(rods.length,2,'two physical rods');eq(rods.map(r=>r.style.color),['teal','blue'],'distinct consistent rod colors');assert.ok(capture.palette.teal&&capture.palette.blue&&capture.palette.teal!==capture.palette.blue,'actual theme colors differ');rods.forEach((r,k)=>r.points.forEach((p,l)=>p.forEach((x,m)=>near(x,expected.geometry.joints[k+l][m],'physical joint'))));const centres=s.dots.filter(d=>d.style.r===3.5);eq(centres.length,2,'two centres of mass');centres.forEach((d,k)=>d.points[0].forEach((x,m)=>near(x,expected.geometry.centres[k][m],'physical COM')));}
 const E=x=>x===null?null:quantity(x);
 const negative=x=>H.quantity(Q.neg(x.exact));
 let ledgers=[];
 if(id===1)ledgers=[[1,[expected.rotationalEnergy,expected.translationalEnergy,expected.work,H.quantity(Q.sub(expected.energy.exact,expected.initialEnergy.exact))]]];
 if(id===2){const both=[...expected.inertialTorque,...expected.coriolis,...expected.gravityTorque,...expected.torque],common=unit(both);ledgers=[0,1].map(i=>[i+1,[expected.inertialTorque[i],expected.coriolis[i],expected.gravityTorque[i],expected.torque[i]],common]);}
 if(id===4)ledgers=[[3,[expected.massRatePower,negative(expected.couplingPower),H.quantity(Q.sub(expected.massRatePower.exact,expected.couplingPower.exact))]]];
 if(id===5){const k=expected.parameters.step;ledgers=[[2,[k>=4?expected.recursiveTorque[0]:null,expected.torque[0],k>=3?expected.recursiveTorque[1]:null,expected.torque[1]]]];}
 if(id===7)ledgers=[[1,[expected.mass[0][0],expected.mass[1][1],expected.reflected1,expected.reflected2]]];
 if(id===8)ledgers=[[2,[expected.shoulderCoriolis,expected.shoulderCentripetal,expected.elbowCentripetal,expected.shoulderTorque]]];
 if(id===9){const bad=expected.status.startsWith('degenerate');ledgers=[[2,[expected.freeNormalAcceleration,bad?null:H.quantity(Q.sub(expected.normalAcceleration.exact,expected.freeNormalAcceleration.exact)),bad?null:expected.normalAcceleration]]];}
 for(const[j,values,shared]of ledgers){const s=capture.stages[j],scale=shared??unit(values);eq(s.ledger?.rows.length,values.length,'physical ledger rows');eq(s.ledger.unit,({1:'J',2:'N m',4:'W',5:'N m',7:'kg m²',8:'N m',9:'m/s²'})[id],'physical ledger units');compare(s.ledger.scale,scale,'ledger scale');let rect=0;values.forEach((value,k)=>{if(value===null){eq(s.ledger.rows[k][1],null,'undefined ledger row');return;}compare(s.ledger.rows[k][1],value,'ledger physical quantity');const r=s.rects[rect++],end=.92*ratio(value,scale);near(r.points[0][0],Math.min(0,end),'signed bar start');near(r.points[1][0],Math.max(0,end),'signed bar end');});}
 if(id===1){const s=capture.stages[0],p=expected.parameters;eq(s.kind,'stage3d','actual rotatable 3D stage');assert.ok(s.meshes[0]?.points.length>500);for(const x of s.meshes[0].points){const b=expected.rotation[0].map((_,i)=>expected.rotation.reduce((sum,row,k)=>sum+row[i]*x[k],0));near((b[0]**2+b[1]**2)/p.radius**2+b[2]**2/p.axialRadius**2,1,'physical ellipsoid surface',3e-11);}
  eq(s.arrows.filter(a=>a.style.color==='gold').length,expected.momentumMagnitude.sign?1:0,'nonzero angular-momentum cue');
  const arc=s.paths.filter(p=>p.style.color==='orange'&&p.points.length===65);eq(arc.length,p.mode==='wrench'&&p.torque!==0?1:0,'applied torque cue');if(arc.length){for(const x of arc[0].points){near(Math.hypot(x[0],x[1]),1.17*p.radius,'coaxial torque arc');near(x[2],0,'coaxial plane');}const a=arc[0].points.at(-2),b=arc[0].points.at(-1);eq(Math.sign(a[0]*b[1]-a[1]*b[0]),Math.sign(p.torque),'right-hand applied torque sense');}
 }
 if(id===3||id===6){const s=capture.stages[1],p=expected.parameters,axes=id===3?expected.ellipse.axes.map(quantity):[H.quantity(Q.mul(p.force,expected.responseEigenMax.exact)),H.quantity(Q.mul(p.force,expected.responseEigenMin.exact))],scale=unit(axes),angle=id===3?expected.ellipse.angle:expected.responseEllipse.angle;compare(capture.plotUnit,scale,'ellipse declared axis unit');const contour=s.paths.find(p=>p.points.length===121);assert.ok(contour,'actual ellipse contour');const c=Math.cos(angle),d=Math.sin(angle);for(const[x,y]of contour.points){const a=x*c+y*d,b=-x*d+y*c,major=ratio(axes[0],scale),minor=ratio(axes[1],scale);if(major>0&&minor>1e-7)near((a/major)**2+(b/minor)**2,1,'ellipse quadratic contour',3e-8,3e-8);else{assert.ok(Math.abs(b)<=minor+3e-12);comparisons++;}if(id===3&&p.energy>0){const vel=[Q.mul(x,scale.exact),Q.mul(y,scale.exact)],energy=Q.div(Q.add(Q.mul(vel[0],Q.add(Q.mul(expected.mass[0][0].exact,vel[0]),Q.mul(expected.mass[0][1].exact,vel[1]))),Q.mul(vel[1],Q.add(Q.mul(expected.mass[1][0].exact,vel[0]),Q.mul(expected.mass[1][1].exact,vel[1])))),2);near(Q.approximate(Q.div(energy,p.energy)),1,'physical kinetic-energy contour',3e-8,3e-8);}}
  const selected=s.dots.find(d=>d.style.color==='gold'&&d.style.r===5);assert.ok(selected);const vector=id===3?expected.selectedVelocity:expected.responseAcceleration;selected.points[0].forEach((x,k)=>near(x,ratio(vector[k],scale),'selected physical ellipse point'));
 }
 if(id===4){const p=expected.parameters,states=Array.from({length:61},(_,j)=>expectedState(4,{...p,progress:j/60})),energy=unit(states.map(s=>s.energyChange)),power=unit(states.map(s=>s.power));compare(capture.energyUnit,energy,'energy chart unit');compare(capture.powerUnit,power,'power chart unit');for(const[j,field,u]of[[1,'energyChange',energy],[2,'power',power]]){const curves=capture.stages[j].paths.filter(p=>p.points.length===61);assert.ok(curves.length);for(const curve of curves)for(const[x,y]of curve.points){const state=expectedState(4,{...p,progress:x});near(y,ratio(state[field],u),'energy / power curve',3e-10,3e-10);}}}
 if(id===7){const p=expected.parameters,path=capture.stages[2].paths.find(p=>p.points.length>=49);assert.ok(path);for(const[x,y]of path.points){const s=expectedState(7,{...p,ratio1:x,ratio2:x});near(y,s.relativeCoupling.value,'physical coupling curve');}if(expected.gearedMass[0][1].sign===0)assert.ok(path.points.some(([x,y])=>x===p.ratio1&&y===0),'exact cancellation represented in actual curve');}
 if(id===8){const a=capture.stages[1].paths.find(p=>p.points.length===expected.trace.length);assert.ok(a,'computed history');a.points.forEach((p,j)=>{near(p[0],expected.trace[j].time,'history time');near(p[1],expected.trace[j].q*180/Math.PI,'history elbow angle',2e-9);});}
 if(id===9){const bad=expected.status.startsWith('degenerate'),s=capture.stages[1],scale=unit([...expected.freeToolAcceleration,...(!bad?expected.constrainedToolAcceleration:[])]);compare(capture.plotUnit,scale,'shared physical acceleration unit');for(const[color,values,shown]of[['orange',expected.freeToolAcceleration,true],['blue',expected.constrainedToolAcceleration,!bad]]){const a=s.arrows.find(a=>a.style.color===color);eq(Boolean(a),shown,'defined acceleration arrow');if(a)a.points[1].forEach((x,k)=>near(x,ratio(values[k],scale),'actual acceleration vector'));}if(expected.status==='active-wall')assert.ok(expected.reaction.sign>=0);if(expected.status==='detached')eq(expected.reaction.sign,0,'wall cannot pull');if(['active-wall','bilateral-guide'].includes(expected.status))eq(expected.normalAcceleration.sign,0,'active workless normal constraint');if(expected.status==='detached')assert.ok(expected.normalAcceleration.sign>=0,'a detached wall opens the gap');}
 return comparisons;
}
