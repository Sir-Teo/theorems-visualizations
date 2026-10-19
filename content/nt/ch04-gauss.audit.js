// Pure computations shared by the four reviewed Gauss-sum displays and their tests.
import {isPrime,legendre,mod} from './ch04.shared.js';
export function oddPrimeExcept(value,lo,hi,excluded){value=Math.round(value);for(let d=0;d<=hi-lo+Math.abs(value-lo);d++)for(const p of[value-d,value+d])if(p!==excluded&&p>=lo&&p<=hi&&p>2&&isPrime(p))return p;throw new RangeError('No admissible odd prime');}
export function gaussWalk(p,weights){const points=[[0,0]];for(let a=1;a<p;a++){const t=2*Math.PI*a/p,[x,y]=points.at(-1);points.push([x+weights[a-1]*Math.cos(t),y+weights[a-1]*Math.sin(t)]);}return{points,endpoint:points.at(-1),limit:Math.max(3,Math.sqrt(p)*1.2,...points.flatMap(([x,y])=>[Math.abs(x)*1.12,Math.abs(y)*1.12]))};}
export function cyclotomicGauss(p,q){
 if(p===q||p<3||q<3||!isPrime(p)||!isPrime(q))throw new RangeError('Distinct odd primes required');
 const norm=c=>{const t=c[p-1]||0;return Array.from({length:p},(_,i)=>i===p-1?0:mod((c[i]||0)-t,q));};
 const multiply=(a,b)=>{const c=Array(p).fill(0);for(let i=0;i<p;i++)for(let j=0;j<p;j++)c[(i+j)%p]=mod(c[(i+j)%p]+a[i]*b[j],q);return norm(c);};
 const g=norm(Array.from({length:p},(_,a)=>a?legendre(a,p):0)),g2=multiply(g,g);
 let gq=norm([1]),base=g,e=q;while(e){if(e%2)gq=multiply(gq,base);base=multiply(base,base);e=Math.floor(e/2);}
 const minus=g.map(c=>mod(-c,q)),same=(a,b)=>a.every((c,i)=>c===b[i]),pstar=p%4===1?p:-p;
 return{p,q,g,g2,gq,pstar,sign:same(gq,g)?1:same(gq,minus)?-1:0,multiply};
}
export const powers17=(()=>{const a=[];let x=1;for(let k=0;k<16;k++){a.push(x);x=x*3%17;}return a;})();
export function periods17(level){const m=2**level;return Array.from({length:m},(_,r)=>{const exponents=powers17.filter((_,k)=>k%m===r);return{exponents,re:exponents.reduce((s,a)=>s+Math.cos(2*Math.PI*a/17),0),im:exponents.reduce((s,a)=>s+Math.sin(2*Math.PI*a/17),0)};});}
export function cos17Radical(){const r=Math.sqrt(17);return(-1+r+Math.sqrt(34-2*r)+2*Math.sqrt(17+3*r-Math.sqrt(34-2*r)-2*Math.sqrt(34+2*r)))/16;}
export const reciprocityColour=(a,b)=>a===b?(a>0?'green':'blue'):(a>0?'orange':'purple');
