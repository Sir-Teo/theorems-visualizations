# Political science 5.4–5.5: finite juries and an authored shared leader

Resolved after independent root acceptance: **polsci-5.4 and polsci-5.5**. The source flags and queue are reconciled. This batch changes only the two numbered objects, their required isolated import, their two syllabus rows, and the specifically approved chapter-summary sentence corrections. It does not close source flags itself. The frozen psych retina batch was not edited.

## Actual source and reading scope

**David Easley and Jon Kleinberg, _Networks, Crowds, and Markets_ (2010), author preprint, chapter 23.** Full 39-page chapter downloaded from the authors’ Cornell site:

- URL: <https://www.cs.cornell.edu/home/kleinber/networks-book/networks-book-ch23.pdf>
- Local PDF: `/tmp/atlas-polsci-easley-kleinberg23.pdf`;614,473 bytes; SHA-256 `7ae5d33898bd4fed0a7e0f894a6bc112cf48338e943dadfd5a17180821c69a70`.
- Extracted text: `/tmp/atlas-polsci-easley-kleinberg23.txt`, with explicit one-based PDF-page separators.
- Read the complete §23.7, printed pp.756–758, PDF pages 22–24, stopping where §23.8 begins. It fixes a true best of two alternatives, simultaneous sincere votes, equal-accuracy independent private signals, the symmetric prior/Bayes interpretation, and the probability limit. The authored account also explains its connection to Condorcet. Actual page 23 formula image inspected at `/tmp/atlas-polsci-easley-kleinberg23-page23.png`.
- No claim to reading the entire 39-page chapter, Shepsle, Condorcet’s original 1785 essay or Ladha 1992. The unsupported original-year credit field and the unread Ladha reference were removed. The conventional theorem name remains. The finite-size monotonicity identity, variance bound and common-leader construction are derived explicitly here rather than attributed to unread originals.

Reproduction: `curl -L --fail --silent --show-error 'https://www.cs.cornell.edu/home/kleinber/networks-book/networks-book-ch23.pdf' -o /tmp/atlas-polsci-easley-kleinberg23.pdf`; inspect SHA-256 and extract/render with the bundled Python’s `hashlib`, `pdfplumber.open`, `page.extract_text()` and `page.to_image(resolution=130)`. Author preprint PDF page numbering is 39 pages even though only pages 22–24 support the used account.

Read the actual statement/idea/caption/dependency bodies of `prob-2.1.1a` (product-rule independence), `prob-2.2.3` (second-moment weak law and its variance estimate), and `prob-4.1.1a` (conditional expectation, including a finite positive-probability partition). These are used in the new visible proofs. The old pivotal-vote result `polsci-5.3` was read and moved to `see`: its tie probability theorem is not needed for the independent-majority proof.

## Repairs and independent reasoning

### 5.4: exact finite formula, qualified limit

For odd `n=2m+1`, independent Bernoulli indicators give the finite binomial tail. Independence gives mean `np` and variance `np(1−p)`. If majority is wrong, its correct-vote fraction is at most `(n−1)/(2n)<1/2`; for fixed `p>1/2` this is a deviation strictly greater than `p−1/2`. The written weak-law variance estimate therefore bounds error by `p(1−p)/(n(p−1/2)²)`. Clipping the resulting lower bound below at zero preserves validity. It can be loose. This replaces the inherited unexplained Hoeffding display with the actual prerequisite used in the proof.

The exact two-additional-voter difference is `C(n,m)[p(1−p)]^(m+1)(2p−1)`. To derive it, count the old `m`-success case changed by two successes, and subtract the old `m+1`-success case changed by two failures. Their binomial coefficients coincide. Strict increase/decrease requires interior probabilities; deterministic endpoints are constant. Complement symmetry gives the worse-than-chance result and the exact fair-coin result. Finite error remains positive for `0<p<1`; convergence is not finite certainty. Odd juries avoid all tie-rule ambiguity. The insufficient heterogeneous-competence scope claim was removed.

