# Interactive pictures for the fifteen written bridges

2026-10-19. Implements the existing-narrative portion of MASTER_PLAN §8's
“same picture, many guises” requirement. Each written bridge now starts with an
interactive canonical example, followed by its existing written journey.

## Behavior and mathematical scope

The picture has shared numerical controls and a named-context selector, a statement of
the chosen model, a numerical readout, explicit limits of the connection, and links to
written items in that bridge. Context changes identify the interpretation and, where
appropriate, change the displayed response, projection, units, samples or vector sign.
The controls act on model variables used to draw and calculate the picture.

The examples deliberately specify equations rather than imply every application is a
numerical copy of another. The following existing written statements and relevant scope
notes were read when choosing the models; the module's anchors link back to those items.
These links establish the local mathematical context. This work does not perform a new
primary-source audit of every linked item or close any item source-review flag.

| Bridge | Chosen canonical calculation | Written anchors and limits used |
| --- | --- | --- |
| Action | Kinetic action of `q(t)=t+a sin(πt)`, `J=1/2+π²a²/4` | `opt-1.4`, `mech-5.4`, `mech-5.2`: Euler–Lagrange stationarity; this positive quadratic is a minimum, while optical travel time and general stationary action use other functionals. |
| Causality | Two-stratum risks with different treatment-comparison weights | `demo-1.8`, `causal-1.9`, `causal-4.3`: standardization, consistency, conditional exchangeability and positivity; a pooling reversal supplies no identification assumption. |
| Contagion | Least fixed point of `exp(μ(s−1))` and its complement | `stoch-3.9`, `stoch-3.10`, `soc-4.2`: Poisson branching extinction equals the complementary limiting giant fraction for sparse Erdős–Rényi graphs; finite and heterogeneous networks differ. |
| Diffusion | Whole-line Gaussian with variance `1/4+2Dt` | `pde-1.4`, `pde-3.3`, `pde-3.15`: heat kernel, normalized diffusion and Brownian generator; finite boundaries and transport laws are outside this example. |
| Duality | Quadratic conjugate and nonnegative Fenchel–Young gap | `opt-3.7`, `thermo-3.7`, `opt-2.7`: supporting bounds and `F=−U*`; the free-energy sign is negative and its curvature concave. Ordinary thermodynamic temperature uses positive slope; negative slopes are mathematical examples. |
| Entropy | Binary entropy, Gibbs entropy in units of `kB`, and expected log loss | `info-1.2`, `thermo-6.6`, `deep-1.9`, `info-2.1`: convert bits/nats explicitly; excess expected loss is KL. This does not derive a second law or a heat cost. |
| Feedback | `P(s)=1/(s+1)`, proportional unity negative feedback | `ctrl-1.4`, `ctrl-1.8`, `physio-1.2`, `sysbio-2.2`: exact LTI tracking/load responses and local perturbation relaxation; a local gene/physiology reading is not the full Hill response or a delayed loop. |
| Fixed points | `g(x)=rx+(1−r)/2` and exact error `0.4rⁿ` | `pma-9.23`, `stoch-4.15`: contraction and a specified two-page self-link PageRank chain with uniform teleportation. Root iteration is `x−f(x)`, not general Newton iteration. |
| Fourier | Three-term sine polynomial, projection error and 32-point DFT | `pma-8.11`, `pma-8.16`, `music-4.4`, `algo-4.11`: orthogonality and Parseval for a finite signal. Frequencies through harmonic 5 are below Nyquist 16; no discontinuous-series convergence is claimed. |
| Harmonic | `u=x+a(x²−y²)`, off-center circle mean and signed gradient | `rca-11.3`, `rca-11.12`, `em-2.8`, `fluid-4.2`: zero Laplacian and mean value; electric field is `−∇u`, irrotational incompressible potential flow uses `+∇u`. No boundary-value geometry is solved. |
| Inverse problems | Two singular channels and ridge normal equations | `nla-3.1`, `nla-2.11`, `nla-2.13`, `imaging-3.8`: small singular values amplify noise, and the written ridge convention is a `λ²` penalty. The two-channel example is an imaging analogy, not CT acquisition. |
| Map distortion | Local cylindrical projection derivatives on a unit sphere | `geog-3.4`, `geog-4.2`, `geog-3.6`, `vcalc-4.5`: tangent indicatrix, Mercator/equal-area scales and Jacobian area. These are infinitesimal distortions, not finite shapes or ellipsoidal projections. |
| Spectral | Rotated positive matrix, quadratic contour and unit-mass modes | `ladr-7.29`, `ladr-7.96`, `mech-10.8`, `mech-11.4`: orthogonal eigenvectors and principal axes; mode frequencies `√λ` assume `M=I`. General modes instead solve `Ka=ω²Ma`. |
| Stability | Continuous scalar decay versus multiplier `1−ha` | `ode-1.8`, `ctrl-3.3`, `deep-4.2`, `pde-3.2`: Euler and quadratic descent agree exactly here, stable precisely for `0<ha<2`; the boundary alternates and nonlinear or general matrix systems need other analysis. |
| Symmetry | Cyclic addition and real rotation-matrix composition | `alg-3.13`, `xtal-2.2`, `music-8.1`, `rep-1.1`: triangle rotations, compatible hexagonal rotations and pitch classes; distinguish the full reflection group, forbidden twelvefold periodic lattice rotation and Noether's continuous-symmetry theorem. |

