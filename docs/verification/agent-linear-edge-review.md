# Linear-algebra zero and field cases

Four sample findings are corrected:

- `ladr-9.71`: an outer product has rank at most one, including rank zero
  when either factor is zero. Perturbing one entry need not produce rank
  two: starting at zero gives another simple tensor. Captions and native
  rank/readout labels handle both exceptions, and no longer equate a
  perturbed rank-one singular value with the original factor norms.
  Equality on one tested functional pair does not certify array equality.
- `ladr-7.43`: the nonsymmetric operator with nonnegative quadratic form
  is explicitly a real-field example. Over the complex field, real
  nonnegative values for every vector imply self-adjointness.
- `ladr-9.59`: positive determinant for an even count of negative
  eigenvalues requires nonsingularity, and failure of positivity requires
  that count to be positive. The statement gives -I in R2 and distinguishes
  a zero eigenvalue. Finite dimension is explicit.
- `ladr-8.18`: the space is explicitly nonzero and finite-dimensional;
  in dimension zero the minimal polynomial is 1 rather than z^m with m>0.

The existing singular-value computation and relative-rank tolerance are
reused; the correction adds the missing rank-zero label and conditional
text. Matrix/functional computations are unchanged.

## Validation

All 47 existing math groups pass. Thirty-two controlled native states
cover four tensor states, four positivity presets with zero-direction
handle drags, five determinant sign/zero cases, and three nilpotency
presets, in both themes. All captures were inspected. Runtime and TeX
checks pass. Tensor singular values change from (2.813,0) to (2.969,.344)
under the generic perturbation, to (0,0) at zero, and to (.5,0) after
perturbing zero. Real nonsymmetric T sends (0,1) to (-1,0), with form zero
and image norm1. Determinants +1,-1,0 agree with the sign/zero examples.
Nilpotent presets give null-space dimensions(1,2,3)/(2,3,3), while the
changed matrix gives(0,0,0). Artifacts:
`/tmp/agent-review/linear-edge-browser.{mjs,json}`, named PNGs and
`linear-math-tests.log`. Strict build and regression suite run before commit.

The first visual pass now covers all 336 visualizations in the fixed
339-page sample. The remaining three pages are definitions without
visualizations. Every page has a semantic text finding, but many still
need corrections or interaction checks. This is not a completed full-page
or human review. Sixty additional visual findings are recorded from
positions277–339, omitting earlier inspections and the definition.
Capture artifacts were separately preserved, recaptured and inspected.
