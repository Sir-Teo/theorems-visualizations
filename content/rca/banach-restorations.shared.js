export function scalarResolvent(a,z){const x=a[0]-z[0],y=a[1]-z[1],d=x*x+y*y;return[x/d,-y/d];}
function spectrumPicture(v){
 const a=v.slider('first eigenvalue',-.9,.9,.6,{step:.01}),b=v.slider('second eigenvalue',-.9,.9,-.4,{step:.01});
 const S=v.stage({x:[-1.5,1.5],y:[-1.2,1.2],equal:true,height:340,full:true,title:'a nonempty finite spectrum and its spectral radius'});
 const z=S.handle(.2,.5,{color:'gold',label:'λ'});let st;
 v.render(()=>{const rho=Math.max(Math.abs(a.value),Math.abs(b.value)),d=Math.min(Math.hypot(z.x-a.value,z.y),Math.hypot(z.x-b.value,z.y));
  S.circle(0,0,rho,{color:'green',dash:[5,4]});S.dot(a.value,0,{color:'accent',r:6});S.dot(b.value,0,{color:'accent',r:6});
  st={rho,d};
 });v.legend([['accent','spectrum of diag(a,b)',{dot:true}],['green','spectral radius',{dash:true}]]);
 v.readout(()=>st?`σ(x)={${v.fix(a.value,2)}, ${v.fix(b.value,2)}}; ρ(x)=${v.fix(st.rho,3)}. ${st.d===0?'λ is in the spectrum; no inverse exists.':`Resolvent norm = ${v.fix(1/st.d,4)}.`}`:'');
}
export const algebraIntroduction={
 num:'18.2',kind:'Concept',name:'Algebra, topology and complex analysis meet',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., discussion18.2, p.357'],
 statement:String.raw`Invertibility and the spectrum are algebraic notions. In a complex Banach algebra, completeness and the norm control inversion and spectral radius; holomorphic functions prove that spectra are nonempty. Complex scalars matter: the corresponding conclusion fails for real algebras.`,
 idea:String.raw`Neumann series use completeness to build inverses. Applying bounded linear functionals to a resolvent creates scalar holomorphic functions, to which Liouville's theorem applies. The spectral-radius formula then identifies an algebraically defined quantity with a limit of norms.`,
 caption:String.raw`A diagonal complex matrix gives a concrete finite example. Move its two eigenvalues and the test point$\lambda$: invertibility fails at the spectral points, while the smallest centered disc containing them defines the radius.`,
 deps:['rca-18.1'],tags:['Banach algebras','spectrum'],viz:spectrumPicture,
};
export const holomorphicResolvent={
 num:'18.5',kind:'Theorem',name:'Bounded functionals of the resolvent are holomorphic',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem18.5 and proof, p.359'],
 statement:String.raw`If$\Phi\in A^*$ and$x\in A$, then$f(\lambda)=\Phi((x-\lambda e)^{-1})$ is holomorphic on$\C\setminus\sigma(x)$ and tends to zero as$\lambda\to\infty$. Its derivative is$\Phi((x-\lambda e)^{-2})$.`,
 idea:String.raw`Apply18.4 to$x-\lambda e$ and perturbation$(\lambda-\mu)e$. The inverse expansion has a quadratic remainder, so applying$\Phi$ gives the stated complex derivative. Also$\lambda(x-\lambda e)^{-1}=(x/\lambda-e)^{-1}\to-e$ by continuity of inversion, proving decay.`,
 caption:String.raw`For the scalar algebra, move$x$ and vary the circle around it. The image of$\lambda=x+r e^{it}$ under$(x-\lambda)^{-1}$ is$-e^{-it}/r$. Increasing$r$ shrinks its modulus as$1/r$; the excluded spectral point is its only pole.`,
 deps:['rca-18.4'],tags:['resolvent','holomorphic'],
 viz(v){const r=v.slider('radius $r$',.1,4,1,{step:.01});const S=v.stage({x:[-4.5,4.5],y:[-4.5,4.5],equal:true,height:350,title:'resolvent along a circle about the spectral point'});const x=S.handle(.5,.3,{color:'accent',label:'x'});
  const R=v.stage({x:[-Math.PI,Math.PI],y:[-10.5,10.5],height:260,full:true,title:'real and imaginary parts of (x − λ)⁻¹'});
  v.render(()=>{R.setView(null,[-1.15/r.value,1.15/r.value]);S.circle(x.x,x.y,r.value,{color:'gold',width:2});R.fn(t=>-Math.cos(t)/r.value,{color:'accent'});R.fn(t=>Math.sin(t)/r.value,{color:'green'});});
  v.legend([['gold','λ circle'],['accent','real part'],['green','imaginary part']]);v.readout(()=>`Resolvent modulus = 1/r = ${v.fix(1/r.value,4)}; derivative modulus = 1/r² = ${v.fix(1/r.value**2,4)}.`);
 },
};
export const nonemptySpectrum={
 num:'18.6',kind:'Theorem',name:'Every spectrum is nonempty and compact',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem18.6 and complete proof, p.359; compactness in Corollary3 to18.4, pp.358–359'],
 statement:String.raw`For every element$x$ of a complex Banach algebra with unit,$\sigma(x)$ is compact and nonempty. Every$\lambda\in\sigma(x)$ satisfies$|\lambda|\le\|x\|$.`,
 idea:String.raw`The open invertible group and the Neumann series give compactness and the norm bound. If the spectrum were empty, choose a bounded functional$\Phi$ nonzero on one resolvent value by Hahn–Banach. By18.5,$\Phi((x-\lambda e)^{-1})$ would be entire and tend to zero at infinity; Liouville forces it to vanish identically, a contradiction.`,
 caption:String.raw`The finite example displays the two eigenvalues of a diagonal matrix. They always furnish spectral points, even when they coincide. The resolvent is undefined at a spectral point; this picture illustrates the theorem, whose proof also covers infinite-dimensional algebras.`,
 deps:['rca-18.5','rca-18.4','rca-18.3','rca-5.21','rca-10.23'],tags:['spectrum','Liouville'],viz:spectrumPicture,
};
export const spectralRadiusDefinition={
 num:'18.8',kind:'Definition',name:'Spectral radius',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Definition18.8, p.360'],
 statement:String.raw`The spectral radius of$x\in A$ is$\rho(x)=\sup\{|\lambda|:\lambda\in\sigma(x)\}$, the radius of the smallest closed disc centered at the origin containing the spectrum.`,
 idea:String.raw`Nonemptiness and compactness from18.6 make this a finite nonnegative maximum. It can be strictly smaller than$\|x\|$, for example for a nonzero nilpotent matrix.`,
 deps:['rca-18.6'],tags:['spectrum','definitions'],
};
export const spectralRemarks={
 num:'18.10',kind:'Concept',name:'Spectra depend on the algebra; spectral radius uses the norm',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Remarks18.10(a)–(b), p.361'],
 statement:String.raw`The spectrum depends on the ambient algebra: for a closed unital subalgebra$A\subset B$ with the inherited norm,$\sigma_B(x)\subset\sigma_A(x)$. Nevertheless their spectral radii agree, since both equal$\lim\|x^n\|^{1/n}$.`,
 idea:String.raw`An inverse in$A$ is an inverse in$B$, but the reverse implication can fail. Powers and their inherited norms are identical in both algebras, so18.9 gives equality of their spectral radii.`,
 caption:String.raw`For the coordinate function$z$, the spectrum in$C(\T)$ is the circle and in the disc algebra it is the filled disc. The two radii remain1. Drag$\lambda$: inside the circle the continuous boundary inverse exists but its pole prevents a holomorphic extension.`,
 deps:['rca-18.9'],tags:['subalgebras','spectrum'],viz:discSpectrum,
};
function discSpectrum(v){
 const S=v.stage({x:[-1.6,1.6],y:[-1.3,1.3],equal:true,height:350,full:true,title:'circle spectrum versus filled-disc spectrum'});const z=S.handle(.4,.3,{color:'gold',label:'λ'});
 v.render(()=>{S.circle(0,0,1,{color:'orange',fill:'orange',fillAlpha:.16});S.circle(0,0,1,{color:'accent',width:3});});
 v.legend([['accent','C(𝕋) spectrum'],['orange','disc-algebra spectrum',{area:true}]]);
 v.readout(()=>{const r=Math.hypot(z.x,z.y);return`|λ|=${v.fix(r,4)}. ${r===1?'Neither inverse exists.':r<1?'An inverse exists on the circle, but has a pole inside the disc.':'An inverse exists in both algebras.'} Both spectral radii = 1.`;});
}
export const discAlgebraExample={
 num:'18.11',kind:'Proposition',name:'The coordinate spectrum fills a hole in the disc algebra',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Example18.11, pp.361–362'],
 statement:String.raw`The boundary restrictions of functions continuous on$\overline U$ and holomorphic on$U$ form a closed subalgebra$A$ of$C(\T)$. For$f_0(e^{it})=e^{it}$,$\sigma_A(f_0)=\overline U$, whereas$\sigma_{C(\T)}(f_0)=\T$.`,
 idea:String.raw`The maximum-modulus theorem makes uniformly Cauchy boundary functions uniformly Cauchy on the whole closed disc; their limit is holomorphic inside, so$A$ is closed. The inverse$1/(\lambda-z)$ is continuous on$\T$ exactly when$|\lambda|\ne1$, and extends holomorphically to$U$ exactly when$|\lambda|>1$.`,
 caption:String.raw`Drag$\lambda$ through the two spectra. The boundary algebra permits an inverse inside the circle; the disc algebra excludes it because the inverse would have a pole there.`,
 deps:['rca-18.1a','rca-10.28','rca-10.24'],tags:['disc algebra','spectrum'],viz:discSpectrum,
};
export const quotientAlgebraDefinition={
 num:'18.14',kind:'Definition',name:'Quotient spaces and quotient algebras',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Section18.14, pp.362–363'],
 statement:String.raw`For a subspace$J\subset A$, the cosets$x+J$ form the vector space$A/J$. If$A$ is a commutative algebra and$J$ an ideal, multiplication$(x+J)(y+J)=xy+J$ is well defined. When$A$ has a unit and$J$ is proper,$A/J$ is a field if and only if$J$ is maximal.`,
 idea:String.raw`Changing representatives changes a product by$(x'-x)y'+x(y'-y)\in J$. If$J$ is maximal and$x\notin J$, the ideal$xA+J$ equals$A$, giving an inverse of$x+J$. Conversely an intermediate proper ideal would give a nonzero noninvertible coset.`,
 deps:['rca-18.12'],tags:['quotients','ideals'],
};
export const quotientNormDefinition={
 num:'18.15',kind:'Definition',name:'Quotient norms and completeness',
 refs:['Rudin, Real and Complex Analysis, 3rd ed., Section18.15(a)–(c) and proofs, pp.363–364'],
 statement:String.raw`If$J$ is a closed subspace of a normed space$A$, define$\|x+J\|=\inf_{y\in J}\|x+y\|$. This is a norm on$A/J$. If$A$ is complete, so is$A/J$; if$A$ is a commutative Banach algebra and$J$ a proper closed ideal, the quotient is a commutative Banach algebra.`,
 idea:String.raw`Closedness makes zero norm imply$x\in J$. Near-minimizing representatives prove the triangle and multiplicative inequalities. A Cauchy sequence of cosets has a subsequence with representatives whose successive differences are less than$2^{-j}$; those representatives converge in$A$, giving a limit for the original Cauchy sequence. The quotient unit has norm at most1 by definition and at least1 by submultiplicativity.`,
 deps:['rca-18.14','rca-5.1'],tags:['quotient norms','Banach algebras'],
};
