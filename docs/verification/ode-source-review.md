# ODE source review: remaining chapter 3–4 checks

All eight flags received a mathematical statement/proof/model review against the full relevant authoritative text. A final follow-up removes the optional historical date/priority credits, leaving the verified mathematical statements and exact Teschl source locators. **All eight flags are closed.** Canonical theorem names remain; none is presented as verification of an unread nineteenth-century original. The historical gaps listed below record claims removed from the product rather than remaining verification blockers.

## Full source

Gerald Teschl, *Ordinary Differential Equations and Dynamical Systems*, author-hosted AMS preliminary full book, https://www.mat.univie.ac.at/~gerald/ftp/book-ode/ode.pdf, local `/tmp/teschl.pdf` and extracted text. Printed pages, rather than PDF indices, below. Read complete relevant theorem arguments, equations and scope, not search snippets:

- §3.4 pp.83–84, Eqs.3.88–3.97, Theorem 3.12: continuous A and g, invertible principal matrix, variation of constants proof.
- §4.1 pp.111–114, Theorems 4.1–4.2 (local analytic existence); §4.3 p.130, Theorem 4.7 and full continuation proof (analytic linear systems on a simply connected domain). The whole-disc guarantee requires this global linear continuation result, rather than the local existence theorem alone.
- §5.4 pp.157–160, Eqs.5.59–5.68, Lemmas 5.9–5.10: boundary-adapted solutions, correctly signed Wronskian Green kernel, inverse and compactness proof.
- §5.4 pp.160–163, Theorem 5.11, Lemmas 5.12–5.13 and Eqs.5.70–5.76: discrete simple spectrum, real eigenfunctions, complete expansion, quadratic form/form-domain uniform convergence and ground-state variational principle. Higher min–max follows from the full eigenfunction expansion by the stated subspace argument.
- §5.5 pp.166–170, Lemmas 5.14–5.16 and Theorems 5.17–5.18: full Prüfer-angle/zero-count argument, eigenfunction count and the Dirichlet-end shooting count. §5.5 p.173, Theorem 5.25, Weyl asymptotics under p,w in C¹.
- Previously source-aligned Rudin FA 4.25 supports the compact-operator alternative. The FA 10–13 reviewer independently checked Rudin 2 nd pp.328–329:12.29(d) gives the spectral expansion,12.30 the compact-normal characterization. ODE 4.9 prose identifies both; graph retains existing 12.30 because 12.29 is not yet an authored atlas node.

## Repairs and optional historical claims removed

|Item|Mathematical review/repair|Remaining source gap|
|---|---|---|
|3.12|Adds continuous A hypothesis and exact theorem/equation citation. Oscillator comparison interpolates RK 4 at the actual selected time, rather than rounding to a different sample.|Lagrange 1766–1810 and Duhamel 1830 s originals not obtained/read.|
|4.1|References global linear continuation theorem. Coefficient singularities bound the guaranteed disc, not every particular solution's continuation. Ratio estimates can oscillate; corrected the false assertion that both finite coefficient tests necessarily tend to the radius, and gives Cauchy–Hadamard limsup.|Cauchy majorant-method 1830 s–40 s original chronology not verified.|
|4.8|Nonzero boundary-adapted solutions specified; correct source is§5.4 rather than§5.3. Independently tested kernel symmetry, jump sign and uniform-load response.|Green 1828 original and later one-dimensional attribution not verified directly.|
|4.9|Coefficient regularity in preceding definition now explicitly includes continuous positive weight. Spectral expansion and compactness sources distinguished. Real/simple/orthogonal/complete conclusions checked; Weyl citation records the source's extra C¹ hypothesis.|Sturm/Liouville 1836–37 and Hilbert/Steklov chronology not verified in originals.|
|4.10|Uniform convergence uses form-domain Dirichlet conditions, without unnecessary Neumann/Robin derivative conditions. Completeness argument now uses a shifted resolvent when zero is an eigenvalue, covering the Neumann constant mode.|Fourier 1822 and claimed Steklov 1896 priority still unchecked.|
|4.13|Other separated conditions require boundary Prüfer phase, rather than a universal fixed offset for shooting zeros. Actual panel now retains genuine interior roots in the final cell; boundary root at a located eigenvalue is excluded.|Sturm 1836/Prüfer 1926 originals not read.|
|4.14|Quadratic form/variational proof checked. Explains that fitting five knots to the ground state approximates its quotient.|Rayleigh 1877/Fischer 1905/Courant 1920 originals not read.|
|4.15|Makes weight w=1 explicit so the unweighted compatibility integral agrees with the operator. Removes ambiguous ± sign from Green's identity and gives correct endpoint sign. Precise resolvent/eigenfunction/Lagrange identity references.|Fredholm 1900–03 originals not read.|

The existing root-owned Mathieu 3.18 fix and unrelated edits were preserved. The eight optional historical credits were subsequently removed, closing the eight source flags while preserving the fully verified mathematics. Historical originals listed above were not claimed to have been read.

## Validation

- `node tests/verification-ode.test.mjs`:six independent checks pass. Exact DD/NN/DN spectra including Neumann zero mode and weighted orthogonality; p/w and q/w spectral scaling; symmetric Green kernel, force jump and parabolic response; Fredholm sine projections; Rayleigh/modal bounds; actual near-endpoint zero-count regression.
- `node tests/verification-ode-browser.mjs`:16 light/dark item cases,60 native slider endpoint sweeps, every segmented option, native toggles/buttons,8 actual handle drags and drawing surfaces. Real KaTeX 0.16.11, no runtime/TeX/blank failures. All 16 baseline screenshots visually inspected in `/tmp/ode-contact.png`; full screenshots `/tmp/ode-verification-shots`, report `/tmp/ode-verification-browser.json`. A subsequent 10-case combined focused browser pass includes 4 ODEchecks of updated Cauchy–Hadamard text and final-cell zero counting/next-eigenvalue controls, both themes, without runtime or TeX failures; screenshots `/tmp/music-ode-focus-shots`.
- Joint ODE 3–4/music 7–8 static check:72 items, zero errors and zero warnings after removing the not-yet-authored 12.29 graph edge.
