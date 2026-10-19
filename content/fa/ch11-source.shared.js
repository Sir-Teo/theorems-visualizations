// Exact two-dimensional illustrations for Rudin2 Chapter11.
export const functionalDefect=(p,q)=>Math.max(Math.abs(p-p*p),Math.abs(q-q*q),Math.abs(p*q));
export const minTrigQuadratic=(a,b)=>{ // p(theta)=4b cos²theta+2a costheta+1-2b
  const vals=[1+2*a+2*b,1-2*a+2*b];if(b>0){const x=-a/(4*b);if(Math.abs(x)<=1)vals.push(4*b*x*x+2*a*x+1-2*b);}return Math.min(...vals);
};
export function normalSet(v){
 const a=v.slider('diagonal a',.2,2,1,{step:.01}),b=v.slider('diagonal b',.2,2,.5,{step:.01}),c=v.slider('upper-right entry',-1,1,0,{step:.01}),d=v.slider('lower-left entry',-1,1,0,{step:.01});
 const S=v.stage({x:[-2.5,2.5],y:[-2,2],height:320,equal:true,axes:true});let comm,normal;
 v.render(()=>{const A=[[a.value,c.value],[d.value,b.value]],u=[1,.7],Au=[A[0][0]+.7*A[0][1],A[1][0]+.7*A[1][1]];S.arrow(0,0,u[0],u[1],{color:'blue'});S.arrow(0,0,Au[0],Au[1],{color:'purple'});comm=2*Math.hypot(c.value,d.value);normal=Math.hypot(c.value*c.value-d.value*d.value,(a.value-b.value)*(d.value-c.value))*Math.SQRT2;});
 v.legend([['blue','u'],['purple','xu']]);v.readout(()=>`$\\|xd-dx\\|_F=${v.fix(comm,4)}$; $\\|xx^*-x^*x\\|_F=${v.fix(normal,4)}$. `+(comm===0?`The probe is diagonal; its inverse is diag(${v.fix(1/a.value,3)}, ${v.fix(1/b.value,3)}).`:'The probe is outside the maximal normal set of diagonal matrices.'));
}
export function extremeFunctionals(v){
 const S=v.stage({x:[-.1,1.1],y:[-.1,1.1],height:360,equal:true,axes:true,xlabel:'p',ylabel:'q'});
 const h=S.handle(.35,.25,{color:'blue',label:'F',constrain:(p,q)=>{p=Math.max(0,p);q=Math.max(0,q);const s=p+q;return s>1?[p/s,q/s]:[p,q];}});let def;
 v.render(()=>{S.poly([[0,0],[1,0],[0,1]],{color:'green',fill:'green',fillAlpha:.1});for(const[p,q,label]of[[0,0,'0'],[1,0,'evaluation1'],[0,1,'evaluation2']])S.dot(p,q,{color:'green',r:5,label});def=functionalDefect(h.x,h.y);});
 v.button('Use an evaluation',()=>h.set(1,0));v.button('Use the zero functional',()=>h.set(0,0));
 v.readout(()=>`$F=(1-p-q)0+p\\,h_1+q\\,h_2$ with weights ${v.fix(1-h.x-h.y,3)}, ${v.fix(h.x,3)}, ${v.fix(h.y,3)}. Multiplicativity defect on coordinate idempotents: $${v.fix(def,5)}$. `+(def===0?'This vertex is multiplicative and extreme.':'The displayed convex combination is nontrivial, so F is not extreme.'));
}
export function bezoutDisc(v){
 const a=v.slider('root a',-1.3,1.3,-.4,{step:.01}),b=v.slider('root b',-1.3,1.3,.5,{step:.01});
 const S=v.stage({x:[-1.6,1.6],y:[-1.3,1.3],height:330,equal:true,axes:true});const z=S.handle(.2,.35,{color:'blue',label:'z',constrain:(x,y)=>Math.hypot(x,y)>1?[x/Math.hypot(x,y),y/Math.hypot(x,y)]:[x,y]});let bad,sum;
 v.render(()=>{S.circle(0,0,1,{color:'blue'});S.dot(a.value,0,{color:'red',r:5,label:'a'});S.dot(b.value,0,{color:'orange',r:5,label:'b'});bad=a.value===b.value&&Math.abs(a.value)<=1;if(a.value!==b.value)sum=[((z.x-a.value)-(z.x-b.value))/(b.value-a.value),0];else if(!bad)sum=[1,0];});
 v.button('Make roots coincide',()=>{b.value=a.value;});
 v.readout(()=>bad?'Both functions vanish at the same point of the closed disc: no Bezout solution exists.':`Computed $\\phi_1(z)f_1(z)+\\phi_2(z)f_2(z)=${v.fix(sum[0],8)}+${v.fix(sum[1],8)}i$. `+(a.value!==b.value?'Here the coefficients are constants ±1/(b−a).':'The common root is outside the closed disc; 1/f₁ is holomorphic on a neighborhood of it.'));
}
export function wienerCoefficients(a,N){
 if(Math.abs(a)===1)return null;
 return Math.abs(a)<1?Array.from({length:N+1},(_,n)=>[n,a**n]):Array.from({length:N},(_,j)=>[-j-1,-(a**(-j-1))]);
}
export function wienerInverse(v){
 const a=v.slider('coefficient a',-2,2,.6,{step:.01}),N=v.slider('Fourier cutoff N',2,40,12,{int:true});
 const L=v.stage({x:[-3,3],y:[-2.2,2.2],height:320,equal:true,axes:true}),R=v.stage({x:[-41,41],y:[-2,2],height:320,axes:'box',xlabel:'Fourier index n'});let st;
 v.render(()=>{const cs=wienerCoefficients(a.value,N.value),pts=[];for(let j=0;j<=240;j++){const t=2*Math.PI*j/240;pts.push([1-a.value*Math.cos(t),-a.value*Math.sin(t)]);}L.path(pts,{color:'blue',width:2});L.dot(0,0,{color:'red',r:4});if(!cs){st={bad:true};return;}const max=Math.max(...cs.map(x=>Math.abs(x[1])),.1);R.setView(null,[-1.1*max,1.1*max]);for(const[n,c]of cs)R.rect(n-.3,Math.min(0,c),n+.3,Math.max(0,c),{color:'green',fill:'green',fillAlpha:.6});let sampled=0;for(let j=0;j<240;j++){const t=2*Math.PI*j/240,fr=1-a.value*Math.cos(t),fi=-a.value*Math.sin(t);let gr=0,gi=0;for(const[n,c]of cs){gr+=c*Math.cos(n*t);gi+=c*Math.sin(n*t);}sampled=Math.max(sampled,Math.hypot(fr*gr-fi*gi-1,fr*gi+fi*gr));}st={sampled,norm:1/Math.abs(1-Math.abs(a.value)),tail:Math.abs(a.value)<1?Math.abs(a.value)**(N.value+1):Math.abs(a.value)**(-N.value)};});
 v.legend([['blue','$f(e^{it})=1-ae^{it}$'],['green','inverse Fourier coefficients'],['red','zero']]);
 v.button('Put a zero on the circle',()=>a.set(1));
 v.readout(()=>st.bad?'f vanishes on the unit circle: it is not invertible in the Wiener algebra.':`Exact inverse coefficient norm $\\sum|c_n|=${v.fix(st.norm,4)}$. The truncated reciprocal has sampled residual $\\max|fg_N-1|=${v.sci(st.sampled,3)}$; the geometric identity gives the exact full-circle residual $${v.sci(st.tail,3)}$.`);
}
