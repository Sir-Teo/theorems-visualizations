# Independent uploaded-curve box design and arithmetic peer

**A curve box can be proved to contain every existing cheap segment box on the declared domain. Preserve the old sum association, or round upward after each addition in that same association. The report's grouped mathematical expression alone is not a sufficient JavaScript comparison certificate.**

This independently reviews thermo's exact report/evidence `5974e6552412e2b73e5b44e67844e5140b2a2bc1`, integrated by root5eb8. Actual implementation/proof source is separately pinned at `b6ca416f8b95b8e93bd12b9973ab0999f6519942`; that source is not in the producer report's unrelated checkout ancestry. I read the full report and actual uploaded geometry builder, original shader/group/union, private membership/cheap box and half/interval helper. This is a single report-only source/proof boundary. No runtime function, renderer/helper/model, browser, full-map, geometry regeneration, timing or performance test executed. Only independent offline scalar arithmetic and saved-ledger arithmetic were evaluated. No implementation or current-candidate approval follows; accepted light/dark static results and open lifecycle findings are separate.

## Premises from actual upload and membership

The builder creates a Float32 RGBA point array after flattening/filtering double coordinates. Padding occupies extra texture rows; pointCount excludes it. The per-range geometry comprises startPoint through startPoint+segments **inclusive**, and each emitted instance starts at startPoint+i for0≤i<segments. XY extrema must select all those actual Float32 XY lanes and keep the original path index. Min/max selects exact existing binary32 values, so storing four extrema in Float32 loses no information. Do not derive these values from ideal Bezier/endpoints, raw double paths, padded rows, arc/ID lanes or a scan excluding the final point. A zero-segment single-point range keeps identity and emits no instance. Distinct original double points can collapse after Float32 conversion; neither points nor zero-length incidence may be deduplicated.

Original group membership still uses original ordered style IDs and the group's saved original Float64 endpoint coverage test. A curve AABB is a later tile filter, not a replacement for membership. For every admitted path occurrence, increment the original stream count by all r.segments whether accepted or rejected by the tile filter; compare the full count with the original group's count. Emit each surviving range in original contiguous index order, including repeated path IDs/multiplicity. Preserve the original construction-stream comparison and GPU endpoint culling, clipping, dash/cap/style order, MAX-mask and one colour composite. Current original index buffers remain retained.

## Constructive domination proof of computed cheap boxes

Use RN to mean the actual correctly rounded binary64 JavaScript operation with the written association. Freeze the actual old box inputs:

- K=Math.fround(view.k)>0, TX=Math.fround(view.tx), TY=Math.fround(view.ty);
- actual Float32 q coordinates, global uploaded-half component bound J, and exactly the old radius computation R=J*(outerHi+extensionHi);
- d=view.dpr in{1,2}; pw/ph are the same rounded full primary pixel dimensions; Q=(pw+ph)/d uses the **full primary** dimensions, not mask/tile dimensions;
- C=128·2^-23=2^-16, and the old left-associated magnitude is RNfold([|ax·K|,|bx·K|,|ay·K|,|by·K|,|TX|,|TY|,R,Q,1]). The old guard is RN(1+RN(RN(C·M)·d)).

For one range's exact uploaded extrema define X=max(|xmin·K|,|xmax·K|) and Y=max(|ymin·K|,|ymax·K|). Positive K makes each segment endpoint product componentwise bounded by X or Y. RN multiplication and absolute extrema preserve that order. On this domain the binary32×binary32 products also fit exactly in binary64: at most48 significand bits, magnitude≤2^24, and the smallest nonzero product is much larger than binary64 subnormal limits.

A sufficient **fast comparison construction**, conditional on preserving the exact written association, is ordinary JavaScript left fold of `[X,X,Y,Y,abs(TX),abs(TY),R,Q,1]`. Every term dominates the matching original term. RN addition is monotone in each finite operand, so induction over the same eight additions proves Mcurve≥Msegment. No regrouping into 2X+2Y is allowed under this proof.

