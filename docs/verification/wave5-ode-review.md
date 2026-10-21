# Wave 5 ODE chapter 5 — independent review

Reviewer validation, 2026-10-21. Scope: eighteen new items in `content/ode/ch05.js`, `ch05-b.js`, `ch05-c.js`, their chapter helper and scoped tests/report. Followed AUTHORING and MASTER_PLAN §7.2; did not reopen historical queues.

## Sources and scope

Independently opened [Teschl's official ODE text](https://www.mat.univie.ac.at/~gerald/ftp/book-ode/ode.pdf), especially §§6.2–6.7 and §§8.1–8.3. Checked the local-flow lifetime restriction, straightening assumptions, compact trapping and limit sets, attraction versus stability (including Problem 6.16), Lyapunov/LaSalle conclusions, gradient identity, first integrals and divergence formula. The authored statements preserve the needed distinctions: boundedness versus compact containment, invariance versus forward invariance, convergence to a set versus a point, strict versus nonpositive derivative, and actual flow domains versus algebraic continuations. The examples and additional elementary arguments are supplied explicitly rather than attributed verbatim to the book.

The local positive-region Chetaev version is supported by [Iyer's CMU notes, Theorem 8](https://www.math.cmu.edu/~gautam/c/2026-632/notes/stability.html) and the item's compactness proof. Independently found the [publisher's Lyapunov translation record](https://www.tandfonline.com/doi/abs/10.1080/00207179208934253): its indexed record verifies title, author, 1992 journal issue and the 1892 Kharkov original. The quadratic example is expressly modern; no claim of independently reading the entire dissertation is made.

## Independent mathematical and implementation evidence

- Compared `gradientX` with a separately integrated scalar ODE at 6,030 points across six positive/zero/negative parameters and five initial states. Fine RK4 versus closed-form maximum absolute discrepancy 6.52e-13.
- Differentiated the actual exact circle-excursion coordinates numerically at 24 states, including the turnaround, and checked them against the angular vector field. Also directly verified the initial point and exact distance-two excursion.
- Read and independently checked the nonlinear Lyapunov identity and envelope inequality, damped-pendulum invariant-sublevel argument, saddle escape, basin sign criterion, gradient nonperiodicity, and shear determinant/area calculation.
- Instantiated the actual 5.8 and 5.18 visualization readouts in a stub runtime at nine floating-point boundary cases. All now report inconclusive; well-separated success/failure cases retain the correct classification.
- Independently reran `node --test tests/wave5-ode.test.mjs`: eleven tests pass.
- Independently reran `node tests/wave5-ode-layout.mjs`: all eighteen items in both themes at 320px pass display-math/readout layout checks; the test also verifies the actual native controls after off-grid-value buttons.

## Visual review and resolved requests

Independently viewed every item's initial full-page screenshot, alternating light/dark and 320/1200px. Then opened all eight corrected-item captures (5.1, 5.2, 5.7, 5.8, 5.14, 5.16, 5.17, 5.18) in `shots/`, plus the final 5.17 mobile statement. Charts, legends, controls, diagrams and numerical readouts are legible.

Reviewer-requested corrections are present and checked:

- Isolated equal-aspect phase panels cap width at 620px so wide layouts no longer shrink the example into excessive empty space. The complete-flow example also uses a tighter view.
- Blow-up axes distinguish time/state, straight coordinates say u/z, and the excursion chart labels normalized time.
- The exact 2π, sqrt(1/2), and 1+k²/4 button values use `step:any` controls; the mathematical values are preserved.
- `gradientX` handles exactly a=0 separately and retains all nonzero parameters via `expm1`.
- Floating quadratic-form evaluations near zero are marked inconclusive and show the analytic condition; rounded eigenvalues do not certify equality.
- The author shortened the determinant display after detecting mobile clipping; the final formula fits and retains the complete statement.

The chapter meets AUTHORING §2: each result has an interactive mathematical witness, controlled quantities and honest exact/numerical comparisons; numerical error diagnostics remain distinct from certified bounds. Status: accepted for mathematical/source fidelity, computational honesty, control handling and visual presentation. Root owns the final shared native/repository gates.
