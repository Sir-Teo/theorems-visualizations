// Independent immutable-candidate peer: set ARCH_HEYMAN_PEER_ROOT to the archive being checked.
import assert from 'node:assert/strict';
import path from 'node:path';
import{pathToFileURL}from'node:url';
const root=process.env.ARCH_HEYMAN_PEER_ROOT||process.cwd(),{heymanJoint}=await import(pathToFileURL(path.join(root,'content/arch/source-audit-heyman.js')));
// A separate decimal oracle uses rational cross multiplication, rather than
// the implementation's common-decimal-scale sum. No tolerance enters acceptance.
function rational(x){let s=String(Math.abs(x)),exp=0;const at=s.indexOf('e');if(at>=0){exp=Number(s.slice(at+1));s=s.slice(0,at);}const dot=s.indexOf('.');if(dot>=0){exp-=s.length-dot-1;s=s.replace('.','');}return exp>=0?[BigInt(s)*10n**BigInt(exp),1n]:[BigInt(s),10n**BigInt(-exp)];}
const admissible=(n,q)=>{const[a,b]=rational(n),[c,d]=rational(q);return a*d+c*b<=b*d;};
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
let states=0,pressureBins=0;
for(let ni=2;ni<=120;ni++)for(let qi=-120;qi<=120;qi++){
 const n=ni/100,q=qi/100,p=heymanJoint(n,q);states++;assert.equal(p.finite,admissible(n,q));assert.equal(p.ideal,Math.abs(q)<1?'interior':Math.abs(q)===1?'edge limit':'outside');
 if(Math.abs(q)>=1){assert.equal(p.peak,null);assert.equal(p.a,null);assert.equal(p.b,null);continue;}
 // Integrate from geometry of the returned contact, without the closed moment formula.
 let force=0,moment=0;const dx=(p.b-p.a)/53;for(let i=0;i<53;i++){const x=p.a+(i+.5)*dx;force+=p.peak*dx;moment+=p.peak*x*dx;pressureBins++;}near(force,2*n);near(moment,2*n*q);near((p.a+p.b)/2,q);assert.ok(p.peak>=0&&p.a>=-1&&p.b<=1);
}
// Enumerate every occupancy pattern of twelve pressure cells. The extremal
// resultant must be obtained by filling consecutive cells against an edge.
for(let count=1;count<=12;count++){
 let maximum=-Infinity,minimum=Infinity;
 for(let mask=0;mask<4096;mask++){let filled=0,M=0;for(let i=0;i<12;i++)if(mask&(1<<i)){filled++;M+=(-1+(i+.5)/6)/6;}if(filled===count){maximum=Math.max(maximum,M);minimum=Math.min(minimum,M);}}
 const n=count/12;near(maximum/2,n*(1-n));near(minimum/2,-n*(1-n));
}
// Non-centred force does not imply whole-structure equilibrium: the same
// positive joint load can be admissible while an unsupported global body has
// nonzero external resultant. The candidate must preserve that scope boundary.
const {default:item}=await import(pathToFileURL(path.join(root,'content/arch/source-audit-heyman-item.js')));
assert.match(item.scope,/local admissibility result alone says nothing about equilibrium/);assert.match(item.statement,/cannot slide/);assert.match(item.statement,/effectively unlimited compressive strength/);assert.match(item.statement,/no tension/);assert.match(item.statement,/compatible mechanism/);assert.match(item.scope,/exact decimals/);
console.log(`PASS independent ARCH peer: ${states} decimal states, ${pressureBins} pressure-bin integrals, all4096 pressure-cell occupancies for12force levels, scope/material assumptions.`);
