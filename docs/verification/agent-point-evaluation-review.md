# Point evaluation and local averages in L2

`rca-4.12` said local averages tend to f(c) without qualifying f, and
called point evaluation discontinuous on L2. `fa-12.5` used the same
informal evaluation language. L2 consists of equivalence classes modulo
almost-everywhere equality; changing the value at c leaves the class
unchanged, so point evaluation is not even defined on those classes.

Both examples now distinguish the continuous functions actually drawn
from arbitrary representatives. Local averages converge to the value of
a continuous function, and to the precise representative at Lebesgue
points, almost everywhere. Evaluation on the continuous subspace with
the L2 norm is unbounded and has no bounded extension to L2. The scopes
give an explicit proof: a continuous tent of height 1 and half-width eps
has value 1 at its centre but norm sqrt(2eps/3), tending to zero.
Diverging norms of the averages alone are not used as that proof.

The two width conventions stay explicit: RCA uses interval width h and
representer norm 1/sqrt(h); FA uses width 2h and norm 1/sqrt(2h). Each fixed
positive-width average is bounded. RCA's caption also treats L=0
separately, where its kernel is the whole space rather than a line.
FA labels the inner product computed on its grid and the quadrature
null-space residual as approximations, explaining their small differences
from the direct numerical functional value. Neither quadrature nor
projection algorithm changes; tall boxes retain their existing off-scale
labels/arrows.

## Validation

- Nine existing FA12 test groups pass.
- Native static/light/dark mode checks pass on both pages.
- Eighteen controlled native states cover the averaging-width endpoints,
  three FA functionals, and RCA's zero functional in both themes. All
  captures were inspected; runtime/TeX/finite-value checks pass. RCA h=.004
  gives norm 15.81 and h=.5 gives 1.41; FA h=.01 gives 7.071 and h=.25 gives 1.414.
  The zero-functional panel explicitly says the kernel is all of H.
- Artifacts: `/tmp/agent-review/riesz-evaluation-browser.{mjs,json}`,
  named PNGs and `riesz-fa12-tests.log`. Strict build, review packets and
  all 339 current text hashes are checked.

The same batch adds 22 visual findings from positions 205–228, avoiding
repeat credit for the previously reviewed Gauss-density and coordinate-rate
pages. Three initial capture artifacts were replaced by inspected isolated
recaptures and documented separately. Agent findings grant no human or
subjective listening credit.
