import assert from'node:assert/strict';let checks=0;const ok=x=>{checks++;assert.ok(x)},near=(a,b,e=1e-9)=>ok(Math.abs(a-b)<e*(1+Math.abs(b)));
// Classical HH n-rate ratio is not a single exponential affine in voltage.
const an=V=>V===-55?.1:.01*(V+55)/(-Math.expm1(-(V+55)/10)),bn=V=>.125*Math.exp(-(V+65)/80),L=V=>Math.log(an(V)/bn(V));ok(Math.abs(L(-45)-2*L(-55)+L(-65))>.01);
// Nonzero deactivation target has a first-order late exponential correction, not exponent four.
for(const inf of[.1,.3,.7])for(const d of[.05,.2]){const g=t=>(inf+d*Math.exp(-t))**4-inf**4;near(g(20)/Math.exp(-20),4*inf**3*d,1e-7);near(g(21)/g(20),Math.exp(-1),1e-6);}for(const d of[.1,.7])near((d*Math.exp(-2))**4/(d*Math.exp(-1))**4,Math.exp(-4));
// Stationarity with zero curvature can be a monotone cubic, hence is not a generic fold.
for(const h of[.1,.01,.001]){ok((-h)**3<0&&h**3>0);near((h**3+(-h)**3)/(h*h),0);}
// At the source, G(0,T) diverges as T tends down to zero.
let last=0;for(const T of[.1,.01,.001,.0001]){const G=Math.exp(-T)/Math.sqrt(4*Math.PI*T);ok(G>last);last=G;}
// A nonzero initial constant profile survives with zero source; source-only formula requires zero initial voltage.
for(const T of[.1,1,3])for(const initial of[.2,1,5]){ok(initial*Math.exp(-T)>0);}console.log({checks,productionHelpersImported:false});
