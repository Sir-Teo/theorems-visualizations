import{DRUGS,BODY}from'./ch01.shared.js';
export const WINDOW_PRESETS={theo:{d:DRUGS.theophylline,lo:10,hi:20,ka:1,unit:'mg/L',dose:500,tau:12,scale:1},digo:{d:DRUGS.digoxin,lo:.5,hi:2,ka:1,unit:'ng/mL',dose:.25,tau:24,scale:1000}};
export function windowProfile(cfg,dose,interval){
 const V=cfg.d.V*BODY.kg,k=Math.LN2/cfg.d.t12,ka=cfg.ka,D=dose*cfg.d.F*cfg.scale,T=interval;
 const C=t=>D*ka/(V*(ka-k))*(Math.exp(-k*t)/(-Math.expm1(-k*T))-Math.exp(-ka*t)/(-Math.expm1(-ka*T)));
 const tpeak=Math.log(ka*(-Math.expm1(-k*T))/(k*(-Math.expm1(-ka*T))))/(ka-k),peak=C(tpeak),trough=C(0),mean=D/(k*V*T);
 const below=level=>{if(level<=trough)return 0;if(level>=peak)return T;let a=0,b=tpeak;for(let i=0;i<60;i++){const m=(a+b)/2;if(C(m)<level)a=m;else b=m;}const up=(a+b)/2;a=tpeak;b=T;for(let i=0;i<60;i++){const m=(a+b)/2;if(C(m)>level)a=m;else b=m;}return up+T-(a+b)/2;};
 return {V,k,ka,D,T,C,tpeak,peak,trough,mean,inside:(below(cfg.hi)-below(cfg.lo))/T};
}
export function centeredWindowDose(cfg,interval){return Math.sqrt(cfg.lo*cfg.hi)*(Math.LN2/cfg.d.t12)*(cfg.d.V*BODY.kg)*interval/(cfg.d.F*cfg.scale);}
