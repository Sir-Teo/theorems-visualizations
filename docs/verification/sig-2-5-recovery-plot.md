# SIG 2.5 recovered-input plotting correction

The conditional modulator/noise state reported a recovered-input error near 5×10¹² while the green curve looked identical to the input. The inverse calculation was already using every grid point, but its plot used stride two. On this grid, T0=−16 and Δt=.01, every carrier zero in the displayed window has an odd sample index; the decimated curve omitted all twenty catastrophic samples.

The source now plots all 1,041 recovered samples on [−5.2,5.2], preserving finite values unchanged. The ordinary panel clip still bounds the display, with explicit green boundary arrows and a visible off-scale count. Nonfinite samples break the curve and have separate orange boundary ticks; their locations and counts are preserved. The recovered signal is not numerically clamped, filtered, thresholded or replaced, and neither the inverse computation nor the large readout error changed.

The local explanation also distinguishes the domains: modulation by cos(2πt) can recover continuous inputs at isolated carrier zeros by noiseless limits. Arbitrary pointwise inputs may differ only at those zeros and give identical outputs. Division at an exact carrier zero is undefined; noisy nearby division is ill-conditioned. The enormous finite sampled values depend on floating-point roundoff and are not asserted as a finite inverse-error bound.

Validation:

- `node --test tests/verification-sig-recovery.test.mjs`: four independent/regression groups pass (the runner reports one file-level test). An independent known-noise/carrier calculation locates all twenty odd-index catastrophes and shows that the former stride-two curve conceals an error above 10¹². It verifies all samples and markers submitted by the actual visualization, unchanged huge finite values, nonfinite breaks, and ordinary/noiseless recovery.
- `node scripts/check.mjs sig-2.5 --static`: one item, zero errors and warnings. Syntax and scoped diff checks pass.
- `node tests/verification-sig-recovery-browser.mjs`: 28 native states pass, one browser worker, pinned local KaTeX 0.16.11, both themes, noisy/noiseless modulation, gain, cube, delay, accumulator, moving average and RC. No page, visualization, TeX or visible-canvas blank errors; all three source-file hashes stayed unchanged during the completed run.

All 28 screenshots were inspected in five contact sheets, with the light/dark noisy-modulation images also inspected at full size. The twenty clipped spikes and status label are clearly visible; ordinary noisy modes now show their complete fine-grid recovery noise. The test harness's initial DOM-caption and over-specific rounded-gain assertions were corrected before the completed run; they were test assumptions, not additional product defects.

Evidence: `/tmp/atlas-sig-recovery/report.json`, `/tmp/atlas-sig-recovery/{light,dark}-{mod,gain,cube,delay,accum,mavg,rc}-{noisy,noiseless}.png`, and `/tmp/atlas-sig-recovery/contacts/contact-{0..4}.jpg`. Original discovery evidence remains in the separate conditional visual review. The conditional runner, inventory and common runtime are unchanged. SIG source is now frozen for the coordinator's collection and conditional-row refresh.
