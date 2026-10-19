// Independent numerical checks for the Wave 3–4 corrections.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { archGeometry, archFeasible, thrustAt } from '../content/tech/ch04.shared.js';
import { arch, thrustLP } from '../content/arch/ch03.shared.js';
import { XS_PWT, US_PWT, GA_PWT, rows, growthAccounting, ols } from '../content/macro/ch03.shared.js';
import { growthRegressions, escapePath, AJR_DATA, iv1 } from '../content/macro/ch04.shared.js';
import { slProblem, slEigenpairs, slEigenvaluesThrough, slInner, slPath, nodeZeros, analyticExampleCoefficients, polyHorner, flowEnd } from '../content/ode/ch04.shared.js';
import { eigModes, pluckCoefficient, trigCoef, trigSum, fourierLamina, fourierBar } from '../content/pde/ch04.shared.js';
import { heatBallAverage, heatBallHalfWidth, tyDerivs, tyEval, tyOK, tyCircleLogBound, G } from '../content/pde/ch03.shared.js';
import { gaussianExhaustion, sliceFunction, sliceExtrema, sliceDarboux, changeMaps, changeIntegral, changeSums, changeBounds, simplePolygon, polyArea, polyCentroid, polygonRevolutionVolume, polygonSweepArea } from '../content/vcalc/ch04.shared.js';
import { getGroup, cosetClasses } from '../content/alg/ch06.shared.js';
import { ABC, ENG, SHIFT_SAMPLES, shiftScores, m26, hillPair, hillInverse, rsaExample, powmod, signatureDemo, dictionaryForgery, SIGN_KEYS } from '../content/alg/ch07.shared.js';
import {tableOf, irrepMats, cmul, cmm, cabs, csub, ctr, ip, multiplicities, cubeData, hexProjections, averageIntertwiner, colouringOrbits, actOn} from '../content/rep/ch03.shared.js';

test('character tables match actual irreducible matrices and independently constructed permutation actions',()=>{
  for(const key of ['S3','D4','D5','D6','Q8','A4']){
    const {G,rows}=tableOf(key);
    const irreps=irrepMats(key),coeffs=[];
    for(const R of irreps)for(let i=0;i<R.d;i++)for(let j=0;j<R.d;j++)coeffs.push({d:R.d,v:R.mats.map(M=>M[i][j])});
    for(let i=0;i<coeffs.length;i++)for(let j=0;j<coeffs.length;j++){
      let re=0,im=0;for(let g=0;g<G.n;g++){const [a,b]=coeffs[i].v[g],[c,d]=coeffs[j].v[g];re+=a*c+b*d;im+=b*c-a*d;}
      assert.ok(Math.abs(re/G.n-(i===j?1/coeffs[i].d:0))<2e-12);assert.ok(Math.abs(im/G.n)<2e-12);
    }
    for(const R of irreps){
      const row=rows.find(r=>r.name===R.name);
      for(let g=0;g<G.n;g++)assert.ok(cabs(csub(ctr(R.mats[g]),row.vals[G.cls[g]]))<2e-12);
      for(let a=0;a<G.n;a++)for(let b=0;b<G.n;b++){
        const M=cmm(R.mats[a],R.mats[b]);
        for(let i=0;i<R.d;i++)for(let j=0;j<R.d;j++)assert.ok(cabs(csub(M[i][j],R.mats[G.mul[a][b]][i][j]))<2e-12);
      }
    }
  }
  for(const n of [4,5]){
    const {G,rows}=tableOf('S'+n),pairs=[];
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairs.push([i,j]);
    for(const C of G.classes){
      const p=G.perms[C.rep],fix=p.filter((x,i)=>x===i).length,std=fix-1;
      const inversions=p.reduce((s,x,i)=>s+p.slice(i+1).filter(y=>y<x).length,0),sign=(-1)**inversions;
      let expected;
      if(n===4){
        const matchings=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
        const encode=parts=>parts.map(a=>a.slice().sort().join(',')).sort().join('|');
        const fixed=matchings.filter(m=>encode(m)===encode(m.map(a=>a.map(x=>p[x])))).length;
        expected=[1,sign,fixed-1,std,sign*std];
      }else{
        const fixedPairs=pairs.filter(([i,j])=>(p[i]===i&&p[j]===j)||(p[i]===j&&p[j]===i)).length;
        const five=fixedPairs-fix,p2=p.map(x=>p[x]),std2=p2.filter((x,i)=>x===i).length-1;
        expected=[1,sign,std,sign*std,five,sign*five,(std*std-std2)/2];
      }
      rows.forEach((r,i)=>assert.ok(cabs(csub(r.vals[G.cls[C.rep]],[expected[i],0]))<1e-12));
    }
    for(const a of rows)for(const b of rows)assert.ok(cabs(csub(ip(G,a.vals,b.vals),[+(a===b),0]))<1e-12);
    const reg=G.classes.map(c=>[c.rep===G.e?G.n:0,0]);
    multiplicities(G,rows,reg).forEach((m,i)=>assert.ok(Math.abs(m[0]-rows[i].d)<1e-12));
  }
});
test('cube characters count the independently known fixed geometric objects',()=>{
  const cube=cubeData(),{G,rows}=tableOf('S4');
  const sets={...cube.sets,faceAxes:{pts:[[1,0,0],[0,1,0],[0,0,1]]},edgeAxes:{pts:cube.sets.edges.pts.filter((p,i,a)=>a.findIndex(q=>cube.same(q,p.map(x=>-x)))>=i)}};
  const expected={diag:[4,2,0,1,0],faces:[6,0,2,0,2],verts:[8,0,0,2,0],edges:[12,2,0,0,0],faceAxes:[3,1,3,0,1],edgeAxes:[6,2,2,0,0]};
  for(const [key,S]of Object.entries(sets)){
    const lines=['diag','faceAxes','edgeAxes'].includes(key);
    const values=G.classes.map(C=>S.pts.filter(p=>{const q=cube.app(cube.rot[C.rep],p);return cube.same(p,q)||(lines&&cube.same(p,q.map(x=>-x)));}).length);
    assert.deepEqual(values,expected[key]);
    const m=multiplicities(G,rows,values.map(x=>[x,0]));
    assert.ok(m.every(x=>Math.abs(x[0]-Math.round(x[0]))<1e-12&&x[0]>=-1e-12));
    assert.ok(Math.abs(m.reduce((s,x,i)=>s+x[0]*rows[i].d,0)-S.pts.length)<1e-12);
  }
});
test('isotypic hexagon projections agree with independent discrete Fourier kernels',()=>{
  const random=rng(314159);
  for(let trial=0;trial<50;trial++){
    const f=Array.from({length:6},()=>8*random()-4),actual=hexProjections(f);
    const mean=f.reduce((s,x)=>s+x,0)/6,alt=f.reduce((s,x,j)=>s+(-1)**j*x,0)/6;
    const expected=[f.map(()=>mean),f.map(()=>0),f.map((_,k)=>(-1)**k*alt),f.map(()=>0),... [1,2].map(q=>f.map((_,k)=>f.reduce((s,x,j)=>s+x*Math.cos(2*Math.PI*q*(k-j)/6)/3,0)))];
    actual.forEach((p,i)=>p.forEach((x,k)=>assert.ok(Math.abs(x-expected[i][k])<1e-12)));
  }
});
test('averaging supplies an isomorphism witness only when its actual matrix is invertible',()=>{
  const {G}=tableOf('S3'),rho=G.mat;
  const exact=averageIntertwiner(rho,rho,[[2,3],[5,7]]);
  exact.T.forEach((r,i)=>r.forEach((x,j)=>assert.ok(Math.abs(x-(i===j?4.5:0))<1e-12)));
  assert.ok(exact.invertible);assert.ok(exact.defect<1e-12);
  const zero=averageIntertwiner(rho,rho,[[0,0],[0,0]]);
  assert.equal(zero.invertible,false);assert.equal(zero.norm,0);
  const traceless=averageIntertwiner(rho,rho,[[1,0],[0,-1]]);
  assert.equal(traceless.invertible,false);assert.ok(traceless.norm<1e-12);
  const other=G.perms.map((_,g)=>[[1,0],[0,G.isRef(g)?-1:1]]);
  assert.ok(averageIntertwiner(rho,other,[[2,3],[5,7]]).norm<1e-12);
  // Reducible non-isomorphic representations can have nonzero, singular averages.
  const trivial=G.perms.map(()=>[[1,0],[0,1]]),shared=averageIntertwiner(other,trivial,[[1,0],[0,1]]);
  assert.ok(shared.norm>.9);assert.equal(shared.invertible,false);
});

const algebraRef=JSON.parse(readFileSync(new URL('../docs/verification/algebra-source-evidence.json',import.meta.url)));
test('Lagrange lab enumerates every subgroup and partitions each of its four groups',()=>{
  for(const key of ['Z12','D6','A4','U15']){
    const {G,subs}=getGroup(key),independent=[];
    // Exhaust every subset, independently of the generator-closure enumeration.
    for(let mask=1;mask<2**G.n;mask++){
      if(!(mask&(1<<G.e)))continue;
      const H=Array.from({length:G.n},(_,i)=>i).filter(i=>mask&(1<<i));
      if(H.every(a=>H.every(b=>mask&(1<<G.T[a][b]))))independent.push(H.join(','));
    }
    assert.deepEqual(subs.map(H=>H.join(',')).sort(),independent.sort());
    for(const H of subs){
      const C=cosetClasses(G,H);assert.equal(C.length*H.length,G.n);
      assert.equal(new Set(C.flat()).size,G.n);assert.ok(C.every(c=>c.length===H.length));
    }
    if(key==='A4')assert.ok(!subs.some(H=>H.length===6));
  }
});
test('frequency reference matches the author table and shift scores rotate for every key',()=>{
  assert.deepEqual(ENG,ABC.split('').map(c=>algebraRef.frequencies.percentByLetter[c]));
  for(const [kind,offset]of [['short',15],['medium',0],['long',0]])for(let k=0;k<26;k++){
    const r=shiftScores(SHIFT_SAMPLES[kind],k);
    assert.equal(r.best,m26(k+offset));assert.ok(r.ratio>1);
    assert.equal([...r.ct].map(c=>ABC[m26(ABC.indexOf(c)-k)]).join(''),r.pt);
  }
  assert.equal(Math.max(...shiftScores(SHIFT_SAMPLES.short,0).f),25);
});
test('affine Hill example matches Judson and inverses restore every pair',()=>{
  const {matrix,offset,plaintext,ciphertext,inverse}=algebraRef.hill;
  assert.deepEqual(hillInverse(matrix),inverse);
  const encode=t=>Array.from({length:t.length/2},(_,i)=>hillPair(matrix,offset,[ABC.indexOf(t[2*i]),ABC.indexOf(t[2*i+1])]).map(x=>ABC[x]).join('')).join('');
  assert.equal(encode(plaintext),ciphertext);
  const random=rng(71235);
  for(let k=0;k<70;k++){
    const A=Array.from({length:4},()=>Math.floor(26*random())),b=[k%26,(k*7)%26],inv=hillInverse(A),outputs=new Set();
    for(let i=0;i<26;i++)for(let j=0;j<26;j++){
      const c=hillPair(A,b,[i,j]);outputs.add(c.join(','));
      if(inv)assert.deepEqual(hillPair(inv,[0,0],[c[0]-b[0],c[1]-b[1]]),[i,j]);
    }
    assert.equal(outputs.size===676,inv!==null);
  }
});
test('RSA worked example and valid/invalid keys agree with independent BigInt powers',()=>{
  const ref=algebraRef.rsa,r=rsaExample(ref.p,ref.q,ref.E);
  assert.equal(r.D,ref.D);assert.equal(r.enc[ref.x],ref.ciphertext);assert.equal(r.dec[ref.x],ref.x);
  for(const [p,q]of [[3,5],[13,23],[23,29],[61,67],[3,3],[23,23]])for(const E of [2,3,7,17,487,997]){
    const r=rsaExample(p,q,E);
    for(let x=0;x<r.n;x++){
      assert.equal(r.enc[x],Number(BigInt(x)**BigInt(E)%BigInt(r.n)));
      if(r.D!==null)assert.equal(r.dec[x],Number(BigInt(r.enc[x])**BigInt(r.D)%BigInt(r.n)));
    }
    assert.equal(r.image===r.n,p!==q&&r.g===1);
    if(p!==q&&r.D!==null)assert.equal(r.fails,0,'includes nonunits and zero');
    if(p===q)assert.equal(r.phi,p*(p-1));
  }
  for(let x=0;x<26;x++)assert.equal(Array.from({length:26},(_,p)=>powmod(p,17,3233)).indexOf(powmod(x,17,3233)),x);
});
test('public-only signature enumeration forges a different dictionary-accepted word',()=>{
  const [A,B]=SIGN_KEYS;
  for(const word of ['BUY','PAY','YES','NOT','SAY']){
    assert.equal(signatureDemo(word,true,'none').wd,word);
    const f=dictionaryForgery(word),r=signatureDemo(word,true,'forge');
    assert.notEqual(f.word,word);assert.equal(r.ok,true);assert.equal(r.wd,f.word);
    assert.equal(Number(BigInt(f.s)**BigInt(A.E)%BigInt(A.n)),f.x);
    assert.equal(r.c,Number(BigInt(f.s)**BigInt(B.E)%BigInt(B.n)));
    assert.equal(r.trials,391);
  }
});

