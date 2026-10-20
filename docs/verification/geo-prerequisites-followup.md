# GEO prerequisites — producer candidate, 20 October 2026

This is **Atmosphere & Ocean Dynamics**, field earth / area climate, as defined by `content/geo/collection.js`. Fifteen used prerequisite edges were added across fifteen written items and their exact syllabus rows. Producer counts move from **10 to 25 written-to-written**, **15 to 30 written-to-known**, and **31 to 46 whole-syllabus**. Independent immutable review is still required; no global inventory or accepted ledger was changed, and there is no source closure.

All added target statements and proof ideas were read, together with the complete consuming statements, ideas and scopes. The new explanation states the concrete mathematical step already used by each argument. All previous prose is retained and all numerical models are unchanged.

| Consumer | Added target | Actual proof/model consumption |
|---|---|---|
| geo-1.1 | ode-1.3 | Separating the positive-pressure hydrostatic ODE gives its logarithmic integral. |
| geo-1.3 | pma-8.6 | Logarithm/power identities convert the integrated dry adiabat to potential temperature. |
| geo-1.4 | mech-4.2 | A positive constant linearized buoyancy coefficient gives harmonic motion and its period. |
| geo-1.7 | mech-3.2 | Buoyancy work per unit mass gives the ideal CAPE kinetic-energy increment. |
| geo-1.9 | vcalc-2.11 | The second-order directional density term controls the local mixture-versus-endpoint density difference. |
| geo-2.2 | rca-0.3 | Complex exponential differentiation verifies the inertial-oscillation solution. |
| geo-2.4 | pma-5.15 | Taylor expansion of sine gives the beta-plane term and an absolute remainder bound. |
| geo-2.5 | mech-3.4 | Centrifugal acceleration is minus the gradient of its effective potential per unit mass. |
| geo-2.6 | mech-2.9 | Zero axial torque conserves the ideal contracting ring's absolute angular momentum. |
| geo-2.7 | vcalc-3.8 | Curl of the pressure gradient vanishes for smooth pressure and constant density. |
| geo-3.4 | pma-9.41a | Commuting horizontal and log-pressure derivatives lets hydrostatic balance derive thermal-wind shear. |
| geo-3.5 | pma-6.21 | Integrating the shear gives the wind increment and the maximum at its sign change. |
| geo-3.9 | pchem-3.3 | Carnot efficiency is the input to the distinct dissipative-heat recycling factor. |
| geo-4.2 | pma-6.21 | Integrating the stress derivative gives its endpoint stresses and transport balance. |
| geo-4.5 | ode-1.4 | Solving the fixed-coefficient vorticity ODE gives exponential spin-down and its e-folding time. |

Important hypotheses are explicit in the appended explanations: positive absolute temperatures/pressures; small displacements and a locally constant buoyancy coefficient; net rather than buoyancy-only work when other forces act; smooth density and a conditional sign of the mixing-direction Hessian term; latitude-dependent relative beta-plane error; torque-free ideal contraction versus separately prescribed swirl loss; constant density in the pressure-curl step; twice continuously differentiable geopotential; and vanishing lower stress plus convergent transport before the infinite-depth limit. The cyclone addition distinguishes Carnot efficiency from the larger recycled-work/heat ratio. None of these additions validates the historical or empirical claims already present in the collection.

The initial candidate used pma-8.6 for the complex inertial solution; rereading the exact derivative theorem identified rca-0.3 as the more direct input. The final row, explanation and complete native rerun use rca-0.3. A contemplated vector-product dependency for the Taylor–Proudman step was excluded because that target states scalar-times-field rules rather than the required constant-vector cross-product identity.

## Verification and preservation

- `node tests/verification-geo-prerequisites-math.mjs`: **4,437 independently constructed checks**, importing no GEO numerical helpers. Tests include a non-isothermal separated hydrostatic integral, dry-adiabat invariance, harmonic buoyancy and work, both signs of a quadratic mixture-curvature witness, inertial rotation/damping energy, absolute Taylor remainders including equatorial cases, numerical potential gradients, contracting-ring invariants, polynomial pressure curl and mixed-partial identities, integrated sign-changing shear, recycled Carnot work bookkeeping, finite stress endpoint integrals and their lower-stress limit, and one-/two-lid spin-down coefficients.
- `node tests/verification-geo-prerequisites.mjs`: **30 fresh native cases**, all fifteen changed ideas at an actual **320px viewport**, light and dark. No runtime, TeX, blank-panel or changed-explanation overflow errors. All thirty complete output PNGs were personally inspected; prose and mathematics are legible without clipping. Browsers closed after the probe.
- `node scripts/build.mjs --strict`: **0 errors, 0 warnings**, 6684 written / 6890 planned / 450 chapters / 85 collections. Static checks of all fifteen changed IDs: **0 errors, 0 warnings**.
- Explicit temporary preservation guard `/tmp/atlas-new-imaging-source/geo-guard.mjs` checks **all 34 complete item objects and all 34 visualization functions**, allowing only the owned appended ideas and exact new dependencies. Module text outside ideas/deps, all shared and source-audit helpers, metadata and all source flags remain identical. It compares the **full expected dependency list of every one of the fifteen changed syllabus rows** and proves all other syllabus data unchanged. This guard is temporary and explicit-only, not a default test or source gate.
- Existing bridges were checked for every changed ID: no bridge consumers. No shared runtime, global inventory, accepted ledger, GEOL candidate files or old checkout were edited.

Exact mapping/counts, raw log paths and SHA256 hashes of all thirty own screenshots are in `geo-prerequisites-evidence.json`. Raw outputs are under `/tmp/atlas-new-imaging-source/geo-prerequisites`. Both committed verification scripts are explicit-only. This report records producer evidence, with separate independent review still pending.
