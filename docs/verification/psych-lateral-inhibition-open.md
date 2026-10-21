# Open follow-up: psychology 4.7 recurrent inhibition

This newly identified source/model review remains open. The adjacent source audit identified an algebraic sign error: on the stated all-active branch, `r=e−K(r−r⁰)` rearranges to `(I+K)r=e+Kr⁰`, whereas the current idea prints a minus sign on the right. The numerical widget actually uses its thresholded recurrence, so correcting that sentence alone would not establish a valid solver.

Root reproduced the exact current 200-step, half-damped update with the actual25-unit exponential couplings and offered controls. For the default edge location (c=12), inhibition0.5 and spread5, the returned vector has maximum fixed-point residual **0.6892214811** and minimum value **−0.3364283333**. At edge location c=1 the maximum residual is **1.0343783122**. Several settings exhaust all200iterations. These are not demonstrated steady solutions. The drawing additionally clamps responses below−0.2 while describing firing rates.

Reproduction: `/tmp/atlas-psych47-triage.mjs`, `/tmp/atlas-psych47-triage.log`, `/tmp/atlas-psych47-triage-worst.json`. This is a faithful standalone reproduction of the actual source algorithm and its stated fixed-point residual, not a new native browser acceptance or an audit of the cited1957 original. Remaining work includes actual source comparison, explicit rate/drive and threshold interpretation, a justified numerical domain/solver with convergence and residual evidence, complete state/input checks and visual inspection.

The root change adds an uncertainty flag and queue entry only. The separate4.6/4.8 source audit preserves this item. No source flag is cleared and no human review is required.
