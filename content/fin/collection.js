// Collection metadata (see AUTHORING.md §0).
export default {
  id: "fin",
  short: "FIN",
  title: "Finance",
  field: "econ",
  area: "finance",
  order: 40,
  source: {
    type: "course",
    refs: ["Luenberger, Investment Science", "Hull, Options, Futures, and Other Derivatives", "Bodie, Kane & Marcus, Investments"]
  },
  blurb: String.raw`The time value of money, bonds and the yield curve, diversification and the efficient frontier, CAPM, options and arbitrage pricing, the binomial model and Black–Scholes, and the Kelly criterion.`
};
