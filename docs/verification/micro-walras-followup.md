# Micro 9.20 — original Walras and an authored price-adjustment model

**Resolved after independent parent source, mathematical and native review: micro-9.20.** Only its object/import in `content/micro/ch09-d.js`, its syllabus row, the isolated `source-audit-walras.js`, dedicated tests/reference generator and this report are changed. The shared legacy `excess` function/constants, Arrow–Debreu helper and all neighboring item bodies are untouched. Parent integration reconciles the source flag and ledger; no human approval is required.

## Actual original source

Read the original 1874 scan linked by the existing paper metadata: [Éléments d’économie politique pure](https://archive.org/download/lmentsdconomiep00walrgoog/lmentsdconomiep00walrgoog.pdf), University of Michigan/Google scan on Internet Archive. The original title page was inspected and reads 1874, Lausanne, Imprimerie L.Corbaz & Cie. The following complete sections were read in its original French OCR:

- Lesson 9, §§40–43, printed pp47–51: market organization, announced auction prices and upward/downward movements according to demand/supply.
- Lessons 21–22, §§116–131, printed pp119–131: individual equivalence budgets and optimal demands, aggregate net-demand equations, the redundant equation from the value identity, and successive proportional price adjustments.
- Lesson 23, §§132–136, printed pp132–137: relative exchange values, qualification of marginal conditions and price variation. No claim is made to have reviewed the whole book or later production sections.

Original printed p50, p124 and p131 were rendered and inspected, alongside the title; p127/p128 renders were also retained. PDF zero-based index = printed page+11 in these sections. Source paths: `/tmp/atlas-micro-walras1874.pdf`, SHA256 `4a953f7096b49bf33fba64045edd41fc7046deefcd3662141398fae1303cf01f`; `/tmp/atlas-micro-walras1874.txt`, SHA256 `2c3702278b3dfe0454205407acd8ffc918dd71ed34940436c4ead14bbf6824f2`; `/tmp/atlas-micro-walras-source-{6,61,135,138,139,142}.png`. Archive metadata/scandata were saved as `/tmp/atlas-micro-walras-{metadata.json,scandata.xml}`. The formerly available UNQ mirror returned404; the actual linked Archive scan and OCR were successfully downloaded directly.

The original's Lesson 22 moves one commodity's proportional cross-prices, then another's, and p131 argues that adverse effects partly compensate. It does not give the widget's simultaneous two-dimensional numéraire ODE. The replacement explicitly separates them. Broad historical priority claims, the assertion that all preceding economists studied only one market, the unconditional original-book no-trade-before-equilibrium attribution, and the unread Arrow–Block–Hurwicz 1959 convergence claim are removed. No later-edition quotation is passed off as the1874 text.

The existing written `micro-5.4` statement/derivation was read. Its multiplier equations are actually applied to derive the three-good Cobb–Douglas budget-share demands; this genuine prerequisite is added consistently in chapter and syllabus. No dependency is added merely for graph coverage.

## Material defects repaired

The old equilibrium marker was a 20,000-step, price-clamped numerical run. Its finite RK4 path silently clipped intermediate prices to[.02,30], rounded the dragged start and reported global convergence without a model-specific proof. The time/excess-demand plot used[-3,5] and value bars[-3,3], although actual offered starts produce z1=39.5 and a value term5.115. The path and histories dropped selected samples by stride. The sum bar had a hard-coded “Σ=0” label even though the displayed computation is floating-point.

The replacement obtains the equilibrium by exact linear algebra; integrates the actual unclipped vector field with positive intermediate stages and rejected/refined steps; retains all 281 fixed output times, both endpoints and all 843 demand ordinates; and includes the complete histories in the vertical bounds. The selected time has its own native slider, allowing the start, interior and endpoint to be inspected without animation timing. Starting-price sliders and a handle are synchronized, including exact off-grid equilibrium values. Signed value bars are bounded from their actual values and0, with padding for full strokes. The computed sum is reported numerically; its exact budget identity is explained separately.

## Economy, exact equilibrium and timescale

All numbers below are **authored model parameters, not historical observations or examples taken from the book**. Three traders have shares
`[.5,.3,.2], [.2,.5,.3], [.3,.2,.5]`,
and fixed endowments
`[3,.5,1], [.5,2.5,1], [1,.5,3]`.
Totals are W=(4.5,3.5,5). At positive prices, maximize `sum_g alpha_ig log(x_ig)` subject to the endowment-value budget. Multiplier conditions give `x_ig=alpha_ig (p·omega_i)/p_g`; all shares are positive, so these are the global interior optima. Every individual budget is exhausted. Summing budgets yields `sum_g p_g z_g=0` for every positive price vector. Scale invariance follows directly.

With `C_gh=sum_i alpha_ig omega_ih`, the exact coefficient matrix is
`[[19/10,9/10,8/5],[27/20,3/2,7/5],[5/4,11/10,2]]`.
Thus `z_g=(Cp)_g/p_g-W_g`. Each column sum of C equals the corresponding W, as an independent budget-accounting check. Setting p3=1 and z1=z2=0 gives
`(13/5)p1−(9/10)p2=8/5`,
`−(27/20)p1+2p2=7/5`.
The determinant is797/200>0, yielding the unique positive clearing vector `(892/797,1160/797,1)`. The third equation follows from the value identity; it is also checked directly by integer arithmetic and household demands.

The chosen ODE is `p1'=z1`, `p2'=z2`, p3=1. Its unit adjustment speeds and model time are authored conventions, not measured auction rounds. Endowments remain fixed during adjustment. Offered starts are p1,p2∈[.1,2.9], with native slider step.1; times are0–14 with step.05. No general stability assertion is attributed to this reconstruction.

## Rigorous model-specific global convergence

This proof concerns the exact ODE for **every strictly positive initial pair**, not an arbitrary economy and not the numerical algorithm outside its displayed control range.

Let r_i=p_i/p_i* for i=1,2 and r3=1. Define `a_ih=C_ih p_h*/(p_i*)²>0`. The equilibrium equations give exactly
`r_i'=(1/r_i) sum_{h≠i} a_ih (r_h−r_i)`.
Let `m=min(1,r1(0),r2(0))>0`, `R=max(1,r1(0),r2(0))`. On each lower face r_i=m all terms are nonnegative; on each upper face r_i=R all terms are nonpositive. The positive rectangle[m,R]² is therefore invariant. The vector field is smooth on a neighborhood of this compact rectangle, so the local solution extends for all positive times.

For `V=max(|r1−1|,|r2−1|)`, consider **every active index**, including ties. If r_i=1+V, the other ratio is at most r_i and the anchor contributes `(a_i3/r_i)(1−r_i)=−a_i3 V/r_i`. If r_i=1−V, the other ratio is at least r_i; the derivative of its negative deviation is at most the same negative quantity. Since r_i≤R, every active signed derivative is at most `−a_i3 V/R`. The upper right Dini derivative of a finite maximum is bounded by the maximum of its active derivatives, hence
`D+V≤−kappa V`, where `kappa=min(a13,a23)/R>0`.
At V=0 the equilibrium field is0. V is locally Lipschitz (a maximum of absolute values of smooth solution coordinates), so the integrating-factor comparison gives `V(t)≤V(0)exp(−kappa t)`. This is strict exponential contraction and proves convergence. Nonincreasing extrema alone would not establish that conclusion; the positive anchor terms are essential. No generic gross-substitutes theorem is invoked.

The readout reports this bound and the actual normalized price deviation separately from the integration's local-error estimate. A finite endpoint can still have nonzero excess demand; the(2.9,2.9), time 14 regression explicitly checks that it does.

## Numerical method and independent reference

The finite path uses RK4 step doubling: one full step is compared with two half steps; the fine local-error estimate is `max|fine−coarse|/15`, relative to `2e−11·(1+max|fine|)`. A step is accepted only if that estimate meets its target and all intermediate/accepted prices are finite and strictly positive; otherwise it is reduced and retried. Prices and output histories are never clamped. Each output time, including0 and14, is retained exactly in the returned time grid. Failures terminate explicitly rather than substituting a price floor. The estimate is **not a rigorous global numerical-error certificate**.

`tests/verification-micro-walras-reference.py` is an independent 75-digit Decimal power-series integrator; it imports neither production code nor an RK routine. For series A,B, it recursively obtains reciprocal coefficients using `I_n=−(1/A0)sum_{j=1}^n A_j I_{n−j}`, forms coefficients of B/A and A/B, and integrates each ODE coefficient by dividing by n+1. Horner evaluation advances the state. Order 20 with step cap .01/relative-change limit .02 and order 24 with cap .005/limit .01 agree within 1e−30. Six starts (all four corners, default(2.4,.5), and(.8,1.8)) are checked at times.05,.5,7,14:24 independent reference pairs are embedded in the unit test. The maximum observed production price error in these cases is 7.05e−10. This finite reference comparison is not offered as a proof of all-start numerical accuracy.

Reproduce the independent reference with `python3 tests/verification-micro-walras-reference.py > /tmp/atlas-micro-walras-references-rerun.json`. The original output `/tmp/atlas-micro-walras-references.json` has the same rows as the unit test's JSON literal `REFERENCES`; the Python generator source is byte-identical to the initially executed `/tmp/atlas-micro-walras-reference.py`.

## Mathematical and native evidence

`node --test tests/verification-micro-walras.test.mjs` passes **4 groups**. It was first passed in `/tmp` before being added to the default test glob. Final log `/tmp/atlas-micro-walras-math-final.log`.

1. Integer coefficient/clearing identities; individual complete budget accounting and global weighted-log utility comparisons on independent feasible bundle grids; homogeneity; independent physical excess-demand evaluation.
2. Every active maximum, tied same-side maxima and opposite-side ties, across small/large ratios. Independently computed household excess demands verify the strict bound. Every face of invariant rectangles is checked separately.
3. All 841 actual offered start pairs retain 281 complete output times (236,321 states), with positive unmodified prices, independent demand/value identities and analytic invariant/contraction bounds. Exact-equilibrium paths, zero/short integration horizons, invalid requests, old clipping corners and finite nonzero endpoint demand are checked.
4. Independent 75-digit series references verify early, middle and late times from all extreme starts, independently of RK4 step doubling.

`node tests/verification-micro-walras.mjs` passes **4 native groups**,1450/430px × light/dark. Final log `/tmp/atlas-micro-walras-native-final.log`. Each group exercises all 8 actual start/time corners; complete 281-point price and 843-ordinate demand histories; independently recomputed current demands and signed bars; all 64 actual field arrows, with independent physical cross-product/forward-dot checks; the exact off-grid equilibrium button; interior selected times and four native handle drags to start-domain corners. Complete curve/bar strokes, arrowhead vertices, marker rings and handles are measured in actual plot pixels; canvas-text metrics, TeX overlays, display math, page overflow, readout validity and runtime errors are checked. Intentional full-plot zero/time reference guides are treated as guides, not as clipped data.

Representative screenshots `/tmp/atlas-micro-walras-*` include default and interior-time views, the formerly clipped low-p1/high-p2 start, all-high/other corners and exact equilibrium. Final saved images inspected include `default-1450-light-panel{0,1,2}.png`, `old-clipped-start-430-light-panel1.png`, `old-clipped-start-430-dark-panel{1,2}.png`, and `exact-equilibrium-430-{light,dark}-panel0.png`, all with the `/tmp/atlas-micro-walras-` prefix. The starting demand peak near40 and signed bars beyond±3 are fully visible; the exact equilibrium’s green ring remains visible outside the gold handle; default and selected-time trajectories are legible in both themes and viewports. The final native process exited0 and closed its browser/server before the map timing hold.

## Scope checks

`node scripts/check.mjs micro-9.20 --static` reports1 item,0 errors,0 warnings, logged in `/tmp/atlas-micro-walras-static.log`. `git diff --check` and byte comparisons verify scope. The entire9.21 object and every other ch09-d item match the fresh pre-edit snapshot; all other syllabus rows match their fresh snapshot. No shared helper was modified. No Git mutations, central ledgers, source flags or full build are performed by this author. `verify:true` remains for the parent's independent original-source/math/native audit.

## Independent parent evidence

Root read the complete original French Lesson9§§40–43 and Lessons21–23§§116–136 in the retained original OCR, then inspected the actual1874title page and printed50/124/131images. The auction direction, individual net-exchange budgets, redundant equation and successive proportional adjustments support the narrowed source statement. The original p131compensation argument is correctly distinguished from the authored simultaneous ODE and its proof. Actual written micro2.5/4.9/5.4 were read for their supply-demand, marginal-utility and multiplier inputs; the model's own positive log-utility concavity argument supplies global optimality.

Root independently derived the normalized-ratio flow from the coefficient matrix and assessed compact positive invariance, global continuation, every active signed maximum (including ties), the strictly positive anchor coefficient and upper-Dini comparison. This establishes the stated contraction for the exact chosen ODE. Root reran4/4 mathematical groups, `/tmp/atlas-root-micro-walras-math.log`, and separately reran the75-digit order20/24Python generator: all24recorded reference rows reproduced exactly, `/tmp/atlas-root-micro-walras-references.json`, session94872 exited0. Local-error estimates and finite reference agreement are not represented as universal numerical proofs.

Root native4/4 groups pass at1450/430×light/dark, `/tmp/atlas-root-micro-walras-native.log`, session77193 exited0/browser closed. Complete281/843sample histories, all signed bars,64independent physical-arrow checks, off-grid exact equilibrium, native corners and full glyph/text/TeX bounds pass. Root inspected regenerated430dark previously clipped demand/value panels and430light exact-equilibrium panel: the39.5initial demand, bars beyond±3and outer equilibrium ring remain visible. Root static1item0errors/0warnings, syntax/diff and exact neighbor checks pass. No human review is required.
