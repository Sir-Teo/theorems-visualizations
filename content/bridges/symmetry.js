// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'symmetry',
  title: 'Symmetry: crystals, musical scales and conserved quantities',
  blurb: String.raw`Transformations that preserve an object form a group. Follow this structure from a triangle to crystal lattices and musical transposition, then let groups act by matrices and continuously on physical motion. Discrete classification and Noether’s conservation laws are related uses of symmetry with different hypotheses.`,
  steps: [
    { id: 'alg-3.13', note: String.raw`The rigid symmetries of an equilateral triangle close under composition and inversion. Rotating then reflecting can differ from reflecting then rotating, so this small group already reveals noncommutativity.` },
    { id: 'xtal-2.2', note: String.raw`Periodic repetition restricts rotational symmetry. A two- or three-dimensional crystal lattice permits only rotation orders 1, 2, 3, 4 and 6: symmetry must respect the translations as well as a single motif.` },
    { id: 'xtal-3.2', note: String.raw`A periodic crystal’s translation lattice belongs to one of fourteen Bravais types. A basis of atoms decorates the repeated lattice points; the lattice classification does not require every atom to be a lattice point.` },
    { id: 'xtal-3.7', note: String.raw`Translations can combine with rotations and reflections, including screw axes and glide planes. These operations give the 230 three-dimensional space-group types under the stated convention, which distinguishes enantiomorphic pairs.` },
    { id: 'music-8.1', note: String.raw`In twelve-tone equal temperament, octave equivalence makes pitch classes a cyclic clock $\mathbb Z/12$. Transposition adds a fixed number modulo twelve, preserving interval relationships.` },
    { id: 'rep-1.1', note: String.raw`A representation lets a group act by matrices, so linear algebra can be used to study symmetry.` },
    { id: 'rep-3.5', note: String.raw`For a finite group, irreducible characters are orthonormal under the group average. Taking inner products with them separates the multiplicities of independent symmetry types.` },
    { id: 'mech-7.3', note: String.raw`In mechanics, Noether's theorem turns continuous symmetries into conservation laws.` },
    { id: 'mech-7.5', note: String.raw`If a system’s Lagrangian is invariant under rotations about an axis, the angular-momentum component along that axis is conserved. Full rotational invariance conserves the whole vector; an external asymmetric potential can break it.` },
    { id: 'qm-7.6', note: String.raw`In quantum mechanics angular momentum is the generator of rotations: exponentiating $-i\theta\,\mathbf n\cdot\mathbf J/\hbar$ gives the rotation operator. Group action has become an operator acting on the state.` },
  ],
};
