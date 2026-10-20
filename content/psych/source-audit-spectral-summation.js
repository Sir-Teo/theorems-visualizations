import { CIE_PHOTOPIC, CIE_SCOTOPIC } from './source-data-cie-luminous.js';
export { CIE_PHOTOPIC, CIE_SCOTOPIC };
function closed(x,lo,hi,name){if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)throw new RangeError(name);return x;}
function wavelength(x){closed(x,380,780,'integer wavelength 380–780 nm');if(!Number.isInteger(x))throw new RangeError('integer wavelength');return x;}
export function spectralPair(a=450,b=650){
  wavelength(a);wavelength(b);
  const va=CIE_PHOTOPIC[a-360][1],vb=CIE_PHOTOPIC[b-360][1],sa=CIE_SCOTOPIC[a-380][1],sb=CIE_SCOTOPIC[b-380][1];
  // Radiant powers 1 and va/vb give equal photopic products. No cross-condition absolute calibration.
  const powerB=va/vb,scotopicA=sa,scotopicB=powerB*sb,total=scotopicA+scotopicB;
  return {a,b,va,vb,sa,sb,powerB,photopic:[.5,.5],scotopic:[scotopicA/total,scotopicB/total],ratio:scotopicA/scotopicB};
}
export function summationValue(z,c,beta){
  return z<=c?c-z:-beta*(z-c);
}
export function summationCuts(area=1.5,time=1.7,beta=.3){
  closed(area,.3,3.9,'log10 critical area');closed(time,.3,3,'log10 critical duration');closed(beta,0,.9,'post-critical exponent');
  const cut=(c,end)=>{
    const xs=[0,c,end],threshold=xs.map(z=>[z,summationValue(z,c,beta)]),product=xs.map(z=>[z,summationValue(z,c,beta)+z-c]);
    return {c,end,critical:10**c,threshold,product,first:10**threshold[0][1],last:10**threshold[2][1],lastProduct:10**product[2][1]};
  };
  return {area:cut(area,4.2),time:cut(time,3.2),beta};
}
