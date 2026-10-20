const finite=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
export const IMPACT_GRAVITY=9.81,IMPACT_TARGET_DENSITY=2500,IMPACT_TNT=4.184e15,IMPACT_EARTH_AREA=5.1e14;
export const impactMass=(L,rho)=>Math.PI/6*(1000*L)**3*rho;
// Collins et al.2005 Eq21 is in SI; Eq27 explicitly uses kilometres.
export function impactScaling(L,v,angle,rho){
  if(!finite(L,.01,100)||!finite(v,12,35)||!finite(angle,15,90)||!finite(rho,1500,3500))throw new RangeError('Declared solid-target scaling inputs required');
  const transient=1.161*(rho/IMPACT_TARGET_DENSITY)**(1/3)*(L*1000)**.78*(v*1000)**.44*IMPACT_GRAVITY**(-.22)*Math.sin(angle*Math.PI/180)**(1/3)/1000;
  const complex=transient>2.56,final=complex?1.17*transient**1.13/3.2**.13:1.25*transient,mass=impactMass(L,rho),energy=.5*mass*(v*1000)**2;
  return{L,v,angle,rho,transient,complex,final,mass,energy,megatons:energy/IMPACT_TNT};
}
export function impactInverse(final,v,angle,rho){
  if(!finite(final,10,300))throw new RangeError('Complex-crater reference10–300km required');
  const transient=(final/1.17*3.2**.13)**(1/1.13),unit=impactScaling(1,v,angle,rho).transient;
  return(transient/unit)**(1/.78);
}
export function impactModel(L=11,v=20,angle=45,rho=2700){
  if(!finite(L,1,50))throw new RangeError('Offered diameter1–50km required');
  const p=impactScaling(L,v,angle,rho),needed=impactInverse(180,v,angle,rho),curve=Array.from({length:121},(_,i)=>{const x=50**(i/120);return[x,impactScaling(x,v,angle,rho).final];});
  return{...p,needed,curve,top:Math.max(200,...curve.map(x=>x[1]))*2};
}
// Actual Alvarez et al.1980 p1100 Table1: all seven acid-insoluble residues.
// Two upper limits are not zero or measurements at their detection thresholds.
export const DANISH_SOURCE=Object.freeze([
  {height:-5.4,value:.30,error:.16,residue:.774},{height:-2.2,value:.25,error:.08,residue:.621},{height:-.5,value:.73,error:.08,residue:.654},
  {height:0,value:41.6,error:1.8,residue:44.5},{height:.7,value:.36,error:.06,residue:.836},
  {height:1.2,limit:.3,residue:1.08},{height:2.7,limit:.3,residue:3.27},
].map(Object.freeze));
export const IMPACT_DATES=Object.freeze([
  Object.freeze({name:'Beloc tektites',age:66.038,analytical:.025,total:.049,y:2}),
  Object.freeze({name:'IrZ bentonite proxy',age:66.043,analytical:.011,total:.043,y:1}),
]);
export function dustModel(L=10,rho=2000,fraction=.22){
  if(!finite(L,2,20)||!finite(rho,1000,2700)||!finite(fraction,0,1))throw new RangeError('Offered dust-layer inputs required');
  const mass=impactMass(L,2200),excavated=60*mass,retained=fraction*excavated,thickness=retained/(rho*IMPACT_EARTH_AREA)*1000;
  const curve=Array.from({length:101},(_,i)=>{const x=2+18*i/100;return[x,fraction*60*impactMass(x,2200)/(rho*IMPACT_EARTH_AREA)*1000];});
  return{L,rho,fraction,mass,excavated,retained,thickness,curve,top:Math.max(1,curve.at(-1)[1])*1.2};
}
