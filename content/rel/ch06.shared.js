// REL6: SI model constants, explicit approximations and stable small differences.
export const C=299792458, MU=3.986004418e14, R=6378137, OMEGA=7.292115e-5;
export const fmt=x=>!Number.isFinite(x)?'undefined':x===0?'0':Math.abs(x)<1e-3||Math.abs(x)>=1e5?x.toExponential(5):Number(x.toPrecision(6)).toString();
export const samples=(fn,a,b,n=100)=>Array.from({length:n+1},(_,j)=>fn(a+(b-a)*j/n));
export function fall(t,m=1,q=1,b=0,g=9.81){
 const x=b*t/m;
 const F=Math.abs(x)<1e-3?.5-x/6+x*x/24-x**3/120+x**4/720:(x+Math.expm1(-x))/(x*x);
 const V=x===0?1:-Math.expm1(-x)/x;
 return{distance:q*g*t*t*F,velocity:q*g*t*V,acceleration:q*g*Math.exp(-x)};
}
export function impact(H,m=1,q=1,b=0,g=9.81){let a=0,z=Math.sqrt(2*H/(q*g));while(fall(z,m,q,b,g).distance<H)z*=2;for(let j=0;j<60;j++){const t=(a+z)/2;if(fall(t,m,q,b,g).distance<H)a=t;else z=t;}return(a+z)/2;}
export function torsion(eta=1e-13,latitude=45,azimuth=90,kappa=2.34e-9){
 const l=latitude*Math.PI/180,g=MU/R**2,n=latitude===0||latitude===90?0:-(OMEGA**2)*R*Math.sin(l)*Math.cos(l),up=-g+OMEGA**2*R*Math.cos(l)**2;
 const horizontal=g*Math.abs(n)/Math.hypot(n,up),delta=eta*horizontal,torque=.008*.1*delta*(azimuth%180===0?0:Math.sin(azimuth*Math.PI/180));
 return{g,horizontal,delta,torque,twist:torque/kappa};
}
export function elevator(t,g=9.81,gradient=0,mode='supported Earth'){
 // z''=-g+gradient*z in a supported lab; uniform term cancels in free fall.
 const free=mode==='falling Earth'||mode==='inertial space',grad=mode==='supported Earth'||mode==='falling Earth'?gradient:0,uniform=free?0:g;
 const u=Math.sqrt(grad)*t,cm1=2*Math.sinh(u/2)**2,F=Math.abs(u)<1e-3?.5+u*u/24+u**4/720:cm1/(u*u);
 const at=z0=>z0*(1+cm1)-uniform*t*t*F;
 return{positions:[at(.6),at(1.2)],separation:.6*(1+cm1),uniform,gradient:grad};
}
export function relativeGravity(x,z,r=R){
 const h=(2*r*z+z*z+x*x)/(r*r),f=Math.exp(-1.5*Math.log1p(h));
 return[-MU/r**3*x*f,-MU/r**2*Math.expm1(Math.log1p(z/r)-1.5*Math.log1p(h))];
}
export function localFrame(size=1000,r=R){const k=MU/r**3;return{g:MU/r**2,k,residual:relativeGravity(0,size,r),fraction:size/r};}
export function cloud(T=60,H=10000,steps=512){
 const r0=1.12*R,dt=T/steps,k=MU/r0**3;let r=r0,v=0;
 const particles=Array.from({length:24},(_,j)=>({x:H*Math.cos(j*Math.PI/12),z:H*Math.sin(j*Math.PI/12),vx:0,vz:0}));
 for(let n=0;n<steps;n++){
  const a=-MU/r**2,rn=r+v*dt+.5*a*dt*dt;
  for(const p of particles){const b=relativeGravity(p.x,p.z,r),x=p.x+p.vx*dt+.5*b[0]*dt*dt,z=p.z+p.vz*dt+.5*b[1]*dt*dt,d=relativeGravity(x,z,rn);p.vx+=(b[0]+d[0])*dt/2;p.vz+=(b[1]+d[1])*dt/2;p.x=x;p.z=z;}
  v+=(a-MU/rn**2)*dt/2;r=rn;
 }
 const frozen=particles.map((_,j)=>[H*Math.cos(j*Math.PI/12)*Math.cos(Math.sqrt(k)*T),H*Math.sin(j*Math.PI/12)*Math.cosh(Math.sqrt(2*k)*T)]);
 return{r,v,points:particles.map(p=>[p.x,p.z]),frozen,k,energyError:(v*v/2-MU/r+MU/r0)/(MU/r0),minRadius:Math.min(...particles.map(p=>Math.hypot(p.x,r+p.z)))};
}
export function light(chi=.5,u=1){const w=chi*u;return{z:-chi*u*u/(1+Math.sqrt(1-w*w)),time:Math.abs(w)<1e-3?u*(1+w*w/3+w**4/5+w**6/7):Math.atanh(w)/chi,lapse:Math.sqrt(1-w*w)};}
export function redshift(h=22.5552,g=9.81){const chi=g*h/(C*C);return{chi,shift:-chi/(1+chi),velocity:g*h/C,rapidity:Math.log1p(chi),ratio:1/(1+chi)};}
export function resonance(v,delta,w){const a=(v-delta)/w,b=(v+delta)/w;return{up:1/(1+a*a),down:1/(1+b*b),difference:4*(v/w)*(delta/w)/((1+a*a)*(1+b*b))};}
export function clocks(h=1000,days=1,r=R){const potential=MU*h/(r*(r+h)),rate=potential/(C*C);return{potential,rate,drift:days*86400*rate,weak:MU/(Math.min(r,r+h)*C*C)};}
export function solve3(A,b){const m=A.map((row,j)=>[...row,b[j]]);for(let k=0;k<3;k++){let p=k;for(let j=k+1;j<3;j++)if(Math.abs(m[j][k])>Math.abs(m[p][k]))p=j;[m[k],m[p]]=[m[p],m[k]];if(Math.abs(m[k][k])<1e-14)throw Error('singular ranging geometry');const d=m[k][k];for(let q=k;q<4;q++)m[k][q]/=d;for(let j=0;j<3;j++)if(j!==k){const v=m[j][k];for(let q=k;q<4;q++)m[j][q]-=v*m[k][q];}}return m.map(row=>row[3]);}
export function gps(radius=26560000,days=1,latitude=0,mode='one transmitter'){
 const vg=OMEGA*R*Math.cos(latitude*Math.PI/180),grav=MU*(radius-R)/(R*radius*C*C),kin=-(MU/radius-vg*vg)/(2*C*C),rate=grav+kin,drift=days*86400*rate,range=-C*drift;
 const angle=.8*Math.acos(R/radius),satellites=[-angle,0,angle].map(a=>[radius*Math.cos(a),radius*Math.sin(a)]),rows=satellites.map(([up,east])=>{const d=Math.hypot(up-R,east);return[-east/d,-(up-R)/d,1];});
 const residuals=mode==='common offset'?[range,range,range]:[range,0,0],solution=solve3(rows,residuals);
 return{grav,kin,rate,drift,range,solution,rows,residuals,satellites,cancelRadius:3*MU/(2*(MU/R+vg*vg/2))};
}
export const flights={predicted:[[-40,23],[275,21]],observed:[[-59,10],[273,7]]};
export function flying(h=10000,u=250,latitude=40,hours=40){const l=latitude*Math.PI/180,vg=OMEGA*R*Math.cos(l),va=OMEGA*(R+h)*Math.cos(l),grav=clocks(h).rate,seconds=hours*3600;return{east:(grav-(va*va-vg*vg+2*va*u+u*u)/(2*C*C))*seconds,west:(grav-(va*va-vg*vg-2*va*u+u*u)/(2*C*C))*seconds,grav:grav*seconds,vg};}
export function metric(x=0,y=0,separation=1,fraction=.5,epsilon=1e-6,gamma=1){
 const a=.3,centers=[[-separation,0],[separation,0]],weights=[fraction,1-fraction];let phi=0,gx=0,gy=0,hxx=0,hyy=0,hxy=0;
 for(let j=0;j<2;j++){const dx=x-centers[j][0],dy=y,w=weights[j],s=dx*dx+dy*dy+a*a,d=Math.sqrt(s);phi-=w/d;gx-=w*dx/(s*d);gy-=w*dy/(s*d);hxx+=w*(1/(s*d)-3*dx*dx/(s*s*d));hyy+=w*(1/(s*d)-3*dy*dy/(s*s*d));hxy-=3*w*dx*dy/(s*s*d);}
 const temporal=1+2*epsilon*phi,spatial=1-2*gamma*epsilon*phi;
 return{phi,acceleration:[gx,gy],hessian:[[hxx,hxy],[hxy,hyy]],temporal,spatial,lapseExcess:2*epsilon*phi/(Math.sqrt(temporal)+1),centers,weights};
}
export function proper(T=2,g=9.81,A=1,B=.5,s=.5){
 const t=s*T,w=A*Math.sin(Math.PI*s)+B*Math.sin(2*Math.PI*s),dv=(Math.PI*A*Math.cos(Math.PI*s)+2*Math.PI*B*Math.cos(2*Math.PI*s))/T;
 const z0=g*t*(T-t)/2,v0=g*(T-2*t)/2,baseline=g*g*T**3/(24*C*C),deficit=-(Math.PI**2)*(A*A+4*B*B)/(4*T*C*C);
 return{z0,z:z0+w,v:v0+dv,baseline,deficit,excess:baseline+deficit,integrand:(g*(z0+w)-(v0+dv)**2/2)/(C*C),weak:Math.max(Math.abs(g*(z0+w)/(C*C)),((v0+dv)/C)**2)};
}
export function disk(beta=.5,u=1){const b=beta*u,gamma=1/Math.sqrt(1-b*b);return{gamma,ratio:Math.PI*gamma,circumference:2*Math.PI*u*gamma,lab:2*Math.PI*u,curvature:-3*beta*beta/(1-b*b)**2,sagnac:4*Math.PI*beta*u*u/(1-b*b),properSagnac:4*Math.PI*beta*u*u/Math.sqrt(1-b*b)};}
