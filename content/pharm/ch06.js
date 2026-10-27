// Receptor pharmacodynamics: authored models with explicit source boundaries.
import * as V from './ch06.viz.js';
export default {
 collection:"pharm",
 chapter:6,
 title:"Pharmacodynamics: receptors and dose–response",
 summary:"Binding, activation and transduction answer different questions. Follow equilibrium receptor inventories into potency, constitutive activity, reserve and antagonism, then compare time-dependent binding, availability feedback and mixture reference models. Every concentration is illustrative; historical paper lessons preserve their bibliographic identities while marking unread original bodies explicitly.",
 items:[
 {
  num:"6.1",
  kind:"Model",
  name:"Receptor occupancy theory (Clark)",
  deps:["mathbio-5.2"],
  statement:String.raw`For one reversible ligand–receptor binding site at equilibrium, maintained free ligand L gives
$$\theta=\frac{L}{K_d+L},\qquad C=R_T\theta.$$
Here C is bound complex and Rₜ is total receptor concentration. In a closed sample supplied with total ligand Lₜ, the free concentration must instead satisfy
$$L_T=\ell+\frac{R_T\ell}{K_d+\ell}.$$
The occupancy law uses free ℓ, not the supplied total. A Clark-type proportional response is an additional assumption connecting binding to an observed effect.`,
  idea:String.raw`MATHBIO5.2 supplies mass-action binding. Balance bound and free receptors to obtain the hyperbola. For a closed sample, enforce the separate ligand balance as well: complex formation depletes the free pool. Increasing receptor inventory at fixed total ligand can therefore change per-site occupancy. Each complex contains one ligand and one receptor, so the two component inventories must not be added as if they counted disjoint species.`,
  caption:String.raw`Choose maintained free ligand or a closed total supply. Move ligand and receptor inventories, compare occupancy curves, and inspect the separate free/bound component stacks.`,
  scope:String.raw`Own ideal single-site equilibrium model in illustrative µM. No cooperativity, endogenous competitor, ligand metabolism or fitted assay. At zero receptor inventory a hypothetical-site binding law still exists, but a sample occupancy fraction has no denominator. Concentration is not administered dose.`,
  refs:["IUPHAR PEP: actual pharmacodynamics affinity body", "Buchwald 2019: selected main-concepts discussion", "Own closed component balances"],
  links:{"education": "https://pharmacologyeducation.org/pharmacodynamics/", "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"},
  tags:["binding", "mass-action"],
  viz:V.receptorOccupancy,
 },
 {
  num:"6.2",
  kind:"Model",
  name:"Emax model and the Hill equation for drug effect",
  deps:["pharm-6.1", "sysbio-1.3"],
  statement:String.raw`A descriptive response curve with baseline E₀ and limiting response E∞ is
$$E=E_0+(E_\infty-E_0)S,$$
$$S=\frac{L^n}{K^n+L^n}.$$
For a nonzero response span, K is the concentration at the middle of that span. Its proportional-concentration sensitivity is
$$\frac{dE}{d\ln L}=n(E_\infty-E_0)S(1-S).$$
The view fixes E₀=0. A flat response has no identifiable response EC50, even if a scale parameter remains in its formula.`,
  idea:String.raw`SYSBIO1.3 motivates a saturating response law; PHARM6.1 supplies a binding comparison. The response formula may resemble occupancy while its fitted scale and limiting effect have different meanings. Taking log odds gives a slope n, but a noninteger descriptive exponent does not specify a molecular site count. Differentiation shows that sensitivity to a proportional concentration change is greatest at the midpoint and becomes small near either plateau.`,
  caption:String.raw`Change response scale, steepness and limiting effect, then select a free concentration. Compare the response and its derivative with an n=1 curve at the same scale and maximum.`,
  scope:String.raw`Own zero-baseline Hill response family with n from 1 to 4. K is a response scale, not automatically a microscopic binding Kd. Parameters are authored rather than fitted to a measured drug, and the response maximum can be exactly zero.`,
  refs:["IUPHAR PEP: actual dose–response, potency and efficacy text", "Own Hill response and derivative"],
  links:{"education": "https://pharmacologyeducation.org/pharmacodynamics/"},
  tags:["Hill", "response"],
  viz:V.emax,
 },
 {
  num:"6.3",
  kind:"Concept",
  name:"Potency versus efficacy",
  deps:["pharm-6.2"],
  statement:String.raw`For a specified response family and assay, potency describes the concentration needed for an effect, while efficacy concerns the effect that can be reached. Comparing each agent at half of its own maximum is different from comparing both at one common absolute response. For a zero-baseline Hill curve with maximum M>0 and 0<e<M,
$$L(e)=K\left(\frac{e}{M-e}\right)^{1/n}.$$
The limiting maximum requires unbounded concentration; an effect above it is unattainable in the model.`,
  idea:String.raw`Invert PHARM6.2 separately for the two declared maxima. Lower K moves the own-midpoint left, but does not guarantee a lower concentration for every common absolute target. In particular, a low-maximum agent cannot reach a target beyond its ceiling. A flat zero curve has no identifiable own EC50 or inverse concentration at its unchanged baseline. Absolute response and normalized response should therefore not be interchanged silently.`,
  caption:String.raw`Compare two agents with independently chosen response scales and maxima. Move the common absolute target and examine each exact target concentration alongside the inverse-curve segments.`,
  scope:String.raw`Own curves share exponent 1.6 and zero baseline. The inverse segments show 1–99% of each own maximum; the separately computed target can lie outside them. Responses use the same arbitrary assay units, with no ranking of clinical usefulness.`,
  refs:["IUPHAR PEP: actual potency and efficacy explanation", "Own exact absolute-effect inversion"],
  links:{"education": "https://pharmacologyeducation.org/pharmacodynamics/"},
  tags:["potency", "efficacy"],
  viz:V.potencyEfficacy,
 },
 {
  num:"6.4",
  kind:"Concept",
  name:"Log dose–response curves",
  deps:["pharm-6.2"],
  statement:String.raw`A logarithmic concentration axis changes the geometry of a response curve without changing its values. For the zero-baseline Hill family,
$$\log\frac{S}{1-S}=n\log\frac{L}{K}.$$
Its 10–90% concentration ratio is
$$\frac{L_{90}}{L_{10}}=81^{1/n}.$$
Thus a simple n=1 hyperbola becomes sigmoidal on a log concentration axis. That visual shape alone does not establish cooperative binding.`,
  idea:String.raw`Solve the odds equation at S=0.1 and S=0.9: the corresponding concentrations are K times 9 raised to −1/n and +1/n. Their ratio cancels K. Moving K therefore translates the log curve while changing n changes the transition width. Equal distances on this horizontal axis represent equal concentration ratios. Zero concentration has a valid response but cannot have a finite logarithmic coordinate.`,
  caption:String.raw`Compare the same law on linear and logarithmic concentration axes with the same upper endpoint 10K. Move K and n; the band and open endpoints show the actual 10–90% interval.`,
  scope:String.raw`Own concentration geometry with a positive log-panel lower endpoint 0.01K. The linear panel includes zero. Selected values outside a panel are identified explicitly rather than placed at an axis edge. No dose-to-concentration conversion or claim of a universally linear middle segment is supplied.`,
  refs:["IUPHAR PEP: actual dose–response explanation", "Own log-odds and interval derivation"],
  links:{"education": "https://pharmacologyeducation.org/pharmacodynamics/"},
  tags:["logarithms", "response"],
  viz:V.logResponse,
 },
 {
  num:"6.5",
  kind:"Concept",
  name:"Full, partial and inverse agonists",
  deps:["pharm-6.2"],
  statement:String.raw`Constitutive activity allows a ligand to raise, preserve or lower receptor activation. In the displayed four-state ensemble, unbound receptors are active with probability b and bound receptors with probability ε. With occupancy θ,
$$P_{\rm active}=b(1-\theta)+\varepsilon\theta.$$
Full, partial, neutral and inverse action correspond here to ε=1, b<ε<1, ε=b and ε<b. An inverse agonist lowers activity relative to a nonzero baseline; it does not make receptor occupancy negative.`,
  idea:String.raw`Split unbound and bound ensembles into inactive and active states, then sum the two active probabilities. The resulting change from baseline is (ε−b)θ. This directly distinguishes binding from activation and makes the classification depend on the stated baseline. If b=0, the ε=0 preset is neutral rather than inverse. The common ensemble binding constant is an average quantity; the grouped construction does not identify microscopic state-specific affinities.`,
  caption:String.raw`Select full, partial, neutral, inverse or a custom bound activity. Vary constitutive activity and free ligand; compare occupancy with active fraction and the four normalized state bars.`,
  scope:String.raw`Own equilibrium ensemble without signal amplification. The four grouped weights are (1−b), b, (1−ε)L/Kd and εL/Kd. It is not the full SABRE model or a fit to any ligand; response labels describe this declared system.`,
  refs:["IUPHAR PEP: actual receptors, partial/inverse/neutral paragraphs", "Buchwald 2019: selected constitutive-activity discussion", "Own four-state ensemble"],
  links:{"education": "https://pharmacologyeducation.org/receptors/", "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"},
  tags:["agonism", "constitutive-activity"],
  viz:V.agonistTypes,
 },
 {
  num:"6.6",
  kind:"Model",
  name:"Operational model of agonism and receptor reserve",
  deps:["pharm-6.5", "sysbio-6.8"],
  statement:String.raw`Binding followed by saturating transduction can separate binding affinity from half of the actual response maximum. Let
$$C=\frac{R_TL}{K_d+L},$$
$$E=\frac{C}{K_E+C}.$$
Writing τ=Rₜ/Kᴇ gives
$$E_\infty=\frac{\tau}{1+\tau},$$
$$EC_{50}=\frac{K_d}{1+\tau}.$$
For positive inventory the response EC50 is smaller than Kd, even though the binding law itself is unchanged.`,
  idea:String.raw`PHARM6.5 separates binding from activation, and SYSBIO6.8 supplies saturation as a transduction motif. Substitute the bound concentration into the transducer, then factor its rational denominator. Solving for half of its own limiting maximum gives the stated EC50. Response normalized by its own maximum can look nearly complete at relatively low occupancy. At zero inventory the response is flat: the apparent EC50 limit Kd is not an identifiable half-response concentration.`,
  caption:String.raw`Move receptor inventory and transduction scale. Compare binding, absolute response and response divided by its own maximum; the second panel tracks the maximum and EC50/Kd as inventory changes.`,
  scope:String.raw`Own n=1 operational transduction with illustrative compatible µM inventories. A response curve alone is not used to separately identify affinity, receptor number and transduction efficiency. The open zero-inventory point denotes a limit, while normalization and EC50 are undefined there.`,
  refs:["Buchwald 2019: selected operational-model comparison", "IUPHAR PEP: actual spare-receptor paragraph", "Own transduction algebra"],
  links:{"modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full", "education": "https://pharmacologyeducation.org/receptors/"},
  tags:["reserve", "transduction"],
  viz:V.receptorReserve,
 },
 {
  num:"6.7",
  kind:"Model",
  name:"Del Castillo–Katz two-state receptor model",
  deps:["pharm-6.5"],
  statement:String.raw`A minimal binding-then-opening scheme has receptor states R, AR and AR*. If the closed-state binding constant is Kmic and the opening/closing equilibrium ratio is g≥0, their weights are
$$1,\quad A/K_{\rm mic},\quad gA/K_{\rm mic}.$$
The limiting open fraction is g/(1+g), and the composite binding half-scale is Kmic/(1+g). For g>0 that scale also gives half of the actual open-probability maximum.`,
  idea:String.raw`Normalize the three nonnegative weights by their sum. Total occupancy adds both bound states, whereas activation counts only the open bound state. Raising the opening equilibrium ratio therefore increases the maximal open probability and changes the composite affinity. Although its response has the same rational form as the preceding operational model, its microscopic interpretation is different. Without an active unbound state it cannot explain inverse agonism against constitutive activity.`,
  caption:String.raw`Change microscopic binding and the opening equilibrium ratio. Follow the three equilibrium state probabilities, then compare total occupancy with open fraction over free agonist concentration.`,
  scope:String.raw`Own equilibrium Del Castillo–Katz-type minimal scheme, explained using the distinct Buchwald 2019 comparison rather than an original-paper reconstruction. Arrow lengths do not encode rates. At g=0 binding remains possible, but the response is flat and response EC50 is undefined.`,
  refs:["Buchwald 2019: selected minimal two-state versus operational discussion", "Own three-state partition and composite half-scale"],
  links:{"modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"},
  tags:["gating", "equilibrium"],
  viz:V.gating,
 },
 {
  num:"6.8",
  kind:"Model",
  name:"Competitive antagonism and the Schild equation",
  deps:["pharm-6.1", "mathbio-5.7"],
  statement:String.raw`For two ligands competing reversibly for one site at maintained free concentrations A and B,
$$\theta_A=\frac{A/K_A}{1+A/K_A+B/K_B}.$$
The agonist concentration required for the same binding fraction is multiplied by
$$DR=1+B/K_B.$$
For B>0 the ideal Schild relation is
$$\log_{10}(DR-1)=$$
$$\log_{10}(B/[\mathrm M])+pA_2,$$
where pA₂=−log₁₀(Kʙ/[M]).`,
  idea:String.raw`PHARM6.1 and MATHBIO5.7 give the competitive binding partition. Requiring equal agonist occupancy with and without B yields the dose ratio. A fixed monotone transduction preserves the same equal-effect ratio if its other parameters are unchanged. Taking logarithms of the positive excess DR−1 gives a unit-slope line. A 1 µM antagonist constant corresponds to 10⁻⁶ M, so pA₂=6; changing the displayed concentration unit without changing this conversion would move the inferred intercept incorrectly.`,
  caption:String.raw`Increase free antagonist and compare the right-shifted binding curve with its no-antagonist reference. Inspect the ideal Schild line, molar intercept and current antagonist point.`,
  scope:String.raw`Own reversible equilibrium single-site competition. The unit slope is derived, not fitted to observed data. Infinite agonist can overcome this ideal competitor, but the finite concentration panel need not reach the shifted half-point or limiting occupancy. B=0 has no finite Schild ordinate.`,
  refs:["Buchwald 2019: selected competition and affinity concepts", "Own competitive partition and Schild derivation"],
  links:{"modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"},
  tags:["antagonism", "Schild"],
  viz:V.competitive,
 },
 {
  num:"6.9",
  kind:"Theorem",
  name:"Cheng–Prusoff equation: IC50 to Ki",
  deps:["pharm-6.8"],
  statement:String.raw`For a noncooperative equilibrium tracer assay with separately maintained free tracer L and free inhibitor I, reversible competition gives
$$IC_{50}=K_i(1+L/K_d).$$
Here IC50 is the free inhibitor concentration reducing bound tracer to half of its own no-inhibitor baseline. Consequently
$$K_i=\frac{IC_{50}}{1+L/K_d}.$$
The statement requires positive tracer and receptor signal. Supplied total concentrations in a depleted closed sample do not generally satisfy this reservoir formula.`,
  idea:String.raw`At fixed free tracer, bound tracer is proportional to (L/Kd)/(1+L/Kd+I/Ki). Divide this by its I=0 value and set the ratio to one-half; rearrangement proves the correction. In a closed sample, both free ligand pools instead depend on bound complexes and conserved totals. The view solves those balances and the true half-displacement input independently, exposing the error in applying the free-tracer correction to supplied totals.`,
  caption:String.raw`Choose maintained free ligands or closed total ligands. Change tracer, inhibitor and receptor inventories, compare normalized displacement, and inspect every free/bound component pool.`,
  scope:String.raw`Own single-site binding theorem and closed-sample comparison. Binding Kd is not silently identified with a general enzyme Km. No conversion of arbitrary functional IC50, nonequilibrium assay or clinical effect is claimed. At zero tracer or receptors the normalized signal and half-displacement input are undefined.`,
  refs:["CSPT: actual Cheng–Prusoff definition and stated hypotheses", "Own free-tracer derivation and conserved closed-species solution"],
  links:{"education": "https://pharmacologycanada.org/Cheng-Prusoff-equation"},
  tags:["Cheng-Prusoff", "assay"],
  viz:V.chengPrusoff,
 },
 {
  num:"6.10",
  kind:"Concept",
  name:"Non-competitive antagonism depresses E_max",
  deps:["pharm-6.8"],
  statement:String.raw`An insurmountable loss of functional receptors can reduce the maximal agonist response. In the declared operational example, retain fraction q of the original inventory and set τ₀=Rₜ/Kᴇ. Then
$$E_\infty(q)=\frac{q\tau_0}{1+q\tau_0},$$
$$EC_{50}(q)=\frac{K_d}{1+q\tau_0}.$$
This half-response expression requires positive remaining receptor inventory qRₜ. Thus receptor loss changes both the limiting response and its half-scale. With substantial reserve, the initial maximum loss may be small, but is not exactly zero.`,
  idea:String.raw`Use the competitive lesson as a contrast: increasing free agonist cannot restore receptors that have already been removed. Replacing Rₜ with qRₜ in the operational transducer gives both formulas. The maximum varies smoothly rather than remaining perfectly fixed until a sharp reserve threshold. Removing every receptor produces a zero curve; its response EC50 is then undefined, despite a finite limit of the algebraic expression from positive inventory.`,
  caption:String.raw`Move the surviving receptor fraction while comparing original and reduced-inventory curves. Examine the limiting response and half-scale across the entire removal range, including complete removal.`,
  scope:String.raw`Own irreversible receptor-removal mechanism applied before equilibrium transduction. Non-competitive antagonism is broader than this construction; an allosteric antagonist need not share these equations. No general claim of an unchanged EC50, measured irreversible rate or patient response is supplied.`,
  refs:["IUPHAR PEP: actual receptor reserve discussion", "Buchwald 2019: selected operational-model comparison", "Own retained-inventory algebra"],
  links:{"education": "https://pharmacologyeducation.org/receptors/", "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"},
  tags:["inactivation", "reserve"],
  viz:V.inactivation,
 },
 {
  num:"6.11",
  kind:"Model",
  name:"Allosteric modulators",
  deps:["pharm-6.1", "mathbio-5.9"],
  statement:String.raw`For one orthosteric and one allosteric site, an equilibrium binding polynomial can use
$$Z=1+a+b+\alpha ab,$$
with a=A/KA and b=B/KB. Here α multiplies the joint binding weight; α>1 favors co-binding. Orthosteric occupancy and a declared efficacy-weighted stimulus differ:
$$\theta_A=\frac{a+\alpha ab}{Z},$$
$$s=\frac{a+\alpha\beta ab}{Z}.$$
The displayed functional response is E=s/(Kᴇ+s). β can exceed one because stimulus is not a probability.`,
  idea:String.raw`MATHBIO5.9 and PHARM6.1 supply equilibrium partitioning. Enumerate unbound, A-only, B-only and doubly bound receptor states. Use the same coupling along either binding route so the square obeys equilibrium consistency. With β=0 a modulator can strengthen agonist binding while reducing functional response. The apparent binding constant approaches KA/α as B rises, while the functional limit also depends on efficacy and transduction.`,
  caption:String.raw`Vary modulator, binding cooperativity and joint-state efficacy independently. Compare agonist occupancy with functional response and the four state probabilities, including the no-modulator reference.`,
  scope:String.raw`Own one-modulator four-state ensemble. Our α is a joint-weight enhancement: it is the reciprocal of the dissociation-constant multiplier in the actually read Jakubík 2019 model. That convention, and the same coupling on both routes, are explicit. No allosteric agonism, fitted experimental data or reproduction of their extended two-modulator model is supplied.`,
  refs:["Jakubík et al. 2019: actual selected Introduction, Methods model and Figure 1 caption", "Own reciprocal-convention partition and efficacy/transduction example"],
  links:{"article": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0214255"},
  tags:["allostery", "efficacy"],
  viz:V.allosteric,
 },
 {
  num:"6.12",
  kind:"Concept",
  name:"Binding kinetics: on-rate, off-rate and residence time",
  deps:["pharm-6.1"],
  statement:String.raw`For one reversible binding reaction with maintained free ligand L,
$$\dot\theta=k_{\rm on}L(1-\theta)-k_{\rm off}\theta,$$
$$K_d=k_{\rm off}/k_{\rm on}.$$
Starting empty, loading relaxes at rate kₒₙL+kₒff. After complete ligand washout,
$$\theta(t_p+u)=\theta(t_p)e^{-k_{\rm off}u}.$$
The first-order mean residence time is 1/kₒff and the washout half-time is ln(2)/kₒff. Equal equilibrium Kd values need not imply equal kinetics.`,
  idea:String.raw`Balance arrivals to unoccupied sites against departure from occupied sites. Solve the constant-input linear equation over the pulse, then use its terminal occupancy as the initial condition for washout. Reducing koff tenfold while fixing Kd reduces kon tenfold as well: slower release comes with slower loading. A short pulse may therefore load the slow binder less, even though its subsequent release is slower. The concentration history must be plotted with its real abrupt switch rather than a fictitious ramp.`,
  caption:String.raw`Change a shared Kd, faster koff, pulse length and observation interval. Compare the actual maintained input and exact occupancy trajectories for rate pairs differing tenfold.`,
  scope:String.raw`Own first-order binding and complete-washout thought experiment. The free input is externally maintained, with no plasma distribution or rebinding. Residence time is a molecular model quantity rather than clinical effect duration. Zero pulse length or zero ligand gives no exposure; zero observation time is a valid initial state.`,
  refs:["IUPHAR PEP: actual equilibrium affinity explanation as a contrast", "Own kinetic mass action and exact piecewise solution"],
  links:{"education": "https://pharmacologyeducation.org/pharmacodynamics/"},
  tags:["kinetics", "residence-time"],
  viz:V.kinetics,
 },
 {
  num:"6.13",
  kind:"Concept",
  name:"Tolerance, tachyphylaxis and desensitization",
  deps:["pharm-6.2"],
  statement:String.raw`A declining effect at the same prescribed concentration can arise from changing receptor availability rather than changing drug exposure. Let A be the available fraction and θ=L/(Kd+L) the rapid binding fraction during exposure. The authored feedback example is
$$\dot A=k_{\rm rec}(1-A)-k_{\rm des}\theta A,$$
$$E=A\theta.$$
During an off interval θ=0. Available and desensitized fractions sum to one; recovery requires a positive recovery rate.`,
  idea:String.raw`Treat availability as a two-state population. Desensitization transfers occupied available receptors to the unavailable pool, while recovery returns unavailable receptors. On each constant-input interval, the scalar balance relaxes to krec/(krec+kdes θ) when the total rate is positive. Propagate its actual terminal state into the next interval rather than restarting at full availability. Continuous exposure and repeated pulses then distinguish effect loss during exposure from recovery between exposures.`,
  caption:String.raw`Switch between repeated pulses and continuous exposure. Change desensitization and recovery rates; compare the actual maintained input with availability, response and each pulse-onset response.`,
  scope:String.raw`Own illustrative pharmacodynamic availability mechanism with rapid binding, a fixed Kd and initially full availability. Actual clinical tolerance and tachyphylaxis have multiple mechanisms and timescales; this construction does not identify dependence, a clearance change or a treatment schedule. A fixed 60 min off tail displays recovery.`,
  refs:["IUPHAR PEP: complete actual desensitisation and tachyphylaxis body", "Own two-state availability propagation"],
  links:{"education": "https://pharmacologyeducation.org/desensitisation-and-tachyphylaxis/"},
  tags:["desensitization", "feedback"],
  viz:V.desensitization,
 },
 {
  num:"6.14",
  kind:"Method",
  name:"Drug combinations: isobolograms and Loewe additivity",
  deps:["pharm-6.2"],
  statement:String.raw`For two monotone single-agent curves with a common effect range, the Loewe additive reference equates their effect-specific equivalent doses:
$$\frac{A}{D_A(E)}+\frac{B}{D_B(E)}=1.$$
Dᴀ(E) and Dʙ(E) are concentrations that produce the same absolute effect E alone. At a fixed target this is a straight isobole in concentration coordinates, regardless of differing Hill slopes. Departure from this reference is a model- and assay-dependent interaction comparison, not by itself a clinical benefit.`,
  idea:String.raw`Invert each zero-baseline Hill curve at the common effect. For a mixture, solve the equivalent-dose sum for E; for a fixed target, vary one normalized concentration and solve for the other. Splitting one drug into two aliquots should reproduce its unsplit effect under the additive reference. The separate authored departure adds γuv/(u+v) to u+v, with u and v defined at the actual effect. Its sign changes reference-relative strength while preserving single-agent boundaries over the offered range.`,
  caption:String.raw`Choose both single-agent curves, mixture and target. Inspect the normalized isobole and a response profile obtained by scaling the selected mixture; compare the actual-effect equivalent-dose sum.`,
  scope:String.raw`Own Loewe construction plus a clearly declared monotone departure family with γ from −0.8 to 2. The actually read PLOS 2021 text supports the reference and drug-with-itself rationale, not this invented departure or an antibiotic-data reproduction. Both agents share baseline zero and limiting effect one. The zero-mixture equivalent-dose index is undefined.`,
  refs:["Kavčič et al. 2021: selected actual Loewe/Bliss, self-combination and no-double-bound text plus Figure 1 caption", "Own exact inverse curves, reference root and departure isobole"],
  links:{"article": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008529"},
  tags:["combinations", "Loewe"],
  viz:V.combinations,
 },
 {
  num:"6.15",
  kind:"Paper",
  name:"The Reaction between Acetyl Choline and Muscle Cells",
  deps:["mathbio-5.2"],
  paper:{"authors": "A. J. Clark", "year": 1926, "title": "The reaction between acetyl choline and muscle cells", "venue": "Journal of Physiology 61 (4): 530–546", "doi": "10.1113/jphysiol.1926.sp002314"},
  introduces:["pharm-6.1"],
  statement:String.raw`Clark's 1926 paper is associated with the quantitative concentration–action tradition. This lesson uses a modern mathematical comparison: proportional occupancy gives
$$E_{\rm prop}=M\frac{L}{K_d+L},$$
while a separate operational transducer gives E=C/(Kᴇ+C). Scale the proportional curve to the same chosen positive maximum M as the operational curve. Their maxima then agree while their half-response concentrations can differ. This comparison is newly authored, not a reconstruction of Clark's observations.`,
  idea:String.raw`PHARM6.1's underlying mass-action prerequisite supplies the binding law. Proportional response makes the own-half concentration equal to binding Kd. Saturating transduction instead gives Kd/(1+τ), so equal maxima and hyperbolic shapes cannot by themselves identify a microscopic mechanism. Viewing both absolute and own-normalized response makes the assumption visible. The distinct Buchwald 2019 discussion was actually read for this modern contrast; it does not verify the original 1926 body.`,
  caption:String.raw`Compare a modern proportional-occupancy curve with operational transduction at the same maximum. Change binding and transduction parameters, then inspect their absolute and normalized response panels.`,
  scope:String.raw`Original bibliographic identity was checked against the accessible archive entry. The actual original PDF returned reCAPTCHA; its body, figures and experimental data remain unread, with verification required. No original figure, assay fit, measured preparation or exact historical claim is reconstructed. The models use illustrative maintained free concentrations.`,
  refs:["Clark 1926: bibliographic record only; original body stopped/unread", "Buchwald 2019: distinct actual selected occupancy/operational discussion", "Own modern model comparison"],
  links:{"modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"},
  tags:["historical", "occupancy"],
  viz:V.historicalClark,
  verify:true,
 },
 {
  num:"6.16",
  kind:"Paper",
  name:"Some Quantitative Uses of Drug Antagonists",
  deps:["pharm-6.1"],
  paper:{"authors": "O. Arunlakshana and H. O. Schild", "year": 1959, "title": "Some quantitative uses of drug antagonists", "venue": "British Journal of Pharmacology and Chemotherapy 14 (1): 48–58", "doi": "10.1111/j.1476-5381.1959.tb00928.x"},
  introduces:["pharm-6.8"],
  statement:String.raw`Arunlakshana and Schild's 1959 paper is associated with quantitative antagonist analysis. This lesson constructs two modern synthetic agonist systems. Under the declared reversible single-site model,
$$DR_A=1+B/K_{B,A},$$
$$DR_C=1+B/K_{B,C}.$$
A shared antagonist constant gives equal ideal dose ratios despite different agonist affinities. Different constants give displaced ideal Schild lines. These are consequences of chosen inputs, not fits to the original paper's observations.`,
  idea:String.raw`Use PHARM6.1 to write the competing-state partition for each agonist. Hold an occupancy level fixed and compare its required free agonist concentration with and without antagonist. The dose ratio removes the agonist's own binding scale, leaving the antagonist term. Agreement between antagonist estimates is consistent with the assumed receptor model, but does not establish molecular identity or prove that a biological experiment meets all equilibrium assumptions. The line slopes here are derived exactly rather than estimated from data.`,
  caption:String.raw`Compare two agonists before and after a chosen antagonist. Switch between shared and different antagonist constants; inspect the resulting synthetic Schild relations and their molar pA2 intercepts.`,
  scope:String.raw`The frozen 1959 bibliographic record is preserved with verification required. Normal original-paper access stopped at reCAPTCHA; no original body, figure, assay data or original-slope estimate was read or reconstructed. The distinct 1997 reprint is not used to recover that same stopped body. This is an own ideal equilibrium comparison.`,
  refs:["Arunlakshana and Schild 1959: frozen bibliography; original body stopped/unread", "Own competitive equilibrium dose-ratio and two-agonist comparison"],
  links:{},
  tags:["historical", "Schild"],
  viz:V.historicalSchild,
  verify:true,
 },
 ],
};