Controls offer every competence tick 0–1 by .005 and every odd size 1–301 by 2, including 0,.5,1. The left plot contains both competence curves and the applicable bound, with chosen finite markers. The right plot draws all `n+1` outcomes with adaptive full vertical bounds and padding below zero; bars are centred at integer correct-vote counts, the strict-majority outcomes are green. At 301 some probabilities have subpixel bar heights; at extreme competence some individual masses also underflow binary64 and have zero numerical height, explicitly disclosed in scope. No count class is removed, and the majority-error readout is evaluated separately.

### 5.5: authored conditional mixture and all three regimes

The model is explicitly authored, not empirical and not attributed to Ladha. Draw leader correctness `Y~Bernoulli(p)`, independent copying indicators `F_i~Bernoulli(rho)`, and independent private correctness indicators `Z_i~Bernoulli(p)`. All primitives are mutually independent. Counted vote `X_i=F_iY+(1−F_i)Z_i`; the leader is not counted separately.

Condition on the two positive-probability cells of `Y`: correct-vote probabilities are `q1=rho+(1−rho)p` and `q0=(1−rho)p`. The finite probability is the displayed weighted sum of the two binomial tails. The common marginal remains `p`. For distinct votes, `E(X_iX_j)=p q1²+(1−p)q0²`; subtracting `p²` gives `rho² p(1−p)`, and division by positive marginal variance yields correlation `rho²`.

Since `q1>1/2`, its conditional majority accuracy tends to one. For `rho*=1−1/(2p)`, `q0` is above, equal to or below one half. The total limits are respectively 1, `(1+p)/2`, and `p`. At equality `q0=.5` exactly; `q1=1.5−1/(2p)`. The inherited readout incorrectly assigned the equality case the leader’s accuracy. The repaired picture has two hollow limiting endpoints and a filled middle value. A fixed positive subcritical following probability gives positive correlation and limiting accuracy one, so dependence alone is not asserted to break the conclusion.

Manual controls retain `p=.55… .9` by .005, `rho=0…1` by .01 and every odd `n=1…401`. Manual regime classification compares exact decimal fractions using BigInt, with no proximity tolerance or rounded label used as a certificate. Thus `.625,.20` is exactly critical, whereas adjacent decimal numbers are on opposite sides. The separate saved `exact critical case` selector supplies the analytic threshold for every competence, including off-grid thresholds. Its manual slider is visibly disabled and explicitly described as unused; the readout says the displayed threshold is rounded and uses exact `q0=.5`. The manual input/value/output remain consistent with each other. It is not silently snapped to the threshold. Both finite paths include all odd sizes; the following curve includes all 101 manual ticks and the actual threshold.

### Numerical evaluation

`juryProbability` evaluates the smaller tail by a monotonically decreasing series beginning at the strict-majority cutoff, retaining its logarithm. Correct and incorrect probabilities are calculated from that rare tail rather than obtaining rare errors by subtraction from a rounded one. `juryMass` builds a binomial distribution outward from its mode and normalizes it. Endpoint probabilities are exact branches. The helper rejects even sizes and invalid probabilities. The shared inherited chapter helpers were not modified.

The readout labels any six-decimal accuracy rounding to one as displayed precision. Tiny positive values use scientific notation; a helper probability below binary64’s representable positive range retains a finite log and an explicit status. The 5.4 offered maximum size is301; a below-range 401/.995 helper case is separately tested, not portrayed as an offered 5.4 input. The dependence model’s two conditional tails may underflow individually at an extreme, while its weighted aggregate has a finite explicitly evaluated probability. No numerical formula is called an exact empirical prediction.

## Approved summary-only corrections

Chapter old sentence: “Condorcet's jury theorem says that a majority of independent voters who are each better than chance is almost surely right when the group is large; it fails when votes are correlated, and strategic jurors who vote as though they were pivotal can make a unanimous jury convict more innocent defendants as it grows.”

