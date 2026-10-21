// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'symmetry',
  title: 'Symmetry: crystals, musical scales and conserved quantities',
  blurb: String.raw`Transformations that preserve an object form a group. Follow this structure from a triangle to crystal lattices and musical transposition, then let groups act by matrices and continuously on physical motion. Discrete classification and Noether’s conservation laws are related uses of symmetry with different hypotheses.`,
  steps: [
    { id: 'alg-3.13', note: String.raw`The rigid symmetries of an equilateral triangle close under composition and inversion. Rotating then reflecting can differ from reflecting then rotating, so this small group already reveals noncommutativity.` },
    { id: 'nt-5.15', note: String.raw`Multiplication by the four Gaussian units rotates the square integer lattice by quarter turns and preserves its norm. Nearest-lattice-point division gives a smaller integer norm remainder, so the same geometry supplies Euclid’s algorithm and unique factorization in this particular ring.` },
    { id: 'nt-5.17', note: String.raw`The Eisenstein lattice instead has six unit rotations and norm a²−ab+b². Its own Euclidean division and the ramified prime above 3 support the cubic Fermat descent. These ring facts must be established for the triangular lattice; Gaussian unique factorization alone does not supply them.` },
    { id: 'xtal-2.2', note: String.raw`Periodic repetition restricts rotational symmetry. A two- or three-dimensional crystal lattice permits only rotation orders 1, 2, 3, 4 and 6: symmetry must respect the translations as well as a single motif.` },
    { id: 'xtal-3.2', note: String.raw`A periodic crystal’s translation lattice belongs to one of fourteen Bravais types. A basis of atoms decorates the repeated lattice points; the lattice classification does not require every atom to be a lattice point.` },
    { id: 'xtal-3.7', note: String.raw`Translations can combine with rotations and reflections, including screw axes and glide planes. These operations give the 230 three-dimensional space-group types under the stated convention, which distinguishes enantiomorphic pairs.` },
    { id: 'music-8.1', note: String.raw`In twelve-tone equal temperament, octave equivalence makes pitch classes a cyclic clock $\mathbb Z/12$. Transposition adds a fixed number modulo twelve, preserving interval relationships.` },
    { id: 'cplx-5.13', note: String.raw`XOR translations act on the finite bit cube as a group. If an acceptance set is dense enough, a bounded family of translates covers every tape; a sufficiently small set cannot. This converts an amplified BPP decision into existential–universal quantifiers, without giving an efficient search for the translates.` },
    { id: 'rep-1.1', note: String.raw`A representation lets a group act by matrices, so linear algebra can be used to study symmetry.` },
    { id: 'rep-3.5', note: String.raw`For a finite group, irreducible characters are orthonormal under the group average. Taking inner products with them separates the multiplicities of independent symmetry types.` },
    { id: 'mfd-5.4', note: String.raw`A tangent vector at the identity of a Lie group generates a one-parameter subgroup through the exponential map. These continuous families describe transformations used in mechanics; a conservation law additionally requires the action invariance in Noether's theorem.` },
    { id: 'mech-7.3', note: String.raw`In mechanics, Noether's theorem turns continuous symmetries into conservation laws.` },
    { id: 'mech-7.5', note: String.raw`If a system’s Lagrangian is invariant under rotations about an axis, the angular-momentum component along that axis is conserved. Full rotational invariance conserves the whole vector; an external asymmetric potential can break it.` },
    { id: 'qm-7.6', note: String.raw`In quantum mechanics angular momentum is the generator of rotations: exponentiating $-i\theta\,\mathbf n\cdot\mathbf J/\hbar$ gives the rotation operator. Group action has become an operator acting on the state.` },
  ],
};
