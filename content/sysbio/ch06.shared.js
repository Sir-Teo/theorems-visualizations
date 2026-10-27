// Own driven checkpoint networks and reaction models. Concentrations are synthetic.
import {finite,integer,lin,sum,fmt} from '../mathbio/ch06.shared.js';
import {gammaP,lgamma} from '../../assets/js/viz/math.js';
export {finite,integer,lin,sum,fmt};
export const O={step:'any',sig:5,fmt},I={step:1,int:true};
export const axes=(title,x,y,extra={})=>({title,x,y,height:340,axes:'box',gutter:true,...extra});
export const EPSILON=1e-5,REPORTER=1e-3,ENZYME_TOTAL=1;
export function logAdd(a,b){if(a===-Infinity)return b;if(b===-Infinity)return a;const m=Math.max(a,b);return m+Math.log1p(Math.exp(Math.min(a,b)-m));}
export function magnitude(log){
 if(log===-Infinity)return{value:0,log:null,status:'zero'};if(!Number.isFinite(log))throw RangeError('finite log magnitude required');
 const value=Math.exp(log);return value===Infinity?{value:null,log,status:'positive above binary64 range'}:{value,log,status:value===0?'positive below binary64 range':'positive'};
}
// Steady C_j / E, from a positive tridiagonal elimination. The last state has
// the same dissociation rate; the rare catalytic reporter is not in this generator.
function boundChain(d,m,r,n,thermal){
 const lambda=Array.from({length:n+1},(_,j)=>EPSILON**j);if(n===0||thermal)return lambda.map(x=>x/d);
 const b=[d+m],rhs=[lambda[0]];
 for(let j=1;j<=n;j++){b[j]=d+(j<n?m:0)+r*(1-m/b[j-1]);rhs[j]=lambda[j]+m*rhs[j-1]/b[j-1];}
 const x=Array(n+1);x[n]=rhs[n]/b[n];for(let j=n-1;j>=0;j--)x[j]=(rhs[j]+r*x[j+1])/b[j];return x;
}
// J_j = m (1-exp(-mu)) h_j. This positive system computes h without
// subtracting nearly equal forward and backward equilibrium fluxes.
function currentFactors(d,m,r,n){
 if(n===0)return[];const b=[d+m+r],rhs=[1];for(let j=1;j<n;j++){b[j]=d+m+r*(1-m/b[j-1]);rhs[j]=EPSILON**j+m*rhs[j-1]/b[j-1];}
 const h=Array(n);h[n-1]=rhs[n-1]/b[n-1];for(let j=n-2;j>=0;j--)h[j]=(rhs[j]+r*h[j+1])/b[j];return h;
}
export function proofreading({n=1,selectivity=10,advance=.01,affinity=25}={}){
 integer(n,0,4,'extra checkpoints');finite(selectivity,1,100,'off-rate selectivity');finite(advance,0,10,'forward activation rate');finite(affinity,0,30,'fuel affinity');
 const reverse=(advance/EPSILON)*Math.exp(-affinity),thermal=affinity===0||advance===0,lambda=Array.from({length:n+1},(_,j)=>EPSILON**j),free=ENZYME_TOTAL/(1+sum(lambda)*(1+1/selectivity)),d=[1,selectivity],conditional=d.map(k=>boundChain(k,advance,reverse,n,thermal)),bound=conditional.map(row=>row.map(x=>free*x)),factors=d.map(k=>currentFactors(k,advance,reverse,n)),g=-Math.expm1(-affinity),factor=sum(factors.flat());
 // Occupancy concentrations use the1µM inventory. Counts and work are per
 // enzyme, so their definition explicitly divides out that inventory.
 const fuelLog=n===0||advance===0||affinity===0?-Infinity:Math.log(free/ENZYME_TOTAL)+Math.log(advance)+Math.log(g)+Math.log(factor),fuel=magnitude(fuelLog),dissipation=magnitude(fuelLog===-Infinity?-Infinity:fuelLog+Math.log(affinity)),correct=REPORTER*bound[0][n]/ENZYME_TOTAL,wrong=REPORTER*bound[1][n]/ENZYME_TOTAL,reporterRate=correct+wrong,work=magnitude(dissipation.log===null?-Infinity:dissipation.log-Math.log(reporterRate));
 const nodes=[{name:'E',energy:0,concentration:free}],edges=[];
 for(let s=0;s<2;s++)for(let j=0;j<=n;j++){const id=1+s*(n+1)+j;nodes[id]={name:(s===0?'R':'W')+j,energy:j*Math.log(1/EPSILON)+Math.log(d[s]),concentration:bound[s][j]};edges.push({from:0,to:id,forward:lambda[j],reverse:d[s],kind:'binding',substrate:s});if(j<n)edges.push({from:id,to:id+1,forward:advance,reverse,kind:'activation',substrate:s});}
 return{n,selectivity,advance,affinity,reverse,free,lambda,conditional,bound,factors,g,fuel,dissipation,work,correct,wrong,reporterRate,error:bound[1][n]/bound[0][n],equilibriumError:1/selectivity,idealError:(1/selectivity)**(n+1),nodes,edges};
}
function logEscape(logx,x){if(logx===-Infinity)return-Infinity;if(x===0)return logx;return x<.01?logx+Math.log(-Math.expm1(-x)/x):Math.log(-Math.expm1(-x));}
function logExprel(x){return x===0?0:x<50?Math.log(Math.expm1(x)/x):x+Math.log1p(-Math.exp(-x))-Math.log(x);}
function elasticPoint(d,k,gap,background){
 const y=Math.sqrt(k)*d,penalty=y*y/2,a=4-penalty,logEta=background===0?-Infinity:Math.log(background),u=(Math.sqrt(k)*gap)*(y+Math.sqrt(k)*gap/2),logu=k===0||gap===0?-Infinity:Math.log(k)+Math.log(gap)+logAdd(d===0?-Infinity:Math.log(d),Math.log(gap)-Math.LN2),b=a-u,logA=logAdd(a,logEta),logB=logAdd(b,logEta),logZ=logAdd(0,logAdd(logA,logB)),contrast=a+logEscape(logu,u)-logB;
 const logSpecificity=contrast===-Infinity?0:contrast>36?contrast+Math.log1p(Math.exp(-contrast)):Math.log1p(Math.exp(contrast)),logAdvantage=contrast===-Infinity?-Infinity:contrast<-36?contrast:Math.log(logSpecificity);
 return{d,penalty,logSpecificity,logAdvantage,specificity:magnitude(logSpecificity),correct:Math.exp(logA-logZ),wrong:Math.exp(logB-logZ),free:Math.exp(-logZ),correctLog:logA-logZ,wrongLog:logB-logZ};
}
export function conformational({d=2,k=1,gap=1,background=.01}={}){
 finite(d,0,8,'native mismatch');finite(k,0,8,'elastic stiffness');finite(gap,0,2,'target geometry difference');finite(background,0,1,'nonspecific binding weight');const point=elasticPoint(d,k,gap,background);let optimum;
 if(k===0||gap===0)optimum={d:null,status:'flat specificity: no unique optimum'};
 else if(background===0)optimum={d:null,status:'no finite global maximum'};
 else{
  // Divide the stationary equation by the positive target difference and use
  // y=sqrt(k)d. This remains well conditioned as either k or gap becomes tiny.
  const delta=Math.sqrt(k)*gap,target=4-Math.log(background),above=y=>{if(y===0)return false;const t=y+delta/2,logTerm=Math.log(y)+Math.log(t)+logExprel(delta*t);if(logTerm<=0)return false;const logPhi=logTerm>50?logTerm:Math.log(Math.expm1(logTerm));return y*y/2+logPhi>target;};
  let lo=0,hi=1;while(!above(hi)){hi*=2;if(hi>128)throw Error('elastic optimum bracket');}for(let j=0;j<100;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(above(mid))hi=mid;else lo=mid;}const mismatch=((lo+hi)/2)/Math.sqrt(k);optimum={...elasticPoint(mismatch,k,gap,background),status:'unique positive optimum'};
 }
 let yieldOptimum;
 if(k===0)yieldOptimum={d:null,status:'flat yield: no unique optimum'};
 else if(gap===0)yieldOptimum={...elasticPoint(0,k,gap,background),status:'perfect-match yield maximum'};
 else{
  // Differentiate the normalized correct bound fraction. In x=d/gap,
  // its derivative changes sign once: the expression below is strictly
  // decreasing, positive at zero and negative above exp(4)+background.
  const a=k*gap*gap,sign=x=>Math.exp(4-a*(x+1)**2/2)+background*(x+1)*Math.exp(-a*(x+.5))-(1+background)*x;
  let lo=0,hi=Math.exp(4)+background+1;for(let j=0;j<100;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(sign(mid)>0)lo=mid;else hi=mid;}
  yieldOptimum={...elasticPoint(gap*((lo+hi)/2),k,gap,background),status:'unique positive yield maximum'};
 }
 return{d,k,gap,background,...point,optimum,yieldOptimum};
}
export function acr({mode='stable',total=2,a=1,b=1}={}){
 if(!['stable','unstable'].includes(mode))throw RangeError('ACR network');finite(total,.1,4,'conserved concentration');finite(a,.1,3,'first rate');finite(b,.1,3,'second rate');const threshold=mode==='stable'?b/a:a/b,positive=total>threshold,drift=x=>mode==='stable'?(total-x)*(b-a*x):x*(total-x)*(b*x-a);
 const equilibria=mode==='stable'?[{A:total,B:0,positive:false,stable:total<=threshold},...(positive?[{A:threshold,B:total-threshold,positive:true,stable:true}]:[])]:[{A:0,B:total,positive:false,stable:true},{A:total,B:0,positive:false,stable:total>threshold},...(positive?[{A:threshold,B:total-threshold,positive:true,stable:false}]:[])];
 return{mode,total,a,b,threshold,positive,equilibria,drift,phase:lin(161,0,total).map(x=>[x,drift(x)])};
}
export function acrTrace({total=2,a=1,b=1,T=12}={}){
 finite(total,.1,4,'conserved concentration');finite(a,.1,3,'activation coefficient');finite(b,.1,3,'return rate');finite(T,0,20,'time horizon');const r=a*total-b,B0=total/2;
 return lin(241,0,T).map(t=>{const x=-r*t,exp=Math.exp(x),integral=r===0?t:-Math.expm1(x)/r,B=B0/(exp+a*B0*integral);return[t,total-B,B];});
}
// Adaptive RK4 step-doubling with Richardson correction. Physical bounds are
// acceptance conditions: a rejected step is refined, never clipped to a boundary.
function integrate(rhs,y0,times,limits){
 const step=(y,t,h)=>{const k1=rhs(t,y),k2=rhs(t+h/2,y.map((x,i)=>x+h*k1[i]/2)),k3=rhs(t+h/2,y.map((x,i)=>x+h*k2[i]/2)),k4=rhs(t+h,y.map((x,i)=>x+h*k3[i]));return y.map((x,i)=>x+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);};
 let y=y0.slice(),t=0,h=.02,iterations=0;const result=[];
 for(const target of times){while(t<target){if(++iterations>100000)throw Error('reaction integration budget');const dt=Math.min(h,target-t),full=step(y,t,dt),half=step(step(y,t,dt/2),t+dt/2,dt/2),next=half.map((x,i)=>x+(x-full[i])/15),error=Math.max(...next.map((x,i)=>Math.abs(half[i]-full[i])/(15*(1e-12+1e-9*Math.max(Math.abs(x),Math.abs(y[i])))))),physical=next.every((x,i)=>Number.isFinite(x)&&x>=limits[i][0]&&x<=limits[i][1]);
   if(error<=1&&physical){y=next;t+=dt;h=dt*(error===0?2:Math.max(.2,Math.min(3,.9*error**(-.2))));}else{h=dt*(physical?Math.max(.1,.8*error**(-.2)):.5);if(t+h===t)throw Error('reaction integration cannot resolve step');}}
  result.push([target,...y]);}return result;
}
export function bifunctionalSteady({sensor=.8,regulator=2,signal=.6,architecture='bifunctional'}={}){
 finite(sensor,.1,4,'total sensor');finite(regulator,.1,4,'total regulator');finite(signal,0,2,'input rate');if(!['bifunctional','separate phosphatase'].includes(architecture))throw RangeError('phosphatase architecture');const k2=2,k3=1,p=.5;
 if(signal===0)return{sensor,regulator,signal,architecture,A:sensor,AP:0,B:regulator,BP:0,logAP:null,logBP:null,positive:false,status:'zero-input boundary'};
 if(architecture==='bifunctional'&&regulator<=signal/k3)return{sensor,regulator,signal,architecture,A:0,AP:sensor,B:0,BP:regulator,logAP:Math.log(sensor),logBP:Math.log(regulator),positive:false,status:'regulator supply below the positive-equilibrium threshold'};
 let BP,logBP;
 if(architecture==='bifunctional'){BP=signal/k3;logBP=Math.log(signal)-Math.log(k3);}
 else{const u=k2*signal*sensor,v=k2*p*regulator,w=p*signal,B=u+v+w,discriminant=(u-v)**2+2*w*(u+v)+w*w,logC=Math.log(k2)+Math.log(signal)+Math.log(sensor)+Math.log(regulator);logBP=Math.LN2+logC-Math.log(B+Math.sqrt(discriminant));BP=Math.exp(logBP);}
 const B=regulator-BP,logAP=Math.log(sensor)+Math.log(signal)-Math.log(signal+k2*B),AP=Math.exp(logAP),A=sensor-AP;return{sensor,regulator,signal,architecture,A,AP,B,BP,logAP,logBP,positive:true,status:AP===0||BP===0?'positive equilibrium includes concentrations below binary64 range':'positive equilibrium'};
}
export function bifunctional(p={}){
 const{T=20}=p;finite(T,0,30,'time horizon');const steady=bifunctionalSteady(p),{sensor,regulator,signal,architecture}=steady,rhs=(t,[AP,BP])=>{const A=sensor-AP,B=regulator-BP,transfer=2*AP*B;return[signal*A-transfer,transfer-(architecture==='bifunctional'?A*BP:.5*BP)];},trace=integrate(rhs,[.2*sensor,.1*regulator],lin(241,0,T),[[0,sensor],[0,regulator]]).map(([t,AP,BP])=>[t,sensor-AP,AP,regulator-BP,BP]);return{...steady,T,trace};
}
function rank(matrix){const a=matrix.map(row=>row.slice());if(!a.length||!a[0].length)return 0;let r=0;for(let j=0;j<a[0].length&&r<a.length;j++){let p=r;for(let i=r+1;i<a.length;i++)if(Math.abs(a[i][j])>Math.abs(a[p][j]))p=i;if(Math.abs(a[p][j])<1e-12)continue;[a[r],a[p]]=[a[p],a[r]];const pivot=a[r][j];for(let k=j;k<a[0].length;k++)a[r][k]/=pivot;for(let i=0;i<a.length;i++)if(i!==r){const q=a[i][j];for(let k=j;k<a[0].length;k++)a[i][k]-=q*a[r][k];}r++;}return r;}
export function networkAnalysis(complexes,reactions){
 const n=complexes.length,species=complexes[0].length,reach=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j)),adj=Array.from({length:n},()=>[]);for(const e of reactions){reach[e.from][e.to]=true;adj[e.from].push(e.to);adj[e.to].push(e.from);}for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)reach[i][j]||=reach[i][k]&&reach[k][j];
 const components=[],seen=new Set();for(let i=0;i<n;i++)if(!seen.has(i)){const group=[];function visit(j){if(seen.has(j))return;seen.add(j);group.push(j);adj[j].forEach(visit);}visit(i);components.push(group);}
 const strong=[],done=new Set();for(let i=0;i<n;i++)if(!done.has(i)){const g=[];for(let j=0;j<n;j++)if(reach[i][j]&&reach[j][i]){g.push(j);done.add(j);}strong.push(g);}const terminal=strong.filter(g=>!reactions.some(e=>g.includes(e.from)&&!g.includes(e.to))),nonterminal=Array.from({length:n},(_,i)=>i).filter(i=>!terminal.some(g=>g.includes(i))),N=Array.from({length:species},(_,i)=>reactions.map(e=>complexes[e.to][i]-complexes[e.from][i])),s=rank(N),weaklyReversible=reactions.every(e=>reach[e.to][e.from]);return{n,linkage:components.length,rank:s,deficiency:n-components.length-s,components,strong,terminal,nonterminal,weaklyReversible,N};
}
export const NETWORKS={
 binding:{species:['A','B','C'],labels:['A + B','C'],complexes:[[1,1,0],[0,0,1]],reactions:[{from:0,to:1,k:1},{from:1,to:0,k:.6}]},
 cycle:{species:['A','B','C'],labels:['A','B','C'],complexes:[[1,0,0],[0,1,0],[0,0,1]],reactions:[{from:0,to:1,k:1},{from:1,to:2,k:2},{from:2,to:0,k:3}]},
 chain:{species:['A','B','C'],labels:['A','B','C'],complexes:[[1,0,0],[0,1,0],[0,0,1]],reactions:[{from:0,to:1,k:1},{from:1,to:2,k:2}]},
 schloegl:{species:['A'],labels:['∅','A','2A','3A'],complexes:[[0],[1],[2],[3]],reactions:[{from:0,to:1,k:6},{from:1,to:0,k:11},{from:2,to:3,k:6},{from:3,to:2,k:1}]}
};
export function network(name='cycle'){if(!Object.hasOwn(NETWORKS,name))throw RangeError('network family');const z=NETWORKS[name];return{...z,...networkAnalysis(z.complexes,z.reactions),name};}
export function bindingEquilibrium(A=2,B=1.5){finite(A,.1,4,'A inventory');finite(B,.1,4,'B inventory');const K=.6,C=2*A*B/(A+B+K+Math.sqrt((A-B)**2+2*K*(A+B)+K*K));return{A:A-C,B:B-C,C,totalA:A,totalB:B};}
function uniformized(initial,rates,t){
 const q=Math.max(...rates),mean=q*t,N=Math.ceil(mean+12*Math.sqrt(mean+1)+24),out=initial.map(()=>0);let w=Math.exp(-mean),state=initial.slice();for(let j=0;j<=N;j++){state.forEach((x,i)=>out[i]+=w*x);const next=state.map((x,i)=>x*(1-rates[i]/q));state.forEach((x,i)=>{if(rates[i]>0)next[(i+1)%state.length]+=x*rates[i]/q;});state=next;w*=mean/(j+1);}return{values:out,tail:gammaP(N+1,mean)};
}
export function networkExperiment({name='cycle',total=2,poolB=1.5,initial=.35,T=12}={}){
 const z=network(name);finite(total,.1,4,'inventory');finite(poolB,.1,4,'second inventory');finite(initial,.05,.95,'initial fraction');finite(T,0,20,'time horizon');let equilibrium,trace,tail=0;
 if(name==='cycle'||name==='chain'){const rates=name==='cycle'?[1,2,3]:[1,2,0],start=[total*initial,total*(1-initial)/2,total*(1-initial)/2];trace=lin(241,0,T).map(t=>{const q=uniformized(start,rates,t);tail=Math.max(tail,q.tail);return[t,...q.values];});equilibrium=name==='cycle'?[[6*total/11,3*total/11,2*total/11]]:[[0,0,total]];}
 else if(name==='binding'){const eq=bindingEquilibrium(total,poolB),limit=Math.min(total,poolB);equilibrium=[[eq.A,eq.B,eq.C]];trace=integrate((t,[c])=>[(total-c)*(poolB-c)-.6*c],[initial*limit],lin(241,0,T),[[0,limit]]).map(([t,c])=>[t,total-c,poolB-c,c]);}
 else{equilibrium=[[1],[2],[3]];trace=integrate((t,[x])=>[-(x-1)*(x-2)*(x-3)],[4*initial],lin(241,0,T),[[0,4]]);}
 return{...z,total,poolB,initial,T,equilibrium,trace,tail};
}
// Positive serial phase probabilities give the impulse/pulse shape without
// subtracting almost equal exponentials when beta approaches gamma=1.
function cascadePoint(t,n,beta){
 const rates=[1,...Array(n).fill(beta)],q=Math.max(1,beta),mean=q*t,N=Math.ceil(mean+12*Math.sqrt(mean+1)+24);let state=Array(n+1).fill(0),w=Math.exp(-mean);state[0]=1;const p=state.map(()=>0);
 for(let j=0;j<=N;j++){state.forEach((x,i)=>p[i]+=w*x);const next=state.map((x,i)=>x*(1-rates[i]/q));for(let i=0;i<n;i++)next[i+1]+=state[i]*rates[i]/q;state=next;w*=mean/(j+1);}return{p,tail:gammaP(N+1,mean)};
}
export function cascade({n=3,alpha=1,beta=.5}={}){
 integer(n,1,5,'cascade tiers');finite(alpha,0,2,'activation coefficient');finite(beta,.1,3,'deactivation rate');const input=1e-6,mean=1+n/beta,sd=Math.sqrt(1+n/(beta*beta)),T=mean+8*sd;let tail=0;
 const trace=lin(241,0,T).map(t=>{const q=cascadePoint(t,n,beta);tail=Math.max(tail,q.tail);return[t,input*q.p[0],...Array.from({length:n},(_,i)=>alpha===0||q.p[i+1]===0?0:Math.exp(Math.log(input)+(i+1)*Math.log(alpha)-i*Math.log(beta)+Math.log(q.p[i+1])))];}),metrics=Array.from({length:n},(_,j)=>{const logGain=alpha===0?-Infinity:(j+1)*(Math.log(alpha)-Math.log(beta)),gain=magnitude(logGain),area=magnitude(logGain+Math.log(input)),poissonMaximum=j===0?0:j*Math.log(j)-j-lgamma(j+1),peakBound=magnitude(alpha===0?-Infinity:Math.log(input)+(j+1)*Math.log(alpha)-j*Math.log(beta)+poissonMaximum);return{tier:j+1,areaGain:gain.value,area:area.value,gain,areaMagnitude:area,peakBound,mean:alpha===0?null:1+(j+1)/beta,sd:alpha===0?null:Math.sqrt(1+(j+1)/(beta*beta)),sampledPeak:Math.max(...trace.map(row=>row[j+2]))};});
 return{n,alpha,beta,input,T,trace,metrics,tail,maximum:Math.max(...trace.flatMap(row=>row.slice(1)))};
}
export function receptor({ligand=1,Kd=1,receptors=1,KE=.15}={}){
 finite(ligand,0,100,'free ligand');finite(Kd,.05,5,'binding dissociation constant');finite(receptors,0,4,'receptor inventory');finite(KE,.01,5,'downstream concentration scale');const logOccupancy=ligand===0?-Infinity:Math.log(ligand)-Math.log(Kd+ligand),logBound=receptors===0||ligand===0?-Infinity:Math.log(receptors)+logOccupancy,logMaximum=receptors===0?-Infinity:Math.log(receptors)-Math.log(KE+receptors),logResponse=logBound===-Infinity?-Infinity:logBound-logAdd(Math.log(KE),logBound),occupancyMetric=magnitude(logOccupancy),boundMetric=magnitude(logBound),maximumMetric=magnitude(logMaximum),responseMetric=magnitude(logResponse),EC50=receptors===0?null:Kd*(KE/(KE+receptors)),shift=magnitude(logMaximum+Math.log(Kd));
 const normalizedMetric=receptors===0?null:magnitude(ligand===0?-Infinity:Math.log(ligand)-Math.log(EC50+ligand)),freeMetric=magnitude(receptors===0?-Infinity:Math.log(receptors)+Math.log(Kd)-Math.log(Kd+ligand));return{ligand,Kd,receptors,KE,occupancy:occupancyMetric.value,bound:boundMetric.value,maximum:maximumMetric.value,response:responseMetric.value,normalized:normalizedMetric?.value??null,EC50,shift,occupancyMetric,boundMetric,maximumMetric,responseMetric,normalizedMetric,freeMetric};
}
