# Wave5 OPT5 independent review

Scope: sixteen new items5.1–5.6 and5.8–5.17. The existing5.7 alias is preserved. This reviewer owns only this report and temporary independent calculations; product findings were sent to the author and coordinator. Independent source, mathematical, native and visual review is accepted on the final frozen bytes. No required finding remains; reviewer browsers are closed. The original5.17 access flag remains explicitly open; acceptance covers the independently supplied mathematics and honest source scope.

## Actual sources and prerequisites

Independently read the saved actual official Boyd–Vandenberghe book `/tmp/atlas-boyd-cvx.pdf` through its extracted `/tmp/atlas-boyd-full.txt`: definitions and full-domain infima pp.215–219; LP dual forms and weak duality pp.224–227; geometric supporting sets and the complete Slater separation proof pp.232–236; saddle/optimality context pp.238–244; sensitivity pp.250–252; equality-variable/conjugate reformulation pp.253–255; strict alternatives and Farkas pp.260–263. Personally inspected the actual rendered printed227 and244 source pages. The chapter's finite-function Slater/Fenchel versions satisfy the qualifications actually used, instead of asserting unqualified dual equality for arbitrary extended-valued domains.

Read actual written opt1.9 (its equality-multiplier proof reaches vcalc2.14), opt2.7 (separation), opt3.8 (conjugate contacts) and opt4.4 (LP attainment/status) inputs. LICQ's local-coordinate argument reaches the existing implicit-function prerequisite through opt1.9. The Farkas proof supplies finite-cone closure and uses its declared projection input. No old chapter or source queue was reopened.

The raw value image G and augmented upper set A are correctly distinguished. A finite supporting slope at the optimum requires equality **and dual attainment**, whereas collapse of Slater can retain equal values with an unattained dual supremum. Complementary slackness is not presented as sufficient alone. Local LICQ necessity, zero-gap pair necessity and convex sufficiency have different hypotheses. Shadow-price differentiation is explicitly conditional on differentiability; its global supporting inequality does not assume it. The strict Gordan alternative does not mistake the always-feasible nonstrict homogeneous system for a strict one.

The historical Kuhn–Tucker1951 article body was inaccessible to the author (Berkeley403 and linked security challenge). This review does not retry or route around those failures. Item5.17 correctly retains **verify:true**, bibliographic-only original attribution and an explicitly supplied translated cusp calculation. No inspected original example, figure or original proof wording is claimed. The cusp/regularization calculation is independently valid and does not close the historical source flag.

## Findings repaired during review

1. Item5.3 initially separated A from an individual point below p*, which only gives a lower bound at that point's height. The final proof explicitly separates from the full convex lower ray B={(0,0,s):s<p*}, obtains inf_A normal≥sup_B normal=μp*, proves μ>0 using Slater/full-rank equalities, and then normalizes. This supplies the actual attained multiplier rather than inferring attainment from a sequence of lower bounds.
2. Item5.9 initially left the differentiability domain implicit. A zero-gap minimizer on a closed implicit domain need not have zero ambient gradient: D=[0,∞),f=x,no explicit constraints has attained value0 and gradient1. The final statement specifies an open common domain, and its local LICQ clause specifies an open neighborhood. This agrees with Boyd's explicit open-domain differentiability convention and keeps normal-cone boundary cases outside the displayed smooth KKT statement.

Both proof repairs were reread and accepted. Two additional bounded findings were repaired before native freeze:

3. New bounded handles5.9 and5.14 inherited a finite-only restore validator, followed by silent constraint clamping. Their per-instance adapters now validate raw coordinate bounds before any setter; malformed-handle rejection regressions cover both coordinates and both limits without invoking the setter. The saved candidate is no longer silently replaced on replay.
4. At5.10 raw α=1.6405908800195905,b=1.8064164137467742, the analytic button's rounded solution gives demand slack−2.220446049250313e−16. The original binary comparison labeled that state unconditionally infeasible. The scale-aware numerical-boundary branch now retains the signed residual and explicitly declines a feasibility certificate; it does not turn a tolerance into exact feasibility.

## Independent calculations