Chapter replacement: “For independent voters with the same fixed better-than-chance competence, Condorcet’s jury theorem sends majority accuracy toward one as odd jury size grows; a shared-leader model shows how dependence can obstruct this conclusion, and strategic jurors who vote as though they were pivotal can make a unanimous jury convict more innocent defendants as it grows.”

Syllabus old sentences: “Condorcet’s jury theorem shows that a majority of independent, better-than-chance voters is almost surely right in large groups. The theorem breaks when votes are correlated or when strategic voters condition on being pivotal.”

Syllabus replacements: “For independent voters with the same fixed better-than-chance competence, Condorcet’s jury theorem sends majority accuracy toward one as odd jury size grows. Shared influence can obstruct that limit, and strategic voters may condition on being pivotal.”

All other summary wording and all neighbouring numbered objects/rows are preserved.

## Verification

- `node --test tests/verification-polsci-jury.test.mjs`: 5 meaningful groups pass. Full enumeration of every vote vector through 13 voters checks each count probability and moments. All 201 competence ticks and 201 odd sizes checks complements, endpoints, monotonicity difference and the lower bound. Forty independent Python Decimal 110-digit references check probabilities and log tails. All 71×101 manual dependence inputs check the exact integer threshold oracle at three sizes; independent leader/copy/private primitive enumeration checks finite mixtures and pair correlation. All 71 analytic critical competencies and domain-rejection cases pass.
- Decimal reference generator: `/tmp/atlas-polsci-jury-fixtures.py`; result `/tmp/atlas-polsci-jury-reference.json`; 40 references embedded in the dedicated unit file. It uses Python `decimal.localcontext(prec=110)` and `math.comb`, sums both tails separately, and uses Decimal natural logarithms. Sizes 1,3,31,301,401; probabilities.005,.05,.3,.5,.55,.8,.9,.995. No production helper or shared binomial function enters the oracle.
- `node scripts/check.mjs polsci-5.4 polsci-5.5 --static`:2 items,0 errors,0 warnings.
- Final native/themed evidence and exact frozen scope are recorded below.

### Final native and visual evidence

`node tests/verification-polsci-jury.mjs` passed all8 groups: two items ×1450/430 CSS pixels ×light/dark. Final selection-layer refinement was followed by `node tests/verification-polsci-jury.mjs 5.5`, passing all4 affected groups again. The larger gold selection is drawn before the red limit markers, so coincident finite values do not hide the limiting open/closed convention. No probability/model change was made in that refinement.

The native test uses the real served modules, actual range inputs, native Home/End/ArrowLeft, and actual runtime `snapshot()` plus destroy/remount with saved state. It checks input min/max/step/value/output/ARIA agreement; the critical mode’s disabled manual input and restored selector; all201 competence ticks and every151 offered odd size for5.4; all101 manual following ticks, all71 analytic critical competencies, manual exact equality and both neighbouring ticks, size and competence corners for5.5. It independently computes finite checks with Bernoulli convolution rather than production rare-tail evaluation, including all histogram counts and samples of both jury-size curves. It verifies all finite curve samples and all bars/lines/dots/rings against complete plot bounds, as well as canvas text, TeX overlay/page bounds and absence of runtime/TeX errors. Tests include all-zero/all-one competence, n=1, manual rho=0/1, tiny positive error, exact-critical n=1 and401, and positive-dependent consistency below the threshold. Resize/label checks after a real remount wait for the browser’s two-frame resize cycle; no shared runtime code was changed.

Logs:

- `/tmp/atlas-polsci-jury-math-final.log`:5/5 mathematical groups pass.
- `/tmp/atlas-polsci-jury-native-final.log`:8/8 native groups pass.
- `/tmp/atlas-polsci-jury-native-dependence-final.log`:4/4 final-layer native groups pass.
- `/tmp/atlas-polsci-jury-static.log`:2 items,0 errors,0 warnings.

Screenshots saved for defaults and selected edge cases at all4 theme/viewport combinations. Complete430-light/dark pages were inspected for both items; representative1450 and430 critical panels were also inspected, including n=1 to separate its finite accuracy from the filled limiting middle point. Examples:

