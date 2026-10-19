# Page review and listening

The user has directed the agent to perform the page review. This authorizes
an explicitly labelled agent review of the same 339-page sample; it does not
turn agent findings into human findings. Record that review separately,
including corrections and field-guide feedback. The original human count
remains historical, and the worksheets below remain available for people.
Audio findings must distinguish directly perceived sound from instrumented
signal/playback checks. Preparing a worksheet is neither kind of review.

The agent captured native Web Audio output and attempted to inspect it as
audio input. This session explicitly reported that audio input is unsupported.
No subjective listening observation can therefore be recorded here. Playback
and signal checks can proceed; the subjective listening component stays open.

The [master plan's wave gates](../../MASTER_PLAN.md#73-gates-at-the-end-of-each-wave)
require an actual human 5% page sample, with findings fed back into field
guides. The recorded sample contains 339 pages. Automated reviews and form
tests have not recorded any actual human reviews.

Start the local site with `npm run serve`. Open:

- `http://localhost:8173/docs/verification/human-review.html` for the 339-page
  sample, statement/source checks, interactions and field-guide findings.
- `http://localhost:8173/docs/verification/audio-review.html` for all 50
  pages in the named audio follow-up inventory.

The listening page embeds the actual atlas page and also provides a link
to open it separately. A reviewer should use every speaker button and
compare relevant parameter settings, recording what was heard and whether
the intended contrast is clear. The worksheet captures reviewer name,
listening setup, assessment, observations and personal-listening
confirmation. Intended rough/noisy examples should be assessed against
their own labels and purpose.

Both worksheets save locally in the browser and export JSON findings.
Generated source signatures make old findings require rechecking after a
source/build change; notes are preserved. Findings must be supplied and
integrated, and corrections/field-guide feedback addressed, before the
corresponding gate can close. Downloading JSON alone does not certify a
human review. No generated worksheet or browser test modifies gate credit.

`scripts/verification-audio-review-packet.mjs` regenerates the listening
inventory and worksheet; `--check` detects drift. Its selection predicate
is shared with the native audio test, preserving the exact 50 live targets
previously instrumented in 100 item/theme groups. This inventory is separate
from the 5% page sample. Preparing it does not count as listening.

The worksheet's isolated browser test verifies native playback inside the
embedded page without autoplay, identity/setup guards, required assessment
and observations, persistence, filtering, export and source invalidation.
It also checks that changing reviewer identity cannot silently inherit a
personal attestation and that observations are treated as text. Fresh wide
and mobile previews have zero completed entries. Its synthetic reviewer is
explicitly identified as an automated test and creates no repository
findings or review credit. A small native audio regression additionally
checks representative oscillators/buffers, replay and cleanup.

Actual human review remains **0/339**. The user-authorized agent sample
review and subjective listening assessment are pending. Wave 5 has not started.