const integralRef = JSON.parse(readFileSync(new URL('../docs/verification/vcalc-integrals-reference.json', import.meta.url)));
test('change-of-variables antiderivatives match independent mapped-boundary integrals', () => {
  for(const row of integralRef.changeOfVariables){
    const I=changeIntegral(row.map,row.integrand),coarse=changeSums(row.map,row.integrand,2),fine=changeSums(row.map,row.integrand,40);
    assert.ok(Math.abs(I-row.integral)<2e-13*Math.max(1,I));
    assert.ok(Math.abs(fine.sJ-I)<=Math.abs(coarse.sJ-I)+1e-13*I);
    assert.ok(Math.abs(fine.sJ-I)<.002*I);
    assert.ok(Math.abs(fine.sN-I)>.05*I);
    const M=changeMaps[row.map],bounds=changeBounds(row.map);
    for(let i=0;i<=40;i++)for(let j=0;j<=40;j++){
      const u=M.u[0]+i*(M.u[1]-M.u[0])/40,v=M.v[0]+j*(M.v[1]-M.v[0])/40,[x,y]=M.T(u,v);
      assert.ok(x>=bounds.x[0]&&x<=bounds.x[1]&&y>=bounds.y[0]&&y<=bounds.y[1]);
    }
  }
  assert.ok(changeMaps.reverse.J()<0);
  assert.ok(changeSums('reverse','one',10).sJ>0);
  for(const n of [2,6,40])assert.ok(Math.abs(changeSums('reverse','r2',n).sJ-changeSums('shear','r2',n).sJ)<1e-13);
});
test('revolved polygon slices count annulus unions once, including touching and crossing axes', () => {
  const rect=[[1,0],[3,0],[3,2],[1,2]],cone=[[0,0],[2,0],[0,3]];
  for(const a of [0,4]){
    assert.ok(Math.abs(polygonRevolutionVolume(rect,a)-16*Math.PI)<1e-12);
    assert.ok(Math.abs(polygonSweepArea(rect,a)-32*Math.PI)<1e-12);
  }
  assert.ok(Math.abs(polygonRevolutionVolume(rect,2)-2*Math.PI)<1e-12);
  assert.ok(Math.abs(polygonSweepArea(rect,2)-12*Math.PI)<1e-12,'overlapping sheets counted twice');
  assert.ok(Math.abs(polygonRevolutionVolume(cone,0)-4*Math.PI)<1e-12);
  assert.ok(Math.abs(polygonSweepArea(cone,0)-(4*Math.PI+2*Math.PI*Math.sqrt(13)))<1e-12);
  const U=[[-3,0],[3,0],[3,3],[1,3],[1,1],[-2,1],[-2,3],[-3,3]];
  assert.ok(simplePolygon(U));
  assert.ok(Math.abs(polygonRevolutionVolume(U,0)-25*Math.PI)<1e-12,'folded disjoint intervals overlap and must be merged');
  assert.ok(Math.abs(polygonRevolutionVolume(U,3)-66*Math.PI)<1e-12);
  // A thin region can be missed by raster cells, but has a nonzero closed-form volume.
  const thin=[[1,0],[1.000001,0],[1.000001,2],[1,2]];
  assert.ok(Math.abs(polygonRevolutionVolume(thin,0)-2*Math.PI*(1.000001**2-1))<1e-14);
  for(const P of [rect,cone,U])assert.ok(Math.abs(polygonRevolutionVolume(P,0)-polygonRevolutionVolume([...P].reverse(),0))<1e-12);
});
test('polygon slicing independently reproduces centroid moments on either side of the axis', () => {
  const random=rng(87213);
  for(let j=0;j<60;j++){
    const P=Array.from({length:5},(_,i)=>{const a=2*Math.PI*i/5+.2*(random()-.5),r=.4+random();return[2+r*Math.cos(a),1+r*Math.sin(a)];});
    assert.ok(simplePolygon(P));
    for(const axis of [-1,5]){
      const expected=2*Math.PI*Math.abs(polyCentroid(P)[0]-axis)*Math.abs(polyArea(P));
      assert.ok(Math.abs(polygonRevolutionVolume(P,axis)-expected)<1e-10);
    }
  }
  for(const P of [[[0,0],[1,1],[0,1],[1,0]],[[0,0],[1,0],[1,0],[0,1]],[[0,0],[2,0],[1,0],[1,1],[0,1]]]){
    assert.equal(simplePolygon(P),false);
    assert.ok(Number.isNaN(polygonRevolutionVolume(P,0)));
  }
});
test('Gaussian exhaustion agrees with independent 80-digit erf references', () => {
  for (const row of integralRef.gaussian) {
    const actual = gaussianExhaustion(row.r);
    for (const key of ['d', 'd2', 'q', 'line']) assert.ok(Math.abs(actual[key] - row[key]) < 3e-11);
    assert.ok(actual.d <= actual.q && actual.q <= actual.d2);
  }
});
test('analytic Darboux bounds enclose integrals and oscillations missed by finite sampling', () => {
  for (const key of ['wavy', 'chirp']) for (let m = 1; m <= 60; m++) {
    const {lo, up} = sliceDarboux(key, m), exact = integralRef.slicingIntegrals[key];
    assert.ok(lo <= exact && exact <= up);
    for (let j = 0; j < m; j++) {
      const [mn, mx] = sliceExtrema(key, j/m, (j+1)/m);
      for (let q = 0; q <= 40; q++) {
        const y = sliceFunction(key, (j + q/40)/m);
        assert.ok(y >= mn-2e-14 && y <= mx+2e-14);
      }
    }
    assert.deepEqual(sliceExtrema('chirp', 0, 1/m), [0,1]);
    assert.ok(Math.abs(sliceDarboux('rat',m).up - 1) < 2e-15);
  }
  assert.deepEqual(sliceExtrema('chirp', 0, 1e-12), [0,1]);
  // Independent extrema at sin(1/x)=±1, far below the former x=1e-6 cutoff.
  for (const phase of [Math.PI/2, 3*Math.PI/2]) {
    const x = 1/(2*Math.PI*1e7+phase);
    assert.ok(Math.abs(sliceFunction('chirp',x) - (phase===Math.PI/2 ? 1 : 0)) < 1e-12);
  }
});

test('heat-ball weights reproduce caloric functions and the exact noncaloric quadratic defect', () => {
  for (const r of [.5, 3, 5]) for (const x of [-2.5, .5, 2.5]) for (const t of [.6, 4.6]) {
    for (const u of [() => 1, (x,t) => x*x+2*t, (x,t) => x**3+6*x*t, (x,t) => Math.exp(-t)*Math.cos(x), (x,t) => G(x,t+2)]) {
      const actual = heatBallAverage(u,x,t,r).avg, exact = u(x,t);
      assert.ok(Math.abs(actual-exact)<2e-11*Math.max(1,Math.abs(exact)));
    }
    const actual = heatBallAverage(x=>x*x,x,t,r).avg-x*x, exact = r*r/(2*Math.PI*3**2.5);
    assert.ok(Math.abs(actual-exact)<1e-12);
    const tau = r*r/(4*Math.PI*Math.E), half = heatBallHalfWidth(tau,r);
    assert.ok(Math.abs(half-r/Math.sqrt(2*Math.PI*Math.E))<1e-14);
    assert.ok(Math.abs(G(half,tau)-1/r)<1e-13);
  }
});

test('Tychonoff circle majorants bound the entire contour, including off-axis maxima', () => {
  for (const alpha of [1.2,1.5,1.9]) for (const t of [.05,.15,.8,2]) for (const rho of [.05,.4,.7,.85]) {
    const bound = tyCircleLogBound(alpha,t,rho);
    for (let j=0;j<512;j++) {
      const theta=2*Math.PI*j/512, re=t*(1+rho*Math.cos(theta)), im=t*rho*Math.sin(theta);
      const actual=-Math.pow(Math.hypot(re,im),-alpha)*Math.cos(alpha*Math.atan2(im,re));
      assert.ok(actual<=bound+1e-10);
    }
  }
});

test('accepted Tychonoff values and derivatives match independent 200/300-digit recurrences', () => {
  const fixture=JSON.parse(readFileSync(new URL('../docs/verification/tychonoff-reference.json',import.meta.url))), cache=new Map();
  let accepted=0, rejected=0;
  for(const row of fixture.rows) {
    const key=[row.alpha,row.t].join();
    if(!cache.has(key))cache.set(key,tyDerivs(row.alpha,row.t));
    const D=cache.get(key);
    for(const shift of [0,1]) {
      const calc=tyEval(D,row.x,shift), reference=shift?row.ut:row.u;
      if(tyOK(calc)) {
        accepted++;
        assert.ok(Math.abs(calc.u-reference)<=calc.err+Math.abs(reference)*1e-14,`${key}, x=${row.x}, shift=${shift}`);
        assert.ok(Math.abs(calc.u-reference)<1e-8*Math.max(Math.abs(reference),1e-280));
      } else rejected++;
    }
  }
  assert.ok(accepted>=100 && rejected>=10);
  assert.equal(tyOK(tyEval(tyDerivs(1.5,.05),5)),false,'do not publish an unconverged far-field partial sum');
  assert.equal(tyOK({u:0,err:0}),false,'underflow is not a certified zero');
});

const quadrature = (f, a = 0, b = 1, N = 4000) => {
  let sum = f(a) + f(b);
  for (let i = 1; i < N; i++) sum += (i % 2 ? 4 : 2) * f(a + (b - a) * i / N);
  return sum * (b - a) / (3 * N);
};

test('PDE eigenmodes have exact D/N spectra and normalized Robin modes through both zero thresholds', () => {
  for (const left of ['D', 'N']) for (const right of ['D', 'N']) {
    eigModes(left, right, 0, 0, 8).forEach((m, i) => {
      const n = left !== right ? i + .5 : left === 'D' ? i + 1 : i;
      assert.ok(Math.abs(m.lam - (n * Math.PI) ** 2) < 1e-10);
      assert.ok(Math.abs(quadrature(x => m.X(x) ** 2) - 1) < 1e-10);
    });
  }
  for (const left of ['D', 'N']) {
    let prev = -Infinity;
    for (const h of [-3, -1.25, -1, -.75, -.25, 0, .25, 3, 20]) {
      const modes = eigModes(left, 'R', 0, h, 8);
      assert.equal(modes.length, 8);
      assert.ok(modes[0].lam > prev); prev = modes[0].lam;
      const threshold = left === 'D' ? -1 : 0;
      assert.equal(modes[0].kind, h < threshold ? 'growing' : h === threshold ? 'zero' : 'osc');
      for (const m of modes) {
        assert.ok(Math.abs(left === 'D' ? m.X(0) : m.dX(0)) < 1e-11);
        assert.ok(Math.abs(m.dX(1) + h * m.X(1)) < 1e-10);
        assert.ok(Math.abs(quadrature(x => m.X(x) ** 2) - 1) < 1e-9);
        const energy = quadrature(x => m.dX(x) ** 2) + h * m.X(1) ** 2;
        assert.ok(Math.abs(energy - m.lam) < 1e-6);
      }
      assert.ok(Math.abs(quadrature(x => modes[0].X(x) * modes[1].X(x))) < 1e-10);
    }
  }
});

