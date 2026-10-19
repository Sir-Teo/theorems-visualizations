# Microeconomics monopoly-welfare source audit

**Resolved: micro-10.4 and micro-10.5.** Parent source/model review, five independent mathematical groups, all eight native browser groups, scoped static checks and final screenshot inspection pass. Both source flags and the ledger are reconciled.

## Sources actually read

- Jonathan Gruber, MIT 14.01SC Lecture 14, *Monopoly I* (2011), [original lecture transcript](https://ocw.mit.edu/courses/14-01sc-principles-of-microeconomics-fall-2011/b3a72b11f5f3f988c386979f5038ca94_MIT14_01SCF10_lec14_300k.pdf). Read the entire welfare and perfect-discrimination discussion, PDF pp14–19. The missing beneficial trades, transfer/loss distinction and unweighted monetary-surplus limitation are explicit. The lecture's numerical rising-cost example is not silently identified with our constant-cost examples. No historical claim about Harberger's empirical paper is retained; that original paper is not claimed read.
- Glenn Ellison, MIT 14.271 Lecture 3 (2022), [original slides 3–5](https://ocw.mit.edu/courses/14-271-industrial-organization-i-fall-2022/mit14_271_f22_lec3slides.pdf). Read the taxonomy, full formal first-degree offer/participation/profit argument on slide 4, and listed information, monitoring, resale and administrative limits on slide 5. The full lecture's later models are not claimed reviewed.
- Sara Ellison, MIT 14.27 Lecture 13 (2014), [first-degree discussion pp1–2](https://ocw.mit.edu/courses/14-27-economics-and-e-commerce-fall-2014/01454b51f87e5907b6097de412687b59_MIT14_27F14_Lec13.pdf), including the unit-demand case, complete benefit integral, exact extraction, efficient output, distributional qualification and arbitrage requirement. Inspected the actual formula/diagram page. No legal assertion is imported from the introduction, and Pigou's original book is not claimed read.

## Corrections

**10.4:** At the actual isoelastic endpoint c=0.5, e=4, efficient quantity is 65,536 and monopoly quantity is 20,736. The former root bracket ended at 400 and the diagram capped quantity at 60. These are now exact interior solutions with complete adaptive quantity views. The former total-surplus computation also discarded the high-value near-zero demand interval; the integrable singularity is now included in an exact antiderivative, with W(0)=0. The visible finite demand/MR branches are explicitly qualified as continuing above the price window. The full loss region, both choices and the complete zero-origin surplus curve remain in view. Curved-demand loss is described as an area, rather than universally as a triangle. Constant cost, integrable benefits, no externalities/fixed costs and the unweighted welfare convention are explicit.

**10.5:** The finite market is now defined consistently by midpoint values and one unit per buyer. Changing buyer count changes that finite market; it is not an exact fixed continuum. All totals use exact finite sums. A below-cost posted-price experiment may serve buyers whose value is below cost: loss equals both missed positive gains and waste from those inefficient sales. At actual n=5, c=6, p=0, actual total surplus is −5, efficient total is 4 and loss is 9; the former code incorrectly reported loss zero and called the current total the possible maximum. A separate signed accounting panel makes this case visible. The exact best common-price button compares every finite demand breakpoint; arbitrary prices are not described as optimizing monopoly choices.

Perfect discrimination explicitly uses known values, individual enforceable offers, blocked resale, constant unit cost and acceptance by indifferent buyers. Exact extraction makes buyers indifferent; a small discount gives strict acceptance with arbitrarily close extraction. The equality-value convention is explicit and affects served count without affecting surplus. Single-division rational value evaluation preserves actual grid ties such as n=20, value=cost=3.25; the former subtractive expression moved that buyer slightly below cost. The perfect policy has zero buyer surplus and loss and captures the efficient total. No general empirical, legal or distributional welfare conclusion is asserted.

## Independent mathematical evidence

`node --test tests/verification-micro-monopoly-welfare.test.mjs` passes **5 groups**. The draft first passed outside the default glob, and the repository copy passed after wiring.

1. Independent adaptive numerical roots cover every actual cost/elasticity grid setting in both demand families, including the former out-of-bracket endpoint.
2. Independent Simpson integration after q=Q t^8 includes the near-zero benefit of the isoelastic curve. It verifies surplus, consumer/producer decomposition, the direct loss integral and the transfer-plus-loss identity at corners and interior settings.
3. Independent global quantity searches and two-sided profit comparisons verify the monopoly and efficient choices.
4. Every finite buyer count, every actual common-price grid setting and representative costs satisfy independently summed profit, buyer surplus, total, efficient total and both loss components. Actual below-cost and indifferent-buyer regressions are explicit.
5. Every buyer count and every cost grid setting is checked against every common-price demand interval. Perfect discrimination dominates those profits and maximizes all feasible allocations exhaustively for markets with up to 12 buyers.

## Native evidence

`node tests/verification-micro-monopoly-welfare.mjs` passes **all 8 groups** at 1450/430 × light/dark. Each matrix cell exercises both linear cost endpoints and all four isoelastic cost/elasticity corners; all eight common-price endpoint combinations and all four relevant perfect-discrimination corners; every buyer count at both cost endpoints using the exact optimum button; and actual equality-value cases at n=5,c=5 and n=20,c=3.25. Independent numerical identities, all finite path/area/bar coordinates, dot-ring bounds, measured custom-label containment/nonoverlap, display TeX, literal readout escapes, page overflow and runtime errors pass.

The first run caught a 7px mobile display-formula overflow. Screenshot inspection also caught literal newline escapes in the readouts. Both were corrected before the complete final rerun.

Inspected final desktop/mobile screenshots in both themes: the maximum-quantity isoelastic state, high-cost curved state, below-cost negative-profit/negative-total bars, exact best price at 40 buyers, and the equality-value perfect policy. Full chosen quantities, areas, bars, labels, axes/ticks, equations and controls remain visible and legible. Representative final images are `/tmp/atlas-micro-monopoly-welfare-10.4-iso-2-430-dark.png`, `-10.4-iso-3-1450-dark.png`, `-10.5-below-cost-430-dark-panel1.png`, `-10.5-best-40-430-dark.png` and `-10.5-roundoff-tie-430-dark.png` (abbreviated names retain the `/tmp/atlas-micro-monopoly-welfare` prefix).

## Local original-source evidence

Read October 19, 2026. These PDFs are local review evidence, not committed copies.

- `/tmp/atlas-micro-gruber-monopoly.pdf`, SHA256 `5cf99e465f565fbc8a1a7b816acab6497b3ad9474c43e0329ef76bbf2f4352b0`; complete relevant text `.relevant.txt`; renders `-page{13,14,16,17}.png` (zero-based PDF indices).
- `/tmp/atlas-micro-glenn-ellison-discrimination.pdf`, SHA256 `31552a06059fd7b874ec86917c69faf67b7ed73a0c70292628297644b0c63d25`; exact text `.relevant.txt`; renders `-page{2,3,4}.png`.
- `/tmp/atlas-micro-ellison-discrimination.pdf`, SHA256 `12126bbd644af2a21b4227d72398d7392fdaf0fba5d33760fbdf6e996e105bd1`; first-degree text `.relevant.txt`; actual source renders `-page{0,1}.png`.

Only content objects and syllabus rows 10.4/10.5 are changed. Neighboring objects 10.1/10.2/10.3/10.6 are byte-identical to HEAD. Flags remained set through agent handoff; parent integration clears both and reconciles the central ledger after independent checks.

Parent review added differentiability and a finite efficient-quantity crossing to the generic10.4 statement. Strictly decreasing P=c+exp(−Q) is a counterexample to the former insufficient generic hypotheses, even though both displayed families already satisfy the corrected ones. Four final1450/430 × light/dark statement/layout checks pass after this clarification; root inspected the final mobile statement. Parent logs: `/tmp/atlas-root-micro-monopoly-welfare-{math,native,static,hypotheses}.log`. Parent read the full specified source text and inspected original first-degree/distributional pages plus final maximum-quantity, signed-accounting and equality-value screenshots.
