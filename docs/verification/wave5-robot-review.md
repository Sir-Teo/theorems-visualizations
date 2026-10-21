# Independent ROBOT5 review

Status: **ACCEPTED**, all six frozen items and their source-aligned generated candidate.

## Actual sources and proof scope

Independently read the saved official Lynch–Park Modern Robotics chapter6, especially printed pp217–219 and225–232; inspected the rendered two-link and pseudoinverse pages. The annulus formula is independently derived rather than copying the apparent dimensionally inconsistent boundary typo on printed219. Read Buss's author-hosted survey §§3 and5 and inspected the actual regularized objective/equations10–11 page. Read the original FABRIK paper's CCD discussion and Algorithm1, including its rendered printed245.

Manocha–Canny1994 is a scanned original. Independently inspected rendered printed pp648–652, including §II.B's degree24 determinant, removal of the fourth power of1+x² and generic back-substitution, and §IV's special-arm rank8 discussion. The general16 bound is credited to this source, not claimed to be proved or attained by the special eight-branch widget. No benchmark timings are reused. No unresolved source flag is needed.

Analytic branch counts are modulo full turns, with a continuum at the equal-link folded origin. Newton's convergence claim is local with C² and nonsingularity hypotheses. The pseudoinverse minimizes the instantaneous residual and then norm; its null component is not claimed to preserve position after a finite step. Damping is the positive quadratic minimizer, with a singular-direction gain bound and no global convergence assertion. The six-revolute example includes tool orientation and explicitly distinguishes generic isolated solutions from singular representatives. CCD's exact coordinate nonincrease and FABRIK's completed base-restored constraints are separated from global convergence; the tip-fixed intermediate pass visibly moves the base. Zero-normalization fallback and numerical rank/wrist cutoffs are declared extensions/conventions.

Proof-use dependencies were checked. Before acceptance, the Newton Taylor estimate acquired pma5.15, the minimum-norm proof acquired the actual pseudoinverse theorem ladr7.75, and the6R source reference was corrected to §IV. No hidden future solver or general elimination implementation is assumed.

## Independent mathematics and repaired solver

Independent review found a substantive defect in the initial normal-equation implementation: near-straight undamped arms could have large tool-velocity residuals despite numerical rank2. The final solver uses pivoted twice-reorthogonalized QR of Jᵀ, right-space2×2 SVD and a direct full-rank undamped2×2 solve. It preserves actual residuals and the declared relative rank cutoff rather than hiding conditioning.

Final independent utilities and logs:

- `/tmp/wave5-robot-review-oracle.py`, final log of the same stem: **480 independent 85-digit pseudoinverse/damped references**, spanning2/3/4-link Jacobians, rotated nearly straight arms, truncation boundaries and damping. All numerical ranks agree. Maximum damped normalized error8.641e-13. Extreme undamped normalized errors reach1.000e-5 at severe conditioning and pass a declared50·epsilon·kappa budget; no uniform absolute precision is asserted.
- `/tmp/wave5-robot-review-null.py`: **450 independent 85-digit truncated orthogonal null-projector references**, maximum absolute difference1.056e-5 at extreme conditioning, passing100·epsilon·kappa. The physical residual and cutoff remain visible.
- `/tmp/wave5-robot-review-geometry.py`: **1,190 independent checks** using separately composed spatial rotations for all eight branches, complex-exponential planar positions/Jacobians, CCD coordinate monotonicity and FABRIK link/base/tip-phase/error invariants.

All 2,120 external comparisons were rerun after freeze and pass. Independently reran the **11 math/metadata groups**, pass. These external oracles are separate from the browser's fresh same-engine rendering/model consistency checks.

## Native and visual evidence

Independent `/tmp/wave5-robot-review-browser.mjs` consumes the actual generated candidate named by `/tmp/atlas-wave5-robot-candidate-export-path`, without catalog injection. **24 groups,536 physical actions and192 actual URL replay/rejection checks pass** at actual1200/320 CSSpx in both themes. Log `/tmp/wave5-robot-review-browser.log`; captures `/tmp/wave5-robot-review-production`. Minimum complete ink/marker clearance3.843CSSpx; glyph clearance3.261CSSpx.

All selectors, conditional controls, range endpoints, origin button, physical target handles and3D camera rotations pass. Complete statement/idea/caption/scope/readout text/formula bounds, full paths/arrows/circles/glyph halos/marker rings and native canonical range/model agreement pass. Edited/off-grid real Create state links, malformed/out-of-range/discrete rejection, folded/tiny targets, exact singular and1e-8 initial Newton states, four near-straight velocity states and coincident FABRIK target states replay exactly, including their readouts.

Personally inspected all12 narrow default widgets in both themes, rich Newton/pseudoinverse/general6R/FABRIK scopes, the complete damping readout/proof and wrist-pole/tip-fixed alternative captures. Joint-speed bars use their explicitly displayed live scale, retaining actual speeds in the readout. Log-error charts reserve complete endpoint-marker space and declare their plotting floor. Tall locator-only screenshots can truncate a final readout; the full-page capture contains its complete text. A sticky header in some scrolled full-page captures is a capture artifact, not fixed product content or a formula overflow.

Each item passes AUTHORING§2's seven criteria: theorem-specific hypotheses/conclusions, meaningful controls, visible controlled quantities, live numerical evidence, actual computation, both-theme legibility and responsive redraws. No unresolved mathematical, source, numerical, state or visual finding remains. Reviewer browser closed; preserve source freeze.
