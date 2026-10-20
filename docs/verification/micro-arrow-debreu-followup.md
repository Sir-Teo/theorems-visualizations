# Micro 9.21 — Arrow–Debreu existence and an authored production economy

Resolved after independent parent integration: **micro-9.21**. All six mathematical groups and four final native groups pass both author and parent runs; original proof and regenerated screenshots were inspected independently. The source flag and ledger are reconciled. No human approval gate applies.

Owned scope: `content/micro/ch09-d.js` item 9.21 and its isolated import; only syllabus row 9.21; `content/micro/source-audit-arrow-debreu.js`; `tests/verification-micro-arrow-debreu.{test.mjs,mjs}`; this report. The shared three-good helpers and every neighboring item, including 9.20, remain unchanged. Other agents' syllabus changes are preserved. No Git, central ledger, build, generated data or plan edits.

## Original source actually read

Kenneth J. Arrow and Gerard Debreu, “Existence of an Equilibrium for a Competitive Economy,” *Econometrica* 22(3), 1954, 265–290, DOI 10.2307/1907353. Primary university-hosted original: <https://web.stanford.edu/class/msande311/arrow-debreu.pdf>.

Saved original `/tmp/atlas-micro-arrow-debreu.pdf`; SHA-256 `0e2f3401a13662507900cef3c7430dd694fe6b0f9150fa4974e225b18cb12385`. Full extraction `/tmp/atlas-micro-arrow-debreu.pdf.txt`. Read the introduction and complete §§1–3, printed 265–279: all assumptions I–IV, competitive-equilibrium Conditions 1–4, Theorem I, the abstract-economy lemma and the entire proof of Theorem I. The introduction expressly distinguishes existence from uniqueness and stability. The review does not claim a reading of Theorem II's full §§4–5 proof or McKenzie's original.

Actual formula images inspected, avoiding OCR's missing inequalities:

- `/tmp/atlas-micro-ad-original-04.png`: printed 267, notation and I.a–c, including `Y∩R₊^ℓ={0}` and `Y∩(−Y)={0}`.
- Existing `/tmp/atlas-micro-arrow-debreu-page5.png` through `page8.png`: printed 269–272, III.a–c, IV.a–b, positive-price normalization, free-good complementarity and Theorem I. In this batch, printed 269 was reinspected for the exact semistrict condition.
- `/tmp/atlas-micro-ad-proof-13.png` through `-16.png`: printed 276–279, the price-player inequality, bounded feasible choices, compact truncation, budget-correspondence continuity, and extension from the truncated economy to the original.

The original Theorem I requires closed convex firm sets containing zero, no aggregate free output and irreversibility; closed convex consumption sets bounded below; continuous nonsatiated utilities satisfying III.c; each endowment strictly above a feasible bundle coordinatewise; and nonnegative ownership shares summing to one for each firm. III.c is semistrict quasiconcavity, not the stronger boundary preference assumptions of item 9.7. The displayed Cobb–Douglas utilities satisfy III.c on all of R₊³, including their zero-utility axes: a mixture with a positive-utility better bundle has positive utility if the worse endpoint has utility zero; otherwise concavity of log utility gives a strict improvement over the worse endpoint.

The statement now scopes itself to Theorem I and states `z≤0, p·z=0`; free goods can remain in surplus. The idea describes the actual abstract-economy/truncation proof, including its budget-continuity step. Convexity alone is no longer said to guarantee every required continuity property. The separate historical claim about McKenzie's unread original was removed from this item.

## Authored mathematical model and exact certificates

All numerical consumers, technologies, control ranges and trajectories are explicitly authored. They are not transcribed empirical data or an example claimed to appear in the original paper.

Budget shares, endowments and profit ownership are shown in the idea and isolated in the helper:

```
α = [[.5,.3,.2],[.2,.5,.3],[.3,.2,.5]]
ω = [[3,.5,1],[.5,2.5,1],[1,.5,3]]
θ = [.5,.2,.3],  total endowment = [4.5,3.5,5].
```

Utilities are `u_i(x)=∏_g x_g^(α_ig)` on R₊³; demand at positive prices is `x_ig=α_ig m_i/p_g`, with `m_i=p·ω_i+θ_iΠ`. Budgets exhaust and `p·z=0` after accounting for firm net supply.

The convex firm's feasible production set is the whole hypograph

`Y={(-L,y,0):0≤L≤1000, 0≤y≤k√L}`.

It is closed, convex, contains 0, satisfies the original no-free-output and irreversibility restrictions, and has an input/output frontier that is merely the relevant profit-maximizing edge at positive prices. Treating that curved frontier alone as the whole production set would be incorrect. The nonconvex variant has `0≤L≤3` and `0≤y≤kL^1.6`.

