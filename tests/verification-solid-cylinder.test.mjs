import test from 'node:test';
import assert from 'node:assert/strict';
import {cylinderStress as stress,cylinderThinRatio as ratio} from '../content/solid/source-audit-cylinder.js';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function solve(M,y){
  const a=M.map((r,i)=>[...r,y[i]]);
  for(let i=0;i<y.length;i++){
    let j=i;for(let k=i+1;k<y.length;k++)if(Math.abs(a[k][i])>Math.abs(a[j][i]))j=k;
    [a[i],a[j]]=[a[j],a[i]];const p=a[i][i];a[i]=a[i].map(x=>x/p);
    for(let k=0;k<y.length;k++)if(k!==i){const p=a[k][i];a[k]=a[k].map((x,j)=>x-p*a[i][j]);}
  }
  return a.map(r=>r.at(-1));
}
test('All pressure/radius corners match independently solved displacement and 3D Hooke-law boundary conditions',()=>{
  const E=210000,nu=.29,mu=E/(2*(1+nu)),lambda=E*nu/((1+nu)*(1-2*nu));
  for(const k of[1.02,2,5])for(const pi of[0,37,100])for(const po of[0,61,100]){
    const z=(pi-po*k*k)/(k*k-1);
    const [C,D,ez]=solve([[2*(lambda+mu),-2*mu,lambda],[2*(lambda+mu),-2*mu/k**2,lambda],[2*lambda,0,lambda+2*mu]],[-pi,-po,z]);
    const s=stress(k,pi,po);
    for(let i=0;i<=40;i++){
      const r=1+i*(k-1)/40,er=C-D/r**2,et=C+D/r**2,tr=er+et+ez;
      close(s.radial(r),2*mu*er+lambda*tr);close(s.hoop(r),2*mu*et+lambda*tr);close(s.axial,2*mu*ez+lambda*tr);
    }
    close(s.radial(1),-pi);close(s.radial(k),-po);
  }
});
test('Independent Simpson integration and finite-difference derivatives verify force and radial equilibrium, including negative hoop stresses',()=>{
  for(const k of[1.02,5])for(const pi of[0,100])for(const po of[0,100]){
    const s=stress(k,pi,po),n=10000,h=(k-1)/n;let integral=0;
    for(let j=0;j<=n;j++)integral+=(j===0||j===n?1:j%2?4:2)*s.hoop(1+j*h);
    close(integral*h/3,pi-po*k,1e-9);close(s.average*(k-1),pi-po*k);
    for(const r of[1+(k-1)*.2,1+(k-1)*.8]){
      const d=1e-5,derivative=(s.radial(r+d)-s.radial(r-d))/(2*d);
      close(derivative+(s.radial(r)-s.hoop(r))/r,0,1e-5);close(s.radial(r)+s.hoop(r),2*s.A);
    }
  }
});
test('Uniform pressure gives uniform compression; zero-load and thin-wall limits stay meaningful',()=>{
  for(const k of[1.02,5])for(const p of[0,100]){
    const s=stress(k,p,p);for(const r of[1,(1+k)/2,k]){close(s.radial(r),-p);close(s.hoop(r),-p);}close(s.average,-p);close(s.axial,-p);
  }
  close(ratio(1+1e-6),1,1e-11);
  for(const k of[1.02,2,5]){
    const s=stress(k,100,0),thin=100*(1+k)/(2*(k-1));close(s.hoop(1)/thin,ratio(k));assert.ok(ratio(k)>1&&ratio(k)<2);
  }
  assert.ok(stress(1.02,0,100).hoop(1)<-5000);
});
