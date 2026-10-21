// One prescribed opening/possible-closing episode. Rates in mm/yr equal km/Myr.
export function wilsonEvents({u,c,ts}){
  const ridgeTime=c>u/2?2*c*ts/(2*c-u):Infinity;
  const collisionTime=Number.isFinite(ridgeTime)?ridgeTime*(1+u/(2*c)):Infinity;
  return{ridgeTime,collisionTime};
}
export function wilsonState(p,t){
  const{u,c,ts}=p,{ridgeTime,collisionTime}=wilsonEvents(p);t=Math.max(0,t);
  const col=t>=collisionTime,ridge=t<ridgeTime;
  let a,b;if(t<=ts){a=b=u*t/2;}else if(ridge){a=u*t/2;b=Math.max(0,u*ts/2+(u/2-c)*(t-ts));}else{a=Math.max(0,u*ridgeTime/2-c*(t-ridgeTime));b=0;}
  if(col)a=b=0;
  const w=a+b,sub=t>=ts&&!col,dwdt=col?0:t<ts?u:ridge?u-c:-c;
  const stage=col?'continental collision':!sub?'opening basin':ridge?(u>c?'subduction active; basin still widening':u===c?'subduction active; constant width':'subduction active; basin narrowing'):'ridge consumed; remaining ocean narrowing';
  return{t,a,b,w,col,ridge,sub,dwdt,stage,ridgeTime,collisionTime,oldest:w>0?t:null};
}
export function wilsonTrajectory(p,end=500){
  const e=wilsonEvents(p),times=[...Array.from({length:end+1},(_,i)=>i),p.ts,e.ridgeTime,e.collisionTime].filter(t=>Number.isFinite(t)&&t>=0&&t<=end).sort((a,b)=>a-b),rows=[...new Set(times)].map(t=>wilsonState(p,t));
  const peak=rows.reduce((best,q)=>q.w>best.w?q:best,rows[0]);return{rows,peak,...e};
}
export function wilsonFloorAge(S,u,side,fraction){return side==='west'?Math.max(0,S.t-2*S.a*fraction/u):2*S.b*fraction/u;}
