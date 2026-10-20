# Exchange core and dominant-firm model

**Resolved after independent parent integration: micro-9.4 and micro-10.20.** Six independent mathematical groups, eight final native groups and static checks pass. Parent read both primary source sections, inspected actual definition/formula pages and final screenshots, independently reran the checks and verified neighboring item bodies byte-for-byte. Source flags and ledger are reconciled; no human approval is required.

## Exact sources read

Read October 19, 2026:

- Debreu and Scarf's original [A Limit Theorem on the Core of an Economy (1963)](https://ucema.edu.ar/~fr05/curso_corto/Debreu-Scarf.pdf), complete introduction pp.235–237 and §2 pp.237–240, through Theorem 1 and its complete proof before §3 begins. The actual formal blocking conditions on p.239 and competitive-allocation proof on p.240 were rendered and inspected. **The source explicitly uses weak improvement for every coalition member and strict improvement for at least one.** The existing convention is retained; no convention error is invented. The replication limit and production sections are not claimed reviewed.
- Church and Ware's authored [Industrial Organization: A Strategic Approach (2000)](https://irving.vassar.edu/faculty/gj/FTU/io/literature/church-ware.pdf), complete static §4.2, from p.124 through the end of the case on p.129 immediately before §4.2.1. Read the residual-demand and profit derivations, equations 4.1–4.7, complete Figure 4.2 explanation and static boundary discussion. Actual pp.125–127 formula/figure pages were rendered and inspected. No historical market data from its cases are imported; the dynamic-entry subsection is outside the implemented model.
- The complete [DOJ Figure2 description](https://www.justice.gov/archives/atr/figure-2-dominant-firm-and-competitive-fringe) was also read as a primary agency description of residual-demand geometry. It describes an interior optimum; the actual zero-output corner is derived directly rather than attributed to that figure.

Local source evidence:

- `/tmp/atlas-micro-debreu-scarf.pdf`, SHA256 `bab9d9cf8c7c6c8454efdddd31bbffc62a7ec3d52114e42bf559754f91b67521`; `/tmp/atlas-micro-debreu-scarf.pdf.core.txt`; actual renders `/tmp/atlas-micro-debreu-scarf-page{4,5,6}.png` (zero-based PDF indices).
- `/tmp/atlas-micro-church-ware.pdf`, SHA256 `fb8c8fe625b8a9088f1b4f6843991cd791af039d721c4d136064fea17199142a`; `/tmp/atlas-micro-church-ware.dominant.txt`; actual renders `/tmp/atlas-micro-church-ware-page{157,158,159}.png`.

Unreviewed origin credits are explicitly removed: Edgeworth1881 and the Gillies/Shapley naming claim in9.4, and Forchheimer1908/Stackelberg1934/Stigler1940 historical claims in10.20. The new credits identify the reviewed modern definition/framework, with the specific models derived independently. The old Varian chapter references are replaced with exact reviewed sources. None of those unread originals is silently certified.

## Core: defect and correction

The old classifier treated a4% logarithmic MRS gap as efficiency. A definite false positive occurs at a=.65, b=.3, endowment A=(3,3), test A=(5,1.9). Both IR constraints hold and the log-MRS ratio is.0163268933, so the old code called it core. Yet A=(5.001,1.8993), with the complementary B bundle, strictly improves both utilities by approximately3.62e−6 and3.40e−6. The repaired model constructs a larger feasible frontier improvement, approximately(5.0190859,1.8666583), with gains about3.60e−5 and3.29e−5.

The contract curve is obtained from exact marginal-rate equality:
`y(x)=10 b(1−a)x/[10 a(1−b)+(b−a)x]`.
On its interior, weighted logarithmic utilities have a strictly concave objective and this tangency is its global maximizer. Both complete-resource endpoints are also efficient. Positive reservation utilities exclude the zero-utility axes from the core.

A's frontier utility is strictly increasing in x, and B's strictly decreasing. Each reservation equality therefore has a unique endpoint. Bisection solves these equalities directly; it does not select the first/last points of a sampled path. The resulting interval is nonempty and can have zero length. The former sampled percentage-length readout and erroneous sampled-empty-core message are removed. Endpoint buttons access exact roots even between slider steps. An efficient-endowment button creates an exact singleton core.

Membership uses only numerical precision, not an economic MRS allowance:1e−10 in utility/coordinate residuals, and2e−12 when merging numerically coincident roots. Singleton blocks are checked directly from utilities. For an inefficient test allocation, its own utility levels define a nonempty frontier interval; its midpoint supplies a feasible pair improvement. Near tangency the gains are second order and can fall below floating-point resolution. That case is explicitly identified instead of drawing/claiming an unresolved candidate as a measured block; inefficiency is not reclassified as efficiency. A dedicated off-grid1e−8 curve perturbation verifies this distinction.

The full efficient curve and exact inside-box parts of both reservation boundaries are drawn. All allocations and actual witnesses remain in the feasible box. Independent endowment/test sliders preserve access when handles coincide. A singleton core has an outer green ring beyond both handles; a nearby blocking witness has a visible outer red ring. Marker strokes and hover footprints are included in containment checks.

## Dominant firm: model and global optimum

The offered sf=4,c0=8 corner has a residual choke price4 below starting MC8, so leader output is zero and equality MR=MC is false. The new statement gives the nonnegative quantity condition explicitly:
`q*=max(0,[20−(1+s)c0]/[2+(1+s)m])`.
Substituting inverse residual demand into revenue gives
`profit(q)=[20/(1+s)−c0]q−[1/(1+s)+m/2]q²`.
Its second derivative is strictly negative. At positive output the derivative vanishes; at zero it is nonpositive. This proves global optimality on all nonnegative feasible outputs, including equality and strict exit. The actual zero-output market is cleared by the fringe at20/(1+s).

The old large-fringe claim also needed qualification. If c0=m=0, q*=10 for every s, price=10/(1+s), and market share tends to one half. Positive c0 produces exit at a finite s; c0=0,m>0 produces a quantity tending to zero. These are separate exact limits of the specified model.

The same-cost price-taking benchmark is
`min{(20m+c0)/[1+(1+s)m],20/(1+s)}`.
Independent supply accounting verifies it, including flat MC and zero-price competition. The no-fringe monopoly benchmark uses the same cost function. The chosen price lies between them on every offered setting.

The left panel now includes the complete relevant fringe supply for prices 0–20, extending to quantity 80, rather than cutting it at quantity22. It includes the complete negative part of residual MR. Zero-width leader/fringe bands and overlapping text labels are avoided. The second panel displays the entire strictly concave profit curve and its actual maximum, including a zero-output marker at the boundary. Exact exit-boundary controls select off-grid costs and actual adjacent native steps enter strict exit.

## Independent mathematical evidence

`node --test tests/verification-micro-core-fringe.test.mjs` passes **6 groups**, first successfully prototyped outside the default test glob, then rerun in the repository. Final log: `/tmp/atlas-micro-core-fringe-math-final.log`.

1. All 5,041 offered taste pairs at all four endowment corners: true root endpoints, independently calculated reservation utilities, global ordering and marginal-rate equality.
2. Independent complete weighted-log objective grids verify global efficiency; an independent reservation-indifference equation/tangency solve verifies a core endpoint.
3. All 64 actual control corners independently classified; dense interior samples, the old false-core example, genuine feasible pair witnesses, singleton cores and unresolved second-order gains checked.
4. All 665,091 actual dominant-firm control settings independently satisfy market clearing, nonnegative quantity KKT, profit and both benchmark inequalities.
5. Independent complete quantity/price searches and competitive-supply calculations verify global profit, equality/strict exit and off-grid boundaries.
6. Independent costless/positive-cost/positive-slope limiting identities verify the three distinct large-fringe cases. Large-s mathematical tests are not claimed as offered browser inputs.

## Native evidence

Command: `node tests/verification-micro-core-fringe.mjs` exits 0 on the final helper, production content and tests; final log `/tmp/atlas-micro-core-fringe-native-final.log`. Two items across 1450/430×light/dark give **8 passing groups**.

Each core group tests all 64 actual taste/endowment/test corners, exact endpoint/project buttons across 16 parameter corners, all four taste-corner singleton cores, the original false-core regression and both native handles at all coordinate endpoints. Coincident controls and an exact off-grid near-tangency state are exercised. Independent utilities, IR and efficiency residuals, root identities, actual witness gains, complete curves, marker rings and handle hover footprints are checked.

Each dominant-firm group tests all 8 actual parameter corners, three exact exit boundaries including off-grid costs, and actual adjacent native steps into strict exit. Independent market clearing, profits, KKT and benchmark order are checked, alongside all complete curves, signed profit/MR ranges and marker strokes. Both items check measured labels, display math, page overflow, readout validity and runtime errors.

Inspected final screenshots include `/tmp/atlas-micro-core-fringe-9.4-singleton-3-430-light-panel0.png`, `/tmp/atlas-micro-core-fringe-9.4-old-false-core-430-light-panel0.png`, their corresponding dark panels, `/tmp/atlas-micro-core-fringe-9.4-unresolved-tiny-gain-430-dark.png`, `/tmp/atlas-micro-core-fringe-10.20-corner-3-430-light.png`, `/tmp/atlas-micro-core-fringe-10.20-boundary-2.7-430-dark.png`, and `/tmp/atlas-micro-core-fringe-10.20-corner-1-1450-dark.png`. The green singleton ring and red nearby-witness ring remain visible around the handles, the unresolved case makes no measured-gain claim, the exit marker is contained, and complete negative profit/MR plus the fringe quantity 80 curve remain visible. Both themes and narrow displays are legible.

## Scope

Only objects9.4/10.20, their imports, syllabus rows9.4/10.20 and the isolated new helper/tests/report are changed. All neighboring chapter content was compared byte-for-byte with HEAD and is unchanged. `git diff --check` passes. The author left both flags true until the parent completed the independent checks and central reconciliation. No unrelated content or shared runtime changes are included.


Parent logs: `/tmp/atlas-root-micro-core-fringe-{math,native}.log`; static4itemcheck0errors/0warnings in `/tmp/atlas-root-core-emh-static.log`. Parent inspected singleton and old false-core panel screenshots at430/light, the exact exit boundary at430/dark, and the costless leader at1450/dark. Original Debreu–Scarf pp235–240 and Church–Ware static§4.2pp124–129 were read; original images238/239and127were inspected. No further scoped defects found.
