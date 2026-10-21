# Micro10.22 — Cournot1838 and an explicit affine reconstruction

**RESOLVED after independent parent source, mathematical, native and screenshot review.** Scope is only the10.22 object/new import in `content/micro/ch10-d.js`, its syllabus row, `content/micro/source-audit-cournot.js`, dedicated mathematical/native tests and this report. No Git, central ledger, master-plan, shared helper, generated data or full-build change is made by this agent. Neighboring item bodies are preserved. No human approval is required or claimed.

## Actual primary source and reading

Read the original French1838 book *Recherches sur les principes mathématiques de la théorie des richesses*, Paris, L.Hachette, by Augustin Cournot. The existing direct Gallica PDF/text endpoints returned403. The [BnF catalogue](https://catalogue.bnf.fr/ark:/12148/cb30280488q) confirms the original edition; the [public Archive PDF](https://archive.org/download/AugustinCournotRecherches/Augustin%20Cournot%20Recherches.pdf) is a mirror of that same BnF/Gallica scan, with its BnF cover and1838 title page visible. This is the original French source, not the1897 English translation and not the uploader's modern commentary. Its [OCR](https://archive.org/download/AugustinCournotRecherches/Augustin%20Cournot%20Recherches_djvu.txt) was read for these complete sections:

- Chapter V §§26–35, printed pp61–73: zero-cost spring monopoly, revenue derivative, capacity qualification and production-cost extension.
- Chapter VII §§43–49, pp88–100: fixed-rival quantity maximization, reaction equations, successive replies and staircase, source stability discussion, many producers and capacity/cost qualifications.
- Chapter VIII §§50–54, pp101–111: negligible individual price effects, marginal cost and the section's own supply assumptions.

The title page (PDF zero-based index11), pp62/90/91/94/101 (indices82/110/111/114/121) and original foldout plate (index221) were rendered and inspected. Original p90 gives the two own-output derivative equations and successive reply construction; p91 explicitly describes dotted staircase lines and diminishing reactions. Figure2 in the foldout shows those steps. The inherited caption's claim that the staircase was not in the text was false and has been corrected. The original's two axes/curve geometry and general discussion are reconstructed in modern notation, with a separately specified affine family. General nonlinear global stability is not certified by the original geometric discussion or by our finite path.

Original p94 §46 gives `D+n p D'=0`, then explicitly qualifies unrestricted productive capacity. The many-firm formulas in this widget are derived for its zero-cost linear specialization. They are not attributed exclusively to chapter VIII, which addresses unlimited competition separately.

Acquisition evidence: `/tmp/atlas-micro-cournot-metadata.json`, `/tmp/atlas-micro-cournot1838.pdf` (230 pages; SHA256 `590edc453d872e67cd846046b6f134f467abfd8275b2f04639cdc82aa36171a9`) and `/tmp/atlas-micro-cournot1838.txt` (SHA256 `fe684fe10ecf2ba994496faaaa58158e1cb43f0e1ab1a3136d863cd87518709e`). Rendered source files use `/tmp/atlas-micro-cournot-source-{11,81,82,83,110,111,114,121,122,221}.png`. PDF main-text index = printed page+20. The two low-resolution contact sheets locate the title/text/plate; the formula/plate conclusions above use the separately rendered readable images.

The written `micro-2.1` demand definition and `pma-5.8` interior-extremum theorem were read. Both existing prerequisites are actually used: inverse demand supplies revenue, and the differentiable interior optimum supplies the first-order equation, with the nonnegative boundary handled separately. No graph-coverage prerequisite is added. Broad historical priority, later rediscovery and unread Bertrand-review claims were removed rather than supported by secondary recollection.

## Model, strategy domain and exact equilibria

All plotted numbers are **authored dimensionless parameters**, not historical observations. Each firm chooses any `q_i>=0`, faces zero fixed and variable costs, and receives the globally defined quadratic payoff
`pi_i=q_i(1-q_i-Q_-i)`.
There are no capacity or endowment constraints. The payoff uses an affine price even for hypothetical total output above1. Public scope makes this extension explicit. Replacing it by `q_i max(1-Q,0)` is a different game: at duopoly(1,1), every unilateral deviation in the price-floored game has zero profit, making it an equilibrium; the quadratic payoff is−1 and a zero-output deviation improves it. The replacement makes no same-equilibria claim for those two games.

For fixed rival output r, the own objective has derivative `1-r-2q` and curvature−2. Its unique global maximum on the nonnegative half-line is `max(0,(1-r)/2)`. For r<=1, improvement from replacing q by the reply b is exactly `(q-b)^2`; when r>1, b=0 and the improvement is `q(q+r-1)>=0`.

At a static n-firm equilibrium, Q>1 is impossible because any positive producer loses money and can choose zero. At Q=1 a positive producer can halve its output, reduce total output below1 and earn `q_i^2/4>0`. Thus Q<1; zero-output producers would then have a positive profitable reply, so every firm is active. The interior equations are `1-Q-q_i=0`. Summing gives the unique solution
`q_i=1/(n+1), Q=n/(n+1), P=1/(n+1), pi_i=1/(n+1)^2`.
These include monopoly(n=1), the duopoly point(1/3,1/3), and the static competitive limit P→0,Q→1. The right panel offers exactly the integers1–30; the connecting guides join those discrete outcomes and do not imply fractional firms or any n-firm adjustment dynamics.

## Complete duopoly path and proof

Displayed starts range over the **closed triangle** `x>=0,y>=0,x+y<=1`, so every illustrated price is nonnegative. This start domain is not a capacity restriction on either firm's strategy space. If the rival produces r∈[0,1], replacing own output by `(1-r)/2` makes total output `(1+r)/2<=1`; hence the triangle is invariant.

Firm1 replies first. Let d=y0−1/3. At odd reply s=2m+1,
`x_s=1/3−d/(2*4^m), y_s=1/3+d/4^m`.
At even reply s=2m, m>=1,
`x_s=1/3−2d/4^m, y_s=1/3+d/4^m`.
The initial x0 is erased by the first reply. Every full two-reply sweep divides producer2's error by4, proving global convergence for this specific alternating duopoly process. Both coordinates converge; finite reply18 generally differs from the exact fixed point. The production reply is centered at the represented1/3 so the exact-equilibrium button produces a constant represented path, avoiding artificial drift from the off-grid point. Mathematical assertions concern real arithmetic; numeric displays are floating-point.

The model retains initial+18 replies in a19-point path for every selected reply0–18. Faint dashed full path and all19 point marks stay present; the gold prefix/current marker shows the chosen state. The selection is a native control rather than an animation-only endpoint. Both coordinate controls offer0–1: increasing one past feasible total reduces the other. The handle uses Euclidean projection onto the closed triangle, allowing all vertices/edges. The native test exercises actual input events and actual pointer drags, not just helper calls.

## Defects repaired and visual bounds

The old handle excluded endpoints[.02,.98]² and permitted starts with Q>1 without defining that payoff domain. It offered only an animation-dependent step, solved a known linear n-firm equation with unnecessary bisection, and placed n1/n30 and zero-output markers directly on the plot frame. The new controls preserve the triangle, expose every reply, compute exact static formulas directly, and pad both plots for entire marker rings, strokes and handles. At n1, P=Q=.5; a hollow purple ring around the ink marker makes the coincidence visible. The duopoly equilibrium's green ring remains visible around the gold handle at the exact equilibrium. Axis labels identify normalized price/output units. Neither plot hides or subsamples data.

## Independent verification

`node --test tests/verification-micro-cournot.test.mjs` passes **4 groups**. The exact same tests first passed from `/tmp/atlas-micro-cournot.test.mjs` before entering the default test glob. Final output is `/tmp/atlas-micro-cournot-math-final.log`.

1. Independently evaluated quadratic payoffs over rivals0–3 and own output0–4 verify the global reply and improvement identities, Q=1 half-output deviation, and the explicit price-floor counterexample.
2. All **5,151** feasible hundredth-grid start pairs, **97,869** initial/reply states, equal the independent closed-form formulas above, preserve the triangle and unchanged rival coordinate, and satisfy profitable replies and the factor1/4 relation. The exact off-grid equilibrium remains fixed. Every selected state0–18, zero-step and invalid requests are checked.
3. A3,721-point exterior/interior projection grid checks feasibility and the projection variational/KKT inequality against all three triangle vertices. Since that inequality is linear in the comparison point, verifying the vertices verifies it on their convex hull. All5,151 feasible grid points, all corners and large exterior examples retain exact boundary behavior.
4. All30 static equilibria satisfy independent first-order conditions and global own-output deviation comparisons; monopoly coincidence, n30, and large-n limits are checked. No many-firm convergence simulation is inferred.

`node tests/verification-micro-cournot.mjs` passes **4 final native groups**,1450/430px × light/dark, saved `/tmp/atlas-micro-cournot-native-final.log`; the process exited0 and closed its browser/server. Each group checks all16 actual coupled-control start/reply/n endpoint combinations; all19 selected initial/reply states at five boundary/interior starts; all30 producer counts; direct endpoint coupling; five actual handle projections, including all three vertices and two sum-one edge points; and the off-grid exact-equilibrium button. Every native state compares the full19-point path with the independent closed forms; checks both reply curves, selected prefix/current marker, full30-point static guides and their true marker positions. Pixel evidence covers complete path/line strokes, filled/hollow marker rings and handles; canvas-text measurements, TeX overlay boxes, display-math/page overflow and runtime/readout errors are checked.

Initial screenshot inspection found that the hollow equilibrium ring's background fill erased a nearly coincident current point, although coordinate-bound assertions passed. The ring now paints **before** the path/current marker, and a dedicated native draw-order assertion prevents that occlusion. All four final groups were rerun after this correction and the visible wording cleanup. Final saved screenshots were inspected in `/tmp/atlas-micro-cournot-`: `default-1450-light-panel{0,1}.png`, `default-430-{light,dark}-panel0.png`, `exact-equilibrium-430-{light,dark}-panel0.png`, `n30-430-dark-panel1.png`, and `coupled-boundary-430-light-panel1.png`. They show the current gold dot inside the green equilibrium ring, the complete triangle/endpoint handle, the off-grid fixed-point marker, n30 endpoint dots and the concentric n1 coincidence. Both themes are legible at narrow width. Source images were inspected separately as described above; screenshots do not replace mathematical/source evidence.

Against the fresh pre-edit snapshots, every neighboring chapter object/import is byte-identical after excluding only the new Cournot import/object, and the syllabus is byte-identical outside row10.22. `git diff --check` passes. No shared renderer or controls were changed.

Scoped static: `node scripts/check.mjs micro-10.22 --static` reports **1 item,0 errors,0 warnings**, saved `/tmp/atlas-micro-cournot-static.log`. Full builds are owned by the parent. The source flag and central queue are reconciled after the independent parent checks below.

## Independent parent acceptance

Root independently read complete original French chapter V §§26–35, chapter VII §§43–49 and chapter VIII §§50–54 from the actual retained OCR, and inspected the1838 title, printed90/91/94 and foldout figure2 at readable size. The original explicitly supports the staircase attribution and separately qualifies capacity and general demand. Root read the actual demand and interior-extremum prerequisite bodies. Root assessed the unique-global-reply proof, the Q>1/Q=1 exclusion and all-active uniqueness argument, triangle projection/invariance and exact two-reply contraction, without inferring general nonlinear or n-firm dynamic convergence.

Root reran all4 math groups (`/tmp/atlas-root-micro-cournot-math.log`), scoped static0/0 (`/tmp/atlas-root-micro-cournot-static.log`) and all4 native1450/430×light/dark groups (`/tmp/atlas-root-micro-cournot-native.log`), process9463 exited0 and browser closed. Root inspected the final full mobile light page, default dark/current marker, exact-equilibrium light ring, n30 dark endpoints and n1 coincident marker crops. Ring layering, every retained state, endpoint access and text/formula bounds pass. Neighboring source objects and syllabus rows are unchanged. No production renderer or full-map timing result is changed by this content audit.