test('triangular pluck coefficients reproduce direct projections and the full string energy', () => {
  for (const p of [1 / 12, 1 / 3, .5, .95]) for (const h of [.1, 1.4]) {
    const f = x => x < p ? h * x / p : h * (1 - x) / (1 - p);
    for (let n = 1; n <= 16; n++) {
      const projection = 2 * (quadrature(x => f(x) * Math.sin(n * Math.PI * x), 0, p) + quadrature(x => f(x) * Math.sin(n * Math.PI * x), p, 1));
      assert.ok(Math.abs(pluckCoefficient(n, p, h) - projection) < 1e-10);
    }
    let energy = 0;
    for (let n = 1; n <= 10000; n++) energy += (n * pluckCoefficient(n, p, h)) ** 2;
    const exact = 2 * h * h / (Math.PI ** 2 * p * (1 - p));
    assert.ok(energy <= exact && energy / exact > .999);
  }
  for (const n of [3, 6, 9, 12, 15]) assert.ok(Math.abs(pluckCoefficient(n, 1 / 3, 1)) < 1e-14);
});

test('Fourier coefficients agree with exact square, saw and triangle formulas and finite Parseval identities', () => {
  const NQ = 4096;
  for (const key of ['square', 'saw', 'tri', 'spike']) {
    const f = {square: Math.sign, saw: x => x / Math.PI, tri: x => Math.abs(x) / Math.PI, spike: x => Math.exp(-((x / .35) ** 2))}[key];
    const c = trigCoef(f, 64, NQ);
    for (let n = 1; n <= 64; n++) {
      const expectedA = key === 'tri' && n % 2 ? -4 / (Math.PI * n) ** 2 : 0;
      const expectedB = key === 'square' ? (n % 2 ? 4 / (Math.PI * n) : 0) : key === 'saw' ? 2 * (n % 2 ? 1 : -1) / (Math.PI * n) : 0;
      if (key !== 'spike') assert.ok(Math.abs(c.a[n] - expectedA) < 1e-5 && Math.abs(c.b[n] - expectedB) < 1e-5);
    }
    for (const N of [0, 5, 64]) {
      let norm = 0, err = 0, sum = Math.PI * c.a[0] ** 2 / 2;
      for (let n = 1; n <= N; n++) sum += Math.PI * (c.a[n] ** 2 + c.b[n] ** 2);
      for (let i = 0; i < NQ; i++) { const x = -Math.PI + (i + .5) * 2 * Math.PI / NQ, y = f(x); norm += y * y * 2 * Math.PI / NQ; err += (y - trigSum(c, N, x)) ** 2 * 2 * Math.PI / NQ; }
      assert.ok(Math.abs(err - (norm - sum)) < 1e-11);
    }
  }
});

test('Fourier lamina reconstruction converges to the closed form and bar modes solve the heat equation', () => {
  for (const x of [.2, .7, 2]) for (const y of [-1.4, 0, .8]) {
    const exact = 2 / Math.PI * Math.atan(Math.cos(y) / Math.sinh(x));
    assert.ok(Math.abs(fourierLamina(60, x, y) - exact) < 1e-11);
  }
  for (const t of [.02, .1, 1]) for (const y of [-1, 0, .7]) {
    const h = 1e-4, ht = 1e-5, u = fourierBar(t, y);
    const ut = (fourierBar(t + ht, y) - fourierBar(t - ht, y)) / (2 * ht);
    const uyy = (fourierBar(t, y + h) - 2 * u + fourierBar(t, y - h)) / (h * h);
    assert.ok(Math.abs(ut - uyy) < 2e-6);
    assert.ok(Math.abs(fourierBar(t, Math.PI / 2)) < 1e-14);
  }
});

test('analytic-example Taylor polynomials agree with the differential equation inside its guaranteed disc', () => {
  for (const c of [.35, 1, 2.3]) for (const x0 of [-2, 0, 2]) {
    const a = analyticExampleCoefficients(c, x0, 70), R = Math.hypot(c, x0);
    for (const t of [-.6 * R, .6 * R]) {
      const u = polyHorner(a, t);
      const du = polyHorner(a.slice(1).map((x, i) => x * (i + 1)), t);
      const ddu = polyHorner(a.slice(2).map((x, i) => x * (i + 1) * (i + 2)), t);
      assert.ok(Math.abs(((x0 + t) ** 2 + c * c) * ddu + c * c * u) < 1e-8);
      const rk = flowEnd((x, [u, d]) => [d, -c * c * u / (c * c + x * x)], x0, [1, .4], x0 + t, 2400);
      assert.ok(Math.abs(u - rk[0]) < 1e-8);
      assert.ok(Math.abs(du - rk[1]) < 1e-8);
    }
  }
});

test('oscillation counts interior zeros in the last mesh cell and all modes below the displayed limit', () => {
  const pr = slProblem(() => 1, () => 0, () => 1);
  for (let n = 1; n <= 6; n++) {
    assert.equal(nodeZeros(slPath(pr, (n * Math.PI) ** 2, 0, 1).u).length, n - 1);
    const k = n * Math.PI / .9995; // the newest zero is inside the final grid cell
    assert.equal(nodeZeros(slPath(pr, k * k, 0, 1).u).length, n);
  }
  const heavy = slProblem(() => 1, () => 0, x => 1 + 4 * x);
  const ep = slEigenpairs(heavy, 'DD', 16), n = ep.filter(e => e.lam < 400).length;
  assert.ok(n > 8);
  assert.equal(nodeZeros(slPath(heavy, 400, 0, 1).u).length, n);
  const dense = slProblem(() => 1, () => 0, () => 100), ev = slEigenvaluesThrough(dense, 'DD', 400);
  assert.equal(ev.length, 64);
  assert.equal(ev.filter(e => e < 400).length, 63);
  assert.ok(ev.at(-1) > 400, 'adaptive list covers the full requested window');
});

test('Sturm–Liouville shooting reproduces exact DD, NN and mixed spectra, including zero and negative modes', () => {
  for (const bc of ['DD', 'NN', 'DN', 'ND']) for (const shift of [0, -40, 40]) {
    const pr = slProblem(() => 1, () => shift, () => 1);
    const ep = slEigenpairs(pr, bc, 12);
    assert.equal(ep.length, 12);
    ep.forEach((e, i) => {
      const n = bc === 'DD' ? i + 1 : bc === 'NN' ? i : i + .5;
      const exact = shift + (n * Math.PI) ** 2;
      assert.ok(Math.abs(e.lam - exact) < 4e-4, `${bc}, q=${shift}, mode ${i + 1}`);
      assert.ok(Math.abs(slInner(pr, e.u, e.u) - 1) < 1e-12);
      assert.ok(Math.abs((bc[0] === 'D' ? e.u : e.v)[0]) < 1e-10);
      assert.ok(Math.abs((bc[1] === 'D' ? e.u : e.v)[pr.N]) < 1e-9);
    });
  }
});

test('weighted eigenfunctions remain orthogonal and finite Parseval residuals agree without reorthogonalizing', () => {
  for (const w of [() => 1, x => 1 + 4 * x]) for (const bc of ['DD', 'NN', 'DN']) {
    const pr = slProblem(() => 1, () => 0, w, 1200), ep = slEigenpairs(pr, bc, 30);
    let off = 0;
    for (let i = 0; i < 6; i++) for (let j = 0; j < i; j++) off = Math.max(off, Math.abs(slInner(pr, ep[i].u, ep[j].u)));
    assert.ok(off < 3e-8, `${bc}: Gram error ${off}`);
    for (const fn of [() => 1, x => 4 * x * (1 - x)]) {
      const f = Float64Array.from({length: pr.N + 1}, (_, i) => fn(i / pr.N));
      const coeff = ep.map(e => slInner(pr, f, e.u)), ff = slInner(pr, f, f);
      for (const n of [1, 6, 30]) {
        const residual = Float64Array.from(f, (y, i) => y - ep.slice(0, n).reduce((a, e, j) => a + coeff[j] * e.u[i], 0));
        const direct = slInner(pr, residual, residual), parseval = ff - coeff.slice(0, n).reduce((a, c) => a + c * c, 0);
        assert.ok(Math.abs(direct - parseval) < 2e-7, `${bc}, N=${n}: ${direct} vs ${parseval}`);
      }
      if (w(.5) === 1 && bc === 'NN' && fn(.5) === 1 && fn(0) === 1) assert.ok(Math.abs(coeff[0] - 1) < 1e-12, 'constant is the zero eigenmode');
    }
  }
});

const pwt = JSON.parse(readFileSync(new URL('../docs/verification/pwt-10.0.json', import.meta.url)));
const ajr = JSON.parse(readFileSync(new URL('../docs/verification/ajr-table4.json', import.meta.url)));
test('all growth-accounting and US time-series inputs match PWT 10.0', () => {
  const accounting=rows(GA_PWT,7),us=rows(US_PWT,6);
  assert.equal(accounting.length,pwt.growthAccountingRows.length);
  for(const [i,row] of accounting.entries()) {
    const source=pwt.growthAccountingRows[i];
    assert.deepEqual(row.slice(0,2),source.slice(0,2));
    for(let j=2;j<7;j++)assert.ok(Math.abs(row[j]-source[j])<[.501,.501,.000501,.0000501,.0000501][j-2],`${row[0]}, ${row[1]}, column ${j}`);
  }
  assert.equal(us.length,pwt.usRows.length);
  us.forEach((row,i)=>row.forEach((x,j)=>assert.ok(Math.abs(x-pwt.usRows[i][j])<=[0,.00501,.00501,.000501,.0000501,.0000501][j],`USA ${row[0]}, column ${j}`)));
});

test('full-period growth accounting telescopes over 59 years, with both signed stacks in bounds', () => {
  for(const country of new Set(pwt.growthAccountingRows.map(r=>r[0])))for(const share of [null,1/3]) {
    const data=rows(GA_PWT,7).filter(r=>r[0]===country),g=growthAccounting(data,share);
    const endpointGrowth=Math.log(data.at(-1)[2]/data[0][2])/59;
    assert.equal(g.years,59);
    assert.ok(Math.abs(g.mean.gY-endpointGrowth)<1e-14);
    assert.ok(Math.abs(g.mean.cap+g.mean.lab+g.mean.hc+g.mean.tfp-endpointGrowth)<1e-14);
    for(const o of g.out) {
      let positive=0,negative=0;
      for(const value of [o.cap,o.lab,o.hc,o.tfp]){if(value>=0)positive+=value;else negative+=value;}
      assert.ok(positive<=g.hi+1e-14&&negative>=g.lo-1e-14);
    }
  }
  // Known technology growth with opposing factor contributions and unequal intervals.
  const data=[0,10,19].map(t=>['toy',t,Math.exp(.02*t),Math.exp(.12*t),Math.exp(-.04*t),1,2/3]);
  const g=growthAccounting(data,1/3);
  assert.ok(Math.abs(g.mean.tfp-(.02-.12/3+.04*2/3))<1e-14);
  assert.ok(g.hi>g.mean.gY,'positive stack can exceed net output growth');
});

test('Malthusian escape simulation matches the fixed-progress discrete solution above subsistence', () => {
  const g0=.0003,path=escapePath(0,g0,.006,false,2.2);
  const last=path.pts.at(-1),expected=g0*(1-(1-.02*.3)**1600)/(.02*.3);
  assert.ok(Math.abs(Math.log(last[1])-expected)<1e-12);
  assert.ok(last[1]>1.05&&last[1]<1.052);
  assert.equal(path.esc,null);
});

test('escape markers identify the first cap crossing and all log steps obey income accounting', () => {
  for(const nu of [0,1,2])for(const g0 of [.0001,.0006])for(const nm of [.002,.012])for(const transition of [false,true]) {
    const p=escapePath(nu,g0,nm,transition,2.2);
    const first=p.pts.find(r=>r[2]>p.threshold)?.[0]??null;
    assert.equal(p.esc,first);
    for(let i=1;i<p.pts.length;i++) {
      const a=p.pts[i-1],b=p.pts[i];
      assert.ok(b.every(Number.isFinite));
      assert.ok(Math.abs(Math.log(b[1]/a[1])-(a[2]-a[3]))<1e-13);
      assert.ok(a[3]<=p.threshold+1e-14);
    }
  }
});

