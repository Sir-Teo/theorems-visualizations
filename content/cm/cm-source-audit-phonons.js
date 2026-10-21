// Dimensionless Debye displacement and passive one-oscillator optics.
export function debyeIntegral(X){
 if(X<=0)return 0;
 if(X<1)return X-X*X/4+X**3/36-X**5/3600+X**7/211680-X**9/10886400+X**11/526901760-691*X**13/16999766784000+X**15/1120863744000;
 let tail=0;for(let n=1;n<1000;n++){const term=Math.exp(-n*X)*(X/n+1/(n*n));tail+=term;if(term<1e-17)break;}return Math.PI*Math.PI/6-tail;
}
export function debyeRatio(t,eta){return Math.sqrt(eta*(.25+(t>0?t*t*debyeIntegral(1/t):0)));}
export function meltingThreshold(eta,c){if(c<=Math.sqrt(eta)/2)return null;let lo=0,hi=Math.max(1,c*c/eta);while(debyeRatio(hi,eta)<c)hi*=2;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(debyeRatio(m,eta)<c)lo=m;else hi=m;}return(lo+hi)/2;}
export function dielectric(w,Es,Ei,g){const a=1-w*w,b=g*w,d=a*a+b*b;if(d===0)return[Infinity,0];return[Ei+(Es-Ei)*a/d,(Es-Ei)*b/d];}
export function reflectivity(w,Es,Ei,g){if(g===0&&w===1)return 1;const[a,b]=dielectric(w,Es,Ei,g),m=Math.hypot(a,b),nr=Math.sqrt(Math.max(0,(m+a)/2)),ni=Math.sqrt(Math.max(0,(m-a)/2));return((nr-1)**2+ni*ni)/((nr+1)**2+ni*ni);}
export function polariton(q,Es,Ei){const B=q*q+Es,D=Math.sqrt(Math.max(0,B*B-4*Ei*q*q)),hi=(B+D)/(2*Ei),lo=q===0?0:2*q*q/(B+D);return{lower:Math.sqrt(lo),upper:Math.sqrt(hi)};}
// Feynman1955 Eqs.31,33,42,45: D is the trial displacement covariance.
export function feynmanFunctional(alpha,v,w,n=320){
 if(v<=0||w<=0||v<w)return Infinity;const U=Math.sqrt(40),h=U/n,r=(w/v)**2;
 const f=u=>{if(u===0)return 2;const t=u*u,D=r*t+(1-r)*(-Math.expm1(-v*t))/v;return 2*u*Math.exp(-t)/Math.sqrt(D);};let A=f(0)+f(U);for(let i=1;i<n;i++)A+=(i%2?4:2)*f(i*h);return .75*(v-w)**2/v-alpha*A*h/(3*Math.sqrt(Math.PI));
}
const FEY=new Map();
export function feynmanAudit(alpha){
 const key=alpha.toFixed(8);if(FEY.has(key))return FEY.get(key);
 let best={E:-alpha,v:3,w:3};for(let lw=-.3;lw<=2.4;lw+=.45)for(let lr=-9;lr<=3;lr+=.5){const w=Math.exp(lw),v=w*(1+Math.exp(lr)),E=feynmanFunctional(alpha,v,w);if(E<best.E)best={v,w,E};}
 let x=Math.log(best.w),y=Math.log(Math.max(1e-8,best.v/best.w-1)),step=.3,cur=best.E;
 for(let it=0;it<1200&&step>2e-7;it++){let moved=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const xx=x+dx*step,yy=y+dy*step,w=Math.exp(xx),v=w*(1+Math.exp(yy));if(xx<-6||xx>6||yy<-12||yy>6)continue;const E=feynmanFunctional(alpha,v,w);if(E<cur-1e-13){x=xx;y=yy;cur=E;moved=true;break;}}if(!moved)step*=.5;}
 const w=Math.exp(x),v=w*(1+Math.exp(y)),r=(w/v)**2,n=400,U=Math.sqrt(40),h=U/n;const f=u=>{if(u===0)return 0;const t=u*u,D=r*t+(1-r)*(-Math.expm1(-v*t))/v;return 2*u**5*Math.exp(-t)/D**1.5;};let I=f(0)+f(U);for(let i=1;i<n;i++)I+=(i%2?4:2)*f(i*h);const effectiveMass=1+alpha*I*h/(9*Math.sqrt(Math.PI));
 const out={v,w,E:cur,trialMass:(v/w)**2,effectiveMass};FEY.set(key,out);return out;
}
export function edgeDisplacement(x,y,x0,nu){const dx=x-x0,r2=dx*dx+y*y;if(r2===0)return null;const k=1/(4*(1-nu));return[(Math.atan2(y,dx)+dx*y/(2*(1-nu)*r2))/(2*Math.PI),-((1-2*nu)*k*Math.log(r2)+k*(dx*dx-y*y)/r2)/(2*Math.PI)];}
export function slipStress(nu,fullWidth,slip){return{ideal:1/(2*Math.PI),pn:2/(1-nu)*Math.exp(-2*Math.PI*fullWidth),current:Math.sin(2*Math.PI*slip)/(2*Math.PI)};}
