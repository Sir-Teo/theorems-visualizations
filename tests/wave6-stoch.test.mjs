import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadAll} from '../scripts/lib.mjs';
import * as H from '../content/stoch/ch06.shared.js';
const near=(a,b,t=3e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const factorial=n=>{let x=1n;for(let j=2;j<=n;j++)x*=BigInt(j);return x;};
const choose=(n,k)=>{if(k<0||k>n)return 0n;let a=1n;for(let j=1;j<=k;j++)a=a*BigInt(n-j+1)/BigInt(j);return a;};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function integerCouponTail(n,t){let numerator=0n;for(let j=1;j<=n;j++)numerator+=(j%2?1n:-1n)*choose(n,j)*BigInt(n-j)**BigInt(t);return Number(numerator)/Number(BigInt(n)**BigInt(t));}
function enumerateTop(n,t){const counts=new Map(),stops=new Map();let histories=0;function go(deck,depth,tau){if(depth===t){const key=deck.join(',');counts.set(key,(counts.get(key)||0)+1);if(tau===t)stops.set(key,(stops.get(key)||0)+1);histories++;return;}const top=deck[0];for(let j=0;j<n;j++)go([...deck.slice(1,j+1),top,...deck.slice(j+1)],depth+1,tau??(top===n-1?depth+1:null));}go(Array.from({length:n},(_,i)=>i),0,null);return{counts,stops,histories};}

test('top-to-random exact laws agree with independent enumeration of every insertion history',()=>{
 for(const n of[3,4]){const m=H.topProfile(n,6);for(let t=0;t<=5;t++){const e=enumerateTop(n,t);m.list.forEach((p,i)=>{near(m.rows[t][i],(e.counts.get(p.join(','))||0)/e.histories);near(m.stops[t][i],(e.stops.get(p.join(','))||0)/e.histories);});}}
});
test('strong-stationary stopped decks are conditionally uniform and bounds hold for every enumerated time',()=>{
 for(const n of[3,4,5,6]){const m=H.topProfile(n,35);for(let t=0;t<=35;t++){const mass=H.sum(m.stops[t]);near(H.sum(m.rows[t]),1);assert.ok(m.tv[t]<=m.separation[t]+1e-12);assert.ok(m.separation[t]<=m.tail[t]+1e-12);if(mass>0)m.stops[t].forEach(p=>near(p/mass,1/m.list.length));if(t)near(m.tail[t-1]-m.tail[t],mass);}assert.equal(H.sum(m.stops[n-1]),0);assert.ok(H.sum(m.stops[n])>0);}
});
test('coupon tails agree with integer inclusion-exclusion, top stopping tails, and expectation from the tail sum',()=>{
 for(const n of[3,4,6,8]){const m=H.couponProfile(n,40);for(let t=0;t<=40;t++)near(m.tail[t],integerCouponTail(n,t));if(n<=6){const top=H.topProfile(n,40);for(let t=0;t<=40;t++)near(m.tail[t],top.tail[t]);}near(H.sum(m.law),1);}
 for(const n of[4,10,20]){const m=H.couponProfile(n,1000);near(H.sum(m.tail),n*H.harmonic(n));for(let t=0;t<=1000;t+=13)assert.ok(m.tail[t]<=n*(1-1/n)**t+1e-13);}
});
test('seeded top trajectory preserves cards and stops on the first removal of the original bottom card',()=>{
 for(const n of[4,12,40])for(const seed of[1,17,40]){const a=H.topTrace(n,seed,300),b=H.topTrace(n,seed,300);assert.deepEqual(a,b);for(let t=1;t<=300;t++){assert.deepEqual(a.decks[t].toSorted((x,y)=>x-y),H.lin(0,n-1,n-1));assert.equal(a.position[t],a.decks[t].indexOf(n-1));const previous=a.decks[t-1],now=a.decks[t],slot=now.indexOf(previous[0]);assert.deepEqual(now.filter((_,i)=>i!==slot),previous.slice(1));}const first=a.decks.slice(0,-1).findIndex(p=>p[0]===n-1);assert.equal(a.tau,first<0?null:first+1);}
});
test('Eulerian class recurrence agrees with enumerated permutations and inverse rising sequences',()=>{
 for(let n=2;n<=8;n++){const hist=Array(n).fill(0);for(const p of H.permutations(n).list){const inv=H.inverse(p);assert.deepEqual(H.inverse(inv),p);let breaks=1;for(let j=1;j<n;j++)if(inv[j]<inv[j-1])breaks++;assert.equal(H.rising(p),breaks);hist[breaks-1]++;}const l=H.logEulerian(n);hist.forEach((x,i)=>near(Math.exp(l[i]),x/Number(factorial(n))));}
});
test('inverse stable sorting yields the exact stars-and-bars probability for every small permutation',()=>{
 for(const n of[3,4,5])for(const a of[2,4]){const counts=new Map();for(let code=0;code<a**n;code++){let rest=code;const labels=Array.from({length:n},()=>{const x=rest%a;rest=Math.floor(rest/a);return x;}),p=Array.from({length:n},(_,i)=>i).sort((i,j)=>labels[i]-labels[j]||i-j),key=p.join(',');counts.set(key,(counts.get(key)||0)+1);}
 for(const p of H.permutations(n).list){const r=1+H.descents(p);assert.equal(BigInt(counts.get(p.join(','))||0),choose(a+n-r,n));}}
});
test('riffle class laws preserve mass and agree with exact rational finite-deck TV and published 52-card values',()=>{
 for(const n of[3,4,5,7])for(let k=0;k<=5;k++){const a=2**k,r=H.riffle(n,k),den=BigInt(a)**BigInt(n),N=factorial(n),counts=Array(n).fill(0n);for(const p of H.permutations(n).list)counts[H.rising(p)-1]++;let numerator=0n;counts.forEach((A,i)=>{let z=choose(a+n-i-1,n)*N-den;if(z<0)z=-z;numerator+=A*z;});near(r.tv,Number(numerator)/Number(2n*N*den));near(r.mass,1);}
 for(const n of[25,52,104,208,312]){let previous=1;for(let k=0;k<=12;k++){const r=H.riffle(n,k);near(r.mass,1,3e-12);near(H.sum(r.stationary),1,3e-12);assert.ok(r.tv<=previous+2e-12);previous=r.tv;}}
 near(H.riffle(52,7).tv,.334060999468151,1e-13);near(H.riffle(52,8).tv,.167158641926957,1e-13);assert.ok(H.riffle(52,7).tv>.25&&H.riffle(52,7).tv<.5);
});
test('two binary inverse shuffles compose to the corresponding base-four stable label sort',()=>{
 const n=4;for(let code=0;code<4**n;code++){let z=code;const labels=Array.from({length:n},()=>{const a=z%4;z=Math.floor(z/4);return a;}),ids=H.lin(0,n-1,n-1);const byLow=ids.toSorted((i,j)=>(labels[i]%2)-(labels[j]%2)||i-j),byHigh=byLow.toSorted((i,j)=>Math.floor(labels[i]/2)-Math.floor(labels[j]/2)),direct=ids.toSorted((i,j)=>labels[i]-labels[j]||i-j);assert.deepEqual(byHigh,direct);}
 for(const n of[4,12,24])for(const k of[0,2,10]){const q=H.inverseShuffle(n,k,17);assert.equal(q.r,H.rising(q.forwardDeck));assert.deepEqual(H.inverse(q.forwardDeck),q.inverseDeck);assert.ok(q.r<=2**k);}
});
test('transposition evolution matches the identity hold probability and preserves periodic parity when distinct',()=>{
 for(const n of[3,4,5]){const a=H.transpositionProfile(n,20),b=H.transpositionProfile(n,20,true);near(a.rows[1][0],1/n);assert.equal(b.rows[1][0],0);for(let t=0;t<=20;t++){near(H.sum(a.rows[t]),1);near(H.sum(b.rows[t]),1);assert.ok(b.tv[t]>=.5-1e-12);let sameParity=0;b.list.forEach((p,i)=>{let inv=0;for(let j=0;j<n;j++)for(let k=j+1;k<n;k++)inv+=p[j]>p[k];if(inv%2===t%2)sameParity+=b.rows[t][i];});near(sameParity,1);}assert.ok(a.tv.at(-1)<.01);}
 for(const n of[20,100,200])for(const t of[0,1,20,100])near(H.untouched(n,t).mean,H.sum(H.couponProfile(n,2*t).law.map((p,k)=>p*(n-k))),1e-12);
});
test('weighted reversible spectrum reconstructs powers and satisfies orthonormality and eigen equations',()=>{
 for(const bridge of[.03,.37123456789,1]){const{P,pi}=H.reversibleChain(bridge),s=H.spectrum(P,pi);P.forEach((row,i)=>{near(H.sum(row),1);row.forEach((x,j)=>near(pi[i]*x,pi[j]*P[j][i]));});for(let i=0;i<4;i++)for(let j=0;j<4;j++)near(dot(s.functions[i].map((x,k)=>x*pi[k]),s.functions[j]),+(i===j));for(let k=0;k<4;k++)for(let i=0;i<4;i++)near(dot(P[i],s.functions[k]),s.lambda[k]*s.functions[k][i]);for(const t of[0,1,2,7,30])for(let x=0;x<4;x++){let row=H.pointMass(4,x);for(let j=0;j<t;j++)row=H.advance(row,P);H.spectralRow(s,pi,t,x).forEach((p,y)=>near(p,row[y]));}}
});
test('ordinary and absolute gaps distinguish periodicity and retain raw near-boundary probabilities',()=>{
 for(const p of[0,Number.MIN_VALUE,1e-300,.2,.5,.75,1-Number.EPSILON,1]){const g=H.twoState(p);assert.equal(g.gap,2*p);assert.equal(g.absoluteGap,p<=.5?2*p:2*(1-p));if(p>0&&p<1)assert.ok(g.absoluteGap>0);else assert.equal(g.relaxation,Infinity);}assert.equal(H.twoState(1).gap,2);assert.equal(H.twoState(.5).relaxation,1);
});
test('spectral bounds enclose a full worst-start mixing calculation including integer upper rounding',()=>{
 const chains=[{P:H.cycleKernel(6),pi:H.uniform(6)},{P:H.pathKernel(6),pi:H.uniform(6)},H.reversibleChain(.35)];for(const c of chains)for(const eps of[.05,.173123456,.25,.45]){const m=H.mixBounds(c.P,c.pi,eps,300);assert.ok(m.actual>=m.lower-1e-10);assert.ok(m.actual<=m.upper);assert.ok(m.actual>=0);assert.ok(m.profile.d[m.actual]<=eps);if(m.actual>0)assert.ok(m.profile.d[m.actual-1]>eps);assert.ok(Number.isInteger(m.upper));}
});
test('Fourier and Walsh modes satisfy direct neighbor averaging and the full lazy multiplicity formula',()=>{
 for(const h of[0,.5]){for(let k=0;k<12;k++){const m=H.cycleMode(12,k,h);m.P.forEach((row,i)=>near(dot(row,m.f),m.lambda*m.f[i]));}for(let d=2;d<=5;d++){const counts=Array(d+1).fill(0);for(let mask=0;mask<2**d;mask++){const m=H.cubeMode(d,mask,h);counts[m.weight]++;m.f.forEach((x,i)=>near(h*x+(1-h)*H.sum(H.lin(0,d-1,d-1).map(j=>m.f[i^2**j]))/d,m.lambda*x));}counts.forEach((x,k)=>assert.equal(BigInt(x),choose(d,k)));}}
});
test('Hamming aggregation equals full cube total variation and antipodal separation',()=>{
 for(const d of[2,3,4]){const N=2**d,P=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>i===j?.5:(()=>{const z=i^j;return(z&&(z&(z-1))===0)?1/(2*d):0;})())),m=H.cubeMixing(d,30);let row=H.pointMass(N,0);for(let t=0;t<=30;t++){near(H.totalVariation(row,H.uniform(N)),m.d[t]);near(1-N*Math.min(...row),m.couponTail[t]);near(1-N*row[N-1],m.couponTail[t]);row=H.advance(row,P);}}
});
test('Dirichlet energy agrees with the stationary quadratic form and its eigenfunction minimum',()=>{
 for(const bridge of[.03,.5,1]){const{P,pi}=H.reversibleChain(bridge),s=H.spectrum(P,pi);for(const f of[[1,.4,-.2,-1],[0,0,0,0],[1,1,1,1],s.functions[1],s.functions[3]]){const e=H.energy(P,pi,f),quadratic=H.sum(f.map((x,i)=>pi[i]*x*(x-dot(P[i],f))));near(e.form,quadratic);if(e.quotient!==null)assert.ok(e.quotient>=s.gap-1e-12);else assert.equal(e.variance,0);}near(H.energy(P,pi,s.functions[1]).quotient,s.gap);}
});
test('conductance search agrees with every indicator quotient and Cheeger bounds',()=>{
 for(const p of[.002,.04,.173123456,.24]){const{P,pi}=H.weightedRooms(p),c=H.conductance(P,pi),s=H.spectrum(P,pi);assert.equal(c.subsets.length,41);for(const set of c.subsets){const e=H.energy(P,pi,pi.map((_,i)=>+(!!(set.mask&2**i))));near(e.form,set.flow);near(e.variance,set.mass*(1-set.mass));near(set.ratio,e.form/set.mass);assert.ok(set.ratio>=c.phi);}assert.ok(c.phi*c.phi/2<=s.gap+1e-12);assert.ok(s.gap<=2*c.phi+1e-12);near(c.phi,p);near(s.gap,2*p);}
});
test('canonical routes are simple and directed capacity bounds independently dominate every basis quadratic form',()=>{
 for(const P of[H.pathKernel(8),H.cycleKernel(8)]){const pi=H.uniform(8),c=H.canonical(P,pi),s=H.spectrum(P,pi);assert.equal(c.paths.length,56);const independently=Array.from({length:8},()=>Array(8).fill(0));for(const r of c.paths){assert.equal(r.p[0],r.x);assert.equal(r.p.at(-1),r.y);assert.equal(new Set(r.p).size,r.p.length);for(let k=1;k<r.p.length;k++){assert.ok(P[r.p[k-1]][r.p[k]]>0);independently[r.p[k-1]][r.p[k]]+=pi[r.x]*pi[r.y]*(r.p.length-1);}}assert.deepEqual(c.load,independently);for(const f of[H.lin(0,7,7),[1,-1,1,-1,1,-1,1,-1],...s.functions]){const e=H.energy(P,pi,f);assert.ok(e.variance<=c.rho*e.form+1e-12);}assert.ok(1/c.rho<=s.gap+1e-12);}
});
test('three-matching graphs retain degree, edge multiplicities, stationarity, connectivity report and lazy spectrum',()=>{
 for(const m of[4,8,12])for(const seed of[1,17,40]){const g=H.regularGraph(m,seed),s=H.spectrum(g.P,g.pi);assert.deepEqual(g,H.regularGraph(m,seed));g.adj.forEach((row,i)=>{assert.equal(H.sum(row),3);row.forEach((x,j)=>{assert.equal(x,g.adj[j][i]);if(Math.floor(i/m)===Math.floor(j/m))assert.equal(x,0);});near(H.sum(g.P[i]),1);assert.equal(g.P[i][i],.5);});const reachable=new Set([0]);for(let k=0;k<2*m;k++)for(const i of [...reachable])g.adj[i].forEach((x,j)=>{if(x)reachable.add(j);});assert.equal(g.connected,reachable.size===2*m);assert.ok(Math.min(...s.lambda)>-1e-12);assert.ok(Math.max(...s.lambda)<=1+1e-12);if(g.connected)assert.ok(s.gap>0);else near(s.gap,0);}
});
test('STOCH6 preserves all frozen identities, source metadata and actual written prerequisites',async()=>{
 const plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8')),{items}=await loadAll(),chapter=items.filter(x=>x.col==='stoch'&&x.chapter===6),all=new Set(items.map(x=>x.id)),S=(await import('../content/stoch/syllabus.js')).default.chapters.find(x=>x.n===6),frozen=plan.chapters.find(x=>x.col==='stoch'||x.collection==='stoch');assert.equal(chapter.length,15);
 for(const it of chapter){const s=S.items.find(x=>x.num===it.num),p=(frozen.items||frozen.newItems).find(x=>x.num===it.num||x.id===it.id);assert.equal(it.name,p.name);assert.equal(it.kind,p.kind);assert.equal(it.name,s.name);assert.equal(it.kind,s.kind);assert.deepEqual(it.deps,s.deps);assert.deepEqual(it.refs,s.refs);assert.equal(it.caption,s.pic);for(const dep of it.deps)assert.ok(all.has(dep),dep);assert.equal(typeof it.viz,'function');}
 const paper=chapter.find(x=>x.kind==='Paper');assert.equal(paper.paper.doi,'10.1214/aoap/1177005705');assert.deepEqual(paper.introduces,['stoch-6.4']);
});
