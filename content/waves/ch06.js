import * as U from './ch06.ui.shared.js';
const FANG='https://ocw.mit.edu/courses/2-71-optics-spring-2014/9f1cabaaa8aca1b730d3c329ad63658d_MIT2_71S14_lec11_notes.pdf';
const FILM='https://wp.optics.arizona.edu/winter-school-workshop/wp-content/uploads/sites/16/2015/09/Thin-Film-Optics-Macleod-1.pdf';
const EXTER='https://home.physics.leidenuniv.nl/~exter/CQO/CQO.pdf';
const ASPECT='https://arxiv.org/abs/2005.08239';
export default {
 collection:'waves',chapter:6,title:'Interference and coherence',
 summary:'Interference starts with complex field amplitudes and ends with an intensity measurement. This chapter follows their cross term through two paths, transparent films and resonant stacks, then asks what survives when phases fluctuate. Explicit source spectra and brightness distributions connect fringe visibility to spectroscopy, stellar size and classical intensity correlations.',
 items:[
 {num:'6.1',kind:'Theorem',name:'Interference of two coherent waves',
 statement:String.raw`Let two monochromatic fields share a frequency and propagation mode in the same linear isotropic medium. Choose amplitude units so that the cycle-averaged irradiance is the squared Jones-vector norm. For unit polarization vectors $\mathbf e_1,\mathbf e_2$,
 $$\mathbf A=\sqrt{I_1}\mathbf e_1+\sqrt{I_2}e^{i\phi}\mathbf e_2,$$
 Write $p=\mathbf e_1^*\!\cdot\mathbf e_2$. Then
 $$K=2\sqrt{I_1I_2}\Re(e^{i\phi}p),$$
 $$I=I_1+I_2+K.$$
 For parallel linear polarizations the last factor is $\cos\phi$; for orthogonal polarizations it vanishes. Uniformly averaging the relative phase also removes the cross term.`,
 idea:String.raw`Superposition adds the fields. Expanding their Hermitian squared norm gives the cross term, while averaging a real sinusoid's square over one optical period supplies the common conversion to irradiance. For linear polarizations separated by angle $\alpha$, the inner product is $\cos\alpha$. An independent uniform phase has $\langle e^{i\phi}\rangle=0$, so incoherent intensities add.`,
 caption:'Change relative phase, beam balance and polarization. Compare the actual instantaneous field components with the phase-dependent cycle-averaged irradiance.',
 scope:'A common propagation mode and a detector with no polarization analyzer. The scalar irradiance formula is not a claim about the sign of an arbitrary instantaneous Poynting-vector component. Zero phase-averaged cross term does not require zero fields.',
 deps:['waves-1.6','waves-4.2'],refs:['Fang, MIT2.71 Lecture11, pp1–2, complex interference and visibility','Syllabus guide: Hecht ch.9 (book body not consulted)'],links:{source:FANG},viz:U.coherent},
 {num:'6.2',kind:'Phenomenon',name:'Young’s double-slit experiment',
 statement:String.raw`Two coherent point apertures at transverse positions $\pm d/2$ illuminate a screen a distance $L$ away. At screen coordinate $x$, let
 $$r_\pm=\sqrt{L^2+(x\mp d/2)^2}.$$
 In the scalar spherical-wave model the normalized irradiance is
 $$I(x)=\left|\frac{L}{r_+}e^{ikr_+}+\frac{L}{r_-}e^{ikr_-}\right|^2,$$
 where $k=2\pi/\lambda$. If $|x|,d\ll L$, then $r_+-r_-\simeq-dx/L$ and the local fringe spacing is $\lambda L/d$. Blocking one path removes its interference cross term.`,
 idea:String.raw`The two distances determine the phase difference. Rationalizing their difference gives $r_+-r_-=-2xd/(r_++r_-)$, avoiding cancellation near the axis. The field magnitudes also differ slightly because each spreads as $1/r$. Replacing both distances in the denominator by L gives the paraxial formula; its bright fringes occur when the path difference is an integer wavelength.`,
 caption:'Vary separation, wavelength and screen distance, then cover either aperture. Compare the exact paths with the paraxial fringe-spacing guide.',
 scope:'Ideal point apertures, equal source strengths and common polarization. The model omits the finite-slit diffraction envelope, source coherence loss and obliquity factors. The ray drawing enlarges transverse distances. This modern double-slit arrangement is distinct from Young’s card experiment in the 1804 Paper item.',
 deps:['waves-6.1','waves-4.4'],refs:['Fang Lecture11, pp4–5, exact paths and paraxial double-slit interference','Syllabus guide: Hecht ch.9 (book body not consulted)'],links:{source:FANG},viz:U.doubleSlit},
 {num:'6.3',kind:'Definition',name:'Fringe visibility',
 statement:String.raw`For a phase scan with fixed nonnegative beam intensities and incoherent background B, define
 $$V=\frac{I_{\max}-I_{\min}}{I_{\max}+I_{\min}},$$
 provided the denominator is positive. If the normalized complex mutual coherence is $\gamma$, the scan has mean $I_1+I_2+B$ and amplitude $2\sqrt{I_1I_2}|\gamma|$. Hence
 $$V=\frac{2\sqrt{I_1I_2}|\gamma|}{I_1+I_2+B}.$$
 Low visibility can reflect unequal beams, background or lost coherence; it does not identify which cause by itself.`,
 idea:String.raw`Average the cross term over the phase fluctuations before locating the extrema of the remaining phase scan. Its complex coefficient is the average phasor. For Gaussian phase jitter of variance $\sigma^2$, completing the square in the Gaussian characteristic integral gives $\gamma=e^{-\sigma^2/2}$. A finite set of sampled phases has its own complex average and generally a different visibility.`,
 caption:'Unbalance the beams, add Gaussian phase jitter or add background. Compare the ensemble curve with a seeded finite phase average and inspect the actual samples.',
 scope:'The phase is scanned while source statistics remain fixed. The sample count controls a numerical average, not detector photon noise. Background contributes only to mean irradiance. The sample display shows the first 64 phases; the calculation uses the selected full count.',
 deps:['waves-6.2'],refs:['Fang Lecture11, pp2–4, visibility and complex coherence','Van Exter, Classical & Quantum Optics, printed 21–22, coherence definitions','Gaussian characteristic-function calculation and finite average derived here'],links:{source:FANG,coherence:EXTER},viz:U.visibility},
 {num:'6.4',kind:'Phenomenon',name:'Lloyd’s mirror',
 statement:String.raw`A point source at height h above an ideal reflecting plane and its reflected ray reach a screen at horizontal distance L. The direct and image distances to height y are
 $$r_d=\sqrt{L^2+(y-h)^2},$$
 $$r_i=\sqrt{L^2+(y+h)^2}.$$
 Model the mirror's field coefficient as $-\rho$, with $0\leq\rho\leq1$. Put $a=L/r_d$ and $b=\rho L/r_i$. The field is $ae^{ikr_d}-be^{ikr_i}$. At the mirror edge $y=0$ the paths are equal; the intensity vanishes when $\rho=1$. In the paraxial regime the fringe spacing is $\lambda L/(2h)$.`,
 idea:String.raw`Unfold the specularly reflected path into a straight line from the virtual source below the mirror. The image separation is 2h, so the path geometry resembles two slits. The additional minus sign reverses the bright and dark positions. Rationalization gives the stable difference $4yh/(r_i+r_d)$; unequal amplitudes leave a nonzero edge minimum.`,
 caption:'Move the source and screen, change wavelength and reduce the reflected amplitude. See when the edge cancellation survives.',
 scope:'An ideal scalar mirror with a prescribed negative real coefficient. Real dielectric or metallic reflection may have angle-dependent magnitude, phase and polarization. A finite mirror can block some geometrical paths. Those effects are not modeled.',
 deps:['waves-6.2','waves-4.14'],refs:['Fang Lecture11, pp4–5, two-source path method; image-source construction derived here','Syllabus guide: Hecht ch.9 (book body not consulted)'],links:{source:FANG},viz:U.lloyd},
 {num:'6.5',kind:'Phenomenon',name:'Thin-film interference',
 statement:String.raw`For a lossless plane layer of real index n and thickness d between media of indices $n_0,n_s>0$, at normal incidence define
 $$r_{01}=\frac{n_0-n}{n_0+n},$$
 $$r_{12}=\frac{n-n_s}{n+n_s},$$
 $$\delta=\frac{2\pi nd}{\lambda},$$
 $$r=\frac{r_{01}+r_{12}e^{2i\delta}}{1+r_{01}r_{12}e^{2i\delta}}.$$
 The power reflectance is $R=|r|^2$. With the corresponding transmitted field coefficient t, $T=(n_s/n_0)|t|^2$ and $R+T=1$. Reflected wavelengths vary with optical thickness.`,
 idea:String.raw`Each extra internal round trip contributes the same complex multiplier. Summing that convergent geometric series combines phase accumulation with the signed interface reflections. At zero thickness the layer disappears algebraically. In an air–film–air system the two interface coefficients have opposite signs, so integer half-wave optical thicknesses also give zero reflection.`,
 caption:'Explore thickness, refractive index and wavelength. The map shows calculated reflectance, while the selected-thickness plot compares reflection and transmission.',
 scope:'Parallel interfaces, normal incidence, positive real nondispersive indices and no absorption. The tint encodes numerical reflectance; it does not simulate perceived soap-film colors, drainage or rupture. Transmission includes the medium-admittance factor, not just the squared electric amplitude.',
 deps:['waves-6.1','waves-4.14'],refs:['Macleod, Thin Film Optics, pp7–10 and13–16, transparent-layer interference','Van Exter, printed 13–17, lossless interfaces and multiple reflections'],links:{source:FILM,interferometers:EXTER},viz:U.film},
 {num:'6.6',kind:'Method',name:'Antireflection coatings',
 statement:String.raw`At a chosen vacuum wavelength $\lambda_0$, a single lossless coating between real-index media $n_0,n_s$ has zero normal-incidence reflection when
 $$n=\sqrt{n_0n_s},\qquad nd=\frac{\lambda_0}{4}.$$
 Odd multiples of this optical thickness also cancel reflection at that wavelength. A generic wavelength, angle or material mismatch restores reflection.`,
 idea:String.raw`At quarter-wave thickness the layer's round-trip factor is −1. The reflected-amplitude numerator becomes $r_{01}-r_{12}$, which vanishes precisely when $n^2=n_0n_s$. Equivalently, the quarter-wave layer transforms the substrate optical admittance to $n^2/n_s$, matching the incident medium. Both amplitude and phase matching are necessary.`,
 caption:'Adjust coating index and optical thickness, then compare coated and bare glass across wavelength. The matching point is marked at the fixed 550 nm design wavelength.',
 scope:'One ideal nondispersive layer, air incidence, a lossless substrate and normal incidence. The index slider represents a hypothetical available material. This wavelength-specific design does not guarantee broadband or oblique-incidence performance.',
 deps:['waves-6.5','waves-1.10'],refs:['Macleod, pp7–10, half-wave/quarter-wave layers and reflection matching','Syllabus guide: Hecht ch.9 (book body not consulted)'],links:{source:FILM},viz:U.coating},
 {num:'6.7',kind:'Phenomenon',name:'Newton’s rings',
 statement:String.raw`A spherical lens of radius R above a flat plate has air-gap thickness
 $$t(r)=t_0+R-\sqrt{R^2-r^2}.$$
 Treating each small patch as a plane glass–air–glass film at normal incidence, reflected dark rings satisfy $2t(r)=m\lambda$. Put $u=m\lambda/2-t_0$. A ring exists on the lower spherical cap when $0\leq u\leq R$, with
 $$r_m^2=u(2R-u).$$
 For $r\ll R$, this reduces to $r_m^2\simeq R(m\lambda-2t_0)$. Contact gives a dark center in reflection.`,
 idea:String.raw`The two air-gap reflections carry opposite interface signs, so an integer full-wave round trip cancels the reflected field. Insert the sphere's sag into this phase condition and solve for the radius. The familiar square-root spacing follows by retaining $r^2/(2R)$ in the sag. A nonzero central gap shifts the allowed orders and may eliminate a selected ring.`,
 caption:'Change lens curvature, central gap, wavelength and dark-ring order. Compare the exact spherical radius with the paraxial estimate and the full radial reflectance.',
 scope:'Equal index 1.5 glass on both sides of the air gap; local normal incidence. Sphere sag is exact, but the optical model neglects slope, multiple lateral propagation and diffraction across the curved gap. A selected order can be absent. The raster uses a fixed numerical reflectance scale.',
 deps:['waves-6.5'],refs:['Macleod, pp7–10, air-layer phase cancellation; spherical-gap construction derived here','Syllabus guide: Hecht ch.9 (book body not consulted)'],links:{source:FILM},viz:U.newton},
 {num:'6.8',kind:'Model',name:'Michelson interferometer',
 statement:String.raw`In an ideal balanced Michelson interferometer, displacement x of one mirror changes the round-trip optical path by 2x. A plate of thickness t and index n replacing air on both passes adds $2(n-1)t$. With any initial path offset absorbed into the phase origin,
 $$D=2x+2(n-1)t,$$
 $$\phi=\frac{2\pi D}{\lambda}.$$
 The complementary output fractions can be written $P_A=\cos^2(\phi/2)$ and $P_B=\sin^2(\phi/2)$. Moving the mirror by $\lambda/2$ completes one fringe cycle.`,
 idea:String.raw`Follow the beam to the mirror and back: mirror travel and the plate's excess optical length are each counted twice. The equal returned amplitudes interfere at the beam splitter. Its lossless phase convention yields complementary ports whose sum is one, so a dark output redirects energy rather than destroying it.`,
 caption:'Move the mirror, insert a plate and change its index. Read the actual path difference and watch the two output powers trade places.',
 scope:'Aligned monochromatic plane-wave arms, ideal balanced splitting, no interface reflection from the inserted plate and no absorption. The diagram is schematic and does not model tilt rings or mechanical travel geometry.',
 deps:['waves-6.1'],refs:['Fang Lecture11, pp2–4, Michelson interferometer and round-trip delay','Syllabus guide: Hecht ch.9 (book body not consulted)'],links:{source:FANG},viz:U.michelson},
 {num:'6.9',kind:'Model',name:'Mach–Zehnder interferometer',
 statement:String.raw`Let both lossless beam splitters have matrix
 $$B=\begin{pmatrix}\sqrt\eta&i\sqrt{1-\eta}\\i\sqrt{1-\eta}&\sqrt\eta\end{pmatrix}.$$
Here $0\leq\eta\leq1$.
 One arm gains field multiplier $\sqrt T e^{i\phi}$, with $0\leq T\leq1$. For unit input in port 1, the output is
 $$\mathbf a=B\,\operatorname{diag}(\sqrt T e^{i\phi},1)\,B\binom10.$$
 Its powers satisfy $P_1+P_2=\eta T+1-\eta$. When $\eta=1/2$ and $T=1$, changing the phase alone can direct all power to either output.`,
 idea:String.raw`The imaginary off-diagonal coefficients make $B^*B=I$; arbitrary real positive splitting coefficients would not conserve power. Multiply the first splitter, arm factors and second splitter in physical order. The attenuated arm initially carries fraction η, so its missing power is η(1−T), exactly closing the output ledger.`,
 caption:'Change beam-splitter balance, arm phase and attenuation. Inspect both complex output amplitudes and the transmitted-plus-absorbed power ledger.',
 scope:'A two-mode monochromatic model with identical splitter matrices in the declared port convention. Reflections can change phase conventions without changing the measurable predictions. No detector noise, misalignment or polarization mismatch is included.',
 deps:['waves-6.1','waves-4.11'],refs:['Van Exter, printed 13–15, unitary beam splitters and two-beam interferometers','Syllabus guide: Hecht ch.9 (book body not consulted)'],links:{source:EXTER},viz:U.mach},
 {num:'6.10',kind:'Model',name:'Fabry–Pérot interferometer',
 statement:String.raw`For a symmetric lossless Fabry–Pérot cavity with mirror power reflectance $0\leq R<1$ and round-trip phase δ, the transmitted amplitude is
 $$S=\sum_{j=0}^\infty R^je^{ij\delta},$$
 $$t=(1-R)e^{i\delta/2}S.$$
 Consequently
 $$F=\frac{4R}{(1-R)^2},$$
 $$\mathcal T=\frac{1}{1+F\sin^2(\delta/2)}.$$
 Peaks occur at $\delta=2\pi m$. For $F>1$, their full width at half maximum is $4\arcsin(1/\sqrt F)$, and the finesse is $2\pi$ divided by that width. For high R it approaches $\pi\sqrt R/(1-R)$.`,
 idea:String.raw`Every extra round trip multiplies the transmitted contribution by $Re^{i\delta}$. Sum the series and take the squared modulus of its denominator. After N terms, the absolute amplitude tail is at most $R^N$. Solving the half-power equation gives the exact width; when F<1 the trough never reaches half power, so no isolated half-maximum width exists. At F=1 the limiting half-power points are the neighboring troughs.`,
 caption:'Increase reflectivity to sharpen the resonance, then change phase and the number of retained transmitted beams. Compare the finite phasor sum with the exact Airy curve.',
 scope:'Identical lossless mirrors with frequency-independent reflectance and a single aligned plane-wave mode. δ is the full round-trip phase. The phasor truncation error is an amplitude bound, not a bound on measured intensity error. No two-line resolving experiment is simulated.',
 deps:['waves-6.1','waves-4.11'],refs:['Fang Lecture11, pp6–7, Eqs26–37, Fabry–Pérot sum','Van Exter, printed 15–18, Airy transmission and finesse'],links:{source:FANG,cavity:EXTER},viz:U.fabry},
 {num:'6.11',kind:'Method',name:'Dielectric mirrors (Bragg stacks)',
 statement:String.raw`A stack of N high–low index pairs, each a quarter wave thick at $\lambda_0$, coherently reflects light near its design frequency. At normal incidence from index 1 onto substrate $n_s$, let $q=n_H/n_L$ and $Y=n_s q^{2N}$. Then
 $$R(\lambda_0)=\left(\frac{1-Y}{1+Y}\right)^2.$$
 For an infinite periodic continuation with frequency ratio $f=\nu/\nu_0$, put $\delta=\pi f/2$. Half the unit-cell matrix trace is
 $$a=\cos^2\delta-\tfrac12(q+q^{-1})\sin^2\delta.$$
 The propagation eigenvalues leave the unit circle when $|a|>1$. The central infinite-stack stopband has edges
 $$f_\pm=1\pm\frac2\pi\arcsin\frac{|n_H-n_L|}{n_H+n_L}.$$
`,
 idea:String.raw`Continuity of tangential electric and magnetic fields gives each lossless layer a unit-determinant transfer matrix. At quarter wave it maps the load admittance to n² divided by that load; applying this to N high–low pairs gives Y. Multiplying one pair at a general frequency gives the trace above. The characteristic equation $z^2-2az+1=0$ distinguishes propagating from evanescent Bloch factors; solving $|a|=1$ gives the band edges.`,
 caption:'Add layer pairs and change index contrast. Compare the actual finite-stack reflectance with the infinite periodic stopband and the independent design-wavelength formula.',
 scope:'Real positive nondispersive indices, normal incidence and no absorption. Layers start with the high index on the incident side, and the substrate index is 1.5. The calculation sums every interface reflection; the layer drawing is schematic. An infinite periodic stopband does not imply exactly zero transmission through a finite stack.',
 deps:['waves-6.10','waves-3.10'],refs:['Macleod, pp13–16, quarter-wave multilayer reflectors','Unit-cell trace and finite-stack impedance formulas derived here'],links:{source:FILM},viz:U.bragg},
 {num:'6.12',kind:'Definition',name:'Temporal coherence',
 statement:String.raw`For a scalar stationary complex field E with finite nonzero mean intensity, define
 $$g^{(1)}(\tau)=\frac{\langle E^*(t)E(t+\tau)\rangle}{\langle|E(t)|^2\rangle}.$$
 Its modulus bounds the visibility of delayed copies and equals that visibility for equal beam intensities without background. Under a mutually uncorrelated frequency-component model with normalized spectral measure S,
 $$g^{(1)}(\tau)=\int e^{-2\pi i\nu\tau}\,dS(\nu).$$
 After removing the carrier phase, a Gaussian frequency distribution with rms width σ has envelope $e^{-2\pi^2\sigma^2\tau^2}$. A uniform band of full width B gives $\operatorname{sinc}(\pi B\tau)$, where $\operatorname{sinc}x=\sin x/x$.`,
 idea:String.raw`Expand the two delayed fields in their frequency components. Cross terms between uncorrelated components average to zero, leaving each component's delay phasor weighted by its spectral power. Integrating a Gaussian or a uniform interval gives the stated envelopes. Cauchy–Schwarz bounds the normalized correlation by one. A negative envelope changes the fringe phase; its absolute value remains the visibility.`,
 caption:'Choose Gaussian or rectangular spectral shape, change bandwidth and delay, and compare signed envelope coherence with the phase-scan visibility.',
 scope:'Stationary scalar envelope model with a500 THz carrier. The Gaussian detuning law is an ideal envelope extending over all real detunings; it is not an exactly positive-frequency optical spectrum or a finite-energy pulse. The width conventions differ between shapes. Coherence length depends on a chosen criterion, not a universal hard cutoff.',
 deps:['waves-6.3','waves-2.10'],refs:['Fang Lecture11, pp2–4, temporal correlation and spectra','Van Exter, printed 21–23, coherence time and spectral distribution'],links:{source:FANG,coherence:EXTER},viz:U.temporal},
 {num:'6.13',kind:'Method',name:'Fourier-transform spectroscopy',
 statement:String.raw`For mutually incoherent monochromatic lines of frequencies $\nu_j>0$ and weights $w_j>0$, an ideal balanced interferometer records
 $$W_0=\sum_jw_j,$$
 $$2I(\tau)=W_0+C(\tau).$$
 Twice its DC-subtracted signal is
 $$C(\tau)=\sum_jw_j\cos(2\pi\nu_j\tau).$$ A finite even scan window W produces the normalized line-height estimate
 $$h_\nu(\tau)=W(\tau)C(\tau)\cos(2\pi\nu\tau),$$
 $$Z=\int_{-T}^T W(\tau)\,d\tau,$$
 $$\widehat w(\nu)=\frac2Z\int_{-T}^T h_\nu(\tau)\,d\tau.$$
 Finite windows broaden each line and mix neighboring contributions. Rectangular scanning has first-null frequency offset $1/(2T)$; the actual sampled record also has a Nyquist limit.`,
 idea:String.raw`The product-to-sum identity
 $$\begin{aligned}2\cos a\cos b&=\cos(a-b)\\&\quad+\cos(a+b)\end{aligned}$$
reduces the estimate to shifted transforms of W, centered on both signs of each input frequency. For a rectangle these are sinc kernels; for a Hann window they are a weighted sum of three shifted kernels. Thus finite scanning does not recover delta functions exactly. The implementation applies trapezoidal weights directly to the recorded samples; no prerequisite spectral theorem is assumed available.`,
 caption:'Enter one to six spectral lines, vary scan length and switch windows. Compare input weights with the finite signed reconstruction and the actual central interferogram samples.',
 scope:'Deterministic line spectrum, noiseless intensity, DC subtraction and uniform delay sampling. Frequencies are350–650 THz; positive weights are at most 4. The plotted interferogram is a central 12 fs crop, while the transform uses the full scan. Window-integral normalization estimates isolated line heights, not a nonnegative power spectral density. A Hann window reduces distant sidelobes while broadening the main lobe.',
 deps:['waves-6.12','sig-13.3'],refs:['Fang Lecture11, pp3–4, interferogram and Fourier-transform spectroscopy','Finite-window cosine identity, discrete quadrature and normalization derived here','Syllabus guide: Hecht ch.12 (book body not consulted)'],links:{source:FANG},viz:U.spectroscopy},
 {num:'6.14',kind:'Theorem',name:'Spatial coherence (van Cittert–Zernike)',
 statement:String.raw`Consider a distant, quasimonochromatic, spatially incoherent planar source with integrable nonnegative angular brightness $B(\boldsymbol\alpha)$ and positive total brightness. In the paraxial far field, after removing a reference propagation phase, the normalized mutual coherence at baseline $\mathbf b$ is
 $$\gamma(\mathbf b)=\frac{\int B(\boldsymbol\alpha)e^{-2\pi i\mathbf b\cdot\boldsymbol\alpha/\lambda}\,d^2\alpha}{\int B(\boldsymbol\alpha)\,d^2\alpha}.$$
 Equal-intensity fringe visibility is $|\gamma|$. A uniform strip of angular width θ along the baseline gives $\operatorname{sinc}(\pi b\theta/\lambda)$. A uniform circular disk of angular diameter θ gives $2J_1(x)/x$, with $x=\pi b\theta/\lambda$ and value1 at zero.`,
 idea:String.raw`Each source direction contributes a plane wave with a baseline-dependent phase. On multiplying the fields at two receivers, mutual incoherence removes cross terms between distinct source elements. The remaining source integral is its Fourier transform, divided by total intensity. For a disk, angular integration gives a Bessel integral; radial integration gives $2J_1(x)/x$. The code evaluates that integral rather than approximating the disk by a few coherent points.`,
 caption:'Switch between an incoherent strip and disk, then vary the baseline. See how a sign change in coherence shifts the phase scan while visibility stays nonnegative.',
 scope:'Scalar narrow-band far-field propagation with spatially incoherent source points and equal receiver intensities. Near-field curvature, partial source coherence, polarization and finite receiver apertures require modified formulas. The plotted source is the projected one-dimensional brightness, normalized to unit integral.',
 deps:['waves-6.12','waves-6.2'],refs:['Van Exter, printed 23–25, spatial coherence and van Cittert–Zernike','Fang Lecture11, pp4–5, source extent and two-aperture coherence'],links:{source:EXTER,interference:FANG},viz:U.spatial},
 {num:'6.15',kind:'Phenomenon',name:'Stellar interferometry',
 statement:String.raw`For an unresolved, uniformly bright circular star of angular diameter θ observed monochromatically with point receivers separated by baseline B, the ideal fringe visibility is
 $$x=\frac{\pi B\theta}{\lambda},$$
 $$V(B)=\left|\frac{2J_1(x)}x\right|.$$
 The first zero of $J_1$ is approximately 3.831706, so the first visibility null occurs at
 $$B_0\simeq1.21967\,\frac{\lambda}{\theta}.$$
 Identifying that first null estimates the diameter within the uniform-disk model. A visibility measurement at a single unspecified lobe need not determine a unique diameter.`,
 idea:String.raw`Apply the spatial-coherence theorem to a disk. Changing baseline samples different spatial frequencies of its brightness distribution. The first Bessel zero fixes a dimensionless product $B\theta/\lambda$, giving the diameter relation. The later lobes carry structural information, but interpreting them depends on the brightness model and correct lobe identification.`,
 caption:'Change stellar angular diameter, wavelength and physical baseline. Locate the first null and follow the weaker visibility lobes beyond it.',
 scope:'A uniform monochromatic disk observed with ideal point receivers. No limb darkening, binary structure, atmosphere, bandwidth smearing, telescope aperture averaging or measurement noise is included. The star and baseline drawing is schematic; the graph uses actual meters and milliarcseconds.',
 deps:['waves-6.14'],refs:['Van Exter, printed 24–25, uniform-disk coherence and stellar diameter; angular diameter is physical diameter/distance','Syllabus guide: Hecht ch.12 (book body not consulted)'],links:{source:EXTER},viz:U.stellar},
 {num:'6.16',kind:'Phenomenon',name:'Hanbury Brown–Twiss intensity correlations',
 statement:String.raw`For intensities $I_1,I_2$ with positive means, define
 $$g^{(2)}_{12}(\tau)=\frac{\langle I_1(t)I_2(t+\tau)\rangle}{\langle I_1\rangle\langle I_2\rangle}.$$
 If the underlying fields are jointly stationary, zero-mean and proper complex Gaussian, their fourth moments give the Siegert relation
 $$g^{(2)}_{12}(\tau)=1+|g^{(1)}_{12}(\tau)|^2.$$
 Averaging M independent equally weighted intensity modes reduces the excess by M. In the sampled model, $g^{(1)}_{12}(\tau)=\gamma e^{-|\tau|/\tau_c}$, so $g^{(2)}_{12}=1+|\gamma|^2e^{-2|\tau|/\tau_c}/M$.`,
 idea:String.raw`For proper Gaussian variables, pairing the four field factors yields the product of mean intensities plus the squared field covariance; the pairing of two unconjugated fields vanishes. Independent modes contribute no excess cross-covariance, giving the factor 1/M. Stationary complex Gaussian AR(1) histories realize the specified exponential temporal correlation. Actual lagged products of their squared magnitudes estimate the correlation from a finite record.`,
 caption:'Change separation, coherence time, mode count, seed and record length. Compare two actual intensity histories and their sampled correlation with the ensemble prediction; contrast constant intensity.',
 scope:'Classical Gaussian fluctuating fields at discrete sample times. The sample normalization uses estimated means and is biased at finite record length. This is not a photon-click, shot-noise or antibunching simulation; the Gaussian relation is not universal for arbitrary light. Independent polarizations or other detected modes reduce the ideal bunching contrast.',
 deps:['waves-6.14'],refs:['Aspect, arXiv2005.08239v1, §§2.1–2.3, printed 4–7, Eqs2,6,7','Van Exter, printed 25, intensity interferometry; normalized denominator corrected to product of means'],links:{source:ASPECT,coherence:EXTER},viz:U.hbt},
 {num:'6.17',kind:'Paper',name:'Experiments and calculations relative to physical optics',
 paper:{authors:'Thomas Young',year:1804,title:'The Bakerian Lecture: Experiments and calculations relative to physical optics',venue:'Philosophical Transactions of the Royal Society of London 94: 1–16',doi:'10.1098/rstl.1804.0001'},
 introduces:['waves-6.2'],
 statement:String.raw`Young's 1804 lecture describes fringes within the shadow of a narrow card in a sunbeam and the disappearance of the joint pattern when either contributing edge is screened. It uses interference to compare optical path differences across several experiments, while discussing uncertainty in the assumed ray paths. The first experiment is a card-shadow experiment, not the now-standard double-slit arrangement.

The visualization is a modern scalar reconstruction: a monochromatic plane wave passes an infinite opaque strip of half-width a and propagates a distance z. Define $F(u)=\int_0^u e^{i\pi s^2/2}\,ds$ and
 $$u_\pm=(\pm a-x)\sqrt{\frac{2}{\lambda z}}.$$
 Its normalized edge contributions are
 $$E_L=\frac{(1+i)/2+F(u_-)}{1+i},$$
 $$E_R=\frac{(1+i)/2-F(u_+)}{1+i}.$$
 Both open regions give intensity $|E_L+E_R|^2$, including their interference cross term.`,
 idea:String.raw`The paraxial propagation kernel integrates separately over the two open half-planes. Substitute the dimensionless Fresnel coordinate; the full unobstructed integral is 1+i. The resulting fields add before taking their squared modulus. Removing one half-plane removes the cross term between the two sides, although a single edge still diffracts. This explains the role of two contributions without claiming to reproduce Young's diverging illumination or downstream screening geometry.`,
 caption:'Change card width, propagation distance and wavelength, and remove either contributing side. Compare the coherent shadow pattern with the sum of separate edge intensities.',
 scope:'Historical reading covers printed pp 1–8 before a later direct-source 403 stop. Numerical table entries were not verified, and no wavelength table is presented as Young’s data. The reconstruction assumes monochromatic plane illumination, a thin infinite strip, scalar paraxial Fresnel propagation and observation coordinates small compared with z. Its tint shows calculated intensity, not a historical measurement.',
 deps:['waves-4.4','waves-6.1'],refs:['Young 1804, printed1–8, §§I–II, actual reading before subsequent direct-source access stop','Modern plane-wave strip reconstruction derived here; original table numerals not verified'],links:{paper:'https://doi.org/10.1098/rstl.1804.0001'},viz:U.young}
 ]
};
