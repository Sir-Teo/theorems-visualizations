// NEURO6: source-scoped statistics, synthetic stimuli and explicit decoder assumptions.
import * as V from './ch06.viz.js';
export default {
  collection:'neuro', chapter:6, title:'Spike trains and neural coding',
  summary:String.raw`Statistical descriptions of spikes depend on the averaging operation, observation window and conditional intensity. Synthetic Poisson and stationary renewal processes expose rates, variability, hazards and spectra; Gaussian stimuli then support reverse correlation and an explicitly fitted exponential LNP model. Declared population codes distinguish directional vectors, local information bounds and discrete Bayesian decisions. Histogram equalization and two noise mechanisms show how coding claims depend on constraints, while a modern receptive-field construction keeps the unread historical paper separate.`,
  items:[
    {
      num:"6.1",
      kind:"Concept",
      name:"Firing rate and the peri-stimulus time histogram",
      deps:[],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.2.1–7.2.2","Direct derivation for the declared synthetic model"],
      viz:V.psth,
      statement:String.raw`A firing rate can mean a count divided by observation time, a trial-averaged event density, or a population average. These averages answer different questions. For repeated, identically stimulated trials, a peri-stimulus time histogram estimates the trial-averaged rate:
$$\widehat\lambda_j={K_j\over R\,\Delta_j},$$
where $K_j$ counts all spikes across $R$ trials in bin $j$ and $\Delta_j$ is that bin’s actual duration. For intensity $\lambda(t)$,
$$\mathbb E\widehat\lambda_j={1\over\Delta_j}\int_{B_j}\lambda(t)\,dt.$$
The displayed intensity is $\lambda_0[1+m\cos(2\pi ft)]$ with $0\le m<1$.`,
      idea:String.raw`Represent each trial as a sum of point events. Integrating it over a bin counts every event, then averaging over trials estimates the integrated intensity. Dividing by duration gives a bin-average rate; it is not necessarily the instantaneous rate at the midpoint.

Larger bins reduce Poisson counting noise while averaging over more temporal structure. More repeated trials can reduce noise without widening the bin. The event sample is held fixed when only bin width changes, including when the last bin is shorter.`,
      caption:String.raw`Rebin repeated synthetic spike rasters, change trial count and modulation, and compare the observed PSTH with its known expected bin-average rate. The last bin uses its actual exposure.`,
      scope:String.raw`Independent inhomogeneous Poisson trials, two seconds each, with illustrative rates in Hz and frequency fixed at 2 Hz. No neural recordings are used. Matching a PSTH does not establish Poisson firing, independent intervals or a unique neural code. A temporal or population average cannot automatically replace a trial average.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.2",
      kind:"Model",
      name:"Poisson spike trains",
      deps:["neuro-6.1","stoch-9.3"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.2.1–7.2.2; §7.3","Direct derivation for the declared synthetic model"],
      viz:V.poisson,
      statement:String.raw`A Poisson point process has independent counts on disjoint intervals, and
$$N(B)\sim\operatorname{Poisson}(M_B),$$
$$M_B=\int_B\lambda(t)\,dt.$$
Thus count mean and variance both equal $M_B$. For constant $\lambda>0$, successive complete waiting times are independent exponential variables:
$$\Pr(\Delta>t)=e^{-\lambda t}.$$
Time-varying intensity preserves the integrated count law, but its raw interspike intervals generally are not iid exponential. At zero intensity there are no events.`,
      idea:String.raw`For a constant rate, independence makes the no-event probability multiplicative in time; its continuous solution is exponential. The sum of exponential waiting times gives the arrival process. Expanding the associated count-generating function yields $e^{-M}M^n/n!$, whose first two cumulants are both $M$.

For a varying nonnegative rate, thin a constant-rate proposal process by the instantaneous acceptance ratio. This generates event times directly and allows multiple events in any later plotting bin. Independent one-second windows here each integrate to the selected mean rate.`,
      caption:String.raw`Switch constant and modulated count intensities and compare actual count frequencies with the exact Poisson law. A separate homogeneous waiting-time sample checks the Exp(1) law after multiplying intervals by rate.`,
      scope:String.raw`The interval panel always uses independent complete intervals from a homogeneous process, even when the count panel is modulated; its sample size is fixed in advance. It does not pool only intervals that happen to fit in a short observation window. The later planned stochastic-process prerequisite is retained as a conceptual dependency, while the required count and waiting-time arguments are supplied here.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.3",
      kind:"Concept",
      name:"Fano factor and coefficient of variation",
      deps:["neuro-6.2"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.2.1; §7.3; §7.5.1–7.5.2","Direct derivation for the declared synthetic model"],
      viz:V.variability,
      statement:String.raw`Two measures describe different variability. For counts in a specified window,
$$F(T)={\operatorname{Var}N_T\over\mathbb E N_T};$$
for complete interspike intervals,
$$\mathrm{CV}={\sqrt{\operatorname{Var}\Delta}\over\mathbb E\Delta}.$$
A homogeneous Poisson process has $F(T)=1$ and CV$=1$. For a stationary renewal process with finite interval variance, $F(T)\to\mathrm{CV}^2$ as $T\to\infty$; equality need not hold in a short window.

The regular family is $\Delta=\tau+\operatorname{Gamma}(k,\gamma)$ with integer $k=4$ and $\gamma=k\lambda/(1-\lambda\tau)$. All three families share mean rate $\lambda$.`,
      idea:String.raw`A dead time and multiple exponential phases suppress very short intervals. In the regular family, mean interval is $\tau+k/\gamma=1/\lambda$ and $\mathrm{CV}^2=(1-\lambda\tau)^2/k$. The bursty family mixes exponential intervals with probabilities 0.8 and 0.2 and rates $5\lambda$ and $(0.2/0.84)\lambda$; it has the same mean and CV$^2=6.12$.

A stationary observation starts inside a length-biased interval: draw its length with density proportional to length times interval density, then choose a uniform residual fraction. This supplies the correct first waiting time. The count sample uses unbiased sample variance; the CV uses a separate fixed-size sample of complete intervals. Neither finite estimate is forced above or below one.`,
      caption:String.raw`Compare stationary Poisson, regular and hyperexponential trains at equal mean rate. Change count-window duration and compare the observed count Fano factor with a separately sampled interval CV and its theoretical long-window limit.`,
      scope:String.raw`“Bursty” is a shorthand for broad hyperexponential renewal intervals, not serially correlated bursts, adaptation or a fitted bursting neuron. Each count window is an independent stationary realization. The CV uses 600 independent intervals and the Fano estimate uses 200 windows. Zero observed mean count leaves the sample Fano factor undefined. Finite sampling and finite-window effects remain visible.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch7.S3.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.4",
      kind:"Concept",
      name:"Renewal processes, survivor function and hazard",
      deps:["neuro-6.3","stoch-11.1"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.5.1, Eqs.7.24–7.31","Direct derivation for the declared synthetic model"],
      viz:V.hazard,
      statement:String.raw`A renewal process has independent identically distributed complete intervals. If an interval has density $f(a)$, its survivor and hazard are
$$S(a)=\Pr(\Delta>a),$$
$$h(a)={f(a)\over S(a)}.$$
Where $S>0$,
$$S(a)=\exp\!\left[-\int_0^a h(u)\,du\right],$$
$$f(a)=h(a)S(a).$$
For an interval $\tau+\operatorname{Gamma}(k,\gamma)$, put $x=\gamma(a-\tau)$. Before $\tau$, $S=1$ and $f=h=0$. At and after $\tau$,
$$S=e^{-x}\sum_{j=0}^{k-1}{x^j\over j!},$$
$$f={\gamma e^{-x}x^{k-1}\over(k-1)!}.$$`,
      idea:String.raw`Condition on surviving without a spike until age $a$. The chance of a spike in the next small duration is approximately $h(a)\,da$, giving $S'=-hS$. Solving that differential equation gives survival, and differentiating survival gives the interval density.

An integer-shape Gamma interval is a sum of independent exponential phases. Its survivor is the probability that fewer than $k$ phases have completed. One phase yields a constant hazard after dead time; more phases yield an age-dependent rising hazard. This local derivation supplies the needed renewal facts while the later stochastic-process chapter remains planned.`,
      caption:String.raw`Change dead time, number of exponential phases and phase rate. Probe the survivor, density and conditional hazard at a chosen age, and distinguish the two quantities measured per second.`,
      scope:String.raw`Stationary iid renewal intervals with a deterministic dead time; no serial adaptation or nonstationary stimulus history. The hazard is conditional on no intervening spike, unlike the unconditional interval density. Age in the controls is in milliseconds; all formulas and returned rates use seconds. At a dead-time boundary, the density convention has no effect on any interval probability.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch7.S5.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.5",
      kind:"Concept",
      name:"Spike-train autocorrelation and power spectrum",
      deps:["neuro-6.2"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §7.4; §7.5.2, Eqs.7.37–7.48","Direct derivation for the declared synthetic model"],
      viz:V.spectrum,
      statement:String.raw`For a stationary spike train $S(t)=\sum_k\delta(t-t_k)$ with mean rate $\lambda$, autocorrelation includes both distinct-event pairs and the self-event term $\lambda\delta(u)$. For a stationary renewal process with interval characteristic function $\phi(\omega)$, the continuous spectrum away from DC is
$$P(\omega)=\lambda\,{1-|\phi(\omega)|^2\over|1-\phi(\omega)|^2}.$$
The separate mean-rate DC atom is omitted here. A finite segment has periodogram
$$I_T(f)={1\over T}\left|\sum_k e^{-2\pi i f t_k}\right|^2.$$
Its finite fluctuations and window effects do not disappear merely by plotting a theoretical curve.`,
      idea:String.raw`Given a spike, another spike at positive lag may be the first, second or any later renewal. Summing the convolution powers of the interval density gives the renewal pair density. Its Fourier series is geometric; adding negative lags and the self-event term yields the continuous spectrum. The low-frequency limit is $\lambda\mathrm{CV}^2$, distinct from the DC atom.

The empirical positive-lag histogram excludes self-pairs. A bin $[a,b]$ is divided by the exact lag exposure $\int_a^b(T-u)\,du$ per trial. The separate oscillatory option is an inhomogeneous Poisson process with 10 Hz modulation. Because the window contains an integer number of cycles, its Fourier-grid expectation is $\lambda+\lambda^2m^2T/4$ at 10 Hz and $\lambda$ elsewhere.`,
      caption:String.raw`Compare regular, Poisson, broad-interval and oscillatory synthetic trains. Read positive-lag pair density beside eight averaged finite periodograms, with the appropriate renewal or finite-window Poisson expectation.`,
      scope:String.raw`Eight independent synthetic trials; counts are not a recorded spike train. Positive Fourier frequencies stop at 100 Hz and exclude DC. The regular and broad-interval families begin in stationarity. Renewal theory is an infinite-window guide, whereas the oscillatory curve is the exact expectation for this finite Poisson window. Pair density has units 1/s²; periodogram power has units spikes²/s. Short lags and spectral peaks depend on the chosen family, rather than a universal refractory-spectrum sign rule.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch7.S5.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.6",
      kind:"Concept",
      name:"Tuning curves",
      deps:["neuro-6.1"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §12.1.1; §7.2","Direct derivation for the declared synthetic model"],
      viz:V.tuning,
      statement:String.raw`A tuning curve specifies a mean response as a function of stimulus. This declared orientation model is
$$\lambda(\theta)=b+A e^{g(\theta)},$$
$$g(\theta)=\kappa[\cos 2(\theta-\theta_0)-1],$$
with $b>0$, $A,\kappa\ge0$ and angles interpreted consistently. It is periodic after 180°, so it codes orientation rather than a unique direction.

Independent Poisson observations of duration $T$ have mean count $T\lambda(\theta)$ and count variance of the same value. Averaging $R$ trials estimates rate with standard deviation $\sqrt{\lambda(\theta)/(RT)}$.`,
      idea:String.raw`An oriented receptive field responds differently as a grating rotates. The doubled angle in the chosen curve identifies orientations separated by a half-turn; the exponential keeps the tuned contribution nonnegative.

The displayed counts are actually sampled at thirteen orientations. Their error bars use the known model standard deviation of the estimated mean rate, while the continuous curve is the known generating rate. These are different objects and are not adjusted to coincide. A separate probe raster shows how equal expected rates still generate different finite trials.`,
      caption:String.raw`Rotate the preferred and probe orientations, adjust baseline, amplitude and sharpness, and compare the known tuning curve with actual sample means, one-standard-deviation bars and independent probe rasters.`,
      scope:String.raw`A synthetic smooth curve, not a fit to a V1 neuron or an original receptive-field measurement. The tuning trials last 0.25 s; probe rasters last 1 s. The bars are model standard deviations of the mean-rate estimator, not confidence intervals. Correlated counts, adaptation, stimulus uncertainty and direction selectivity are absent.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch12.S1.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.7",
      kind:"Method",
      name:"Spike-triggered average and reverse correlation",
      deps:["neuro-6.2"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §11.2.1, Eq.11.6 and reverse-correlation discussion","Direct derivation for the declared synthetic model"],
      viz:V.sta,
      statement:String.raw`The spike-triggered average weights each preceding stimulus vector by its full count:
$$\widehat{\mathrm{STA}}={\sum_t n_t(X_t-\bar X)\over\sum_t n_t}.$$
Here $X_t$ contains the current and seven past scalar stimuli. A zero spike total makes this estimate undefined.

For zero-mean Gaussian vectors with covariance $\Sigma$ and specified exponential LNP intensity $\lambda(X)=b e^{w^TX}$, the population spike-weighted mean is exactly
$$\mathrm{STA}=\Sigma w.$$
Thus whiteness, or an appropriate covariance correction, matters to filter recovery.`,
      idea:String.raw`Gaussian integration by parts gives $\mathbb E[X e^{w^TX}]=\Sigma w\,\mathbb E[e^{w^TX}]$. Poisson weighting multiplies by exposure and baseline in numerator and denominator, which cancel. White covariance gives the filter itself; colored covariance generally changes its direction.

A finite sample estimates its own mean and covariance, so it need not reproduce that identity exactly. The correction solves $(\widehat\Sigma+0.01I)\widehat w=\widehat{\mathrm{STA}}$. The ridge stabilizes inversion and introduces bias. Neither radial symmetry nor “reverse correlation” makes every nonlinearity or multiple-filter model recoverable by a single STA.`,
      caption:String.raw`Compare white and correlated Gaussian stimuli. Observe the raw sample STA, the exact population covariance prediction, the true filter and a regularized sample covariance correction as sample size changes.`,
      scope:String.raw`Own synthetic stationary AR(1) Gaussian stimulus with unit marginal variance and eight lag features; independent Poisson counts conditioned on that stimulus. All counts, including multiple spikes in a bin, enter the average. Population STA denotes an intensity-weighted expectation; the finite ratio estimate is not declared exactly unbiased. No biological linear filter or arbitrary static nonlinearity is recovered.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch11.S2.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.8",
      kind:"Model",
      name:"Linear–nonlinear–Poisson model",
      deps:["neuro-6.7"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §10.1.2; §10.2.1–10.2.2; §10.3 introduction; §11.2.1","Direct derivation for the declared synthetic model"],
      viz:V.lnp,
      statement:String.raw`A linear–nonlinear–Poisson model projects a stimulus through a filter, applies a specified nonnegative nonlinearity, then draws counts. Here the nonlinearity is exponential:
$$n_t\mid X_t\sim\operatorname{Poisson}(E e^{\beta_0+w^TX_t}).$$
The filter and intercept minimize the penalized negative log likelihood, up to parameter-independent constants:
$$L(\beta)=\sum_t\{E e^{x_t^T\beta}-n_t x_t^T\beta\}$$
$$\qquad+{\alpha\over2}\|\beta\|^2,\quad x_t=(1,X_t).$$
A positive penalty applies to all nine coefficients, including the intercept.`,
      idea:String.raw`The gradient is $\sum_t(\mu_t-n_t)x_t+\alpha\beta$ and the Hessian is $\sum_t\mu_t x_tx_t^T+\alpha I$. With $\alpha>0$, the objective is strictly convex. Newton steps with a decreasing-objective line search find its unique finite minimum; a small initialization pseudocount is not added to the fitted observations.

Fit 512 training bins, then predict a separate 256-bin stimulus/count sample. Known generating rates let us calculate a held-out rate RMSE as well as display actual counts divided by exposure. The visualization averages eight test bins per plotted block but computes RMSE before averaging. The specified nonlinearity is not estimated as an unknown function.`,
      caption:String.raw`Fit the eight-lag filter and intercept from actual synthetic Poisson counts. Change stimulus correlation, data exposure and regularization, and compare the fitted filter and independent held-out predictions with known truth.`,
      scope:String.raw`An explicitly penalized exponential LNP fit, not unrestricted maximum likelihood, a fitted arbitrary nonlinearity or a history-dependent point-process GLM. Each repeat adds 20 ms of exposure per stimulus bin. Stimulus and count streams, and training and test streams, are distinct. Intensities are not clipped, and bins may contain multiple events. Finite fits are not forced to improve every test realization.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch10.S2.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.9",
      kind:"Model",
      name:"Receptive fields: Gabor and difference-of-Gaussians",
      deps:["neuro-6.6","rca-8.13"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §11.2.1; written RCA8.13 and PSYCH4.6","Direct derivation for the declared synthetic model"],
      viz:V.receptive,
      statement:String.raw`A receptive-field model can assign signed spatial weights to stimulus contrast. Two declared examples are a Gaussian-windowed cosine (Gabor) and a difference of Gaussian center and surround profiles.

The response used here is an inner product at each image position:
$$R(x)=\sum_u K(u)I(x+u).$$
This is cross-correlation. In the convolution convention of RCA8.13, the kernel must be reflected. For a grating $I(x)=\cos(k\cdot x+\phi)$,
$$R(x)=A\cos(k\cdot x+\phi)$$
$$\qquad+B\sin(k\cdot x+\phi),$$
where $A=\sum K(u)\cos(k\cdot u)$ and $B=-\sum K(u)\sin(k\cdot u)$.`,
      idea:String.raw`Expand the cosine of the summed phase. Collecting the coefficients gives an exact finite-grid Fourier calculation, rather than approximating the response by visually similar stripes.

The 41×41 grid spans −2 to 2. The Gabor carrier has frequency 0.8 cycles per spatial unit along the horizontal axis. The DoG first normalizes its two discrete Gaussians separately, with surround width twice the center width and weight 0.8. Optional mean subtraction removes discrete DC. A final normalization makes the sum of absolute weights one. These choices determine amplitude and response to a uniform stimulus.`,
      caption:String.raw`Choose Gabor or center–surround weights, change a synthetic grating’s orientation, phase and spatial frequency, and inspect the actual cross-correlation map and numerical response coefficients.`,
      scope:String.raw`Own grating and finite-grid kernels, not natural-image filtering, an empirical receptive-field fit or a reproduction of historical images. The two heatmaps each use a symmetric color scale; their amplitudes are reported numerically. Width and discrete DC normalization are declared. A balanced response to a uniform grating vanishes up to floating-point summation, rather than defining an exact biological zero.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch11.S2.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.10",
      kind:"Method",
      name:"Population-vector decoding",
      deps:["neuro-6.6"],
      refs:["Direct cosine expansion and sums of roots of unity; Poisson count model derived in NEURO6.2"],
      viz:V.population,
      statement:String.raw`For uniformly spaced preferred directions $\phi_i$, independent Poisson counts with
$$\lambda_i(\theta)=r_0[1+m\cos(\theta-\phi_i)]$$
can be combined into a population vector
$$V=\sum_i n_i(\cos\phi_i,\sin\phi_i).$$
For $N\ge3$ uniformly spaced cells and common count duration $T$,
$$\mathbb EV={Tr_0mN\over2}(\cos\theta,\sin\theta).$$
Its angle estimates direction when the realized vector is nonzero. A zero vector has no direction.`,
      idea:String.raw`Sums of the first and second nonconstant roots of unity vanish for this uniform population. Expand the cosine tuning term against each preferred-direction vector: the equal baseline cancels and the desired first harmonic remains.

Centering all count weights by their sample mean leaves that ideal uniform vector unchanged, while making an all-equal count vector exactly zero in arithmetic. A cancellation close to numerical resolution is labeled unresolved. For the comparison plot, the sample vector is divided by total observed count and the expected vector by expected total count; the readout retains unnormalized components.`,
      caption:String.raw`Change population size, stimulus direction, tuning depth and observation duration. Compare each cell’s actual count with its mean, then compare the realized vector, expected vector and true direction.`,
      scope:String.raw`Independent synthetic cosine-tuned directional neurons with uniformly spaced preferences and a positive baseline; not motor-cortex recordings. More neurons increase expected total spike budget here. Finite circular error need not decrease in every realization, and the formula does not establish optimality or performance with uneven coverage, correlated noise or an equal-budget comparison. Zero or unresolved vector angles remain undefined.`,
      links:{"statistics":"https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.11",
      kind:"Theorem",
      name:"Fisher information and the Cramér–Rao bound for population codes",
      deps:["neuro-6.6","stat-4.4"],
      refs:["Actual written STAT4.4, including biased/local mean-derivative bound and score regularity","Direct score and information calculation for the declared independent Poisson population"],
      viz:V.fisher,
      statement:String.raw`For independent Poisson counts of duration $T$, with differentiable positive rates $\lambda_i(s)$ for a real stimulus $s$, Fisher information is
$$I(s)=T\sum_i{[\lambda_i'(s)]^2\over\lambda_i(s)}.$$
Under the regularity conditions of STAT4.4, an unbiased estimator has variance at least $1/I(s)$. More locally, if an estimator has mean $m(s)$, the bound is $[m'(s)]^2/I(s)$; local unbiasedness needs $m'(s)=1$.

This is a regular real-parameter variance statement. It is not a universal bound on circular error, a biased MAP decoder or a finite Monte Carlo sample variance.`,
      idea:String.raw`Differentiate the Poisson log likelihood. The score is $U(s)=\sum_i[n_i-T\lambda_i(s)]\lambda_i'(s)/\lambda_i(s)$. Its mean is zero and its variance is $I(s)$ because counts are independent.

At a known calibration point $s_0$, define $\widehat s=s_0+U(s_0)/I(s_0)$. Its mean equals $s_0$, its mean derivative there is one, and its exact variance there is $1/I(s_0)$. This demonstrates local efficiency without pretending the estimator can use unknown ground truth. Gaussian tuning with positive baseline supplies the displayed rates. If all slopes vanish, $I=0$ and the calibrated estimator is undefined.`,
      caption:String.raw`Move a calibration point through a real-valued Gaussian tuning population and compare its information with actual repeated score-estimator errors. Vary width, population and exposure, including a single cell at its tuning peak.`,
      scope:String.raw`Known calibration stimulus and known positive baseline of 2 Hz. This locally calibrated statistic is not an operational unknown-stimulus decoder, nor a globally unbiased estimator throughout the plotted domain. Estimates are allowed outside [−1,1]. The histogram standardizes errors by square-root information without assuming they are Gaussian. A finite sample variance can fall below the theoretical bound through sampling noise. Independent Poisson noise is essential to this information formula.`,
      links:{"countModel":"https://neuronaldynamics.epfl.ch/online/Ch7.S2.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.12",
      kind:"Method",
      name:"Maximum a posteriori decoding",
      deps:["neuro-6.10"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §11.3.1; §10.2.1","Direct derivation for the declared synthetic model"],
      viz:V.map,
      statement:String.raw`A maximum a posteriori decoder combines a response likelihood with a stimulus prior:
$$p(\theta\mid n)\propto p(n\mid\theta)p(\theta).$$
For the eight displayed direction hypotheses, conditionally independent Poisson counts give a log score, up to constants independent of $\theta$,
$$\ell(\theta)=\sum_i[n_i\log(T\lambda_i(\theta))$$
$$\qquad-T\lambda_i(\theta)]+\kappa\cos(\theta-\mu).$$
The posterior is the softmax of these eight scores. Every maximizing hypothesis is a MAP mode. Under this discrete model, MAP minimizes posterior zero-one loss.`,
      idea:String.raw`Bayes’ rule reweights the likelihood by prior probability, then normalizes the eight possibilities. Subtracting the largest log score before exponentiating prevents overflow without changing their relative probabilities.

The population deliberately has uneven preferred directions and heterogeneous baselines. Both affect the no-spike likelihood term as well as the spike-weighted term. A naive population vector ignores these likelihood and prior details; there is no guarantee that a posterior mode beats it in angular error on every trial. Equal or numerically inseparable scores produce a set of reported modes rather than an arbitrary invented unique angle.`,
      caption:String.raw`Decode an actual synthetic population count sample over eight directions. Adjust uneven coverage, tuning, prior and exposure, and inspect all posterior modes beside the naive vector angle.`,
      scope:String.raw`A finite eight-hypothesis model, not a continuous posterior optimization. True direction is chosen from the same grid. Preferences shift by a sinusoidal skew; baseline rates vary by a fixed cosine across cells. Counts are independent conditioned on direction. Ties are reported within numerical score resolution. MAP optimality refers to posterior zero-one loss under the specified likelihood and prior, not general angular MSE or biological decoding.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch11.S3.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.13",
      kind:"Concept",
      name:"Efficient coding and histogram equalization (Laughlin)",
      deps:["neuro-6.6","info-2.5"],
      refs:["Simoncelli & Olshausen (2001), Natural Image Statistics and Neural Representation, Annual Review of Neuroscience24:1193–1216, selected pp.1195–1196 and1200","Actual written INFO2.5, information nonnegativity; direct probability-integral-transform and entropy argument"],
      viz:V.equalize,
      statement:String.raw`For a continuous scalar stimulus with cumulative distribution $F$, the response
$$r=F(s)$$
is uniform on [0,1]. This probability-integral transform is the basis of histogram equalization. Uniform output maximizes differential entropy subject to this fixed bounded response range.

A coding-optimality claim needs additional assumptions. With weak stimulus-independent additive output noise, maximizing output entropy can approximately maximize mutual information. A noiseless invertible recoding preserves information and does not become better merely by having a flatter histogram.`,
      idea:String.raw`Monotonicity gives $\Pr(F(s)\le r)=r$ for a continuous distribution, using a generalized inverse if needed. The entropy maximum follows from nonnegativity of relative entropy to the uniform density. For $y=F(s)+\varepsilon$ with independent additive noise, conditional entropy is that of the noise; a small-noise approximation motivates maximizing the bounded noiseless response entropy, subject to boundary effects.

The example samples its own Beta distribution with integer shape parameters by ratios of independent Erlang sums. Its CDF is calculated by an exact binomial-tail identity. Finite output bins are actual sample frequencies, so they fluctuate around uniformity. The reviewed modern source discusses the constraints and noise limitations, and reports Laughlin’s historical interpretation secondhand.`,
      caption:String.raw`Change the synthetic Beta stimulus distribution and sample size. Follow its density through the monotone CDF response and compare the actual transformed histogram with the uniform reference.`,
      scope:String.raw`Synthetic scalar inputs and a bounded monotone response, not original fly contrast measurements or an empirical validation of Laughlin’s curve. The original 1981 paper body was not consulted. The source is a distinct 2001 review read in selected sections. Strong/input-dependent noise, response costs and multi-neuron dependencies change the optimization problem; histogram equalization alone is not a universal efficient code.`,
      links:{"review":"https://www.cns.nyu.edu/pub/lcv/simoncelli01-reprint.pdf","doi":"https://doi.org/10.1146/annurev.neuro.24.1.1193"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.14",
      kind:"Theorem",
      name:"Time-rescaling theorem for spike trains",
      deps:["neuro-6.4"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §10.3.3, Eqs.10.42–10.45; §7.5.1","Direct derivation for the declared synthetic model"],
      viz:V.rescale,
      statement:String.raw`Let a simple, nonexplosive point process have its correct predictable conditional intensity $\lambda(t\mid\mathcal H_t)$ and a continuous integrated hazard. Assume successive event hazards are proper, so each next event eventually occurs. Then completed integrated intervals
$$z_k=\int_{t_{k-1}}^{t_k}\lambda(u\mid\mathcal H_u)\,du$$
are independent Exp(1), conditional on the initial history. Consequently
$$u_k=1-e^{-z_k}$$
are independent uniform variables on [0,1]. A wrong conditional intensity need not have either property.`,
      idea:String.raw`Conditional survival to the next event is the exponential of minus integrated hazard. Changing the time variable from physical age to that accumulated hazard therefore removes the conditional survival dependence. Repeating with each updated history gives independent unit exponential innovations.

The illustration uses shifted exponential intervals $\Delta=\tau+E/\gamma$. The correct hazard is zero during dead time and $\gamma$ thereafter, hence $z=\gamma(\Delta-\tau)=E$. A wrong prespecified constant rate with the same mean instead gives $z=\gamma\Delta/(1+\gamma\tau)$. Comparing CDFs tests marginal uniformity; a separate serial plot helps reveal dependence. Neither finite plot proves the theorem.`,
      caption:String.raw`Compare the correct renewal hazard with a wrong constant mean rate on the same complete intervals. Inspect the uniform CDF diagnostic, nominal KS band and consecutive-interval scatter separately.`,
      scope:String.raw`Observe until a fixed number of complete intervals has occurred, with no censored terminal gap. Parameters are specified before this validation sample. The band 1.36/√N is an asymptotic nominal 95% iid fixed-model reference, not a universal fitted-model p-value or a proof of independence. At zero dead time, the two specified hazards coincide and correctly give the same result.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch10.S3.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.15",
      kind:"Model",
      name:"Escape noise and the noisy integrate-and-fire neuron",
      deps:["neuro-5.1","neuro-6.4"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §9.1.1–9.1.2; §9.4.1","Direct derivation for the declared synthetic model"],
      viz:V.noise,
      statement:String.raw`Noise can enter spike generation through different mechanisms. An escape model follows deterministic subthreshold voltage but fires with conditional hazard
$$\rho(U)=\rho_0 e^{(U-\vartheta)/\Delta}.$$
Here $\Delta>0$.
The hazard is not itself a probability and can exceed one per second.

A diffusive leaky model instead has stochastic subthreshold voltage:
$$\begin{aligned}dU&={(I-U)\over\tau_m}dt\\
&\quad+\sigma\sqrt{2/\tau_m}\,dW_t.\end{aligned}$$
It records a spike on threshold crossing and resets. Matching these mechanisms requires explicit conditions or fitting; they are not interchangeable by definition.`,
      idea:String.raw`Between escape events, the free leaky arc from reset zero is $U(a)=I(1-e^{-a/\tau_m})$. Put $M=\max(I,0)$. Its hazard is bounded by
$$\bar\rho=\rho_0 e^{(M-\vartheta)/\Delta}.$$
Thinning a constant-rate proposal process samples escape events without a one-spike-per-bin approximation. Refractoriness holds voltage at reset before the next free arc.

An OU substep of duration $h$ has conditional mean $I+(U-I)e^{-h/\tau_m}$ and variance $\sigma^2(1-e^{-2h/\tau_m})$. With positive noise, the diffusion option samples that transition exactly, but checks threshold only at substep endpoints. At zero noise, exact deterministic threshold times replace the stochastic stepping calculation, preserving a finite crossing even just above rheobase. Exact transitions do not make that first-passage calculation exact; a continuous path can cross and return within a step.`,
      caption:String.raw`Switch escape and diffusive voltage noise, alter drive and noise parameters, and compare the actual voltage trace, raster, finite-run rate and completed-interval variability.`,
      scope:String.raw`Normalized reset 0 and threshold 1, membrane time 20 ms, refractory hold 2 ms, escape scale 50 Hz, two-second observations. With positive noise the diffusion step is0.05 ms; endpoint threshold detection misses bridges and requires refinement for accurate first-passage statistics. Escape and diffusion parameters have different meanings and are not fitted to match distributions. Completed intervals from this finite observation are descriptive and potentially censored by the window; their sample CV is not an unbiased population estimate. No action-potential waveform or biological recording is computed.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch9.S1.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.16",
      kind:"Phenomenon",
      name:"Stochastic resonance",
      deps:["neuro-6.15"],
      refs:["Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition §9.4.2; direct binary-threshold information calculation","Direct derivation for the declared synthetic model"],
      viz:V.resonance,
      statement:String.raw`Stochastic resonance describes cases where adding noise improves a chosen signal-transmission measure over some range. It is not a general benefit of noise.

Here a binary input is $s=\pm A$ with equal probabilities and $0<A<1$. A memoryless detector outputs $y=1$ when $s+\sigma Z>1$, with independent standard Gaussian $Z$. Then
$$p_\pm=\Pr(y=1\mid s=\pm A)$$
$$\qquad=\Phi\!\left({\pm A-1\over\sigma}\right),$$
and information per sample is
$$I=H_b\!\left({p_++p_-\over2}\right)$$
$$\qquad-{H_b(p_+)+H_b(p_-)\over2}.$$
For a nonzero subthreshold signal, information is zero at zero noise, positive at finite interior noise, and tends to zero as noise becomes arbitrarily large.`,
      idea:String.raw`Without noise, neither input crosses threshold, so the output cannot distinguish them. At finite noise, positive input has a larger detection probability than negative input and the output carries information. With extremely strong noise, both detection probabilities approach one half and become indistinguishable.

The mutual-information expression follows directly from binary output entropy minus conditional entropy. The implementation evaluates the equivalent average conditional-to-marginal relative entropy to reduce entropy cancellation. Gaussian tails below binary64 probability range retain a log-information status instead of claiming mathematical zero. The observed detector events are actually sampled and are not edited to produce a visually favorable peak.`,
      caption:String.raw`Change subthreshold amplitude and noise. Compare the analytic information curve with actual detector events for a periodic binary signal, including zero signal and zero-noise endpoints.`,
      scope:String.raw`A declared memoryless Gaussian threshold detector, not the textbook’s integrate-and-fire SNR curve or an original neuronal experiment. Equal time spent at each input level supplies the displayed per-sample prior. Noise is independent across samples; the raster does not establish a measured information rate. The plotted noise range is finite, while the large-noise limit is an analytic statement. Subnormal probability and information limits are disclosed.`,
      links:{"book":"https://neuronaldynamics.epfl.ch/online/Ch9.S4.html"},
      tags:["spike trains","neural coding"]
    },
    {
      num:"6.17",
      kind:"Paper",
      name:"Receptive Fields and Functional Architecture in Cat Cortex",
      deps:["neuro-6.6","psych-4.6"],
      paper:{"authors":"D. H. Hubel and T. N. Wiesel","year":1962,"title":"Receptive fields, binocular interaction and functional architecture in the cat’s visual cortex","venue":"Journal of Physiology 160 (1): 106–154","doi":"10.1113/jphysiol.1962.sp006837"},
      introduces:[],
      refs:["Hubel & Wiesel (1962), archive index and bibliographic record only; full body blocked by explicit access challenge","Gerstner, Kistler, Naud & Paninski (2014), Neuronal Dynamics, official online corrected edition selected §12.1.1 receptive-field and column discussion, and §11.2.1 LNP discussion; original reprinted figures not used","Direct normalized Gaussian Fourier and even–odd quadrature calculation"],
      viz:V.cortex,
      statement:String.raw`Hubel and Wiesel’s 1962 paper is a historical reference for receptive fields and cortical functional organization. The verified archive record fixes its authors, title, venue and DOI; its original body could not be read in this session.

The interactive example is a separate modern construction. Take an even Gaussian–Gabor field and its odd quadrature partner. For a whole-plane cosine grating, let
$$H(q)=e^{-\sigma_x^2\|q\|^2/2},$$
$$a={H(k-k_0)+H(k+k_0)\over2},$$
$$b={H(k-k_0)-H(k+k_0)\over2},$$
$$R_c=ca\cos\phi,$$
$$R_s=-cb\sin\phi.$$
A simple response rectifies $R_c$; a complex-style response uses $\sqrt{R_c^2+R_s^2}$.`,
      idea:String.raw`The Fourier transform of a normalized Gaussian is Gaussian. Multiplying it by cosine or sine shifts that transform to the two opposite carrier frequencies, giving the displayed analytic grating responses.

Quadrature energy suppresses phase sensitivity when one opposite Fourier lobe is negligible and the two quadrature gains nearly match. A finite-width Gabor does not have perfectly equal gains at every frequency, so phase invariance is approximate. Rectification remains strongly phase selective. Illustrative rates add a 3 Hz baseline and multiply either response by 60 Hz. Actual independent Poisson events are generated at those rates.`,
      caption:String.raw`Rotate and phase-shift a synthetic grating. Compare a declared even receptive field, simple and quadrature-energy phase responses, and independent synthetic spike rasters, with the original-source limitation visible.`,
      scope:String.raw`No original cat recording, electrode track, figure or fitted receptive field is reproduced. Only the original archive’s bibliography was checked before its linked PDF returned a proof-of-work/cookie access challenge; no challenge execution or alternate original-body recovery followed. Distinct modern textbook text and a direct Gaussian Fourier calculation support this authored illustration. The displayed RF is a finite view of the whole-plane analytical model. Original-paper body verification remains flagged.`,
      links:{"record":"https://pmc.ncbi.nlm.nih.gov/articles/PMC1359523/","doi":"https://doi.org/10.1113/jphysiol.1962.sp006837","modern":"https://neuronaldynamics.epfl.ch/online/Ch12.S1.html"},
      tags:["spike trains","neural coding"],
      verify:true
    },
  ],
};
