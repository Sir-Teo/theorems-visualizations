// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'fourier',
  title: 'Fourier: one idea, many fields',
  blurb: String.raw`Breaking a signal into pure frequencies began as a tool for heat flow. It became the analyst's theory of orthogonal expansions, the physicist's resonance, the musician's timbre, the engineer's sampling theorem and the computer scientist's fastest algorithm.`,
  steps: [
    { id: 'pma-8.10', note: String.raw`A periodic function is projected onto sines and cosines; each coefficient measures how much of one frequency the function contains.` },
    { id: 'pma-8.11', note: String.raw`Truncating the series gives the best approximation in the mean-square sense, which is why a few harmonics already capture most of a shape.` },
    { id: 'pma-8.16', note: String.raw`Parseval: the energy of the function equals the sum of the energies of its harmonics. Nothing is lost in the translation to frequencies.` },
    { id: 'rca-9.1', note: String.raw`Non-periodic signals get a continuous spectrum: the Fourier transform replaces the sum over harmonics with an integral over all frequencies.` },
    { id: 'rca-9.13', note: String.raw`Plancherel extends the transform to every finite-energy signal and keeps energy exactly, making it a rotation of $L^2$.` },
    { id: 'mech-4.12', note: String.raw`A driven oscillator responds to each harmonic of a periodic force separately; resonance picks out the harmonic closest to the natural frequency.` },
    { id: 'music-2.6', note: String.raw`A vibrating string supports only whole-number multiples of its fundamental: the harmonic series is a Fourier series that nature plays.` },
    { id: 'music-4.2', note: String.raw`What distinguishes a violin from a flute on the same note is the set of Fourier coefficients: timbre is a spectrum.` },
    { id: 'music-4.4', note: String.raw`Parseval again, now for sound: mean-square signal amplitude is the sum of the mean-square harmonic contributions. Perceived loudness also depends on frequency and hearing.` },
    { id: 'music-12.2', note: String.raw`The sampling theorem: a finite-energy signal band-limited to $[-B,B]$ is determined by uniform samples at spacing $1/(2B)$. Sampling faster provides margin; a spectral line exactly at the Nyquist edge needs special care. Digital audio rests on it.` },
    { id: 'algo-4.11', note: String.raw`The fast Fourier transform computes $n$ frequency components in $O(n\log n)$ steps instead of $O(n^2)$, by halving the problem with roots of unity.` },
    { id: 'algo-4.15', note: String.raw`Multiplying two huge integers is a convolution of their digits, and convolution is multiplication of spectra: the FFT turns arithmetic into signal processing.` },
  ],
};
