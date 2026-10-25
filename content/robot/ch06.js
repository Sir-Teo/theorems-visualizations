import { lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8, lesson9 } from './ch06.viz.js';
export default {
  "collection": "robot",
  "chapter": 6,
  "title": "Dynamics",
  "summary": "Moving a robot quickly takes torques that depend on inertia, gravity and the coupling between joints. The equations of motion can be derived from the Lagrangian or computed recursively link by link with Newton–Euler, and both give the standard form with a configuration-dependent mass matrix. Its structural properties — positive definiteness, passivity — are what make robot control provably stable.",
  "items": [
    {
      "num": "6.1",
      "kind": "Theorem",
      "name": "Newton–Euler equations of a single rigid body",
      "deps": [
        "mech-10.11",
        "robot-2.10"
      ],
      "refs": [
        "Lynch–Park §8.2, printed pp.281–289 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "In a rigid body's centre-of-mass frame, write the body twist as $V_b=(\\omega_b,v_b)$ and the applied wrench as $F_b=(m_b,f_b)$. With constant spatial inertia $G_b=\\operatorname{diag}(I_b,mI_3)$, Newton–Euler reads\n$$F_b=G_b\\dot V_b-\\operatorname{ad}_{V_b}^{\\mathsf T}G_bV_b.$$\nIts rotational and translational parts are\n$$\\begin{aligned}m_b&=I_b\\dot\\omega_b+\\omega_b\\times(I_b\\omega_b),\\\\ f_b&=m(\\dot v_b+\\omega_b\\times v_b).\\end{aligned}$$\nAll components in each equation use the same body frame. The linear body velocity is a rotating-frame representation of the COM velocity, so its time derivative alone is not the inertial acceleration.",
      "idea": "For the operator ad, a test twist has angular component eta and linear component u. Its image has angular component $\\omega\\times\\eta$ and linear component $v\\times\\eta+\\omega\\times u$. Sum the point-mass force equations over the body. The first mass moments vanish about the COM, leaving the translational equation. Taking moments leaves the inertia tensor and the angular velocity product. With no applied torque, $L_s=RI_b\\omega_b$ is constant in space even though its body components change. The picture uses a uniform ellipsoid with radii $(a,a,c)$: $I_\\perp=m(a^2+c^2)/5$ and $I_z=2ma^2/5$. For an axisymmetric free body, $\\Omega=(I_z-I_\\perp)\\omega_z/I_\\perp$ and the transverse body angular velocity rotates at $\\Omega$. Composing rotation about the fixed spatial momentum with rotation about the body symmetry axis gives the displayed analytic orientation. In wrench mode the torque is coaxial and the force is constant in space; direct integration gives the COM displacement and spin, and $\\Delta T$ equals the applied work.",
      "caption": "Rotate the view and scrub time. In free motion, the ellipsoid changes orientation around a fixed spatial angular momentum; angular velocity need not point along it. Switch to the specified coaxial wrench to see rotational and translational work enter the body. The body view follows the COM, while its displacement is reported separately.",
      "scope": "A uniform axisymmetric ellipsoid, positive physical moments of inertia and an analytic free-precession solution; this is not a general asymmetric-body tumbling solver. In wrench mode the torque is along the symmetry axis, the initial transverse spin is zero, the force is fixed along world x and the COM starts at rest. Arrows for different quantities have separately stated schematic scales. Frame rotation and surface geometry are approximate; exact algebra preserves the chosen inputs and work balance. For nonzero free angular momentum, the initial orientation is chosen so that this conserved vector points along world +z; changing the body spin also changes that chosen initial orientation.",
      "links": {
        "Modern Robotics · rigid-body dynamics": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=301"
      },
      "viz": lesson1
    },
    {
      "num": "6.2",
      "kind": "Theorem",
      "name": "Equations of motion of an open chain",
      "deps": [
        "mech-6.6",
        "robot-4.1"
      ],
      "refs": [
        "Lynch–Park §8.1, printed pp.269–278 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "For an ideal rigid-link open chain with independent joint coordinates $q$, positive link masses/inertias and time-independent potential $U(q)$, the actuator torques have the form\n$$\\tau=M(q)\\ddot q+c(q,\\dot q)+g(q),$$\nwhere $M=M^{\\mathsf T}>0$, $c$ contains the quadratic velocity terms and $g=\\nabla U$. It follows by applying Euler–Lagrange to $L=T-U$ with $T=\\tfrac12\\dot q^{\\mathsf T}M\\dot q$. At a specified state this solves inverse dynamics; solving the same equation for $\\ddot q$ gives forward dynamics.",
      "idea": "The consistent example has two uniform slender rods, COMs at half-length and COM inertias $I_i=m_il_i^2/12$. Compute each COM's velocity from its position, add its translational kinetic energy and its rotational energy, and collect coefficients of the joint rates. Set\n$$\\begin{aligned}A&=m_1l_1^2/3+m_2(l_1^2+l_2^2/3),\\\\B&=m_2l_2^2/3,\\\\D&=m_2l_1l_2/2.\\end{aligned}$$\nThen $M_{11}=A+2D\\cos q_2$, $M_{12}=M_{21}=B+D\\cos q_2$ and $M_{22}=B$. Differentiating the kinetic energy supplies the velocity-product vector; differentiating the COM heights supplies gravity. The view prescribes a smooth periodic joint motion and calculates the required torque, keeping inertial, velocity-product and gravity terms separate on a common torque scale. A zero joint acceleration does not imply zero acceleration of the links' mass points.",
      "caption": "Follow a prescribed two-link motion and read the two torque ledgers. For each joint, the inertial, velocity-product and gravity terms add to the required actuator torque. COM markers and equal horizontal/vertical geometry scales make the mass distribution explicit. Changing gravity changes the required torque while the prescribed path stays the same.",
      "scope": "Uniform rods in a vertical plane, q1 counterclockwise from world +x and q2 relative to link1; lengths in metres, masses in kilograms, rates in radians per second and torques in N m. The arm is frictionless, fully actuated and has no external tool load. The source's introductory example uses point masses at the tips; the displayed rod model is derived separately. This view is prescribed inverse dynamics, not an unforced gravity simulation.",
      "links": {
        "Modern Robotics · open-chain equations": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=289"
      },
      "viz": lesson2
    },
    {
      "num": "6.3",
      "kind": "Definition",
      "name": "The mass matrix",
      "deps": [
        "robot-6.2",
        "ladr-7.62"
      ],
      "refs": [
        "Lynch–Park §8.1.3, printed pp.277–280 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "At a fixed configuration, the joint-space mass matrix is the symmetric quadratic form that represents kinetic energy:\n$$T(q,\\dot q)=\\tfrac12\\dot q^{\\mathsf T}M(q)\\dot q.$$\nFor the stated positive-mass rigid-link model, $M(q)$ is positive definite. For $E>0$, the contour $T=E$ is an ellipse in the two-dimensional joint-velocity plane. Its principal directions are eigenvectors of $M$ and its semi-axis lengths are $\\sqrt{2E/\\lambda_i}$. At $E=0$, the contour is the single zero-velocity point.",
      "idea": "Kinetic energy is a sum of nonnegative link energies. A nonzero joint-rate vector moves some positive-inertia part of this open chain, so the sum is positive. For the uniform-rod example, the determinant has the manifestly positive factorization\n$$\\begin{aligned}\\det M&=l_1^2l_2^2K,\\\\K&=\\frac{m_1m_2}{9}+\\frac{m_2^2}{12}\\\\&\\quad+\\frac{m_2^2\\sin^2q_2}{4}.\\end{aligned}$$\nTogether with $M_{11}>0$, this proves the two-by-two SPD claim for every posture, including straight and folded arms. Orthogonally diagonalize $M$ and write the energy as a sum of $\\lambda_i u_i^2/2$ to obtain the ellipse. The longer energy-ellipse axis corresponds to the smaller eigenvalue. This differs from mapping a unit acceleration circle through M, whose torque-ellipse axes have lengths $\\lambda_i$.",
      "caption": "Change the elbow angle and watch the fixed-energy contour change shape in joint-velocity space. The selected direction picks a velocity on the contour; its kinetic energy is evaluated from the actual matrix. A straight tool posture can lose Cartesian mobility while its joint-space mass matrix stays positive definite.",
      "scope": "The same two uniform rods and independent joint coordinates as the equations-of-motion lesson. The ellipse axes carry rad/s, energy carries joules and the matrix carries joint rotational inertia units. Energy zero is a collapsed point; a tiny positive energy remains positive even when labels require a magnitude status. Eigenvector geometry and square roots are approximate, while the algebraic determinant and positivity retain original input factors.",
      "links": {
        "Modern Robotics · mass and kinetic energy": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=297"
      },
      "viz": lesson3
    },
    {
      "num": "6.4",
      "kind": "Proposition",
      "name": "Skew-symmetry of Ṁ − 2C (passivity)",
      "deps": [
        "robot-6.2"
      ],
      "refs": [
        "Lynch–Park §8.1.2, printed pp.275–277 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "Choose the Christoffel Coriolis matrix, with $C_{ij}=\\sum_k\\Gamma_{ijk}\\dot q_k$ and\n$$\\begin{aligned}2\\Gamma_{ijk}={}&\\partial_kM_{ij}+\\partial_jM_{ik}\\\\&-\\partial_iM_{jk}.\\end{aligned}$$\nThen $S=\\dot M-2C$ is skew-symmetric, so $\\dot q^{\\mathsf T}S\\dot q=0$. For ideal dynamics $M\\ddot q+C\\dot q+\\nabla U=\\tau$ and mechanical energy $E=T+U$,\n$$\\dot E=\\tau^{\\mathsf T}\\dot q.$$\nThus actuator work accounts for the energy change under the stated ideal assumptions.",
      "idea": "The proof uses the symmetry of M.\n\nDifferentiate each mass-matrix entry along the motion: $\\dot M_{ij}=\\sum_k\\partial_kM_{ij}\\dot q_k$. Subtract twice the chosen C entry. The remaining coefficient is $\\partial_iM_{jk}-\\partial_jM_{ik}$, which changes sign on exchanging i and j. A skew-symmetric matrix has zero quadratic form. Now differentiate $T=\\dot q^{\\mathsf T}M\\dot q/2$; substitute the equation of motion, and the term $\\dot q^{\\mathsf T}(\\dot M-2C)\\dot q/2$ vanishes. The gravity power cancels $\\dot U$. The chosen C matters: matrices with the same product $C\\dot q$ need not individually have this skew property. The two-link view computes the separate cancellation terms and energy/power along a prescribed smooth motion.",
      "caption": "Scrub the same prescribed arm cycle and compare mechanical-energy rate with actuator power. The velocity-product power and half the mass-rate quadratic form cancel. A separate ledger shows their signed sizes, so the zero identity is not produced by hiding small numbers on a chart.",
      "scope": "The Christoffel C defined in the statement, symmetric differentiable M, time-independent potential and ideal frictionless joints. Applied torque includes the actuator inputs; external forces, damping or time-dependent constraints would contribute their own power. The displayed motion is prescribed and its torque is calculated from the model. Exact algebra verifies the chosen identity, while the trajectory's trigonometric values and plotted geometry are approximate.",
      "links": {
        "Modern Robotics · Christoffel matrix and passivity": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=295"
      },
      "viz": lesson4
    },
    {
      "num": "6.5",
      "kind": "Algorithm",
      "name": "Recursive Newton–Euler inverse dynamics",
      "deps": [
        "robot-6.1",
        "robot-2.9"
      ],
      "refs": [
        "Lynch–Park §8.3, printed pp.289–293 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "Recursive Newton–Euler solves inverse dynamics in two passes. Express a link twist and its screw axis in the link's own frame. The outward pass transports the parent's twist/acceleration and adds the joint motion:\n$$\\begin{aligned}U_i&=\\operatorname{Ad}_{T_{i,i-1}}V_{i-1},\\\\V_i&=U_i+A_i\\dot q_i.\\end{aligned}$$\nThe inward pass combines each link's Newton–Euler wrench with the transported child wrench. Projecting the result onto the screw axis gives $\\tau_i=A_i^{\\mathsf T}F_i$. With consistent transforms, gravity and tool-load signs, these torques equal those obtained from Euler–Lagrange.",
      "idea": "The outward acceleration is the transported parent acceleration plus $A_i\\ddot q_i$ and the velocity-product term $\\operatorname{ad}_{V_i}(A_i\\dot q_i)$. The inertial wrench is $W_i=G_i\\dot V_i-\\operatorname{ad}_{V_i}^{\\mathsf T}G_iV_i$. Inward, use\n$$F_i=W_i+\\operatorname{Ad}_{T_{i+1,i}}^{\\mathsf T}F_{i+1}.$$\nTwists and wrenches transform dually, preserving power. Gravity can be represented by a base acceleration opposite to the physical gravity vector. The planar view instead uses equivalent world-frame COM force balances: first obtain absolute link angular rates and COM accelerations; then sum force and moment from the tool toward the base. The distal link contributes both its transmitted force and its joint couple. Continuous-rod force/moment integration independently checks that the final joint torques match the mass-matrix result.",
      "caption": "Advance the computational step: velocity and acceleration information travels from base to tool, then force and moment information returns toward the base. The physical arm state stays fixed during a sweep. Each final torque is compared with the independently derived Lagrange torque for the same state.",
      "scope": "Ideal rigid links and one-degree-of-freedom joints, known joint state and accelerations, no external tool load in this example. The general formulas use child-frame screw coordinates; the displayed equivalent two-rod calculation uses world-frame COM accelerations and explicit gravity forces. Sweep progress is an algorithm step, not physical time. The source's Ftip convention is the wrench applied by the robot to its environment; reversing that convention requires reversing its sign.",
      "links": {
        "Modern Robotics · recursive inverse dynamics": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=309"
      },
      "viz": lesson5
    },
    {
      "num": "6.6",
      "kind": "Definition",
      "name": "Task-space (operational-space) dynamics",
      "deps": [
        "robot-6.2",
        "robot-4.1"
      ],
      "refs": [
        "Lynch–Park §8.6, printed pp.298–299 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "For a local Cartesian task $x$ with invertible square point Jacobian $\\dot x=J(q)\\dot q$, define\n$$\\begin{aligned}\\Lambda&=J^{-\\mathsf T}MJ^{-1}\\\\&=(JM^{-1}J^{\\mathsf T})^{-1}.\\end{aligned}$$\nWriting $h=c+g$ and a task force through $\\tau=J^{\\mathsf T}F$ gives\n$$\\begin{aligned}F&=\\Lambda\\ddot x+\\eta,\\\\\\eta&=J^{-\\mathsf T}h-\\Lambda\\dot J\\dot q.\\end{aligned}$$\nThe finite response map $A_x=JM^{-1}J^{\\mathsf T}$ is still defined at rank loss, but $\\Lambda$ is not an invertible task-space mass there.",
      "idea": "Differentiate $\\dot x=J\\dot q$ to include the Jacobian-rate term, solve for $\\ddot q$ and substitute in joint dynamics. Equivalently, at zero velocity with gravity absent or compensated, the applied tool force produces $\\ddot x=A_xF$. A circle of equal force magnitudes maps to an acceleration ellipse, whose semi-axis lengths are the force magnitude times the eigenvalues of $A_x$. This is the response ellipse shown here, in m/s². Along a unit force direction d, the acceleration component in that direction is $d^{\\mathsf T}A_xd$ times the force; its reciprocal is a directional apparent mass when positive. At a straight or folded two-link posture, the tool point has only one instantaneous velocity direction and the response ellipse collapses to a line. The full joint mass matrix remains SPD.",
      "caption": "Push in a selected direction and compare the force with the tool's response acceleration. A separate plot shows the force-response ellipse on explicit acceleration axes. Near a straight arm the response becomes thin; at exact rank loss the task-space inverse is undefined. The view preserves that distinction instead of imposing a numerical rank cutoff.",
      "scope": "The displayed task is the Cartesian position of the actual tool point of the two uniform rods. Its Jacobian is not simply the lower block of a space-twist Jacobian. The force-response ellipse isolates the bias-compensated response; the readout also accounts for uncompensated gravity and velocity bias when present. The stated inverse formula assumes square invertible J. At rank loss no pseudoinverse is relabeled as an ordinary mass; tiny positive mobility retains its sign/magnitude status.",
      "links": {
        "Modern Robotics · task-space dynamics": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=318"
      },
      "viz": lesson6
    },
    {
      "num": "6.7",
      "kind": "Concept",
      "name": "Gearing and reflected inertia",
      "deps": [
        "robot-6.3"
      ],
      "refs": [
        "Lynch–Park §8.9, printed pp.311–315 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "For an ideal gear with signed relative speed relation $\\omega_m=sN\\dot q$ and rotor inertia $J_m$, the rotor kinetic energy contributes\n$$T_m=\\tfrac12J_mN^2\\dot q^2.$$\nThus the reflected inertia about the output coordinate is $J_mN^2$. Ideal relative-motion power gives $\\tau_q=sN\\tau_m$. On a moving parent link, the rotor's absolute angular velocity must include that parent's motion; assigning only a diagonal $N^2J_m$ term can then omit real coupling.",
      "idea": "Insert the actual rotor speed into its kinetic energy, then take the Hessian with respect to joint velocities. With two remote ground-mounted ideal drives, the added mass matrix is diagonal. With rotor2's housing fixed to link1, its absolute planar speed is $\\dot q_1+sN_2\\dot q_2$, so its energy adds a constant $J_{m2}$ to M11, a signed $sJ_{m2}N_2$ to each off-diagonal entry and $J_{m2}N_2^2$ to M22. Rotor1 adds $J_{m1}N_1^2$ to M11. The added matrices model axial rotor spin only. This idealization neglects localized motor/stator translation and transverse rotor inertia; a physical geared robot needs those additional spatial-inertia terms. When both positive rotor inertias dominate at large gear ratios, the normalized off-diagonal coupling becomes small. That is a relative approximation, not exact decoupling at every ratio.",
      "caption": "Raise the ideal gear ratios and compare the reflected rotor inertia with the rod inertia. Switch the rotor mounting and gear sense to expose the extra coupling caused by a moving motor housing. Speed and torque obey the same signed power relation; the transmission drawing is schematic rather than a tooth-count model.",
      "scope": "Massless ideal transmissions, positive gear ratios and separately selectable transmission sense, no friction, electrical loss, backlash or compliance. Ground-mounted mode explicitly represents remote drives. Link-mounted mode includes the planar parent rotation of rotor2. The original rods retain their stated uniform mass distribution. Additional localized motor/stator mass, translation and transverse rotor inertia are excluded; the added elements represent axial spin only. Higher ratio also reduces available output speed for a fixed motor speed; the inertia plot alone is not a motor-performance or efficiency claim.",
      "links": {
        "Modern Robotics · gearing and apparent inertia": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=331"
      },
      "viz": lesson7
    },
    {
      "num": "6.8",
      "kind": "Phenomenon",
      "name": "Coriolis and centripetal coupling between joints",
      "deps": [
        "robot-6.2",
        "mech-9.8"
      ],
      "refs": [
        "Lynch–Park §8.1, printed pp.271–275 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "Joint-coordinate accelerations contain velocity-product terms even when the joint accelerations are zero. In the uniform-rod two-link model, with $h=D\\sin q_2$ and $D=m_2l_1l_2/2$,\n$$\\begin{aligned}c_1&=-h(2\\dot q_1\\dot q_2+\\dot q_2^2),\\\\c_2&=h\\dot q_1^2.\\end{aligned}$$\nThe mixed-rate contribution is called Coriolis coupling; squared-rate contributions are centripetal terms. Their signs depend on posture and direction, so the matrix is not a set of independent constant joint inertias.",
      "idea": "Each point of link2 has an acceleration containing the squared absolute link rate $(\\dot q_1+\\dot q_2)^2$. Expanding it produces the mixed term as well as the two squared terms. Integrating moments of these accelerations along the rods gives c. For a force-driven example, set gravity to zero, command the shoulder's constant speed $\\dot q_1=\\Omega$ and turn off the elbow motor. The elbow equation reduces to\n$$\\ddot q_2=-\\frac{D}{B}\\Omega^2\\sin q_2,$$\nwith B the elbow inertia. Starting from a bent arm and zero relative elbow rate, it swings toward extension and can oscillate through it. A bounded RK4 integration supplies the displayed motion and is checked against an independent Jacobi-elliptic solution. The shoulder actuator generally supplies torque to maintain its speed, so the arm's total kinetic energy need not be constant.",
      "caption": "The shoulder speed is controlled while the elbow motor is off and gravity is absent. Scrub actual time to see the released forearm move, then compare its relative angle with the separate velocity-product torque terms. Reversing shoulder speed preserves the elbow's relative equation, while the shoulder's torque and power still reflect the full coupled motion.",
      "scope": "An ideal two-rod arm, gravity off, constant shoulder speed supplied by an active actuator and initial elbow rate zero. The initial bend is between5° and150° with either sign; no impacts, stops or friction are modeled. This is an actual solved initial-value problem, unlike the prescribed inverse-dynamics cycle. Its relative pendulum invariant is distinct from total arm kinetic energy. RK4 is approximate with a bounded dimensionless step; short-time retained-factor series prevents tiny motion from becoming artificial exact rest.",
      "links": {
        "Modern Robotics · velocity-product coupling": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=291"
      },
      "viz": lesson8
    },
    {
      "num": "6.9",
      "kind": "Method",
      "name": "Constrained dynamics",
      "deps": [
        "robot-6.2",
        "mech-6.13"
      ],
      "refs": [
        "Lynch–Park §8.7, printed pp.299–305 (Dec.2019 preprint; actual selected body read)"
      ],
      "statement": "At a regular frictionless contact, let $f(x)\\ge0$ be the allowed gap and n the unit normal into the allowed side. With $G=n^{\\mathsf T}J$ and wall-on-robot reaction $\\lambda n$,\n$$\\begin{aligned}M\\ddot q+c+g&=\\tau+G^{\\mathsf T}\\lambda,\\\\G\\dot q&=0,\\\\G\\ddot q+\\dot G\\dot q&=0.\\end{aligned}$$\nFor positive normal mobility $a_n=GM^{-1}G^{\\mathsf T}$, write the free normal acceleration as b. The required reaction is $\\lambda_{\\rm req}=-b/a_n$. A unilateral wall can sustain it only when $\\lambda_{\\rm req}\\ge0$; otherwise the arm detaches.",
      "idea": "First compute the free joint acceleration from the applied torques. A reaction adds $M^{-1}G^{\\mathsf T}\\lambda$. Substitute that correction into the differentiated contact constraint to solve its single scalar unknown. A compatible tangent joint velocity is chosen explicitly, so the normal contact power is $\\lambda G\\dot q=0$. A bilateral frictionless guide may have a signed reaction; a wall may push but cannot pull. Removing the wall restores the actual free acceleration at the same state. If G vanishes, its normal mobility is zero and this elimination cannot select a unique force. The differentiated constraint may even be incompatible with the chosen instantaneous motion. Report that degeneracy instead of dividing by zero or silently replacing the problem with a regular contact.",
      "caption": "Compare the same arm state with a pushing wall, a bilateral guide or no contact. The wall line passes through the actual tool point, and its reaction is normal to that line. Separate equal-scale acceleration views show what contact removes. A pulling required force detaches the unilateral wall; a degenerate normal has an explicit undefined-force state.",
      "scope": "An instantaneous planar contact calculation with a fixed straight boundary through the selected tool point and compatible initial normal velocity. The view does not integrate a sliding trajectory or resolve impacts; changing posture selects a new local boundary. The wall normal points into its allowed side and lambda is force on the robot, opposite to the source's robot-on-environment multiplier convention. No friction or penetration penalty is used. Rank-degenerate cases are reported rather than regularized.",
      "links": {
        "Modern Robotics · constrained dynamics": "https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf#page=319"
      },
      "viz": lesson9
    }
  ]
};
