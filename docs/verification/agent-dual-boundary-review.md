# Zero functionals, quotient classes and extension boundaries

`fa-4.6` described every annihilator functional's kernel as a plane.
Its widget selects nonzero functionals; the caption now says that, while
noting that the zero functional has kernel all of X.

`fa-4.9` described strip boundaries using a functional that could be zero,
and its readout put an undefined ratio at the zero quotient class equal
to the functional norm. The caption separates both zero cases. The
readout now explains that the ratio is undefined at zero, while the norm
identity still holds. Nearby point drags snap onto M, and nearby
annihilator drags snap to zero, so the exact cases are reachable despite
pixel resolution. Norm minimization and duality formulas are unchanged.

`fa-13.20` said boundary conditions must be chosen on both a finite
interval and a half-line. Its own readout correctly distinguished the
half-line first derivative, with deficiency indices(1,0) and no
self-adjoint extension. The caption now distinguishes that case from the
finite-interval operators and the half-line second derivative with equal
indices, where extensions exist.

## Validation

Ten existing FA13 groups and a new quotient-zero regression pass. The
latter exercises the actual visualization, checks snapping onto the
annihilated line and to the zero functional, and verifies that no division
by a zero quotient norm is reported.

Thirty-two native light/dark states cover line/plane annihilators and
rotated subspaces (6), extension/zero-extension/quotient/zero-class/
zero-functional and p=2/infinity norms (14), and both derivative orders on
all three domains (12). All captures were inspected; runtime and TeX
checks pass. The first quotient-zero native check could approach but not
reach the zero class at pixel resolution, motivating the declared snap.
Artifacts: `/tmp/agent-review/dual-boundary-browser.{mjs,json}`, named
PNGs and `dual-boundary-fa13-tests.log`. Strict build, regressions, current
review hashes and packets are checked before commit. No source flag,
human review or subjective-listening credit is claimed.
