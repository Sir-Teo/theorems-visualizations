# Philosophy 3.7: categorisation, static bistability and finite sweep lag

Status: **resolved: phil-3.7 after independent root acceptance**. Only 3.7/import, its syllabus row, the isolated helper, two tests and this report are in scope. Committed liar/barber/surprise and demo work, all neighboring chapter objects and shared inputs/renderers are preserved. No Git mutation, central ledger/plan, generated data or build was performed.

## Actual primary source

Pamela Case, Betty Tuller, Mingzhou Ding and J. A. Scott Kelso, **“Evaluation of a dynamical model of speech perception,” Perception & Psychophysics 57 (1995), 977–988**, DOI 10.3758/BF03205457.

- Actual publisher scan: https://link.springer.com/content/pdf/10.3758/BF03205457.pdf.
- Retained `/tmp/atlas-phil-hysteresis-case1995.pdf`, 12 pages, SHA256 `0a21a46673e0b79474d6918834211f7d5aa52057c59b587eabdae86f2d3cf4da`.
- Full navigation extraction `/tmp/atlas-phil-hysteresis-case1995.txt`, SHA256 `3fbe3ca21ae71ba2d43d7c0db878e917e0d1e5bdcd731b0a1db24bc629c3bbe9`.
- Read the main text from printed pp. 977–987: the introduction's three response patterns; scalar potential and learned tilt, Eqs. 1–3 and Figures 2–4; qualitative-versus-quantitative qualification; actual methods and task; reported results and their asymmetries; alternative explanations, context/time-dependence discussion and conclusion. The references continuing onto p. 988 were not independently researched.
- Inspected actual p. 978 equations, whose potential is missing from the text extraction, and p. 979 Figure 2/Eq. 3 at `/tmp/atlas-phil-hysteresis-case1995-page-2.png` and `...-page-3.png`.
- The experiment used 16 American-English-speaking psychology students, assigned to sequential and mixed-presentation groups. It varied silent gaps 0–76 ms in 4-ms increments between natural /s/ and synthetic “ay”; participants identified “say”/“stay” and rated category goodness. The published interstimulus interval was 3 seconds. **None of these durations, participant observations, percentages, ratings or fitted curves is used as numerical input to this visualization.** The public statement retains only the qualitative task/outcome description.
- The actual results section, p. 983, reports hysteresis, enhanced contrast and common-boundary patterns in this 1995 study. The sequential-presentation group's identical endpoint stimuli received higher goodness ratings on their later occurrence; the turnaround and mixed-presentation comparisons differed. The item therefore avoids a universal claim about every presentation condition or every categorisation task.
- Equations 1–2 give `dx/dt = -k+x-x³` and `V(x)=kx-x²/2+x⁴/4`. The source separately varies k through a learned, history-dependent rule, Eq. 3, to address contrast and other context effects. The new family at r=1, s=-k agrees algebraically with Eqs. 1–2. It **does not implement Eq. 3**, its cognitive parameters, noise, inferred stability measurements or empirical calibration. The source itself calls its correspondence qualitative and its coefficients convenient rather than fitted, p. 980.

The original 1994 paper was located through an author-uploaded record, but no full original-PDF reading is claimed. Its original-specific attribution is removed from the public item; the public refs and credit identify the actual 1995 primary paper read. The old generic encyclopedia citation, color-patch empirical example and inference that path-dependent reports disprove every single sorites cutoff are removed. No claim of a universally accepted philosophical interpretation remains.

## Actual prerequisites

Read `phil-3.1`'s authored sorites premises and argument. These motivate a comparison but do not derive this dynamical model, so the link moves to `see`.

Read actual `ode-1.7` phase-line statement/argument and `ode-1.8` linear-stability statement/argument in `content/ode/ch01.js`, including the essential warning that zero derivative does not classify stability. The model uses the latter's `lambda=f'(z*)` test and its nonlinear-zero caveat, so the sole added prerequisite is `ode-1.8`, which already depends on phase-line analysis. The chapter and syllabus agree. No prerequisite was edited.

## Exact model, equilibria and stability

The authored dimensionless family is

`z' = f(z;s,r) = rz-z³+s`, with `V(z;s,r)=z⁴/4-rz²/2-sz`.

