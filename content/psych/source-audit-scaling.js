// Normalized authored power-law family and seeded matching simulation.
const finite=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const need=ok=>{if(!ok)throw new RangeError('Outside the declared scaling-model domain');};
export function shiftedPower(n=.6,offset=0){
  need(finite(n,.2,3.6)&&finite(offset,0,.6));
  const value=I=>I>offset?10*((I-offset)/(1-offset))**n:0;
  const lower=Math.max(.1,offset+.02*(1-offset)),lo=Math.log10(lower),hi=Math.log10(4);
  const curve=Array.from({length:241},(_,i)=>{const x=lo+(hi-lo)*i/240;return[x,Math.log10(value(10**x))];});
  const baseline=[[lo,1+n*lo],[hi,1+n*hi]],ys=[...curve.map(p=>p[1]),...baseline.map(p=>p[1])],dy=Math.max(.2,Math.max(...ys)-Math.min(...ys));
  return{n,offset,lower,curve,baseline,x:[lo-.07,hi+.07],y:[Math.min(...ys)-.12*dy,Math.max(...ys)+.12*dy],atOne:value(1),atTwo:value(2),atFour:value(4),ratio:value(2)/value(1),secant:Math.log(value(2)/value(1))/Math.log(2),slopeOne:n/(1-offset),slopeTwo:2*n/(2-offset),doubling:offset+(1-offset)*2**(1/n)};
}
export function regression(points){
  const n=points.length,xm=points.reduce((s,p)=>s+p[0],0)/n,ym=points.reduce((s,p)=>s+p[1],0)/n;
  const xx=points.reduce((s,p)=>s+(p[0]-xm)**2,0),xy=points.reduce((s,p)=>s+(p[0]-xm)*(p[1]-ym),0),slope=xy/xx,intercept=ym-slope*xm;
  return{slope,intercept};
}
export function matching(a,b,noise=0,seed=8){
  need(finite(a,.2,3.6)&&finite(b,.2,3.6)&&finite(noise,0,.25)&&Number.isInteger(seed)&&finite(seed,1,999999));
  let state=seed>>>0;const uniform=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return((state>>>0)+.5)/4294967296;},normal=()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform());
  const levels=Array.from({length:9},(_,i)=>i/4),AB=levels.map(t=>[t/a,(t+noise*normal())/b]),BA=levels.map(t=>[(t+noise*normal())/a,t/b]);
  const forward=regression(AB),reverse=regression(BA.map(([x,y])=>[y,x])),pooledReverse=regression(BA),inverse=reverse.slope===0?null:1/reverse.slope,geometric=inverse!==null&&forward.slope*inverse>=0?Math.sqrt(forward.slope*inverse):null;
  const end=2/a,fit=[[0,forward.intercept],[end,forward.intercept+forward.slope*end]],xs=[0,end,...AB.map(p=>p[0]),...BA.map(p=>p[0])],ys=[0,2/b,...AB.map(p=>p[1]),...BA.map(p=>p[1]),...fit.map(p=>p[1])],xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),dx=Math.max(.1,xmax-xmin),dy=Math.max(.1,ymax-ymin);
  return{a,b,noise,seed,AB,BA,forward,reverse,pooledReverse,inverse,geometric,predicted:a/b,fit,x:[xmin-.16*dx,xmax+.16*dx],y:[ymin-.16*dy,ymax+.16*dy]};
}
