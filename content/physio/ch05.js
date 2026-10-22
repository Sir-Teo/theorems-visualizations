// Human physiology — respiration. Chosen mechanical models, not patient measurements.
import * as U from './ch05.ui.shared.js';
const book='https://www.math.utah.edu/~keener/books/control.pdf';
const cambridge='https://assets.cambridge.org/97805218/67818/excerpt/9780521867818_excerpt.pdf';
export default {
 collection:'physio',chapter:5,title:'Respiration and gas exchange',
 summary:String.raw`Pressure moves air, but pressure, flow and lung volume are different quantities. Surface tension and elastic recoil shape breathing; gas conservation, diffusion and blood chemistry shape exchange. The final models compare static regulation with a delayed respiratory feedback loop, keeping their assumptions and numerical limits visible.`,
 items:[
 {num:'5.1',kind:'Law',name:'Boyle’s law and the mechanics of breathing',
 statement:String.raw`For a sealed amount of ideal gas at fixed absolute temperature, $P_{\rm abs}V=nRT$ is constant. Gauge pressure is $P_{\rm abs}-P_{\rm ambient}$, and must not replace absolute pressure in that product. A breathing lung exchanges gas: its gas amount changes as airway flow responds to the pressure difference. In a chosen linear resistance/compliance model, relative volume $x$ obeys
$$R\dot x+\frac{x}{C}=P_{\rm drive}(t),$$
with alveolar gauge pressure $P_A=x/C-P_{\rm drive}=-R\dot x$.`,
 idea:String.raw`THERMO1.4 supplies the fixed-temperature ideal-gas relation. For the open model, define elastic recoil as $x/C$ and let a positive inspiratory drive reduce pleural pressure. The difference between airway and alveolar pressures drives flow through a chosen positive resistance. With a sinusoidal drive $A\sin(\omega t)$, substitution gives the exact periodic response
$$x=\frac{CA}{1+(\omega RC)^2}$$
$$\qquad{}\times[\sin(\omega t)-\omega RC\cos(\omega t)].$$
Its derivative supplies flow; the pressure difference has the opposite sign. This periodic solution already includes the chosen periodic initial state, rather than starting from an unrelated zero-volume condition.`,
 caption:String.raw`Switch between a sealed gas and an open airway. In the sealed mode, change volume and check the absolute-pressure product. In the open mode, move through a breath and change resistance: volume lags the drive, while flow changes direction when alveolar pressure crosses atmospheric pressure.`,
 scope:String.raw`Sealed: fixed gas amount and temperature. Open: chosen constant compliance and airway resistance, sinusoidal drive, volume measured relative to a 3 L baseline, and negligible gas compression in the volume-flow equation. Parameters illustrate mechanics; they are not fitted patient data. Boyle’s fixed-amount product is not asserted for the open lung.`,
 deps:['thermo-1.4','physio-4.1','physio-4.6'],see:['physio-5.2'],refs:['Montgomery, official Cambridge excerpt (2008), pp.4–8','Authored periodic linear resistance/compliance solution'],links:{source:cambridge},tags:['breathing','pressure'],viz:U.breathWidget},
 {num:'5.2',kind:'Concept',name:'Lung compliance and the pressure–volume curve',
 statement:String.raw`Static lung compliance is the local volume response to a change in distending, or transpulmonary, pressure:
$$C_L=\frac{dV}{dP_{\rm transpulmonary}}.$$
It is an operating-point slope, not necessarily the ratio $V/P$. Inflation and deflation can follow different pressure–volume paths: their enclosed work is dissipated per cycle. Removing the air–liquid interface removes its contribution to recoil, but does not establish that real saline-filled tissue has exactly zero hysteresis.`,
 idea:String.raw`PHYSIO4.6 supplies the local derivative interpretation of compliance; the same definition applies to a different compliant structure. Separate tissue recoil from an authored surface contribution. For $V=V_0+\Delta V u$, the chosen branches are
$$P_\pm=Eu+ku^2\pm4hu(1-u).$$
Differentiate to obtain $C_L=\Delta V/[E+2ku\pm4h(1-2u)]$. Every offered branch has a positive denominator. The pressure difference between branches integrates to loop work $4h\Delta V/3$. The interface-free comparator $P=Eu$ deliberately has no tissue hysteresis; that is a model assumption.`,
 caption:String.raw`Choose inflation or deflation and move the volume marker. Compare the local compliance readout with the idealized interface-free tissue line. Increasing the surface term stiffens the chosen air-filled model; increasing hysteresis widens its work loop.`,
 scope:String.raw`Quasi-static, illustrative constitutive curves. Pressure is in cmH₂O and volume change in L; the loop work is in cmH₂O·L. The polynomial and its constants are authored, not measured air/saline curves. Dynamic airway pressure also includes resistance and cannot be substituted for static distending pressure during flow.`,
 deps:['physio-5.1','physio-4.6'],see:['physio-5.3'],refs:['Montgomery, official Cambridge excerpt, pp.7–9','Authored positive-slope pressure branches'],links:{source:cambridge},tags:['compliance','hysteresis'],viz:U.complianceWidget},
 {num:'5.3',kind:'Law',name:'Laplace’s law for alveoli and the role of surfactant',
 statement:String.raw`For one spherical air–liquid interface, the pressure jump is $\Delta P=2\gamma/r$; a soap bubble has two interfaces and a different factor. In a mechanical two-sphere volume-transfer analogue, let $\gamma=\gamma_0(A/A_0)^m$. Equal volumes are locally stable under pressure-driven exchange when $m>1/2$, unstable when $m<1/2$, and neutral for this law when $m=1/2$. Lowering a constant tension alone does not reverse the instability.`,
 idea:String.raw`FLUID2.7 supplies the single-interface Laplace relation. Since $A\propto r^2$, the chosen law gives $\Delta P\propto r^{2m-1}$. Its derivative with respect to sphere volume therefore has the sign of $2m-1$. If $\dot V_1=G(P_2-P_1)$ and $V_1+V_2$ is fixed, a perturbation about equal volumes has growth rate $-2G P'(V_*)$. Positive pressure slope restores equality; negative slope amplifies the imbalance. Tissue elasticity and geometric coupling can change the conclusion for real alveoli.`,
 caption:String.raw`Change the split of the fixed model volume and the area dependence of surface tension. The arrow shows the computed transfer direction. At constant tension the smaller sphere loses volume; a sufficiently steep area-dependent tension reverses that direction.`,
 scope:String.raw`An authored mechanical analogue with fixed total volume and a single interface per sphere. It does not simultaneously impose conservation of ideal-gas moles at changing pressure. Real alveoli are nonspherical and tissue-coupled. The power law is a conditional stability example, not measured surfactant data or a recreation of an inaccessible experiment.`,
 deps:['fluid-2.7','physio-5.2'],see:['physio-5.1'],refs:['Montgomery, official Cambridge excerpt, pp.4–6','Independently derived two-sphere linearization'],links:{source:cambridge},tags:['surfactant','stability'],viz:U.bubbleWidget},
 {num:'5.4',kind:'Concept',name:'Lung volumes and spirometry',
 statement:String.raw`Forced vital capacity, FVC, is the volume expelled in a complete forced expiration from full inspiration; FEV₁ is the expelled volume in its first second. Their ratio is dimensionless. Spirometry measures gas moving at the mouth and cannot by itself identify residual volume, RV, which remains after maximal expiration. Consequently total lung capacity $\mathrm{TLC}=\mathrm{RV}+\mathrm{VC}$ needs an independently known RV as well as vital capacity.`,
 idea:String.raw`Record expired volume from the start of the chosen forced maneuver. In an authored exponential emptying model,
$$V_{\rm expired}(t)=\mathrm{FVC}(1-e^{-t/\tau}),$$
so $\mathrm{FEV}_1/\mathrm{FVC}=1-e^{-1\,\mathrm{s}/\tau}$. Increasing the emptying time reduces the first-second fraction without changing the asymptotic FVC. Adding an unknown constant RV to every absolute lung volume changes no measured expired-volume difference, which explains why the maneuver does not determine RV. Slow vital capacity and forced vital capacity need not coincide in a real subject.`,
 caption:String.raw`Choose a fast or slow illustrative expiration and vary its capacity and time constant. The first-second marker and computed FEV₁/FVC follow the actual curve. Change the separately supplied RV to see TLC bookkeeping change without altering the expelled-volume trace.`,
 scope:String.raw`Volumes are in L at the declared BTPS reporting convention; time is in seconds. The exponential is a chosen emptying law, not a fitted forced-expiration mechanics model, a diagnostic cutoff or a clinical classification. RV is supplied independently and is not inferred by the simulated spirometer.`,
 deps:['physio-5.1'],see:['physio-5.5'],refs:['ATS/ERS, Standardization of Spirometry 2019 Update, definitions and Table9','Montgomery excerpt, p.9, volume definitions'],links:{source:'https://www.aarc.org/wp-content/uploads/2026/06/ers-ats-standardization-of-spirometry.pdf'},tags:['spirometry','volume'],viz:U.spirometryWidget},
 {num:'5.5',kind:'Concept',name:'Dead space and alveolar ventilation',
 statement:String.raw`In an ideal fresh-gas plug-flow model with breathing frequency $f$, tidal volume $V_T$ and anatomical dead space $V_D$,
$$\dot V_E=fV_T,$$
$$\dot V_A=f\max(V_T-V_D,0).$$
Equal minute ventilation need not mean equal fresh alveolar ventilation. With negligible inspired CO₂, positive steady CO₂ production and positive alveolar ventilation,
$$P_{A\mathrm{CO}_2}=K\frac{\dot V_{\mathrm{CO}_2,\mathrm{STPD}}}{\dot V_{A,\mathrm{BTPS}}}.$$
Use compatible gas volumes; with both flows in L/min the rounded-temperature conversion gives $K\simeq863$ mmHg.`,
 idea:String.raw`The first dead-space volume of each idealized breath replaces gas in the conducting airway rather than delivering fresh gas to the exchanging region. Subtract that volume before multiplying by frequency; a negative fresh alveolar volume is not physical. At steady state all produced CO₂ must leave in the exchanging gas. THERMO1.4 converts gas volumes between dry standard conditions and body-temperature saturated conditions. At 273 K standard and 310 K body temperature,
$$K=\frac{310\times760}{273}\ \mathrm{mmHg}.$$
The code keeps this value rather than rounding it to863. With production in mL/min, divide $K$ by1000. At zero fresh alveolar ventilation and positive production there is no finite steady solution.`,
 caption:String.raw`Vary tidal volume, anatomical dead space and minute ventilation. Frequency is computed to keep the chosen minute volume fixed. A second shallow/deep comparison shows why equal minute volume can deliver different amounts of fresh alveolar gas. The CO₂ readout appears only where the declared steady balance exists.`,
 scope:String.raw`A plug-flow fresh-gas approximation, not a complete mixing or rebreathing model. This anatomical dead-space parameter is not a measurement of alveolar or physiological dead space. CO₂ production is STPD; ventilation is BTPS at the stated rounded temperatures. Steady CO₂ assumes negligible inspired CO₂ and storage change.`,
 deps:['physio-5.4','thermo-1.4'],see:['physio-5.8','physio-5.13'],refs:['Keener author manuscript, pp.707–709, equations14.43–14.45'],links:{source:book+'#page=707'},tags:['ventilation','dead-space'],viz:U.deadSpaceWidget},
 {num:'5.7',kind:'Law',name:'Henry’s law of gas solubility',
 statement:String.raw`At fixed solvent state and sufficiently low dissolved concentration, physically dissolved gas concentration is proportional to its equilibrium partial pressure:
$$c=\alpha P.$$
Here $\alpha$ is a solubility coefficient with concentration-per-pressure units. Its reciprocal convention and coefficients based on molality are different quantities. Hemoglobin-bound oxygen and bicarbonate are not included in this physical dissolved-gas concentration.`,
 idea:String.raw`PCHEM5.6 supplies the infinite-dilution proportionality and the warning that Henry conventions and units cannot be interchanged. Use a separate plasma table for this illustration: Keener lists oxygen $1.4\times10^{-6}$ and carbon dioxide $3.3\times10^{-5}$ mol L⁻¹ mmHg⁻¹. Multiplying by the selected partial pressure gives the plotted concentration directly. Their listed coefficient ratio is about23.57, which describes physical dissolution, not a ratio of total blood gas contents.`,
 caption:String.raw`Choose oxygen or carbon dioxide and move the partial-pressure marker. The line and micromolar readout use the selected listed coefficient. Compare both gases at the same pressure, keeping dissolved gas separate from the much larger chemical transport pools.`,
 scope:String.raw`Keener’s plasma coefficients from Table13.2 are used as listed; the read passage does not state their temperature. They are not asserted to be precision37°C coefficients, and no temperature adjustment is supplied. This linear equilibrium illustration omits bicarbonate, carbamino compounds, hemoglobin binding and kinetic equilibration.`,
 deps:['pchem-5.6','thermo-1.5'],see:['physio-5.9','physio-5.11'],refs:['Keener author manuscript, pp.639–640, equation13.5 and Table13.2'],links:{source:book+'#page=639'},tags:['Henry','dissolution'],viz:U.henryWidget},
 ]
};
