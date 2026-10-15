// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'symmetry',
  title: 'Symmetry: from wallpaper to conservation laws',
  blurb: String.raw`A symmetry is a transformation that leaves something unchanged, and the symmetries of anything form a group. That single idea classifies wallpaper and crystals, counts necklaces, organizes musical scales, predicts which molecular vibrations absorb light, and lies behind every conservation law in physics.`,
  steps: [
    { id: 'art-9.1', note: String.raw`Every rigid motion of the plane is a translation, rotation, reflection or glide reflection.` },
    { id: 'art-9.3', note: String.raw`The motions that leave a pattern unchanged form its symmetry group: composing two symmetries gives another, and each can be undone.` },
    { id: 'art-9.6', note: String.raw`Patterns repeating in one direction come in exactly seven kinds: the frieze groups seen on every border and railing.` },
    { id: 'art-9.9', note: String.raw`Patterns repeating in two directions come in exactly seventeen, the wallpaper groups, all found in the Alhambra's tiles.` },
    { id: 'xtal-3.2', note: String.raw`In three dimensions, the regular arrangements of points are the fourteen Bravais lattices; atoms in crystals sit on them.` },
    { id: 'xtal-3.7', note: String.raw`Combining lattices with rotations and reflections gives the 230 space groups, the complete list of crystal symmetries.` },
    { id: 'comb-10.4', note: String.raw`Groups also count: the number of different necklaces is the average number of colourings each rotation leaves fixed (Burnside's lemma).` },
    { id: 'music-8.1', note: String.raw`Music has its symmetries too: pitch classes form the cyclic group $\mathbb Z/12$, with transposition as addition and inversion as negation.` },
    { id: 'rep-1.1', note: String.raw`A representation lets a group act by matrices, so linear algebra can be used to study symmetry.` },
    { id: 'rep-3.5', note: String.raw`Characters, the traces of those matrices, are orthogonal; a small table of numbers captures every representation of a finite group.` },
    { id: 'qchem-8.9', note: String.raw`For a molecule, decomposing its motion into irreducible representations of its point group counts the normal modes of each symmetry type.` },
    { id: 'qchem-8.10', note: String.raw`Only modes with the right symmetry can absorb infrared light or scatter Raman light: selection rules read straight off the character table.` },
    { id: 'mech-7.3', note: String.raw`In mechanics, Noether's theorem turns continuous symmetries into conservation laws.` },
    { id: 'mech-7.5', note: String.raw`Space looks the same in every direction, so angular momentum is conserved.` },
    { id: 'qm-7.6', note: String.raw`In quantum mechanics angular momentum generates rotations, and its allowed values are fixed by the representations of the rotation group.` },
    { id: 'rep-8.10', note: String.raw`The irreducible representations of $SO(3)$ are the spherical harmonics, which give the shapes of atomic orbitals: s, p, d and f.` },
  ],
};
