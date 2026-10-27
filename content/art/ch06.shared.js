// Chapter 6: authored finite stimuli and explicitly specified colour calculations.
// XYZ is CIE 1931 2°, D65, Yn=1 unless a different white is named.
import {D65,D50,SRGB,SRGBI,decode,encode,mv,inverse,lab,labXYZ,de76,clamp} from './ch05.shared.js';
export {D65,D50,SRGB,decode,encode,mv,lab,labXYZ,de76,clamp};
export const TAU=2*Math.PI;
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const mod=(x,n)=>((x%n)+n)%n;
export const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
export const B=[[.8951,.2664,-.1614],[-.7502,1.7135,.0367],[.0389,-.0685,1.0296]],BI=inverse(B);
export const WHITES={D65,D50,A:[.44757/.40745,1,(1-.44757-.40745)/.40745],cool:[.25/.25,1,(1-.25-.25)/.25]};
export const rgbXYZ=rgb=>mv(SRGB,rgb.map(x=>decode(x/255)));
export const gray=x=>[x,x,x];
export const grayY=Y=>gray(Math.round(255*encode(clamp(Y))));
export const linearXYZ=rgb=>mv(SRGB,rgb);
export const xyzLinear=xyz=>mv(SRGBI,xyz);
export function preview(xyz){const linear=xyzLinear(xyz);return{rgb:linear.map(x=>Math.round(255*encode(clamp(x)))),linear,clipped:linear.some(x=>x< -1e-10||x>1+1e-10)};}
export function stimulus(rgb){const xyz=rgbXYZ(rgb);return{rgb:[...rgb],xyz,lab:lab(xyz),Y:xyz[1]};}
export function hsv(h,s=1,value=1){const z=mod(h,360)/60,c=value*s,x=c*(1-Math.abs(z%2-1)),m=value-c;return(z<1?[c,x,0]:z<2?[x,c,0]:z<3?[0,c,x]:z<4?[0,x,c]:z<5?[x,0,c]:[c,0,x]).map(q=>q+m);}
export const hsv8=(h,s=.55,value=.75)=>hsv(h,s,value).map(x=>Math.round(255*x));
export function gaussian(sigma,radius=Math.ceil(3*sigma)){
  const a=Array.from({length:2*radius+1},(_,i)=>Math.exp(-.5*((i-radius)/sigma)**2)),total=sum(a);
  return a.map(x=>x/total);
}
export function convolution(a,k,boundary='extend'){
  const r=(k.length-1)/2;
  return a.map((_,i)=>sum(k.map((w,j)=>{const x=i+j-r;return w*(boundary==='periodic'?a[mod(x,a.length)]:a[clamp(x,0,a.length-1)]);} )));
}
export function centreSurround({sigma=4,ratio=3,strength=.75,position=64,stimulus:pattern='edge'}={}){
  const n=129,mid=64,radius=Math.ceil(3*sigma*ratio),center=gaussian(sigma,radius),surround=gaussian(sigma*ratio,radius),kernel=center.map((x,i)=>x-strength*surround[i]);
  const input=Array.from({length:n},(_,i)=>pattern==='uniform'?.45:pattern==='impulse'?(i===mid?1:0):pattern==='bar'?(Math.abs(i-mid)<16?.8:.2):i<mid?.2:.8);
  const c=convolution(input,center),s=convolution(input,surround),response=c.map((x,i)=>x-strength*s[i]);
  return{n,radius,center,surround,kernel,input,c,s,response,dc:sum(kernel),position,selected:{input:input[position],center:c[position],surround:s[position],response:response[position]}};
}
export function mach({sigma=4,width=48,strength=.8,profile='ramp'}={}){
  const n=161,mid=80,knees=[mid-width/2,mid+width/2],input=Array.from({length:n},(_,i)=>profile==='steps'?.18+.54*Math.floor(clamp((i-20)/120,0,1)*6)/6:.18+.54*clamp((i-knees[0])/width));
  const kernel=gaussian(sigma),blur=convolution(input,kernel),detail=input.map((x,i)=>x-blur[i]),enhanced=input.map((x,i)=>x+strength*detail[i]);
  return{n,knees,input,kernel,blur,detail,enhanced,minimum:Math.min(...enhanced),maximum:Math.max(...enhanced),maximumDetail:Math.max(...detail.map(Math.abs)),clipped:enhanced.some(x=>x<0||x>1)};
}
export function contrast({target=128,left=40,right=215,hue=30,grounds='gray',bridge=0}={}){
  const targets=[stimulus(gray(target)),stimulus(gray(target))],backgrounds=(grounds==='gray'?[gray(left),gray(right)]:[hsv8(hue,.6,.75),hsv8(hue+180,.6,.75)]).map(stimulus);
  return{targets,backgrounds,bridge,deltaE:de76(targets[0].lab,targets[1].lab),differences:backgrounds.map(q=>targets[0].Y-q.Y)};
}
export function albers({exercise='one',hue=30,separation=24,grounds='chromatic',bridge=0}={}){
  const backgrounds=(grounds==='chromatic'?[hsv8(hue,.7,.78),hsv8(hue+180,.7,.78)]:[gray(42),gray(218)]).map(stimulus),base=hsv8(hue+85,.25,.64);
  const targets=(exercise==='one'?[base,base]:backgrounds.map(q=>base.map((x,i)=>Math.round(clamp(x+separation*(q.rgb[i]-128)/128,0,255))))).map(stimulus);
  return{exercise,backgrounds,targets,bridge,deltaE:de76(targets[0].lab,targets[1].lab),rgbDifference:targets[0].rgb.map((x,i)=>targets[1].rgb[i]-x)};
}
export function assimilation({width=3,period=24,sigma=7,phase=12}={}){
  const red=[190,65,80],lines=[gray(18),gray(238)],k=gaussian(sigma),input=lines.map(line=>Array.from({length:period},(_,i)=>i<width?line:red).map(rgb=>rgb.map(x=>decode(x/255))));
  const pooled=input.map(a=>[0,1,2].map(channel=>convolution(a.map(q=>q[channel]),k,'periodic'))),sample=mod(phase,period);
  const channels=pooled.map(q=>q.map(c=>c[sample])),xyz=channels.map(linearXYZ),mean=input.map(a=>[0,1,2].map(c=>sum(a.map(q=>q[c]))/period));
  return{red,lines,width,period,sigma,phase:sample,k,input,pooled,channels,xyz,previews:xyz.map(preview),mean,meanXYZ:mean.map(linearXYZ),raw:stimulus(red),sampleIsRed:sample>=width};
}
// An authored diagonal RGB world, deliberately simpler than spectral surfaces.
export const REFLECTANCES=[[.72,.12,.06],[.05,.3,.58],[.18,.44,.12],[.6,.45,.1],[.52,.5,.43],[.24,.1,.32]];
export function illumination(warmth){return[1-.28*Math.max(0,-warmth),1-.12*Math.abs(warmth),1-.4*Math.max(0,warmth)];}
export function constancy({warmth=.8,degree=1}={}){
  const E=illumination(warmth),gains=E.map(x=>x**(-degree)),raw=REFLECTANCES.map(r=>r.map((x,i)=>x*E[i])),corrected=raw.map(r=>r.map((x,i)=>x*gains[i])),referenceXYZ=REFLECTANCES.map(linearXYZ),rawXYZ=raw.map(linearXYZ),correctedXYZ=corrected.map(linearXYZ);
  return{E,gains,reference:REFLECTANCES.map(r=>[...r]),raw,corrected,referenceXYZ,rawXYZ,correctedXYZ,rawError:rawXYZ.map((q,i)=>de76(lab(q),lab(referenceXYZ[i]))),correctedError:correctedXYZ.map((q,i)=>de76(lab(q),lab(referenceXYZ[i])))};
}
/** Authored still life. Linear reflectances and a fixed geometric shading recipe. */
export function sceneSample(x,y){
  let rgb=y<2.65?[.24,.255,.26]:[.12,.145,.16];
  const shadow=Math.exp(-(((x-4.8)/3.3)**2+((y-2.08)/.36)**2));
  if(y<2.65)rgb=rgb.map(q=>q*(1-.5*shadow));
  // Rear yellow block, a rounded terracotta vessel, a blue sphere and a green bowl.
  if(x>6.3&&x<8.6&&y>2.3&&y<5.7)rgb=REFLECTANCES[3].map(q=>q*(.67+.2*(8.6-x)/2.3));
  const taper=.87+.18*Math.cos((y-3.7)*1.7),vx=(x-3)/taper;
  if(y>2.25&&y<5.75&&Math.abs(vx)<1)rgb=REFLECTANCES[0].map(q=>q*(.48+.5*Math.sqrt(Math.max(0,1-vx*vx)))*(1-.08*(y-2.25)/3.5));
  const sx=(x-6.35)/1.47,sy=(y-3.18)/1.47,r2=sx*sx+sy*sy;
  if(r2<=1){const nz=Math.sqrt(1-r2),shade=.23+.77*Math.max(0,-.45*sx+.55*sy+.7*nz);rgb=REFLECTANCES[1].map(q=>q*shade);}
  const bx=(x-4.4)/1.58,by=(y-1.96)/.65;
  if(bx*bx+by*by<1&&y<2.16)rgb=REFLECTANCES[2].map(q=>q*(.42+.45*Math.sqrt(Math.max(0,1-bx*bx-by*by))));
  if(((x-4.4)/1.58)**2+((y-2.16)/.2)**2<1)rgb=REFLECTANCES[2].map(q=>q*.4);
  return rgb;
}
export function transform(xyz,from,to,degree=1){const source=mv(B,from),destination=mv(B,to),gains=source.map((x,i)=>(destination[i]/x)**degree),basis=mv(B,xyz),scaled=basis.map((x,i)=>x*gains[i]);return{source,destination,gains,basis,scaled,xyz:mv(BI,scaled)};}
export function vonKries({red=180,green=100,blue=60,from='D65',to='D50',degree=1}={}){
  const rgb=[red,green,blue],xyz=rgbXYZ(rgb),result=transform(xyz,WHITES[from],WHITES[to],degree),back=transform(result.xyz,WHITES[to],WHITES[from],degree).xyz,white=transform(WHITES[from],WHITES[from],WHITES[to],degree).xyz;
  return{rgb,xyz,...result,originalXYZ:xyz,back,white,preview:preview(result.xyz),whiteError:de76(lab(white,WHITES[to]),lab(WHITES[to],WHITES[to])),roundtrip:Math.max(...back.map((x,i)=>Math.abs(x-xyz[i])))};
}
export const MONDRIAN=[[.74,.1,.07],[.07,.42,.18],[.08,.14,.62],[.7,.55,.08],[.52,.1,.36],[.08,.48,.56],[.68,.64,.54],[.19,.18,.16],[.4,.25,.1],[.25,.4,.45],[.52,.38,.44],[.13,.32,.12]];
export function retinex({warmth=.7,gradient=0,selected=0,context='varied'}={}){
  const E=illumination(warmth),reflectances=MONDRIAN.map((q,i)=>context==='varied'?[...q]:i===0?[.3,.3,.3]:q.map(x=>.3+(x-.3)*.35));
  reflectances[0]=[.3,.3,.3];
  const spatial=reflectances.map((_,i)=>1-gradient*(i%4)/3),raw=reflectances.map((r,i)=>r.map((x,j)=>x*E[j]*spatial[i])),maxima=[0,1,2].map(j=>Math.max(...raw.map(q=>q[j]))),normalized=raw.map(q=>q.map((x,j)=>x/maxima[j])),ratios=raw.slice(0,-1).map((q,i)=>q.map((x,j)=>raw[i+1][j]/x)),chain=[0,1,2].map(j=>ratios.reduce((v,r)=>v*r[j],1)),direct=raw.at(-1).map((x,j)=>x/raw[0][j]);
  return{E,reflectances,spatial,raw,maxima,normalized,ratios,chain,direct,selected,reference:reflectances[selected],sample:raw[selected],estimate:normalized[selected]};
}
export const DRESS=[[118,137,172],[112,94,65]];
export function dress({assumption='cool',degree=.75}={}){
  const xyz=DRESS.map(rgbXYZ),from=WHITES[assumption],transforms=xyz.map(q=>transform(q,from,D65,degree)),estimates=transforms.map(q=>q.xyz);
  return{raw:DRESS.map(stimulus),assumption,white:from,gains:transforms[0].gains,estimates,previews:estimates.map(preview),coordinates:estimates.map(q=>lab(q)),rawCoordinates:xyz.map(q=>lab(q))};
}
export const xy=xyz=>{const t=sum(xyz);return t===0?null:xyz.slice(0,2).map(x=>x/t);};
export const polarLab=xyz=>{const [L,a,b]=lab(xyz),C=Math.hypot(a,b);return{L,C,h:C<1e-10?null:mod(Math.atan2(b,a)*180/Math.PI,360)};};
export function hueChanges({hue=230,gain=.6,whiteMix=.25}={}){
  const base=hsv(hue),baseXYZ=linearXYZ(base),Y=baseXYZ[1],neutral=gray(Y),pure=base.map(x=>gain*x),mixed=mix(pure,neutral.map(x=>gain*x),whiteMix),xyz=linearXYZ(mixed),intensity=Array.from({length:21},(_,i)=>{const t=.05+.95*i/20,q=linearXYZ(base.map(x=>x*t));return{t,xyz:q,xy:xy(q),polar:polarLab(q)};}),purity=Array.from({length:21},(_,i)=>{const t=i/20,q=linearXYZ(mix(pure,neutral.map(x=>gain*x),t));return{t,xyz:q,xy:xy(q),polar:polarLab(q)};});
  return{base,baseXYZ,neutral,gain,whiteMix,pure,mixed,xyz,xy:xy(xyz),polar:polarLab(xyz),preview:preview(xyz),intensity,purity};
}
export function brightness({hue=25,purity=.85,Y=.05,match=.05}={}){
  const saturated=hsv(hue),baseY=linearXYZ(saturated)[1],colour=mix(gray(Y),saturated.map(x=>x*Y/baseY),purity),xyz=linearXYZ(colour),equalXYZ=linearXYZ(gray(Y)),matchXYZ=linearXYZ(gray(match)),p=preview(xyz),equal=preview(equalXYZ),personal=preview(matchXYZ);
  return{colour,xyz,equalXYZ,matchXYZ,Y,match,ratio:match/Y,preview:p,equal,personal,encodedY:[p,equal,personal].map(q=>rgbXYZ(q.rgb)[1]),polar:polarLab(xyz)};
}
export const CHECKER={dark:110,light:210,A:[1.5,1.5],B:[4.5,3.5]};
export const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const project=([u,w])=>[u-w,(u+w)/2];
export const unproject=([x,y])=>[y+x/2,y-x/2];
export function checkerValue(u,w,shadow=true){
  if(u<0||u>=6||w<0||w>=6)return null;
  const dark=decode(CHECKER.dark/255),light=decode(CHECKER.light/255),reflectance=(Math.floor(u)+Math.floor(w))%2?light:dark;
  const d=Math.hypot((u-4.4)/2,(w-3.3)/1.65),mask=shadow?1-smoothstep(.78,1.12,d):0,Y=reflectance*(1-mask*(1-dark/light));
  return{reflectance,mask,Y,rgb:grayY(Y)};
}
export function checker({shadow=true,bridge=0,probe=50}={}){
  const A=checkerValue(...CHECKER.A,shadow),B=checkerValue(...CHECKER.B,shadow);
  const at=t=>checkerValue(...mix(CHECKER.A,CHECKER.B,t),shadow),transect=Array.from({length:101},(_,i)=>({t:i/100,...at(i/100)}));
  return{shadow,bridge,probe,A,B,deltaY:B.Y-A.Y,deltaRGB:B.rgb.map((x,i)=>x-A.rgb[i]),positions:[project(CHECKER.A),project(CHECKER.B)],same:A.rgb.every((x,i)=>x===B.rgb[i]),transect,sample:at(probe/100)};
}
export function equiluminance({red=190,green=108,cycles=6,phase=0,speed=.2}={}){
  const colours=[stimulus([red,0,0]),stimulus([0,green,0])],idealGreen=255*encode(colours[0].Y/SRGB[1][1]),candidates=[Math.floor(clamp(idealGreen,0,255)),Math.ceil(clamp(idealGreen,0,255))],nearestGreen=candidates.reduce((best,q)=>Math.abs(SRGB[1][1]*decode(q/255)-colours[0].Y)<Math.abs(SRGB[1][1]*decode(best/255)-colours[0].Y)?q:best),Ys=colours.map(q=>q.Y),contrast=(Ys[1]-Ys[0])/sum(Ys);
  return{colours,Ys,idealGreen,nearestGreen,contrast,cycles,phase:mod(phase,1),speed,proxy:Ys.map(grayY),reference:[gray(42),gray(220)]};
}
// Historical complement-addition language is illustrated by a NEW affine rule.
// No fitted appearance predictor, historical numerical table or material mixture.
export function chevreul({hue=25,strength=.25,density=8,bridge=0}={}){
  const target=stimulus([145,125,104]),surrounds=[hsv8(hue,.65,.8),hsv8(hue+180,.65,.8)].map(stimulus),neutral=gray(.25),input=target.rgb.map(x=>decode(x/255)),vectors=surrounds.map(q=>q.rgb.map((x,i)=>neutral[i]-decode(x/255))),predicted=vectors.map(q=>input.map((x,i)=>x+strength*q[i])),xyz=predicted.map(linearXYZ);
  return{target,surrounds,neutral,input,vectors,predicted,xyz,previews:xyz.map(preview),density,bridge,deltaE:de76(lab(xyz[0]),lab(xyz[1]))};
}
export const MODELS={centreSurround,mach,contrast,albers,assimilation,constancy,vonKries,retinex,dress,hueChanges,brightness,checker,equiluminance,chevreul};
