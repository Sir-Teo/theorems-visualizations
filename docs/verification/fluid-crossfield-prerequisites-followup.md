# Fluid mechanics: five used prerequisites in existing arguments

This candidate reconciles five existing arguments with their exact written prerequisites and matching syllabus rows. It preserves all verify flags, visualization functions, model arithmetic and other properties. It does not close an original-source review.

The inventory was recomputed through `crossFieldInventory(await loadAll())` into own temporary files, without invoking the global-writing CLI. Fluid mechanics changes20→25 unique written-to-written cross-field prerequisites,23→28 written-to-known and31→36 whole-syllabus edges, with no unknown targets. Each application below was selected from the actual argument and model, independently of the count.

| Existing item | Exact written target read | Actual application and scope |
| --- | --- | --- |
| fluid1.4, steady streamlines/pathlines/streaklines | ode2.4, Picard–Lindelöf theorem | Local uniqueness under continuity in time and local spatial Lipschitz regularity, followed by autonomy, gives time-translated paths through the injector. The actual cylinder field is smooth away from the excluded origin. The prose limits the conclusion to where paths exist; continuity alone is not presented as sufficient for uniqueness. |
| fluid2.4, dry-parcel static stability | ode3.13, Order-n linear equations and the characteristic polynomial | The small-displacement constant-coefficient equation has roots satisfying λ²=−N². Imaginary roots give oscillations; real roots permit growth. This explains the linear comparison, while the displayed nonlinear trajectory retains its separately stated scope. |
| fluid2.9, steady Bernoulli head | vcalc2.7, Gradient and directional derivative | The unit tangent u/‖u‖ converts u·∇H=0 to zero change per unit distance away from stagnation points. The path derivative gives the equivalent time statement and a steady stagnation point has a constant path. The friction control remains a separate head-loss comparison. |
| fluid3.3, vorticity evolution | vcalc3.8, curl grad=0 and div curl=0 | These two printed identities remove conservative gradients and give divω=0. The remaining cross-curl expansion is stated independently, rather than attributed to an unstated rule in the target. Curling Euler gives the inviscid equation; adding constant-viscosity momentum diffusion gives the separate νΔω term for sufficiently smooth fields. The material-line analogy is explicitly inviscid. |
| fluid4.3, spatial constant in unsteady Bernoulli | pma9.19a, Zero derivative on a convex set means constant | At each fixed time, apply the zero-derivative result in interior convex balls and chain them along a polygonal path in a connected open fluid region. This is the connected-open extension explicitly explained in the written target; a disconnected region is not silently treated as having one constant. Time dependence of that constant remains explicit. |

Read the statement and argument of every exact target and the actual current fluid item and executable visualization. No planned or merely related link is substituted for a prerequisite.

## Bounded verification

Comparison with an immutable archive of parent `b5d0bdd` checks all53written fluid items: only the five intended idea/dependency pairs differ; every verify flag, visualization function, unowned property and other syllabus row is unchanged. No shared runtime or global inventory was edited.

Independent one-off checks cover500actual cylinder-field Jacobian norm cases (the analytic derivative norm is2/r³ away from the origin),61companion-matrix exponentials against the characteristic-root solutions,200directional/path derivative examples and80exact integer-polynomial curl-grad/div-curl/cross-curl/constant-diffusion identities. The connected-open application was checked against the actual polygonal-ball proof, rather than inferred from a numerical example. Script and log: `/tmp/atlas-worker-three/fluid-crossfield-evidence/verify.mjs` and `semantic-byteguard.log`.

Focused static checks: five items,0errors/0warnings. Isolated strict scratch build:6684written/6890planned/450chapters/85collections,0errors/0warnings; cycle and unknown-ID checks pass. Home output112710bytes gzip. Generated files remain exclusively under `/tmp/atlas-worker-three/fluid-crossfield-build`. Logs `static.log`,`build.log` are in the own evidence directory.

All ten fresh320px explanation checks (five items × both themes) pass for runtime, blank canvases, TeX and page bounds. Personally inspected every own final `fluid-{1.4,2.4,2.9,3.3,4.3}-idea-320-{light,dark}.png`; full-page counterparts are also retained. This proportionate prose-render check does not claim a new complete input/state/source audit of unchanged visualizations.

Reading also exposed one adjacent scope error in fluid3.3: its changing spin is called a steady flow. The coordinator authorized a separate tiny scope correction with independent analytic Euler residual evidence. This prerequisite candidate leaves that scope sentence unchanged so the two changes can be reviewed separately.

Independent acceptance of the five edges and central inventory updates remain the coordinator's responsibility.
