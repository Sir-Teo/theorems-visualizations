import * as U from './ch07.ui.shared.js';
export default {collection:'deep',chapter:7,items:[
{num:'7.6',kind:'Method',name:'Random features (random Fourier features)',
statement:String.raw`For the Gaussian kernel $k(x,y)=e^{-(x-y)^2/(2\ell^2)}$, draw independent $\omega_j\sim N(0,\ell^{-2})$ and use D sine/cosine pairs:
$$z_j(x)=(\cos\omega_jx,\sin\omega_jx),$$
and let z concatenate the D pairs and divide by $\sqrt D$.
The finite kernel is positive semidefinite, has diagonal one and satisfies
$$\widehat k(x,y)=z(x)^Tz(y),$$
$$\widehat k(x,y)=D^{-1}\sum_j\cos(\omega_j\delta),$$
where $\delta=x-y$, and
$$\mathbb E\widehat k(x,y)=k(x,y).$$
For $q=(x-y)^2/\ell^2$, its exact fixed-pair variance is
$$\operatorname{Var}(\widehat k)=\frac{(1-e^{-q})^2}{2D}.$$
Thus fixed-pair RMS error scales as $D^{-1/2}$. This does not make each realized error, or each grid maximum, decrease monotonically.`,
idea:String.raw`The inner product of one sine/cosine pair is the cosine of the input difference. The real part of a normal characteristic function gives its expectation. Square the cosine using $\cos^2 u=(1+\cos 2u)/2$; subtract the squared expectation and divide by D for an average of independent frequencies. A finite feature Gram matrix is positive semidefinite by its squared-norm quadratic form. Averaging the variance formula over a fixed grid gives the exact expected grid MSE, even though errors at different grid pairs are dependent. More general shift-invariant positive kernels use their own spectral probability measures; the Gaussian case here needs no guessed Fourier normalization.`,
caption:String.raw`Approximate the Gaussian kernel with actual nested frequency samples. Compare realized grid RMSE and maximum error with the square root of expected grid MSE. Change length scale and seed to see that random error paths can rise.`,
scope:String.raw`D means independent frequencies and 2D real features. The prediction for a fixed grid is an RMS quantity, not an expected maximum, uniform guarantee or confidence envelope. The example is not a trained neural tangent kernel. Frequency samples come from the stated normal probability law.`,
deps:['stat-1.19','prob-2.2.3'],see:['fa-11.33','rca-9.1'],refs:['Rahimi–Recht 2007, §3 sine/cosine feature construction; exact Gaussian variance supplied here'],links:{source:'https://proceedings.neurips.cc/paper_files/paper/2007/file/013a006f03dbc5392effeb8f18fda755-Paper.pdf'},tags:['random features','kernel approximation'],viz:U.randomFeatures},
{num:'7.7',kind:'Phenomenon',name:'Spectral bias toward low frequencies',
statement:String.raw`Kernel flow learns eigenfunctions at rates set by their eigenvalues. On the circle with uniform measure $dx/(2\pi)$, consider
$$K(x,z)=2\sum_r\lambda_r\cos(r\delta),$$
where $\delta=x-z$ and $r\in\{1,3,7\}$,
with positive $\lambda_r$. This is a positive-semidefinite translation-invariant kernel. From zero initialization, a target $g(x)=\sum_ra_r\sin(rx)$ is learned as
$$b_r(t)=1-e^{-\lambda_rt},$$
$$f_t(x)=\sum_ra_rb_r(t)\sin(rx).$$
If low frequencies have larger eigenvalues, their relative errors decay faster. Reversing the eigenvalue order reverses the learning order: a low-frequency preference is conditional on the spectrum, not a universal property of kernels or networks.`,
idea:String.raw`Expand $\cos(r(x-z))$ into cosine and sine products. Orthogonality under uniform measure makes each sine and cosine a kernel-operator eigenfunction with eigenvalue $\lambda_r$; the factor 2 cancels their squared norm 1/2. Project $\dot f=K(g-f)$ onto each mode and solve the scalar ODE, as in the finite Gram calculation of 7.5. The exact integrated squared error is $\tfrac12\sum_ra_r^2e^{-2\lambda_rt}$. Frequencies outside the kernel's supported set have eigenvalue zero and cannot be learned by this flow.`,
caption:String.raw`Fit a three-frequency target with an exact periodic kernel flow. Reverse the spectrum and watch which relative amplitude rises first; compare the learned function and exact integrated error.`,
scope:String.raw`An explicit population-kernel example with uniform circular inputs, not an empirical claim that every neural-network training run learns Fourier modes in this order. On irregular finite data, Gram eigenvectors generally are not Fourier modes. The supplied amplitudes are 1, 0.5 and 0.35, so absolute and relative error are distinct.`,
deps:['deep-7.5'],refs:['Jacot–Gabriel–Hongler 2018, §5 kernel eigenmode rates; periodic counterexample supplied here'],links:{source:'https://proceedings.neurips.cc/paper/2018/file/5a4be1fa34e62bb8a6ec6b91d2462f5a-Paper.pdf'},tags:['spectral bias','kernel eigenvalues'],viz:U.spectral},
{num:'7.8',kind:'Concept',name:'Lazy versus feature learning',
statement:String.raw`Laziness describes closeness to a model's initial linearization during training; feature learning allows that linearization to change appreciably. Width alone does not decide the regime. One way to isolate scale is a smooth model h centered at its initial parameters:
$$F_\alpha(\theta)=\alpha[h(\theta)-h(\theta_0)].$$
Train with loss $R(F_\alpha)/\alpha^2$. The parameter flow is
$$\dot\theta=-\alpha^{-1}Dh(\theta)^T\nabla R(F_\alpha),$$
whereas its prediction flow uses the kernel $Dh(\theta)Dh(\theta)^T$. For large alpha and bounded residuals on a fixed finite time interval, parameter changes become small and the fixed linearization becomes accurate under local smoothness bounds. Appreciable feature movement does not by itself guarantee better prediction.`,
idea:String.raw`Differentiate the scaled objective: one alpha comes from the prediction derivative and two from the objective denominator. This leaves an inverse-alpha factor in the parameter velocity. Multiplying back by the prediction derivative cancels that factor, so the initial prediction kernel and time scale are unchanged. Taylor-expand h along the parameter displacement. If the displacement is of order $1/\alpha$ and second derivatives stay bounded nearby, multiplying the quadratic remainder by alpha gives a prediction error of order $1/\alpha$. Comparing the nonlinear and linearized flows adds a Grönwall stability factor on a fixed horizon. Centering ensures the initial prediction is zero for every alpha, rather than secretly changing the initial residual with alpha.`,
caption:String.raw`Keep width 32 fixed and change alpha. Train the centered nonlinear model and compare it with the same frozen-kernel flow; the second panel tracks each hidden input weight and bias from initialization. Edit labels to change what is being learned.`,
scope:String.raw`The simulation optimizes the explicitly scaled objective with full-batch numerical gradient flow. It does not compare unadjusted learning rates or silently change training time. The local large-alpha explanation is not a convergence guarantee for arbitrary unbounded objectives or an assertion that all feature-learning regimes are better.`,
deps:['deep-7.4','pma-5.15'],refs:['Chizat–Oyallon–Bach 2019, Assumption 2.1 and Theorems 2.2–2.3; centered sine experiment supplied here'],links:{source:'https://proceedings.neurips.cc/paper_files/paper/2019/file/ae614c557843b1df326cb29c57225459-Paper.pdf'},tags:['lazy training','feature learning'],viz:U.feature},
{num:'7.9',kind:'Theorem',name:'Mean-field limit of two-layer networks',
statement:String.raw`Here is a bounded-feature version. Fix finite data with $|x_i|\le B$, $|y_i|\le Y$, and put $\phi(a,w;x)=\sin(a)\sin(wx)$. A probability measure $\rho$ on neuron parameters predicts
$$f_\rho(x)=\int\phi(\theta;x)\,d\rho(\theta).$$
Define the velocity
$$r_i(\rho)=f_\rho(x_i)-y_i,$$
$$g_i(\theta)=\nabla_\theta\phi(\theta;x_i),$$
$$V(\theta,\rho)=-n^{-1}\sum_i r_i(\rho)g_i(\theta).$$
The mean-field equation is the continuity equation $\partial_t\rho+\nabla\cdot(\rho V)=0$, interpreted weakly. Empirical measures of particles satisfying $\dot\theta_j=V(\theta_j,\rho_m)$ solve it exactly. For initial measures with finite first moments, its characteristic solution is unique and obeys
$$W_1(\rho_t,\nu_t)\le e^{Ct}W_1(\rho_0,\nu_0),$$
where $C=(2+Y)(1+B^2)$ and $W_1$ is the infimum of expected Euclidean distance over couplings. Consequently, empirical initial measures converging in $W_1$ give uniformly convergent measure solutions on every fixed finite horizon.`,
idea:String.raw`The feature is bounded by 1. Its parameter gradient has norm at most $G=\sqrt{1+B^2}$ and its Hessian norm at most $H=1+B^2$. Therefore $|V|\le(1+Y)G$. The velocity is Lipschitz in its parameter with constant $(1+Y)H$, and in its measure with constant $G^2$ in $W_1$: couple two measures and use the G-Lipschitz feature to bound their prediction difference.

Transport any initial coupling along the two characteristic flows. Its mean distance D satisfies $D(t)\le D(0)+C\int_0^tD(s)\,ds$. Grönwall and the infimum over initial couplings give the inequality. Existence follows by a fixed point on short-time measure paths: a proposed path defines a globally Lipschitz characteristic ODE, whose pushforward map is a contraction on a sufficiently short interval. Bounded velocity permits repeating this construction for every finite horizon; the same inequality gives uniqueness in this class.

For a smooth compactly supported test function q, the time derivative of its particle average is the average of $\nabla q\cdot V$. This is exactly the weak equation. For risk equal to mean squared residual divided by two, the gradient of one particle contains a factor $1/m$, so this ODE is m times ordinary gradient flow of the finite-network risk. Prediction differences on bounded input sets are at most G times the measure distance. Iid samples of the displayed compactly supported initial law converge in probability in $W_1$: partition its compact support into small cells, apply the law of large numbers to cell masses, and then shrink the cells.`,
caption:String.raw`Train actual particles and compare their average prediction with a 512-particle numerical run from the same nested initial sample. Track positions, edit labels and vary width/time. The comparison is finite; the particles remain atoms.`,
scope:String.raw`This self-contained deterministic full-batch theorem uses a bounded smooth feature family. It is a special model, not the full SGD approximation theorem of Mei et al., not a density-smoothness claim and not a global-optimization result. Both displayed systems use RK4 with separate time-discretization error. Without biases this particular sine feature family is odd in x and cannot fit the even part of the supplied target.`,
deps:['deep-7.8','ode-2.4','ode-2.5','prob-2.2.3'],refs:['Mei–Misiakiewicz–Montanari 2019, §§1–2 and Theorem 1 for context; bounded-feature deterministic coupling theorem proved here'],links:{source:'https://proceedings.mlr.press/v99/mei19a/mei19a.pdf'},tags:['mean field','particle dynamics'],viz:U.meanfield},
{num:'7.10',kind:'Concept',name:'Maximal-update parametrization and transfer',
statement:String.raw`Maximal-update parametrization (μP) specifies initialization and optimizer scaling so that useful feature updates can persist as widths change. It provides a basis for transferring selected hyperparameters from smaller models to larger ones; identical finite-width optima are not guaranteed.

For the displayed scalar-input, scalar-output network
$$f(x)=\sum_{j=1}^m v_j\tanh(w_jx),$$
the SGD rules from the μP table give independent centered normal initialization with
$$\operatorname{Var}(w_j)=1,$$
$$\operatorname{Var}(v_j)=m^{-2},$$
and input/output learning rates $\eta m$ and $\eta/m$. The comparison called standard here uses variances 1 and $1/m$, with learning rate η for both groups. These definitions include the optimizer: changing only initialization would not perform this comparison.`,
idea:String.raw`Rewrite the μP output weight as $a_j=mv_j$. Then $f=m^{-1}\sum_ja_j\tanh(w_jx)$, the mean-field form. A physical v-gradient is of order one, so its μP step η/m induces an order-one step in a. A physical w-gradient contains v of order 1/m; multiplying its learning rate by m keeps its update of order one as well. By contrast, holding both physical learning rates fixed in the standard comparison changes these width scalings. This explains the purpose of the parameter-group rules without asserting that finite optimization curves must coincide. Transfer is assessed by running the same rate grid and training procedure at each width and reporting the actual selected minima and failures.`,
caption:String.raw`Sweep 11 base rates at four widths using actual full-batch SGD. Switch parameterization, change seed or step count and inspect a selected run. Add labels in the second panel; all validation curves are recomputed from those observations.`,
scope:String.raw`Training minimizes mean squared residual divided by two. Uses Tensor Programs V's SGD input/output rules for this shallow architecture, not its Adam table or a claim about a multilayer optimizer. The 41-point target grid selects rates and reports their scores; it is not an untouched test set. Only this finite rate grid and seed are compared. Runs crossing an explicit numerical ceiling are reported as failures. The bias-free architecture is odd and cannot represent the target's even component.`,
deps:['deep-7.8','deep-5.2'],see:['deep-7.9'],refs:['Yang et al., Tensor Programs V, NeurIPS 2021 version, PDF p.5 Table 3 and Eqs 3–4; shallow finite SGD experiment supplied here'],links:{source:'https://proceedings.neurips.cc/paper/2021/file/8df7c2e3c3c3be098ef7b382bd2c37ba-Paper.pdf'},tags:['parameterization','hyperparameter transfer'],viz:U.transfer},
]};
