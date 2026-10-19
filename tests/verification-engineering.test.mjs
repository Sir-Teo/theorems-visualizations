import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as M from '../assets/js/viz/math.js';
import { arithmeticTag } from '../content/info/ch04.shared.js';
import { tf,second,stepExact } from '../content/ctrl/ch04.shared.js';
import tech from '../content/tech/ch04.js';
import signals from '../content/sig/ch04-d.js';
import fa from '../content/fa/ch03-a5.js';

const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} versus ${b}`);
test('Arithmetic tags contain an entire dyadic cell: exhaustive exact rational interval check',()=>{
  // Independent integer interval recurrence for probabilities (4,3,1)/8.
  for(let n=1;n<=6;n++){
    const words=[];
    function enumerate(a,b,d,text){
      if(text.length===n){
        const z=arithmeticTag(Number(a)/Number(d),Number(b)/Number(d));assert.ok(z);
        const scale=1n<<BigInt(z.bits),j=z.bits?BigInt('0b'+z.code):0n;
        assert.ok(j*d>=a*scale);assert.ok((j+1n)*d<=b*scale);
        assert.ok(z.bits<Math.log2(Number(d)/Number(b-a))+2);
        // Decode by comparing rational endpoints, independently of floating implementation.
        let aa=0n,bb=1n,dd=1n,decoded='';
        for(let t=0;t<n;t++){
          const w=bb-aa,cs=[0n,4n,7n,8n];let k=0;
          while(k<2&&j*dd*8n>=(aa*8n+w*cs[k+1])*scale)k++;
          bb=aa*8n+w*cs[k+1];aa=aa*8n+w*cs[k];dd*=8n;decoded+='abc'[k];
        }
        assert.equal(decoded,text);words.push(z.code);return;
      }
      const w=b-a,cs=[0n,4n,7n,8n];
      for(let k=0;k<3;k++)enumerate(a*8n+w*cs[k],a*8n+w*cs[k+1],d*8n,text+'abc'[k]);
    }
    enumerate(0n,1n,1n,'');
    for(let i=0;i<words.length;i++)for(let j=0;j<words.length;j++)if(i!==j)assert.ok(!words[j].startsWith(words[i]));
  }
});
test('Arithmetic tag handles deterministic known-length messages and precision failures explicitly',()=>{
  assert.equal(arithmeticTag(0,1).code,'');
  for(const p of [[0,0],[.4,.3],[-.1,.5],[0,1.1],[1-2**-53,1]])assert.equal(arithmeticTag(...p),null);
  assert.equal(arithmeticTag(.32,.3328).bits,7); // Complete cell, independently of CT's midpoint example.
});
test('Second-order sampled response agrees with closed-form damped motion and the corrected settling envelope',()=>{
  for(const z of [.2,.5,.707,.9]){
    const w=1.7,wd=w*Math.sqrt(1-z*z),r=stepExact(M,second(z,w),30,3000);
    const ts=Math.log(50/Math.sqrt(1-z*z))/(z*w);
    for(let k=0;k<r.t.length;k++){
      const t=r.t[k],want=1-Math.exp(-z*w*t)*(Math.cos(wd*t)+z/Math.sqrt(1-z*z)*Math.sin(wd*t));
      close(r.y[k],want,2e-11);if(t>=ts)assert.ok(Math.abs(r.y[k]-1)<=.02+1e-11);
    }
  }
});
test('Added-pole response agrees with independent convolution and its exact modal residue',()=>{
  for(const [z,p] of [[.2,1],[.5,3],[.9,12]]){
    const sys=tf([p],[p,1+2*z*p,p+2*z,1]),r=stepExact(M,sys,8,800),wd=Math.sqrt(1-z*z);
    const y2=t=>1-Math.exp(-z*t)*(Math.cos(wd*t)+z/wd*Math.sin(wd*t));
    for(const t of [.4,2,6]){
      const N=10000,h=t/N;let integral=0;
      for(let k=0;k<=N;k++){const u=k*h;integral+=(k===0||k===N?1:k%2?4:2)*p*Math.exp(-p*(t-u))*y2(u)*h/3;}
      close(r.y[Math.round(t*100)],integral,3e-8);
    }
    const B=-1/(p*p-2*z*p+1);close(B,-1/((p-z)**2+wd*wd));
  }
});
test('A five-to-one decay-rate ratio does not guarantee a small discarded mode at low damping',()=>{
  const z=.2,p=5*z;assert.ok(Math.abs(-1/(p*p-2*z*p+1))>.6);
});
function replay(item,values={}){
  const stages=[];let draw,read;const ctl=value=>({value,set(x){this.value=x}});
  const v={M,fix:(x,n)=>x.toFixed(n),legend(){},invalidate(){},slider:(l,a,b,x)=>ctl(values[l]??x),select:(l,o,x)=>ctl(values[l]??x),render:f=>draw=f,readout:f=>read=f,
    stage(options){const calls=[];const s=new Proxy({calls,options},{get(t,k){return k in t?t[k]:(...a)=>{calls.push([k,...a]);return s}}});stages.push(s);return s}};
  item.viz(v);draw();return {stages,read};
}
test('Smeaton replay uses all original Power/Effect rows and corrected Table II row 2',()=>{
  const {stages,read}=replay(tech.items.find(i=>i.num==='4.5'));
  const dots=stages[0].calls.filter(c=>c[0]==='dot');assert.equal(dots.length,43);
  close(dots[28][2],1060/1520);close(dots[9][2],117/404.7);close(dots[19][2],541/1734);
  const click=stages[0].calls.find(c=>c[0]==='onClick')[1];
  click(2,1060/1520);assert.match(read(),/Table II no. 2:.*water 56.667.*16.25 turns.*effect 1060/);
});
test('Fourier divergent-block global bound is a genuine upper bound and its partial sums grow',()=>{
  const N=100000,h=Math.PI/N;let si=0;for(let k=0;k<N;k++){const t=(k+.5)*h;si+=Math.sin(t)/t*h;}
  const bound=2*si*Math.PI**2/6;assert.ok(bound>6.09&&bound<6.10);
  const {stages}=replay(signals.items.find(i=>i.num==='4.13'));
  const red=stages[1].calls.find(c=>c[0]==='hline');assert.equal(red[1],6.10);
  assert.ok(Math.log(2)*14>6.10);
});
test('Restored FA 3.32 scalar probe has exact circle maximum and valid first/second Cauchy coefficient bounds',()=>{
  for(const a of [0,.37,1])for(const theta of [0,35,90])for(const R of [.2,2,20]){
    const {stages,read}=replay(fa.items.find(i=>i.num==='3.32'),{'nonconstant coefficient $a$':a,'functional angle $\\theta$ (degrees)':theta,'circle radius $R$':R});
    const c=Math.cos(theta*Math.PI/180),s=Math.sin(theta*Math.PI/180),bound=c+s+a*c*R+a*s*R*R;
    const curve=stages[0].calls.find(q=>q[0]==='path')[1];
    close(Math.max(...curve.map(([x,y])=>Math.hypot(x,y))),bound,1e-10);
    assert.ok(a*c<=bound/R+1e-12);assert.ok(a*s<=bound/(R*R)+1e-12);
    assert.match(read(),a===0?/Every scalar probe is bounded/:/not weakly bounded/);
  }
});
