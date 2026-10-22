import * as U from './ch07.ui.shared.js';
export default {collection:'prob',chapter:7,items:[
{
num:'7.6.1',kind:'Theorem',name:'Itô’s formula',
statement:String.raw`If f∈C²(ℝ) and B is one-dimensional Brownian motion, then, almost surely for all t≥0,
$$f(B_t)-f(B_0)=M_t+A_t,$$
$$M_t=\int_0^t f'(B_s)\,dB_s,$$
$$A_t=\frac12\int_0^t f''(B_s)\,ds.$$
The first integral is the Itô integral: a probability limit of adapted left-endpoint sums, with localization if necessary. It is generally not an ordinary Riemann–Stieltjes integral along the Brownian path.`,
idea:String.raw`Taylor-expand each increment along a dyadic partition. The first-order sums converge in L² when the derivatives are bounded, because independent increments give an isometry. The squared-increment measures converge to elapsed time: their total fluctuation has variance 2t²/2ⁿ, and Borel–Cantelli plus continuity controls the cumulative measures. The weighted weak-convergence lemma identifies the second-order term. Stop on bounded spatial intervals and use cutoffs to remove derivative bounds, then continuous versions and rational times give one probability-one event for all t.`,
caption:String.raw`Refine the same path while comparing the actual function change with a left-point stochastic sum plus the half-second-derivative time sum.`,
deps:['prob-7.1.1a','prob-7.5.4','prob-7.6.2','prob-2.3.1','prob-1.6.4'],see:['stoch-13.13'],refs:U.reference('Theorem 7.6.1 and proof','379–382'),links:{source:U.SOURCE},tags:['stochastic calculus'],scope:U.finiteScope+String.raw` The variance computation for squared increments is supplied in the proof and tested independently. Cutoff derivative bounds may depend on the cutoff radius; they are not asserted to equal that radius.`,viz:U.itoFormula
},
{
num:'7.6.2',kind:'Lemma',name:'Weak convergence with uniformly converging integrands',
statement:String.raw`Let μ_n be finite nonnegative measures on a compact interval, converging weakly to a finite measure μ. Suppose measurable g_n are uniformly bounded and satisfy g_n(s_n)→g(s) whenever s_n→s. Then
$$\int g_n\,d\mu_n\longrightarrow\int g\,d\mu.$$
The sequential hypothesis implies that g is continuous and g_n→g uniformly on this compact interval.`,
idea:String.raw`The sequential condition and a diagonal subsequence first show continuity of g. If uniform convergence failed, compactness would provide points s_n converging along a subsequence, contradicting that condition. Split the integral difference into a uniform-error term bounded by ||g_n−g||∞·μ_n(total) and a weak-convergence term for the continuous function g. Total masses converge and stay bounded, even when the limiting mass is zero.`,
caption:String.raw`Weight the squared-increment measure by a uniformly converging function. Switch to a zero-measure limit to see why the proof should not divide by total mass without handling zero.`,
deps:['prob-3.2.9'],see:['prob-7.6.1','prob-3.2.8'],refs:U.reference('Lemma 7.6.2, with a direct compactness proof','382'),links:{source:U.SOURCE},tags:['weak convergence'],scope:U.finiteScope+String.raw` Weak convergence of finite measures means convergence against continuous functions, including the constant one. The display uses g_n(t)=1+t+2⁻ⁿsin(2πt), and either quadratic-variation measures or those measures multiplied by 2⁻ⁿ.`,viz:U.weakIntegrands
},
{
num:'7.6.4',kind:'Theorem',name:'Stochastic integrals are continuous martingales',
statement:String.raw`Let g be continuous and suppose $E\int_0^t|g(B_s)|^2ds<\infty$ for every finite t. Then $M_t=\int_0^t g(B_s)\,dB_s$ has a continuous square-integrable martingale version, starts at zero, and satisfies
$$E M_t^2=E\int_0^t g(B_s)^2\,ds.$$
Without the integrability assumption, a continuous g still defines a continuous local martingale by localization.`,
idea:String.raw`Adapted step-integrand sums are continuous martingales. Conditioning on the past cancels cross terms and gives the isometry. The L² maximal inequality makes approximating sums Cauchy in expected squared uniform norm, yielding a continuous martingale limit. Bounded cutoffs and stopping on larger spatial intervals construct the local integral; the stated integrability condition lets the isometry and martingale identity pass to the global limit.`,
caption:String.raw`Compare g=1 and g=x. The exact second moment of each finite left-point sum is shown beside its empirical estimate and distinguished from the limiting integral's second moment.`,
deps:['prob-7.6.1','prob-7.5.2','prob-4.4.4'],see:['stoch-13.12'],refs:U.reference('Theorem 7.6.4 and localization discussion','383–384'),links:{source:U.SOURCE},tags:['stochastic calculus','martingales'],scope:U.finiteScope+String.raw` The pure-model tests verify the discrete isometry independently. Continuous interpolation of a finite sum within a mesh interval is only a display convention; the exact simple stochastic integral uses the genuine Brownian motion there.`,viz:U.stochasticIntegral
},
{
num:'7.6.5',kind:'Theorem',name:'Itô’s formula with time dependence',
statement:String.raw`For f∈C²([0,∞)×ℝ), one-dimensional Brownian motion satisfies, almost surely for all t≥0,
$$f(t,B_t)-f(0,B_0)=M_t+A_t,$$
$$M_t=\int_0^t f_x(s,B_s)\,dB_s,$$
$$A_t=\int_0^t D(s,B_s)\,ds,$$
where $D=f_t+\tfrac12 f_{xx}$.`,
idea:String.raw`Taylor-expand in both time and position. First-order time increments accumulate f_t, and the squared Brownian increments accumulate f_xx/2. Mixed time–Brownian terms vanish in probability, bounded by a constant times the square root of the mesh in L¹; squared time increments vanish deterministically. Localization controls derivatives and remainders. The stochastic term is constructed as in the one-variable formula.`,
caption:String.raw`Use f(t,x)=exp(μt+σx) and vary its two exponents. The drift coefficient μ+σ²/2 changes sign and vanishes at the exponential-martingale choice.`,
deps:['prob-7.6.1','prob-1.6.4'],refs:U.reference('Theorem 7.6.5; exponential example recomputed','384–385'),links:{source:U.SOURCE},tags:['stochastic calculus'],scope:U.finiteScope+String.raw` The stated C² regularity matches this source theorem. For exp(μt+σx), the correct drift is (μ+σ²/2)f; the source's subsequent Example 7.6.6 prints an incorrect minus sign, which is not adopted.`,viz:U.timeFormula
},
{
num:'7.6.7',kind:'Theorem',name:'Multidimensional Itô’s formula',
statement:String.raw`Let B be standard d-dimensional Brownian motion with independent coordinates and let f∈C²([0,∞)×ℝᵈ). Almost surely for all t≥0,
$$f(t,B_t)-f(0,B_0)=M_t+A_t,$$
$$M_t=\sum_{i=1}^d I_t^i,$$
$$A_t=\int_0^t D(s,B_s)\,ds,$$
$$I_t^i=\int_0^t f_{x_i}(s,B_s)\,dB_s^i,$$
where $D=f_t+\tfrac12\Delta_x f$.`,
idea:String.raw`The diagonal squared increments contribute one unit of time per coordinate. For distinct coordinates, a bounded adapted coefficient times their increment product has conditional mean zero; the sum's second moment is bounded by a constant times t times the mesh, so cross terms vanish in probability. Time–space terms vanish as before. Localization removes bounded-derivative restrictions.`,
caption:String.raw`Compare squared radius with the product xy on a two-dimensional sampled path. The latter has zero Laplacian, and its finite residual is the cross-variation sum.`,
deps:['prob-7.6.5','prob-7.1.1a','prob-1.6.4'],refs:U.reference('Theorem 7.6.7','386–387'),links:{source:U.SOURCE},tags:['stochastic calculus'],scope:U.finiteScope+String.raw` Both offered functions are globally smooth. A singular function such as log|x| would require an explicitly stopped domain; it is not used here. The theorem assumes independent standard coordinates, so their quadratic-covariation matrix is the identity times dt.`,viz:U.multidimensional
}
]};
