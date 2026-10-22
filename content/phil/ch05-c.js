import * as U from './ch05.ui.shared.js';
export default {collection:'phil',chapter:5,title:'Decision theory and its puzzles',items:[
{
num:"5.13",
kind:"Paradox",
name:"Newcomb’s problem",
deps:["phil-5.2", "phil-5.6"],
refs:["SEP, Causal Decision Theory, revision24Oct2024, §§1–2.2"],
statement:String.raw`In **Newcomb's problem**, taking both boxes adds the visible reward in each fixed state of the opaque box. Yet conditional expected payoffs can favor one-boxing when the opaque box is much more often full among one-boxers. To compare these arguments one must specify both the observational joint law and what an intervention changes; a single headline accuracy is insufficient.`,
idea:String.raw`Here latent Z selects the observational action A and prediction P; prediction is fixed before action. Set P(A=one)=π, P(full|one)=α₁, P(full|two)=α₂. When both acts have positive observational support,
$$\begin{gathered}EU_E(one)=\alpha_1 B,\\EU_E(two)=\alpha_2 B+b.\end{gathered}$$
Under do(A), hold the latent/prediction distribution fixed, with pfull=πα₁+(1−π)α₂. The causal values are pfullB and pfullB+b. Both computations follow the declared model; observing A and forcing A are different operations. At π0 or1 an off-support conditional is undefined, although interventions remain defined.`,
caption:String.raw`Edit conditional fullness rates and observational act frequency. Four actual joint cells and the selected EDT/CDT payoff comparison are computed directly rather than generated as fake empirical samples.`,
scope:String.raw`Authored binary structural model. B=1000 chosen units; visible b0–10. Latent common cause Z→A and Z→P, no A→P. This is one explicit reconstruction of the puzzle, not a unique causal account or proof that either normative theory is correct.`,
viz(v){U.newcomb(v);}
},
{
num:"5.14",
kind:"Concept",
name:"Evidential versus causal decision theory",
deps:["phil-5.13"],
refs:["SEP, Causal Decision Theory, revision24Oct2024, §§1–2.2"],
statement:String.raw`**Evidential decision theory (EDT)** evaluates act-conditioned expectations; **causal decision theory (CDT)** uses causal or suitable subjunctive expectations. If an act is evidence about a common cause without causing it, the two quantities can differ. Which decision principle is justified remains a philosophical question.`,
idea:String.raw`In the declared Newcomb graph Z→A and Z→P, conditioning on A changes information about Z and hence P. Intervening on A replaces the action mechanism while leaving the distribution of Z and P unchanged. Summing the four joint cells gives observational conditional values; summing the unchanged P marginal gives causal values. Therefore a difference here is caused by different questions, not inconsistent probability arithmetic. Off-support conditionals require additional assumptions and are not silently filled in.`,
caption:String.raw`Compare both actual calculations for the same joint law. The visible readout states the causal arrows and the intervention assumption; no medical analog or clinical measurements are needed.`,
scope:String.raw`Only this finite common-cause model is implemented. Causal knowledge is supplied as a premise, not inferred from correlation or claimed identifiable from these cells alone. No claim that every version of CDT is this simple intervention rule.`,
viz(v){U.newcomb(v,true);}
},
{
num:"5.15",
kind:"Paradox",
name:"Kavka’s toxin puzzle",
deps:["phil-5.13"],
refs:["Kavka, The Toxin Puzzle, Analysis43(1),1983,33–36, actual institutional original scan"],
statement:String.raw`Kavka's **toxin puzzle** separates a reward for an intention formed earlier from reasons to carry out the intended action later. A stipulated reward for genuinely intending does not by itself make that intention freely selectable. Calling later drinking instrumentally pointless is not a proof that the required earlier intention can or cannot be formed.`,
idea:String.raw`In the original setup the reward depends on an earlier intention and is transferred before the contemplated action. Once paid, the later refusal does not undo it, while drinking still brings disutility. These fixed-later-payoff comparisons are immediate. But reasons to have an intention and reasons to perform its content are distinct; a selector that stipulates a sincere intention does not construct one. Kavka excludes external commitment devices and the like. Adding one changes the puzzle and is marked as a separate premise.`,
caption:String.raw`A computed payment timeline separates the stipulated intention, completed transfer and later payoffs. An optional external-commitment premise is explicitly outside the original case.`,
scope:String.raw`Fictional utility units; no substance, dose or handling instructions. The intention control selects a scenario, not a psychological procedure. Actual original Analysis33–36 read; no empirical claim about intention formation.`,
viz(v){U.toxin(v);}
},
{
num:"5.16",
kind:"Paradox",
name:"Buridan’s ass",
deps:["phil-5.2", "pma-4.23"],
refs:["Lamport, Buridan’s Principle, author PDF revised24Feb2012, printed1 and §§6–7"],
statement:String.raw`A conditional **Buridan principle** concerns continuously varying inputs and a fixed completion deadline. If the deadline response is continuous on an interval and its endpoints represent opposite completed choices, an intermediate response cannot be either endpoint choice. Thus for every fixed deadline there is an unresolved input under those hypotheses; this does not by itself establish one input unresolved at every deadline.`,
idea:String.raw`Apply the intermediate value theorem to the continuous deadline response between its opposite endpoint values. The quantifier is $\forall T\,\exists x_T$, not automatically $\exists x\,\forall T$. A concrete authored example is the absorbing flow $y(T,x)=\operatorname{clamp}(xe^{kT},-1,1)$. Its completion time is log(1/|x|)/k for0<|x|≤1 and infinite at x0; the unresolved interval is |x|<exp(−kT). This toy has an exact eternal tie, but that stronger fact comes from its own equation. A discontinuous tie rule changes the continuity hypothesis.`,
caption:String.raw`Vary initial bias, growth rate and deadline. The actual continuous deadline graph and shrinking unresolved interval are computed, retaining tiny nonzero inputs separately from exact symmetry.`,
scope:String.raw`A mathematical illustration with explicitly assumed continuity and opposite endpoint responses. Lamport discusses physical hypotheses; this visualization does not experimentally prove physical continuity, uniform bounded-time impossibility for every device, or behavior of actual animals.`,
viz(v){U.buridan(v);}
},
{
num:"5.17",
kind:"Paper",
name:"Newcomb’s Problem and Two Principles of Choice",
paper:{"authors": "Robert Nozick", "year": 1969, "title": "Newcomb’s Problem and Two Principles of Choice", "venue": "In N. Rescher (ed.), Essays in Honor of Carl G. Hempel, Dordrecht: Reidel: 114–146", "doi": "10.1007/978-94-017-1466-2_7"},
introduces:["phil-5.13"],
deps:["phil-5.2", "phil-5.6"],
refs:["SEP, Causal Decision Theory, revision24Oct2024, §§1–2.2"],
verify:true,
statement:String.raw`Nozick’s 1969 paper presents Newcomb's problem and two principles of choice. The full original body remains unverified here. The finite model below is a modern explicit reconstruction of the dominance/conditional-expectation tension, supported by the actual modern exposition and its stated joint-law assumptions.`,
idea:String.raw`Two-boxing adds b in every fixed opaque-box state. Under the separately declared symmetric conditional rates α₁=α and α₂=1−α, conditional one-boxing has greater expected payoff exactly when
$$\alpha>\frac{1+b/B}{2}.$$
For B=1,000,000 and b=1,000 this is50.05%. The same ratio is used by the display's rescaled1000/1 units. Asymmetric conditional rates instead require α₁B>α₂B+b; a marginal prediction-accuracy number alone does not determine this inequality. Interventional payoffs keep the prediction law fixed and still differ by b. This derivation is supplied here, not attributed as a verified transcription of the unread original.`,
caption:String.raw`Compare actual joint cells and both decision calculations. The conditional threshold is explicitly a symmetric special case; changing observational frequency does not turn observational group averages into intervention outcomes.`,
scope:String.raw`Original DOI body could not be accessed; no alternate original copy was recovered. The cited modern SEP exposition and the supplied finite calculations support the declared reconstruction. They do not verify the full original argument, original experiments or sampled population results.`,
viz(v){U.newcomb(v,true,true);}
}
]};
