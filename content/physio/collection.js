// Collection metadata (see AUTHORING.md §0).
export default {
  id: "physio",
  short: "PHYSIO",
  title: "Human Physiology",
  field: "med",
  area: "physiology",
  order: 10,
  source: {
    type: "course",
    refs: ["Guyton & Hall, Textbook of Medical Physiology", "Boron & Boulpaep, Medical Physiology", "Keener & Sneyd, Mathematical Physiology"]
  },
  blurb: String.raw`The body as a machine you can model: the heart as a pump, blood flow and pressure, gas exchange and oxygen binding, membrane potentials, the kidney as a filter, and hormonal feedback such as glucose–insulin control.`
};
