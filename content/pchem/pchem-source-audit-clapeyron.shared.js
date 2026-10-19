import{R,ATM}from'./ch04.shared.js';
export{R,ATM};
export function modelMu(ph,T,p){const dP=(p-1)*1e5;if(ph===0)return-41*(T-273.15)+19.65e-6*dP;if(ph===1)return-63*(T-273.15)+18.02e-6*dP;return-63*100-172*(T-373.15)+R*T*Math.log(p);}
export const modelLowest=(T,p)=>{const a=[0,1,2].map(k=>modelMu(k,T,p));return a.indexOf(Math.min(...a));};
export const modelMelting=p=>273.15+(19.65e-6-18.02e-6)*(p-1)*1e5/(41-63);
export const modelBoiling=p=>(109*373.15-18.02e-6*(p-1)*1e5)/(109-R*Math.log(p));
export const TRANSITIONS={
 wm:{name:'water: ice → liquid',T:273.15,H:6010,dV:-1.63e-6,win:[1.5,150]},
 wb:{name:'water: liquid → vapour',T:373.124,H:40660,dV:30.12e-3,win:[8,.5]},
 cs:{name:'CO₂: solid → vapour',T:194.69,H:25200,dV:R*194.69/101325,win:[8,1.1]},
 cm:{name:'CO₂: solid → liquid',T:216.58,H:9020,dV:9e-6,win:[4,250]},
};
export const ANTOINE={A:4.6543,B:1435.264,C:-64.848,Tmin:255.9,Tmax:373};
export const vaporPressure=T=>10**(ANTOINE.A-ANTOINE.B/(T+ANTOINE.C));
export const inverseVaporPressure=p=>ANTOINE.B/(ANTOINE.A-Math.log10(p))-ANTOINE.C;
export function apparentHeat(x1,x2){const y=x=>Math.log(vaporPressure(1000/x));if(Math.abs(x2-x1)<1e-6){const x=(x1+x2)/2;return R*Math.LN10*ANTOINE.B*1e6/(1000+ANTOINE.C*x)**2;}return-R*1000*(y(x2)-y(x1))/(x2-x1);}
export const altitudePressure=h=>ATM*(1-.0065*h/288.15)**(9.80665/(287.05287*.0065));
export const ccBoiling=(p,H)=>1/(1/373.124-R*Math.log(p/ATM)/H);
