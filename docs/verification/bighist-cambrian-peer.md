# Independent peer: BIGHIST 3.7 Cambrian

Recommendation: accept exact `5dc9da6` together with the bounded URL-only follow-up `4c558b8`. The one actionable finding was the broken review filename containing a space; the follow-up changes only that URL and the report note. I inspected the exact diff, fetched the corrected URL successfully, and compared the downloaded PDF byte-for-byte with the independently reviewed source. No unresolved source, formula, native-state, or geometry finding remains within the declared scope. Source flag closure remains the coordinator's responsibility.

## Source and access scope

Reviewed an immutable `git archive 5dc9da6` at `/tmp/atlas-worker-three/cambrian-peer`; no producer or coordinator files were edited. Copied both actual full PDFs into this evidence directory and independently read Marshall's original pp. 355–369, with particular comparison of chronology pp. 357–363 / Fig. 1 and environmental/developmental/ecological explanations pp. 364–369. Personally inspected my own rendered source pixels `source-03.png`, `source-04.png`, `source-10.png`, `source-15.png`, and `ics-1.png`.

Marshall: https://cs.brynmawr.edu/Courses/cs361/spring2008/Readings/Marshall2006.pdf — 32 pages, 549048 bytes, SHA256 `18f30e1f5e9db771572b27f9bdc108a06b960971b1c238abb180d8e20e39e647`. The actual text supports about 580 Ma Gaskiers / early record, regular horizontal traces about 555 Ma, and lightly mineralized forms including Cloudina in the final five Myr of the Ediacaran. The actual Fig. 1 scale supports the declared approximate readings for first trilobite body fossils, Chengjiang, and Burgess Shale. The authored ±2 Myr display widths are identified as such, and Cloudina's 542–548 interval is the union of a final-five-Myr interval under the paper's 542–543 boundary. These are honestly historical review/display rows, not certified underlying radiometric studies or contemporary locality best ages. The explanation notes preserve the paper's limitations on environmental permissiveness, developmental capacity, and ecological interaction rather than assigning them artificial dated gates.

Official ICS chart: https://stratigraphy.org/ICSchart/ChronostratChart2024-12.pdf — one page, 332682 bytes, SHA256 `7ce1edf87ca913933c704cae3be2f68f932d14aaa111db36c3d9c0e79e57c237`. Its actual version title is 2024/12 and Cambrian boundary is 538.8±0.6 Ma. Keeping this guide separate from Marshall's older fossil rows is supported. No 2026-current or unique-cause claim is made.

The initially authored URL `Marshall%202006.pdf` returned HTTP 404 (`source-link.log`). The corrected URL was fetched into `corrected-link-source.pdf`, which is byte-identical to `marshall2006.pdf`. `url-followup.diff` records the inspected exact two-file follow-up.

## Independent mathematical checks

- All four existing math groups pass (`math.log`), focused static 1 item / 0 errors / 0 warnings (`static.log`).
- Regenerated the independent 80-digit mpmath reference into my own `reference.json`; it is byte-identical to the committed fixture, SHA256 `32bcfeb278eccd825cbb825447548a5904890312ebc31e126f8b10f3abcb8889`.
- Independently checked separation of variables, the smoothstep primitive and its joins, required subtraction at −600 for an already active gate, bracketed versus post-ramp threshold inversion, and the complete-rise lower bound ln(81)/r. The initial condition and out-of-window crossings are handled correctly.
- Added my own independent RK4 integration of the differential equation across all 20,264 actual stock samples in 48 additional parameter profiles; maximum absolute error was 5.21e−14. Independently integrated the gate over each 10%–90% rise with 2,000-panel Simpson quadrature and checked ln(81)/r in all 48 cases. See `extra-oracle.mjs` / `extra-oracle.log`; no production primitive or threshold inverse was used by those oracles.

## Fresh native and pixel checks

Ran the exact archived runner with `BIGHIST_CAMBRIAN_OUTPUT=/tmp/atlas-worker-three/cambrian-peer-evidence/native`, both themes at 320 px. Both groups pass (`native-light.log`, `native-dark.log`): eight numeric corners, all 48 source-example/explanation configurations, real range keys/buttons/toggles, actual DOM numeric value equal to registered/model state, manually edited complete valid saved state and exact replay/readout, 31 malformed raw states each causing visible whole-default rollback, complete source intervals, every exact stock/gate sample and threshold marker, and stroke/text/TeX/page bounds.

Personally inspected my own final `default-320-light-panel0.png`, `gate-active-at-start-320-light-panel1.png`, `outside-window-320-dark-panel1.png`, and `all-explanations-320-dark.png`. Source rows remain legible, early active gate starts with the required stock, outside-window crossings are absent from the plot and honestly reported at their actual model times, and controls/readout/formulas remain contained. Full producer six-width/theme evidence was not substituted for my own two narrow groups. I did not repeat the full strict build during this scoped peer review.
