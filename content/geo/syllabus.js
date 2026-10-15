// Syllabus — Atmosphere & Ocean Dynamics (curated course; see collection.js for references)
// Refs: "Vallis" = Vallis, Essentials of Atmospheric and Oceanic Dynamics (2019); "Pierrehumbert" = Principles
// of Planetary Climate (2010). Chapter numbers of both could not be verified online during the research
// pass (publisher pages refused access), so refs are author-level.
//
// Sources consulted (research pass, 2026-10):
//   - MIT OCW 12.003 Atmosphere, Ocean and Climate Dynamics (Fall 2008) calendar (lapse rates, potential
//     temperature, moist convection, rotating equations, inertial motion, geostrophy, Taylor–Proudman,
//     thermal wind, Ekman layers, general circulation, wind-driven and abyssal ocean circulation, energy budget):
//     https://ocw.mit.edu/courses/12-003-atmosphere-ocean-and-climate-dynamics-fall-2008/pages/calendar/
//   - Existing `fluid`, `ode`, `pde`, `mech` syllabi in this repository (for cross-links and to avoid duplication)
//   - Wikipedia: https://en.wikipedia.org/wiki/List_of_scientific_laws_named_after_people (Buys Ballot's law)
// Gaps filled after comparison: ocean equation of state and stratification, Buys Ballot, gradient and
// cyclostrophic wind, geostrophic adjustment and the deformation radius, Sverdrup balance and western
// intensification, coastal and equatorial Kelvin waves, tides and amphidromes, Eady baroclinic instability,
// Rhines scale, Held–Hou Hadley cell, Stommel–Arons abyssal circulation, ensemble forecasting.
// Deliberate omissions: stratospheric dynamics (sudden warmings, QBO) and detailed boundary-layer turbulence;
// El Niño and the thermohaline bistability are treated in `climate`.
export default {
  collection: 'geo',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Vertical structure: hydrostatics, lapse rates and stability',
      summary: String.raw`The atmosphere and ocean are thin layers held down by gravity, so pressure is nearly hydrostatic and falls exponentially with height. A rising parcel cools at the dry adiabatic lapse rate until water condenses and releases latent heat; comparing the parcel with its surroundings decides whether the air is stable, which the buoyancy frequency measures. The ocean's density depends nonlinearly on temperature and salinity, setting its own stratification.`,
      items: [
        { num: '1.1', kind: 'Law', name: 'Hydrostatic balance and scale height', deps: ['fluid-2.2', 'pchem-1.10'], refs: ['Vallis', 'Pierrehumbert'],
          pic: 'Integrate pressure upward through an isothermal or real temperature profile: pressure falls by e every scale height RT/g ≈ 8 km, and half the atmosphere’s mass lies below 5.5 km.' },
        { num: '1.2', kind: 'Law', name: 'Dry adiabatic lapse rate', deps: ['geo-1.1', 'pchem-2.7'], refs: ['Pierrehumbert', 'Vallis'],
          pic: 'Lift a dry parcel and let it expand without exchanging heat: its temperature falls at g/c_p ≈ 9.8 K/km, plotted against the environmental profile you draw.' },
        { num: '1.3', kind: 'Definition', name: 'Potential temperature', deps: ['geo-1.2'], refs: ['Pierrehumbert', 'Vallis'],
          pic: 'Bring parcels from different heights adiabatically to 1000 hPa: their potential temperatures are read out, constant along a dry adiabat and increasing upward when the air is stable.' },
        { num: '1.4', kind: 'Definition', name: 'Static stability and the buoyancy frequency', deps: ['geo-1.3', 'fluid-9.9'], refs: ['Vallis'],
          pic: 'Displace a parcel vertically in a profile of adjustable lapse rate: it oscillates at the Brunt–Väisälä frequency when stable, sits neutral on an adiabat and runs away when the lapse rate exceeds it.' },
        { num: '1.5', kind: 'Law', name: 'Saturation vapour pressure and the Clausius–Clapeyron relation', deps: ['pchem-4.4'], refs: ['Pierrehumbert'],
          pic: 'Warm air from −20 °C to 35 °C: the saturation vapour pressure grows about 7 % per kelvin, tripling between 10 °C and 30 °C, and a parcel’s relative humidity is read off the curve.' },
        { num: '1.6', kind: 'Proposition', name: 'Moist adiabatic lapse rate', deps: ['geo-1.2', 'geo-1.5'], refs: ['Pierrehumbert'],
          pic: 'Lift a saturated parcel: latent heat release slows its cooling to about 4 K/km in warm humid air and nearly to the dry rate in cold air, both computed along a skew-T diagram.' },
        { num: '1.7', kind: 'Method', name: 'Parcel theory: LCL, CAPE and convective instability', deps: ['geo-1.6', 'geo-1.4'], refs: ['Pierrehumbert'],
          pic: 'Lift a surface parcel on a sounding you edit: it reaches saturation at the lifting condensation level, the area where it is warmer than its surroundings is shaded as CAPE, and the maximum updraft √(2·CAPE) is read out.' },
        { num: '1.8', kind: 'Phenomenon', name: 'Föhn winds', deps: ['geo-1.6'], refs: ['Pierrehumbert'],
          pic: 'Push moist air over a mountain range: it cools moist-adiabatically on the way up and rains out, then descends dry-adiabatically, arriving warmer and drier than it started.' },
        { num: '1.9', kind: 'Model', name: 'Seawater equation of state', deps: [], refs: ['Vallis'],
          pic: 'Plot density contours over temperature and salinity: they curve, so mixing two water masses of equal density produces denser water (cabbeling), and the thermal expansion coefficient shrinks toward freezing.' },
        { num: '1.10', kind: 'Phenomenon', name: 'Ocean stratification and the thermocline', deps: ['geo-1.9', 'geo-1.4'], refs: ['Vallis'],
          pic: 'Show a measured ocean temperature profile: a warm mixed layer, a sharp thermocline and cold abyss, with the buoyancy frequency computed from the density profile and a wind slider deepening the mixed layer.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Rotation',
      summary: String.raw`On a rotating planet, motions slower than a day feel the Coriolis force, set by the local vertical component of the Earth's spin. Free motions become inertial circles, the Rossby number measures how much rotation matters, and the β effect — the change of the Coriolis parameter with latitude — is the seed of large-scale wave dynamics. Strong rotation also makes flows nearly two-dimensional, as the Taylor–Proudman theorem says.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Coriolis parameter f = 2Ω sin φ', deps: ['mech-9.8', 'geog-1.2'], refs: ['Vallis'],
          pic: 'Drag an observer from pole to equator: the local vertical component of the Earth’s rotation vector shrinks as sin φ, and f changes sign across the equator, drawn on a rotating globe.' },
        { num: '2.2', kind: 'Phenomenon', name: 'Inertial oscillations', deps: ['geo-2.1', 'mech-9.11'], refs: ['Vallis'],
          pic: 'Give a frictionless parcel a push: it circles clockwise in the north with period 2π/f — about 17 hours at 45° — compared with measured ocean current records after a storm.' },
        { num: '2.3', kind: 'Definition', name: 'Rossby number', deps: ['geo-2.1', 'fluid-3.10'], refs: ['Vallis'],
          pic: 'Slide the length and velocity scales of a flow from a bathtub vortex to a weather system: Ro = U/fL falls from thousands to below one, colouring where rotation dominates.' },
        { num: '2.4', kind: 'Model', name: 'Equations of motion on the sphere and the β-plane', deps: ['geo-2.1', 'fluid-6.4'], refs: ['Vallis'],
          pic: 'Zoom into a patch of the rotating sphere: f is approximated as f₀ + βy, and the error of the f-plane and β-plane approximations is mapped as the patch grows.' },
        { num: '2.5', kind: 'Concept', name: 'Effective gravity: centrifugal force folded into g', deps: ['geo-2.1', 'geog-1.6'], refs: ['Vallis'],
          pic: 'Add gravitational and centrifugal accelerations at each latitude: the effective plumb line tilts by up to 0.1°, and the Earth’s equilibrium shape is normal to it, so the centrifugal term vanishes from the equations.' },
        { num: '2.6', kind: 'Paradox', name: 'The bathtub-vortex myth', deps: ['geo-2.3'], refs: ['Vallis'],
          pic: 'Drain a basin with a residual swirl you control: the Coriolis effect is a thousandfold too weak to set the direction unless the water is left still for a day, as in the careful experiments of Shapiro and Trefethen.' },
        { num: '2.7', kind: 'Theorem', name: 'Taylor–Proudman theorem and Taylor columns', deps: ['geo-2.3', 'fluid-3.11'], refs: ['Vallis'],
          pic: 'Tow an obstacle along the floor of a rapidly rotating tank: fluid above it moves as a rigid column all the way up, and lowering the rotation rate lets the column break up.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Balanced flow: geostrophy and thermal wind',
      summary: String.raw`Away from the equator and the boundaries, large-scale winds and currents blow along isobars, with the pressure gradient balanced by the Coriolis force. Curvature adds centrifugal terms (gradient and cyclostrophic wind), horizontal temperature gradients make the geostrophic wind change with height (thermal wind), and a disturbed fluid adjusts to balance over the Rossby deformation radius.`,
      items: [
        { num: '3.1', kind: 'Law', name: 'Geostrophic balance', deps: ['geo-2.3', 'fluid-3.10'], refs: ['Vallis'],
          pic: 'Draw isobars on a weather map: geostrophic wind arrows run parallel to them with speed set by their spacing, and moving toward the equator makes the same gradient drive ever faster winds.' },
        { num: '3.2', kind: 'Law', name: 'Buys Ballot’s law', deps: ['geo-3.1'], refs: ['Vallis'],
          pic: 'Stand with your back to the wind on a simulated map: low pressure is on your left in the northern hemisphere and on your right in the southern, flipping as you drag the map across the equator.' },
        { num: '3.3', kind: 'Proposition', name: 'Gradient wind and cyclostrophic balance', deps: ['geo-3.1'], refs: ['Vallis'],
          pic: 'Curve the isobars into a circle of adjustable radius: the gradient wind is sub-geostrophic around lows and super-geostrophic around highs, with a maximum allowed high-pressure gradient, and a tornado preset is purely cyclostrophic.' },
        { num: '3.4', kind: 'Theorem', name: 'Thermal wind balance', deps: ['geo-3.1', 'geo-1.1'], refs: ['Vallis'],
          pic: 'Impose a pole-to-equator temperature gradient: thickness between pressure surfaces is larger where it is warm, the geostrophic wind grows with height in proportion, and reversing the gradient reverses the shear.' },
        { num: '3.5', kind: 'Phenomenon', name: 'Jet streams', deps: ['geo-3.4'], refs: ['Vallis'],
          pic: 'Integrate the thermal wind upward through a sharp mid-latitude temperature front: a westerly jet peaking near the tropopause emerges, and its speed tracks the front’s strength as you sharpen it.' },
        { num: '3.6', kind: 'Phenomenon', name: 'Friction and cross-isobar flow', deps: ['geo-3.1'], refs: ['Vallis'],
          pic: 'Add surface friction to geostrophic balance: the wind slows and turns toward low pressure by an angle that grows with friction, making air converge into lows and diverge from highs.' },
        { num: '3.7', kind: 'Phenomenon', name: 'Geostrophic adjustment and the Rossby deformation radius', deps: ['geo-3.1', 'fluid-9.6'], refs: ['Vallis'],
          pic: 'Release a step in sea-surface height in a rotating shallow-water model: gravity waves radiate away and leave a geostrophically balanced front whose width equals √(gH)/f, unlike the non-rotating case where it flattens completely.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Ekman layers',
      summary: String.raw`Near surfaces, friction breaks geostrophic balance. In the Ekman layer the balance among friction, Coriolis and pressure forces twists the current into a spiral, and the net transport runs at right angles to the wind. Converging and diverging Ekman transports pump water vertically, which drives coastal upwelling, spins down vortices and sets the ocean's wind-driven circulation in motion.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Ekman spiral', deps: ['fluid-8.11', 'geo-2.1'], refs: ['Vallis'],
          pic: 'Blow wind over a rotating ocean with eddy viscosity: the current turns 45° from the wind at the surface and spirals clockwise and weaker with depth, reversing at the Ekman depth.' },
        { num: '4.2', kind: 'Theorem', name: 'Ekman transport is perpendicular to the wind', deps: ['geo-4.1'], refs: ['Vallis'],
          pic: 'Integrate the spiral over depth: the net transport is exactly 90° to the right of the wind in the north with magnitude τ/ρf, independent of the assumed viscosity profile.' },
        { num: '4.3', kind: 'Phenomenon', name: 'Ekman pumping and suction', deps: ['geo-4.2', 'vcalc-3.4'], refs: ['Vallis'],
          pic: 'Apply a wind pattern with curl: Ekman transports converge or diverge, and the computed vertical velocity at the base of the layer pushes the thermocline down under anticyclonic winds and up under cyclonic ones.' },
        { num: '4.4', kind: 'Phenomenon', name: 'Coastal upwelling', deps: ['geo-4.2'], refs: ['Vallis'],
          pic: 'Blow an alongshore wind past a coast: Ekman transport carries surface water offshore, cold nutrient-rich water wells up within a deformation radius of the coast, and reversing the wind causes downwelling.' },
        { num: '4.5', kind: 'Phenomenon', name: 'Spin-down of a rotating fluid', deps: ['geo-4.3', 'geo-2.7'], refs: ['Vallis'],
          pic: 'Stop stirring a rotating tank: the interior decays in a few rotation periods via Ekman-layer circulation, far faster than viscous diffusion alone, and the tea leaves gather in the centre.' },
        { num: '4.6', kind: 'Phenomenon', name: 'Equatorial upwelling', deps: ['geo-4.2'], refs: ['Vallis'],
          pic: 'Let easterly trades blow along the equator: Ekman transport goes poleward on both sides because f changes sign, and the divergence draws cold water up into a tongue visible on sea-surface temperature maps.' },
      ],
    },
  ],
};
