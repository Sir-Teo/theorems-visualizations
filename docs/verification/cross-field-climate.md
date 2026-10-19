# Cross-field prerequisite audit: climate reviewer partition

The audit checks the strict master-plan count: distinct directed dependencies from written items to written targets in a different registered field. It adds only methods already used in existing statements or derivations. All changed dependencies are mirrored in their syllabi.

|Collection|Before|After|Added|Shortfall from 25|
|---|---:|---:|---:|---:|
|astro|9|16|7|9|
|geo|13|25|12|0|
|climate|12|25|13|0|
|geog|12|25|13|0|
|popgen|11|25|14|0|
|neuro|6|19|13|6|
|bioinf|10|25|15|0|
|sysbio|2|11|9|14|

Geophysics, climate, geography, population genetics and bioinformatics reach 25. The other shortfalls remain open. Physics-to-physics and biology-to-biology links do not count even when they cross collections. No prose, models, source flags or runtime files changed.

## astro

The remaining written orbital and radiative items mainly depend on other physics collections, which do not cross the registered field boundary. Basic calculus already inherited through those laws was not added.

- `astro-2.7 → ode-3.5`: Statement secular modes have eigenfrequencies of A; idea diagonalises the coupled linear system into normal modes.
- `astro-3.10 → ode-1.3`: Circular-orbit dr/dt=-2 beta GM/(cr) is separated and integrated to obtain t_PR proportional to r0 squared.
- `astro-4.12 → nla-2.8`: Idea explicitly fits straight lines in logarithmic mass/luminosity coordinates to obtain empirical slopes.
- `astro-10.19 → nla-2.8`: Statement jointly solves solar motion and the velocity-distance coefficient; idea identifies distances as coefficients in that fit.
- `astro-10.21 → stat-2.11`: Statement fits H0,OmegaM,OmegaLambda and reports model significance from the supernova observations.
- `astro-10.18 → ode-1.3`: Statement classifies expanding/recollapsing radius solutions from the first-order Friedmann equation and its period integral.
- `astro-10.22 → stat-2.11`: Statement constructs a joint likelihood band and compares likelihood-supported cosmological parameter values.

## geo

- `geo-1.1 → thermo-1.4`: Substitution of ideal gas p=rho RT into hydrostatic balance produces the scale height.
- `geo-1.1 → ode-1.3`: Hydrostatic ideal-gas equation is separated into dlnp=-dz/H and integrated for p(z).
- `geo-1.9 → vcalc-2.11`: The locally linear density equation of state uses first-order expansion in temperature and salinity with variable partial-derivative coefficients.
- `geo-2.2 → ode-3.6`: Coupled u_dot=fv,v_dot=-fu gives circular motion, inertial period and a damped rotating velocity vector.
- `geo-2.4 → vcalc-3.11`: Spherical momentum equations include metric terms and coordinate-scaled pressure gradients.
- `geo-2.4 → pma-5.15`: The beta plane is explicitly the first-order Taylor expansion of f=2 Omega sin(phi) around phi0.
- `geo-2.7 → vcalc-3.8`: Taking curl of the pressure gradient gives zero in the displayed Taylor-Proudman proof.
- `geo-4.1 → ode-3.13`: The constant-coefficient complex ODE A psi_zz=if psi is solved with decaying characteristic roots.
- `geo-1.7 → mech-3.2`: CAPE is the vertical integral of buoyancy acceleration; converting that work per unit mass into kinetic energy yields w_max=sqrt(2 CAPE).
- `geo-4.5 → fluid-3.3`: Idea derives spin-down through stretching/squeezing vorticity columns, with f partial_z(w) giving the relative-vorticity tendency.
- `geo-4.3 → vcalc-3.10`: Curl of tau/(rho f) is expanded by the scalar-vector curl product rule to obtain the explicit beta tau_x/(rho f^2) term.
- `geo-1.4 → ode-3.13`: The buoyancy derivation explicitly reduces parcel displacement to a constant-coefficient harmonic or anti-restoring oscillator; its characteristic roots give sinusoidal frequency N or exponential growth sqrt(-N^2).

## climate

