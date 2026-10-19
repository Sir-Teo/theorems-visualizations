export const quasiIntroduction={
 num:'19.5',kind:'Concept',name:'Derivative growth and uniqueness from a germ',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., discussion19.5, p.377'],
 statement:String.raw`Holomorphic functions on a region are determined by all their derivatives at a point. Smooth real functions need not be: the nonzero function$e^{-1/x}$ for$x>0$, continued by0 for$x\le0$, has every derivative zero at0. Restrictions on derivative growth can recover uniqueness.`,
 idea:String.raw`Repeated differentiation of the positive branch gives a polynomial in$1/x$ times$e^{-1/x}$. This tends to zero at0 faster than any power, so all derivatives match the zero branch. Holomorphic Taylor expansions, by contrast, recover the function near the base point and the identity theorem extends that uniqueness.`,
 caption:String.raw`Vary the multiple of the flat function. Every displayed curve has the same all-zero Taylor series at0, while its values for$x>0$ change. This illustrates why smoothness alone cannot give Taylor uniqueness.`,
 deps:['rca-10.18a','pma-5.15'],tags:['smooth functions','quasi-analytic'],
 viz(v){const a=v.slider('multiple of the flat function',0,2,1,{step:.01});const S=v.stage({x:[-1,3],y:[-.1,1.6],height:330,full:true,title:'identical derivatives at zero, different smooth functions'});v.render(()=>{S.fn(x=>x>0?a.value*Math.exp(-1/x):0,{color:'accent'});S.hline(0,{color:'gold',dash:[5,4]});});v.legend([['accent','smooth flat function'],['gold','every Taylor polynomial at zero',{dash:true}]]);v.readout(()=>`At x=1, f(1)=${v.fix(a.value/Math.E,5)}; at zero, every derivative is zero.`);},
};
export const derivativeClassAlgebra={
 num:'19.7',kind:'Theorem',name:'Log-convex derivative classes are algebras',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem19.7 and complete proof, p.378; standing assumptions19.6, p.377'],
 statement:String.raw`Assume$M_0=1$ and$M_n^2\le M_{n-1}M_{n+1}$. Then$C\{M_n\}$ is closed under pointwise multiplication. If$f,g$ have derivative constants$(\beta_f,B_f)$ and$(\beta_g,B_g)$, their product admits$(\beta_f\beta_g,B_f+B_g)$.`,
 idea:String.raw`Convexity of$\log M_n$ and$M_0=1$ imply$M_jM_{n-j}\le M_n$. Apply Leibniz's rule to$D^n(fg)$, insert the two derivative bounds, and sum$\sum_j\binom nj B_f^jB_g^{n-j}=(B_f+B_g)^n$.`,
 caption:String.raw`For$M_n=(n!)^s$ with$s\ge1$, each actual Leibniz bound is divided by the claimed product bound. The blue terms sum to at most1; the gold binomial terms sum to1. Their gap is the saving from$M_jM_{n-j}\le M_n$.`,
 deps:['rca-19.6','pma-5.3'],tags:['quasi-analytic','Leibniz rule'],
 viz(v){const n=v.slider('derivative order',0,24,8,{int:true}),s=v.slider('factorial exponent',1,3,2,{step:.05}),q=v.slider('Bf / (Bf + Bg)',.05,.95,.4,{step:.01});
 const S=v.stage({x:[-.5,24.5],y:[0,1.05],height:350,full:true,title:'Leibniz terms divided by the product bound'});let sum;
 v.render(()=>{const blue=[],gold=[];sum=0;let c=1;for(let j=0;j<=n.value;j++){
 const common=q.value**j*(1-q.value)**(n.value-j),a=c**(1-s.value)*common,b=c*common;blue.push([j,a]);gold.push([j,b]);sum+=a;c*= (n.value-j)/(j+1);
 }S.setView([-.5,n.value+.5],null);S.path(gold,{color:'gold'});S.dots(gold,{color:'gold',r:4});S.path(blue,{color:'accent'});S.dots(blue,{color:'accent',r:4});});
 v.legend([['accent','normalized Leibniz terms'],['gold','binomial upper bounds']]);v.readout(()=>`Sum of normalized Leibniz bounds = ${v.fix(sum??0,6)} ≤ 1.`);},
};
export const quasiDefinition={
 num:'19.8',kind:'Definition',name:'Quasi-analytic derivative classes',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Definition19.8, p.378'],
 statement:String.raw`The class$C\{M_n\}$ is quasi-analytic if$f^{(n)}(0)=0$ for all$n\ge0$ implies$f\equiv0$. Translation invariance makes the choice of base point immaterial. Equivalently, two members with identical derivatives at one point coincide everywhere.`,
 idea:String.raw`Subtract the two functions and translate the common base point to zero. The resulting function remains in the derivative class, so the defining uniqueness condition applies.`,
 deps:['rca-19.6'],tags:['definitions','quasi-analytic'],
};
