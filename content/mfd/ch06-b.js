import {SOURCES,SCOPE} from './ch06.shared.js';
import {wedgeViz,formsViz,pullbackViz,exteriorViz,vectorCalculusViz} from './ch06.ui.shared.js';
export default {collection:'mfd',chapter:6,items:[
{
num:'6.6',kind:'Definition',name:'Alternating tensors and the wedge product',
statement:String.raw`An alternating covariant k-tensor changes sign when two arguments are exchanged. Its space is $\Lambda^k V^*$, of dimension $\binom nk$ when dim V=n. The wedge product is the bilinear product with $e^i\wedge e^j=-e^j\wedge e^i$ and basis monomials in increasing order. Its normalization gives $$\begin{aligned}&(\alpha\wedge\beta)(v,w)\\&=\alpha(v)\beta(w)\\&\quad-\alpha(w)\beta(v).\end{aligned}$$ for covectors. For degrees k and ℓ, $\omega\wedge\eta=(-1)^{k\ell}\eta\wedge\omega$.`,
idea:String.raw`An alternating tensor vanishes on tuples with repeated basis vectors, and reordering distinct basis vectors determines its sign. Thus increasing index tuples give a basis. Concatenating two such tuples and sorting defines their wedge; repeated indices give zero. Moving k indices past ℓ indices makes kℓ swaps, proving the sign rule. Evaluation of wedges of covectors is the determinant of their evaluations.`,
caption:String.raw`Apply the two covectors α=(1,a) and β=(b,1) to the argument arrows. Their image parallelogram has signed area equal to (α∧β)(v,w). Swap the arguments or make either pair dependent to test the sign and vanishing rules.`,
deps:['mfd-6.5','ladr-9.27'],refs:['Meinrenken, §4.2, pp.25–27; Sjamaar, §2.1, Proposition 2.1, pp.17–20'],see:['pma-10.17'],links:{source:SOURCES.mein},tags:['wedge product','alternation'],scope:SCOPE,viz:wedgeViz
},
{
num:'6.7',kind:'Definition',name:'Differential forms on manifolds',
statement:String.raw`A differential k-form on an n-manifold is a smooth section of $\Lambda^kT^*M$. In a coordinate chart it has the unique expansion $$\omega=\sum_I a_I\,dx^I,$$ where I runs over increasing k-tuples and $dx^I=dx^{i_1}\wedge\cdots\wedge dx^{i_k}$. A 0-form is a smooth function, and k-forms vanish identically for k>n. Smoothness concerns these local coefficients; a vanishing coefficient in a singular parametrization does not establish that the intrinsic form vanishes.`,
idea:String.raw`Use the alternating basis in each cotangent space. Smooth coefficient functions specify a smooth field, and the invertible transition Jacobians give compatible descriptions on chart overlaps. On the unit sphere, the ambient expression $\omega_p(v,w)=p\cdot(v\times w)$ is smooth and nonzero on each oriented tangent plane. Its longitude-latitude coefficient is cos φ, which vanishes at the poles because that parametrization loses rank.`,
caption:String.raw`Move a probe over the unit sphere and compare the coordinate pair with an orthonormal tangent pair. At either pole the longitude derivative vanishes; the intrinsic area form still has absolute evaluation 1 on the orthonormal pair. Reverse the pair to change the sign.`,
deps:['mfd-6.6','mfd-2.4'],refs:['Meinrenken, §4.3, Definition 4.10, p.28; Sjamaar, §7.1, Definition 7.1, pp.91–92'],see:['pma-10.11'],links:{source:SOURCES.mein},tags:['differential form','coordinate chart'],scope:SCOPE,viz:formsViz
},
{
num:'6.8',kind:'Definition',name:'Pullback of forms',
statement:String.raw`For a smooth map F:M→N and a k-form ω on N, its pullback is defined by Write $w_i=dF_pv_i$. Then $$\begin{aligned}&(F^*\omega)_p(v_1,\ldots,v_k)\\&=\omega_{F(p)}(w_1,\ldots,w_k).\end{aligned}$$ Pullback preserves wedge products and satisfies $(G\circ F)^*=F^*G^*$. In equal-dimensional coordinates, pulling back a top form multiplies its coefficient by the signed Jacobian determinant. F need not be injective or have full rank.`,
idea:String.raw`The differential pushes each tangent argument forward, so the form can evaluate them at the target point. Multilinearity and alternation survive this substitution. The chain rule proves composition, and the determinant evaluation of wedges proves the top-form formula, including orientation reversal and rank loss.`,
caption:String.raw`Use F(u,v)=(u,εv+cu²), with ε=1, −1 or 0. Compare α=x dy on the pushed vector with its pulled-back covector on the original vector. The grid also shows why the area-form pullback has coefficient ε.`,
deps:['mfd-6.7','mfd-2.4'],refs:['Meinrenken, §4.5, pp.29–30, pullback definition and Theorem 4.12 (wedge/composition portions)'],see:['pma-10.21'],links:{source:SOURCES.mein},tags:['pullback','Jacobian'],scope:SCOPE,viz:pullbackViz
},
{
num:'6.9',kind:'Theorem',name:'Exterior derivative; d² = 0',
statement:String.raw`There is a unique linear operator d from k-forms to (k+1)-forms agreeing with df on functions, satisfying d²=0 and the graded product rule $$\begin{aligned}&d(\omega\wedge\eta)\\&=d\omega\wedge\eta\\&\quad+(-1)^k\omega\wedge d\eta.\end{aligned}$$ Locally, $d(\sum_I a_I\,dx^I)=\sum_I da_I\wedge dx^I$. It commutes with pullback: $d(F^*\omega)=F^*(d\omega)$. Here all coefficients and maps are smooth.`,
idea:String.raw`The local formula forces uniqueness because coordinate forms are wedges of differentials of functions. Applying it twice pairs equal mixed partial derivatives with opposite wedge signs, giving zero. The product rule follows by expanding coefficients and sorting indices. On local generators f and df, pullback commutation is the chain rule and d²=0; the product rule extends it to every local form. Hence the coordinate definitions agree on overlaps and glue globally. No finite global coordinate expansion is assumed.`,
caption:String.raw`For α=−y³ dx/3+x³ dy/3, shrink a square around the probe. Its exact boundary circulation divided by area equals x²+y²+2h²/3, approaching the coefficient of dα. At h=0 the displayed average is its limit, not a division by zero.`,
deps:['mfd-6.2','mfd-6.8','pma-10.20'],refs:['Meinrenken, §4.4, Theorem 4.11, pp.28–29; §4.5, Theorem 4.12, p.30'],links:{source:SOURCES.mein},tags:['exterior derivative','closed form'],scope:SCOPE,viz:exteriorViz
},
{
num:'6.10',kind:'Proposition',name:'d unifies gradient, curl and divergence',
statement:String.raw`In oriented Euclidean three-space, identify a vector field F=(P,Q,R) with the 1-form $\lambda_F=P\,dx+Q\,dy+R\,dz$ and the 2-form $$\begin{aligned}\sigma_F&=P\,dy\wedge dz\\&\quad+Q\,dz\wedge dx\\&\quad+R\,dx\wedge dy.\end{aligned}$$ Then $$df=\lambda_{\nabla f},$$ $$d\lambda_F=\sigma_{\nabla\times F},$$ $$d\sigma_F=(\nabla\cdot F)\,dx\wedge dy\wedge dz.$$ Thus curl grad=0 and div curl=0 for smooth data. These vector identifications use the Euclidean metric and orientation.`,
idea:String.raw`Expand the coordinate formula for d and sort each wedge into the displayed cyclic order. Repeated differentials vanish; the remaining signed first derivatives are exactly the familiar gradient, curl and divergence formulas. Applying d again proves the two zero identities without treating them as numerical coincidences.`,
caption:String.raw`Compare the gradient of f=x²y+yz² with the curl or divergence of F=(yz+x²,x²z+y²,xy²+z²). Move the spatial probe. Component bars show the computed vector or scalar, while the readout exposes the cancelling derivatives in div curl F.`,
deps:['mfd-6.9','pma-10.42'],refs:['Meinrenken, §4.4, pp.28–29, together with the coordinate calculation supplied here'],see:['vcalc-3.8'],links:{source:SOURCES.mein},tags:['vector calculus','exterior derivative'],scope:SCOPE,viz:vectorCalculusViz
}
]};
