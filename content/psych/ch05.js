import { univarianceWidget, metamerWidget, discriminationWidget, cancellationWidget, uniqueHueWidget } from './ch05.viz.shared.js';

const cones = 'https://doi.org/10.25039/CIE.DS.tijidesg';
const stockman = 'https://doi.org/10.1002/col.22879';
export default {
  collection: 'psych', chapter: 5, title: 'Colour vision',
  summary: String.raw`One receptor output cannot separately identify spectral composition and intensity. Comparing cone classes removes some ambiguities, but physically different spectra can still produce the same cone signals. Perceptual hue judgments, adaptation and colour constancy require further evidence: a convenient linear recoding alone does not determine appearance. The chapter keeps exact finite cone-response calculations, subjective tasks and published observations distinct.`,
  items: [
    {
      num: '5.1', kind: 'Principle', name: 'The principle of univariance',
      statement: String.raw`For a photoreceptor in a fixed state, its output depends on absorbed photons rather than carrying a separate label for each photon's wavelength. Different spectra can therefore give the same receptor output. In a linear catch model, a monochromatic light of energy $E$ at wavelength $\lambda$ gives $q=E s(\lambda)$, where $s$ is that receptor class's energy sensitivity. At positive sensitivities, changing wavelength can be compensated by changing energy.

Equal catch is an ambiguity for that receptor signal; it is not a claim that every downstream response is linear or that two lights must look identical to a complete observer.`,
      idea: String.raw`For two wavelengths, solve $E_2=E_1 s(\lambda_1)/s(\lambda_2)$. The selected cone response then agrees exactly. Another cone class distinguishes the pair only when its sensitivity ratio differs. At zero intensity all these responses agree, and equal wavelengths cannot be distinguished by adding another cone class. Adaptation, noise and temporal history are held fixed.`,
      caption: String.raw`Choose two tabulated wavelengths, the cone class to match and the reference energy. The comparison energy is solved rather than guessed. Inspect the three actual source sensitivities and both sets of cone responses; a single matched class need not match the others.`,
      deps: ['psych-4.1'], refs: ['Stockman & Rider (2023), Introduction and §1.1 glossary: univariance and cone fundamentals', 'CIE170-1:2006 Table 6.7,2° energy-based LMS data; exact finite monochromatic model'],
      links: { source: stockman, data: cones }, tags: ['cones', 'univariance'],
      scope: String.raw`CIE 2006 standard 2° energy fundamentals, source samples 390–615 nm at 5 nm steps where all three columns are present. These are relative energy sensitivities, not photon-count units or an individual observer. Exact equalities refer to the rounded decimal source matrix. Ideal monochromatic inputs, fixed receptor state and a linear catch calculation are declared assumptions. No spectral light is reproduced by a screen colour.`,
      viz: univarianceWidget,
    },
    {
      num: '5.2', kind: 'Theorem', name: 'Metamers form the null space of the cone responses',
      statement: String.raw`More precisely, **differences between matching spectra lie in a null space**. Let $A:\mathbb R^n\to\mathbb R^3$ be a fixed linear cone-response map and let $p$ be an admissible primary-power vector. Then $Aq=Ap$ exactly when $q-p\in\ker A$.

Thus the full algebraic response fibre is the affine set $p+\ker A$. Physical matches in a declared power cube are $(p+\ker A)\cap[0,1]^n$. Neither this intersection nor the matching spectra themselves are generally vector subspaces.`,
      idea: String.raw`Linearity gives $Aq-Ap=A(q-p)$, and LADR 3.11 defines the null space by this zero equation. For $n=4$, row reduction leaves at least one free coordinate. Choose a null direction $d$ and impose each bound $0\le p_j+t d_j\le 1$; intersecting these intervals gives every allowed parameter on that line. Repeated primary wavelengths can lower the rank and create additional independent null directions.

An interior vector permits a sufficiently small displacement in either direction. At the black boundary, a matrix whose entries are strictly positive maps every nonzero nonnegative vector to a positive response, so its physical zero-response fibre contains only zero. Nonzero algebraic nullity does not guarantee two physical matches at every boundary point. ART 4.3 gives the corresponding fixed-observer spectral setting; this widget proves finite identities without approximating its continuum kernel.`,
      caption: String.raw`Move along an exact null direction of the four-primary source matrix. Compare reference and edited powers and their cone responses. Switch to repeated wavelengths to change rank, or to black to see the physical interval collapse while algebraic null directions remain.`,
      deps: ['psych-5.1', 'art-4.3', 'ladr-3.11'], refs: ['CIE170-1:2006 Table 6.7, declared finite source matrix', 'Stockman & Rider (2023), §1.1 metamers and cone fundamentals; self-contained finite linear-algebra proof'],
      links: { data: cones, source: stockman }, tags: ['metamers', 'null space'],
      scope: String.raw`Four ideal spectral primaries within the complete 390–615 nm source table; each primary power is constrained to 0–1. Exact rational row reduction uses published decimal entries, including genuine rank deficiencies. Repeated wavelengths are independently controlled copies of the same primary. This finite cube is not the set of every realizable continuous spectrum. Cone-response equality alone is not a universal claim about appearance across observers, illuminants or viewing contexts.`,
      viz: metamerWidget,
    },
    {
      num: '5.3', kind: 'Phenomenon', name: 'Wavelength discrimination function',
      statement: String.raw`The wavelength difference required for a discrimination judgment depends on the reference wavelength and experimental conditions. It is not a universal curve determined simply by cone-sensitivity crossings. Regan and Tyler compared spatially divided fields with temporally modulated lights and found different discrimination functions, including changes with modulation frequency.

The visualization instead computes a declared local information model, keeping that calculation separate from the measured phenomenon.`,
      idea: String.raw`Suppose the measured cone vector has mean $I s(\lambda)$ and independent Gaussian noise with fixed standard deviation $\sigma$. For an unknown intensity, a small wavelength change parallel to $s$ can be imitated by an intensity change. Use the orthogonal projection formula of LADR 6.55 to remove that direction from the derivative $s'$:
$$J=\frac{I^2}{\sigma^2}\left\|s'-\frac{s'\cdot s}{s\cdot s}s\right\|^2.$$
This is the squared change of the mean per unit wavelength after projecting out the intensity nuisance direction, in noise units. With one cone class the remaining direction is zero. With several classes, different sensitivity ratios can retain information. The inverse square root is a local model scale, not an experimentally determined just-noticeable difference.`,
      caption: String.raw`Choose the available cone classes, intensity and noise, then inspect the local information along the source samples. A single class carries no wavelength information when intensity is unknown in this model. The readout identifies the finite-difference stencil and calculated scale; no screen discrimination test is performed.`,
      deps: ['psych-5.1', 'ladr-6.55'], refs: ['Regan & Tyler (1971), Some dynamic features of colour vision, Methods and §3, pp.1308 and1317–1319', 'CIE2006 energy cone table; authored nuisance-intensity Gaussian measurement model'],
      links: { source: 'https://christophertyler.org/CWTyler/TylerPDFs/tyler_dynamic_color_1971.pdf', data: cones }, tags: ['discrimination', 'psychophysics'],
      scope: String.raw`The primary study used one principal subject and confirmed its main findings in one additional subject; its bipartite comparison used a 2° field, 25 trolands and no surround. No curve is digitized here. The model assumes independent equal additive Gaussian noise, intensity 0.1–2 and SD 0.001–0.1 in arbitrary units. Source 5 nm secants approximate derivatives, with one-sided stencils at endpoints. Adaptation, temporal filtering and criterion choice are absent, so the model is neither a fit nor a physiological or population threshold prediction.`,
      viz: discriminationWidget,
    },
    {
      num: '5.4', kind: 'Phenomenon', name: 'Hue cancellation (Hurvich–Jameson)', verify: true,
      statement: String.raw`Hue cancellation asks an observer to add a comparison light until a selected perceived hue component is absent. For example, an observer may adjust a hue-opponent comparison to remove the reddish component of a test. Repeating such subjective null judgments gives cancellation functions under the specified viewing conditions.

The sign convention of a cancellation function is chosen. Its shape is not, by itself, a unique identification of a neuron's cone weights.`,
      idea: String.raw`The historical method first establishes the observer's unique comparison hues; it does not assume that a fixed screen green is each observer's cancellation light. To illustrate the algebra separately, choose a signed linear combination $c$ of cone signals. A test signal $a$ plus nonnegative energy $t$ of an added signal $b$ has combination $c(a)+tc(b)$. If $c(b)\ne 0$, the algebraic null is $t=-c(a)/c(b)$ and is available by addition only if $t\ge 0$. A zero test already needs no added light; if both coefficients vanish, every nonnegative addition is also a model null. These statements concern the chosen combination, not subjective hue.`,
      caption: String.raw`Choose test and added wavelengths, a declared signed combination and its weight. Move added energy along the actual mixture path. A green point marks a nonnegative algebraic null only when it lies in range; the readout distinguishes an unavailable cancellation from a null outside the plot.`,
      deps: ['art-5.7'], refs: ['York University, Hue Cancellation Method, teaching exposition, observer-specific comparison hues and arbitrary sign', 'CIE2006 energy cone table; authored linear cancellation example; original Hurvich–Jameson body not checked'],
      links: { exposition: 'https://www.yorku.ca/eye/huecan.htm', data: cones }, tags: ['hue cancellation', 'opponency'],
      scope: String.raw`The method description is explicitly a university teaching exposition, not an original-paper body read. The 1950s original bodies remain unchecked. A distinct Hurvich–Jameson 1974 URL returned 404; neither work is claimed as a body read. Widget combinations L−wM and S−w(L+M)/2 are chosen, with weight 0.25–4 and displayed added energy 0–10. No calibrated cancellation light, observer null or empirical valence curve is fabricated.`,
      viz: cancellationWidget,
    },
    {
      num: '5.5', kind: 'Concept', name: 'Unique hues', verify: true,
      statement: String.raw`A unique yellow is judged neither reddish nor greenish; a unique blue is likewise judged neither reddish nor greenish. Unique red and unique green are judged neither bluish nor yellowish. These are appearance judgments, whose settings depend on the observer and viewing conditions. They should not be equated automatically with the axes of an arbitrary linear cone-opponent transform.`,
      idea: String.raw`The word “unique” specifies a null judgment in the other hue pair. It does not supply a universal wavelength or a population distribution. Webster and colleagues' abstract describes observer settings for equiluminant nonspectral stimuli and distinguishes these settings from the early cone-opponent axes. Our optional patch exercise illustrates how to ask the judgment, while making no claim to reproduce their stimulus plane or measurements. An sRGB hue angle is a display-code coordinate, not their cone-opponent angle.`,
      caption: String.raw`Choose a screen hue and the hue pair to consider, then optionally record “first hue”, “second hue” or “neither”. The wheel locates only the authored screen angle. There is no fabricated population histogram, standard answer or conversion of your report to a measured wavelength.`,
      deps: ['art-5.7'], refs: ['Webster, Miyahara, Malkoc & Raker (2000), Variations in normal color vision II: Unique hues, publisher metadata/abstract only', 'York University hue-cancellation exposition; authored uncalibrated judgment exercise'],
      links: { original: 'https://doi.org/10.1364/JOSAA.17.001545', exposition: 'https://www.yorku.ca/eye/huecan.htm' }, tags: ['unique hues', 'appearance'],
      scope: String.raw`Original author PDF timed out; the publisher marks the full article inaccessible. No body, numerical settings, population distribution or original figures are claimed. The display uses chosen sRGB code-value saturation and brightness, with no calibration, equiluminance or controlled adaptation. Optional reports are part of the local interactive state, not collected measurements or a personal colour-vision assessment.`,
      viz: uniqueHueWidget,
    },
  ],
};
