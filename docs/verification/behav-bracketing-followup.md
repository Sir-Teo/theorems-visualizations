# Behavior 4.6 / 4.7 — bracketing and transaction utility

Resolved: **behav-4.6 and behav-4.7**. Parent independent source/model/browser checks passed; both source flags and the central ledger are reconciled. Four mathematical groups, eight final native groups and the two-item scoped static check pass. Representative final screenshots were inspected across both themes and widths. This is agent source/model/browser verification; no human-review gate is required or claimed.

Scope: only these two objects and their source notes/imports in `content/behav/ch04-b.js`, the corresponding two rows in `content/behav/syllabus.js`, the new `content/behav/source-audit-bracketing.js`, dedicated `tests/verification-behav-bracketing.{test.mjs,mjs}` and this report. Item 4.5 and unrelated syllabus rows are preserved. No Git, ledger, master-plan or full-build changes were made by this agent.

## Original sources actually read

- [Paul Samuelson, “Risk and Uncertainty: A Fallacy of Large Numbers” (1963), original article in the CAS reprint](https://www.casact.org/sites/default/files/database/forum_94sforum_94sf049.pdf). Local `/tmp/atlas-behav-samuelson1963.pdf`, SHA-256 `092027a07cf1bf28c016b3becb61482be91d33908c421e4d56f081b41cb82f3f`. Read the complete article, especially §§3–8. Original §7's wealth-range premise was also inspected in `/tmp/atlas-behav-samuelson1963-p5.png`. The eight-page reprint includes its cover and blank final page; this is the original text, not a later summary. Samuelson distinguishes increasing the number of risks from dividing a fixed risk among owners, and does not treat small loss probability as certainty.
- [Read, Loewenstein and Rabin, “Choice Bracketing” (1999), author-hosted original scan](https://www.cmu.edu/dietrich/sds/docs/loewenstein/ChoiceBracketing.pdf). Local `/tmp/atlas-behav-choice1999.pdf`, SHA-256 `fc720d641ccfb1b0252cb9e0e3dccf6160fb450a1b67a035e149a80d74207c37`. Read original printed pp. 171–181 from the two-up page images `/tmp/atlas-behav-choice1999-p{1,2,3,4,5,6}.png`, particularly §2.1 pp. 174–175 and §3.1 p. 180. The scan has no usable extracted body text; no OCR/full-paper reading is claimed. Page 180 explicitly supplies the illustrative linear gain/loss values with loss multiplier 2.5: one bet is worth −25, two are worth +25. This source illustration replaces the prior unverified parameter-fit credit.
- [Richard Thaler, “Mental Accounting and Consumer Choice” (1985), original full PDF on a University of Florida faculty site](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/thaler-mktsci1985.pdf). Local `/tmp/atlas-behav-thaler1985.pdf`, SHA-256 `bb054c67ffb30cd9ab1dfa8bc43a75b248d6e6d96271a6fc4581d25b86f8cd19`. Read §3.1 printed pp. 205–207, including Eq. 2 and footnote 7, with original page-image inspection in `/tmp/atlas-behav-thaler1985-p{8,9,10}.png`. This is a 17-page PDF including its JSTOR cover; no reading of every later section is claimed. The questionnaire concerns executive-program participants who regularly drank beer, identical beach consumption without hotel atmosphere or bargaining, and median willingness to pay of $2.65/$1.50. Its general value-function specification and optional transaction weight are broader than the authored linear illustration now labeled on the page.

PDF text was extracted with the bundled Python `pdfplumber`: `pdfplumber.open(path)`, followed by each page's `extract_text()`. Original page images were rendered with `page.to_image(resolution=120).save(path)`. Corresponding `.txt` files sit beside the PDFs. Root independently read the complete Samuelson article, the cited Thaler section/footnote and all stated Read–Loewenstein–Rabin page images before final integration.

## 4.6: finite acceptance ranges and the theorem's premise

The previous visualization implied a permanent minimum accepted bundle. This is false for its own discrete model: at alpha=.5 and lambda=4, three bets have positive value and four negative value. The page now marks only the **first accepted integer within 1–100**, lists every actual accepted interval, and explicitly says that first acceptance does not imply all larger bundles are accepted. In that example the displayed ranges are `3, 5–100`. There is no inference beyond the finite window.

The model is explicit ordinary-probability evaluation, without probability weighting: `S_n=300K_n−100n` dollars, `K_n~Binomial(n,1/2)`, `v(x)=x^alpha` for gains and `−lambda*(−x)^alpha` for losses. Narrow evaluation is `n*E[v(S_1)]`; broad evaluation is `E[v(S_n)]` at one fixed reference. A single bet is rejected exactly when `lambda>2^alpha`, and is indifferent at equality. Default alpha=1/lambda=2.5 reproduces the actually read source illustration, V1=−25 and V2=+25. It is not an empirical fit or estimated preference of Samuelson's colleague. A reset button restores this source example exactly.

Dollar units are corrected: the total mean is **50n dollars**, standard deviation **150sqrt(n) dollars**, and maximum possible loss **100n dollars**. The standard deviation of the average is 150/sqrt(n). The real written prerequisite `prob-2.2.3` supplies the finite-variance weak law; for these bounded independent bets it gives `S_n/n→50` in probability and hence loss probability tending to zero. This is an actual used cross-field dependency, added consistently to item and syllabus. Finite lattice probabilities need not decrease at every n: the chance of a strict loss is 1/8 at n=3 and 5/16 at n=4. At n=100 it is approximately 0.0004368599184562, or 0.04368599184562%.

Samuelson's premise is now explicit: rejection at **every reachable wealth level in the specified range**, rather than at the initial reference alone. A single fixed concave utility `u(x)=x` for x≥0 and `2.5x` below zero rejects one bet at wealth zero (−25), yet accepts two (+25); it accepts the next single bet at wealth 200, so it fails the stronger premise. This exact counterexample prevents mischaracterizing the source theorem. A separate CARA utility test supplies genuine all-wealth rejection and verifies finite-sequence rejection through independently enumerated paths and the product of one-bet expectations.

The histogram uses true dollar totals and exact discrete probabilities. Its scale-relative dollar margin retains the long 100-bet endpoint labels on narrow canvases. The middle view includes **both** complete narrow/broad paths, including positive narrow values at low loss aversion; the old broad-only range clipped them. Hollow broad markers keep coincident values visible. The strict-loss view includes all 100 integer cases with full marker margins. Text, caption, hover-free screenshots and readout distinguish assumptions, source values and exact calculations.

## 4.7: exact reservation prices and complete controls

The historical $2.65/$1.50 medians remain empirical references. The page now calls its utility explicitly an **authored piecewise-linear illustration**:

`U(p;r)=V−p+w*omega(r−p)`, where omega(z)=z for nonnegative z and lambda*z otherwise.

With V,r positive, w≥0 and lambda≥1, this is continuous and strictly decreasing in price. Its exact unique zero is `(V+w*r)/(1+w)` when V≤r, and `(V+w*lambda*r)/(1+w*lambda)` when V≥r. Both agree at V=r and reduce to V at w=0. This replaces numerical bisection as the production calculation. The two historical medians do not identify the references or utility parameters: V=1.50, w=1, hotel reference3.80 and grocery reference1.50 were **chosen** to reproduce them. That choice and the difference from Thaler's more general Eq. 2 are public scope text, rather than inferred empirical estimates.

A new asked-price slider covers the actual 0–6 dollar model domain and is synchronized with the constrained native orange drag handle. All value, reference, loss-multiplier and transaction-weight endpoints remain available, including w=0. The complete utility and component ranges are calculated from the actual current functions; the former fixed ranges clipped even default/extreme values. The allowed family includes total −27.5 and +10, both now visible. Curves use explicit domains, so view padding never introduces negative-price extrapolation. Acquisition and deal bars retain their signs, and black lines show their actual sum. Symmetric component readouts, small floating-zero normalization and a stated buy-decision tolerance avoid displaying a spurious negative zero at a reservation price. Filled/hollow reservation markers and vertically separated labels remain distinct when the two predicted prices coincide.

The existing value-function dependency `behav-2.1` is synchronized between chapter and syllabus. No probability or root-finding dependency is added merely for the graph: the model's reservation price is algebraic.

## Verification

- `node --test tests/verification-behav-bracketing.test.mjs`: **4 groups pass**. Every n=1…100 PMF is compared with independent BigInt binomial counts and dollar first/second moments; strict loss/zero masses and the 9/n Chebyshev bound are checked. All 2^n outcome paths for n≤12 independently verify the value sums over twelve curvature/loss settings and actual integer acceptance intervals. Source V1/V2, a fixed-wealth expected-utility counterexample and CARA all-wealth rejection check the theorem qualification. Reservation prices are checked across 162 parameter settings for exact zero, sign, branch, independent bisection, w=0 collapse, observed-reference reproduction and extreme component sums.
- `node scripts/check.mjs behav-4.6 behav-4.7 --static`: **2 items, 0 errors, 0 warnings**.
- `node tests/verification-behav-bracketing.mjs`: **8 final groups pass**. It exercises actual range inputs at every 4.6 control corner and all 64 4.7 parameter/asked-price corners, in light/dark at 1450/430 px. Additional cases cover the 3→4 acceptance reversal, positive narrow values, exact indifference, actual source-reset click, w=0 coincident predictions, all-zero components, and genuine native handle drags past both constrained price endpoints. Full path/rectangle containment, filled-ring/hollow-stroke/handle-glyph bounds, pairwise reservation-label separation, native canvas TextMetrics plus 2 px data-text halos, strict TeX/display overflow, escaped-currency plaintext and runtime errors are asserted. The harness waits for rendered values to match the actual controls, avoiding stale offscreen snapshots.

Final logs: `/tmp/atlas-behav-bracketing-{math,static,native}-final.log`. Generated final screenshots: `/tmp/atlas-behav-{bracket-source,bracket-flip,bracket-positive,transaction-source,transaction-negative,transaction-positive,transaction-zero-weight}-{1450,430}-{light,dark}.png`. Agent-inspected final `bracket-flip-430-light`, `bracket-positive-1450-dark`, `bracket-positive-430-dark`, `bracket-source-1450-light`, `transaction-source-1450-light`, `transaction-negative-430-dark`, `transaction-positive-1450-dark` and `transaction-zero-weight-430-light` images. The source examples, acceptance reversal, complete high-n dollar axis, positive narrow curve, negative and positive components, coincident prices, controls and readouts are legible. No canvas labels, reservation annotations or complete endpoint glyphs are clipped. Native testing caught the original narrow 100-bet axis-label clipping; the final scale-relative margin passes all four combinations. A final byte comparison against the pre-task snapshots confirms item 4.5 is unchanged and only the two authorized syllabus rows differ.

## Parent independent integration

The parent independently read the complete Samuelson article, Thaler's cited
section/weighted-model footnote and all stated original Read–Loewenstein–Rabin
page images. It checked exact finite distributions, utility distinctions,
reservation branches and actual written prerequisites. Four mathematical and
eight final native groups plus the scoped static check pass independently.
Final reversal/narrow/light, positive-narrow/wide/dark, negative-components/
narrow/dark and zero-weight/narrow/light screenshots were inspected: complete
axes, curve/glyph margins, separate reservation labels, component signs and
source/assumption readouts remain legible. Logs:
`/tmp/atlas-root-behav-bracketing-{math,native,static}.log`.

The parent moved the parallel myopic-loss-aversion application behav-2.12 from
prerequisites to related links in both chapter and syllabus. The value function
behav-2.3 is already an actual prerequisite through behav-4.1; the weak-law input
is direct. This metadata-only cleanup passed static validation. The parent
independently compared neighboring4.5 with HEAD; its body is unchanged.
193→191 pending;645 original flags resolved, with no behavior flags left in the
tracked Wave3–4 queue.
