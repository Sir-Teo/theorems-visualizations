// Collection metadata (see AUTHORING.md §0).
export default {
  id: "deep",
  short: "DL",
  title: "Deep Learning Theory",
  field: "stats",
  area: "learning",
  order: 30,
  source: {
    type: "course",
    refs: ["Prince, Understanding Deep Learning", "Goodfellow, Bengio & Courville, Deep Learning"]
  },
  blurb: String.raw`Neural networks as function approximators: universal approximation, backpropagation, optimization landscapes, initialization and normalization, generalization and double descent, convolution and attention.`
};
