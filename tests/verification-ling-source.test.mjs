import test from 'node:test';
import assert from 'node:assert/strict';
import {wordModel,wordProb,perplexity,generateWords,letterModel,toSyms,idealGuessProfile,shannonBounds} from '../content/ling/ch04.shared.js';
const near=(a,b,e=1e-12)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('terminal contexts count only observed continuations, and short initial histories use the available order',()=>{
 const M=wordModel(['alpha','beta','alpha','beta']);near(wordProb(M,['beta','alpha'],1,2,'add',0),1);
 near(wordProb(M,['alpha'],0,4,'add',0),.5);assert.ok(M.vocab.has('<unk>'));
});
test('every smoothed conditional distribution normalizes, including unseen histories and unknown words',()=>{
 const M=wordModel(['alpha','beta','alpha','beta','gamma']);
 for(const mode of ['add','interp'])for(const lam of [.001,.1,1])for(let n=1;n<=4;n++)for(const h of [[],['alpha'],['beta'],['missing','beta','missing']]){
  const p=[...M.vocab].map(w=>wordProb(M,[...h,w],h.length,n,mode,lam));near(p.reduce((a,b)=>a+b,0),1);assert.ok(p.every(x=>x>=0&&x<=1));
 }
});
test('zero likelihood really gives infinite perplexity and generation follows selected smoothing',()=>{
 const M=wordModel(['alpha','beta','alpha','beta']);assert.equal(perplexity(M,['missing'],1,'add',0),Infinity);
 // At the initial position, add-one puts alpha,beta,unknown at 3/7,3/7,1/7. A .9 draw must be unknown.
 assert.deepEqual(generateWords(M,1,1,()=>.9,'add',1),['<unk>']);
 // In the interpolation mixture the unknown token has probability .02/(.22*3); .9 is still beta.
 assert.deepEqual(generateWords(M,1,1,()=>.9,'interp',0),['beta']);
 near(perplexity(M,['alpha','beta'],1,'add',0),2);
});
test('ideal guess profile agrees with independently enumerated conditional source entropy and Shannon bounds',()=>{
 // Six a-context successors: four a, two b; two b-context successors: a,b. Context mass is explicit.
 const counts=new Float32Array(27*27);counts[0]=4;counts[1]=2;counts[27]=1;counts[28]=1;
 const P=idealGuessProfile({counts:[null,counts]},1), h=(2/3)*-Math.log2(2/3)+(1/3)*-Math.log2(1/3);
 near(P.entropy,.75*h+.25);near(P.q[0],5/8);near(P.q[1],3/8);near(P.q.reduce((a,b)=>a+b,0),1);
 const B=shannonBounds(P.q);near(B.lower,.75);assert.ok(B.lower<=P.entropy&&P.entropy<=B.upper);
 for(let k=0;k<=3;k++){const p=idealGuessProfile(letterModel(toSyms('aaab aaab abba abba aaba'),3),k),b=shannonBounds(p.q);assert.ok(p.q.every((v,i)=>!i||v<=p.q[i-1]));assert.ok(b.lower<=p.entropy+1e-12&&p.entropy<=b.upper+1e-12);}
});