All endowments are strictly positive, so 0 is a strictly cheaper feasible bundle at any nonzero nonnegative price, with positive household wealth. At a zero-price good, an affordable positive bundle exists and utility can increase without bound along the free coordinate. Hence this authored model has no finite household optimum on the simplex boundary. Boundary prices therefore cannot supply an omitted equilibrium. Raster, field, market and map evaluation all exclude zero prices before division.

Let `f` be firm output, `Π=p₂f−p₁L`, `r=p₁/p₂`, `t=p₃/p₂`. The independently derived market-value equations are

```
(4.5−L)p₁ = 1.9p₁ + .9p₂ + 1.6p₃ + .38Π,
(3.5+f)p₂ = 1.35p₁ + 1.5p₂ + 1.4p₃ + .31Π,
5p₃ = 1.25p₁ + 1.1p₂ + 2p₃ + .31Π.
```

Eliminating profit and the third-good price gives the necessary clearing ratios

```
r=(1115+409f)/(1450−341L),
t=((1.25−.31L)r+1.1+.31f)/3.
```

For the convex firm, positive-price interior profit maximization gives `r=k/(2√L)`. Put `u=√L`; market clearing becomes

`1159ku²+2230u−1450k=0`.

The unique positive root is evaluated in a cancellation-resistant form. It gives all positive clearing prices, budget-optimal household demands and a globally profit-maximizing firm. The input cap cannot bind in an equilibrium because it exceeds the total available input. The root remains below the actual maximum `L=.7104788712802178` at k=3, hence below .711 throughout k=1–3; the root is increasing in k. These conclusions are not inferred from a residual search.

For increasing returns, profit is strictly convex in input, so only endpoints 0 and 3 can maximize it. At the exact profit tie both endpoints maximize, and every strict interior input earns less. Let `F=k3^1.6`. The two necessary clearing cases give:

| Chosen input | Necessary `p₁/p₂` | Capacity profit divided by `p₂` | Why not equilibrium |
|---|---:|---:|---|
|0|`1115/1450`|`F−3345/1450>0`|Capacity is better than shutdown.|
|3|`(1115+409F)/427`|`(−3345−800F)/427<0`|Shutdown is better than capacity.|

The first sign follows already from k≥1 and `3^1.6>3>3345/1450`; the second is strict for F>0. Both production choices, including a possible tie, are exhausted. Thus the authored family really has no equilibrium for all offered k. The previous conclusion happened to be true, but finite-grid/local-search failure did not establish it.

The orange tie price sets `r=F/3` and chooses `t=(1.25r+1.1)/3` so the third market clears for either true maximizer. Then

`z₁(L=0)=−29/15+223/(50F)<0`,

`z₁(L=3)=16/15+223/(50F)>0`.

Both true choices have nonzero market gaps. The helper preserves both; the illustrative iterative path selects shutdown at a tie. A relative floating-point equality check only accommodates roundoff in constructed tie prices and is invariant to the unit in which prices are expressed.

## Numerical exploration and display corrections

The old interior grid/local optimization and its global “no rest point” verdict are removed. Green and red markers now come from the exact equations. The two red candidates clear markets conditional on a specified production choice, but violate the actual firm's optimality condition; the readout explains the profit signs. Existence is separate from iteration.

The selected iteration is now an explicit integer control 0–40; the entire 41-point displacement history is retained. `T_λ=(p+λz⁺)/(1+λΣz⁺)` is evaluated only for positive prices. At such prices, Walras accounting implies a fixed point of this map is a clearing point: if `Σz⁺>0`, the fixed-point equation makes every z coordinate positive, contradicting Walras' law; otherwise nonpositive z and positive p imply z0. This algebra does not assert a continuous extension of Cobb–Douglas demand to the closed simplex or use a finite trajectory to invoke Brouwer.

The starting handle is projected onto `Σp=1,p_g≥.02`, including its actual vertices(.96,.02,.02) and permutations. This constraint does not apply to later iterates. Across the complete control matrix, a later positive price reaches about 1.15×10^-27, so scientific readouts avoid displaying it as 0.000. Exact equilibrium calculations have floating-point residuals; an unstable finite-precision iteration can amplify those, which does not revoke the analytic certificate.

The old `.59` displacement clipping is removed. Full control checks find displacement 1.3926564325. The history view includes every point, with room around iteration 0/40, zero displacement and the complete glyph strokes. Raster evaluation excludes the strip `p_g<.005`; field arrows and trajectories also stay strictly positive. Native geometry checks include actual arrow-head bounds, path strokes, filled dot rings, hollow strokes and handle hover radii. Candidate rings expand when the gold handle coincides with them. Measured labels are contained, mutually separated and clear of the handle at all tested states.

## Executed verification

Temporary independent prototype `/tmp/atlas-micro-arrow-debreu-prototype.mjs` and output `/tmp/atlas-micro-arrow-debreu-prototype.log` established the initial algebra before repository wiring. Its five groups were followed by the final six-group suite against the production helper, including the stronger price-unit test.

`node --test tests/verification-micro-arrow-debreu.test.mjs`

