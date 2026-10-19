# Second-order specifications and dominant poles

Resolved after parent integration: **ctrl-4.4, ctrl-4.8**. The source flags and ledger were reconciled together after parent reruns.

## Author sources actually read

[Alexandre Bayen, EE C128/ME C134, Chapter4: Time Response](https://bayen.berkeley.edu/sites/default/files/ee_c128_chapter_4.pdf), September10,2013, slides32–43: complete relevant derivations of overshoot, settling envelope, numerical rise-time procedure, pole geometry, modal partial fractions and the five-times heuristic. Full61-page PDF/text acquired as `/tmp/atlas-control-bayen.pdf/.txt`; SHA256 `ed1691d775904311f94fb4f98d58779c7c5f325a1fd02efc8f627c6b42a490dd`.

Complete relevant [Raginsky–Liberzon ECE486 Lecture6](https://courses.physics.illinois.edu/ece486/sp2025/documentation/handbook/lec06.html) was read, including its final qualification on approximate design regions. Its claim that normalized10–90% rise equals1.8 at ζ=.5 is incorrect: independent state-ODE integration and crossing roots give **1.6375729473283478**. The 1.8 value is attained near ζ=.577065687. The entry now states this explicitly; the author's approximation is not treated as exact evidence. Bayen slide34 correctly prescribes solving actual crossings. Bayen slide34's full envelope includes `1/sqrt(1-ζ²)`, unlike an oversimplified exponential-only bound.

## Corrections

4.4 specifies stable, underdamped, zero-free, unit-DC-gain hypotheses. The shaded intersection satisfies engineering design inequalities and no longer promises exact rise/settling specifications. The sufficient envelope bound is `ln(50/sqrt(1-ζ²))/σ`; `4/σ` is explicitly approximate. Theme colors now use the palette.

Readout metrics now solve actual response crossings instead of classifying the final sample of an eight-second plot. After finding the last error extremum outside2%, bisection between that extremum and its successor gives the final band entrance. Their magnitudes are `exp(-σ kπ/ωd)`, so this method also proves no later exit. The plot extends past the true settling time. Unstable/undamped selections receive no fictitious steady-state metrics, and response color follows actual specifications rather than the heuristic region.

4.8 separates slow modal decay from small residues: fixed DC gain and pole separation alone do not imply a uniform error tolerance. The complete third-order step formula and all positive-parameter/underdamped hypotheses replace an unspecified “small change.” For this cascade, exponential averaging gives the proved all-time bound `sup|y3-y2| <= sup|y2'|/p`; the derivative maximum is evaluated analytically. The displayed maximum is honestly labeled as sampled on a finite interval (at least nine dominant decay times). Error axes contain the complete curve, and the pole plot includes the lowest offered pole. The five-times line remains a sourced heuristic.

## Validation

`node --test tests/verification-ctrl-source-audit.test.mjs`: **4 groups pass**: independent RK4 state-ODE comparisons for both exact formulas, actual first crossings and last band entrance including very slow/near-critical cases, explicit counterexamples to rise/settling design guarantees, and broad all-time-bound checks. At the same five-times real-part ratio, ζ=.2 gives maximum error above.5 while ζ=.9 gives below.12; a ratio is not a fixed tolerance.

`node tests/verification-ctrl-source-audit.mjs`: **4 native groups pass**, both entries ×two themes, after final formula changes. Actual slider corners, stable/unstable native pole drags, long-settling axis extent, complete error-curve bounds and movable extra pole; no page or TeX errors.

Personally inspected `/tmp/atlas-ctrl-regions-long-settling-light.png`, `/tmp/atlas-ctrl-regions-unstable-dark.png`, and `/tmp/atlas-ctrl-dominant-pole-exact-cascade-dark.png`.
