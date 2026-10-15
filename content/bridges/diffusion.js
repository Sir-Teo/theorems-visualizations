// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'diffusion',
  title: 'The random walk: from pollen grains to option prices',
  blurb: String.raw`A particle kicked at random goes nowhere on average, yet spreads like $\sqrt t$. That one fact links Brown's jiggling pollen, the heat equation, Einstein's count of atoms, the size of living cells, the price of options and the image generators of modern AI.`,
  steps: [
    { id: 'thermo-7.8', note: String.raw`In 1827 Robert Brown saw pollen grains jiggling in water, endlessly and for no visible reason.` },
    { id: 'thermo-7.9', note: String.raw`A random walk of $n$ independent steps ends about $\sqrt n$ steps from home: displacement averages to zero, but its square grows linearly.` },
    { id: 'thermo-7.10', note: String.raw`Einstein (1905) tied the spreading rate to temperature and friction, $D = \mu k T$, so watching the jiggling measures Boltzmann's constant and counts atoms.` },
    { id: 'thermo-7.6', note: String.raw`Averaged over many walkers, randomness becomes a law: the flux runs down the concentration gradient, $J = -D\nabla c$.` },
    { id: 'pde-1.4', note: String.raw`Combined with conservation, Fick's law gives the diffusion (heat) equation $u_t = D\,\Delta u$: the same equation for heat, dye and probability.` },
    { id: 'pde-3.4', note: String.raw`Its solution is a convolution with a spreading Gaussian, the probability cloud of a single random walker.` },
    { id: 'stoch-13.2', note: String.raw`Donsker: rescaled random walks converge to one universal limit, Brownian motion, whatever the step distribution.` },
    { id: 'stoch-13.5', note: String.raw`Its paths are continuous but nowhere differentiable: zoom in anywhere and they look just as rough.` },
    { id: 'stoch-13.16', note: String.raw`Brownian motion solves boundary-value problems: the harmonic function at a point is the average boundary value where a walker started there first hits.` },
    { id: 'mathbio-8.4', note: String.raw`Because the time to diffuse grows as length squared, diffusion is fast across a cell and hopeless across a body, one reason cells are small and animals have blood vessels.` },
    { id: 'pde-9.8', note: String.raw`Add growth to diffusion and you get travelling fronts (Fisher–KPP): the spread of an advantageous gene or an invading species.` },
    { id: 'stoch-13.14', note: String.raw`Let the walk be multiplicative and you get geometric Brownian motion, the standard model of a stock price.` },
    { id: 'fin-9.3', note: String.raw`Black and Scholes priced an option on such a stock; a change of variables turns their equation into the heat equation.` },
    { id: 'deep-10.10', note: String.raw`Diffusion models generate images by learning to run the process backwards, turning noise step by step into a picture.` },
  ],
};
