// DG5: pure models and honest, independently checkable quadratures.
export * from './ch04.shared.js';
import {add,sub,mul,dot,len,cross,stage3,chart,paramMesh,drawMesh,coordLines} from './ch04.shared.js';
export const rad=d=>d*Math.PI/180;
export const deg=a=>a*180/Math.PI;
export const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(len(a)*len(b)))));
export function gram(a,b){const E=dot(a,a),F=dot(a,b),G=dot(b,b);return {E,F,G,det:E*G-F*F,J:len(cross(a,b))};}
export const bilinear=(g,a,b)=>g.E*a[0]*b[0]+g.F*(a[0]*b[1]+a[1]*b[0])+g.G*a[1]*b[1];
export const push=(a,b,w)=>add(mul(a,w[0]),mul(b,w[1]));
export function integrate(f,a=0,b=1,n=256){n=Math.max(2,Math.ceil(n/2)*2);let s=f(a)+f(b);for(let j=1;j<n;j++)s+=(j%2?4:2)*f(a+(b-a)*j/n);return s*(b-a)/(3*n);}
export function integrate2(f,U,V,n=32){return integrate(u=>integrate(w=>f(u,w),...V,n),...U,n);}
export function polyLength(F,n=32,a=0,b=1){let q=F(a),L=0;for(let j=1;j<=n;j++){const p=F(a+(b-a)*j/n);L+=len(sub(p,q));q=p;}return L;}
export const meshArea=tris=>tris.reduce((A,t)=>A+len(cross(sub(t.p[1],t.p[0]),sub(t.p[2],t.p[0])))/2,0);
export function graph(u,w,s=.45,a=.7){return [u+s*w,w,a*(u*u-w*w)/2];}
export function graphD(u,w,s=.45,a=.7){return {a:[1,0,a*u],b:[s,1,-a*w]};}
export function pathModel(b=.6,a=.8){
 const uv=t=>[2*t-1,b*Math.sin(Math.PI*t)],duv=t=>[2,b*Math.PI*Math.cos(Math.PI*t)],F=t=>graph(...uv(t),0,a);
 const speed=t=>{const [u,w]=uv(t),d=graphD(u,w,0,a);return Math.sqrt(bilinear(gram(d.a,d.b),duv(t),duv(t)));};
 return {uv,duv,F,speed};
}
export function roll(x,y,c){return Math.abs(c)<1e-12?[x,y,0]:[Math.sin(c*x)/c,y,2*Math.sin(c*x/2)**2/c];}
export const rollD=(x,c)=>({a:[Math.cos(c*x),0,Math.sin(c*x)],b:[0,1,0]});
export const cat=(u,w)=>[Math.cosh(w)*Math.cos(u),Math.cosh(w)*Math.sin(u),w];
export const hel=(u,w)=>[Math.sinh(w)*Math.sin(u),-Math.sinh(w)*Math.cos(u),u];
export function associate(u,w,t){return add(mul(cat(u,w),Math.cos(t)),mul(hel(u,w),Math.sin(t)));}
export function associateD(u,w,t){const a=[-Math.cosh(w)*Math.sin(u),Math.cosh(w)*Math.cos(u),0],b=[Math.sinh(w)*Math.cos(u),Math.sinh(w)*Math.sin(u),1];return {a:add(mul(a,Math.cos(t)),mul(b,Math.sin(t))),b:add(mul(b,Math.cos(t)),mul(a,-Math.sin(t)))};}
export function linear(w,scale,rotation,anisotropic=false){const x=scale*w[0],y=(anisotropic?1/scale:scale)*w[1],c=Math.cos(rotation),s=Math.sin(rotation);return [c*x-s*y,s*x+c*y,0];}
export function stereo(u,w){const d=1+u*u+w*w;return [2*u/d,2*w/d,(u*u+w*w-1)/d];}
export function stereoD(u,w){const d=1+u*u+w*w,d2=d*d;return {a:[2*(1-u*u+w*w)/d2,-4*u*w/d2,4*u/d2],b:[-4*u*w/d2,2*(1+u*u-w*w)/d2,4*w/d2]};}
export const sphere=(lambda,phi)=>[Math.cos(phi)*Math.cos(lambda),Math.cos(phi)*Math.sin(lambda),Math.sin(phi)];
export const mercator=phi=>Math.asinh(Math.tan(phi));
export const invMercator=psi=>Math.atan(Math.sinh(psi));
export const heightSphere=(u,z)=>[Math.sqrt(1-z*z)*Math.cos(u),Math.sqrt(1-z*z)*Math.sin(u),z];
export const cylinder=(u,z)=>[Math.cos(u),Math.sin(u),z];
export const heightD=(u,z)=>{const r=Math.sqrt(1-z*z);return {a:[-r*Math.sin(u),r*Math.cos(u),0],b:[-z/r*Math.cos(u),-z/r*Math.sin(u),1]};};
export const para=(r,t)=>[r*Math.cos(t),r*Math.sin(t),r*r/2];
export const Q=r=>Math.sqrt(1+r*r)+Math.log(r/(1+Math.sqrt(1+r*r)));
export function radius(u){let a=.1,b=4;const q=u+Q(1);for(let j=0;j<55;j++){const m=(a+b)/2;if(Q(m)<q)a=m;else b=m;}return (a+b)/2;}
export const isoPara=(u,t)=>para(radius(u),t);
export function isoD(u,t){const r=radius(u),dr=r/Math.sqrt(1+r*r);return {a:[dr*Math.cos(t),dr*Math.sin(t),r*dr],b:[-r*Math.sin(t),r*Math.cos(t),0]};}
export function slider(v,label,a,b,x){return v.slider(label,a,b,x,{step:'any',decimals:3});}
export function panel(v,o){return chart(v,{height:320,minWidth:240,...o});}
export function space(v,o){return stage3(v,{height:340,minWidth:240,...o});}
export function patch(S,v,F,U,V,o={}){drawMesh(S,v,paramMesh(F,U,V,o.n??18,o.n??18),{alpha:.58,color:'accent',...o});coordLines(S,F,U,V,8,8,{color:'ink',alpha:.18,width:.7});}
export function sphereGrid(S){coordLines(S,sphere,[-Math.PI,Math.PI],[-1.5,1.5],16,10,{color:'muted',width:.8,alpha:.35});}
export const f=(v,x,n=4)=>v.fix(Math.abs(x)<1e-12?0:x,n);
