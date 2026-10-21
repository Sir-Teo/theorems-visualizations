# Independent review — THERMO chapter 7

Status: **accepted** on the frozen final source. Scope: all 21 new items 7.1–7.21. No previous chapters or shared runtime were changed.

## Source and mathematical checks

Read the chapter statements, hypotheses, proof ideas, scopes, captions, models and local helpers; independently ran all 23 final focused math groups, which pass. Exact finite models, heuristic transport closures, supplied stochastic laws and continuum limit assertions are distinguished. Finite seeded samples are not offered as theorem proofs or experimental data.

Independently opened the actual official [Tong notes](https://www.damtp.cam.ac.uk/user/tong/kintheory/kintheory.pdf). Checked the dilute collision calculation, heuristic transport setting, incoming molecular-chaos closure, H-functional symmetrization and harmonic diffusion discussion. The chapter supplies the relative-speed correction rather than attributing it to the initial geometric mean-path estimate. Its global H statement includes boundary flux and integrability qualifications, and does not transfer continuum equilibrium classification to a restricted four-velocity network. The exact Gaussian and finite collision models are separately derived.

Independently inspected the actual MIT lecture 29 printed p.7 image, showing reduced mass m/2 and the sqrt(2) relative-speed/collision-frequency factor. The outgoing Maxwell flux weighting and mean energy 2kBT also follow independently from Gaussian moment integrals.

Independently inspected the Cowper translation of Einstein, printed pp.10–17, including the short-increment expansion, Gaussian law and one-coordinate displacement equation. The statement distinguishes that translation from a reading of the German original. Mechanical mobility and Stokes drag are declared with their overdamped, dilute and creeping-flow assumptions; synthetic paths are not historical measured trajectories.

Independently read the actual Boltzmann collected-work scan, especially printed p.335 Eq.17 and pp.342–345 Eq.24–25. This identified a source transcription correction: the original functional includes a minus particle-number term, which can be dropped only because that number is conserved. The author corrected the displayed expression and its citation. The energy-space sqrt(x) measure is retained, and mechanical reversibility is kept separate from the molecular-chaos closure.

Independently inspected Arovas printed p.170 Eq.5.246–251: conjugate entropy production, current parities and field reversal match the chapter. Independently opened the actual [Cao notes](https://ocw.mit.edu/courses/5-72-non-equilibrium-statistical-mechanics-spring-2012/20b4677409a8d05f23f1598c9929e899_MIT5_72S12_master2.pdf), printed pp.4 and7 Eq.2.11–2.17. The switch-off experiment fixes the response sign; the chapter does not impose the notes' smooth zero-lag derivative on a white-noise correlation cusp.

The reviewer's fresh Nyquist PDF request timed out; no alternate access loop was attempted. The author's successful original pp.110–113 reading is recorded separately. Independently derived the one-sided RC spectrum integral, exact sampled AR(1) target, special Nyquist-bin weight and omitted-DC Parseval identity.

The random-walk limit initially omitted the requirement that both spatial and time steps vanish. The final claim requires both limits and the fixed diffusion ratio, and asserts finite-dimensional convergence at any fixed finite collection of times. Independent block CLTs and an interpolation error at most a prove that claim; no unproved process-space tightness result is imported.

A tiny-temperature-difference state exposed an avoidable underflow in the heat-flux-derived conductivity quotient: multiplying the subnormal flux by plate spacing rounded to zero before division. The final local helper cancels the temperature difference analytically and labels the resulting conductivity as closure-implied. The exact zero-gradient quotient remains unavailable.

## Independent numerical evidence

Scripts `/tmp/wave5-thermo-review-data.mjs` and `/tmp/wave5-thermo-review-oracle.py`; log `/tmp/wave5-thermo-review-oracle.log`: **4,106 independent scalar/matrix/ODE comparisons pass**. A separate independent event-driven implementation additionally verifies **576 disk coordinates/velocities across 12 complete states** at three seeds and four durations, including collision-event counts; maximum discrepancy 6.29e−9 after the finite chaotic evolution. Scripts and results: `/tmp/wave5-thermo-review-disks.{mjs,py,json,log}`.

- Independent SciPy matrix exponentials verify cooling, Onsager correlations and the full 4x4 Hamiltonian Gaussian flow/covariance; independent covariance regression verifies the conditional force (maximum covariance discrepancy 7.91e−14).
- DOP853 independently integrates the four-velocity collision reaction and verifies populations and H derivative (maximum discrepancy 2.74e−14).
- 90-digit normalized finite-column formulas verify both density and CDF at positive, negative, zero and subnormal buoyancy (maximum discrepancy 2.23e−16).
- An independently assembled reflecting Markov matrix verifies finite lattice updates (maximum discrepancy 4.58e−16).
- NumPy FFT independently verifies every periodogram bin and the mean-subtracted Parseval identity for three seeds (maximum spectral discrepancy 3.56e−14).
- Numerical Maxwell integration verifies speed/collision means; the exact piecewise angular integral verifies the declared finite-panel Simpson closure (maximum quadrature discrepancy 1.73e−6).

These are numerical comparisons, not certified uniform floating-point error bounds. 
## Independent production and visual acceptance

Scoped static: 21 items, zero errors and zero warnings. The independent production runner `/tmp/wave5-thermo-review-browser.mjs` uses the actual renderer with chapter metadata supplied only in memory. Its final full matrix `/tmp/wave5-thermo-review-browser.log` passes **84 groups, 1,412 physical actions and 496 actual URL replay/rejection checks**, at actual 1200/320 CSS pixels in both themes. The reviewer extension explicitly traverses all Cartesian initial-ensemble/diagnostic combinations for 7.11, including at-rest initial correlation. Controls, modes, native-canonical values, computed readouts, full geometry/rings/strokes, visible glyphs, rich text/formulas, edited Create-state links, exact offgrid restores and malformed/out-of-range states are checked. Minimum complete marker/ring clearance is 3.4375 CSSpx and minimum glyph clearance is 0.3423 CSSpx.

A supplementary full readout-box check found a 3px vertical overflow at 7.2 on desktop. The final chapter-local plain-text ending gives the preceding TeX descenders room. The new default sweep `/tmp/wave5-thermo-review-readout-defaults-final.log` passes **all 84 settings**, asserting `scrollHeight <= clientHeight + 1` and `scrollWidth <= clientWidth + 1`, together with the existing rich text, formula and geometry checks. There are no annotation exclusions for these box-size assertions; the separate visible text-Range walker excludes only MathML, annotations and scripts.

The independent final replacement gate for 7.2 passes **4 groups / 92 actions / 16 URL checks**, including all modes/endpoints and complete readout dimensions. The final 7.3 gate passes **4 groups / 92 actions / 24 URL checks**, explicitly asserting the displayed closure-implied conductivity and actual scientifically formatted temperature difference, including minimum-subnormal forcing through a physical Create-state link. Logs are `/tmp/wave5-thermo-review-final2.log` and `-final3.log`. The remainder of the full gate's product behavior is unchanged.

The final helper-only audit corrected the unused lattice history's `variance`: it formerly measured the second moment about the fixed box center. It now computes the centered variance and mean, with the independent left-block initial values mean 3 and variance 4. Plotted probabilities and fluxes are unchanged. All 23 final math groups and all 4,106 external comparisons were rerun after that correction.

Personally inspected all **42 narrow default widgets** in both themes, the corrected minimum-subnormal temperature-difference view, at-rest correlation, cross-field correlation and actual reversed-disk modes, and complete final 7.9/7.20 statement/scope pages in both themes. Curves, probability bins, signs, legends and controls remain legible; zero-time/zero-force and quantized inference limits are stated. Final screenshots are under `/tmp/wave5-thermo-review-production`, with reviewer contact sheets `/tmp/wave5-thermo-review-contact-*`, selected modes and rich-page crops. The original source corrections are visible in the final pages.

The numerical comparisons are not certified uniform error bounds, and the finite models are not claimed as complete hard-sphere transport or kinetic-limit solvers. Source access limits above remain explicit. All findings are resolved. Reviewer browsers are closed, and the chapter/report can remain frozen for local integration.