- `climate-2.6 → ode-1.4`: Schwarzschild transfer is a first-order inhomogeneous linear equation; integrating factor gives attenuated source integral.
- `climate-3.9 → stat-2.11`: The combined feedback constraint is constructed by multiplying likelihoods, with an explicit prior for the posterior.
- `climate-4.4 → ode-1.8`: A local albedo-feedback slope larger than the restoring slope destabilises the scalar temperature equilibrium.
- `climate-7.15 → thermo-4.15`: The general Gibbs equilibrium condition sum(nu_i mu_i)=0 supplies the equilibrium principle underlying carbonate buffering at fixed alkalinity. The target's ideal-gas quotient is not identified with the aqueous carbonate reaction quotient.
- `climate-1.7 → rca-3.3`: Idea explicitly uses the power-mean/Jensen inequality <T> <= <T^4>^(1/4) for uneven airless-surface temperatures. This is independent of the unrelated radiation-theory ancestry.
- `climate-1.9 → sig-3.10` (replaces planned `sig-6.8`): The displayed response amplitude and arctangent phase lag are the sinusoidal frequency response of the first-order energy-balance filter.
- `climate-2.11 → thermo-1.11`: Convective adjustment conserves the enthalpy of mixed layers; this is a separate first-law argument from the radiative-transfer calculation.
- `climate-4.6 → pma-6.19`: The conditional sensitivity density uses a variable substitution s=D/(1-f), whose Jacobian is D/s^2; this is distinct from the inherited blackbody integration argument.
- `climate-3.9 → stat-2.1` (replaces planned `stat-10.1`): Independent likelihood multiplication is conditional on feedback; dependence from shared errors changes the combined constraint.
- `climate-4.8 → pma-9.11`: The radiative-kernel sum is the total first-order linear approximation of net flux in all state variables, beyond merely defining its partial derivatives.
- `climate-1.6 → ode-1.7`: The equilibrium is stable because net heating changes from positive below T_e to negative above it; this is phase-line reasoning.
- `climate-8.13 → rca-9.1`: The historical inference resolves peaks in finite-core power spectra. The Fourier transform of an integrable finite-window signal or covariance supplies the frequency decomposition without assuming an exact fundamental period.
- `climate-4.6 → stat-2.1`: The sensitivity density is explicitly conditional on the stable branch F<1 and divided by Z=P(F<1); the median equation also uses this conditional normalization, independently of the Jacobian substitution.

## geog

- `geog-1.2 → vcalc-1.6`: Latitude-longitude Cartesian position is explicitly the spherical coordinate map with latitude replacing polar colatitude.
- `geog-1.7 → vcalc-2.8`: Geodetic latitude is defined by the normal to the meridian ellipse, unlike the geocentric radial direction.
- `geog-1.10 → nla-2.9`: The displayed GPS iterated linearised solution uses (H^T H)^-1 H^T residuals and covariance from the normal matrix.
- `geog-1.4 → num-1.4`: Statement compares haversine with cosine/arccos when nearby points make cos(sigma) close to1 and digits are lost.
- `geog-2.1 → ode-1.3`: Constant bearing gives d(lambda)=tan(beta) sec(phi) d(phi); separation gives the logarithmic rhumb-line formula.
- `geog-2.3 → prob-2.2.1`: Independent hourly error increments add variances, hence position-error standard deviation grows like sqrt(t).
- `geog-2.3 → pma-6.24`: Position is the vector integral of measured velocity from the initial location.
- `geog-3.4 → vcalc-4.5`: Part(c) identifies local area scale as absolute determinant of the derivative of the map.
- `geog-3.6 → vcalc-4.6`: The equivalence between equal area for every region and unit local area scale uses change of variables.
- `geog-5.6 → vcalc-1.5`: Idea derives the perspective radius by intersecting a ray from the viewpoint with the tangent plane.
- `geog-5.8 → ode-1.3`: Conformality gives separable d(rho)/rho=-n sec(phi)d(phi), whose integral produces Lambert conic radii.
- `geog-3.8 → rca-17.4`: Idea applies the boundary maximum principle to subharmonic log scale after adding a harmonic function.
- `geog-3.8 → rca-13.11`: Idea reconstructs a conformal map from a harmonic log-scale correction on a simply connected region; clause(g) provides a global holomorphic primitive.

## popgen

