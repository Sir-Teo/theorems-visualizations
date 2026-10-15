// Collection metadata (see AUTHORING.md §0).
export default {
  id: "algo",
  short: "ALGO",
  title: "Algorithms",
  field: "cs",
  area: "algorithms",
  order: 10,
  source: {
    type: "course",
    refs: ["Cormen, Leiserson, Rivest & Stein, Introduction to Algorithms (4th ed.)", "Erickson, Algorithms (CC BY 4.0)", "Kleinberg & Tardos, Algorithm Design"]
  },
  blurb: String.raw`Correctness and running time of the classical algorithms: sorting and its lower bound, divide and conquer, dynamic programming, greedy algorithms, graph search, shortest paths, spanning trees, network flow, amortized analysis, randomization and the FFT.`
};
