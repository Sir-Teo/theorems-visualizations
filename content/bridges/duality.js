// Bridge: one idea followed across collections and fields (MASTER_PLAN.md §8).
export default {
  slug: 'duality',
  title: 'Convexity and duality: a bound that meets the answer',
  blurb: String.raw`A plane that separates two convex sets can become a certificate that an optimization problem cannot do better. Follow that geometry into network cuts and competitive games, then exchange a curve for its supporting slopes to reach thermodynamic potentials.`,
  steps: [
    { id: 'fa-3.2', note: String.raw`Hahn–Banach extends a linear measurement while preserving a sublinear bound. The bound survives even when the space has many more directions than the original measurement.` },
    { id: 'fa-3.4', note: String.raw`Applied to convex sets, extension becomes separation: a continuous linear functional puts disjoint sets on opposite sides. A strict gap needs the additional compactness and closedness hypotheses stated here.` },
    { id: 'opt-2.7', note: String.raw`In finite dimensions the functional is a normal vector to a hyperplane. Convexity lets one linear inequality certify that an entire feasible region stays on one side.` },
    { id: 'opt-5.3', note: String.raw`For finite convex objectives and inequalities with affine equalities, strict feasibility gives the separating plane a positive objective component. After normalization, its normal is an attained dual multiplier: the best lower bound equals the finite primal value. Slater’s qualification matters, and primal attainment remains a separate question.` },
    { id: 'algo-11.19', note: String.raw`Linear programming turns such certificates into a second optimization problem. Every feasible dual solution bounds every primal solution; when a finite optimum exists, strong duality makes the best bound meet it.` },
    { id: 'algo-11.21', note: String.raw`For a flow network, the dual certificate is a cut: its capacity bounds every flow. At the optimum the cut capacity and flow value agree, and complementary slackness identifies saturated outgoing edges.` },
    { id: 'graph-6.2.3', note: String.raw`Integer network capacities add a discrete conclusion. Starting from zero, residual-path augmentations preserve integer edge values and reach an integral maximum flow with an equal-capacity cut certificate. Some other real maximum flows can still have fractional edge values; existence of an integer optimum is the claim.` },
    { id: 'game-3.4', note: String.raw`The two players in a finite zero-sum game solve a dual pair of linear programs. Equality of their optimal bounds is the minimax theorem: the best guarantee and the smallest enforceable ceiling coincide.` },
    { id: 'info-5.8', note: String.raw`Channel capacity also sits between a construction and a universal ceiling. An input law gives $I(p,W)$, while its output mixture gives the row-divergence upper bound $\max_xD(W_x\Vert q)$. Blahut–Arimoto alternates posterior and input updates to approach capacity; a finite displayed gap retains floating-point and iteration limits.` },
    { id: 'opt-3.7', note: String.raw`There is another way to trade a convex object for linear bounds. When the conjugate $f^*(y)=\sup_x(y^\top x-f(x))$ is finite, $y^\top x-f^*(y)$ is the greatest affine lower bound of slope $y$; its intercept is $-f^*(y)$.` },
    { id: 'thermo-3.7', note: String.raw`Thermodynamics makes that change of description physical: replacing entropy $S$ by its conjugate temperature gives $F(T)=\min_S[U(S)-TS]=-U^*(T)$. The sign convention matters: this free-energy transform is concave in $T$.` },
  ],
};
