// Bridge: one idea followed across collections and fields (MASTER_PLAN.md §8).
export default {
  slug: 'map-distortion',
  title: 'Map distortion: what does a change of coordinates preserve?',
  blurb: String.raw`The derivative of a map tells us how a small circle becomes an ellipse. Linear algebra separates its two stretches, calculus multiplies them into area change, and cartography uses both to explain why a world map must choose what to preserve.`,
  steps: [
    { id: 'ladr-7.70', note: String.raw`The singular value decomposition resolves a linear map into perpendicular input and output directions with separate stretch factors. Applied to a derivative, it describes the local deformation of any smooth map.` },
    { id: 'vcalc-4.5', note: String.raw`The absolute Jacobian determinant is the local area factor. In two dimensions it is the product of those singular values, so area change and shape change are different measurements.` },
    { id: 'geog-3.4', note: String.raw`Tissot’s indicatrix draws the calculation on the Earth: an infinitesimal circle in the sphere’s tangent plane becomes an ellipse on the map. Its axes show maximum and minimum scale, and their ratio controls angular distortion.` },
    { id: 'rca-14.2', note: String.raw`A complex analytic map with nonzero derivative has a special local deformation: multiplication by one complex number rotates and scales equally in every direction, preserving angles.` },
    { id: 'geog-4.2', note: String.raw`Mercator enforces that equal-direction scaling on a cylinder. Its scale is $\sec\varphi$ at latitude $\varphi$, so local shape is preserved while area grows by $\sec^2\varphi$ toward the poles.` },
    { id: 'geog-3.6', note: String.raw`An equal-area projection chooses a different invariant: the product of the two stretches stays constant. Its indicatrices may be long thin ellipses even though they all have the same area.` },
    { id: 'geog-3.7', note: String.raw`Preserving both angles and area on an open spherical region would force both stretches to be the same constant, a local similarity between sphere and plane. Their incompatible curvature makes that impossible.` },
    { id: 'geog-5.2', note: String.raw`Stereographic projection is another deliberate choice: it preserves angles and sends circles to circles or lines, while its scale changes with distance from the map center. Its inverse also builds the Riemann sphere used in complex analysis.` },
  ],
};