The controls are reinforcement r in [-.5,1.5], time per forcing leg T in [4,160] model-time units, endpoint preparation at s=-1 or +1, and cycle point 0…200. The source's acoustic gap units and real presentation times do not calibrate any of these controls. Negative and positive z are illustrative labels A/B; z=0 is the boundary, not a third response.

At held s, equilibria satisfy `s=z³-rz`; their linear slope is `lambda=r-3z²`.

- If r<=0, `z³-rz` is strictly increasing and has exactly one root. It is attracting with lambda<0 except at r=s=0. There `z'=-z³`, and `z(t)=z0/sqrt(1+2z0²t)` proves attraction despite lambda=0.
- For r>0, put q=sqrt(r/3) and h=2(r/3)^(3/2). At |s|<h there are three distinct roots: the outer roots have lambda<0 and the middle has lambda>0. Thus two attracting states coexist, separated by a repelling state.
- At s=+h the roots are -q (a double, one-sided-attracting fold) and 2q (attracting); at s=-h they are -2q and +q. At a fold lambda=0 and the leading quadratic term determines its one-sided behavior. These are not mislabeled as linearly attracting points.
- Beyond either fold there is one attracting equilibrium. Since the largest h over the offered r range is sqrt(.5)≈.7071<1, both endpoint preparations have unique equilibria. There is no hidden branch-selection ambiguity in reset/preparation.

The helper brackets each simple root on its analytically monotonic interval; it handles exact double roots and the r=s=0 critical point separately. It does not scan for sign changes and miss a tangent root. Displayed equilibrium paths use the parameterization `(s,z)=(z³-rz,z)` with exact endpoint roots and explicit breaks in branch classification at ±q. Orange rings mark the folds.

For held s, `dV/dt=-f²<=0`, justifying the potential/minimum interpretation. During the forced cycle V additionally depends on s(t); no monotone-energy claim is made for the whole forced loop.

## Forcing, numerical update and meaning of history

For low-end preparation, the forcing is `s(t)=-1+2t/T` on 0…T and `s(t)=1-2(t-T)/T` on T…2T. High-end preparation reverses its sign. The state starts at the unique equilibrium of the chosen endpoint. It is **carried through the turnaround without a reset or endpoint equilibration**.

The integrator stores 201 points, with 100 equal time intervals per leg. Every stored interval is divided into RK4 substeps at most .01 model-time units. All four RK stages evaluate the changing stimulus at the correct within-substep time. The state at the last RK stage is not accidentally advanced once more before the next leg. Zero crossings are interpolated within substeps, with leg and A→B/B→A direction retained.

For every offered parameter and input, f(-1.5)>0 and f(+1.5)<0. Endpoint equilibria and all continuous trajectories are trapped in (-1.5,1.5), so the padded plot y range [-1.75,1.75] is an actual reachable-state bound. The numerical suite independently verifies this for its full offered grid/cycle sample. The x view [-1.18,1.18] also contains all s endpoints, curve strokes and complete marker rings.

Static branch continuation explains quasistatic hysteresis. A finite-speed trajectory can lag even with r<=0 and one equilibrium, so the item never equates any finite loop with proof of bistability. The complete-cycle readout names each actual crossing and direction rather than assigning an arbitrary loop-width tolerance:

- r=-.5,T=4 has outward and return crossings near s=.53796 and -.53460 despite no bistability. At T=160 the outward lag shrinks to about .02446 but remains positive.
- r=1,T=4 has **no outward crossing** and an **A→B crossing during the stimulus return** near s=.63799. A return in s need not be a return to category A.
- r=1.5,T=4 has **no category crossing anywhere in the full excursion**.

These cases are displayed honestly; none is reclassified as contrast or hidden. Memory/path dependence means that the current s is not the whole state. It does not imply that contradictory propositions were asserted in one fixed context or settle the sorites by itself.

