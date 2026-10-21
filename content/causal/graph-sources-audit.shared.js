// Scoped calculations for the four source-audited causal-graph illustrations.
import { parentsOf, topoOrder, rng, ols } from './ch03.shared.js';
export function binaryFactor(weights, edges) {
  const n = Math.log2(weights.length);
  if (!Number.isInteger(n) || !topoOrder(n, edges)) throw new Error('A binary table and DAG are required');
  const pa = parentsOf(n, edges), F = new Float64Array(weights.length).fill(1);
  for (let i = 0; i < n; i++) {
    const counts = Array.from({length: 1 << pa[i].length}, () => [0, 0]);
    const stratum = c => pa[i].reduce((s, p, j) => s + ((c >> p) & 1) * 2 ** j, 0);
    for (let c = 0; c < weights.length; c++) counts[stratum(c)][(c >> i) & 1] += weights[c];
    for (let c = 0; c < F.length; c++) { const q = counts[stratum(c)], den = q[0] + q[1]; F[c] *= den ? q[(c >> i) & 1] / den : 0.5; }
  }
  return F;
}
export function structuralSample(c, n = 3000, seed = 2024) {
  const r = rng(seed), D = Object.fromEntries(['Z','X','M','Y'].map(k => [k,new Float64Array(n)]));
  for (let i = 0; i < n; i++) { D.Z[i] = r.normal(); D.X[i] = c.a * D.Z[i] + r.normal(); D.M[i] = c.b * D.X[i] + r.normal(); D.Y[i] = c.c * D.M[i] + c.d * D.Z[i] + r.normal(); }
  return D;
}
export function structuralFit(D) {
  const e1 = ols(Array.from(D.Z,z=>[z]), D.X), e2 = ols(Array.from(D.X,x=>[x]),D.M), e3 = ols(Array.from(D.M,(m,i)=>[m,D.Z[i]]),D.Y);
  return [e1[0],e2[0],e3[0],e3[1]];
}
export function noisyOr(pB,pE,sB,sE,leak) {
  const prior = {}, likelihood = {}, un = {}; let Z = 0;
  for (const b of [0,1]) for (const e of [0,1]) { const k = `${b}${e}`; prior[k] = (b ? pB : 1-pB) * (e ? pE : 1-pE); likelihood[k] = 1-(1-leak)*(b ? 1-sB : 1)*(e ? 1-sE : 1); un[k] = prior[k]*likelihood[k]; Z += un[k]; }
  const posterior = Z ? Object.fromEntries(Object.keys(un).map(k=>[k,un[k]/Z])) : null;
  const div = (a,b) => b ? a/b : null;
  return {prior,likelihood,posterior,Z,pr:pB,pA:div(un['10']+un['11'],Z),pAq:div(un['11'],un['01']+un['11']),pAn:div(un['10'],un['00']+un['10'])};
}
export function tableAssociation(P) {
  if (!P) return {OR:null,kind:'undefined'};
  const a=P['11']*P['00'], b=P['10']*P['01'], delta=a-b;
  const scale=Math.max(a,b,Number.MIN_VALUE);
  return {OR:b ? a/b : null,kind:Math.abs(delta)<=1e-12*scale ? 'independent' : delta<0 ? 'negatively dependent' : 'positively dependent'};
}
export function mosaicCells(P) {
  if (!P) return [];
  const cells=[]; let x=0;
  for (const b of [0,1]) { const width=P[`${b}0`]+P[`${b}1`]; let y=0;
    if (width) for (const e of [0,1]) { const p=P[`${b}${e}`], height=p/width; if (height) cells.push({b,e,p,x,y,width,height}); y+=height; }
    x+=width;
  }
  return cells;
}
