// Computations for the complete Rudin2 Chapter10 source review.
export function norm2(A) {
  const t=A.flat().reduce((s,x)=>s+x*x,0),d=A[0][0]*A[1][1]-A[0][1]*A[1][0];
  return Math.sqrt((t+Math.sqrt(Math.max(0,t*t-4*d*d)))/2);
}
export function boundaryData(t,b) { return {matrix:[[t,b],[0,1]], inverse:[[1/t,-b/t],[0,1]], norm:norm2([[1/t,-b/t],[0,1]])}; }
export function boundaryInverse(v) {
  const log=v.slider('log₁₀ t',-6,0,-1,{step:.1}),b=v.slider('off-diagonal b',-3,3,1,{step:.05});
  const S=v.stage({x:[-6,0],y:[0,8],height:340,axes:'box',xlabel:'log₁₀ t',ylabel:'log₁₀ inverse norm'});let data;
  v.render(()=>{const pts=Array.from({length:181},(_,i)=>{const x=-6+i/30;return[x,Math.log10(boundaryData(10**x,b.value).norm)];});S.path(pts,{color:'blue',width:2.3});data=boundaryData(10**log.value,b.value);S.dot(log.value,Math.log10(data.norm),{color:'red',r:5});});
  v.readout(()=>`$t=${v.sci(10**log.value,2)}$, $\\|x_t^{-1}\\|=${v.sci(data.norm,3)}\\ge 1/t$. The limiting matrix at $t=0$ is singular.`);
}
export function jordanExp(mu,k) {
  const X=[[mu,k],[0,mu]],out=[[1,0],[0,1]];let term=[[1,0],[0,1]];
  for(let n=1;n<=60;n++){term=term.map(row=>[row[0]*mu/n,(row[0]*k+row[1]*mu)/n]);for(let i=0;i<2;i++)for(let j=0;j<2;j++)out[i][j]+=term[i][j];}
  return {X,series:out,hermite:[[Math.exp(mu),k*Math.exp(mu)],[0,Math.exp(mu)]]};
}
export function hermiteJordan(v) {
  const mu=v.slider('eigenvalue μ',-1,1,.3,{step:.01}),k=v.slider('Jordan entry k',0,2,1,{step:.01});
  const method=v.select('interpolation',[{value:'hermite',label:'value and derivative'},{value:'value',label:'values only'}],'hermite');
  const S=v.stage({x:[-7,7],y:[-5,5],height:350,equal:true,axes:true});const u=S.handle(.6,1,{color:'blue',label:'u'});let err=0;
  v.legend([['blue','$u$'],['green','power-series $\\exp(x)u$'],['purple','interpolation $Q(x)u$']]);
  v.render(()=>{const d=jordanExp(mu.value,k.value),Q=method.value==='hermite'?d.hermite:[[Math.exp(mu.value),0],[0,Math.exp(mu.value)]];
    const act=A=>[A[0][0]*u.x+A[0][1]*u.y,A[1][0]*u.x+A[1][1]*u.y];const a=act(d.series),q=act(Q);S.arrow(0,0,u.x,u.y,{color:'blue'});S.arrow(0,0,a[0],a[1],{color:'green',width:4});S.arrow(0,0,q[0],q[1],{color:'purple',width:2,dash:[5,4]});err=norm2(Q.map((row,i)=>row.map((x,j)=>x-d.series[i][j])));});
  v.readout(()=>`Computed $\\|Q(x)-\\exp(x)\\|=${v.sci(err,3)}$. `+(method.value==='hermite'?'Matching the first derivative handles the repeated root.':'Values alone omit the nilpotent term; they work only when k=0.'));
}
