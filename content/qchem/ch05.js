import { potentialWidget, ionWidget, integralsWidget, asymmetryWidget, hlWidget, ciWidget } from './ch05.ui.shared.js';
const notes='https://mccullaghlab.github.io/physical_chemistry/quantum_mechanics/Single_Electron_Molecule_Variational_Approach.html';
const integrals='https://arxiv.org/abs/2007.12057';
export default {
 collection:'qchem',chapter:5,title:'The chemical bond in diatomic molecules',
 summary:String.raw`Clamped-nuclei energies make a potential curve, and normalized overlapping orbitals turn a one-electron bond into a small generalized eigenproblem. Two-electron antisymmetry, electron repulsion and configuration mixing then reveal the limits of a single orbital product. Orbital filling, spin response, polarity and anharmonic vibration connect these models with chemical descriptions while keeping approximate energies and historical source limits explicit.`,
 items:[
  {
   num:'5.2',kind:'Concept',name:'Potential energy curves',
   statement:String.raw`For fixed nuclear separation $R>0$, solve or approximate the electronic Hamiltonian. If its eigenvalue excludes nuclear repulsion, the nuclear potential curve is
$$U(R)=E_{\rm e}(R)+V_{\rm NN}(R).$$
A local minimum $R_e$ with $U''(R_e)>0$ gives a local harmonic force constant $k=U''(R_e)$ and angular frequency $\omega=\sqrt{k/\mu}$ for reduced nuclear mass $\mu$. The well depth $D_e=U(\infty)-U(R_e)$ differs from a ground-vibrational dissociation energy.`,
   scope:String.raw`Single-surface Born–Oppenheimer approximation: electronic derivative couplings and nuclear diagonal corrections are neglected. Large nuclear mass alone does not justify this near every degeneracy. The curve shown is a fixed-exponent, two-function H₂⁺ variational model, not a measured molecular potential or an exact electronic solution.`,
   idea:String.raw`Keep the nuclear coordinates as parameters in the electronic Schrödinger equation of QM 2.4. Projecting a product of a parametric electronic state and a nuclear factor generates derivatives of both factors; neglecting the resulting couplings leaves nuclear motion on one curve. The convention for nuclear repulsion must stay consistent: add it once if it was omitted from the electronic Hamiltonian. Taylor expansion around a nondegenerate minimum gives the quadratic oscillator of 1.7. The widget evaluates the normalized LCAO model of 5.3 at successive separations and computes its interior minimum; its finite-difference force and curvature are numerical diagnostics.`,
   caption:String.raw`Move the nuclei along the computed H₂⁺ curve. Inspect total energy, force and the model minimum, then change a chosen nuclear reduced mass to see the local harmonic frequency. Nuclear repulsion is included once; the separated limit is hydrogen plus a proton.`,
   deps:['qm-2.4','qchem-1.7','qchem-4.2'],see:['qchem-5.3','qm-12.5'],refs:['C. D. Sherrill, The Born–Oppenheimer Approximation (2005), pp.1–4','McCullagh, Chemistry Lessons §4.5.17; independently derived minimal LCAO curve'],links:{source:'https://vergil.chemistry.gatech.edu/static/content/bo.pdf',model:notes},tags:['potential energy','Born–Oppenheimer'],viz:potentialWidget,
  },
  {
   num:'5.3',kind:'Model',name:'H₂⁺ by LCAO',
   statement:String.raw`In atomic units the clamped-nuclei H₂⁺ Hamiltonian is
$$H=-\tfrac12\nabla^2-r_A^{-1}-r_B^{-1}+R^{-1}.$$
Use normalized hydrogenic functions $a=\pi^{-1/2}e^{-r_A}$ and $b=\pi^{-1/2}e^{-r_B}$ with overlap $S$. Their normalized combinations are
$$\psi_\pm=\frac{a\pm b}{\sqrt{2(1\pm S)}}.$$
For the equal diagonal matrix elements $\alpha=H_{AA}=H_{BB}$ and real $\beta=H_{AB}$, the two Ritz values are $E_\pm=(\alpha\pm\beta)/(1\pm S)$. In this fixed basis the plus state has a well below the separated energy $-1/2$ Hartree.`,
   scope:String.raw`One electron, fixed protons, nonrelativistic Coulomb interactions, fixed 1s exponents and a two-dimensional trial space. The energies are exact within that space, not exact H₂⁺ energies. Orbital signs are amplitudes; a bond-axis slice is not a one-dimensional probability distribution.`,
   idea:String.raw`The hydrogen ground functions come from 2.1. Their overlap makes the Gram matrix nontrivial, so use the generalized variational equation of 4.2. Exchange symmetry gives coefficient vectors proportional to $(1,1)$ and $(1,-1)$. Normalization supplies the two different denominators. Evaluating the matrix elements, including the constant nuclear repulsion with its overlap factor in the off-diagonal, produces the displayed energies. The minus combination has an exact nodal mid-plane; the plus combination has constructive interference there. The energy minimum must still be calculated: a positive overlap alone does not prove binding.`,
   caption:String.raw`Change nuclear separation and switch the relative sign. Compare the actual axis amplitude with both computed variational energies. The minus state vanishes at the midpoint; the readout keeps the three-dimensional normalization and the nuclear-repulsion convention explicit.`,
   deps:['qchem-4.2','qchem-2.1'],see:['qchem-5.2'],refs:['McCullagh, Chemistry Lessons §4.5.17; independent normalized integral derivation'],links:{source:notes},tags:['LCAO','variational bond'],viz:ionWidget,
  },
  {
   num:'5.4',kind:'Definition',name:'Overlap, Coulomb and resonance integrals',
   statement:String.raw`For the real normalized 1s functions of 5.3, define the dimensionless overlap and two one-electron attraction integrals by
$$S=\langle a,b\rangle,\quad J=-\langle a,r_B^{-1}a\rangle,$$
$$K=-\langle a,r_B^{-1}b\rangle.$$
For separation $R$ in Bohr,
$$S=e^{-R}(1+R+R^2/3),$$
$$J=e^{-2R}(1+R^{-1})-R^{-1},$$
$$K=-e^{-R}(1+R).$$
Thus $\alpha=-1/2+J+1/R$ and $\beta=(-1/2+1/R)S+K$.`,
   scope:String.raw`These signs and names refer specifically to the one-electron H₂⁺ convention. A two-electron exchange integral is a different object. Neither J nor K as defined here includes nuclear repulsion. Separations stay positive; coincident nuclei and the singular Gram matrix are excluded.`,
   idea:String.raw`The overlap integral records that the atomic basis functions are normalized but not orthogonal. In prolate coordinates $r_A=R(\xi+\eta)/2$ and $r_B=R(\xi-\eta)/2$, the volume element is $R^3(\xi^2-\eta^2)d\xi\,d\eta\,d\varphi/8$. The overlap and attraction integrals reduce to elementary exponential moments over $\xi\ge1$ and $-1\le\eta\le1$. For the off-diagonal energy, apply the B-centered atomic Hamiltonian to b, or integrate it by parts onto a with the matching A-centered operator. One must not apply the A-centered hydrogen eigen-equation to a B-centered function. The constant 1/R multiplies S off diagonal.`,
   caption:String.raw`Slide the atoms apart and follow S, J and K separately. Read their contributions to the actual diagonal and off-diagonal energy matrix. Overlap is dimensionless; attraction integrals and matrix elements are in Hartree.`,
   deps:['qchem-5.3'],refs:['McCullagh, Chemistry Lessons §4.5.17.6; independent prolate-coordinate evaluation'],links:{source:notes},tags:['overlap','matrix elements'],viz:integralsWidget,
  },
  {
   num:'5.5',kind:'Phenomenon',name:'Antibonding is more antibonding than bonding is bonding',
   statement:String.raw`Let a symmetric two-function real generalized eigenproblem have overlap $0\le S<1$, diagonal $\alpha$ and off-diagonal $\beta$. Put $\delta=\beta-\alpha S$. Then
$$E_+-\alpha=\frac{\delta}{1+S}.$$
$$E_--\alpha=\frac{-\delta}{1-S}.$$
If $\delta<0$ and $S>0$, the plus state is lower and the minus-state upward shift is larger in magnitude:
$$\frac{E_--\alpha}{\alpha-E_+}=\frac{1+S}{1-S}>1.$$
At S=0 the magnitudes agree. Positive delta reverses which combination is lower.`,
   scope:String.raw`This compares shifts relative to the same diagonal energy in one symmetric nonorthogonal basis. It is not a universal statement about arbitrary molecular orbitals or bond dissociation energies. A phase change of a basis function changes the corresponding overlap and coupling signs together.`,
   idea:String.raw`Subtract alpha from the two eigenvalues of 5.3 and collect the effective coupling delta. The unequal normalization denominators produce the ratio. The sign condition is essential: a negative bare beta alone does not establish a lower plus state when alpha S also contributes. With zero effective coupling both levels equal alpha, so a ratio of two zero shifts is not an observed energy ratio.`,
   caption:String.raw`Vary overlap and a discrete effective coupling, including its sign and zero. Compare the actual energy rungs with the diagonal reference. Positive coupling reverses the ordering; orthogonality removes the magnitude asymmetry.`,
   deps:['qchem-5.4'],refs:['Self-contained algebra from the generalized eigenproblem in 5.3–5.4'],tags:['antibonding','normalization'],viz:asymmetryWidget,
  },
  {
   num:'5.6',kind:'Model',name:'Valence-bond theory of H₂ (Heitler–London)',
   statement:String.raw`For two normalized linearly independent real atomic functions a,b with overlap $|S|<1$, the Heitler–London spatial trial functions are
$$\Phi_\pm=\frac{a(1)b(2)\pm b(1)a(2)}{\sqrt{2(1\pm S^2)}}.$$
Antisymmetry of the complete electron state pairs the plus spatial function with a spin singlet and the minus spatial function with a spin triplet. With the full clamped-nuclei two-electron Hamiltonian,
$$E_\pm=\frac{H_D\pm H_X}{1\pm S^2},$$
where $H_D=\langle ab,H ab\rangle$ and $H_X=\langle ab,H ba\rangle$. Electron repulsion and nuclear repulsion are included.`,
   scope:String.raw`A variational ansatz, not the exact H₂ wavefunction. The widget uses a modern chosen basis of two normalized Gaussian functions $e^{-\alpha r^2}$. Its energies are variational predictions in that basis. The original 1927 Slater-orbital calculation remains a separate historical source. At fixed exponent it dissociates to two approximate Gaussian atoms, whose total energy differs from −1 Hartree.`,
   idea:String.raw`The two product states ab and ba have overlap S², giving the normalization factors. Electron antisymmetry from 3.1 selects the spin partner. The electronic Hamiltonian is the sum of two one-electron operators plus 1/r12, with one nuclear term 1/R. Thus its electronic direct matrix is $2h_{AA}+(AA|BB)$ and its electronic cross matrix is $2S h_{AB}+(AB|BA)$. Add 1/R after dividing by the norm, equivalently include it as 1/R and S²/R in the unnormalized matrices. Gaussian products and the Coulomb integral representation evaluate every term; no attractive or repulsive energy curve is imposed by hand.`,
   caption:String.raw`Change separation and the Gaussian exponent. Compare actual singlet and triplet energies, including both electron and nuclear repulsion, with the two-atom limit in that same basis. The readout exposes direct and exchange contributions.`,
   deps:['qchem-5.2','qchem-3.1','qchem-4.2'],refs:['Fermann & Valeev, Fundamentals of Molecular Integrals Evaluation (2020), selected §§2–6','Independent normalized two-Gaussian Heitler–London calculation'],links:{integrals,context:'https://mccullaghlab.github.io/physical_chemistry/quantum_mechanics/H2_Variational_Minimal_Basis.html'},tags:['valence bond','exchange'],viz:hlWidget,
  },
  {
   num:'5.7',kind:'Paradox',name:'MO theory’s failure at dissociation',
   statement:String.raw`For the restricted two-electron ansatz g(1)g(2), with normalized g proportional to a+b, expansion contains both covalent products ab,ba and ionic products aa,bb. At zero overlap the ionic part has one-half of the norm, even at infinite separation. This is a failure of the single doubly occupied restricted orbital, not of every molecular-orbital method. A normalized mixture
$$\Psi=c_g g(1)g(2)+c_u u(1)u(2)$$
can cancel the ionic terms, where u is proportional to a−b. At zero overlap this requires $c_u=-c_g$.`,
   scope:String.raw`A spin-singlet, two-configuration variational space built from the same two atomic functions. Its optimized energy is exact in that finite space only. AO-product coefficients at nonzero overlap are not mutually exclusive probabilities. The fixed Gaussian exponent in the widget gives approximate separated atoms; no exact H₂ energy is claimed.`,
   idea:String.raw`Expanding g² and u² shows ionic coefficients $c_g/[2(1+S)]+c_u/[2(1-S)]$ and covalent coefficients with the opposite sign between terms. Setting the ionic coefficient to zero recovers the normalized HL singlet. The two orthonormal configurations give a real symmetric 2×2 Hamiltonian with diagonal energies Hgg,Huu and genuine double-excitation coupling (gu|gu). Its lower eigenvalue minimizes the Rayleigh quotient by 4.2. Configuration mixing therefore includes the HL state and cannot raise the optimal energy above the restricted product. At large separation its ionic cancellation gives two neutral chosen-basis atoms.`,
   caption:String.raw`Pull the atoms apart and change the normalized CI mixing angle. Compare your Rayleigh quotient with the optimized finite-basis energy and separated atoms. The readout shows ionic and covalent coefficients, rather than treating nonorthogonal AO terms as probabilities.`,
   deps:['qchem-5.3','qchem-5.6','qchem-4.2'],refs:['McCullagh, Chemistry Lessons §4.5.21, expansion and variational setup; independent Gaussian matrix evaluation'],links:{source:'https://mccullaghlab.github.io/physical_chemistry/quantum_mechanics/H2_Configuration_Interaction.html',integrals},tags:['dissociation','configuration interaction'],viz:ciWidget,
  },
 ],
};
