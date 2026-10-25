// Syllabus — Robotics (curated course; see collection.js for references)
//
// Sources consulted (2026-10):
//   Lynch & Park, Modern Robotics — chapter list and section-numbered video index:
//     https://hades.mech.northwestern.edu/index.php/Modern_Robotics
//     https://modernrobotics.northwestern.edu/nu-gm-book-resource/foundations-of-robot-motion/
//   Siciliano, Sciavicco, Villani & Oriolo, Robotics: Modelling, Planning and Control — 12-chapter structure
//     (Springer / MathWorks book pages); cited at chapter level only.
//   Stanford CS223A Introduction to Robotics (Khatib) schedule: https://cs.stanford.edu/groups/manips/teaching/cs223a/
//   MIT 6.4210 Robotic Manipulation (Tedrake) contents: https://manipulation.csail.mit.edu/
//   Wikipedia: "Denavit–Hartenberg parameters", "Chasles' theorem (kinematics)", "Rapidly exploring random tree",
//     "Probabilistic roadmap", "Chow–Rashevskii theorem", "Brockett's theorem"-related pages, "Form closure"/"Force closure".
// Gaps filled after comparison: closed chains, single-rigid-body (spatial) dynamics, operational-space control,
//   omnidirectional wheels, the meter-stick trick, visual servoing, point-cloud registration (ICP).
// Deliberate omissions: deep perception and learning-based manipulation (→ deep, ml), actuator/sensor hardware
//   details, soft robotics.
// Landmark papers (kind 'Paper', Oct 2026): each citation was checked against its Crossref record (api.crossref.org/works/<doi>)
// or, without a DOI, against the cited record (NASA NTRS, Google Patents, Euler Archive, Smithsonian Libraries).
export default {
  collection: 'robot',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Configuration space',
      summary: String.raw`A robot's configuration is the list of numbers that pins down where every part of it is, and the set of all configurations — the C-space — has a dimension and a shape. Grübler's formula counts degrees of freedom of mechanisms from their joints, the topology of C-space explains why a two-link arm lives on a torus, and constraints split into those that reduce the dimension and those that only limit velocities.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Degrees of freedom of a rigid body', deps: ['mech-6.1'], refs: ['Lynch–Park §2.1'],
          pic: 'Pin points of a rigid body one at a time: each pinned point removes coordinates, leaving 3 degrees of freedom in the plane and 6 in space, counted live.' },
        { num: '1.2', kind: 'Theorem', name: 'Grübler’s formula', deps: ['robot-1.1', 'pma-9.28'], refs: ['Lynch–Park §2.2'],
          pic: 'Assemble links and joints into a planar mechanism: the mobility count from Grübler’s formula is shown and checked by dragging the mechanism; a four-bar linkage has one degree of freedom, a five-bar two.' },
        { num: '1.3', kind: 'Definition', name: 'Topology of configuration space', deps: ['robot-1.1', 'mech-6.1'], refs: ['Lynch–Park §2.3'],
          pic: 'The two joint angles of a 2R arm are mapped onto a square whose opposite edges glue into a torus; moving the arm draws a path on the torus, and wrapping past 360° crosses the glued seam.' },
        { num: '1.4', kind: 'Definition', name: 'Holonomic and nonholonomic constraints', deps: ['mech-6.3', 'robot-1.3'], refs: ['Lynch–Park §2.4'],
          pic: 'A coin rolling on a table cannot slide sideways at any instant, yet by rolling and turning it reaches any position and heading — the velocity constraint does not shrink the space of configurations.' },
        { num: '1.5', kind: 'Definition', name: 'Task space and workspace', deps: ['robot-1.3'], refs: ['Lynch–Park §2.5'],
          pic: 'Sweep a 2R arm through all joint angles: its reachable workspace is an annulus, and the dexterous workspace where any orientation is possible shrinks to nothing as a third link is added and removed.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Rigid-body motions',
      summary: String.raw`Rotations form the group SO(3) and rigid motions the group SE(3), and both are best understood through their exponential coordinates: every rotation is a turn about some axis, every rigid motion a screw. Angular velocities and twists live in the corresponding Lie algebras, wrenches are their dual, and the adjoint map changes the frame in which they are expressed. These tools make the rest of robotics a matter of matrix multiplication.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Rotation matrices and SO(3)', deps: ['ladr-7.44', 'mech-10.1'], refs: ['Lynch–Park §3.2'],
          pic: 'Rotate a 3D body frame with a trackball: its axes are the columns of the rotation matrix, which stays orthogonal with determinant +1, and composing two rotations multiplies the matrices.' },
        { num: '2.2', kind: 'Definition', name: 'Angular velocity and skew-symmetric matrices', deps: ['robot-2.1', 'mech-9.4'], refs: ['Lynch–Park §3.2'],
          pic: 'A spinning body’s angular velocity vector is drawn along its instantaneous axis; the skew-symmetric matrix built from it maps any body point to its velocity, verified by arrows on marked points.' },
        { num: '2.3', kind: 'Theorem', name: 'Exponential coordinates and Rodrigues’ formula', deps: ['robot-2.2', 'mech-10.1'], refs: ['Lynch–Park §3.2'],
          pic: 'Choose an axis and an angle: the rotation e^{[ω]θ} computed by Rodrigues’ formula turns the body about that axis, and the matrix logarithm recovers the axis–angle from any rotation.' },
        { num: '2.4', kind: 'Phenomenon', name: 'Euler angles and gimbal lock', deps: ['robot-2.1', 'mech-10.15'], refs: ['Lynch–Park App. B'],
          pic: 'Drive three nested gimbals with roll, pitch and yaw sliders: when the middle gimbal reaches 90° two rings align and one direction of rotation becomes unreachable without large angle jumps.' },
        { num: '2.5', kind: 'Definition', name: 'Unit quaternions', deps: ['robot-2.3'], refs: ['Lynch–Park App. B'],
          pic: 'A rotation is shown as a point on a 3-sphere projected to 3D; interpolating between two orientations along the great circle (slerp) gives smooth constant-speed motion, unlike linear interpolation of Euler angles.' },
        { num: '2.6', kind: 'Definition', name: 'Homogeneous transformations and SE(3)', deps: ['robot-2.1', 'ladr-3.43'], refs: ['Lynch–Park §3.3'],
          pic: 'Chain frames on a drawn robot: each 4×4 matrix combines a rotation and a translation, and the product maps coordinates from the tool frame back to the base frame.' },
        { num: '2.7', kind: 'Definition', name: 'Twists', deps: ['robot-2.6', 'robot-2.2'], refs: ['Lynch–Park §3.3'],
          pic: 'A body moving in space is given a twist (angular plus linear velocity): the velocity field of all its points is drawn, and the twist expressed in two different frames is compared.' },
        { num: '2.8', alias: 'mech-10.19', name: 'Chasles–Mozzi: every rigid motion is a screw motion' },
        { num: '2.9', kind: 'Definition', name: 'The adjoint map: changing frames for twists', deps: ['robot-2.7', 'ladr-3.43'], refs: ['Lynch–Park §3.3'],
          pic: 'Express the same twist in a fixed frame and a body frame: the 6×6 adjoint matrix converts one to the other, and the two velocity fields drawn from them coincide.' },
        { num: '2.10', kind: 'Definition', name: 'Wrenches and the power pairing', deps: ['robot-2.7', 'mech-2.8', 'ladr-7.1'], refs: ['Lynch–Park §3.4'],
          pic: 'Apply a force at a point on a body: the wrench combines it with the moment about the frame origin, and the power delivered — wrench dotted with twist — is the same in every frame.' },
        { num: '2.11', kind: 'Phenomenon', name: 'Rotations do not commute', deps: ['robot-2.1'], refs: ['Lynch–Park §3.2'],
          pic: 'Apply a 90° roll then a 90° pitch to a book, and then the reverse order: the final orientations differ, and small rotations commute only up to second order, shown by shrinking the angles.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Forward kinematics and closed chains',
      summary: String.raw`Forward kinematics computes where the end-effector is from the joint values. The product-of-exponentials formula does this with one screw axis per joint and no fuss about frame conventions, while Denavit–Hartenberg parameters give the classical four-number description. Closed chains such as the Stewart platform reverse the difficulty: their inverse kinematics is easy and their forward kinematics hard.`,
      items: [
        { num: '3.1', kind: 'Theorem', name: 'Product-of-exponentials formula', deps: ['robot-2.8', 'robot-2.6'], refs: ['Lynch–Park §4.1'],
          pic: 'Each joint’s screw axis is drawn on a robot at its home pose; moving the joint sliders applies the exponentials in order, and the end-effector frame matches the geometrically assembled arm.' },
        { num: '3.2', kind: 'Method', name: 'Denavit–Hartenberg parameters', deps: ['robot-2.6'], refs: ['Lynch–Park App. C', 'Siciliano ch. 2'],
          pic: 'Attach frames to each link following the DH rules: the four parameters per joint are read off a table, and the resulting transforms reproduce the product-of-exponentials pose.' },
        { num: '3.3', kind: 'Model', name: 'Planar 2R and 3R arms', deps: ['robot-3.1'], refs: ['Lynch–Park §4.1'],
          pic: 'Drag the joint angles of a planar arm: the tool position is traced out, and the readout compares the closed-form formula with the matrix product.' },
        { num: '3.4', kind: 'Model', name: 'The six-axis arm with a spherical wrist', deps: ['robot-3.1'], refs: ['Lynch–Park §4.1', 'Siciliano ch. 2'],
          pic: 'An industrial arm whose last three axes meet at a point: position is set by the first three joints and orientation by the wrist, shown by moving each group separately.' },
        { num: '3.5', kind: 'Model', name: 'Closed chains and the Stewart–Gough platform', deps: ['robot-1.2', 'robot-2.6'], refs: ['Lynch–Park ch. 7'],
          pic: 'Set the platform pose and the six leg lengths follow immediately; set the leg lengths instead and a numerical solver finds one of several possible platform poses, shown as ghost images.' },
        { num: '3.6', kind: 'Phenomenon', name: 'Singularities of closed chains', deps: ['robot-3.5'], refs: ['Lynch–Park ch. 7'],
          pic: 'Drive a planar five-bar mechanism toward an aligned configuration: it suddenly gains an uncontrollable wobble with the actuators locked, or loses the ability to move in a direction.' },
        { num: '3.7', kind: 'Paper', name: 'A Kinematic Notation for Lower-Pair Mechanisms',
          paper: { authors: 'J. Denavit and R. S. Hartenberg', year: 1955, title: 'A Kinematic Notation for Lower-Pair Mechanisms Based on Matrices',
                   venue: 'Journal of Applied Mechanics 22 (2): 215–221', doi: '10.1115/1.4011045' },
          introduces: ['robot-3.2'], deps: ['robot-2.6', 'robot-1.2'], refs: ['Denavit & Hartenberg 1955, original pp.215–221; Eq.(6) p.219'],
          pic: 'Edit four saved modern DH rows, compare classical and modified frames plus the fixed tool, and verify the reordered 1955 matrix with its opposite signed twist.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Velocity kinematics and statics',
      summary: String.raw`The Jacobian maps joint velocities to end-effector twists, and its transpose maps end-effector wrenches back to joint torques — the same matrix governs motion and force. Where the Jacobian loses rank the robot is singular: it cannot move in some direction and can resist infinite force in it. The singular value decomposition of the Jacobian turns these facts into ellipsoids that show at a glance how easily the robot moves and pushes.`,
      items: [
        { num: '4.1', kind: 'Definition', name: 'The manipulator Jacobian (space and body)', deps: ['robot-3.1', 'pma-9.17', 'pma-9.15'], refs: ['Lynch–Park §5.1', 'Siciliano ch. 3'],
          pic: 'Wiggle each joint of an arm in turn: the resulting end-effector velocity is a column of the Jacobian, drawn as an arrow, and any joint-velocity mix gives the matching combination of arrows.' },
        { num: '4.2', kind: 'Theorem', name: 'Statics: τ = Jᵀ F', deps: ['robot-4.1', 'robot-2.10', 'mech-6.4', 'ladr-7.1'], refs: ['Lynch–Park §5.2'],
          pic: 'Push on the end-effector with a draggable force: the joint torques needed to hold it are shown as bars, computed from the transposed Jacobian and checked by virtual work.' },
        { num: '4.3', kind: 'Definition', name: 'Kinematic singularities', deps: ['robot-4.1', 'ladr-3.21', 'ladr-9.50'], refs: ['Lynch–Park §5.3'],
          pic: 'Stretch a 2R arm out straight: the determinant of the Jacobian falls to zero, the two velocity columns become parallel, and the tool can no longer move radially.' },
        { num: '4.4', kind: 'Phenomenon', name: 'Wrist, elbow and shoulder singularities', deps: ['robot-4.3', 'robot-3.4'], refs: ['Lynch–Park §5.3'],
          pic: 'Drive a six-axis arm along a straight line through a wrist singularity: two wrist joints spin wildly as the line is followed, plotted as joint speeds spiking.' },
        { num: '4.5', kind: 'Definition', name: 'Manipulability ellipsoid', deps: ['robot-4.1', 'ladr-7.70'], refs: ['Lynch–Park §5.4'],
          pic: 'Unit joint velocities map to an ellipse of end-effector velocities whose axes come from the SVD of the Jacobian; dragging the arm toward a singularity flattens the ellipse to a line.' },
        { num: '4.6', kind: 'Definition', name: 'Force ellipsoid and motion–force duality', deps: ['robot-4.5', 'robot-4.2', 'ladr-7.29', 'ladr-6.14'], refs: ['Lynch–Park §5.4'],
          pic: 'The force ellipse is drawn beside the velocity ellipse: where the arm moves easily it pushes weakly, and the two ellipses’ axes are reciprocal.' },
        { num: '4.7', kind: 'Definition', name: 'Manipulability measures', deps: ['robot-4.5'], refs: ['Lynch–Park §5.4'],
          pic: 'Colour the workspace of a 2R arm by manipulability (product of singular values, condition number): the best postures form a band where the elbow is near 90°.' },
        { num: '4.8', kind: 'Concept', name: 'Redundancy and null-space self-motion', deps: ['robot-4.1', 'ladr-3.21', 'pma-9.28'], refs: ['Lynch–Park §6.3', 'Siciliano ch. 3'],
          pic: 'A planar 3R arm holds its tool fixed while its elbow sweeps through a family of postures — motion in the null space of the Jacobian.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Inverse kinematics',
      summary: String.raw`Inverse kinematics asks for joint values that put the tool at a desired pose. Simple arms have closed-form solutions, usually several of them, while general robots need numerical iteration built on the Jacobian. Damped least squares, the pseudoinverse and heuristic methods trade accuracy, speed and robustness near singularities.`,
      items: [
        {"num": "5.1", "kind": "Method", "name": "Analytic IK of the 2R arm: elbow up and down", "deps": ["robot-3.3"], "refs": ["Lynch–Park, Modern Robotics, Dec.2019 updated first-edition preprint, Chapter6 introduction, printed pp.217–219"], "pic": "Drag the orange target and change the second link length. The two computed arms reach the same point inside the annulus and disappear outside it. Set the target to the origin with equal links to reveal the free folded direction."},
        {"num": "5.2", "kind": "Method", "name": "Numerical IK by Newton–Raphson", "deps": ["robot-4.1", "pma-9.24", "pma-9.15", "pma-5.15"], "refs": ["Lynch–Park, Modern Robotics, Dec.2019 updated first-edition preprint, §6.2.1, printed pp.225–228"], "pic": "Change the target, initial shoulder/elbow angles and iteration cap. Ghost endpoints show the actual Newton sequence; the final arm and error chart use the computed states. A singular initial guess or an unreachable target exposes a failure rather than a fabricated solution."},
        {"num": "5.3", "kind": "Method", "name": "Pseudoinverse and resolved-rate control", "deps": ["robot-4.8", "ladr-6.68", "ladr-7.75"], "refs": ["Lynch–Park, Modern Robotics, Dec.2019 updated first-edition preprint, §§6.2–6.3, printed pp.227–232"], "pic": "Use a three-link planar arm, command a tool velocity and vary a null-space proposal. The bars show computed joint speeds divided by the displayed live scale; the command and achieved velocity share a separate velocity plane. The readout compares the minimum-norm solution with the added self-motion and checks the numerical null residual."},
        {"num": "5.4", "kind": "Method", "name": "Jacobian transpose and damped least squares", "deps": ["robot-5.2", "robot-4.3", "ladr-7.70", "pma-9.15"], "refs": ["Buss, Introduction to Inverse Kinematics (2009), §§3 and5, printed pp.7 and9–10; regularized equations (10)–(11)"], "pic": "Start a two-link arm close to straight and compare the three actual iteration traces. The selected method determines the displayed final arm. Increase damping or the transpose gain and watch the tradeoff in error and joint corrections; exact numerical singularity stops the plain Newton solver."},
        {"num": "5.5", "kind": "Phenomenon", "name": "Multiple IK solutions: up to 16 for a 6R arm", "deps": ["robot-5.1", "robot-3.4"], "refs": ["Lynch–Park, Modern Robotics, Dec.2019 updated first-edition preprint, §§6.1 and6.7, printed pp.219–223 and234", "Manocha–Canny, IEEE Transactions on Robotics and Automation10(5),648–657 (1994), §§I–II.B andIV; printed pp.648–650 and652"], "pic": "Rotate the view and choose a computed joint branch. The widget solves a declared special 6R arm with up to eight branches; the table lists branch index and shoulder, elbow and wrist-bend angles. Different joint configurations can share the same link centerlines. Singular modes show representatives and preserve actual pose residuals."},
        {"num": "5.6", "kind": "Method", "name": "Cyclic coordinate descent and FABRIK", "deps": ["robot-3.3"], "refs": ["Aristidou–Lasenby, Graphical Models73(5),243–260 (2011), §2 CCD discussion and §4 Algorithm1, printed pp.244–246; planar CCD minimization supplied here"], "pic": "Drag the target, select CCD or FABRIK and change the initial shape and sweep cap. The chart records completed sweeps, including a final partial CCD sweep if it converges early. For FABRIK, inspect the first tip-fixed pass to see why zero tip error alone is insufficient when the base has moved."},
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      "n": 6,
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
          "pic": "Rotate the view and scrub time. In free motion, the ellipsoid changes orientation around a fixed spatial angular momentum; angular velocity need not point along it. Switch to the specified coaxial wrench to see rotational and translational work enter the body. The body view follows the COM, while its displacement is reported separately."
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
          "pic": "Follow a prescribed two-link motion and read the two torque ledgers. For each joint, the inertial, velocity-product and gravity terms add to the required actuator torque. COM markers and equal horizontal/vertical geometry scales make the mass distribution explicit. Changing gravity changes the required torque while the prescribed path stays the same."
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
          "pic": "Change the elbow angle and watch the fixed-energy contour change shape in joint-velocity space. The selected direction picks a velocity on the contour; its kinetic energy is evaluated from the actual matrix. A straight tool posture can lose Cartesian mobility while its joint-space mass matrix stays positive definite."
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
          "pic": "Scrub the same prescribed arm cycle and compare mechanical-energy rate with actuator power. The velocity-product power and half the mass-rate quadratic form cancel. A separate ledger shows their signed sizes, so the zero identity is not produced by hiding small numbers on a chart."
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
          "pic": "Advance the computational step: velocity and acceleration information travels from base to tool, then force and moment information returns toward the base. The physical arm state stays fixed during a sweep. Each final torque is compared with the independently derived Lagrange torque for the same state."
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
          "pic": "Push in a selected direction and compare the force with the tool's response acceleration. A separate plot shows the force-response ellipse on explicit acceleration axes. Near a straight arm the response becomes thin; at exact rank loss the task-space inverse is undefined. The view preserves that distinction instead of imposing a numerical rank cutoff."
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
          "pic": "Raise the ideal gear ratios and compare the reflected rotor inertia with the rod inertia. Switch the rotor mounting and gear sense to expose the extra coupling caused by a moving motor housing. Speed and torque obey the same signed power relation; the transmission drawing is schematic rather than a tooth-count model."
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
          "pic": "The shoulder speed is controlled while the elbow motor is off and gravity is absent. Scrub actual time to see the released forearm move, then compare its relative angle with the separate velocity-product torque terms. Reversing shoulder speed preserves the elbow's relative equation, while the shoulder's torque and power still reflect the full coupled motion."
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
          "pic": "Compare the same arm state with a pushing wall, a bilateral guide or no contact. The wall line passes through the actual tool point, and its reaction is normal to that line. Separate equal-scale acceleration views show what contact removes. A pulling required force detaches the unilateral wall; a degenerate normal has an explicit undefined-force state."
        }
      ]
    },

    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Trajectory generation and motion planning',
      summary: String.raw`A trajectory is a path plus a timing law, chosen to be smooth and to respect actuator limits. Motion planning finds a collision-free path in the first place, a problem that is provably hard in general but practically solved by graph search on grids, potential fields, and above all by sampling: probabilistic roadmaps and rapidly-exploring random trees explore high-dimensional configuration spaces by random probing.`,
      items: [
        { num: '7.1', kind: 'Method', name: 'Cubic and quintic time scaling', deps: ['robot-3.3'], refs: ['Lynch–Park §9.2', 'Siciliano ch. 4'],
          pic: 'Move a joint between two angles in a set time: cubic scaling gives zero velocity at the ends, quintic adds zero acceleration, and the velocity, acceleration and jerk profiles are plotted.' },
        { num: '7.2', kind: 'Method', name: 'Trapezoidal velocity profiles', deps: ['robot-7.1'], refs: ['Lynch–Park §9.2'],
          pic: 'Set a maximum velocity and acceleration: the motion accelerates, coasts and decelerates, and lowering the limits stretches the profile into a triangle.' },
        { num: '7.3', kind: 'Method', name: 'Via points and spline trajectories', deps: ['robot-7.1'], refs: ['Lynch–Park §9.3'],
          pic: 'Drag via points for the tool to pass through: piecewise cubic polynomials connect them with continuous velocity, and moving one point changes only nearby segments.' },
        { num: '7.4', kind: 'Method', name: 'Time-optimal time scaling along a path', deps: ['robot-7.2', 'robot-6.2'], refs: ['Lynch–Park §9.4'],
          pic: 'Along a fixed path for a two-link arm, the phase plane of path position and speed shows the velocity limit curve; the fastest profile accelerates and brakes alternately, touching it at switch points.' },
        { num: '7.5', kind: 'Method', name: 'Minimum-jerk trajectories', deps: ['robot-7.1', 'mech-5.4'], refs: ['Lynch–Park §9.2'],
          pic: 'A reaching motion that minimises integrated squared jerk has a bell-shaped speed profile; it is overlaid on recorded human reaching data.' },
        { num: '7.6', kind: 'Definition', name: 'Configuration-space obstacles', deps: ['robot-1.3'], refs: ['Lynch–Park §10.2'],
          pic: 'Place obstacles in the workspace of a 2R arm: the corresponding forbidden regions are painted on the joint-angle torus, and dragging the arm shows collisions exactly when its point enters them.' },
        { num: '7.7', kind: 'Algorithm', name: 'Grid search with A*', deps: ['robot-7.6', 'algo-9.12'], refs: ['Lynch–Park §10.4'],
          pic: 'A* expands cells of a discretised C-space from start toward goal guided by a heuristic; the frontier, closed set and final path are animated, and coarsening the grid loses the narrow route.' },
        { num: '7.8', kind: 'Method', name: 'Visibility graphs and shortest paths among polygons', deps: ['robot-7.6', 'algo-9.8'], refs: ['Lynch–Park §10.3'],
          pic: 'Among polygonal obstacles the shortest path hugs their corners; the visibility graph of mutually visible vertices is drawn and Dijkstra finds the route through it.' },
        { num: '7.9', kind: 'Method', name: 'Virtual potential fields and local minima', deps: ['robot-7.6', 'vcalc-2.7'], refs: ['Lynch–Park §10.6'],
          pic: 'A robot descends a potential with an attractive goal and repulsive obstacles: it slides smoothly around a round obstacle but gets stuck in the pocket of a U-shaped one.' },
        { num: '7.10', kind: 'Theorem', name: 'Navigation functions', deps: ['robot-7.9'], refs: ['Lynch–Park §10.6'],
          pic: 'In a sphere world, a navigation function with a tuned exponent has only one minimum, at the goal; lowering the exponent brings back spurious minima, shown on the contour plot.' },
        { num: '7.11', kind: 'Algorithm', name: 'Probabilistic roadmaps (PRM)', deps: ['robot-7.6'], refs: ['Lynch–Park §10.5'],
          pic: 'Random collision-free configurations are sampled and linked to near neighbours by straight segments; queries are answered by graph search on the growing roadmap.' },
        { num: '7.12', kind: 'Algorithm', name: 'Rapidly-exploring random trees (RRT)', deps: ['robot-7.6'], refs: ['Lynch–Park §10.5'],
          pic: 'A tree grows from the start by repeatedly stepping its nearest node toward a random sample; it is pulled into large unexplored regions (its Voronoi bias) and soon reaches the goal.' },
        { num: '7.13', kind: 'Theorem', name: 'Probabilistic completeness of sampling planners', deps: ['robot-7.11', 'robot-7.12'], refs: ['Lynch–Park §10.5'],
          pic: 'Run the planner many times on a maze: the fraction of runs that have found a path is plotted against the number of samples and climbs toward one.' },
        { num: '7.14', kind: 'Algorithm', name: 'RRT* and asymptotic optimality', deps: ['robot-7.12'], refs: ['Lynch–Park §10.5'],
          pic: 'Next to plain RRT, RRT* rewires its tree as it grows: its path to the goal straightens and its length decreases toward the optimum, while RRT’s path stays jagged.' },
        { num: '7.15', kind: 'Phenomenon', name: 'The narrow-passage problem', deps: ['robot-7.11'], refs: ['Lynch–Park §10.5'],
          pic: 'Narrow the gap between two rooms: the number of samples needed to find a path grows rapidly, while bridge sampling near obstacles helps.' },
        { num: '7.16', kind: 'Theorem', name: 'The piano mover’s problem is PSPACE-hard', deps: ['robot-7.6', 'algo-14.4'], refs: ['Lynch–Park §10.3'],
          pic: 'Many movable blocks in a sliding puzzle form a C-space whose dimension grows with the number of blocks; planning time for exact search explodes as blocks are added.' },
        { num: '7.17', kind: 'Method', name: 'Trajectory optimisation', deps: ['robot-7.9', 'robot-7.1', 'vcalc-2.9'], refs: ['Lynch–Park §10.7'],
          pic: 'An initial straight path through obstacles is iteratively bent by gradients of a cost combining smoothness and clearance, until it threads the gaps.' },
        { num: '7.18', kind: 'Paper', name: 'Spatial Planning: A Configuration Space Approach',
          paper: { authors: 'Tomás Lozano-Pérez', year: 1983, title: 'Spatial Planning: A Configuration Space Approach',
                   venue: 'IEEE Transactions on Computers C-32 (2): 108–120', doi: '10.1109/TC.1983.1676196' },
          introduces: ['robot-7.6', 'cg-3.8'], deps: ['robot-1.3', 'robot-7.8'], refs: [],
          pic: 'Drag a polygonal robot among polygonal obstacles: each obstacle grows into its configuration-space obstacle while the robot shrinks to a point, a shortest path is found on the visibility graph, and rotating the robot slices through the three-dimensional C-space.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Robot control',
      summary: String.raw`Controlling a robot means producing joint torques that make it follow a trajectory or apply a force. Simple PD control with gravity compensation is provably stable thanks to the passivity of the dynamics, and computed-torque control cancels the nonlinear dynamics to leave a linear error equation. For contact tasks, force, hybrid and impedance control regulate how the robot pushes and yields; visual servoing closes the loop through a camera.`,
      items: [
        { num: '8.1', kind: 'Method', name: 'PD control with gravity compensation', deps: ['robot-6.2', 'ctrl-5.4'], refs: ['Lynch–Park §11.4', 'Siciliano ch. 8'],
          pic: 'Hold a two-link arm at a target with PD gains alone: it sags under gravity; switch on gravity compensation and it settles exactly on target.' },
        { num: '8.2', kind: 'Theorem', name: 'Stability of PD plus gravity compensation', deps: ['robot-8.1', 'robot-6.4', 'ctrl-3.8'], refs: ['Siciliano ch. 8'],
          pic: 'The energy-like Lyapunov function (kinetic energy plus spring energy of the PD gains) is plotted during a disturbed motion and only ever decreases, as LaSalle’s principle requires.' },
        { num: '8.3', kind: 'Method', name: 'Computed-torque control', deps: ['robot-6.2', 'ctrl-13.4'], refs: ['Lynch–Park §11.4', 'Siciliano ch. 8'],
          pic: 'Track a fast figure-eight with PD and with computed torque: the latter’s error decays like a linear second-order system, until the model’s link masses are mis-set by a slider.' },
        { num: '8.4', kind: 'Method', name: 'Operational-space control', deps: ['robot-6.6', 'robot-8.3'], refs: ['Lynch–Park §11.4'],
          pic: 'Command the tool to move along a straight line with chosen stiffness: torques computed in task space make the tool respond identically in every posture, unlike joint-space PD.' },
        { num: '8.5', kind: 'Method', name: 'Force control', deps: ['robot-4.2', 'robot-8.1'], refs: ['Lynch–Park §11.5', 'Siciliano ch. 9'],
          pic: 'Press a tool against a surface with a commanded force: the force error is regulated with integral action, and the contact stiffness slider shows when the loop becomes oscillatory.' },
        { num: '8.6', kind: 'Method', name: 'Hybrid motion–force control', deps: ['robot-8.5', 'robot-6.9'], refs: ['Lynch–Park §11.6'],
          pic: 'Wipe a table: motion is controlled along the surface and force normal to it, with the two subspaces drawn as arrows and the controller switching roles at a corner.' },
        { num: '8.7', kind: 'Method', name: 'Impedance control', deps: ['robot-6.6', 'robot-8.1'], refs: ['Lynch–Park §11.7', 'Siciliano ch. 9'],
          pic: 'Push the robot’s tool with the mouse: it responds like a programmable mass–spring–damper, and sliders change how stiff or compliant it feels.' },
        { num: '8.8', kind: 'Method', name: 'Visual servoing and the image Jacobian', deps: ['robot-4.1', 'ctrl-1.4'], refs: ['Siciliano ch. 10'],
          pic: 'A camera on the wrist sees four feature points; image-based servoing drives their projected positions to targets, and the camera’s 3D path is drawn alongside the straight image-plane paths.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Grasping and manipulation',
      summary: String.raw`To hold or manipulate an object, contacts must constrain its motion and transmit the right forces through friction. Form closure immobilises an object by geometry alone; force closure uses friction cones to resist any disturbance. The duality between motion freedoms and force freedoms organises the analysis, and simple puzzles such as the meter-stick trick show friction at work.`,
      items: [
        { num: '9.1', kind: 'Definition', name: 'Contact kinematics: rolling, sliding and breaking', deps: ['robot-2.7'], refs: ['Lynch–Park §12.1'],
          pic: 'Move a body touching a fixed finger: each candidate twist is classified as breaking, sliding or rolling contact, shown as coloured regions in the space of planar velocities.' },
        { num: '9.2', kind: 'Theorem', name: 'Form closure', deps: ['robot-9.1'], refs: ['Lynch–Park §12.1'],
          pic: 'Place frictionless point fingers around a polygon: the tool checks whether any motion is still possible, and at least four contacts are needed in the plane, seven in space.' },
        { num: '9.3', kind: 'Law', name: 'Coulomb friction cones', deps: ['robot-2.10', 'mech-1.15'], refs: ['Lynch–Park §12.2'],
          pic: 'At a contact, the allowed forces fill a cone whose half-angle is arctan μ; drag the applied force and see the contact stick inside the cone and slip on its boundary.' },
        { num: '9.4', kind: 'Theorem', name: 'Force closure', deps: ['robot-9.3', 'robot-9.2'], refs: ['Lynch–Park §12.2'],
          pic: 'Two frictional fingers on an object achieve force closure when the line between them lies inside both friction cones; drag the fingers and the test lights up or fails.' },
        { num: '9.5', kind: 'Concept', name: 'Duality of force and motion freedoms', deps: ['robot-9.4', 'robot-4.6'], refs: ['Lynch–Park §12.2'],
          pic: 'For a peg in a slot, the directions the peg can move and the directions the contacts can push are drawn as complementary subspaces whose dimensions add up to six.' },
        { num: '9.6', kind: 'Phenomenon', name: 'The meter-stick trick', deps: ['robot-9.3'], refs: ['Lynch–Park §12.3'],
          pic: 'Slide two fingers together under a meter stick: they alternate slipping and sticking because friction depends on load, and always meet at the centre of mass, as the simulation shows for any starting positions.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Mobile robots, localisation and mapping',
      summary: String.raw`Wheeled robots cannot move sideways, yet they can reach any pose — the geometry of Lie brackets explains how, and also why no smooth time-invariant feedback can park them. Shortest paths for car-like robots are concatenations of arcs and lines. Knowing where the robot is requires fusing odometry with sensing, which leads to probabilistic localisation and simultaneous localisation and mapping, and to registering point clouds against a map.`,
      items: [
        { num: '10.1', kind: 'Model', name: 'Omnidirectional wheeled robots', deps: ['robot-1.4', 'robot-2.7'], refs: ['Lynch–Park §13.2'],
          pic: 'A three-wheeled robot with mecanum or omni wheels translates sideways and spins at once; each wheel’s required speed is computed from the commanded twist and shown on the wheel.' },
        { num: '10.2', kind: 'Model', name: 'Unicycle and differential-drive kinematics', deps: ['robot-1.4'], refs: ['Lynch–Park §13.3', 'Siciliano ch. 11'],
          pic: 'Drive a differential-drive robot with two wheel-speed sliders: equal speeds go straight, opposite speeds spin in place, and the instantaneous centre of rotation is marked.' },
        { num: '10.3', kind: 'Theorem', name: 'Controllability via Lie brackets: parallel parking', deps: ['robot-10.2'], refs: ['Lynch–Park §13.3'],
          pic: 'Alternate small forward, turn, backward and counter-turn moves: the car ends up shifted sideways, the net motion matching the Lie bracket of the drive and steer vector fields.' },
        { num: '10.4', kind: 'Theorem', name: 'No smooth static feedback stabilises the unicycle', deps: ['robot-10.3', 'ctrl-3.6'], refs: ['Lynch–Park §13.3'],
          pic: 'Try a family of smooth feedback laws to park a unicycle at the origin: each fails from some starting poses, while a time-varying or discontinuous law succeeds.' },
        { num: '10.5', kind: 'Model', name: 'Dubins and Reeds–Shepp shortest paths', deps: ['robot-10.2'], refs: ['Lynch–Park §13.3'],
          pic: 'Drag start and goal poses for a car with a minimum turning radius: the shortest path made of arcs and straight segments is drawn, and allowing reverse gear shortens it.' },
        { num: '10.6', kind: 'Method', name: 'Path following: pure pursuit', deps: ['robot-10.2'], refs: ['Lynch–Park §13.3', 'Siciliano ch. 11'],
          pic: 'A robot chases a look-ahead point on a winding path: short look-ahead tracks tightly but oscillates, long look-ahead cuts corners, controlled by a slider.' },
        { num: '10.7', kind: 'Method', name: 'Odometry and dead-reckoning drift', deps: ['robot-10.2'], refs: ['Lynch–Park §13.4', 'Siciliano ch. 11'],
          pic: 'Integrate wheel encoder readings with slight noise: the estimated path drifts away from the true one and the uncertainty ellipse grows without bound.' },
        { num: '10.8', kind: 'Algorithm', name: 'Monte Carlo localisation', deps: ['robot-10.7', 'ctrl-12.10'], refs: ['Siciliano ch. 11'],
          pic: 'A robot in a symmetric corridor holds several hypotheses as particle clusters; a distinctive landmark collapses them onto the true pose.' },
        { num: '10.9', kind: 'Algorithm', name: 'EKF SLAM', deps: ['robot-10.7', 'ctrl-12.7'], refs: ['Siciliano ch. 11'],
          pic: 'Drive around a loop observing landmarks: robot and landmark uncertainty ellipses grow, then shrink together when an old landmark is seen again and the loop closes.' },
        { num: '10.10', kind: 'Algorithm', name: 'Occupancy-grid mapping', deps: ['robot-10.7'], refs: ['Siciliano ch. 11'],
          pic: 'Range-sensor beams update the log-odds of each grid cell as the robot moves, painting walls black and free space white as evidence accumulates.' },
        { num: '10.11', kind: 'Algorithm', name: 'Iterative closest point (ICP)', deps: ['robot-2.6', 'ladr-7.70'], refs: ['Siciliano ch. 11'],
          pic: 'Align a scanned point cloud with a map: closest points are paired, the best rigid transform is found by SVD, and the cloud snaps into place over a few iterations — or gets stuck if started too far away.' },
      ],
    },
  ],
};