test('AJR embedded sample and every group filter match author data and independent 2SLS fits', () => {
  const data=AJR_DATA.split(' ').map(row=>{const[code,...values]=row.split(',');return[code,...values.map(Number)];});
  assert.deepEqual(data.map(r=>r[0]),ajr.rows.map(r=>r[0]));
  data.forEach((row,i)=>{for(let j=1;j<4;j++)assert.ok(Math.abs(row[j]-ajr.rows[i][j])<=.005001);assert.equal(row[4],ajr.rows[i][4]);});
  for(const c of ajr.roundedCases) {
    const d=data.filter(r=>!(c.dropAfrica&&r[4]===1)&&!(c.dropNeoEuropes&&r[4]===3)&&!(c.dropAsia&&r[4]===2));
    const fit=iv1(d.map(r=>r[1]),d.map(r=>r[2]),d.map(r=>r[3]),ols);
    assert.equal(d.length,c.n);
    for(const [key,expected] of [['ols',c.ols],['fs',c.firstStage],['tsls',c.tsls]]) {
      assert.ok(Math.abs(fit[key].intercept-expected[0])<1e-10);
      assert.ok(Math.abs(fit[key].slope-expected[1])<1e-10);
    }
    assert.ok(Math.abs(fit.tsls.se-c.tslsSE[1])<1e-10);
  }
});
test('all embedded PWT cross-section inputs match the official 10.0 workbook', () => {
  assert.deepEqual(XS_PWT.map(r=>r[0]),pwt.rows.map(r=>r[0]));
  // Half a stored unit, plus a small allowance for source binary precision.
  const tolerance = {2:.000501,3:.000501,4:.0000501,5:.00000501,6:.000501,7:.000501,9:.0000501};
  for (const [i,row] of XS_PWT.entries()) {
    const source = pwt.rows[i];
    assert.equal(row[8],source[8],`${row[0]} historical OECD membership`);
    for (const [col,tol] of Object.entries(tolerance)) {
      if (source[col] === null) assert.equal(row[col],null,`${row[0]} missing ${col}`);
      else assert.ok(Number.isFinite(row[col]) && Math.abs(row[col]-source[col]) <= tol,`${row[0]} column ${col}: ${row[col]} vs ${source[col]}`);
    }
  }
});

test('growth regressions agree with independent source-derived NumPy least squares', () => {
  for (const c of pwt.regressions) {
    const data = XS_PWT.filter(r=>c.subset==='all'||r[8]);
    assert.equal(data.length,c.n);
    const actual = growthRegressions(data,c.gd);
    for (const [name,expected] of Object.entries(c.models)) {
      assert.ok(Math.abs(actual[name].adjR2-expected.adjR2)<1e-10,`${c.subset}, ${c.gd}, ${name} adjusted R²`);
      expected.b?.forEach((b,i)=>assert.ok(Math.abs(actual[name].b[i]-b)<1e-8,`${c.subset}, ${c.gd}, ${name} coefficient ${i}`));
      assert.ok(actual[name].pred.every(Number.isFinite));
    }
  }
});

function threshold(alpha, N) {
  let lo = 0.01, hi = 0.3;
  for (let i = 0; i < 30; i++) {
    const t = (lo + hi) / 2;
    if (archFeasible(archGeometry(t, alpha, N), 2, 2).ok) hi = t; else lo = t;
  }
  return hi;
}

test('radial semicircular arch converges to the published mean-radius threshold', () => {
  // Makris & Alexakis (2013), https://research.aston.ac.uk/en/publications/the-effect-of-stereotomy-on-the-shape-of-the-thrust-line-and-the-/: t/R_mean = 0.1075.
  const t = threshold(Math.PI / 2, 180);
  assert.ok(Math.abs(t / (1 + t / 2) - 0.10748) < 1e-5);
  assert.ok(Math.abs(threshold(Math.PI / 2, 90) - t) < 3e-5);
});

test('every displayed admissible thrust line stays inside every radial joint', () => {
  for (const alpha of [Math.PI / 3, Math.PI / 2]) for (const t of [0.03, 0.10, 0.115, 0.12, 0.16, 0.3]) {
    const g = archGeometry(t, alpha, 48), f = archFeasible(g, 2, 2);
    if (!f.ok) continue;
    for (const p of [f.min, f.middle, f.max]) for (const rho of thrustAt(g, p.H, p.yc)) {
      assert.ok(rho >= g.Ri - 1e-9 && rho <= g.Re + 1e-9, `${alpha}, ${t}: ${rho}`);
    }
  }
});

test('eliminated thrust constraints agree with the independent structural LP', () => {
  for (const alpha of [Math.PI / 3, Math.PI / 2]) for (const t of [0.02, 0.03, 0.10, 0.11, 0.12, 0.16]) {
    // Technology uses an intrados radius of 1; architecture uses the mean radius.
    const g = arch({R: 1 + t / 2, t, alpha, N: 96, gamma: 1});
    const independent = !!thrustLP(g, [], [1, 0, 0]);
    assert.equal(archFeasible(archGeometry(t, alpha, 48), 2, 2).ok, independent, `${alpha}, ${t}`);
  }
});

// The source audit found conditional and unconditional probabilities mixed in this visualization.
import { stableFeedbackLaw } from '../content/climate/ch04.shared.js';
import { integrate, rng } from '../assets/js/viz/math.js';

test('stable-branch sensitivity density is normalized, including its off-screen tail', () => {
  for (const [mu, sigma] of [[0.65, 0.15], [0.85, 0.35], [0.2, 0.02]]) {
    const law = stableFeedbackLaw(mu, sigma, 1.2);
    // Compactify the whole positive axis instead of ignoring the heavy tail above 12 K.
    const mass = integrate(u => {
      const s = u / (1 - u);
      return law.density(s) / (1 - u) ** 2;
    }, 0, 1 - 1e-8, 20000);
    assert.ok(Math.abs(mass - 1) < 2e-6, `${mu}, ${sigma}: integral ${mass}`);
    for (const p of [0.05, 0.5, 0.95]) assert.ok(Math.abs(law.cdf(law.quantile(p)) - p) < 1e-6);
    assert.equal(law.quantile(0), 0); assert.equal(law.quantile(1), Infinity);
  }
});

test('stable-branch median and exceedance agree with independently sampled worlds', () => {
  const law = stableFeedbackLaw(0.85, 0.35, 1.2), random = rng(20261016), values = [];
  let high = 0;
  for (let i = 0; i < 80000; i++) {
    const f = 0.85 + 0.35 * random.normal();
    if (f < 1) { const s = 1.2 / (1 - f); values.push(s); if (s > 4.5) high++; }
  }
  values.sort((a,b) => a-b);
  assert.ok(Math.abs(values[Math.floor(values.length / 2)] - law.quantile(.5)) < .05);
  assert.ok(Math.abs(high / values.length - law.exceedance(4.5)) < .006);
  assert.ok(law.quantile(.5) < 1.2 / (1 - .85), 'discarding unstable worlds changes the median');
});

import { malthus } from '../content/macro/ch04-b.js';
test('Malthusian income returns to subsistence only when technology stops growing', () => {
  for (const g of [0, 0.001, 0.002]) {
    const a = .7, eta = .02, path = malthus(a, eta, 1.8, g, 5000);
    const last = path.at(-1), prev = path.at(-2);
    assert.ok(Math.abs(last[2] - Math.exp(g / (eta * (1 - a)))) < 1e-9);
    assert.ok(Math.abs(Math.log(last[1] / prev[1]) - g / (1 - a)) < 1e-9);
  }
});

import { lorenzMoments } from '../content/cm/ch02.shared.js';
test('positive transport model recovers Sommerfeld and agrees with sampled energy variance', () => {
  const zero = lorenzMoments(0);
  assert.ok(Math.abs(zero.k0 - 1) < 1e-11);
  assert.ok(Math.abs(zero.k2 - Math.PI ** 2 / 3) < 3e-10);
  assert.ok(Math.abs(zero.ratio - 1) < 1e-10);
  const random = rng(112358), moments = [0, 0, 0];
  // Independent rejection sampling of the normalized logistic density times Sigma.
  const a = .95, n = 200000;
  for (let i = 0; i < n;) {
    const u = random(), x = Math.log(u / (1-u));
    if (random() * (1+a) > 1+a*Math.tanh(x)) continue;
    moments[0]++; moments[1] += x; moments[2] += x*x; i++;
  }
  const variance = moments[2]/n - (moments[1]/n)**2;
  assert.ok(Math.abs(lorenzMoments(a).ratio - variance/(Math.PI**2/3)) < .01);
  assert.ok(Math.abs(lorenzMoments(-a).ratio - lorenzMoments(a).ratio) < 1e-12);
  assert.ok(lorenzMoments(a).ratio > 0 && lorenzMoments(a).ratio < 1);
});

import { capitalSavingPath } from '../content/macro/ch04.shared.js';
test('saving-change paths match AK slopes and diminishing-returns equilibria', () => {
  for (const [s1,s2] of [[.2,.3],[.4,.05],[.1,.1]]) {
    const path = capitalSavingPath(1,.35,.06,s1,s2);
    for (const [t,lnk] of path) {
      const exact = (.35*s1-.06)*Math.min(t,50)+(.35*s2-.06)*Math.max(t-50,0);
      assert.ok(Math.abs(lnk-exact) < 1e-12);
    }
  }
  for(const a of [.5,.7,.99]) {
    const path = capitalSavingPath(a,.35,.06,.2,.3,50,200000,100);
    const expected = Math.log(.3*.35/.06)/(1-a);
    assert.ok(Math.abs(path.at(-1)[1] - expected) < 1e-9);
    // Independent differential check against the original nonlinear ODE.
    const q = capitalSavingPath(a,.35,.06,.2,.3,50,100,.001);
    const i = 75000, lnk = q[i][1];
    const derivative = (q[i+1][1]-q[i-1][1])/.002;
    assert.ok(Math.abs(derivative-(.3*.35*Math.exp((a-1)*lnk)-.06)) < 1e-9);
  }
});

import * as VMath from '../assets/js/viz/math.js';
import {fsIndicator,sqrtCount,formSpace,symData,extChars,extTrace,stdMats} from '../content/rep/ch04.shared.js';
import repChapter4 from '../content/rep/ch04.js';
import repChapter4b from '../content/rep/ch04-b.js';