A robust **outward comparison construction** uses a genuine binary64 nextUp primitive: start M=X; for each remaining term in that same list, set M=nextUp(RN(M+term)). By the same induction, every partial M is at least the corresponding old partial sum. A single nextUp at the end of an arbitrarily regrouped expression is not this proof. Do not confuse nextUp64 with existing nextFloat32; either can be conservative with a different proof, but they have different sizes/costs. A nextUp implementation must handle signed zero/subnormals and exponent boundaries correctly; NaN/overflow is unknown/include, not a finite box.

Let Gplus=nextUp(RN(1+RN(RN(C·Mcurve)·d))). It is at least every old guard by monotonicity. For x, take Lx=nextDown(RN(xmin·K+TX)) and Ux=nextUp(RN(xmax·K+TX)); similarly y. Every original computed ax/bx lies in[Lx,Ux]. Define the output bounds conceptually as

```
loRadius = nextDown(RN(Lx - R))
hiRadius = nextUp  (RN(Ux + R))
loPixel  = nextDown(RN(loRadius * d))
hiPixel  = nextUp  (RN(hiRadius * d))
left     = floor(nextDown(RN(loPixel - Gplus)))
right    = ceil (nextUp  (RN(hiPixel + Gplus)))
```

and the same for top/bottom using Ly/Uy. Equivalently: outward subtract/add radius, outward multiply by d, outward subtract/add Gplus, then outward integer floor/ceil. This is proof pseudocode, not an implementation patch. Compared with each actual old expression floor(RN(RN(RN(min(ax,bx)-R)·d)-G)), every lower-bound step is≤ and every upper-bound step is≥. Therefore **Bcurve contains Bsegment coordinatewise for every segment of the range**, including computed rounding and final integer boundaries. If the original closed box intersects/touches the same clipped tile, so does Bcurve. Rejecting Bcurve from that tile cannot drop a segment accepted by the existing cheap filter.

This establishes domination of the old computed algorithm. It does not independently re-prove the old cheap box's entire shader/NDC/raster theorem or justify enlarging its admitted domain. Reuse the exact old half/style radius; if a new radius is substituted, independently prove it≥old R and use that same dominating radius in both M and output expansion. Do not replace rounded K/TX/TY by raw view values, use a narrower viewport guard, or change original group clipping.

On the validated domain, this construction stays finite: |q|≤2^20, K≤16, |TX|/|TY|≤2^20, original outward inverse≤1.000001 and outer≤5.000002 give R<161; Q≤16384. Thus the uninflated sum is<69,222,562<2^27, and the outward steps stay far from overflow. Pixel coordinates remain far below2^53 and outward integer operations remain safe. This is a coarse arithmetic bound, not a measured tight box or frame-cost estimate.

## Proved cheap final-inflation alternative for M

A later implementation need not use binary64 nextUp at every magnitude-sum addition. The specific positive expression below has a separate conservative proof on the same validated domain:

```
grouped = ((((((2*X + 2*Y) + abs(TX)) + abs(TY)) + R) + Q) + 1)
Mcurve  = RN(grouped * (1 + 64*Number.EPSILON))
```

This exact expression has six rounded additions. Multiplication of X and Y by2 is exact here. Put u=2^-53, so Number.EPSILON=2u and the exactly representable inflation factor is1+128u. Let S=2X+2Y+|TX|+|TY|+R+Q+1 as an exact real sum. All terms are nonnegative, all nonzero intermediate results are normal binary64 numbers, there is no overflow, and S≥1. The normal-rounding relative-error bound gives grouped≥(1−u)^6 S. Including rounding of the final inflation multiplication gives

Mcurve ≥ (1+128u)(1−u)^7 S.