Final log `/tmp/atlas-micro-arrow-debreu-math-final.log`: 6 groups pass.

1. Every one of 41 actual k settings: exact convex root against direct-demand bisection without the root's coefficients, and against Gaussian market-value clearing assembled directly from the household matrices; budgets, positive prices, all three cleared markets and profit FOC.
2. Both technologies at41×10 price-ratio cases, each compared against 301 production choices across the whole capacity interval; convex interior/cap KKT and increasing-returns global endpoint maxima.
3. Every actual k: both nonconvex necessary clearing prices independently solved, both profit-optimality failures, both genuine tie choices, all sampled strict interior inputs below endpoint profit, and prices on either side of the tie.
4. All41×29×2 actual parameter settings, four starts (three trimmed-simplex vertices plus center), and every displayed step 0–40:9,512 complete trajectories, positive finite prices and income, household budgets, Walras accounting and the true complete displacement sequence.
5. Zero/negative prices rejected before division; true handle vertices, projection feasibility/idempotence, and the increasing free-good utility direction at all three simplex faces.
6. Firm choices, both tie maximizers and household demands invariant to price scales 1e-25,1e-12 and1e8.

`node tests/verification-micro-arrow-debreu.mjs`

Initial log `/tmp/atlas-micro-arrow-debreu-native.log`: four groups pass, session 23223 exited 0 and browser closed. Final-text rerun log `/tmp/atlas-micro-arrow-debreu-native-final.log`: all four groups pass, session 6823 exited 0 and browser closed.

The native matrix is 1450/430×light/dark. Each group operates both technology choices; all 8 actual technology/productivity/step-size corners; all three starting-handle vertices by native pointer movement; selected iteration 0/40 by actual keyboard Home/End; all four presets at k=1/k=3; both true tie maximizers; and an interior k=1.5/λ=.11/iteration 17 state. It independently recomputes all 41 market/profit/budget/map states in every tested trajectory. It checks finite full curves, stroke/ring/hover containment, measured label bounds and separation, display-TeX/page overflow, runtime/TeX errors and truthful scientific-price readouts.

Representative saved screenshots use `/tmp/atlas-micro-arrow-debreu-<state>-<width>-<theme>.png`, with mobile panel0/1 crops. Final regenerated screenshots inspected:

- `...-convex-tiny-positive-prices-430-dark.png`: full mobile page, scientific positive-price readouts, complete history above 1.2 and contained matrices/formulas.
- `...-convex-tiny-positive-prices-430-light-panel1.png`: full history and endpoint glyph in the light theme.
- `...-nonconvex-start-at-the-firm-s-tie-price-End-430-{light,dark}-panel0.png`: both red branches, orange/gold coincidence and legible separated labels.
- `...-certified-convex-End-430-light.png`: complete mobile theorem, controls, certified equilibrium and exact-model explanation.
- `...-nonconvex-L-3-clearing-candidate-End-1450-dark.png`: full desktop layout and conditional-clearing-versus-actual-firm readout.

All paths above have prefix `/tmp/atlas-micro-arrow-debreu`.

`node --check` passes for the chapter, helper, syllabus and native script. A direct metadata comparison confirms the paper, introduces/deps/see/refs and item identity agree between item and syllabus, with `verify:true` retained. Byte comparison against HEAD confirms every shared helper and neighboring object 9.17–9.20 is unchanged after removing the one new isolated import. `git diff --check` passes. No additional global build or data regeneration was run by this agent.

## Independent parent integration

Root independently read the introduction and complete §§1–3 of the actual original, including the abstract-economy lemma, budget-set continuity proof, boundedness/truncation argument and extension back to the full economy. Root inspected the actual printed267 production assumptions and276–279 proof formula images listed above. The strengthened-price-boundary/semistrict-quasiconcavity hypotheses were checked against the authored Cobb–Douglas production economy; the nonconvex endpoint-profit signs and tie-market algebra were independently assessed. Actual written prerequisites micro9.5/9.6/4.6 and game2.4 were read; they supply market/budget accounting, preference definitions and the correspondence fixed-point argument.

`node --test tests/verification-micro-arrow-debreu.test.mjs`:parent6/6 pass, `/tmp/atlas-root-micro-arrow-debreu-math.log`. `node tests/verification-micro-arrow-debreu.mjs`:parent4/4 pass, `/tmp/atlas-root-micro-arrow-debreu-native.log`, session86348 exited0. The full native matrix includes both technologies, all actual productivity/step corners, three pointer-drag vertices, iterations0/40, all exact presets, both true tie maximizers and the interior17 state. Static1item0errors/0warnings; syntax/diff checks pass. Root inspected regenerated430dark tiny-positive-price and1450dark conditional-L3 screenshots, finding complete uncut histories and legible formulas/controls/labels. The preset screenshot name's `End` denotes the productivity endpoint; presets intentionally reset selected iteration to0 before that capture. Human review is not required.
