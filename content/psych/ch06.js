import { lesson1,lesson2,lesson3,lesson4,lesson5,lesson6,lesson7,lesson8,lesson9,lesson10,lesson11,lesson12,lesson13,lesson14,lesson15,lesson16,lesson17 } from './ch06.viz.js';
const gestalt='https://www.nssrperception.com/docs/Wagemans%202018%20Perceptual%20organization.pdf';
const depth='https://www.cns.nyu.edu/~david/courses/perception/lecturenotes/depth/depth-size.html';
export default {
 collection:'psych',chapter:6,title:'Organization, depth and size',
 summary:String.raw`A visual image leaves open which features belong together, which side owns a border, and which three-dimensional scene produced it. This chapter separates those interpretive questions from the geometry actually drawn. Original grouping stimuli lead to binocular and pictorial depth constructions, size-context demonstrations and a precise Gaussian cue-combination model. Computed measurements verify physical relations; they do not prescribe what every observer must see.`,
 items:[
  {
   num:'6.1',kind:'Principle',name:'Figure–ground segregation',deps:[],
   statement:String.raw`Figure–ground organization assigns a shared boundary to a region seen as an object against a continuing ground. The same border can support different assignments. A face–vase figure illustrates this ambiguity: the central region and its two flanking profiles offer competing interpretations without requiring a change to their common outline.

Smallness, shape and symmetry can contribute cues, but no one of them is a universal decision rule.`,
   idea:String.raw`A boundary is shared geometrically while its perceived ownership can be asymmetric. If the central region is assigned the border, the outer field can appear to continue behind it; exchanging the assignment changes the apparent objects. The two regions remain complementary in the actual image.

Our own outline is a densely sampled smooth construction rendered as a polygon. Its central area is obtained from that displayed polygon, and outer area is total field area minus central area. The sum verifies a physical partition, not the probability of a figure interpretation.`,
   caption:String.raw`Change the central width and the border's asymmetry, or reverse the neutral tones. Optionally reveal the shared boundaries and record your current interpretation. The area comparison describes the drawn regions; your chosen report remains separate.`,
   scope:String.raw`An original face–vase construction, not a traced Rubin image. Width changes geometry; tone reversal changes display code values. Region areas use the actual finite polygon in a fixed rectangular field. Screen tones are uncalibrated, and a local optional report supplies neither a population frequency nor a diagnostic assessment.`,
   refs:['Wagemans (2018), Perceptual organization, selected figure–ground discussion and PDF pp. 3–5','OpenStax Psychology 2e §5.6, figure–ground teaching exposition; original stimulus and polygon-area derivation'],links:{exposition:gestalt},tags:['figure ground','organization'],viz:lesson1,
  },
  {
   num:'6.2',kind:'Principle',name:'Gestalt grouping by proximity',deps:['psych-6.1'],
   statement:String.raw`Features nearer one another often group together. In a rectangular dot lattice, a smaller horizontal than vertical separation supplies a cue to rows; reversing those separations supplies a cue to columns. This describes an organizational tendency, not a parameter-free threshold applying to every image or observer.`,
   idea:String.raw`Let the center-to-center spacings be $g_x$ and $g_y$. The ratio $g_x/g_y$ compares the nearest horizontal and vertical neighbors. At equal spacings this particular geometric preference ties, although other context can still favor an organization.

The display uses one spatial scale for both axes and holds that scale fixed while spacings change. Rescaling each axis independently would make every lattice square and erase the relationship being taught. A second panel compares the actual gaps in the same units.`,
   caption:String.raw`Adjust horizontal and vertical spacing independently. Watch the same 36 dots move, then compare the two center-to-center gaps. Equal spacing is a geometric tie, not a command to see a particular grouping.`,
   scope:String.raw`A finite 6×6 lattice with equal circular marks and spacing 0.6–1.8 model units. Geometric comparisons retain original finite inputs, including ties and tiny differences. No observer grouping probability, fitted switching point or universal perceptual threshold is supplied.`,
   refs:['Wagemans (2018), PDF pp. 3–4, proximity and interactions among grouping cues','OpenStax Psychology 2e §5.6; original fixed-scale lattice'],links:{exposition:gestalt},tags:['grouping','proximity'],viz:lesson2,
  },
  {
   num:'6.3',kind:'Principle',name:'Grouping by similarity',deps:['psych-6.1'],
   statement:String.raw`Features with similar appearance can group together even when their positions also support another organization. Similarity and proximity can cooperate or compete. Equalizing the chosen appearance feature removes that feature difference, while leaving the spatial arrangement available.`,
   idea:String.raw`Assign one of two neutral screen codes to each dot according to a row, column or checkerboard pattern. Their code separation can vary independently of the lattice spacings. At separation zero every mark has the same code, so the appearance partition disappears without moving a dot.

A code difference is a property of our stimulus. It is not calibrated perceptual distance, and adding it numerically to a spatial gap would require a justified model of cue weights that this illustration does not assume.`,
   caption:String.raw`Choose an appearance pattern and vary its separation while changing the two spatial gaps. Try rows in appearance with closer vertical neighbors, then set appearance separation to zero. Compare the independent stimulus differences without a fabricated cue-balance score.`,
   scope:String.raw`Original neutral sRGB-code marks on a fixed neutral field. The same spatial scale is used in both directions. The code interval is not a colorimetric or perceptually uniform scale; no individual or population equivalence point is estimated.`,
   refs:['Wagemans (2018), PDF pp. 3–4, similarity and competing grouping arrangements','OpenStax Psychology 2e §5.6; original independent feature/spacing construction'],links:{exposition:gestalt},tags:['similarity','grouping'],viz:lesson3,
  },
  {
   num:'6.4',kind:'Principle',name:'Good continuation and contour integration',deps:['psych-6.1'],
   statement:String.raw`Aligned local features can organize into a continuous contour. Good continuation concerns how the directions and arrangement of neighboring elements support such a link. A contour can remain detectable among unrelated elements, but its visibility depends on the stimulus and observer.`,
   idea:String.raw`The authored target has 12 elements on a smooth curve. Their orientations follow its tangents plus seeded angular offsets; unrelated patches supply clutter. Each patch is a sampled Gaussian-windowed cosine, a Gabor:
$$G(u,v)=e^{-(u^2+v^2)/(2s^2)}\cos(2\pi f u').$$
Here $u'$ is the coordinate along the patch's selected orientation. The orientation panel displays the offsets actually assigned to the target. Increasing jitter alters a continuation cue; the computed offsets are not detection errors or measured thresholds.`,
   caption:String.raw`Vary angular jitter, clutter and the reproducible seed. Look for the authored contour before revealing its path, then inspect the actual orientation offsets. The reveal adds a diagnostic guide that is absent from the initial stimulus.`,
   scope:String.raw`Original finite Gabor field with a known 12-element contour; Gaussian envelopes and trigonometric samples are numerical. Patch sums are clipped to the available display-code range. No psychometric function, experiment-derived detection probability or observer threshold is inferred from the constructed jitter.`,
   refs:['Wagemans (2018), selected continuation/contour-integration discussion and PDF pp. 4–5','Original Gaussian-windowed cosine field and tangent-offset calculation'],links:{exposition:gestalt},tags:['continuation','contours'],viz:lesson4,
  },
  {
   num:'6.5',kind:'Principle',name:'Closure and illusory contours',deps:['psych-6.1'],
   statement:String.raw`Visual organization can support closed shapes and boundaries across gaps where no corresponding luminance edge is drawn. In a Kanizsa-type arrangement, appropriately oriented cut-out discs can support the appearance of a foreground triangle. This modal completion differs from an object understood to continue invisibly behind an occluder, called amodal completion.`,
   idea:String.raw`Three real inducers are arranged at triangle vertices. Their missing sectors face the center in the initial configuration. We draw those surfaces alone: there is no central triangle fill, hidden brightness change or actual triangle-edge stroke.

Rotating the sectors changes their alignment while the center and nearby background retain the same display code. An optional dashed outline is explicitly added as a geometric diagnostic. It must not be mistaken for the undrawn contour in the original stimulus.`,
   caption:String.raw`Rotate the inducer openings and change their radii. Compare the center and background code probes, then optionally add the explicit diagnostic outline. Equal code values verify what was drawn, not whether every observer experiences the same apparent brightness or contour.`,
   scope:String.raw`Original equilateral Kanizsa-type construction with numerical triangle coordinates and 60° sector openings. Only the real inducer regions are filled in the default stimulus. Source images and code are not copied. The display does not measure completion strength or settle the neural mechanism.`,
   refs:['Illusions Index, Kanizsa Triangle, main teaching discussion and modal/amodal distinction','Wagemans (2018), selected closure discussion and PDF p. 5; original inducer geometry'],links:{exposition:'https://www.illusionsindex.org/i/kanizsa-triangle'},tags:['closure','illusory contours'],viz:lesson5,
  },
  {
   num:'6.6',kind:'Principle',name:'Common fate',deps:['psych-6.1'],
   statement:String.raw`Elements moving together can group together. Common direction and speed provide information about shared motion even when the elements initially have the same appearance as their surroundings. A static image alone does not reproduce the full temporal cue.`,
   idea:String.raw`Begin with the same jittered dot field for every coherence setting. A hidden circular region identifies eligible dots, and a chosen integer subset receives one shared velocity. Other dots receive heterogeneous directions. At elapsed time $t$, each dot follows its own velocity with wrapping at the field boundary.

The coherent fraction is counted from actual memberships, not used as a predicted perceptual score. Optional coloring and velocity strokes reveal those memberships and trajectories. Later positions may overlap or vary in density; the model does not enforce uniform monocular marginals at every time.`,
   caption:String.raw`Play or pause the real motion, vary the coherent membership and inspect a selected phase. Reveal members or velocity strokes to verify which dots share motion. Changing the seed changes a reproducible realization, not an observer's detection ability.`,
   scope:String.raw`192 identically styled dots, a declared initial mask, seeded selection and heterogeneous background directions. Coherent counts are integers; wrapping and trigonometric trajectories are numerical. No empirical motion threshold, local perception report or fabricated detection curve is generated.`,
   refs:['Wagemans (2018), PDF pp. 3–4, common-fate grouping','Original seeded membership and wrapped-motion construction'],links:{exposition:gestalt},tags:['motion','grouping'],viz:lesson6,
  },
  {
   num:'6.7',kind:'Phenomenon',name:'Bistable perception: the Necker cube',deps:['psych-6.1'],
   statement:String.raw`An unchanged Necker-cube wireframe can support different depth interpretations. One projected face can appear nearer, then the other, while the drawn edge positions remain fixed. A flat two-dimensional interpretation is also possible; bistability does not require a forced choice or an identical switching experience for everyone.`,
   idea:String.raw`The image specifies projected vertices and connecting edges without uniquely specifying their depth order. The two clarified diagrams keep those projected coordinates identical while marking different front faces. Adding such a cue changes the display; a spontaneous change in an unmarked percept need not.

Figure–ground organization supplies the preceding question of how contours belong to objects. Here the remaining ambiguity concerns their depth assignment. An optional current report records only an actual selection and supplies no inferred switching rate.`,
   caption:String.raw`Compare the unmarked wireframe with the two explicitly cued interpretations. Select a cue or record your current report, including a flat view. The vertices stay fixed; colored cues are additions to the image and are not spontaneous perceptual switches.`,
   scope:String.raw`An original eight-vertex wireframe with shared projected coordinates in all interpretations. No eye tracking, timing experiment, neural simulation or synthetic flip histogram is performed. Optional reports stay in the local shareable state.`,
   refs:['Illusions Index, Necker Cube, main discussion, ambiguity and possible flat interpretation','Original common-projection/front-face diagrams'],links:{exposition:'https://www.illusionsindex.org/i/necker-cube'},tags:['bistability','depth'],viz:lesson7,
  },
  {
   num:'6.8',kind:'Concept',name:'Binocular disparity and stereopsis',deps:[],
   statement:String.raw`The two eyes generally receive different directions to the same scene point. Relative to a common fixation, the difference between its registered retinal angles is binocular disparity. It supplies depth information when the visual system can establish correspondence and use the two-eye signals.

In our sign convention, positive disparity is crossed and negative disparity is uncrossed. Zero disparity lies on a geometric horopter, not on the whole plane through fixation.`,
   idea:String.raw`Place the eyes at $(\pm b,0)$, fixation at $(0,F)$ and a point at $(x,z)$ with positive depth. Subtract each eye's fixation bearing from its point bearing to obtain $\alpha_L$ and $\alpha_R$; disparity is $\delta=\alpha_L-\alpha_R$. The circle through both eyes and fixation has center depth
$$c=(F^2-b^2)/(2F)$$
and radius $r=(F^2+b^2)/(2F)$. It is the zero-disparity locus in this ideal geometry.

We form exact cross and dot products of the original finite inputs before evaluating the angle numerically. This retains the side of the horopter even when subtracting rounded retinal angles would lose a tiny difference.`,
   caption:String.raw`Move the point sideways and in depth, change fixation and eye separation, and compare the rays, registered retinal angles and disparity curve. Put the point at fixation, then move sideways at the same depth: the fixation plane does not stay at zero disparity.`,
   scope:String.raw`Ideal two-dimensional pinhole eyes with eye positions, fixation and scene depth in model units. The geometric horopter differs from an empirically measured horopter. Angles are numerical and signed classification uses exact finite geometry; this is neither a calibrated stereo display nor a prediction of fusion limits or individual depth discrimination.`,
   refs:['Heeger, NYU Depth and size lecture, binocular disparity and horopter teaching discussion','Original centered-ray and exact cross/dot derivation'],links:{exposition:depth},tags:['stereopsis','geometry'],viz:lesson8,
  },
  {
   num:'6.9',kind:'Phenomenon',name:'Random-dot stereograms (Julesz)',deps:['psych-6.8'],
   statement:String.raw`A random-dot stereogram can specify a depth region through differences between corresponding texture elements in two eye images, even when a single image has no deliberately drawn object outline. The key information is the binocular relationship, not a conventional shaded drawing of the object. Successful depth perception still depends on viewing and correspondence.`,
   idea:String.raw`Generate a left-eye texture, choose an authored foreground mask, then shift its corresponding source cells in the right-eye image. A positive requested crossed disparity maps source column $x$ to right column $x-d$. Background sources remain where visible; newly exposed holes receive fresh seeded bits.

No source cell is assigned twice inside the right image. This matters because duplicating identical texture patches can introduce a monocular clue. The ideal construction uses independent binary samples; our displayed realization is explicitly a deterministic pseudorandom texture.`,
   caption:String.raw`Choose the hidden shape, integer disparity and seed. Compare parallel or cross-fusion image ordering, single-eye images, red/cyan channels and the mask reveal. Inspect a selected row's actual source correspondences; zero disparity gives identical eye images.`,
   scope:String.raw`An original 36×36 seeded binary texture with shifts −5 to 5 cells, explicit occlusion ownership and fresh bits at holes. Integer screen cells and literal red/cyan channels are uncalibrated; requested cell disparity is not degrees of visual angle. Fusion or a particular perceived shape is not guaranteed, and Julesz's original book images are not reproduced.`,
   refs:['Heeger, NYU Depth and size lecture, random-dot stereograms and correspondence','Original source-ownership construction; Julesz original book body not checked'],links:{exposition:depth},tags:['stereograms','correspondence'],viz:lesson9,
  },
  {
   num:'6.10',kind:'Concept',name:'Monocular depth cues',deps:[],
   statement:String.raw`One-eye images can supply depth cues through perspective, occlusion, texture, relative or familiar size, and changes with viewpoint. These cues constrain a scene interpretation without making a single image a unique measurement of three-dimensional size and distance.`,
   idea:String.raw`In a pinhole construction, an object's image coordinate is $u=f(X-C)/Z$, and a vertical extent $S$ projects to height $h=fS/Z$. Thus a small nearby object and a proportionally larger distant object can have the same image height. With world position fixed, camera translation changes the image at rate $\partial u/\partial C=-f/Z$: nearer objects move farther across the image.

Overlay controls add actual rails, texture or an occluding surface. The equal-image-height option changes the world heights explicitly; it does not claim to remove size information from an otherwise unchanged scene.`,
   caption:String.raw`Vary the two object depths and the camera position. Toggle the actual context drawing and compare equal-world-height with equal-image-height objects. Follow the world top view and the two computed parallax shifts to separate image size from physical size.`,
   scope:String.raw`Authored pinhole scene in model units with ideal projection, positive depths and a translated camera. Context overlays are geometric illustrations, not calibrated depth judgments or a complete rendering of illumination, accommodation or motion vision. The readout states the physical sizes used in each construction.`,
   refs:['Heeger, NYU Depth and size lecture, pictorial cues, relative size and motion parallax','Original ray-plane projection and camera-translation calculation'],links:{exposition:depth},tags:['depth cues','projection'],viz:lesson10,
  },
  {
   num:'6.11',kind:'Phenomenon',name:'Size constancy and Emmert’s law',deps:['psych-6.10'],
   statement:String.raw`Size constancy is the tendency to perceive an object's size as relatively stable despite changes in its retinal image. Emmert-type scaling concerns a different comparison: at a fixed retinal extent, apparent size can increase with perceived distance. Perceived distance and physical surface distance must be distinguished. Neither statement is an unconditional exact law for every observer and setting.`,
   idea:String.raw`For a real object of fixed size $S$ at physical distance $D$, image diameter divided by focal length is $S/D$. Compensating by that same distance recovers $S$ in the ideal geometry.

For a fixed retinal angular diameter $\theta$, centered rays instead define a size at an assumed scaling distance $D_*$:
$$S_*=2D_*\tan(\theta/2)=D_*r,$$
where $r=2\tan(\theta/2)$ is held fixed. Increasing $D_*$ makes this constructed size grow. The identity explains a scaling possibility without establishing that perceived distance equals physical distance, or that measured apparent sizes follow the exact construction.`,
   caption:String.raw`Compare a fixed real object with a fixed image diameter. Change physical distance and the explicitly assumed scaling distance, then inspect the constant-size and linear-size constructions. This diagram induces no actual afterimage and uses no flash.`,
   scope:String.raw`Original centered-ray geometry. Nakamizo and Imamura’s 2004 study distinguishes perceived and physical distance: 19 observers used actual distances 1–22.91 m; six used virtual distances 1–24 m. Their full virtual-range slope differed from the theoretical value; a restricted 1–20 m fit was compatible. The explorer is a separate construction, with no digitized observations or universal exact empirical claim.`,
   refs:['Nakamizo & Imamura (2004), Verification of Emmert’s Law in Actual and Virtual Environments, complete main text pp. 325–329','Heeger, NYU Depth and size lecture; original centered-ray angle convention'],links:{source:'https://www.jstage.jst.go.jp/article/jpa/23/6/23_6_325/_article/-char/en',exposition:depth},tags:['size constancy','distance'],viz:lesson11,
  },
  {
   num:'6.12',kind:'Phenomenon',name:'Müller-Lyer illusion',deps:['psych-6.11'],
   statement:String.raw`Equal line shafts can appear unequal when their endpoints carry different fin arrangements. In a Müller-Lyer-type matching task, a reader can adjust one shaft until it appears to match another, then compare that setting with physical equality. Knowing the physical lengths does not specify an identical perceptual response for everyone.`,
   idea:String.raw`Fin geometry supplies context around the shaft endpoints while the physical endpoints themselves remain measurable. Our neutral stimulus uses two separately drawn shafts with opposed fins. The comparison control changes its actual length; reveal exposes that physical setting rather than applying an automatic perceptual correction.

A depth and size-constancy interpretation is one proposed account, not a settled complete explanation. The familiar cultural interpretation is also debated. A single uncalibrated match here cannot identify a mechanism or estimate a population effect.`,
   caption:String.raw`Adjust the lower shaft before revealing its physical length and signed match error. Change fin length or angle, and remove the fins to compare contexts. The reveal reports your actual setting; it supplies no expected percentage error.`,
   scope:String.raw`An original paired-shaft variant, not a reproduction of Bach's Brentano app or a historical figure. Physical shaft differences use exact finite inputs; fin trigonometry is numerical. Screen distance, fixation and adaptation are uncontrolled. No personal score, clinical inference or population illusion magnitude is assigned.`,
   refs:['Bach, Müller-Lyer Illusion, main teaching discussion and proposed perspective interpretation','Amir & Firestone (2025), preprint title/abstract/initial introduction only, challenge to a strong cultural account; broader body unread','Original shaft matching and fin geometry'],links:{exposition:'https://michaelbach.de/ot/sze-muelue/index.html'},tags:['size illusions','context'],viz:lesson12,
  },
  {
   num:'6.13',kind:'Phenomenon',name:'Ponzo illusion',deps:['psych-6.11'],
   statement:String.raw`Equal bars placed in a converging-line context can appear to differ in length. The Ponzo illusion is often discussed through perspective and constancy, but competing explanations exist. Convergence in the picture is a physical stimulus property; a particular size judgment is an observer response.`,
   idea:String.raw`Suppose, conditionally, the drawn rails represent parallel lines of fixed world separation. In pinhole projection their image gap is inversely proportional to depth. The farther-to-nearer depth ratio would then equal the nearer-to-farther image-gap ratio.

Multiplying this depth ratio by the bar image-length ratio gives a conditional world-size ratio. This is a geometric interpretation under the parallel-world-rail assumption, not a fitted curve of perceived length. At zero convergence, that assumed depth ratio becomes one.`,
   caption:String.raw`Match the upper bar to the lower, vary rail convergence, and switch among no context, rails, or rails with texture. Reveal the physical error separately from the size ratio implied by the explicit parallel-world-rail interpretation.`,
   scope:String.raw`Original bars and converging-rail drawing with a genuine parallel limit. Conditional inferred size depends on a declared scene interpretation and is not a neural or perceptual prediction. The comparison is an uncalibrated local adjustment; historical experiments and cross-cultural claims are not independently reproduced.`,
   refs:['Donaldson & Macpherson (2017), Illusions Index: Ponzo Illusion, main teaching discussion and alternative explanations','Original conditional parallel-rail pinhole derivation'],links:{exposition:'https://www.illusionsindex.org/i/ponzo-illusion'},tags:['perspective','size illusions'],viz:lesson13,
  },
  {
   num:'6.14',kind:'Phenomenon',name:'Ebbinghaus (Titchener) circles',deps:['psych-6.1'],
   statement:String.raw`The apparent size of a central disc can depend on its surrounding discs. In the familiar Ebbinghaus arrangement, physically equal center discs surrounded by small versus large discs can appear unequal. The context effect does not provide a universal numerical mapping from surround radius to apparent size.`,
   idea:String.raw`Change surround size while holding the distance between each surround center and its target center fixed. This makes that particular geometric constraint explicit; it does not hold edge-to-edge separation fixed, since changing a radius necessarily changes the edge gap.

The two centers share one spatial scale, and every disc remains circular. Adjusting the comparison radius changes its actual diameter and area: a radius ratio $q$ gives area ratio $q^2$. Those physical relations remain distinct from the appearance judgment.`,
   caption:String.raw`Adjust the comparison center, reverse the small and large surrounds, or remove context. Reveal diameter guides and the physical ratio after considering the appearance. The phone layout stacks the two arrangements while preserving the same circle scale.`,
   scope:String.raw`Original six-surround construction with nonoverlap throughout the offered parameter range. Ring-center distance, surround radii and center sizes are stated independently. Local adjustments are not psychophysical measurements, and the display does not infer perceptual versus action pathways or adopt the source exposition's broader neuroscience claims.`,
   refs:['Thomson & Macpherson (2017), Illusions Index: Ebbinghaus Illusion, basic size-context demonstration','Original fixed-center-distance circle geometry and physical area ratio'],links:{exposition:'https://www.illusionsindex.org/i/ebbinghaus-illusion'},tags:['size contrast','grouping'],viz:lesson14,
  },
  {
   num:'6.15',kind:'Phenomenon',name:'The Ames room',deps:['psych-6.11'],
   statement:String.raw`An irregular room can project a familiar rectangular-room image from a selected viewpoint. Objects of equal physical height at different depths then produce different image heights, supporting a striking apparent size contrast when the room is interpreted as regular. Viewing geometry constrains this demonstration, while additional viewing information need not erase every measured illusion.`,
   idea:String.raw`Choose desired image corner coordinates $(u,v)$ and positive corner depths $Z$. With focal length one, construct world coordinates $X=uZ$ and $Y=vZ$. Their projection at the designated camera is exactly $(u,v)$ despite the differing world depths.

Equal world-height figures have image heights $S/Z$. Raising the camera changes image height coordinates to $(Y-C_y)/Z$, shearing our unequal-depth back-wall projection. A lateral shift alone need not break its rectangular outline. The world top view exposes the actual depths rather than assigning arbitrary picture sizes to the figures.`,
   caption:String.raw`Change the two room depths and move the camera sideways or upward. Compare the peephole projection with the world top view. Both figures keep the same world height; their image-height ratio follows the actual depths.`,
   scope:String.raw`An original projective room with explicitly triangulated connecting surfaces, not a reconstruction of a historical Ames room. The geometry predicts image coordinates, not a universal judgment. Gehringer and Engel’s 1986 abstract reports reduced but persistent distortion with expanded viewing access; only its abstract is checked, so no full-study reanalysis is claimed.`,
   refs:['Ittelson, The Ames Demonstrations in Perception, chapter 13 pp. 183–184 and original figures p. 185 inspected; original projective construction','Gehringer & Engel (1986), Effect of ecological viewing conditions on the Ames’ distorted room illusion, abstract acquired in search only; full body unchecked'],links:{exposition:'https://www.psy.ritsumei.ac.jp/akitaoka/Amesroom-source.pdf',abstract:'https://pubmed.ncbi.nlm.nih.gov/2940322/'},tags:['perspective','size constancy'],viz:lesson15,
  },
  {
   num:'6.16',kind:'Phenomenon',name:'The moon illusion',deps:['psych-6.11'],
   statement:String.raw`The Moon can appear larger near the horizon than higher in the sky, even when comparable photographs show nearly the same angular width. This apparent-size change should be distinguished from real orbital and topocentric angular-size variation, and from atmospheric color change or vertical flattening. A complete explanation of the illusion remains unsettled.`,
   idea:String.raw`A comparison with the same camera settings can separate image width from apparent size. Our schematic draws a movable Moon and a reference with exactly the same computed pixel radius. Context can be added or removed while their physical screen diameters remain equal.

Size–distance scaling and contextual comparisons offer possible explanatory ingredients; showing an equal-diameter drawing does not select a complete causal theory. The sky layout is deliberately schematic so both discs remain visible, not a full angularly scaled astronomical rendering.`,
   caption:String.raw`Move the schematic Moon from the horizon toward the zenith, switch the context, and reveal equal-diameter rulers. Changing model angular diameter changes both discs together. The duplicate crater patterns are authored decoration; the diagram does not predict how large either disc will appear to you.`,
   scope:String.raw`NASA's teaching article describes the illusion, camera comparison, atmospheric flattening and unresolved explanation. Real lunar angular size is only approximately constant during a night. The illustration fixes that model diameter, uses a schematic elevation layout and performs no lunar ephemeris calculation or observer experiment.`,
   refs:['NASA Science, The Moon Illusion: Why Does the Moon Look So Big Sometimes?, main teaching article, updated 2025','Original equal-radius schematic and identical comparison guides'],links:{exposition:'https://science.nasa.gov/solar-system/moon/the-moon-illusion-why-does-the-moon-look-so-big-sometimes/'},tags:['moon illusion','size constancy'],viz:lesson16,
  },
  {
   num:'6.17',kind:'Model',name:'Bayesian cue combination (Ernst–Banks)',deps:['psych-6.10','stat-10.6'],
   statement:String.raw`Suppose two cues are unbiased conditionally independent Gaussian measurements of one quantity, with known variances $V$ and $H$. With a locally uniform prior, their product gives a Gaussian estimate with visual weight and variance
$$w_V=H/(V+H).$$
$$B=VH/(V+H).$$
Its mean is $w_Vv+(1-w_V)h$. The more precise cue gets greater weight. Ernst and Banks found behavior close to this reliability-weighted prediction in a particular visual–haptic height task; this is not a universal model of all cue use.`,
   idea:String.raw`STAT 10.6 gives the normal–normal precision update. Apply the same completing-the-square argument to two likelihoods and a uniform prior: precisions $1/V$ and $1/H$ add. Normalizing them yields the stated weights, and the inverse total precision yields $B$.

Independence is load-bearing. For covariance $C$, a chosen visual weight $w$ instead has actual variance
$$w^2V+(1-w)^2H+2w(1-w)C.$$
Minimizing this quadratic gives $w_*=(H-C)/(V+H-2C)$. This correlated minimum-variance extension may use a weight outside 0–1. At $V=1,H=4,C=1$, the optimum uses the visual cue alone; using the independence weight 0.8 gives variance 1.12, worse than visual variance 1.`,
   caption:String.raw`Change cue estimates, uncertainties and correlation. Compare the independence rule, the correlated minimum-variance rule and a chosen weight. Inspect authored Gaussian curves, the exact weights and the actual variance curve; challenge independence rather than assuming that combining always helps.`,
   scope:String.raw`The original 2002 main article was read through licensed Gale HTML: four naive observers aged 22–33 judged a 55 mm standard with four visual-noise levels and modest conflicts up to ±6 mm. The curves here are independently authored, not digitized data. Gaussian unbiased measurements, known variances and a uniform prior are declared assumptions; the correlation extension is our derivation. Large conflicts, learned biases, causal inference and non-Gaussian cues require further models.`,
   refs:['Ernst & Banks (2002), Humans integrate visual and haptic information in a statistically optimal fashion, complete main argument/results/methods via Gale HTML; figure captions read, figure pixels unavailable','STAT 10.6, normal–normal precision update; original correlated quadratic-variance extension'],links:{source:'https://go.gale.com/ps/i.do?asid=a3ca2f7b&id=GALE%7CA187492166&it=r&p=AONE&u=googlescholar&v=2.1'},tags:['cue combination','Bayesian inference'],viz:lesson17,
  },
 ],
};
