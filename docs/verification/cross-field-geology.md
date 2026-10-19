# Cross-field prerequisite audit: geology, biology, medicine and architecture

Added **140 direct prerequisite edges** across the nine assigned collections. Eight collections have at least 25 distinct directed written-to-written prerequisites crossing a registry **field** boundary; architecture retains an honest one-edge shortfall after independent peer review. Each addition is tied to an existing statement or derivation; no new claim, source closure, visualization change or runtime change is involved.

The [machine ledger](cross-field-geology.json) records every exact source/target pair, its source file, a full matching text excerpt, its purpose, both fields and syllabus synchronization. Same-field links and planned targets do not contribute to these counts.

| Collection | Before | Added | After | Shortfall below 25 |
| --- | ---: | ---: | ---: | ---: |
| Geology (`geol`) | 10 | 15 | 25 | 0 |
| Chemical kinetics (`kin`) | 9 | 17 | 26 | 0 |
| Mathematical biology (`mathbio`) | 17 | 9 | 26 | 0 |
| Ecology (`ecol`) | 3 | 22 | 25 | 0 |
| Physiology (`physio`) | 10 | 15 | 25 | 0 |
| Pharmacology (`pharm`) | 7 | 18 | 25 | 0 |
| Epidemiology (`epi`) | 10 | 15 | 25 | 0 |
| Architecture (`arch`) | 7 | 17 | 24 | 1 |
| Big history (`bighist`) | 14 | 12 | 26 | 0 |

## Evidence and validation

The audit checks that each target is imported as a written item, its registry field differs from the source field, the edge is new and unique, and the quoted statement/idea still matches the live source. Every touched syllabus row mirrors the complete written dependency array, including existing dependencies missing from that row. Alias resolution is accounted for.

`node scripts/check.mjs geol kin mathbio ecol physio pharm epi arch bighist --static` passes for **432 items, zero errors and zero warnings**. A separate live `loadAll`/`validate` pass reports zero errors and checks cycles across all written and planned items. All 140 new edges and their source anchors, field boundaries and syllabus mirrors were independently reconciled against the live imports. The prerequisite-only batch preserved names, statements, ideas and `verify` values. Separately authorized corrections discovered during peer review now amend six cards; see [focused corrections](peer-corrections.md) for hypotheses, sign, plot and native-control checks. Source flags remain unchanged. No browser was needed for dependency metadata.

A previously indirect route is retained in the JSON when present. A direct edge is still justified when its quoted derivation uses that target itself and the earlier route passes through another subject; this is distinguished from adding a repeated foundation whose existing immediate prerequisite already teaches the same step. Examples: the slab thermal-time argument needs diffusion directly, rather than a route through magnetic minerals and quantum mechanics; muscle power needs mechanical work directly, rather than a route through membrane thermodynamics.

## Exact additions

