// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'entropy',
  title: 'Entropy: counting, ignorance and information',
  blurb: String.raw`One formula, $-\sum p\ln p$, turned up three times: in steam engines, in the statistics of atoms, and in telephone lines. Following it shows why heat flows downhill, why erasing a bit costs energy, how compression works, and what a neural network minimizes when it learns.`,
  steps: [
    { id: 'thermo-2.1', note: String.raw`It starts with engines: no cyclic device can take heat from a single reservoir and turn it entirely into work, and heat never flows unaided from cold to hot. Two equivalent statements of one law.` },
    { id: 'thermo-2.9', note: String.raw`Clausius found the quantity that law protects: $dS = \delta q_{\text{rev}}/T$ adds up to the same total along every reversible path, so entropy is a property of the state.` },
    { id: 'thermo-5.6', note: String.raw`Boltzmann explained what it counts: $S = k\ln W$, the logarithm of the number of microscopic arrangements that look the same from outside.` },
    { id: 'thermo-5.7', note: String.raw`So the second law is a statement about odds: macrostates with more arrangements are overwhelmingly more likely, although fluctuations are still possible; for a macroscopic number of particles large departures are extraordinarily unlikely.` },
    { id: 'thermo-6.6', note: String.raw`When the microstates are not equally likely, Gibbs's version weights them: $S = -k\sum_i p_i \ln p_i$.` },
    { id: 'info-1.2', note: String.raw`Shannon, studying telephone lines, needed a measure of surprise that adds over independent events, and arrived at the same expression in bits: $H = -\sum p\log_2 p$.` },
    { id: 'info-4.6', note: String.raw`It is not just a definition: for an independent identically distributed source, entropy is the asymptotic expected lossless coding rate in bits per symbol. Finite-block codes have overhead, and the lower bound concerns expected length.` },
    { id: 'thermo-5.16', note: String.raw`Maxwell's demon seems to beat the second law by sorting fast and slow molecules. The resolution goes through information.` },
    { id: 'thermo-5.17', note: String.raw`Landauer: isothermally resetting an unknown unbiased memory bit to a standard state releases at least $kT\ln 2$ of heat in the ideal model. A cyclic demon must also restore its memory, so information processing enters the thermodynamic balance.` },
    { id: 'thermo-6.7', note: String.raw`Turned around, entropy becomes a rule of inference: assume nothing beyond what you know. Maximizing entropy at fixed mean energy gives the Boltzmann distribution.` },
    { id: 'info-2.1', note: String.raw`The relative entropy $D(p\|q)$ measures the cost of believing $q$ when the truth is $p$; it is never negative.` },
    { id: 'info-3.14', note: String.raw`In a Markov chain the divergence to the stationary distribution can only shrink: the second law, recast for any random process.` },
    { id: 'deep-1.9', note: String.raw`A classifier trained with cross-entropy loss is minimizing a divergence from the data: the same quantity, now steering gradient descent.` },
    { id: 'qm-14.5', note: String.raw`For a bipartite pure quantum state, the von Neumann entropy of either reduced state measures its entanglement with the other part. For mixed states that entropy also includes other uncertainty.` },
    { id: 'rel-10.16', note: String.raw`And at the edge of physics, a black hole has entropy proportional to the area of its horizon, $S = kA/4\ell_P^2$. Relating horizon entropy to a general bound requires further physical assumptions.` },
  ],
};
