import {SOURCES,SCOPE} from './ch06.shared.js';
import {contractionViz,cartanViz,orientationViz,coverViz,volumeViz} from './ch06.ui.shared.js';
export default {collection:'mfd',chapter:6,items:[
{
num:'6.11',kind:'Definition',name:'Interior multiplication',
statement:String.raw`For a vector field X and a k-form ω with k≥1, interior multiplication inserts X into the first slot: $$\begin{aligned}&(\iota_X\omega)(v_1,\ldots,v_{k-1})\\&=\omega(X,v_1,\ldots,v_{k-1}).\end{aligned}$$ It is zero on functions, satisfies $\iota_X^2=0$, and obeys $$\begin{aligned}&\iota_X(\omega\wedge\eta)\\&=(\iota_X\omega)\wedge\eta\\&\quad+(-1)^k\omega\wedge\iota_X\eta.\end{aligned}$$ In two dimensions, inserting X=(a,b) into ρ dx∧dy gives ρ(a dy−b dx).`,
idea:String.raw`Alternation makes a second insertion of the same vector vanish. Expand a wedge of covectors: inserting X chooses one slot, with the sign obtained by moving that slot to the front. Grouping slots from the first or second factor gives the graded rule. In the plane, evaluating the resulting covector on v measures the signed area spanned by X and v, weighted by ρ.`,
caption:String.raw`Choose X and a test direction v at horizontal coordinate x. The density is ρ=1+0.3x. The covector’s level lines run parallel to X; its value on v equals the weighted signed area of the displayed parallelogram.`,
deps:['mfd-6.7'],refs:['Meinrenken, §4.2, Theorem 4.7, pp.26–27; §4.5, p.30'],links:{source:SOURCES.mein},tags:['contraction','flux'],scope:SCOPE,viz:contractionViz
},
{
num:'6.12',kind:'Theorem',name:'Cartan’s magic formula',
statement:String.raw`Let X be a smooth vector field with local flow φₜ. For any smooth differential form ω, define its Lie derivative by differentiating $\varphi_t^*\omega$ at t=0 wherever the flow is defined. Then $$\mathcal L_X\omega=d(\iota_X\omega)+\iota_X(d\omega).$$ Completeness of X is unnecessary for this local identity.`,
idea:String.raw`Differentiating pullback makes the Lie derivative a degree-zero derivation on wedge products. The two graded rules show that dι+ιd is also a degree-zero derivation. On a function f both operators give Xf; on df both give d(Xf), since pullback commutes with d. Local forms are sums of functions times wedges of coordinate differentials, so equality on these generators proves the identity everywhere.`,
caption:String.raw`For X=(ax,by), compare a centered flow difference with Cartan’s two terms. The 1-form x dy exhibits cancellation between nonzero dx terms; the area form (1+x²)dx∧dy exhibits transport of density as well as expansion. Shrink h to compare with the derivative.`,
deps:['mfd-6.11','mfd-4.8','mfd-6.9'],refs:['Meinrenken, §4.5, Theorem 4.13, pp.30–31'],links:{source:SOURCES.mein},tags:['Lie derivative','Cartan formula'],scope:SCOPE,viz:cartanViz
},
{
num:'6.13',kind:'Definition',name:'Orientations',
statement:String.raw`For n≥1, two ordered bases of an n-dimensional real vector space define the same orientation when their change-of-basis determinant is positive. There are two orientation classes. An orientation on an n-manifold chooses a class continuously in every tangent space; equivalently, it admits an atlas whose transition Jacobians are positive. For a manifold with boundary, the induced boundary orientation is outward-first: an outward transverse vector followed by a positive boundary basis is a positive ambient basis.`,
idea:String.raw`The determinant sign multiplies under composition, so positive changes of basis define an equivalence relation with two classes. A local frame gives a continuous orientation; these local choices glue exactly when their overlap signs agree. A cylinder has a consistent normal, while carrying a transverse strip vector once around the central circle of a Möbius band reverses it. This obstruction rules out a global orientation on the band. In dimension one, the outward-first rule gives a minus sign to the initial endpoint and a plus sign to the terminal endpoint.`,
caption:String.raw`Carry a tangent frame once around a cylinder or a Möbius band. On the band the transverse vector and normal return reversed. The displayed normal is a local choice along the traversal; it does not define a global normal on the band.`,
deps:['mfd-6.7','dg-4.11','mfd-1.8'],refs:['Meinrenken, §4.6, pp.32–33; Sjamaar, §8.2, pp.105–106'],links:{source:SOURCES.mein},tags:['orientation','boundary'],scope:SCOPE,viz:orientationViz
},
{
num:'6.14',kind:'Proposition',name:'The orientation covering',
statement:String.raw`For a connected n-manifold M with n≥1, let $\widetilde M$ consist of pairs (p,o), where o is an orientation of $T_pM$. Local oriented frames make the projection to M a smooth two-sheeted covering. The total space is orientable. M is orientable exactly when this cover has two connected components, each projecting diffeomorphically onto M; otherwise the cover is connected. Here a covering is allowed to have disconnected total space, extending the connected-space convention in 2.9.`,
idea:String.raw`Over a chart, attach the two signs to its coordinate frame. On overlaps, multiply the sign by the transition determinant’s sign; its cocycle identity glues the local double covers. At (p,o), transfer o through the projection differential to orient the covering manifold. An orientation of M gives a continuous section and the two disjoint graphs ±o. Conversely, if the cover is disconnected, lifting paths by subdivision into evenly covered neighborhoods shows each component maps onto M; their fiber counts are positive and sum to two. Each is therefore a one-sheeted cover, whose inverse gives an orientation.`,
caption:String.raw`Follow the lift of one or two circuits of a central circle. A Möbius band connects the two local sheets, so two circuits are required to return. A cylinder gives two separate copies. The diagram shows the restriction of the orientation covering to the central circle.`,
deps:['mfd-6.13','mfd-2.9'],refs:['Meinrenken, §4.6, Example 4.17, p.32; local gluing and component argument supplied here'],links:{source:SOURCES.mein},tags:['orientation cover','covering space'],scope:SCOPE,viz:coverViz
},
{
num:'6.15',kind:'Definition',name:'Volume forms',
statement:String.raw`A volume form on a smooth n-manifold is a smooth nowhere-zero n-form. A manifold of positive dimension is orientable if and only if it admits a volume form. A chosen volume form declares a basis positive when its evaluation is positive. Relative to a fixed orientation, positive volume forms differ by a positive smooth function. A volume form need not come from a metric and must not be confused with an exact form.`,
idea:String.raw`A nonzero top form has a definite sign on each orientation class, and its smoothness makes that choice continuous. Conversely, take positive local coordinate top forms and a subordinate smooth partition of unity. Extending the weighted forms by zero and adding gives a global form; at each point its positive summands cannot cancel. This proves existence, but does not choose a preferred normalization.`,
caption:String.raw`On a circle, vary the coefficient 1+a cos θ and find when it first vanishes. On a Möbius strip, the coefficient cos(θ/2) changes sign under the seam identification, as a global top form must; it necessarily crosses zero. Colors represent coordinate coefficients.`,
deps:['mfd-6.13','mfd-1.10'],refs:['Meinrenken, §4.6, Theorem 4.16, p.32; Sjamaar, §8.3, pp.107–108 for metric-induced examples'],links:{source:SOURCES.mein},tags:['volume form','orientability'],scope:SCOPE,viz:volumeViz
}
]};
