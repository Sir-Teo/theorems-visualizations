import test from 'node:test';
import assert from 'node:assert/strict';
import { twoByTwoEnvelopes, validEnvelopeMatrix, ENVELOPE_GAMES } from '../content/game/minimax-envelope-audit.js';

const near=(a,b,e=1e-12)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
// Independent support/indifference formulas with exact rational arithmetic.
const frac=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(d<0n){n=-n;d=-d;}return[n,d];};
const number=([n,d])=>Number(n)/Number(d);
const cmp=(a,b)=>a[0]*b[1]-b[0]*a[1];
function exact(A){
 const [[a,b],[c,d]]=A.map(r=>r.map(BigInt)),lo=Math.max(Math.min(...A[0]),Math.min(...A[1])),hi=Math.min(Math.max(A[0][0],A[1][0]),Math.max(A[0][1],A[1][1]));
 const v=lo===hi?frac(lo):frac(a*d-b*c,a-b-c+d);
 // Optimal strategies are exactly the probability-interval solutions of
 // security >= v (row) and ceiling <= v (column), including pure/flat cases.
 const interval=(base,slope,sign)=>{let L=frac(0),H=frac(1);for(let k=0;k<2;k++){
  const s=sign*slope[k],n=sign*(v[0]-base[k]*v[1]);
  if(s===0n){assert.ok(n<=0n);continue;}const x=frac(n,s*v[1]);
  if(s>0n){if(cmp(x,L)>0n)L=x;}else if(cmp(x,H)<0n)H=x;
 }assert.ok(cmp(L,H)<=0n);return[L,H];};
 return{v,p:interval([c,d],[a-c,b-d],1n),q:interval([b,d],[a-b,c-d],-1n)};
}
function check(A){const s=twoByTwoEnvelopes(A),r=exact(A),v=number(r.v);near(s.lower,v);near(s.upper,v);near(s.value,v);assert.ok(s.difference<=s.tolerance);s.pOptimal.forEach((x,i)=>near(x,number(r.p[i])));s.qOptimal.forEach((x,i)=>near(x,number(r.q[i])));
 const g=p=>Math.min(p*A[0][0]+(1-p)*A[1][0],p*A[0][1]+(1-p)*A[1][1]);
 const h=q=>Math.max(q*A[0][0]+(1-q)*A[0][1],q*A[1][0]+(1-q)*A[1][1]);
 for(const p of[s.pOptimal[0],s.p,s.pOptimal[1]])near(g(p),v);for(const q of[s.qOptimal[0],s.q,s.qOptimal[1]])near(h(q),v);
 for(const[curve,f]of[[s.rowCurve,g],[s.columnCurve,h]]){assert.equal(curve[0][0],0);assert.equal(curve.at(-1)[0],1);for(const[x,y]of curve){assert.ok(x>=0&&x<=1);near(y,f(x));}for(let k=0;k<8;k++){const x=(k+.37)/8,i=curve.findIndex(([t])=>t>=x),[a,b]=[curve[i-1],curve[i]];near(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]),f(x));}}
 const saddles=[];A.forEach((r,i)=>r.forEach((x,j)=>{if(A.every(row=>row[j]<=x)&&r.every(y=>y>=x))saddles.push([i,j]);}));assert.deepEqual(s.saddles,saddles);assert.equal(s.pureLower===s.pureUpper,!!saddles.length);
}

test('all19^4 offered integer matrices: exact rational value, full optimal intervals, pure saddles and complete analytic curves agree',()=>{for(let a=-9;a<=9;a++)for(let b=-9;b<=9;b++)for(let c=-9;c<=9;c++)for(let d=-9;d<=9;d++)check([[a,b],[c,d]]);});
test('all retained presets and explicit degeneracies preserve genuine zero differences and whole optimal intervals',()=>{
 Object.values(ENVELOPE_GAMES).forEach(({A})=>check(A));for(const x of[-9,0,9]){const s=twoByTwoEnvelopes([[x,x],[x,x]]);assert.deepEqual(s.pOptimal,[0,1]);assert.deepEqual(s.qOptimal,[0,1]);assert.equal(s.difference,0);assert.equal(s.value,x);assert.equal(s.saddles.length,4);}
 for(const A of[[[1,1],[0,0]],[[1,0],[1,0]],[[0,0],[0,1]],[[2,2],[2,-1]]])check(A);
});
test('one-third optimum exposes the old sampled-extrema error without inventing an epsilon floor',()=>{const s=twoByTwoEnvelopes([[1,-1],[-1,0]]);near(s.p,1/3);near(s.q,1/3);near(s.value,-1/3);const xs=Array.from({length:2001},(_,k)=>k/2000),gridLower=Math.max(...xs.map(s.guarantee)),gridUpper=Math.min(...xs.map(s.ceiling));assert.ok(gridUpper-gridLower>.0004);assert.ok(s.difference<1e-14);});
test('the illustrated matrix schema rejects noninteger, nonfinite, missing, sparse and oversized input',()=>{for(const A of[null,[],Array(2),[Array(2),[0,0]],[[0,0],Array(2)],[[1,2]],[[1,2,3],[4,5,6]],[[1,2],[3,NaN]],[[1,2],[3,Infinity]],[[1,2],[3,1.2]],[[1,2],[3,10]],[[1,2],[3,-10]],[[1,2],[3,'4']]]){assert.equal(validEnvelopeMatrix(A),false);assert.throws(()=>twoByTwoEnvelopes(A));}});
