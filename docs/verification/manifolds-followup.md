# Manifolds: Morse critical points and Lie derivatives — 2026-10-17

Resolved `mfd-3.14`, `mfd-4.6` and `mfd-4.8`, closing the three queued manifold reviews. **792 source reviews remain**. Wave 5 remains gated.

## Primary sources and scope

- Milnor, *Morse Theory* (1963), [original text](https://math.stanford.edu/~ralph/math215b/Milnor.pdf): Lemma 2.2, printed pp.6–9/PDF sheets6–7; Theorems 3.1–3.2, pp.12–15/sheets9–10; Theorem 3.5, pp.20–21/sheet13. Read the local square-completion proof, the compact-critical-strip hypotheses and cell attachment up to homotopy. SHA-256 `65731a25d783d01c9e677d26235884289ebfac6960a8dde90ca6be956b7e13a6`.
- Lee, *Introduction to Smooth Manifolds*, **version 3.0, December 31, 2000**, [author's manuscript mirrored by the Colorado State course](https://www.math.colostate.edu/~renzo/teaching/DiffGeo2011/Introduction%20to%20Smooth%20Manifolds%20-%20J.%20Lee.pdf): Lemmas 13.1–13.2, printed pp.329–330/PDF pp.341–342; Theorem 13.6, pp.333–334/PDF pp.345–346; Proposition 13.11 and Corollary 13.12, pp.339–340/PDF pp.351–352; Proposition 13.18 and the Killing-field discussion, pp.343–344/PDF pp.355–356. This is an early manuscript, not the second edition; the new citations identify it explicitly. SHA-256 `d92e9c16d2f2b732b3eaff0eb285625550c48ffc1b0391a2f6071d16c6599df1`.

Replaced broad, unchecked chapter pointers. Removed unsupported historical-priority credits for the bracket/derivative and the unconfirmed first-publication discussion for the Morse lemma. The remaining mathematical claims are supported by the sources and calculations below; no chronology is inferred from modern terminology.

## Morse corrections

The old display classified positive tilts below roughly two degrees as degenerate, although only tilt zero is degenerate. It also estimated the Hessian by finite differences. For the torus with major/minor radii 1.25 and 0.5, the height is

`h(a,b)=sin(tau)(1.25+0.5cos b)cos a+0.5cos(tau)sin b`.

At positive tilt, the critical meridians have `a=0,pi`; the four latitudes follow from the exact height derivative. The Hessian is diagonal there, with entries `−sin(tau)(1.25+0.5cos b)cos a` and `−0.5(sin(tau)cos a cos b+cos(tau)sin b)`. The critical values are `±(1.25sin(tau)+0.5)` and `±(1.25sin(tau)−0.5)`. Every supported positive tilt is nondegenerate, including one and two degrees, with indices 0,1,1,2. At zero, the two critical circles have a zero tangent Hessian eigenvalue.

The helper now uses these analytic values and only labels exact zero as degenerate. Scientific notation preserves small nonzero Hessian values. The circle-remainder maximum is explicitly a **48-point sample**, rather than an exact maximum. The text distinguishes the quadratic approximation from the nonlinear chart supplied by the lemma. Corrected the square-completion coefficient to half the Hessian, and stated the compact, boundaryless Morse-function setting and the homotopy meaning of cell attachment. The source's finite cell decomposition gives the displayed alternating-index Euler characteristic.

## Bracket and Lie-derivative corrections

Checked the derivation definition, coordinate formula, antisymmetry, bilinearity, Jacobi identity, function-factor product rule and coordinate-field case. The operator comparison previously promised agreement to a fixed `10^-6` without showing its error. It now reports the actual absolute difference between the finite-difference estimates.

The Lie-derivative display silently replaced slider time zero by `0.001`, used finite differences of numerical flows for transport, and described the rotation metric quotient as exactly zero despite numerical errors. It now explicitly shows the analytic limiting derivative at zero. Rotation, dilation and shear use their exact flow matrices. The bounded nonlinear wave field integrates the flow together with its analytic variational equation, avoiding finite differences of neighboring trajectories and the old fallback to the start point. The vector pullback uses the inverse differential of that flow. Functions, vectors and metrics have analytic Lie-derivative references.

For a unit vector `w`, the metric quotient is exactly 0 for rotation, `expm1(t)/t` for half-rate dilation, and `2w_xw_y+t*w_y²` for shear. Their zero-time limits are explicit. The wave quotient retains numerical integration error, identified in the readout; first-order truncation is an asymptotic statement for small nonzero times. Heat-map saturation and the 81-point scope of the reported deviation are stated. Pulled-back unit ellipses are clipped to the data panel. Local-flow isometries are used in the Killing-field statement, as in Lee.

## Reproducible checks

- `npm test`: 47 math, 20 science-kit and **61 content-verification tests** pass. New tests check every supported positive tilt, the coincident-saddle-value tilt, exact gradients/Hessians and a uniform third-derivative Taylor bound. All five bracket pairs agree with independent analytic expressions and the operator product rule.
- An independent fourth-order Hamiltonian splitting (Yoshida composition of exact horizontal/vertical shears) checks the nonlinear flow and differential, using 256/512-step convergence. Production uses RK4 on the variational equation. Tests compare both signs of time and interior/edge coordinates, check determinant preservation, inverse-flow transport, exact linear metric quotients and zero-time limits. Numerical references are not represented as proofs of general differential-geometric theorems.
- `node tests/verification-manifolds.mjs`: six light/dark scenario groups. Actual inputs cover zero/one-degree/90-degree tilts, every critical selection and radius/level endpoints, 3D camera drag, all five bracket pairs and pointer drags, all 12 object/field combinations, both time endpoints, zero time and metric directions. Captured displayed calculations agree with the checked helpers; no browser errors.
- Three-item light/dark mode runs pass without runtime, TeX, blank or quality warnings. Inspected Morse, bracket and zero-time Killing-field screenshots. No audio controls exist in these entries.
- Five smoke routes pass: chapters 3–4 and all three reviewed entries. Strict build/full static validation remain clean, with 6,684 items and 6,621 visualizations.
