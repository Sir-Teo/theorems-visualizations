import {lesson1,lesson2,lesson3,lesson4,lesson5,lesson6,lesson7,lesson8,lesson9,lesson10,lesson11,lesson12,lesson13,lesson14,lesson15,lesson16} from './ch12.viz.js';
export default {
 collection:'micro',chapter:12,title:'Externalities, public goods and the commons',
 summary:'An unpriced effect changes the comparison between private and social benefits. Explore welfare losses, corrective policies and bargaining, then distinguish shared goods, open access and network effects. The final models make information, uncertainty and the distribution of benefits explicit.',
 items:[
 {
  num:'12.1',kind:'Definition',name:'Externality',deps:['micro-3.8'],
  refs:['CORE Econ, The Economy 1.0, §12.1; own affine teaching economy'],
  statement:String.raw`An **externality** is a benefit or cost of an action that falls on another party and is not included in the decision-maker’s contractual rewards or liabilities. It creates a difference between a private marginal comparison and the corresponding social one. A change in someone else’s market price alone is not the unpriced resource effect modeled here.

If output q creates total damage D(q), its marginal external cost is D′(q), and
$$MSC(q)=MPC(q)+D'(q).$$
Total external damage is the integral of the marginal damage, not the marginal value itself.`,
  idea:String.raw`The owner compares the benefit and cost of the next unit (1.3), while an affected neighbour bears an additional cost. The competitive-surplus result 3.8 explicitly excludes such third-party effects. Here inverse demand is a−bq, private marginal cost is c+dq and marginal damage is e+fq, so total damage is eq+fq²/2. The river/fishery picture is schematic; the curves and ledger contain the specified economic quantities.`,
  scope:'One good, price-taking trade and transferable money as the welfare measure. The parameters describe a chosen economy, not measured pollution, fish populations or a particular industry. Output is constrained to 0–16 model units; all marginal costs and benefits have stated model-money units.',
  caption:'Change output and the damage coefficients. Compare the marginal gap with the accumulated damage; the downstream scene identifies who bears the external effect.',
  links:{'CORE · unpriced effects':'https://books.core-econ.org/the-economy-v1/book/text/12.html#121-market-failure-external-effects-of-pollution'},viz:lesson1
 },
 {
  num:'12.2',kind:'Concept',name:'Overproduction under a negative externality',deps:['micro-12.1','micro-3.9'],
  refs:['CORE Econ, The Economy 1.0, §§12.1–12.2; own constrained welfare derivation'],
  statement:String.raw`Let marginal benefit fall with output and let private and external marginal costs be nondecreasing. Private trade chooses qₚ where marginal benefit meets private cost, subject to capacity. Social net benefit instead maximizes
$$W(q)=B(q)-C(q)-D(q).$$
When the unpriced marginal damage is positive at an interior private outcome, qₚ exceeds the efficient quantity qₛ. The loss is W(qₛ)−W(qₚ); with affine marginal curves it is the area over the excess units. At a binding capacity or a zero-output corner, weak inequalities replace an interior crossing.`,
  idea:String.raw`Here B, C and D are the integrals of marginal benefit, private cost and external damage from zero to q. Differentiate W: its slope is marginal benefit minus full marginal cost. The private comparison omits marginal damage and therefore continues producing units whose value is below their social cost. In the chosen economy, qₚ is (a−c)/(b+d) and qₛ is (a−c−e)/(b+d+f), each constrained to the feasible interval. Moving an imposed quantity below qₛ also loses welfare, now by forgoing beneficial units.`,
  scope:'Decreasing affine marginal benefit, increasing private cost, nonnegative affine marginal damage and a 0–16 capacity constraint. Quasilinear welfare, efficient allocation among traders, no other distortions. The visual computes the full integral at corners; an interior triangle formula is not imposed there.',
  caption:'Move the actual quantity through the efficient point. The shaded region and welfare curve measure the same loss; the market marker shows the private outcome.',
  links:{'CORE · social and private output':'https://books.core-econ.org/the-economy-v1/book/text/12.html#121-market-failure-external-effects-of-pollution'},viz:lesson2
 },
 {
  num:'12.3',kind:'Principle',name:'Pigouvian tax',deps:['micro-12.2','micro-3.10'],
  refs:['CORE Econ, The Economy 1.0, §12.3, taxation; own constrained implementation'],
  statement:String.raw`A per-unit tax equal to marginal external damage at the efficient quantity implements that quantity in the stated competitive model:
$$t^*=D'(q_s).$$
At an interior outcome, the private condition MB=MPC+t then coincides with MB=MSC. With a zero-output or capacity corner, several tax rates may support the same quantity. Tax revenue is a transfer to the government; real damage, resource costs and gains from trade determine total welfare.`,
  idea:String.raw`A producer must cover the tax as well as its private marginal cost, so the tax shifts its relevant marginal-cost curve upward (3.10). The correct rate uses damage at qₛ, rather than damage at the unregulated quantity. A rate that induces too little production creates a loss on units that would still bring positive social net benefit. Capacity can leave a gap between marginal benefit and taxed private cost; it does not create an interior crossing.`,
  scope:'Known marginal damage, enforceable tax, competitive behaviour, quasilinear welfare, fixed production method and no administrative cost or other distortion. At zero trade there is no observed transaction price. This is a chosen one-good model, not a calibrated tax recommendation.',
  caption:'Adjust the tax around marginal damage at the optimum. Compare the shifted cost curve, the actual output and the welfare loss; keep revenue separate from real gains and costs.',
  links:{'CORE · corrective tax':'https://books.core-econ.org/the-economy-v1/book/text/12.html#123-external-effects-policies-and-income-distribution'},viz:lesson3
 },
 {
  num:'12.4',kind:'Concept',name:'Positive externalities and corrective subsidies',deps:['micro-12.1'],
  refs:['CORE Econ, The Economy 1.0, §12.2 positive-externality exercise and §12.3 subsidy definition; own constant-spillover model'],
  statement:String.raw`If an activity creates an unpriced marginal benefit e for others, its social marginal benefit is
$$MSB(q)=MPB(q)+e.$$
An interior private outcome underprovides the activity when e>0. A per-unit subsidy s=e makes the private marginal comparison match the social one. The subsidy payment is a transfer; the spillover benefit is an additional component of real net benefit. Capacity can make the efficient quantity unchanged over a range of subsidies.`,
  idea:String.raw`The decision-maker receives its private benefit but misses the neighbour’s gain. Adding e to the private marginal benefit moves the efficient crossing to a larger quantity. The subsidy raises the decision-maker’s marginal reward by that same amount. The bee/orchard scene identifies a possible kind of spillover, while the displayed constant e is an assumption rather than a biological estimate.`,
  scope:'Nonnegative constant marginal spillover, decreasing affine private benefit, increasing private cost, quasilinear welfare and fixed 0–16 capacity. No budget-financing distortion or administrative cost. The model does not describe herd immunity, observed agricultural yields or a measured subsidy response.',
  caption:'Change the spillover and subsidy independently. Compare private provision, social provision and the quantity induced by the policy.',
  links:{'CORE · external benefits':'https://books.core-econ.org/the-economy-v1/book/text/12.html#122-external-effects-and-bargaining'},viz:lesson4
 },
 {
  num:'12.5',kind:'Theorem',name:'Coase theorem',deps:['micro-12.2'],
  refs:['CORE Econ, The Economy 1.0, §12.2; complete own quasilinear bargaining argument'],
  statement:String.raw`Suppose rights are clearly assigned, enforceable and tradable; the parties know their payoffs, can make unrestricted money transfers without wealth effects, face no transaction cost and exhaust all mutually beneficial bargains. Bargaining then reaches an activity that maximizes their joint surplus. If this maximizer is unique, the activity is independent of who initially holds the right, although the payment and distribution of gains differ.

Here the owner’s return is Π(q), the other party’s damage is D(q), and the efficient activity maximizes Π(q)−D(q).`,
  idea:String.raw`A transfer adds to one payoff exactly what it subtracts from the other, so it cancels in joint surplus. Any increase in joint surplus can be shared to make both parties weakly better off, with a strict gain when there is a positive amount to share. The initial right determines each party’s fallback and hence its acceptable-payment interval. A fixed transaction cost consumes part of that gain and can close the interval.`,
  scope:'An authored two-party quasilinear model with known, strictly concave joint surplus and activity 0–16. Π(q)=(a−c)q−(b+d)q²/2 is a chosen activity-owner return, not competitive producer profit obtained by integrating inverse demand. Transaction costs are split equally. An exactly indifferent deal can be accepted or rejected explicitly. Limited funds, private information, enforcement failure and income effects are outside the theorem’s benchmark.',
  caption:'Assign the initial right, then change the transaction cost and proposed share of the feasible payment. Watch fallback activity, transfers and each party’s net gain.',
  links:{'CORE · bargaining and its limits':'https://books.core-econ.org/the-economy-v1/book/text/12.html#122-external-effects-and-bargaining'},viz:lesson5
 },
 {
  num:'12.6',kind:'Concept',name:'Efficient pollution abatement',deps:['micro-12.2','micro-1.3'],
  refs:['CORE Econ, The Economy 1.0, §20.5, two-firm abatement allocation; own constrained quadratic proof'],
  statement:String.raw`For a given total reduction R, minimize total abatement cost subject to
$$A_1+A_2=R,$$
$$0\le A_i\le E_i.$$
With increasing differentiable marginal costs, an interior least-cost allocation equalizes them at a common shadow price p. At a lower bound, marginal cost is at least p; at an upper bound, it is at most p. Equal marginal costs need not hold for a firm whose capacity binds. This solves how to meet a target, not whether the target is socially efficient.`,
  idea:String.raw`If one unconstrained firm can abate the next unit more cheaply, move a unit of the target to it and reduce total cost. For Cᵢ(Aᵢ)=kᵢAᵢ²/2 the unconstrained split gives firm 1 the fraction k₂/(k₁+k₂) of R. Constrain that answer to the interval permitted by both firms’ baseline emissions. Compare its cost with the feasible uniform-percentage standard; any difference is a resource saving.`,
  scope:'Two firms, positive quadratic abatement-cost slopes, fixed baseline emissions Eᵢ and 0≤R≤E₁+E₂. No market power, adjustment cost or unmeasured technological response. The shadow price is unique for an interior total target; at full abatement any sufficiently high price supports the boundary, and the visual reports the minimum.',
  caption:'Change the target, capacities and cost slopes. Move along the opposed marginal-cost curves and compare the least-cost allocation with a uniform percentage reduction.',
  links:{'CORE · dividing abatement across firms':'https://books.core-econ.org/the-economy-v1/book/text/20.html#205-cap-and-trade-environmental-policies'},viz:lesson6
 },
 {
  num:'12.7',kind:'Model',name:'Cap-and-trade',deps:['micro-12.6','micro-12.3'],
  refs:['CORE Econ, The Economy 1.0, §20.5; own permit and transfer accounting'],
  statement:String.raw`Issue a fixed total of permits equal to the emissions cap and require one permit for each unit emitted. Competitive trading can allocate the required abatement at least total cost. Each firm compares the permit price with its marginal abatement cost, subject to its feasible emissions range.

Under the stated cost and market assumptions, changing the initial allocation of permits changes net purchases and payments, while the final least-cost abatement split remains the same. A tax at a supporting permit price can induce the same allocation when costs are known.`,
  idea:String.raw`A high-cost abater buys permits from a firm able to abate more cheaply. Trade removes those gains until the supporting marginal conditions of 12.6 hold. For firm i, net permit purchases are final emissions minus its initial permits. These purchases sum to zero, so payments between firms cancel in the total; the real cost is the cost of abatement. Choosing the cap itself is a separate welfare decision.`,
  scope:'The two-firm quadratic economy, perfect monitoring, competitive costless trading, no liquidity/wealth effects, banking or market power. Initial permits can exceed one firm’s baseline, so some may be sold unused. A negative net financial cost can reflect permit-sale revenue, not negative resource use. Full abatement has a range of supporting prices; the displayed price is its minimum. The uncertain-cost comparison in 12.13 has different assumptions.',
  caption:'Change the cap and the initial permit split. Follow the final emissions, permit flows and signed payments while checking that total resource cost stays tied to abatement.',
  links:{'CORE · cap and trade':'https://books.core-econ.org/the-economy-v1/book/text/20.html#205-cap-and-trade-environmental-policies'},viz:lesson7
 },
 {
  num:'12.8',kind:'Definition',name:'Public goods and common resources',deps:[],
  refs:['CORE Econ, The Economy 1.0, §12.5; Samuelson 1954 p.387 for shared consumption'],
  statement:String.raw`**Rivalry** asks whether one person’s use reduces what remains available to another. **Excludability** asks whether access can be withheld. These are separate properties.

Here a pure public good is non-rival and non-excludable; a club good is non-rival but excludable. A common-pool resource is rival but difficult to exclude others from using, while a private good is both rival and excludable. The classification can depend on congestion, technology and institutions. Some authors, including CORE, use “public good” more broadly for non-rival goods.`,
  idea:String.raw`First test what happens when an additional user is admitted: does total physical consumption increase, or can the same provision serve both? Then test whether an entry rule can exclude that user. The two answers locate a cell of the grid. Sharing a broadcast or a public-good level does not multiply the physical stock, even though several people each experience it.`,
  scope:'A deliberately discrete admission test, with explicit rivalry and gate assumptions, a finite number of users and available entry passes. Each rival user requests at most one unit; shortages are shared evenly. A non-rival provision level is experienced in full by every admitted user. The diagram illustrates definitions, not universal labels for parks, roads, fisheries or particular technologies.',
  caption:'Change rivalry and entry rules, then add users or passes. Compare access, per-user availability and actual physical resource use.',
  links:{'CORE · classification and institutions':'https://books.core-econ.org/the-economy-v1/book/text/12.html#125-public-goods'},viz:lesson8
 },
 {
  num:'12.9',kind:'Principle',name:'Samuelson condition for public goods',deps:['micro-12.8','micro-4.11'],
  refs:['Samuelson 1954 pp.387–388, original read; own censored affine-benefit economy'],
  statement:String.raw`At an interior efficient level G of a shared public good, the sum of consumers’ marginal rates of substitution for the private numeraire equals the marginal resource cost:
$$\operatorname{MRS}_A+\operatorname{MRS}_B=c.$$
With quasilinear benefits and convex costs, this is the vertical sum of marginal benefits. At G=0 the sum may be below cost. Individual marginal benefits must respect satiation rather than extend to negative values.`,
  idea:String.raw`The same additional unit is available to both consumers. Its total benefit is therefore the sum of their marginal benefits at that same G. In this economy, $MB_i(G)=\max\{0,a_i-b_iG\}$ with $a_i,b_i,c>0$, so the efficient level solves the crossing of the piecewise-linear vertical sum with c, or is zero when the initial sum does not cover cost. For a private good at price p, instead add the individual quantities $q_i(p)=\max\{0,(a_i-p)/b_i\}$. These are different aggregation operations.`,
  scope:'Two consumers, a divisible shared good, constant positive resource cost, quasilinear benefits and no income effects. The active-set calculation includes one-beneficiary and zero-provision corners. The private-good comparison changes the quantity axis and allocates separate units. The general MRS statement requires the efficient allocation and regularity assumptions discussed in 12.16.',
  caption:'Switch between a shared public good and separate private units. Watch the curves combine vertically or horizontally, then vary the beneficiaries and marginal cost.',
  links:{'Samuelson · original paper':'https://publics22.classes.ryansafner.com/readings/Samuelson-1954.pdf'},viz:lesson9
 },
 {
  num:'12.10',kind:'Phenomenon',name:'Free riding',deps:['micro-12.9'],
  refs:['CORE Econ, The Economy 1.0, §4.6; own one-shot quadratic contribution game'],
  statement:String.raw`A non-excludable benefit can be enjoyed without contributing to its provision. In the chosen one-shot game, n is a positive integer and a,b,c>0. The n identical players choose nonnegative contributions gᵢ, total provision is G=Σgᵢ, and each receives $B(G)-cg_i$, with $B(G)=aG-bG^2/2$ up to G=a/b and constant benefit thereafter. The Nash total and efficient total are
$$G_N=\max\{0,(a-c)/b\},$$
$$G_S=\max\{0,(na-c)/(nb)\}.$$
For n>1 and a positive efficient level, voluntary provision can fall short.`,
  idea:String.raw`A contributor pays the full marginal cost c but receives only their own marginal benefit a−bG. The planner counts n times that benefit. A player’s best response to others’ total H is $\max\{0,G_N-H\}$. Thus any nonnegative vector summing to a positive $G_N$ is Nash; the symmetric split shown here is one representative, not a unique contribution pattern. When $G_N$=0, all contributions are zero.`,
  scope:'An authored complete-information, one-shot, non-cooperative game with identical quasilinear preferences and no altruism, repeated interaction or enforcement. All selected totals stay within satiation. The prediction is conditional on this game; CORE’s institutional and repeated-interaction discussion gives reasons actual cooperation can differ.',
  caption:'Add players and compare individual with collective marginal benefits. The contribution tiles show the chosen symmetric representative; the provision and welfare gaps are calculated.',
  links:{'CORE · cooperation and public goods':'https://books.core-econ.org/the-economy-v1/book/text/04.html#46-public-goods-free-riding-and-repeated-interaction'},viz:lesson10
 },
 {
  num:'12.11',kind:'Phenomenon',name:'Tragedy of the commons',deps:['micro-12.8','micro-12.1'],
  refs:['CORE Econ, The Economy 1.0, §4.6; independently derived open-access effort model'],
  statement:String.raw`Unrestricted access to a rival resource can dissipate its rent. Let continuous grazing effort N yield $Y(N)=AN-BN^2/2$ at unit effort cost c, with A>c and B>0. A sole owner chooses
$$N_S=(A-c)/B.$$
Atomistic free entry continues until average product equals c, giving
$$N_{OA}=2(A-c)/B.$$
At open access, aggregate net rent is zero.`,
  idea:String.raw`An entrant compares their average product A−BN/2 with their cost. Their entry also reduces the returns to existing effort, a congestion effect they do not pay for. A resource owner instead compares marginal product A−BN with cost. The rent curve $R(N)=(A-c)N-BN^2/2$ peaks at $N_S$ and returns to zero at $N_{OA}$.`,
  scope:'A static, continuous, atomistic effort model with a chosen concave production function. Pasture marks are schematic effort units, not a discrete-herd equilibrium or a forecast of ecological stocks. Common property governed by rules is different from unrestricted open access; institutions can prevent rent dissipation. The title names a conditional mechanism, not an inevitable fate of shared resources.',
  caption:'Move from the owner’s effort to unrestricted entry. Compare average and marginal product, then follow the corresponding point on the actual rent curve.',
  links:{'CORE · common resources and institutions':'https://books.core-econ.org/the-economy-v1/book/text/04.html#46-public-goods-free-riding-and-repeated-interaction'},viz:lesson11
 },
 {
  num:'12.12',kind:'Concept',name:'Network externalities',deps:['micro-12.1','micro-2.7'],
  refs:['CORE Econ, The Economy 1.0, §21.4 demand-side network effects; own adoption dynamics'],
  statement:String.raw`A network externality occurs when the value of joining depends on how many others participate. The chosen fulfilled-expectations inverse demand is $p=vx(1-x)$ for adoption share x∈[0,1]. Take v>0, κ>0 and p≥0. Under the explicitly chosen adjustment rule
$$\dot x=\kappa x[vx(1-x)-p],$$
positive fixed points exist when 4p≤v. With 0<4p<v, the lower fixed point is an unstable critical mass and the upper one is stable; zero is also stable.`,
  idea:String.raw`The factor vx represents a larger network’s usefulness, while 1−x reflects the marginal entrant’s lower willingness to pay. Subtract the price and inspect the sign of the displayed vector field. Below the lower crossing, adoption falls; between crossings it rises; above the upper crossing it falls. At 4p=v the positive double root attracts from above and repels from below. At p=0, zero is stationary but repels positive nearby starts on the admissible side.`,
  scope:'An authored homogeneous-mixing schematic and a specified continuous adjustment law, not an estimated diffusion process or a derivation from individual optimization. Time and speed have chosen units. The trajectory is a numerical solution of this ODE; fixed-point signs are classified separately. Root positions may be approximate. A positive quantity below display range is reported with its logarithm rather than called exactly zero.',
  caption:'Change network strength, price and the initial share. Read the critical mass from the demand/price crossing and follow the computed adoption history and phase arrows.',
  links:{'CORE · network effects':'https://books.core-econ.org/the-economy-v1/book/text/21.html#214-economies-of-scale-and-winner-take-all-competition'},viz:lesson12
 },
 {
  num:'12.13',kind:'Proposition',name:'Prices vs quantities (Weitzman)',deps:['micro-12.3','micro-12.7'],
  refs:['Weitzman 1974 bibliography identified; original body unavailable after timeout','Hilary Hoynes, PG-Externalities, Winter 2012, slides 23–27 read; figures 26–27 viewed','Own complete linear-quadratic derivation'],
  statement:String.raw`Cost uncertainty can make a fixed emissions price and a fixed cap differ in welfare. In this interior example, marginal abatement cost is a+bA+u, marginal benefit is h−dA, b>0 and d≥0. A mean-zero shock u has variance σ². A fixed quantity and a price set for the mean-cost optimum have expected-loss difference
$$E[L_P-L_Q]=\frac{\sigma^2(d-b)}{2b^2}.$$
Prices have lower expected loss when d<b; quantities when d>b.`,
  idea:String.raw`Set A₀=5, a=20, h=a+(b+d)A₀ and price τ=a+bA₀. A cap fixes abatement at $A_Q=A_0$, while the price induces $A_P=A_0-u/b$. Full information gives A*=A₀−u/(b+d). Integrating the marginal-benefit/cost gap gives $L_Q=u^2/[2(b+d)]$ and $L_P=u^2d^2/[2b^2(b+d)]$. Take expectations and subtract. The chosen uniform shock support ±0.8ρbA₀ keeps all outcomes strictly inside capacity 10.`,
  scope:'Own static interior linear-quadratic case with uncertain cost intercept only, risk-neutral expected surplus, known marginal benefits and no correlated benefit shocks. It does not reproduce the full general Weitzman proof. The original author PDF timed out and its body was not read; the distinct Hoynes teaching figures and the displayed derivation support this example. Selected-shock loss and expected loss are separate quantities.',
  caption:'Choose a cost shock and compare its two actual loss regions. Then tilt marginal benefits and compare expected losses over the declared uniform shock distribution.',
  links:{'Hoynes · distinct teaching slides':'https://gspp.berkeley.edu/archived/files/courses/notes/Lec3-Externality.pdf','Weitzman · bibliographic record':'https://doi.org/10.2307/2296698'},viz:lesson13
 },
 {
  num:'12.14',kind:'Model',name:'Lindahl equilibrium',deps:['micro-12.9'],
  refs:['Samuelson 1954 pp.387–389 for public-good efficiency/information problem; own personalized-price construction'],
  statement:String.raw`Lindahl prices are personalized per-unit charges for the same public good. An equilibrium requires every consumer to demand the same provision G at their own price pᵢ, with Σpᵢ=c covering its marginal cost. For the two quadratic benefits here, interior agreement gives
$$G^*=(a_A+a_B-c)/2,$$
$$p_A^*=a_A-G^*,$$
$$p_B^*=c-p_A^*.$$
The prices sum to cost, and marginal benefits sum to cost at positive provision.`,
  idea:String.raw`At a proposed share λ, A pays λc and B pays (1−λ)c. Their demands are max{0,aᵢ−pᵢ}. Adjust λ until the demands coincide. A separate information experiment recomputes this rule after A reports a lower intercept. The diagram evaluates true benefit minus the resulting personalized bill; understatement can help or hurt under this particular rule, especially near zero provision.`,
  scope:'Two consumers, divisible shared provision, quasilinear concave benefits, constant positive cost and the stated parameter bounds. Truthful equilibrium is an efficiency construction, not a claim that reports will be truthful. The reporting experiment is an authored rule, not a general strategy-proof mechanism or a claim that understatement always helps. At the zero corner supporting price inequalities replace interior equalities.',
  caption:'Adjust A’s price share until the two desired quantities agree. Then lower A’s report and inspect provision, payments and actual true payoffs.',
  links:{'Samuelson · efficiency and information':'https://publics22.classes.ryansafner.com/readings/Samuelson-1954.pdf'},viz:lesson14
 },
 {
  num:'12.15',kind:'Paper',name:'The Problem of Social Cost',deps:['micro-12.2','micro-12.3'],
  paper:{authors:'R. H. Coase',year:1960,title:'The Problem of Social Cost',venue:'Journal of Law and Economics 3: 1–44',doi:'10.1086/466560'},introduces:['micro-12.5'],
  refs:['Official Chicago Unbound bibliographic record read; full text explicitly unavailable','CORE Econ §12.2 bargaining account read; own finite cattle worksheet'],
  statement:String.raw`Coase’s paper frames harmful effects as a problem of comparing feasible arrangements and their joint costs. The official bibliographic record identifies this 1960 article; its full text is unavailable there, so this lesson does not claim to reproduce a verified original table or argument. The accompanying worksheet is an authored finite economy illustrating the bargaining proposition in 12.5.`,
  idea:String.raw`For herds n∈{0,1,2,3,4}, choose private return $\Pi(n)=mn-kn(n-1)/2$ and crop damage $D(n)=dn(n+1)/2$. Enumerate every private and joint-surplus maximizer. At d=1, the sequence 1,3,6,10 follows from this chosen damage function; it has not been checked against the original paper. Legal rights select a fallback. A bargain is accepted only when the joint improvement covers its fixed transaction cost, with the stated tie rule. The worksheet retains all maximizing herds while choosing the smallest as its represented target.`,
  scope:'Bibliography verified from the official landing page; original article body and historical cattle table not read. The five-row worksheet, profit increments, transfers and transaction-cost rule are authored assumptions, not empirical observations or a verified replication. Transferable numeraire, known returns, no wealth/credit effects and costless bargaining apart from the displayed fixed cost. With ties, rights need not select a unique physical efficient herd.',
  caption:'Inspect all five herd sizes and every maximizing tie. Change rights and transaction costs, then compare the fallback, represented efficient target and realized agreement.',
  links:{'Coase · official bibliographic record':'https://chicagounbound.uchicago.edu/journal_articles/3178/','CORE · distinct bargaining account':'https://books.core-econ.org/the-economy-v1/book/text/12.html#122-external-effects-and-bargaining'},viz:lesson15
 },
 {
  num:'12.16',kind:'Paper',name:'The Pure Theory of Public Expenditure',deps:['micro-12.8','micro-4.11','micro-9.2'],
  paper:{authors:'Paul A. Samuelson',year:1954,title:'The Pure Theory of Public Expenditure',venue:'Review of Economics and Statistics 36 (4): 387–389',doi:'10.2307/1925895'},introduces:['micro-12.9'],
  refs:['Samuelson 1954, complete original body pp.387–389 read from page images; own log-utility resource economy'],
  statement:String.raw`Samuelson derives efficiency conditions for goods jointly consumed by everyone: at an interior optimum, the sum of individual marginal rates of substitution equals the marginal rate of transformation. His paper also distinguishes efficient allocations from a social choice among them and identifies incentives to understate valuations as an information problem. These are conditional welfare statements, not a universal decentralized funding rule.`,
  idea:String.raw`The displayed special case has $u_i=\log x_i+a_i\log(1+G)$ and resource constraint $x_A+x_B+cG=R$. Here $a_i,c,R>0$, private consumption satisfies $x_i>0$, and $G\ge0$. For weight λ∈(0,1), let $A=\lambda a_A+(1-\lambda)a_B$. Maximizing the weighted utility sum gives
$$G^*=\max\{0,g_0\},$$
$$g_0=\frac{AR-c}{c(A+1)},$$
with $x_A=\lambda(R-cG^*)$ and $x_B=(1-\lambda)(R-cG^*)$. Compute $\operatorname{MRS}_i=a_i x_i/(1+G)$ to verify the sum condition, or its zero-provision inequality. Lower A’s reported taste while either holding allocation fixed or replanning from reports: the two experiments distinguish an informational shortfall from an actual allocation change.`,
  scope:'The full original three-page body was read; its smoothness, preference/production regularity and interior conditions matter. The visualization is a supplied concave log-utility economy, not a reproduction of a figure from the paper. The curve shows only the displayed finite interior weight interval. A weight selects an efficient distribution under truthful information; it is not an objective fairness score. Reporting experiments do not specify a strategy-proof tax mechanism.',
  caption:'Move the distribution weight along the efficient utility curve. Track private resources, shared provision and the MRS sum, then compare holding the allocation with replanning from a lower report.',
  links:{'Samuelson · complete original paper':'https://publics22.classes.ryansafner.com/readings/Samuelson-1954.pdf'},viz:lesson16
 }
]};
