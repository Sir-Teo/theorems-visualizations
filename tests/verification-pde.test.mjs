import test from 'node:test';
import assert from 'node:assert/strict';
import {heatBallAverage,tyDerivs,tyEval,tyLogMax,tyOK} from '../content/pde/ch03-c.js';
import {CS,eigModes,trigCoef,trigSum} from '../content/pde/ch04.shared.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} differs from ${b}`);
const integral=(f,a=0,b=1,n=12000)=>{let s=f(a)+f(b);for(let j=1;j<n;j++)s+=(j%2?4:2)*f(a+(b-a)*j/n);return s*(b-a)/(3*n)};
test('heat-ball normalization, caloric reproduction and independently integrated nonsolution moment',()=>{
 for(const r of[.5,3,5])for(const [x,t] of[[.5,3.6],[-2,.6]]){
  near(heatBallAverage(()=>1,x,t,r).avg,1,1e-7);
  for(const u of[(x,t)=>x*x+2*t,(x,t)=>x*x*x+6*x*t,(x,t)=>Math.exp(-t)*Math.cos(x)]) near(heatBallAverage(u,x,t,r).avg,u(x,t),2e-7);
  // Analytic integral: E(t-s)=r²/(4π 3^(5/2)), E((x-y)²)=2E(t-s).
  near(heatBallAverage((y)=>y*y,x,t,r).avg,x*x+r*r/(2*Math.PI*Math.pow(3,2.5)),2e-7);
 }
});
test('Cauchy circle maximum includes the complex argument, over the complete control range',()=>{
 for(const a of[1.2,1.5,1.9])for(const t of[.05,.15,.8,2])for(const rho of[.05,.3,.55,.7]){
  const bound=tyLogMax(a,t,rho);
  for(let j=0;j<500;j++){const angle=2*Math.PI*j/500,re=t*(1+rho*Math.cos(angle)),im=t*rho*Math.sin(angle);const actual=-Math.pow(Math.hypot(re,im),-a)*Math.cos(a*Math.atan2(im,re));assert.ok(actual<=bound+1e-12);}
 }
});
// Independently generated with mpmath 1.3.0, 100 decimal digits, 160 terms.
// g^(k)=e^-w t^-k Pk(w), P_(k+1)=(alpha*w-k)Pk-alpha*w*Pk'; no complex quadrature.
const reference = [
  {
    "alpha": 1.2,
    "t": 0.15,
    "x": 2.0,
    "derivatives": [
      5.870707301205837e-05,
      0.004575840777653187,
      0.2895451844295735,
      13.537970773093036,
      356.8917322183509,
      -2828.3253085973033,
      -451809.58638517174,
      8557650.763049098,
      925107054.989808
    ],
    "u": 1.456488422632879
  },
  {
    "alpha": 1.5,
    "t": 0.8,
    "x": 2.0,
    "derivatives": [
      0.2472037247044776,
      0.647770702418386,
      -0.3268701742289814,
      -2.609120912809255,
      20.997146189406457,
      -109.44589620158735,
      282.02762414486017,
      3459.923197500126,
      -85445.48254432567
    ],
    "u": 1.1981808197578216
  },
  {
    "alpha": 1.9,
    "t": 0.15,
    "x": 2.0,
    "derivatives": [
      1.08008046679803e-16,
      5.029734507997992e-14,
      2.2450125850726504e-11,
      9.574218633233591e-09,
      3.886664186714102e-06,
      0.0014951791472810115,
      0.5420846506095143,
      183.95058533333375,
      57903.21070312874
    ],
    "u": 0.014187934145543578
  },
  {
    "alpha": 1.9,
    "t": 2.0,
    "x": 5.0,
    "derivatives": [
      0.7649511023967646,
      0.19471539427559956,
      -0.2327732585207981,
      0.34757044629388695,
      -0.5822224201516223,
      0.9392140499511928,
      -0.7440087726514145,
      -5.71603536935402,
      56.9176686819222
    ],
    "u": 1.0397106145746047
  }
]
;
test('Tychonoff derivatives and supported sums agree with independent high-precision recurrence',()=>{
 for(const r of reference){const d=tyDerivs(r.alpha,r.t,100),u=tyEval(d,r.x);r.derivatives.forEach((z,k)=>near(d.d[k],z,2e-10));assert.ok(tyOK(u));near(u.u,r.u,2e-10);assert.ok(Math.abs(u.u-r.u)<=u.err);near(tyEval(d,0).u,Math.exp(-Math.pow(r.t,-r.alpha)),1e-13);}
 assert.equal(tyOK(tyEval(tyDerivs(1.9,.15,100),5)),false);
 assert.throws(()=>tyDerivs(1.5,.8,120),RangeError);
});
test('Tychonoff omitted-tail bound flags a deliberately short series',()=>{
 const d=tyDerivs(1.5,.8,2),v=tyEval(d,2);assert.ok(v.tail>Math.abs(v.u-reference[1].u));assert.equal(tyOK(v),false);
 const q=tyEval(tyDerivs(1.5,.8,0),20);assert.equal(q.tail,Infinity);assert.equal(tyOK(q),false);
});
test('Robin mode continues through zero from both sides, including roots the old scan omitted',()=>{
 for(const [left,critical,factor]of[['D',-1,3],['N',0,1]])for(const delta of[-1e-7,0,1e-7]){
  const m=eigModes(left,'R',0,critical+delta,5);assert.equal(m.length,5);near(m[0].lam,factor*delta,1e-12);
  assert.equal(Math.sign(m[0].lam),Math.sign(delta));
  for(const q of m){near(q.dX(1)+(critical+delta)*q.X(1),0,1e-9);near(left==='D'?q.X(0):q.dX(0),0,1e-10);}
 }
 near(CS(0,.7)[1],.7);for(const z of[-1e-7,1e-7])near(CS(z,1)[0],1-z/2,1e-14);
});
test('separated modes match analytic spectra, Green identity, normalization and energy',()=>{
 for(const[left,right,h0,h1]of[['D','D',0,0],['N','N',0,0],['D','R',0,-3],['N','R',0,-3],['R','R',3,5]]){
  const modes=eigModes(left,right,h0,h1,8);assert.equal(modes.length,8);
  for(let j=0;j<8;j++){
   const q=modes[j],mass=integral(x=>q.X(x)**2);near(mass,1,3e-5);
   if(left===right&&left==='D')near(q.lam,((j+1)*Math.PI)**2,1e-12);
   if(left===right&&left==='N')near(q.lam,(j*Math.PI)**2,1e-12);
   near(integral(x=>q.dX(x)**2)+(left==='R'?h0*q.X(0)**2:0)+(right==='R'?h1*q.X(1)**2:0),q.lam*mass,1e-9);
   for(let k=0;k<j;k++)near(integral(x=>q.X(x)*modes[k].X(x)),0,2e-8);
  }
 }
 // Nonlocal condition X(0)=0, X'(1)=aX'(0) gives nonzero overlap; no incompleteness claim.
 const a=.5,m=Math.acos(a),n=2*Math.PI-m,ip=integral(x=>Math.sin(m*x)*Math.sin(n*x));
 assert.ok(Math.abs(ip)>.02);near((n*n-m*m)*ip,m*Math.cos(m)*Math.sin(n)-Math.sin(m)*n*Math.cos(n),1e-10);
});
test('triangle pluck coefficients and mode energy follow independent integration',()=>{
 for(const p of[1/3,.42,.5])for(let n=1;n<=16;n++){
  const exact=2*Math.sin(n*Math.PI*p)/(n*n*Math.PI*Math.PI*p*(1-p));
  const measured=2*(integral(x=>x/p*Math.sin(n*Math.PI*x),0,p,1000)+integral(x=>(1-x)/(1-p)*Math.sin(n*Math.PI*x),p,1,1000));near(measured,exact,2e-9);
 }
});
test('Fourier coefficient normalization, Parseval residual, and pointwise jump averages',()=>{
 const sq=x=>Math.sign(x),co=trigCoef(sq,64,8192);near(co.a[0],0,1e-12);
 for(let n=1;n<=64;n++){near(co.a[n],0,1e-12);near(co.b[n],n%2?4/(Math.PI*n):0,3e-6);}
 const norm=2*Math.PI;let partial=0;for(let n=1;n<=64;n++)partial+=Math.PI*co.b[n]**2;
 const err=integral(x=>(sq(x)-trigSum(co,64,x))**2,-Math.PI,0,6000)+integral(x=>(sq(x)-trigSum(co,64,x))**2,0,Math.PI,6000);
 near(err,norm-partial,4e-4);near(trigSum(co,64,0),0,1e-12);assert.ok(Math.abs(trigSum(co,64,.8)-1)<.03);
 const tri=trigCoef(x=>Math.abs(x)/Math.PI,64,8192);near(tri.a[0],1,1e-12);for(let n=1;n<=64;n++)near(tri.a[n],n%2?-4/(Math.PI*Math.PI*n*n):0,1e-8);
});
test('Fourier original alternating odd strip series has the stated boundary and harmonic PDE',()=>{
 const strip=(x,y,N=80)=>{let s=0;for(let k=0;k<N;k++){const n=2*k+1;s+=4/Math.PI*(k%2?-1:1)/n*Math.exp(-n*x)*Math.cos(n*y);}return s};
 for(const x of[0,.2,1,3])near(strip(x,Math.PI/2),0,1e-13);
 for(const y of[0,.3,1])near(strip(0,y,10000),1,2e-4);
 for(const [x,y]of[[.3,.4],[1,1]]){const h=1e-4,lap=(strip(x+h,y)+strip(x-h,y)+strip(x,y+h)+strip(x,y-h)-4*strip(x,y))/(h*h);near(lap,0,2e-6);}
});

