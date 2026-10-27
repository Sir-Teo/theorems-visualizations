// Syllabus — Signals & Systems (curated course; see collection.js for references)
//
// Sources consulted (2026-10):
//   Oppenheim & Willsky (with Nawab), Signals and Systems 2e — full section list (order verified):
//     https://iasexamportal.com/ies/books/signals-and-systems-by-oppenheim-hamid-willsky
//   Lathi, Linear Systems and Signals — chapter structure only (eBay/OUP listings); Lathi refs are chapter-level.
//   MIT 6.003 Signals and Systems (Fall 2011) lectures: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/pages/lecture-notes/
//   MIT 6.341 Discrete-Time Signal Processing (Fall 2005) lectures:
//     https://ocw.mit.edu/courses/6-341-discrete-time-signal-processing-fall-2005/pages/lecture-notes/
// Gaps filled after comparison: polyphase/multirate filter banks, the Levinson–Durbin recursion, Goertzel/DTMF,
//   compressed sensing as a modern counterpoint to Nyquist.
// Deliberate omissions: feedback systems (O&W ch. 11 → ctrl), chirp-z transform, fractional-delay filters.
// Note: chapter 13 (random signals) and parts of ch. 8/10 (wavelets, equiripple design) go beyond both references;
//   their refs point to the nearest related chapter.
// Landmark papers (kind 'Paper', Oct 2026): each citation was checked against its Crossref record (api.crossref.org/works/<doi>)
// or, without a DOI, against the cited record (NASA NTRS, Google Patents, Euler Archive, Smithsonian Libraries).
export default {
  collection: 'sig',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Signals',
      summary: String.raw`A signal is a function of time, sampled or continuous, and much of the subject is about a small vocabulary of operations on such functions — shifting, flipping, stretching — and a small cast of special signals. Complex exponentials are the stars, and the unit impulse, made rigorous as a distribution, is the probe that reveals everything about a linear system. Thinking of signals as vectors with an inner product and an energy sets up Fourier analysis as geometry.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Continuous-time and discrete-time signals', deps: [], refs: ['Oppenheim–Willsky §1.1', 'Lathi ch. 1'],
          pic: 'A recorded waveform is drawn as a continuous curve and as stems sampled from it; a slider changes the sample spacing to emphasise that a discrete signal is defined only at integers.' },
        { num: '1.2', kind: 'Definition', name: 'Time shift, reversal and scaling', deps: ['sig-1.1'], refs: ['Oppenheim–Willsky §1.2'],
          pic: 'Apply x(at + b) to a lopsided pulse with sliders for a and b; the order of operations (shift then scale versus scale then shift) is animated, and a negative a flips the pulse.' },
        { num: '1.3', kind: 'Definition', name: 'Even and odd parts of a signal', deps: ['sig-1.2'], refs: ['Oppenheim–Willsky §1.2'],
          pic: 'Draw any signal with the mouse and see it split live into its even part (mirror-symmetric) and odd part (point-symmetric), which add back to the original.' },
        { num: '1.4', kind: 'Definition', name: 'Periodic signals and the fundamental period', deps: ['sig-1.1'], refs: ['Oppenheim–Willsky §1.2'],
          pic: 'Add two sinusoids with adjustable periods: the sum repeats with the least common multiple period when their ratio is rational, and never repeats exactly when the ratio is set to √2.' },
        { num: '1.5', kind: 'Definition', name: 'Complex exponentials and sinusoids', deps: ['pma-8.6', 'sig-1.4'], refs: ['Oppenheim–Willsky §1.3', 'Lathi App. B'],
          pic: 'A point spirals in 3D along the time axis as e^{st}; its shadows on the real and imaginary walls are damped cosines and sines, and dragging s across the complex plane makes the spiral grow, decay or rotate faster.' },
        { num: '1.6', kind: 'Phenomenon', name: 'Discrete-time frequencies wrap around every 2π', deps: ['sig-1.5'], refs: ['Oppenheim–Willsky §1.3'],
          pic: 'Increase the frequency of a discrete-time cosine: past π the stem pattern starts to look slower again, and at 2π it is identical to the constant signal.' },
        { num: '1.7', kind: 'Definition', name: 'Discrete unit impulse and unit step', deps: ['sig-1.1'], refs: ['Oppenheim–Willsky §1.4'],
          pic: 'Running sums of the impulse build the step; first differences of the step recover the impulse — both directions animated stem by stem.' },
        { num: '1.8', kind: 'Definition', name: 'The Dirac delta as a limit of narrowing pulses', deps: ['sig-1.7', 'fa-6.11', 'fa-6.31'], refs: ['Oppenheim–Willsky §1.4', 'Lathi ch. 1'],
          pic: 'Narrow a unit-area rectangle, triangle or Gaussian with a width slider; the pulses grow taller without bound but integrating any smooth test function against them converges to its value at zero.' },
        { num: '1.9', kind: 'Proposition', name: 'Sifting property of the impulse', deps: ['sig-1.8', 'pma-6.15'], refs: ['Oppenheim–Willsky §1.4'],
          pic: 'Slide the location of an impulse under a smooth curve: the integral of the product reads out exactly the curve’s height at that location.' },
        { num: '1.10', kind: 'Proposition', name: 'The derivative of the step is the delta', deps: ['sig-1.8', 'fa-6.12'], refs: ['Oppenheim–Willsky §1.4', 'Oppenheim–Willsky §2.5'],
          pic: 'Smooth ramps of decreasing width approximate the unit step; their derivatives are rectangles of unit area that converge to the impulse, shown in a linked pair of plots.' },
        { num: '1.11', kind: 'Definition', name: 'Energy and power signals', deps: ['sig-1.1'], refs: ['Oppenheim–Willsky §1.1', 'Lathi ch. 1'],
          pic: 'A running integral of |x|² over a growing window converges for a decaying pulse (finite energy) and grows linearly for a sinusoid, whose average power converges instead.' },
        { num: '1.12', kind: 'Concept', name: 'Signals as vectors: inner product, norm and orthogonality', deps: ['sig-1.11', 'rca-4.1'], refs: ['Lathi ch. 6'],
          pic: 'Two signals on an interval are shown alongside arrows in the plane whose lengths are their norms and angle comes from their inner product; sinusoids at different harmonics show up as perpendicular arrows.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Systems and their properties',
      summary: String.raw`A system maps input signals to output signals. Six properties — linearity, time invariance, causality, memory, invertibility and stability — classify systems, and each has a quick test and a famous counterexample. The RC circuit and the running average are the first worked examples, and block diagrams give the language for wiring systems together.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Systems as maps between signals', deps: ['sig-1.1'], refs: ['Oppenheim–Willsky §1.5'],
          pic: 'Choose a system from a palette (amplifier, delay, squarer, running average) and drag an input waveform: the output is computed and drawn beneath it.' },
        { num: '2.2', kind: 'Definition', name: 'Linearity', deps: ['sig-2.1', 'circ-3.1'], refs: ['Oppenheim–Willsky §1.6'],
          pic: 'Feed x₁, x₂ and a·x₁ + b·x₂ into a chosen system: for linear systems the third output equals the same combination of the first two, and the mismatch is plotted in red for nonlinear ones.' },
        { num: '2.3', kind: 'Definition', name: 'Time invariance', deps: ['sig-2.1', 'sig-1.2'], refs: ['Oppenheim–Willsky §1.6'],
          pic: 'Delay the input by τ and compare the output with the delayed original output: they coincide for a time-invariant system, but not for y(t) = t·x(t) or y(t) = x(2t).' },
        { num: '2.4', kind: 'Definition', name: 'Causality', deps: ['sig-2.1'], refs: ['Oppenheim–Willsky §1.6'],
          pic: 'Two inputs agree up to a cursor time and then differ; a causal system’s outputs agree up to the cursor, while a centred moving average reacts before the inputs diverge.' },
        { num: '2.5', kind: 'Definition', name: 'Memory and invertibility', deps: ['sig-2.1'], refs: ['Oppenheim–Willsky §1.6'],
          pic: 'Pass a signal through an accumulator followed by a first difference and recover it exactly; replace the accumulator by a squarer and two different inputs give the same output, so no inverse exists.' },
        { num: '2.6', kind: 'Definition', name: 'BIBO stability', deps: ['sig-2.1'], refs: ['Oppenheim–Willsky §1.6'],
          pic: 'Drive systems with a bounded random input; outputs of stable ones stay inside a band while the accumulator’s output wanders off without bound.' },
        { num: '2.7', kind: 'Concept', name: 'Block diagrams: series, parallel and feedback', deps: ['sig-2.1'], refs: ['Oppenheim–Willsky §1.5', 'Lathi ch. 1'],
          pic: 'Drag blocks onto a canvas and wire them in cascade, in parallel or with a feedback path; a test signal flows through and the overall output is displayed.' },
        { num: '2.8', kind: 'Proposition', name: 'Counterexamples among the system properties', deps: ['sig-2.2', 'sig-2.3', 'sig-2.4', 'sig-2.6'], refs: ['Oppenheim–Willsky §1.6'],
          pic: 'A grid of systems against properties, each cell a live test: click a cell to run its check on random inputs and see the witness that breaks the property.' },
        { num: '2.9', kind: 'Model', name: 'The RC circuit as a first-order system', deps: ['circ-5.5', 'sig-2.2', 'sig-2.3'], refs: ['Oppenheim–Willsky §1.5', 'Lathi ch. 1'],
          pic: 'Drive an RC circuit with an arbitrary drawn voltage: the capacitor voltage lags and smooths it, and tests confirm the circuit is linear, time-invariant, causal and stable.' },
        { num: '2.10', kind: 'Model', name: 'Difference equations: moving average and accumulator', deps: ['sig-1.7', 'sig-2.1'], refs: ['Oppenheim–Willsky §2.4', 'Lathi ch. 3'],
          pic: 'Edit the coefficients of a difference equation and step through it sample by sample on a noisy stock-price series: averaging smooths, while the recursive accumulator integrates.' },
        { num: '2.11', kind: 'Concept', name: 'Incremental linearity: zero-input plus zero-state response', deps: ['sig-2.2', 'sig-2.9'], refs: ['Oppenheim–Willsky §1.6', 'Lathi ch. 2'],
          pic: 'An RC circuit with a charged capacitor responds to an input; its output splits into the decay of the initial charge and the response from rest, which add up exactly.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'LTI systems and convolution',
      summary: String.raw`Linearity and time invariance together are powerful: write the input as a superposition of shifted impulses, and the output must be the same superposition of shifted impulse responses. This is convolution, and it means a single function, the impulse response, determines the system completely. Causality and stability become simple conditions on that function, and complex exponentials pass through unchanged except for a complex gain — the seed of Fourier analysis.`,
      items: [
        { num: '3.1', kind: 'Theorem', name: 'The convolution sum', deps: ['sig-2.2', 'sig-2.3', 'sig-1.7'], refs: ['Oppenheim–Willsky §2.1'],
          pic: 'Decompose an input into scaled impulses: each spawns a scaled, shifted copy of the impulse response, and stacking them builds the output stem by stem.' },
        { num: '3.2', kind: 'Theorem', name: 'The convolution integral', deps: ['sig-3.1', 'sig-1.9', 'fa-6.33'], refs: ['Oppenheim–Willsky §2.2', 'Lathi ch. 2'],
          pic: 'Drag the flipped kernel h(t − τ) across x(τ): the overlap product is shaded, and its area traces out the output y(t) point by point as the kernel slides.' },
        { num: '3.3', kind: 'Definition', name: 'Impulse response', deps: ['sig-3.2'], refs: ['Oppenheim–Willsky §2.2'],
          pic: 'Clap in a virtual room and record the echo pattern; convolving any dry sound with that recording reproduces how it would sound in the room.' },
        { num: '3.4', kind: 'Proposition', name: 'Convolution is commutative, associative and distributive', deps: ['sig-3.2', 'rca-8.14'], refs: ['Oppenheim–Willsky §2.3'],
          pic: 'Swap the roles of signal and kernel in the sliding picture and the output is unchanged; cascading two filters in either order gives identical results.' },
        { num: '3.5', kind: 'Proposition', name: 'Causality and memory from the impulse response', deps: ['sig-3.3', 'sig-2.4'], refs: ['Oppenheim–Willsky §2.3'],
          pic: 'Edit an impulse response by dragging its samples: whenever any sample left of zero is nonzero, the system is flagged non-causal and its output visibly anticipates the input.' },
        { num: '3.6', kind: 'Theorem', name: 'BIBO stability iff ∫|h| is finite', deps: ['sig-3.2', 'sig-2.6'], refs: ['Oppenheim–Willsky §2.3'],
          pic: 'Vary the decay rate of h(t) = e^{at}u(t): the running integral of |h| converges for a < 0 and diverges for a ≥ 0, and a worst-case bounded input (the sign of the flipped h) drives the output to that integral.' },
        { num: '3.7', kind: 'Definition', name: 'Step response', deps: ['sig-3.3', 'sig-1.10'], refs: ['Oppenheim–Willsky §2.3'],
          pic: 'The step response is drawn as the running integral of the impulse response, with the area accumulated so far shaded under h.' },
        { num: '3.8', kind: 'Proposition', name: 'Cascades convolve, parallels add', deps: ['sig-3.4', 'sig-2.7'], refs: ['Oppenheim–Willsky §2.3'],
          pic: 'Wire two LTI blocks in series or parallel on a canvas; the overall impulse response is computed as h₁ ∗ h₂ or h₁ + h₂ and matches a simulation of the wired diagram.' },
        { num: '3.9', kind: 'Theorem', name: 'Complex exponentials are eigenfunctions of LTI systems', deps: ['sig-3.2', 'sig-1.5'], refs: ['Oppenheim–Willsky §3.2'],
          pic: 'Feed e^{st} into an arbitrary LTI system: after the transient the output is the same exponential scaled by a complex number H(s), shown as an arrow scaling and rotating the input phasor.' },
        { num: '3.10', kind: 'Definition', name: 'System function and frequency response', deps: ['sig-3.9'], refs: ['Oppenheim–Willsky §3.2'],
          pic: 'Sweep the frequency of a sinusoidal input and record output amplitude and phase; the resulting curves are the frequency response, computed as the transform of h.' },
        { num: '3.11', kind: 'Method', name: 'Linear constant-coefficient differential equations', deps: ['sig-3.3', 'sig-2.11', 'ode-3.13'], refs: ['Oppenheim–Willsky §2.4', 'Lathi ch. 2'],
          pic: 'Type the coefficients of an ODE at initial rest and drive it: the solver’s output equals the input convolved with the computed impulse response, overlaid curve on curve.' },
        { num: '3.12', kind: 'Definition', name: 'FIR and IIR systems', deps: ['sig-2.10', 'sig-3.1'], refs: ['Oppenheim–Willsky §2.4'],
          pic: 'Toggle a feedback coefficient on and off: with feedback the impulse response rings on forever (IIR); without it it stops after a fixed number of taps (FIR).' },
        { num: '3.13', kind: 'Method', name: 'Inverse systems and deconvolution', deps: ['sig-3.4', 'sig-2.5'], refs: ['Oppenheim–Willsky §2.3'],
          pic: 'Blur a signal by convolving with an echo filter, then apply the inverse filter: the original returns exactly — until noise is added, when the inverse amplifies it dramatically.' },
        { num: '3.14', kind: 'Definition', name: 'Correlation as convolution with a time-reversed signal', deps: ['sig-3.2', 'sig-1.12'], refs: ['Lathi ch. 2'],
          pic: 'Slide a template across a noisy recording: the correlation peaks where the template is hidden, and is computed as convolution with the template flipped.' },
        { num: '3.15', kind: 'Phenomenon', name: 'Reverberation as convolution with a room response', deps: ['sig-3.3'], refs: ['Oppenheim–Willsky §2.2'],
          pic: 'Pick a voice clip and a room (cathedral, closet, stairwell); the convolved result can be played on a button, and lengthening the room response’s decay audibly smears the speech.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Fourier series',
      summary: String.raw`Because complex exponentials pass through LTI systems unchanged, it pays to write periodic signals as sums of harmonics. Orthogonality makes the coefficients easy to compute, and Parseval says energy is shared among the harmonics. The convergence story is subtle and famous — Gibbs overshoot at jumps, smooth signals with rapidly decaying spectra, and continuous signals whose series diverge — and connects to the analysis of Rudin's books.`,
      items: [
        { num: '4.1', kind: 'Definition', name: 'Fourier series of a periodic signal', deps: ['pma-8.9', 'sig-3.9', 'sig-1.4'], refs: ['Oppenheim–Willsky §3.3', 'Lathi ch. 6'],
          pic: 'Rotating phasors stacked tip to tail trace out a periodic signal; adding harmonics one at a time sharpens the drawing, and the coefficient bar chart updates beside it.' },
        { num: '4.2', kind: 'Theorem', name: 'Coefficients by orthogonality', deps: ['sig-4.1', 'pma-8.10', 'sig-1.12'], refs: ['Oppenheim–Willsky §3.3'],
          pic: 'Multiply a signal by e^{−jkω₀t} and average over a period: the product spins around the origin and only the k-th harmonic leaves a nonzero centre of mass, which is the coefficient.' },
        { num: '4.3', kind: 'Theorem', name: 'Dirichlet conditions and pointwise convergence', deps: ['sig-4.1', 'pma-8.14'], refs: ['Oppenheim–Willsky §3.4'],
          pic: 'Partial sums of a square wave converge to the signal at points of continuity and to the midpoint of the jump at the discontinuity, with a readout at a draggable test point.' },
        { num: '4.4', kind: 'Phenomenon', name: 'Gibbs phenomenon', deps: ['sig-4.3', 'pma-8.13'], refs: ['Oppenheim–Willsky §3.4'],
          pic: 'Add hundreds of harmonics to a square wave: the overshoot narrows but its height stays near 9% of the jump, measured by a live readout that refuses to shrink.' },
        { num: '4.5', kind: 'Theorem', name: 'Mean-square convergence and best approximation', deps: ['sig-4.2', 'pma-8.11', 'rca-4.26'], refs: ['Oppenheim–Willsky §3.4'],
          pic: 'Perturb any coefficient of a truncated series away from its Fourier value: the mean-square error, plotted as a bowl, is smallest at the Fourier value.' },
        { num: '4.6', kind: 'Theorem', name: 'Parseval’s relation for periodic signals', deps: ['sig-4.5', 'pma-8.16'], refs: ['Oppenheim–Willsky §3.5'],
          pic: 'Average power computed in time and the sum of squared coefficient magnitudes are drawn as two bars that agree for any drawn waveform.' },
        { num: '4.7', kind: 'Proposition', name: 'Properties: shift, reversal, scaling and differentiation', deps: ['sig-4.1'], refs: ['Oppenheim–Willsky §3.5'],
          pic: 'Shift a signal in time and watch only the phases of its coefficients rotate, linearly in k; differentiate it and high harmonics get boosted in proportion to k.' },
        { num: '4.8', kind: 'Proposition', name: 'Smoothness and spectral decay', deps: ['sig-4.7', 'rca-5.12'], refs: ['Oppenheim–Willsky §3.5'],
          pic: 'Compare a square wave, a triangle wave and a smooth bump on a log-scale coefficient plot: the coefficients decay like 1/k, 1/k² and faster than any power.' },
        { num: '4.9', kind: 'Theorem', name: 'Periodic convolution and products of coefficients', deps: ['sig-4.2', 'sig-3.2'], refs: ['Oppenheim–Willsky §3.5'],
          pic: 'Convolve two periodic signals over one period and compare with the series whose coefficients are the products of theirs — the two curves coincide.' },
        { num: '4.10', kind: 'Method', name: 'LTI response to periodic inputs', deps: ['sig-4.1', 'sig-3.10', 'mech-4.12'], refs: ['Oppenheim–Willsky §3.8'],
          pic: 'Push a square wave through a tunable resonant filter: each harmonic is scaled by the frequency response, and tuning to the third harmonic turns the output into a sine at three times the frequency.' },
        { num: '4.11', kind: 'Definition', name: 'Discrete-time Fourier series', deps: ['sig-4.1', 'sig-1.6'], refs: ['Oppenheim–Willsky §3.6'],
          pic: 'A periodic sequence of period N is rebuilt exactly from N harmonics, with no convergence issues: the reconstruction is exact the moment all N are switched on.' },
        { num: '4.12', kind: 'Proposition', name: 'Spectra of square, triangle and sawtooth waves', deps: ['sig-4.2', 'sig-4.8'], refs: ['Oppenheim–Willsky §3.3', 'Lathi ch. 6'],
          pic: 'Listen to and look at the classic waveforms: the square wave has only odd harmonics falling as 1/k, the sawtooth has all of them, and the triangle’s fade as 1/k².' },
        { num: '4.13', kind: 'Paradox', name: 'Continuous signals with divergent Fourier series', deps: ['sig-4.3', 'rca-5.11'], refs: ['Oppenheim–Willsky §3.4'],
          pic: 'A continuous function built from widely spaced Fejér-type blocks has partial sums that spike higher and higher at one point, the maximum climbing slowly but without bound as more terms are added.' },
        { num: '4.14', kind: 'Method', name: 'Fejér summation removes Gibbs ringing', deps: ['sig-4.4', 'pma-8.15'], refs: ['Oppenheim–Willsky §3.4'],
          pic: 'Average the partial sums of a square-wave series: the Cesàro means approach the jump monotonically without overshoot, shown beside the ringing ordinary partial sums.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      "n": 5,
      "title": "The continuous-time Fourier transform",
      "summary": "A continuous spectrum replaces the harmonics of a periodic signal. The transform convention fixes every factor of2π; function-space assumptions decide when inversion, products and energy identities are legitimate. Exact pulse and Gaussian models make those rules visible, while distributions, concentration limits and phase distinguish several meanings of a spectrum.",
      "items": [
        {
          "num": "5.1",
          "kind": "Definition",
          "name": "Fourier transform as the limit of Fourier series",
          "deps": [
            "sig-4.1",
            "rca-9.1"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture8 pp.1–6, pulse repetition and transform pair"
          ],
          "pic": "Increase the repetition period. The right panel draws $Tc_k$, so its stems remain on the single-pulse sinc envelope while their spacing shrinks. The left compares the pulse with a finite Fourier-series reconstruction over the central period; the finite sum retains oscillations near jumps."
        },
        {
          "num": "5.2",
          "kind": "Theorem",
          "name": "Fourier inversion",
          "deps": [
            "sig-5.1",
            "rca-9.11"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture8 transform/inverse pair; RCA9.11 with converted convention"
          ],
          "pic": "Widen the inverse-integration band. The reconstructed Cauchy pulse approaches the exact signal, while the frequency panel shows the included spectral interval. The probe reports the actual pointwise error and an analytic bound valid at every time."
        },
        {
          "num": "5.3",
          "kind": "Proposition",
          "name": "Linearity, time shift and frequency shift",
          "deps": [
            "sig-5.1",
            "rca-9.2"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture9 pp.1–4 and transparency9.8"
          ],
          "pic": "Delay and modulate a Gaussian, and add a second unshifted Gaussian with a signed weight. Real and imaginary parts move together in both panels. At zero weights the entire signal and spectrum can vanish; no phase is assigned there."
        },
        {
          "num": "5.4",
          "kind": "Proposition",
          "name": "Time scaling: compress in time, spread in frequency",
          "deps": [
            "sig-5.3"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture9 narrative pp.1–2; direct signed change of variable"
          ],
          "pic": "Choose the sign and magnitude of the time scale. A compressed pulse has a wider spectrum with a smaller peak. The original signal and its transform are faint comparisons; the shifted complex pulse makes a negative scale visibly different."
        },
        {
          "num": "5.5",
          "kind": "Theorem",
          "name": "Duality",
          "deps": [
            "sig-5.2"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture9 duality transparency9.6; converted inversion proof"
          ],
          "pic": "Swap the roles of signal and transform. The Gaussian pair and the bilateral-exponential/Cauchy-shaped pair show the exact factor2π on the second application. The readout compares the predicted dual with the reflected original at your probe."
        },
        {
          "num": "5.6",
          "kind": "Theorem",
          "name": "Convolution theorem",
          "deps": [
            "sig-5.3",
            "sig-3.2",
            "fa-7.2"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture9 convolution transparency9.9; direct absolute-integral proof"
          ],
          "pic": "Change the two pulse widths and their relative delay. The first panel gives the actual overlap-area output; the second shows the complex spectral product. At the probe, an interval-intersection calculation gives the convolution directly."
        },
        {
          "num": "5.7",
          "kind": "Theorem",
          "name": "Multiplication (modulation) property",
          "deps": [
            "sig-5.6",
            "sig-5.5"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture9 modulation discussion; direct inverse-integral proof"
          ],
          "pic": "Multiply two offset Gaussians, or switch to a cosine carrier. A narrow window broadens the product spectrum; a cosine makes two shifted copies. The product mode computes its center and height by completing the square."
        },
        {
          "num": "5.8",
          "kind": "Theorem",
          "name": "Differentiation and integration properties",
          "deps": [
            "sig-5.3",
            "sig-1.10",
            "fa-7.15"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture9 integration/differentiation transparency9.8; distributional proof"
          ],
          "pic": "Choose differentiation, the primitive of a zero-mean Gaussian derivative, or the primitive of a positive Gaussian. The positive-area case displays the principal-value density away from zero and reports the separate delta mass; the gap is not filled with a fabricated value."
        },
        {
          "num": "5.9",
          "kind": "Theorem",
          "name": "Parseval–Plancherel: energy is preserved",
          "deps": [
            "sig-5.2",
            "rca-9.13"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture9 Parseval transparency9.7; Oppenheim–Verghese MIT6.011(2010) §2.3.2 pp.32–34"
          ],
          "pic": "Compare a Gaussian with a Cauchy pulse. The panels compare the time and frequency energy densities, while separate window controls expose omitted tails. The readout distinguishes the exact total energy from the two finite-window integrals."
        },
        {
          "num": "5.10",
          "kind": "Proposition",
          "name": "The Gaussian is its own Fourier transform",
          "deps": [
            "sig-5.4",
            "fa-7.6"
          ],
          "refs": [
            "FA7.6 normalized Gaussian proof; direct differential-equation and scaling derivation"
          ],
          "pic": "Vary the Gaussian width, then choose engineering or unitary amplitude. Reciprocal widths remain, but only the unitary curves coincide at width1. The readout gives both center heights and their conversion factor."
        },
        {
          "num": "5.11",
          "kind": "Proposition",
          "name": "Rectangular pulse and sinc",
          "deps": [
            "sig-5.1"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture8 rectangular-pulse pair; Stroock, Topics in Fourier Analysis(2024), Eq.7.11 pp.18–19"
          ],
          "pic": "Widen the pulse and watch its sinc zeros move inward. The selected frequency reports the signed transform, including the removable value at zero. Marked gold points identify the first three positive and negative zeros."
        },
        {
          "num": "5.12",
          "kind": "Theorem",
          "name": "Riemann–Lebesgue lemma",
          "deps": [
            "sig-5.1",
            "rca-9.6",
            "sig-5.10"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture8 existence discussion; RCA9.6 translation proof"
          ],
          "pic": "Compare a rectangle, triangle and Gaussian at an adjustable frequency range. The rectangle and triangle have explicit algebraic envelopes; the Gaussian's curve itself decays faster. The selected value is a signed transform, not a sampled estimate of a general asymptotic rate."
        },
        {
          "num": "5.13",
          "kind": "Definition",
          "name": "Transforms of impulses and sinusoids via distributions",
          "deps": [
            "sig-5.2",
            "sig-1.8",
            "fa-7.15"
          ],
          "refs": [
            "MIT RES.6-007 (Oppenheim,2011), Lecture8 distributional pairs; FA7.15 tempered Fourier transform with converted convention"
          ],
          "pic": "Choose a narrowing unit-area impulse approximation or a lengthening Gaussian-windowed cosine. For the cosine, the two spectral lobes keep massπ each while their widths shrink. At zero carrier they merge into one mass2π; the separate decomposition still sums correctly."
        },
        {
          "num": "5.14",
          "kind": "Theorem",
          "name": "Impulse train ↔ impulse train (Poisson summation)",
          "deps": [
            "sig-5.13",
            "sig-4.1",
            "rca-4.24"
          ],
          "refs": [
            "Stroock, Topics in Fourier Analysis(2024), Theorem7.2 p.17, sign/period conversion"
          ],
          "pic": "Change the comb period and compare the two finite Gaussian sums in the bottom panel. Comb stems encode exact impulse masses. The probe reports both truncated sums and analytic bounds for each omitted Gaussian tail."
        },
        {
          "num": "5.15",
          "kind": "Theorem",
          "name": "Uncertainty principle for signals (Gabor limit)",
          "deps": [
            "sig-5.4",
            "sig-5.9",
            "sig-5.10",
            "rca-4.2"
          ],
          "refs": [
            "Wigderson–Wigderson, The uncertainty principle: variations on a theme(2020), §4.3 Theorem4.9/remark p.30; own sharp proof with angular frequency"
          ],
          "pic": "Stretch and chirp a Gaussian. The time energy width stays at s while chirp broadens the frequency energy width. The two analytic density curves and readout expose the exact product, with equality only at zero chirp."
        },
        {
          "num": "5.16",
          "kind": "Theorem",
          "name": "Band-limited signals cannot be time-limited",
          "deps": [
            "sig-5.5",
            "sig-5.9",
            "rca-4.2",
            "rca-10.18a"
          ],
          "refs": [
            "RCA10.18a identity theorem; own entire-extension argument for compact-band L2 functions"
          ],
          "pic": "A box spectrum gives $x(t)=\\sin(Bt)/(\\pi t)$. Select a time cutoff: the gold point is a provably nonzero value beyond it. The second panel compares the exact box with the approximate transform of the time-truncated signal."
        },
        {
          "num": "5.17",
          "kind": "Definition",
          "name": "Magnitude, phase and group delay",
          "deps": [
            "sig-5.3"
          ],
          "refs": [
            "Oppenheim–Verghese, MIT6.011(2010), §§3.1–3.2 pp.47–53, Eqs.3.12–3.14 and3.19a; own exact Gaussian inverse"
          ],
          "pic": "Change phase curvature while preserving magnitude: the Gaussian packet broadens even though the spectral magnitude is unchanged. The two-path mode exposes cancellation zeros and reports an unresolved phase near a numerical null."
        },
        {
          "num": "5.18",
          "kind": "Concept",
          "name": "Energy spectral density and autocorrelation",
          "deps": [
            "sig-5.9",
            "sig-3.14",
            "sig-5.6",
            "rca-4.2"
          ],
          "refs": [
            "Oppenheim–Verghese, MIT6.011(2010), §2.3.2 pp.32–34; own complex finite-energy correlation proof"
          ],
          "pic": "Slide a complex Gaussian against its conjugate copy. The first panel displays the real and imaginary correlation, and the second its nonnegative energy spectrum. Changing carrier frequency rotates correlation while translating its spectrum."
        }
      ]
    },
    {
      "n": 6,
      "title": "Frequency response and filtering",
      "summary": "Frequency response separates spectral gain from phase. Exact kernels and paired time/frequency views expose the costs of sharp cutoffs, the conditions behind causal realization and gain–phase recovery, and the family-specific links between transients and bandwidth.",
      "items": [
        {
          "num": "6.1",
          "kind": "Definition",
          "name": "Frequency response of an LTI system",
          "deps": [
            "sig-3.10",
            "sig-5.6"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Sweep the driving frequency. The two traces, complex response vector and highlighted point on the gain curve all use the same exact first-order response."
        },
        {
          "num": "6.2",
          "kind": "Definition",
          "name": "Ideal low-pass, high-pass and band-pass filters",
          "deps": [
            "sig-6.1"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Choose a band and move its cutoff. Each of five known harmonics is visibly kept or removed, and the output is their actual retained sum. Compare the changed waveform with its original."
        },
        {
          "num": "6.3",
          "kind": "Proposition",
          "name": "The ideal low-pass filter is non-causal",
          "deps": [
            "sig-6.2",
            "sig-5.11"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Compare the delayed infinite sinc with its causal finite window. The negative-time witness remains nonzero as delay grows. The second panel shows the exact finite-window gain and its cutoff ripples."
        },
        {
          "num": "6.4",
          "kind": "Theorem",
          "name": "Paley–Wiener criterion for causal filters",
          "deps": [
            "sig-6.3",
            "rca-19.2"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Compare a power-law tail, a Gaussian tail and an exact stop band. The upper panel shows log magnitude; the lower accumulates the actual weighted negative logarithm. A finite window cannot certify the infinite-range criterion."
        },
        {
          "num": "6.5",
          "kind": "Definition",
          "name": "Linear phase and distortionless transmission",
          "deps": [
            "sig-6.1",
            "sig-5.17"
          ],
          "refs": [
            "Oppenheim–Verghese2010, selected printed49–53: real-signal phase symmetry, delay and narrowband phase expansion; own finite-harmonic construction"
          ],
          "pic": "Turn on phase curvature while keeping every harmonic amplitude fixed. Compare the actual output with the scaled, delayed input and inspect the unwrapped phase that caused the difference."
        },
        {
          "num": "6.6",
          "kind": "Phenomenon",
          "name": "Group delay and the dispersion of a pulse",
          "deps": [
            "sig-6.5"
          ],
          "refs": [
            "Oppenheim–Verghese2010, selected printed50–53: local phase expansion and group versus phase delay; own complete complex Gaussian inversion"
          ],
          "pic": "Change dispersion and packet width. The group-delay slope and spectral envelope explain the output envelope's broadening; the time traces show the corresponding chirp. Reverse dispersion to reverse the chirp without changing its envelope width."
        },
        {
          "num": "6.7",
          "kind": "Method",
          "name": "Bode plots",
          "deps": [
            "sig-6.1",
            "circ-7.6"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Move a real pole and optionally a real zero. Compare exact gain and phase with their straight-line approximations; watch cancellation when both corners coincide."
        },
        {
          "num": "6.8",
          "kind": "Model",
          "name": "First-order systems: time constant and bandwidth",
          "deps": [
            "sig-6.7",
            "sig-2.9"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Change the time constant and read the actual 10%, 63.2% and 90% step crossings alongside the half-power point. Both panels include a fixed τ=1 s dashed reference, so the faster rise and wider pass band are visible together on physical axes."
        },
        {
          "num": "6.9",
          "kind": "Model",
          "name": "Second-order systems: resonance and damping",
          "deps": [
            "sig-6.7",
            "circ-6.2"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Vary damping through the resonance threshold and through critical damping. The transient and gain curve share the same parameters, so the interval with an oscillatory step but no resonant gain peak is explicit."
        },
        {
          "num": "6.10",
          "kind": "Concept",
          "name": "Minimum-phase systems and all-pass factors",
          "deps": [
            "sig-6.7"
          ],
          "refs": [
            "Oppenheim–Verghese2010, selected printed58–64: all-pass factors, CT inverse properness, factorization and gain ambiguity"
          ],
          "pic": "Reflect the zero across the imaginary axis. Their gain magnitudes stay equal, while phase and initial step motion separate. The zero positions and both exact step traces make the factorization visible."
        },
        {
          "num": "6.11",
          "kind": "Theorem",
          "name": "Bode’s gain–phase relation and the Hilbert transform",
          "deps": [
            "sig-6.10",
            "rca-17.23"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Reconstruct phase from the gain curve, then add a reflected zero or pure delay. The reconstruction keeps following the minimum-phase reference, while the actual phase gains an amount that magnitude cannot reveal."
        },
        {
          "num": "6.12",
          "kind": "Concept",
          "name": "Rise time versus bandwidth",
          "deps": [
            "sig-6.8",
            "sig-5.15"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Match the bandwidth and compare one pole, two poles or one pole plus an all-pass factor. Measure the actual 10% and 90% crossings; the all-pass example keeps the original gain while stretching the measured rise."
        },
        {
          "num": "6.13",
          "kind": "Phenomenon",
          "name": "Ringing of sharp filters",
          "deps": [
            "sig-6.3",
            "sig-4.4"
          ],
          "refs": [
            "Complete chapter-local derivation under the stated engineering Fourier convention"
          ],
          "pic": "Widen the transition band and compare its exact impulse and step with the sharp reference. The time axis rescales with cutoff, showing the fixed fractional overshoot on a changing physical time scale. The triangular endpoint removes step overshoot by making the whole impulse nonnegative."
        }
      ]
    },
    {
      n: 7,
      title: 'Sampling',
      summary: String.raw`Sampling multiplies a signal by an impulse train, so its spectrum is copied periodically. If the signal is band-limited and sampled fast enough the copies do not overlap and the original can be recovered perfectly by sinc interpolation — the Nyquist–Shannon theorem; if not, high frequencies masquerade as low ones. This chapter covers aliasing in all its forms, practical reconstruction, sample-rate conversion, quantization, and a modern twist in which sparsity lets us sample below the Nyquist rate.`,
      items: [
        { num: '7.1', kind: 'Definition', name: 'Impulse-train sampling', deps: ['sig-5.14', 'sig-1.9'], refs: ['Oppenheim–Willsky §7.1'],
          pic: 'Multiply a waveform by an impulse comb: the sampled signal is drawn as weighted spikes, and the sampling period slider changes their density.' },
        { num: '7.2', kind: 'Theorem', name: 'The spectrum of a sampled signal is periodic', deps: ['sig-7.1', 'sig-5.7'], refs: ['Oppenheim–Willsky §7.1'],
          pic: 'Lower the sampling rate: copies of the spectrum centred at multiples of the sampling frequency slide toward each other and begin to overlap.' },
        { num: '7.3', kind: 'Theorem', name: 'Nyquist–Shannon sampling theorem', deps: ['sig-7.2'], refs: ['Oppenheim–Willsky §7.1', 'Lathi ch. 8'],
          pic: 'Set the band limit and sampling rate: while f_s > 2B the spectral copies stay separated and a low-pass filter isolates the original; the moment f_s drops below 2B they collide.' },
        { num: '7.4', kind: 'Theorem', name: 'Whittaker–Shannon sinc interpolation', deps: ['sig-7.3', 'sig-6.2'], refs: ['Oppenheim–Willsky §7.2', 'Lathi ch. 8'],
          pic: 'Each sample spawns a sinc pulse centred on it; their sum passes through every sample and reconstructs the band-limited signal exactly between them.' },
        { num: '7.5', kind: 'Phenomenon', name: 'Aliasing', deps: ['sig-7.2'], refs: ['Oppenheim–Willsky §7.3'],
          pic: 'Raise the frequency of a sine past half the sampling rate: the samples trace out a lower-frequency sine, the alias, whose frequency folds back as the input climbs.' },
        { num: '7.6', kind: 'Phenomenon', name: 'The wagon-wheel effect', deps: ['sig-7.5'], refs: ['Oppenheim–Willsky §7.3'],
          pic: 'A spoked wheel filmed at 24 frames per second: as its speed increases it appears to slow, stop and spin backwards, matching the aliased frequency computed alongside.' },
        { num: '7.7', kind: 'Method', name: 'Anti-aliasing filters', deps: ['sig-7.5', 'sig-6.2'], refs: ['Oppenheim–Willsky §7.3'],
          pic: 'Sample a signal with energy above Nyquist with and without a low-pass pre-filter: without it, out-of-band tones fold into the band; with it they are removed first.' },
        { num: '7.8', kind: 'Model', name: 'Zero-order hold and sinc droop', deps: ['sig-7.4', 'sig-5.11'], refs: ['Oppenheim–Willsky §7.2'],
          pic: 'Reconstruct by holding each sample as a staircase: the spectrum is shaped by a sinc that droops toward Nyquist and leaves images, which a compensating filter flattens.' },
        { num: '7.9', kind: 'Method', name: 'Discrete-time processing of continuous-time signals', deps: ['sig-7.3', 'sig-7.8'], refs: ['Oppenheim–Willsky §7.4'],
          pic: 'A chain of sampler, digital filter and reconstructor acts like an equivalent analog filter; its effective frequency response is measured and matches the digital response scaled by f_s.' },
        { num: '7.10', kind: 'Method', name: 'Downsampling and decimation', deps: ['sig-7.5'], refs: ['Oppenheim–Willsky §7.5'],
          pic: 'Keep every M-th sample of a signal: its spectrum stretches by M and aliases unless a low-pass filter is applied first, both cases shown.' },
        { num: '7.11', kind: 'Method', name: 'Upsampling and interpolation', deps: ['sig-7.4', 'sig-7.10'], refs: ['Oppenheim–Willsky §7.5'],
          pic: 'Insert zeros between samples: images appear in the spectrum, and an interpolation filter removes them, filling the gaps smoothly.' },
        { num: '7.12', kind: 'Model', name: 'Quantization noise: about 6 dB per bit', deps: ['sig-7.1'], refs: ['Lathi ch. 8'],
          pic: 'Reduce the number of bits used to store a sine: the error signal looks like noise whose power is computed, and the SNR drops by about 6 dB for each bit removed.' },
        { num: '7.13', kind: 'Method', name: 'Oversampling and noise shaping (sigma–delta)', deps: ['sig-7.12', 'sig-7.10'], refs: ['Oppenheim–Willsky §7.5', 'Lathi ch. 8'],
          pic: 'A one-bit sigma–delta modulator tracks a slow sine with a dense stream of ±1; filtering and decimating the stream recovers the sine with many effective bits, the noise pushed to high frequencies.' },
        { num: '7.14', kind: 'Theorem', name: 'Bandpass sampling', deps: ['sig-7.3'], refs: ['Oppenheim–Willsky §7.3'],
          pic: 'Sample a narrowband signal at a carrier of 10 MHz with a rate of only a few MHz: allowed rate windows are shaded where the replicas interleave without overlap.' },
        { num: '7.15', kind: 'Theorem', name: 'Shifted sincs: an orthonormal basis of band-limited signals', deps: ['sig-7.4', 'rca-4.18'], refs: ['Lathi ch. 8'],
          pic: 'Compute inner products between shifted sincs to see a Gram matrix that is the identity, and expand a band-limited signal in that basis with its samples as coordinates.' },
        { num: '7.16', kind: 'Theorem', name: 'Compressed sensing: sparse signals below the Nyquist rate', deps: ['sig-7.3', 'sig-7.15'], refs: ['Oppenheim–Willsky ch. 7'],
          pic: 'A signal made of a few tones is measured at random times, far fewer than Nyquist requires; ℓ¹ minimisation recovers it exactly, while least squares fails, until sparsity is increased past a threshold.' },
        { num: '7.17', kind: 'Method', name: 'Polyphase decomposition and multirate filter banks', deps: ['sig-7.10', 'sig-7.11'], refs: ['Oppenheim–Willsky §7.5'],
          pic: 'Split a decimating filter into M polyphase branches that each run at the low rate: the output matches the direct filter-then-discard design while an operation counter shows an M-fold saving, and a two-band filter bank splits and perfectly rebuilds a signal.' },
        { num: '7.18', kind: 'Paper', name: 'Certain Topics in Telegraph Transmission Theory',
          paper: { authors: 'H. Nyquist', year: 1928, title: 'Certain Topics in Telegraph Transmission Theory',
                   venue: 'Transactions of the American Institute of Electrical Engineers 47 (2): 617–644', doi: '10.1109/T-AIEE.1928.5055024' },
          introduces: ['sig-7.3'], deps: ['sig-4.1', 'sig-5.11'], refs: [],
          pic: 'Send telegraph pulses through a channel of bandwidth B and overlay them as an eye diagram: at 2B pulses per second with suitable shaping the eye stays open at the sampling instants, and faster signalling closes it with intersymbol interference.' },
        { num: '7.19', kind: 'Paper', name: 'Communication in the Presence of Noise',
          paper: { authors: 'C. E. Shannon', year: 1949, title: 'Communication in the Presence of Noise',
                   venue: 'Proceedings of the IRE 37 (1): 10–21', doi: '10.1109/JRPROC.1949.232969' },
          introduces: ['sig-7.3', 'sig-7.15'], deps: ['sig-5.11', 'sig-7.1', 'info-6.8'], refs: [],
          pic: 'Sample a band-limited signal at an adjustable rate and rebuild it from sinc pulses: at twice the bandwidth or more the rebuild locks onto the original, below it aliases; a second panel shows a signal as a point in 2TW dimensions inside its sphere of noise.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Discrete-time Fourier analysis: the DTFT and the DFT',
      summary: String.raw`For sequences, the Fourier transform lives on a circle of frequencies, mirroring the Fourier series with time and frequency roles exchanged. Sampling that circle at N points gives the discrete Fourier transform, the only version a computer can evaluate, and the fast Fourier transform makes it cheap. Using the DFT well means understanding leakage, windows, zero-padding and the time–frequency trade-off behind spectrograms and wavelets.`,
      items: [
        { num: '8.1', kind: 'Definition', name: 'Discrete-time Fourier transform', deps: ['sig-1.6', 'sig-4.1'], refs: ['Oppenheim–Willsky §5.1'],
          pic: 'A finite sequence’s DTFT is drawn on the unit circle as a 3D curve over frequency; it repeats every 2π and the stems of the sequence can be edited to reshape it.' },
        { num: '8.2', kind: 'Proposition', name: 'DTFT properties and the convolution theorem', deps: ['sig-8.1', 'sig-3.1'], refs: ['Oppenheim–Willsky §5.3', 'Oppenheim–Willsky §5.4'],
          pic: 'Convolve two short sequences in time and multiply their DTFTs: the transform of the result matches the product curve point by point.' },
        { num: '8.3', kind: 'Theorem', name: 'Parseval for the DTFT', deps: ['sig-8.1', 'rca-4.26'], refs: ['Oppenheim–Willsky §5.3'],
          pic: 'The sum of squared samples and the average of |X(e^{jω})|² over a period are shown as two numbers that agree as samples are edited.' },
        { num: '8.4', kind: 'Definition', name: 'Discrete Fourier transform', deps: ['sig-8.1', 'algo-4.10'], refs: ['Lathi ch. 8'],
          pic: 'An N-point signal is decomposed into N rotating phasors; their frequencies are the N-th roots of unity, drawn on a circle with bars for the coefficient magnitudes.' },
        { num: '8.5', kind: 'Theorem', name: 'The DFT samples the DTFT', deps: ['sig-8.4'], refs: ['Lathi ch. 8'],
          pic: 'Overlay DFT bins as dots on the continuous DTFT curve of the same finite sequence: they lie exactly on it at multiples of 2π/N.' },
        { num: '8.6', kind: 'Theorem', name: 'Circular convolution theorem', deps: ['sig-8.4', 'algo-4.13'], refs: ['Lathi ch. 8'],
          pic: 'Two sequences are wrapped around circles and convolved circularly; the result equals the inverse DFT of the product, and differs from linear convolution where the tail wraps around.' },
        { num: '8.7', kind: 'Method', name: 'Fast linear convolution: zero-padding and overlap–add', deps: ['sig-8.6'], refs: ['Lathi ch. 8'],
          pic: 'Pad two sequences with zeros until wrap-around vanishes, then filter a long signal block by block with overlapping tails added — matching direct convolution at a fraction of the cost.' },
        { num: '8.8', kind: 'Algorithm', name: 'Fast Fourier transform', deps: ['sig-8.4', 'algo-4.11'], refs: ['Lathi ch. 8'],
          pic: 'The radix-2 butterfly diagram lights up stage by stage on an 8- or 16-point input, with a counter comparing N log₂ N operations against N² for the direct sum.' },
        { num: '8.9', kind: 'Phenomenon', name: 'Spectral leakage', deps: ['sig-8.5', 'sig-5.7'], refs: ['Lathi ch. 7'],
          pic: 'Slide a sine’s frequency between DFT bins: when it falls exactly on a bin the spectrum is a single spike, otherwise energy leaks into every bin along sinc-shaped skirts.' },
        { num: '8.10', kind: 'Method', name: 'Windowing: Hann, Hamming, Blackman and Kaiser', deps: ['sig-8.9'], refs: ['Lathi ch. 7'],
          pic: 'Pick a window and see its shape, its transform on a dB scale (main-lobe width and sidelobe level annotated), and its effect on the leaky spectrum of a sine.' },
        { num: '8.11', kind: 'Concept', name: 'Resolution versus leakage', deps: ['sig-8.10', 'sig-5.15'], refs: ['Lathi ch. 7'],
          pic: 'Two close tones of very different amplitudes: a rectangular window separates close tones but buries the weak one in sidelobes; a Blackman window reveals it but blurs the pair.' },
        { num: '8.12', kind: 'Proposition', name: 'Zero-padding interpolates but does not resolve', deps: ['sig-8.5'], refs: ['Lathi ch. 8'],
          pic: 'Pad a short record with more and more zeros: the DFT curve becomes smoother but two close tones never separate, while lengthening the actual record does separate them.' },
        { num: '8.13', kind: 'Method', name: 'Short-time Fourier transform and the spectrogram', deps: ['sig-8.10', 'sig-5.15'], refs: ['Lathi ch. 7'],
          pic: 'A spectrogram of birdsong or a chirp is computed live; lengthening the window sharpens frequency and blurs time, and each tile’s area is bounded below.' },
        { num: '8.14', kind: 'Algorithm', name: 'Goertzel algorithm and DTMF detection', deps: ['sig-8.4', 'sig-3.12'], refs: ['Lathi ch. 8'],
          pic: 'Press keys on a telephone keypad: the dual tones are generated and eight resonator filters, one per tone, light up to decode the key.' },
        { num: '8.15', kind: 'Theorem', name: 'The normalised DFT matrix is unitary', deps: ['sig-8.4', 'sig-8.3'], refs: ['Lathi ch. 8'],
          pic: 'Colour-plot the DFT matrix as phases; multiplying it by its conjugate transpose gives N times the identity, verified as the size N is changed.' },
        { num: '8.16', kind: 'Concept', name: 'The DCT and energy compaction', deps: ['sig-8.4'], refs: ['Lathi ch. 8'],
          pic: 'Compress an image block by keeping only the largest DCT coefficients: a slider sets how many survive, and the reconstruction stays good while far fewer DFT coefficients would be needed.' },
        { num: '8.17', kind: 'Method', name: 'Haar wavelets and multiresolution analysis', deps: ['sig-8.13', 'sig-1.12'], refs: ['Oppenheim–Willsky ch. 6'],
          pic: 'Split a signal into averages and differences level by level; the wavelet coefficients localise a sudden glitch in time, which a Fourier spectrum spreads everywhere.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'The Laplace transform',
      summary: String.raw`Weighting a signal by a decaying exponential before taking its Fourier transform lets growing signals and unstable systems be handled too: the Laplace transform, a function of a complex frequency defined on a strip. Rational transforms are described by poles and zeros, and their positions tell us about causality, stability and the shape of the response at a glance. The unilateral version solves differential equations with initial conditions, and the inverse is a residue computation.`,
      items: [
        { num: '9.1', kind: 'Definition', name: 'Laplace transform and its region of convergence', deps: ['sig-5.1', 'sig-1.5'], refs: ['Oppenheim–Willsky §9.1', 'Lathi ch. 4'],
          pic: 'Hover over points of the s-plane: the signal multiplied by e^{−σt} is drawn, and the region where this weighted signal is integrable is shaded as the ROC.' },
        { num: '9.2', kind: 'Proposition', name: 'Properties of the ROC: strips, right- and left-sided signals', deps: ['sig-9.1'], refs: ['Oppenheim–Willsky §9.2'],
          pic: 'Edit a signal’s left and right tails: the ROC changes between a right half-plane, a left half-plane, a vertical strip, or nothing at all.' },
        { num: '9.3', kind: 'Proposition', name: 'Same formula, different ROC, different signal', deps: ['sig-9.2'], refs: ['Oppenheim–Willsky §9.2'],
          pic: 'The algebraic expression 1/(s − a) is drawn with a choice of ROC: right of the pole it is a causal exponential, left of it an anti-causal one.' },
        { num: '9.4', kind: 'Method', name: 'Inverse Laplace transform by partial fractions', deps: ['sig-9.1', 'rca-13.2'], refs: ['Oppenheim–Willsky §9.3', 'Lathi ch. 4'],
          pic: 'Type a rational function: its partial-fraction terms are listed, each pole contributing an exponential mode, and the modes sum to the inverse transform.' },
        { num: '9.5', kind: 'Theorem', name: 'Inversion by the Bromwich integral and residues', deps: ['sig-9.1', 'rca-10.42'], refs: ['Oppenheim–Willsky §9.3'],
          pic: 'Close the vertical inversion contour to the left with a large arc: the residues at enclosed poles are summed and the contribution of the arc shrinks as its radius grows.' },
        { num: '9.6', kind: 'Proposition', name: 'Properties: shifts, differentiation and convolution', deps: ['sig-9.1', 'sig-5.6'], refs: ['Oppenheim–Willsky §9.5'],
          pic: 'Apply time shift, exponential weighting and differentiation to a signal: the pole–zero plot shifts, rotates or gains a zero at the origin accordingly.' },
        { num: '9.7', kind: 'Definition', name: 'Poles, zeros and the pole–zero plot', deps: ['sig-9.1'], refs: ['Oppenheim–Willsky §9.1'],
          pic: 'Drag poles and zeros around the s-plane: the magnitude of H(s) is drawn as a 3D landscape with spikes at poles and pits at zeros, and its slice along the jω axis is the frequency response.' },
        { num: '9.8', kind: 'Method', name: 'Frequency response from the pole–zero plot', deps: ['sig-9.7', 'sig-6.1'], refs: ['Oppenheim–Willsky §9.4'],
          pic: 'Move a test point up the imaginary axis: vectors from each pole and zero to the point are drawn, and the product of their lengths and sum of their angles give the gain and phase.' },
        { num: '9.9', kind: 'Theorem', name: 'Causality and stability from poles and the ROC', deps: ['sig-9.2', 'sig-3.6'], refs: ['Oppenheim–Willsky §9.7'],
          pic: 'Drag a pole across the imaginary axis for a causal system: the impulse response switches from decaying to growing exactly when the pole enters the right half-plane.' },
        { num: '9.10', kind: 'Definition', name: 'Unilateral Laplace transform and initial conditions', deps: ['sig-9.6'], refs: ['Oppenheim–Willsky §9.9', 'Lathi ch. 4'],
          pic: 'Differentiate a signal that jumps at t = 0: the unilateral transform picks up the initial value as an extra term, shown as the impulse the bilateral transform would contain.' },
        { num: '9.11', kind: 'Theorem', name: 'Initial- and final-value theorems', deps: ['sig-9.10'], refs: ['Oppenheim–Willsky §9.5', 'Lathi ch. 4'],
          pic: 'For a draggable set of poles, compare lim sF(s) at s → 0 with the long-time value of the response; the theorem fails visibly when a pole sits in the right half-plane.' },
        { num: '9.12', kind: 'Method', name: 'Solving differential equations with the Laplace transform', deps: ['sig-9.10', 'sig-3.11', 'ode-3.16'], refs: ['Lathi ch. 4'],
          pic: 'Enter an ODE with initial conditions: the algebraic solution in s is shown step by step and its inverse is overlaid on a numerical integration.' },
        { num: '9.13', kind: 'Method', name: 'Transfer-function algebra and block-diagram reduction', deps: ['sig-2.7', 'sig-9.6'], refs: ['Oppenheim–Willsky §9.8', 'Lathi ch. 4'],
          pic: 'Collapse a block diagram step by step — series blocks multiply, parallels add, a feedback loop becomes G/(1 + GH) — and compare the simulated response before and after.' },
        { num: '9.14', kind: 'Concept', name: 'Dominant poles', deps: ['sig-9.7', 'sig-9.4'], refs: ['Oppenheim–Willsky §9.4'],
          pic: 'Move a far-left pole further away: its fast mode dies out quickly and the response is governed by the slow poles near the imaginary axis, with the approximation error shown.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'The z-transform and digital filters',
      summary: String.raw`The z-transform is to sequences what the Laplace transform is to functions: a generating function whose region of convergence is an annulus and whose poles and zeros describe a digital system. Stability now means poles inside the unit circle. The chapter turns analog designs into digital ones by impulse invariance and the bilinear transform, designs FIR filters by windowing and equiripple optimisation, and meets the quirks of finite-precision arithmetic.`,
      items: [
        { num: '10.1', kind: 'Definition', name: 'The z-transform and its region of convergence', deps: ['sig-8.1', 'pma-3.39'], refs: ['Oppenheim–Willsky §10.1', 'Lathi ch. 5'],
          pic: 'Hover over the z-plane: the sequence weighted by r^{−n} is drawn, and the annulus where its sum converges is shaded; the unit circle is where the DTFT lives.' },
        { num: '10.2', kind: 'Proposition', name: 'z-transform properties: delay and convolution', deps: ['sig-10.1', 'sig-8.2'], refs: ['Oppenheim–Willsky §10.5'],
          pic: 'A one-sample delay multiplies the transform by z^{−1}; chaining delays and adders on a canvas builds the polynomial transfer function term by term.' },
        { num: '10.3', kind: 'Method', name: 'Inverse z-transform: partial fractions and power series', deps: ['sig-10.1', 'rca-10.42'], refs: ['Oppenheim–Willsky §10.3'],
          pic: 'Long-divide a rational function to read off samples one at a time, and compare with the closed form obtained from partial fractions — they agree term by term.' },
        { num: '10.4', kind: 'Theorem', name: 'Stability: poles inside the unit circle', deps: ['sig-10.1', 'sig-3.6'], refs: ['Oppenheim–Willsky §10.7'],
          pic: 'Drag a pair of complex poles in the z-plane: the impulse response rings and decays inside the unit circle, rings forever on it, and explodes outside.' },
        { num: '10.5', kind: 'Method', name: 'Unilateral z-transform and initial conditions', deps: ['sig-10.2', 'sig-2.10'], refs: ['Oppenheim–Willsky §10.9', 'Lathi ch. 5'],
          pic: 'Solve the Fibonacci recursion with the unilateral z-transform: the poles at the golden ratio and its conjugate give the closed form, overlaid on the iterated values.' },
        { num: '10.6', kind: 'Method', name: 'Impulse invariance', deps: ['sig-9.1', 'sig-7.5'], refs: ['Lathi ch. 5'],
          pic: 'Sample the impulse response of an analog filter: each pole s maps to e^{sT}, and the digital frequency response matches the analog one except where aliasing distorts it near Nyquist.' },
        { num: '10.7', kind: 'Method', name: 'Bilinear transform and frequency warping', deps: ['sig-9.1', 'sig-10.1'], refs: ['Lathi ch. 5'],
          pic: 'The whole left half of the s-plane is mapped onto the unit disc by a grid deformation animation; the analog frequency axis is squeezed onto the circle with a tangent-shaped warping curve.' },
        { num: '10.8', kind: 'Method', name: 'FIR design by windowing', deps: ['sig-8.10', 'sig-6.3'], refs: ['Lathi ch. 9'],
          pic: 'Truncate the sinc of an ideal low-pass with various windows and lengths: passband ripple and stopband attenuation are read off a dB plot of the result.' },
        { num: '10.9', kind: 'Concept', name: 'Linear-phase FIR filters have symmetric taps', deps: ['sig-6.5', 'sig-3.12'], refs: ['Lathi ch. 9'],
          pic: 'Edit the taps of an FIR filter: when they are mirror-symmetric the phase response becomes an exact straight line and the zeros pair up as z and 1/z̄.' },
        { num: '10.10', kind: 'Method', name: 'Equiripple FIR design (Parks–McClellan)', deps: ['sig-10.8', 'pma-7.26'], refs: ['Lathi ch. 9'],
          pic: 'Run the Remez exchange on a low-pass specification: extremal frequencies hop until the error alternates with equal height, the minimax optimum for the given length.' },
        { num: '10.11', kind: 'Model', name: 'Digital resonator', deps: ['sig-10.4'], refs: ['Oppenheim–Willsky §10.7'],
          pic: 'Move a pole pair toward the unit circle at a chosen angle: the frequency response peak sharpens at that frequency and the impulse response rings longer.' },
        { num: '10.12', kind: 'Model', name: 'Comb and notch filters', deps: ['sig-10.2'], refs: ['Lathi ch. 5'],
          pic: 'Remove 50 Hz hum and its harmonics from a recording with a comb of zeros on the unit circle; nearby poles keep the notches narrow, audible on playback.' },
        { num: '10.13', kind: 'Phenomenon', name: 'Coefficient quantization and limit cycles', deps: ['sig-10.4', 'sig-7.12'], refs: ['Lathi ch. 5'],
          pic: 'Round the coefficients and states of a recursive filter to a few bits: poles shift off their design positions and, with zero input, the output sticks in a small sustained oscillation.' },
        { num: '10.14', kind: 'Method', name: 'Filter realizations: direct, cascade and parallel forms', deps: ['sig-2.7', 'sig-10.2'], refs: ['Oppenheim–Willsky §10.8'],
          pic: 'The same transfer function is drawn as a direct-form diagram, a cascade of biquads and a parallel bank; with quantized coefficients the cascade’s response stays closest to the ideal.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 11
    {
      n: 11,
      title: 'Analog filter design',
      summary: String.raw`Since ideal filters are impossible, design is about choosing the best compromise among passband flatness, stopband rejection, sharpness and phase behaviour. Classic families answer different questions: Butterworth is maximally flat, Chebyshev trades ripple for sharpness, elliptic filters are optimal for both bands, and Bessel filters preserve waveform shape. Frequency transformations turn one low-pass prototype into any filter, and the bilinear transform brings the designs into the digital world.`,
      items: [
        { num: '11.1', kind: 'Definition', name: 'Filter specifications: ripple, attenuation, transition', deps: ['sig-6.2', 'sig-6.3'], refs: ['Lathi ch. 4'],
          pic: 'Drag the corners of a tolerance template (passband ripple, stopband floor, edge frequencies); any filter whose magnitude curve threads the template is flagged as meeting spec.' },
        { num: '11.2', kind: 'Model', name: 'Butterworth filter: maximally flat', deps: ['sig-11.1', 'sig-9.7'], refs: ['Oppenheim–Willsky §9.7', 'Lathi ch. 4'],
          pic: 'Raise the Butterworth order: the poles spread evenly on a semicircle and the magnitude response flattens in the passband and steepens at cutoff, always passing −3 dB at the corner.' },
        { num: '11.3', kind: 'Model', name: 'Chebyshev type I filter: equiripple passband', deps: ['sig-11.2', 'pma-7.26'], refs: ['Lathi ch. 4'],
          pic: 'Allow 0.5 dB or 3 dB of passband ripple: the poles move onto an ellipse, the roll-off becomes much sharper than a Butterworth of the same order, and the step response rings more.' },
        { num: '11.4', kind: 'Model', name: 'Chebyshev type II filter: equiripple stopband', deps: ['sig-11.3'], refs: ['Lathi ch. 4'],
          pic: 'Zeros appear on the imaginary axis to carve notches in the stopband while the passband stays monotone; the ripple floor is dragged up and down.' },
        { num: '11.5', kind: 'Model', name: 'Elliptic (Cauer) filter', deps: ['sig-11.3', 'sig-11.4'], refs: ['Lathi ch. 4'],
          pic: 'Allow ripple in both bands and compare the minimum order needed to meet the same template: the elliptic filter wins against Chebyshev and Butterworth, shown as a bar chart of orders.' },
        { num: '11.6', kind: 'Model', name: 'Bessel filter: maximally flat group delay', deps: ['sig-11.2', 'sig-6.6'], refs: ['Lathi ch. 4'],
          pic: 'Send a square pulse through Butterworth and Bessel filters of equal order: the Bessel output overshoots almost nothing because its group delay is flat, at the cost of a lazier cutoff.' },
        { num: '11.7', kind: 'Method', name: 'Frequency transformations of a low-pass prototype', deps: ['sig-11.2'], refs: ['Lathi ch. 4'],
          pic: 'Apply s → ω₀/s or the band-pass substitution to a prototype: poles and zeros are remapped live and the response flips or splits around the chosen centre.' },
        { num: '11.8', kind: 'Method', name: 'Choosing the order from the specifications', deps: ['sig-11.2', 'sig-11.1'], refs: ['Lathi ch. 4'],
          pic: 'Tighten a template and the order formula steps up; the resulting Butterworth design’s curve is drawn threading the template with its margin highlighted.' },
        { num: '11.9', kind: 'Method', name: 'Digital IIR filters via the bilinear transform', deps: ['sig-10.7', 'sig-11.2'], refs: ['Lathi ch. 5'],
          pic: 'Pre-warp the critical frequencies, design an analog prototype and map it to z: the digital response meets the template exactly at the band edges, compared with a design that skipped pre-warping.' },
        { num: '11.10', kind: 'Concept', name: 'Sharpness versus ringing: the filter-design compromise', deps: ['sig-11.5', 'sig-11.6', 'sig-6.13'], refs: ['Lathi ch. 4'],
          pic: 'Plot each filter family as a point on a chart of transition width against step-response overshoot: improving one always worsens the other.' },
        { num: '11.11', kind: 'Method', name: 'Active realization of filter sections', deps: ['sig-11.2', 'circ-8.9'], refs: ['Lathi ch. 4'],
          pic: 'A sixth-order Butterworth design is factored into three biquads, each realised by a Sallen–Key stage whose component values are computed and whose responses multiply to the target.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 12
    {
      n: 12,
      title: 'Modulation and communication',
      summary: String.raw`Multiplying a message by a carrier shifts its spectrum to a new band, which lets many signals share one medium and lets antennas of practical size radiate them. The modulation property explains amplitude modulation and its demodulation, frequency-division multiplexing, single sideband via the Hilbert transform, frequency modulation, quadrature schemes and the superheterodyne radio. The chapter ends with OFDM — modulation by the FFT — and Shannon's capacity limit, the bridge to information theory.`,
      items: [
        { num: '12.1', kind: 'Method', name: 'Double-sideband amplitude modulation', deps: ['sig-5.7'], refs: ['Oppenheim–Willsky §8.1', 'Lathi ch. 7'],
          pic: 'Multiply a speech clip by a cosine carrier: its spectrum appears as two mirrored copies around ±f_c, and the time waveform shows the message inside the carrier’s envelope.' },
        { num: '12.2', kind: 'Method', name: 'Synchronous demodulation', deps: ['sig-12.1', 'sig-6.2'], refs: ['Oppenheim–Willsky §8.2'],
          pic: 'Multiply the received signal by a local carrier and low-pass filter it; detuning the local oscillator’s phase by 90° makes the recovered message vanish.' },
        { num: '12.3', kind: 'Model', name: 'AM with carrier and envelope detection', deps: ['sig-12.1', 'circ-4.5'], refs: ['Oppenheim–Willsky §8.2', 'Lathi ch. 7'],
          pic: 'Raise the modulation index: a diode–RC envelope detector follows the envelope faithfully until the index exceeds 1, when the envelope crosses zero and the output distorts.' },
        { num: '12.4', kind: 'Method', name: 'Frequency-division multiplexing', deps: ['sig-12.1'], refs: ['Oppenheim–Willsky §8.3'],
          pic: 'Three messages on three carriers share one channel: the combined spectrum shows three bands, and tuning a band-pass filter extracts any one of them.' },
        { num: '12.5', kind: 'Definition', name: 'Analytic signal and the Hilbert transform', deps: ['sig-5.6', 'rca-17.23'], refs: ['Oppenheim–Willsky §8.4'],
          pic: 'A real signal’s negative frequencies are deleted to form the analytic signal, drawn as a rotating vector whose length is the instantaneous envelope and whose angle gives instantaneous phase.' },
        { num: '12.6', kind: 'Method', name: 'Single-sideband modulation', deps: ['sig-12.5', 'sig-12.1'], refs: ['Oppenheim–Willsky §8.4'],
          pic: 'Build SSB by the phasing method: one sideband cancels and the other doubles, halving the bandwidth needed, with each path’s spectrum shown before summing.' },
        { num: '12.7', kind: 'Method', name: 'Frequency modulation', deps: ['sig-1.5', 'sig-12.5'], refs: ['Oppenheim–Willsky §8.7'],
          pic: 'Vary the deviation and message frequency: the carrier’s instantaneous frequency follows the message, plotted alongside the waveform and its spectrum.' },
        { num: '12.8', kind: 'Proposition', name: 'FM sidebands and Carson’s bandwidth rule', deps: ['sig-12.7'], refs: ['Oppenheim–Willsky §8.7'],
          pic: 'Raise the modulation index of a tone-modulated FM signal: sideband amplitudes follow Bessel functions, the carrier even vanishes at special indices, and 98% of the power stays within Carson’s bandwidth.' },
        { num: '12.9', kind: 'Method', name: 'Pulse-amplitude modulation and time-division multiplexing', deps: ['sig-7.1', 'sig-12.4'], refs: ['Oppenheim–Willsky §8.5', 'Oppenheim–Willsky §8.6'],
          pic: 'Interleave samples of several voices in time slots on one wire; demultiplexing and reconstruction recover each voice, and crosstalk appears if pulses are smeared by the channel.' },
        { num: '12.10', kind: 'Method', name: 'Quadrature amplitude modulation and constellations', deps: ['sig-12.2'], refs: ['Oppenheim–Willsky ch. 8'],
          pic: 'Two messages ride on cosine and sine carriers at the same frequency; received symbols form a constellation whose points blur into clouds as noise is added and symbol errors are counted.' },
        { num: '12.11', kind: 'Invention', name: 'The superheterodyne receiver', deps: ['sig-12.2', 'sig-12.4'], refs: ['Lathi ch. 7'],
          pic: 'Tune a dial: the local oscillator moves so that the wanted station always lands at a fixed intermediate frequency, where one sharp filter selects it; an image station shows why a front-end filter is needed.' },
        { num: '12.12', kind: 'Method', name: 'Phase-locked loop', deps: ['sig-12.7', 'sig-9.13'], refs: ['Oppenheim–Willsky ch. 8'],
          pic: 'A voltage-controlled oscillator chases an input whose frequency jumps: the phase error spikes and settles to zero as the loop locks, with lock lost if the jump exceeds the pull-in range.' },
        { num: '12.13', kind: 'Method', name: 'OFDM: modulation by the inverse FFT', deps: ['sig-8.8', 'sig-12.10'], refs: ['Lathi ch. 8'],
          pic: 'Place QAM symbols on dozens of orthogonal subcarriers with an inverse FFT; a cyclic prefix absorbs a multipath echo, and the receiver’s FFT recovers each subcarrier’s constellation.' },
        { num: '12.14', kind: 'Theorem', name: 'Shannon–Hartley channel capacity', deps: ['sig-7.3', 'sig-12.10', 'info-6.8'], refs: ['Oppenheim–Willsky ch. 8'],
          pic: 'Vary bandwidth and SNR: the capacity B log₂(1 + SNR) is plotted against the bit rates actually achieved by QAM constellations of increasing size, which approach but never cross it.' },
        { num: '12.15', kind: 'Phenomenon', name: 'Heterodyning and beat frequencies', deps: ['sig-5.7'], refs: ['Oppenheim–Willsky §8.1'],
          pic: 'Play two tones a few hertz apart: the sum swells and fades at the difference frequency, and multiplying instead of adding moves energy to the sum and difference frequencies.' },
        { num: '12.16', kind: 'Paper', name: 'A Method of Reducing Disturbances in Radio Signaling',
          paper: { authors: 'Edwin H. Armstrong', year: 1936, title: 'A Method of Reducing Disturbances in Radio Signaling by a System of Frequency Modulation',
                   venue: 'Proceedings of the IRE 24 (5): 689–740', doi: '10.1109/JRPROC.1936.227383' },
          introduces: ['sig-12.7'], deps: ['sig-12.1', 'sig-12.11'], refs: [],
          pic: 'Put a tone on a carrier by AM and by wideband FM, add the same noise to both and compare the demodulated outputs: raising the frequency deviation widens the spectrum but buys the output signal-to-noise gain Armstrong demonstrated.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 13
    {
      n: 13,
      title: 'Random signals and optimal filtering',
      summary: String.raw`Real signals are noisy, and noise is best described statistically: by its autocorrelation, or equivalently by its power spectral density. LTI systems shape noise spectra in a simple way, which leads to filters that are optimal in a precise sense — the matched filter for detecting a known pulse and the Wiener filter for estimating a signal buried in noise. Spectral estimation, prediction and delay estimation round out the toolkit.`,
      items: [
        { num: '13.1', kind: 'Definition', name: 'Random processes and wide-sense stationarity', deps: ['sig-1.1'], refs: ['Lathi ch. 7'],
          pic: 'Generate many realisations of a random process and overlay them; ensemble means and variances computed across the bundle stay constant in time for a stationary process but drift for a non-stationary one.' },
        { num: '13.2', kind: 'Definition', name: 'Autocorrelation function', deps: ['sig-13.1', 'sig-3.14'], refs: ['Lathi ch. 7'],
          pic: 'Correlate a noise record with shifted copies of itself: the autocorrelation drops quickly for white noise and slowly for smooth, low-pass noise.' },
        { num: '13.3', kind: 'Theorem', name: 'Wiener–Khinchin theorem', deps: ['sig-13.2', 'sig-5.18'], refs: ['Lathi ch. 7'],
          pic: 'Average periodograms of many noise records and compare with the Fourier transform of the estimated autocorrelation: the two spectral estimates converge to the same curve.' },
        { num: '13.4', kind: 'Definition', name: 'White noise', deps: ['sig-13.3'], refs: ['Lathi ch. 7'],
          pic: 'White noise has a flat spectrum and an autocorrelation that is a single spike; filtering it narrows the spectrum and widens the autocorrelation hump.' },
        { num: '13.5', kind: 'Theorem', name: 'Filtering random signals: output PSD = |H|² × input PSD', deps: ['sig-13.3', 'sig-6.1'], refs: ['Lathi ch. 7'],
          pic: 'Push white noise through a user-designed filter: the estimated output spectrum overlays |H(jω)|² times the input level.' },
        { num: '13.6', kind: 'Theorem', name: 'The matched filter maximises output SNR', deps: ['sig-13.5', 'rca-4.2'], refs: ['Lathi ch. 7'],
          pic: 'Hide a radar pulse in noise and try different receive filters: the output SNR peaks when the filter is the time-reversed pulse, as the Schwarz inequality predicts.' },
        { num: '13.7', kind: 'Model', name: 'The Wiener filter', deps: ['sig-13.5', 'rca-4.10'], refs: ['Lathi ch. 7'],
          pic: 'Denoise a signal with a filter whose gain at each frequency is S/(S + N); the mean-square error is lower than for any hand-tuned low-pass, shown on a comparison bar.' },
        { num: '13.8', kind: 'Method', name: 'Periodogram and Welch averaging', deps: ['sig-8.10', 'sig-13.3'], refs: ['Lathi ch. 8'],
          pic: 'A raw periodogram of noise is jagged and does not settle with more data; averaging windowed segments smooths it, trading resolution for variance.' },
        { num: '13.9', kind: 'Phenomenon', name: 'Pink (1/f) and Brownian (1/f²) noise', deps: ['sig-13.4', 'sig-13.5'], refs: ['Lathi ch. 7'],
          pic: 'Listen to white, pink and brown noise and see their log–log spectra with slopes 0, −1 and −2; integrating white noise produces the brown random walk.' },
        { num: '13.10', kind: 'Method', name: 'Linear prediction and the Yule–Walker equations', deps: ['sig-13.2'], refs: ['Lathi ch. 7'],
          pic: 'Fit an autoregressive predictor to a speech vowel: the prediction error is far smaller than the signal, and the predictor’s spectrum traces the vowel’s formant peaks.' },
        { num: '13.11', kind: 'Concept', name: 'Ergodicity: time averages equal ensemble averages', deps: ['sig-13.1'], refs: ['Lathi ch. 7'],
          pic: 'Compare the running time average of one realisation with the ensemble average at a fixed time: they converge for an ergodic process, but not for a process with a random constant offset.' },
        { num: '13.12', kind: 'Method', name: 'Time-delay estimation by cross-correlation', deps: ['sig-13.2', 'sig-13.6'], refs: ['Lathi ch. 7'],
          pic: 'Two microphones hear the same noisy source: the cross-correlation peak gives the arrival-time difference, and from it the direction of the source on a map.' },
        { num: '13.13', kind: 'Algorithm', name: 'Levinson–Durbin recursion', deps: ['sig-13.10'], refs: ['Lathi ch. 7'],
          pic: 'Solve the Yule–Walker equations order by order: each step adds one reflection coefficient, the prediction-error power falls monotonically, and every reflection coefficient stays inside (−1, 1), guaranteeing a stable all-pole model.' },
        { num: '13.14', kind: 'Paper', name: 'Extrapolation, Interpolation, and Smoothing of Time Series',
          paper: { authors: 'Norbert Wiener', year: 1949, title: 'Extrapolation, Interpolation, and Smoothing of Stationary Time Series',
                   venue: 'Technology Press of MIT and John Wiley & Sons (first issued as a classified report, 1942)', doi: '10.7551/mitpress/2946.001.0001' },
          introduces: ['sig-13.7'], deps: ['sig-13.2', 'sig-13.3', 'sig-13.5'], refs: [],
          pic: 'A signal buried in noise passes through the filter S/(S + N) built from spectra the reader draws, its mean-square error compared with ad hoc low-pass filters; a prediction mode forecasts a manoeuvring aircraft’s track a little ahead, the problem Wiener was set.' },
      ],
    },
  ],
};
