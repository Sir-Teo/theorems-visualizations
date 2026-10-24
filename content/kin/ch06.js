import * as UI from './ch06.ui.shared.js';
export default {collection:'kin',chapter:6,title:'Catalysis and enzyme kinetics',summary:"Catalytic pathways obey thermodynamic constraints while changing relaxation rates. Declared enzyme models separate transient occupancy, saturation, inhibition, specificity and cooperative response from the mechanisms that might produce them. Surface models and temperature ramps connect site populations to measurable rates, with synthetic data and historical bibliography clearly distinguished.",items:[
{num:"6.1",
kind:"Principle",
name:"Catalysts lower barriers but leave equilibrium unchanged",
deps:["kin-3.2", "kin-1.12"],
statement:String.raw`A catalyst supplies an alternative kinetic pathway. In a closed reversible system at fixed temperature, pathways consistent with the same state free energies have the same equilibrium constant. For two states with $G_A=0$, $G_B=\Delta G$ and one common transition level B,
$$k_f=\frac{k_BT}{h}e^{-B/(RT)},$$
$$k_r=\frac{k_BT}{h}e^{-(B-\Delta G)/(RT)}.$$
Lowering that transition level by q multiplies both rates by $e^{q/(RT)}$, while $k_f/k_r=e^{-\Delta G/(RT)}$ stays fixed. The equilibrium B fraction is $K/(1+K)$.`,
idea:String.raw`Detailed balance fixes the forward/reverse ratio through the state free-energy difference. Changing a shared transition level changes the two activation barriers together, leaving that ratio unchanged. Total A+B conservation reduces the kinetic equations to a linear relaxation toward the same equilibrium fraction. A catalyst that participates in intermediates need not be unchanged at every instant, but it is regenerated in the complete cycle.`,
caption:String.raw`Change the transition levels and state-energy difference, then advance the clock in baseline relaxation times. Both exact trajectories approach the same equilibrium; the readout also reports physical seconds.`,
scope:String.raw`Declared two-state Eyring model at one temperature, unit transmission coefficient and no external fuel or maintained chemical driving. Both chosen transition levels remain above both states. Smooth drawn profiles are selected free-energy paths with those endpoints and maxima, not molecular calculations. Equal rate enhancement here follows from the shared transition-level model; arbitrary multistep catalysts need not multiply measured forward/reverse constants by one common factor. Stabilizing an intermediate alone does not guarantee faster turnover.`,
refs:["MIT 10.37 Spring 2007, W. Green, Lecture 16, complete PDF 1–4: catalysts, barriers and bound intermediates"],
tags:["catalysis", "detailed balance"],
links:{"source": "https://ocw.mit.edu/courses/10-37-chemical-and-biological-reaction-engineering-spring-2007/51e31c53576d849d489776c705307e55_lec16_04112007_g.pdf"},
viz:UI.catalysis},
{num:"6.2",
kind:"Model",
name:"Michaelis–Menten kinetics",
deps:["kin-4.3"],
statement:String.raw`For the declared mechanism $E+S\rightleftharpoons ES\to E+P$, let substrate be maintained at S and remove product. Free and bound catalytic centers interconvert with association rate $k_{on}S$ and return rate $k_{off}+k_{cat}$. Their stationary bound fraction and product rate are
$$\theta_{ss}=\frac{S}{K_M+S},$$
$$K_M=\frac{k_{off}+k_{cat}}{k_{on}},$$
$$v_{ss}=k_{cat}E_0\theta_{ss}.$$
The limiting rate is $V=k_{cat}E_0$; half this limit occurs at S=KM. A hyperbolic rate law does not uniquely identify this mechanism.`,
idea:String.raw`Conserve free plus bound enzyme and write the binding/return balance. The exact occupancy equation is linear when substrate is held constant; its relaxation rate is the sum of the two transition rates. Setting that derivative to zero gives the saturation law. This separates the startup transient from the stationary rate, without claiming a closed batch retains its initial substrate indefinitely.`,
caption:String.raw`Vary substrate and microscopic rate constants. Compare the stationary saturation curve with the exact startup from initially free enzyme, including the integrated product formed.`,
scope:String.raw`One catalytic center per modeled enzyme, ideal maintained substrate, no reverse product binding and initially free enzyme. This is an open reservoir/initial-rate limit, not a closed equilibrium mechanism. Concentrations are in μM, association coefficient in μM⁻¹s⁻¹ and first-order constants in s⁻¹. The plotted bound fraction is an exact ensemble probability, not a fabricated single-enzyme trace. KM is generally not the dissociation constant; a closed-batch steady-state approximation needs additional concentration/timescale conditions. Logarithms retain small positive occupancy and product after numerical underflow.`,
refs:["NC-IUB Recommendation 1981 web version, §4.1–4.2: limiting rate, specificity constant and Michaelis kinetics", "MIT 10.492 Fall 2004, K. Prather, Lecture 3/4, PDF 2–3: mechanism and enzyme conservation; balance rederived here"],
tags:["enzyme kinetics", "saturation"],
links:{"source": "https://iubmb.qmul.ac.uk/kinetics/ek4t6.html", "source2": "https://ocw.mit.edu/courses/10-492-2-integrated-chemical-engineering-topics-i-introduction-to-biocatalysis-fall-2004/665db3fe15fe26fe2e47b3944032f1ac_lecture3.pdf"},
viz:UI.michaelis},
{num:"6.3",
kind:"Paradox",
name:"Lineweaver–Burk plots and error distortion",
deps:["kin-6.2"],
statement:String.raw`The Michaelis curve $f(S)=VS/(K_M+S)$ becomes a straight line under a double reciprocal:
$$\frac1v=\frac{K_M}{V}\frac1S+\frac1V.$$
That transformation also changes the error objective. For positive observations y and model f,
$$\left(\frac1y-\frac1f\right)^2=\frac{(f-y)^2}{y^2f^2}.$$
Unweighted reciprocal least squares therefore differs from least squares on the original rates. Near a good fit, its residual weights scale approximately as $1/v^4$, strongly emphasizing low-rate observations. No estimator is universally best under every noise model.`,
idea:String.raw`Algebra linearizes the curve but does not preserve distances between observations and predictions. Differentiate the reciprocal, or use the exact residual identity, to see the low-rate magnification. Fit both objectives to the same positive synthetic observations. For the direct fit, eliminate V analytically at each compactified K and search stationary profile candidates plus the constant and linear limiting families.`,
caption:String.raw`Change the true curve, noise amplitude and integer seed. Both plots use the same seven observations; compare fitted parameters and both residual objectives.`,
scope:String.raw`Synthetic additive bounded errors of common absolute amplitude, chosen below the smallest true rate so reciprocals exist. These are not empirical enzyme measurements. The positive direct fit uses a compactified parameter profile and derivative-bracket refinement with a convergence diagnostic; it is not a certified global optimizer or a confidence interval. A reciprocal line with nonpositive slope/intercept is reported as lacking positive Michaelis parameters rather than silently clamped. Statistical rankings depend on the actual noise, concentration uncertainty and weighting; Eadie–Hofstee also introduces correlated errors.`,
refs:["MIT 10.492 Fall 2004, Lecture 3/4, PDF 3–4: reciprocal plots and low-substrate sensitivity; objectives derived explicitly here"],
tags:["parameter fitting", "error transformation"],
links:{"source": "https://ocw.mit.edu/courses/10-492-2-integrated-chemical-engineering-topics-i-introduction-to-biocatalysis-fall-2004/665db3fe15fe26fe2e47b3944032f1ac_lecture3.pdf"},
viz:UI.fitKinetics},
{num:"6.4",
kind:"Definition",
name:"Catalytic efficiency kcat/KM and catalytic perfection",
deps:["kin-6.2", "kin-5.2"],
statement:String.raw`For Michaelis kinetics, $k_{cat}/K_M$ is the low-substrate specificity coefficient: $v\approx(k_{cat}/K_M)E_0S$. In the simple binding mechanism,
$$\frac{k_{cat}}{K_M}=k_{on}\frac{k_{cat}}{k_{off}+k_{cat}}.$$
The second factor is the probability that a bound complex reacts before releasing substrate. Under a declared diffusion-encounter model, set $k_{on}=p_a k_D$, with $0\le p_a\le1$. Then efficiency cannot exceed this model’s encounter coefficient. Equality requires both association and subsequent reaction to succeed with unit probability.`,
idea:String.raw`At low substrate, binding encounters are isolated. Each successful association is followed by competing catalytic and release exits; their first-order rates determine the success probability. Multiply encounter supply by the two probabilities. The Smoluchowski result from 5.2 supplies the chosen encounter coefficient, with the required conversion from number-density SI units to molar concentration units.`,
caption:String.raw`Change encounter radius, relative diffusion and the two success factors. Compare the computed molar efficiency with its own model encounter limit.`,
scope:String.raw`Dilute unbounded three-dimensional continuum with constant relative diffusion and an absorbing encounter sphere. The encounter coefficient is $1000N_A4\pi RD$ in L mol⁻¹s⁻¹. Additional orientation/gating success is represented by a chosen probability. This is not a universal ceiling for all enzymes or environments, and no measured enzyme rankings are supplied. The simple mechanism is required for the microscopic probability identity. With zero association there is no finite Michaelis saturation concentration, while efficiency is zero.`,
refs:["NC-IUB Recommendation 1981 web version, §4.1–4.2: specificity and catalytic constants", "MIT 10.492 Fall 2004, Lecture 3/4, PDF 3: catalytic constants; encounter conversion uses written KIN5.2"],
tags:["catalytic efficiency", "diffusion"],
links:{"source": "https://iubmb.qmul.ac.uk/kinetics/ek4t6.html", "source2": "https://ocw.mit.edu/courses/10-492-2-integrated-chemical-engineering-topics-i-introduction-to-biocatalysis-fall-2004/665db3fe15fe26fe2e47b3944032f1ac_lecture3.pdf"},
viz:UI.efficiency},
{num:"6.5",
kind:"Model",
name:"Competitive inhibition",
deps:["kin-6.2"],
statement:String.raw`In a declared competitive-inhibition model, let free inhibitor compete with substrate for free enzyme and define $i=I/K_{ic}$. Initial-rate kinetics take the form
$$v=\frac{VS}{(1+i)K_M+S}.$$
The apparent Michaelis concentration increases by $1+i$, while the limiting rate V is unchanged. At fixed finite inhibitor concentration, increasing substrate makes the inhibited rate approach V; no finite substrate concentration reaches the limiting value exactly.`,
idea:String.raw`Rapid reversible inhibitor binding multiplies the free-enzyme population by the factor $1+i$. Combine that partition with the stationary substrate-bound fraction and total-enzyme conservation. The same denominator determines free, inhibitor-bound and substrate-bound enzyme, so the population picture and rate curve must agree. Operational competitive kinetics alone does not prove one unique microscopic binding site.`,
caption:String.raw`Add inhibitor and vary substrate. Compare the inhibited curve with the baseline and inspect the enzyme fractions computed from the same denominator.`,
scope:String.raw`Initial-rate maintained free substrate/inhibitor, inactive EI and no ESI state in this particular mechanism. V and KM are declared synthetic constants; inhibitor input is the dimensionless ratio I/Kic. Depletion, tight binding, irreversible inhibition, substrate inhibition and product feedback are omitted. Positive tiny inhibitor contrasts retain a logarithmic relative-rate loss when its linear value is below numerical range. At zero substrate both rates vanish and their relative rate loss is undefined.`,
refs:["NC-IUB Recommendation 1981 web version, §6.1–6.4: reversible inhibition and operational competitive classification"],
tags:["competitive inhibition", "enzyme populations"],
links:{"source": "https://iubmb.qmul.ac.uk/kinetics/ek4t6.html"},
viz:UI.competitive},
{num:"6.6",
kind:"Model",
name:"Uncompetitive and noncompetitive inhibition",
deps:["kin-6.5"],
statement:String.raw`A declared mixed-inhibition law has
$$v=\frac{VS}{\alpha K_M+\alpha'S},$$
$$\alpha=1+I/K_{ic},$$
$$\alpha'=1+I/K_{iu}.$$
Its apparent parameters are $V/\alpha'$ and $\alpha K_M/\alpha'$. Uncompetitive inhibition has α=1 and decreases both parameters by the same factor. Pure noncompetitive inhibition has α=α′, decreasing V while leaving KM fixed. General mixed inhibition need not leave KM unchanged.`,
idea:String.raw`Allow inhibitor-bound free and substrate-bound populations to sequester enzyme. Their nonnegative weights normalize to one and give the stated rate denominator. Taking reciprocals separates the competitive contribution to slope from the uncompetitive contribution to intercept. Parallel reciprocal lines follow for uncompetitive inhibition, while the equal-constant pure noncompetitive case preserves the horizontal intercept.`,
caption:String.raw`Switch inhibition class and adjust the active binding controls. Both saturation and reciprocal plots are computed from one common rate law.`,
scope:String.raw`Maintained initial-rate concentrations, catalytically inactive inhibitor complexes and the stated linear-in-inhibitor model. The classification is operational; one kinetic curve is not proof of a unique microscopic mechanism. The name pure noncompetitive means equal competitive and uncompetitive constants here, not every form of mixed inhibition. Baseline V=1 μM/s and KM=10 μM are chosen. Unused controls are hidden; positive inhibition effects below range retain their logarithms.`,
refs:["NC-IUB Recommendation 1981 web version, §6.2–6.4: linear, uncompetitive, mixed and pure noncompetitive inhibition"],
tags:["mixed inhibition", "rate laws"],
links:{"source": "https://iubmb.qmul.ac.uk/kinetics/ek4t6.html"},
viz:UI.mixed},
{num:"6.7",
kind:"Model",
name:"Hill equation and cooperativity",
deps:["kin-6.2"],
statement:String.raw`A phenomenological Hill occupancy law is
$$\theta=\frac{s^h}{1+s^h},\qquad s=S/K_{1/2}.$$
For positive finite s, its log-odds slope is h:
$$\ln\frac{\theta}{1-\theta}=h\ln s.$$
This operational steepness need not equal the number of binding sites. N independent identical sites have per-site occupancy $s/(1+s)$ and expected bound count Nθ; their Hill slope is one for every N. In more general models the local Hill slope can vary with concentration.`,
idea:String.raw`Taking occupancy odds removes the denominator of the chosen Hill law. For independent identical sites, each site instead has its own two-state binding balance; adding sites changes the expected number bound but not the per-site odds. This separates a response-shape parameter from a molecular stoichiometric count. Neither a Hill fit nor a hyperbola proves a unique microscopic mechanism.`,
caption:String.raw`Compare a Hill response with independent identical sites. The second mode reports expected ligand count separately from per-site probability and retains a Hill slope of one.`,
scope:String.raw`Chosen equilibrium occupancy laws, with activity proportional to occupancy only if that additional closure is intended. No haemoglobin measurements or fitted coefficient of 2.8 are supplied. The Hill coefficient is continuous and the independent-site count is a separate integer control. At zero dose occupancy is zero and there is no finite Hill-log coordinate. Complementary probabilities and logarithms are evaluated separately to retain extreme-dose information. Cooperativity is used in the operational Hill sense, not as proof of specific site interactions.`,
refs:["NC-IUB Recommendation 1981 web version, §10–11: Hill slopes, operational cooperativity and limits of mechanism identification"],
tags:["Hill equation", "cooperativity"],
links:{"source": "https://iubmb.qmul.ac.uk/kinetics/ek7.html"},
viz:UI.hill},
{num:"6.8",
kind:"Phenomenon",
name:"Temperature optimum of enzymes",
deps:["kin-6.2", "kin-2.1"],
statement:String.raw`A temperature optimum depends on a stated activity model. Here catalytic turnover follows a chosen Arrhenius law, while rapid reversible unfolding leaves an active fraction
$$f_A=\frac1{1+K_U},$$
$$\ln K_U=\frac{H_U}{R}\left(\frac1{T_m}-\frac1T\right).$$
For saturated substrate, activity is $E_0f_Ak_{cat}(T)$. A stationary point requires the unfolded fraction to equal $E_a/H_U$. A finite positive-temperature maximum need not exist, and an existing maximum need not lie inside the observed temperature window.`,
idea:String.raw`Add the logarithmic Arrhenius slope to the logarithmic active-fraction slope. Their competition gives a derivative proportional to $E_a-H_U(1-f_A)$. Solve for the candidate temperature and check that its inverse is positive. If unfolding cannot overcome the catalytic activation term, the declared model keeps increasing rather than producing an invented bell-shaped curve.`,
caption:String.raw`Change catalytic activation energy, unfolding enthalpy and transition temperature. Compare the actual effective activity with the active fraction, and locate an optimum only when the model supplies one.`,
scope:String.raw`Synthetic saturated-substrate model with rapid reversible two-state unfolding, constant unfolding enthalpy and zero heat-capacity difference. It does not model irreversible thermal damage, aggregation or exposure-time-dependent loss. Baseline 100 s⁻¹ at 300 K and 0.1 μM catalytic centers are chosen. No universal 37°C optimum or measured enzyme fit is asserted. The rate graph uses logarithmic values with an explicit reference unit; readouts retain physical rates. A stationary point outside the finite plot is reported rather than clamped to its edge.`,
refs:["MIT 10.492 Fall 2004, Lecture 3/4, PDF 5–6: Arrhenius activity, reversible/irreversible deactivation and assay-duration dependence"],
tags:["temperature", "enzyme stability"],
links:{"source": "https://ocw.mit.edu/courses/10-492-2-integrated-chemical-engineering-topics-i-introduction-to-biocatalysis-fall-2004/665db3fe15fe26fe2e47b3944032f1ac_lecture3.pdf"},
viz:UI.thermal},
{num:"6.9",
kind:"Model",
name:"Langmuir–Hinshelwood mechanism",
deps:["pchem-11.4", "kin-4.3"],
statement:String.raw`Suppose A and B adsorb competitively onto identical noninteracting sites, adsorption is equilibrated, and a reaction between adsorbed species limits the rate. Write $a=K_Ap_A$, $b=K_Bp_B$. Mean-field site fractions give
$$\theta_A=\frac{a}{1+a+b},$$
$$\theta_B=\frac{b}{1+a+b},\quad r=k\theta_A\theta_B.$$
At fixed b>0, r is maximal at a=1+b. Excess A eventually suppresses the reaction by excluding B. When b=0 there is no reaction and no unique rate maximum.`,
idea:String.raw`Balance adsorption and release against the common free-site population, then normalize free, A-bound and B-bound sites. Insert both adsorbed fractions into the declared reaction-limited mean-field rate. Differentiating with respect to a at fixed b gives a numerator proportional to $1+b-a$. That maximum does not apply when total pressure is fixed and both partial pressures vary together.`,
caption:String.raw`Change the two adsorption strengths and the surface reaction coefficient. Compare site competition with the actual fixed-B rate maximum.`,
scope:String.raw`Chosen reaction-limited Langmuir–Hinshelwood model, with uncorrelated-neighbor geometry absorbed in k. Adsorption strengths are dimensionless; r is an event rate per chosen site normalization in s⁻¹. No product adsorption, reverse surface reaction, dissociation, transport limitation or coverage-dependent interaction is included. The model’s poisoning curve is not by itself an experimental mechanism proof. Positive rates below numerical range retain finite logarithms.`,
refs:["MIT 10.37 Spring 2007, Lecture 16, PDF 3: Langmuir–Hinshelwood definition and bound-state competition", "P. Ghosh, NPTEL Interfacial Engineering Module 4/Lecture 4, PDF 7–8: Langmuir site assumptions"],
tags:["surface catalysis", "site competition"],
links:{"source": "https://ocw.mit.edu/courses/10-37-chemical-and-biological-reaction-engineering-spring-2007/51e31c53576d849d489776c705307e55_lec16_04112007_g.pdf", "source2": "https://archive.nptel.ac.in/content/storage2/courses/103103033/module4/lecture4.pdf"},
viz:UI.langmuirHinshelwood},
{num:"6.10",
kind:"Model",
name:"Eley–Rideal mechanism",
deps:["pchem-11.4"],
statement:String.raw`In the declared Eley–Rideal model, A adsorbs but B reacts directly from the gas phase. With equilibrated A adsorption and a reaction-limited irreversible step,
$$\theta_A=\frac{K_Ap_A}{1+K_Ap_A},$$
$$r_{ER}=k_{ER}p_B\theta_A.$$
At fixed pB, this rate saturates as pA increases. The compared competitive-site Langmuir–Hinshelwood model can instead peak and decrease because adsorbed A displaces B. These signatures depend on the specified assumptions.`,
idea:String.raw`Only A enters the adsorption partition in the Eley–Rideal branch. Multiply its bound fraction by the gas-B supply and the chosen reaction coefficient. For the comparison, both A and B occupy the same Langmuir–Hinshelwood site pool. Keeping the two mechanisms’ coefficient units separate prevents a dimensionless coverage factor from being misread as an absolute reaction rate.`,
caption:String.raw`Vary gas pressures and adsorption constants. Compare the two computed rates and their corresponding site populations at the same chosen pressures.`,
scope:String.raw`Chosen constants: kER=1 s⁻¹bar⁻¹ and kLH=1 s⁻¹ under their respective per-site normalizations. Pressures are in bar, adsorption constants in bar⁻¹. Their amplitudes are illustrative, not measured evidence that one mechanism is faster. B does not adsorb in the ER branch; product adsorption, reversibility and transport are omitted. No single pressure curve uniquely identifies an experimental mechanism. Tiny positive gas pressures retain logarithmic rates when linear products underflow.`,
refs:["NPTEL Heterogeneous Catalysis Module 2/Lecture 19, page 7: reaction-limited irreversible Eley–Rideal assumptions; equation images not used", "MIT 10.37 Spring 2007, Lecture 16, PDF 3: LH/ER distinction"],
tags:["Eley–Rideal", "heterogeneous catalysis"],
links:{"source": "https://archive.nptel.ac.in/content/storage2/courses/103103026/module2/lec19/7.html", "source2": "https://ocw.mit.edu/courses/10-37-chemical-and-biological-reaction-engineering-spring-2007/51e31c53576d849d489776c705307e55_lec16_04112007_g.pdf"},
viz:UI.eleyRideal},
{num:"6.11",
kind:"Method",
name:"Temperature-programmed desorption",
deps:["pchem-11.6", "kin-2.1"],
statement:String.raw`Under linear heating $T=T_0+\beta t$, the declared desorption model is
$$\dot\theta=-\nu\theta^n e^{-E/(RT)}.$$
It has constant barrier E, no readsorption and normalized adsorbate inventory θ. Let
$$J(T)=\frac\nu\beta\int_{T_0}^{T}e^{-E/(RT')}\,dT'.$$
First-order inventory is $\theta_0e^{-J}$; second-order inventory is $\theta_0/(1+\theta_0J)$. Zero order loses inventory linearly in J and stops at exhaustion. For first order, an interior rate peak satisfies
$$\nu e^{-E/(RT_p)}=\frac{\beta E}{RT_p^2}.$$
This implicit condition is used directly, without a logarithmic peak approximation.`,
idea:String.raw`Separate the inventory equation using temperature as the independent variable. The same integrated Arrhenius dose determines all three declared orders. Differentiating the logarithmic first-order signal gives the peak condition. Zero order instead rises until a discontinuous exhaustion cutoff, so its peak is a left limit; it is not a stationary point. A peak outside the observation window must be reported as such.`,
caption:String.raw`Switch desorption order, heating rate and binding energy. Compare signal with remaining inventory, including an empty-surface example and finite-window peak status.`,
scope:String.raw`Synthetic constant-barrier Polanyi–Wigner models, no readsorption, transport resistance or barrier distribution. ν=10¹³ s⁻¹ and T0=200 K are chosen. Inventory is dimensionless; in the first-order example it can represent fractional site coverage. Zero/second orders are explicit model extensions, not formulas copied from the first-order source. Loaded inventory ranges 0.05–1; empty inventory is a separate state. Positive-order inventory remains positive at finite time even after numerical underflow; logarithms retain it. Adaptive positive quadrature returns convergence and an error estimate, not a rigorous roundoff enclosure. Near unresolved zero-order exhaustion no definite signal value is invented.`,
refs:["P. Ghosh, NPTEL Interfacial Engineering Module 4/Lecture 4, complete PDF 13–15 and PDF 14 pixels: first-order TPD and exact implicit peak condition"],
tags:["desorption", "temperature ramp"],
links:{"source": "https://archive.nptel.ac.in/content/storage2/courses/103103033/module4/lecture4.pdf"},
viz:UI.desorption},
{num:"6.12",
kind:"Paper",
name:"Die Kinetik der Invertinwirkung",
deps:["kin-1.2", "kin-1.8", "kin-4.4"],
statement:String.raw`The 1913 paper provides the historical anchor for this modern saturation-kinetics workshop. For fast reversible binding followed by slower catalysis, the pre-equilibrium approximation uses $K_d=k_{off}/k_{on}$. In the declared mechanism, however,
$$K_M=K_d(1+\epsilon),$$
$$\epsilon=k_{cat}/k_{off}.$$
With $s=S/K_d$, compare bound fractions
$$\theta_{eq}=\frac{s}{1+s},$$
$$\theta_{ss}=\frac{s}{1+s+\epsilon}.$$
For s>0, their relative occupancy excess is $\epsilon/(1+s)$. Thus a Michaelis concentration need not be a binding dissociation constant.`,
idea:String.raw`The fast-binding balance fixes the equilibrium bound/free ratio. The stationary catalytic balance adds an additional exit from the bound state, changing the denominator. The pre-equilibrium result is recovered when catalytic escape is sufficiently weak relative to binding/release at the chosen substrate. Both fractions come from enzyme conservation; agreement with a saturation curve alone cannot distinguish all microscopic mechanisms.`,
caption:String.raw`Vary the catalytic-to-release ratio and substrate. Compare the two calculated bound fractions and their actual approximation error, with physical turnover rates shown separately.`,
scope:String.raw`Declared modern model and chosen parameters, not a reconstruction or fit of unread original invertase measurements. The original 1913 body and data table were not consulted for this illustration. Later IUBMB text supports the modern operational statements. At zero catalytic ratio product rates vanish while binding occupancy remains meaningful; no 0/0 rate normalization is assigned. At zero substrate the relative occupancy error is undefined. Raw/logarithmic deficits distinguish tiny positive catalysis from exact zero.`,
refs:["NC-IUB Recommendation 1981 web version, §4.1–4.2: operational Michaelis concentration and mechanism limitations", "MIT 10.492 Fall 2004, Lecture 3/4, PDF 2–3: modern stationary mechanism; pre-equilibrium comparison derived here"],
tags:["Michaelis–Menten", "pre-equilibrium"],
links:{"source": "https://iubmb.qmul.ac.uk/kinetics/ek4t6.html", "source2": "https://ocw.mit.edu/courses/10-492-2-integrated-chemical-engineering-topics-i-introduction-to-biocatalysis-fall-2004/665db3fe15fe26fe2e47b3944032f1ac_lecture3.pdf"},
paper:{"authors": "L. Michaelis and Maud L. Menten", "year": 1913, "title": "Die Kinetik der Invertinwirkung", "venue": "Biochemische Zeitschrift 49: 333–369"},
introduces:["kin-6.2"],
viz:UI.preequilibrium},
]};
