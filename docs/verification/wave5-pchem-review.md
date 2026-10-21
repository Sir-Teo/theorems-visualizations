# Independent review — PCHEM chapter 5

Status: **accepted on final frozen bytes**; source/model, independent numerical, native replay and visual checks complete. Scope: all 17 new items 5.1–5.17. Only this reviewer report and bounded `/tmp` oracle files were written by the reviewer.

## Sources, hypotheses and proof use

Read all statements, proofs, scopes, captions, local models and focused tests. Independently ran all final 17 math groups (17/17 pass) and the chapter-local static check (17 items, zero errors/warnings). Single homogeneous differentiable phases, extensive Euler identities, ideal gas versus ideal liquid versus ideal-dilute approximations, standard-state conventions, finite generic closures and real pure-component anchors are distinguished.

Read the actual MIT3.020 Lecture16 Euler/Gibbs–Duhem text and Lecture19 regular-solution/curvature text. Independently verified the chain-rule partial-volume formulas, weighted derivative cancellation and the inconsistent-slope counterexample. The nonlinear exchange solution satisfies the original concentration-difference ODE, conserves total A and dissipates the stated extensive Gibbs energy. The written Gibbs–Helmholtz, fundamental-differential/pressure and maximum-work prerequisites are consumed where used; inaccessible future topics are not substituted for those arguments.

Read DeVoe's actual v10 book §12.4 pp.376–382, including pure first-solid and nonvolatile-solute restrictions, limiting molal slopes and solvent-pressure balance. Independently inspected the actual rendered p.387 Eq.12.5.11 and p.394 Eq.12.6.7–8. The finite latent-enthalpy equations, ideal-solubility interpretation and limiting concentration partition ratio match the source. The chapter keeps ideal solubility separate from measured solvent-specific data and distinguishes the same chemical form from total associated solute. Generic molar mass, latent heats and pure phase temperatures are declared rather than presented as water data.

