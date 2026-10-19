import test from'node:test';import assert from'node:assert/strict';import{horseshoeGroundAudit as phi,groundWakeAudit as wake,groundStateAudit as state}from'../content/aero/source-audit-ground.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Image pair has zero wall-normal velocity everywhere; direct Biot-Savart pair gives the independent centre ratio',()=>{
 for(const h of[.03,.05,.15,1,10]){
  for(let i=-30;i<=30;i++){const x=i/10;near(wake(x,0,h)[1],0,1e-13);near(wake(x,.3,h)[0],-wake(-x,.3,h)[0]);near(wake(x,.3,h)[1],wake(-x,.3,h)[1]);}
  // Zero drawing core: derive from two infinite filaments, not the formula implementation.
  const isolated=-2/Math.PI,images=2*(.5/(.25+4*h*h))/(2*Math.PI),actual=(isolated+images)/isolated;near(phi(h),actual);
 }
 near(phi(.25),.5);near(phi(0),0);assert.ok(phi(1e6)>1-1e-12);
});
test('Independent filament-line quadrature and Gauss-Jordan solve reproduce rectangular circulation and equal-lift drag',()=>{
 // Integrate each semi-infinite filament after x=rho*tan(theta). Simpson weights
 // integrate cos(theta) without using the analytic 1/rho^2 line integral.
 let integral=0;const N=256,dt=Math.PI/(2*N);for(let i=0;i<=N;i++)integral+=(i===0||i===N?1:i%2?4:2)*Math.cos(i*dt);integral*=dt/3;
 function solve(A,b){A=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<b.length;k++){let pivot=k;for(let i=k+1;i<b.length;i++)if(Math.abs(A[i][k])>Math.abs(A[pivot][k]))pivot=i;[A[k],A[pivot]]=[A[pivot],A[k]];const div=A[k][k];for(let j=k;j<=b.length;j++)A[k][j]/=div;for(let i=0;i<b.length;i++)if(i!==k){const f=A[i][k];for(let j=k;j<=b.length;j++)A[i][j]-=f*A[k][j];}}return A.map(r=>r.at(-1));}
 for(const AR of[4,14])for(const h of[.03,.15,1]){
  const s=state(AR,h,24);
  for(const [sol,height]of[[s.free,0],[s.near,h]]){
   const edges=Array.from({length:25},(_,i)=>-.5*Math.cos(i*Math.PI/24)),ys=edges.slice(1).map((y,i)=>(y+edges[i])/2),kernel=(y,e)=>{const d=e-y;return integral/(4*Math.PI)*(d/(d*d+1e-8)-(height?d/(d*d+4*height*height):0));},K=ys.map(y=>edges.slice(1).map((e,j)=>kernel(y,e)-kernel(y,edges[j]))),A=K.map((row,i)=>row.map((k,j)=>Math.PI/AR*k+ +(i===j))),g=solve(A,ys.map(()=>Math.PI/AR*.1)),w=K.map(row=>row.reduce((a,k,j)=>a+k*g[j],0));
   let L=0,D=0;for(let i=0;i<24;i++){near(sol.Gam[i],g[i],1e-10);near(g[i],Math.PI/AR*(.1-w[i]),1e-10);L+=g[i]*(edges[i+1]-edges[i]);D+=g[i]*w[i]*(edges[i+1]-edges[i]);}near(sol.CL,2*AR*L,1e-10);near(sol.CDi,2*AR*D,1e-10);
  }
 }
});
test('Equal-lift scaling, image limits and mesh convergence hold across configured aspect ratios and heights',()=>{
 for(const AR of[4,8,14])for(const h of[.03,.15,1]){const s=state(AR,h),coarse=state(AR,h,40),fine=state(AR,h,80);assert.ok(s.phi>0&&s.phi<1);assert.ok(s.liftRatio>1);assert.ok(Math.abs(s.phi/fine.phi-1)<.008);assert.ok(Math.abs(s.phi-fine.phi)<Math.abs(coarse.phi-fine.phi));near(s.phi,(s.near.CDi*(.8/s.near.CL)**2)/(s.free.CDi*(.8/s.free.CL)**2));}
 near(state(8,1e5).phi,1,1e-10);
 const s=state(4,.03);assert.ok(Math.max(...s.free.w.map(x=>x*.8/s.free.CL*180/Math.PI))>10,'the full downwash curve formerly exceeded the3-degree plot ceiling');
});
