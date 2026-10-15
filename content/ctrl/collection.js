// Collection metadata (see AUTHORING.md §0).
export default {
  id: "ctrl",
  short: "CTRL",
  title: "Control Theory",
  field: "eng",
  area: "signals",
  order: 20,
  source: {
    type: "course",
    refs: ["Åström & Murray, Feedback Systems (2nd ed.)", "Franklin, Powell & Emami-Naeini, Feedback Control of Dynamic Systems"]
  },
  blurb: String.raw`Feedback and PID control, stability criteria (Routh–Hurwitz, Nyquist), frequency response, state-space models, controllability and observability, pole placement, LQR and the Kalman filter.`
};
