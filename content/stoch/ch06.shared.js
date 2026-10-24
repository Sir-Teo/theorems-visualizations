// Finite shuffles and reversible-chain calculations. Probabilities are evaluated in floating point.
import { eigSym } from '../../assets/js/viz/math.js';
import { random } from '../prob/ch07.shared.js';
import { uniform, pointMass, advance, totalVariation, cycleKernel, pathKernel, cubeMixing, mixingProfile } from './ch05.shared.js';
export { random, uniform, pointMass, advance, totalVariation, cycleKernel, pathKernel, cubeMixing, mixingProfile };
export const sum = a => a.reduce((s,x)=>s+x,0);
export const lin = (a,b,n=100) => Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
export const harmonic = n => sum(Array.from({length:n},(_,i)=>1/(i+1)));
const spaces = new Map();
export function permutations(n) {
  if(spaces.has(n))return spaces.get(n);
  const list=[];function visit(p,left){if(!left.length){list.push(p);return;}left.forEach((x,i)=>visit([...p,x],left.filter((_,j)=>j!==i)));}visit([],Array.from({length:n},(_,i)=>i));
  const index=new Map(list.map((p,i)=>[p.join(','),i])),data={list,index};spaces.set(n,data);return data;
}
export const topMove=(deck,slot)=>{const a=deck.slice(),x=a.shift();a.splice(slot,0,x);return a;};
export function topProfile(n,horizon=60) {
  const {list,index}=permutations(n),N=list.length,edges=list.map(p=>Array.from({length:n},(_,j)=>index.get(topMove(p,j).join(','))));
  let law=pointMass(N,0),alive=law.slice();const rows=[law],stops=[Array(N).fill(0)],tail=[1],tv=[1-1/N],separation=[1];
  for(let t=1;t<=horizon;t++){const next=Array(N).fill(0),live=Array(N).fill(0),stop=Array(N).fill(0);
    list.forEach((p,i)=>edges[i].forEach(j=>{next[j]+=law[i]/n;(p[0]===n-1?stop:live)[j]+=alive[i]/n;}));
    law=next;alive=live;rows.push(law);stops.push(stop);tail.push(sum(alive));tv.push(totalVariation(law,uniform(N)));separation.push(1-N*Math.min(...law));
  }return{list,rows,stops,tail,tv,separation};
}
export function couponProfile(n,horizon){let law=pointMass(n+1,0);const tail=[];for(let t=0;t<=horizon;t++){tail.push(sum(law.slice(0,n)));if(t===horizon)break;const a=Array(n+1).fill(0);law.forEach((p,k)=>{a[k]+=p*k/n;if(k<n)a[k+1]+=p*(n-k)/n;});law=a;}return{tail,law,mean:n*harmonic(n)};}
export function topTrace(n,seed,horizon){const rng=random(seed),decks=[Array.from({length:n},(_,i)=>i)],position=[n-1];let tau=null;for(let t=1;t<=horizon;t++){const old=decks.at(-1);if(tau===null&&old[0]===n-1)tau=t;const p=topMove(old,Math.floor(n*rng()));decks.push(p);position.push(p.indexOf(n-1));}return{decks,position,tau};}
export function transpositionProfile(n,horizon=40,distinct=false){const{list,index}=permutations(n),N=list.length,choices=[];for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(!distinct||a!==b)choices.push([a,b]);
 const edges=list.map(p=>choices.map(([a,b])=>{const q=p.slice();[q[a],q[b]]=[q[b],q[a]];return index.get(q.join(','));}));let law=pointMass(N,0);const tv=[],rows=[];
 for(let t=0;t<=horizon;t++){rows.push(law);tv.push(totalVariation(law,uniform(N)));const next=Array(N).fill(0);edges.forEach((es,i)=>es.forEach(j=>next[j]+=law[i]/choices.length));law=next;}return{list,tv,rows};}
