import test from'node:test';import assert from'node:assert/strict';import{sailPressure,trimGrid,sailAt,sailing}from'../content/tech/source-audit-sailing.js';
const near=(a,b,t=3e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`),rad=Math.PI/180;
// Independent scalar force from angle differences, without the production vector construction.
function residual(v,g,d,c){g*=rad;d*=rad;const u=-Math.cos(g)-v,q=u*Math.sin(d)+Math.sin(g)*Math.cos(d);return Math.sin(d)*q*Math.abs(q)+.02*Math.hypot(Math.sin(g),Math.cos(g)+v)*u-c*v*v;}
function root(g,d,c){if(residual(0,g,d,c)<=0)return 0;let lo=0,hi=2;for(let j=0;j<65;j++){const m=(lo+hi)/2;if(residual(m,g,d,c)>0)lo=m;else hi=m;}return(lo+hi)/2;}
test('authored force obeys independent passive-power, reversal, scale and normal-orientation identities',()=>{
 for(const A of[[0,0],[1,0],[0,-1],[.123456789,-1.987654321],[-3,2]])for(let j=0;j<24;j++){const a=j*Math.PI/12,n=[Math.cos(a),Math.sin(a)],F=sailPressure(A,n),q=A[0]*n[0]+A[1]*n[1],work=F[0]*A[0]+F[1]*A[1];near(work,Math.abs(q)**3+.02*Math.hypot(...A)**3);assert.ok(work>=-1e-14);sailPressure(A,n.map(x=>-x)).forEach((f,k)=>near(f,F[k]));sailPressure(A.map(x=>-x),n).forEach((f,k)=>near(f,-F[k]));sailPressure(A.map(x=>3*x),n).forEach((f,k)=>near(f,9*F[k]));}
});
test('finite-envelope speed equals the maximum of independently solved single-trim roots',()=>{
 for(const trim of[5,10,20.123456789,40,70])for(const c of[.2,.5123456789,1.2])for(const g of[0,19.123456789,30,50,70,90,120,179.999,180]){const p=sailAt(g,trim,c),grid=trimGrid(trim),best=Math.max(...grid.map(d=>root(g,d,c)));near(p.speed,best);near(p.forward-c*p.speed*p.speed,p.residual);assert.equal(p.moving,best>0);assert.ok(p.speed>=0&&p.speed<2);if(p.moving){assert.ok(p.bracket[1]-p.bracket[0]<=2/2**48+1e-15);assert.ok(Math.max(...grid.map(d=>residual(p.bracket[0],g,d,c)))>=-1e-12);assert.ok(Math.max(...grid.map(d=>residual(p.bracket[1],g,d,c)))<=1e-12);near(p.residual,0,3e-12);}assert.ok(grid.includes(p.trim));}
});
test('fixed-trim residuals strictly decrease over speed, with a globally negative upper bracket',()=>{
 for(const g of[0,17.23456789,60,90,120,180])for(const d of[-90,-43.123456789,-5,5,43.123456789,90])for(const c of[.2,1.2]){let last=Infinity;for(let j=0;j<=200;j++){const f=residual(j/100,g,d,c);assert.ok(f<last);last=f;}assert.ok(residual(2,g,d,c)<=-.3+1e-12);for(const v of[.123,.9,1.123,1.9]){const h=1e-6,der=(residual(v+h,g,d,c)-residual(v-h,g,d,c))/(2*h),a=g*rad,z=d*rad,q=(-Math.cos(a)-v)*Math.sin(z)+Math.sin(a)*Math.cos(z),sp=Math.hypot(Math.sin(a),Math.cos(a)+v),expected=-2*Math.sin(z)**2*Math.abs(q)-.02*(sp+(v+Math.cos(a))**2/sp)-2*c*v;near(der,expected,2e-8);}}
});
test('all181polar points and sampled windward markers match the stated finite comparison; cache is defensive',()=>{
 for(const [s,l,c]of[[10,5,.2],[70,70,1.2],[40.123456789,20.123456789,.5123456789]]){const p=sailing(s,l,c,73.123456789,1.123456789,17.123456789);for(let i=0;i<2;i++){assert.equal(p.curves[i].length,181);for(let j=0;j<=180;j++){const speed=sailAt(j,i?l:s,c).speed;near(p.curves[i][j][0],speed*Math.sin(j*rad));near(p.curves[i][j][1],speed*Math.cos(j*rad));}near(p.best[i].vmg,Math.max(...p.curves[i].map(q=>q[1])));assert.deepEqual(p.best[i].point,p.curves[i][p.best[i].angle]);}assert.ok(p.selected.every(a=>a.heading===p.heading));}
 const p=sailing(20,20);assert.deepEqual(p.curves[0],p.curves[1]);assert.deepEqual(p.selected[0],p.selected[1]);p.curves[0][0][0]=999;assert.equal(sailing(20,20).curves[0][0][0],0);
});
test('blade rotation independently reproduces all signed tip depths and unit lengths, including emergence',()=>{
 for(const offset of[.5,1.123456789,2])for(const heel of[0,17.123456789,30]){const p=sailing(40,20,.5,70,offset,heel);for(const r of p.rods){near(Math.hypot(r.bottom[0]-r.top[0],r.bottom[1]-r.top[1]),1);near(-r.bottom[1],r.offset?p.oarTip:p.rudderTip);}assert.equal(p.oar.length,301);assert.equal(p.rudder.length,301);for(let j=0;j<=300;j++){const a=j*Math.PI/1800;near(p.oar[j][1],Math.cos(a)-offset*Math.sin(a));near(p.rudder[j][1],Math.cos(a));if(j){assert.ok(p.oar[j][1]<p.oar[j-1][1]);assert.ok(p.rudder[j][1]<p.rudder[j-1][1]);}}}
 assert.ok(sailing(40,20,.5,70,2,30).oarTip<0);assert.equal(sailing(40,20,.5,70,2,0).oarTip,1);
});
test('every offered trim grid includes both signs and90degrees exactly; malformed model inputs are rejected',()=>{
 for(const d of[5,10,20.123456789,70]){const a=trimGrid(d);assert.deepEqual(a.slice(0,2),[-d,d]);assert.deepEqual(a.slice(-2),[-90,90]);assert.ok(a.every(x=>Math.abs(x)>=d&&Math.abs(x)<=90));for(let j=2;j<a.length-2;j+=2)near(a[j-1]+3,a[j+1]);}
 for(const d of[0,4.99,70.1,NaN,'20'])assert.throws(()=>trimGrid(d),RangeError);for(const a of[[-1],[181],[70,0],[70,20,0]])assert.throws(()=>sailAt(...a),RangeError);for(const a of[[5],[40,0],[40,20,0],[40,20,.5,181],[40,20,.5,70,0],[40,20,.5,70,1,31]])assert.throws(()=>sailing(...a),RangeError);
});
