// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'action',
  title: 'Least action: nature’s shortest paths',
  blurb: String.raw`Light follows stationary travel time, a falling bead the fastest slide, a planet stationary action, and a free timelike particle a geodesic that locally maximizes proper time before conjugate points. One principle runs from optics through mechanics and symmetry to relativity and quantum theory.`,
  steps: [
    { id: 'mech-5.2', note: String.raw`Fermat: a physical light ray makes travel time stationary; a local minimum is an important case. Snell's law of refraction follows from asking where to cross the boundary.` },
    { id: 'mech-5.7', note: String.raw`Johann Bernoulli's challenge, the curve of fastest descent, is a cycloid, and his solution borrowed Fermat's optics.` },
    { id: 'mech-5.4', note: String.raw`Euler and Lagrange turned such problems into a method: a path that makes an integral stationary must satisfy a differential equation.` },
    { id: 'mech-6.5', note: String.raw`Hamilton's principle: the motion of a conservative mechanical system with Lagrangian $T-V$ makes the action $\int (T - V)\,dt$ stationary. Newton's laws become one variational statement.` },
    { id: 'mech-7.3', note: String.raw`Noether's theorem: every continuous symmetry of the action gives a conserved quantity. Time symmetry gives energy, space symmetry momentum, rotation angular momentum.` },
    { id: 'mech-12.6', note: String.raw`Maupertuis and Jacobi: at fixed energy, orbits are geodesics of a modified metric. Dynamics becomes geometry.` },
    { id: 'dg-9.7', note: String.raw`On a smooth curved surface, a shortest smooth path is a geodesic. Geodesics locally minimize length for sufficiently short segments; a long geodesic need not be a global shortest path.` },
    { id: 'rel-7.7', note: String.raw`In general relativity a freely falling body follows a timelike geodesic, a path that makes proper time stationary and locally maximizes it on a sufficiently short segment.` },
    { id: 'rel-8.6', note: String.raw`Even the gravitational field obeys an action principle: varying the Einstein–Hilbert action gives Einstein's field equations.` },
    { id: 'waves-5.2', note: String.raw`Why least time? Waves along nearby paths interfere; only near a stationary path do the phases agree and add up. Fermat's principle is stationary phase.` },
    { id: 'qm-6.4', note: String.raw`Feynman expresses quantum amplitudes as a sum over paths weighted by $e^{iS/\hbar}$. In the semiclassical stationary-phase approximation, classical stationary-action paths give the leading contributions.` },
  ],
};
