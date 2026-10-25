import * as V from './ch06.viz.js';
export default {
  collection:'sig',chapter:6,title:'Frequency response and filtering',
  summary:"Frequency response separates spectral gain from phase. Exact kernels and paired time/frequency views expose the costs of sharp cutoffs, the conditions behind causal realization and gain\u2013phase recovery, and the family-specific links between transients and bandwidth.",
  items:[
    {
    "num": "6.1",
    "kind": "Definition",
    "name": "Frequency response of an LTI system",
    "deps": [
        "sig-3.10",
        "sig-5.6"
    ],
    "statement": "For an LTI convolution system with $h\\in L^1(\\mathbb R)$, its frequency response is\n$$H(i\\omega)=\\int_{\\mathbb R}h(t)e^{-i\\omega t}\\,dt.$$\nThe bounded input $e^{i\\omega t}$ produces $H(i\\omega)e^{i\\omega t}$. If $h$ is real, a real cosine is scaled by $|H(i\\omega)|$ and shifted by its phase. Phase is defined only where $H\\ne0$. This is the steady response to a sinusoid present for all time; a switched-on sinusoid also has a transient.",
    "idea": "Substitute $x(t-u)=e^{i\\omega t}e^{-i\\omega u}$ into convolution and factor out $e^{i\\omega t}$. Absolute integrability makes the bounded-input integral legitimate. Equivalently, the convolution theorem gives $Y=HX$ for its stated signal classes. The exponential is a generalized test signal, not an $L^2(\\mathbb R)$ eigenvector. For the chosen causal kernel $h(t)=e^{-t/\\tau}1_{t\\ge0}/\\tau$, direct integration gives $H=(1+i\\omega\\tau)^{-1}$.",
    "caption": "Sweep the driving frequency. The two traces, complex response vector and highlighted point on the gain curve all use the same exact first-order response.",
    "scope": "New synthetic steady-state signals with unit input amplitude. Time is in seconds, $\\tau$ in seconds and $\\omega$ in rad/s. The phasor is $H$, so its imaginary component is negative for positive frequency. The time probe changes the displayed points, not the frequency response.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.frequencyResponse
    },
    {
    "num": "6.2",
    "kind": "Definition",
    "name": "Ideal low-pass, high-pass and band-pass filters",
    "deps": [
        "sig-6.1"
    ],
    "statement": "An ideal spectral filter multiplies each frequency by a selected band indicator. With cutoff $W>0$,\n$$H_{\\rm LP}(i\\omega)=1_{|\\omega|\\le W}.$$\nThe high-pass complement is $1-H_{\\rm LP}$; an ideal band-pass retains $a\\le|\\omega|\\le b$, with $0<a<b$. These bounded multipliers define operators on $L^2$. Their inverse transforms need not be absolutely integrable causal kernels.",
    "idea": "The low-pass inverse is $h_{\\rm LP}(t)=\\sin(Wt)/(\\pi t)$, continuously extended to $W/\\pi$ at zero. A band-pass has $[\\sin(bt)-\\sin(at)]/(\\pi t)$. The high-pass kernel contains a Dirac impulse, $\\delta-h_{\\rm LP}$, and is not an ordinary $L^2$ impulse response. Thus the $L^2$ modulus theorem in6.4 cannot be applied directly to that high-pass kernel. Isolated band-edge assignments do not affect an $L^2$ operator; a finite harmonic signal does require an explicit assignment.",
    "caption": "Choose a band and move its cutoff. Each of five known harmonics is visibly kept or removed, and the output is their actual retained sum. Compare the changed waveform with its original.",
    "scope": "A newly authored finite real harmonic signal, not recorded music. Low-pass and band-pass edges pass in this illustration; high-pass is the exact complement of low-pass, so its cutoff edge is removed. The band-pass width is positive. Stem heights are cosine amplitudes, not continuous spectral density. No audio playback or causal implementation is claimed.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.idealFilters
    },
    {
    "num": "6.3",
    "kind": "Proposition",
    "name": "The ideal low-pass filter is non-causal",
    "deps": [
        "sig-6.2",
        "sig-5.11"
    ],
    "statement": "The exact ideal low-pass impulse response is nonzero at arbitrarily negative times. Delaying it by any finite $D$ does not make it causal:\n$$h_D(t)=\\frac{\\sin(W(t-D))}{\\pi(t-D)}.$$\nA finite causal truncation, $g_D=h_D1_{[0,2D]}$ with $D>0$, is absolutely integrable, but its frequency response is no longer the ideal brick wall.",
    "idea": "Choose an integer $k$ with $(k+1/2)\\pi>WD$. At $t=D-(k+1/2)\\pi/W<0$, $h_D(t)=(-1)^kW/[\\pi^2(k+1/2)]\\ne0$. This is an explicit witness for every finite delay. For the truncated kernel, symmetry about $D$ gives\n$$G_D(i\\omega)=e^{-i\\omega D}\\frac{\\operatorname{Si}((W+\\omega)D)+\\operatorname{Si}((W-\\omega)D)}{\\pi},$$\nwhere $\\operatorname{Si}(x)=\\int_0^x\\sin(u)/u\\,du$. Removing the tails changes the transform, rather than merely adding delay.",
    "caption": "Compare the delayed infinite sinc with its causal finite window. The negative-time witness remains nonzero as delay grows. The second panel shows the exact finite-window gain and its cutoff ripples.",
    "scope": "The orange kernel is kept only on $[0,2D]$ and is exactly zero elsewhere. Its DC gain is reported without hidden renormalization. The ideal reference includes its infinite tails; the visible time interval is finite. A magnitude zero has no defined phase. Sine integrals use chapter-local Gauss quadrature, checked against independent high-precision integrals.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.noncausal
    },
    {
    "num": "6.4",
    "kind": "Theorem",
    "name": "Paley–Wiener criterion for causal filters",
    "deps": [
        "sig-6.3",
        "rca-19.2"
    ],
    "statement": "Let $m\\ge0$ be nonzero with $m\\in L^2(\\mathbb R)$. There exists a causal $h\\in L^2$, with engineering Fourier transform satisfying $|H(i\\omega)|=m(\\omega)$ almost everywhere, if and only if\n$$\\int_{\\mathbb R}\\frac{\\log m(\\omega)}{1+\\omega^2}\\,d\\omega>-\\infty.$$\nThe positive part is automatically integrable; the condition concerns the negative part. This is existence of some phase, not causality of every phase, nor a guarantee of BIBO stability. A zero on a positive-measure band fails; a zero at one isolated point need not fail.",
    "idea": "Here frequency is nondimensionalized against a fixed unit. For sufficiency define, in $\\Re s>0$,\n$$K(s)=\\frac1\\pi\\int_{\\mathbb R}\\left(\\frac1{s-i\\omega}-\\frac{i\\omega}{1+\\omega^2}\\right)\\log m(\\omega)\\,d\\omega.$$\nThe subtracted kernel is $O(\\omega^{-2})$, so the weighted integrability gives an analytic $K$. Its real part is the Poisson integral of $\\log m$. For $F=e^K$, Jensen's inequality gives $|F|^2\\le P_x*m^2$ and hence $\\sup_{x>0}\\int|F(x+iy)|^2dy\\le\\int m^2$. Poisson boundary limits give $|F(iy)|=m(y)$ almost everywhere. Apply RCA19.2 to $f(z)=F(-iz)$ in the upper half-plane: its $e^{itz}$ representation becomes $F(s)=\\int_0^\\infty h(t)e^{-st}dt$, so $h$ is causal and square integrable.\n\nFor necessity, the causal transform lies in right-half-plane $H^2$ by the same theorem. The Cayley change $s=(1+z)/(1-z)$ gives a disk $H^2$ function $g(z)=\\sqrt2\\,F(s)/(1-z)$. On $z=e^{i\\theta}$, $s=i\\cot(\\theta/2)$ and the factor exactly supplies $|dy/d\\theta|=2/|1-e^{i\\theta}|^2$. A nonzero disk $H^2$ function has integrable negative boundary logarithm: remove a zero at the origin if needed, apply Jensen's formula to the radial logarithmic means (bounded below by $\\log|g(0)|$), and use its bounded $L^2$ means to bound the positive logarithm before Fatou's lemma. The extra $\\log|1-e^{i\\theta}|$ is integrable. Changing variables back gives precisely the weighted log condition.\n\nFor $m=(1+\\omega^2)^{-\\alpha/2}$, $\\alpha>1/2$, the negative integral is $\\alpha\\pi\\log2$. For $m=e^{-a\\omega^2}$, $a>0$, its symmetric partial value is $2a(R-\\arctan R)$, which diverges. These are analytic conclusions, not extrapolations from a finite plot.",
    "caption": "Compare a power-law tail, a Gaussian tail and an exact stop band. The upper panel shows log magnitude; the lower accumulates the actual weighted negative logarithm. A finite window cannot certify the infinite-range criterion.",
    "scope": "All displayed magnitudes lie in $L^2$ and are dimensionless. Power exponents stay above1/2 and Gaussian rates are positive. An exact stop band is shown as an infinite obstruction, never replaced by a small positive floor. A stop band outside the current finite window still fails the whole-line theorem. The power-law limit is drawn from its proved value.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.paley
    },
    {
    "num": "6.5",
    "kind": "Definition",
    "name": "Linear phase and distortionless transmission",
    "deps": [
        "sig-6.1",
        "sig-5.17"
    ],
    "statement": "Transmission is distortionless on a specified spectral support if\n$$H(i\\omega)=A e^{-i\\omega D}$$\nthere, with constant $A$ and delay $D$. Then $y(t)=Ax(t-D)$. Flat magnitude alone is insufficient: a nonlinear phase changes relative timing between frequencies. For a real impulse response, $H(-i\\omega)=\\overline{H(i\\omega)}$; an arbitrary phase curve need not satisfy this symmetry.",
    "idea": "Multiply the spectrum by $Ae^{-i\\omega D}$ and use the time-shift identity. Conversely, applying distortionless transmission to every signal supported in the band forces this multiplier there almost everywhere. The finite illustration assigns the odd phase $-D\\omega-\\beta\\omega^3/3$ to positive and negative harmonics consistently, so its output is real. At $\\beta=0$ it is exactly a scaled delay; for nonzero curvature the five exact harmonic phase shifts generally change the shape.",
    "caption": "Turn on phase curvature while keeping every harmonic amplitude fixed. Compare the actual output with the scaled, delayed input and inspect the unwrapped phase that caused the difference.",
    "scope": "Five exact real harmonics with a declared odd phase. This is a spectral thought experiment; the cubic phase is not asserted to be a causal physical filter. The magnitude scale stays fixed when curvature changes. The reference uses the same gain and delay as the output.",
    "refs": [
        "Oppenheim–Verghese2010, selected printed49–53: real-signal phase symmetry, delay and narrowband phase expansion; own finite-harmonic construction"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ],
    "links": {
        "course": "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/a6bddaee5966f6e73450e6fe79ab0566_MIT6_011S10_notes.pdf"
    }
,
    viz:V.linearPhase
    },
    {
    "num": "6.6",
    "kind": "Phenomenon",
    "name": "Group delay and the dispersion of a pulse",
    "deps": [
        "sig-6.5"
    ],
    "statement": "Where $H\\ne0$ and a continuous phase $\\phi$ is differentiable, group delay is\n$$\\tau_g(\\omega)=-\\phi'(\\omega).$$\nA narrowband packet sees approximately its center-frequency group delay when gain is nearly constant and higher phase derivatives are negligible across its occupied band. Variation of group delay can spread or reshape the packet; differentiating wrapped phase jumps does not measure that delay.",
    "idea": "Use the exact complex Gaussian $x(t)=e^{-t^2/(2\\sigma^2)}e^{i\\omega_ct}$ and the unit-magnitude multiplier $H=e^{-iD\\omega-i\\beta(\\omega-\\omega_c)^2/2}$. Its group delay is $D+\\beta(\\omega-\\omega_c)$, and direct Gaussian inversion gives\n$$y(t)=\\frac{\\sigma}{\\sqrt{\\sigma^2+i\\beta}}\\exp\\!\\left[-\\frac{(t-D)^2}{2(\\sigma^2+i\\beta)}\\right]e^{i\\omega_c(t-D)}.$$\nThe envelope width changes from $\\sigma$ to $\\sqrt{\\sigma^4+\\beta^2}/\\sigma$, while total energy is preserved. This exact packet calculation does not require the narrowband first-order approximation; it reveals the second-order phase effect omitted by that approximation.",
    "caption": "Change dispersion and packet width. The group-delay slope and spectral envelope explain the output envelope's broadening; the time traces show the corresponding chirp. Reverse dispersion to reverse the chirp without changing its envelope width.",
    "scope": "An exact complex-signal example with an ideal unit-magnitude quadratic phase, generally neither causal nor Hermitian symmetric about zero. Real and imaginary traces are separately labeled. Envelope width is the amplitude Gaussian parameter, not the energy RMS width; the latter is smaller by $\\sqrt2$. Group delay is computed analytically from unwrapped phase.",
    "refs": [
        "Oppenheim–Verghese2010, selected printed50–53: local phase expansion and group versus phase delay; own complete complex Gaussian inversion"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ],
    "links": {
        "course": "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/a6bddaee5966f6e73450e6fe79ab0566_MIT6_011S10_notes.pdf"
    }
,
    viz:V.groupDelay
    },
    {
    "num": "6.7",
    "kind": "Method",
    "name": "Bode plots",
    "deps": [
        "sig-6.1",
        "circ-7.6"
    ],
    "statement": "A Bode plot places gain in decibels and unwrapped phase against logarithmic frequency. A real pole contributes\n$$-10\\log_{10}(1+(\\omega/p)^2)$$\nto gain and $-\\arctan(\\omega/p)$ to phase. A real zero contributes the opposite signs. Beyond its corner, one pole adds $-20$ dB/decade; one zero adds $+20$ dB/decade.",
    "idea": "For $H(s)=K(1+s/z)/(1+s/p)$, take logarithms of the factor magnitudes and add their arguments. Replacing $\\sqrt{1+r^2}$ by $1$ below its corner and by $r$ above it produces the straight-line magnitude asymptote. The standard two-decade phase ramp is only an approximation: the exact arctangent continues outside that interval. Equal pole and zero cancel algebraically, leaving constant gain and zero phase. The chapter derives the transfer family directly; the listed circuit prerequisite remains planned.",
    "caption": "Move a real pole and optionally a real zero. Compare exact gain and phase with their straight-line approximations; watch cancellation when both corners coincide.",
    "scope": "Stable, causal rational factors with positive real corner rates, and $K>0$. Frequency is in rad/s on true logarithmic axes; phase is in degrees. Each factor has multiplicity one. The pole/zero schematic uses the real $s$ axis; a zero is hollow and a pole is crossed.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.bodePlots
    },
    {
    "num": "6.8",
    "kind": "Model",
    "name": "First-order systems: time constant and bandwidth",
    "deps": [
        "sig-6.7",
        "sig-2.9"
    ],
    "statement": "For the first-order system $\\tau y'+y=x$ with $\\tau>0$, the unit-DC-gain transfer is $H(s)=(1+s\\tau)^{-1}$. From zero initial state its unit-step response is\n$$y(t)=1-e^{-t/\\tau},\\qquad t\\ge0.$$\nIts half-power bandwidth is $\\omega_b=1/\\tau$ rad/s, or $f_b=1/(2\\pi\\tau)$ Hz. At $t=\\tau$ it reaches $1-e^{-1}$ of its final value.",
    "idea": "The ODE gives the exponential step directly. For the frequency response, $|H|^2=1/(1+\\omega^2\\tau^2)$; setting this to1/2 gives the angular bandwidth. Solving $y=q$ gives $t_q=-\\tau\\log(1-q)$, so the10–90% rise is $\\tau\\log9$. Halving $\\tau$ halves all these times and doubles both bandwidth conventions. The algebraic inverse $x=\\tau y'+y$ contains differentiation and is not a BIBO-stable inverse.",
    "caption": "Change the time constant and read the actual10%,63.2% and90% step crossings alongside the half-power point. Both panels use physical axes, so the faster rise and wider pass band are visible together.",
    "scope": "Unit step, zero initial state, no transport delay or gain uncertainty. The bandwidth marker uses the exact half-power level $-10\\log_{10}2$ dB, often rounded to−3dB. Seconds, rad/s and Hz are kept distinct.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.firstOrder
    },
    {
    "num": "6.9",
    "kind": "Model",
    "name": "Second-order systems: resonance and damping",
    "deps": [
        "sig-6.7",
        "circ-6.2"
    ],
    "statement": "For $\\omega_n>0$ and $\\zeta>0$, consider\n$$H(s)=\\frac{\\omega_n^2}{s^2+2\\zeta\\omega_ns+\\omega_n^2}.$$\nIt is stable. The step is underdamped when $0<\\zeta<1$, but a nonzero-frequency magnitude peak exists only when $\\zeta<1/\\sqrt2$. In that case $\\omega_r=\\omega_n\\sqrt{1-2\\zeta^2}$ and the peak gain is $[2\\zeta\\sqrt{1-\\zeta^2}]^{-1}$.",
    "idea": "For $u=\\omega/\\omega_n$, the squared denominator is $(1-u^2)^2+4\\zeta^2u^2$. Differentiating with respect to $u^2$ gives the resonance condition and peak. The homogeneous ODE roots give damped oscillations for $\\zeta<1$, a repeated real root at1, and two negative real roots above1. The unit-step fractional overshoot in the underdamped case is $e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}$; it can be tiny even when the response is mathematically oscillatory. The model is derived here without claiming that the planned circuit prerequisite has been read.",
    "caption": "Vary damping through the resonance threshold and through critical damping. The transient and gain curve share the same parameters, so the interval with an oscillatory step but no resonant gain peak is explicit.",
    "scope": "New normalized second-order family, unit step and zero initial state. A selector also shows the impulse response, whose units differ from the step. Time range expands with the slow decay rate; the readout identifies that changing range. The overshoot formula retains its logarithm when the positive value is below binary64 range.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.secondOrder
    },
    {
    "num": "6.10",
    "kind": "Concept",
    "name": "Minimum-phase systems and all-pass factors",
    "deps": [
        "sig-6.7"
    ],
    "statement": "A stable real rational continuous-time transfer is called minimum phase when all its finite zeros lie in the open left half-plane. A causal stable rational transfer with no zeros on the imaginary axis can be factored into a minimum-phase term and an all-pass term. All-pass factors change phase while preserving magnitude. A pure delay also preserves magnitude.",
    "idea": "Use the biproper family $H_{\\rm min}(s)=(1+s/z)/(1+s/p)$ with $p,z>0$. Both it and its proper inverse are causal and BIBO stable, allowing an instantaneous feedthrough term. Reflecting the zero gives\n$$H_{\\rm R}(s)=\\frac{1-s/z}{1+s/p}=H_{\\rm min}(s)\\frac{z-s}{z+s}.$$\nThe all-pass ratio has unit magnitude, phase $-2\\arctan(\\omega/z)$ and positive group delay $2z/(z^2+\\omega^2)$. The two step responses are $1+(p/z-1)e^{-pt}$ and $1-(1+p/z)e^{-pt}$. Their initial jumps have opposite signs. For strictly proper continuous-time minimum-phase systems, a causal BIBO-stable inverse need not exist: the inverse may be improper. Excluding right-half-plane zeros also does not exclude a nonrational pure delay.",
    "caption": "Reflect the zero across the imaginary axis. The gain curves coincide, while phase and initial step motion separate. The zero positions and both exact step traces make the factorization visible.",
    "scope": "Positive real pole and zero rates, real rational transfers, unit DC gain. The displayed instantaneous step jump is a feedthrough effect, not a time-stepping error. Minimum-phase terminology is stated for finite zeros; the chosen biproper example supports the stronger stable proper-inverse claim.",
    "refs": [
        "Oppenheim–Verghese2010, selected printed58–64: all-pass factors, CT inverse properness, factorization and gain ambiguity"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ],
    "links": {
        "course": "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/a6bddaee5966f6e73450e6fe79ab0566_MIT6_011S10_notes.pdf"
    }
,
    viz:V.minimumPhase
    },
    {
    "num": "6.11",
    "kind": "Theorem",
    "name": "Bode’s gain–phase relation and the Hilbert transform",
    "deps": [
        "sig-6.10",
        "rca-17.23"
    ],
    "statement": "For a real rational minimum-phase transfer, with no imaginary-axis zeros, positive DC sign and fixed phase normalization, gain determines phase. For the biproper family of6.10, let $L(\\omega)=\\log|H(i\\omega)|$. Then\n$$\\phi(\\omega)=\\frac{2\\omega}{\\pi}\\int_0^\\infty\\frac{L(\\Omega)-L(\\omega)}{\\Omega^2-\\omega^2}\\,d\\Omega,\\qquad\\omega>0.$$\nThe apparent singularity is removable, with quotient limit $L'(\\omega)/(2\\omega)$. All-pass factors and pure delays are additional phase information invisible to gain.",
    "idea": "Choose the analytic branch $\\log H(s)$ in the right half-plane and subtract its real high-frequency constant. For this rational family the result decays as $1/s$. Cauchy's integral formula on a right-half-plane semicircle relates its boundary real and imaginary parts. With the engineering $s=i\\omega$ boundary orientation it gives $\\phi(\\omega)=\\pi^{-1}\\operatorname{PV}\\int_{\\mathbb R}[L(\\Omega)-L(\\infty)]/(\\Omega-\\omega)\\,d\\Omega$. Evenness of $L$ combines positive and negative frequencies to the displayed formula; the constant principal-value contribution vanishes. Subtracting $L(\\omega)$ removes the remaining pole. For our explicit family,\n$$\\phi=\\arctan(\\omega/z)-\\arctan(\\omega/p).$$\nThe numerical reconstruction integrates the displayed gain-only formula after $\\Omega=\\tan u$, split at $u=\\arctan\\omega$. It is compared with the exact rational phase. RCA17.23 defines a related circle conjugate-function convention and retains its existing verification flag; that convention is not silently copied as a real-line sign. Rational zero/pole conditions, branch normalization and the decay subtraction provide the assumptions used here.",
    "caption": "Reconstruct phase from the gain curve, then add a reflected zero or pure delay. The reconstruction keeps following the minimum-phase reference, while the actual phase gains an amount that magnitude cannot reveal.",
    "scope": "Natural logarithm of dimensionless gain, radians of unwrapped phase and rad/s of frequency. The readout compares quadrature with the exact minimum-phase result at the selected probe. Quadrature error is measured against that result for this family, not asserted as a universal bound. The reference assumes positive DC sign; arbitrary constant signs are extra phase ambiguity.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.gainPhase
    },
    {
    "num": "6.12",
    "kind": "Concept",
    "name": "Rise time versus bandwidth",
    "deps": [
        "sig-6.8",
        "sig-5.15"
    ],
    "statement": "For one real pole,10–90% rise time $t_r$ and half-power bandwidth in Hz obey\n$$t_r f_b=\\frac{\\log9}{2\\pi}\\approx0.3497.$$\nThis is a property of that family, not a universal theorem about every filter. Two cascaded real poles give a similar constant when their bandwidth is matched. A causal all-pass factor preserves the gain and half-power bandwidth while changing the step and its rise time.",
    "idea": "For one pole, $t_q=-\\log(1-q)/\\omega_b$. For two identical poles, use time constant $\\sqrt{\\sqrt2-1}/\\omega_b$ to keep the same half-power bandwidth and solve $1-e^{-u}(1+u)=q$ for each crossing. Their product is approximately0.344. For the all-pass counterexample, multiply $\\omega_b/(s+\\omega_b)$ by $(a-s)/(a+s)$. The resulting step has an initial negative slope. When $a\\ne\\omega_b$ it is\n$$1+\\frac{2\\omega_b e^{-at}-(a+\\omega_b)e^{-\\omega_bt}}{a-\\omega_b};$$\nat equality it is $1-e^{-\\omega_bt}(1+2\\omega_bt)$. As $a/\\omega_b$ becomes small, the slow all-pass transient can make the10–90% rise much longer without changing the magnitude response. Energy RMS uncertainty in5.15 concerns different quantities and does not prove a universal rise-time constant.",
    "caption": "Match the bandwidth and compare one pole, two poles or one pole plus an all-pass factor. Measure the actual10% and90% crossings; the all-pass example keeps the original gain while stretching the measured rise.",
    "scope": "Zero initial state, final step value1. Rise means the positive10% and90% crossings after any initial undershoot; the bracketed crossing calculation is independently checked. Angular bandwidth controls are converted to Hz before forming the product. A long all-pass transient expands the displayed time range, which is reported explicitly.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.riseTime
    },
    {
    "num": "6.13",
    "kind": "Phenomenon",
    "name": "Ringing of sharp filters",
    "deps": [
        "sig-6.3",
        "sig-4.4"
    ],
    "statement": "An ideal low-pass applied to a unit step has\n$$y(t)=\\frac12+\\frac{\\operatorname{Si}(Wt)}\\pi.$$\nIts first overshoot is $\\operatorname{Si}(\\pi)/\\pi-1/2\\approx0.08949$ above the final level. Increasing $W$ compresses the oscillations in time but does not reduce this fractional overshoot. Gentler spectral transitions alter the impulse tail and the step shape.",
    "idea": "Integrate $h(t)=\\sin(Wt)/(\\pi t)$ from minus infinity to $t$; symmetry supplies the half. The first positive stationary point is $Wt=\\pi$, and its value gives the Gibbs constant. The comparison family uses a trapezoidal magnitude:1 below $W(1-r)$, linear down to0 at $W(1+r)$, with $0\\le r\\le1$. It is the average of ideal cutoffs across that transition, so its inverse is\n$$h_r(t)=\\frac W\\pi\\operatorname{sinc}(Wt)\\operatorname{sinc}(rWt).$$\nAt $r=0$ the brick wall is recovered. At $r=1$ the impulse is nonnegative sinc-squared, hence its step is monotone. Every member is an even, generally noncausal ideal spectral design; smoothing alone does not establish causal realizability. For positive $r$ its $1/t^2$ tail is absolutely integrable, unlike the brick-wall endpoint.",
    "caption": "Widen the transition band and compare its exact impulse and step with the sharp reference. Change cutoff separately to see time compression. The triangular endpoint removes step overshoot by making the whole impulse nonnegative.",
    "scope": "Normalized sinc means $\\sin x/x$. The transition control interpolates between a brick wall and a triangle in frequency; both are explicitly ideal and noncausal. The plot shows a finite time window, and the readout reports the step at $t=\\pi/W$, not a claimed global maximum for every taper. Smoothing is not labeled a causal remedy.",
    "refs": [
        "Complete chapter-local derivation under the stated engineering Fourier convention"
    ],
    "tags": [
        "frequency response",
        "filtering"
    ]
,
    viz:V.ringing
    },
  ],
};
