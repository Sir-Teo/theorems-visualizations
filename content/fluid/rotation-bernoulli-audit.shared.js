// Scoped audited models for fluid3.6/3.11/4.3. g and rho are chosen illustration inputs.
export function rankine(G,a,r,g=9.81,rho=1000){
 r=Math.abs(r);const C=G/(2*Math.PI),inner=r<a,u=r<=a?C*r/a**2:C/r,eta=r<=a?-C*C/(g*a*a)*(1-r*r/(2*a*a)):-C*C/(2*g*r*r);
 return{u,eta,pressure:rho*g*eta,vorticity:r===a&&G!==0?null:(inner?2*C/a**2:0),orbit:r===0?C/a**2:u/r,spin:r===a&&G!==0?null:(inner?C/a**2:0),peak:Math.abs(C)/a};
}
export function rotatingComparison(mode,x,y,z){
 const r2=x*x+y*y,R2=r2+z*z;if(R2<1-1e-12)return{kind:'solid',velocity:null};
 if(mode==='fast'){
  if(r2<1)return{kind:'column',velocity:[0,0,0]};
  return{kind:'fluid',velocity:[1+(y*y-x*x)/r2**2,-2*x*y/r2**2,0]};
 }
 const R=Math.sqrt(R2);return{kind:'fluid',velocity:[1+1/(2*R2*R)-3*x*x/(2*R2**2*R),-3*x*y/(2*R2**2*R),-3*x*z/(2*R2**2*R)]};
}
export function tubeParameters(L,a,f,g=9.81){
 const bottom=.5,he=(L-bottom)/2,amplitude=f*he*Math.min(1,a),I0=he+bottom+he/a,c=1-1/a**2,k=g*(1+1/a),omega=Math.sqrt(k/I0);
 return{L,a,f,g,bottom,he,amplitude,I0,c,k,omega,linearPeriod:2*Math.PI/omega};
}
export function tubeLevels(P,x){return[P.he+x,P.he-x/P.a];}
export function tubeEnergy(P,x,Q){return .5*(P.I0+P.c*x)*Q*Q+.5*P.k*x*x;}
export function tubeDerivative(P,x,Q){return[-Q,(P.k*x+.5*P.c*Q*Q)/(P.I0+P.c*x)];}
export function tubeInitial(P){return{x:P.amplitude,Q:0,t:0,hist:[[0,P.amplitude]],cross:[],last:P.amplitude};}
export function tubeStep(P,st,dt){
 const f=(x,q)=>tubeDerivative(P,x,q),a=f(st.x,st.Q),b=f(st.x+dt*a[0]/2,st.Q+dt*a[1]/2),c=f(st.x+dt*b[0]/2,st.Q+dt*b[1]/2),d=f(st.x+dt*c[0],st.Q+dt*c[1]);
 st.x+=dt*(a[0]+2*b[0]+2*c[0]+d[0])/6;st.Q+=dt*(a[1]+2*b[1]+2*c[1]+d[1])/6;st.t+=dt;
 if(st.last*st.x<0)st.cross.push(st.t-dt*Math.abs(st.x)/(Math.abs(st.x)+Math.abs(st.last)));st.last=st.x;
 if(Math.round(st.t/dt)%5===0)st.hist.push([st.t,st.x]);return st;
}
// The first integral gives dt/dtheta=sqrt(I0+c A sin(theta))/sqrt(k).
export function tubePeriod(P){const n=1000,h=Math.PI/n;let s=0;for(let i=0;i<=n;i++){const th=-Math.PI/2+i*h,y=Math.sqrt(P.I0+P.c*P.amplitude*Math.sin(th));s+=(i===0||i===n?1:i%2?4:2)*y;}return 2*s*h/(3*Math.sqrt(P.k));}
