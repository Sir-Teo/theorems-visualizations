# Regular-singular branches and resonances

`ode-4.2` described two pure-power local solutions even for repeated or
integer-separated indicial roots. Its recurrence marks inconsistent
steps but continues with a zero coefficient, so drawing that smaller-root
array as a solution was incorrect.

The page now omits an obstructed smaller-root series, draws only one
series at a repeated root, and explains that the independent logarithmic
partner is not computed here. Compatible resonances remain available with
a free coefficient set to zero. The statement describes power factors
rather than universally asserting two pure-power asymptotics.

For complex roots the right graph already computed the modulus of the
complex solution, while the left graph drew real and imaginary parts.
The caption now explains that distinction: the modulus has limiting
logarithmic slope Re(r); the real and imaginary parts oscillate in log(t).
The finite-interval slope measurement and 40-term truncation are explicit.
The recurrence and numerical coefficients are unchanged.

Seven ODE test groups pass, including a new regression on the actual
visualization: generic real roots draw two branches, an obstructed
resonance and repeated root draw one, and complex roots draw two real
components but one modulus. Ten native light/dark states exercise those
four cases plus a slider endpoint. All captures were inspected, with no
runtime/TeX/nonfinite-readout failures. Artifacts:
`/tmp/agent-review/frobenius-browser.{mjs,json}`, named PNGs and
`frobenius-ode-tests.log`. Strict build, review hashes and packets are
checked before commit. Agent review grants no human or listening credit.
