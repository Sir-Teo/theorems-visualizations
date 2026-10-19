# Rational facets and finite staircases: agent sample finding

`xtal-1.4` asserted that large-index faces never occur, that any plane
through three lattice points has rational intercept ratios, and that an
irrational plane contains at most one lattice point. The geometric argument
needs three noncollinear points. A plane such as X + √2 Y = 0 contains
the entire Z-axis lattice line while lacking a two-dimensional lattice net.
Low-index facets are common, but lattice geometry alone does not prohibit
high-index faces or determine facet energies and growth rates.

The statement now describes the classical empirical law and separates
it from the lattice-plane result. In fractional coordinates, two independent
integer displacement triples have a nonzero integer cross product; its
components give the integer coefficients in hX + kY + lZ = d. This is a
coordinate-equation argument, not an assertion that those integer components
are a physical Euclidean normal in an oblique cell. Zero indices and
infinite intercepts are explicit. The cross-product prerequisite `vcalc-1.3`
was read and mirrored in the syllabus and energy prerequisite ledger.

The finite picture had two further counterexamples:

- Its default slope 0.62 is rational (31/50), but the search restricted
  to denominators at most 12 called it an irrational face.
- The 2/3 preset produces alternating one- and two-column terraces, even
  though the old readout said rational slopes have identical terrace widths.

The readout now reports only the computed small-denominator approximation
and the observed finite-window terrace widths. Rational p/q implies a
staircase translation by q columns and p rows, not equal individual treads.
The error plot labels its numerical floor rather than certifying exactness.
Known irrational presets are explicitly floating-point approximations.

Testing the presets also exposed a coordinate clamp: at c/a = 1.6, setting
2/3 clipped the handle's height and actually selected slope 0.65. The view
already expands with the stack, so removing that clamp preserves the
requested fractional slope at both aspect-ratio endpoints.

Validation: strict build; existing crystallography regressions; independent
brick-centre counts and rational-translation checks; and preset, aspect-ratio
and native handle-drag tests in both themes. The corrected dark 2/3 view
at c/a = 1.6 was inspected: it reports slope 0.6667, approximation 2/3,
both terrace widths, and a labelled error floor. This is geometric and
model review, with no new original-source acquisition or human credit.
The integrated cross-field additions become 774; nine shortfalls remain.
