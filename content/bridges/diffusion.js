// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'diffusion',
  title: 'The random walk: how chance becomes diffusion',
  blurb: String.raw`Individual steps are unpredictable while a cloud of walkers spreads by a precise law. Gaussian probability, heat flow and transport through a membrane show the same balance between local motion and large-scale smoothing.`,
  steps: [
    { id: 'stoch-1.8', note: String.raw`A random walk chooses a neighboring vertex at each step. Its transition matrix gives a deterministic rule for updating the probability cloud even though each individual path is random.` },
    { id: 'stoch-5.8', note: String.raw`On a finite cycle, the lazy walk spreads until its law is close to uniform. Its mixing time lies between $n^2/32$ and $n^2$, giving a precise finite-domain version of the diffusive length-squared time scale. Holding with probability one half removes the periodicity of even cycles.` },
    { id: 'prob-6.2.1', note: String.raw`Time averages answer a related question about one stationary trajectory: Birkhoff's theorem makes an integrable observable's average converge almost surely to its conditional mean given the invariant events. Ergodicity makes that mean constant. This conclusion supplies no mixing-time rate.` },
    { id: 'prob-3.1.2', note: String.raw`For the symmetric walk on the line, the local limit theorem gives a Gaussian shape after rescaling distance by $\sqrt n$. The parity restriction of the lattice remains part of the exact statement.` },
    { id: 'pde-3.15', note: String.raw`In the Brownian model the mean-square displacement is $2kt$ and the probability density is the heat kernel. Averaging an initial profile over these random displacements solves the heat equation.` },
    { id: 'pde-1.4', note: String.raw`Combined with conservation, Fick's law gives the diffusion (heat) equation $u_t = D\,\Delta u$: the same equation for heat, dye and probability.` },
    { id: 'physio-1.3', note: String.raw`Across a homogeneous membrane, Fick’s law becomes a net transport rate proportional to area and concentration difference, and inversely proportional to thickness. The membrane partition coefficient and diffusivity determine its permeability.` },
    { id: 'pde-3.3', note: String.raw`A point deposit of heat spreads as a Gaussian of width $\sqrt{2kt}$. Its height falls while its total mass stays one: smoothing redistributes the quantity rather than destroying it.` },
    { id: 'pde-3.4', note: String.raw`Its solution is a convolution with a spreading Gaussian, the probability cloud of a single random walker.` },
    { id: 'pde-3.14', note: String.raw`For integrable heat profiles on the whole line, total heat is conserved while the squared-energy integral decreases. The cloud broadens and fine-scale variation fades, even though the integral of the profile is unchanged.` },
  ],
};
