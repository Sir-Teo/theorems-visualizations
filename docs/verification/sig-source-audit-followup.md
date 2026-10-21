# Periodic power and continuous Fourier divergence

Resolved after parent integration: **sig-4.6, sig-4.13**. The source flags and ledger were reconciled together after parent reruns.

## Primary text actually read

Stephen New's author-hosted [Lecture Notes on Lebesgue Integration and Fourier Analysis](https://www.math.uwaterloo.ca/~snew/PMATH453/PMATH450Notes.pdf): acquired all 55 pages; read the complete relevant Hilbert-basis proof §4.23, §§5.10–5.28, the Dirichlet-kernel/operator-norm argument §§5.30–5.34, and the Fejér-kernel development §§5.35–5.41. Printed pages are PDF page minus one. Local PDF/text: `/tmp/atlas-fourier-new.pdf`, `/tmp/atlas-fourier-new.txt`; SHA256 `75f1e402e38840be71b30ebf44c36c714182b095b31868e46a1b747bdc88e558`.

The source's §5.34 lower-bound constant drops the normalization by 2π when carrying forward §5.33. This audit uses the normalized operator norm, not that erroneous numerical constant. Its operator-norm equality and uniform-boundedness argument still establish the required divergence. The sharper leading coefficient in the entry follows independently by writing `1/sin(u/2)=2/u+O(u)` on `[0,π]`, then averaging `|sin v|`, whose period mean is `2/π`; the resulting coefficient is `4/π²`. No claim to having read the original historical Parseval or du Bois-Reymond papers is made. Specific historical dates and the unsupported attribution of this exact block formula to Fejér1910 were removed.

## Corrections and proofs

4.6 now evaluates the actual continuous periodic linear interpolant. For knots `y_j` at `-π+2πj/N`, each coefficient is the knot DFT divided by N times `sinc(πk/N)²`; this follows by integrating the periodic triangular interpolation basis. Power is the exact segment integral `Σ(y_j²+y_j y_(j+1)+y_(j+1)²)/(3N)`. Thus its reported tail does not silently combine different quadrature errors. A zero preset verifies the zero-power boundary without division by zero. The full selected range `k=0…30` is visible, and small-power plots scale to their actual power. Captions state that square/saw presets are sampled linear interpolants.

4.13 retains a single explicit continuous counterexample, with a simpler fully justified bound. The sine-series block now has Fejér weights `1-k/(n+1)`. It is a positive normalized Fejér average of the sawtooth bounded by π/2, multiplied by `2sin(mt)`, hence bounded by π. Its spectral cut at degree m is exactly `H_n-n/(n+1)`. Disjoint supports `[n_j,3n_j]`, `n_j=2^(j³)`, make the assembled partial sums equal this value divided by j². The uniform sum bound is exactly `π³/6`; bars beyond j=2 are explicitly asymptotic evaluations, with first omitted correction below `1.3e-9` at j=3. Both complete block and partial-sum curves now fit the vertical window. The former displayed bound rounded downward and was unsupported as an inequality.

## Validation

`node --test tests/verification-sig-source-audit.test.mjs`: **3 groups pass**, using independent segment quadrature (including DC, zero, and above-knot-Nyquist frequencies), direct integrated projection residuals, actual finite spectral cuts and frequency-support separation.

`node tests/verification-sig-source-audit.mjs`: **4 native groups pass**, two entries in both themes. Actual preset buttons, harmonic endpoints, native drawing, both log block-size endpoints, all31 harmonic bins and all14 assembly bars are exercised. Final run includes path-bound checks; no page or TeX errors.

Personally inspected final native screenshots `/tmp/atlas-sig-parseval-drawn-light.png`, `/tmp/atlas-sig-parseval-zero-safe-light.png`, and `/tmp/atlas-sig-divergence-weighted-blocks-dark.png`.
