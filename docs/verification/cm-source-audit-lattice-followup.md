# Condensed matter: lattice binding and sound source audit

Completed IDs: **cm-3.2 and cm-3.6**. This first subset owns only their entries in `content/cm/ch03.js`, the unique `cm-source-audit-lattice.js` helper and dedicated tests. The other13 condensed-matter flags remain pending. No central ledger, package, existing shared helper or human/listening gate is changed.

## Primary evidence read

- Schwerdtfeger, Burrows and Smits, *The Lennard Jones Potential Revisited*, [full author preprint arXiv:2012.05413](https://arxiv.org/pdf/2012.05413),63pages. Introduction and theoretical foundations through lattice sums, pp.1–8, were read in full; Eqs.(3)–(6) give pair energy, volume, pressure and bulk modulus, and Eqs.(10)–(13) give the primitive lattice norms. The printed p.8 table gives all six fcc/hcp/bcc lattice-sum values used for independent checking. The page was rendered and visually inspected. Later vibrational corrections are not represented as reconstructed by this static model. Download `/tmp/atlas-cm-lj2020.pdf`, SHA256 `1f8ae448fd02a27d005a1c1d9f9a703795c476bc6793fea3c9de7bbfea8a19ac`.
- David Tong, *Applications of Quantum Mechanics*, [full author chapter4, Phonons](https://www.damtp.cam.ac.uk/user/tong/aqm/aqmfour.pdf),16pages. Full §4.1.1 pp.103–105, Eqs.(4.1)–(4.4), establishes the force equation, periodic modes, sine dispersion and sound slope; surrounding diatomic/quantized sections were also read. Printed p.105 was rendered and visually inspected. Download `/tmp/atlas-cm-tong-phonons.pdf`, SHA256 `c7282615c6771c6339520820ac0af40e17f647e488202ab082d4a3baad5174fe`.

These are author derivations; no original1924 priority verification is claimed. The detailed historical date and unreviewed material comparisons were removed.

## Corrections

**cm-3.2.** Distinguishes fcc and idealhcp lattice sums at quoted precision. The first two shells agree and subsequent shells differ. Derives the exact analytic equilibrium modulus `B=−8u0/V0` instead of a finite-difference readout. The8shell bars now include a separately disclosed remainder from all other shells and the tail. The model's radius11 continuum correction is explicitly numerical, with small discretization error, rather than exact infinite sums. Both energy and shell-bar axes include their entire selectable ranges. Removed unsupported argon parameters/experimental values formerly quoted from memory, and the assertion that all discrepancies were quantum corrections. Static energy ordering within these three families is distinguished from a stability proof or a full phase diagram. All outputs are model units.

**cm-3.6.** Replaces remembered aluminium/copper/iron data of ambiguous bulk/rod provenance with native model controls for mass, spacing and spring constant. The universal normalized plots retain a zoom control; the readout now distinguishes angular frequency from cyclic frequency. The tangent is fully visible at large wave numbers. Sound slope, phase/group velocities, limiting behavior and directional3D limitations are explicit. No measured metal properties are asserted.

## Independent validation

`node --test tests/verification-cm-source-audit-lattice.test.mjs` passes **3/3 groups**:

1. Independent primitive-Gram lattice enumerations at radius18 (rather than the production conventional-cell radius11 sum) agree with the primary six table values within8e−6/5e−6. The production S6 error is under5e−5 and S12 error under1e−8 against that independent calculation. Coordination numbers are exactly12/12/8. This is a numerical consistency/precision check, not a rigorous infinite-tail error proof.
2. All three structures over123spacings: energy and shell-remainder accounting; independent finite-volume second differences agree with the analytic modulus, and stationarity/energy ordering are checked.
3.27mass/spacing/stiffness combinations ×1001wave numbers: discrete force-equation eigenvalues, sound scaling, finite-difference group derivative, phase/group ordering and zero-wave-number limits.

`node tests/verification-cm-source-audit-lattice.mjs` passes **4/4 actual light/dark entry groups**: all3structure buttons ×3native pointer drags, and all16endpoint combinations of the4sound controls per theme. Native inputs verify computed values, full selected energy/bar/tangent visibility, finite readouts and clean TeX/runtime. No programmatic setter substitutes for input events. Browser route instrumentation exposes states/stage bounds only.

Standard `node scripts/check.mjs cm-3.2 cm-3.6 --still` and `--dark` pass **2/2 each**, with zero static errors/warnings and zero browser/TeX/blank/quality warnings. Screenshots `/tmp/atlas-cm-lattice-{3.2,3.6}-{light,dark}.png` were inspected at full size. A redundant shell label overlapping the first bar was removed and all4groups rerun. Dedicated helper/tests pass diff whitespace checks. No global build was run.

The two source flags are cleared after this evidence. Subjective wider human review and listening remain open. No Wave5 work is included.
