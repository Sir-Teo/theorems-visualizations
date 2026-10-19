import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluatePolynomial, shiftedCoefficients, polynomialCircleMoment } from '../content/rca/polynomial-maximum.shared.js';
import { measureWeightTerm } from '../content/rca/measure-weight.shared.js';
import { poissonAtom, poissonSemicircle, approachComparisonConstant } from '../content/rca/poisson-boundary.shared.js';
import { cyclicApproximationError } from '../content/rca/hardy-restorations.shared.js';
import { solve } from '../assets/js/viz/math.js';
const close = (a,b,tol=1e-11) => assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);
test('cyclic approximation formula agrees with independent normal-equation residuals',()=>{
  for(const a of [0,.5,1,1.3])for(const n of [0,1,5,12]){
    const gram=Array.from({length:n+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===j?1+a*a:Math.abs(i-j)===1?-a:0));
    const coefficients=solve(gram,Array.from({length:n+1},(_,i)=>i===0?1:0));
    const residual=Array(n+2).fill(0);residual[0]=-1;
    for(let j=0;j<=n;j++){residual[j]+=coefficients[j];residual[j+1]-=a*coefficients[j];}
    close(Math.hypot(...residual),cyclicApproximationError(a,n),2e-10);
  }
  assert.ok(cyclicApproximationError(.8,100)<1e-9);
  close(cyclicApproximationError(1,100),1/Math.sqrt(102));
  close(cyclicApproximationError(1.3,100),Math.sqrt(1-1/1.3**2));
});
test('analytic semicircle Poisson extension matches independent kernel quadrature',()=>{
  for(const r of [0,.2,.7,.95])for(const t of [-2,-.3,0,1.7]){
    let integral=0;const n=32768;
    for(let j=0;j<n;j++)integral+=poissonAtom(r,t-(-Math.PI/2+Math.PI*(j+.5)/n))/(2*n);
    close(integral,poissonSemicircle(r,t),2e-8);
  }
});
test('analytic approach-region comparison bounds actual Poisson kernels',()=>{
  for(const alpha of [.1,.5,.9])for(const lambda of [.001,.1,.7,1])for(const angle of [-2,-.3,0,1.2]){
    const x=1-lambda+lambda*.99*alpha*Math.cos(angle),y=lambda*.99*alpha*Math.sin(angle),r=Math.hypot(x,y),arg=Math.atan2(y,x);
    for(let j=0;j<100;j++){const t=2*Math.PI*j/100;
      assert.ok(poissonAtom(r,t-arg)<=approachComparisonConstant(alpha)*poissonAtom(r,t)*(1+1e-10));
    }
  }
  assert.ok(poissonAtom(.99999,1)<1e-4);
  assert.ok(poissonAtom(.99999,0)>1e5,'the atom itself fails the zero-derivative hypothesis');
});
test('positive integrable weight stays strictly below one for the zero measure', () => {
  let zeroMeasureWeight=0;
  for(let n=1;n<=100;n++)zeroMeasureWeight+=measureWeightTerm(n,0);
  close(zeroMeasureWeight,.5);assert.ok(zeroMeasureWeight<1);
  for(const masses of [n=>2*n,n=>2,n=>2*n+1]){
    let integral=0;
    for(let n=1;n<=100;n++)integral+=measureWeightTerm(n,masses(n))*masses(n);
    assert.ok(integral>0&&integral<.5);
  }
  assert.ok(measureWeightTerm(100,1e100)>0,'a point covered late still has positive weight');
});
test('polynomial center shift preserves both complex components', () => {
  const coefficients = [[.3,.2],[-.7,.1],[.5,-.4],[1,.2]];
  for(const center of [[0,0],[.2,-.4],[-.7,.1]])for(const w of [[.1,.3],[-.2,.05],[0,0]]) {
    const lhs=evaluatePolynomial(coefficients,[center[0]+w[0],center[1]+w[1]]);
    const rhs=evaluatePolynomial(shiftedCoefficients(coefficients,center),w);
    close(lhs[0],rhs[0]);close(lhs[1],rhs[1]);
  }
});
test('circle coefficient moment agrees with independent sampled orthogonality', () => {
  const coefficients=[[.2,.15],[-.5,0],[0,0],[1,0]];
  for(const center of [[0,0],[.25,-.3]])for(const radius of [.01,.2,.5]) {
    let integral=0;
    for(let j=0;j<4096;j++) {
      const t=2*Math.PI*j/4096,x=center[0]+radius*Math.cos(t),y=center[1]+radius*Math.sin(t);
      // Explicit z³ − z/2 + (.2+.15i), independent of the Horner evaluator.
      const re=x*x*x-3*x*y*y-.5*x+.2,im=3*x*x*y-y*y*y-.5*y+.15;
      integral+=(re*re+im*im)/4096;
    }
    close(polynomialCircleMoment(coefficients,center,radius),integral);
  }
});
test('interior averaging detects nonconstant polynomials and the broken hypothesis', () => {
  const constant=[[.2,.15]],quadratic=[[0,0],[0,0],[1,0]];
  close(polynomialCircleMoment(constant,[.3,.2],.4),.0625);
  close(polynomialCircleMoment(quadratic,[0,0],.4),.4**4);
  assert.ok(polynomialCircleMoment(quadratic,[.2,.1],.3)>Math.hypot(...evaluatePolynomial(quadratic,[.2,.1]))**2);
  assert.ok((1-.4**2)**2<1, 'the non-polynomial bump has lower circle mean than center square');
});
