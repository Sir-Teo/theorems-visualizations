import * as U from './ch07.ui.shared.js';
export default {collection:'prob',chapter:7,items:[
{
num:'7.2.1',kind:'Theorem',name:'Markov property of Brownian motion',
statement:String.raw`On continuous-path space let $\mathcal F_s^0=\sigma(B_r:r\le s)$ and $\mathcal F_s^+=\bigcap_{u>s}\mathcal F_u^0$. Write $(\theta_s\omega)(t)=\omega(s+t)$. For any bounded measurable path functional Y and fixed starting state x,
$$E_x[Y\circ\theta_s\mid\mathcal F_s^+]=E_{B_s}Y\quad\text{a.s.}$$
The right side evaluates y↦E_yY at the present state B_s.`,
idea:String.raw`For a product of bounded functions at finitely many future times, independent Gaussian increments give the conditional expectation from time s+h. Let h decrease to zero: path continuity and continuity of the Gaussian transition integrals give conditioning on the right-limit field. The π–λ and monotone class arguments extend from cylinder functions to every bounded path functional.`,
caption:String.raw`Choose a restart state and duration. Fresh continuations shift with the state, while the centered endpoint law depends only on elapsed time.`,
deps:['prob-7.1.1a','prob-2.1.6','prob-5.2.2','prob-1.6.7','prob-4.1.1a'],refs:U.reference('Theorem 7.2.1','360–361'),links:{source:U.SOURCE},tags:['brownian motion','markov property'],scope:U.finiteScope+String.raw` A fixed positive observation duration is used in the displayed conditional normal law.`,viz:U.markov
},
{
num:'7.2.2',kind:'Theorem',name:'Germ information adds nothing: F_s⁺ versus F_s°',
statement:String.raw`For every bounded measurable functional Z of the complete Brownian path, every deterministic s≥0 and starting state x,
$$E_x[Z\mid\mathcal F_s^+]=E_x[Z\mid\mathcal F_s^0]\quad\text{a.s.}$$
Thus the two σ-fields coincide modulo P_x-null sets. This does not identify either one with $\mathcal F_{s+\varepsilon}^0$ for a fixed ε>0.`,
idea:String.raw`A cylinder functional splits into a factor already known at s and a functional of the shifted future. The Markov property makes its conditional expectation on the right-limit field measurable with respect to the past field. The conditioning lemma therefore identifies both expectations. A monotone class argument extends the result; choosing Z as the indicator of a right-limit event gives equality modulo null sets.`,
caption:String.raw`Shrink a finite peek at a future endpoint. Its conditional mean generally changes for positive peek lengths and approaches the no-peek value by continuity.`,
deps:['prob-7.2.1','prob-4.1.12','prob-5.2.2'],refs:U.reference('Theorem 7.2.2','362'),links:{source:U.SOURCE},tags:['brownian motion','filtrations'],scope:U.finiteScope+String.raw` The visualization sets s=0, fixes B₀=x and conditions a time-1 endpoint on finite observations. The equality of σ-fields is a measure-theoretic conclusion, not a numerical equality at a small positive ε.`,viz:U.germConditioning
},
{
num:'7.2.3',kind:'Theorem',name:'Blumenthal’s 0-1 law',
statement:String.raw`If A belongs to the Brownian germ σ-field $\mathcal F_0^+=\bigcap_{u>0}\sigma(B_r:r\le u)$, then P_x(A) is either zero or one for each fixed starting state x. The value may depend on x.`,
idea:String.raw`The preceding theorem gives $1_A=E_x[1_A\mid\mathcal F_0^0]$ almost surely. Under P_x, B₀=x is deterministic, so this conditional expectation is the constant P_x(A). An indicator equal almost surely to a constant forces that constant to be zero or one. Events such as {B₀∈D} explain why the answer can depend on the start.`,
caption:String.raw`Inspect more near-zero times and compare finite positivity-detection frequencies. These finite events can have intermediate probabilities; they are deliberately distinguished from the germ event in the theorem.`,
deps:['prob-7.2.2'],refs:U.reference('Theorem 7.2.3','362'),links:{source:U.SOURCE},tags:['brownian motion','zero-one laws'],scope:U.finiteScope+String.raw` Inspecting a finite number of times does not compute the germ σ-field.`,viz:U.blumenthal
},
{
num:'7.2.4',kind:'Theorem',name:'Brownian motion is immediately positive',
statement:String.raw`For Brownian motion with B₀=0, let $\tau=\inf\{t\ge0:B_t>0\}$. Then τ=0 almost surely. Equivalently, almost every path is positive at some time in every interval (0,ε), however small ε>0 is. By symmetry the same holds with “negative.”`,
idea:String.raw`For every t>0, the event {B_t>0} has probability one half and implies τ≤t. Continuity of probability as t decreases gives P(τ=0)≥1/2. The event {τ=0} is measurable in every positive-time window, so Blumenthal's law upgrades this lower bound to one.`,
caption:String.raw`Zoom into a fixed nested set of dyadic samples. Positive sampled values are evidence of positivity, while a finite failure to find one remains inconclusive.`,
deps:['prob-7.2.3','prob-1.1.1'],refs:U.reference('Theorem 7.2.4','362–363'),links:{source:U.SOURCE},tags:['brownian motion','path properties'],scope:U.finiteScope+String.raw` The initial value is exactly zero. The minimum is an infimum, not an attained first positive time.`,viz:U.immediatePositive
},
{
num:'7.2.5',kind:'Theorem',name:'Brownian motion returns to 0 immediately',
statement:String.raw`For Brownian motion started at zero,
$$\inf\{t>0:B_t=0\}=0\quad\text{a.s.}$$
Thus there are positive zero times arbitrarily close to zero; there is no smallest positive return time.`,
idea:String.raw`Almost surely, both signs occur arbitrarily near zero. Between a positive value and a negative value, continuity supplies a zero. Taking the two sign times inside any prescribed positive window gives a strictly positive zero within that window.`,
caption:String.raw`Inspect sign changes as the time window contracts. Marked crossing times belong to the interpolating polygon; opposite actual sampled signs certify some zero between them.`,
deps:['prob-7.2.4','prob-7.1.1a'],refs:U.reference('Theorem 7.2.5','363'),links:{source:U.SOURCE},tags:['brownian motion','path properties'],scope:U.finiteScope+String.raw` The line from zero to the first positive-time sample is a display interpolation and hides all finer oscillations.`,viz:U.immediateZero
},
{
num:'7.2.6',kind:'Theorem',name:'Time inversion',
statement:String.raw`Let B be Brownian motion started at zero. Define X₀=0 and $X_t=tB_{1/t}$ for t>0. Then X is again a standard Brownian motion. The starting-at-zero hypothesis matters.`,
idea:String.raw`Finite vectors of X are centered Gaussian, and their covariance is $st\min(1/s,1/t)=\min(s,t)$. Continuity away from zero follows directly. To prove continuity at zero, apply the strong law to B_n, then Kolmogorov's maximal inequality and Borel–Cantelli to control the intervening unit intervals; this yields B_u/u→0 almost surely as u→∞.`,
caption:String.raw`Pair increasingly large dyadic times u with reciprocal times t. Both panels display the same value B(u)/u=tB(1/t), read in opposite time regimes.`,
deps:['prob-7.1.1a','prob-2.4.1','prob-2.5.5','prob-2.3.1'],see:['stoch-13.4'],refs:U.reference('Theorem 7.2.6','363'),links:{source:U.SOURCE},tags:['brownian motion','symmetries'],scope:U.finiteScope+String.raw` Values are exact transforms of the same finite dyadic samples, up to floating-point rounding; no extrapolation to t=0 is sampled.`,viz:U.inversion
},
{
num:'7.2.7',kind:'Theorem',name:'Tail 0-1 law for Brownian motion',
statement:String.raw`Let $\mathcal T=\bigcap_{t\ge0}\sigma(B_s:s\ge t)$ be the Brownian tail σ-field. For any A∈T, either P_x(A)=0 for every starting state x or P_x(A)=1 for every x. Unlike the germ-law conclusion, the tail probability is independent of the starting state.`,
idea:String.raw`Time inversion turns a tail event under P₀ into a germ event, giving probability zero or one. Since A is measurable after time 1, write its indicator as a shifted future functional. The Markov property expresses P_x(A) as a Gaussian transition integral of a nonnegative conditional probability. A zero integral for x=0 forces that function to vanish Lebesgue-almost everywhere; positivity of every Gaussian density gives zero for every x. Apply the same reasoning to A's complement.`,
caption:String.raw`Couple two starting states by using identical increments. Their normalized discrepancy decays, illustrating why one asymptotic property ignores a fixed starting displacement.`,
deps:['prob-7.2.6','prob-7.2.3','prob-7.2.1'],refs:U.reference('Theorem 7.2.7','363–364'),links:{source:U.SOURCE},tags:['brownian motion','zero-one laws'],scope:U.finiteScope+String.raw` The coupling illustrates the normalized path, not a proof for every tail event.`,viz:U.tailLaw
},
{
num:'7.2.8',kind:'Theorem',name:'lim sup B_t/√t = ∞',
statement:String.raw`For one-dimensional Brownian motion started at zero, almost surely
$$\limsup_{t\to\infty}\frac{B_t}{\sqrt t}=+\infty,$$
$$\liminf_{t\to\infty}\frac{B_t}{\sqrt t}=-\infty.$$`,
idea:String.raw`For a fixed finite K, every B_n/√n has the standard normal law, so the probability of infinitely many exceedances is at least the positive normal upper-tail probability: intersect the decreasing unions of exceedance events. That infinitely-often event is a tail event, hence has probability one. Intersect over positive integer K and apply symmetry for the negative direction.`,
caption:String.raw`Extend a finite log-time sample and move the threshold. Running extrema summarize only the displayed times; they need not set a new record whenever the horizon grows.`,
deps:['prob-7.2.7','prob-7.1.1a','prob-1.1.1'],refs:U.reference('Theorem 7.2.8','364'),links:{source:U.SOURCE},tags:['brownian motion','path properties'],scope:U.finiteScope,viz:U.unbounded
},
{
num:'7.2.9',kind:'Theorem',name:'One-dimensional Brownian motion is recurrent',
statement:String.raw`For every starting point x, one-dimensional Brownian motion hits zero at arbitrarily large times almost surely. More precisely, with probability one, for every positive integer n there is a t≥n with B_t=0. The same conclusion holds for any fixed real target level.`,
idea:String.raw`The preceding limsup and liminf force arbitrarily late values of both signs. A fixed starting displacement does not change those normalized limits. Continuity between opposite signs gives arbitrarily late zero times, and spatial translation gives any fixed target.`,
caption:String.raw`Change the starting point and observation horizon. Every orange bracket has opposite sampled endpoint signs and therefore contains at least one genuine zero.`,
deps:['prob-7.2.8','prob-7.1.1a'],refs:U.reference('Theorem 7.2.9','364'),links:{source:U.SOURCE},tags:['brownian motion','recurrence'],scope:U.finiteScope+String.raw` Recurrence here means returns at unbounded times, not merely infinitely many zeros in a bounded interval.`,viz:U.recurrence
}
]};
