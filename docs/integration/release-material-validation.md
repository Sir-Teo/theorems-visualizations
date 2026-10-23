# Edition and domain material validation delta

This package fixes the two inherited material-list comparisons identified in the [journey engineering review](../verification/universal-journey-reader-ai-code.md). A single comma-combined ID previously compared equal to two distinct required materials. The replacement compares serialized arrays, preserving identity, type and cardinality while allowing any material order. No source, content, renderer, browser asset or release ledger changes.

[The manifest](release-material-validation.json) pins complete predecessor `d11438852c631528b6f27d8107f025e9bf677b7e`, two source-file preimage hashes and five additions. The four roadmap documents are reconciled manually. Earlier manifests and review receipts remain historical; this explicit delta does not silently redefine their approved source versions.

```sh
node scripts/check-release-material-integration.mjs
```

The checker archives the predecessor, regenerates its ignored legacy data and validates it. Two negative regression groups must fail on that predecessor for the specific missing-rejection findings. It builds predecessor preview and empty-release outputs, applies only the two hash-checked replacements, runs the focused regressions and existing edition/domain/journey suites, then rebuilds both candidates. Every generated reader file must remain byte-identical; only the three build reports may change their delivery-binding fields. All other committed source files are hash-checked. No browser is needed for a validator-only change whose complete generated output retains exact bytes.

The tests use in-memory synthetic decisions for all four editions (including their supplements), each of 30 individual domains, all domains together and a two-domain release. They cover valid reordered decisions, adjacent merged material IDs, missing/repeated/unknown/non-string entries, invalid historical decisions and valid historical withdrawal. Test fixtures are not review evidence or real authorization.

The source edit necessarily changes edition, navigation and composed journey delivery digests. A real live decision bound to an old digest must be reviewed and explicitly reissued for the new delivery code; an old valid publication can still support withdrawal. Existing immutable edition/content reviews and source-orientation artifacts are untouched. Earlier delivery/engineering receipts do not approve the new code merely because rendered bytes match. Final independent engineering review remains open after the previously recorded reviewer-service rejection; that operation is not retried or redirected here.

All real release ledgers remain empty. This repair supplies neither distribution permission nor deployment authorization. The [checkpoint](../verification/universal-release-material-validation.md) records current validation, exact output parity, preservation and open work.
