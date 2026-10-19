// Source-aligned finite illustrations for Rudin, Functional Analysis (2nd ed.), Chapter 5.
const TAU=2*Math.PI;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],scale=(a,t)=>[a[0]*t,a[1]*t];
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const div=(a,b)=>{const d=b[0]**2+b[1]**2;return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];};
const expi=t=>[Math.cos(t),Math.sin(t)],abs=a=>Math.hypot(...a),exp=a=>scale(expi(a[1]),Math.exp(a[0]));
const sample=(f,n=240)=>Array.from({length:n+1},(_,j)=>f(j/n));
const plane=(v,title)=>v.stage({x:[-1.25,1.25],y:[-1.25,1.25],equal:true,height:330,title});
const circle=s=>s.path(sample(t=>expi(TAU*t)),{color:'muted',width:1.5});
const fmt=x=>Number(x).toFixed(4);

/** Piecewise-constant Fourier interpolation: coefficients integrate cells exactly.
 * Alternating projections are a numerical feasibility attempt, never an existence proof. */
export function boundedFourierAttempt(a,{M=256,iterations=450}={}){
 const ns=a.map((_,i)=>2**i),norm=Math.sqrt(a.reduce((s,z)=>s+abs(z)**2,0)),bound=Math.SQRT2*norm;
 const basis=ns.map(n=>Array.from({length:M},(_,j)=>expi(n*TAU*(j+.5)/M))),sinc=ns.map(n=>Math.sin(n*Math.PI/M)/(n*Math.PI/M));
 let g=Array.from({length:M},()=>[0,0]);
 for(let it=0;it<iterations;it++){
  const errors=a.map((z,k)=>{let c=[0,0];for(let j=0;j<M;j++)c=add(c,mul(g[j],[basis[k][j][0],-basis[k][j][1]]));return sub(z,scale(c,sinc[k]/M));});
  for(let j=0;j<M;j++){let z=g[j];for(let k=0;k<a.length;k++)z=add(z,scale(mul(errors[k],basis[k][j]),1/sinc[k]));const r=abs(z);g[j]=r>bound?scale(z,bound/r):z;}
 }
 const coefficients=ns.map((_,k)=>{let z=[0,0];for(let j=0;j<M;j++)z=add(z,mul(g[j],[basis[k][j][0],-basis[k][j][1]]));return scale(z,sinc[k]/M);});
 return {g,ns,norm,bound,coefficients,error:Math.max(...a.map((z,k)=>abs(sub(z,coefficients[k])))),sup:Math.max(...g.map(abs))};
}
export function fiberPolynomial(t,z,n){
 let term=[1,0],p=term;for(let j=1;j<=n;j++){term=scale(mul(term,z),t/j);p=add(p,term);}
 const u=(t+1)/2;let b=0,choose=1;
 for(let j=0;j<=n;j++){if(j)choose*= (n-j+1)/j;b+=Math.abs(2*j/n-1)*choose*u**j*(1-u)**(n-j);}
 return add(p,scale(mul(z,z),b));
}
export function fiberBound(n){let factorial=1;for(let j=1;j<=n+1;j++)factorial*=j;return Math.E/factorial+1/Math.sqrt(n);}
export function twoPointBlaschke(a,b,z){
 const c=b/a;if(Math.abs(c)>1)return null;
 if(Math.abs(c)>=1-1e-13)return scale(z,c<0?-1:1);
 const d=(a-c)/(1-a*c);return mul(z,div(sub(z,[d,0]),sub([1,0],scale(z,d))));
}
export function boundedDecomposition(x,y,z,theta,tau){
 const b=y/Math.sin(theta),a=x-b*Math.cos(theta),den=Math.abs(a)+Math.abs(b),optimal=den?Math.abs(a)/den:.5;
 const cost=t=>Math.hypot(a,t*z)+Math.hypot(b,(1-t)*z);
 return {a,b,optimal,cost:cost(tau),minimum:cost(optimal),gamma:1/Math.sin(theta/2),norm:Math.hypot(x,y,z),costAt:cost};
}
export function polygonRepresentation(x,y,M){
 const theta=((Math.atan2(y,x)%TAU)+TAU)%TAU,j=Math.min(M-1,Math.floor(theta*M/TAU)),u=expi(TAU*j/M),w=expi(TAU*(j+1)/M),det=u[0]*w[1]-u[1]*w[0];
 const a=(x*w[1]-y*w[0])/det,b=(u[0]*y-u[1]*x)/det;
 return {j,u,w,a,b,cost:Math.abs(a)+Math.abs(b),delta:Math.cos(Math.PI/M)};
}
export function nonlinearFixedPoints(a,r,k){
 const f=x=>a+r*Math.sin(k*x)-x,out=[];const lo=a-r,hi=a+r;
 for(let j=0;j<500;j++){let x=lo+(hi-lo)*j/500,y=lo+(hi-lo)*(j+1)/500,fx=f(x),fy=f(y);if(fx===0)out.push(x);else if(fx*fy<=0){for(let it=0;it<50;it++){const m=(x+y)/2,fm=f(m);if(fx*fm<=0)y=m;else{x=m;fx=fm;}}out.push((x+y)/2);}}
 return out.filter((x,j)=>!j||Math.abs(x-out[j-1])>1e-7);
}

