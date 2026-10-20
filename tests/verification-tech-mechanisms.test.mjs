import test from 'node:test';import assert from 'node:assert/strict';import{windDisk,stampStroke,lockChange,DISK_LIMIT}from'../content/tech/source-audit-mechanisms.js';
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function integrate(f,a,b,N=200){const h=(b-a)/N;let r=f(a)+f(b);for(let i=1;i<N;i++)r+=(i%2?4:2)*f(a+i*h);return h*r/3;}
test('aligned disc mass, momentum and kinetic-energy balances independently recover the coefficient',()=>{
 for(const a of[0,.123456789,1/3,.4])for(const R of[4,16])for(const U of[2,20]){const p=windDisk(a,R,U,55,20),m=1.225*Math.PI*R**2*p.disk;near(m,p.massFlow);near(p.upstreamArea*U,p.area*p.disk);near(p.wakeArea*p.wake,p.area*p.disk);near(p.thrust,m*(U-p.wake));near(p.aligned,m*(U**2-p.wake**2)/2);near(p.aligned/p.available,4*a*(1-a)**2);assert.ok(p.wake>0);assert.ok(p.cp<=DISK_LIMIT+1e-14);}
 const p=windDisk(1/3);near(p.cp,16/27);for(const a of[.05,.123456789,.39]){const h=1e-6,d=(windDisk(a+h).cp-windDisk(a-h).cp)/(2*h);near(d,4*(1-a)*(1-3*a),1e-9);}
});
test('angle wrapping, declared yaw estimate and complete families obey stated scaling',()=>{
 for(const wind of[-180,-123.456789,0,179.999,180])for(const face of[-180,-73.123456789,0,90,180]){const p=windDisk(.2,9,8,wind,face);assert.ok(p.psi>=-180&&p.psi<=180);const f=Math.abs(p.psi)>=90?0:Math.cos(p.psi*Math.PI/180)**3;near(p.power,p.aligned*f);if(Math.abs(p.psi)>=90)assert.equal(p.power,0);assert.equal(p.cpCurve.length,201);assert.equal(p.cpCurve[0][0],0);near(p.cpCurve.at(-1)[0],.4);p.powerCurves.forEach(c=>{assert.equal(c.length,201);near(c.at(-1)[0],20);assert.ok(c.every(p=>p[1]>=0));});}
 const p=windDisk(.2,4,2,0,0),q=windDisk(.2,8,4,0,0);near(q.power,32*p.power);assert.equal(windDisk(.2,9,8,-180,180).psi,0);assert.equal(windDisk(.2,9,8,90,0).factor,0);
});
test('prescribed lift work and free fall have independent exact energy, force and event checks',()=>{
 for(const k of[1,8])for(const rpm of[2,40])for(const duty of[.1,.8])for(const H of[.1,1])for(const m of[10,100]){const p=stampStroke(k,rpm,duty,H,m,.3),L=duty*60/(k*rpm),work=integrate(t=>{const s=t/L,v=6*H*s*(1-s)/L,F=m*(9.81+6*H*(1-2*s)/(L*L));return F*v;},0,L);near(work,m*9.81*H,2e-8);near(p.minGuideForce,m*(9.81-6*H/(L*L)));near(p.maxGuideForce,m*(9.81+6*H/(L*L)));near(p.impactSpeed**2,19.62*H);near(p.impactTime,L+Math.sqrt(2*H/9.81));assert.equal(p.oneSided,p.minGuideForce>=0);assert.equal(p.hitBeforeNext,p.impactTime<=p.T);for(const f of[.1,.5,.9]){const time=L+f*Math.sqrt(2*H/9.81),q=stampStroke(k,rpm,duty,H,m,time/p.end);near(m*9.81*q.current.y+.5*m*q.current.v**2,p.energy);}assert.ok(p.headCurve.every(([t,y])=>t>=0&&t<=p.end&&y>=0&&y<=H+1e-14));assert.equal(p.headCurve.find(([t])=>t===p.impactTime)[1],0);assert.ok(p.headCurve.some(([t])=>t===p.T));assert.ok(p.headCurve.some(([t])=>t===p.liftTime));}
});
test('equal lug-rate gives identical stroke; mass scales force and energy but not trajectory',()=>{
 const a=stampStroke(1,24,.4,.4,10,.3);for(const [k,rpm]of[[2,12],[4,6],[8,3]]){const b=stampStroke(k,rpm,.4,.4,100,.3);assert.deepEqual(a.headCurve,b.headCurve);assert.deepEqual(a.current,b.current);near(b.energy,10*a.energy);near(b.minGuideForce,10*a.minGuideForce);}
 const fast=stampStroke(8,40,.1,1,100,1);assert.equal(fast.oneSided,false);assert.equal(fast.hitBeforeNext,false);assert.equal(fast.cycleCompatible,false);assert.equal(fast.current.y,0);const slow=stampStroke(1,2,.4,.4,50,1);assert.equal(slow.cycleCompatible,true);
});
test('lock discharge integral and chamber volume independently satisfy exact storage accounting',()=>{
 for(const L of[15,60])for(const W of[3,9])for(const H of[1,4])for(const a of[.1,1.5])for(const tau of[0,.123456789,.5,1]){const up=lockChange(L,W,H,a,tau,'up'),down=lockChange(L,W,H,a,tau,'down'),Q0=.6*a*Math.sqrt(19.62*H),volume=integrate(t=>Q0*(1-t/up.duration),0,up.time);near(volume,up.transfer);near(up.level*L*W,up.transfer);near((H-down.level)*L*W,down.transfer);near(up.level+down.level,H);assert.equal(up.lowerOut,0);assert.equal(down.upperIn,0);near(up.storageChange,up.upperIn-up.lowerOut);near(down.storageChange,down.upperIn-down.lowerOut);near(up.storageChange+down.storageChange,0);near(up.flow,down.flow);assert.equal(up.upperReady,up.level===H);assert.equal(up.lowerReady,up.level===0);assert.equal(down.upperReady,down.level===H);assert.equal(down.lowerReady,down.level===0);for(const p of[up,down])for(const c of[p.levelCurve,p.transferCurve])assert.ok(c.every(([x,y])=>x>=0&&x<=1&&y>=0&&y<=1));}
 const a=lockChange(15,3,1,.1,1),b=lockChange(30,6,4,.2,1);near(b.duration,4*a.duration);near(b.volume,16*a.volume);
});
test('all finite control domains reject malformed saved states',()=>{
 for(const a of[[.5],[.2,0],[.2,9,0],[.2,9,8,181]])assert.throws(()=>windDisk(...a),RangeError);
 for(const a of[[1.5],[0],[1,0],[1,12,.9],[1,12,.4,0],[1,12,.4,.4,0],[1,12,.4,.4,50,2]])assert.throws(()=>stampStroke(...a),RangeError);
 for(const a of[[0],[30,0],[30,6,0],[30,6,2.5,0],[30,6,2.5,.6,2],[30,6,2.5,.6,.5,'bad']])assert.throws(()=>lockChange(...a),RangeError);
});
