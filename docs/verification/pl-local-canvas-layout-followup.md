# PL2.3 and2.11: local canvas layout closure

This separate runtime presentation boundary follows independently accepted prerequisite-only1b8d8400. Its full-source baseline is1ef163fefee0fb2dc816b7a25f57ca252b6c4dea, whose PL blobs remain exactly those of1b8d8400; unrelated GAME ancestry is not an integration requirement. Pick only this new local layout commit. No dependency, mathematical text, source flag or credit changes.

The concrete inherited defect was reproduced on built production routes at320px in both themes, all offered presets and real input. Stage.resize at assets/js/viz/core.js:184 scales requested height by at least0.72 on a narrow host. PL functions instead drew rows at fixed pixel y positions. PL2.3 content/pl/ch02.js:172 requested278px but got286×200: its capture-avoiding row at218 and note at246 were off canvas; the default note also extended to x545.4. PL2.11 content/pl/ch02-b.js:384–385 requested196/176 but got286×141/286×127. Its comparison summary at176 and final shift-down row at146 were off canvas; some second nameless-row glyph descenders also exceeded141. Fresh before images and glyph rectangles are preserved in native-final/evidence.json and before-*.png.

The bounded correction changes only two local viz functions and their imports of the already existing, unchanged wrapText helper. PL2.3 requests400px (narrow actual288), puts labels20px above their term rows, starts terms at16px instead of150px and wraps the existing bottom note. PL2.11 requests280/250px (narrow actual202/180), puts labels18px above the term rows, starts terms at14px instead of124px and wraps its existing comparison summary. Existing font/color choices, note wording and every semantic expression remain exact. This gives the term rows more horizontal room and enough vertical canvas to show every row. The full before/after literals are tests/pl-local-layout-manifest.json: nine local function presentation exceptions and two import additions. No shared renderer/helper changes.

The explicit guard reconstructs every PL source byte from the baseline with exactly those exceptions. All16files,46 complete objects/functions, private helpers, accepted flags, metadata,115 complete raw syllabus rows and46 full item/row dependency lists pass. Thus parsing, fresh-name choice, substitution, alpha-equivalence, nameless conversion, shifting/beta reduction, controls and readout functions are source-exact. All six existing PL mathematics tests pass; this layout change adds no mathematical claims and does not inflate the prerequisite inventory.

A fresh paired actual-production audit uses the before and after roots independently. It clicks all five2.3 presets and all four2.11 presets, types a capture witness and a named alpha-equal redex pair, and moves the real step slider through all four stages by keyboard. Across30 matched states in both themes, actual DOM readouts are exactly equal. Inherited glyph clipping is recorded in all30 before states; all painted glyph rectangles lie inside all after canvases in all30 states. Canvas text observation wraps only fillText/clearRect for recording, calls the original methods unchanged and does not alter model/runtime state. Real text inputs have a160ms debounce; the final test deliberately waits200ms after input. An initial probe omitted that settling delay and saw asynchronous before/after input states; it is excluded from final evidence.

The same fresh after run captures16 complete text fields: actual statement inner253px, proof288px, caption inner280px, and an extra controlled253px proof. Both items have no scope field. All bounds pass without TeX errors. All50 saved images—30 complete candidate visualization/readouts,16 full text fields and four before/default defect witnesses—were personally inspected via13 full-height sheets. Both computed result rows, the alpha comparison and all four shift/substitution rows are visible. The existing pseudocode panel remains horizontally scrollable; this audit makes no claim that every arbitrarily long user term fits without the renderer's existing minimum font constraint. Tested offered and typed states fit completely.

Evidence: /tmp/atlas-pl-layout/native-final/{evidence.json,*.png}, /tmp/atlas-pl-layout/sheets, guard.log, build.log, static.log and existing.log. Strict build:6684items,0errors/0warnings, home gzip112774bytes. PL static:46items,0errors/0warnings. All browsers and servers are closed. Independent peer acceptance of this runtime boundary is required separately from the already accepted prerequisite boundary.

Explicit reproduction, using an immutable baseline archive BASE, final candidate ROOT and unique OUTPUT:

```sh
node tests/verification-pl-local-layout.mjs BASE ROOT
node scripts/build.mjs --strict
node tests/verification-pl-local-layout-native.mjs BASE ROOT OUTPUT
node --test tests/verification-pl*.test.mjs
node scripts/check.mjs --collection pl --static
```

Both roots must have their own generated build outputs; a dependency symlink is sufficient for the archive. No global inventory, source closure, automatic dependency reduction or shared runtime is changed.