## Implementation and native controls

The unexplained tanh/fatigue variables and claim that a>1 alone guarantees bistability are replaced by this explicitly declared family. The scalar quartic potential is source-related; its r-family and direct triangular drive are authored. The original fatigue/contrast slider is removed because it was neither this paper's learning mechanism nor justified by the old static claim.

The three sliders expose r, T and the current cycle point. Endpoint preparation genuinely recomputes the cycle from its equilibrium. Reset selects point0 of that prepared cycle; Outward endpoint selects100; Complete return selects200; Previous/Next point move one stored time interval and disable at the endpoints. Point200 is not declared equilibrated. The readout shows current time/stimulus/state/velocity, every equilibrium's kind/slope, exact static folds or their absence, and complete-cycle numerical crossing events. All quantities are explicitly in model units.

## Independent mathematical evidence

```sh
node --test tests/verification-phil-hysteresis.test.mjs
```

`/tmp/atlas-phil-hysteresis-math-final.log`: **4 groups pass**, session42569 exited0. The initial draft passed under `/tmp/verification-phil-hysteresis.test.mjs` before installation into the default test glob.

- All41 offered reinforcement grid values ×201 stimulus values:8241 settings. An independent closed cubic formula checks every root; root counts, residuals, lambda signs, all exact fold roots and nearby two-sided root counts are verified. The nonhyperbolic attracting critical point is checked separately.
- Every parameterized branch point is a root, its stability sign agrees, the branch endpoints reach s=±1 exactly to numerical precision, and every complete path lies within the proven bounds. Central differences of V independently verify `V_z=-f`. The inward vector field at z=±1.5 checks the trapping argument at all parameter/input corners.
- Every41 r value ×fast/default/slow T={4,40,160} ×both preparations:246 full cycles. Verify 201 times/stimuli, actual preparation, turn-state carry, high/low symmetry, reachable bounds and crossing-time/stimulus correspondence. Explicit late-switch/no-switch/monostable-lag witnesses are tested.
- Ten low-start corner/interior trajectories, r={-.5,0,.05,1,1.5} ×T={4,160}, are compared with independent implicit-midpoint Newton solutions at maximum steps .004 and .002, Richardson-extrapolated. This uses neither the helper's RK tableau nor its bisection root reference. Maximum trajectory difference is **1.3079732852361303e-9**; maximum coarse/fine midpoint difference is1.7614145306210638e-6. These are observed numerical comparisons, not a claimed rigorous global RK error bound. Invalid control domains are rejected.

## Native browser, geometry and screenshots

```sh
node tests/verification-phil-hysteresis.mjs
```

The final complete run passes **4 groups** at1450/430 pixels ×light/dark, session97698 exited0/browserclosed, `/tmp/atlas-phil-hysteresis-native-final.log`. This rerun includes exact current time/stimulus/state/velocity and equilibrium/slope readout assertions. Native checks include the full item scope, in addition to statement/caption/idea, for TeX and page bounds.

Each viewport/theme group checks:

- Every201 cycle point in both endpoint preparations, with actual slider input events.
- r={-.5,0,.05,1,1.5}, T={4,160}, both preparations and point={0,50,100,150,200}; additionally all41 r values at T40/point100. An independent implicit-midpoint trajectory reference checks all201 states for every such r/T/preparation setting; analytic roots check all current equilibria.
- Native Home/End/ArrowLeft for all3 sliders, including actual r=-.5/1.5/1.45, T4/160/159 and point0/200/199. Actual input, internal value, numeric output and min/max agree. The parser recognizes the typographic minus in the correctly formatted output.
- Reset, Outward endpoint, Complete return, Previous/Next and their disabled endpoints. Native Enter changes endpoint preparation. Return retains the exact actual turn state.
- Every displayed equilibrium point/path, current dot, history segment and full-cycle event/readout, including late-switch and no-switch witnesses. Every path half-stroke, hollow marker half-stroke, filled-dot ring, measured canvas label, displayed TeX and full page lies within its bounds; no browser or TeX errors occur.

