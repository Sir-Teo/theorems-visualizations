import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
import{CONE_ROWS,CONE_SOURCE_BYTES,CONE_SOURCE}from'../content/art/source-audit-cones-data.js';
import{coneAt,coneIntegral,CONE_EQUAL,CONE_CURVES,CONE_SAMPLED_MAXIMA,coneSpectrum,coneStimulus,CONE_PRIMARY_COLUMNS as P,CONE_PRIMARY_MATRIX,coneLeastSquares,coneMatchTarget,coneMatch,coneXYZ,coneDisplayPair}from'../content/art/source-audit-cones.js';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/art-cones-source-references.json',import.meta.url)));
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
// Independent normal-equation scalar formula for one/two columns; Cramer's rule
// for three. This does not reuse the production QR factorization.
function oracle(t,n){if(n===1)return[dot(P[0],t)/dot(P[0],P[0])];if(n===2){const a=dot(P[0],P[0]),b=dot(P[0],P[1]),d=dot(P[1],P[1]),u=dot(P[0],t),v=dot(P[1],t),D=a*d-b*b;return[(u*d-b*v)/D,(a*v-b*u)/D];}return[0,1,2].map(j=>det(CONE_PRIMARY_MATRIX.map((r,k)=>r.map((x,i)=>i===j?t[k]:x)))/det(CONE_PRIMARY_MATRIX));}
test('All89 CIE energy rows reproduce the published CSV bytes/checksums, column sums, sample row, missing-S domain and interpolation/zero-extension convention',()=>{
 const bytes=Buffer.from(CONE_SOURCE_BYTES,'base64');for(const algo of['md5','sha256'])assert.equal(createHash(algo).update(bytes).digest('hex'),CONE_SOURCE[algo]);assert.equal(CONE_SOURCE.sha256,fixtures.source_csv_sha256);
 const rows=bytes.toString().trim().split(/\r?\n/).map(line=>line.split(',').map(x=>x==='NaN'?null:+x));assert.equal(rows.length,89);assert.deepEqual(CONE_ROWS,rows);const sums=[54290,23.1959438599792,18.96436981202556,11.688018240482];for(let j=0;j<4;j++)near(rows.reduce((s,r)=>s+(r[j]??0),0),sums[j]);assert.deepEqual(rows[31],[545,.919073,.9971948,.003168911]);assert.equal(rows.filter(r=>r[3]===null).length,43);
 for(const r of rows){assert.equal(r[0],390+5*rows.indexOf(r));assert.deepEqual(coneAt(r[0]),r.slice(1).map(x=>x??0));if(r[0]<830)for(const f of[.1,.25,.5,.9])coneAt(r[0]+5*f).forEach((x,k)=>near(x,k===2&&r[0]>=615?0:r[k+1]*(1-f)+(rows[rows.indexOf(r)+1][k+1]??0)*f));}
 // An independent polynomial antiderivative checks integration across every
 // linear-source knot: multiplying by lambda^2 gives a piecewise cubic,
 // which composite Simpson must integrate exactly on the aligned panels.
 const poly=coneIntegral(l=>l*l/1e6);for(let k=0;k<3;k++){let exact=0;for(let j=0;j<rows.length-1;j++){const a=rows[j],b=rows[j+1];if(a[k+1]===null||b[k+1]===null)continue;const slope=(b[k+1]-a[k+1])/5,intercept=a[k+1]-slope*a[0];exact+=(slope*(b[0]**4-a[0]**4)/4+intercept*(b[0]**3-a[0]**3)/3)/1e6;}near(poly[k],exact,2e-11);}
 assert.ok(coneAt(615)[2]>0);assert.equal(coneAt(615+1e-7)[2],0);for(const l of[-1,0,389.9,830.1,1000])assert.deepEqual(coneAt(l),[0,0,0]);assert.throws(()=>coneAt(NaN),RangeError);assert.deepEqual(CONE_SAMPLED_MAXIMA.map(q=>q.lambda),[570,545,445]);assert.ok(CONE_CURVES[2].some(([l,y],i,a)=>l===615&&y===0&&a[i-1][1]>0));
 for(let k=0;k<3;k++){const relevant=rows.filter(r=>r[k+1]!==null),trap=relevant.slice(1).reduce((s,r,j)=>s+2.5*(r[k+1]+relevant[j][k+1]),0);near(CONE_EQUAL[k],trap);}
});
test('Independent analytic Gaussian integrals validate Simpson quadrature, equal-energy normalization and the full offered spectral family including zero intensity',()=>{
 // Fixture references integrate each source-linear segment analytically using
 // erf/erfc Gaussian primitives (Python math, not sampled Simpson quadrature).
 for(const q of fixtures.gaussianIntegral){const mode=q.fwhm===8?'mono':'bump',a=coneIntegral(l=>coneSpectrum(mode,q.center,mode==='mono'?20:q.fwhm,1,l));a.forEach((x,k)=>near(x,q.expected[k],5e-7));}
 for(const mode of['bump','mono','eq','tung'])for(const center of[400,540,700])for(const width of[20,80,160])for(const I of[0,.35,2]){const p=coneStimulus(mode,center,width,I);assert.ok(p.raw.every(x=>x>=0&&Number.isFinite(x)));p.relative.forEach((x,k)=>near(x,p.raw[k]/CONE_EQUAL[k]));if(I===0){assert.deepEqual(p.raw,[0,0,0]);assert.equal(p.ratio,null);}else{assert.ok(p.ratio>0);const base=coneStimulus(mode,center,width,1);p.raw.forEach((x,k)=>near(x,I*base.raw[k]));}if(mode==='eq')p.relative.forEach(x=>near(x,I));for(const [l,x]of p.light){assert.ok(x>=0&&x<=I+1e-12);near(x,coneSpectrum(mode,center,width,I,l));}for(let k=0;k<3;k++)for(const[l,x]of p.products[k]){if(k===2&&l===615&&x===0)continue;near(x,coneSpectrum(mode,center,width,I,l)*coneAt(l)[k]);}}
 for(const mode of['bump','mono','eq','tung'])for(const I of[Number.MIN_VALUE,1e-300]){const p=coneStimulus(mode,400,20,I);assert.ok(p.raw.every(x=>Number.isFinite(x)&&x>=0));assert.ok(p.relative.every(x=>Number.isFinite(x)&&x>=0));if(p.relative[1]===0)assert.equal(p.ratio,null);else assert.ok(Number.isFinite(p.ratio));}
 const h=6.62607015e-34,c=299792458,k=1.380649e-23,T=2856,l=500e-9,r=830e-9;near(coneSpectrum('tung',500,20,1,500),(r/l)**5*Math.expm1(h*c/(r*k*T))/Math.expm1(h*c/(l*k*T)));near(coneSpectrum('bump',540,80,2,580),1);near(coneSpectrum('mono',540,80,2,544),1);assert.throws(()=>coneIntegral(()=>NaN),RangeError);
});
test('Every offered integer target wavelength and the entire white-mixture continuum have full-rank signed solutions inside the controls; independent projections certify smaller-span exceptions and counterexamples',()=>{
 near(det(CONE_PRIMARY_MATRIX),-.4979727047311528);assert.ok(Math.abs(det(CONE_PRIMARY_MATRIX))>.49);const maxima=[0,0,0];
 for(let l=400;l<=700;l++)for(const n of[1,2,3]){const ends=[0,1].map(w=>coneLeastSquares(coneMatchTarget(l,w),n));for(const w of[0,.137,.5,.863,1]){const t=coneMatchTarget(l,w),a=coneLeastSquares(t,n),b=oracle(t,n);a.forEach((x,j)=>{near(x,b[j]);near(x,(1-w)*ends[0][j]+w*ends[1][j]);maxima[j]=Math.max(maxima[j],Math.abs(x));assert.ok(Math.abs(x)<1.04);});const fit=[0,1,2].map(k=>a.reduce((s,x,j)=>s+x*P[j][k],0)),e=t.map((x,k)=>x-fit[k]);for(let j=0;j<n;j++)near(dot(e,P[j]),0);if(n===3)assert.ok(Math.hypot(...e)<8e-16);}}
 assert.ok(maxima.every(x=>x<2));for(const n of[1,2,3]){const a=coneLeastSquares(coneAt(540),n);near(a[0],1);a.slice(1).forEach(x=>near(x,0));}assert.ok(coneMatch(450,0,1,[0,0,0]).bestRelative>.9);assert.ok(coneMatch(450,0,2,[0,0,0]).bestRelative>.9);assert.ok(coneLeastSquares(coneAt(580),3).some(x=>x<0));
});
test('All signed amount corners and active counts preserve the physical two-side identity, honest residuals and finite bounded display proxies',()=>{
 for(const l of[400,450,540,580,610,700])for(const w of[0,.37,1])for(const n of[1,2,3])for(const a of[-2,2])for(const b of[-2,2])for(const c of[-2,2]){const amounts=[a,b,c],q=coneMatch(l,w,n,amounts),diff=q.target.map((x,k)=>x-amounts.slice(0,n).reduce((s,x,j)=>s+x*P[j][k],0));q.left.forEach((x,k)=>{assert.ok(x>=0&&q.right[k]>=0);near(x-q.right[k],diff[k]);});near(q.residual,Math.hypot(...diff));near(q.relative,q.residual/Math.hypot(...q.target));near(q.bestResidual,Math.hypot(...q.target.map((x,k)=>x-q.fit[k])));assert.ok(q.residual+1e-14>=q.bestResidual);for(const rgb of coneDisplayPair(q.left,q.right))for(const x of rgb)assert.ok(Number.isInteger(x)&&x>=0&&x<=255);}
 assert.deepEqual(coneDisplayPair([0,0,0],[0,0,0]),[[0,0,0],[0,0,0]]);const p=coneMatch(580,0,3,[...coneLeastSquares(coneAt(580),3)]),rgb=coneDisplayPair(p.left,p.right);assert.deepEqual(rgb[0],rgb[1]);
 // Separate official2015 table is a consistency check, not an exact-identity claim:
 // at coincident source wavelengths the independently published tables differ
 // from the rounded Eq14 transform by up to3.14e-5 absolute.
 let max=0;for(let j=0;j<89;j++){assert.equal(fixtures.xyz5nm[j][0],CONE_ROWS[j][0]);coneXYZ(CONE_ROWS[j].slice(1).map(x=>x??0)).forEach((x,k)=>{const d=Math.abs(x-fixtures.xyz5nm[j][k+1]);max=Math.max(max,d);assert.ok(d<3.2e-5);});}assert.ok(max>3e-5);
});
test('Actual control/replay numerical domains reject malformed inputs while preserving arbitrary valid continuous values',()=>{
 for(const args of[['bad',540,80,1,500],['bump',399,80,1,500],['bump',540.5,80,1,500],['bump',540,19,1,500],['bump',540,80,2.001,500],['bump',540,80,1,NaN]])assert.throws(()=>coneSpectrum(...args),RangeError);
 for(const [l,w]of[[399,0],[701,0],[540.5,0],[540,-.001],[540,1.001],[540,NaN]])assert.throws(()=>coneMatchTarget(l,w),RangeError);
 for(const n of[0,4,1.5,NaN])assert.throws(()=>coneLeastSquares([1,2,3],n),RangeError);for(const a of[[1,2],[1,2,NaN],Array(3),[2.1,0,0]])assert.throws(()=>coneMatch(540,0,3,a),RangeError);for(const a of[[1,2],Array(3),[-1,0,0],[0,Infinity,0]])assert.throws(()=>coneDisplayPair(a,[0,0,0]),RangeError);
 const q=coneMatch(537,.137,2,[.123456789,-.987654321,1.23456789]);assert.equal(q.amounts[2],1.23456789);assert.ok(q.left.every(Number.isFinite));assert.throws(()=>coneLeastSquares(Array(3),1),RangeError);
});
