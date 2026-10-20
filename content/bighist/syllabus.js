// Syllabus — Big History & Quantitative History (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   Christian, Maps of Time — partial TOC (Introduction: A modern creation myth?; Part I The inanimate
//     universe; … Approaching modernity; Globalization, commercialization and innovation; Birth of the
//     modern world; The great acceleration of the twentieth century; Futures; App. 1 Dating
//     techniques, chronologies and timelines; App. 2 Chaos and order). Chapter numbers unverified,
//     cited at book level except App. 1: https://library.holycross.edu/Record/b1441046/TOC
//   Clark, A Farewell to Alms — TOC (1 Introduction: the sixteen-page economic history of the world;
//     2 Logic of the Malthusian economy; 3 Living standards; 4 Fertility; 5 Life expectancy;
//     6 Malthus and Darwin: survival of the richest; 7 Technological advance; 8 Institutions and
//     growth; 9 Emergence of modern man; 10 Modern growth; 11 The puzzle of the Industrial Revolution;
//     12 The Industrial Revolution in England; 13 Why England?; 14 Why not China, Japan or India?;
//     15 Social consequences; 16 World growth since 1800; 17 Proximate sources of divergence):
//     https://search.libraries.emory.edu/catalog/9937013728502486
//   Turchin & Nefedov, Secular Cycles — TOC (1 Introduction: theoretical background; cycles for
//     Plantagenet and Tudor–Stuart England, Capetian and Valois France, Republican and Principate
//     Rome, Muscovy and Romanov Russia; 10 General conclusions): https://muse.jhu.edu/book/30171
//   Courses: Big History Project / OER Project (eight thresholds of increasing complexity, and
//     Spier's critique of the threshold framework):
//     https://www.oerproject.com/en/oer-materials/oer-media/html-articles/origins/unit1/an-introduction-to-big-history
//     https://jbh.journals.villanova.edu/index.php/JBH/article/download/2723/2584/9873
// Gaps filled after comparison: dating methods (radiometric, radiocarbon, ice cores), the receding
//   Moon, Snowball Earth, the serial founder effect, Milankovitch cycles, settlement scaling, empire
//   sizes, the European marriage pattern, the Seshat databank, the Orbis-spike debate, unified growth
//   theory, the Anthropocene decision of 2024, poverty and violence trends (as contested).
// Deliberate omissions: political narrative history; the physics of cosmology, stellar evolution,
//   epidemics, travelling waves and life tables live in `astro`, `mathbio`, `pde`, `popgen` and
//   `demo` and are cited rather than repeated.
// Landmark papers (October 2026): Phelps Brown & Hopkins 1956 (6.10), von Foerster, Mora & Amiot 1960
//   (6.11), Ammerman & Cavalli-Sforza 1971 (5.12), Alvarez et al. 1980 (3.10), Maddison 2001 (8.13, which
//   introduces the hockey stick in macro-1.10), Crutzen 2002 (9.10).
//   Citations checked against the Crossref API (DOIs, volumes, pages), archive.org / HathiTrust /
//   IMSLP / Project Gutenberg catalogue records for treatises without a DOI, and Wikipedia citations
//   (with JSTOR ids) where a publisher page was not reachable. No DOI was guessed.
export default {
  collection: 'bighist',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Deep time and how we measure it',
      summary: String.raw`The past is too long to picture on a linear scale: on a 13.8-billion-year line, all of recorded history is invisible. Logarithmic axes and compressed calendars make it visible, and radioactive decay, tree rings and ice layers put dates on it. Big historians organise the story as a sequence of rising complexity, a framing that is useful but disputed.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'Deep time on a logarithmic axis', deps: ['pma-8.6'], refs: ['Christian'],
          pic: 'Place events from the Big Bang to last year on a timeline and toggle between linear and log-of-years-ago axes: on the linear one, all of human history collapses into a pixel.' },
        { num: '1.2', kind: 'Concept', name: 'The cosmic calendar', deps: ['bighist-1.1'], refs: ['Christian'],
          pic: 'Compress 13.8 billion years into one year: drag through the months to see the Sun form in September, dinosaurs on 25 December and writing in the last fourteen seconds.' },
        { num: '1.3', kind: 'Method', name: 'Radiometric dating', deps: ['pma-8.6'], refs: ['Christian App. 1'],
          pic: 'Watch parent atoms decay into daughters: the ratio gives the age through t = ln(1 + D/P)/λ, and an isochron of several minerals recovers the age without knowing initial daughters.' },
        { num: '1.4', alias: 'geol-2.6', name: 'Radiocarbon dating and calibration' },
        { num: '1.5', kind: 'Method', name: 'Tree rings, varves and ice cores', deps: [], refs: ['Christian App. 1'],
          pic: 'Cross-match ring-width patterns between overlapping timbers to build a chronology back thousands of years; layer counts in an ice core give a parallel annual record.' },
        { num: '1.6', kind: 'Concept', name: 'Thresholds of increasing complexity (contested)', deps: ['bighist-1.1'], refs: ['Christian'],
          pic: 'The eight thresholds placed on the log timeline, with the gaps between them shrinking; a toggle overlays alternative periodisations proposed by critics.' },
        { num: '1.7', kind: 'Concept', name: 'Energy rate density (Chaisson)', deps: ['bighist-1.6'], refs: ['Christian'],
          pic: 'Plot energy flow per unit mass for galaxies, stars, planets, plants, animals, brains and societies on log axes against time of emergence, with the uncertainty of each estimate.' },
        { num: '1.8', kind: 'Hypothesis', name: 'Is history accelerating?', deps: ['bighist-1.1'], refs: ['Christian'],
          pic: 'Milestone lists compiled by different authors plotted as time-to-next-event: a straight line on log–log axes appears, but sampling recent events more densely produces the same pattern from random data.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Cosmos, stars and a planet',
      summary: String.raw`The universe has been expanding and cooling for 13.8 billion years. Its first minutes made hydrogen and helium, stars cooked heavier elements and exploding stars scattered them, and from that enriched debris the Solar System formed 4.57 billion years ago. The young Earth acquired its Moon in a giant collision, and tides and plate tectonics have been reshaping it ever since.`,
      items: [
        { num: '2.1', kind: 'Event', name: 'The Big Bang and the expanding universe', deps: ['astro-10.2'], refs: ['Christian'],
          pic: 'Run the expansion backward: galaxy separations shrink in proportion, and the inverse Hubble constant gives a first estimate of the universe’s age.' },
        { num: '2.2', kind: 'Event', name: 'First elements and the microwave background', deps: ['astro-10.13', 'astro-10.12'], refs: ['Christian'],
          pic: 'A timeline of the first 400,000 years with temperature falling: helium forms in the first minutes to about a quarter by mass, and atoms form at recombination, releasing the microwave background.' },
        { num: '2.3', kind: 'Event', name: 'Stars forge the elements', deps: ['astro-7.14', 'astro-8.4'], refs: ['Christian'],
          pic: 'Click elements on a periodic table coloured by origin — Big Bang, stellar fusion, supernovae, neutron-star mergers — with cosmic abundances on a log scale.' },
        { num: '2.4', kind: 'Event', name: 'Birth of the Solar System', deps: ['astro-7.4', 'bighist-1.3'], refs: ['Christian'],
          pic: 'A collapsing cloud spins up into a disk where dust grows into planetesimals; the oldest meteorite inclusions date the start to 4.567 billion years ago.' },
        { num: '2.5', kind: 'Hypothesis', name: 'The Moon-forming giant impact', deps: ['bighist-2.4'], refs: ['Christian'],
          pic: 'Simulate a Mars-sized body striking the proto-Earth at an adjustable angle: the debris disk mass and the resulting Moon’s iron content are compared with the real Moon’s.' },
        { num: '2.6', kind: 'Phenomenon', name: 'The receding Moon and the lengthening day', deps: ['astro-3.3'], refs: ['Christian'],
          pic: 'Run tidal friction backward: the day shortens and the Moon draws closer, matching about 400 days per year counted in growth bands of Devonian corals.' },
        { num: '2.7', kind: 'Concept', name: 'Plate tectonics and the supercontinent cycle', deps: ['bighist-2.4'], refs: ['Christian'],
          pic: 'Scroll through reconstructions from Rodinia to Pangaea to today: plates move a few centimetres a year, and the Atlantic opens at the rate measured by GPS.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Life on Earth',
      summary: String.raw`Life appeared on Earth within a billion years of its formation, by routes still debated. For most of its history it was microbial, yet microbes oxidised the atmosphere and, by merging, built the complex cells from which plants and animals came. Animal life diversified rapidly in the Cambrian, and five mass extinctions, at least one caused by an asteroid, repeatedly reset the board.`,
      items: [
        { num: '3.1', kind: 'Event', name: 'The Miller–Urey experiment', deps: [], refs: ['Miller1953; Johnson et al.2008 plus TableS1; Miller & Schlesinger NASA CP2276'],
          pic: 'Distinguish original secure and tentative identifications, then compare all27 archived-sample compounds across three apparatus with exact printed ratios and qualitative nondetections.' },
        { num: '3.2', kind: 'Hypothesis', name: 'The RNA world and rival origin-of-life hypotheses', deps: ['bighist-3.1'], refs: ['Wächtershäuser1988; Patel2015; Horning & Joyce2016; bounded vent author accounts'],
          pic: 'Compare dated source claims with authored0–3 sensitivity scores; preserve all tied leaders, undefined zero-weight means and complete saved cell/weight choices.' },
        { num: '3.3', kind: 'Event', name: 'LUCA and the tree of life', deps: ['bighist-3.2', 'popgen-3.9'], refs: ['Christian'],
          pic: 'An interactive tree of the three domains rooted at the last universal common ancestor, with molecular-clock dates on the branches and their uncertainty bars.' },
        { num: '3.4', kind: 'Event', name: 'The Great Oxidation Event', deps: ['bighist-3.3'], refs: ['Christian'],
          pic: 'Atmospheric oxygen on a log scale over four billion years: banded iron formations end and oxygen jumps around 2.4 billion years ago, then again late in the Proterozoic.' },
        { num: '3.5', kind: 'Event', name: 'Complex cells by endosymbiosis', deps: ['bighist-3.4'], refs: ['Christian'],
          pic: 'A host cell engulfs a bacterium that becomes a mitochondrion; the gene trees of mitochondria and free-living bacteria are compared to show the relationship.' },
        { num: '3.6', kind: 'Hypothesis', name: 'Snowball Earth', deps: ['bighist-3.4'], refs: ['Hoffman et al.1998', 'North et al., NASA-TM-82047', 'Gough1981', 'Myhre1998'],
          pic: 'Compare saved warm/frozen initial branches and complete finite-volume energy budgets with continuation hysteresis; solar age and extrapolated log forcing are authored model inputs, without a real CO₂ melt threshold.' },
        { num: '3.7', kind: 'Event', name: 'The Cambrian explosion', deps: ['bighist-3.5', 'ode-1.6'], refs: ['Marshall2006', 'ICS chart2024/12'],
          pic: 'Select six explicitly historical fossil intervals and compare boundary calibrations; a separate gated logistic uses one exact solution for its full curve and threshold times, with saved explanatory selections.' },
        { num: '3.8', kind: 'Phenomenon', name: 'Mass extinctions and recoveries', deps: ['bighist-3.7', 'ode-1.6'], refs: ['Raup & Sepkoski 1982', 'Barnosky et al. 2011 Table 1', 'Kirchner & Weil 2000'],
          pic: 'Compare the original 2011 genus/species loss estimates; vary five registered pulse fractions and the logistic rate in a separate authored stock, with exact conditional recovery times.' },
        { num: '3.9', kind: 'Event', name: 'The end-Cretaceous impact', deps: ['bighist-3.8', 'bighist-1.3', 'mech-3.1'], refs: ['Christian'],
          pic: 'Compare the actual Beloc/IrZ dating intervals; vary surface speed, angle, density and diameter in the complete solid-target crater scaling, and solve the conditional180km model inverse.' },
        { num: '3.10', kind: 'Paper', name: 'Extraterrestrial Cause for the K–T Extinction',
          paper: { authors: 'Luis W. Alvarez, Walter Alvarez, Frank Asaro and Helen V. Michel', year: 1980, title: 'Extraterrestrial Cause for the Cretaceous-Tertiary Extinction',
                   venue: 'Science 208 (4448): 1095–1108', doi: '10.1126/science.208.4448.1095' },
          introduces: ['bighist-3.9'], deps: ['bighist-3.8'], refs: [],
          pic: 'Inspect all seven original Danish Table1residue observations, error bars and upper limits; vary diameter, retained fraction and bulk density in an explicitly conditional uniform excavated-crust layer.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Human origins',
      summary: String.raw`Bipedal hominins were present in Africa several million years ago, before the later marked enlargement of the brain. Ice ages paced by Earth’s orbital cycles shaped the environments our ancestors lived in. Modern humans spread out of Africa in the last hundred thousand years, losing genetic diversity at each step and interbreeding with Neanderthals and Denisovans on the way. Collective learning — the ability to share and accumulate knowledge — is Christian’s candidate for what made humans different.`,
      items: [
        { num: '4.1', kind: 'Event', name: 'Hominin evolution: bipedalism and brain growth', deps: ['bighist-3.9'], refs: ['Aiello & Wheeler1995, Tables1/4 and p208'],
          pic: 'Compare bounded bipedalism context and four literal historical braincase summaries, then distinguish a reported basal budget from explicit volume-to-mass/allometric accounting without a causal regression.' },
        { num: '4.2', kind: 'Phenomenon', name: 'Glacial cycles and Milankovitch forcing', deps: ['mech-10.18'], refs: ['Hays et al.1976; Imbrie & Imbrie1980'],
          pic: 'Distinguish historical sediment-core evidence from an authored harmonic orbit, daily solstice insolation, exact held-forcing asymmetric response and honest finite power spectra.' },
        { num: '4.3', kind: 'Event', name: 'Out of Africa', deps: ['bighist-4.1', 'popgen-3.9'], refs: ['Christian'],
          pic: 'Animate the dispersal of modern humans on a map with dated sites: Arabia, Australia by about 50,000 years ago, the Americas by at least 15,000 years ago.' },
        { num: '4.4', kind: 'Model', name: 'The serial founder effect', deps: ['bighist-4.3', 'popgen-2.1', 'popgen-2.3', 'popgen-2.9'], refs: ['Ramachandran et al. 2005, Fig. 4 and bottleneck-only discussion'],
          pic: 'Twenty seeded biallelic founder chains, their finite mean and the conditional geometric expectation; compare first-chain frequency bins without calling them the human microsatellite data.' },
        { num: '4.5', kind: 'Event', name: 'Neanderthal and Denisovan admixture', deps: ['bighist-4.3'], refs: ['Christian'],
          pic: 'Paint a genome by ancestry: non-African genomes carry about 2% Neanderthal segments, and segment lengths date the interbreeding through recombination.' },
        { num: '4.6', kind: 'Hypothesis', name: 'The Toba bottleneck (contested)', deps: ['bighist-4.3', 'popgen-2.9'], refs: ['Christian'],
          pic: 'Model a population crash about 74,000 years ago of adjustable severity and compare predicted genetic diversity with what archaeological sites near Toba suggest.' },
        { num: '4.7', kind: 'Concept', name: 'Collective learning', deps: ['bighist-4.1', 'stat-1.12', 'bioinf-3.5'], refs: ['Christian2004 pp146–148', 'Henrich2004 pp200–203/210'],
          pic: 'Replay exact integer four-group Gumbel block maxima with a saved seed and optional zero bound; compare finite best-value averages to explicitly separate unbounded drift diagnostics.' },
        { num: '4.8', kind: 'Hypothesis', name: 'Megafaunal extinctions: overkill or climate?', deps: ['bighist-4.3', 'bighist-4.2'], refs: ['Christian'],
          pic: 'Extinction dates of large mammals by continent against human arrival and climate shifts: drag the uncertainty bars and see which explanation each continent supports.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Farming and the first states',
      summary: String.raw`After the last ice age, farming was invented independently in several regions and spread outward. Its spread across Europe advanced at about a kilometre a year, close to what a reaction–diffusion model of growing, wandering farmers predicts, and ancient DNA shows that farmers themselves moved, not just ideas. Farming fed more people at the cost of health, and dense populations gave rise to cities, writing and states.`,
      items: [
        { num: '5.1', kind: 'Event', name: 'The Holocene and the Younger Dryas', deps: ['bighist-4.2'], refs: ['Christian'],
          pic: 'Greenland temperature over the last 20,000 years: an abrupt cold snap about 12,900 years ago, then the unusually stable Holocene in which farming began.' },
        { num: '5.2', kind: 'Event', name: 'Independent centres of domestication', deps: ['bighist-5.1', 'tech-1.8'], refs: ['Christian'],
          pic: 'A world map of domestication centres with dates and crops — Fertile Crescent, China, New Guinea, Mesoamerica, the Andes, Africa — and the spread from each.' },
        { num: '5.3', kind: 'Model', name: 'Farming spreads as a wave of advance', deps: ['bighist-5.2', 'mathbio-8.9', 'pde-9.8'], refs: ['Christian'],
          pic: 'Fisher–KPP on a map of Europe with sliders for growth rate and dispersal: the front’s speed approaches 2√(rD) and is compared with the observed advance.' },
        { num: '5.4', kind: 'Phenomenon', name: 'Neolithic radiocarbon dates trace the front', deps: ['bighist-5.3', 'bighist-1.4'], refs: ['Christian'],
          pic: 'Earliest farming dates at European sites against distance from the Near East: a regression slope of roughly one kilometre per year (Ammerman and Cavalli-Sforza).' },
        { num: '5.5', kind: 'Hypothesis', name: 'Demic versus cultural diffusion', deps: ['bighist-5.3'], refs: ['Christian'],
          pic: 'Mix migrating farmers and converting foragers in the wave model: the genetic gradient left behind differs, and ancient-DNA ancestry proportions decide between them.' },
        { num: '5.6', kind: 'Hypothesis', name: 'Continental axes and the spread of crops (contested)', deps: ['bighist-5.2'], refs: ['Christian'],
          pic: 'Compare spread rates of crops along east–west and north–south routes, with latitude bands shaded: the data partly support and partly complicate Diamond’s claim.' },
        { num: '5.7', kind: 'Phenomenon', name: 'The Neolithic demographic transition', deps: ['bighist-5.2'], refs: ['Clark ch. 5'],
          pic: 'The fraction of juveniles in cemeteries rises after farming arrives, signalling higher fertility, while skeletal stature and dental health decline.' },
        { num: '5.8', kind: 'Hypothesis', name: 'Indo-European expansion: farmers or herders?', deps: ['ling-9.8', 'bighist-5.3'], refs: ['Christian'],
          pic: 'Overlay Anatolian-farmer and steppe-herder expansion fronts with language-tree root ages and ancient-DNA ancestry maps to see which fits each region.' },
        { num: '5.9', kind: 'Event', name: 'Cities, writing and the first states', deps: ['bighist-5.7', 'tech-3.6'], refs: ['Christian'],
          pic: 'Uruk’s growth on a timeline beside the first administrative tablets, monumental buildings and population estimates for the largest cities over 5,000 years.' },
        { num: '5.10', kind: 'Phenomenon', name: 'Settlement scaling with population', deps: ['bighist-5.9'], refs: ['Christian'],
          pic: 'Settlement area against population for ancient and modern towns on log–log axes: the slope below 1 shows denser living in bigger places, with fitted exponents for each dataset.' },
        { num: '5.11', kind: 'Phenomenon', name: 'The sizes of empires over time', deps: ['bighist-5.9'], refs: ['Christian'],
          pic: 'Area of the largest empires since 3000 BCE on a log axis (after Taagepera): growth curves for each empire and the rising envelope across them.' },
        { num: '5.12', kind: 'Paper', name: 'Measuring the Rate of Spread of Early Farming in Europe',
          paper: { authors: 'A. J. Ammerman and L. L. Cavalli-Sforza', year: 1971, title: 'Measuring the Rate of Spread of Early Farming in Europe',
                   venue: 'Man (n.s.) 6 (4): 674–688', doi: '10.2307/2799190' },
          introduces: ['bighist-5.4'], deps: ['geol-2.6', 'bighist-5.2'], refs: [],
          pic: 'The paper’s regression made live: radiocarbon dates of the earliest farming sites across Europe are plotted against distance from a Near Eastern origin, the fitted slope gives about one kilometre per year, and the reader moves the origin or drops sites to see how the rate changes, then compares it with the speed of a wave of advance driven by population growth and local migration.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'The Malthusian world',
      summary: String.raw`Before about 1800, technological progress raised the number of people rather than their living standards: higher income raised births or lowered deaths until income fell back. English real wages show the pattern over six centuries, most dramatically after the Black Death, when labour became scarce and wages doubled. World population nonetheless grew faster than exponentially over the long run, a pattern that models of population-driven innovation try to explain.`,
      items: [
        { num: '6.1', kind: 'Model', name: 'Malthusian dynamics in pre-industrial economies', deps: ['demo-7.1', 'mathbio-1.4'], refs: ['Clark ch. 2'],
          pic: 'Birth and death rates as functions of income cross at the subsistence wage: perturb population or income and watch the economy return to the same income.' },
        { num: '6.2', kind: 'Theorem', name: 'Technology raises population, not income', deps: ['bighist-6.1'], refs: ['Clark ch. 2', 'Clark ch. 7'],
          pic: 'Shift the technology level up: income jumps, then decays back to subsistence as population rises to a new, higher equilibrium.' },
        { num: '6.3', kind: 'Phenomenon', name: 'English real wages, 1200–1800', deps: ['bighist-6.2'], refs: ['Clark ch. 3'],
          pic: 'Real wages of builders against population for England: the points trace a downward-sloping curve that shifts only slowly before 1800.' },
        { num: '6.4', kind: 'Model', name: 'Hyperbolic growth of world population', deps: ['bighist-6.2', 'demo-1.10'], refs: ['Clark ch. 7'],
          pic: 'Fit N(t) = C/(t₀ − t) to world population estimates: von Foerster’s 1960 fit put the singularity on 13 November 2026, and the data bend away from it after the 1960s.' },
        { num: '6.5', kind: 'Event', name: 'The Black Death as an SIR epidemic', deps: ['mathbio-7.1', 'mathbio-7.3'], refs: ['Clark ch. 5'],
          pic: 'Spread an SIR model across a map of 1347–51 Europe with travel along trade routes: arrival dates and final mortality near a third to a half are compared with the record.' },
        { num: '6.6', kind: 'Phenomenon', name: 'After the plague: the golden age of labour', deps: ['bighist-6.5', 'bighist-6.3'], refs: ['Clark ch. 3'],
          pic: 'English population and real wages from 1300 to 1600: the population crash moves the economy up the wage curve, and wages slide back as numbers recover.' },
        { num: '6.7', kind: 'Concept', name: 'Preventive checks: the European marriage pattern', deps: ['bighist-6.1'], refs: ['Clark ch. 4'],
          pic: 'Raise the age at first marriage and the share never marrying: fertility falls and the Malthusian equilibrium income rises, as in north-western Europe.' },
        { num: '6.8', kind: 'Hypothesis', name: 'Survival of the richest (contested)', deps: ['bighist-6.2'], refs: ['Clark ch. 6'],
          pic: 'Surviving children by testator wealth in English wills: the rich had more, and a toggle compares Clark’s cultural-transmission reading with critics’ alternatives.' },
        { num: '6.9', kind: 'Hypothesis', name: 'The Little Ice Age and the seventeenth-century crisis', deps: ['bighist-6.1'], refs: ['Christian'],
          pic: 'Reconstructed temperatures, harvests and recorded revolts in the 1600s on one timeline, with the correlation and its sensitivity to the choice of dates.' },
        { num: '6.10', kind: 'Paper', name: 'Seven Centuries of the Prices of Consumables',
          paper: { authors: 'E. H. Phelps Brown and Sheila V. Hopkins', year: 1956, title: 'Seven Centuries of the Prices of Consumables, Compared with Builders’ Wage-Rates',
                   venue: 'Economica 23 (92): 296–314', doi: '10.2307/2551457' },
          introduces: ['bighist-6.3'], deps: [], refs: [],
          pic: 'The paper’s chart rebuilt from its index: a basket of consumables priced in southern England from 1264 to 1954 and a building craftsman’s daily wage, their ratio plotted as a real-wage index; the reader zooms to the high plateau after the Black Death, the long sixteenth-century fall and the rise after 1800, and sets population beside it to see the Malthusian inverse relation.' },
        { num: '6.11', kind: 'Paper', name: 'Doomsday: Friday, 13 November, A.D. 2026',
          paper: { authors: 'Heinz von Foerster, Patricia M. Mora and Lawrence W. Amiot', year: 1960, title: 'Doomsday: Friday, 13 November, A.D. 2026',
                   venue: 'Science 132 (3436): 1291–1295', doi: '10.1126/science.132.3436.1291' },
          introduces: ['bighist-6.4'], deps: ['mathbio-1.2'], refs: [],
          pic: 'The paper’s fit redone: estimates of world population from year 1 to 1958 are plotted against time and the reader fits the hyperbola N = C/(t₀ − t)^k by dragging t₀, landing near 2026 with k close to 1; the actual population since 1960 is then overlaid and peels away from the curve as growth slowed.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Cycles, contact and exchange',
      summary: String.raw`Agrarian states rose and fell in long cycles. Turchin and Nefedov model them as population growth eroding wages, swelling the elite and draining the treasury until crisis brings collapse and a new start, and they test the model against the histories of England, France, Rome and Russia. Contact between continents, above all after 1492, exchanged crops, animals and microbes, with catastrophic results for the peoples of the Americas.`,
      items: [
        { num: '7.1', kind: 'Model', name: 'Secular cycles: the structural-demographic model', deps: ['bighist-6.1', 'mathbio-3.3'], refs: ['Turchin & Nefedov ch. 1'],
          pic: 'Couple population, state strength and elite numbers in a small dynamical model: with the default parameters a cycle of two to three centuries appears, with phases labelled.' },
        { num: '7.2', kind: 'Concept', name: 'Elite overproduction and instability', deps: ['bighist-7.1'], refs: ['Turchin & Nefedov ch. 1'],
          pic: 'Elites grow faster than the positions available to them: the ratio of aspirants to positions is plotted with an instability index that rises as it climbs.' },
        { num: '7.3', kind: 'Phenomenon', name: 'Cycles in the data: population, prices, instability', deps: ['bighist-7.2'], refs: ['Turchin & Nefedov ch. 10'],
          pic: 'For each case study, population, real wages and instability events are plotted over three centuries, and the phase lags between them are measured.' },
        { num: '7.4', kind: 'Hypothesis', name: 'Fifty-year waves of political violence (contested)', deps: ['bighist-7.2'], refs: ['Turchin & Nefedov ch. 10'],
          pic: 'A spectrum of an instability-events series: peaks near 50 years are shown alongside the spectra of shuffled series, so the reader can judge the significance.' },
        { num: '7.5', kind: 'Concept', name: 'Ibn Khaldun’s cycle of solidarity', deps: ['bighist-7.1'], refs: ['Turchin & Nefedov ch. 1'],
          pic: 'Model group cohesion (asabiyya) rising on a frontier and decaying inside a state: dynasties rise and fall over about four generations as the parameter changes.' },
        { num: '7.6', kind: 'Method', name: 'Testing grand theories with historical databases', deps: ['bighist-7.1'], refs: ['Turchin & Nefedov ch. 10'],
          pic: 'Pick a hypothesis about the rise of social complexity and test it against a coded sample of polities: effect sizes and confidence intervals appear for each predictor.' },
        { num: '7.7', kind: 'Event', name: 'The Columbian exchange', deps: ['bighist-6.1'], refs: ['Christian'],
          pic: 'Animate crops, animals and diseases crossing the Atlantic after 1492; potato and maize adoption maps are shown with later population growth in the Old World.' },
        { num: '7.8', kind: 'Event', name: 'Virgin-soil epidemics in the Americas', deps: ['bighist-7.7', 'bighist-6.5'], refs: ['Christian'],
          pic: 'Run SIR epidemics of smallpox and measles through populations with no prior immunity: repeated waves compound, with estimated population decline by region.' },
        { num: '7.9', kind: 'Hypothesis', name: 'The Orbis spike: a CO₂ dip around 1610 (contested)', deps: ['bighist-7.8'], refs: ['Christian'],
          pic: 'Antarctic ice-core CO₂ from 1500 to 1800 with a dip near 1610; a reforestation model driven by the population collapse is compared with alternative natural causes.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'The great divergence and modern growth',
      summary: String.raw`Around 1800, first in north-western Europe, income per person began to grow persistently: the hockey stick. Why it happened there and then is among history’s great open questions, with explanations ranging from institutions and culture to coal and high wages. Falling mortality and then falling fertility followed, synthetic fertiliser lifted the food ceiling, and income growth spread unevenly so that some countries converged while others fell behind.`,
      items: [
        { num: '8.1', kind: 'Concept', name: 'Compound growth and doubling times', deps: ['pma-8.6'], refs: ['Clark ch. 10'],
          pic: 'Slide a growth rate: the doubling time is about 70 divided by the rate in percent, and a 0.05% pre-modern rate is contrasted with a 2% modern one over two centuries.' },
        { num: '8.2', alias: 'macro-1.10', name: 'The hockey stick of world income' },
        { num: '8.3', kind: 'Event', name: 'The Great Divergence', deps: ['bighist-8.2'], refs: ['Clark ch. 14'],
          pic: 'Real wages in London, Amsterdam, Beijing, Delhi and Milan from 1500 to 1900: the series separate after 1700, with silver-wage and subsistence-ratio versions.' },
        { num: '8.4', kind: 'Hypothesis', name: 'High wages and cheap coal (contested)', deps: ['bighist-8.3', 'tech-7.5'], refs: ['Clark ch. 11', 'Clark ch. 12'],
          pic: 'Relative prices of labour and energy in England, France and China: an inventor’s profit from a labour-saving coal machine is computed for each, and only Britain’s exceeds the cost.' },
        { num: '8.5', kind: 'Hypothesis', name: 'Why England? Rival explanations', deps: ['bighist-8.3'], refs: ['Clark ch. 13'],
          pic: 'Score explanations (institutions, culture, science, coal, colonies, demography) against a set of facts each must account for; the matrix shows that none fits all.' },
        { num: '8.6', kind: 'Event', name: 'From an organic to a mineral energy economy', deps: ['tech-7.2', 'bighist-8.4'], refs: ['Christian'],
          pic: 'Energy consumption in England by source since 1560: muscle, wood, wind and water are overtaken by coal, and the forest area coal replaced is computed.' },
        { num: '8.7', kind: 'Model', name: 'Unified growth theory', deps: ['bighist-8.2', 'bighist-6.2'], refs: ['Clark ch. 10'],
          pic: 'A model in which population size drives technological progress, which raises the return to education until fertility falls: stagnation, take-off and sustained growth emerge as phases.' },
        { num: '8.8', kind: 'Phenomenon', name: 'Demographic transitions around the world', deps: ['demo-7.4', 'bighist-8.2'], refs: ['Clark ch. 15'],
          pic: 'Birth and death rates for England, Japan, Brazil and Niger on a common time axis: later transitions happen faster, and the gap between the curves gives the growth surge.' },
        { num: '8.9', kind: 'Phenomenon', name: 'The epidemiological transition and rising lifespans', deps: ['demo-3.11', 'demo-3.7'], refs: ['Clark ch. 5'],
          pic: 'Life expectancy by country since 1800: the best-practice frontier rises steadily, and causes of death shift from infections to chronic disease.' },
        { num: '8.10', kind: 'Phenomenon', name: 'Synthetic nitrogen and the population ceiling', deps: ['tech-10.9', 'bighist-6.1'], refs: ['Christian'],
          pic: 'World population and nitrogen-fertiliser use since 1900: remove synthetic nitrogen from a simple food model and see the supportable population fall.' },
        { num: '8.11', kind: 'Phenomenon', name: 'Convergence and divergence between countries', deps: ['bighist-8.2'], refs: ['Clark ch. 16', 'Clark ch. 17'],
          pic: 'Growth rate against initial income for countries since 1960: no overall convergence, but clubs that converge; the spread of log incomes (σ-convergence) is tracked through time.' },
        { num: '8.12', kind: 'Phenomenon', name: 'Waves of globalisation', deps: ['bighist-8.11'], refs: ['Christian'],
          pic: 'World trade as a share of GDP since 1820 with two waves and the interwar collapse, and price gaps for wheat between Liverpool and Chicago narrowing as freight costs fall.' },
        { num: '8.13', kind: 'Paper', name: 'The World Economy: A Millennial Perspective',
          paper: { authors: 'Angus Maddison', year: 2001, title: 'The World Economy: A Millennial Perspective',
                   venue: 'Paris: OECD Development Centre, 2001', doi: '10.1787/9789264189980-en' },
          introduces: ['macro-1.10'], deps: ['bighist-8.1'], refs: [],
          pic: 'Maddison’s hockey stick from his own tables: world and regional GDP per head in 1990 international dollars at his benchmark years from 0 to 1998, plotted on linear and logarithmic axes; the reader toggles regions to watch Western Europe and its offshoots pull away from China and India after 1820 and reads off each era’s growth rate.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'The great acceleration',
      summary: String.raw`Since 1950, measures of human activity and its footprint — population, energy use, fertiliser, dams, carbon dioxide — have risen together steeply. Whether this marks a new geological epoch was formally debated and, in 2024, rejected as a unit of the geological time scale, though the term remains widely used. Poverty and some forms of violence have fallen, while forecasts of what comes next show how quickly extrapolation goes wrong.`,
      items: [
        { num: '9.1', kind: 'Phenomenon', name: 'The great acceleration', deps: ['bighist-8.2'], refs: ['Christian'],
          pic: 'A grid of socio-economic and Earth-system indicators since 1750, each normalised: drag a vertical cursor to see the common upturn around 1950.' },
        { num: '9.2', kind: 'Phenomenon', name: 'The Keeling curve and fossil carbon', deps: ['bighist-9.1', 'energy-3.2'], refs: ['Christian'],
          pic: 'Monthly CO₂ at Mauna Loa since 1958 with its seasonal cycle; subtract cumulative fossil emissions times the airborne fraction and the residual is small.' },
        { num: '9.3', kind: 'Hypothesis', name: 'The Anthropocene as a geological epoch', deps: ['bighist-9.1'], refs: ['Christian'],
          pic: 'Candidate markers — radionuclides, plastics, fly ash, CO₂ — in a lake core, with the proposed 1950s boundary and the 2024 vote not to adopt it formally.' },
        { num: '9.4', kind: 'Phenomenon', name: 'Peak population growth and its slowdown', deps: ['bighist-8.8'], refs: ['Christian'],
          pic: 'World population growth rate since 1950: a peak above 2% a year in the 1960s, then decline; projection fans from several agencies are overlaid.' },
        { num: '9.5', kind: 'Phenomenon', name: 'Exponential computation', deps: ['tech-11.18'], refs: ['Christian'],
          pic: 'Calculations per second per dollar from mechanical calculators to GPUs on a log axis: the doubling time is fitted for each era.' },
        { num: '9.6', kind: 'Concept', name: 'Planetary boundaries (contested)', deps: ['bighist-9.1', 'energy-9.6'], refs: ['Christian'],
          pic: 'A radar chart of proposed boundaries with estimated current values and uncertainty; critics’ objections to fixed thresholds appear as toggles.' },
        { num: '9.7', kind: 'Phenomenon', name: 'The fall in extreme poverty and how it is measured', deps: ['bighist-8.2'], refs: ['Clark ch. 16'],
          pic: 'Share of world population below a poverty line since 1820: move the line from $2.15 to $10 a day and see how the trend and the debate change.' },
        { num: '9.8', kind: 'Hypothesis', name: 'The long decline of violence (contested)', deps: ['bighist-7.4'], refs: ['Christian'],
          pic: 'European homicide rates since 1300 on a log axis fall steeply; war deaths per capita are noisier, and a power-law fit shows how hard a trend is to establish.' },
        { num: '9.9', kind: 'Concept', name: 'The limits of extrapolation', deps: ['bighist-6.4'], refs: ['Christian'],
          pic: 'Fit exponential, logistic and hyperbolic curves to data up to a chosen year and project forward: forecasts made in 1900, 1960 and 2000 are scored against what happened.' },
        { num: '9.10', kind: 'Paper', name: 'Geology of Mankind',
          paper: { authors: 'Paul J. Crutzen', year: 2002, title: 'Geology of mankind',
                   venue: 'Nature 415 (6867): 23', doi: '10.1038/415023a' },
          introduces: ['bighist-9.3'], deps: ['bighist-9.2'], refs: [],
          pic: 'Crutzen’s case as a dashboard: the reader steps through the human signals he lists (population up tenfold in three centuries, a third to a half of the land transformed, more nitrogen fixed by industry than by nature, carbon dioxide up by more than 30% and methane more than doubled), each plotted since 1700, with the start he proposed for the Anthropocene, the term he had coined with Stoermer in 2000, marked at the late eighteenth century.' },
      ],
    },
  ],
};
