// Small, explicit canonical models for the fifteen cross-field bridges.
// These are dimensionless examples, not fitted application data.
export const actionModel = a => ({ action: .5 + Math.PI ** 2 * a * a / 4, derivative: Math.PI ** 2 * a / 2, path: t => t + a * Math.sin(Math.PI * t) });
export const dualityModel = (k, y, x) => ({ f: .5 * k * x * x, conjugate: y * y / (2 * k), touching: y / k, gap: .5 * k * (x - y / k) ** 2, freeEnergy: -y * y / (2 * k) });
export function causalModel(q, delta) {
  const untreated = [.15, .75], treated = untreated.map(p => p - delta);
  const mean0 = untreated[0] * q + untreated[1] * (1 - q), mean1 = treated[0] * (1 - q) + treated[1] * q;
  return { untreated, treated, mean0, mean1, crude: mean1 - mean0, adjusted: -delta, standardized0: .45, standardized1: .45 - delta };
}
export function contagionModel(mu) {
  const pgf = s => Math.exp(mu * (s - 1)); let extinction = 1;
  if (mu > 1) { let lo = 0, hi = 1 - Math.log(mu) / mu; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (pgf(m) > m) lo = m; else hi = m; } extinction = (lo + hi) / 2; }
  return { pgf, extinction, giant: 1 - extinction };
}
export function diffusionModel(D, t) {
  const variance = .25 + 2 * D * t;
  return { variance, density: x => Math.exp(-x * x / (2 * variance)) / Math.sqrt(2 * Math.PI * variance) };
}
const xlog = x => x === 0 ? 0 : x * Math.log(x);
export function entropyModel(p, q) {
  const entropy = -xlog(p) - xlog(1 - p), crossEntropy = -p * Math.log(q) - (1 - p) * Math.log(1 - q);
  return { entropy, bits: entropy / Math.LN2, crossEntropy, kl: crossEntropy - entropy };
}
export function feedbackModel(K) {
  const sensitivity = 1 / (1 + K), rate = 1 + K;
  return { sensitivity, tau: 1 / rate, reference: t => K * sensitivity * -Math.expm1(-rate * t), disturbance: t => sensitivity * -Math.expm1(-rate * t), perturbation: t => Math.exp(-rate * t) };
}
export function fixedPointModel(r, n, x0 = .9) {
  const fixed = .5, map = x => r * x + (1 - r) / 2, iterate = k => fixed + r ** k * (x0 - fixed);
  return { fixed, map, iterate, value: iterate(n), error: r ** n * Math.abs(x0 - fixed) };
}
export function fourierModel(a, N) {
  const harmonics = [[1, 1], [3, a], [5, .25]], value = (x, truncate = false) => harmonics.reduce((s, [k, amp]) => s + (!truncate || k <= N ? amp * Math.sin(k * x) : 0), 0);
  return { harmonics, value, energy: harmonics.reduce((s, [, amp]) => s + amp * amp / 2, 0), error: harmonics.reduce((s, [k, amp]) => s + (k > N ? amp * amp / 2 : 0), 0) };
}
export function harmonicModel(a) {
  return { value: (x, y) => x + a * (x * x - y * y), gradient: (x, y) => [1 + 2 * a * x, -2 * a * y] };
}
export function inverseModel(epsilon, noise, lambda) {
  const truth = [.8, .5], measured = [.8, epsilon * .5 + noise], sigmas = [1, epsilon];
  const inverse = measured.map((y, i) => y / sigmas[i]), ridge = measured.map((y, i) => sigmas[i] * y / (sigmas[i] ** 2 + lambda ** 2));
  return { truth, measured, inverse, ridge, sigmas, factors: sigmas.map(s => s * s / (s * s + lambda * lambda)) };
}
export function distortionModel(latitude, projection) {
  const c = Math.cos(latitude * Math.PI / 180), a = 1 / c, b = projection === 'mercator' ? a : projection === 'equal-area' ? c : 1;
  return { a, b, area: a * b, ratio: Math.max(a, b) / Math.min(a, b), angle: 2 * Math.asin(Math.abs(a - b) / (a + b)) };
}
export function spectralModel(theta, ratio) {
  const c = Math.cos(theta), s = Math.sin(theta), matrix = [[c * c + ratio * s * s, (1 - ratio) * c * s], [(1 - ratio) * c * s, s * s + ratio * c * c]];
  return { matrix, eigenvalues: [1, ratio], axes: [[c, s], [-s, c]], ellipse: t => [c * Math.cos(t) - s * Math.sin(t) / Math.sqrt(ratio), s * Math.cos(t) + c * Math.sin(t) / Math.sqrt(ratio)] };
}
export function stabilityModel(a, h) {
  const multiplier = 1 - a * h;
  return { multiplier, stable: Math.abs(multiplier) < 1, exact: n => Math.exp(-a * h * n), discrete: n => multiplier ** n };
}
export function symmetryModel(n, j, k) {
  const residue = x => ((x % n) + n) % n, angle = x => 2 * Math.PI * residue(x) / n;
  const rotation = x => [[Math.cos(angle(x)), -Math.sin(angle(x))], [Math.sin(angle(x)), Math.cos(angle(x))]];
  return { j: residue(j), k: residue(k), composition: residue(j + k), rotation };
}

