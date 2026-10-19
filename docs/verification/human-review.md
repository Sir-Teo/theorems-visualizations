# Human visual and listening review

Run `npm run review:prepare`, then `npm run serve` and open
[the local review workspace](http://localhost:8173/tools/human-review.html).

The visual queue contains **113 items**, a 5% sample of the **2,260-item Wave 3–4
verification inventory**, including repairs to earlier chapters. The seeded
pseudorandom draw is reproducible, has no replacements, and guarantees one item
from every field before filling the remaining places. It is a field-stratified
review sample, not a claim that all 6,684 atlas items received human review.

The listening queue contains **149 atlas examples with sound calls**, including
earlier chapters. This deliberately broadens the original automated 51-item
Wave 3–4 listening inventory. The script detects calls to the runtime's `sound`
and `soundButton` APIs; it does not establish that every possible sound action
or parameter combination was listened to.

Enter the reviewer name, test the controls, inspect both visual themes, and
listen through the relevant sound controls. Record the settings needed to
reproduce each issue. A source flag can remain pending while a visual or audio
review is recorded; those checks establish different things.

Records stay in the browser's local storage. Export them before switching
browsers or clearing website data; import combines valid current records by
review time. Each record binds to the item's source file, recursively imported
helpers, rendering runtime, styles and harness. Regenerate the manifest after
content changes: older records whose source fingerprints changed need another
review and do not count as passes. The draw itself remains stable while the
inventory and seed stay unchanged.

Validate an exported file with `npm run review:check -- /path/to/atlas-human-reviews.json`.
The command returns a nonzero exit status while a source fingerprint is stale,
any record is invalid, a review is still pending, or an issue remains unresolved.
Running it without an export reports the empty, still-open human gate.

No review is pre-approved. Automated tests of this workspace use an isolated
browser context and never save their fixture reviews to the repository. Human
completion requires actual reviewer observations, all required attestations,
and no outstanding issues; completing this queue does not resolve source flags
or independently satisfy the other wave gates in MASTER_PLAN §7.3.
