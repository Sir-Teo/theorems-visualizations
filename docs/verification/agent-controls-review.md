# Sample controls and Euclidean boundary case

An instrumented native-browser pass exercised all 336 sampled pages with
visualizations. It tested visible default-mode range endpoints, checkbox
reversal, the first visible two-dimensional handle drag, and the first
ordinary non-audio button where present. It found no runtime exceptions,
TeX failures or NaN readouts. It does not cover text editing, every button,
or controls conditional on other modes, and does not grant semantic,
visual, human or listening credit.

The compact [baseline record](agent-controls-baseline.json) retains every
tested page, its actions, source-file hash, and flagged states. This is a
historical pass before the subsequent type-candidate and Euclid wording
corrections. The hash covers the named content file; the runtime hash
covers `assets/js/viz/core.js`, not every transitive asset. Separate mode
checks and focused regressions supply other evidence.

Only `nt-1.3` triggered the blank-canvas heuristic. Direct native inspection
confirmed two legitimate boundary states:

- At step zero no division has occurred, so the division table is empty.
- With one side equal to 1, the 462-by-1 rectangle is less than a pixel high
  at this scale. Its division table visibly gives 462 = 462·1 + 0 and gcd 1;
  the gcd-grid resolution warning is visible.

The algorithm is correct. Its statement, however, called the answer the
last nonzero remainder without handling an exact first division. It now
identifies the final divisor and defines r₀ = b, so that case is included.
The caption also declares the empty initial table, finite drawing
resolution and eight-step floating-point prefix for irrational presets.
No source flag is closed by this mathematical/implementation review.
