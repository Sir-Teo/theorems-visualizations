// Explicit economic illustration, not a fit to Moore's measured/forecast graph.
export const mooreYieldScale=(year,td)=>64*2**((year-1965)/td);
export const mooreLogCost=(n,year,td,ab)=>Math.log1p(ab/n)+n/mooreYieldScale(year,td);
export function mooreMinimum(year,td,ab){const N=mooreYieldScale(year,td);return Math.max(1,2*ab*N/(Math.sqrt(ab*ab+4*ab*N)+ab));}
export function mooreVisibleRange(year,td,ab,norm,ceiling=100){const m=mooreMinimum(year,td,ab),target=norm+Math.log(ceiling);let left=1,right=1e6;if(mooreLogCost(1,year,td,ab)>target){let lo=1,hi=m;for(let j=0;j<70;j++){const x=(lo+hi)/2;if(mooreLogCost(x,year,td,ab)>target)lo=x;else hi=x;}left=(lo+hi)/2;}if(mooreLogCost(1e6,year,td,ab)>target){let lo=m,hi=1e6;for(let j=0;j<70;j++){const x=(lo+hi)/2;if(mooreLogCost(x,year,td,ab)>target)hi=x;else lo=x;}right=(lo+hi)/2;}return[left,right];}
export const mooreScenarioLog2=(year,td)=>6+(year-1965)/td;
