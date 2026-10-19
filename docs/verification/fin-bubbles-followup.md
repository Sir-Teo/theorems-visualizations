# Rational bubbles, conditional tails and a finite dividend asset

**Resolved: fin-5.11.** The source flag and central ledger are reconciled.
The root's five independent mathematical groups, eight native groups and scoped
static check pass. A separate agent independently checked the source/model and screenshots
and passed its own five mathematical and eight native groups. No full repository checkpoint is claimed for this batch.

## Sources actually read

Read the author-hosted Blanchard–Watson chapter, *Bubbles, Rational Expectations,
and Financial Markets*, printed pp295–300: introduction; complete “Rationality,
Arbitrage, and Bubbles”; and “Bubbles and Transversality Conditions” through its
finite-terminal, negative-bubble and participant discussion. Original formulas
on pp296,297 and300 were inspected as page images. This is the
[author-hosted chapter PDF](https://www.princeton.edu/~mwatson/papers/Blanchard_Watson_Bubbles.pdf),
not a claim to have acquired the NBER PDF. The [NBER record](https://www.nber.org/papers/w0945)
identifies the related July1982 working paper and DOI10.3386/w0945. NBER's PDF
endpoint returned403 in this run. The earlier Blanchard1979 and Tirole originals
are not claimed read, and their broad historical credit was removed from this item.
The later real-effects and empirical-detection sections are not claimed audited.

Local PDF `/tmp/atlas-fin-blanchard-watson1982.pdf`:21 scanned pages,
SHA256 `9a7dacc9b1994516e6c5cdcc267463e559e7a023d4e75a418836a6b48a11da9b`.
Its text layer was empty; all21pages were rendered/OCRed for navigation, with the
actually used sections compared to page images. OCR text is
`/tmp/atlas-fin-blanchard-watson1982-ocr.txt`; original-page renders
`/private/tmp/atlas-fin-bw1982-ocr/page-{01,02,03,04,05,06}.png` correspond to
printed295–300. Generating OCR does not establish that every page was read.

The source uses a current direct-return convention. Our exposition explicitly
uses ex-dividend prices and the next dividend, with consistent shifted indices.
Its additional integrable discounted-dividend condition is a sufficient authored
hypothesis for the limiting argument, not a verbatim source hypothesis. The
read source separates solutions of the arbitrage/pricing equation from the
additional requirements of a complete equilibrium economy; the page now does too.

## Corrections and argument

The old “finite horizon” plot retained a constant perpetuity value5/r atT and
continued paying dividends. It now represents an actual finite asset: payments5
at dates1,…,T, ex-dividend terminal price0, and
`f_t=(5/r)(1-(1+r)^(-(T-t)))`. The valid finite price and its discounted expected
resale both reach zero atT. The rejected candidate is compared in discounted
units in the right panel; its terminal discrepancy is exactlyB0. Keeping that
comparison in the right panel avoids compressing the valid declining price
against a huge hypothetical undiscounted bubble. Time views follow the actual
finite horizon, rather than drawing a five-period example into fifty periods.

The statement now specifies increasing information, adapted integrable prices,
r>0, nonnegative dividends and an integrable discounted dividend sum. Repeated
conditioning uses the actual written tower property, **prob-4.1.13**, whose full
statement/proof was read. Its prerequisite supplies conditional linearity and
monotone convergence. Chapter and syllabus add this genuine input, replace the
Gordon-growth prerequisite with the actual annuity/perpetuity definition
fin-1.9, and move the historical bubble context fin-5.10 to a related link.

At each date, the forward identity's discounted resale expectation tends toBt:
the fundamental's remaining discounted expected dividend tail tends to zero,
while the discounted conditional expected homogeneous bubble remainsBt. Thus
transversality at every date selects the fundamental solution. Requiring
nonnegative prices then also implies nonnegativeBt. The claim is about this
specified equation and summability class. It does not infer equilibrium
existence merely from an expected-return calculation.

A bursting bubble crashes almost surely for fixed survival probability below1,
yet its discounted expected tail remainsB0 because rare surviving values grow.
The second panel explicitly plots conditional expected resale, rather than
mistaking a realized crashed history for that expectation. The syllabus's false
claim that positive crash probability rules out bubbles is corrected. B0=0 now
correctly reports the fundamental solution and a passing transversality condition.

The old readout put a check mark beside a finite20,000-draw mean as if it were an
exact identity. The new readout separately computes the exact branch-weighted
asset gross return and the finite sample mean/known standard error. Deterministic
and zero-bubble cases do not pretend to need Monte Carlo. Random histories and
the independent one-step sample both change with the actual history button.
All dividends, rates, starting bubbles and paths are explicitly authored examples.

## Root validation

- `node --test tests/verification-fin-bubbles.test.mjs`:**5 groups pass**.
  All33 offered rates and46 terminal dates agree with a direct discounted cash-flow
  sum and separate backward recursion. Branch equations cover all rates and
  representative complete control corners. An independent enumeration of every
  eight-step Bernoulli history recovers expected prices. Rare-survival probabilities
  approach zero while their discounted expectation remains positive. A finite
  conditional dividend tree checks the forward identity at every node/horizon.
  Monte Carlo counts, mean and theoretical variance are checked separately.
- `node tests/verification-fin-bubbles.mjs`:**8 groups pass**, model and native
  interaction at1450/430px in light/dark. Every cell tests all48 regime/control
  corners, finite terminal values, zero initial bubbles, exact conditional curves,
  actual drawn path arrays, full marker/ring bounds, canvas-text/TeX/page overflow,
  keyboard endpoints, control visibility and the history button's changed draws.
- `node scripts/check.mjs fin-5.11 --static`:**1 item,0 errors,0 warnings**.
- Root inspected final finite/narrow/dark, certain/narrow/light and
  bursting/wide/light/dark screenshots. The finite declining price, rejected
  discounted candidate, complete zero terminal markers, conditional-tail limit,
  captions, controls and distinct exact/sample readouts remain legible.

Root logs `/tmp/atlas-root-fin-bubbles-{math,native,static}.log`. Representative
screens `/tmp/atlas-fin-bubbles-{finite-asset,certain-bubble,bursting-bubble,new-history}-{1450,430}-{light,dark}.png`.
Only object5.11, its source-header/import, helper/tests/report and matching
syllabus row are changed by this batch. Neighboring objects are preserved.

## Separate independent review

A separate reviewer read the authored original pricing and transversality sections
through the latter section's ending on printed301 and inspected original
pp296/297/299/300 formula images. The reviewer independently verified the
conditional dividend-tail proof, signed/nonnegative-price distinction, finite
terminal backward induction, zero-bubble case and exact-versus-sampled returns;
its own five mathematical and eight native groups pass. Regenerated finite
boundary/narrow/dark, new-history/narrow/light and certain/wide/dark screenshots
were inspected. No blocking findings or production changes were requested. The reviewer's own
math command and native session97114 exited0; their output is retained in the
reviewer task transcript rather than separate local log files.

The root also compared objects5.12–5.15 byte-for-byte with the preceding commit;
all are unchanged. This closes one original flag,196→195,641 original resolved.
