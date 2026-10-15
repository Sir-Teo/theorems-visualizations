// The atlas registry: fields and their areas, in display order. Collections declare
// `field` and `area` in content/<id>/collection.js; colours are [light, dark].
export default [
  {
    id: 'math', title: 'Mathematics', short: 'Math', color: ['#3557d4', '#7c9bff'],
    blurb: String.raw`The language every other field borrows: analysis, algebra, geometry and topology, probability, discrete mathematics, logic, and the computational mathematics that makes it all run.`,
    areas: [
      { id: 'analysis', title: 'Analysis' },
      { id: 'algebra', title: 'Algebra' },
      { id: 'geometry', title: 'Geometry & topology' },
      { id: 'probability', title: 'Probability' },
      { id: 'discrete', title: 'Discrete mathematics & number theory' },
      { id: 'logic', title: 'Logic & foundations' },
      { id: 'applied', title: 'Applied & computational' },
    ],
  },
  {
    id: 'stats', title: 'Statistics & Data Science', short: 'Stats', color: ['#0f8fa3', '#45cfdc'],
    blurb: String.raw`Learning from data: estimation and testing, the theory of why machine learning generalizes, deep networks, and how to read causes out of correlations.`,
    areas: [
      { id: 'inference', title: 'Statistical inference' },
      { id: 'learning', title: 'Machine learning' },
      { id: 'causality', title: 'Causality' },
    ],
  },
  {
    id: 'cs', title: 'Computer Science', short: 'CS', color: ['#7a4cc9', '#b892ff'],
    blurb: String.raw`What can be computed, how fast, and how safely: algorithms, automata and complexity, information and coding, cryptography, distributed systems, programming languages and geometry.`,
    areas: [
      { id: 'algorithms', title: 'Algorithms' },
      { id: 'theory', title: 'Theory of computation' },
      { id: 'information', title: 'Information & security' },
      { id: 'systems', title: 'Systems & languages' },
      { id: 'graphics', title: 'Geometry & graphics' },
    ],
  },
  {
    id: 'physics', title: 'Physics & Astronomy', short: 'Physics', color: ['#c8372d', '#ff7b6b'],
    blurb: String.raw`From Newton to the quantum: mechanics, electromagnetism, waves, heat and statistical physics, quantum theory, relativity, fluids and the cosmos.`,
    areas: [
      { id: 'classical', title: 'Classical physics' },
      { id: 'thermal', title: 'Thermal & statistical physics' },
      { id: 'quantum', title: 'Quantum physics' },
      { id: 'relativity', title: 'Relativity & astrophysics' },
      { id: 'continua', title: 'Continuum physics' },
    ],
  },
  {
    id: 'chem', title: 'Chemistry & Materials', short: 'Chem', color: ['#b07a0c', '#f0c94e'],
    blurb: String.raw`Matter and its transformations: equilibrium and free energy, reaction rates, chemical bonding from quantum mechanics, the symmetry of crystals and the science of materials.`,
    areas: [
      { id: 'physical', title: 'Physical chemistry' },
      { id: 'quantumchem', title: 'Quantum chemistry & structure' },
      { id: 'materials', title: 'Materials' },
    ],
  },
  {
    id: 'earth', title: 'Earth & Environment', short: 'Earth', color: ['#6b7a1f', '#b8cc5a'],
    blurb: String.raw`The planet as a system: plate tectonics and earthquakes, the circulation of atmosphere and ocean, the climate and its feedbacks, and the maps we draw of it all.`,
    areas: [
      { id: 'solid', title: 'Solid Earth' },
      { id: 'climate', title: 'Atmosphere, ocean & climate' },
      { id: 'geography', title: 'Geography & cartography' },
    ],
  },
  {
    id: 'bio', title: 'Biology', short: 'Bio', color: ['#2e8f4b', '#5fd38a'],
    blurb: String.raw`Life by the numbers: evolution and population genetics, ecology and epidemics, neurons, genomes and gene circuits.`,
    areas: [
      { id: 'evolution', title: 'Evolution & ecology' },
      { id: 'neuro', title: 'Neuroscience' },
      { id: 'molecular', title: 'Molecular & systems biology' },
    ],
  },
  {
    id: 'med', title: 'Medicine & Health', short: 'Med', color: ['#c22d5d', '#ff7fa6'],
    blurb: String.raw`How the body works and how we know what heals it: physiology, drugs in the body, the logic of diagnosis and evidence, and the physics of seeing inside.`,
    areas: [
      { id: 'physiology', title: 'Physiology' },
      { id: 'pharmacology', title: 'Pharmacology' },
      { id: 'public', title: 'Epidemiology & evidence' },
      { id: 'technology', title: 'Medical technology' },
    ],
  },
  {
    id: 'eng', title: 'Engineering', short: 'Eng', color: ['#4a6a8a', '#8fb4d9'],
    blurb: String.raw`Making things work: signals and systems, feedback control, circuits, structures, flight, energy and robots.`,
    areas: [
      { id: 'signals', title: 'Signals, systems & control' },
      { id: 'electrical', title: 'Electrical & energy' },
      { id: 'mechanical', title: 'Mechanical, aerospace & robotics' },
    ],
  },
  {
    id: 'econ', title: 'Economics & Finance', short: 'Econ', color: ['#7a5c3e', '#d1ad86'],
    blurb: String.raw`How people, firms and nations choose under scarcity: markets and their failures, growth and cycles, money and risk, strategy, and the predictable ways real people depart from the textbook.`,
    areas: [
      { id: 'micro', title: 'Microeconomics' },
      { id: 'macro', title: 'Macroeconomics' },
      { id: 'finance', title: 'Finance' },
      { id: 'strategy', title: 'Strategy & decisions' },
    ],
  },
  {
    id: 'social', title: 'Social & Behavioral Sciences', short: 'Social', color: ['#a8429a', '#ee8bdc'],
    blurb: String.raw`Minds and societies: perception and learning, networks and collective behaviour, voting and power, and the dynamics of human populations.`,
    areas: [
      { id: 'psychology', title: 'Psychology & perception' },
      { id: 'society', title: 'Networks & society' },
      { id: 'politics', title: 'Politics & social choice' },
      { id: 'population', title: 'Population' },
    ],
  },
  {
    id: 'arts', title: 'Arts, Music & Design', short: 'Arts', color: ['#cc6b1f', '#ffab66'],
    blurb: String.raw`The structure inside beauty: harmony, tuning and rhythm, perspective, colour and symmetry, and the forms that let buildings stand.`,
    areas: [
      { id: 'music', title: 'Music' },
      { id: 'visual', title: 'Visual art & colour' },
      { id: 'built', title: 'Architecture' },
    ],
  },
  {
    id: 'humanities', title: 'Humanities', short: 'Hum', color: ['#5b5f97', '#a3a8e6'],
    blurb: String.raw`Language, reason and the human story: how languages work and change, the paradoxes and tools of philosophy, the inventions that built the modern world, and history seen at the largest scales.`,
    areas: [
      { id: 'language', title: 'Language' },
      { id: 'philosophy', title: 'Philosophy & reasoning' },
      { id: 'history', title: 'History & technology' },
    ],
  },
];
