# Type candidates: agent sample finding

The default `pl-4.8` term has type `(Nat → Nat) → Nat → Nat`.
The candidate panel tested only five ground or first-order types, none
matching that result, but displayed “exactly one candidate passes” and a
hard-coded count of one. The corrected panel includes the inferred type
first, removes duplicates, and counts actual matches. Ill-typed terms
produce zero matches. If chips exceed the available panel space, the
panel reports the omitted count.

The erased-annotation view also claimed infinitely many types for every
accepted term. A numeral such as `3` has the ground principal type `Nat`,
so it has only one type. Infinite type instances require a variable in
the principal result type. The caption and panel now distinguish these
cases; the finite enumeration is still labelled as sampled instances.

Validation: a native browser regression checks the drawn candidate chip
for the higher-order default, rejection of a mismatched term, infinitely
many instances for identity, and the single ground type of an edited
numeral. Both themes pass, including parse updates, TeX and runtime
checks. The four higher-order/ground captures were visually inspected.
This is agent review, not original-source acquisition or human review.
