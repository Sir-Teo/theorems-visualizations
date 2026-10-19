# Circuit device models: source and interaction review

Ready for root integration: **circ-4.7, circ-4.10, circ-4.11**. Their source flags remain true until root updates the central ledger. No shared device-law or central files changed. Existing edits and dependency arrays were preserved.

## Primary evidence actually read

- [C. G. Fonstad, MIT 6.012 Lecture 11](https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2009/33eea31f564b67fc47cd9c2796500669_MIT6_012F09_lec11.pdf), hosted in Fall 2009; the slides themselves are dated March 18, 2008. All 26 slides and OCW cover read. Slide/PDF-page 2 identifies four terminals; 3–7 derive current by integrating the inversion charge; 9–12 state regions and approximations. Slides 19–21 discuss modulation in MOS and bipolar devices. Slide 20's correction is anchored at the saturation knee, unlike the atlas's existing empirical multiplier.
  Cache `/tmp/atlas-circ-mit-mos.pdf`; SHA256 `b5b2afa9d3d9daf4bea2f193562848442231d4fe163611391c92677e81f648f0`.
- [J. A. del Alamo, MIT 6.012 Lecture 17, November 8, 2005](https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2005/f6e04646e02de2f0ebabbc7e3e5adee9_lec17.pdf). All 17 pages read. Pages 4–5 specify junction-bias regimes; 7–12 identify injection paths and derive collector and base currents; 14 gives the current-gain derivation and its manufacturing variation. This directly contradicts the former base-recombination-only account.
  Cache `/tmp/atlas-circ-mit-bjt.pdf`; SHA256 `1d4ccee0915a433da101421622d4b2243196071c64c3973388ec57fcd46b57ab`.

The named historical priority claims were replaced with the inspected author derivations. These are model entries, not reviews of original transistor-invention papers; the latter remain separate queued items.

## Corrections and mathematical scope

- **4.7:** distinguished the physical body terminal from a three-terminal connection, ideal DC gate current from capacitive/leakage current, and the small-drain resistor approximation from a generic above-threshold state. A strong pull-up can prevent a low drain voltage even with positive overdrive. Both operating points use the declared continuous empirical law, without changing any shared consumers.
- **4.10:** the statement now matches the already-continuous shared law: its multiplier applies to both branches. Corrected the boundary curve and triode transconductance, stated the exact saturation output conductance, and showed infinite output resistance at zero modulation. The output-axis ceiling now includes the full family (the old 17 mA axis clipped currents up to 25.6 mA). Replaced the mixed-unit right axis with dimensionless square-root current; its reference line stops where saturation ends and its marker uses the same ordinate. Explicitly distinguishes this extension from Fonstad's different finite-modulation parameterization and from an exact compact-model reproduction.
- **4.11:** corrected forward-active and saturation hypotheses and base-current physics. The chosen smooth output-knee equation is now printed, with its parameters and limitations, rather than presented as the physical Ebers–Moll law. A fixed 0.25 V shaded band is a display convention. The current ratio may lie on either side of beta and is undefined at zero drive. Both current scales include the complete plotted families and load intersection; the old 12 mA ceiling could clip a nearly 20 mA operating point.

## Validation

`node --test tests/verification-circ-source-audit-devices.test.mjs`: **6 groups pass**. Independent channel-charge quadrature; finite-difference derivatives and branch continuity; MOS load-line KCL/power balance; bipolar operating-point equations and load monotonicity; gain-ratio counterexamples and zero drive; independently derived square-root transfer and boundary identities.

`node tests/verification-circ-source-audit-devices.mjs`: **6 native browser groups pass**, one per entry in each theme. Ten actual gate/resistor combinations for 4.7; eighteen actual gate/modulation/drag combinations for 4.10; twelve actual base-current/gain/resistor combinations for 4.11. Checks compare the displayed values, actual plotted markers, region labels, saturation reference-line endpoint and finite view limits. Logarithmic resistance sliders are operated by real Home/End input. No browser exceptions or TeX errors.

Personally inspected primary equation pages `/tmp/atlas-circ-mos-source-CLM.png` and `/tmp/atlas-circ-bjt-source-base-current.png`, and final native screenshots:

- `/tmp/atlas-circ-devices-MOS-switch-strong-pullup-light.png`
- `/tmp/atlas-circ-devices-MOS-high-gate-CLM-full-range-light.png`
- `/tmp/atlas-circ-devices-BJT-load-knee-large-gain-dark.png`

Model checks support the stated illustrations, not measured device accuracy or subjective human/audio gates. No Wave 5 work.
