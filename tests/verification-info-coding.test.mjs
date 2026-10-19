import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {probabilityWeights,sfeCode,arithmeticEncode,containedDyadic,commonBinaryPrefix,ceilSurprisal} from '../content/info/coding-audit.shared.js';
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<t,`${a} ≈ ${b}`);
test('SFE reproduces the primary 1991 textbook examples and correct empty-word convention',()=>{
 const a=sfeCode([.25,.5,.125,.125]);assert.deepEqual(a.rows.map(r=>r.w),['001','10','1101','1111']);near(a.L,2.75);near(a.H,1.75);
 const b=sfeCode([.25,.25,.2,.15,.15]);assert.deepEqual(b.rows.map(r=>r.w),['001','011','1001','1100','1110']);
 for(const extra of [0,1]){const r=sfeCode([0,1,0],extra);assert.equal(r.rows.length,1);assert.equal(r.rows[0].w,extra?'1':'');assert.equal(r.L,extra);assert.equal(r.pf,true);assert.equal(r.allIn,true);}
 assert.equal(sfeCode([.25,.5,.125,.125],0).pf,false);
});
test('SFE exact containment, prefix and average bounds for every four-symbol integer composition through total24',()=>{
 for(let n=1;n<=24;n++)for(let a=0;a<=n;a++)for(let b=0;b<=n-a;b++)for(let c=0;c<=n-a-b;c++){
  const r=sfeCode([a,b,c,n-a-b-c]);assert.equal(r.pf,true);assert.equal(r.allIn,true);assert.ok(r.L>=r.H+1-2e-12&&r.L<r.H+2);
  for(const x of r.rows){const scale=1n<<BigInt(x.l);assert.ok(x.k*x.denominator>=x.left*scale);assert.ok((x.k+1n)*x.denominator<=x.right*scale);}
 }
});
test('exact binary64 weights preserve distinctions around dyadic length boundaries and subnormal support',()=>{
 const below=.5-2**-54,above=.5+2**-52;
 assert.equal(sfeCode([below,1-below]).rows[0].l,3);assert.equal(sfeCode([.5,.5]).rows[0].l,2);assert.equal(sfeCode([above,1-above]).rows[0].l,2);
 const r=sfeCode([Number.MIN_VALUE,1]);assert.equal(r.rows[0].l,1076);assert.equal(r.allIn,true);assert.equal(r.pf,true);assert.ok(r.rows[0].w.length>1000);
 assert.throws(()=>probabilityWeights([0,0]),RangeError);assert.throws(()=>probabilityWeights([-1,2]),RangeError);
});
test('arithmetic endpoints and shortest prefix cells match independently enumerated Python Fraction block CDFs',()=>{
 const refs=JSON.parse(readFileSync(new URL('../docs/verification/info-coding-references.json',import.meta.url)));
 for(const g of refs.groups)for(const row of g.rows){const r=arithmeticEncode(row.text,g.p,g.adaptive);if(row.error){assert.ok(r.error);continue;}assert.equal(r.L*BigInt(row.ld),BigInt(row.L)*r.D);assert.equal(r.U*BigInt(row.ud),BigInt(row.U)*r.D);assert.equal(r.code,row.code);assert.equal(r.decoded,row.text);assert.equal(r.ok,true);}
});
test('all 729 length-six ternary messages have disjoint dyadic cells and exact round trips under fixed/adaptive models',()=>{
 for(const adaptive of [false,true])for(const p of [[.6,.3,.1],[.25,.5,.25]]){
  const codes=[];for(let k=0;k<729;k++){let t=k,text='';for(let j=0;j<6;j++){text='abc'[t%3]+text;t=Math.floor(t/3);}const r=arithmeticEncode(text,p,adaptive),scale=1n<<BigInt(r.l);assert.ok(r.k*r.D>=r.L*scale);assert.ok((r.k+1n)*r.D<=r.U*scale);assert.equal(r.decoded,text);assert.ok(r.l<r.logP+2+1e-12);codes.push(r.code);}
  for(let i=0;i<codes.length;i++)for(let j=0;j<codes.length;j++)if(i!==j)assert.equal(codes[j].startsWith(codes[i]),false);
 }
});
test('dyadic minimality, common-prefix half-open endpoints, long tiny probabilities and invalid inputs',()=>{
 for(let d=1;d<=36;d++)for(let l=0;l<d;l++)for(let u=l+1;u<=d;u++){
  const r=containedDyadic(BigInt(l),BigInt(u),BigInt(d));for(let k=0;k<r.l;k++)for(let j=0;j<2**k;j++)assert.ok(j*d<l*2**k||(j+1)*d>u*2**k);
 }
 assert.equal(commonBinaryPrefix(1n,2n,4n),'01');assert.equal(commonBinaryPrefix(0n,1n,1n),'');assert.equal(ceilSurprisal(1n,8n),3);
 const r=arithmeticEncode('cccccccccccccc',[1,1,Number.MIN_VALUE]);assert.ok(r.l>15000);assert.equal(r.ok,true);assert.ok(Number.isFinite(r.logP));
 assert.ok(arithmeticEncode('b',[1,0,0]).error);assert.ok(arithmeticEncode('Ab!',[.3,.3,.4]).error);assert.equal(arithmeticEncode('aaaaaaaaaaaaaa',[1,0,0]).code,'');
});
