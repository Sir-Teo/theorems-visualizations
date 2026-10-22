import * as V from './ch05.ui.shared.js';
export default {collection:'circ',chapter:5,title:"Capacitors, inductors and first-order transients",summary:"Ideal storage laws lead to explicit transient models, singular switching limits and honest energy accounting. Positive time constants, drive regularity, conduction paths and periodic steady state determine which conclusions apply.",items:[
{
  "statement": "For a fixed linear capacitor with $C>0$, charge on its positive terminal is $q=Cv$. Under the passive sign convention,\n$$i=C\\,dv/dt.$$\nThe law requires fixed geometry and a linear, time-independent dielectric. For nonlinear or changing capacitance the general law is $i=dq/dt$, not necessarily $C\\dot v$.",
  "idea": "EM 3.8 supplies the charge–voltage relation. Current is charge per time (CIRC 1.1); differentiating by PMA 5.1 gives the law. A constant voltage carries no ideal capacitor current, but does not imply zero stored charge. The visualizations evaluate analytic derivatives of three explicitly offered smooth waveforms; they do not infer an impulse from a finite-difference sample.",
  "caption": "Choose a sinusoid, ramp or smooth step and edit its amplitude, rate and capacitance. Compare the actual voltage with its analytic derivative scaled by C.",
  "scope": "Chosen ideal capacitance in µF, voltage in V and time in ms; current is mA. No leakage, ESR, dielectric absorption or unlimited user-drawn waveform is modeled.",
  "deps": [
    "circ-1.1",
    "pma-5.1",
    "em-3.8"
  ],
  "refs": [
    "MIT 6.200 S26 public lecture09 capacitor slides, PDF5,7–9"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec05a/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.1",
  "kind": "Definition",
  "name": "Capacitor: i = C dv/dt"
,"viz":V.capacitor},
{
  "statement": "For an ideal linear, uncoupled inductor, define flux linkage $\\lambda=Li$ with fixed $L>0$. With passive voltage polarity its constitutive terminal law is\n$$v=d\\lambda/dt=L\\,di/dt.$$\nThis lumped law assumes the magnetic element is isolated from unmodeled mutual coupling; core saturation and changing inductance require a different model.",
  "idea": "The chosen constitutive relation defines linear inductance. The linked-flux voltage law is taken as the element law here, as in the actual MIT slide; differentiation gives the displayed equation. It is not derived from the unwritten EM 9.15. An inductor can carry constant current with zero terminal voltage. The analytic current and derivative are computed together in the widget.",
  "caption": "Choose a current waveform and vary L. A ramp produces constant voltage; a changing current can have either voltage sign.",
  "scope": "L in mH, current in A and time in ms, so voltage is V. No winding resistance, saturation, mutual inductance or measured coil is included.",
  "deps": [
    "circ-1.1",
    "pma-5.1"
  ],
  "refs": [
    "MIT 6.200 S26 public lecture10 inductor slides, PDF5–9"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec05b/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.2",
  "kind": "Definition",
  "name": "Inductor: v = L di/dt"
,"viz":V.inductor},
{
  "statement": "For ideal linear storage elements under passive sign convention, stored energy relative to the uncharged or zero-current state is\n$$W_C=\\tfrac12Cv^2,\\qquad W_L=\\tfrac12Li^2.$$\nTheir absorbed power equals the derivative of this energy. Positive and negative instantaneous power are possible: an ideal element can return previously stored energy.",
  "idea": "CIRC 1.2 gives absorbed power vi. Substitute i=C dv/dt or v=L di/dt, then integrate C v dv or L i di from zero to the selected state. The zero-energy reference is explicit. This circuit proof supplies both formulas without the unwritten magnetic-energy item EM 9.17. The electric-field result EM 2.11 is a comparison, not needed to integrate these terminal laws.",
  "caption": "Switch between electric and magnetic storage. The state–conjugate phase curve, instantaneous power and stored energy come from the same analytic sinusoid; a selected point verifies the energy formula.",
  "scope": "Ideal reversible storage; energy does not mean dissipation. The C panel reports µJ and the L panel mJ because their chosen units differ.",
  "deps": [
    "circ-5.1",
    "circ-5.2",
    "circ-1.2"
  ],
  "refs": [
    "MIT capacitor PDF5,9; inductor PDF5,9"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec05a/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.3",
  "kind": "Proposition",
  "name": "Energy stored: ½CV² and ½LI²"
,"viz":V.energy},
{
  "statement": "If capacitor current is locally bounded near a switching time, then capacitor voltage is continuous there. Similarly, locally bounded inductor voltage implies continuous inductor current. More generally, locally integrable drives give absolutely continuous storage states. A voltage jump $\\Delta v$ in an ideal capacitor requires current impulse area $C\\Delta v$; a current jump $\\Delta i$ in an ideal inductor requires voltage impulse area $L\\Delta i$.",
  "idea": "Integrate i=C dv/dt across a time interval: the voltage change is its current integral divided by C. A bounded current's integral vanishes with interval length. The same argument applies to inductance. A family of finite ramps has fixed integrated drive but drive height inversely proportional to its duration; its zero-duration idealization is a distribution, not a finite spike. Finite stored energy alone does not rule out such impulsive ideal-source connections.",
  "caption": "Change a finite transition width or select the ideal impulse limit. The regularized drive gets taller at fixed area; the impulse mode reports area and draws no invented finite current or voltage height.",
  "scope": "Ideal fixed positive C or L. Bounded-drive continuity excludes impulses. The impulse picture is an explicit ideal limiting description, not a computed finite physical spike.",
  "deps": [
    "circ-5.1",
    "circ-5.2"
  ],
  "refs": [
    "MIT capacitor PDF8 and inductor PDF8; explicit integrated-law argument"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec05a/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.4",
  "kind": "Proposition",
  "name": "Continuity of capacitor voltage and inductor current"
,"viz":V.continuity},
{
  "statement": "For R,C>0 in a series RC circuit driven after switching by a constant V, KVL gives\n$$RC\\dot v_C+v_C=V.$$\nDefine $a(t)=e^{-t/(RC)}$. For initial voltage v₀, the unique solution is\n$$v_C(t)=v_0a(t)+V[1-a(t)].$$\nThe current is $(V-v_0)e^{-t/(RC)}/R$. An ideal finite source step changes current immediately but not capacitor voltage.",
  "idea": "KVL adds the resistor drop Ri to v_C; substitute i=C dv_C/dt. ODE 1.4 supplies the integrating-factor solution and uniqueness. The two-term form and expm1 evaluation preserve small charging increments better than subtracting nearly equal exponentials. With V=0 it is discharge; with equal initial and final values the transient vanishes.",
  "caption": "Edit R, C, source and initial voltage. Inspect the actual selected time and compare normalized time t/(RC) with physical milliseconds.",
  "scope": "Chosen positive resistors/capacitors and ideal constant source; time zero is the switch event, with no previous circuit history inferred.",
  "deps": [
    "circ-5.1",
    "circ-2.2",
    "ode-1.4"
  ],
  "refs": [
    "MIT first-order lecture11 slides PDF2,4–7"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec06a/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.5",
  "kind": "Model",
  "name": "RC circuit: charging and discharging"
,"viz":V.rc},
{
  "statement": "For $x(t)=x_\\infty+(x_0-x_\\infty)e^{-t/\\tau}$ with $\\tau>0$, one time constant multiplies the remaining error by $e^{-1}$. For a nonconstant response, the tangent at time t intersects the final-value line at $t+\\tau$. If the initial and final values coincide, the tangent coincides with that line and has no unique intersection.",
  "idea": "Differentiate to obtain $\\dot x=(x_\\infty-x)/\\tau$. Advancing along that tangent for τ gives x+τẋ=x∞. Dividing the remaining error at t+τ by that at t gives e⁻¹ when the denominator is nonzero. This is a geometric identity of a single exponential, not a universal rule for multi-pole responses.",
  "caption": "Move the selected tangent point along the normalized exponential. The gold point marks its exact intersection one time constant later; read physical RC time alongside the normalized coordinates.",
  "scope": "A genuine single stable exponential with nonzero initial-to-final difference. The offered normalized example is fixed from zero to one.",
  "deps": [
    "circ-5.5"
  ],
  "refs": [
    "MIT inductor lecture10 PDF12; first-order PDF6"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec05b/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.6",
  "kind": "Definition",
  "name": "Time constant"
,"viz":V.timeConstant},
{
  "statement": "For R,L>0 in a driven series RL circuit,\n$$L\\dot i+Ri=V,\\qquad \\tau=L/R.$$\nThe solution after a constant source change is\n$$i(t)=i_0e^{-t/\\tau}+\\frac VR(1-e^{-t/\\tau}).$$\nThe passive inductor voltage is $(V-Ri_0)e^{-t/\\tau}$. Its initial current is preserved in the absence of a voltage impulse.",
  "idea": "Add resistor and inductor drops by KVL and substitute the constitutive inductor law. Apply the integrating factor of ODE 1.4. The resistor voltage approaches V while the inductor voltage approaches zero for this positive-resistance steady state; arbitrary dynamic circuits need not settle this way.",
  "caption": "Change L, R, source and initial current. Compare computed current with the complementary inductor voltage and physical L/R time.",
  "scope": "Positive chosen R and L, uncoupled linear inductor, constant ideal source; no opening-switch arc is silently included.",
  "deps": [
    "circ-5.2",
    "circ-2.2",
    "ode-1.4"
  ],
  "refs": [
    "MIT inductor PDF11–12 and first-order PDF3,8"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec05b/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.7",
  "kind": "Model",
  "name": "RL circuit transients"
,"viz":V.rl}
]};