test('orbit enumeration agrees with independent cycle-index formulas and canonical representatives',()=>{
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const cycles=p=>{let n=0,seen=new Set();for(let i=0;i<p.length;i++)if(!seen.has(i)){n++;let j=i;while(!seen.has(j)){seen.add(j);j=p[j];}}return n;};
  for(const brace of [false,true])for(let n=3;n<=8;n++)for(let k=2;k<=4;k++){
    const perms=Array.from({length:n},(_,a)=>Array.from({length:n},(_,i)=>(i+a)%n));
    if(brace)perms.push(...Array.from({length:n},(_,a)=>Array.from({length:n},(_,i)=>(a-i+n)%n)));
    const c=colouringOrbits(perms,n,k);
    c.fixCount.forEach((v,g)=>assert.equal(v,k**(g<n?gcd(n,g):cycles(perms[g]))));
    // A separate canonical word calculation does not use union-find or the colour-action maps.
    const canonical=new Set();
    for(let a=0;a<k**n;a++){
      const word=a.toString(k).padStart(n,'0'),rev=[...word].reverse().join('');let min=word;
      for(let j=0;j<n;j++){const rot=word.slice(j)+word.slice(0,j);if(rot<min)min=rot;if(brace){const r=rev.slice(j)+rev.slice(0,j);if(r<min)min=r;}}
      canonical.add(min);
    }
    assert.equal(c.orbits.length,canonical.size);assert.equal(c.fixCount.reduce((s,x)=>s+x,0)/perms.length,canonical.size);
    assert.equal(c.orbits.reduce((s,o)=>s+o.length,0),k**n);
  }
  const cube=cubeData(),perms=cube.rot.map(A=>actOn(cube,A,cube.sets.faces.pts));
  // Cube rotation cycle index: (a1^6 + 3a1^2a2^2 + 6a1^2a4 + 6a2^3 + 8a3^2)/24.
  for(let k=2;k<=4;k++){const c=colouringOrbits(perms,6,k);assert.equal(c.orbits.length,(k**6+3*k**4+12*k**3+8*k**2)/24);c.fixCount.forEach((v,i)=>assert.equal(v,k**cycles(perms[i])));}
});
test('all Frobenius–Schur indicators and square-root character expansions match element enumeration',()=>{
  for(const key of ['Z3','Z4','S3','D4','Q8','D5','A4','S4','A5','S5']){
    const {G,rows}=tableOf(key),nu=rows.map(r=>fsIndicator(G,r.vals));
    for(let j=0;j<rows.length;j++){
      const r=rows[j],sum=[0,0];for(let g=0;g<G.n;g++){const z=r.vals[G.cls[G.mul[g][g]]];sum[0]+=z[0]/G.n;sum[1]+=z[1]/G.n;}
      assert.ok(Math.abs(nu[j]-sum[0])<1e-12&&Math.abs(sum[1])<1e-12);
      assert.ok(Math.abs(nu[j]-Math.round(nu[j]))<1e-12&&Math.abs(nu[j])<1.01);
      if(key==='Q8')assert.equal(Math.round(nu[j]),r.d===2?-1:1);
      if(['S3','S4','S5','A5','D4','D5'].includes(key))assert.equal(Math.round(nu[j]),1);
    }
    const counts=sqrtCount(G);
    for(let g=0;g<G.n;g++){
      const count=G.mul.filter((r,h)=>r[h]===g).length,ci=G.cls[g];assert.equal(counts[ci]/G.classes[ci].size,count);
      let re=0,im=0;rows.forEach((r,j)=>{re+=nu[j]*r.vals[ci][0];im+=nu[j]*r.vals[ci][1];});assert.ok(Math.abs(re-count)<1e-11&&Math.abs(im)<1e-11);
    }
    for(const ir of irrepMats(key)){
      const i=rows.findIndex(r=>r.name===ir.name),sym=formSpace(VMath,ir.mats,'sym'),alt=formSpace(VMath,ir.mats,'alt');assert.equal(sym.length-alt.length,Math.round(nu[i])+0);
      const d=ir.d,Q=Array.from({length:d},(_,i)=>Array.from({length:d},(_,j)=>[+(i===j)+(i===0&&j===1?2:0),0])),Qi=Array.from({length:d},(_,i)=>Array.from({length:d},(_,j)=>[+(i===j)-(i===0&&j===1?2:0),0]));
      const sheared=ir.mats.map(R=>cmm(Q,cmm(R,Qi)));assert.equal(formSpace(VMath,sheared,'sym').length-formSpace(VMath,sheared,'alt').length,Math.round(nu[i])+0);
      for(const B of [...sym,...alt])for(const R of ir.mats){const Rt=R[0].map((_,i)=>R.map(r=>r[i])),C=cmm(Rt,cmm(B,R));C.forEach((r,i)=>r.forEach((z,j)=>assert.ok(cabs(csub(z,B[i][j]))<1e-10)));}
    }
  }
});
test('finite abelian characters are orthonormal and closed under products for every UI group',()=>{
  const chapter=repChapter4.items.find(i=>i.num==='4.1');assert.ok(chapter.statement.includes('cyclic coordinates'));
  for(let m=1;m<=6;m++)for(let n=1;n<=6;n++){
    const L=Array.from({length:m*n},(_,i)=>[Math.floor(i/n),i%n]);
    const z=(r,c)=>{const a=2*Math.PI*(r[0]*c[0]/m+r[1]*c[1]/n);return[Math.cos(a),Math.sin(a)];};
    for(const r of L)for(const s of L){
      let re=0,im=0;const sum=[(r[0]+s[0])%m,(r[1]+s[1])%n];
      for(const c of L){const a=z(r,c),b=z(s,c);re+=a[0]*b[0]+a[1]*b[1];im+=a[1]*b[0]-a[0]*b[1];assert.ok(cabs(csub(cmul(a,b),z(sum,c)))<3e-14);}
      assert.ok(Math.abs(re/(m*n)-+(r===s))<1e-13&&Math.abs(im/(m*n))<1e-13);
    }
  }
});
test('exterior-power generating polynomial divides by one trivial factor for every cycle type up to S6',()=>{
  assert.ok(repChapter4b.items.find(i=>i.num==='4.8').statement.includes('\\frac{\\prod_'));
  for(let n=2;n<=6;n++){
    const {G,types}=symData(n),mats=stdMats(G);
    for(let i=0;i<types.length;i++){
      const coeff=extChars(types[i]);assert.equal(coeff.length,n);
      for(let k=0;k<n;k++)assert.ok(Math.abs(coeff[k]-extTrace(mats[G.classes[i].rep].map(r=>r.map(z=>z[0])),k))<1e-10);
    }
    const atIdentity=extChars(Array(n).fill(1));let bin=1;for(let k=0;k<n;k++){assert.equal(atIdentity[k],bin);bin=bin*(n-1-k)/(k+1);}
  }
});

import {moleculeData,atomPerm,displacementChars,pgDecompose,projectDisp,rigidBasis,vibrationalDisp,selectionSample,selectionValues,C2V,C3V,m3v} from '../content/rep/ch04.shared.js';
test('molecular geometries reproduce source internal coordinates and symmetry characters',()=>{
  const dot=(a,b)=>a.reduce((s,x,j)=>s+x*b[j],0);
  for(const key of ['H2O','NH3']){
    const mol=moleculeData(key),ch=displacementChars(mol),origin=mol.atoms[0].p,arms=mol.atoms.slice(1).map(a=>a.p.map((x,j)=>x-origin[j]));
    arms.forEach(a=>assert.ok(Math.abs(Math.hypot(...a)-(key==='H2O'?.958:1.012))<1e-12));
    const angle=Math.acos(dot(arms[0],arms[1])/Math.hypot(...arms[0])/Math.hypot(...arms[1]))*180/Math.PI;
    assert.ok(Math.abs(angle-(key==='H2O'?104.4776:106.67))<1e-10);
    assert.deepEqual(ch.fixed,key==='H2O'?[3,1,3,1]:[4,1,2]);
    assert.deepEqual(ch.disp.map(Math.round),key==='H2O'?[9,-1,3,1]:[12,0,2]);
    const vib=ch.disp.map((x,j)=>x-ch.trans[j]-ch.rot[j]);
    assert.deepEqual(pgDecompose(mol.P,vib).map(x=>Math.round(x)+0),key==='H2O'?[2,0,1,0]:[2,0,2]);
    for(const op of mol.P.ops){const p=atomPerm(mol,op.M);assert.equal(new Set(p).size,mol.atoms.length);p.forEach((j,i)=>assert.equal(mol.atoms[j].mass,mol.atoms[i].mass));}
  }
});
test('vibrational projection removes all rigid motions, has the correct character and commutes with symmetry',()=>{
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],close=(a,b)=>a.flat().forEach((x,i)=>assert.ok(Math.abs(x-b.flat()[i])<3e-11));
 for(const key of ['H2O','NH3']){
  const mol=moleculeData(key),N=mol.atoms.length,D=3*N,weights=mol.atoms.map(a=>a.mass),mass=weights.reduce((s,x)=>s+x,0),com=[0,1,2].map(j=>mol.atoms.reduce((s,a,i)=>s+weights[i]*a.p[j],0)/mass);
  assert.equal(rigidBasis(mol).length,6);
  const action=(M,u)=>{const p=atomPerm(mol,M),out=Array(N);u.forEach((x,i)=>out[p[i]]=m3v(M,x));return out;};
  const cols=Array.from({length:D},(_,i)=>vibrationalDisp(mol,Array.from({length:N},(_,a)=>[0,1,2].map(j=>+(3*a+j===i)))));
  assert.ok(Math.abs(cols.reduce((s,c,i)=>s+c.flat()[i],0)-(D-6))<1e-11);
  const ch=displacementChars(mol);
  for(let i=0;i<mol.P.classes.length;i++){
   const op=mol.P.ops.find(o=>o.cls===i),tr=cols.reduce((s,c,j)=>s+action(op.M,c).flat()[j],0);
   assert.ok(Math.abs(tr-(ch.disp[i]-ch.trans[i]-ch.rot[i]))<1e-11);
  }
  for(let seed=0;seed<25;seed++){
   const r=VMath.rng(seed+1),u=mol.atoms.map(()=>[r.normal(),r.normal(),r.normal()]),vib=vibrationalDisp(mol,u);
   close(vibrationalDisp(mol,vib),vib);
   const lin=[0,0,0],angular=[0,0,0];vib.forEach((v,i)=>{const a=cross(mol.atoms[i].p.map((x,j)=>x-com[j]),v);for(let j=0;j<3;j++){lin[j]+=weights[i]*v[j];angular[j]+=weights[i]*a[j];}});
   assert.ok(Math.hypot(...lin,...angular)<2e-12);
   for(const op of mol.P.ops)close(action(op.M,vib),vibrationalDisp(mol,action(op.M,u)));
   const pieces=mol.P.irreps.map(ir=>projectDisp(mol,ir,vib));
   close(vib,mol.atoms.map((_,i)=>[0,1,2].map(j=>pieces.reduce((s,p)=>s+p[i][j],0))));
   for(let j=0;j<pieces.length;j++){const ir=mol.P.irreps[j];close(projectDisp(mol,ir,pieces[j]),pieces[j]);if((key==='H2O'&&[1,3].includes(j))||(key==='NH3'&&j===1))assert.ok(Math.hypot(...pieces[j].flat())<2e-12);}
  }
  for(const e of [[1,0,0],[0,1,0],[0,0,1]]){
   assert.ok(Math.hypot(...vibrationalDisp(mol,mol.atoms.map(()=>e)).flat())<1e-12);
   assert.ok(Math.hypot(...vibrationalDisp(mol,mol.atoms.map(a=>cross(e,a.p.map((x,j)=>x-com[j])))).flat())<1e-12);
  }
 }
});
test('selection rules match independent point-group product tables and all forbidden discrete sums vanish',()=>{
 for(const P of [C2V,C3V])for(let seed=1;seed<=30;seed++){
  const sample=selectionSample(P,VMath.rng(seed));
  for(const key of ['z','x','y','xy','r2']){
   const c=selectionValues(sample,key),t=P===C2V?({z:0,x:2,y:3,xy:1,r2:0}[key]):(['z','r2'].includes(key)?0:2);
   assert.deepEqual(c.tv,P.irreps.map((_,i)=>i===t));
   for(let i=0;i<c.n;i++)for(let f=0;f<c.n;f++){
    const expected=P===C2V?(i^t)===f:t===0?i===f:i===2||f===2;
    assert.equal(c.allowed[i][f],expected);assert.ok(c.num[i][f]>=0&&c.num[i][f]<=1+1e-12);
    if(!expected)assert.ok(c.num[i][f]<2e-12,`${P.name} ${key} ${i}->${f}`);
   }
  }
 }
});

import {groupDeterminantData} from '../content/rep/ch03.shared.js';
test('group determinants and irreducible factors match exact BigInt elimination and independent Newton identities',()=>{
 const determinant=A=>{
  const a=A.map(r=>r.map(BigInt)),n=a.length;let den=1n,sign=1n;
  for(let k=0;k<n-1;k++){
   const p=a.findIndex((r,i)=>i>=k&&r[k]!==0n);if(p<0)return 0n;
   if(p!==k){[a[k],a[p]]=[a[p],a[k]];sign=-sign;}
   const pivot=a[k][k];for(let i=k+1;i<n;i++)for(let j=k+1;j<n;j++){const numerator=a[i][j]*pivot-a[i][k]*a[k][j];assert.equal(numerator%den,0n);a[i][j]=numerator/den;}
   for(let i=k+1;i<n;i++)a[i][k]=0n;den=pivot;
  }
  return sign*a[n-1][n-1];
 };
 for(const key of ['Z4','S3','D4','Q8','A4']){
  const {G,rows}=tableOf(key),r=VMath.rng(982),cases=[Array(G.n).fill(0),Array(G.n).fill(1),...Array.from({length:G.n},(_,g)=>Array.from({length:G.n},(_,h)=>+(h===g)))];
  for(let s=0;s<20;s++)cases.push(Array.from({length:G.n},()=>Math.floor(r.uniform(-2,3))));
  for(const x of cases){
   const data=groupDeterminantData(key,x),exact=Number(determinant(G.mul.map((_,g)=>G.mul.map((_,h)=>x[G.mul[g][G.inv[h]]]))));
   const scale=Math.max(1,Math.abs(exact));assert.ok(cabs(csub(data.direct,[exact,0]))<2e-11*scale);assert.ok(cabs(csub(data.prod,[exact,0]))<2e-11*scale,`${key} ${x} ${data.prod} != ${exact}`);
   rows.forEach((row,i)=>{
    const t1=x.reduce((s,a,g)=>s+a*row.vals[G.cls[g]][0],0);
    if(row.d===1){let re=0,im=0;x.forEach((a,g)=>{re+=a*row.vals[G.cls[g]][0];im+=a*row.vals[G.cls[g]][1];});assert.ok(cabs(csub(data.phis[i],[re,im]))<1e-10);return;}
    let t2=0,t3=0;for(let g=0;g<G.n;g++)for(let h=0;h<G.n;h++){t2+=x[g]*x[h]*row.vals[G.cls[G.mul[g][h]]][0];if(row.d===3)for(let k=0;k<G.n;k++)t3+=x[g]*x[h]*x[k]*row.vals[G.cls[G.mul[G.mul[g][h]][k]]][0];}
    const phi=row.d===2?(t1*t1-t2)/2:(t1**3-3*t1*t2+2*t3)/6;assert.ok(cabs(csub(data.phis[i],[phi,0]))<1e-9*Math.max(1,Math.abs(phi)));
   });
   data.tab.forEach((row,i)=>row.forEach((z,j)=>assert.ok(cabs(csub(z,rows[i].vals[j]))<5e-9)));
   assert.ok(data.defect<2e-8);
  }
 }
});

