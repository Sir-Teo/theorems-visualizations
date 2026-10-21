# Finite deadline successor — source and virtual models only

The original `2b15365a` is preserved with Arch's blocking finding: awaiting RAF could stall forever; its elapsed-metadata model did not prove a deadline. Source-only successor `3714fc1a` and its two reviewed cleanup gaps are also preserved. Final source `41b07a0b` closes the gaps without a browser, server, native RAF or timing run.

The browser races each RAF against a real timer, with a 30-second absolute measured-window deadline (initial drains also bounded; the timer resets once at t0). Timeout revokes and cancels only RAF callbacks registered during this tail, records canceled and any delivered late callbacks, and restores `_draw` and the RAF function. The stop hook awaits restoration before failure freezing, preventing a late finally from undoing the freeze. Normal callbacks and all original gates remain enabled.

Node bounds the timing evaluation wall time at 45 seconds; every timing failure receives at most 5 seconds of salvage and 5 seconds of browser close, then at most 2 seconds to verify exit after a signal. Before the correctness prefix, a bounded CDP request captures exactly one associated browser PID and its `/bin/ps -p PID -o lstart=` birth identity. Cleanup may signal only that verified PID while the birth identity still matches. Missing/CDP ownership instead permits only bounded browser-object close. HTTP cleanup runs independently after browser cleanup errors and records failures. Host filesystem persistence and OS scheduling are not hard realtime guarantees.

All prior source/collector/camera/24-interval/p95/resource/raw/direct semantics remain. The runner reconstructs through 21 explicit literals; current manifest SHA256 `ecc71914802334aad97ae202e446c69be3529638e24310545eace93c57a35e60`. No timing acceptance follows from models.

Focused models pass stalled initial and third RAFs, external abort, canceled-but-delivered callbacks (recorded with no resumed draw), partial state and wrapper restoration, unresolved outer evaluation and salvage, scoped PID kill, recycled/missing PID safety, failed CDP and ordinary browser-error cleanup. All test timers are injected virtual failure triggers, not performance measurements. The first new test parse failed on a duplicate local variable; that attempt is disclosed in the committed evidence and corrected in the test only. The complete original source/virtual/adversarial/blocked-PREPARE suite also passes on final source.

Commands (unique empty outputs):

```sh
node tests/map-curve-timing-deadline-model.mjs IMMUTABLE_ROOT UNIQUE_OUTPUT
node tests/map-curve-timing-proposal.mjs IMMUTABLE_ROOT OTHER_UNIQUE_OUTPUT
```

Full focused raw outcome and hashes of retained earlier/final outcomes are in `map-curve-timing-deadline-evidence.json`. Independent exact review is required before any native run.
