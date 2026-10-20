# Finance5.7 — actual daily exits and limited capital

Resolved after independent source, mathematical and native review: **fin-5.7**.
Four mathematical groups and four final native groups pass independently;
original formulas and regenerated screenshots were inspected. Source flag and
ledger are reconciled during integration. No human review or approval is required.

## Actual original read

Shleifer and Vishny, [The Limits of Arbitrage](https://web.stanford.edu/~piazzesi/Reading/ShleiferVishny1997.pdf),
*Journal of Finance*52(1),1997,35–55, DOI10.1111/j.1540-6261.1997.tb03807.x.
The Stanford university mirror supplied the actual21-page original, local
`/tmp/atlas-fin-shleifer-vishny1997.pdf`, SHA256
`809429ec663f73334cba9428f90e7b92fb65894c94a6b523f669314b52a98518`.
Extraction `/tmp/atlas-fin-shleifer-vishny1997.txt` has66,204characters.

Root read the complete introduction, complete§§I–II(pp35–47), and conclusion
§V(p54). Actual printed41/46 formula images were inspected at
`/tmp/atlas-fin-sv-original-{41,46}.png`, checking performance-based funds,
the fully invested equilibrium and its source assumptions. No complete reading
of§§III–IV, the DeLong1990 original or twin-share empirical papers is claimed.

The original model has three dates and a terminal price equal to known
fundamental value by assumption. Its external investors allocate funds based
on prior returns; under the specified circumstances fully invested arbitrageurs
lose funds and reduce positions as the opportunity becomes more attractive.
The revised attribution is scoped to that mechanism. An unaudited quotation,
unread twin-share example and claim that a stochastic mean-reverting path must
eventually converge are removed. The authored margin experiment does not
reconstruct the original equilibrium or investor withdrawals.

## Model and repaired accounting

The illustration now specifies a daily Gaussian AR1 model, rather than calling
an Euler step an exact continuous-time OU simulation:

```
a = exp(−κ),    m_(t+1) = a m_t + σ Z_(t+1),    Z iid standard normal.
E_t = 1 + Λ(m_0−m_t)/100,    τ = first observed daily E_t ≤ ρΛ.
```

Spread and innovations use percentage points; equity uses initial-wealth units.
For positive noise, the limiting Gaussian variance isσ²/(1−a²)>0. The expected
gap decays without implying convergence of an individual path. Unstopped
expected day250wealth is1+Λm0(1−a^250)/100>1 for the offered inputs, with risk.

The explicitly chosen admission rule requires1>ρΛ. The previous controls
silently opened positions already violating their initial maintenance margin.
They now refuse admission, keep wealth as cash1 and omit their exit/mean
statistics rather than reporting a simulated liquidation. An exact boundary
button setsΛ10andρ.1; the adjacentΛ9.5setting is admitted.

For admitted positions, the gap threshold is m0+100/Λ−100ρ. A prefix maximum
and binary search find the first daily crossing. The resulting **observed**
equity is retained, including negative overshoots. The former MonteCarlo code
instead credited the thresholdρΛ to every liquidation. That altered the
payoff and concealed losses. The selected path and all400comparison paths now
use identical stopping rules and hold the actual exit wealth as cash through
day250. No recovery after exit is credited.

All four panels resample together. The prior second independent fixed-seed
experiment is removed. Every admitted exposure from1to30in.5steps uses the
same400paths, and its stop frequency and original-unit mean wealth are shown
on **separate** axes. The arbitrary50×wealth percent conversion and0–100
clamp are removed. Dynamic limits include all plotted curves/markers, including
negative wealth; inadmissible exposures are shaded and have no plotted result.
The readout includes finite-sample estimated SEs for the frequency and mean,
and the range of individual final wealth.

Finite-horizon Gaussian paths and their stopped wealth have finite second
moments. Actual written prob2.2.3 supplies the weak law for independent path
averages. The fin1.13 riskless-arbitrage definition provides the conceptual
distinction. No costs, interest, limited-liability protection, capital injections
or intraday monitoring are simulated; these are explicit model assumptions.

## Executed mathematical checks

`node --test tests/verification-fin-arbitrage.test.mjs`:4groups pass,
`/tmp/atlas-root-fin-arbitrage-math.log`.

1. Independent finite weighted sums and exhaustive balanced unit-variance
   innovation histories through8days check transition means/variances and
   prefix maxima at three reversion/noise settings. Gaussian linearity gives
   the stated model law; no distributional conclusion is inferred merely
   from the finite sign enumeration.
2. Every59×41offered exposure/margin pair, with six independent supplied
   paths, checks admission, first crossings, exact threshold touches,
   neighboring values, final-day hits, overshoot wealth and cash histories
   against direct scans. A forced overshoot yields−.5rather than+.5wealth.
3. Independent direct scans of all400paths at every59exposure settings and
   three margins verify every liquidation count, mean, sample SE and wealth
   range, plus monotonic stop counts over admitted exposures on common paths.
4. A supplied path verifies that exit wealth.4is held as cash even when the
   unstopped final mark would have recovered to1.9; positive expected
   unstopped wealth remains distinct from that realized outcome.

## Native and independent review

`node tests/verification-fin-arbitrage.mjs`:all4groups pass at1450/430px in
light/dark themes, log `/tmp/atlas-root-fin-arbitrage-native.log`, session74442
exited0 with its browser/server closed. Each group operates all32actual control
corners, all59exposure statistics over400independently regenerated paths,
strict admission equality and the adjacent admitted control, native slider
endpoints, all-panel reseeding and an actual negative daily overshoot. Complete
curve strokes, glyph rings, measured text and display/page TeX bounds pass.

An initial harness run reached resampling after passing its control corners,
but separately fetched plot geometry and model state across a render boundary.
The harness now captures those atomically and waits for the button's scheduled
frame; the complete rerun above passes. This was a harness timing issue and did
not require changing the production model or loosening numerical/layout bounds.

Final static1item0errors/0warnings and syntax/diff checks pass. Root read actual
fin1.13 and prob2.2.3. Non-target5.6/5.8/5.9 item bodies compare byte-for-byte
with HEAD; concurrent5.10 edits are independently owned and excluded from this
commit. Root inspected the negative-overshoot430dark wealth crop, full430light
admission-boundary page and default1450light page: actual negative wealth/cash
freeze, invalid-margin shading, omitted invalid statistics and all four panels
are clear, with readable short formulas and controls.

A separate agent actually read the same complete introduction/§§I–II and§V,
inspected the original41/46formulas, independently assessed Gaussian moments,
strict admission and stopping accounting, and reran all4math and4final native
groups. No remaining scoped defects were found. Logs
`/tmp/atlas-fin-arbitrage-independent-{math,native}.log`; native session46611
exited0/browser closed. It inspected regenerated mobile negative-exit,
admission and mean-panel screenshots. No user review is required.
