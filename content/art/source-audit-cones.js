import {CONE_ROWS,CONE_SOURCE} from './source-audit-cones-data.js';
export {CONE_ROWS,CONE_SOURCE};
const finite=Number.isFinite, dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a);
export const CONE_PRIMARY_WAVELENGTHS=Object.freeze([540,610,450]); // authored, not the CIE1931 RGB primaries
export const CONE_AMOUNT_MAX=2;
/** Source-mandated linear interpolation and zero extrapolation. The S column
 * ends at615nm; null is missing source data, not a measured physiological zero. */
export function coneAt(lambda){
 if(!finite(lambda))throw new RangeError('Finite wavelength required');if(lambda<390||lambda>830)return[0,0,0];
 const i=Math.min(88,Math.floor((lambda-390)/5)),j=Math.min(88,i+1),t=(lambda-CONE_ROWS[i][0])/5;
 return[0,1,2].map(k=>k===2&&lambda>615?0:CONE_ROWS[i][k+1]*(1-t)+(CONE_ROWS[j][k+1]??0)*t);
}
/** Composite Simpson integration at0.5nm. Its panels align with every5nm
 * interpolation knot; each cone is integrated only over its tabulated range. */
export function coneIntegral(f){return[0,1,2].map(k=>{const high=k===2?615:830,N=(high-390)*2;let s=0;for(let i=0;i<=N;i++){const l=390+i/2,y=f(l);if(!finite(y))throw new RangeError('Finite spectrum required');s+=(i===0||i===N?1:i%2?4:2)*y*coneAt(l)[k];}return s/6;});}
export const CONE_EQUAL=Object.freeze(coneIntegral(()=>1));
export const CONE_SAMPLED_MAXIMA=Object.freeze([0,1,2].map(k=>CONE_ROWS.filter(r=>r[k+1]!==null).reduce((a,r)=>r[k+1]>a.value?{lambda:r[0],value:r[k+1]}:a,{lambda:0,value:-1})));
export const CONE_CURVES=Object.freeze([0,1,2].map(k=>{const a=[];for(let i=0;i<=880;i++){const l=390+i/2;a.push([l,coneAt(l)[k]]);if(k===2&&l===615)a.push([615,0]);}return a;}));
const C2=6.62607015e-34*299792458/1.380649e-23*1e9;
export function coneSpectrum(mode,center,width,intensity,lambda){
 if(!['bump','mono','eq','tung'].includes(mode)||!Number.isInteger(center)||center<400||center>700||!Number.isInteger(width)||width<20||width>160||!finite(intensity)||intensity<0||intensity>2||!finite(lambda)||lambda<390||lambda>830)throw new RangeError('Offered cone-spectrum controls required');
 if(mode==='eq')return intensity;
 if(mode==='tung')return intensity*(830/lambda)**5*Math.expm1(C2/(830*2856))/Math.expm1(C2/(lambda*2856));
 const fwhm=mode==='mono'?8:width;return intensity*Math.exp(-4*Math.LN2*((lambda-center)/fwhm)**2);
}
export function coneStimulus(mode,center,width,intensity){
 const f=l=>coneSpectrum(mode,center,width,intensity,l),raw=coneIntegral(f),relative=raw.map((x,k)=>x/CONE_EQUAL[k]),light=CONE_CURVES[0].map(([l])=>[l,f(l)]),product=k=>CONE_CURVES[k].map(([l,c])=>[l,f(l)*c]);
 return{mode,center,width,intensity,raw,relative,light,products:[0,1,2].map(product),ratio:relative[1]>0?relative[0]/relative[1]:null};
}
export const CONE_PRIMARY_COLUMNS=Object.freeze(CONE_PRIMARY_WAVELENGTHS.map(l=>Object.freeze(coneAt(l))));
export const CONE_PRIMARY_MATRIX=Object.freeze([0,1,2].map(k=>Object.freeze(CONE_PRIMARY_COLUMNS.map(p=>p[k]))));
/** Modified Gram–Schmidt: unconstrained least squares in the specified LMS
 * coordinates, not a perceptual metric or nonnegative-primary optimization. */
