// Collection metadata (see AUTHORING.md §0).
export default {
  id: "pharm",
  short: "PHARM",
  title: "Pharmacology",
  field: "med",
  area: "pharmacology",
  order: 20,
  source: {
    type: "course",
    refs: ["Rowland & Tozer, Clinical Pharmacokinetics and Pharmacodynamics", "Goodman & Gilman, The Pharmacological Basis of Therapeutics"]
  },
  blurb: String.raw`What the body does to a drug and what the drug does to the body: absorption, distribution and elimination, half-life and dosing regimens, dose–response curves, receptor occupancy and the therapeutic window.`
};
