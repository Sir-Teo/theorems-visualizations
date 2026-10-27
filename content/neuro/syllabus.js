// Syllabus — Computational Neuroscience (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   - Gerstner, Kistler, Naud & Paninski, Neuronal Dynamics — full section-level TOC of the open online book
//     https://neuronaldynamics.epfl.ch/online/index.html  ('Gerstner §x.y' refs checked against it)
//   - Dayan & Abbott, Theoretical Neuroscience — chapter list https://www.gatsby.ucl.ac.uk/~dayan/book/toc.html
//   - MIT 9.40 Introduction to Neural Computation (RC circuit and Nernst, integrate-and-fire, Hodgkin–Huxley,
//     dendrites, synapses, spike trains, receptive fields, spectral analysis, rate models and perceptrons,
//     PCA, recurrent networks, neural integrators, Hopfield networks)
//     https://ocw.mit.edu/courses/9-40-introduction-to-neural-computation-spring-2018/pages/lecture-notes/
// Gaps filled after comparison: renewal statistics and hazard, spike-train spectra, time-rescaling theorem,
//   escape noise and stochastic resonance, population (Fokker–Planck) equations, quadratic IF / theta neuron,
//   active dendrites, sparse coding (Dayan–Abbott ch. 10).
// Cross-links instead of duplicates: Rescorla–Wagner, blocking, TD learning and the drift-diffusion model are
//   items of `psych`; Nernst/GHK live in `physio`; the neural-level items here depend on them.
// Deliberate omissions: generalized linear model fitting details (Gerstner ch. 10 beyond time rescaling),
//   quasi-renewal integral equations (Gerstner ch. 14), cortical field models beyond the ring model.
// Landmark papers (kind 'Paper', appended Oct 2026): every citation checked against its Crossref DOI record,
//   PubMed/PMC, the BHL OpenURL resolver or archive.org catalogue metadata (books and pre-DOI papers get a `url`).
export default {
  collection: 'neuro',
  chapters: [
    {
      n: 1,
      title: 'The neuron as an electrical circuit',
      summary: String.raw`A patch of neuronal membrane is a capacitor in parallel with conductances, each in series with a battery set by an ion’s reversal potential. Passive membranes integrate input with a time constant; the conductance-based membrane equation adds the driving forces of individual ions. The voltage clamp made conductances measurable, and individual channels turn out to be stochastic two-state gates whose averages give the smooth gating variables of the next chapter.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'The membrane as an RC circuit', deps: ['physio-1.9', 'em-6.12'], refs: ['Dayan–Abbott ch. 5', 'Gerstner §1.3'],
          pic: 'Inject a current step into a model cell drawn as a capacitor and resistor in parallel; the voltage charges exponentially and the readout fits the membrane capacitance of about 1 µF/cm².' },
        { num: '1.2', kind: 'Model', name: 'Passive membrane and the membrane time constant', deps: ['neuro-1.1', 'ode-1.5'], refs: ['Gerstner §1.3'],
          pic: 'Deliver brief current pulses at varying intervals; responses summate when pulses arrive within one time constant τ = RC and decay independently otherwise.' },
        { num: '1.3', kind: 'Concept', name: 'Reversal potential and driving force', deps: ['physio-1.8', 'pma-5.15'], refs: ['Gerstner §2.1'],
          pic: 'Hold the membrane at different voltages and open a single channel type; the current reverses sign exactly at the ion’s Nernst potential, and its size grows with the distance from it.' },
        { num: '1.4', kind: 'Model', name: 'Conductance-based membrane equation', deps: ['neuro-1.2', 'neuro-1.3'], refs: ['Dayan–Abbott ch. 5'],
          pic: 'Several conductances with their batteries pull the voltage toward a conductance-weighted average of reversal potentials; drag each conductance and watch the steady voltage move.' },
        { num: '1.5', kind: 'Method', name: 'Voltage clamp', deps: ['neuro-1.4', 'ctrl-1.8'], refs: ['Dayan–Abbott ch. 5'],
          pic: 'A feedback amplifier holds the voltage at a command step while recording the current it must inject; the recorded current splits into an inward sodium phase and an outward potassium phase.' },
        { num: '1.6', kind: 'Concept', name: 'Ion channels as stochastic gates', deps: ['neuro-1.4', 'prob-2.2.1'], refs: ['Gerstner §2.2'],
          pic: 'Single-channel patch-clamp traces flicker between closed and open; averaging many traces recovers the smooth macroscopic current, with noise shrinking as 1/√N.' },
        { num: '1.7', kind: 'Model', name: 'Gating variables from two-state channel kinetics', deps: ['neuro-1.6', 'pchem-7.4', 'ode-1.4'], refs: ['Dayan–Abbott ch. 5'],
          pic: 'A gate opens and closes with voltage-dependent rates α(V) and β(V); after a voltage step the open fraction relaxes exponentially to α/(α + β) with time constant 1/(α + β).' },
      ],
    },
    {
      n: 2,
      title: 'The Hodgkin–Huxley model',
      summary: String.raw`From voltage-clamp records of the squid giant axon, Hodgkin and Huxley built four equations — voltage plus three gating variables — that reproduce the action potential quantitatively. The model explains threshold, all-or-none spikes, refractoriness, rebound and repetitive firing, and its descendants with additional currents explain the variety of real neurons. With stochastic channels, the same model shows how few channels make spike timing noisy.`,
      items: [
        { num: '2.1', kind: 'Model', name: 'Potassium conductance and the n⁴ gate', deps: ['neuro-1.7', 'neuro-1.5', 'prob-2.1.11'], refs: ['Gerstner §2.2', 'Dayan–Abbott ch. 5'],
          pic: 'Fit voltage-clamp potassium conductance traces with n⁴: the fourth power gives the sigmoidal delay at onset that a single exponential cannot.' },
        { num: '2.2', kind: 'Model', name: 'Sodium conductance: activation m³ and inactivation h', deps: ['neuro-1.7', 'neuro-1.5', 'prob-2.1.11'], refs: ['Gerstner §2.2', 'Dayan–Abbott ch. 5'],
          pic: 'The transient sodium conductance is the product of fast-rising m³ and slowly falling h; drag the step voltage and see peak and decay timing change.' },
        { num: '2.3', kind: 'Model', name: 'Hodgkin–Huxley equations', deps: ['neuro-2.1', 'neuro-2.2', 'neuro-1.4'], refs: ['Gerstner §2.2', 'Dayan–Abbott ch. 5'],
          pic: 'Integrate the four HH equations with RK4; voltage, m, h and n are plotted together through a spike, with ionic currents shaded beneath.' },
        { num: '2.4', kind: 'Phenomenon', name: 'Threshold and all-or-none spikes', deps: ['neuro-2.3', 'ode-2.8'], refs: ['Gerstner §4.1'],
          pic: 'Deliver current pulses of slowly increasing amplitude; responses jump from small depolarizations to full spikes over a narrow range, with peak voltage plotted against pulse size.' },
        { num: '2.5', kind: 'Phenomenon', name: 'Absolute and relative refractory periods', deps: ['neuro-2.3'], refs: ['Gerstner §2.3'],
          pic: 'Give a second pulse at varying delays after a spike; the threshold for the second spike is infinite at first, then decays back to baseline as h recovers and n falls.' },
        { num: '2.6', kind: 'Phenomenon', name: 'Post-inhibitory rebound (anode break excitation)', deps: ['neuro-2.3'], refs: ['Gerstner §2.3'],
          pic: 'Hyperpolarize the model for a while and release it; de-inactivated sodium channels fire a rebound spike with no excitatory input at all.' },
        { num: '2.7', kind: 'Phenomenon', name: 'Repetitive firing and the Hodgkin–Huxley f–I curve', deps: ['neuro-2.3'], refs: ['Gerstner §4.4'],
          pic: 'Step the input current and record firing rate; the HH curve jumps from zero to about 50 Hz at onset, a type II response, with bistability near threshold.' },
        { num: '2.8', kind: 'Model', name: 'Connor–Stevens A-current and type I firing', deps: ['neuro-2.3', 'neuro-2.7'], refs: ['Gerstner §2.3', 'Dayan–Abbott ch. 6'],
          pic: 'Add a transient potassium A-current; the f–I curve now starts continuously from zero frequency, and long latencies to the first spike appear near threshold.' },
        { num: '2.9', kind: 'Phenomenon', name: 'Channel noise and spontaneous spikes', deps: ['neuro-2.3', 'neuro-1.6'], refs: ['Gerstner §2.2'],
          pic: 'Replace the deterministic gates with a finite number of Markov channels; with small patches, subthreshold input produces random spikes and spike timing jitters, side by side with the deterministic model.' },
        { num: '2.10', kind: 'Paper', name: 'A Quantitative Description of Membrane Current',
          paper: { authors: 'A. L. Hodgkin and A. F. Huxley', year: 1952, title: 'A quantitative description of membrane current and its application to conduction and excitation in nerve',
                   venue: 'Journal of Physiology 117 (4): 500–544', doi: '10.1113/jphysiol.1952.sp004764' },
          introduces: ['neuro-1.4', 'neuro-2.1', 'neuro-2.2', 'neuro-2.3'], deps: ['neuro-1.5', 'neuro-1.3', 'neuro-4.1'], refs: [],
          pic: 'Recreate the paper’s computed action potential: integrate the four Hodgkin–Huxley equations with their own rate functions and conductances (ḡNa = 120, ḡK = 36, ḡL = 0.3 mS/cm²) at 6.3 °C, watch m, h and n open and close beneath the spike, vary the stimulus to find threshold, and propagate the impulse along the axon to compare the computed velocity of 18.8 m/s with the measured 21.2 m/s.' },
      ],
    },
    {
      n: 3,
      title: 'Reductions and the phase plane',
      summary: String.raw`Because sodium activation is fast and h and n move together, the four-dimensional Hodgkin–Huxley model collapses to two variables whose phase plane explains excitability geometrically. Neurons begin firing either through a Hopf bifurcation (type II, nonzero onset frequency) or a saddle-node on an invariant circle (type I, arbitrarily slow firing). Canonical models — FitzHugh–Nagumo, Morris–Lecar, the quadratic integrate-and-fire and theta neurons, Izhikevich’s model — capture these regimes and bursting.`,
      items: [
        { num: '3.1', kind: 'Method', name: 'Reducing Hodgkin–Huxley to two dimensions', deps: ['neuro-2.3', 'ladr-6.61'], refs: ['Gerstner §4.2'],
          pic: 'Plot h against n during spiking and see them lie near a line; replacing m by its steady state and h by a function of n gives a 2D model whose spikes overlay the full model’s.' },
        { num: '3.2', kind: 'Model', name: 'FitzHugh–Nagumo model', deps: ['neuro-3.1', 'mathbio-6.7', 'ode-7.8', 'pma-5.11'], refs: ['Gerstner §4.3'],
          pic: 'The cubic voltage nullcline and linear recovery nullcline are drawn; inject current and the trajectory either returns quickly to rest or loops around the phase plane as a spike.' },
        { num: '3.3', kind: 'Phenomenon', name: 'Threshold as a separatrix in the phase plane', deps: ['neuro-3.2', 'ode-2.6'], refs: ['Gerstner §4.5'],
          pic: 'Launch trajectories from a line of initial voltages; those starting just either side of the middle branch’s stable manifold diverge into rest or a full spike, revealing a soft “quasi-threshold”.' },
        { num: '3.4', kind: 'Theorem', name: 'Type II onset via Hopf bifurcation', deps: ['neuro-3.2', 'mathbio-3.12', 'ode-1.8'], refs: ['Gerstner §4.4'],
          pic: 'Raise the injected current: the resting point’s eigenvalues cross the imaginary axis and oscillations appear at a nonzero frequency, read off the f–I curve.' },
        { num: '3.5', kind: 'Theorem', name: 'Type I onset at a saddle-node on the invariant circle', deps: ['neuro-3.2', 'ode-8.3', 'ode-1.3'], refs: ['Gerstner §4.4'],
          pic: 'In a model with a saddle and a node on a closed loop, raise current until they merge; firing starts at zero frequency and grows like √(I − I_c), checked by a log–log fit.' },
        { num: '3.6', kind: 'Model', name: 'Morris–Lecar model', deps: ['neuro-3.1', 'ode-3.9'], refs: ['Gerstner §4.4'],
          pic: 'A calcium–potassium model of barnacle muscle: change one parameter and the bifurcation at onset switches from Hopf to saddle-node, so the same model shows type I and type II behaviour.' },
        { num: '3.7', kind: 'Model', name: 'Quadratic integrate-and-fire and the theta neuron', deps: ['neuro-3.5', 'pma-5.5'], refs: ['Gerstner §5.3'],
          pic: 'The normal form dV/dt = V² + I blows up in finite time; map V to an angle θ on a circle and the spike becomes a rotation, with period π/√I computed and simulated.' },
        { num: '3.8', kind: 'Phenomenon', name: 'Bursting by fast–slow dissection', deps: ['neuro-3.6'], refs: ['Dayan–Abbott ch. 6'],
          pic: 'Add a slow calcium-activated potassium current; plotting the fast subsystem’s bifurcation diagram against the slow variable shows the trajectory alternating between spiking and quiescence.' },
        { num: '3.9', kind: 'Model', name: 'Izhikevich simple model', deps: ['neuro-3.7'], refs: ['Gerstner §6.2'],
          pic: 'Two equations and four parameters reproduce regular spiking, fast spiking, chattering and bursting; choose a preset and the voltage trace matches the named cortical cell type.' },
      ],
    },
    {
      n: 4,
      title: 'Dendrites, axons and cable theory',
      summary: String.raw`Neurons are extended cables, so voltage spreads and decays along dendrites and axons. The cable equation, its length constant and Green’s function describe how synaptic inputs attenuate and broaden with distance, Rall’s rule collapses branched trees into equivalent cylinders, and compartmental models handle realistic morphology. Along axons the same physics sets conduction velocity, which myelin raises dramatically; active dendrites add local spikes.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Cable equation', deps: ['neuro-1.2', 'pde-1.4', 'pma-5.15'], refs: ['Gerstner §3.2', 'Dayan–Abbott ch. 6'],
          pic: 'A dendrite is drawn as a chain of RC compartments with axial resistors; refine the chain and the voltage profile converges to the solution of the cable equation.' },
        { num: '4.2', kind: 'Definition', name: 'Length constant λ', deps: ['neuro-4.1'], refs: ['Gerstner §3.2'],
          pic: 'Change membrane and axial resistance and the distance over which voltage falls by a factor e is marked on the cable; thicker dendrites have longer length constants.' },
        { num: '4.3', kind: 'Theorem', name: 'Steady-state exponential attenuation along a cable', deps: ['neuro-4.2', 'ode-3.13'], refs: ['Gerstner §3.2'],
          pic: 'Inject steady current at one point of an infinite cable; the voltage decays as e^{−|x|/λ} on both sides, with a sealed end making the decay shallower.' },
        { num: '4.4', kind: 'Theorem', name: 'Green’s function of the passive cable', deps: ['neuro-4.1', 'mathbio-8.3', 'pde-3.3', 'pde-3.9', 'pma-5.11'], refs: ['Gerstner §3.2'],
          pic: 'A brief current pulse spreads as a Gaussian that also decays exponentially in time; the voltage at several distances peaks later and lower, exactly as the Green’s function predicts.' },
        { num: '4.5', kind: 'Theorem', name: 'Rall’s 3/2 power rule and the equivalent cylinder', deps: ['neuro-4.3'], refs: ['Dayan–Abbott ch. 6'],
          pic: 'Build a branching tree; when parent and daughter diameters satisfy d^{3/2} = Σd_i^{3/2} the tree behaves like a single cylinder, which the simulation confirms by comparing voltages.' },
        { num: '4.6', kind: 'Model', name: 'Compartmental models', deps: ['neuro-4.1', 'nla-4.10'], refs: ['Gerstner §3.4'],
          pic: 'Load a reconstructed neuron morphology, discretize it into compartments and inject current at a dendrite; the voltage spreads through the tree in a colour-coded animation.' },
        { num: '4.7', kind: 'Phenomenon', name: 'Conduction velocity grows as √diameter in unmyelinated axons', deps: ['neuro-4.2', 'neuro-2.3', 'pma-9.15'], refs: ['Gerstner §3.3'],
          pic: 'Run Hodgkin–Huxley channels in a cable of variable diameter; the measured spike speed scales as √d, which is why the squid evolved a giant axon.' },
        { num: '4.8', kind: 'Phenomenon', name: 'Myelination and saltatory conduction', deps: ['neuro-4.7'], refs: ['Gerstner §3.3'],
          pic: 'Wrap the axon in myelin with nodes of Ranvier; the spike hops from node to node and speed now scales linearly with diameter, outpacing an unmyelinated axon of the same size.' },
        { num: '4.9', kind: 'Phenomenon', name: 'Dendritic filtering of synaptic potentials', deps: ['neuro-4.4'], refs: ['Dayan–Abbott ch. 6'],
          pic: 'Place identical synapses at increasing distances from the soma; somatic EPSPs become smaller, slower and later, with rise time plotted against distance.' },
        { num: '4.10', kind: 'Phenomenon', name: 'Active dendrites and dendritic spikes', deps: ['neuro-4.6', 'neuro-2.3'], refs: ['Gerstner §3.2'],
          pic: 'Add voltage-gated channels to a dendritic branch; clustered inputs trigger a local dendritic spike and a supralinear somatic response, while dispersed inputs sum linearly.' },
      ],
    },
    {
      n: 5,
      title: "Synapses and integrate-and-fire neurons",
      summary: "Thresholds and resets replace the detailed spike waveform with precisely defined events. Passive filtering, nonlinear initiation and adaptation determine how those events are generated. Conductance, release statistics and short-term resources then determine what an arriving event does to the next cell.",
      items: [
        {"num":"5.1","kind":"Model","name":"Leaky integrate-and-fire neuron","deps":["neuro-1.2"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §1.3.1–1.3.4, Eqs.1.5,1.12–1.17"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch1.S3.html"},"pic":"Exact exponential voltage arcs, resets and a finite spike raster expose the threshold and refractory rules."},
        {"num":"5.2","kind":"Theorem","name":"LIF firing rate under constant current","deps":["neuro-5.1"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §1.3, linear solution and threshold/reset; rate and endpoint limits derived here"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch1.S3.html"},"pic":"Exact frequency curve and successive-event estimates distinguish asymptotic rate, finite unresolved events and refractory saturation."},
        {"num":"5.3","kind":"Model","name":"Exponential integrate-and-fire neuron","deps":["neuro-5.1"],"see":["neuro-3.5"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §5.2, Eqs.5.6–5.8; reset interpretation and rheobase example"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch5.S2.html"},"pic":"Computed exponential voltage drift and a finite-cutoff event trace distinguish rheobase from the numerical cutoff; no measured I–V data are supplied."},
        {"num":"5.4","kind":"Model","name":"Adaptive exponential integrate-and-fire and spike-frequency adaptation","deps":["neuro-5.3"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §6.1 Eqs.6.3–6.4 and jump rule"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch6.S1.html"},"pic":"Voltage and adaptation-current traces show actual jumps and finite early/late interspike intervals."},
        {"num":"5.5","kind":"Model","name":"Spike response model","deps":["neuro-5.1"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §1.3.4–1.3.5 Eqs.1.15–1.22; §6.4 Eqs.6.27–6.32"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch6.S4.html","derivation":"https://neuronaldynamics.epfl.ch/online/Ch1.S3.html"},"pic":"Exact-arc LIF voltage and its full input-plus-reset-kernel reconstruction agree, with a live numerical discrepancy."},
        {"num":"5.6","kind":"Model","name":"Synaptic conductances: AMPA, NMDA and GABA","deps":["neuro-1.4"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §3.1 Eqs.3.1–3.6 and receptor examples"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch3.S1.html"},"pic":"Effective receptor conductance and the resulting voltage separate reversal, magnesium block and a chosen rise/decay pulse."},
        {"num":"5.7","kind":"Phenomenon","name":"NMDA receptors as coincidence detectors","deps":["neuro-5.6"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §3.1.2 Eq.3.6 and coincidence discussion"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch3.S1.html"},"pic":"Voltage-dependent unblock and a delayed imposed depolarization determine a finite ligand-overlap current and charge."},
        {"num":"5.8","kind":"Model","name":"Quantal transmitter release (del Castillo–Katz)","deps":["neuro-5.6","prob-2.2.1"],"see":["neuro-5.11"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §3.1 release context; finite Bernoulli-site derivation stated here"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch3.S1.html"},"pic":"Exact binomial count bars, seeded synthetic frequencies and sorted finite trials expose release-site assumptions."},
        {"num":"5.9","kind":"Model","name":"Short-term depression and facilitation (Tsodyks–Markram)","deps":["neuro-5.6"],"refs":["Tsodyks, Pawelzik & Markram (1998), Neural Networks with Dynamic Synapses, §2 pp.822–824 Eqs.2.1–2.3; Tsodyks & Markram (1997), pp.719–720 Eq.1–2 and separated-timescale assumption"],"links":{"original":"https://zpkilpat.github.io/appm4370/papers/tsodyks98.pdf","depression":"https://www.cns.nyu.edu/csh/csh04/Articles/Tsodyks-Markram-97.pdf"},"pic":"Exact event resource updates and the periodic fixed-point curve distinguish facilitation, depletion and rate response."},
        {"num":"5.10","kind":"Phenomenon","name":"Shunting inhibition","deps":["neuro-5.6","neuro-1.4"],"refs":["Gerstner et al., Neuronal Dynamics (2014), official online text §1.4.2; conductance balance and exact steady response derived here"],"links":{"book":"https://neuronaldynamics.epfl.ch/online/Ch1.S4.html"},"pic":"Maintained inhibitory conductance changes input resistance and time constant; a one-compartment model makes no spatial dendritic claim."},
        {"num":"5.11","kind":"Paper","name":"Quantal Components of the End-Plate Potential","paper":{"authors":"J. del Castillo and B. Katz","year":1954,"title":"Quantal components of the end-plate potential","venue":"Journal of Physiology 124(3):560–573","doi":"10.1113/jphysiol.1954.sp005129"},"introduces":["neuro-5.8"],"deps":["prob-1.6.13"],"refs":["del Castillo & Katz (1954), indexed primary bibliographic record; original full body unavailable in this verification session"],"links":{"record":"https://pubmed.ncbi.nlm.nih.gov/13175199/","original":"https://doi.org/10.1113/jphysiol.1954.sp005129"},"verify":true,"pic":"Synthetic Poisson versus finite-site counts compare sample-mean and failure estimators without inventing historical measurements; the original full-text source flag remains."}
      ],
    },
    {
      "n": 6,
      "title": "Spike trains and neural coding",
      "summary": "Statistical descriptions of spikes depend on the averaging operation, observation window and conditional intensity. Synthetic Poisson and stationary renewal processes expose rates, variability, hazards and spectra; Gaussian stimuli then support reverse correlation and an explicitly fitted exponential LNP model. Declared population codes distinguish directional vectors, local information bounds and discrete Bayesian decisions. Histogram equalization and two noise mechanisms show how coding claims depend on constraints, while a modern receptive-field construction keeps the unread historical paper separate.",
      "items": [
        {
          "num": "6.1",
          "kind": "Concept",
          "name": "Firing rate and the peri-stimulus time histogram",
          "deps": [],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.2.1–7.2.2",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"
          },
          "pic": "Rebin repeated synthetic spike rasters, change trial count and modulation, and compare the observed PSTH with its known expected bin-average rate. The last bin uses its actual exposure."
        },
        {
          "num": "6.2",
          "kind": "Model",
          "name": "Poisson spike trains",
          "deps": [
            "neuro-6.1",
            "stoch-9.3"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.2.1–7.2.2; §7.3",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"
          },
          "pic": "Switch constant and modulated count intensities and compare actual count frequencies with the exact Poisson law. A separate homogeneous waiting-time sample checks the Exp(1) law after multiplying intervals by rate."
        },
        {
          "num": "6.3",
          "kind": "Concept",
          "name": "Fano factor and coefficient of variation",
          "deps": [
            "neuro-6.2"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.2.1; §7.3; §7.5.1–7.5.2",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch7.S3.html"
          },
          "pic": "Compare stationary Poisson, regular and hyperexponential trains at equal mean rate. Change count-window duration and compare the observed count Fano factor with a separately sampled interval CV and its theoretical long-window limit."
        },
        {
          "num": "6.4",
          "kind": "Concept",
          "name": "Renewal processes, survivor function and hazard",
          "deps": [
            "neuro-6.3",
            "stoch-11.1"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.5.1, Eqs.7.24–7.31",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch7.S5.html"
          },
          "pic": "Change dead time, number of exponential phases and phase rate. Probe the survivor, density and conditional hazard at a chosen age, and distinguish the two quantities measured per second."
        },
        {
          "num": "6.5",
          "kind": "Concept",
          "name": "Spike-train autocorrelation and power spectrum",
          "deps": [
            "neuro-6.2"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.4; §7.5.2, Eqs.7.37–7.48",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch7.S5.html"
          },
          "pic": "Compare regular, Poisson, broad-interval and oscillatory synthetic trains. Read positive-lag pair density beside eight averaged finite periodograms, with the appropriate renewal or finite-window Poisson expectation."
        },
        {
          "num": "6.6",
          "kind": "Concept",
          "name": "Tuning curves",
          "deps": [
            "neuro-6.1"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §12.1.1; §7.2",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch12.S1.html"
          },
          "pic": "Rotate the preferred and probe orientations, adjust baseline, amplitude and sharpness, and compare the known tuning curve with actual sample means, one-standard-deviation bars and independent probe rasters."
        },
        {
          "num": "6.7",
          "kind": "Method",
          "name": "Spike-triggered average and reverse correlation",
          "deps": [
            "neuro-6.2"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §11.2.1, Eq.11.6 and reverse-correlation discussion",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch11.S2.html"
          },
          "pic": "Compare white and correlated Gaussian stimuli. Observe the raw sample STA, the exact population covariance prediction, the true filter and a regularized sample covariance correction as sample size changes."
        },
        {
          "num": "6.8",
          "kind": "Model",
          "name": "Linear–nonlinear–Poisson model",
          "deps": [
            "neuro-6.7"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §10.1.2; §10.2.1–10.2.2; §10.3 introduction; §11.2.1",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch10.S2.html"
          },
          "pic": "Fit the eight-lag filter and intercept from actual synthetic Poisson counts. Change stimulus correlation, data exposure and regularization, and compare the fitted filter and independent held-out predictions with known truth."
        },
        {
          "num": "6.9",
          "kind": "Model",
          "name": "Receptive fields: Gabor and difference-of-Gaussians",
          "deps": [
            "neuro-6.6",
            "rca-8.13"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §11.2.1; written RCA8.13 and PSYCH4.6",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch11.S2.html"
          },
          "pic": "Choose Gabor or center–surround weights, change a synthetic grating’s orientation, phase and spatial frequency, and inspect the actual cross-correlation map and numerical response coefficients."
        },
        {
          "num": "6.10",
          "kind": "Method",
          "name": "Population-vector decoding",
          "deps": [
            "neuro-6.6"
          ],
          "refs": [
            "Direct cosine expansion and sums of roots of unity; Poisson count model derived in NEURO6.2"
          ],
          "links": {
            "statistics": "https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"
          },
          "pic": "Change population size, stimulus direction, tuning depth and observation duration. Compare each cell’s actual count with its mean, then compare the realized vector, expected vector and true direction."
        },
        {
          "num": "6.11",
          "kind": "Theorem",
          "name": "Fisher information and the Cramér–Rao bound for population codes",
          "deps": [
            "neuro-6.6",
            "stat-4.4"
          ],
          "refs": [
            "Actual written STAT4.4, including biased/local mean-derivative bound and score regularity",
            "Direct score and information calculation for the declared independent Poisson population"
          ],
          "links": {
            "countModel": "https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"
          },
          "pic": "Move a calibration point through a real-valued Gaussian tuning population and compare its information with actual repeated score-estimator errors. Vary width, population and exposure, including a single cell at its tuning peak."
        },
        {
          "num": "6.12",
          "kind": "Method",
          "name": "Maximum a posteriori decoding",
          "deps": [
            "neuro-6.10"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §11.3.1; §10.2.1",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch11.S3.html"
          },
          "pic": "Decode an actual synthetic population count sample over eight directions. Adjust uneven coverage, tuning, prior and exposure, and inspect all posterior modes beside the naive vector angle."
        },
        {
          "num": "6.13",
          "kind": "Concept",
          "name": "Efficient coding and histogram equalization (Laughlin)",
          "deps": [
            "neuro-6.6",
            "info-2.5"
          ],
          "refs": [
            "Simoncelli & Olshausen (2001), Natural Image Statistics and Neural Representation, Annual Review of Neuroscience24:1193–1216, selected pp.1195–1196 and1200",
            "Actual written INFO2.5, information nonnegativity; direct probability-integral-transform and entropy argument"
          ],
          "links": {
            "review": "https://www.cns.nyu.edu/pub/lcv/simoncelli01-reprint.pdf",
            "doi": "https://doi.org/10.1146/annurev.neuro.24.1.1193"
          },
          "pic": "Change the synthetic Beta stimulus distribution and sample size. Follow its density through the monotone CDF response and compare the actual transformed histogram with the uniform reference."
        },
        {
          "num": "6.14",
          "kind": "Theorem",
          "name": "Time-rescaling theorem for spike trains",
          "deps": [
            "neuro-6.4"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §10.3.3, Eqs.10.42–10.45; §7.5.1",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch10.S3.html"
          },
          "pic": "Compare the correct renewal hazard with a wrong constant mean rate on the same complete intervals. Inspect the uniform CDF diagnostic, nominal KS band and consecutive-interval scatter separately."
        },
        {
          "num": "6.15",
          "kind": "Model",
          "name": "Escape noise and the noisy integrate-and-fire neuron",
          "deps": [
            "neuro-5.1",
            "neuro-6.4"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §9.1.1–9.1.2; §9.4.1",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch9.S1.html"
          },
          "pic": "Switch escape and diffusive voltage noise, alter drive and noise parameters, and compare the actual voltage trace, raster, finite-run rate and completed-interval variability."
        },
        {
          "num": "6.16",
          "kind": "Phenomenon",
          "name": "Stochastic resonance",
          "deps": [
            "neuro-6.15"
          ],
          "refs": [
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §9.4.2; direct binary-threshold information calculation",
            "Direct derivation for the declared synthetic model"
          ],
          "links": {
            "book": "https://neuronaldynamics.epfl.ch/online/Ch9.S4.html"
          },
          "pic": "Change subthreshold amplitude and noise. Compare the analytic information curve with actual detector events for a periodic binary signal, including zero signal and zero-noise endpoints."
        },
        {
          "num": "6.17",
          "kind": "Paper",
          "name": "Receptive Fields and Functional Architecture in Cat Cortex",
          "deps": [
            "neuro-6.6",
            "psych-4.6"
          ],
          "paper": {
            "authors": "D. H. Hubel and T. N. Wiesel",
            "year": 1962,
            "title": "Receptive fields, binocular interaction and functional architecture in the cat’s visual cortex",
            "venue": "Journal of Physiology 160 (1): 106–154",
            "doi": "10.1113/jphysiol.1962.sp006837"
          },
          "introduces": [],
          "refs": [
            "Hubel & Wiesel (1962), archive index and bibliographic record only; full body blocked by explicit access challenge",
            "Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition selected §12.1.1 receptive-field and column discussion, and §11.2.1 LNP discussion; original reprinted figures not used",
            "Direct normalized Gaussian Fourier and even–odd quadrature calculation"
          ],
          "links": {
            "record": "https://pmc.ncbi.nlm.nih.gov/articles/PMC1359523/",
            "doi": "https://doi.org/10.1113/jphysiol.1962.sp006837",
            "modern": "https://neuronaldynamics.epfl.ch/online/Ch12.S1.html"
          },
          "verify": true,
          "pic": "Rotate and phase-shift a synthetic grating. Compare a declared even receptive field, simple and quadrature-energy phase responses, and independent synthetic spike rasters, with the original-source limitation visible."
        }
      ]
    },
    {
      n: 7,
      title: 'Networks and population dynamics',
      summary: String.raw`Large networks are described by population firing rates or by densities of membrane potentials. Excitatory–inhibitory interactions produce oscillations, balanced irregular firing and attractors: rings for orientation and head direction, lines for neural integrators, competing pools for decisions. Pattern generators make rhythms without rhythmic input, and phase response theory explains when coupled neurons synchronize.`,
      items: [
        { num: '7.1', kind: 'Model', name: 'Firing-rate models', deps: ['neuro-6.1'], refs: ['Dayan–Abbott ch. 7', 'Gerstner §15.3'],
          pic: 'A population’s rate relaxes toward a nonlinear function of its input with a time constant; compare the rate model’s response to a step with a spiking network’s population activity.' },
        { num: '7.2', kind: 'Model', name: 'Wilson–Cowan excitatory–inhibitory network', deps: ['neuro-7.1', 'mathbio-3.12'], refs: ['Dayan–Abbott ch. 7'],
          pic: 'Excitatory and inhibitory populations are drawn in the phase plane; strengthen recurrent excitation and a stable fixed point gives way, through a Hopf bifurcation, to gamma-like oscillations.' },
        { num: '7.3', kind: 'Phenomenon', name: 'Balanced excitation and inhibition and irregular firing', deps: ['neuro-7.2', 'neuro-6.3'], refs: ['Gerstner §8.2', 'Gerstner §12.3'],
          pic: 'Scale up a randomly connected spiking network while keeping excitation and inhibition balanced; neurons fire irregularly with CV near 1 although the network is deterministic.' },
        { num: '7.4', kind: 'Model', name: 'Population density and the Fokker–Planck approach', deps: ['neuro-6.15'], refs: ['Gerstner §13.3'],
          pic: 'Evolve the density of membrane potentials for a population of noisy integrate-and-fire neurons; the flux across threshold gives the population rate, matched against a direct simulation.' },
        { num: '7.5', kind: 'Model', name: 'Ring attractor model of orientation tuning', deps: ['neuro-7.1', 'mathbio-10.4'], refs: ['Dayan–Abbott ch. 7'],
          pic: 'Neurons on a ring excite neighbours and inhibit distant cells; a weakly tuned input produces a sharp activity bump whose width is set by the connectivity, not the input.' },
        { num: '7.6', kind: 'Concept', name: 'Line attractors and the neural integrator', deps: ['neuro-7.1'], refs: ['Dayan–Abbott ch. 7'],
          pic: 'Tune recurrent feedback to exactly cancel leak and the network holds any value after a pulse, like the oculomotor integrator; mistune it and the stored value drifts away.' },
        { num: '7.7', kind: 'Model', name: 'Winner-take-all decision making', deps: ['neuro-7.2'], refs: ['Gerstner §16.3'],
          pic: 'Two excitatory pools compete through shared inhibition while receiving noisy evidence; one pool’s activity climbs and the other is suppressed, and the choice accuracy curve rises with motion coherence.' },
        { num: '7.8', kind: 'Phenomenon', name: 'Integration to bound in parietal neurons', deps: ['neuro-7.7', 'psych-8.5'], refs: ['Gerstner §16.4'],
          pic: 'Simulated LIP firing rates ramp at a slope set by evidence strength and converge at a common level just before the choice, the neural signature of a drift-diffusion process.' },
        { num: '7.9', kind: 'Model', name: 'Half-centre oscillators and central pattern generators', deps: ['neuro-7.1', 'neuro-2.6'], refs: ['Dayan–Abbott ch. 7'],
          pic: 'Two mutually inhibiting neurons with adaptation or rebound alternate bursts, producing a rhythm with no rhythmic input; tonic drive changes its frequency as in locomotion.' },
        { num: '7.10', kind: 'Phenomenon', name: 'Synchronization of coupled neurons via phase response curves', deps: ['mathbio-6.12', 'mathbio-6.9'], refs: ['Gerstner §13.4'],
          pic: 'Measure the phase response curves of type I and type II model neurons; coupling them with excitatory synapses synchronizes the type II pair but drives the type I pair to anti-phase.' },
      ],
    },
    {
      n: 8,
      title: 'Plasticity, learning and memory',
      summary: String.raw`Synapses change with activity, and the rules they follow determine what networks learn. Hebb’s postulate is unstable on its own; normalization (Oja), sliding thresholds (BCM) and spike-timing dependence fix it and extract structure such as principal components and receptive-field maps. Hopfield networks store memories as energy minima with a definite capacity, error-driven rules underlie supervised and reinforcement learning, and sparse coding explains V1 receptive fields.`,
      items: [
        { num: '8.1', kind: 'Principle', name: 'Hebb’s rule', deps: ['neuro-7.1'], refs: ['Dayan–Abbott ch. 8'],
          pic: 'Present correlated input patterns to a rate neuron and strengthen weights in proportion to pre- times postsynaptic activity; the weight vector grows toward the correlated inputs.' },
        { num: '8.2', kind: 'Theorem', name: 'Plain Hebbian learning is unstable', deps: ['neuro-8.1'], refs: ['Dayan–Abbott ch. 8'],
          pic: 'Track the norm of the weight vector under pure Hebbian learning; it grows exponentially at a rate set by the largest eigenvalue of the input correlation matrix.' },
        { num: '8.3', kind: 'Theorem', name: 'Oja’s rule extracts the principal component', deps: ['neuro-8.2', 'ladr-7.29'], refs: ['Dayan–Abbott ch. 8'],
          pic: 'A scatter of 2D inputs with its covariance ellipse; under Oja’s rule the weight vector rotates onto the ellipse’s major axis and its length converges to 1.' },
        { num: '8.4', kind: 'Model', name: 'BCM rule and the sliding threshold', deps: ['neuro-8.1'], refs: ['Dayan–Abbott ch. 8'],
          pic: 'Postsynaptic activity above a threshold potentiates and below it depresses; the threshold tracks average activity, so the neuron becomes selective for one of several input patterns.' },
        { num: '8.5', kind: 'Phenomenon', name: 'Spike-timing-dependent plasticity', deps: ['neuro-8.1', 'neuro-5.7'], refs: ['Dayan–Abbott ch. 8'],
          pic: 'Pair pre- and postsynaptic spikes at varying delays; potentiation for pre-before-post and depression for post-before-pre trace the asymmetric STDP window, which then sharpens causal inputs.' },
        { num: '8.6', kind: 'Model', name: 'Ocular dominance by competitive Hebbian learning', deps: ['neuro-8.3', 'mathbio-10.4'], refs: ['Dayan–Abbott ch. 8'],
          pic: 'A sheet of cortical neurons receives inputs from two eyes; Hebbian learning with lateral interactions and normalization produces alternating ocular-dominance stripes.' },
        { num: '8.7', kind: 'Model', name: 'Hopfield network', deps: ['neuro-8.1'], refs: ['Gerstner §17.2'],
          pic: 'Store several binary images in a Hopfield network with Hebbian weights; present a corrupted image and watch the asynchronous updates restore the stored pattern.' },
        { num: '8.8', kind: 'Theorem', name: 'Hopfield energy decreases under asynchronous updates', deps: ['neuro-8.7'], refs: ['Gerstner §17.2'],
          pic: 'Plot the energy E = −½Σ w_ij s_i s_j at each single-unit update; it never increases with symmetric weights, while asymmetric weights allow cycles that the plot exposes.' },
        { num: '8.9', kind: 'Theorem', name: 'Hopfield capacity ≈ 0.138 N', deps: ['neuro-8.8'], refs: ['Gerstner §17.2'],
          pic: 'Store increasing numbers of random patterns and measure recall quality; it collapses sharply as the load passes about 0.14 patterns per neuron.' },
        { num: '8.10', kind: 'Model', name: 'Perceptron and the delta rule', deps: ['neuro-8.1'], refs: ['Dayan–Abbott ch. 8'],
          pic: 'A single neuron learns to separate two clouds of points by error-correcting weight updates; the decision line converges for separable data and keeps oscillating otherwise.' },
        { num: '8.11', kind: 'Phenomenon', name: 'Dopamine neurons signal reward-prediction errors', deps: ['psych-10.14', 'neuro-8.1'], refs: ['Dayan–Abbott ch. 9'],
          pic: 'Simulated dopamine responses during conditioning move from the reward to the cue as learning proceeds, and dip below baseline when an expected reward is omitted, as Schultz recorded.' },
        { num: '8.12', kind: 'Model', name: 'Actor–critic learning in the basal ganglia', deps: ['neuro-8.11'], refs: ['Dayan–Abbott ch. 9'],
          pic: 'A critic learns state values from the dopamine-like error while an actor adjusts action preferences; in a maze task both converge and the agent’s path shortens.' },
        { num: '8.13', kind: 'Model', name: 'Sparse coding of natural images (Olshausen–Field)', deps: ['neuro-8.3', 'neuro-6.13'], refs: ['Dayan–Abbott ch. 10'],
          pic: 'Learn a dictionary that reconstructs natural image patches with few active units; the learned basis functions come out localized, oriented and bandpass like V1 receptive fields.' },
        { num: '8.14', kind: 'Paper', name: 'A Neural Substrate of Prediction and Reward',
          paper: { authors: 'Wolfram Schultz, Peter Dayan and P. Read Montague', year: 1997, title: 'A Neural Substrate of Prediction and Reward',
                   venue: 'Science 275 (5306): 1593–1599', doi: '10.1126/science.275.5306.1593' },
          introduces: ['neuro-8.11', 'psych-10.14'], deps: ['psych-10.5', 'neuro-8.1'], refs: [],
          pic: 'Recreate the paper’s dopamine rasters: a monkey’s dopamine neuron bursts at unexpected juice, shifts its burst to the predictive light after training, and pauses exactly when an expected reward is omitted — train a temporal-difference learner trial by trial and watch its prediction error δ reproduce all three rasters.' },
      ],
    },
  ],
};
