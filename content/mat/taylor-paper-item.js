import {chainInitial,chainEnergy,chainGradient,relaxChain,chainWidth} from './source-audit-finite-chain.shared.js';

export default {
      num: '3.13',
      kind: 'Paper',
      name: 'The mechanism of plastic deformation of crystals',
      statement: String.raw`Taylor's 1934 Part I explains plastic slip as a localized disturbance propagated through a crystal, with positive and negative centers moving in opposite directions under a given shear. Figures 4–7 give a rough atomic picture using prescribed neighboring rows and cosine potentials; the paper explicitly omits the mutual action within the jumping row. Its hypothesized temperature $T_D$ separates freely mobile isolated centers from a rough finite-stress regime.

The later calculation uses isotropic elasticity away from the core and particular regular arrays of dislocations. Under its arrangement and travel-distance assumptions, Eq.(25) gives $S/(\mu\sqrt{s})=\kappa\sqrt{\lambda/L}$, with arrangement-dependent coefficient $\kappa$, lattice spacing $\lambda$, dislocation travel distance $L$ and shear strain $s$. This is a conditional strain-hardening model, not a universal coefficient or the finite-chain calculation shown below.`,
      idea: String.raw`In units with substrate period and barrier both one, define $$\begin{aligned}E&=E_{\rm spr}+E_{\rm sub}-f\sum_{i=1}^{38}x_i,\\ E_{\rm spr}&=\frac K2\sum_{i=1}^{39}(x_i-x_{i-1}-1)^2,\\ E_{\rm sub}&=\frac12\sum_{i=1}^{38}(1-\cos2\pi x_i).\end{aligned}$$ fixing $x_0=0,x_{39}=38$. The interior gradient is $$\begin{aligned}g_i&=K(2x_i-x_{i-1}-x_{i+1})\\&\quad+\pi\sin2\pi x_i-f.\end{aligned}$$ Gradient descent with $\eta=0.8/(4K+2\pi^2)$ decreases this energy; a half-step option uses twice as many iterations for the same requested pseudotime. A small gradient certifies only numerical stationarity, not a stable minimum. Because fixed endpoints make the elastic energy confining for $K>0$, this finite model cannot demonstrate unbounded runaway under constant force.`,
      caption: String.raw`Choose stiffness, applied force and a finite iteration budget, or press Run longer. Left: registry $u_i=x_i-i$ of the zero-force reference (grey) and the final forced chain (blue). Right: the actual maximum interior force residual over iterations, floored only for logarithmic display. The readout distinguishes a stationary numerical state from an unfinished relaxation. The scale $f_{\rm rigid}=\pi$ is the maximum force of one substrate site, not a measured collective depinning force.`,
      deps: ['mat-3.1', 'mat-3.4'],
      refs: ['Taylor 1934 original pp.362–387; Figs 4–7, pp.368–375; elastic/lattice assumptions pp.375–384; Eqs 23–27 pp.385–387'],
      tags: ['dislocation', 'finite chain', 'history'],
      paper: { authors: 'G. I. Taylor', year: 1934, title: 'The Mechanism of Plastic Deformation of Crystals. Part I.—Theoretical', venue: 'Proceedings of the Royal Society of London A 145 (855): 362–387', doi: '10.1098/rspa.1934.0106' },
      introduces: ['mat-3.2', 'mat-3.8'],
      credit: 'G. I. Taylor, 1934; the finite harmonic-chain energy and numerical protocol are an authored modern illustration.',
      scope: String.raw`The complete original 26-page Part I was recovered from an archived Royal Society publisher PDF and read, including the qualifications around its atomic and elastic models. It does not give this 40-site harmonic-chain energy: its prescribed-row cosine picture neglects a row's internal mutual action, while its later collective calculation uses idealized arrays and a travel-distance assumption. No priority comparison with unread Orowan or Polanyi originals is asserted. The widget's chain has 40 labelled sites and 39 bonds spanning 38 substrate periods, fixed endpoints, no hard-core exclusion, harmonic springs and unit periodic barrier. A 20000-iteration zero-force reference is computed separately, with its residual reported. The forced protocol starts afresh from that reference for each input setting. Numerical stationarity does not prove minimum stability, uniqueness, infinite-chain depinning or an exponential threshold law. Widget controls use hundredths for stiffness, thousandths for normalized force and multiples of 100 for the base budget; unsupported saved ticks reject before constraints. The continuous mathematical model is unchanged.`,
      verify: false,
      viz(v) {
        let cache=null,cacheK=null;
        const K = v.slider('spring stiffness $K$', .25, 8, 1.5, {step:.01,decimals:2});
        const f = v.slider('applied force $f/f_{\\rm rigid}$',0,1.05,.2,{step:.001});
        const budget = v.slider('base iteration budget',100,12000,2000,{step:100,int:true});
        for(const[c,lo,hi,scale]of[[K,.25,8,100],[f,0,1.05,1000],[budget,100,12000,.01]]){const set=c.set;c.set=x=>{if(!Number.isFinite(x)||x<lo||x>hi||x!==Math.round(x*scale)/scale)throw new RangeError('Saved chain control must be a supported tick within its declared range');return set(x);};}
        const half = v.toggle('half step, twice the iterations',false);
        v.button('Run longer',()=>budget.set(Math.min(12000,budget.value*2)));
        const A=v.stage({x:[-1,40],y:[-1.2,.2],axes:'box',gutter:true,height:310,full:true,xlabel:'site index i',ylabel:'registry xᵢ−i',title:'finite fixed-end chain: reference and final registry'});
        const B=v.stage({x:[0,2000],y:[1e-12,10],ylog:true,axes:'box',gutter:true,height:310,full:true,xlabel:'gradient-descent iterations',ylabel:'maximum force residual',title:'finite relaxation; display floor 10⁻¹²'});
        let info;
        v.render(()=>{
          if(!cache||cacheK!==K.value){cache=relaxChain(chainInitial(),K.value,0,{budget:20000,tol:1e-9});cacheK=K.value;}
          const r=relaxChain(cache.x,K.value,f.value*Math.PI,{budget:budget.value*(half.value?2:1),scale:half.value?.4:.8});
          const ref=Array.from(cache.x,(x,i)=>[i,x-i]),cur=Array.from(r.x,(x,i)=>[i,x-i]);
          const all=[...ref,...cur].map(p=>p[1]),lo=Math.min(...all),hi=Math.max(...all),span=Math.max(1,hi-lo);
          A.setView([-1,40],[lo-.12*span,hi+.12*span]);A.path(ref,{color:'muted',dash:true,width:2});A.path(cur,{color:'accent',width:2});
          for(const p of cur)A.dot(...p,{color:'accent',fill:'accent',r:3});
          const end=Math.max(1,r.steps);B.setView([-.04*end,1.04*end],[1e-13,Math.max(1e-8,...r.hist.map(p=>p.residual))*10]);
          B.path(r.hist.map(p=>[p.steps,Math.max(1e-12,p.residual)]),{color:'accent',width:2.5});B.dot(r.steps,Math.max(1e-12,r.residual),{color:'accent',r:3,ring:false});B.hline(1e-9,{color:'green',dash:true});
          info={r,reference:cache,w:chainWidth(cache.x),shift:Math.max(...Array.from(r.x,(x,i)=>Math.abs(x-cache.x[i])))};
        });
        v.legend([['muted','zero-force reference',{dash:true}],['accent','finite forced relaxation'],['green','stationarity tolerance $10^{-9}$',{dash:true}]]);
        v.readout(()=>{
          if(!info)return '';
          const {r,reference,w,shift}=info;
          return `Finite protocol: ${r.steps} iterations, step ${v.fix(r.eta,6)}, pseudotime ${v.fix(r.steps*r.eta,3)}; maximum residual $${v.sci(r.residual,3)}$. ${r.converged?'Numerically stationary within the stated tolerance; minimum stability is not checked.':'Iteration budget reached: relaxation is incomplete; no motion threshold is inferred.'}\nMaximum displacement from the zero-force reference ${v.fix(shift,4)} periods; energy change ${v.fix(r.hist.at(-1).energy-r.hist[0].energy,5)} at this fixed force. Reference residual $${v.sci(reference.residual,3)}$, 10–90% registry width ${w===null?'unavailable':v.fix(w,3)} site spacings. Fixed endpoints remain at 0 and 38; original Taylor hypotheses and this authored finite chain are distinct.`;
        });
      },
    };
