// Syllabus — Geography & Cartography (curated course; see collection.js for references)
// Refs: "Snyder" = Snyder, Map Projections — A Working Manual (USGS Professional Paper 1395, 1987); section
// numbers verified from the report's contents (1 characteristics, 2 longitude and latitude, 3 datum and
// ellipsoid, 4 scale variation and angular distortion, 5 transformation of graticules, 6 classification,
// 7 Mercator, 8 Transverse Mercator, 10 cylindrical equal-area, 11 Miller, 12 equidistant cylindrical,
// 14 Albers, 15 Lambert conformal conic, 16 equidistant conic, 20 orthographic, 21 stereographic,
// 22 gnomonic, 23 general perspective, 24 Lambert azimuthal equal-area, 25 azimuthal equidistant,
// 29 Van der Grinten, 30 sinusoidal, 31 Mollweide, 32 Eckert IV/VI). "Haggett" = Geography: A Global
// Synthesis (chapter numbers not verified; author-level refs).
//
// Sources consulted (research pass, 2026-10):
//   - Snyder PP 1395: https://pubs.usgs.gov/publication/pp1395 (contents read from https://pubs.usgs.gov/pp/1395/report.pdf)
//   - Penn State GEOG 160 (scale, projections, datums, GPS, surfaces, geo-analytics): https://courses.ems.psu.edu/geog160/
//   - Wikipedia: https://en.wikipedia.org/wiki/List_of_map_projections ;
//     https://en.wikipedia.org/wiki/Quantitative_revolution (von Thünen, Weber, gravity model, central place
//     theory, Tobler's first law, spatial diffusion)
// Gaps filled after comparison: datums and the geoid, the longitude problem and GPS, Chebyshev's optimal
// conformal projection, Web Mercator and UTM, interrupted and polyhedral maps, generalization (Douglas–Peucker,
// Töpfer), MAUP, cartograms, Moran's I, kriging, Hotelling, Huff/Reilly, Ravenstein, Gibrat.
// Deliberate omissions: remote sensing and GIS data models (better placed in an imaging/CS collection),
// regional and cultural geography, which have no crisp testable statements.
// Landmark papers (kind 'Paper') appended Oct 2026; each citation checked against Crossref, the publisher, or a digitized library copy.
export default {
  collection: 'geog',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'The shape of the Earth and its coordinates',
      summary: String.raw`Geography begins by measuring the globe. Eratosthenes found its size with a shadow, latitude and longitude put a grid on it, and great circles give its shortest paths, computed with spherical trigonometry. The real Earth is an oblate ellipsoid with a lumpy geoid, so every map rests on a chosen datum; finding longitude at sea took a clock, and today it takes relativistic satellites.`,
      items: [
        { num: '1.1', kind: 'Method', name: 'Eratosthenes measures the Earth', deps: [], refs: ['Snyder §2', 'Haggett'],
          pic: 'Drag the Sun’s angle at Alexandria while Syene sees it overhead: the shadow angle and the distance between the cities give the Earth’s circumference, and a flat-Earth toggle shows the same shadows demanding a nearby Sun instead.' },
        { num: '1.2', kind: 'Definition', name: 'Latitude and longitude', deps: ['geog-1.1'], refs: ['Snyder §2'],
          pic: 'Rotate a globe and drag a point: its latitude and longitude are read out with the meridian and parallel through it, and the length of a degree of longitude shrinks as cos φ toward the poles.' },
        { num: '1.3', kind: 'Theorem', name: 'Great circles are the shortest paths on a sphere', deps: ['geog-1.2', 'dg-9.3', 'dg-9.7'], refs: ['Snyder §5'],
          pic: 'Drag two cities on a globe and stretch a string between them: it settles onto the great circle, and any other path you draw is measured longer.' },
        { num: '1.4', kind: 'Proposition', name: 'Great-circle distance (haversine formula)', deps: ['geog-1.3', 'vcalc-1.2'], refs: ['Snyder §5'],
          pic: 'Pick two points: the central angle is computed by the spherical law of cosines and by the haversine formula, and for nearby points the cosine version visibly loses digits while haversine stays accurate.' },
        { num: '1.5', kind: 'Theorem', name: 'Spherical triangles and Girard’s theorem', deps: ['geog-1.3', 'dg-10.2'], refs: ['Snyder §5'],
          pic: 'Draw a triangle of great circles on a globe: its angles sum to more than 180°, and the excess equals the area divided by R², reaching 270° for the octant with three right angles.' },
        { num: '1.6', kind: 'Model', name: 'The Earth as an oblate ellipsoid', deps: ['mech-9.7', 'geog-1.2'], refs: ['Snyder §3'],
          pic: 'Spin a fluid planet faster with a slider: it flattens, and at Earth’s rate the computed flattening (about 1/300) matches the measured difference between equatorial and polar radii.' },
        { num: '1.7', kind: 'Definition', name: 'Geodetic, geocentric and parametric latitude', deps: ['geog-1.6', 'vcalc-2.8'], refs: ['Snyder §3'],
          pic: 'On an exaggerated ellipse, draw the surface normal and the line to the centre from a point: their angles with the equator differ by up to 0.19° on Earth (about 21 km), plotted against latitude.' },
        { num: '1.8', kind: 'Concept', name: 'The geoid and geodetic datums', deps: ['geog-1.6', 'geog-1.7'], refs: ['Snyder §3'],
          pic: 'Exaggerate the geoid’s bumps by 10,000 times over the reference ellipsoid: switching between datums such as NAD27 and WGS84 moves the coordinates of a landmark by tens of metres on the map.' },
        { num: '1.9', kind: 'Invention', name: 'The marine chronometer and the longitude problem', deps: ['geog-1.2', 'prob-2.2.1'], refs: ['Haggett'],
          pic: 'Sail a simulated voyage with a clock of adjustable daily drift: each second of clock error is converted into a longitude error, and Harrison’s H4 is compared with a pendulum clock on a rolling deck.' },
        { num: '1.10', kind: 'Invention', name: 'GPS positioning by trilateration', deps: ['geog-1.6', 'rel-6.9', 'stat-12.2', 'ladr-6.61'], refs: ['Haggett'],
          pic: 'Intersect spheres around satellites you can drag: four ranges fix position and receiver clock error, and switching off the relativistic clock correction makes the computed position drift by kilometres per day.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Navigation on the sphere',
      summary: String.raw`A ship holding a constant compass bearing does not follow the shortest path: it traces a loxodrome that spirals toward the pole. Comparing rhumb lines with great circles, and fixing position by dead reckoning, celestial sights and triangulation, shows how the geometry of the sphere governs travel and surveying.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Loxodromes (rhumb lines)', deps: ['geog-1.2', 'pma-6.21'], refs: ['Snyder §7'],
          pic: 'Steer a ship at a fixed bearing on a globe: its track crosses every meridian at the same angle and spirals infinitely many times around the pole while reaching it in finite length.' },
        { num: '2.2', kind: 'Proposition', name: 'Great circle versus rhumb line', deps: ['geog-2.1', 'geog-1.4'], refs: ['Snyder §5', 'Snyder §7'],
          pic: 'Pick two ports: both routes are drawn with their lengths, the great circle’s bearing changes continuously while the rhumb line’s does not, and the saving is largest for long east–west voyages at high latitude.' },
        { num: '2.3', kind: 'Method', name: 'Dead reckoning', deps: ['geog-2.1', 'prob-2.2.1'], refs: ['Haggett'],
          pic: 'Integrate a ship’s logged speed and heading with random errors and an unknown current: the estimated position wanders away from the true track inside a growing error ellipse.' },
        { num: '2.4', kind: 'Method', name: 'Celestial navigation: latitude from Polaris and the Sun', deps: ['geog-1.2'], refs: ['Haggett'],
          pic: 'Move an observer north and south: Polaris rises to an altitude equal to the latitude, and the noon Sun’s altitude plus the season’s declination gives the same answer.' },
        { num: '2.5', kind: 'Method', name: 'Triangulation surveying', deps: ['geog-1.5', 'pma-5.5'], refs: ['Haggett'],
          pic: 'Measure one baseline and only angles to distant peaks: a chain of triangles fixes all positions, angle errors propagate along the chain, and spherical excess must be corrected over large networks.' },
        { num: '2.6', kind: 'Paradox', name: 'Why polar flight routes look curved on maps', deps: ['geog-1.3', 'geog-2.2'], refs: ['Snyder §7'],
          pic: 'Draw the London–Los Angeles great circle on a Mercator map and on a globe: it arcs far north over Greenland on the map yet is the straight, shortest path on the globe.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Why no map is perfect',
      summary: String.raw`Gauss's Theorema Egregium says curvature is intrinsic, so a sphere cannot be laid flat without stretching: every map distorts something. Tissot's indicatrix makes the distortion visible as the image of an infinitesimal circle — an ellipse whose axes are the principal scale factors. A map can preserve angles (conformal) or areas (equal-area), never both, and the art of projection is choosing what to give up.`,
      items: [
        { num: '3.1', kind: 'Definition', name: 'Map projection', deps: ['geog-1.2', 'pma-9.11'], refs: ['Snyder §1'],
          pic: 'Pick a projection and drag a point on the globe: its image moves on the plane, and the graticule of meridians and parallels is redrawn by the projection formulas.' },
        { num: '3.2', kind: 'Theorem', name: 'No map of a sphere preserves all distances', deps: ['geog-3.1', 'dg-8.3', 'dg-5.4'], refs: ['Snyder §1', 'Snyder §4'],
          pic: 'Try to flatten an orange-peel cap: it must tear or stretch, and for any projection the app finds a triangle whose map side lengths disagree with the globe, the mismatch growing with the cap size.' },
        { num: '3.3', kind: 'Definition', name: 'Scale factors along meridians and parallels', deps: ['geog-3.1', 'pma-9.17'], refs: ['Snyder §4'],
          pic: 'Move a probe over a projection: the meridian scale h and parallel scale k are computed from derivatives of the projection formulas and drawn as stretched tick marks.' },
        { num: '3.4', kind: 'Theorem', name: 'Tissot’s indicatrix', deps: ['geog-3.3', 'ladr-7.70', 'pma-9.11'], refs: ['Snyder §4'],
          pic: 'Scatter small circles over the globe and project them: each becomes an ellipse whose semi-axes are the singular values of the projection’s derivative, revealing the distortion pattern at a glance.' },
        { num: '3.5', kind: 'Proposition', name: 'Conformal maps turn small circles into circles', deps: ['geog-3.4', 'ladr-7.70'], refs: ['Snyder §4'],
          pic: 'Switch among projections: for the conformal ones every indicatrix stays a circle (only its size changes) and angles between curves are preserved, measured live where two roads cross.' },
        { num: '3.6', kind: 'Proposition', name: 'Equal-area maps keep the indicatrix area constant', deps: ['geog-3.4', 'ladr-7.111', 'pma-10.9'], refs: ['Snyder §4'],
          pic: 'On an equal-area projection the indicatrices stretch into ellipses of very different shapes but identical areas, shown by the product of the singular values staying at 1.' },
        { num: '3.7', kind: 'Theorem', name: 'No map is both conformal and equal-area', deps: ['geog-3.5', 'geog-3.6', 'geog-3.2', 'vcalc-1.8'], refs: ['Snyder §4'],
          pic: 'Force both axes of the indicatrix to 1 everywhere: the map would be an isometry, which the Theorema Egregium forbids, and the app shows any attempt developing distortion somewhere.' },
        { num: '3.8', kind: 'Theorem', name: 'Chebyshev’s theorem on optimal conformal maps', deps: ['geog-3.5'], refs: ['Snyder §4'],
          pic: 'Draw a region on the globe and optimise a conformal projection for it: the scale error is minimized when the scale factor is constant along the region’s boundary, shown by the scale contours hugging the outline.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Cylindrical projections',
      summary: String.raw`Wrapping a cylinder around the globe gives the most familiar world maps. Mercator stretched the parallels just enough to make rhumb lines straight, at the price of grotesque areas near the poles; Lambert's cylindrical projection keeps areas exact instead, as Archimedes' hat-box theorem shows. Turning the cylinder sideways gives the Transverse Mercator and the UTM grid, and the web runs on a spherical shortcut of Mercator.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Equirectangular projection (plate carrée)', deps: ['geog-3.4'], refs: ['Snyder §12'],
          pic: 'Map longitude and latitude directly to x and y: indicatrices widen into ellipses toward the poles, and the scale along meridians stays exactly true everywhere.' },
        { num: '4.2', kind: 'Theorem', name: 'Mercator projection and the isometric latitude', deps: ['geog-3.5', 'pma-6.21'], refs: ['Snyder §7'],
          pic: 'Stretch each parallel by sec φ and integrate to find where to place it: y = ln tan(π/4 + φ/2) emerges, the map becomes conformal, and the poles run off to infinity.' },
        { num: '4.3', kind: 'Proposition', name: 'Mercator maps rhumb lines to straight lines', deps: ['geog-4.2', 'geog-2.1'], refs: ['Snyder §7'],
          pic: 'Draw a constant-bearing course on the globe: on the Mercator map it is a straight line at that bearing, which is why navigators adopted the projection in the 16th century.' },
        { num: '4.4', kind: 'Paradox', name: 'Greenland versus Africa on Mercator', deps: ['geog-4.2'], refs: ['Snyder §7'],
          pic: 'Drag Greenland down to the equator on a Mercator map: it shrinks to a fourteenth of Africa’s area, and the area-scale factor sec²φ is plotted to explain the illusion.' },
        { num: '4.5', kind: 'Theorem', name: 'Archimedes’ hat-box theorem and Lambert’s cylinder', deps: ['geog-3.6', 'pma-10.9'], refs: ['Snyder §10'],
          pic: 'Project the sphere horizontally onto a tangent cylinder: every slab of sphere has the same area as its cylinder band, so the projection is equal-area, with shapes squashed near the poles.' },
        { num: '4.6', kind: 'Event', name: 'The Gall–Peters controversy', deps: ['geog-4.5', 'geog-4.4'], refs: ['Snyder §10'],
          pic: 'Move the standard parallels of a cylindrical equal-area map to 45° (Gall–Peters) and compare with Behrmann and Lambert: all have equal areas, none fixes shape, and the debate is about which distortion to show.' },
        { num: '4.7', kind: 'Model', name: 'Transverse Mercator and the UTM grid', deps: ['geog-4.2'], refs: ['Snyder §8'],
          pic: 'Rotate the Mercator cylinder to touch a meridian: the narrow zone near it has tiny distortion, and 60 such zones with a scale factor of 0.9996 tile the world as UTM.' },
        { num: '4.8', kind: 'Model', name: 'Web Mercator', deps: ['geog-4.2', 'geog-1.7'], refs: ['Snyder §7'],
          pic: 'Compare Web Mercator, which applies spherical formulas to ellipsoidal coordinates, with true ellipsoidal Mercator: the map is no longer exactly conformal, and positions differ by up to about 40 km in y.' },
        { num: '4.9', kind: 'Model', name: 'Miller cylindrical projection', deps: ['geog-4.2', 'pma-5.5'], refs: ['Snyder §11'],
          pic: 'Slide a compromise parameter between equirectangular and Mercator spacing of parallels: Miller’s choice keeps the poles finite, and the indicatrices show it is neither conformal nor equal-area.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Azimuthal and conic projections',
      summary: String.raw`Projecting onto a tangent plane gives azimuthal maps, which show true directions from their centre: the gnomonic makes every great circle straight, the stereographic is conformal and maps circles to circles, the azimuthal equidistant gets distances from the centre right and Lambert's version keeps areas. Cones fitted to mid-latitudes give the conformal and equal-area conics used for continents and countries.`,
      items: [
        { num: '5.1', kind: 'Model', name: 'Gnomonic projection: great circles become straight lines', deps: ['geog-1.3', 'geog-3.1'], refs: ['Snyder §22'],
          pic: 'Project from the centre of the globe onto a tangent plane: every great circle maps to a straight line, so planning a shortest route is just drawing with a ruler, while shapes blow up away from the centre.' },
        { num: '5.2', kind: 'Theorem', name: 'Stereographic projection: conformal, circles to circles', deps: ['geog-3.5', 'rca-13.1'], refs: ['Snyder §21'],
          pic: 'Project from the antipode onto the tangent plane: draw circles on the globe and their images are circles (or lines), and indicatrices stay round but grow as sec²(c/2).' },
        { num: '5.3', kind: 'Model', name: 'Orthographic projection', deps: ['geog-3.1'], refs: ['Snyder §20'],
          pic: 'Look at the globe from infinitely far away: the hemisphere appears as in a photograph, and the indicatrices flatten into thin ellipses near the limb.' },
        { num: '5.4', kind: 'Model', name: 'Azimuthal equidistant projection', deps: ['geog-1.4', 'geog-3.1'], refs: ['Snyder §25'],
          pic: 'Centre the map on any city: distances and directions from it are exact, the antipode becomes the outer circle, and a polar version is shown to be the UN emblem.' },
        { num: '5.5', kind: 'Model', name: 'Lambert azimuthal equal-area projection', deps: ['geog-3.6', 'pma-6.21'], refs: ['Snyder §24'],
          pic: 'Place each point at the chord distance from the centre: areas are preserved exactly, checked by counting equal-area cells, and shapes distort toward the edge of the world disc.' },
        { num: '5.6', kind: 'Model', name: 'General perspective projection', deps: ['geog-5.3', 'geog-5.1'], refs: ['Snyder §23'],
          pic: 'Raise a viewpoint from the Earth’s centre through the surface to infinity: the projection morphs through gnomonic, near-side satellite views and orthographic, with the visible horizon computed at each height.' },
        { num: '5.7', kind: 'Concept', name: 'Conic projections and the cone constant', deps: ['geog-3.4'], refs: ['Snyder §16'],
          pic: 'Fit a cone to the globe with adjustable standard parallels: unrolling it gives a fan-shaped map whose cone constant sets the angle of the fan, with distortion minimized between the standard parallels.' },
        { num: '5.8', kind: 'Model', name: 'Lambert conformal conic projection', deps: ['geog-5.7', 'geog-3.5', 'ode-1.3'], refs: ['Snyder §15'],
          pic: 'Choose two standard parallels for a mid-latitude country: scale is exact along them, indicatrices stay circular, and the readout gives the worst scale error inside the country.' },
        { num: '5.9', kind: 'Model', name: 'Albers equal-area conic projection', deps: ['geog-5.7', 'geog-3.6', 'pma-6.21'], refs: ['Snyder §14'],
          pic: 'Map the contiguous United States with Albers: areas are exact, compared live with Lambert conformal conic on the same parallels, and the shape differences are barely visible at that scale.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'World maps and choosing a projection',
      summary: String.raw`World maps trade off distortions. Pseudocylindrical projections such as the sinusoidal and Mollweide keep areas while curving the meridians, compromise projections like Robinson and Winkel tripel spread errors around, and interrupted or polyhedral maps cut the globe to reduce them. Quantitative error measures and the shape of the region decide which projection to use.`,
      items: [
        { num: '6.1', kind: 'Model', name: 'Sinusoidal projection', deps: ['geog-3.6'], refs: ['Snyder §30'],
          pic: 'Lay each parallel at its true length along a straight line: the meridians become sine curves, areas are exact, and the indicatrices shear badly at the map’s far corners.' },
        { num: '6.2', kind: 'Model', name: 'Mollweide projection', deps: ['geog-3.6', 'mech-8.9', 'pma-5.11'], refs: ['Snyder §31'],
          pic: 'Map the globe into an ellipse of equal area: the auxiliary angle satisfies an equation like Kepler’s, solved by Newton iteration with the steps shown, and the result is compared with the sinusoidal.' },
        { num: '6.3', kind: 'Model', name: 'Compromise projections: Robinson and Winkel tripel', deps: ['geog-4.1', 'geog-6.1'], refs: ['Snyder §29', 'Haggett'],
          pic: 'Toggle between Robinson, Winkel tripel and Van der Grinten: indicatrices show modest errors of both kinds, and the area and angle distortion statistics are tabulated for each.' },
        { num: '6.4', kind: 'Method', name: 'Measuring global distortion (Goldberg–Gott scores)', deps: ['geog-3.4', 'geog-6.3'], refs: ['Snyder §6'],
          pic: 'Sample random points over the globe and compute area, shape, distance and boundary-cut errors for each projection: the scatter plot ranks maps, with Winkel tripel near the front of the pack.' },
        { num: '6.5', kind: 'Method', name: 'Interrupted and polyhedral maps', deps: ['geog-6.1', 'geog-5.1'], refs: ['Snyder §6'],
          pic: 'Cut the globe into lobes (Goode homolosine) or project onto an icosahedron and unfold it (Fuller’s Dymaxion): distortion drops sharply, at the cost of gaps that break the oceans or the continents.' },
        { num: '6.6', kind: 'Principle', name: 'Choosing a projection by region shape', deps: ['geog-5.8', 'geog-4.7', 'geog-5.5'], refs: ['Snyder §6'],
          pic: 'Draw the outline of a region to map: the app suggests azimuthal for round regions, conic for mid-latitude east–west belts and transverse cylindrical for north–south strips, and shows the error for each choice.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      "n": 7,
      "title": "Scale, generalization and representation",
      "summary": "Scale, resolution and zoning are choices. Local projection scale changes a ruler, recursive simplification trades vertices for a bounded geometric error, and an empirical selection rule gives a target count without choosing the features. Contours describe relief, aggregation changes statistics, diffusion changes area, and planar adjacency constrains map colouring.",
      "items": [
        {
          "num": "7.1",
          "kind": "Definition",
          "name": "Map scale and the representative fraction",
          "deps": [
            "geog-3.3"
          ],
          "refs": [
            "USGS Maps Booklet (1994), scale and map detail",
            "Snyder (1987), §7, spherical Mercator scale"
          ],
          "pic": "Choose the reference denominator, enlargement and latitude. The upper panel compares local Mercator scale factors; the lower panel measures the ground metres represented by a calibrated one-centimetre map ruler at each latitude. The highlighted value is computed from the selected latitude, rather than treating the nominal equatorial scale as global."
        },
        {
          "num": "7.2",
          "kind": "Paradox",
          "name": "The coastline paradox",
          "deps": [
            "geog-7.1"
          ],
          "refs": [
            "Fractal Foundation, Koch Curve and Coastlines, construction activity",
            "Rothman, MIT12.006J (2022), Lecture23, pp2–3, self-similar scaling"
          ],
          "pic": "Refine the actual finite Koch polyline. Its length is measured by summing its generated segment lengths. Each lower-panel point comes from a separately generated level; the highlighted canonical ruler length is the segment length at the selected level. This is a constructed boundary, not a measured national coastline."
        },
        {
          "num": "7.3",
          "kind": "Algorithm",
          "name": "Douglas–Peucker line simplification",
          "deps": [
            "geog-7.1"
          ],
          "refs": [
            "Dodgson–Robinson, Cambridge Computer Graphics & Image Processing (2013), slides76–77",
            "Clayton, NOAA NOS112 (1985), pp13–15, endpoint-fitting routines"
          ],
          "pic": "Select a deterministic polyline and move the tolerance. The original is faint, the computed simplification is thick, and retained vertices are marked. The lower panel compares the actual worst terminal-subchain deviation with the chosen tolerance. Zero tolerance and a returning loop expose degenerate cases."
        },
        {
          "num": "7.4",
          "kind": "Law",
          "name": "Töpfer’s radical law of selection",
          "deps": [
            "geog-7.1"
          ],
          "refs": [
            "Töpfer–Pillewizer (1966), The Principles of Selection, publisher abstract",
            "Clayton, NOAA NOS112 (1985), p5, equation1 and selection limitation"
          ],
          "pic": "Shrink the derived map and compare all source symbols with the selected subset. The target count comes from the radical rule; synthetic town sizes provide a separate ranking. Labels give both the unrounded target and the integer actually drawn. Equal scales preserve every town. Fixed-size symbols can still overlap at large reductions: the count rule alone does not solve placement."
        },
        {
          "num": "7.5",
          "kind": "Concept",
          "name": "Contours and the representation of relief",
          "deps": [
            "geog-7.1",
            "vcalc-3.3"
          ],
          "refs": [
            "USGS, US Topo Map Symbol Guide, contour paragraph",
            "Analytic level-set and surface-normal derivation supplied here"
          ],
          "pic": "Change the anisotropy of the analytic hill and the contour interval. Drag the probe to inspect its gradient; a short normal arrow crosses the analytic ellipse contour. Toggle hillshade and rotate its light azimuth to change illumination while all elevations stay fixed. The cross-section below plots actual terrain height along y=0."
        },
        {
          "num": "7.6",
          "kind": "Paradox",
          "name": "The modifiable areal unit problem",
          "deps": [
            "stat-1.7"
          ],
          "refs": [
            "Openshaw, The Modifiable Areal Unit Problem, CATMOG38, §III, pp8–10",
            "QMRG preserved original PDF, Figure1 and aggregation definitions"
          ],
          "pic": "Choose rows, columns or four square blocks, each with four zones, then compare a coarser two-zone split. The left panel retains all sixteen synthetic observations. The middle colors the actual zone average of y; the right plots the zone pairs used to compute Pearson correlation. Exposure totals and undefined-variance cases are reported explicitly."
        },
        {
          "num": "7.7",
          "kind": "Method",
          "name": "Density-equalizing cartograms",
          "deps": [
            "geog-3.6",
            "pde-1.4"
          ],
          "refs": [
            "Gastner–Newman (2004), PNAS101, pp7499–7501, equations1–11",
            "Exact separable Neumann heat solution and cumulative-flow derivation supplied here"
          ],
          "pic": "Change both initial density amplitudes and diffusion time. The left square shows the initial grid, colored by each cell’s exact population. The right shows its actual separable diffusion flow. Compare finite time with the exact uniform-density limit: only in that limit does each cell’s area equal its initial population fraction. The numbers compare independently calculated initial integrals and mapped areas."
        },
        {
          "num": "7.8",
          "kind": "Theorem",
          "name": "Four colour theorem for maps",
          "deps": [
            "graph-4.6.1a",
            "graph-5.1.1"
          ],
          "refs": [
            "Robertson–Sanders–Seymour–Thomas (1997), The Four-Colour Theorem, introduction",
            "Robin Thomas, The Four Color Theorem, author proof outline and map-adjacency convention"
          ],
          "pic": "Choose a map and vertex order. Region boundaries compute the adjacency graph: a corner contact alone creates no edge. Compare actual greedy colouring with bounded four-colour backtracking. The wheel has a three-colouring but a poor greedy order uses four; the four-region map requires four. Both the map and its dual show the computed colours, with the actual edge-conflict count."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      "n": 8,
      "title": "Spatial analysis",
      "summary": "Spatial analysis begins by stating what distance and neighborhood mean. Exact nearest-site geometry, weighted spatial association and covariance-based prediction answer different questions; none alone establishes a causal mechanism. Historical and explicitly synthetic examples distinguish observed locations from modeled contacts, migration and diffusion.",
      "items": [
        {
          "num": "8.1",
          "kind": "Principle",
          "name": "Tobler’s first law of geography",
          "deps": [
            "geog-1.4"
          ],
          "refs": [
            "Tobler (1970), A Computer Movie Simulating Urban Growth in the Detroit Region, public text transcription: local influence, impulse response and convolution",
            "Anselin, GeoDa Workbook, Global Spatial Autocorrelation (1), revised2020: Moran statistic, row-standardized lag and permutation inference"
          ],
          "links": {
            "originalText": "https://content-animation.org.uk/htmls/tobler.htm",
            "methods": "https://geodacenter.github.io/workbook/5a_global_auto/lab5a.html"
          },
          "pic": "Compare a smooth synthetic map with a checkerboard and independent noise. Every dot in the second panel is an actual pair from the displayed map, at its computed separation and half-squared difference. Change amplitude or the random seed to test how the pattern changes."
        },
        {
          "num": "8.2",
          "kind": "Definition",
          "name": "Spatial autocorrelation: Moran’s I",
          "deps": [
            "geog-8.1"
          ],
          "refs": [
            "Anselin, GeoDa Workbook, Global Spatial Autocorrelation (1), revised2020: Moran statistic, row-standardized lag and permutation inference"
          ],
          "links": {
            "methods": "https://geodacenter.github.io/workbook/5a_global_auto/lab5a.html"
          },
          "pic": "Choose a clustered, alternating, noisy or constant arrangement and rook or queen neighbors. Compare the map, actual lag scatter and199 seeded random reallocations. The orange line marks the observed statistic, and the readout gives an upper-tail Monte Carlo p-value."
        },
        {
          "num": "8.3",
          "kind": "Concept",
          "name": "Voronoi (Thiessen) polygons",
          "deps": [
            "geog-8.1",
            "xtal-1.11"
          ],
          "refs": [
            "XTAL1.11: half-space construction of a Wigner–Seitz cell"
          ],
          "pic": "Move the fifth site and the red query. Compare the nearest-site regions with all five actual distances and the computed cell areas. Place sites together to reveal a nonunique nearest-site assignment."
        },
        {
          "num": "8.4",
          "kind": "Method",
          "name": "Spatial interpolation: inverse-distance weighting, kriging",
          "deps": [
            "geog-8.2",
            "geog-8.3"
          ],
          "refs": [
            "GSTools1.7.0 documentation, Kriging overview: weighted prediction, unbiased constraint, covariance and measurement error"
          ],
          "links": {
            "methods": "https://geostat-framework.readthedocs.io/projects/gstools/en/v1.7.0/examples/05_kriging/index.html"
          },
          "pic": "Move the query over four synthetic samples. Compare IDW with ordinary kriging, and inspect the actual prediction weights. Change the distance exponent or covariance range and measurement-error variance; the surface and readout show the consequences."
        },
        {
          "num": "8.5",
          "kind": "Law",
          "name": "Distance decay",
          "deps": [
            "geog-8.1"
          ],
          "refs": [
            "Tobler (1970), A Computer Movie Simulating Urban Growth in the Detroit Region, public text transcription: local influence, impulse response and convolution",
            "Local radial-integration derivation supplied here"
          ],
          "links": {
            "historicalContext": "https://content-animation.org.uk/htmls/tobler.htm"
          },
          "pic": "Compare exponential and power-law decay and adjust their scale and exponent. The second panel integrates actual ring contributions within a finite radius-12 disk. Move the radius marker to distinguish a point's influence from accumulated influence."
        },
        {
          "num": "8.6",
          "kind": "Event",
          "name": "John Snow’s cholera map",
          "deps": [
            "geog-8.3"
          ],
          "refs": [
            "Snow (1855), On the Mode of Communication of Cholera, Broad Street investigation and map explanation; actual selected passages in UCLA John Snow archive",
            "HistData Snow.deaths and Snow.pumps, digital coordinates distributed through Rdatasets"
          ],
          "links": {
            "originalPassages": "https://epi-snow.ph.ucla.edu/Stream2_BSPoutbreak_a.html",
            "historicalCautions": "https://epi-snow.ph.ucla.edu/Stream2_BSPoutbreak_f.html",
            "deathCoordinates": "https://raw.githubusercontent.com/vincentarelbundock/Rdatasets/master/csv/HistData/Snow.deaths.csv",
            "pumpCoordinates": "https://raw.githubusercontent.com/vincentarelbundock/Rdatasets/master/csv/HistData/Snow.pumps.csv"
          },
          "pic": "Explore578 digitized death marks and13 pump locations from a transcription of the historical map. Choose a pump and compare Euclidean with city-block nearest-pump assignments. The highlighted region is an accessibility hypothesis, not a set of proven water exposures."
        },
        {
          "num": "8.7",
          "kind": "Model",
          "name": "Hägerstrand’s spatial diffusion of innovations",
          "deps": [
            "geog-8.5"
          ],
          "refs": [
            "Tobler (1970), A Computer Movie Simulating Urban Growth in the Detroit Region, public text transcription: local influence, impulse response and convolution; explicit connection to Hägerstrand’s mean information fields",
            "Modern finite contact-probability model and update convention derived here"
          ],
          "links": {
            "historicalConnection": "https://content-animation.org.uk/htmls/tobler.htm"
          },
          "pic": "Change the distance scale, social contacts and external information, then scrub through generations. New adopters are gold and earlier adopters blue. The fixed random seed reproduces a realization whose aggregate curve is calculated from actual adoption events."
        },
        {
          "num": "8.8",
          "kind": "Paper",
          "name": "Computer Movie Simulating Urban Growth in the Detroit Region",
          "paper": {
            "authors": "W. R. Tobler",
            "year": 1970,
            "title": "A Computer Movie Simulating Urban Growth in the Detroit Region",
            "venue": "Economic Geography 46: 234–240",
            "doi": "10.2307/143141"
          },
          "introduces": [
            "geog-8.1"
          ],
          "deps": [
            "geog-8.5"
          ],
          "refs": [
            "Tobler (1970), A Computer Movie Simulating Urban Growth in the Detroit Region, public text transcription: local influence, impulse response and convolution"
          ],
          "links": {
            "originalText": "https://content-animation.org.uk/htmls/tobler.htm"
          },
          "pic": "Explore an unfitted local-kernel movie, change its distance scale, redistribution and net growth, then advance the step slider. Compare the evolving map with the actual total population and the mass-balance prediction."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Location theory and urban systems',
      summary: String.raw`Classical location theory explains where activities settle by minimizing transport costs. Von Thünen's rings, Weber's least-cost point, Hotelling's clustering competitors and Christaller's hexagonal hierarchy of central places are idealized models with crisp predictions. Gravity models and Ravenstein's laws describe flows between places, and the sizes of cities follow Zipf's rank–size law, which Gibrat's random growth helps explain.`,
      items: [
        { num: '9.1', kind: 'Model', name: 'Von Thünen’s model of agricultural land use', deps: ['geog-8.5'], refs: ['Haggett'],
          pic: 'Draw bid-rent lines for crops with different yields and transport costs: the highest line at each distance wins, producing concentric rings around the market that shift when a road or river is added.' },
        { num: '9.2', kind: 'Model', name: 'Weber’s industrial location and the Fermat–Weber point', deps: ['geog-1.4'], refs: ['Haggett'],
          pic: 'Place two raw-material sources and a market with weights: the least-transport-cost plant location is found by Weiszfeld’s iteration, and it snaps onto a corner when one weight dominates.' },
        { num: '9.3', kind: 'Model', name: 'Hotelling’s law of spatial competition', deps: ['geog-9.2'], refs: ['Haggett'],
          pic: 'Two ice-cream sellers on a beach move to grab more customers: they converge to the middle side by side, even though spreading out would serve the customers better.' },
        { num: '9.4', kind: 'Model', name: 'Christaller’s central place theory', deps: ['geog-9.1', 'geog-8.3'], refs: ['Haggett'],
          pic: 'Scatter villages on a plain and let each good have a range and threshold: market areas become hexagons, and higher-order centres emerge in a nested hierarchy with the k = 3, 4 or 7 arrangement you select.' },
        { num: '9.5', kind: 'Theorem', name: 'Hexagons are the most efficient market areas', deps: ['geog-9.4'], refs: ['Haggett'],
          pic: 'Tile the plain with circles, triangles, squares or hexagons around centres: circles leave gaps or overlap, and among tilings the hexagon has the smallest mean travel distance, read out for each.' },
        { num: '9.6', kind: 'Model', name: 'Gravity model of spatial interaction', deps: ['geog-8.5'], refs: ['Haggett'],
          pic: 'Predict flows between cities as P₁P₂/dᵝ: drag cities and change populations to see the flow lines thicken, and fit β to synthetic trip data on a log–log plot.' },
        { num: '9.7', kind: 'Law', name: 'Reilly’s law and the Huff model of retail gravitation', deps: ['geog-9.6'], refs: ['Haggett'],
          pic: 'Two shopping towns compete for customers: the breaking point between them shifts toward the smaller town, and Huff’s probabilistic version shades each location by its chance of choosing each town.' },
        { num: '9.8', kind: 'Law', name: 'Ravenstein’s laws of migration', deps: ['geog-9.6'], refs: ['Haggett'],
          pic: 'Simulate migrants moving between towns with distance-decaying choices: most moves are short, long moves head for big cities, and each stream generates a smaller counter-stream, as Ravenstein observed in 1885.' },
        { num: '9.9', kind: 'Law', name: 'Zipf’s law for city sizes (rank–size rule)', deps: [], refs: ['Haggett'],
          pic: 'Plot city populations against rank on log axes for several countries: points fall near a line of slope −1, and primate-city countries like France are shown departing at the top.' },
        { num: '9.10', kind: 'Model', name: 'Gibrat’s law of proportionate growth', deps: ['geog-9.9'], refs: ['Haggett'],
          pic: 'Let cities grow by random percentage shocks independent of size, with a small lower barrier: the size distribution evolves into a power law with exponent near 1, reproducing Zipf’s plot.' },
        { num: '9.11', kind: 'Model', name: 'Bid-rent theory and concentric urban zones', deps: ['geog-9.1'], refs: ['Haggett'],
          pic: 'Offices, shops and housing bid for land around a city centre: their bid-rent curves cross to form Burgess-style rings, and adding a ring road or a second centre bends the pattern toward Harris–Ullman nuclei.' },
      ],
    },
  ],
};
