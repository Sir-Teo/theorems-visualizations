// Authored paraxial shift model, SCHOTT1-Dec2023 N-BK7 coefficients; equal spectral energy380–780nm.
import {colorCmf,colorMv,colorInverse,COLOR_SRGB_XYZ} from './source-audit-linear-color.js';
const COLOR_XYZ_TO_SRGB=colorInverse(COLOR_SRGB_XYZ);
export const PRISM_B=Object.freeze([1.039612120,.231792344,1.010469450]);
export const PRISM_C=Object.freeze([.006000699,.0200179144,103.560653]);
export function prismIndex(lambda){if(typeof lambda!=='number'||!Number.isFinite(lambda)||lambda<380||lambda>780)throw new RangeError('Wavelength380–780nm required');const x=(lambda/1000)**2;return Math.sqrt(1+PRISM_B.reduce((s,b,j)=>s+b*x/(x-PRISM_C[j]),0));}
const n550=prismIndex(550),spread=prismIndex(380)-prismIndex(780);
export const prismOffset=lambda=>(prismIndex(lambda)-n550)/spread;
const rows=Array.from({length:401},(_,i)=>colorCmf(380+i)),prefix=[[0,0,0]];
for(let i=0;i<400;i++)prefix.push(prefix[i].map((s,k)=>s+(rows[i][k]+rows[i+1][k])/2));
export const PRISM_WHITE=Object.freeze(prefix[400].slice());
function integralTo(lambda){const u=Math.max(0,Math.min(400,lambda-380)),i=Math.min(399,Math.floor(u)),t=u-i;return prefix[i].map((s,k)=>s+t*rows[i][k]+t*t*(rows[i+1][k]-rows[i][k])/2);}
function wavelengthAt(offset){if(offset>=prismOffset(380))return 380;if(offset<=prismOffset(780))return 780;let lo=380,hi=780;for(let i=0;i<52;i++){const m=(lo+hi)/2;if(prismOffset(m)>offset)lo=m;else hi=m;}return(lo+hi)/2;}
const whiteRGB=colorMv(COLOR_XYZ_TO_SRGB,PRISM_WHITE);
function display(XYZ){const linear=colorMv(COLOR_XYZ_TO_SRGB,XYZ).map((x,j)=>x/whiteRGB[j]),clipped=linear.map(x=>Math.max(0,Math.min(1,x))),rgb=clipped.map(x=>Math.round(255*(x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055)));return{linear,rgb,clipped:linear.some(x=>x<0||x>1)};}
export function prismSample(x,width,separation){
  if(typeof x!=='number'||!Number.isFinite(x)||x<-5||x>5||typeof width!=='number'||!Number.isFinite(width)||width<.1||width>2.5||typeof separation!=='number'||!Number.isFinite(separation)||separation<0||separation>1.2)throw new RangeError('Finite x−5…5, width.1…2.5 and separation0…1.2 required');
  let white,interval=null;
  if(separation===0)white=PRISM_WHITE.map(v=>Math.abs(x)<=width/2?v:0);
  else{const lower=(x-width/2)/separation,upper=(x+width/2)/separation,lo=wavelengthAt(upper),hi=wavelengthAt(lower);interval=[lo,hi];const a=integralTo(lo),b=integralTo(hi);white=a.map((v,k)=>b[k]-v);}
  const black=PRISM_WHITE.map((v,k)=>v-white[k]);return{x,interval,white,black,whiteDisplay:display(white),blackDisplay:display(black)};
}
export function prismCardModel(width=.2,separation=.5,off=false,showImages=true){
  if(typeof off!=='boolean'||typeof showImages!=='boolean')throw new RangeError('Boolean saved toggles required');
  prismSample(0,width,separation);const effective=off?0:separation,N=200,samples=Array.from({length:N},(_,i)=>prismSample(-2.5+(i+.5)*5/N,width,effective)),center=prismSample(0,width,effective),wavelengths=[780,650,600,550,500,460,430,380],images=wavelengths.map(lambda=>({lambda,shift:effective*prismOffset(lambda)}));
  return{width,separation,off,showImages,effective,samples,center,images,spread:effective,reference:550};
}
