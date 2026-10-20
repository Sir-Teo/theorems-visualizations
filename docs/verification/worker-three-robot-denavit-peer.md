# Independent Denavit–Hartenberg review, exact659731fd

Reviewed immutable archive of `659731fd8275c6137a4082c85e0d13ca7f13208c` under `/tmp/atlas-worker-three/robot-denavit-peer`. No producer worktree, implementation or global ledger was edited. Source and mathematics are supported. One additional saved-camera defect requires a bounded follow-up before final acceptance; the coordinator assigned that correction to the producer.

## Original body and convention

Copied the actual seven-page original facsimile into own evidence and checked all4,239,825bytes against SHA256 `dd9f1c8ad008fe65d211707aa394c0b81458a38494cdd0f650e38282141ac28e`. Personally read all seven independently rendered own page images, printed215–221, including p215's six lower-pair types and publication/manuscript distinction; p216's line parameters and common-perpendicular frame construction; pp217–218's slider-crank closure, screw lead and lower-pair decompositions; p219's homogeneous-first Eqs.(4)–(7); and pp220–221's screw/universal-joint examples, summary and bibliography. The original is a legible image scan; no OCR or text extraction is claimed. A few rightmost characters on p220 meet the scan edge, as the producer notes. The retained claims and displayed matrix are legible.

The cache is the recorded public Konkuk faculty-course archival PDF, not an abstract, modern textbook or the1956 discussion. Own web-reader attempt at the exact archive URL was unavailable; I rely on the actual complete cached body and matching provenance/hash rather than claiming fresh network retrieval. Own source PDF and pixels are `/tmp/atlas-worker-three/robot-denavit-peer-evidence/denavit1955.pdf` and `source-{1..7}.png`.

Independently transcribed source Eq.(6), p219: coordinate order is(H,X,Y,Z), rotation is Rz(θ)Rx(−α_source), translation is(a cosθ,a sinθ,s). Permuting both rows and columns to(X,Y,Z,H), with d=s and α_modern=−α_source, gives the implemented classical transform. Printed Eq.(7)'s inverse signs agree on both sides. The candidate clearly distinguishes the modern directed a and serial indices from the source's geometry, and the authored open revolute chain from the original closed-chain examples.

The factorization Aᵢ=ZᵢXᵢ, Bᵢ=Xᵢ₋₁Zᵢ, X₀=I proves A₁…Aₙ=B₁…BₙXₙ. The terminal fixed tool is necessary; relocation of intermediate frames does not change the tool. Six lower-pair types are not represented as four independent freedoms per joint, and choosing parameters does not ensure loop closure. No source/model finding remains in these claims.

## Independent verification completed

All five supplied math groups pass, including20high-precision cumulative-pose fixtures,480source/inverse/permutation cases,1000canonical chains and4896individual offered ticks. Own path-adjusted85-digit Decimal regeneration is byte-identical to the committed reference, SHA256 `4bb172d62bbb7ef355b867444c97bde9996e4690f10240d29b4668b132fc0d9c`. Focused static: one item,0errors/0warnings.

Added an independent quaternion/world-point oracle, with no production matrix construction:600distinct canonical four-row tables × all four counts,2400configurations. It checks every intermediate basis/translation/offset foot, arbitrary point transformed through the reordered original, and the terminal pose. All pass. Script/log `quaternion-oracle.mjs`,`quaternion.log` in own evidence.

Both fresh full320px native groups pass, output overridden to own `robot-denavit-peer-evidence/native`. Every one of16stored row parameters has endpoint/intermediate/keyboard/real-pointer/exact-replay coverage; all four active counts and both conventions, inactive-row independence, camera drag/replay and edited full saved state pass. All17actual numeric DOM ranges, including hidden controls, equal registered/model values directly. Each theme rejects120malformed raw components to the exact whole default state. Actual table text, tool projection, frame markers, strokes, arrowheads, markers, canvas text, TeX and page bounds pass.

Sixteen extra fresh narrow full-state cases cover complete degeneracy, a long collinear chain, extreme signed geometry, asymmetric rows, both conventions, pitch endpoints and a very large finite yaw. Registered/saved values and replay remain exact; independently computed Node-versus-browser derived matrices use a numerical tolerance, since different libm paths differ by approximately one last-place bit for some angles. This changes no production code and does not relax saved-state/actual-DOM equality. Every extra geometry check passes. The high-yaw case then exposed the interaction defect below.

Personally inspected all seven own source images and own output panels: default and edited light scene, modified dark table/tool row, rotated dark scene, edited dark table, plus degenerate/collinear/extreme/asymmetric extra scenes. Geometry and table/source-convention text are legible in both narrow themes; coincident frames naturally overlap in the fully degenerate construction. Logs `math.log`,`static.log`,`reference.log`,`native-{light,dark}.log`,`extra-native.log` are retained in own evidence. No new complete-repository test claim is made.

## Actionable finding: accepted saved yaw can disable horizontal rotation

**P2 — `content/robot/source-audit-denavit.js:33`.** The new opaque camera validator accepts every finite yaw. A manually edited valid saved camera `[1e300,0.3]` restores with no notice and captures exactly, but a real141px horizontal background drag leaves both yaw and pitch unchanged because the yaw increment is below floating-point resolution. The same physical drag after restoring ordinary `[-0.8,0.3]` changes yaw to approximately−2.2099999237060546. Thus a camera declared valid by the local saved-state schema can lose the advertised rotation interaction.

Exact own reproduction and log: `/tmp/atlas-worker-three/robot-denavit-peer-evidence/camera-repro.mjs`, `camera-repro.log`. This is an extreme edited state, not a defect of ordinary camera dragging or the source mathematics.

Recommended bounded contract, sent directly to the producer at the coordinator's request: declare a supported yaw interval, reject unsupported raw saved yaw before assignment with visible whole-state rollback, and keep every real-drag camera inside that same interval through instance-local wrapping after the scene callback. Do not silently sanitize valid raw replay or change the shared scene runtime. Preserve all16rows and camera/saved equality. Check unsupported positive/negative huge yaw, valid yaw/pitch endpoints, real horizontal dragging across the local wrap boundary, exact replay and complete actual geometry in both narrow themes.

Initial recommendation: **hold final acceptance for this local runtime correction**. The actual original-body/source-convention and independent math review pass. Preserve this finding when recording the corrected exact follow-up and final independent recheck.
