# Wave 5 music chapter 9 — independent review

Reviewer validation, 2026-10-21. Scope: all 23 new items in `content/music/ch09.js`, `ch09-b.js`, `ch09-c.js`, their chapter helper, scoped tests and author report. Followed AUTHORING and MASTER_PLAN §7.2; earlier music chapters were outside this review.

## Source and mathematical review

Independently checked the ordered-pitch/voice-leading and quotient/Möbius passages in [Tymoczko's 2006 primary paper](https://www.brainmusic.org/EducationalActivities/Tymoczko_chords2006.pdf). The continuous multiset quotient retains duplicate notes, the dyad seam exchanges voices correctly, and the gap triangle is explicitly a cross-section rather than the complete three-dimensional space. The sufficient cyclic-gap bound is an authored proof with a precise scope; it does not assert an unrestricted equivalence between efficient voice leading and evenness. Clock areas and projected Euclidean distances are not substituted for musical metrics.

Independently opened the official Open Music Theory chapters on [Roman numerals](https://viva.pressbooks.pub/openmusictheory/chapter/roman-numerals/), [counterpoint](https://viva.pressbooks.pub/openmusictheory/chapter/first-species-counterpoint/), [neo-Riemannian progressions](https://viva.pressbooks.pub/openmusictheory/chapter/neo-riemannian-triadic-progressions/), [figured bass](https://viva.pressbooks.pub/openmusictheory/chapter/figured-bass/), [cadences](https://viva.pressbooks.pub/openmusictheory/chapter/intro-to-harmony/), [V7 resolution](https://viva.pressbooks.pub/openmusictheory/chapter/strengthening-endings-with-v7/) and [modulation](https://viva.pressbooks.pub/openmusictheory/chapter/extended-tonicization-and-modulation-to-closely-related-keys/). Some other direct chapter opens returned 403; their indexed official records and explicit finite calculations supply narrower evidence. Harmonic functions, stylistic rules and cadence ingredients are correctly presented as contextual models. Spelled intervals are distinguished from enharmonic pitch-class labels.

The two source flags remain intentional: 9.11 supplies a finite centralizer argument but does not claim full passage-level verification of the Fiore–Noll original; 9.22's Rameau interpretation remains flagged because the original French passages were not read. Independently found the [official arXiv abstract](https://arxiv.org/abs/1102.1496) and indexed [Library of Congress catalogue record](https://www.loc.gov/item/07034192/); these establish bibliographic context, not full original-source verification. The historical root reduction is expressly authored.

## Independent checks

- Built a separate circular-distance matrix and six-permutation optimizer for every pair of the 220 distinct three-note subsets of twelve classes. All 145,200 chord-pair/metric combinations (L1, L2, L-infinity) agree with `assignment` within 1e-12.
- Independently checked all four corrected dominant inversions: actual lowest source classes are G/B/D/F, and paired motions remain G:+5, B:+1, D:-2, F:-1 semitones.
- Read and checked the PLR involutions/commuting actions, cycle lengths, Tonnetz lattice increments, figured-bass letter arithmetic, diatonic scale intersections, sequence root intervals, applied-dominant and substitution guide-tone formulas.
- Independently reran `node --test tests/wave5-music.test.mjs`: eleven groups pass, including waveform samples and actual played chord memberships.
- Independently reran `node tests/wave5-music.mjs 17,21`: eight theme/width groups, 64 state checks, 20 screenshots and 16 actual audio actions pass. The script verifies user-triggered audio buffers, bounds, silent starts/ends, replay and native controls. This supplements the author's full 92-group run; no human-listening or perceptual claim is made.

## Visual review and requested fixes

Independently opened six author contact sheets covering all 23 default displays in light mobile and dark desktop layouts. Then inspected individual final mobile captures of 9.16, 9.17 at inversion 3, 9.21 and 9.23. The chapter has useful variety: clocks, registered voice diagrams, graphs, tables, lattice, Möbius projection, simplex and measured cost bars. Controls, readouts and legends remain legible.

Reviewer identified and author fixed:

1. In 9.17, adding only twelve semitones to the unusually low source bass did not actually change the bass member. The corrected paired rotation raises by enough octaves to exceed the remaining source maximum, preserving resolutions while producing all four real inversions.
2. In 9.21, the original dominant playback contained A instead of the declared G7's D. Diagram and audio now use one corrected helper with the complete G7 pitch-class set.
3. In 9.16, explicit tonic E and deceptive-chord E now make the assigned chord qualities audible and visible; shared helpers prevent diagram/audio drift.
4. The Möbius readout now names circular separation rather than an unspecified distance-to-unison metric. The fixed phrase diagram's caption no longer claims to locate every selected degree.

Status: accepted for authored mathematical/computational fidelity, control/audio consistency and visual presentation, with the two explicit source-review flags retained. Root owns final shared repository gates and reconciliation.