Every old magnitude sum has eight rounded additions and an exact nonnegative term sum≤S, hence Msegment≤(1+u)^8 S. To certify the comparison without an informal approximation, Bernoulli gives (1−u)^7≥1−7u. For0≤u≤1, binomial expansion gives (1+u)^8≤1+8u+247u². Therefore the lower-minus-upper coefficients are at least113u−1143u²>0 at u=2^-53. Thus **this inflated computed Mcurve dominates every old computed Msegment**, including the final multiplication rounding. The ordinary old guard expression is then monotone, so using this Mcurve with that same guard computation also dominates old guards; an extra nextUp on the guard remains safe. The outward coordinate construction still applies.

The normal-intermediate premise is justified here by actual binary32 coordinates and positive binary32 K: each nonzero endpoint product is at least2^-298, well above the binary64 normal threshold; the other nonzero style/view terms are bounded away from binary64 underflow on the declared domain. Zero terms and a zero partial sum are exact and cause no difficulty. This argument depends on this specific expression/operation count, positive terms, the exact factor, finite validated inputs and the existing radius. It is not a proof for an arbitrary regrouping, cancellation, Float32 sum, compiler fast-math reassociation, or malformed/unknown data. It does not measure whether multiplication inflation or nextUp is faster, nor establish a native curve-filter implementation. Using the tiny factor may enlarge some final integer boxes; that is conservative.

## Concrete association counterexample

An independent binary64 arithmetic witness obeys the old supported numeric tests: K=16, both uploaded XY endpoints `(1048576, Float32(.6·2^-27/16))`, J=1, width2, butt caps, DPR1, TX=TY=0, pw=ph=100. A collapsed Float32 segment is a permitted incidence; this is a synthetic supported-number witness, not a claimed curve in the frozen atlas. Here qy=2.793967834868738e-10, X=16777216, Y=4.470348535789981e-9. The existing interval operations give inverseHi=1+4·2^-23, outerHi=2+3·2^-22, hence R=3+5·2^-22=3.0000011920928955; Q=200.

| Written calculation | Binary64 result |
|---|---:|
| Old endpoint terms, left-associated through all terms |33554636.00000121|
| Grouped2X+2Y followed by the same remaining terms |33554636.0000012|
| Difference |7.450580596923828e-9 = one ULP here|
| nextUp after each same-associated addition |33554636.00000127|
| Old guard |513.0031127929872|
| Grouped guard |513.003112792987|
| Outward guard |513.0031127929882|

This refutes an unconditional claim that the grouped floating expression dominates the old computed M. It is not a demonstrated one-pixel/native failure; a later proof cannot assume the error always disappears in final floor/ceil either. The constructive association-preserving proof above avoids that uncertainty entirely. Its finite offline witness is retained at `/tmp/atlas-new-curve-bounds-peer/association-witness.json`; no runtime box function was invoked.

Other independent counterexamples delimit the design: endpoint-only x bounds miss `(0,0),(8,50),(0,100)`; omitting the inclusive endpoint misses even `(0,0)→(100,0)`; a centreline/halfWidth-only bound misses normal/tangent/AA extension; replacing a path occurrence list `[j,j]` by `{j}` halves its ordered instances; a long U-shaped curve can box an empty central tile and retain useless segments. Unknown-return-as-false can cull all of them without proof. None is repaired by changing original membership or silently shrinking bounds.

## Required finite validators and unknown policy

These are concrete preconditions for a later separately scoped private prototype, not tests executed here:

