# PDE separation/Fourier source review — 2026-10-17

Resolved seven queued chapter-4 reviews. The heat-ball and Tychonoff reviews in chapter 3 remain flagged.

## Sources checked

- [Ivrii §4.1](https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.1.html): separated wave modes and both initial conditions.
- [Ivrii §4.2](https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.2.html), Examples 1–3, 6–7: D/N/Robin spectra, energy identity and zero/negative modes.
- [Ivrii §4.3](https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.3.html): boundary identity, projections and completeness.
- [Ivrii §4.4](https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.4.html), equations (4.4.3)–(4.4.5), Theorems 4.4.3–4.4.4: Fourier coefficients, Parseval and jump limits.
- [Ivrii §4.5](https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter4/S4.5.html): extensions and complex coefficients.
- Fourier's original [preliminary discourse](https://fr.wikisource.org/wiki/Th%C3%A9orie_analytique_de_la_chaleur/Discours_pr%C3%A9liminaire) and [chapter III](https://fr.wikisource.org/wiki/Th%C3%A9orie_analytique_de_la_chaleur/Chapitre_3), articles 165–171 and 191: manuscript history, lamina geometry and series.

Replaced unchecked Strauss/Evans section pointers with the open author-written text actually examined. Removed unsupported historical date/priority details from the method entries. The Fourier paper entry retains its verified publication and manuscript chronology; the exact December 1807 date and unsupported claims about named objections/priority were replaced with what the original preface says.

## Corrections

| Item | Result |
|---|---|
| `pde-4.1` | Corrected the sign explanation for the separation parameter, distinguished the two wave initial data, qualified lowest-mode dominance, and labelled finite-difference error accurately. Plot bounds include edited coefficient sums. |
| `pde-4.2` | Stated the initial-data regularity/weak-solution scope. The triangle coefficient agrees with direct integration. Energy shares now use the full analytic string energy rather than a truncated 200-mode denominator. Large plucks no longer clip their harmonic bars. |
| `pde-4.3` | Distinguished positive and zero eigenvalues; included the Dirichlet-left linear zero mode at h=-1/length. Corrected the Neumann-left large-h limit. Exact norm integrals replace midpoint normalization. The growing mode and its actual spatial envelope remain visible. |
| `pde-4.5` | Corrected Robin positivity to include the pure-Neumann exception. Removed the invalid inference from nonorthogonality to incompleteness. The coupled-end example is symmetric at a=0; the caption now says so. |
| `pde-4.6` | Explicitly stated real-valued data for the squared-coefficient formulas. Norm, coefficients and direct residual now use the same quadrature grid. Distinguished numerical integration from an exact theorem check. |
| `pde-4.7` | Labelled sampled maxima honestly and added a button to land the probe exactly at a jump. Ordinary pointer coordinates cannot reliably land on a discontinuity to a tolerance of 1e-9. |
| `pde-4.12` | Rechecked the chapter III lamina and manuscript chronology in the original book. Finite lamina sums agree with an independent closed form; time-dependent bar sums satisfy the heat equation numerically. Gibbs overshoot is described as an asymptotic limit. |

Two neighboring unflagged items were corrected during this comparison:

- `pde-4.4`: the odd extension requires both endpoint values to vanish to avoid jumps. Coefficient-decay claims now assume sufficient piecewise smoothness.
- `pde-4.9`: multiple jumps can cancel on subsequences; open-strip analyticity gives coefficient bounds at every strictly smaller width, not necessarily at the boundary width. The converse smoothness claim is about a representative. Corrected the plotted complex coefficients and functions to the stated unit L2(dx) normalization, and expanded the view to include narrow analytic peaks. Independent exact Bernoulli coefficients verify the normalization.

## Validation

- `npm test`: 47 math, 20 science-kit and **23 content-verification tests** pass. The four new tests cover exact D/N spectra, both Robin thresholds, boundary residuals, energy/norm identities, triangular projections and energy, exact Fourier coefficients and finite Parseval identities, the lamina closed form and heat-mode residuals.
- `node tests/verification-pde.mjs`: eight browser scenario groups pass, including real pointer edits, both PDEs, both Robin left ends at four coefficient settings and two selected modes, all nine symmetric endpoint combinations, the coupled-end exception, jump probes, exact normalized coefficients, and slider extremes.
- All 11 chapter-4 visualizations pass in light/dark and selector/toggle modes. Representative screenshots inspected; extra interaction checks cover formerly clipped sums, pluck bars, growing modes/envelopes and analytic peaks.
- `node tests/verification-interactions.mjs pde-4.2`: one real Web Audio action, nonzero signal energy, finite samples and no autoplay. The script now accepts optional item IDs without changing its default full selection. Subjective listening remains pending.
- Strict build and full static validation pass. Five affected chapter/item routes pass smoke checks.

The source-review queue now has **828** pending entries. Wave 5 remains gated by verification and the pending human/listening checks.
