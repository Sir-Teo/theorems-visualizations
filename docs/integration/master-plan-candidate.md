# Complete master-plan candidate checkpoint

This is the entry point for assembling the committed universal-atlas work through `e61efc420e24427b44dc2e9cd02d958a1e702194`. It brings the seventeen historical packages into one exact inventory: **602 added files, two production-file replacements and one manual master-plan reconciliation** relative to accepted base `facab15e297c645d4826935f2c011a4cf367ee88`. The [manifest](master-plan-candidate.json) records each changed file's source hash and, where applicable, accepted-base preimage. Earlier package manifests and review receipts remain intact.

The feature/research snapshot contains 6,154 files. This later inventory/checker/test/report wrapper is deliberately separate from that immutable source commit; running the checker never silently substitutes current working-tree files. Later work requires a new explicit checkpoint and updated inventory, not an automatic claim of compatibility. The accepted base was verified as the selected historical integration baseline; a newer Wave commit must be accepted by its owning workflow before replacing it here.

## Reproduce the whole candidate

Use Node 22 or a compatible supported runtime, Git and `tar`:

```sh
node --test tests/master-plan-candidate.test.mjs
node scripts/check-master-plan-candidate.mjs
```

The checker creates disposable exports of both exact commits, verifies ancestry and regular-file modes, and compares the complete delta against the manifest. Missing, extra, stale or duplicate inventory entries fail. Accepted-base deletions fail. Only `assets/js/app.js` and `scripts/build.mjs` may be production replacements; `MASTER_PLAN.md` remains an explicit manual reconciliation. All other accepted-base files must retain their bytes.

It then verifies coverage, pilot/overview reproducibility and the pinned dashboard; regenerates ignored legacy data with the strict build; runs the legacy static check and fifteen composed offline test files; and assembles the complete reader in both modes. No package installation, browser, network retrieval, Git index update or other-checkout overlay is performed. Temporary outputs and detailed logs remain at the report path printed on success.

The preview is expected to retain all 7,751 accepted legacy ideas, four locally accepted exploration editions, thirty domain orientations and three proposed journeys. It excludes P07/P08 drafts from delivered exploration editions. The separate release-mode candidate uses the real empty decision ledgers and must deliver zero new-format exploration editions, domains or journeys. This is an absence-of-authorization check, not a publication. The legacy reading layer is still built in that candidate.

The checker audits quoted HTML `href`/`src` targets in both complete outputs, including same-origin canonical-prefix resolution. It does not claim fragment, CSS/JavaScript-import or external-URL freshness coverage. All 6,154 committed source files are checked again after the builds. The [verification checkpoint](../verification/universal-master-plan-candidate.md) records actual results, exact tool/inventory identities and remaining limits.

## Use at an integration boundary

Inspect the pinned output, complete changed-file inventory and scoped review receipts. Compare the intended destination with the accepted base before applying any file; never overlay this export onto a progressing Wave checkout. Reconcile the root master plan with that destination's actual status. The historical manifests explain why changes exist, while this flat inventory identifies the final bytes that compose this checkpoint, including later validator repairs.

A newer destination or changed source needs a reviewed reconciliation and a new rehearsal. The command verifies a known candidate; it does not perform that merge, select a newer accepted Wave base, change source claims, accept an exploration or grant missing distribution decisions. Build-stage reports describe intermediate stages; the final journey build and final HTML-target audit describe the composed output.

This is author integration evidence. The previously rejected independent engineering review remains open and was not retried or rerouted. Professional, physical, performer, human, language/community and publication decisions retain their recorded scope. The [execution ledger](../master-plan-execution.md) remains the whole-roadmap queue; mechanical assembly does not complete U2–U5 or imply that all human knowledge is covered.
