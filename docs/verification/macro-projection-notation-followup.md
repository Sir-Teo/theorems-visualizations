# MACRO 3.10 projection notation — 20 October 2026

Minimal followup to `a7f647f181ee4575efb60253c9ee3f7680661600`, resolving the independent peer's notation finding. The statement writes the initial-income term as −b log y₀ with b>0; the appended projection argument had reused b for the signed regression coefficient. It now consistently names that coefficient βₓ and explicitly states βₓ=−b under the statement's convention.

The normal-equation sign is unchanged: minimizing ||M_C(y−βₓx)||² gives βₓ=(M_Cx)ᵀM_Cy/||M_Cx||². Its negative is the positive convergence parameter only when that signed coefficient is negative. The actual regression test already compares this signed residualized coefficient against the full model's signed x coefficient on both actual sample choices.

Only this paragraph's notation changes. All functions, models, dependency arrays, source flags, other text and syllabus remain as in the producer boundary. The complete 48-object/function/row preservation audit passes. The 30,899 independent math assertions pass unchanged. Fresh 320px light/dark native 3.10 proof outputs pass runtime/TeX/paint and text/math bounds, and both complete own images were personally inspected: the formula and βₓ=−b relation are readable and unclipped. Strict build and focused static check pass with zero errors/warnings. Logs/pixels: `/tmp/atlas-macro-prereqs/notation-{guard,math,native,build,static}.log` and `notation-native/`.

This adds no prerequisite credit or source closure. Independent peer acceptance still controls the combined boundary.
