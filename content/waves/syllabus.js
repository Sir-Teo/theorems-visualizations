// Syllabus — Waves & Optics (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   Hecht, Optics 5e — chapter list (refs are chapter-level; section numbers not verified):
//     https://www.pearson.com/en-us/subject-catalog/p/optics/P200000006793
//   Crawford, Waves (Berkeley Physics Course 3) — chapter list (refs chapter-level):
//     https://www.rokomari.com/book/119593 (retailer TOC) and library records
//   MIT 8.03SC Vibrations and Waves (lecture list): https://ocw.mit.edu/courses/8-03sc-physics-iii-vibrations-and-waves-fall-2016/
//   MIT 2.71 Optics (calendar): https://ocw.mit.edu/courses/2-71-optics-spring-2009/pages/calendar/
//   Blundell, Oxford Electromagnetism (waves in matter, Fresnel, Brewster): https://users.ox.ac.uk/~sjb/electromagnetism.html
//   Wikipedia: https://en.wikipedia.org/wiki/List_of_laws_in_science (optics: Fermat, reflection,
//     Snell, Brewster, Malus, Beer–Lambert), https://en.wikipedia.org/wiki/List_of_paradoxes (Olbers)
// Gaps filled after comparison: Beer–Lambert law, stops/pupils/numerical aperture, Seidel aberrations,
//   Abbe sine condition, Hamiltonian (optical–mechanical) analogy, Mach–Zehnder interferometer,
//   the human eye (MIT 2.71), Talbot effect (MIT 2.71).
// Deliberate omissions: simple and coupled oscillators (→ mech ch. 4 and 11, cited), EM waves in
//   vacuum and matter, dispersion models and radiation (→ em ch. 11–12, cited), the Michelson–Morley
//   experiment (→ rel-1.4), Wiener–Khinchin and the Gabor limit as theorems (→ sig, cited), lasers
//   and nonlinear optics (lasers → qm ch. 13; nonlinear optics left to a later optics collection).
// Landmark papers (kind 'Paper') appended Oct 2026; each citation checked against Crossref, the publisher, or a digitized library copy.
export default {
  collection: 'waves',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'The wave equation',
      summary: String.raw`A chain of coupled oscillators becomes, in the continuum limit, a string obeying the wave equation, whose general solution is two shapes sliding in opposite directions. Linearity gives superposition; energy flows along the wave; a mismatch of impedance at a junction reflects part of it. The same equation describes sound and, in three dimensions, spherical waves — with the surprise that sharp signals stay sharp only in odd dimensions — and moving sources produce Doppler shifts and shock cones.`,
      items: [
        { num: '1.1', kind: 'Model', name: 'Continuum limit of a chain: the wave equation', deps: ['mech-11.8', 'pma-5.15'], refs: ['Crawford ch. 2'],
          pic: 'A chain of masses and springs with a slider for the number of masses: as it grows at fixed total mass and stiffness, a released pulse’s motion converges to the solution of the wave equation drawn beside it.' },
        { num: '1.2', kind: 'Model', name: 'Transverse waves on a stretched string', deps: ['mech-1.6'], refs: ['Crawford ch. 2', 'Hecht ch. 2'],
          pic: 'Pluck a string with tension and density sliders: the measured pulse speed matches √(T/μ), and pushing the amplitude up until the small-slope approximation fails makes the simulated nonlinear string deviate.' },
        { num: '1.3', kind: 'Theorem', name: 'D’Alembert’s solution', deps: ['waves-1.2', 'pde-2.2'], refs: ['Crawford ch. 4', 'Hecht ch. 2'],
          pic: 'Draw an initial shape and velocity profile: the solution splits into left- and right-moving halves, each drawn separately and summed, exactly as f(x − vt) + g(x + vt).' },
        { num: '1.4', kind: 'Definition', name: 'Harmonic waves: wavelength, frequency, phase velocity', deps: ['waves-1.3'], refs: ['Hecht ch. 2'],
          pic: 'A sinusoidal wave with wavelength and period sliders: a marker riding a crest moves at λ/T, while a probe at fixed x oscillates in time with the same period.' },
        { num: '1.5', kind: 'Method', name: 'Complex representation of waves', deps: ['waves-1.4', 'rca-0.7'], refs: ['Hecht ch. 2'],
          pic: 'A rotating complex amplitude at each point of a line, with its real part drawn as the physical wave; adding two waves is done by adding the arrows and checked against adding the curves.' },
        { num: '1.6', kind: 'Principle', name: 'Superposition of linear waves', deps: ['waves-1.3', 'pde-2.5'], refs: ['Crawford ch. 4', 'Hecht ch. 2'],
          pic: 'Send two pulses toward each other on a string: they pass through one another unchanged; turn on a nonlinear stiffness and they scatter and distort after colliding.' },
        { num: '1.7', kind: 'Theorem', name: 'Energy density and energy flux of a wave', deps: ['waves-1.2', 'mech-3.6', 'pde-2.4'], refs: ['Crawford ch. 4'],
          pic: 'Kinetic and potential energy densities are shaded under a travelling pulse: they are equal at every point, and the energy flowing past a probe matches the pulse’s total energy.' },
        { num: '1.8', kind: 'Definition', name: 'Characteristic impedance', deps: ['waves-1.7'], refs: ['Crawford ch. 4'],
          pic: 'Drive the end of a semi-infinite string with a sinusoidal force: the ratio of force to transverse velocity is a constant √(Tμ), and the driver delivers power without any reflection.' },
        { num: '1.9', kind: 'Theorem', name: 'Reflection and transmission at a junction', deps: ['waves-1.8', 'waves-1.3', 'pma-9.36'], refs: ['Crawford ch. 5'],
          pic: 'A pulse meets a joint between strings of different density: reflected and transmitted amplitudes follow (Z₁ − Z₂)/(Z₁ + Z₂) and 2Z₁/(Z₁ + Z₂), inverting for a heavier second string and balancing the energy ledger.' },
        { num: '1.10', kind: 'Method', name: 'Impedance matching', deps: ['waves-1.9'], refs: ['Crawford ch. 5'],
          pic: 'Insert a section of intermediate impedance between two mismatched strings: its length slider cancels the reflected wave at a quarter wavelength when the impedance is the geometric mean.' },
        { num: '1.11', kind: 'Model', name: 'Sound waves in fluids', deps: ['waves-1.1', 'mech-1.6'], refs: ['Crawford ch. 4'],
          pic: 'Pistons push on a column of gas particles: compression and rarefaction pulses travel at a speed set by stiffness over density, and particles oscillate along the propagation direction.' },
        { num: '1.12', kind: 'Model', name: 'Plane and spherical waves in three dimensions', deps: ['waves-1.3', 'pde-6.10'], refs: ['Hecht ch. 2', 'Crawford ch. 7'],
          pic: 'A point source in 3D (sliced): amplitude falls as 1/r so the power through every sphere is the same; far away a small patch looks like a plane wave.' },
        { num: '1.13', kind: 'Theorem', name: 'Sharp signals only in odd dimensions', deps: ['waves-1.12', 'pde-6.5'], refs: ['Crawford ch. 7'],
          pic: 'Flash a brief pulse in 1D, 2D and 3D side by side: in 3D a probe sees a clean pulse pass, in 2D it sees a lingering tail, like ripples after a pebble — compared on a shared time axis.' },
        { num: '1.14', kind: 'Phenomenon', name: 'Doppler effect', deps: ['waves-1.4'], refs: ['Hecht ch. 2', 'Crawford ch. 4'],
          pic: 'Move a source and an observer with sliders: wavefronts bunch ahead and spread behind, and the observed frequency readout matches f(v + v_o)/(v − v_s).' },
        { num: '1.15', kind: 'Phenomenon', name: 'Shock waves and Mach cones', deps: ['waves-1.14'], refs: ['Hecht ch. 2'],
          pic: 'Push the source speed past the wave speed: the circular wavefronts pile into a cone whose half-angle obeys sin θ = v/v_s, and below Mach 1 the cone disappears.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Standing waves and Fourier analysis',
      summary: String.raw`Boundaries select standing waves with discrete frequencies — the normal modes of strings, membranes and boxes — and any initial shape is a sum of them, with energy shared out mode by mode. Counting modes in a box gives a density of states growing like ω², which will reappear in blackbody radiation and solids. A pulse is a continuous superposition, described by its Fourier transform, and a short pulse necessarily contains a wide band of frequencies.`,
      items: [
        { num: '2.1', kind: 'Model', name: 'Standing waves on a fixed string', deps: ['waves-1.3', 'waves-1.6', 'mech-11.9'], refs: ['Crawford ch. 2'],
          pic: 'Two counter-propagating waves of equal amplitude add to a pattern whose nodes never move; fix both ends of the string and only wavelengths 2L/n survive.' },
        { num: '2.2', kind: 'Definition', name: 'Normal modes, nodes and antinodes', deps: ['waves-2.1', 'mech-11.4'], refs: ['Crawford ch. 2'],
          pic: 'Select a mode number to see the shape oscillate with every point in phase; launch a random shape and see it is not a mode because it changes form over time.' },
        { num: '2.3', kind: 'Theorem', name: 'Any shape is a sum of modes', deps: ['waves-2.2', 'pma-8.14', 'pma-8.16', 'pde-4.1'], refs: ['Crawford ch. 2', 'Hecht ch. 7'],
          pic: 'Draw an initial string shape: its Fourier sine coefficients appear as bars, the partial sums converge to it, and evolving each mode at its own frequency reproduces the full motion.' },
        { num: '2.4', kind: 'Theorem', name: 'Energy is shared mode by mode', deps: ['waves-2.3', 'waves-1.7', 'pma-8.16'], refs: ['Crawford ch. 2'],
          pic: 'As a plucked string vibrates, the energy bar of each mode stays constant and their sum equals the total energy; add a nonlinear coupling and energy begins to flow between modes.' },
        { num: '2.5', alias: 'sig-4.4', name: 'Gibbs phenomenon' },
        { num: '2.6', kind: 'Model', name: 'Modes of a rectangular membrane', deps: ['waves-2.2', 'rca-11.3', 'pde-5.6'], refs: ['Crawford ch. 7'],
          pic: 'Pick mode numbers (m, n) for a drum of adjustable aspect ratio: nodal lines form a grid, and a square drum shows degenerate modes whose mixtures make diagonal nodal patterns.' },
        { num: '2.7', kind: 'Model', name: 'Modes of a circular drum', deps: ['waves-2.6', 'ode-4.4'], refs: ['Crawford ch. 7'],
          pic: 'Circular-membrane modes with nodal circles and diameters: the frequencies follow zeros of Bessel functions and are not integer multiples of the fundamental, as a spectrum plot shows.' },
        { num: '2.8', kind: 'Theorem', name: 'Counting modes in a box (Weyl’s law)', deps: ['waves-2.6', 'pde-7.10'], refs: ['Crawford ch. 7'],
          pic: 'Allowed wavevectors of a box form a lattice; the number inside a sphere of radius k grows like the volume times k³, and a plot of the count against frequency hugs the ω² density of states.' },
        { num: '2.9', kind: 'Definition', name: 'Fourier transform of a pulse', deps: ['waves-2.3', 'rca-9.1', 'rca-9.11'], refs: ['Hecht ch. 7'],
          pic: 'Widen the period of a repeating pulse train: its discrete spectrum lines crowd together into a continuous Fourier transform, drawn as amplitude and phase.' },
        { num: '2.10', kind: 'Theorem', name: 'Bandwidth theorem for wave pulses', deps: ['waves-2.9', 'sig-5.15'], refs: ['Hecht ch. 7', 'Crawford ch. 6'],
          pic: 'Shorten a wave pulse and watch its spectrum widen: the product of rms duration and rms bandwidth never falls below one half, reached only by Gaussian pulses.' },
        { num: '2.11', kind: 'Phenomenon', name: 'Resonance of a driven string', deps: ['waves-2.2', 'mech-4.10'], refs: ['Crawford ch. 3'],
          pic: 'Shake one end of a damped string and sweep the frequency: the amplitude spikes at each mode frequency, with the matching standing-wave pattern appearing at each peak.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Dispersion and wave packets',
      summary: String.raw`When wave speed depends on frequency, a wave group travels at the group velocity dω/dk rather than the phase velocity, and pulses spread as they go. Beats and modulation show the idea in miniature; water waves, periodic chains and waveguides give rich dispersion relations with wakes, band gaps and evanescent waves. Nonlinearity can balance dispersion to make solitons, and causality ties the dispersion of a medium to its absorption through the Kramers–Kronig relations.`,
      items: [
        { num: '3.1', kind: 'Phenomenon', name: 'Beats', deps: ['waves-1.6'], refs: ['Crawford ch. 6', 'Hecht ch. 7'],
          pic: 'Add two tones with nearby frequencies: the sum swells and fades at the difference frequency, which a readout compares with the measured envelope period.' },
        { num: '3.2', kind: 'Method', name: 'Amplitude modulation and sidebands', deps: ['waves-3.1', 'waves-2.9'], refs: ['Crawford ch. 6'],
          pic: 'Modulate a carrier with a slow signal: the spectrum shows the carrier flanked by sidebands at the signal frequency, and overmodulation distorts the recovered envelope.' },
        { num: '3.3', kind: 'Definition', name: 'Dispersion relation', deps: ['waves-1.4', 'mech-11.8', 'pde-9.3'], refs: ['Crawford ch. 6'],
          pic: 'Choose a medium — string, stiff string, chain of masses, plasma — and its ω(k) curve is plotted; clicking a point on the curve launches the corresponding sinusoid.' },
        { num: '3.4', kind: 'Definition', name: 'Phase velocity and group velocity', deps: ['waves-3.3', 'waves-3.1', 'pma-5.10'], refs: ['Crawford ch. 6', 'Hecht ch. 7'],
          pic: 'Two close wavenumbers beating on a dispersive curve: crests (red) move at ω/k while the envelope (green) moves at Δω/Δk, which the tangent line on the dispersion plot predicts.' },
        { num: '3.5', kind: 'Theorem', name: 'Wave packets travel at the group velocity', deps: ['waves-3.4', 'waves-2.9', 'pma-5.15'], refs: ['Crawford ch. 6'],
          pic: 'Launch a packet centred on any wavenumber and follow its peak: it moves at dω/dk evaluated at the centre, derived by stationary phase and confirmed by the simulation.' },
        { num: '3.6', kind: 'Phenomenon', name: 'Dispersive spreading of a pulse', deps: ['waves-3.5', 'fa-7.6', 'pma-8.21', 'rca-9.13'], refs: ['Crawford ch. 6'],
          pic: 'A Gaussian pulse in a medium with quadratic dispersion broadens and chirps, its width following the predicted √(1 + (t/τ)²) law; in a non-dispersive medium it keeps its shape.' },
        { num: '3.7', kind: 'Model', name: 'Deep and shallow water waves', deps: ['waves-3.3'], refs: ['Crawford ch. 6'],
          pic: 'Vary the water depth: the dispersion relation ω² = gk tanh(kh) moves from non-dispersive shallow waves at √(gh) to deep-water waves whose groups move at half the crest speed.' },
        { num: '3.8', kind: 'Phenomenon', name: 'Ship wakes and the Kelvin angle', deps: ['waves-3.7', 'waves-3.5'], refs: ['Crawford ch. 7'],
          pic: 'A boat moves across deep water: the wake built from stationary-phase waves always fills a wedge of about 19.5°, whatever the speed slider says, while shallow water opens the angle.' },
        { num: '3.9', kind: 'Paradox', name: 'Group velocity faster than light', deps: ['waves-3.4', 'em-11.13'], refs: ['Hecht ch. 7'],
          pic: 'Send a smooth pulse through a medium with anomalous dispersion: its peak exits early, faster than c, yet the front of a sharply switched-on signal never outruns light.' },
        { num: '3.10', kind: 'Model', name: 'Waves in a periodic chain: band gaps', deps: ['waves-3.3', 'mech-11.8', 'ladr-7.31'], refs: ['Crawford ch. 2'],
          pic: 'A chain of alternating heavy and light masses: the dispersion curve splits into acoustic and optical branches with a forbidden band between, where a driven wave decays instead of travelling.' },
        { num: '3.11', kind: 'Phenomenon', name: 'Evanescent waves below cutoff', deps: ['waves-3.3', 'em-11.15'], refs: ['Crawford ch. 4'],
          pic: 'Drive a system below its cutoff frequency (a waveguide, a chain above its top frequency): the disturbance decays exponentially without propagating, with decay length shrinking further from cutoff.' },
        { num: '3.12', kind: 'Model', name: 'Klein–Gordon dispersion', deps: ['waves-3.3'], refs: ['Crawford ch. 4'],
          pic: 'Pendulums coupled by springs obey ω² = ω₀² + c²k²: the group velocity stays below c while the phase velocity exceeds it, and their product is c² for every k.' },
        { num: '3.13', kind: 'Phenomenon', name: 'Solitons', deps: ['waves-3.7', 'waves-3.6', 'pde-9.9'], refs: ['Crawford ch. 6'],
          pic: 'Integrate the Korteweg–de Vries equation: a hump of the right shape travels unchanged because steepening balances spreading, and two solitons pass through each other emerging only shifted.' },
        { num: '3.14', kind: 'Theorem', name: 'Kramers–Kronig relations', deps: ['em-11.12', 'rca-19.2', 'sig-6.4'], refs: ['Hecht ch. 3'],
          pic: 'Draw an absorption line: the refractive index computed from it by the Kramers–Kronig integral matches the Lorentz-oscillator index, and an acausal response breaks the agreement.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Light at interfaces',
      summary: String.raw`Light is an electromagnetic wave whose speed in matter is reduced by the refractive index. Huygens’ wavelet construction gives the laws of reflection and refraction, and the electromagnetic boundary conditions give their strengths — the Fresnel equations — with Brewster’s angle, total internal reflection, the evanescent wave and the half-wave phase flip as consequences. Dispersion splits white light in prisms and rainbows, fibres trap light by total internal reflection, and absorbing media dim it exponentially.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Light as an electromagnetic wave', deps: ['em-11.2'], refs: ['Hecht ch. 3'],
          pic: 'Slide along the electromagnetic spectrum from radio to gamma rays: wavelength, frequency and photon-scale readouts update, with the narrow visible band marked by colour.' },
        { num: '4.2', kind: 'Definition', name: 'Irradiance', deps: ['em-11.5'], refs: ['Hecht ch. 3'],
          pic: 'A detector with an adjustable response time averages the oscillating Poynting flux: slow detectors read the steady irradiance ½cε₀E₀², fast ones see the 2ω flicker.' },
        { num: '4.3', kind: 'Definition', name: 'Refractive index and optical path length', deps: ['em-11.8'], refs: ['Hecht ch. 4'],
          pic: 'Wavefronts enter a glass slab of adjustable index: they slow and bunch up, and the optical path n·L across the slab equals the vacuum distance light would cover in the same time.' },
        { num: '4.4', kind: 'Principle', name: 'Huygens’ principle', deps: ['waves-1.12'], refs: ['Hecht ch. 4'],
          pic: 'Each point of a wavefront emits a wavelet whose envelope after a short time is drawn as the new front; reshape the initial front and the construction follows it around corners and obstacles.' },
        { num: '4.5', kind: 'Law', name: 'Law of reflection', deps: ['waves-4.4', 'pma-5.8'], refs: ['Hecht ch. 4'],
          pic: 'A plane wave strikes a mirror at an adjustable angle: the Huygens wavelets from successive points along the mirror build a reflected front leaving at the same angle.' },
        { num: '4.6', kind: 'Law', name: 'Snell’s law of refraction', deps: ['waves-4.4', 'waves-4.3', 'pma-5.8'], refs: ['Hecht ch. 4'],
          pic: 'Wavelets launched into a slower medium build a front tilted toward the normal; the measured angles satisfy n₁ sin θ₁ = n₂ sin θ₂ for every incidence angle and index you set.' },
        { num: '4.7', kind: 'Theorem', name: 'Fresnel equations', deps: ['em-10.7', 'em-11.9', 'waves-4.6'], refs: ['Hecht ch. 4'],
          pic: 'Reflection and transmission coefficients for s and p polarization plotted against incidence angle; drag the index ratio and confirm R + T = 1 for both polarizations.' },
        { num: '4.8', kind: 'Law', name: 'Brewster’s angle', deps: ['waves-4.7'], refs: ['Hecht ch. 4'],
          pic: 'Sweep the angle of incidence: p-polarized reflection drops to exactly zero at tan θ_B = n₂/n₁, where reflected and refracted rays are perpendicular.' },
        { num: '4.9', kind: 'Phenomenon', name: 'Total internal reflection', deps: ['waves-4.6', 'waves-4.7'], refs: ['Hecht ch. 4'],
          pic: 'Shine light from glass toward air and raise the angle: the refracted ray grazes the surface at the critical angle and beyond it all the light is reflected, with R = 1 on the readout.' },
        { num: '4.10', kind: 'Phenomenon', name: 'Evanescent waves and frustrated TIR', deps: ['waves-4.9', 'waves-3.11'], refs: ['Hecht ch. 4'],
          pic: 'Past the critical angle a field still leaks a fraction of a wavelength into the air; bring a second prism within that distance and light tunnels across, falling off exponentially with the gap.' },
        { num: '4.11', kind: 'Theorem', name: 'Stokes relations', deps: ['waves-4.7'], refs: ['Hecht ch. 4'],
          pic: 'Time-reverse a reflected and transmitted pair: consistency forces r′ = −r and tt′ + r² = 1, which the Fresnel coefficients computed for both directions confirm numerically.' },
        { num: '4.12', kind: 'Phenomenon', name: 'Prisms and the rainbow', deps: ['waves-4.6', 'em-11.13', 'pma-5.8'], refs: ['Hecht ch. 5'],
          pic: 'Trace rays of many colours through a water droplet: the deflection has a minimum near 138°, rays pile up there, and dispersion spreads the colours into the primary bow (with the secondary bow from two reflections).' },
        { num: '4.13', kind: 'Model', name: 'Optical fibres', deps: ['waves-4.9', 'waves-3.4'], refs: ['Hecht ch. 5'],
          pic: 'Launch rays into a fibre at a range of angles: those inside the acceptance cone are trapped by total internal reflection, and their different path lengths smear a short pulse (modal dispersion).' },
        { num: '4.14', kind: 'Phenomenon', name: 'Phase flip on reflection', deps: ['waves-4.7'], refs: ['Hecht ch. 4'],
          pic: 'A wave reflects from a denser medium and then from a rarer one: the reflected wave is inverted in the first case and upright in the second, shown with matching string-junction pulses.' },
        { num: '4.15', kind: 'Law', name: 'Beer–Lambert law', deps: ['waves-4.2', 'em-11.13', 'pma-6.21'], refs: ['Hecht ch. 3'],
          pic: 'Send light through an absorbing solution with concentration and path-length sliders: the transmitted fraction falls exponentially and its logarithm is linear in both — until saturation or scattering bends the line.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      "n": 5,
      "title": "Geometrical optics",
      "summary": "A short-wave expansion connects scalar wave phase to stationary optical length and Hamiltonian rays. Exact conic reflection and gradient-index examples expose the assumptions behind paraxial lenses, pupils and instruments. Aberration models and canonical phase-space conservation distinguish imperfect imaging, geometric acceptance and transmitted radiance.",
      "items": [
        {
          "num": "5.1",
          "kind": "Theorem",
          "name": "Eikonal equation: rays from short waves",
          "deps": [
            "waves-4.3",
            "waves-1.12"
          ],
          "refs": [
            "MIT18.325 (2015), Geometry of waves, printed43–44 and49; correct transport sign obtained by substitution",
            "Fang, MIT2.71 Lecture10, actual pp1–4"
          ],
          "pic": "Change wavelength and index gradient. Compare an actual scalar Helmholtz initial-value solution with its WKB field or their complex difference."
        },
        {
          "num": "5.2",
          "kind": "Principle",
          "name": "Fermat’s principle from stationary phase",
          "deps": [
            "waves-5.1",
            "mech-5.2"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture2, actual pp3–4, stationary optical path and Snell variation"
          ],
          "pic": "Move a trial crossing and compare its optical length with the stationary crossing. Reduce wavelength to see cancellation in a specified weighted boundary integral."
        },
        {
          "num": "5.3",
          "kind": "Phenomenon",
          "name": "Mirages and graded-index optics",
          "deps": [
            "waves-5.1",
            "waves-5.2"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture10, actual pp3–4, stratified index and quadratic GRIN"
          ],
          "pic": "Switch between an exact GRIN ray and a synthetic stratified mirage ray. The momentum readout checks the first integral along the calculated trajectory."
        },
        {
          "num": "5.4",
          "kind": "Theorem",
          "name": "Optical–mechanical analogy",
          "deps": [
            "waves-5.1",
            "mech-12.3"
          ],
          "refs": [
            "MIT18.325 (2015), Geometry of waves, printed47–49, Hamiltonian rays"
          ],
          "pic": "Change the initial state and Verlet step count. Compare the numerical mechanical trajectory with the analytic optical characteristic and inspect the energy discrepancy."
        },
        {
          "num": "5.5",
          "kind": "Theorem",
          "name": "Perfect imaging by conic surfaces",
          "deps": [
            "waves-5.2",
            "waves-4.5"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture2, actual pp5–6, parabolic reflection; ellipse distance/normal derivation supplied here"
          ],
          "pic": "Compare exact specular reflection and optical lengths on an ellipse, parabola and matched sphere. The sphere uses its real surface normal rather than an imposed focus."
        },
        {
          "num": "5.6",
          "kind": "Method",
          "name": "Thin-lens and lensmaker’s equations",
          "deps": [
            "waves-4.6"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture2, actual pp9–10 and13, signed spherical refraction and thin-lens conjugacy"
          ],
          "pic": "Adjust index, signed curvatures and object distance. The paraxial rays and numerical conjugate update through converging, diverging and near-collimated cases."
        },
        {
          "num": "5.7",
          "kind": "Model",
          "name": "Spherical mirrors",
          "deps": [
            "waves-4.5",
            "waves-5.6"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture2, reflection and spherical optical surfaces; global-coordinate paraxial reflection derivation supplied here"
          ],
          "pic": "Choose concave or convex curvature and move the object. Compare the Gaussian image coordinate with the actual selected-height reflected ray."
        },
        {
          "num": "5.8",
          "kind": "Definition",
          "name": "Magnification; real and virtual images",
          "deps": [
            "waves-5.6"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture2, actual pp13–14, signed image distance and magnification"
          ],
          "pic": "Move the object through the focal region and switch lens sign. Solid outgoing rays and dashed extensions distinguish real and virtual conjugates."
        },
        {
          "num": "5.9",
          "kind": "Method",
          "name": "Ray-transfer matrices",
          "deps": [
            "waves-5.6"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture4, actual pp4–6, ray matrices; canonical-coordinate conversion derived here"
          ],
          "pic": "Change interface curvature, output index, gap and final lens power. Compare sequential tracing with the product matrix and both coordinate determinants."
        },
        {
          "num": "5.10",
          "kind": "Definition",
          "name": "Stops, pupils and numerical aperture",
          "deps": [
            "waves-5.8",
            "waves-5.9"
          ],
          "refs": [
            "Greivenkamp2019 Stops and apertures, actual slides9-1–9-6"
          ],
          "pic": "Move and resize the physical back stop and lens rim. Watch which aperture limits and how its entrance-pupil image changes, including a pupil at infinity."
        },
        {
          "num": "5.11",
          "kind": "Model",
          "name": "The human eye",
          "deps": [
            "waves-5.6",
            "waves-5.9"
          ],
          "refs": [
            "Greivenkamp2019 The Eye, actual slides22-3–22-7, reduced-eye assumptions"
          ],
          "pic": "Adjust equivalent eye power, a coincident corrective power and pupil size. Compare the calculated focal distance with the fixed retina."
        },
        {
          "num": "5.12",
          "kind": "Model",
          "name": "Microscopes and telescopes",
          "deps": [
            "waves-5.9",
            "waves-5.8"
          ],
          "refs": [
            "Greivenkamp2019 Magnifiers and telescopes, actual slides13-7–13-9",
            "Greivenkamp2019 Relays and microscopes, actual slides14-29–14-30"
          ],
          "pic": "Switch between a telescope and microscope. Each mode exposes only its own focal lengths and separation controls and traces the corresponding paraxial bundle."
        },
        {
          "num": "5.13",
          "kind": "Phenomenon",
          "name": "Spherical aberration",
          "deps": [
            "waves-4.6",
            "waves-5.5",
            "waves-5.9"
          ],
          "refs": [
            "Greivenkamp2019 Stop location and image quality, actual pp1–6, spherical ray error and defocus",
            "Wyant and Creath, Basic Wavefront Aberration Theory for Optical Metrology, printed13–17, wavefront-to-ray gradient"
          ],
          "pic": "Open the aperture and move the screen. Compare exact meridional rays or their screen spots with the paraxial focal coordinate."
        },
        {
          "num": "5.14",
          "kind": "Phenomenon",
          "name": "Seidel aberrations",
          "deps": [
            "waves-5.13",
            "waves-5.10"
          ],
          "refs": [
            "Wyant and Creath, Basic Wavefront Aberration Theory for Optical Metrology, actual printed13–19, Eqs25–33 and TableII"
          ],
          "pic": "Choose one wavefront term and vary field, aperture or independent defocus. Actual derivatives of the declared polynomial generate the deterministic pupil spots."
        },
        {
          "num": "5.15",
          "kind": "Phenomenon",
          "name": "Chromatic aberration and the achromat",
          "deps": [
            "waves-5.6",
            "waves-4.12"
          ],
          "refs": [
            "Greivenkamp2019 Chromatic aberrations, actual slides20-11–20-14, contact achromat and secondary spectrum"
          ],
          "pic": "Compare a single synthetic lens with its two-component achromat and probe the power at intermediate wavelengths. Switch to identical dispersion to expose the incompatible constraints."
        },
        {
          "num": "5.16",
          "kind": "Theorem",
          "name": "Abbe sine condition",
          "deps": [
            "waves-5.2",
            "waves-5.8",
            "waves-5.10",
            "waves-5.13"
          ],
          "refs": [
            "Lampen, Dubin and Burge (2011), Applied Optics50 pp6391–6398, actual §2 pp6392–6393, pupil mapping and first-order field condition; indexed endpoint derivation supplied here"
          ],
          "pic": "Compare synthetic sine, tangent and perturbed pupil-angle maps. The residual gives the first-order optical-path mismatch for a stated small object displacement."
        },
        {
          "num": "5.17",
          "kind": "Theorem",
          "name": "Conservation of étendue",
          "deps": [
            "waves-5.9",
            "waves-5.4",
            "mech-12.13"
          ],
          "refs": [
            "Greivenkamp2019 Radiative transfer, actual slides11-15–11-20, paraxial throughput and normalized radiance",
            "Exact nonparaxial cosine integral derived here from canonical momenta"
          ],
          "pic": "Transport and physically clip a canonical phase patch, or test a three-dimensional cone mapping. Vary attenuation independently to distinguish lost flux from lost geometric acceptance."
        },
        {
          "num": "5.18",
          "alias": "astro-10.1",
          "name": "Olbers’ paradox"
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      "n": 6,
      "title": "Interference and coherence",
      "summary": "Coherent waves add amplitudes, not intensities, and the cross term makes fringes: Young’s slits, thin films and Newton’s rings, and interferometers that split and recombine beams to measure lengths, spectra and refractive indices. Multiple-beam interference sharpens fringes into the narrow resonances of Fabry–Pérot cavities and dielectric mirrors. Real light is only partly coherent, and the visibility of fringes measures how far its phase memory reaches in time and space — enough to measure the diameters of stars.",
      "items": [
        {
          "num": "6.1",
          "kind": "Theorem",
          "name": "Interference of two coherent waves",
          "deps": [
            "waves-1.6",
            "waves-4.2"
          ],
          "refs": [
            "Fang, MIT2.71 Lecture11, pp1–2, complex interference and visibility",
            "Syllabus guide: Hecht ch.9 (book body not consulted)"
          ],
          "pic": "Change relative phase, beam balance and polarization. Compare the actual instantaneous field components with the phase-dependent cycle-averaged irradiance."
        },
        {
          "num": "6.2",
          "kind": "Phenomenon",
          "name": "Young’s double-slit experiment",
          "deps": [
            "waves-6.1",
            "waves-4.4"
          ],
          "refs": [
            "Fang Lecture11, pp4–5, exact paths and paraxial double-slit interference",
            "Syllabus guide: Hecht ch.9 (book body not consulted)"
          ],
          "pic": "Vary separation, wavelength and screen distance, then cover either aperture. Compare the exact paths with the paraxial fringe-spacing guide."
        },
        {
          "num": "6.3",
          "kind": "Definition",
          "name": "Fringe visibility",
          "deps": [
            "waves-6.2"
          ],
          "refs": [
            "Fang Lecture11, pp2–4, visibility and complex coherence",
            "Van Exter, Classical & Quantum Optics, printed 21–22, coherence definitions",
            "Gaussian characteristic-function calculation and finite average derived here"
          ],
          "pic": "Unbalance the beams, add Gaussian phase jitter or add background. Compare the ensemble curve with a seeded finite phase average and inspect the actual samples."
        },
        {
          "num": "6.4",
          "kind": "Phenomenon",
          "name": "Lloyd’s mirror",
          "deps": [
            "waves-6.2",
            "waves-4.14"
          ],
          "refs": [
            "Fang Lecture11, pp4–5, two-source path method; image-source construction derived here",
            "Syllabus guide: Hecht ch.9 (book body not consulted)"
          ],
          "pic": "Move the source and screen, change wavelength and reduce the reflected amplitude. See when the edge cancellation survives."
        },
        {
          "num": "6.5",
          "kind": "Phenomenon",
          "name": "Thin-film interference",
          "deps": [
            "waves-6.1",
            "waves-4.14"
          ],
          "refs": [
            "Macleod, Thin Film Optics, pp7–10 and13–16, transparent-layer interference",
            "Van Exter, printed 13–17, lossless interfaces and multiple reflections"
          ],
          "pic": "Explore thickness, refractive index and wavelength. The map shows calculated reflectance, while the selected-thickness plot compares reflection and transmission."
        },
        {
          "num": "6.6",
          "kind": "Method",
          "name": "Antireflection coatings",
          "deps": [
            "waves-6.5",
            "waves-1.10"
          ],
          "refs": [
            "Macleod, pp7–10, half-wave/quarter-wave layers and reflection matching",
            "Syllabus guide: Hecht ch.9 (book body not consulted)"
          ],
          "pic": "Adjust coating index and optical thickness, then compare coated and bare glass across wavelength. The matching point is marked at the fixed 550 nm design wavelength."
        },
        {
          "num": "6.7",
          "kind": "Phenomenon",
          "name": "Newton’s rings",
          "deps": [
            "waves-6.5"
          ],
          "refs": [
            "Macleod, pp7–10, air-layer phase cancellation; spherical-gap construction derived here",
            "Syllabus guide: Hecht ch.9 (book body not consulted)"
          ],
          "pic": "Change lens curvature, central gap, wavelength and dark-ring order. Compare the exact spherical radius with the paraxial estimate and the full radial reflectance."
        },
        {
          "num": "6.8",
          "kind": "Model",
          "name": "Michelson interferometer",
          "deps": [
            "waves-6.1"
          ],
          "refs": [
            "Fang Lecture11, pp2–4, Michelson interferometer and round-trip delay",
            "Syllabus guide: Hecht ch.9 (book body not consulted)"
          ],
          "pic": "Move the mirror, insert a plate and change its index. Read the actual path difference and watch the two output powers trade places."
        },
        {
          "num": "6.9",
          "kind": "Model",
          "name": "Mach–Zehnder interferometer",
          "deps": [
            "waves-6.1",
            "waves-4.11"
          ],
          "refs": [
            "Van Exter, printed 13–15, unitary beam splitters and two-beam interferometers",
            "Syllabus guide: Hecht ch.9 (book body not consulted)"
          ],
          "pic": "Change beam-splitter balance, arm phase and attenuation. Inspect both complex output amplitudes and the transmitted-plus-absorbed power ledger."
        },
        {
          "num": "6.10",
          "kind": "Model",
          "name": "Fabry–Pérot interferometer",
          "deps": [
            "waves-6.1",
            "waves-4.11"
          ],
          "refs": [
            "Fang Lecture11, pp6–7, Eqs26–37, Fabry–Pérot sum",
            "Van Exter, printed 15–18, Airy transmission and finesse"
          ],
          "pic": "Increase reflectivity to sharpen the resonance, then change phase and the number of retained transmitted beams. Compare the finite phasor sum with the exact Airy curve."
        },
        {
          "num": "6.11",
          "kind": "Method",
          "name": "Dielectric mirrors (Bragg stacks)",
          "deps": [
            "waves-6.10",
            "waves-3.10"
          ],
          "refs": [
            "Macleod, pp13–16, quarter-wave multilayer reflectors",
            "Unit-cell trace and finite-stack impedance formulas derived here"
          ],
          "pic": "Add layer pairs and change index contrast. Compare the actual finite-stack reflectance with the infinite periodic stopband and the independent design-wavelength formula."
        },
        {
          "num": "6.12",
          "kind": "Definition",
          "name": "Temporal coherence",
          "deps": [
            "waves-6.3",
            "waves-2.10"
          ],
          "refs": [
            "Fang Lecture11, pp2–4, temporal correlation and spectra",
            "Van Exter, printed 21–23, coherence time and spectral distribution"
          ],
          "pic": "Choose Gaussian or rectangular spectral shape, change bandwidth and delay, and compare signed envelope coherence with the phase-scan visibility."
        },
        {
          "num": "6.13",
          "kind": "Method",
          "name": "Fourier-transform spectroscopy",
          "deps": [
            "waves-6.12",
            "sig-13.3"
          ],
          "refs": [
            "Fang Lecture11, pp3–4, interferogram and Fourier-transform spectroscopy",
            "Finite-window cosine identity, discrete quadrature and normalization derived here",
            "Syllabus guide: Hecht ch.12 (book body not consulted)"
          ],
          "pic": "Enter one to six spectral lines, vary scan length and switch windows. Compare input weights with the finite signed reconstruction and the actual central interferogram samples."
        },
        {
          "num": "6.14",
          "kind": "Theorem",
          "name": "Spatial coherence (van Cittert–Zernike)",
          "deps": [
            "waves-6.12",
            "waves-6.2"
          ],
          "refs": [
            "Van Exter, printed 23–25, spatial coherence and van Cittert–Zernike",
            "Fang Lecture11, pp4–5, source extent and two-aperture coherence"
          ],
          "pic": "Switch between an incoherent strip and disk, then vary the baseline. See how a sign change in coherence shifts the phase scan while visibility stays nonnegative."
        },
        {
          "num": "6.15",
          "kind": "Phenomenon",
          "name": "Stellar interferometry",
          "deps": [
            "waves-6.14"
          ],
          "refs": [
            "Van Exter, printed 24–25, uniform-disk coherence and stellar diameter; angular diameter is physical diameter/distance",
            "Syllabus guide: Hecht ch.12 (book body not consulted)"
          ],
          "pic": "Change stellar angular diameter, wavelength and physical baseline. Locate the first null and follow the weaker visibility lobes beyond it."
        },
        {
          "num": "6.16",
          "kind": "Phenomenon",
          "name": "Hanbury Brown–Twiss intensity correlations",
          "deps": [
            "waves-6.14"
          ],
          "refs": [
            "Aspect, arXiv2005.08239v1, §§2.1–2.3, printed 4–7, Eqs2,6,7",
            "Van Exter, printed 25, intensity interferometry; normalized denominator corrected to product of means"
          ],
          "pic": "Change separation, coherence time, mode count, seed and record length. Compare two actual intensity histories and their sampled correlation with the ensemble prediction; contrast constant intensity."
        },
        {
          "num": "6.17",
          "kind": "Paper",
          "name": "Experiments and calculations relative to physical optics",
          "paper": {
            "authors": "Thomas Young",
            "year": 1804,
            "title": "The Bakerian Lecture: Experiments and calculations relative to physical optics",
            "venue": "Philosophical Transactions of the Royal Society of London 94: 1–16",
            "doi": "10.1098/rstl.1804.0001"
          },
          "introduces": [
            "waves-6.2"
          ],
          "deps": [
            "waves-4.4",
            "waves-6.1"
          ],
          "refs": [
            "Young 1804, printed1–8, §§I–II, actual reading before subsequent direct-source access stop",
            "Modern plane-wave strip reconstruction derived here; original table numerals not verified"
          ],
          "pic": "Change card width, propagation distance and wavelength, and remove either contributing side. Compare the coherent shadow pattern with the sum of separate edge intensities."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Diffraction',
      summary: String.raw`Waves passing an aperture spread, and the Huygens–Fresnel–Kirchhoff integral predicts how. Close up (Fresnel) the pattern is a sum over zones with surprises like the bright Arago spot; far away (Fraunhofer) it is simply the Fourier transform of the aperture. Slits, circular pupils, gratings and crystals follow, along with the Rayleigh limit on resolution, Babinet’s principle for complementary screens and the unavoidable spreading of laser beams.`,
      items: [
        { num: '7.1', kind: 'Principle', name: 'Huygens–Fresnel principle', deps: ['waves-4.4', 'waves-6.1'], refs: ['Hecht ch. 10'],
          pic: 'Fill an aperture with coherent secondary sources and sum their contributions at a movable probe: the computed pattern bends light into the geometric shadow.' },
        { num: '7.2', kind: 'Theorem', name: 'Fresnel–Kirchhoff diffraction integral', deps: ['waves-7.1', 'pma-10.51'], refs: ['Hecht ch. 10'],
          pic: 'Compute the field behind an aperture by the Kirchhoff integral with its obliquity factor and compare it with the bare Huygens sum: the backward wave disappears and forward patterns agree.' },
        { num: '7.3', kind: 'Definition', name: 'Fresnel number: near and far field', deps: ['waves-7.2'], refs: ['Hecht ch. 10'],
          pic: 'Move a screen away from a slit: the pattern morphs from a sharp shadow with ripples to a broad Fraunhofer pattern as the Fresnel number a²/λL drops below 1.' },
        { num: '7.4', kind: 'Theorem', name: 'Fraunhofer diffraction is a Fourier transform', deps: ['waves-7.2', 'waves-7.3', 'rca-9.1'], refs: ['Hecht ch. 10', 'Hecht ch. 11'],
          pic: 'Paint any aperture on a grid: the far-field intensity computed by summing wavelets matches the squared magnitude of its 2D FFT pixel for pixel.' },
        { num: '7.5', kind: 'Phenomenon', name: 'Single-slit diffraction', deps: ['waves-7.4'], refs: ['Hecht ch. 10'],
          pic: 'Narrow a slit: the sinc² pattern widens, with zeros at sin θ = mλ/a, and the readout tracks the central-peak width against the slit width.' },
        { num: '7.6', kind: 'Phenomenon', name: 'Circular aperture: the Airy pattern', deps: ['waves-7.4'], refs: ['Hecht ch. 10'],
          pic: 'A circular pupil makes a bright disk with faint rings; the first dark ring sits at 1.22λ/D, and shrinking the pupil enlarges the whole pattern.' },
        { num: '7.7', kind: 'Law', name: 'Rayleigh criterion', deps: ['waves-7.6'], refs: ['Hecht ch. 10'],
          pic: 'Two point sources with adjustable separation imaged through a circular pupil: their Airy patterns merge, and at 1.22λ/D the dip between them is just visible on an intensity profile.' },
        { num: '7.8', kind: 'Phenomenon', name: 'Double slit with finite slits', deps: ['waves-7.5', 'waves-6.2', 'fa-7.2'], refs: ['Hecht ch. 10'],
          pic: 'Real double slits give fast two-slit fringes under a single-slit envelope — the transform of a convolution is a product — with missing orders where fringe maxima hit envelope zeros.' },
        { num: '7.9', kind: 'Model', name: 'Diffraction gratings', deps: ['waves-7.4', 'waves-6.1'], refs: ['Hecht ch. 10'],
          pic: 'Increase the number of slits: principal maxima at d sin θ = mλ sharpen as 1/N, and two close wavelengths separate once N times the order exceeds λ/Δλ.' },
        { num: '7.10', kind: 'Law', name: 'Bragg’s law', deps: ['waves-7.9'], refs: ['Hecht ch. 10'],
          pic: 'X-rays scatter from rows of atoms: rotating the crystal produces strong reflections only when 2d sin θ = nλ, as the summed phases of all the planes line up.' },
        { num: '7.11', kind: 'Theorem', name: 'Babinet’s principle', deps: ['waves-7.2'], refs: ['Hecht ch. 10'],
          pic: 'Toggle between an aperture and its complementary obstacle: away from the direct beam their Fraunhofer patterns are identical, as the sum of their fields must equal the unobstructed wave.' },
        { num: '7.12', kind: 'Method', name: 'Fresnel zones and the zone plate', deps: ['waves-7.1', 'waves-7.3'], refs: ['Hecht ch. 10'],
          pic: 'Divide a circular aperture into zones whose contributions alternate in sign: open an even or odd number and the on-axis intensity flips between dark and bright; blocking alternate zones makes a lens.' },
        { num: '7.13', kind: 'Paradox', name: 'Poisson–Arago spot', deps: ['waves-7.12'], refs: ['Hecht ch. 10'],
          pic: 'Place an opaque disk in a beam: a bright spot appears at the centre of its shadow, as bright as with no disk, exactly as Poisson derided and Arago observed.' },
        { num: '7.14', kind: 'Method', name: 'Fresnel edge diffraction and the Cornu spiral', deps: ['waves-7.12'], refs: ['Hecht ch. 10'],
          pic: 'Move a probe across the shadow of a straight edge: the intensity follows the length of a chord on the Cornu spiral, oscillating outside the shadow and decaying smoothly inside.' },
        { num: '7.15', kind: 'Model', name: 'Gaussian beams', deps: ['waves-7.4', 'waves-2.10'], refs: ['Hecht ch. 13'],
          pic: 'Focus a laser beam to a waist of adjustable size: tighter waists diverge faster, the far-field angle tracks λ/πw₀, and the Rayleigh range marks where the beam area doubles.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Fourier optics and imaging',
      summary: String.raw`A lens forms the Fourier transform of a field in its focal plane, which turns imaging into filtering. Any field is a superposition of plane waves (its angular spectrum); fine detail rides on steep or evanescent components that an aperture cuts off, so the image is the object blurred by the point-spread function. Spatial filtering, phase contrast and holography manipulate the spectrum directly, and the same ideas underlie aperture synthesis in radio astronomy.`,
      items: [
        { num: '8.1', kind: 'Theorem', name: 'A lens performs a Fourier transform', deps: ['waves-7.4', 'waves-5.6'], refs: ['Hecht ch. 11'],
          pic: 'Place an object transparency before a lens: the field in the back focal plane is computed by propagation and matches the object’s FFT, with each spatial frequency landing at its own spot.' },
        { num: '8.2', kind: 'Definition', name: 'Angular spectrum of plane waves', deps: ['waves-7.4', 'rca-9.11'], refs: ['Hecht ch. 11'],
          pic: 'Decompose a field across a plane into plane waves by FFT and propagate each by its own phase: the reconstructed field at any distance matches a direct diffraction calculation.' },
        { num: '8.3', kind: 'Phenomenon', name: 'Fine detail travels on evanescent waves', deps: ['waves-8.2', 'waves-4.10'], refs: ['Hecht ch. 11'],
          pic: 'An object with detail finer than a wavelength: its high spatial frequencies decay within a wavelength of the surface, so a probe moved away sees the detail vanish.' },
        { num: '8.4', kind: 'Method', name: 'Spatial filtering in a 4f system', deps: ['waves-8.1'], refs: ['Hecht ch. 13'],
          pic: 'Block parts of the Fourier plane with a mask you draw: a low-pass pinhole smooths the image, a high-pass stop leaves edges, and a slit removes the lines of a mesh.' },
        { num: '8.5', kind: 'Model', name: 'Abbe theory of image formation', deps: ['waves-8.4', 'waves-7.9'], refs: ['Hecht ch. 13'],
          pic: 'Image a grating through an aperture of adjustable size: the grating is resolved only when at least two diffraction orders get through, giving the d ≈ λ/NA limit.' },
        { num: '8.6', kind: 'Definition', name: 'Point-spread and optical transfer functions', deps: ['waves-8.5', 'waves-7.6', 'rca-8.13'], refs: ['Hecht ch. 11'],
          pic: 'Pick a pupil shape: the image of a test chart is its convolution with the computed PSF, and the MTF curve shows how much contrast survives at each spatial frequency, coherent and incoherent compared.' },
        { num: '8.7', kind: 'Method', name: 'Phase-contrast microscopy', deps: ['waves-8.4'], refs: ['Hecht ch. 13'],
          pic: 'A transparent cell is invisible in bright field; shift the phase of the undiffracted light by a quarter wave in the Fourier plane and its phase variations appear as intensity.' },
        { num: '8.8', kind: 'Method', name: 'Holography', deps: ['waves-6.1', 'waves-8.2'], refs: ['Hecht ch. 13'],
          pic: 'Record the interference of an object wave with a reference beam, then illuminate the recording: the reconstructed field forms a 3D image, plus a twin image and a zero order.' },
        { num: '8.9', kind: 'Phenomenon', name: 'Talbot self-imaging', deps: ['waves-8.2', 'waves-7.9'], refs: ['Hecht ch. 11'],
          pic: 'Propagate the field behind a grating: an exact image of the grating reappears at the Talbot distance 2d²/λ, with fractional, shifted images in between, forming a Talbot carpet.' },
        { num: '8.10', kind: 'Method', name: 'Aperture synthesis', deps: ['waves-6.15', 'waves-8.6'], refs: ['Hecht ch. 12'],
          pic: 'Place radio dishes on a map: each pair samples one spatial frequency of the sky, Earth’s rotation fills in tracks, and the image reconstructed from the samples sharpens as dishes are added.' },
        { num: '8.11', kind: 'Phenomenon', name: 'Speckle', deps: ['waves-6.14', 'waves-8.6'], refs: ['Hecht ch. 12'],
          pic: 'Shine coherent light on a randomly rough surface: the image is a granular speckle pattern with exponential intensity statistics, and grain size grows as the viewing aperture shrinks.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Polarization',
      summary: String.raw`The transverse field of light can oscillate along a line, around a circle or an ellipse. Polarizers select a direction — Malus’s cos² law, and the paradox that a third polarizer can let light through two crossed ones — while reflection and scattering polarize light naturally. Anisotropic crystals make wave plates that convert between polarization states, tracked by Jones matrices and the Poincaré sphere; optical activity, Faraday rotation, stress birefringence and liquid-crystal displays put polarization to work.`,
      items: [
        { num: '9.1', kind: 'Definition', name: 'Polarization states and the polarization ellipse', deps: ['em-11.4'], refs: ['Hecht ch. 8', 'Crawford ch. 8'],
          pic: 'Set the amplitudes and phase of two perpendicular components: the field tip traces a line, circle or tilted ellipse, with orientation and ellipticity read out.' },
        { num: '9.2', kind: 'Phenomenon', name: 'Wire-grid and dichroic polarizers', deps: ['waves-9.1', 'em-11.10'], refs: ['Hecht ch. 8'],
          pic: 'Rotate a grid of conducting wires in a beam: the field along the wires drives currents and is absorbed or reflected, so the transmitted light is polarized across the wires.' },
        { num: '9.3', kind: 'Law', name: 'Malus’s law', deps: ['waves-9.2'], refs: ['Hecht ch. 8'],
          pic: 'Turn an analyser behind a polarizer: transmitted irradiance follows cos²θ point by point, dropping to zero at 90°.' },
        { num: '9.4', kind: 'Paradox', name: 'Three polarizers', deps: ['waves-9.3'], refs: ['Hecht ch. 8'],
          pic: 'Crossed polarizers block everything; slip a third between them at 45° and an eighth of the light gets through — and with many intermediate polarizers almost all of it does.' },
        { num: '9.5', kind: 'Method', name: 'Jones calculus', deps: ['waves-9.1', 'ladr-7.53'], refs: ['Hecht ch. 8'],
          pic: 'Chain polarizers and wave plates as 2×2 matrices: the output Jones vector is computed by matrix multiplication and drawn as an ellipse, matching a direct field simulation.' },
        { num: '9.6', kind: 'Definition', name: 'Stokes parameters and the Poincaré sphere', deps: ['waves-9.5'], refs: ['Hecht ch. 8'],
          pic: 'Each polarization state is a point on a sphere: wave plates rotate it about axes in the equator, and partially polarized light sits inside the sphere at radius equal to its degree of polarization.' },
        { num: '9.7', kind: 'Phenomenon', name: 'Polarization by reflection', deps: ['waves-4.8', 'waves-9.1'], refs: ['Hecht ch. 8'],
          pic: 'Unpolarized light reflects from glass at a sweepable angle: the degree of polarization of the reflected beam peaks at Brewster’s angle, which is why polarizing sunglasses cut glare.' },
        { num: '9.8', kind: 'Phenomenon', name: 'Polarization by scattering', deps: ['em-12.10', 'waves-9.1'], refs: ['Hecht ch. 8'],
          pic: 'Look at skylight scattered at different angles from the Sun: it is strongly polarized at 90°, as dipoles cannot radiate along their axis, and multiple scattering reduces the effect.' },
        { num: '9.9', kind: 'Phenomenon', name: 'Birefringence', deps: ['waves-9.1', 'waves-4.3'], refs: ['Hecht ch. 8'],
          pic: 'Send light into a calcite crystal: it splits into ordinary and extraordinary rays with perpendicular polarizations and different indices, producing a double image that turns with the crystal.' },
        { num: '9.10', kind: 'Method', name: 'Wave plates', deps: ['waves-9.9', 'waves-9.5'], refs: ['Hecht ch. 8'],
          pic: 'Rotate a quarter- or half-wave plate in a linearly polarized beam: the output switches between linear, elliptical and circular polarization at the predicted angles.' },
        { num: '9.11', kind: 'Phenomenon', name: 'Optical activity and Faraday rotation', deps: ['waves-9.5'], refs: ['Hecht ch. 8'],
          pic: 'Pass light through a sugar solution or a magnetized glass rod: the plane of polarization rotates in proportion to path length; reflecting back doubles the Faraday rotation but undoes the sugar’s.' },
        { num: '9.12', kind: 'Phenomenon', name: 'Photoelasticity', deps: ['waves-9.9', 'waves-9.10'], refs: ['Hecht ch. 8'],
          pic: 'Squeeze a transparent beam between crossed polarizers: stress-induced birefringence draws coloured fringes that crowd where stress concentrates around holes and corners.' },
        { num: '9.13', kind: 'Invention', name: 'Liquid-crystal display', deps: ['waves-9.3', 'waves-9.10'], refs: ['Hecht ch. 8'],
          pic: 'A twisted nematic cell between crossed polarizers guides the polarization through 90° and transmits; raise the voltage and the molecules untwist, darkening the pixel.' },
      ],
    },
  ],
};
