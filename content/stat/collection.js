// Collection metadata (see AUTHORING.md §0).
export default {
  id: "stat",
  short: "STAT",
  title: "Statistical Inference",
  field: "stats",
  area: "inference",
  order: 10,
  source: {
    type: "course",
    refs: ["Casella & Berger, Statistical Inference", "Wasserman, All of Statistics"]
  },
  blurb: String.raw`Sufficiency, estimation and its limits, maximum likelihood, hypothesis tests and the Neyman–Pearson lemma, confidence intervals, the bootstrap, Bayesian inference and linear models.`
};
