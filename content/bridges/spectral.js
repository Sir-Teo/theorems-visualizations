// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'spectral',
  title: 'The spectral theorem: finding the natural axes',
  blurb: String.raw`A self-adjoint operator on a finite-dimensional inner-product space has perpendicular eigenvector directions. That fact explains principal axes and normal modes; singular values extend the geometric picture to other linear maps, while an infinite-dimensional spectral measure replaces an eigenvector basis when one is unavailable.`,
  steps: [
    { id: 'ladr-5.5', note: String.raw`An eigenvalue is a number $\lambda$ with $Tv = \lambda v$ for some nonzero $v$: a direction the operator only stretches.` },
    { id: 'ladr-7.12', note: String.raw`For a self-adjoint operator every eigenvalue is real. An eigenvector is scaled without an oblique rotation, although a negative eigenvalue reverses its direction.` },
    { id: 'ladr-7.29', note: String.raw`The real spectral theorem: a self-adjoint operator has an orthonormal basis of eigenvectors. In that basis its matrix is diagonal.` },
    { id: 'ladr-7.96', note: String.raw`An ellipsoid makes perpendicular axes and their scales visible: its defining quadratic inequality measures each coordinate in units of the corresponding semi-axis. In diagonal coordinates, a coupled-looking shape becomes a sum of separate squares.` },
    { id: 'ladr-7.70', note: String.raw`The singular value decomposition gives any linear map perpendicular input and output directions with nonnegative stretch factors. These two bases can differ, extending the picture beyond a self-adjoint map’s single eigenvector basis.` },
    { id: 'fa-12.23', note: String.raw`In infinite dimensions the eigenvectors may not exist, but a projection-valued measure takes their place: the spectral theorem for normal operators.` },
    { id: 'mech-10.8', note: String.raw`The inertia tensor of a rigid body is symmetric; its eigenvectors are the principal axes, about which the body can spin without wobbling.` },
    { id: 'mech-11.4', note: String.raw`Near a strict potential minimum, coupled masses decouple into oscillatory normal modes of $Ka=\omega^2Ma$. The modes are orthogonal in the mass inner product, and each oscillates at its own frequency.` },
    { id: 'music-2.3', note: String.raw`A fixed-end string has standing-wave modes whose endpoints remain nodes. Only whole numbers of half-wavelengths fit, giving an infinite family of shapes that each oscillate at one frequency.` },
  ],
};