import {greedyCover,randIntervals,coveredBy,cantorAvoid,stereographicSphere,cantorLevel,snapCantor,cantorSplit} from '../content/top/ch04.shared.js';
test('open-interval subcovers respect endpoints and agree with exhaustive minimal subfamilies',()=>{
 const full=ints=>{const ends=[0,1,...ints.flat().filter(x=>x>=0&&x<=1)].sort((a,b)=>a-b),probes=[...ends,...ends.slice(1).map((b,i)=>(ends[i]+b)/2)];return probes.every(x=>ints.some(([a,b])=>a<x&&x<b));};
 for(const ints of [[[-1,0],[0,2]],[[-1,1]],[[0,2]],[[-1,.5],[.5,2]],[[-1,.6],[.4,2]]])assert.equal(greedyCover(ints,0,1).ok,full(ints));
 const r=VMath.rng(520),ends=[-.5,0,.25,.5,.75,1,1.5];
 for(let trial=0;trial<500;trial++){
  const ints=Array.from({length:8},()=>{const a=Math.floor(r()*6),b=a+1+Math.floor(r()*(6-a));return[ends[a],ends[b]];});
  let min=Infinity;for(let mask=0;mask<256;mask++){const sel=ints.filter((_,i)=>mask&(1<<i));if(sel.length<min&&full(sel))min=sel.length;}
  const actual=greedyCover(ints,0,1);assert.equal(actual.ok,min<Infinity);if(actual.ok){assert.equal(actual.chosen.length,min);assert.ok(full(actual.chosen.map(i=>ints[i])));}else assert.equal(coveredBy(ints,actual.stuck),false);
 }
 for(let n=8;n<=60;n++)for(let seed=1;seed<=5;seed++){const ints=randIntervals(VMath.rng(seed),n,.56/n,Math.max(.56/n+.01,.04));assert.equal(ints.length,n+1);assert.ok(full(ints));assert.ok(greedyCover(ints,0,1).ok);}
 // The extra interval at zero must overlap strictly, not merely meet the last open interval.
 for(let n=2;n<=40;n++){const ints=Array.from({length:n},(_,i)=>[1/(i+1),2]);assert.equal(greedyCover([...ints,[-.5,1/n]],0,1).ok,false);assert.equal(greedyCover([...ints,[-.5,1/n+.0001]],0,1).ok,true);}
});
test('Cantor cuts separate every pair of selectable endpoints and the avoiding construction stays in the set',()=>{
 const endpoints=[...new Set(cantorLevel(6).flat())].sort((a,b)=>a-b);
 for(let i=0;i<endpoints.length;i++)for(let j=i+1;j<endpoints.length;j++){const a=endpoints[i],b=endpoints[j],c=cantorSplit(a,b);assert.ok(c);assert.ok(a<=c.g0+1e-12&&c.g1<=b+1e-12);assert.ok(c.level<=7);}
 for(let i=0;i<=1000;i++){const x=snapCantor(i/1000,6);assert.ok(endpoints.includes(x));}
 for(let seed=0;seed<40;seed++){
  const r=VMath.rng(seed+1),xs=seed===0?endpoints.slice(0,14):Array.from({length:14},()=>{let x=0;for(let j=1;j<=28;j++)x+=(r()<.5?0:2)/3**j;return x;});
  for(let n=1;n<=14;n++){
   const c=cantorAvoid(xs,n);assert.ok(Math.abs(c.hi-c.lo-3**-n)<1e-15);assert.equal(c.candidate,c.lo);
   assert.ok(Math.abs(c.bits.reduce((s,b,j)=>s+b/3**(j+1),0)-c.candidate)<1e-15);
   xs.slice(0,n).forEach(x=>assert.ok(x<c.lo-1e-12||x>c.hi+1e-12));
   const last=c.steps[n-1];assert.ok(c.lo>=last.lo&&c.hi<=last.hi);
  }
 }
});
test('stereographic compactification preserves the sphere, inverse coordinates and both sequence limits',()=>{
 for(let n=1;n<=40;n++)for(const outward of [true,false]){
  const radius=outward?n/4:3/n,x=radius*Math.cos(n),y=radius*Math.sin(n),p=stereographicSphere(x,y);
  assert.ok(Math.abs(Math.hypot(...p)-1)<1e-14);assert.ok(Math.abs(p[0]/(1-p[2])-x)<1e-12);assert.ok(Math.abs(p[1]/(1-p[2])-y)<1e-12);
  const chord=Math.hypot(p[0],p[1],p[2]-1);assert.ok(Math.abs(chord-2/Math.sqrt(1+radius**2))<1e-14);
  for(const R of [.5,1.5,4]){const edge=(R*R-1)/(R*R+1);if(Math.abs(radius-R)>1e-12)assert.equal(p[2]>edge,radius>R);}
  if(n>1){const previous=outward?(n-1)/4:3/(n-1);assert.equal(chord<2/Math.sqrt(1+previous**2),outward);}
 }
 assert.deepEqual(stereographicSphere(0,0),[0,0,-1]);
});

import {discFunctions,discSampleExtrema,waveMaximum,continuityLocalRadius,continuityUniformRadius} from '../content/top/ch04.shared.js';
const topologyFunctions=JSON.parse(readFileSync(new URL('../docs/verification/topology-function-references.json',import.meta.url)));
test('extreme-value examples distinguish interior attainment from boundary-only extrema',()=>{
 const ref=topologyFunctions.wave_maximum,actual=waveMaximum();
 [ref.value,ref.x,ref.y].forEach((x,i)=>assert.ok(Math.abs(actual[i]-Number(x))<2e-15));
 const [,x,y]=actual;assert.ok(x*x+y*y<1);assert.ok(actual[0]>2);
 assert.ok(Math.hypot(2.5*Math.cos(2.5*x)+.4*y,-2*Math.sin(2*y)+.4*x)<2e-15);
 // Analytic global certificate: every possible maximizer above 2 is in the central rectangle.
 const upper=[1.2,1+Math.cos(.9)+.2,1+Math.sin(.875)+.18,1+Math.sin(2.25)+.18];upper.forEach(u=>assert.ok(u<2));
 const xx=6.25*Math.min(Math.sin(.875),Math.sin(2.25)),yy=4*Math.cos(.9);assert.ok(xx>0&&yy>0&&xx*yy>.4**2); // negative-definite Hessian throughout that rectangle
 assert.ok(Number(ref.boundary_upper)<2);
 // No interior local minimum: either f_yy<0 or the y derivative cannot vanish.
 assert.ok(2*Math.sin(2)>.4);
 for(let N=4;N<=120;N++)for(const closed of [false,true]){
  const plane=discSampleExtrema('plane',N,closed),bound=Math.sqrt(1.36)*(closed?1:1-1/N);
  assert.ok(plane.best[0]<=bound+1e-12&&plane.low[0]>=-bound-1e-12);
  const wave=discSampleExtrema('wave',N,closed);assert.ok(wave.best[0]<=actual[0]+1e-12);
  for(const q of [plane.best,plane.low,wave.best,wave.low])assert.ok(Math.hypot(q[1],q[2])<=(closed?1:1-1/N)+1e-12);
 }
});
test('local and uniform continuity radii agree with 80-digit independent monotone bisections',()=>{
 for(const ref of topologyFunctions.radii){
  const a=Number(ref.a),e=Number(ref.epsilon),expected=Number(ref.delta),actual=ref.key==='uniform-inv'?continuityUniformRadius('inv',e,a):continuityLocalRadius(ref.key,Number(ref.x),e,a);
  assert.ok(Math.abs(actual-expected)<1e-10*expected+2e-15,JSON.stringify({ref,actual}));
 }
});
test('continuity neighborhoods satisfy their guarantees and the inverse uniform radius is sharp when uncapped',()=>{
 const random=VMath.rng(9932);
 for(const key of ['sin','inv'])for(const a of (key==='sin'?[0]:[.005,.02,.2,.5]))for(const e of [.05,.4,1.5]){
  const lo=key==='sin'?0:a,hi=key==='sin'?2:1,f=key==='sin'?x=>Math.sin(3*x*x):x=>1/x,delta=continuityUniformRadius(key,e,a);
  for(let k=0;k<250;k++){
   const x=lo+(hi-lo)*random(),local=continuityLocalRadius(key,x,e,a);assert.ok(local>=delta-1e-12);
   for(const d of [delta,local])for(const sign of [-1,1]){const y=Math.max(lo,Math.min(hi,x+sign*.999*d));assert.ok(Math.abs(f(x)-f(y))<e+1e-12,`${key} ${a} ${e} ${x} ${y} ${d}`);}
  }
  if(key==='inv'&&e<1/a-1){const d=delta*1.0001;if(d<hi-lo)assert.ok(f(a)-f(a+d)>e);}
 }
 for(let n=1;n<=1000;n++)assert.ok(Math.abs((1/(1/n)-1/(1/(n+1)))-(-1))<1e-12);
});

import {lebesgueDiscs,ambientClearance,compactCoverMinimum,punctureCoverConstant,compactnessExamples,compactnessArrows,finiteBisection} from '../content/top/ch04.shared.js';
test('analytic seven-disc clearance minima are attained witnesses and bound the whole displayed cover',()=>{
 for(let i=0;i<=45;i++){
  const scale=.95+i*.01,discs=lebesgueDiscs(true,scale),global=compactCoverMinimum(scale);
  assert.equal(discs.length,7);assert.ok(global.value>0);
  assert.ok(Math.abs(ambientClearance(discs,...global.point).value-global.value)<2e-15);
  assert.ok(Math.abs(global.value-(.55*scale-Math.sqrt(1.64-1.6*Math.cos(Math.PI/6))))<2e-15);
  for(let ir=0;ir<=50;ir++)for(let ia=0;ia<72;ia++){
   const r=ir/50,t=2*Math.PI*ia/72,margin=ambientClearance(discs,r*Math.cos(t),r*Math.sin(t)).value;
   assert.ok(margin>=global.value-2e-15);
   const min=compactCoverMinimum(scale,r);assert.ok(min.value>=global.value-1e-15);assert.ok(Math.hypot(...min.point)>=r-1e-15);assert.ok(Math.abs(ambientClearance(discs,...min.point).value-min.value)<2e-15);
  }
 }
});
test('punctured-disc rings cover every annulus with the analytic margin and defeat shrinking two-point sets',()=>{
 assert.ok(punctureCoverConstant>0&&punctureCoverConstant<.4);
 const random=VMath.rng(8234);
 for(let J=2;J<=9;J++){
  const discs=lebesgueDiscs(false,1,J),rmin=2**-(J+1);assert.equal(discs.length,14*(J+1));
  for(let i=0;i<1000;i++){
   const r=i===0?rmin:i===1?1:rmin*Math.pow(1/rmin,random()),angle=2*Math.PI*random(),margin=ambientClearance(discs,r*Math.cos(angle),r*Math.sin(angle)).value;
   assert.ok(margin>=punctureCoverConstant*r-2e-15);assert.ok(margin>=punctureCoverConstant*rmin-2e-15);
  }
  if(J<9)assert.equal(punctureCoverConstant*2**-(J+2),punctureCoverConstant*rmin/2);
 }
 assert.ok((.75+.4)/(.75-.4)<4);
 for(let n=1;n<=30;n++)for(let k=0;k<14;k++){
  const radius=2**-(n+3),angle=2*Math.PI*k/14,p=[radius*Math.cos(angle),radius*Math.sin(angle)],q=p.map(x=>4*x),discs=lebesgueDiscs(false,1,n+6);
  assert.ok(ambientClearance(discs,...p).value>0&&ambientClearance(discs,...q).value>0);
  assert.ok(!discs.some(([x,y,r])=>Math.hypot(p[0]-x,p[1]-y)<r&&Math.hypot(q[0]-x,q[1]-y)<r));
  // Every omitted ring is too small even to contain p.
  assert.ok(1.15*2**-(n+7)<radius);
 }
});
test('compactness examples witness every nonuniversal arrow and finite previews do not certify limits',()=>{
 assert.deepEqual(Object.keys(compactnessExamples),['I','O','R','N','B','W','P']);assert.equal(compactnessArrows.length,6);
 for(const [from,to,always] of compactnessArrows){
  const prop={C:'c',LP:'l',S:'q'};
  const witnesses=Object.values(compactnessExamples).filter(e=>e[prop[from]]&&!e[prop[to]]);
  if(always)assert.equal(witnesses.length,0);else assert.ok(witnesses.length>0,`${from}->${to}`);
 }
 for(const e of Object.values(compactnessExamples).filter(e=>e.m))assert.equal(e.c===e.l&&e.l===e.q,true);
 // In an indiscrete pair the mate is a limit point even of a singleton.
 const fibres=Array.from({length:5},(_,n)=>[2*n,2*n+1]);for(let x=0;x<10;x++){const mate=x^1;assert.ok(fibres.find(f=>f.includes(mate)).some(y=>y===x&&y!==mate));}
 for(const values of [Array.from({length:300},(_,i)=>1/(i+1)),Array.from({length:300},(_,i)=>1/(i+2)),Array.from({length:300},(_,i)=>(1+Math.sin(i+1))/2),Array.from({length:400},(_,i)=>i+1)]){
  for(let depth=0;depth<=12;depth++){
   const out=finiteBisection(values,depth,values[0]===1&&values.at(-1)===400?[0,512]:[0,1]);
   assert.equal(out.wins.length,depth+1);assert.deepEqual(out.I,values.map((_,i)=>i+1).filter(i=>values[i-1]>=out.a&&values[i-1]<=out.b));
   for(let i=1;i<out.wins.length;i++){assert.ok(out.wins[i][0]>=out.wins[i-1][0]&&out.wins[i][1]<=out.wins[i-1][1]);}
  }
 }
 const prefix=finiteBisection(Array.from({length:300},(_,i)=>1/(i+1)),12);
 assert.ok(prefix.a>0); // actual sequence still converges to 0; the finite majority's window does not prove that limit.
 // Finite prefix of the product-space diagonal witness: any selected coordinates can alternate.
 for(const selected of [[1,3,5,7],[2,7,13,19],[5,6,28,40]]){
  const digits=Array(40).fill(0);selected.forEach((n,k)=>digits[n-1]=k%2);
  assert.deepEqual(selected.map(n=>digits[n-1]),[0,1,0,1]);
 }
});

