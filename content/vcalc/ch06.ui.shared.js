// Chapter-local visual primitives; no runtime changes and no opaque random state.
import{triangles,cross3 as cross,sub3 as sub,norm3 as norm,dot3 as dot,mul3 as mul,add3 as add,geometry,PI,TAU}from'./ch06.shared.js';
export const control=(v,label,a,b,x)=>v.slider(label,a,b,x,{step:'any',decimals:4});
export const fmt=x=>x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(7)).toString();
export const tuple=p=>'('+p.map(fmt).join(', ')+')';
export const scene=(v,title,range=2.3)=>v.stage3d({title,range,height:340,minWidth:240,axes:false,persp:0,pitch:.55,yaw:-.65});
export const chart=(v,title,x,y,xlabel='u',ylabel='v',extra={})=>v.stage({title,x,y,xlabel,ylabel,axes:'box',gutter:true,height:310,minWidth:240,...extra});
export function drawTriangles(S,v,tris,{color='accent',alpha=.7,wire=false,value=null}={}){for(const t of tris){const normal=cross(sub(t[1],t[0]),sub(t[2],t[0])),l=norm(normal);if(l===0)continue;const n=mul(normal,1/l),z=S._view(n),shade=.5+.5*Math.abs(.3*z[0]+.4*z[1]+.8*z[2]),c=value?value(t):v.rgb(color).slice(0,3).map(x=>x*shade);S.poly(t,{fill:c,fillAlpha:alpha,color:wire?'ink':c,alpha:wire?.35:alpha,width:wire?.55:.5});}}
export function surface(S,v,F,U,V,options={}){drawTriangles(S,v,triangles(F,U,V,options.n??20,options.m??24),options);}
export function grid(S,F,U,V,n=10,m=8,style={}){for(let i=0;i<=n;i++){const u=U[0]+(U[1]-U[0])*i/n;S.curve(v=>F(u,v),...V,{n:40,color:'muted',width:.7,alpha:.45,...style});}for(let j=0;j<=m;j++){const w=V[0]+(V[1]-V[0])*j/m;S.curve(u=>F(u,w),...U,{n:60,color:'muted',width:.7,alpha:.45,...style});}}
export function tangentSquare(S,P,d,size=.18,color='gold'){if(!d)return;const A=mul(d.u,size),B=mul(d.v,size);S.poly([sub(sub(P,A),B),add(sub(P,B),A),add(add(P,A),B),add(sub(P,A),B)],{fill:color,fillAlpha:.2,color,width:1});}
export function arrows(S,P,d){if(!d)return;S.arrow(P,add(P,mul(d.u,.35)),{color:'blue',width:2.5});S.arrow(P,add(P,mul(d.v,.35)),{color:'orange',width:2.5});const g=geometry(d);if(g.n)S.arrow(P,add(P,mul(g.n,.5)),{color:'gold',width:3});}
export const regularGrid=()=>[[-PI,PI],[-1,1]];
