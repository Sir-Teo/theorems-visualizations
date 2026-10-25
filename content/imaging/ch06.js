import * as V from './ch06.viz.js';
export default {collection:'imaging',chapter:6,title:'Magnetic resonance imaging',
summary:String.raw`From a small thermal spin imbalance to controlled rotation, relaxation, encoding and reconstruction. Explicit finite models connect each picture to its equations; declared counterexamples expose the assumptions behind shortcuts. The final historical items retain source verification flags and use own synthetic illustrations.`,
items:[
{num:"6.2",kind:"Concept",name:"Net magnetization and Boltzmann polarization",
statement:String.raw`For independent spin-$1/2$ nuclei with positive gyromagnetic ratio $\gamma$, field $B\ge0$ and thermal equilibrium at $T>0$, the lower/upper energy splitting is $\Delta E=\hbar\gamma B$. With $x=\Delta E/(2k_BT)$,
$$P=\frac{N_{\rm lower}-N_{\rm upper}}{N}=\tanh x.$$
Net magnetization is $M=M_{\rm sat}P$. The weak-splitting approximation is $P\approx x$, not complete spin alignment.`,
idea:String.raw`THERMO 6.1 supplies canonical weights. Assign energies $-\Delta E/2$ and $+\Delta E/2$ and normalize their Boltzmann factors. Their difference is the hyperbolic tangent. The two large populations almost cancel at ordinary MRI fields; the small excess supplies the equilibrium magnetization. The visual gives that excess a separate ppm axis instead of exaggerating the population bars.`,
caption:String.raw`Change field and temperature. Compare the true population fractions with their net difference on the separate ppm scale.`,
scope:String.raw`An ideal noninteracting spin system, fixed spin density and no chemical shielding. The rounded educational proton value is $\gamma/(2\pi)=42.577$ MHz/T. Very low temperatures explore this model and are not patient conditions. B=0 is degenerate; no spontaneous orientation is inferred.`,
deps:["em-7.20", "thermo-6.1"],
refs:["Authored finite model and explicit derivation; see chapter verification receipt", "Stanford RAD229 2020 Lecture01A selected nuclei/gyromagnetic-unit text"],
tags:["mri", "equilibrium"],
viz:V.polarization},
{num:"6.3",kind:"Model",name:"Bloch equations",
statement:String.raw`For a prescribed rotating-frame field and equilibrium magnetization $M_0=1$, a phenomenological Bloch model is
$$\begin{aligned}\dot M_x&=\Delta\omega M_y-\Omega_yM_z\\&\quad-R_2M_x\end{aligned}$$
$$\begin{aligned}\dot M_y&=-\Delta\omega M_x+\Omega_xM_z\\&\quad-R_2M_y\end{aligned}$$
$$\begin{aligned}\dot M_z&=\Omega_yM_x-\Omega_xM_y\\&\quad+R_1(1-M_z)\end{aligned}$$
Here $R_j=1/T_j$, $\Omega_x=\gamma B_1\cos\phi$ and $\Omega_y=\gamma B_1\sin\phi$. With positive $\gamma$ and $M_+=M_x+iM_y$, free phase evolves as $e^{-i\Delta\omega t}$.`,
idea:String.raw`The torque convention uses positive $\gamma$ times $\mathbf M\times\mathbf B$. Removing the carrier rotation leaves detuning plus a constant corotating RF field. The prescribed-field equations are affine linear; augmenting the state by a constant 1 gives a matrix exponential for each constant pulse. A 90° x pulse sends +z toward +y. Relaxation competes with rotation during the pulse as well as after it.`,
caption:String.raw`Change RF area, phase, detuning and relaxation. Inspect the rotating-frame vector, resolved pulse components and free-evolution envelopes; drag the 3D view.`,
scope:String.raw`One isochromat with a constant rectangular corotating RF component and initial +z. Constant positive relaxation times, $0<T_2\le2T_1$ in the selected Markov-spin range. This bound is scoped, not a universal fit assertion. No lab-frame MHz oscillation, RF hardware or spin–spin microscopic simulation. A source phase-sign inconsistency is resolved by the explicit convention above.`,
deps:["em-7.20", "qm-13.2"],
refs:["Stanford RAD229 2020 Lecture01C, actual hard-RF text and selected rendered slides4/10/11", "Stanford RAD229 2020 Lecture01D, actual relaxation text", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "spin-dynamics"],
viz:V.bloch},
{num:"6.4",kind:"Concept",name:"T1 and T2 relaxation",
statement:String.raw`After ideal 90° excitation with $M_z(0)=0$ and $|M_+(0)|=M_0$, free on-resonance Bloch relaxation gives
$$M_z(t)=M_0(1-e^{-t/T_1}),$$
$$|M_+(t)|=M_0e^{-t/T_2}.$$
$T_1$ controls recovery toward longitudinal equilibrium; $T_2$ controls the homogeneous transverse envelope. They are different processes.`,
idea:String.raw`Set RF and detuning to zero in the Bloch equations. The longitudinal deficit $M_0-M_z$ and each transverse component solve separate first-order linear equations. A larger homogeneous transverse rate adds to $1/T_2$ without changing $T_1$ in this chosen model. The two plots start from the same valid 90° state, rather than combining a fully inverted longitudinal vector with unit transverse magnitude.`,
caption:String.raw`Move the observation time and compare three explicitly illustrative classes. Increase the extra transverse rate to shorten T2 while leaving longitudinal recovery fixed.`,
scope:String.raw`Chosen teaching classes have base $(T_1,T_2)$ in ms of $(300,80)$, $(1000,100)$ and $(2500,1500)$, with a shared scale. The labels suggest tissue-like regimes, not authenticated clinical values or a specific field strength. Extra loss is homogeneous, not static field inhomogeneity.`,
deps:["imaging-6.3"],
refs:["Stanford RAD229 2020 Lecture01D, actual relaxation text", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "relaxation"],
viz:V.relaxation},
{num:"6.5",kind:"Phenomenon",name:"Free induction decay and T2*",
statement:String.raw`A static frequency offset $f$ contributes phase $e^{-i2\pi ft}$ to the received transverse signal. For an offset distribution with characteristic function $\varphi(t)$,
$$S(t)=iM_0e^{-t/T_2}\varphi(t).$$
A Lorentzian half-width $w$ gives $\varphi=e^{-2\pi w|t|}$ and $1/T_2^*=1/T_2+2\pi w$. A Gaussian standard deviation $w$ instead gives $\varphi=e^{-(2\pi wt)^2/2}$, which has no constant rate-sum law.`,
idea:String.raw`The receiver adds complex spin amplitudes, so equal magnitudes can cancel through phase dispersion. Homogeneous T2 decay multiplies that complex average. Integrating a continuous Lorentzian or Gaussian law gives the stated characteristic function. The separate 31-spin quantile ensemble is an actual finite sum; it can oscillate or recur and is not forced to match the continuous expectation.`,
caption:String.raw`Spread the spinning arrows with static offsets and compare their finite mean with the continuous envelope. Switch Lorentzian/Gaussian to break the exponential T2* assumption.`,
scope:String.raw`Initial +i after ideal 90° x excitation, static offsets, no diffusion or exchange. Time in the formulas is seconds; controls and plots label ms. Width is a half-width for Lorentzian and standard deviation for Gaussian. The finite quantile ensemble is an authored illustration, not a measured frequency distribution.`,
deps:["imaging-6.4"],
refs:["Stanford RAD229 2020 Lecture01D, actual relaxation text", "Stanford RAD229 2020 Lecture08A, selected text through slide15", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "dephasing"],
viz:V.fid},
{num:"6.6",kind:"Phenomenon",name:"Spin echo",
statement:String.raw`Let $\tau=\mathrm{TE}/2$. An ideal instantaneous 180° pulse reverses static phase dispersion so that all static offsets rephase at TE, while irreversible loss remains:
$$|S(\mathrm{TE})|=M_0e^{-\mathrm{TE}/T_2}.$$
For initial +i, a 180° x pulse produces common echo phase −i; a y pulse produces +i. This is a phase transformation, not a reversal of each spin’s frequency.`,
idea:String.raw`Before the pulse, offset phase is $-2\pi ft$. A π rotation about x conjugates the transverse complex number; after the pulse the offset-dependent phase is proportional to $t-2\tau$. It vanishes at $2\tau$. The irreversible factor depends on total elapsed time $t$, not on the refocused phase time $|t-2\tau|$. The finite ensemble and continuous model agree exactly at the ideal echo apart from arithmetic error.`,
caption:String.raw`Set TE and the pulse axis. Watch the arrows dephase and rephase, and compare the echo with the remaining T2 envelope.`,
scope:String.raw`Perfect instantaneous broadband π pulse, unchanged static offsets before/after, no motion or diffusion. Real pulse imperfections and reversible/irreversible mechanisms beyond this model are absent. A π pulse can refocus static dispersion; it cannot restore lost transverse coherence from the stipulated homogeneous T2 term.`,
deps:["imaging-6.5"],
see:["qinfo-7.7"],
refs:["Stanford RAD229 2020 Lecture08A, selected text through slide15", "Stanford RAD229 2020 Lecture01C, actual hard-RF text and selected rendered slides4/10/11", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "spin-echo"],
viz:V.spinEcho},
{num:"6.7",kind:"Concept",name:"Image contrast from TR and TE",
statement:String.raw`For the declared ideal periodic 90°/180° spin-echo cycle, $\mathrm{TR}\ge\mathrm{TE}\ge0$ and transverse spoiling before each new excitation, the signal magnitude is
$$S=\rho F e^{-\mathrm{TE}/T_2},$$
$$F=(1-w)+w(1-u)^2,$$
with $w=e^{-(\mathrm{TR}-\mathrm{TE})/T_1}$ and $u=e^{-\mathrm{TE}/(2T_1)}$. The common approximation replaces $F$ by $1-e^{-\mathrm{TR}/T_1}$. Tissue contrast depends on sequence assumptions as well as relaxation constants.`,
idea:String.raw`An ideal 90° pulse resets longitudinal magnetization to 0 after prior transverse spoiling. It recovers until TE/2, the π pulse inverts that recovered component, and recovery continues to the next excitation. This yields $F=1-2e^{-(\mathrm{TR}-\mathrm{TE}/2)/T_1}+e^{-\mathrm{TR}/T_1}$. The positive factored form avoids cancellation. At long TR or short TE the common approximation can be useful, but the visual computes and compares both.`,
caption:String.raw`Change TR and TE. Compare exact and approximate phantom brightness on the same fixed scale, plus the actual class signal curves.`,
scope:String.raw`Ideal pulse/reset/spoiling assumptions, three chosen teaching classes and an own 32×32 phantom. Relative densities are1,.9,1. No clinical anatomy, fitted tissue values or universal “T1-weighted” threshold. TE>TR is an undefined sequence here and is shown explicitly rather than clamped.`,
deps:["imaging-6.4"],
refs:["Stanford RAD229 2020 Lecture08A, selected text through slide15", "Stanford RAD229 2020 Lecture01D, actual relaxation text", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "contrast"],
viz:V.contrast},
{num:"6.8",kind:"Concept",name:"Slice selection with gradients and shaped RF pulses",
statement:String.raw`A slice gradient gives offset $\omega(z)=\gamma Gz$. For a real symmetric RF envelope $b(t)$ supported on $[-T/2,T/2]$, the linear small-tip approximation gives
$$I(\omega)=\int_{-T/2}^{T/2}b(t)e^{i\omega t}\,dt,$$
$$M_+(z,T)\approx i\gamma M_0 e^{-i\omega T/2}I(\omega),$$
where $\omega=\omega(z)$.
Nominal full thickness is $\Delta z=\mathrm{BW}/(\bar\gamma|G|)$ for nonzero G. A finite sinc pulse has transition bands and sidelobes, not an exactly rectangular slab.`,
idea:String.raw`Position-dependent precession maps frequency to position. Linearizing about nearly unchanged longitudinal magnetization makes the driven transverse solution a Fourier integral of the RF envelope. A half-area opposite gradient cancels the pulse’s linear through-slice phase. It changes the real/imaginary components without changing magnitude. A Hann time window trades transition width against ringing; it does not create hard spatial support.`,
caption:String.raw`Shape the RF pulse and reverse or weaken the gradient. Toggle the rephasing lobe to isolate phase changes from the slice magnitude.`,
scope:String.raw`Small nominal flip0–15°, no relaxation, no RF carrier offset and fixed ±15mm spatial view. The RF is a truncated sinc, optionally Hann-windowed and normalized by its actual centre integral. BW is a nominal parameter rather than measured FWHM. G=0 supplies no finite slice selection; zero flip makes any excitation unobservable.`,
deps:["em-7.20", "imaging-1.3"],
refs:["Stanford RAD229 2020 Lecture02B, selected spatial encoding/small-tip/rephasing text", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "rf-pulses"],
viz:V.slice},
{num:"6.9",kind:"Concept",name:"k-space: frequency and phase encoding",
statement:String.raw`With $M_+=M_x+iM_y$, positive gamma and no additional evolution, gradient encoding gives
$$S(\mathbf k)=\int\rho(\mathbf r)e^{-i2\pi\mathbf k\cdot\mathbf r}\,d\mathbf r,$$
$$\mathbf k(t)=\bar\gamma\int_0^t\mathbf G(s)\,ds.$$
Each sampled k-space location is a complex spatial Fourier coefficient. A fully sampled finite Cartesian grid is inverted by the matching discrete Fourier transform.`,
idea:String.raw`A gradient makes phase accumulation proportional to position. Summing the complex transverse contributions creates a Fourier integral, connecting slice excitation with RCA9.11’s inversion idea. The exercise uses a 32×32 raw DFT with explicit normalization, so partial acquisition reconstructs exactly the image implied by those coefficients. Centric versus sequential order changes what information appears first, without changing the final full-grid inverse.`,
caption:String.raw`Acquire rows in two orders. Compare the own object, actual acquired k-space and inverse reconstruction; change pixel spacing to see its physical FOV.`,
scope:String.raw`Own finite object sampled at coordinates $(j\,d,l\,d)$; raw forward exponent is negative and inverse normalization1/1024. FFT shifting is display reordering only. No relaxation, noise or continuous interpolation claim; ideal point sampling ignores gradient slew and trajectory limits.`,
deps:["imaging-6.8", "rca-9.11"],
refs:["Stanford RAD229 2020 Lecture02C, selected signal-equation/k-space text", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "fourier-encoding"],
viz:V.encoding},
{num:"6.10",kind:"Concept",name:"Field of view and wrap-around aliasing",
statement:String.raw`Uniform k-space spacing $\delta k$ corresponds to periodic field of view $L=1/\delta k$. On the declared N-point raw DFT grid, retaining bins $0,R,2R,\ldots$ and taking the shorter $M=N/R$ inverse gives
$$\widetilde\rho_r=\sum_{q=0}^{R-1}\rho_{r+qM}.$$
Objects outside the reduced FOV therefore wrap and add. Changing sample spacing and truncating sample extent have different effects.`,
idea:String.raw`Insert the raw DFT sum into the M-point inverse. The inner sum of roots of unity is zero unless the original sample index equals r modulo M, in which case it is M. The surviving object samples add with no invented intensity renormalization. This is the finite version of the sampling periodicity from IMAGING1.5. Cutting consecutive high-frequency bins instead removes spatial detail rather than shrinking periodic FOV in this way.`,
caption:String.raw`Increase the undersampling factor. Compare the true object with the actual folded sum and one column’s contributing bands.`,
scope:String.raw`Integer phase-encoding factors1,2,4,8 on a32×32 object. Raw ky bins are R-spaced, the other axis is fully sampled, and the coarse inverse has its own1/(32M) normalization. Original brightness scale0–1; folded brightness stays fixed0–8 across R so additive overlaps remain visible quantitatively.`,
deps:["imaging-6.9", "imaging-1.5"],
refs:["Stanford RAD229 2020 Lecture02C, selected signal-equation/k-space text", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "aliasing"],
viz:V.aliasing},
{num:"6.11",kind:"Method",name:"Partial Fourier from Hermitian symmetry",
statement:String.raw`For a real finite image, the raw DFT obeys Hermitian symmetry
$$K_{u,v}=\overline{K_{-u\bmod N,-v\bmod N}}.$$
Missing coefficients can then be completed from acquired conjugate partners. A spatially varying complex phase generally breaks this identity even when the magnitude image is unchanged.`,
idea:String.raw`Conjugate the DFT sum of real samples and reverse both frequency indices. Even-grid DC/Nyquist self-pairs must be real under the real-object hypothesis. The visual acquires ky rows0 through N/2 plus optional negative rows, then fills only missing bins. It keeps all measured coefficients unchanged. Increasing phase supplies a counterexample to naive symmetry completion; complex RMSE catches errors that magnitude pictures can hide.`,
caption:String.raw`Add spatial phase or acquire more negative rows. Compare zero-fill with conjugate completion on the same brightness scale.`,
scope:String.raw`Exact finite symmetry is derived directly; RCA9.2’s existing verification flag is not cleared. This is naive conjugate completion, not clinical partial-Fourier phase estimation, homodyne or POCS. No noise. Even when phase is nonzero, full acquisition is its own exact inverse.`,
deps:["imaging-6.9", "rca-9.2"],
refs:["Authored finite model and explicit derivation; see chapter verification receipt", "Stanford RAD229 2020 Lecture02C, selected signal-equation/k-space text"],
tags:["mri", "partial-fourier"],
viz:V.partialFourier},
{num:"6.12",kind:"Method",name:"Parallel imaging (SENSE)",
statement:String.raw`For known coil sensitivities and an alias group, measurements satisfy $\mathbf s=C\mathbf m+\mathbf n$. With full column rank and positive-definite noise covariance $\Psi$, the linear weighted least-squares estimate is
$$\widehat{\mathbf m}=W\mathbf s,$$
$$W=(C^H\Psi^{-1}C)^{-1}C^H\Psi^{-1}.$$
Its noise covariance is $(C^H\Psi^{-1}C)^{-1}$. Rank deficiency prevents unique unfolding; nearly dependent coil columns amplify noise.`,
idea:String.raw`Each receiver observes a different known linear combination of the aliased pixels. Unfolding solves that small system, rather than creating missing information from one image alone. Our two real signed unit-norm columns differ by angle δ, giving determinant sinδ and geometry factor $g=1/|\sin\delta|$ under white noise. As δ approaches0 the theoretical inverse remains unique for positive δ but numerical conditioning degrades. At δ=0 distinct objects give the same measurements.`,
caption:String.raw`Change coil separation and noise. Inspect signed maps and the actual reconstructed object; approach the rank-loss boundary.`,
scope:String.raw`Own 2-coil 2-fold example with exactly known maps, white post-alias Gaussian complex noise and explicit condition-number guard 10⁸. No sensitivity estimation, correlated-noise calibration or clinical SNR claim. The stopped1999 original was not read; distinct2020 Stanford teaching notes support this declared linear-algebra exercise. Magnitude is biased even when the complex linear estimator is unbiased.`,
deps:["imaging-6.10"],
refs:["Stanford RAD229 2020 Lecture07C, selected coil/noise text and rendered slide16", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "parallel-imaging"],
viz:V.sense},
{num:"6.13",kind:"Method",name:"Compressed-sensing MRI",
statement:String.raw`An own sparse reconstruction uses a sampled unitary Fourier operator $A=PF$ and an orthonormal tensor-product Haar transform W:
$$\min_x\ \tfrac12\|Ax-y\|_2^2+\lambda\|Wx\|_1.$$
ISTA with step1 is valid here because $\|A\|\le1$. Sparsity, sampling geometry, noise and the penalty jointly affect recovery; undersampling alone gives no guarantee.`,
idea:String.raw`Take a gradient step on data fidelity, transform to Haar coefficients, apply complex soft-thresholding and invert the orthonormal transform. The actual objective is measured after every iteration. Uniform lines give coherent wrap ambiguity; a matched-count variable-density point mask spreads that ambiguity differently. A Haar-sparse dyadic phantom can benefit, while a textured example and stronger regularization expose lost detail or bias. With λ=0 one projection step returns zero-fill.`,
caption:String.raw`Compare equal-count masks, the sparse and textured objects, noise and iteration count. Watch the actual objective and compare complex error, not just a plausible image.`,
scope:String.raw`Own 32×32 Haar/ISTA exercise, complex soft-thresholding and fixed brightness0–1. The point mask ignores realizable acquisition trajectories. This is not Lustig 2007’s nonlinear conjugate-gradient/TV implementation, source images or performance reproduction. SIG7.16 remains planned, not an actually read proof input.`,
deps:["imaging-6.10", "sig-7.16"],
refs:["Lustig et al.2007 Sparse MRI, selected prerequisites/objective/AppendixA text; own distinct ISTA exercise", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "compressed-sensing"],
viz:V.compressed},
{num:"6.14",kind:"Phenomenon",name:"BOLD contrast in functional MRI",
statement:String.raw`BOLD is an indirect signal affected by blood oxygenation and sequence physics. In this authored blood-budget model, relative venous volume v and deoxy content q obey
$$\dot v=f-v^{1/\alpha},$$
$$\dot q=m-v^{1/\alpha}q/v,$$
with baseline v=q=f=m=1 and chosen $\alpha=0.4$. Assuming Gaussian static offset width proportional to $q/\sqrt v$ gives
$$S/S_0=\exp[-C(q^2/v-1)].$$
This construction permits positive or negative signal changes and does not identify neural activity.`,
idea:String.raw`Prescribe separate delayed flow and oxygen-use responses. Inflow minus outflow changes blood volume; deoxy production minus convective removal changes q. The bounded controls keep required extraction physical. The Gaussian characteristic function then connects this own field-distribution model to FID dephasing. A fixed active spatial fraction mixes active and baseline signal; it is not a new ODE with casually rescaled input. PHYSIO6.2 explains oxygen binding but does not turn a BOLD measurement into a unique metabolic or neuronal estimate.`,
caption:String.raw`Vary flow, oxygen use and TE. Compare their timing with the blood-budget signal and select a time for the own activation-mixture map.`,
scope:String.raw`Chosen delays 2 s/4 s, filter constants 1 s/2 s, transit time 1 s, baseline extraction 0.4 and baseline static width 2 Hz. These are illustrative, not calibrated human parameters, a universal HRF, the Davis model or an original Ogawa-data fit. Perfusion, intravascular/extravascular detail, field strength dependence and neurovascular inference are omitted.`,
deps:["imaging-6.5", "physio-6.2"],
refs:["DartBrains MR Physics selected oxygenation text; Andy’s BrainBook selected HRF overview", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "bold"],
viz:V.bold},
{num:"6.15",kind:"Method",name:"Diffusion MRI (Stejskal\u2013Tanner)",
statement:String.raw`For free Gaussian diffusion and rectangular Stejskal–Tanner lobes of duration δ, start separation $\Delta\ge\delta$ and amplitude G, an ideal refocusing pulse gives
$$S/S_0=e^{-bD},$$
$$b=\gamma^2G^2\delta^2(\Delta-\delta/3).$$
Gamma is angular. For a positive diffusion tensor, directional diffusivity is $D=\mathbf g^TD\mathbf g$ for unit direction g. A tensor axis is not a unique fibre reconstruction.`,
idea:String.raw`The π pulse changes the effective sign of the second same-polarity physical gradient lobe. Static positions rephase, while Brownian paths accumulate a Gaussian random phase. If $q(t)=\gamma\int_0^tG_{\rm eff}(s)ds$, its variance is $2D\int q(t)^2dt$, yielding the exponential attenuation and stated b. The finite 128-path exercise draws exact joint Gaussian segment endpoints and integrated positions, keeping phase integration distinct from a drawn piecewise path.`,
caption:String.raw`Change lobe strength, timing and direction. Compare the analytic tensor attenuation with the actual finite complex phase ensemble.`,
scope:String.raw`Unrestricted Gaussian diffusion, ideal rectangular lobes, δ≥0, gap≥0 and Δ=δ+gap. SI units are converted to b in s/mm² and D in mm²/s. No exchange, restriction, non-Gaussian tissue microstructure or tractography inference. Equal eigenvalues have no unique principal direction. MATHBIO8.3 remains planned, not an actually read body.`,
deps:["imaging-6.6", "mathbio-8.3"],
refs:["Stanford RAD229 2020 Lecture15B, selected opening diffusion text and rendered slide7", "Authored finite model and explicit derivation; see chapter verification receipt"],
tags:["mri", "diffusion"],
viz:V.diffusion},
{num:"6.16",kind:"Paper",name:"Image Formation by Induced Local Interactions",
statement:String.raw`A magnetic-field gradient can map spatial position to resonance frequency. The frozen 1973 bibliography identifies Lauterbur’s historical imaging paper. Because its original body and figures were unavailable, this flagged item illustrates an explicitly own finite projection construction: detector deposition is a linear operator P, and backprojection applies its adjoint $P^T$. An adjoint is not generally an inverse.`,
idea:String.raw`Our two ellipses deposit each pixel into neighbouring detector bins along a selected gradient direction. Rotating the gradient supplies additional projections. Applying the exact adjoint averages those profiles back into the plane, reducing angular streak variation as views increase but retaining unfiltered blur. IMAGING3.6 provides the projection/inversion context. This demonstration makes no claim to reproduce the paper’s objects, acquisition angles, figures or data.`,
caption:String.raw`Rotate the chosen gradient and add projections. Compare the own object, actual detector profile and fixed-scale unfiltered adjoint.`,
scope:String.raw`Own 32×32two-ellipse phantom, 64 bilinear detector bins and 1–48 equally spaced views. Source stop: Nature identity/cookie redirect; no original-body or figure reading, no alternate recovery. Frozen authors/year/title/venue/DOI and introduces link are retained; verify:true remains. This is a finite teaching construction rather than historical experimental verification.`,
deps:["em-7.20", "imaging-3.6"],
paper:{"authors": "P. C. Lauterbur", "year": 1973, "title": "Image Formation by Induced Local Interactions: Examples Employing Nuclear Magnetic Resonance", "venue": "Nature 242 (5394): 190–191", "doi": "10.1038/242190a0"},
introduces:["imaging-6.9"],
refs:["Authored finite model and explicit derivation; see chapter verification receipt", "Frozen syllabus bibliography; original body unavailable at source stop"],
tags:["mri", "historical-paper"],
verify:true,
viz:V.lauterbur},
{num:"6.17",kind:"Paper",name:"Brain MRI with Contrast Dependent on Blood Oxygenation",
statement:String.raw`The frozen 1990 bibliography identifies the oxygenation-dependent MRI paper by Ogawa and colleagues. Its original body and images stopped at a browser challenge, so this flagged item uses an own static-offset model: a Gaussian width proportional to the deoxygenated fraction gives
$$S_{\rm vessel}=e^{-\mathrm{TE}/T_2}e^{-(2\pi\sigma\mathrm{TE})^2/2}.$$
Oxygenation, echo timing and assumed microscopic field distribution jointly control contrast; the formula is not a calibrated oxygenation measurement.`,
idea:String.raw`Paramagnetic deoxyhemoglobin motivates an oxygenation-sensitive field-distribution illustration. In the own model, increasing its chosen Gaussian width accelerates gradient-echo dephasing relative to a common T2 background. A perfect refocusing option cancels only these static offsets. It does not imply that real spin-echo BOLD is absent, since diffusion and other mechanisms are omitted. The own vessel pixels carry no original rat-brain measurements or validated high-field parameters.`,
caption:String.raw`Change oxygenation and TE. Compare the fixed-scale own vessel image with its computed signal curve, then remove only static dephasing using ideal refocusing.`,
scope:String.raw`Own synthetic vessel, chosen homogeneous T2=80 ms and phenomenological static width. Time in the formula is seconds. Source stop: PMC browser/reCAPTCHA; no body, original figure/data or alternate recovery. Frozen authors/year/title/venue/DOI and introduces link are retained; verify:true remains. No original fit, clinical calibration or neural-activity inference.`,
deps:["imaging-6.5", "physio-6.2"],
paper:{"authors": "S. Ogawa, T. M. Lee, A. R. Kay and D. W. Tank", "year": 1990, "title": "Brain magnetic resonance imaging with contrast dependent on blood oxygenation", "venue": "Proceedings of the National Academy of Sciences 87 (24): 9868–9872", "doi": "10.1073/pnas.87.24.9868"},
introduces:["imaging-6.14"],
refs:["DartBrains MR Physics selected oxygenation text; Andy’s BrainBook selected HRF overview", "Authored finite model and explicit derivation; see chapter verification receipt", "Frozen syllabus bibliography; original body unavailable at source stop"],
tags:["mri", "historical-paper"],
verify:true,
viz:V.ogawa}
]};
