# ODE source review — 2026-10-17

Reviewed all eight queued ODE items against [Teschl's author-hosted book](https://www.mat.univie.ac.at/~gerald/ftp/book-ode/ode.pdf),
using the printed page numbers below. These are atlas item numbers, not book theorem numbers.
Replaced unsupported historical date/priority details with attribution to the checked presentation.

| Atlas item | Source location | Correction |
|---|---|---|
| `ode-3.12` | §3.4, Theorem 3.12, p. 84 | State continuity of A; distinguish quadrature convergence from numerical error floors. |
| `ode-4.1` | §§4.1–4.2, pp. 113–116 | Coefficient singularities limit the guaranteed disc, not every solution's continuation. Finite coefficient ratios may oscillate. |
| `ode-4.8` | §5.4, (5.64)–(5.69), pp. 158–159 | Require nonzero fundamental solutions; correct the string interpretation and section reference. |
| `ode-4.9` | Lemma 5.10, Theorem 5.11, Lemma 5.12; Theorem 5.25 | Use a shifted resolvent when zero is an eigenvalue; include the cited Weyl theorem's regularity assumption. |
| `ode-4.10` | §5.4, Theorem 5.11 and Lemma 5.13, pp. 160–163 | Correct the zero-mode completeness argument and shifted coefficient identity. |
| `ode-4.13` | §5.5, Theorems 5.17–5.18, pp. 169–170 | Separate the eigenfunction zero count from the Dirichlet shooting formula. |
| `ode-4.14` | §5.4, Lemma 5.12, pp. 161–162 | Exclude the zero vector in min–max; spell out the dimension argument. |
| `ode-4.15` | §5.4, (5.56), Theorem 5.11 | Restore the weight in compatibility and fix the boundary-identity sign. |

Visualization corrections discovered during independent checks:

- Green contours previously requested the single level `7`, outside the displayed kernel's range. Seven actual levels are now supplied. Signed loads and all curves share one final coordinate transform.
- The Weyl plot used shifted indices for mixed/Neumann ends while labelling its denominator `n*pi/S`. It now uses that stated denominator and includes zero/negative ratios.
- The expansion grid is now 1,200 cells; drawn functions use interpolation, and zero-function log bounds stay ordered.
- Oscillation counts now include the final mesh cell. The eigenvalue list expands through the plot window rather than stopping after eight modes; the count axis includes every displayed mode, and coverage beyond the 64-mode limit is explicitly identified. Integer-sampled zero counts and computed spectral jumps are distinguished.
- Five ground-state handle samples approximate an eigenfunction rather than reproducing it exactly. The Rayleigh display labels numerical quadrature and handles a zero trial without NaN. Ground-state sampling is within 2% of the minimum for every preset.
- Fredholm resonance classification uses the parameter's equality to an eigenvalue rather than a loose shooting residual. A nearby value therefore retains its unique solution. Numerical compatibility tolerance is explicit.
- Duhamel response bounds include every kick and total response at both damping extremes.

Validation:

- `npm test`: 47 math, 20 science-kit and **19 content-verification tests** pass. New checks cover Taylor residuals/convergence, the last-cell zero, all four D/N spectra (12 modes, three potential shifts), weighted Gram matrices and finite Parseval identities.
- `node tests/verification-ode.mjs`: exact Green kernels and unit-load solutions for three operators; 12 operator/load combinations; pointer reciprocity; all preset/boundary combinations for spectra and expansions; slider endpoints; six eigenvalue jumps; Rayleigh sampling/orthogonalisation/zero trial; 15 forcing/resonance cases and a near-resonance case; and damping extremes.
- Sixteen chapter/item visualizations checked in light and selector/toggle modes; the nine affected/neighboring items also checked in dark mode, with representative screenshots inspected. Strict build, full static validation and five targeted route smoke checks pass.

These checks resolve the eight queued ODE source flags. The wider human sample and subjective audio listening remain pending. Wave 5 remains gated.
