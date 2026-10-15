// Collection metadata (see AUTHORING.md §0).
export default {
  id: "imaging",
  short: "IMG",
  title: "Medical Imaging",
  field: "med",
  area: "technology",
  order: 40,
  source: {
    type: "course",
    refs: ["Prince & Links, Medical Imaging Signals and Systems", "Kak & Slaney, Principles of Computerized Tomographic Imaging"]
  },
  blurb: String.raw`Seeing inside the body: X-ray attenuation, computed tomography and the Radon transform, MRI and k-space, ultrasound and Doppler, nuclear imaging — and the reconstruction mathematics behind every picture.`
};
