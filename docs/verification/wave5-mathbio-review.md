# Independent review — MATHBIO chapter 5

Status: **accepted** on the frozen final source. Scope: the 13 new items 5.2–5.14. Alias 5.1 and the old 3.14 source queue were not reviewed or modified.

## Source, hypotheses and proof checks

Read all statements, proof ideas, scopes, captions, models and the chapter-local helpers. Independently ran the 15 final math groups; all pass. The supplied elementary reaction laws replace unavailable later dependencies, while future inhibition/cooperativity/autocatalysis topics remain related links. Closed inventories, reservoirs, chemostats, physical versus enzyme-scaled time, equilibrium versus kinetic trajectories, finite numerical observations and limiting claims are distinguished.

Read actual Eilertsen–Schnell–Walcher2024 QSSA PDF text, equations1–5 and the fixed-small-enzyme discussion in §§1–2 (`/tmp/wave5-mathbio-qssa-clean.txt`); also independently opened the official arXiv PDF. Its terminology for a QSS curve is not copied as an assertion that the complex nullcline is invariant. The chapter correctly distinguishes e0→0 at fixed other parameters from merely sending substrate to infinity.

Independently checked every step of5.5's own explicit estimate. With z=c−g(s), conservation gives |s'|≤e0A and g'≤e0/KM. Variation of constants gives the stated initial exponential plus e0² remainder. The exact identity `s' = −k2 g(s)+(k1s+k−1)z`, the Lipschitz constant k2e0/KM, and integration to T/e0 yield exactly the displayed C_Te0. All factors are dimensionally consistent when T=e0t. The constant is independent of e0 in the stated fixed-parameter limit; it is not claimed as an original Segel–Slemrod constant, an all-time theorem or a numerical supremum inferred from samples.

Read actual Monod–Wyman–Changeux original §§2–3 pp.89–91, including the symmetry/concerted assumptions and equations1–2. Independently rendered p.91 (`/tmp/wave5-mathbio-review-source-mwc-3.png`). The four-site partition function, conditional site independence, R/T weights and ligand-dependent state mixture match the source. The widget is an equilibrium ensemble, not a fabricated switching trajectory.

Independently rendered and read Goldbeter–Koshland1981 pp.6840–6841 (`/tmp/wave5-mathbio-review-source-gk-{0,1}.png`), equations1–10. Negligible complex inventory, maintained co-substrates, normalized Michaelis constants, equal-activity case and response-range ratio agree. The uniqueness/attraction proof follows the strictly negative derivative, and finite positive constants produce a continuous response.

Independently rendered/read Hill1910 p.vi, equationB and tableI (`/tmp/wave5-mathbio-review-source-hill-2.png`). All seven observed tensions/saturations, solution conditions and stated constants agree. The historical printed calculated row is not silently substituted for formula values; the first two arithmetic discrepancies are explicitly disclosed. The noninteger exponent is not interpreted as a literal site count.

The fresh Maas–Mielke PMC opening returned primary full-text metadata and the opening reaction equations; subsequent section requests returned reCAPTCHA, after which retrieval stopped. The author's earlier §2.1–2.2 reading is distinguished from the reviewer's access. The chapter's actual three-state assertions are independently verified algebraically and numerically. General positive detailed balance is the logarithmic linear system `Nᵀ log c* = log(k+/k−)`; compatibility is precisely orthogonality of the log-ratio vector to ker N, giving the stated Wegscheider conditions. No general entropy-decay or Lyapunov theorem is asserted by these new items.

The binding, reciprocal-error and inhibition formulas are independently derived from the declared fluxes and inventories; the references honestly label limited indexed-passage access. No fresh attempt was made to recover the old blocked source queue. The Brusselator transform at B=2 gives exactly `u'=−v−2uv−u³−u²v, v'=u`; the planar cubic radial coefficient is −6/16=−3/8, yielding the local supercritical conclusion and leading x half-range sqrt(4(B−2)/3). A finite integration is not presented as a global periodic-orbit proof.

## Independent numerical calculations

Scripts `/tmp/wave5-mathbio-review-data.mjs` and `/tmp/wave5-mathbio-review-oracle.py`; log `/tmp/wave5-mathbio-review-oracle.log`: **25,764 independent scalar/ODE comparisons pass**.

- 90-digit depleted-binding roots, including a minimum-subnormal ligand whose positive bound fraction was lost by the previous product order.
- DOP853 integration of all four species with the independent elementary stoichiometric flux matrix; compare substrate, complex and product to chapter RK4 (maximum absolute discrepancy7.64e−9). Lambert-W evaluation independently verifies reduced substrate (maximum1.59e−14), and the sampled exact-ODE discrepancies obey the proven bound.
- Exact rational enumeration of all16 site microstates in both conformations verifies the MWC probabilities and occupancy (maximum binary64 discrepancy3.34e−16).
- Independent high-precision quadratic roots verify GK equilibrium, including nextafter activity ratios around1 (maximum5.50e−15).
- Independent normalized generator solves verify stationary populations and all three edge currents, including enforced compatibility (maximum4.45e−16).
- DOP853 verifies Brusselator trajectories across stable, boundary and unstable feeds/initial displacements (maximum absolute discrepancy1.61e−7 over the finite horizon).
- Independent scalar optimization and linear least squares verify all99 seed choices at three noise amplitudes: original-rate SSE differs by at most3.30e−17, reciprocal coefficients by at most4.56e−15.

These are empirical numerical comparisons, not certified global floating-point error bounds.

## Findings resolved before freeze

- KM is approximately, rather than literally, Kd when catalytic release is small relative to dissociation.
- Hide the overridden f input under enforced cycle compatibility and trial Hill controls under historical constants.
- Factor the depleted-binding numerator so a representable minimum-subnormal bound concentration is not lost avoidably.
- Include valid selected positive dilute-ligand log coordinates in the plot, with actual saved-state checks.
- State zero-mean errors in the statistical fitting assumption and explicitly justify stationary uniqueness by a positive generator minor/rank2 argument.

The final helper rewrite preserves the exact Brusselator equilibrium `(1,B)` in binary64; its two right-hand-side expressions are algebraically identical to the original mass-action equations. All 15 final math groups and all 25,764 external comparisons were rerun successfully after that change.

## Independent production and visual acceptance

Final scoped static check: 13 items, zero errors and zero warnings. The independent reviewer ran `/tmp/wave5-mathbio-review-browser.mjs` in the actual production renderer, with chapter metadata supplied only in memory. Log `/tmp/wave5-mathbio-review-browser.log`: **52 groups, 596 physical actions, 264 actual URL replay/rejection checks pass** at actual 1200/320 CSS pixels in both themes. Every selectable mode and visible control endpoint, computed marker/bar/readout agreement, complete production text/formulas/readout, full marker/ring/stroke bounds, exact browser-canonical range strings, edited Create-state-link replay, offgrid restores and malformed/out-of-range rejection are checked. Six dilute-log saved states per setting cover both supplies at MIN_VALUE, 1e−20 and .0002. Exact zero-displacement Hopf boundary and offgrid unstable-feed states retain the equilibrium.

The final visual inspection caught a remaining visibility defect: the enforced cycle mode displayed the overridden f slider. Explicit chapter-local display toggles replaced the ineffective hidden attribute for that control and the historical trial parameters, with explicit native visibility assertions. The independent final replacement gate `/tmp/wave5-mathbio-review-visibility.log` passes **8 groups, 128 physical actions and 32 URL checks** on items 5.12 and 5.14. The other 44 groups' source/model bytes are unchanged. The full run's marker/stroke clearance is at least 11.75 CSSpx. One near-boundary axis tick has a measured glyph edge −0.00739 CSSpx, within the 0.1 CSSpx font-metric tolerance; final replacement glyphs clear by at least 3.1156 CSSpx. No omitted whole glyph, page overflow, clipped formula or incomplete readout was found.

Personally inspected all 26 final narrow defaults in both themes, selected rich theorem/proof/scope/caption pages for 5.5/5.10/5.12/5.14, the minimum-subnormal closed/log view, and alternative substrate-conservation, free-substrate comparison, enforced compatibility and trial-Hill modes. After the final visibility correction, inspected the actual corrected enforced-cycle and historical screenshots again. Curves, active bars, labels and controls remain legible; the conservative QSSA upper bound is paired with a separate view resolving the actual discrepancy. Artifacts are in `/tmp/wave5-mathbio-review-production`, with contact/rich sheets `/tmp/wave5-mathbio-review-contact-*`, `-modes.png` and `-rich-*`.

The source access limits above remain explicit. The chapter makes no claims that its finite samples certify global extrema, an original historical fit, or an all-time QSSA error estimate. All requested fixes are resolved. The reviewer browser is closed; content and paired reports can remain frozen.
