# Imaging 3.18 — supported repairs; original-paper audit remains open

The synthetic visual and supported prose have been repaired and independently checked. **Keep `verify: true`: the complete named 1973 paper has not been obtained/read.** The author's later lecture is a separate source and does not replace that paper audit.

## Sources and access

Read the [official original abstract and record](https://academic.oup.com/bjr/article/46/552/1016/7306149) for Hounsfield (1973), *BJR* 46(552):1016–1022, DOI `10.1259/0007-1285-46-552-1016`. It supports only the broad angular-transmission/computer/slice description and the paper's reported approximately hundredfold sensitivity comparison. The entry now attributes that comparison to the abstract and does not reinterpret it as a universal SNR or dose improvement.

Full original OUP PDF requests redirected to an unavailable subscriber resource/returned 403. The former BIR PDF endpoint was unavailable. The PSI technique page links an external `qmxmt.com` mirror that returned HTTP 404 or timed out over HTTPS. The bibliographically recorded 1995 *BJR* 68(815):H166–H172 reprint was also not obtained. Access is the remaining original-paper evidence gap; no paywall bypass or full-paper reading is claimed.

Read the complete 19-page author [Nobel lecture PDF](https://www.nobelprize.org/uploads/2018/06/hounsfield-lecture.pdf), *Computed Medical Imaging* (1979), local `/tmp/atlas-imaging-hounsfield-nobel.pdf`, SHA-256 `523c46bf931718ecc32a04e67820121ba422a8b7f9e98cb269839f240a69a398`. Checked early experiments and the formalin caveat, pp. 569–572; measurement/reconstruction principles, pp. 573–576; and water-relative scale/windowing/noise, pp. 577–578. Rendered and agent-inspected printed pp. 570 and 577: `/tmp/atlas-imaging-hounsfield-source-{early,window}.png`. The lecture's differing first-patient date is not silently resolved or repeated as settled chronology.

## Supported repairs

- Removed unsupported original-scanner parameter assertions, claims about engineers not reading Cormack, and universal lesion-invisibility/sensitivity wording. Model dimensions, modern HU values, Poisson incident photons and FBP are explicitly chosen illustrative quantities.
- Replaced the additive approximation to the painted phantom by exact line integrals of its last-painted regions. The former centre-based subtraction could disagree with the phantom where the clot overlaps a ventricular ellipse: at `(0.264,−0.208)` it gave 49 HU instead of the declared 65 HU. The exact projector splits rays at every ellipse crossing, handles tangencies without assigning a finite interval of tangent tissue, and integrates the winning paint on each interval.
- The red curve is now the difference between the full head and the same head with the clot removed, representing replacement of underlying tissue. It is not labeled as the complete isolated clot attenuation.
- Replaced a hard-coded “under 1%” claim with a computed maximum fractional increment for the displayed noiseless projection (about 0.50% for this phantom). Corrected grey/white difference to 14 HU = 1.4%; the spatial patch SD is disclosed to include artifacts as well as count noise.

## Verification completed

`node --test tests/verification-imaging-hounsfield.test.mjs`: six groups pass—last-paint material selection; analytic single-ellipse chords/tangency; independent dense midpoint integration for 24 rays through all overlapping regions; clot-replacement increment; Radon symmetry/bin agreement; and noiseless full-view FBP tissue means with finite-grid tolerance.

`node tests/verification-imaging-hounsfield.mjs`: light and dark each pass 16 view/photon/window corners, finite summaries, no runtime/TeX/blank-stage errors and instrumented paths/points within bounds.

`node scripts/check.mjs imaging-3.18 --static`: one item, zero errors/warnings.

Agent-inspected `/tmp/atlas-imaging-hounsfield-light.png` and `/tmp/atlas-imaging-hounsfield-dark.png`: the phantom, angular data, small replacement increment, window controls and quantitative readout agree visually with the revised scope. No human review is claimed or required.

Remaining work is to read the named original paper, check any resulting paper-specific facts/interpretation, and rerun relevant validation if that reading changes the entry. General CT knowledge and the later lecture do not justify closing that original-paper task.

## 20 October 2026: new historian-collection lead stops at password

An ordinary HTTPS GET of the new [historian-collection PDF lead](https://radiology-history.online/papers/ct-hounsfield1-O.pdf) returned HTTP 200, `application/pdf`, and 1,336,360 bytes, matching its Content-Length. SHA-256: `6a1063b4defca9bf75da9a45df16536b4d46aea79560b12698a0000db6d93e48`. The payload has a `%PDF-1.7` header, a terminal `%%EOF`, and an `/Encrypt` reference. These establish a complete HTTP payload, not the identity or completeness of the paper inside it.

Normal `pdfinfo` inspection exited 1 with `Command Line Error: Incorrect password`. The route was stopped immediately under the explicit no-password-bypass instruction. No passwords, decryption, alternate renderers, or access-limit workarounds were attempted. Page count, paper identity, source text, page completeness, and source pixels therefore remain unverified. No new source/math/native acceptance is claimed, and `imaging-3.18` remains `verify: true`.

Machine-readable evidence: `imaging-hounsfield-source-access-2026-10-20.json`; local raw response and downloaded PDF: `/tmp/atlas-new-imaging-source/`. This is a report-only update; no runtime/content changes or tests were necessary. Further useful work requires a new normally readable, legitimately accessible source body or authorized access supplied by its rights holder.
