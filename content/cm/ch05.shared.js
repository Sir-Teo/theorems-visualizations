// CM5: explicit effective models, with SI definitions converted to meV, nm and ps.
export const KB_MEV=1.380649e-23/1.602176634e-22;
export const HBAR_MEV_PS=6.62607015e-34/(2*Math.PI)/1.602176634e-22*1e12;
export const O={step:'any',decimals:4};export const I={step:1,int:true};
/** atanh(sqrt(q))/sqrt(q) - 1, without cancellation near criticality. */
export function orderEquation(q){if(q===0)return 0;if(q<.04){let power=q,sum=0;for(let j=1;j<100;j++){const term=power/(2*j+1);sum+=term;if(term<Number.EPSILON*sum)break;power*=q;}return sum;}const m=Math.sqrt(q);return Math.atanh(m)/m-1;}
export function staggered(theta){if(theta>=1)return 0;if(!(theta>0))return 1;const target=(1-theta)/theta;let lo=0,hi=1;for(let j=0;j<130;j++){const mid=(lo+hi)/2;if(orderEquation(mid)>target)hi=mid;else lo=mid;if(mid===0||hi-lo<=4*Number.EPSILON*Math.max(hi,Number.MIN_VALUE))break;}return Math.sqrt((lo+hi)/2);}
export function antiferro(theta,J=1,z=6){const m=staggered(theta),a=(1-m)*(1+m);return{m,chi:theta===0?0:a/(theta+a),TN:z*J/KB_MEV,T:theta*z*J/KB_MEV,residual:theta===0?0:Math.abs(m-Math.tanh(m/theta))};}
export function simpsonBose(n){const h=9/n,f=u=>u===0?2:2*u*u/Math.expm1(u*u);let sum=f(0)+f(9);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(i*h);return sum*h/3;}
export const BOSE_INTEGRAL=simpsonBose(1024),BOSE_DIFFERENCE=Math.abs(BOSE_INTEGRAL-simpsonBose(512));
export function magnon(J,S,a,qa,tau){const energy=4*J*S*Math.sin(qa/2)**2,D=J*S*a*a,T=tau*J*S/KB_MEV,density=BOSE_INTEGRAL/(4*Math.PI**2)*(tau/a**2)**1.5;return{energy,D,T,omega:energy/HBAR_MEV_PS,density,fraction:density*a**3/S,integral:BOSE_INTEGRAL,quadratureDifference:BOSE_DIFFERENCE};}
export function gmr(r,ratio,alignment){const R=r*ratio,channels=alignment==='parallel'?[2*r,2*R]:[r+R,r+R],conductance=channels.reduce((s,x)=>s+1/x,0),RP=2*r*R/(r+R),RAP=(r+R)/2;return{r,R,channels,RP,RAP,total:1/conductance,MR:(R-r)**2/(4*r*R),currents:channels.map(x=>1/x)};}
export function hubbard(U,t){const R=Math.hypot(U,4*t),exchange=8*t*t/(R+U),ground=-exchange,H=[[U,-Math.SQRT2*t,0],[-Math.SQRT2*t,0,-Math.SQRT2*t],[0,-Math.SQRT2*t,U]],double=8*t*t/(R*(R+U));return{U,t,R,H,ground,singlets:[ground,U,(U+R)/2],triplet:0,spinGap:exchange,chargeGap:R-2*t,double,probabilities:[double/2,1-double,double/2],strongCoupling:U>0?4*t*t/U:null};}
export const KONDO_T0=20,KONDO_D=1000;
export function kondo(x,a,b){const phonon=a*x**5,magnetic=b*Math.log(KONDO_D/(KONDO_T0*x));return{phonon,magnetic,total:1+phonon+magnetic,T:KONDO_T0*x,derivative:5*a*x**4-b/x};}
export const kondoMinimum=(a,b)=>b>0?Math.exp((Math.log(b)-Math.log(5)-Math.log(a))/5):null;
export const SCOPED_AXES=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:300,...extra});
