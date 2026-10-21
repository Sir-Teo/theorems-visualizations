// Audited finite-population risk algebra, separate from shared presentation helpers.
export function comparativeModel(rr,pe,baseline){
 const r0=Math.max(.0006,Math.min(.39,.98/rr,baseline)),r1=rr*r0,P=pe*r1+(1-pe)*r0;
 return{r0,r1,rr,P,pe,OR:rr*(1-r0)/(1-r1),p1:pe*r1/P,p0:pe*(1-r1)/(1-P),maxRisk:Math.min(.39,.98/rr)};
}
export function recoverRisks(p1,p0,P){const pe=P*p1+(1-P)*p0;return{pe,r1:pe>0?P*p1/pe:null,r0:pe<1?P*(1-p1)/(1-pe):null};}
export function crossRatio(a,b,c,d){const num=a*d,den=b*c;return den>0?num/den:num>0?Infinity:null;}
export function riskRatio(r1,r0){return r1==null||r0==null?null:r0>0?r1/r0:r1>0?Infinity:null;}
export function ratioLabel(r,d=2){return r==null?'not defined':r===Infinity?'∞':r.toFixed(d);}

export function declineFit(attacks,first,removal=20){let sw=0,sx=0,sy=0,sxx=0,sxy=0;for(let i=first;i<removal;i++){const w=attacks[i]+.5,y=Math.log(w);sw+=w;sx+=w*i;sy+=w*y;sxx+=w*i*i;sxy+=w*i*y;}const slope=(sw*sxy-sx*sy)/(sw*sxx-sx*sx),intercept=(sy-slope*sx)/sw;return{slope,intercept,predict:t=>Math.max(0,Math.exp(intercept+slope*t)-.5)};}
export const washHazard=1-Math.pow((1-1989/20042)/(1-.012),1/6);
export const contaminatingRisk=washHazard/.4;
export function washingMortality(e,n,f,bg){return 1-(1-bg)*(1-f*(1-e)*contaminatingRisk)**n;}
