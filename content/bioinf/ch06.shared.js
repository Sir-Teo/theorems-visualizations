// BIOINF6: declared synthetic phylogenetic models; branch units are explicit.
import {rng,lgamma,gammaP,gammaQ} from '../../assets/js/viz/math.js';
import {finite,integer,lin,sum,fmt} from '../mathbio/ch06.shared.js';
export {finite,integer,lin,sum,fmt};
export const DNA=['A','G','C','T'],SPLITS=['AB|CD','AC|BD','AD|BC'];
export const PAIRS=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
export const O={step:'any',sig:5,fmt},I={step:1,int:true};
export const axes=(title,x,y,extra={})=>({title,x,y,height:340,axes:'box',gutter:true,...extra});
export function random(seed=1){integer(seed,1,0xffffffff,'seed');const r=rng(seed);return{u:()=>r()+2**-33,normal:()=>r.normal()};}
export const exponential=r=>-Math.log(r.u());
export function logSum(a){const m=Math.max(...a);if(m===-Infinity)return m;return m+Math.log(sum(a.map(x=>Math.exp(x-m))));}
export function logAdd(a,b){if(a===-Infinity)return b;if(b===-Infinity)return a;const m=Math.max(a,b);return m+Math.log1p(Math.exp(Math.min(a,b)-m));}
export function probability(log){if(log===-Infinity)return{value:0,log:null,status:'zero likelihood'};if(!Number.isFinite(log))throw Error('Invalid log likelihood');const value=Math.exp(log);return{value,log,status:value===0?'positive below binary64 range':'positive'};}
export function frequencies(a=.25){finite(a,.1,.7,'frequency of A');const b=(1-a)/3;return[a,b,b,1-(a+b+b)];}
function logEscape(logx,x){if(logx===-Infinity)return-Infinity;if(x===0)return logx;return x<.01?logx+Math.log(-Math.expm1(-x)/x):Math.log(-Math.expm1(-x));}
export function transition(length,{model='JC69',pA=.25,cycle=.75,mult=1,retention=null}={}){
 if(!['JC69','equal-input','cycle','CFN'].includes(model))throw RangeError('substitution family');finite(length,0,4,'edge parameter');finite(mult,0,1e4,'edge multiplier');const K=model==='CFN'?2:4,pi=model==='equal-input'?frequencies(pA):Array(K).fill(1/K);
 if(retention!==null){finite(retention,0,1,'internal retention');if(!['JC69','CFN'].includes(model))throw RangeError('retention family');const lost=retention===1?-Infinity:Math.log1p(-retention);return{pi,logs:Array.from({length:K},(_,i)=>Array.from({length:K},(_,j)=>i===j?logAdd(retention===0?-Infinity:Math.log(retention),Math.log(pi[j])+lost):Math.log(pi[j])+lost))};}
 if(model==='CFN'){finite(length,0,.5,'edge flip probability');if(mult!==1)throw RangeError('binary flips are direct probabilities, not additive times');const stay=Math.log1p(-length),flip=length===0?-Infinity:Math.log(length);return{pi,logs:[[stay,flip],[flip,stay]]};}
 const effective=length*mult,logD=length===0||mult===0?-Infinity:Math.log(length)+Math.log(mult);
 if(model==='cycle'){
  finite(cycle,0,.9,'cycle imbalance');finite(effective,0,4,'cycle time');const a=(1+cycle)/2,b=(1-cycle)/2,terms=Array.from({length:4},()=>[]);let walk=[1,0,0,0];
  // Positive uniformization terms retain log probabilities of subnormal paths.
  // For t<=4, the omitted Poisson tail above63 is below5.24e-53.
  for(let n=0;n<64;n++){const w=n===0?-effective:logD===-Infinity?-Infinity:-effective+n*logD-lgamma(n+1);for(let j=0;j<4;j++)if(walk[j]>0)terms[j].push(w+Math.log(walk[j]));const next=[0,0,0,0];for(let j=0;j<4;j++){next[(j+1)%4]+=a*walk[j];next[(j+3)%4]+=b*walk[j];}walk=next;}
  const row=terms.map(logSum);return{pi,logs:Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>row[(j-i+4)%4]))};
 }
 const scale=model==='JC69'?.75:1-sum(pi.map(p=>p*p)),x=effective/scale,lost=logEscape(logD===-Infinity?-Infinity:logD-Math.log(scale),x);
 return{pi,logs:Array.from({length:4},(_,i)=>pi.map((p,j)=>i===j?logAdd(-x,Math.log(p)+lost):Math.log(p)+lost))};
}
export function quartet({topology=0,pendants=[.08,.25,.08,.25],internal=.12,rootFraction=.5,retention=null,unrooted=false}={}){
 integer(topology,0,2,'topology');if(!Array.isArray(pendants)||pendants.length!==4)throw RangeError('four pendant edges required');pendants.forEach(x=>finite(x,0,4,'pendant edge'));finite(internal,0,4,'internal edge');finite(rootFraction,0,1,'root fraction');if(retention!==null)finite(retention,0,1,'retention');
 const nodes=pendants.map((length,i)=>({id:i,leaf:i,children:[],edge:{length,mult:1}})),[left,right]=PAIRS[topology];
 if(unrooted){nodes.push({id:4,children:[...left,5],edge:null},{id:5,children:right.slice(),edge:{length:internal,mult:1,retention}});return{nodes,root:4,taxa:4,topology};}
 nodes.push({id:4,children:left.slice(),edge:{length:internal,mult:rootFraction}},{id:5,children:right.slice(),edge:{length:internal,mult:1-rootFraction}},{id:6,children:[4,5],edge:null});return{nodes,root:6,taxa:4,topology};
}
export function teachingTree(n=8,length=.15,shape='balanced'){
 integer(n,2,16,'taxa');finite(length,0,1,'uniform edge length');if(!['balanced','comb'].includes(shape))throw RangeError('tree shape');const nodes=Array.from({length:n},(_,i)=>({id:i,leaf:i,children:[],edge:{length,mult:1}}));
 function build(ids){if(ids.length===1)return ids[0];const cut=shape==='comb'?1:Math.floor(ids.length/2),children=[build(ids.slice(0,cut)),build(ids.slice(cut))],id=nodes.length;nodes.push({id,children,edge:{length,mult:1}});return id;}
 const root=build(Array.from({length:n},(_,i)=>i));nodes[root].edge=null;return{nodes,root,taxa:n};
}
export function postorder(tree){const order=[];function visit(id){for(const child of tree.nodes[id].children)visit(child);order.push(id);}visit(tree.root);return order;}
function prepare(tree,options){const matrices=tree.nodes.map(n=>n.edge?transition(n.edge.length,{...options,mult:n.edge.mult??1,retention:n.edge.retention??null}).logs:null),pi=transition(0,options).pi;return{matrices,pi,K:pi.length};}
function observe(tree,obs,K){if(!Array.isArray(obs)||obs.length!==tree.taxa)throw RangeError('one observed state per taxon required');obs.forEach(x=>integer(x,0,K-1,'observed state'));}
function prunePrepared(tree,obs,prepared){
 const{matrices,pi,K}=prepared;observe(tree,obs,K);const order=postorder(tree),vectors=Array(tree.nodes.length),messages=Array(tree.nodes.length);let terms=0;
 for(const id of order){const node=tree.nodes[id];if(node.leaf!==undefined){vectors[id]=Array.from({length:K},(_,j)=>j===obs[node.leaf]?0:-Infinity);continue;}const incoming=node.children.map(child=>{const msg=Array.from({length:K},(_,i)=>logSum(Array.from({length:K},(_,j)=>{terms++;return matrices[child][i][j]+vectors[child][j];})));messages[child]=msg;return msg;});vectors[id]=Array.from({length:K},(_,i)=>sum(incoming.map(m=>m[i])));}
 const logL=logSum(pi.map((p,i)=>Math.log(p)+vectors[tree.root][i]));return{...probability(logL),logL,order,vectors,messages,terms,K,pi,tree,observations:obs.slice()};
}
export function prune(tree,obs,options={}){return prunePrepared(tree,obs,prepare(tree,options));}
export function scaledVector(logs){const scale=Math.max(...logs);return scale===-Infinity?{values:null,logScale:null}: {values:logs.map(x=>Math.exp(x-scale)),logScale:scale};}
export function enumerate(tree,obs,options={}){
 const prep=prepare(tree,options);observe(tree,obs,prep.K);const internal=tree.nodes.filter(n=>n.leaf===undefined).map(n=>n.id);if(internal.length>5)throw RangeError('Enumeration budget: at most five ancestral nodes');const count=prep.K**internal.length,records=[];
 for(let h=0;h<count;h++){const states=Array(tree.nodes.length);obs.forEach((x,i)=>states[i]=x);let q=h;for(const id of internal){states[id]=q%prep.K;q=Math.floor(q/prep.K);}let logJoint=Math.log(prep.pi[states[tree.root]]);for(const node of tree.nodes)for(const child of node.children)logJoint+=prep.matrices[child][states[node.id]][states[child]];records.push({states,logJoint});}
 const logL=logSum(records.map(r=>r.logJoint));return{...probability(logL),logL,records:records.map(r=>({...r,posterior:logL===-Infinity?null:Math.exp(r.logJoint-logL)})),histories:count};
}
export function patterns(K=4){if(![2,4].includes(K))throw RangeError('alphabet size');return Array.from({length:K**4},(_,i)=>{const a=[];for(let j=0;j<4;j++){a.push(i%K);i=Math.floor(i/K);}return a;});}
export const patternIndex=(states,K=4)=>states.reduce((n,x,i)=>n+x*K**i,0);
export function patternLaw(tree,options={}){const prep=prepare(tree,options);return patterns(prep.K).map(obs=>prunePrepared(tree,obs,prep).logL);}
function categorical(r,logs){const u=r.u();let c=0;for(let j=0;j<logs.length;j++){c+=Math.exp(logs[j]);if(u<c)return j;}return logs.length-1;}
export function alignment({N=120,seed=1,topology=0,pendants=[.08,.25,.08,.25],internal=.12,model='JC69'}={}){
 integer(N,1,4000,'sites');const tree=quartet({topology,pendants,internal,unrooted:true}),prep=prepare(tree,{model}),r=random(seed),columns=[],counts=Array(prep.K**4).fill(0);
 for(let s=0;s<N;s++){const states=Array(tree.nodes.length);states[tree.root]=categorical(r,prep.pi.map(Math.log));function descend(id){for(const child of tree.nodes[id].children){states[child]=categorical(r,prep.matrices[child][states[id]]);descend(child);}}descend(tree.root);const column=states.slice(0,4);columns.push(column);counts[patternIndex(column,prep.K)]++;}return{columns,counts,N,K:prep.K,tree};
}
export function logLikelihood(counts,logs){if(counts.length!==logs.length)throw RangeError('pattern dimensions');let total=0;for(let i=0;i<counts.length;i++)if(counts[i]){if(logs[i]===-Infinity)return-Infinity;total+=counts[i]*logs[i];}return total;}
export function profileTables(topology,pendants,model='JC69'){
 const make=z=>patternLaw(quartet({topology,pendants,unrooted:true,retention:z}),{model});return{atZero:make(0),atOne:make(1)};
}
export function mixtureLogs(tables,z){finite(z,0,1,'retention');const a=z===1?-Infinity:Math.log1p(-z),b=z===0?-Infinity:Math.log(z);return tables.atZero.map((x,i)=>logAdd(a+x,b+tables.atOne[i]));}
function mixtureDerivative(counts,tables,z){let total=0;for(let i=0;i<counts.length;i++){if(!counts[i])continue;const a=tables.atZero[i],b=tables.atOne[i];if(a===-Infinity&&b===-Infinity)return null;let d;if(a===-Infinity)d=z===0?Infinity:1/z;else if(b===-Infinity)d=z===1?-Infinity:-1/(1-z);else{const ratio=b-a;if(ratio>0){const u=Math.exp(-ratio);d=(-Math.expm1(-ratio))/(z+(1-z)*u);}else{const u=Math.exp(ratio);d=Math.expm1(ratio)/((1-z)+z*u);}}total+=counts[i]*d;}return total;}
export function profile(counts,tables,{minRetention=Math.exp(-8/3),maxRetention=1}={}){
 finite(minRetention,0,1,'lower retention');finite(maxRetention,minRetention,1,'upper retention');counts.forEach(x=>finite(x,0,1e7,'pattern weight'));if(counts.length!==tables.atZero.length)throw RangeError('pattern weights');if(sum(counts)===0)return{retention:null,logL:0,status:'no observations'};
 const left=mixtureDerivative(counts,tables,minRetention),right=mixtureDerivative(counts,tables,maxRetention);if(left===null||right===null)return{retention:null,logL:-Infinity,status:'impossible under every internal edge'};let z,status;
 if(counts.every((n,i)=>n===0||tables.atZero[i]===tables.atOne[i]))return{retention:minRetention,logL:logLikelihood(counts,tables.atZero),status:'flat: every internal edge maximizes'};
 if(left<=0){z=minRetention;status='lower endpoint';}else if(right>=0){z=maxRetention;status='upper endpoint';}else{let lo=minRetention,hi=maxRetention;for(let j=0;j<90;j++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(mixtureDerivative(counts,tables,mid)>0)lo=mid;else hi=mid;}const candidates=[lo,(lo+hi)/2,hi];z=candidates.reduce((a,b)=>logLikelihood(counts,mixtureLogs(tables,a))>=logLikelihood(counts,mixtureLogs(tables,b))?a:b);status='interior maximum';}
 return{retention:z,logL:logLikelihood(counts,mixtureLogs(tables,z)),status};
}
export function profileQuartets(counts,pendants=[.08,.25,.08,.25],model='JC69'){
 const tables=Array.from({length:3},(_,t)=>profileTables(t,pendants,model)),fits=tables.map(x=>profile(counts,x,{minRetention:model==='CFN'?0:Math.exp(-8/3)}));return{tables,fits};
}
export function gammaDraw(r,shape){
 finite(shape,.1,8,'Gamma shape');const a=shape<1?shape+1:shape,d=a-1/3,c=1/Math.sqrt(9*d);let x,v,u;
 do{do{x=r.normal();v=1+c*x;}while(v<=0);v=v**3;u=r.u();}while(u>=1-.0331*x**4&&Math.log(u)>=.5*x*x+d*(1-v+Math.log(v)));
 const g=d*v;return(shape<1?g*Math.exp(Math.log(r.u())/shape):g)/shape;
}
export function gammaAttenuation(d,shape){finite(d,0,4,'total path length');finite(shape,.1,8,'Gamma shape');return Math.exp(-shape*Math.log1p((4/3)*d/shape));}
export function gammaStudy({shape=.4,d=.8,N=400,seed=1}={}){
 finite(shape,.1,8,'Gamma shape');finite(d,0,4,'total path length');integer(N,20,2000,'sites');const rr=random(seed),er=random(seed+100003),rates=[],events=[];
 for(let i=0;i<N;i++){const rate=gammaDraw(rr,shape);rates.push(rate);events.push(er.u()<-.75*Math.expm1(-(4/3)*d*rate)?1:0);}
 const bins=Array.from({length:24},(_,j)=>{const lo=j/6,hi=(j+1)/6,p=lo*shape>shape+1?gammaQ(shape,lo*shape)-gammaQ(shape,hi*shape):gammaP(shape,hi*shape)-gammaP(shape,lo*shape);return{lo,hi,p,density:p/(hi-lo),observed:rates.filter(x=>x>=lo&&x<hi).length/N/(hi-lo)};}),x=(4/3)*d/shape;
 return{shape,d,N,rates,events,bins,tail:gammaQ(shape,4*shape),sampleTail:rates.filter(x=>x>=4).length/N,match:.25+.75*gammaAttenuation(d,shape),homogeneousMatch:.25+.75*Math.exp(-(4/3)*d),independentEdgeMatch:.25+.75*gammaAttenuation(d/2,shape)**2,jcLength:x===0?d:d*(Math.log1p(x)/x),observedMismatch:sum(events)/N};
}
export function quartetDistances(columns,indices=null){
 const n=indices?.length??columns.length;if(n===0)throw RangeError('nonempty alignment required');const counts=Array.from({length:4},()=>Array(4).fill(0));for(let s=0;s<n;s++){const col=columns[indices?indices[s]:s];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(col[i]!==col[j])counts[i][j]=++counts[j][i];}
 const scores=PAIRS.map(p=>p.reduce((z,[a,b])=>z+counts[a][b],0)),best=Math.min(...scores),winners=scores.flatMap((x,j)=>x===best?[j]:[]),distances=counts.map(row=>row.map(x=>x/n));return{counts,scores,winners,distances};
}
export function njQuartet(distances,topology=0){
 integer(topology,0,2,'topology');const [[a,b],[c,d]]=PAIRS[topology],rows=distances.map(sum),Q=distances.map((row,i)=>row.map((x,j)=>i===j?null:2*x-rows[i]-rows[j])),ab=distances[a][b],limbA=.5*ab+.25*(rows[a]-rows[b]),uc=.5*(distances[a][c]+distances[b][c]-ab),ud=.5*(distances[a][d]+distances[b][d]-ab),inner=.5*(uc+ud-distances[c][d]);
 const limbs=Array(4);limbs[a]=limbA;limbs[b]=ab-limbA;limbs[c]=uc-inner;limbs[d]=ud-inner;return{Q,limbs,internal:inner};
}
export function bootstrap({N=100,B=100,internal=.12,dataSeed=1,bootstrapSeed=2}={}){
 integer(N,20,240,'sites');integer(B,20,200,'replicates');finite(internal,0,.6,'generating internal length');const data=alignment({N,seed:dataSeed,internal}),r=random(bootstrapSeed),replicates=[],counts=[0,0,0,0];
 for(let b=0;b<B;b++){const indices=Array.from({length:N},()=>Math.floor(r.u()*N)),q=quartetDistances(data.columns,indices),winner=q.winners.length===1?q.winners[0]:3;counts[winner]++;replicates.push({indices,...q,winner});}
 return{data,B,replicates,original:quartetDistances(data.columns),counts,support:counts.map(n=>n/B)};
}
export function gridPosterior({N=100,dataSeed=1,priorRate=1}={}){
 integer(N,20,240,'sites');finite(priorRate,0,5,'discrete prior rate');const data=alignment({N,seed:dataSeed}),tables=Array.from({length:3},(_,t)=>profileTables(t,[.08,.25,.08,.25])),states=[];
 for(let t=0;t<3;t++)for(let j=0;j<21;j++){const d=j/10,logL=logLikelihood(data.counts,mixtureLogs(tables[t],Math.exp(-(4/3)*d)));states.push({topology:t,j,d,logL,logWeight:logL-priorRate*d});}
 const logZ=logSum(states.map(s=>s.logWeight));states.forEach(s=>{s.posterior=Math.exp(s.logWeight-logZ);});return{data,states,topologyMass:[0,1,2].map(t=>sum(states.filter(s=>s.topology===t).map(s=>s.posterior)))};
}
export function gridProposal(index,choice){integer(index,0,62,'chain state');integer(choice,0,3,'proposal choice');const t=Math.floor(index/21),j=index%21;if(choice<2)return((t+choice+1)%3)*21+j;const k=j+(choice===2?-1:1);return k<0||k>20?index:t*21+k;}
export function metropolis({N=100,dataSeed=1,priorRate=1,chainSeed=2,steps=1200}={}){
 integer(steps,100,4000,'chain steps');const target=gridPosterior({N,dataSeed,priorRate}),r=random(chainSeed),chain=[{index:0,proposed:0,accepted:false}];let current=0;
 for(let k=1;k<=steps;k++){const proposal=gridProposal(current,Math.floor(r.u()*4)),a=target.states[proposal].logWeight-target.states[current].logWeight,accepted=Math.log(r.u())<Math.min(0,a);if(accepted)current=proposal;chain.push({index:current,proposed:proposal,accepted});}return{...target,chain,steps};
}
export function chainSummary(z,position=1,burn=.2){
 finite(position,0,1,'chain position');finite(burn,0,.8,'burn fraction');const k=Math.floor(position*z.steps),start=Math.floor(burn*z.steps)+1,kept=z.chain.slice(start,k+1),counts=[0,0,0];kept.forEach(s=>counts[z.states[s.index].topology]++);return{k,start,kept,counts,fractions:kept.length?counts.map(x=>x/kept.length):null,acceptances:sum(z.chain.slice(1,k+1).map(x=>+x.accepted))};
}
export function binaryParsimony(){return[0,1,2].map(t=>patterns(2).map(obs=>{const [[a,b],[c,d]]=PAIRS[t];let best=Infinity;for(let i=0;i<2;i++)for(let j=0;j<2;j++)best=Math.min(best,+(obs[a]!==i)+ +(obs[b]!==i)+ +(obs[c]!==j)+ +(obs[d]!==j)+ +(i!==j));return best;}));}
export function binaryStudy({long=.4,short=.01,internal=.01,N=1000,seed=1}={}){
 finite(long,0,.49,'long pendant flip');finite(short,0,.2,'short pendant flip');finite(internal,0,.2,'internal flip');integer(N,20,4000,'sites');const pendants=[long,short,long,short],law=patternLaw(quartet({pendants,internal,unrooted:true}),{model:'CFN'}),prob=law.map(Math.exp),data=alignment({N,seed,pendants,internal,model:'CFN'}),costs=binaryParsimony(),tables=Array.from({length:3},(_,t)=>profileTables(t,pendants,'CFN')),fit=counts=>tables.map(t=>profile(counts,t,{minRetention:0})),expectedFits=fit(prob),expectedMP=costs.map(c=>sum(c.map((x,i)=>x*prob[i]))),counts=Array(16).fill(0),sampleMP=[0,0,0],trace=[],checkpoints=new Set(lin(Math.min(45,N),1,N).map(Math.round));
 data.columns.forEach((col,i)=>{const p=patternIndex(col,2);counts[p]++;costs.forEach((c,t)=>sampleMP[t]+=c[p]);if(checkpoints.has(i+1)){const f=fit(counts);trace.push({n:i+1,mpGap:(sampleMP[1]-sampleMP[0])/(i+1),llGap:(f[0].logL-f[1].logL)/(i+1)});}});
 return{data,law,prob,costs,tables,expectedFits,expectedMP,expectedMPGap:expectedMP[1]-expectedMP[0],populationLLGap:expectedFits[0].logL-expectedFits[1].logL,fits:fit(counts),sampleMP:sampleMP.map(x=>x/N),trace,identified:internal>0&&long<.5&&short<.5};
}
export function geneTrees({tau=.3,N=300,seed=1}={}){
 finite(tau,0,4,'internal population length');integer(N,20,1000,'independent loci');const r=random(seed),genes=[],counts=[0,0,0];
 for(let i=0;i<N;i++){const w=exponential(r);let pair,first,root,within;if(w<tau){pair=0;first=1+w;root=1+tau+exponential(r);within=true;}else{pair=Math.floor(r.u()*3);first=1+tau+exponential(r)/3;root=first+exponential(r);within=false;}counts[pair]++;genes.push({pair,first,root,within});}
 const discordance=Math.exp(-tau)/3;return{tau,N,genes,counts,fractions:counts.map(x=>x/N),expected:[1-2*discordance,discordance,discordance]};
}
