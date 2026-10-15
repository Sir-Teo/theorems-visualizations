// Collection metadata (see AUTHORING.md §0).
export default {
  id: "info",
  short: "INFO",
  title: "Information & Coding Theory",
  field: "cs",
  area: "information",
  order: 40,
  source: {
    type: "course",
    refs: ["Cover & Thomas, Elements of Information Theory", "MacKay, Information Theory, Inference, and Learning Algorithms"]
  },
  blurb: String.raw`Entropy, mutual information and divergence, source coding and Huffman codes, the asymptotic equipartition property, channel capacity and the noisy-channel coding theorem, error-correcting codes and rate–distortion.`
};
