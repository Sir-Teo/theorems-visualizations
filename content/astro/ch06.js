import * as V from './ch06.ui.shared.js';
const ANU='https://www.mso.anu.edu.au/~krumholz/teaching/astr3007_s1_2017/';
const B16='https://arxiv.org/pdf/1611.09867';
export default {
collection:'astro',chapter:6,title:'Stellar structure and energy',
summary:'Pressure supports a star against gravity, while energy loss can make its interior hotter. Hydrostatics, transport and nuclear reactions supply the equations of stellar structure. Explicit local models lead to polytropes, fusion windows and dated solar benchmarks; neutrino flavor measurements test the energy source without settling every question about the solar interior.',
items:[
{num:'6.1',kind:'Law',name:'Hydrostatic equilibrium of a star',deps:['fluid-2.2','mech-8.1'],
statement:String.raw`A spherical, nonrotating Newtonian fluid at rest obeys
$$\frac{dP}{dr}=-\rho\frac{Gm}{r^2},$$
$$\frac{dm}{dr}=4\pi r^2\rho.$$
Here $m(r)$ is enclosed mass. Pressure decreases outward so its force balances inward gravity. This balance describes equilibrium; it does not by itself prove stability.`,
idea:String.raw`The local Euler equation gives pressure acceleration $-\nabla P/\rho$. The shell theorem supplies the gravitational acceleration from enclosed mass. For uniform density and zero surface pressure, integration gives $P(r)=2\pi G\rho^2(R^2-r^2)/3$.

The interactive extension is a derived homologous model: each shell keeps its fractional radius $u$, the density scales as $a^{-3}$ and a monatomic adiabatic pressure as $a^{-5}$. With $a=R/R_0$ and $\tau=t\sqrt{GM/R_0^3}$, its exact equation is $a''=a^{-3}-a^{-2}$. Small perturbations in this particular model oscillate.`,
caption:'Change the initial radius perturbation and advance dimensionless time. The shell pressure and force arrows use the evolving homologous sphere; the radius curve is its exact nonlinear solution. Mass and reference radius set the physical force and time scales.',
scope:'Spherical Newtonian fluid, isotropic pressure and negligible rotation. The oscillation assumes uniform density, a fixed entropy profile carried by homologous shells, adiabatic index 5/3 and no energy loss. It is an illustrative dynamical solution, not a solar model or a general stability theorem.',
refs:['Krumholz, ASTR3007 (2017), notes 2, PDF pp.6–10: dynamical time, hydrostatic balance and virial relation; homologous solution derived here'],links:{source:ANU+'notes2.pdf'},tags:['hydrostatics','stellar structure'],viz:V.hydro},
{num:'6.2',kind:'Theorem',name:'Virial theorem for stars',deps:['mech-8.16','astro-6.1'],
statement:String.raw`For a spherical hydrostatic star with surface pressure $P_s$ and volume $V$,
$$3\int P\,dV+W-3P_sV=0,$$
where $W<0$ is gravitational potential energy. If pressure and internal energy come from a nonrelativistic monatomic ideal gas, $3\int P\,dV=2U$. An isolated star then has $2U+W=0$ and total energy $E=W/2=-U$.`,
idea:String.raw`Multiply hydrostatic balance by $4\pi r^3dr$ and integrate. Integration by parts supplies the surface term; the gravitational term becomes $W=-\int Gm\,dm/r$. The ideal-gas energy relation converts pressure support into thermal energy.

Along an isolated sequence with fixed mass and density shape, write $W=-\alpha GM^2/R$. Contraction makes $W$ more negative, increases $U$, and reduces $E$: half the released binding energy is radiated and half heats the gas. A nonzero confining pressure changes this accounting.`,
caption:'Vary mass, radius, density-shape factor and surface confinement. Signed energy bars test the virial balance; the second panel shows the corresponding mean gas temperature along a fixed-shape sequence.',
scope:'Hydrostatic scalar virial relation; magnetic, rotational and bulk kinetic terms omitted. The conversion to 2U requires a monatomic nonrelativistic ideal gas. Radiation, ionization and degeneracy require their own energy–pressure relations. Surface pressure is prescribed, not an atmosphere calculation.',
refs:['Krumholz, notes 2, PDF pp.8–10: virial theorem and ideal-gas thermal energy'],links:{source:ANU+'notes2.pdf'},tags:['virial theorem','energy'],viz:V.virial},
{num:'6.3',kind:'Phenomenon',name:'Negative heat capacity of self-gravitating systems',deps:['astro-6.2'],
statement:String.raw`On an isolated virialized ideal-gas sequence with fixed particle number,
$$E=-\frac32 Nk_B\overline T,$$
$$\frac{dE}{d\overline T}=-\frac32 Nk_B<0.$$
Removing total energy can therefore raise the mean temperature. The system contracts until the increase in thermal energy balances the larger decrease in gravitational energy.`,
idea:String.raw`Compare two systems that lose the same fraction $f$ of their initial thermal energy. A fixed-volume ideal gas cools to $(1-f)T_0$. A star returning quasistatically to the same virial family heats to $(1+f)T_0$ and contracts to $R_0/(1+f)$. Its thermal energy rose even though its total energy fell. The negative derivative belongs to the self-gravitating equilibrium sequence, not to the microscopic gas heat capacity.`,
caption:'Remove a chosen fraction of the initial thermal energy. Compare the contracting virial sphere with a fixed-volume gas, and follow their opposite temperature responses on the energy-loss graph.',
scope:'Quasistatic equilibria with negligible surface pressure, fixed mass/composition and homologous density shape. No N-body dynamics is simulated. Unstable, evaporating, degenerate or radiation-dominated systems need additional analysis.',
refs:['Krumholz, notes 3, PDF p.5 and pp.8–10: global energy evolution and gravitational contraction'],links:{source:ANU+'notes3.pdf'},tags:['heat capacity','gravity'],viz:V.cooling},
{num:'6.4',kind:'Definition',name:'Dynamical, Kelvin–Helmholtz and nuclear timescales',deps:['astro-6.2'],
statement:String.raw`Three useful characteristic scales for a star of mass $M$, radius $R$ and luminosity $L$ are
$$t_{\rm dyn}=\sqrt{\frac{R^3}{GM}},$$
$$t_{\rm KH}=\frac{GM^2}{RL},$$
$$t_{\rm nuc}=\frac{f_H\eta Mc^2}{L}.$$
Here $f_H$ is the fraction of the total stellar mass available as hydrogen fuel, and $\eta\simeq0.007$ is the mass-to-energy conversion fraction. These are scales, not exact evolutionary lifetimes.`,
idea:String.raw`Dynamical adjustment compares radius with a gravitational acceleration. For a pressureless uniform sphere released from rest, the collapse time is $\pi t_{\rm dyn}/(2\sqrt2)$; other profiles have other coefficients. The thermal scale divides a gravitational energy scale by luminosity. The nuclear scale divides an explicitly chosen fuel reservoir by luminosity. Density shape, changing luminosity, accessible core fuel and neutrino losses refine these estimates.`,
caption:'Set mass, radius, luminosity and the available hydrogen fraction independently. The logarithmic chart compares the three timescales and marks the uniform-sphere free-fall coefficient separately.',
scope:'Order-of-magnitude Newtonian stellar estimates with constant comparison luminosity. The fuel fraction already includes the amount of hydrogen accessible for burning; it is not an unstated core fraction. The nuclear estimate uses total conversion energy and omits neutrino deposition corrections.',
refs:['Krumholz, notes 2, PDF p.6: dynamical collapse time','Krumholz, notes 3, PDF pp.8–10: thermal and nuclear reservoirs'],links:{source:ANU+'notes3.pdf',dynamics:ANU+'notes2.pdf'},tags:['timescales','stellar evolution'],viz:V.times},
{num:'6.5',kind:'Paradox',name:'Kelvin’s age-of-the-Sun problem',deps:['astro-6.4'],
statement:String.raw`If sunlight came only from slow gravitational contraction, an isolated ideal-gas Sun would have a finite radiatable reservoir. With $W=-\alpha GM^2/R$ and fixed shape,
$$E_{\rm rad}=\frac{\alpha GM^2}{2}\left(\frac1R-\frac1{R_i}\right).$$
Dividing by today's luminosity gives millions of years, far below the billions of years required by the age comparison. Nuclear binding energy supplies a much larger reservoir.`,
idea:String.raw`The virial theorem requires part of the released gravitational energy to remain as hotter gas. Thus the radiatable contraction budget contains $\alpha/2$, whereas the conventional Kelvin–Helmholtz scale uses $GM^2/R$. Even contraction from a very large initial radius cannot remove the gap. The chart uses 4.57 Gyr, the age adopted as an input in the dated B16 solar calibration; it does not independently measure that age or reconstruct Kelvin's historical numerical estimate.`,
caption:'Change the structural factor, initial radius and hydrogen fuel fraction. Compare the actual virial contraction budget with the conventional thermal scale, nuclear estimate and adopted solar-age reference.',
scope:'Constant present-day luminosity is a comparison assumption, not a reconstructed solar history. Mass, radius and nominal luminosity are fixed to the stated solar scales. The adopted age is distinguished from a result calculated by the visualization.',
refs:['Krumholz, notes 3, PDF pp.8–10: gravitational-age problem and nuclear reservoir','Vinyoles et al. (2017), arXiv:1611.09867v4, Table 3, PDF p.6: adopted solar age'],links:{source:ANU+'notes3.pdf',age:B16},tags:['solar age','energy'],viz:V.kelvin},
{num:'6.6',kind:'Model',name:'Polytropes and the Lane–Emden equation',deps:['astro-6.1','thermo-1.16'],
statement:String.raw`For a spherical hydrostatic polytrope with $P=K\rho^{1+1/n}$, set $\rho=\rho_c\theta^n$ and $r=a\xi$. The regular dimensionless profile satisfies
$$\frac1{\xi^2}(\xi^2\theta')'=-\theta^n,$$
$$\theta(0)=1,\qquad \theta'(0)=0.$$
The first zero, when finite, gives the surface. Enclosed dimensionless mass is $q=-\xi^2\theta'$. The $n=0$ case is an incompressible limiting model.`,
idea:String.raw`Combine pressure balance, mass continuity and the polytropic relation. The length scale is $a^2=(n+1)K\rho_c^{1/n-1}/(4\pi G)$ for $n>0$; the mass scale is $4\pi a^3\rho_c$.

The central series starts $\theta=1-\xi^2/6+n\xi^4/120+\cdots$. The computation evolves $\theta'=-q/\xi^2$ and $q'=\xi^2\theta^n$ to the first zero. Exact checks are $\theta=\sin\xi/\xi$ for $n=1$ and $\theta=(1+\xi^2/3)^{-1/2}$ for $n=5$. The latter has infinite radius but finite limiting mass $q=\sqrt3$.`,
caption:'Choose the polytropic index and inspect a radius on a logarithmically compressed radial axis. Compare the regular Lane–Emden function, density and enclosed mass. A missed edge in the finite computational window is reported as unresolved.',
scope:'Barotropic spherical Newtonian equilibrium. A polytrope is not a calibrated solar model. The numerical window ends at xi=10000; near n=5 an edge beyond that window is not called infinite. Only the exact n=5 solution establishes infinite radius here. Positive-part continuation is used solely to locate a zero, never to plot negative density.',
refs:['Krumholz, notes 7, PDF pp.2–4: polytropic reduction and Lane–Emden variables; exact checks and numerical scheme supplied here'],links:{source:ANU+'notes7.pdf'},tags:['polytropes','stellar structure'],viz:V.polytrope},
{num:'6.7',kind:'Model',name:'Energy transport by radiative diffusion',deps:['astro-5.4','astro-6.1','astro-5.7'],
statement:String.raw`In an optically thick medium close to local thermodynamic equilibrium, the radiative flux is
$$F=-\frac{ac}{3\kappa_R\rho}\frac{d(T^4)}{dr},$$
where $a=4\sigma/c$ and $\kappa_R$ is the Rosseland transport opacity. Combining this with spherical hydrostatics gives the required radiative gradient
$$\nabla_{\rm rad}=\frac{3\kappa_R LP}{16\pi acGmT^4}.$$
It is the temperature gradient radiation would require to carry the local luminosity.`,
idea:String.raw`Photons nearly isotropize over many mean free paths. Expanding the thermal intensity about a local point leaves a net flux down the temperature gradient; the angular average supplies the factor one third. Greater opacity shortens the mean free path and requires a steeper gradient for a fixed flux.

The interactive example integrates a thin, prescribed-density layer: $x=z/H_{P0}$, $P/P_0=1-x$ and $T^4/T_0^4=1-\phi x$, where $\phi=3\kappa_R\rho F H_{P0}/(acT_0^4)$. It computes the local logarithmic gradient directly.`,
caption:'Increase opacity or the imposed flux through a thin layer. Inspect its temperature and required logarithmic gradient, comparing that gradient with 0.4 for a monatomic ideal gas.',
scope:'Diffusion requires optical depth much greater than one across the layer. The example prescribes constant density, gravity and flux over 0.03 initial pressure scale heights; it is not a complete equation-of-state solution. Crossing the adiabatic gradient diagnoses failure of purely radiative stability under uniform composition, rather than simulating a readjusted convective star.',
refs:['Krumholz, notes 5, PDF pp.7–8: radiative diffusion and Rosseland opacity; dimensional and angular factors derived explicitly here','Krumholz, notes 8, PDF pp.3–5: radiative versus adiabatic gradient'],links:{source:ANU+'notes5.pdf',convection:ANU+'notes8.pdf'},tags:['radiative diffusion','opacity'],viz:V.radiation},
{num:'6.8',kind:'Principle',name:'Schwarzschild criterion for convection',deps:['astro-6.7','fluid-2.4','fluid-2.5'],
statement:String.raw`For a uniform-composition ideal gas, a small pressure-balanced adiabatic parcel displacement is buoyantly unstable when
$$\nabla>\nabla_{\rm ad},\qquad \nabla=\frac{d\ln T}{d\ln P},$$
with $\nabla_{\rm ad}=(\gamma-1)/\gamma$. Locally,
$$N^2=\frac{g}{H_P}(\nabla_{\rm ad}-\nabla).$$
Positive $N^2$ restores small displacements; negative $N^2$ amplifies them.`,
idea:String.raw`A rising parcel expands to its surroundings' pressure. It cools adiabatically; if the environment cools faster with height, the parcel becomes hotter and less dense, so buoyancy pushes it farther upward.

For the constant-gradient atmosphere shown, $u=z/H_{P0}$ gives $T_e/T_0=1-\nabla u$ and $P_e/P_0=(1-\nabla u)^{1/\nabla}$, with the exponential isothermal limit. The parcel has $T_p/T_0=(P_e/P_0)^{\nabla_{\rm ad}}$. Its instantaneous acceleration is $g(T_p/T_e-1)$; this finite-displacement force is computed without inventing a full convective trajectory.`,
caption:'Move the parcel upward or downward and vary the environmental gradient and adiabatic index. Compare parcel and ambient temperatures with the signed buoyant acceleration; equality of the gradients is neutral.',
scope:'Uniform molecular weight, ideal gas, rapid pressure equilibration and adiabatic parcel motion in a constant-gravity environment. Composition gradients require the Ledoux criterion; radiative exchange, entrainment and nonlinear convection are omitted.',
refs:['Krumholz, notes 8, PDF p.1 and pp.3–5: pressure-balanced adiabatic displacements and convective instability; finite-displacement atmosphere derived here'],links:{source:ANU+'notes8.pdf'},tags:['convection','buoyancy'],viz:V.parcel},
{num:'6.9',kind:'Law',name:'Eddington luminosity',deps:['astro-5.2','astro-6.1','em-11.6'],
statement:String.raw`In a spherical steady radiation field, matter with flux-mean opacity $\kappa_F$ feels outward radiative acceleration $\kappa_F L/(4\pi r^2c)$. Balancing it with inward gravity gives
$$L_{\rm Edd}=\frac{4\pi GMc}{\kappa_F},$$
$$\Gamma=\frac{L}{L_{\rm Edd}}.$$
For the stated force model, the net outward acceleration is $(GM/r^2)(\Gamma-1)$.`,
idea:String.raw`A photon carries momentum $E/c$. A flux $F$ transfers momentum per unit mass at rate $\kappa_F F/c$, using the momentum-transfer opacity. Substituting $F=L/(4\pi r^2)$ makes both radiation and gravity fall as $r^{-2}$, so their ratio is independent of test radius.

For fully ionized hydrogen–helium gas, electron scattering gives approximately $\kappa_{\rm es}=0.02(1+X)$ square metres per kilogram; electric forces couple electrons and ions.`,
caption:'Vary stellar mass, luminosity, flux-mean opacity and test radius. Opposed force arrows and their radial curves show when the assumed radiation force exceeds gravity.',
scope:'Spherical, steady flux and prescribed opacity with matter and radiation coupled as stated. This is a force-balance scale, not an absolute luminosity ceiling for every geometry or an automatic mass-loss simulation. Flux-mean opacity here is distinct from Rosseland opacity in the diffusion lesson.',
refs:['Krumholz, notes 7, PDF pp.1–2: radiative force and Eddington scale; photon momentum derivation supplied here'],links:{source:ANU+'notes7.pdf'},tags:['radiation force','luminosity'],viz:V.eddington},
{num:'6.10',kind:'Model',name:'Proton–proton chain and CNO cycle',deps:['rel-4.11'],
statement:String.raw`Hydrogen burning can assemble helium through the proton–proton chains or through catalytic carbon–nitrogen–oxygen cycles. A completed net conversion, including positron annihilation with ambient electrons, is
$$4p+2e^-\longrightarrow{}^4\mathrm{He}+2\nu_e,$$
with about 26.73 MeV released. Neutrinos carry some of that energy away. In a closed CN cycle the carbon catalyst is regenerated rather than consumed.`,
idea:String.raw`The pp I ledger starts with six protons, forms two helium-3 nuclei, then returns two protons while making helium-4. The CN ledger captures four protons through carbon, nitrogen and oxygen intermediates and returns carbon-12. Every displayed step conserves baryon number, charge and lepton number when positrons and neutrinos are counted.

The rate comparison is an explicit teaching proxy: steady pp I intermediates and a cold CN cycle limited by nitrogen-14 proton capture. It integrates constant-S nonresonant cross sections using dated B16 zero-energy factors. It treats all catalyst mass as nitrogen-14 for the rate estimate. It omits screening, S-factor energy dependence and competing branches; composition therefore matters, and no universal crossover temperature is imposed.`,
caption:'Step through the pp I or CN reaction ledger, then change temperature, density and composition. Compare the calculated heat rates and inspect the composition-dependent crossover of this stated proxy.',
scope:'The ledger shows nuclear reactions before ambient positron annihilation: approximately 24.69 MeV nuclear release plus 2.04 MeV from annihilation yields the quoted net energy. Heat estimates use rounded 98% deposition for pp I and 25 MeV per CN cycle. These are illustrative rates, not a complete stellar reaction network or B16 energy-generation tables.',
refs:['Krumholz, notes 6, PDF pp.6–17: charged-particle rates, pp branches and catalytic cycles; inconsistent numerical rate examples not adopted','Vinyoles et al. (2017), arXiv:1611.09867v4, Table 2, PDF p.5: S11(0) and S114(0)'],links:{source:ANU+'notes6.pdf',factors:B16},tags:['nuclear fusion','reaction networks'],viz:V.burning},
{num:'6.11',kind:'Phenomenon',name:'Quantum tunnelling and the Gamow peak',deps:['astro-6.10','qm-3.15','thermo-6.15'],
statement:String.raw`For a nonresonant charged-particle reaction, write $\sigma(E)=S(E)E^{-1}\exp[-\sqrt{E_G/E}]$, where $E_G=2\mu c^2(\pi\alpha Z_1Z_2)^2$. The Maxwell-averaged rate contains
$$\langle\sigma v\rangle=\sqrt{\frac8{\pi\mu}}(k_BT)^{-3/2}I,$$
$$I=\int_0^\infty S(E)e^{-g(E)}\,dE,$$
$$g(E)=\frac{E}{k_BT}+\sqrt{\frac{E_G}{E}}.$$
For constant $S$, the integrand peaks at $E_0=[E_G(k_BT)^2/4]^{1/3}$.`,
idea:String.raw`Higher-energy particles are rarer in the thermal distribution but tunnel more readily through the repulsive barrier. Their competition selects an energy window above the thermal scale. Multiplying relative-energy density, relative speed and cross section cancels the extra powers of $\sqrt E$; adding another Maxwell square-root factor would give the wrong integrand.

Expanding its exponent about $E_0$ gives the Gaussian approximation $\exp[-4(E-E_0)^2/\Delta^2]$, with $\Delta=4\sqrt{E_0k_BT/3}$. The visualization compares this approximation with the actual constant-S integral and reports the local logarithmic temperature slope.`,
caption:'Choose proton–proton or proton–nitrogen-14 capture and change temperature. Compare thermal suppression and tunnelling on a logarithmic plot, then compare their normalized product with its Gaussian approximation.',
scope:'Nonrelativistic Maxwell distribution, unscreened nonresonant barrier, constant S and mass-number approximation for the reduced mass. The weak pp normalization is supplied by its S factor, not by Coulomb tunnelling alone. Adaptive quadrature diagnostics are estimates, not certified error bounds. The plotted kernel is divided by its peak value.',
refs:['Krumholz, notes 6, PDF pp.6–9: Gamow factor, Maxwell averaging and peak approximation','Vinyoles et al. (2017), Table 2, PDF p.5: dated zero-energy S factors'],links:{source:ANU+'notes6.pdf',factors:B16},tags:['tunnelling','fusion'],viz:V.gamow},
{num:'6.12',kind:'Model',name:'Standard solar model',deps:['astro-6.6','astro-6.7','astro-6.10'],
statement:String.raw`A standard solar model evolves a one-solar-mass star with specified composition, equation of state, opacity, diffusion and nuclear rates. Mass continuity, hydrostatics, energy conservation and transport determine its structure once closure laws, boundary conditions and calibration are supplied. Initial helium, initial metal abundance and a convection parameter are adjusted to reproduce the adopted solar luminosity, radius and surface metal-to-hydrogen ratio at the adopted age.`,
idea:String.raw`The structural equations include $dm/dr=4\pi r^2\rho$, $dP/dr=-Gm\rho/r^2$ and $dL/dr=4\pi r^2\rho\epsilon$, together with a temperature-gradient law. A present-day calibration is a constrained evolutionary calculation, not merely integration of a polytrope.

The dated B16 models provide a concrete test: the GS98 and AGSS09met abundance choices predict different convective-boundary radii and surface helium fractions. Helioseismic benchmarks favor different degrees of agreement. The solar-abundance problem persists; confirming neutrino flavor change did not establish every ingredient of the solar model.`,
caption:'Select a published B16 composition model. Compare its convective-envelope boundary and surface helium with the quoted helioseismic marginal intervals; the drawing displays table values and does not solve or interpolate a new solar model.',
scope:'Values and one-sigma marginal uncertainties are from B16 (2017), Table 4. Its model correlations between surface helium and boundary radius are reported in the readout; independent bars do not imply independent observables or a joint fit. No raw solar profiles were acquired. B16 adopted 4.57 Gyr and luminosity 3.8418e26 W; the other teaching examples use nominal 3.828e26 W.',
refs:['Vinyoles et al., A New Generation of Standard Solar Models, arXiv:1611.09867v4 (2017), PDF pp.2–3, Tables 2–4 on pp.5–6 and 8','Krumholz, notes 7, PDF pp.1–4: structure equations and calibration'],links:{source:B16,structure:ANU+'notes7.pdf'},tags:['solar model','helioseismology'],viz:V.solar},
{num:'6.13',kind:'Phenomenon',name:'Solar neutrino problem',deps:['astro-6.12'],
statement:String.raw`Solar detectors sensitive mainly to electron neutrinos measured fewer events than expected from solar fusion. SNO separated charged-current (CC) sensitivity to electron neutrinos from neutral-current (NC) sensitivity to all active flavors. Under its stated boron-8 spectral assumption, the 2002 result gave effective fluxes 1.76 (CC) and 5.09 (NC), in units of $10^6\,\mathrm{cm}^{-2}\mathrm{s}^{-1}$. The inferred non-electron component was inconsistent with zero at the collaboration's reported 5.3-sigma significance.`,
idea:String.raw`The apparent deficit depends on what a detector counts. In the displayed measurement model, let $\Phi$ be total active flux and $f$ its electron-flavor fraction. Then $\Phi_{\rm CC}=f\Phi$ and $\Phi_{\rm NC}=\Phi$. Lowering $f$ reduces the electron-sensitive channel without removing active neutrinos from the NC channel.

SNO's total active flux agreed with the contemporary solar prediction quoted in that paper, $5.05^{+1.01}_{-0.81}$ in the same units. Flavor conversion resolves the electron-neutrino deficit while preserving the fusion energy-source test. This elementary mixture diagram does not calculate oscillation parameters or an MSW survival probability.`,
caption:'Set the total active flux and electron-flavor fraction. Compare predicted CC and NC responses with the dated measurements, keeping statistical and systematic intervals separate. Try the all-electron case and the measured-mixture preset.',
scope:'SNO 2002 effective boron-8 fluxes assume an undistorted standard spectrum. Electron kinetic analysis threshold: 5 MeV; NC deuteron breakup neutrino threshold: 2.2 MeV. CC and NC estimates are correlated, so the plotted marginal bars must not be combined into an independent-channel significance. The published 5.3-sigma result comes from the collaboration analysis, not from these controls. Sterile flavors and an ES response model are not included.',
refs:['SNO Collaboration, Direct Evidence for Neutrino Flavor Transformation from Neutral-Current Interactions, arXiv:nucl-ex/0204008v2 (2002), abstract and PDF pp.2, 4–6'],links:{source:'https://arxiv.org/pdf/nucl-ex/0204008'},tags:['solar neutrinos','flavor'],viz:V.neutrinos},
{num:'6.14',kind:'Paper',name:'Energy Production in Stars',paper:{authors:'H. A. Bethe',year:1939,title:'Energy Production in Stars',venue:'Physical Review 55 (5): 434–456',doi:'10.1103/PhysRev.55.434'},introduces:['astro-6.10'],deps:['astro-6.11','astro-6.4','rel-4.11'],
statement:String.raw`Bethe's 1939 paper organized nuclear-reaction rates and stellar conditions into an explanation of stellar power, including the carbon–nitrogen catalytic cycle. Carbon can return at the end of a chain that converts four protons into helium, so a small catalyst abundance can process a much larger hydrogen reservoir. Charged-particle reaction rates make the competition between burning paths strongly temperature dependent.`,
idea:String.raw`The original argument follows the reaction chain, estimates intermediate lifetimes and identifies the slow capture that controls a completed cycle. Catalytic recycling separates the rate-setting abundance from the amount of hydrogen fuel available.

Historical rate estimates and assumed core temperatures led to different conclusions about the Sun's dominant channel. The present Sun is predominantly powered by pp burning. The interactive curves use the modern constant-S proxy specified in the neighboring lessons, with 2017 tabulated inputs; they are not Bethe's 1939 numerical tables. Their changing local slopes explain why fixed global $T^4$ and $T^{18}$ laws are only rough range-dependent descriptions.`,
caption:'Change temperature and catalyst abundance in the explicitly modern proxy. Compare heat rates and their local logarithmic temperature slopes; the readout verifies that a completed CN ledger returns carbon-12.',
scope:'Original paper header, abstract and scientific paragraphs of section 7 on PDF pp.12–14 were consulted. Original rate tables were not transcribed. Modern stoichiometry and numerical inputs are identified separately; neither this comparison nor neutrino evidence turns the original historical solar-rate estimate into a current calibrated solar model.',
refs:['Bethe, Energy Production in Stars, Physical Review 55 (1939), 434–456: abstract and section 7, PDF pp.12–14','Krumholz, notes 6, PDF pp.6–17: modern burning networks','Vinyoles et al. (2017), Table 2, PDF p.5: modern S-factor inputs'],links:{source:'https://journals.aps.org/pr/pdf/10.1103/PhysRev.55.434',modern:ANU+'notes6.pdf',factors:B16},tags:['stellar fusion','history'],viz:V.bethe}
]};
