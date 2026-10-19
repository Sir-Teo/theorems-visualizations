# Topology: cover radii and compactness equivalence — 2026-10-17

Resolved `top-4.12` and `top-4.16`, closing all eight queued topology reviews. Also corrected the finite-prefix illustration in `top-4.15`. **795 source reviews remain** in other collections. Human sampling and subjective listening remain pending; Wave 5 remains gated.

## Primary text

Compared the specified Munkres second edition using the scan and SHA-256 recorded in [the foundations audit](topology-foundations-followup.md): Lemma 27.5, printed pp. 175–176/PDF sheets 95–96; Theorems 28.1–28.2 and Examples 1–3, pp.179–181/sheets97–98; Tychonoff Theorem 37.3, pp.234–235/sheet125. Read the proofs and examples, including the non-T1 example, rather than inferring correctness from citations. Replaced broad references and removed unsupported historical credits.

## Lebesgue number and geometric guarantees

The proof handles a cover containing X separately. Otherwise, choose a finite subcover and take the maximum of the distances to its nonempty relative complements. This function is finite, 1-Lipschitz and positive; its compact minimum is positive. A corresponding relative ball about every point lies in a member, which also proves the diameter version. The old visualization conflated this relative distance with ambient clearance inside drawn discs, and treated sampled minima as certificates.

The drawn clearance is now explicitly `ell(x)=max_i(r_i−|x−c_i|)`. For the compact seven-disc example, the worst angle at a fixed radius is halfway between two neighboring outer centers. Writing `c=cos(pi/6)`, the radial minimum is

`max(0.6s−r, 0.55s−sqrt(r²+0.64−1.6cr))`.

The two terms cross at `r=(0.64−0.0025s²)/(1.6c−0.1s)`. Before the crossing the central term dominates and decreases. After it, the outer term increases up to `0.8c` and then decreases. Thus the minimum on any displayed radial interval occurs at an endpoint or the crossing. The helper evaluates exactly these candidates. Over every supported scale `0.95≤s≤1.4`, the whole-disc minimum is the outer-boundary value `0.55s−sqrt(1.64−1.6c)>0`, from about0.018159 to0.265659. This gives an analytic uniform bound; the plot is no longer a grid-derived guarantee.

For each punctured-disc ring, let its scale be `s=2^(-j)`. Its14 centers have norm `0.75s` and radius `0.4s`. For `s/2≤r≤s`, the nearest center differs in angle by at most`pi/14`. Convexity of squared distance as a function of `r/s` bounds it by the larger endpoint value. Hence clearance is at least `c0*s≥c0*r`, where

`c0=0.4−sqrt(max(0.8125−0.75cos(pi/14),1.5625−1.5cos(pi/14)))>0.0836`.

Rings 0 through J cover the displayed annulus `2^(-(J+1))≤r≤1`, with analytic lower bound `c0*2^(-(J+1))`. The finite sample profile/marker remains labeled an estimate. A vanishing sequence of sufficient bounds would not itself disprove a Lebesgue number. The added counterexample does: every disc has minimum/maximum point norms between`0.35s` and`1.15s`, whose ratio is`23/7<4`. Thus no disc contains both p and4p. These pairs have diameter`3|p|` arbitrarily small and lie in the punctured unit disc, proving failure for the full infinite cover. Plot/probe extents now follow actual geometry; the probe stays in the displayed annulus.

## Compactness and finite previews

Completed the noncircular metric proof: sequential compactness first yields a cover Lebesgue number by contradiction using small-diameter sets and a convergent subsequence; a separated-sequence argument gives total boundedness; finitely many balls then yield a finite subcover. Invoking the compact-space lemma to prove compactness was circular. The limit-point-to-sequence argument uses the metric/T1 property to obtain infinitely many points in each neighborhood.

The diagram now displays all six directed implications. Munkres's `N × {0,1}` example, with open indiscrete pairs, supplies the missing limit-point-compact-but-not-sequentially-compact witness. Every nonempty subset has a limit point (the mate of any point it contains), but the pair cover has no finite subcover and `(n,0)` has no convergent subsequence. The ordinal example is sequentially compact: a sequence either repeats a value infinitely or has a strictly increasing subsequence with countable supremum below omega1. Infinite subsets have countably infinite bounded subsets in compact ordinal intervals; the initial-segment cover has no finite subcover.

For the compact product `[0,1]^[0,1]`, Tychonoff establishes compactness. Nonsequential compactness has an explicit witness: let f_n(t) be the nth fractional binary digit, with terminating dyadic expansions. For any subsequence, choose a nondyadic t whose selected digits alternate0 and1. That coordinate fails to converge, so there is no convergent subsequence in the product topology. This construction is explained directly rather than credited to an unsupported forward reference.

The neighboring bisection demo chooses a majority of a finite prefix, which need not retain infinitely many terms or locate a subsequence limit. Caption/readout now state that limitation and separately justify known analytic limits. Closed halves consistently include their shared midpoint, and plotted intervals use their true lengths.

## Checks

- `npm test`: 47 math, 20 science-kit and 57 content-verification tests pass. New checks cover all 46 compact-cover scales, attained analytic minimum witnesses, radial/angular bounds, punctured annuli and shrinking pairs, all six implication truth tables and finite-window membership.
- `node tests/verification-topology-covers.mjs`: six light/dark scenario groups; all cover/radius/ring endpoints, actual probe drags, full extents, guaranteed bounds, containment colors, all four sequence choices and seven compactness examples. Browser checks also inspect red canvas pixels when containment fails.
- Three-entry light/dark mode checks have no runtime, TeX, blank or quality warnings. Inspected cover and counterexample screenshots. No audio actions exist in these entries.
- Strict build/full static check: 6,684 items,6,890 planned,450 chapters and6,621 visualizations, no errors/warnings. Chapter 4 plus all three entry smoke routes pass.

These checks support the mathematical arguments above; finite sampling is not treated as proof of infinite-space claims.
