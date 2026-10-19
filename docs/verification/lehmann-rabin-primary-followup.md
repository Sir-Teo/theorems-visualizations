# Lehmann–Rabin protocol and source comparison

The [complete 1981 POPL extended abstract](https://www.lix.polytechnique.fr/~catuscia/teaching/papers_and_books/ft_gateway.cfm.pdf),
pp. 133–138, was read, including both algorithms, scheduling definitions,
Theorems 1–5, the progress sketch and references. PDF SHA256:
`64243aa0d189c607a66b8a5d69a78f03de332f853258a53720b79723cfaa3bf3`.
Rendered pp. 135–137 were additionally inspected for the atomic operations,
program lines, proper-schedule definition and distinction between the free
and courteous protocols. This complete original replaces the earlier failed
HUJI acquisition; metadata or a secondary abstract is not the evidence.

The paper's Theorem 1 assumes symmetric initial conditions as well as
identical deterministic programs. That missing hypothesis is now explicit
in `dist-4.6`. Theorem 2 concerns collective progress for the free protocol;
Theorems 3–4 explicitly allow individual starvation. The courteous protocol
in §7 is a separate construction. The corrected page distinguishes these.

The extended abstract supplies a progress sketch while omitting supporting
lemma proofs; it does not supply a uniform bound in scheduler steps.
`dist-4.7` identifies that limit, uses the original proper/non-anticipating
scheduling model, and does not portray finite sampling as a proof for all
adversaries. The original attribution, formulation and available argument
are now compared; no recovery of omitted proofs is claimed.

The simulator comparison exposed several coarse transitions. A coin draw
was combined with a release, an unsuccessful second-fork test released the
first immediately, and a completed meal released both forks atomically.
The new states separate those operations and allow a neighbour to acquire
the first released fork before the second release. Thinking and meal
duration are local single steps; completed meals release left-first, one
of the source's allowed orders. A batched round serializes acquisitions
before releases and resolves conflicting requests by seat index; the caption
now describes that convention. Failed second-fork acquisition retries
release the first fork even when another request wins within the batch.
The step budget uses complete rounds without exceeding the selected limit.
The deterministic one-at-a-time option now allocates seven consecutive
steps per seat, enough for a complete uncontended meal. Its former single
step per seat preserved the same symmetry as lockstep, contrary to its
caption; regression and native assertions now require actual meals.

Regression evidence checks 48,000 individual transitions across 2, 3, 5 and
8 philosophers and all three rules: at most one fork changes, ownership is
local, and eating neighbours never overlap. A controlled partial-release
interleaving and a failed-test/delayed-release interleaving exercise the
new states. The starvation counterexample now uses 20 seeded draw streams,
covers both first-fork choices and schedules every process indefinitely;
the hungry process gets genuine tests only while its chosen fork is held.
This is an independent model counterexample, not a proof of the paper's
general progress theorem.

Both references and picture descriptions are mirrored in the syllabus,
including removal of the false suggestion that no individual starves.
`dist-4.6` and `dist-4.7` are closed for this corrected presentation.

Validation: computing regressions; strict build; static and native mode
checks in both themes; actual program/schedule/toggle/seed controls and
slider endpoints. Source queue, census and current-build human worksheet
regenerated. Human review and subjective listening receive no credit.

This sequential source follow-up also passed the full regression command,
strict build, global static validation (6,688 visualizations), all 49
visualizations in nine changed chapter files, and all 272 distinct smoke
routes with no errors. The last scheduler refinement additionally passed
all 26 computing regressions, the four native item/theme groups and focused
chapter/item smoke routes on the refreshed build. Earlier whole-atlas
mode/fingerprint reports remain historical; none were relabelled current.
