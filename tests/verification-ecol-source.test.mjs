import test from 'node:test';
import assert from 'node:assert/strict';
import { lotteryInvasionRate, traitCompetitionAbundances, colonizationEquilibrium } from '../content/ecol/coexistence.shared.js';
import { rcSpec, rcRun, monodK, hwStep, lvComp } from '../content/ecol/ch04.shared.js';
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);
test('lottery expectation has exact neutral, identical-environment and non-overlap cases', () => {
  for (const sigma of [0, .8, 1.5]) for (const rho of [-.5, 0, 1]) close(lotteryInvasionRate(.2, sigma, 1, rho), .2);
  for (const delta of [.02, .3, 1]) {
    close(lotteryInvasionRate(0, .8, delta, 1), 0);
    close(lotteryInvasionRate(-.1, 0, delta, .5), Math.log(1 - delta + delta * Math.exp(-.1)));
  }
  assert.ok(lotteryInvasionRate(0, .8, .3, 0) > 0);
});
test('lottery quadrature agrees with an independent fine midpoint integral', () => {
  for (const [mean, sigma, delta, rho] of [[-.1,.8,.3,0],[.5,1.5,.02,-.5],[-.5,1.5,.95,-.5]]) {
    let sum = 0; const step = .001, sd = sigma * Math.sqrt(2 * (1 - rho));
    for (let i = 0; i < 20000; i++) { const z = -10 + (i + .5) * step; sum += Math.exp(-z*z/2) / Math.sqrt(2*Math.PI) * Math.log(1-delta+delta*Math.exp(mean+sd*z)) * step; }
    close(lotteryInvasionRate(mean,sigma,delta,rho),sum,1e-9);
  }
});
test('symmetric trait coexistence stays finite when overlap rounds to one', () => {
  for (const alpha of [0, .8, 1 - 1e-15, 1]) {
    const [a,b] = traitCompetitionAbundances(.8,.8,alpha);
    close(a+alpha*b,.8); close(b+alpha*a,.8); assert.ok(Number.isFinite(a));
  }
  const [a,b] = traitCompetitionAbundances(.8,1,.5); close(a+.5*b,.8); close(b+.5*a,1);
});
test('equal resource consumption and aligned supply admit neutral positive mixtures', () => {
  const A=rcSpec([5,2],45),B=rcSpec([2,5],45),total=4/A.c[0];
  const P={K:[A,B].map(s=>s.z.map(z=>monodK(z,1,.25))),Q:[A.c,B.c],S:[9,9],D:.25,m:.25,r:1};
  for(const fraction of [.1,.5,.9]) {
    const st={N:[total*fraction,total*(1-fraction)],R:[5,5],t:0}, before=[...st.N];
    for(let n=0;n<100;n++)hwStep(P,st,.05);
    st.N.forEach((x,i)=>close(x,before[i])); st.R.forEach(x=>close(x,5));
  }
});
test('consumption directions distinguish stable coexistence from priority effects', () => {
  const run=(a,b,N)=>{const q=rcRun(rcSpec([5,2],a),rcSpec([2,5],b),[9,9],N,1000,.05,200);return [q.NA.at(-1),q.NB.at(-1)];};
  const stable=[[2,.2],[.2,2]].map(N=>run(30,60,N));
  close(stable[0][0],stable[1][0],1e-6);close(stable[0][1],stable[1][1],1e-6);
  const left=run(60,30,[2,.2]),right=run(60,30,[.2,2]);assert.ok(left[0]>.1&&left[1]<1e-10);assert.ok(right[1]>.1&&right[0]<1e-10);
});
test('competition-colonization equilibrium satisfies the differential equations and habitat bounds', () => {
  for(const [c1,c2,m] of [[.5,2,.1],[1,.4,.1],[.2,1,.4]])for(const D of [0,.4,.85,.99]){
    const [p1,p2]=colonizationEquilibrium(c1,c2,m,D);
    close(c1*p1*(1-D-p1)-m*p1,0);close(c2*p2*(1-D-p1-p2)-m*p2-c1*p1*p2,0);
    assert.ok(p1>=0&&p2>=0&&p1+p2<=1-D+1e-10);
  }
});
test('illustrative Gause monocultures recover the analytic logistic curve', () => {
  const p={r1:.6,r2:.8,K1:60,K2:200,a12:0,a21:0};
  const q=lvComp(p,2,2,25,1000);
  close(q.x.at(-1),p.K1/(1+(p.K1/2-1)*Math.exp(-p.r1*25)),1e-7);
  close(q.y.at(-1),p.K2/(1+(p.K2/2-1)*Math.exp(-p.r2*25)),1e-7);
});
