import * as U from './ch07.ui.shared.js';
const filtration=String.raw`Brownian martingales use the completed right-continuous natural filtration under a fixed starting law. All displayed sample averages are finite estimates, not exact expectations.`;
export default {collection:'prob',chapter:7,items:[
{
num:'7.5.1',kind:'Theorem',name:'Optional stopping for continuous martingales',
statement:String.raw`Let X_t be an integrable right-continuous martingale adapted to a right-continuous filtration. If T is a stopping time bounded by a deterministic constant, then X_T is integrable and $E X_T=E X_0$. Path continuity is sufficient but not necessary; right continuity suffices. Boundedness of T cannot simply be dropped.`,
idea:String.raw`Choose a deterministic integer horizon beyond T and all its strictly later dyadic approximations. Discrete optional sampling, including its conditional form, writes each sampled value as the conditional expectation of X at that horizon given its stopped σ-field. These fields decrease to F_T. Lévy's downward theorem gives an L¹ limit, and right continuity identifies it with X_T. Taking expectations proves the identity without assuming a bound on X itself.`,
caption:String.raw`Compare the first grid exit capped at time 1 with the time of the grid maximum. The latter looks ahead and can create a positive average payoff.`,
deps:['prob-7.3.5','prob-7.3.7','prob-4.4.1','prob-4.7.3'],refs:U.reference('Theorem 7.5.1','375–376'),links:{source:U.SOURCE},tags:['martingales','optional stopping'],scope:filtration+String.raw` The first-exit experiment stops at an actual grid node and permits overshoot, preserving the sampled martingale stopping rule. Its cap is deterministic. The maximum rule is a deliberate failure of the stopping-time hypothesis.`,viz:U.optionalStopping
},
{
num:'7.5.2',kind:'Theorem',name:'Brownian motion is a martingale',
statement:String.raw`Under P_x, Brownian motion B_t is an integrable martingale: for 0≤s≤t,
$$E_x[B_t\mid\mathcal F_s]=B_s.$$`,
idea:String.raw`Write B_t as B_s plus the future increment. That increment is independent of F_s with mean zero, so its conditional expectation vanishes. Gaussian marginals give the required integrability. The right-continuous Markov property licenses the same conclusion for the completed natural filtration.`,
caption:String.raw`Change the present state and remaining duration. Conditional endpoints spread as √h, but their exact conditional mean stays at the present state.`,
deps:['prob-7.2.1'],refs:U.reference('Theorem 7.5.2','376'),links:{source:U.SOURCE},tags:['martingales','brownian motion'],scope:filtration,viz:U.brownianMartingale
},
{
num:'7.5.3',kind:'Theorem',name:'Exit probabilities from an interval',
statement:String.raw`For a<x<b, let T be the first exit of Brownian motion from (a,b). Then T is finite almost surely, B_T is either a or b, and
$$P_x(B_T=a)=\frac{b-x}{b-a},$$
$$P_x(B_T=b)=\frac{x-a}{b-a}.$$`,
idea:String.raw`Recurrence or unbounded oscillation makes the exit finite, and continuity prevents overshoot. Stop the martingale B at T∧t, a bounded stopping time. Its values remain in [a,b], so bounded convergence gives E_xB_T=x as t→∞. Solving this weighted average of a and b gives the two probabilities.`,
caption:String.raw`Move the start inside the interval and compare the two exact affine probabilities. The sample panel keeps left exits, right exits and unresolved paths as three separate outcomes.`,
deps:['prob-7.5.1','prob-7.5.2','prob-7.2.8','prob-1.6.7'],refs:U.reference('Theorem 7.5.3','376'),links:{source:U.SOURCE},tags:['brownian motion','hitting times'],scope:filtration+' '+U.finiteScope+String.raw` The endpoint extensions are displayed with immediate exit at time zero. Polygonal first exits can miss earlier true Brownian crossings.`,viz:U.exitProbability
},
{
num:'7.5.4',kind:'Theorem',name:'B_t² − t is a martingale',
statement:String.raw`The process $M_t=B_t^2-t$ is an integrable Brownian martingale. Under P_x, E_xM_t=x². More precisely, $E[B_t^2\mid\mathcal F_s]=B_s^2+(t-s)$.`,
idea:String.raw`Expand (B_s+(B_t−B_s))². The mixed term has conditional mean zero, and the squared increment has conditional mean t−s. Subtracting t leaves B_s²−s. Gaussian second moments ensure integrability.`,
caption:String.raw`Separate the known squared state from the added increment variance. A finite conditional sample estimates the corrected mean and fluctuates around its exact value.`,
deps:['prob-7.5.2','prob-7.1.1a'],refs:U.reference('Theorem 7.5.4','376'),links:{source:U.SOURCE},tags:['martingales','brownian motion'],scope:filtration,viz:U.squareMartingale
},
{
num:'7.5.5',kind:'Theorem',name:'Mean exit time from an interval: E₀T = −ab',
statement:String.raw`For a<0<b and $T=\inf\{t\ge0:B_t\notin(a,b)\}$ with B₀=0,
$$E_0T=-ab.$$
More generally, for a<x<b, $E_xT=(x-a)(b-x)$.`,
idea:String.raw`Optional stopping for B²−t gives E_x(T∧t)=E_xB²_{T∧t}−x². The left side increases to E_xT; the right side converges by bounded convergence because the stopped position remains in [a,b]. Insert the two endpoint probabilities to obtain (x−a)(b−x), including finiteness of the expected exit time.`,
caption:String.raw`Change both boundaries and the observation horizon. The exact mean is a parabola in the starting position; capped polygonal observations show the separate effects of finite observation and grid approximation.`,
deps:['prob-7.5.1','prob-7.5.4','prob-7.5.3','prob-1.6.6','prob-1.6.7'],refs:U.reference('Theorem 7.5.5 and translated version','376–377'),links:{source:U.SOURCE},tags:['brownian motion','hitting times'],scope:filtration+' '+U.finiteScope,viz:U.exitMean
},
{
num:'7.5.6',kind:'Theorem',name:'Exponential martingale exp(θB_t − θ²t/2)',
statement:String.raw`For each real θ,
$$M_t=\exp(\theta B_t-\theta^2t/2)$$
is a positive integrable martingale. Under P_x its expectation is e^{θx}. For B₀=0, its time-t median is e^{−θ²t/2}, although its mean is 1.`,
idea:String.raw`Factor M_t into M_s and exp(θ(B_t−B_s)−θ²(t−s)/2). The second factor is independent of F_s and has expectation one by the normal moment-generating function. That Gaussian exponential moment also proves integrability. For the median, use the symmetry of B_t and monotonicity of the exponential; θ=0 is the constant case.`,
caption:String.raw`Vary θ to compare sample paths with the exact mean and median. Rare large outcomes can make the sample average unstable even when the mean has a simple formula.`,
deps:['prob-7.2.1','prob-7.1.1a'],refs:U.reference('Theorem 7.5.6','377'),links:{source:U.SOURCE},tags:['martingales','brownian motion'],scope:filtration+' '+U.finiteScope,viz:U.exponential
},
{
num:'7.5.7',kind:'Theorem',name:'Laplace transform of hitting times',
statement:String.raw`For B₀=0, a>0, λ≥0 and $T_a=\inf\{t\ge0:B_t=a\}$,
$$E_0e^{-\lambda T_a}=e^{-a\sqrt{2\lambda}}.$$
For a negative target, replace a by |a|. For a=0, T₀=0 and the transform is 1.`,
idea:String.raw`For λ>0 choose θ=√(2λ) and stop the exponential martingale at T_a∧t. Before hitting, B≤a, so the stopped exponential is bounded by e^{θa}. As t→∞, bounded convergence and almost-sure finiteness of T_a yield 1=e^{θa}E[e^{−λT_a}]. The case λ=0 follows from finiteness; symmetry handles negative targets.`,
caption:String.raw`Move the level and Laplace parameter. Compare the exact curve with samples generated directly from the reflection-principle hitting-time law.`,
deps:['prob-7.5.1','prob-7.5.6','prob-7.2.9','prob-1.6.7'],see:['stoch-13.8'],refs:U.reference('Theorem 7.5.7','377'),links:{source:U.SOURCE},tags:['brownian motion','hitting times'],scope:filtration+String.raw` The display samples T_a=a²/Z² for a standard normal Z, derived from the reflection-principle CDF. This is an exact distributional construction in ideal arithmetic, evaluated with a finite pseudorandom generator.`,viz:U.hittingLaplace
},
{
num:'7.5.8',kind:'Theorem',name:'Space-time harmonic polynomials give martingales',
statement:String.raw`If u(t,x) is a polynomial satisfying
$$u_t+\tfrac12u_{xx}=0,$$
then u(t,B_t) is a martingale. Examples are x, x²−t, x³−3tx and x⁴−6tx²+3t². The plus sign in the backward heat operator is essential.`,
idea:String.raw`Integrate u against the Gaussian transition density and differentiate with respect to elapsed time. The density satisfies the forward heat equation; two integrations by parts transfer its second derivative to u, leaving u_t+u_{xx}/2=0. Gaussian decay controls all polynomial boundary terms and moments. Apply the Markov property after shifting the starting time to obtain the conditional identity, not just constancy of unconditional expectations.`,
caption:String.raw`Choose a polynomial degree and present state. Compare its present and future spatial profiles with a finite conditional-average estimate.`,
deps:['prob-7.2.1','prob-7.1.1a'],refs:U.reference('Theorem 7.5.8 and examples','377–378'),links:{source:U.SOURCE},tags:['martingales','brownian motion'],scope:filtration+String.raw` The source proof has a later sign slip when restating the shifted polynomial equation; the authored equation and direct derivatives consistently use u_t+u_xx/2=0.`,viz:U.polynomials
},
{
num:'7.5.9',kind:'Theorem',name:'Second moment of the exit time: ET² = 5a⁴/3',
statement:String.raw`For a>0, Brownian motion started at zero and its first exit time T from (−a,a),
$$E_0T^2=\frac{5a^4}{3}.$$
In particular Var₀(T)=2a⁴/3, since E₀T=a².`,
idea:String.raw`Stop B⁴−6tB²+3t² at T∧t. Its expectation remains zero. The stopped position is bounded by a, and the mixed term is dominated by 6a²T, which is integrable by the mean-exit theorem. Dominated and monotone convergence give a⁴−6a²E₀T+3E₀T²=0. Substituting E₀T=a² gives the result.`,
caption:String.raw`Change the exit radius and starting position. Normalized first and second moment profiles show the scale laws; the three bars display the exact stopped-polynomial balance at the center.`,
deps:['prob-7.5.1','prob-7.5.8','prob-7.5.5','prob-1.6.6','prob-1.6.7'],refs:U.reference('Theorem 7.5.9; off-center polynomial consequence derived here','378'),links:{source:U.SOURCE},tags:['brownian motion','hitting times'],scope:String.raw`The theorem's starting state is zero. The displayed extension is E_xT²=(5a⁴−6a²x²+x⁴)/3 for |x|≤a, obtained from the same stopped quartic using E_xT=a²−x². The plots and bars are analytic values, not simulations.`,viz:U.secondExitMoment
}
]};
