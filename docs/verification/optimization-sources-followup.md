# Optimization source review — 2026-10-17

Completed the seven assigned queue items: **opt-4.4, opt-4.5, opt-4.10, opt-4.11, opt-4.12, opt-4.13, opt-4.14** in `content/opt/ch04.js` and `ch04-b.js`. Existing dependencies and unrelated items are preserved. The scoped helper `source-audit.shared.js` replaces misleading calculations without changing the existing shared optimization helpers. No central queue, master plan, package file or global test runner is edited here.

## Primary sources and exact anchors

The main source is the [authors' freely available *Convex Optimization*](https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf), Stephen Boyd and Lieven Vandenberghe, Cambridge University Press, **2004**, seventh corrected printing **2009** as identified on its copyright page. The 714-page PDF has printed page p at PDF page p+14. SHA-256: `40d976c83c18cce1900eff8c41bd5ad408c102b813af39d05ff85678ccf8d76e`.

| Atlas item | Primary formulation/proof inspected |
|---|---|
| 4.4 Linear programs | §4.3, pp.146–148 / PDF pp.160–162: general LP (4.27), standard form (4.28), inequality form (4.29), and the complete conversion introducing slacks **and splitting free variables** into positive/negative parts. Figure 4.4, p.147, gives the level-set geometry. The normal-cone condition follows from the first-order convex optimality inequality; independent dual certificates test its implementation. |
| 4.5 Diet problem | §4.3.1, **Diet problem, p.148 / PDF p.162**: nonnegative amounts, linear nutrient requirements, cost and linear upper-bound variations. No displayed food coefficient or price is claimed to be source data. |
| 4.10 Robust LP | §4.4.2, **Robust linear programming, p.157 / PDF p.171**, equation (4.37) and the complete support-function derivation using Cauchy–Schwarz, including singular/flat uncertainty ellipsoids. |
| 4.11 GP | §4.5.1–4.5.3, pp.160–163 / PDF pp.174–177: monomials (4.41), posynomials (4.42), GP standard form (4.43), and the full log-variable/log-objective transformation (4.44). The displayed panel's closed-form optimizer is derived independently below. |
| 4.12 SDP | §4.6.2–4.6.3, pp.168–170 / PDF pp.182–184: SDP (4.50), standard form (4.51), conversion of several LMIs/linear inequalities to a block-diagonal LMI, SOCP and matrix-norm examples. **Appendix A.5.5, pp.650–651 / PDF pp.664–665**, supplies Schur-complement PSD equivalence, including the singular-block condition. |
| 4.13 Pareto/scalarization | §4.7.3–4.7.4, pp.177–180 / PDF pp.191–194: Pareto definition (4.59), scalarization (4.60), supporting half-space (4.61), convex upper image (4.62), and the **partial** converse with nonnegative weights. The text explicitly warns that zero-weight scalarization may also have dominated minimizers. The upper-image supporting argument and this qualification were read. |

For DCP, read the original [Grant, Boyd and Ye chapter, *Disciplined Convex Programming*](https://web.stanford.edu/~boyd/papers/pdf/disc_cvx_prog.pdf), in *Global Optimization: From Theory to Implementation* (2006), pp.155–210. Publication metadata agrees with the [author's chapter page](https://web.stanford.edu/~boyd/papers/disc_cvx_prog.html). The 56-page PDF has printed page p at PDF page p−154. SHA-256: `a73c90406e415621b7eb832b9c9230487d5e528cefe01e94828a1ce19ba0fa3e`. Exact anchors inspected are **§6.2 pp.174–176 / PDF pp.20–22**, product-free expression rules; **§6.3 pp.176–178 / PDF pp.22–24**, sign rules; **§6.4 pp.179–183 / PDF pp.25–29**, extended-value composition rules, monotonicity intervals and C1–C6; and **§10 pp.194–198 / PDF pp.40–44**, simple versus graph implementations, domains, epigraphs/hypographs and graph expansion. These support nonsmooth atoms as well as differentiable examples.

Current behavior was also checked against the primary [CVXPY DCP tutorial](https://www.cvxpy.org/tutorial/dcp/), specifically **Sign**, **Curvature rules**, **Example 2**, and **DCP problems**, and the primary [solver documentation](https://www.cvxpy.org/tutorial/solvers/), **Choosing a solver** and its definition of **EXP**. Exponential-cone support is distinct from SOCP/SDP support. The [publisher page for Ben-Tal and Nemirovski (1998)](https://pubsonline.informs.org/doi/abs/10.1287/moor.23.4.769) confirms authors, title, year, DOI and pp.769–805; its abstract is accessible. The robust derivation was checked in full in the primary textbook, rather than claiming the complete original paper had been read. Other unchecked priority dates were removed from the teaching items; no inaccessible historical claim remains necessary for these closures.

## Corrections and independently supported computations

### LP status and certificates

The previous solver clipped every feasible set to an arbitrary drawing box, then called the problem unbounded whenever an optimal clipped vertex touched that box. This confuses an unbounded **set** with an unbounded **objective**: a strip can have a finite optimal edge, and a zero objective is optimal everywhere even on the whole plane. It can also misclassify a feasible region entirely beyond the drawing box as infeasible. Active constraints were taken from the union of tied points rather than from the actual displayed optimizer, which can corrupt multiplier labels.

The dedicated 2-D solver now determines status independently of that box. To decide feasibility it tests the origin, perpendicular projections onto each constraint line, and all nonparallel boundary intersections. This is exhaustive: the closest point of a nonempty closed polyhedron to the origin is either interior, a projection onto one active line, or a vertex. For an unbounded objective it supplies a feasible point and a recession direction d with every ai·d≤0 and c·d<0. Candidate directions include −c and both orientations along every boundary line; in two dimensions these include the extreme rays of every nontrivial recession cone, with −c covering the full-plane case. If no descent ray exists, the finite optimum is found among the feasible candidates. A vertex is selected when an optimal vertex is available; lines, strips and singleton sets remain valid inputs. The active set refers to that chosen point; concentric rings use distinct radii so one active-constraint color does not paint over another. Up to two nonnegative normal multipliers certify −c by the two-dimensional cone version of Carathéodory's theorem. The zero objective is identified separately. Floating-point feasibility and rank tolerances are explicit in the helper; they are not symbolic-arithmetic claims.

The clipped polygon is retained solely for drawing. Unbounded states no longer pass −Infinity into level-line coordinates. The caption says optimal **point**, with a vertex when available, and the standard-form conversion now includes the necessary split x=x+−x− for free variables. Historical priority dates are replaced by the verified formulation reference.

### Diet model and price sensitivity

All coefficients and prices are explicitly **invented teaching inputs**, rather than unverifiable nutritional table data. The previously omitted **800 g upper bound per food coordinate** is now disclosed in the statement, caption, scope, infeasibility readout and plot. Choosing the same food twice creates two separately capped coordinates; this is explicit. The teaching model is not a dietary recommendation or a reconstruction of Stigler's data. Unsupported Stigler/Laderman historical priority claims are removed.

An optimal vertex **exists** for a feasible finite optimum; every optimizer need not be a vertex and ties need not give a unique diet. With fixed feasible vertices, the value is a minimum of finitely many linear price functions, hence concave and piecewise linear. The old informal food-count assertion is omitted because the displayed additional bounds change the active-constraint accounting. Every price calculation now uses the certificate-producing solver. The nutrient totals are computed from the actual solution. The 201-price curve's highlighted changes **bracket possible kinks**; the program no longer presents their sampled count as an exact analytic count.

### Robust LP

The ellipsoidal support formula is correct with a **seminorm** when P is singular. For a minimization, the price of robustness is the increase in the optimal value; the teaching panel maximizes instead, and correctly reports the corresponding decrease. Shrinking and rounding individual arcs does not eliminate every intersection corner, so the caption no longer claims it does. The 2,000 independent uniform-area ball samples illustrate a disclosed artificial sampling law; their frequency is not a real-world probability and is not the worst-case guarantee.

The coarse grid optimizer is replaced by exhaustive radial candidates for the fixed bounded model. For unit u(θ), the feasible radius is

`r(θ)=1/[max_i ai·u(θ)+ρ]`.

The six nominal rows surround the origin, so the denominator is positive in every direction. The angular cells change only when two rows tie; these boundary angles are enumerated. Within a cell the objective is `(c·u)/(ai·u+ρ)`. Its stationary angles solve `ρ c·u′=cross(c,ai)`, which has at most two solutions. Cell endpoints and all such stationary angles supply every possible maximum. The returned point is checked against **all** worst-case row inequalities. Independent nonnegative active-normal certificates establish global optimality; dense angular sampling is an additional implementation comparison. At ρ=0 the result agrees with the nominal LP, rather than losing objective value to a grid step.

### GP transformation and exact design

The source definition and logarithmic transformation agree. The proof explains log-sum-exp convexity through its PSD softmax covariance Hessian, rather than referring vaguely to a preceding item. A physical heat-loss interpretation lacking a derivation is replaced by an explicitly illustrative design cost.

For the teaching problem, increasing scale decreases `1/w+2/h`, so the area constraint is active. Put r=h/w. Then

`w=sqrt[A/(r+1/2)]`, `h=rw`, and `f(r)=(1+2/r)sqrt[(r+1/2)/A]`, with `1/γ≤r≤γ`.

The derivative has the sign of `r²−2r−2`. Thus the unique constrained minimizer uses `r=min(γ,1+sqrt3)` for the slider's γ≥1.2, giving the exact optimizer and its logarithmic image. Both plots now use this formula rather than labelling a grid approximation exact.

Original-variable nonconvexity is shown by an **actual violating chord**: choose the area-boundary points at ratios 1/γ and γ; both are feasible, but their midpoint exceeds the area budget. The ratio wedge is convex, so this failure comes from the curved area boundary. The curve `h=A/w−w/2` is strictly convex for positive w, proving the midpoint failure. The orange chord and red midpoint are drawn, and the exact positive budget excess is reported. Chord tests remain finite diagnostics, with too-few samples distinguished from emptiness. Plot ranges expand for the boundary witness at large area/aspect settings.

### SDP and cone dimensions

The special 2×2 matrix has eigenvalues `t±sqrt(s²+r²)` and represents a norm with **two coordinates**. A higher-dimensional SOC does not generally fit that same 2×2 scalar block; its correct LMI is `[[tI,z],[zᵀ,t]]⪰0`. Schur complements handle t>0 and the PSD singular condition handles t=0. The statement now qualifies **convex** QCQPs and allows auxiliary variables. Singular optima are asserted for the displayed bounded full-dimensional nonzero-objective examples; arbitrary equality-constrained SDPs or a zero objective can have an interior optimum.

The three supplied spectrahedra are intersections of discs and optional half-planes. The old nested grids are replaced by the complete finite set of circle support points in the objective direction, circle-circle intersections, circle-line intersections and line-line intersections, filtered through every constraint. A linear optimum is either at such an intersection or at a smooth active-circle support point; an optimal flat edge has an endpoint. All numerical results have independent active-normal global certificates. The eigenvalue bars still evaluate the actual affine matrix blocks at the dragged point. The reported boundary residual is floating-point roundoff, not a grid point falsely declared exactly singular.

### Pareto frontier and zero weights

The positive-weight theorem and the nonnegative-weight partial converse agree with the source. The proof explicitly explains why a supporting normal is nonnegative (the upper image contains every nonnegative coordinate ray) and why **zero weights can admit dominated ties**.

The previous implementation classified sampled grid frontier points as supported when one of 300 weights came within a tolerance of the minimum, then presented the resulting percentage as exact reachability. It now draws analytic frontiers and analytic minimizers:

- For the disc centered at (1.9,1.6), radius 1.3, a weight `(λ,1−λ)` gives `center−1.3 weight/||weight||`. Every frontier point is reached; the two endpoints need a zero weight.
- For the first-quadrant annulus, the inner quarter-circle is the Pareto frontier. With both weights positive its weighted sum is minimized only at (1,0) or (0,1), with **both** tied at λ=1/2. Every interior arc point is Pareto optimal but unsupported. The plot draws the jump without falsely connecting intermediate designs as minimizers. At a zero weight, dominated axis-segment minimizers also exist; the readout explicitly says only a Pareto representative is shown.

The exact tied endpoints are both drawn and reported. The reachability percentage and invented sampled-frontier cardinality are removed.

### DCP rules, domains and numerical evidence

The expression analyzer retains the source's sufficient sign-dependent composition rules; it distinguishes convex, concave, affine and unknown. Problem acceptance also requires a convex minimization objective, convex≤concave inequalities and affine equalities. Certification is not a feasibility or attainment guarantee. The differentiable scalar chain rule is now explicitly an illustration; nonsmooth atoms use the general theorem. A fixed atom library permits linear nodewise propagation, while formula copying and canonicalization cost are separate.

The former blanket claim that every atom becomes an SOCP or SDP was false for the displayed exponential/logarithm atoms. The text now describes supported graph/cone representations, including the exponential cone. Unsupported software publication dates and the unverified YALMIP-specific claim are removed; the original DCP authors/year remain directly supported.

Nonnegative variables alone do **not** make `log(-x)` or `sqrt(-x)` defined. The numerical diagnostics now count nonfinite/domain failures and skip them explicitly. Positive reciprocal means the atom's implicit t>0 domain; a known nonnegative sign is not an additional prerequisite for its composition rule (for example `inv_pos(log x)` is convex on x>1). Chord samples report counts of convexity/concavity **violations**, never a proof that the actual function is globally convex. The known `log(exp x)=x` and `sqrt(x²)=x` identities for positive inputs separately explain conservative unknown verdicts. Reciprocal and negation TeX group their full arguments correctly. Node labels disable the background halo so text stays legible on filled nodes. The builder stops at 31 nodes/depth 5 for readable trees and supports undo, rather than allowing unbounded trees to overwhelm the display.

## Validation

`node --test tests/verification-opt-sources.test.mjs` passes **10 tests**:

1. LP strips with finite optimum, zero objective, unbounded objectives including tiny nonzero costs, a feasible region outside the drawing box, singleton/line cases and inconsistent/zero-normal constraints.
2. All **64** control subsets with **25** cost directions (**1,600 cases**), with independently checked primal feasibility, descent-ray or nonnegative dual-normal certificates.
3. All **25** diet pairs at **12** price combinations (**300 cases**): caps, nutrient totals, primal/dual equality; infeasibility is independently certified by a requirement that even both upper bounds cannot meet.
4. Finite second-difference price concavity on three feasible food pairs.
5. **144** robust parameter/direction cases: all worst-case rows, independent active-normal global certificates, nominal agreement at zero uncertainty, **10,000-angle** independent comparisons per case, and 64 uncertainty-boundary directions per row.
6. **15** GP budget/aspect cases, including the unconstrained ratio transition: independent **10,001-ratio** scans, exact active area and aspect feasibility, and strict original-variable chord violations.
7. **216** SDP family/direction cases: all disc/cut constraints, boundary residuals, independently derived nonnegative normal-cone certificates, and dense circle-boundary comparisons.
8. The 2×2 PSD/SOC equivalence on 484 integer/half-integer parameter combinations, including zero and negative t.
9. **101** Pareto weights and 1,001 arc samples per weight, exact disc support formula, zero-weight endpoints and both ring ties.
10. Thirteen DCP expression cases, sign-sensitive composition, implicit positive domains, identity conservatism, grouped reciprocal TeX, domain-failure/skipped counts and finite chord accounting.

`node tests/verification-opt-sources.mjs` exercises all seven displays in **both light and dark themes** (**14 browser groups**) with real pointer drags, toggles, segmented controls, buttons and keyboard sliders. It covers LP cost/constraint drags, all constraints off, infeasibility and restoration; every food pair and price extremes with all nutrient/cost panels; zero/max robust uncertainty and four objective directions; all GP area/aspect endpoints with mapped exact solutions and visible plot bounds; all SDP block families, direction endpoints and candidate feasibility drags; both Pareto frontiers with zero, near-half and exactly-half weights and tied gold points; and all eleven DCP presets, all fifteen atom buttons, undo, invalid domains, skipped evaluations and the builder cap. Initial harness runtime/TeX/blank checks, live TeX errors, page errors and finite plotted point coordinates are checked. Mathematical certificates support universal optimality in the finite teaching problems; random samples alone do not establish the general theorems.

Representative captures use `/tmp/atlas-opt-{lp,diet,robust,gp,sdp,pareto,dcp}-{light,dark}.png`. GP, Pareto and DCP captures are inspected directly for mapped axes, jump/tie behavior and expression grouping/curvature labels. Syntax, scoped whitespace checks and all fourteen original dependency arrays are verified. No Wave 5 gate is changed.
