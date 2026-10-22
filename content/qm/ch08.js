import { boxWidget, oscillatorWidget, separationWidget, barrierWidget, sphericalWellWidget, energyWidget, orbitalWidget, symmetryWidget } from './ch08.ui.shared.js';

const tong = 'https://davidtong.org/pdfs/teaching/quantum-mechanics/qm4.pdf';
const mit = 'https://ocw.mit.edu/courses/8-05-quantum-physics-ii-fall-2013/e765f050b2fd50a9d87d2ae801e9c52f_MIT8_05F13_Chap_09.pdf';

export default {
  collection: 'qm', chapter: 8, title: 'Three dimensions and the hydrogen atom',
  summary: String.raw`Product states count box and oscillator levels; rotational symmetry organizes central potentials into angular multiplets. A regular radial boundary condition gives the Coulomb spectrum and normalized orbitals, with an additional symmetry connecting angular momenta at one energy. Spectral lines, recoil, energy moments and a shallow-well threshold then show both the reach and the limits of these ideal models.`,
  items: [
    {
      num: '8.1', kind: 'Model', name: 'Three-dimensional box and degeneracy',
      statement: String.raw`A spinless particle of mass $\mu$ in a rectangular region $0<x_i<L_i$, with Dirichlet walls and zero interior potential, has a complete product eigenbasis
$$\psi_{\mathbf n}=\prod_i f_{n_i}^{(i)}.$$
$$E_{\mathbf n}=C\sum_i\frac{n_i^2}{L_i^2}.$$
Here $f_{n_i}^{(i)}$ is the normalized one-dimensional sine mode on side $i$, $n_i=1,2,\ldots$, and $C=\pi^2\hbar^2/(2\mu)$.
The multiplicity of an energy is the number of ordered positive integer triples giving that sum. Equal sides create permutation coincidences; additional arithmetic coincidences can occur. Unequal sides need not remove every degeneracy.`,
      idea: String.raw`The Hamiltonian is the sum of the three one-dimensional wall Hamiltonians of QM 3.3. Applying it to a product adds their eigenvalues; the tensor products of the complete sine bases span the rectangular $L^2$ space. Distinct ordered triples are orthogonal, so counting the equal sums counts independent states. A finite search supplies only a lower bound unless every omitted triple has larger energy. If each index is at most $K$, the least possible omitted energy is the minimum of the three sums with one index $K+1$ and the other two equal to one. Every displayed energy strictly below that bound has its full multiplicity.`,
      caption: String.raw`Change the three side lengths and inspect the lowest energy groups. Rows are equally spaced for legibility; their numeric labels give the actual energies. Exact rational comparisons preserve genuine coincidences. Complete multiplicities are certified below the first-omitted bound; other counts are explicitly lower bounds, even when they happen to be complete.`,
      scope: String.raw`Ideal, independent Cartesian confinement with impenetrable walls; spin is excluded. Lengths use tenths of a chosen unit and the finite enumeration uses quantum numbers 1–5 in each direction. Energy is in $\pi^2\hbar^2/(2\mu L_0^2)$. Stretching a real material can also change its effective Hamiltonian.`,
      deps: ['qm-3.3'], refs: ['Self-contained product-basis derivation from QM 3.3; exact finite lattice enumeration'],
      tags: ['confinement', 'degeneracy'], viz: boxWidget,
    },
    {
      num: '8.2', kind: 'Model', name: 'Isotropic oscillator in three dimensions',
      statement: String.raw`For $H=\mathbf p^2/(2\mu)+\mu\omega^2r^2/2$ on $L^2(\mathbb R^3)$, $\omega>0$, the spinless levels are
$$E_N=\hbar\omega(N+3/2).$$
For $N=0,1,\ldots$, the multiplicity is $g_N=(N+1)(N+2)/2$.
Cartesian states have $n_x+n_y+n_z=N$. In a separated spherical basis, $N=2n_r+\ell$, with $n_r\ge0$, $\ell\ge0$ and $m=-\ell,\ldots,\ell$. Both descriptions count the same complete shell.`,
      idea: String.raw`Add the three oscillator ladders of QM 4.3 as in the product construction of QM 8.1. For a fixed $n_x$, there are $N-n_x+1$ choices of the other two nonnegative indices; summing gives $g_N$. In radial coordinates, insert $u=r^{\ell+1}e^{-r^2/(2b^2)}P(r^2/b^2)$, $b=\sqrt{\hbar/(\mu\omega)}$. The regular normalizable solutions terminate at a polynomial of degree $n_r$, giving $E/\hbar\omega=2n_r+\ell+3/2$. Summing $2\ell+1$ over $\ell=N,N-2,\ldots$ gives the same number. These are two bases of a shell, not a one-to-one identification of individual basis vectors.`,
      caption: String.raw`Select a shell. Compare the full set of Cartesian triples with the radial and angular multiplets; the independent counts agree. Every dot represents one basis state, with no cutoff within the selected shell.`,
      scope: String.raw`An isotropic quadratic potential with three equal positive frequencies and no spin. An anisotropic oscillator has different spacings and generally different multiplicities.`,
      deps: ['qm-4.3', 'qm-8.1', 'qm-7.5'], refs: ['Tong, free Quantum Mechanics notes §4.2.1; independent corrected polynomial substitution', 'MIT 8.05 (2013), lecture 9 §6'],
      links: { source: tong, supplement: mit }, tags: ['oscillator', 'degeneracy'], viz: oscillatorWidget,
    },
    {
      num: '8.3', kind: 'Theorem', name: 'Separation for central potentials',
      statement: String.raw`Let $H=-\hbar^2\Delta/(2\mu)+V(r)$ be a self-adjoint spinless central Hamiltonian with a rotationally invariant domain and the usual regular boundary conditions. In each discrete energy eigenspace one can choose joint eigenvectors of $H,L^2,L_z$ of the form
$$\psi_{E\ell m}=R_{E\ell}\,Y_\ell^m.$$
The radial equation is independent of $m$, so each radial solution supplies a $2\ell+1$ angular multiplet. Different $\ell$ can share an energy. An arbitrary superposition in a degenerate eigenspace need not factor into one radial function and one spherical harmonic.`,
      idea: String.raw`In spherical coordinates, $\Delta=r^{-2}\partial_r(r^2\partial_r)-L^2/(\hbar^2r^2)$. Expand the angular dependence in the complete spherical harmonics of QM 7.5. Since multiplication by $V(r)$ leaves each angular sector invariant, its coefficient satisfies the same radial differential equation for every $m$ at fixed $\ell$. On a discrete eigenspace the rotation representation decomposes into the finite angular multiplets, allowing the joint basis. QM 3.1 supplies each stationary time factor $e^{-iEt/\hbar}$. This coordinate calculation is used with the stated operator domain, rather than used to infer self-adjointness from formal symmetry alone.`,
      caption: String.raw`For a normalized hydrogen example, choose angular momentum and its projection. Compare the actual radial probability with the angular probability on a meridian, then move the angular probe. The product density is evaluated from both factors.`,
      scope: String.raw`The theorem concerns a standard central operator and its discrete eigenspaces; it does not assert that bound states span the entire Hilbert space when a continuum is present. The diagram uses one explicitly normalized Coulomb state, not an arbitrary drawn potential or a solver for singular extensions.`,
      deps: ['qm-3.1', 'qm-7.5'], refs: ['MIT 8.05 (2013), lecture 9 §§1.3,4', 'Tong, free Quantum Mechanics notes §4.2'],
      links: { source: mit, supplement: tong }, tags: ['symmetry', 'separation'], viz: separationWidget,
    },
    {
      num: '8.4', kind: 'Definition', name: 'Radial equation and centrifugal barrier',
      statement: String.raw`With $u(r)=rR(r)$ and normalized $Y_\ell^m$, radial normalization becomes $\int_0^\infty|u|^2dr=1$, and
$$-\frac{\hbar^2}{2\mu}u''+W_\ell(r)u=Eu,$$
$$W_\ell(r)=V(r)+\frac{\hbar^2\ell(\ell+1)}{2\mu r^2}.$$
The second potential term is the centrifugal barrier. For the usual regular central Hamiltonian without a contact interaction at the origin, use the regular radial solution and $u(0)=0$. Boundary conditions at an outer wall or at infinity are also part of the problem.`,
      idea: String.raw`Differentiating $R=u/r$ cancels the first radial derivative in the separated equation of QM 8.3. The Jacobian $r^2dr\,d\Omega$ cancels $1/r^2$ in $|R|^2$, explaining the one-dimensional radial measure. The angular eigenvalue contributes $\hbar^2\ell(\ell+1)$, paralleling the classical fixed-angular-momentum effective potential of mechanics 8.3. Square integrability alone is not the complete origin boundary condition: an irregular $R\sim1/r$ is locally square integrable in three dimensions but lies outside this chosen ordinary Hamiltonian domain.`,
      caption: String.raw`Change $\ell$ and probe radius in a Coulomb example. Compare the attraction, barrier and their sum, alongside a regular radial state. The origin is a boundary, with no invented finite value of the singular potential.`,
      scope: String.raw`The displayed reduced-mass atomic units set $\hbar=\mu=1$ and $V=-1/r$. The barrier is angular kinetic energy rewritten in the radial equation, rather than an additional interaction. Its formula is not a classical radial trajectory.`,
      deps: ['qm-8.3', 'mech-8.3'], refs: ['Tong, free Quantum Mechanics notes §§4.2,4.2.3', 'MIT 8.05 lecture 9 §4'],
      links: { source: tong, supplement: mit }, tags: ['radial equation', 'boundary'], viz: barrierWidget,
    },
    {
      num: '8.5', kind: 'Model', name: 'Infinite spherical well',
      statement: String.raw`For a spinless particle in a ball of radius $a$ with zero interior potential and a Dirichlet wall, the regular radial states are $R\propto j_\ell(kr)$. If $z_{s\ell}$ is the $s$th strictly positive zero of the spherical Bessel function $j_\ell$, then
$$E_{s\ell}=\frac{\hbar^2z_{s\ell}^2}{2\mu a^2}.$$
Every such radial state has the angular multiplet $m=-\ell,\ldots,\ell$. For $\ell=0$, $z_{s0}=s\pi$. The zero of $j_\ell$ at the origin for $\ell>0$ is not a positive-energy level.`,
      idea: String.raw`Inside the ball, QM 8.4 becomes $u''+[k^2-\ell(\ell+1)/r^2]u=0$. Its regular branch is $u=rj_\ell(kr)$; the irregular branch violates the chosen origin domain. The outer condition $u(a)=0$ gives the positive zeros. With $x=r/a$, a normalized dimensionless radial function is $\sqrt2\,j_\ell(z_{s\ell}x)/|j_{\ell+1}(z_{s\ell})|$. Its normalization follows by integrating the Bessel equation's two-parameter Wronskian identity and taking coincident parameters.`,
      caption: String.raw`Choose angular momentum and a positive root. Inspect the Bessel function's zero and the normalized radial probability inside the ball. Energy is $z^2$ in the declared wall-energy unit; the readout gives the numerical root residual.`,
      scope: String.raw`Ideal hard wall and regular origin, with numerical positive roots for $\ell=0$–6 and $s=1$–8. Bracketing and floating residuals locate these model roots; they are not a proof of the full infinite spectrum or a precision certificate.`,
      deps: ['qm-8.4'], refs: ['MIT 8.05 (2013), lecture 9 §§5.1–5.2, printed pp.24–27'],
      links: { source: mit }, tags: ['confinement', 'Bessel functions'], viz: sphericalWellWidget,
    },
    {
      num: '8.6', kind: 'Theorem', name: 'Hydrogen energy levels',
      statement: String.raw`For the standard nonrelativistic spinless Coulomb Hamiltonian $H=\mathbf p^2/(2\mu)-\kappa/r$, $\kappa>0$, its negative discrete levels are
$$E_n=-\frac{\mu\kappa^2}{2\hbar^2n^2}.$$
Here $n=1,2,\ldots$, $\ell=0,\ldots,n-1$ and $m=-\ell,\ldots,\ell$.
The spatial multiplicity is $\sum_{\ell=0}^{n-1}(2\ell+1)=n^2$. For a point nucleus of charge $Ze$, $\kappa=Ze^2/(4\pi\epsilon_0)$. These bound states occupy the negative-energy sector; scattering states also exist.`,
      idea: String.raw`Put $a=\hbar^2/(\mu\kappa)$ and $\rho=2r/(na)$ in QM 8.4. Regularity suggests $u=\rho^{\ell+1}e^{-\rho/2}v(\rho)$. For a general negative energy the corresponding confluent-hypergeometric series has an exponentially growing component; removing it makes the regular series terminate. The remaining associated Laguerre equation requires a degree $k\ge0$ and $n=k+\ell+1$, yielding the stated energies and all allowed angular labels. Orthogonality and the radial spectral problem exclude additional negative levels for this chosen Coulomb operator. The agreement with the Bohr energies of QM 1.5 concerns the energy formula, not literal electron orbits.`,
      caption: String.raw`Select a principal shell. Each angular column contains $2\ell+1$ states at exactly the same energy, and their count is $n^2$. Change $Z$ to see the common $Z^2$ scale.`,
      scope: String.raw`A point Coulomb source with constant reduced mass, no external field, spin, relativity, finite nuclear size or radiative corrections. The theorem does not apply unchanged to screened, multielectron or molecular potentials. Numerical energies in this diagram are in reduced-mass Hartree units.`,
      deps: ['qm-8.4', 'em-2.6', 'qm-1.5'], refs: ['Tong, free Quantum Mechanics notes §4.3.1', 'MIT 8.05 lecture 9 §7'],
      links: { source: tong, supplement: mit }, tags: ['Coulomb spectrum', 'degeneracy'], viz: energyWidget,
    },
    {
      num: '8.7', kind: 'Definition', name: 'Hydrogen orbitals',
      statement: String.raw`A hydrogenic spatial orbital is a normalized stationary wave function $\psi_{n\ell m}=R_{n\ell}Y_\ell^m$. With $a_\mu=4\pi\epsilon_0\hbar^2/(\mu e^2)$ and $\rho=2Zr/(na_\mu)$,
$$R_{n\ell}=N e^{-\rho/2}\rho^\ell L_k^{2\ell+1}(\rho),$$
where $k=n-\ell-1$, and the positive normalization is defined by
$$N^2=\left(\frac{2Z}{na_\mu}\right)^3 C,$$
$$C=\frac{k!}{2n(n+\ell)!}.$$
The density per volume is $|R|^2|Y|^2$, whereas the probability per radius is $r^2|R|^2=|u|^2$. There are $n-\ell-1$ positive radial nodes. Angular zeros depend on the chosen complex harmonic or real linear combination; a universal count of visible nodal planes is inappropriate for complex $m$ states.`,
      idea: String.raw`QM 8.6 fixes the terminating Laguerre polynomial and QM 7.5 supplies the normalized angular factor. Their product normalization uses $d^3r=r^2dr\,d\Omega$. A zero at $r=0$ is excluded when counting positive radial nodes. For the $1s$ state, density per volume decreases from the nucleus, but $r^2|R|^2\propto r^2e^{-2Zr/a_\mu}$ peaks at $r=a_\mu/Z$. The difference comes from shell volume, not a preferred classical orbit. Degenerate linear combinations are also stationary orbitals.`,
      caption: String.raw`Choose quantum numbers, a slice plane and a complex harmonic or real combination. Compare the density slice with radial probability. In the xy plane, maximal-m complex harmonics have rotationally symmetric density while real combinations have angular nodes. Their relative xz images can coincide. A wholly nodal slice stays blank. Brightness uses a disclosed relative scale rather than sampled electron positions or surfaces of fixed probability.`,
      scope: String.raw`Ideal spinless Coulomb orbitals. The widget offers radial degree 0–4, angular momentum 0–3 and projection $m=0$ or $m=\ell$. Lengths are in $a_\mu$, and colour is normalized to the sampled nonzero slice maximum rather than an absolute cross-orbital intensity. Exact coordinate cosines preserve wholly nodal planes. The finite slice can omit tails and is not a three-dimensional probability integral.`,
      deps: ['qm-8.6', 'qm-7.5'], refs: ['Tong, free Quantum Mechanics notes §4.3.2; normalized associated-Laguerre expression derived independently'],
      links: { source: tong }, tags: ['orbitals', 'probability'], viz: orbitalWidget,
    },
    {
      num: '8.8', kind: 'Theorem', name: 'Hidden SO(4) symmetry of hydrogen',
      statement: String.raw`For the standard spinless attractive Coulomb problem define the symmetrized Runge–Lenz operator
$$\begin{aligned}\mathbf B&=\tfrac12\mathbf p\times\mathbf L\\&\quad-\tfrac12\mathbf L\times\mathbf p,\end{aligned}$$
$$\mathbf A=\mathbf B/\mu-\kappa\hat{\mathbf r}.$$
On each negative-energy eigenspace $E<0$, $\mathbf K=\sqrt{-\mu/(2E)}\,\mathbf A$ and $\mathbf L$ generate $\mathfrak{so}(4)$. The commuting angular momenta $\mathbf J_\pm=(\mathbf L\pm\mathbf K)/2$ both have $j=(n-1)/2$. The shell is the $(j,j)$ representation of dimension $n^2$, containing orbital angular momenta $0,1,\ldots,n-1$ once each. Components of $\mathbf A$ preserve energy but need not preserve $L^2$; applying one can also annihilate a state.`,
      idea: String.raw`Use the canonical relations and the angular algebra of QM 7.2 to expand ordered products. They give $[H,A_i]=0$, $[L_i,A_j]=i\hbar\epsilon_{ijk}A_k$, $[A_i,A_j]=-2i\hbar H\epsilon_{ijk}L_k/\mu$, $\mathbf L\cdot\mathbf A=0$, and $A^2=\kappa^2+(2H/\mu)(L^2+\hbar^2)$. The extra $\hbar^2$ comes from operator ordering. Restrict to a finite bound eigenspace of the usual Coulomb domain; the rescaled generators then satisfy two commuting angular algebras. Their Casimirs are equal and obey
$$4j(j+1)+1=-\frac{\mu\kappa^2}{2E\hbar^2}.$$
QM 7.3 yields $n=2j+1$ and the energy formula. QM 7.14 decomposes the equal-spin product under $\mathbf L=\mathbf J_++\mathbf J_-$. The radial count in QM 8.6 fixes one copy; the abstract algebra by itself would allow repeated copies. Mechanics 12.9 motivates the classical conserved vector, with a different mass normalization. Formal differential identities alone are not a proof of self-adjointness or strong commutation on all states.`,
      caption: String.raw`Choose one shell and an orbital state. Apply the finite represented $K_z=J_{+z}-J_{-z}$. The unnormalized output is resolved into angular multiplets at the same energy. Its squared norm is the operator's output norm, not a probability of measuring a generator application; a zero output is reported directly.`,
      scope: String.raw`Negative Coulomb bound eigenspaces only, excluding spin. The widget uses exact angular quantum labels and floating Clebsch–Gordan coefficients for $n=1$–6; its norm residual is a numerical diagnostic. No screened-potential symmetry or classical trajectory is inferred.`,
      deps: ['qm-8.6', 'mech-12.9', 'qm-7.2', 'qm-7.3', 'qm-7.14'], refs: ['Szriftgiser & Cheb-Terrab (2021), arXiv:2006.12498v2 §§1,3–7; their Runge–Lenz vector is −A in the convention here', 'MIT 18.755 (2024), lecture 13, Exercise 39.2 and Corollary 39.1'],
      links: { source: 'https://arxiv.org/html/2006.12498', exercise: 'https://ocw.mit.edu/courses/18-755-lie-groups-and-lie-algebras-ii-spring-2024/mit18_755_s24_lec13.pdf' }, tags: ['symmetry', 'degeneracy'], viz: symmetryWidget,
    },
  ],
};
