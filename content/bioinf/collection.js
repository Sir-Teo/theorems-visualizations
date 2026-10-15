// Collection metadata (see AUTHORING.md §0).
export default {
  id: "bioinf",
  short: "BIOINF",
  title: "Bioinformatics Algorithms",
  field: "bio",
  area: "molecular",
  order: 40,
  source: {
    type: "course",
    refs: ["Durbin, Eddy, Krogh & Mitchison, Biological Sequence Analysis", "Compeau & Pevzner, Bioinformatics Algorithms"]
  },
  blurb: String.raw`Sequence alignment and its statistics, hidden Markov models, phylogenetic trees, genome assembly and the data structures behind fast search.`
};
