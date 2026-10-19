# Logarithmic slider endpoints

2026-10-19. A pharmacology native audit found that End on a range configured to reach
5000 returned4900. Floating-point division of the logarithmic span placed the last browser
step outside the maximum, so the range stopped one tick early.

The runtime keeps its existing logarithmic DOM domain and400 intervals. A slightly shorter
step keeps the last tick inside the span; positions within half a tick of either endpoint
map to the exact configured minimum/maximum. Interior significant-digit rounding is clamped
to the configured bounds. Programmatic/default precision remains separate from the thumb.

`node --test tests/log-slider.test.mjs tests/share-state.test.mjs` passes five groups.
The new native group checks keyboard Home/End, pointer clicks at both ends, callbacks,
interior arrow movement and exact programmatic/shared values across six ranges. These include
the failing5000 endpoint,20000, a nondecimalπ endpoint, narrow bounds and30 decades.
The four native state/embed groups and all six UI groups also pass after the correction.

Source audits that encountered the old endpoint rerun their native checks against the true
configured endpoint before their source flags are resolved.
