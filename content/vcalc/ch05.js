// Curated Vector Calculus, Chapter 5. Statements and examples are original.
import {quad,potential,gradient,rotation,work,segmentWork,wiggle,bowed,circle,pathDraw,arrows} from './ch05.shared.js';
const lineURL='https://openstax.org/books/calculus-volume-3/pages/6-2-line-integrals';
const consURL='https://openstax.org/books/calculus-volume-3/pages/6-3-conservative-vector-fields';
export default {
 collection:'vcalc',chapter:5,title:'Line integrals and conservative fields',
 summary:String.raw`Line integrals accumulate density, work or flux along a curve. A scalar potential makes work depend only on endpoints; a hole can obstruct a global potential even when every local curl vanishes. Energy and thermodynamic work make the distinction between a state and a path tangible.`,
 items:[
 {
 num:'5.1',kind:'Definition',name:'Path integral of a scalar function',
 statement:String.raw`For a piecewise $C^1$ curve $r:[a,b]\to\R^n$ and continuous $f$ on its image, define $\int_C f\,ds=\int_a^b f(r(t))\|r'(t)\|\,dt$, adding the integrals over smooth pieces. This counts multiplicity if the curve retraces itself. A regular change of parameter, in either orientation, leaves the scalar integral unchanged. For nonnegative $f$ it is the area of a vertical fence with base $C$ and height $f$.`,
 idea:String.raw`Arc length weights a short parameter interval by its geometric length. The substitution rule cancels a change of speed against the parameter differential. The absolute value in speed also cancels orientation reversal.`,
 caption:String.raw`Change the speed modulation or reverse traversal. The projected fence has height $f=1+0.4x$ along $r(t)=(t,0.6\sin\pi t)$. Compare the two independently integrated parameter formulas; the gold marker moves with the clock fraction.`,
 deps:['vcalc-1.8'],tags:['line integrals','arc length'],refs:['OpenStax Calculus 3 §6.2, Scalar Line Integrals'],links:{source:lineURL},
 viz(v){const a=v.slider('speed modulation',-.8,.8,.5,{step:.05}),rev=v.toggle('reverse traversal',false),clock=v.slider('clock fraction',0,1,.4,{step:.01});
 const s=v.stage({x:[-.1,1.25],y:[-.1,2.2],height:330,title:'projected fence: base + height'}),g=v.stage({x:[0,1],y:[0,6],height:330,title:'parameter integrand',xlabel:'u'});
 const r=t=>[t,.6*Math.sin(Math.PI*t)],f=t=>1+.4*t,speed=t=>Math.hypot(1,.6*Math.PI*Math.cos(Math.PI*t));let I,J;
 const map=u=>{const t=u+a.value*Math.sin(2*Math.PI*u)/(2*Math.PI);return rev.value?1-t:t;};
 const integrand=u=>f(map(u))*speed(map(u))*(1+a.value*Math.cos(2*Math.PI*u));
 v.render(()=>{pathDraw(s,r,'muted');for(let j=0;j<=24;j++){const t=j/24,p=r(t);s.line(...p,p[0],p[1]+f(t),{color:'accent',alpha:.6});}pathDraw(s,t=>{const p=r(t);return[p[0],p[1]+f(t)];});const p=r(map(clock.value));s.dot(...p,{color:'gold',r:6});g.fn(integrand,{color:'accent',fill:true});g.fn(t=>f(t)*speed(t),{color:'orange',dash:true});I=quad(t=>f(t)*speed(t));J=quad(integrand);});
 v.legend([['accent','changed clock'],['orange','uniform clock']]);v.readout(()=>`Uniform integral = ${v.fix(I,6)}; changed clock = ${v.fix(J,6)}; numerical gap = $${v.sci(Math.abs(I-J),2)}$ (800-panel Simpson quadrature).`);
 }},
 {
 num:'5.2',kind:'Definition',name:'Line integral of a vector field (work)',
 statement:String.raw`If $F$ is continuous along an oriented piecewise $C^1$ curve $r:[a,b]\to\R^n$, its work is $\int_C F\cdot dr=\int_a^b F(r(t))\cdot r'(t)\,dt$. Reversing orientation changes its sign. Splitting a path into consecutive pieces adds their works; changing speed while preserving orientation does not change the integral.`,
 idea:String.raw`A force contributes only its component along displacement. The dot product supplies the signed local work, which can be positive on one part of a path and negative on another. Reversal negates every displacement.`,
 caption:String.raw`Drag the waypoint of a two-segment path in $F=(-y,x)+(1,0)$. Segment colours show the sign of their integrated work. Reverse the path and compare the running work graph and total.`,
 deps:['vcalc-3.1','vcalc-1.7','pma-10.48'],tags:['work','line integrals'],refs:['OpenStax Calculus 3 §6.2, Vector Line Integrals'],links:{source:lineURL},
 viz(v){const rev=v.toggle('reverse orientation',false),s=v.stage({x:[-2,2],y:[-2,2],equal:true,height:340,title:'force and path'}),g=v.stage({x:[0,2],y:[-6,6],height:340,title:'accumulated work',xlabel:'segment parameter'}),p=s.handle(.4,.9,{color:'gold',label:'waypoint'});const F=(x,y)=>[1-y,x];let total;
 v.render(()=>{arrows(s,F);const P=[[-1,-.5],[p.x,p.y],[1,.5]];if(rev.value)P.reverse();let acc=0,pts=[[0,0]];for(let i=0;i<2;i++){const w=segmentWork(F,P[i],P[i+1]);s.segment(P[i],P[i+1],{color:w>=0?'green':'red',width:3});for(let j=1;j<=40;j++){const t=j/40,q=P[i].map((x,k)=>x+t*(P[i+1][k]-x));pts.push([i+t,acc+segmentWork(F,P[i],q)]);}acc+=w;}s.dot(...P[0],{label:'start',color:'accent'});s.dot(...P[2],{label:'end',color:'orange'});const ys=pts.map(p=>p[1]),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=Math.max(.5,.15*(hi-lo));g.setView([0,2],[lo-pad,hi+pad]);g.path(pts,{color:'accent'});total=acc;});v.legend([['green','positive work'],['red','negative work']]);v.readout(()=>`Total work = ${v.fix(total,5)}. Reversing negates this value; segment integrals use 80-panel Simpson quadrature.`);
 }},
 {
 num:'5.3',kind:'Theorem',name:'Fundamental theorem for line integrals',
 statement:String.raw`Let $f\in C^1(U)$ on an open set $U\subset\R^n$, and let $C$ be a piecewise $C^1$ path in $U$ from $A$ to $B$. Then $\int_C\nabla f\cdot dr=f(B)-f(A)$. In particular the integral along every closed such path is zero.`,
 idea:String.raw`The chain rule identifies the integrand with the derivative of $f(r(t))$. The one-variable fundamental theorem evaluates each smooth piece; intermediate endpoint values cancel.`,
 caption:String.raw`Bend the path while fixing its endpoints. Here $f=x^2+y^2/2$, and the right panel shows $f$ along the chosen path. Add a rotational force to see the endpoint formula acquire a residual.`,
 deps:['vcalc-5.2','vcalc-3.3','pma-6.21'],tags:['potential','fundamental theorem'],refs:['OpenStax Calculus 3 §6.3, Fundamental Theorem for Line Integrals'],links:{source:consURL},
 viz(v){const h=v.slider('path bend',-1,1,.6,{step:.05}),k=v.slider('rotational contamination',0,1,0,{step:.05}),s=v.stage({x:[-1.5,1.5],y:[-1.4,2],equal:true,height:330,title:'paths in a gradient field'}),g=v.stage({x:[0,1],y:[0,3],height:330,title:'potential along the path',xlabel:'t'});let W,D;
 v.render(()=>{const {r,d}=wiggle(h.value),F=(x,y)=>{const a=gradient(x,y),b=rotation(x,y);return a.map((z,i)=>z+k.value*b[i]);};arrows(s,F,1.4);pathDraw(s,r);s.dot(...r(0),{color:'orange',label:'A'});s.dot(...r(1),{color:'green',label:'B'});g.fn(t=>potential(...r(t)),{color:'accent'});W=work(F,r,d);D=potential(...r(1))-potential(...r(0));});v.readout(()=>`Work ≈ ${v.fix(W,6)}; endpoint difference = ${v.fix(D,6)}; residual = ${v.fix(W-D,6)}. Independent path quadrature, 800 panels.`);
 }},
 {
 num:'5.4',kind:'Definition',name:'Conservative (path-independent) fields',
 statement:String.raw`A continuous field $F$ on an open connected set $U$ is conservative if $F=\nabla f$ for some $C^1$ scalar potential $f$ on $U$. Equivalently, any two piecewise $C^1$ paths in $U$ with the same endpoints have equal work. Testing a finite family can disprove path independence, but cannot establish it for all paths.`,
 idea:String.raw`Join one route to the reverse of the other. The resulting loop has work equal to the difference of route works. A nonzero difference rules out every single-valued potential.`,
 caption:String.raw`Compare an upper and a lower route, varying their height. The gradient preset has an explicit global potential; the rotational preset supplies a counterexample whenever the enclosed area is nonzero. A coincident-route test says nothing about other loops.`,
 deps:['vcalc-5.3'],tags:['conservative fields','path independence'],refs:['MIT 18.02SC Session 61, Conservative Fields and Path Independence'],links:{source:'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/mit18_02sc_l20brds_18/'},
 viz(v){const sel=v.select('field',['gradient','rotation'],'gradient'),h=v.slider('route height',0,1.3,.8,{step:.05}),s=v.stage({x:[-1.6,1.6],y:[-1.6,1.6],equal:true,height:340}),g=v.stage({x:[-.5,2.5],y:[-7,7],height:340,axes:'box',title:'work comparison',xticks:[[0,'upper'],[1,'lower'],[2,'loop']]});let a,b;
 v.render(()=>{const F=sel.value==='gradient'?gradient:rotation;arrows(s,F,1.4);const U=bowed(h.value),L=bowed(-h.value);pathDraw(s,U.r);pathDraw(s,L.r,'orange');a=work(F,U.r,U.d);b=work(F,L.r,L.d);g.bars([a,b,a-b],{x0:0,dx:1,color:(z,i)=>['accent','orange','purple'][i]});[a,b,a-b].forEach((z,i)=>g.dot(i,z,{color:['accent','orange','purple'][i],r:4}));});v.legend([['accent','upper A to B'],['orange','lower A to B'],['purple','upper minus lower']]);v.readout(()=>`Upper ≈ ${v.fix(a,5)}; lower ≈ ${v.fix(b,5)}; closed-loop work ≈ ${v.fix(a-b,5)}. ${sel.value==='gradient'?'Global potential x²+y²/2 proves conservativity.':h.value===0?'Routes coincide: this zero test is inconclusive.':'Nonzero loop work disproves conservativity.'}`);
 }},
 {
 num:'5.5',kind:'Theorem',name:'Path independence ⇔ zero loop integrals ⇔ gradient',
 statement:String.raw`For continuous $F$ on open connected $U\subset\R^n$, these are equivalent: work is independent of the piecewise $C^1$ path between fixed endpoints; every closed piecewise $C^1$ path has zero work; and $F=\nabla f$ for a $C^1$ function $f$ on $U$. Fixing $A\in U$, one may set $f(x)=\int_A^x F\cdot dr$; the potential is unique up to a constant.`,
 idea:String.raw`Reversing and concatenating paths proves the first two conditions equivalent. If work is independent of route, append a short coordinate segment to the path ending at $x$. Dividing its work by its length and using continuity gives $\partial_i f(x)=F_i(x)$. A zero gradient makes the difference of two potentials constant on connected $U$.`,
 caption:String.raw`Drag the destination. Integrate from the origin horizontally then vertically (HV), or vertically then horizontally (VH). For $F=(y,x)$ both give $xy$. For $F=(-y,x)$ they give opposite values, so neither route prescription is a potential for that field. The heat map shows the HV prescription.`,
 deps:['vcalc-5.4'],tags:['potential','path independence'],refs:['MIT 18.04, 18.02 Review §1.7.3, Path independence and conservative functions'],links:{source:'https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/7da4ddc175425eb191066e58c5b303ff_MIT18_04S18_1802Review.pdf'},
 viz(v){const mode=v.select('field',['gradient xy','rotation'],'gradient xy'),s=v.stage({x:[-1.8,1.8],y:[-1.8,1.8],equal:true,height:390,title:'two route prescriptions'}),p=s.handle(1,.8,{color:'gold',label:'destination'});let H,V;
 v.render(()=>{const F=mode.value==='gradient xy'?(x,y)=>[y,x]:rotation;s.heat((x,y)=>x*y,{range:[-3,3],cmap:'theme-diverging',res:5,key:'xy'});s.path([[0,0],[p.x,0],[p.x,p.y]],{color:'accent',width:3});s.path([[0,0],[0,p.y],[p.x,p.y]],{color:'orange',width:3});arrows(s,F,1.6);H=segmentWork(F,[0,0],[p.x,0])+segmentWork(F,[p.x,0],[p.x,p.y]);V=segmentWork(F,[0,0],[0,p.y])+segmentWork(F,[0,p.y],[p.x,p.y]);});v.legend([['accent','HV'],['orange','VH']]);v.readout(()=>`HV ≈ ${v.fix(H,5)}; VH ≈ ${v.fix(V,5)}; loop = ${v.fix(H-V,5)}. ${mode.value==='gradient xy'?'Both reconstruct the global potential xy.':'HV = xy has gradient (y,x), which differs from the selected field (-y,x).'} At x=0 or y=0 the two-route test alone is inconclusive.`);
 }},
 ]
};
