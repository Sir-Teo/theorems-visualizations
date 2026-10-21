// ── a dislocation line pinned by random solutes (4.8): overdamped elastic string, implicit in the elastic part (FFT) ───────
export function fftInPlace(re, im, inv) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((2 * Math.PI) / len) * (inv ? -1 : 1), wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
/** A continuous line in a Gaussian potential. fm is the maximum total force on an infinitely long straight line from one obstacle, not a node force. */
export function makeField({N=256,Lx=128,Ly=40,c,fm,seed=1,w=1}) {
  let s=seed>>>0;const rnd=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  const nobs=Math.round(c*Lx*Ly),ox=[],oy=[];for(let k=0;k<nobs;k++){ox.push(rnd()*Lx);oy.push(2+rnd()*Ly);}
  const dx=Lx/N,V0=fm/(Math.sqrt(2*Math.PI)*Math.exp(-.5)),kernels=Array.from({length:N},(_,i)=>{const out=[];for(let k=0;k<nobs;k++){let x=i*dx-ox[k];x-=Lx*Math.round(x/Lx);if(Math.abs(x)<=4*w)out.push([oy[k],V0*Math.exp(-x*x/(2*w*w))/(w*w)]);}return out;});
  return{N,Lx,Ly,c,fm,w,seed,dx,V0,ox,oy,kernels};
}
export function gaussianForce(x,y,ox,oy,V0,w=1){return-V0*Math.exp(-((x-ox)**2+(y-oy)**2)/(2*w*w))*(y-oy)/(w*w);}
export function pinningForces(L,y,tau=0){return Array.from(y,(value,i)=>{let f=tau;for(const[oy,weight]of L.kernels[i]){const dy=value-oy;if(Math.abs(dy)<40*L.w)f-=weight*dy*Math.exp(-dy*dy/(2*L.w*L.w));}return f;});}
export function lineResidual(L,y,tau){const f=pinningForces(L,y,tau);let max=0;for(let i=0;i<L.N;i++)max=Math.max(max,Math.abs(f[i]+(y[(i+L.N-1)%L.N]-2*y[i]+y[(i+1)%L.N])/(L.dx*L.dx)));return max;}
export function lineStep(L,y,tau,dt=2){
 const re=new Float64Array(L.N),im=new Float64Array(L.N),F=pinningForces(L,y,tau);
 for(let i=0;i<L.N;i++)re[i]=y[i]+dt*F[i];fftInPlace(re,im,false);
 for(let k=0;k<L.N;k++){const factor=1/(1+dt*(2-2*Math.cos(2*Math.PI*k/L.N))/(L.dx*L.dx));re[k]*=factor;im[k]*=factor;}fftInPlace(re,im,true);y.set(re);return y;
}
export const friedelStress=(fm,n,T=1,b=1)=>fm**1.5*Math.sqrt(n)/(b*Math.sqrt(2*T));
export function rampLine(L,steps=50,span=2.2,dt=2){
 const tF=friedelStress(L.fm,L.c),y=new Float64Array(L.N),taus=[0],lines=[Float64Array.from(y)],residuals=[lineResidual(L,y,0)],travel=.75*L.Ly,iterations=Math.round(400/dt);let tauC=null;
 for(let k=1;k<=steps;k++){const tau=tF*span*k/steps;for(let j=0;j<iterations;j++)lineStep(L,y,tau,dt);taus.push(tau);lines.push(Float64Array.from(y));residuals.push(lineResidual(L,y,tau));const mean=y.reduce((a,b)=>a+b,0)/L.N;if(tauC===null&&mean>=travel)tauC=tau;}
 return{taus,lines,residuals,tauC,tF,travel,dt,iterations,span,steps};
}
