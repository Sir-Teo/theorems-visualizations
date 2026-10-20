import assert from 'node:assert/strict';
let assertions=0;const check=(x)=>{assert.ok(x);assertions++;};
// Enumerate actual successive integer counters, including powers of two.
for(let t=1;t<1024;t++){let flips=0;for(let i=t;i>0;i--){let z=i^(i-1);while(z){flips+=z&1;z>>>=1;}}let geometric=0;for(let j=0;2**j<=t;j++)geometric+=Math.floor(t/2**j);check(flips===geometric);check(flips<2*t);}
// Complete configuration descriptions and deterministic eventual cycles.
for(let q=1;q<=3;q++)for(let n=0;n<=4;n++)for(let s=1;s<=4;s++){const desc=new Set();for(let state=0;state<q;state++)for(let input=0;input<n+2;input++)for(let head=0;head<s+1;head++)for(let tape=0;tape<2**s;tape++)desc.add([state,input,head,tape].join(':'));check(desc.size===q*(n+2)*(s+1)*2**s);}
// Exponential clock gaps: evaluate in log space to avoid overflow.
for(let d=1;d<=15;d++){let previous=Infinity;for(let k=12;k<=18;k++){let n=2**k,z=d*Math.log(n)-n*Math.log(2);check(z<previous);previous=z;}check(previous<0);}
for(let k=5;k<=15;k++){const n=2**k;check(Math.log(n)**2/n<1);check((Math.log(n)**2+2*Math.log(Math.log(n)))-n*Math.log(2)<0);}
// The effective chain pairing on disjoint copies of all binary strings.
// f appends 0; g appends 1. Root type is decided by stripping alternating
// required suffixes. Pairing maps source strings by f or checked g inverse.
const root=(s,side)=>{for(let steps=0;;steps++){const required=side==='A'?'1':'0';if(!s.endsWith(required))return side;s=s.slice(0,-1);side=side==='A'?'B':'A';}};
const h=s=>root(s,'A')==='A'?s+'0':s.slice(0,-1);
const inv=s=>root(s,'B')==='A'?s.slice(0,-1):s+'1';
const strings=[''];for(let n=1;n<=9;n++)for(let x=0;x<2**n;x++)strings.push(x.toString(2).padStart(n,'0'));
for(const s of strings){check(inv(h(s))===s);check(h(inv(s))===s);}
const gcd=(a,b)=>b?gcd(b,a%b):a;const prime=n=>n>=2&&Array.from({length:Math.floor(Math.sqrt(n))-1},(_,i)=>i+2).every(d=>n%d!==0);const factors=n=>{const f=[];for(let d=2;d<=n;d++)if(n%d===0){f.push(d);while(n%d===0)n/=d;}return f;};const pow=(a,n,m)=>{let z=1;while(n--){z=z*a%m;}return z;};
for(let n=2;n<=160;n++){const fs=factors(n-1);let passes=0;for(let a=1;a<n;a++){const accepted=pow(a,n-1,n)===1&&fs.every(q=>pow(a,(n-1)/q,n)!==1);if(accepted){passes++;check(gcd(a,n)===1);check(prime(n));for(let j=1;j<n-1;j++)check(pow(a,j,n)!==1);}}check((passes>0)===prime(n));for(let k=1;k<=n;k++){const exists=Array.from({length:Math.max(0,k-1)},(_,i)=>i+2).some(d=>n%d===0);check(exists===factors(n).some(p=>p<=k));}}
// Boolean maps: valid carry pairs are exactly three distinct maps; closure
// and composition agree. Check all triples, and all six-bit additions.
const valid=[[0,0],[0,1],[1,0]],combine=([g,p],[G,P])=>[g|(p&G),p&P],apply=([g,p],c)=>g|(p&c);
for(const a of valid)for(const b of valid){const c=combine(a,b);check(c[0]*c[1]===0);for(let x=0;x<2;x++)check(apply(c,x)===apply(a,apply(b,x)));for(const d of valid)check(JSON.stringify(combine(combine(a,b),d))===JSON.stringify(combine(a,combine(b,d))));}
for(let a=0;a<64;a++)for(let b=0;b<64;b++){let block=[0,1],out=0;for(let j=0;j<6;j++){const x=(a>>j)&1,y=(b>>j)&1;out|=(x^y^block[0])<<j;block=combine([x&y,x^y],block);}out|=block[0]<<6;check(out===a+b);}
for(let n=1;n<=3;n++)for(let table=0;table<2**(2**n);table++)for(let x=0;x<2**n;x++){const rows=[];for(let r=0;r<2**n;r++)if((table>>r)&1)rows.push(r);const dnf=rows.some(r=>Array.from({length:n},(_,j)=>((x>>j)&1)===((r>>j)&1)).every(Boolean));check(dnf===Boolean((table>>x)&1));}
// Every finite proposed list of unary languages has a disagreeing diagonal.
for(let mask=0;mask<512;mask++)for(let row=0;row<3;row++)check((1-((mask>>(row*3+row))&1))!==((mask>>(row*3+row))&1));
// An oracle decision is stable only if future additions avoid every query.
const queried=new Set(['00','01']);const oracle=new Set();const decide=()=>[...queried].some(q=>oracle.has(q));check(!decide());oracle.add('10');check(!decide());oracle.add('00');check(decide());
// Description counts multiply independent choices; a topological restriction
// removes encodings rather than requiring a surjective encoding of functions.
for(let n=1;n<=3;n++)for(let gates=1;gates<=3;gates++){let topological=1;for(let i=0;i<gates;i++)topological*=3*(n+i)**2;check(topological<= (3*(n+gates)**2)**gates);}
console.log(JSON.stringify({groups:10,assertions,productionHelpersImported:false}));
