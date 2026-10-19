# Articulation model: agent sample finding

`ling-1.4` called `M.smoothstep(Re_c, 1.6 Re_c, Re)` for both the
synthesizer's turbulence amplitude and the noise gauge. The runtime
accepts only a single normalized argument. It therefore clamped 1800
to 1 and ignored the other arguments: the onset gate was always fully
open. Pressure, speed and area still changed the raw noise proxy,
but the intended Reynolds gate did not operate.

Both paths now use the same explicitly normalized cubic gate: zero
at and below Re_c, one at and above 1.6 Re_c, and a smooth transition
between. The threshold 1800 is labelled as a chosen illustrative
onset, not a universal criterion for fricatives. Jet geometry and
downstream obstacles matter, and a circular-equivalent diameter is
not a complete model of speech constrictions. The noise calibration,
classification and synthesis are also explicitly qualitative.

The statement now includes affricates and unreleased stops. The
quasi-steady closure argument is separated from transient voiced
stops, and sustained nasal voicing is limited to an exhalation.
The model's actual pressure/flow derivation uses continuity through
serial orifices and the adopted Bernoulli pressure–speed relation.
The written `fluid-1.5` and `fluid-2.9` statements were read and added
as mirrored prerequisites. The Reynolds-definition card is planned
and is not counted. Linguistics rises from 20 to 22 distinct written
cross-field dependencies, leaving three below its target; integrated
additions become 777. No quota-filling links or source closures occur.

Validation: onset, midpoint, saturation, monotonicity and rescaled-
threshold unit checks pass, alongside existing linguistics regressions.
Native mode checks pass in both themes; all six captures were inspected
and retain readable flow, pressure, chosen-threshold and spectrogram
labels. A separate native control pass exercises the area endpoints
and both toggle reversals without errors or warnings. Native playback
checks pass in both themes, with no autoplay and finite normalized
non-silent buffers. These checks do not establish subjective sound
quality; this runtime cannot perceive audio input.
