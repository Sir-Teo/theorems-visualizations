# mathbio-3.14: corrected diagnostics; original source review remains open

**Do not clear mathbio-3.14.** Its original Kolmogorov1936 statement has not been located/read. The root explicitly required retaining that flag after this supported correction. The changed title and narrower modern theorem do not close the original-source obligation. No central ledger was edited.

The old entry asserted a universal stable-equilibrium-or-stable-cycle alternative from an unsourced radial-inequality list and treated a finite grid as verifying all hypotheses. Its own examples contradicted that verdict: typeIII has F(0,P)=1 and no finite predator-axis root, while typeII at m=.9 has B=9>carrying6. The neighboring models and dependencies are preserved.

Primary modern evidence actually read:

- [Teschl, author ODE book](https://www.mat.univie.ac.at/~gerald/ftp/book-ode/ode.pdf), `/tmp/atlas-teschl-ode.pdf`, SHA256 `362433156525216abf596c17ce843204510e96d57afa4284a37c7aa5a9ffc36e`; full §7.3 argument through Lemma7.13 pp221–222 (ordered transverse crossings and periodicity), and generalized Theorem7.16/proof pp223–224. Precisely: a nonempty compact limit set without a fixed point is a regular periodic orbit. Equilibria-and-connecting-orbits are an additional case when equilibria occur. No stability/uniqueness or global boundedness follows from the finite diagnostics.
- [Edelstein-Keshet, Mathematical Models in Biology, complete chapter8 author text](https://sites.math.rutgers.edu/~zeilberg/Bio25/keshet/keshet8.pdf), `/tmp/atlas-mathbio-keshet8.pdf`,70pages, SHA256 `3f3323508676ab2ca1fdabf78683d05f63b23a9460433887ecdc706972c70fbd`. Read full §8.7 pp347–352/PDF37–42, including the unique coexistence assumption, geometric trapping discussion and boxed conditions351. This is a different criterion, explicitly including an unstable coexistence equilibrium; it does not establish the old original1936 radial conditions. It is cited for its geometric discussion only.

The entry now states the supported modern conditional result and clearly labels the older ecological comparisons as sampled diagnostics. Analytic derivatives replace cancellation-prone finite differences. Selected-model axis roots/invasion thresholds are exact analytic calculations; null roots are explicit. The five models include the same feedback contrasts; the readout never turns any pass count into a global theorem certificate. The finite phase viewport can contain only part of a trajectory and is explicitly identified as such.

`node --test tests/verification-mathbio-source-audit-kolmogorov.test.mjs`: **3 math groups pass**: all analytic derivatives checked by independent central differences at all81death rates, exact selected-model roots/invasion exceptions and independent closed-form radial derivative checks.

`node tests/verification-mathbio-source-audit-kolmogorov.mjs`: **2 native light/dark groups pass**, each covering5models×2death-rate endpoints, both corrected counterexamples, readout's explicit non-certification and proper line breaks, native clear/click and runtime/TeX/blank checks. Four screenshots `/tmp/atlas-mathbio-kolmogorov-{invasion,missing-root}-{light,dark}.png` visually inspected. These are partial-correction checks, **not** closure of the original1936 source claim.

Scoped helper/test/report names use `mathbio-source-audit-kolmogorov`. `verify:true` and the Wave5 gate remain intact.
