import * as U from './ch06.viz.js';
export default {collection:'phil',chapter:6,title:'Bayesian epistemology',summary:String.raw`Belief can be graded without becoming arbitrary. Finite probability worlds make updating, evidence and coherence visible; support and dependence assumptions then expose the limits of simple rules. The final three lessons distinguish certainty about old evidence, threshold acceptance in a lottery and an author's reasonable acknowledgement of fallibility.`,items:[
{
num:"6.1",
kind:"Concept",
name:"Interpretations of probability",
deps:[],
refs:["SEP, Interpretations of Probability, revised 16 November 2023, selected body passages in §§3.3–3.5"],
links:{"source": "https://plato.stanford.edu/entries/probability-interpret/"},
tags:["probability", "belief", "frequency"],
statement:String.raw`Probability claims can concern different things: a relative frequency in a stated collection of trials, a chance attributed to a physical setup, or an agent's degree of belief. These interpretations are not definitions of one another. A finite relative frequency is a tally divided by a positive number of trials; it can differ from both a model's chance parameter and an agent's credence.`,
idea:String.raw`Keep the event “the next toss is heads” fixed while asking three questions: how often have heads occurred, what chance does the model assign, and how confident is this agent? The first uses the actual displayed record; the other two are separately specified. When the record is empty, its relative frequency is undefined. An unusual finite record is compatible with a nondegenerate chance model. Running a simulation does not decide which philosophical interpretation of probability is correct.`,
caption:String.raw`Change the setup's model chance and the agent's quoted credence, then reveal more seeded tosses. Follow the running frequency and compare the three readings of “probability of heads.”`,
scope:String.raw`A simulated coin and a finite record illustrate distinctions among selected frequentist, propensity and subjective accounts. The chance parameter belongs to the authored model; it is not a measured property of a real coin. Limiting frequencies, logical probability and best-system theories require further treatment.`,
viz:U.interpretationsWidget
},
{
num:"6.2",
kind:"Theorem",
name:"Bayes’ theorem",
deps:["phil-6.1", "stat-10.1"],
refs:["SEP, Bayes’ Theorem, revised 30 September 2003, §1; finite binary derivation supplied"],
links:{"source": "https://plato.stanford.edu/entries/bayes-theorem/"},
tags:["Bayes theorem", "conditioning"],
statement:String.raw`In a finite probability model, let $H$ be a hypothesis and $E$ an event with $P(E)>0$. Then
$$P(H\mid E)=\frac{P(H\cap E)}{P(E)}.$$
For the binary component model $p=P(H)$, $s=P(E\mid H)$ and $f=P(E\mid\neg H)$, define $D=ps+(1-p)f$. When $D>0$,
$$P(H\mid E)=\frac{ps}{D}.$$
The four joint masses, rather than a likelihood alone, determine the posterior.`,
idea:String.raw`Partition the world into H with E, H without E, not-H with E, and not-H without E. Their masses sum to one. Conditioning keeps the two E regions and rescales their combined mass to one. The relative share of H among those survivors is the posterior. This is an identity within a probability model; adopting conditionalisation as a rule of learning is an additional epistemic proposal.`,
caption:String.raw`Adjust the prior and the two evidence rates. Compare the original square with an enlarged view of the E region, then inspect the exact prior-to-posterior change. Try evidence that has no probability under either supported possibility.`,
scope:String.raw`The sliders define a two-hypothesis finite model. At a zero prior for a hypothesis, its offered evidence rate is a component-model parameter, not a conditional probability identified by that joint distribution. Zero evidence mass leaves this ratio undefined. The prerequisite STAT 10.1 gives the related density formula.`,
viz:U.bayesWidget
},
{
num:"6.3",
kind:"Phenomenon",
name:"The base-rate fallacy",
deps:["phil-6.2"],
refs:["SEP, Bayes’ Theorem, §1 and selected §3; fictional expected-count construction supplied"],
links:{"source": "https://plato.stanford.edu/entries/bayes-theorem/"},
tags:["base rates", "evidence"],
statement:String.raw`The base-rate fallacy is a pattern of reasoning in which prior prevalence receives too little weight when interpreting evidence. A high true-positive rate alone does not imply a high posterior probability. Let $p$ be prevalence, $s$ sensitivity and $f$ the false-positive rate. With positive evidence mass
$$D=ps+(1-p)f,$$
the positive predictive value is
$$P(H\mid E)=ps/D.$$`,
idea:String.raw`In a fictional population of 10,000 with prevalence 0.001, sensitivity 0.99 and false-positive rate 0.01, the expected positive counts are 9.9 from the condition group and 99.9 from the other group. Only about 9% of expected positives come from the condition group. The large comparison group matters even though its positive rate is small. These expected counts may be fractional; they are not a claimed sample of observed patients.`,
caption:String.raw`Raise prevalence while holding the two test rates fixed. The population quilt and enlarged positive pool show which group supplies each positive; the curve tracks the resulting posterior.`,
scope:String.raw`Fictional arithmetic demonstrates the consequence of ignoring prevalence. No study of participant behaviour, real disease rate or medical recommendation is asserted. Sensitivity, specificity and overall accuracy are different quantities; the controls use sensitivity and false-positive rate explicitly.`,
viz:U.baseRateWidget
},
{
num:"6.4",
kind:"Theorem",
name:"Dutch-book argument for probabilism",
deps:["phil-6.1"],
refs:["SEP, Dutch Book Arguments, revised 14 May 2022, §1.1 and selected §§1.2–1.3; finite proof supplied"],
links:{"source": "https://plato.stanford.edu/entries/dutch-book/"},
tags:["coherence", "Dutch book"],
statement:String.raw`On a finite classical event algebra, a probability assignment gives every finite portfolio of fair tickets expected net payoff zero. Such a portfolio cannot lose strictly in every world. Conversely, a violation of the finite probability axioms admits a sure-loss portfolio under two-sided trading and additive utility. This mathematical construction is the starting point of a disputed normative argument for probabilism.`,
idea:String.raw`A unit ticket on $A$ pays one if $A$ is true and zero otherwise. If its quoted price is negative, selling it yields a loss in every world. A mispriced certain ticket gives a sure loss by buying or selling in the appropriate direction. For disjoint $A,B$, the payoff of buying their tickets and selling the union ticket is constant: it is the negative of $q(A)+q(B)-q(A\cup B)$. Reverse all trades when that difference is negative.

For the pictured two-world algebra, complementary prices $p,q$ must lie in $[0,1]$ and sum to one. Buying both overpriced complementary tickets, or selling both underpriced ones, gives a sure loss. Conversely, under a probability distribution each fair ticket has expectation zero; linearity gives a zero-expectation portfolio. A strictly negative payoff in every one of finitely many worlds would have negative expectation, a contradiction. Connecting quoted prices to rational credences requires a further bridge premise.`,
caption:String.raw`Edit the two quoted prices. Read the actual buy/sell portfolio and settle it in both worlds. Compare a coherent pair with a tiny violation that rounded price labels might hide.`,
scope:String.raw`The displayed construction uses complementary events and money interpreted as linear utility. Both buying and selling at the quoted price are permitted. Refusal to bet, different buying and selling prices, risk-sensitive utility and transaction costs change the assumptions. The normative argument for probabilism is contested.`,
viz:U.bookWidget
},
{
num:"6.5",
kind:"Principle",
name:"Conditionalisation",
deps:["phil-6.4", "phil-6.2"],
refs:["SEP, Bayesian Epistemology, published 13 June 2022, §§1.2 and 2", "SEP, Dutch Book Arguments, §4.1, including advance-plan limitations"],
links:{"source": "https://plato.stanford.edu/entries/epistemology-bayesian/"},
tags:["learning", "conditionalisation"],
statement:String.raw`Conditionalisation proposes that an agent who becomes certain of $E$, receives no additional relevant information and starts with $P(E)>0$ should adopt
$$P_{\rm new}(A)=P_{\rm old}(A\mid E).$$
In a finite world model this removes incompatible worlds and multiplies every surviving mass by the same factor $1/P_{\rm old}(E)$.`,
idea:String.raw`The common rescaling preserves odds between surviving worlds. A separate timed-betting argument concerns a known plan to use a different posterior $q$ after learning $E$. Write
$$r=P_{\rm old}(A\mid E).$$
A preannounced deviation can be combined with fair tickets before learning and a reversing ticket after learning to give the same loss in every world:
$$L=|r-q|\,P_{\rm old}(E).$$
The strategy requires that particular update plan and the stated trades. It does not show that every unexpected change of belief is irrational.`,
caption:String.raw`Edit the four prior world weights and watch zeroing and renormalisation. In the strategy view, compare a fixed proposed update with the conditional value and inspect every ticket's contribution in every world.`,
scope:String.raw`Certain learning of E alone is the default premise. Zero prior evidence mass is undefined; receiving stronger evidence or lacking a fixed future update defeats this specific strategy argument. Editing the starting weights creates another prior rather than conditioning the original one.`,
viz:U.conditionalWidget
},
{
num:"6.6",
kind:"Concept",
name:"Confirmation as probability raising",
deps:["phil-6.2"],
refs:["SEP, Bayes’ Theorem, §2 and selected §3; binary change identity supplied"],
links:{"source": "https://plato.stanford.edu/entries/bayes-theorem/"},
tags:["confirmation", "evidence"],
statement:String.raw`Relative to a stated probability model, $E$ incrementally confirms $H$ when $P(H\mid E)>P(H)$, disconfirms it when the inequality reverses, and is neutral when they are equal. This compares before and after; it does not mean that the posterior exceeds one half. For an interior prior $0<p<1$ and positive evidence mass, the direction agrees with the sign of $s-f$, where $s=P(E\mid H)$ and $f=P(E\mid\neg H)$.`,
idea:String.raw`Subtract the prior from the posterior. With $D=ps+(1-p)f$,
$$\Delta=\frac{p(1-p)(s-f)}{D}.$$
For an interior prior, all factors except $s-f$ are positive. A tiny prior can remain tiny after confirmation, and a high belief can fall while remaining above one half. Difference, probability ratio and log likelihood ratio have different scales; this illustration does not select a uniquely correct measure of confirmation.`,
caption:String.raw`Choose supportive, neutral or contrary evidence and move the prior. Compare the belief change, the two likelihoods and the available numerical measures on their own labelled scales.`,
scope:String.raw`This is incremental Bayesian confirmation in an authored binary model. At prior zero or one, the interior sign equivalence does not imply a strict change. Ratios with zero denominators remain undefined; likelihood ratios are not posterior probabilities. No measure is presented as the uniquely correct philosophical account.`,
viz:U.confirmationWidget
},
{
num:"6.7",
kind:"Concept",
name:"Likelihood ratios and the weight of evidence",
deps:["phil-6.6", "stat-10.13"],
refs:["SEP, Bayes’ Theorem, §2; conditional chain rule and copied-report construction supplied", "Written prerequisite STAT 10.13, Bayes factor"],
links:{"source": "https://plato.stanford.edu/entries/bayes-theorem/"},
tags:["likelihood ratio", "log odds"],
statement:String.raw`For hypotheses $H$ and $\neg H$ with positive prior probabilities, posterior odds equal prior odds times the likelihood ratio of the complete record. At each evidence step,
$$O_i=O_{i-1}L_i.$$
Each $L_i$ conditions on earlier observations. Under conditional independence given each hypothesis it reduces to the single-observation likelihood ratio. When the log quantities are finite,
$$\log O_i=\log O_{i-1}+\log L_i.$$`,
idea:String.raw`Apply Bayes' theorem to each next observation conditional on the existing record. Taking odds cancels each normalizer; multiplying these identities gives the chain rule for evidence. A repeated report of the same observation contributes no new factor once that observation is known. Treating the duplicate as an independent test changes the model and exaggerates its evidential contribution.`,
caption:String.raw`Add positive and negative observations to the record. Compare independent tests with repeated copies of the first report; follow the probability path and the finite log-odds increments.`,
scope:String.raw`The observation mechanisms and their likelihoods are specified in the tool. Zero likelihood can eliminate a hypothesis; a record impossible under every supported hypothesis has no posterior. Infinite odds are labelled separately from finite plotted values. The prerequisite Bayes-factor lesson distinguishes marginal model likelihood from a parameter likelihood.`,
viz:U.evidenceWidget
},
{
num:"6.8",
kind:"Theorem",
name:"Washing out of the priors",
deps:["phil-6.5"],
refs:["SEP, Bayesian Epistemology, §§1.5 and 2 for prior/probability background; finite convergence theorem and proof supplied"],
links:{"source": "https://plato.stanford.edu/entries/epistemology-bayesian/"},
tags:["priors", "convergence"],
statement:String.raw`Consider a finite list of distinct coin biases in $(0,1)$ that includes $\theta_*$. Two agents use the Bernoulli likelihood of the same toss record, and both initially give $\theta_*$ positive mass. If the observed fraction of heads tends to $\theta_*$, each posterior tends to full mass on $\theta_*$. Their total-variation distance therefore tends to zero. This is a finite, explicitly conditional version of washing out.`,
idea:String.raw`Let $R_n$ be a rival model's likelihood divided by the likelihood at $\theta_*$. The log ratio per toss is the observed heads fraction times $\log(\theta/\theta_*)$, plus the tails fraction times $\log((1-\theta)/(1-\theta_*))$. By the assumed frequency limit,
$$n^{-1}\log R_n\to-D(\theta_*\Vert\theta).$$
The Bernoulli divergence is strictly positive for distinct biases; this follows from strict concavity of the logarithm. Every rival-to-true posterior odds ratio therefore tends to zero. There are finitely many rivals, so each agent's posterior tends to the same point mass. The triangle inequality for total variation makes their mutual distance tend to zero. Excluding the true model or allowing observationally identical models removes a load-bearing premise.`,
caption:String.raw`Reveal the same seeded coin record to two differently weighted agents. Compare their complete posterior vectors and total-variation history, then remove true-model support or make two models observationally identical.`,
scope:String.raw`A finite supplied theorem illustrates washing out. Under iid data at an included true bias, the law of large numbers supplies the assumed frequency limit. A finite trace need not approach monotonically and is not a convergence certificate. This is not a claim of unrestricted merging for arbitrary priors, models or infinite spaces.`,
viz:U.washingWidget
},
{
num:"6.9",
kind:"Paradox",
name:"The problem of old evidence",
deps:["phil-6.6"],
refs:["SEP, Bayesian Epistemology, §5.1, including logical-learning objections"],
links:{"source": "https://plato.stanford.edu/entries/epistemology-bayesian/"},
tags:["old evidence", "logical learning"],
statement:String.raw`If $P(E)=1$ in a coherent probability model, then
$$P(H\mid E)=P(H)$$
for every $H$. Conditioning on $E$ again cannot raise belief. The problem of old evidence asks how an observation already known can nevertheless support a newly assessed theory; the identity alone does not resolve that philosophical question.`,
idea:String.raw`Because $\neg E$ has mass zero, $H\cap E$ has the same mass as $H$. Dividing by $P(E)=1$ leaves it unchanged. One proposed response considers an earlier counterfactual prior in which $E$ was uncertain; another treats learning a theoretical implication as new information. These approaches introduce further questions about priors, logical knowledge and changing theory spaces.`,
caption:String.raw`Compare the current certain-evidence table with a separately labelled hypothetical earlier prior. The timeline marks the difference between learning a result and recognizing what a theory implies.`,
scope:String.raw`The Mercury example is a schematic historical motivation from commentary, not a calculation from orbital measurements. All displayed joint tables remain coherent: if E is certain and H has positive mass, $P(E\mid H)$ must also be one. Moving to another prior is not an update of the original current distribution.`,
viz:U.oldEvidenceWidget
},
{
num:"6.10",
kind:"Paradox",
name:"The lottery paradox",
deps:["phil-6.1"],
refs:["SEP, Epistemic Paradoxes, revised 3 March 2022, §3; finite selected-ticket calculation supplied"],
links:{"source": "https://plato.stanford.edu/entries/epistemic-paradoxes/"},
tags:["lottery", "belief"],
statement:String.raw`In a fair finite lottery with $N$ tickets and exactly one winner, each ticket loses with probability $1-1/N$. Yet the assertion that all tickets lose is impossible. A rule accepting every sufficiently probable proposition, combined with unrestricted finite agglomeration and acceptance that one ticket wins, can therefore produce an inconsistent set of beliefs.`,
idea:String.raw`Let $C_k$ conjoin the losing claims for $k$ distinct selected tickets. Exactly $N-k$ potential winning tickets remain, so
$$P(C_k)=1-k/N.$$
At $k=N$ no winner world remains. The individual losing claims are related through the exactly-one-winner premise; multiplying their probabilities would replace this lottery by a different joint model. Coherent numerical credences and threshold-based full beliefs are different objects. The contradiction additionally needs the proposed closure rule.`,
caption:String.raw`Select more tickets as presumed losers. Compare each claim's probability with the conjunction and watch the surviving winner worlds disappear. Move the proposed acceptance threshold to see when the rule licenses the individual claims.`,
scope:String.raw`A fair lottery with at least one ticket. Threshold acceptance is examined rather than endorsed; agglomeration is an explicit further premise. The tool illustrates the tension but does not choose among philosophical responses about knowledge, rational belief or closure.`,
viz:U.lotteryWidget
},
{
num:"6.11",
kind:"Paradox",
name:"The preface paradox",
deps:["phil-6.10"],
refs:["SEP, Epistemic Paradoxes, selected §4; independent/shared/dispersed error constructions and sharp bounds supplied"],
links:{"source": "https://plato.stanford.edu/entries/epistemic-paradoxes/"},
tags:["preface", "dependence"],
statement:String.raw`An author may reasonably accept each assertion while also acknowledging that the book contains an error. The preface paradox asks how these attitudes fit with closure of belief under conjunction. For $n$ claims each marginally true with probability $q$, let $A$ be the probability that all are true. The sharp bounds are
$$A\le q,$$
$$A\ge\max\{0,1-n(1-q)\}.$$
The marginals alone do not determine the conjunction.`,
idea:String.raw`The lower bound follows by applying the union bound to errors; the upper bound follows because the conjunction implies each claim. Independent errors give
$$P(\text{all true})=q^n.$$
Perfectly shared errors attain the upper bound. For a dispersed construction, put $m=n(1-q)$. Choose an error count $K$ equal to either $\lfloor m\rfloor$ or $\lceil m\rceil$, with mean $m$, then choose the $K$ erroneous claims uniformly. Every claim has error probability $m/n$, while
$$P(K=0)=\max(0,1-m).$$
This attains the lower bound. With $q=0.99$ and $n=300$, the chance that all claims are true is about 5% under the independent model. The individual reliabilities alone do not imply that result.`,
caption:String.raw`Keep the number of claims and each claim's reliability fixed while changing dependence. Compare the joint-probability band, the current conjunction and the full distribution of the number of errors.`,
scope:String.raw`Authored exchangeable constructions make the dependence assumption explicit. They are not measured error rates for a real book. The philosophical preface paradox does not itself require independence or a probabilistic acceptance threshold; those are optional numerical illustrations.`,
viz:U.prefaceWidget
},
]};
