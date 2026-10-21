# Wave 5 vector calculus chapter 5 — independent review

Reviewer validation, 2026-10-21. Scope: ten new items in `content/vcalc/ch05.js`, `ch05-b.js`, `ch05.shared.js`, their tests and author report. Followed AUTHORING and MASTER_PLAN §7.2.

## Sources and mathematical scope

Independently opened [OpenStax Calculus 3 §6.2](https://openstax.org/books/calculus-volume-3/pages/6-2-line-integrals), [§6.3](https://openstax.org/books/calculus-volume-3/pages/6-3-conservative-vector-fields), [MIT 18.04 review §1.7.3](https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/7da4ddc175425eb191066e58c5b303ff_MIT18_04S18_1802Review.pdf), and the [official Breiner nonconservative-fields transcript](https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/ec5b81a3e3462a129c04a110bb26056d_MIT18_02SCF10Rec_43_300k.pdf). Definitions, connected/open domain assumptions, local versus global potentials, and the excluded vortex origin are faithful. Orientation reversal distinguishes scalar length integration from signed work/right-normal flux. The general winding formula follows from the continuous lifted angle argument supplied in the item.

Also opened [OpenStax Physics 1 §8.3](https://openstax.org/books/university-physics-volume-1/pages/8-3-conservation-of-energy) and [Physics 2 §3.3](https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics). Force-potential sign and the gas-work/heat conventions are consistent. Authored numerical examples are clearly distinguished from exact claims.

## Independent checks

- Derived the complex oscillator solution independently: for z=x+iy, z''=(-1+ik)z, with z(0)=1 and z'(0)=i, set omega=sqrt(1-ik), then z=cos(omega t)+i sin(omega t)/omega. Compared all position and velocity coordinates for 14,007 states across seven k values including both extrema. Maximum absolute error 2.55e-10 against the actual RK4 helper.
- Independently compared all 400 nonsingular native centre-grid/turn combinations in the vortex example with the exact winding formula. Maximum circulation error 1.12e-13.
- Read the other calculations directly: parameter-speed factors, segment determinant formula, gradient endpoint differences, bowed-route differences, signed ellipse flux, and gas-path antiderivative agree with the displayed quantities.
- Independently reran `node --test tests/wave5-vcalc-math.test.mjs`: seven passing tests.
- Independently reran `node tests/wave5-vcalc-browser.mjs`: all four theme/width runs pass. This exercises all ten items, control endpoints, actual singular states and dynamic work/orbit bounds.

## Visual review and fixes

Independently opened all twenty final narrow default screenshots, every item in light and dark (`shots/vcalc-5.{1..10}[.dark].png`). Diagrams, controls, formulas and readouts remain legible. Reviewed the source's explicit warning for the clipped vortex integrand scale; its integral is independently computed without clipping.

Reviewer found and author fixed:

1. The scalar integrand exceeded its former y=5 ceiling at allowed modulation +0.8 (maximum about 5.377); its ceiling is now 6.
2. Waypoint work could reach 8 outside the former [-6,6] graph; the accumulated-work panel now fits actual extrema.
3. The route-comparison panel suppressed the first categorical tick and made three zero bars invisible. Box axes and colored endpoint dots now show the labels and zero equality. Independently re-opened the corrected light/dark screenshots.

The author also corrected extreme-swirl trajectory/energy extents; the independent browser rerun checks these bounds. The chapter meets the AUTHORING rubric: interactive hypothesis changes, measured quantities tied to each statement, exact comparisons and explicit numerical limitations, and consistent light/dark palette use.

Status: accepted for mathematical/source fidelity, computational honesty and visual presentation. Root additionally owns the shared native matrix and repository-wide gates.
