# Circuit rectifier review

Ready **circ-4.5**, source flag held for root integration. Own edits only to its block in ch04.js plus the new rectifier helper/math/browser files.

## Primary source

D. A. Steck, [Analog and Digital Electronics](https://atomoptics-nas.uoregon.edu/~dsteck/teaching/electronics/electronics-notes.pdf), revision1.0.10, May1,2026. Relevant complete §3.6.1–3.6.2 pp83–85 read, with the bridge diagram personally inspected. This author-hosted text specifies half-wave conduction, exponential RC discharge, bridge polarity and two forward drops. The source explicitly distinguishes voltage across the load from voltages referenced to the AC source. The original cover/revision statement was checked. Cache `/tmp/atlas-circ-steck-electronics.pdf` (440pages), SHA256 `1469de8885e908ad8a391fccdb5ae3949a1769d7012f4ce7b802659f190671ea`; extracted `.txt` is local. The web fetch exceeds its size limit, but local download and extraction succeeded. Historical priority claims were replaced by the inspected circuit derivation; no Fleming/Graetz/Polak original is claimed read.

## Corrections and exact-model derivation

The previous sampled update sometimes discharged the capacitor below the instantaneous available rectified voltage when the input lay between the old and decayed capacitor values. Replaced time stepping with the exact periodic envelope for the declared zero-source-resistance/fixed-drop model. This avoids a diode-constraint violation and makes ripple extrema independent of time-grid phase. No claim is made that the old three-cycle warm-up was itself inadequate for its ideal source.

Let theta=omega t, a=omega RC, D the conducting drop, and phase period P=2pi (half) or pi (bridge). The turn-off condition C dv/dt+v/R=0 along v=Vp sin(theta)−D gives

`thetaOff = pi - asin[D/(Vp sqrt(1+a²))] - atan(a)`.

For a given phase, compare the presently available rectified voltage with the last turn-off value decayed by exp(−lag/a), taking their maximum. Previous periods cannot dominate because each older identical value is exponentially smaller. Turn-on is the unique rising-branch intersection with the previous-period discharge; bisection finds it on [asin(D/Vp),pi/2]. This gives the exact minimum, while the maximum is Vp−D. The independent historical-maximization regression checks the envelope directly without using this turn-off formula.

Clarified that inverse-C ripple scaling and bridge halving are small-ripple approximations. For the same source, the bridge's extra drop changes even the asymptotic ratio from exactly1/2. Dashed peak-current estimates are shown only for RCf≥3, with their approximation still explicit; they are not exact at that threshold. Both exact ripple curves and the chosen marker now remain inside the log-axis limits, including millivolt ripple formerly below the fixed0.01V lower edge.

## Validation

`node --test tests/verification-circ-source-audit-rectifier.test.mjs`: **4 groups pass**: all64 operating corners' conduction boundaries and extrema; independent dense maximization over previous input history; periodicity, diode complementarity and off-state differential equation; capacitance monotonicity and correct asymptotic bridge ratio.

`node tests/verification-circ-source-audit-rectifier.mjs`: **2 native light/dark groups pass**, each exercising all64 actual type/frequency/voltage/capacitance/load combinations. Checked waveform samples, analytic minimum/maximum/ripple readouts, ripple frequency, actual gold marker, and both full curve extents. Real Home/End input operates log sliders. No browser exceptions or TeX errors.

Personally inspected `/tmp/atlas-circ-rectifier-source.png` and both final screenshots `/tmp/atlas-circ-rectifier-periodic-bridge-small-ripple-visible-light.png`, `/tmp/atlas-circ-rectifier-periodic-bridge-small-ripple-visible-dark.png`. No measured-device accuracy or Wave5 completion inferred.
