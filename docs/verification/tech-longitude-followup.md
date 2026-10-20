# Technology5.9/5.10: longitude and the authored voyage model

Candidate pair for independent acceptance. Both existing verification flags remain true. Closure is recommended only for the revised scope after independent review. No global queue, shared runtime/helper, package or generated-data changes.

## Actual primary and owner evidence

Read and personally inspected **all three pages of the actual contemporary print of the Longitude Act1714**, printed355–357, Cambridge Digital Library **RGO14/1 fols.11r,11v,12r** (scans21–23). [Owner reader](https://cudl.lib.cam.ac.uk/view/MS-RGO-00014-00001/21), [actual owner IIIF manifest](https://cudl.lib.cam.ac.uk/iiif/MS-RGO-00014-00001). Image services from that manifest:

- [355/11r](https://images.lib.cam.ac.uk/iiif/MS-RGO-00014-00001-000-00021.jp2/full/2400,/0/default.jpg), local `/tmp/atlas-worker-two/tech-sources/longitude-act-11r.jpg`, SHA256 `ba0dd3ef906e47d20a98cf7f7cbba2e48fa28733b50e8366c90f17926164cc30`.
- [356/11v](https://images.lib.cam.ac.uk/iiif/MS-RGO-00014-00001-000-00022.jp2/full/2400,/0/default.jpg), `longitude-act-11v.jpg`, SHA256 `7d9604c1617b76dd8642b80a138d583587dc59cbce4019225a21c2755942341d`.
- [357/12r](https://images.lib.cam.ac.uk/iiif/MS-RGO-00014-00001-000-00023.jp2/full/2400,/0/default.jpg), `longitude-act-12r.jpg`, SHA256 `b538fed818fe04251c31a47f59d2d5736b8f0b5fe7e369e4286358d561341a65`.

The text addresses commissioners, experiments and assessment. Page356 grants the three amounts£10,000/£15,000/£20,000 at one degree/two-thirds/half the stated great-circle distance. Page357 continues the half-degree clause and imposes further conditions, including the nominated GreatBritain→WestIndies voyage and staged payment. There is **no six-week duration** in these three complete pages. Angular error alone is not award eligibility. A [Royal Observatory Greenwich comparison/transcription](https://www.royalobservatorygreenwich.org/articles.php?article=1312) helped locate/transcribe the print; the actual Cambridge originals, not that comparison alone, support the audit. The RMG library catalogue [RMGL-665](https://www.rmg.co.uk/collections/library/rmgl-665) independently identifies the contemporary printed355–357 object.

Read the actual complete main description and object details of [Royal Museums Greenwich H4, ZAA0037](https://www.rmg.co.uk/collections/objects/rmgc-object-79142). It identifies Harrison's longitude watch, completed1759, work begun1755, with stable high-frequency balance. Local `rmg-h4.html`, SHA256 `840b23be7c8d684edbf6a13b4b5c7d86618e663e4df1b90f8ee64d219e75a093`. Personally inspected the actual owner's [front photograph](https://collections.rmg.co.uk/media/450/724/f7024_001.jpg) (`h4-front.jpg`, SHA256 `52e02a4c475f32bfac56bb9614a0e79380891cd6dd4a04ced94aeb34c6b9aaf0`) and [movement inscription photograph](https://collections.rmg.co.uk/media/450/754/f7024_011.jpg) (`h4-inscription.jpg`, SHA256 `c2c7c0bbe58eccb37fe459e46743cd95ae3ea3c88708bd0ffe6d858450ea1528`): actual “John Harrison & Son A.D1759” inscription visible. The gallery contains other views with mixed captions; they are not all assumed to depict unchanged original H4 parts. The separately read movement-parts record ZAA0037.5 names MODChronometerWorkshops and an unknown date; it is **not** used to authenticate every component as1759.

The main owner record does not independently establish the old item’s precise5-second/81-day Jamaica trial, contested interpretation, complete payment history, Frisius1530 proposal, Godfrey/Hadley priority or later makers' replacement chronology. Those claims are removed rather than certified from unread secondary citations. No full trial-journal reading or calibration of H4 is claimed. The owner describes H4 as prize-winning, but the display itself makes no adjudication based on a simulated clock error.

##5.9: one signed error model

Previously the present-position clock-error slider and the rate-versus-time plot were unrelated, the large-rate line exceeded fixed bounds, the map could clip the inferred marker, and copy treated the angular band as an award decision with an implied statutory six-week duration.

Now the signed model is ε(d)=60initial+rate×d. East longitude is positive: a fast reference clock gives inferred longitude λ−ε/240 degrees. The complete curve is |ε|/4 arc-minutes, with every integer day0…90 and the **exact sign-change vertex**, if internal. The selected continuous day uses the same formula. The map contains the full offered true and inferred domain with complete marker/handle extents.

A spherical convention of60nauticalmiles per degree gives parallel arc |ε|cosφ/4. It is explicitly a **parallel arc**, rather than a shortest ellipsoid/geodesic distance, and not a measured observational error. Apparent solar time, equation-of-time correction and local/reference mean-time distinction are explicit. The42-day comparison is an authored zero-initial-error illustration, not the Act's required voyage duration. Initial offsets may reinforce/cancel rate error.

Controls: continuous initial−8…8minutes, signedrate−20…20seconds/day, selectedday0…90, truelongitude−78…8°, latitude3…62°. A genuine ship drag updates both coordinate controls; controls update the handle. A local raw-domain `handle.set` guard rejects[99,99] before runtime clamping, and an item-local agreement adapter rejects valid-but-inconsistent saved handle/control pairs. All state is registered; no shared runtime changes.

##5.10: exact discrete mean, explicit sensitivity and seed

The prior display's thermal readout used cWD/2 while actual increments used an end-of-day ramp plus sine. Its asymmetric lower plot bound clipped negative trajectories; an unregistered hidden seed broke replay. Profile names could suggest that authored coefficients were measured for historical clocks.

Now three explicit tuples(c,s,m)=(1,2,.5),(.5,1,25),(.02,.1,.05) are named thermal-sensitive, motion-sensitive and low-sensitivity. **All are uncalibrated authored inputs**, not H4 data. At dayj the temperature is Wj/D+1.5sin(.9j). Exact prefix mean is c[Wd(d+1)/(2D)+1.5sin(.45d)sin(.45(d+1))/sin(.45)]. This matches a direct independent loop at every prefix for every D10…100, including W0. Under independent standard-normal increments the random-component variance is d(s²+m²); that is a model assumption, not inferred from five trajectories.

The specified seeded generator is a32-bit LCG, state←1664525state+1013904223 mod2³², uniform(state+.5)/2³², followed by cosine Box–Muller using two uniforms per normal. The actual generator agrees with an independent BigInt arithmetic oracle. Five runs use seeds13seed+i. These are deterministic pseudorandom illustrations of the stated model, not a proof that a finite generator produces independent Gaussian variables. Both plots retain **all D+1 samples of all five runs**, and the signed plot contains both negative and positive extrema without arbitrary caps. The exact systematic mean is drawn separately. Seed11 with the motion-sensitive profile, D100,W0 gives a negative excursion below−900s, which the old asymmetry would clip; it is now fully visible.

Controls: strict selected profile; integerdays10…100; continuousW0…25°C and latitude0…65°; integerseed1…9999. The actual NewVoyages button advances/wraps that saved control. Replay reproduces all samples and readout exactly. The endpoint count inside120seconds is explicitly not an estimated historical success probability or award decision.

Read actual prerequisites tech5.6/5.8 (separate ideal oscillator models), geog2.4 (both north/south noon branches and observational qualifications) and geog1.3 spherical-distance geometry; none calibrates this authored error model. Syllabus rows now match source evidence, signed models and replay behavior.

## Verification

- `node --test tests/verification-tech-longitude.test.mjs`: **7 independent math groups pass**. Signed rotation/distance geometry; all full affine samples/zero crossings/thresholds; all91voyage lengths and prefix temperature sums; BigInt generator oracle and every actual run; theoretical mean/RMS/endpoints/bounds; actual large negative trajectories; strict domains. Log `/tmp/atlas-worker-two/tech-longitude-math.log`.
- `node scripts/check.mjs tech-5.9 tech-5.10 --static`:2items,0errors/0warnings. `tech-longitude-static.log`.
- Native results and personally inspected output pixels are recorded below after the complete final matrix finishes. Fresh narrow peer CLI is `node tests/verification-tech-longitude.mjs ITEM THEME WIDTH`; output may be redirected with `TECH_LONGITUDE_OUTPUT`.

No source-access blocker remains for the revised retained statements. Unsupported precision/priority/trial claims remain uncertified and are not silently restored.

Final native matrix: **all12groups pass**, both items1450/430/320×light/dark, `/tmp/atlas-worker-two/tech-longitude-native.log`. Every parameter corner (32longitude and48voyage profile/corner combinations per group), all full paths/samples, exact selected-state/readout, native segmented profiles, seed-wrap button, real ship drag, all native keyboard endpoints, off-grid continuous controls, exact replay, out-of-domain/fractional discrete/unknown-profile and inconsistent-handle saved states. Actual path/stroke/marker/handle/text/TeX/control/page bounds are checked. The full matrix was restarted after the final strict integer-control correction; the log contains12passes at the final source state. Native exploration first exposed a too-wide single-line formula (split into short display equations), then the need for `int:true` so fractional saved day/seed values are rejected. No runtime edits were needed.

Personally inspected final320dark5.10 negative-trajectories full page,1450light5.9 zero-crossing full page,320light5.9 actual map panel and430light5.10 seed-replay error panel. All curves and markers remain visible, negative excursions are fully contained, controls/readout are legible and the theoretical mean is visually distinct. Evidence `/tmp/atlas-worker-two/tech-longitude/`. Original Act and H4 source pixels were inspected separately above.

Exact guards confirm all5.7/5.8/5.11chapter bodies and all unowned syllabus rows are byte-preserved. `git diff --check` passes. Both candidate flags remain true pending independent acceptance.

## Independent-review state follow-up

The coordinator independently reproduced a missing case in735e0f: change only the valid saved longitude slider from−35 to−34, leaving its saved handle/agreement values unchanged. Runtime handle restoration invokes `onDrag` even though the pointer is not dragging, so the old callback silently overwrote the restored slider before the agreement adapter checked it. The old invalid cases caught malformed handles but missed this valid slider-only discrepancy.

The instance-local ship callback now updates coordinate controls **only during actual dragging** (`ship.dragging`). Restoration leaves restored controls intact until the custom agreement check accepts/rejects the complete state. No runtime change or source/math model change. Added explicit valid longitude-only(−34) and latitude-only(39) invalid snapshots; all agreeing off-grid full states and actual drags still replay exactly.

Fresh **7math groups**, static2items(5.9/4.8)0/0, and **all6longitude native groups**1450/430/320×light/dark pass at this repair. Logs `tech-longitude-state-repair-{math,native}.log`, `tech-coordinate-state-static.log` under `/tmp/atlas-worker-two/`. The full unchanged5.10matrix above remains applicable. Inspected the newly generated320light full longitude output. Flag remains true pending independent confirmation of the repaired exact commit.
