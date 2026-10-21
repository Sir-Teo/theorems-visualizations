# Imaging 4.10 — Patlak source and implementation audit

Status: source, independent mathematics, native browser and agent visual checks complete. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Source

Read the complete original seven-page article through the publisher PDF: C. S. Patlak, R. G. Blasberg and J. D. Fenstermacher (1983), “Graphical Evaluation of Blood-to-Brain Transfer Constants from Multiple-Time Uptake Data,” *J. Cereb. Blood Flow Metab.* 3:1–7, [DOI and original PDF](https://journals.sagepub.com/doi/pdf/10.1038/jcbfm.1983.1). Local direct downloads returned 403; the web reader supplied the full article. No local PDF hash or source-scan visual inspection is claimed.

Checked the model assumptions on p. 3, exact decomposition Eq. 9 and plasma-relaxation condition Eq. 14 on p. 4, intercept Eqs. 22–23 and zero-influx case on p. 5, and limitations/discussion on pp. 5–7. The demonstration is explicitly a two-compartment specialization of the article's general linear model. It does not treat the illustrative rates as measured FDG values.

## Corrections

Derived the exact irreversible identity by integrating `C1'=K1 Cp−a C1`, where `a=k2+k3`, from initially zero tissue tracer:

`CT = Ki ∫Cp + (k2/a) C1 + Vp Cp`, with `Ki=K1 k3/a`.

Thus the approximately constant intercept is `Vp+K1 k2/a²` for slowly changing plasma, rather than the free compartment's `Vp+K1/a`. The text now distinguishes this equilibrium approximation from the exact identity and explains the relative plasma/relaxation timescale requirement.

For nonzero `k4`, the leak-free expression is labeled a benchmark, not the true irreversible influx of a reversible system. Early fitting windows and noisy slopes are not promised to underestimate it. The zero-trap case reports an absolute signed difference rather than a fictitious zero relative error.

Replaced a 0.1-minute convolution and rounded frame indexing with a 0.025-minute fourth-order ODE solve and analytic six-exponential plasma integral. The quarter-minute sample times now use the declared times. The tissue-plus-vascular model and distinct plasma/tissue units are stated. Synthetic samples are instantaneous, not acquisition-frame averages. Dynamic bounds include high tissue activity, negative noisy-fit intercepts and the entire fitted line; bounds are set before drawing.

## Verification

- `node --test tests/verification-imaging-patlak.test.mjs`: six groups pass. An independent closed-form eigenmode/exponential convolution checks the RK4 curves at all 16 rate corners; other checks cover the input primitive, exact quarter-minute times, exact irreversible residual, slow-tail intercept and zero/leaking traps.
- `node tests/verification-imaging-patlak.mjs`: light and dark each pass all 64 rate/window/noise corners, finite readouts, no runtime/TeX/blank-stage errors, paths and points within bounds, zero-trap/leak interpretation and noise resampling. Full screenshots show the formerly clipped activity above 100 and a negative fitted intercept.
- `node scripts/check.mjs imaging-4.10 --static`: one item, zero errors/warnings.

Agent-inspected `/tmp/atlas-imaging-patlak-light.png` and `/tmp/atlas-imaging-patlak-dark.png`: model equations and units, scatter/fit distinction, expanded axes, controls and signed-difference readout are legible. No human review is claimed or required by this report.

The model omits plasma uncertainty, duration averaging, metabolite/decay correction, motion and clinical parameter calibration. A visibly straight fit does not independently establish all biological model assumptions.
