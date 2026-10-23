import * as U from './ch06.ui.shared.js';
const TEAL6='https://web.mit.edu/8.02t/www/802TEAL3D/visualizations/coursenotes/modules/guide06.pdf';
const TEAL7='https://web.mit.edu/8.02t/www/802TEAL3D/visualizations/coursenotes/modules/guide07.pdf';
const HAUS7='https://ocw.mit.edu/courses/res-6-001-electromagnetic-fields-and-energy-spring-2008/dd75cf8d0d3d03d6a6a986362e9870ab_07.pdf';
const HAUS14='https://ocw.mit.edu/courses/res-6-001-electromagnetic-fields-and-energy-spring-2008/5377fe7e45e4c039e178203cc78d6657_14.pdf';
const DOYLE='https://math.dartmouth.edu/~doyle/docs/walks/walks.pdf';
const CSERTI='https://arxiv.org/abs/cond-mat/9909120';
export default {
  collection:'em',chapter:6,title:'Electric current',
  summary:'Current carries charge through matter, while fields communicate changes through a circuit. Local conservation links density to flux; a constitutive law closes the description. Resistance turns electrical work into heat, and a finite network makes the connections between conservation, minimum dissipation and random walks precise.',
  items:[
    {num:'6.1',kind:'Definition',name:'Current and current density',
      statement:String.raw`For an oriented stationary surface $S$, electric current is the signed rate at which charge crosses it:
$$I=\frac{dQ_{cross}}{dt}=\int_S\mathbf J\cdot\mathbf n\,dA.$$
For mobile species with number density $n_s$, charge $q_s$ and local mean velocity $\mathbf v_s$, $\mathbf J=\sum_s n_s q_s\mathbf v_s$. Current density has units A/m². Negative carriers moving one way contribute conventional current the other way; a neutral material can carry nonzero current.`,
      idea:String.raw`In a short time $dt$, the carriers crossing a patch occupy a signed swept volume $(\mathbf v\cdot\mathbf n)dA\,dt$. Multiplying by charge density and summing species gives the flux formula. Equal current through two cuts requires steady flow with no current leaving the intervening walls; it is not part of the definition for arbitrary unsteady currents.`,
      caption:'Narrow a channel, move the cross-section and reverse the signed current. Streamlines bend while the integrated current stays fixed.',
      scope:'A prescribed smooth divergence-free two-dimensional flow with 1 m out-of-plane depth. The channel uses a streamfunction to satisfy the wall condition exactly. Its current field need not be curl-free, so this is not an Ohmic solution for a shaped homogeneous wire.',
      deps:['em-1.7'],refs:['MIT8.02 TEAL guide06 §6.1; Haus–Melcher §7.1, Eqs4–7','Syllabus guides: Griffiths §5.1; Purcell ch.4 (book bodies not consulted)'],links:{source:TEAL6,conduction:HAUS7},viz:U.current},
    {num:'6.2',kind:'Theorem',name:'Continuity equation',
      statement:String.raw`For a fixed region $V$ with outward normal, local conservation of charge gives
$$\frac{d}{dt}\int_V\rho\,dV=-\oint_{\partial V}\mathbf J\cdot\mathbf n\,dA.$$
If $\rho$ is differentiable in time, $\mathbf J$ is continuously differentiable in space and differentiation under the integral is justified, the divergence theorem gives $\partial_t\rho+\nabla\cdot\mathbf J=0$. Conversely this differential equation implies the integral law on regular fixed regions.`,
      idea:String.raw`Charge can leave the volume only by crossing its boundary. Replace the boundary flux by the volume integral of divJ. Since the resulting integral vanishes for every sufficiently small region, its continuous integrand vanishes pointwise. A moving control volume instead uses flux relative to the boundary velocity; it cannot use the fixed-volume formula unchanged.`,
      caption:'Drag a fixed control box across a translating charge pattern. Compare its charge derivative with the four signed outward fluxes.',
      scope:'The smooth positive pattern is periodic in both directions and translates at a constant editable velocity. Volume charge and face fluxes are analytically integrated per 1 m depth. Moving the control changes which fixed box is inspected; the displayed derivative holds that box still. Singular sheets and point charges require a weak formulation.',
      deps:['em-6.1','em-1.2','pma-10.51','vcalc-3.6'],refs:['Haus–Melcher §7.7, Eq1; explicit translating-density example derived here','Syllabus guides: Griffiths §5.1; Purcell ch.4 (book bodies not consulted)'],links:{source:HAUS7},viz:U.continuity},
    {num:'6.3',kind:'Law',name:'Ohm’s law',
      statement:String.raw`In a local, isotropic Ohmic medium at a fixed material state, $\mathbf J=\sigma\mathbf E$, where $\sigma>0$ is conductivity in S/m. This is a constitutive law, not a consequence of charge conservation alone. It describes a linear response regime; anisotropic media require a conductivity tensor, and nonlinear or frequency-dependent response requires a different closure.`,
      idea:String.raw`If collisions give each carrier a mean velocity proportional to the local field, summing its charge flux gives a proportional current. The coefficient depends on carrier densities and mobilities. Keeping those properties fixed is what makes the graph a straight line; a nonlinear material may share its small-field slope while departing from it at larger fields.`,
      caption:'Sweep a signed electric field and compare constant conductivity with a passive cubic toy having the same zero-field slope.',
      scope:'Scalar instantaneous response with fixed temperature. The nonlinear curve is explicitly prescribed, not measured material data or a semiconductor-junction model. Its differential slope dJ/dE differs from J/E away from zero field.',
      deps:['em-6.1'],refs:['Haus–Melcher §7.1, Eq7 and constitutive-law limitations','Syllabus guides: Griffiths §7.1; Purcell ch.4 (book bodies not consulted)'],links:{source:HAUS7},viz:U.ohm},
    {num:'6.4',kind:'Model',name:'Drude model of conduction',
      statement:String.raw`In a classical model with independent memoryless collisions of rate $1/\tau$, each collision resets velocity to an isotropic distribution with zero mean. Between collisions, $m\dot{\mathbf v}=q\mathbf E$. For a uniform constant field, the ensemble mean obeys
$$\frac{d\langle\mathbf v\rangle}{dt}=\frac{q\mathbf E}{m}-\frac{\langle\mathbf v\rangle}{\tau}.$$
Starting from zero mean, $\langle\mathbf v\rangle=(q\tau/m)\mathbf E(1-e^{-t/\tau})$. Thus the steady conductivity is $\sigma=nq^2\tau/m$.`,
      idea:String.raw`Over dt, acceleration adds qE dt/m to every velocity. A fraction dt/τ of particles lose their previous mean velocity in collisions and receive a zero-mean reset. Dividing the expected increment by dt gives the linear relaxation equation. Multiplying its steady solution by nq makes conductivity positive for either carrier sign. The mean equation resembles linear drag, but its microscopic assumption here is a random reset process.`,
      caption:'Scrub fixed seeded collision histories and compare the finite sample mean with the exact ensemble transient. Change the sample size and acceleration scale.',
      scope:'Two-dimensional classical particles, unit thermal reset speed and dimensionless time t/τ. Ballistic motion and exponentially distributed event times are evaluated directly. This model does not represent Fermi statistics, quantum bands or a material-specific scattering law. Drift is small compared with thermal speed only when the chosen dimensionless forcing is small.',
      deps:['em-6.3','mech-1.12'],refs:['MIT8.02 TEAL guide06 §6.1, collision/drift argument; memoryless transient model derived here','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:TEAL6},viz:U.drude},
    {num:'6.5',kind:'Definition',name:'Resistance and resistivity',
      statement:String.raw`For a linear two-terminal element, resistance $R$ is the constant satisfying $\Delta V=IR$, in ohms. In a homogeneous isotropic Ohmic material, resistivity is $\rho_{res}=1/\sigma$, in Ω m. A straight uniform conductor of length L and cross-sectional area A, with uniform axial field and current, has $R=\rho_{res}L/A$. The material property and the geometric device property are different quantities.`,
      idea:String.raw`Integrate the uniform field along the wire to obtain ΔV=EL and integrate the uniform current density across it to obtain I=JA. Substitute J=σE and divide. The geometry assumptions matter: a strongly tapered conductor generally needs a field solution rather than an unqualified application of the uniform-wire formula.`,
      caption:'Change length, area and resistivity independently. Read the resulting resistance while the material and geometry contributions remain explicit.',
      scope:'Fixed temperature, uniform cross-section and an ideal uniform axial field. The transverse size is enlarged in the drawing. Length and area are independent controls, so this is not a fixed-volume stretching experiment. For a nonlinear element, V/I and differential resistance dV/dI need not coincide.',
      deps:['em-6.3'],refs:['MIT8.02 TEAL guide06 §6.2 and §6.4 resistance/resistivity formulas','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:TEAL6},viz:U.resistance},
    {num:'6.6',kind:'Law',name:'Joule heating',
      statement:String.raw`The rate of electrical work on a continuum current is $p=\mathbf J\cdot\mathbf E$ per volume. In a scalar Ohmic conductor, $p=\sigma E^2=J^2/\sigma\ge0$. A passive resistor with the current entering its higher-potential terminal dissipates
$$P=I\Delta V=I^2R=(\Delta V)^2/R.$$
Power is energy per time; the heat generated over an interval is $\int P\,dt$.`,
      idea:String.raw`A charge dq crossing a potential drop loses electrical potential energy dq ΔV. Divide by dt to obtain IΔV, then apply Ohm's law. To predict temperature, add a thermal model: for heat capacity Cth and thermal conductance H, Cth dΔT/dt=P−HΔT. Electrical heat divides between stored thermal energy and heat released to the environment.`,
      caption:'Choose voltage or current drive and compare input energy, stored heat and cooling loss as a resistor warms.',
      scope:'Constant resistance, constant drive, uniform temperature and linear Newton cooling from an initially equilibrated body. Heat capacity is 10 J/K. The thermal extension is a declared lumped model; it is not computed from the Drude sample and does not include temperature-dependent resistance or phase changes.',
      deps:['em-6.5'],refs:['MIT8.02 TEAL guide06 §6.3, Eqs6.3.1–2; lumped cooling extension derived here','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:TEAL6},viz:U.joule},
    {num:'6.7',kind:'Definition',name:'Electromotive force',
      statement:String.raw`For a stationary DC circuit, a source's electromotive force $\mathcal E$ is the work it supplies per unit charge around the circuit through nonelectrostatic driving forces. It is measured in volts, despite its name. A source modeled by ideal emf $\mathcal E$ in series with internal resistance r, driving a load R, has
$$I=\frac{\mathcal E}{R+r},$$
$$V_{term}=\mathcal E-Ir.$$
The terminal voltage equals the emf only when the internal drop vanishes.`,
      idea:String.raw`The electrostatic field is conservative, so its work around the stationary DC loop is zero. A chemical or other source does work on charge to maintain the potential rise. The source work rate Iℰ balances I²r inside the source plus I²R in the load. Summing circuit potential changes gives ℰ−Ir−IR=0.`,
      caption:'Follow the potential around an idealized source, its internal resistance and a load. Compare the power supplied and the two dissipation terms.',
      scope:'A stationary DC source model with lumped positive load resistance. Induced emf in time-varying magnetic fields and motional emf need the generalized force description. The ideal emf symbol represents a circuit-level rise, not a physical discontinuity in electrostatic potential within a battery.',
      deps:['em-6.1','em-2.3'],refs:['MIT8.02 TEAL guide07 §7.2, Eqs7.2.1–8','Syllabus guides: Griffiths §7.1; Purcell ch.4 (book bodies not consulted)'],links:{source:TEAL7},viz:U.emf},
    {num:'6.8',kind:'Law',name:'Kirchhoff’s circuit laws',
      statement:String.raw`In a lumped steady circuit, each node satisfies signed current balance, and a loop of consistently defined potential differences sums to zero. For a finite connected network with positive resistances, choose an orientation for each edge e=(u,v):
$$I_e=(V_u-V_v)/R_e.$$
Prescribed node injections summing to zero then determine potentials up to a common constant and determine all edge currents uniquely.`,
      idea:String.raw`Charge conservation forbids accumulation at a steady node. Electrostatic potential differences telescope around a closed path. Substituting Ohm's law into node balance yields the weighted graph Laplacian. After grounding one node, its quadratic form is a sum of positive edge conductances times squared potential differences; connectivity makes it positive definite, giving uniqueness.`,
      caption:'Edit a connected resistor network as triples. Inspect signed branch currents, node balances, grounded potentials and the power identity.',
      scope:'Finite undirected linear resistor networks, parallel edges allowed. The input uses consecutive node IDs and positive bounded resistances; an ideal current source connects the two displayed terminals. Arbitrary batteries, inductive flux, distributed propagation and transient node charge are not modeled. The numerical solve is accepted only after an explicitly recomputed residual passes.',
      deps:['em-6.2','em-2.2','em-6.7'],refs:['MIT8.02 TEAL guide07 §7.4; Doyle–Snell §1.3.5 energy identity','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:TEAL7,networks:DOYLE},viz:U.kirchhoff},
    {num:'6.9',kind:'Theorem',name:'Steady currents minimize dissipation',
      statement:String.raw`For a finite connected network with $R_e>0$ and fixed external current injections, let i be the Ohmic Kirchhoff flow. Among all oriented edge flows j with those same node injections, i uniquely minimizes the dissipated power $P(j)=\sum_e R_ej_e^2$. Writing $j=i+h$, where h has zero divergence at every node, gives
$$P(i+h)=P(i)+\sum_eR_eh_e^2.$$
Each unoriented resistor is counted once in these sums.`,
      idea:String.raw`Expand the square. Since Rₑiₑ=Vᵤ−Vᵥ, the cross term is twice the sum of potential times the divergence of h, which vanishes. The remaining difference is a positive sum of squares and is zero only when h=0. For a unit injection from a to b, the minimum power numerically equals the effective resistance in SI units with the 1 A factor understood.`,
      caption:'Add a cycle current that preserves the injected current at every node. Watch its dissipated power rise quadratically above the Kirchhoff minimum.',
      scope:'Thomson’s principle for fixed current injections. It does not minimize over unconstrained flows, where zero current would win. A separate Dirichlet principle fixes boundary voltages and varies interior potentials. The one-slider example explores one feasible circulation direction; the stated proof covers every divergence-free perturbation.',
      deps:['em-6.8','em-6.6'],refs:['Doyle–Snell §1.3.5, printed48–51, Thomson principle and proof','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:DOYLE},viz:U.minimum},
    {num:'6.10',kind:'Phenomenon',name:'Surface charges steer the current',
      statement:String.raw`A steady current in an Ohmic medium need not have zero electric field. For two uniform scalar conductors meeting at a stationary interface, with normal from medium 1 to 2 and no singular tangential surface current,
$$\sigma_1 E_{1n}=\sigma_2 E_{2n},\qquad \mathbf E_{1t}=\mathbf E_{2t}.$$
The free surface charge is $\rho_s=\varepsilon_2E_{2n}-\varepsilon_1E_{1n}$. It supports the normal-field discontinuity that lets the current change direction while preserving normal flux.`,
      idea:String.raw`A thin pillbox applied to steady current conservation gives continuity of Jn. A thin electrostatic loop gives continuity of tangential E. Solve these conditions for the transmitted field, then apply Gauss's law to obtain the sheet charge. In each homogeneous region the potential is harmonic; boundary charges and electrode conditions select the field that the conductor needs.`,
      caption:'Change the conductivity ratio and the incident field components at a flat material boundary. Compare the refracted field, continuous normal current and required sheet charge.',
      scope:'An exact local planar interface solution with piecewise uniform fields, equal vacuum permittivities and positive conductivities. It is not a bent-wire boundary-element calculation. The displayed signs represent a continuous sheet; its total charge over an infinite plane is not finite. Ohmic current and field are parallel within each isotropic material.',
      deps:['em-6.3','em-2.8'],refs:['Haus–Melcher §7.2, printed7–9, Eqs2–12 and Fig7.2.2','Syllabus guide: Griffiths §7.1 (book body not consulted)'],links:{source:HAUS7},viz:U.surface},
    {num:'6.11',kind:'Theorem',name:'Charge relaxation inside a conductor',
      statement:String.raw`In a region with spatially uniform, time-independent scalar conductivity $\sigma$ and permittivity $\varepsilon$, local laws $\mathbf J=\sigma\mathbf E$, $\nabla\cdot\mathbf E=\rho_f/\varepsilon$ and charge conservation imply
$$\partial_t\rho_f=-\frac{\sigma}{\varepsilon}\rho_f.$$
For $\sigma>0$, $\rho_f(\mathbf r,t)=\rho_f(\mathbf r,0)e^{-t/\tau}$ with $\tau=\varepsilon/\sigma$. When $\sigma=0$, the bulk free-charge density stays constant under these assumptions.`,
      idea:String.raw`Constant material coefficients can be taken outside the divergence. Substituting Ohm's law and Gauss's law into continuity leaves the same scalar relaxation equation at every interior point. The charge does not disappear: it is transported through boundaries or accumulates on interfaces. For an isolated spherical conductor with insulating exterior and initially uniform volume charge, the lost bulk charge appears on its surface.`,
      caption:'Change conductivity and elapsed time for an isolated sphere. The volume and surface charges add to the same total throughout relaxation.',
      scope:'Local continuum Ohm and linear dielectric laws are assumed valid on the time scales shown. The example is a radius-1 m sphere with vacuum outside, no external source and total initial charge 1 nC. Its external radial field remains fixed. The pointwise bulk law alone does not specify where charge goes in a different boundary geometry.',
      deps:['em-6.2','em-6.3','em-1.15'],refs:['Haus–Melcher §7.7, Eqs1–4; isolated-sphere boundary example derived here','Syllabus guides: Griffiths §7.1; Purcell ch.4 (book bodies not consulted)'],links:{source:HAUS7},viz:U.relaxation},
    {num:'6.12',kind:'Model',name:'RC circuit',
      statement:String.raw`For a series ideal source $V_s$, resistor $R>0$ and capacitor $C>0$, with initial capacitor voltage $V_0$, Kirchhoff's law gives $RC\dot V_C+V_C=V_s$. Thus
$$V_C(t)=V_s+(V_0-V_s)e^{-t/(RC)},$$
$$I(t)=\frac{V_s-V_0}{R}e^{-t/(RC)}.$$
The resistor heat by time t is $Q_R=\tfrac12C(V_s-V_0)^2(1-e^{-2t/(RC)})$. Source work equals the capacitor-energy change plus this heat.`,
      idea:String.raw`Use I=C dVc/dt in the loop equation and solve the first-order linear equation. Integrating RI² gives the heat; integrating Vs I gives source work. The capacitor stores CVc²/2. With V0=0 and t→∞, the source supplies CVs² and half becomes heat. A nonzero initial voltage changes that accounting and can return energy to the source.`,
      caption:'Charge, discharge or reverse a precharged capacitor. Inspect voltage, signed source work, capacitor-energy change and nonnegative resistor heat.',
      scope:'Ideal lumped elements with constant R, C and source voltage for t≥0. No parasitic inductance or radiation is modeled. The R→0 limit is singular in time and is not offered as a zero-resistance circuit. Stable exponential differences are used for early-time energy accounting.',
      deps:['em-6.8','em-3.8'],refs:['MIT8.02 TEAL guide07 §7.6.1, charging ODE and time constant; general initial condition and energy integrals derived here','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:TEAL7},viz:U.rc},
    {num:'6.13',kind:'Phenomenon',name:'Drift is slow, signals are fast',
      statement:String.raw`Carrier drift and electromagnetic propagation are different motions. A bulk electron current of magnitude I through area A and number density n has drift speed $|v_d|=|I|/(neA)$. An ideal lossless uniform transmission line with inductance L′ and capacitance C′ per length carries waves at $v=1/\sqrt{L'C'}$. For a TEM line in a uniform nonmagnetic dielectric, $v=c/\sqrt{\varepsilon_r}$. A matched load receives the launched signal after the finite flight time ℓ/v.`,
      idea:String.raw`Charge flux gives the drift formula. Combining the distributed line equations ∂zV=−L′∂tI and ∂zI=−C′∂tV gives a wave equation. A forward wave has I=V/Z0 with Z0=√(L′/C′). Choosing the load resistance Z0 removes the reflected wave, so the signal arrival can be followed without confusing it with a carrier travelling the entire circuit.`,
      caption:'Follow a voltage front along a matched line while reading the much smaller electron displacement on its own physical scale.',
      scope:'Ideal nondispersive lossless TEM line, nonmagnetic uniform dielectric, matched 50 Ω load and specified launched step. Carrier density and cross-section supply a separate bulk drift estimate; no claim is made that a lossless perfect-conductor field model resolves microscopic carrier dynamics. Real lines may disperse, attenuate and reflect.',
      deps:['em-6.4','em-6.10'],refs:['Haus–Melcher §14.3, Eqs1–12; §14.4, Eq8 and Matching; MIT8.02 TEAL guide06 §6.1','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:HAUS14,drift:TEAL6},viz:U.signal},
    {num:'6.14',kind:'Model',name:'Resistor networks and the infinite grid',
      statement:String.raw`For a finite connected resistor network, effective resistance between a and b is their voltage difference divided by the injected current. For the infinite square lattice with every edge resistance R, the finite-energy dipole solution gives $R_{eff}(m,n)=R\langle F_{mn}\rangle$, where the brackets mean the uniform average over wave vectors in $[-\pi,\pi]^2$, and
$$D=2-\cos k_x-\cos k_y,$$
$$F_{mn}=\frac{1-\cos(mk_x+nk_y)}{D}.$$
In particular, adjacent nodes have resistance R/2, diagonal neighbours have 2R/π, and for large separation r=√(m²+n²), $R_{eff}=(R/\pi)\log r+O(R)$.`,
      idea:String.raw`The discrete Laplacian is diagonal in Fourier modes. Injecting at one node and extracting at the other cancels the zero-mode singularity in their potential difference, giving the integral. Interchange kx and ky for the two nearest-neighbour resistances: their numerators add to the denominator, so their sum is R and each is R/2. Near zero wave number the denominator is quadratic, which gives the logarithmic large-distance growth.`,
      caption:'Grow an open finite grid and compare neighbouring or diagonal terminals with the infinite-lattice value. Inspect the separate infinite-lattice plot as separation increases.',
      scope:'Finite grids have free outer boundaries and unit edge resistances; they are solved separately from the infinite model. The source’s one-dimensional integral is evaluated by 1,024-panel composite Simpson quadrature with its analytic endpoint limit. Finite plots and floating-point residuals are numerical evidence, not rigorous interval certificates. No periodic-boundary network is substituted for the open grid.',
      deps:['em-6.8'],refs:['Cserti2000, §II.C, printed4–5, Eqs25–29 and33','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:CSERTI},viz:U.grid},
    {num:'6.15',kind:'Theorem',name:'Random walks and effective resistance',
      statement:String.raw`On a finite connected undirected network with positive conductances $c_{xy}=1/R_{xy}$, let $c_x=\sum_yc_{xy}$ and take a random step x→y with probability cxy/cx. The unit-boundary-voltage solution h, with ha=1 and hb=0, satisfies $h(x)=\Pr_x(T_a<T_b)$ at interior nodes. Starting at a,
$$\Pr_a(T_b<T_a^+)=\frac{1}{c_aR_{eff}(a,b)},$$
where $T_a^+$ is the first return after at least one step.`,
      idea:String.raw`Both the hitting probability and the voltage obey the same conductance-weighted mean-value equation and boundary values. Finite connectivity makes the absorbing boundary reachable and the solution unique, so the two functions agree. With unit boundary voltage, the outgoing current is ∑cay(1−h(y)); dividing by ca gives the probability of reaching b before returning to a after the first step. That current is the effective conductance 1/Reff.`,
      caption:'Run conductance-weighted walks, inspect an actual path and compare the observed escape fraction with the resistance formula. Short budgets expose unresolved walks.',
      scope:'Finite positive undirected resistor network; step probabilities are weighted by conductance, not necessarily uniform over neighbours. The simulation caps each walk and retains censored runs in the denominator. Its displayed lower/upper fractions bound the eventual sample outcomes, not the true probability with a statistical confidence guarantee. The finite-sample experiment does not prove the theorem.',
      deps:['em-6.14','em-6.9'],refs:['Doyle–Snell §§1.3.1–2, printed30–37, weighted walks and harmonic voltages; §1.3.4, printed41–45, escape probability','Syllabus guide: Purcell ch.4 (book body not consulted)'],links:{source:DOYLE},viz:U.walks},
  ],
};