export const BRIDGE_PICTURES = {
  action: { title: 'A neighboring path and its action', anchors: ['opt-1.4', 'mech-5.4', 'mech-5.2'], contexts: ['Free particle', 'Path-space optimum', 'Euler–Lagrange stationarity'], model: 'Fixed endpoints q(0)=0, q(1)=1; qₐ(t)=t+a sin(πt). The dimensionless kinetic action is J=½+π²a²/4.', limit: 'This positive quadratic example has a minimum; general stationary action need not. Fermat’s optical travel time, curved-space geodesics and quantum amplitudes use other functionals or constructions, not numerical copies of this J.' },
  causality: { title: 'The same risks, different comparison weights', anchors: ['demo-1.8', 'causal-1.9', 'causal-4.3'], contexts: ['Observed comparison', 'Standardized treatment effect'], model: 'Two equally common strata have untreated risks 0.15 and 0.75; treatment reduces both by δ. Treated high-risk share is q, untreated share is 1−q.', limit: 'This is a specified binary-outcome population with overlap. Standardization is causal only under consistency, conditional exchangeability and positivity; a pooling reversal alone does not establish those assumptions. The graph and risks are chosen examples, not medical estimates.' },
  contagion: { title: 'One fixed-point equation, two limiting meanings', anchors: ['stoch-3.9', 'stoch-3.10', 'soc-4.2'], contexts: ['Poisson family extinction', 'Erdős–Rényi giant fraction'], model: 'For Poisson offspring with mean μ, f(s)=exp[μ(s−1)]. The smallest fixed point is q. A sparse G(n,μ/n) graph has limiting giant fraction S=1−q.', limit: 'The equality uses Poisson offspring and the infinite-network limit of Erdős–Rényi graphs. Finite networks fluctuate. Social thresholds, heterogeneous networks and epidemic susceptibility are not determined by μ alone.' },
  diffusion: { title: 'A cloud broadens while total mass stays one', anchors: ['pde-1.4', 'pde-3.3', 'pde-3.15'], contexts: ['Heat density', 'Brownian probability', 'Unbounded solute density'], model: 'On the whole line, a unit Gaussian with initial variance ¼ evolves under uₜ=D uₓₓ to variance ¼+2Dt.', limit: 'All three contexts use this chosen linear, constant-diffusivity equation after normalization. The walker statement is a scaling limit. Finite membranes, bounded domains, tissue geometry and nonlinear transport have different boundary conditions or equations.' },
  duality: { title: 'A supporting line and the gap it certifies', anchors: ['opt-3.7', 'thermo-3.7', 'opt-2.7'], contexts: ['Convex supporting bound', 'Conjugate slope', 'Free-energy sign'], model: 'Choose f(x)=κx²/2. Its conjugate is f*(y)=y²/(2κ), and f(x)−yx+f*(y)=κ(x−y/κ)²/2.', limit: 'This smooth quadratic has a unique touching point. It illustrates a supporting-bound mechanism; it is not a numerical model of every LP, network cut or game. For U(S)=κS²/2, F(T)=−U*(T), with a minus sign and concave F. The ordinary thermodynamic reading uses T=y>0; negative slopes here are only mathematical examples.' },
  entropy: { title: 'One binary distribution, three entropy readings', anchors: ['info-1.2', 'thermo-6.6', 'deep-1.9', 'info-2.1'], contexts: ['Shannon bits', 'Gibbs S/kB', 'Expected log loss'], model: 'The two outcomes have probabilities p and 1−p. Hₙ=−p ln p−(1−p)ln(1−p); bits divide this by ln 2. A prediction q has expected log loss Hₙ+Dₙ(p‖q).', limit: 'The Gibbs reading is a two-microstate ensemble; it does not derive the thermodynamic second law or a heat cost. Log loss is an expectation over this chosen label distribution, not the loss of one observed label. Nats and bits are explicitly converted.' },
  feedback: { title: 'A first-order negative loop changes gain and speed', anchors: ['ctrl-1.4', 'ctrl-1.8', 'physio-1.2', 'sysbio-2.2'], contexts: ['Reference tracking', 'Load disturbance', 'Local autoregulation'], model: 'Choose P(s)=1/(s+1), controller K≥0 and unity negative feedback. The closed-loop rate is 1+K and the static sensitivity is 1/(1+K).', limit: 'Tracking and load response are exact for this delay-free LTI loop. Physiological and gene comparisons are local scalar linearizations after rescaling; they do not reproduce full Hill kinetics, positive-feedback memory, intrinsic noise or delay-driven instability.' },
  'fixed-points': { title: 'The same affine contraction, in several roles', anchors: ['pma-9.23', 'stoch-4.15'], contexts: ['Contraction iteration', 'Two-page PageRank', 'Scalar root iteration'], model: 'g(x)=rx+(1−r)/2 with 0<r<1, starting at x₀=0.9. Its fixed point is ½ and |xₙ−½|=rⁿ|x₀−½|.', limit: 'The PageRank instance has two self-linked pages and uniform teleportation with damping r. The root instance iterates x−f(x) for f(x)=(1−r)(x−½), not general Newton iteration. Existence theorems without contraction do not guarantee this rate.' },
  fourier: { title: 'A waveform, its coefficients and its missing energy', anchors: ['pma-8.11', 'pma-8.16', 'music-4.4', 'algo-4.11'], contexts: ['Orthogonal projection', 'Musical harmonic amplitudes', '32-point Fourier samples'], model: 'Use f(x)=sin x+a sin 3x+¼ sin 5x. Keeping frequencies ≤N removes exactly half the sum of squared omitted sine amplitudes from the mean square.', limit: 'This is a finite periodic trigonometric polynomial, not a discontinuous square wave. The 32 equally spaced samples resolve every frequency present, up to harmonic 5, without aliasing. Real instruments, resonance and FFT multiplication introduce additional models.' },
  harmonic: { title: 'One harmonic potential, opposite gradient conventions', anchors: ['rca-11.3', 'rca-11.12', 'em-2.8', 'fluid-4.2'], contexts: ['Harmonic mean value', 'Electrostatic potential', 'Ideal velocity potential'], model: 'Choose u(x,y)=x+a(x²−y²), so uₓₓ+uᵧᵧ=0. Every circle average equals the value at its center. Electric field is −∇u; potential-flow velocity is +∇u.', limit: 'The polynomial is an exact source-free example on the plane. Flow requires incompressibility and irrotationality, and electrostatics assumes a charge-free region. No wall, electrode or airfoil boundary is being solved here; the vector signs differ.' },
  'inverse-problems': { title: 'Small singular values magnify one noisy channel', anchors: ['nla-3.1', 'nla-2.11', 'nla-2.13', 'imaging-3.8'], contexts: ['Two-channel inverse', 'Ridge reconstruction', 'Imaging analogy'], model: 'A=diag(1,ε), true x=(0.8,0.5), measured y=Ax+(0,noise). Ridge minimizes ‖Ax−y‖²+λ²‖x‖²; its factors are σ²/(σ²+λ²).', limit: 'This exact two-channel model isolates noise amplification and bias. It is not a CT acquisition or a convolution kernel. Real tomography uses many singular directions, geometry and noise models. λ is the penalty amplitude, so the objective contains λ².' },
  'map-distortion': { title: 'A tangent circle becomes a scale ellipse', anchors: ['geog-3.4', 'geog-4.2', 'geog-3.6', 'vcalc-4.5'], contexts: ['Mercator', 'Cylindrical equal area', 'Equirectangular'], model: 'At latitude φ, the east-west scale is sec φ. North-south scales are sec φ, cos φ and 1 for the three nominal-scale cylindrical projections. Their product is local area scale.', limit: 'These are infinitesimal tangent-plane indicatrices on a unit sphere. They do not describe finite circles or an ellipsoid. Equality at the equator is local: no entire spherical map becomes both conformal and equal-area. Poles are excluded.' },
  spectral: { title: 'Rotate the axes, preserve the spectral structure', anchors: ['ladr-7.29', 'ladr-7.96', 'mech-10.8', 'mech-11.4'], contexts: ['Quadratic energy', 'Principal inertia plane', 'Unit-mass normal modes'], model: 'A=Rθ diag(1,ρ) Rθᵀ with ρ>0. The contour xᵀAx=1 has perpendicular principal axes; unit-mass mode frequencies are 1 and √ρ.', limit: 'This is a two-dimensional positive-definite example. Inertia is restricted to a principal plane. For general mechanics, modes solve Ka=ω²Ma and need not be Euclidean-orthogonal; here M=I. Infinite-dimensional spectral measures are not shown.' },
  stability: { title: 'Continuous decay can become an unstable iteration', anchors: ['ode-1.8', 'ctrl-3.3', 'deep-4.2', 'pde-3.2'], contexts: ['Continuous perturbation', 'Explicit Euler', 'Quadratic gradient descent'], model: 'For a>0, x′=−ax decays as exp(−at). Explicit Euler with step h and gradient descent on ax²/2 both multiply the error by 1−ha.', limit: 'The discrete identity is exact for this scalar quadratic. Convergence requires 0<ha<2; ha=2 alternates without decay. This does not classify nonlinear systems at zero linearization, all matrix Jordan blocks, Hopf bifurcations or general neural-network training.' },
  symmetry: { title: 'Composition is addition around a cyclic orbit', anchors: ['alg-3.13', 'xtal-2.2', 'music-8.1', 'rep-1.1'], contexts: ['Triangle rotations C₃', 'Hexagonal rotations C₆', 'Pitch transposition Z/12'], model: 'A rotation by j steps followed by k steps equals j+k modulo n. The real 2×2 matrices obey RⱼRₖ=Rⱼ₊ₖ and preserve lengths.', limit: 'Triangle rotations are a subgroup of its full reflection group. Order 6 can preserve a hexagonal lattice; order 12 here represents pitch classes, not a periodic crystal. Discrete composition alone does not prove a Noether conservation law.' },
};