## Independent analytic checks

`tests/bridge-models.test.mjs` has 16 passing groups: one inventory/anchor check and one
mathematical group per bridge. Checks use numerical path differentiation and kinetic
quadrature, independent supremum optimization, a reconstructed joint population,
offspring-series summation and a known mean-two extinction root, Gaussian mass/second
moment quadrature and PDE finite differences, product-distribution entropy, numerical
integration of the feedback ODE, explicit Google-matrix iteration, direct Fourier
quadrature and DFT, off-center circle means and integrated normal flux, ridge normal
equations and objective perturbations, actual projection derivatives, eigenvector and
contour calculations plus finite-difference mode acceleration, explicit descent iteration,
and cyclic matrix/permutation composition.

## Native browser and visual checks

`tests/bridge-pictures.mjs` covers all 15 routes in light and dark themes at 1440 px and
320 px: 60 cases. Every case checks written journey retention, all source-anchor links,
every named context, native keyboard Home/End for every numerical control, every remaining
segmented choice, finite readouts, nonblank canvases, no page overflow and no runtime errors.
Test-only module instrumentation records the actual rendered dot coordinates/radii and
native stage transforms, and checks complete marker glyphs against each actual plot clip
at initial state, every context and every control endpoint. It includes marker ring width.

A separate fresh page holds the actual `bridge-viz.js` module response before it can mount.
The test navigates to About while the request is unresolved, releases it, waits for the
response, and verifies About remains the route/page with no bridge mounted or runtime error.
This exercises the lazy-import cleanup guard, rather than only navigating after a cached
module has already loaded.

Evidence is regenerated in `/tmp`:

- `atlas-bridge-pictures-native.json`: browser version, all 60 case results and delayed-module result.
- `atlas-bridge-picture-<slug>-<theme>-<width>.png`: each initial picture.
- `atlas-bridge-endpoints-<slug>-<theme>-<width>.png`: the final context with control endpoints.

All 60 initial screenshots were inspected using fifteen four-view contact sheets.
The narrow endpoint screenshots were additionally inspected after the plot-margin changes.
Controls, mathematical labels, scope text and source links are legible; the narrow stages
stack and the text wraps. Added plot margins keep action endpoints, the extinction point,
time-zero variance, zero Fourier power and discrete evolution markers completely visible.
Large unstable discrete values are normalized by an explicitly displayed scale.

Validation commands:

```sh
node --test tests/bridge-models.test.mjs
node tests/bridge-pictures.mjs
node --test tests/ui.test.mjs
node scripts/check.mjs --static --quiet
git diff --check
```

The 16 analytic groups, 60 native cases, delayed-module regression and six existing UI
regressions pass. Static validation reports 6,621 items, zero errors and zero warnings.

## Integration

`bridge-models.js` is a pure mathematical module. `bridge-viz.js` uses the existing
visualization runtime. The bridge page lazy-loads it after the written journey is ready,
destroys the runtime on navigation, and ignores an import that resolves after leaving.
The CSS is limited to the new picture card and responsive prose. No core runtime,
individual content module, bridge narrative, source-review flag, central ledger or
package script changes are included in this work.
