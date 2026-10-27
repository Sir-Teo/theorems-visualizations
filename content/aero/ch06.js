import {lesson1,lesson2,lesson3,lesson4,lesson5,lesson6,lesson7,lesson8,lesson9,lesson10,lesson11} from './ch06.viz.js';
export default {
 collection:'aero',chapter:6,title:'Stability and control',
 summary:'A gust asks two different questions: does the initial moment oppose the disturbance, and does the subsequent motion decay? Wing and tail leverage set static pitch stability and trim; the eigenvalues of the coupled equations organize the slower and faster motions. Feedback can change those eigenvalues, while flexible wings introduce aeroelastic modes that the rigid aircraft model cannot describe.',
 items:[
 {
  num:'6.1',kind:'Definition',name:'Longitudinal static stability',deps:['aero-2.4','ctrl-3.1'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 2, pp.2–1–2–9'],
  statement:String.raw`At a trimmed equilibrium, $C_m=0$. With the controls fixed, local longitudinal static stability means that a small positive change in angle of attack produces a negative, nose-down pitching moment:
$$C_{m_\alpha}=\left.\frac{\partial C_m}{\partial\alpha}\right|_{\mathrm{trim}}<0.$$
Here $\alpha$ is in radians and positive $C_m$ is nose-up. This is an initial restoring tendency. It does not by itself establish decay of the aircraft's time-dependent motion. Zero slope is neutral only to first order; higher-order terms can decide the nonlinear behavior.`,
  idea:String.raw`Measure longitudinal positions $h=x/c$ aft from the wing leading edge. An upward lift coefficient $C_L$ acting at $h_a$ contributes $(h-h_a)C_L$ to the nose-up moment about a CG at h. Thus the wing contribution is destabilizing when the CG is behind its aerodynamic centre; a sufficiently effective aft tail contributes a restoring slope. The moment translation has a plus sign in the CG position. The picture shows lift and moment increments about a hypothetical trim, so no unbalanced baseline force is mistaken for a gust response.`,
  caption:'Move the CG and apply a positive or negative gust angle. The lift arrows show increments at the wing and tail, while the selected point on the moment line gives their net pitching-moment increment. The elevator stays fixed during the disturbance.',
  scope:'Local attached-flow, small-angle derivatives for a chosen wing-and-tail teaching model. Wing slope 5 rad⁻¹; tail slope 4 rad⁻¹; downwash slope 0.375; tail dynamic-pressure ratio 1. The model has no stall, fuselage pitching-moment slope, free-elevator motion or time-dependent damping. Surface shapes and arrow lengths are schematic.',
  links:{'MIT · static stability':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/99dac83da0ad7eb8906ebac40e9e6ae1_lecture_2.pdf#page=2'},viz:lesson1
 },
 {
  num:'6.2',kind:'Definition',name:'Neutral point and static margin',deps:['aero-6.1'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 2, pp.2–7–2–9'],
  statement:String.raw`The stick-fixed neutral point $h_n$ is the CG location at which $C_{m_\alpha}=0$ when the aerodynamic geometry and fixed-control derivatives are held constant. Define the static margin by $\mathrm{SM}=h_n-h$. If the whole-aircraft lift slope $A$ is positive,
$$C_{m_\alpha}=A(h-h_n)=-A\,\mathrm{SM}.$$
Positive static margin therefore gives a restoring pitch slope; a CG aft of the neutral point gives a destabilizing slope. A static margin is dimensionless, often expressed as a percentage of the reference chord.`,
  idea:String.raw`Let the wing and tail aerodynamic centres be $h_w$ and $h_t$. Write $a_w$ for the wing lift slope and $b=\eta(S_t/S)a_t(1-\epsilon_\alpha)$ for the tail's contribution to whole-aircraft lift slope. Differentiating the wing and tail moments gives
$$A=a_w+b,$$
$$h_n=\frac{a_wh_w+bh_t}{A}.$$
The tail arm is $c(h_t-h)$ and changes when the CG moves. Retaining that dependence is what makes the whole-aircraft lift slope, rather than just the wing slope, appear in the static-margin identity.`,
  caption:'Slide the CG through the neutral point and change tail area. The enlarged chord ruler shows the signed CG-to-neutral-point separation; the companion graph measures the corresponding pitch stiffness on a fixed scale.',
  scope:'Stick-fixed derivatives in the same linear teaching model, with positive wing lift slope and nonnegative tail area. Positions are divided by the wing reference chord. The neutral point can lie beyond the wing chord; it is an aerodynamic balance location, not a physical hinge or a required CG location. Neutral stiffness is not a claim of dynamic stability.',
  links:{'MIT · neutral point':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/99dac83da0ad7eb8906ebac40e9e6ae1_lecture_2.pdf#page=10'},viz:lesson2
 },
 {
  num:'6.3',kind:'Proposition',name:'Trim and the role of the horizontal tail',deps:['aero-6.1'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 2, pp.2–10–2–12'],
  statement:String.raw`At a specified flight condition, longitudinal trim must satisfy both required lift and zero pitching moment:
$$C_{Lw}+\overline C_{Lt}=C_L^*,$$
$$\begin{aligned}0={}&C_{m,ac}+(h-h_w)C_{Lw}\\&-(h_t-h)\overline C_{Lt}.\end{aligned}$$
Here $\overline C_{Lt}=\eta(S_t/S)C_{Lt}$ is the tail lift on the wing-area basis. For distinct wing and tail aerodynamic centres and nonzero lift/elevator authority, these linear equations determine wing lift, tail lift, angle of attack and elevator angle uniquely. The algebraic answer must also lie within the model's angle and actuator limits.`,
  idea:String.raw`Eliminate wing lift first. The load split is
$$\overline C_{Lt}=\frac{C_{m,ac}+(h-h_w)C_L^*}{h_t-h_w}.$$
Then $C_{Lw}=C_L^*-\overline C_{Lt}$. The chosen lift laws are $C_{Lw}=5\alpha$ and $\overline C_{Lt}=4(S_t/S)(0.625\alpha+i_t+0.6\delta_e)$, with angles in radians. Positive elevator deflection is trailing-edge down. Tail incidence changes the elevator needed for a given load split; it does not change the loads required by the two balance equations. An aft tail need not always push downward.`,
  caption:'Adjust angle of attack and elevator manually, then choose solved trim to satisfy both balances at once. Lift and moment residuals share the same controls. Try removing the tail: an absent control authority cannot be repaired by a large elevator number.',
  scope:'Chosen local lift laws, reference moment coefficient −0.05 and fixed wing/tail aerodynamic centres 0.25c/2.5c. The displayed limits are |α|≤12° and |δe|≤25°; these are teaching-model bounds, not measured stall or certification limits. Solved trim fixes aerodynamic lift and moment only; thrust/drag and other flight-equilibrium equations remain outside this worksheet.',
  links:{'MIT · simultaneous trim equations':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/99dac83da0ad7eb8906ebac40e9e6ae1_lecture_2.pdf#page=13'},viz:lesson3
 },
 {
  num:'6.4',kind:'Model',name:'The phugoid mode',deps:['aero-6.1','ctrl-4.2','mech-3.6'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 7, pp.6–7–6–10'],
  statement:String.raw`A coarse small-perturbation phugoid model near level flight uses speed perturbation u and flight-path angle $\gamma$:
$$\dot u=-d u-g\gamma,\qquad \dot\gamma=\frac{2g}{V_0^2}u,$$
with $\dot h=V_0\gamma$, $d\ge0$, constant trim speed $V_0$ and nearly fixed angle of attack. Its undamped frequency and period are
$$\omega_n=\frac{\sqrt2 g}{V_0},\qquad T_0=\frac{\pi\sqrt2 V_0}{g}.$$
With $d=2\zeta\omega_n$ and $0<\zeta<1$, the poles have negative real parts and the speed/height exchange slowly decays. The damped period is $T_0/\sqrt{1-\zeta^2}$.`,
  idea:String.raw`A small speed increase raises lift approximately in proportion to $2u/V_0$, curving the flight path upward. Gravity then reduces speed; lower speed eventually curves the path downward. Neglecting drag, $V_0u+gh$ is conserved to first order, expressing exchange between kinetic and potential energy per unit mass. With the chosen drag approximation, $\zeta=1/[\sqrt2(L/D)]$. A positive quadratic mode energy is
$$E_p=\frac{u^2}{2}+\frac{V_0^2\gamma^2}{4},$$
whose derivative is $-du^2$. The first-order mechanical-energy perturbation is signed and is a different quantity.`,
  caption:'Give the aircraft an initial speed change and scrub time. Follow its computed height and flight-path angle while the two signed energy contributions exchange. Increase trim speed to lengthen the period; reduce lift-to-drag ratio to increase decay.',
  scope:'A coarse linear phugoid with fixed trim speed, small u/V0 and small flight-path angle; constant angle of attack and quasi-steady lift. The height trace uses actual model time and height; its aircraft icon has schematic size and indicates the calculated flight-path angle. It is not a nonlinear flight simulator or a calibrated aircraft trajectory. Readouts distinguish the approximate undamped period from the model’s damped period.',
  links:{'MIT · phugoid approximation':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/2aca82b5d1a5aacf39ceffcfe4e5b517_lecture_7.pdf#page=10'},viz:lesson4
 },
 {
  num:'6.5',kind:'Model',name:'The short-period mode',deps:['aero-6.1','ctrl-3.3'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 7, pp.6–4–6–6'],
  statement:String.raw`On a faster pitch time scale, speed can be approximated as fixed while angle of attack $\alpha$ and pitch rate q respond. A chosen two-state model is
$$\dot\alpha=-a\alpha+q,$$
$$\dot q=-k\alpha-dq-b\delta_e.$$
For $a,k,d,b>0$, its characteristic polynomial is $s^2+(a+d)s+(ad+k)$, so both poles lie in the open left half-plane. Oscillation occurs only when $(a+d)^2<4(ad+k)$; sufficiently large damping gives two real poles instead.`,
  idea:String.raw`The lift response damps angle of attack through a, the restoring pitching moment supplies k, and pitch-rate damping supplies d. The model retains two coupled states rather than prescribing a sinusoid. A finite elevator pulse is integrated with its forcing until the pulse ends; the subsequent motion follows the unforced matrix exponential. Integrating $\dot\theta=q$ gives pitch attitude, while $\gamma=\theta-\alpha$ distinguishes the flight path from the nose direction. The slow phugoid pair is shown as a fixed reference, not as an additional pair solved by this two-state model.`,
  caption:'Pulse the elevator, vary stiffness and damping, and compare angle of attack with pitch rate. The pole plane explains a fast oscillation or two decaying real motions. The aircraft’s pitch follows the integrated rate and its flow arrow follows the calculated flight-path angle.',
  scope:'Illustrative fixed-speed short-period coefficients: a=0.6 s⁻¹ and b=2.5 s⁻², with editable k in s⁻² and d in s⁻¹. Elevator down is positive and produces a negative pitch acceleration. The selected pulse is a finite rectangular input, not an ideal impulse. This reduction omits speed, actuator dynamics, downwash lag and the full longitudinal aircraft modes.',
  links:{'MIT · short-period reduction':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/2aca82b5d1a5aacf39ceffcfe4e5b517_lecture_7.pdf#page=6'},viz:lesson5
 },
 {
  num:'6.6',kind:'Definition',name:'Directional (weathercock) stability',deps:['aero-6.1'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 8, pp.7–1–7–3, 7–6–7–7'],
  statement:String.raw`Use right-handed body axes: x forward, y to the right wing and z down. Positive sideslip $\beta\simeq v/V_0$ means that the velocity has a positive body-y component. A positive yawing moment N turns the nose toward the right wing. Directional static stability at fixed controls requires
$$C_{n_\beta}=\frac{\partial C_n}{\partial\beta}>0.$$
For positive sideslip, an aft vertical fin develops a side force toward negative y; its aft lever arm gives a positive yawing moment, tending to align the nose with the velocity.`,
  idea:String.raw`For a fin at $x=-l_f$, a side force $Y_f<0$ gives $N_f=(-l_f)Y_f>0$. A destabilizing fuselage contribution can oppose this. The chosen example uses $C_{n_\beta}=0.16f-0.04$, where f scales fin area, and $C_{Yf}=-0.08f\beta$ on the same reference basis. The factor2 in the fin moment represents a chosen fin arm divided by span. Shrinking the fin through f=0.25 changes the sign of the total derivative. This is a static yaw tendency; damping and roll coupling require the lateral equations.`,
  caption:'Yaw the body relative to its velocity and resize the fin. In the top view, the fin force and its CG lever arm determine the restoring moment. The second panel shows where the fin contribution overtakes the opposing body contribution.',
  scope:'Small-angle, fixed-control directional derivatives in an illustrative rigid-aircraft model. Fin area scaling is not a calibrated design rule. The velocity arrow is aircraft motion through the air; the relative airflow points in the opposite direction. Body axes and signs are explicit so a weathercock analogy cannot silently reverse the moment.',
  links:{'MIT · lateral stability derivatives':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/cd0b5972e3e365a692ca1de99d30bcb8_lecture_8.pdf#page=2'},viz:lesson6
 },
 {
  num:'6.7',kind:'Model',name:'Lateral modes: roll subsidence, spiral and Dutch roll',deps:['aero-6.6','ctrl-3.3'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 8, pp.7–1–7–8'],
  statement:String.raw`Near level flight, sideslip, roll rate, yaw rate and bank angle form a coupled lateral system $\dot x=Ax$, with $x=(\beta,p,r,\phi)^{\mathsf T}$. In a common regime its four poles separate into a fast real roll-subsidence pole, a slow real spiral pole and a complex-conjugate Dutch-roll pair. Each mode's state proportions come from its eigenvector; its decay or growth comes from the pole's real part. These names describe a mode structure, not a guarantee that every aircraft or every flight condition has that structure.`,
  idea:String.raw`The chosen family retains gravity-induced sideslip, roll damping, weathercock stiffness and roll–yaw coupling:
$$\begin{aligned}\dot\beta&=-0.2\beta-r+0.1\phi,\\ \dot p&=-D\beta-2p+0.4r,\\ \dot r&=0.8f\beta-0.1p-0.3fr,\\ \dot\phi&=p.\end{aligned}$$
Here $D=\Gamma/5$, with the numerical dihedral angle $\Gamma$ expressed in degrees, and f is a fin scale. The selected eigenvector is scaled to the requested initial bank angle; the real part excites the Dutch-roll pair. The full real matrix exponential computes the subsequent state. Yaw is obtained separately from $\dot\psi=r$.`,
  caption:'Select roll subsidence, spiral or Dutch roll. The aircraft’s bank and yaw follow that mode’s calculated state, and the trace shows sideslip and bank angle on degree axes. Read the selected pole beside all four poles, then change dihedral or fin size.',
  scope:'A chosen dimensional linear system with time in seconds, angles in radians and rates in rad/s. Coefficients are illustrative and are not the Boeing 747 values in the source. The body orientation is the small-angle yaw/bank reconstruction, not a complete position trajectory. Large computed angles are marked as outside the small-perturbation interpretation. The slow spiral pole is isolated with exact characteristic-polynomial signs; its numeric value, other poles, eigenvectors and trajectories are approximate. Stability is checked independently from retained characteristic coefficients.',
  links:{'MIT · roll, spiral and Dutch roll':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/cd0b5972e3e365a692ca1de99d30bcb8_lecture_8.pdf#page=5'},viz:lesson7
 },
 {
  num:'6.8',kind:'Phenomenon',name:'Dihedral effect',deps:['aero-6.7'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 8, pp.7–2, 7–6–7–8'],
  statement:String.raw`Positive wing dihedral can make a sideslip produce a rolling moment toward reduced bank. In the stated body-axis convention this is a negative rolling-moment derivative $C_{\ell_\beta}$. Dihedral effect belongs to the whole aircraft: sweep, vertical placement and other geometry also contribute. Stronger restoring roll coupling can improve a spiral mode while reducing Dutch-roll damping in a particular coupled model; that tradeoff is not a universal monotonic law for all aircraft.`,
  idea:String.raw`In a front view, sideslip has opposite normal components on the two tilted wing halves, changing their lift oppositely. The chosen lateral family makes its roll–sideslip coefficient $-D=-\Gamma/5$. Its characteristic polynomial has constant coefficient $f(0.03D-0.032)$, so a zero spiral pole occurs at $\Gamma=16/3$ degrees. Over the displayed family, increasing dihedral moves the spiral pole left while the Dutch-roll pair becomes less strongly damped. The plot calculates all poles of the actual matrix at each angle; the threshold comes from the retained coefficient, not a rounded root sign.`,
  caption:'Raise the wing tips and give the aircraft a signed sideslip. Compare the two lift increments in the front view, then follow the spiral and Dutch-roll poles as dihedral changes. The selected poles stay on top of the complete locus.',
  scope:'Small-angle schematic lift increments and the explicitly chosen four-state family from the previous lesson, with fin scale fixed at 1. The front-view arrows are increments, not total wing lift. The degree-to-derivative proportionality is a teaching parameterization, not a measured relation or a universal aircraft design recommendation.',
  links:{'MIT · spiral mechanism and dihedral':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/cd0b5972e3e365a692ca1de99d30bcb8_lecture_8.pdf#page=7'},viz:lesson8
 },
 {
  num:'6.9',kind:'Concept',name:'Relaxed static stability and fly-by-wire',deps:['aero-6.2','ctrl-9.5'],
  refs:['J. P. How, MIT 16.333 (Fall 2004), lecture 9, pp.8–20–8–23, 8–26; local ideal pitch-model derivation'],
  statement:String.raw`An aft CG can reduce a chosen aircraft's trim-load penalty while removing its bare-airframe restoring pitch stiffness. Feedback can restore stability if it supplies sufficient restoring action and damping. For the ideal pitch model
$$\ddot\theta=k\theta-d\dot\theta+u,$$
use $u=-K_\theta\theta-K_q\dot\theta$. The closed-loop characteristic polynomial is
$$s^2+(d+K_q)s+(K_\theta-k).$$
It is asymptotically stable exactly when both coefficients are positive. If $k>0$, pitch-rate feedback alone leaves the constant coefficient negative and cannot stabilize this model.`,
  idea:String.raw`The picture takes $k=2C_{m_\alpha}$ after a chosen conversion to pitch acceleration and d=0.4 s⁻¹. Moving aft of the neutral point makes k positive. Attitude feedback changes effective stiffness, while rate feedback changes effective damping. This two-coefficient argument is self-contained; it does not assume the later LQR lesson. A separate trim-load worksheet uses $0.04C_{Lw}^2+0.04\overline C_{Lt}^2/(S_t/S)$ as an illustrative induced-drag penalty. Its optimum need not coincide with the neutral point, and an aft move does not always reduce drag.`,
  caption:'Move the CG, compare bare airframe, rate-only feedback and combined attitude/rate feedback, and watch the actual pitch response. The pole plane and the two characteristic coefficients show which gain changes stiffness and which changes damping. The drag curve is an explicitly chosen load penalty.',
  scope:'An ideal two-state pitch-attitude model around a chosen trim; instantaneous acceleration command with no actuator limits, delay, sensor noise or structural dynamics. It illustrates a stability mechanism and cannot certify a fly-by-wire controller. Real design must check the full model and flight envelope. Pitch responses beyond small angles are shown with a model-domain notice.',
  links:{'MIT · combined attitude and rate feedback':'https://ocw.mit.edu/courses/16-333-aircraft-stability-and-control-fall-2004/c66c985646924af57b2f78b0ebf56d68_lecture_9.pdf#page=24'},viz:lesson9
 },
 {
  num:'6.10',kind:'Phenomenon',name:'Flutter',deps:['solid-7.9','ctrl-3.12'],
  refs:['Thelen, Stanford & Jacobson, Flutter and Stochastic Gust Constraint Studies of the Undeflected CRM using MPhys (NASA, 2024), pp.1–2, 5–6; separate two-coordinate circulatory teaching model'],
  statement:String.raw`Flutter is an oscillatory aeroelastic instability in which airflow supplies enough energy to overcome structural/aerodynamic dissipation. Its onset is a zero-growth oscillatory boundary of the coupled system. A deliberately simple two-coordinate model is
$$\ddot q+2\gamma\dot q+K(V)q=0,$$
$$K(V)=\begin{pmatrix}1&-\mu\\ \mu&9\end{pmatrix}.$$
Here $\mu=V^2/64$.
For $\gamma>0$, this model loses stability at
$$\mu_F^2=16+20\gamma^2.$$
The undamped stiffness branches merge at $\mu=4$, which precedes this damped flutter threshold. Frequency merging and positive growth must therefore be checked separately.`,
  idea:String.raw`The off-diagonal forces are nonconservative: generalized aerodynamic power is $\mu(\dot q_1q_2-\dot q_2q_1)$. Mechanical energy $E=(\dot q_1^2+\dot q_2^2+q_1^2+9q_2^2)/2$ obeys $\dot E=P_a-2\gamma(\dot q_1^2+\dot q_2^2)$. The characteristic equation is $[(s+\gamma)^2+5-\gamma^2]^2=16-\mu^2$. Substituting $s=i\omega$ at nonzero frequency gives $\omega^2=5$ and the stated threshold. At zero damping and exact coalescence, the matrix is defective: polynomially growing solutions are possible even though the poles are imaginary. The real matrix exponential retains this case.`,
  caption:'Increase the flow-speed parameter and compare the damped poles with the frequency branches. Scrub the computed bending/twist motion and its energy exchange. Try zero damping at V=16 to expose defective coalescence rather than interpreting imaginary poles as sufficient for bounded motion.',
  scope:'A separate, mass-normalized circulatory model with two dimensionless generalized coordinates and a chosen time unit. V is a dimensionless teaching parameter, not an aircraft flutter speed in m/s. The wing drawing maps q1 to normalized bend and q2 to twist, with a labeled deformation multiplier that defaults to 5 and automatically fits large motion; it is not a finite-element airframe or the NASA CRM calculation. Frequency-dependent aerodynamics, nonlinear saturation and flight certification are outside the model. Linear growth continues mathematically; large amplitudes are explicitly marked outside its physical interpretation.',
  links:{'NASA · coupled aeroelastic analysis':'https://ntrs.nasa.gov/api/citations/20230016631/downloads/gust_constraints_scitech_2024-2023nov21.pdf#page=2'},viz:lesson10
 },
 {
  num:'6.11',kind:'Paper',name:'Some Aeronautical Experiments',deps:['aero-2.2','aero-6.1'],refs:['Wilbur Wright, Some Aeronautical Experiments (1901); hosted transcription of his revised 1902 Smithsonian Annual Report reprint'],
  paper:{authors:'Wilbur Wright',year:1901,title:'Some Aeronautical Experiments',venue:'Journal of the Western Society of Engineers, December 1901 (address of 18 September 1901)',url:'https://invention.psychology.msstate.edu/i/Wrights/library/Aeronautical.html'},introduces:[],
  statement:String.raw`Wilbur Wright reported experiments with the 1900 and 1901 gliders in which differential wing incidence provided lateral control and a forward horizontal surface controlled pitch. The work also exposed a gap between predicted and observed lift. For the 1901 machine, the reported design calculation suggested roughly 240 lb of lift with 308 ft² of surface at 17 mph and 3° incidence; the machine could not support its roughly 100 lb empty weight under those nominal conditions. These are rounded historical reports, not a complete modern aerodynamic dataset.`,
  idea:String.raw`Wing warping changed the relative lift of the two ends more promptly than shifting the pilot. The forward surface supplied a pitch moment, but unexpected centre-of-pressure travel on the deeply cambered wing initially undermined control; kite tests and reducing the curvature helped identify the problem. The lift worksheet reconstructs $L=kV^2AC_L$ using the reported old values $k=0.005$ and $C_L=0.545$. If a reading overstates true wind by 15%, use $V_{true}=V_{read}/1.15$. If old pressure and lift factors are respectively 20% and 50% greater than revised factors, divide by 1.2 and 1.5. These approximate corrections do not determine the unmeasured interference loss or reconstruct a flight.`,
  caption:'Warp the two wing ends and move the forward control surface in a schematic biplane. Then inspect the lift-prediction worksheet: each correction uses a stated overestimate convention. The unmeasured interference factor is adjustable and explicitly illustrative; the roughly 100 lb observation remains a historical bound, not a fitted curve.',
  scope:'The linked body is a hosted transcription of an author-revised 1902 reprint of the 1901 address, with editorial notes; it is not a facsimile of the original 1901 publication. The geometric model follows the biplane/forward-control arrangement but is not a dimensionally calibrated replica. Its control coefficients are chosen schematic values. The source reports approximate error estimates and qualitative superposition loss; no modern accepted lift value is inferred from them.',
  links:{'Wright · revised historical text':'https://invention.psychology.msstate.edu/i/Wrights/library/Aeronautical.html'},viz:lesson11
 }
 ]
};