export function coneLeastSquares(target,n){
 if(!Array.isArray(target)||target.length!==3||!Array.from(target).every(finite)||!Number.isInteger(n)||n<1||n>3)throw new RangeError('Finite LMS triple and1–3 primaries required');
 const Q=[],R=Array.from({length:n},()=>Array(n).fill(0));for(let j=0;j<n;j++){let a=CONE_PRIMARY_COLUMNS[j].slice();for(let i=0;i<j;i++){R[i][j]=dot(Q[i],a);a=a.map((x,k)=>x-R[i][j]*Q[i][k]);}R[j][j]=norm(a);if(!(R[j][j]>0))throw new RangeError('Dependent primaries');Q.push(a.map(x=>x/R[j][j]));}
 const z=Q.map(q=>dot(q,target)),a=Array(n).fill(0);for(let i=n-1;i>=0;i--){let y=z[i];for(let j=i+1;j<n;j++)y-=R[i][j]*a[j];a[i]=y/R[i][i];}return a;
}
export function coneMatchTarget(lambda,white){if(!Number.isInteger(lambda)||lambda<400||lambda>700||!finite(white)||white<0||white>1)throw new RangeError('Offered target controls required');return coneAt(lambda).map((x,k)=>(1-white)*x+white*CONE_EQUAL[k]/440);}
export function coneMatch(lambda,white,n,amounts){
 const target=coneMatchTarget(lambda,white);if(!Number.isInteger(n)||n<1||n>3||!Array.isArray(amounts)||amounts.length!==3||!Array.from(amounts).every(x=>finite(x)&&Math.abs(x)<=CONE_AMOUNT_MAX))throw new RangeError('Offered primary controls required');
 const best=coneLeastSquares(target,n),left=target.slice(),right=[0,0,0],fit=[0,0,0];for(let j=0;j<n;j++)for(let k=0;k<3;k++){const p=CONE_PRIMARY_COLUMNS[j][k];if(amounts[j]<0)left[k]-=amounts[j]*p;else right[k]+=amounts[j]*p;fit[k]+=best[j]*p;}
 const targetNorm=norm(target),residual=norm(left.map((x,k)=>x-right[k])),bestResidual=norm(target.map((x,k)=>x-fit[k]));
 return{lambda,white,n,amounts:amounts.slice(),target,left,right,best,fit,residual,relative:residual/targetNorm,bestResidual,bestRelative:bestResidual/targetNorm,negative:amounts.slice(0,n).some(x=>x<0)};
}
// Stockman–Rider2023 Eq14: CIE2006 2° LMS -> CIE2015 cone-based XYZ_F.
export const CONE_LMS_XYZ=Object.freeze([[1.94735469,-1.41445123,.36476327],[.68990272,.34832189,0],[0,0,1.93485343]].map(Object.freeze));
export const coneXYZ=q=>CONE_LMS_XYZ.map(row=>dot(row,q));
// W3C CSS Color4 sample sRGB matrix/transfer, used here ONLY as a display proxy:
// XYZ_F has a different observer from the CIE1931 XYZ underlying sRGB. An authored
// RGB channel-lift/scale gamut map further prevents the patches being certificates.
const XYZ_RGB=[[12831/3959,-329/214,-1974/3959],[-851781/878810,1648619/878810,36519/878810],[705/12673,-2585/12673,705/667]];
export function coneDisplayPair(left,right){
 if(![left,right].every(q=>Array.isArray(q)&&q.length===3&&Array.from(q).every(x=>finite(x)&&x>=0)))throw new RangeError('Finite nonnegative LMS triples required');
 const xyz=[coneXYZ(left),coneXYZ(right)],maximum=Math.max(...xyz.flat().map(Math.abs));if(maximum===0)return[[0,0,0],[0,0,0]];const scale=.5/maximum;
 return xyz.map(q=>{let c=XYZ_RGB.map(row=>dot(row,q)*scale),lo=Math.min(0,...c);c=c.map(x=>x-lo);const high=Math.max(1,...c);return c.map(x=>{const y=Math.max(0,Math.min(1,x/high));return Math.round(255*(y<=.0031308?12.92*y:1.055*y**(1/2.4)-.055));});});
}
