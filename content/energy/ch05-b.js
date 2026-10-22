import {hydroWidget,tidalWidget,waveWidget,geothermalWidget,biomassWidget,paperWidget} from './ch05.ui.shared.js';
const thermo='https://ocw.mit.edu/courses/res-2-008-thermodynamics-and-climate-change-summer-2020/mitres-2-008su22_book.pdf';
export default {collection:'energy',chapter:5,items:[
 {
 num:'5.7',kind:'Model',name:'Hydropower: P = ρgQH',
 statement:String.raw`For steady incompressible water flow $Q\ge0$ through a turbine, let $H_{\rm net}\ge0$ be the total hydraulic head available to that device after other losses. The hydraulic resource and chosen electrical output are
$$\begin{aligned}P_h&=\rho gQH_{\rm net},\\P_e&=\eta P_h,\quad 0\le\eta\le1.\end{aligned}$$
Here the chosen loss fraction $\ell$ gives $H_{\rm net}=(1-\ell)H_{\rm gross}$. Total head includes elevation, pressure and kinetic terms; it need not equal a geometric drop alone.`,
 idea:String.raw`For a unit mass, the available mechanical-energy difference is $gH_{\rm net}$. Continuity gives mass rate $\rho Q$, and their product gives power by the device energy balance (energy-2.1). Bernoulli (fluid-2.9) can connect sections outside the work-extracting device; a turbine work term is needed across it. The prescribed loss and conversion fractions are distinct steps in that balance.`,
 caption:String.raw`Change flow, gross total head, hydraulic loss fraction or turbine-generator efficiency. The two curves compare net hydraulic resource and chosen electrical output; the gold point gives your selected flow. Exact zero flow, head or efficiency has its corresponding zero output, while tiny positive inputs retain rescuing unit factors before rounding.`,
 deps:['fluid-1.5','fluid-2.9','energy-2.1'],tags:['hydropower','head','energy balance'],
 refs:['Independent steady control-volume mechanical-energy balance; actual fluid-2.9 and energy-2.1 proof inputs'],
 scope:String.raw`Steady incompressible flow, chosen constant density 1000 kg/m³ and standard gravity 9.80665 m/s², with nonnegative available total head and declared losses. No rainfall/catchment data, cavitation, seasonal storage, measured efficiency or site generation forecast.`,viz:hydroWidget,
 },
 {
 num:'5.8',kind:'Model',name:'Tidal power',
 statement:String.raw`A level basin of constant area $A$ starts at height $H\ge0$ above a fixed low sea and empties in one direction. Its ideal gravitational resource is
$$E_0=\int_0^H\rho gAh\,dh=\tfrac12\rho gAH^2.$$
For the chosen orifice clock $dh/dt=-b\sqrt h$, $b>0$, the draining time is $t_*=2\sqrt H/b$ when $H>0$. With $f=t/t_*\in[0,1]$,
$$\begin{aligned}h(f)&=H(1-f)^2,\\E_{\rm rem}(f)&=E_0(1-f)^4,\\E_{\rm rel}(f)&=E_0[1-(1-f)^4].\end{aligned}$$
A chosen conversion fraction multiplies the released energy.`,
 idea:String.raw`Removing a slice of volume $A\,dh$ at current head $h$ releases $\rho gAh\,dh$, so the resource scales with the square of initial head. While $h>0$, differentiating $\sqrt h$ gives the constant rate $-b/2$; stop the solution at emptying rather than continue to negative head. Substitute that solution into the remaining potential energy. Lunar tidal forcing (mech-9.3) motivates a changing sea in nature but does not supply this model's site head or fixed boundary.`,
 caption:String.raw`Move the fraction of ideal draining time, chosen initial head, basin area and conversion fraction. The actual head rectangle shrinks according to the orifice law; released and remaining energies sum to the initial resource. This is one ideal emptying event, without an assumed 12.4-hour refill or two-way generation schedule.`,
 deps:['energy-5.7','energy-2.1'],see:['mech-9.3'],tags:['tides','potential energy','basin'],
 refs:['Independent constant-area basin potential integral and separated orifice-law solution'],
 scope:String.raw`Constant basin area, fixed low sea, no inflow, constant chosen seawater density 1025 kg/m³ and chosen conversion efficiency. The normalized clock has no calibrated discharge coefficient or event duration. At H=0 all energies and head are zero and f is only a formal index. It is not a predicted local tide, lagoon geometry, refill cycle or tidal-stream turbine bound.`,viz:tidalWidget,
 },
 {
 num:'5.9',kind:'Model',name:'Ocean wave power',
 statement:String.raw`For a small-amplitude regular deep-water gravity wave of crest-to-trough height $H=2a$ and period $T$, mean energy per horizontal area and resource flux per metre of crest are
$$\begin{aligned}E&=\rho gH^2/8,\\c_g&=gT/(4\pi),\\P_{\rm crest}&=Ec_g=\rho g^2H^2T/(32\pi).\end{aligned}$$
For orthogonal spectral components with positive variance $m_0$, define $H_{m0}=4\sqrt{m_0}$ and energy period $T_e=(\sum_j m_jT_j)/m_0$. Then
$$\begin{aligned}E&=\rho gH_{m0}^2/16,\\P_{\rm crest}&=\rho g^2H_{m0}^2T_e/(64\pi).\end{aligned}$$
Regular height $H$ and spectral significant height $H_{m0}$ use different conventions; the factor of two is essential.`,
 idea:String.raw`Use the deep-water limit of waves-3.7: $\omega^2=gk$. With $\phi=kx-\omega t$, take $\eta=a\cos\phi$ and velocity potential $\Phi=(ag/\omega)e^{kz}\sin\phi$. Integrating mean kinetic energy over depth gives $\rho ga^2/4$, equal to mean surface potential energy. The linear pressure and horizontal velocity are $p'=\rho ga e^{kz}\cos\phi$ and $u=a\omega e^{kz}\cos\phi$. Thus
$$\begin{aligned}\int_{-\infty}^0\langle p'u\rangle dz&=\rho ga^2\omega/(4k)\\&=E\,\omega/(2k)=Ec_g.\end{aligned}$$
This identifies energy transport with the group speed in this specific wave model, beyond the envelope interpretation in waves-3.5. Sum component energies and fluxes to obtain the spectral convention.`,
 caption:String.raw`Switch between a regular wave and a finite three-tone spectral illustration. For spectral mode, the height is $H_{m0}$ and period is $T_e$: component periods are $0.6,1,1.4$ times $T_e$, with variance weights $1/4,1/2,1/4$. Their amplitudes are $H_{m0}\sqrt{w_j/8}$ and fixed phases are 0, 1 and 2 radians. The plotted signal is computed from these components. Change height and period, then compare surface displacement, resource flux and the selected gold point.`,
 deps:['waves-3.7','waves-3.5'],tags:['waves','energy flux','ocean'],
 refs:['DOE-hosted EPRI 2011, Mapping and Assessment of the United States Ocean Wave Energy Resource, actual Appendix A-5–A-7 / PDF 111–113','Independent regular-wave pressure-work integral and finite orthogonal-spectrum sum'],
 links:{spectralConvention:'https://www.energy.gov/sites/prod/files/2013/12/f5/mappingandassessment.pdf'},
 scope:String.raw`Linear deep-water gravity waves, no surface tension, currents or conversion device. The 1025 kg/m³ density is chosen. The regular mode reports ka and marks 0.1 as a chosen illustration threshold, not a universal validity certificate. The finite spectral signal is orthogonal over 21Te, with mean variance Hm0²/16; it is not a measured random sea. Spectral period means energy period, not peak period. Resource per crest length is not electrical output or device capture width.`,viz:waveWidget,
 },
 {
 num:'5.10',kind:'Model',name:'Geothermal energy and reservoir depletion',
 statement:String.raw`A chosen lumped reservoir has constant heat capacity $C$, initial temperature $T_0>T_c$ and no replenishment. Extract heat at $\dot Q=h(T-T_c)$, $h>0$. The energy balance and exact solution are
$$\begin{aligned}C\dot T&=-h(T-T_c),\\T(t)&=T_c+(T_0-T_c)e^{-ht/C}.\end{aligned}$$
If a chosen engine achieves fraction $\eta\in[0,1]$ of the instantaneous Carnot efficiency, then
$$\begin{aligned}P_e(t)&=\eta h\frac{(T-T_c)^2}{T},\\Q(t)&=C(T_0-T),\\W_e(t)&=\eta C B(T),\\B(T)&=T_0-T\\&\quad-T_c\log(T_0/T).\end{aligned}$$
All temperatures in these expressions are absolute.`,
 idea:String.raw`The reservoir's first-law balance reduces to a linear equation for its excess temperature, solved by the integrating factor of ode-1.4. The Carnot input (energy-2.2) bounds conversion from the current reservoir temperature to the fixed cold boundary. Multiplying heat extraction by the chosen fraction of that bound gives power. To integrate electricity, use $h(T-T_c)dt=-C\,dT$ and integrate $\eta C(1-T_c/T)$ from the current temperature to $T_0$. Available heat and recoverable work are different quantities.`,
 caption:String.raw`Change model time, heat capacity, conductance, initial temperature excess or fraction of Carnot. Temperature and power curves follow the actual cooling law; the gold point selects time. The readout integrates extracted heat and electrical work using the same balance. Time is measured in declared 365.25-day years, with a fixed 300 K cold boundary.`,
 deps:['energy-2.1','energy-2.2','ode-1.4'],tags:['geothermal','finite reservoir','Carnot'],
 refs:['Independent lumped thermal balance, linear decay and finite-reservoir work integral; actual energy-2.2 and ode-1.4 proof inputs'],
 scope:String.raw`Chosen lumped reservoir with constant heat capacity, linear extraction conductance, 300 K environment and no replenishment. No fracture/flow geology, accessible rock resource, conduction resupply, sustainable surface heat flux, core-temperature efficiency or plant calibration is inferred. Direct small-time heat/work evaluation retains original factors when the displayed temperature change cannot resolve them.`,viz:geothermalWidget,
 },
 {
 num:'5.11',kind:'Concept',name:'Biomass and the efficiency of photosynthesis',
 statement:String.raw`An annual harvested-energy efficiency must use matched area, time and energy boundaries. Let $\bar I$ be mean incident whole-spectrum irradiance over area $A$ and time $\tau$. With a chosen net harvested chemical-energy fraction $\eta_b$, chosen dry-fuel heating value $L$ and chosen fuel-to-electric fraction $\eta_e$,
$$\begin{aligned}E_{\rm sun}&=\bar I A\tau,\\E_b&=\eta_b E_{\rm sun},\\m_{\rm dry}&=E_b/L,\\\bar P_e&=\eta_e\eta_b\bar I A.\end{aligned}$$
Annual net harvest efficiency is different from leaf quantum yield, gross photosynthesis or efficiency during a brief growth interval.`,
 idea:String.raw`First define incident energy over the same land and interval as the harvested chemical energy. Their ratio is dimensionless; multiplying photon quantum yield by incident power would mix distinct definitions. Divide harvested energy by an explicitly chosen dry heating value to obtain mass, then apply a separate electrical conversion fraction. The blackbody spectrum of energy-4.1 illustrates why spectrum conventions matter; it is not substituted here for a measured canopy spectrum or annual irradiance.`,
 caption:String.raw`Choose annual net chemical fraction, mean incident irradiance, harvest area, dry heating value and electrical fraction. The mass curve uses tonnes over a declared 365.25-day model year; the readout gives kilograms. Bars 0, 1 and 2 are incident, harvested chemical and electrical equivalent powers. The small downstream bars share the incident-power axis; the readout provides their exact computed values.`,
 deps:['energy-1.1','energy-4.1'],tags:['biomass','photosynthesis','energy accounting'],
 refs:['Blankenship et al., Comparing Photosynthetic and Photovoltaic Efficiencies and Recognizing the Potential for Improvement (2011), actual original PDF 2–3 / printed 805–806 for efficiency boundaries','Independent chosen annual harvested-energy and dry-fuel accounting'],
 links:{efficiencyDefinitions:'https://www.gfmoorelab.com/uploads/4/2/3/1/42315775/blankenship_science_2011.pdf'},
 scope:String.raw`All irradiance, annual net efficiency, dry heating value and electrical conversion inputs are chosen. Heating value uses the selected dry-fuel convention, without a measured feedstock or moisture correction. No calibrated crop yield, universal sub-1% bound, national land/food availability, lifecycle balance, carbon neutrality or current photovoltaic comparison is asserted.`,viz:biomassWidget,
 },
 {
 num:'5.12',kind:'Paper',name:'Das Maximum der theoretisch möglichen Ausnützung des Windes',
 paper:{authors:'A. Betz',year:1920,title:'Das Maximum der theoretisch möglichen Ausnützung des Windes durch Windmotoren',venue:'Zeitschrift für das gesamte Turbinenwesen 26: 307–309'},
 introduces:['energy-5.2'],verify:true,
 statement:String.raw`This historical entry records the planned 1920 Betz paper and its connection to the ideal single-disk wind bound. **The original article body and the restricted 2013 translation body have not been read.** The visualization and derivation here are independent modern teaching constructions under the explicit hypotheses of energy-5.2; they do not authenticate the original wording, figures or precise historical derivation.`,
 idea:String.raw`In the modern one-disk balance, continuity fixes three section areas:
$$\begin{aligned}A_{\rm up}&=A(1-a),\\A_w&=A\frac{1-a}{1-2a},\quad 0\le a<1/2.\end{aligned}$$
The disk slows the stream and widens its downstream section. Combining momentum with a pressure jump gives $C_P=4a(1-a)^2$, whose derivative vanishes at $a=1/3$. The computed section radii are proportional to square roots of these area ratios. Their connecting lines are schematic boundaries, rather than solved streamlines or a reproduced original diagram.`,
 caption:String.raw`Move the authored induction parameter to compare the actual three-section area ratios and modern momentum coefficient. At one third induction, the coefficient reaches $16/27$. The construction is explicitly modern, and the original-body verification flag remains visible. Use the reciprocal link to energy-5.2 for the complete stated hypotheses.`,
 deps:['energy-5.1','fluid-1.5','fluid-2.12'],see:['energy-5.2'],tags:['wind','history','actuator disk'],
 refs:['Frozen planned historical bibliography; original 1920 and restricted 2013 translation bodies unread','Godart, Thermodynamics and Climate Change, actual PDF 194–201 / printed 191–198: independent modern control-volume treatment'],
 links:{modernDerivation:thermo},
 scope:String.raw`Historical attribution and exact original body remain unverified. Restricted-access translation was not recovered from alternate copies. This authored geometry assumes a steady unconfined incompressible single disk, no swirl or added energy and equal remote ambient pressure. It does not reproduce original figures, real-rotor data or a universal bound on other device classes.`,viz:paperWidget,
 },
]};
