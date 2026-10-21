# Wave 5 — ODE chapter 5

Authored 2026-10-21. All 18 planned IDs, ode-5.1–ode-5.18, are present in `content/ode/ch05.js`, `ch05-b.js` and `ch05-c.js`; local examples and numerical routines live in `ch05.shared.js`. Chapter 5 syllabus rows were reconciled to the actual examples, references and proof dependencies. No existing verification draft, central plan, generated data, runtime or ledger was edited by this author.

## Mathematical/source audit

The main primary textbook account is [Teschl's official author PDF](https://www.mat.univie.ac.at/~gerald/ftp/book-ode/ode.pdf), consulted directly, rather than its table of contents or third-party paraphrases. Numbering below is the currently served preliminary author text.

| Items | Source checked | Hypotheses and distinctions retained |
| --- | --- | --- |
| 5.1–5.2 | §6.2, Theorem 6.1, Lemma 6.2, pp. 189–191 | Local lifetime domain versus complete group; inverse time map only on its image; C¹ or higher straightening only at nonzero velocity. The flow-box reference is **Lemma 6.2**, not a guessed Theorem 6.4. |
| 5.3–5.5 | §6.3, Lemmas 6.5–6.6 | Positive versus two-sided invariance; sequential alpha/omega definitions; compact trapping **inside the open state space**, completeness and connectedness. Boundedness that approaches a domain boundary does not suffice. |
| 5.6–5.7 | §6.5, definitions and Problem 6.16, equation (6.34) | Attraction is distinct from stability. The actual planar polar example has r′=r(1−r²), θ′=1−cos θ on the punctured plane. The unit-circle witness is solved exactly with cot(θ/2)=cot(θ₀/2)−t; its distance-two excursion proves instability for arbitrarily close starts. |
| 5.8–5.10 | §6.6, Theorems 6.13–6.15, Lie derivative equations (6.40)–(6.41) | Positive definiteness, nonpositive versus strict derivative; global claim additionally needs a proper potential. LaSalle requires compact positive invariance and convergence to the **largest invariant subset**, not every point with zero derivative. The pendulum is restricted to a compact sublevel component below barrier energy 2. |
| 5.11 | [Gautam Iyer, CMU 21-632, Lyapunov functions and Stability, Theorem 8](https://www.math.cmu.edu/~gautam/c/2026-632/notes/stability.html) | Chetaev is **not** found in the cited Teschl §6.6. The replacement primary course account supplies the positive region, zero boundary and strict derivative. The text proves the equivalent local positive-superlevel version; the wedge example is exact. |
| 5.12 | Teschl §8.1, Lemma 8.4 | Basin openness and invariance; the drawn straight separator is a property of this authored separable example, not every basin boundary. |
| 5.13–5.14 | Teschl §6.6, Problem 6.19 and Lie derivative | Gradient decrease forbids nonconstant periodic orbits. Point convergence additionally needs trapping and isolated critical points, rather than an unsupported blanket statement that every gradient orbit ends at a minimum. |
| 5.15–5.16 | Teschl §6.7, equations (6.43)–(6.47), Theorem 6.16 | Level sets can contain saddles and separatrices; critical levels are not necessarily periodic. Stable Newton equilibria use **strict** local minima. |
| 5.17 | Teschl §8.2, Lemma 8.8 and proof; §8.3, Theorem 8.10; §3.4, formula (3.91) | Pointwise flow determinant integrates divergence along each trajectory. Patch volume requires integrating that determinant over initial positions. One exponential factor works for this constant-divergence example; it does not replace a spatial integral generally. Theorem 8.11 in this edition is recurrence, not the cited volume formula. |
| 5.18 | [Publisher DOI landing record](https://www.tandfonline.com/doi/abs/10.1080/00207179208934253), plus modern Teschl §6.6 | Publisher search record verifies Lyapunov, title, 1892 memoir, Kharkov Mathematical Society and the 1992 translation context. Its landing page lists pp. 531–534 whereas the previous syllabus gave 531–773; no unverified page range is retained. Full dissertation/translation text was not accessed. This item explicitly calls its adjustable quadratic example an authored **modern reconstruction**. |

Dependencies follow the actual argument. In particular, the planned later `vcalc-8.7` prerequisite of 5.17 was replaced by the already written change-of-variables theorem `pma-10.9`, together with `ode-2.7` and `ode-3.11`; this does not pretend the later chapter was authored. Added dependencies on compact limit-set theory, continuous dependence and the chain rule are genuine proof inputs. Syllabus numbers and kinds are unchanged.

## Exact examples and numerical limits

Most plots use closed-form solutions. The bistable and gradient formulas retain every nonzero parameter via `expm1`, with a separate **exactly zero** parameter formula; no small nonzero parameter is silently replaced by zero. Candidate quadratic derivatives use an analytic whole-form criterion, with an explicit inconclusive label within 64 machine epsilons of the boundary. Sampled green dots are not used as a global sign proof.

Only the nonlinear strict Lyapunov and pendulum orbits use RK4. Their readouts show a half-step endpoint discrepancy and distinguish it from a rigorous error bound. The double-well Newton example uses velocity Verlet, shows maximum observed energy drift and an endpoint half-step comparison, and warns about separatrix sensitivity. The critical-energy button retains sqrt(1/2) as a floating value; proximity to the barrier is labelled “to floating precision.”

Off-grid button values (2π, sqrt(1/2), and 1+k²/4) use native `step="any"`, so their visible controls avoid step-grid snapping; native numeric serialization may round the last few binary64 digits. Shared phase panels cap their own exposed `Stage.el` at 620 px after verifying that API in `assets/js/viz/core.js`; no global stylesheet or runtime was changed. This prevents an isolated equal-aspect panel from expanding to roughly ±14 in x and shrinking its example. Coordinates in the straight chart and normalized-time excursion are explicitly labelled.

## Acceptance evidence

- `node --test tests/wave5-ode.test.mjs`: **11/11 passed**. These include independent finite-difference ODE residuals and semigroup checks, exact maximal-domain and excursion witnesses, a 20,000-angle quadratic-form extremum oracle, RK4 fourth-order step halving against the analytic oscillator, the nonlinear Lyapunov decay envelope, a pendulum energy/dissipation budget, second-order Verlet convergence against a fine RK4 reference, and independent determinant/shoelace area checks.
- `node scripts/check.mjs ode/5 --static`: **18 items, 0 errors, 0 warnings**.
- `node scripts/check.mjs ode/5 --shots --modes --jobs=1`, and the corresponding `--dark` run: **18/18 per theme**, no runtime, TeX, blank-canvas or quality warnings. Each theme produced 18 default and 9 alternative-mode screenshots in `shots/`.
- `node tests/wave-five-native.mjs ode`: **18 items, 72 theme/width groups, 320 real control actions** passed at 320/1200 px in light/dark themes. This was the initial author run; root independently reruns the matrix after final author freeze.
- `node tests/wave5-ode-layout.mjs`: supplementary 320 px checks for all 18 items × 2 themes, including clipped display formulas and raw readout TeX. It also checks real button-set native values for the three off-grid controls. The long original determinant equation was shortened after actual screenshot inspection exposed mobile math clipping; the replacement passes the clipping check.

The author inspected all 27 light and 27 dark harness screenshots, and the 36 native mobile screenshots, using local image contact sheets. Charts, legends, controls and readouts remain visible, with panels stacked at narrow widths. After the final coordinate/size/control corrections, affected items 5.1, 5.2, 5.7, 5.8, 5.14, 5.16, 5.17 and 5.18 were recaptured in both themes. The final 5.17 mobile statement screenshots are `/tmp/atlas-wave5-native/ode-5.17-{light,dark}-320.png`.

Ready for independent review. Finite numerical plots remain illustrations, with analytical hypotheses and certificates stated separately.
