import {lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8, lesson9, lesson10, lesson11, lesson12} from './ch06.viz.js';

export default {
 collection:'energy',chapter:6,title:'Storage',
 summary:"Storage separates energy capacity from power and makes conversion losses explicit. These bounded models connect reversible cell voltage, charge estimation and cycling assumptions to water, gas, rotor, capacitor and hydrogen stores. Each comparison declares its physical boundary and distinguishes illustrative specifications from measured device data.",
 items:[
  {
   num:"6.1",
   kind:"Definition",
   name:"Energy capacity, power capacity and round-trip efficiency",
   deps:["energy-1.1"],
   statement:String.raw`Energy capacity $E_{\max}$ measures how much energy a store can hold; charge and discharge power ratings limit how fast electrical energy crosses its boundary. For constant ratings $P_c,P_d>0$ and chosen efficiencies $0<\eta_c,\eta_d\le1$, the ideal charge/discharge legs obey
$$\begin{aligned}\dot E_c&=\eta_cP_c,\\\dot E_d&=-P_d/\eta_d,\\T_c&=E_{\max}/(\eta_cP_c),\\T_d&=\eta_dE_{\max}/P_d.\end{aligned}$$
A positive-input cycle returning to its initial stored energy has round-trip efficiency $E_{\rm out}/E_{\rm in}=\eta_c\eta_d$. A partial charge is not a completed round trip.`,
   idea:String.raw`Integrate power over each leg, stop charging at full capacity and stop discharge at empty. Electrical input splits into stored energy and charging loss; later released stored energy splits into delivered electricity and discharge loss. At every selected instant, input equals remaining stored energy plus output plus both accumulated losses. A kilowatt is a rate, a kilowatt-hour is energy, and their ratio is a duration only after specifying the boundary and efficiencies.`,
   caption:String.raw`Move cycle progress from empty through full to empty again. The time plot uses actual hours, so unequal power ratings change the two slopes and leg durations. The adjacent energy ledger closes at every instant; change capacity, power or either efficiency and compare what changes. Zero capacity has no transferred-energy round-trip ratio.`,
   scope:String.raw`A single ideal store with constant electrical power on each active leg, fixed charge/discharge efficiencies, no idle loss and no simultaneous charging/discharging. Stored-energy capacity is inside the conversion boundary. The right-hand power at the full event is discharge power; both powers are zero at the completed empty endpoint. Efficiencies are chosen inputs, not measured equipment values.`,
   refs:["Independent integration of constant-power charge/discharge and exact energy balance", "MIT 10.626, Lecture 3 (2014), storage conventions; own corrected capacitor balance"],
   links:{"storageNotes": "https://ocw.mit.edu/courses/10-626-electrochemical-energy-systems-spring-2014/a92649689a63cbda3675655ea1ea088f_MIT10_626S14_Lec3.pdf"},
   tags:["storage", "energy balance", "power"],
   viz:lesson1,
  },
  {
   num:"6.2",
   kind:"Model",
   name:"Cell voltage from free energy: the Nernst equation",
   deps:["pchem-8.6", "pchem-8.5"],
   statement:String.raw`For a specified whole-cell reaction transferring $n$ electrons, reversible operation at constant temperature and pressure gives $\Delta_rG=-nFE$. With positive dimensionless activities $a_i$ and signed stoichiometric coefficients $\nu_i$,
$$\begin{aligned}\mu_i&=\mu_i^\circ+RT\ln a_i,\\Q&=\prod_i a_i^{\nu_i},\\E&=E^\circ-\frac{RT}{nF}\ln Q.\end{aligned}$$
The teaching reaction consumes charged species and forms discharged species against a fixed reference, with $Q=\Gamma(1-x)/x$, $0<x<1$ and $\Gamma>0$. Its open-circuit voltage rises with charged fraction $x$. Here $RT/F=k_BT/e$ with exact SI constants.`,
   idea:String.raw`Chemical potentials add according to reaction stoichiometry: $\Delta_rG=\Delta_rG^\circ+RT\ln Q$. At fixed temperature and pressure, the largest reversible non-expansion work delivered is the decrease in Gibbs energy; passing $nF$ coulombs through voltage $E$ delivers $nFE$ joules per mole of reaction. Combining these identities yields the Nernst equation with the whole-cell electron count intact. The chosen activity quotient is an explicitly idealized composition model, not a fit to a measured battery plateau.`,
   caption:String.raw`Change charged fraction, temperature, electron count, standard voltage or activity ratio. The voltage curve and selected point show the Nernst response; the second panel separates the standard Gibbs term from the composition shift in kJ per mole of reaction. Near equal activities, the shift changes sign without losing its tiny nonzero value.`,
   scope:String.raw`Reversible open-circuit potential at fixed temperature/pressure, a fixed reference electrode and the declared activity model. The widget excludes zero activities and uses $0.01\le x\le0.99$. It omits polarization, phase coexistence, hysteresis, transport and measured chemistry-specific voltage curves. One mole means one mole of the specified whole-cell reaction; $n$ is its electron stoichiometry, not an adjustable unit convention.`,
   refs:["MIT 10.626, Thermodynamics of Electrochemical Reactions, rewritten 2014, selected PDF pp. 1–7", "Independent whole-cell Gibbs-work derivation and ideal activity model"],
   links:{"nernstNotes": "https://ocw.mit.edu/courses/10-626-electrochemical-energy-systems-spring-2014/548952ce8b570fbbde640f2e561c4f96_MIT10_626S14_S11lec08.pdf"},
   tags:["electrochemistry", "free energy", "voltage"],
   viz:lesson2,
  },
  {
   num:"6.3",
   kind:"Model",
   name:"Battery as a source with internal resistance",
   deps:["circ-1.7", "energy-6.2"],
   statement:String.raw`A constant open-circuit source $V_{\rm oc}>0$ in series with internal resistance $R>0$ has terminal voltage
$$\begin{aligned}V&=V_{\rm oc}-IR,\\P_{\rm chem}&=V_{\rm oc}I,\\P_{\rm terminal}&=VI,\\P_{\rm heat}&=I^2R,\\P_{\rm chem}&=P_{\rm terminal}+P_{\rm heat}.\end{aligned}$$
Current is positive for discharge and negative for charge. Discharge is restricted to $0\le I\le V_{\rm oc}/R$. Maximum terminal discharge power occurs at $I=V_{\rm oc}/(2R)$ and equals $V_{\rm oc}^2/(4R)$.`,
   idea:String.raw`Apply the circuit voltage balance to the ideal source and resistor, then multiply by signed current. During discharge, chemical power supplies terminal power and heat. During charge, terminal input supplies stored chemical power and heat. The selected current is a fraction of the short-circuit magnitude, so the exact short-circuit endpoint has zero terminal voltage and all source power becomes heat. The maximum-power point has 50% instantaneous discharge efficiency; it is not the most efficient operating point.`,
   caption:String.raw`Switch between charge and discharge and move the current fraction. Read terminal voltage on the signed current–voltage line, then compare useful power and resistor heat. The selected power ledger uses the same current and resistance; at zero current its efficiency is undefined because no power is transferred.`,
   scope:String.raw`An instantaneous Thevenin approximation with chosen constant open-circuit voltage and resistance, no capacity depletion, reaction kinetics, temperature feedback or frequency dependence. Charging efficiency here is chemical power divided by terminal input; discharge efficiency is terminal output divided by chemical power. These are instantaneous model ratios, not a measured cycle efficiency or a permissible fast-charge rating.`,
   refs:["Circuit voltage and resistor-power laws (CIRC1.7)", "Independent signed-power balance for a Thevenin cell"],
   tags:["battery", "resistance", "power"],
   viz:lesson3,
  },
  {
   num:"6.4",
   kind:"Law",
   name:"Peukert’s law",
   deps:["energy-6.3"],
   statement:String.raw`For constant discharge current in a specified empirical range, Peukert's law can be normalized using reference current $I_r$, duration $t_r$ and charge rating $C_r=I_rt_r$:
$$\begin{aligned}t(I)&=t_r(I_r/I)^k,\\C_{\rm available}(I)&=It(I).\end{aligned}$$
When $k=1$, duration is $C_r/I$ and available charge is constant. For $k>1$, increasing current reduces available charge. In the dimensional form $I^kt=C_P$, the constant has units $\mathrm A^k\,h$, not ampere-hours unless $k=1$.`,
   idea:String.raw`Divide the same empirical relation at the selected current and reference current to obtain a dimensionless current ratio. The manufacturer's calculation example gives 100 Ah at 5 A for 20 h and 75 Ah at 15 A for 5 h; equating the two constants gives $k=\ln4/\ln3$. This is an example of fitting two ratings, not an independently measured curve. The exponent encodes rate sensitivity under fixed test conditions and cannot be assigned universally to a chemistry.`,
   caption:String.raw`Compare the empirical duration curve with the constant-charge $k=1$ curve, and inspect available ampere-hours separately. Adjust the exponent and reference rating, or select the clearly labelled manufacturer example. The reference point lies on both curves; currents are in amperes and delivered charge in ampere-hours.`,
   scope:String.raw`An empirical constant-current relation at fixed temperature, age and cutoff voltage over a suitable rating range. No zero-current limit, recovery dynamics, variable-current integration, energy-efficiency claim or universal lithium-ion exponent is inferred. The adjustable parameter range is illustrative; a real battery needs its own test data and manufacturer restrictions.`,
   refs:["Victron BMV-700H manual, Battery capacity and Peukert exponent, public example", "Independent dimensionless normalization of the empirical law; original Peukert body unread"],
   links:{"manufacturerExample": "https://www.victronenergy.com/media/pg/BMV-700H/en/battery-capacity-and-peukert-exponent.html"},
   tags:["battery", "capacity", "empirical law"],
   viz:lesson4,
  },
  {
   num:"6.5",
   kind:"Definition",
   name:"State of charge and C-rate",
   deps:["energy-6.1"],
   statement:String.raw`For fixed charge capacity $Q_n$ in ampere-hours, state of charge is remaining charge divided by $Q_n$. Positive current denotes discharge. With time measured in hours,
$$\begin{aligned}\dot s&=-I/Q_n,\\\text{C-rate}&=|I|/Q_n\quad(\mathrm h^{-1}),\\\widehat s(t)&=s_0-\frac1{Q_n}\int_0^t I_m(u)\,du.\end{aligned}$$
The meter reads $I_m=gI+b$ with gain $g$ and offset $b$. True current switches to zero at physical empty/full cutoff; an offset meter can continue drifting afterwards. Ampere-hours measure charge, not stored energy.`,
   idea:String.raw`Integrate true current only until the exact empty/full event, preserving charge conservation. Integrate the biased meter over the whole observation interval; clipping its estimate to zero or one would hide estimation error. The comparison voltage gauge assumes the declared relation $V_{\rm oc}=3+1.2s$ volts and 2 mΩ internal resistance, then inverts the loaded terminal voltage as if it were open circuit. Its load error disappears abruptly at cutoff, while coulomb-counter offset remains.`,
   caption:String.raw`Choose charge, discharge or rest and move elapsed time. Compare true state of charge, the biased coulomb counter and the voltage-only estimate, with current switching visible at cutoff. Change meter gain or offset to separate accumulated drift from load-induced voltage error. The estimator is deliberately allowed outside 0–100%.`,
   scope:String.raw`A fixed 100 Ah ideal charge reservoir with unit charge efficiency and a chosen linear open-circuit relation; neither curve is a measured calibration. C-rate is a current-to-charge ratio, not an energy or lifetime rating. The model omits self-discharge, aging, hysteresis and electrochemical relaxation. A one-hour empty-to-full result at 1C requires this constant-current, unit-efficiency idealization.`,
   refs:["Independent exact charge accounting and meter-error integration", "Declared linear open-circuit relation and 2 mΩ comparison model"],
   tags:["state of charge", "current", "estimation"],
   viz:lesson5,
  },
  {
   num:"6.6",
   kind:"Model",
   name:"Cycle life and depth of discharge",
   deps:["energy-6.5"],
   statement:String.raw`Consider a declared depth-dependent life model with depth $0<d\le1$, exponent $b>0$ and full-depth reference life $N_r$:
$$\begin{aligned}N_*(d)&=N_rd^{-b},\\c(n)&=1-0.2n/N_*,\\0&\le n\le N_*.\end{aligned}$$
The continuous cycle-count approximation reaches 80% retained capacity at $N_*$. For initial energy capacity $E_c$, cumulative delivered energy is
$$\begin{aligned}W(n)&=E_cdN_*[u-0.1u^2],\\u&=n/N_*.\end{aligned}$$
Thus lifetime energy relative to full-depth cycling is $d^{1-b}$: shallow cycling increases it only when $b>1$.`,
   idea:String.raw`Each differential cycle delivers depth times its currently retained energy capacity. Integrating the linear fade law gives the throughput expression and the factor 0.9 at end of modeled life. More shallow cycles alone do not establish more total delivered energy: each cycle is smaller. The exponent comparison exposes the missing condition—at $b=1$ lifetime energy is exactly unchanged, and at $b<1$ shallower cycles deliver less under these assumptions.`,
   caption:String.raw`Vary depth and the explicitly illustrative exponent. Compare retained capacity against cycle count, then against delivered lifetime energy, using full-depth cycling as a fixed reference. Move the selected life fraction to inspect actual degradation and throughput; the readout states whether shallow cycling helps this chosen energy metric.`,
   scope:String.raw`A continuous empirical-style teaching model, not fitted battery data, a universal degradation law or a product warranty. Depth, reference life and exponent are chosen inputs; fade is prescribed as linear in cycle count until 80% capacity. Calendar aging, temperature, charge rates, variable histories, repair and replacement are excluded. Delivered energy uses the evolving modeled capacity.`,
   refs:["Independent integration of an explicitly declared depth/life and linear-fade model"],
   tags:["battery", "cycle life", "model assumptions"],
   viz:lesson6,
  },
  {
   num:"6.7",
   kind:"Model",
   name:"Pumped hydro storage",
   deps:["energy-5.7", "energy-6.1"],
   statement:String.raw`Transfer water between two ideal reservoirs of equal horizontal area $A$, with initial elevation head $H_0>0$. If $V$ has moved into the upper reservoir,
$$\begin{aligned}H(V)&=H_0+2V/A,\\E(V)&=\rho g(H_0V+V^2/A).\end{aligned}$$
With pump efficiency $\eta_p$ and turbine efficiency $\eta_t$, charging requires $E(V)/\eta_p$ and returning from full transfer $V_c$ to remaining $V$ delivers $\eta_t[E(V_c)-E(V)]$. For a completed cycle, $\eta_{\rm RT}=\eta_p\eta_t$.`,
   idea:String.raw`Raising the upper surface by $V/A$ also lowers the lower surface by $V/A$. Integrate the incremental work $\rho gH(v)\,dv$ rather than substitute a single fixed head. At chosen volume flow $q$, hydraulic power is $\rho gqH$, so pump input and turbine output change during their legs. The water-volume and electrical-energy ledgers close separately, with conversion losses on their respective sides of the boundary.`,
   caption:String.raw`Switch between pumping and release, then move transfer progress. The reservoir volumes are conserved; the head and stored-energy curves use the changing water levels. Change area to reveal when fixed-head $m g H_0$ misses a meaningful amount of energy, and compare pump input with useful turbine output.`,
   scope:String.raw`Equal constant reservoir areas, incompressible water of chosen density 1000 kg/m³, standard gravity, no evaporation or inflows, constant efficiencies and no pipe dynamics. Area is entered in km² and converted exactly; transfer volume is in m³. The reservoir drawing is schematic and does not set a geographic scale. Efficiencies are inputs, not a universal 75% plant value or an operating forecast.`,
   refs:["DOE, How Pumped Storage Hydropower Works, public water-transfer explanation", "Independent equal-area reservoir work integral and electrical balance"],
   links:{"waterTransfer": "https://www.energy.gov/cmei/water/how-pumped-storage-hydropower-works"},
   tags:["hydropower", "storage", "energy balance"],
   viz:lesson7,
  },
  {
   num:"6.8",
   kind:"Model",
   name:"Compressed-air storage",
   deps:["pchem-2.7", "energy-6.1"],
   statement:String.raw`A closed ideal-gas parcel starts at $T_0,p_0,V_0$ and is compressed reversibly to $V_0/r$, $r\ge1$. For constant $\gamma>1$, compression work is
$$\begin{aligned}W_{\rm iso}&=nRT_0\ln r,\\W_{\rm ad}&=nRT_0\frac{r^{\gamma-1}-1}{\gamma-1}.\end{aligned}$$
After adiabatic compression, cooling at fixed volume to $T_0$ rejects $W_{\rm ad}$ as heat. Isothermal return to $V_0$ recovers $W_{\rm iso}$ while absorbing that much heat from ambient. The lost work is $W_{\rm ad}-W_{\rm iso}$, not the entire cooling heat.`,
   idea:String.raw`Integrate piston work along $pV^\gamma=\text{constant}$ and along $pV=nRT_0$. The cooling leg does no piston work and removes the adiabatic internal-energy rise. The return isothermal leg has zero internal-energy change, so its output comes with ambient heat absorption. Retaining the compression heat instead permits the ideal reversible adiabatic path to be retraced, recovering all compression work. This explains the role of thermal management without pretending that a rigid cavern is a shrinking piston.`,
   caption:String.raw`Compare reject-heat and retain-heat paths on the pressure–volume diagram. Follow the selected compression state and inspect compression work, returned work, cooling heat and ambient heat separately. At ratio one no work is transferred and a work-efficiency ratio is undefined; near one the small work difference remains explicit.`,
   scope:String.raw`A closed piston parcel with chosen constant ideal-gas properties, initial pressure 100 kPa and $1.01\le\gamma\le5/3$ in the widget. It is not an open-flow rigid-cavern model and excludes pressure drops, machinery losses, heat-exchanger limits and fuel addition. Retained heat is perfectly recoverable only in the stated reversible limit. Isothermal work is an availability comparison, not increased ideal-gas internal energy.`,
   refs:["Ideal-gas reversible adiabatic relation (PCHEM2.7)", "Independent piston-work and complete heat/work cycle integrals"],
   tags:["compressed air", "thermodynamics", "heat"],
   viz:lesson8,
  },
  {
   num:"6.9",
   kind:"Model",
   name:"Flywheel storage",
   deps:["mech-10.2", "solid-1.8"],
   statement:String.raw`For an ideal thin ring of rotor mass $M$, radius $r$ and density $\rho$,
$$\begin{aligned}I&=Mr^2,\quad E=\tfrac12I\omega^2,\\\sigma_\theta&=\rho\omega^2r^2.\end{aligned}$$
With chosen strength $\sigma_s$ and safety factor $S\ge1$, require $\sigma_\theta\le\sigma_s/S$. Therefore
$$\begin{aligned}\omega_{\max}&=\sqrt{\frac{\sigma_s}{S\rho r^2}},\\\frac{E_{\max}}M&=\frac{\sigma_s}{2S\rho}.\end{aligned}$$
The specific-energy limit is independent of ring radius under these assumptions; the limiting angular speed is not.`,
   idea:String.raw`Balance the outward inertial loading of a small ring arc with the inward resultant of its two hoop tensions. This gives stress proportional to density times rim-speed squared. Combine it with rotational kinetic energy and the allowable stress to obtain the strength-to-density limit. At speed fraction $f$, both energy and stress scale as $f^2$. A disk, anisotropic composite or complete flywheel assembly requires different stress and mass models.`,
   caption:String.raw`Change speed fraction, radius, mass, density, chosen strength or safety factor. Compare energy and hoop stress against the allowable level. Move physical snapshot time to see the marker at the computed angle; it is a time sample, avoiding a misleading low-frame-rate picture of high-speed rotation. Radius changes speed and phase while the ideal rotor-specific energy limit stays fixed.`,
   scope:String.raw`An ideal thin ring with uniform density and allowable tensile stress, no hub, bearings, enclosure, motor, losses, fatigue or rotor dynamics. Material parameters are chosen illustrations, not measured steel/composite product rankings. Energy per kilogram uses rotor mass only; it must not be compared directly with whole-system ratings. The phase drawing is approximate numerical geometry, while energy and stress retain original input factors.`,
   refs:["Sandia Energy Storage Handbook, Flywheels, selected rotor discussion PDF pp. 5–6", "Independent thin-ring force balance and rotational-energy derivation"],
   links:{"rotorDiscussion": "https://www.sandia.gov/app/uploads/sites/163/2022/03/ESHB_Ch07_Flywheels_Bender.pdf"},
   tags:["flywheel", "stress", "specific energy"],
   viz:lesson9,
  },
  {
   num:"6.10",
   kind:"Model",
   name:"Supercapacitors",
   deps:["circ-5.3"],
   statement:String.raw`An ideal capacitor $C$ initially at $V_0>0$ is discharged at controlled constant current $I>0$ until cutoff $V_{\min}=kV_0$, $0\le k<1$. On the active interval,
$$\begin{aligned}V(t)&=V_0-It/C,\\T&=C(V_0-V_{\min})/I,\\P(t)&=IV(t),\\E_{\rm usable}&=\tfrac12C(V_0^2-V_{\min}^2).\end{aligned}$$
The fraction of initial energy delivered by cutoff is $1-k^2$. Nonzero cutoff voltage leaves stored energy behind.`,
   idea:String.raw`Charge balance gives $dV/dt=-I/C$. Integrating terminal power $IV(t)$ verifies the decrease in $CV^2/2$. Constant current makes voltage fall linearly, while power falls with voltage; it is not constant-power discharge or a resistor's exponential RC transient. At cutoff the controller turns current off, so actual power jumps to zero even if the just-before-cutoff voltage and power are positive.`,
   caption:String.raw`Move discharge progress and compare voltage, actual terminal power and the energy partition. Change cutoff to expose retained energy and shortened useful duration. Open and filled endpoint markers distinguish power immediately before cutoff from power after the current controller stops. Current changes duration and power without changing the ideal usable energy at fixed cutoff.`,
   scope:String.raw`Constant ideal capacitance and an ideal controlled current sink, no series resistance, leakage, temperature effects, converter loss or current limit beyond the chosen input range. The widget makes no empirical claim about duration, energy per mass or battery comparisons. The post-cutoff voltage remains at its cutoff value; the right-hand actual current and power are zero.`,
   refs:["Capacitor energy and charge relations (CIRC5.3)", "Independent constant-current work integral and cutoff accounting"],
   tags:["capacitor", "cutoff", "energy"],
   viz:lesson10,
  },
  {
   num:"6.11",
   kind:"Model",
   name:"Hydrogen round trip: electrolysis and fuel cells",
   deps:["pchem-8.10", "pchem-8.14"],
   statement:String.raw`Use a declared hydrogen lower heating value $h=33.33$ kWh/kg, electrolyser efficiency $\eta_e$, compressor auxiliary cost $c$ kWh/kg, retained mass fraction $r$ and fuel-cell efficiency $\eta_f$. Total electrical input $E_0$ supplies both electrolysis and compression. The produced mass and returned electricity are
$$\begin{aligned}m&=\frac{E_0\eta_e}{h+c\eta_e},\\E_{\rm el}&=\frac{E_0h}{h+c\eta_e},\\E_{\rm comp}&=mc,\\E_{\rm out}&=mrh\eta_f.\end{aligned}$$
For $E_0>0$, the round-trip ratio is $\eta_er\eta_fh/(h+c\eta_e)$ on this boundary.`,
   idea:String.raw`Electrolysis reverses water formation: $2\mathrm H_2O\to2\mathrm H_2+\mathrm O_2$; a fuel cell reverses that reaction and separates its charge transfer into electrical work. Reversible constant-temperature electrical work follows reaction Gibbs energy, while reaction enthalpy also accounts for heat; the two must not be equated. This widget instead declares a consistent LHV energy budget. Solving $E_0=mh/\eta_e+mc$ allocates compressor electricity before computing mass. Compression consumes auxiliary electricity without deleting hydrogen chemical energy; storage leakage removes mass separately.`,
   caption:String.raw`Follow total electrical input through the split to electrolysis and compression, then through hydrogen retention and the fuel cell. The loss ledger and output add to exactly the same input. Adjust each stage and compare a chosen battery efficiency on that identical electrical-input basis; the displayed result is computed rather than fixed at one third.`,
   scope:String.raw`A declared LHV budget with no exported heat credit or recovery of compression/expansion energy. The rounded LHV is a model reference, not a measured sample value; unrecovered terms are energy-budget losses, not a calorimetric heat-flow prediction. Chosen efficiencies lie in 0–1 and omit external thermal inputs. Real electrolyser conventions, water phases, pressure, auxiliary systems and plant boundaries require separate data. At zero input no actual round-trip ratio exists.`,
   refs:["DOE, Hydrogen Production: Electrolysis, public process and stoichiometry explanation", "MIT 10.626 Lecture 2, selected galvanic-cell/Gibbs-work discussion PDF pp. 8–10", "Independent total-input compressor allocation and LHV balance"],
   links:{"electrolysis": "https://www.energy.gov/cmei/fuels/hydrogen-production-electrolysis", "gibbsWork": "https://ocw.mit.edu/courses/10-626-electrochemical-energy-systems-spring-2014/ca1416c480deca1321a5edd1aa971557_MIT10_626S14_Lec2.pdf"},
   tags:["hydrogen", "energy balance", "system boundary"],
   viz:lesson11,
  },
  {
   num:"6.12",
   kind:"Concept",
   name:"The Ragone plot",
   deps:["energy-6.1"],
   statement:String.raw`A Ragone diagram plots specific usable energy $e$ in Wh/kg against specific rated power $p$ in W/kg on logarithmic axes. Their rating-duration ratio is
$$t=3600e/p\quad\text{seconds}.$$
Constant-duration lines are straight diagonals with $e=(t/3600)p$. A declared device specification passes a requirement $(p_r,e_r)$ only if $p\ge p_r$ and $e\ge e_r$. Both inequalities must refer to consistent mass and rating boundaries.`,
   idea:String.raw`A logarithm turns the quotient into $\log e-\log p$, so lines of constant duration have slope one when energy is vertical and power horizontal. The upper-right region relative to a requirement point meets both scalar thresholds. The three plotted device points are explicitly declared teaching specifications, not measured technology envelopes. Their labels are illustrative scenarios; this geometry alone cannot determine which real technology suits a duty cycle.`,
   caption:String.raw`Drag the requirement point across the log axes and watch each declared example pass or fail both thresholds. Duration diagonals connect power and energy through the exact 3600-second conversion. The readout reports exact saved coordinates and signed margins, so adjacent values at a specification boundary are not silently treated as equal.`,
   scope:String.raw`Illustrative specification screening with consistent declared mass boundaries: battery example 100 Wh/kg and 500 W/kg, flywheel example 20 Wh/kg and 2000 W/kg, supercapacitor example 5 Wh/kg and 5000 W/kg. These are authored numbers, not measured or recommended product ratings. Rated peak power need not be sustainable for the quotient duration; usable energy can depend on rate, temperature and cutoff. Cost, safety, efficiency, life and the complete load profile require additional evidence.`,
   refs:["Independent logarithmic rating geometry and explicit illustrative specifications"],
   tags:["Ragone plot", "energy density", "power density"],
   viz:lesson12,
  },
 ],
};
