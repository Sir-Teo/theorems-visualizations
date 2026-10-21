# Independent XTAL5 review

Status: **ACCEPTED** on the final frozen source bytes. Covers all six chapter items.

## Sources and scope

Read [Authier's IUCr pamphlet](https://www.iucr.org/what-we-do/education/pamphlets/reciprocal-lattice), especially §§2.1–2.2 and 3.2, including its explicit noncoprime-index distinction; checked the official [Brillouin-zone definition](https://dictionary.iucr.org/Brillouin_zone). Read [Guillemin's MIT notes](https://math.mit.edu/~vwg/classnotes-spring05.pdf), §4, normalization, completeness and L² conclusion; and [Barvinok's lattice notes](https://sites.lsa.umich.edu/barvinok/wp-content/uploads/sites/1434/2025/05/latticenotes669.pdf), §17.1–17.2, cycle-frequency transform and covolume factor.

The chapter consistently uses a_i·b_j=delta_ij and cycle frequency. Phase-plane spacing and occupied-plane spacing are distinguished using gcd, including undefined zero indices. FCC/BCC duality and their different Voronoi polyhedra are computed rather than interchanged. The Fourier theorem asserts mean-square convergence with normalized cell measure; the pulse can overshoot. The infinite comb identity is distributional, while the finite patch is a normalized exponential sum. Its peak height is not confused with the infinite-comb covolume weight. Proof ideas justify the bounded neighbor cutoff, tensor-product completeness and Schwartz periodization; the prerequisites match those inputs.

## Independent numerical checks

Reviewer-only utilities `/tmp/wave5-xtal-review-data.mjs` and `/tmp/wave5-xtal-review-oracle.py` passed **708 independent comparisons**: SciPy convex hull volume and analytic vertex sets for eight scaled polyhedra; 360 zone numbers by exhaustive independent nearest-point distance counts; complex pulse Fourier coefficients and spectral-tail errors; 243 direct full exponential sums with seeded row shifts; and coupled-Gaussian Poisson identities on three skew cells. These computations do not use the application's clipping, hull or Fourier-sum implementations as their oracle.

Also independently ran all eleven chapter math groups: pass.

## Native and visual checks

Independent final production run: **24 groups, 308 real native actions, 124 actual URL replay/rejection checks**, at 1200/320 CSSpx in both themes. Reviewer-only utility `/tmp/wave5-xtal-review-browser.mjs`, log `/tmp/wave5-xtal-review-browser.log`, captures `/tmp/wave5-xtal-review-production`. It reuses the bounded chapter-local production adapter and adds independent combinations. All complete text/formula, canvas glyph, conservative arrowhead/path/poly ink, dot/ring and handle-halo bounds pass; minimum full geometry/ring clearance 6.810 CSSpx and glyph clearance 1.842 CSSpx.

All segmented modes, conditional ranges, endpoint states, Bragg-plane toggle, physical handles and camera were exercised. Exact saved gcd h=k=2, square-lattice Bragg tie k=(0.5,0), and a perfect reciprocal peak were then loaded and checked against the correct occupancy/tie/unit-intensity readouts, followed by real Create state link replay with exact snapshots and equal readouts. The zero-index branch is deliberately undefined, rather than a numerical failure. Off-grid edits and malformed/out-of-range URL rejection also pass.

Personally inspected all twelve narrow default widgets in both themes, noncoprime planes, exact boundary and peak captures, BCC's rhombic dodecahedron, off-lattice mode, row disorder, and actual 320px rich Fourier-series/comb statements and scopes. Text and mathematics fit; polyhedra, raster categories, probe rings and coefficients are legible. The disorder scope now calls its deterministic finite seeded sample pseudorandom.

AUTHORING §2: all six items pass the seven qualitative criteria (specific content, interaction, visible controlled quantity, legibility, honest calculation, both-theme palette, responsive redraw). Basis handles, occupied planes, computed 3D cells, zone probe, Fourier projections and finite diffraction supply distinct interactions. No unresolved source, mathematical, state or visual finding remains. No uncertainty flag is needed.
