// Diagnostic only: conservative intervals for the existing shader mesh. No renderer binding.
// GLSL ES 3.00 §4.5.1: correctly rounded +,-,*; division <=2.5 ULP;
// multiply-add may be fused or separate. Inputs/operations here enclose both.
const bits=new ArrayBuffer(4),f=new Float32Array(bits),u=new Uint32Array(bits);
export function nextFloat32(x,direction){x=Math.fround(x);if(!Number.isFinite(x))return x;if(x===0){u[0]=1;return direction>0?f[0]:-f[0];}f[0]=x;u[0]+=(x>0)===(direction>0)?1:-1;return f[0];}
const valid=a=>a.length===2&&a.every(Number.isFinite)&&a[0]<=a[1];
function outward(lo,hi,steps=1,roundError=0){if(!Number.isFinite(lo)||!Number.isFinite(hi))return null;lo-=roundError;hi+=roundError;let a=Math.fround(lo),b=Math.fround(hi);for(let j=0;j<steps;j++){a=nextFloat32(a,-1);b=nextFloat32(b,1);}if(!Number.isFinite(a)||!Number.isFinite(b))return null;if(a<2**-126&&b>-(2**-126)){a=Math.min(a,0);b=Math.max(b,0);}return[a,b];}
export function constant(x){x=Math.fround(x);return Number.isFinite(x)?[x,x]:null;}
export function operation(a,b,op){if(!a||!b||!valid(a)||!valid(b))return null;if(op==='/'&&b[0]<=0&&b[1]>=0)return null;const values=[];for(const x of a)for(const y of b)values.push(op==='+'?x+y:op==='-'?x-y:op==='*'?x*y:x/y);const magnitude=Math.max(...values.map(Math.abs),...a.map(Math.abs),...b.map(Math.abs),Number.MIN_VALUE);return outward(Math.min(...values),Math.max(...values),op==='/'?4:1,magnitude*Number.EPSILON*4);}
export function halfValue(bits){const sign=bits&0x8000?-1:1,e=(bits>>>10)&31,m=bits&1023;return e===31?(m?NaN:sign*Infinity):sign*(e?2**(e-15)*(1+m/1024):2**-14*m/1024);}
export function halfInterval(value){value=Math.fround(value);if(!Number.isFinite(value)||Math.abs(value)>65504)return null;const sign=value<0?-1:1,x=Math.abs(value);let lo=0,hi=0x7bff;while(lo<hi){const m=Math.floor((lo+hi)/2);if(halfValue(m)<x)lo=m+1;else hi=m;}let a=halfValue(lo),b=a;if(a>x)a=halfValue(Math.max(0,lo-1));if(x<2**-14)a=0;return sign>0?[a,b]:[-b,-a];}
const add=(a,b)=>operation(a,b,'+'),sub=(a,b)=>operation(a,b,'-'),mul=(a,b)=>operation(a,b,'*'),div=(a,b)=>operation(a,b,'/');
const neg=a=>a?[-a[1],-a[0]]:null;
export function segmentMeshEnclosure({points,joins,firstPoint,width,cap='butt',view,tile}){
 const k=constant(view.k),tx=constant(view.tx),ty=constant(view.ty),dpr=constant(view.dpr),half=constant(width/2),one=constant(1),outer=add(half,div(one,dpr)),extension=cap==='round'?outer:div(one,dpr),ox=constant(tile.x/view.dpr),oy=constant(tile.y/view.dpr),rx=constant(tile.width/view.dpr),ry=constant(tile.height/view.dpr);let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 for(const end of[false,true]){const index=firstPoint+(end?1:0),w=points[index*4+3],fraction=w-Math.floor(w),start=fraction>.2&&fraction<.4,last=fraction>.4,jx=halfInterval(joins[index*2]),jy=halfInterval(joins[index*2+1]),extra=!end&&start?neg(extension):end&&last?extension:constant(0);for(const side of[-1,1]){
  const x=sub(add(add(add(mul(constant(points[index*4]),k),tx),mul(mul(jx,outer),constant(side))),mul(jy,extra)),ox),y=sub(add(add(add(mul(constant(points[index*4+1]),k),ty),mul(mul(jy,outer),constant(side))),mul(neg(jx),extra)),oy);
  // Enclose shader's NDC division/multiplication/addition, then viewport mapping.
  const nx=add(mul(div(x,rx),constant(2)),constant(-1)),ny=add(mul(div(y,ry),constant(-2)),constant(1));if(!nx||!ny)return null;
  const X=nx.map(n=>(n+1)*tile.width/2+tile.x),Y=ny.map(n=>(1-n)*tile.height/2+tile.y);left=Math.min(left,...X);right=Math.max(right,...X);top=Math.min(top,...Y);bottom=Math.max(bottom,...Y);
 }}if(![left,right,top,bottom].every(Number.isFinite))return null;return[Math.floor(left)-1,Math.floor(top)-1,Math.ceil(right)+1,Math.ceil(bottom)+1];
}
export function intersectsTile(box,tile){return!box||box[0]<=tile.x+tile.width&&box[2]>=tile.x&&box[1]<=tile.y+tile.height&&box[3]>=tile.y;}
