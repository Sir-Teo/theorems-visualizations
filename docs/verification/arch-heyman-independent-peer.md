# Independent ARCH3.14 peer — 20 October 2026

**Accept the bounded source/math/native candidate at exact commit `b33b4e0434eb28a6425010fc8a6dc3e2f8e43b40`**, which includes production commit `65873678fcf45f17a5b3e309f7aa51ef6230eeb3`. The recovered-source report is its earlier report-only parent `168369c` (cherry-pick of `4273638`). This review edits no content, flag, shared runtime, source ledger or global inventory. Coordinator acceptance/flag closure remains a separate operation.

## Independent source examination

I read the entire recovered original's complete text/body, not merely an abstract, title or producer summary. I independently checked its SHA256 `dce53c6e4b96f0068f72caed9842d6189635b841f06fde0844fa59dd6258e49a`, 2,136,404-byte payload, 43-page PDF information, unencrypted state and final `%%EOF`. I independently rendered all 43 pages into `/tmp/atlas-thermo-peer/source/`, inspected all eleven fresh four-page sheets (the final sheet contains three pages), and inspected printed pp253–254 at readable full size. The header, printed sequence249–279, twelve inserted illustration plates, article title/author and terminal references39/received20July1965/multilingual abstracts agree. I do not infer the third-party mirror's affiliation or republication permission.

Load-bearing comparison against the actual original:

- Printed pp252–253: no tensile strength; effectively infinite compressive strength at generally low stress; no sliding. Heyman explicitly calls the infinite-strength assumption slightly unsafe, and discusses finite-crushing parabolic arcs rather than disguising it as a real-building guarantee.
- Printed p253 Fig.2: an axial force through the section edge has moment `M=±hN`; interior resultants admit compression; the edge is an ideal hinge limit. Finite compressive strength replaces the ideal wedge by parabolic arcs.
- Printed p254: the safe theorem requires an equilibrated thrust system wholly within the masonry, and its system need not be the actual one. The uniqueness/collapse result separately requires enough hinges for a compatible mechanism. The article credits Kooharian and Prager for applicability of limit theory.
- Printed pp256–260: mechanism formation, the distinction between admissible and actual thrust systems, and compatibility uncertainty support the retained explanatory scope. I also read the remainder on flying buttresses, domes, vaults and the Reims analogue. No building-specific numerical conclusion from those later sections is retained as an output of this local demonstration.

The candidate states the named whole-structure theorem with its ideal material/fixed-geometry/static-load conditions. It preserves and consumes the actual lower-bound prerequisite `solid-4.10`; I independently read that target statement and proof idea. The pressure experiment is expressly a local section witness, with no inference of whole-arch equilibrium, sliding resistance, out-of-plane adequacy, support safety, measured building stresses or actual collapse hinges. Removing the inherited arch solver claims is consistent with this bounded acceptance. This is acceptance of ARCH3.14's present claims and authored local example, not certification of neighboring ARCH visualizations.

## Independent mathematics

For a unit-width section `[-h,h]`, a compressive force `N` and moment `M` require resultant `e=M/N`. With finite cap `f_c`, the maximum moment at fixed force is obtained by filling an edge-attached strip of width `N/f_c` at pressure `f_c`; its centroid is `h-N/(2f_c)`. Hence `M_max=hN-N²/(2f_c)`, or `|m|≤n(1−n)`, `0≤n≤1`. Reflection gives the negative branch. This is an independent derivation of the stated normalization and cap geometry.

For an interior chosen `q=e/h`, the displayed uniform block has width `2h(1−|q|)`, centroid `hq` and pressure `f_c n/(1−|q|)`. Direct integration gives force `2hf_c n` and moment `2h²f_c nq`. At an edge, a positive force on zero contact width requires a singular limit, and outside the joint no nonnegative compressive pressure can have that centroid.

The final item explicitly defines control values as exact canonical decimal strings for classification; floating coordinates/pressure are labeled as such. Its scaled-integer classifier is correct for that declared semantics. The earlier product-rounding false-red boundary in `6587367` is corrected in `b33b4e0`; no epsilon enlarges the admissible set.

The new independent `tests/verification-arch-heyman-peer.mjs` passed against the immutable final archive:

- **28,679** decimal-domain states independently classified using rational cross-products, including both signs and exact boundaries.
- **1,255,093** independent midpoint pressure-bin integrations recover the requested force and moment from the actual contact geometry.
- All **4,096** binary pressure-cell occupancy patterns, examined at **12** fixed force levels, confirm that edge filling gives the maximal/minimal moment and hence the parabola.
- Retained theorem assumptions, collapse-mechanism caveat, exact-decimal declaration and local/global boundary are asserted without asserting review flags.

All **6/6** producer math groups were separately rerun in the fresh archive, including their decimal-neighbor/nextUp-nextDown checks. No mathematical blocker remains.

## Fresh native and actual pixels

I reran `tests/verification-arch-heyman.mjs light 320` and `dark 320` with my own output directory. Both pass: 45 numerical states per theme; actual numeric native range values equal model/saved values; selected point and pressure rectangle match; real pointer drags of both controls; Home/End/ArrowLeft; exact off-grid replay; eight malformed raw whole-state rollbacks per theme; full path/rectangle/arrow/marker/text bounds; no JS/TeX/blank/page-overflow errors. These are my own two narrow native runs; I do not claim to have independently repeated the producer's other four desktop/intermediate runs. No audio is offered.

I personally inspected my fresh default light full page, singular-edge dark full page, finite-cap-failure light pressure/yield panels, and dark default panels. I additionally checked the **actual built production page** at320 in light/dark, explicitly verified its active theme, waited for both visualization and proof to load, and inspected fresh actual production scope and proof PNGs in both themes. The declared decimal semantics, source-permission caveat and local/global limitation are present and legible; no equation or body overflow appears. An initial production probe's premature read and an incorrect text locator were corrected; the final production checks wait for loaded content and pass. A theme assertion also ensures that the final dark screenshots are actually dark.

Strict build in the final archive: **6684 written / 6890 planned / 450 chapters / 85 collections**, **0 errors / 0 warnings**, home **112695 gzip bytes**. Targeted static check: **1 item / 0 errors / 0 warnings**. This is an isolated candidate build, not a full integrated test checkpoint.

Independent parent-archive object comparison passes for every unowned `arch/ch03-b.js` item (including functions), the whole syllabus except owned3.14 row, and the unchanged3.14 prerequisite array. No new prerequisite edge is accepted here.

Evidence root `/tmp/atlas-thermo-peer/`: immutable `final/` archive, `source/` fresh43page renders and sheets, `math-independent.log`, `math-producer.log`, `build.log`, `static.log`, `preservation.log`, `native-light.log`, `native-dark.log`, `production.log`, and fresh `native/` PNGs. The original PDF remains at `/tmp/atlas-worker-two/heyman-original-recovery/heyman1966-archived-original.pdf`. The separate ephemeral production test is `final/tests/verification-arch-production-peer.mjs`; it is evidence instrumentation only.

Reproduce the committed independent numerical peer with `ARCH_HEYMAN_PEER_ROOT=<fresh final archive> node tests/verification-arch-heyman-peer.mjs`. Candidate native runs require their own `ARCH_HEYMAN_OUTPUT` directory. Source flag remains true in the delivered candidate until the coordinator records this independent acceptance.
