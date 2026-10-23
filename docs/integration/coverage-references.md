# Classification-reference integration addition

Base: `4b0f455bb5e08217e250e539b0973867b9872464`. This standalone package implements the research adapter described in the [guide](../../coverage-references/README.md). Its [manifest](coverage-references.json) hashes six substantive additions and three manual roadmap reconciliations; this procedure and its manifest are separate packaging files.

Run from the repository root:

```sh
node scripts/coverage-references.mjs --check
node --test tests/coverage-references.test.mjs
```

The CLI reads the exact existing library-context research packet and checks the complete generated reference bundle. `--write` regenerates only that bundle for an intentional later revision; it does not grant review or alter canonical inputs. Review any such diff against its input evidence and source stops before acceptance.

The [verification](../verification/universal-coverage-references.md) records actual tests, source review and preservation. The seven tests include canonical input preimage checks. No earlier production source, research ledger, accepted artifact, release ledger or runtime is replaced. No additional full-site or browser result is claimed for this standalone data/helper change.

The complete candidate remains pinned to `e61efc42`; this later addition requires explicit inclusion and scoped checks at a future checkpoint. Never overlay onto a progressing Wave checkout. Subject-heading and catalog-record arrays are empty; importing real records or adopting canonical mappings needs its own evidence and review.
