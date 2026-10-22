import * as U from './ch05.ui.shared.js';
export default {collection:'phil',chapter:5,title:'Decision theory and its puzzles',items:[
{
num:"5.8",
kind:"Concept",
name:"Risk aversion from concave utility (Bernoulli)",
deps:["behav-1.1", "rca-3.3"],
refs:["SEP, The St Petersburg Paradox, introduction and §§1–2; supplied convergent-series derivation"],
statement:String.raw`Concave utility can distinguish the expectation of utility from utility of an expectation. For an integrable finite lottery, Jensen gives $E[u(X)]\le u(E[X])$. The St Petersburg game in5.7 has infinite expected payout, so that finite-expectation inequality cannot itself justify substituting an infinite mean into a certainty equivalent. For its payout $X=2^{K-1}$, logarithmic expected final wealth can instead be evaluated directly.`,
idea:String.raw`Let initial wealth W, fee f, and a=W−f≥0. Since P(K=k)=2⁻ᵏ and E(K−1)=1,
Define $c_k=2^{-k}\log(1+a2^{1-k})$. Then
$$E\log(a+X)=\log2+\sum_{k=1}^{\infty}c_k.$$
After K terms the nonnegative tail is at most $(2a/3)4^{-K}$, using log(1+z)≤z and a geometric sum. This proves convergence for this game. A capped payout min(X,2ᴺ⁻¹) has mean(N+1)/2; a game paying zero after N has meanN/2. Neither finite sequence is the definition of the infinite game. The numerical fee solves equality with logW; rounding error is additional to the analytic tail bound.`,
caption:String.raw`Compare the two finite mean curves and the infinite-game expected log utility. Vary wealth, entry fee and cap convention; the numerical certainty-equivalent fee is an estimate for this particular log-wealth model.`,
scope:String.raw`Payout X=2^(K−1), chosen initial wealth W from 2 to 100, and fee from 0 to W. Final wealth is positive in the infinite game. Zero-after-N with zero remaining wealth has negative-infinite expected log utility. Concavity does not resolve every faster-growing unbounded-utility variant.`,
viz(v){U.risk(v);}
},
{
num:"5.9",
kind:"Principle",
name:"The sure-thing principle and the Allais choices",
deps:["phil-5.6", "behav-1.11"],
refs:["SEP, Decision Theory, substantive revision20Aug2025, §§2.3 and3.1"],
statement:String.raw`Savage's **sure-thing principle** says an act comparison can be independent of a common consequence on an event, when the acts agree there and the relevant eventwise comparisons are preserved. vNM **mixture independence** is a different formulation about mixtures of lotteries. The standard Allais choices expose EU inconsistency under an explicit common-ticket coupling; the two axioms should not be identified in full generality.`,
idea:String.raw`Measure payoffs in units of one million old French francs, as in behav1.11. Then A=100 sure; B=500 on10 tickets,100 on89,0 on1; C=100 on11,0 on89; D=500 on10,0 on90. Under the common100-ticket coupling, changing the shared89-ticket consequence from100 to0 changes A,B into C,D. With u(0)=0,
Write $a=u(100)$, $b=u(500)$, and $\Delta=.11a-.10b$. Then
$$\begin{gathered}EU(A)-EU(B)=\Delta,\\EU(C)-EU(D)=\Delta.\end{gathered}$$
Thus opposite strict EU rankings are impossible for one utility function. This algebra does not assert that all observed choices satisfy EU or that eventwise sure-thing and mixture independence have identical domains.`,
caption:String.raw`Move utilities and inspect both pair differences. The same exact integer-ticket expression governs them; no historical response frequencies are invented.`,
scope:String.raw`One payoff unit represents one million old French francs in the prerequisite; the displayed100/500 values use that normalization. Positive utility increments are adjustable; no new experiment or unconditional psychological law is claimed.`,
viz(v){U.allais(v);}
},
{
num:"5.10",
kind:"Concept",
name:"Ambiguity and imprecise credences (Ellsberg)",
deps:["phil-5.6", "behav-1.13"],
refs:["SEP, Decision Theory, substantive revision20Aug2025, §§2.3 and3.1"],
statement:String.raw`An **imprecise credence** model represents uncertainty by a set of priors rather than one. For the Ellsberg urn, red has probability1/3 and black probability $b\in[L,U]\subseteq[0,2/3]$. One possible decision rule maximizes the worst expected utility over that set; the rule and the set are additional premises.`,
idea:String.raw`For indicator utilities, the four winning probabilities are red1/3, blackb, red-or-yellow1−b, and black-or-yellow2/3. Linear functions attain minima at interval endpoints, so the four worst cases are(1/3,L,1−U,2/3). If L<1/3<U, this maxmin rule favors red over black and black-or-yellow over red-or-yellow. No single prior produces both strict comparisons. A degenerate interval returns ordinary single-prior expectations; a multiple-prior model is not an act-dependent update masquerading as one prior.`,
caption:String.raw`Vary the credal interval. Four probability curves and their actual endpoint minima show what the adopted robust rule recommends.`,
scope:String.raw`One90-ball-style probability model, not new data. Only probability sets and indicator utilities are considered; this is not a general representation theorem for ambiguity preferences.`,
viz(v){U.ambiguity(v);}
},
{
num:"5.11",
kind:"Paradox",
name:"Pascal’s wager",
deps:["phil-5.6"],
refs:["SEP, Pascal’s Wager, §§3–5.1"],
statement:String.raw`Pascal's wager raises the consequences of combining finite probabilities with infinite utilities. In a model with only positive-infinite reward on a positive-probability state and finite outcomes elsewhere, expected utility is positive infinity. That conclusion depends on the utility and probability assumptions and does not uniquely solve versions with competing infinite rewards.`,
idea:String.raw`Define extended expectation by positive and negative parts. A zero-probability state contributes nothing even if its assigned utility is infinite. Positive probability of both +∞ and−∞ leaves expectation undefined; subtracting infinities is not a tie-breaking calculation. Two acts can each have +∞ expectation, and a positive mixture may retain it. A finite cap gives a different ordinary finite model, not a proof that a particular religious probability or practical choice is justified.`,
caption:String.raw`Switch the explicitly declared utility model between infinite and finite caps; add rival-doctrine probability. The diagram reports finite, infinite or undefined expectations symbolically.`,
scope:String.raw`Authored utilities/credences, not theological evidence or advice. First doctrine rewards wagering; rival doctrine penalizes it and rewards declining. The rival probability is a fraction of the remaining mass, so the law stays normalized even for tiny inputs.`,
viz(v){U.wager(v);}
},
{
num:"5.12",
kind:"Paradox",
name:"Pascal’s mugging",
deps:["phil-5.11"],
refs:["SEP, Pascal’s Wager, infinite-utility and mixed-strategy limitations; authored bounded-utility comparison"],
statement:String.raw`**Pascal's mugging** asks how a tiny asserted probability of an enormous payoff should enter decision making. Multiplying a chosen probability by a chosen reward is arithmetic, not evidence that the probability is credible. Bounded utility can limit that term, but changes the utility model rather than calibrating the claimant.`,
idea:String.raw`In the linear-payoff model compare log(p)+log(R) with log(cost), treating p=0 separately. This avoids overflowing R before the comparison. For a separate utility scale u(R)=1−exp(−R) bounded by1, the gain is at most p. A large reward can overwhelm a finite cost in the first model while a bounded scale limits the second. Neither calculation proves a universal rule for all tiny probabilities or settles how testimony should change credence.`,
caption:String.raw`Vary stated probability, log reward and cost. The readout keeps the linear-reward comparison in the log domain while bars show the distinct bounded-utility model.`,
scope:String.raw`All probabilities/rewards are fictional premises. Infinite output-range values are labelled instead of treated as finite data; positive terms below range are disclosed. No claims about actual threats or a recommended payment.`,
viz(v){U.mugging(v);}
}
]};
