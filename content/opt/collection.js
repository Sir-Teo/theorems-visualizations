// Collection metadata (see AUTHORING.md §0).
export default {
  id: "opt",
  short: "OPT",
  title: "Optimization",
  field: "math",
  area: "applied",
  order: 210,
  source: {
    type: "course",
    refs: ["Boyd & Vandenberghe, Convex Optimization", "Nocedal & Wright, Numerical Optimization"]
  },
  blurb: String.raw`Convex sets and functions, duality and the KKT conditions, linear programming and the simplex method, gradient and Newton methods, and interior-point algorithms.`
};
