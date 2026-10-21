// Isolated colour science for chapter5. XYZ uses Ywhite=1; CIE1931 2°.
// Own implementation of CIE definitions and W3C CSS Color4 matrices/transfer.
import {MUNSELL,MACADAM,DE_PAIRS} from './ch05.data.js';
import {CONE_ROWS} from './source-audit-cones-data.js';
export {MUNSELL,MACADAM,DE_PAIRS};
export const CIE='https://cie.co.at/eilvterm/';
export const CSS='https://www.w3.org/TR/2026/CRD-css-color-4-20261020/';
export const RIT='https://www.rit.edu/science/munsell-color-science-lab-educational-resources';
export const SHARMA='https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/';
export const MAC_SOURCE='https://www.usailighting.com/stuff/contentmgr/files/1/f386756b8bcf5da65a8d3c26a56b82e7/misc/macadam_1942.pdf';
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mv=(M,a)=>M.map(r=>r.reduce((s,x,j)=>s+x*a[j],0));
export function inverse(m){const [[a,b,c],[d,e,f],[g,h,i]]=m,D=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);return[[e*i-f*h,c*h-b*i,b*f-c*e],[f*g-d*i,a*i-c*g,c*d-a*f],[d*h-e*g,b*g-a*h,a*e-b*d]].map(r=>r.map(x=>x/D));}
export const white=(x,y)=>[x/y,1,(1-x-y)/y];
export const D65=white(.3127,.3290),D50=white(.3457,.3585),WC=white(.31006,.31616);
export const SRGB=[[506752/1228815,87881/245763,12673/70218],[87098/409605,175762/245763,12673/175545],[7918/409605,87881/737289,1001167/1053270]],SRGBI=inverse(SRGB);
export const P3=[[608311/1250200,189793/714400,198249/1000160],[35783/156275,247089/357200,198249/2500400],[0,32229/714400,5220557/5000800]];
const BRADFORD=[[.8951,.2664,-.1614],[-.7502,1.7135,.0367],[.0389,-.0685,1.0296]],BI=inverse(BRADFORD);
/** Bradford adaptation is a specified display transform, not a perception guarantee. */
export function adapt(xyz,from,to){const a=mv(BRADFORD,from),b=mv(BRADFORD,to);return mv(BI,mv(BRADFORD,xyz).map((x,i)=>x*b[i]/a[i]));}
export const decode=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
export const encode=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
export const rgbXYZ=(rgb,M=SRGB)=>mv(M,rgb.map(decode));
export const linearRGB=xyz=>mv(SRGBI,xyz);
export const inGamut=rgb=>rgb.every(x=>x>=-1e-10&&x<=1+1e-10);
export const display=xyz=>linearRGB(xyz).map(x=>255*encode(clamp(x)));
export const fmt=(a,n=3)=>a.map(x=>x.toFixed(n)).join(', ');
export const EPS=216/24389,KAPPA=24389/27;
export const f=t=>t>EPS?Math.cbrt(t):(KAPPA*t+16)/116;
export const fi=t=>t>6/29?t**3:(116*t-16)/KAPPA;
export const lightness=y=>116*f(y)-16;
export const luminance=L=>fi((L+16)/116);
export function lab(xyz,W=D65){const q=xyz.map((x,i)=>f(x/W[i]));return[116*q[1]-16,500*(q[0]-q[1]),200*(q[1]-q[2])];}
export function labXYZ([L,a,b],W=D65){const y=(L+16)/116;return[y+a/500,y,y-b/200].map((x,i)=>fi(x)*W[i]);}
export const lch=([L,a,b])=>[L,Math.hypot(a,b),Math.hypot(a,b)<1e-12?null:(Math.atan2(b,a)*180/Math.PI+360)%360];
export const fromLCH=([L,C,h])=>[L,C*Math.cos(h*Math.PI/180),C*Math.sin(h*Math.PI/180)];
export const uv=([X,Y,Z])=>{const d=X+15*Y+3*Z;return d===0?[0,0]:[4*X/d,9*Y/d];};
export const xyXYZ=([x,y],Y=1)=>[x*Y/y,Y,(1-x-y)*Y/y];
export const xyUV=([x,y])=>uv(xyXYZ([x,y]));
export function luv(xyz,W=D65){const L=lightness(xyz[1]/W[1]),q=uv(xyz),w=uv(W);return[L,13*L*(q[0]-w[0]),13*L*(q[1]-w[1])];}
export function luvXYZ([L,u,v],W=D65){if(L===0)return[0,0,0];const w=uv(W),up=u/(13*L)+w[0],vp=v/(13*L)+w[1],Y=luminance(L)*W[1];return[9*Y*up/(4*vp),Y,Y*(12-3*up-20*vp)/(4*vp)];}
export const de76=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const cos=x=>Math.cos(x*Math.PI/180),sin=x=>Math.sin(x*Math.PI/180);
/** Sharma et al2005 Eqs2–22; kL=kC=kH=1, signed hue/chroma terms. */
export function de2000(A,B){const [L1,a1,b1]=A,[L2,a2,b2]=B,C=(Math.hypot(a1,b1)+Math.hypot(a2,b2))/2,G=.5*(1-Math.sqrt(C**7/(C**7+25**7))),ap1=(1+G)*a1,ap2=(1+G)*a2,C1=Math.hypot(ap1,b1),C2=Math.hypot(ap2,b2),h1=C1===0?0:(Math.atan2(b1,ap1)*180/Math.PI+360)%360,h2=C2===0?0:(Math.atan2(b2,ap2)*180/Math.PI+360)%360;
 let dh=h2-h1;if(C1*C2===0)dh=0;else if(dh>180)dh-=360;else if(dh< -180)dh+=360;
 const dH=2*Math.sqrt(C1*C2)*sin(dh/2),dC=C2-C1,dL=L2-L1,meanL=(L1+L2)/2,meanC=(C1+C2)/2;
 let h=C1*C2===0?h1+h2:Math.abs(h1-h2)<=180?(h1+h2)/2:h1+h2<360?(h1+h2+360)/2:(h1+h2-360)/2;
 const T=1-.17*cos(h-30)+.24*cos(2*h)+.32*cos(3*h+6)-.20*cos(4*h-63),SL=1+.015*(meanL-50)**2/Math.sqrt(20+(meanL-50)**2),SC=1+.045*meanC,SH=1+.015*meanC*T,RT=-2*Math.sqrt(meanC**7/(meanC**7+25**7))*sin(60*Math.exp(-(((h-275)/25)**2))),q=[dL/SL,dC/SC,dH/SH],cross=RT*q[1]*q[2];
 return{value:Math.sqrt(Math.max(0,q.reduce((s,x)=>s+x*x,0)+cross)),q,cross,SL,SC,SH,RT};
}
export const HUES=['5R','5YR','5Y','5GY','5G','5BG','5B','5PB','5P','5RP'];
export const munsellRows=(h,V)=>MUNSELL.filter(r=>r[0]===h&&r[1]===V);
export const munsellXYZ=r=>xyXYZ(r.slice(3,5),r[5]*.975/100);
export const munsellDisplay=r=>display(adapt(munsellXYZ(r),WC,D65));
export function ellipse(row,scale=1,n=100){const [x,y,a,b,t]=row;return Array.from({length:n+1},(_,i)=>{const p=2*Math.PI*i/n,u=a*.001*scale*Math.cos(p),v=b*.001*scale*Math.sin(p);return[x+u*cos(t)-v*sin(t),y+u*sin(t)+v*cos(t)];});}
/** Own finite spectral integration against published CIE2006 2° energy fundamentals.
 * Trapezoids at5nm. Missing S beyond615nm is source zero-extension convention. */
