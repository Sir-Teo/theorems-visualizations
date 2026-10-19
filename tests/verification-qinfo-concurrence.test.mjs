import assert from 'node:assert/strict';
import test from 'node:test';
import * as M from '../assets/js/viz/math.js';
import { record, near } from './verification-physics-utils.mjs';
import chapter from '../content/qinfo/ch02.js';
import { concurrence, outerV, ptrace, normalize, haarState } from '../content/qinfo/ch02.shared.js';
const v = { M }, mul = ([a,b],[c,d]) => [a*c-b*d,a*d+b*c], sub = (a,b) => a.map((x,i)=>x-b[i]);
const C = rho => concurrence(v, rho);
const sum = terms => terms.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0]);
const prod = (p, indices) => indices.reduce((a,i)=>mul(a,p[i]),[1,0]);
// CKW Eqs. (20)–(22): an independent quartic invariant, with no eigenvalue computation.
function threeTangle(p) {
  const d1 = sum([[0,0,7,7],[1,1,6,6],[2,2,5,5],[4,4,3,3]].map(x=>prod(p,x)));
  const d2 = sum([[0,7,3,4],[0,7,5,2],[0,7,6,1],[3,4,5,2],[3,4,6,1],[5,2,6,1]].map(x=>prod(p,x)));
  const d3 = sum([[0,6,5,3],[7,1,2,4]].map(x=>prod(p,x)));
  return 4*Math.hypot(...sum([d1,d2.map(x=>-2*x),d3.map(x=>4*x)]));
}
function tangles(p) {
  const rho=outerV(p), a=ptrace(rho,3,[0]);
  return { a:4*(a[0][0][0]*a[1][1][0]-Math.hypot(...a[0][1])**2), ab:C(ptrace(rho,3,[0,1]))**2, ac:C(ptrace(rho,3,[0,2]))**2 };
}
test('concurrence distinguishes equally pure product/Bell states and agrees with the independent complex determinant formula',()=>{
  near(C(outerV([[1,0],[0,0],[0,0],[0,0]])),0,1e-12);
  near(C(outerV(normalize([[1,0],[0,0],[0,0],[0,1]]))),1,5e-8);
  for(let seed=1;seed<=100;seed++){
    const p=haarState(M.rng(seed),4), expected=2*Math.hypot(...sub(mul(p[0],p[3]),mul(p[1],p[2])));
    near(C(outerV(p)),expected,5e-8);
  }
});
test('full-rank complex X states and noisy Bell states agree with analytic concurrence, including the separability threshold',()=>{
  for(const p of [0, .1, 1/3-1e-6, 1/3, 1/3+1e-6, .7, 1]) {
    const rho=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>[(i===j?(1-p)/4:0)+((i===0||i===3)&&(j===0||j===3)?p/2:0),0]));
    near(C(rho),Math.max(0,(3*p-1)/2),5e-8);
  }
  for(const [a,b,c,d,wf,zf] of [[.4,.1,.2,.3,.9,.2],[.2,.3,.3,.2,.2,.9],[.25,.25,.25,.25,.5,.5],[.49,.01,.01,.49,1,0]]) {
    const rho=Array.from({length:4},()=>Array.from({length:4},()=>[0,0]));[a,b,c,d].forEach((x,i)=>rho[i][i]=[x,0]);
    const w=wf*Math.sqrt(a*d),z=zf*Math.sqrt(b*c);rho[0][3]=[w*Math.cos(.7),w*Math.sin(.7)];rho[3][0]=[rho[0][3][0],-rho[0][3][1]];rho[1][2]=[z*Math.cos(1.1),z*Math.sin(1.1)];rho[2][1]=[rho[1][2][0],-rho[1][2][1]];
    near(C(rho),2*Math.max(0,w-Math.sqrt(b*c),z-Math.sqrt(a*d)),5e-8);
  }
});
test('three-qubit pairwise concurrence agrees with the independent complex CKW quartic invariant and W/GHZ limits',()=>{
  for(let seed=1;seed<=100;seed++){
    const p=haarState(M.rng(seed+300),8), t=tangles(p);
    near(t.a-t.ab-t.ac,threeTangle(p),2e-7);assert.ok(t.a<=1+1e-12);assert.ok(t.a-t.ab-t.ac>=-2e-7);
  }
  for(let seed=1;seed<=20;seed++){
    const p=haarState(M.rng(seed),3), w=Array.from({length:8},()=>[0,0]);[4,2,1].forEach((i,k)=>w[i]=p[k]);const t=tangles(w);
    near(t.ab,4*Math.hypot(...p[0])**2*Math.hypot(...p[1])**2,5e-8);near(t.ac,4*Math.hypot(...p[0])**2*Math.hypot(...p[2])**2,5e-8);near(t.a-t.ab-t.ac,0,2e-7);
  }
  const g=Array.from({length:8},(_,i)=>[i===0||i===7?1/Math.sqrt(2):0,0]);near(threeTangle(g),1,1e-12);
});
test('production monogamy plot and signed readout show GHZ/W limits and the independently computed residual along the complete gold path',()=>{
  const it=chapter.items.find(q=>q.num==='2.8'), r=record(it);assert.equal(r.controls[2].max,90);assert.equal(r.controls[2].opts.int,true);
  for(const [theta,a,ab,ac] of [[0,1,0,0],[Math.PI/2,8/9,4/9,4/9]]){
    r.controls[2].set(theta*180/Math.PI);r.draw();const gold=r.stages[0].calls.find(c=>c[0]==='dot'&&c[3]?.label==='GHZ→W');near(gold[1],a,1e-7);near(gold[2],ab+ac,1e-7);
  }
  const path=r.stages[0].calls.find(c=>c[0]==='path')[1];path.forEach(([a,pair],k)=>{
    const theta=k*Math.PI/120,p=Array.from({length:8},(_,i)=>[(i===0||i===7?Math.cos(theta)/Math.sqrt(2):0)+([1,2,4].includes(i)?Math.sin(theta)/Math.sqrt(3):0),0]);near(a-pair,threeTangle(p),2e-7);
  });
  assert.doesNotMatch(r.text(),/never negative|bound holds/);assert.match(r.text(),/sampled states/);assert.match(it.idea,/eigenvalues of \$R\$/);
});
