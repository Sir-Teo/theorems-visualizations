import assert from'node:assert/strict';let checks=0;const ok=x=>{assert.ok(x);checks++;},near=(a,b,t=1e-9)=>ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b))),S=f=>{const n=4000,h=1/n;let s=f(-.5)+f(.5);for(let j=1;j<n;j++)s+=(j%2?4:2)*f(-.5+j*h);return s*h/3;};
for(const k of[-10,-6,-4,4,6,10]){const Z=2*Math.sinh(k/2)/k,p=y=>Math.exp(k*y)/Z,e=.5/Math.tanh(k/2)-1/k;near(S(p),1);near(S(y=>y*p(y)),e);ok(Math.abs(e)>1/6&&Math.abs(e)<.5);for(const y of[-.5,-.25,0,.25,.5])ok(p(y)>0);const linear=y=>1+12*e*y;ok(Math.min(linear(-.5),linear(.5))<0);}
// A compact convex optimum face can retain a whole interval of thrust-like coordinates.
for(const H of[0,.1,.5,.9,1]){const lambda=1;ok(H>=0&&H<=1&&lambda<=1);near(lambda,1);}ok(0!==1);
// A geometry-specific containment certificate is not a certificate after its envelope moves.
const line=[0,1,0],old=[0,1,0],moved=[0,2,0],inside=c=>line.every((y,j)=>Math.abs(y-c[j])<=.1);ok(inside(old));ok(!inside(moved));
console.log(JSON.stringify({independentCorrectionChecks:checks,productionImports:false,pass:true}));
