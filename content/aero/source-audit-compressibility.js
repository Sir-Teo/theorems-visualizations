import {naca4,panelModel,panelSolve,DEG,pgCorr,cpCrit} from './ch04.shared.js';
// MIT16.100 lectures36–37; source assumptions and transformation are in ch04.js.
const foils=new Map();
export function sectionAudit(thickness,alpha){
  if(!foils.has(thickness)){const points=naca4(0,0,thickness,70);foils.set(thickness,{points,model:panelModel(points)});}
  const {points,model}=foils.get(thickness),s=panelSolve(model,alpha*DEG),cp=Array.from(s.cp);
  return{points,xs:Array.from(model.cx),ys:Array.from(model.cy),cp,minimum:Math.min(...cp),cl:s.cl};
}
export function criticalMachAudit(cp0){
  if(cp0>=0)return null;
  let lo=1e-6,hi=1-1e-12;
  for(let i=0;i<80;i++){const m=(lo+hi)/2;if(pgCorr(cp0,m)>cpCrit(m))lo=m;else hi=m;}
  return(lo+hi)/2;
}
export function localMachAudit(cp,m){
  const p=1+.7*m*m*cp;
  return p>0?Math.sqrt(Math.max(0,5*((1+.2*m*m)*p**(-2/7)-1))):null;
}
// Mason2006 equations7-3–9. Sweep here is the strip's half-chord sweep;
// it is distinguished from leading-edge sweep in the cylindrical-wing picture.
export const KORN_OFFSET_AUDIT=Math.cbrt(.1/80);
export function kornAudit(kappa,thickness,lift,sweep=0){const c=Math.cos(sweep);return kappa/c-thickness/c**2-lift/(10*c**3);}
export const waveDragAudit=(m,critical)=>20*Math.max(0,m-critical)**4;
export function sweepVectorsAudit(sweep){
  const c=Math.cos(sweep),s=Math.sin(sweep);
  return{tangent:[c,-s],normal:[-s,-c],along:[s*c,-s*s],across:[-s*c,-c*c]};
}
