// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'action',
  title: 'Stationary action: comparing neighboring paths',
  blurb: String.raw`A local optimum has no first-order change. Apply that idea to a whole path and it links refraction, the fastest slide, Newtonian mechanics, geodesics and quantum amplitudes. The physical path makes an action stationary; it need not minimize it.`,
  steps: [
    { id: 'opt-1.4', note: String.raw`At an interior local minimum of a differentiable function, every directional derivative vanishes. This necessary condition identifies stationary points, which can also be maxima or saddles.` },
    { id: 'mech-5.2', note: String.raw`Fermat applies stationarity to the travel time of light. Varying where a ray crosses a flat interface gives Snell’s law; a minimum is the familiar simple case, rather than the general rule.` },
    { id: 'mech-5.7', note: String.raw`Johann Bernoulli's challenge, the curve of fastest descent, is a cycloid, and his solution borrowed Fermat's optics.` },
    { id: 'mech-5.4', note: String.raw`Euler and Lagrange turned such problems into a method: a path that makes an integral stationary must satisfy a differential equation.` },
    { id: 'mech-6.5', note: String.raw`For a holonomic system with forces derived from a potential, Hamilton’s principle makes the action $\int (T-V)\,dt$ stationary among paths with fixed endpoints. The equations of motion become one variational statement; dissipative forces need additional treatment.` },
    { id: 'mech-7.3', note: String.raw`Noether's theorem: every continuous symmetry of the action gives a conserved quantity. Time symmetry gives energy, space symmetry momentum, rotation angular momentum.` },
    { id: 'mech-12.6', note: String.raw`Maupertuis and Jacobi exchange the timing for a fixed energy: the orbit is a geodesic of an energy-dependent metric where $U<E$. The principle determines the path, and that stationary path can be a saddle.` },
    { id: 'qm-6.4', note: String.raw`The path-integral formulation assigns amplitudes with phase $e^{iS/\hbar}$ to time-sliced paths. Nearby stationary actions organize constructive interference in the semiclassical approximation; the real-time integral is oscillatory, not an ordinary probability average over trajectories.` },
  ],
};
