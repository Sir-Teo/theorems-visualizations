// DOE-HDBK-1019/1-93, NP-02 Table3 (p30), thermal U235.
// Use the six printed group fractions (sum .00649; displayed total rounds .0065)
// and decay constants derived from its half-lives, rather than extra digits
// attributed to an unread original experiment.
export const DN_BETA=[.00021,.00142,.00127,.00257,.00075,.00027];
export const DN_HALF=[55.7,22.7,6.2,2.3,.61,.23];
export const DN_LAM=DN_HALF.map(t=>Math.LN2/t);
export const BETA=DN_BETA.reduce((a,b)=>a+b,0);
export function kinMatrix(rho,Lam,scale=1) {
  const A=[[(rho-BETA)/Lam*scale,...DN_LAM.map(l=>l*scale)]];
  for(let i=0;i<6;i++){const row=[DN_BETA[i]/Lam*scale,0,0,0,0,0,0];row[i+1]=-DN_LAM[i]*scale;A.push(row);}
  return A;
}
export const kinEq=Lam=>[1,...DN_BETA.map((b,i)=>b/(Lam*DN_LAM[i]))];
export const kinAdvance=(M,y,rho,Lam,dt)=>M.matVec(M.expm(kinMatrix(rho,Lam,dt)),y);
export function inhour(M,rho,Lam) {
  if(Math.abs(rho)<1e-14)return 0;
  const f=w=>Lam*w+DN_BETA.reduce((s,b,i)=>s+b*w/(w+DN_LAM[i]),0)-rho;
  return rho>0?M.bisect(f,0,rho/Lam+1,1e-16):M.bisect(f,-DN_LAM[0]+1e-12,0,1e-16);
}
// Constant-reactivity solution, stopping at the visible power ceiling instead
// of evaluating exponentials beyond floating point range.
export function kinStepCurveAudit(M,rho,Lam,times,ceiling=1e6) {
  const initial=kinEq(Lam),omega=inhour(M,rho,Lam),out=[];let previous=0;
  const at=t=>kinAdvance(M,initial,rho,Lam,t)[0];
  for(const requested of times) {
    const t=omega>0?Math.min(requested,(Math.log(ceiling)+4)/omega):requested,n=at(t);
    if(n>=ceiling){let lo=previous,hi=t;for(let j=0;j<40;j++){const mid=(lo+hi)/2;if(at(mid)>ceiling)hi=mid;else lo=mid;}out.push([(lo+hi)/2,ceiling]);break;}
    if(!Number.isFinite(n))throw new Error('Non-finite point-kinetics state');
    out.push([t,n]);previous=t;if(t<requested)break;
  }
  return out;
}
export function kinProgramAudit(M,{program='step',dollars=.3,Lam=1e-4,feedback=false,alpha=.05,T=60,ceiling=1e5,tolerance=.001}={}) {
  const ext=t=>(program==='ramp'?.02*t:program==='scram'&&t>=10?-6:dollars)*BETA;
  const advance=(y,E,t,h)=>{
    const rho=ext(t+h/2)-(feedback?alpha*BETA*(E+y[0]*h/2):0),next=kinAdvance(M,y,rho,Lam,h);
    return {y:next,E:E+h*(y[0]+next[0])/2,rho};
  };
  let y=kinEq(Lam),energy=0,t=0,steps=0,reason='complete';const out=[],rr=[];
  while(t<T&&steps++<10000) {
    const rho=ext(t+1e-10)-(feedback?alpha*BETA*energy:0),growth=Math.max(0,inhour(M,rho,Lam));
    let h=Math.min(T-t,Math.max(.001,t*.025),.25,.04/Math.max(growth,.1));
    if(program==='scram'&&t<10)h=Math.min(h,10-t);
    let next;
    for(let tries=0;tries<25;tries++){
      const full=advance(y,energy,t,h);
      if(!feedback&&program!=='ramp'){next=full;break;}
      const first=advance(y,energy,t,h/2),second=advance(first.y,first.E,t+h/2,h/2);
      const error=Math.max(Math.abs(full.y[0]-second.y[0])/Math.max(second.y[0],1e-8),Math.abs(full.E-second.E)/Math.max(second.E,1));
      next=second;
      if(error<tolerance||h<=1e-6)break;
      h/=2;
    }
    y=next.y;energy=next.E;t+=h;
    if(!y.every(Number.isFinite)||!Number.isFinite(energy))throw new Error('Non-finite point-kinetics program');
    out.push([Math.max(t,1e-6),y[0]]);rr.push([Math.max(t,1e-6),next.rho/BETA]);
    if(y[0]>=ceiling){reason='power ceiling';break;}
  }
  if(t<T&&reason==='complete')reason='step budget';
  return {out,rr,E:energy,endTime:t,reason,omega:inhour(M,ext(1e-10),Lam),steps};
}
