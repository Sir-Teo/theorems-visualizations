import * as UI from './ch06.ui.shared.js';
const identities=[
 {
  "num": "6.1",
  "kind": "Phenomenon",
  "name": "Diffraction by a grating",
  "deps": [
   "pma-8.10",
   "waves-7.9"
  ]
 },
 {
  "num": "6.2",
  "kind": "Law",
  "name": "Bragg’s law",
  "deps": [
   "xtal-4.4"
  ]
 },
 {
  "num": "6.3",
  "kind": "Theorem",
  "name": "Laue equations",
  "deps": [
   "xtal-6.1",
   "xtal-1.2"
  ]
 },
 {
  "num": "6.4",
  "kind": "Theorem",
  "name": "Bragg and Laue conditions are equivalent",
  "deps": [
   "xtal-6.2",
   "xtal-6.3",
   "xtal-5.2"
  ]
 },
 {
  "num": "6.5",
  "kind": "Method",
  "name": "Ewald sphere construction",
  "deps": [
   "xtal-6.4"
  ]
 },
 {
  "num": "6.6",
  "kind": "Concept",
  "name": "Limiting sphere and resolution",
  "deps": [
   "xtal-6.5"
  ]
 },
 {
  "num": "6.7",
  "kind": "Method",
  "name": "Laue method",
  "deps": [
   "xtal-6.5"
  ]
 },
 {
  "num": "6.8",
  "kind": "Method",
  "name": "Powder diffraction and Debye–Scherrer cones",
  "deps": [
   "xtal-6.5",
   "xtal-4.6"
  ]
 },
 {
  "num": "6.9",
  "kind": "Law",
  "name": "Moseley’s law and characteristic X-rays",
  "deps": [
   "qchem-2.9"
  ]
 },
 {
  "num": "6.10",
  "kind": "Law",
  "name": "Scherrer equation for crystallite size",
  "deps": [
   "xtal-6.8",
   "xtal-6.1"
  ]
 },
 {
  "num": "6.11",
  "kind": "Paper",
  "name": "Interferenzerscheinungen bei Röntgenstrahlen",
  "deps": [
   "xtal-1.1",
   "waves-7.9"
  ],
  "paper": {
   "authors": "W. Friedrich, P. Knipping and M. Laue",
   "year": 1913,
   "title": "Interferenzerscheinungen bei Röntgenstrahlen",
   "venue": "Annalen der Physik 346 (10): 971–988",
   "doi": "10.1002/andp.19133461004"
  },
  "introduces": [
   "xtal-6.3",
   "xtal-6.7"
  ]
 },
 {
  "num": "6.12",
  "kind": "Paper",
  "name": "The Diffraction of Short Electromagnetic Waves by a Crystal",
  "deps": [
   "xtal-6.3",
   "xtal-4.2",
   "xtal-6.11"
  ],
  "paper": {
   "authors": "W. L. Bragg",
   "year": 1913,
   "title": "The Diffraction of Short Electromagnetic Waves by a Crystal",
   "venue": "Proceedings of the Cambridge Philosophical Society 17: 43–57",
   "url": "https://archive.org/details/proceedingsofcam1718191316camb"
  },
  "introduces": [
   "xtal-6.2",
   "xtal-6.4",
   "waves-7.10"
  ]
 },
 {
  "num": "6.13",
  "kind": "Paper",
  "name": "The high-frequency spectra of the elements",
  "deps": [
   "xtal-6.2",
   "qm-1.5",
   "xtal-6.12",
   "qm-1.16"
  ],
  "paper": {
   "authors": "H. G. J. Moseley",
   "year": 1913,
   "title": "The high-frequency spectra of the elements",
   "venue": "Philosophical Magazine (6th series) 26 (156): 1024–1034",
   "doi": "10.1080/14786441308635052"
  },
  "introduces": [
   "xtal-6.9"
  ]
 }
];
const geometry='https://journals.iucr.org/j/issues/2018/06/00/gj5217/';
const collectionNotes='https://journals.iucr.org/d/issues/1999/10/00/ba0020/';
const originalMoseley='https://zenodo.org/record/1430926/files/article.pdf';
const widthSource='https://journals.iucr.org/j/issues/2024/05/00/oc5037/';
const tubeSource='https://ocw.mit.edu/courses/8-13-14-experimental-physics-i-ii-junior-lab-fall-2016-spring-2017/117b61a707a6de754e07b60c28b38665_MIT8_13-14F16-S17exp31.pdf';
const lessons=[
{
 statement:String.raw`For N equally spaced identical coherent slits at normal incidence, put u=d sin θ/λ, with slit separation d and wavelength λ. With equal illumination and negligible slit width, the intensity relative to a principal maximum is
$$I_N(u)=\left|\frac1N\sum_{j=0}^{N-1}e^{2\pi iju}\right|^2.$$
For noninteger u this equals $[\sin(N\pi u)/(N\sin\pi u)]^2$; at integers its continuous value is 1. Principal maxima occur at integer u. For N≥2 there are N−1 zeros and N−2 subsidiary maxima strictly between consecutive principal maxima. A nonzero rectangular slit width w multiplies this array factor by $\operatorname{sinc}^2(\pi wu/d)$, where sinc x=sin x/x.`,
 idea:String.raw`Successive slits have phase difference 2πu. Multiply the finite sum by $1-e^{2\pi iu}$ and cancel all interior terms to obtain the sine quotient; at an integer every phasor is identical. Its zeros divide each inter-order interval into N−2 interior lobes, each with one maximum. The Fourier viewpoint of PMA 8.10 explains why coherent amplitudes, rather than individual intensities, are added. The planned WAVES 7.9 dependency is supplied here by this local finite-sum argument.`,
 scope:String.raw`Far-field scalar diffraction, equal coherent illumination and a finite one-dimensional array. The subsidiary count concerns the bare array factor on a complete interval, before a slit envelope or angular cutoff removes lobes. N=1 has no grating-order structure.`,
 caption:String.raw`Change the slit count, phase and slit width. Follow the actual phasor polygon and the selected intensity; narrow principal peaks retain unit array-factor height.`,
 refs:['Hammond ch. 7; finite geometric sum derived locally'],links:{geometry},tags:['grating','coherence'],viz:UI.grating,
},
{
 statement:String.raw`For elastic scattering by parallel lattice phase planes of spacing d, constructive interference in a specular direction requires
$$2d\sin\theta=m\lambda.$$
Here m is a positive integer.
The glancing angle θ is measured from the planes; the angle between incident and outgoing propagation directions is 2θ. An order is geometrically possible only when mλ≤2d. A finite stack of N equally scattering planes has the array factor $I_N(2d\sin\theta/\lambda)$, so its maxima have finite width.`,
 idea:String.raw`Use the plane spacing from XTAL 4.4. Comparing paths scattered at consecutive planes adds d sin θ on entry and d sin θ on exit. Equal phase requires their sum to be a whole number of wavelengths. For finitely many planes, summing their phase-shifted amplitudes yields a peak rather than an infinitely narrow selection rule. Order zero is the direct forward beam.`,
 scope:String.raw`Kinematic elastic geometry with monochromatic radiation. Plane geometry specifies positions; a motif, centering, polarization or multiple scattering can change or remove intensity. Higher order m for primitive (hkl) is first order at (mh,mk,ml); do not also multiply that indexed spacing by m.`,
 caption:String.raw`Rotate the plane stack and change wavelength, spacing and order. Compare the two path contributions with the computed finite-stack intensity and the accessible Bragg angle.`,
 refs:['Hammond ch. 8','Moseley (1913), printed p.1026, equation (1)'],links:{source:originalMoseley},tags:['Bragg geometry','finite stack'],viz:UI.bragg,
},
{
 statement:String.raw`Let a₁,a₂,a₃ be an invertible direct-lattice basis. Use wavevectors in cycles per length, with $|\mathbf k|=|\mathbf k'|=1/\lambda$. Lattice translations reinforce when
$$\mathbf a_j\cdot(\mathbf k'-\mathbf k)=n_j\in\mathbb Z.$$
Equivalently, $\mathbf k'-\mathbf k=\sum_jn_j\mathbf b_j$, where $\mathbf a_i\cdot\mathbf b_j=\delta_{ij}$. For a fixed incident unit direction s and index nⱼ, the allowed outgoing unit directions satisfy $\mathbf a_j\cdot\mathbf s'=\mathbf a_j\cdot\mathbf s+\lambda n_j$. Each is a circle on the unit sphere, a tangent point, or empty. Three integer conditions alone do not guarantee elastic scattering.`,
 idea:String.raw`XTAL 1.2 supplies translations by arbitrary integer combinations of the direct basis. The grating sum in 6.1 requires integral phase difference along each basis direction. Invert the pairing matrix to recover the actual dual basis, including for a skew cell. A row's scalar condition cuts the outgoing unit sphere by a plane; its circle of directions generates the corresponding Laue cone. The candidate k+g must still lie on the elastic sphere.`,
 scope:String.raw`An infinite translation array gives the exact selection rule; a finite array broadens it. The cones are actual sections of the outgoing direction sphere. Their intersection may be empty at the selected wavelength. Motif extinctions remain a separate condition.`,
 caption:String.raw`Skew the cell and change the wavelength or indices. Rotate the three true row cones and inspect the elastic residual; tune to the computed positive wavelength to make them meet.`,
 refs:['Hammond ch. 8; dual-basis and sphere-section derivation'],links:{geometry},tags:['Laue equations','reciprocal basis'],viz:UI.laue,
},
{
 statement:String.raw`For a nonzero reciprocal vector g, elastic scattering with $\mathbf k'=\mathbf k+\mathbf g$ is equivalent to
$$2\mathbf k\cdot\mathbf g+|\mathbf g|^2=0.$$
Writing d=1/|g| and θ for the glancing angle to its phase planes gives $2d\sin\theta=\lambda$. Thus Bragg and Laue describe the same geometric condition, using the crystallographic reciprocal convention without 2π. This equivalence does not assert nonzero structure factor.`,
 idea:String.raw`Square the Laue vector relation and cancel |k|². At an elastic solution g points between two equal-length wavevectors, so its normal component is twice the incident normal component in magnitude. The reciprocal spacing from XTAL 5.2 then converts the vector identity into Bragg's path condition. For a noncoprime index, d is the indexed phase-plane spacing; an extra order factor would count the same multiplier twice.`,
 scope:String.raw`Nonzero indexed reciprocal vectors and elastic scattering; a centered conventional cell also needs reciprocal-lattice membership. Away from the solution, the plotted k+g is a candidate whose length need not be 1/λ.`,
 caption:String.raw`Switch between plane and vector pictures of one candidate reflection. Change the angle and compare both residuals; the exact Bragg setting makes both vanish together.`,
 refs:['Hammond ch. 8','Barbour (2018), selected reciprocal/Ewald construction'],links:{geometry},tags:['Bragg–Laue equivalence'],viz:UI.equivalence,
},
{
 statement:String.raw`Fix the incident wavevector k with length 1/λ. In reciprocal coordinates with the lattice origin at zero, the Ewald sphere has centre −k and radius 1/λ. A reciprocal point g satisfies elastic diffraction exactly when
$$|\mathbf g+\mathbf k|=1/\lambda.$$
The outgoing wavevector is k+g. Rotating the crystal rotates its reciprocal lattice; changing wavelength changes both sphere centre and radius.`,
 idea:String.raw`Rewrite the equal-length condition of 6.4 as the equation of a sphere through zero. The centre-to-point segment is the outgoing wavevector in reciprocal space. A physical diffracted ray instead starts at the real crystal. The workshop rotates a cubic reciprocal patch and computes each point's signed radial distance to the actual sphere.`,
 scope:String.raw`The displayed index cube is finite, with |h|,|k|,|l|≤3. A chosen Gaussian reciprocal-point width is an illustrative excitation profile, not an exact reflection count or a measured integrated intensity. Zero width selects exact intersections only; 000 is excluded from the reflection patch.`,
 caption:String.raw`Rotate the reciprocal lattice, resize the sphere with wavelength, and vary the declared point width. Compare the nearest point's radial residual with its computed excitation weight.`,
 refs:['Hammond ch. 8','Giacovazzo ch. 3','Barbour (2018), selected §2.3'],links:{geometry},tags:['Ewald sphere','reciprocal space'],viz:UI.ewald,
},
{
 statement:String.raw`For monochromatic elastic diffraction, any accessible reciprocal vector must satisfy |g|≤2/λ. Conversely, every nonzero reciprocal vector within this limiting sphere can be brought onto an Ewald sphere by some crystal orientation. Since d=1/|g|, the all-orientation geometric limit is d≥λ/2. A maximum recorded scattering angle 2θₘ reduces the radius to $2\sin\theta_m/\lambda$.`,
 idea:String.raw`A chord between two points on a sphere of radius 1/λ cannot exceed its diameter. Conversely, a chord of any length up to that diameter can be oriented between equal-length incident and outgoing wavevectors. For the cubic example, each coordinate of a point in the limiting sphere is bounded by its radius, so the index cube with N=ceil(2/λ) contains every candidate. Count the nonzero points in this complete cube, rather than an arbitrary truncated patch.`,
 scope:String.raw`Counts are oriented nonzero reciprocal vectors for a primitive cubic cell of edge 1 Å. They are geometric candidates over all orientations, without symmetry merging, extinction, intensity threshold or current-orientation sampling. The angle-limited count assumes detector coverage at every azimuth up to its stated angle. Points too close to a generic numerical angular cutoff are listed as unresolved instead of assigned to the inside count.`,
 caption:String.raw`Shorten the wavelength and change the angular aperture. Compare the complete limiting-sphere count with the smaller detector-angle count and the two minimum spacings.`,
 refs:['Hammond ch. 8; chord and finite enumeration argument'],links:{geometry},tags:['resolution','limiting sphere'],viz:UI.resolution,
},
{
 statement:String.raw`In white-beam Laue diffraction, fix the incident unit direction s and crystal orientation. A nonzero reciprocal vector g selects the unique possible wavelength
$$\lambda_g=-\frac{2\mathbf s\cdot\mathbf g}{|\mathbf g|^2}.$$
It contributes only if λg is positive, inside the incident band, and has nonzero structure amplitude. Its outgoing unit direction is s′=s+λg g. For a forward plane x=D, projection is (D s′ᵧ/s′ₓ,D s′z/s′ₓ) only when s′ₓ>0.`,
 idea:String.raw`Insert k=s/λ in the Ewald equation of 6.5 and solve for λ. The resulting unit outgoing direction supplies an actual detector intersection. Backward and grazing rays cannot be projected as forward spots. Collinear reciprocal vectors can select different wavelengths yet land at the same film location, so a spot need not identify a single wavelength.`,
 scope:String.raw`A finite |h|,|k|,|l|≤4 patch, a uniform wavelength band and an ideal square forward detector. Distinct reflections may overlap. The point weights omit atomic form factors, absorption, polarization, spectrum variation and detector response; no experimental intensities or complete Laue indexing are claimed.`,
 caption:String.raw`Rotate a stationary crystal, adjust the wavelength band and move the film. Inspect the wavelengths and unit-ray residual of reflections that actually reach the detector.`,
 refs:['Hammond ch. 8','Dauter (1999), selected §2.1; wavelength solved locally'],links:{source:collectionNotes},tags:['white-beam Laue','detector projection'],viz:UI.white,
},
{
 statement:String.raw`For randomly oriented cubic crystallites, $d_{hkl}=a/\sqrt{h^2+k^2+l^2}$ and a geometrically accessible family scatters at $2\theta=2\arcsin(\lambda/(2d_{hkl}))$. Rotations about the incident direction sweep a Debye–Scherrer cone of half-angle 2θ. A perpendicular forward film at distance D records a ring of radius D tan(2θ) only when 2θ<90°. Centering and motif factors can extinguish a family even when its Bragg angle exists.`,
 idea:String.raw`The Ewald construction fixes the angle but a powder supplies every crystal orientation, so the outgoing directions fill an azimuthal circle. Count the oriented cubic normal orbit using XTAL 4.6, including distinct signs. For constant identical scatterers the model weight is multiplicity times squared centering amplitude: SC allows all indices, BCC requires even h+k+l, and FCC requires indices all of the same parity. Families with the same squared length overlap in the radial pattern.`,
 scope:String.raw`This finite example includes h²+k²+l²≤32, ideal random orientations and constant scattering factors. Its chosen Gaussian peak width and weights are illustrative; they omit Lorentz/polarization factors, texture, absorption and instrument calibration. A back-angle peak may exist in the 1D list while missing the forward film.`,
 caption:String.raw`Choose SC, BCC or FCC and change wavelength and cell edge. Select a family to compare its actual cone angle, multiplicity, extinction and forward-film ring.`,
 refs:['Hammond ch. 10; cubic orbit, centering and cone geometry derived locally'],links:{geometry},tags:['powder diffraction','Debye–Scherrer cone'],viz:UI.powder,
},
{
 statement:String.raw`Moseley's empirical observation is that the square root of a characteristic-series frequency is approximately affine in atomic number. A shielded hydrogenic Kα model gives
$$h\nu_\alpha\approx\tfrac34 R_y(Z-\sigma)^2,$$
with energy Rᵧ≈13.6057 eV and effective screening σ. This extends the one-electron Z² scaling of QCHEM 2.9 as an approximation, not an exact many-electron law. An electron accelerated through voltage V has energy eV, so the continuum photon energy cannot exceed eV; creating a K vacancy requires exceeding its binding threshold.`,
 idea:String.raw`Subtract the hydrogenic n=2 and n=1 levels with the same effective charge to obtain the factor 3/4. Taking a square root gives a straight line only within this fixed-screening approximation. The energy-window panel displays allowed continuum photon energies, without inventing a continuum spectral shape, and switches the model Kα marker on only above the model K-shell threshold.`,
 scope:String.raw`The tube uses one effective charge for both shells, a model binding threshold and no fine structure. It predicts neither line yield nor intensity. A real Kα doublet, shell-dependent screening, relativistic corrections and absorption produce departures. Historical measurements and fit residuals are shown separately in 6.13.`,
 caption:String.raw`Change target atomic number, screening and accelerating voltage. Compare the model Kα energy, K-vacancy threshold and continuum cutoff with the square-root frequency line.`,
 refs:['Hammond ch. 9','Moseley (1913), printed pp.1030–1033','MIT X-Ray Physics lab, selected pp.1–2'],links:{historical:originalMoseley,teaching:tubeSource},tags:['Moseley law','characteristic X-rays'],viz:UI.moseley,
},
{
 statement:String.raw`For a specified coherent-domain shape and width convention, size broadening is approximated by $\beta_{size}=K\lambda/(L\cos\theta)$, with β the width in radians of 2θ. For an N-plane uniform stack, the normalized array factor has half-height at ±u₁/₂ about a principal order. Defining L=Nd gives $K_N=2Nu_{1/2}$; its large-N limit is approximately 0.885893 for this profile. The geometrical extent is (N−1)d.`,
 idea:String.raw`Solve the finite-grating half-height equation from 6.1, then linearize the phase-to-angle conversion about a Bragg peak. This produces the Scherrer inverse-length law; K changes with shape and width definition. In a declared Cauchy size/strain model, sample widths add: βsize+4ε tan θ. After subtracting a Cauchy instrumental width, $\beta_{sample}\cos\theta=K\lambda/L+4\epsilon\sin\theta$. Gaussian component widths instead combine in quadrature and generally do not give this straight Williamson–Hall line.`,
 scope:String.raw`The first panel computes the actual finite-stack profile and half-height. The second is a separately declared isotropic broadening model using the large-N stack K; choosing Gaussian profiles deliberately breaks the Cauchy line. Exact angular FWHM is for the reference stack's first Bragg order, and is unavailable if either half-height falls beyond grazing. Coherent-domain size is not necessarily particle or agglomerate size.`,
 caption:String.raw`Shrink the coherent stack, add microstrain and choose the profile convention. Compare exact half-height points, the finite-N shape factor and the actual corrected Williamson–Hall coordinates.`,
 refs:['Hammond ch. 10','Gesing and Robben (2024), selected size/width discussion; finite-stack calculation derived locally'],links:{source:widthSource},tags:['Scherrer equation','Williamson–Hall'],viz:UI.scherrer,
},
{
 statement:String.raw`Friedrich, Knipping and Laue's 1913 Annalen paper belongs to the early work connecting crystal periodicity with X-ray interference. The workshop here is a modern calculation for a zinc-blende motif, separate from an original photographic plate or its measured intensities. For conventional cubic indices the amplitude is
$$F=C_{FCC}\,[f_a+f_b e^{\pi i(h+k+l)/2}].$$
The FCC factor vanishes for mixed parity. When fₐ≠fᵦ, the additional h+k+l=4m+2 extinction of equal-scatterer diamond does not generally hold.`,
 idea:String.raw`XTAL 1.1 supplies the repeating crystal structure, and the local coherent phase sum supplies the planned WAVES 7.9 input. Sum the four FCC translations and the two-atom basis at 0 and (1/4,1/4,1/4). Apply the white-beam wavelength equation separately to every indexed reciprocal vector, then project only forward rays. This computes a symmetry pattern without treating every geometrically allowed reflection as equally strong.`,
 scope:String.raw`Original paper body and plate were not used. The finite patch uses real constant relative factors fₐ=1 and adjustable fᵦ, not measured angle-dependent Zn and S form factors. Setting fᵦ=1 tests the equal-scatterer diamond limit; it is not a zinc-blende parameter fit. Overlapping wavelengths remain separate indexed contributions.`,
 caption:String.raw`Turn the cubic axis toward the beam and vary the two scattering factors. Watch the computed Laue pattern and compare the 200 and 220 motif amplitudes.`,
 refs:['Friedrich, Knipping and Laue (1913), historical bibliography; original body not used','Modern finite translation/motif sum derived locally'],links:{geometry},tags:['Laue (1913)','zinc blende'],viz:UI.lauePaper,
},
{
 statement:String.raw`Bragg's 1913 paper explains crystal diffraction using reflection geometry from lattice planes. This modern workshop compares that geometry with the translation factors of simple-cubic and face-centred-cubic arrays. For a selected conventional (hkl), both models use the same indexed d-spacing and white-beam Bragg wavelength; FCC mixed-parity reflections have zero centering amplitude. Bragg's law alone does not produce that extinction.`,
 idea:String.raw`The Laue vector equation and the cubic geometry of XTAL 4.2 determine the wavelength for a chosen oriented plane normal. Reexpress it as λ=2d sin θ, using d=1/|g| once. Add the motif sum introduced in 6.11 to test whether an actual amplitude survives. Comparing 100 with 200 separates an absent FCC translation factor from a higher-order geometric solution.`,
 scope:String.raw`The historical bibliography and book URL are preserved, while the original paper body and plate are not used. This is a finite modern SC/FCC constant-scatterer calculation. It does not reconstruct the original zinc-blende exposures or infer absolute intensities from geometry. Indexed phase planes need not all be occupied lattice planes.`,
 caption:String.raw`Select a plane and rotate the crystal. Compare its selected wavelength, angle and amplitude in SC and FCC, then inspect the associated forward-film pattern.`,
 refs:['W. L. Bragg (1913), historical bibliography; original body not used','Barbour (2018), selected reciprocal/Ewald construction; independent centering sum'],links:{geometry},tags:['Bragg (1913)','systematic absences'],viz:UI.braggPaper,
},
{
 statement:String.raw`Moseley's 1913 Part I reports ten measured elements between calcium and zinc in Table I, printed p.1028; scandium is an unmeasured gap. The second- and third-order α wavelengths are separate measurements in units 10⁻⁸ cm, equal to Å. Converting each to ν=c/λ makes √ν approximately linear in atomic number. Cobalt precedes nickel by atomic number even though their tabulated atomic weights are 58.97 and 58.68.`,
 idea:String.raw`Bragg geometry in 6.2 and 6.12 converts the measured reflection angles into wavelengths. Photon frequency from QM 1.5 then supplies the square-root plot; QM 1.16 explains the hydrogenic comparison, rather than making the paper's historical electron-ring interpretation current theory. The workshop transcribes both α columns from the inspected table and fits y=√(ν/10¹⁸ Hz)=aZ+b by ordinary least squares. The residual plot retains departures from the line. Weight-rank order swaps Co and Ni while retaining the Sc gap.`,
 scope:String.raw`Data are the printed 1913 values, not modern calibrated Kα₁ or Kα₂ wavelengths. No scandium datum is fabricated. The fit uses modern exact c with historically rounded/calibrated wavelengths and supplies no invented measurement uncertainties. Its fitted −b/a is descriptive screening, not an exact shell charge. This Part I is distinct from the later Part II beginning at printed p.703.`,
 caption:String.raw`Switch between the two measured diffraction orders and atomic-number or atomic-weight rank. Inspect each historical wavelength and compare the fitted slope, screening intercept and actual residuals.`,
 refs:['Moseley (1913), Table I p.1028 and printed pp.1024–1034, selected source scan','Independent ordinary-least-squares calculation of the transcribed α columns'],links:{source:originalMoseley},tags:['Moseley (1913)','historical measurements'],viz:UI.moseleyPaper,
},
];
export default {collection:'xtal',chapter:6,title:'Diffraction geometry',summary:String.raw`Finite coherent arrays connect grating peaks with Bragg paths, Laue equations and the Ewald sphere. Reciprocal geometry predicts accessible directions, while crystal structure and detector coverage determine which can appear as spots or powder rings. Characteristic X-rays and finite-domain widths complete the experimental picture, with an inspected 1913 Moseley table kept distinct from modern model calculations.`,items:identities.map((identity,i)=>({...identity,...lessons[i]}))};
