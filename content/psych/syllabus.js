// Syllabus — Psychology & Perception (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   Reference TOCs
//   - Gescheider, Psychophysics: The Fundamentals, 3e (1997) — chapter order from the Routledge listing:
//     https://www.routledge.com/Psychophysics-The-Fundamentals/Gescheider/p/book/9780805822816
//     (differential & absolute sensitivity, classical methods, classical theory, SDT ×4, discrimination /
//     partition / ratio scaling, the psychophysical law, fundamental issues). Chapter numbers in refs follow
//     that order and are chapter-level only.
//   - Macmillan & Creelman, Detection Theory: A User’s Guide, 2e — chapter-level refs (ch. 1 sensitivity,
//     ch. 2 bias, ch. 3 rating/ROC, ch. 4 threshold models, ch. 7 2AFC, ch. 11 adaptive methods); TOC not
//     fetched in full, so numbers beyond these are avoided.
//   - Goldstein & Brockmole, Sensation and Perception, 10e — 15 chapters (bookseller listing):
//     https://www.cengage.com/c/sensation-and-perception-10e-goldstein/9781305580299
//   Courses
//   - MIT 9.35 Perception (Spring 2024 calendar): https://live.ocw.mit.edu/courses/9-35-perception-spring-2024/pages/calendar
//   - MIT 9.35 Sensation and Perception (2009 lecture list): https://ocw.mit.edu/courses/9-35-sensation-and-perception-spring-2009/pages/lecture-notes
//   - CBMM / MIT Perception topic list: https://cbmm.mit.edu/education/courses/perception
//   Lists
//   - https://en.wikipedia.org/wiki/List_of_psychological_effects
//   - https://en.wikipedia.org/wiki/List_of_cognitive_biases (judgment biases go to `behav`)
//
// Gaps filled after the comparison: adaptive staircases and 2AFC, Thurstone and Luce scaling, Troxler
// fading, the wavy Hermann grid, aperture problem, auditory streaming, the testing effect, Sternberg
// scanning, latent inhibition, the matching law, TD learning, the replication-crisis chapter.
// Deliberate omissions / hand-offs: colour science already in `art` (cones, trichromacy, metamers, Grassmann,
// CIE, opponent colours, afterimages, Mach bands, simultaneous contrast, checker-shadow, CSF) and hearing in
// `music` (loudness contours, critical bands, masking, missing fundamental, localization) — cited, not
// duplicated. Social psychology is limited to classic effects with honest replication notes.
// NOTE: the collection.js references do not cover learning, memory, reaction time or social psychology;
// items in those chapters have refs: [] until references (e.g. a learning & memory text) are added.
export default {
  collection: 'psych',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Thresholds and the psychophysical methods',
      summary: String.raw`Psychophysics starts by asking how much stimulus is needed to be noticed, and how much must be added to be noticed as different. Because responses are noisy, thresholds are statistical: the psychometric function rises smoothly, and the classical methods (limits, adjustment, constant stimuli) and modern adaptive staircases are ways of sampling it efficiently. Weber noticed that the just-noticeable difference grows in proportion to intensity, and Fechner turned that into a logarithmic scale of sensation.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Absolute threshold', deps: [], refs: ['Gescheider ch. 2'],
          pic: 'Faint dots flash on a grey field at intensities you cannot predict; your yes/no answers build a detection curve live, and the 50% point is marked as your threshold.' },
        { num: '1.2', kind: 'Definition', name: 'Difference threshold and the just-noticeable difference', deps: ['psych-1.1'], refs: ['Gescheider ch. 1'],
          pic: 'Two grey patches side by side: you nudge the comparison until it just looks different, repeated at several standards, and the JND for each standard is plotted with its spread.' },
        { num: '1.3', kind: 'Concept', name: 'The psychometric function', deps: ['psych-1.1'], refs: ['Gescheider ch. 3'],
          pic: 'Simulated observers with adjustable internal noise: proportion “yes” versus intensity is a sigmoid whose slope steepens as the noise slider drops, and a fitted cumulative-normal curve reads off threshold and slope.' },
        { num: '1.4', kind: 'Method', name: 'Method of constant stimuli', deps: ['psych-1.3'], refs: ['Gescheider ch. 3'],
          pic: 'Pick seven stimulus levels and a trial count; randomised trials fill a bar per level and the error bars on the fitted threshold shrink as you add trials.' },
        { num: '1.5', kind: 'Method', name: 'Method of limits and its hysteresis', deps: ['psych-1.1'], refs: ['Gescheider ch. 3'],
          pic: 'Ascending and descending staircases of a tone’s loudness stop at different points — errors of habituation and anticipation — and averaging the two series cancels the bias.' },
        { num: '1.6', kind: 'Method', name: 'Method of adjustment', deps: ['psych-1.2'], refs: ['Gescheider ch. 3'],
          pic: 'Drag a line until it matches a reference length; ten of your settings form a histogram whose mean is the point of subjective equality and whose spread estimates the JND.' },
        { num: '1.7', kind: 'Method', name: 'Adaptive staircases (up–down methods)', deps: ['psych-1.3'], refs: ['Gescheider ch. 3', 'M&C ch. 11'],
          pic: 'A 2-down–1-up staircase hunts around a simulated observer’s curve; the reversals are marked, and over many runs their mean settles at the 70.7% point the rule predicts.' },
        { num: '1.8', kind: 'Method', name: 'Two-alternative forced choice (2AFC)', deps: ['psych-1.3'], refs: ['M&C ch. 7'],
          pic: 'Which of two intervals held the faint grating? Your accuracy climbs from the 50% guessing floor to 100% across contrasts, and you cannot bias it by being cautious.' },
        { num: '1.9', kind: 'Law', name: 'Weber’s law', deps: ['psych-1.2'], refs: ['Gescheider ch. 1'],
          pic: 'Lift virtual weights or compare dot clouds: your measured JNDs plotted against the standard fall on a straight line through the origin, and its slope is your Weber fraction.' },
        { num: '1.10', kind: 'Phenomenon', name: 'Where Weber’s law fails: low intensities and the near miss', deps: ['psych-1.9'], refs: ['Gescheider ch. 1'],
          pic: 'Extend the intensity range down toward threshold: the Weber fraction ΔI/I curls upward, and adding a constant (I + I₀) to the model straightens it again.' },
        { num: '1.11', kind: 'Law', name: 'Fechner’s law: sensation grows as a logarithm', deps: ['psych-1.9', 'pma-8.6'], refs: ['Gescheider ch. 9'],
          pic: 'Stack JNDs one on top of another from threshold upward; the staircase of equal sensation steps traces k·log(I/I₀), and changing the Weber fraction rescales the curve.' },
        { num: '1.12', kind: 'Model', name: 'High-threshold theory and the correction for guessing', deps: ['psych-1.3'], refs: ['Gescheider ch. 4'],
          pic: 'A detector that either crosses a fixed threshold or guesses: raise the guessing rate and the hit rate inflates, and the classical correction recovers the true detection probability.' },
        { num: '1.13', kind: 'Phenomenon', name: 'Number sense obeys Weber’s law', deps: ['psych-1.9'], refs: ['Gescheider ch. 1'],
          pic: 'Two flashing dot arrays too brief to count: your accuracy depends on their ratio, not their difference, so 10 vs 12 is as hard as 50 vs 60.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Signal detection theory',
      summary: String.raw`Signal detection theory separates two things a threshold experiment mixes up: how well an observer can tell signal from noise (sensitivity, d′) and how willing they are to say “yes” (the criterion). Both noise and signal produce a distribution of internal evidence; the observer cuts it at a criterion set by payoffs and base rates. Sweeping the criterion traces the ROC curve, whose shape tests the model and whose area equals forced-choice accuracy.`,
      items: [
        { num: '2.1', kind: 'Model', name: 'Equal-variance Gaussian detection model', deps: ['psych-1.3', 'stat-6.2'], refs: ['M&C ch. 1', 'Gescheider ch. 5'],
          pic: 'Two overlapping bell curves for noise and signal-plus-noise with a draggable criterion line; the four shaded regions are labelled hit, miss, false alarm and correct rejection.' },
        { num: '2.2', kind: 'Definition', name: 'Hits, misses, false alarms and correct rejections', deps: ['psych-2.1'], refs: ['M&C ch. 1'],
          pic: 'Play a short detection game (is there a faint tone in the hiss?); your responses fill a 2×2 table and the hit and false-alarm rates update after every trial.' },
        { num: '2.3', kind: 'Definition', name: 'Sensitivity d′', deps: ['psych-2.1'], refs: ['M&C ch. 1'],
          pic: 'Drag the signal distribution away from the noise distribution; d′ = z(H) − z(F) is read off from the simulated responses and matches the separation in standard-deviation units.' },
        { num: '2.4', kind: 'Definition', name: 'Response criterion c and likelihood-ratio bias β', deps: ['psych-2.1'], refs: ['M&C ch. 2'],
          pic: 'Slide the criterion from liberal to conservative; c and β change sign and size while the hit and false-alarm rates move together along one curve.' },
        { num: '2.5', kind: 'Theorem', name: 'Sensitivity and bias are separable', deps: ['psych-2.3', 'psych-2.4'], refs: ['M&C ch. 2'],
          pic: 'Two simulated observers with the same d′ but different criteria give very different percent-correct scores, yet their computed d′ values agree; percent correct alone would rank them wrongly.' },
        { num: '2.6', kind: 'Concept', name: 'The ROC curve', deps: ['psych-2.3', 'stat-6.5'], refs: ['M&C ch. 3'],
          pic: 'Sweep the criterion and watch the (false-alarm, hit) point trace a bowed curve; a d′ slider fattens or flattens the bow, and d′ = 0 collapses it onto the chance diagonal.' },
        { num: '2.7', kind: 'Method', name: 'Rating experiments and the empirical ROC', deps: ['psych-2.6'], refs: ['M&C ch. 3'],
          pic: 'Answer with confidence ratings instead of yes/no; the cumulative rating counts give several ROC points from one session, plotted against the model curve.' },
        { num: '2.8', kind: 'Model', name: 'Unequal-variance model and the z-ROC slope', deps: ['psych-2.7'], refs: ['M&C ch. 3'],
          pic: 'Widen the signal distribution: the ROC becomes asymmetric and on z-coordinates turns into a straight line with slope σ_noise/σ_signal, as recognition-memory data typically show.' },
        { num: '2.9', kind: 'Theorem', name: 'Threshold and Gaussian models predict different ROCs', deps: ['psych-1.12', 'psych-2.6'], refs: ['M&C ch. 4'],
          pic: 'Overlay the straight-line ROC of a high-threshold observer on the curved Gaussian ROC; feed in rating data and see which shape fits.' },
        { num: '2.10', kind: 'Theorem', name: 'Area under the ROC equals 2AFC accuracy', deps: ['psych-2.6', 'psych-1.8'], refs: ['M&C ch. 7'],
          pic: 'Shade the area under a simulated ROC and run the same observer through 2AFC trials; the proportion correct converges to the shaded area.' },
        { num: '2.11', kind: 'Theorem', name: 'd′ in 2AFC is √2 times the yes–no d′', deps: ['psych-2.3', 'psych-1.8'], refs: ['M&C ch. 7'],
          pic: 'The 2AFC decision variable is a difference of two noisy samples; its distributions are drawn and their separation is √2 larger in standard units, confirmed by simulated trials.' },
        { num: '2.12', kind: 'Theorem', name: 'Optimal criterion from payoffs and base rates', deps: ['psych-2.4', 'stat-6.4', 'stat-10.1'], refs: ['M&C ch. 2'],
          pic: 'Set the prior probability of a signal and the payoff matrix; the expected-value-maximising criterion moves to where the likelihood ratio equals the computed β, and you can try to beat it by hand.' },
        { num: '2.13', kind: 'Concept', name: 'The ideal observer', deps: ['psych-2.12'], refs: ['Gescheider ch. 6'],
          pic: 'Detect a known pattern in pixel noise yourself, then compare your d′ with that of a template-matching ideal observer; the ratio squared is your efficiency.' },
        { num: '2.14', kind: 'Phenomenon', name: 'Detection in the wild: screening and rare targets', deps: ['psych-2.12'], refs: ['Gescheider ch. 8'],
          pic: 'A baggage-screening task where weapons appear in 50% or 2% of bags: with rare targets your criterion drifts conservative and misses climb, even though d′ barely changes.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Scaling sensation',
      summary: String.raw`If we ask people directly how strong a sensation is, the answers follow a power law rather than Fechner’s logarithm, with exponents that differ widely between senses. Cross-modality matching checks the power law’s internal consistency, while category and comparative-judgment methods build scales from discriminations. The chapter ends with Luce’s choice axiom and multidimensional scaling, which carry these ideas from sensation into preference and similarity.`,
      items: [
        { num: '3.1', kind: 'Method', name: 'Magnitude estimation', deps: ['psych-1.2'], refs: ['Gescheider ch. 11'],
          pic: 'Assign numbers to the brightness of patches relative to a standard of 10; your estimates on log–log axes fall near a straight line whose slope is your personal exponent.' },
        { num: '3.2', kind: 'Law', name: 'Stevens’ power law', deps: ['psych-3.1', 'psych-1.11'], refs: ['Gescheider ch. 13'],
          pic: 'Drag the exponent between 0.3 and 3.5: sensation-versus-intensity curves bend from compressive (brightness) through linear (length) to expansive (electric shock).' },
        { num: '3.3', kind: 'Concept', name: 'Exponents across sensory continua', deps: ['psych-3.2'], refs: ['Gescheider ch. 13'],
          pic: 'A gallery of classic exponents (loudness, brightness, length, heaviness, shock) as lines on one log–log plot, with a doubling of stimulus shown as the sensation ratio each implies.' },
        { num: '3.4', kind: 'Method', name: 'Cross-modality matching', deps: ['psych-3.2'], refs: ['Gescheider ch. 12'],
          pic: 'Match line lengths to tone loudness; the slope of your matching function is compared with the ratio of the two exponents the power law predicts.' },
        { num: '3.5', kind: 'Paradox', name: 'Fechner versus Stevens: which psychophysical law?', deps: ['psych-1.11', 'psych-3.2'], refs: ['Gescheider ch. 13', 'Gescheider ch. 14'],
          pic: 'Generate JND-based and magnitude-estimation scales from the same simulated observer; the two curves disagree, and a toggle shows how a power law with a Weber-type JND produces both.' },
        { num: '3.6', kind: 'Method', name: 'Category scaling and range–frequency effects', deps: ['psych-3.1'], refs: ['Gescheider ch. 10'],
          pic: 'Rate the size of squares on a 1–7 scale; skewing the set toward small squares shifts your ratings of the same middle square, exactly as Parducci’s range–frequency model predicts.' },
        { num: '3.7', kind: 'Law', name: 'Thurstone’s law of comparative judgment', deps: ['psych-2.1'], refs: ['Gescheider ch. 9'],
          pic: 'Pairwise “which is heavier?” choices among five weights are converted through z-scores into scale values on a line; a noise slider shows how discriminal dispersion spaces them.' },
        { num: '3.8', kind: 'Principle', name: 'Luce’s choice axiom (Bradley–Terry–Luce)', deps: ['psych-3.7'], refs: ['Gescheider ch. 9'],
          pic: 'Assign strengths to options; choice probabilities from any subset are ratios of strengths, and adding a third option scales the first two proportionally — the property real choosers break.' },
        { num: '3.9', kind: 'Law', name: 'Loudness in sones: doubling per 10 dB', deps: ['psych-3.2', 'music-1.9'], refs: ['Goldstein ch. 11'],
          pic: 'Raise a tone in 10 dB steps and judge whether it sounds twice as loud; the sone scale drawn beside the decibel slider shows the 0.3 power of intensity behind the rule.' },
        { num: '3.10', kind: 'Method', name: 'Multidimensional scaling of similarity', deps: ['psych-3.7'], refs: ['Gescheider ch. 10'],
          pic: 'Rate the dissimilarity of pairs of colours; classical MDS lays them out in a plane and recovers a colour circle from your judgments, with stress reported.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Early vision: receptors, contrast and lightness',
      summary: String.raw`The retina already processes the image: two receptor systems trade sensitivity for acuity, and lateral inhibition between neighbouring cells makes the visual system respond to edges rather than absolute light levels. That explains Mach bands and some contrast illusions, but not all of them — the Hermann grid and the lightness illusions show that higher-level interpretation of surfaces and illumination matters too. Fixed images even fade away, a reminder that vision is built for change.`,
      items: [
        { num: '4.1', kind: 'Concept', name: 'Duplex retina: rods and cones', deps: [], refs: ['Goldstein ch. 2'],
          pic: 'A slice of retina with rods and cones mapped by eccentricity; drag a light spot across the visual field and see which system is engaged and how densely it is sampled.' },
        { num: '4.2', kind: 'Phenomenon', name: 'Dark adaptation and the rod–cone break', deps: ['psych-4.1'], refs: ['Goldstein ch. 2'],
          pic: 'Threshold versus time in the dark is the lower envelope of a fast cone curve and a slow rod curve; toggle “rod monochromat” or “fovea only” and the kink disappears.' },
        { num: '4.3', kind: 'Phenomenon', name: 'The Purkinje shift', deps: ['psych-4.1'], refs: ['Goldstein ch. 2'],
          pic: 'Dim a red and a blue flower that look equally bright in daylight: as the scene moves into rod vision the red one goes dark first, tracked by the shifting spectral-sensitivity peak.' },
        { num: '4.4', kind: 'Concept', name: 'Convergence trades acuity for sensitivity', deps: ['psych-4.1'], refs: ['Goldstein ch. 3'],
          pic: 'Many rods pool into one ganglion cell while foveal cones have private lines; a grating and a dim spot are passed through both wiring diagrams to show which one resolves and which one detects.' },
        { num: '4.5', kind: 'Law', name: 'Ricco’s and Bloch’s laws of summation', deps: ['psych-4.4'], refs: ['Goldstein ch. 3'],
          pic: 'Vary the area or duration of a flash: below a critical size or time, threshold intensity × area (or × duration) is constant, and the log–log plot shows the slope −1 segment ending at the critical value.' },
        { num: '4.6', kind: 'Concept', name: 'Centre–surround receptive fields', deps: ['psych-4.4'], refs: ['Goldstein ch. 3'],
          pic: 'Move a spot and an annulus over a model ganglion cell; its firing rate rises for light on the centre and falls for light on the surround, and a uniform field barely moves it.' },
        { num: '4.7', kind: 'Principle', name: 'Lateral inhibition (Hartline–Ratliff)', deps: ['psych-4.6'], refs: ['Goldstein ch. 3'],
          pic: 'A row of Limulus receptors each inhibiting its neighbours: light one and its neighbours’ output drops; the strength slider shows the network solving its linear equations.' },
        { num: '4.8', kind: 'Theorem', name: 'Lateral inhibition predicts Mach bands', deps: ['psych-4.7', 'art-6.2', 'rca-8.13'], refs: ['Goldstein ch. 3'],
          pic: 'Convolve a luminance ramp with a difference-of-Gaussians kernel: the computed response overshoots at the knees exactly where you see the bright and dark bands.' },
        { num: '4.9', kind: 'Phenomenon', name: 'The Hermann grid and its wavy-line refutation', deps: ['psych-4.7'], refs: ['Goldstein ch. 3'],
          pic: 'Grey smudges appear at grid intersections; bend the streets into wavy lines and the smudges vanish even though the centre–surround account predicts they should stay.' },
        { num: '4.10', kind: 'Phenomenon', name: 'White’s illusion: contrast that lateral inhibition gets backwards', deps: ['psych-4.7', 'art-6.3'], refs: ['Goldstein ch. 9'],
          pic: 'Identical grey bars embedded in black and white stripes look different in the opposite direction from what local inhibition predicts; a probe lets you null the effect and record its size.' },
        { num: '4.11', kind: 'Phenomenon', name: 'Craik–O’Brien–Cornsweet illusion', deps: ['psych-4.7'], refs: ['Goldstein ch. 3'],
          pic: 'Two equal grey regions separated by a sharp-shouldered edge look different; cover the edge with your finger (a draggable bar) and the regions match.' },
        { num: '4.12', kind: 'Phenomenon', name: 'Lightness constancy and the anchoring problem', deps: ['art-6.12', 'psych-4.10'], refs: ['Goldstein ch. 9'],
          pic: 'Move a spotlight across a scene of grey papers: the luminances change by a factor of ten while perceived lightness stays put; a readout compares luminance ratios with your matches.' },
        { num: '4.13', kind: 'Phenomenon', name: 'The blind spot and perceptual filling-in', deps: ['psych-4.1'], refs: ['Goldstein ch. 2'],
          pic: 'Close one eye and move a dot toward the optic disc; it disappears and the surrounding pattern (lines, texture, colour) is filled in across the gap.' },
        { num: '4.14', kind: 'Phenomenon', name: 'Troxler fading', deps: ['psych-4.6'], refs: ['Goldstein ch. 3'],
          pic: 'Fix your gaze on a central cross; blurry peripheral blobs fade within seconds, and a toggle that jiggles them shows that tiny image motion keeps them visible.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Colour vision',
      summary: String.raw`A single cone class cannot tell wavelength from intensity, so colour needs comparisons: three cone types make colour three-dimensional, which is why lights with different spectra can match. The cone signals are then recoded into red–green and blue–yellow opponent channels, which explains hue cancellation, unique hues and afterimages. Constancy across illuminants is achieved, imperfectly, by adapting each channel — and when the illuminant is ambiguous, people can see the same image in different colours.`,
      items: [
        { num: '5.1', kind: 'Principle', name: 'The principle of univariance', deps: ['psych-4.1'], refs: ['Goldstein ch. 9'],
          pic: 'A single cone’s response to lights of different wavelength and intensity: find two lights it cannot tell apart, and add a second cone type to see the ambiguity resolved.' },
        { num: '5.2', kind: 'Theorem', name: 'Metamers form the null space of the cone responses', deps: ['psych-5.1', 'art-4.3', 'ladr-3.11'], refs: ['Goldstein ch. 9'],
          pic: 'Edit a spectrum with control points; adding any spectrum from the null space of the 3-row cone matrix changes the curve but leaves the three cone readouts and the colour swatch unchanged.' },
        { num: '5.3', kind: 'Phenomenon', name: 'Wavelength discrimination function', deps: ['psych-5.1'], refs: ['Goldstein ch. 9'],
          pic: 'Find the smallest wavelength step you can see at points along the spectrum; your Δλ curve dips where cone sensitivities cross and rises at the spectrum ends.' },
        { num: '5.4', kind: 'Phenomenon', name: 'Hue cancellation (Hurvich–Jameson)', deps: ['art-5.7'], refs: ['Goldstein ch. 9'],
          pic: 'Add green light to a yellowish-red until no red remains; repeating across wavelengths traces the red–green and blue–yellow opponent valence curves.' },
        { num: '5.5', kind: 'Concept', name: 'Unique hues', deps: ['art-5.7'], refs: ['Goldstein ch. 9'],
          pic: 'Pick the yellow that is neither reddish nor greenish on a hue wheel; your unique yellow, blue and green are compared with a population distribution, which is surprisingly broad.' },
        { num: '5.6', kind: 'Model', name: 'Zone model: cones feeding opponent channels', deps: ['psych-5.2', 'art-5.7'], refs: ['Goldstein ch. 9'],
          pic: 'A wiring diagram from L, M and S cones into L−M, S−(L+M) and L+M channels; drag a spectrum and watch all six signals, then knock out a cone to see which channel goes silent.' },
        { num: '5.7', kind: 'Phenomenon', name: 'The McCollough effect', deps: ['psych-5.6'], refs: ['Goldstein ch. 9'],
          pic: 'Adapt to alternating red-horizontal and green-vertical gratings for a few minutes; black-and-white test gratings then look tinted by orientation, an aftereffect that can last for days.' },
        { num: '5.8', kind: 'Method', name: 'Colour-vision tests: Ishihara plates and the anomaloscope', deps: ['art-4.12'], refs: ['Goldstein ch. 9'],
          pic: 'Plates of coloured dots are rendered through simulated protan, deutan and tritan projections, so you see which numerals vanish for each deficiency; a Rayleigh-match slider mimics the anomaloscope.' },
        { num: '5.9', kind: 'Model', name: 'Von Kries adaptation', deps: ['art-6.6'], refs: ['Goldstein ch. 9'],
          pic: 'Change the illuminant on a palette of surfaces; independent gain control on each cone class brings the colours back near their daylight appearance, with residual errors drawn as arrows.' },
        { num: '5.10', kind: 'Phenomenon', name: '#TheDress: disagreement about the illuminant', deps: ['psych-5.9'], refs: ['Goldstein ch. 9'],
          pic: 'One photograph, two interpretations: tell the page whether you assume warm or cool lighting and it discounts that illuminant, turning the same pixels white-gold or blue-black.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'Organization, depth and size',
      summary: String.raw`Before we recognise objects we must group features and separate figure from ground; the Gestalt laws describe the grouping cues the visual system uses, and bistable figures show those choices flipping. Depth comes from binocular disparity and from pictorial cues, and the depth we infer feeds back into the size we perceive, which is the root of several famous illusions. Modern accounts treat this as probabilistic inference that weights each cue by its reliability.`,
      items: [
        { num: '6.1', kind: 'Principle', name: 'Figure–ground segregation', deps: [], refs: ['Goldstein ch. 5'],
          pic: 'Rubin’s vase with adjustable border shape, contrast and symmetry: report which region looks like the figure and see how convexity and smallness tip the balance.' },
        { num: '6.2', kind: 'Principle', name: 'Gestalt grouping by proximity', deps: ['psych-6.1'], refs: ['Goldstein ch. 5'],
          pic: 'A dot lattice whose row and column spacings you drag; the perceived grouping flips from rows to columns as the spacing ratio crosses about one.' },
        { num: '6.3', kind: 'Principle', name: 'Grouping by similarity', deps: ['psych-6.1'], refs: ['Goldstein ch. 5'],
          pic: 'Pit colour similarity against proximity in the same lattice; sliders for colour difference and spacing locate the point where the two cues balance.' },
        { num: '6.4', kind: 'Principle', name: 'Good continuation and contour integration', deps: ['psych-6.1'], refs: ['Goldstein ch. 5'],
          pic: 'A path of aligned Gabor patches hidden among random ones pops out; jitter the orientations and watch the path dissolve at a measurable angle.' },
        { num: '6.5', kind: 'Principle', name: 'Closure and illusory contours', deps: ['psych-6.1'], refs: ['Goldstein ch. 5'],
          pic: 'Pac-man inducers create a Kanizsa triangle; rotate the inducers out of alignment and the bright illusory edges vanish.' },
        { num: '6.6', kind: 'Principle', name: 'Common fate', deps: ['psych-6.1'], refs: ['Goldstein ch. 5'],
          pic: 'A field of random dots in which a subset moves coherently; the moving subset groups into a shape, and a coherence slider finds your threshold for seeing it.' },
        { num: '6.7', kind: 'Phenomenon', name: 'Bistable perception: the Necker cube', deps: ['psych-6.1'], refs: ['Goldstein ch. 5'],
          pic: 'Press a key whenever the cube flips; your dominance durations form a skewed histogram, and adding shading cues biases one interpretation.' },
        { num: '6.8', kind: 'Concept', name: 'Binocular disparity and stereopsis', deps: [], refs: ['Goldstein ch. 10'],
          pic: 'A top-down view of two eyes fixating a point; drag objects nearer or farther and their images shift on the two retinas by the computed disparity, with the horopter drawn.' },
        { num: '6.9', kind: 'Phenomenon', name: 'Random-dot stereograms (Julesz)', deps: ['psych-6.8'], refs: ['Goldstein ch. 10'],
          pic: 'Generate a random-dot stereogram from a depth map you draw; with free fusion or red–cyan glasses a hidden shape floats out, though neither image contains it.' },
        { num: '6.10', kind: 'Concept', name: 'Monocular depth cues', deps: [], refs: ['Goldstein ch. 10'],
          pic: 'Toggle occlusion, relative size, texture gradient, height in the field and motion parallax one at a time in a 3D scene and rate how deep it looks.' },
        { num: '6.11', kind: 'Phenomenon', name: 'Size constancy and Emmert’s law', deps: ['psych-6.10'], refs: ['Goldstein ch. 10'],
          pic: 'Project an afterimage onto surfaces at different distances: its perceived size scales with distance while its retinal size is fixed, as the computed size–distance relation shows.' },
        { num: '6.12', kind: 'Phenomenon', name: 'Müller-Lyer illusion', deps: ['psych-6.11'], refs: ['Goldstein ch. 10'],
          pic: 'Adjust a shaft until it matches a fins-in shaft; your error is measured as fin angle and length vary, and the depth (“carpentered world”) explanation is shown alongside its contested cross-cultural evidence.' },
        { num: '6.13', kind: 'Phenomenon', name: 'Ponzo illusion', deps: ['psych-6.11'], refs: ['Goldstein ch. 10'],
          pic: 'Two equal bars between converging rails; remove the rails or the texture and the illusion shrinks, measured with a matching slider.' },
        { num: '6.14', kind: 'Phenomenon', name: 'Ebbinghaus (Titchener) circles', deps: ['psych-6.1'], refs: ['Goldstein ch. 10'],
          pic: 'A central disc ringed by large or small discs; drag the inducers’ size and distance and match the centre to record how size contrast distorts it.' },
        { num: '6.15', kind: 'Phenomenon', name: 'The Ames room', deps: ['psych-6.11'], refs: ['Goldstein ch. 10'],
          pic: 'A top view and the peephole view of a trapezoidal room: people walking along the back wall seem to grow and shrink, and the top view shows the real distances.' },
        { num: '6.16', kind: 'Phenomenon', name: 'The moon illusion', deps: ['psych-6.11'], refs: ['Goldstein ch. 10'],
          pic: 'The moon’s angular size is constant (measured by a ruler overlay) while its perceived size changes from horizon to zenith; compare the apparent-distance and angular-size-contrast explanations.' },
        { num: '6.17', kind: 'Model', name: 'Bayesian cue combination (Ernst–Banks)', deps: ['psych-6.10', 'stat-10.6'], refs: ['Goldstein ch. 10'],
          pic: 'Visual and haptic estimates of a bar’s height with adjustable noise: the combined estimate lands at the reliability-weighted average and its variance is smaller than either cue’s.' },
      ],
    },
    // @@PSYCH-MORE@@
  ],
};
