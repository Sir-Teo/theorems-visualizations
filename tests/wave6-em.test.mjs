import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/em/ch06.shared.js';
import chapter from '../content/em/ch06.js';
import syllabus from '../content/em/syllabus.js';
import fs from 'node:fs';
const near=(x,y,tol=1e-10)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${x} ≠ ${y}`);
function integrate(f,a,b,n=2000){let s=0;for(let i=0;i<n;i++)s+=f(a+(i+.5)*(b-a)/n);return s*(b-a)/n;}
function eliminate(A,b){A=A.map((row,i)=>[...row,b[i]]);const n=b.length;for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(A[i][k])>Math.abs(A[p][k]))p=i;assert.ok(Math.abs(A[p][k])>1e-13);[A[k],A[p]]=[A[p],A[k]];for(let i=k+1;i<n;i++){const t=A[i][k]/A[k][k];for(let j=k;j<=n;j++)A[i][j]-=t*A[k][j];}}const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){x[i]=A[i][n];for(let j=i+1;j<n;j++)x[i]-=A[i][j]*x[j];x[i]/=A[i][i];}return x;}
function networkOracle(edges,a,b,I=1){const n=1+Math.max(...edges.flatMap(e=>e.slice(0,2))),L=Array.from({length:n},()=>Array(n).fill(0));for(const [i,j,r] of edges){L[i][i]+=1/r;L[j][j]+=1/r;L[i][j]-=1/r;L[j][i]-=1/r;}L[b]=Array(n).fill(0);L[b][b]=1;const rhs=Array(n).fill(0);rhs[a]=I;return eliminate(L,rhs);}
test('EM6 varying pipe: exact flux, tangent walls and independently differentiated divergence',()=>{
  for(const a of [0,.25,.8])for(const I of [-3,0,2])for(let i=0;i<=40;i++){
    const x=i/10,q=H.pipe(a,I,x),h=1e-5;near(integrate(y=>H.pipe(a,I,x,y).J[0],-q.w,q.w),I);
    for(const y of [-q.w,0,q.w]){const j=H.pipe(a,I,x,y).J;near(j[1],j[0]*y*q.dw/q.w);const dx=(H.pipe(a,I,x+h,y).J[0]-H.pipe(a,I,x-h,y).J[0])/(2*h),dy=(H.pipe(a,I,x,y+h).J[1]-H.pipe(a,I,x,y-h).J[1])/(2*h);near(dx+dy,0,1e-7);}
  }
});
test('EM6 translating density: quadrature volume/side flux and time difference obey conservation',()=>{
  const box=[.2,2.4,.7,3.1];for(const u of [-1,0,.7])for(const w of [-.8,0,1])for(const t of [0,.4,2.3]){const q=H.continuity(u,w,t,box),[x0,x1,y0,y1]=box;
    const volume=integrate(x=>integrate(y=>q.rho(x,y),y0,y1,100),x0,x1,100);near(volume,q.charge,6e-5);
    const flux=integrate(y=>q.J(x1,y)[0]-q.J(x0,y)[0],y0,y1)+integrate(x=>q.J(x,y1)[1]-q.J(x,y0)[1],x0,x1);near(flux,q.flux,5e-7);near(q.derivative,-q.flux);
    const dt=1e-5;near((H.continuity(u,w,t+dt,box).charge-H.continuity(u,w,t-dt,box).charge)/(2*dt),q.derivative,1e-8);
  }
});
test('EM6 constitutive and dimensional scalings remain distinct',()=>{for(const E of [-2,-.1,0,1,2])for(const s of [.2,1,3]){near(H.ohmic(E,s).J,s*E);assert.ok(H.ohmic(E,s,.5).power>=0);}const a=H.wire(1.7e-8,2,1e-6);near(a.R,.034);near(H.wire(a.rho,4,1e-6).R,2*a.R);near(H.wire(a.rho,2,2e-6).R,a.R/2);});
test('EM6 seeded Drude paths are ballistic between actual collision events and replay exactly',()=>{
  const q=H.drude(-.5,2,7,128);assert.deepEqual(q,H.drude(-.5,2,7,128));assert.deepEqual(q.particles.slice(0,40),H.drude(-.5,2,7,40).particles);
  const a=H.drude(.3,.2,11,128),b=H.drude(.3,.20001,11,128),dt=.00001;let checked=0;
  for(let i=0;i<128;i++)if(a.particles[i].hits===b.particles[i].hits){near(b.particles[i].vx,a.particles[i].vx+.3*dt);near(b.particles[i].x,a.particles[i].x+a.particles[i].vx*dt+.15*dt*dt);checked++;}assert.ok(checked>120);
  for(const accel of [-1,0,1]){const means=Array.from({length:32},(_,i)=>H.drude(accel,3,i,512).mean);near(means.reduce((s,x)=>s+x,0)/means.length,accel*(1-Math.exp(-3)),.035);}
  assert.equal(H.drude(1,0).collisions,0);assert.equal(H.drude(1,0).expected,0);
});
test('EM6 Joule heating: independent integrated cooling, zero loss and tiny-time stability',()=>{
  for(const mode of ['current','voltage'])for(const drive of [-3,0,3])for(const loss of [0,.5,2])for(const t of [0,.01,3,120]){const q=H.heating(4,drive,mode,t,10,loss);near(q.P,q.V*q.I);near(q.input,q.stored+q.released);near(integrate(x=>loss*H.heating(4,drive,mode,x,10,loss).rise,0,t),q.released,2e-6);}
  const q=H.heating(1,1,'current',1e-10,1,1);near(q.released/(.5e-20),1,1e-10);assert.ok(q.released>0);assert.equal(H.heating(1,1,'current',2,1,0).rise,2);
});
test('EM6 battery emf, terminal voltage and internal heat balance for both polarities',()=>{for(const E of [-12,0,12])for(const r of [0,.1,20])for(const R of [.1,2,20]){const q=H.battery(E,R,r);near(q.terminal+q.internalDrop,E);near(q.sourcePower,q.loadPower+q.internalPower);near(q.terminal,q.I*R);}});
test('EM6 connected four-node networks: all topologies versus pivoted elimination',()=>{
  const all=[[0,1,1],[0,2,2],[0,3,3],[1,2,4],[1,3,5],[2,3,6]];let count=0;
  for(let bits=1;bits<64;bits++){const edges=all.filter((_,i)=>(bits>>>i)&1);try{H.checkedEdges(edges);}catch{continue;}if(!edges.some(e=>e.includes(3)&&e[1]===3))continue;
    for(const I of [-2,0,1]){const q=H.solveNetwork(edges,0,3,I),V=networkOracle(edges,0,3,I);q.potentials.forEach((x,i)=>near(x,V[i]));q.divergence.forEach((x,i)=>near(x,i===0?I:i===3?-I:0));near(q.power,q.sourcePower);assert.ok(q.residualL2<1e-10);count++;}
  }assert.ok(count>100);
});
test('EM6 network parallel edges, series chains, symmetries and malformed graph rejection',()=>{
  near(H.solveNetwork([[0,1,2],[0,1,3]],0,1).resistance,1.2);
  near(H.solveNetwork([[0,1,2],[1,2,3]],0,2).resistance,5);
  const q=H.solveNetwork(H.BRIDGE),rev=H.solveNetwork(H.BRIDGE,3,0);near(q.resistance,7/5);near(q.resistance,rev.resistance);
  for(const e of [[],[[0,0,1]],[[0,2,1]],[[0,1,0]],[[0,1,Infinity]],[[0,1,.01]],[[0,1,21]],[,[0,1,1]],[[0,,1]],[[.1,1,1]]])assert.throws(()=>H.checkedEdges(e));
  assert.throws(()=>H.solveNetwork([[0,1,1],[2,3,1]],0,1));assert.throws(()=>H.solveNetwork(H.BRIDGE,0,0));
});
test('EM6 Thomson trial flows preserve injection and produce the exact positive excess',()=>{for(const R of [.1,1,20])for(const I of [-3,0,2])for(const c of [-3,-.01,0,2]){const q=H.thomson(R,c,I),div=[0,0,0,0];q.edges.forEach(([u,v],j)=>{div[u]+=q.trial[j];div[v]-=q.trial[j];});div.forEach((x,i)=>near(x,i===0?I:i===3?-I:0));near(q.trialPower-q.power,6*c*c);near(q.excess,6*c*c);near(q.cross,0);}});
test('EM6 conducting interface: harmonic potentials, tangential E, normal J and free sheet jump',()=>{for(const s1 of [.1,1,10])for(const s2 of [.1,1,10])for(const Et of [-2,0,2])for(const En of [-2,0,2]){const q=H.interfaceCurrent(s1,s2,Et,En,2,3);near(q.J1[1],q.J2[1]);near(q.E1[0],q.E2[0]);near(q.sheet/H.EPS,3*q.E2[1]-2*q.E1[1]);for(const y of [-1,1]){const d=1e-5;near(-(q.potential(.4+d,y)-q.potential(.4-d,y))/(2*d),Et,1e-8);near(-(q.potential(.4,y+d)-q.potential(.4,y-d))/(2*d),y<0?En:q.E2[1],1e-8);}}});
test('EM6 isolated sphere: charge moves from bulk to surface while external flux remains fixed',()=>{for(const sig of [0,1e-12,1e-9])for(const t of [0,.01,1,10]){const q=H.relaxation(2e-9,sig,2*H.EPS,t);near((q.bulk+q.surface)/2e-9,1);near(4*Math.PI*H.EPS*4*q.field(2)/2e-9,1);near(q.current/(2e-9),sig*q.bulk/(2*H.EPS*2e-9));}assert.equal(H.relaxation(1,0,H.EPS,1).surface,0);assert.equal(H.relaxation(1,0,H.EPS,1).tau,Infinity);});
test('EM6 RC general initial condition, energy integrals and tiny early heat',()=>{
  for(const Vs of [-5,0,5])for(const V0 of [-8,0,8])for(const R of [.1,10])for(const C of [.001,1])for(const u of [0,.01,.5,6]){const t=u*R*C,q=H.rc(R,C,Vs,V0,t);near(q.V+R*q.I,Vs);near(q.work,q.heat+q.storedChange);near(q.heat,integrate(x=>R*H.rc(R,C,Vs,V0,x).I**2,0,t),2e-6);}
  const q=H.rc(1,1,1,0,1e-20);assert.equal(q.V,1e-20);near(q.heat/1e-20,1);near(q.work/1e-20,1);near(H.rc(1,1,2,0,100).heat,2);near(H.rc(1,1,2,0,100).work,4);
});
test('EM6 signal flight, telegrapher parameters and electron displacement use distinct scales',()=>{for(const er of [1,2.25,9]){const flight=100*Math.sqrt(er)/H.C0,q=H.signal(er,100,5,50,1e-6,flight/2);near(q.speed,1/Math.sqrt(q.L*q.C));near(Math.sqrt(q.L/q.C),50);near(q.front,50);assert.equal(q.arrival,false);assert.equal(q.voltage(75),0);assert.equal(q.displacement(75),0);near(q.I,.1);near(q.drift*8.5e28*H.QE*1e-6,-q.I);assert.equal(H.signal(er,100,5,50,1e-6,flight).arrival,true);}});
test('EM6 open grids converge toward independently known infinite-lattice values',()=>{
  let previous=Infinity;for(const n of [3,5,7,9,13,17,21]){const q=H.squareGrid(n);assert.ok(q.resistance>.5&&q.resistance<previous);previous=q.resistance;near(q.power,q.resistance,2e-10);assert.ok(q.residualL2<1e-10);if(n<=5){const V=networkOracle(q.edges,q.a,q.b);near(q.resistance,V[q.a]);}}
  near(H.infiniteGrid(1,0),.5,1e-11);near(H.infiniteGrid(1,1),2/Math.PI,1e-11);near(H.infiniteGrid(2,0),2-4/Math.PI,1e-10);assert.equal(H.infiniteGrid(0,0),0);
  for(let m=0;m<5;m++)for(let n=0;n<5;n++){near(H.infiniteGrid(m,n),H.infiniteGrid(n,m),1e-9);near(H.infiniteGrid(m,n),H.infiniteGrid(-m,-n));}
  for(let d=1;d<=40;d++)near(H.infiniteGrid(d,0),H.infiniteGrid(d,0,8192),7e-8);
});
test('EM6 escape probability agrees with an independent absorbing Markov solve; censoring is retained',()=>{
  const q=H.solveNetwork(H.BRIDGE),inside=[1,2],A=inside.map(x=>inside.map(y=>x===y?1:0)),rhs=[0,0];inside.forEach((x,i)=>{const sum=q.adjacency[x].reduce((s,e)=>s+e[1],0);for(const [y,c] of q.adjacency[x])if(y===q.b)rhs[i]+=c/sum;else if(inside.includes(y))A[i][inside.indexOf(y)]-=c/sum;});const h=eliminate(A,rhs),ca=q.adjacency[q.a].reduce((s,e)=>s+e[1],0),escape=q.adjacency[q.a].reduce((s,[y,c])=>s+c/ca*(y===q.b?1:y===q.a?0:h[inside.indexOf(y)]),0);
  near(escape,10/21);near(H.walks(q).exact,escape);const s=H.walks(q,11,5000,200);assert.equal(s.censored,0);near(s.lower,escape,.03);assert.deepEqual(s,H.walks(q,11,5000,200));for(const p of s.paths){assert.equal(p.path[0],q.a);assert.ok(p.path.slice(1,-1).every(x=>x!==q.a&&x!==q.b));}
  const c=H.walks(q,3,100,1);assert.equal(c.success,0);assert.equal(c.returned,0);assert.equal(c.censored,100);assert.equal(c.lower,0);assert.equal(c.upper,1);
});
test('EM6 frozen identities, kinds and dependencies are preserved; references match the syllabus',()=>{
  const frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='em'&&c.chapter===6),live=syllabus.chapters.find(c=>c.n===6);
  assert.equal(chapter.items.length,15);assert.deepEqual(chapter.items.map(i=>i.num),frozen.items.map(i=>i.num));
  for(const item of chapter.items){const old=frozen.items.find(i=>i.num===item.num),row=live.items.find(i=>i.num===item.num);for(const key of ['num','kind','name','deps'])assert.deepEqual(item[key],old[key]);assert.deepEqual(item.refs,row.refs);assert.equal(item.caption,row.pic);assert.equal(typeof item.viz,'function');}
  assert.deepEqual(live.items.at(-1),{num:'6.16',alias:'circ-5.11',name:'Two-capacitor paradox'});
});
