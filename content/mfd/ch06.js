import {SOURCES,SCOPE} from './ch06.shared.js';
import {covectorViz,differentialViz,lineIntegralViz,conservativeViz,tensorViz} from './ch06.ui.shared.js';
export default {collection:'mfd',chapter:6,title:'Differential forms and Stokes’s theorem',summary:String.raw`Covectors measure tangent vectors, and alternating tensors measure oriented tangent volumes. Pullback and exterior differentiation make these measurements compatible with maps, flows and boundaries. Orientation and partitions of unity turn local formulas into integrals; Stokes’s theorem then explains both conservation and topological obstructions.`,items:[
{
num:'6.1',kind:'Definition',name:'Covectors and the cotangent bundle',
statement:String.raw`For a smooth n-manifold M, a covector at p is a linear map $\alpha:T_pM\to\R$. Their union $T^*M$ is the cotangent bundle. In coordinates, $dx^1,\ldots,dx^n$ form the basis dual to the coordinate tangent vectors. A smooth covector field is a smooth section of this bundle. If the new tangent basis is the old basis multiplied by B, vector columns become $B^{-1}v$, while covector columns become $B^T\alpha$.`,
idea:String.raw`The differential of each coordinate function extracts one component of a tangent vector. Thus every linear functional is uniquely a linear combination of these coordinate differentials. On chart overlaps the chain rule supplies smooth, invertible changes of dual basis, which glue the local products into a bundle. The transformation law is forced by keeping the number $\alpha(v)$ unchanged.`,
caption:String.raw`Rotate the covector and the test vector, then shear the coordinate basis. Both panels show the same evaluation in different coordinates. Parallel lines are levels of the linear functional, spaced by 0.5; they are not a vector field.`,
deps:['mfd-2.4'],refs:['Meinrenken, Differentiable Manifolds, §4.3, Definition 4.9, pp.27–28; Sjamaar, §7.2, p.93'],links:{source:SOURCES.mein},tags:['covector','cotangent bundle'],scope:SCOPE,viz:covectorViz
},
{
num:'6.2',kind:'Definition',name:'Differential of a function',
statement:String.raw`For a smooth function $f:M\to\R$, its differential is the covector field defined by $df_p(v)=v(f)$. If a smooth curve has initial point p and velocity v, this equals the derivative of f along that curve. In coordinates, $$df=\sum_i\frac{\partial f}{\partial x^i}\,dx^i.$$ No metric is required; identifying df with a gradient vector requires a metric.`,
idea:String.raw`A tangent vector acts as a derivation on functions, so the displayed evaluation is linear in v and independent of the curve representing v. Expanding v in the coordinate tangent basis gives the coordinate formula. Smoothness follows from smoothness of the first derivatives.`,
caption:String.raw`Move the probe and direction on an elliptic or saddle-shaped quadratic function. Compare its actual increment along a straight line with the tangent prediction. The secant error is computed exactly for this quadratic, including at h=0 by its limit.`,
deps:['mfd-6.1','mfd-2.4'],refs:['Meinrenken, §4.3, p.28, differential and coordinate dual basis'],links:{source:SOURCES.mein},tags:['differential','directional derivative'],scope:SCOPE,viz:differentialViz
},
{
num:'6.3',kind:'Definition',name:'Line integrals of covector fields',
statement:String.raw`For a smooth 1-form α and a piecewise smooth path $\gamma:[a,b]\to M$, define $$\int_\gamma\alpha=\int_a^b\alpha_{\gamma(t)}(\gamma'(t))\,dt.$$ An increasing smooth reparametrization with nonzero derivative preserves this integral; a decreasing one reverses its sign. Concatenation adds integrals. Repeated traversal is not a one-to-one reparametrization.`,
idea:String.raw`Under a parameter change, the chain rule multiplies the path velocity by the parameter derivative. The one-variable substitution formula then preserves the integral, with a sign when the endpoints reverse. Splitting the parameter interval proves additivity. A 1-form records oriented motion, so absolute speed would describe a different integral.`,
caption:String.raw`Bend a parabola and change its traversal speed. The field is α=(−y dx+x dy)/2. The physical path stays fixed under reparametrization while the pulled-back density changes. Reverse the path to reverse the accumulated integral.`,
deps:['mfd-6.1','mfd-2.4','pma-6.19'],refs:['Sjamaar, §4.1, pp.49–51, line integral definition and Theorem 4.3'],see:['pma-10.48'],links:{source:SOURCES.sjam},tags:['line integral','reparametrization'],scope:SCOPE,viz:lineIntegralViz
},
{
num:'6.4',kind:'Theorem',name:'Conservative covector fields',
statement:String.raw`On a connected smooth manifold, a smooth 1-form α is exact, meaning α=df for a smooth function f, if and only if its integral over every piecewise smooth closed path is zero. Equivalently, its integral depends only on the endpoints. For α=df, $$\int_\gamma\alpha=f(\gamma(b))-f(\gamma(a)).$$ Closedness alone need not imply exactness: $(−y\,dx+x\,dy)/(x^2+y^2)$ on the punctured plane has integral 2π around the positive unit circle.`,
idea:String.raw`For df, the chain rule and fundamental theorem of calculus give the endpoint formula. Zero loop integrals imply path independence by following one path and reversing another. A connected manifold is piecewise smoothly path connected: the points reachable from a fixed point form an open and closed set using coordinate balls. Define f by an integral from that point. In a coordinate ball, append straight coordinate segments; differentiating their integrals gives each partial derivative equal to the corresponding coefficient of α. Thus f is smooth and df=α.`,
caption:String.raw`Compare df for f=x+0.4y² with the angle form on the punctured plane. The upper and lower semicircles have the same endpoints; their angle integrals differ by 2π. A full loop returns the potential to its original value.`,
deps:['mfd-6.2','mfd-6.3','pma-6.21'],refs:['Sjamaar, §4.2, Theorems 4.4 and 4.7, Examples 4.6 / 4.9, pp.51–54'],links:{source:SOURCES.sjam},tags:['exact form','path independence'],scope:SCOPE,viz:conservativeViz
},
{
num:'6.5',kind:'Definition',name:'Tensors and tensor fields',
statement:String.raw`A tensor of type (r,s) at p belongs to $(T_pM)^{\otimes r}\otimes(T_p^*M)^{\otimes s}$; equivalently, it is multilinear in r covector arguments and s vector arguments. A tensor field is a smoothly varying such tensor. In particular, a covariant 2-tensor is a bilinear function of two tangent vectors. If its matrix is A and the tangent basis changes by B, its new matrix is $B^TAB$. Symmetry or alternation is additional structure, not part of the general definition.`,
idea:String.raw`Choose a basis and evaluate the multilinear map on every tuple of basis arguments. Multilinearity reconstructs all values from those coefficients. Applying the appropriate dual or ordinary basis change in each slot gives the tensor transformation law. For a bilinear form, substituting v=Bv′ and w=Bw′ gives the matrix congruence directly.`,
caption:String.raw`Choose a positive symmetric, indefinite symmetric or alternating bilinear form. Rotate both argument vectors and shear the basis. The matrix cells change, but evaluating on the transformed argument coordinates gives the same scalar.`,
deps:['mfd-6.1','ladr-9.25'],refs:['Etingof, Lie Groups and Lie Algebras I, §4.2, Definition 4.2, p.29; bilinear basis-change calculation supplied here'],links:{source:SOURCES.etingof},tags:['tensor','multilinearity'],scope:SCOPE,viz:tensorViz
}
]};
