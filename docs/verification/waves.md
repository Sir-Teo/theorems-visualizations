# Interface optics source and numerical review — 2026-10-18

Read AUTHORING.md and physics guidance. All9 original source flags are reviewed
within the revised hypotheses. Dates of priority not independently traced are
removed; models are distinguished from calibrated material data.

| Items | Evidence and corrections |
| --- | --- |
| waves-4.5,4.6,4.7,4.9,4.11,4.14 | [Feynman II ch.33](https://www.feynmanlectures.caltech.edu/II_33.html), complete relevant §§33–2–33–4 and33–6, Eqs.(33.25)–(33.59): phase matching, Maxwell boundary conditions, both polarizations, normal incidence and decaying TIR branch. Stokes identities are checked by the displayed real-coefficient reversal algebra. Restrict the reversed-ray interpretation to propagating waves on both sides. State local p-axis convention and use real normal flux for T. Identical-index media now give zero reflection even at grazing incidence; critical-angle roundoff is handled explicitly. Huygens readout now reports the actual ratio of the two wavelet radii; TIR occurs when the second-medium wavelets outgrow the interface sweep. Handle the degenerate critical tangent and preserve the critical button's exact value. Pulse clock is scaled to incident-medium travel time so reflection is visible throughout the glass-index range. |
| waves-4.10 | [Gehring, Rochester dissertation](https://www.hajim.rochester.edu/optics/sites/boyd/assets/pdf/theses/Thesis_Gehring.pdf), complete §§5.2 and5.4.1, printed pp.82–85 and90–92, Eqs.(5.3)–(5.7),(5.13)–(5.19) and the TE coefficient summary. The implementation's transmitted amplitude is referenced to the exit face; the source's global amplitude contains an additional exp(-ikL). The source's printed(5.19c) has a sign typo: differentiating(5.13a) with condition(5.18a) gives ik(1-R), as used here. Independent continuity/derivative and energy checks validate the convention. A finite gap needs both exponentials; penetration length diverges near the critical angle. Removed a fixed marker floor and the claim that penetration is always a fraction of a wavelength. |
| waves-4.12 | [Fitzpatrick, Rainbows](https://farside.ph.utexas.edu/teaching/302l/lectures/node131.html), complete ray/edge/colour discussion; [Rose-Hulman prism laboratory](https://www.rose-hulman.edu/Class/phao/PH/JOW/Ph113%20Labs/Physics_lab_manual/chapter_5/prism-1/prism-1.html), complete Introduction and rendered Eq.(1). The explicit Snell ray trace and differentiation supply the stated stationary-angle formulas. Corrected the primary bow's sharp outer edge versus secondary inner edge. Removed unsupported index-model accuracy and historical dates. Prism exits/minima forbidden by TIR now display that condition instead of NaN/undefined; signed emergence angles are permitted when physically valid. Expanded the incidence slider and deviation axes so high-apex minima remain visible. |
| waves-4.13 | [MIT6.974 optical-fibres notes](https://ocw.mit.edu/courses/6-974-fundamentals-of-photonics-quantum-electronics-spring-2006/fb095f719b1e2239974fddca264f80d9_optical_fibres.pdf), complete step-index/acceptance discussion printed pp.146–149, Eq.(2.383). The meridional delay follows directly from the displayed optical path L/cos(alpha), with cos(alpha_max)=n2/n1. Removed the hidden n2 cap: actual n1<=n2 gives no TIR guiding. Air acceptance saturates at90degrees when nominal NA>1. Pulse height is normalized; accepted sample count is not a power-throughput measurement. Removed unchecked historical claims. |

`node tests/verification-waves.test.mjs`: **9/9 independent numerical groups pass**.
These check both complex Maxwell boundary equations, normal energy conservation,
Brewster/critical/equal-index limits, actual Huygens geometry, exact critical
control, complex gap-field continuity and derivatives at both faces, independent
hyperbolic T, real Stokes reversal, rainbow stationary points and actual exit
rays, prism TIR and symmetric minima, real fibre inputs/delay, and pulse
continuity/reflection at both index extremes.

Serial real-KaTeX light/dark input checks for all9 items are recorded by
`tests/verification-physics-browser.mjs` in /tmp/atlas-physics-browser-waves-*.json.
All **18/18 light/dark groups passed**, with no browser or TeX errors; source conclusions do not rely on render results.

Genuine cross-field prerequisite, mirrored in syllabus: waves-4.10 uses
em-10.7's tangential Maxwell boundary conditions to calculate all four gap-field
amplitudes. No quantum prerequisite is added for the tunnelling analogy.
