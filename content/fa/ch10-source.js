// Rudin2, complete printed pp.257–267: restored numbered results.
import { norm2, jordanExp } from './ch10-source.shared.js';
export default {collection:'fa',chapter:10,items:[
  {
    num:'10.19',kind:'Theorem',name:'A reverse product bound forces the scalar algebra',
    statement:String.raw`If a Banach algebra satisfies $\norm x\norm y\le M\norm{xy}$ for all $x,y$ with one finite constant $M$, then it is isometrically isomorphic to $\C$.`,
    idea:String.raw`At a boundary limit $y_n\to y$ of invertibles,10.17 makes $\norm{y_n^{-1}}\to\infty$. The assumed inequality with $y_n,y_n^{-1}$ forces $y=0$. Each boundary point $\lambda$ of a spectrum makes $\lambda e-x$ such a boundary element, hence $x=\lambda e$.`,
    caption:String.raw`Compare scalars with coordinatewise multiplication on $\C^2$, both using the maximum norm. Change $\epsilon$: the two unit vectors $(1,\epsilon)$ and $(\epsilon,1)$ have product norm $\epsilon$. At zero the product vanishes although neither factor does, so no uniform reverse bound exists in $\C^2$.`,
    deps:['fa-10.17','fa-10.13'],tags:['Banach algebras','division algebras'],viz(v){const e=v.slider('ε',0,1,.4,{step:.01});const alg=v.select('algebra',[{value:'pair',label:'coordinatewise ℂ²'},{value:'scalar',label:'scalars ℂ'}],'pair');const S=v.stage({x:[0,1.05],y:[0,1.1],height:280,axes:'box',xlabel:'ε',ylabel:'product norm'});let q;
      v.render(()=>{q=alg.value==='pair'?e.value:1;S.fn(t=>alg.value==='pair'?t:1,{color:'blue'});S.dot(e.value,q,{color:'red',r:5});});v.readout(()=>`Both factors have norm1; the product norm is $${v.fix(q,3)}$. `+(q===0?'Nonzero zero divisors rule out every finite M.':`The reverse bound requires $M\\ge ${v.fix(1/q,3)}$ for this pair.`));},
  },
  {
    num:'10.20',kind:'Theorem',name:'Spectra vary upper semicontinuously',
    statement:String.raw`If $\sigma(x)\subset\Omega$ for an open $\Omega\subset\C$, then some $\delta>0$ satisfies $\sigma(x+y)\subset\Omega$ whenever $\norm y<\delta$.`,
    idea:String.raw`The resolvent norm is bounded by some $M$ outside $\Omega$, since it is continuous there and tends to zero at infinity. If $\norm y<1/M$, factor $\lambda e-x-y=(\lambda e-x)[e-(\lambda e-x)^{-1}y]$ and apply10.7.`,
    caption:String.raw`The matrix $x=\begin{pmatrix}0&k\\0&0\end{pmatrix}$ has spectrum $\{0\}$. Perturb its lower-left entry by $\epsilon$: its two eigenvalues become $\pm\sqrt{k\epsilon}$. The disk $\Omega$ has radius $r$; the exact condition $|\epsilon|<r^2/k$ keeps both eigenvalues inside. Large nonnormality $k$ makes the admissible perturbation smaller.`,
    deps:['fa-10.7','fa-10.12','fa-10.13'],tags:['spectrum','perturbation'],viz(v){const k=v.slider('k',.1,4,1,{step:.05}),e=v.slider('perturbation ε',-.8,.8,.1,{step:.01}),r=v.slider('disk radius r',.2,1.5,.7,{step:.01});const S=v.stage({x:[-2,2],y:[-2,2],height:340,equal:true,axes:true});let inside;
      v.render(()=>{S.circle(0,0,r.value,{color:'blue',fill:'blue',fillAlpha:.08});const a=Math.sqrt(k.value*Math.abs(e.value));for(const sign of[-1,1])S.dot(e.value>=0?sign*a:0,e.value<0?sign*a:0,{color:'red',r:6});inside=a<r.value;});v.readout(()=>`$\\|y\\|=|\\epsilon|=${v.fix(Math.abs(e.value),3)}$; threshold $r^2/k=${v.fix(r.value*r.value/k.value,3)}$. `+(inside?'Both eigenvalues lie in Ω.':'The eigenvalues reach or leave Ω: the small-perturbation hypothesis fails.'));},
  },
  {
    num:'10.25',kind:'Theorem',name:'Rational functions agree with the Cauchy calculus',
    statement:String.raw`For a rational function $R=P+\sum_{j,k}c_{jk}(\lambda-a_j)^{-k}$ with no pole on $\sigma(x)$, define $R(x)=P(x)+\sum_{j,k}c_{jk}(x-a_je)^{-k}$. If $\Gamma$ surrounds $\sigma(x)$ in an open region where $R$ is holomorphic, then $R(x)=\frac1{2\pi i}\int_\Gamma R(\lambda)(\lambda e-x)^{-1}d\lambda$.`,
    idea:String.raw`Apply10.24 separately to the polynomial and principal-part terms and add the finite collection of identities.`,
    caption:String.raw`For the Jordan matrix $x=\begin{pmatrix}0&k\\0&0\end{pmatrix}$, compare $(x-aI)^{-1}$ with the Cauchy integral for $R(\lambda)=1/(\lambda-a)$. The circular contour must surround zero and avoid enclosing the pole. The integral uses256 midpoint nodes; it is a quadrature approximation.`,
    deps:['fa-10.24','fa-10.22'],tags:['functional calculus','rational functions'],viz(v){const a=v.slider('pole a',.15,2,1.2,{step:.01}),r=v.slider('contour radius',.1,1.5,.5,{step:.01}),k=v.slider('Jordan entry k',0,2,1,{step:.01});const S=v.stage({x:[-2.2,2.2],y:[-1.8,1.8],height:320,equal:true,axes:true});let err;
      v.render(()=>{S.circle(0,0,r.value,{color:'purple'});S.dot(0,0,{color:'red',r:5,label:'spectrum'});S.dot(a.value,0,{color:'orange',r:5,label:'pole'});let d=0,o=0;for(let j=0;j<256;j++){const t=2*Math.PI*(j+.5)/256,z=[r.value*Math.cos(t),r.value*Math.sin(t)],w=[z[0]-a.value,z[1]],den=w[0]*w[0]+w[1]*w[1],f=[w[0]/den,-w[1]/den];d+=f[0]/256;const q=z[0]*z[0]+z[1]*z[1];o+=k.value*(f[0]*z[0]+f[1]*z[1])/q/256;}err=norm2([[d+1/a.value,o+k.value/a.value**2],[0,d+1/a.value]]);});v.readout(()=>`Computed error $\\|\\text{integral}-(x-aI)^{-1}\\|=${v.sci(err,3)}$. `+(r.value<a.value?'The contour excludes the pole, as required.':'The pole is enclosed or on the contour: this is not an admissible contour.'));},
  },
  {
    num:'10.32',kind:'Definition',name:'Point spectrum',
    statement:String.raw`For $T\in\mathscr B(X)$, its point spectrum $\sigma_p(T)$ is the set of eigenvalues: $\lambda\in\sigma_p(T)$ exactly when $\ker(T-\lambda I)\ne\{0\}$.`,
    idea:String.raw`Every eigenvalue belongs to the spectrum, but a bounded operator in infinite dimensions can have spectral points that are not eigenvalues.`,deps:['fa-10.10'],tags:['operators','spectrum'],},
  {
    num:'10.33',kind:'Theorem',name:'The functional calculus preserves eigenvectors',
    statement:String.raw`Let $T\in\mathscr B(X)$, let $\Omega$ contain $\sigma(T)$, and let $f\in H(\Omega)$.
(a) $Tv=av$ implies $\tilde f(T)v=f(a)v$.
(b) $f(\sigma_p(T))\subset\sigma_p(\tilde f(T))$.
(c) If $b\in\sigma_p(\tilde f(T))$ and $f-b$ is not identically zero on any component of $\Omega$, then $b\in f(\sigma_p(T))$.
(d) In particular, if $f$ is nonconstant on every component, the inclusion in(b) is equality.`,
    idea:String.raw`Factor $f(\lambda)-f(a)$ by $\lambda-a$ for(a). For(c), the zeros of $f-b$ on the compact spectrum form a finite set. Factor those zeros off; the remaining factor is invertible by10.28. A product of injective operators is injective, so an eigenvector for $\tilde f(T)$ forces one factor $T-aI$ to have a nonzero kernel.`,
    caption:String.raw`The Jordan matrix $T=\mu I+kN$ has eigenvectors along the horizontal axis when $k\ne0$. Rotate the unit vector: the two residuals test $Tv=\mu v$ and $\exp(T)v=e^\mu v$. The exponential is computed independently by its power series.`,
    deps:['fa-10.27','fa-10.28','fa-10.32'],tags:['eigenvectors','functional calculus'],viz(v){const mu=v.slider('μ',-1,1,.2,{step:.01}),k=v.slider('k',0,2,1,{step:.01}),th=v.slider('vector angle',0,180,0,{step:1});const S=v.stage({x:[-4,4],y:[-3,3],height:320,equal:true,axes:true});let r1,r2;v.render(()=>{const a=th.value*Math.PI/180,u=[Math.cos(a),Math.sin(a)],t=[mu.value*u[0]+k.value*u[1],mu.value*u[1]],em=Math.exp(mu.value),E=jordanExp(mu.value,k.value).series,f=[E[0][0]*u[0]+E[0][1]*u[1],E[1][0]*u[0]+E[1][1]*u[1]];S.arrow(0,0,u[0],u[1],{color:'blue'});S.arrow(0,0,t[0],t[1],{color:'orange'});S.arrow(0,0,f[0],f[1],{color:'green'});r1=Math.abs(k.value*u[1]);r2=em*r1;});v.legend([['blue','v'],['orange','Tv'],['green','exp(T)v']]);v.readout(()=>`Eigenvector residual $\\|Tv-\\mu v\\|=${v.fix(r1,4)}$; transformed residual $\\|\\exp(T)v-e^\\mu v\\|=${v.fix(r2,4)}$.`);},
  },
]};
