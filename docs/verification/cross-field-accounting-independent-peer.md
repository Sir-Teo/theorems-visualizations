# Independent acceptance-accounting peer — 2026-10-20

**Accepted:** immutable **5ae9794d03b55f10fed54b2741d89fe84150f618** for its accounting/error/nonmutation and CLI behavior. I sparsely archived only the changed script, its fixture test/documentation and its import-only library dependency. **No BIGHIST collection source/content or real central JSON ledger was loaded, modified or reviewed.** This review accepts a bookkeeping safeguard, not any candidate argument or excluded prerequisite.

The unfiltered `crossFieldInventory` calculation is unchanged. The new accepted wrapper copies the item objects and filters copied dependency lists using explicit edge keys; it validates source existence, actual source dependency, target existence and duplicate exclusions before computing a report. It preserves acceptance metadata by an independent structured clone. No candidate proof text is interpreted as acceptance, and the recorded exclusion remains effective regardless of explanatory metadata.

The default CLI reads the prior ledger, uses its acceptance record and writes the resulting accepted report. Invalid exclusion metadata or invalid/missing prior JSON fails before a write. The `--raw` branch prints the unfiltered report and neither reads nor writes the ledger, so it works even when that file is missing or malformed. This preserves the intentional diagnostic/accepted distinction. No source dependency or flag is changed.

Independent explicit `tests/verification-cross-field-accounting-peer.mjs` passes:

- Deep-frozen atlas/acceptance inputs with duplicate deps, same-field links, written/planned endpoints and an unknown dependency. Raw and accepted counts/unknowns are checked exactly, source objects/flags remain unchanged, and mutating result metadata leaves the original nested acceptance record untouched.
- Missing source, unknown target, stale non-edge and duplicate exclusions all throw.
- An exact copy of the immutable script executes against a tiny fixture-only `lib.mjs` adapter and temporary ledger. Raw stdout parses to the exact unfiltered report and preserves ledger bytes and modification time. Default output retains the exact nested metadata, filters only the recorded edges and is byte-idempotent when repeated.
- Default CLI rejects stale/unknown/duplicate exclusions, malformed JSON and a missing ledger before changing bytes/creating the file. Raw output still works without rewriting each invalid/malformed ledger and with no ledger present. Fixture atlas/script bytes remain unchanged.

All **3 candidate fixture groups also pass** independently. Evidence: `/tmp/atlas-accounting-peer/{archive,candidate-tests.log,peer.log,fixture}`. CLI calls use the documented relative-script invocation from the isolated fixture directory: on macOS `/tmp` aliases `/private/tmp`, while the inherited main-module guard compares path strings. An initial absolute `/tmp` fixture invocation therefore did not enter the CLI; using the canonical relative invocation tests the intended branch without changing the candidate. This inherited path-alias behavior is outside the new accounting logic and is not a regression introduced here.

No global inventory, source flag, ledger or collection content is edited by this report/test-only peer commit. No biological/historical/source claim is accepted.
