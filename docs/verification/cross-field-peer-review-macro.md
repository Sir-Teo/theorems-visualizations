# Independent peer review of the geology prerequisite audit

Read **33 source/target pairs across nine collections**, plus the corrected Poisson-thinning target. All sampled endpoints are written and in different registry fields. The review checks actual mathematical roles and assumptions; it does not treat title similarity or a matching keyword as a prerequisite. No browser work or source-flag closures were performed in this peer audit.

## Metadata corrections

- **arch-1.7 → solid-4.3**: move from deps to see. Verified in live content.
- **geol-3.7 → mech-1.8**: remove direct prerequisite; existing geol-3.5 supplies actual kinematics. Verified in live content.
- **bighist-4.5 → stoch-1.4**: replace discrete chain with Poisson thinning. Verified in live content.

The architecture shortfall is retained honestly (24 against 25); geology has 25 after removal of the rotating-frame mismatch. Replacing the BIGHIST target preserves its count without changing its existing model or prose.

## Scope and model findings handed to the owner

- **physio-3.7**: Positive stroke work on blood is -∮P dV when V is ventricular volume; ejection has dV<0. The current signed formula/annotation has the opposite sign, while the plotted positive area can remain valid. Owner and root notified; root authorized focused correction.
- **mathbio-3.4**: The implemented symplectic Euler method can have bounded energy error; symplecticity does not exactly preserve the nonlinear Hamiltonian V. The continuous-flow Hamiltonian claim is valid. Owner and root notified; root authorized focused correction.
- **mathbio-4.13**: The key-renewal birth limit needs finite mean of the exponentially tilted kernel and directly Riemann-integrable tilted forcing G, beyond nonlattice. Owner and root notified; root authorized source qualification.
- **ecol-4.7**: Strict symmetric positive definiteness applies to equal-norm, linearly independent translated utilization curves in the model, not arbitrary row-normalized Gram matrices. Owner and root notified; root authorized source qualification.
- **ecol-2.10**: Power variance stabilization is a first-order approximation; at b=2 the nonconstant limit is log x, not x^0. Owner and root notified; root authorized source qualification.
- **epi-2.7**: A general likelihood-ratio rejection region and a single monotone score cut are different classes without monotone likelihood ratio; generic equal-variance normals satisfy this, unequal-dispersion PSA need not. Owner and root notified; root authorized source qualification.

These findings do not imply that every associated prerequisite is wrong: pressure–volume work, Hamilton equations, key renewal, matrix conditioning and delta linearization are actual ingredients. Their conditions and limits must match what the source claims. Root authorized the owning reviewer to make the confirmed text/model corrections with focused validation.

## Direct-role sample

