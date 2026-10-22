// Chapter-local UI; all quantities dimensionless unless the text specifies otherwise.
export const slider=(v,label,a,b,x)=>v.slider(label,a,b,x,{step:'any',decimals:4});
export const fmt=x=>x===null?'undefined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>1e5?x.toExponential(4):Number(x.toPrecision(7)).toString();
export const chart=(v,title,x,y,xlabel='x',ylabel='u',extra={})=>v.stage({title,x,y,xlabel,ylabel,axes:'box',gutter:{l:68,r:16},height:300,minWidth:240,...extra});
export const sphereScene=(v,title)=>v.stage3d({title,range:3,height:330,minWidth:240,axes:false,persp:0,pitch:.5,yaw:-.7});
export function sphere(S,v,center,r,value){if(r===0){S.dot(center,{color:'gold',r:4});return;}const n=20,m=32,F=(a,b)=>[center[0]+r*Math.sqrt(Math.max(0,1-b*b))*Math.cos(a),center[1]+r*Math.sqrt(Math.max(0,1-b*b))*Math.sin(a),center[2]+r*b];for(let j=0;j<n;j++)for(let i=0;i<m;i++){const a=2*Math.PI*i/m,b=-1+2*j/n,P=[F(a,b),F(a+2*Math.PI/m,b),F(a+2*Math.PI/m,b+2/n),F(a,b+2/n)],mid=P.reduce((a,p)=>a.map((x,k)=>x+p[k]/4),[0,0,0]);S.poly(P,{fill:value?v.ramp(value(mid),'orange'):'accent',fillAlpha:.65,color:'muted',alpha:.18,width:.45});}}
export function circle(S,x,y,r,options={}){S.path(Array.from({length:97},(_,i)=>{const t=2*Math.PI*i/96;return[x+r*Math.cos(t),y+r*Math.sin(t)];}),{color:'gold',width:2,...options});}
export const points=(f,a,b,n=80)=>Array.from({length:n+1},(_,i)=>{const x=a+(b-a)*i/n;return[x,f(x)];});
export const padded=(values,p=.12)=>{const lo=Math.min(0,...values),hi=Math.max(0,...values),d=Math.max(.01,hi-lo);return[lo-p*d,hi+p*d];};
