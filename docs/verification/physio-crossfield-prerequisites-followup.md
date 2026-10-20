# PHYSIO genuine prerequisite follow-up — 20 October 2026

Candidate adds **15 genuine written-to-written prerequisite edges across 14 existing written items**, with bounded explanatory paragraphs and matching syllabus additions. Read-only inventory moves **10/20/38 → 25/35/53** written-to-written/written-to-known/whole-syllabus, with zero unknown targets. These are candidate counts pending separate independent peer acceptance; no global inventory, source flag or closure ledger is changed. The prior AERO/IMAGING peer commits remain preserved.

The complete actual statements and proof ideas of all ten newly used target items were read, together with the full consumer arguments and scopes. These are already consumed mathematical/electrical/thermodynamic steps, not related-topic padding:

| Consumer | Added prerequisite | Actual use and hypotheses |
|---|---|---|
| 1.1 homeostasis | ctrl-1.8 | Stable proportional-loop static sensitivity E=D/(1+K), unsaturated effectors; static attenuation does not establish delayed-loop stability. |
| 1.3 membrane diffusion | pma-6.21 | Integrates continuous constant derivative across homogeneous source-free steady membrane with specified partition-equilibrium face values. |
| 1.4 osmosis | thermo-4.12 | Actual ideal-mixture chemical potential supplies RT log water mole fraction; dilute logarithmic and concentration approximations yield van 't Hoff balance. |
| 2.5 muscle power | pma-5.3; pma-5.8 | Product/quotient derivative of Fv and necessary interior stationarity on positive shortening branch; derivative sign proves unique maximum, without extending empirical fit. |
| 2.8 recruitment | circ-1.4 | Passive quasi-static voltage increment I R_in at fixed resistance, comparable thresholds and drive; does not claim arbitrary recruitment ordering. |
| 3.2 pressure–volume loop | mech-3.1 | Oriented boundary force–displacement work becomes P dV; positive work delivered to blood is −∮P dV for stated counter-clockwise chamber cycle. |
| 4.1 vascular resistance | circ-1.4 | Fixed positive hydraulic resistance has precisely the same constitutive proportionality as an ohmic resistor; operating-point ratio distinguished from constant resistance. |
| 4.2 Poiseuille flow | pma-6.21 | Integrates radial velocity derivative with no-slip boundary, then continuous annular flux to obtain fourth-power flow under stated rigid Newtonian steady-tube assumptions. |
| 4.3 radius sensitivity | pma-5.5 | Positive-flow/radius logarithmic derivative, pressure/viscosity/length fixed; differential sensitivity separate from finite fourth-power ratio. |
| 4.6 compliance | pma-5.1 | Actual derivative definition gives local secant-slope limit and first-order remainder; large increments require full constitutive curve. |
| 4.7 Windkessel | pma-6.21 | Full-period storage derivative integrates to zero in periodic state; piecewise continuous inflow handled on smooth pieces with continuous pressure. Positive-pressure diastolic separation gives exponential. |
| 4.13 oedema model | pma-4.23 | Continuous net-flow curve and finite opposite-sign bracket imply equilibrium; strict decrease supplies uniqueness/restorative direction. Existence relies on chosen unbounded tissue-pressure law. |
| 4.16 myogenic model | pma-5.5 | Chain rule gives −1/4 radius elasticity at fixed flow and 1−g sensitivity in unbounded chosen model; radius limits interrupt relation. |
| 4.17 circulation intersection | pma-4.23 | Continuous positive-flow branch and sign-changing finite bracket imply intersection; monotone supply/demand and positive reservoir compliance give uniqueness/restoration. No positive circulation claimed for every setting. |

The target proofs support only their stated calculus, constitutive, work and mixing steps. This batch adds no empirical physiological data, clinical guidance or source acceptance.

## Explicit metadata correction and test maintenance

