// Exact rational coding decisions; binary64 is used only to draw coordinates.
const gcd=(a,b)=>{while(b){const r=a%b;a=b;b=r;}return a;};
const bits=n=>n.toString(2).length;
export const logRatio=(n,d)=>{
 const sn=Math.max(0,bits(n)-53),sd=Math.max(0,bits(d)-53);
 return Math.log2(Number(n>>BigInt(sn)))-Math.log2(Number(d>>BigInt(sd)))+sn-sd;
};
export const ratio=(n,d)=>n===0n?0:2**logRatio(n,d);
export function probabilityWeights(p){
 if(!p.length||p.some(x=>!Number.isFinite(x)||x<0)||!p.some(x=>x>0))throw new RangeError('nonnegative finite weights with positive sum required');
 const buf=new DataView(new ArrayBuffer(8));
 const parts=p.map(x=>{if(x===0)return{n:0n,e:0};buf.setFloat64(0,x);const b=buf.getBigUint64(0),e=Number((b>>52n)&2047n),m=b&((1n<<52n)-1n);return e?{n:(1n<<52n)|m,e:e-1075}:{n:m,e:-1074};});
 const e=Math.min(...parts.filter(x=>x.n).map(x=>x.e)),a=parts.map(x=>x.n?x.n<<BigInt(x.e-e):0n),g=a.reduce(gcd),w=a.map(x=>x/g),total=w.reduce((s,x)=>s+x,0n);
 return{w,total,p:w.map(x=>ratio(x,total))};
}
export function ceilSurprisal(n,d){
 if(n<=0n||n>d)throw new RangeError('positive probability required');
 let k=Math.max(0,bits(d)-bits(n));if((n<<BigInt(k))<d)k++;return k;
}
const word=(k,l)=>l?k.toString(2).padStart(l,'0'):'';
export function sfeCode(p,extra=1){
 if(extra!==0&&extra!==1)throw new RangeError('extra bit must be zero or one');
 const model=probabilityWeights(p),{w,total}=model,rows=[];let F=0n;
 for(let i=0;i<w.length;i++){
  if(w[i]){const l=ceilSurprisal(w[i],total)+extra,scale=1n<<BigInt(l),k=((2n*F+w[i])*scale)/(2n*total),inside=k*total>=F*scale&&(k+1n)*total<=(F+w[i])*scale;
   rows.push({i,l,k,w:word(k,l),inside,F:ratio(F,total),pi:ratio(w[i],total),Fb:ratio(2n*F+w[i],2n*total),c:ratio(k,scale),width:ratio(1n,scale),left:F,right:F+w[i],denominator:total});}
  F+=w[i];
 }
 const words=rows.map(r=>r.w),pf=words.every((a,i)=>words.every((b,j)=>i===j||!b.startsWith(a))),L=rows.reduce((s,r)=>s+r.pi*r.l,0),H=rows.reduce((s,r)=>s-r.pi*logRatio(w[r.i],total),0);
 return{rows,p:model.p,L,H,pf,allIn:rows.every(r=>r.inside)};
}
export function containedDyadic(L,U,D){
 if(L<0n||U>D||L>=U)throw new RangeError('nonempty subinterval of [0,1) required');
 let l=ceilSurprisal(U-L,D);
 for(;;l++){const scale=1n<<BigInt(l),k=(L*scale+D-1n)/D;if((k+1n)*D<=U*scale)return{k,l,code:word(k,l)};}
}
export function commonBinaryPrefix(L,U,D){
 let out='';
 for(let l=1;;l++){const scale=1n<<BigInt(l),a=L*scale/D,b=(U*scale+D-1n)/D-1n;if(a!==b)return out;out+=a&1n?'1':'0';}
}
export function arithmeticEncode(text,p,adaptive=false){
 if(!/^[abc]*$/.test(text))return{error:'Use only lowercase a, b and c; input is not filtered or truncated.'};
 const fixed=probabilityWeights(p),counts=[1n,1n,1n],rows=[];let L=0n,U=1n,D=1n;
 for(let t=0;t<text.length;t++){
  const j='abc'.indexOf(text[t]),w=adaptive?counts.slice():fixed.w,total=w.reduce((s,x)=>s+x,0n),cum=[0n,w[0],w[0]+w[1],total];
  if(w[j]===0n)return{error:`Symbol ${text[t]} at position ${t+1} has zero probability in the fixed model. No code exists.`,rows};
  rows.push({j,pr:w.map(x=>ratio(x,total)),cs:cum.map(x=>ratio(x,total)),L,U,D,bits:commonBinaryPrefix(L,U,D)});
  const width=U-L,base=L*total;L=base+width*cum[j];U=base+width*cum[j+1];D*=total;
  const g=gcd(gcd(L,U),D);L/=g;U/=g;D/=g;counts[j]++;
 }
 const dyadic=containedDyadic(L,U,D),logP=-logRatio(U-L,D),decoded=arithmeticDecode(dyadic.code,text.length,p,adaptive);
 return{rows,L,U,D,...dyadic,logP,decoded,ok:decoded===text,common:commonBinaryPrefix(L,U,D)};
}
export function arithmeticDecode(code,n,p,adaptive=false){
 if(!/^[01]*$/.test(code)||!Number.isInteger(n)||n<0)throw new RangeError('binary code and known nonnegative length required');
 const value=code?BigInt('0b'+code):0n,vd=1n<<BigInt(code.length),V=2n*value+1n,VD=2n*vd;
 const fixed=probabilityWeights(p),counts=[1n,1n,1n];let L=0n,U=1n,D=1n,out='';
 for(let t=0;t<n;t++){
  const w=adaptive?counts.slice():fixed.w,total=w.reduce((s,x)=>s+x,0n),cum=[0n,w[0],w[0]+w[1],total],width=U-L,base=L*total;
  let j=0;while(j<2&&V*(D*total)>=(base+width*cum[j+1])*VD)j++;
  L=base+width*cum[j];U=base+width*cum[j+1];D*=total;const g=gcd(gcd(L,U),D);L/=g;U/=g;D/=g;out+='abc'[j];counts[j]++;
 }return out;
}
