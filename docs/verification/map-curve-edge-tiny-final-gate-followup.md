# Tiny edge gate: final completion check

This separate successor preserves the original `83add753c6db71a142f7c58dd772390f5b809f58` source and preparation evidence. It adds exactly one controller line after the final awaited page closure and before `save(true)`: collected errors must be empty and every observed request must belong to the closed served source set. No wait, retry, suppression, recipe, renderer or native program changed.

An exact source comparison proves that removing the added line reconstructs the entire prior controller. An extracted actual final-gate model passes the quiet case and blocks completion for a late error, an unknown request and both. The four raw outcomes were saved before assertions in `/tmp/atlas-curve-edge-tiny/prepare-final-close/closing-gate.json`. These are controller models, not native evidence.

The focused guarded preparation was rerun against the unchanged exact f8 source archive. All 32 recipes, 11 closed sources and four refusal/preparation checks pass with zero browser/server/network attempts. New prepared controller hashes are recorded in `/tmp/atlas-curve-edge-tiny/prepare-final-close/prepared/prepared.json`; the earlier prepared manifest remains intact and will correctly refuse the changed controller. The future root run must use this new preparation. No browser/native execution occurred, and all jobs are closed.

Command: `node tests/verification-map-curve-edge-tiny-prepare.mjs /tmp/atlas-curve-prototype/run-2/proposal-source /tmp/atlas-curve-edge-tiny/prepare-final-close`.

The first model attempt used a separate VM realm with the host strict assertion object, so even its quiet empty array failed prototype identity comparison. Its raw outcomes remain in `closing-gate-cross-realm-failure.json`. The corrected model executes the extracted gate in the same realm, matching the actual controller; all four outcomes above pass. No controller assertion was weakened.
