import * as V from './ch06.viz.js';

export default {
 collection:'game',chapter:6,title:'Evolution, learning and congestion',
 summary:'Payoff can change a population without anyone solving a strategic problem. This chapter separates resistance to invasion, deterministic population motion and finite stochastic selection, then follows individual improvements through potential games and traffic networks. Exact incentive and equilibrium certificates accompany numerical paths; selfish improvement can coexist with a rise in total cost.',
 items:[
 {
  num:'6.1',kind:'Definition',name:'Evolutionarily stable strategy',deps:['game-2.1'],
  statement:String.raw`In a finite symmetric two-player game let $A$ be the row-payoff matrix and $u(p,q)=p^TAq$ for population mixtures $p,q$ in the strategy simplex. The column player uses the transposed payoff rule. A resident $p$ is an **evolutionarily stable strategy (ESS)** if, for every distinct mutant mixture $q$, there is a threshold $\bar\varepsilon(q)>0$ such that
$$u(p,m)>u(q,m),$$
$$m=(1-\varepsilon)p+\varepsilon q,$$
for every $0<\varepsilon<\bar\varepsilon(q)$. Random matching is assumed. The threshold can depend on the mutant; one favourable comparison at one positive invasion size does not establish ESS.`,
  idea:String.raw`Bilinearity makes the incumbent advantage exactly
$$\Delta(\varepsilon)=(1-\varepsilon)F+\varepsilon S,$$
where $F=u(p,p)-u(q,p)$ and $S=u(p,q)-u(q,q)$. Thus every distinct $q$ must satisfy either $F>0$, or $F=0$ and $S>0$. If $F<0$, the mutant wins when sufficiently rare; if both terms vanish, strict resistance fails. When $F>0>S$, the crossing is $F/(F-S)$, so a resident can resist a rare mutant yet lose to a sufficiently large invasion. In the two-strategy explorer the complete ESS classification is derived analytically from the payoff-difference slope, rather than from the selected mutant alone.`,
  scope:String.raw`Finite symmetric games and independent random encounters; no spatial structure, kin assortment, mutation or finite-population correction is assumed. A mixture is a strategy distribution, distinct from the fraction of individuals assigned the mutant distribution. Identical resident/mutant strategies give no distinct invasion, and $\varepsilon=0$ is a limit comparison. The plotted matrices are authored examples.`,
  caption:'Choose a payoff family and separate the resident mixture, mutant mixture and invasion fraction. The encounter matrix fixes payoffs; the weighted mixing diagram separates strategy shares from invasion size. The ledger compares expected payoffs and the advantage line marks the chosen invasion and any interior crossing. The readout separately reports the complete two-strategy ESS classification.',
  refs:['Ben Polak, Yale ECON159, ESS handout, pp.1–5 (pure-strategy formulation)','Own bilinear extension and exact two-strategy classification'],
  credit:'Maynard Smith & Price, 1973 (ESS attribution)',links:{source:'https://oyc.yale.edu/sites/default/files/ess_handout_0_0.pdf'},viz:V.lesson1,
 },
 {
  num:'6.2',kind:'Model',name:'Hawk–Dove game',deps:['game-6.1'],
  statement:String.raw`Two individuals contest a resource worth $V\ge0$. Hawks escalate; doves retreat from hawks and share with doves. With fighting cost $C>0$, the row payoffs in Hawk,Dove order are
$$A=\begin{pmatrix}(V-C)/2&V\\0&V/2\end{pmatrix}.$$
At hawk share $p$, the hawk-minus-dove payoff is $(V-Cp)/2$. The replicator equation is
$$\dot p=\tfrac12p(1-p)(V-Cp).$$
The unique ESS is $p^*=\min(V/C,1)$. This includes the weak, nonhyperbolic endpoint cases $V=0$ and $V=C$.`,
  idea:String.raw`For $0<V<C$, hawks gain when $p<V/C$ and lose when $p>V/C$, so selection points toward the interior share $V/C$. At that share both strategies tie against the population, but the negative payoff-difference slope $-C/2$ supplies the ESS secondary advantage. When $V>C$, a pure hawk population is a strict symmetric Nash equilibrium. At $V=C$, pure hawks still resist distinct mixtures through the secondary condition; at $V=0$, pure doves do so. Interior initial populations converge to the indicated share by the sign of this scalar field. A boundary initial population remains at its boundary because the absent strategy is not spontaneously introduced.`,
  scope:String.raw`An infinite well-mixed population with the stated contest accounting and continuous payoff-proportional selection. The costs and resource values are authored units, not measured animal fitness. No finite-population drift or mutation is included. The finite log-coordinate path is numerical and supplies no exponential-rate claim at a nonhyperbolic endpoint.`,
  caption:'Vary resource value, fighting cost, initial hawk share and time. The payoff matrix and fitness-difference line expose the incentive; the green marker gives the exact stable share. Compare that target with the numerical trajectory, including populations started on a boundary.',
  refs:['Ben Polak, Yale ECON159, lectures11–12 (read encounter/ESS sections)','Own Hawk–Dove payoff, ESS and scalar-field derivation'],
  credit:'Maynard Smith & Price, 1973 (contest-game attribution)',links:{source:'https://oyc.yale.edu/economics/econ-159/lecture-11'},viz:V.lesson2,
 },
 {
  num:'6.3',kind:'Theorem',name:'ESS and Nash equilibrium',deps:['game-6.1','game-2.3'],
  statement:String.raw`Every ESS in a finite symmetric game is a symmetric Nash equilibrium: $u(p,p)\ge u(q,p)$ for every mutant $q$. A strict symmetric Nash equilibrium is ESS. The converses fail: a symmetric Nash strategy can be neutral to invasion, and a mixed ESS need not be strict Nash. For two strategies write
$$g(p)=g_0+p g',$$
$$g_0=b-d,$$
$$g'=a-b-c+d.$$
for $A$'s payoff minus $B$'s payoff when the row matrix is $\bigl(\begin{smallmatrix}a&b\\c&d\end{smallmatrix}\bigr)$. A Nash candidate is ESS exactly when it is strict pure Nash or $g'<0$. This criterion includes weak endpoint equilibria.`,
  idea:String.raw`If some mutant has $u(q,p)>u(p,p)$, continuity makes it outperform the resident at all sufficiently small positive invasion fractions, contradicting ESS. Strict Nash gives a positive first comparison for every distinct mutant. For the two-strategy tie, write the first-strategy shares as $p,q$. The incumbent advantage against the mutant is
$$u(p,q)-u(q,q)=-g'(p-q)^2$$
whenever the Nash first comparison ties. Hence negative slope resists every distinct tied mutant, zero slope does not, and positive slope admits invasion. The complete Nash inventory consists of the admissible endpoints and the exact interior zero of $g$; if both endpoint gradients vanish, the entire unit interval is Nash and no strategy is ESS.`,
  scope:String.raw`Symmetric Nash means the same mixture is used in both player roles; an arbitrary asymmetric equilibrium is outside this theorem. Mixed strategies cannot be strict symmetric Nash against every distinct mixture in their support. Exact rational root classification is separate from a nearby decimal slider value. A boundary rest point of the replicator equation need not be Nash.`,
  caption:'Switch among anti-coordination, coordination, dominance and neutral rows. The full equilibrium inventory distinguishes Nash points from ESS points; the payoff-difference line and tie curvature explain the classification at the chosen candidate. Decimal approximations are marked and do not determine the exact inventory.',
  refs:['Ben Polak, Yale ECON159, ESS handout, pp.3–5 (pure-strategy Nash/ESS relation)','Own complete mixed two-strategy certificate'],
  links:{source:'https://oyc.yale.edu/sites/default/files/ess_handout_0_0.pdf'},viz:V.lesson3,
 },
 {
  num:'6.4',kind:'Model',name:'Replicator dynamics',deps:['game-6.1'],
  statement:String.raw`For a finite symmetric game with row matrix $A$, the continuous replicator equation is
$$\dot x_i=x_i\bigl((Ax)_i-x^TAx\bigr).$$
Each strategy's share grows at its payoff advantage over the population mean. The simplex is forward invariant: its shares remain nonnegative and sum to one. Every face is invariant as well, so a strategy absent initially remains absent. This is a deterministic infinite-population selection model, rather than a general description of deliberate learning or finite-population randomness.`,
  idea:String.raw`On the simplex, summing the right side gives $x^TAx-(\sum_i x_i)x^TAx=0$. For a positive component,
$$\frac{d}{dt}\log x_i=(Ax)_i-x^TAx,$$
so it stays positive at finite times; a zero component solves $\dot x_i=0$. Polynomial local existence and boundedness on the invariant compact simplex give a global forward solution. Subtracting two log equations removes the mean payoff. The explorer integrates these log ratios, retaining the initial support and avoiding an artificial positivity floor. Exact instantaneous payoffs, share velocities and their zero sum are evaluated separately from the numerical curve.`,
  scope:String.raw`Fixed finite payoff matrices, one well-mixed population and continuous time. Payoff differences, not absolute fitness positivity, drive this equation; adding the same opponent-dependent payoff to all own strategies leaves it unchanged. No mutation enters an absent strategy. Step-halving is a numerical consistency diagnostic, not a rigorous global error enclosure or a proof that a sampled path converges.`,
  caption:'Choose a cyclic, stable-mixing or coordination matrix, an initial A share and a B fraction of the remainder. The simplex field, full share traces and exact initial payoff ledger show the same mechanism. Conditional share controls preserve a valid simplex point even at the boundaries.',
  refs:['Own replicator equation, invariant-simplex and log-coordinate derivations','Written Lyapunov prerequisite: ode-5.9'],
  credit:'Taylor & Jonker, 1978 (replicator-equation attribution)',viz:V.lesson4,
 },
 {
  num:'6.5',kind:'Theorem',name:'ESS are asymptotically stable under the replicator dynamics',deps:['game-6.4','ode-5.9'],
  statement:String.raw`An ESS $p$ of a finite symmetric game is an asymptotically stable rest point of its replicator dynamics, relative to the strategy simplex. In a neighbourhood where $x_i>0$ whenever $p_i>0$, use
$$D(p\Vert x)=\sum_{i:p_i>0}p_i\log\frac{p_i}{x_i}.$$
This function is nonnegative, vanishes only at $x=p$, and along solutions satisfies
$$\dot D=x^TAx-p^TAx.$$
The ESS local-superiority condition makes this derivative strictly negative for nearby $x\ne p$.`,
  idea:String.raw`ESS is equivalent, in a finite symmetric game, to local superiority $p^TAx>x^TAx$ near $p$. To see the local step, set $x=p+tv$ with feasible unit direction $v$. Nash gives $-v^TAp\ge0$; on directions where it is zero, the ESS tie condition gives $-v^TAv>0$. These feasible unit directions form a compact set. Continuity supplies a uniform positive quadratic margin near the tie directions, while away from them the positive linear term dominates bounded quadratic terms for small $t$. Thus $p^TAx-x^TAx>0$ uniformly nearby. Differentiating $D$ with the replicator equation gives the displayed identity, and the strict Lyapunov criterion of ode-5.9 proves relative asymptotic stability. Zero coordinates of $p$ contribute no logarithm.`,
  scope:String.raw`The result concerns the finite symmetric replicator equation and stability relative to its simplex, including boundary ESS. A neighbourhood of a boundary ESS can be chosen positive on the ESS support. A boundary point missing a strategy used by an interior candidate has infinite relative entropy and lies outside the finite diagnostic domain. The converse is not asserted: failure of this particular certificate alone proves neither instability nor absence of other Lyapunov functions.`,
  caption:'Compare stable mixing, cyclic selection and coordination. The simplex shows motion around the exact uniform candidate; the entropy trace is shown only on its valid domain. The certificate panel separates the exact initial derivative and ESS classification from numerical trajectory diagnostics.',
  refs:['Own compact-direction local-superiority and relative-entropy proof','Written Lyapunov theorem: ode-5.9'],viz:V.lesson5,
 },
 {
  num:'6.6',kind:'Model',name:'Rock–Paper–Scissors cycles',deps:['game-6.4'],
  statement:String.raw`Consider the cyclic row matrix
$$A=\begin{pmatrix}0&-L&W\\W&0&-L\\-L&W&0\end{pmatrix}.$$
Here $W,L>0$.
The uniform mixture $p=(1/3,1/3,1/3)$ is Nash. It is ESS exactly when $W>L$. For an interior replicator solution,
$$\frac{d}{dt}\log(x_1x_2x_3)$$
$$=\frac{W-L}{2}\left(3\sum_i x_i^2-1\right).$$
Thus the product increases toward the centre when $W>L$, is conserved when $W=L$, and decreases away from the centre when $W<L$, except at the stationary centre itself.`,
  idea:String.raw`The sum of the three pure-strategy payoffs is $W-L$, while the mean is $(W-L)\sum_{i<j}x_ix_j$. Summing the log-share equations and using $\sum x_i=1$ gives the derivative identity. At the centre every strategy ties; on a zero-sum perturbation $v$, $v^TAv=-(W-L)\lVert v\rVert^2/2$, which supplies the ESS criterion. In the zero-sum case $W=L$, a nonmaximal positive product level is a closed curve in the simplex interior. The field has no rest point on it, so the nonstationary interior motion is periodic. The derivative identity establishes these distinctions; a finite numerical loop does not establish periodicity by itself.`,
  scope:String.raw`Three fixed authored strategies and the deterministic well-mixed replicator equation. The log-product requires all shares positive; boundary solutions stay on their face and are not covered by the periodic-interior statement. Outward drift does not mean the finite trajectory reaches a vertex. Cyclic ecological observations require additional empirical assumptions and are not fitted by this explorer.`,
  caption:'Change the win/loss asymmetry, initial composition and time horizon. Read the simplex and all three share traces together, then compare the log-product curve with its exact initial derivative. Equal win and loss magnitudes reveal the conserved quantity behind the cycles.',
  refs:['Own cyclic-matrix, ESS and log-product derivations'],viz:V.lesson6,
 },
 {
  num:'6.7',kind:'Theorem',name:'Fixation probabilities in finite populations',deps:['game-6.1','popgen-2.5'],
  statement:String.raw`For a population of $N\ge2$ individuals using two strategies, consider a frequency-dependent Moran birth–death process without mutation. At count $i$, payoffs exclude self-play:
$$\pi_A(i)=\frac{(i-1)a+(N-i)b}{N-1},$$
$$\pi_B(i)=\frac{ic+(N-i-1)d}{N-1}.$$
Fitness is $f_A=e^{\beta\pi_A}$ and $f_B=e^{\beta\pi_B}$ with $\beta\ge0$. Reproduction is proportional to fitness and replacement is uniform. Let $h_0=0$ and $h_j=\sum_{i=1}^j\beta(\pi_B(i)-\pi_A(i))$. The probability that strategy A fixes, starting at count $k$, is
$$\rho_k=\frac{\sum_{j=0}^{k-1}e^{h_j}}{\sum_{j=0}^{N-1}e^{h_j}}.$$
Empty numerator means $\rho_0=0$; $\rho_N=1$.`,
  idea:String.raw`An update can raise or lower the first-strategy count. Writing $Z=if_A+(N-i)f_B$, the upward probability is
$$T_i^+=\frac{if_A}{Z}\frac{N-i}{N};$$
the downward transition exchanges A and B. Their ratio is $T_i^-/T_i^+=f_B/f_A=e^{h_i-h_{i-1}}$. The harmonic equation for fixation makes adjacent differences satisfy $\rho_{i+1}-\rho_i=(T_i^-/T_i^+)(\rho_i-\rho_{i-1})$. Iteration followed by the two absorbing boundary conditions yields the formula. All fitnesses are positive at finite $\beta$, so each interior count can reach both boundaries and absorption occurs with probability one. At $\beta=0$, or when every interior payoff gap vanishes, all weights are equal and $\rho_k=k/N$, recovering neutral Moran drift.`,
  scope:String.raw`A fixed finite, well-mixed population; the stated exponential payoff-to-fitness map; reproduction followed by uniform replacement; no mutation and no self-interaction. Other update rules or fitness maps change the law. A strategy can be favoured relative to neutral fixation without fixing with certainty. Exact log weights and positive rational exponential enclosures preserve probabilities beyond physical decimal range; no Monte Carlo path is used as evidence.`,
  caption:'Choose a payoff family, population size, selection strength and initial count. The local birth–death view and complete fixation curve explain the probability from every count. Accumulated log weights expose frequency dependence, while the neutral diagonal and signed single-mutant comparison separate drift from selection.',
  refs:['Written neutral Moran process: popgen-2.5','Own frequency-dependent birth–death harmonic-equation derivation'],
  credit:'Moran, 1958 (finite birth–death process attribution)',viz:V.lesson7,
 },
 {
  num:'6.8',kind:'Theorem',name:'Stochastic stability selects the risk-dominant equilibrium',deps:['game-1.5','stoch-4.4'],
  statement:String.raw`Here the selection claim is scoped to a specific finite coordination protocol. In a symmetric two-strategy coordination game let $A=a-c>0$ and $D=d-b>0$ be the losses from leaving the first and second pure conventions. Each of $N\ge2$ players meets all other players equally, without self-play. At each update a uniformly chosen player resamples its action with logit probabilities proportional to $e^{\beta\,\text{payoff}}$. The unique stationary count law is
$$\mu_\beta(k)\propto {N\choose k}e^{\beta\Phi(k)},$$
where $\Phi(0)=0$ and
$$\Phi(k+1)-\Phi(k)=\Delta_k,$$
$$\Delta_k=\frac{(A+D)k-D(N-1)}{N-1}.$$
As $\beta\to\infty$, its support concentrates on the first convention if $A>D$, the second if $D>A$, and equally on both endpoints if $A=D$. This is risk-dominance selection for this protocol.`,
  idea:String.raw`A revising player facing $k$ first-strategy opponents has first-minus-second payoff equal to the potential increment. The ratio of adjacent up/down count transitions is therefore $(N-k)/(k+1)$ times the exponential of that increment. Binomial multiplicity and $e^{\beta\Phi}$ satisfy detailed balance on every adjacent link. At finite noise all links are positive, so the finite irreducible-chain theorem stoch-4.4 gives a unique stationary law. The potential is strictly convex in count, so its maxima occur at endpoints, and
$$\Phi(N)-\Phi(0)=\tfrac N2(A-D).$$
Only the higher endpoint survives the stationary zero-noise limit; tied endpoints have equal multiplicity one. At $\beta=0$ the count law is binomial, even though individual action profiles are uniform.`,
  scope:String.raw`Finite identical players, all-to-all matching, no self-play, asynchronous uniform-player logit revision, and a stationary-distribution limit taken before the zero-noise limit. This does not claim risk dominance under every mutation rule, spatial matching pattern, updating protocol, population limit or finite observation window. The count request is capped at the chosen population size.`,
  caption:'Vary both convention losses, population size and inverse noise. The local revision chain, full stationary count distribution and exact potential expose the distinction between finite noise and its limiting convention. At zero inverse noise, inspect the binomial count distribution rather than a uniform bar chart.',
  refs:['Written coordination/risk-dominance game: game-1.5','Written finite-chain stationary theorem: stoch-4.4','Own logit detailed-balance and endpoint-potential derivation'],viz:V.lesson8,
 },
 {
  num:'6.9',kind:'Theorem',name:'Potential games and best-response dynamics',deps:['game-1.3'],
  statement:String.raw`A finite game is an exact potential game if a function $\Phi$ on its nonempty finite pure-profile set satisfies
$$\Delta_i u_i=\Delta_i\Phi$$
for $s'=(s_i',s_{-i})$, where
$$\Delta_i u_i=u_i(s')-u_i(s),$$
$$\Delta_i\Phi=\Phi(s')-\Phi(s),$$
for every unilateral deviation. Every strict unilateral improvement raises $\Phi$. Consequently every sequence of strict improvements terminates at a pure Nash equilibrium. A global maximizer of $\Phi$ is Nash; a Nash point need only be a local maximum with respect to unilateral moves. A best-response update is covered when it strictly improves the mover's payoff.`,
  idea:String.raw`A strict improvement cannot revisit a profile because its potential is strictly greater than before. Finiteness therefore forces termination, and at the terminal profile no player has a profitable unilateral deviation, exactly the Nash condition. For the explorer, start with an authored $3\times3$ potential table and set $u_1=\Phi+\eta c$, $u_2=\Phi-\eta r$, where $r,c$ are action indices. Each extra term depends only on the opponent's action, so every unilateral payoff change equals the potential change. All nine profiles and all 36 unilateral deviations are enumerated, certifying the identity beyond the displayed path.`,
  scope:String.raw`A nonempty finite pure-action game with an exact potential. This argument does not assert termination of indifferent moves, simultaneous best responses, arbitrary learning dynamics or infinite action spaces. The terminal equilibrium can depend on the starting profile and move order, and need not maximize the potential globally or maximize any social-welfare objective.`,
  caption:'Choose a potential landscape, incentive coefficients, starting actions and move priority, then advance the strict-improvement path. The complete grid marks every Nash profile; the path and potential trace show the actual moves. Opponent-only offsets change payoff levels while preserving every incentive comparison.',
  refs:['Tim Roughgarden, CS364A Lecture16, §§1–2, Proposition2.1 (read through extracted line155)','Own finite table and exhaustive deviation certificate'],
  credit:'Monderer & Shapley, 1996 (potential-game attribution)',links:{source:'https://timroughgarden.org/f13/l/l16.pdf'},viz:V.lesson9,
 },
 {
  num:'6.10',kind:'Theorem',name:'Rosenthal: congestion games have pure equilibria',deps:['game-6.9'],
  statement:String.raw`In a finite unweighted congestion game, each player chooses one of finitely many nonempty allowed resource subsets. A resource $e$ used by $n_e$ players charges each user the finite cost $\ell_e(n_e)$, and a player's cost is the sum over its chosen resources. Rosenthal's cost potential is
$$\Phi(s)=\sum_e\sum_{j=1}^{n_e(s)}\ell_e(j).$$
A unilateral switch changes this potential by exactly the mover's own cost change. Thus a global potential minimum is a pure Nash equilibrium, and every sequence of strict cost-reducing switches terminates. The existence proof does not require monotone or affine resource costs.`,
  idea:String.raw`For an abandoned resource with old load $n$, both the mover's cost and the potential lose $\ell_e(n)$. For a newly entered resource, both gain $\ell_e(n+1)$. A resource retained in both routes has unchanged load and contributes zero change. Summing proves the identity; finite strict descent gives equilibrium by game-6.9 with the cost sign reversed. The explorer uses nonnegative affine resources and identical unit players on three directed routes. Anonymous route counts suffice because every player on the same route has the same available alternatives; every feasible count state and every switch is checked.`,
  scope:String.raw`Finite unweighted players and resource-separable costs; weighted congestion games require different statements. The displayed strict-switch path excludes indifferent updates. Rosenthal potential sums marginal user costs and is not the total travel cost $\sum_en_e\ell_e(n_e)$. A selfish switch can decrease the potential while increasing total cost. The later nonatomic 4/3 bound is not asserted for these atomic players.`,
  caption:'Allocate unit players to upper, lower and shortcut routes, then advance the improving switches. Network widths and labels show actual resource loads; the two cost traces reveal falling potential alongside possibly rising total travel cost. The count simplex marks every pure Nash state, rather than only the terminal state of one path.',
  refs:['Own resource-by-resource Rosenthal identity and finite descent proof','Tim Roughgarden, CS364A Lecture16, read §§1–2 (potential descent only)'],
  credit:'Rosenthal, 1973',viz:V.lesson10,
 },
 {
  num:'6.11',kind:'Paradox',name:'Braess’s paradox',deps:['game-6.10','algo-9.1'],
  statement:String.raw`Adding a road can worsen the Wardrop equilibrium of nonatomic selfish traffic. In the displayed directed network, two variable edges have latency equal to their own flow and two outer edges have latency one. Demand is $r\ge0$; an added directed middle shortcut has latency $k\ge0$. Without it each outer route carries $r/2$, with mean latency $1+r/2$ for positive demand. With it, equilibrium shortcut flow is
$$z_{\rm eq}=\operatorname{clip}(2(1-k)-r,0,r),$$
and each outer route carries $(r-z_{\rm eq})/2$. At $r=1,k=0$, mean latency rises from $3/2$ to $2$ after adding the free shortcut.`,
  idea:String.raw`If shortcut flow is $z$ and outer flows are equal, each outer route costs $(r+z)/2+1$ and the shortcut route costs $r+z+k$. Used routes must have minimum latency; solving equality and its endpoint inequalities gives the clipped equilibrium formula. If unequal positive outer flows occurred, the higher-flow outer route would cost more, contradicting Wardrop, so the symmetric reduction is valid. Total travel cost is
$$C(z)=\tfrac12(r+z)^2+r+(k-1)z.$$
Its convex global minimum is at $z_{\rm opt}=\operatorname{clip}(1-k-r,0,r)$. For fixed shortcut flow, unequal outer flows only increase the sum of squared variable-edge loads. Thus the optimum is global over all route allocations, not only a sampled symmetric plot.`,
  scope:String.raw`Infinitesimal traffic on this directed, single-commodity network with continuous nonnegative latencies; an individual deviates at fixed aggregate loads. This differs from an atomic player's post-switch comparison. The new shortcut can improve, worsen or leave equilibrium cost unchanged outside the canonical parameters. At zero demand total costs are zero, while means and their price ratio are undefined.`,
  caption:'Compare the actual equilibrium networks before and after adding the shortcut. Vary demand and shortcut latency, inspect every used/unused route comparison, and move a separate feasible shortcut-flow marker along the total-cost curve. Orange marks equilibrium and green marks the global optimum, including boundary regimes.',
  refs:['Tim Roughgarden, CS364A Lecture11, pp.1–9 (complete read; original pp.2,9 inspected)','Own demand/shortcut-cost family and analytic regime derivation'],
  credit:'Braess, 1968',links:{source:'https://timroughgarden.org/f13/l/l11.pdf'},viz:V.lesson11,
 },
 {
  num:'6.12',kind:'Theorem',name:'Price of anarchy for selfish routing is 4/3',deps:['game-6.11'],
  statement:String.raw`For nonatomic routing with fixed feasible demands and nonnegative affine resource latencies $\ell_e(x)=a_ex+b_e$, where $a_e,b_e\ge0$, every Wardrop equilibrium flow $f$ satisfies
$$C(f)\le\tfrac43C(f^*),$$
where $C(f)=\sum_ef_e\ell_e(f_e)$ and $f^*$ minimizes total cost. When the optimal cost is positive, the worst equilibrium-to-optimum ratio, called the price of anarchy, is therefore at most $4/3$. The bound is attained by one unit of demand split between parallel routes with latencies $x$ and $1$.`,
  idea:String.raw`The Wardrop variational inequality gives $C(f)\le\sum_ef_e^*\ell_e(f_e)$. Apply $xy\le y^2+x^2/4$ to each affine slope term and retain each constant term at the optimal flow:
$$C(f)\le C(f^*)+\tfrac14\sum_ea_ef_e^2$$
$$\le C(f^*)+\tfrac14C(f).$$
Rearranging proves the bound. In the parallel explorer, total cost at variable-route flow $x$ is $ax^2+(b-c)x+c$. For $a>0$, equilibrium uses $\operatorname{clip}((c-b)/a,0,1)$ while the optimum uses $\operatorname{clip}((c-b)/(2a),0,1)$. At $a=1,b=0,c=1$ these are 1 and 1/2, with costs 1 and 3/4. Zero slope is handled by direct route comparison, including a full tie interval.`,
  scope:String.raw`Nonatomic Wardrop routing, nonnegative affine latencies and the same demands/feasible routes for equilibrium and optimum. A ratio requires positive optimal cost; the cost inequality still covers the zero-cost case, without defining 0/0. This bound is not supplied for finite atomic users, arbitrary nonlinear latencies, negative costs or measured traffic without a validated model.`,
  caption:'Compare selfish, optimal and chosen feasible allocations on the Pigou network. The exact quadratic curve retains both analytic allocation markers and the chosen flow. The cost ledger displays the efficiency ratio and the nonnegative proof slack 4Copt−3Ceq, including equal-route continua and undefined zero-cost ratios.',
  refs:['Tim Roughgarden, CS364A Lecture11, complete9-page body; original p.9 confirms4/3','Own affine variational-inequality proof and parallel-family optimization'],
  credit:'Roughgarden & Tardos, 2002 (affine routing bound attribution)',links:{source:'https://timroughgarden.org/f13/l/l11.pdf'},viz:V.lesson12,
 },
 ],
};