test('complex Fourier normalization and cancellation/strip counterexamples in 4.9', async()=>{
 const {normalizedFourierMagnitude}=await import('../content/pde/ch04-b.js'),{fftReal}=await import('../assets/js/viz/math.js');
 const N=2048,r=.6,samples=Array.from({length:N},(_,j)=>1/(1-2*r*Math.cos(2*Math.PI*j/N)+r*r)-1/(1-r*r));
 const rms=Math.sqrt(samples.reduce((s,z)=>s+z*z,0)/N),fft=fftReal(samples);
 for(let n=1;n<=16;n++)near(normalizedFourierMagnitude(fft.re[n],fft.im[n],N,rms),Math.pow(r,n)/(1-r*r)/rms,1e-12);
 const co=trigCoef(Math.sign,20,8192);for(let n=2;n<=20;n+=2)near(Math.hypot(co.a[n],co.b[n]),0,1e-12);assert.ok(Math.abs(co.b[19])>.06); // two jumps cancel at every even frequency
 // F(z)=(1-exp(-rho)exp(iz))^-2 is holomorphic in |Im z|<rho,
 // but c_n=(n+1)exp(-rho*n) has no uniform endpoint-rate constant.
 const rho=.7;for(const n of[1,20,200]){const coefficient=(n+1)*Math.exp(-rho*n);near(coefficient/Math.exp(-rho*n),n+1,1e-12);assert.ok(coefficient*Math.exp(.5*rho*n)<4);}
});

test('3.14 uniform Gaussian asymptotic retains the profile across a diffusive window',async()=>{
 const {convolveQuad}=await import('../content/pde/ch03.shared.js');let previous=Infinity;
 for(const t of[10,100,1000]){
  let error=0;for(let j=-50;j<=50;j++){
   const z=j/10,x=z*Math.sqrt(4*t),scaled=Math.sqrt(4*Math.PI*t)*convolveQuad(()=>1,-1,1,x,t,1,200);
   error=Math.max(error,Math.abs(scaled-2*Math.exp(-z*z)));
   if(j===10&&t===1000)assert.ok(Math.abs(scaled-2)>.9); // old claimed limit M=2 is false at x=sqrt(4t)
  }
  assert.ok(error<previous/5);previous=error;
 }
 assert.ok(previous<.0002);
});
