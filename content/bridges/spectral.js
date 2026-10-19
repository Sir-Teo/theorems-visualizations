// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'spectral',
  title: 'The spectral theorem: finding the natural axes',
  blurb: String.raw`Every real symmetric matrix has an orthonormal basis of directions in which it simply stretches. That single fact explains the principal axes of a spinning body, the normal modes of a vibrating system, the harmonics of a string and the shape of data.`,
  steps: [
    { id: 'ladr-5.5', note: String.raw`An eigenvalue is a number $\lambda$ with $Tv = \lambda v$ for some nonzero $v$: a direction the operator only stretches.` },
    { id: 'ladr-7.12', note: String.raw`For a self-adjoint operator every eigenvalue is real, so the stretching factors are genuine lengths, not rotations.` },
    { id: 'ladr-7.29', note: String.raw`The real spectral theorem: a self-adjoint operator has an orthonormal basis of eigenvectors. In that basis its matrix is diagonal.` },
    { id: 'ladr-7.96', note: String.raw`Geometrically, a positive-definite operator maps the unit sphere to an ellipsoid whose principal axes are the eigenvectors.` },
    { id: 'ladr-7.70', note: String.raw`The singular value decomposition does the same for any operator: rotate, stretch along perpendicular axes, rotate again.` },
    { id: 'fa-12.23', note: String.raw`In infinite dimensions the eigenvectors may not exist, but a projection-valued measure takes their place: the spectral theorem for normal operators.` },
    { id: 'mech-10.8', note: String.raw`The inertia tensor of a rigid body is symmetric; its eigenvectors are the principal axes, about which the body can spin without wobbling.` },
    { id: 'mech-11.4', note: String.raw`Small oscillations of coupled masses decouple into normal modes, the solutions of a generalized eigenvalue problem; each mode swings at its own frequency.` },
    { id: 'music-2.3', note: String.raw`A string or a drum is a system with infinitely many normal modes: its standing waves are eigenfunctions of the wave operator.` },
  ],
};
