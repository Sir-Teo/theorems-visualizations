# Wave 5 — Vector calculus chapter 5

Authored all ten planned items, 5.1–5.10, in `content/vcalc/ch05.js`, `ch05-b.js` and the pure model module `ch05.shared.js`. No syllabus rows needed changes. No central runtime, generated atlas data, ledger or master-plan edits.

## Source review

Statements, proof explanations and examples are original paraphrases. Source URLs are attached to the individual items. Reviewed on 2026-10-21:

- [OpenStax Calculus 3 §6.2](https://openstax.org/books/calculus-volume-3/pages/6-2-line-integrals): scalar/vector definitions, orientation, flux and circulation (5.1, 5.2, 5.8).
- [OpenStax Calculus 3 §6.3](https://openstax.org/books/calculus-volume-3/pages/6-3-conservative-vector-fields): fundamental theorem, path independence and the simply connected domain condition (5.3, 5.6).
- [MIT 18.02SC Session 61](https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/mit18_02sc_l20brds_18/): conservative fields and path independence (5.4).
- [Jeremy Orloff, MIT 18.04, 18.02 Review §1.7.3](https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/7da4ddc175425eb191066e58c5b303ff_MIT18_04S18_1802Review.pdf): equivalence of potentials and path independence (5.5).
- [MIT 18.02SC, Christine Breiner, Non-conservative vector fields](https://www.youtube.com/watch?v=n9gSOBwauRw): punctured-domain obstruction (5.7). The winding formula is additionally derived directly by lifting the angle; numerical checks compare against independently determined ellipse winding.
- [OpenStax University Physics 1 §8.3](https://openstax.org/books/university-physics-volume-1/pages/8-3-conservation-of-energy): conservative-force energy balance (5.9).
- [OpenStax University Physics 2 §3.3](https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics): first-law signs and heat/work path dependence (5.10).

The planned Marsden–Tromba section labels were not independently confirmed against that edition, so the authored items instead cite the accessible sources above. No unsupported textbook numbering is asserted. Calculus definitions and proofs are stated with explicit continuity, regularity and domain assumptions; physical claims explicitly state the force/thermodynamic model.

## Models and independent checks

| Item | Interactive model and independent invariant |
| --- | --- |
| 5.1 | Projected fence and changed-clock integrand; Simpson integrals compared across speed modulation ±0.8 and reversal. Geometry uses the actual curved base, not a flat substitute for arc length. |
| 5.2 | Draggable two-segment path in (-y,x)+(1,0); segment quadrature compared with the independent determinant formula W=2+x−2y. Graph dynamically contains full cumulative work, including waypoint (2,−2), W=8. |
| 5.3 | Fixed endpoints and sinusoidally bent path; actual gradient work independently compared with potential endpoint difference. Rotational contamination exposes the residual. |
| 5.4 | Upper/lower paths and loop difference; rotation integral independently checked against −8h/π. Explicitly says finite zero tests cannot prove conservativity. |
| 5.5 | Two route prescriptions HV/VH reconstruct xy for (y,x); rotation gives xy and −xy. A route prescription is explicitly distinguished from an actual potential. |
| 5.6 | Whole plane, punctured plane and right half-plane contraction families. Collapse to the puncture is explicitly undefined; contraction inside x>0 remains admissible with a single angle branch. |
| 5.7 | Actual vortex field, without denominator smoothing. Signed/multiple winding, ellipse centre inside/outside and exact crossing. Crossing is undefined; near-singular values are withheld. Integral checked at centre 0.98 and 1.02 with 16,000 panels. |
| 5.8 | Independently integrated tangent circulation/right-normal flux agree with 2b/2a times signed ellipse area. Clockwise right normal is correctly labelled inward. |
| 5.9 | RK4 trajectory and separately accumulated nonconservative power. Compared with the exact circular harmonic solution and step halving, plus energy-minus-work residual. Dynamic plot bounds contain extreme k=0.3, E≈19.35 and radius≈4.34. |
| 5.10 | Actual pressure-volume integration for positive-pressure monatomic ideal-gas paths, independent antiderivative and ΔU=1.5(pV−1). Cycle work and heat equal the signed bow area; quasistatic PV-work assumptions stated. |

`node --test tests/wave5-vcalc-math.test.mjs`: 7/7 passing. Includes orientation, multiple traversal, finite-difference vortex curl, analytic path antiderivatives, boundary parameter values, exact oscillator, energy/work balance, solver refinement and thermodynamic endpoint checks.

## Browser and visual verification

- `node scripts/check.mjs vcalc/5 --static`: 10 items, 0 errors, 0 warnings.
- `node scripts/check.mjs vcalc/5 --modes --shots --still --w=390 --jobs=3`: 10 items, all segmented options and toggles, 0 failures/TeX/blank/quality warnings.
- Same chapter command with `--dark`: same clean result.
- `node tests/wave5-vcalc-browser.mjs`: all ten source-imported items in both themes at widths 390 and 860; every slider endpoint, singular-domain states, and dynamic work/orbit bound assertions pass.
- Screenshots `shots/vcalc-5.*.png` and `shots/vcalc-5.*.dark.png`, including mode screenshots, were inspected. Both-theme contact sheets were inspected; individual fence, work, potential, homotopy, vortex, flux, energy and gas views were also inspected. Scientific-notation readouts were corrected to render as mathematics. The initial work waypoint was moved to avoid a zero-work default that hid the graph.
- Reviewer caught static plot clipping at the work/path-speed extremes; author also caught energy-orbit clipping. Bounds were corrected and targeted browser assertions added. The final 5.2 default-only change was rechecked in both themes with all modes and fresh screenshots.

Known representational limits are stated in the UI: 5.1 is a projection of the fence, 5.7 deliberately clips the integrand graph vertically and withholds unresolved singular quadrature, and numerical integrals/ODE residuals are labelled as approximations. Finite route tests are never advertised as a proof of global conservativity.

Independent review accepted on 2026-10-21: [review evidence](wave5-vcalc-review.md). Root additionally passed the 40-case native matrix, with the four 5.4 cases refreshed after the final presentation repair. No full-suite execution was performed by this author.
