# Quicksort: exact counts and rounded splits

`algo-3.10` called the sorted-input comparison count exactly n²/2,
although its recurrence and actual Lomuto runs give n(n−1)/2. The caption
now separates the exact count from the dashed leading-term reference.
The cost model explicitly counts m−1 partition comparisons, excluding
pivot-selection costs, with zero cost for empty/singleton subarrays.

The balanced-split hypothesis now allows the integer floor used by the
widget, and claims logarithmic depth with constants depending on a fixed
positive split fraction. Its proof uses
`childSize−1 <= (1−alpha)(parentSize−1)` rather than silently treating a
rounded child as an exact fraction. The binary pivot tree supplies the
previously implicit lower bound: the sum of key depths is at least
n log₂ n−O(n). A fixed proportional condition is sufficient, not necessary.

The displayed tree includes singleton rows: at alpha=1/2 it has
floor(log₂ n)+1 rows; alpha=0 gives n rows. The readout now labels the
unrounded logarithm as an ideal shrink scale. At alpha=.01,n=64, every
split rounds to zero, so depth63 is consistent despite the eventual
logarithmic bound for fixed positive alpha. The entropy leading term
belongs to the fixed proportional recurrence, not every tree satisfying
only a balance inequality. Numerical recurrence, pivot code, plotted
values and fit calculation are unchanged.

A native driver checks six (alpha,n) states in both themes: (0,8),
(0,128), (.01,64), (.3,64), (.5,8), (.5,128). An independently traversed
pivot tree agrees with all displayed depths and comparison sums; endpoint
counts include28 and8128, and median-split depths are3 and7. All12
captures were inspected, with legible trees, level costs, exact/leading
curves and readouts. Runtime and TeX checks pass. Artifacts:
`/tmp/agent-review/quicksort-browser.{mjs,json}` and the named PNGs.
Static/strict-build checks and current review hashes also pass.

The same review batch finishes semantic text findings for all339 sampled
pages. This is not339 completed full-page reviews: visual inspections,
focused controls, original-source checks and recorded corrections remain
separate measures. Human review and subjective listening counts are not
increased.
