# Game3.9: discrete Blotto and checked numerical mixtures

Candidate for independent review; the existing flag remains true. Only game3.9, its syllabus row and unique Blotto helper/reference/tests change. Other items, shared solver/runtime and central ledgers are unchanged.

## Actual source and mathematical scope

Read Sergiu Hart's actual complete20-page author-hosted [Discrete Colonel Blotto and General Lotto games](https://math.huji.ac.il/hart/papers/blotto.pdf), IJGT36 (2008),441–460, relevant Introduction and §2.1 printed441–443. Inspected printed442 pixels, including integer partitions and the exact sign-average payoff. Cached `/tmp/atlas-coordinator/sources/positional/hart-blotto-2008.pdf`, SHA256 `a1f79683e75b41aeaf88de8c1f86004e61653f5f302273de5caff395a37d1d32`. The illustration's payoff is3/2 times that three-field payoff, preserving optimal strategies. It is distinct from a majority-of-fields reward and from General Lotto's separate expectation restriction. No fullpaper theorem audit is claimed.

Read the actual [author record](https://math.huji.ac.il/hart/abs/blotto.html) and complete one-page [March29,2010 erratum](https://math.huji.ac.il/hart/papers/blotto-errata.pdf): its two reversed inequalities concern the continuous-game uniqueness proof on printed459, outside the definition and finite argument used here. The linked General Lotto addendum is not certified. Attempts to obtain the old Gross–Wagner original failed;1921/1938/1950 originals are not claimed read and do not establish priority in this revision. Hart2008 is a source publication, not an invention date.

The finite three-field proof is authored and complete. Equal budgets force an unequal pair of allocations to each win some field; all payoffs are−1/2,0,+1/2. When N≥4, some coordinate c≥2. With the other coordinates a,b, the reply(a+1,b+1,c−2) proves every pure allocation's worst payoff is−1/2. At N=3 only(1,1,1) has security0. Skew symmetry and finite minimax prove exact value0 independently of floating-point LP output. The older explanation omitted the N3 qualification in its general pure-reply reasoning.

## Model, input and geometry repairs

The complete matrices for budgets3…12 contain10…91 allocations. Candidate LP vectors undergo explicit numerical-dust cleanup and normalization, then the displayed vectors are rechecked against all original primal/dual, simplex and security inequalities. The numerical tolerance10⁻⁸ and cleanup threshold10⁻¹⁰ are disclosed; a failed check suppresses optimal support and mixed bars. Exact theoretical value, computed lower/upper bounds and gap remain distinct.

The old support marker radius5+22sqrt(q) did not make area proportional to probability as claimed. New radius20sqrt(q/qmax) does. All positive cleaned support entries are drawn and listed in full; per-point text labels were removed to prevent overlap. Every opponent payoff bar is retained, including small signed numerical residuals. The range now reflects the actual payoff domain±1/2 with full stroke margins. Both plots are full-width, and the long narrow-axis label was shortened after an actual glyph-bound failure.

The selected point is an exact allocation lattice point for the chosen integer budget. Pointer constraints snap to that lattice. A local raw setter rejects malformed or off-lattice restored points before runtime constraints can sanitize them; a budget change deliberately snaps to its new lattice before the next rendered snapshot. Previous/Next buttons allow keyboard selection of every allocation. Registered controls/handle determine all displayed values and replay exactly; no hidden random state or audio exists.

## Evidence

- Six mathematical groups pass: complete action sets/every payoff, every constructive pure reply, all ten complete LP certificates, exact rational references, every selection/lattice point, and malformed domains. `/tmp/atlas-coordinator/game-blotto-math.log`.
- `tests/verification-game-blotto-reference.py` independently enumerates labelled integer triples with Cartesian products, reconstructs rational probability vectors and checks every payoff inequality with exact fractions. All10 strategy pairs,890 security inequalities and20 simplex/positivity certificates pass. The references are `game-blotto-reference.json`; this proves those reconstructed rational pairs feasible and optimal, separately from certifying their numerical agreement with the displayed vectors. `/tmp/atlas-coordinator/game-blotto-reference.log`.
- Focused static1/0/0. Strict scratch build containing accepted HEAD plus only the four owned production files:6684written,6890planned,450chapters,85collections,0errors/0warnings, home112749bytes gzip. Logs `game-blotto-{static,build}.log`; generated outputs remain in `/tmp/atlas-coordinator/game-blotto-build`.
- Native suite exercises all10budgets and both modes, every actual bar and support-disc area, real snapped drag to representative allocations, real buttons/keys, exact state replay and10 raw malformed cases. It compares actual numeric DOM/control/model values and complete paths/strokes/markers/text/TeX/page bounds. Evidence `/tmp/atlas-coordinator/game-blotto-native.log`, images `game-blotto/`.

Existing flag awaits independent acceptance.
