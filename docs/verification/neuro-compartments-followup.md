# Neuroscience compartment source follow-up

Ready for central integration: **neuro-4.6**, source flag still true for coordinator integration. No additional closure or human-gate completion is claimed.

## Actually read primary treatment

Complete [Gerstner et al., *Neuronal Dynamics* §3.4, Compartmental Models](https://neuronaldynamics.epfl.ch/online/Ch3.S4.html), including the introductory discretization, full Fig.3.8 caption with the half-resistance coupling, and the entire Hay-model example. This supports the membrane circuit, geometry-dependent axial coupling, and passive/active distinction. The atlas's generated tree and pulse are explicitly chosen and are not the author's anatomical reconstruction. Saved HTML `/tmp/atlas-neuro-gerstner-ch3s4.html`, SHA256 `db88b2497b1fe88d1864ae052f22006ff23bef8a313c9ae0b1840a33a5cc45cb`.

The leaf-elimination explanation is now a self-contained arithmetic argument: each leaf contributes constant work to its parent; reverse back-substitution costs constant work per edge. It is a statement about the linear voltage solve, not all nonlinear computations. The original1984 Hines paper was not read; author1997 Yale URLs timed out. No original-paper priority or unverified “first Rall/Shepherd olfactory model” claim remains. This is a circuit/model entry sourced to the complete author presentation, not a purported audit of those original papers.

## Corrections and scope

The previous mesh plot normalized every run to10mV locally, changing the physical current at every resolution. It also selected the nearest spatial node independently, which could switch branches. The new scoped helper keeps a selected segment and continuous physical position. A30µm physical patch (clipped at that segment's ends) receives the same total10pA current on[1,4)ms at every mesh. The current is apportioned by exact interval overlap; its weights sum to1. Patch-averaged observation uses those same physical weights. No simulation voltage or mesh curve is rescaled; only the blue soma trace is multiplied for visibility, with the factor and both true peaks reported.

Spatial refinement at fixeddt is a finite comparison, with a fixed single-compartment soma, not a joint cable-convergence certificate. Positive capacitance/leak and a tree topology are explicit. The synthetic branching rule has a0.5µm diameter floor, so an exact3/2 rule or equivalent-cylinder morphology is no longer asserted for this tree. Its geometry and seed are preserved. Current right-end quadrature (1<t≤4ms) corresponds to the fixed pulse interval. Dynamic views include every actual mesh point, local trace and scaled soma trace; only colour encoding is normalized.

## Independent checks

`tests/reference-neuro-compartments.py` independently constructs dense physical capacitance and conductance matrices for a soma/three-branch test morphology on three meshes. SciPy matrix exponentials give the exact semidiscrete passive pulse trajectory, separate from the JavaScript Hines implementation. Fixture: `tests/fixtures/neuro-compartments-reference.json`.

`node --test tests/verification-neuro-compartments.test.mjs`: **6/6 groups pass**. Dense matrix coefficients/areas/half-resistances and steady residuals agree; internal axial currents conserve charge and dissipate quadratic energy. Backward-Euler record errors against the matrix exponential refine .0382→.0199→.0101mV atdt.05/.025/.0125 (worst across the three meshes); these are observed finite errors, not certified bounds. Tests cover preserved physical patch endpoints and input mass across seven resolutions, plus actual proximal/distal synthetic-tree runs and six-point unscaled mesh curves. Existing `neuro-4.1` dependency preserved.

`node tests/verification-neuro-compartments.mjs`: **2/2 real light/dark groups pass**. Actual proximal/distal map clicks, both colour selectors, Home/End mesh changes preserve the physical site and pulse. The six true somatic peaks and selected mesh lie within their dynamic axes. Actual play, pause and restart update the recorded frame. All traces are finite, with no JavaScript/TeX errors. Screenshots `/tmp/atlas-neuro-compartments-{proximal,distal}-{light,dark}.png`; proximal/dark visually inspected.

Final scoped static check: **1 item,0 errors,0 warnings**, whitespace clean. Scoped helper `content/neuro/source-audit-cable.shared.js`; existing shared helpers unchanged. Other chapter entries and dependencies preserved. The source flag remains true for coordinator integration; subjective sampling/listening and Wave5 remain pending.
