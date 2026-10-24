// Stress in MPa, depth in km, temperature in K. S is compression positive;
// physical Cauchy stress is −S and physical traction on normal n is −S n.
export const g=9.80665,Rgas=8.31446261815324;
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(5):Number(x.toPrecision(6)).toString();
export const rad=x=>x*Math.PI/180,deg=x=>x*180/Math.PI;
export function trig(x){const a=x%360;if(a===0)return[1,0];if(a===90||a===-270)return[0,1];if(a===180||a===-180)return[-1,0];if(a===270||a===-90)return[0,-1];return[Math.cos(rad(x)),Math.sin(rad(x))];}
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),scale=(a,x)=>a.map(v=>v*x),add=(a,b)=>a.map((x,i)=>x+b[i]);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>Math.hypot(...a),unit=a=>norm(a)>0?scale(a,1/norm(a)):null,matVec=(A,x)=>A.map(r=>dot(r,x));
export const sample=(fn,a,b,n=240)=>Array.from({length:n+1},(_,j)=>fn(a+(b-a)*j/n));
export function earthStress(depth=15,density=2800,contrast=.4,regime='normal',yaw=25){
 const vertical=density*g*depth/1000,[c,s]=trig(yaw),axes=[[c,s,0],[-s,c,0],[0,0,1]],d=vertical*contrast,departure=regime==='normal'?[-d/2,-d,0]:regime==='thrust'?[d,d/2,0]:[d,-d,0],values=departure.map(x=>vertical+x),tectonic=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>departure.reduce((t,x,k)=>t+x*axes[k][i]*axes[k][j],0))),meanDeparture=departure.reduce((a,b)=>a+b)/3,S=tectonic.map((r,i)=>r.map((x,j)=>x+(i===j?vertical:0))),mean=vertical+meanDeparture,deviator=tectonic.map((r,i)=>r.map((x,j)=>x-(i===j?meanDeparture:0))),principal=values.map((value,i)=>({value,axis:axes[i]})).sort((a,b)=>b.value-a.value);
 return {depth,density,contrast,regime,yaw,vertical,axes,values,S,mean,deviator,departure,meanDeparture,principal,unique:principal[0].value>principal[1].value&&principal[1].value>principal[2].value};
}
export function mohr(sigma3=30,D=100,theta=60){
 const [c,s]=trig(theta),normal=[c,s],tangent=[-s,c],sigma=sigma3+D*c*c,tau=-D*c*s,C=sigma3+D/2,R=D/2,physical=[-(sigma3+D)*c,-sigma3*s],normalTraction=scale(normal,-sigma),shearTraction=scale(tangent,-tau);
 return {sigma3,D,theta,sigma1:sigma3+D,C,R,normal,tangent,sigma,tau,physical,normalTraction,shearTraction};
}
export function coulomb(sigma3=30,D=100,cohesion=10,mu=.6,theta=60){
 const q=mohr(sigma3,D,theta),A=Math.hypot(1,mu),B=A+mu,phi=deg(Math.atan(mu)),threshold=2*(cohesion+mu*sigma3)*B,margin=cohesion+mu*sigma3-D/(2*B),error=32*Number.EPSILON*(Math.abs(cohesion)+Math.abs(mu*sigma3)+Math.abs(D/(2*B))),normalAngle=45+phi/2,contact=mohr(sigma3,D,normalAngle),status=margin>error?'below shear threshold':margin< -error?'shear threshold exceeded':'at threshold within floating-point resolution';
 return {...q,cohesion,mu,A,B,phi,threshold,margin,error,normalAngle,planeAngle:45-phi/2,contact,status,unique:D>0,selectedMargin:cohesion+mu*q.sigma-Math.abs(q.tau)};
}
export function byerlee(sigma){if(sigma<0)return {sigma,strength:null,slope:null,secant:null,branch:'no closed compressive contact'};const low=.85*sigma,high=50+.6*sigma,strength=Math.min(low,high);return {sigma,strength,low,high,slope:sigma<200?.85:sigma>200?.6:null,secant:sigma>0?(sigma<=200?.85:.6+50/sigma):null,branch:sigma<200?'low-stress branch':sigma>200?'high-stress branch':'continuous corner'};}
export function anderson(regime='normal',mu=.6){
 const A=Math.hypot(1,mu),phi=deg(Math.atan(mu)),theta=45+phi/2,[c,s]=trig(theta),e1=regime==='normal'?[0,0,1]:[1,0,0],e3=regime==='thrust'?[0,0,1]:regime==='normal'?[1,0,0]:[0,1,0],e2=cross(e3,e1),sigma3=30,D=60,planes=[-1,1].map(sign=>{const n=add(scale(e1,c),scale(e3,sign*s)),u=e2,w=cross(n,u),sigma=sigma3+D*c*c,traction=add(scale(n,-sigma3),scale(e1,-D*c)),shear=add(traction,scale(n,sigma));return {normal:n,u,w,dip:deg(Math.acos(Math.min(1,Math.abs(n[2])))),traction,shear,direction:unit(shear),sigma,tau:norm(shear)};});
 return {regime,mu,A,phi,normalAngle:theta,planeAngle:45-phi/2,e1,e2,e3,sigma3,D,planes,verticalPrincipal:regime==='normal'?1:regime==='thrust'?3:2};
}
export function porePressure(sigma3=30,D=100,theta=60,P=30,cohesion=0,mu=.6){
 const q=mohr(sigma3,D,theta),effective=q.sigma-P,contactError=16*Number.EPSILON*(Math.abs(sigma3)+Math.abs(D)+Math.abs(P)),unresolved=Math.abs(effective)<=contactError,contact=effective>contactError,strength=contact?cohesion+mu*effective:null,margin=contact?strength-Math.abs(q.tau):null,marginError=32*Number.EPSILON*(Math.abs(cohesion)+mu*(Math.abs(q.sigma)+Math.abs(P))+Math.abs(q.tau)),drop=mu>0&&Math.abs(q.tau)>cohesion?(Math.abs(q.tau)-cohesion)/mu:null,criticalBelowRange=drop!==null&&!Number.isFinite(drop),critical=drop===null||criticalBelowRange?null:q.sigma-drop;
 return {...q,P,cohesion,mu,effective,contact,contactError,unresolved,strength,margin,marginError,critical,criticalBelowRange,effectiveC:q.C-P,effectiveMin:sigma3-P,status:unresolved?'contact boundary unresolved at floating-point resolution':!contact?'contact open: closed-fault law invalid':Math.abs(margin)<=marginError?'at selected-plane slip threshold within floating-point resolution':margin>0?'below selected-plane slip threshold':'selected-plane slip threshold exceeded'};
}
// Authored rate anchor, not a calibrated olivine data set. Axial strain rate
// and differential stress define incompressible uniaxial secant η=Δ/(3 εdot).
export const creepAnchor={stress:10,T:1473,rate:1e-15,Q:500000};
export function creep(stress=10,T=1473,n=3.5){
 const a=creepAnchor,reciprocalDifference=(a.T-T)/(T*a.T),logRate=Math.log10(a.rate)+n*Math.log10(stress/a.stress)-a.Q*reciprocalDifference/(Rgas*Math.LN10),rate=10**logRate,logViscosity=Math.log10(stress*1e6/3)-logRate;
 return {stress,T,n,logRate,rate,logViscosity,viscosity:10**logViscosity,stressDeviator:[-stress/3,-stress/3,2*stress/3],axialRate:rate,strainRates:[-rate/2,-rate/2,rate]};
}
export function creepStress(T=1473,n=3.5,rate=1e-15){const a=creepAnchor,logStress=Math.log10(a.stress)+(Math.log10(rate/a.rate)+a.Q*(a.T-T)/(Rgas*Math.LN10*T*a.T))/n;return {logStress,stress:10**logStress,T,n,rate};}
// Friction lines are global supporting half-planes of min(.85σ,50+.6σ).
export function frictionThreshold(vertical,lambda=.4,regime='normal'){
 const effective=vertical*(1-lambda),candidates=[[0,.85],[50,.6]].map(([cohesion,mu])=>{const A=Math.hypot(1,mu),B=A+mu,base=2*(cohesion+mu*effective),D=regime==='normal'?base/B:regime==='thrust'?base*B:base/A,sigma3=regime==='normal'?effective-D:regime==='thrust'?effective:effective-D/2,C=sigma3+D/2,contactSigma=C-D*mu/(2*A);return {cohesion,mu,D,sigma3,contactSigma,contactTau:D/(2*A)};}),q=candidates.reduce((a,b)=>a.D<=b.D?a:b);
 return {...q,vertical,effective,lambda,regime,candidates,closed:q.sigma3>=0};
}
export function strengthAt(z,{density=2800,lambda=.4,regime='normal',Ts=293,gradient=20,n=3.5,rate=1e-15}={}){const vertical=density*g*z/1000,T=Ts+gradient*z,friction=frictionThreshold(vertical,lambda,regime),creep=creepStress(T,n,rate);return {z,vertical,T,friction,creep,strength:Math.min(friction.D,creep.stress),difference:friction.D-creep.stress};}
export function strengthProfile(params={},maxDepth=60){
 const rows=sample(z=>strengthAt(z,params),0,maxDepth,240),brackets=[];for(let j=1;j<rows.length;j++)if(rows[j-1].difference*rows[j].difference<0||rows[j].difference===0)brackets.push([rows[j-1].z,rows[j].z]);const transitions=brackets.map(([a0,b0])=>{let a=a0,b=b0;for(let k=0;k<70;k++){const m=(a+b)/2;if(m===a||m===b)break;if(strengthAt(m,params).difference>0)b=m;else a=m;}return strengthAt((a+b)/2,params);});
 return {params,maxDepth,rows,transitions};
}
