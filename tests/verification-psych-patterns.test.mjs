import test from'node:test';import assert from'node:assert/strict';
import{finiteGaussian,finiteBlur,finiteDog,gridForward,gridInverse,gridInput,hermann,whitePattern,WHITE_BOXES,blindMask,maskContains,MASK}from'../content/psych/source-audit-patterns.js';
const near=(a,b,t=3e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// Independent direct 2D finite convolution; no separable production helper.
function at(image,nx,ny,sigma,x,y){const r=Math.ceil(3.5*sigma),weights=[];let norm=0,total=0;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const w=Math.exp(-(i*i+j*j)/(2*sigma*sigma));norm+=w;weights.push([i,j,w]);}for(const[i,j,w]of weights)total+=w*image[Math.min(ny-1,Math.max(0,y+j))*nx+Math.min(nx-1,Math.max(0,x+i))];return total/norm;}
const dogAt=(p,i)=>at(p.input,p.nx,p.ny,p.scale/p.spacing,i%p.nx,Math.floor(i/p.nx))-at(p.input,p.nx,p.ny,4*p.scale/p.spacing,i%p.nx,Math.floor(i/p.nx));
test('finite normalized filters preserve constants and agree with direct 2D boundary convolution',()=>{
 for(const s of[.5,1.23456789,4,16]){const k=finiteGaussian(s);near(k.weights.reduce((a,b)=>a+b,0),1);assert.equal(k.radius,Math.ceil(3.5*s));k.weights.forEach((v,i)=>{assert.ok(v>0);near(v,k.weights.at(-1-i));});const a=Float64Array.from({length:35},(_,i)=>((i*17+3)%31)/30),p=finiteBlur(a,7,5,s);for(const i of[0,6,7,17,28,34])near(p[i],at(a,7,5,s,i%7,Math.floor(i/7)));const constant=finiteDog(new Float64Array(35).fill(.37),7,5,s);constant.forEach(x=>near(x,0));}
});
test('two successive shears invert globally and have unit Jacobian at all offered amplitudes',()=>{
 for(const A of[0,.123456789,.5])for(const u of[-3.5,0,1.25,3.75,10])for(const v of[-1,1.25,5,6.25,12]){const[x,y]=gridForward(u,v,A),[a,b]=gridInverse(x,y,A);near(a,u);near(b,v);const h=1e-6,xx=gridForward(u+h,v,A),xm=gridForward(u-h,v,A),yy=gridForward(u,v+h,A),ym=gridForward(u,v-h,A);near(((xx[0]-xm[0])*(yy[1]-ym[1])-(xx[1]-xm[1])*(yy[0]-ym[0]))/(4*h*h),1,1e-8);}
 for(const A of[0,.5])for(const u of[1.25,3.75,6.25,8.75])for(const v of[1.25,3.75,6.25,8.75])assert.equal(gridInput(...gridForward(u,v,A),.2,A),1);
});
test('Hermann readouts use actual containing cells and independently convolved signed signals',()=>{
 for(const width of[.2,1])for(const amplitude of[0,.5])for(const scale of[.05,.4]){const p=hermann(width,amplitude,scale);assert.equal(p.input.length,10000);assert.ok(p.response.every(x=>x>=-.96-1e-12&&x<=.96+1e-12));for(const[points,values]of[[p.crossings,p.atCross],[p.middles,p.atMid]])points.forEach(([x,y],j)=>{const i=Math.min(99,Math.max(0,Math.floor(y/.1)))*100+Math.min(99,Math.max(0,Math.floor(x/.1)));near(values[j],p.response[i]);near(values[j],dogAt(p,i));});near(p.difference,p.atCross.reduce((s,x)=>s+x,0)/4-p.atMid.reduce((s,x)=>s+x,0)/2);assert.ok(Number.isFinite(p.difference));}
});
test('White cells, patch averages and match differences agree with separate finite image and direct convolution',()=>{
 for(const pattern of['white','ctrl'])for(const level of[.25,.75])for(const scale of[.05,.4]){const p=whitePattern(pattern,level,scale,.123456789,.923456789);near(p.matchDifference,.8);for(let j=0;j<p.ny;j++)for(let i=0;i<p.nx;i++){const x=(i+.5)/12,y=(j+.5)/12,patch=WHITE_BOXES[pattern].some(r=>x>=r[0]&&x<r[2]&&y>=r[1]&&y<r[3]),bg=pattern==='white'?(Math.floor(x)%2===0?.04:1):x<5?1:.04;assert.equal(p.input[j*p.nx+i],patch?level:bg);}p.samples.forEach((list,k)=>{assert.equal(list.length,56);const expected=[];for(let y=k?46:19;y<=(k?52:25);y++)for(let x=k?74:38;x<=(k?81:45);x++)expected.push(y*120+x);assert.deepEqual(list,expected);const ref=list.map(i=>dogAt(p,i));near(p.means[k],ref.reduce((s,x)=>s+x,0)/ref.length);for(const i of list)assert.equal(p.input[i],level);});assert.ok(p.response.every(x=>x>=-.96-1e-12&&x<=.96+1e-12));near(p.difference,p.means[1]-p.means[0]);}
});
test('blind-spot mask counts finite cell centers exactly and mirrors every scene cell between eyes',()=>{
 for(const temporal of[0,15.5,22])for(const y of[-9,-1.5,9])for(const radius of[.4,1.5,6]){const p=blindMask('R','stripes',temporal,y,radius),q=blindMask('L','stripes',temporal,y,radius);let dot=0,masked=0;for(let j=0;j<144;j++)for(let i=0;i<240;i++){const k=j*240+i,x=-30+(i+.5)/4,yy=-18+(j+.5)/4,inDot=Math.hypot(x-temporal,yy-y)<=radius,inMask=((x-15.5)/2.75)**2+((yy+1.5)/3.75)**2<=1;if(inDot)dot++;if(inDot&&inMask)masked++;assert.equal(p.input[k],+inDot);assert.equal(p.erased[k],+(inDot&&inMask));assert.equal(p.input[k],q.input[j*240+239-i]);assert.equal(p.erased[k],q.erased[j*240+239-i]);}assert.equal(p.dotSamples,dot);assert.equal(p.maskedSamples,masked);assert.equal(p.remainingSamples,dot-masked);assert.ok(p.dotSamples>0);p.ellipse.forEach(([x,y])=>near(((x-MASK.x)/MASK.rx)**2+((y-MASK.y)/MASK.ry)**2,1));}
 const full=blindMask();assert.equal(full.remainingSamples,0);const none=blindMask('R','plain',0,9,.4);assert.equal(none.maskedSamples,0);const partial=blindMask('L','line',15.5,-1.5,6);assert.ok(partial.maskedSamples>0&&partial.remainingSamples>0);assert.equal(maskContains(15.5,-1.5),true);assert.equal(maskContains(-15.5,-1.5,'L'),true);
});
test('invalid or nonfinite image/model domains reject before rendering',()=>{
 for(const a of[[.1],[65],[NaN]])if(a[0]!==.1)assert.throws(()=>finiteGaussian(...a),RangeError);
 for(const a of[[0],[.5,-1],[.5,.2,0],[.5,.2,Infinity]])assert.throws(()=>hermann(...a),RangeError);
 for(const a of[['bad'],['white',0],['white',.5,.01],['white',.5,.1,-1]])assert.throws(()=>whitePattern(...a),RangeError);
 for(const a of[['X'],['R','bad'],['R','plain',23],['R','plain',15,-10],['R','plain',15,0,0]])assert.throws(()=>blindMask(...a),RangeError);
});
