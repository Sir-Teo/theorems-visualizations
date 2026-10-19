# Concurrence and monogamy follow-up

Corrected qinfo-2.8's concurrence explanation: the relevant numbers are the eigenvalues of the positive operator

\[
R=\sqrt{\sqrt\rho\,\widetilde\rho\,\sqrt\rho},\qquad
\widetilde\rho=(\sigma_y\otimes\sigma_y)\rho^*(\sigma_y\otimes\sigma_y),
\]

ordered decreasingly, with \(C(\rho)=\max(0,\lambda_1-\lambda_2-\lambda_3-\lambda_4)\). They are not the singular values of the spin-flipped density matrix alone. For example a pure product state and a Bell state both have spin-flipped spectrum \((1,0,0,0)\), while their concurrences are zero and one.

The production `concurrence` helper already diagonalised \(\sqrt\rho\,\widetilde\rho\,\sqrt\rho\) with the Hermitian eigensolver and square-rooted its nonnegative eigenvalues, which implements the correct formula. Its algorithm was preserved. The derivation now includes the rank-at-most-two marginal argument and trace identity that prove the three-qubit bound. Removed the Bell-inequality analogy and its qm-14.9 dependency, which the CKW proof does not use; the syllabus matches. This removes a same-field edge and leaves the prerequisite batch's 25 different-field qinfo edges unchanged.

The sampled-gap readout now reports its signed computed minimum, without replacing zero or a negative rounding residual by a manufactured positive floor. Its equality count explicitly states the \(10^{-6}\) tolerance and describes sampled states rather than claiming the scatter proves the theorem.

## Complete sources and exact anchors

- [Wootters, *Entanglement of Formation of an Arbitrary State of Two Qubits*](https://arxiv.org/pdf/quant-ph/9709029), complete arXiv v2 paper (13 PDF pages) read, including the full constructive proof and both sign cases. The published paper is [PRL **80**, 2245–2248 (1998)](https://doi.org/10.1103/PhysRevLett.80.2245). PDF p.3 Eq.(5) defines the spin flip; p.4 Eqs.(6)–(10) give the pure overlap, entanglement function and mixed-state concurrence. The paragraph after Eq.(10) defines the positive nested square root and equivalently the square roots of the eigenvalues of \(\rho\widetilde\rho\). PDF pp.5–8 Eqs.(11)–(18) construct a decomposition with equal concurrence, using the symmetric tilde-overlap matrix; pp.9–10 Eqs.(19)–(24) prove the lower bound and the zero-concurrence case. Local `/tmp/qinfo-wootters1998.pdf`; SHA-256 `2e26284a8da19bbb3ecca9f2e139dab01ba4f22fafa538a3c3e07bef9a90dead`.
- [Coffman–Kundu–Wootters, *Distributed Entanglement*](https://arxiv.org/pdf/quant-ph/9907047), complete arXiv v2 paper read through the conclusion. Published [PRA **61**, 052306 (2000)](https://doi.org/10.1103/PhysRevA.61.052306). PDF p.3 Eqs.(1)–(2) define squared concurrence/tangle; p.4 Eq.(3) uses the rank-at-most-two marginal. PDF p.5 Eqs.(7)–(12) establish the trace identity and \(\tau_{AB}+\tau_{AC}\le4\det\rho_A=\tau_{A(BC)}\). PDF p.7 Eq.(15) gives the single-excitation family and exact pairwise tangles, including the W-state values \(4/9,4/9,8/9\). PDF pp.8–9 Eqs.(17)–(22) derive the independent quartic residual invariant \(4|d_1-2d_2+4d_3|\); p.10 Eq.(24) and its following GHZ example give total tangle one, pairwise tangles zero and residual one. Local `/tmp/qinfo-ckw2000.pdf`; SHA-256 `5baa5c51c776fea5f13857d5fdfe77d795082c17b07906dbdc02fd86a27e885e`.

## Independent numerical checks

`node --test tests/verification-qinfo-concurrence.test.mjs` passes four substantive groups:

1. Product/Bell counterexample and 100 complex pure two-qubit states against the independent formula \(2|ad-bc|\).
2. Noisy Bell states below, at and above the \(p=1/3\) threshold, plus complex full-rank X states against their closed-form concurrence.
3. 100 complex Haar three-qubit states against the CKW quartic polynomial, and 20 complex W-family states against the analytic pairwise tangles.
4. The actual visualization's GHZ/W endpoints and all 61 points of its gold path against the quartic residual, plus the signed-readout wording.

The existing helper has absolute errors at approximately the square root of floating-point precision on rank-deficient states: the initial 100-state pure-state probe found a maximum concurrence error of `1.62e-8`. The tests allow `5e-8` for concurrence and `2e-7` for the residual identity; they do not claim exact arithmetic at zero. This is substantially below the displayed three-decimal precision and the explicit equality tolerance. No general numerical formula was replaced by a state-family shortcut.

## Native controls and manual inspection

The native run exposed a separate endpoint defect: the old `0.01`-radian step made Chromium stop at `1.57` rather than \(\pi/2\), so the nominal W endpoint still displayed a residual near `0.002`. An irrational step dividing the angular interval also proved susceptible to native range-grid rounding. The final control uses exact integer degrees from 0 to 90 and converts to radians only when evaluating the state; its label identifies the unit. The numerical regression also checks that control contract.

`node tests/verification-qinfo-concurrence-browser.mjs` passes serially in light and dark with real local KaTeX 0.16.11, no page/TeX errors and no blank stages. Actual inputs cover 500 W-family samples, the exact GHZ and W endpoints, resampling that changes the canvas, 20 Haar samples, and a mixed 250-state cloud at 51 degrees. The W endpoint displays the expected `0.444, 0.444, 0.889` tangles and residual `0.000`. The readout retains the small negative rounding residual from the sample rather than clipping it.

Both full screenshots were manually inspected: the two scatter diagrams, endpoint labels, controls, signed readout and corrected nested-root formula are visible and legible in both themes. Evidence is `/tmp/atlas-qinfo-concurrence/native-controls.json`, `qinfo-2.8-light.png` and `qinfo-2.8-dark.png` in that directory. The existing qinfo numerical suite and the four new concurrence groups pass; focused static validation reports zero errors/warnings. No source flag was changed.