const manifolds3=await import('../content/mfd/ch03.shared.js');
const manifolds4=await import('../content/mfd/ch04.shared.js');
test('tilted torus has four nondegenerate height critical points at every positive supported tilt',()=>{
 const {torusHeightData}=manifolds3;
 assert.equal(torusHeightData(0).degenerate,true);
 for(const tau of [...Array.from({length:90},(_,i)=>(i+1)*Math.PI/180),Math.asin(.4)]){
  const {h,critical,degenerate}=torusHeightData(tau),s=Math.sin(tau),c=Math.cos(tau);
  assert.equal(degenerate,false);assert.equal(critical.length,4);assert.deepEqual(critical.map(p=>p.idx),[0,1,1,2]);
  const values=[-1.25*s-.5,1.25*s-.5,-1.25*s+.5,1.25*s+.5].sort((a,b)=>a-b);
  critical.forEach((p,i)=>{
   assert.ok(Math.abs(p.val-values[i])<1e-14);
   const ga=-s*(1.25+.5*Math.cos(p.b))*Math.sin(p.a),gb=.5*(-s*Math.cos(p.a)*Math.sin(p.b)+c*Math.cos(p.b));
   assert.ok(Math.hypot(ga,gb)<1e-14);assert.ok(p.l.every(x=>Math.abs(x)>1e-3));
   for(const rho of [.06,.2,.6,1.2])for(let j=0;j<24;j++){
    const x=rho*Math.cos(j*Math.PI/12),y=rho*Math.sin(j*Math.PI/12),q=.5*(p.H[0][0]*x*x+p.H[1][1]*y*y);
    // Third directional derivative is bounded by 5 on unit directions over this entire torus.
    assert.ok(Math.abs(h(p.a+x,p.b+y)-p.val-q)<=5*rho**3/6+1e-14);
   }
  });assert.equal(critical.reduce((n,p)=>n+(-1)**p.idx,0),0);
 }
});
test('all displayed planar brackets agree with analytic fields and the operator product rule',()=>{
 const {PAIRS,bracket2}=manifolds4;
 for(const [key,P] of Object.entries(PAIRS))for(let i=-19;i<=19;i+=2)for(let j=-19;j<=19;j+=2){
  const x=i/10,y=j/10,u=P.X(x,y),v=P.Y(x,y),br=bracket2(P.X,P.Y,x,y),expected=key==='nonlin'?[-Math.sin(x),y*Math.cos(x)]:key==='rottr'?[0,-1]:key==='shear'?[0,1]:[0,0];
  expected.forEach((z,k)=>assert.ok(Math.abs(z-br[k])<1e-8));
  // Analytic gradient and Hessian of f=sin x+y²/2+.3xy; mixed second terms cancel.
  const g=[Math.cos(x)+.3*y,y+.3*x],H=[[-Math.sin(x),.3],[.3,1]],h=1e-3;
  const directional=(F,w)=>[0,1].map(k=>w[0]*(F(x+h,y)[k]-F(x-h,y)[k])/(2*h)+w[1]*(F(x,y+h)[k]-F(x,y-h)[k])/(2*h));
  const dv=directional(P.Y,u),du=directional(P.X,v),xy=dv[0]*g[0]+dv[1]*g[1]+u.reduce((a,z,k)=>a+z*(H[k][0]*v[0]+H[k][1]*v[1]),0),yx=du[0]*g[0]+du[1]*g[1]+v.reduce((a,z,k)=>a+z*(H[k][0]*u[0]+H[k][1]*u[1]),0);
  assert.ok(Math.abs(xy-yx-expected[0]*g[0]-expected[1]*g[1])<1e-6);
 }
});
// Independent fourth-order Hamiltonian splitting; no production flow or RK coefficients.
function referenceWave(p,t,N){
 let [x,y]=p,D=[[1,0],[0,1]];const z=2**(1/3),a=1/(2-z),b=-z/(2-z);
 const horizontal=h=>{const g=.6*Math.cos(y)*h;x+=.6*Math.sin(y)*h;D[0]=D[0].map((v,i)=>v+g*D[1][i]);};
 const vertical=h=>{const g=-.6*Math.sin(x)*h;y+=.6*Math.cos(x)*h;D[1]=D[1].map((v,i)=>v+g*D[0][i]);};
 for(let n=0;n<N;n++)for(const w of [a,b,a]){const h=t*w/N;horizontal(h/2);vertical(h);horizontal(h/2);}
 return {q:[x,y],D};
}
test('Lie flows and differentials match independent matrix and Hamiltonian splitting references',()=>{
 const {lieFlow}=manifolds4;
 for(const p of [[0,0],[.9,.6],[-2.8,2.8],[2.4,-1.2]])for(const t of [-1.2,-.2,0,.01,.2,1.2])for(const key of ['rot','dil','shear','wave']){
  let ref;
  if(key==='wave'){
   ref=referenceWave(p,t,512);const coarse=referenceWave(p,t,256);ref.q.forEach((x,i)=>assert.ok(Math.abs(x-coarse.q[i])<2e-11));ref.D.flat().forEach((x,i)=>assert.ok(Math.abs(x-coarse.D.flat()[i])<3e-11));
  }else{
   const c=Math.cos(t),s=Math.sin(t),a=Math.exp(t/2),D=key==='rot'?[[c,-s],[s,c]]:key==='dil'?[[a,0],[0,a]]:[[1,t],[0,1]];
   ref={q:D.map(r=>r[0]*p[0]+r[1]*p[1]),D};
  }
  const got=lieFlow(key,p,t);got.q.forEach((x,i)=>assert.ok(Math.abs(x-ref.q[i])<2e-10));got.D.flat().forEach((x,i)=>assert.ok(Math.abs(x-ref.D.flat()[i])<3e-10));
  const [[a,b],[c,d]]=got.D;assert.ok(Math.abs(a*d-b*c-(key==='dil'?Math.exp(t):1))<2e-11);
 }
});
test('Lie quotients have the correct zero-time limit, metric formulas and inverse-flow transport',()=>{
 const {lieQuotient,lieExact,lieFlow,liePullback,lieVector,LIE_FIELDS,bracket2}=manifolds4;
 for(const p of [[.9,.6],[-1.2,2.4]])for(const angle of [0,.6,Math.PI/2,Math.PI]){
  const w=[Math.cos(angle),Math.sin(angle)];
  for(const key of Object.keys(LIE_FIELDS))for(const kind of ['f','Y','g']){
   const exact=lieExact(key,kind,p,w);assert.deepEqual(lieQuotient(key,kind,p,0,w),exact);
   const err=t=>{const z=lieQuotient(key,kind,p,t,w);return Array.isArray(z)?Math.hypot(...z.map((x,i)=>x-exact[i])):Math.abs(z-exact);};
   assert.ok(err(.001)<.01);assert.ok(err(.01)<=.6*err(.02)+1e-10);
   for(const t of [-1.2,-.01,.01,1.2]){
    const z=lieQuotient(key,kind,p,t,w);assert.ok((Array.isArray(z)?z:[z]).every(Number.isFinite));
    if(kind==='g'&&key==='rot')assert.equal(z,0);
    if(kind==='g'&&key==='dil')assert.ok(Math.abs(z-Math.expm1(t)/t)<1e-15);
    if(kind==='g'&&key==='shear')assert.ok(Math.abs(z-(2*w[0]*w[1]+t*w[1]**2))<1e-15);
   }
  }
  for(const key of Object.keys(LIE_FIELDS)){
   const b=bracket2(LIE_FIELDS[key].f,lieVector,...p),e=lieExact(key,'Y',p);b.forEach((x,i)=>assert.ok(Math.abs(x-e[i])<1e-8));
   for(const t of [-1.2,.2,1.2]){const {q}=lieFlow(key,p,t),inv=lieFlow(key,q,-t).D,v=lieVector(...q),ref=inv.map(r=>r[0]*v[0]+r[1]*v[1]),pb=liePullback(key,p,t);pb.forEach((x,i)=>assert.ok(Math.abs(x-ref[i])<5e-10));}
  }
 }
});

const knots=await import('../content/dg/ch03.shared.js');
test('analytic knot-family curvature agrees with independent 80-digit radial-coordinate quadrature',()=>{
 const ref=JSON.parse(readFileSync(new URL('../docs/verification/knot-curvature-references.json',import.meta.url),'utf8'));
 assert.equal(ref.rows.length,15);
 for(const r of ref.rows){const value=knots.knotTotalCurvature(r.kind,Number(r.epsilon));assert.ok(Math.abs(value-Number(r.totalCurvature))<2e-10,JSON.stringify({r,value}));}
 for(const kind of ['tre','unk','wrinkle'])for(let j=0;j<=316;j++){
  const e=.02+.005*j,K=knots.knotTotalCurvature(kind,e),finer=knots.knotTotalCurvature(kind,e,2880);
  assert.ok(Math.abs(K-finer)<2e-10,`${kind}, ${e}: quadrature convergence`);
  if(kind==='tre')assert.ok(K>4*Math.PI);else assert.ok(K>2*Math.PI);
 }
 assert.ok(knots.knotTotalCurvature('wrinkle',.6)>4*Math.PI);
});
test('knot families have exact shadow crossings, regularity and the claimed flat limits',()=>{
 const {knotCurveData,knotTotalCurvature}=knots;
 for(const e of [.02,.6,1.6])for(let i=0;i<360;i++){
  const t=2*Math.PI*i/360,r=1.3+.3*Math.cos(3*t),q=knotCurveData('tre',e,t);
  const original=[r*Math.cos(2*t),r*Math.sin(2*t),e*Math.sin(3*t)];original.forEach((x,j)=>assert.ok(Math.abs(x-q.p[j])<3e-15));
  assert.ok(Math.hypot(...q.d1)>=2-1e-12);
 }
 for(const e of [.02,.6,1.6])for(let j=0;j<3;j++){
  const t=Math.PI/6+j*Math.PI/3,a=knotCurveData('tre',e,t).p,b=knotCurveData('tre',e,t+Math.PI).p;
  assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<3e-15);assert.ok(Math.abs(Math.abs(a[2]-b[2])-2*e)<1e-15);
 }
 // At e=0 the positive signed planar curvature has tangent turning number two.
 for(let i=0;i<=100;i++){const c=-1+2*i/100;assert.ok(8.38+6.63*c-.45*c*c>=1.3-1e-14);}
 assert.ok(Math.abs(knotTotalCurvature('tre',0)-4*Math.PI)<1e-12);
 for(const k of ['unk','wrinkle'])assert.ok(Math.abs(knotTotalCurvature(k,0)-2*Math.PI)<1e-12);
});

