# ROBOT derivational prerequisites — producer follow-up

20 October 2026. Producer parent `421ca255c0a8f0097ea6cdc321a06aee929f4ed0`.
This candidate adds ten genuine mathematical prerequisites across nine written items. Independent acceptance is pending. No source-review closure or global accepted-count change is claimed.

## Exact additions and actual use

The producer read the actual target statements and proof ideas and the complete corresponding ROBOT statement/idea and visualization implementation. This batch appends explanatory proof prose and the matching dependency IDs, including the matching syllabus rows.

| Item | New prerequisite | Actual consumption |
| --- | --- | --- |
| 1.2 | pma-9.28 | At a regular configuration, an invertible constraint minor allows dependent coordinates to be solved locally in terms of free coordinates. The prose explicitly distinguishes infinitesimal Jacobian nullity at a singular point from finite mobility. |
| 2.6 | ladr-3.43 | Homogeneous maps compose by the product with matching intermediate frame bases, giving `T_ab T_bc` for points passing from c through b to a. |
| 2.9 | ladr-3.43 | Composition of twist-coordinate maps in matching intermediate bases gives the adjoint representation's homomorphism identity. The same combined conjugation represents both sides. |
| 2.10 | ladr-7.1 | Moving the linear frame map across the real Euclidean power pairing gives its transpose and the wrench transformation rule. Prose distinguishes the geometric map named Ad from the inner-product adjoint operation. |
| 4.1 | pma-9.15 | Applying the multivariable chain rule to the smooth matrix-entry pose map composed with a differentiable joint curve gives the partial-derivative sum. Trivialization by the pose inverse converts it to the twist/Jacobian. |
| 4.2 | ladr-7.1 | The adjoint identity applied to every virtual joint displacement uniquely identifies joint torque as the transpose Jacobian applied to the matching-frame wrench. |
| 4.3 | ladr-9.50 | The square Jacobian determinant criterion is exactly invertibility iff nonzero determinant. The explanation distinguishes the rank criterion required for rectangular task maps. |
| 4.6 | ladr-7.29 | Full row rank makes `JJᵀ` symmetric positive definite; the real spectral theorem gives the common orthonormal axes used for the reciprocal ellipsoids. |
| 4.6 | ladr-6.14 | Cauchy–Schwarz applied to the positive square root and inverse square root of `JJᵀ` proves the radial speed/force gain product is at most one, with equality for directions in an eigenspace. |
| 4.8 | pma-9.28 | A full-row-rank minor gives local dependent joint coordinates on a regular fixed-task level set. Differentiating its defining equation identifies its tangent with the kernel; finite tangent steps remain only first-order approximations. |

All targets are written mathematics items; ROBOT belongs to engineering. Local provisional inventory moves written-to-written **15 → 25**, written-to-known **15 → 25**, whole syllabus **30 → 40**, with no unknown targets. These remain candidate counts until independent acceptance.

## Preserved scope and bridges

All thirty written ROBOT objects, including actual function text, were compared against the producer's starting baseline. Every field, function, model and source flag is unchanged except the nine appended ideas and ten dependencies. Every syllabus row, including alias-only rows, is preserved except the corresponding additions. `content/robot/ch03.js` is byte-identical, including the accepted 3.7 camera and classical/modified convention treatment. No chapter helper or shared runtime is modified.

A repository search of `content/bridges` finds no ROBOT item references, including no reference to any changed ID. No existing bridge note requires a bounded update for this batch. New bridge curation would be separate coordinator-owned work.

## Independent calculations and actual pixels

The explicit-only audit `node tests/verification-robot-prereq-audit.mjs` imports no production math helpers. It checks:

- 150 rigid-map compositions and planar adjoint homomorphisms;
- 150 wrench-power identities under frame changes;
- 150 planar 2R directional chain derivatives, determinants and virtual-work identities;
- 150 rotated positive-definite families, each with 24 arbitrary directions and both principal axes, checking the spectral determinant, radial gain inequality and equality directions;
- 150 regular implicit circle constraints and their tangent derivative;
- explicit singular-constraint, noncommuting-order and wrong-transpose counterexamples.

These are honest finite model/identity checks, not replacements for the referenced general proofs. The explicit audit is outside the default `tests/*.test.mjs` suite.

`ROBOT_PREREQ_OUTPUT=<own path> node tests/verification-robot-prereq-prose.mjs` passes eighteen fresh 320 px light/dark native render checks. Every changed idea contains its prerequisite ID; actual KaTeX paint bounds and prose scroll width fit the viewport; runtime/TeX/blank checks are clean. The utility then isolates the actual idea, preserving width/typography, for robust full-idea and appended-paragraph captures. Producer personally inspected all eighteen changed-paragraph PNGs in both themes; text, equations and hypotheses are legible without overlap. There are thirty-six total idea/paragraph output captures. Since no visualization code or controls change, this is a prose/dependency audit and does not recertify all inherited native input behavior.

- Strict build: 6684 written / 6890 planned / 450 chapters / 85 collections, zero errors/warnings; local home 112717 gzip bytes.
- Static ROBOT check: thirty items, zero errors/warnings.
- Complete-object/function/sourceflag and full-syllabus guard: pass. The first temporary guard version accidentally added an `undefined` deps property to its own expected alias row; its expected-object construction was corrected and the full guard passed without any content change.

Evidence root `/tmp/atlas-robot-prereqs-evidence/`: `baseline.json`, `mapping.json`, `inventory.json`, `guard.mjs`, `byteguard.log`, `math.log`, `native.log`, `build.log`, `static.log`, `native/robot-<num>-{idea,changed}-320-<theme>.png` and personally inspected `contact-{0,1,2}.png`. Native servers use OS-assigned ephemeral ports. No global inventory output file was written.

Independent peer must review the exact immutable candidate, read the actual target proofs/consumer uses, verify the regularity and Euclidean/unit qualifications, independently check mathematics/preservation, rerun strict/static/narrow native prose and inspect its own fresh pixels. No source flags should change as part of this prerequisite acceptance.
