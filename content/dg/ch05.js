import {PI,TAU,add,sub,mul,dot,len,dF,gram,bilinear,push,angle,deg,integrate,polyLength,integrate2,meshArea,paramMesh,drawMesh,orthoBasis,graph,graphD,pathModel,roll,rollD,associate,associateD,slider,panel,space,patch,f} from './ch05.shared.js';
const notes='https://www.math.ucla.edu/~petersen/DGnotes.pdf';
export default {
 collection:'dg',chapter:5,title:'The first fundamental form',
 summary:String.raw`A surface inherits an inner product from space. Its coordinate coefficients measure lengths, angles and areas; preserving some or all of these quantities leads to isometric, conformal and equal-area maps. The chapter ends with local coordinates that remove shear and unequal directional scaling.`,
 items:[
 {
 num:'5.1',kind:'Definition',name:'First fundamental form',
 statement:String.raw`For a smooth regular surface $S\subset\R^3$, the first fundamental form at $p$ is the Euclidean inner product restricted to $T_pS$. In a regular patch $X(u,v)$ its matrix has entries $E=X_u\cdot X_u$, $F=X_u\cdot X_v$, $G=X_v\cdot X_v$. Thus
 $$I(a,b)=Ea^2+2Fab+Gb^2.$$
 Regularity gives $E>0$ and $EG-F^2=|X_u\times X_v|^2>0$.`,
 idea:String.raw`The differential sends $(a,b)$ to $aX_u+bX_v$. Expanding its squared Euclidean norm gives the form. Injectivity of the differential makes this norm positive for every nonzero parameter vector. Changing a patch changes the matrix by the chain rule, but leaves the tangent inner product unchanged.`,
 caption:String.raw`Move the point and change the shear or height of the graph $X=(u+sv,v,a(u^2-v^2)/2)$. The orange ellipse is the **differential image of the unit parameter circle**, in an orthonormal tangent frame; it is not a finite circle drawn on the curved surface.`,
 deps:['dg-4.6'],refs:['do Carmo §2-5','Petersen §4.3','Donaldson §3.2, Definition 3.15'],tags:['metric','tangent plane'],links:{notes,uci:'https://webapps.math.uci.edu/~ndonalds/math162a/surfaces.html'},
 viz(v){
  const u=slider(v,'point u',-.8,.8,.35),w=slider(v,'point v',-.8,.8,.3),s=slider(v,'shear s',-.8,.8,.45),a=slider(v,'height a',0,1,.7);
  const S=space(v,{range:2.7,pitch:.8,title:'surface and tangent directions'}),C=panel(v,{x:[-3.4,3.4],y:[-3.4,3.4],equal:true,xlabel:'tangent x',ylabel:'tangent y',title:'differential unit-circle image'});let info;
  v.render(()=>{const F=(x,y)=>graph(x,y,s.value,a.value),d=graphD(u.value,w.value,s.value,a.value),P=F(u.value,w.value),g=gram(d.a,d.b),[e1,e2]=orthoBasis(d.a,d.b);patch(S,v,F,[-1,1],[-1,1]);
   S.dot(P,{color:'gold',r:5});S.arrow(P,add(P,mul(d.a,.45)),{color:'blue',width:3});S.arrow(P,add(P,mul(d.b,.45)),{color:'orange',width:3});
   C.circle(0,0,1,{color:'blue',dash:true});C.curve(t=>{const z=push(d.a,d.b,[Math.cos(t),Math.sin(t)]);return [dot(z,e1),dot(z,e2)];},0,TAU,{color:'orange',width:3});C.dot(0,0,{color:'gold',r:3});info=g;
  });v.legend([['blue','parameter unit circle / first tangent'],['orange','differential ellipse / second tangent'],['gold','chosen point']]);
  v.readout(()=>`At (u,v)=(${f(v,u.value,3)}, ${f(v,w.value,3)}):\nE=${f(v,info.E)}, F=${f(v,info.F)}, G=${f(v,info.G)}.\nGram determinant=${f(v,info.det)}; squared cross-product norm=${f(v,info.J**2)}.`);
 }
 },
 {
 num:'5.2',kind:'Proposition',name:'Lengths and angles of curves on a surface',
 statement:String.raw`Let $X$ be a smooth regular patch and $c(t)=(u(t),v(t))$, $a\le t\le b$, a piecewise $C^1$ parameter curve. Put $q=E\dot u^2+2F\dot u\dot v+G\dot v^2$ along $c$. Then $\gamma=X\circ c$ has length
 $$L=\int_a^b\sqrt{q(t)}\,dt.$$
 For nonzero tangent vectors with coordinate columns $A,B$, their angle satisfies $\cos\theta=(A^TgB)/\sqrt{(A^TgA)(B^TgB)}$, where $g$ is the first-form matrix at their common point.`,
 idea:String.raw`The chain rule gives $\dot\gamma=X_u\dot u+X_v\dot v$. The first form evaluates its squared speed, and the ordinary arc-length formula integrates that speed. Applying the same bilinear inner product to two nonzero vectors supplies their angle. Coordinate-plane lengths and angles generally differ from surface values.`,
 caption:String.raw`Bend the parameter curve $(2t-1,b\sin\pi t)$ on a saddle. Increase the number of straight spatial segments: their total length approaches the metric integral. The second panel plots the actual accumulated metric length; the angle check uses independent three-dimensional tangent dot products at $t=1/2$.`,
 deps:['dg-5.1','dg-1.2'],refs:['do Carmo §2-5','Donaldson Theorem 3.20'],tags:['arc length','angle'],links:{uci:'https://webapps.math.uci.edu/~ndonalds/math162a/surfaces.html'},
 viz(v){const b=slider(v,'curve amplitude b',0,1,.6),a=slider(v,'saddle height a',0,1.2,.8),N=v.select('spatial segments',['8','16','32','64'],'16');
 const S=space(v,{range:2.2,pitch:.7,title:'curve and spatial polygon'}),C=panel(v,{x:[-.08,1.08],y:[-.3,5.5],xlabel:'t',ylabel:'length',title:'accumulated metric length'});let info;
 v.render(()=>{const m=pathModel(b.value,a.value),n=+N.value,F=(u,w)=>graph(u,w,0,a.value);patch(S,v,F,[-1.1,1.1],[-1.1,1.1]);S.curve(m.F,0,1,{color:'blue',width:3});S.path(Array.from({length:n+1},(_,j)=>m.F(j/n)),{color:'orange',width:1.8});C.curve(t=>[t,integrate(m.speed,0,t,128)],0,1,{n:80,color:'blue',width:3});
 const L=integrate(m.speed),L2=integrate(m.speed,0,1,512),P=polyLength(m.F,n),uv=m.uv(.5),d=graphD(...uv,0,a.value),A=m.duv(.5),B=[1,1],g=gram(d.a,d.b),metric=Math.acos(Math.max(-1,Math.min(1,bilinear(g,A,B)/Math.sqrt(bilinear(g,A,A)*bilinear(g,B,B)))));info={L,P,delta:Math.abs(L-L2),theta:deg(metric),theta3:deg(angle(push(d.a,d.b,A),push(d.a,d.b,B)))};C.dot(1,L,{color:'gold',r:5});});
 v.legend([['blue','smooth curve / metric integral'],['orange','straight spatial segments'],['gold','total length']]);v.readout(()=>`Metric integral (Simpson256)=${f(v,info.L,6)}.\nSpatial polygon (${N.value} segments)=${f(v,info.P,6)}; gap=${f(v,info.L-info.P,6)}.\nQuadrature refinement change=${f(v,info.delta,9)} (an estimate, not an error bound).\nAngle: metric=${f(v,info.theta,4)}°; spatial dot product=${f(v,info.theta3,4)}°.`);
 }
 },
 {
 num:'5.3',kind:'Definition',name:'Area of a region on a surface',
 statement:String.raw`Let $X:U\to S$ be a smooth injective regular patch and $D\subset U$ a compact Jordan-measurable region. Its surface area is
 $$A(X(D))=\iint_D J\,du\,dv.$$
 Here $J=\sqrt{EG-F^2}=|X_u\times X_v|$. A smooth change of parameters gives the same area by the change-of-variables formula. Without injectivity the integral counts covering multiplicity.`,
 idea:String.raw`A small parameter parallelogram is sent, to first order, to the parallelogram spanned by the coordinate tangents. Its area factor is the norm of their cross product, equal to the square root of the Gram determinant. Under reparametrization this factor acquires the absolute coordinate Jacobian, precisely the factor required in integration.`,
 caption:String.raw`Resize the rectangle on the graph $z=a(u^2-v^2)/2$, then refine its triangulation. The colored triangles are the actual planar facets used in the independent spatial area sum. The reference integral and its refinement change are numerical quantities, not a certified continuum error bound.`,
 deps:['dg-5.1','pma-10.9'],refs:['do Carmo §2-5','Petersen Definition 4.3.1, Lemma 4.3.2 and Definition 4.4.6'],tags:['surface area','Gram determinant'],links:{notes},
 viz(v){const width=slider(v,'half-width',.25,1.2,.9),height=slider(v,'half-height',.25,1.2,.7),a=slider(v,'saddle height',0,1.2,.9),N=v.select('mesh cells per side',['4','8','16','32'],'8');const S=space(v,{range:2.3,pitch:.7,title:'planar facets over the chosen rectangle'}),C=panel(v,{x:[-.4,3.4],y:[-.1,1.15],xlabel:'mesh level',ylabel:'area / integral',xticks:[[0,'4'],[1,'8'],[2,'16'],[3,'32']],title:'relative facet areas'});let info;
 v.render(()=>{const U=[-width.value,width.value],V=[-height.value,height.value],F=(u,w)=>graph(u,w,0,a.value),J=(u,w)=>Math.sqrt(1+a.value*a.value*(u*u+w*w)),A=integrate2(J,U,V,32),A2=integrate2(J,U,V,64),tris=paramMesh(F,U,V,+N.value,+N.value),area=meshArea(tris);drawMesh(S,v,tris,{color:'accent',alpha:.8});for(const t of tris)S.path(t.p,{close:true,color:'ink',alpha:.18,width:.6});const ratios=[4,8,16,32].map(n=>meshArea(paramMesh(F,U,V,n,n))/A);C.setView([-.4,3.4],[Math.min(...ratios)-.005,Math.max(1,...ratios)+.005]);C.hline(1,{color:'green',dash:true});for(const [j,n]of[4,8,16,32].entries())C.dot(j,ratios[j],{color:n===+N.value?'gold':'blue',r:n===+N.value?6:4});info={A,A2,area};});v.legend([['blue','facet-area ratios'],['green','integral reference'],['gold','selected mesh']]);v.readout(()=>`Parameter rectangle area=${f(v,4*width.value*height.value,5)}.\nSurface integral (32×32 Simpson)=${f(v,info.A,6)}.\n${N.value}×${N.value} facet area=${f(v,info.area,6)}; difference=${f(v,info.area-info.A,6)}.\nIntegral refinement change=${f(v,Math.abs(info.A-info.A2),9)}.`);
 }
 },
 {
 num:'5.4',kind:'Definition',name:'Isometries and local isometries',
 statement:String.raw`An isometry of smooth regular surfaces is a diffeomorphism $f:S\to\widetilde S$ such that $I_{f(p)}(df_pA,df_pB)=I_p(A,B)$ for all tangent vectors. A smooth map is a local isometry if each point has a neighborhood on which it is an isometry onto an open image. Equivalently, its differential preserves the tangent inner products everywhere. Such maps preserve lengths of piecewise $C^1$ curves; an isometry also preserves intrinsic distances.`,
 idea:String.raw`An inner-product-preserving differential is injective and, in dimension two, invertible. The inverse function theorem then supplies local diffeomorphisms. Along every curve, the metric identity preserves speed and hence length. A global inverse lets one compare all joining curves in both directions; a periodic local isometry need not preserve global distance.`,
 caption:String.raw`Roll a strip by $R_c(x,y)$, whose components are $\sin(cx)/c$, $y$, and $(1-\cos(cx))/c$, using its smooth flat limit at $c=0$. The three colored sides are surface curves, not spatial chords. Their metric lengths stay fixed while the dashed chord changes. The displayed strip has width $2.4<2\pi/c$ for every offered positive $c$, so it does not wrap onto itself.`,
 deps:['dg-5.1','pma-9.24'],refs:['do Carmo §4-2','Petersen §4.4, Proposition 4.4.2'],tags:['isometry','intrinsic geometry'],links:{notes},
 viz(v){const c=slider(v,'roll curvature c',0,1.8,.8);const S=space(v,{range:2.6,title:'bending preserves surface side lengths'}),C=panel(v,{x:[-1.6,1.6],y:[-1.2,1.3],equal:true,xlabel:'x',ylabel:'y',title:'the original triangle'});const pts=[[-.9,-.55],[.9,-.55],[.1,.85]],colors=['blue','orange','green'];let info;
 v.render(()=>{patch(S,v,(x,y)=>roll(x,y,c.value),[-1.2,1.2],[-.9,1.05]);const L=[];for(let i=0;i<3;i++){const A=pts[i],B=pts[(i+1)%3],F=t=>roll(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,c.value);S.curve(F,0,1,{color:colors[i],width:3});C.segment(A,B,{color:colors[i],width:3});const speed=t=>{const x=A[0]+(B[0]-A[0])*t,d=rollD(x,c.value);return len(push(d.a,d.b,[B[0]-A[0],B[1]-A[1]]));};L.push(integrate(speed));}S.line(roll(...pts[0],c.value),roll(...pts[1],c.value),{color:'gold',dash:true,width:2});const d=rollD(.4,c.value);info={L,g:gram(d.a,d.b),chord:len(sub(roll(...pts[0],c.value),roll(...pts[1],c.value)))};});v.legend([['blue','first surface side'],['orange','second surface side'],['green','third surface side'],['gold','spatial chord of first side']]);v.readout(()=>`Surface side lengths: ${info.L.map(x=>f(v,x,6)).join(', ')}.\nFirst spatial chord=${f(v,info.chord,6)} (surface side=1.800000).\nAt x=0.4: E=${f(v,info.g.E)}, F=${f(v,info.g.F)}, G=${f(v,info.g.G)}.\nExtending x to all real numbers gives a periodic local isometry for c>0, not a global isometry.`);
 }
 },
 {
 num:'5.5',kind:'Proposition',name:'The catenoid and helicoid are locally isometric',
 statement:String.raw`Set $C(u,v)=(\cosh v\cos u,\cosh v\sin u,v)$ and $H(u,v)=(\sinh v\sin u,-\sinh v\cos u,u)$. Each map $X_\theta=\cos\theta\,C+\sin\theta\,H$ is a regular immersion with
 $$I_\theta=\cosh^2v\,(du^2+dv^2).$$
 Restricting to neighborhoods where both parametrizations are embedded patches gives local isometries between their images. This does not assert a global isometry between the complete catenoid and helicoid.`,
 idea:String.raw`The conjugacy identities $H_u=C_v$ and $H_v=-C_u$ rotate an orthogonal pair of equal-length tangent vectors. Their inner products therefore stay fixed throughout the family. Applying the first-form criterion to sufficiently small one-to-one patches proves local isometry. The catenoid identifies $u$ modulo $2\pi$, whereas the helicoid records $u$ as height, obstructing that proposed global correspondence.`,
 caption:String.raw`Change the associate angle, curve amplitude and sample latitude. The same parameter curve is drawn on the catenoid and its associate image. Their spatial polygons are approximations, while the common metric length is integrated directly; the live matrix is measured separately by central differences of the displayed map.`,
 deps:['dg-5.4'],refs:['do Carmo §4-2','Tumarkin, Differential Geometry III Solutions 9, Exercise 9.1 (opposite sign for H)'],tags:['local isometry','minimal surfaces'],links:{durham:'https://www.maths.dur.ac.uk/users/pavel.tumarkin/past/spring17/DG/DG9-sols.pdf'},
 viz(v){const t=slider(v,'associate angle (degrees)',0,90,45),b=slider(v,'curve amplitude',0,.8,.5),w=slider(v,'sample latitude v',-.9,.9,.3);const S=space(v,{range:3.4,title:'associate surface'}),T=space(v,{range:3.4,title:'reference catenoid'});let info;
 v.render(()=>{const theta=t.value*PI/180,F=(u,z)=>associate(u,z,theta),uv=x=>[-1.2+2.4*x,b.value*Math.sin(TAU*x)],curve=(map,x)=>map(...uv(x));patch(S,v,F,[-1.4,1.4],[-1,1]);patch(T,v,(u,z)=>associate(u,z,0),[-1.4,1.4],[-1,1]);S.curve(x=>curve(F,x),0,1,{color:'orange',width:3});T.curve(x=>curve((u,z)=>associate(u,z,0),x),0,1,{color:'blue',width:3});const speed=x=>Math.cosh(uv(x)[1])*Math.hypot(2.4,b.value*TAU*Math.cos(TAU*x)),d=dF(F,.3,w.value,1e-5),g=gram(d.Fu,d.Fv);info={g,L:integrate(speed,0,1,512),P:polyLength(x=>curve(F,x),128),P0:polyLength(x=>curve((u,z)=>associate(u,z,0),x),128),error:Math.max(Math.abs(g.E-Math.cosh(w.value)**2),Math.abs(g.G-Math.cosh(w.value)**2),Math.abs(g.F))};});v.legend([['orange','curve on associate'],['blue','curve on catenoid']]);v.readout(()=>`Common metric length=${f(v,info.L,6)}.\n128-chord sums: associate=${f(v,info.P,6)}; catenoid=${f(v,info.P0,6)}.\nMeasured E=${f(v,info.g.E,6)}, F=${f(v,info.g.F,6)}, G=${f(v,info.g.G,6)}.\nLargest coefficient residual=${f(v,info.error,9)} (finite differences, h=0.00001).\nThe rendered rectangle is an immersion demonstration; the assertion uses sufficiently small embedded neighborhoods.`);
 }
 }
 ]
};