| Source | Target | Disposition | Actual role |
| --- | --- | --- | --- |
| geol-2.2 | num-1.11 | accepted | The absolute age-error expression is the relative input perturbation R times the derivative of log(1+R)/lambda. The function condition-number definition supplies exactly this first-order propagation. |
| geol-4.7 | fluid-2.5 | qualified-match | The buoyant driving scale rho*g*alpha*DeltaT follows from subtracting parcel weight from displaced-background-fluid weight. |
| geol-3.7 | mech-1.8 | remove-to-context | The source composes instantaneous velocities of rotating plates. The target is a constant Galilean boost between inertial frames; the rotating-frame assumptions do not match. |
| geol-4.10 | thermo-1.16 | qualified-match | The source assumes a rising parcel exchanges little heat, using the adiabatic no-heat definition. |
| kin-1.12 | stoch-4.10 | qualified-match | The displayed pair-state detailed-balance equations multiply around a cycle and cancel the equilibrium weights, exactly as in the cycle criterion. |
| kin-2.3 | prob-1.2.4 | accepted | Collision-rate weighting makes line-of-centres energy exponential; the displayed Arrhenius factor is its exponential tail. |
| kin-3.11 | mech-4.7 | qualified-match | The displayed Langevin coordinate uses the linear viscous-drag term and local harmonic well dynamics treated by the damped oscillator. |
| kin-3.2 | thermo-6.5 | qualified-match | The source converts a partition-function ratio into an activation free-energy expression. |
| mathbio-4.13 | prob-2.6.12 | qualified-match | Exponential tilting makes the reproduction kernel a probability density, after which the displayed long-run birth constant is the key renewal limit. |
| mathbio-3.4 | mech-12.3 | qualified-match | With q=w=log y and p=u=log x, the displayed predator–prey equations are Hamilton equations for V, so V is invariant under the continuous flow. |
| mathbio-3.21 | ctrl-3.3 | qualified-match | The community Jacobian is tested by the real parts of its eigenvalues, the continuous linear asymptotic-stability criterion. |
| ecol-1.6 | physio-4.5 | accepted | The written comparison explicitly substitutes Murray’s cube-law daughter radius ratio and obtains the alternative exponent near one. |
| ecol-4.7 | ladr-7.62 | qualified-match | For the model’s equal-norm, independent translated utilization curves, the normalized overlap matrix is a symmetric strictly positive Gram matrix. |
| ecol-4.7 | nla-3.2 | accepted | The source explains loss of feasibility through amplification by a nearly singular inverse overlap matrix. The inverse-system condition number is exactly the sensitivity measure used. |
| ecol-2.10 | stat-1.15 | qualified-match | The proposed variance-stabilizing transformation uses the first-order derivative rescaling behind the delta method. |
| physio-1.6 | kin-1.3 | qualified-match | The carrier model uses elementary association, release and conformation steps; mass action supplies concentration-proportional association and unimolecular transition rates. |
| physio-1.6 | stoch-4.1 | qualified-match | The source explicitly solves stationary occupancies by statewise probability inflow/outflow balance in the carrier cycle. |
| physio-2.5 | mech-3.1 | accepted | The operating-point objective is explicitly P=F*v, exactly the collinear power definition in the target. |
| physio-3.7 | thermo-1.9 | qualified-match | The source computes mechanical work from a pressure–volume loop, directly using pressure times displaced volume. |
| pharm-3.6 | fluid-1.8 | accepted | The well-stirred steady organ model balances entering drug flux Q*Cin against leaving and metabolic fluxes. Reynolds transport supplies the control-volume flux reduction. |
| pharm-3.10 | prob-1.6.1a | accepted | The eliminated dose fraction is CL*C(t)dt/D, so MRT is the expectation of the residence-time distribution and equals normalized first moment AUMC/AUC. |
| pharm-4.8 | ode-3.12 | accepted | Rectangular delivery is a forcing term integrated against the first-order homogeneous decay response, the scalar Duhamel formula. |
| epi-2.7 | psych-2.12 | qualified-match | The posterior-odds/error-cost comparison is exactly the payoff/base-rate likelihood-ratio decision rule. |
| epi-4.6 | causal-4.6 | accepted | The source explicitly warns that mediator adjustment removes total effects and collider adjustment opens a path, precisely the target’s bad-control rules. |
| epi-4.13 | causal-2.1 | accepted | The source explicitly invokes randomization to cut the severity-to-treatment link and remove indication confounding by design. |
| arch-1.2 | mech-1.6 | accepted | The source expressly derives translational equilibrium from Newton’s laws with zero acceleration. |
| arch-1.3 | mech-1.14 | accepted | The source’s roller reaction is restricted to the support normal, directly using the target’s ideal normal constraint force. |
| arch-1.7 | solid-4.3 | remove-to-context | The source uses uniaxial strength/density data and breaking length, not Rankine’s maximum-principal-stress criterion under mixed loading. |
| arch-4.3 | vcalc-1.6 | accepted | The dome cap equilibrium explicitly uses parallel-circle radius a*sin(phi), the spherical-coordinate projection in the target. |
| bighist-3.8 | mathbio-1.6 | accepted | The written logit recovery-time expression is obtained by inverting the logistic solution at the old-level recovery target. |
| bighist-3.9 | mech-3.1 | accepted | The impact energy explicitly substitutes spherical mass pi*rho*L^3/6 into kinetic energy m*v^2/2. |
| bighist-4.5 | prob-3.7.2a | accepted | The recombination-cut model explicitly uses a rate-T Poisson process and exponential spacings. |
| bighist-4.5 | stoch-1.4 | replace-target | The source uses continuous-distance leaving rates T(1-f),Tf and exponential holding lengths; the old target supplies discrete-time P^n and geometric convergence instead. |

The JSON records exact source anchors, complete target statements, applicability qualifications, live dependency presence, accepted repairs, and the owner’s previously indirect paths. A direct named step can be valid despite a long remote dependency path; an immediate prerequisite already supplying the same derivation does not justify another count.

A direct check of the implemented symplectic Euler step at α=γ=1, x=1.8, y=1, h=.1 gives ΔV=−.0033136400800852783, demonstrating that its energy conservation is not exact.

Fresh validation found zero dependency cycles in the written-plus-planned graph. This peer review made no edits to the owner’s content.
