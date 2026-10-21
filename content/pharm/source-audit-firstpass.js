import{hepaticClearance,hepaticAvailability}from'./source-audit-hepatic.js';
export function firstPassMetrics(absorbed,gutSurvival,flow,capacity,dose=100,volume=100){const cl=hepaticClearance(flow,capacity),FH=hepaticAvailability(flow,capacity),F=absorbed*gutSurvival*FH;return {cl,FH,F,E:cl/flow,k:cl/volume,aucIV:dose/cl,aucOral:absorbed*gutSurvival*dose/capacity};}
export const firstPassTail=(F,dose,volume,k,ka,time,concentration)=>(F*dose*Math.exp(-ka*time)+volume*concentration)/(k*volume);
