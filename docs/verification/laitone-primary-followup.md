# Laitone primary-source closure

The complete original E. V. Laitone, *New Compressibility Correction for
Two-Dimensional Subsonic Flow*, Journal of the Aeronautical Sciences 18(5)
(May 1951), p. 350, DOI [10.2514/8.1951](https://doi.org/10.2514/8.1951),
was recovered from the public
[journal issue](https://archive.org/details/sim_journal-of-the-aerospace-sciences_1951-05_18_5/page/n65/mode/1up).
Both columns, including Eqs. (1)–(8) and references, were read. The intact
[page image](https://archive.org/download/sim_journal-of-the-aerospace-sciences_1951-05_18_5/page/n65.jpg)
was visually inspected because the OCR damages the equations. The issue's
scandata maps leaf 65 to printed p. 350. Image SHA256:
`5577f83297948e4d1a9fed01af8e8c1cef0d7a31a2d82c228846c17ac49e8f8e`.

Writing beta = sqrt(1−M²), Eq. (7) gives

`Cp = Cp0 / [beta + (M²/beta)(Cp0/2)(1 + (gamma−1)M²/2)]`.

This is exactly `laitoneCorr` with gamma = 1.4. Thirty coefficient/Mach pairs
matched a separately transcribed Eq. (7) to relative error below 2e−14;
all tested zero-Mach limits equal the incompressible coefficient. Near the
denominator's pole, absolute error is an inappropriate comparison tolerance.
No correction formula or control was changed.

This closes the last recorded aero-4.1 source gap, together with the already
reviewed complete Glauert original and NACA TN3970 comparison in
[the earlier acquisition report](physics-source-acquisition-pass.md).
The item now cites the exact Laitone passage and no longer carries `verify:true`.
The original's assertion of improved experimental agreement is **not** adopted
as a general accuracy guarantee: the curves retain their comparison-model
qualification and small-disturbance, subcritical scope. This source closure
does not certify the local-Mach derivation as an exact flow solution.

Native extreme-control checks exposed an existing readout defect: at Mach 0.9
and incidence 6 degrees, Prandtl–Glauert predicts nonpositive absolute pressure.
The inversion returns an infinite sentinel, which the old readout presented as
a physical Mach number. It now explains that no isentropic estimate exists.
A regression checks that case and recovery to a valid subcritical setting.

Validation: the aerospace numerical suite passes 10/10 groups; the
focused static check has zero errors/warnings; the strict build passes with
6771 written items and 6890 planned items. Native light/dark interaction
verification passes 2/2 groups, with real KaTeX and no runtime/TeX errors.
Both screenshots were inspected; the critical-Mach label was moved inside the
plot to avoid overlapping its axis label. The caption now explicitly describes
the invalid region as a prediction beyond the linear model's scope.

The shared source queue and evidence census are regenerated. Earlier complete
browser-census reports remain historical: this source and readout change
changes the aero collection fingerprint. Focused checks do not claim a new
whole-atlas capture. The human worksheet is refreshed for the current build;
human review and listening credit remain zero/pending.
