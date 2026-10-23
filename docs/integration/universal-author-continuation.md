# Local continuation and introductory curriculum integration

This delta follows `04666f72` in the isolated universal-pilots integration worktree. It removes independent-review prerequisites for local work, implements all eight three-lesson sequences, retains earlier editions and notes, accepts the three concrete journeys locally, and adds thirty scoped introductory routes. It preserves the separate Wave 5/6 worktrees.

The [manifest](universal-author-continuation.json) records exact additions and replacements with predecessor hashes. Earlier source registers, sequence briefs, preparation dossiers, reviewer receipts and frozen editions remain historical. A new runtime inventory supports the added methods without invalidating old schema-1 archives. Changed first-pilot revisions have separate paths; no implicit notebook migration occurs.

Current delivery: 24 lesson identities, 28 retained editions, 30 orientations, three journeys and 30 introductory routes with 90 associations to 65 distinct accepted targets. Introductory routes reuse existing lessons; they do not add 90 to the authored count or claim comprehensive field coverage. The 7,751-idea accepted legacy snapshot remains fixed.

Reproduce local work with Node 22:

```sh
node scripts/check-author-continuation.mjs
node scripts/check-local-continuation.mjs
node scripts/freeze-exploration-editions.mjs --check
node scripts/check-journey-plans.mjs
node scripts/master-plan-status.mjs --as-of 2026-10-23
node scripts/build-introductory-curriculum.mjs --out /tmp/atlas-new-local-candidate
```

The snapshot checker compares every listed file with its exact predecessor and delivered hash. It is read-only and intentionally detects later changes; regenerate a new integration snapshot when continuing development.

Choose a new output directory each time. The final builder preserves predecessor output bytes except five explicit generated entry-page navigation additions. It does not publish, rewrite another checkout, fetch sources, alter private notebooks or change release ledgers. The [verification record](../verification/universal-author-delivery.md) describes the actual source/model/native checks and composed candidates.

A later accepted Wave base requires an explicit reconciliation. Apply only the recorded source delta after checking every preimage; never overlay this checkout onto a progressing Wave checkout. Changed lesson content or runtime requires a new revision and retained edition. Frozen receipts and bundles must not be edited in place.

The current author workflow replaces local reviewer waits. Public distribution, exact reuse terms and actual observations retain their real scope. The four unresolved source issues and the curriculum’s language/place/practice gaps remain part of the delivery, not reasons to invent an approval.
