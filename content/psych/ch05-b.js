import { zoneWidget, aftereffectWidget, testsWidget, dressWidget } from './ch05.viz.shared.js';

export default {
  collection: 'psych', chapter: 5,
  items: [
    {
      num: '5.6', kind: 'Model', name: 'Zone model: cones feeding opponent channels',
      statement: String.raw`A zone account separates cone capture from subsequent comparisons of cone signals. A convenient declared linear recoding is
$$u=L+M,\quad v=L-M,$$
$$w=S-(L+M)/2.$$
These three coordinates retain the original three-dimensional signal: their inverse is $L=(u+v)/2$, $M=(u-v)/2$, $S=w+u/2$. The equations illustrate a processing stage; they are not fitted neural weights or a complete theory of perceptual unique hues.`,
      idea: String.raw`Subtraction can emphasize differences between broad cone sensitivities. Because this transform is invertible, two spectra agree in all three output coordinates exactly when their original cone vectors agree. Therefore recoding preserves the metamer equivalence from 5.2; it does not recover spectral information that cone capture lost. Setting one input cone coordinate to zero alters every combination containing it, and generally does not make an entire channel vanish. A genuine observer model also needs adaptation, noise and the physiological circuit.`,
      caption: String.raw`Move a source wavelength and energy through the cone inputs. Inspect the three recoded signals and their inverse reconstruction. Apply the explicit input-zero intervention to test which channels change; do not assume a channel disappears simply because one cone input is absent.`,
      deps: ['psych-5.2', 'art-5.7'], refs: ['ART 5.7, source-audited opponent-process account', 'CIE170-1:2006 Table 6.7; explicitly authored invertible transform'],
      links: { data: 'https://doi.org/10.25039/CIE.DS.tijidesg', background: 'https://doi.org/10.1002/col.22879' }, tags: ['opponency', 'linear models'],
      scope: String.raw`Unnormalized CIE 2006 energy-based relative cone signals from 390–615 nm. Chosen sum/difference weights are conventions, differing from normalized alternatives. The input-zero switch is an algebraic intervention, not a validated dichromat simulation or a neural lesion. Signed outputs are abstract coordinates, not firing rates or hue labels. Floating reconstruction error is reported separately from the exact inverse equations.`,
      viz: zoneWidget,
    },
    {
      num: '5.7', kind: 'Phenomenon', name: 'The McCollough effect', verify: true,
      statement: String.raw`After adaptation to a correlation between colour and grating orientation, an achromatic test grating can show an orientation-contingent colour aftereffect. Orthogonal test orientations can carry different apparent tints. This differs from describing adaptation only by one uniform cone-gain change.

In their own experiments, Vul, Krizay and MacLeod separated transient and persistent contributions within the tested intervals. Their use of “infinite” describes an integrator with no detected decay over those intervals, not an observation extending forever.`,
      idea: String.raw`A state tied to orientation can distinguish test gratings that stimulate similar cone classes. For an authored illustration, let two states build under a constant adapting input and decay after its removal. A component with time constant $\tau$ has amplitude $(1-e^{-T/\tau})e^{-t/\tau}$. Multiply their weighted sum by $-\cos(2\theta)$ to obtain opposite signs at orthogonal orientations and the same sign after 180°. This chosen tuning and finite pair of time constants demonstrate conditional memory; they are not a fit to the original or modern observations.`,
      caption: String.raw`Scrub the model adaptation time, recovery time and test orientation. Compare the two chosen components and their signed sum. All time is a parameter in the chart; there is no timed adapting sequence or instruction to view alternating gratings.`,
      deps: ['psych-5.6'], refs: ['Vul, Krizay & MacLeod (2008), The McCollough effect reflects permanent and transient adaptation in early visual cortex, General methods, Experiment 1 and Linear model', 'McCollough (1965), original bibliographic record only; original body inaccessible'],
      links: { study: 'https://www.evullab.org/pdf/VulKrizayMacleod-JoV-2008.pdf', doi: 'https://doi.org/10.1167/8.12.4', original: 'https://doi.org/10.1126/science.149.3688.1115' }, tags: ['adaptation', 'orientation'],
      scope: String.raw`The 1965 original URL failed TLS validation; it was not recovered through another route. The 2008 study is an independent primary experiment, whose calibrated gratings and nulling procedure are not reproduced. Its Experiment 1 had nine observers and approximately 40/160/320 s adaptation followed by 320 s recovery. Our two finite exponential time constants 30 s and 600 s, weight 0.35 and cosine tuning are chosen, not those data or the authors' persistent integrator. No duration, perceived tint or cortical location is inferred from the chart.`,
      viz: aftereffectWidget,
    },
    {
      num: '5.8', kind: 'Method', name: 'Colour-vision tests: Ishihara plates and the anomaloscope', verify: true,
      statement: String.raw`Pseudoisochromatic plate tests embed a shape in coloured dots; the visibility of its intended chromatic contrast is assessed under the test's prescribed conditions. An anomaloscope instead asks for a light match using an optical instrument. These are different tasks, and their interpretation depends on the actual test, lighting and protocol.

The illustrations here explain signal encoding and matching constraints. They are not clinical plates, an instrument simulation or a colour-vision test for the reader.`,
      idea: String.raw`The synthetic dot example places a numeral in one authored RGB component while varying another component across dots. Discarding the encoded component removes the numeral's signal by construction; this is not a projection for any named deficiency.

For a separate spectral analogue, mix 545 nm and 610 nm lights and compare them with 590 nm light. With one positive cone sensitivity, comparison brightness can always match the one retained response. With two independent responses, the ratio of their catches also constrains the mixture. The readout minimizes the squared mismatch over comparison brightness using LADR 6.55 to project the mixture vector onto the positive comparison vector, then reports the residual. ART 4.12 explains why removing a cone signal is different from removing a display primary.`,
      caption: String.raw`Switch between the authored dot code and the spectral analogue. In the first, retain or discard the encoded component. In the second, adjust mixture and comparison brightness, choose retained equations and inspect both current and best-brightness mismatches. No result is scored or assigned a deficiency label.`,
      deps: ['art-4.12', 'ladr-6.55'], refs: ['National Eye Institute, Testing for Color Vision Deficiency, colour-plate and anomaloscope descriptions', 'CIE2006 energy cone table; authored545/610/590nm constraint example', 'Manufacturer instrument manual body unavailable; literal instrument wavelengths/protocol not reproduced'],
      links: { overview: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/color-blindness/testing-color-vision-deficiency', data: 'https://doi.org/10.25039/CIE.DS.tijidesg' }, tags: ['colour tests', 'matching'],
      scope: String.raw`Official health-agency method descriptions are checked. The manufacturer's manual request timed out; original instrument-protocol verification remains flagged. The synthetic numeral 7 uses an authored RGB code and coordinate-based intensity jitter, not a licensed Ishihara plate or a calibrated confusion line. The separate wavelength set is deliberately within the complete 390–615 nm cone table and differs from a literal instrument Rayleigh match. Matching uses retained L/M model responses, mixture ticks 0–100% and comparison energy 0–3. Screen primaries do not reproduce these spectral lights or clinical matching ranges.`,
      viz: testsWidget,
    },
    // The existing 5.9 syllabus alias to ART 6.7 remains an alias, not a new item.
    {
      num: '5.10', kind: 'Phenomenon', name: '#TheDress: disagreement about the illuminant',
      statement: String.raw`Observers can describe the same dress photograph differently. Lafer-Sousa, Hermann and Conway's free-response sample of 1401 reported rounded proportions 57% blue/black, 30% white/gold, 11% blue/brown and 2% other. Colour matches also differed between reported categories; this was more than a forced choice between two supplied names.

Different assumptions about illumination are one proposed explanation. The study also changed scene cues; it does not establish that a single illuminant assumption uniquely determines every observer's percept.`,
      idea: String.raw`Observed spectral light depends on illumination and surface reflectance. Even the simple product $p_j=e_j\rho_j$ permits different positive factors: choosing another illuminant $e_j$ and setting $\rho_j=p_j/e_j$ preserves the observed light whenever the reflectance remains physically admissible. The cone map of 5.2 therefore also receives the same input. Additional scene information or assumptions are needed to choose factors.

This inverse ambiguity helps explain why illumination is relevant without deriving individual reports from a slider. The source discusses material and illumination priors, image size and blur; correlations with age or sex do not demonstrate a causal chronotype mechanism.`,
      caption: String.raw`Select one of the four published rounded aggregate categories. Separately change the assumed four-primary illuminant: the inferred reflectance changes while its product reconstructs the fixed observed spectrum. These model curves are not the source's perceptual categories or a recoloured original photograph.`,
      deps: ['psych-5.2'], see: ['psych-5.9', 'art-4.3'], refs: ['Lafer-Sousa, Hermann & Conway (2015), Striking individual differences in color perception uncovered by the dress photograph, complete main2pages and selected supplemental methods', 'Authored four-primary illumination/reflectance factorization'],
      links: { source: 'https://www1.wellesley.edu/sites/default/files/assets/departments/neuroscience/images/lafersousahermannconway_thedress_2015_withsupp-1.pdf', doi: 'https://doi.org/10.1016/j.cub.2015.04.053' }, tags: ['colour constancy', 'illumination'],
      scope: String.raw`Reported proportions are rounded aggregate percentages, not exact category counts or a representative population survey. Of 1401 free-response subjects, 313 were naïve; 53 were tested in the laboratory and 28 retested. The original photograph and individual colour-match data are not reproduced. The separate four-primary model uses fixed positive observed values 0.1–0.6 and bounded positive spectral tilts; all inferred reflectances remain below 1. This model has no calibrated colour rendering, observer prior fit or guaranteed perceived category. Future Von Kries content is a related syllabus alias, not a used proof input.`,
      viz: dressWidget,
    },
  ],
};
