# Independent CM5 review

Status: **ACCEPTED** on the final frozen source bytes. Covers new items 5.2–5.6; existing 5.1 alias is outside this review.

## Sources and scope

Read Arovas's actual UCSD [mean-field chapter](https://courses.physics.ucsd.edu/2025/Spring/physics210a/LECTURES/CH07.pdf), §7.13.2 equations 7.407–7.414, and the saved official [magnetism chapter](https://courses.physics.ucsd.edu/2014/Winter/physics211b/LECTURES/CH04.pdf), equation 4.90 and printed p.47 equations 4.271–4.275 (render inspected). Checked [Grünberg's original Nobel lecture](https://journals.aps.org/rmp/pdf/10.1103/RevModPhys.80.1531), printed pp.1535–1537, including Fig.10 and the distinction between an ideal short circuit and real finite scattering. Read/render-inspected [Coleman's original chapter](https://boulderschool.yale.edu/sites/default/files/files/coleman_wiley.pdf), printed pp.7–8, weak-coupling logarithm and screening regime.

The effective Ising and dimer Hamiltonians are postulated; later exchange theory is not silently required. Uniform longitudinal Ising susceptibility has the correct plus denominator and cusp. The thermal magnon calculation is explicitly three-dimensional and separated from its chain dispersion illustration. GMR uses finite positive spin channels. The dimer already has a finite molecular charge gap at U=0 and claims no bulk Mott transition. Kondo coefficients are synthetic; the displayed window presumes temperatures above the screening scale. Supplied derivations and listed prerequisites support the actual claims.

## Independent numerical checks

Reviewer-only utilities `/tmp/wave5-cm-review-data.mjs` and `/tmp/wave5-cm-review-oracle.py` passed **198 comparisons at 75 decimal digits**, maximum relative discrepancy 6.02e-13. These use mpmath rather than the application eigensolver: critical and nextfloat Ising roots, full four-orbital fermionic N=1/2/3 Fock Hamiltonians and double occupation, the gamma–zeta Bose coefficient, finite resistor network conductance, and Kondo minima including positive subnormal coefficients. The Ising critical branch remains nonzero at theta=1−2^-53.

Also independently ran all nine chapter math/metadata test groups: pass. These include additional finite-field response and hopping-matrix checks; acceptance will not rest on author tests alone.

## Native and visual checks

Independent actual production run: **20 groups, 424 native actions, 140 actual URL replay/rejection checks**, at 1200/320 CSSpx in both themes. Reviewer utility `/tmp/wave5-cm-review-browser.mjs` writes captures only under `/tmp/wave5-cm-review-production`; log `/tmp/wave5-cm-review-browser.log`. It reuses the chapter-local production adapter and adds conservative complete arrowhead bounds and raw boundary cases. Full text/formula bounds, glyph extents, dot/ring and path bounds pass; minimum marker/ring clearance 0.810 CSSpx and glyph clearance 1.376 CSSpx.

All modes, conditional controls and visible range endpoints were exercised. Raw theta=1−2^-53, 1, 1+2^-52 and magnetic coefficient b=0/MIN_VALUE/1e-200/1e-20 survive exact model snapshots and real Create state link replay, with matching readouts; tiny positive minima remain outside the displayed window rather than becoming the b=0 branch. Edited/off-grid values and malformed/out-of-range rejection also pass.

Personally inspected all ten final narrow widget defaults across both themes, the 3D thermal, logarithmic gap and Kondo component modes, and full-size 320px statement/scope/caption captures for magnons, Hubbard and Kondo. Graphs, probability bars, units and scientific axis labels are legible; rich mathematical content fits. The actual title of Grünberg's primary paper was corrected in authored and syllabus references before freeze.

AUTHORING §2: all five items pass all seven qualitative criteria (specific content, interaction, visible controlled quantity, legibility, honest calculation, both-theme palette, responsive redraw). The five models have distinct interactions and outputs. No unresolved source, mathematical, state or visual finding remains. No uncertainty flag is needed.
