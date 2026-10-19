// Bridge: one idea followed across collections and fields (MASTER_PLAN.md §8).
export default {
  slug: 'causality',
  title: 'Causality: which comparison answers the question?',
  blurb: String.raw`A rate can reverse when populations are pooled, and an adjusted association can become more biased. Moving from demographic comparisons to treatment effects requires an explicit intervention, assumptions that connect it to observed data, and a graph that says which variables to compare.`,
  steps: [
    { id: 'demo-1.8', note: String.raw`Crude death rates mix age-specific risks with each population’s age structure. A younger population can have a lower overall death rate even while its rate is higher within every age group: the weights change the comparison.` },
    { id: 'epi-4.6', note: String.raw`When a common cause influences both exposure and disease, a crude association mixes different mechanisms. Stratification can remove this confounding under the model’s assumptions, but mediators and colliders call for different treatment.` },
    { id: 'causal-1.1', note: String.raw`Potential outcomes first define the target: compare what would happen to the same unit under two well-defined interventions. Only the outcome under the treatment actually received is observed.` },
    { id: 'causal-2.1', note: String.raw`Randomization makes treatment independent of potential outcomes by design. It removes systematic selection into treatment, although a finite trial can still have chance imbalance.` },
    { id: 'causal-1.9', note: String.raw`For observational data, standardization identifies a mean intervention outcome if conditional exchangeability, positivity and consistency hold. These assumptions justify averaging comparable treatment groups with one common covariate distribution.` },
    { id: 'causal-4.3', note: String.raw`A causal graph supplies one sufficient rule for finding such a comparison: a back-door adjustment set blocks paths entering the treatment and excludes its descendants. The rule depends on the graph being an appropriate causal model.` },
    { id: 'causal-4.5', note: String.raw`More adjustment is not automatically better. Conditioning on a pre-treatment collider can open a previously closed path and create bias even when the unadjusted comparison already identifies the effect.` },
    { id: 'causal-4.10', note: String.raw`Some causal questions have no answer from the observational law alone: compatible models can agree on every observed probability and disagree after intervention. In the stated model class, completeness of do-calculus separates identifiable effects from this genuine ambiguity.` },
    { id: 'epi-4.17', note: String.raw`Bradford Hill’s viewpoints return the formal story to scientific evidence. Temporality, mechanism, dose response and intervention evidence help assess a causal account, but his nine viewpoints are not a checklist that proves it.` },
  ],
};
