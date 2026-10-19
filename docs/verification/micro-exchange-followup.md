# Walras' law and exchange-equilibrium existence

**Resolved: micro-9.6 and micro-9.7.** Five independent mathematical groups and all eight final native groups pass. Regenerated desktop/mobile screenshots have been inspected. Parent independent source/model/native review passed; both flags and the central ledger are reconciled.

## Sources actually read

Read October 19, 2026:

- Scott Condie's authored [Advanced Microeconomic Theory, complete §7.2](https://scottcondie.github.io/teaching/580/chapters/ge-existence.html): Propositions7.1–7.3, the boundary condition on the **largest** excess-demand component, and all five steps of the Kakutani proof, including boundary extension, closed graph, interior fixed point and market clearing. This is the precise modern theorem used. Local snapshot: `/tmp/atlas-micro-condie-ge-existence.html`.
- Arrow and Debreu's original [Existence of an Equilibrium for a Competitive Economy (1954)](https://web.stanford.edu/class/msande311/arrow-debreu.pdf), complete §§1.3–1.5, printed268–272: consumer sets/preferences, the individual-endowment hypothesis, budget choice, price normalization, free goods, the budget-exhaustion argument, equilibrium definition and TheoremI statement. Actual printed269–272 formula pages were rendered and inspected, including the positive-endowment inequality and zero-price/free-good qualification. This does **not** claim the original paper's complete proof or production sections were reviewed.

Original PDF: `/tmp/atlas-micro-arrow-debreu.pdf`, SHA256 `0e2f3401a13662507900cef3c7430dd694fe6b0f9150fa4974e225b18cb12385`; extracted text `/tmp/atlas-micro-arrow-debreu.pdf.txt`; actual renders `/tmp/atlas-micro-arrow-debreu-page{5,6,7,8}.png` (zero-based PDF indices). The file has30PDF pages, including cover and supplementary pages.

Unreviewed historical claims are removed explicitly. The Walras1874/Lange1942 origin/naming credit and Wald1936/McKenzie1954 general-proof credit were not established from those originals. They are replaced with the reviewed budget-identity formulation and modern authored theorem, rather than silently marked verified. The original Arrow–Debreu credit retained in9.6 identifies only the budget argument actually read. The name of Walras' law is standard terminology, with no claim here to establish its historical priority. Varian chapter references are replaced with exact reviewed sources.

## Mathematical corrections and complete model derivations

9.6 now states strictly positive prices and explains why the last-market implication needs a positive last price. Budget feasibility alone gives a nonpositive value sum. Budget exhaustion gives equality; with total unspent income U, the identity is exactly `p·z=−U`. A satiated consumer does not invalidate that accounting calculation. The readout identifies the failed exhaustion hypothesis rather than claiming that the accounting itself fails.

For the ordinary offered utilities and endowments, direct demands give
`z1(p)=5.5/p−5.75`, `z2(p)=5.75p−5.5`.
Thus the exact simultaneous clearing price is22/23. At the actual price endpoints, `z1(.1)=49.25` and `z2(10)=52`; the former fixed±9 views clipped the curves, selected markers and value bars. The new views include complete finite curves and complete selected bars without clamps.

With A's bliss utility, the maximizer is the Euclidean projection of(4,4) onto the nonnegative budget set. The bliss point is affordable exactly when `4p+4≤7p+2`, or `p≥2/3`. Its unspent income is `max(0,3p−2)`. Above this boundary, `z1(p)=−4.2+4.8/p`, so the exact market1 root is8/7, where market2 has excess supply `z2=−10/7` and U=10/7. Buttons select both exact one-market roots and the exact affordability boundary; native adjacent arrow steps cross that boundary.

9.7 specifies finitely many consumers and goods, consumption sets R+^L, strictly positive individual endowments and the precise modern hypotheses. Boundary divergence is a condition on the maximum excess-demand component, not an unqualified explosion of each component. The proof uses the reviewed Kakutani correspondence; it does not claim that a raw continuous price map is defined on zero-price boundaries. Existence is explicitly separated from uniqueness and convergence. The visible idea and scope explicitly state that the pictured Cobb–Douglas preferences do not meet strong monotonicity/strict convexity on their zero-utility axes. Their positive-price demands are interior and use the source's direct aggregate-z sufficient conditions instead; the primitive theorem is unchanged.

For the specified convex model, direct budget demands give
`z1(p)=(4+.1wy)/p−(6−.1wx)`.
The unique positive root is `(4+.1wy)/(6−.1wx)`. It lies inside the actual[.2,5] price window for every offered positive endowment; market2 clears by the independent budget identity. Writing A=4+.1wy>0 and D=6−.1wx>0 gives `z1=A/p−D` and `z2=Dp−A`: continuity and homogeneity follow from explicit budget demands, each component is globally bounded below by−D/−A, Walras' identity holds, and z1/z2 respectively diverge at the two normalized boundary limits. Thus all five aggregate conditions, rather than the stronger boundary preference assumptions, hold.

