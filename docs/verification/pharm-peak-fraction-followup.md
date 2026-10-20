# PHARM2.8 positive bioavailable-fraction qualification

Independent peer `deep_peer` identified that the appended peak proof omitted the hypothesis F>0. With F=0 the Bateman curve is identically zero, even when dose, volume and both rate constants are positive; every time is a maximum and there is no unique peak. The bounded successor to `1c71e2a3b5eb9ddaa5a86c79f31d25cb1f404a21` adds “bioavailable fraction” to the list of positive inputs in that proof paragraph. No numeric value, statement, function, dependency, control, helper, data, source flag or other text changes.

`node tests/verification-pharm-peak-fraction-qualification.mjs` explicitly compares every byte of all21 PHARM modules with that immutable baseline, allowing only this literal. Its41 independent assertions include five F=0 flat witnesses and positive-F strict peak comparisons around the analytic stationary time. All pass. The equal-rate limiting curve retains its existing positive scale and unique1/k peak under the same newly explicit hypothesis.

Root's browser/heavy hold remains active. Fresh actual320px light/dark full proof pictures are pending release and independent closing review; no native or build completion is claimed at this source/math boundary. This successor earns no additional prerequisite credit and leaves PHARM3.12 source-open.
