import test from 'node:test';import assert from 'node:assert/strict';import{ljSums,ljEnergy}from'../content/cm/ch03.shared.js';import{crystalSummary,soundModel}from'../content/cm/cm-source-audit-lattice.js';
const near=(a,b,t)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('LJ independent primitive lattice shell sums converge to primary table and quoted energies',()=>{
 const refs={fcc:[14.45392,12.13188,12],hcp:[14.45490,12.13229,12],bcc:[12.25367,9.11418,8]};
 for(const [s,[r6,r12,nn]]of Object.entries(refs)){
  // Different primitive Gram forms: paper Eqs.11–13; exact summand geometry.
  const Rc=18,M=34;let p6=0,p12=0,count=0;
  for(let i=-M;i<=M;i++)for(let j=-M;j<=M;j++)for(let k=-M;k<=M;k++){
   const norms=s==='fcc'?[i*i+j*j+k*k+i*j+i*k+j*k]:s==='bcc'?[i*i+j*j+k*k-2*(i*j+i*k+j*k)/3]:[i*i+j*j+i*j+8*k*k/3,(i+1/3)**2+(j+1/3)**2+(i+1/3)*(j+1/3)+8*(k+.5)**2/3];
   for(const d of norms)if(d>1e-9&&d<=Rc*Rc){p6+=d**-3;p12+=d**-6;if(Math.abs(d-1)<1e-10)count++;}
  }
  const S=ljSums(s);p6+=4*Math.PI/(3*S.vol*Rc**3);near(p6,r6,8e-6);near(p12,r12,5e-6);assert.equal(count,nn);near(S.s6,p6,5e-5);near(S.s12,p12,1e-8);
 }
});
test('LJ minimum, analytic modulus, full range and shell remainder independently reconstructed',()=>{
 for(const s of['fcc','hcp','bcc']){const S=ljSums(s);for(let j=0;j<=122;j++){
  const r=.97+j*.005,C=crystalSummary(S,r);near(C.u,ljEnergy(S,r),1e-12);near(C.shown+C.remainder,C.u,1e-12);
  const V=S.vol*C.r0**3,dV=V*.0001,U=v=>ljEnergy(S,Math.cbrt(v/S.vol));near(V*(U(V+dV)-2*U(V)+U(V-dV))/dV**2,C.B,1e-5);
  const dr=.00001;near((ljEnergy(S,C.r0+dr)-ljEnergy(S,C.r0-dr))/(2*dr),0,1e-6);assert.ok(C.u>=C.u0-1e-12);
 }}
 const f=crystalSummary(ljSums('fcc'),1.1),h=crystalSummary(ljSums('hcp'),1.1),b=crystalSummary(ljSums('bcc'),1.1);assert.ok(h.u0<f.u0&&f.u0<b.u0);near(f.B,75.185,.01);
});
test('sound dispersion follows discrete force equation; derivatives and scale relations across controls',()=>{
 for(const m of[.5,1,5])for(const a of[.5,1,3])for(const K of[.5,2,8])for(let j=0;j<=1000;j++){
  const q=Math.PI*j/1000,S=soundModel(m,a,K,q),lambda=K*(2-2*Math.cos(q))/m;near(S.omega*S.omega,lambda,2e-13);near(S.vs*S.vs,a*a*K/m,1e-12);assert.ok(S.phase>=S.group-1e-12&&S.phase<=1+1e-12);
  if(j>0&&j<1000){const d=1e-5;near((soundModel(m,a,K,q+d).omega-soundModel(m,a,K,q-d).omega)*a/(2*d),S.vs*S.group,1e-9);}
 }
});
