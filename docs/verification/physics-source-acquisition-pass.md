# Bounded physics/materials source-acquisition pass

Reviewed exactly three retained gaps: **qchem-4.3, aero-4.1 and mat-4.7**. One is resolved, one is narrowed and one remains blocked. This pass used new public author/library/agency leads; it did not repeat the earlier publisher/challenge or Citeseer routes, review new chapters, add graph links, or launch a browser/OCR job.

| Item | Final disposition | Remaining missing evidence |
|---|---|---|
| qchem-4.3 | Closed, after full relevant primary comparison and precise source qualification | None within the revised claim scope; unreviewed historical priority wording was removed. |
| aero-4.1 | Reviewed, still blocked | A complete matched primary passage for the exact displayed Laitone comparison formula. |
| mat-4.7 | Reviewed, still blocked | Full Schiøtz–Jacobsen2003 body/figures for the stated 10–15nm maximum and full Chokshi1989 experimental/priority passage. |

## qchem-4.3: complete numerical source recovered

[Full primary author manuscript: Turbiner, López Vieyra and Olivares Pilón, *Helium-like and Lithium-like ions: Ground state energy*, arXiv:1707.07547](https://arxiv.org/pdf/1707.07547). Read the complete relevant Hamiltonian and calculation/convention discussion, pp.2–3, plus the complete Table I and its explanatory header on p.7; that page was also rendered and visually inspected.

Equation(1) defines the nonrelativistic electron Hamiltonian with an infinitely heavy point charge. The authors explain that they independently recalculate the Z=1–10 energies using the Lagrange-mesh method and confirm the displayed digits. Table I separates the infinite-mass values from finite-mass values, relativistic/QED corrections and the fitted interpolation. The **infinite-mass column**, rather than the fitted or finite-mass columns, gives:

| Ion | Table I infinite-mass energy, hartree | Existing six-decimal fixture |
|---|---:|---:|
| H− | −0.5277510165 | −0.527751 |
| He | −2.9037243770 | −2.903724 |
| Li+ | −7.2799134127 | −7.279913 |
| Be2+ | −13.6555662384 | −13.655566 |

All four fixture roundings were independently checked with decimal arithmetic. The screened-product helium value is −2.84765625hartree, leaving 0.0560681270hartree; the explanatory approximation was corrected from 0.055 to **0.056**. The product-state integral, variational minimum and H− threshold comparison were already checked in the complete Tong/Fitzpatrick derivations and the independent qchem numerical suite recorded in qchem.md. The newly read primary manuscript resolves the remaining numerical-reference table gap.

Content now explicitly identifies the fixed point nucleus, infinite nuclear mass and nonrelativistic convention. The old unreviewed Kellner/Hylleraas historical priority string was replaced by reviewed source credit; this pass does **not** claim to have recovered their original papers. Precise references were added to chapter/syllabus and the source flag cleared. No numerical algorithm or interaction changed.

Local source: `/tmp/physics-gap-acquisition/turbiner2017.pdf`; SHA-256 `9307ade5b5089cc9f9a538aee45bce60e01e511e216c3e7e2755b08208c4b942`. The new Windsor-library lead for Drake2002 returned a generic application shell without a downloadable paper; it was not used as evidence.

## aero-4.1: Glauert and Kármán–Tsien recovered; Laitone remains open

A new [public library volume](https://archive.org/details/in.ernet.dli.2015.240251) contains the complete original Glauert paper, *The Effect of Compressibility on the Lift of an Aerofoil*, Proc.R.Soc.A **118**,113–119(1928), DOI10.1098/rspa.1928.0039. The catalogue misspells “Proceedings”; searching the Roman volume number without the misleading date filter located it. The [complete scanned volume PDF](https://archive.org/download/in.ernet.dli.2015.240251/2015.240251.Proccedings-Of_text.pdf) has the paper on PDF pages124–130. All seven printed pages were read in the library text/scan, and §3 pp.117–119, Eq.(16), the coordinate change and the complete original comparison table/limitations were manually inspected as images.

The original defines λ=V²/a², obtains the circulation/lift relation and the factor(1−λ)^−1/2, and explains the small-disturbance assumption through the Cartesian continuity/irrotationality equations. Its concluding discussion explicitly anticipates breakdown before free-stream sonic speed when local velocities become large. The p.117 footnote attributes the result to Prandtl’s Göttingen lectures in1922; this is a statement in the original paper, rather than a newly recovered lecture transcript. Its printed p.119 experimental comparison is read as historical data with the paper’s qualifications, not used to convert the present panel model into experimental data.

Original volume SHA-256 `287896bfa0765d26631b7b97bedcdf3f0c6f59f1339a385cf1132a6a1b93de48`. Seven-page derivative `/tmp/physics-gap-acquisition/glauert1928-full-paper.pdf`, SHA-256 `3b70cb4e7e4934a38428b4918c2f65a1c6738f446f476bfe288b66e1c7ab9fc9`.

A genuinely new agency source, [Spreiter–Alksne, *Thin Airfoil Theory Based on Approximate Solution of the Transonic Flow Equation*, NACA TN3970(1957)](https://ntrs.nasa.gov/api/citations/19930084679/downloads/19930084679.pdf), supplies the complete relevant higher-approximation comparison and Kármán–Tsien derivation on printed pp.16–18, Eqs.(32)–(36). Read the entire derivation and its assumptions; p.17 was also visually inspected. Its Eq.(36) is

\[
C_p=\frac{C_{p,0}}{\beta+(1-\beta)C_{p,0}/2},\qquad\beta=\sqrt{1-M_\infty^2}.
\]

This is algebraically the implemented denominator because M²/(1+β)=1−β. A direct32-point comparison gives maximum absolute discrepancy1.11×10^−16. The report derives an approximation, including its tangent-gas/small-perturbation assumptions, rather than an exact compressible-flow solution. Local PDF `/tmp/physics-gap-acquisition/compressibility-naca.pdf`; SHA-256 `f64c3b8fed43559d72afd7f76335c193544a87f0d8cc0fda387a4cd092eb4681`.

TN3970 AppendixA pp.72–73, Eq.(A47), also discusses a **local-Mach** correction associated with Laitone/Szebehely/Truitt, its near-sonic limitations, and the1951 references. That passage does not establish the exact explicit Laitone denominator used in the visualization, so it is **not** accepted as closing the remaining gap. The verify flag stays set. Only source comments/references changed in aero; no model, interaction or graph link changed.

## mat-4.7: new leads did not supply the originals

The new public mirror lead `https://bishtref.com/articles/10.1126/science.1086636` returned403. The new author-directory lead `https://www.fysik.dtu.dk/~schiotz/papers/` also returned403. A fresh public OpenAlex location record listed the publisher, PubMed and the DTU bibliographic record but no full-paper PDF. These are acquisition outcomes, not source evidence for the body/figures.

The [Indian Academy of Sciences library record for Chokshi et al.1989](https://repository.ias.ac.in/22397/) explicitly states that full text is unavailable from the repository; the direct local HTTP request returned404 while the indexed library record was readable. Neither metadata nor the indexed Science abstract is accepted as a substitute for the originals. The already reviewed full1999 mechanism paper remains valid evidence for the limited mechanism discussion, but does not resolve the exact2003 maximum or1989 original-experiment/priority claims. The mat source flag and model are unchanged.

## Validation and final scope

The existing qchem numerical suite passes. Focused static validation covers qchem-4.3 and aero-4.1 with zero errors/warnings; independent checks cover all four decimal fixture roundings, the helium residual and the algebraically equivalent Kármán–Tsien formula. No new browser run is needed for these source/reference/qualification changes, and no browser/OCR was launched during this pass. Final fingerprint refresh is needed for **qchem and aero**; mat has no content change. The owned blocker ledger now has21 reviewed-blocked entries and no genuinely unreviewed entries. Shared queues, census, MASTER_PLAN and build outputs were not edited.
