export const orthonormalEndpoints={
  num:'12.11',kind:'Proposition',name:'Endpoint bounds for uniformly bounded orthonormal coefficients',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Section 12.11, p. 260'],
  statement:String.raw`Let $\{\psi_n\}$ be orthonormal in $L^2(\mu)$, with $|\psi_n(x)|\le M<\infty$. Put $\hat f(n)=\int f\overline{\psi_n}\,d\mu$. Then $\|\hat f\|_\infty\le M\|f\|_1$ for $f\in L^1$, and $\|\hat f\|_2\le\|f\|_2$ for $f\in L^2$. These are the two endpoint estimates interpolated in the following Hausdorff–Young theorem.`,
  idea:String.raw`The first bound is the triangle inequality: $|\int f\overline{\psi_n}|\le M\int|f|$. The second is Bessel's inequality for an orthonormal family. Section12.11 sets up these bounds; the source does not state the general Riesz–Thorin operator theorem here.`,
  caption:String.raw`A two-point counting-measure space. Rotating an orthonormal basis changes the coefficient map $T$ but preserves Euclidean length. Drag $f$ and vary the angle. Left: the input vector and its L1 and L2 balls. Right: its coefficient vector, the circle of radius $\|f\|_2$, and the square $|\hat f_j|\le M\|f\|_1$. The square comes from the bounded basis functions, while the circle comes from orthonormality.`,
  deps:['rca-3.5','rca-4.13'],see:['rca-12.8'],tags:['orthonormal coefficients','interpolation'],
  viz(v){
    const angle=v.slider('orthonormal basis angle',0,Math.PI/2,Math.PI/4,{step:.005});
    const L=v.stage({x:[-2,2],y:[-2,2],equal:true,height:330,title:'input vector f'});
    const R=v.stage({x:[-2,2],y:[-2,2],equal:true,height:330,title:'orthonormal coefficients Tf'});
    const f=L.handle(.8,.35,{color:'gold',label:'f',constrain:(x,y)=>[Math.max(-1,Math.min(1,x)),Math.max(-1,Math.min(1,y))]});let st;
    v.render(()=>{
      const c=Math.cos(angle.value),s=Math.sin(angle.value),a=c*f.x+s*f.y,b=-s*f.x+c*f.y;
      const l1=Math.abs(f.x)+Math.abs(f.y),l2=Math.hypot(f.x,f.y),M=Math.max(c,s),bound=M*l1;
      L.poly([[l1,0],[0,l1],[-l1,0],[0,-l1]],{color:'accent',dash:[4,4]});L.circle(0,0,l2,{color:'green'});L.arrow(0,0,f.x,f.y,{color:'gold',width:2});
      R.rect(-bound,-bound,bound,bound,{color:'accent',fill:'accent',fillAlpha:.06});R.circle(0,0,l2,{color:'green'});R.arrow(0,0,a,b,{color:'gold',width:2});R.dot(a,b,{color:'gold',r:5});
      st={M,l1,l2,max:Math.max(Math.abs(a),Math.abs(b)),norm:Math.hypot(a,b)};
    });
    v.legend([['accent','L1 endpoint bound'],['green','L2 endpoint bound'],['gold','vector and coefficients']]);
    v.readout(()=>st?`M=${v.fix(st.M,4)}; coefficient maximum ${v.fix(st.max,4)} ≤ M‖f‖₁=${v.fix(st.M*st.l1,4)}; coefficient L2 norm ${v.fix(st.norm,4)} = ‖f‖₂=${v.fix(st.l2,4)}.`:'');
  },
};
