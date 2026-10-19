import{SUBST,R}from'./ch04.shared.js';
export const WATER_TRIPLE={T:273.16,p:611.657},ICE_IH_TMIN=251.165,ICE_IH_PMAX=208.566e6;
// IAPWS R14-08(2011), Eq1 and Eq6; Pa. expm1 avoids cancellation near the triple point.
export function iceMeltingPressure(T){if(T<ICE_IH_TMIN||T>273.16)throw new RangeError('ice-Ih melting source domain');const u=Math.log(T/273.16);return 611.657*(1-1195393.37*Math.expm1(3*u)-80818.3159*Math.expm1(25.75*u)-3338.26860*Math.expm1(103.75*u));}
export function iceMeltingTemperature(p){if(p<611.657||p>ICE_IH_PMAX) return null;let a=ICE_IH_TMIN,b=273.16;for(let k=0;k<70;k++){const m=(a+b)/2;if(iceMeltingPressure(m)>p)a=m;else b=m;}return(a+b)/2;}
export function iceSublimationPressure(T){if(T<50||T>273.16)throw new RangeError('ice sublimation source domain');const t=T/273.16;return 611.657*Math.exp((-21.2144006*t**.00333333333+27.3203819*t**1.20666667-6.10598130*t**1.70333333)/t);}
// IAPWS IF97(2012), Eq30/Table34; Pa, entire liquid-vapour saturation interval.
export function waterSaturationPressure(T){if(T<273.15||T>647.096)throw new RangeError('water saturation source domain');const n=[0,1167.0521452767,-724213.16703206,-17.073846940092,12020.824702470,-3232555.0322333,14.915108613530,-4823.2657361591,405113.40542057,-.23855557567849,650.17534844798],t=T+n[9]/(T-n[10]),A=t*t+n[1]*t+n[2],B=n[3]*t*t+n[4]*t+n[5],C=n[6]*t*t+n[7]*t+n[8];return 1e6*(2*C/(-B+Math.sqrt(B*B-4*A*C)))**4;}
function fit(Tt,pt,Tc,pc,T3,p3){const x1=1-Tc/Tt,x2=1-Tc/T3,y1=Math.log(pt/pc),y2=Math.log(p3/pc),d=x1*x2*x2-x2*x1*x1,A=(y1*x2*x2-y2*x1*x1)/d,B=(x1*y2-x2*y1)/d;return T=>{const x=1-Tc/T;return pc*Math.exp(A*x+B*x*x);};}
const meltCache=new Map();function cachedMeltingTemperature(p){if(!meltCache.has(p)){if(meltCache.size>5000)meltCache.clear();meltCache.set(p,iceMeltingTemperature(p));}return meltCache.get(p);}
export const PHASE_SUBST={
 water:{...SUBST.water,p:[1e-4,2000],pmaxMelt:2000,pv:T=>waterSaturationPressure(T)/1e5,ps:T=>iceSublimationPressure(T)/1e5,Tm:p=>cachedMeltingTemperature(p*1e5)},
 co2:{...SUBST.co2,Tc:304.18,pc:73.80,p:[.01,1000],pmaxMelt:1000,pv:fit(216.58,5.185,304.18,73.80,273.15,34.85)},
};
export function phaseRegion(S,T,p){if(p<S.pt)return p>S.ps(Math.min(T,S.Tt))?'solid':'gas';if(T<S.Tm(p))return'solid';if(T<S.Tt)return'liquid';if(T>=S.Tc)return p>S.pc?'sc':'gas';return p>S.pv(T)?'liquid':'gas';}
export function visibleSublimationStart(S){let a=S.T[0],b=S.Tt;if(S.ps(a)>=S.p[0])return a;for(let k=0;k<60;k++){const m=(a+b)/2;if(S.ps(m)<S.p[0])a=m;else b=m;}return b;}
export function tripleModel(T,p){const Tt=273.16,pt=611.657,pv=pt*Math.exp(-45050/R*(1/T-1/Tt)),ps=pt*Math.exp(-51060/R*(1/T-1/Tt)),tm=cachedMeltingTemperature(Math.max(pt,p)),near=(a,b)=>Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b));if(near(T,Tt)&&near(p,pt))return'triple';if(T<Tt&&near(p,ps))return'solid + gas';if(T>=Tt&&near(p,pv))return'liquid + gas';if(p>=pt&&near(T,tm))return'solid + liquid';if(p<pt)return p>ps?'solid':'gas';if(T<tm)return'solid';return T<Tt||p>pv?'liquid':'gas';}
