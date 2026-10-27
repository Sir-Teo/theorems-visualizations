// Syllabus — Medical Imaging (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   - Kak & Slaney, Principles of Computerized Tomographic Imaging — full section TOC (open access)
//     https://www.slaney.org/pct/pct-toc.html  ('Kak–Slaney §x.y' refs checked: §3.1 projections, §3.2 Fourier
//     slice theorem, §3.3 parallel-beam reconstruction, §3.4 fan beam, §3.6 3-D, §4.2 emission CT, §5.1 aliasing,
//     §5.2 noise, §6.3 Fourier diffraction theorem, §7.2 ART, §7.3 SIRT, §7.4 SART)
//   - Prince & Links, Medical Imaging Signals and Systems — chapter structure (2 signals and systems, 3 image
//     quality, 4–5 radiography, 6 CT, 7–9 nuclear medicine, 10–11 ultrasound, 12–13 MRI); chapter-level refs.
//   - MIT 22.058 Principles of Medical Imaging calendar (linear systems, PSF/MTF, sampling and counting statistics,
//     radiation interactions and dose, back projection, CT, SPECT/PET, ultrasound and Doppler, NMR, relaxation,
//     echoes and k-space, selective pulses, flow and diffusion MRI)
//     https://ocw.mit.edu/courses/22-058-principles-of-medical-imaging-fall-2002/pages/calendar/
// Gaps filled after comparison: SIRT/SART, diffraction tomography, Rose criterion, observer ROC, TOF-PET,
//   Patlak analysis, compressed-sensing and parallel MRI, diffusion MRI, pulse oximetry.
// Cross-listed rather than duplicated: Beer–Lambert law (owner `waves`), radioactive decay (owner `kin`),
//   Larmor precession (owner `em`).
// Deliberate omissions: optical coherence tomography, endoscopy and hardware engineering detail.
// Landmark papers (kind 'Paper', appended Oct 2026): every citation checked against its Crossref DOI record,
//   PubMed/PMC, the BHL OpenURL resolver or archive.org catalogue metadata (books and pre-DOI papers get a `url`).
export default {
  collection: 'imaging',
  chapters: [
    {
      n: 1,
      title: 'Imaging systems and image quality',
      summary: String.raw`Every medical image is the output of a physical system acting on the body, and most such systems are approximately linear and shift-invariant: the image is the object convolved with a point spread function. Fourier analysis turns blur into a modulation transfer function and sampling into aliasing. Counting statistics set the noise, which with contrast determines what can be detected — the reason dose and image quality trade off.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'Linear shift-invariant imaging systems', deps: ['sig-3.2'], refs: ['Prince–Links ch. 2'],
          pic: 'Image two point sources separately and together through a blurring system; the combined image equals the sum, and moving a source moves its blur unchanged.' },
        { num: '1.2', kind: 'Concept', name: 'Point spread function and convolution', deps: ['imaging-1.1', 'rca-8.14'], refs: ['Prince–Links ch. 2'],
          pic: 'Draw an object and choose a PSF; the image is computed by 2-D convolution, and widening the PSF blurs fine detail first.' },
        { num: '1.3', kind: 'Concept', name: 'Two-dimensional Fourier transform and spatial frequency', deps: ['rca-9.1', 'sig-5.6'], refs: ['Prince–Links ch. 2'],
          pic: 'An image and the magnitude of its 2-D Fourier transform are shown side by side; mask low or high frequencies and see edges or smooth regions disappear in the inverse transform.' },
        { num: '1.4', kind: 'Concept', name: 'Modulation transfer function', deps: ['imaging-1.2', 'imaging-1.3'], refs: ['Prince–Links ch. 3'],
          pic: 'Image bar patterns of increasing spatial frequency; the measured contrast of each pattern traces the MTF, which matches the Fourier transform of the PSF.' },
        { num: '1.5', kind: 'Theorem', name: 'Two-dimensional sampling and aliasing', deps: ['imaging-1.3', 'sig-7.3'], refs: ['Prince–Links ch. 2'],
          pic: 'Sample a fine stripe pattern on a pixel grid; below two samples per period the stripes reappear at a false, coarser frequency and orientation (moiré).' },
        { num: '1.6', kind: 'Concept', name: 'Contrast, noise and signal-to-noise ratio', deps: ['prob-2.2.1'], refs: ['Prince–Links ch. 3'],
          pic: 'A faint disc on a noisy background: sliders for contrast and noise level change its visibility, with contrast-to-noise ratio read out.' },
        { num: '1.7', kind: 'Concept', name: 'Poisson counting noise: SNR ∝ √N', deps: ['imaging-1.6', 'prob-1.6.13'], refs: ['Prince–Links ch. 3'],
          pic: 'Build an image photon by photon; noise falls as the square root of the counts, so quadrupling the dose only halves the noise, as the readout shows.' },
        { num: '1.8', kind: 'Concept', name: 'Rose criterion for detectability', deps: ['imaging-1.7'], refs: ['Prince–Links ch. 3'],
          pic: 'Discs of varying size and contrast appear in Poisson noise; those above an SNR of about 5 are reliably seen, and the boundary is drawn on a contrast–size chart.' },
        { num: '1.9', kind: 'Concept', name: 'Spatial resolution: FWHM and the Rayleigh criterion', deps: ['imaging-1.2', 'waves-7.7'], refs: ['Prince–Links ch. 3'],
          pic: 'Move two point sources together; their blurred profiles merge into one peak when the separation falls below about one FWHM, with the dip between them read out.' },
        { num: '1.10', kind: 'Concept', name: 'Observer performance and ROC analysis', deps: ['epi-2.5'], refs: ['Prince–Links ch. 3'],
          pic: 'Simulated readers rate images with and without a lesion at several doses; empirical ROC curves are built and their areas compared across doses.' },
      ],
    },
    {
      n: 2,
      title: 'X-ray physics and projection radiography',
      summary: String.raw`X-rays are produced by decelerating electrons and characteristic transitions, and pass through the body attenuated exponentially according to the Beer–Lambert law. Photoelectric absorption gives contrast between bone and soft tissue; Compton scatter degrades it. Projection geometry, beam hardening, contrast agents and dual-energy methods follow from the physics, and dose is the cost of every image. The same absorption law at visible wavelengths underlies pulse oximetry.`,
      items: [
        { num: '2.1', kind: 'Concept', name: 'X-ray production: bremsstrahlung and characteristic lines', deps: ['xtal-6.9'], refs: ['Prince–Links ch. 4'],
          pic: 'Change tube voltage and anode material; the spectrum’s continuous bremsstrahlung hump extends to the kVp and characteristic lines appear at fixed energies.' },
        { num: '2.2', alias: 'waves-4.15', name: 'Beer–Lambert law' },
        { num: '2.3', kind: 'Concept', name: 'Linear attenuation coefficient and half-value layer', deps: ['imaging-2.2'], refs: ['Prince–Links ch. 4'],
          pic: 'Send a monoenergetic beam through slabs of water, bone and lead; intensity falls exponentially, and the thickness halving it is read off for each.' },
        { num: '2.4', kind: 'Phenomenon', name: 'Photoelectric absorption versus Compton scattering', deps: ['imaging-2.3', 'qm-1.2'], refs: ['Prince–Links ch. 4'],
          pic: 'Plot attenuation against photon energy for soft tissue and bone; photoelectric absorption (∝ Z³/E³) dominates at low energy and Compton scatter at high energy, which is why contrast fades at high kVp.' },
        { num: '2.5', kind: 'Phenomenon', name: 'Beam hardening', deps: ['imaging-2.3', 'imaging-2.1'], refs: ['Prince–Links ch. 4'],
          pic: 'Pass a polychromatic spectrum through increasing thickness; low energies are removed first, the mean energy rises and the effective attenuation coefficient falls with depth.' },
        { num: '2.6', kind: 'Concept', name: 'Projection geometry: magnification and penumbra', deps: ['imaging-2.2'], refs: ['Prince–Links ch. 5'],
          pic: 'Move the object between a finite-size focal spot and the detector; magnification and the blurred penumbra both grow as the object approaches the source.' },
        { num: '2.7', kind: 'Concept', name: 'Scatter and anti-scatter grids', deps: ['imaging-2.4'], refs: ['Prince–Links ch. 5'],
          pic: 'Scattered photons add a diffuse fog that lowers contrast; insert a grid of lead strips and the scatter-to-primary ratio drops at the cost of higher dose.' },
        { num: '2.8', kind: 'Concept', name: 'Contrast agents and the K-edge', deps: ['imaging-2.4'], refs: ['Prince–Links ch. 5'],
          pic: 'Iodine’s attenuation jumps just above its 33 keV K-edge; tune the beam spectrum to straddle it and iodine-filled vessels stand out against tissue.' },
        { num: '2.9', kind: 'Method', name: 'Dual-energy imaging', deps: ['imaging-2.4', 'pma-9.36', 'nla-3.1'], refs: ['Prince–Links ch. 5'],
          pic: 'Acquire images at two tube voltages and solve for bone and soft-tissue thickness at each pixel; the bone-subtracted image reveals a nodule hidden behind a rib.' },
        { num: '2.10', kind: 'Concept', name: 'Radiation dose and the inverse-square law', deps: ['imaging-2.2'], refs: ['Prince–Links ch. 4'],
          pic: 'Move a detector away from the source; exposure falls as 1/r², and effective dose for common examinations is compared on a log scale with background radiation.' },
        { num: '2.11', kind: 'Method', name: 'Pulse oximetry by two-wavelength absorption', deps: ['imaging-2.2', 'physio-6.2'], refs: ['Prince–Links ch. 4'],
          pic: 'Red and infrared light pass through a fingertip; the ratio of their pulsatile absorptions maps to oxygen saturation through the different absorption spectra of oxy- and deoxyhemoglobin.' },
        { num: '2.12', kind: 'Paper', name: 'Ueber eine neue Art von Strahlen',
          paper: { authors: 'W. C. Röntgen', year: 1895, title: 'Ueber eine neue Art von Strahlen (Vorläufige Mittheilung)',
                   venue: 'Sitzungsberichte der Physikalisch-medicinischen Gesellschaft zu Würzburg (1895)', url: 'https://archive.org/details/b30475697' },
          introduces: ['imaging-2.1'], deps: [], refs: [],
          pic: 'Röntgen’s first observations: a discharge tube shrouded in black card makes a barium platinocyanide screen glow; put paper, a thick book, wood, aluminium of increasing thickness or lead in the way and the glow fades with thickness and density — stack the materials, then place a hand and see the shadow of its bones as in the radiographs that announced the discovery.' },
      ],
    },
    {
      n: 3,
      title: 'Computed tomography',
      summary: String.raw`CT measures line integrals of attenuation from many angles — the Radon transform — and reconstructs the cross-section. The Fourier slice theorem shows that each projection gives one line of the object’s 2-D Fourier transform, so the inverse exists and filtered back-projection computes it efficiently with a ramp filter. Fan and cone beams, angular sampling, noise, iterative algebraic methods and characteristic artifacts complete the practical picture; diffraction tomography extends the idea to waves.`,
      items: [
        { num: '3.1', kind: 'Concept', name: 'Line integrals and projections', deps: ['imaging-2.3'], refs: ['Kak–Slaney §3.1'],
          pic: 'Rotate a set of parallel rays around a phantom; each detector records the integral of attenuation along its ray, plotted as a projection profile for the current angle.' },
        { num: '3.2', kind: 'Definition', name: 'Radon transform', deps: ['imaging-3.1'], refs: ['Kak–Slaney §3.1', 'Prince–Links ch. 6'],
          pic: 'A point in the object traces a sine curve as the angle sweeps; the Radon transform of any drawn object is computed as the stack of all its projections.' },
        { num: '3.3', kind: 'Concept', name: 'Sinogram', deps: ['imaging-3.2'], refs: ['Kak–Slaney §3.1'],
          pic: 'Paint objects in the image and watch their sinusoidal traces appear in the sinogram; a patient moving mid-scan breaks the sinusoids.' },
        { num: '3.4', kind: 'Theorem', name: 'Fourier slice theorem', deps: ['imaging-3.2', 'rca-9.1', 'rca-8.8'], refs: ['Kak–Slaney §3.2'],
          pic: 'Take the 1-D Fourier transform of a projection and overlay it on the line through the origin of the object’s 2-D transform at the same angle; the two agree point for point.' },
        { num: '3.5', kind: 'Theorem', name: 'Uniqueness of Radon inversion', deps: ['imaging-3.4', 'rca-9.12'], refs: ['Kak–Slaney §3.2'],
          pic: 'Fill Fourier space radially with slices from more and more angles; the object reconstructed by direct inverse FFT converges, showing projections determine the object.' },
        { num: '3.6', kind: 'Algorithm', name: 'Simple back-projection and its 1/r blur', deps: ['imaging-3.3'], refs: ['Kak–Slaney §3.3'],
          pic: 'Smear each projection back across the image along its rays; the sum reproduces the object blurred by a 1/r kernel, visible as halos around a point.' },
        { num: '3.7', kind: 'Algorithm', name: 'Filtered back-projection', deps: ['imaging-3.4', 'imaging-3.6', 'pma-10.9', 'rca-9.11'], refs: ['Kak–Slaney §3.3', 'Prince–Links ch. 6'],
          pic: 'Filter each projection with the ramp |ω| before back-projecting; negative side-lobes cancel the 1/r blur and the sharp phantom emerges as views accumulate.' },
        { num: '3.8', kind: 'Concept', name: 'Ramp-filter windows and noise', deps: ['imaging-3.7', 'rca-9.13'], refs: ['Kak–Slaney §3.3', 'Kak–Slaney §5.2'],
          pic: 'Switch between ramp, Shepp–Logan and Hann windows with noisy projections; sharper filters amplify noise, and the noise–resolution trade-off is plotted.' },
        { num: '3.9', kind: 'Algorithm', name: 'Fan-beam reconstruction', deps: ['imaging-3.7'], refs: ['Kak–Slaney §3.4'],
          pic: 'Rays diverge from a point source; rebinning fan data into parallel projections or weighting them directly gives the same reconstruction, shown side by side.' },
        { num: '3.10', kind: 'Concept', name: 'Angular sampling and view-aliasing streaks', deps: ['imaging-3.7', 'imaging-1.5'], refs: ['Kak–Slaney §5.1'],
          pic: 'Reduce the number of projection angles; streak artifacts radiate from high-contrast edges once views fall below about π/2 times the number of detector samples.' },
        { num: '3.11', kind: 'Algorithm', name: 'Algebraic reconstruction technique (Kaczmarz)', deps: ['imaging-3.1', 'ladr-6.55'], refs: ['Kak–Slaney §7.2'],
          pic: 'Treat each ray as a linear equation in pixel values and project the current image onto one ray’s hyperplane at a time; the image converges, illustrated first in two unknowns.' },
        { num: '3.12', kind: 'Algorithm', name: 'SIRT and SART', deps: ['imaging-3.11', 'ladr-7.70'], refs: ['Kak–Slaney §7.3', 'Kak–Slaney §7.4'],
          pic: 'Update with all rays at once (SIRT) or one view at a time (SART); the error curves show slower but smoother convergence than ART and better behaviour with noisy data.' },
        { num: '3.13', kind: 'Concept', name: 'Hounsfield units', deps: ['imaging-2.3'], refs: ['Prince–Links ch. 6'],
          pic: 'Map attenuation to the Hounsfield scale with water at 0 and air at −1000; adjust window level and width to show lung, soft tissue or bone.' },
        { num: '3.14', kind: 'Phenomenon', name: 'CT artifacts: cupping and metal streaks', deps: ['imaging-3.7', 'imaging-2.5'], refs: ['Prince–Links ch. 6'],
          pic: 'Reconstruct a uniform water cylinder with a polychromatic beam and its centre appears too dark (cupping); add a metal implant and streaks fan out from it.' },
        { num: '3.15', kind: 'Algorithm', name: 'Cone-beam reconstruction (Feldkamp)', deps: ['imaging-3.9'], refs: ['Kak–Slaney §3.6'],
          pic: 'Extend fan-beam reconstruction to a 2-D detector with cone-angle weighting; slices near the central plane are exact and artifacts grow with cone angle.' },
        { num: '3.16', kind: 'Theorem', name: 'Fourier diffraction theorem', deps: ['imaging-3.4'], refs: ['Kak–Slaney §6.3'],
          pic: 'For weakly scattering objects illuminated by waves, each scattered field fills an arc in Fourier space rather than a line; arcs from many angles cover a disc, previewing ultrasound tomography.' },
        { num: '3.17', kind: 'Paper', name: 'Representation of a Function by Its Line Integrals',
          paper: { authors: 'A. M. Cormack', year: 1963, title: 'Representation of a Function by Its Line Integrals, with Some Radiological Applications',
                   venue: 'Journal of Applied Physics 34 (9): 2722–2727', doi: '10.1063/1.1729798' },
          introduces: ['imaging-3.1'], deps: ['imaging-2.3'], refs: [],
          pic: 'Cormack’s test: a circularly symmetric phantom of aluminium and wood is scanned with a narrow gamma-ray beam, the measured line integrals of attenuation are inverted, and the reconstructed attenuation profile recovers the materials; shift the beam, add counting noise and watch the reconstruction degrade.' },
        { num: '3.18', kind: 'Paper', name: 'Computerized Transverse Axial Scanning (Tomography): Part 1',
          paper: { authors: 'G. N. Hounsfield', year: 1973, title: 'Computerized transverse axial scanning (tomography): Part 1. Description of system',
                   venue: 'British Journal of Radiology 46 (552): 1016–1022', doi: '10.1259/0007-1285-46-552-1016' },
          introduces: ['imaging-3.13'], deps: ['imaging-3.11', 'imaging-3.1'], refs: [],
          pic: 'The EMI scanner in miniature: a pencil beam crosses the head in 160 steps at each of 180 one-degree angles, the readings are reconstructed into an 80 × 80 picture of attenuation relative to water, and adjusting the display window separates grey and white matter, blood and cerebrospinal fluid — differences of about half a per cent that plain radiographs cannot show.' },
      ],
    },
    {
      n: 4,
      title: 'Nuclear medicine and emission tomography',
      summary: String.raw`In nuclear medicine the patient is the source: a radiotracer follows a physiological process and emitted photons are counted. Gamma cameras with collimators form planar images; SPECT reconstructs them tomographically, and PET uses coincident annihilation photons for better sensitivity and exact attenuation correction. Poisson statistics make iterative maximum-likelihood reconstruction natural, and tracer-kinetic models turn images into physiology.`,
      items: [
        { num: '4.1', alias: 'kin-9.7', name: 'Radioactive decay as a stochastic first-order process' },
        { num: '4.2', kind: 'Concept', name: 'Effective half-life', deps: ['imaging-4.1', 'pharm-2.2'], refs: ['Prince–Links ch. 7'],
          pic: 'Combine physical decay with biological clearance; the effective rate constant is their sum, and the activity curve is compared for long- and short-lived isotopes.' },
        { num: '4.3', kind: 'Invention', name: 'Anger gamma camera', deps: ['imaging-4.1'], refs: ['Prince–Links ch. 8'],
          pic: 'A gamma ray flashes in a scintillation crystal and several photomultiplier tubes see the light; position is computed from the weighted signals, and positioning error grows near the edges.' },
        { num: '4.4', kind: 'Concept', name: 'Collimator resolution–sensitivity trade-off', deps: ['imaging-4.3'], refs: ['Prince–Links ch. 8'],
          pic: 'Lengthen or narrow the collimator holes; resolution improves while counts fall roughly with the square of resolution, plotted against source depth.' },
        { num: '4.5', kind: 'Concept', name: 'SPECT', deps: ['imaging-4.3', 'imaging-3.7'], refs: ['Prince–Links ch. 9', 'Kak–Slaney §4.2'],
          pic: 'Rotate a gamma camera around a phantom with tracer uptake, reconstruct by filtered back-projection, and see attenuation darken the centre until it is corrected.' },
        { num: '4.6', kind: 'Concept', name: 'PET: annihilation coincidence and lines of response', deps: ['imaging-4.1'], refs: ['Prince–Links ch. 9'],
          pic: 'A positron annihilates and two 511 keV photons fly apart; detector pairs firing within the coincidence window define a line of response, accumulating into a sinogram.' },
        { num: '4.7', kind: 'Concept', name: 'PET attenuation correction is path-independent', deps: ['imaging-4.6', 'imaging-2.2', 'imaging-3.1', 'prob-2.1.1a'], refs: ['Prince–Links ch. 9'],
          pic: 'Move the annihilation point along a line of response; the product of the two photons’ survival probabilities stays equal to the total attenuation along the line.' },
        { num: '4.8', kind: 'Algorithm', name: 'MLEM and OSEM iterative reconstruction', deps: ['imaging-1.7', 'imaging-3.11'], refs: ['Prince–Links ch. 9'],
          pic: 'Iteratively compare forward-projected estimates with measured counts and update multiplicatively; likelihood rises each step, noise grows with iterations and ordered subsets speed convergence.' },
        { num: '4.9', kind: 'Concept', name: 'Time-of-flight PET', deps: ['imaging-4.6'], refs: ['Prince–Links ch. 9'],
          pic: 'Measure the arrival-time difference of the two photons; the annihilation is localized to a segment of the line whose length shrinks with timing resolution, improving SNR.' },
        { num: '4.10', kind: 'Method', name: 'Tracer kinetics and the Patlak plot', deps: ['pharm-3.1', 'imaging-4.6'], refs: ['Prince–Links ch. 9'],
          pic: 'Fit tissue and plasma FDG curves with a two-tissue compartment model; the Patlak transformation turns late data into a straight line whose slope is the net uptake rate.' },
      ],
    },
    {
      "n": 5,
      "title": "Ultrasound",
      "summary": "Ultrasound turns travelling pressure pulses into echoes and inferred motion. These models separate amplitude from energy, true path times from assumed reconstruction, and finite interference from statistical limits. Array phases, pulse sampling and complex correlation expose ambiguities rather than turning a teaching calculation into a clinical diagnosis.",
      "items": [
        {
          "num": "5.1",
          "kind": "Concept",
          "name": "Acoustic waves and the speed of sound in tissue",
          "deps": [
            "fluid-1.5",
            "fluid-2.8",
            "waves-1.4"
          ],
          "refs": [
            "MIT6.013 official Acoustics chapter, §§13.1–13.2, printed399–406",
            "Authored finite model and explicit derivation"
          ],
          "pic": "Change the chosen fluid modulus and density. The moving pulse position is computed from the resulting speed; the readout also shows wavelength at the chosen frequency."
        },
        {
          "num": "5.2",
          "kind": "Concept",
          "name": "Acoustic impedance and reflection at interfaces",
          "deps": [
            "imaging-5.1",
            "waves-1.8"
          ],
          "refs": [
            "MIT6.013 official Acoustics chapter, §§13.1–13.2, printed399–406",
            "Authored finite model and explicit derivation"
          ],
          "see": [
            "music-11.3"
          ],
          "pic": "Change the two chosen impedances. Compare signed pressure traces with reflected/transmitted intensity fractions: a large pressure coefficient is different from a large energy fraction."
        },
        {
          "num": "5.3",
          "kind": "Concept",
          "name": "Attenuation and the depth–frequency trade-off",
          "deps": [
            "imaging-5.1"
          ],
          "refs": [
            "Authored finite model and explicit derivation"
          ],
          "pic": "Raise frequency, depth or the chosen attenuation coefficient. Compare amplitude with intensity and the two-way decibel loss; the depth curve uses the actual selected frequency."
        },
        {
          "num": "5.4",
          "kind": "Concept",
          "name": "Pulse-echo ranging",
          "deps": [
            "imaging-5.1",
            "imaging-5.2",
            "waves-1.6"
          ],
          "refs": [
            "Authored finite model and explicit derivation"
          ],
          "pic": "Change the two speeds and target depth. Two actual computed pulse echoes show the layer interface and the deeper reflector; compare true depth with reconstruction using 1540 m/s."
        },
        {
          "num": "5.5",
          "kind": "Concept",
          "name": "Axial and lateral resolution",
          "deps": [
            "imaging-5.4",
            "waves-1.6"
          ],
          "refs": [
            "Authored finite model and explicit derivation"
          ],
          "pic": "Move two reflectors together and switch axial/lateral response. Pulse-cycle count changes axial support; Gaussian width changes the separate lateral model. The component curves and their sum are computed."
        },
        {
          "num": "5.6",
          "kind": "Method",
          "name": "Beamforming with phased arrays",
          "deps": [
            "imaging-5.5",
            "waves-1.6"
          ],
          "refs": [
            "Podkowa, Oelze & Ketterling (2018), actual pp1–6, DOI10.3390/app8020227",
            "Authored finite model and explicit derivation"
          ],
          "pic": "Choose focus or far-field steering. Element delays and the actual summed intensity change with pitch and angle; larger pitch can produce additional lobes rather than a unique beam."
        },
        {
          "num": "5.7",
          "kind": "Method",
          "name": "Time-gain compensation",
          "deps": [
            "imaging-5.3"
          ],
          "refs": [
            "Authored finite model and explicit derivation"
          ],
          "pic": "Change the gain slope and pre-gain noise amplitude. Compare equal-reflector raw pressure, amplified output and clipped display values across depth."
        },
        {
          "num": "5.8",
          "kind": "Phenomenon",
          "name": "Ultrasound speckle",
          "deps": [
            "imaging-5.5",
            "waves-1.6",
            "prob-3.10.7",
            "prob-2.2.1"
          ],
          "refs": [
            "Wagner, Insana & Brown (1986), earlier-read introduction only; Gaussian-limit proof supplied here",
            "Authored finite model and explicit derivation"
          ],
          "pic": "Change scatterer count, pseudorandom seed and number of intensity looks. Compare angle-like phase changes on one fixed scatterer set with resampled-look illustrations, keeping coherent fields separate from incoherent intensity averaging."
        },
        {
          "num": "5.9",
          "kind": "Law",
          "name": "Doppler equation for ultrasound",
          "deps": [
            "imaging-5.1",
            "waves-1.14"
          ],
          "refs": [
            "Podkowa, Oelze & Ketterling (2018), actual pp1–6, DOI10.3390/app8020227",
            "Authored finite model and explicit derivation"
          ],
          "pic": "Change signed speed, frequency and local angle. Compare the low-speed shift with the exact collinear reference evaluated at the radial component; at 90° the model reports the missing total-speed information."
        },
        {
          "num": "5.10",
          "kind": "Method",
          "name": "Pulsed-wave Doppler and the Nyquist velocity limit",
          "deps": [
            "imaging-5.9",
            "imaging-1.5"
          ],
          "refs": [
            "Podkowa, Oelze & Ketterling (2018), actual pp1–6, DOI10.3390/app8020227",
            "Authored finite model and explicit derivation"
          ],
          "pic": "Vary maximum depth, speed and the fraction of the ideal range-compatiblePRF. The phasor samples, wrapped frequency and apparent axial velocity are computed, including sign reversal after aliasing."
        },
        {
          "num": "5.11",
          "kind": "Method",
          "name": "Pressure gradients from Doppler velocities",
          "deps": [
            "imaging-5.9",
            "physio-4.18"
          ],
          "refs": [
            "Authored finite model and explicit derivation"
          ],
          "pic": "Change proximal and throat velocities, then a separately chosen recovery fraction. Pressure bars distinguish the local throat drop, recovered amount and residual modeled loss; compare the simplified 4 v² number."
        },
        {
          "num": "5.12",
          "kind": "Method",
          "name": "Colour flow imaging by autocorrelation",
          "deps": [
            "imaging-5.10",
            "ladr-6.14"
          ],
          "refs": [
            "Podkowa, Oelze & Ketterling (2018), actual pp1–6, DOI10.3390/app8020227",
            "Authored finite model and explicit derivation"
          ],
          "pic": "Change the tone shift, stationary clutter and pseudorandom noise. Inspect the complex samples, lag-one vector, principal frequency, coherence and computed finite frequency map; a near-cancelled vector is reported unresolved rather than silently set to zero flow."
        }
      ]
    },
    {
      "n": 6,
      "title": "Magnetic resonance imaging",
      "summary": "From a small thermal spin imbalance to controlled rotation, relaxation, encoding and reconstruction. Explicit finite models connect each picture to its equations; declared counterexamples expose the assumptions behind shortcuts. The final historical items retain source verification flags and use own synthetic illustrations.",
      "items": [
        {
          "num": "6.1",
          "alias": "em-7.20",
          "name": "Larmor precession of a magnetic moment"
        },
        {
          "num": "6.2",
          "kind": "Concept",
          "name": "Net magnetization and Boltzmann polarization",
          "deps": [
            "em-7.20",
            "thermo-6.1"
          ],
          "refs": [
            "Authored finite model and explicit derivation; see chapter verification receipt",
            "Stanford RAD229 2020 Lecture01A selected nuclei/gyromagnetic-unit text"
          ],
          "pic": "Change field and temperature. Compare the true population fractions with their net difference on the separate ppm scale."
        },
        {
          "num": "6.3",
          "kind": "Model",
          "name": "Bloch equations",
          "deps": [
            "em-7.20",
            "qm-13.2"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture01C, actual hard-RF text and selected rendered slides4/10/11",
            "Stanford RAD229 2020 Lecture01D, actual relaxation text",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Change RF area, phase, detuning and relaxation. Inspect the rotating-frame vector, resolved pulse components and free-evolution envelopes; drag the 3D view."
        },
        {
          "num": "6.4",
          "kind": "Concept",
          "name": "T1 and T2 relaxation",
          "deps": [
            "imaging-6.3"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture01D, actual relaxation text",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Move the observation time and compare three explicitly illustrative classes. Increase the extra transverse rate to shorten T2 while leaving longitudinal recovery fixed."
        },
        {
          "num": "6.5",
          "kind": "Phenomenon",
          "name": "Free induction decay and T2*",
          "deps": [
            "imaging-6.4"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture01D, actual relaxation text",
            "Stanford RAD229 2020 Lecture08A, selected text through slide15",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Spread the spinning arrows with static offsets and compare their finite mean with the continuous envelope. Switch Lorentzian/Gaussian to break the exponential T2* assumption."
        },
        {
          "num": "6.6",
          "kind": "Phenomenon",
          "name": "Spin echo",
          "deps": [
            "imaging-6.5"
          ],
          "see": [
            "qinfo-7.7"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture08A, selected text through slide15",
            "Stanford RAD229 2020 Lecture01C, actual hard-RF text and selected rendered slides4/10/11",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Set TE and the pulse axis. Watch the arrows dephase and rephase, and compare the echo with the remaining T2 envelope."
        },
        {
          "num": "6.7",
          "kind": "Concept",
          "name": "Image contrast from TR and TE",
          "deps": [
            "imaging-6.4"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture08A, selected text through slide15",
            "Stanford RAD229 2020 Lecture01D, actual relaxation text",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Change TR and TE. Compare exact and approximate phantom brightness on the same fixed scale, plus the actual class signal curves."
        },
        {
          "num": "6.8",
          "kind": "Concept",
          "name": "Slice selection with gradients and shaped RF pulses",
          "deps": [
            "em-7.20",
            "imaging-1.3"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture02B, selected spatial encoding/small-tip/rephasing text",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Shape the RF pulse and reverse or weaken the gradient. Toggle the rephasing lobe to isolate phase changes from the slice magnitude."
        },
        {
          "num": "6.9",
          "kind": "Concept",
          "name": "k-space: frequency and phase encoding",
          "deps": [
            "imaging-6.8",
            "rca-9.11"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture02C, selected signal-equation/k-space text",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Acquire rows in two orders. Compare the own object, actual acquired k-space and inverse reconstruction; change pixel spacing to see its physical FOV."
        },
        {
          "num": "6.10",
          "kind": "Concept",
          "name": "Field of view and wrap-around aliasing",
          "deps": [
            "imaging-6.9",
            "imaging-1.5"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture02C, selected signal-equation/k-space text",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Increase the undersampling factor. Compare the true object with the actual folded sum and one column’s contributing bands."
        },
        {
          "num": "6.11",
          "kind": "Method",
          "name": "Partial Fourier from Hermitian symmetry",
          "deps": [
            "imaging-6.9",
            "rca-9.2"
          ],
          "refs": [
            "Authored finite model and explicit derivation; see chapter verification receipt",
            "Stanford RAD229 2020 Lecture02C, selected signal-equation/k-space text"
          ],
          "pic": "Add spatial phase or acquire more negative rows. Compare zero-fill with conjugate completion on the same brightness scale."
        },
        {
          "num": "6.12",
          "kind": "Method",
          "name": "Parallel imaging (SENSE)",
          "deps": [
            "imaging-6.10"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture07C, selected coil/noise text and rendered slide16",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Change coil separation and noise. Inspect signed maps and the actual reconstructed object; approach the rank-loss boundary."
        },
        {
          "num": "6.13",
          "kind": "Method",
          "name": "Compressed-sensing MRI",
          "deps": [
            "imaging-6.10",
            "sig-7.16"
          ],
          "refs": [
            "Lustig et al.2007 Sparse MRI, selected prerequisites/objective/AppendixA text; own distinct ISTA exercise",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Compare equal-count masks, the sparse and textured objects, noise and iteration count. Watch the actual objective and compare complex error, not just a plausible image."
        },
        {
          "num": "6.14",
          "kind": "Phenomenon",
          "name": "BOLD contrast in functional MRI",
          "deps": [
            "imaging-6.5",
            "physio-6.2"
          ],
          "refs": [
            "DartBrains MR Physics selected oxygenation text; Andy’s BrainBook selected HRF overview",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Vary flow, oxygen use and TE. Compare their timing with the blood-budget signal and select a time for the own activation-mixture map."
        },
        {
          "num": "6.15",
          "kind": "Method",
          "name": "Diffusion MRI (Stejskal–Tanner)",
          "deps": [
            "imaging-6.6",
            "mathbio-8.3"
          ],
          "refs": [
            "Stanford RAD229 2020 Lecture15B, selected opening diffusion text and rendered slide7",
            "Authored finite model and explicit derivation; see chapter verification receipt"
          ],
          "pic": "Change lobe strength, timing and direction. Compare the analytic tensor attenuation with the actual finite complex phase ensemble."
        },
        {
          "num": "6.16",
          "kind": "Paper",
          "name": "Image Formation by Induced Local Interactions",
          "deps": [
            "em-7.20",
            "imaging-3.6"
          ],
          "refs": [
            "Authored finite model and explicit derivation; see chapter verification receipt",
            "Frozen syllabus bibliography; original body unavailable at source stop"
          ],
          "paper": {
            "authors": "P. C. Lauterbur",
            "year": 1973,
            "title": "Image Formation by Induced Local Interactions: Examples Employing Nuclear Magnetic Resonance",
            "venue": "Nature 242 (5394): 190–191",
            "doi": "10.1038/242190a0"
          },
          "introduces": [
            "imaging-6.9"
          ],
          "verify": true,
          "pic": "Rotate the chosen gradient and add projections. Compare the own object, actual detector profile and fixed-scale unfiltered adjoint."
        },
        {
          "num": "6.17",
          "kind": "Paper",
          "name": "Brain MRI with Contrast Dependent on Blood Oxygenation",
          "deps": [
            "imaging-6.5",
            "physio-6.2"
          ],
          "refs": [
            "DartBrains MR Physics selected oxygenation text; Andy’s BrainBook selected HRF overview",
            "Authored finite model and explicit derivation; see chapter verification receipt",
            "Frozen syllabus bibliography; original body unavailable at source stop"
          ],
          "paper": {
            "authors": "S. Ogawa, T. M. Lee, A. R. Kay and D. W. Tank",
            "year": 1990,
            "title": "Brain magnetic resonance imaging with contrast dependent on blood oxygenation",
            "venue": "Proceedings of the National Academy of Sciences 87 (24): 9868–9872",
            "doi": "10.1073/pnas.87.24.9868"
          },
          "introduces": [
            "imaging-6.14"
          ],
          "verify": true,
          "pic": "Change oxygenation and TE. Compare the fixed-scale own vessel image with its computed signal curve, then remove only static dephasing using ideal refocusing."
        }
      ]
    },
  ],
};
