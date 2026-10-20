// Authored four-group extension; the ideal Gumbel identities are proved in the item.
export const LEARNING_GAMMA=.5772156649015329,LEARNING_GENS=120,LEARNING_RUNS=10;
export const LEARNING_SKILLS=Object.freeze([{name:'simple',alpha:3,color:'green'},{name:'moderate',alpha:5,color:'orange'},{name:'complex',alpha:7,color:'red'}].map(Object.freeze));
export function learningRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return(((t^(t>>>14))>>>0)+.5)/4294967296;};}
export function learningMaximum(mode,beta,n,u){if(!Number.isFinite(mode)||!Number.isFinite(beta)||beta<=0||!Number.isInteger(n)||n<1||!Number.isFinite(u)||u<=0||u>=1)throw new RangeError('Finite mode, positive scale/count, open uniform required');return mode+beta*(Math.log(n)-Math.log(-Math.log(u)));}
export function learningDrift(n,beta,alpha){return-alpha+beta*(Math.log(n)+LEARNING_GAMMA);}
export function learningAllocation(m,c){
 if(!Number.isInteger(m)||m<1||m>1250||!Number.isFinite(c)||c<0||c>1||c!==Math.round(c*20)/20)throw new RangeError('Integer group size and exact twentieth share required');
 // All offered shares are rational ticks. Integer arithmetic preserves positive half ties.
 const tick=Math.round(c*20);return Math.floor((tick*m+10)/20);
}
let lastKey='',lastModel;
export function learningModel(m=50,c=.3,beta=1,seed=3,bound=true){
 if(!Number.isInteger(m)||m<1||m>1250||!Number.isFinite(c)||c<0||c>1||c!==Math.round(c*20)/20||!Number.isFinite(beta)||beta<.5||beta>2||!Number.isInteger(seed)||seed<0||seed>9999||typeof bound!=='boolean')throw new RangeError('Declared group size, global share, scale, seed and bound required');
 const key=JSON.stringify([m,c,beta,seed,bound]);if(key===lastKey)return structuredClone(lastModel);
 const q=learningAllocation(m,c),own=m-q,N=4*m,initial=12;
 const scenarios=LEARNING_SKILLS.map((skill,si)=>{
  const runs=Array.from({length:LEARNING_RUNS},(_,ri)=>{const rng=learningRng(seed+1013*ri+7919*si);let z=Array(4).fill(initial);const groups=[z.slice()],best=[initial];for(let g=0;g<LEARNING_GENS;g++){const global=Math.max(...z);z=z.map(local=>{let next=-Infinity;if(own)next=learningMaximum(local-skill.alpha,beta,own,rng());if(q)next=Math.max(next,learningMaximum(global-skill.alpha,beta,q,rng()));return bound?Math.max(0,next):next;});groups.push(z.slice());best.push(Math.max(...z));}return{groups,best};});
  const meanBest=Array.from({length:LEARNING_GENS+1},(_,g)=>runs.reduce((sum,r)=>sum+r.best[g],0)/LEARNING_RUNS),threshold=Math.exp(skill.alpha/beta-LEARNING_GAMMA);
  const guide=Array.from({length:201},(_,i)=>{const n=4*Math.exp(i/200*Math.log(1250));return[n,learningDrift(n,beta,skill.alpha)];}),isolatedGuide=guide.map(([n])=>[n,learningDrift(n/4,beta,skill.alpha)]);
  return{...skill,runs,meanBest,threshold,isolatedTotalThreshold:4*threshold,wellMixedDrift:learningDrift(N,beta,skill.alpha),perGroupDrift:learningDrift(m,beta,skill.alpha),guide,isolatedGuide};
 });
 lastKey=key;lastModel={m,c,beta,seed,bound,N,q,own,actualShare:q/m,initial,gens:LEARNING_GENS,repetitions:LEARNING_RUNS,scenarios};return structuredClone(lastModel);
}
