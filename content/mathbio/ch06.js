// Mathematical biology — Wave6. Frozen identities; declared models and source scopes.
import * as V from './ch06.viz.js';
export default {
  "collection": "mathbio",
  "chapter": 6,
  "title": "Oscillators, switches and excitability",
  "summary": "Explicit models separate stable cycles, finite oscillatory transients, bistability and excitable excursions. A strict Dulac argument rules out planar cycles, an invariant Sel’kov polygon supplies an existence proof, and the secant bound identifies a local feedback instability. Exact radial phase geometry then exposes resetting singularities, while finite circle-map searches make the limits of numerical entrainment evidence visible.",
  "items": [
    {
      "num": "6.1",
      "kind": "Theorem",
      "name": "Bendixson–Dulac criterion",
      "deps": [
        "mathbio-3.10",
        "pma-10.45",
        "ode-7.4"
      ],
      "statement": "Let F be a C¹ planar vector field on an open **simply connected** domain D. If a C¹ scalar function B makes the weighted divergence\n$$\\nabla\\cdot(BF)$$\nstrictly positive throughout D, or strictly negative throughout D, there is no nonconstant periodic orbit contained in D. A version allowing zeros requires additional conditions preventing a whole enclosed open region from having zero divergence. Merely being nonzero somewhere in D is insufficient.\n\nFor $\\dot x=x(1-bx-y)$ and $\\dot y=y(x-1)$ on the positive quadrant, $B=1/(xy)$ gives\n$$\\nabla\\cdot(BF)=-b/y.$$\nThus b>0 excludes interior cycles; b=0 makes this test inconclusive.",
      "idea": "A periodic orbit of a C¹ planar flow is a simple closed curve. Its vector field is tangent to that curve, so the outward flux of BF is zero. Simple connectivity keeps the enclosed region inside D. Green’s theorem converts the flux to the integral of the weighted divergence, whose strict sign makes it nonzero: a contradiction. This supplies the needed argument locally without assuming the later ODE criterion lesson.\n\nThe displayed circle is only a candidate orbit. Its nonzero computed flux can reject that circle even when the global sign test is inconclusive. Conversely, zero flux is not by itself an existence proof. At b=0 the predator–prey model has a conserved quantity and genuine periodic families, illustrating the inconclusive case.",
      "caption": "Compare an unweighted field with a Dulac-weighted predator–prey field, or use a damped rotation. Change the candidate-circle radius and compare its line-integral flux with a separately derived area formula. Blue and orange tiles show the sign of the weighted divergence.",
      "scope": "The predator–prey domain is x>0,y>0; the factor 1/(xy) is not defined on its axes. Rotation uses B=1 on the entire plane. The sign criterion is analytic over the declared domain, not inferred from a sampled color grid. The circle integral uses finite quadrature; the independent area expression exposes its numerical error. No conclusion is drawn from a rounded flux alone.",
      "refs": [
        "Written Green’s theorem PMA10.45 and limit-cycle definition MATHBIO3.10; direct flux and divergence calculation"
      ],
      "links": {},
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.dulac
    },
    {
      "num": "6.2",
      "kind": "Model",
      "name": "Van der Pol oscillator and relaxation oscillations",
      "deps": [
        "mathbio-3.10",
        "mathbio-3.12",
        "ode-7.6",
        "ode-7.8"
      ],
      "statement": "The van der Pol equation\n$$\\ddot x-\\mu(1-x^2)\\dot x+x=0$$\nwith μ>0 is a classical oscillator with an attracting limit cycle. In Liénard coordinates $y=x-x^3/3-\\dot x/\\mu$ it becomes\n$$\\dot x=\\mu(x-x^3/3-y),$$\n$$\\dot y=x/\\mu.$$\nFor large μ, slow motion near the outer branches of the cubic alternates with fast transitions. Its leading period asymptote is\n$$T\\sim\\mu(3-2\\log2).$$\nThis is not an equality for the moderate values shown.",
      "idea": "The circuit reduction in the cited draft gives $\\ddot x+F'(x)\\dot x+x=0$ after choosing unit capacitance and inductance. Taking $F(x)=\\mu(x^3/3-x)$ supplies the model. Its energy derivative is $\\dot E=\\mu(1-x^2)\\dot x^2$: small motions receive energy and large motions dissipate it. This explains amplitude regulation, but alone is not a proof of uniqueness; the classical cycle statement is the model introduced in MATHBIO3.10.\n\nOn a slow branch, y≈x−x³/3 and $dt\\approx\\mu(1-x^2)dx/x$. Integrating from x=2 to x=1 gives one slow leg $\\mu(3/2-\\log2)$; symmetry doubles it. Jump times are lower-order in this asymptotic argument.",
      "caption": "Increase μ and inspect the same trajectory in the Liénard plane and in time. Compare the measured late-window upward-crossing period with its large-μ asymptote. A time marker moves through both panels.",
      "scope": "Dimensionless deterministic model, μ between 0.2 and 8, with a fixed initial state. The transformed y coordinate depends on μ. A fixed-step RK4 trajectory and interpolated crossings describe a finite 80-unit run; a finite period estimate is not an exact cycle computation. The original van der Pol paper and the unavailable Scholarpedia body were not read. The circuit reduction, written prerequisite and independent derivation are the scoped basis here.",
      "refs": [
        "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §4.7 pp.78–79, circuit reduction",
        "Written MATHBIO3.10; direct coordinate and slow-branch calculation"
      ],
      "links": {
        "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.vdp
    },
    {
      "num": "6.3",
      "kind": "Model",
      "name": "Sel’kov model of glycolytic oscillations",
      "deps": [
        "mathbio-3.11",
        "mathbio-5.1"
      ],
      "statement": "The dimensionless Sel’kov model used here is\n$$\\dot x=-x+(a+x^2)y,$$\n$$\\dot y=b-(a+x^2)y,$$\nwith a=0.1 and positive supply b. Its unique positive equilibrium is\n$$x_*=b,\\qquad y_*={b\\over a+b^2}.$$\nWriting w=a+b², the Jacobian has determinant w and trace $1-w-2a/w$. The trace is positive between the two supply boundaries obtained from\n$$w_\\pm={1\\pm\\sqrt{1-8a}\\over2},$$\n$$b_\\pm=\\sqrt{w_\\pm-a}.$$\nThey are about 0.41999 and 0.78969. The equilibrium is a repeller in this open interval.",
      "idea": "Adding the equations gives $\\dot x+\\dot y=b-x$. For an explicit trapping polygon choose $Y=b/a+1$, $X=Y+b+1$, $y_R=X/[2(a+X^2)]$ and L=X+yR. Its vertices are (0,0), (X,0), (X,yR), (L−Y,Y), (0,Y). On the top edge $\\dot y<0$; on the diagonal the outward sum is b−x<0; on the right edge $\\dot x\\le-X/2$. The coordinate-axis edges point inward or tangent.\n\nThis compact positively invariant region contains the unique equilibrium. In the strict unstable interval that point is a hyperbolic repeller, so a nonstationary trajectory cannot have it as its forward limit. There are no other equilibria or boundary limit orbits. Poincaré–Bendixson therefore supplies a periodic orbit, without establishing its uniqueness. The finite simulation illustrates this existence argument rather than replacing it.",
      "caption": "Vary substrate supply with a fixed a=0.1. Compare the orbit with its nullclines, then switch to the explicit invariant outer bound. The time panel makes slow near-boundary transients visible.",
      "scope": "A two-variable reduced chemical model, not a complete glycolytic pathway or measured ATP/ADP assay. The NIH/NSR model archive supplies the equations and reported Hopf behavior; the equilibrium, stability boundaries and polygon certificate are derived here. The simulation begins in the invariant region. Near a numerically unresolved boundary, no strict repeller classification is asserted. The existing mass-action prerequisite is retained; the rate equations and their analysis are given explicitly here.",
      "refs": [
        "NIH/NSR JSim model 0341, Selkov: actual equations, nullclines and parameter description",
        "Written Poincaré–Bendixson result MATHBIO3.11; direct equilibrium and invariant-bound proof"
      ],
      "links": {
        "modelArchive": "https://www.imagwiki.nibib.nih.gov/physiome/jsim/models/webmodel/NSR/selkov"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.selkov
    },
    {
      "num": "6.4",
      "kind": "Model",
      "name": "Goodwin oscillator",
      "deps": [
        "mathbio-5.8",
        "mathbio-3.12"
      ],
      "statement": "A three-stage negative-feedback model is\n$$\\dot x={2\\over1+z^h}-x,$$\n$$\\dot y=x-y,\\qquad\\dot z=y-z,$$\nwhere h>0 is a Hill exponent. This particular scaling fixes the equilibrium at (1,1,1). Its local repression gain is h/2 and the characteristic equation is\n$$(\\lambda+1)^3+h/2=0.$$\nThe equilibrium loses linear stability at h=16, with a nonzero imaginary pair. Oscillatory finite trajectories above that threshold are a model observation; linear instability alone does not prove a global nonlinear cycle.",
      "idea": "The Hill-law prerequisite gives a negative slope of magnitude h/2 at z=1. Linearize the three decay stages around their common equilibrium. Eliminating successive components gives the characteristic polynomial, whose leading pair has real part $(h/2)^{1/3}/2-1$.\n\nThe often quoted necessary cooperativity condition h>8 concerns the maximum possible slope-to-decay loop gain across Goodwin parameter choices. It is not the threshold of every fixed production scaling. Here the equilibrium sits at half repression, so the actual gain is h/2 and the crossing is at 16. Positive states remain bounded because production never exceeds 2 and each later stage follows a linear decay driven by its predecessor.",
      "caption": "Change repression steepness and compare the three stage traces. The second panel is a projection of the same three-dimensional trajectory. Late-window ranges report what the finite run resolves without imposing a cycle amplitude.",
      "scope": "An idealized three-stage loop with equal unit degradation rates and a fixed production scale, not a fitted gene network. A closed-looking projection is not a planar periodic-orbit proof. Hill exponents are phenomenological; they do not automatically count binding sites. The tiny offset from h=16 is retained in a stable divided expression for the dominant real part.",
      "refs": [
        "Arcak & Sontag (2006), Diagonal stability of a class of cyclic systems and its connection with the secant criterion, Introduction Eqs.(1)–(3) and Theorem 1, pp.1531–1532",
        "Written Hill-law interpretation MATHBIO5.8; direct linearization and boundedness calculation"
      ],
      "links": {
        "primary": "https://sontaglab.org/FTPDIR/arcak_sontag_automatica06.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.goodwin
    },
    {
      "num": "6.5",
      "kind": "Theorem",
      "name": "Secant condition for feedback-loop oscillators",
      "deps": [
        "mathbio-6.4"
      ],
      "statement": "For an n-stage cyclic linearization, let all diagonal losses aᵢ be positive, all coupling magnitudes bᵢ be positive, and exactly one loop edge be negative. The dimensionless loop gain is\n$$G=\\prod_i b_i/a_i.$$\nFor n≥3, the **secant condition**\n$$G<\\sec(\\pi/n)^n$$\nis sufficient for a Hurwitz matrix. With equal losses it is also necessary. At equal unit losses and uniformly distributed coupling magnitude r=G¹⁄ⁿ, the eigenvalues are\n$$\\lambda_k=-1+r e^{(2k+1)\\pi i/n}.$$\nThus the three-stage threshold is 8 and the four-stage threshold is 4.",
      "idea": "The characteristic equation is $\\prod_i(\\lambda+a_i)+\\prod_i b_i=0$. At an imaginary-axis crossing, positive angles $\\theta_i=\\arctan(\\omega/a_i)$ sum to an odd multiple of π. The magnitude condition is $G=\\prod_i\\sec\\theta_i$. Convexity of log(sec θ) gives its least possible product at equal angles, yielding the bound. Starting with zero coupling, the roots are stable and cannot cross the imaginary axis below that gain. A nonnegative real root is excluded directly by the characteristic equation.\n\nFor equal losses the explicit roots show the first crossing exactly at the bound. With unequal losses the secant bound can fail while the matrix remains Hurwitz. The source’s stronger diagonal-stability theorem is a distinct statement; nonlinear global conclusions additionally require its sector/passivity hypotheses.",
      "caption": "Move stage count and loop gain. Inspect the actual equal-loss eigenvalues and an exact dominant linear mode, including neutral oscillations at the threshold. Growing modes are allowed to grow instead of being forced into a saturated cycle.",
      "scope": "A local linear stability theorem and equal-loss demonstration. It does not say that every nonlinear negative-feedback loop oscillates when the bound is exceeded. Non-exact numerical thresholds receive an uncertainty guard; exact three/four-stage thresholds and small represented offsets are retained. The modeled stage count is integral.",
      "refs": [
        "Arcak & Sontag (2006), Diagonal stability of a class of cyclic systems and its connection with the secant criterion, Introduction Eqs.(1)–(3) and Theorem 1, pp.1531–1532",
        "Direct characteristic-polynomial and convexity argument"
      ],
      "links": {
        "primary": "https://sontaglab.org/FTPDIR/arcak_sontag_automatica06.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.secant
    },
    {
      "num": "6.6",
      "kind": "Model",
      "name": "Bistable switch from positive feedback",
      "deps": [
        "mathbio-5.8",
        "mathbio-1.11"
      ],
      "statement": "For a self-activating Hill response of exponent 2, consider\n$$\\dot x=u(t)+{Ax^2\\over1+x^2}-x,$$\nwith x≥0, A>0 and a nonnegative input pulse. At baseline u=0, x=0 is stable. When A>2 there are two further equilibria\n$$x_\\pm={A\\pm\\sqrt{A^2-4}\\over2}.$$\nThe smaller is unstable and the larger stable, so x₋ separates two basins. A pulse that carries the state across x₋ can leave high activity after the input ends. At A=2 the positive roots merge into a one-sided-attracting, nonhyperbolic equilibrium.",
      "idea": "Factor the baseline vector field as $-x[x^2-Ax+1]/(1+x^2)$. Its signs between the nonnegative roots give the stability and basin picture directly. This is the one-dimensional saddle-node structure from the prerequisite; the Hill law supplies its sigmoidal production.\n\nDuring the pulse, u is added to production. Once the pulse ends, the state evolves under the same baseline field as before. Persistent high activity therefore comes from crossing a basin boundary, not from leaving the external input switched on. Pulse duration and height both affect whether this crossing occurs.",
      "caption": "Compare baseline production with linear degradation, then change pulse height and duration. The time trace highlights the pulse interval and the unstable threshold. Move the time marker to inspect the finite state.",
      "scope": "A dimensionless one-variable teaching construction with zero basal input, not a calibrated gene circuit. The pulse begins at time 5 and the model is integrated in separate constant-input intervals so that numerical stages do not straddle a discontinuity. Equilibrium values and root mergers are analytic, while the displayed transient is numerical.",
      "refs": [
        "Edelstein-Keshet, MCB2012 lecture 3, positive/negative feedback concepts, especially slides 9–10",
        "Written MATHBIO5.8 and 1.11; direct factorization and pulse model"
      ],
      "links": {
        "lecture": "https://personal.math.ubc.ca/~keshet/MCB2012/SlidesLEK/Lect3.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.feedbackSwitch
    },
    {
      "num": "6.7",
      "kind": "Phenomenon",
      "name": "Excitability",
      "deps": [
        "mathbio-6.2"
      ],
      "statement": "An excitable system has a stable resting state but can make a large, reproducible excursion after a sufficiently strong disturbance before returning toward rest. The response need not increase smoothly in proportion to stimulus strength.\n\nThe declared FitzHugh–Nagumo-type model is\n$$\\dot x=x-x^3/3-y,$$\n$$\\dot y=\\varepsilon(x+0.7-0.8y).$$\nIts unique equilibrium solves\n$$0.8x_*^3/3+0.2x_*+0.7=0.$$\nIt is locally stable for the positive recovery rates shown. A stimulus here is an instantaneous displacement of x from that same rest.",
      "idea": "The cubic activation nullcline and slower recovery variable separate a rapid excursion from a slower return. A small displacement can relax locally; a larger one can pass into the fast excursion region before recovery catches up. This geometric contrast is the useful meaning of an approximately all-or-none response in the example, not a universal exact threshold.\n\nThe equilibrium polynomial is strictly increasing, so it has one real root. At that root, the Jacobian trace is $1-x_*^2-0.8\\varepsilon<0$ and determinant $\\varepsilon[1-0.8(1-x_*^2)]>0$. This proves local resting stability. The finite excursion traces do not prove the entire global basin.",
      "caption": "Compare a fixed small kick with a selected kick, inspect the nullclines and move along the resulting trajectory. Change the recovery rate and read the sampled peak and the finite endpoint distance from rest.",
      "scope": "A normalized cubic/recovery model motivated by the cited draft’s FitzHugh–Nagumo treatment, with explicitly chosen parameters. It is not a transcription of its differently normalized equations or a measured neuron/heart response. The kick is a state displacement rather than a finite injected-current pulse; threshold and latency depend on that choice. No clinical interpretation is supplied.",
      "refs": [
        "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §4.7 pp.78–79, cubic activation and recovery",
        "Direct equilibrium and Jacobian calculation"
      ],
      "links": {
        "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.excitable
    },
    {
      "num": "6.8",
      "kind": "Model",
      "name": "Oregonator model of the Belousov–Zhabotinsky reaction",
      "deps": [
        "mathbio-6.2",
        "mathbio-5.13",
        "kin-8.7"
      ],
      "statement": "With constant feeds and q>0, a dimensionless three-variable **Oregonator** is\n$$\\varepsilon\\dot x=qy-xy+x(1-x),$$\n$$\\delta\\dot y=-qy-xy+fz,$$\n$$\\dot z=x-z.$$\nHere x is an activator proxy, y a bromide proxy and z an oxidized-catalyst proxy. Nonnegative states remain nonnegative: on each coordinate plane the corresponding derivative points inward or tangent. Separated time scales can produce relaxation pulses and make explicit time stepping inefficient.",
      "idea": "The cited primary model’s equations 8–10 reduce to these equations when its two feed variables are held at one. The feedback combines activator growth, inhibition by bromide, and delayed catalyst recovery. The later chemistry prerequisite is not needed to follow this explicitly declared system.\n\nFor numerical integration, each coordinate subproblem has an exact positive flow: x follows a Riccati equation with y held fixed, while y and z follow linear relaxation equations. A symmetric composition with adaptive step doubling controls its local error without clipping negative concentrations. Independent Radau trajectories check the coupled result; positivity of substeps alone would not establish global accuracy.",
      "caption": "Change the fast time scales and stoichiometric factor. Compare the normalized chemical pulses with a raw activator/catalyst projection and read the actual selected concentrations. Each curve’s normalization is stated explicitly.",
      "scope": "Dimensionless, chemostatted teaching parameters with q=0.0008 and a fixed positive initial state. These are not the paper’s calibrated batch experiment, depleting feeds or electrochemical coupling. Time curves use separate finite-run maxima, so their heights do not compare species concentrations. Colors identify variables; they do not simulate a literal catalyst spectrum. The independent source is the distinct 2022 paper, not the inaccessible Scholarpedia article.",
      "refs": [
        "Liu, Pérez-Mercader & Kiss (2022), Synchronization of Belousov–Zhabotinsky oscillators with electrochemical coupling in a spontaneous process, model Eqs.(3)–(10), DOI 10.1063/5.0096689",
        "Independent positive-subflow derivation; adaptive composition checked with SciPy Radau"
      ],
      "links": {
        "primary": "https://par.nsf.gov/servlets/purl/10436523"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.oregonator
    },
    {
      "num": "6.9",
      "kind": "Concept",
      "name": "Phase and the phase response curve",
      "deps": [
        "mathbio-3.10"
      ],
      "statement": "**Asymptotic phase** assigns the same phase to states whose trajectories approach the same point moving around a stable cycle. A phase response curve records the phase change caused by a specified perturbation at each initial phase; it is not merely the next observed peak time.\n\nFor the explicit radial model\n$$\\dot r=r(1-r^2),$$\n$$\\dot\\theta=1+\\beta(1-r^2),$$\nthe unit circle is attracting and\n$$\\Theta=\\theta-\\beta\\log r,$$\n$$\\dot\\Theta=1.$$\nA horizontal pulse at a unit-cycle point gives infinitesimal response $Z_x(\\theta)=-\\sin\\theta-\\beta\\cos\\theta$.",
      "idea": "Differentiate the displayed phase function along the flow; the amplitude-dependent angular term cancels. This proves the phase relation directly and shows why a transient amplitude change can alter phase when β is nonzero.\n\nThe pulse sends the point $e^{i\\theta}$ to $e^{i\\theta}+A$. Evaluate the same phase function at that new point and subtract its old value. Differentiating this finite response with respect to A at zero gives the stated infinitesimal curve. The exact finite curve can differ from its linear approximation even though every landing point in the offered weak-pulse range stays away from the singular origin.",
      "caption": "Choose pulse phase, amplitude and isochron shear. Compare the actual post-pulse trajectory with its asymptotically matching cycle point, and compare the exact finite response with the infinitesimal prediction multiplied by pulse amplitude.",
      "scope": "An analytically tractable normal-form oscillator, not a measured biological PRC. Phase is reported in cycles while the angular equation uses radians. The plotted response uses a continuous lift over amplitudes 0–0.6; it is not silently folded into an arbitrary principal half-cycle interval. The university-hosted draft’s λ–ω model motivates the construction; its final published edition is not claimed.",
      "refs": [
        "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §9.1 pp.172–179, isochrons, resetting and λ–ω models",
        "Direct radial solution and phase-gradient calculation"
      ],
      "links": {
        "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.phase
    },
    {
      "num": "6.10",
      "kind": "Phenomenon",
      "name": "Phase singularities and type 0 resetting (Winfree)",
      "deps": [
        "mathbio-6.9"
      ],
      "statement": "A sufficiently strong pulse can change the topology of a phase-reset map. For the radial oscillator with β=0, horizontal translation sends the unit circle to a circle centered at (A,0). The map from old phase to new phase winds once around the origin when A<1 and zero times when A>1. These are the weak/type 1 and strong/type 0 cases in this geometric example.\n\nAt A=1 and old phase 1/2, the pulse lands **exactly** at the unstable equilibrium (0,0). Phase is undefined there. The deterministic state remains there, but nearby nonzero states can return to the cycle after a long delay.",
      "idea": "Phase is the polar angle away from the origin. A translated unit circle surrounds the origin below the critical translation, misses it above, and touches it exactly at the transition. This gives the change in winding number without inferring it from a coarse plotted curve.\n\nThe radial equation has an exact positive solution for every nonzero initial radius. Its recovery time grows as the landing radius approaches zero. Therefore near-singular latency and permanent residence at the exact equilibrium must be distinguished. The displayed lift is continuous where the global reset map is defined; at the critical landing point the graph is deliberately broken.",
      "caption": "Move pulse amplitude across one and set the old phase near one half. Inspect the translated cycle, the exact landing radius, recovery time and reset map. At the exact singularity the phase and recovery readouts are undefined.",
      "scope": "A normal-form phase geometry demonstration, not a recreation of Winfree’s circadian experiments or a finite area of permanently stopped clocks. The origin is unstable. Exact cardinal phases are represented explicitly so a sine-rounding residue does not turn the critical equilibrium into a false nonzero orbit. Neighboring represented amplitudes remain distinct; the singular state is not created by an arbitrary tolerance band.",
      "refs": [
        "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §9.1.1 pp.174–175, weak/strong resetting and the Hopf normal form",
        "Direct translated-circle and radial-recovery derivation"
      ],
      "links": {
        "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.singularity
    },
    {
      "num": "6.11",
      "kind": "Phenomenon",
      "name": "Entrainment and Arnold tongues",
      "deps": [
        "mathbio-6.9"
      ],
      "statement": "**Entrainment** is locking of an oscillator’s timing to periodic forcing. A simple phase-map model is the lift\n$$F(\\theta)=\\theta+\\Omega$$\n$$\\qquad{}-{K\\over2\\pi}\\sin(2\\pi\\theta),$$\nwhere θ is in cycles and 0≤K≤1 keeps the map increasing. Its rotation number is the long-run mean advance per forcing period. A p:q periodic candidate solves\n$$F^q(\\theta)-\\theta-p=0.$$\nA multiplier below one makes that periodic orbit locally attracting. Parameter regions with rational locking form **Arnold tongues**, but a finite rotation estimate by itself cannot certify exact locking or irrationality.",
      "idea": "Between stimuli, phase advances by the unforced frequency ratio; a sinusoidal phase-response approximation supplies the kick term. Compose the map q times and compare its lift with a p-cycle advance. The product of its derivatives is the return multiplier.\n\nFor an increasing degree-one lift, the displacement range of its n-th iterate has width at most one. Subadditivity and superadditivity of its extrema give a common mean advance ρ; a single finite displacement divided by n differs from ρ by at most 1/n in exact arithmetic. This explains the reported finite-iterate envelope while leaving floating-point error separate. With K=0 the map is a rigid rotation and has no attracting phase lock, even when its rotation is rational.",
      "caption": "Select 1:1, 1:2 or 2:3 and inspect a finite-grid search for attracting periodic candidates. At the selected parameters, compare the return equation, multiplier and a finite rotation estimate rather than assigning a locking label from a rounded average.",
      "scope": "An orientation-preserving circle-map family with numerical periodic-root searches. Bright cells mean a stable candidate was found at the stated resolution; dark cells do not prove absence of every periodic solution. Marginal or extremely narrow tongues can be unresolved. The finite run does not prove quasiperiodicity, and these dimensionless parameters are not a calibrated biological forcing experiment.",
      "refs": [
        "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §9.2.2 pp.188–190, forced phase maps, rotation number and periodic stability",
        "Direct monotone-lift displacement bound and derivative product"
      ],
      "links": {
        "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
      },
      "tags": [
        "dynamics",
        "oscillation"
      ],
      "viz": V.entrainment
    }
  ]
};
