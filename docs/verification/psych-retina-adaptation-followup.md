# Psychology 4.1–4.2 — receptor distributions and dark adaptation

**Resolved after independent source/data, mathematical, native-input and screenshot checks; both source flags and the central queue are reconciled.** Scope is only the 4.1/4.2 objects and isolated import in `content/psych/ch04.js`, the exact syllabus rows, new source data/helper, dedicated extraction/math/native checks and this report. The additionally authorized chapter-summary repair changes only “absent from the fovea” to “absent from the foveal center.” All accepted chapter 3 and other neighboring objects/shared helpers are preserved. No human listening, visual-subject or approval gate is used or claimed.

## Sources actually read

**Christine A. Curcio, Kenneth R. Sloan, Robert E. Kalina and Anita E. Hendrickson (1990), [Human Photoreceptor Topography](https://christineacurcio.com/PRtopo/Curcio_JCompNeurol1990_PRtopo_searchable.pdf), Journal of Comparative Neurology 292:497–523, DOI 10.1002/cne.902920402.** The full searchable original is supplied by the corresponding author's [archive](https://christineacurcio.com/PRtopo/). Read the introduction and methods on PDF pages 1–7, and the relevant anatomical results on PDF pages 9–17. Visually inspected Table 3 on PDF page 3, Figure 6 on PDF page 10, Figure 9 on PDF page 13 and Figure 10 on PDF page 14; their rendered files are `/tmp/atlas-psych-curcio1990-source-{3,10,13,14}.png`. The complete 27-page paper was acquired, but the remaining discussion/bibliography was not read completely.

Local `/tmp/atlas-psych-curcio1990.pdf`, 4,760,561 bytes, SHA256 `413f9c4333cebb0e045da37be58156529df24b18abbfbe62eba7dad53f5a1ca7`; text `/tmp/atlas-psych-curcio1990.txt`. Text uses bundled Python `pdfplumber` and `page.extract_text()` with explicit PDF-page separators. Source images use `to_image(resolution=135).save(...)` on zero-based pages 2,9,12,13.

The paper reports selected whole-mounted specimens, individually reconstructed distributions and common-location resampling before averaging. Fellow eyes count as one individual. The entire study has eight retinas from seven people aged 27–44; not every specimen has a complete whole-retina map. Its whole-eye total summaries and the spatially truncated averaged reconstruction are different quantities. The 1.25° horizontal rod-free extent is the mean 1,000-rods/mm² contour; a positive interpolated composite value inside it is not evidence against anatomically rod-free individual centers. Conversely that contour cannot justify setting an entire symmetric composite disk to exactly zero.

The archive also supplies the actual legacy XLS files:

- [Cones4meridiansAllStats.xls](https://christineacurcio.com/PRtopo/Cones4meridiansAllStats.xls): `/tmp/atlas-psych-curcio-cones-stats.xls`, SHA256 `ea73977705d9fd34d1f96424268cb6abedda640681809850f9a974d74be23c10`, sheet `COMPCONE.WK1`.
- [Rods4meridiansAllStats.xls](https://christineacurcio.com/PRtopo/Rods4meridiansAllStats.xls): `/tmp/atlas-psych-curcio-rods-stats.xls`, SHA256 `ce1d0fba1c5016596b5d997e62b9178a9e286419c44e7b4bd511be4485aefe60`, sheet `COMPROD.WK1`.
- Independent [4meridians.xls](https://christineacurcio.com/PRtopo/4meridians.xls) summary: `/tmp/atlas-psych-curcio-4meridians.xls`, SHA256 `4ff7045935f6917877d28dff89c717f4bdc9eb6df8803d20f5aa6c6e9e2986ec`.

Inspected the original headers and units, the first density block and contributor counts, and the separate derived-spacing blocks. The imported common interval is exactly rows **15–42**: column **B** is visual degrees, **D** normalized retinal arc millimeters, **G** contributor N, and **H** mean temporal-horizontal density per mm². All 28 records retain their full source numbers. Later repeated coordinate rows are derived spacing/density-per-degree calculations and are not extra observations. The original workbook's general “8 young normal adults” heading does not supersede the paper's actual eight-eye/seven-person sample description. Source N varies by receptor and location.

The same mean/degree values agree with `Cones per sq mm` and `Rods per sq mm`, columns B/E, rows 2–29, in the separate summary workbook. Its ReadMe identifies the Figure 6/9 data. The public graph labels the values **archived resampled composite means**, not raw counting windows. The archive's central cone value 196,890/mm² is retained as supplied; it is not silently rescaled to the paper's Table 3 mean peak 199,200/mm². The public text explicitly distinguishes these summaries.

**Selig Hecht, Charles Haig and Aurin M. Chase (1937), [The Influence of Light Adaptation on Subsequent Dark Adaptation of the Eye](https://pmc.ncbi.nlm.nih.gov/articles/PMC2141534/), Journal of General Physiology 20(6):831–850, DOI 10.1085/jgp.20.6.831.** Acquired the actual 20-page original and read the complete main text, §§I–VII and summary, plus methods, table/figure captions and Table II. Inspected the actual Figure 2 image on PDF page 7, Figure 3 image on page 10 and the red-light discussion on page 13. Rendered `/tmp/atlas-psych-hecht1937-source-{7,10,13}.png`; additional source-page renders are available under the same prefix. No foveal or rod-monochromat intervention was conducted in this study.

Local `/tmp/atlas-psych-hecht1937.pdf`, 990,401 bytes, SHA256 `6f2b1f861ed918ca33f3d236f24d479b85faca7d3234b1fc5efdd6ee4b8de031`; extracted text `/tmp/atlas-psych-hecht1937.txt`. Direct curl attempts at PMC, the publisher and Europe PMC returned HTML/empty responses and were not represented as PDFs. An ordinary Chromium navigation to the public [PMC PDF](https://pmc.ncbi.nlm.nih.gov/articles/instance/2141534/pdf/831.pdf) allowed its normal “Preparing to download” page to complete and delivered `831.pdf`; no cookie/challenge manipulation or authenticated access was used. The browser closed after saving the download. Reproduction script `/tmp/atlas-psych-get-hecht.mjs` uses `page.waitForEvent('download')`, `page.goto(publicPDFURL)` and `download.saveAs(...)`. PDF extraction/rendering use the same `pdfplumber` methods as above; the actual page count was independently checked as 20.

The original's three observers were the investigators. Its 5° field was centered 30° nasally on the retina, with 0.2-second flashes after two minutes of white preadaptation. Seeing a black cross set a criterion about three times diffuse threshold. Test spectrum and preadaptation changed the course: strong preadaptation exposed delayed rod behavior, weak preadaptation differed, and extreme red could still show a small late rod contribution. Its historical “photon” is an illumination unit, not a literal quantum count. Original biochemical interpretations are not asserted as established modern mechanisms. The original's conditional observations support the prose; the widget's exponential curves and isolations are authored.

## Reproducible source extraction

`content/psych/source-audit-retina-data.js` holds the 28 common source records. `scripts/verify-psych-retina-data.mjs` checks the exact original binary hashes before reading any values. A read-only bundled-Python subprocess with `xlrd 2.0.2` verifies sheet names, visual-degree/normalized-mm/temporal/N/mean headers, all **B/D/G/H15:42** cells, each cached mean against sum/N, and the independent summary workbook's 28 degree/mean pairs. No workbook is recalculated, rewritten or exported.

Legacy BIFF XLS reading uses the task-specific `/tmp/atlas-psych-xls-runtime`; bundled spreadsheet authoring libraries are not used to rewrite these source files. Reproduce downloads with `curl -L --max-time 60 '<linked XLS URL>' -o '<local path above>'`. Install the missing legacy reader in a writable temporary directory, without modifying bundled dependencies:

```sh
/Users/teodev/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m pip install --target /tmp/atlas-psych-xls-runtime xlrd==2.0.2
node scripts/verify-psych-retina-data.mjs
```

The Node script also accepts explicit cone-XLS, rod-XLS and summary-XLS paths in that order. `ATLAS_SOURCE_PYTHON` and `ATLAS_XLRD_PATH` select an equivalent Python/runtime location if needed. The check passes; log `/tmp/atlas-psych-retina-source-extraction.log`. The source files retain the original hashes above. No intermediate cached JSON is treated as the source verification.

## Model and presentation repairs

Read `AUTHORING.md`, the field guidance and the actual 4.1/4.2 bodies before editing. The real 4.2 prerequisite remains **psych-4.1**, used for the two receptor-system comparison. The anatomical 4.1 has no mathematical dependency inserted merely for graph connectivity. No unwritten item or unused theory is linked.

For **4.1**, all 28 source locations are reachable through the integer source-index slider and a handle that snaps to the same records. They span 0–58.7683 visual degrees, the common interval where both means are available. The source cone/rod curves contain every retained record; lines connect supplied values only as visual guides. Both coordinates are `log10(1+value)` with ordinary numeric ticks, so the actual zero-degree/zero-rod record and small positive rod values remain defined. No logarithm-of-zero floor, artificial zero disk, missing-value substitution or extrapolation is used.

A uniform 30-µm square has area 0.0009 mm². Each displayed count is exactly `round(sourceDensity*0.0009)`, with the unrounded value shown too. For example, the positive source rod density 13.4698/mm² produces an expected count 0.01212282 and zero icons; the readout explains the rounding. Symbol locations and sizes are authored and preserve only integer counts. A deterministic layout avoids random composition changing the declared cone/rod totals. “Schematic emphasis” changes opacity, with no lighting, firing, visibility or acuity interpretation. The unsupported historical-priority and exact human Nyquist/acuity claims are removed. Whole-eye totals remain separately attributed Table 3 context, never an integral of the truncated meridian/composite.

For **4.2**, the actual displayed **log10 relative thresholds** are explicitly authored:

`C(t)=−2.3+3.3 exp(−t/1.6)`; `R(t)=5` until t0, then `−6+11 exp(−(t−t0)/5.5)`, with t0∈[0.5,4] minutes. Their constants, both-branch envelope’s limiting seven-log-unit range (1 to −6) and relative units are not source measurements; the isolated rod branch spans eleven log units (5 to −6). The control is a model delay, not a calibrated bleaching-light dose. “Both / cone only / rod only” selects mathematical branch isolation, with no alleged original treatment or clinical observer type. The source phenomenon is conditional, with no fixed universal 7–10-minute break or categorical absence of rods for red test light.

The selected both-branch curve is the lower log envelope, which is also the logarithm of the lower relative threshold because exponentiation preserves order. Before t0, R=5>C. After t0,

`(R−C)' = −2 exp(−(t−t0)/5.5) + (3.3/1.6) exp(−t/1.6)`.

The ratio of its positive term to the negative term's magnitude is bounded by `1.03125 exp(−0.5/1.6)<1`, and decreases further with t−t0. Thus R−C strictly decreases after t0. It is positive at t0 (C≤1) and negative at 40 throughout the offered range (even the latest rod branch is below −2.3 there). There is one crossing. Bisection keeps its bracket and residual; this is a property of the specified model, not a theorem about all human adaptation curves.

An independent inverse crossing identity is `t0=t+5.5 log((C(t)+6)/11)`. It produces known crossing times without reusing the bisection implementation and checks the whole offered crossing family. Curves include onset and crossing samples exactly rather than drawing a line across a missed kink. The full rod plateau at 5 is retained. The time probe reaches 0 and 40; both log and exponentiated selected values are reported. The onset handle is a control above the plateau, joined to it by a short guide, and is separated from the time probe at t=0.

The inherited lower-framed plot hid the initial rod branch and called the envelope measured. The new frame includes all branches and their full glyphs. An intermediate native check also found the 4.1 location handle's bottom stroke outside the plot (center195.958, radius9.1, plot bottom203); the lower margin was enlarged from −0.35 to −0.6. No data was removed or radius reduced to pass.

## Verification evidence

Pure helper `content/psych/source-audit-retina.js`; data `source-audit-retina-data.js`. Mathematical tests `tests/verification-psych-retina.test.mjs`; native tests `tests/verification-psych-retina.mjs`. The mathematical file first passed as a non-default draft before entering the normal test glob.

`node --test tests/verification-psych-retina.test.mjs` passes **4 groups**, log `/tmp/atlas-psych-retina-math-final.log`:

1. All 28 locations, source endpoints and independent unit/area count conversion, nearest-integer errors, contributing numbers, actual-zero versus positive-density/zero-icon cases and invertible zero-capable coordinates.
2. All 84 source/emphasis states, exact integer composition, deterministic nonduplicated authored positions, boundaries, opacity and every full source-curve sample.
3. All 351 offered delays, independent derivative-sign bound, crossing ordering/bracket/residual, onset continuity, finite-time signs and the separately derived inverse crossing family.
4. All 351 delays in all three branch modes at time 0/8/40, exact selected lower-envelope values in log and ordinary units, all sampled branch ranges, retained initial rod 5, onset/crossing records, limiting values and invalid-domain rejection.

Scoped static `node scripts/check.mjs psych-4.1 psych-4.2 --static` reports **2 items, 0 errors, 0 warnings**, log `/tmp/atlas-psych-retina-static.log`. Read-only preservation guard `/tmp/atlas-psych-retina-scope.log` compares `/tmp/atlas-psych-retina-{chapter,syllabus}-before.js` and `/tmp/atlas-psych-retina-accepted-chapter3.js`: only the specified object/import/row bytes and separately approved one-phrase chapter-summary change differ. All other neighboring bytes and complete accepted chapter3-b are identical.

Final native matrix and inspected screenshots follow. No full build, generated-data, shared-helper, central-ledger or Git mutation is performed; no source queue closure is claimed by this report.


`node tests/verification-psych-retina.mjs` passes **all 8 native item/theme/viewport groups** (each item at1450/430 px, light/dark), log `/tmp/atlas-psych-retina-native-final.log`. After inspecting the final screenshots, the test was strengthened only with two extra rod-only interactions where the handles are close at time0/delay0.5. The four adaptation groups were rerun with those additional assertions, all pass in `/tmp/atlas-psych-retina-native-adaptation-final.log`. Production was unchanged between those runs. Both processes exited0 and their browsers/servers are closed.

Each 4.1 group checks all84 source-location/emphasis states, all28 actual handle locations and two drags beyond the domain boundaries (30 actual drags). It verifies real slider min/max/step/index, formatted physical location/ARIA output, all original means/N/mm/degree values, every source path and marker, exact integer icon composition/positions/opacity, expected counts and the positive-density/zero-icon explanation. No source location or degenerate origin is skipped.

Each 4.2 group checks all three actual branch-isolation buttons at both delay and time endpoints, all351 actual delay-input ticks, all full cone/rod/selected curve samples and their onset/crossing records, exact model probe values, marker visibility and real slider values/output. Six actual endpoint-handle drags include the nearby time/delay controls in rod-only mode at time0/delay0.5; moving one must leave the other unchanged. The complete initial rod plateau at5 is present in every relevant actual path, with no source/model points hidden to satisfy bounds.

Every state checks entire path strokes, marker rings, handle strokes, count-diagram glyphs and border, all canvas text extents/halos, TeX overlays/display formulas and page bounds. Native snapshots retain all data records. The first debug handle-margin failure is documented above and was repaired in the frame before final runs; it was not excluded from the checks.

Visually inspected the complete default430px light/dark pages for **both** items: `/tmp/atlas-psych-retina-4.1-default-430-{light,dark}.png` and `/tmp/atlas-psych-retina-4.2-default-430-{light,dark}.png`. Also inspected `/tmp/atlas-psych-retina-4.1-positive-density-zero-icons-430-light-panel0.png` and `/tmp/atlas-psych-retina-4.2-full-initial-rod-430-dark-panel0.png`. These show legible source/model distinctions, the retained zero/small positive source values, full marker strokes, actual controls, all initial rod values and the proof formulas. The same prefix contains origin/full-endpoint/zero-icon and all branch/delay/time corner screenshots at both themes and widths.

The helper/data, production objects and tests are accepted by the independent integration below. This does not claim original-data collection, a clinical model or whole-site build completion.

## Independent integration

Root read both complete public items, the complete helper/data, mathematical/native tests and original-XLS extraction script. Root independently read the source reconstruction/fellow-eye averaging passage, Table3, temporal-meridian Fig9 and the printed511 rod-free-contour passage; inspected actual Curcio PDF3/13 images. Root also read Hecht's method/observer/unit passage, adaptation/time-shift and red-light discussion, with actual PDF3/7/10/13 images. The independent counter-review read Curcio PDF1–7/9–17 and the complete Hecht main text/summary, inspecting the original methods/tables/figures. No reading of all27 Curcio pages is claimed.

Root inspected original BIFF-XLS units, row/column labels, first/last/common/missing data rows and the separate summary ReadMe, then reran the read-only extraction against all three pinned binary files. All28 actual source records, contributor counts, sum/N and independent-summary means match. Source files were neither rewritten nor recalculated. Both PDF hashes also match above.

A separate65-digit Decimal calculation transformed the crossing with x=exp(−t/88) to110exp(2d/11)x^16−33x^55−37=0 and solved every351 offered delay. Maximum time difference3.49e−14; endpoint crossings6.403676715578066… and9.983031184481797…min. The derivative-ratio maximum0.7544786<1 supplies the domain-wide uniqueness check. Log: `/tmp/atlas-psych-retina-counterreview-calculations.log`. The optional wording refinement distinguishes the BOTH envelope's limiting seven-log-unit range from the isolated rod branch's eleven.

Root reran4 mathematical groups, the full8 native item/theme/viewport groups and scoped static validation (2items,0errors,0warnings), all exit0. Logs: `/tmp/atlas-root-psych-retina-{extraction,math,native,static}.log`. The native harness was then strengthened to retain the actual runtime mount and compare full snapshot/remount states. A separate8-case replay run checks two nondefault states in each item/theme/viewport, including small positive rod density/zero icons, far-peripheral counts, isolated initial rod5 and the both-branch far-time state: controls, model data, readout, all paths/markers and serialized state match exactly. Log `/tmp/atlas-root-psych-retina-replay.log`, exit0. The ordinary full script now includes that replay check too; no additional production change was needed.

Root inspected the complete430px light retina and dark adaptation default pages, plus the native-size positive-density/zero-icon and full initial-rod panels. Byte guards preserve both neighboring-object regions, all other syllabus rows, shared helpers and accepted chapter3, with only the authorized chapter-summary phrase/import and two objects changed. All browsers/servers closed. This integration adds no new cross-field prerequisite and makes no generated-data/full-checkpoint claim.