export const untouched=(n,t)=>{const mean=n*(1-1/n)**(2*t);return{mean,lower:Math.max(0,1-6/mean)};};
const logAdd=(x,y)=>x===-Infinity?y:y===-Infinity?x:Math.max(x,y)+Math.log1p(Math.exp(-Math.abs(x-y)));
const eulerianCache=new Map();
// log(A(n,r-1)/n!) avoids both factorial overflow and underflow in tail classes.
export function logEulerian(n){if(eulerianCache.has(n))return eulerianCache.get(n);let p=[0];for(let m=2;m<=n;m++){const q=Array(m).fill(-Infinity);for(let k=0;k<m;k++)q[k]=logAdd(k<p.length?p[k]+Math.log((k+1)/m):-Infinity,k>0?p[k-1]+Math.log((m-k)/m):-Infinity);p=q;}eulerianCache.set(n,p);return p;}
export function riffle(n,k){const a=2**k,u=logEulerian(n),stationary=u.map(Math.exp),law=u.map((p,i)=>{const r=i+1;if(r>a)return 0;if(a===1)return +(r===1);let ratio=0;for(let j=1;j<=n;j++)ratio+=Math.log1p((j-r)/a);return Math.exp(p+ratio);});return{a,stationary,law,tv:totalVariation(law,stationary),mass:sum(law)};}
export const descents=p=>p.slice(1).reduce((s,x,i)=>s+(p[i]>x),0);
export function inverse(p){const q=Array(p.length);p.forEach((x,i)=>q[x]=i);return q;}
export const rising=p=>1+descents(inverse(p));
export function inverseShuffle(n,k,seed){const rng=random(seed),a=2**k,labels=Array.from({length:n},()=>Math.floor(a*rng())),deck=Array.from({length:n},(_,i)=>i).sort((i,j)=>labels[i]-labels[j]||i-j);return{labels,inverseDeck:deck,forwardDeck:inverse(deck),r:1+descents(deck)};}
export function reversibleChain(bridge=.5){const pi=[.1,.2,.3,.4],Q=Array.from({length:4},()=>Array(4).fill(0));for(const[i,j,w]of[[0,1,.03],[1,2,.04*bridge],[2,3,.06]])Q[i][j]=Q[j][i]=w;const P=Q.map((row,i)=>row.map((q,j)=>i===j?1-sum(row)/pi[i]:q/pi[i]));return{P,pi};}
export function spectrum(P,pi=uniform(P.length)){const A=P.map((row,i)=>row.map((x,j)=>Math.sqrt(pi[i]/pi[j])*x)),e=eigSym(A),functions=e.vecs.map(f=>f.map((x,i)=>x/Math.sqrt(pi[i]))),lambda=e.values,gap=1-lambda[1],absoluteGap=1-Math.max(...lambda.slice(1).map(Math.abs));return{A,lambda,functions,gap,absoluteGap,relaxation:1/absoluteGap};}
export function spectralRow(model,pi,t,x,terms=pi.length){return pi.map((p,y)=>p*sum(model.lambda.slice(0,terms).map((l,j)=>l**t*model.functions[j][x]*model.functions[j][y])));}
export function twoState(p){const lambda=1-2*p,absoluteGap=p<=.5?2*p:2*(1-p);return{lambda,gap:2*p,absoluteGap,relaxation:absoluteGap===0?Infinity:1/absoluteGap};}
export function mixBounds(P,pi,epsilon=.25,horizon=1500){const spec=spectrum(P,pi),profile=mixingProfile(P,horizon,pi),rel=spec.relaxation;return{...spec,profile,actual:profile.d.findIndex(d=>d<=epsilon),lower:(rel-1)*Math.log(1/(2*epsilon)),upper:Math.ceil(rel*Math.log(1/(epsilon*Math.min(...pi))))};}
export function cycleMode(n,k,lazy=.5){const f=Array.from({length:n},(_,x)=>Math.cos(2*Math.PI*k*x/n));return{f,lambda:lazy+(1-lazy)*Math.cos(2*Math.PI*k/n),P:cycleKernel(n,lazy)};}
export function cubeMode(d,mask,lazy=.5){const N=2**d,f=Array.from({length:N},(_,x)=>{let z=x&mask,sign=1;while(z){sign=-sign;z&=z-1;}return sign;}),weight=mask.toString(2).replaceAll('0','').length;return{f,weight,lambda:1-2*(1-lazy)*weight/d};}
export function energy(P,pi,f){const mean=sum(f.map((x,i)=>x*pi[i])),variance=sum(f.map((x,i)=>pi[i]*(x-mean)**2));let form=0;for(let i=0;i<P.length;i++)for(let j=0;j<P.length;j++)form+=.5*pi[i]*P[i][j]*(f[i]-f[j])**2;return{mean,variance,form,quotient:variance>0?form/variance:null};}
export function conductance(P,pi=uniform(P.length)){const N=P.length;let phi=Infinity,mask=0;const subsets=[];for(let m=1;m<2**N-1;m++){let mass=0,flow=0;for(let i=0;i<N;i++)if(m&2**i){mass+=pi[i];for(let j=0;j<N;j++)if(!(m&2**j))flow+=pi[i]*P[i][j];}if(mass<=.5){const ratio=flow/mass;subsets.push({mask:m,mass,flow,ratio});if(ratio<phi){phi=ratio;mask=m;}}}return{phi,mask,subsets};}
export function weightedRooms(cross=.04){const n=6,pi=uniform(n),P=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?.5:Math.floor(i/3)===Math.floor(j/3)?(.5-cross)/2:cross/3));return{P,pi};}
export function canonical(P,pi=uniform(P.length)){const n=P.length,load=Array.from({length:n},()=>Array(n).fill(0)),paths=[];for(let x=0;x<n;x++)for(let y=0;y<n;y++)if(x!==y){const prev=Array(n).fill(-1),queue=[x];prev[x]=x;for(let k=0;k<queue.length&&prev[y]===-1;k++){const a=queue[k];for(let b=0;b<n;b++)if(P[a][b]>0&&prev[b]===-1){prev[b]=a;queue.push(b);}}if(prev[y]===-1)return{connected:false,load,paths,rho:Infinity};let p=[y];while(p.at(-1)!==x)p.push(prev[p.at(-1)]);p.reverse();paths.push({x,y,p});for(let j=1;j<p.length;j++)load[p[j-1]][p[j]]+=pi[x]*pi[y]*(p.length-1);}
 const congestion=load.map((row,i)=>row.map((v,j)=>i!==j&&P[i][j]>0?v/(pi[i]*P[i][j]):0)),rho=Math.max(...congestion.flat());return{connected:true,load,paths,congestion,rho};}
export function regularGraph(m,seed){const rng=random(seed),n=2*m,adj=Array.from({length:n},()=>Array(n).fill(0)),shuffle=()=>{const a=Array.from({length:m},(_,i)=>i);for(let j=m-1;j>0;j--){const k=Math.floor(rng()*(j+1));[a[j],a[k]]=[a[k],a[j]];}return a;};const perms=[Array.from({length:m},(_,i)=>i),shuffle(),shuffle()];for(const perm of perms)perm.forEach((j,i)=>{adj[i][m+j]++;adj[m+j][i]++;});const P=adj.map((row,i)=>row.map((x,j)=>x/6+(i===j?.5:0)));const seen=new Set([0]),queue=[0];for(let k=0;k<queue.length;k++)for(let j=0;j<n;j++)if(adj[queue[k]][j]&&!seen.has(j)){seen.add(j);queue.push(j);}return{adj,P,pi:uniform(n),connected:seen.size===n};}
