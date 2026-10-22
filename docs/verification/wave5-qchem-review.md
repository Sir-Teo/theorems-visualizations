# Independent QCHEM 5 review — accepted

Status: independently accepted on the eight frozen author files in `/tmp/wave5-qchem-author-freeze-v1.sha256`, copied to `/tmp/wave5-qchem-peer-reviewed.sha256`. All eight hashes matched before and after the final review. The two original-body source flags remain required; acceptance does not mean those stopped historical bodies were read. The coordinator owns all product, syllabus and test files; this review owns this report and independent `/tmp` evidence only.

## Actual source and prerequisite reading

The reviewer read the cached McCullagh H₂⁺ matrix/integral passages (Eqs. 4.922–4.928), restricted H₂ Hamiltonian and product ansatz (4.980–4.984), CI normalized expansion and matrix setup (4.990–4.999), and the Morse potential definition. The reviewer independently confirms the documented H₂⁺ atomic-operator mismatch and the reversed ionic/covalent prose after 4.994; neither typo is a valid derivation input. Selected passages, not whole notebook bodies or all source numerical tables, were reviewed.

The reviewer read Sherrill's Born–Oppenheimer notes pp. 1–4 and personally inspected the cached one-page MO-diagram pixels. Its displayed sigma/pi order is one diagram, not a universal ordering theorem. The BO expansion explicitly produces derivative couplings; a single-surface model does not become exact merely because nuclei are heavy. Fermann–Valeev's cached author manuscript was read in the selected primitive normalization (pp. 7–8), s-overlap (p. 15), integration-by-parts kinetic discussion (p. 20), Laplace attraction (pp. 21–23), and ERI/Boys definition (pp. 25–26) sections. No full-body or general angular-momentum recurrence verification is claimed.

All twelve saved outside prerequisite bodies in `/tmp/atlas-wave5-qchem-inputs.json` were read. The available generalized Rayleigh–Ritz, electron antisymmetry, two-level, oscillator and Schrödinger inputs are distinct from the unwritten future BO alias. QCHEM 3.13 is Mendeleev classification and does not establish Lewis bookkeeping. Atomic Madelung ordering does not derive the stipulated molecular sigma/pi order. Existing alias 5.1 and unrelated chapter metadata must remain preserved.