- `popgen-1.2 → comb-1.12`: The statement models offspring genotype counts as multinomial probabilities from independent segregation.
- `popgen-1.9 → stoch-1.4`: The two-sex X-frequency recurrence is a two-state stochastic matrix, giving an eigenvalue -1/2 for damped alternating deviations.
- `popgen-1.10 → pma-1.35`: The maximum diversity bound 1-1/k follows from (sum p_i)^2 <= k sum p_i^2, equality at uniform frequencies.
- `popgen-1.10 → prob-1.6.9a`: The sample correction uses E[p_hat_i^2]=p_i^2+Var(p_hat_i) to obtain the plug-in heterozygosity bias.
- `popgen-1.14 → pma-5.15`: The log mean-fitness product is expanded to first order in F to obtain the lethal-equivalents slope.
- `popgen-2.1 → stoch-1.1`: The Wright-Fisher frequency is a discrete Markov chain with binomial transition probabilities depending only on the current count.
- `popgen-2.5 → stoch-1.10`: The Moran process is explicitly a birth-and-death chain: one step changes the allele count by at most one.
- `popgen-3.1 → stoch-1.4`: Reversible mutation is the two-state chain with transition probabilities mu and nu, whose nontrivial eigenvalue is1-mu-nu.
- `popgen-3.5 → comb-1.15`: The sampling law for the number of alleles uses unsigned Stirling numbers of the first kind.
- `popgen-3.5 → stat-2.3`: K is sufficient because the displayed Ewens probability factors into a theta-dependent function of K and a theta-free configuration term.
- `popgen-3.6 → prob-3.7.2a`: The infinite-sites sampler assumes independent Poisson mutation processes along genealogical branches: each branch count is Poisson(theta*length/2), with conditional independent uniform event times (content/popgen/ch03.js line336). The dependency supports that substantive mutation model; constant mean rate alone is not asserted to imply Poisson increments.
- `popgen-3.7 → comb-1.19`: The stepwise-mutation idea uses the central-binomial return probability of a symmetric random walk, asymptotic to a constant over sqrt(number of steps).
- `popgen-3.13 → prob-1.6.13`: The fluctuation test compares jackpot variance to the mean-equals-variance Poisson prediction for induced mutations.
- `popgen-4.10 → vcalc-2.7`: The adaptive-landscape update uses partial derivatives of mean fitness, a weighted gradient in two allele frequencies.

## neuro

The remaining dynamical-systems and cable prerequisites are often planned ODE, stochastic-process or circuit results. Generic integration routines and references already supplied by the same membrane/cable derivation were excluded.

- `neuro-1.1 → circ-2.1`: The membrane RC balance is current conservation: injected current equals capacitive plus ionic leak current.
- `neuro-1.3 → circ-1.4`: The ionic-current approximation I=g(V-Erev) is Ohmic current driven by the reversal-potential difference.
- `neuro-1.6 → prob-2.2.1`: Independent channel Bernoulli fluctuations give open-fraction variance p(1-p)/N.
- `neuro-1.7 → prob-2.1.1a`: Independent gate opening probabilities multiply to give n^4 and m^3 h channel open probabilities.
- `neuro-3.2 → ode-3.8`: The planar FitzHugh-Nagumo nullcline crossing is classified by the linearised planar system.
- `neuro-3.7 → ode-1.14`: The quadratic integrate-and-fire solution reaches infinity in finite time; the theta change removes that coordinate singularity.
- `neuro-4.3 → ode-4.6`: Finite sealed or clamped cable ends impose boundary conditions selecting the cosh/sinh solution of lambda^2 Vdd=V.
- `neuro-4.4 → pde-3.4`: The cable Green function is the heat kernel multiplied by exp(-T); source responses are its space-time convolution.
- `neuro-4.7 → vcalc-2.6`: Spatial coordinate rescaling x to x sqrt(d) in the cable equation uses the second-derivative chain rule to obtain speed proportional to sqrt(d).
- `neuro-1.6 → kin-1.9`: The open/closed gate kinetics are opposed first-order transitions with relaxation rate alpha+beta and equilibrium alpha/(alpha+beta).
- `neuro-1.1 → sig-2.9` (replaces planned `em-6.12`): The membrane current-step response is that of an RC first-order system with time constant RC.
- `neuro-4.6 → circ-2.8`: The axial current sum g_ij(V_j-V_i) is the weighted graph Laplacian of the compartment connectivity, used to construct the coupled equations.
- `neuro-1.4 → circ-3.12`: The steady membrane voltage (sum g_i E_i+I)/sum g_i is Millman's parallel-source voltage formula; it gives shunting by added conductance.

## bioinf

