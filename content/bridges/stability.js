// Bridge: one idea followed across collections and fields (MASTER_PLAN.md §8).
export default {
  slug: 'stability',
  title: 'Stability: what happens to a small disturbance?',
  blurb: String.raw`A population, a feedback controller, a learning algorithm and a temperature field all face the same question: does a small error fade or grow? Eigenvalues reveal local growth rates; energy-like quantities can certify behavior without solving every trajectory.`,
  steps: [
    { id: 'ode-1.8', note: String.raw`Near a scalar equilibrium, a perturbation follows $\dot\eta\approx f'(x^*)\eta$. A negative derivative restores the state, a positive one repels it, and a zero derivative leaves the nonlinear terms to decide.` },
    { id: 'ctrl-3.3', note: String.raw`For a linear system, each eigenvalue supplies a growth rate. All real parts must be negative for asymptotic stability; on the imaginary axis the Jordan blocks also matter.` },
    { id: 'ctrl-3.5', note: String.raw`A Lyapunov function replaces many trajectories with one scalar picture. If its positive level sets surround the equilibrium and its value never increases along the flow, trajectories cannot escape outward through them.` },
    { id: 'ctrl-3.7', note: String.raw`For a stable linear system the energy certificate can be computed: solve $A^\top P+PA=-Q$ with $Q\succ0$. Then $V=x^\top Px$ decreases at rate $-x^\top Qx$.` },
    { id: 'mathbio-3.7', note: String.raw`The neutral cycles of the Lotka–Volterra model expose a fragile boundary case. Arbitrarily small changes to crowding or predator saturation can turn its center into inward or outward spirals; neutral motion is not robust attraction.` },
    { id: 'ctrl-3.12', note: String.raw`A feedback gain can move a conjugate pair of eigenvalues across the imaginary axis. Under the Hopf hypotheses, nonlinear terms then determine whether a small stable oscillation appears or an unstable cycle disappears.` },
    { id: 'deep-4.2', note: String.raw`Gradient descent has a discrete version of the same test. On a positive-definite quadratic each mode is multiplied by $1-\eta\lambda_i$; convergence requires every multiplier to have magnitude below one, or $0<\eta<2/\lambda_{\max}$.` },
    { id: 'pde-3.2', note: String.raw`For heat flow the difference of two solutions has a nonincreasing squared-energy integral. The maximum principle also bounds that difference by the discrepancy in the data: here stability means continuous dependence of a whole field on its inputs.` },
  ],
};