1. Freeze the exact old cheap-box/shader/interval source and required arithmetic association. Validate finite positive view dimensions and d∈{1,2}; positive finite K from raw k∈[.01,16]; finite |tx|/|ty|≤2^20; rounded pw/ph positive safe integers≤8192; actual integer tile dimensions1..4096; width∈[.1,8]; cap round/butt. Preserve dash as original fragment semantics. The source's loose supported predicate alone is not a validator for malformed negative dimensions.
2. Require actual Float32 points/joins buffers, valid original pointCount and texture shape/padding, and enough XY/ID/join lanes. Scan no padding. All range starts/counts/startSegment are safe nonnegative integers, ranges retain original stable path indexing, inclusive end<pointCount, prefix sums agree with pointCount and segmentCount, no gap/overlap/cross-range segment, and paths are known nonempty. The saved identity pointCount−segmentCount=pathCount is necessary for this builder premise, not sufficient to validate every range. Treat genuinely empty/ambiguous source paths as unknown rather than borrowing the next range's point.
3. Check all emitted start/end indices satisfy original Uint32 and shader signed-int/address limits. Both endpoint curve-ID lanes must identify the same original range; first/interior/last flag classifications must match original shader use. Validate finite arc/ID lanes and original metadata length correspondence; do not infer ranges from nonzero XY or repair original data. Actual original and metadata model/ranges/paths/owner/generation correspondence must remain immutable for the frame.
4. Scan every inclusive uploaded point for finite XY and |XY|≤2^20; min/max must be selected from actual Float32 values. Validate stored extrema order and all point coverage. Zero coordinates and signed zero are valid. Scan every actual join component with the existing half-neighbor/possible-subnormal-zero enclosure and retain global J≤16; nonfinite/overflow/uncertain half conversion means unknown. Bounds may not use ideal normalized normals instead.
5. A later finite arithmetic validator should explicitly cover ±0, adjacent binary32s at coordinate limits and k=.01/16, translations near±2^20, width.1/8, d1/2, half-neighbors near2^-24/2^-14/1/10/16, and binary64 nextUp/nextDown across zero, smallest subnormal/normal and relevant2^24/2^25/2^27 boundaries. Include the association witness above, inclusive tile contacts, non-square terminal tiles and fractional phases. These examples validate a primitive/implementation against the proof; samples do not replace the all-input induction.
6. Reserve the flat bounds owner before allocation, retain at most one owner and one fixed scratch pair, release old ownership before replacement or explicitly account overlap, and preserve original-priority optional denial. Do not retain an unaccounted point→curve map, per-curve objects/joins/flags, second GPU bounds copy, or new full membership array. Borrow existing model ranges/IDs; retain exact order/multiplicity and full original count accounting even for culled ranges. Invalid association/lifetime/index metadata requires original whole-group binding or complete snapshot abort/fallback as appropriate; geometric uncertainty alone includes the entire original range. Unknown must never mean reject.

Zero-segment ranges emit nothing but remain in original indexing. If a curve bound is uncertain, emit its full original range in order. If the identity/range mapping itself is untrusted, guessing a range is not safe: bypass the optimization. Original stale/released snapshot defects remain independent lifecycle obligations; this proof does not accept their current behavior or authorize an unsafe replay.

## Independently verified storage and owner envelope

I independently read and hash-checked both saved complete JSON artifacts, recomputed original retained and historical peak by summing each original-owner snapshot, and recounted scratch attempts. Both give original retained52,913,740 and original peak54,599,720; chunk ledger has351 denied scratch attempts and one success. No extrema or complete uploaded arrays are in these saved files, so no actual per-path extrema/intersection census was inferred.

Actual pointCount1,161,473 minus segmentCount1,138,109 gives23,364 nonempty paths. XY array bytes are9,291,784; four Float32 extrema/path cost373,824; exact saving is8,917,960 bytes (8.91796 decimal MB). The replacement metadata owner is377,920 including existing4096 bookkeeping. With unchanged original history and one262144-byte scratch pair:

- conditional main retained =52,913,740+377,920+262,144=53,553,804;
- conservative historical owner envelope =54,599,720+377,920+262,144=55,239,784;
- headroom under64,000,000 =8,760,216.

Subtracting8,917,960 from the old observed peak63,895,600 gives54,977,640, which is262144 below the envelope. It omits the possibility that cheaper metadata permits scratch earlier, precisely where old scratch reservations were denied. The larger envelope is conditional on an unchanged original owner history and the stated ownership cap; it does not prove future originals/driver allocation chronology, current-content fit, transient physical memory or absence of optional-caused eviction. Incoming worker geometry, diagnostic RGBA and original construction Uint32 staging retain their original accounting/exclusions; no new staging may be hidden. Current-data path count23,955 only establishes383,280 bounds-array bytes, not current GPU peaks.