export function cones(center,width,whiteMix){const sums=[0,0,0],norm=[0,0,0];for(let i=0;i<CONE_ROWS.length;i++){const [lambda,...q]=CONE_ROWS[i],weight=i===0||i===CONE_ROWS.length-1?.5:1,signal=(1-whiteMix)*Math.exp(-4*Math.LN2*((lambda-center)/width)**2)+whiteMix;for(let k=0;k<3;k++){const w=k===2&&lambda===615?.5:weight;sums[k]+=w*(q[k]??0)*signal;norm[k]+=w*(q[k]??0);}}return sums.map((x,k)=>x/norm[k]);}
export const opponent=([L,M,S])=>[(L+M)/2,L-M,S-(L+M)/2];
export const adaptState=(signal,time,tau)=>signal*(1-Math.exp(-time/tau));
export const afterState=(signal,adaptTime,recovery,tau)=>-adaptState(signal,adaptTime,tau)*Math.exp(-recovery/tau);
/** Own strict constant L*,h chroma reduction, NOT CSS MINDE nor ICC perceptual intent. */
export function reduceChroma(xyz){const polar=lch(lab(xyz)),[L,C,h]=polar;if(inGamut(linearRGB(xyz)))return{xyz:xyz.slice(),fraction:1};let lo=0,hi=1;for(let i=0;i<45;i++){const mid=(lo+hi)/2,q=labXYZ(fromLCH([L,C*mid,h??0]));if(inGamut(linearRGB(q)))lo=mid;else hi=mid;}return{xyz:labXYZ(fromLCH([L,C*lo,h??0])),fraction:lo};}
/** Linear mixing toward equal-luminance D65 neutral; convex RGB cube intersection. */
export function neutralMap(xyz){const rgb=linearRGB(xyz),Y=clamp(xyz[1]);let t=1;for(const x of rgb){if(x<0)t=Math.min(t,Y/(Y-x));if(x>1)t=Math.min(t,(1-Y)/(x-Y));}return{xyz:mv(SRGB,rgb.map(x=>Y+t*(x-Y))),fraction:t};}
export function patches(v,title='sRGB display previews'){return v.stage({x:[0,1],y:[-.18,1.18],axes:false,height:240,title});}
export function patch(s,x0,x1,xyz,label){s.rect(x0,0,x1,1,{fill:display(xyz),fillAlpha:1,stroke:false});if(label)s.text(label,(x0+x1)/2,1.08,{align:'center',size:11});}
export const previewNote='CIE1931 2°; D65 reference white, Yₙ=1. Patches are clipped sRGB previews. Actual appearance depends on display, adaptation and surroundings.';
