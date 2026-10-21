// Bridge: one idea followed across collections and fields (MASTER_PLAN.md §8).
export default {
  slug: 'inverse-problems',
  title: 'Inverse problems: what can a measurement recover?',
  blurb: String.raw`Computing measurements from an object can be easy while recovering the object is ambiguous or unstable. Singular values show what noise can hide; deconvolution and tomography turn that warning into practical choices about resolution, information and regularization.`,
  steps: [
    { id: 'nla-3.1', note: String.raw`A condition number measures how much a small input perturbation can change the answer. Before choosing a reconstruction algorithm, ask whether the inverse problem itself amplifies measurement error.` },
    { id: 'nla-2.11', note: String.raw`The pseudoinverse exposes the vulnerable directions: reconstruction divides each measured singular component by $\sigma_i$. A small nonzero singular value can turn a small noise component into a large error; a zero one leaves an unobserved direction.` },
    { id: 'sig-3.13', note: String.raw`Deconvolution makes this concrete for a signal distorted by an echo. The causal inverse recursion exists algebraically, but for the example with $|a|\ge1$ it is unstable and can amplify noise without bound.` },
    { id: 'imaging-3.2', note: String.raw`In tomography the forward map takes an attenuation image to its line integrals. Each projection mixes many interior values, so reconstructing a slice asks for the inverse of an entire family of such measurements.` },
    { id: 'imaging-3.4', note: String.raw`The Fourier slice theorem explains what a projection reveals: its one-dimensional transform supplies a line through the image’s two-dimensional spectrum. Angles and detector sampling determine which frequencies are actually measured.` },
    { id: 'imaging-3.5', note: String.raw`Complete continuous Radon data uniquely determine the stated compact-support object class. That theorem must be kept distinct from finite sampled reconstruction; even continuous limited-angle data can be injective while their inverse is severely unstable.` },
    { id: 'imaging-3.8', note: String.raw`Windowing the projection ramp reduces its high-frequency response. Plancherel equates the squared norms of a finite-energy filter kernel and its transfer function in the stated Fourier normalization; ideal white noise itself is not an L² signal. The filter-noise heuristic and the measured ROI noise and edge widths of this finite sampled phantom are distinct.` },
    { id: 'nla-2.13', note: String.raw`Tikhonov regularization expresses a related tradeoff as a penalized least-squares problem. Its singular-value filters damp poorly measured directions instead of dividing by tiny numbers without restraint.` },
    { id: 'em-4.11', note: String.raw`Some ambiguities are more fundamental than noise: different spherically symmetric charge distributions with the same total charge have identical exterior fields. No exterior measurement or better solver can distinguish those interiors without extra information.` },
  ],
};
