# Hooke's arch announcement: original-source follow-up

`arch-3.13` can close its source flag after reading the relevant originals
and narrowing the page to the claims those originals and the equilibrium
derivation support. This does not close the other architecture flags.

## Original evidence read

- [Hooke, *A Description of Helioscopes, and Some Other Instruments*
  (1676), ETH e-rara 2171](https://doi.org/10.3931/e-rara-2171).
  Read the concluding invention-list context in the original OCR and
  visually inspected printed p. 31 (PDF page 39). Invention 2 announces
  the arch form and abutments and supplies the alphabetised anagram.
  The PDF has 46 scanned pages, including library material. Its unrelated
  instrument descriptions were not reviewed as evidence for this claim.
- [Waller, *The Life of Dr. Robert Hooke*, in *The Posthumous Works of
  Robert Hooke* (1705), Wellcome volume 1](https://wellcomecollection.org/works/xxggvyj3/items?canvas=33).
  Read and visually inspected the title page and the complete relevant
  passage on pp. xx–xxi (scans 32–33). Waller introduces his own
  decipherments, quotes the arch announcement and prints the Latin
  sentence used on the page, identifying the catenary. Publication in
  1705 does not date the decipherment itself. The remaining lectures
  and unrelated biographical passages were not reviewed.

The primary scans, rather than search excerpts or later attributions,
support the retained announcement, wording, decipherment credit and
publication dates. The view renders an English translation, not an
English quotation from either original. The displayed anagram is
explicitly recomputed from the decoded sentence with v mapped to u;
it is not presented as a diplomatic transcription of the 1676 type.
The unrelated Galileo/1691/Gaudí chronology has been removed from this
page; those claims are not silently certified by reading Hooke or Waller.

## Mathematical and model corrections

Reflection and force reversal construct compressive equilibrium for the
corresponding vertical loads. This does not make every chosen arch shape
funicular under arbitrary weights. Supports, compression capacity and
sliding resistance remain assumptions.

The visualization samples a continuous catenary at 25 equal-arc-length
positions. It does not solve the equilibrium shape of a chain made of
24 finite straight links. Its right-hand ring has 24 finite polygonal
blocks with their own area-centroid weights. The caption and idea now
identify this approximation. The finite-block solver's small minimum
thickness does not prove the former universal claim that any thickness
will do. It searches from 0.0001 to 1 half-span with numerical tolerances;
estimates below 0.0005 are reported as below that displayed resolution.

The calculation is unchanged. At rise 1.3 and zero bump its threshold
is approximately 0.000296, already inconsistent with reading the old
wording as an exact finite-block statement. At rise 0.2 with bump +0.2
near x = −0.4 the estimate is approximately 0.1412. Readout and plot now
report an admissible line found, or no line found, in the assumed model;
they do not claim a real building stands or falls. A failed minimum
search has an explicit message instead of a NaN result.

## Validation and evidence identity

Static and native browser checks pass, including real TeX. Native range
inputs cover default, deep/thin, shallow/deformed and deep/deformed
states in both themes; decipher toggles reveal and hide the sentence.
The eight captures were inspected. The deepest cable setting exposed a clipped
parameter label; its plot range was extended and the captures rechecked. Existing independent architecture
source regressions pass. Strict build, source-ledger reconciliation and
sample hash validation pass. This page is outside the fixed 339-page
sample and adds no sample-review credit.

Retrieved 2026-10-19; temporary source and browser files are under `/tmp`.
These hashes identify the copies actually read, not a promise that a
library will serve identical derivative bytes forever:

| Evidence | Retrieval URL / scan | SHA-256 |
| --- | --- | --- |
| 1676 full scan PDF | `https://www.e-rara.ch/download/pdf/731052.pdf` | `e2ad1fbea76a8ec2a49734adb66584d52a5261482538d71c03616a28d8f86309` |
| 1705 title page | Wellcome `b30454621_0001_0007.jp2`, JPEG derivative | `eab328b667438ccf427dacd26eee902d309f5e9cd474d9f7409d388c524beebd` |
| 1705 p. xx | Wellcome `b30454621_0001_0032.jp2`, JPEG derivative | `9b9ff5d60c4035ab51fed8d5802168e9da70c978a5d04af678b542d41de121e2` |
| 1705 p. xxi | Wellcome `b30454621_0001_0033.jp2`, JPEG derivative | `ed1efa309b497211f3cf6c4da2685afa055390c9dd628fc4910b4492b35b08f1` |

Wellcome derivatives used the image API path
`https://iiif.wellcomecollection.org/image/{scan}/full/!1600,2200/0/default.jpg`.
