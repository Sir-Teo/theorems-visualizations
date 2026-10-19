# Bounded primary-source acquisition follow-up

One pass considered exactly three retained originals. Two complete new primary copies resolved flags; the third lead remained a modern secondary source. Owned dispositions change **104 → 102 retained**, with **zero genuinely unreviewed**. Queue delta **−2**: `algo-11.25`, `cg-3.5`. No shared queue/census/build/runtime edits were made.

## Ford–Fulkerson 1956: source mismatch corrected and flag cleared

The new [Yale faculty reading archive](https://www.cs.yale.edu/homes/lans/readings/routing/ford-max_flow-1956.pdf) supplies all six original pages **399–404**. Read the complete paper, all proofs, both figures, footnotes and references; serial OCR used `OMP_THREAD_LIMIT=1`, and all six scans were visually inspected. PDF SHA256: `ad378e3c07842a685e94f4cd4c2a18ae2fabe4d39a65338afd896fb069b394a1`.

The original explicitly calls its **general proof nonconstructive**. In §1, flows are collections of simple chain flows in an **undirected** network with positive capacities. A compact polytope supplies existence; averaging maximal flows, orienting universally saturated links and selecting their left arcs yields the minimal-cut theorem through Lemmas 1–3. Its corollary describes changing every cut capacity by the same amount. Figure 1 warns that paired multicommodity demands need not obey the equality.

The computing procedure in **§2, pp. 402–404, Theorem 2** requires a **source–sink-planar network**. A topmost or bottommost chain meets every cut once; saturating that chain, subtracting its bottleneck and deleting saturated links gives a finite procedure. Figure 2 shows that its key chain property fails without source–sink planarity. Section 3 relates shortest paths to cuts in the planar dual.

The panel had incorrectly attributed the general modern residual-labeling procedure and integrality result to this exact paper. Its statement/idea now describe the actual theorem and planar algorithm. The existing directed residual-labeling visualization is explicitly a **modern comparison**, rather than a reproduction of the 1956 algorithm. The unsupported optional same-year independence aside was removed. Bibliography and syllabus description are synchronized. No numerical code, controls or interaction changed.

## Meisters 1975: complete institutional primary copy and flag cleared

The [official University of Nebraska repository](https://digitalcommons.unl.edu/mathfacpub/54/) supplies the [full original](https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1053&context=mathfacpub), **pp. 648–651**. Read all four pages, proof cases, Figures 1–4, applications and references; visually inspected all pages and figures. PDF SHA256: `b9788b26afe74602c948c47a0bb99d68fc63d4c4b1c30938c7c6db48e5816168`.

Pages 648–650 define Jordan polygons, interior open chords and nonoverlapping ear interiors, then prove two ears by induction. The non-ear case deliberately includes vertices **on the opposite chord**, matching the repaired closed-triangle diagonal construction. Cases 2a/2b split along the chosen chord and retain ears away from the common endpoints. Figures 2–4 demonstrate many ears, exactly two ears and a star-shaped example. Pages 650–651 give ear-clipping triangulation, the converse boundary-edge count `t₂=t₀+2`, `n−2` triangles and `n−3` diagonals. These support the current theorem and demonstration. Added exact chapter/syllabus references and removed the flag. The optional unverified Dehn-priority aside was removed; no Dehn-priority claim is certified or retained. No mathematical proof or computation changed.

## Denavit–Hartenberg 1955: retained exact source gap

Two genuinely new public faculty leads were inspected:

- [Penn `520-11A-T04.pdf`](https://medesign.seas.upenn.edu/uploads/Courses/520-11A-T04.pdf) is eight pages of modern forward-kinematics course slides, with a robot specification and DH conventions. It cites 1955 but is not the original.
- [GWU `Hartenberg-Denavit.pdf`](https://www2.seas.gwu.edu/~kaufman1/Spatial%20Kinematics/Hartenberg-Denavit.pdf) is a 45-page Roger E. Kaufman lecture presentation, **copyright 2002**. Its title, copyright and subject matter establish that it is not the 1955 original; no full-original closure is inferred.

`robot-3.7` stays flagged for the complete **Journal of Applied Mechanics 22(2), 215–221** original, exact general lower-pair/frame/notation construction and historical comparison. Its content is unchanged. No blocked older routes were repeated and no access controls were bypassed.

## Validation and freeze

Focused static checks: **2 items, 0 errors, 0 warnings**. Scoped `git diff --check` passed. This pass changes source prose, bibliography and verification metadata only. Numerical code, controls and interaction handlers stayed frozen; existing mathematical/native checks remain applicable. No new heavy browser was launched during final sweeps. Exact source hashes, dispositions and final four content-file hashes are recorded in [computing-bounded-primary-followup.json](computing-bounded-primary-followup.json). Source work is frozen after this pass.
