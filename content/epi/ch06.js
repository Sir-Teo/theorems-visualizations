// Bias: authored probability populations, explicit estimands and source boundaries.
import * as V from './ch06.viz.js';
export default {
 collection:'epi',chapter:6,title:'Bias',
 summary:'Increasing a study’s size can reduce sampling variation while leaving an error in its data-generating mechanism. Follow the same population through participation, employment and exposure recording; distinguish assumptions that force attenuation from mechanisms that can reverse an association. A synthetic sortie model shows what returning observations omit, without treating historical illustrations as measured data.',
 items:[
 {
  num:'6.1',kind:'Concept',name:'Random versus systematic error',deps:[],
  statement:String.raw`For an estimator of a declared population quantity, random error is variation across repeated samples; bias is its expectation minus that quantity. These are different properties. In this authored model the target risk is p, while a recording mechanism replaces a fraction b of Bernoulli outcomes with independent Bernoulli(c) records:
$$q=(1-b)p+bc.$$
For n independent records and their mean $\hat p$,
$$\mathbb E[\hat p]=q,\qquad \operatorname{Bias}(\hat p)=q-p,$$
$$\operatorname{Var}(\hat p)=\frac{q(1-q)}{n},$$
$$\operatorname{MSE}(\hat p)=\frac{q(1-q)}{n}+(q-p)^2.$$
With this mechanism fixed, increasing n removes the variance term, but does not remove a nonzero bias.`,
  idea:String.raw`The binomial law follows by summing independent recorded outcomes. Expand the squared estimation error around its expectation: the cross term averages to zero, leaving variance plus squared bias. The exact sampling distribution and a finite set of 80 repeated studies answer different questions: their empirical center can miss q. Better precision around the recorded-data mean does not by itself recover p. Conversely, this example does not imply that every bias is independent of sample size; other estimators and mechanisms can have size-dependent bias.`,
  caption:String.raw`Change the study size, contamination and replacement probability. Compare the exact binned sampling distribution with 80 fixed-seed repetitions, then follow the separate variance, squared-bias and MSE curves.`,
  scope:String.raw`Own independent binary-recording model over one common observation period. Histogram bars aggregate exact binomial probabilities into declared one-percentage-point bins; they are not a Gaussian approximation or confidence interval. Zero variance and zero bias remain exact zeros and have no logarithmic height. The finite repetitions are illustrative simulations, not actual epidemiologic studies.`,
  refs:['NIST e-Handbook: actual Bias and Accuracy body and selected glossary entries','Own binomial recording model and squared-error decomposition'],
  links:{education:'https://www.itl.nist.gov/div898/handbook/mpc/section1/mpc113.htm'},tags:['sampling','bias','precision'],viz:V.randomError,
 },
 {
  num:'6.2',kind:'Concept',name:'Selection bias',deps:['causal-3.10'],
  statement:String.raw`Let E and Y be binary exposure and outcome, and S indicate participation. Write $p_{ey}=P(E=e,Y=y)$ and $s_{ey}=P(S=1\mid E=e,Y=y)$. If participation has positive total probability, the participant cell probabilities $p^S_{ey}$ satisfy
$$p^S_{ey}=\frac{p_{ey}s_{ey}}{Z},$$
$$Z=\sum_{e,y}p_{ey}s_{ey}.$$
When all four population cells and participation probabilities are positive,
$$\mathrm{OR}_{\rm selected}=\mathrm{OR}_{\rm full}\,B_S,$$
$$B_S=\frac{s_{11}s_{00}}{s_{10}s_{01}}.$$
Conditioning on participation can strengthen, weaken, reverse or preserve an exposure–outcome association.`,
  idea:String.raw`CAUSAL3.10 illustrates one collider-selection mechanism. Here each cell passes through its own gate. The normalizing probability of participation cancels from the cross-product odds ratio, leaving the displayed selection factor. Its value depends on the whole four-cell pattern, not merely on whether both exposure and outcome influence participation. In particular, multiplicatively separable participation probabilities can depend on both variables while giving $B_S=1$. A changed population composition, a changed odds ratio and an external-validity question are related but distinct.`,
  caption:String.raw`Move the four participation gates and compare full-population and participant cell probabilities. Sweep the joint E+,Y+ gate while keeping the other three fixed; watch the selected log odds ratio cross, approach or depart from the population reference.`,
  scope:String.raw`Own probability population with no finite sampling noise. ORs describe associations, with no causal identification claim. The factor identity requires positive cells and gates; boundary states can produce a zero, an unbounded ratio, an empty exposure group or no participants. Those conditions are reported explicitly rather than replaced by pseudocounts or plotting caps.`,
  refs:['Catalogue of Bias2017: actual selected selection-bias body','Own four-cell conditional-sampling derivation'],
  links:{education:'https://catalogofbias.org/biases/selection-bias/'},tags:['selection','collider','odds-ratio'],viz:V.selection,
 },
 {
  num:'6.3',kind:'Phenomenon',name:'Healthy worker effect',deps:['epi-6.2'],
  statement:String.raw`A workforce can have lower crude outcome risk than the general population even when employment raises risk within every baseline-health group. This authored population has two health strata H. Employment probabilities differ by H, and the baseline outcome risk $r_h$ changes under employment to
$$r_h(1)=r_h+\delta(1-r_h).$$
Here $0\leq\delta\leq1$ is the occupational fraction of the remaining risk.
The general population includes both employed and non-employed people. Its observed risk therefore differs from a counterfactual comparison standardized to the same declared health mixture. The standardized risk difference is
$$\sum_h P(H=h)\,[r_h(1)-r_h].$$
It is nonnegative here, even when the crude worker-minus-population difference is negative.`,
  idea:String.raw`Employment changes which baseline-health strata enter the workforce. Mixing those strata with their employment-specific weights can outweigh the positive within-stratum occupational increment. EPI6.2 motivates checking who is observed; this example also makes baseline health a common cause of employment and outcome. It is one healthy-worker selection mechanism, rather than a claim that all healthy-worker effects share the same causal diagram. Because the complete model is known, we can compute both employment counterfactuals at the full population’s health mix. That computation would require additional assumptions and information in an actual study.`,
  caption:String.raw`Change baseline vulnerability, employment by health, baseline risks and the occupational increment. Compare the resulting health mixtures, then see the crude and standardized risk differences as the same occupational parameter changes.`,
  scope:String.raw`Synthetic single population with a binary baseline-health variable and a common outcome period. No measured mortality series, clinical prediction or identification from crude risks alone. Empty employed or non-employed groups have no group risk. Standardization uses the explicitly known population health weights; it does not repair unmeasured health differences in observational data automatically.`,
  refs:['NIOSH nurse-training Module3p15: actual self-selection discussion, reviewed2020','Own enumerated health–employment–outcome population'],
  links:{education:'https://www.cdc.gov/niosh/work-hour-training-for-nurses/longhours/mod3/15.html'},tags:['selection','standardization','occupational-health'],viz:V.healthyWorker,
 },
 {
  num:'6.4',kind:'Concept',name:'Non-differential misclassification biases toward the null',deps:['epi-3.2','epi-2.1'],
  statement:String.raw`The title has conditional scope. Let true binary exposure E have prevalence $0<p<1$ and outcome risks $r_1,r_0$, with $r_0>0$. Record exposure as E* with sensitivity Se and specificity Sp, independently of outcome conditional on E. This uses true exposure as the reference, rather than disease in EPI2.1. If both recorded groups exist, their risks are
$$r^*_+=r_0+(r_1-r_0)w_+,$$
$$r^*_- =r_0+(r_1-r_0)w_-,$$
where $w_+=P(E=1\mid E^*=1)$ and $w_-=P(E=1\mid E^*=0)$. For an informative classifier, $\mathrm{Se}+\mathrm{Sp}>1$, $0\leq w_-\leq w_+\leq1$. Consequently the recorded risk ratio lies between the true risk ratio and 1.`,
  idea:String.raw`Apply the same recording matrix separately within cases and non-cases. Bayes’ theorem gives the two posterior exposure mixtures. Each recorded risk is a convex combination of the two true risks, and an informative classifier orders those mixtures correctly; taking their ratio proves the stated bound. At $\mathrm{Se}+\mathrm{Sp}=1$, recording erases the association when groups exist. Below chance, exposure labels can reverse the direction. EPI3.2 supplies the risk-ratio target; this lesson supplies the additional classification assumptions needed for attenuation.`,
  caption:String.raw`Move sensitivity and specificity, including below-chance values. Inspect the true-exposure composition of each recorded group and the recorded log risk ratio as sensitivity crosses the chance boundary.`,
  scope:String.raw`Own binary-exposure classification model, common outcome period and no confounding or other error mechanism. The attenuation statement is about its population risk ratio, with positive required denominators. It is not a universal theorem for multicategory exposure, outcome misclassification, adjusted estimates, correlated errors or finite-sample estimates. Perfect, reversed, empty-group and zero-risk states retain their separate meanings.`,
  refs:['Catalogue of Bias2018: actual selected misclassification body and general-direction qualification','Own binary-exposure posterior-mixture proof'],
  links:{education:'https://catalogofbias.org/biases/misclassification-bias/'},tags:['misclassification','risk-ratio','assumptions'],viz:V.misclassification,
 },
 {
  num:'6.5',kind:'Phenomenon',name:'Recall bias',deps:['epi-6.4'],
  statement:String.raw`Recall bias can arise when reported past exposure differs systematically by outcome status. Let $\mathrm{Se}_y=P(E^*=1\mid E=1,Y=y)$ and $\mathrm{Sp}_y=P(E^*=0\mid E=0,Y=y)$. The recorded exposed-outcome cell is
$$p^*_{1y}=\mathrm{Se}_y p_{1y}+(1-\mathrm{Sp}_y)p_{0y},$$
and the complementary recorded cell is
$$p^*_{0y}=(1-\mathrm{Se}_y)p_{1y}+\mathrm{Sp}_y p_{0y}.$$
Different recording matrices in cases and non-cases can inflate, attenuate, erase, preserve or reverse an exposure–outcome odds ratio. Differential recall alone does not specify the direction.`,
  idea:String.raw`EPI6.4 uses one nondifferential matrix. Here each outcome group has its own sensitivity and specificity, while the actual exposure and outcome population remains fixed. Track all eight true-exposure, outcome and reported-exposure categories and sum over true exposure. Better recall of true exposures in cases can raise their reported exposure prevalence, but false-positive reporting and the corresponding rates in non-cases also matter. The displayed OR compares exposure odds in cases and non-cases; it is an associational target in this constructed population.`,
  caption:String.raw`Change the two groups’ reporting rates independently. Compare their true and recorded exposure proportions, then sweep case sensitivity while keeping all other rates fixed to reveal which direction the apparent association moves.`,
  scope:String.raw`Synthetic reporting mechanism; no real patients, interviews or historical clinical examples. Recall bias is one source of differential information error, not a diagnosis from an observed OR. Equal rates reduce this model to nondifferential exposure misclassification. Outcome-only case-control sampling preserves the population OR only under its usual within-outcome sampling conditions. Empty outcome groups and zero cross-products remain undefined or unbounded, without continuity corrections.`,
  refs:['Catalogue of Bias2017: actual selected recall-bias body','Own outcome-specific binary recording enumeration'],
  links:{education:'https://catalogofbias.org/biases/recall-bias/'},tags:['recall','information-bias','odds-ratio'],viz:V.recall,
 },
 {
  num:'6.8',kind:'Phenomenon',name:'Survivorship bias (Wald’s bombers)',deps:['epi-6.2'],
  statement:String.raw`Observations from returning aircraft are conditional on return. In this newly authored model, region i receives an independent Poisson number of hits with mean $\lambda_i$; each hit has an independent probability $q_i$ of preventing return. Splitting hits into fatal and nonfatal categories gives
$$P(\text{return})=\exp\!\left(-\sum_i\lambda_iq_i\right),$$
$$\mathbb E[N_i\mid\text{return}]=\lambda_i(1-q_i).$$
Sparse holes among returners can reflect high loss probability, little incoming exposure, or both. Returning damage alone does not identify those two mechanisms.`,
  idea:String.raw`EPI6.2 explains conditioning on a selection event. Here return requires zero fatal hits in every region, while independent nonfatal Poisson counts remain visible. Compare two mechanisms with the same conditional mean holes: one changes loss probability, the other incoming exposure. Their return fractions can differ; knowing total sorties and losses supplies additional information, though it does not generally identify all regional parameters. Wald’s collected wartime memoranda, reissued by CNA in1980, explicitly use total sorties and returned hit counts under stated assumptions. The familiar modern red-dot aircraft is not treated here as his measured dataset or original figure.`,
  caption:String.raw`Inspect 100 synthetic sorties, select an aircraft and reveal either returning observations or the complete simulated fleet. Change regional loss probabilities, then switch to an alternate exposure mechanism with the same expected survivor holes. Compare exact expectations with the finite fleet’s means.`,
  scope:String.raw`Own schematic geometry, invented damage and independent Poisson-thinning mechanism, with no historical aircraft measurements, reconstructed Wald inference, armor optimization or operational engineering advice. A finite fleet can have no survivors even while its model return probability is positive; its survivor mean is then undefined. Original CNA reading is limited to selected frontmatter/PartI pages; no claim of reading all100 pages.`,
  refs:['Wald, A Method of Estimating Plane Vulnerability, CNA1980: actual selected frontmatter/PartI text and printed1/6 images','Own independent regional Poisson-thinning model and synthetic fleet'],
  links:{source:'https://www.cna.org/analyses/1980/a-method-of-estimating-plane-vulnerability'},tags:['survivorship','selection','missing-observations'],viz:V.survivorship,
 }
 ]
};