For non-convex B, utility on the budget segment is strictly convex, so only its two endpoints can maximize. For p<1 it chooses all good1, giving
`z1(p)=−wx/2+(10−wy/2)/p > g`,
where `g=10−(wx+wy)/2≥.4`. For p>1 it chooses all good2, giving
`z1(p)=wx/2+wy/(2p)−10 < −g`.
At p=1 **both** endpoints maximize and give z1=±g, neither zero. This proves no positive-price equilibrium for this exact example throughout the offered endowment range, beyond any finite root search. The former example's nonexistence claim is retained for this reason; no invented counterexample defect is claimed. The dashed vertical span marks the missing demand values, and its interior is explicitly not a demand branch.

The old filtered offer curves could suppress the non-convex trader entirely. They are replaced by the complete chosen demand allocations, including points outside the feasible rectangle and both true tie maximizers. The right view is fixed while the endowment handle moves at a given price/preference choice. Independent endowment sliders preserve exact access. A blue hollow ring remains visible when A's desired bundle coincides with the gold endowment, and the green equilibrium ring encloses the coincident demand markers.

## Independent mathematical evidence

`node --test tests/verification-micro-exchange.test.mjs` passes **5 groups**, first run successfully from a draft outside the default glob, then rerun in the repository. Final log: `/tmp/atlas-micro-exchange-math-final.log`.

1. CD demands satisfy independent budget identities, marginal-utility price conditions and homogeneity; direct comparisons across budget segments verify global optimality over extreme prices and taste weights.
2. Bliss demands match an independent scalar derivative/bisection minimizer, with exact affordability and active nonnegative bounds, and dominate independently sampled feasible bundles.
3.401 log-price grid positions in both9.6 modes satisfy independent expenditure, unspent-income and aggregate-value accounting; exact roots and±boundary perturbations verify the distinct market-clearing conclusions.
4. All34,225actual endowment grid pairs satisfy the independent convex equilibrium formula, both market-clearing equations and exact window endpoint signs.
5. All34,225pairs satisfy both non-convex branch signs at seven positive prices from.0001 to10000; both exact tie choices are checked. Independent global utility comparisons on the full budget segment establish endpoint optimality and reject every interior bundle at the tie.

## Native evidence

Command: `node tests/verification-micro-exchange.mjs` exits0 on the final content and markers. Two items across1450/430×light/dark give **8 passing groups**. The final rerun log is `/tmp/atlas-micro-exchange-native-final.log`.

Each9.6group tests both actual log-price endpoints in both modes, exact market1 roots and the exact bliss-affordability point plus actual adjacent native arrow steps. Independent budgets, unspent income, complete curves, signed bars and selected marker positions are checked.

Each9.7group tests all16preference/endowment/price corners, eight exact equilibrium/jump states and both true jump maximizers. Native pointer drags reach all four endowment corners in both modes and synchronize both sliders. The script checks every finite path/curve/rectangle/dot, complete marker rings and handle hover footprints, measured text boxes, math overflow, page overflow, readout validity and runtime errors.

Two preparation errors were corrected without weakening the claims: the styled toggle's visible label must be clicked instead of its covered checkbox; arbitrary natural-log values cannot be filled into the base10 stepped log control. The final boundary test uses the exact production button and actual native adjacent arrow steps, verifying that the resulting prices lie on opposite sides of2/3. A complete eight-group matrix passed before the marker-visibility adjustment, and another complete eight-group run passes on the final version.

Inspected regenerated screenshots include `/tmp/atlas-micro-exchange-9.6-false-Home-430-light.png`, `/tmp/atlas-micro-exchange-9.7-1-0-Home-430-light.png`, `/tmp/atlas-micro-exchange-9.7-exact-1-0-1450-light.png`, `/tmp/atlas-micro-exchange-9.7-exact-1-0-430-dark-panel1.png`, `/tmp/atlas-micro-exchange-9.7-exact-0-3-430-dark.png`, `/tmp/atlas-micro-exchange-9.6-true-End-430-dark.png`, and `/tmp/atlas-micro-exchange-9.6-clearing-true-1450-dark.png`. The extreme selected markers and signed bars fit; both actual non-convex tie choices are visible outside the feasible rectangle, the blue desired-allocation ring remains visible around the endowment, and exact market-clearing/readout states remain legible in both themes.

## Scope

Only objects9.6/9.7, their helper imports, syllabus rows9.6/9.7 and the new isolated helper/tests/report are changed. All neighboring chapter content was compared byte-for-byte with HEAD and is unchanged; `git diff --check` passes. The original flags were retained until independent parent checks completed. No central ledger, master plan, package, build or Git mutation is included.

## Parent independent integration

The parent independently read Condie's complete7.2 proof, Arrow–Debreu's
complete1.3–1.5 and actual271–272 formula pages, and the written IVT/Kakutani
prerequisites. All five mathematical groups, eight final native groups and
the two-item static check pass independently. The final high-price/bliss
narrow/dark, exact nonconvex-tie wide/light and exact convex-equilibrium
narrow/dark screenshots were inspected. Selected markers, signed bars, both
tie choices and complete conditional/existence qualifications remain legible.

Parent review found the need to state visibly that Cobb–Douglas's zero-utility
axes fail the stronger primitive preference hypotheses. The final text instead
invokes the directly verified aggregate excess-demand sufficient conditions
for that illustration; the primitive theorem remains unchanged. Independent
logs: `/tmp/atlas-root-micro-exchange-{math,native,static}.log`. Unrelated item
bodies were also independently compared with HEAD.195→193 pending;643 original
flags resolved.
