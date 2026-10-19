# Imaging Fourier diffraction theorem follow-up

Resolved after coordinator integration: **imaging-3.16**. The source flag and ledger were reconciled after independent parent reruns. The Cormack and Hounsfield entries and all prerequisite arrays are preserved.

## Source actually inspected

Kak and Slaney, *Principles of Computerized Tomographic Imaging*, [author-hosted complete book and chapter PDFs](https://www.slaney.org/pct/pct-toc.html), chapter 6. Read the complete relevant derivation, not just the chapter abstract: §§6.2.1-6.2.2, printed pp.212-218, distinguishes the first Born field from the first Rytov logarithmic perturbation; §§6.3.1-6.3.3, pp.220-228, Eqs.92-126, derives the receiver-plane Fourier relation and the short-wavelength limit; §6.3.4, pp.228-229, explains rotated acquisition and its finite frequency coverage. The whole chapter is 71 PDF pages in `/tmp/atlas-imaging-kak-ch6.pdf`, SHA256 `b5d3e9c9eda2cf9dad9d15e51470b6d051749bdaf45b1de537abe8b2c9122cff`. Printed p.222, including Eqs.100-104, was visually inspected at `/tmp/atlas-imaging-diffraction-equation.png` to check the propagation sign and normalization that text extraction obscures.

The statement uses **cycles/unit**, while the source uses angular wavenumber. With beta = 2 pi kappa, Eq.104's prefactor i/(2 beta) becomes i/(4 pi kappa); the receiver phase becomes exp(2 pi i kappa ell). The sampled object frequency is (q, kappa-k0), not the receiver coordinate itself. The outgoing branch and receiver beyond the support are explicit. Grazing endpoints and evanescent modes are excluded from the formula.

## Content and numerical scope

The central result is an exact identity **within the linearized scalar two-dimensional Born model**. It is not an exact multiple-scattering theorem or a simulated wave-equation experiment. The Rytov alternative needs the incident field times a complex logarithmic perturbation and phase unwrapping; the picture does not generate that data. Normalizing out a physically weak multiplier on the selected real object does not validate arbitrary contrast in a Born experiment.

For each illumination the forward directions give a semicircle centered at minus the incident wavevector. Its endpoints have norm sqrt(2) k0. Rotating the illumination continuously through a full turn covers the open disk of that radius; a finite number of angles and a finite receiver sampling are different data. The inverse cutoff is a shortest-period scale, not a point-spread FWHM or a two-object resolution criterion. Flattening to a slice is a limit on each fixed bounded frequency window, not a uniform limit on a window growing proportionally to k0.

The implementation evaluates **65 exact synthetic deweighted object-transform samples at the actual arc points** for each acquired illumination. It averages samples assigned to the same nearest grid cell; it does not replace their values by oracle transforms at cell centers. A half-unit Fourier spacing, 64-square inverse grid and symmetric circular numerical cutoff at most 15.5 are explicit. Missing cells remain zero. Hermitian conjugate completion is justified by the selected real object and would be invalid for a general complex scattering potential. The straight-slice comparison retains the same finite cutoff. The gold probe does not acquire additional data or change the image.

The caption now identifies the grey exact-spectrum backdrop as a reference rather than acquired data; readout units and numeric labels have proper spaces. Display grey levels clip to the declared window; image RMS uses unwindowed pixels.

## Independent mathematical and actual-browser checks

`node --test tests/verification-imaging-diffraction.test.mjs`: **6/6 groups pass**. Tests independently parameterize rotated Ewald loci and check circle, hemisphere and endpoint constraints; verify outgoing-spectrum phase, cycles-unit magnitude and the Green-function derivative jump; show the fixed-window straight-slice limit and a nonuniform counterexample; build separate sample buckets to check true-point sampling, duplicate averaging, missing cells and real-object completion; compare every pixel of a 16-square reconstruction with direct complex Fourier summation, including physical coordinates, normalization and vertical orientation; and exercise frequency/count/span endpoints for both geometries. The FFT is not used by the direct-summation reference. The exact ellipse transform is reused as the declared synthetic forward oracle, not treated as an independently validated wave solver.

`node tests/verification-imaging-diffraction.mjs`: **2/2 light/dark groups pass**. Each covers both geometries and all eight actual frequency/count/span endpoint combinations. Moving the probe through both direction endpoints leaves the actual reconstruction canvas unchanged; all states retain finite readouts, explicit acquisition limitations and zero runtime/console/TeX/blank-canvas errors. Screenshots `/tmp/atlas-imaging-diffraction-{light,dark}.png` were visually inspected in both themes for legibility, scale, labels and the finite-cutoff distinction.

`node scripts/check.mjs imaging-3.16 --static`: **1 item, 0 errors, 0 warnings**. No clinical performance, independent human review or subjective audio gate is claimed.
