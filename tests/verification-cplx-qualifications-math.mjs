import assert from'node:assert/strict';let checks=0;const eq=(a,b)=>{checks++;assert.deepEqual(a,b);};
// Input-head addresses are independent even with the same state/work contents/head.
for(let n=1;n<=32;n++)for(let s=1;s<=4;s++){const configurations=new Set();for(let input=0;input<n+2;input++)for(let work=0;work<s;work++)for(let tape=0;tape<2**s;tape++)configurations.add([0,input,work,tape].join(','));eq(configurations.size,(n+2)*s*2**s);assert.ok(configurations.size>s*2**s);}
// Without freezing a queried answer, a deterministic earlier decision can change.
const run=oracle=>oracle.has('future')?'accept':'reject',before=new Set(),after=new Set(['future']);eq(run(before),'reject');eq(run(after),'accept');
// A fresh selected length exceeding all earlier queried/chosen lengths avoids every saved string.
const saved=new Map();let maxLength=0;for(let stage=1;stage<=20;stage++){const n=maxLength+1,queries=['0'.repeat(n),'1'.repeat(n+2)];for(const q of queries){eq(saved.has(q),false);saved.set(q,0);}const chosen='1'.repeat(n);eq(saved.has(chosen),false);saved.set(chosen,1);maxLength=Math.max(n,...queries.map(q=>q.length));for(const[q,answer]of saved)if(answer===1)eq(q.length<=maxLength,true);}
// A computable whole-string permutation swaps 0^a_j with 0^b_j and fixes all
// other strings, where a_j=2^((2j)!) and b_j=2^((2j+1)!). Distinct factorial
// exponents make the pairs disjoint. Since b_j=a_j^(2j+1), no fixed polynomial
// bounds output length. Check logarithms exactly without allocating enormous strings.
const fact=n=>{let a=1n;for(let i=2n;i<=BigInt(n);i++)a*=i;return a;};
for(let j=1;j<=12;j++){const logA=fact(2*j),logB=fact(2*j+1);eq(logB,BigInt(2*j+1)*logA);for(let degree=1;degree<=2*j;degree++){assert.ok(logB>BigInt(degree)*logA);checks++;}}
// Range checks matter: a partial inverse on f(x)=0x has no preimage for strings beginning 1.
const forward=x=>'0'+x,inverse=y=>y.startsWith('0')?y.slice(1):null;for(const x of['','0','1','010','111']){eq(inverse(forward(x)),x);eq(inverse('1'+x),null);}
console.log({qualificationChecks:checks,productionHelpersImported:false});
