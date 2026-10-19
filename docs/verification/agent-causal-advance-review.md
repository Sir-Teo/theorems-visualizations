# Causal response: time-advance sign correction

In `waves-3.14`, both the caption and the implementation used
exp(+iωτ) for the “acausal advance” control. With the page's forward
Fourier convention ∫h(t) exp(+iωt) dt, that multiplier delays h(t).
The actual advance h(t+τ) requires exp(−iωτ).

This broke the intended counter-example. Before correction, τ=3 gave
Kramers–Kronig reconstruction error about 4.9×10⁻⁷ and negative-time
energy fraction 5.9×10⁻⁷: the delayed response remained causal. The
readout nevertheless declared the relation failed merely because the
control was positive.

The frequency response now uses the correct advance. For the default
single line and τ=3, the maximum reconstruction difference is about
1.2603 (71.26% of the sampled peak), and about 54% of sampled response
energy lies before time zero. For two lines, the corresponding values
are about 1.3300 and 56%. At zero advance, reconstruction errors remain
below 4×10⁻⁷ and negative-time energy is only finite-grid leakage.

The statement now provides a precise real causal L¹ ∩ L² impulse-response
hypothesis and separates analyticity in the open upper half-plane from
its real-axis boundary values. Hilbert-transform formulas hold in L²
and almost everywhere as principal values; a classical pointwise reading
needs additional regularity. The caption distinguishes the exact causal
model from finite-bandwidth FFT leakage.

Validation:

- The new numerical regression integrates a time-shifted causal exponential
  directly over time and compares its Fourier integral with the production
  frequency-domain advance. Frequencies of both signs and four shifts
  catch the sign reversal without duplicating the phase formula.
- The native browser regression tests zero and positive advance, one and
  two lines, in both themes. It measures negative-time amplitudes and
  the difference between the actual plotted KK and exact curves, rather
  than trusting the conditional “fails” label. Runtime and real TeX pass.
  Eight captures were inspected.
- Strict build and the full existing regression suite pass. Sample text
  hashes and verification packets were refreshed.

The same visual pass inspected sample indices 85–108 in both themes.
Twenty-three gain their first visual note; `sig-3.12` was already
inspected and adds no duplicate credit. The third duplicated-panel
capture artifact (`em-1.18`, dark) and its correct isolated recapture are
recorded in [the capture log](agent-capture-anomalies.md). Uncorrected
semantic findings remain pending in the per-page records. No source flag
or prerequisite shortfall is closed by this numerical correction.