- `/tmp/atlas-polsci-jury-5.4-default-430-light.png`
- `/tmp/atlas-polsci-jury-5.4-default-430-dark.png`
- `/tmp/atlas-polsci-jury-5.4-tiny-positive-error-1450-dark.png`
- `/tmp/atlas-polsci-jury-5.5-default-430-light.png`
- `/tmp/atlas-polsci-jury-5.5-default-430-dark.png`
- `/tmp/atlas-polsci-jury-5.5-exact-critical-small-jury-430-dark-panel1.png`
- `/tmp/atlas-polsci-jury-5.5-exact-critical-430-light-panel1.png`
- `/tmp/atlas-polsci-jury-5.5-manual-critical-430-light.png`
- `/tmp/atlas-polsci-jury-5.5-dependent-consistent-430-dark.png`

### Frozen scope manifest

1. `content/polsci/ch05.js`: only5.4/5.5 objects, isolated import and approved summary sentence.
2. `content/polsci/syllabus.js`: only5.4/5.5 rows and approved summary sentences.
3. `content/polsci/source-audit-jury.js`: isolated pure probability/model helper.
4. `tests/verification-polsci-jury.test.mjs`: five independent mathematical groups; drafted and passed outside the default suite before promotion.
5. `tests/verification-polsci-jury.mjs`: dedicated real-browser checks.
6. `docs/verification/polsci-jury-followup.md`: this report.

Exact outside-scope byte comparison against `/tmp/atlas-polsci-jury-{chapter,syllabus}-before.js` passed after removing only the allowed blocks/import and applying precisely the approved summary replacements. No neighbour/shared/runtime/Git/generated-data/master-plan/ledger/build changes were made. At author handoff both content flags remained true. All author browser/test/server processes exited. No human review or listening gate is introduced or claimed.


## Independent root acceptance

Root read both complete public items, the isolated helper, both dedicated test files, actual probability prerequisite bodies and complete author §23.7 (PDF22–24), including the actual PDF23 formula image. Independent counterreview read the same source passage and prerequisites; its separate exact BigInt polynomial oracle checked22,317 cases with maximum absolute difference1.2212453e−15 (`/tmp/atlas-jury-counter-rational.mjs` and `.log`). No reading of the original Condorcet or Ladha paper is implied.

Counterreview found an actual saved-state failure: the generic integer slider schema allowed even sizes despite its odd step. A partially restored even n then threw during rendering. The isolated exported odd-size validator is now also each jury-size control’s `onChange`; the existing runtime rejects that replay and remounts complete defaults with its saved-state notice. Shared runtime code is unchanged. Native regression tests supply even2 and each maximum-minus-one, then check the rejection notice, complete default controls/model, absence of runtime errors, and a subsequent valid snapshot/remount. The harness resets its capture arrays on every setup so a rejected partial mount cannot pollute the replacement mount’s observations.

The independent320px check also exposed equation overflow. Aligned/gathered displays now break the finite sum, variance bound, monotonicity identity, conditional mixture and limiting cases across readable lines. Root inspected complete final320px light5.4 and dark5.5 pages plus the critical n=1 panel; all formulas, controls and open/closed limit markers fit.

Final root checks after these repairs: **5 mathematical groups**, **12 full native groups** (both items ×1450/430/320 ×light/dark), **12 additional targeted malformed-state/layout groups**, and scoped static **2 items,0 errors,0 warnings**. Logs are `/tmp/atlas-root-polsci-jury-math-final.log`, `/tmp/atlas-root-polsci-jury-native-final.log`, `/tmp/atlas-root-polsci-jury-replay-layout.log` and `/tmp/atlas-root-polsci-jury-static-final.log`. Every full native group also exercises the new invalid replay regression. Root exact outside-scope byte comparison passes against HEAD after only the two objects/rows, isolated import and the explicitly recorded summary corrections (`/tmp/atlas-root-polsci-jury-guard.py`). This is targeted acceptance evidence; the prior1566-test accepted checkpoint predates this batch.
