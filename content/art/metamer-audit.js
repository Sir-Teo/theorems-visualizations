// Authored finite-band examples using Wyman–Sloan–Shirley2013 Eq4 (CIE1931 fit).
// No CIE2006/XYZ_F observer, empirical threshold or original1853 audit is used.
import {cmf,gauss,planck} from './ch03.shared.js';
export const METAMER_BAND=[380,780];
export const METAMER_CENTERS=[430,500,570,650],METAMER_HALF_WIDTH=22;
export const metamerHat=(j,l)=>Math.max(0,1-Math.abs(l-METAMER_CENTERS[j])/METAMER_HALF_WIDTH);
const fitBreaks=[437,442,459,501.1,530.9,568.8,599.8];
const hatBreaks=METAMER_CENTERS.flatMap(c=>[c-22,c,c+22]);
const sum=a=>a.reduce((s,x)=>s+x,0);
const unit=(x,a,b)=>{if(!Number.isFinite(x)||x<a||x>b)throw new RangeError('Value outside the declared finite domain');return x;};
export function metamerGaussRule(n){
 if(!Number.isInteger(n)||n<2||n>32)throw new RangeError('Quadrature order2..32 required');const result=[];
 for(let j=1;j<=n;j++){let x=Math.cos(Math.PI*(j-.25)/(n+.5)),derivative;
  for(let it=0;it<30;it++){let a=1,b=x;for(let k=2;k<=n;k++){const next=((2*k-1)*x*b-(k-1)*a)/k;a=b;b=next;}derivative=n*(x*b-a)/(x*x-1);const y=x-b/derivative;if(Math.abs(y-x)<2e-16){x=y;break;}x=y;}
  // Re-evaluate derivative at the final node.
  let a=1,b=x;for(let k=2;k<=n;k++){const y=((2*k-1)*x*b-(k-1)*a)/k;a=b;b=y;}derivative=n*(x*b-a)/(x*x-1);
  result.push([x,2/((1-x*x)*derivative*derivative)]);
 }return result.sort((a,b)=>a[0]-b[0]);
}
export function metamerQuadrature(order=8,maxInterval=5){
 unit(maxInterval,.25,20);const rule=metamerGaussRule(order),cuts=[380,780,...fitBreaks,...hatBreaks];for(let l=380+maxInterval;l<780;l+=maxInterval)cuts.push(l);cuts.sort((a,b)=>a-b);
 const unique=cuts.filter((x,j)=>!j||x!==cuts[j-1]),nodes=[];
 for(let j=1;j<unique.length;j++){const mid=(unique[j]+unique[j-1])/2,h=(unique[j]-unique[j-1])/2;for(const[x,w]of rule){const l=mid+h*x;nodes.push({l,w:w*h,cmf:cmf(l)});}}
 return nodes;
}
const Q=metamerQuadrature(),FINE=metamerQuadrature(16,2.5);
export function metamerIntegral(f,nodes=Q){const out=[0,0,0];for(const a of nodes){const w=a.w*f(a.l);for(let k=0;k<3;k++)out[k]+=w*a.cmf[k];}return out;}
const day=l=>planck(l,6504),tung=l=>planck(l,2856);
export const METAMER_LAMPS=[['day','6504 K black body'],['tung','2856 K black body'],['led','authored white LED'],['fl','authored three-band lamp']];
const rawLamps={day,tung,led:l=>1.8*gauss(l,450,22)+gauss(l,570,120),fl:l=>.04+.6*gauss(l,436,8)+gauss(l,545,8)+1.1*gauss(l,611,8)};
const lamps=Object.fromEntries(Object.entries(rawLamps).map(([key,f])=>{const scale=metamerIntegral(f)[1];return[key,l=>f(l)/scale];}));
const det3=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
export function metamerKernel(illuminant){
 const columns=METAMER_CENTERS.map((_,j)=>metamerIntegral(l=>illuminant(l)*metamerHat(j,l))),matrix=[0,1,2].map(k=>columns.map(c=>c[k]));
 const minors=columns.map((_,j)=>(j%2?-1:1)*det3(matrix.map(r=>r.filter((_,k)=>k!==j)))),norm=sum(minors.map(Math.abs));
 // A small inward slack makes the stored binary coefficients' exact L1 sum
 // strictly smaller than one; tests check that sum as exact rational numbers.
 if(!(norm>1e-12))throw new Error('Authored response matrix lost its demonstrated rank');const coefficients=minors.map(x=>x/(norm*(1+1e-12))),evaluate=l=>sum(coefficients.map((x,j)=>x*metamerHat(j,l)));
 const residual=metamerIntegral(l=>illuminant(l)*evaluate(l));return{matrix,coefficients,evaluate,residual,l1:sum(coefficients.map(Math.abs)),largestMinor:Math.max(...minors.map(Math.abs))};
}
const DAY_KERNEL=metamerKernel(lamps.day),LIGHT_KERNEL=metamerKernel(()=>1);
const plotNodes=[380,780,...hatBreaks];for(let l=380;l<=780;l+=.5)plotNodes.push(l);plotNodes.sort((a,b)=>a-b);const PLOT=plotNodes.filter((x,j)=>!j||x!==plotNodes[j-1]);
export const metamerBase=l=>.12+.55/(1+Math.exp(-(l-565)/26));
export const metamerUv=xyz=>{const d=xyz[0]+15*xyz[1]+3*xyz[2];return d>0?[4*xyz[0]/d,9*xyz[1]/d]:null;};
const distance=(a,b)=>Math.hypot(...a.map((x,k)=>x-b[k]));
const relative=(a,b)=>{const den=Math.max(Math.hypot(...a),Math.hypot(...b));return den?distance(a,b)/den:0;};
const uvDifference=(a,b)=>{const u=metamerUv(a),v=metamerUv(b);return u&&v?distance(u,v):null;};
// Explicit authored common XYZ-channel white balance. This is not a validated
// physiological adaptation model. The physical comparison always retains raw XYZ.
const D65=[.3127/.3290,1,(1-.3127-.3290)/.3290];
export const metamerWhiteBalance=(xyz,white)=>xyz.map((x,j)=>x*D65[j]/white[j]);
// Actual W3C CSS Color4 XYZ(D65)→linear-sRGB constants and transfer curve.
const SRGB=[[12831/3959,-329/214,-1974/3959],[-851781/878810,1648619/878810,36519/878810],[705/12673,-2585/12673,705/667]];
export function metamerDisplayPair(a,b){
 const linear=[a,b].map(c=>SRGB.map(r=>sum(r.map((x,j)=>x*c[j])))),exposure=.75,exposed=linear.map(c=>c.map(x=>x*exposure));
 const lift=Math.max(0,-Math.min(...exposed.flat())),lifted=exposed.map(c=>c.map(x=>x+lift)),scale=Math.max(1,...lifted.flat());
 const encode=x=>x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055;
 return{colors:lifted.map(c=>c.map(x=>Math.round(255*Math.min(1,Math.max(0,encode(x/scale)))))),exposure,lift,scale};
}
export function metamerSurfaces(key='day',strength=1,balance=false){
 if(typeof key!=='string'||!Object.hasOwn(lamps,key)||typeof balance!=='boolean')throw new RangeError('Declared lamp and Boolean proxy required');unit(strength,0,1);const I=lamps[key],amplitude=.12*strength,R1=metamerBase,R2=l=>R1(l)+amplitude*DAY_KERNEL.evaluate(l),white=metamerIntegral(I),raw=[R1,R2].map(R=>metamerIntegral(l=>I(l)*R(l))),refined=[R1,R2].map(R=>metamerIntegral(l=>I(l)*R(l),FINE)),shown=balance?raw.map(c=>metamerWhiteBalance(c,white)):raw;
 const dayRaw=[R1,R2].map(R=>metamerIntegral(l=>lamps.day(l)*R(l))),dayFine=[R1,R2].map(R=>metamerIntegral(l=>lamps.day(l)*R(l),FINE)),lamp=PLOT.map(l=>[l,I(l)]),peak=Math.max(...lamp.map(p=>p[1])),spectra=[R1,R2].map(R=>PLOT.map(l=>[l,R(l)])),plottedDistinct=spectra[0].some((p,j)=>p[1]!==spectra[1][j][1]);
 return{key,strength,balance,amplitude,bounds:[.12-amplitude,.67+amplitude],coefficients:DAY_KERNEL.coefficients.slice(),kernelResidual:DAY_KERNEL.residual.slice(),largestMinor:DAY_KERNEL.largestMinor,raw,refined,shown,white,relative:relative(...raw),uv:uvDifference(...raw),shownUv:uvDifference(...shown),refinement:Math.max(...raw.flatMap((c,j)=>c.map((x,k)=>Math.abs(x-refined[j][k])))),referenceRelative:relative(...dayRaw),referenceRefinedRelative:relative(...dayFine),spectra,plottedDistinct,lamp:lamp.map(([l,x])=>[l,.9*x/peak]),display:metamerDisplayPair(...shown)};
}
export const MIXTURE_OPS=[['none','none'],['addB','add C to both'],['scB','scale both'],['addL','add C to left'],['scL','scale left']];
export function metamerMixture(center=560,operation='none',wavelength=620,amount=.6,k=1.8){
 if(!MIXTURE_OPS.some(([x])=>x===operation))throw new RangeError('Declared mixture operation required');unit(center,450,650);unit(wavelength,420,680);if(!Number.isInteger(center)||!Number.isInteger(wavelength))throw new RangeError('Integer wavelengths required');unit(amount,0,2);unit(k,.2,3);
 const base=l=>.5+.5*gauss(l,center,90),other=l=>base(l)+.2*LIGHT_KERNEL.evaluate(l),extra=l=>2*amount*gauss(l,wavelength,12),addLeft=['addB','addL'].includes(operation),addRight=operation==='addB',scaleLeft=['scB','scL'].includes(operation)?k:1,scaleRight=operation==='scB'?k:1,left=l=>scaleLeft*(base(l)+(addLeft?extra(l):0)),right=l=>scaleRight*(other(l)+(addRight?extra(l):0));
 const reference=metamerIntegral(()=>1)[1],raw=[left,right].map(f=>metamerIntegral(f).map(x=>x/reference)),refined=[left,right].map(f=>metamerIntegral(f,FINE).map(x=>x/reference)),baseline=[base,other].map(f=>metamerIntegral(f).map(x=>x/reference)),extraXYZ=metamerIntegral(extra).map(x=>x/reference),bound=Math.max(scaleLeft*(1+(addLeft?2*amount:0)),scaleRight*(1.2+(addRight?2*amount:0))),difference=raw[0].map((x,j)=>x-raw[1][j]);
 return{center,operation,wavelength,amount,k,bounds:[0,bound],raw,refined,baseline,extraXYZ,difference,relative:relative(...raw),uv:uvDifference(...raw),refinement:Math.max(...raw.flatMap((c,j)=>c.map((x,k)=>Math.abs(x-refined[j][k])))),spectra:[left,right].map(f=>PLOT.map(l=>[l,f(l)])),coefficients:LIGHT_KERNEL.coefficients.slice(),kernelResidual:LIGHT_KERNEL.residual.slice(),largestMinor:LIGHT_KERNEL.largestMinor,display:metamerDisplayPair(...raw),preserves:['none','addB','scB'].includes(operation)||operation==='addL'&&amount===0||operation==='scL'&&k===1};
}

export const metamerNumber=x=>x===0?'0':String(+x.toPrecision(6));