- `bioinf-1.4 → comb-1.6`: Choose the i mismatching positions in k, then choose one of three other bases at each position.
- `bioinf-1.9 → algo-10.1`: Greedy motif search repeatedly chooses the profile-most-probable next window and is explicitly a heuristic without global optimality.
- `bioinf-1.10 → prob-2.1.2`: Independent random restarts succeed with probability 1-(1-p)^N by multiplying complementary failure probabilities.
- `bioinf-1.12 → stat-3.12`: The claim that EM iterations never decrease likelihood is the EM monotonicity theorem.
- `bioinf-1.6 → stat-2.11`: The PWM score is explicitly the log likelihood ratio between motif and background sequence models.
- `bioinf-2.1 → algo-8.1`: An alignment is defined as a directed path in its edit graph, with steps corresponding to alignment columns.
- `bioinf-2.4 → stoch-1.2`: PAM scores extrapolate substitution frequencies by powers of a Markov transition matrix.
- `bioinf-3.4 → prob-1.6.13`: Karlin-Altschul specifies a Poisson limiting count with mean Kmn exp(-lambda S).
- `bioinf-4.1 → stat-3.5`: Markov transition estimates c_st/sum c_st are explicitly maximum-likelihood estimates from sequence transition counts.
- `bioinf-4.7 → stat-2.1`: Forward times backward likelihood divided by total data probability gives the posterior hidden-state distribution.
- `bioinf-4.12 → num-1.10`: Statement derives scaled probabilities and the stable log-sum-exp formula to avoid HMM underflow.
- `bioinf-4.2 → stat-6.4`: Idea explicitly invokes the Neyman-Pearson lemma to justify its simple-versus-simple likelihood-ratio discriminator.
- `bioinf-4.2 → info-2.1`: The per-letter expected log-likelihood ratio is the transition-weighted relative entropy; its sign separates the two sequence classes.
- `bioinf-3.4 → prob-2.7.1a`: The displayed equation sum(q_a q_b exp(lambda s_ab))=1 is the moment-generating function of the pair score; convexity and negative mean give its positive root.
- `bioinf-4.4 → algo-7.2` (replaces planned `stoch-14.11`): Viterbi retains one optimal prefix per hidden end state and extends it using a dynamic-programming recurrence.

## sysbio

Most direct prerequisites are other biology models. The advanced bifurcation, stochastic gene-expression and Fokker-Planck theory is largely planned; shared biology field links and generic plotting/integration methods do not count.

- `sysbio-1.1 → algo-8.1`: Transcription networks use directed graph nodes, signed edges, in/out-degree, paths, cycles and autoregulatory loops.
- `sysbio-1.4 → prob-2.1.1a`: Idea explicitly derives AND by multiplying independent regulatory-event probabilities; OR is a+b-ab.
- `sysbio-1.5 → prob-1.6.13`: Statement gives the stochastic production-degradation stationary law as Poisson with equal mean and variance beta/alpha.
- `sysbio-2.1 → ode-1.7`: A decreasing production-minus-loss function has exactly one phase-line fixed point attracting every positive trajectory monotonically.
- `sysbio-2.4 → ode-2.13`: At matched steady state the positive-feedback production rate is smaller at every intermediate level; scalar comparison gives a slower response.
- `sysbio-2.5 → ode-1.8`: Stability of three production-loss crossings is decided by whether the local production slope is greater or less than removal slope.
- `sysbio-4.1 → ode-3.8`: Nullcline intersections are stable nodes or a saddle; the stable saddle manifold separates the memories.
- `sysbio-4.8 → thermo-4.15`: The general equilibrium condition sum(nu_i mu_i)=0 supplies the chemical-equilibrium principle for binding. The aqueous concentration model and total-species balances are those of the titration item; the target's displayed ideal-gas quotient is not applied to aqueous concentrations.
- `sysbio-1.5 → ode-1.4`: The production-degradation equation is explicitly identified as first-order linear and solved in closed form, independently of the binding-equilibrium derivation of its input function.

## Verification

`node scripts/check.mjs astro geo climate geog popgen neuro bioinf sysbio --static` passes for 363 items with zero errors and warnings. A full registry graph traversal finds no dependency cycle. Every new target is written and in a different field; all syllabus mirrors pass. A comparison of the 83 changed items confirms that all non-dependency metadata is unchanged. No browser/OCR launches were needed for this metadata-only change. Exact source/target names, files, source references and edge counts are retained in `cross-field-climate.json`.

## Independent peer revisions

The probability reviewer identified a more precise Fourier-transform target for finite-core spectra, so `climate-8.13` now uses `rca-9.1` in place of the periodic-series target `sig-4.1`. The reviewer also confirmed that the explicit branch conditioning in `climate-4.6` independently requires `stat-2.1`, bringing climate to25. Chemical-equilibrium anchors distinguish the general Gibbs condition from the target's ideal-gas special case. The infinite-sites Poisson prerequisite is supported by its explicit branch-count/uniform-event-time mutation model, not inferred from a constant mean rate alone. All mirrors, counts and graph checks were refreshed after these changes.

The exact-array peer check also found nine older syllabus mismatches among touched entries. The syllabi now reproduce the complete written dependency lists for `astro-4.12`, `geo-4.1`, `climate-1.9`, `geog-1.10`, `popgen-1.10`, `popgen-1.14`, `popgen-2.1`, `popgen-3.5` and `neuro-1.7`. This restores existing local prerequisites and replaces the stale `mathbio-5.1` syllabus link with the written `pchem-7.4` link. All 83 touched item/syllabus dependency arrays agree.
