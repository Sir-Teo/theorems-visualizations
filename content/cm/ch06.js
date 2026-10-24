import * as UI from './ch06.ui.shared.js';
export default {collection:'cm',chapter:6,title:'Superconductivity',summary:String.raw`From ideal DC transport to magnetic screening and quantized fluxoid, superconductivity combines collective phase coherence with microscopic pairing. Finite slabs, rings, vortices and Josephson circuits expose different roles of fields and phase. Self-consistent finite-cutoff BCS calculations reveal the gap, isotope assumptions and electronic heat jump, while a separately labeled cuprate guide shows the limits of this elementary picture.`,items:[
{"num": "6.1", "kind": "Phenomenon", "name": "Zero resistance and the critical temperature", "deps": ["em-6.4"],
statement:String.raw`A bulk superconductor in its low-current, low-field regime has zero DC resistance below its critical temperature. Mercury's transition at ambient pressure is near4.2K. An ideal closed superconducting ring therefore maintains a steady current. For a lumped ring of inductance L and residual resistance R,
$$I(t)=I(0)e^{-Rt/L}.$$
A small positive R gives a finite decay time L/R, however slowly the current changes. A finite measurement establishes an upper bound on R; it cannot prove an exact zero from finite precision alone.`,
idea:String.raw`Kirchhoff's loop equation is L dI/dt+RI=0. Separate variables to obtain the exponential, and take R=0 directly to obtain a constant current. Drude conductivity can become very large when its collision time increases, but zero dissipation alone does not imply the equilibrium magnetic-field expulsion described by London's second equation.`,
caption:String.raw`Cool an idealized wire through its transition, then compare a zero-resistance ring with a positive residual-resistance alternative. Vary the elapsed time and read the actual fractional current loss.`,
scope:String.raw`The piecewise wire resistance is an authored idealization with Tc=4.15K and a constant normal-state resistance. It is not a digitization of mercury measurements. The lumped ring has constant inductance, no applied emf, no phase slips and no changing external flux. Critical current, field, finite-frequency dissipation and vortex motion are outside this model.`,
refs:["Arovas, UCSD Physics239 (2023), C11 §11.1, historical opening and zero-DC-resistance phenomenology"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C11.pdf"},viz:UI.resistance},
{"num": "6.2", "kind": "Model", "name": "London equations and the penetration depth", "deps": ["em-8.15", "em-10.3"],
statement:String.raw`In a local isotropic London model with uniform superconducting electron density ns,
$$\partial_t\mathbf j_s=\frac{n_se^2}{m_e}\mathbf E,$$
$$\nabla\times\mathbf j_s=-\frac{\mathbf B}{\mu_0\lambda_L^2},$$
$$\lambda_L^2=\frac{m_e}{\mu_0n_se^2}.$$
For static fields, Maxwell's equations give ∇²B=B/λL². A slab of thickness d with the same parallel field B0 on both faces has
$$\frac{B(x)}{B_0}=\frac{\cosh(x/\lambda_L)}{\cosh[d/(2\lambda_L)]}.$$
A thick slab excludes the field from its interior; a thin slab can be penetrated substantially.`,
idea:String.raw`Take the curl of ∇×B=μ0js and use ∇·B=0 together with the second London equation. Solve the resulting second-order equation with B(±d/2)=B0. The first London equation describes inertial acceleration of the superfluid; by itself it only preserves an integration constant and does not select the Meissner equilibrium. That equilibrium condition is additional physical content.`,
caption:String.raw`Change slab thickness and superconducting electron density. Inspect the exact finite-slab field and its screening-current derivative, including the field at the center and the spatial mean.`,
scope:String.raw`A planar slab in a parallel weak field, with no vortices or normal-fluid DC current. The density ns counts electrons; using pair density ns/2, pair charge2e and pair mass2me gives the same λL. The local continuum model neglects nonlocal response and surface suppression of the order parameter.`,
refs:["Arovas C11 §11.3, printed8–9; SI conversion and slab boundary solution supplied here"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C11.pdf"},viz:UI.london},
{"num": "6.3", "kind": "Phenomenon", "name": "Flux quantization in units of h/2e", "deps": ["cm-6.2", "qm-6.7"],
statement:String.raw`Single-valuedness of a nonvanishing pair condensate makes its phase winding an integer. With the loop orientation chosen to label that winding by n, London theory gives the fluxoid condition
$$\Phi+L_k I=n\Phi_0,\qquad \Phi_0=\frac{h}{2e}.$$
In a lumped ring with geometric inductance Lg, Φ=Φext+LgI. Hence I=(nΦ0−Φext)/(Lg+Lk). The magnetic flux Φ itself need not be an integer multiple of Φ0 when the kinetic term is appreciable.`,
idea:String.raw`Write the gauge-covariant pair momentum as m*v=ℏ∇θ−qA and integrate around the ring, using ∮∇θ·dl=2π times an integer. The current term becomes the kinetic inductance contribution. Add the geometric self flux, then minimize (nΦ0−Φext)²/[2(Lg+Lk)] over integers for the ideal equilibrium branch. Adjacent branches are degenerate at half-integer external flux.`,
caption:String.raw`Thread a ring with external flux and choose its winding sector. Vary the kinetic share of its inductance, then compare the actual magnetic flux with the kinetic contribution and the integer fluxoid.`,
scope:String.raw`A uniform narrow ring with a fixed, nonzero condensate amplitude and constant positive total inductance. The current is assumed below the depairing threshold. Winding is held fixed unless deliberately changed; the displayed lowest-energy winding is a comparison, not a simulation of phase-slip kinetics. Bare flux quantization is recovered when the kinetic contribution is negligible.`,
refs:["Arovas C11 §11.3, printed9; QM6.7 loop phase; lumped fluxoid derivation supplied here"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C11.pdf"},viz:UI.fluxoid},
{"num": "6.4", "kind": "Model", "name": "Ginzburg–Landau theory", "deps": ["cm-6.2", "thermo-11.15"],
statement:String.raw`Near a continuous superconducting transition, a one-component Ginzburg–Landau model postulates a complex pair field ψ with free-energy density f.
Write f=fpot+fgrad+fB, where
$$f_{\rm pot}=\alpha|\psi|^2+\tfrac12\beta|\psi|^4,$$
$$f_{\rm grad}=\frac{|(-i\hbar\nabla-q\mathbf A)\psi|^2}{2m^*},$$
$$f_B=\frac{B^2}{2\mu_0}.$$
Here β>0, q=−2e and α=a0(T−Tc), with a0>0. In zero field the uniform minimum is ψ=0 for α≥0, while |ψ0|²=−α/β for α<0. The ordered phase has
$$\xi^2=\frac{\hbar^2}{2m^*|\alpha|},$$
$$\lambda^2=\frac{m^*}{\mu_0q^2|\psi_0|^2}.$$
Its condensation free energy is −α²/(2β).`,
idea:String.raw`Minimize the quartic potential with respect to |ψ|². Balancing the gradient term against |α||ψ|² identifies ξ, and variation with respect to A gives the London current and λ. These steps supply the Landau argument locally. The potential is independent of a uniform phase; only gauge-invariant phase differences and gradients enter physical observables.`,
caption:String.raw`Move temperature through the transition and inspect the radial free-energy curve alongside the circle of complex order-parameter minima. Change the phase along that circle and compare the computed amplitude and length scales.`,
scope:String.raw`An isotropic one-component mean-field expansion near Tc, with no applied field in the displayed uniform minima. The scene sets α=T/Tc−1 and β=1; lengths use chosen reference scales. At Tc the mean-field lengths diverge. Above Tc no superconducting penetration length is assigned. Fluctuations, multiband structure and microscopic pairing are not derived.`,
refs:["Arovas C11 §§11.4.1–11.4.3, printed12–14"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C11.pdf"},viz:UI.landau},
{"num": "6.5", "kind": "Phenomenon", "name": "Type I and type II superconductors", "deps": ["cm-6.4"],
statement:String.raw`For a clean isotropic one-component GL superconductor, κ=λ/ξ distinguishes typeI (κ<1/√2) from typeII (κ>1/√2). The equilibrium normal–superconducting interface energy changes sign at that boundary. In SI field scales,
$$B_c=\frac{\Phi_0}{2\sqrt2\pi\lambda\xi},$$
$$B_{c2}=\frac{\Phi_0}{2\pi\xi^2},$$
so Bc2/Bc=√2κ. A bulk typeII material supports a vortex mixed state between lower and upper critical applied fields. A typeI material instead has a first-order bulk field transition at its thermodynamic critical field.`,
idea:String.raw`Equate the GL condensation energy to Bc²/(2μ0). At the instability of the normal state, linearize the GL equation; its lowest magnetic oscillator eigenvalue is ℏ|q|B/(2m*). Balancing this against |α| gives Bc2. The two scales cross at κ=1/√2. The interface sign follows from the equilibrium GL boundary problem; the scene computes field scales rather than inventing numerical interface energies.`,
caption:String.raw`Change κ and the coherence length. Compare the thermodynamic and upper-instability field scales as they cross at the type boundary. At large κ, add a clearly labeled leading-log London estimate of the lower critical field.`,
scope:String.raw`Near Tc in bulk isotropic GL theory, ignoring demagnetizing geometry, pinning and surface barriers. Bc means μ0Hc and Bc2 means μ0Hc2, not a universal measured interior induction. The lower-field estimate is shown only for κ≥5 and retains only lnκ; an order-one core contribution is omitted. It is not extrapolated to κ=1/√2.`,
refs:["Arovas C11 §11.5.1, printed22–23; §§11.5.4–11.5.5, printed29–32"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C11.pdf"},viz:UI.types},
{"num": "6.6", "kind": "Phenomenon", "name": "Abrikosov vortex lattice", "deps": ["cm-6.5", "cm-6.3"],
statement:String.raw`A singly quantized vortex carries flux Φ0. A periodic array with mean induction B therefore has area per vortex A=Φ0/B. For a triangular lattice with nearest-neighbor spacing a,
$$\frac{\sqrt3}{2}a^2=\frac{\Phi_0}{B}.$$
Near the upper critical field, the isotropic GL lattice energy depends on βA=⟨|ψ|⁴⟩/⟨|ψ|²⟩². The triangular and square arrays give approximately1.1596 and1.1803, respectively; the triangular choice has lower energy in that comparison.`,
idea:String.raw`Integrate the magnetic induction over one vortex cell to obtain its flux and spacing. In the lowest-Landau-level GL expansion, spatial averaging leaves the quartic ratio βA in the energy denominator. The scene evaluates the reciprocal-lattice Gaussian sum for both arrays, rather than inserting the two constants. Its field map separately solves a periodic London model with a Gaussian core filter.`,
caption:String.raw`Raise the mean induction and compare triangular and square vortex cells. Watch the computed spacing shrink, inspect a periodic field cross-section, and compare the converged lattice sums and flux per cell.`,
scope:String.raw`An ideal ordered array of straight singly quantized vortices in a clean isotropic typeII material. The visual array is prescribed, not a simulation of vortex entry or self-organization. The London field uses a chosen penetration depth and Gaussian core regularization; it is not a full GL core solution. The two-lattice energy comparison applies near Hc2 and is distinct from that London field approximation.`,
refs:["Arovas C11 §11.5.6, printed32–38; reciprocal sum and regularized London field supplied here"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C11.pdf"},viz:UI.vortices},
{"num": "6.7", "kind": "Model", "name": "Cooper pairs", "deps": ["cm-1.1", "cm-3.5"],
statement:String.raw`In the continuum Cooper problem, an inert filled Fermi sea blocks states below EF. Let two added opposite-spin electrons interact attractively with constant matrix element −V within 0<ξ<Ω, where ξ is energy above EF and N0 is the single-spin density of states. With g=N0V>0, their binding energy W below2EF satisfies
$$1=\frac g2\log\left(1+\frac{2\Omega}{W}\right),$$
$$W=\frac{2\Omega}{e^{2/g}-1}.$$
Thus any positive g binds in this ideal continuum model. At weak coupling W≈2Ωe^(−2/g).`,
idea:String.raw`The pair equation gives an amplitude proportional to1/(2ξ+W). Sum over unblocked states with constant N0, obtaining g∫₀^Ωdξ/(2ξ+W)=1. The integral diverges logarithmically as W→0+, so every positive g has a positive solution. Normalize the squared amplitude over that same window. This is a two-electron instability calculation, not the self-consistent many-electron BCS state.`,
caption:String.raw`Vary the attraction and compare exact binding with its weak-coupling exponential. Inspect the actual pair-energy probability per logarithmic energy interval, or turn the attraction off and lose the bound state.`,
scope:String.raw`Zero total momentum, a singlet channel, a fixed continuum Fermi sea and a constant density of available pair states. Finite-size level spacing can invalidate the arbitrary-weak-attraction conclusion. Ω is an imposed energy window, not a phonon derivation. The logarithmic probability plot includes its energy Jacobian.`,
refs:["Arovas C12 §12.2, printed3–6; per-spin coupling convention stated here"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C12.pdf"},viz:UI.pairs},
{"num": "6.8", "kind": "Model", "name": "BCS theory and the energy gap", "deps": ["cm-6.7"],
statement:String.raw`In a constant-density, isotropic s-wave BCS mean-field model with attraction g=N0V>0 within |ξ|<Ω, the quasiparticle energy is Eξ=√(ξ²+Δ²). The positive equilibrium gap below Tc solves
$$\frac1g=\int_0^\Omega\frac{\tanh[E_\xi/(2k_BT)]}{E_\xi}\,d\xi.$$
At zero temperature Δ0=Ω/sinh(1/g). At Tc the positive branch reaches zero. In the weak-coupling limit,
$$k_BT_c\simeq\frac{2e^\gamma}{\pi}\Omega e^{-1/g},$$
$$\frac{2\Delta_0}{k_BT_c}\to2\pi e^{-\gamma}\simeq3.53,$$
where γ is Euler's constant.`,
idea:String.raw`Mean-field decoupling gives a two-by-two particle–hole Hamiltonian with diagonal entries ±ξ and off-diagonal pair amplitude Δ. Diagonalize it to obtain ±Eξ. Requiring that the thermal anomalous average reproduce Δ yields the integral equation. The scene solves it and the Δ=0 critical equation numerically with the same finite cutoff. Δ=0 remains a formal normal solution below Tc, but the positive branch lowers the free energy.`,
caption:String.raw`Change coupling and temperature, solve the gap equation, and inspect the actual quasiparticle dispersion or a broadened density of states. Compare the calculated finite-cutoff gap ratio with its weak-coupling limit.`,
scope:String.raw`A uniform s-wave mean-field state with constant single-spin N0 and a prescribed pairing cutoff. Energies use Ω=1 and kB=1. The optional Dynes density adds a positive phenomenological broadening; it is not an experimental tunneling dataset. The ratio3.53 is asymptotic, and deviations at larger displayed g are retained.`,
refs:["Arovas C12 §§12.4–12.6, printed9–15; §12.9, printed18–19"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C12.pdf"},viz:UI.gap},
{"num": "6.9", "kind": "Phenomenon", "name": "Isotope effect", "deps": ["cm-6.8", "thermo-9.13"],
statement:String.raw`If isotope substitution changes only the ionic mass M while force constants, electronic density of states and effective coupling g remain fixed, harmonic phonon frequencies and their energy cutoff obey Ω∝M^(−1/2). The BCS critical temperature then has
$$T_c\propto M^{-1/2},$$
$$\alpha_{\rm iso}=-\frac{d\log T_c}{d\log M}=\frac12.$$
If the effective coupling also changes with mass, that exponent need not be one-half. An isotope shift is evidence about lattice participation, not by itself a unique proof of a pairing mechanism.`,
idea:String.raw`The oscillator equation Mω²=K gives ω∝M^(−1/2) for fixed K. Scaling every energy in the finite-cutoff gap equation by Ω makes kBTc/Ω a function of g alone. Fixed g therefore gives the half-power exactly in this model. A second mode sets g(M)=g0(M/M0)^b and differentiates the same critical equation, showing precisely which assumption changes the exponent.`,
caption:String.raw`Vary isotope mass and compare the conditional half-power curve with the recalculated critical temperature. Allow a small mass dependence of the coupling and read its actual logarithmic isotope exponent.`,
scope:String.raw`A parameter study with reference mass200 atomic mass units and authored reference coupling. Curves are calculated model values, not measured mercury isotope temperatures. Force constants and other electronic parameters are held fixed except for the optional explicitly chosen coupling slope. The frequency scaling follows directly from a fixed-force-constant harmonic oscillator.`,
refs:["Arovas C12 §12.9.1, printed20; local harmonic-frequency and finite-cutoff derivative arguments"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C12.pdf"},viz:UI.isotopes},
{"num": "6.10", "kind": "Phenomenon", "name": "Josephson effects", "deps": ["cm-6.3", "cm-6.4"],
statement:String.raw`For an ideal weak Josephson junction, choose voltage and phase-difference orientations so that
$$I=I_c\sin\phi,\qquad \frac{d\phi}{dt}=\frac{2e}{\hbar}V.$$
At V=0 a fixed phase can support a DC supercurrent. At constant V the phase advances linearly and the supercurrent oscillates with signed frequency fJ=2eV/h. The conservative junction energy is UJ=−EJcosφ, with EJ=ℏIc/(2e).`,
idea:String.raw`Pair tunneling couples the two condensates through an energy −EJcosφ. Differentiating that energy with respect to phase gives I=(2e/ℏ)∂UJ/∂φ. A voltage difference is an electrochemical energy difference2eV per pair, yielding the phase rate. Integrate the rate for constant V and substitute into the current–phase relation.`,
caption:String.raw`Set the initial phase and a signed fixed voltage. Move through time, inspect the actual phase phasor and current trace, and compare the frequency and Josephson energy.`,
scope:String.raw`A sinusoidal current–phase relation in a voltage-biased weak junction, with positive fixed Ic. The scene omits quasiparticle current, capacitance, dissipation and the electromagnetic environment. It does not model current-biased switching or hysteresis. Phase and voltage signs depend on the declared orientation.`,
refs:["Arovas C13 §13.3.1, printed21–22; sign orientation chosen explicitly here"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C13.pdf"},viz:UI.josephson},
{"num": "6.11", "kind": "Invention", "name": "SQUID magnetometer", "deps": ["cm-6.10"],
statement:String.raw`A DC SQUID places two Josephson junctions in a superconducting loop. With negligible loop self flux and kinetic phase drop, their phase difference is2πΦext/Φ0 modulo2π. If their critical currents are I1 and I2, maximize the sum over a common phase.
Write A=I1²+I2² and f=Φext/Φ0. Then
$$I_{\max}^2=A+2I_1I_2\cos(2\pi f).$$
Equal junctions give Imax=2Ic|cos(πΦext/Φ0)|. The critical-current envelope is periodic in one flux quantum. Unequal junctions retain a nonzero minimum.`,
idea:String.raw`Write the two currents as I1sin(φ−πf) and I2sin(φ+πf), where f=Φext/Φ0. They are the imaginary projections of two phasors. Their sum has maximum magnitude equal to the length of the vector sum, giving the envelope. For a uniform field through effective loop area Aeff, a field change Φ0/Aeff advances one envelope period.`,
caption:String.raw`Thread flux through two unequal junctions and rotate their common phase. Compare their vector sum and actual current with the maximum-current envelope; change loop area to convert flux period into a field period.`,
scope:String.raw`Two sinusoidal junctions and an ideal imposed external flux. Loop self-inductance and circulating-current feedback are neglected. A chosen effective area converts uniform applied field into flux; that area is not determined by the model. This is a critical-current modulation model, not a calibrated voltage-readout instrument or a prediction of its noise floor.`,
refs:["Arovas C13 §13.3.3, printed23; Orlando MIT6.763 Lecture12, actual PDFpage2"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C13.pdf"},viz:UI.squid},
{"num": "6.12", "kind": "Phenomenon", "name": "High-temperature cuprate superconductors", "deps": ["cm-6.8", "cm-5.5"],
statement:String.raw`Hole-doped cuprates have copper–oxygen planes, a strongly correlated antiferromagnetic insulating parent, and a superconducting region at intermediate doping. The superconducting order has predominantly d_(x²−y²) symmetry: its sign reverses under a quarter turn and its gap has nodes. On an illustrative circular Fermi contour,
$$\Delta(\theta)=\Delta_d\cos(2\theta).$$
A superconducting dome is a phenomenological phase-diagram feature; the elementary weak-coupling s-wave model does not predict its material-specific boundaries or transition scale.`,
idea:String.raw`Doping changes the carrier concentration and competing correlations of the copper–oxygen planes. Repulsive microscopic interactions can support a sign-changing paired state after collective renormalization; this does not follow from the isolated Hubbard dimer alone. The scene uses an authored dome and antiferromagnetic guide to organize regimes, while the independent angular form factor displays the d-wave nodes and sign reversal exactly.`,
caption:String.raw`Move through doping and temperature on a clearly labeled schematic phase guide. Compare a positive s-wave angular gap with the sign-changing d-wave form, and locate its four nodal directions.`,
scope:String.raw`The dome is Tc=Tmax·max[0,1−((p−0.16)/0.11)²], with a separate illustrative antiferromagnetic guide. It is neither a fitted material dataset nor a microscopic solution. The circular angular contour is schematic. Pseudogap, charge order and other competing phases are omitted, rather than assigned invented boundaries. Tmax is a chosen scale.`,
refs:["Keimer et al., arXiv1409.4673, printed1–7 and Figure2/4 captions, printed17/19"],links:{source:"https://arxiv.org/abs/1409.4673"},viz:UI.cuprates},
{"num": "6.13", "kind": "Paper", "name": "The resistance of pure mercury at helium temperatures", "deps": ["em-6.5", "em-6.4"], "paper": {"authors": "H. Kamerlingh Onnes", "year": 1911, "title": "Further experiments with liquid helium. C. On the change of electric resistance of pure metals at very low temperatures etc. IV. The resistance of pure mercury at helium temperatures", "venue": "Proceedings of the Section of Sciences, KNAW 13 (II): 1274–1276", "url": "https://dwc.knaw.nl/DL/publications/PU00013358.pdf"}, "introduces": ["cm-6.1"],
statement:String.raw`Onnes's1911 mercury work identified an abrupt loss of detectable electrical resistance near the boiling temperature of liquid helium. The discovery established a new low-temperature state and opened the study of superconductivity. Its operational logic is a resistance measurement: pass a known current I and measure the voltage drop. If |V| is below a voltage resolution Vmin,
$$R<\frac{V_{\min}}{|I|}.$$
A later persistent-current protocol gives a complementary bound. If a ring of known inductance L loses less than a fraction ε over time tobs, then
$$R< -\frac{L}{t_{\rm obs}}\log(1-\varepsilon).$$`,
idea:String.raw`The four-terminal voltage test uses V=IR and removes ideal lead-voltage contributions from the sensed sample interval. A nondetection yields an upper bound, rather than a measured exact zero. For the ring, insert I(t)/I(0)>1−ε into the exponential decay law and solve for R. The scene compares these actual inequalities using reader-chosen instrument settings; it illustrates measurement bounds rather than the historical apparatus.`,
caption:String.raw`Change a voltage floor, a test current and a persistent-current observation time. Compare the two calculated resistance bounds, then inspect which positive resistances would remain undetected by each protocol.`,
scope:String.raw`Reader-chosen parameters illustrate finite measurement sensitivity. The quantitative example uses an ideal voltage test and a constant-inductance ring; its curves are calculated bounds, not historical measurements. Contact artifacts, thermoelectric offsets, instrumental systematics and changing inductance are excluded. The two protocols need not have the same sensitivity.`,
refs:["Arovas C11 §11.1, opening historical paragraph; resistance-bound derivations supplied here"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C11.pdf"},viz:UI.onnes},
{"num": "6.14", "kind": "Paper", "name": "Theory of Superconductivity", "deps": ["cm-6.7", "cm-6.9", "cm-3.5", "cm-6.13"], "paper": {"authors": "J. Bardeen, L. N. Cooper and J. R. Schrieffer", "year": 1957, "title": "Theory of Superconductivity", "venue": "Physical Review 108 (5): 1175–1204", "doi": "10.1103/PhysRev.108.1175"}, "introduces": ["cm-6.8"],
statement:String.raw`Bardeen, Cooper and Schrieffer's1957 theory organized a superconducting many-electron state as coherent pairs of time-reversed electron states. In the reduced isotropic weak-coupling mean-field model, a self-consistent gap opens and vanishes continuously at Tc. The quasiparticle entropy determines the electronic heat capacity. Define the normalized jump
$$J=\frac{C_s(T_c^-)-C_n(T_c^+)}{C_n(T_c^+)}.$$
In the weak-coupling, broad-band limit,
$$J\to\frac{12}{7\zeta(3)}\simeq1.43.$$
Thus the total ratio Cs(Tc−)/Cn(Tc+) approaches2.43. At low temperature a fully gapped s-wave state has exponentially suppressed electronic excitations.`,
idea:String.raw`A product of empty/pair-occupied amplitudes yields a tractable many-electron variational state. Diagonalizing its mean-field Hamiltonian gives fermionic quasiparticles with E=√(ξ²+Δ²), and self-consistency fixes Δ(T). Their entropy is −4N0kB∫[f logf+(1−f)log(1−f)]dξ over the positive pairing window. Differentiate this entropy, including the implicit temperature derivative of Δ²; omitting that derivative misses the heat jump. The local model computes this derivative from the gap equation.`,
caption:String.raw`Solve the finite-cutoff BCS model as temperature changes. Switch between the gap and electronic heat capacity, and compare the computed transition ratios with their weak-coupling limits.`,
scope:String.raw`A calculated constant-density s-wave model with Ω=kB=N0=1, not a fit to measured material gaps or heat capacities. The thermal quantities include the pairing window0<ξ<Ω; other normal bands and phonon heat are excluded. Finite-cutoff corrections are retained. The finite-cutoff derivation uses the reduced mean-field Hamiltonian. Exact Tc uses the normal branch while the separate jump readout evaluates the limit from below.`,
refs:["Arovas C12 §§12.4–12.6, printed9–15; §12.9, printed18–22"],links:{source:"https://courses.physics.ucsd.edu/2023/Spring/physics239/LECTURES/C12.pdf"},viz:UI.bcsPaper},
]};
