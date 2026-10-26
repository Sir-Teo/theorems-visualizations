import * as Viz from './ch07.viz.js';

const mit = 'https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/c40ecc0cc0dce0fbf2d229bc4027c43b_MIT15_401F08_lec10.pdf';
const oic = 'https://www.optionseducation.org/advancedconcepts/put-call-parity';

export default {
  collection: 'fin',
  chapter: 7,
  title: 'Options: payoffs and parity',
  summary: 'Options separate a contingent terminal payoff from its purchase price. Matching cash flows gives parity, price bounds and convexity restrictions before any stock-price model is chosen. Constructed terminal laws then make strike curvature, insurance floors and the debt–equity split inspectable without presenting an illustrative distribution as market evidence.',
  items: [
    {
      num: '7.1', kind: 'Definition', name: 'Calls and puts: payoffs and profits', deps: [],
      statement: String.raw`A **call** gives its holder the right to buy one unit of an underlying for strike $K\ge0$; a **put** gives the right to sell it for $K$. For European exercise at maturity and nonnegative terminal stock price $S_T$, their holder payoffs are
$$c_T=(S_T-K)^+,$$
$$p_T=(K-S_T)^+,$$
where $x^+=\max(x,0)$. A short position has the negative of the holder's payoff. The payoff excludes the premium paid to acquire the option.

If premium $\pi$ is financed from today to maturity and the price today of one terminal money unit is $B>0$, the long position's terminal-financed profit is payoff $-\pi/B$. The common nominal convention instead subtracts $\pi$ without financing it; the convention must be stated.`,
      idea: String.raw`The holder can decline an unfavorable trade, which clips the purchase or sale gain at zero. Writing the option reverses the signed cash flows, including receipt of the premium. Subtracting a premium moves a payoff curve vertically, so the strike and the break-even price usually differ. At zero premium, an entire price range can have zero profit; a put premium greater than its largest possible payoff can remove every nonnegative break-even price.`,
      scope: String.raw`One option unit, one nonnegative underlying price and one strike, with matched cash settlement and no fees. Premiums are authored inputs, not observed quotes or a complete arbitrage-free option surface. The financing convention uses a supplied positive discount factor for one fixed remaining period. A short call's loss is unbounded as the underlying rises, even though the displayed price interval is finite.`,
      caption: 'Choose a call or put and a long or short position. Move the strike, premium and terminal stock price; compare the option payoff with profit under the chosen funding convention, including the zero-profit ranges when the premium vanishes.',
      refs: ['Andrew W. Lo, MIT15.401 Fall2008, Lectures10–11 Options, slides3 and5–9; complete text and original pages3/8 pixels read', 'Own explicit nominal and terminal-financed premium conventions'],
      links: {'MIT option payoffs': mit}, tags: ['options', 'payoff'], viz: Viz.lesson1,
    },
    {
      num: '7.2', kind: 'Theorem', name: 'Put–call parity', deps: ['fin-7.1', 'fin-6.1'],
      statement: String.raw`For European call and put options on the same non-dividend-paying stock, with identical strike $K$, maturity and settlement, frictionless unrestricted trading and matching riskless borrowing/lending imply
$$C_0+BK=P_0+S_0.$$
Here $B>0$ is the price of one terminal money unit. With a constant continuously compounded rate $r$ and remaining time $T$, $B=e^{-rT}$.

A call plus cash $K$ at maturity and a put plus one share both pay $\max(S_T,K)$ in every terminal state. A nonzero difference between their current prices therefore yields a matching-payoff arbitrage.`,
      idea: String.raw`Apply actual fin-6.1 replication to the pointwise identity $(S_T-K)^++K=(K-S_T)^++S_T$. Sell the more expensive portfolio and buy the cheaper one: their terminal obligations cancel, leaving a positive initial receipt. The widget constructs parity-compatible comparison quotes and then adds an explicit offset to the call. Its retained gap is computed from the original factors, so an offset remains meaningful even when its displayed price rounds to the same number.`,
      scope: String.raw`The identity requires the same European exercise rights, underlying, strike, maturity and settlement, with no intervening dividends or trading restrictions. It allows a positive discount factor above or below one. The supplied time-value component is a parity construction, not a calibrated pricing law; a zero parity gap alone does not certify every other option-price restriction. No American-option equality or observed arbitrage opportunity is asserted.`,
      caption: 'Stack call plus strike cash beside put plus stock and move the terminal stock price: both totals remain identical. Change the call quote offset to expose the exact initial cash receipt and the direction of the matching-payoff trade.',
      refs: ['OCC Options Industry Council, Put/Call Parity; complete article body, final continuous-rate formulas and trading qualifications read', 'Actual written fin-6.1 replication and own statewise payoff proof'],
      links: {'OIC put/call parity': oic}, tags: ['options', 'replication'], viz: Viz.lesson2,
    },
    {
      num: '7.3', kind: 'Theorem', name: 'Arbitrage bounds on option prices', deps: ['fin-7.2'],
      statement: String.raw`For matching European options on a non-dividend-paying stock, with $S_T\ge0$, $K\ge0$, positive discount factor $B$, unrestricted frictionless positions and no arbitrage,
$$\max(S_0-BK,0)\le C_0\le S_0,$$
$$\max(BK-S_0,0)\le P_0\le BK.$$
These are necessary restrictions on option prices. Crossing a bound supplies a portfolio with a strictly positive initial receipt and nonnegative terminal payoff in every state.`,
      idea: String.raw`A stock dominates its call payoff, and strike cash dominates the put payoff, giving the upper bounds. A call plus strike cash dominates the stock, while a put plus stock dominates strike cash, giving the lower bounds; an option itself has nonnegative payoff. Each violated inequality specifies an actual trade. For example, an overpriced call can be sold against a purchased stock, leaving terminal payoff $\min(S_T,K)\ge0$. The put–call identity in fin-7.2 connects the corresponding lower restrictions.`,
      scope: String.raw`The stock pays no intervening dividends, all compared contracts share maturity and settlement, and the bond reliably supplies its promised cash. Short selling, lending and borrowing are unrestricted and fees are absent. The widget's quote can deliberately violate a bound; it is a teaching input. Passing these bounds neither identifies a unique option price nor verifies an entire market. At zero strike some bands collapse exactly.`,
      caption: 'Choose a call or put and quote it relative to either price bound. The marked band, signed portfolio inventory, initial receipt and complete statewise witness payoff update together; test exact boundaries and a zero strike.',
      refs: ['Own dominance and matching-cashflow proof using actual fin-7.2; independently checked signed portfolio holdings', 'OCC Options Industry Council, Put/Call Parity, unrestricted-trading and interest/dividend qualifications read'],
      links: {'Trading and parity qualifications': oic}, tags: ['options', 'arbitrage'], viz: Viz.lesson3,
    },
    {
      num: '7.4', kind: 'Theorem', name: 'Never exercise an American call early (no dividends)', deps: ['fin-7.3'],
      statement: String.raw`For an American call on a stock paying no dividends, with a nonnegative constant risk-free rate and frictionless unrestricted matching trades, an optimal policy can be chosen to **never exercise before maturity**. Its price then equals that of the matching European call.

Writing $B=e^{-rT}\le1$ for a remaining period, the European lower bound from fin-7.3 is
$$\begin{gathered}L=\max(S_0-BK,0),\\
L\ge(S_0-K)^+.\end{gathered}$$
If $S_0>K$, $K>0$ and $B<1$, postponing payment of the strike gives a strictly positive advantage $K(1-B)$. Zero-rate and other equality cases need not be strict.`,
      idea: String.raw`For an in-the-money call, retaining the right postpones payment of $K$ while preserving the upside, and its price is at least the stated lower bound. Exercising an out-of-the-money call produces zero, which a nonnegative option payoff weakly dominates. The same reasoning applies at each potential exercise date under the rate and dividend assumptions. A known imminent dividend can reward owning the stock sooner; a negative rate can reverse the financing benefit. Both require a separate comparison rather than an unconditional exercise rule.`,
      scope: String.raw`The theorem assumes no dividends throughout the option's life and nonnegative rates at the relevant dates; a nonnegative constant rate supplies that condition. The widget separately prices a deterministic one-period asset with an imminent cash dividend D: continuation is max(S0−D−BK,0), immediate exercise is max(S0−K,0), and their maximum is its American value. This chosen economy is not a general stochastic exercise boundary. The existing fin-7.10 Paper remains preserved; no original Merton article body is claimed read.`,
      caption: 'Compare exercising now with retaining the right. Move B across one and introduce an imminent cash dividend; the decision branches, financing ledger and current-value curves show the equality cases and the separately declared deterministic counterexamples.',
      refs: ['Own lower-bound postponement proof using actual fin-7.3, including strictness and equality conditions', 'OCC Options Industry Council, Put/Call Parity, interest/dividend and early-exercise discussion read'],
      links: {'OIC dividend and exercise discussion': oic}, tags: ['options', 'exercise'], viz: Viz.lesson4,
    },
    {
      num: '7.5', kind: 'Theorem', name: 'Option prices are convex in the strike', deps: ['fin-7.3', 'rca-3.1'],
      statement: String.raw`For European calls on the same underlying with fixed maturity and settlement, unrestricted frictionless trading and no arbitrage imply that $C(K)$ is **convex in strike**. For $K_1<K_2<K_3$, write $C_i=C(K_i)$ and $\lambda=(K_2-K_1)/(K_3-K_1)$. Then
$$C_2\le(1-\lambda)C_1+\lambda C_3.$$
The weighted wing calls minus the middle call form a pointwise nonnegative butterfly. A negative price for that portfolio gives a positive initial receipt with no negative terminal obligation.`,
      idea: String.raw`For each fixed terminal stock price, $K\mapsto(S_T-K)^+$ has slope −1 followed by slope0 and is convex in the sense of actual rca-3.1. Its chord therefore dominates its middle value state by state. Buy $1-\lambda$ low-strike calls and $\lambda$ high-strike calls, and sell one middle-strike call. Their weighted strikes equal $K_2$, making the butterfly vanish outside the wing interval and remain nonnegative inside. The dominance method of fin-7.3 forbids a negative cost.`,
      scope: String.raw`All compared calls share underlying, maturity, European exercise and settlement. The selected triplet tests a local convexity inequality; passing it is not a certificate for every quote in a strike curve. The reference curve uses an authored triangular Q-law and a supplied discount factor. The separate middle quote is deliberately editable. A zero-cost nonnegative payoff needs a possible strictly positive outcome to constitute an arbitrage; the widget's strict negative-cost receipt avoids that ambiguity.`,
      caption: 'Move the middle strike and the unequal wing spacings. Compare the consistent price curve with its wing-price chord, then shift the middle quote; inspect the weighted butterfly payoff and its exact signed cost.',
      refs: ['Actual written rca-3.1 convex-function and chord definition; own weighted-payoff dominance proof using fin-7.3', 'Own exact triangular-law integration supplies the explicitly constructed comparison curve'],
      tags: ['options', 'convexity'], viz: Viz.lesson5,
    },
    {
      num: '7.6', kind: 'Method', name: 'Option strategies: spreads, straddles, butterflies', deps: ['fin-7.1'],
      statement: String.raw`A static option strategy adds signed payoff pieces. For call units $u_i$ at strikes $K_i$ and put units $w_j$ at strikes $L_j$, define the two option-leg totals
$$X_T=\sum_i u_i(S_T-K_i)^+,$$
$$Y_T=\sum_j w_j(L_j-S_T)^+.$$
Including $a$ stock units gives the terminal portfolio payoff
$$H_T=aS_T+X_T+Y_T.$$
Its initial cost is the corresponding signed sum of stock and option prices. Terminal-financed profit subtracts that total cost divided by the common discount factor $B$. Spreads cap or reshape exposure between strikes; a straddle combines both tails; a butterfly isolates an interval.`,
      idea: String.raw`Apply the call and put definitions in fin-7.1 to each actual holding and add before rounding. A call spread subtracts the high-strike call's rising tail from the low-strike call; a straddle adds a call and put at one strike; a butterfly combines two long wings and a short middle. Every kink comes from a component strike, and the tail slopes follow from the signed units. The payoff shape alone omits the cash required to establish the position.`,
      scope: String.raw`One fixed maturity and settlement, no intervening stock dividends or fees, and unrestricted signed stock/option units. The three option slots and stock position can be edited independently. Preset premiums are authored cash costs, not market quotes or a claim that the whole inventory is consistently priced. Negative initial cost is not by itself an arbitrage if the portfolio can have a negative future payoff. A plotted finite price range is not a global loss bound.`,
      caption: 'Choose a recipe and load it, then select any of the three option legs to edit its right, strike, units and premium. Compare every signed component with the combined payoff, funding cost and profit; all hidden leg values remain part of the saved position.',
      refs: ['Andrew W. Lo, MIT15.401 Fall2008, Lectures10–11 Options, slides10–13 complete text and payoff diagrams read through extraction', 'Own original-factor payoff sums, funded costs and editable position inventory'],
      links: {'MIT option strategies': mit}, tags: ['options', 'strategies'], viz: Viz.lesson6,
    },
    {
      num: '7.7', kind: 'Theorem', name: 'Breeden–Litzenberger: densities from option prices', deps: ['fin-7.5', 'fin-6.7'],
      statement: String.raw`Assume European calls are priced by a specified risk-neutral terminal law $Q$, with finite first moment and common discount factor $B>0$:
$$C(K)=B\,\mathbb E_Q[(S_T-K)^+].$$
If the law has a continuous density $f_Q$ at $K$, differentiating the payoff integral gives
$$C'(K)=-B\,Q(S_T>K),$$
$$C''(K)=Bf_Q(K).$$
For a law with atoms the second derivative is a measure; a classical density cannot represent its atomic mass. A finite strike butterfly recovers a local average, with a point-density limit as its bandwidth tends to zero.`,
      idea: String.raw`Divide $C(K)$ by $B$ and write the resulting tail-payoff integral as
$$\int_K^\infty(x-K)f_Q(x)\,dx.$$
The boundary term vanishes in the first derivative, leaving minus the discounted survival probability; differentiating once more returns the density. Convexity from fin-7.5 is consistent with its nonnegativity. Summing the two wing call prices and subtracting twice the center price forms a butterfly. Dividing by $Bh^2$ averages the density with a triangular kernel over the actual window. Finite h can therefore differ from the density at the center.`,
      scope: String.raw`The continuous-law pricing representation is an explicit additional assumption; actual fin-6.7 proves a finite-state FTAP and is not silently promoted to a continuous-market theorem. The widget chooses a triangular Q density on [40,160], with an editable interior mode and exact integrated call values. It extends the payoff formula algebraically to real strike coordinates for centered windows. There is no fitted option surface, historical density estimate or original Breeden–Litzenberger paper-body reading claim. The diagnostic at h=0 is undefined.`,
      caption: 'Move the selected strike, the triangular law’s mode and the finite strike window. Compare the actual call-price curve, analytic Q density and normalized butterfly recovery; the shaded interval and signed recovery error explain why a finite window is an average.',
      refs: ['Own twice-differentiated payoff integral and exact triangular-density construction; actual fin-6.7 finite-state pricing viewpoint read', 'Breeden–Litzenberger1978 historical theorem attribution; original article body not acquired or read'],
      tags: ['options', 'state prices'], viz: Viz.lesson7,
    },
    {
      num: '7.8', kind: 'Concept', name: 'Protective puts and portfolio insurance', deps: ['fin-7.1'],
      statement: String.raw`Holding one stock and a matching put at strike $K$ gives the terminal payoff
$$H_T=S_T+(K-S_T)^+,$$
$$H_T=\max(S_T,K).$$
Thus its payoff has a floor $K$, while its terminal-financed profit floor is $K-(S_0+P_0)/B$ after paying and financing the stock and put. A payoff floor need not be a positive profit floor.

Under a continuous physical stock-price law, the protected payoff distribution has an atom at $K$ of probability $\Pr(S_T\le K)$ and retains the original continuous law above $K$.`,
      idea: String.raw`When the stock falls below the strike, the put fills exactly the gap to K; above the strike it expires and leaves the stock's upside. Apply fin-7.1 before subtracting the establishment cost. In the distribution, every original outcome at or below K maps to the same payoff, creating a genuine probability mass at the floor rather than simply erasing the lower tail. The price of insurance is determined by the pricing law, while its frequency of paying out depends on the physical law.`,
      scope: String.raw`One stock and one put with matched underlying, maturity and settlement, no intervening dividends or fees, and the stated premium-funding convention. The widget prices both claims under one constructed Q-law and integrates a separately chosen triangular physical law analytically. Continuous-bin masses and the separate floor atom sum to one. These are authored scenario distributions, not observations, a simulated historical sample or a real-world insurance recommendation.`,
      caption: 'Move the put’s floor and compare the stock, put and protected payoff. Change the physical distribution separately from the pricing law; the probability bars and explicit floor atom change without silently repricing the same Q-law insurance contract.',
      refs: ['Andrew W. Lo, MIT15.401 Fall2008, Lectures10–11 Options, slides4 and10–11 insurance/payoff text read', 'Own exact push-forward probability accounting, separate floor atom and terminal-funded cost derivation'],
      links: {'MIT protective-put explanation': mit}, tags: ['options', 'insurance'], viz: Viz.lesson8,
    },
    {
      num: '7.9', kind: 'Model', name: 'Equity as a call on the firm (Merton)', deps: ['fin-7.1', 'fin-6.8'],
      statement: String.raw`In a terminal-claim model with nonnegative firm asset value $V_T$, one class of promised maturity debt $F\ge0$ and limited liability, equity and debt pay
$$E_T=(V_T-F)^+,$$
$$D_T=\min(V_T,F),$$
$$D_T=F-(F-V_T)^+.$$
Equity has the payoff of a call on firm assets; debt has the payoff of riskless promised cash minus a put. Consistent pricing in the same market gives
$$E_0+D_0=V_0,$$
$$D_0=BF-P_V(F).$$
The promised payment F and the current market value of debt are different quantities.`,
      idea: String.raw`Debt receives the assets up to its promised amount, and equity receives the residual above that amount. Their sum is the entire asset payoff in every state, including default, as in actual fin-6.8. The option definitions from fin-7.1 identify the residual as a call and the unpaid debt amount as a put. Integrating all claims against the same positive state-price law preserves value additivity; changing physical default frequencies alone does not reprice claims under a fixed pricing law.`,
      scope: String.raw`This illustrates the Merton terminal-payoff mechanism using explicitly chosen triangular pricing and physical asset laws, one fixed remaining period, a common positive discount factor and no coupons, taxes, distress cost, early default or changed operating policy. It does not fit a continuous-time Merton model or observed firm data. Q and physical default probabilities are computed from their declared laws, not inferred from a real-world default frequency. With these continuous laws, the equality event V_T=F has zero probability. A zero-price claim has no defined percentage return.`,
      caption: 'Move the promised debt payment and the selected terminal asset value. Watch the asset waterfall split into debt, equity and any unpaid promise, then compare consistently priced claim values with the distinct Q and physical default-probability curves.',
      refs: ['Andrew W. Lo, MIT15.401 Fall2008, Lectures10–11 Options, slide14 corporate-liability identities; original page14 pixels read', 'Actual written fin-6.8 statewise debt/equity split; own consistent triangular-law valuation and separate physical probabilities'],
      links: {'MIT corporate-liability identities': mit}, tags: ['options', 'capital structure'], viz: Viz.lesson9,
    },
  ],
};
