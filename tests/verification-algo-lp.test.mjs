import test from 'node:test';import assert from 'node:assert/strict';import{simplex,NETS}from'../content/algo/ch11.shared.js';import{kmLP,POLY_CONS,barrierState,barrierPoint,barrierPath,ellipsoidRun,PLANAR_NET,planarChainRun,undirectedCuts,matchingPolytope,detInteger}from'../content/algo/lp-source-audit.shared.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t*(1+Math.abs(a)+Math.abs(b)),`${a}≈${b}`),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
test('simplex iteration limits remain unknown in both phases, including a bounded cycling instance',()=>{
 assert.equal(simplex([1],[{a:[1],op:'<=',b:1}],{maxIt:0}).status,'iteration-limit');
 const phase1=simplex([1],[{a:[1],op:'>=',b:1},{a:[1],op:'<=',b:2}],{maxIt:0});assert.equal(phase1.status,'iteration-limit');assert.equal(phase1.phase,1);assert.equal(phase1.y,null);
 const c=[10,-57,-9,-24],rows=[{a:[.5,-5.5,-2.5,9],op:'<=',b:0},{a:[.5,-1.5,-.5,1],op:'<=',b:0},{a:[1,0,0,0],op:'<=',b:1}],cycle=simplex(c,rows,{maxIt:20}),bland=simplex(c,rows,{rule:'bland'});assert.equal(cycle.status,'iteration-limit');assert.equal(cycle.y,null);assert.equal(bland.status,'optimal');near(bland.value,1);const witness=[1,0,1,0],dual=[0,18,1];assert.ok(rows.every(r=>dot(r.a,witness)<=r.b));for(let j=0;j<4;j++)assert.ok(rows.reduce((z,r,i)=>z+r.a[j]*dual[i],0)>=c[j]);near(dot(c,witness),dot(rows.map(r=>r.b),dual));
});
test('simplex genuine unboundedness/infeasibility are distinct from tiny-pivot numerical failure',()=>{
 assert.equal(simplex([1],[{a:[-1],op:'<=',b:0}]).status,'unbounded');assert.equal(simplex([1],[{a:[1],op:'<=',b:-1}]).status,'infeasible');assert.equal(simplex([1],[{a:[1e-20],op:'<=',b:1}]).status,'numerical-failure');assert.equal(simplex([NaN],[{a:[1],op:'<=',b:1}]).status,'numerical-failure');
});
test('all displayed Klee–Minty rules terminate with independently known optimum; Dantzig visits every vertex',()=>{
 for(let n=1;n<=7;n++){const{c,rows}=kmLP(n);for(const rule of['dantzig','bland','greatest']){const R=simplex(c,rows,{rule});assert.equal(R.status,'optimal');near(R.value,100**(n-1));assert.ok(R.x.slice(0,-1).every(x=>Math.abs(x)<1e-7));if(rule==='dantzig'){assert.equal(R.pivots.length,2**n-1);assert.equal(new Set([[...Array(n)].map(()=>0),...R.pivots.map(p=>p.x)].map(x=>JSON.stringify(x))).size,2**n);}if(rule==='greatest')assert.equal(R.pivots.length,1);let prev=0;for(const p of R.pivots){assert.ok(p.x.every(x=>x>=-1e-7));assert.ok(rows.every(r=>dot(r.a,p.x)<=r.b+1e-5));assert.ok(p.value>prev);prev=p.value;}}}
});
test('log-barrier ascent gradient and positive negative-Hessian agree with independent differences',()=>{
 const c=[.7,.3],t=2,x=[3,2],B=barrierState(POLY_CONS,c,t,x),h=1e-5;for(let j=0;j<2;j++){const p=x.slice(),m=x.slice();p[j]+=h;m[j]-=h;near(B.g[j],(barrierState(POLY_CONS,c,t,p).phi-barrierState(POLY_CONS,c,t,m).phi)/(2*h));for(let i=0;i<2;i++)near(-B.H[i][j],(barrierState(POLY_CONS,c,t,p).g[i]-barrierState(POLY_CONS,c,t,m).g[i])/(2*h));}assert.ok(B.H[0][0]>0&&B.H[0][0]*B.H[1][1]-B.H[0][1]**2>0);
});
test('central points remain strictly feasible with small stationarity residual and the actual gap bound',()=>{
 const verts=[[.5,.5],[6,.5],[6,2],[3,5],[2,5],[.5,3.5]];
 for(const theta of[0,20,40,45,60,90]){const c=[Math.cos(theta*Math.PI/180),Math.sin(theta*Math.PI/180)],opt=Math.max(...verts.map(x=>dot(c,x))),B=barrierPath(POLY_CONS,c);for(const q of B){assert.equal(q.status,'tolerance-reached');assert.ok(q.sl.every(s=>s>0));assert.ok(q.residual<4e-6);const gap=opt-dot(c,q.x);assert.ok(gap>=-1e-8&&gap<=6/q.t+1e-7);}}
});
test('original planar chain reduction matches undirected exhaustive cuts for arbitrary positive capacities',()=>{
 let seed=3;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);for(let k=0;k<300;k++){const E=PLANAR_NET.arcs.map(([u,v])=>[u,v,1+Math.floor(rand()*20)]),R=planarChainRun(PLANAR_NET.pos,E),last=R.frames.at(-1),cut=Math.min(...undirectedCuts(Object.keys(PLANAR_NET.pos),E).map(q=>q.cap));assert.equal(last.type,'stop');assert.equal(R.value,cut);assert.equal(last.cap,cut);assert.ok(R.chains.length<=E.length);assert.ok(R.used.every((v,i)=>v<=E[i][2]));for(const chain of R.chains){assert.equal(chain.nodes[0],'s');assert.equal(chain.nodes.at(-1),'t');assert.equal(new Set(chain.nodes).size,chain.nodes.length);}for(let i=0;i<E.length;i++)near(R.used[i],R.chains.reduce((s,c)=>s+(c.edges.includes(i)?c.amount:0),0));}
});
test('ellipsoid half containment, optimal-point retention and exact area ratio match independent quadratic tests',()=>{
 const P=[[.5,.5],[6,.5],[6,2],[3,5],[2,5],[.5,3.5]],quad=(p,e)=>{const v=p.map((x,j)=>x-e.c[j]),u=v[0]/e.B[0][0],w=(v[1]-e.B[1][0]*u)/e.B[1][1];return u*u+w*w;};
 for(const theta of[0,40,90]){const c=[Math.cos(theta*Math.PI/180),Math.sin(theta*Math.PI/180)],R=ellipsoidRun(POLY_CONS,c,40),opt=P.reduce((a,b)=>dot(c,a)>dot(c,b)?a:b);assert.equal(R.length,41);for(let k=0;k<40;k++){const e=R[k],next=R[k+1];near(next.area/e.area,4/(3*Math.sqrt(3)),1e-7);assert.ok(quad(opt,e)<=1+1e-5);const [[l11],[l21,l22]]=e.B;for(let j=0;j<120;j++){const a=2*Math.PI*j/120,p=[e.c[0]+l11*Math.cos(a),e.c[1]+l21*Math.cos(a)+l22*Math.sin(a)];if(dot(e.cut,p.map((v,i)=>v-e.c[i]))<=1e-12)assert.ok(quad(p,next)<=1+1e-6);}}}
});
test('Bareiss integer minors agree with an independent permutation determinant',()=>{
 const det=A=>{if(!A.length)return 1;let sum=0;const visit=(cols,unused,sgn)=>{if(!unused.length){sum+=sgn*cols.reduce((p,c,i)=>p*A[i][c],1);return;}unused.forEach((v,k)=>visit([...cols,v],unused.filter(x=>x!==v),sgn*(k%2?-1:1)));};visit([],Array.from({length:A.length},(_,i)=>i),1);return sum;};
 let seed=23;const r=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)%5)-2;for(let n=0;n<=6;n++)for(let t=0;t<20;t++){const A=Array.from({length:n},()=>Array.from({length:n},r));assert.equal(detInteger(A),det(A));}
});
test('all64 simple graphs on4vertices satisfy exact unsigned-incidence criterion and matching-vertex checks',()=>{
 const edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];for(let mask=0;mask<64;mask++){const E=edges.filter((_,i)=>mask>>i&1),R=matchingPolytope(E,4);assert.equal(!R.bad,R.bip);const matchings=[];for(let s=0;s<2**E.length;s++){const v=E.map((_,i)=>s>>i&1),deg=[0,0,0,0];E.forEach(([a,b],i)=>{deg[a]+=v[i];deg[b]+=v[i];});if(deg.every(d=>d<=1))matchings.push(v.join(','));}const integer=R.V.filter(q=>q.x.every(x=>Number.isInteger(x))).map(q=>q.x.join(',')).sort();assert.deepEqual(integer,matchings.sort());assert.equal(R.frac.length===0,R.bip);for(const q of R.V){assert.ok(q.x.every(x=>x>=0));for(let i=0;i<4;i++)assert.ok(R.M[i].reduce((s,v,j)=>s+v*q.x[j],0)<=1+1e-10);}}
 const E=matchingPolytope([],6);assert.equal(E.V.length,1);assert.deepEqual(E.V[0].x,[]);assert.equal(E.checked,0);
});
test('odd cycles have determinant2, and half-edge values form a genuine vertex with all outside edges zero',()=>{
 for(const n of[3,5]){const E=Array.from({length:n},(_,i)=>[i,(i+1)%n]),R=matchingPolytope(E,n);assert.equal(Math.abs(detInteger(R.M)),2);assert.ok(R.frac.some(q=>q.x.every(x=>x===.5)));}
});
test('canonical primal/dual statuses and certificates agree with independent fixed-case geometry',()=>{
 for(const c of[[.2,.2],[4,.2],[.2,4],[4,4],[3,2]])for(const b1 of[3,8,10]){const A=[[1,2],[3,1],[0,1]],b=[b1,9,3],P=simplex(c,A.map((a,i)=>({a,op:'<=',b:b[i]}))),D=simplex(b.map(x=>-x),[0,1].map(j=>({a:A.map(a=>a[j]),op:'>=',b:c[j]})));assert.equal(P.status,'optimal');assert.equal(D.status,'optimal');near(P.value,-D.value);assert.ok(D.x.every(x=>x>=-1e-8));for(let j=0;j<2;j++)assert.ok(A.reduce((s,a,i)=>s+a[j]*D.x[i],0)>=c[j]-1e-8);}
 const P=simplex([3,2],[{a:[1,-1],op:'<=',b:2}]),D=simplex([-2],[{a:[1],op:'>=',b:3},{a:[-1],op:'>=',b:2}]);assert.equal(P.status,'unbounded');assert.equal(D.status,'infeasible');
 const I=simplex([3,2],[{a:[1,1],op:'<=',b:2},{a:[-1,-1],op:'<=',b:-5}]),U=simplex([-2,5],[{a:[1,-1],op:'>=',b:3},{a:[1,-1],op:'>=',b:2}]);assert.equal(I.status,'infeasible');assert.equal(U.status,'unbounded');
});
test('topmost chain meets every inclusion-minimal disconnecting set once, unlike arbitrary simple chains',()=>{
 const E=PLANAR_NET.arcs,R=planarChainRun(PLANAR_NET.pos,E);for(const fr of R.frames.filter(q=>q.type==='chain')){const active=E.map((e,i)=>fr.remaining[i]>0?i:null).filter(i=>i!==null),connected=removed=>{const seen=new Set(['s']);for(let k=0;k<6;k++)for(const i of active)if(!removed.has(i)){const[u,v]=E[i];if(seen.has(u))seen.add(v);if(seen.has(v))seen.add(u);}return seen.has('t');};for(let mask=0;mask<2**active.length;mask++){const cut=active.filter((_,j)=>mask>>j&1),S=new Set(cut);if(connected(S))continue;if(cut.some(i=>{const T=new Set(S);T.delete(i);return !connected(T);}))continue;assert.equal(fr.path.edges.filter(i=>S.has(i)).length,1);}}
});
test('Klee–Minty reduced-cost sign formula independently predicts every chosen variable and Gray-code vertex',()=>{
 for(let n=1;n<=7;n++){const {c,rows}=kmLP(n),R=simplex(c,rows),bits=Array(n).fill(0);for(let k=0;k<R.pivots.length;k++){const suffix=bits.map((_,j)=>bits.slice(j).reduce((a,b)=>a+b,0)),j=suffix.findIndex(v=>v%2===0),pivot=R.pivots[k];assert.equal(pivot.enter,bits[j]?n+j:j);bits[j]=1-bits[j];const gray=(k+1)^((k+1)>>1);bits.forEach((v,i)=>assert.equal(v,(gray>>i)&1));for(let i=0;i<n;i++){const slack=rows[i].b-dot(rows[i].a,pivot.x);near(bits[i]?slack:pivot.x[i],0);assert.ok((bits[i]?pivot.x[i]:slack)>0);}}}
});
