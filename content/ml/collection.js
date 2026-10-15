// Collection metadata (see AUTHORING.md §0).
export default {
  id: "ml",
  short: "UML",
  title: "Understanding Machine Learning",
  field: "stats",
  area: "learning",
  order: 20,
  source: {
    type: "book",
    author: "Shai Shalev-Shwartz & Shai Ben-David",
    title: "Understanding Machine Learning: From Theory to Algorithms",
    edition: "2014",
    license: "free PDF from the authors",
    url: "https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
  },
  chapterLabels: { 32: "Appendix A", 33: "Appendix B", 34: "Appendix C" },
  blurb: String.raw`Why learning works: PAC learning, uniform convergence, VC dimension, the bias–complexity trade-off, linear predictors, boosting, convex learning and stochastic gradient descent, kernels and SVMs.`
};
