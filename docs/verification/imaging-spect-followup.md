# Imaging 4.5 — SPECT source and implementation audit

Status: source, mathematical, native browser and agent visual checks complete. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Sources actually inspected

- Kak and Slaney, *Principles of Computerized Tomographic Imaging*, [author-hosted book](https://www.slaney.org/pct/pct-toc.html), §4.2.1–4.2.2, printed pp. 135–142. Read the complete 14-page chapter excerpt, including attenuated emission Eqs. 24–30 and acquisition geometry. Local `/tmp/atlas-imaging-kak-ch4-2.pdf`, SHA-256 `7ccd835d74bd6802bfff3c9c9987eb5dce5f4c04acaebcfdf875783538d12095`.
- Wu et al. (2013), “Effects of attenuation map accuracy on attenuation-corrected micro-SPECT images,” *EJNMMI Research* 3:7, [primary article](https://pmc.ncbi.nlm.nih.gov/articles/PMC3579699/), DOI `10.1186/2191-219X-3-7`. Read the research Methods, especially “CT-based non-uniform attenuation correction for micro-SPECT”: Eq. 1 explicitly defines the mean transmission along projection lines; the following paragraph explicitly divides each voxel by its transmitted fraction. Local original HTML `/tmp/atlas-imaging-spect-primary.html`, SHA-256 `a050b45aca23eb8fa21aeedc1404ce51a29e9eeed57deb39971f81690fc2021d`. Its rodent accuracy findings are not applied to this body-sized illustration.
- Chang (1978), *IEEE Trans. Nucl. Sci.* 25(1):638–643, DOI `10.1109/TNS.1978.4329385`: bibliographic year/title/volume/pages checked against DOI metadata and the primary Wu reference list. Original IEEE full text was unavailable; no original-article reading is claimed. The stated multiplicative formula is supported directly by the inspected Wu Methods, rather than inferred from a title.

As a supplementary cross-check, read the complete relevant entry “Attenuation correction in SPECT using the Chang method,” *Encyclopaedia of Medical Physics*, second edition (CRC Press, 2021), p. 66, Eqs. A.34–A.36 in the publisher's preview. It agrees with mean transmission followed by pixelwise division. This secondary entry is not substituted for the primary Methods evidence above.

## Corrections and independent checks

The forward projector formerly gave every cell's emission the attenuation at its front face. It now integrates constant-cell activity through the cell exactly: `f (1−exp(−μh))/μ`, continuously limiting to `fh` at zero attenuation, before applying attenuation from intervening cells. Finite ray and raster sampling still introduce geometric error.

Chang factors apply only inside the known body. The text now explicitly calls both displayed corrections approximations for extended activity. It derives opposing-view cancellation for a point and gives a counterexample: a uniform extended chord is corrected to `2f sinh(μT/2)/μ`, which exceeds `fT` for positive attenuation. The default coefficient is labeled illustrative, removing an unsupported exact water/energy calibration claim. The profile includes negative filter excursions and high corrected values; the raw reference level remains visible alongside the normalized image/profile.

`node --test tests/verification-imaging-spect.test.mjs`: six groups pass—independent within-cell quadrature, analytic homogeneous slab attenuation, zero-attenuation opposing-view symmetry, analytic circle-centre Chang factor and exterior mask, ellipse exit geometry, and point versus extended conjugate correction.

`node tests/verification-imaging-spect.mjs`: both light and dark pass all three corrections at zero, default and maximum physical attenuation; finite readouts, correct physical input values, no runtime/TeX/blank-stage errors and all instrumented data within stage bounds.

`node scripts/check.mjs imaging-4.5 --static`: one item, zero errors/warnings.

Agent-inspected full screenshots `/tmp/atlas-imaging-spect-light.png` and `/tmp/atlas-imaging-spect-dark.png`. The corrected profile is visibly imperfect, consistent with the revised approximation wording; stages, equation, physical attenuation and normalization readout are legible. No human review is claimed or required.

The model has 48×48 activity cells, 64 detector bins, 96 projection views, 36 correction directions and noise-free data. It excludes scatter, collimator blur, detector sensitivity and heterogeneous attenuation. Image and profile edge normalization are for comparison and do not establish absolute activity calibration.
