// Collection metadata (see AUTHORING.md §0).
export default {
  id: "robot",
  short: "ROBOT",
  title: "Robotics",
  field: "eng",
  area: "mechanical",
  order: 50,
  source: {
    type: "course",
    refs: ["Lynch & Park, Modern Robotics", "Siciliano et al., Robotics: Modelling, Planning and Control"]
  },
  blurb: String.raw`Rigid-body motions and the exponential map, forward and inverse kinematics, velocity kinematics and singularities, dynamics, and motion planning.`
};
