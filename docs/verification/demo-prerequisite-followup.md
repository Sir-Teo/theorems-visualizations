# Demography: link the written least-squares prerequisite

`demo-4.8` explicitly fits `log(r(a)/n(a)) = log(M) + m v(a)` by ordinary
least squares. Its dependency pointed to the planned `stat-12.2`, while
the written `opt-1.6` states exactly the needed line-fitting normal equations.
The written and syllabus prerequisites now use `opt-1.6`.

This is a replacement of the same mathematical prerequisite with its
available written treatment, not an extra foundational link to inflate a
count. The source statement, caption and `fitCoaleTrussell` implementation
were compared with the target statement. Taking design rows `(1,v(a))`
and observations `log(r(a)/n(a))` gives the target's least-squares problem;
its normal equations yield the exact slope/intercept calculated by the
existing helper. Neither demography-4.1's definition of age-specific rates
nor another immediate prerequisite supplies this fitting method.

The record is appended to the macro/humanities prerequisite ledger with
this report. The earlier reciprocal peer reports remain evidence for their
original batches; this follow-up has source/target semantic review and
automated structural checks, and does not claim a new independent peer
review. The broad source-verification flag on the original 1974 paper is
unchanged.

Demography now has **25** distinct written-to-written cross-field
prerequisites. Eleven collections remain below the master-plan threshold.
Source population and the 5% human sample are unchanged. Strict build,
global static/cycle checks, ledger/syllabus reconciliation and the existing
demography regression suite validate the change; the human worksheet is
refreshed for the new graph/build.

The possible `arch-3.7 → opt-4.4` addition was also examined. Its immediate
prerequisite `arch-3.5` already provides the same linear-program setup.
Adding it would duplicate that explanation, so architecture's shortfall
remains recorded. No source flag or review credit is cleared by a dependency
count.
