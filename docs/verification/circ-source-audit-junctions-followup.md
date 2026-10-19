# Circuit original point-contact and junction transistor papers

Ready for root integration: **circ-4.14, circ-4.15**. Both flags remain true until integration. Scoped new helpers and math/browser files; existing chapter dependencies/prior edits preserved.

## Originals actually acquired and read

**Bardeen–Brattain1948:** [publisher's complete original two-page PDF](https://journals.aps.org/pr/pdf/10.1103/PhysRev.74.230) was fully read through the web tool, ending before the separate adjacent letter on p231. A full identical-content [UFPR academic mirror](https://www.eletrica.ufpr.br/mehl/materiais/documentos/PhysRev.74.230.pdf) was then downloaded and its first page/figures visually inspected. Cache `/tmp/atlas-circ-bardeen1948.pdf/.txt`; SHA256 `5e314b86a91e577b047c597ce8dfc94be650e2a5ca5c5affcebb1b3abd789861`. Original p230 gives the June25 letter date,50–250micrometre spacing and bias/holes account; p231 defines differential alpha, bias dependence and feedback. The July15 date is publication, not letter date. APS local curl failed, but publisher web access and complete academic-mirror PDF succeeded; no source-access gap remains for this entry.

**Shockley1949:** [complete55-page original scan](https://archive.org/download/bstj28-3-435/bstj28-3-435.pdf), SHA256 `dd30bbea0a0bea2577f5f3b23c9d6df59d0494fd4957dfb2c1cdc50b3d8ba4d0`, cache `/tmp/atlas-circ-shockley1949.pdf`. It is image-only: pypdf extraction did not provide text. Complete [Archive.org OCR](https://archive.org/download/bstj28-3-435/bstj28-3-435_djvu.txt) acquired separately as `/tmp/atlas-circ-shockley1949-ocr.txt`; no empty text file is used as evidence. Full relevant introduction, §3, §§4.1–4.3 and §§5–6 read; unrelated AC-admittance appendices are not claimed reviewed. Exact primary anchors are printed pp458–459 Eqs4.1,4.4,4.6–4.11 for injection/diffusion, pp460–461 Eqs4.13–4.22 for total DC current and emitter-injection discussion, pp469–472 Eqs5.2–5.6 for finite-base boundary conditions/profile, and p473 Eq6.4 for alpha. Original printed page=PDF page+434. The scan's equations on p459 and p473 were personally inspected against OCR.

## Corrections

4.14 now distinguishes current amplification from a collection probability and identifies the original proposal of hole injection/feedback, rather than implying that interpretation appeared only later. Removed unverified contextual history. The schematic's spacing law, current offset and regularized input resistance are explicitly chosen, not fitted original data.

The former unbracketed root solver could return a boundary and invent an operating point. A closed-form solution now verifies its collector-voltage domain. Invalid settings show no Q dot or active gain; signal bands require both actual loaded endpoints to remain valid. The gold gain is now the loaded derivative using R_eff=RL||250kΩ; voltage-gain magnitude is alpha R_eff/rin, power gain alpha² R_eff²/(RL rin), instead of silently ignoring output conductance. No biased amplifier gain is shown at zero emitter drive. Curve scales include the whole selected family/load; block labels were kept inside the diagram.

4.15 identifies original p–n–p/hole conventions and W=2w for its full base width. It separates the atlas's gamma=1/[1+(W/L)/D] extension from the original ideal transport result. D is an illustrative injection-quality parameter, not enough information to specify an emitter/base doping ratio. Beta follows from current conservation and is not presented as a verbatim source equation.

The junction plot actually shows total density/equilibrium, not excess/equilibrium; labels/caption now agree with its+1. Zero current is omitted on the log axis rather than fabricated at a floor. The60mV decade rule is stated as an asymptote (59.5mV at300K). The unused forward-bias control is hidden in normalized transistor mode. Gain below one for a wide base is now visible. The base diagram labels E/C avoid clipped text and its title changes with mode.

## Checks

`node --test tests/verification-circ-source-audit-pointcontact.test.mjs tests/verification-circ-source-audit-junction.test.mjs`: **6 groups passed**: independent load/device equations and valid-domain status; gain from differenced intersections and actual resistor/input powers; current-gain-versus-probability and regularization; finite-base diffusion BVP/flux ratio; current-conservation beta/injection bounds; diode total/excess/zero/decade identities.

`node tests/verification-circ-source-audit-junctions.mjs`: **4 native groups passed** (two entries ×two themes; final rerun after diagram/copy changes). Point-contact:32 actual spacing/drive/swing/load corners, valid/invalid dots and gain values. Junction:five real bias values including zero, real mode switch and four width/injection-quality corners, profile samples and current/gain marker bounds. No page exceptions or TeX errors. Log sliders use real Home/End input.

Personally inspected `/tmp/atlas-circ-bardeen-original.png`, `/tmp/atlas-circ-shockley-diode-original.png`, `/tmp/atlas-circ-shockley-gain-original.png`, and final native images:

- `/tmp/atlas-circ-junctions-point-contact-unbracketed-load-honest-light.png`
- `/tmp/atlas-circ-junctions-junction-zero-bias-log-scope-light.png`
- `/tmp/atlas-circ-junctions-junction-wide-base-low-gain-visible-dark.png`

The exact physical devices/data/frequency responses are not reconstructed by these toy models. No subjective human/audio or Wave5 gate claimed.

Archive.org complete OCR SHA256: `06413dc7b4e226b42a9c0ac38bc3bdce1818f2bd7b2279c4117679f36799f630`.
