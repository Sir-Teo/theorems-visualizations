import * as V from './ch06.viz.js';
export default {
  "collection": "circ",
  "chapter": 6,
  "title": "Second-order circuits",
  "summary": "Two independent storage states make a circuit second order. Characteristic roots, energy exchange and state trajectories connect the series RLC equation to damping, parallel duality and mechanical analogies. A finite-rise interconnect example shows how the same dynamics can distort a digital edge.",
  "items": [
    {
      "num": "6.1",
      "kind": "Model",
      "name": "Series RLC circuit: the second-order equation",
      "deps": [
        "circ-5.5",
        "circ-5.7",
        "mech-4.7"
      ],
      "statement": String.raw`For a series circuit with $L,C>0$ and $R\ge0$, choose current $i$ into the capacitor's positive terminal. Kirchhoff's law and the storage laws give
$$\begin{aligned}L\dot i&=V_s-Ri-v_C,\\ C\dot v_C&=i.\end{aligned}$$
Eliminating current gives
$$LC\ddot v_C+RC\dot v_C+v_C=V_s.$$
The initial slope is $i(0)/C$. The characteristic roots solve $s^2+(R/L)s+1/(LC)=0$. A finite source step changes the derivatives, while both storage states remain continuous.`,
      "idea": String.raw`The resistor, inductor and capacitor contribute three voltage drops to the same loop. Substituting $i=C\dot v_C$ into Kirchhoff's voltage law gives the second-order equation. It needs two initial conditions because voltage and current store independent initial energy. With positive resistance both characteristic roots have negative real part; with zero resistance they are purely imaginary. A zero-state voltage step therefore settles only when $R>0$.`,
      "caption": "Change the resistance, inductance and capacitance. Compare the capacitor-voltage step with its characteristic roots, and read the selected current and element voltage balance on the circuit.",
      "scope": "Ideal lumped linear elements and a bounded voltage step; the demonstration starts with zero capacitor voltage and zero inductor current. Source values, voltage, current and time retain their physical units. Root coordinates and transient values are numerical; the damping regime uses the original parameter discriminant.",
      "refs": [
        "MIT OCW 6.002, lecture 15b, PDF pp. 10–21; own KVL/state reduction"
      ],
      "links": {
        "source": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/c794c9c9e067b6c16274ed844894ace7_6002_l15b.pdf"
      },
      "tags": [
        "RLC",
        "transients"
      ]
    ,
      viz: V.lesson1
    },
    {
      "num": "6.2",
      "kind": "Definition",
      "name": "Natural frequency and damping ratio",
      "deps": [
        "circ-6.1"
      ],
      "statement": String.raw`Write the characteristic equation as
$$s^2+2\zeta\omega_0s+\omega_0^2=0,$$
where
$$\omega_0=\frac1{\sqrt{LC}},\qquad \zeta=\frac R2\sqrt{\frac CL}.$$
For an underdamped conjugate pair $s=-\alpha\pm i\omega_d$, its radius is $\omega_0,$ its leftward projection is $\alpha=\zeta\omega_0$, and $\omega_d=\omega_0\sqrt{1-\zeta^2}$. The radius relation applies to the conjugate pair, rather than to each unequal real root of an overdamped circuit.`,
      "idea": String.raw`The sum and product of the two roots identify $2\zeta\omega_0=R/L$ and $\omega_0^2=1/(LC)$. For a conjugate pair their product is their squared radius. The right triangle with legs $\alpha$ and $\omega_d$ therefore has hypotenuse $\omega_0$, giving damping ratio as the cosine of the angle measured from the negative real axis. Fixing $L$ lets a dragged nonreal root determine $R=2L\alpha$ and $C=1/(L\omega_0^2)$.`,
      "caption": "Drag the upper root; its conjugate follows. The radius and projection show natural frequency and damping ratio, while the corresponding resistance, capacitance and step response update together.",
      "scope": "The handle is restricted to the upper-left nonreal-root region, including its zero-resistance boundary. This keeps the triangle meaningful and excludes an invalid zero-frequency circuit. The displayed R and C are derived from the dragged root with fixed positive L.",
      "refs": [
        "MIT OCW 6.002, lecture 15b, PDF pp. 16–24; own conjugate-root geometry"
      ],
      "links": {
        "source": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/c794c9c9e067b6c16274ed844894ace7_6002_l15b.pdf"
      },
      "tags": [
        "damping",
        "frequency"
      ]
    ,
      viz: V.lesson2
    },
    {
      "num": "6.3",
      "kind": "Phenomenon",
      "name": "Overdamped, critically damped and underdamped responses",
      "deps": [
        "circ-6.2"
      ],
      "statement": String.raw`For $\omega_0>0$ and nonnegative damping ratio, the root pattern is underdamped when $\zeta<1$, critically damped when $\zeta=1$, and overdamped when $\zeta>1$. At critical damping the repeated root is $-\omega_0$, and the zero-state unit-step response is
$$v_C(t)=1-(1+\omega_0t)e^{-\omega_0t}.$$
With fixed $\omega_0$, the critical response is the fastest of the monotone zero-state unit-step responses in the family $\zeta\ge1$. Underdamped step responses overshoot; zero resistance gives sustained oscillation.`,
      "idea": String.raw`As damping rises, the conjugate roots move toward the negative real axis, meet at a double root, then split into a fast and a slow real root. The double root contributes the independent solution $te^{-\omega_0t}$, so substituting two coincident exponentials would lose a solution. For the fixed-frequency monotone family, differentiating the step transfer with respect to damping gives minus a convolution of two nonnegative overdamped impulse responses; the step gets slower as damping increases. This comparison assumes zero initial state.`,
      "caption": "Sweep damping through one and compare with the critical reference. Watch the two roots merge and split, and distinguish a slow real-root return from an oscillatory response.",
      "scope": "The damping control defines the normalized second-order family directly. The fastest-monotone comparison fixes natural frequency, source step and zero initial state; it is not a universal optimum for arbitrary forcing or initial energy. Small positive damping is distinct from zero even when its decay is visually unresolved.",
      "refs": [
        "MIT OCW 6.002, lecture 15b, PDF pp. 18–21; own repeated-root limit and fixed-frequency comparison"
      ],
      "links": {
        "source": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/c794c9c9e067b6c16274ed844894ace7_6002_l15b.pdf"
      },
      "tags": [
        "damping",
        "critical damping"
      ]
    ,
      viz: V.lesson3
    },
    {
      "num": "6.4",
      "kind": "Model",
      "name": "LC tank: undamped oscillation",
      "deps": [
        "circ-6.1",
        "circ-5.3"
      ],
      "statement": String.raw`For a source-free ideal LC loop, a capacitor initially at $V_0$ with zero current has
$$\begin{aligned}v_C(t)&=V_0\cos(\omega_0t),\\i(t)&=-V_0\sqrt{C/L}\sin(\omega_0t).\end{aligned}$$
Its electric and magnetic energies are
$$\begin{aligned}E_C&=\tfrac12Cv_C^2,\\E_L&=\tfrac12Li^2,\end{aligned}$$
and their sum is constant. Each energy varies at twice the state oscillation frequency. Adding positive series resistance gives $\dot E=-Ri^2\le0$, with the lost stored energy transferred to heat.`,
      "idea": String.raw`Differentiate the electric and magnetic energies using the two storage laws. Multiply $L\dot i=-Ri-v_C$ by $i$ and $C\dot v_C=i$ by $v_C$, then add. The internal exchange terms cancel, leaving only resistor dissipation. At zero resistance the analytic states put the initial energy into $\cos^2(\omega_0t)$ and $\sin^2(\omega_0t)$, whose sum is one and whose period is half the voltage period. Resistance reduces the total while the electric and magnetic parts continue to exchange energy.`,
      "caption": "Move through the oscillation and watch electric and magnetic energy trade places. Add resistance to see total stored energy fall and the separately accumulated Joule heat rise.",
      "scope": "Source-free initial-value model with fixed positive L and C. Energy is measured relative to zero voltage/current and dissipated power follows the passive sign convention. The time interval is finite; tiny positive states or energy below drawing precision retain a separate numerical status.",
      "refs": [
        "MIT OCW 6.002, lecture 15, PDF pp. 15–19; own doubled-frequency and Joule-energy derivation"
      ],
      "links": {
        "source": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/34dd2fd3821b725a8b2191558673296b_6002_l15.pdf"
      },
      "tags": [
        "LC",
        "energy"
      ]
    ,
      viz: V.lesson4
    },
    {
      "num": "6.5",
      "kind": "Model",
      "name": "Parallel RLC circuit",
      "deps": [
        "circ-6.1"
      ],
      "statement": String.raw`For an ideal parallel RLC network driven by a current source, let $i_L$ be inductor current and $v$ the shared voltage. Then
$$\begin{aligned}I_s&=C\dot v+v/R_p+i_L,\\v&=L\dot i_L.\end{aligned}$$
Thus
$$LC\ddot i_L+\frac L{R_p}\dot i_L+i_L=I_s.$$
Increasing positive $R_p$ reduces damping. Its normalized zero-state current-step response matches the series capacitor's voltage-step response when
$$R_p=\frac{L}{CR_s}.$$
The matching compares differently dimensioned outputs after normalization.`,
      "idea": "Kirchhoff's current law adds capacitor, resistor and inductor branch currents. Substituting the inductor voltage law makes the inductor current obey the same second-order denominator as series capacitor voltage, with $RC$ replaced by $L/R_p$. Matching these coefficients gives the stated dual resistance. The parallel node voltage is a different output: comparing its current-step waveform directly with series capacitor voltage would not give this equality.",
      "caption": "Change the parallel resistance and watch damping fall as resistance rises. Enable matched damping to align its normalized inductor-current step with the series capacitor-voltage step; the source and output labels keep amperes and volts distinct.",
      "scope": "Independent positive elements, zero initial storage and bounded step sources. Matched mode requires positive series resistance, since zero series resistance would need an infinite parallel resistance. Matching concerns normalized voltage/current outputs, not identical units or arbitrary unmatched initial states.",
      "refs": [
        "Own KCL/inductor-law derivation and exact coefficient matching from the stated circuits"
      ],
      "tags": [
        "duality",
        "parallel RLC"
      ]
    ,
      viz: V.lesson5
    },
    {
      "num": "6.6",
      "kind": "Principle",
      "name": "Electromechanical analogies",
      "deps": [
        "circ-6.1",
        "mech-4.7"
      ],
      "statement": String.raw`The force–voltage analogy matches
$$m\ddot x+b\dot x+kx=F$$
with the series charge equation
$$L\ddot q+R\dot q+q/C=V_s.$$
After choosing coordinate and drive scales, mass corresponds to inductance, viscous damping to resistance, spring stiffness to inverse capacitance, charge to displacement and current to velocity. Their normalized trajectories agree when these equation coefficients and initial data agree.`,
      "idea": String.raw`Since capacitor charge is $q=Cv_C$ and current is $\dot q$, the circuit equation becomes a mass–spring–damper equation by direct coefficient substitution. Both systems then share characteristic roots and the same unique normalized initial-value solution. Mechanical kinetic/potential energy and magnetic/electric energy obey parallel exchange and dissipation laws. A correspondence of equations does not identify coulombs with metres; the selected scale factors carry that distinction.`,
      "caption": "Move one parameter panel and advance the selected time. The mass and capacitor charge move together, while velocity/current and the normalized response show the same damping mechanism.",
      "scope": "Linear spring, viscous mechanical damping and ideal lumped circuit elements. Coordinate, drive and initial-state scales are declared; the display compares normalized displacement and charge. It is an equation analogy, without a claim that different physical units are equal.",
      "refs": [
        "MECH4.7 and own force–voltage coefficient/energy correspondence"
      ],
      "tags": [
        "analogy",
        "oscillator"
      ]
    ,
      viz: V.lesson6
    },
    {
      "num": "6.7",
      "kind": "Method",
      "name": "State variables: capacitor voltages and inductor currents",
      "deps": [
        "circ-6.1",
        "circ-5.4",
        "ode-3.1"
      ],
      "statement": String.raw`Capacitor voltage and inductor current form a state for a source-free series RLC loop:
$$\dot z=Az,\qquad z=\begin{pmatrix}v_C\\i\end{pmatrix},$$
$$A=\begin{pmatrix}0&1/C\\-1/L&-R/L\end{pmatrix}.$$
With $j=i\sqrt{L/C}$ and $\tau=t/\sqrt{LC}$, this becomes $v_C'=j$ and $j'=-v_C-2\zeta j$. Positive resistance drives every state toward zero; zero resistance follows a closed energy ellipse. Both initial storage states must be specified.`,
      "idea": "The integrated storage laws make voltage and current the quantities that survive a bounded switch event. Each derivative follows from the other state, so no history variable is missing from the two-dimensional linear system. Existence and uniqueness come from the written linear-system result. In the scaled plane, $E=C(v_C^2+j^2)/2$, so resistor dissipation contracts its energy circles. Complex roots give spirals, two negative real roots give nodes, and the critical repeated root needs its polynomial-times-exponential solution.",
      "caption": "Drag the initial state and vary damping. Follow the actual current position through the phase plane and compare both state traces; closed orbits, spirals and real-root returns come from the same initial-value solution.",
      "scope": "The circuit is source-free, so the plotted quadratic is actual stored energy. The vertical coordinate is scaled current with voltage units, and physical current is reported separately. The zero initial state stays exactly zero; finite traces and numerical root coordinates do not by themselves prove asymptotic behavior.",
      "refs": [
        "MIT OCW 6.002, lecture 15b, PDF pp. 10–11 state variables; ODE3.1 and own normalized flow/energy derivation"
      ],
      "links": {
        "source": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/c794c9c9e067b6c16274ed844894ace7_6002_l15b.pdf"
      },
      "tags": [
        "state space",
        "phase plane"
      ]
    ,
      viz: V.lesson7
    },
    {
      "num": "6.8",
      "kind": "Phenomenon",
      "name": "Ringing on digital edges",
      "deps": [
        "circ-6.3"
      ],
      "statement": String.raw`A short interconnect can be approximated by series parasitic inductance and resistance feeding a load capacitance. In this lumped model,
$$LC\ddot v_C+RC\dot v_C+v_C=v_{in}(t).$$
A fast edge can excite its underdamped modes. The illustration uses the finite exponential rise
$$v_{in}(t)=V\bigl(1-e^{-t/\tau_r}\bigr),$$
with $\tau_r>0$. Increasing series resistance or slowing the input can reduce ringing, while also changing the useful edge speed. A damped tail has no exact finite stopping time.`,
      "idea": "The digital voltage level does not remove the storage states: inductance still resists changing current and capacitance still resists changing voltage. A fast source supplies substantial excitation at the circuit's natural timescale, allowing energy to exchange after the input approaches its final value. The finite-rise input is propagated as an additional dynamical state. A labelled ideal-step reference separates changing the circuit's damping from changing how it is driven.",
      "caption": "Adjust parasitic L and C, series resistance and source rise time. Compare the actual input and output with the ideal-step reference, and inspect the largest sampled output within the declared time window.",
      "scope": "Illustrative linear lumped interconnect, rather than a measured PCB or fitted inverter waveform. Long-line propagation, reflections and nonlinear driver behavior are excluded. Source rise time is an exponential time constant, not a measured 10–90% output rise time. Peak and ringing observations belong to the finite sampling window.",
      "refs": [
        "MIT OCW 6.002, lectures 15/15b, digital-edge demonstration as qualitative context; own finite-rise lumped model"
      ],
      "links": {
        "lecture 15": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/34dd2fd3821b725a8b2191558673296b_6002_l15.pdf",
        "lecture 15b": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/c794c9c9e067b6c16274ed844894ace7_6002_l15b.pdf"
      },
      "tags": [
        "ringing",
        "digital edges"
      ]
    ,
      viz: V.lesson8
    }
  ]
};
