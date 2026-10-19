# Fourier spectrum and playback: agent sample finding

The semantic review of `music-4.5` found missing hypotheses for inversion
and Plancherel, and an incorrect claim that an aperiodic sound has no
Fourier series. The page now distinguishes a finite-window periodic
extension, the L¹ transform, L¹ inversion and the L² energy identity.
The direct prerequisite `rca-9.13` supplies the last claim; its statement
was compared with the page, and the edge is mirrored in the syllabus and
recorded as a separate follow-up in the macro prerequisite ledger.

The line-width formula is exact for a causal complex exponential; for
a real cosine it approximates an isolated positive-frequency line. The
statement now makes that distinction, separates ideal impulses and white
noise from finite physical signals, and describes the actual three-partial
woodblock model. A finite noisy spectrum is not claimed to be perfectly
flat. These are corrections to the mathematical/model claims, not new
original-source closures.

Inspecting the playback path exposed a second discrepancy: the FFT used
65,536 samples at 16 kHz (4.096 s), but Listen played only the first 2.5 s.
For a long decay this discarded a substantial tail and could end on a
nonzero sample. The analyzed buffer now has a 20 ms cosine release, and
Listen plays that entire buffer. Spectrum and playback therefore include
the same release. The finite recording and release can broaden very narrow
lines; the displayed spectrum is measured from that actual buffer, and the
infinite-duration Lorentzian remains a separately labelled prediction.

Validation: strict build; a real-renderer, native light-theme check of
every sound mode; and `tests/verification-music-spectrum-browser.mjs` in
both themes. All six speaker controls produce finite non-silent normalized
buffers of the full expected length, with zero-valued endpoints and no
autoplay. A keyboard gesture sets the decay to its 3 s maximum and checks
the former cutoff case. The default picture was inspected: the measured
0.401 Hz half-power width agrees closely with the 0.398 Hz isolated-line
prediction at τ = 0.8 s, and the waveform, harmonics, controls and readout
are readable.

These checks establish playback and signal integrity. They are not a
claim of subjective listening, instrument realism or human review. The
50-page named listening inventory is unchanged; this sampled chapter-4
sound is an additional technical review finding. The integrated edge
count becomes 773, with no cycles and nine prerequisite shortfalls still
open. Both worksheets are regenerated for the changed build.
