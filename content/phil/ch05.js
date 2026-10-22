import * as U from './ch05.ui.shared.js';
export default {collection:'phil',chapter:5,title:'Decision theory and its puzzles',items:[
{
num:"5.1",
kind:"Concept",
name:"Decision matrices: acts, states and outcomes",
deps:[],
refs:["Gallow, Probability & Rational Choice, Spring2026 USC author notes, printed96–103", "SEP, Decision Theory, substantive revision20Aug2025, §§2.3 and3.1"],
statement:String.raw`A finite **decision matrix** lists acts as rows, mutually exclusive exhaustive states as columns, and outcomes for each act–state pair. A utility matrix $u_{ij}$ adds an explicitly chosen numerical evaluation of those outcomes. The matrix alone contains neither state probabilities nor a rule for comparing rows.`,
idea:String.raw`An act specifies an outcome in every state, including states that do not actually occur. Keeping the same state descriptions across rows is essential for statewise comparison. Numerical payoffs may already be utilities or may need a separately stated utility transformation; dollars and utility are not interchangeable by definition. A decision rule supplies the additional aggregation or ordering.`,
caption:String.raw`Edit an actual bounded payoff matrix. The table preserves its row/state shape; a separate first-state comparison emphasizes that a column comparison is not yet a complete decision rule.`,
scope:String.raw`Authored finite utilities,1–6 acts and1–6 states, entries between−1000 and1000. Labels A–F and S1–S6 carry no empirical interpretation. Invalid or ragged data produces an error, not a partial decision.`,
viz(v){U.decisions(v,1);}
},
{
num:"5.2",
kind:"Principle",
name:"Dominance",
deps:["phil-5.1"],
refs:["Gallow, Probability & Rational Choice, Spring2026 USC author notes, printed96–103"],
statement:String.raw`Act $a$ **strictly dominates** $b$ if $u(a,s)>u(b,s)$ in every state. It **weakly dominates** $b$ if it is no worse in every state and better in at least one. For a common prior, dominance implies weak expected-utility preference; the preference is strict when an improving state has positive probability.`,
idea:String.raw`Subtract the two state payoffs and sum with the same nonnegative probabilities. Each term is nonnegative; a positive term with positive weight makes the sum positive. Weak dominance with all improvement confined to zero-probability states can give an EU tie. Changing to act-dependent conditional beliefs changes the comparison and does not refute this common-prior calculation. Whether domination settles rational choice in every philosophical setting is a further normative question.`,
caption:String.raw`Edit rows and inspect the exact strict and weak dominance relations. Bars count how many alternatives each act weakly dominates; they are not a new utility scale.`,
scope:String.raw`Finite matrix only. All equality and dominance tests use the supplied numeric entries; no tolerance turns a near tie into dominance. The chart does not claim unrestricted dominance solves every decision problem.`,
viz(v){U.decisions(v,2);}
},
{
num:"5.3",
kind:"Method",
name:"Maximin, maximax and the Hurwicz index",
deps:["phil-5.1"],
refs:["Gallow, Probability & Rational Choice, Spring2026 USC author notes, printed96–103"],
statement:String.raw`For utilities to be maximized, **maximin** maximizes the worst outcome and **maximax** maximizes the best. The Hurwicz criterion interpolates:
Write $m_i=\min_j u_{ij}$ and $M_i=\max_j u_{ij}$. Then
$$H_i(\alpha)=(1-\alpha)m_i+\alpha M_i.$$
Here $0\le\alpha\le1$.
The optimism parameter is a chosen criterion parameter, not a state probability.`,
idea:String.raw`Each act gives an affine function of alpha. Solve pairwise line intersections, retain those in[0,1] where both acts reach the upper envelope, and compare all acts at the selected alpha. At alpha0 the criterion is maximin; at alpha1 it is maximax. Exact ties may retain multiple acts. Only extreme outcomes enter this particular rule, so it need not strictly prefer every weakly dominating act.`,
caption:String.raw`Move the continuous optimism parameter or select maximin/maximax. Actual upper-envelope crossings and maximizer sets are computed from the edited matrix.`,
scope:String.raw`Cardinal utilities and a specified alpha are assumed. Finite exact-rational comparisons of binary64 inputs precede rounding; displayed crossing coordinates are rounded. No descriptive claim about measured risk preferences.`,
viz(v){U.decisions(v,3);}
},
{
num:"5.4",
kind:"Method",
name:"Minimax regret (Savage)",
deps:["phil-5.3"],
refs:["Gallow, Probability & Rational Choice, Spring2026 USC author notes, printed96–103"],
statement:String.raw`Savage-style **minimax regret** compares each payoff with the best available payoff in that same state:
$$r_{ij}=\max_k u_{kj}-u_{ij}.$$
Choose acts attaining $\min_i\max_j r_{ij}$.
Regret is opportunity loss within the declared menu; it is not a forecast of a psychological feeling.`,
idea:String.raw`The column maximum gives the payoff foregone by each act. Taking each row's largest regret and minimizing it exhausts the finite rule. Adding an unchosen act can raise a column maximum and alter the result. In the authored example A=(10,0),B=(0,8) initially select A; adding C=(−100,20) selects B while C remains unchosen. C is not dominated. Adding an act dominated by an existing act cannot raise any column maximum, so that stronger irrelevant-alternative claim would be false.`,
caption:String.raw`Convert the edited payoffs to actual regrets. Buttons reproduce the two-act and added-C menus; the winner changes for a transparent reason rather than a scripted animation.`,
scope:String.raw`Finite cardinal utilities. Ties remain eligible. The alternative called unchosen is not called dominated; this distinction is essential to the reversal.`,
viz(v){U.decisions(v,4);}
},
{
num:"5.5",
kind:"Principle",
name:"Principle of insufficient reason",
deps:["phil-5.1"],
refs:["SEP, Decision Theory, substantive revision20Aug2025, §§2.3 and3.1"],
statement:String.raw`The **principle of insufficient reason** proposes equal probabilities for a stated finite list of possibilities when no relevant distinction is supplied. It is sensitive to how possibilities are individuated: equal probabilities on a refined list generally do not preserve equal probabilities on its coarser partition.`,
idea:String.raw`With coarse states S1,S2, A=(1,0), B=(0,.75), equal probabilities favor A. Split S2 into four otherwise identical labels and make all five labels equiprobable: A gets.2 and B gets.6. If instead the original probability.5 of S2 is distributed across its subevents, the original expectations return. Repartitioning is not new evidence and is not Bayesian conditioning; the reversal diagnoses a changed prior.`,
caption:String.raw`Choose the number of copies and compare equal-label probabilities with preservation of coarse probability mass. Both state masses and actual expected utilities respond.`,
scope:String.raw`Authored state labels and utilities;1–10 copies. Equal weighting is a proposed epistemic rule, not a theorem that every description is equally justified. The example proves partition sensitivity only.`,
viz(v){U.partition(v);}
},
{
num:"5.6",
kind:"Principle",
name:"Expected-utility maximisation",
deps:["phil-5.1", "phil-5.5"],
see:["micro-13.2"],
refs:["SEP, Decision Theory, substantive revision20Aug2025, §§2.3 and3.1"],
statement:String.raw`For a finite state space with common probabilities $p_j\ge0$, $\sum_jp_j=1$, **expected-utility maximisation** ranks acts by
$$EU(a_i)=\sum_jp_j u_{ij}.$$
This is a normative criterion under its chosen probabilities/utilities. Its definition alone is not a representation theorem for arbitrary preferences.`,
idea:String.raw`Normalize nonnegative weights by their positive total, form each row's weighted sum, and retain every maximal row. Linearity explains common-consequence cancellation and the dominance implication. A vNM representation theorem requires substantive axioms such as mixture independence and continuity; it is not established by fitting a finite bar chart. The planned microeconomics representation-theorem item is related background, not a proof input supplied here.`,
caption:String.raw`Edit common state weights and utilities. Expected-utility bars and maximizers are recomputed; zero total weight is explicitly undefined rather than a uniform-prior fallback.`,
scope:String.raw`Bounded finite matrix and weights0–10⁶ with matching columns. Weights may include zeros. Comparisons use exact binary64-input rationals, displays are rounded. No claim that disputed philosophical choices are settled by this arithmetic.`,
viz(v){U.decisions(v,6);}
}
]};
