// Bridge: one idea followed across collections and fields (MASTER_PLAN.md §8).
export default {
  slug: 'feedback',
  title: 'Feedback: regulation from machines to genes',
  blurb: String.raw`A controller measures what happened and uses the error to change what happens next. The same loop explains disturbance rejection in engineering, homeostasis in physiology and self-repression in a gene; its gain, sign and delay decide whether it corrects, oscillates or remembers.`,
  steps: [
    { id: 'ctrl-1.4', note: String.raw`Closing a negative-feedback loop changes its transfer function to $PC/(1+PCH)$. The denominator records repeated circulation around the loop and determines the closed-loop poles.` },
    { id: 'ctrl-1.8', note: String.raw`For a stable unity-feedback loop, a disturbance is filtered by the sensitivity $S=1/(1+PC)$. Large loop gain can reject slow disturbances, while other frequencies can pass through or even be amplified.` },
    { id: 'physio-1.1', note: String.raw`Homeostasis gives the same diagram biological parts: a sensor, a comparison with a set point and effectors that oppose the error. Regulation works within the effectors’ capacity; saturation lets the variable escape.` },
    { id: 'physio-1.2', note: String.raw`The physiological gain convention writes correction divided by residual error, giving a negative number for negative feedback. With corrective strength $K>0$, the surviving static error is still $D/(1+K)$, the engineering sensitivity law.` },
    { id: 'ctrl-1.7', note: String.raw`Feedback can also buffer changes in the mechanism itself. With the controller fixed, the quotient rule gives $dT/dP=C/(1+PC)^2$; where the relative ratios are defined, plant-gain sensitivity is $1/(1+PC)$. This protection assumes the loop remains stable and does not make an inaccurate sensor accurate.` },
    { id: 'sysbio-2.1', note: String.raw`A protein that represses its own production closes a molecular negative-feedback loop. In the instantaneous Hill model, decreasing production and increasing removal intersect at one attracting steady state.` },
    { id: 'sysbio-2.3', note: String.raw`Differentiate that steady-state balance and the same sensitivity denominator reappears. Negative autoregulation buffers variation in production rate, with a finite limit set by the Hill coefficient; this is not a claim about all molecular noise.` },
    { id: 'sysbio-2.2', note: String.raw`Feedback changes the transient as well as the final sensitivity. When the comparison is made at the same steady-state protein level, this autoregulated gene reaches half its final level faster than the simple production–removal model.` },
    { id: 'ctrl-4.9', note: String.raw`The instantaneous model hides a limit: delayed correction can arrive after the error has reversed. In the specified integral-control loop, increasing gain past a delay-dependent threshold replaces settling with growing oscillations.` },
    { id: 'sysbio-4.4', note: String.raw`Change the architecture to a bistable gene circuit and feedback can preserve a choice instead of erasing an error. Two switching thresholds create hysteresis, so the same current input can support different states depending on history.` },
  ],
};
