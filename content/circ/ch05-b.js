import * as V from './ch05.ui.shared.js';
export default {collection:'circ',chapter:5,title:"Capacitors, inductors and first-order transients",summary:"Ideal storage laws lead to explicit transient models, singular switching limits and honest energy accounting. Positive time constants, drive regularity, conduction paths and periodic steady state determine which conclusions apply.",items:[
{
  "statement": "A single linear storage state connected to a fixed, well-posed linear resistive network has an exponential step response when its effective time constant is positive. For a capacitor, $\\tau=R_{Th}C$; for an inductor, $\\tau=L/R_{Th}$. Determine the actual initial state, post-switch final equilibrium and effective resistance before using the three-number formula. A zero, negative or singular effective resistance is not a stable positive-τ case.",
  "idea": "The terminal equivalence in CIRC 3.2 reduces the rest of the chosen network to VTh and RTh. Substituting the storage law gives the preceding RC/RL equation. Here the actual network is a source through R₁ feeding R₂ in parallel with C: VTh=V R₂/(R₁+R₂), RTh=R₁R₂/(R₁+R₂). The live branch-current residual i₁−i₂−iC checks KCL for the computed response. This is not an arbitrary circuit editor.",
  "caption": "Edit the two physical resistor values and capacitance. The schematic marks the computed node voltage, while branch currents and the effective resistance verify the reduction.",
  "scope": "The offered two-resistor, one-capacitor topology has finite positive resistances. General dependent-source and multi-storage networks need additional well-posedness and stability checks.",
  "deps": [
    "circ-5.6",
    "circ-5.7",
    "circ-3.2",
    "circ-2.1"
  ],
  "refs": [
    "MIT first-order PDF4–6; explicit Thévenin/KCL reduction"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec06a/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.8",
  "kind": "Method",
  "name": "First-order step response from initial, final value and τ"
,"viz":V.network},
{
  "statement": "Opening a current path does not define a unique finite inductor voltage without specifying where its current goes. In a lossless parasitic LC path initially carrying I₀ with an uncharged C, the first voltage maximum is $I_0\\sqrt{L/C}$. With a chosen constant-drop flyback path and winding resistance, instead\n$$L\\dot i=-Ri-V_D\\quad(i>0),$$\nand conduction ends at $(L/R)\\log(1+RI_0/V_D)$. These different closures produce different peaks and decay times.",
  "idea": "For the unprotected authored closure, integrate L di/dt=−v and C dv/dt=i to obtain i=I₀cos(t/√LC), v=I₀√(L/C)sin(t/√LC). Its peak follows energy exchange, not a universal hundreds-of-volts rule. For the clamp, the integrating factor solves the linear equation until its first zero, then the diode blocks negative current. Neither the ideal switch alone nor the inductor law specifies an arc voltage.",
  "caption": "Compare a specified lossless parasitic LC path with a flyback clamp. Vary the parasitic capacitance or clamp/winding values; inspect actual current, switch voltage and remaining stored energy.",
  "scope": "Chosen 12 V supply and lumped parasitic/clamp models, not a coil rating, diode datasheet or breakdown prediction. The LC trace ends after a half-cycle; the clamp trace stops its current at zero.",
  "deps": [
    "circ-5.7",
    "circ-5.1",
    "ode-1.4"
  ],
  "refs": [
    "MIT inductor PDF5–9; independently derived specified switching closures"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec05b/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.9",
  "kind": "Phenomenon",
  "name": "Inductive kick"
,"viz":V.kick},
{
  "statement": "An RC low-pass output across C satisfies $\\tau\\dot v_C+v_C=v_{in}$; the resistor output is $v_R=v_{in}-v_C$. Over signal components with $\\omega\\tau\\gg1$, the low-pass behaves approximately as an integrator after its constant/bias is handled. For $\\omega\\tau\\ll1$, the high-pass behaves approximately as $\\tau\\dot v_{in}$. A square wave has arbitrarily high harmonics, so neither approximation is uniform at its ideal edges.",
  "idea": "Substituting a complex sinusoid into the RC equation gives $H_C=1/(1+i\\omega\\tau)$ and $H_R=i\\omega\\tau/(1+i\\omega\\tau)$. Relative to $1/(i\\omega\\tau)$ the low-pass error is at most $1/(\\omega\\tau)$; relative to $i\\omega\\tau$ the high-pass error is at most $\\omega\\tau$. The same RC differential equation applies on every constant segment of the square wave. Solve each segment exactly and impose periodic closure to obtain its initial low/high levels. Large τ gives nearly linear charging portions; small τ makes the high-pass edge pulses narrow. The full plotted curves use the exact finite-τ segment solution, not ideal triangles or infinite impulses.",
  "caption": "Vary τ relative to the square-wave period and select capacitor or resistor output. Inspect the exact periodic steady-state waveform, with finite high-pass jumps at ideal input edges.",
  "scope": "Periodic ideal unipolar square source with 50% duty and no slew limit. Low-pass DC bias is retained. No universal integrator/differentiator approximation at every Fourier harmonic.",
  "deps": [
    "circ-5.5"
  ],
  "refs": [
    "MIT first-order PDF4–6; independently derived periodic piecewise solution"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec06a/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.10",
  "kind": "Model",
  "name": "RC integrator and differentiator"
,"viz":V.filters},
{
  "statement": "Connect initially isolated C₁,C₂>0 through R>0, with initial voltages V₁,V₂ and no external source. Total charge is conserved and the final common voltage is\n$$\\bar V=\\frac{C_1V_1+C_2V_2}{C_1+C_2}.$$\nThe total heat is\n$$W_R=\\tfrac12\\frac{C_1C_2}{C_1+C_2}(V_1-V_2)^2.$$\nFor equal capacitors with one initially empty, half the initial energy becomes heat. The R=0 ideal-wire model alone does not select this dissipative outcome.",
  "idea": "KCL transfers equal opposite charge, so voltage difference obeys d(V₁−V₂)/dt=−(V₁−V₂)/(R C_eq), C_eq=C₁C₂/(C₁+C₂). Integrate i²R to get the displayed heat. Subtracting final from initial storage energy gives the same result. Every positive R gives the same completed heat but changes its timescale; taking t→∞ before R→0 is not the same as declaring a zero-resistance dynamic model. Adding an ideal inductance with no loss produces oscillation, while radiation or real resistance supplies different dissipative closures.",
  "caption": "Edit both capacitances, initial voltages and positive connecting resistance. Compare both voltages, transferred charge and exact cumulative Joule heat; verify stored energy plus heat equals its initial value.",
  "scope": "No external supply, leakage, radiation or parasitic inductance in this positive-R calculation. The zero-R singular model is discussed but not falsely simulated as a unique instantaneous loss.",
  "deps": [
    "circ-5.3",
    "circ-5.5",
    "circ-2.1"
  ],
  "refs": [
    "Independent charge-conservation, RC and Joule-integral derivation"
  ],
  "links": {},
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.11",
  "kind": "Paradox",
  "name": "Two-capacitor paradox"
,"viz":V.sharing},
{
  "statement": "In a chosen threshold-triggered inverter-chain model, each output charges or discharges a load C through a finite on-resistance R. A falling output crosses fractional threshold η at $-RC\\log\\eta$; a rising output crosses it at $-RC\\log(1-\\eta)$. At η=1/2 both equal RC log2. These are delays of the stated RC switching model, not universal transistor propagation times.",
  "idea": "Use the exact charging/discharging solution from CIRC 5.5. Set it equal to ηVDD to solve for each crossing. The next idealized inverter changes its target when its predecessor crosses that threshold; propagate these exact event times through the finite chain. Different edges therefore have different delays when the threshold is not half supply. The zero initial switching event is the only applied input transition.",
  "caption": "Change RC, threshold and stage count. Actual RC output curves start when their predecessor crosses the threshold, and marked crossing times show the accumulated delay.",
  "scope": "Finite on-resistance plus lumped capacitive load; ideal threshold decision and instantaneous channel target changes. The plot window is 0–12 ns; later calculated threshold events are listed in the readout. No transistor slew dependence, short-circuit current, noise margin or measured device delay.",
  "deps": [
    "circ-5.5",
    "circ-4.8"
  ],
  "refs": [
    "MIT capacitor/first-order dynamics; authored event-driven inverter model"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec06a/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.12",
  "kind": "Model",
  "name": "Gate delay and RC propagation in logic"
,"viz":V.gates},
{
  "statement": "Charging a capacitive load fully from 0 to V through a resistive pull-up draws CV² from the supply: half becomes stored energy and half becomes heat. Discharging back to zero dissipates the remaining half. Thus\n$$P=f_{\\uparrow}CV^2,$$\nwhere $f_{\\uparrow}$ counts completed 0→1 charging events per second. If a clock runs at f and there are α such events per clock on average, $P=\\alpha fCV^2$. Clock frequency alone is insufficient.",
  "idea": "During a full charge, supplied work is ∫V i dt=V Δq=CV². The stored-energy formula leaves half as resistive heat; the subsequent discharge adds the other half. For the displayed finite cyclic bit patterns, count actual 0→1 boundaries including the cycle boundary and divide by pattern length. This gives α exactly. A static pattern has no ideal capacitive switching power despite a running clock. TI's external-load formula is distinguished from its extra internal and through-current terms.",
  "caption": "Select a cyclic bit pattern and edit clock, C and V. The diagram marks actual charging events; the computed power uses their rate and the readout separates stored energy from full-cycle loss.",
  "scope": "Full rail-to-rail completed transitions through resistive paths, ideal capacitive external load only. No leakage, simultaneous conduction, adiabatic recovery, partial swing or internal-device power is invented. C is pF, clock MHz and power mW.",
  "deps": [
    "circ-5.11",
    "circ-5.12"
  ],
  "refs": [
    "TI SCAA035B, actual PDF7–9, external-load Eq5–9; independent energy accounting"
  ],
  "links": {
    "source": "https://www.ti.com/lit/an/scaa035b/scaa035b.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.13",
  "kind": "Phenomenon",
  "name": "Switching power: P = fCV²"
,"viz":V.power},
{
  "statement": "For an ideal buck stage in periodic steady continuous conduction, average inductor voltage is zero. With switch-node voltage Vin for duty fraction D and zero for the remainder,\n$$\\langle V_o\\rangle=D V_{in}.$$\nThis identity requires periodic storage states and the stated conduction path. It does not hold as a universal transient or discontinuous-diode-conduction formula.",
  "idea": "KVL gives L di/dt=v_switch−v_o. Integrate over one periodic cycle; the current endpoint difference vanishes and yields the average voltage. The executed laboratory is an ideal synchronous buck with output capacitor and resistive load: di/dt=(sVin−v)/L and dv/dt=(i−v/R)/C. Each switch interval is propagated by its exact two-state affine matrix exponential; solving its period map finds the periodic initial state. Signed current is allowed by the synchronous switches. The readout separately reports whether that solution stays positive and hence meets the usual CCM interpretation for a diode buck.",
  "caption": "Vary duty, L, C, load and switching frequency. The current and output ripple are actual periodic switched-ODE states; their endpoint residual and minimum current check closure and conduction regime.",
  "scope": "Ideal synchronous switches, fixed input, resistive load, periodic steady state rather than startup. Negative-current states are labelled synchronous/bipolar, not silently clamped into a diode solution. No measured efficiency or switching-loss curve is supplied. The source MIT example has an RL load; the capacitor extension here is explicitly derived.",
  "deps": [
    "circ-5.7",
    "circ-5.1",
    "circ-4.7",
    "circ-2.1",
    "ode-3.3"
  ],
  "refs": [
    "MIT energy-processing lecture14 PDF7,10–11; authored LC-output affine-flow extension"
  ],
  "links": {
    "source": "https://circuits.mit.edu/_static/S26/handouts/lec08b/slides.pdf"
  },
  "tags": [
    "storage",
    "transients"
  ],
  "num": "5.14",
  "kind": "Invention",
  "name": "Switching power converter (buck)",
  "see": [
    "circ-4.1"
  ]
,"viz":V.buck}
]};
