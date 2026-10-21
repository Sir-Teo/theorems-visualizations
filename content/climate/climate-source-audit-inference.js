import{Phi,PhiInv}from'./ch03.shared.js';
export function positiveFeedbackLaw(mu,sd,F=3.93){const Z=Phi(mu/sd),phi=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);return{Z,density:e=>e<=0?0:phi((F/e-mu)/sd)*F/(sd*e*e*Z),cdf:e=>e<=0?0:Phi((mu-F/e)/sd)/Z,quantile:q=>q<=0?0:q>=1?Infinity:F/(mu+sd*PhiInv(1-q*Z))};}
export function combineFeedback(lines,rho){const n=lines.length;if(!n)return null;const c=rho/(1-rho+n*rho),invsum=lines.reduce((s,l)=>s+1/l.s,0),w=lines.map(l=>(1/l.s**2-c*invsum/l.s)/(1-rho)),total=w.reduce((a,b)=>a+b,0),mu=w.reduce((s,x,j)=>s+x*lines[j].mu,0)/total,sd=Math.sqrt(1/total);return{mu,sd,weights:w.map(x=>x/total),...positiveFeedbackLaw(mu,sd)};}
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
export function polarModel({D,ice,lrT,lrP,F,planckUniform=false,lrUniform=false,iceUniform=false,n=90}){
 const x=Array.from({length:n},(_,j)=>(j+.5)/n),phi=x.map(x=>Math.asin(x)*180/Math.PI),T0=x.map(x=>302-45*x*x),rawP=T0.map(t=>t**3),planck=rawP.map(p=>p*3.22/mean(rawP)),rawW=T0.map(t=>Math.exp(.04*(t-288))),wv=rawW.map(w=>w*1.77/mean(rawW)),iceShape=phi.map(p=>Math.max(0,(p-35)/55)**2),lr=x.map(x=>lrT+(lrP-lrT)*x*x),lam=x.map((_,j)=>(planckUniform?3.22:planck[j])-(lrUniform?1.77:wv[j])-(lrUniform?mean(lr):lr[j])-(iceUniform?ice*mean(iceShape):ice*iceShape[j])-.42);
 const off=Array.from({length:n-1},(_,j)=>-D*(1-((j+1)/n)**2)*n*n),diag=lam.map((l,j)=>l-(off[j-1]||0)-(off[j]||0)),pivot=[],rhs=[];const tol=Number.EPSILON*n*Math.max(1,...diag.map(Math.abs));let stable=true;
 for(let j=0;j<n;j++){pivot[j]=diag[j]-(j?off[j-1]**2/pivot[j-1]:0);if(!(pivot[j]>tol)){stable=false;break;}rhs[j]=F-(j?off[j-1]*rhs[j-1]/pivot[j-1]:0);}
 if(!stable)return{stable:false,lam,phi,planck,wv,lr,iceProfile:iceShape.map(v=>v*ice),diag,off,pivot,tol};
 const dT=Array(n);for(let j=n-1;j>=0;j--)dT[j]=(rhs[j]-(j<n-1?off[j]*dT[j+1]:0))/pivot[j];
 const boundary=Math.sin(66.5*Math.PI/180),weights=x.map((_,j)=>Math.max(0,(j+1)/n-Math.max(j/n,boundary))),arctic=dT.reduce((s,t,j)=>s+t*weights[j],0)/(1-boundary),gmean=mean(dT);
 return{stable:true,dT,lam,phi,planck,wv,lr,iceProfile:iceShape.map(v=>v*ice),gmean,arctic,ratio:arctic/gmean,diag,off,pivot,tol};
}
