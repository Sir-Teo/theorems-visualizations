# Finite-class learning: what the probability covers

`ml-4.6` correctly union-bounded over a finite hypothesis class at a fixed
sample size, but its caption claimed an entire sampled curve stayed under
the bound with probability at least 1−delta. Its scope also called the
probabilistic result a guarantee for every run. Those statements were
stronger than the derivation.

The page now fixes a nonempty class independently of the training sample
and identifies the orange curve as a fixed-size bound, uniform over
hypotheses. Covering J predetermined grid sizes and all six runs with
failure probability delta needs another union bound, using delta/(6J)
in each pointwise bound. This does not need independence across grid
sizes. That larger simultaneous bound is described separately from the
unchanged orange curve. Six simulated runs do not estimate a delta
quantile. Conditional on the population and chosen class, sampling is
with replacement from the fixed 3000-point population.

The marker and readout used different sample sizes: the red classifier
uses exactly m observations, while summary gaps/bounds use the first
plotted grid size at least m. The label falsely said nearest grid size;
for marker 100 it uses117, though the lower grid point is closer. The
readout now gives both sizes explicitly. The implemented upper median
of six runs is labelled as such. The caption identifies 400 displayed
population points and Bernoulli label-flipping probability rather than
claiming an exact flipped fraction.

Only explanatory text, legend/readout labels and theorem qualifications
change. Population generation, hypothesis classes, samples, gaps, marker,
quantile calculation and plotted bounds are unchanged. No prerequisite
quota credit is added: the extra step uses the existing union-bound link.

## Validation

- Native static/light/dark checks pass without runtime, TeX, blank-stage
  or quality warnings.
- Eight controlled native captures (all inspected) cover default values,
  k/delta/m endpoints and resampling in both themes. Independently computed
  fixed-size bounds agree with the readouts: default k=30, delta=.1 at grid 117
  gives .165; k=1, delta=.02, m=10 gives .480; k=3000, delta=.5, m=1000 gives .069.
  The red-classifier text retains the actual marker 100 at the default.
  Resampling changes empirical results and preserves the bound.
- Artifacts: `/tmp/agent-review/ml-bound-browser.{mjs,json}` and PNGs.
  Strict build, generated review packets and all 339 current review text
  hashes are checked. No statistical simulation is used to prove the
  probability theorem.

The same batch records 22 additional visual inspections from sample
positions 133–156, without double-counting the already reviewed linguistics
and Euclid pages. Three defective initial PNGs were replaced by inspected
isolated recaptures and disclosed in `agent-capture-anomalies.md`.
