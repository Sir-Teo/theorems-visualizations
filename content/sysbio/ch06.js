// Source-scoped theorems and own kinetic networks; no empirical calibration.
import * as V from './ch06.viz.js';
const proofreading='https://arxiv.org/abs/1312.2286',conformation='https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0000468',acrSource='https://people.math.wisc.edu/~dfanderson/papers/StochACR_Main.pdf',crnt='https://www.jeremy-gunawardena.com/papers/crnt.pdf';
export default {collection:'sysbio',chapter:6,title:'Proofreading and robust signalling',
 summary:String.raw`Molecular discrimination depends on reaction rates and free-energy driving, not only binding preferences. A finite-affinity checkpoint network and an equilibrium deformation model separate two forms of proofreading. Reaction-network structure then constrains positive steady states, while explicit examples distinguish concentration robustness from stability and inventory feasibility. A bifunctional sensor, linear kinase filters and receptor transduction expose different meanings of robust output, amplification and half-maximal response.`,items:[
 {num:'6.1',kind:'Model',name:'Kinetic proofreading (Hopfield–Ninio)',deps:['pchem-7.4'],
 statement:String.raw`Correct R and wrong W substrates compete for one enzyme. In the authored checkpoint model, E binds either substrate into states $S_j$, for $j=0,\ldots,n$. The association rates are
$$\lambda_j=\lambda_0\varepsilon^j,$$
with $\lambda_0=1\;\mathrm{s}^{-1}$ and $\varepsilon=10^{-5}$. Dissociation rates are $d_R=1\;\mathrm{s}^{-1}$ and $d_W=\sigma\;\mathrm{s}^{-1}$, $\sigma\ge1$. Consecutive bound states interconvert with forward rate m and reverse rate
$$r={m\over\varepsilon}e^{-\mu}.$$
Here $\mu$ is fuel chemical affinity in units of $k_BT$. In the nonperturbing rare-product limit, equal catalytic coefficients make the wrong/right output ratio
$$\eta={[W_n]\over[R_n]}.$$
At zero affinity, $\eta=1/\sigma$ regardless of how many extra states are inserted. Fuel-driven kinetics can improve discrimination.`,
 idea:String.raw`Give bound state j the free energy $j\log(1/\varepsilon)$ in thermal units, plus $\log\sigma$ for W. Each binding pair then has the correct equilibrium rate ratio. The activation ratio is $m/r=\varepsilon e^\mu$, so a cycle through one activation step has affinity μ. Setting μ to zero restores detailed balance rather than leaving an unexplained irreversible step.

The steady master equation is a finite linear system. Conservation fixes the common free-enzyme pool, and positive tridiagonal solves determine each checkpoint concentration. The model includes rare rebinding directly into later states, so making progress arbitrarily slow eventually loses the extra discrimination. The planned thermodynamics dependency is supplemented by this explicit local rate-ratio construction.`,
 caption:String.raw`Add checkpoints, turn the fuel drive off and vary forward progression. Compare actual R/W checkpoint concentrations on linear or logarithmic axes, and inspect the selected checkpoint’s mass and the resulting reporter error.`,
 scope:String.raw`Own finite network motivated by the selected Murugan–Huse–Leibler 2014 exposition, not a reconstruction of the unread Hopfield 1974, Ninio 1975 or Murugan 2012 experiments or figures. Total enzyme is 1 µM; substrate reservoirs maintain the pseudo-first-order association rates. Reporter and fuel rates are reported per enzyme, while state concentrations use the stated inventory. Catalytic coefficient 0.001 s⁻¹ is a rare-product readout: its finite depletion of the terminal state is omitted in this limiting stationary calculation. A genuine finite catalytic departure changes the generator. State positions and node sizes are schematic; the plotted concentrations are computed.`,
 refs:['Murugan, Huse & Leibler (2014), arXiv1312.2286v2, introduction and §I pp. 1–2, equations 1–3','Own finite-affinity multi-checkpoint extension and rare-output limit'],links:{source:proofreading},viz:V.proofreading},
 {num:'6.2',kind:'Theorem',name:'Proofreading squares the error at an energetic cost',deps:['sysbio-6.1'],
 statement:String.raw`In the checkpoint family of 6.1, let $f=1/\sigma$ and fix a finite number n of extra activation steps. Allow ε to vary for this limiting family, hold σ fixed, and take ε and m to zero with εσ/m→0 and reverse rate r→0. Equivalently, the finite rates approach the window
$$\varepsilon\sigma\ll m\ll1,$$
$$r=(m/\varepsilon)e^{-\mu}\ll1,$$
with rates measured relative to the correct dissociation rate, the error approaches
$$\eta\sim f^{\,n+1}.$$
Thus one extra checkpoint gives the familiar squared-error limit. At μ=0 the error remains f. For at least one extra checkpoint, positive m and positive μ, the driven network has positive net fuel current F and chemical dissipation
$$\dot W=\mu F\,k_BT.$$
Here F counts net fuel molecules per enzyme per second, so the work rate is per enzyme. These are conditional statements for this model, not a universal error–energy bound.`,
 idea:String.raw`When reverse activation and bypass rebinding are negligible, each extra stage is reached before dissociation with probability approximately $m/d_S$. The first bound concentration is proportional to $1/d_S$, so the terminal concentration is proportional to $m^n/d_S^{n+1}$. Taking the W/R ratio proves the stated limit. At fixed finite parameters the extra terms remain and must be calculated.

Let $J_j$ be the net activation current across a checkpoint. Eliminating the bound concentrations gives a tridiagonal system with positive source proportional to $m(1-e^{-\mu})$. Its inverse is positive; thus F, the sum of these currents, is positive when the network is driven. Local detailed balance and stationary conservation cancel changes of internal free energy, leaving μ times the net fuel current as chemical work dissipated by this network.`,
 caption:String.raw`Compare calculated work and error for one, two and three extra checkpoints. Scan progression to find the useful kinetic window, and turn off the affinity to recover the thermal baseline rather than assume that extra states automatically square the error.`,
 scope:String.raw`The same finite-affinity family, with ε fixed at 10⁻⁵ in the visualization. The asymptotic theorem describes a family of limits; offered finite controls only approach it. Work per rare reporter divides network dissipation by the limiting reporter rate and excludes that reporter’s own product chemistry. Zero-work states have no finite logarithmic work coordinate. Finite bypass association limits the benefit of extreme stalling; neither speed nor error is forced into a monotone universal tradeoff. The original Murugan 2012 PMC body returned a browser/reCAPTCHA challenge and remains unread.`,
 refs:['Murugan, Huse & Leibler (2014), §I pp. 1–2, local detailed balance and the particular Hopfield–Ninio kinetic limit','Own stationary-current, dissipation and fixed-n asymptotic derivations'],links:{source:proofreading},viz:V.energetic},
 {num:'6.3',kind:'Model',name:'Conformational proofreading',deps:['sysbio-6.1'],
 statement:String.raw`A recognizer can discriminate through an equilibrium deformation penalty without a fuel-driven temporal checkpoint. In the authored finite ensemble, a correct target matches length4 and a competitor matches length $4-\Delta$. A native recognizer has length $4+d$, $d\ge0$. With equal target reservoirs, equal turnover coefficients and binding energy b=4 thermal units, define
$$w_A=e^{b-\kappa d^2/2}+\rho,$$
$$w_B=e^{b-\kappa(d+\Delta)^2/2}+\rho,$$
$$Z=1+w_A+w_B.$$
Correct bound fraction is $P_A=w_A/Z$ and specificity is $\xi=w_A/w_B$. For positive stiffness κ, geometric difference Δ and nonspecific weight ρ, specificity has one maximum at positive d. The correct-yield maximum generally occurs at a different mismatch; suppressing the competing target can initially increase correct binding too.`,
 idea:String.raw`Specific binding gains energy but requires elastic deformation; each target also has a nonspecific bound mode. Boltzmann weights and normalization give the partition formula. Moving the native recognizer away from both targets initially suppresses the already less compatible target more strongly. Competition can therefore raise both specificity and correct yield near a perfect match; at larger mismatch, useful binding falls.

Differentiate the log ratio. After multiplying by positive factors, its stationary equation compares an increasing function of d with a positive constant; its derivative contains the positive factor $(e^{\kappa\Delta(d+\Delta/2)}-1)$. There is one positive root. Differentiating the normalized correct fraction gives a different stationary equation and a separate yield maximum, shown explicitly. Without nonspecific binding, the log ratio instead grows linearly with d and there is no finite global specificity maximum, even as correct yield vanishes. Zero stiffness or identical geometries give a flat ratio.`,
 caption:String.raw`Stretch the recognizer’s native length, vary stiffness and target separation, and compare log specificity with actual correct yield. The optimum can lie outside the displayed mismatch interval; zero nonspecific binding removes its finite global maximum.`,
 scope:String.raw`Own finite binding ensemble inspired by the actual Savir–Tlusty 2007 Gaussian-plus-nonspecific construction. It is not their full continuum/noisy-target model, numerical parameter sweep or a protein-structure fit. Coordinates and lengths are illustrative; κ is in kBT per squared length unit. Elastic free-energy cost is an equilibrium penalty, not dissipated ATP work. Tiny positive effects are retained in log scale, and a scaled log-specificity panel states its scale explicitly.`,
 refs:['Savir & Tlusty (2007), actual selected printed pp. 2–5, equations 3–6 and the no-functional-background limit','Own finite partition ensemble and one-dimensional optimum proof'],links:{source:conformation},viz:V.conformational},
 {num:'6.4',kind:'Theorem',name:'Absolute concentration robustness (Shinar–Feinberg)',deps:['mathbio-5.11'],
 statement:String.raw`Consider a deterministic mass-action reaction network with fixed positive rate constants that admits at least one positive steady state. Let n be its number of complexes, ℓ its number of linkage classes and s its stoichiometric rank. Suppose
$$\delta=n-\ell-s=1.$$
If two nonterminal complexes differ by a nonzero multiple of just one species X, then the concentration of X is the same at every positive steady state. This is absolute concentration robustness, or ACR. The value may depend on the rate constants. The theorem asserts neither stability nor a positive equilibrium in every conserved-total class.`,
 idea:String.raw`A complex is the species combination on either side of a reaction arrow. A terminal strong linkage class has no outgoing reaction to another strong class. The deficiency-one condition restricts which differences of complex monomials can persist at steady state; the singled-out complex difference then fixes a power of one concentration. The precise structural theorem is restated as Theorem 1 in the actual Anderson–Enciso–Johnston 2014 body.

For the simple network $A+B\to2B$, $B\to A$, the A equation factors as $\dot A=B(b-aA)$. With conserved total M, a positive equilibrium therefore has $A=b/a$ and $B=M-b/a$, requiring $M>b/a$. The network $A+B\to2B$, $2A+B\to3A$ instead gives $\dot A=AB(bA-a)$: its positive ACR equilibrium $A=a/b$ is unstable. Both have four complexes, two linkage classes and rank one.`,
 caption:String.raw`Vary the conserved total and inspect the same positive-equilibrium A across feasible classes. Switch to an unstable ACR example and inspect its phase field; the structural criterion does not turn an unstable equilibrium into an attractor.`,
 scope:String.raw`Deterministic mass action and strictly positive steady concentrations. A class with too little inventory may have only boundary equilibria; ACR still concerns the network’s positive equilibria in feasible classes. The fixed-rate property does not imply robustness to changing kinetic constants. The original Shinar–Feinberg 2010 author-hosted PDF returned HTTP 503 and remains unread; hypotheses are checked against the distinct 2014 theorem restatement, with the two explicit examples derived locally.`,
 refs:['Anderson, Enciso & Johnston (2014), actual §3 pp. 3–4, definitions and Theorem 1; explicit unstable ACR example','Original Shinar–Feinberg 2010 body inaccessible HTTP 503; no alternate recovery'],links:{source:acrSource},viz:V.acr},
 {num:'6.5',kind:'Phenomenon',name:'Bifunctional enzymes make two-component output robust',deps:['sysbio-6.4'],
 statement:String.raw`In the authored sensor–regulator module, the unphosphorylated sensor A both accepts input and dephosphorylates the output. With maintained fuel and input rate u, use
$$A\xrightarrow{u}A_P,$$
$$A_P+B\xrightarrow{k_2}A+B_P,$$
$$A+B_P\xrightarrow{k_3}A+B.$$
Sensor and regulator inventories are conserved. At a positive steady state, equal phosphorylation and dephosphorylation fluxes imply
$$[B_P]^*=u/k_3.$$
This output is independent of both protein totals, provided the regulator total exceeds $u/k_3$ and the sensor total is positive. A different phosphatase architecture need not have this property.`,
 idea:String.raw`Stationarity of the sensor gives $u[A]=k_2[A_P][B]$. Stationarity of the output gives $k_2[A_P][B]=k_3[A][B_P]$. Since A is positive, cancel it to obtain the robust value. The remaining balance determines the sensor-state ratio and exposes the positive-equilibrium threshold.

There are five reaction complexes, two linkage classes and rank two, so deficiency is one. Nonterminal complexes A and $A+B_P$ differ only in $B_P$, directly connecting this example to 6.4. Replacing bifunctional dephosphorylation by $B_P\to B$ at rate $k_P[B_P]$ removes the common sensor factor. Solving its balances gives an output that varies with both inventories.`,
 caption:String.raw`Compare equilibrium output curves at three fixed sensor totals and vary the selected protein inventories. Inspect actual AP/BP transients and the alternative phosphatase architecture; low regulator supply exposes the boundary where a positive robust equilibrium is unavailable.`,
 scope:String.raw`Own minimal EnvZ–OmpR-like circuit, not the unread 2007 mechanism, data or parameter fit. Input u is 0–2 s⁻¹, k₂=2 and k₃=1 µM⁻¹s⁻¹, and the separate first-order phosphatase is 0.5 s⁻¹. Sensor inventory is positive. At zero input or insufficient regulator supply the stated positive-equilibrium ACR argument does not apply to that class. Numerical transients start from declared non-equilibrium inventories and are not forced to the analytic equilibrium. The original Shinar etal2007 author PDF returned HTTP 503; no alternate body was recovered.`,
 refs:['Own mass-action flux cancellation, inventory constraints and minimal bifunctional network','Anderson, Enciso & Johnston (2014), §3 Theorem 1; original 2007 circuit body inaccessible HTTP 503'],links:{source:acrSource},viz:V.bifunctional},
 {num:'6.6',kind:'Theorem',name:'Deficiency-zero theorem (Feinberg)',deps:['mathbio-5.12','mathbio-5.11'],
 statement:String.raw`Let a finite mass-action reaction network have positive rate constants, stoichiometric subspace S and deficiency
$$\delta=n-\ell-\dim S=0.$$
If the network is weakly reversible—every reaction edge belongs to a directed cycle—then each positive stoichiometric compatibility class has exactly one positive equilibrium. Every such equilibrium is complex-balanced and locally asymptotically stable relative to its class. Complex balance means that total incoming and outgoing flux agree at each complex. It is weaker than pairwise detailed balance, which balances each reversible reaction pair separately.`,
 idea:String.raw`At deficiency zero, the stoichiometric map has no kernel on the complex-incidence subspace. Thus a positive species steady state must also balance complex fluxes. Weak reversibility supplies a positive balanced vector in each linkage class; the logarithmic monomial equations then have a positive concentration solution. The equilibrium log concentrations form a translate of the orthogonal complement of S.

Strict convexity gives exactly one intersection with each positive compatibility class. The entropy-like function
$$\begin{aligned}h_i={}&c_i\log(c_i/c_i^*)\\&-c_i+c_i^*,\end{aligned}$$
$$H(c)=\sum_i h_i$$
decreases along trajectories within that class, supplying local asymptotic stability. These are the selected Gunawardena 2003 results. The modern deficiency formula here uses the complex-incidence space; his alternative kernel definition agrees automatically under weak reversibility, and its conditional counting formula must not be applied indiscriminately to other graphs.`,
 caption:String.raw`Compare closed nonlinear binding, a directed cycle, a broken chain and an open multistable network. Compute the actual complex graph, linkage classes and rank, then compare trajectories and analytic equilibria without inferring a theorem solely from a simulation.`,
 scope:String.raw`Positive compatibility classes are nonempty intersections of a stoichiometric affine space with the positive orthant. Boundary initial classes are excluded from the positive-equilibrium claim. The directed cycle illustrates complex balance with nonzero circulation; the broken chain has δ=0 but lacks weak reversibility. The open network ∅↔A, 2A↔3A has δ=1 and equilibria 1, 2, 3 in the same positive class. Its maintained inflow/outflow is not a conserved closed inventory. No general global-convergence or persistence theorem is asserted from these finite examples. The author-linked Feinberg 1979 lecture PDF returned HTTP 403; the distinct actual Gunawardena exposition is used.`,
 refs:['Gunawardena (20 June 2003), actual selected §6 Theorem 6.4 and §7 Theorem 7.1, plus selected convexity/Lyapunov arguments','Anderson, Enciso & Johnston (2014), §3 modern n−ℓ−s definition; own four network constructions'],links:{source:crnt},viz:V.deficiency},
 {num:'6.7',kind:'Theorem',name:'Signal amplification in kinase cascades',deps:['sysbio-4.9'],
 statement:String.raw`In a weak-activation linear cascade, let an input pulse be $x_0(t)=a e^{-\gamma t}$ with a>0, γ>0, and let each downstream tier start at zero:
$$\dot x_i=\alpha x_{i-1}-\beta x_i,$$
with α>0 and β>0. Its integrated signal has gain
$$I_i=\int_0^\infty x_i(t)\,dt,$$
$$G_i=I_i/I_0=(\alpha/\beta)^i.$$
The normalized temporal pulse has centroid and variance
$$\bar t_i=\gamma^{-1}+i\beta^{-1},$$
$$\operatorname{Var}(t)_i=\gamma^{-2}+i\beta^{-2}.$$
Area amplification above one requires α>β in this family. Reducing β increases area gain and prolongs the response; area gain is not peak-height gain.`,
 idea:String.raw`The Laplace transform is
$$X_i(s)={a\alpha^i\over(s+\gamma)(s+\beta)^i}.$$
Set s=0 for total area. After dividing by that area, the pulse is the convolution of one exponential density of rate γ and i exponential densities of rate β. Independent exponential waiting times add their means and variances, proving the timing formulas. At α=0 there is no output pulse to normalize, so its timing moments are undefined.

This dynamic linear regime differs from the saturated steady-state ultrasensitivity model in 4.9. Here positive serial-phase probabilities compute trajectories without subtracting close exponentials at β≈γ. Bounding the phase kernel by its largest Poisson mass also bounds every offered active fraction below 0.063; this supports, but does not quantify the error of, the weak-activation approximation.`,
 caption:String.raw`Follow an actual small pulse through successive tiers and switch between integrated gain and temporal moments. Slow deactivation increases area while delaying and broadening the response; inspect the sampled peaks separately instead of treating all three quantities as the same amplification.`,
 scope:String.raw`Own linear unsaturated approximation with no retroactivity, feedback, variable phosphatase activity or competition. Input is 10⁻⁶ exp(−t), γ=1 s⁻¹, α=0–2 s⁻¹ and β=0.1–3 s⁻¹, at most five tiers. Exact areas/moments use the infinite-time transfer function; plotted trajectories use a finite disclosed horizon and sampled peaks. This is not a detailed MAPK fit. The Heinrich–Neel–Rapoport 2002 publisher route returned HTTP 403; its original body is unverified and is not reconstructed.`,
 refs:['Own transfer-function, Erlang-convolution and positive-kernel bound derivations','Actual sysbio4.9 for the distinct nonlinear steady-state cascade; Heinrich et al. 2002 indexed abstract context only, body HTTP 403'],links:{context:'https://pubmed.ncbi.nlm.nih.gov/12049733/'},viz:V.cascade},
 {num:'6.8',kind:'Model',name:'Receptor–ligand dose–response and EC50',deps:['mathbio-5.2'],
 statement:String.raw`Independent receptors in a free-ligand reservoir have bound concentration
$$C=R_T{L\over K_d+L}.$$
In the authored downstream transduction law,
$$Y={C\over K_E+C},\qquad K_E>0.$$
For positive receptor inventory, its own response maximum and half-maximal free-ligand concentration are
$$Y_{\max}={R_T\over K_E+R_T},$$
$$EC_{50}=K_d{K_E\over K_E+R_T}<K_d.$$
Thus a response can reach half its own maximum before half the receptors are occupied. This is a model of amplification or spare-receptor behaviour, not an identity between binding Kd and every response EC50.`,
 idea:String.raw`The binding law is the actual free-ligand Langmuir model of 5.2. Substitute its occupied concentration into the transduction law and divide by the true maximum. Simplification gives
$$Y/Y_{\max}={L\over EC_{50}+L}.$$
Setting L to the stated EC50 therefore gives half the actual response maximum, even when that maximum is below one.

With no receptors, Y is identically zero, so a half-maximum concentration cannot be identified; reporting Kd as a measured EC50 in that case would be misleading. Maintaining free ligand is also different from prescribing total ligand in a closed, depleted sample. The inventory panel shows receptor fractions, while the readout retains actual concentrations and positive-underflow status.`,
 caption:String.raw`Compare binding occupancy, absolute downstream response and response normalized by its own maximum. Change receptor inventory or downstream scale to move EC50 relative to Kd, and remove receptors to expose the undefined half-response case.`,
 scope:String.raw`Synthetic equilibrium receptor binding plus a declared monotone steady-state transduction law. L is free ligand in µM, not total ligand. No fitted receptor reserve, cooperativity, kinetic lag, receptor internalization or biological dose is inferred. Zero ligand is a valid state outside the logarithmic horizontal coordinate. Positive concentrations and responses below the ordinary numeric range retain their log magnitudes; zero receptor inventory has zero response and no identifiable EC50.`,
 refs:['Actual mathbio5.2 free-ligand Langmuir derivation and closed-sample distinction','Own downstream rational response, maximum and EC50 derivation'],viz:V.receptors}
 ]};
