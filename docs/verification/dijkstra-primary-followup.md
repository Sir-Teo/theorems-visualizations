# Dijkstra's original mutual-exclusion protocol

The [scanned original note in a reprint](https://harrymoreno.com/assets/greatPapersInCompSci/5.2_-_Solution_to_a_problem_in_concurrent_process_control-Edsger_W._Dijkstra.pdf)
was read in full: PDF pages 2–4, reprint pages 348–350, including all code
and the proof. The original publication is CACM 8(9), p. 569 (1965),
[DOI 10.1145/365559.365617](https://doi.org/10.1145/365559.365617).
Downloaded PDF SHA256:
`20fe21f6900b002faaa22e42dd2329e45ea8321b27743f2e991e6b19c291d247`.
This is the actual note, distinct from the related EWD123 algorithm.

The source specifies indivisible word accesses, Boolean arrays initially
true, an arbitrary initial owner, and requirements concerning symmetry,
relative speeds, stopped remainder sections and collective progress.
Its Li0–Li4 program and proof support the page's corrected explanation.
Continued execution is required for progress; individual bounded waiting
is not among its guarantees. Historical background absent from this note
is replaced with its actual proof argument.

The code comparison found a substantive discrepancy: the simulator made
the Li3 conditional read and write atomic. It now reads the owner into a
local snapshot, reads that owner's flag, and writes the new owner in three
separate scheduler steps. Labels follow the original Li numbering; array
indices remain zero-based. Resetting a dead local snapshot after its last
use merges equivalent simulator states without changing shared behavior.

An adversarial regression pauses a contender after it reads a true flag,
lets another process enter, and then completes the delayed assignment.
This interleaving was impossible in the old model. The subsequent scan
still prevents simultaneous entry. Exhaustive checks now cover all 548
reachable states for two processes and 52,674 for three processes, for
each possible initial owner, without hitting the 200,000-state cap.
No mutual-exclusion violation, frozen state or blocked lone contender is
found. Naive protocols produce their expected counterexamples.

These finite checks do not prove freedom from livelock or starvation.
The page now distinguishes those properties, exposes a capped search,
and reserves its general progress explanation for the source's proof.
The `dist-4.13` source flag is closed; references are mirrored in the
syllabus. This is an automated/source review, with no human-review credit.

Validation: strict build; targeted regression and static validation;
native browser modes in both themes. Source queue, evidence census and
current-build human worksheet are regenerated. No full-atlas browser
refresh is claimed.
