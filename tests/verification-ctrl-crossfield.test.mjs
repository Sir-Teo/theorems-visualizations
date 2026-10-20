// Independent calculations for the prerequisite prose; no review-status assertions.
import test from 'node:test';import assert from 'node:assert/strict';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*(1+Math.abs(a)+Math.abs(b)),`${a} ≈ ${b}`);
const mul=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,x,k)=>s+x*B[k][j],0)));
const inv=([[a,b],[c,d]])=>[[d/(a*d-b*c),-b/(a*d-b*c)],[-c/(a*d-b*c),a/(a*d-b*c)]];
const det=([[a,b],[c,d]])=>a*d-b*c;
const sub=(A,B)=>A.map((r,i)=>r.map((x,j)=>x-B[i][j]));
const eye=[[1,0],[0,1]];
const derivative=(f,x)=>{const h=1e-5;return(f(x+h)-f(x-h))/(2*h);};
test('composition order and state-coordinate transfer invariance (120 realizations)',()=>{
 const P=[[1,1],[0,1]],C=[[1,0],[1,1]];assert.notDeepEqual(mul(P,C),mul(C,P));
 for(let k=1;k<=120;k++){const Q=[[1,k/37],[k/251,2]],Qi=inv(Q),A=[[-1,k/71],[0,-3]],B=[[1],[2]],D=[[2,-1]],s=.2+k/41;
  const Aprime=mul(mul(Qi,A),Q),R=inv(sub(eye.map(r=>r.map(x=>s*x)),A)),Rp=inv(sub(eye.map(r=>r.map(x=>s*x)),Aprime));
  const original=mul(mul(D,R),B)[0][0],transformed=mul(mul(mul(D,Q),Rp),mul(Qi,B))[0][0];near(original,transformed);
  near(det(sub(eye.map(r=>r.map(x=>s*x)),A)),(s+1)*(s+3));
 }
});
test('quotient sensitivity, drag product derivative and fold chain rule (300 cases)',()=>{
 for(let k=1;k<=100;k++){const p=.1+k/17,c=.2+k/29,T=x=>x*c/(1+x*c);near(derivative(T,p),c/(1+p*c)**2,2e-9);near(p/T(p)*derivative(T,p),1/(1+p*c),2e-9);
 const drag=.1+k/53,v=2+k/13;near(derivative(x=>drag*x*x,v),2*drag*v,1e-8);
 const gain=1+k/21,x=Math.sqrt(1-1/gain),u=Math.atanh(x)-gain*x;near(Math.tanh(gain*x+u),x);near(derivative(z=>Math.tanh(gain*z+u),x),gain*(1-x*x),1e-8);near(gain*(1-x*x),1);
 }
});
// Determinant via independent Gaussian elimination, compared with explicit loop-cycle expansion.
function detElimination(input){const a=input.map(r=>r.slice());let value=1;for(let j=0;j<a.length;j++){let q=j;while(q<a.length&&Math.abs(a[q][j])<1e-12)q++;if(q===a.length)return 0;if(q!==j){[a[j],a[q]]=[a[q],a[j]];value=-value;}const p=a[j][j];value*=p;for(let i=j+1;i<a.length;i++){const f=a[i][j]/p;for(let k=j+1;k<a.length;k++)a[i][k]-=f*a[j][k];}}return value;}
test('Mason disjoint cycles reproduce determinant for two disconnected feedback loops (200 graphs)',()=>{
 for(let k=1;k<=200;k++){const a=k/37,b=-k/271,c=.2+k/107,d=-.1-k/313,e=.3,f=-.7;
 // Nodes 0↔1 and 2↔3: loops a at 0, d at 2, bc and ef; a touches bc, d touches ef.
 const G=[[a,b,0,0],[c,0,0,0],[0,0,d,e],[0,0,f,0]],M=G.map((r,i)=>r.map((v,j)=>(i===j?1:0)-v));
 const expansion=1-(a+d+b*c+e*f)+(a*d+a*e*f+b*c*d+b*c*e*f);near(expansion,detElimination(M),1e-8);
 }
});
test('Lyapunov chain derivative and compact sphere/annulus certificates (96 rotated forms)',()=>{
 for(let k=1;k<=96;k++){const th=k*.17,c=Math.cos(th),s=Math.sin(th),R=[[c,-s],[s,c]],Rt=[[c,s],[-s,c]],lam=1+k/23,P=mul(mul(R,[[1,0],[0,lam]]),Rt),quad=x=>mul(mul([x],P),x.map(v=>[v]))[0][0];
 const x=[Math.cos(k),Math.sin(k)],fx=[-x[0],-x[1]],h=1e-5;near((quad(x.map((v,i)=>v+h*fx[i]))-quad(x.map((v,i)=>v-h*fx[i])))/(2*h),-2*quad(x),1e-8);
 for(let j=0;j<36;j++){const u=[Math.cos(j*Math.PI/18),Math.sin(j*Math.PI/18)];assert.ok(quad(u)>=1-1e-10&&quad(u)<=lam+1e-10);assert.ok(-2*quad(u)<=-2+1e-10);}
 }
});
test('stationary first peak is maximum and later positive peaks decay (144 oscillators)',()=>{
 for(let k=1;k<=144;k++){const z=.01+.98*k/145,w=.2+k/19,d=w*Math.sqrt(1-z*z),t=Math.PI/d,dy=q=>w/Math.sqrt(1-z*z)*Math.exp(-z*w*q)*Math.sin(d*q),y=q=>1-Math.exp(-z*w*q)/Math.sqrt(1-z*z)*Math.sin(d*q+Math.acos(z));
 near(dy(t),0);assert.ok(dy(.99*t)>0&&dy(1.01*t)<0);near(y(t)-1,Math.exp(-Math.PI*z/Math.sqrt(1-z*z)));assert.ok(y(3*t)<=y(t)+1e-12);
 }
});
test('mean-value derivative supremum bounds exact dominant-pole error (18000 points)',()=>{
 for(let k=1;k<=30;k++){const z=.1+.8*(k%10)/10,w=.4+k/17,p=1+k/3,d=w*Math.sqrt(1-z*z),sig=z*w,L=w*Math.exp(-z*Math.acos(z)/Math.sqrt(1-z*z)),B=-w*w/(p*p-2*sig*p+w*w),C=-1-B,D=(p*B+sig*C)/d;
  for(let j=0;j<600;j++){const t=j/50,y2=1-Math.exp(-sig*t)/Math.sqrt(1-z*z)*Math.sin(d*t+Math.acos(z)),y=1+B*Math.exp(-p*t)+Math.exp(-sig*t)*(C*Math.cos(d*t)+D*Math.sin(d*t));assert.ok(Math.abs(y-y2)<=L/p+1e-12);const dy=w/Math.sqrt(1-z*z)*Math.exp(-sig*t)*Math.sin(d*t);assert.ok(Math.abs(dy)<=L+1e-12);}
 }
 // Nonnegative weights are essential for the averaging bound; a signed combination need not contract.
 assert.ok(Math.abs(2*1-1*0)>1);
});