The reviewer separately opened and read the actual [Purdue MO exposition](https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch8/mo.html), [OpenStax formal-charge definition](https://openstax.org/books/chemistry-2e/pages/7-4-formal-charges-and-resonance), [Simons Morse passage, printed pp. 197–199](https://simons.hec.utah.edu/ITCSecondEdition/chapter2.pdf), and [Luo et al. author-hosted abstract](https://scholarworks.gvsu.edu/chm_articles/6/). Purdue's helium-nonexistence simplification is not adopted; the abstract supplies a distinct empirical counterexample. Simons' loose terminal-level prose does not establish the exact strict threshold; the independent Laguerre/integrability derivation does. Reading scopes are recorded in `/tmp/qchem-peer-source-reading.json`. No whole Simons chapter or full helium paper reading is claimed.

Lewis 1916 and Heitler–London 1927 original bodies remain access-stopped and unread. Accessible modern calculations cannot clear their Paper flags. The modern Gaussian basis is not a reconstruction of the original 1927 Slater numbers. Previously stopped QM works and the rejected BIGHIST item were not revisited. No new source-body recovery was attempted.

## Independent numerical evidence

The current sixteen focused chapter/metadata tests were independently rerun: 16/16 pass (`/tmp/qchem-peer-focused-current.log`). The metadata group checks all thirteen frozen identities, full synchronized dependencies/references/see links/captions, exact alias 5.1 and both original-source flags. This is distinct from the following reviewer-authored calculations and from the author's separate 462-comparison oracle.

Reviewer utilities `/tmp/qchem-peer-export.mjs`, `/tmp/qchem-peer-oracle.py` and the provisional pending-Morse variant compare actual helper outputs with:

- Direct prolate-spheroidal angular/radial quadrature of STO overlap and attraction integrals at eight separations, followed by SciPy's generalized symmetric eigensolver and explicit overlap-metric norms.
- Independent Newton-shell angular averages of normalized Gaussian Coulomb densities, rather than the product's Boys implementation or the author's Fourier oracle. Twenty-four separation/exponent states include all 16 ERIs, one-electron integrals, a full four-product two-electron Hamiltonian/Gram matrix, normalized HL states, the CI eigenpair and explicit ionic cancellation.
- High-precision orthogonal two-site eigensystems, sigma-level shifts and ordering, spin means including tiny nonzero fields, finite orbital filling/electron counts, Lewis electron budgets and formal charges.
- Independent associated-Laguerre Morse eigenfunctions substituted into the differential equation, and exact half-integer threshold counts/binding gaps.

After the bounded Morse correction, all 1,608 comparisons pass, including all forty potential-value assertions. Maximum absolute error scaled by max(1,|reference|) is 1.007e−12. The original potential failure is retained in `/tmp/qchem-peer-oracle-initial-failure.log`; it is not counted as a pass. Final result: `/tmp/qchem-peer-oracle-final-models.log`.

A separate fresh SciPy tridiagonal solve matches 168 finite-grid eigenvalues for seven depth parameters and 160/320/640 interior nodes; maximum absolute difference is 1.213e−11. This validates the declared finite-box discretization, not the infinite-line Morse spectrum or a variational upper bound. Evidence: `/tmp/qchem-peer-grid.mjs`, `/tmp/qchem-peer-grid-oracle.py`, and `/tmp/qchem-peer-grid-oracle.log`.

## Findings and resolution tracking

1. The initial sigma upper-level subtraction erased a positive shift at coupling 1e−8. The author replaced it by a rationalized expression and discloses true floating underflow; the independent high-precision shift/order probes pass. Stable tiny spin mean and signed site charge/dipole calculations also pass.
2. Repaired: `morseModel` now uses `−expm1(−x)` rather than subtracting a rounded exponential. The original x=1e−10 relative error was approximately 1.66e−7. Independent potential checks now pass. Positive analytic binding is retained separately when the rounded energy equals the threshold; the consumer explains that limitation.
3. Repaired consumers were reread: N₂ now presents only its M=0 state; chapter-local scientific fallback preserves displayed nonzero spin/charge/dipole/CI values; the orbital legend identifies the selected amplitude. A requested seventeen-electron state is explicitly unsupported rather than silently clamped to a sixteen-electron occupation.
4. Repaired: the general HL statement now requires linearly independent functions, |S|<1. The chosen distinct-center Gaussian domain satisfies this automatically.

All thirteen drafted statements/ideas/scopes and current consumers were read after these repairs. The independent scalar and finite-grid batches contain 1,776 passing comparisons in total. No product file was edited by this reviewer. No remaining theorem or model issue has been identified. The synchronized metadata gate passes. Final actual state/Share replay and both-theme 1200/320 ink/text/visual gates pass as recorded below.


## Final independent native review

The reviewer used a separate `/tmp/qchem-peer-native.mjs` copy of the final author utility, with absolute imports and isolated evidence. It exercises the actual production renderer through in-memory catalog/shard overlays; generated data and shared runtime files were not edited. The source-aligned overlay includes actual Paper objects and historical introductions, rather than inferring a citation card from source length.

The fresh full matrix passes **52 distinct configurations**: all thirteen items at actual 1200- and 320-CSS-pixel widths in both light and dark themes. Counts are **888 counted physical actions, 400 URL-state checks and 268 actual Create-state-link/replay pairs**. A separate trusted DOM-click observer independently counted exactly 268 Create-state-link clicks. Log: `/tmp/qchem-peer-native.log`.

Additional sequential checks revisit already-covered configurations; they are overlaps, not additional distinct configurations:

| Focus | Configuration executions | Counted actions | URL checks | Actual Share pairs |
| --- | ---: | ---: | ---: | ---: |
| Signed MIN_VALUE/1e−200 CI angle, spin field and site offset; Morse equality/just-positive thresholds | 16 | 72 | 144 | 72 |
| Unsupported seventeen-electron state, both narrow themes | 2 | 2 | 4 | 2 |
| Physical reciprocal HL model/Paper navigation, both narrow themes | 2 | 6 | 2 | 2 |
| Physical reference button on every Lewis preset, both narrow themes | 2 | 36 | 12 | 12 |

Thus the full matrix plus **22 overlapping executions** contains **1,004 counted actions, 562 URL checks and 356 real Share pairs**. Independent trusted-click counts agree in every run. The critical probe contains 72 saved raw states, each replayed by an actual generated Share link. Logs: `/tmp/qchem-peer-critical.log`, `/tmp/qchem-peer-unsupported.log`, `/tmp/qchem-peer-links.log`, `/tmp/qchem-peer-references.log`; supplementary utility `/tmp/qchem-peer-supplement.mjs`.

All visible modes, physical slider endpoints, combined maxima, continuous off-grid states, unsupported integer fractions and malformed state URLs were checked. The generic malformed-codec and integer-domain rejection probes are not a claim that every imaginable malformed JSON shape was enumerated. Signed subnormal fields/offsets preserve the actual saved state and nonzero scientific readout; CI preserves its actual tiny angle. A just-positive Morse binding is distinguished from a rounded energy at threshold, and the finite grid is explicitly not a binding certificate.

Added reviewer assertions independently check actual selected energy markers against the elementary STO pencil, the minus-state mid-plane node, physical MO electron-arrow counts and parallel spin arrows, painted Lewis lone-pair electron/bond counts, actual exact-Morse rung counts/positions, both actual Paper citation cards/authors/year/title/venue/DOI hrefs, original-source links and sole flags, and reciprocal 5.6↔5.14 links. The two reciprocal links were also physically clicked and their fresh runtime checked before Share replay. Every Lewis reference restores the correct electron budget and terminal shells, including the six-electron boron exception.

Complete rich text, scope, formula, citation, readout height/width, glyph/halo and full path/dot/ring bounds pass after fonts/rendering. Minimum full selected-marker/ring clearance is **4.886 CSS px**; minimum glyph clearance is **3.116 CSS px**. No runtime, nonfinite-output, model/control disagreement, overflow or new product finding occurred in these final runs.

## Final pixels and preservation

The reviewer personally inspected all 26 narrow and 26 desktop default widgets in both themes, all 26 narrow combined-maxima plot captures, the eight MO molecule modes, both exchange-symmetry slices, all Morse resolutions, all six Lewis reference diagrams, signed subnormal/just-positive-threshold states and the unsupported seventeen-electron view. Both themes' full narrow Morse statement/scope/proof and both Paper citation/scope/proof pages were inspected directly in split full-page captures; no missing tail, literal-TeX or citation-card defect was found. Selected component captures were checked at their native size in addition to contact sheets. The triplet slice shows its actual coincidence node; the relative brightness and non-marginal scope remain explicit.

Evidence directories contain 388 PNG files in total: `/tmp/wave5-qchem-peer-production` (256), `/tmp/wave5-qchem-peer-critical` (104), `/tmp/wave5-qchem-peer-special` (28). Contact sheets are `/tmp/qchem-peer-contact-*.png`, `/tmp/qchem-peer-wide-*.png`, `/tmp/qchem-peer-max-*.png`, `/tmp/qchem-peer-rich-*.png` and the named MO/Morse/exchange/critical/Lewis/unsupported contacts. Cropped contact sheets do not replace the full-page sources or the full readout bounds checks.

A final independent deep comparison confirms all non-5 chapters and top-level fields equal `/tmp/atlas-wave5-qchem-syllabus-baseline.json`, exact alias 5.1 is preserved, and all thirteen complete authored rows match dependencies/references/see links/captions/Paper metadata/introductions/flags. Only 5.13 and 5.14 are source-flagged. The reviewer made no product, syllabus, test, shared, generated or Git changes.

All reviewer browsers and servers are closed and the one browser lane is explicitly released. **QCHEM 5 is independently accepted on the recorded frozen bytes**, with declared finite-basis, finite-grid, isolated-spin and historical-source limits retained.
