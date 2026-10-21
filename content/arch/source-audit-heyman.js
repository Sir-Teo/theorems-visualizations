// Authored rectangular-joint derivation of Heyman1966 Fig2, not measured stone data.
// Controls denote the exact decimal represented by their canonical saved Number string.
// Compare the finite-cap boundary without rounded products/subtraction or a tolerance.
function decimal(x){const [mantissa,exponent='0']=String(x).split('e'),parts=mantissa.split('.'),digits=BigInt(parts.join(''));return{digits,scale:(parts[1]?.length??0)-Number(exponent)};}
function decimalSumAtMostOne(a,b){const A=decimal(a),B=decimal(b),s=Math.max(0,A.scale,B.scale),power=n=>10n**BigInt(n);return A.digits*power(s-A.scale)+B.digits*power(s-B.scale)<=power(s);}
export function heymanJoint(n=.1,q=.5){
 if(!Number.isFinite(n)||n<.02||n>1.2||!Number.isFinite(q)||q< -1.2||q>1.2)throw new RangeError('Outside authored joint domain');
 const m=n*q,width=2*(1-Math.abs(q)),contact=width>0,peak=contact?2*n/width:null;
 const a=q>=0?1-width:-1,b=q>=0?1:-1+width;
 return{n,q,m,width:contact?width:0,a:contact?a:null,b:contact?b:null,peak,
 ideal:Math.abs(q)<1?'interior':Math.abs(q)===1?'edge limit':'outside',
 finite:decimalSumAtMostOne(n,Math.abs(q)),capacity:n<=1?n*(1-n):0};
}
