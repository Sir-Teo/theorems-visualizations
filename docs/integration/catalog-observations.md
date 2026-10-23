# Catalog-observation preparation addition

Base: `895ff198b19e317a3502d49e2584190ff20aada0`. [Research guide](../coverage/research/catalog-record-20261023/README.md). [Manifest](catalog-observations.json). Five substantive additions plus this procedure/manifest; three roadmap documents are manual reconciliations with exact preimages.

```sh
node --test tests/catalog-observations.test.mjs
node scripts/catalog-observations.mjs --source-dir /tmp/atlas-catalog-record-20261023
```

The first command uses disposable fixtures without network access. The second requires the named captured JSON bodies and refuses changed bytes. Raw captures are temporary local evidence, not bundled files; missing captures must not trigger automatic retrieval of stopped works or an unsupported claim of revalidation. The packet retains selected observations independently of those files.

No earlier adapter or source ledger is replaced. The canonical reference bundle remains empty of real subject headings/catalog records. These are observations with unresolved authority and holdings; importing them as controlled references would exceed the evidence. The [verification](../verification/universal-catalog-observations.md) records actual source/editorial review, five author tests and remaining gaps.

The complete integration candidate remains pinned to `e61efc42`; this later research/helper addition is outside that rehearsal. Reconcile roadmap pointers only at an authorized integration boundary; do not overlay an active Wave checkout. No lesson, acceptance, release or deployment is created.
