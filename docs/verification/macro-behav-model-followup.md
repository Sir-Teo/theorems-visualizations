# Fixed-proportions growth and regression-to-the-mean corrections

Corrected **macro-3.12** and **behav-3.12**, two model-assumption errors found while auditing direct prerequisites. The corrections do not close source-verification flags or claim a new historical primary-source review. All new helpers are local to the two chapter modules; no shared helper or adjacent visualization changed.

## Macro 3.12: actual production limits capital accumulation

The stated model is `Y=min(K/v,L)`, `K′=sY−δK`, `L′=nL`, starting at `K=vL`. It does **not** let capital keep growing at the full-capacity warranted rate after labour has become the binding input. The previous explanation made that inference and said the unemployment rate could rise without bound.

Writing `x=K/(vL)`, the original equations give `x′=(s/v)min(x,1)−(n+δ)x`. Set `a=s/v`, `b=n+δ`:

- If `a<b`, `x=exp((a−b)t)`. Employment is `x`, capital utilization is one, and the unemployment fraction approaches one.
- If `a=b`, `x=1`: both utilization fractions stay exactly one.
- If `a>b` and `b>0`, `x=1+(a−b)(1−exp(−bt))/b`. Labour stays fully employed and capital utilization `1/x` tends to `b/a=v(n+δ)/s`, a positive bounded fraction.
- If `b=0`, the excess-capital solution is `x=1+at`. No division by zero is needed.

The chart now uses these exact solutions, avoiding the former Euler/exponential mismatch that moved the simulated economy off an exact knife edge. The explanatory scope distinguishes the stylized saving model from the full historical Harrod–Domar investment-expectations mechanism. The production coefficient `v` is labelled a capital requirement: actual `K/Y` exceeds it when capital is idle.

For the Solow comparison, `q=K/Y=k^(1−α)` obeys `q′=(1−α)(s−bq)`, with `q(0)=1`. The exact solution is used here too. At `b=0`, `q=1+(1−α)st`, so the readout states that there is no finite steady ratio and omits the undefined horizontal target. At the native zero-dilution test setting `s=.12`, `α=.35`, `t=100`, it shows `K/Y=8.80`. Coincident target and technical-coefficient annotations were separated after manual screenshot inspection.

These corrections follow directly from the card's displayed production and resource equations. An attempted supplementary retrieval of the complete Solow (1956) paper at `https://piketty.pse.ens.fr/files/Solow (1956).pdf` returned an upstream connection-reset error instead of a PDF. That retrieval was not treated as primary-source evidence; the model's historical attribution remains outside this mathematical correction.

## Behavioral economics 3.12: distinguish a Gaussian conditional mean from a linear predictor

The former general sentence `E[X₂|X₁=x]=ρx` was too strong. For standardized finite-variance scores, correlation specifies the best **linear** predictor. The exact conditional-mean statement follows under joint normality, as given in the written `stat-1.19` statement; it need not hold otherwise.

The existing simulation already generated normal shared skill and mutually independent normal luck. Its model is now explicit: `X_j=S+L_j`, `Var(S)=1−ℓ`, `Var(L_j)=ℓ`. Both scores have variance one and covariance `1−ℓ`, so the Gaussian conditional mean is `(1−ℓ)x`. The simulation uses the same draw sequence after extraction into a testable local helper. The card and syllabus now link directly to `stat-1.19`; this follow-up raises the current behavioral-economics cross-field count from 22 to 23 after the independent prerequisite peer review, still two short of 25.

The caption and readout distinguish a selected group's conditional expected next-season average from its realized finite-sample average. The chart now draws signed bars, so a negative realized average is shown below zero instead of silently truncated. The native fixture at `ℓ=1`, five cover athletes, league seed 2 shows season2 `−0.42` against conditional expectation zero.

## Validation

- `node tests/verification-macro-model-followup.test.mjs`: **5/5 groups pass**. Independent RK4 integration of the original capital equation agrees with the exact utilization paths; a parameter grid checks fractions in `[0,1]`, exact full use and long-run limits; independent nonlinear Solow integration checks its ratio; 60,000-athlete Gaussian leagues check marginal variances, shared-skill covariance and selected-group predictions. A discrete non-Gaussian counterexample has correlation zero but nonzero conditional means.
- `node tests/verification-macro-model-followup-browser.mjs`: **4/4 native groups pass**, one worker, both themes, pinned local KaTeX 0.16.11. Actual keyboard slider controls exercise saving shortfall, excess saving, exact knife edge, zero labour growth/depreciation, zero luck and independent luck; a button generates the negative-sample league and a canvas click answers the instructor question. No page, renderer, TeX, blank-stage or nonfinite-readout errors.
- **12/12 screenshots manually inspected**, including both knife-edge annotations and negative realized-sample bars. Results and screenshots: `/tmp/atlas-macro-model-followup/results.json` and the paths recorded there.
- `node scripts/check.mjs --static --fail-on-warnings macro-3.12 behav-3.12`: **2 cards, zero errors and warnings**. `git diff --check` is clean.

The math suite matches the integrated `tests/verification-*.test.mjs` glob. The browser suite is separately runnable. No source flag was automatically cleared.