`/tmp/wave5-opt-review-export.mjs`, `wave5-opt-review-data.json`, `wave5-opt-review-oracle.py` and final log record **4,584 independent scalar comparisons**:

- HiGHS primal and separately posed dual LPs at240 seeded parameter states; another240 exact finite-envelope LPs validate discrete nonconvex gaps.
- Independent nonnegative least squares for planar-cone projections, including36 exact-ray and perturbed-ray boundary probes; projection points, distances and Moreau certificate products agree.
- SLSQP resource-allocation minima at240 states, compared with the analytic allocation/value. Maximum point difference5.76e−8 and value difference1.09e−14 reflect an independent numerical optimizer, not theorem error bounds.
- Four-hundred-digit quadratic/conjugate calculations at240 ordinary plus30 tiny/zero threshold states, including subnormal/tiny signed centres and penalties. Soft thresholds, dual contacts, values and selected lower bounds agree.
- Four-hundred-digit full-domain quadratic infima and minimizers at240 multiplier states.

The first external finite-envelope LP oracle had its two inequality signs reversed; `/tmp/wave5-opt-review-oracle-initial-sign-failure.log` preserves that reviewer error. Correcting the independently posed oracle gives the final pass. No product change was made to accommodate the erroneous oracle.

All17 current focused chapter math/metadata groups independently rerun and pass, `/tmp/wave5-opt-review-math.log`. These finite calculations and binary64 residual checks are evidence for the implementation; they do not turn a numerical sign or small residual into an exact constraint-qualification certificate.

## Independent production and visual acceptance

The reviewer independently runs the final actual production renderer at1200px and320px in both themes: **64 groups,500 physical actions and416 URL replay/rejection checks pass**, `/tmp/wave5-opt-review-native.log`. All visible modes, slider Home/End/intermediate states, both physical handle drags, analytic-solution buttons and mode-dependent hidden controls are exercised. Exact saved/model and native-range serialization agreement, edited/off-grid actual Create-state links, tiny/subnormal/collapse/active-set boundary states, invalid selects, each invalid handle coordinate, out-of-range values and malformed payloads pass. Minimum full handle/dot/ring/path clearance is6.9167CSSpx and glyph clearance3.1156CSSpx. No runtime/nonfinite, formula/text overflow or full-stroke clipping failure remains.

The extra rounded-resource case was independently checked at both supplied raw α/b pairs in all four theme/width settings, including the physical analytic button and true Share replay. A supplementary vertical audit checks every actual readout text range and clipping ancestor. The last line lies2.39–3.39CSSpx inside both readout and host bounds, with no clipping ancestor. Complete raw-state full-page screenshots show the final sentence intact; the earlier component-only PNG crop did not demonstrate product clipping. Evidence: `/tmp/wave5-opt-review-final.log` and `/tmp/wave5-opt-review-final/*rounded*-full.png`.

The initial in-memory native catalog injection omitted paper metadata and verification fields. A final bounded paper run injects production `paper`,year,introduces and verification fields and explicitly checks the actual citation card, verification label and their text bounds. **Four settings,64 physical actions and20 URL checks pass**, `/tmp/wave5-opt-review-paper.log`. The first metadata assertion expected lowercase text while CSS yields uppercase in innerText; correcting the reviewer assertion to case-insensitive preserves the successful earlier four resource cases and passes the paper rerun. This was a reviewer gate issue, not a product repair.

All32 narrow default widgets were visually inspected in both themes, plus complete narrow source/proof/scope pages3/9/16/17, the finite-gap/saddle views, strict-alternative and conjugate modes, tiny/no-multiplier cases, repaired rounded-resource full pages and final historical paper citation/flag pages. Final captures are in `/tmp/wave5-opt-review-production/` and `/tmp/wave5-opt-review-final/`. The chapter's plots compute the quantities described and retain explicit numerical/source limits. The static checker independently passes16 items,0 errors,0 warnings, `/tmp/wave5-opt-review-static.log`.

Final disposition: **accepted**. Source/model, state, production and visual findings are resolved; existing5.7 alias and the original5.17 source-access flag remain preserved. No product/shared/generated/Git files were edited by this reviewer.
