const tau=2*Math.PI;
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const divide=(a,b)=>{const d=b[0]**2+b[1]**2;return[(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];};
const power=(z,p)=>{const r=Math.hypot(...z)**p,t=p*Math.atan2(z[1],z[0]);return[r*Math.cos(t),r*Math.sin(t)];};
export function cyclicApproximationError(a,n){let sum=0;for(let j=0;j<=n+1;j++)sum+=a**(2*j);return a**(n+1)/Math.sqrt(sum);}

export const logSubharmonic={
 num:'17.3',kind:'Theorem',name:'Logarithms and powers of holomorphic moduli are subharmonic',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem17.3 and proof, pp.335–336'],
 statement:String.raw`If $f$ is holomorphic on a region and is not identically zero, then $\log|f|$, $\log^+|f|$, and $|f|^p$ for every$p>0$ are subharmonic. At a zero, $\log|f|=-\infty$.`,
 idea:String.raw`Away from zeros, a local holomorphic logarithm makes$\log|f|$ harmonic. At a zero its value is$-\infty$, so the sub-mean inequality holds there as well. The increasing convex compositions$\max(t,0)$ and$e^{pt}$ then give the other assertions by17.2.`,
 caption:String.raw`For$f(z)=(z-a)(z+a)$, drag the circle center and vary its radius. Each root contributes$\log\max(r,|z_0-\alpha|)$ to the exact circular mean of$\log|f|$. A circle containing a zero has a strictly larger mean than the center value. The plot floors log values at−8 solely for display; the readout treats a zero as$-\infty$.`,
 deps:['rca-17.2','rca-15.18'],tags:['subharmonic','Jensen'],
 viz(v){const a=v.slider('root location $a$',.1,1,.6,{step:.01}),r=v.slider('radius',.02,1,.4,{step:.01});
  const S=v.stage({x:[-2,2],y:[-1.6,1.6],equal:true,height:380,full:true,title:'log modulus and an averaging circle'});
  const z=S.handle(.2,.3,{color:'gold',label:'z₀'});let st;
  v.render(()=>{const log=(x,y)=>Math.log(Math.hypot(x-a.value,y))+Math.log(Math.hypot(x+a.value,y));
   S.raster((x,y)=>v.ramp((Math.max(-8,log(x,y))+3)/5,'accent'),{key:String(a.value),res:3});
   S.circle(z.x,z.y,r.value,{color:'gold',width:2});S.dot(a.value,0,{color:'red',r:5});S.dot(-a.value,0,{color:'red',r:5});
   st={value:log(z.x,z.y),mean:Math.log(Math.max(r.value,Math.hypot(z.x-a.value,z.y)))+Math.log(Math.max(r.value,Math.hypot(z.x+a.value,z.y)))};
  });v.legend([['gold','averaging circle'],['red','zeros',{dot:true}]]);
  v.readout(()=>st?`Center log modulus ${Number.isFinite(st.value)?v.fix(st.value,5):'−∞'} ≤ exact circular mean ${v.fix(st.mean,5)}.`:'');
 },
};

export const hardyNorms={
 num:'17.8',kind:'Proposition',name:'Norms and completeness of Hardy spaces',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Remarks17.8(a)–(d), p.338'],
 statement:String.raw`The integral means of a holomorphic function increase with the radius, and $\|f\|_p=\lim_{r\to1}\|f_r\|_p$. For$1\le p\le\infty$, $H^p$ with this norm is a Banach space. For$0<p<1$ it is still a vector space, but this expression need not satisfy the triangle inequality.`,
 idea:String.raw`For$p\ge1$, Minkowski passes to the increasing radial limit. A Cauchy sequence in the Hardy norm is locally uniformly Cauchy by the Cauchy integral formula. Its holomorphic limit has Hardy norm distance tending to zero by taking limits first on each circle and then taking their supremum. For$p<1$, the usual triangle inequality fails, as the polynomial example illustrates.`,
 caption:String.raw`Compare$f=(1+z)^8$ and$g=(1-z)^8$. On the unit circle their phases agree, while their moduli concentrate on opposite semicircles. Their Hardy means are computed from2048midpoint samples. For$p<1$ this pair violates$\|f+g\|_p\le\|f\|_p+\|g\|_p$; at$p\ge1$ Minkowski applies. This finite polynomial experiment illustrates the norm condition, not the infinite-sequence completeness proof.`,
 deps:['rca-17.7','rca-3.5','rca-10.28'],tags:['Hardy spaces','Banach spaces'],
 viz(v){const p=v.slider('exponent $p$',.4,3,.6,{step:.02});
  const S=v.stage({x:[-Math.PI,Math.PI],y:[0,280],height:350,full:true,title:'boundary moduli of two concentrating polynomials'});let st;
  v.render(()=>{const f=t=>(2*Math.cos(t/2))**8,g=t=>(2*Math.sin(t/2))**8,q=p.value;let A=0,B=0,C=0;
   for(let j=0;j<2048;j++){const t=tau*(j+.5)/2048;A+=f(t)**q/2048;B+=g(t)**q/2048;C+=(f(t)+g(t))**q/2048;}
   S.fn(f,{color:'accent'});S.fn(g,{color:'green'});S.fn(t=>f(t)+g(t),{color:'gold',dash:[4,4]});st={a:A**(1/q),b:B**(1/q),c:C**(1/q)};
  });v.legend([['accent','|f|'],['green','|g|'],['gold','|f+g|',{dash:true}]]);
  v.readout(()=>st?`‖f+g‖p=${v.fix(st.c,5)}; ‖f‖p+‖g‖p=${v.fix(st.a+st.b,5)}. ${p.value<1?'This pair violates the usual triangle inequality.':'Minkowski gives the usual triangle inequality.'}`:'');
 },
};

export const hardyH2Factor={
 num:'17.10',kind:'Theorem',name:'A zero-free H² factor for every Hᵖ function',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem17.10 and proof, p.339'],
 statement:String.raw`If$0<p<\infty$, $0\ne f\in H^p$, and$B$is its zero Blaschke product, there is a zero-free$h\in H^2$ with$f=B h^{2/p}$ and$\|h\|_2^2=\|f\|_p^p$. In particular every$H^1$function is a product of two$H^2$functions.`,
 idea:String.raw`The zero-free quotient$f/B$has a holomorphic logarithm$\varphi$on$U$. Set$h=\exp(p\varphi/2)$. Then$|h|^2=|f/B|^p$, and the norm identity follows from17.9. For$p=1$, write$f=(Bh)h$. The fractional power uses this holomorphic logarithm, not an independently chosen branch.`,
 caption:String.raw`An exact bounded example:$f=B/(1-0.7z)$ and$h=(1-0.7z)^{-p/2}$. Drag$z$, vary$p$, and move the real zero of$B$. The identity holds pointwise. The plotted circle means are finite-radius quantities: the means of$|f/B|^p$and$|h|^2$agree at every radius; the means of$|f|^p$approach the same norm only at the boundary.`,
 deps:['rca-17.9','rca-13.11'],tags:['Hardy spaces','factorization'],
 viz(v){const p=v.slider('exponent $p$',.3,3,1,{step:.05}),a=v.slider('Blaschke zero',-.8,.8,.3,{step:.01});
  const L=v.stage({x:[-1.2,1.2],y:[-1.2,1.2],equal:true,height:320,title:'disc and selected point'});
  const R=v.stage({x:[0,1],y:[0,5],height:320,title:'circle means: |f|ᵖ and |h|²'});
  const z=L.handle(.2,.3,{color:'gold',label:'z',constrain:(x,y)=>{const d=Math.hypot(x,y);return d>.95?[.95*x/d,.95*y/d]:[x,y];}});let st;
  v.render(()=>{const q=p.value,b=w=>divide([w[0]-a.value,w[1]],[1-a.value*w[0],-a.value*w[1]]),g=w=>divide([1,0],[1-.7*w[0],-.7*w[1]]);
   const means=[];for(let j=0;j<=60;j++){const r=.999*j/60;let fmean=0,hmean=0;for(let k=0;k<256;k++){const t=tau*k/256,w=[r*Math.cos(t),r*Math.sin(t)],G=g(w);fmean+=Math.hypot(...mul(b(w),G))**q/256;hmean+=Math.hypot(...G)**q/256;}means.push([r,fmean,hmean]);}
   R.setView(null,[0,1.1*Math.max(...means.map(x=>x[2]))]);R.path(means.map(x=>[x[0],x[1]]),{color:'accent'});R.path(means.map(x=>[x[0],x[2]]),{color:'green'});L.circle(0,0,1,{color:'ink'});L.dot(a.value,0,{color:'red',r:5});
   const w=[z.x,z.y],G=g(w),h=power(G,q/2),f=mul(b(w),G),recovered=mul(b(w),power(h,2/q));st=Math.hypot(f[0]-recovered[0],f[1]-recovered[1]);
  });v.legend([['accent','mean |f|ᵖ'],['green','mean |h|² = mean |f/B|ᵖ'],['red','zero',{dot:true}]]);
  v.readout(()=>`Pointwise factorization discrepancy ${Number(st||0).toExponential(2)}. The norm equality is the boundary limit, not equality of the two plotted curves at each radius.`);
 },
};

export const hardyCoefficients={
 num:'17.12',kind:'Theorem',name:'H² is characterized by square-summable Taylor coefficients',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem17.12 and proof, p.341'],
 statement:String.raw`If$f(z)=\sum_{n\ge0}c_nz^n$is holomorphic in$U$, then$\|f\|_2^2=\sum_{n\ge0}|c_n|^2$, allowing either side to be infinite. Thus$f\in H^2$if and only if its Taylor coefficients are square summable.`,
 idea:String.raw`Parseval on each interior circle gives$\|f_r\|_2^2=\sum|c_n|^2r^{2n}$. Let$r\uparrow1$and apply monotone convergence to the nonnegative series.`,
 caption:String.raw`For$f_a(z)=1/(1-az)$, the coefficients are$a^n$. The selected interior-circle mean is exactly$1/(1-a^2r^2)$. The partial coefficient sums increase toward$1/(1-a^2)$when$a<1$; at$a=1$they diverge, although every interior circle still has finite mean.`,
 deps:['rca-4.26','rca-17.7','rca-1.27'],tags:['Hardy spaces','Parseval'],
 viz(v){const a=v.slider('coefficient ratio $a$',0,1,.8,{step:.01}),r=v.slider('interior radius',0,.999,.8,{step:.001}),N=v.slider('last coefficient $N$',1,100,20,{int:true});
  const S=v.stage({x:[0,101],y:[0,25],height:350,full:true,title:'partial sums of squared Taylor coefficients'});
  v.render(()=>{let sum=0;const points=[];for(let j=0;j<=100;j++){sum+=a.value**(2*j);points.push([j,sum]);}
   const max=a.value===1?101:1/(1-a.value*a.value);S.setView(null,[0,Math.min(110,max*1.1)]);S.path(points,{color:'accent'});S.dot(N.value,points[N.value][1],{color:'gold',r:5});if(a.value<1)S.hline(max,{color:'green',dash:[4,4]});
  });v.legend([['accent','partial coefficient sum'],['green','finite full sum when a<1',{dash:true}],['gold','selected truncation',{dot:true}]]);
  v.readout(()=>`Interior-circle squared mean ${v.fix(1/(1-a.value*a.value*r.value*r.value),5)}. ${a.value===1?'Full coefficient sum is unbounded: f is outside H².':`Full squared H² norm ${v.fix(1/(1-a.value*a.value),5)}.`}`);
 },
};

export const boundaryNonvanishing={
 num:'17.18',kind:'Theorem',name:'A nonzero Hᵖ function has nonzero boundary values almost everywhere',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem17.18 and uniqueness consequence, p.345'],
 statement:String.raw`If$0<p\le\infty$and$0\ne f\in H^p$, then$f^*\ne0$almost everywhere on$T$. Consequently two$H^p$functions with equal boundary values on a set of positive measure are identical.`,
 idea:String.raw`Factorization implies$\log|f^*|\in L^1(T)$. If$f^*$vanished on a positive-measure set, this logarithm would equal$-\infty$there and could not be integrable. Apply the result to$f-g$for uniqueness.`,
 caption:String.raw`The singular inner function$S(z)=\exp[-c(1+z)/(1-z)]$is bounded, yet has radial limit0at the single boundary point1. At every other boundary point its limiting modulus is1. Shrinking the radius compresses the dip in the displayed modulus into a smaller arc; it does not create a positive-measure boundary zero set.`,
 deps:['rca-17.17','rca-15.19'],tags:['Hardy spaces','boundary uniqueness'],
 viz(v){const c=v.slider('singular mass $c$',.1,3,1,{step:.05}),r=v.slider('radius',.1,.9999,.95,{step:.0001});
  const S=v.stage({x:[-Math.PI,Math.PI],y:[-.05,1.05],height:350,full:true,title:'modulus of a singular inner function on an interior circle'});
  v.render(()=>S.fn(t=>Math.exp(-c.value*(1-r.value*r.value)/((1-r.value)**2+2*r.value*(1-Math.cos(t)))),{color:'accent',n:2200}));
  v.readout(()=>`At the singular direction, log modulus ${v.fix(-c.value*(1+r.value)/(1-r.value),4)} (finite at every r<1). The limiting zero is one boundary point; elsewhere the boundary modulus is 1.`);
 },
};

export const cyclicSubspace={
 num:'17.23',kind:'Theorem',name:'The inner factor determines the cyclic subspace',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem17.23 and complete proof, p.350'],
 statement:String.raw`If$0\ne f\in H^2$has inner factor$M_f$, the smallest closed shift-invariant subspace containing$f$is$M_fH^2$. Thus polynomial multiples of$f$are dense in$H^2$exactly when$f$is outer.`,
 idea:String.raw`Beurling gives the generated subspace$Y=\varphi H^2$. Since$f=\varphi h$, uniqueness of the outer factor gives$Q_h=Q_f$and$M_f=\varphi M_h\in Y$. Therefore$M_fH^2\subset Y$, while the reverse inclusion follows because$M_fH^2$is closed, invariant and contains$f$.`,
 caption:String.raw`For$f(z)=1-az$, the best degree$N$polynomial multiple approximating1has exact H2 error$a^{N+1}/\sqrt{\sum_{j=0}^{N+1}a^{2j}}$. If$a\le1$the function is outer and this tends to0(including the slow boundary-zero case$a=1$). If$a>1$there is an interior zero and the error tends to$\sqrt{1-a^{-2}}>0$.`,
 deps:['rca-17.21','rca-17.17'],tags:['cyclic vector','shift invariant'],
 viz(v){const a=v.slider('zero parameter $a$',0,1.5,.8,{step:.01}),N=v.slider('polynomial degree $N$',0,100,10,{int:true});
  const S=v.stage({x:[0,101],y:[0,1.05],height:350,full:true,title:'best H² error approximating 1 by (1−az)P_N'});
  v.render(()=>{S.path(Array.from({length:101},(_,n)=>[n,cyclicApproximationError(a.value,n)]),{color:'accent',width:2});S.dot(N.value,cyclicApproximationError(a.value,N.value),{color:'gold',r:5});if(a.value>1)S.hline(Math.sqrt(1-1/a.value**2),{color:'red',dash:[4,4]});});
  v.legend([['accent','exact least-squares error'],['gold','selected degree',{dot:true}],['red','positive limiting obstruction when a>1',{dash:true}]]);
  v.readout(()=>`Best error ${v.fix(cyclicApproximationError(a.value,N.value),7)}. ${a.value<=1?'Outer: polynomial multiples are dense in H².':`Interior zero at ${v.fix(1/a.value,4)}: positive limiting error ${v.fix(Math.sqrt(1-1/a.value**2),6)}.`}`);
 },
};
