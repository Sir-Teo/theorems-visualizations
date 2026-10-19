const TAU=2*Math.PI;
export const poissonAtom = (radius,angle) => (1-radius*radius)/((1-radius)**2+2*radius*(1-Math.cos(angle)));
export const approachComparisonConstant = alpha => (1+2/(1-alpha))**2;
// Poisson extension of the indicator of the right semicircle; the argument has positive real part in U.
export const poissonSemicircle = (r,t) => .5+Math.atan2(2*r*Math.cos(t),1-r*r)/Math.PI;
export const poissonLp={
  num:'11.16',kind:'Theorem',name:'Poisson integrals contract Lᵖ norms and recover their boundary data',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.16 and proof, pp. 239–240'],
  statement:String.raw`If $1\le p\le\infty$, $f\in L^p(T)$ and $u=P[f]$, then $\|u_r\|_p\le\|f\|_p$ for $0\le r<1$. If $p<\infty$, then $\|u_r-f\|_p\to0$ as $r\to1$. Norm convergence is not asserted for $p=\infty$.`,
  idea:String.raw`The positive Poisson kernel has integral one. Jensen (or Hölder) followed by Fubini gives the contraction. For finite $p$, approximate $f$ by a continuous $g$ in $L^p$; the contraction controls $P[f-g]$, and uniform boundary convergence for $P[g]$ gives the result by the triangle inequality. Continuous functions are not dense in all of $L^\infty$, so that argument does not extend to its norm.`,
  caption:String.raw`Compare a continuous Fourier polynomial with a semicircle indicator. The curves are exact Poisson extensions. The finite-$p$ norms use midpoint quadrature; the supremum error for the indicator is analytic, while supremum norms of the smooth example use a dense angle grid. For the discontinuous indicator the essential supremum error stays $1/2$ at every finite radius, although each finite-$p$ error tends to zero. This is why the theorem excludes $p=\infty$ from its convergence conclusion.`,
  deps:['rca-11.8','rca-3.3','rca-3.14'],tags:['Poisson integral','Lp'],
  viz(v){
    const mode=v.select('boundary data',[{value:'step',label:'semicircle indicator'},{value:'smooth',label:'continuous Fourier polynomial'}],'step');
    const p=v.select('norm',[1,2,4,8,Infinity].map(value=>({value:String(value),label:value===Infinity?'supremum':`p=${value}`})),'2');
    const radius=v.slider('radius $r$',0,.999,.75,{step:.001});
    const L=v.stage({x:[-Math.PI,Math.PI],y:[-.2,1.7],height:300,title:'boundary function and its Poisson extension'});
    const R=v.stage({x:[0,1],y:[0,1.1],height:300,title:'norm of the boundary error against radius'});let st;
    v.render(()=>{
      const step=mode.value==='step',q=+p.value,r=radius.value;
      const f=t=>step?(Math.cos(t)>0?1:0):.6+.4*Math.cos(t)+.25*Math.sin(3*t);
      const u=(s,t)=>step?poissonSemicircle(s,t):.6+.4*s*Math.cos(t)+.25*s**3*Math.sin(3*t);
      const norm=(s,error)=>{
        if(q===Infinity){if(step)return error?.5:.5+2*Math.atan(s)/Math.PI;
          // The continuous example is estimated on a dense angle grid, labelled as such below.
          let max=0;for(let j=0;j<2048;j++){const t=TAU*(j+.5)/2048;max=Math.max(max,Math.abs(error?u(s,t)-f(t):u(s,t)));}return max;}
        let sum=0;for(let j=0;j<2048;j++){const t=TAU*(j+.5)/2048;sum+=Math.abs(error?u(s,t)-f(t):u(s,t))**q/2048;}return sum**(1/q);
      };
      const error=norm(r,true),unorm=norm(r,false),fnorm=step?(q===Infinity?1:.5**(1/q)):norm(1,false);
      const points=Array.from({length:70},(_,j)=>{const s=1-10**(-4*j/69);return[s,norm(s,true)];});
      L.fn(f,{color:'muted',width:2,n:1200});L.fn(t=>u(r,t),{color:'accent',width:2,n:1200});
      R.path(points,{color:'red',width:2});R.dot(r,error,{color:'gold',r:5});
      st={r,error,unorm,fnorm,step,q};
    });
    v.legend([['muted','boundary data'],['accent','Poisson extension'],['red','boundary error norm'],['gold','selected radius',{dot:true}]]);
    v.readout(()=>st?`r=${v.fix(st.r,3)}; extension norm ${v.fix(st.unorm,5)} ≤ boundary norm ${v.fix(st.fnorm,5)}; error ${v.fix(st.error,5)}. ${st.q===Infinity?(st.step?'Exact supremum error 1/2: no L∞ convergence.':'Supremum estimated on 2048 angles.'): 'Finite-p norms use 2048 midpoint samples.'}`:'');
  },
};
export const poissonZeroDerivative={
  num:'11.22',kind:'Theorem',name:'Zero symmetric derivative implies a zero nontangential Poisson limit',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.22 and proof, pp. 243–244'],
  statement:String.raw`If $\mu$ is a positive Borel measure on $T$ and $(D\mu)(e^{i\theta})=0$, its Poisson integral $P[d\mu]$ has nontangential limit zero at $e^{i\theta}$.`,
  idea:String.raw`Restrict $\mu$ to a sufficiently small arc centered at the target. The derivative hypothesis makes the centered maximal function of that restriction arbitrarily small. The nontangential maximal estimate controls its Poisson integral. The remaining mass stays a fixed distance away, where the Poisson kernels converge uniformly to zero.`,
  caption:String.raw`For $\mu=\delta_1$, the symmetric derivative is zero at every boundary point except $1$. Approach the chosen target along $z_r=r\exp(i[\theta+k(1-r)])$, with finite $k$: this is a nontangential path. Away from $1$, the exact Poisson integral tends to zero. At $\theta=0$, the hypothesis fails and the integral diverges. The log plot omits no positive values.`,
  deps:['rca-11.20','rca-11.18','rca-11.5'],tags:['Poisson integral','nontangential limits'],
  viz(v){
    const theta=v.slider('target angle $\\theta$',-Math.PI,Math.PI,1,{step:.01});
    const slope=v.slider('approach slope $k$',-3,3,1,{step:.05});
    const gap=v.slider('distance parameter $1-r$',.00001,.3,.05,{log:true});
    const L=v.stage({x:[-1.2,1.2],y:[-1.2,1.2],equal:true,height:300,axes:false,title:'approach to the selected boundary point'});
    const R=v.stage({x:[-5,-.5],y:[-6,6],height:300,title:'log Poisson integral against log(1-r)'});let st;
    v.render(()=>{
      const th=theta.value,k=slope.value,d=gap.value,r=1-d;
      const point=s=>[s*Math.cos(th+k*(1-s)),s*Math.sin(th+k*(1-s))];
      const value=delta=>poissonAtom(1-delta,th+k*delta);
      L.circle(0,0,1,{color:'ink'});L.curve(point,.7,.99999,{color:'accent',n:300});L.dot(...point(r),{color:'gold',r:5});L.dot(Math.cos(th),Math.sin(th),{color:'green',r:5});L.dot(1,0,{color:'red',r:6});
      R.path(Array.from({length:250},(_,j)=>{const a=-5+4.5*j/249;return[a,Math.log10(value(10**a))];}),{color:'accent',width:2});R.dot(Math.log10(d),Math.log10(value(d)),{color:'gold',r:5});st={value:value(d),th};
    });
    v.legend([['red','unit atom at 1',{dot:true}],['green','target boundary point',{dot:true}],['accent','nontangential approach'],['gold','selected point',{dot:true}]]);
    v.readout(()=>st?`Poisson integral ${v.fix(st.value,6)}. ${st.th===0?'Target is the atom: the zero-derivative hypothesis fails.':'Target differs from the atom: the derivative is zero and the limit is zero.'}`:'');
  },
};

