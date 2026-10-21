# DG5 independent review

Status: accepted on frozen source after independent source, model, native replay and visual review.

Reviewer: wave5_reviewer. No content changes by the reviewer.

## Sources and hypotheses

Independently checked the first-form and isothermal constructions against [Paternain's Cambridge notes](https://www.dpmms.cam.ac.uk/~gpp24/dgnotes/dg.pdf), and the general existence statement/proof against Paternain–Salo–Uhlmann, *Geometric inverse problems*, Theorem3.4.8 and Lemma3.4.13, printed pp.69–73, in the [author-hosted book](https://sites.math.washington.edu/~gunther/publications/GIP2D_driver%20(14).pdf). The earlier Salo course URL returned metadata but timed out for the actual passage; no acceptance relies on that failed retrieval.

The ten statements and proof ideas explicitly distinguish regular patches from arbitrary parametrizations, multiplicity from injective patch area, local from global isometry, and infinitesimal indicatrices from finite disk images. Cylinder periods, stereographic and Mercator excluded poles/cuts, and the Archimedes cylinder's open band are specified. The associate family preserves its metric by the conjugate tangent identities, while the isothermal theorem uses a genuine local elliptic existence input. Its plotted paraboloid is an explicitly inverted one-variable construction, not a general PDE solver. The inverse-function prerequisite is explicit where used.

## Independent model oracles

`/tmp/wave5-dg-review-oracle.mjs` passes with Node22:

- 300 graph/shear states: independently expanded E,F,G and Gram/cross-product determinant agree.
- 300 associate-family states: equal squared tangent norms and vanishing mixed coefficient agree; independently differentiated surface coordinates agree with the analytic tangents.
- 300 stereographic states: unit-sphere membership and the scalar metric factor agree.
- 300 height-coordinate states: sphere area density is1 and the reciprocal directional stretch factors agree.
- 300 paraboloid isothermal states: inverse radial equation, equal metric coefficients r² and zero mixed term agree.
- Five Mercator forward/inverse states agree. Offered length/area extrema were also checked directly against chart ranges.

Resolved correction: item5.6 initially classified scale1+10⁻¹⁴ as conformal by coefficient tolerance. The author now uses the exact mode/scale condition. Independent native replays preserve and distinguish1,1+Number.EPSILON and1+10⁻¹⁴ without a restore notice.


## Final browser and visual acceptance

Independently executed the existing chapter-local production renderer runner for5.4,5.6,5.8,5.10 at actual1200/320 widths in both themes:16 groups,172 physical control/camera actions and76 edited/off-grid/boundary/rejection replays passed. Log: `/tmp/wave5-dg-review-native.log`. Real Share-button URLs restore both captured state and readout. Full marker plus ring clearance was at least5.309203 CSSpx; canvas glyph plus halo clearance was at least3.117500 CSSpx. The check also covers complete statement, idea, caption, scope and readout text ranges and display-math inner bounds.

Inspected all20 final narrow default visualization captures across both themes, plus full production5.2 light and5.7 dark pages and focused anisotropic5.6/isothermal5.10 captures. Charts, legends, controls and readouts are legible, the mesh-refinement ratio now exposes its small variation, and the isothermal zero mixed coefficient retains marker clearance. Author's full40-group matrix is supplementary evidence, not the basis of the independent mathematical oracle.

The runner injects only this chapter's catalog/shard records in memory to exercise the actual production renderer without altering generated files. Root's source-aligned export/build gate remains the integration gate. No unresolved content finding or source uncertainty flag remains. Source bytes are frozen; no reviewer content edits.
