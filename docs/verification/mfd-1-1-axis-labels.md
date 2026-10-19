# MFD 1.1 chart-axis labels

Fixed a visual defect found during the conditional-control capture review: the selected chart pair, circle arcs and readout changed, but the transition plot retained its previous axis labels. For example, restoring top → right after top → left still showed `y (chart left)`.

Chart labels are now set initially and in the two selection callbacks, before the stage paints its axes. The change is local to `content/mfd/ch01.js`; chart domains, transition formulas, ticks/ranges, readouts, runtime and checker are unchanged. No source flag changed.

Focused serial native validation passes in both themes, covering all four graph-chart pairs, each restoration to top → right, and restoration of the original angle charts: 18 states. The test checks the actual text painted on the canvas, not merely the stage's updated configuration, and checks the readout's chart context. Blank/runtime/TeX checks also pass with actual pinned KaTeX. Individual screenshots of top → left, its restoration, right → top and empty top → bottom were inspected in both themes; labels now match the selected controls and mathematical context.

Validation: `node tests/verification-mfd-1-1-label-browser.mjs`, and one-item static validation with zero errors/warnings. Exact content hash and all 18 PNG SHA256s are in [the machine report](mfd-1-1-axis-labels.json). Native output is `/tmp/mfd-1-1-label-browser.json`; screenshots are in `/tmp/mfd-1-1-label-shots/`. The original supplemental screenshots remain evidence of the reported defect until the root reviewer refreshes those rows. Content edits are frozen; read-only visual review continues.