Freshly opened actual NIST tables and checked the selected [benzene](https://webbook.nist.gov/cgi/cbook.cgi?ID=C71432&Mask=4) and [toluene](https://webbook.nist.gov/cgi/cbook.cgi?ID=C108883&Mask=4) Antoine coefficients, bar/K convention and validity ranges; the complete 290–320 K control domain lies inside both. Checked the selected [CO₂ Henry](https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=10) row (.035 mol/(kg bar), 2400 K) and its temperature equation. The missing underlying reference metadata are disclosed. Checked the [naphthalene](https://webbook.nist.gov/cgi/cbook.cgi?ID=C91203&Mask=4) crystal-I to liquid row (19.046 kJ/mol, 353.376 K). These pure-component correlations/anchors do not authenticate the synthetic mixture curves as measured data.

Independently opened the actual [Bureau of Reclamation operations page](https://www.usbr.gov/lc/yuma/facilities/ydp/yao_ydp_operations_ro.html), supporting the pressure/membrane process description. The signed flux, chosen permeance and reversible-work integral are explicitly supplied ideal closures; plant performance is not fabricated. The reviewer's fresh IUPAC recommendation request returned403, and the typed van't Hoff translation returned502; neither was retried. The author records the earlier successful passages separately. The original German paper and original translation scan remain unavailable; **5.17 retains verify:true**, explicitly discloses its transcription uncertainty and computes modern theoretical piston work rather than historical Pfeffer measurements.

Independently completed the symmetric regular-solution argument: the nonzero order parameter is unique because atanh(m)/m increases from1; its two minima lie outside the spinodal and have equal depth by symmetry. Convex outer branches joined by their horizontal common tangent give the bulk convex envelope. Local positive curvature between binodal and spinodal is not global equilibrium, and no nucleation rate is inferred from the graph.

## Independent numerical evidence

Scripts `/tmp/wave5-pchem-review-data.mjs` and `/tmp/wave5-pchem-review-oracle.py`; log `/tmp/wave5-pchem-review-oracle.log`: **1,964 independent scalar/ODE/rational comparisons pass**.

- High-precision differentiation of an independently expressed extensive volume verifies all partial volumes and derivatives; independent DOP853 verifies the nonlinear chemical-potential exchange ODE and its extensive Gibbs energy.
- 100-digit calculations verify gas mixing, NIST pressure conversions/Raoult vapor fractions, sealed Henry conservation and standard-state chemical-potential invariance.
- 100-digit nonzero coexistence roots and an independently constructed convex envelope verify ordinary and next-float-above-critical regular-solution states (maximum order-parameter discrepancy5.56e−16).
- High-precision latent-enthalpy equations verify finite boiling/freezing offsets, including minimum-subnormal loadings; the final factorization preserves positive/negative representable offsets previously erased by an intermediate product.
- Independent high-precision hydrostatic roots verify dilution in the one-column infinite-reservoir geometry; the ideal-activity pressure is a comparison, not a false claim to solve the same height exactly.
- Independent high-precision separation work and exact rational fresh-stage extraction calculations verify recovery and inventory. Separate association quadratics verify monomer-equivalent conservation and the loading-dependent total distribution ratio.
- High-precision ideal fusion solubilities and explicit finite-step pressure-work sums verify loading caps and the reversible-work bound.

These numerical comparisons do not constitute certified global binary64 error bounds.

## Findings resolved before final freeze

- Explicitly hide the unused boundary-condition controls in5.6 and inactive extraction/association controls in5.16, preserving their saved values and checking native visibility.
- Use a distinct theme-aware solid-phase color in5.10.
- Replace exact numerical spinodal classification with a scale-aware inconclusive guard; analytic formulas remain stated separately, and computed spinodal states are tested through actual Share links.
- Factor finite colligative offsets to avoid an intermediate m times solvent-mass underflow; do not incorrectly call a representable offset inherently unrepresentable.

- At minimum-subnormal sealed loadings the separately rounded dissolved/headspace amounts can both vanish. The final5.6 readout displays the specified input scientifically and explicitly discloses the quantized partition/sum rather than falsely claiming exact conservation; ordinary rounding remains qualified separately. The newly exercised tiny curves also required a wider chapter-local tick gutter.

## Independent native and visual evidence

Ran the production renderer independently at actual1200/320 CSSpx in both themes: **68 groups,816 physical actions,432 actual URL replay/rejection checks pass**. The reviewer runner is `/tmp/wave5-pchem-review-browser.mjs`, log `/tmp/wave5-pchem-review-browser.log`, images `/tmp/wave5-pchem-review-production`. It checks complete statement/scope/caption/readout text and math bounds, readout scrollHeight/clientHeight and width (one CSSpx tolerance), full canvas glyph/halo and path/stroke/dot/ring bounds, native canonical range strings, model/readout agreement, revealed modes and endpoints, physical Create-state-link edited replay, off-grid and malformed/out-of-range rejection. Minimum full marker/ring clearance11.068CSSpx and glyph clearance1.193CSSpx. Independent added assertions require an inconclusive label at computed spinodal boundaries, rather than trusting the author runner's branch output.

The final5.6 replacement run additionally checks actual physical Share links for MIN total at292.15K and288.85K, exact saved snapshots and readout equality, explicit quantization disclosure and complete glyph/ring/text bounds. Final replacement result: **4 groups,64 physical actions,32 URL checks pass**, full marker/ring clearance11.068CSSpx and glyph clearance3.266CSSpx; log `/tmp/wave5-pchem-review-final6.log`. Personally inspected final light/dark320 MIN captures: the specified positive input and unresolved partition are both visible, with unclipped axes and hidden inactive controls. Browser closed after completion.

Personally inspected all34 narrow default widgets across both themes using the reviewer captures, plus wider contacts, the5.9 near-spinodal raw state,5.11 minimum-subnormal signed offset,5.15 finite-inventory mode,5.16 fresh extraction and dimerization/hidden-control modes, and5.17 complete narrow statement/scope/proof/verification disclosure. Theme contrast, legends, units and quantities agree with the actual computations. These numerical/native checks do not certify arbitrary continuum extrema or authenticate inaccessible historical originals.
