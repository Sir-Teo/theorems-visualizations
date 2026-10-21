# GEOL prerequisites — producer candidate, 20 October 2026

Fifteen genuine prerequisite edges were added across fourteen written GEOL items, with exact matching syllabus rows. Counts move from **10 to 25 written-to-written**, **21 to 36 written-to-known**, and **48 to 63 whole-syllabus**. These are producer counts pending independent immutable review; no global inventory or accepted ledger was changed. There is no source closure.

Every added target's actual statement and proof idea was read, alongside each complete consumer statement, idea and scope. Existing numerical expressions were checked where they establish the use: the plane-residual Gram eigenfit, chronological spherical rotations, geotherm antiderivatives, half-space thermal-deficit and heat-loss integrals, finite-plate modes, and the stress-free convection threshold. These links describe inputs already used by the models rather than claims of new physical realism or source verification.

| Consumer | Added target | Existing argument that uses it |
|---|---|---|
| geol-1.2 | pde-1.4 | Nondimensionalizing the heat equation gives the characteristic cooling scale L²/κ. |
| geol-2.2 | pma-8.6 | The inverse logarithm recovers elapsed time from the parent–daughter exponential. |
| geol-2.4 | ode-1.4 | An integrating factor solves the daughter equation forced by the decaying parent. |
| geol-2.10 | ode-1.4 | Constant production with linear loss gives the exposure-concentration saturation curve. |
| geol-3.3 | ladr-6.55 | Projection onto the boundary-normal line separates opening from tangential slip. |
| geol-3.6 | ladr-7.29 | An orthonormal eigenbasis turns the symmetric Gram objective into an eigenvalue-weighted average. |
| geol-3.9 | mech-10.1 | Each rigid spherical stage and its ordered composition is a proper rotation. |
| geol-4.1 | pma-6.21 | Integrating the layer gradient gives its temperature drop and additive resistance. |
| geol-4.2 | pma-6.21 | Successive finite-interval integrations recover flux and temperature from heat production. |
| geol-4.3 | pma-5.5 | Chain-rule substitution reduces the half-space diffusion PDE to the Gaussian-profile ODE. |
| geol-4.4 | pma-6.22 | Integration by parts evaluates the error-function deficit area, followed by its justified infinite limit. |
| geol-4.5 | pma-6.20 | Differentiating the Gaussian upper-limit integral gives the error-function derivative. |
| geol-4.5 | pma-6.19 | The positive-age substitution t=u² removes the integrable heat-loss singularity before taking the zero-age limit. |
| geol-4.6 | pde-4.1 | Zero-boundary Dirichlet sine modes give the plate's eigenvalue decay rates. |
| geol-4.7 | pma-5.8 | Interior stationarity, derivative signs and divergent endpoints locate the global neutral-stability minimum. |

The additions state their actual assumptions. Diffusion gives a characteristic time rather than a latent-heat freezing calculation; logarithmic dating still needs closure and positive parent abundance; coincident decay constants use the integrating-factor integral rather than a singular difference formula. The Gram minimum may be degenerate, and chronological rotations need not commute. Finite-interval integral theorems are not silently extended to infinity or the singular age endpoint: the explanation states the convergent limit or vanishing boundary term separately. The first plate mode and the convection threshold retain their chosen thermal and mechanical boundary conditions.

## Checks and preservation

- `node tests/verification-geol-prerequisites-math.mjs`: **4,800 independent identity/witness cases**, with no imports from GEOL numerical helpers. Includes diffusion scaling, inverse dating, direct source-integral ODE solutions and equal-rate limit, velocity projection, Gram eigenvalue witnesses, noncommuting proper rotations, layer and source geotherm integrals, chain-rule diffusion reduction, direct Gaussian-tail area quadrature, the singular-age substitution, Dirichlet mode identities, and the onset curve's derivative sign and global minimum.
- `node tests/verification-geol-prerequisites.mjs`: **28 fresh native cases**, all fourteen changed explanations at an actual **320px viewport**, both light and dark themes. No runtime, TeX or blank failures; each explanation and its inline mathematics fit. All 28 complete output PNGs were personally inspected for legibility, clipping and overflow. Browsers closed after testing.
- The first native run caught an **inherited 9px horizontal overflow** in 4.2's existing exponential-geotherm display. That same equation is now split into two aligned lines; its algebra is unchanged. The fresh full 28-case rerun passes. This is the only change to the previous explanation text; all other additions append the prerequisite's concrete use.
- `node scripts/build.mjs --strict`: **0 errors, 0 warnings**, 6684 written / 6890 planned / 450 chapters / 85 collections. Static checks of all fourteen changed IDs: **0 errors, 0 warnings**.
- Explicit temporary guard `/tmp/atlas-new-imaging-source/geol-guard.mjs`: **48 full item objects and 48 visualization functions** preserved except owned ideas/deps. Module source outside those fields is byte-identical; shared helpers, source-audit files and metadata are byte-identical; every source flag is unchanged. It checks every one of the fourteen exact expected syllabus dependency lists, and confirms all other syllabus data is unchanged. The 4.2 formatting exception is checked after removing only the alignment markup. This snapshot guard is not a default test.
- No existing bridge steps reference the changed IDs. No bridge, shared runtime, global inventory, accepted ledger or old checkout was edited.

`geol-prerequisites-evidence.json` records the exact mapping, counts, log paths and SHA256 of each of the 28 screenshots. Raw output is under `/tmp/atlas-new-imaging-source/geol-prerequisites`; logs use the same GEOL prefix. Both new verification probes are explicit-only. Independent peer acceptance remains required. Existing historical, source and model scope claims have not been re-audited or promoted by this prerequisite batch.
