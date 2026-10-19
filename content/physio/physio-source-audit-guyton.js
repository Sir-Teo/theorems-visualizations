// Chosen forward-flow curves; the collapse threshold and numerical parameters are illustrative.
export const COLLAPSE_PRESSURE = -2;
export const cardiacFlow = (pressure, contractility) => Math.max(0,13*contractility*(1-Math.exp(-(pressure+4)/8.2)));
export const venousFlow = (pressure, fillingPressure, resistance) => Math.max(0,(fillingPressure-Math.max(pressure,COLLAPSE_PRESSURE))/resistance);
export function circulationParameters(volumeChange, sympatheticTone, contractility, resistance) {
  return {pm:7+volumeChange/100+4*sympatheticTone,c:contractility*(1+.4*sympatheticTone),r:resistance*(1-.15*sympatheticTone)};
}
export function circulationEquilibrium(contractility,fillingPressure,resistance) {
  // At or below the collapse threshold there is no positive forward venous supply.
  if(fillingPressure<=COLLAPSE_PRESSURE)return null;
  let lo=-4,hi=fillingPressure;
  for(let k=0;k<60;k++){const m=(lo+hi)/2;if(cardiacFlow(m,contractility)>venousFlow(m,fillingPressure,resistance))hi=m;else lo=m;}
  const P=(lo+hi)/2;return {P,Q:venousFlow(P,fillingPressure,resistance)};
}
