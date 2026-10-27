// Original SOC6 finite mechanisms. Authored illustrations, distinct from empirical study data.
import * as Q from './ch06.exact.shared.js';
export {Q};
const {add,sub,mul,div,sign}=Q;
const abs=x=>sign(x)<0?Q.neg(x):Q.exact(x);
const eq=(a,b)=>sign(sub(a,b))===0;
const bounded=(x,a,b,name)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw RangeError(name+' outside declared range');return x;};
const integer=(x,a,b,name)=>{bounded(x,a,b,name);if(!Number.isInteger(x))throw RangeError(name+' must be an integer');return x;};
const choose=(x,xs,name)=>{if(!xs.includes(x))throw RangeError('Unknown '+name);return x;};
export const quantity=x=>{const exact=Q.exact(x);return {exact,value:Q.approximate(exact),sign:sign(exact)};};
const pack=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,quantity(v)]));
const mean=xs=>div(xs.reduce(add,Q.ZERO),xs.length);
const qarray=xs=>xs.map(quantity);
// Explicit deterministic pseudorandom realization, not an exact iid generator.
export function generator(seed=37){integer(seed,0,999,'seed');let state=seed+1;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function graph(kind='star'){
 choose(kind,['cycle','torus','star'],'graph');const n=16,neighbors=Array.from({length:n},()=>[]);
 const edge=(i,j)=>{if(!neighbors[i].includes(j)){neighbors[i].push(j);neighbors[j].push(i);}};
 if(kind==='cycle')for(let i=0;i<n;i++)edge(i,(i+1)%n);
 if(kind==='torus')for(let y=0;y<4;y++)for(let x=0;x<4;x++){edge(4*y+x,4*y+(x+1)%4);edge(4*y+x,4*((y+1)%4)+x);}
 if(kind==='star')for(let i=1;i<n;i++)edge(0,i);
 neighbors.forEach(xs=>xs.sort((a,b)=>a-b));
 return {kind,n,neighbors,degree:neighbors.map(xs=>xs.length),edges:neighbors.flatMap((xs,i)=>xs.filter(j=>i<j).map(j=>[i,j]))};
}
function voterInitial(g,initial,random){
 choose(initial,['hub only','half','alternating','seeded'],'initial state');
 return Array.from({length:g.n},(_,i)=>initial==='hub only'?Number(i===0):initial==='half'?Number(i<8):initial==='alternating'?i%2:Number(random()<.5));
}
export function voterKernel({kind='star',state}={}){
 const g=graph(kind);if(!Array.isArray(state)||state.length!==16||state.some(x=>x!==0&&x!==1))throw RangeError('Sixteen binary opinions required');
 const totalDegree=g.degree.reduce((a,b)=>a+b,0),plain=div(state.reduce((a,b)=>a+b,0),16),weighted=div(state.reduce((s,x,i)=>s+x*g.degree[i],0),totalDegree);
 const events=[];let expectedPlainDrift=Q.ZERO,expectedWeightedDrift=Q.ZERO;
 for(let i=0;i<16;i++)for(const j of g.neighbors[i]){
  const delta=state[j]-state[i],probability=Q.rational(1,16*g.degree[i]),deltaPlain=div(delta,16),deltaWeighted=Q.rational(delta*g.degree[i],totalDegree);
  expectedPlainDrift=add(expectedPlainDrift,mul(probability,deltaPlain));expectedWeightedDrift=add(expectedWeightedDrift,mul(probability,deltaWeighted));
  events.push({site:i,neighbor:j,changed:delta!==0,...pack({probability,deltaPlain,deltaWeighted})});
 }
 return {graph:g,state:[...state],events,...pack({plain,weighted,expectedPlainDrift,expectedWeightedDrift}),absorbed:state.every(x=>x===state[0])};
}
// Single-parameter-set deterministic cache; controls and clock fully determine it.
let voterCache=null;
export function voter({kind='star',initial='hub only',seed=37,attempts=80}={}){
 integer(attempts,0,400,'attempt count');integer(seed,0,999,'seed');choose(initial,['hub only','half','alternating','seeded'],'initial state');const g=graph(kind),totalDegree=g.degree.reduce((s,x)=>s+x,0),key=JSON.stringify([kind,initial,seed]);
 if(voterCache?.key!==key){const random=generator(seed);voterCache={key,random,state:voterInitial(g,initial,random),history:[]};}
 const cache=voterCache;
 const sample=(attempt,event,changes,firstAbsorbed)=>{
  const state=[...cache.state],plainCount=state.reduce((s,x)=>s+x,0),weightedCount=state.reduce((s,x,i)=>s+x*g.degree[i],0),absorbed=state.every(x=>x===state[0]);
  cache.history.push({attempt,state,plainCount,weightedCount,event,changes,firstAbsorbed:firstAbsorbed??(absorbed?attempt:null)});
 };
 if(!cache.history.length)sample(0,null,0,null);
 while(cache.history.length<=attempts){const previous=cache.history.at(-1),site=Math.floor(cache.random()*16),neighbor=g.neighbors[site][Math.floor(cache.random()*g.degree[site])],old=cache.state[site];cache.state[site]=cache.state[neighbor];const changed=old!==cache.state[site],event={site,neighbor,previous:old,copied:cache.state[site],changed,attempt:previous.attempt+1};sample(previous.attempt+1,event,previous.changes+Number(changed),previous.firstAbsorbed);}
 const row=cache.history[attempts],history=cache.history.slice(0,attempts+1).map(r=>({attempt:r.attempt,state:[...r.state],plain:quantity(Q.rational(r.plainCount,16)),weighted:quantity(Q.rational(r.weightedCount,totalDegree))}));
 return {...voterKernel({kind,state:row.state}),initial,seed,attempts,history,lastEvent:row.event?{...row.event}:null,firstAbsorbed:row.firstAbsorbed,changes:row.changes,illustration:true};
}
export const opinionProfiles={
 'three groups':[.04,.10,.16,.22,.36,.43,.51,.58,.74,.81,.87,.94],
 'asymmetric bridge':[0,.125,.375,.625,1],
 'even spacing':Array.from({length:12},(_,i)=>i/11),
 'two blocs':[.05,.08,.11,.14,.17,.20,.80,.83,.86,.89,.92,.95]
};
export function confidenceStep(opinions,epsilon){
 bounded(epsilon,0,1,'confidence radius');if(!Array.isArray(opinions)||!opinions.length)throw RangeError('Nonempty opinions required');const e=Q.exact(epsilon),xs=opinions.map(Q.exact);if(xs.some(x=>sign(x)<0||sign(sub(x,1))>0))throw RangeError('Opinions outside unit interval');
 const neighbors=xs.map(x=>xs.flatMap((y,j)=>sign(sub(abs(sub(x,y)),e))<=0?[j]:[])),next=neighbors.map(js=>mean(js.map(j=>xs[j])));
 const before=mean(xs),after=mean(next);return {before:xs,after:next,neighbors,...pack({meanBefore:before,meanAfter:after,meanChange:sub(after,before)}),fixed:xs.every((x,i)=>eq(x,next[i]))};
}
export function confidence({profile='three groups',epsilon=.2,steps=12,selected=4}={}){
 choose(profile,Object.keys(opinionProfiles),'opinion profile');integer(steps,0,24,'round');let xs=opinionProfiles[profile].map(Q.exact);integer(selected,0,xs.length-1,'selected agent');const history=[qarray(xs)];let firstFixed=null;
 for(let k=0;k<steps;k++){const z=confidenceStep(xs,epsilon);if(z.fixed&&firstFixed===null)firstFixed=k;xs=z.after;history.push(qarray(xs));}
 const current=confidenceStep(xs,epsilon);if(current.fixed&&firstFixed===null)firstFixed=steps;
 const sorted=[...xs].sort((a,b)=>sign(sub(a,b))),barriers=sorted.slice(1).flatMap((x,i)=>sign(sub(sub(x,sorted[i]),epsilon))>0?[{left:quantity(sorted[i]),right:quantity(x),gap:quantity(sub(x,sorted[i]))}]:[]);
 return {profile,epsilon,steps,selected,opinions:qarray(xs),history,neighbors:current.neighbors,selectedNeighbors:current.neighbors[selected],next:qarray(current.after),firstFixed,fixed:current.fixed,barriers,meanInitial:quantity(mean(opinionProfiles[profile])),meanCurrent:current.meanBefore,meanNext:current.meanAfter,illustration:true};
}
export function grid(size=6){integer(size,2,8,'grid side');const n=size*size,neighbors=Array.from({length:n},()=>[]);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x;if(y)neighbors[i].push(i-size);if(x)neighbors[i].push(i-1);if(x<size-1)neighbors[i].push(i+1);if(y<size-1)neighbors[i].push(i+size);}return {size,n,neighbors,edges:neighbors.flatMap((js,i)=>js.filter(j=>i<j).map(j=>[i,j]))};}
export function cultureSummary(cultures,g){
 if(cultures.length!==g.n||!cultures.length||!cultures[0].length)throw RangeError('Culture/grid mismatch');const features=cultures[0].length;
 const links=g.edges.map(([i,j])=>{const overlap=cultures[i].reduce((s,x,f)=>s+Number(x===cultures[j][f]),0);return {i,j,overlap,active:overlap>0&&overlap<features};});
 const seen=new Set();let regions=0;for(let i=0;i<g.n;i++)if(!seen.has(i)){regions++;seen.add(i);const stack=[i];while(stack.length){const v=stack.pop();for(const w of g.neighbors[v])if(!seen.has(w)&&cultures[v].every((x,f)=>x===cultures[w][f])){seen.add(w);stack.push(w);}}}
 return {links,activeEdges:links.filter(x=>x.active).length,distinctCultures:new Set(cultures.map(xs=>xs.join(','))).size,regions,frozen:links.every(x=>!x.active),meanSimilarity:quantity(Q.rational(links.reduce((s,e)=>s+e.overlap,0),features*links.length))};
}
let cultureCache=null;
export function culture({features=4,traits=5,seed=37,attempts=300,size=6}={}){
 integer(features,1,5,'feature count');integer(traits,1,8,'traits per feature');integer(attempts,0,1600,'attempt count');integer(seed,0,999,'seed');const g=grid(size),key=JSON.stringify([features,traits,seed,size]);
 if(cultureCache?.key!==key){const random=generator(seed);cultureCache={key,random,cultures:Array.from({length:g.n},()=>Array.from({length:features},()=>Math.floor(random()*traits))),history:[],states:[],events:[]};}
 const cache=cultureCache;
 const sample=(attempt,event,changes,firstFrozen)=>{const z=cultureSummary(cache.cultures,g);cache.states.push(cache.cultures.map(xs=>[...xs]));cache.events.push(event);cache.history.push({attempt,activeEdges:z.activeEdges,distinctCultures:z.distinctCultures,regions:z.regions,meanSimilarity:z.meanSimilarity,changes,firstFrozen:firstFrozen??(z.frozen?attempt:null)});};
 if(!cache.history.length)sample(0,null,0,null);
 while(cache.history.length<=attempts){
  const previous=cache.history.at(-1),site=Math.floor(cache.random()*g.n),neighbor=g.neighbors[site][Math.floor(cache.random()*g.neighbors[site].length)],differences=cache.cultures[site].flatMap((x,f)=>x===cache.cultures[neighbor][f]?[]:[f]),overlap=features-differences.length,gate=cache.random(),interacted=gate<overlap/features&&differences.length>0;let feature=null,old=null,copied=null;
  if(interacted){feature=differences[Math.floor(cache.random()*differences.length)];old=cache.cultures[site][feature];copied=cache.cultures[neighbor][feature];cache.cultures[site][feature]=copied;}
  const event={attempt:previous.attempt+1,site,neighbor,overlap,features,differences,gate,interacted,feature,previous:old,copied};sample(previous.attempt+1,event,previous.changes+Number(interacted),previous.firstFrozen);
 }
 const row=cache.history[attempts],cultures=cache.states[attempts].map(xs=>[...xs]),event=cache.events[attempts],history=cache.history.slice(0,attempts+1).map(r=>({attempt:r.attempt,activeEdges:r.activeEdges,distinctCultures:r.distinctCultures,regions:r.regions,meanSimilarity:quantity(Q.rational(r.meanSimilarity.exact.n,r.meanSimilarity.exact.d))}));
 return {features,traits,seed,attempts,graph:g,cultures,history,lastEvent:event?{...event,differences:[...event.differences]}:null,firstFrozen:row.firstFrozen,changes:row.changes,...cultureSummary(cultures,g),illustration:true};
}
function echoInitial(seed){const random=generator(seed),opinions=Array.from({length:12},(_,i)=>Q.exact((i<6?.12:.72)+.16*random())),edges=[];for(let i=0;i<12;i++)for(const j of [(i+1)%12,(i+11)%12,(i+6)%12])edges.push([i,j]);return {opinions,edges};}
export function echoStep(opinions,edges,{epsilon=.4,unfollowThreshold=.5,prune=true}={}){
 bounded(epsilon,0,1,'confidence radius');bounded(unfollowThreshold,0,1,'unfollow threshold');if(typeof prune!=='boolean')throw TypeError('Prune switch required');const xs=opinions.map(Q.exact),n=xs.length;
 if(!n||xs.some(x=>sign(x)<0||sign(sub(x,1))>0)||edges.some(([i,j])=>!Number.isInteger(i)||!Number.isInteger(j)||i<0||i>=n||j<0||j>=n||i===j)||new Set(edges.map(e=>e.join(','))).size!==edges.length)throw RangeError('Invalid directed simple graph');
 const neighbors=xs.map((x,i)=>[i,...edges.filter(([a,j])=>a===i&&sign(sub(abs(sub(x,xs[j])),epsilon))<=0).map(([,j])=>j)]),next=neighbors.map(js=>mean(js.map(j=>xs[j]))),removed=prune?edges.filter(([i,j])=>sign(sub(abs(sub(next[i],next[j])),unfollowThreshold))>0):[],keys=new Set(removed.map(e=>e.join(','))),retained=edges.filter(e=>!keys.has(e.join(',')));
 return {opinions:next,edges:retained.map(e=>[...e]),neighbors,removed:removed.map(e=>[...e])};
}
export function echo({epsilon=.7,unfollowThreshold=.45,prune=true,steps=8,seed=37}={}){
 integer(steps,0,24,'round');const initial=echoInitial(seed),run=doPrune=>{let opinions=initial.opinions,edges=initial.edges;const history=[{round:0,opinions:qarray(opinions),edges:edges.map(e=>[...e]),removed:[]}];for(let k=1;k<=steps;k++){const z=echoStep(opinions,edges,{epsilon,unfollowThreshold,prune:doPrune});opinions=z.opinions;edges=z.edges;history.push({round:k,opinions:qarray(opinions),edges:edges.map(e=>[...e]),removed:z.removed});}return {opinions:qarray(opinions),edges,history};};
 return {epsilon,unfollowThreshold,prune,steps,seed,initial:{opinions:qarray(initial.opinions),edges:initial.edges.map(e=>[...e])},fixedEdges:run(false),selected:run(prune),illustration:true};
}
export function disclosure({threshold=4,seedCount=2,round=6,heterogeneous=true}={}){
 integer(threshold,0,12,'disclosure threshold');integer(seedCount,0,12,'initial public dissenters');integer(round,0,12,'round');if(typeof heterogeneous!=='boolean')throw TypeError('Threshold mode required');const n=12,thresholds=Array.from({length:n},(_,i)=>heterogeneous?Math.max(0,Math.min(12,threshold+(i%5)-2)):threshold),privateOpposition=Array(n).fill(true);let publicDissent=Array.from({length:n},(_,i)=>i<seedCount),firstFixed=null;const history=[{round:0,count:seedCount,publicDissent:[...publicDissent]}];
 for(let k=1;k<=round;k++){const count=publicDissent.filter(Boolean).length,next=publicDissent.map((x,i)=>x||(privateOpposition[i]&&count>=thresholds[i]));if(next.every((x,i)=>x===publicDissent[i])&&firstFixed===null)firstFixed=k-1;publicDissent=next;history.push({round:k,count:next.filter(Boolean).length,publicDissent:[...next]});}
 const count=publicDissent.filter(Boolean).length,eligible=publicDissent.map((x,i)=>!x&&privateOpposition[i]&&count>=thresholds[i]),fixed=eligible.every(x=>!x);if(fixed&&firstFixed===null)firstFixed=round;
 return {threshold,seedCount,round,heterogeneous,thresholds,privateOpposition,publicDissent,eligible,privateCount:n,publicCount:count,hiddenOpposition:n-count,history,firstFixed,fixed,illustration:true};
}
export function phaseInitial({seed=37,spread=.25}={}){
 bounded(spread,0,.5,'frequency spread');const random=generator(seed),phases=Array.from({length:16},()=>2*Math.PI*random()),offsets=Array.from({length:8},(_,i)=>(i+1)/8),frequencies=offsets.flatMap(a=>[1-spread*a,1+spread*a]);return {phases,frequencies};
}
export function phaseResultant(phases){const n=phases.length,c=phases.reduce((s,x)=>s+Math.cos(x),0)/n,s=phases.reduce((s,x)=>s+Math.sin(x),0)/n;return {cosine:c,sine:s,R:Math.hypot(c,s),angle:Math.atan2(s,c)};}
export function phaseDerivative(phases,frequencies,coupling){const z=phaseResultant(phases);return phases.map((x,i)=>2*Math.PI*frequencies[i]+coupling*(z.sine*Math.cos(x)-z.cosine*Math.sin(x)));}
function rk4(phases,frequencies,coupling,h){const a=phaseDerivative(phases,frequencies,coupling),b=phaseDerivative(phases.map((x,i)=>x+h*a[i]/2),frequencies,coupling),c=phaseDerivative(phases.map((x,i)=>x+h*b[i]/2),frequencies,coupling),d=phaseDerivative(phases.map((x,i)=>x+h*c[i]),frequencies,coupling);return phases.map((x,i)=>x+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);}
// A cache of deterministic full RK4 steps makes animation incremental. No
// interpolation: a requested fractional step is integrated from its left state.
let phaseCache=null;
export function synchrony({seed=37,spread=.25,coupling=2,time=4,step=1/256}={}){
 bounded(coupling,0,6,'coupling');bounded(time,0,12,'time');if(step!==1/256&&step!==1/512)throw RangeError('Declared RK4 step required');const key=JSON.stringify([seed,spread,coupling,step]);
 if(phaseCache?.key!==key){const initial=phaseInitial({seed,spread});phaseCache={key,initial,states:[initial.phases]};}
 const cached=phaseCache,initial=cached.initial,completeSteps=Math.floor(time/step),history=[];
 while(cached.states.length<=completeSteps){const at=cached.states.length*step;cached.states.push(coupling===0?initial.phases.map((x,i)=>x+2*Math.PI*initial.frequencies[i]*at):rk4(cached.states.at(-1),initial.frequencies,coupling,step));}
 for(let k=0;k<=completeSteps;k+=16)history.push({time:k*step,...phaseResultant(cached.states[k])});
 let phases=[...cached.states[completeSteps]],t=completeSteps*step;
 if(t<time){phases=coupling===0?initial.phases.map((x,i)=>x+2*Math.PI*initial.frequencies[i]*time):rk4(phases,initial.frequencies,coupling,time-t);t=time;}
 if(history.at(-1).time!==time)history.push({time,...phaseResultant(phases)});
 const initialMean=initial.phases.reduce((s,x)=>s+x,0)/16,currentMean=phases.reduce((s,x)=>s+x,0)/16;
 return {seed,spread,coupling,time,step,initial:{phases:[...initial.phases],frequencies:[...initial.frequencies]},phases,frequencies:[...initial.frequencies],resultant:phaseResultant(phases),velocities:phaseDerivative(phases,initial.frequencies,coupling),history,initialMean,currentMean,expectedMean:initialMean+2*Math.PI*time,meanResidual:currentMean-(initialMean+2*Math.PI*time),approximate:true,illustration:true};
}
export function lineBoard({scale=1,correct=1,answer=null,majority='unanimous wrong',reveal=false}={}){
 bounded(scale,.6,1.4,'line scale');integer(correct,0,2,'matching position');if(answer!==null)integer(answer,0,2,'answer');choose(majority,['unanimous wrong','truthful dissenter','no group'],'group script');if(typeof reveal!=='boolean')throw TypeError('Reveal switch required');const ratios=[.72,1,1.28],lengths=ratios.map((_,i)=>mul(scale,ratios[(i-correct+4)%3])),standard=Q.exact(scale),wrong=(correct+1)%3,script=majority==='no group'?[]:Array.from({length:6},(_,i)=>majority==='truthful dissenter'&&i===5?correct:wrong);
 return {scale,correct,answer,majority,reveal,standard:quantity(standard),lengths:qarray(lengths),script,answered:answer!==null,matches:answer===null?null:answer===correct,illustration:true,diagnosis:false};
}
export function aschEvidence({condition='unanimous majority'}={}){
 const rows={
  'unanimous majority':{rate:36.8,denominator:'critical-trial responses',precision:'reported rounded percentage',sample:'123 college young men in the 1955 account'},
  'judging alone':{upperBound:1,strictUpper:true,denominator:'line judgments',precision:'reported as less than one percent'},
  'majority of two':{rate:13.6,denominator:'critical-trial responses',precision:'reported rounded percentage; condition sample size not verified'},
  'majority of three':{rate:31.8,denominator:'critical-trial responses',precision:'reported rounded percentage; condition sample size not verified'},
  'truthful partner':{relative:'one fourth as often',denominator:'errors relative to the unanimous-majority condition',precision:'source relative wording; no exact derived percentage'},
  'extreme wrong dissenter':{rate:9,denominator:'critical-trial responses',precision:'reported percentage for a different dissenting condition'}
 };choose(condition,Object.keys(rows),'reported condition');return {condition,...rows[condition],trialCount:18,criticalTrials:12,source:'Asch1955 distinct author article; original1956 monograph body unread',original1956Verified:false,independentBernoulliTrialsClaimed:false};
}