The inherited **1.3 syllabus** used `['thermo-7.6','mathbio-8.2']`, while the written item used `['thermo-7.6','pchem-10.1']`. The actual alias row `mathbio-8.2` redirects to planned **pchem-10.2**, the diffusion equation/second law. Planned **pchem-10.1**, Fick's first law, is the constitutive flux law actually named and used in the written steady-membrane argument. With coordinator authorization, the owned syllabus row is synchronized to the justified written list plus the new FTC edge: `['thermo-7.6','pchem-10.1','pma-6.21']`. Neither planned diffusion target has an authored proof; this correction does not pretend those proofs were available. Its only new written target is the fully read pma-6.21. Peer must assess this explicit row correction separately.

Two older default source-audit tests in `verification-physio-source-audit-{dynamics,geometry}.test.mjs` rejected valid new edges by requiring exact historical dependency arrays. Authorized changes replace only those assertions with required-subset checks on the actual parsed deps. Every original required dependency and substantive numerical/source assertion remains. No review-flag assertion is added. Initial run had **51/53**, failing only those stale arrays; final run has **53/53**.

## Preservation and verification

Explicit-only `tests/verification-physio-prerequisites-audit.mjs`, with `PHYSIO_PEER_BASELINE=/tmp/atlas-new-arch-source/physio-prereqs/baseline`, compares complete serialization of all **55 item objects**, including all executable function source and flags. It permits only the exact appended ideas and exact full expected dependency lists. It compares the complete syllabus, including multiline lists, permitting exactly the same additions plus the explicit 1.3 correction. Every PHYSIO private helper, source-audit module and collection file is byte-identical. No statements, scopes, captions, refs, runtime, core or source flags are changed. The full preservation audit is not a default snapshot test.

The independent formula checks in `verification-physio-prerequisites-math.mjs` pass **13 groups** without importing production helper formulas: feedback balance, membrane integration, controlled dilute-log remainder, muscle derivative/maximum, passive electrical thresholds, signed pressure–volume work, radial flow quadrature, logarithmic fourth-power sensitivity, nonlinear compliance derivative, periodic storage cancellation/diastolic decay, continuous monotone oedema bracketing, bounded-vs-unbounded myogenic sensitivity and conditional circulation intersections. All **53 existing PHYSIO default tests pass** after the narrow authorized subset maintenance. An initial derivative fixture used too large a relative step at radius 0.1; changing its finite-difference step to scale with the positive argument fixed the numerical oracle, with no production change.

Fresh strict build: **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors and 0 warnings**, home payload **112707 bytes gzip**. Scoped static: **55 items, 0 errors, 0 warnings**. Git diff whitespace check passes.

Fresh native checks cover **14 changed items × two themes at 320px**, native visualization mounts (runtime/TeX/nonblank), and separate actual built proof views. All changed proofs have actual client/scroll widths **288/288**, including internal displayed-math scroll checks. Full ideas and individual appended paragraphs were captured. I personally inspected all **28 changed-paragraph output screenshots** in light/dark contact sheets; all changed text and mathematical glyphs are readable, with no clipped changed content.

The actual existing bridges were searched and read. `feedback` references 1.1/1.2 and `diffusion` references 1.3. Their bounded sensor/effector/saturation, gain-convention and homogeneous-membrane notes remain accurate; no bridge edit is needed. Fresh actual built 1.1 feedback and 1.3 diffusion cards in both themes fit at 320px and their pixels were personally inspected. This certifies changed prose/mounting, not every inherited interaction or source claim.

Evidence: `/tmp/atlas-new-arch-source/physio-prereqs/` contains immutable baseline, mapping, `build.log`, `static.log`, `math-final.log`, `math-own.log`, `native-final.log`, and `native/{*-idea.png,*-changed.png,contact-light.png,contact-dark.png,feedback-*.png,diffusion-*.png}`. Final native audit includes complete item/syllabus preservation with the explicit row exception. Browser and server closed. No FPS benchmarking, global-file write, helper/runtime change or source closure occurred. Separate independent peer is required before acceptance.
