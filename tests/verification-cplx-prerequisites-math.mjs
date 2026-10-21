// Explicit independent arithmetic/combinatorial witnesses; no production helper imports.
import assert from 'node:assert/strict';let checks=0;const eq=(a,b)=>{checks++;assert.deepEqual(a,b);},ok=x=>{checks++;assert.ok(x);};
// Full binary countdown: independently count actual bit transitions and compare geometric bound.
for(let T=1;T<=1024;T++){let flips=0;for(let n=T;n>0;n--){let a=n,b=n-1;while(a||b){flips+=(a&1)!==(b&1);a>>=1;b>>=1;}}let sum=0;for(let j=0;2**j<=T;j++)sum+=Math.floor(T/2**j);eq(flips,sum);ok(flips<2*T);}
// Product count and deterministic repetition: enumerate complete descriptions, including input head.
for(let states=1;states<=4;states++)for(let cells=1;cells<=4;cells++)for(let alpha=2;alpha<=3;alpha++){const seen=new Set();for(let q=0;q<states;q++)for(let h=0;h<cells;h++)for(let t=0;t<alpha**cells;t++)seen.add([q,h,t].join(':'));eq(seen.size,states*cells*alpha**cells);}
for(let N=1;N<=8;N++)for(let seed=0;seed<20;seed++){const next=Array.from({length:N},(_,i)=>(i*i+seed+1)%N),path=[],first=new Map();let x=0;while(!first.has(x)){first.set(x,path.length);path.push(x);x=next[x];}ok(path.length<=N);const cycle=path.slice(first.get(x));let y=x;for(let k=0;k<4*cycle.length;k++){eq(y,cycle[k%cycle.length]);y=next[y];}}
// Analytical log-scale witnesses: no floating overflow and fixed powers only.
for(let d=1;d<=12;d++){let prev=Infinity;for(let n=128;n<=32768;n*=2){const logRatio=d*Math.log(n)-n*Math.LN2;ok(logRatio<prev);prev=logRatio;}ok(prev< -10000);}
for(let n=256;n<=1048576;n*=2){const logn=Math.log(n),ratio=logn*logn/n;ok(ratio<.13);ok(logn*logn+2*Math.log(logn)-n*Math.LN2<0);}
// Effective Schroeder-Bernstein: f(a)=2a, g(b)=2b+1 on disjoint N copies.
// The inverse/range predicates are explicit; strict increase in a binary-length code can be
// obtained by prefix encodings. This integer witness independently checks chain ownership.
const classify=(side,x)=>{let steps=0;for(;;){if(side==='A'){if(x%2===0)return['A',steps];x=(x-1)/2;side='B';}else{if(x%2===1)return['B',steps];x=x/2;side='A';}steps++;assert.ok(steps<100);}};
const h=a=>classify('A',a)[0]==='A'?2*a:(a-1)/2;
const inv=b=>classify('B',b)[0]==='A'?b/2:2*b+1;
const image=new Set();for(let a=0;a<2048;a++){const b=h(a);ok(Number.isInteger(b)&&b>=0);eq(inv(b),a);ok(!image.has(b));image.add(b);}for(let b=0;b<2048;b++)eq(h(inv(b)),b);
// Classical existence alone cannot decide root ownership on an arbitrary infinite chain;
// no generic computability claim is tested or inferred from this explicit example.
const gcd=(a,b)=>b?gcd(b,a%b):a,prime=n=>n>=2&&Array.from({length:Math.max(0,Math.floor(Math.sqrt(n))-1)},(_,i)=>i+2).every(d=>n%d),pow=(a,k,n)=>{let z=1;while(k){if(k%2)z=z*a%n;a=a*a%n;k=Math.floor(k/2);}return z;},factors=n=>{const out=[];for(let d=2;d*d<=n;d++)if(n%d===0){out.push(d);while(n%d===0)n/=d;}if(n>1)out.push(n);return out;};
for(let n=2;n<=200;n++){const qs=factors(n-1);let accepts=0;for(let g=1;g<n;g++){const pass=pow(g,n-1,n)===1&&qs.every(q=>pow(g,(n-1)/q,n)!==1);if(pass){accepts++;ok(prime(n));}if(gcd(g,n)===1){let k=1;while(pow(g,k,n)!==1)k++;for(let m=1;m<=2*n;m++)eq(pow(g,m,n)===1,m%k===0);if(pass)eq(k,n-1);}}eq(accepts>0,prime(n));}
// Prime-factor threshold decisions independently exhaust all divisors, including N=1.
for(let n=1;n<=300;n++)for(let k=0;k<=n+1;k++){const list=factors(n),hasDiv=Array.from({length:Math.max(0,k-1)},(_,j)=>j+2).some(d=>n%d===0);eq(hasDiv,list.some(p=>p<=k));}
// All Boolean functions through n=3: canonical minterms agree with every truth-table row.
for(let n=1;n<=3;n++)for(let table=0;table<2**(2**n);table++)for(let row=0;row<2**n;row++){let out=false;for(let chosen=0;chosen<2**n;chosen++)if(table>>chosen&1){let term=true;for(let j=0;j<n;j++)term&&=(row>>j&1)===(chosen>>j&1);out||=term;}eq(out,!!(table>>row&1));}
// Product-count over-encodings: earlier-wire constraint only decreases the raw count.
for(let n=1;n<=5;n++)for(let s=1;s<=8;s++){let actual=1;for(let j=0;j<s;j++)actual*=3*(n+j)**2;ok(actual<=(3*(n+s)**2)**s);}
// Finite diagonal witnesses stand in for, but do not assert a finite proof of, Cantor on N.
for(let N=1;N<=12;N++){const rows=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>((i+2)*(j+3)+j)%2)),diagonal=rows.map((r,i)=>1-r[i]);for(let i=0;i<N;i++)ok(diagonal[i]!==rows[i][i]);}
// Carry map domains and faithful valid representation; also test all four formal pairs.
const pairs=[[0,0],[0,1],[1,0],[1,1]],valid=pairs.slice(0,3),combine=([g,p],[h,q])=>[g|(p&h),p&q],evalPair=([g,p],c)=>g|(p&c);
for(const a of pairs)for(const b of pairs)for(const c of pairs){eq(combine(combine(a,b),c),combine(a,combine(b,c)));for(const input of[0,1])eq(evalPair(combine(a,b),input),evalPair(a,evalPair(b,input)));}
eq(new Set(valid.map(p=>[evalPair(p,0),evalPair(p,1)].join(''))).size,3);for(const a of valid)for(const b of valid)eq(combine(a,b)[0]&combine(a,b)[1],0);eq([evalPair([1,0],0),evalPair([1,0],1)],[evalPair([1,1],0),evalPair([1,1],1)]);
for(let n=1;n<=6;n++)for(let a=0;a<2**n;a++)for(let b=0;b<2**n;b++){let state=[0,1];for(let i=0;i<n;i++){const x=a>>i&1,y=b>>i&1;state=combine([x&y,x^y],state);eq(state[0],(a%(2**(i+1))+b%(2**(i+1)))>=2**(i+1)?1:0);}}
console.log({independentGroups:12,checks,productionHelpersImported:false});
