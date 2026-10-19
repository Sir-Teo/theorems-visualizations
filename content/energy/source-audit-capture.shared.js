const R=8.31446261815324,MC=44.0095;
export function captureMinimumAudit(y,r,T=313.15) {
  const h=z=>z===0||z===1?0:z*Math.log(z)+(1-z)*Math.log1p(-z),tail=1-r*y,yp=y*(1-r)/tail;
  return R*T*(tail*h(yp)-h(y))/(r*y*MC*1000);
}
export function capturePenaltyAudit({y=.13,r=.9,q=3.6,kap=.22,eta=.4,ec=.75}={}) {
  const F=3.6/eta,t=F*94.6/1000,cap=r*t,wmGJ=captureMinimumAudit(y,r),eMin=wmGJ*cap;
  const compMin=R*313.15*Math.log(110)/(MC*1000),comp=compMin/ec,eC=comp*cap,eS=kap*q*cap,tot=eS+eC,net=3.6-tot;
  return {F,t,cap,wmGJ,eMin,eS,eC,tot,net,etaNew:net/F,pen:eta-net/F,fuelUp:3.6/net-1,comp,compMin,idealWorkFraction:(wmGJ+compMin)/(kap*q+comp)};
}
