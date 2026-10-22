import * as U from './ch07.ui.shared.js';
const filtration=String.raw`Use a right-continuous filtration to which the continuous process is adapted; for Brownian motion one may use the completed right-continuous natural filtration under a fixed P_x. The convention inf ∅=∞ applies.`;
export default {collection:'prob',chapter:7,items:[
{
num:'7.3.1a',kind:'Definition',name:'Stopping time in continuous time',verify:true,
statement:String.raw`For a right-continuous filtration (F_t), a random variable S with values in [0,∞] is a stopping time when {S≤t}∈F_t for every t≥0. Equivalently, {S<t}∈F_t for every t≥0. Define the information at S by
An ambient event A belongs to F_S exactly when $A\cap\{S\le t\}\in\mathcal F_t$ for every t≥0.`,
idea:String.raw`The strict event is a countable union of earlier non-strict events. Conversely, {S≤t} is the intersection of {S<t+1/n}; membership in every slightly later field gives membership in F_t by right continuity. The definition of F_S requires an event to be decidable whenever stopping has already occurred. A last visit before a future deadline generally fails this test.`,
caption:String.raw`Compare two paths with identical pasts and different futures. First hitting is already decided at the cutoff; the last-zero rule can change when the unseen continuation changes.`,
deps:['prob-4.2.8a'],refs:U.reference('unnumbered stopping-time and stopped-σ-field definitions in §7.3','366–367'),links:{source:U.SOURCE},tags:['stopping times','brownian motion'],scope:filtration+String.raw` The atlas suffix “a” marks unnumbered source definitions and retains its source-number flag. The displayed paths are deterministic illustrations.`,viz:U.stoppingDefinition
},
{
num:'7.3.1',kind:'Theorem',name:'Hitting times of open sets are stopping times',
statement:String.raw`For a continuous adapted process B and an open set G, the entrance time $T=\inf\{t\ge0:B_t\in G\}$ is a stopping time for a right-continuous filtration. The entrance infimum need not itself be a time at which B_T lies in G.`,
idea:String.raw`Continuity and openness give {T<t}=⋃_{q<t}{B_q∈G}, using nonnegative rational q. A genuine visit before t persists on a small time interval, which contains a rational. This countable union belongs to F_t. Right continuity converts the strict-event formulation to the non-strict one.`,
caption:String.raw`Refine rational checkpoints for the open target (a,∞). A finite checkpoint set may detect membership later than the polygonal entrance boundary, or miss it entirely.`,
deps:['prob-7.3.1a'],refs:U.reference('Theorem 7.3.1','366'),links:{source:U.SOURCE},tags:['stopping times'],scope:filtration+' '+U.finiteScope,viz:U.openHitting
},
{
num:'7.3.2',kind:'Theorem',name:'Decreasing limits of stopping times are stopping times',
statement:String.raw`If T_n are stopping times for a right-continuous filtration and T_n decreases pointwise to T, then T is a stopping time. Infinite values are allowed.`,
idea:String.raw`For every t, {T<t}=⋃_n{T_n<t}, because a decreasing sequence with limit strictly below t eventually crosses below t. This event belongs to F_t, and right continuity supplies the equivalent non-strict definition. A fixed deterministic delay of a stopping time is stopping, giving the example T_n=T+2⁻ⁿ.`,
caption:String.raw`Decrease a deterministic delay attached to a capped exit time. The marked times approach the same limit from above.`,
deps:['prob-7.3.1a'],refs:U.reference('Theorem 7.3.2','366'),links:{source:U.SOURCE},tags:['stopping times'],scope:filtration+' '+U.finiteScope,viz:U.decreasing
},
{
num:'7.3.3',kind:'Theorem',name:'Increasing limits of stopping times are stopping times',
statement:String.raw`If T_n are stopping times and T_n increases pointwise to T, then T is a stopping time. For this direction, the usual non-strict definition needs only an increasing filtration, not right continuity.`,
idea:String.raw`The identity {T≤t}=⋂_n{T_n≤t} is exact, including T=∞. Each event on the right is known by time t. Increasing target levels for a continuous real path give a concrete increasing sequence of first hitting times.`,
caption:String.raw`Move through increasing levels below 0.8. Their first polygonal hitting times cannot move backward; undetected levels remain unobserved.`,
deps:['prob-7.3.1a'],refs:U.reference('Theorem 7.3.3','366'),links:{source:U.SOURCE},tags:['stopping times'],scope:U.finiteScope+String.raw` The abstract monotone-limit identity is independent of Brownian motion.`,viz:U.increasing
},
{
num:'7.3.4',kind:'Theorem',name:'Hitting times of closed sets are stopping times',
statement:String.raw`For a continuous adapted process B, a closed set K and a right-continuous filtration, $T_K=\inf\{t\ge0:B_t\in K\}$ is a stopping time. If T_K<∞, continuity and closedness ensure B_{T_K}∈K.`,
idea:String.raw`Surround K by open neighborhoods of radii decreasing to zero. Their entrance times are stopping and increase to a limit no larger than T_K. If that limit is finite, the corresponding boundary values approach K, and path continuity places the limiting value in the closed set. Thus the limit is T_K; the increasing-limit theorem finishes the argument.`,
caption:String.raw`Shrink the open neighborhood around a closed singleton. The boundary distance tends to zero, explaining the final closedness step in the proof.`,
deps:['prob-7.3.1','prob-7.3.3'],refs:U.reference('Theorem 7.3.4','366'),links:{source:U.SOURCE},tags:['stopping times'],scope:filtration+' '+U.finiteScope,viz:U.closedHitting
},
{
num:'7.3.5',kind:'Theorem',name:'Dyadic approximation of stopping times',
statement:String.raw`For a stopping time S and n≥0, set S_n=∞ when S=∞, and otherwise
$$S_n=2^{-n}(\lfloor2^nS\rfloor+1).$$
Then S_n is a stopping time, S_n decreases to S, and $0<S_n-S\le2^{-n}$ whenever S<∞. In particular, a value already on the grid advances to the next grid point.`,
idea:String.raw`At a grid point k·2⁻ⁿ, the event {S_n≤k·2⁻ⁿ} is exactly {S<k·2⁻ⁿ}, known by that time. Between grid points the same event is unchanged. The refined strictly later grid point is never later than the coarser one, and its excess over S is at most the mesh. This proves both the stopping property and monotone convergence.`,
caption:String.raw`Choose S and the grid level, including exact dyadic values such as 0.375. The orange marker always lies strictly to the right of S.`,
deps:['prob-7.3.1a'],refs:U.reference('Theorem 7.3.5; corrected grid-event argument','367'),links:{source:U.SOURCE},tags:['stopping times'],scope:filtration+String.raw` The displayed value of S is a finite deterministic probe of the rounding operation. The source's malformed event/index line is replaced by the explicit non-strict grid event above.`,viz:U.dyadicStop
},
{
num:'7.3.6',kind:'Theorem',name:'F_S ⊂ F_T when S ≤ T',
statement:String.raw`If S and T are stopping times with S≤T pointwise, then $\mathcal F_S\subseteq\mathcal F_T$. Thus information available at the earlier random time remains available at the later one.`,
idea:String.raw`For A∈F_S, the event A∩{T≤t} equals (A∩{S≤t})∩{T≤t}. Both factors are in F_t, so this holds for every t and proves A∈F_T. The argument does not require that either stopping time be finite.`,
caption:String.raw`Compare capped exits from nested intervals. The revealed path prefix at the inner exit lies inside the prefix at the outer exit.`,
deps:['prob-7.3.1a'],refs:U.reference('Theorem 7.3.6','367'),links:{source:U.SOURCE},tags:['stopping times','filtrations'],scope:filtration+' '+U.finiteScope,viz:U.informationInclusion
},
{
num:'7.3.7',kind:'Theorem',name:'F_T = ∩ F_{Tₙ} for Tₙ ↓ T',
statement:String.raw`If T_n decreases to T through stopping times for a right-continuous filtration, then
$$\mathcal F_T=\bigcap_n\mathcal F_{T_n}.$$`,
idea:String.raw`Since T≤T_n, the preceding inclusion proves one direction. If A is in every F_{T_n}, then A∩{T<t} is the union of A∩{T_n<t}, hence belongs to F_t. The strict-event version of the stopped-field definition, valid by right continuity, puts A in F_T.`,
caption:String.raw`Shrink the observed prefix toward a limiting time. The deterministic-time example shows the direction of nesting used in the general random-time argument.`,
deps:['prob-7.3.6','prob-7.3.2'],refs:U.reference('Theorem 7.3.7','367'),links:{source:U.SOURCE},tags:['stopping times','filtrations'],scope:filtration+' '+U.finiteScope,viz:U.decreasingInformation
},
{
num:'7.3.8',kind:'Theorem',name:'B_S is F_S-measurable',
statement:String.raw`If B is a continuous adapted process and S is a stopping time, its stopped value B_S is F_S-measurable on {S<∞}. One may assign a fixed cemetery value on {S=∞}.`,
idea:String.raw`For the strictly later dyadic approximations S_n, B_{S_n} is F_{S_n}-measurable by splitting over their countably many possible values. Fix m: all n≥m give variables measurable in F_{S_m}, because S_n≤S_m. Continuity makes their limit B_S measurable there too. Intersect over m and use the preceding stopped-field identity.`,
caption:String.raw`Follow the values at dyadic times approaching a capped exit. Their positions converge along the same continuous interpolation.`,
deps:['prob-7.3.5','prob-7.3.7'],refs:U.reference('Theorem 7.3.8','368'),links:{source:U.SOURCE},tags:['stopping times'],scope:filtration+' '+U.finiteScope,viz:U.stoppedValue
},
{
num:'7.3.9',kind:'Theorem',name:'Strong Markov property of Brownian motion',
statement:String.raw`Let S be a Brownian stopping time. For a bounded jointly measurable function (s,ω)↦Y_s(ω), on {S<∞},
$$E_x[Y_S\circ\theta_S\mid\mathcal F_S]=\phi(B_S,S),$$
where φ(y,s)=E_yY_s. In particular, at an almost surely finite S, the process $(B_{S+t}-B_S)_{t\ge0}$ is a Brownian motion independent of F_S.`,
idea:String.raw`First split a countably valued stopping time into its level events and apply the deterministic-time Markov property on each. Approximate a general S from above by the dyadic stopping times. For bounded continuous cylinder functions, path continuity and continuity of the Gaussian transition operator allow the limit. A monotone class argument then covers bounded jointly measurable Y.`,
caption:String.raw`Compare restarting at a first hit with restarting at the last zero before a deadline. The latter rule selects its continuation using the future and is outside the theorem.`,
deps:['prob-7.3.5','prob-7.3.6','prob-7.3.8','prob-7.2.1','prob-5.2.2','prob-1.6.7'],refs:U.reference('Theorem 7.3.9','368–369'),links:{source:U.SOURCE},tags:['brownian motion','markov property'],scope:filtration+' '+U.finiteScope+String.raw` Only restarts detected by time 1 are displayed, with an additional future window. The true first-hit rule is stopping; its polygonal approximation has a finite-mesh error.`,viz:U.strongMarkov
}
]};
