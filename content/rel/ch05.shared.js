// REL5: SI constants, +--- metric, x' = gamma(x-beta ct), contravariant tensors.
export const C=299792458,EPS=8.8541878188e-12,Q=1.602176634e-19,MP=1.67262192595e-27;
export const O={step:'any',decimals:4};
export const eta=[1,-1,-1,-1];
export const gamma=b=>1/Math.sqrt((1-b)*(1+b));
export const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
export const multiply=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((s,x,k)=>s+x*B[k][j],0)));
export const vector=(A,v)=>A.map(row=>row.reduce((s,x,i)=>s+x*v[i],0));
export function boost(b){const g=gamma(b);return[[g,-g*b,0,0],[-g*b,g,0,0],[0,0,1,0],[0,0,0,1]];}
export const transform=(T,b)=>multiply(multiply(boost(b),T),transpose(boost(b)));
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// e=E/E*, b=cB/E*. This matrix is c F^{mu nu}/E*.
export const field=(e,b)=>[[0,-e[0],-e[1],-e[2]],[e[0],0,-b[2],b[1]],[e[1],b[2],0,-b[0]],[e[2],-b[1],b[0],0]];
export const unpack=F=>({e:[F[1][0],F[2][0],F[3][0]],b:[-F[2][3],F[1][3],-F[1][2]]});
export function fields(e,b,beta){const F=field(e,b),Fp=transform(F,beta),p=unpack(Fp);return{F,Fp,...p,I:dot(e,e)-dot(b,b),K:dot(e,b),Ip:dot(p.e,p.e)-dot(p.b,p.b),Kp:dot(p.e,p.b)};}
export function lineCharge(beta,r,angle,lambda=1e-9){const Er=lambda/(2*Math.PI*EPS*r),e=[0,Er*Math.cos(angle),Er*Math.sin(angle)],f=fields(e,[0,0,0],beta);return{...f,lambda:gamma(beta)*lambda,current:-gamma(beta)*beta*C*lambda,Er,Emag:Math.hypot(...f.e),Bmag:Math.hypot(...f.b)/C};}
export function wire(d,u,r,lambda=1e-9){const I=lambda*d*C,B=I/(2*Math.PI*EPS*C*C*r),g=gamma(u),ions=g*lambda,electrons=g*(-lambda-u*I/C),net=-g*u*I/C,E=net/(2*Math.PI*EPS*r),labForce=-Q*u*C*B,restForce=Q*E;return{I,B,ions,electrons,net,E,labForce,restForce,fourY:g*labForce};}
const zero=()=>Array.from({length:4},()=>Array(4).fill(0));
// Exact differentiable manufactured Maxwell field, including its transformed derivatives.
export function maxwell(beta,s,x,a=.6,A=.8,B0=.3){const X=vector(boost(-beta),[s,x,0,0]),phase=X[1]-X[0],w=A*Math.cos(phase),q=A*Math.sin(phase),F=field([a*X[1],w,0],[0,0,w+B0]),D=[field([0,q,0],[0,0,q]),field([a,-q,0],[0,0,-q]),zero(),zero()],Linv=boost(-beta),Dp=Array.from({length:4},(_,mu)=>{const M=zero();for(let r=0;r<4;r++){const T=transform(D[r],beta);for(let i=0;i<4;i++)for(let j=0;j<4;j++)M[i][j]+=Linv[r][mu]*T[i][j];}return M;}),J=vector(boost(beta),[a,0,0,0]),div=Array.from({length:4},(_,nu)=>Dp.reduce((sum,M,mu)=>sum+M[mu][nu],0)),cyclic=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)for(let k=j+1;k<4;k++)cyclic.push(Dp[i][j][k]*eta[j]*eta[k]+Dp[j][k][i]*eta[k]*eta[i]+Dp[k][i][j]*eta[i]*eta[j]);return{F:transform(F,beta),D:Dp,J,div,cyclic,residual:Math.max(...div.map((x,i)=>Math.abs(x-J[i])),...cyclic.map(Math.abs)),...unpack(transform(F,beta))};}
export function simpson(f,a,b,n=256){const h=(b-a)/n;let sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3;}
export const pulse=(x,s,b,width)=>Math.exp(-.5*((x+.5-b*s)/width)**2);
export function chargeBox(b,width,s){const density=x=>pulse(x,s,b,width),Q0=simpson(x=>pulse(x,0,b,width),-1,1),Qt=simpson(density,-1,1),flux=simpson(t=>b*(pulse(1,t,b,width)-pulse(-1,t,b,width)),0,s);return{Q0,Qt,flux,residual:Qt-Q0+flux,left:b*density(-1),right:b*density(1),center:-.5+b*s};}
// Exact magnetic-frame circle, Lorentz-transformed into E_y=d cB_z, with q>0.
export function drift(d,phase,B=1,w=.35){const gd=gamma(d),gw=gamma(w),omega=1/(gd*gw),xp=w/omega*(1-Math.cos(phase)),yp=w/omega*Math.sin(phase),tp=phase/omega,x=gd*(xp+d*tp),t=gd*(tp+d*xp),u=w*Math.sin(phase),v=w*Math.cos(phase),vx=(u+d)/(1+d*u),vy=v/(gd*(1+d*u)),g=gd*gw*(1+d*u);return{x,y:yp,t,xp,yp,tp,vx,vy,g,omega,Bprime:B/gd,E:d*C*B,length:C*MP/(Q*B),time:MP/(Q*B),radius:w/omega};}
// Six cold streams. Each density transforms as the time component of its number current.
export function beams(speed,anisotropy,beta){const weights=[anisotropy,(1-anisotropy)/2,(1-anisotropy)/2],T=zero(),Tp=zero(),velocities=[];for(let k=0;k<3;k++)for(const sign of[-1,1]){const u=[0,0,0];u[k]=sign*speed;const p=[gamma(speed),...u.map(x=>gamma(speed)*x)],pp=vector(boost(beta),p),n=weights[k]/2,np=n*pp[0]/p[0];for(let i=0;i<4;i++)for(let j=0;j<4;j++){T[i][j]+=n*p[i]*p[j]/p[0];Tp[i][j]+=np*pp[i]*pp[j]/pp[0];}velocities.push({u:pp.slice(1).map(x=>x/pp[0]),weight:np});}const expected=transform(T,beta);return{T,Tp,velocities,error:Math.max(...Tp.flatMap((r,i)=>r.map((x,j)=>Math.abs(x-expected[i][j])))),unit:1e20*MP*C*C};}
export function fluid(e,p,beta){const u=vector(boost(beta),[1,0,0,0]);return u.map((x,i)=>u.map((y,j)=>(e+p)*x*y-(i===j?p*eta[i]:0)));}
// Exact isobaric entropy/contact profile, active material velocity b; no pressure-step solver.
export function contact(b,a,w,s,L=1){const k=Math.PI/2,e=x=>1+a*Math.cos(k*(x-b*s)),T=x=>fluid(e(x),w,-b),integral=t=>2*L+a/k*(Math.sin(k*(L-b*t))-Math.sin(k*(-L-b*t))),g2=gamma(b)**2,Q0=[g2*(integral(0)+2*L*w)-2*L*w,g2*b*(integral(0)+2*L*w)],Qt=[g2*(integral(s)+2*L*w)-2*L*w,g2*b*(integral(s)+2*L*w)],flux=[0,1].map(nu=>simpson(t=>{const er=1+a*Math.cos(k*(L-b*t)),el=1+a*Math.cos(k*(-L-b*t));return fluid(er,w,-b)[1][nu]-fluid(el,w,-b)[1][nu];},0,s));return{T,e,Q0,Qt,flux,residual:Math.max(...Qt.map((x,i)=>Math.abs(x-Q0[i]+flux[i])))};}
export function emStress(e,b){const u=(dot(e,e)+dot(b,b))/2,S=cross(e,b),T=zero();T[0][0]=u;for(let i=0;i<3;i++){T[0][i+1]=T[i+1][0]=S[i];for(let j=0;j<3;j++)T[i+1][j+1]=(i===j?u:0)-e[i]*e[j]-b[i]*b[j];}return T;}
export function radiation(E,R,phase){const f=E*Math.cos(phase),T=emStress([0,f,0],[0,0,f]),I=EPS*C*E*E/2;return{T:T.map(r=>r.map(x=>EPS*x)),normalizedT:E>0?emStress([0,Math.cos(phase),0],[0,0,Math.cos(phase)]):zero(),I,pressure:(1+R)*I/C,absorbed:(1-R)*I,reflected:R*I};}
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:290,...extra});
export function matrix(s,M,v,unit=1){const max=Math.max(1e-30,...M.flat().map(Math.abs));for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=j,y=3-i,z=M[i][j]/unit;s.rect(x-.43,y-.39,x+.43,y+.39,{color:z<0?'orange':'accent',fill:true,fillAlpha:.06+.24*Math.abs(M[i][j])/max,width:1});s.text(Math.abs(z)<1e-12?'0':v.fix(z,2),x,y,{size:11,align:'center',color:'ink'});} }
