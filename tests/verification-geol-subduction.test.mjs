import test from'node:test';import assert from'node:assert/strict';
import{subductionSlab,slabX,subductionCutoff,subductionDepthTable,subductionQuantile,subductionCatalogue,subductionFit}from'../content/geol/subduction-audit.shared.js';
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e*(1+Math.abs(b)),`${a} != ${b}`);
function rng(seed=5){return()=>{seed=(1664525*seed+1013904223)>>>0;return(seed+.5)/4294967296;};}
test('chosen cutoff has correct Myr/mm-yr units and explicit cap across all physical-control corners',()=>{
 for(const dip of[15,45,80])for(const age of[5,120,150])for(const rate of[10,90,120]){const a=subductionCutoff(dip,age,rate);near(a.phi,age*1e6*rate/1e6*Math.sin(dip*Math.PI/180));near(a.zmax,Math.min(700,90+.11*a.phi));assert.ok(a.zmax>90&&a.zmax<=700);}
 assert.ok(subductionCutoff(15,5,10).zmax<100);
});
test('bent slab reaches every model depth; independent fine-step arc quadrature agrees',()=>{
 for(const dip of[15,30,45,80]){const pts=subductionSlab(dip);assert.ok(pts.at(-1)[1]>=800);let x=0,z=0,j=1;const zs=[10,100,300,700,800];for(let arc=0;j<=zs.length;arc+=.02){const a=(10+(dip-10)*(1-Math.exp(-(arc+.01)/120)))*Math.PI/180,nx=x+.02*Math.cos(a),nz=z+.02*Math.sin(a);while(j<=zs.length&&zs[j-1]<=nz){const target=zs[j-1];near(slabX(pts,target),x+(nx-x)*(target-z)/(nz-z),8e-5);j++;}x=nx;z=nz;}}
});
test('monotone CDF inversion covers full cutoff without rejection truncation and agrees with independent quadrature',()=>{
 for(const zmax of[91.42,300,500,700]){const t=subductionDepthTable(zmax);near(subductionQuantile(t,0),0);near(subductionQuantile(t,1),zmax);let previous=-1;for(let k=0;k<=100;k++){const u=k/100,z=subductionQuantile(t,u);assert.ok(z>=previous);previous=z;const n=20000,dz=zmax/n,weight=x=>Math.exp(-x/70)+.07+.55*Math.exp(-.5*((x-590)/55)**2)*Math.max(0,Math.min(1,(zmax-430)/200));let all=0,below=0;for(let i=0;i<n;i++){const a=i*dz,b=(i+1)*dz,w=weight((a+b)/2)*dz;all+=w;below+=w*Math.max(0,Math.min(1,(z-a)/dz));}near(below/all,u,2e-5);}}
});
test('every plotted depth and histogram event is identical, counts exact, probabilities sum to one at 16 corners',()=>{
 for(let mask=0;mask<16;mask++){const p={dip:mask&1?80:15,age:mask&2?150:5,rate:mask&4?120:10,count:mask&8?3000:300},a=subductionCatalogue(p,rng());assert.equal(a.n,p.count);assert.deepEqual(a,subductionCatalogue(p,rng()));const counts=new Array(36).fill(0);for(const[x,z]of a.events){assert.ok(Number.isFinite(x)&&z>=0&&z<=a.zmax);assert.ok(x>=a.xrange[0]&&x<=a.xrange[1]);counts[Math.floor(z/20)]++;}assert.deepEqual(a.bins,counts);assert.equal(a.bins.reduce((x,y)=>x+y,0),p.count);near(a.probabilities.reduce((x,y)=>x+y,0),1);near(a.deepest,Math.max(...a.events.map(e=>e[1])));for(const[x,y]of a.fitPath)assert.ok(x>=a.xrange[0]&&x<=a.xrange[1]&&y>=-700&&y<=-100);}
});
test('OLS uses visible horizontal/depth coordinates, solves normal equations and honestly lacks low-cutoff fit',()=>{
 assert.equal(subductionFit([[1,50],[2,80]]),null);assert.equal(subductionCatalogue({dip:15,age:5,rate:10,count:3000},rng()).fit,null);
 for(const dip of[15,45,80]){const a=subductionCatalogue({dip,age:150,rate:120,count:3000},rng()),f=a.fit,es=a.events.filter(e=>e[1]>100);assert.ok(f);let resid=0,orth=0,sse=0,sst=0;for(const[x,z]of es){const e=x-f.mx-f.slope*(z-f.mz);resid+=e;orth+=e*(z-f.mz);sse+=e*e;sst+=(x-f.mx)**2;}near(resid,0,1e-7);near(orth,0,2e-5);near(f.r2,1-sse/sst,1e-10);near(f.dip,180/Math.PI*Math.atan2(1,f.slope));assert.equal(f.n,es.length);}
 const line=Array.from({length:12},(_,i)=>[30+2*(120+i*20),120+i*20]);near(subductionFit(line).slope,2);near(subductionFit(line).r2,1);
});
