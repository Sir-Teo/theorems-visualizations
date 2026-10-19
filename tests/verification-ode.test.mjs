import assert from 'node:assert/strict';
import {test} from 'node:test';
import {slProblem,slEigenpairs,slInner,slPath,nodeZeros,simpson,flow} from '../content/ode/ch04.shared.js';
const close=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} versus ${b}`);
test('Sturm-Liouville shooting recovers Dirichlet, Neumann zero mode and mixed spectra with orthonormal eigenfunctions',()=>{
  const pr=slProblem(()=>1,()=>0,()=>1);
  for(const bc of ['DD','NN','DN']){const ep=slEigenpairs(pr,bc,6);for(let j=0;j<6;j++){
    const n=j+(bc==='NN'?0:bc==='DN'?.5:1);close(ep[j].lam,(n*Math.PI)**2,3e-5);
    for(let k=0;k<=j;k++)close(slInner(pr,ep[j].u,ep[k].u),j===k?1:0,2e-8);
    assert.equal(nodeZeros(ep[j].u).length,j);
  }}
});
test('Weighted Sturm-Liouville spectra scale as p/w and shift by q/w',()=>{
  for(const[p,q,w]of[[2,3,4],[.3,-2,1.7]]){
    const pr=slProblem(()=>p,()=>q,()=>w);const ep=slEigenpairs(pr,'DD',4);
    ep.forEach((e,j)=>close(e.lam,(p*((j+1)*Math.PI)**2+q)/w,1e-5));
  }
});
test('Green construction gives positive symmetric string kernel and exact parabolic response to uniform load',()=>{
  const pr=slProblem(()=>1,()=>0,()=>1),left=slPath(pr,0,0,1),right=slPath(pr,0,0,-1,-1),N=pr.N;
  const C=right.u[N/2]*left.v[N/2]-left.u[N/2]*right.v[N/2];
  const G=(i,j)=>left.u[Math.min(i,j)]*right.u[Math.max(i,j)]/C;
  for(const i of[60,210,510]){for(const j of[30,300,420]){close(G(i,j),Math.min(i/N,j/N)*(1-Math.max(i/N,j/N)));close(G(i,j),G(j,i))}
    close(simpson(Float64Array.from({length:N+1},(_,j)=>G(i,j)),1/N),i/N*(1-i/N)/2,1e-12);
  }
  const j=300;close((G(j+1,j)-2*G(j,j)+G(j-1,j))*N,-1,1e-11);
});
test('Fredholm resonance detects the independent sine projection of forcing',()=>{
  const L=Math.PI;
  for(const f of[Math.sin,x=>Math.sin(2*x),()=>1,Math.cos,x=>x-Math.PI/2]){
    const out=flow((t,[u,v])=>[v,-u+f(t)],0,[0,0],L,1000).at(-1)[1][0];
    const n=2000,h=L/n,I=simpson(Float64Array.from({length:n+1},(_,j)=>f(j*h)*Math.sin(j*h)),h);close(out,I,2e-10);
  }
});
test('Rayleigh quotient bounds use all modes and improve to lambda2 after ground-state orthogonalization',()=>{
  const N=1200,h=1/N;
  for(const coeff of[[1,.2,-.4],[0,1,.3],[.1,0,1]]){
    const f=Float64Array.from({length:N+1},(_,i)=>coeff.reduce((s,a,j)=>s+a*Math.sin((j+1)*Math.PI*i*h),0));
    const df=Float64Array.from({length:N+1},(_,i)=>coeff.reduce((s,a,j)=>s+a*(j+1)*Math.PI*Math.cos((j+1)*Math.PI*i*h),0));
    const Q=simpson(df.map(x=>x*x),h)/simpson(f.map(x=>x*x),h),want=coeff.reduce((s,a,j)=>s+a*a*((j+1)*Math.PI)**2,0)/coeff.reduce((s,a)=>s+a*a,0);close(Q,want);assert.ok(Q>=Math.PI**2);if(!coeff[0])assert.ok(Q>=4*Math.PI**2);
  }
});

test('Actual oscillation panel retains a genuine zero in the final grid cell but excludes the boundary root at an eigenvalue',async()=>{
  const M=await import('../assets/js/viz/math.js'),chapter=(await import('../content/ode/ch04-c.js')).default;
  const stages=[],controls=new Map();let draw,read;
  const ctl=(n,x)=>{const q={value:x,set(y){this.value=y},el:{}};controls.set(n,q);return q};
  const v={fix:(x,n=3)=>Number(x).toFixed(n),legend(){},button(){},select(n,o,x){return ctl(n,x)},slider(n,a,b,x){return ctl(n,x)},input(n,x){const q=ctl(n,x);q.fn=M.compileExpr(x,['x']).f;return q},stage(){const calls=[];const s=new Proxy({calls},{get(t,k){return k in t?t[k]:(...a)=>{calls.push([k,...a]);return s}}});stages.push(s);return s},render(f){draw=f},readout(f){read=f}};
  chapter.items.find(i=>i.num==='4.13').viz(v);
  const lam=controls.get('$\\lambda$');
  for(const[l,n]of[[Math.PI**2-.005,0],[Math.PI**2,0],[Math.PI**2+.005,1],[4*Math.PI**2+.01,2]]){
    lam.value=l;for(const s of stages)s.calls.length=0;draw();assert.match(read(),new RegExp(`interior zeros of \\$u\\$: ${n};`));
  }
});
