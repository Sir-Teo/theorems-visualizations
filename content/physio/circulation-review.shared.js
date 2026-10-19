/** Explicit toy organ models; these are not fitted physiological reference values. */
export function oedemaFlows(venousRise=0,plasmaOncotic=28,lymphFunction=1,sigma=1){
 const Pi=x=>x<1.5?-3+2*x:.3*(x-1.5), piI=x=>96/(12+x);
 return{Pi,Jf:x=>7*(17.3+.8*venousRise-Pi(x)-sigma*(plasmaOncotic-piI(x))),Jl:x=>lymphFunction*(2.1+50.4*(1-Math.exp(-Math.max(Pi(x)+3,0)/3)))};
}
export function myogenicModel(gain=.9,reserve=1){const rp=P=>1+.25*(P-100)/100,qp=P=>P/100*rp(P)**4,ratio=P=>Math.max(1-.3*reserve,Math.min(1+.35*reserve,qp(P)**(-gain/4))),qr=P=>P/100*(rp(P)*ratio(P))**4;return{rp,qp,ratio,qr};}
export const cardiacOutput=(P,c=1)=>Math.max(0,13*c*(1-Math.exp(-(P+4)/8.2)));
export const venousReturn=(P,pm=7,r=1.4)=>Math.max(0,(pm-Math.max(P,-2))/r);
export function returnEquilibrium(c,pm,r){if(pm<=-2)return{P:-4,Q:0,stopped:true};let lo=-4,hi=Math.max(20,pm);for(let i=0;i<60;i++){const p=(lo+hi)/2;if(cardiacOutput(p,c)>venousReturn(p,pm,r))hi=p;else lo=p;}const P=(lo+hi)/2;return{P,Q:venousReturn(P,pm,r)};}
