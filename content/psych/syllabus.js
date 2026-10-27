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
        { num: '1.14', kind: 'Paper', name: 'Elemente der Psychophysik',
          paper: { authors: 'Gustav Theodor Fechner', year: 1860, title: 'Elemente der Psychophysik', venue: 'Leipzig: Breitkopf und Härtel (2 vols)', url: 'https://archive.org/details/elementederpsych001fech' },
          introduces: ['psych-1.11', 'psych-1.4', 'psych-1.5', 'psych-1.6'], deps: ['psych-1.9', 'pma-8.6'], refs: [],
          pic: 'Fechner’s step from Weber to the logarithm: stack just-noticeable differences one on another along a stimulus axis with a Weber fraction you set, and the count of steps traces S = k log(I/I₀); then run his lifted-weights method of right and wrong cases (constant stimuli) on yourself and read your own Weber fraction off the fitted psychometric curve.' },
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
        { num: '2.10', kind: 'Theorem', name: 'Area under the ROC equals 2AFC accuracy', deps: ['psych-2.6', 'psych-1.8', 'prob-2.1.12'], refs: ['M&C ch. 7'],
          pic: 'Shade the area under a simulated ROC and run the same observer through 2AFC trials; the proportion correct converges to the shaded area.' },
        { num: '2.11', kind: 'Theorem', name: 'd′ in 2AFC is √2 times the yes–no d′', deps: ['psych-2.3', 'psych-1.8'], refs: ['M&C ch. 7'],
          pic: 'The 2AFC decision variable is a difference of two noisy samples; its distributions are drawn and their separation is √2 larger in standard units, confirmed by simulated trials.' },
        { num: '2.12', kind: 'Theorem', name: 'Optimal criterion from payoffs and base rates', deps: ['psych-2.4', 'stat-6.4', 'stat-10.1'], refs: ['M&C ch. 2'],
          pic: 'Set the prior probability of a signal and the payoff matrix; the expected-value-maximising criterion moves to where the likelihood ratio equals the computed β, and you can try to beat it by hand.' },
        { num: '2.13', kind: 'Concept', name: 'The ideal observer', deps: ['psych-2.12'], refs: ['Gescheider ch. 6'],
          pic: 'Detect a known pattern in pixel noise yourself, then compare your d′ with that of a template-matching ideal observer; the ratio squared is your efficiency.' },
        { num: '2.14', kind: 'Phenomenon', name: 'Detection in the wild: screening and rare targets', deps: ['psych-2.12'], refs: ['Gescheider ch. 8'],
          pic: 'A baggage-screening task where weapons appear in 50% or 2% of bags: with rare targets your criterion drifts conservative and misses climb, even though d′ barely changes.' },
        { num: '2.15', kind: 'Paper', name: 'A Decision-Making Theory of Visual Detection',
          paper: { authors: 'Wilson P. Tanner, Jr. and John A. Swets', year: 1954, title: 'A Decision-Making Theory of Visual Detection', venue: 'Psychological Review 61 (6): 401–409', doi: '10.1037/h0058700' },
          introduces: ['psych-2.1', 'psych-2.3', 'psych-2.6', 'psych-2.9'], deps: ['psych-1.12', 'stat-6.4'], refs: [],
          pic: 'Observers look for a faint flash of fixed intensity while the probability that a signal is presented is varied: their hit and false-alarm rates trace a bowed ROC that one value of d′ fits, not the straight line a high-threshold theory predicts; move the criterion across equal-variance Gaussian noise and signal distributions and compare both predicted curves with the data points.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Scaling sensation',
      summary: String.raw`If we ask people directly how strong a sensation is, the answers follow a power law rather than Fechner’s logarithm, with exponents that differ widely between senses. Cross-modality matching checks the power law’s internal consistency, while category and comparative-judgment methods build scales from discriminations. The chapter ends with Luce’s choice axiom and multidimensional scaling, which carry these ideas from sensation into preference and similarity.`,
      items: [
        { num: '3.1', kind: 'Method', name: 'Magnitude estimation', deps: ['psych-1.2', 'nla-2.8'], refs: ['Gescheider ch. 11'],
          pic: 'Assign numbers to the brightness of patches relative to a standard of 10; your estimates on log–log axes fall near a straight line whose slope is your personal exponent.' },
        { num: '3.2', kind: 'Law', name: 'Stevens’ power law', deps: ['psych-3.1', 'psych-1.11'], refs: ['Stevens (1961), pp.10–17 and24–25'],
          pic: 'Normalized power and effective-offset curves distinguish the exponent, local log slope, finite secant and correct doubling ratio on fully bounded ordinary/log plots.' },
        { num: '3.3', kind: 'Concept', name: 'Exponents across sensory continua', deps: ['psych-3.2'], refs: ['Stevens (1961), Table 2 andp.12; Stevens–Guirao (1963) andStevens–Harris (1962) original abstracts'],
          pic: 'Source-specific historical coefficients identify their physical variables, including inverse grit number; shareable selection and a ratio control compute normalized curves and predictions.' },
        { num: '3.4', kind: 'Method', name: 'Cross-modality matching', deps: ['psych-3.2'], see: ['psych-3.3'], refs: ['Stevens (1961), Cross-Modality Comparisons, pp.14–17'],
          pic: 'Seeded reciprocal adjustment samples and exact exponent-ratio predictions expose finite-sample regression direction, with complete trial/fit bounds and replay.' },
        { num: '3.5', kind: 'Paradox', name: 'Fechner versus Stevens: which psychophysical law?', deps: ['psych-1.11', 'psych-3.2'], refs: ['Gescheider ch. 13', 'Gescheider ch. 14'],
          pic: 'Generate JND-based and magnitude-estimation scales from the same simulated observer; the two curves disagree, and a toggle shows how a power law with a Weber-type JND produces both.' },
        { num: '3.6', kind: 'Method', name: 'Category scaling and range–frequency effects', deps: ['psych-3.1'], refs: ['Gescheider ch. 10'],
          pic: 'Rate the size of squares on a 1–7 scale; skewing the set toward small squares shifts your ratings of the same middle square, exactly as Parducci’s range–frequency model predicts.' },
        { num: '3.7', kind: 'Law', name: 'Thurstone’s law of comparative judgment', deps: ['psych-2.1'], refs: ['Gescheider ch. 9'],
          pic: 'Pairwise “which is heavier?” choices among five weights are converted through z-scores into scale values on a line; a noise slider shows how discriminal dispersion spaces them.' },
        { num: '3.8', kind: 'Principle', name: 'Luce’s choice axiom', deps: ['prob-1.1.1a'], see: ['psych-3.7'], refs: ['Luce (2008), author exposition, §1 and §§2.1–2.4'],
          pic: 'A full positive four-option family includes all 15 nonempty menus, singleton/empty UI handling and scale identification; synchronized sliders/handles and an explicitly authored equal-copy counterexample separate one pair/menu comparison from the complete 54-comparison IIA audit.' },
        { num: '3.9', kind: 'Model', name: 'Loudness in sones: a mid-level approximation', deps: ['psych-3.2', 'music-1.8'], see: ['music-1.9'], refs: ['Moore (2014) author account, Figure 6; Kryter (1966) pp. 2–5; NBSIR 75-938 (1977) pp. 5–6'],
          pic: 'Coupled level/difference controls keep both modeled 1-kHz levels in 40–80, distinguish nominal exact doubling from rounded/authored exponents and pressure/intensity conversions, and play an uncalibrated fixed-peak relative digital pair without asserting perceived doubling.' },
        { num: '3.10', kind: 'Method', name: 'Classical multidimensional scaling', deps: ['ladr-7.29', 'ladr-7.38', 'prob-1.2.5'], see: ['psych-3.7'], refs: ['Williams, NIPS2000/2001, technical exposition §2'],
          pic: 'Authored point/noise families test Gram centering, PSD/eigen reconstruction, rigid-only alignment, explicit undefined zero ratios and fully bounded spectral distance-error diagnostics, with no empirical data or stress/nonmetric optimizer claim.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Early vision: receptors, contrast and lightness',
      summary: String.raw`The retina already processes the image: two receptor systems trade sensitivity for acuity, and lateral inhibition between neighbouring cells makes the visual system respond to edges rather than absolute light levels. That explains Mach bands and some contrast illusions, but not all of them — the Hermann grid and the lightness illusions show that higher-level interpretation of surfaces and illumination matters too. Fixed images even fade away, a reminder that vision is built for change.`,
      items: [
        { num: '4.1', kind: 'Concept', name: 'Duplex retina: rods and cones', deps: [], refs: ['Curcio et al. (1990), methods/Table 3/Figures 6/9 and author archived temporal means'],
          pic: 'All 28 common archived temporal locations retain means, contributing counts and true zero; an explicitly schematic patch rounds density×area, while emphasis predicts no activation or visibility and whole-eye estimates remain separate.' },
        { num: '4.2', kind: 'Phenomenon', name: 'Dark adaptation and the rod–cone break', deps: ['psych-4.1'], refs: ['Hecht, Haig and Chase (1937), methods and Figures 2–5'],
          pic: 'Fully framed authored cone/rod log-threshold branches expose their initial values, unique numerical crossing and actual probe; model isolation and delay are distinguished from the original condition-dependent peripheral experiment.' },
        { num: '4.3', kind: 'Phenomenon', name: 'The Purkinje shift', deps: ['psych-4.1'], refs: ['CIE S 017:2020 e-ILV definitions and CIE (2019) photopic/scotopic datasets'],
          pic: 'Complete published observer functions and an explicitly authored photopically balanced monochromatic pair compare within-condition ratios and normalized shares; no calibrated mesopic blend or screen appearance is inferred.' },
        { num: '4.4', kind: 'Model', name: 'Finite pooling: sensitivity and spatial sampling', deps: ['prob-2.2.1', 'sig-2.10'], see: ['psych-4.1', 'psych-4.5'], refs: ['MIT 6.02 (2012), Chapter 12, discrete moving averages'],
          pic: 'Exact finite receptor means, phase-dependent grating samples and aperture gain; a movable finite spot compares coverage-based SNR across pool sizes.' },
        { num: '4.5', kind: 'Law', name: 'Ricco’s and Bloch’s laws of summation', deps: ['psych-1.1'], see: ['psych-4.4'], refs: ['Barlow (1958), methods/Figures 1–3/discussion', 'Kalloniatis and Luu (2007), Temporal Resolution §1'],
          pic: 'Two separate authored normalized cuts expose exact reciprocity, post-critical slopes and dimensionless products; critical values depend on experimental conditions and do not identify one receptor pool or integration time.' },
        { num: '4.6', kind: 'Concept', name: 'Centre–surround receptive fields', deps: ['psych-4.4'], refs: ['Kuffler (1953), methods/§§4–5/Figures 6/8', 'Meister and Berry (1999), pp. 435–439/Figure 1'],
          pic: 'Exact whole-plane Gaussian disk/annulus masses expose balanced uniform cancellation, authored polarity and rectification, and the true global disk-size maximum including endpoints.' },
        { num: '4.7', kind: 'Model', name: 'Recurrent lateral inhibition with nonnegative rates', deps: ['pma-9.23'], see: ['psych-4.6'], refs: ['Hartline and Ratliff (1957), J. Gen. Physiol.40:357–376, steady pair interactions and response restrictions'],
          pic: 'A finite nonnegative recurrent network with globally normalized symmetric weights, contraction-domain controls and measured residuals, compared with one pass.' },
        { num: '4.8', kind: 'Model', name: 'Centre–surround filtering and Mach bands', deps: ['psych-4.6', 'rca-8.13'], see: ['psych-4.7', 'art-6.2'], refs: ['Kingdom (2014), introduction/step-edge results/Figure 5/discussion'],
          pic: 'An analytic whole-line Gaussian ramp convolution includes the exact step endpoint, finite tail effects and asymptotic levels; knee derivatives and a response probe distinguish signed filter lobes from perceived brightness.' },
        { num: '4.9', kind: 'Phenomenon', name: 'Hermann grid: the limits of centre–surround', deps: ['psych-4.6'], refs: ['Geier et al. (2008), §§2–4, Figures1–6 and distortion-tolerance experiment'],
          pic: 'Two explicitly invertible shears locate crossings without a failed fixed-point assumption; exact finite filter signals stay distinct from reported smudges.' },
        { num: '4.10', kind: 'Phenomenon', name: 'White’s illusion: contrast against a single isotropic filter', deps: ['psych-4.9'], refs: ['Blakeslee et al. (2016), §§1–5; Blakeslee and McCourt (1999), abstract'],
          pic: 'Equal encoded patches and optional references are separated from signed finite filter output, with full scale and boundary rules and no calibrated illusion-size claim.' },
        { num: '4.11', kind: 'Phenomenon', name: 'Craik–O’Brien–Cornsweet illusion', deps: ['psych-4.6'], refs: ['Purves, Shimpi and Lotto (1999), methods, Figure2, results/discussion'],
          pic: 'Exact finite endpoint equality in a compact cusp is separated from sampled threshold reconstruction and cover-generated edges; no modeled difference is called measured perception.' },
        { num: '4.12', kind: 'Phenomenon', name: 'Lightness constancy and the anchoring problem', deps: ['psych-4.1'], refs: ['Gilchrist et al. (1999), pp.804–805, Equations1–3 and weighting discussion'],
          pic: 'A positive convex mixture of explicit local/global assignments retains every actual value; missing white references expose failures even at full local weight.' },
        { num: '4.13', kind: 'Phenomenon', name: 'The blind spot and perceptual filling-in', deps: ['psych-4.1'], refs: ['Awater et al. (2005); Chen et al. (2017), blind-spot measurement/results'],
          pic: 'Both eyes mirror a fully visible finite geometric mask; exact dot-cell replacement counts are distinct from continuous area, calibrated angles and actual visibility.' },
        { num: '4.14', kind: 'Phenomenon', name: 'Troxler fading', deps: ['ode-1.4'], refs: ['Riggs et al. (1953), methods/results; Martinez-Conde et al. (2006), fixation/visibility experiment'],
          pic: 'Closed-form adapting units recompute from the same initial state at every control change, with exact zero-modulation decay and explicit authored proxy limits.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      "n": 5,
      "title": "Colour vision",
      "summary": "One receptor output cannot separately identify spectral composition and intensity. Comparing cone classes removes some ambiguities, but physically different spectra can still produce the same cone signals. Perceptual hue judgments, adaptation and colour constancy require further evidence: a convenient linear recoding alone does not determine appearance. The chapter keeps exact finite cone-response calculations, subjective tasks and published observations distinct.",
      "items": [
        {
          "num": "5.1",
          "kind": "Principle",
          "name": "The principle of univariance",
          "deps": [
            "psych-4.1"
          ],
          "refs": [
            "Stockman & Rider (2023), Introduction and §1.1 glossary: univariance and cone fundamentals",
            "CIE170-1:2006 Table 6.7,2° energy-based LMS data; exact finite monochromatic model"
          ],
          "pic": "Choose two tabulated wavelengths, the cone class to match and the reference energy. The comparison energy is solved rather than guessed. Inspect the three actual source sensitivities and both sets of cone responses; a single matched class need not match the others."
        },
        {
          "num": "5.2",
          "kind": "Theorem",
          "name": "Metamers form the null space of the cone responses",
          "deps": [
            "psych-5.1",
            "art-4.3",
            "ladr-3.11"
          ],
          "refs": [
            "CIE170-1:2006 Table 6.7, declared finite source matrix",
            "Stockman & Rider (2023), §1.1 metamers and cone fundamentals; self-contained finite linear-algebra proof"
          ],
          "pic": "Move along an exact null direction of the four-primary source matrix. Compare reference and edited powers and their cone responses. Switch to repeated wavelengths to change rank, or to black to see the physical interval collapse while algebraic null directions remain."
        },
        {
          "num": "5.3",
          "kind": "Phenomenon",
          "name": "Wavelength discrimination function",
          "deps": [
            "psych-5.1",
            "ladr-6.55"
          ],
          "refs": [
            "Regan & Tyler (1971), Some dynamic features of colour vision, Methods and §3, pp.1308 and1317–1319",
            "CIE2006 energy cone table; authored nuisance-intensity Gaussian measurement model"
          ],
          "pic": "Choose the available cone classes, intensity and noise, then inspect the local information along the source samples. A single class carries no wavelength information when intensity is unknown in this model. The readout identifies the finite-difference stencil and calculated scale; no screen discrimination test is performed."
        },
        {
          "num": "5.4",
          "kind": "Phenomenon",
          "name": "Hue cancellation (Hurvich–Jameson)",
          "deps": [
            "art-5.7"
          ],
          "refs": [
            "York University, Hue Cancellation Method, teaching exposition, observer-specific comparison hues and arbitrary sign",
            "CIE2006 energy cone table; authored linear cancellation example; original Hurvich–Jameson body not checked"
          ],
          "pic": "Choose test and added wavelengths, a declared signed combination and its weight. Move added energy along the actual mixture path. A green point marks a nonnegative algebraic null only when it lies in range; the readout distinguishes an unavailable cancellation from a null outside the plot."
        },
        {
          "num": "5.5",
          "kind": "Concept",
          "name": "Unique hues",
          "deps": [
            "art-5.7"
          ],
          "refs": [
            "Webster, Miyahara, Malkoc & Raker (2000), Variations in normal color vision II: Unique hues, publisher metadata/abstract only",
            "York University hue-cancellation exposition; authored uncalibrated judgment exercise"
          ],
          "pic": "Choose a screen hue and the hue pair to consider, then optionally record “first hue”, “second hue” or “neither”. The wheel locates only the authored screen angle. There is no fabricated population histogram, standard answer or conversion of your report to a measured wavelength."
        },
        {
          "num": "5.6",
          "kind": "Model",
          "name": "Zone model: cones feeding opponent channels",
          "deps": [
            "psych-5.2",
            "art-5.7"
          ],
          "refs": [
            "ART 5.7, source-audited opponent-process account",
            "CIE170-1:2006 Table 6.7; explicitly authored invertible transform"
          ],
          "pic": "Move a source wavelength and energy through the cone inputs. Inspect the three recoded signals and their inverse reconstruction. Apply the explicit input-zero intervention to test which channels change; do not assume a channel disappears simply because one cone input is absent."
        },
        {
          "num": "5.7",
          "kind": "Phenomenon",
          "name": "The McCollough effect",
          "deps": [
            "psych-5.6"
          ],
          "refs": [
            "Vul, Krizay & MacLeod (2008), The McCollough effect reflects permanent and transient adaptation in early visual cortex, General methods, Experiment 1 and Linear model",
            "McCollough (1965), original bibliographic record only; original body inaccessible"
          ],
          "pic": "Scrub the model adaptation time, recovery time and test orientation. Compare the two chosen components and their signed sum. All time is a parameter in the chart; there is no timed adapting sequence or instruction to view alternating gratings."
        },
        {
          "num": "5.8",
          "kind": "Method",
          "name": "Colour-vision tests: Ishihara plates and the anomaloscope",
          "deps": [
            "art-4.12",
            "ladr-6.55"
          ],
          "refs": [
            "National Eye Institute, Testing for Color Vision Deficiency, colour-plate and anomaloscope descriptions",
            "CIE2006 energy cone table; authored545/610/590nm constraint example",
            "Manufacturer instrument manual body unavailable; literal instrument wavelengths/protocol not reproduced"
          ],
          "pic": "Switch between the authored dot code and the spectral analogue. In the first, retain or discard the encoded component. In the second, adjust mixture and comparison brightness, choose retained equations and inspect both current and best-brightness mismatches. No result is scored or assigned a deficiency label."
        },
        {
          "num": "5.9",
          "alias": "art-6.7",
          "name": "Von Kries adaptation"
        },
        {
          "num": "5.10",
          "kind": "Phenomenon",
          "name": "#TheDress: disagreement about the illuminant",
          "deps": [
            "psych-5.2"
          ],
          "refs": [
            "Lafer-Sousa, Hermann & Conway (2015), Striking individual differences in color perception uncovered by the dress photograph, complete main2pages and selected supplemental methods",
            "Authored four-primary illumination/reflectance factorization"
          ],
          "pic": "Select one of the four published rounded aggregate categories. Separately change the assumed four-primary illuminant: the inferred reflectance changes while its product reconstructs the fixed observed spectrum. These model curves are not the source's perceptual categories or a recoloured original photograph."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'Organization, depth and size',
      summary: String.raw`Before we recognise objects we must group features and separate figure from ground; the Gestalt laws describe the grouping cues the visual system uses, and bistable figures show those choices flipping. Depth comes from binocular disparity and from pictorial cues, and the depth we infer feeds back into the size we perceive, which is the root of several famous illusions. Modern accounts treat this as probabilistic inference that weights each cue by its reliability.`,
      items: [
        {
          "num": "6.1",
          "kind": "Principle",
          "name": "Figure–ground segregation",
          "deps": [],
          "refs": [
            "Wagemans (2018), Perceptual organization, selected figure–ground discussion and PDF pp. 3–5",
            "OpenStax Psychology 2e §5.6, figure–ground teaching exposition; original stimulus and polygon-area derivation"
          ],
          "pic": "Change the central width and the border's asymmetry, or reverse the neutral tones. Optionally reveal the shared boundaries and record your current interpretation. The area comparison describes the drawn regions; your chosen report remains separate."
        },
        {
          "num": "6.2",
          "kind": "Principle",
          "name": "Gestalt grouping by proximity",
          "deps": [
            "psych-6.1"
          ],
          "refs": [
            "Wagemans (2018), PDF pp. 3–4, proximity and interactions among grouping cues",
            "OpenStax Psychology 2e §5.6; original fixed-scale lattice"
          ],
          "pic": "Adjust horizontal and vertical spacing independently. Watch the same 36 dots move, then compare the two center-to-center gaps. Equal spacing is a geometric tie, not a command to see a particular grouping."
        },
        {
          "num": "6.3",
          "kind": "Principle",
          "name": "Grouping by similarity",
          "deps": [
            "psych-6.1"
          ],
          "refs": [
            "Wagemans (2018), PDF pp. 3–4, similarity and competing grouping arrangements",
            "OpenStax Psychology 2e §5.6; original independent feature/spacing construction"
          ],
          "pic": "Choose an appearance pattern and vary its separation while changing the two spatial gaps. Try rows in appearance with closer vertical neighbors, then set appearance separation to zero. Compare the independent stimulus differences without a fabricated cue-balance score."
        },
        {
          "num": "6.4",
          "kind": "Principle",
          "name": "Good continuation and contour integration",
          "deps": [
            "psych-6.1"
          ],
          "refs": [
            "Wagemans (2018), selected continuation/contour-integration discussion and PDF pp. 4–5",
            "Original Gaussian-windowed cosine field and tangent-offset calculation"
          ],
          "pic": "Vary angular jitter, clutter and the reproducible seed. Look for the authored contour before revealing its path, then inspect the actual orientation offsets. The reveal adds a diagnostic guide that is absent from the initial stimulus."
        },
        {
          "num": "6.5",
          "kind": "Principle",
          "name": "Closure and illusory contours",
          "deps": [
            "psych-6.1"
          ],
          "refs": [
            "Illusions Index, Kanizsa Triangle, main teaching discussion and modal/amodal distinction",
            "Wagemans (2018), selected closure discussion and PDF p. 5; original inducer geometry"
          ],
          "pic": "Rotate the inducer openings and change their radii. Compare the center and background code probes, then optionally add the explicit diagnostic outline. Equal code values verify what was drawn, not whether every observer experiences the same apparent brightness or contour."
        },
        {
          "num": "6.6",
          "kind": "Principle",
          "name": "Common fate",
          "deps": [
            "psych-6.1"
          ],
          "refs": [
            "Wagemans (2018), PDF pp. 3–4, common-fate grouping",
            "Original seeded membership and wrapped-motion construction"
          ],
          "pic": "Play or pause the real motion, vary the coherent membership and inspect a selected phase. Reveal members or velocity strokes to verify which dots share motion. Changing the seed changes a reproducible realization, not an observer's detection ability."
        },
        {
          "num": "6.7",
          "kind": "Phenomenon",
          "name": "Bistable perception: the Necker cube",
          "deps": [
            "psych-6.1"
          ],
          "refs": [
            "Illusions Index, Necker Cube, main discussion, ambiguity and possible flat interpretation",
            "Original common-projection/front-face diagrams"
          ],
          "pic": "Compare the unmarked wireframe with the two explicitly cued interpretations. Select a cue or record your current report, including a flat view. The vertices stay fixed; colored cues are additions to the image and are not spontaneous perceptual switches."
        },
        {
          "num": "6.8",
          "kind": "Concept",
          "name": "Binocular disparity and stereopsis",
          "deps": [],
          "refs": [
            "Heeger, NYU Depth and size lecture, binocular disparity and horopter teaching discussion",
            "Original centered-ray and exact cross/dot derivation"
          ],
          "pic": "Move the point sideways and in depth, change fixation and eye separation, and compare the rays, registered retinal angles and disparity curve. Put the point at fixation, then move sideways at the same depth: the fixation plane does not stay at zero disparity."
        },
        {
          "num": "6.9",
          "kind": "Phenomenon",
          "name": "Random-dot stereograms (Julesz)",
          "deps": [
            "psych-6.8"
          ],
          "refs": [
            "Heeger, NYU Depth and size lecture, random-dot stereograms and correspondence",
            "Original source-ownership construction; Julesz original book body not checked"
          ],
          "pic": "Choose the hidden shape, integer disparity and seed. Compare parallel or cross-fusion image ordering, single-eye images, red/cyan channels and the mask reveal. Inspect a selected row's actual source correspondences; zero disparity gives identical eye images."
        },
        {
          "num": "6.10",
          "kind": "Concept",
          "name": "Monocular depth cues",
          "deps": [],
          "refs": [
            "Heeger, NYU Depth and size lecture, pictorial cues, relative size and motion parallax",
            "Original ray-plane projection and camera-translation calculation"
          ],
          "pic": "Vary the two object depths and the camera position. Toggle the actual context drawing and compare equal-world-height with equal-image-height objects. Follow the world top view and the two computed parallax shifts to separate image size from physical size."
        },
        {
          "num": "6.11",
          "kind": "Phenomenon",
          "name": "Size constancy and Emmert’s law",
          "deps": [
            "psych-6.10"
          ],
          "refs": [
            "Nakamizo & Imamura (2004), Verification of Emmert’s Law in Actual and Virtual Environments, complete main text pp. 325–329",
            "Heeger, NYU Depth and size lecture; original centered-ray angle convention"
          ],
          "pic": "Compare a fixed real object with a fixed image diameter. Change physical distance and the explicitly assumed scaling distance, then inspect the constant-size and linear-size constructions. This diagram induces no actual afterimage and uses no flash."
        },
        {
          "num": "6.12",
          "kind": "Phenomenon",
          "name": "Müller-Lyer illusion",
          "deps": [
            "psych-6.11"
          ],
          "refs": [
            "Bach, Müller-Lyer Illusion, main teaching discussion and proposed perspective interpretation",
            "Amir & Firestone (2025), preprint title/abstract/initial introduction only, challenge to a strong cultural account; broader body unread",
            "Original shaft matching and fin geometry"
          ],
          "pic": "Adjust the lower shaft before revealing its physical length and signed match error. Change fin length or angle, and remove the fins to compare contexts. The reveal reports your actual setting; it supplies no expected percentage error."
        },
        {
          "num": "6.13",
          "kind": "Phenomenon",
          "name": "Ponzo illusion",
          "deps": [
            "psych-6.11"
          ],
          "refs": [
            "Donaldson & Macpherson (2017), Illusions Index: Ponzo Illusion, main teaching discussion and alternative explanations",
            "Original conditional parallel-rail pinhole derivation"
          ],
          "pic": "Match the upper bar to the lower, vary rail convergence, and switch among no context, rails, or rails with texture. Reveal the physical error separately from the size ratio implied by the explicit parallel-world-rail interpretation."
        },
        {
          "num": "6.14",
          "kind": "Phenomenon",
          "name": "Ebbinghaus (Titchener) circles",
          "deps": [
            "psych-6.1"
          ],
          "refs": [
            "Thomson & Macpherson (2017), Illusions Index: Ebbinghaus Illusion, basic size-context demonstration",
            "Original fixed-center-distance circle geometry and physical area ratio"
          ],
          "pic": "Adjust the comparison center, reverse the small and large surrounds, or remove context. Reveal diameter guides and the physical ratio after considering the appearance. The phone layout stacks the two arrangements while preserving the same circle scale."
        },
        {
          "num": "6.15",
          "kind": "Phenomenon",
          "name": "The Ames room",
          "deps": [
            "psych-6.11"
          ],
          "refs": [
            "Ittelson, The Ames Demonstrations in Perception, chapter 13 pp. 183–184 and original figures p. 185 inspected; original projective construction",
            "Gehringer & Engel (1986), Effect of ecological viewing conditions on the Ames’ distorted room illusion, abstract acquired in search only; full body unchecked"
          ],
          "pic": "Change the two room depths and move the camera sideways or upward. Compare the peephole projection with the world top view. Both figures keep the same world height; their image-height ratio follows the actual depths."
        },
        {
          "num": "6.16",
          "kind": "Phenomenon",
          "name": "The moon illusion",
          "deps": [
            "psych-6.11"
          ],
          "refs": [
            "NASA Science, The Moon Illusion: Why Does the Moon Look So Big Sometimes?, main teaching article, updated 2025",
            "Original equal-radius schematic and identical comparison guides"
          ],
          "pic": "Move the schematic Moon from the horizon toward the zenith, switch the context, and reveal equal-diameter rulers. Changing model angular diameter changes both discs together. The duplicate crater patterns are authored decoration; the diagram does not predict how large either disc will appear to you."
        },
        {
          "num": "6.17",
          "kind": "Model",
          "name": "Bayesian cue combination (Ernst–Banks)",
          "deps": [
            "psych-6.10",
            "stat-10.6"
          ],
          "refs": [
            "Ernst & Banks (2002), Humans integrate visual and haptic information in a statistically optimal fashion, complete main argument/results/methods via Gale HTML; figure captions read, figure pixels unavailable",
            "STAT 10.6, normal–normal precision update; original correlated quadratic-variance extension"
          ],
          "pic": "Change cue estimates, uncertainties and correlation. Compare the independence rule, the correlated minimum-variance rule and a chosen weight. Inspect authored Gaussian curves, the exact weights and the actual variance curve; challenge independence rather than assuming that combining always helps."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Motion and multisensory perception',
      summary: String.raw`Motion is computed, not seen directly: correlating the input at neighbouring points over time gives a motion signal, which is why rapid sequences of stills look like movement and why local detectors cannot resolve the direction of a long edge. The same logic explains aliasing on spinning wheels. Different senses are then fused, and when they conflict — lips against voice, a light against a sound — the more reliable sense captures the other.`,
      items: [
        { num: '7.1', kind: 'Phenomenon', name: 'Apparent motion and Korte’s laws', deps: [], refs: ['Goldstein ch. 8'],
          pic: 'Two lights flash alternately; drag the gap and the interval and map the region where you see smooth motion, simultaneity or succession — the zone tilts as Korte’s third law says.' },
        { num: '7.2', kind: 'Model', name: 'Reichardt correlation detector', deps: ['psych-7.1'], refs: ['Goldstein ch. 8'],
          pic: 'Two receptors, a delay line and a multiplier: feed in moving gratings and the opponent output is positive for one direction, negative for the other, and peaks at a speed set by the delay.' },
        { num: '7.3', kind: 'Phenomenon', name: 'Motion aftereffect (waterfall illusion)', deps: ['psych-7.2'], refs: ['Goldstein ch. 8'],
          pic: 'Stare at a drifting texture for thirty seconds, then at a static one, which seems to drift backwards; the duration slider shows the aftereffect growing with adaptation time.' },
        { num: '7.4', kind: 'Phenomenon', name: 'The aperture problem and the barber-pole illusion', deps: ['psych-7.2'], refs: ['Goldstein ch. 8'],
          pic: 'A grating seen through a draggable aperture: through a circle its direction is ambiguous, through a tall rectangle it seems to move along the long axis, though the true velocity never changes.' },
        { num: '7.5', kind: 'Phenomenon', name: 'Biological motion from point lights (Johansson)', deps: ['psych-6.6'], refs: ['Goldstein ch. 8'],
          pic: 'Twelve dots on the joints of a walker: static they look random, moving they become a person whose gender and mood you can judge; scramble the phases and the percept breaks.' },
        { num: '7.6', kind: 'Phenomenon', name: 'The wagon-wheel effect', deps: ['psych-7.1', 'sig-7.5'], refs: ['Goldstein ch. 8'],
          pic: 'A spoked wheel sampled at a frame rate you control: as rotation speed passes multiples of the frame rate the wheel appears to stop or turn backwards, exactly at the aliased frequencies.' },
        { num: '7.7', kind: 'Phenomenon', name: 'The McGurk effect', deps: [], refs: ['Goldstein ch. 13'],
          pic: 'A talking face says “ga” while the audio says “ba”; most people hear “da” — close your eyes (toggle the video) and the audio is heard correctly again.' },
        { num: '7.8', kind: 'Phenomenon', name: 'The ventriloquism effect', deps: ['psych-6.17'], refs: ['Goldstein ch. 12'],
          pic: 'Localise a beep paired with a flash: the perceived position is pulled toward the flash, and blurring the flash shifts weight back to hearing, as reliability weighting predicts.' },
        { num: '7.9', kind: 'Phenomenon', name: 'Auditory streaming (van Noorden)', deps: ['psych-6.2'], refs: ['Goldstein ch. 12'],
          pic: 'An ABA–ABA tone sequence: widen the frequency gap or speed up the tempo and the gallop splits into two separate streams; map your boundary on the gap–tempo plane.' },
        { num: '7.10', kind: 'Phenomenon', name: 'The cocktail-party effect', deps: ['psych-7.9', 'music-5.12'], refs: ['Goldstein ch. 12'],
          pic: 'Two voices mixed together: separating them spatially, by pitch or by sex raises your word-report accuracy, and the gains for each cue are tallied.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Reaction time and attention',
      summary: String.raw`Reaction times are the oldest window onto mental processing: subtracting the times of simpler tasks isolates stages, and choice time grows with the information carried by the stimulus (Hick–Hyman), while movement time grows with the difficulty of the target (Fitts). Accuracy can be traded for speed, and the drift-diffusion model ties the two together. Attention selects which information gets processed, with costs visible in search, cueing and the surprising things people fail to notice.`,
      items: [
        { num: '8.1', kind: 'Method', name: 'Donders’ subtractive method', deps: [], refs: [],
          pic: 'Run simple, go/no-go and choice reaction-time tasks yourself; the differences between your mean times estimate the durations of discrimination and response selection.' },
        { num: '8.2', kind: 'Law', name: 'Hick–Hyman law', deps: ['psych-8.1', 'info-1.2'], refs: [],
          pic: 'Respond to one of N lit keys with N from 1 to 8 and with unequal probabilities; your mean RT plotted against the stimulus entropy in bits falls on a straight line.' },
        { num: '8.3', kind: 'Law', name: 'Fitts’s law', deps: ['info-5.2'], refs: [],
          pic: 'Click back and forth between targets whose width and distance you set; movement time against the index of difficulty log₂(2D/W) is linear, and its inverse slope is your throughput in bits per second.' },
        { num: '8.4', kind: 'Phenomenon', name: 'The speed–accuracy tradeoff', deps: ['psych-8.1'], refs: [],
          pic: 'Respond under instructions that stress speed or accuracy; your points across conditions trace an operating curve of errors against reaction time.' },
        { num: '8.5', kind: 'Model', name: 'Drift-diffusion model of two-choice decisions', deps: ['psych-8.4', 'psych-2.1', 'pde-1.4'], refs: [],
          pic: 'Noisy evidence paths wander toward an upper or lower bound; drift, boundary separation and noise sliders change the simulated RT histograms and error rates, and moving the boundaries reproduces the speed–accuracy tradeoff.' },
        { num: '8.6', kind: 'Phenomenon', name: 'Reaction-time distributions are right-skewed', deps: ['psych-8.5'], refs: [],
          pic: 'Your own RT histogram from a simple task is overlaid with fitted ex-Gaussian and diffusion first-passage densities; both catch the long right tail that a normal curve misses.' },
        { num: '8.7', kind: 'Phenomenon', name: 'The Stroop effect', deps: ['psych-8.1'], refs: [],
          pic: 'Name the ink colour of colour words: congruent, neutral and incongruent trials are timed, and your interference cost in milliseconds is reported with its confidence interval.' },
        { num: '8.8', kind: 'Phenomenon', name: 'Spatial cueing (Posner paradigm)', deps: ['psych-8.1'], refs: ['Goldstein ch. 6'],
          pic: 'An arrow cue points left or right before a target; valid cues speed detection and invalid cues slow it, and changing cue validity from 50% to 80% changes the benefit and cost.' },
        { num: '8.9', kind: 'Model', name: 'Feature integration theory and visual search', deps: ['psych-8.1'], refs: ['Goldstein ch. 6'],
          pic: 'Find a red X among green X’s (pop-out) or among red O’s and green X’s (conjunction); RT against set size is flat for one and rises linearly for the other.' },
        { num: '8.10', kind: 'Phenomenon', name: 'Change blindness', deps: ['psych-8.9'], refs: ['Goldstein ch. 6'],
          pic: 'Two versions of a photograph alternate with a brief blank between them; a large object changes and the timer counts how many cycles you need — remove the blank and you see it at once.' },
        { num: '8.11', kind: 'Phenomenon', name: 'Inattentional blindness', deps: ['psych-8.9'], refs: ['Goldstein ch. 6'],
          pic: 'Count passes between moving shapes; an unexpected object crosses the display, and afterwards you are asked whether you noticed it, with results compared to the original gorilla study.' },
        { num: '8.12', kind: 'Phenomenon', name: 'The attentional blink', deps: ['psych-8.1'], refs: ['Goldstein ch. 6'],
          pic: 'Report two letters in a rapid stream of digits; accuracy for the second dips when it follows the first by 200–500 ms, and the lag curve is drawn from your trials.' },
        { num: '8.13', kind: 'Phenomenon', name: 'Mental rotation (Shepard–Metzler)', deps: ['psych-8.1'], refs: [],
          pic: 'Decide whether two block figures are the same or mirror images; your RT rises linearly with the rotation angle between them, and the slope estimates your rotation speed in degrees per second.' },
        { num: '8.14', kind: 'Law', name: 'The power law of practice', deps: ['psych-8.1'], refs: [],
          pic: 'Repeat a typing task fifty times; log RT against log trial number is fitted by a power law and by an exponential, and the page reports which fits your own data better.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Memory',
      summary: String.raw`Memory is not one store: a brief sensory trace, a small working memory of a few chunks, and a long-term store with very different rules. Forgetting is fast at first and slow later, and how material is studied matters enormously — spacing practice out and testing yourself beat massed rereading. Memory is also reconstructive, so it can be confidently wrong.`,
      items: [
        { num: '9.1', kind: 'Model', name: 'Multi-store model (Atkinson–Shiffrin)', deps: [], refs: [],
          pic: 'Items flow from a sensory buffer into a short-term store and, with rehearsal, into long-term memory; rehearsal and distraction sliders change what survives a simulated list.' },
        { num: '9.2', kind: 'Phenomenon', name: 'Iconic memory: Sperling’s partial report', deps: ['psych-9.1'], refs: [],
          pic: 'A 3×4 letter array flashes, then a tone cues one row; your partial-report score implies most letters were briefly available, and delaying the cue shows the trace decaying within a second.' },
        { num: '9.3', kind: 'Phenomenon', name: 'Memory span: Miller’s 7 ± 2 and chunking', deps: ['psych-9.1'], refs: [],
          pic: 'A digit-span test that lengthens until you fail; then the same digits grouped into familiar chunks (dates, area codes) let you go further, and your spans are compared.' },
        { num: '9.4', kind: 'Phenomenon', name: 'Working memory holds about four chunks (Cowan)', deps: ['psych-9.3'], refs: [],
          pic: 'A change-detection task with coloured squares: accuracy across set sizes is converted to Cowan’s K, which plateaus near three or four items.' },
        { num: '9.5', kind: 'Model', name: 'Baddeley–Hitch working-memory model', deps: ['psych-9.1'], refs: [],
          pic: 'Remember letters while saying “the the the” or tapping a pattern; articulatory suppression hurts verbal span but not spatial span, separating the phonological loop from the sketchpad.' },
        { num: '9.6', kind: 'Phenomenon', name: 'Sternberg memory scanning', deps: ['psych-9.5', 'psych-8.1'], refs: [],
          pic: 'Hold 1–6 digits, then judge whether a probe was among them; RT rises linearly with set size with the same slope for yes and no answers, the signature of exhaustive serial search.' },
        { num: '9.7', kind: 'Phenomenon', name: 'The serial position curve', deps: ['psych-9.1'], refs: [],
          pic: 'Free-recall a list of fifteen words; your recall by position shows primacy and recency, and adding a 30-second distraction task erases recency but not primacy.' },
        { num: '9.8', kind: 'Law', name: 'Ebbinghaus forgetting curve and savings', deps: [], refs: [],
          pic: 'Learn nonsense syllables, then relearn them after delays you choose; savings scores plotted against delay fall steeply then level off, overlaid on Ebbinghaus’s 1885 data.' },
        { num: '9.9', kind: 'Law', name: 'Forgetting follows a power law (Jost’s law)', deps: ['psych-9.8'], refs: [],
          pic: 'Fit exponential and power functions to retention data on log axes; the power law straightens the curve, and two memories of equal strength but different age decay at different rates.' },
        { num: '9.10', kind: 'Phenomenon', name: 'The spacing effect', deps: ['psych-9.8'], refs: [],
          pic: 'Study the same vocabulary massed or spaced across a simulated week; retention at the final test is higher for spacing, and the optimal gap grows with the retention interval.' },
        { num: '9.11', kind: 'Phenomenon', name: 'The testing effect (retrieval practice)', deps: ['psych-9.10'], refs: [],
          pic: 'Restudy versus self-test conditions: restudying wins on a five-minute test but testing wins after a week, a crossover the plot makes visible.' },
        { num: '9.12', kind: 'Method', name: 'Spaced-repetition scheduling', deps: ['psych-9.10', 'psych-9.9'], refs: [],
          pic: 'A Leitner-box simulator: cards climb boxes when answered correctly and are reviewed at expanding intervals, and the predicted retention curve is compared with a fixed schedule at equal study time.' },
        { num: '9.13', kind: 'Phenomenon', name: 'Levels of processing', deps: ['psych-9.1'], refs: [],
          pic: 'Judge words by font case, rhyme or meaning, then take a surprise memory test; recall rises with depth of processing, plotted from your own answers.' },
        { num: '9.14', kind: 'Phenomenon', name: 'False memories: the DRM paradigm', deps: ['psych-9.1'], refs: [],
          pic: 'Study a list of words associated with “sleep” (bed, rest, tired…) that never includes it; the recognition test reveals how often you confidently “remember” the missing word.' },
        { num: '9.15', kind: 'Phenomenon', name: 'The misinformation effect (Loftus)', deps: ['psych-9.14'], refs: [],
          pic: 'Watch a short animated car crash, then answer a question using “smashed” or “hit”; speed estimates and later reports of broken glass shift with the verb.' },
        { num: '9.16', kind: 'Phenomenon', name: 'Context-dependent memory and its replication', deps: ['psych-9.1'], refs: [],
          pic: 'The divers’ land/water design laid out as a 2×2 of learning and test contexts, with the 1975 effect and the smaller 2021 replication estimate drawn side by side with intervals.' },
        { num: '9.17', kind: 'Paper', name: 'Über das Gedächtnis',
          paper: { authors: 'Hermann Ebbinghaus', year: 1885, title: 'Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie', venue: 'Leipzig: Duncker & Humblot', url: 'https://archive.org/details/berdasgedcht00ebbi' },
          introduces: ['psych-9.8', 'psych-9.10'], deps: [], refs: [],
          pic: 'Ebbinghaus’s savings table: relearning lists of nonsense syllables saved 58.2% of the original work after 20 minutes, 44.2% after 1 hour, 35.8% after 8.8 hours, 33.7% after 1 day, 27.8% after 2 days, 25.4% after 6 days and 21.1% after 31 days; plot the points on linear and logarithmic time, fit his formula b = 100k/((log t)^c + k) with k = 1.84 and c = 1.25 or a power law, then learn a list yourself and add your own savings.' },
        { num: '9.18', kind: 'Paper', name: 'The Magical Number Seven, Plus or Minus Two',
          paper: { authors: 'George A. Miller', year: 1956, title: 'The Magical Number Seven, Plus or Minus Two: Some Limits on Our Capacity for Processing Information', venue: 'Psychological Review 63 (2): 81–97', doi: '10.1037/h0043158' },
          introduces: ['psych-9.3'], deps: ['info-1.2', 'psych-1.2'], refs: [],
          pic: 'Absolute judgment as a channel: sort tones of 2 to 14 pitches into categories and plot the information transmitted against the information in the stimulus, which levels off near 2.5 bits (about six categories) as in the experiments Miller reviews; then recall strings of binary digits raw or recoded into octal chunks and watch the span grow when each chunk carries more bits.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Learning and conditioning',
      summary: String.raw`Animals learn which events predict which, and which actions pay. Classical conditioning is driven not by mere pairing but by surprise — blocking shows that a fully predicted outcome teaches nothing — and the Rescorla–Wagner rule turns that idea into a one-line update that later became temporal-difference learning. Operant conditioning adds choice: schedules of reinforcement shape the pattern of responding, and animals allocate effort roughly in proportion to reward.`,
      items: [
        { num: '10.1', kind: 'Phenomenon', name: 'Classical conditioning (Pavlov)', deps: [], refs: [],
          pic: 'A tone precedes food on most trials; the simulated dog’s conditioned salivation grows trial by trial, and changing the tone–food interval shows that close timing matters.' },
        { num: '10.2', kind: 'Phenomenon', name: 'Acquisition, extinction and spontaneous recovery', deps: ['psych-10.1'], refs: [],
          pic: 'Run acquisition, then tone-alone extinction, then a rest: the response curve rises, falls to zero and partly returns after the break, showing extinction is not erasure.' },
        { num: '10.3', kind: 'Phenomenon', name: 'Stimulus generalization gradients', deps: ['psych-10.1'], refs: [],
          pic: 'Train on a 1000 Hz tone and test at other frequencies; the response gradient peaks at the training tone, and discrimination training against a second tone shifts its peak away (peak shift).' },
        { num: '10.4', kind: 'Phenomenon', name: 'Blocking (Kamin)', deps: ['psych-10.1'], refs: [],
          pic: 'Pretrain a light with shock, then pair light + tone with shock; on test the tone produces almost no fear, compared side by side with a control group that skipped pretraining.' },
        { num: '10.5', kind: 'Model', name: 'Rescorla–Wagner model', deps: ['psych-10.4', 'psych-10.2'], refs: [],
          pic: 'Associative strengths update by ΔV = αβ(λ − ΣV) on each trial; design your own trial sequence and watch the learning curves for every cue, with the prediction error drawn as a bar.' },
        { num: '10.6', kind: 'Theorem', name: 'Rescorla–Wagner explains blocking and overexpectation', deps: ['psych-10.5'], refs: [],
          pic: 'Three canned designs run through the same update rule: the blocked cue stays near zero, two separately trained cues lose strength when combined, and a cue paired with omission goes negative.' },
        { num: '10.7', kind: 'Phenomenon', name: 'Latent inhibition: a failure of Rescorla–Wagner', deps: ['psych-10.5'], refs: [],
          pic: 'Pre-expose a tone alone before conditioning; real animals then learn more slowly, but the Rescorla–Wagner simulation shows no difference, motivating attention-based models.' },
        { num: '10.8', kind: 'Phenomenon', name: 'Taste aversion and preparedness (Garcia)', deps: ['psych-10.1'], refs: [],
          pic: 'A 2×2 of cues (taste or light-and-sound) and outcomes (illness or shock): rats learn taste→illness and light→shock readily but not the crossed pairings, even with hours of delay for taste.' },
        { num: '10.9', kind: 'Law', name: 'Thorndike’s law of effect', deps: [], refs: [],
          pic: 'A simulated cat in a puzzle box tries actions at random; the rewarded action’s probability grows and escape times fall along a jagged learning curve.' },
        { num: '10.10', kind: 'Concept', name: 'Operant conditioning: reinforcement and punishment', deps: ['psych-10.9'], refs: [],
          pic: 'A 2×2 grid of adding or removing a pleasant or unpleasant stimulus; pick a cell and watch a simulated lever-pressing rate rise or fall accordingly.' },
        { num: '10.11', kind: 'Concept', name: 'Schedules of reinforcement', deps: ['psych-10.10'], refs: [],
          pic: 'Choose fixed-ratio, variable-ratio, fixed-interval or variable-interval rules; a simulated pigeon’s cumulative record shows the post-reinforcement pauses, steady high rates and FI scallops of each.' },
        { num: '10.12', kind: 'Phenomenon', name: 'Partial reinforcement extinction effect', deps: ['psych-10.11', 'psych-10.2'], refs: [],
          pic: 'Train two groups on continuous or 50% reinforcement, then stop rewards; the partially reinforced group keeps responding far longer, plotted as two extinction curves.' },
        { num: '10.13', kind: 'Law', name: 'Herrnstein’s matching law', deps: ['psych-10.11'], refs: [],
          pic: 'Two keys on concurrent variable-interval schedules with rates you set; the simulated animal’s response share tracks its reinforcement share along the diagonal, with undermatching visible as a flattened slope.' },
        { num: '10.14', kind: 'Model', name: 'Temporal-difference learning and dopamine prediction errors', deps: ['psych-10.5'], refs: [],
          pic: 'A cue precedes reward by a fixed delay; across trials the TD error moves from the reward to the cue and dips when reward is omitted, matching Schultz’s recordings drawn beside it.' },
        { num: '10.15', kind: 'Phenomenon', name: 'Learned helplessness, revisited', deps: ['psych-10.10'], refs: [],
          pic: 'Yoked groups receive escapable or inescapable shocks, then a new escape task; the inescapable group fails to escape, and a note shows how later neuroscience reversed the original interpretation.' },
        { num: '10.16', kind: 'Paper', name: 'Animal Intelligence',
          paper: { authors: 'Edward L. Thorndike', year: 1898, title: 'Animal Intelligence: An Experimental Study of the Associative Processes in Animals', venue: 'Psychological Review: Monograph Supplements 2 (4): i–109', doi: '10.1037/h0092987' },
          introduces: ['psych-10.9'], deps: [], refs: [],
          pic: 'A cat in a puzzle box: plot its escape time trial by trial as in Thorndike’s curves, falling irregularly from minutes to a few seconds with no sudden insight; set how much each success stamps in the successful response and how much it stamps out the others, and compare the simulated learning curves with his.' },
        { num: '10.17', kind: 'Paper', name: 'Conditioned Reflexes',
          paper: { authors: 'I. P. Pavlov', year: 1927, title: 'Conditioned Reflexes: An Investigation of the Physiological Activity of the Cerebral Cortex', venue: 'Oxford University Press (trans. G. V. Anrep)', url: 'https://archive.org/details/conditioned-reflexes-an-investigation-of-the-physiological-activity-of-the-cerebral-cortex' },
          introduces: ['psych-10.1', 'psych-10.2', 'psych-10.3'], deps: [], refs: [],
          pic: 'A dog, a metronome and food: pair the sound with food and watch the drops of saliva to the sound alone climb, then present it repeatedly without food and watch secretion fall away (experimental extinction), rest the dog for a couple of hours and see it partly return; vary the test tone to trace the generalization gradient around the trained one.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 11
    {
      n: 11,
      title: 'Arousal, emotion and the social mind',
      summary: String.raw`Some of psychology’s most famous claims concern arousal, emotion and social influence, and they have fared unevenly. The inverted-U of arousal and performance rests on thin evidence, the facial feedback effect shrank under large replications, and the bystander effect looks different in real CCTV footage — while mere exposure, cognitive dissonance and obedience to authority have held up better. Each item shows the original design together with what later work found.`,
      items: [
        { num: '11.1', kind: 'Hypothesis', name: 'Yerkes–Dodson law and the inverted U', deps: [], refs: [],
          pic: 'Performance against arousal for easy and hard tasks under the textbook inverted-U, overlaid on the actual 1908 mouse data (shock strength vs discrimination learning); a toggle shows how little of the curve the data pin down.' },
        { num: '11.2', kind: 'Model', name: 'Theories of emotion: James–Lange, Cannon–Bard, two-factor', deps: [], refs: [],
          pic: 'Flow diagrams for the three theories from stimulus to bodily arousal and felt emotion; feed in a scenario and see what each predicts if bodily feedback is blocked or arousal is misattributed.' },
        { num: '11.3', kind: 'Hypothesis', name: 'The facial-feedback hypothesis', deps: ['psych-11.2'], refs: [],
          pic: 'A forest plot of the 1988 pen-in-mouth study, the 2016 seventeen-lab replication and the 2022 Many Smiles study; drag a “true effect” line and see which estimates it is compatible with.' },
        { num: '11.4', kind: 'Phenomenon', name: 'The mere-exposure effect', deps: [], refs: [],
          pic: 'Rate unfamiliar characters after seeing some of them 0, 1, 5 or 25 times; your liking ratings rise with exposure count, plotted against Zajonc’s curve.' },
        { num: '11.5', kind: 'Phenomenon', name: 'Cognitive dissonance: the $1/$20 experiment', deps: [], refs: [],
          pic: 'Participants paid $1 or $20 to call a dull task fun later rate it; the bar chart shows the $1 group rating it higher, with the dissonance and self-perception accounts side by side.' },
        { num: '11.6', kind: 'Phenomenon', name: 'The fundamental attribution error', deps: [], refs: [],
          pic: 'Read an essay the writer was assigned to write; estimate their true attitude and see how far your estimate moves toward the essay even when you are told they had no choice.' },
        { num: '11.7', kind: 'Phenomenon', name: 'The bystander effect and real-world intervention', deps: [], refs: [],
          pic: 'Probability that a given bystander helps versus that anyone helps, as group size grows: individual helping drops but collective helping can rise, matching the CCTV study of real conflicts.' },
        { num: '11.8', kind: 'Phenomenon', name: 'Obedience to authority (Milgram)', deps: [], refs: [],
          pic: 'Bars for the proportion going to 450 V across Milgram’s variations (experimenter absent, peer rebels, victim in the room), with modern partial replications drawn in.' },
        { num: '11.9', kind: 'Phenomenon', name: 'Social facilitation and inhibition', deps: ['psych-11.1'], refs: [],
          pic: 'Simulated performers on easy and hard tasks, alone or watched; an audience speeds the easy task and slows the hard one, the pattern Zajonc explained with drive.' },
        { num: '11.10', kind: 'Phenomenon', name: 'The Dunning–Kruger effect and the regression artifact', deps: ['stat-12.9'], refs: [],
          pic: 'Generate random self-assessments with no metacognitive bias at all; binning by actual score still reproduces the famous crossing curves, while a noise slider shows how much of the pattern is regression.' },
        { num: '11.11', kind: 'Paper', name: 'Cognitive Consequences of Forced Compliance',
          paper: { authors: 'Leon Festinger and James M. Carlsmith', year: 1959, title: 'Cognitive Consequences of Forced Compliance', venue: 'Journal of Abnormal and Social Psychology 58 (2): 203–210', doi: '10.1037/h0041593' },
          introduces: ['psych-11.5'], deps: [], refs: [],
          pic: 'After an hour of turning pegs, subjects were paid $1 or $20 to tell the next subject the task was fun: rated enjoyment came out −0.45 for controls, +1.35 for the $1 group and −0.05 for the $20 group; set the payment and compare the dissonance prediction (less justification, more attitude change) and a reinforcement prediction with the paper’s bars.' },
        { num: '11.12', kind: 'Paper', name: 'Behavioral Study of Obedience',
          paper: { authors: 'Stanley Milgram', year: 1963, title: 'Behavioral Study of Obedience', venue: 'Journal of Abnormal and Social Psychology 67 (4): 371–378', doi: '10.1037/h0040525' },
          introduces: ['psych-11.8'], deps: [], refs: [],
          pic: 'The shock generator’s 30 switches from 15 to 450 volts, with Milgram’s 40 subjects drawn as a survival curve of who was still obeying at each level: no one stopped before 300 volts, 5 stopped there, 4 at 315, 2 at 330, one each at 345, 360 and 375, and 26 went to the end, set beside the 1.2% that Yale psychology students had predicted would.' },
        { num: '11.13', kind: 'Paper', name: 'Bystander Intervention in Emergencies',
          paper: { authors: 'John M. Darley and Bibb Latané', year: 1968, title: 'Bystander Intervention in Emergencies: Diffusion of Responsibility', venue: 'Journal of Personality and Social Psychology 8 (4, Pt. 1): 377–383', doi: '10.1037/h0025589' },
          introduces: ['psych-11.7'], deps: [], refs: [],
          pic: 'A subject hears another student have a seizure over an intercom, believing that no one, one other person or four others can also hear: 85%, 62% and 31% reported it before the fit ended, after mean delays of 52, 93 and 166 seconds; add bystanders and compare a diffusion-of-responsibility model, in which each listener feels a share of the duty, with those bars and delays.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 12
    {
      n: 12,
      title: 'Measurement and the replication crisis',
      summary: String.raw`Psychological measurement is noisy, and how reliable a test is limits what it can correlate with. Small samples, flexible analyses and journals that favour significant results combine to make many published effects too large or simply false — a prediction that the large replication projects of the 2010s largely confirmed. The remedies are statistical: power analysis, preregistration, meta-analysis that corrects for bias.`,
      items: [
        { num: '12.1', kind: 'Concept', name: 'Reliability and validity', deps: [], refs: [],
          pic: 'Targets for four tests: tight-and-centred, tight-but-off, scattered-but-centred, scattered-and-off; simulated test–retest scatterplots give each a reliability number.' },
        { num: '12.2', kind: 'Theorem', name: 'Spearman–Brown prophecy formula', deps: ['psych-12.1'], refs: [],
          pic: 'Lengthen a test from 5 to 50 items: reliability climbs along the Spearman–Brown curve, and a simulation of parallel items confirms each predicted point.' },
        { num: '12.3', kind: 'Theorem', name: 'Attenuation of correlations by unreliability', deps: ['psych-12.1'], refs: [],
          pic: 'Two latent traits correlated at 0.6 are measured with adjustable reliability; the observed correlation shrinks by √(r_xx r_yy), and the disattenuation formula recovers the true value.' },
        { num: '12.4', kind: 'Model', name: 'Spearman’s g and the one-factor model', deps: ['psych-12.1'], refs: [],
          pic: 'A correlation matrix of six tests shown as a heat map; extract one factor and see the positive manifold reproduced, with residual correlations shown as what g leaves out.' },
        { num: '12.5', kind: 'Phenomenon', name: 'The Flynn effect', deps: ['psych-12.4'], refs: [],
          pic: 'IQ norms over the twentieth century: raw scores rise about three points per decade, so renorming is needed; recent reversals in some countries are drawn as well.' },
        { num: '12.6', kind: 'Definition', name: 'Effect size (Cohen’s d)', deps: ['psych-2.3'], refs: [],
          pic: 'Two overlapping distributions with a d slider; overlap, probability of superiority and the share of the treated group above the control mean are shown live.' },
        { num: '12.7', kind: 'Concept', name: 'Statistical power in psychology', deps: ['psych-12.6', 'stat-6.17'], refs: [],
          pic: 'Pick d and sample size and run a thousand simulated studies; the fraction reaching p < .05 is the power, which for typical d = 0.4 and n = 20 per group is well under half.' },
        { num: '12.8', kind: 'Phenomenon', name: 'Publication bias and inflated effects', deps: ['psych-12.7', 'stat-7.6'], refs: [],
          pic: 'Only significant studies get “published”: their average effect size is far above the true d, and the inflation grows as power falls.' },
        { num: '12.9', kind: 'Phenomenon', name: 'p-hacking and researcher degrees of freedom', deps: ['stat-7.5', 'stat-7.4'], refs: [],
          pic: 'With no true effect, let yourself try extra outcomes, drop outliers and peek at the data; the false-positive rate climbs from 5% to well over 30%, counted over simulated studies.' },
        { num: '12.10', kind: 'Theorem', name: 'Why most published findings can be false (Ioannidis)', deps: ['psych-12.7', 'stat-7.3', 'stat-10.1'], refs: [],
          pic: 'Set the prior share of true hypotheses, power and α; a grid of studies coloured by truth and significance shows the positive predictive value of a significant result falling below one half.' },
        { num: '12.11', kind: 'Event', name: 'The Reproducibility Project: Psychology (2015)', deps: ['psych-12.10'], refs: [],
          pic: 'A scatter of original versus replication effect sizes for the 100 studies: most points fall below the diagonal, roughly a third replicated significantly, and you can colour by field.' },
        { num: '12.12', kind: 'Phenomenon', name: 'Shrinking effects: ego depletion and power posing', deps: ['psych-12.11'], refs: [],
          pic: 'Cumulative meta-analytic estimates over time for two famous effects, with the large preregistered replications added at the end, show the estimates collapsing toward zero.' },
        { num: '12.13', kind: 'Method', name: 'Meta-analysis and funnel plots', deps: ['psych-12.8'], refs: [],
          pic: 'Simulate a literature with and without publication bias; the funnel plot of effect against standard error becomes lopsided, and a trim-and-fill correction is drawn.' },
        { num: '12.14', kind: 'Method', name: 'Preregistration and registered reports', deps: ['psych-12.9'], refs: [],
          pic: 'The same simulated literature under ordinary and registered-report publishing: the share of significant results drops from over 90% to a realistic level, as in the 2021 comparison.' },
        { num: '12.15', kind: 'Phenomenon', name: 'Regression to the mean in praise and punishment', deps: ['stat-12.9'], refs: [],
          pic: 'Simulated pilots with fixed skill and random landings: after praise for a good landing the next one tends to be worse, after criticism better, though feedback has no effect at all in the model.' },
        { num: '12.16', kind: 'Paper', name: 'Estimating the Reproducibility of Psychological Science',
          paper: { authors: 'Open Science Collaboration', year: 2015, title: 'Estimating the Reproducibility of Psychological Science', venue: 'Science 349 (6251): aac4716', doi: '10.1126/science.aac4716' },
          introduces: ['psych-12.11'], deps: ['psych-12.8', 'psych-12.10'], refs: [],
          pic: 'The 100 replications as a scatter of original against replication effect size: 97% of the originals were statistically significant but only 36% of the replications, and the mean effect fell from r ≈ 0.40 to 0.20; filter by journal, by field (social or cognitive) or by the original p-value and watch the replication rate change, beside a publication-bias simulation that produces the same shrinkage.' },
      ],
    },
  ],
};
