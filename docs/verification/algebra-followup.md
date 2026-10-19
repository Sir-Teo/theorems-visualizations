# Algebra and cryptography review — 2026-10-17

Resolved all five queued algebra reviews: `alg-6.10`, `alg-7.1`, `alg-7.2`,
`alg-7.4` and `alg-7.5`. Three neighboring explanations were corrected as part
of tracing their cryptographic claims.

## Primary sources

The collection specifies Judson's **2023 edition**, so numbering was compared
with the [author's August 11, 2023 PDF](https://twjudson.github.io/aata-files/aata-20230811.pdf),
rather than the differently paginated current HTML edition:

| Entry | Source anchor | Printed page | PDF page |
| --- | --- | ---: | ---: |
| Lagrange | Theorem 6.10, plus Proposition 6.15 | 76 | 88 |
| Shift code | Example 7.1 | 82 | 94 |
| Frequency analysis | Example 7.2 | 82 | 94 |
| Matrix cipher | Example 7.4 | 83 | 95 |
| RSA | Example 7.5 and following correctness proof | 84–85 | 96–97 |

Inspected the matrix/offset formula and worked example in the rendered original.
The [saved source evidence](algebra-source-evidence.json) records the PDF hash,
anchors and original worked values. Removed the unchecked Lagrange priority date
and al-Kindi priority narrative; they were not established by this book audit.

Other sources checked:

- [Suetonius, Divus Iulius 56.6, Rolfe translation](https://lexundria.com/suet_jul/56.6/):
  the report of substituting D for A. The displayed 26-letter implementation is
  a modern modular-arithmetic example.
- [Norvig, Letter Counts](https://www.norvig.com/mayzner.html): replaced the vague
  “commonly quoted” frequency table with all 26 rounded percentages from this
  author's corpus analysis. The HTML hash and extracted values are saved.
- Publisher-deposited Crossref records for [Hill (1929)](https://api.crossref.org/works/10.1080/00029890.1929.11986963)
  and [Rivest–Shamir–Adleman (1978)](https://api.crossref.org/works/10.1145/359340.359342):
  authors, title, volume, issue, year and pages. Hill's full original scan was
  unavailable; its mathematical presentation is checked against Judson, not
  claimed as a transcription of that paper.
- [The authors' RSA paper](https://people.csail.mit.edu/rivest/Rsapaper.pdf),
  especially the arithmetic construction, §IX.B–D (factoring, totient and
  inversion), and §X (different signing/encryption block sizes). §IX.D explicitly
  does not prove that arbitrary RSA inversion reduces to factoring. Removed the
  unchecked Cocks priority claim from this entry.
- [RFC 8017 §§5, 7–9](https://www.rfc-editor.org/rfc/rfc8017): distinguishes
  the mathematical primitives from complete encryption/signature schemes and
  specifies message encoding and verification.

## Corrections

Lagrange's statement, proof, numbering and the A4 converse counterexample agree
with the specified edition. Exhaustive subset enumeration independently checks
that the lab includes every subgroup of each displayed group, rather than only
some generated examples.

The shift display changes a letter mapping rather than physically rotating its
inner ring; the caption now describes that behavior and its text-length limit.
The frequency attack now has a named corpus and explicitly remains a heuristic
for rotations, not a general substitution solver or confidence probability.
Its short sample still misses every true key, as checked for all 26 rotations.
The old fixed 18% plot range clipped its 25% peak and the medium sample's 20.75%
peak. Both the reference and all shifted sample values now fit the plot.

The Hill example now includes Judson's affine offset, with default matrix
`[[3,5],[1,2]]`, offset `[2,2]`, and **HELP → RRGR**. Decryption subtracts the
offset before applying the inverse. Offset changes invalidate the raster cache.
The pair selector reaches all 12 pairs allowed by the 24-letter input limit.
Removed the claim that every matrix mixes both letters, or that repeated
plaintext letters must produce different cipher letters: identity/diagonal
keys are immediate counterexamples. Empty and singular cases remain defined.

The RSA defaults now reproduce **p=23, q=29, E=487, D=191, 25 → 169 → 25**.
The deliberately invalid repeated-prime experiment labels `(p-1)(q-1)` as a
candidate modulus m, not the true totient, and reports actual image size and
failures. Correctness includes zero and nonunits for distinct primes. Knowing
the totient and factoring are related, but plaintext recovery is not asserted
to be equivalent to factoring. No present-day factoring-time estimate is made.

Neighboring corrections are recorded separately from the five queued entries:

- `alg-7.1a`: Eve recovers a raw RSA-encoded letter by testing all 26 public
  encryptions, without recovering the private key or factoring. The old diagram
  incorrectly said she must factor first.
- `alg-7.4a`: corrected the one-way/trapdoor distinction and the unsupported
  RSA/factoring equivalence. The work curves are explicitly assigned model units,
  not measured processor costs; the loop counts 19 modular multiplications,
  while an optimized leading-bit variant can use 17. Trial division is measured
  only through 14 digits as described, and all three curves stay in view. The
  runtime primality test supplies probable primes, not certificates, and the
  simple key-generation rule is explicitly not a secure generator.
- `alg-7.5a`: removed the false claim that a dictionary word proves Alice sent
  it. A new **Eve searches signatures** mode uses only public operations: candidate
  `s=391` gives `391^7 mod 17947 = 8125`, the word **MAN**, after 391 trials.
  Encrypting that candidate for Bob produces a dictionary-accepted forgery for
  every selectable honest word. The caption and readout distinguish word
  acceptance from authentication and existential forgery from choosing any
  preselected message. The 62-word dictionary size is checked.

## Verification

- [Source verifier](../../scripts/verify-algebra-sources.py): pinned 2023 book
  anchors and all 26 author-table percentages match the saved evidence. It reads
  downloaded PDF/HTML files and imports no site calculations.
- `npm test`: **47 math + 20 science-kit + 36 verification tests pass**. The new
  tests exhaust every subset of all four Lagrange groups, compare the frequency
  data with its extracted source table, test all 26 shifts, check the Hill worked
  example and all 676 pairs for 70 independent matrix/offset choices, compare RSA
  powers with independent BigInt integer powers, and construct the public forgery.
- `node tests/verification-algebra.mjs`: **12 light/dark scenario groups pass**.
  Includes all 40 subgroup states per theme; text input roundtrips, a real ring
  click and ROT13; every frequency sample and key endpoint; Hill offsets, pair 12,
  singular and empty inputs; RSA source values and prime/exponent extremes;
  unclipped work curves; and honest/forged results for every signature message.
- Nine items in light/dark and all selector/toggle modes: zero runtime, TeX,
  blank-canvas or quality warnings. Inspected Lagrange, Hill, short-frequency,
  RSA and forged-signature screenshots directly.
- Strict build and full static validation: zero errors or warnings.
- Eight chapter/item smoke routes pass with their expected titles.

**817 queued source reviews remain.** The goal continues. Wave 5 remains gated.
