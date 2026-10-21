// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'fourier',
  title: 'Fourier: one idea, many fields',
  blurb: String.raw`Breaking a signal into pure frequencies links orthogonal approximation, resonance, musical timbre and fast computation. The same coefficients describe how much energy sits in each harmonic, how an oscillator responds, and how convolution becomes multiplication.`,
  steps: [
    { id: 'pma-8.10', note: String.raw`A periodic function is projected onto sines and cosines; each coefficient measures how much of one frequency the function contains.` },
    { id: 'pma-8.11', note: String.raw`Truncating the series gives the best approximation in the mean-square sense, which is why a few harmonics already capture most of a shape.` },
    { id: 'pma-8.16', note: String.raw`Parseval: the energy of the function equals the sum of the energies of its harmonics. Nothing is lost in the translation to frequencies.` },
    { id: 'xtal-5.5', note: String.raw`For a square-integrable lattice-periodic density, the reciprocal-lattice plane waves give a complete orthogonal expansion over a primitive cell. The convergence is in mean square; pointwise convergence needs additional hypotheses.` },
    { id: 'rca-9.1', note: String.raw`Non-periodic signals get a continuous spectrum: the Fourier transform replaces the sum over harmonics with an integral over all frequencies.` },
    { id: 'rca-9.13', note: String.raw`Plancherel extends the transform to every finite-energy signal and keeps energy exactly, making it a rotation of $L^2$.` },
    { id: 'xtal-5.6', note: String.raw`An infinite lattice of point masses requires distributions rather than an ordinary finite-energy transform. In the cycles-per-length convention, its transform is the reciprocal point lattice weighted by the inverse direct-cell volume. A finite crystal instead produces broadened peaks.` },
    { id: 'mech-4.12', note: String.raw`A driven oscillator responds to each harmonic of a periodic force separately; resonance picks out the harmonic closest to the natural frequency.` },
    { id: 'music-2.6', note: String.raw`A vibrating string supports only whole-number multiples of its fundamental: the harmonic series is a Fourier series that nature plays.` },
    { id: 'music-4.2', note: String.raw`For a steady periodic tone, the Fourier coefficients describe its harmonic amplitudes and phases. Different harmonic balances help distinguish instrumental sounds; a changing attack or decay also needs a description over time.` },
    { id: 'music-4.4', note: String.raw`Parseval again, now for sound pressure: a tone’s mean-square pressure is the sum of the harmonic contributions. Phases can change peaks, but not that mean square; perceived loudness also involves hearing.` },
    { id: 'algo-4.11', note: String.raw`The fast Fourier transform computes $n$ frequency components in $O(n\log n)$ steps instead of $O(n^2)$, by halving the problem with roots of unity.` },
    { id: 'qinfo-5.1', note: String.raw`On the finite bit-string group, the Hadamard transform uses the characters $(-1)^{x\cdot y}$ with normalization $1/\sqrt{2^n}$. Their orthogonality makes the transform unitary and allows interference to reveal selected function properties. A measurement still returns one outcome; superposition does not reveal the entire truth table.` },
    { id: 'algo-4.15', note: String.raw`Multiplying two huge integers is a convolution of their digits, and convolution is multiplication of spectra: the FFT turns arithmetic into signal processing.` },
  ],
};