I also independently recomputed the original A0 group/clip/tile arithmetic from saved groups and map state: mask4096×1953,117 clipped style/tile visits,2,700,820 original instances and171 full-membership flush upper bound. A dominating curve filter conditionally retains at least the old112,334 indices/70 flushes and at most those original instances/171 flushes. Its worst case adds path-box work while keeping every segment. Long curves can make this slower; neither memory saving nor a segment/path ratio proves speedup. This is not a measured curve-policy count.

Saved light complete SHA256 `2be7611bd5bc3e4dc9318a53e6f355cb06019da5716e5f46f8776ad1ce6cc9a7`; dark `cd77e6e3abc4f0b6ea02adfcd9538c7e98d80d3b045cc3a3571208f3e0d8d75b`. Offline scalar/ledger notes are under `/tmp/atlas-new-curve-bounds-peer`. The source/proof is suitable as a design boundary for a separately authorized prototype with independent range/arithmetic/owner/native/lifecycle gates. It is not implementation acceptance or a performance claim.

## Exact source pins

Each inclusive line-range SHA256 hashes original UTF-8 bytes including newlines at exact b6ca416f above. Git blobs independently identify full source files.

| Source and inclusive lines | Git blob | SHA256 of exact range |
|---|---|---|
| `scripts/lib/map-chunked-indices-runtime.mjs:3–4` | `e6cc186f7794161bcdaa3aea12ee0da5630c8da4` | `ce1068495c0f9c59a9eb163c80f9f487a25b54ca48c3cea6791d66712dd3a0e5` |
| `scripts/lib/map-chunked-indices-runtime.mjs:14–18` | `e6cc186f7794161bcdaa3aea12ee0da5630c8da4` | `10b5d057d55de838e6804e40724dc393ceebac836d578864667446866a18912d` |
| `scripts/lib/map-chunked-indices-runtime.mjs:20–28` | `e6cc186f7794161bcdaa3aea12ee0da5630c8da4` | `d98286ad046408fa640069a00ed2b0787e364b15efd2ae4ad4d899acba4400cf` |
| `scripts/lib/map-segment-mesh-enclosure.mjs:5–10` | `05cd4f9ab848c33a54703a6338dd7fc0e2da0765` | `08fe10a944ec3be5cc4469ce00ad1cdd6aeca23f03f8a1fdf0b78c95138e00d6` |
| `scripts/lib/map-segment-mesh-enclosure.mjs:12–23` | `05cd4f9ab848c33a54703a6338dd7fc0e2da0765` | `3c8c668672cb39eb1f67f38084636b5a2220102512e9d0298e717c7de0af95b8` |
| `assets/js/map-scene-model.js:24–46` | `530504474ec18a0546c4215a8510963c8c995065` | `caf2cf1849f82738cf5363033a0dd96c5012978da85cbd1b46559d17b060aedc` |
| `assets/js/map-scene-edges.js:17–28` | `15f0e192ba7e295e0d6a055f1e17d0f85a9a9ae6` | `27886dd3e9ade4c2b7c67e06d34b27f259dcf6bfab94a5c128147bedd5f02941` |
| `assets/js/map-scene-edges.js:63–82` | `15f0e192ba7e295e0d6a055f1e17d0f85a9a9ae6` | `ca3363c19c60b4e9936ea40870c5fe1c50572f1f144f692dd63dc6faf6ead2c2` |
| `assets/js/map-scene-edges.js:93–103` | `15f0e192ba7e295e0d6a055f1e17d0f85a9a9ae6` | `9076e9ef0d0c033e6e6bce0c2118834d0fcf0e89cb19718d05833d3eb6d59e85` |
| `assets/js/map-webgl-scene.js:83–100` | `16110877f809b45b8970de62a86ed65f74695556` | `e94b4453992b7fb25615728283f72f8829f42e81d784878dc729ec30ac19ab47` |
