// Full base width W corresponds to 2w in Shockley's original 1949 notation.
// D is a declared illustrative injection-quality parameter, NOT a measured doping ratio.
export function junctionGain(w,D){const transport=1/Math.cosh(w),gamma=1/(1+w/D),alpha=gamma*transport;return{transport,gamma,alpha,beta:alpha/(1-alpha)};}
export const junctionProfile=(x,w)=>Math.sinh(w-x)/Math.sinh(w);
