# Differential geometry: quadrics and orientability — 2026-10-17

Resolved `dg-4.10` and `dg-4.14`, closing the differential-geometry source queue. **789 source reviews remain**. Wave 5 remains gated.

## Primary mathematical sources

- [U.C. Riverside, *Classification of quadric surfaces*](https://math.ucr.edu/~res/math10A/quadrics.pdf), pp. 1–2: the rigid-coordinate reduction, treatment of linear terms in the nullspace, and classification by rank/sign/constant. SHA-256 `405190458ac9bd97db8c954865a9361d79dbccfc60b746c944d9ee706352c266`. This author's mathematical exposition supports the classification; no historical-priority claim is inferred. The table's rank-one parabolic-cylinder row has a displayed example with two squares; our implementation uses the rank-one form `x²=z`, as the algebra requires.
- [Guillemin and Pollack, *Differential Topology* (1974)](https://www.math.auckland.ac.nz/~hekmati/Books/GP.pdf), §2.5, printed pp. 87–90/PDF pp. 101–104, and §3.2, Exercise 13, p. 104/PDF p. 118. Read the separation argument, the explicit off-surface/transverse-ray conditions, and the orientability consequence. The theorem does not assume orientation. Inspected the theorem and parity statement on the original printed p. 89. SHA-256 `e4d815443ae77128b1bc977d11f3f628527e3371341676c1d1a3bcf5f7097b58`.
- Cross-checked do Carmo, §2.7, Remark 2, and Gururaja–Subhash, *The Mathematics Student* 87 (2018), pp. 99–108, especially pp. 107–108 ([journal issue](https://www.imsc.res.in/~amri/knuth-moves-ims.pdf)). The latter gives the orientation-reversing-loop/transversality proof and nonembedding consequences. Its source is an expository proof, not the 1969 original. Removed unsupported Euler/Jordan/Brouwer chronology and the unsourced priority wording; the retained citations identify the texts actually checked.

## Quadric corrections

The original description mixed nonsingular surfaces with singular/lower-dimensional/empty cases, and claimed more generality than the available rotations and linear term provide. The new text separates rigid diagonalization from length-changing coordinate scaling, includes the residual nullspace linear term, and gives the displayed square-completion shift explicitly:

`z_center=−ell/lambda3`, `k_effective=k+ell²/lambda3`.

Rank and inertia classify the resulting equation. Rank-zero settings have degree below two and are labeled accordingly. Nonempty nonzero central levels are regular; zero levels need separate examination. Removed the unsupported Euler attribution and broad Pressley chapter pointer.

A sign-change mesher cannot recover a double plane, positive-definite zero-level point, or semidefinite zero-level line. These cases now render analytically. Plane polygons and line segments are clipped to the actual display cube after rotation. Parallel/intersecting planes, shifted centers, and an all-space setting are handled explicitly. An empty full solution set is distinguished from geometry absent/unresolved in the finite display box. The camera range includes the entire cube under rotation.

## Orientability and ray corrections

Added the nonempty, embedded, smooth and boundaryless hypotheses. Without boundarylessness a compact Möbius strip would be a counterexample. The outward normal follows by choosing the exterior local side smoothly. Jordan–Brouwer applies to the embedded compact surface; it does not justify the old inside/outside labels or purported outward field on the self-intersecting Klein bottle.

The three embedded examples now use analytic ray intersections and normals, rather than parity counts and a fixed 0.06 displacement on an approximate mesh. Their negative implicit sublevels are the bounded insides:

- Sphere: `x²+y²+z²−1`.
- Torus: `(sqrt(x²+y²)−1.2)²+z²−0.55²`.
- Double torus: `(x²−x⁴−y²)²+z²−0.03`.

Sphere roots are quadratic; torus roots follow by solving for radial distance; double-torus roots follow by setting `q=±sqrt(0.03−z²)` and solving a quadratic in `x²`. The gradients give outward normals. Raw intersection parity is asserted only for transverse rays starting off the surface. Boundary points and tangent contacts have separate labels. Meshes/section segments remain explicitly finite approximations. The section and probe ranges include the full torus; the 3D range includes probe, ray and normals.

For the double torus, write `q=x²−x⁴−y²`. Critical values of `q²+z²` are 0 and 1/16, so 0.03 is regular. Its sublevel is bounded. At `a=sqrt(0.03)<1/4`, the planar region `−a≤q≤a` is a disk with two holes: `q≥−a` bounds one outer oval and `q>a` removes two interior ovals. The surface is the double of that region, hence has Euler characteristic −2 and genus 2. This justifies the example's topology independently of its triangulation.

The Klein parametrization satisfies `F(u,0)=F(u,pi)=(cos u,sin u,0)` with distinct tangent planes. Its seam identification `(u+2pi,w)=(u,−w)` reverses parameter orientation, explaining the abstract surface's nonorientability. Its mesh intersections no longer imply a global inside/outside or outward-normal field. The red circle is shown in the 2D section only when its height is zero.

## Checks

- `npm test`: 47 math, 20 science-kit and 66 verification tests pass. New cases cover every rank/sign/linear type, shifted degeneracies, exact plane/line coordinates and clipped-empty distinctions. Analytic ray roots satisfy the original equations; normals cross from negative to positive level, transverse parity matches independently evaluated location, and tangent/boundary cases remain distinct. Klein seam/tangent-plane checks pass.
- `node tests/verification-dg-surfaces.mjs`: four light/dark scenario groups. All seven quadric presets, tilt/coefficient/linear endpoints and levels; visible point, line and double-plane degeneracies; all-space/empty cases; all four surface selectors, height endpoints/zero and actual probe/camera drags. Tests check actual displayed roots, normals, boundary/tangent labels and Klein section-circle behavior.
- Two-item light/dark mode checks pass with no runtime, TeX, blank or quality warnings. Inspected direct double-plane, tangent-ray and Klein displays. No audio controls occur in either entry.
- Strict build/full static checks pass: 6,684 items, 6,890 planned, 450 chapters and 6,621 visualizations, no warnings/errors. Chapter 4 and both reviewed entry smoke routes pass.

Tests supplement the source-based classification/separation arguments; the mesh is not used to prove a theorem about smooth surfaces.
