# Quantum chemistry Hund-rule review

**qchem-3.8 ready for root integration**. Its verify:true flag is intentionally retained until root updates the queue/report together. Dedicated helper/tests; other chapter entries, dependency arrays and central ledgers preserved.

## Primary sources

Full64page [Harald Jeschke, Advanced Physics1/2: Theory of Magnetism,2019terms3/4, author notes](https://www.physics.okayama-u.ac.jp/jeschke_homepage/AP2019/script.pdf), `/tmp/atlas-qchem-jeschke.pdf`, SHA256 `f26b80a6d884b9212ec584b077cbd1061919e5e46559ef9c3aa6f368b4000803`. Read complete §2.2.1printed/PDF13–14: LS-coupling hypothesis, empirical largestS/largestL rules, electron/hole Jordering and explicit “often(not always)” qualification, with f-shell table. Context§2.2printed11–12 inspected. RenderedPDF13 inspected `/tmp/atlas-qchem-hund-source13.png`. These are empirical principles, not a universal theorem requiring a nonexistent proof. The entry explicitly limits the qualitative fixed-orbital exchange picture and removes the unverified alternative shielding claim/historicalprioritydate.

Actually opened primary NISTHandbook [C I table5](https://physics.nist.gov/PhysRefData/Handbook/Tables/carbontable5.htm), first2s²2p²terms/fine structure, and [O I table5](https://physics.nist.gov/PhysRefData/Handbook/Tables/oxygentable5.htm), first2s²2p⁴terms/fine structure. Carbon values now use the actual published precision10192.66,21648.02,16.41671,43.41350cm⁻¹; oxygen15867.862,33792.583,158.265,226.977cm⁻¹. This verifies the primary compendium, without claiming to have re-audited the original measurements named by it.

## Corrections

Removed the claim that exchange alone universally proves Hund's rules and that the same rule directly decides high/low-spin ions. The left occupation model is explicitly a chosen diagonal energy with an imposed parallel-spin gain, not a rotationally invariant atomic Hamiltonian. Its manual determinants are not generally S²eigenstates: two separate opposite spins have MS0 but ⟨S²⟩/ℏ²1, so assigning totalS0was false. Readout now gives **MS and the actual spin-square expectation**, while preserving the empirical atomic totalSstatement separately.

Clicking an orbital changes electron number, but the old code still compared its energy with the minimum at the slider's former electron count, sometimes calling a lower energy “higher.” The minimum is now computed for the actual occupation count, including manually reached0and10; sliders reset to their specified-count minimum. All comparisons are within one count. Parameter-dependent high/low projection competition and degenerate minima are described as features of the toy, not validation of all atomic term orderings. Carbon/oxygen evidence remains separate from that toy.

## Validation

- `node --test tests/verification-qchem-source-audit-hund.test.mjs`: **5/5groups**. Independent10spin-orbital pair-energy enumeration verifies minima for11counts×8parametercorners; independent fermionic raising/lowering actions verify spin-square expectations for all1024determinants and reject the false totalSassignment; all1024manual states compare nonnegatively against same-count minima; high/low projection competition and degenerate minima; exact primary-table precision/term and reversedJordering.
- `node tests/verification-qchem-source-audit-hund.mjs`: **2/2item/theme groups**, light/dark native9electroncounts×8parametercorners,4actual orbital-cycle clicks including changed/empty count, both measured-atom menus and plotted primary levels. Drawn arrow occupations are independently decoded and checked against exact helper minima, not inferred only from text. All path/marker/box geometry contained; no browser/TeX/nonfinite errors.
- Inspected `/tmp/atlas-qchem-hund-occupation-and-levels-light.png`; dark counterpart saved. Spin projection and spin-square render correctly; NIST inset visibly reverses the ground-termJorder for oxygen.

This readies the ninth of twelve assigned qchem source reviews. Mendeleev3.13 remains flagged for missing full pinned original; Stark4.6 and degenerate perturbation4.7 remain in progress.
