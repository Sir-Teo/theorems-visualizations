# CTRL prerequisite proof connections — producer follow-up

20 October 2026. Parent checkpoint `4b959d65d5f2ab5877a410b7414c46a7805e54f4`.
This candidate adds twelve actual derivational prerequisites across eleven existing items.
It changes no source-review flags and claims no source closure. Independent acceptance is pending.
No global inventory, queue, MASTER, coordination metadata, shared runtime or bridge file is changed.

## Exact additions and consumption

The producer read each actual target statement and proof idea in the local atlas (not a title-only list), and the corresponding CTRL statement/idea and visualization implementation.

| CTRL item | Added prerequisite | Actual mathematical use |
| --- | --- | --- |
| 1.5 | ladr-3.8 | Composition order and associativity fix the block product; matrix multiplication need not commute, explaining the cut-dependent multivariable products. |
| 1.7 | pma-5.3 | The real scalar quotient rule gives `C/(1+PC)^2`; explicitly fixes the controller gain and excludes zero denominators. Complex frequency values use the same rational cancellation algebraically. |
| 1.11 | pma-5.3 | Differentiating the drag product `k_d v v` at trim gives `2k_d v_0`, hence the small-signal decay coefficient after dividing force by mass. |
| 1.12 | pma-5.5 | Differentiating the saturating composition gives `k sech²(kx+u)`, and the equilibrium identity reduces it to `k(1-x²)`, which determines local stability and the folds. |
| 1.13 | ladr-9.46 | The signed permutation determinant expansion, including splitting diagonal `1-G_ii` terms, gives disjoint directed cycles/self-loops and the alternating non-touching-loop sum. |
| 2.7 | ladr-9.51 | The determinant/eigenvalue equivalence turns the resolvent denominator into the statement about state eigenvalues, while preserving the possibility of input-output cancellation. |
| 2.8 | ladr-3.43 | Coordinate composition with matching intermediate bases gives the transformed realization and resolvent similarity; adjacent coordinate maps cancel in the transfer function. |
| 3.5 | pma-9.15 | The multivariable chain rule applied to a differentiable solution curve gives `DV(x)x' = grad V·f`, the defining derivative used by the certificate. |
| 3.6 | pma-4.16 | Continuous positive V has a positive attained sphere minimum; continuous strict derivative has a negative attained maximum on a compact annulus, supplying quantitative trapping/decrease. |
| 4.3 | pma-5.8 | Interior differentiable peaks are stationary. The derivative sign change certifies the first positive stationary time is a maximum; exponential decay orders later positive peaks. |
| 4.8 | pma-5.10 | The derivative supremum gives the Lipschitz bound, including the differentiable zero extension across time zero. |
| 4.8 | pma-6.13 | Integral triangle inequality on finite intervals, then the convergent improper limit, bounds the positive exponential average's error by the first moment `L/p`. |

The explanations are appended to each existing proof idea and the same additions appear in the matching syllabus rows. These are prerequisite uses, not related-topic links. All twelve target items are written in the mathematics field; CTRL is engineering.

## Preservation and counts

Baseline `/tmp/atlas-ctrl-prereqs-evidence/baseline.json` stores all fifty written CTRL objects with actual function text. The object comparison verifies every field, viz function, other function and source flag is identical except the eleven appended ideas and twelve dependency additions. The complete original syllabus is loaded from the parent commit and compared row by row; only matching dependency lists change.

The local `crossFieldInventory(loadAll())` result is **provisional**: written-to-written **13 → 25**, written-to-known **22 → 34**, whole syllabus **37 → 49**, unknown targets zero. Global accepted numbers must change only after independent acceptance. Output is `/tmp/atlas-ctrl-prereqs-evidence/inventory.json`.

Existing `content/bridges/feedback.js` uses 1.7 with the stability/sensor qualifications retained. Existing `content/bridges/stability.js` uses 3.5 with the level-set interpretation retained. Both notes remain consistent with these explanations; their claims and ordered walks do not change. Coordinator/peer owns any bridge revision if a substantive finding emerges.

## Independent producer calculations

`node --test tests/verification-ctrl-crossfield.test.mjs` passes six groups:

- 120 state-coordinate realizations: ordered matrix products, resolvent transfer invariance and characteristic determinants; explicit noncommuting witness.
- 300 quotient/product/chain calculations: sensitivity and drag derivatives and tanh fold equilibrium/slope.
- 200 four-node graphs: loop-cycle expansion, including self-loops, compared against independent pivoted elimination.
- 96 rotated positive quadratic forms: directional chain derivative and 36 sphere directions each against exact eigenvalue-derived extremal bounds.
- 144 underdamped oscillators: first stationary peak, sign change, exact overshoot and shrinking later positive peaks.
- 18,000 oscillator/time points: exact third-order versus second-order response and derivative supremum against the Lipschitz/integral error bound; signed-weight counterexample records why positivity matters.

These finite checks support the authored examples and identities; the referenced theorems and derivation establish the general statements. They do not turn finite sampling into a general proof.

## Build, static and actual native output

- `node scripts/build.mjs --strict`: 6684 written/6890 planned/450 chapters/85 collections; zero errors/warnings; home 112724 gzip bytes.
- `node scripts/check.mjs ctrl --static`: fifty items, zero errors/warnings.
- `CTRL_PREREQ_OUTPUT=<own dir> node tests/verification-ctrl-crossfield.mjs`: forty-four fresh 320 px light/dark captures: every changed idea and its appended paragraph. The screenshot step isolates the idea by hiding the other harness sections after native runtime/TeX/blank checks; it preserves the actual idea width and typography. Each actual prerequisite identifier appears; actual KaTeX paint bounds remain within the viewport and the idea's scroll width fits its client width; runtime, KaTeX and blank-canvas reports are clean.
- Producer personally inspected the whole-idea and appended-paragraph output PNGs through contact sheets. New prose remains legible in both themes; no clipped equation or overlapping text was seen. Only prose/deps change, so this batch does not certify all inherited controller inputs or reopen previously accepted source audits.

Evidence root: `/tmp/atlas-ctrl-prereqs-evidence/`. Logs: `math.log`, `native.log`, `build.log`, `static.log`, `byteguard.log`. Screenshots: `native/ctrl-<num>-{idea,changed}-320-<theme>.png`. Browser server used an OS-assigned ephemeral port. A first local viewport check omitted the harness's explicit `w` parameter and failed on its inherited default 860 px wrapper; the utility was corrected to `w=284` for a 320 px viewport and the complete check passed. No content layout was weakened to bypass that check.

Peer must archive the exact candidate into its own directory, personally read the target statements/proofs and CTRL use, rerun calculations/strict/static/native prose checks, inspect its own output pixels, and verify preservation independently. This report is producer evidence, not acceptance.
