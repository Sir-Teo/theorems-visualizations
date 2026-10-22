import { spectrumWidget, isotopeWidget, virialWidget, ionWidget, packetWidget, rotorWidget, shallowWellWidget } from './ch08.ui.shared.js';
const constants = 'https://physics.nist.gov/cuu/Constants/Table/allascii.txt';
const tong = 'https://davidtong.org/pdfs/teaching/quantum-mechanics/qm4.pdf';

export default {
  collection: 'qm', chapter: 8,
  items: [
    {
      num: '8.9', kind: 'Phenomenon', name: 'The hydrogen spectrum',
      statement: String.raw`Hydrogen has characteristic absorption and emission lines. In the nonrelativistic point-Coulomb model, a photon connecting principal levels $b>a$ has
$$hc/\lambda=E_b-E_a,$$
$$\lambda^{-1}=R_\mu(a^{-2}-b^{-2}),$$
where $R_\mu=R_\infty\mu/m_e$.
The vacuum wavelengths approach the series limit $a^2/[R_\infty(\mu/m_e)]$ as $b\to\infty$. Lyman, Balmer and Paschen denote lower principal levels 1, 2 and 3. This formula gives ideal transition energies; it does not say that every pair of individual orbitals has an allowed electric-dipole transition or predict line intensities.`,
      idea: String.raw`Subtract the Coulomb energies of QM 8.6 and equate the positive difference to $hc/\lambda$. Factoring the result gives the empirical term structure introduced in QM 1.4. The level spacing decreases as the upper quantum number increases, so the wavelengths crowd toward a finite limit. Each principal pair shown admits some electric-dipole transitions between angular sublevels, but their actual strengths and populations require additional physics. Reduced mass, relativity, spin and radiative corrections distinguish a precision measured spectrum from this leading ideal calculation.`,
      caption: String.raw`Choose a spectral series and upper level. Read the calculated vacuum wavelength and photon energy beside the level diagram and series positions. Horizontal positions encode wavelength; the drawn strokes have equal height and are not measured line strengths.`,
      scope: String.raw`Ideal point-nucleus hydrogen using the proton reduced mass and selected 2022 CODATA central values. The display rounds to a useful model precision, does not propagate constant uncertainties and does not compare measured air wavelengths with vacuum predictions. Fine structure, Lamb shifts, hyperfine structure, finite nuclear size and environmental effects are omitted.`,
      deps: ['qm-8.6', 'qm-1.4'], refs: ['Tong, free Quantum Mechanics notes §4.3.1', 'NIST, 2022 CODATA complete ASCII listing: Rydberg constant, proton/electron mass ratio and exact SI h,c,e'],
      links: { source: tong, constants }, tags: ['spectroscopy', 'Coulomb spectrum'], viz: spectrumWidget,
    },
    {
      num: '8.10', kind: 'Phenomenon', name: 'Reduced mass and the isotope shift',
      statement: String.raw`For an electron and a point nucleus of mass $M$ interacting only through their separation, the centre-of-mass and relative kinetic energies separate. The relative Coulomb Hamiltonian uses $\mu=m_eM/(m_e+M)$. At fixed charge, its level energies and transition wavenumbers scale as $\mu$.

Thus the leading model predicts shorter wavelengths for deuterium than for hydrogen: a heavier nucleus gives larger $\mu$. This is a reduced-mass isotope contribution, not the complete isotope shift of real atoms.`,
      idea: String.raw`Use the linear coordinate change of mechanics 8.2 in the two-particle kinetic operator. The cross derivatives cancel, leaving $-\hbar^2\Delta_R/[2(m_e+M)]-\hbar^2\Delta_r/(2\mu)$. The internal Coulomb spectrum of QM 8.9 then uses that reduced mass. With $q=M/m_e$, the factor is $q/(q+1)$; for two finite masses its difference is $(q_B-q_A)/[(q_A+1)(q_B+1)]$. This expression preserves a small shift without subtracting two nearly equal factors. The fixed-nucleus limit has factor one.`,
      caption: String.raw`Select a transition and compare hydrogen, deuterium or a chosen nuclear mass against the fixed-nucleus limit. The graph magnifies the wavelength shifts and labels its reference; the full wavelengths remain available in the readout.`,
      scope: String.raw`Nonrelativistic relative motion of two point particles with no external force. The hydrogen and deuterium masses are nuclear proton/electron and deuteron/electron ratios from 2022 CODATA, rather than neutral-atom masses. No Urey measurement, historical trace or complete nuclear-size/QED isotope calculation is reproduced.`,
      deps: ['qm-8.9', 'mech-8.2'], refs: ['Self-contained two-body coordinate derivation using mechanics 8.2 and QM 8.9', 'NIST, 2022 CODATA complete ASCII listing: proton/electron and deuteron/electron mass ratios'],
      links: { constants }, tags: ['reduced mass', 'isotope shift'], viz: isotopeWidget,
    },
    {
      num: '8.11', kind: 'Theorem', name: 'Virial theorem in quantum mechanics',
      statement: String.raw`Let a normalized stationary state of $H=\mathbf p^2/(2\mu)+V(\mathbf r)$ have finite kinetic and potential expectations. Suppose dilation variations are admissible in its Hamiltonian form domain, the potential can be differentiated under the expectation, and no wall or boundary term remains. Then
$$2\langle T\rangle=\langle\mathbf r\cdot\nabla V\rangle.$$
For a differentiable homogeneous potential of degree $s$, this becomes $2\langle T\rangle=s\langle V\rangle$. Coulomb bound states have $\langle T\rangle=-E$ and $\langle V\rangle=2E$; oscillator eigenstates have equal kinetic and potential expectations.`,
      idea: String.raw`Set $\psi_\lambda(\mathbf r)=\lambda^{3/2}\psi(\lambda\mathbf r)$, which preserves norm. An eigenstate is a stationary point of the energy under the admitted normalized variation. Its kinetic expectation is $\lambda^2\langle T\rangle$, while changing variables in the potential gives $\int|\psi(\mathbf r)|^2V(\mathbf r/\lambda)d^3r$. Differentiating at one yields $2\langle T\rangle-\langle\mathbf r\cdot\nabla V\rangle=0$. This is the stationary-state counterpart of the dilation/virial reasoning in mechanics 8.16 and the expectation evolution of QM 2.9. Hard-wall domains need boundary contributions and are excluded from this statement.`,
      caption: String.raw`Choose a Coulomb orbital and charge. The program integrates its integer Laguerre polynomial moments exactly using factorials, then compares the separately computed kinetic and potential values. The equality is proved by the dilation argument; the selected state is a check.`,
      scope: String.raw`Standard Coulomb bound states meet the stated dilation conditions. Exact rational moments are computed in reduced-mass units for $n=1$–12; charge multiplies both energies by $Z^2$. The result is not asserted for scattering states, divergent expectations or impenetrable walls without their boundary term.`,
      deps: ['qm-8.6', 'mech-8.16', 'qm-2.9'], refs: ['Self-contained normalized dilation proof and exact associated-Laguerre gamma integrals; Coulomb states as in Tong §4.3'],
      links: { source: tong }, tags: ['virial theorem', 'expectation'], viz: virialWidget,
    },
    {
      num: '8.12', kind: 'Model', name: 'Hydrogen-like ions',
      statement: String.raw`A one-electron point nucleus of charge $Ze$ has the same Coulomb solutions as hydrogen after rescaling radius and energy. At the same reduced mass,
$$E_n(Z)=Z^2E_n(1),$$
$$R_{n\ell}^{(Z)}(r)=Z^{3/2}R_{n\ell}^{(1)}(Zr).$$
Its characteristic radii shrink as $1/Z$, and transition wavenumbers grow as $Z^2$. Different nuclear masses introduce an additional reduced-mass factor. These statements describe one-electron ions, rather than neutral atoms with $Z$ electrons.`,
      idea: String.raw`Change variables to $\mathbf x=Z\mathbf r$ in the Coulomb Hamiltonian of QM 8.6. Both kinetic energy and $-Z/r$ acquire $Z^2$, while the wavefunction factor $Z^{3/2}$ preserves its three-dimensional norm. The radial probability transforms as $P_Z(r)=ZP_1(Zr)$, keeping its integral one. Replacing the reduced mass also changes the length unit $a_\mu$ and multiplies energies by $\mu/m_e$ relative to fixed-electron atomic units.`,
      caption: String.raw`Raise the charge while comparing radial probability in one fixed length unit. Overlay the density after compensating both its horizontal and vertical scaling. The energy ratio and the exact mean-radius ratio provide separate checks.`,
      scope: String.raw`A single electron, point nucleus, nonrelativistic Coulomb model and fixed mass for the charge comparison. The diagram uses $Z=1$–5. Actual isotope masses, relativistic changes at larger $Z$, nuclear size and interactions with additional electrons require further terms.`,
      deps: ['qm-8.6'], refs: ['Self-contained coordinate scaling of the Coulomb operator; normalized states in Tong §4.3.2'],
      links: { source: tong }, tags: ['ions', 'scaling'], viz: ionWidget,
    },
    {
      num: '8.13', kind: 'Phenomenon', name: 'Rydberg atoms', verify: true,
      statement: String.raw`Highly excited atomic states have large spatial extent and small adjacent level spacings. In the ideal Coulomb spectrum, a circular state near principal number $n_0$ has radius scale $n_0^2a_\mu/Z$ and adjacent energy gap of order $Z^2/n_0^3$ in reduced-mass atomic units. Coherent superpositions can localize probability, dephase and partially revive.

Experiments have observed Rydberg wave-packet revivals. A stationary orbital itself has a time-independent density; a localized packet is a superposition, not a literal electron following a prescribed orbit.`,
      idea: String.raw`Build a finite normalized superposition of the circular states $\ell=m=n-1$ from QM 8.7, with chosen Gaussian populations in neighbouring $n$. Each coefficient evolves by its own exact phase $e^{-iE_nt}$. Expanding around $n_0$, the linear energy term transports the angular phase pattern with $T_{\rm cl}=2\pi n_0^3/Z^2$. The quadratic term suggests $T_{\rm rev}=4\pi n_0^4/(3Z^2)$, but higher terms spoil an exact generic revival. This is the energy-spacing correspondence of QM 1.6 applied to a coherent state. The original 1990 potassium experiment described a radial packet; the circular hydrogen packet here is a distinct authored model.`,
      caption: String.raw`Move time in classical-period units for the chosen finite packet. The angular curve is explicitly conditional on $r=n_0^2a_\mu/Z$ and $\theta=\pi/2$, normalized on that circle. Compare the full-state autocorrelation with the fidelity after removing uniform angular drift; those are different quantities.`,
      scope: String.raw`Authored ideal hydrogenic superposition with $n_0=20$–60, Gaussian width 1–3 and a disclosed cutoff at three widths. It is not a digitized experiment or a three-dimensional spatial marginal. Primary Yeazell–Mallalieu–Stroud (1990) and Yeazell–Stroud (1991) abstracts were read; full original bodies and numerical traces remain unchecked, hence the retained source flag. Decay, quantum defects, fields, collisions and experimental preparation are absent.`,
      deps: ['qm-8.7', 'qm-1.6'], refs: ['Yeazell, Mallalieu & Stroud, PRL 64,2007 (1990), abstract only, potassium radial packet', 'Yeazell & Stroud, PRA 43,5153 (1991), abstract only; independently derived finite circular Coulomb packet'],
      links: { original: 'https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.64.2007', followup: 'https://journals.aps.org/pra/abstract/10.1103/PhysRevA.43.5153' }, tags: ['wave packet', 'Rydberg atoms'], viz: packetWidget,
    },
    {
      num: '8.14', kind: 'Model', name: 'Rigid rotor and rotational spectra',
      statement: String.raw`For an ideal linear rigid rotor of fixed moment of inertia $I>0$, $H=L^2/(2I)$ has states $Y_J^m$ with $E_J=\hbar^2J(J+1)/(2I)$, $J=0,1,\ldots$, and $2J+1$ spatial states. A permanent body-axis electric dipole $\mu_0$ permits electric-dipole absorption $J\to J+1$ at
$$\omega_J=\hbar(J+1)/I.$$
The angular-frequency lines are equally spaced. For light polarized along the laboratory $z$ axis, $\Delta m=0$; other polarizations can have $\Delta m=\pm1$. A rotor with $\mu_0=0$ has no pure rotational electric-dipole absorption in this model.`,
      idea: String.raw`QM 7.5 diagonalizes $L^2$, immediately giving the levels. The interaction for $z$ polarization uses $\mu_z=\mu_0\cos\theta$. Orthogonality in $\phi$ forces $m'=m$, while the associated-Legendre recurrence leaves only angular momenta $J+1$ and $J-1$. The squared coefficient of the higher one is
$$c_+^2=\frac{(J+1)^2-m^2}{(2J+1)(2J+3)}.$$
Thus the absorption line strength for that initial sublevel is proportional to $\mu_0^2c_+^2$. Subtracting the adjacent energies gives the line spacing. Thermal populations and other sublevel weights are separate from this matrix element.`,
      caption: String.raw`Change the moment of inertia, initial angular sublevel and permanent dipole. Inspect the level spacing and the computed $z$-polarized transition strength. Setting the dipole to zero removes the absorption strength while leaving the energy levels in place.`,
      scope: String.raw`An ideal linear rotor with a fixed bond and no centrifugal distortion, vibration or spin-statistical restrictions. Energy is in $B_0=\hbar^2/(2I_0)$ and inertia in $I_0$. Only the chosen electric-dipole polarization is computed; Raman, quadrupole and magnetic transitions are different processes. Increasing the chosen inertia does not simulate a deforming molecule dynamically.`,
      deps: ['qm-7.5'], refs: ['Martin McCullagh, Chemistry Lessons §4.5.29.1, explicit dipole selection-rule derivation; normalized recurrence derived independently'],
      links: { source: 'https://mccullaghlab.github.io/physical_chemistry/quantum_mechanics/rigid_rotator_selection_rules.html' }, tags: ['rotor', 'spectroscopy'], viz: rotorWidget,
    },
    {
      num: '8.15', kind: 'Theorem', name: 'A shallow 3D well need not bind',
      statement: String.raw`For the three-dimensional spherical well $V(r)=-V_0$ for $r<a$ and zero outside, $V_0>0$, with the usual regular origin and no contact interaction, a square-integrable bound state exists exactly when
$$D=2\mu V_0a^2/\hbar^2,\qquad D>\pi^2/4.$$
At equality the first $s$-wave reaches zero energy but is not square integrable. Below it no angular channel binds. This finite threshold contrasts with an everywhere attractive nonzero integrable one-dimensional well.`,
      idea: String.raw`For $\ell=0$ and $E<0$, write the interior radial function $u=A\sin(qr/a)$ and exterior $u=B e^{-\eta(r/a-1)}$, where $q^2+\eta^2=D$ and $\eta>0$. Matching $u$ and $u'$ gives $q\cot q=-\eta$. The first branch requires $\pi/2<q<\pi$, so $D>\pi^2/4$ is necessary. Conversely $D(q)=q^2/\sin^2q$ increases continuously from $\pi^2/4$ to infinity on this branch, giving a unique first state for each larger depth. At threshold the exterior $u$ is constant and $\int|u|^2dr$ diverges. Higher angular channels add a nonnegative barrier to the same radial quadratic form, so none can have a negative eigenvalue when the $s$ channel has none. QM 8.5 supplies the hard-wall comparison; QM 3.12 explains why the full-line one-dimensional trial-state argument differs from this half-line boundary problem.`,
      caption: String.raw`Adjust depth through the binding threshold. Above it, inspect the matched normalized first radial state and its exterior probability. Both vertical axes divide radial density by the decay constant $\kappa$ to keep shallow states legible; the exterior horizontal axis is also in decay lengths. At or below threshold no normalized bound-state curve is invented. Very close to the threshold, the numerical display reports an unresolved comparison.`,
      scope: String.raw`An exact square-well theorem; the widget computes only its first $s$ state for $0\le D\le100$. Length is in $a$ and energy in $\hbar^2/(2\mu a^2)$. A stable offset solve preserves small binding energies; the thin floating comparison band is not a mathematical uncertainty in the exact theorem. No claim that this central well is a realistic nuclear potential or an empirical deuteron fit is made.`,
      deps: ['qm-8.4', 'qm-3.12'], see: ['qm-8.5'], refs: ['Tong, free Quantum Mechanics notes §4.2.2, finite spherical well; self-contained monotonic matching and angular-form comparison'],
      links: { source: tong }, tags: ['binding threshold', 'dimension'], viz: shallowWellWidget,
    },
  ],
};