export const poissonMaximalLp={
 num:'11.25',kind:'Theorem',name:'Poisson nontangential maximal functions: weak L¹ and strong Lᵖ',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem11.25 and complete proof, pp.244–245'],
 statement:String.raw`For$0<\alpha<1$ there are finite constants$A(\alpha,p)$ such that: if$u=P[d\mu]$ for a complex Borel measure on$\T$, then$\sigma\{N_\alpha u>\lambda\}\le A(\alpha,1)\|\mu\|/\lambda$ for$\lambda>0$; if$u=P[f]$ with$f\in L^p(\T)$ and$1<p\le\infty$, then$\|N_\alpha u\|_p\le A(\alpha,p)\|f\|_p$. Here$\sigma$ is normalized arc measure.`,
 idea:String.raw`The comparison11.20 bounds the nontangential maximal function by a constant times the centered maximal function of$|\mu|$ or$|f|\,d\sigma$. The weak estimate follows from7.4. Integrating the distribution-function bound after splitting$f$ above and below a varying threshold gives the strong$L^p$ estimate, by the argument in8.18(7).`,
 caption:String.raw`The positive Fourier polynomial$f(e^{it})=1+a\cos t$ has exact extension$u(z)=1+a\Re z$. The plotted maximal function is a lower approximation, sampled on24radii and25directions in the convex-hull approach region. Its measured$L^p$ ratio illustrates boundedness; it neither computes the theorem's optimal constant nor proves a supremum over the full region.`,
 deps:['rca-11.20','rca-7.4','rca-8.8'],tags:['maximal functions','Poisson integral','Lp'],
 viz(v){const a=v.slider('amplitude $a$',0,.95,.7,{step:.01}),alpha=v.slider('approach parameter',.1,.9,.5,{step:.05}),p=v.slider('exponent $p$',1.1,8,2,{step:.1});
  const S=v.stage({x:[-Math.PI,Math.PI],y:[0,2.1],height:350,full:true,title:'boundary data and a sampled nontangential maximum'});let st;
  v.render(()=>{const out=[];let nf=0,nn=0;for(let j=0;j<256;j++){
   const t=-Math.PI+TAU*(j+.5)/256;let max=1+a.value*Math.cos(t);
   // Convex combinations of the boundary vertex with points of the alpha disc.
   for(let k=0;k<24;k++){const s=k/24;for(let l=0;l<25;l++){const x=(1-s)*alpha.value*Math.cos(TAU*l/25)+s*Math.cos(t);max=Math.max(max,1+a.value*x);}}
   out.push([t,max]);nf+=(1+a.value*Math.cos(t))**p.value/256;nn+=max**p.value/256;
  }S.fn(t=>1+a.value*Math.cos(t),{color:'accent'});S.path(out,{color:'gold'});st={f:nf**(1/p.value),n:nn**(1/p.value)};});
  v.legend([['accent','boundary data'],['gold','sampled nontangential maximum']]);v.readout(()=>st?`Midpoint estimates: ‖f‖p=${v.fix(st.f,4)}; ‖Nsample u‖p=${v.fix(st.n,4)}; ratio=${v.fix(st.n/st.f,4)}. A finite sample gives a lower bound for the actual maximal function.`:'');
 },
};
