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
        { num: '1.4', kind: 'Proposition', name: 'Great-circle distance (haversine formula)', deps: ['geog-1.3'], refs: ['Snyder §5'],
          pic: 'Pick two points: the central angle is computed by the spherical law of cosines and by the haversine formula, and for nearby points the cosine version visibly loses digits while haversine stays accurate.' },
        { num: '1.5', kind: 'Theorem', name: 'Spherical triangles and Girard’s theorem', deps: ['geog-1.3', 'dg-10.2'], refs: ['Snyder §5'],
          pic: 'Draw a triangle of great circles on a globe: its angles sum to more than 180°, and the excess equals the area divided by R², reaching 270° for the octant with three right angles.' },
        { num: '1.6', kind: 'Model', name: 'The Earth as an oblate ellipsoid', deps: ['mech-9.7', 'geog-1.2'], refs: ['Snyder §3'],
          pic: 'Spin a fluid planet faster with a slider: it flattens, and at Earth’s rate the computed flattening (about 1/300) matches the measured difference between equatorial and polar radii.' },
        { num: '1.7', kind: 'Definition', name: 'Geodetic, geocentric and parametric latitude', deps: ['geog-1.6'], refs: ['Snyder §3'],
          pic: 'On an exaggerated ellipse, draw the surface normal and the line to the centre from a point: their angles with the equator differ by up to 0.19° on Earth (about 21 km), plotted against latitude.' },
        { num: '1.8', kind: 'Concept', name: 'The geoid and geodetic datums', deps: ['geog-1.6'], refs: ['Snyder §3'],
          pic: 'Exaggerate the geoid’s bumps by 10,000 times over the reference ellipsoid: switching between datums such as NAD27 and WGS84 moves the coordinates of a landmark by tens of metres on the map.' },
        { num: '1.9', kind: 'Invention', name: 'The marine chronometer and the longitude problem', deps: ['geog-1.2'], refs: ['Haggett'],
          pic: 'Sail a simulated voyage with a clock of adjustable daily drift: each second of clock error is converted into a longitude error, and Harrison’s H4 is compared with a pendulum clock on a rolling deck.' },
        { num: '1.10', kind: 'Invention', name: 'GPS positioning by trilateration', deps: ['geog-1.6', 'rel-6.9'], refs: ['Haggett'],
          pic: 'Intersect spheres around satellites you can drag: four ranges fix position and receiver clock error, and switching off the relativistic clock correction makes the computed position drift by kilometres per day.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Navigation on the sphere',
      summary: String.raw`A ship holding a constant compass bearing does not follow the shortest path: it traces a loxodrome that spirals toward the pole. Comparing rhumb lines with great circles, and fixing position by dead reckoning, celestial sights and triangulation, shows how the geometry of the sphere governs travel and surveying.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Loxodromes (rhumb lines)', deps: ['geog-1.2'], refs: ['Snyder §7'],
          pic: 'Steer a ship at a fixed bearing on a globe: its track crosses every meridian at the same angle and spirals infinitely many times around the pole while reaching it in finite length.' },
        { num: '2.2', kind: 'Proposition', name: 'Great circle versus rhumb line', deps: ['geog-2.1', 'geog-1.4'], refs: ['Snyder §5', 'Snyder §7'],
          pic: 'Pick two ports: both routes are drawn with their lengths, the great circle’s bearing changes continuously while the rhumb line’s does not, and the saving is largest for long east–west voyages at high latitude.' },
        { num: '2.3', kind: 'Method', name: 'Dead reckoning', deps: ['geog-2.1'], refs: ['Haggett'],
          pic: 'Integrate a ship’s logged speed and heading with random errors and an unknown current: the estimated position wanders away from the true track inside a growing error ellipse.' },
        { num: '2.4', kind: 'Method', name: 'Celestial navigation: latitude from the pole star and noon Sun', deps: ['geog-1.2'], refs: ['Haggett'],
          pic: 'Move an observer north and south: Polaris rises to an altitude equal to the latitude, and the noon Sun’s altitude plus the season’s declination gives the same answer.' },
        { num: '2.5', kind: 'Method', name: 'Triangulation surveying', deps: ['geog-1.5'], refs: ['Haggett'],
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
        { num: '3.4', kind: 'Theorem', name: 'Tissot’s indicatrix', deps: ['geog-3.3', 'ladr-7.70'], refs: ['Snyder §4'],
          pic: 'Scatter small circles over the globe and project them: each becomes an ellipse whose semi-axes are the singular values of the projection’s derivative, revealing the distortion pattern at a glance.' },
        { num: '3.5', kind: 'Proposition', name: 'Conformal maps turn small circles into circles', deps: ['geog-3.4'], refs: ['Snyder §4'],
          pic: 'Switch among projections: for the conformal ones every indicatrix stays a circle (only its size changes) and angles between curves are preserved, measured live where two roads cross.' },
        { num: '3.6', kind: 'Proposition', name: 'Equal-area maps keep the indicatrix area constant', deps: ['geog-3.4', 'ladr-7.111'], refs: ['Snyder §4'],
          pic: 'On an equal-area projection the indicatrices stretch into ellipses of very different shapes but identical areas, shown by the product of the singular values staying at 1.' },
        { num: '3.7', kind: 'Theorem', name: 'No map is both conformal and equal-area', deps: ['geog-3.5', 'geog-3.6', 'geog-3.2'], refs: ['Snyder §4'],
          pic: 'Force both axes of the indicatrix to 1 everywhere: the map would be an isometry, which the Theorema Egregium forbids, and the app shows any attempt developing distortion somewhere.' },
        { num: '3.8', kind: 'Theorem', name: 'Chebyshev’s theorem on optimal conformal maps', deps: ['geog-3.5'], refs: ['Snyder §4'],
          pic: 'Draw a region on the globe and optimise a conformal projection for it: the scale error is minimized when the scale factor is constant along the region’s boundary, shown by the scale contours hugging the outline.' },
      ],
    },
  ],
};
