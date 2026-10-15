// Collection metadata (see AUTHORING.md §0).
export default {
  id: "causal",
  short: "CAUSAL",
  title: "Causal Inference",
  field: "stats",
  area: "causality",
  order: 40,
  source: {
    type: "course",
    refs: ["Pearl, Causality", "Hernán & Robins, Causal Inference: What If"]
  },
  blurb: String.raw`Potential outcomes and causal graphs, d-separation, the back-door and front-door criteria, randomization, instrumental variables and the paradoxes that come from ignoring them.`
};
