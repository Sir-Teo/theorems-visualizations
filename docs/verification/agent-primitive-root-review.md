# Primitive-root lifting: agent sample finding

The classification in `nt-3.3` is correct, but its explanation attributed
primitive-root lifting to Hensel's lemma without choosing an appropriate
representative. A primitive root modulo p can fail to be primitive modulo
p². For example 8 is primitive modulo 3, but has order 2 modulo 9.
Hensel lifting a root of X² − 1 can retain order 2 rather than produce
the required order 6.

The proof now chooses h from g and g+p so that h^(p−1) is not 1 modulo
p². Their binomial expansions differ by a nonzero multiple of p modulo
p², so at least one works. Repeated exponent lifting then gives exact
order (p−1)p^(k−1) modulo p^k. The CRT obstruction and the repeated-
squaring argument for powers of two remain explicit. The misleading
Hensel prerequisite is removed; the actually used CRT item is mirrored
in the syllabus. This does not change cross-field counts or source flags.

Validation: direct modular arithmetic checks the 8 modulo 9 counterexample,
the adjusted representative 11 modulo 9, 27 and 81, and both lift choices
for all primitive residues of odd primes through 97, through the fourth
prime power. Existing numerical classification is unchanged; strict build
and focused native rendering verify the revised proof text.
