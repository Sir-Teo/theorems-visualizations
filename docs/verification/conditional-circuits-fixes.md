# Conditional-control source repairs

CAUSAL2.2, KIN1.5 and OPT3.6 source-local fixes passed focused validation in both themes. All **60 native screenshots** were opened and visually inspected; no material clipping, overlapping labels, blank canvas or nonfinite output was found in these captures. This is AI inspection and does not count toward human339 review. No source flags were closed and the queue delta is zero.

- **CAUSAL2.2:** “simulated assignments” now fits12unit self-selection as well as40unit simulation. Caption separates exact randomized enumeration from Monte Carlo; exact12unit restoration reports924assignments andmean5.0000.
- **KIN1.5:** “reference k₁ (s⁻¹)” and the caption explain k₂=k₁/([A]₀ ln2), at[A]₀=1M. The two laws match their initial half-life; the second-order branch correctly displays unequal later half-lives. Numerical formulas are unchanged.
- **OPT3.6:** all4inner×3outer choices use range-aware sufficient conditions. The inner ranges on[-3,3] are[0,4.5],[0,4],[e⁻²,e²],[-1,2]. Squaring each convex nonnegative input satisfies the composition rule, including(x²/2)²=x⁴/4. A rule that gives no conclusion is distinguished from a sampled counterexample.

Independent tests establish the quadratic-square closed form and second derivative, all six sufficient-rule cases, four genuine nonconvex midpoint examples, and the two convex sqrt compositions for which this sufficient rule does not apply. The latter have positive second derivatives1.5/(x²/2+3)^(3/2) and a(a+6)/(9(a+3)^(3/2)), a=e^(2x/3).

`node --test tests/verification-opt-composition.test.mjs` passed; scoped static checks reported6items,0errors and0warnings; focused native validation passed60states with realKaTeX0.16.11,0runtime/TeXerrors and0blankcanvases. The native test uses one browser worker and actual pointer/control clicks. The JSON records source/test SHA256s, all readouts and every inspected PNG SHA256.

The original226PNG supplemental review remains separately recorded with its original captured content hashes in [conditional-visual-circuits.json](conditional-visual-circuits.json). These60 focused captures verify the repairs and do not substitute for parent-owned fresh fullcollection/conditional evidence.

The parent additionally authorized the same chord-orientation wording repair in OPT3.1/3.3/3.5/3.6. Readout/caption now says sampled chord inequalities violated, consistent with both helper predicates counting graph above chord. Arithmetic is unchanged. Both-theme native default and violating examples were visually inspected, including all12composition choices. The20CAUSAL/KIN final-run PNGs are byte-identical to already inspected captures; all40finalOPT PNGs were separately opened. Final source is frozen. REP3.3complex character-table overflow is assigned separately by parent.