const dg4=await import('../content/dg/ch04.shared.js');
test('quadric classification includes every rank/sign/linear case and shifted degeneracy',()=>{
 const {classifyQuadric}=dg4;
 const cases=[
 [[1,1,1],0,1,'ellipsoid'],[[1,1,-1],0,1,'hyperboloid of one sheet'],[[1,-1,-1],0,1,'hyperboloid of two sheets'],
 [[1,1,0],1,0,'elliptic paraboloid'],[[1,-1,0],1,0,'hyperbolic paraboloid'],[[1,0,0],1,0,'parabolic cylinder'],
 [[1,1,0],0,1,'elliptic cylinder'],[[1,-1,0],0,1,'hyperbolic cylinder'],[[1,1,-1],0,0,'cone'],
 [[1,1,1],0,0,'a single point'],[[1,1,0],0,0,'a line'],[[1,-1,0],0,0,'two crossing planes'],[[1,0,0],0,0,'a plane (double)'],
 [[1,0,0],0,1,'two parallel planes'],[[1,1,1],0,-1,'empty set'],[[1,1,0],0,-1,'empty set'],[[1,0,0],0,-1,'empty set'],
 [[0,0,0],1,1,'plane'],[[0,0,0],0,0,'all of space'],[[0,0,0],0,1,'empty set'],
 [[1,1,-1],1,1,'cone'],[[0,0,1],1,-1,'a plane (double)'],[[1,0,1],1,-1,'a line'],[[1,1,1],1,-1,'a single point'],
 ];
 for(const [L,e,k,name] of cases)assert.equal(classifyQuadric(L,e,k).name,name);
 for(const L of [[-1,-1,-1],[-1,-1,0],[-1,0,0],[1,-1,0],[0,1,0],[0,0,-1]])for(const e of [0,.2,1.2])for(const k of [-1,0,1]){
  const c=classifyQuadric(L,e,k),q=p=>p.reduce((v,x,i)=>v+L[i]*x*x,0)+2*e*p[2]-k;
  if(c.mode==='point')assert.ok(Math.abs(q(c.center))<1e-12);
  if(c.mode==='line'){const i=L.findIndex(x=>x===0);for(const t of [-3,0,2]){const p=c.center.slice();p[i]+=t;assert.ok(Math.abs(q(p))<1e-12);}}
  for(const {n,d} of c.planes){const poly=dg4.planeInBox(n,d,8);assert.ok(poly.length>=3);for(const p of poly){assert.ok(Math.abs(q(p))<1e-10);assert.ok(Math.abs(p.reduce((v,x,i)=>v+x*n[i],0)-d)<1e-12);}}
 }
 // Empty clipped geometry does not imply an empty full solution set.
 assert.deepEqual(dg4.planeInBox([0,0,1],5),[]);assert.deepEqual(dg4.lineInBox([0,0,5],[1,0,0]),[]);
});
test('analytic embedded-surface ray roots, normals and transverse parity agree with the level equations',()=>{
 const {surfaceRay,surfaceLevel,surfaceNormal}=dg4;
 for(const key of ['sphere','torus','genus2'])for(let iy=-14;iy<=14;iy++)for(let iz=-10;iz<=10;iz++){
  const Q=[-1.91,iy/10,iz/10],r=surfaceRay(key,Q);
  for(const h of r.hits){assert.ok(Math.abs(surfaceLevel(key,h.p))<1e-10,JSON.stringify({key,h}));assert.ok(Math.abs(Math.hypot(...h.normal)-1)<1e-12);const e=1e-5,a=h.p.map((x,i)=>x+e*h.normal[i]),b=h.p.map((x,i)=>x-e*h.normal[i]);assert.ok(surfaceLevel(key,a)>0&&surfaceLevel(key,b)<0);}
  // Every simple root switches signs; a tangent root does not.
  if(!r.hits.some(h=>h.tangent)){
   assert.equal(r.hits.length%2,0);
   const roots=[Q[0],...r.hits.map(h=>h.p[0]),2];
   for(let i=0;i<roots.length-1;i++){const x=(roots[i]+roots[i+1])/2,v=surfaceRay(key,[x,Q[1],Q[2]]);if(v.location!=='on the surface')assert.equal(v.hits.length%2,v.location==='inside'?1:0,JSON.stringify({key,Q,x,v}));}
  }
 }
 for(const [key,Q] of [['sphere',[-1,0,1]],['torus',[-1.9,0,.55]],['genus2',[-1.9,0,Math.sqrt(.03)]]])assert.ok(surfaceRay(key,Q).hits.some(h=>h.tangent));
 assert.equal(surfaceRay('sphere',[0,0,1]).location,'on the surface');assert.equal(surfaceRay('torus',[0,0,0]).location,'outside');assert.equal(surfaceRay('torus',[1.2,0,0]).location,'inside');
});
test('the double torus is a compact regular level and the Klein immersion has two distinct tangent planes',()=>{
 const {kleinFigureEight:F,dF}=dg4;
 // Critical values of q=x²-x⁴-y² are 0 and 1/4, so F=q²+z² has critical values 0 and 1/16; .03 is regular.
 assert.ok(.03>0&&.03<1/16);
 for(let k=0;k<100;k++){
  const u=2*Math.PI*k/100,a=F(u,0),b=F(u,Math.PI);assert.ok(Math.hypot(...a.map((x,i)=>x-b[i]))<1e-14);assert.ok(Math.abs(Math.hypot(a[0],a[1])-1)<1e-14);
  const A=dF(F,u,0),B=dF(F,u,Math.PI);assert.ok(A.J>.1&&B.J>.1);assert.ok(Math.abs(A.N.reduce((s,x,i)=>s+x*B.N[i],0))<.9);
  // Seam identification (u+2pi,w)=(u,-w) reverses orientation of the abstract parameter charts.
  const p=F(u+2*Math.PI,.7),q=F(u,-.7);assert.ok(Math.hypot(...p.map((x,i)=>x-q[i]))<3e-15);
 }
});

const prob4=await import('../content/prob/ch04-a.shared.js');
test('conditional step averages preserve every coarse-cell event and distinguish nonmeasurable slices',()=>{
 const {gridOf,project,cellMeans,intOver,XF,SNAP}=prob4;
 const partitions=[[0,.25,.5625,.8125,1],[0,1/48,47/48,1],[0,.5,1],[0,1]];
 for(const X of Object.values(XF))for(const cuts of partitions){
  const arr=gridOf(X.f),Y=project(arr,cuts),means=cellMeans(arr,cuts),n=cuts.length-1;
  for(let mask=0;mask<2**n;mask++){
   let ix=0,iy=0,independent=0;
   for(let j=0;j<arr.length;j++)if((mask>>cuts.slice(1).findIndex(x=>(j+.5)/arr.length<x))&1)independent+=arr[j]/arr.length;
   for(let k=0;k<n;k++)if(mask>>k&1){ix+=intOver(arr,cuts[k],cuts[k+1]);iy+=intOver(Y,cuts[k],cuts[k+1]);}
   assert.ok(Math.abs(ix-iy)<2e-14&&Math.abs(ix-independent)<2e-14);
  }
  for(let k=0;k<n;k++)assert.ok(Math.abs(means[k]-Y[Math.round((cuts[k]+cuts[k+1])*arr.length/2)])<1e-14);
 }
 const ramp=gridOf(XF.ramp.f),Y=project(ramp,[0,1]);assert.ok(Math.abs(intOver(ramp,0,1/SNAP)-intOver(Y,0,1/SNAP))>.01);
});
test('Borel band and wedge have width-independent reference laws with exact bin probabilities',()=>{
 const {borelArcMass,borelSelection}=prob4,N=720,K=400,th=new Float64Array(N*K),ph=new Float64Array(N*K);
 for(let i=0;i<N;i++)for(let j=0;j<K;j++){th[i*K+j]=-Math.PI+(i+.5)*2*Math.PI/N;ph[i*K+j]=Math.asin(-1+(j+.5)*2/K);}
 for(const mode of ['eq','mer']){
  assert.ok(Math.abs(borelArcMass(mode,-Math.PI,Math.PI)-1)<1e-15);
  let previous;
  for(const delta of [.03,.12,.6]){
   const s=borelSelection(th,ph,mode,delta);assert.ok(s.values.length>0);assert.ok(s.ymax>Math.max(...s.density));assert.ok(Math.abs(s.density.reduce((a,x)=>a+x*2*Math.PI/40,0)-1)<1e-14);
   if(mode==='eq')assert.ok(s.l1Uniform<1e-14);else assert.ok(s.l1Cosine<.04);
   if(previous)s.density.forEach((x,i)=>assert.ok(Math.abs(x-previous[i])<1e-14));previous=s.density;
  }
 }
 // Reference integral obtained directly from sine endpoints on each quadrant, not midpoint density samples.
 assert.ok(Math.abs(borelArcMass('mer',0,Math.PI/6)-1/8)<1e-15);
 assert.ok(Math.abs(borelArcMass('mer',Math.PI/3,2*Math.PI/3)-(1-Math.sqrt(3)/2)/2)<1e-15);
});
test('Gaussian conditional masses match independent 70-digit integration in the opposite order',()=>{
 const ref=JSON.parse(readFileSync(new URL('../docs/verification/probability-kernel-references.json',import.meta.url))),M=VMath;
 assert.equal(ref.rows.length,16);
 for(const r of ref.rows){const d=prob4.gaussianConditionalKernel(M,...['rho','y','a','b','c'].map(k=>Number(r[k])));
  assert.ok(Math.abs(d.probability-Number(r.conditional))<2e-12,JSON.stringify(r));
  assert.ok(Math.abs(d.joint-Number(r.joint))<2e-8,JSON.stringify({r,joint:d.joint}));
  assert.ok(Math.abs(d.finiteMass-1)<1e-12);assert.ok(d.probability>=0&&d.probability<=1&&d.joint>=0&&d.joint<=1);
 }
});
test('CDF preview repairs only the chosen null slice and keeps finite-grid error visible',()=>{
 const {conditionalCdfPreview}=prob4,cdf=x=>.5*VMath.erfc(-x/Math.SQRT2);
 for(const n of [8,30,80])for(const mean of [-1.5,.3,1.5])for(const epsilon of [0,.1,.25]){
  const F=x=>cdf(x-mean),noise=Array.from({length:n},(_,i)=>i%2?-.3:1),ordinary=conditionalCdfPreview(F,n,epsilon,noise,{exceptional:false}),repaired=conditionalCdfPreview(F,n,epsilon,noise,{exceptional:true,repair:true}),bad=conditionalCdfPreview(F,n,epsilon,noise,{exceptional:true,repair:false});
  assert.deepEqual(ordinary.G,repaired.G);assert.equal(repaired.bad,0);assert.ok(repaired.sampledError>0);assert.ok(repaired.sampledError<=8/(n-1)/Math.sqrt(2*Math.PI)+.007);
  assert.ok(repaired.low>0);assert.equal(repaired.high,1);
  if(epsilon)assert.notDeepEqual(bad.G,ordinary.G);
  for(const p of [ordinary,bad,repaired])for(let i=0;i<p.points.length-1;i++)assert.ok(p.points[i][1]<=p.points[i+1][1]);
  for(const x of [-4,-2,0,2,3.99]){const next=repaired.qs.find(q=>q>x);assert.ok(Math.abs(repaired.evaluate(x)-F(next))<1e-14);}
 }
});
test('Gaussian conditional functionals match independent integration and global signed integrand bounds',()=>{
 for(const key of ['sq','ab','ind','cu'])for(const m of [-2.375,-.5,0,.7,2.375])for(const sd of [Math.sqrt(1-.95**2),.7,1]){
  const q=prob4.gaussianFunctional(VMath,key,m,sd),phi=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),a=key==='ind'?(1-m)/sd:-12;
  // Standardized quadrature with splits at nondifferentiability, independently of closed moment formulas.
  const cut=key==='ab'?-m/sd:null,integrate=(a,b)=>prob4.simpson(z=>q.f(m+sd*z)*phi(z),a,b,20000);
  const value=key==='ind'?prob4.simpson(phi,a,12,20000):cut!==null&&cut>a&&cut<12?integrate(a,cut)+integrate(cut,12):integrate(a,12);
  assert.ok(Math.abs(value-q.moment)<2e-10,JSON.stringify({key,m,sd,value,expected:q.moment}));
  for(let i=0;i<=1000;i++){const x=m-12*sd+24*sd*i/1000,v=q.integrand(x);assert.ok(v>=q.lo-1e-13&&v<=q.hi+1e-13);}
  if(key==='cu')assert.ok(q.lo<0&&q.hi>0);
 }
});
