# Noisy-label risk and empty ERM choices

`ml-2.1b` called disagreement with the clean hidden rule “true error”
even when its sample labels were flipped. For independent flip probability
η, fresh noisy-label risk is η+(1−2η) times clean-rule error.
The explanation, scope and readout now distinguish these quantities.
The caption no longer claims every noisy finite sample forces mistakes:
a six-point sample at η=.3 admits zero training errors while the selected
ERM rectangle has noisy-label risk .411 and clean-rule error .278.

The ERM button also ignored NONE, leaving the previous candidate unchanged
when the optimum was empty. It now displays a zero-area corner rectangle,
with no sampled points and zero population mass under this continuous
model. Computing its clean-rule error uses the exact rectangle mass rather
than the grid fallback for NONE. The scope explains the representation.
The minimization algorithm is unchanged.

Two actual-widget regressions check clean/noisy risk at η=0/.1/.3 and the
all-negative sample at m=6, seed=29. The latter verifies the button moves
to the corner optimum and reports zero mistakes. Three existing ML groups
verify exact rectangle ERM against exhaustive search (including ties),
disc ERM and quantization.

All 16 native states in both themes passed and their captures were
inspected: default, noise .3, ERM fit, m=6, perfect noisy fit, empty
optimum, drag away and restoration. Runtime and TeX checks pass.
Artifacts: `/tmp/agent-review/erm-risk-browser.{mjs,json}` and named PNGs.
Strict build, full regressions, review hashes and packets are checked before
commit. Source flags, human review and subjective listening are unchanged.
