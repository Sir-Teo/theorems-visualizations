# Calibration: conditional probabilities and independent trials

`behav-3.13` defined calibration in words and compared the quiz's hit count
with Bin(n,0.9), but did not state the independence needed for that benchmark.
Marginal calibration is not enough. For example, if all ten hit indicators
equal the same Bernoulli(0.9) variable, every interval has 90% coverage but
the hit count is either zero or ten: P(at most six hits)=0.1, rather than
the independent-binomial value 0.0127951984.

The statement now makes the conditional nature of calibration explicit:
for outcome indicator Y and reported probability Q,
P(Y=1 given Q)=Q almost surely. The idea and quiz caption state the
independent, identical-coverage assumption for the binomial benchmark.
The chart and readout label that model; a small tail no longer declares
that the participant's intervals are too narrow. The fixed quiz's possible
correlation is explained. Historical study claims and numerical code are
unchanged. Tiny nonzero tails now display `< 0.001` rather than rounding to zero, and extra space keeps the revealed answer clear of the interval label.

Two exact written prerequisites replace the previous empty list:

- `stat-2.1`: conditional distributions, used in the calibration definition.
- `prob-2.1.1a`: independence of events/variables, needed to multiply the
  ten hit probabilities and derive the binomial comparison.

These have distinct mathematical roles. They are not generic background
links or runtime techniques. Both targets and the source were read in full;
the syllabus mirrors the written prerequisites. Behavioural economics now
has 25 written-to-written cross-field edges; ten collections remain below
the threshold. The ledger records this follow-up's own review scope and
does not attribute it to the baseline reciprocal peer reviewers.

Native light/dark checks exercise lock, next, previous, repeated locking
and reveal-all buttons. The displayed lower tail is compared with an
independent exact-integer binomial calculation; errors, real KaTeX and
source hashes are recorded in [the browser report](behav-calibration-browser.json).
Reproduce with `node tests/verification-behav-calibration-browser.mjs`. Both final screenshots were inspected. The correlated-trial counterexample above independently explains why the
old implication fails. Strict build, global static/cycle checks and
ledger reconciliation pass. Actual human review/listening credit remains
pending.

Final checks across the six sequential follow-ups: `npm test` passes;
the strict build and global static check have zero errors/warnings;
`check.mjs --changed=origin/main --quiet --jobs=2 --fail-on-warnings`
passes all 32 visualizations in the five changed chapter files. All 272
smoke routes pass: 111 completed in the initial run, then the remaining
161 in four disjoint groups using the driver's supported `--routes`
argument. Their union has no missing routes or errors, and the built
catalog hash is unchanged during the grouped checks. These are fresh
scoped/default checks, not a new whole-atlas light/dark/mode sweep.