An initial harness-only numeric parser treated the rendered Unicode minus as JavaScript NaN at r=-.5. Normalizing that glyph before numeric parsing fixed the assertion; no production value or display was changed. The subsequent full four-group run passed.

Actual native-size panels inspected:

- `/tmp/atlas-phil-hysteresis-default-430-light-panel.png`: separate static fold rings and finite-speed switches.
- `/tmp/atlas-phil-hysteresis-no-switch-430-light-panel.png`: complete forcing return with state staying below zero.
- `/tmp/atlas-phil-hysteresis-monostable-lag-430-light-panel.png`: a finite-speed loop alongside a single attracting branch.
- `/tmp/atlas-phil-hysteresis-slow-bistable-1450-light-panel.png`: both full-endpoint branches and delayed finite-time switches.

The final regenerated `/tmp/atlas-phil-hysteresis-late-switch-430-dark.png`, `/tmp/atlas-phil-hysteresis-critical-430-light.png` and `/tmp/atlas-phil-hysteresis-slow-bistable-1450-dark.png` were also inspected as actual full-page images. They show all controls, endpoint-disabled buttons, full readouts, wrapped formulas and scope without page overflow. The previously inspected native-size panels preserve legible detail independently of scaling a tall full-page image. The source page images were inspected at native rendering size before model implementation.

Static `node scripts/check.mjs phil-3.7 --static` passes1item,0errors,0warnings; `/tmp/atlas-phil-hysteresis-static-final.log`, session74011 exited0. Read-only byte comparisons confirm the full chapter outside3.7/new import and full syllabus outside3.7 unchanged against HEAD, including parent's newly committed4.1 row. `git diff --check` passes.

## Frozen integration paths

- `content/phil/ch03.js`: only3.7 and isolated helper import.
- `content/phil/syllabus.js`: only3.7 row.
- `content/phil/source-audit-hysteresis.js`.
- `tests/verification-phil-hysteresis.test.mjs`.
- `tests/verification-phil-hysteresis.mjs`.
- `docs/verification/phil-hysteresis-followup.md`.

Source flag is resolved after independent root review. No source-credit closure is claimed for the unread1994 original; the retained item independently identifies and uses the1995 primary source and explicitly authored mathematics.

## Independent root acceptance

Root read the actual Case et al. printed pp. 977–979, the qualitative-coefficient qualification on p. 980, the actual result discussion on p. 983 and the conclusion/context discussion on p. 987. Actual p. 978 equations and p. 979 Eq. 3/Figure 2 images were inspected. This is narrower than the agent’s main-text reading above. The scalar equation/potential, learned tilt and actual speech observations remain separate; no unread 1994 original or fitted participant trajectory is used for closure. Root also read the actual ode-1.8 statement/argument, including its zero-linear-slope caveat, and the complete new item/helper/math/native code.

Independent root reasoning verifies the monotonic cubic root intervals, q=sqrt(r/3), fold magnitude 2(r/3)^(3/2), the one-sided double roots and the explicit nonlinear solution at r=s=0. At the offered trapping boundaries the worst inward margins are 0.125; the finite trajectories therefore have a source-independent reachable-state bound. Held-input dV/dt=−f² does not imply decreasing V during a varying input. The RK4 stages use the changing drive, and the return carries the actual turn state. Root confirmed that finite monostable lag, a first category switch on the return leg, and a complete no-switch excursion are not relabeled as static bistability.

Root reruns pass **4 mathematical groups**, **4 native groups** (1450/430 px in both themes) and static **1 item / 0 errors / 0 warnings**. Logs `/tmp/atlas-root-phil-hysteresis-{math,native,static}.log`; all processes exited 0 and closed their browser/server resources. The independent implicit-midpoint/refinement comparisons are numerical evidence, not rigorous global error bounds. Root inspected the complete narrow late-switch dark and critical light pages plus actual monostable-lag/no-switch panels. Exact byte guards preserve all chapter neighbors and syllabus rows outside this item. The actual flag/central queue are reconciled, closing the last queued philosophy review in the Wave 3–4 inventory.
