// Syllabus — Climate Science (curated course; see collection.js for references)
// Refs: "Archer" = Archer, Global Warming: Understanding the Forecast (2nd ed.) — chapters verified from the
// publisher's contents: 1 humankind and climate, 2 blackbody radiation, 3 the layer model, 4 greenhouse gases,
// 5 what holds the atmosphere up?, 6 weather and climate, 7 feedbacks, 8 carbon on Earth, 9 fossil fuels and
// energy, 10 the perturbed carbon cycle, 11 the smoking gun, 12 potential climate impacts, 13 decisions.
// "IPCC AR6 WG1" chapter-level (2 changing state, 3 human influence, 4 future climate, 5 carbon cycle,
// 7 energy budget/feedbacks/sensitivity, 8 water cycle, 9 ocean/cryosphere/sea level, 11 extremes; numbering
// from the published report, not re-verified online because ipcc.ch refused automated access).
// "Pierrehumbert" = Principles of Planetary Climate (author-level).
//
// Sources consulted (research pass, 2026-10):
//   - Archer 2e contents: https://media.wiley.com/product_data/excerpt/16/04709434/0470943416-4.pdf
//   - MIT OCW 12.003 calendar (radiation budget, greenhouse I/II, energy budgets):
//     https://ocw.mit.edu/courses/12-003-atmosphere-ocean-and-climate-dynamics-fall-2008/pages/calendar/
//   - Wikipedia: https://en.wikipedia.org/wiki/IPCC_Sixth_Assessment_Report (13 WG1 chapters; ECS 2.5–4 °C,
//     best estimate 3 °C)
//   - Existing `thermo`, `geo`, `geol`, `pchem`, `qchem`, `ode`, `ctrl` syllabi in this repository
// Gaps filled after comparison: Kirchhoff's law and greybody layers, Schwarzschild radiative transfer,
// radiative–convective equilibrium, the runaway greenhouse limit, GWP, TCR vs ECS, Roe–Baker fat tail,
// Daisyworld, critical slowing down, Stommel box bistability, two-layer ocean model, Earth's energy
// imbalance, sea-level components, Revelle factor, the long tail of CO₂, TCRE and carbon budgets,
// the 100-kyr problem, spectral analysis of orbital cycles, stratospheric-cooling fingerprint, termination shock.
// Deliberate omissions: impacts, economics and policy (Archer ch. 12–13; better placed in economics),
// regional downscaling (AR6 ch. 10, 12) and short-lived-forcer chemistry beyond the basic forcings.
export default {
  collection: 'climate',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Radiation and the planetary energy balance',
      summary: String.raw`A planet's temperature is set by a balance between absorbed sunlight and emitted infrared. Planck's law and its consequences — Stefan–Boltzmann and Wien — separate the short-wave solar spectrum from the long-wave terrestrial one, the albedo decides how much sunlight is kept, and the zero-dimensional balance gives an effective temperature of 255 K for Earth. Insolation varies with latitude and season, and the faint young Sun poses the first puzzle.`,
      items: [
        { num: '1.1', kind: 'Law', name: 'Planck’s law and blackbody spectra', deps: ['thermo-9.4'], refs: ['Archer ch. 2', 'Pierrehumbert'],
          pic: 'Plot blackbody spectra for 5800 K and 288 K on a log wavelength axis: they barely overlap, which is why climate science can treat incoming sunlight and outgoing infrared separately.' },
        { num: '1.2', kind: 'Law', name: 'Stefan–Boltzmann law', deps: ['climate-1.1', 'thermo-9.6'], refs: ['Archer ch. 2'],
          pic: 'Integrate the Planck curve numerically at a temperature you choose: the area grows as σT⁴, so a 1 % rise in temperature means about 4 % more emission.' },
        { num: '1.3', kind: 'Law', name: 'Wien’s displacement law', deps: ['climate-1.1', 'thermo-9.5'], refs: ['Archer ch. 2'],
          pic: 'Drag the temperature slider from a lava flow to the Sun: the spectral peak moves as 2898 μm·K / T, from 10 μm for Earth to 0.5 μm for the Sun.' },
        { num: '1.4', kind: 'Law', name: 'Kirchhoff’s law: emissivity equals absorptivity', deps: ['climate-1.1', 'thermo-9.1'], refs: ['Pierrehumbert'],
          pic: 'Put a grey slab with adjustable absorptivity in a cavity: it reaches equilibrium only if it emits with the same efficiency it absorbs, wavelength by wavelength, and breaking the equality would drive a perpetual heat flow.' },
        { num: '1.5', kind: 'Definition', name: 'Solar constant and planetary albedo', deps: ['astro-4.2', 'energy-4.1'], refs: ['Archer ch. 2', 'Pierrehumbert'],
          pic: 'Move a planet’s orbit and change its surface cover: the solar constant scales as 1/d², and the albedo slider shows absorbed sunlight S(1 − α)/4 averaged over the sphere.' },
        { num: '1.6', kind: 'Model', name: 'Zero-dimensional energy balance and effective temperature', deps: ['climate-1.2', 'climate-1.5'], refs: ['Archer ch. 3', 'Pierrehumbert'],
          pic: 'Balance absorbed sunlight against σT⁴: Earth’s effective temperature comes out at 255 K, 33 K colder than the observed surface, the gap the greenhouse effect must explain.' },
        { num: '1.7', kind: 'Phenomenon', name: 'Effective versus surface temperatures of the planets', deps: ['climate-1.6'], refs: ['Pierrehumbert'],
          pic: 'Compare Venus, Earth, Mars and Titan: computed effective temperatures against measured surface ones show warming of 500 K, 33 K, a few K and about 10 K, ordering the strength of each greenhouse.' },
        { num: '1.8', kind: 'Phenomenon', name: 'Insolation by latitude and season', deps: ['climate-1.5', 'energy-4.2', 'geog-1.2'], refs: ['Pierrehumbert'],
          pic: 'Compute daily-mean top-of-atmosphere insolation as a latitude–season map: the summer pole receives more than the equator at solstice, and setting obliquity to zero removes the seasons.' },
        { num: '1.9', kind: 'Phenomenon', name: 'Thermal inertia and the seasonal lag', deps: ['climate-1.6', 'sig-6.8'], refs: ['Pierrehumbert'],
          pic: 'Force a slab of adjustable heat capacity with seasonal sunshine: deep oceans lag the forcing by up to three months and damp the swing, while land responds quickly, reproducing continental versus maritime climates.' },
        { num: '1.10', kind: 'Paradox', name: 'The faint young Sun paradox', deps: ['climate-1.6'], refs: ['Pierrehumbert'],
          pic: 'Dim the Sun to 70 % as it was 4 billion years ago: the zero-dimensional Earth freezes solid, contradicting geological evidence of liquid water, until a stronger greenhouse slider rescues it.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'The greenhouse effect',
      summary: String.raw`The atmosphere is nearly transparent to sunlight but absorbs infrared, so the surface is warmed by downward radiation from above. Layer models show the effect in its simplest form; molecular physics explains why CO₂ and water vapour absorb while N₂ and O₂ do not; and the radiative-transfer picture locates the real mechanism in the emission height and the lapse rate. Band saturation makes CO₂ forcing logarithmic, radiative–convective equilibrium sets the temperature profile, and too much water vapour leads to a runaway.`,
      items: [
        { num: '2.1', kind: 'Model', name: 'Single-layer greenhouse model', deps: ['climate-1.6', 'climate-1.4'], refs: ['Archer ch. 3'],
          pic: 'Add a glass layer transparent to sunlight but opaque to infrared: the surface warms to 2^(1/4) times the effective temperature, and energy fluxes are drawn as arrows that balance at every level.' },
        { num: '2.2', kind: 'Model', name: 'Multi-layer and grey-atmosphere models', deps: ['climate-2.1'], refs: ['Archer ch. 3', 'Pierrehumbert'],
          pic: 'Stack n layers or vary a partial infrared absorptivity: the surface temperature rises as (n + 1)^(1/4) or with the absorptivity, overshooting Earth unless convection is added.' },
        { num: '2.3', kind: 'Concept', name: 'Why CO₂ and H₂O absorb infrared but N₂ and O₂ do not', deps: ['qchem-9.7', 'qchem-8.10'], refs: ['Archer ch. 4'],
          pic: 'Animate the vibrational modes of N₂, O₂, CO₂ and H₂O: only modes that change the dipole moment light up as infrared-active, so the symmetric diatomics stay transparent.' },
        { num: '2.4', kind: 'Phenomenon', name: 'The 15 μm CO₂ band and the atmospheric window', deps: ['climate-2.3', 'climate-1.1'], refs: ['Archer ch. 4'],
          pic: 'Overlay Earth’s outgoing spectrum on blackbody curves: a deep bite at 15 μm emitted from the cold upper troposphere, an ozone notch at 9.6 μm, and the 8–12 μm window where the surface shines through.' },
        { num: '2.5', kind: 'Definition', name: 'Optical depth and the Beer–Lambert law in the atmosphere', deps: ['qchem-9.13', 'geo-1.1'], refs: ['Pierrehumbert'],
          pic: 'Send a beam up through an exponentially thinning absorber: transmission falls as e^(−τ), and the level where τ ≈ 1 seen from space is marked as the emission height for each wavelength.' },
        { num: '2.6', kind: 'Law', name: 'Schwarzschild’s equation of radiative transfer', deps: ['climate-2.5', 'climate-1.4'], refs: ['Pierrehumbert'],
          pic: 'Integrate the radiance upward layer by layer, each absorbing and re-emitting at its own temperature: the outgoing spectrum is computed, and making the upper layers isothermal erases the greenhouse effect entirely.' },
        { num: '2.7', kind: 'Principle', name: 'Emission height and the lapse-rate picture of the greenhouse effect', deps: ['climate-2.6', 'geo-1.2'], refs: ['Archer ch. 5', 'Pierrehumbert'],
          pic: 'Raise the CO₂ slider: the effective emission level climbs to colder air, outgoing radiation drops, and the whole profile warms along the lapse rate until balance is restored.' },
        { num: '2.8', kind: 'Law', name: 'Logarithmic dependence of CO₂ forcing', deps: ['climate-2.4', 'climate-2.6'], refs: ['Archer ch. 4', 'IPCC AR6 WG1 ch. 7'],
          pic: 'Compute outgoing radiation as CO₂ doubles again and again: the band centre is saturated but its wings widen, so each doubling removes about the same 3.9 W/m², plotted as a straight line on a log axis.' },
        { num: '2.9', kind: 'Paradox', name: 'The “CO₂ is saturated” argument', deps: ['climate-2.8', 'climate-2.7'], refs: ['Archer ch. 4'],
          pic: 'Show that a column already opaque at 15 μm from the ground still warms with added CO₂: absorption near the surface is irrelevant, what matters is the emission height aloft, which keeps rising.' },
        { num: '2.10', kind: 'Phenomenon', name: 'Pressure broadening of absorption lines', deps: ['qchem-10.10', 'climate-2.4'], refs: ['Pierrehumbert'],
          pic: 'Raise the pressure on a single CO₂ line: its Lorentzian width grows and the gaps between lines fill in, which is why the same gas absorbs more effectively low in the atmosphere.' },
        { num: '2.11', kind: 'Model', name: 'Radiative–convective equilibrium (Manabe–Wetherald)', deps: ['climate-2.6', 'geo-1.6'], refs: ['Pierrehumbert'],
          pic: 'Start from pure radiative equilibrium, too steep near the ground, and adjust any unstable layer to the moist adiabat: a troposphere and stratosphere emerge, and doubling CO₂ warms the surface by about 2 K in this fixed-humidity column.' },
        { num: '2.12', kind: 'Phenomenon', name: 'Runaway greenhouse and the Simpson–Nakajima limit', deps: ['climate-2.11', 'geo-1.5'], refs: ['Pierrehumbert'],
          pic: 'Warm a water-saturated column: outgoing radiation levels off at a limit near 280 W/m² once the emission level is set by water vapour, so a planet absorbing more than that boils its oceans away, as Venus may have.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Radiative forcing and climate sensitivity',
      summary: String.raw`A radiative forcing is a change in the energy budget imposed from outside the climate system; the climate responds until the imbalance is gone. The ratio of warming to forcing — the climate sensitivity — is the central number of the field: the Planck response alone gives about 1.2 K per doubling of CO₂, feedbacks raise it to roughly 3 K. Equilibrium and transient sensitivities differ because the ocean takes time to warm.`,
      items: [
        { num: '3.1', kind: 'Definition', name: 'Radiative forcing and effective radiative forcing', deps: ['climate-2.6'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Perturb a column’s CO₂ and freeze everything else: the instantaneous change in net flux is the forcing, and letting the stratosphere and fast processes adjust gives the effective forcing, drawn as successive bars.' },
        { num: '3.2', kind: 'Concept', name: 'Forcing agents: greenhouse gases, aerosols, solar and volcanic', deps: ['climate-3.1'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Stack the forcings since 1750 as a bar chart with uncertainty: CO₂ dominates, methane and halocarbons add, aerosols subtract with a wide error bar, and solar changes are small.' },
        { num: '3.3', kind: 'Definition', name: 'Global warming potential', deps: ['climate-3.2', 'kin-1.5'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Integrate the forcing from a pulse of methane and of CO₂ over a chosen horizon: methane’s short lifetime makes its GWP about 80 at 20 years and about 30 at 100 years, read off as the horizon slider moves.' },
        { num: '3.4', kind: 'Proposition', name: 'Planck response: about 1.2 K per CO₂ doubling', deps: ['climate-1.6', 'climate-2.8'], refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
          pic: 'Linearize σT⁴ at the emission temperature: the restoring flux is about 3.2 W/m² per kelvin, so a 3.9 W/m² forcing needs only 1.2 K of warming if nothing else changes.' },
        { num: '3.5', kind: 'Definition', name: 'Equilibrium climate sensitivity', deps: ['climate-3.4'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Double CO₂ in a model with adjustable feedback strength and run it to equilibrium: the final warming is ECS, with the AR6 likely range 2.5–4 K shaded on the slider.' },
        { num: '3.6', kind: 'Definition', name: 'Transient climate response', deps: ['climate-3.5'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Ramp CO₂ up by 1 % per year: warming at the time of doubling (after 70 years) is markedly less than ECS, because the deep ocean is still absorbing heat, with both numbers read out.' },
        { num: '3.7', kind: 'Event', name: 'Arrhenius’s 1896 estimate', deps: ['climate-2.8'], refs: ['Archer ch. 4'],
          pic: 'Redo Arrhenius’s calculation with his absorption data: halving or doubling CO₂ shifts temperatures by several degrees, compared with modern estimates and with his predictions for the ice ages.' },
        { num: '3.8', kind: 'Phenomenon', name: 'Volcanic cooling: Pinatubo as a test of sensitivity', deps: ['climate-3.2', 'climate-1.9'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Inject a stratospheric aerosol pulse like Pinatubo’s in 1991: the computed global cooling peaks near 0.5 K a year later and recovers, and the amplitude constrains the feedback parameter.' },
        { num: '3.9', kind: 'Method', name: 'Constraining climate sensitivity from several lines of evidence', deps: ['climate-3.5', 'climate-3.8'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Combine likelihoods from process understanding, the historical record and paleoclimate: each gives a broad distribution of ECS, and their product narrows to the assessed range.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Climate feedbacks',
      summary: String.raw`Feedbacks multiply the Planck response. Warmer air holds more water vapour, a strong positive feedback partly offset by the lapse-rate feedback; melting ice darkens the surface; clouds remain the largest uncertainty. Because the gain formula 1/(1 − f) is nonlinear, symmetric uncertainty in feedbacks becomes a long tail toward high sensitivity, and polar regions warm fastest.`,
      items: [
        { num: '4.1', kind: 'Theorem', name: 'Feedback gain and amplification', deps: ['climate-3.4', 'ctrl-1.4'], refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
          pic: 'Feed a fraction f of each response back as extra forcing: the total converges to ΔT₀/(1 − f), the series of partial sums is drawn, and f ≥ 1 sends it to infinity — a runaway.' },
        { num: '4.2', kind: 'Phenomenon', name: 'Water-vapour feedback', deps: ['climate-4.1', 'geo-1.5'], refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
          pic: 'Warm a column at fixed relative humidity: specific humidity rises about 7 % per kelvin by Clausius–Clapeyron, raising the water emission level and roughly doubling the warming.' },
        { num: '4.3', kind: 'Phenomenon', name: 'Lapse-rate feedback', deps: ['climate-4.2', 'geo-1.6'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Warm the tropics along a moist adiabat: the upper troposphere warms more than the surface, so emission rises faster than surface warming, a negative feedback that partly cancels the water-vapour one.' },
        { num: '4.4', kind: 'Phenomenon', name: 'Ice–albedo feedback', deps: ['climate-4.1', 'climate-1.5'], refs: ['Archer ch. 7'],
          pic: 'Warm a planet with temperature-dependent ice cover: melting exposes darker ground and ocean, absorbed sunlight rises, and the extra warming is computed for each step of retreat.' },
        { num: '4.5', kind: 'Phenomenon', name: 'Cloud feedbacks', deps: ['climate-4.1', 'climate-2.6'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Adjust cloud fraction and height in a column model: low clouds mainly cool by reflecting sunlight, high clouds mainly warm by trapping infrared, and small changes in either swing the net feedback.' },
        { num: '4.6', kind: 'Proposition', name: 'The fat tail of climate sensitivity (Roe–Baker)', deps: ['climate-4.1', 'climate-3.5'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Draw the total feedback f from a symmetric Gaussian and map each sample through 1/(1 − f): the resulting sensitivity histogram is strongly skewed, with a long tail toward high values.' },
        { num: '4.7', kind: 'Phenomenon', name: 'Polar amplification', deps: ['climate-4.4', 'climate-4.3'], refs: ['IPCC AR6 WG1 ch. 7'],
          pic: 'Compare warming by latitude in an energy-balance model with and without ice and lapse-rate effects: the Arctic warms two to four times the global mean, as observed since 1979.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Energy-balance models, bistability and tipping points',
      summary: String.raw`Adding latitude and heat transport to the energy balance gives the Budyko–Sellers models, whose ice-albedo feedback creates multiple equilibria: a warm Earth with polar caps, an unstable small-cap state and a Snowball Earth, joined by saddle-node bifurcations and hysteresis. Similar bistability appears in the ocean overturning and in ice sheets, and critical slowing down offers a warning sign before a tipping point.`,
      items: [
        { num: '5.1', kind: 'Model', name: 'Budyko–Sellers diffusive energy-balance model', deps: ['climate-1.8', 'climate-4.4', 'thermo-7.4'], refs: ['Pierrehumbert'],
          pic: 'Solve the latitudinal energy balance with diffusive heat transport and temperature-dependent albedo: the equilibrium temperature profile and ice line are computed as the solar constant and diffusivity change.' },
        { num: '5.2', kind: 'Phenomenon', name: 'Multiple equilibria of the ice line', deps: ['climate-5.1', 'ode-8.3'], refs: ['Pierrehumbert'],
          pic: 'Plot equilibrium ice-line latitude against the solar constant: an S-shaped curve with stable warm and snowball branches and an unstable middle branch, joined at saddle-node points.' },
        { num: '5.3', kind: 'Phenomenon', name: 'Snowball Earth hysteresis', deps: ['climate-5.2', 'ode-8.6'], refs: ['Pierrehumbert'],
          pic: 'Lower the solar constant until the ice line runs to the equator, then raise it back: the planet stays frozen far above the original threshold, tracing a hysteresis loop on the bifurcation diagram.' },
        { num: '5.4', kind: 'Phenomenon', name: 'Small ice-cap instability', deps: ['climate-5.2'], refs: ['Pierrehumbert'],
          pic: 'Shrink the polar cap in the diffusive model: below a critical size the cap cannot persist and vanishes abruptly, because diffusion smooths away a small cold region.' },
        { num: '5.5', kind: 'Phenomenon', name: 'Escaping a Snowball by CO₂ build-up', deps: ['climate-5.3', 'climate-2.8'], refs: ['Pierrehumbert'],
          pic: 'Freeze the planet, shut down weathering, and let volcanic CO₂ accumulate: after millions of years the forcing crosses the deglaciation threshold and the planet flips into a hot greenhouse state.' },
        { num: '5.6', kind: 'Model', name: 'Daisyworld', deps: ['climate-5.1'], refs: ['Pierrehumbert'],
          pic: 'Grow black and white daisies with a temperature-dependent growth rate as the Sun brightens: the planet’s temperature stays nearly constant over a wide range of luminosity, then collapses at the edges.' },
        { num: '5.7', kind: 'Phenomenon', name: 'Tipping points and critical slowing down', deps: ['climate-5.2', 'ode-8.2'], refs: ['IPCC AR6 WG1 ch. 4'],
          pic: 'Drive a noisy bistable system slowly toward a saddle-node: the recovery rate from perturbations falls, autocorrelation and variance rise in the time series, and the warning precedes the jump.' },
        { num: '5.8', kind: 'Model', name: 'Stommel’s box model of thermohaline bistability', deps: ['geo-9.7', 'ode-8.3'], refs: ['IPCC AR6 WG1 ch. 9'],
          pic: 'Add freshwater to a two-box ocean: the temperature-driven overturning weakens and then collapses to a reversed salinity-driven state, with hysteresis as the freshwater flux is reduced again.' },
        { num: '5.9', kind: 'Phenomenon', name: 'Ice-sheet hysteresis and the height–mass-balance feedback', deps: ['climate-5.2', 'geo-1.2'], refs: ['IPCC AR6 WG1 ch. 9'],
          pic: 'Grow an ice sheet whose surface cools as it thickens: under the same climate a high sheet survives while a low one cannot form, so melting it requires warming well beyond where it first grew.' },
      ],
    },
  ],
};
