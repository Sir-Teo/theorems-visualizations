// Literal Barnosky et al. 2011 Table 1. Ages retain that table's rounded timescale.
export const EXTINCTIONS = [
  { name:'Ordovician', age:443, genera:57, species:86, duration:'1.9–3.3 Myr', color:'purple' },
  { name:'Devonian', age:359, genera:35, species:75, duration:'2–29 Myr', color:'teal' },
  { name:'Permian', age:251, genera:56, species:96, duration:'0.16–2.8 Myr', color:'red' },
  { name:'Triassic', age:200, genera:47, species:80, duration:'0.6–8.3 Myr', color:'orange' },
  { name:'Cretaceous', age:65, genera:40, species:76, duration:'less than a year to 2.5 Myr', color:'pink' },
];
export const DEFAULT_LOSSES=EXTINCTIONS.map(e=>e.species/100);
const logit=x=>Math.log(x)-Math.log1p(-x);
export function logisticAdvance(n,r,dt){
  if(!Number.isFinite(n)||n<=0||n>1||!Number.isFinite(r)||r<=0||!Number.isFinite(dt)||dt<0)throw new RangeError('Positive finite stock/rate and nonnegative time required');
  return 1/(1+(1/n-1)*Math.exp(-r*dt));
}
export function recoveryTime(pre,loss,r){
  if(!Number.isFinite(pre)||pre<=0||pre>1||!Number.isFinite(loss)||loss<.05||loss>.995||!Number.isFinite(r)||r<=0)throw new RangeError('Valid pre-event stock, loss and rate required');
  const post=pre*(1-loss),target=.9*pre;
  return post>=target?0:(logit(target)-logit(post))/r;
}
export function extinctionModel(r=.5,losses=DEFAULT_LOSSES){
  if(!Number.isFinite(r)||r<.1||r>2||!Array.isArray(losses)||losses.length!==5||losses.some(f=>!Number.isFinite(f)||f<.05||f>.995))throw new RangeError('Rate0.1–2 and five loss fractions0.05–0.995 required');
  let n=.04,t=-550;const curve=[[t,n]],events=[];
  for(let i=0;i<5;i++){
    const e=EXTINCTIONS[i],end=-e.age,dt=end-t;
    for(let j=1;j<=48;j++)curve.push([t+dt*j/48,logisticAdvance(n,r,dt*j/48)]);
    const pre=curve.at(-1)[1],post=pre*(1-losses[i]),recovery=recoveryTime(pre,losses[i],r),next=i===4?0:-EXTINCTIONS[i+1].age;
    curve.push([end,post]);events.push({...e,loss:losses[i],pre,post,target:.9*pre,recovery,available:next-end,recoveredBeforeNext:recovery<=next-end});n=post;t=end;
  }
  for(let j=1;j<=48;j++)curve.push([t-t*j/48,logisticAdvance(n,r,-t*j/48)]);
  return {r,losses:losses.slice(),curve,events,final:curve.at(-1)[1]};
}
