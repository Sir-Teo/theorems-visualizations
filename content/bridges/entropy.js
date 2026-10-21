// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'entropy',
  title: 'Entropy: counting, ignorance and information',
  blurb: String.raw`One formula, $-\sum p\ln p$, turned up three times: in steam engines, in the statistics of atoms, and in telephone lines. Following it shows why heat flows downhill, why erasing a bit costs energy, how compression works, and what a neural network minimizes when it learns.`,
  steps: [
    { id: 'thermo-2.1', note: String.raw`It starts with engines: no cyclic device can have the sole result of converting heat from one reservoir entirely into work. Equivalently, heat cannot move from cold to hot as the sole result of a process; the cycle and sole-result qualifications matter.` },
    { id: 'thermo-2.9', note: String.raw`Clausius found the quantity that law protects: $dS = \delta q_{\text{rev}}/T$ adds up to the same total along every reversible path, so entropy is a property of the state.` },
    { id: 'thermo-5.6', note: String.raw`Boltzmann explained what it counts: $S = k\ln W$, the logarithm of the number of microscopic arrangements that look the same from outside.` },
    { id: 'thermo-5.7', note: String.raw`The statistical account favors macrostates with vastly more microscopic arrangements. For macroscopic particle counts the odds can be overwhelming, while the underlying probabilistic statement still allows fluctuations.` },
    { id: 'thermo-6.6', note: String.raw`When the microstates are not equally likely, Gibbs's version weights them: $S = -k\sum_i p_i \ln p_i$.` },
    { id: 'pchem-5.4', note: String.raw`Mixing distinguishable perfect gases initially at the same temperature and pressure increases entropy by $-nR\sum_i x_i\ln x_i$. With no enthalpy change, that entropy increase lowers Gibbs energy by $T\Delta S$. Removing a partition between identical gases creates no extra species and no such mixing entropy.` },
    { id: 'info-1.2', note: String.raw`Shannon, studying telephone lines, needed a measure of surprise that adds over independent events, and arrived at the same expression in bits: $H = -\sum p\log_2 p$.` },
    { id: 'crypto-5.4', note: String.raw`Uncertainty can also authenticate. After one observed affine tag over a prime field, the remaining uniformly chosen keys make the tag of a fresh message uniform over p possibilities, with entropy log₂p and one-guess success probability1/p. Reusing the key for two distinct observed messages reveals it, so this exact guarantee is one-time.` },
    { id: 'info-4.6', note: String.raw`For independent symbols, sufficiently long lossless prefix-coded blocks approach entropy in expected bits per symbol. Entropy is the asymptotic benchmark, not the exact length of every finite message.` },
    { id: 'thermo-5.16', note: String.raw`Maxwell's demon seems to beat the second law by sorting fast and slow molecules. The resolution goes through information.` },
    { id: 'thermo-5.17', note: String.raw`Landauer links the two accounts: resetting an unbiased unknown bit in the stated thermal model dissipates at least $kT\ln 2$ of heat. The bound is approached by a quasistatic protocol; a finite-time reset can cost more.` },
    { id: 'thermo-6.7', note: String.raw`Turned around, entropy becomes a rule of inference: assume nothing beyond what you know. Maximizing entropy at fixed mean energy gives the Boltzmann distribution.` },
    { id: 'info-2.1', note: String.raw`The relative entropy $D(p\|q)$ measures the cost of believing $q$ when the truth is $p$; it is never negative.` },
    { id: 'info-3.14', note: String.raw`Applying the same Markov transition rule to two distributions cannot increase their relative entropy. Taking one distribution to be stationary makes divergence to equilibrium nonincreasing; ordinary entropy need not rise.` },
    { id: 'deep-1.9', note: String.raw`A classifier trained with cross-entropy loss is minimizing a divergence from the data: the same quantity, now steering gradient descent.` },
  ],
};
