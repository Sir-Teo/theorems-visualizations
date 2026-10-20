import test from 'node:test';import assert from 'node:assert/strict';
import{centreSurround,machFilter,blurredRamp,rampInput}from'../content/psych/source-audit-centresurround.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
// Independent Gauss-Legendre construction and direct integrals; never the production CDF/hinge.
const nodes=[];for(let i=1;i<=32;i++){let z=Math.cos(Math.PI*(i-.25)/32.5),dp;for(let it=0;it<20;it++){let p0=1,p1=z;for(let j=2;j<=32;j++){const p=((2*j-1)*z*p1-(j-1)*p0)/j;p0=p1;p1=p;}dp=32*(z*p1-p0)/(z*z-1);const dz=p1/dp;z-=dz;if(Math.abs(dz)<2e-16)break;}nodes.push([z,2/((1-z*z)*dp*dp)]);}
const integral=(f,a,b)=>nodes.reduce((s,[x,w])=>s+w*f((a+b)/2+(b-a)*x/2)*(b-a)/2,0),mass=(r,s)=>integral(t=>t/s**2*Math.exp(-t*t/(2*s*s)),0,r);
const reference=(x,c,w,s)=>{const a=c-w/2,b=c+w/2,lum=t=>w===0?(t<c?.25:.8):t<=a?.25:t>=b?.8:.25+.55*(t-a)/w,breaks=[...Array.from({length:25},(_,i)=>i-12),...[a,b].map(t=>(x-t)/s).filter(z=>z>-12&&z<12),12].sort((a,b)=>a-b);let sum=0;for(let i=1;i<breaks.length;i++)sum+=integral(z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI)*lum(x-s*z),breaks[i-1],breaks[i]);return sum;};
test('exact disk/annulus/uniform drives agree with independent polar integrals for both polarities over reference grid',()=>{
 let count=0;for(let i=0;i<=14;i++)for(let j=0;j<=24;j++)for(const r of[0,.1,1,3,6])for(const shape of['spot','ring','full'])for(const on of[true,false]){const ratio=1.5+i/4,k=j/20,q=centreSurround(r,ratio,k,shape,on),d=x=>mass(x,.8)-k*mass(x,.8*ratio),expected=shape==='full'?1-k:shape==='spot'?d(r):d(r+1.5)-d(r);near(q.drive,expected);near(q.rate,Math.max(0,20+60*(on?1:-1)*expected));assert.ok(q.rate>=0&&q.rate<=92+1e-12);near(q.uniformDrive,1-k);count++;}assert.equal(count,11250);
 for(const ratio of[1.5,5])for(const on of[true,false]){const q=centreSurround(6,ratio,1,'full',on);assert.equal(q.drive,0);assert.equal(q.rate,20);}
});
test('global disk optimum includes endpoints and stationary derivative certificate, with independent dense comparisons including OFF and k=0',()=>{
 for(const ratio of[1.5,1.75,2,3,4,5])for(const k of[0,Number.MIN_VALUE,.1,.5,.9,1,1.1,1.2])for(const on of[true,false]){const q=centreSurround(2,ratio,k,'spot',on),best=q.best[0].rate;assert.ok(Number.isFinite(best));if(k>0){assert.ok(Number.isFinite(q.critical));const z=q.critical,term=r=>Math.exp(-r*r/(2*.8**2))/.8**2-k*Math.exp(-r*r/(2*q.ss**2))/q.ss**2;near(term(z),0);assert.ok(term(z*.5)>=-1e-15);assert.ok(term(z*2)<=1e-15);}for(let i=0;i<=1000;i++){const r=i*6/1000,d=mass(r,.8)-k*mass(r,q.ss),fr=Math.max(0,20+60*(on?1:-1)*d);assert.ok(best+2e-9>=fr);}assert.equal(q.curve[0][0],0);assert.equal(q.curve.at(-1)[0],6);assert.ok(q.curve.some(p=>p[0]===2));}
});
test('whole-line ramp convolution agrees with independent direct Gaussian integrals, including tiny width, step, broad tails and unbalanced states',()=>{
 let count=0;for(const sc of[.04,.12,.4])for(const ratio of[2,4,8])for(const k of[0,1,1.2])for(const c of[3.5,6.5])for(const w of[0,1e-12,1e-6,.0001,1.2,7]){const q=machFilter(sc,ratio,k,c,w,c);for(const x of[-3,0,c-w/2,c,c+w/2,10,13]){const expected=reference(x,c,w,sc)-k*reference(x,c,w,sc*ratio),actual=blurredRamp(x,c,w,sc)-k*blurredRamp(x,c,w,sc*ratio);near(actual,expected,5e-10);assert.ok(actual>=-.71-2e-12&&actual<=.8+2e-12);count++;}near(q.lowLimit,(1-k)*.25);near(q.highLimit,(1-k)*.8);for(const[x,y]of q.response)assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=-3&&x<=13&&y>=-.71-2e-12&&y<=.8+2e-12);}assert.equal(count,2268);
});
test('balanced ramp symmetry, knee derivative signs, step lobes and no-surround monotonicity distinguish filter predictions from knee/percept claims',()=>{
 for(const w of[0,1e-10,.001,1.2,7])for(const sc of[.04,.4])for(const ratio of[2,8]){
 const q=machFilter(sc,ratio,1,5,w);near(q.atProbe,0);assert.ok(q.slopeA>0&&q.slopeB>0||q.kneeUnderflow&&w/(sc*ratio)>38.5);for(const d of[.1,.5,2,5]){const left=blurredRamp(5-d,5,w,sc)-blurredRamp(5-d,5,w,sc*ratio),right=blurredRamp(5+d,5,w,sc)-blurredRamp(5+d,5,w,sc*ratio);near(left,-right);assert.ok(left<=2e-12&&right>=-2e-12);}const z=machFilter(sc,ratio,0,5,w);for(let i=1;i<z.response.length;i++)assert.ok(z.response[i][1]>=z.response[i-1][1]-2e-12);}
 const q=machFilter(.12,4,1,5,0);assert.ok(q.response.some(([,y])=>y>.1));assert.ok(q.response.some(([,y])=>y<-.1));assert.deepEqual(q.stimulus,[[-3,.25],[5,.25],[5,.8],[13,.8]]);
});
test('off-grid closed continuous values persist and malformed controls are rejected',()=>{
 const a=centreSurround(.123456789,2.123456789,.123456789,'ring',false);assert.equal(a.radius,.123456789);const b=machFilter(.123456789,2.123456789,.123456789,4.123456789,.123456789,-.123456789);assert.equal(b.width,.123456789);assert.equal(b.probe,-.123456789);
 for(const v of[null,'1',[],{},NaN,Infinity,-1,6.01])assert.throws(()=>centreSurround(v),RangeError);for(const v of[1,null,[],{}])assert.throws(()=>centreSurround(1,3,1,v===1?'spot':v,v===1?1:true),RangeError);
 const defaults=[.12,4,1,5,1.2,5],limits=[[.04,.4],[2,8],[0,1.2],[3.5,6.5],[0,7],[-3,13]];for(let i=0;i<6;i++)for(const bad of[null,'1',[],{},NaN,Infinity,limits[i][0]-.01,limits[i][1]+.01]){const a=defaults.slice();a[i]=bad;assert.throws(()=>machFilter(...a),RangeError);}for(const w of[Number.MIN_VALUE,1e-20])assert.ok(Number.isFinite(machFilter(.04,8,1,6.5,w).atProbe));
});

