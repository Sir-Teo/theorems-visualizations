import * as V from './ch05.ui.shared.js';
const book='Åström–Murray, Feedback Systems, public draft29Jun2019';
export default {
 collection:'ctrl',chapter:5,title:'PID control',
 summary:String.raw`Proportional, integral and derivative actions have different roles and different failure modes. Exact equilibria and executable loops distinguish stable regulation from a finite transient, saturation and delayed feedback. Modern tuning rules, a relay experiment and two-loop architectures are computed on declared models; the unavailable1942 original remains explicitly flagged.`,
 items:[
 {num:'5.1',kind:'Definition',name:'Proportional control and its offset',
 statement:String.raw`A proportional controller applies $u=k_p(r-y)$, with gain measured in actuator units per output unit. For the declared plant $\tau\dot y=-y+K(u+d)$, where $K,\tau,k_p>0$ and $r,d$ are constant, the unique equilibrium is asymptotically stable and
 $$e_* = \frac{r-Kd}{1+Kk_p},\qquad y_*=r-e_*.$$
 This is a type-zero, finite-DC-gain example. P control need not leave a step-tracking offset for every plant: $\dot y=K(u+d)$ instead gives $e_*=-d/k_p$, zero when $d=0$.`,
 idea:String.raw`Substitute the controller into each differential equation. The first plant becomes $\tau\dot y=-(1+Kk_p)y+K(k_pr+d)$; shifting by its equilibrium leaves one negative real eigenvalue. The constant-matrix flow (ODE3.3) gives the exact exponential transient. For the integrating plant the same calculation gives pole $-Kk_p$; the disturbance port and the plant's system type matter.`,
 caption:String.raw`Change the gain, plant type and constant input load. The blue curve is the exact computed output; the readout gives its asymptotic error, which is different from the error at the end of a finite plot.`,
 scope:String.raw`Unity negative feedback, positive chosen plant constants, no delay or saturation, constant reference and input disturbance. Increasing gain can destabilize other plants; this first-order example is not a general stability guarantee.`,
 deps:['ctrl-4.6','ode-3.3'],see:['ctrl-1.9'],refs:[book+' §11.1,11-3–11-5'],tags:['proportional control','equilibrium'],viz:V.proportional},
 {num:'5.2',kind:'Definition',name:'Integral action removes the offset',
 statement:String.raw`Integral action adds a state $I$ with $\dot I=k_i(r-y)$, $k_i>0$, and control $u=k_p(r-y)+I$. At any finite equilibrium of this unsaturated controller, $r-y=0$. For $\tau\dot y=-y+K(u+d)$ with $K,\tau>0$, $k_p\ge0$ and constant $r,d$, the equilibrium is $y_*=r$, $I_*=r/K-d$, and is asymptotically stable: its characteristic polynomial is
 $$\tau s^2+(1+Kk_p)s+Kk_i.$$
 The conclusion requires an existing feasible equilibrium and stable convergence; integral action alone supplies neither for a general plant.`,
 idea:String.raw`The equilibrium condition $\dot I=0$ forces zero tracking error. Shifting both plant and integral states by their equilibrium gives a two-dimensional homogeneous linear system. Its trace is negative and determinant positive, so both eigenvalues have negative real part by ODE3.8; ODE3.3 then gives decay. Increasing $k_i$ in this particular model can decrease the damping ratio while preserving stability. Delays, additional lags and actuator bounds change that conclusion.`,
 caption:String.raw`Vary PI gains and the input load applied at t8. Watch the actual error–integral phase path and the finite-horizon residual; a stable asymptotic zero does not make a simulated finite-time residual exactly zero.`,
 scope:String.raw`The proved stability claim is only for the stated first-order unsaturated plant. A persistent unreachable setpoint can keep the integrator growing. The trajectories use RK4 with declared model seconds and step size, not observed industrial data.`,
 deps:['ctrl-5.1','ode-3.8','ode-3.3'],see:['ctrl-4.7','ctrl-5.7'],refs:[book+' §11.1,11-4–11-6; §11.2,11-9–11-10'],tags:['integral action','stability'],viz:V.integral},
 {num:'5.3',kind:'Definition',name:'Derivative action adds damping',
 statement:String.raw`Derivative feedback responds to a rate of change; it does not predict the future exactly. For the chosen oscillator $\ddot y+2\zeta_0\omega_n\dot y+\omega_n^2y=\omega_n^2u$, let $u=k_p(r-y)-k_d\dot y$. The closed-loop polynomial is
 $$s^2+a_1s+a_0,$$
 where $a_1=2\zeta_0\omega_n+\omega_n^2k_d$ and $a_0=\omega_n^2(1+k_p)$.
 With $\zeta_0,\omega_n>0$, $k_p,k_d\ge0$, derivative-on-velocity increases this model's damping coefficient. Ideal differentiation has sinusoidal-noise gain $k_d\omega$; a proper derivative $k_ds/(1+T_fs)$ has gain $k_d\omega/\sqrt{1+(T_f\omega)^2}$.`,
 idea:String.raw`Substitution identifies the coefficient multiplying velocity. The planar eigenvalue formula (ODE3.8) gives the poles and damping ratio. Separately, applying the derivative operator to a complex exponential multiplies its amplitude by $\omega$; dividing by $1+iT_f\omega$ gives the filtered amplitude. These are different experiments: the time response uses exact velocity feedback, while the frequency panel compares noise amplification.`,
 caption:String.raw`Move the derivative gain to change actual oscillator damping. Independently vary the noise frequency and filter time to compare ideal and filtered noise gains; the noise panel is not a noisy version of the displayed velocity-feedback trajectory.`,
 scope:String.raw`A declared second-order stable plant, no delay, exact velocity measurement in the trajectory. Derivative action can worsen robustness on other plants. An ideal derivative of a reference step is an impulse, not a finite numerical spike.`,
 deps:['ctrl-5.1','ode-3.8'],refs:[book+' §11.1,11-6; §11.5,11-20'],tags:['derivative action','noise'],viz:V.derivative},
 {num:'5.4',kind:'Definition',name:'The PID controller',
 statement:String.raw`The ideal parallel PID law is $u=k_pe+k_i\int_0^t e(\tau)\,d\tau+k_d\dot e$, $e=r-y$. Its gain units are respectively $U/Y$, $U/(Y\,\mathrm{time})$ and $U\,\mathrm{time}/Y$. When defined, $T_i=k_p/k_i$ and $T_d=k_d/k_p$ are times. A realizable derivative-on-measurement implementation uses
 $$\begin{gathered}\dot f=(y-f)/T_f,\quad T_f>0,\\ D=-k_d(y-f)/T_f.\end{gathered}$$
 and $u=k_pe+I+D$, $\dot I=k_ie$. This specifies an algorithm, not a universal stability theorem.`,
 idea:String.raw`The three terms are computed from the same measured output and added in actuator units. The auxiliary first-order filter realizes $k_ds/(1+T_fs)$ without differentiating a reference step. Couple the controller states to the plant equations to obtain a concrete initial-value problem. The chosen linear unsaturated loops can be checked through their actual state trajectories; their gains need not stabilize all plant choices.`,
 caption:String.raw`Choose a plant and edit all three gains and the derivative filter. Use the step player to inspect an actual selected state: the bars show P, I, D, their sum and the applied control. The output curve is integrated from those same terms.`,
 scope:String.raw`Chosen dimensionless plant constants with time in model seconds, zero initial plant/controller states, reference step at t1. The derivative acts on filtered measurement; this differs from ideal derivative-on-error. The finite solver stops if states leave its numerical bound; such a stop is not a proof of divergence.`,
 deps:['ctrl-5.2','ctrl-5.3','ode-3.12'],refs:[book+' Eq11.1,11.4–11.5'],tags:['pid','implementation'],viz:V.pid},
 {num:'5.5',kind:'Method',name:'Ziegler–Nichols tuning',
 statement:String.raw`An ultimate-gain experiment raises a proportional feedback gain toward a marginal oscillation and records the gain $K_u$ and period $P_u$. For $P(s)=(s+1)^{-3}$ they are exactly $K_u=8$ and $P_u=2\pi/\sqrt3$. The **modern FBS2019 Table11.1(b) version** used here is:
 (a) P: $k_p=.5K_u$;
 (b) PI: $k_p=.4K_u$, $T_i=.8P_u$;
 (c) PID: $k_p=.6K_u$, $T_i=.5P_u$, $T_d=.125P_u$.
 These are empirical starting rules, not a robust-performance guarantee or a verified transcription of the unread1942 original.`,
 idea:String.raw`The written three-lag calculation (CTRL1.9) places a conjugate pole pair at $\pm i\sqrt3$ when the gain reaches8. A nonzero initial perturbation excites that mode; below the boundary it decays and above it grows. The experiment measures zero crossings from the actual finite trace, which can still contain transients. The modern table then determines the gains, and a separate actual step experiment tests the resulting controller.`,
 caption:String.raw`Sweep the experimental gain through8, compare the measured period with the exact boundary period, and select the modern P, PI or PID rule. The tuned response is computed with its declared derivative filter; neither a quarter-decay ratio nor robustness is imposed on the curve.`,
 scope:String.raw`An authored three-lag linear model with no saturation. Ultimate-gain tests on real equipment may be unacceptable; this is a bounded model laboratory. Published PI variants differ: the .4/.8 version is explicitly attributed to the actual modern source read, not conflated with .45 or1/1.2 versions.`,
 deps:['ctrl-5.4','ctrl-1.9'],see:['ctrl-5.13'],refs:[book+' §11.3,Table11.1(b),11-12–11-13'],tags:['tuning','ultimate gain'],viz:V.tuning},
 {num:'5.6',kind:'Method',name:'Relay autotuning',
 statement:String.raw`A hysteretic relay applies $u=+d$ when $e$ reaches the upper threshold $h$, $u=-d$ when it reaches the lower threshold $-h$, and holds its previous sign inside the band. When an established nearly sinusoidal process-output oscillation has amplitude $a$, a symmetric relay's fundamental gives the **approximate** estimate $K_u\approx4d/(\pi a)$. Hysteresis introduces phase and higher harmonics can invalidate that interpretation. A first-order plant $\tau\dot y=-y+Ku$ with $0<h<Kd$ has the exact relay-cycle period
 $$T=2\tau\log\frac{Kd+h}{Kd-h},$$
 although that plant has no finite proportional ultimate gain. A relay cycle alone therefore does not certify an ultimate-gain measurement.`,
 idea:String.raw`Integrating the two constant-input first-order branches from $-h$ to $h$ and back gives the exact displayed counterexample. The three-lag experiment instead integrates actual states and refines every relay threshold crossing. Fourier integration of a symmetric square wave gives fundamental amplitude $4d/\pi$; retaining only that component is a describing-function approximation. The actual1984 report distinguishes this approximation from its sampled-data periodicity conditions.`,
 caption:String.raw`Compare an event-refined three-lag relay run with the exact first-order hysteresis cycle. Change relay amplitude and hysteresis, inspect the waveform and phase loop, and compare the estimated gain with the known three-lag gain8. Invalid first-order bands are reported instead of fabricating a cycle.`,
 scope:String.raw`Initial relay sign is positive; the three-lag plant starts at zero, while the exact first-order cycle starts at $y=-h$. Late finite periods and their spread are diagnostics, not proofs of existence, uniqueness or attraction of a limit cycle. Neither all plants nor all relay choices identify a critical point.`,
 deps:['ctrl-5.5','ctrl-2.12','ode-3.12'],see:['ctrl-3.11'],refs:['Åström–Hägglund, Automatic Tuning of Simple Regulators,TFRT-7269(1984),Eq1,6–20',book+' §11.3,11-15–11-16; §10.5,10-26–10-27'],tags:['relay','describing function'],viz:V.relay},
 {num:'5.7',kind:'Phenomenon',name:'Integrator windup',
 statement:String.raw`With a bounded actuator, the commanded signal $u_*=k_pe+I+D$ can differ from the applied signal $u=\operatorname{sat}_{U_{\max}}(u_*)$. An unprotected integrator still obeys $\dot I=k_ie$. During sustained saturation, nonzero error can accumulate a large integral state; the actuator can remain pinned after the error changes sign. An infeasible steady target cannot be restored merely by integrating harder. Windup is a mechanism, not a universal overshoot magnitude.`,
 idea:String.raw`When the actuator is pinned, increasing $I$ does not change the plant input, while the controller continues to integrate the error. After a reference reversal, that stored state must unwind before the command returns inside the actuator bounds. The actual coupled plant/controller ODE and saturation map expose this state mismatch; an unreachable initial equilibrium is separately labeled.`,
 caption:String.raw`Compare command with applied control during a setpoint step and its return at t12. Change the actuator limit and integral gain, then inspect the selected actual state with the player. The label identifies whether the initial target is reachable.`,
 scope:String.raw`First-order plant $2\dot y=-y+u$, proportional gain2, symmetric actuator bounds, initial states zero. Optional protection controls allow the same model to be compared without implying that all industrial windup has this trajectory.`,
 deps:['ctrl-5.2','ctrl-2.12'],refs:[book+' §11.4,11-16–11-17'],tags:['windup','saturation'],viz:V.windup},
 ]
};
