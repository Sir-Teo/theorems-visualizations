export const denseFourierDivergence = {
  num: '5.12', kind: 'Theorem', name: 'Generic continuous functions have densely divergent Fourier series',
  refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 5.12 and preceding proof, pp. 102–103'],
  statement: String.raw`There is a dense $G_\delta$ set $E\subset C(T)$ such that, for each $f\in E$, the set $Q_f=\{x:\sup_n|s_n(f;x)|=\infty\}$ is a dense $G_\delta$ in $T$.`,
  idea: String.raw`Choose a countable dense set $\{x_j\}$ in $T$. By 5.11 each $E_j=\{f:\sup_n|s_n(f;x_j)|=\infty\}$ is a dense $G_\delta$ in the Banach space $C(T)$. Baire gives the dense $G_\delta$ $E=\bigcap_j E_j$. For fixed $f\in E$, the function $x\mapsto\sup_n|s_n(f;x)|$ is lower semicontinuous, so $Q_f=\bigcap_{m\ge1}\bigcup_{n\ge0}\{x:|s_n(f;x)|>m\}$ is a $G_\delta$. It contains every $x_j$, hence is dense.`,
  caption: String.raw`The finite experiment explains the unbounded functional norms used by Baire: $h_{N,x}(t)=\operatorname{clip}(D_N(x-t),-1,1)$ is continuous and has norm one. Its partial sum at $x$ is large, although every individual displayed test function is bounded. Vary $N$, the test point, and the perturbation size: a small sup-norm perturbation can have a much larger selected partial sum. These finite experiments do not construct a single function with divergent Fourier series; the two Baire arguments in the proof establish that conclusion.`,
  deps: ['rca-5.11', 'rca-5.6'], tags: ['Fourier series', 'Baire category'],
  viz(v) {
    const N=v.slider('partial sum $N$',1,120,20,{int:true});
    const x=v.slider('test point $x$',-Math.PI,Math.PI,0,{step:.02});
    const epsilon=v.slider('perturbation size $\\varepsilon$',.01,1,.15,{step:.01});
    const L=v.stage({x:[-Math.PI,Math.PI],y:[-1.2,1.2],height:300,title:'small continuous perturbation $\\varepsilon h_{N,x}$'});
    const R=v.stage({x:[0,121],y:[0,1],height:300,title:'selected partial sums at $x$ (finite experiment)'});
    let st;
    v.render(()=>{
      const n=N.value,e=epsilon.value,h=t=>Math.max(-1,Math.min(1,v.M.dirichlet(n,x.value-t)));
      const points=[];
      for(let k=0;k<=n;k++)points.push([k,e*v.M.integrate(t=>h(t)*v.M.dirichlet(k,x.value-t),-Math.PI,Math.PI,480+80*n)/(2*Math.PI)]);
      const value=points[n][1],max=Math.max(e,...points.map(p=>Math.abs(p[1])));
      L.setView(null,[-1.2*e,1.2*e]);L.fn(t=>e*h(t),{color:'accent',n:1800});L.vline(x.value,{color:'gold',dash:[4,4]});
      R.setView(null,[-.15*max,1.2*max]);R.path(points,{color:'accent',width:2});R.hline(e,{color:'gold',dash:[4,4]});R.dot(n,value,{color:'green',r:5});
      st={n,e,value};
    });
    v.legend([['accent','partial sums of the selected perturbation'],['gold','sup-norm bound $\\varepsilon$'],['green','selected $s_N$',{dot:true}]]);
    v.readout(()=>st?`Finite test: N=${st.n}, sup norm ${v.fix(st.e,3)}, selected partial sum ${v.fix(st.value,4)}, amplification ${v.fix(st.value/st.e,3)}. A new N selects a new function; divergence requires the Baire argument.`:'');
  },
};

export const countableDenseNotGdelta = {
  num: '5.13', kind: 'Theorem', name: 'A countable dense set cannot be a Gδ',
  refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 5.13 and proof, p. 103'],
  statement: String.raw`In a nonempty complete metric space with no isolated points, no countable dense subset is a $G_\delta$.`,
  idea: String.raw`Suppose the countable dense set $E=\{x_1,x_2,\ldots\}$ equals $\bigcap_n V_n$, with each $V_n$ open. Each $V_n$ is dense. As there are no isolated points, $W_n=V_n\setminus\{x_1,\ldots,x_n\}$ is still open and dense. But $\bigcap_n W_n=\varnothing$, contrary to Baire's theorem. Nonemptiness is needed: the empty complete space is an exception.`,
  caption: String.raw`A nested-interval illustration on $[0,1]$: enumerate its rational points by denominator. At step $n$, choose a closed subinterval inside the preceding interval that avoids the next rational. Its lengths tend to zero, so completeness gives a limit point; each rational is excluded at a finite step. The orange point is only the midpoint of the last finite interval, not the infinite limit. This illustrates why deleting countably many points does not exhaust an interval; the proof above also handles arbitrary proposed dense open sets $V_n$.`,
  deps: ['rca-5.6'], tags: ['Baire category', 'G-delta'],
  viz(v) {
    const N=v.slider('excluded rational points $N$',1,30,8,{int:true});
    const side=v.select('choose the longer remaining side',[{value:'left',label:'left on ties'},{value:'right',label:'right on ties'}],'left');
    const L=v.stage({x:[-.05,1.05],y:[-1,31],height:400,full:true,title:'nested closed intervals excluding successive rational points'});
    const gcd=(a,b)=>b?gcd(b,a%b):a,Q=[];
    for(let d=1;d<=20;d++)for(let a=0;a<=d;a++)if(gcd(a,d)===1)Q.push(a/d);
    let st;
    v.render(()=>{
      let a=0,b=1;
      for(let j=0;j<N.value;j++){
        const q=Q[j],mid=(a+b)/2;
        if(q>a&&q<b){const left=q-a,right=b-q;if(left>right||(left===right&&side.value==='left'))b=(a+q)/2;else a=(q+b)/2;}
        else {a=(a+mid)/2;b=(b+mid)/2;}
        const y=N.value-j;L.line(a,y,b,y,{color:'accent',width:5});L.dot(q,y,{color:'red',r:3});
      }
      L.setView(null,[-1,N.value+2]);L.dot((a+b)/2,0,{color:'gold',r:5});st={a,b,n:N.value};
    });
    v.legend([['accent','remaining closed interval'],['red','next rational to exclude',{dot:true}],['gold','finite midpoint',{dot:true}]]);
    v.readout(()=>st?`${st.n} exclusions; last interval [${st.a.toPrecision(12)}, ${st.b.toPrecision(12)}], length ${v.fmt(st.b-st.a,3)}. Every finite interval is nonempty. The limiting point is justified by completeness, not by floating-point rendering.`:'');
  },
};
