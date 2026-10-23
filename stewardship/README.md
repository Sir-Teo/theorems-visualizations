# Source correction and freshness queue

This is the first working U5 stewardship queue: four unresolved source issues affecting follow-up preparation. It is deliberately scoped to those records, not a complete inventory of atlas defects, source stops or review needs. [issues.json](issues.json) pins the existing evidence and names the affected editorial target, required responsibility, next action and circumstances requiring a new edition or review. No person has been appointed: every assignee is `null`.

| Issue | Affected preparation | What remains unresolved |
| --- | --- | --- |
| S001 | P02-L03 narrative | The earlier Tagore witness's provenance/anomaly; selecting a different witness does not correct it |
| S002 | P05-L03 farming systems | The MSSRF account's two village names and situated context |
| S003 | P03-L03 langar | Current-source refresh after recorded access denials |
| S004 | P01-L03 material evidence | Assessment of newer research whose paper was not inspected |

Run the read-only audit with an explicit date:

```sh
node scripts/stewardship.mjs --as-of 2026-10-23
node --test tests/stewardship.test.mjs
```

The JSON report gives each recorded state, local evidence integrity, unassigned responsibility, next action, edition trigger and retained access stops. It checks the exact local file bytes and literal section locator. Missing or changed evidence causes a nonzero exit and `needs-reconciliation`; it does not overwrite the issue state. Matching bytes establish only that the recorded local evidence is unchanged. Days since the latest action are **not** days since an external source was verified, and do not certify freshness. No deadline or recurring retrieval is inferred.

The CLI validates affected IDs against the existing sixteen-brief queue and compares history against the ledger at Git `HEAD` when one exists. It refuses removal or rewriting of earlier events, target reassignment, removal of recorded access stops, and metadata changes without another event. This check protects the current edit against the committed checkpoint; it is not a signed audit log or an authenticated multi-user service. Review the diff before committing, since a committed change becomes the next comparison baseline.

## Record a real change

Keep issue IDs stable. Add a consecutive dated event with a concrete note, rather than rewriting the original history. Dates must be real calendar dates, ordered and no later than the ledger's `asOf`. Update `asOf` deliberately. A changed source or preparation record needs an explicit new evidence binding and event; do not merely replace a hash to make a failing report green.

An issue starts `waiting-evidence`. New exact local evidence can advance it to `ready-for-review`. Closure then requires exact evidence and an explicit reviewer identity, role, rationale and outcome: `corrected`, `retained-qualified` or `excluded`. A closed issue can reopen to `waiting-evidence` while preserving its prior decision. Review readiness can return to waiting when the evidence is inadequate. These fields record a decision; validation does not verify credentials, independence, consent or substantive correctness. Do not populate them with invented decisions or treat passing validation as acceptance.

An access stop stays visible even after an issue closes. The queue never authorizes a retry or alternate-copy recovery. If circumstances or explicit instructions change, append the new evidence and applicable scope without erasing the previous stop. No network operation is implemented here.

A closure does not modify a source, accepted lesson, retained edition, release ledger or distribution decision. Apply an actual correction through the relevant versioned preparation/content workflow and review the resulting artifact. The edition-trigger text identifies what must be reconsidered; it is not an automatic release instruction. Claims about historical sources, physical observations and professional decisions retain their existing limits.

This additive local package follows the [complete candidate checkpoint](../docs/integration/master-plan-candidate.md); that pinned rehearsal does not include these later files. The [execution ledger](../docs/master-plan-execution.md) remains the whole roadmap. U5 also still requires release stewardship, specialist depth, language/regional editions, federation and practical partnerships.
