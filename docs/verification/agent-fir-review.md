# Feedback does not imply an infinite impulse response

The sample review of `sig-3.12` found a counterexample within its own
controls. At a = −1 and even moving-average length M, the recursive filter
has a finite impulse response. The old readout called every nonzero-feedback
case IIR and unstable at |a| ≥ 1, although this exact cancellation is a
stable zero-state input–output map.

For an impulse input, h[n] = (1 + a + … + aⁿ)/M for 0 ≤ n < M.
After that, h[n] = aⁿ⁻ᴹ⁺¹ h[M−1]. At a = −1 and even M, the terminal
coefficient is zero. The nonzero taps are 1/M at the even indices from
0 through M−2, and their total absolute mass is 1/2. For odd M the
coefficient is nonzero and the response has a nondecaying alternating tail.
The zero-feedback case is the usual length-M moving average.

The statement now defines FIR by support, distinguishes a causal
feed-forward realization from a general finite-support system, and explains
the cancellation exception. The scope distinguishes zero-state BIBO
stability from internal asymptotic stability: initial-state or arithmetic
errors can leave a hidden alternating mode in the cancelled realization.
The written BIBO criterion `sig-3.6` supplies the stability argument and
is mirrored in the syllabus.

The readout previously summed only 400 taps and described that as the
total discarded tail. It now uses the full geometric sum when stable,
the exact finite sum for FIR cases, and an infinite mass for uncancelled
nondecaying poles. It distinguishes the input-supremum error bound from
the observed maximum difference on the finite example. Roundoff is labelled
separately, and panels disclose when growing curves exceed their limits.

Validation: strict build, static/native mode check, existing signal-recovery
regressions and independent convolution tests for all displayed regimes.
The latter compare the production recursion with a direct finite-box/geometric
convolution, test even/odd cancellation, compare exact tails with 5,000-term
independent sums at multiple cutoffs, and verify the bounded-input error
inequality. Native keyboard and toggle gestures in both themes exercise
the cancelled FIR, uncancelled alternating IIR, zero-feedback and growing
clipped cases. The M=10, a=−1 picture was inspected: it shows five taps
of height 0.1 and coincident filtered/truncated outputs to roundoff.

This is an agent review correction, not a source-flag closure, subjective
listening pass or human review. The cross-field total stays 773 and the
nine prerequisite shortfalls remain open.