test('adaptive response envelope follows the exact step maximum and contains all ramp widths',()=>{
 for(const ratio of[2,2.5,3,4,5,6,8])for(const k of[0,.5,1,1.2])for(const w of[0,.001,1.2,7]){const q=machFilter(.12,ratio,k,5,w),v=Math.sqrt(2*Math.log(ratio)/(1-1/ratio**2)),x=5+.12*v,stepMax=reference(x,5,0,.12)-reference(x,5,0,.12*ratio);near(q.stepEnvelope,stepMax,1e-11);for(const[,y]of q.response)assert.ok(y>=q.responseBounds[0]-2e-12&&y<=q.responseBounds[1]+2e-12);assert.ok(q.responseBounds[0]<=q.lowLimit&&q.responseBounds[1]>=q.highLimit||k>1&&q.responseBounds[0]<=q.highLimit&&q.responseBounds[1]>=q.lowLimit);}
});

test('centered input preserves midpoint and representable offset fractions at zero and sub-ULP ramp widths',()=>{
 for(const c of[3.5,4.123456789,6.5])for(const w of[0,Number.MIN_VALUE,1e-20,1e-15,1e-14,1e-12,.0001,7]){
  assert.equal(rampInput(c,c,w),.525);assert.equal(machFilter(.04,8,1,c,w,c).lumProbe,.525);
  const ulp=2**(Math.floor(Math.log2(c))-52);for(const n of[-10,-2,-1,1,2,10]){const x=c+n*ulp,f=w===0?(x<c?0:1):Math.min(1,Math.max(0,.5+(x-c)/w));assert.equal(rampInput(x,c,w),.25+.55*f);}
  assert.equal(rampInput(-3,c,w),.25);assert.equal(rampInput(13,c,w),.8);
 }
 // Exact dyadic positions give independently specified quarter/half/three-quarter values.
 for(const w of[2**-48,2**-40,.25,4])for(const[n,intensity]of[[-.25,.3875],[0,.525],[.25,.6625]])near(rampInput(4+n*w,4,w),intensity,1e-15);
});
