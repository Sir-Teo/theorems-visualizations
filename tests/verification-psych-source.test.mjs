import test from 'node:test';
import assert from 'node:assert/strict';
import { gaussianDiskMass,anchoredReflectances,cornsweetCusp,relativeToneGains } from '../content/psych/verification-models.js';
import { Phi } from '../content/stat/ch07.shared.js';
import { dog1 } from '../content/psych/ch04.shared.js';

test('Gaussian receptive-field disk masses agree with independent Cartesian integration',()=>{
 for(const [sigma,offset,radius]of [[.8,0,.1],[.8,0,2],[.8,1.7,1],[4,3,5.5],[.8,8,6]]){
  const n=50000,h=2*radius/n;let integral=0;
  for(let j=0;j<n;j++){
   const x=offset-radius+(j+.5)*h,y=Math.sqrt(Math.max(0,radius**2-(x-offset)**2));
   integral+=Math.exp(-x*x/(2*sigma*sigma))/(sigma*Math.sqrt(2*Math.PI))*(2*Phi(y/sigma)-1)*h;
  }
  assert.ok(Math.abs(gaussianDiskMass(sigma,offset,radius)-integral)<1e-5,`${sigma},${offset},${radius}`);
 }
 for(const s of [.8,2.4,4])assert.ok(Math.abs(gaussianDiskMass(s,0,100)-1)<1e-14);
});

test('anchoring averages separately computed framework lightness and is linear in framework weight',()=>{
 const L=[.03,.9,.3,9],groups=[false,false,true,true];
 const local=anchoredReflectances(L,groups,1),global=anchoredReflectances(L,groups,0),half=anchoredReflectances(L,groups,.5);
 for(let i=0;i<L.length;i++)assert.ok(Math.abs(half[i]-(local[i]+global[i])/2)<1e-14);
 assert.deepEqual(local.map(x=>Math.round(x*100)),[3,90,3,90]);
 const relit=anchoredReflectances(L.map((x,i)=>groups[i]?x*3:x),groups,1);
 for(let i=0;i<L.length;i++)assert.ok(Math.abs(relit[i]-local[i])<1e-14);
});

test('Cornsweet cusp has genuinely equal far fields across the complete tail-width range',()=>{
 for(const width of [.3,1.4,3])for(const amplitude of [.04,.16,.3]){
  assert.equal(cornsweetCusp(1,amplitude,width),.5);assert.equal(cornsweetCusp(9,amplitude,width),.5);
  for(const offset of [.01,.2,1])assert.ok(Math.abs(cornsweetCusp(5-offset,amplitude,width)+cornsweetCusp(5+offset,amplitude,width)-1)<1e-14);
 }
});

test('relative audio levels preserve the requested decibels without gain saturation',()=>{
 for(const delta of [1,10,20,30]){
  const [a,b]=relativeToneGains(delta);assert.ok(Math.abs(20*Math.log10(b/a)-delta)<1e-12);assert.ok(b<.9);
 }
});

test('balanced difference-of-Gaussians annihilates uniform fields including array boundaries',()=>{
 for(const k of [0,.5,1,1.2])for(const sigma of [1,4]){
  const result=dog1(Array(101).fill(.7),sigma,3*sigma,k);
  assert.ok(result.every(x=>Math.abs(x-.7*(1-k))<1e-13));
 }
});

test('Mach ramp convolution agrees with the analytic Gaussian positive-part integral',()=>{
 const dx=.01,a=4,b=6,sc=.12,ss=.48,slope=.55/(b-a);
 const L=Array.from({length:1001},(_,i)=>.25+slope*(Math.max(0,i*dx-a)-Math.max(0,i*dx-b)));
 const actual=dog1(L,sc/dx,ss/dx,1);
 const positive=(z,s)=>z*Phi(z/s)+s*Math.exp(-z*z/(2*s*s))/Math.sqrt(2*Math.PI);
 const exact=x=>slope*(positive(x-a,sc)-positive(x-b,sc)-positive(x-a,ss)+positive(x-b,ss));
 for(const x of [3,4,4.5,5,5.5,6,7])assert.ok(Math.abs(actual[Math.round(x/dx)]-exact(x))<1e-4,`${x}`);
 assert.ok(actual[400]<0);assert.ok(actual[600]>0);assert.ok(Math.abs(actual[500])<1e-13);
});

test('positive threshold offset steepens the logarithmic slope on the unshifted intensity axis',()=>{
 for(const n of [.33,.6,1.1,3.5])for(const threshold of [.1,.4]){
  const I=threshold*1.5,h=I*1e-5;
  const slope=n*(Math.log(I+h-threshold)-Math.log(I-h-threshold))/(Math.log(I+h)-Math.log(I-h));
  assert.ok(slope>n);assert.ok(Math.abs(slope-n*I/(I-threshold))<1e-7);
 }
});
