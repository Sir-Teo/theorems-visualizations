# Combinatorics source follow-up — 2026-10-17

Three queued reviews are resolved: `comb-4.3` in `content/comb/ch04.js`, and
`comb-4.15`, `comb-4.17` in `content/comb/ch04-b.js`. The collection is a
course compilation, not a transcription of one textbook; these stable atlas
numbers are not claimed to equal the cited books' theorem numbers. Existing
items and dependency lists were preserved. No central queue, master plan,
package or shared toolbox was changed.

## Primary source record

| Item | Source actually read | Precise match and qualification |
|---|---|---|
| `comb-4.3` | Richard P. Stanley, [*Enumerative Combinatorics*, Volume 1, second-edition author draft, 15 July 2011](https://math.mit.edu/~rstan/ec/ec1.pdf#page=537), Example 4.1.2, p. 537, equation (4.5); Example 1.1.12, p. 17; Exercise 1.35(c), p. 121 | Exact Fibonacci initial conditions F0=0, F1=1, rational generating function, Binet formula and nearest-integer conclusion match Example 4.1.2. Compositions into 1s and 2s give the strip tilings. The ratio-error identity is derived explicitly from Binet. |
| `comb-4.15` | Alan Frieze and Michał Karoński, [*Introduction to Random Graphs*, author version dated 7 August 2026](https://www.math.cmu.edu/~af1p/BOOK.pdf#page=449), §20.1, pp. 433–434, equations (20.1)–(20.2) | Prüfer bijection, multinomial degree counts, fixed-vertex counts and shifted binomial degree distribution all appear explicitly. The source's positive-degree statement applies for n>=2; the singleton is handled separately. PDF page 449 is printed p. 433. Search snippets calling this §17.1 refer to an earlier version and were not used as the current anchor. |
| `comb-4.17` | Murat Kologlu, Gene Kopp, Steven J. Miller and Yinghui Wang, [*On the Number of Summands in Zeckendorf Decompositions*](https://arxiv.org/pdf/1008.3204#page=6), Lemma 2.2, p. 6, and Theorem 2.3, pp. 7–8 | Uniqueness and existence match after the explicit index shift: their F1=1,F2=2 equals atlas F2=1,F3=2. The corrected extremal-sum proof also directly establishes the greedy formulation. |

SHA-256 of retrieved author PDFs:

* Stanley EC1: `f669d7b0d78730b7c812794a437fb6a78e0c182c10dfd520bc26d627cf45a1d5`.
* Frieze–Karoński: `cae755bf585e113682525d9dc7eaf5142de8993af355a6cd3116aa9cef4aa100`.
* Kologlu–Kopp–Miller–Wang: `54dacd89eab19ea78c262fa3cfb3bc7c42283ab83f777f615bf93554174ed50c`.

The generic Aigner chapter references were replaced by these checked exact
anchors. Historical date/priority metadata for Binet/de Moivre/Bernoulli,
Cayley/Borchardt and Zeckendorf/Lekkerkerker was removed because original
historical publications were not audited here. Conventional theorem names
are retained.

### A source error was detected rather than copied

The Kologlu et al. preprint's equation (3.5), p. 9, prints `sqrt(n)` in the
second Binet denominator. A rendered inspection confirms that this is in the
PDF, not merely an OCR error. That equation was therefore not used to verify
the Fibonacci formula. Stanley's Example 4.1.2, equation (4.5), gives the
correct formula with both denominators `sqrt(5)`. The Zeckendorf proof in
Kologlu et al. is the independently checked relevant portion of that paper.
The PDF skill's read-only render-and-inspect workflow was used to resolve
this ambiguity; no source PDF was edited.

## Corrections

### Fibonacci: ratio error and rounding

The old caption gave the consecutive-ratio error as roughly psi^n. Its actual
value, for n>=1, is

`F(n+1)/F(n) − phi = psi^n / F(n) = O(phi^(−2n))`.

Both caption and proof now state the exact identity and correct rate, and the
readout evaluates that error in proper TeX scientific notation. The rounding
argument now includes its explicit uniform bound
`|psi|^n/sqrt(5) <= 1/sqrt(5) < 1/2` for n>=0. The recurrence is restricted
to n>=2. No change to the valid tiling shift F(n+1) was needed.

Independent calculations enumerate all compositions into 1s and 2s through
strip length 15, compare series division with integer recurrence and exact
fast doubling, and check Binet rounding for n=0..200 with Python's standard
library Decimal at 150-digit precision. Ratio identity and alternating signs
are checked independently of the plotted table.

### Cayley: small-n hypothesis, full distribution, actual last tree

The tree count remains valid for n=1, but its degree-count formula and
Bin(n−2,1/n) distribution do not. They are now explicitly restricted to
n>=2 and degree 1..n−1; the singleton tree has degree zero.

The exact enumeration prunes cyclic edge prefixes rather than literally
visiting every completed (n−1)-edge subset; the caption now describes the
actual algorithm. All tree counts and degree histograms are independently
compared against every Prüfer code through n=7, checking decoded connectivity,
distinct edge sets, degree multiplicities and inverse encoding. The singleton
and n=2 cases are included in the unit checks even though the exact UI starts
at n=3.

The sampled chart formerly omitted outcomes deg(1)−1>6 without an explicit
tail indication. It now shows the full support 0..n'−2, with compact rings
at the largest sample sizes. Full displayed empirical and reference masses
sum to one. The caption called the picture the last sampled tree while the
code retained the first word; it now retains the actual final word and checks
its displayed vertex-1 degree against the code occurrence count. Finite sample
means and total-variation distances remain observations, not claimed exact
matches or theorem certificates.

### Zeckendorf: repair the uniqueness bound

The previous proof bounded a sum whose largest term was Fk by an alternating
sum starting at F(k−1), which can be smaller than Fk and is false. It now uses
the correct sharp upper bound

`Fk + F(k−2) + ... = F(k+1) − 1`.

Thus the largest term of a legal representation lies in its uniquely determined
Fibonacci interval, and induction on the remainder proves uniqueness.
Greedy subtraction gives existence because the next remainder is below
F(k−1), forcing a gap of at least two in indices. The duplicate F1=1 is
excluded by starting at index two.

The table enumerates all 2^13 subsets of F2..F14; F14=377 exceeds the displayed
maximum 300, so this family contains every possible representation for every
displayed integer. An independent no-adjacent dynamic program agrees with
all subset counts throughout 0..300. Every displayed greedy decomposition
and its highlighted indices is checked, and additional tests extend the
algorithm through 10,000. Horizontal plot margins keep the selected endpoint at
300 fully visible; it was formerly clipped at the boundary. A too-short Fibonacci table is rejected rather than
silently reusing its final term.

## Validation and limits

* `node --test tests/verification-combinatorics-sources.test.mjs`: **6/6 pass**.
  Exact doubling, 201 high-precision Binet checks, all small Prüfer words,
  full degree laws, exhaustive subsets and independent dynamic programming
  provide separate mathematical checks.
* `node tests/verification-combinatorics-sources.mjs`: **6/6 light/dark groups pass**.
  Actual keyboard controls exercise every strip length 1..9, every exact
  Cayley size 3..7, sampled sizes 5/14/24 with sample sizes 200 and 5000 and
  resampling, and **every Zeckendorf integer 1..300 in both themes**.
  Captured drawings are compared with the expected tile groups, all ratios,
  exact/sample probability bars, connected displayed last tree and its degree,
  greedy blocks, nonadjacent highlights and all 300 plotted subset counts.
* Targeted static check reports three items, zero errors/warnings.
  Both files' dependency arrays are preserved, and `git diff --check` passes.
  No global build was run by this agent; central integration owns it.
* Screenshots visually inspected:
  `/tmp/atlas-comb-cayley-light.png` and
  `/tmp/atlas-comb-zeckendorf-dark.png`. Other captures:
  `/tmp/atlas-comb-fibonacci-{light,dark}.png` and
  `/tmp/atlas-comb-cayley-dark.png`.

Finite checks validate the offered pictures and computations. The general
statements are justified by the source proofs and corrected derivations.
