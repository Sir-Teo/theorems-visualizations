import test from 'node:test';import assert from 'node:assert/strict';
import {metamerGaussRule,metamerQuadrature,metamerIntegral,metamerHat,metamerKernel,metamerSurfaces,metamerMixture,metamerUv,metamerWhiteBalance,metamerDisplayPair,METAMER_CENTERS} from '../content/art/metamer-audit.js';
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} vs ${b}`),vec=(a,b,t)=>a.forEach((x,j)=>near(x,b[j],t));
// Independent transcription of Wyman Eq4/Table1; no shared cmf or integration helper.
const fit=l=>[[[.362,442,.0624,.0374],[1.056,599.8,.0264,.0323],[-.065,501.1,.049,.0382]],[[.821,568.8,.0213,.0247],[.286,530.9,.0613,.0322]],[[1.217,437,.0845,.0278],[.681,459,.0385,.0725]]].map(r=>r.reduce((s,[a,b,g,d])=>s+a*Math.exp(-.5*((l-b)*(l<b?g:d))**2),0));
const hat=(j,l)=>Math.abs(l-[430,500,570,650][j])>=22?0:1-Math.abs(l-[430,500,570,650][j])/22;
const gauss=(l,c,w)=>Math.exp(-4*Math.log(2)*((l-c)/w)**2),planck=(l,T)=>1/(l**5*Math.expm1(14387768.77/(l*T)));
// Composite Simpson, independent nodes/weights and independently evaluated CMFs.
const cuts=[380,408,430,437,442,452,459,478,500,501.1,522,530.9,548,568.8,570,592,599.8,628,650,672,780];
function simpson(f){const out=[0,0,0];for(let j=1;j<cuts.length;j++){const a=cuts[j-1],b=cuts[j],N=2*Math.ceil((b-a)/.1),h=(b-a)/N;for(let k=0;k<=N;k++){const l=a+h*k,w=h/3*(k===0||k===N?1:k%2?4:2)*f(l),c=fit(l);for(let i=0;i<3;i++)out[i]+=w*c[i];}}return out;}
const fracUnits=x=>{const b=new ArrayBuffer(8),d=new DataView(b);d.setFloat64(0,Math.abs(x));const bits=d.getBigUint64(0),e=Number(bits>>52n&2047n),m=bits&((1n<<52n)-1n);return e?(m|(1n<<52n))<<BigInt(e-1):m;};
test('independent Wyman formula and Gaussian quadrature moments, wavelength band and split corners',()=>{
 for(const n of[8,16]){const Q=metamerGaussRule(n);for(let k=0;k<2*n;k++)near(Q.reduce((s,[x,w])=>s+w*x**k,0),k%2?0:2/(k+1),7e-15);assert.ok(Q.every(([x,w])=>x>-1&&x<1&&w>0));}
 const Q=metamerQuadrature();assert.ok(Q.every(x=>x.l>380&&x.l<780&&x.w>0));let total=0,correction=0;for(const a of Q){const x=a.w-correction,t=total+x;correction=(t-total)-x;total=t;}near(total,400,5e-15);for(const q of Q.filter((_,j)=>j%13===0))vec(q.cmf,fit(q.l),5e-16);
 vec(metamerIntegral(()=>1),simpson(()=>1),3e-12);
});
test('stored coefficients have an exact binary-rational L1 bound; all hats and reflectances globally satisfy admissible domains',()=>{
 for(const m of[metamerSurfaces(),metamerMixture()]){assert.ok(m.coefficients.reduce((s,x)=>s+fracUnits(x),0n)<1n<<1074n);assert.ok(m.largestMinor>1e-4);assert.ok(m.kernelResidual.every(x=>Math.abs(x)<2e-13));}
 // Piecewise-linear hats attain extrema at their centers/endpoints. Their supports are disjoint.
 for(let l=380;l<=780;l+=.125){const hs=METAMER_CENTERS.map((_,j)=>metamerHat(j,l));assert.ok(hs.every(x=>x>=0&&x<=1));assert.ok(hs.filter(x=>x>0).length<=1);hs.forEach((x,j)=>near(x,hat(j,l),0));}
 for(const t of[0,Number.MIN_VALUE,1e-320,1e-20,1e-14,.123456789,.5,1]){const m=metamerSurfaces('day',t);near(m.bounds[0],.12-.12*t);near(m.bounds[1],.67+.12*t);for(let j=0;j<m.spectra[0].length;j++){const[l,R]=m.spectra[0][j],r=.12+.55/(1+Math.exp(-(l-565)/26)),n=m.coefficients.reduce((s,c,k)=>s+c*hat(k,l),0);near(R,r);near(m.spectra[1][j][1],r+.12*t*n);assert.ok(m.spectra[1][j][1]>=m.bounds[0]&&m.spectra[1][j][1]<=m.bounds[1]);}assert.equal(m.plottedDistinct,m.spectra[0].some((p,j)=>p[1]!==m.spectra[1][j][1]));if(t===0)assert.deepEqual(m.spectra[0],m.spectra[1]);else if(t>=1e-14)assert.ok(m.spectra[0].some((p,j)=>p[1]!==m.spectra[1][j][1]));else assert.deepEqual(m.spectra[0],m.spectra[1]);}
});
test('four lamp calculations checked by independent Simpson integrals; exact-zero identity and refined numerical reference distinction',()=>{
 const fs={day:l=>planck(l,6504),tung:l=>planck(l,2856),led:l=>1.8*gauss(l,450,22)+gauss(l,570,120),fl:l=>.04+.6*gauss(l,436,8)+gauss(l,545,8)+1.1*gauss(l,611,8)};
 for(const[key,f]of Object.entries(fs))for(const t of[0,.123456789,1])for(const balance of[false,true]){
  const m=metamerSurfaces(key,t,balance),Y=simpson(f)[1],r=l=>.12+.55/(1+Math.exp(-(l-565)/26)),n=l=>m.coefficients.reduce((s,c,j)=>s+c*hat(j,l),0),ref=[r,l=>r(l)+.12*t*n(l)].map(R=>simpson(l=>f(l)*R(l)).map(x=>x/Y));ref.forEach((x,j)=>vec(m.raw[j],x,2e-11));
  assert.ok(m.referenceRelative<3e-14&&m.referenceRefinedRelative<3e-14&&m.refinement<3e-14);if(t===0){assert.deepEqual(m.raw[0],m.raw[1]);assert.equal(m.relative,0);}if(key!=='day'&&t===1)assert.ok(m.relative>.001);
  if(balance)for(let j=0;j<2;j++)vec(m.shown[j],m.raw[j].map((x,k)=>x*[.3127/.3290,1,(1-.3127-.3290)/.3290][k]/m.white[k]),0);else assert.deepEqual(m.shown,m.raw);
 }
});
test('linearity across every201 integer baseline centers, all operation/corner states and261 added-line centers; correct degeneracies',()=>{
 for(let center=450;center<=650;center++){const m=metamerMixture(center);assert.ok(m.relative<2e-14);for(const[x,y]of m.spectra[1])assert.ok(y>=.3&&y<=1.2);}
 for(const center of[450,560,650])for(const wavelength of[420,620,680])for(const amount of[0,.123456789,2])for(const k of[.2,1,3])for(const op of['none','addB','scB','addL','scL']){
  const m=metamerMixture(center,op,wavelength,amount,k),base=metamerMixture(center),addL=['addB','addL'].includes(op),addR=op==='addB',kl=['scB','scL'].includes(op)?k:1,kr=op==='scB'?k:1;
  vec(m.raw[0],base.raw[0].map((x,j)=>kl*(x+(addL?m.extraXYZ[j]:0))));vec(m.raw[1],base.raw[1].map((x,j)=>kr*(x+(addR?m.extraXYZ[j]:0))));
  for(const curve of m.spectra)for(const[l,y]of curve)assert.ok(y>=m.bounds[0]&&y<=m.bounds[1]+1e-14);assert.ok(m.refinement<5e-14);if(m.preserves)assert.ok(m.relative<3e-14);else assert.ok(m.relative>1e-5);
  if(op==='scL'){assert.ok(m.uv<1e-14);if(k!==1)assert.ok(m.relative>.1);}
 }
 for(let wavelength=420;wavelength<=680;wavelength++){const m=metamerMixture(560,'addB',wavelength,2,1);assert.ok(m.relative<3e-14);}
});
test('mixture XYZ and full post-operation curves against independent integrals at strongest boundary cases',()=>{
 const Y=simpson(()=>1)[1];for(const[center,op,wavelength,amount,k]of[[450,'addB',420,2,3],[650,'addL',680,2,.2],[560,'scB',620,.6,3],[650,'scL',420,0,.2]]){
  const m=metamerMixture(center,op,wavelength,amount,k),b=l=>.5+.5*gauss(l,center,90),n=l=>m.coefficients.reduce((s,c,j)=>s+c*hat(j,l),0),C=l=>2*amount*gauss(l,wavelength,12),addL=['addB','addL'].includes(op),addR=op==='addB',kl=['scB','scL'].includes(op)?k:1,kr=op==='scB'?k:1,fs=[l=>kl*(b(l)+(addL?C(l):0)),l=>kr*(b(l)+.2*n(l)+(addR?C(l):0))];
  fs.forEach((f,j)=>{vec(m.raw[j],simpson(f).map(x=>x/Y),2e-11);for(const[l,y]of m.spectra[j])near(y,f(l),2e-15);});
 }
});
test('display proxy matrix/transfer and common mapping; observer identity, undefined black chromaticity and malformed domains',()=>{
 assert.equal(metamerUv([0,0,0]),null);const d65=[.3127/.3290,1,(1-.3127-.3290)/.3290];vec(metamerWhiteBalance([1,2,3],[1,2,3]),d65,0);
 for(const[a,b]of[[[0,0,0],[0,0,0]],[[1,1,1],[1,1,1]],[[.1,.4,.2],[.2,.8,.4]],[[0,0,2],[2,0,0]]]){const p=metamerDisplayPair(a,b);assert.ok(p.colors.flat().every(x=>Number.isInteger(x)&&x>=0&&x<=255));if(JSON.stringify(a)===JSON.stringify(b))assert.deepEqual(p.colors[0],p.colors[1]);}
 for(const x of[-.1,1.1,NaN,Infinity])assert.throws(()=>metamerSurfaces('day',x));for(const key of['unknown','toString','__proto__','constructor',null,{}])assert.throws(()=>metamerSurfaces(key),RangeError);assert.throws(()=>metamerSurfaces('day',.5,'yes'));
 for(const args of[[449],[650.1], [560,'wrong'],[560,'none',419],[560,'none',620.5],[560,'none',620,-.1],[560,'none',620,2.1],[560,'none',620,1,.19],[560,'none',620,1,3.1]])assert.throws(()=>metamerMixture(...args));
});
