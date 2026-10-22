import * as U from './ch07.ui.shared.js';
export default {collection:'prob',chapter:7,title:'Brownian Motion',summary:String.raw`Gaussian increments determine Brownian motion, while a continuity argument turns its dyadic skeleton into a continuous path. Right-continuous information and stopping times support the strong Markov property, reflection and exit identities. Martingales and quadratic variation then explain the extra second-derivative term in Itô's formula.`,items:[
{
num:'7.1.1a',kind:'Definition',name:'Brownian motion',verify:true,
statement:String.raw`A standard one-dimensional Brownian motion started at x is a process B with B₀=x almost surely, continuous paths almost surely, and independent increments: for $0=t_0<t_1<\cdots<t_n$, the differences $B_{t_i}-B_{t_{i-1}}$ are independent normal variables with mean zero and variance $t_i-t_{i-1}$. In d dimensions, use d independent such coordinates.`,
idea:String.raw`Normal laws add their variances, so the prescribed increments are consistent when time points are removed. Continuity is an additional path requirement; it does not follow merely from having a normal marginal at every time. Duplicating one increment preserves the individual normal laws while destroying independence.`,
caption:String.raw`Change the interval duration and compare independent increments with a deliberately duplicated pair. The scatter tests the role of the joint law; the CDF shows that identical marginal distributions are not enough.`,
deps:['prob-1.2.5','prob-2.1.1a'],see:['stoch-13.1','thermo-7.8','pde-3.15'],refs:U.reference('unnumbered definitions at the start of §7.1','353–354'),links:{source:U.SOURCE},tags:['brownian motion','foundations'],scope:U.finiteScope+String.raw` The suffix “a” is an atlas identifier for an unnumbered source definition; its source-number flag remains.`,viz:U.definition
},
{
num:'7.1.1',kind:'Theorem',name:'Existence of the finite-dimensional Brownian laws',
statement:String.raw`For each x there is a unique probability law on the product σ-field of $\R^{[0,\infty)}$ whose coordinate process has initial value x and independent centered normal increments of variance equal to elapsed time. Equivalently, its finite vectors are Gaussian with means x and covariance $\operatorname{Cov}(B_s,B_t)=\min(s,t)$. This product-space assertion alone does not yet give a law supported on continuous paths.`,
idea:String.raw`Construct each finite vector by adding independent normal increments. Gaussian convolution gives consistency. The written countable extension theorem supplies the law for every countable set of times; every product-σ-field event depends on countably many coordinates. Evaluate such an event using its countable law: consistency makes that value independent of the representation, and taking the union of coordinate sets proves countable additivity. Cylinder events and the π–λ theorem give uniqueness.`,
caption:String.raw`Move the middle observation time. Deleting that coordinate leaves the same endpoint samples and the same covariance submatrix; it does not require resampling a new path.`,
deps:['prob-7.1.1a','prob-2.1.21','prob-2.1.6'],refs:U.reference('Theorem 7.1.1 and Gaussian formulation','354–356'),links:{source:U.SOURCE},tags:['brownian motion','construction'],scope:U.finiteScope+String.raw` The countable-coordinate argument supplies the general-index extension step; PROB 2.1.21 itself is only the countable-index theorem. Continuity of the full coordinate function is not an event in the bare product σ-field; the subsequent dyadic construction moves to continuous-path space.`,viz:U.finiteLaws
},
{
num:'7.1.2',kind:'Theorem',name:'Brownian paths are uniformly continuous on dyadics',
statement:String.raw`Let D be the nonnegative dyadic rationals and give $(B_q)_{q\in D}$ the Brownian finite-dimensional laws. Almost surely, its restriction to D∩[0,T] is uniformly continuous for every finite T. Consequently it has a unique continuous extension to [0,∞), and this extension has the Brownian finite-dimensional laws.`,
idea:String.raw`The fourth moment is $E|B_q-B_r|^4=3|q-r|^2$. The continuity criterion therefore supplies a positive Hölder exponent on each compact dyadic interval; a countable intersection over integer T handles all compact intervals. Uniformly continuous values on a dense set extend uniquely. Approximating fixed real times by dyadics and passing the Gaussian laws to the limit identifies the extension's finite-dimensional distributions.`,
caption:String.raw`Refine a fixed dyadic skeleton and follow its largest adjacent increment. Existing nodes remain unchanged, making refinement different from drawing a new unrelated path.`,
deps:['prob-7.1.1','prob-7.1.3'],refs:U.reference('Theorem 7.1.2 and surrounding construction','355–358'),links:{source:U.SOURCE},tags:['brownian motion','continuity'],scope:U.finiteScope,viz:U.dyadicContinuity
},
{
num:'7.1.3',kind:'Theorem',name:'Kolmogorov continuity theorem',
statement:String.raw`Suppose real variables X_t on [0,1] satisfy $E|X_t-X_s|^\beta\le K|t-s|^{1+\alpha}$, where α,β>0 and K<∞. For every $0<\gamma<\alpha/\beta$, almost surely there is a finite random C with
$$|X_q-X_r|\le C|q-r|^\gamma$$
for all dyadics q,r∈[0,1]. Their continuous extension is a modification of X: at each fixed t it equals X_t almost surely. The modification assertion does not mean the original uncountably indexed paths were already continuous.`,
idea:String.raw`At level n, Markov's inequality and a union over 2ⁿ edges bound the probability of an increment exceeding 2⁻ⁿᵞ by $K2^{-n(\alpha-\beta\gamma)}$. These probabilities are summable, so Borel–Cantelli leaves only finitely many bad levels. Dyadic chaining controls close pairs, and finitely many coarse intervals give the global random constant. Moment convergence makes dyadic approximations converge to X_t in probability, identifying the continuous extension at each fixed t.`,
caption:String.raw`Adjust the moment exponents and candidate Hölder exponent. The geometric probability bound is summable precisely when its displayed exponent budget is positive.`,
deps:['prob-2.3.1','prob-1.6.4','prob-7.1.4'],refs:U.reference('Theorem 7.1.3 and proof, with the modification consequence derived here','357–358'),links:{source:U.SOURCE},tags:['continuity','stochastic processes'],scope:String.raw`The visual evaluates an assumed moment estimate with K=1. It does not construct a stochastic process for arbitrary slider values. Failure of this sufficient bound gives no converse conclusion.`,viz:U.kolmogorov
},
{
num:'7.1.4',kind:'Lemma',name:'Dyadic chaining bound',
statement:String.raw`Fix γ>0 and an integer N≥0. Suppose all adjacent dyadic increments at every level n≥N have absolute value at most 2⁻ⁿᵞ. For dyadic q,r∈[0,1] with |q−r|<2⁻ᴺ,
$$|X_q-X_r|\le\frac{3}{1-2^{-\gamma}}|q-r|^\gamma.$$`,
idea:String.raw`Choose a mesh 2⁻ᵐ≤|q−r|<2·2⁻ᵐ. The rounded-down endpoints differ by at most two mesh edges. Refine each endpoint toward its exact dyadic value; each refinement adds at most one edge, whose bound shrinks by 2⁻ᵞ per level. The two tails plus two base edges total at most $2\cdot2^{-m\gamma}/(1-2^{-\gamma})$, which is even smaller than the stated bound.`,
caption:String.raw`Choose two dyadic endpoints and an exponent. Their coarse approximations approach them through smaller dyadic edges, while the geometric series bounds the accumulated cost.`,
deps:[],see:['prob-7.1.3'],refs:U.reference('Lemma 7.1.4; supplied corrected mesh argument','357'),links:{source:U.SOURCE},tags:['continuity'],scope:String.raw`This deterministic lemma assumes every indicated edge bound; the drawing does not check an infinite random path. The proof here selects the mesh from the distance rather than using the source proof's inconsistent interval indices and final inequalities.`,viz:U.chaining
},
{
num:'7.1.5',kind:'Theorem',name:'Brownian paths are Hölder continuous of order γ < 1/2',
statement:String.raw`Almost surely, on every compact time interval, a Brownian path is Hölder continuous of every order $0<\gamma<\tfrac12$. Thus for each such interval and exponent it admits a finite random constant C with $|B_t-B_s|\le C|t-s|^\gamma$ for all its s,t. The constant can depend on the path, interval and exponent.`,
idea:String.raw`Gaussian scaling gives $E|B_t-B_s|^{2m}=C_m|t-s|^m$, with finite C_m. The continuity criterion allows γ<(m−1)/(2m). Increasing m reaches every exponent below one half; a countable sequence of exponents approaching one half and integer compact intervals gives one common probability-one event.`,
caption:String.raw`Change γ and refine the same sampled path. The right panel computes the maximum quotient over every pair of displayed nodes, not only adjacent pairs.`,
deps:['prob-7.1.3','prob-7.1.1a'],refs:U.reference('Theorem 7.1.5','358'),links:{source:U.SOURCE},tags:['brownian motion','continuity'],scope:U.finiteScope+String.raw` A finite-pair maximum is only a lower bound for the continuum supremum. The critical exponent 1/2 is not included in this theorem.`,viz:U.holder
},
{
num:'7.1.6',kind:'Theorem',name:'Brownian paths are nowhere differentiable',
statement:String.raw`With probability one, Brownian motion is not pointwise locally Lipschitz at any t≥0: no finite C and positive δ make $|B_s-B_t|\le C|s-t|$ hold for every nearby s≥0. In particular, it has no finite derivative at any positive time and no finite right derivative at zero.`,
idea:String.raw`A Lipschitz bound near some point forces three neighboring mesh increments to be unusually small. Each has a normal small-ball probability of order n⁻¹ᐟ², and the three increments are independent. A union over order n possible triples therefore costs only order n⁻¹ᐟ². Let the mesh shrink, then take a countable union over integer Lipschitz constants and compact intervals. A finite derivative would imply just such a pointwise Lipschitz bound.`,
caption:String.raw`Move the probe and inspect right secants at several dyadic scales. The changing slopes illustrate the difficulty, while the proof controls every possible probe simultaneously.`,
deps:['prob-7.1.1a','prob-1.1.1'],see:['stoch-13.5'],refs:U.reference('Theorem 7.1.6 and proof','358–359'),links:{source:U.SOURCE},tags:['brownian motion','path properties'],scope:U.finiteScope+String.raw` No finite difference-quotient sequence proves nondifferentiability; the polygon itself is differentiable inside each segment. Nor does the theorem assert that every displayed sequence of quotient magnitudes increases.`,viz:U.nowhere
}
]};
