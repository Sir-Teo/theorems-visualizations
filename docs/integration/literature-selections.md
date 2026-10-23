# Literature source-preparation integration

The [manifest](literature-selections.json) declares seven additions after `f76aae4d8f34638276932afbe3d0149e87d164a6`, zero replacements, and three roadmap files for manual reconciliation. The [dossier](../pilots/sequences/preparation/literature-selections-20261022.md) is research preparation, with no runtime/build/lesson/release change.

Export the exact predecessor into a disposable directory and refuse any existing addition path. Copy only the seven named files. Verify all six `existingBindings` hashes against the destination's actual bytes before using the new packet; a mismatch needs a fresh review rather than replacement of newer work. Preserve the older sequence briefs, source ledger and queue as their reviewed historical checkpoint.

With the three exact source snapshots available, run the offline selected-text verifier against the snapshot directory. It checks the downloaded-source hashes and all 16 normalized paragraphs; changed or missing snapshots require an explicit new source review, not a silently updated digest. The packet's excerpt text and locators remain distributable preparation evidence even when local temporary files are unavailable; do not claim a fresh source check without those inputs.

Run canonical coverage validation and confirm that every preexisting source file retains its bytes. Check the independent report's exact JSON/narrative bindings, source/selection references and local documentation links. Reconcile only the named roadmap documents by hand. No native-browser or production rebuild is required for these additions.

Later authoring must carry the selected witness identity into its own content/state/review contract and review the final rendered artifact. This packet creates no runtime ID, state migration, accepted count, extra draft slot or public distribution decision. See the [verification checkpoint](../verification/universal-literature-selections.md).