export const sourceDiagrams={
 '5.4'(v){
  const n=v.slider('prescribed coefficients',1,6,4,{int:true}),decay=v.slider('decay',0,1,.55),phase=v.slider('phase',0,Math.PI,.4);
  const L=v.stage({x:[0,TAU],y:[-3,3],height:320,title:'piecewise constant candidate: real and imaginary parts'}),R=v.stage({x:[.5,6.5],y:[0,1.5],height:320,title:'prescribed coefficients and exact cell-integral coefficients'});
  let key='',s;
  v.render(()=>{const q=[n.value,decay.value,phase.value].join();if(q!==key){key=q;const a=Array.from({length:n.value},(_,j)=>scale(expi(j*phase.value),Math.exp(-j*decay.value)));s=boundedFourierAttempt(a);s.a=a;}
   L.setView([0,TAU],[-s.bound*1.15,s.bound*1.15]);L.path(s.g.map((z,j)=>[TAU*(j+.5)/s.g.length,z[0]]),{color:'accent'});L.path(s.g.map((z,j)=>[TAU*(j+.5)/s.g.length,z[1]]),{color:'orange'});
   for(let j=0;j<s.a.length;j++){R.line(j+1,0,j+1,abs(s.a[j]),{color:'accent',width:6});R.dot(j+1,abs(s.coefficients[j]),{color:'orange',r:5});}
  });v.legend([['accent','target coefficient / real part'],['orange','candidate coefficient / imaginary part']]);
  v.readout(()=>s&&`Frequencies ${s.ns.join(', ')}. $\\|a\\|_2=${fmt(s.norm)}$, source existence bound $\\sqrt2\\|a\\|_2=${fmt(s.bound)}$. Candidate essential sup ${fmt(s.sup)}; largest exact Fourier-coefficient error ${s.error.toExponential(2)}. This finite alternating-projection attempt is approximate and does not prove the infinite theorem.`);
 },
 '5.8'(v){
  const t=v.slider('real fiber $t$',-1,1,.35,{step:.01}),n=v.slider('polynomial degree parameter',1,30,8,{int:true}),bad=v.toggle('add $0.3\\bar z$ (break fiber holomorphy)',false);
  const L=plane(v,'error on the selected complex fiber'),R=v.stage({x:[1,30],y:[0,1.2],height:330,title:'sampled sup error and rigorous bound for the holomorphic target'});let info;
  const target=(t,z)=>add(add(exp(scale(z,t)),scale(mul(z,z),Math.abs(t))),bad.value?[.3*z[0],-.3*z[1]]:[0,0]);
  const error=(t,z,k)=>abs(sub(target(t,z),fiberPolynomial(t,z,k)));
  v.render(()=>{const c=L.ctx;c.save();c.beginPath();c.ellipse(L.X(0),L.Y(0),Math.abs(L.X(1)-L.X(0)),Math.abs(L.Y(1)-L.Y(0)),0,0,TAU);c.clip();L.heat((x,y)=>error(t.value,[x,y],n.value),{range:[0,1],res:55,cmap:'viridis'});c.restore();circle(L);
   const estimates=[];for(let k=1;k<=30;k++){let e=0;for(let j=0;j<=16;j++)for(let l=0;l<64;l++)e=Math.max(e,error(-1+j/8,expi(TAU*l/64),k));estimates.push([k,e]);}
   R.path(estimates,{color:'accent',width:2.5});R.fn(x=>fiberBound(Math.max(1,Math.round(x))),{color:'orange'});R.vline(n.value,{color:'muted',dash:true});info={e:estimates[n.value-1][1],bound:fiberBound(n.value)};
  });v.legend([['accent','sampled error (lower bound on true sup)'],['orange','proved bound $e/(n+1)!+1/\\sqrt n$']]);
  v.readout(()=>info&&`$K=[-1,1]\\times\\overline{\\mathbb D}$, $g(t,z)=e^{tz}+|t|z^2${bad.value?'+0.3\\bar z':''}$. Sampled error ${fmt(info.e)}. ${bad.value?'Fiber holomorphy fails; a boundary Fourier coefficient gives approximation distance at least 0.3.':'Taylor remainder plus the Bernstein approximation of |t| gives the rigorous uniform bound '+fmt(info.bound)+'.'}`);
 },
 '5.10'(v){
  const a=v.slider('$z_1=a$',.1,.9,.55,{step:.01}),q=v.slider('$w_1/a$',-1.4,1.4,.5,{step:.01});const L=plane(v,'two interior interpolation data'),R=plane(v,'boundary values of a finite Blaschke interpolant');let info;
  v.render(()=>{circle(L);circle(R);const b=a.value*q.value,valid=Math.abs(q.value)<=1;L.line(0,0,a.value,0,{color:'muted'});L.dot(0,0,{r:5,color:'accent',label:'z₀=w₀=0'});L.dot(a.value,0,{r:6,color:'accent',label:'z₁'});L.dot(b,0,{r:6,color:'orange',label:'w₁'});
   if(valid){const values=sample(t=>twoPointBlaschke(a.value,b,expi(TAU*t)));R.path(values,{color:'green',width:3});const im=twoPointBlaschke(a.value,b,[a.value,0]);R.dot(...im,{color:'orange',r:6,label:'B(z₁)'});info={valid,b,res:abs(sub(im,[b,0])),boundary:Math.max(...values.map(z=>Math.abs(abs(z)-1)))};}else{R.text('No solution: Schwarz lemma',0,0,{align:'center',color:'red'});info={valid,b};}
  });v.readout(()=>info&&`$z_0=w_0=0$, $z_1=${fmt(a.value)}$, $w_1=${fmt(info.b)}$. ${info.valid?`Schwarz condition holds. Explicit Blaschke product: interpolation residual ${info.res.toExponential(2)}, boundary-modulus error ${info.boundary.toExponential(2)}.`:'|w₁|>|z₁|: no holomorphic disc map can interpolate these data.'}`);
 },
 '5.17'(v){
  const a=v.slider('group parameter $s$',-Math.PI,Math.PI,.8),b=v.slider('$t$',-Math.PI,Math.PI,.5),s=plane(v,'the rotation group acting continuously on the plane'),x=s.handle(.65,.3,{color:'accent'});const rot=(p,t)=>[Math.cos(t)*p[0]-Math.sin(t)*p[1],Math.sin(t)*p[0]+Math.cos(t)*p[1]];let info;
  v.render(()=>{circle(s);const p=[x.x,x.y],q=rot(p,b.value),r=rot(q,a.value),u=rot(p,a.value+b.value);s.arrow(0,0,...p,{color:'accent'});s.arrow(0,0,...q,{color:'orange'});s.arrow(0,0,...r,{color:'green'});s.dot(...u,{color:'purple',r:7,hollow:true});info=abs(sub(r,u));});
  v.legend([['accent','x'],['orange','Tₜx'],['green','TₛTₜx'],['purple','Tₛ₊ₜx',{dot:true}]]);v.readout(()=>`$T_0=I$, $T_sT_t=T_{s+t}$; composition residual ${info?.toExponential(2)}. Rotations preserve the norm. $\\|T_sx-T_ty\\|\\le\\|x-y\\|+|s-t|\\,\\|y\\|$ proves joint continuity, beyond the numerical check.`);
 },
 '5.20'(v){
  const theta=v.slider('angle between quotient lines',.12,Math.PI/2,.65),z=v.slider('shared-axis coordinate $z$',-1,1,.6),tau=v.slider('chosen split of $z$',-2,3,.3);const L=plane(v,'xy components of two planes meeting along the z-axis'),R=v.stage({x:[-2,3],y:[0,10],height:330,title:'sum of the two component norms versus split parameter'}),x=L.handle(.55,.7,{color:'accent'});let info;
  v.render(()=>{const d=boundedDecomposition(x.x,x.y,z.value,theta.value,tau.value);L.line(-1.2,0,1.2,0,{color:'blue'});L.line(-1.2*Math.cos(theta.value),-1.2*Math.sin(theta.value),1.2*Math.cos(theta.value),1.2*Math.sin(theta.value),{color:'orange'});L.arrow(0,0,d.a,0,{color:'blue'});L.arrow(d.a,0,x.x,x.y,{color:'orange'});
   R.setView([-2,3],[0,Math.max(2,d.cost,d.gamma*d.norm)*1.15]);R.fn(d.costAt,{color:'accent'});R.hline(d.gamma*d.norm,{color:'orange',dash:true});R.dot(d.optimal,d.minimum,{r:6,color:'green'});R.dot(tau.value,d.cost,{r:5,color:'accent'});info=d;
  });v.legend([['accent','chosen decomposition norm sum'],['green','minimum norm sum',{dot:true}],['orange','uniform existence bound']]);
  v.readout(()=>info&&`$A=\\operatorname{span}(e_1,e_3)$, $B=\\operatorname{span}((\\cos\\theta,\\sin\\theta,0),e_3)$. Intersection is the z-axis. Chosen sum ${fmt(info.cost)}; minimum ${fmt(info.minimum)} ≤ $\\gamma\\|x\\|=${fmt(info.gamma*info.norm)}$, with $\\gamma=1/\\sin(\\theta/2)=${fmt(info.gamma)}$. The theorem bounds an available decomposition, not every possible split.`);
 },
 '5.22'(v){
  const m=v.slider('unit directions (even)',4,16,8,{int:true,step:2}),s=plane(v,'image of the l¹ unit ball: a polygon'),x=s.handle(.7,.4,{color:'accent'});let info;
  v.render(()=>{const M=m.value-(m.value%2),d=polygonRepresentation(x.x,x.y,M),P=Array.from({length:M},(_,j)=>expi(TAU*j/M));circle(s);s.poly(P,{fill:'blue',fillAlpha:.12,color:'blue'});s.arrow(0,0,...scale(d.u,d.a),{color:'orange'});s.arrow(...scale(d.u,d.a),x.x,x.y,{color:'green'});s.line(...d.u,...d.w,{color:'orange',width:3});info=d;});
  v.legend([['orange','cⱼxⱼ'],['green','cⱼ₊₁xⱼ₊₁'],['blue','T of the l¹ unit ball',{area:true}]]);
  v.readout(()=>info&&`Two nonzero coefficients: ${fmt(info.a)}, ${fmt(info.b)}. Sum $\\sum|c_n|=${fmt(info.cost)}$. Norming constant $\\delta=\\cos(\\pi/M)=${fmt(info.delta)}$ gives $\\delta\\sum|c_n|=${fmt(info.delta*info.cost)}\\le\\|x\\|=${fmt(Math.hypot(x.x,x.y))}$. Repeating the finite direction list gives a sequence as in the theorem; this example needs no epsilon loss.`);
 },
 '5.25'(v){
  const shift=v.slider('translation in Z/24Z',0,23,7,{int:true}),pat=v.select('subset E',[{value:'block',label:'one block'},{value:'alternating',label:'alternating'},{value:'sparse',label:'multiples of 3'}],'block'),s=plane(v,'uniform measure on a finite abelian group');let info;
  v.render(()=>{const E=Array.from({length:24},(_,j)=>pat.value==='block'?j<8:pat.value==='alternating'?j%2===0:j%3===0),T=Array.from({length:24},(_,j)=>E[(j-shift.value+24)%24]);for(let j=0;j<24;j++){const p=expi(TAU*j/24);s.dot(...p,{r:7,color:E[j]?'accent':'muted',hollow:!E[j]});s.dot(...scale(p,.78),{r:5,color:T[j]?'orange':'muted',hollow:!T[j]});}info={a:E.filter(Boolean).length/24,b:T.filter(Boolean).length/24};});
  v.legend([['accent','E',{dot:true}],['orange','E+s',{dot:true}]]);v.readout(()=>info&&`Uniform finitely additive probability on $\\mathbb Z/24\\mathbb Z$: $\\mu(E)=${fmt(info.a)}=\\mu(E+s)=${fmt(info.b)}$, $\\mu(G)=1$. For infinite G the source constructs a mean using invariant Hahn–Banach and positivity; it does not claim countable additivity on the power set.`);
 },
 '5.26'(v){
  const mode=v.select('functional',[{value:'positive',label:'norm one, fixes constants'},{value:'signed',label:'fixes constants, norm greater than one'},{value:'phase',label:'norm one, fails to fix constants'}],'positive'),a=v.slider('perturbation',0,1,.55),f=[0,1,2,3].map(j=>v.slider('$f('+j+')$',0,1,[0,.2,.7,1][j]));const s=plane(v,'the value L(f) in the complex plane');let info;
  v.render(()=>{const weights=mode.value==='signed'?[[.5+a.value,0],[-a.value,0],[.25,0],[.25,0]]:Array.from({length:4},()=>scale(mode.value==='phase'?expi(Math.PI*a.value):[1,0],.25));const value=weights.reduce((r,w,j)=>add(r,scale(w,f[j].value)),[0,0]),one=weights.reduce(add,[0,0]),norm=weights.reduce((r,w)=>r+abs(w),0);s.line(0,0,1,0,{color:'green',width:6});s.dot(...value,{color:'accent',r:7,label:'L(f)'});s.dot(...one,{color:'orange',r:6,label:'L(1)'});info={value,one,norm};});
  v.readout(()=>info&&`$0\\le f\\le1$. $\\|L\\|=${fmt(info.norm)}$, $L(1)=${fmt(info.one[0])}+${fmt(info.one[1])}i$, $L(f)=${fmt(info.value[0])}+${fmt(info.value[1])}i$. ${mode.value==='positive'?'Both source hypotheses hold: L(f) is real and lies in [0,1].':'A source hypothesis fails; positivity is no longer forced.'}`);
 },
 '5.28'(v){
  const r=v.slider('range scale',.15,.55,.5),k=v.slider('nonlinearity',.5,8,5),s=plane(v,'a nonlinear continuous self-map of the closed disc'),x=s.handle(.7,.35,{color:'accent',constrain:(x,y)=>{const r=Math.hypot(x,y);return r>1?[x/r,y/r]:[x,y];}});let info;
  const F=p=>[.08+r.value*Math.sin(k.value*p[0]),-.06+r.value*Math.sin(k.value*p[1])];
  v.render(()=>{circle(s);for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){const p=[i/4,j/4];if(abs(p)>1)continue;const q=F(p);s.arrow(...p,...add(p,scale(sub(q,p),.16)),{color:'muted',width:1});}const P=[[x.x,x.y]];for(let j=0;j<18;j++)P.push(F(P.at(-1)));s.path(P,{color:'orange',alpha:.7});const xs=nonlinearFixedPoints(.08,r.value,k.value),ys=nonlinearFixedPoints(-.06,r.value,k.value),fixed=xs.flatMap(a=>ys.map(b=>[a,b]));for(const p of fixed)s.dot(...p,{r:6,color:'green'});info={fixed,res:Math.max(...fixed.map(p=>abs(sub(F(p),p))))};});
  v.legend([['orange','iteration from the draggable point'],['green','fixed points found by bracketed roots',{dot:true}]]);v.readout(()=>info&&`$F(x,y)=(0.08+r\\sin(kx),-0.06+r\\sin(ky))$. The entire image lies in a box of radius at most ${fmt(Math.hypot(.08+r.value,.06+r.value))}<1, so F maps the disc into itself. ${info.fixed.length} fixed points found; largest residual ${info.res.toExponential(2)}. $rk=${fmt(r.value*k.value)}$: iteration need not converge when this exceeds one. The theorem guarantees existence without a contraction hypothesis.`);
 }
};
