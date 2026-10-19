# Function ideals: conjugate squares and certified positivity

The shared example on `fa-11.2` and `fa-11.3` said two functions without
a common zero have an invertible square sum in the complex algebra
C[0,1]. Ordinary complex squares can cancel: f1=1,f2=i gives g=0.
The plotted functions are real-valued, for which that argument works.
Both captions now state this restriction and give the general complex
construction |f1|²+|f2|²=conj(f1)f1+conj(f2)f2. Its coefficients are
continuous functions, so it belongs to the same ideal, and compactness
gives a positive lower bound when there is no common zero.

For the actual plotted family, each trigonometric multiplier is at
least .6. Thus

`g(t) >= .36[(t-a)^2+(t-b)^2] >= .18(a-b)^2`.

The readout now uses this analytic lower bound to establish invertibility;
the 2001-point grid minimum is identified as an approximation. At the
default a=.3,b=.62 the certified lower bound is .018432, while the grid
minimum is about .0818. A positive grid sample alone is not a certificate.

When the zeros coincide off the sampling grid, the known exact zero is
now plotted at (a,0), rather than the nearest sampled positive value.
Red identifies an actual common zero; a small positive value with distinct
zeros stays green. Common-zero properness follows because every member
of the ideal vanishes there, not merely because one ideal element does.
The generators, square-sum curves and sampled minimum calculation remain
the same; only the exact-zero marker overrides its grid approximation.

## Validation

- The six existing FA11 test groups pass.
- Native light/dark static/browser checks pass on both pages.
- Sixteen controlled captures were inspected: default, an off-grid moved
  zero, near-but-distinct zeros and coincident zeros, for both pages and
  themes. Eight actual pointer drags and four coincidence-button clicks
  pass. Instrumented final markers have y=0 and x=a in the common-zero
  case; distinct cases have positive analytic bounds and samples above
  those bounds. No runtime/TeX failures or nonfinite values occurred.
- Artifacts: `/tmp/agent-review/ideal-browser.{mjs,json}`, named PNGs and
  `ideal-tests.log`. Strict build, generated packets and all 339 current
  review hashes are checked.

Twenty-four additional sample visual findings from positions 181–204
are recorded separately, including two disclosed bad dark PNGs replaced
by inspected isolated captures. These agent reviews grant no human or
subjective listening credit.
