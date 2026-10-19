import test from 'node:test';
import assert from 'node:assert/strict';
import {SN} from '../content/solid/ch04.shared.js';
import {fatigueSlope,fatigueStress,fatigueLife,fatigueBatch,minerBlocks,meanStressState} from '../content/solid/source-audit-fatigue.js';
const close=(a,b,e=2e-10)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('Independent interpolation in logarithmic anchor coordinates verifies each finite S–N inverse and rejects unsupported high stress',()=>{
  for(const m of Object.values(SN)){
    const y0=Math.log10(.9*m.Su),y1=Math.log10(m.Se),x0=3,x1=Math.log10(m.Nk);
    close(fatigueSlope(m),(y1-y0)/(x1-x0));
    close(fatigueStress(m,1000),.9*m.Su);close(fatigueStress(m,m.Nk),m.Se);
    for(let S=80;S<=440;S++){
      const p=fatigueLife(m,S);
      if(S>.9*m.Su){assert.equal(p.kind,'outside');assert.equal(p.N,null);continue;}
      if(m.limit&&S<=m.Se){assert.equal(p.kind,'plateau');assert.equal(p.N,Infinity);continue;}
      const x=x0+(Math.log10(S)-y0)*(x1-x0)/(y1-y0);
      assert.equal(p.kind,'finite');close(Math.log10(p.N),x);close(fatigueStress(m,p.N),S);
    }
    assert.equal(fatigueStress(m,999),null);
    for(const N of[1e3,1e4,1e6,5e8,1e9]){const S=fatigueStress(m,N);if(!(m.limit&&N>=m.Nk))close(Math.log10(S),y0+(Math.log10(N)-x0)*(y1-y0)/(x1-x0));}
  }
});

test('Chosen log-normal specimen draws retain censoring for both models; run-outs never become false failure observations',()=>{
  const zs=[-2,-1,0,1,2];
  for(const m of Object.values(SN))for(const S of[80,245,260,279,280,300,440]){
    const stop=m.limit?1e7:1e9,p=fatigueBatch(m,S,zs,stop),life=fatigueLife(m,S);
    if(life.kind==='outside'){assert.deepEqual(p.specimens,[]);continue;}
    assert.equal(p.specimens.length,zs.length);
    p.specimens.forEach((q,i)=>{const raw=life.N*Math.exp(zs[i]*.25*Math.log(10));close(q.N,Math.min(stop,raw));assert.equal(q.censored,raw>stop);if(q.censored)assert.equal(q.N,stop);});
  }
  assert.ok(fatigueBatch(SN.al,80,zs,1e9).specimens.some(q=>q.censored));
  assert.ok(fatigueBatch(SN.steel,245,zs,1e7).specimens.every(q=>q.censored));
  assert.equal(fatigueBatch(SN.al,440,zs,1e9).kind,'outside');
});

test('The identical cycle bins give the same Miner sum after permutation; independent incremental integration verifies paths and threshold crossings',()=>{
  for(const NA of[1000,17000,1e6])for(const NB of[1000,53000,1e6])for(const f of[0,.02,.25,.5,.98,1])for(const q of[0,.6,1,1.8]){
    const p=minerBlocks(NA,NB,f,q),counts={A:NA*f*q,B:NB*(1-f)*q},lives={A:NA,B:NB};
    for(const [seq,order] of[[p.ab,['A','B']],[p.ba,['B','A']]]){
      let n=0,D=0,cross=null;
      for(const k of order){const step=counts[k]/1000;for(let j=0;j<1000;j++){const before=D;D+=step/lives[k];if(cross===null&&before<1&&D>=1-1e-12)cross=n+(1-before)*lives[k];n+=step;}}
      close(seq.total,n);close(seq.damage,D);close(seq.damage,q);close(seq.total,counts.A+counts.B);
      if(q<1)assert.equal(seq.crossing,null);else {assert.notEqual(seq.crossing,null);assert.notEqual(cross,null);close(seq.crossing,cross,3e-9);}
      close(seq.points[1][0],counts[order[0]]);close(seq.points[1][1],counts[order[0]]/lives[order[0]]);
      assert.deepEqual(seq.blocks.map(b=>b.key),order);
    }
    close(p.ab.damage,p.ba.damage);close(p.ab.total,p.ba.total);
  }
  const example=minerBlocks(100,1000,.25,1.2);close(example.ab.crossing,730);close(example.ba.crossing,910);close(example.ab.damage,1.2);
});

test('Independent ray bisection verifies all three mean-stress factors and symmetric yield, including zero and almost axial loads',()=>{
  function root(fn){let hi=1;while(fn(hi)<1)hi*=2;let lo=0;for(let i=0;i<130;i++){const mid=(lo+hi)/2;if(fn(mid)<1)lo=mid;else hi=mid;}return(lo+hi)/2;}
  for(const m of Object.values(SN))for(const sm of[-200,-100,0,1e-14,40,180,310,490,560])for(const sa of[0,1e-14,40,90,245,300]){
    const p=meanStressState(m,sm,sa);
    for(const kind of['goodman','gerber','soderberg']){
      const power=kind==='gerber'?2:1,strength=kind==='soderberg'?m.Sy:m.Su;
      if(sa===0&&sm<=0){assert.equal(p[kind],Infinity);continue;}
      const fn=n=>n*sa/m.Se+(n*Math.max(0,sm)/strength)**power;
      const n=root(fn);close(p[kind],n);close(fn(p[kind]),1);
    }
    const yieldLoad=n=>Math.max(Math.abs(n*(sm+sa)),Math.abs(n*(sm-sa)))/m.Sy;
    if(sm===0&&sa===0)assert.equal(p.yieldFactor,Infinity);else {close(p.yieldFactor,root(yieldLoad));close(yieldLoad(p.yieldFactor),1);}
    assert.equal(p.admitted,sa/m.Se+Math.max(0,sm)/m.Su<=1&&Math.max(Math.abs(sm+sa),Math.abs(sm-sa))<=m.Sy);
  }
  const compression=meanStressState(SN.steel,-200,200);
  assert.ok(compression.goodman>1);assert.ok(compression.yieldFactor<1);assert.ok(!compression.admitted);
});
