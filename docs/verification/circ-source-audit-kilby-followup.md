# Circuit Kilby original patent review

Ready **circ-4.16**, flag held for root integration. Only its chapter block and new helper/math/browser/report artifacts changed.

[Original US3,138,743 patent PDF](https://patentimages.storage.googleapis.com/30/d5/b4/ac7134ecd78946/US3138743.pdf), nine pages, all original descriptive text and25 claims read; Fig8 visually inspected. Cache `/tmp/atlas-circ-kilby-patent.pdf/.txt`, SHA256 `30e7fea683091da64c7df56a69b90056a5ed4f8c99f3045901182f5952b00cd6`. Filing February6,1959 and grant June23,1964 appear on the original. PDF p6/col4 gives bulk resistors and junction capacitors; p7/col5 gives deposited dielectric/metal capacitors, distributed RC networks and other elements; p7/col6 describes the fabrication sequence and BOTH bonded wires and deposited metal over insulation; p8/col7 and Fig8 identify its phase-shift oscillator example. The original's deposited-metal alternative was absent from the former historical account.

Corrected the implication that all materials must be semiconductor and that replacing bonded wires by deposited metal was absent from this patent. Removed unverified demonstration/Nobel/contextual history rather than using it as original evidence. The patent's single-body integration, isolation, shaping and compatible-processing content is now described directly. Its distributed RC layout is distinguished from the atlas's chosen equal-element lumped model.

The chosen model's nodal equations give determinant s³+5s²+6s+(1+A). For A>0, the cubic Routh condition is5×6>1+A, so the zero state is linearly stable for A<29 and unstable for A>29. At A=29 the polynomial factors as(s+5)(s²+6): linear marginality, not “below29 dies”. The frequency sqrt(6)/(2pi RC) is the linear threshold value. The tanh-limited finite waveform and its zero crossings do not establish a settled oscillation near threshold; the readout now states that distinction.

Removed the false one-bonded-wire-per-net count. A net can require several links, and the construction sketch does not determine a physical wiring count. Its15 depicted discrete terminal connections remain a count of that schematic, not historical measured savings. Corrected resistor-length and capacitor-area proportionality labels: the drawn dimensions are logarithmically compressed for legibility, not literal physical proportionality.

`node --test tests/verification-circ-source-audit-kilby.test.mjs`: **3 groups pass**: independent nodal determinant and exact marginal pair; independent finer midpoint integration versus the production RK4 trajectory at four gains, with bounds/final-time checks; RC scaling and dimensionless-trajectory invariance.

`node tests/verification-circ-source-audit-kilby.mjs`: **2 native light/dark groups pass**, each exercising32 actual resistance/capacitance/gain/construction combinations, including exactly A=29. Verified waveform samples, amplitude, finite-window status, construction-count language and finite plot values; no page/TeX errors. Personally inspected source `/tmp/atlas-circ-kilby-original-oscillator.png` and both final screenshots `/tmp/atlas-circ-kilby-original-patent-critical-oscillator-model-light.png`, `-dark.png`.

Original technical content is supported; the patent's legal scope/novelty, later priority disputes, exact original device accuracy and Wave5 readiness are not claimed verified by these tests.
