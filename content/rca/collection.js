// Collection metadata (see AUTHORING.md §0).
export default {
  id: "rca",
  short: "RCA",
  title: "Real and Complex Analysis",
  field: "math",
  area: "analysis",
  order: 20,
  nick: "“Papa Rudin”",
  color: ["#c4442a", "#ff8a6b"],
  chapterLabels: {
    "0": "Prologue"
  },
  mapRows: [[0, 9, "real variables"], [10, 99, "complex variables"]],
  source: {
    type: "book",
    author: "Walter Rudin",
    title: "Real and Complex Analysis",
    edition: "3rd edition, 1987"
  },
  blurb: String.raw`Measure and integration done abstractly, L^p and Hilbert spaces, Banach-space techniques, complex measures, differentiation and Fourier analysis — then a full course in complex analysis, from Cauchy’s theorem through conformal mapping and H^p spaces to Banach algebras.`
};
