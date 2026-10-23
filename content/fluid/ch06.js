import * as V from './ch06.ui.shared.js';
const HINCH='https://www.damtp.cam.ac.uk/user/examples/D23Le.pdf';
const SONIN='https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/83aa0d8fd395e8e7d9bc8b236ab4bfe7_MIT2_25F13_Equat_of_Motio.pdf';
const COUETTE='https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/1a114d602956fa0dd328155f9b45f93d_MIT2_25F13_Couet_and_Pois.pdf';
export default{collection:'fluid',chapter:6,title:'Viscous flow and the Navier–Stokes equations',
summary:'Viscous stress responds to deformation, while momentum and energy balances determine how that stress changes a flow. Exact shear flows and diffusion layers expose wall forces, similarity and dissipation. Gaussian vortices then show the competition between viscous spreading and imposed stretching; the existing Reynolds paper connects these equations to experiments.',items:[
{num:'6.1',kind:'Law',name:'Newtonian viscosity',deps:['fluid-1.10'],
statement:String.raw`For an isotropic incompressible Newtonian fluid, the viscous stress is proportional to the symmetric rate of strain:
$$\tau_{ij}=2\mu S_{ij},\qquad \mu>0.$$
In simple shear $\mathbf u=(\dot\gamma y,0,0)$, this gives $\tau_{xy}=\mu\dot\gamma$. Dynamic viscosity $\mu$ has units Pa s. Uniform translation and rigid rotation alone create no viscous stress.`,
idea:String.raw`Neighboring layers moving at different velocities exchange tangential momentum. For parallel plates separated by $H$, their relative speed gives $\dot\gamma=(U_t-U_b)/H$. The shear traction is $\mu\dot\gamma$ and its mechanical dissipation per volume is $\mu\dot\gamma^2$.

The constitutive law uses the symmetric velocity gradient rather than the velocity itself: adding a common translation cannot change internal friction, and the antisymmetric gradient describes rigid rotation. Linearity and isotropy are material assumptions, not consequences of dimensional analysis alone.`,
caption:'Change viscosity, plate separation and both wall velocities. Compare the actual linear velocity profile with the stress–shear-rate relation. A common wall-velocity shift changes transport without changing the stress.',
scope:'Continuum, isotropic, incompressible Newtonian material with constant positive viscosity. The steady parallel-plate example has no pressure gradient and neglects edge effects. Non-Newtonian fluids require a different constitutive law; no measured material-property dataset is implied.',
refs:['Hinch, Fluid Dynamics II, draft 18 September 2020, PDF pp.11–16 and 24–25: viscosity, strain, constitutive law and Couette traction'],links:{source:HINCH},tags:['viscosity','constitutive laws'],viz:V.shear},
{num:'6.2',kind:'Definition',name:'Stress tensor in a moving fluid',deps:['fluid-2.1','fluid-1.10'],
statement:String.raw`The Cauchy stress tensor maps an oriented unit normal $\mathbf n$ to the traction exerted across that surface:
$$\mathbf t(\mathbf n)=\boldsymbol\sigma\mathbf n.$$
With no internal body couples, angular-momentum balance makes $\boldsymbol\sigma$ symmetric. For the incompressible Newtonian fluid used here,
$$\boldsymbol\sigma=-pI+2\mu S.$$
Positive pressure is compressive; a positive normal stress is tensile.`,
idea:String.raw`A shrinking tetrahedron has surface forces of order length squared and bounded body/inertial forces of order length cubed. Their leading balance makes traction linear in the normal. Angular-momentum balance supplies stress symmetry. Opposite faces have opposite tractions even when those tractions are not normal to the faces.

In the displayed planar example, $A_{ij}=\partial_j u_i$, $S=(A+A^T)/2$ and the remaining antisymmetric part is rigid spin. Rotating the inspected plane changes its normal/shear traction but not the principal stresses. The normal/shear pairs trace the actual Mohr circle of this symmetric two-dimensional stress.`,
caption:'Rotate a surface normal and vary pressure, viscosity, extension, symmetric shear and rigid spin. Inspect the traction decomposition and its Mohr circle; spin changes the local velocity gradient while leaving the stress unchanged.',
scope:'Classical continuum without couple stress; the example is incompressible plane strain embedded in three dimensions. Only traction balance is required across an interface without singular surface forces; continuity of every stress component is not a general interface law. Compressible fluids may also have bulk-viscous stress.',
refs:['Hinch, PDF pp.12–17: strain, traction, stress symmetry and incompressible constitutive law','Sonin, Equation of Motion for Viscous Flow, 2003 ninth edition with 2005 notation modifications, PDF p.2 and pp.21–23: stress and pressure conventions'],links:{source:HINCH,pressure:SONIN},tags:['stress','traction'],viz:V.tensor},
{num:'6.3',kind:'Principle',name:'No-slip condition',deps:['fluid-6.1'],
statement:String.raw`At a solid surface, the no-slip model sets the fluid's tangential velocity equal to the wall velocity. For an impermeable wall, the normal fluid velocity also matches the wall's normal velocity. These are distinct boundary conditions. No-slip is an extremely useful physical assumption for many ordinary flows, not a theorem forced by the bulk Navier–Stokes equations.`,
idea:String.raw`The boundary describes momentum exchange with a material surface. A flat-wall Navier-slip model instead permits a tangential velocity difference proportional to the tangential shear rate. For bottom and top slip lengths $b_0,b_1\ge0$, steady Couette flow has
$$u(y)=U_b+s(y+b_0),$$
$$s=\frac{U_t-U_b}{H+b_0+b_1}.$$
It obeys $u(0)-U_b=b_0s$ and $U_t-u(H)=b_1s$. Zero slip lengths recover no-slip exactly; finite slip changes the profile and wall force without changing the Newtonian bulk law.`,
caption:'Compare no-slip with finite flat-wall slip lengths. Move either wall and inspect both boundary velocity differences, the resulting profile and the transmitted shear force.',
scope:'Steady unidirectional incompressible Newtonian flow between flat impermeable walls. Slip lengths are prescribed model inputs, not measurements or a universal molecular law. Curved surfaces require the full tangential stress relation; no infinite-slip limit or microscopic trajectory is simulated.',
refs:['Lauga, Brenner and Stone, Microfluidics: The No-Slip Boundary Condition, arXiv:cond-mat/0501557v3 (28 September 2005), PDF pp.1–3: assumption, Navier relation and slip terminology; Couette solution derived here'],links:{source:'https://arxiv.org/pdf/cond-mat/0501557'},tags:['boundary conditions','slip'],viz:V.slip},
{num:'6.4',kind:'Law',name:'Navier–Stokes equations',deps:['fluid-2.8','fluid-6.1','fluid-6.2'],
statement:String.raw`A constant-density incompressible Newtonian fluid with constant viscosity obeys
$$\partial_t\mathbf u+(\mathbf u\cdot\nabla)\mathbf u$$
$$=-\frac{\nabla p}{\rho}+\nu\nabla^2\mathbf u+\mathbf g,$$
$$\nabla\cdot\mathbf u=0,\qquad \nu=\mu/\rho.$$
Here $\mathbf g$ is body force per unit mass. Boundary and initial conditions complete a particular flow problem.`,
idea:String.raw`Cauchy's momentum equation adds $\nabla\cdot\boldsymbol\sigma$ as the surface force per volume. Substituting $\boldsymbol\sigma=-pI+2\mu S$ gives $-\nabla p+\mu\nabla^2\mathbf u$ when viscosity is constant and divergence vanishes. Viscosity diffuses momentum; it is not a universal local drag proportional to $-\mathbf u$.

The visualization supplies an exact periodic Taylor–Green example, with $A=U_0e^{-2\nu k^2t}$:
$$u_x=A\sin(kx)\cos(ky),$$
$$u_y=-A\cos(kx)\sin(ky),$$
$$p=\frac{\rho A^2}{4}[\cos(2kx)+\cos(2ky)].$$
Its nonlinear advection is canceled by the pressure gradient, while time decay equals viscous diffusion. All four terms are evaluated at the chosen point.`,
caption:'Change viscosity, wavelength, initial speed and time in the exact periodic flow. Move the probe to compare pressure, advection, viscous acceleration and time change. The displayed field is computed from the stated solution.',
scope:'Smooth two-dimensional periodic incompressible flow with no body force. The example verifies one exact solution, not existence, uniqueness or numerical accuracy for arbitrary three-dimensional data. Density and viscosity are constant; pressure is determined up to an additive reference.',
refs:['Hinch, PDF pp.16–22: Cauchy momentum, Newtonian stress, energy and governing equations','Sonin, PDF pp.22–23: incompressible Navier–Stokes; periodic example derived and checked here'],links:{source:HINCH,momentum:SONIN},tags:['navier stokes','momentum'],viz:V.tgv},
{num:'6.5',kind:'Definition',name:'Reynolds number and dynamic similarity',deps:['fluid-6.4'],
statement:String.raw`For a velocity scale $U$, length scale $L$ and kinematic viscosity $\nu$, the Reynolds number is
$$\mathrm{Re}=UL/\nu.$$
With $t^*=tU/L$ and $p^*=p/(\rho U^2)$, the unforced dimensionless momentum equation is
$$\partial_{t^*}\mathbf u^*+(\mathbf u^*\cdot\nabla^*)\mathbf u^*$$
$$=-\nabla^*p^*+\mathrm{Re}^{-1}\nabla^{*2}\mathbf u^*.$$
Matching Reynolds number supports dynamic similarity only when geometry and the remaining dimensionless data also match.`,
idea:String.raw`Inertial acceleration scales as $U^2/L$, while viscous acceleration scales as $\nu U/L^2$; their ratio is Reynolds number. A separate imposed time, sound speed, gravity or surface tension can introduce additional groups. Boundary roughness, forcing and initial states also matter; one number does not select a universal transition to turbulence.

The example compares exact parallel startup layers at the same dimensionless age. Their profiles are $u/U=\operatorname{erfc}[y^*\sqrt{\mathrm{Re}}/(2\sqrt{t^*})]$. Changing physical size and speed while scaling viscosity to preserve Reynolds number collapses those profiles, even though the physical penetration lengths differ.`,
caption:'Rescale the second experiment and switch between matched and independently changed viscosity. Compare physical scales with the dimensionless profile collapse at the same dimensionless age.',
scope:'The illustrated parallel flow has zero convective acceleration and a prescribed impulsive wall start. Its exact similarity is a concrete test of scaling, not a turbulence or general flow-selection simulation. Similarity of a full problem also requires all relevant dimensionless boundary, initial and forcing conditions.',
refs:['Hinch, PDF pp.20–22: nondimensionalization and Reynolds/time groups','MIT Unified Engineering, Fluids Lecture 4 (2005/2006), PDF pp.1–3: dimensionless parameters and dynamic similarity'],links:{source:HINCH,similarity:'https://ocw.mit.edu/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/b0d2168f3fc45735017ff56c05bd9a0c_f04_fall.pdf'},tags:['reynolds number','similarity'],viz:V.similarity},
{num:'6.6',kind:'Method',name:'Dimensional analysis: the Buckingham Π theorem',deps:['fluid-6.5','ladr-3.21'],
statement:String.raw`Let $n$ positive dimensional variables have a dimension-exponent matrix $D$ of rank $r$. There are $n-r$ independent dimensionless monomials $\Pi_j$, obtained from a basis of $\ker D$. A relation invariant under changes of the fundamental units can be expressed using those dimensionless groups. The number $r$ is the rank of the dimensions actually present, not merely the number of unit names one lists.`,
idea:String.raw`A monomial $\Pi=\prod_i q_i^{a_i}$ has dimension vector $Da$. It is dimensionless exactly when $Da=0$. Rank–nullity gives $\dim\ker D=n-r$. In logarithmic variables, changing units translates along the row space of $D$; the independent null-space coordinates distinguish the remaining invariant combinations.

For force $F$, density $\rho$, speed $U$, size $L$ and viscosity $\mu$, the displayed matrix has rank three. One basis is $F/(\rho U^2L^2)$ and $\rho UL/\mu$. Dimensional analysis reduces the variables but does not determine the drag function or its constants.`,
caption:'Select either basis product or edit its five exponents. Change mass, length and time units and inspect the actual dimension residual and monomial change; an invalid product changes under unit conversion.',
scope:'Positive variables permit real exponents and logarithmic coordinates. The variable list must contain the physically relevant parameters. The example is a dimensional identity, not a measured drag law; independence of a complete basis is distinct from constructing one dimensionless product.',
refs:['MIT Unified Engineering, Fluids Lecture 4, PDF pp.1–3: Pi products and their role in similarity; exponent-matrix argument supplied from rank–nullity'],links:{source:'https://ocw.mit.edu/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/b0d2168f3fc45735017ff56c05bd9a0c_f04_fall.pdf'},tags:['dimensional analysis','rank'],viz:V.pi},
{num:'6.7',kind:'Model',name:'Couette and Poiseuille flow',deps:['fluid-6.4','fluid-6.3'],
statement:String.raw`Steady fully developed plane flow between no-slip walls at $y=0,H$ obeys $\mu u''=-G$, where $G=-dp/dx$ is a constant signed pressure drive. For wall speeds $U_b,U_t$,
$$u=U_b+(U_t-U_b)\eta$$
$$+\frac{GH^2}{2\mu}\eta(1-\eta),\qquad \eta=y/H.$$
The volume flux per unit width is
$$Q'=\frac H2(U_b+U_t)+\frac{GH^3}{12\mu}.$$
Wall motion and pressure drive superpose in this special parallel-flow problem.`,
idea:String.raw`Because the velocity has only a streamwise component and does not vary downstream, nonlinear advection vanishes exactly. Integrating the remaining second-order equation and imposing the two wall velocities gives a linear Couette part and a parabolic Poiseuille part. Opposing wall and pressure drives can create a reverse-flow region or zero net flux without making the entire fluid stationary.

The wall-on-fluid tractions are $\mu u'(H)$ at the top and $-\mu u'(0)$ at the bottom. Their sum balances the pressure force. Wall work plus $GQ'$ equals $\mu\int_0^H(u')^2dy$, including signed work when a drive extracts energy.`,
caption:'Move both walls and reverse the pressure gradient. Inspect the combined velocity, its components and true extrema; compare force and energy balances with the actual profile integrals.',
scope:'Incompressible Newtonian constant-viscosity fluid, steady fully developed unidirectional flow, flat parallel walls and no-slip. Entrance/edge effects and stability to arbitrary disturbances are omitted. The mean Couette flux uses the sum of wall speeds.',
refs:['Hinch, PDF pp.23–26: unidirectional reduction, plane shear/pressure flow and work balance','MIT 2.25, Couette & Poiseuille Flows (15 October 2008), PDF pp.1–2; flux obtained by integrating the stated profile'],links:{source:HINCH,profiles:COUETTE},tags:['couette flow','poiseuille flow'],viz:V.plane},
{num:'6.8',kind:'Law',name:'Hagen–Poiseuille law',deps:['fluid-6.7'],
statement:String.raw`For steady fully developed laminar flow through a straight circular no-slip pipe of radius $R$ and length $L$,
$$Q=\frac{\pi R^4\Delta p}{8\mu L},$$
$$u(r)=\frac{\Delta p}{4\mu L}(R^2-r^2).$$
The pressure drop $\Delta p=p_{\rm in}-p_{\rm out}$ sets the signed flow. The mean velocity is half the centerline velocity, and the flow rate depends on the fourth power of radius.`,
idea:String.raw`Cylindrical momentum balance gives $\mu(r u')'=-r\Delta p/L$. Regularity at the axis removes the singular integration constant, and no-slip fixes the additive constant. Integrating $2\pi r u(r)$ over the cross-section produces the fourth power.

The pressure work $\Delta p\,Q$ equals viscous dissipation over the pipe. If friction factors are used, the Darcy value is $64/\mathrm{Re}$; the Fanning convention instead gives $16/\mathrm{Re}$. Neither formula supplies a universal criterion for the onset of turbulence.`,
caption:'Change radius, viscosity, length and signed pressure drop. Compare the parabolic profile, actual flux and radius-to-the-fourth scaling; the readout checks pressure work and wall drag.',
scope:'Fully developed laminar incompressible Newtonian flow in a rigid straight pipe with constant radius and viscosity. The selected illustrative density and parameter range keep the nominal Reynolds number at or below 312.5. This does not compute an entrance region, transition threshold or non-Newtonian blood flow.',
refs:['MIT 2.25, Couette & Poiseuille Flows, PDF p.2: circular-pipe profile, flux and Fanning convention','Hinch, PDF pp.25–26: pressure work and dissipation; circular derivation supplied here'],links:{source:COUETTE,energy:HINCH},tags:['pipe flow','viscous resistance'],viz:V.pipe},
{num:'6.9',kind:'Theorem',name:'Viscous dissipation of energy',deps:['fluid-6.4','fluid-1.10'],
statement:String.raw`For a smooth constant-density incompressible Newtonian flow with no external work and periodic boundaries, or a stationary impermeable no-slip boundary,
$$\frac{d}{dt}\int_V\frac{\rho|\mathbf u|^2}{2}\,dV$$
$$=-\int_V2\mu S:S\,dV\le0.$$
Viscosity converts mechanical energy into internal energy. For moving or open boundaries, boundary transport and traction work must also be included.`,
idea:String.raw`Dot the momentum equation with velocity and integrate. Incompressibility and the stated boundaries remove the advective and pressure fluxes. Integration by parts converts viscous work into a boundary term and $-2\mu\int S:S$; the latter has a fixed nonpositive sign.

The exact periodic Taylor–Green solution gives a direct volume check. A second example is steady driven Couette flow: its kinetic energy stays constant because positive wall power replaces the mechanical energy dissipated. Locally the dissipative density is $2\mu S:S$, not the square of rigid spin; alternative vorticity/gradient integral formulas require their boundary terms.`,
caption:'Compare freely decaying periodic motion with wall-driven steady shear. Inspect the actual energy history, instantaneous strain dissipation and supplied wall power rather than assuming every viscous flow must lose kinetic energy.',
scope:'Finite energy in the integration cell, constant density/viscosity and sufficient smoothness. The theorem concerns mechanical kinetic energy, not destruction of total energy. The nonzero-circulation whole-plane Oseen vortex and the externally strained Burgers field are not closed finite-energy counterexamples.',
refs:['Hinch, PDF pp.19–20: mechanical energy flux and strain dissipation; pp.24–25: Couette wall-power balance'],links:{source:HINCH},tags:['dissipation','energy balance'],viz:V.energy},
{num:'6.10',kind:'Model',name:'Impulsively started plate (Rayleigh’s problem)',deps:['fluid-6.4','fluid-6.3','pde-3.3'],
statement:String.raw`A flat plate at $y=0$ starts at speed $U$ beneath an initially resting viscous half-space. Under the parallel-flow assumptions, for $y\ge0,t>0$,
$$u(y,t)=U\operatorname{erfc}\!\left(\frac{y}{2\sqrt{\nu t}}\right).$$
The fluid-on-plate shear force per area is $-\mu U/\sqrt{\pi\nu t}$. Momentum penetrates over a scale proportional to $\sqrt{\nu t}$, with no sharp diffusion front.`,
idea:String.raw`Unidirectional flow removes convection and leaves $u_t=\nu u_{yy}$. The wall and far-field conditions select the complementary-error-function similarity solution. Differentiating it gives the signed wall shear; integrating gives momentum and kinetic energy per plate area.

The instantaneous wall load diverges as $t\downarrow0$ for an ideal jump, but the total transferred momentum remains finite and grows as $\sqrt t$. Initial rest at $y>0,t=0$ and the moving-wall limit at $y=0,t>0$ do not define a single compatible corner value at $y=t=0$ when $U\ne0$.`,
caption:'Advance time from the ideal start and inspect velocity and signed wall loading. Compare physical heights with the diffusion width; the initial corner is left undefined and the integrated momentum/energy remain explicit.',
scope:'Infinite flat plate, semi-infinite incompressible Newtonian fluid, constant properties and exact parallel-flow ansatz. Stability and finite plate edges are omitted. The load at exactly zero time is singular, not a large finite numerical value. Logarithmic tail values are retained when a velocity falls below the floating-point range; quadrature diagnostics are estimates.',
refs:['Hinch, PDF pp.27–28: impulsive plate, diffusion similarity and wall shear','MIT 2.25, Stokes First Problem ATP, Fall 2008, PDF pp.1–3: setup and dimensional stress/penetration scales'],links:{source:HINCH,scaling:'https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/6c64b72340cd5b5da9a0d59516b63aec_MIT2_25F13_SolutionStokes1.pdf'},tags:['momentum diffusion','startup flow'],viz:V.rayleigh},
{num:'6.11',kind:'Model',name:'Oscillating plate: the Stokes layer',deps:['fluid-6.10'],
statement:String.raw`For a plate moving as $U\cos\omega t$, the steady periodic response of a viscous half-space is
$$u(y,t)=Ue^{-y/\delta}\cos(\omega t-y/\delta),$$
$$\delta=\sqrt{2\nu/\omega}.$$
The amplitude decreases by a factor $e$ over depth $\delta$, while the phase lags by one radian over the same depth. This is a periodic solution after startup transients, not an initially resting solution at $t=0$.`,
idea:String.raw`Insert a complex sinusoid into $u_t=\nu u_{yy}$. The decaying root of the resulting spatial equation is $(1+i)/\delta$, which produces both attenuation and phase delay. The wall-on-fluid traction is
$$\tau_w=\frac{\mu U}{\delta}(\cos\omega t-\sin\omega t).$$
It leads wall velocity by 45 degrees. Instantaneous wall work can be negative as the fluid returns energy, while the cycle-average work and dissipation are both $\mu U^2/(2\delta)>0$ for nonzero amplitude.`,
caption:'Change frequency, viscosity, amplitude and phase. Inspect the signed velocity profile within its exponential envelopes and compare wall velocity, traction and energy exchange through a complete cycle.',
scope:'Steady periodic parallel flow in a semi-infinite incompressible Newtonian fluid, positive frequency and viscosity. There is no sharp penetration boundary, no sound-wave propagation calculation and no from-rest startup transient. The profile uses physical velocity; its envelope uses the imposed amplitude and never divides by an instantaneously vanishing wall speed.',
refs:['Hinch, PDF p.29: oscillatory diffusion solution, depth and average dissipation','MIT 2.25, Stokes Second Problem ATP, Fall 2008, PDF pp.1–3: periodic versus initial-value problem and stress scaling'],links:{source:HINCH,scaling:'https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/ae8a045fb09d50686cc1764c296f83f1_MIT2_25F13_SolutionStokes2.pdf'},tags:['stokes layer','oscillatory flow'],viz:V.stokes},
{num:'6.12',kind:'Model',name:'Lamb–Oseen vortex',deps:['fluid-6.10','fluid-3.6'],
statement:String.raw`The axisymmetric viscous vortex formed from point circulation $\Gamma$ has, for $t>0$,
$$\omega_z=\frac{\Gamma}{4\pi\nu t}e^{-r^2/(4\nu t)},$$
$$u_\theta=\frac{\Gamma}{2\pi r}\left(1-e^{-r^2/(4\nu t)}\right).$$
The velocity extends regularly to $u_\theta(0)=0$. Its Gaussian vorticity spreads, while circulation over the whole plane stays $\Gamma$.`,
idea:String.raw`A purely azimuthal, axisymmetric velocity does not advect its radial vorticity distribution. The vorticity equation becomes radial two-dimensional diffusion. Its point-source heat kernel is Gaussian; integrating $\partial_r(ru_\theta)=r\omega_z$ and requiring a regular axis gives the velocity.

Near the axis the fluid rotates approximately as a solid body; far outside the core its speed approaches $\Gamma/(2\pi r)$. The circulation inside a finite radius is $\Gamma[1-e^{-r^2/(4\nu t)}]$, not exactly the whole-plane value. The speed maximum solves $e^x-1=2x$ at a nonzero $x=r^2/(4\nu t)$.`,
caption:'Change viscosity, vortex age and signed circulation. Compare the smooth vorticity core with the actual azimuthal velocity and enclosed circulation; reversing circulation reverses the swirl without changing its width.',
scope:'Two-dimensional, constant-viscosity incompressible flow extended uniformly along the axis, positive vortex age. The initial point circulation is singular; this Gaussian is not the exact finite-time diffusion of an arbitrary Rankine patch. Nonzero total circulation gives infinite kinetic energy over the whole plane, although vorticity is integrable. Local rigid spin is half the vorticity.',
refs:['Gallay and Wayne, arXiv:math/0402449v1 (2004), PDF pp.1–2, equation (7): exact Oseen fields, circulation and infinite-energy caveat','Hinch, PDF p.73, exercise 6.3: point-vorticity similarity solution'],links:{source:'https://arxiv.org/pdf/math/0402449',derivation:HINCH},tags:['viscous vortex','diffusion'],viz:V.oseen},
{num:'6.13',kind:'Model',name:'Burgers vortex',deps:['fluid-3.3','fluid-6.12'],
statement:String.raw`An imposed axisymmetric strain $u_r=-ar/2$, $u_z=az$ with $a>0$ can confine a steady Gaussian vortex:
$$\omega_z=\frac{\Gamma}{\pi w^2}e^{-r^2/w^2},$$
$$w^2=\frac{4\nu}{a}.$$
Its azimuthal velocity follows from the enclosed circulation as in the Lamb–Oseen vortex. Radial advection, axial stretching and viscous diffusion balance exactly.`,
idea:String.raw`The axial vorticity equation is
$$\partial_t\omega=-u_r\partial_r\omega+a\omega$$
$$\hspace{1em}+\nu(\omega_{rr}+\omega_r/r).$$
A Gaussian of fixed circulation remains a Gaussian provided its squared width satisfies
$$\frac{d(w^2)}{dt}=4\nu-aw^2.$$
Regularity at the axis or finite circulation fixes the integration constant in the steady equation. The limiting width $4\nu/a$ balances inward compression with outward diffusion.

The interactive extension starts with any positive Gaussian width $w_0$ and uses the exact transient family
$$w^2=w_0^2e^{-at}+\frac{4\nu}{a}(1-e^{-at}).$$
Its continuous zero-strain limit is $w_0^2+4\nu t$, a freely diffusing Gaussian. No finite steady core exists at zero strain.`,
caption:'Vary imposed strain, viscosity, initial width, age and circulation. Watch the computed core width approach its steady value when strain is positive, and compare the separate vorticity-budget terms with their actual time derivative.',
scope:'Exact axisymmetric Gaussian family in an imposed linear three-dimensional strain; all fields use the stated strain convention. The background strain is unbounded in space and is not a closed finite-energy system. The transient extension is identified separately from the steady Burgers vortex. No arbitrary turbulent-vortex evolution or general stability theorem is simulated.',
refs:['Gallay and Maekawa, arXiv:1002.2489v1 (2010), PDF pp.1–3, equations (1.1)–(1.9): strain convention and explicit Burgers fields','Hinch, PDF pp.70–73: steady balance and transient Gaussian exercise; width equation derived and checked here'],links:{source:'https://arxiv.org/pdf/1002.2489',derivation:HINCH},tags:['vortex stretching','viscous balance'],viz:V.burgers}
]};
