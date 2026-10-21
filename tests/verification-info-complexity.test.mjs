import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ktPrefixBounds, ktDescription, lzPrefixEncode, lzPrefixDecode, simulationBits, complexityPlotData } from '../content/info/complexity-audit.shared.js';

const refs = JSON.parse(fs.readFileSync(new URL('../docs/verification/info-complexity-references.json',import.meta.url)));
const near = (a,b,t=1e-11) => assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const choose = (n,k) => { let x=1n; for(let j=1;j<=k;j++) x=x*BigInt(n-k+j)/BigInt(j); return x; };
const words = n => Array.from({length:2**n},(_,j) => Uint8Array.from(j.toString(2).padStart(n,'0').slice(-n),Number));
const gcd = (a,b) => b ? gcd(b,a%b) : a;

test('KT exact integer ceilings match 100-digit beta-integral references, including all-equal strings',() => {
  for (const r of refs.kt) {
    const q = ktPrefixBounds(r.n,[r.ones])[0];
    assert.equal(q.ceilLoss,r.ceil); assert.equal(q.prefixBits,r.prefix);
    const x = Uint8Array.from({length:r.n},(_,j) => Number(j<r.ones));
    near(ktDescription(x).ideal,+r.ideal,3e-12);
  }
});

test('KT probabilities are normalized and equal independently multiplied sequential fractions',() => {
  for (let n=1;n<=30;n++) {
    const rows=ktPrefixBounds(n,Array.from({length:n+1},(_,j)=>j));
    const total=rows.reduce((s,q,k)=>s+choose(n,k)*q.numerator,0n);
    assert.equal(total,1n<<BigInt(2*n));
  }
  for (let n=1;n<=10;n++) for (const x of words(n)) {
    let a=1n,d=1n,n0=0,n1=0;
    for (const bit of x) { a*=BigInt(2*(bit?n1:n0)+1);d*=BigInt(2*(n0+n1+1));if(bit)n1++;else n0++;const g=gcd(a,d);a/=g;d/=g; }
    const q=ktPrefixBounds(n,[n1])[0];
    assert.equal(a*(1n<<BigInt(2*n)),q.numerator*d);
  }
});

test('constructive KT midpoint code has the advertised integer length and is prefix free for each known n',() => {
  for (let n=1;n<=10;n++) {
    const rows=words(n).map(x=>({x,q:ktDescription(x)})),D=1n<<BigInt(2*n),code=[];
    let F=0n;
    for(const {q} of rows) {
      const scale=1n<<BigInt(q.prefixBits),k=(2n*F+q.numerator)*scale/(2n*D);
      assert.ok(k*D>=F*scale);assert.ok((k+1n)*D<=(F+q.numerator)*scale);
      code.push(k.toString(2).padStart(q.prefixBits,'0'));F+=q.numerator;
    }
    assert.equal(F,D);code.sort();for(let i=1;i<code.length;i++)assert.ok(!code[i].startsWith(code[i-1]));
  }
});

const independentPairLength = x => {
  const dict=[''];let word='',bits=0,count=0;
  for(let i=0;i<x.length;i++) {
    const next=word+x[i];
    if(dict.includes(next)&&i+1<x.length){word=next;continue;}
    bits+=Math.ceil(Math.log2(++count))+1;dict.push(next);word='';
  }
  return bits;
};
test('emitted LZ pair codes decode exactly, are prefix free conditional on n, and handle repeated terminal phrases',() => {
  for(let n=1;n<=12;n++) {
    const codes=[];
    for(const x of words(n)) {
      const q=lzPrefixEncode(x),d=lzPrefixDecode(q.code,n);
      assert.deepEqual(d.bits,x);assert.equal(d.consumed,q.bitLength);
      assert.equal(q.bitLength,independentPairLength(x));codes.push(q.code);
    }
    codes.sort();for(let i=1;i<codes.length;i++)assert.ok(!codes[i].startsWith(codes[i-1]));
  }
  assert.equal(lzPrefixEncode(Uint8Array.of(0,0)).pairs.at(-1).repeated,true);
  assert.equal(lzPrefixEncode(new Uint8Array()).code,'');
  assert.throws(()=>lzPrefixDecode('1',3),/truncated/);
  assert.throws(()=>lzPrefixEncode([0,2]),/binary/);
});

test('type-count/rank prefix code supplies the expectation bound for arbitrary finite iid laws',() => {
  for(const p of [[.17,.83],[0,1],[.1,.3,.6]])for(let n=1;n<=6;n++) {
    const m=p.length,b=Math.ceil(Math.log2(n+1)),byType=new Map(),seq=[];
    for(let j=0;j<m**n;j++) {
      let z=j;const x=Array(n).fill(0);for(let k=n-1;k>=0;k--){x[k]=z%m;z=Math.floor(z/m);}
      const counts=Array(m).fill(0);let prob=1;for(const v of x){counts[v]++;prob*=p[v];}
      const key=counts.join(',');if(!byType.has(key))byType.set(key,[]);byType.get(key).push(x.join(''));seq.push({x:x.join(''),key,counts,prob});
    }
    const codes=[];let expected=0,elogM=0,ht=0;
    for(const row of seq) {
      const type=byType.get(row.key),M=type.length,l=Math.ceil(Math.log2(M)),rank=type.indexOf(row.x),code=row.counts.map(c=>c.toString(2).padStart(b,'0')).join('')+(l?rank.toString(2).padStart(l,'0'):'');
      assert.equal(code.length,m*b+l);codes.push(code);expected+=row.prob*code.length;elogM+=row.prob*Math.log2(M);
      const recovered=Array.from({length:m},(_,j)=>parseInt(code.slice(j*b,(j+1)*b),2));
      assert.deepEqual(recovered,row.counts);assert.equal(type[l?parseInt(code.slice(m*b),2):0],row.x);
    }
    for(const [key,type]of byType){const mass=seq.filter(x=>x.key===key).reduce((s,x)=>s+x.prob,0);if(mass)ht-=mass*Math.log2(mass);assert.ok(type.length>0);}
    const H=-p.reduce((s,q)=>s+(q?q*Math.log2(q):0),0);
    near(elogM+ht,n*H);assert.ok(expected<=n*H+m*b+1+1e-12);
    codes.sort();for(let i=1;i<codes.length;i++)assert.ok(!codes[i].startsWith(codes[i-1]));
  }
});

test('both simulations are reproducible fixed algorithms and resampling changes their strings',() => {
  for(const mode of ['coin','prng']) {
    const x=simulationBits(1000,.3,mode,9,'same');
    assert.deepEqual(x,simulationBits(1000,.3,mode,9,'same'));
    assert.deepEqual(x.subarray(0,100),simulationBits(100,.3,mode,9,'same'));
    assert.notDeepEqual(x,simulationBits(1000,.3,mode,10,'same'));
  }
});

test('all convergence marks use actual prefix code lengths, including exact LZ phrase boundaries',() => {
  const n=137,p=.15,seed=9,q=complexityPlotData(n,p,'coin',seed),x=simulationBits(20000,p,'coin',seed,`follow|${p}`);
  assert.equal(q.selected.n,n);assert.equal(q.final.n,20000);
  for(const row of q.curve) {
    const prefix=x.subarray(0,row.n);
    near(row.lz*row.n,independentPairLength(prefix),1e-13);
    near(row.kt*row.n,ktDescription(prefix).prefixBits,1e-13);
  }
  const full=lzPrefixEncode(x);
  for(const pair of full.pairs.slice(0,60))assert.equal(lzPrefixEncode(x.subarray(0,pair.to)).pairs.length,full.pairs.indexOf(pair)+1);
});