### Geology

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `geol-2.1` → `prob-1.2.4` | statement: Each unstable nucleus of a given isotope has the same constant probability $\lambda\,dt$ of decaying in any short interval $dt$, whatever it… | A constant per-nucleus decay hazard is the memoryless exponential lifetime model. |
| `geol-2.10` → `ode-1.4` | idea: te $P$; decay and erosion (which removes atoms from the surface) remove them in proportion to $N$: $dN/dt=P-(\lambda+\rho\varepsilon/\Lambda… | Production plus proportional loss is a forced first-order linear equation. |
| `geol-2.2` → `num-1.11` | statement: $ of its total $\lambda$, the factor $\lambda/\lambda_e$ multiplies $D^*/P$ inside the logarithm. A relative error $\sigma_R$ of the measure… | The displayed age-error formula is first-order sensitivity of the logarithmic inverse age map. |
| `geol-2.3` → `opt-1.6` | idea:  by the same factor $e^{\lambda t}-1$ times its own Rb/Sr, so the line rotates about its intercept. Linear regression (stat-12.2) fits slope… | The isochron slope and intercept are obtained by fitting a straight line to isotope-ratio data. |
| `geol-2.6` → `prob-1.2.5` | statement: diocarbon age $r(c)$ that a sample of that age would show, and a measurement $r\pm\sigma$ becomes a probability distribution $p(c)\propto\ex… | Calendar calibration explicitly uses a Gaussian measurement-error density. |
| `geol-2.6` → `stat-2.11` | statement: a sample of that age would show, and a measurement $r\pm\sigma$ becomes a probability distribution $p(c)\propto\exp[-(r(c)-r)^2/2\sigma^2]$,… | The inverse calibration curve is weighted by the likelihood of the measured radiocarbon age at each calendar age. |
| `geol-3.1` → `mech-10.1` | idea: ss the join would both have to be accidents. A rigid rotation of one continent about a single axis (Euler's theorem, mech-10.1) is the minim… | Rigid continental fitting is expressly described as one rotation about an axis. |
| `geol-3.10` → `pde-1.4` | idea: A slab is a cold sheet that heats by conduction (geol-4.3) as it sinks, over a thermal time that scales with its thickness squared; the fast… | The slab depth argument uses conduction over a thickness-squared diffusion time. |
| `geol-3.15` → `mech-10.1` | statement: paving stones" that move without internal deformation, and that on a sphere the motion of each is a rotation about an Euler pole (geol-3.4).… | The historical Pacific slip model applies the rigid rotation theorem on a sphere. |
| `geol-4.1` → `pde-1.5` | idea: f the heat carriers (phonons, here). Combined with energy conservation, $\nabla\cdot\mathbf q=0$ in steady state without sources, it forces … | Fourier flux plus conservation gives the one-dimensional source-free Laplace equation. |
| `geol-4.10` → `thermo-1.16` | statement: Solid mantle that rises nearly adiabatically cools only slowly (about 10–15 K per GPa), while the solidus temperature falls much faster with… | Supports the no-heat definition of an adiabatic parcel path only. The target ideal-gas PV^gamma law does not supply the solid-mantle equation of state, quoted numerical gradient or melt-fraction calibration. |
| `geol-4.10` → `thermo-4.5` | idea: plane the adiabat (nearly vertical) crosses the sloping solidus at $P_0$; above it, melting absorbs latent heat, so the temperature falls be… | The melt-fraction balance explicitly spends thermal excess on latent heat. |
| `geol-4.2` → `pde-1.5` | statement:  decay produces heat at a rate $A$ (W/m$^3$), largest in the upper crust. In steady conduction, $k\,d^2T/dz^2=-A(z)$. If the heat production… | The radiogenic geotherm solves a Poisson equation with volumetric heat production. |
| `geol-4.6` → `pde-4.11` | statement: iform $T_m$ at the ridge, the solution is $$T=T_0+(T_m-T_0)\Big[\frac za+\sum_{n\ge1}\frac{2}{n\pi}\sin\frac{n\pi z}{a}\,e^{-n^2\pi^2\kappa … | The finite-thickness plate geotherm is an explicit sine-mode heat solution with n-squared decay rates. |
| `geol-4.7` → `fluid-2.5` | idea: Ra compares the time heat takes to diffuse across the layer ($h^2/\kappa$) with the time a buoyant blob takes to rise ($\eta/\rho g\alpha\De… | The rise-time comparison uses the Archimedean buoyant force from the thermal density deficit; it does not substitute atmospheric parcel stability for the Rayleigh threshold. |

### Chemical kinetics

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `kin-1.10` → `ode-1.8` | idea: Linearising the rate equations about the new equilibrium (1.9) leaves $x'=-x/\tau$ for the small deviation $x$, with $1/\tau$ the sum of rat… | Small temperature-jump relaxation follows the linearization around the new equilibrium. |
| `kin-1.12` → `stoch-4.10` | statement: tate). For rate constants $k_{ij}$ among the species of a reaction network this requires, for every closed cycle, the **Wegscheider conditio… | The Wegscheider product condition is the cycle criterion for reversibility. |
| `kin-1.8` → `opt-1.6` | idea: anging concentrations, at the price of measuring a slope from a small, noisy signal: the order is a regression slope and has a standard erro… | Initial reaction orders are estimated by linear regression of log initial rates. |
| `kin-2.3` → `mech-8.2` | statement: olecular rate constant is $$k(T)\;=\;\pi d^2\sqrt{\frac{8k_BT}{\pi\mu}}\;N_A\,e^{-E_0/k_BT},\qquad \mu=\frac{m_Am_B}{m_A+m_B}.$$ The prefact… | The collision threshold and relative-speed law use the two-body reduced mass. |
| `kin-2.3` → `prob-1.2.4` | idea: mponent along the line of centres, and the weight makes the distribution of $E_n=\tfrac12\mu u_n^2$ exactly exponential, so $P(E_n\ge E_0)=e… | Flux weighting gives an exponential distribution of line-of-centres collision energy and therefore an exponential threshold tail. |
| `kin-2.6` → `mech-3.4` | statement: he energy of a reacting system is a function $V(\mathbf R)$ of the nuclear coordinates alone, its **potential energy surface**, and the nucl… | Classical nuclear motion on the potential surface uses force as its negative gradient. |
| `kin-3.1` → `thermo-6.1` | statement: ated as if reactants and activated complexes were in equilibrium: the density at the surface is the Boltzmann density, with the reactant tem… | The activated-complex population is explicitly an equilibrium Boltzmann density. |
| `kin-3.11` → `mech-4.7` | statement: $ in a potential well $V(x)$ with a barrier of height $E_b\gg k_BT$, coupled to a thermal bath by a friction $\gamma$ (Langevin equation $m\… | Supports linear viscous drag and the local inertial well dynamics only. The stochastic bath, escape-rate prefactors and Kramers turnover law require the separately flagged primary-source evidence. |
| `kin-3.2` → `thermo-6.5` | statement: ^{-1}}$ at $298\ \mathrm K$ is the frequency at which a complex in equilibrium crosses; in terms of free energies, $k=\kappa\,(k_BT/h)\,e^{-… | The free-energy form follows by converting the partition-function ratio into a free-energy difference. |
| `kin-3.3` → `thermo-3.9` | statement: Writing the Eyring equation with the free energy of activation $\Delta G^\ddagger=-RT\ln K^\ddagger_c$ (standard state $1\ \mathrm M$) and s… | The enthalpy/entropy split uses the Gibbs free-energy identity G=H-TS. |
| `kin-4.11` → `ode-1.4` | statement: In a chain with **branching**, one radical produces more than one radical. For the radical balance $dn/dt=\nu+(\varphi-g)\,n$, with initiati… | Initiation plus linear branching/termination is an explicitly forced linear rate equation. |
| `kin-4.12` → `thermo-1.13` | statement:  (the reactant burn-out is neglected) and loses it to the wall at the rate $Q_-(T)=h\,(T-T_0)$, so $C\,dT/dt=Q_+-Q_-$. For low $T_0$ the cur… | Heat capacity converts net heat production into the rate of temperature rise. |
| `kin-4.13` → `pma-3.26` | statement: chains appear only at very high conversion ($p=0.99$ gives $\overline X_n=100$). The most probable (Flory) distribution has weight fractions… | The Flory chain-length distribution and its moments use sums of geometric powers. |
| `kin-4.2` → `prob-1.2.4` | idea: he sequence is a chain of linear first-order steps, so the time to complete is a sum of independent exponential waiting times (4.1). The mea… | The mean completion time is a sum of exponential stage lifetimes. |
| `kin-4.5` → `ode-3.9` | idea: ces it by $I=\frac{k_1}{k_2}A$, a different line unless $k_1\ll k_2$. What matters is therefore the ratio of the two eigenvalues, the separa… | Validity of the steady-state reduction is assessed by the stable eigenvalues and their time-scale separation. |
| `kin-4.6` → `prob-1.2.4` | idea: cule independently decays with the exponential waiting time of rate $k_{\rm tot}$ (a competition of independent exponential clocks), and the… | The channel fractions are derived by competition of exponential molecular lifetimes. |
| `kin-4.9` → `qm-4.1` | statement: e probability that this happens. **RRKM** theory (Marcus 1952) replaces the classical estimate by a quantum count of states, $$k(E)=\frac{N^… | RRKM enumerates quantized oscillator modes to obtain vibrational state densities. |

### Mathematical biology

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `mathbio-2.12` → `ladr-9.65` | idea: The eigenvalues are the roots of $p(z)=z^2-Tz+D$ with $p(1)=1-T+D$ and $p(-1)=1+T+D$. For a complex pair $\|z\|^2=D$, so they are inside the c… | The Jury triangle is derived from the trace/determinant coefficients of the characteristic polynomial. |
| `mathbio-3.21` → `ctrl-3.3` | statement: mmunity matrix** $M=\operatorname{diag}(\mathbf x^*)\,A$, and the equilibrium is locally stable iff every eigenvalue of $M$ has negative rea… | The general n-species community matrix uses the full linear-system eigenvalue stability criterion. |
| `mathbio-3.4` → `mech-12.3` | idea: lpha\ln y\bigr]=0$. With canonical coordinates $q=\ln y$, $p=\ln x$, the system has Hamiltonian $H(q,p)=\delta e^p-\gamma p+\beta e^q-\alpha… | Canonical q=ln y,p=ln x give the exact Hamiltonian flow. Symplectic time stepping preserves symplectic area but not the original nonlinear Hamiltonian exactly. |
| `mathbio-4.1` → `stat-2.1` | statement: y that a newborn is alive in class $x$, so $\ell_1=1$ and $\ell_{x+1}=s_x\ell_x$ where $s_x$ is the probability of surviving from class $x$ … | Successive survivorship values multiply conditional one-class survival probabilities. |
| `mathbio-4.10` → `pma-9.15` | idea: Differentiate $A\mathbf u=\lambda\mathbf u$ and multiply by $\mathbf v^{\mathsf T}$: the term with $\mathrm d\mathbf u$ cancels because $\ma… | The sensitivity proof differentiates the parameter-dependent eigenvector equation. |
| `mathbio-4.13` → `prob-2.6.12` | statement: rns the long run: if the tilted kernel $k_r(a)=e^{-ra}\varphi(a)$ is non-lattice with $0<\mu_r=\int_0^\infty a k_r(a)\,da<\infty$, and the t… | The key renewal limit requires a non-lattice tilted kernel with finite positive mean and directly Riemann-integrable exponentially tilted forcing. |
| `mathbio-4.14` → `pde-1.2` | statement: al a}=-\mu(a)\,n,\qquad n(0,t)=\int_0^\infty\beta(a)\,n(a,t)\,da,\qquad n(a,0)=n_0(a).$$ Along each characteristic $a=t+\text{const}$ the de… | Age advances at unit speed, so the population PDE is solved along transport characteristics. |
| `mathbio-4.5` → `prob-1.6.1a` | statement: ers of a newborn over her lifetime, $$R_0=\sum_{x}\ell_x m_x ,$$ and the **generation time** is the mean age of mothers at the birth of thei… | Generation time is the expected value of the normalized reproduction-age distribution. |
| `mathbio-4.8` → `prob-2.7.1a` | idea: ere $p_x=\ell_xm_x/R_0$ is the distribution of the age of a mother at a birth. The left side is the moment generating function of that distr… | The generation-time correction is derived from the age-at-reproduction moment generating function. |

### Ecology

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `ecol-1.10` → `thermo-1.11` | idea: nd a body surface of about $0.11\,M^{0.65}$ m² (Stahl 1967), the ratio grows only as $M^{0.1}$: the lower critical temperature — the air tem… | The lower critical temperature is obtained by balancing metabolic heat production against heat loss at fixed body temperature. |
| `ecol-1.4` → `opt-1.6` | statement: ly than mass, so per gram it declines; $b < 0$ means it falls with size. Exponents are estimated by least-squares regression of $\log Y$ on … | The allometric exponent is estimated as the slope of a linear fit on logarithmic axes. |
| `ecol-1.6` → `physio-4.5` | idea: body mass across mammals (Stahl 1967 found $65.6\,M^{1.02}$ mL), so $B\propto M^{3/4}$. If $q = 1$ (Murray's law, or no space-filling with $… | The scaling derivation explicitly compares the WBE branching ratios with the Murray optimal-branching case. |
| `ecol-1.6` → `pma-3.26` | idea: one vessel by $(\beta^2\gamma)^{-1}$, so the volume carried by a whole level changes by the factor $q^{-1}$ with $q = n\beta^2\gamma$. For t… | The network blood-volume derivation sums level volumes forming a geometric series. |
| `ecol-2.1` → `stat-3.4` | idea: imals among $N$, the number of marked animals in a random sample of size $n$ is hypergeometric with mean $nM/N$. Solving $m = nM/N$ for $N$ … | The capture-recapture estimator solves the observed recapture count equal to its model expectation. |
| `ecol-2.10` → `prob-1.6.13` | statement: \,m^b$, so that $\log s^2=\log a + b\log m$ is a straight line. For randomly scattered individuals (Poisson) $a=b=1$ and the variance equals… | The random-scattering benchmark uses equality of the Poisson mean and variance. |
| `ecol-2.10` → `stat-1.15` | idea: , and the law suggests a first-order delta-method variance stabilization at positive means: choose $g'(x)=x^{-b/2}$, giving $g(x)=x^{1-b/2}/… | First-order delta approximation at positive operating means; b=2 uses log x, and zero counts require separate treatment. |
| `ecol-2.10` → `stat-1.3` | statement: oss a set of samples of the abundance of one species — different sites, dates or sample sizes — the sample variance $s^2$ is a power functio… | Taylor's law relates estimated sample variance and mean across abundance samples. |
| `ecol-2.11` → `prob-1.6.2` | idea: n by a small factor, and a logarithm punishes small factors heavily: $\ln\lambda$ is concave, so by Jensen's inequality $E\ln\lambda\le\ln E… | The gap between arithmetic and geometric population growth is explicitly justified by Jensen's inequality. |
| `ecol-2.12` → `stoch-2.4` | idea: with probability $b/(b+d)$ and a death otherwise, so the size performs a biased random walk. By the gambler's-ruin argument, starting from o… | The continuous birth-death extinction probability is computed through its embedded biased jump walk. |
| `ecol-2.13` → `stat-1.4` | statement: s of individuals (demographic stochasticity) and an upper limit set by the habitat, and reports the fraction of runs in which the population… | The estimated extinction-risk curve is the empirical CDF of simulated threshold hitting times. |
| `ecol-2.2` → `demo-2.6` | statement: age $x$, against age, usually with $l_x$ on a logarithmic axis. If the age-specific mortality rate (hazard) is constant, $\ln l_x$ falls on … | The three survivorship shapes are explained by how age-specific mortality accumulates into survival. |
| `ecol-2.5` → `prob-1.6.1a` | statement:  survives with probability $S(c)$ that falls as the brood grows (parents cannot feed them all), the expected number of young fledged, $cS(c)… | Clutch optimization maximizes expected surviving offspring cS(c), with future reproduction added. |
| `ecol-2.9` → `opt-1.6` | statement: r to year, the one that causes most of the variation in total mortality: the stage with the largest regression slope $b_i=\mathrm{Cov}(k_i,K… | The key factor is identified by its least-squares slope against total log mortality. |
| `ecol-3.2` → `ode-1.8` | idea: Write $\dot p=p\,(c(1-p)-e)$. At $p=0$ the linearization is $\dot p\approx (c-e)p$, which grows if $c>e$ and decays if $c<e$. For $c>e$ the … | The persistence threshold is decided by the sign of the growth derivative at zero occupancy. |
| `ecol-3.5` → `ode-1.7` | statement: extinction rate $e(p)=e\,e^{-kp}$ the equation $$\dot p=p\,\bigl[c(1-p)-e\,e^{-kp}\bigr]$$ can have two stable states (extinction and a high… | The rescue-effect threshold is a one-dimensional phase-line bistability claim. |
| `ecol-3.6` → `ode-1.4` | statement: e source population emigrating to the sink, $$\dot N_1=rN_1\Bigl(1-\frac{N_1}{K}\Bigr)-mN_1,\qquad \dot N_2=-dN_2+mN_1 .$$ If $r>m$ the sour… | The sink population solves a forced linear equation driven by dispersal from the source. |
| `ecol-3.7` → `stoch-1.4` | statement: tic metapopulation model: each patch $i$ has an area $A_i$ and a position, and in each year it is a two-state Markov chain (empty or occupie… | Each patch is modeled with occupied/empty transition probabilities and an occupancy equilibrium. |
| `ecol-3.9` → `game-1.3` | statement: every forager knows the intakes (**ideal**) and may settle in either patch without cost (**free**), nobody can do better by moving at equili… | The ideal-free allocation is exactly a no-profitable-unilateral-deviation equilibrium. |
| `ecol-4.10` → `pma-5.15` | idea: pped, so the growth rate averaged over fluctuations is raised by roughly $\delta(1-\delta)\,\mathrm{Var}(\ln B_i-\ln B_j)/2$ for either spec… | The storage-effect invasion advantage is a second-order expansion in fluctuating log recruitment. |
| `ecol-4.7` → `ladr-7.62` | idea:  to be positive. For the equal-norm, linearly independent utilization curves in this model, the overlap matrix is a common positive scalar t… | Strict PD applies to the equal-norm linearly independent translates in the implemented presets. A general Gram matrix is only PSD and unequal row normalization need not be symmetric. |
| `ecol-4.7` → `nla-3.2` | idea: what fails when the species are packed is **feasibility**. As the spacing shrinks, $\alpha$ becomes nearly singular, $\alpha^{-1}$ amplifies… | Limiting similarity loses feasibility because the ill-conditioned overlap matrix amplifies small fitness differences. |

### Physiology

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `physio-1.1` → `ctrl-1.1` | statement: activity keep disturbing them. This constancy is called **homeostasis**. It is produced mainly by **negative-feedback loops** with four part… | Homeostasis is explicitly organized as a closed-loop negative-feedback mechanism. |
| `physio-1.6` → `kin-1.3` | idea: Model the carrier as a four-state cycle: empty outward-facing ⇄ loaded outward-facing ⇄ loaded inward-facing ⇄ empty inward-facing ⇄ empty o… | The carrier cycle uses concentration-proportional elementary association and unimolecular conformation/release rates to construct its state transitions. |
| `physio-1.6` → `stoch-4.1` | idea: acing ⇄ loaded inward-facing ⇄ empty inward-facing ⇄ empty outward-facing. With nothing inside, the steady-state flux of this Markov chain h… | The four-state carrier model finds equilibrium occupancy by balancing probability inflow and outflow at every state. |
| `physio-1.8` → `em-2.3` | idea: Equilibrium means equal electrochemical potential on both sides: $RT\ln c_{\text{in}} + zF\phi_{\text{in}} = RT\ln c_{\text{out}} + zF\phi_{… | The Nernst derivation balances chemical free energy with charge times electrical potential difference. |
| `physio-2.1` → `neuro-2.3` | idea: s inactivate (the $h$ gate closes) and potassium channels open (the $n$ gate). The picture below is Hodgkin and Huxley's quantitative descri… | The spike mechanism is realized by Hodgkin-Huxley conductance and gating equations. |
| `physio-2.5` → `mech-3.1` | idea:  rearrangement of that. The shape means a muscle is a poor machine at both extremes: it produces no power when loaded to the maximum and non… | The muscle operating point maximizes mechanical power, force times shortening velocity. |
| `physio-2.6` → `mech-4.1` | statement:  backwards are detached quickly). The force is $F = \int x\,n(x)\,dx$ (each attached head acts as a linear spring). In the steady state the … | The force integral assumes attached cross-bridges exert Hookean spring force proportional to displacement. |
| `physio-2.6` → `pde-1.2` | statement: g(x)$, and the filaments slide at speed $w$ so that every head's $x$ changes at that rate: $$\frac{\partial n}{\partial t} - w\frac{\partial… | Cross-bridge attachment is transported through displacement space by filament sliding. |
| `physio-3.7` → `thermo-1.9` | statement: The work done by the ventricle on the blood in one beat, the **stroke work**, is the area enclosed by its pressure–volume loop: $SW = -\oint… | Stroke work is the closed pressure-volume work integral. |
| `physio-4.1` → `circ-1.4` | idea: It is the circuit law with pressure in the role of voltage and volume flow in the role of current: the pressure drops along a chain of vesse… | The circulation resistance model is the explicit pressure-flow counterpart of Ohm's relation. |
| `physio-4.15` → `ode-4.4` | statement: lution for the velocity is $$u(r,t)=\operatorname{Re}\!\Bigl\{\tfrac{-iG}{\rho\omega}\Bigl[1-\tfrac{J_0(\alpha i^{3/2}r/R)}{J_0(\alpha i^{3/… | The exact pulsatile pipe-flow profile is expressed with the cylindrical Bessel function J0. |
| `physio-4.7` → `ode-1.4` | statement: ral resistance $R$. With inflow $Q(t)$ from the heart and venous pressure taken as zero, $$C\,\frac{dP}{dt}=Q(t)-\frac{P}{R}.$$ During diast… | The Windkessel pressure balance is a first-order linear equation forced by ventricular inflow. |
| `physio-4.8` → `circ-2.3` | statement: Adding a **characteristic impedance** $Z_c$ in series between the heart and the two-element chamber gives the three-element Windkessel: the … | The three-element Windkessel adds characteristic resistance in series with the compliance/terminal-resistance compartment. |
| `physio-4.9` → `pde-1.3` | statement: A pressure pulse in an elastic artery travels as a wave at the **Moens–Korteweg speed** $c=\sqrt{Eh/(\rho d)}$, where $E$ is the wall's elas… | Arterial pressure travels and reflects as a finite-speed wave. |
| `physio-4.9` → `solid-1.4` | statement: y travels as a wave at the **Moens–Korteweg speed** $c=\sqrt{Eh/(\rho d)}$, where $E$ is the wall's elastic modulus, $h$ its thickness, $d$ … | The Moens-Korteweg wave speed depends on the arterial wall's elastic stress-strain modulus. |

### Pharmacology

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `pharm-1.7` → `kin-1.9` | statement: ion $P_T$ and dissociation constant $K_d$, the bound concentration is $B = P_T\,C_u/(K_d + C_u)$ (a Langmuir isotherm), where $C_u$ is the *… | Protein occupancy is the equilibrium of bound and unbound states, with forward rate proportional to free drug and reverse dissociation. |
| `pharm-1.8` → `kin-1.9` | idea: is conserved, so the totals simply redistribute to satisfy $f_1C_1=f_2C_2$, and the relaxation is a single exponential at rate $k(f_1+f_2)$.… | Neutral-form exchange has effective forward/backward rates kf1 and kf2, yielding the stated equilibrium ratio and summed relaxation rate. |
| `pharm-2.3` → `opt-1.6` | idea: Taking logarithms turns the exponential $C_0e^{-kt}$ into the line $\ln C_0-kt$ (2.1), so least squares applies. In ordinary regression the … | The elimination constant is obtained from a least-squares semilog slope. |
| `pharm-2.3` → `stat-1.10` | statement: lope has standard error $s_b$ from the regression, and a $95\,\%$ confidence interval is $\hat k\pm t_{n-2,0.975}\,s_b$. The interval is nar… | The finite-sample rate interval explicitly uses a Student t quantile with n-2 degrees of freedom. |
| `pharm-2.4` → `ode-1.4` | statement: =R/\mathrm{CL}$, where the input rate equals the elimination rate $\mathrm{CL}\cdot C_{ss}$. If the infusion stops at time $T$, the concentr… | Constant-rate infusion is a linear clearance equation driven by a constant source. |
| `pharm-2.7` → `kin-4.1` | idea: Two first-order stages in series. The gut amount is the exponential $F D e^{-k_at}$ (2.1 with $k_a$ in place of $k$) and it is the input to … | Oral absorption and elimination form the same consecutive first-order Bateman chain. |
| `pharm-2.8` → `pma-5.8` | idea: Setting $C'(t)=0$ in the difference of exponentials gives $ke^{-kt}=k_ae^{-k_at}$, i.e. $e^{(k_a-k)t}=k_a/k$, hence $t_{max}$; substituting … | Peak time follows by setting the derivative of the concentration-time curve to zero. |
| `pharm-3.1` → `ode-3.5` | idea: uations are a $2\times2$ linear ODE (kin-1.5 for one compartment, here for a vector), solved by the eigenvalues and eigenvectors of its matr… | The two-compartment decay is constructed from exponential-in-time eigenvector solutions of the rate matrix. |
| `pharm-3.10` → `prob-1.6.1a` | statement: ^\infty tC\,dt$ (trapezoids plus the tail $C_{last}t_{last}/\lambda_z+C_{last}/\lambda_z^2$), the **mean residence time** $\mathrm{MRT}=\mat… | MRT is defined as the normalized first time moment of the disposition curve. |
| `pharm-3.2` → `opt-1.6` | statement: ta t}$, estimate the parameters in stages. (1) On the semilog plot the late samples lie on the slow line: regress $\ln C$ on $t$ over them t… | Curve stripping estimates the slow exponential from a fitted terminal semilog line. |
| `pharm-3.6` → `fluid-1.8` | statement: rinsic clearance $\mathrm{CL}_{int}$ (the clearance the enzymes would show without any flow limit). Mass balance gives the hepatic clearance… | The well-stirred hepatic clearance follows from inflow, outflow and enzymatic removal in an organ control volume. |
| `pharm-3.8` → `kin-4.6` | statement: If a drug is eliminated by several independent first-order pathways that act in parallel on the same blood, say renal, hepatic and other, ea… | Parallel first-order elimination pathways have summed rates and fixed dose fractions, exactly the branching-ratio law. |
| `pharm-3.9` → `fluid-1.8` | idea: Mass balance on each organ (inflow minus outflow of drug) is the same bookkeeping as in 3.1, but the exchange rates are physiological: flow … | The PBPK organ equations apply inflow minus outflow of drug in tissue control volumes; the blood pool sums the returned organ mass fluxes. |
| `pharm-4.1` → `sig-2.2` | statement: If absorption and elimination are first-order (the system is linear and time-invariant), the concentration after repeated doses $D$ given at… | Repeated-dose concentrations use superposition of individual dose responses. |
| `pharm-4.1` → `sig-2.3` | statement: If absorption and elimination are first-order (the system is linear and time-invariant), the concentration after repeated doses $D$ given at… | The same single-dose response is shifted to each dose time without changing its shape. |
| `pharm-4.10` → `opt-1.6` | idea: rtional to those processes inherits the exponent about $3/4$; volumes follow organ and body size. A linear fit of $\log Y$ on $\log W$ (a po… | Cross-species clearance extrapolation fits a line in logarithmic mass-response coordinates. |
| `pharm-4.7` → `prob-2.4.1` | statement: ken at random with probability $a$ (adherence), the realised dosing rate is $a\cdot D/\tau$ and the long-run mean concentration is $a\bar C_… | The random-adherence model identifies the long-run realized fraction of doses with its Bernoulli probability. |
| `pharm-4.8` → `ode-3.12` | idea: he mean. What changes is how that area is spread in time: a zero-order input with duration $T$ is a rectangle of rate $D/T$, whose response … | Sustained zero-order delivery is the response of the linear elimination equation to a rectangular input. |

### Epidemiology

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `epi-1.5` → `prob-1.2.4` | statement: hort with no competing risks and no losses, suppose every disease-free person falls ill at the same constant rate $\lambda$. Then the risk o… | Constant individual disease hazard gives an exponential waiting time and its cumulative risk. |
| `epi-1.9` → `demo-2.4` | statement: ife expectancy** at age $x$ is $$e_x = \frac{T_x}{l_x} = \frac{1}{l_x}\int_x^\infty l(a)\,da,$$ the area under the survivorship curve beyond… | Life expectancy is the area under the survival curve per current survivor. |
| `epi-2.1` → `stat-2.1` | statement: P), false negatives (FN), false positives (FP) and true negatives (TN). Then $$\text{sensitivity} = P(+\mid D) = \frac{\text{TP}}{\text{TP} … | Sensitivity and specificity condition the test outcome on disease status. |
| `epi-2.11` → `prob-1.6.9a` | statement: y have density $$\frac{s\,f(s)}{E[S]}, \qquad \text{with mean } \frac{E[S^2]}{E[S]} = E[S] + \frac{\operatorname{Var} S}{E[S]} \;\ge\; E[S].… | The length-biased mean is expressed using the underlying first and second moments and variance. |
| `epi-2.4` → `stat-2.11` | statement: The **likelihood ratio** of a test result $r$ is how much more probable that result is in the diseased than in the healthy, $$\text{LR}(r) =… | Diagnostic odds are updated by a likelihood ratio for the observed test result. |
| `epi-2.7` → `psych-2.12` | idea: re $c$ itself (2.4), The unrestricted Bayes rule calls a result positive when its likelihood ratio exceeds $m^*$, equivalently when its post… | Unrestricted likelihood-ratio decision regions coincide with a single upper score cutoff when the LR is monotone increasing. The PSA preset compares finite-grid upper cuts and is not an unrestricted-region optimization. |
| `epi-2.9` → `prob-2.1.1a` | statement: fy alike. Part of it would happen by chance: if the raters call "positive" at rates $r_A$ and $r_B$ independently of the subject, they agree… | Kappa's chance-agreement baseline is a product of independent rater marginals. |
| `epi-3.10` → `causal-1.9` | statement: R_0$ is the overall risk. Both are meaningful as "preventable fractions" only if the association is causal and unconfounded, and removing th… | Interpreting the attributable fraction as preventable requires identifying the counterfactual risk without exposure. |
| `epi-3.11` → `causal-1.10` | statement: risk ratios $\mathrm{RR}_{ij} = R_{ij}/R_{00}$. The effect of $A$ **differs across levels of $B$** (effect modification, interaction) on the… | The additive and multiplicative interaction criteria are instances of scale-dependent effect modification. |
| `epi-3.9` → `demo-2.5` | statement:  ratio) is $$\mathrm{IRR} = \frac{d_1/T_1}{d_0/T_0},$$ the ratio of the two incidence rates. If the hazards (instantaneous event rates) in t… | The hazard ratio is defined using instantaneous event rates rather than cumulative risks. |
| `epi-4.13` → `causal-2.1` | idea: of 4.6 in its most clinical form, and Simpson's paradox (causal-4.4) is the pattern in the numbers. Randomization (causal-2.1) is the cure b… | The explanation explicitly uses randomization to remove severity's influence on treatment allocation. |
| `epi-4.13` → `causal-4.4` | idea: ty is a common cause of treatment and outcome, the confounder of 4.6 in its most clinical form, and Simpson's paradox (causal-4.4) is the pa… | Indication creates a reversal between marginal and severity-stratified treatment effects. |
| `epi-4.6` → `causal-2.6` | statement: $\mathrm{RR}_{\text{crude}}=\frac{P(D\mid E=1)}{P(D\mid E=0)}\ne \mathrm{RR}_{\text{causal}}=\frac{\sum_c P(c)\,P(D\mid E=1,c)}{\sum_c P(c)\… | Confounder adjustment in the displayed causal risk ratio standardizes stratum-specific risks to common population weights. |
| `epi-4.6` → `causal-4.6` | statement: (c)\,P(D\mid E=0,c)} .$$ Not every variable associated with $E$ and $D$ should be adjusted for: a **mediator** on the path from $E$ to $D$ s… | The adjustment warning distinguishes confounders from mediators and colliders whose control changes or biases the total effect. |
| `epi-9.11` → `stat-3.5` | statement: * over time. The regression coefficients can be estimated without specifying $\lambda_0$ at all, by maximising the product over failure time… | Cox's regression coefficients are estimated by maximizing the stated partial likelihood. |

### Architecture

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `arch-1.1` → `fluid-2.9` | statement: (a flat roof carries about $0.7$ of the ground snow load); - **wind** $W$, a pressure $q = \tfrac12\rho V^2 \approx 0.613\,V^2$ Pa that push… | The wind-load pressure scale is the flow kinetic head one-half rho V-squared. |
| `arch-1.2` → `mech-1.6` | idea: For a particle, $\sum\mathbf F = 0$ is Newton's first and second laws. For an extended body the internal forces cancel in pairs by the third… | The derivation of translational equilibrium uses Newton's second law with zero acceleration; the separate existing torque prerequisite handles moments. |
| `arch-1.3` → `ladr-3.21` | statement: nd with $A$ the $3\times r$ matrix that maps reactions to net force and moment: - if $\operatorname{rank} A < 3$, some load cannot be balanc… | Support determinacy and redundant reaction dimension follow from the equilibrium map's rank and null space. |
| `arch-1.3` → `mech-1.14` | statement:  a structure and replaces each support by the reactions it can supply: a **roller** gives one force normal to its surface, a **pin** a force… | The support free-body model uses the direction restriction on an ideal roller's normal reaction. |
| `arch-1.6` → `solid-1.4` | idea: face must supply a moment $M$ with no net axial force. If plane sections stay plane (solid-6.3) the strain, and so the stress, varies linear… | The linear bending stress distribution uses Hooke's relation between linearly varying strain and stress. |
| `arch-1.7` → `mat-1.7` | statement: sion.  Plotted on log–log axes of strength (or stiffness) against density, materials form families (Ashby charts). Lines of constant $\sigma… | The strength-density comparison uses Ashby property charts and constant specific-property selection lines. |
| `arch-2.3` → `pma-5.15` | statement: $L$ and sag $d$ the two curves are not equal, but they agree to first order in the sag ratio $d/L$: expanding $\cosh$ gives $$a\cosh\frac{x}… | The shallow-sag agreement of catenary and parabola follows by a Taylor expansion of cosh. |
| `arch-2.4` → `solid-1.8` | statement: ich a cable of given material can carry nothing else: the stress from self-weight alone reaches the working stress when $L \approx 8(d/L)\,\… | The self-weight span limit is defined by reaching the material's allowed working stress. |
| `arch-2.6` → `mech-4.7` | idea: 0.2 Hz torsional mode that drew energy from the wind (single-degree-of-freedom torsional flutter, a negative aerodynamic damping), not from … | The Tacoma explanation distinguishes self-excited negative damping from forced resonance. |
| `arch-2.6` → `solid-1.4` | idea: H}$ compared with the span. The compatibility condition $hL_e/E_cA_c = (8d/L^2)\int_0^L v\,dx$ (the cable stretches by the extra sag) closes… | Bridge compatibility couples cable stress and elastic elongation through E times area. |
| `arch-3.4` → `mech-1.15` | idea: /3\sigma$ from the edge. No sliding lets the force cross a joint at any angle to its normal; with a friction coefficient $\mu$ the angle mus… | The relaxed no-sliding assumption bounds joint force angle by the Coulomb friction cone. |
| `arch-3.5` → `opt-4.4` | idea: inear inequality, so the admissible lines are a polytope whose extreme thrusts are found by a small linear program. Poleni's argument for th… | The safe-thrust set is explicitly a polytope of linear inequalities optimized over reaction parameters. |
| `arch-3.6` → `mech-6.4` | idea: e numerically. Equilibrium says the loads can be carried while a thrust line fits; the principle of virtual work says they cannot be carried… | The collapse mechanism is certified by positive load work along an admissible virtual displacement. |
| `arch-4.11` → `pde-1.5` | idea: ixing the plan and the horizontal forces first removes the coupling: vertical equilibrium is then a discrete Poisson equation (arch-4.3 solv… | The height solve is explicitly identified as a discrete Poisson equation with support heights prescribed. |
| `arch-4.3` → `vcalc-1.6` | idea:  Its weight must be balanced by the vertical components of $N_\varphi$ around the circle of radius $a\sin\varphi$, which fixes $N_\varphi$ (… | The spherical cap equilibrium uses the parallel-circle radius a sin(phi) at the specified polar angle. |
| `arch-4.8` → `mech-1.15` | idea: chain. The courses can be laid without centering as long as the bed joints are not steeper than the friction of the mortar allows; above tha… | Uncentered construction depends on the friction limit of inclined brick bed joints. |
| `arch-4.9` → `vcalc-1.5` | idea: re $x^2+y^2+z^2=2a^2$ has horizontal radius $\sqrt{2a^2-z^2}$, which equals $a$ at $z=a$, where the vertical planes $x=\pm a$ and $y=\pm a$ … | The pendentive construction intersects the sphere with the explicitly specified coordinate planes x=±a and y=±a. |

### Big history

| Source → prerequisite | Existing text anchor | Existing step supported |
| --- | --- | --- |
| `bighist-1.3` → `geol-2.3` | statement:  = \frac{1}{\lambda}\ln\Bigl(1 + \frac{D}{P}\Bigr).$$ If some daughter was present initially, the **isochron** method recovers it: for miner… | The dating account invokes a fitted isochron to recover an initially present daughter component. |
| `bighist-2.5` → `mech-3.2` | statement: th a body roughly the size of Mars (often called Theia) struck the proto-Earth a glancing blow. The collision melted and partly vaporised bo… | The giant impact supplies the kinetic energy that melts and vaporizes mantle material. |
| `bighist-2.7` → `geol-3.12` | statement: ut an **Euler pole**. Over hundreds of millions of years the motions assemble the continents into **supercontinents** and break them apart a… | The supercontinent history presupposes the opening and closing stages of ocean basins. |
| `bighist-2.7` → `geol-3.4` | statement: iding past each other at transform faults. On a sphere each plate's motion is a rotation about an **Euler pole**. Over hundreds of millions … | The account explicitly models each plate as a rigid rotation on a sphere. |
| `bighist-3.6` → `geol-3.11` | statement: s earlier in the Palaeoproterozoic. The evidence is glacial deposits (diamictites, dropstones) that palaeomagnetism places at low latitude, … | Snowball evidence uses remanent magnetic inclination to place glacial sediments at low palaeolatitudes. |
| `bighist-3.8` → `mathbio-1.6` | idea: If a clade of $N$ taxa grows logistically, $\dot N = rN(1-N/K)$, and a catastrophe removes a fraction $f$ of it, write $n_0=N_0/K$ for the p… | The recovery-time formula is derived by inverting the explicit logistic population solution after an extinction pulse. |
| `bighist-3.9` → `geol-2.7` | statement:  Chicxulub, Mexico, making an impact structure roughly $180$–$200$ km across. Renne and colleagues' 2013 dating found impact tektites and a … | The impact/boundary chronology comparison rests on the argon geochronology used for the dated tektites and ash. |
| `bighist-3.9` → `mech-3.1` | idea: An impactor of diameter $L$, density $\rho$ and speed $v$ carries $E=\tfrac12\cdot\tfrac{\pi}{6}\rho L^3v^2$: a $10$ km body at $20$ km/s an… | The impact calculation uses one-half mass times speed squared after computing the spherical asteroid mass. |
| `bighist-4.2` → `sig-4.1` | statement:  glacial and interglacial climates. The record in deep-sea sediment and ice shows these swings have spectral peaks at periods close to those… | Milankovitch periods are identified through harmonic components of the sediment and ice records. |
| `bighist-4.3` → `geol-2.11` | statement: dest fossils at about $315\,000$ years ago (Jebel Irhoud, Morocco) and Omo I fossils older than the overlying ash dated $233\pm22$ka (2σ) at… | The Omo age is a stratigraphic minimum inferred from an overlying dated ash rather than a direct fossil date. |
| `bighist-4.5` → `prob-3.7.2a` | idea: patchwork cut at an average rate of one crossover per Morgan. After $T$ generations the cuts form a Poisson process of rate $T$ per Morgan, … | The single-pulse ancestry-tract model treats recombination breakpoints as a Poisson process along genetic distance. |
| `bighist-4.5` → `prob-3.7.4` | idea:  Poisson process of rate $T$ per Morgan, and the two ancestries alternate along the chromosome as a two-state Markov chain whose leaving rat… | Independent thinning of rate-T crossover cuts by the probability of leaving the present ancestry gives the displayed rates T(1-f) and Tf; this is a continuous-distance construction. |

## Excluded candidates

These candidates were examined and excluded or replaced because they duplicated an existing prerequisite, supplied an unused diagnostic, or did not match the actual model. Their exclusion is independent of the collection totals.

- `geol-2.8` → `kin-2.1`: The existing direct diffusivity prerequisite mat-2.7 already supplies this same Arrhenius law.
- `geol-3.13` → `fluid-2.5`: Existing geol-5.2 already identifies this exact isostatic buoyancy step; avoid duplicating its foundation.
- `kin-1.12` → `stoch-4.9`: The added cycle-criterion prerequisite stoch-4.10 already includes detailed balance.
- `kin-3.2` → `thermo-6.2`: The added thermo-6.5 free-energy/partition-function conversion already supplies the partition-function foundation.
- `kin-3.5` → `qm-3.15`: Existing qchem-1.11 already supplies this quantum barrier-transmission prerequisite.
- `ecol-4.6` → `mech-13.4`: The text claims chaotic coexistence but does not derive or state a Lyapunov-exponent diagnostic; do not add an unused diagnostic.
- `physio-1.2` → `ctrl-1.6`: Existing ctrl-1.8 already directly covers the same feedback-sensitivity denominator.
- `physio-4.6` → `solid-1.4`: The compliance account allows nonlinear/collapsible walls and does not derive its curve from the linear Hooke law.
- `physio-4.16` → `ctrl-4.1`: A transient curve alone does not use the engineering step-response specification formulas.
- `pharm-3.12` → `ode-3.2`: The historical-paper text does not derive a matrix-exponential formula; avoid linking only the numerical implementation.
- `epi-2.8` → `stat-2.1`: The diagnostic-probability prerequisite is already supplied through epi-2.2 and the new direct epi-2.1 link.
- `epi-7.10` → `stat-6.3`: The existing power/sample-size prerequisite chain already supplies this same statistical-power concept.
- `arch-4.3` → `fluid-2.7`: The balloon comparison is an analogy; isotropic surface tension is not the actual anisotropic shell-equilibrium derivation.
- `bighist-2.4` → `mech-2.10`: Existing astro-7.4 already directly covers angular-momentum conservation for the protoplanetary disk.
- `bighist-2.6` → `mech-2.12`: Existing astro-3.3 already directly covers the same spin-orbit angular-momentum transfer.
- `bighist-2.6` → `mech-9.3`: Existing astro-3.3 already directly covers the same tidal-friction mechanism.
- `bighist-3.7` → `popgen-3.9`: The history prerequisite chain already supplies molecular-clock dating; this item does not add a new clock calculation.
- `bighist-4.7` → `stat-1.12`: Existing bioinf-3.5 already supplies the exact maximum-of-Gumbel calculation; generic order statistics would duplicate its foundation.
- `pharm-3.9` → `ode-3.1`: After the more specific eigenmode link on pharm-3.1, generic linear-system theory is already supplied by that direct prerequisite; replaced with the explicit organ control-volume balance.
- `physio-1.6` → `kin-4.3`: Steady-state carrier occupancy is not by itself a fast-intermediate approximation; replaced the SSA link with the actual elementary-rate input.
- `ecol-4.7` → `ladr-7.38`: The strict positive-definite condition is more precise here than general nonnegative positive-operator characterizations.
- `geol-4.7` → `fluid-2.4`: Atmospheric stratification without viscous/thermal diffusion is not the finite-Rayleigh onset criterion; replaced with the buoyancy force actually used.

Architecture remains at 24 qualifying edges, one below the requirement. Its uniaxial material-strength discussion does not justify counting a multiaxial Rankine criterion as a direct prerequisite; peer review moved that link to contextual see-also. Other missing links were not added to replace it solely for the quota. Source flags remain open wherever their separate full-source evidence is incomplete.

Independent peer-review correction: `arch-1.7` → `solid-4.3` was moved to contextual see-also because maximum-principal-stress failure is not a step used by the source.

Independent peer-review correction: removed `geol-3.7` → `mech-1.8` because rotating-frame velocity composition is not constant Galilean invariance. Scope qualifications: `geol-4.10` → `thermo-1.16` supplies no-heat adiabatic meaning, not an ideal-gas mantle gradient; `kin-3.11` → `mech-4.7` supplies local linear drag, not the stochastic Kramers escape law.

The independent peer review removed `arch-1.7 → solid-4.3` to context and removed `geol-3.7 → mech-1.8`. It replaced `bighist-4.5 → stoch-1.4` with `prob-3.7.4`: Poisson thinning supplies continuous-distance leaving rates; discrete transition powers do not. The ledger narrows the mantle-adiabat and Kramers drag prerequisites to their actual local roles.
