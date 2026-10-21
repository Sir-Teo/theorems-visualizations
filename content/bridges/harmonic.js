// Bridge: one idea followed across collections and fields (MASTER_PLAN.md §8).
export default {
  slug: 'harmonic',
  title: 'Harmonic functions: one equation for fields and flows',
  blurb: String.raw`Where there are no local sources, a potential often satisfies Laplace’s equation. Its value is an average of its neighbors, its boundary values can determine its interior, and in two dimensions complex maps carry solutions from a simple shape to a useful one.`,
  steps: [
    { id: 'rca-11.3', note: String.raw`A harmonic function satisfies $\Delta u=0$. This local cancellation of second derivatives is the common mathematical object behind the physical examples that follow.` },
    { id: 'rca-11.12', note: String.raw`The mean value property turns the equation into a picture: at the center of every admissible circle, the value equals the average around the circumference.` },
    { id: 'rca-11.8', note: String.raw`On a disc, the Poisson integral builds the harmonic interior from continuous boundary data. Moving the evaluation point changes the weights assigned to different parts of the boundary.` },
    { id: 'em-2.8', note: String.raw`In an electrostatic region with no charge, the electric potential satisfies exactly this equation. Charges outside the region and conductor boundaries supply the data that shape the field inside.` },
    { id: 'em-3.5', note: String.raw`The electrostatic uniqueness theorem makes a construction trustworthy: for a fixed charge density and specified boundary potential, two candidate solutions cannot disagree in the interior.` },
    { id: 'em-3.18', note: String.raw`In two dimensions a conformal map can carry an electrostatic boundary problem to a simpler domain. The mapped potential stays harmonic wherever the map is analytic with nonzero derivative.` },
    { id: 'fluid-4.2', note: String.raw`Where an incompressible, irrotational flow has a velocity potential, it satisfies $\Delta\phi=0$. A no-through-flow wall now supplies a condition on the normal derivative rather than prescribing the potential itself.` },
    { id: 'fluid-4.4', note: String.raw`The complex potential packages velocity potential and stream function together. Their level curves are equipotentials and streamlines, orthogonal wherever the velocity is nonzero.` },
    { id: 'fluid-4.15', note: String.raw`Conformal maps carry these potential flows between domains, with velocity transformed by the derivative. Circulation survives the mapping, while corners and vanishing derivatives need separate limiting analysis.` },
    { id: 'aero-2.5', note: String.raw`For an airfoil too awkward to map by hand, a panel method combines elementary potential flows and solves for strengths that enforce the wall condition and Kutta condition. The result models attached, incompressible ideal flow; it does not compute a viscous boundary layer or stall.` },
  ],
};
