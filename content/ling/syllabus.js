// Syllabus — Linguistics (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   Fromkin, Rodman & Hyams 11e — partial TOC verified (1 What is language, 2 Morphology, 3 Syntax,
//     4 Meaning, … 9 Acquisition, 10 Processing and the brain): https://opac.tangaza.ac.ke/bib/201956
//     (other chapters cited at book level).
//   Ladefoged & Johnson, A Course in Phonetics 7e — parts on articulation/acoustics, English
//     consonants and vowels, general phonetics, syllables and suprasegmentals; chapter numbers not
//     verified, cited at book level: https://en.wikipedia.org/wiki/A_Course_in_Phonetics
//   Jurafsky & Martin, Speech and Language Processing (3rd ed. draft) — TOC verified (2 Words and
//     tokens, 3 N-gram LMs, 5 Embeddings, 15 Phonetics, 19 CFGs and constituency parsing,
//     20 Dependency parsing, App. H logical semantics): https://web.stanford.edu/~jurafsky/slp3/
//   Courses: MIT 24.900 Introduction to Linguistics (morphology, phonetics, phonology, syntax,
//     semantics, dialects, historical linguistics, endangered languages, acquisition, signed
//     languages): https://ocw.mit.edu/courses/24-900-introduction-to-linguistics-spring-2022/pages/lecture-notes/
//   Lists: https://en.wikipedia.org/wiki/Brevity_law (Zipf's law of abbreviation; Menzerath, Heaps).
// Gaps filled after comparison: coarticulation and categorical perception, the McGurk effect,
//   Optimality Theory, nonconcatenative morphology, Menzerath's law, stylometry, cross-serial
//   dependencies (Shieber), island constraints, word-order universals (Greenberg), Berlin–Kay colour
//   terms, Hangul as a featural script, laryngeal theory, chain shifts, Labov's sociolinguistics,
//   pidgins and creoles, endangered languages, Nicaraguan Sign Language, aphasia.
// Deliberate omissions: detailed generative frameworks beyond an X-bar sketch (Minimalism, HPSG,
//   LFG), discourse analysis, neural language models (covered by the ML collections).
// Landmark papers (October 2026): Jones 1786 (8.13), Grimm 1822 (8.14), Verner 1877 (8.15), Frege
//   1892 (6.16), Saussure 1916 (6.15), Zipf 1935 (4.13), Swadesh 1952 (9.12), Ventris & Chadwick 1953
//   (7.11), Shannon 1951 (4.14, also introducing info-11.9), Chomsky 1957 (5.16), Labov 1966 (8.16),
//   Gray & Atkinson 2003 (9.13).
//   Citations checked against the Crossref API (DOIs, volumes, pages), archive.org / HathiTrust /
//   IMSLP / Project Gutenberg catalogue records for treatises without a DOI, and Wikipedia citations
//   (with JSTOR ids) where a publisher page was not reachable. No DOI was guessed.
export default {
  collection: 'ling',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Phonetics: the sounds of speech',
      summary: String.raw`Speech is sound shaped by the vocal tract: the larynx supplies a buzz or a hiss and the tongue, lips and velum filter it. Articulatory phonetics classifies consonants by place, manner and voicing and vowels by tongue position, and the IPA gives each sound one symbol. Acoustically, vowels are identified by their formants, so the vowel chart can be measured from a recording; perception then imposes its own categories on the continuous signal.`,
      items: [
        { num: '1.1', kind: 'Model', name: 'Speech production as source and filter', deps: ['music-4.10', 'sig-3.9'], refs: ['Ladefoged & Johnson', 'Jurafsky & Martin ch. 15'],
          pic: 'A glottal pulse train or a noise source passes through a vocal-tract filter whose shape you drag; the output spectrum is source × filter, with ▶ Listen.' },
        { num: '1.2', kind: 'Definition', name: 'The International Phonetic Alphabet', deps: [], refs: ['Ladefoged & Johnson'],
          pic: 'The IPA consonant and vowel charts, clickable: each symbol plays a recording and highlights its place, manner, voicing or tongue position.' },
        { num: '1.3', kind: 'Concept', name: 'Place of articulation', deps: ['ling-1.2'], refs: ['Ladefoged & Johnson'],
          pic: 'A mid-sagittal vocal-tract diagram: drag the constriction from the lips back to the glottis and the matching stops [p t k ʔ] and their spectra appear.' },
        { num: '1.4', kind: 'Concept', name: 'Manner of articulation', deps: ['ling-1.3'], refs: ['Ladefoged & Johnson'],
          pic: 'Narrow a constriction from full closure through near-closure to open: stop, fricative, approximant and vowel spectra morph into each other, with airflow shown.' },
        { num: '1.5', kind: 'Concept', name: 'Voicing and voice onset time', deps: ['ling-1.4'], refs: ['Ladefoged & Johnson'],
          pic: 'Slide the VOT of a synthetic stop from −100 to +100 ms: a waveform and spectrogram show the burst and the onset of voicing, and [b], [p] and [pʰ] regions are marked.' },
        { num: '1.6', kind: 'Concept', name: 'Vowels: height, backness and rounding', deps: ['ling-1.2'], refs: ['Ladefoged & Johnson'],
          pic: 'Drag the tongue body around the mouth and toggle lip rounding: the vowel symbol and its synthetic sound update across the IPA vowel trapezoid.' },
        { num: '1.7', kind: 'Concept', name: 'Formants: resonances of the vocal tract', deps: ['ling-1.1', 'music-4.9'], refs: ['Ladefoged & Johnson', 'Jurafsky & Martin ch. 15'],
          pic: 'Spectra of sung vowels at different pitches: harmonics move but the spectral envelope’s peaks F1, F2, F3 stay put, and are tracked live on a spectrogram.' },
        { num: '1.8', kind: 'Model', name: 'The uniform tube: a quarter-wave resonator', deps: ['ling-1.7', 'music-3.3', 'ode-3.13'], refs: ['Ladefoged & Johnson'],
          pic: 'Treat the vocal tract as a 17 cm tube closed at the glottis: resonances at odd multiples of c/4L (about 500, 1500, 2500 Hz) give the neutral schwa; squeeze the tube and they shift.' },
        { num: '1.9', kind: 'Concept', name: 'The acoustic vowel space: F1 against F2', deps: ['ling-1.7', 'ling-1.6'], refs: ['Ladefoged & Johnson'],
          pic: 'Plot vowels by F1 (down) and F2 (left) from reference data or the reader’s own microphone: the cloud reproduces the articulatory vowel chart.' },
        { num: '1.10', kind: 'Phenomenon', name: 'Speaker normalisation of vowels', deps: ['ling-1.9', 'pma-8.6'], refs: ['Ladefoged & Johnson'],
          pic: 'Vowel spaces of men, women and children overlap badly in raw hertz; apply Lobanov z-scoring and the categories line up.' },
        { num: '1.11', kind: 'Method', name: 'Reading speech spectrograms', deps: ['music-4.7', 'ling-1.5'], refs: ['Ladefoged & Johnson', 'Jurafsky & Martin ch. 15'],
          pic: 'Record or load a phrase: the spectrogram is segmented by hand-placed boundaries, with stops as gaps and bursts, fricatives as noise and vowels as formant bands.' },
        { num: '1.12', kind: 'Phenomenon', name: 'Coarticulation and formant transitions', deps: ['ling-1.11'], refs: ['Ladefoged & Johnson'],
          pic: 'Synthesise [di], [da], [du]: the F2 transitions out of [d] point to a common locus near 1800 Hz rather than being identical, showing the consonant is spread across the vowel.' },
        { num: '1.13', kind: 'Phenomenon', name: 'Categorical perception of stop consonants', deps: ['ling-1.5', 'prob-2.1.13'], refs: ['Fromkin et al.'],
          pic: 'Listen to a VOT continuum and label each step: identification jumps abruptly from /b/ to /p/, and discrimination peaks at the boundary.' },
        { num: '1.14', kind: 'Model', name: 'Vowel systems as maximal dispersion', deps: ['ling-1.9', 'pma-4.16'], refs: ['Ladefoged & Johnson'],
          pic: 'Place n vowels in the F1–F2 space to maximise their mutual distances: the optimum for three vowels is /i a u/ and for five /i e a o u/, matching the most common inventories.' },
        { num: '1.15', kind: 'Concept', name: 'Tone and intonation', deps: ['ling-1.1'], refs: ['Ladefoged & Johnson'],
          pic: 'A pitch track of Mandarin ma with four tones and of an English question versus statement: drag the F0 contour of a resynthesised word and hear the meaning change.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Phonology: sound systems',
      summary: String.raw`Every language groups its sounds into a small set of contrastive units, the phonemes, whose variants depend predictably on context. Rules stated over distinctive features capture these patterns and interact in orders that matter. Syllables are organised by sonority, stress builds metrical feet, and Optimality Theory recasts the rules as ranked, violable constraints.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Phonemes and minimal pairs', deps: ['ling-1.2'], refs: ['Fromkin et al.'],
          pic: 'Swap one sound in a word (pat/bat/mat) and check whether the meaning changes; a grid of minimal pairs shows English contrasts that Spanish or Japanese lack.' },
        { num: '2.2', kind: 'Definition', name: 'Allophones and complementary distribution', deps: ['ling-2.1'], refs: ['Fromkin et al.'],
          pic: 'Tabulate where aspirated [pʰ] and plain [p] occur in English words: their environments never overlap, so the tool groups them into one phoneme.' },
        { num: '2.3', kind: 'Concept', name: 'Distinctive features', deps: ['ling-2.1', 'ling-1.4', 'comb-1.1'], refs: ['Fromkin et al.'],
          pic: 'Toggle binary features such as [±voice], [±nasal], [±continuant]: the set of matching IPA symbols narrows on the chart.' },
        { num: '2.4', kind: 'Concept', name: 'Natural classes', deps: ['ling-2.3', 'logic-2.3'], refs: ['Fromkin et al.'],
          pic: 'Select a set of sounds and the tool finds the smallest feature bundle defining exactly that set, or reports that none exists.' },
        { num: '2.5', kind: 'Method', name: 'Phonological rules: A → B / C __ D', deps: ['ling-2.2', 'ling-2.4'], refs: ['Fromkin et al.'],
          pic: 'Write a rule in feature notation and apply it to a word list: each underlying form is rewritten step by step, and wrong predictions are flagged against the data.' },
        { num: '2.6', kind: 'Concept', name: 'Rule ordering: feeding and bleeding', deps: ['ling-2.5', 'comb-1.5'], refs: ['Fromkin et al.'],
          pic: 'Apply Canadian raising and flapping to “writer” and “rider” in both orders: only one order produces the attested pronunciations.' },
        { num: '2.7', kind: 'Concept', name: 'Assimilation, deletion and epenthesis', deps: ['ling-2.5'], refs: ['Fromkin et al.'],
          pic: 'Pick a process (nasal place assimilation, schwa deletion, vowel insertion) and see it applied to real examples with before-and-after transcriptions.' },
        { num: '2.8', kind: 'Concept', name: 'Phonotactics', deps: ['ling-2.1'], refs: ['Fromkin et al.'],
          pic: 'Type invented words: a model trained on an English lexicon scores how wordlike each is, so blick passes and bnick fails.' },
        { num: '2.9', kind: 'Concept', name: 'Syllable structure: onset, nucleus, coda', deps: ['ling-2.8'], refs: ['Ladefoged & Johnson'],
          pic: 'Type a word and see it parsed into syllable trees with onset, nucleus and coda, with ambiguous syllabifications offered for comparison.' },
        { num: '2.10', kind: 'Principle', name: 'The sonority sequencing principle', deps: ['ling-2.9'], refs: ['Ladefoged & Johnson'],
          pic: 'Plot sonority across a word: well-formed syllables rise to a peak at the vowel and fall; words like “strengths” show the s-cluster exceptions.' },
        { num: '2.11', kind: 'Concept', name: 'Stress and metrical feet', deps: ['ling-2.9'], refs: ['Ladefoged & Johnson'],
          pic: 'Build a metrical grid over words like photograph / photographer / photographic: the stress moves as suffixes are added, and the foot structure explains why.' },
        { num: '2.12', kind: 'Concept', name: 'Vowel harmony', deps: ['ling-2.3'], refs: ['Fromkin et al.'],
          pic: 'Attach Turkish suffixes to stems: the suffix vowel copies the stem’s backness and rounding, with features coloured across the word.' },
        { num: '2.13', kind: 'Model', name: 'Optimality Theory: ranked violable constraints', deps: ['ling-2.5', 'ling-2.9'], refs: ['Fromkin et al.'],
          pic: 'A tableau of candidates and constraints: drag constraints to re-rank them and watch the winning candidate change, reproducing patterns of different languages.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Morphology: the structure of words',
      summary: String.raw`Words are built from morphemes, units with meaning or grammatical function. Inflection marks grammar while derivation makes new words, and both have internal hierarchical structure. Languages differ in how much they pack into a word, from isolating to polysynthetic, and some build words by interleaving roots and patterns or by copying. Productivity explains why speakers can inflect words they have never heard.`,
      items: [
        { num: '3.1', kind: 'Definition', name: 'Morphemes: free and bound', deps: [], refs: ['Fromkin et al. ch. 2'],
          pic: 'Type a word such as unbelievably: the tool segments it into morphemes with glosses and colours roots, prefixes and suffixes.' },
        { num: '3.2', kind: 'Concept', name: 'Inflection versus derivation', deps: ['ling-3.1'], refs: ['Fromkin et al. ch. 2'],
          pic: 'Sort affixes into inflectional and derivational bins using tests such as category change and productivity; misplacements are explained.' },
        { num: '3.3', kind: 'Concept', name: 'Word-internal structure and ambiguity', deps: ['ling-3.2'], refs: ['Fromkin et al. ch. 2'],
          pic: 'Bracket unlockable two ways — [un[lockable]] and [[unlock]able] — and see each tree yield a different meaning.' },
        { num: '3.4', kind: 'Concept', name: 'Compounding and headedness', deps: ['ling-3.3'], refs: ['Fromkin et al. ch. 2'],
          pic: 'Build compounds like “bird cage” and “cage bird”: the right-hand head determines category and meaning, with stress patterns marked.' },
        { num: '3.5', kind: 'Concept', name: 'Allomorphy: the English plural', deps: ['ling-3.1', 'ling-2.5'], refs: ['Fromkin et al. ch. 2'],
          pic: 'Type nouns and see the plural surface as [s], [z] or [ɪz]: the rule conditioned on the stem’s final sound is shown firing.' },
        { num: '3.6', kind: 'Concept', name: 'Morphological typology', deps: ['ling-3.1'], refs: ['Sapir, Language ch.VI; Bickel & Nichols, WALS20–22'],
          pic: 'Compare source-derived local morphemes/word, separate phonological fusion from cumulative category marking, and inspect the original145-language categories-per-verb survey with its counting limits.' },
        { num: '3.7', kind: 'Concept', name: 'Productivity', deps: ['ling-3.5'], refs: ['Fromkin et al. ch. 2'],
          pic: 'Count hapax legomena among words with -ness and -th in a corpus: Baayen’s productivity measure separates living affixes from fossilised ones.' },
        { num: '3.8', kind: 'Concept', name: 'Roots and templates: nonconcatenative morphology', deps: ['ling-3.1'], refs: ['McCarthy1979 pp.240,309–311,397; McCarthy1981 pp.382–385; McCarthy & Prince1990 p.223'],
          pic: 'Inspect saved root/pattern associations: shared vowel nodes spread to slots, fixed affixes remain separate, and source-checked stems are distinguished from generated strings.' },
        { num: '3.9', kind: 'Concept', name: 'Reduplication', deps: ['ling-3.1'], refs: ['Rubino WALS27; Schachter & Otanes1972; Fettes2024; Sato2009; official EYD V and Microsoft Filipino guide'],
          pic: 'Compare checked Indonesian/Tagalog spelling examples and strict authored CV/CVC/full copying, with exact saved inputs, fixed affixes, source meanings and WALS sample counts.' },
        { num: '3.10', kind: 'Phenomenon', name: 'Irregular forms and blocking', deps: ['ling-3.7'], refs: ['Aronoff1976 pp.43–45; Lieberman et al.2007 original study and attached CELEX table'],
          pic: 'Inspect all177 retained Old English irregular lemmas by source count and historical code, compare scoped square-root scaling, and toggle an authored go/went or glorious/glory lookup.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'The statistical laws of language',
      summary: String.raw`Texts in every language obey striking regularities: word frequency falls off as a power of rank, vocabulary keeps growing as a sublinear power of text length, and common words are short. These laws can be reproduced by surprisingly simple processes, which tempers what can be concluded from them. Information theory measures how predictable language is, and recent work suggests that languages trade speed against information density to converge on similar rates.`,
      items: [
        { num: '4.1', kind: 'Law', name: 'Zipf’s law of word frequencies', deps: [], refs: ['Jurafsky & Martin ch. 2'],
          pic: 'Paste any text: word frequencies are plotted against rank on log–log axes, with the fitted exponent (near −1) and the deviations at the head and tail.' },
        { num: '4.2', kind: 'Model', name: 'Random typing produces Zipf’s law (Miller)', deps: ['ling-4.1', 'prob-2.1.13', 'comb-1.1'], refs: ['Jurafsky & Martin ch. 2'],
          pic: 'Generate text by hitting random letters and spaces: its rank–frequency plot is also a power law, compared with a real text on the same axes.' },
        { num: '4.3', kind: 'Model', name: 'Simon’s rich-get-richer process', deps: ['ling-4.1', 'prob-1.6.1'], refs: ['Jurafsky & Martin ch. 2'],
          pic: 'Grow a text by repeating a previous word with probability 1 − α or coining a new one: the exponent of the resulting Zipf curve tracks α.' },
        { num: '4.4', kind: 'Law', name: 'Heaps’ law of vocabulary growth', deps: ['ling-4.1', 'prob-1.6.1'], refs: ['Jurafsky & Martin ch. 2'],
          pic: 'Read through a pasted text word by word: distinct words V(N) grow like K·N^β with β below 1, fitted live.' },
        { num: '4.5', kind: 'Law', name: 'Zipf’s law of abbreviation', deps: ['ling-4.1', 'algo-10.3'], refs: ['Jurafsky & Martin ch. 2'],
          pic: 'Scatter word length against frequency for a pasted text or for several languages: frequent words are shorter, with the rank correlation shown.' },
        { num: '4.6', kind: 'Law', name: 'Menzerath’s law', deps: ['ling-4.5', 'ode-1.3', 'ladr-6.61'], refs: ['Altmann1980 pp.1–10, Eq.3/Table1 and Tables2–4'],
          pic: 'Inspect the original three datasets alongside explicitly heuristic literary proxies; refit signed coefficient families, test the derivative over the observed interval and compare derived totals without asserting a compression mechanism.' },
        { num: '4.7', kind: 'Concept', name: 'Letter frequencies and frequency analysis', deps: [], refs: ['Jurafsky & Martin ch. 2'],
          pic: 'Count letter frequencies in a pasted text and use them to crack a substitution cipher interactively, swapping letters until the plaintext emerges.' },
        { num: '4.8', kind: 'Concept', name: 'The entropy of English (Shannon’s guessing game)', deps: ['ling-4.7', 'info-1.2', 'info-2.9', 'info-2.7'], refs: ['Shannon1951 §§3–6, Eq.17'],
          pic: 'Play a saved next-symbol guessing exercise; keep its observed histogram separate from ideal-rank bounds and directly computed conditional entropy in a known finite source.' },
        { num: '4.9', kind: 'Model', name: 'N-gram language models', deps: ['ling-4.8', 'info-2.4'], refs: ['Jurafsky & Martin ch.3, official August19,2026 draft'],
          pic: 'Train normalized unigram to 4-gram models on an explicit token split; compare smoothed perplexity, unsupported unsmoothed continuations and samples from the selected distribution with a saved seed.' },
        { num: '4.10', kind: 'Hypothesis', name: 'Uniform information density', deps: ['ling-4.9', 'pma-8.6'], refs: ['Levy & Jaeger2006 §§2–5, Eq.2–3 and footnote4'],
          pic: 'Use the original spoken relative-clause setting; split structural and lexical surprisal with an ideal cue and compare a declared quadratic-load saving against an extra-word cost.' },
        { num: '4.11', kind: 'Phenomenon', name: 'Similar information rates across languages', deps: ['ling-4.8', 'ling-2.9'], refs: ['Jurafsky & Martin ch. 3'],
          pic: 'Syllables per second against information per syllable for 17 languages: fast languages carry less per syllable and the product clusters near 39 bits/s (Coupé et al., 2019).' },
        { num: '4.12', kind: 'Method', name: 'Stylometry and authorship attribution', deps: ['ling-4.1', 'prob-1.6.13'], refs: ['Mosteller & Wallace1963 §§1–3,7–8; official PG1404'],
          pic: 'Compare every checked Federalist marker count in a scoped plug-in Poisson model; inspect per-word scores and leave-one-out rate fits while distinguishing this corpus and its validation from the original study.' },
        { num: '4.13', kind: 'Paper', name: 'The Psycho-Biology of Language',
          paper: { authors: 'George Kingsley Zipf', year: 1935, title: 'The Psycho-Biology of Language: An Introduction to Dynamic Philology',
                   venue: 'Boston: Houghton Mifflin, 1935', url: 'https://languagelog.ldc.upenn.edu/myl/Zipf1935b.pdf' },
          introduces: ['ling-4.1', 'ling-4.5'], deps: [], refs: ['Zipf1935 pp.24–28,38–47; Mandelbrot1953 pp.486–492'],
          pic: 'Compare the book’s actual word-form and harmonic diagnostics with literary-excerpt rank products and letter-length groups; fit both power families on the same ranks and expose the finite integer-shift search.' },
        { num: '4.14', kind: 'Paper', name: 'Prediction and Entropy of Printed English',
          paper: { authors: 'C. E. Shannon', year: 1951, title: 'Prediction and Entropy of Printed English',
                   venue: 'Bell System Technical Journal 30 (1): 50–64', doi: '10.1002/j.1538-7305.1951.tb01366.x' },
          introduces: ['ling-4.8', 'info-11.9'], deps: ['info-1.2', 'ling-4.9'], refs: ['Shannon1951 pp.54–64, Eq.17 and original tables'],
          pic: 'Inspect the original noisy experimental table and distinguish its ideal-predictor assumptions from a complete 27-rank rectangular decomposition of a known finite source.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      "n": 5,
      "title": "Syntax: the structure of sentences",
      "summary": "A sentence can have more than one hierarchical analysis. Constituency diagnostics motivate structures; explicit grammars make their predictions testable. Recursion, parser behavior, filler-gap relations and word-order samples ask different questions. Formal-language arguments constrain idealized grammars without turning a finite demonstration into a theory of every natural language.",
      "items": [
        {
          "num": "5.1",
          "kind": "Concept",
          "name": "Constituents and syntactic categories",
          "deps": [],
          "refs": [
            "Richards, MIT24.900 Spring2022 Lecture12, slide47; Jurafsky–Martin, SLP3,19Aug2026, ch19 §§19.1–19.2"
          ],
          "pic": "Type a sentence in the declared toy grammar, select an actual parse and choose a half-open word span. Compare the span with the node yields of that tree; switching a PP attachment can change the answer. Add proposed start:end brackets and test their actual interval crossings. Word indices link the interval picture to the complete sentence in the readout."
        },
        {
          "num": "5.2",
          "kind": "Method",
          "name": "Constituency tests",
          "deps": [
            "ling-5.1"
          ],
          "refs": [
            "Anderson et al., Essentials of Linguistics2, §6.4, replacement-test passage actually read; Jurafsky–Martin ch19, historical notes on substitution; Richards MIT24.900 Lecture12, constituency and fronting examples"
          ],
          "pic": "Select a span of the typed sentence and actually perform substitution, fronting, clefting, answer extraction or coordination. Edit the replacement phrase, inspect the resulting string and judge it in a suitable context. Empty or reversed spans are rejected as invalid operations."
        },
        {
          "num": "5.3",
          "kind": "Concept",
          "name": "Phrase-structure rules and syntax trees",
          "deps": [
            "ling-5.1",
            "toc-5.1"
          ],
          "refs": [
            "Jurafsky–Martin ch19 §§19.2–19.4; Richards MIT24.900 Lecture12, slides6–11 and47"
          ],
          "pic": "Edit the grammar and sentence, compute a real parse and replay its leftmost sentential forms. The final parse tree stays visible while the player changes the derivation. Try a missing lexical rule, a recursive rule, an empty production or a sentence outside the grammar."
        },
        {
          "num": "5.4",
          "kind": "Phenomenon",
          "name": "Structural ambiguity",
          "deps": [
            "ling-5.3"
          ],
          "refs": [
            "Hayes, Introductory Linguistics2021, pp85–88; Richards MIT24.900 Lecture12, slides12–23; Jurafsky–Martin ch19 §19.5"
          ],
          "pic": "Type a sentence, enumerate its exact parse count and select an actual tree. The linked head-index plot changes with the real attachment. Try a single-parse sentence or one the grammar cannot derive."
        },
        {
          "num": "5.5",
          "kind": "Concept",
          "name": "Recursion and the infinitude of sentences",
          "deps": [
            "ling-5.3"
          ],
          "refs": [
            "Richards MIT24.900 Lecture12, slides8–11; explicit grammar and counting argument supplied here"
          ],
          "pic": "Increase the recursive PP depth, inspect the actual parse and compare its length with the complete bounded word-count formula. The finite controls illustrate the construction used in the unbounded proof."
        },
        {
          "num": "5.6",
          "kind": "Phenomenon",
          "name": "Centre embedding and the limits of memory",
          "deps": [
            "ling-5.5",
            "toc-5.14"
          ],
          "refs": [
            "Richards MIT24.900 Lecture12, competence/performance distinction; declared predictive grammars and complete parser calculations supplied here"
          ],
          "pic": "Compare centre and right relative-clause examples at the same depth and token count. Step through the actual predictions and matches; choose an illustrative stack budget and compare it with the measured peak. Both complete grammars and the current stack remain visible in the readout."
        },
        {
          "num": "5.7",
          "kind": "Phenomenon",
          "name": "Garden-path sentences",
          "deps": [
            "ling-5.4"
          ],
          "refs": [
            "Wiegand, Cornell cognitive-science syntax slides, Garden Paths passage; explicit bounded search model supplied here"
          ],
          "pic": "Type the prefix or complete sentence, switch between real backtracking and first-choice search, and step through the actual consumed-prefix trace. Drops in consumed position mark restored alternatives. Lower the action bound to obtain an honestly inconclusive run."
        },
        {
          "num": "5.8",
          "kind": "Concept",
          "name": "The Chomsky hierarchy and natural language",
          "deps": [
            "ling-5.3",
            "toc-5.7",
            "toc-5.6"
          ],
          "see": [
            "ling-5.9"
          ],
          "refs": [
            "Shieber1985, pp333–343, string-language and competence qualifications; Jurafsky–Martin ch19 §19.4; family arguments supplied here"
          ],
          "pic": "Type an actual symbol word and compare membership in three precisely stated families. The matcher checks block order as well as counts. Its finite answer illustrates the separate unbounded classification arguments."
        },
        {
          "num": "5.9",
          "kind": "Theorem",
          "name": "Swiss German is not context-free (Shieber)",
          "deps": [
            "ling-5.8",
            "toc-5.6",
            "toc-5.9"
          ],
          "refs": [
            "Shieber1985, Linguistics and Philosophy8:333–343, §§3–4 and note4; explicit product construction and capacity-aware pumping proof supplied here"
          ],
          "pic": "Choose all four block sizes independently. The model constructs the actual abstract word, lexical chunks and same-case ordered pairings; unmatched extras and crossing counts remain visible. Compare matched blocks with a case mismatch or an empty block. The diagram is a schematic for the explicitly conditional proof."
        },
        {
          "num": "5.10",
          "kind": "Concept",
          "name": "X-bar theory: heads, complements, specifiers",
          "deps": [
            "ling-5.3"
          ],
          "refs": [
            "Richards MIT24.900 Lecture12, slides6–7; Lecture14, slides21–27; Essentials of Linguistics2 §6.14, hypothesis passage actually read"
          ],
          "pic": "Build NP, VP, PP or AP from actual category nodes. Toggle the head/complement order and specifier, then add adjunct layers. Follow the resulting tree and its exact placeholder frontier."
        },
        {
          "num": "5.11",
          "kind": "Concept",
          "name": "Dependency grammar",
          "deps": [
            "ling-5.1"
          ],
          "refs": [
            "Jurafsky–Martin, SLP3,19Aug2026, ch20 §§20.1–20.2, pp1–5; lossy-map counterexample supplied here"
          ],
          "pic": "Convert an actual parse with declared toy head rules or edit the full head list. Try a cycle, multiple roots and a genuinely nonprojective rooted tree. The readout gives the exact directed head assignments and interval test."
        },
        {
          "num": "5.12",
          "kind": "Concept",
          "name": "Movement and wh-questions",
          "deps": [
            "ling-5.10"
          ],
          "refs": [
            "Richards MIT24.900 Lecture14, slides33–37; Lecture16, movement and constraints passages"
          ],
          "pic": "Choose a simple or embedded complement clause. The actual selected subtree is copied into a filler position and replaced at its original tree path by a gap. Compare source tokens, the abstraction and the separately specified question form."
        },
        {
          "num": "5.13",
          "kind": "Concept",
          "name": "Island constraints (Ross)",
          "deps": [
            "ling-5.12"
          ],
          "refs": [
            "Richards MIT24.900 Lecture16, slides51–58; Hayes2021, pp243–248, complex NP constraint and derivations; Ross1967 MIT thesis catalog metadata only (original body not read)"
          ],
          "pic": "Switch the extraction domain among a complement, complex NP, coordinate conjunct and subject. The model actually follows the argument path, leaves a gap and lists every annotated boundary it crosses. Compare the resulting candidate questions without treating the boundary flag as a speaker experiment."
        },
        {
          "num": "5.14",
          "kind": "Concept",
          "name": "Word-order typology and Greenberg’s universals",
          "deps": [
            "ling-5.1"
          ],
          "refs": [
            "Dryer, WALS Online chapters81 and95, current value tables and feature GeoJSON records; retrieved21 Oct 2026"
          ],
          "pic": "Filter actual WALS language coordinates by macroarea and dominant order, inspect a named record and compare the separately computed95A table. Both exceptional cells remain visible. Longitude normalization changes only display coordinates, not the source records."
        },
        {
          "num": "5.15",
          "kind": "Algorithm",
          "name": "CKY parsing",
          "deps": [
            "ling-5.3",
            "toc-5.10"
          ],
          "refs": [
            "Jurafsky–Martin ch19 §19.6, pp11–15; exact counted-forest induction supplied here"
          ],
          "pic": "Edit an already binary grammar and sentence. Fill every actual chart cell step by step, inspect exact category counts and select a real parse by its packed rank. Invalid grammar forms are refused explicitly rather than silently converted."
        },
        {
          "num": "5.16",
          "kind": "Paper",
          "name": "Syntactic Structures",
          "paper": {
            "authors": "Noam Chomsky",
            "year": 1957,
            "title": "Syntactic Structures",
            "venue": "’s-Gravenhage: Mouton, 1957",
            "doi": "10.1515/9783112316009"
          },
          "introduces": [
            "ling-5.3",
            "ling-5.12"
          ],
          "deps": [
            "ling-5.3",
            "stoch-1.12"
          ],
          "see": [
            "ling-5.1",
            "ling-5.2",
            "ling-5.12"
          ],
          "refs": [
            "Richards MIT24.900 Spring2022, syntax/competence lectures; STOCH1.12 actual fitted Markov construction; original 1957 metadata, body inaccessible"
          ],
          "verify": true,
          "pic": "Edit both the test sentence and the training clauses. Compute the actual phrase parse and every fitted conditional-probability factor, including zero-count and unseen-context cases. Compare grammatical structure in this declared grammar with probability in this declared training sample."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'Meaning: semantics and pragmatics',
      summary: String.raw`The meaning of a sentence is computed from the meanings of its parts and the way they are combined, and can be modelled as the conditions under which it is true. Quantifiers, scope and presupposition show how much structure that computation needs. Much of what we communicate is not said but implied, through Grice’s maxims of cooperative conversation, and many utterances are actions rather than descriptions.`,
      items: [
        { num: '6.1', kind: 'Concept', name: 'Sense and reference (Frege)', deps: [], refs: ["IEP, “Gottlob Frege: Language”, selected §3b; finite non-injective presentation map and ledger supplied here"],
          pic: "Compare the two Venus descriptions, their presentation paths and independently stipulated belief entries. Ordinary identity and preservation of an indirect report are computed separately." },
        { num: '6.2', kind: 'Principle', name: 'Compositionality', deps: ['ling-6.1', 'ling-5.3'], refs: ["Jurafsky–Martin, SLP3, 19 August 2026, Appendix H, selected pp10–12 (§§H.3.2–H.3.4); supplied finite curried relation"],
          pic: "Edit a real greeting relation by tapping its matrix or using the keyboard controls. Choose subject and object, highlight the application steps, and inspect the computed verb-phrase extension and complete sentence." },
        { num: '6.3', kind: 'Concept', name: 'Truth conditions and models', deps: ['ling-6.2', 'logic-3.4'], refs: ["Written LOGIC 3.4 satisfaction definition; Jurafsky–Martin Appendix H, selected pp4–12; finite interpretation supplied here"],
          pic: "Tap an object to change the selected property, or use the object index and edit button. The drawn world, membership table, witnesses and quantified truth all use the same stored model." },
        { num: '6.4', kind: 'Concept', name: 'Generalised quantifiers', deps: ['ling-6.3'], refs: ["Richards, MIT 24.900 Spring 2022 Lecture 18, selected slides 25–41; supplied finite conservativity proofs"],
          pic: "Change the counts in all four Venn regions, evaluate a chosen quantifier and replace B by A∩B. Compare the familiar conservative tests with the invented union test and try an empty restrictor." },
        { num: '6.5', kind: 'Phenomenon', name: 'Scope ambiguity', deps: ['ling-6.4'], refs: ["Richards, MIT 24.900 Lecture 18, selected slides 48–53 and 55–63; supplied scope implication and finite countermodel"],
          pic: "Edit the actual student–book relation. Compare per-student witness lists with common-book witnesses, switch between separate and shared books, and include empty restrictors." },
        { num: '6.6', kind: 'Concept', name: 'Entailment and presupposition', deps: ['ling-6.3'], refs: ["SEP “Presupposition”, selected §§1.2–1.3; supplied four-world partial interpretation and filtering example"],
          pic: "Compare all four worlds under affirmation, negation, questioning and a filtering conditional. Undefined, false and live-answer states remain visibly distinct." },
        { num: '6.7', kind: 'Principle', name: 'Grice’s cooperative principle and maxims', deps: [], refs: ["von Fintel, MIT24.903 Spring 2005, one-page “Grice’s System” handout; authored dialogues and alternative readings supplied here"],
          pic: "Inspect eight authored exchanges, choose a salient maxim and switch off the cooperative inference. The literal content, proposed extra inference and required assumption remain separate." },
        { num: '6.8', kind: 'Concept', name: 'Scalar implicature', deps: ['ling-6.7', 'ling-6.4'], refs: ["MIT24.903 Grice handout; SEP “Presupposition” §1.3 cancellation discussion; complete finite probabilistic model supplied here"],
          pic: "Compare literal alternatives, the declared prior, and the actual normalized pragmatic posterior. Change informativeness or the cost of all, then compare a consistent cancellation with a contradictory continuation." },
        { num: '6.9', kind: 'Concept', name: 'Speech acts and performatives (Austin, Searle)', deps: ['ling-6.7'], refs: ["SEP “Speech Acts”, selected partial §2.1, complete §3.3 and partial §3.4; supplied finite institutional bookkeeping"],
          pic: "Compare a promise, a naming declaration and an indirect salt request. Change the relevant conditions and inspect content, force, before/after record and failure type separately." },
        { num: '6.10', kind: 'Concept', name: 'Deixis and indexicals', deps: ['ling-6.1'], refs: ["SEP “Indexicals”, introductory character/content discussion, revision 3 September 2026; supplied context and world-evaluation model"],
          pic: "Change speaker and utterance time, then hold that context fixed while shifting an alternative-world trajectory. Compare the location diagram, time trace and resulting content tuple." },
        { num: '6.11', kind: 'Concept', name: 'Prototypes and fuzzy categories (Rosch)', deps: [], refs: ["SEP “Concepts”, selected §2.2 prototype theory and its limitations; authored feature representation and weighted-score derivation"],
          pic: "Compare the separate category labels, authored feature table and weighted similarity. Change which attributes matter and inspect cases where typicality and membership diverge." },
        { num: '6.12', kind: 'Phenomenon', name: 'Basic colour terms (Berlin and Kay)', deps: ['ling-6.11', 'art-5.3'], refs: ["Cook, Kay & Regier, WCS Data Archives: expanded focus responses, 14 April 2003, dictionary, 16 October 2004, language list, 19 December 2002 and corrected Munsell/Lab mapping, 2 March 2009; archived READMEs; preserved ART 5 colour conversions"],
          pic: "Select an actual survey language and focal term, inspect observed focal-choice counts, and locate a source chip. Desktop shows all 40 hues; phone windows keep ten hue columns readable at once. Tap either array or use the source row and hue controls." },
        { num: '6.13', kind: 'Concept', name: 'Distributional semantics and word vectors', deps: ['ling-4.9'], refs: ["Jurafsky–Martin, SLP3, 19 August 2026, ch5 selected pp5–10 (§§5.2–5.4); actual bounded corpus counting supplied here"],
          pic: "Edit the text and context window. Inspect the actual count matrix, two complete vectors, full-vector cosines and their two-coordinate projection. Tap a matrix cell to select a word pair; the vocabulary list links every numeric index to its word." },
        { num: '6.14', kind: 'Concept', name: 'Vagueness in natural-language predicates', deps: ['ling-6.11', 'phil-3.1'], refs: ["Written PHIL 3.1 sorites argument; supplied admissible-threshold, measure and illustrative logistic derivations"],
          pic: "Move the height, criterion and threshold interval. Compare full-interval supervaluation status, illustrative candidate cutoffs, an exact piecewise fraction and a separately labeled smooth response model." },
        { num: '6.15', kind: 'Paper', name: 'Cours de linguistique générale',
          paper: { authors: 'Ferdinand de Saussure', year: 1916, title: 'Cours de linguistique générale',
                   venue: 'ed. Charles Bally and Albert Sechehaye; Lausanne and Paris: Payot, 1916' },
          introduces: [], deps: ['ling-8.1'], refs: ["Saussure, Cours de linguistique générale, selected Part II, ch. IV §§1–2, French 1971 edition transcription; supplied finite partition analogue"],
          pic: "Compare the sign’s two faces with the surrounding lexical contrasts. Switch the example system, remove a neighbor or add an invented contrast, and inspect the finite assignments and counterfactual state comparison." },
        { num: '6.16', kind: 'Paper', name: 'Über Sinn und Bedeutung (On Sense and Reference)',
          paper: { authors: 'Gottlob Frege', year: 1892, title: 'Über Sinn und Bedeutung',
                   venue: 'Zeitschrift für Philosophie und philosophische Kritik 100: 25–50' },
          introduces: ['ling-6.1', 'ling-6.6'], deps: [], refs: ["Frege (1892), original body unread; IEP “Gottlob Frege: Language”, selected §3b; supplied finite sense/reference and indirect-report illustration"],
          pic: "Build an identity with the two Venus descriptions or the stipulated empty name. Switch between ordinary predications and indirect-report ledger entries, keeping undefined reference distinct from falsity and from absence of sense." },
      ],
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Writing systems and decipherment',
      summary: String.raw`Writing represents language, not ideas directly, and systems differ in which units they encode: words, syllables, consonants, or individual sounds. Writing was invented independently a few times, and the alphabet arose once and spread. Lost scripts were cracked by combining a bilingual text or a structural grid with a hypothesis about the underlying language, and statistics still guide attempts on the scripts that remain unread.`,
      items: [
        { num: '7.1', kind: 'Concept', name: 'Typology of writing systems', deps: [], refs: ['Fromkin et al.'],
          pic: 'Write the same phrase in Chinese, Japanese kana, Hebrew, Devanagari and Latin: each character is linked to the unit it encodes (morpheme, syllable, consonant, segment).' },
        { num: '7.2', kind: 'Hypothesis', name: 'From clay tokens to cuneiform (Schmandt-Besserat)', deps: ['ling-7.1'], refs: ['Fromkin et al.'],
          pic: 'Tokens sealed in a clay envelope, then impressed on its surface, then replaced by marks on a tablet: the proposed sequence is shown with dates and the competing views.' },
        { num: '7.3', kind: 'Concept', name: 'The rebus principle', deps: ['ling-7.1'], refs: ['Fromkin et al.'],
          pic: 'Compose words from pictures by sound (bee + leaf = belief): the step from picture-writing to phonetic writing, with Sumerian and Egyptian examples.' },
        { num: '7.4', kind: 'Event', name: 'The alphabet: Proto-Sinaitic to Greek vowels', deps: ['ling-7.3'], refs: ['Fromkin et al.'],
          pic: 'Morph letter shapes along a timeline from Proto-Sinaitic through Phoenician and Greek to Latin, with the Greek repurposing of consonant signs as vowels highlighted.' },
        { num: '7.5', kind: 'Event', name: 'The Rosetta Stone and Champollion’s decipherment', deps: ['ling-7.3'], refs: ['Fromkin et al.'],
          pic: 'Align the cartouches of Ptolemy and Cleopatra across the Greek and hieroglyphic texts: shared signs give sound values, which then read new names.' },
        { num: '7.6', kind: 'Event', name: 'Linear B and Ventris’s grid', deps: ['ling-7.1'], refs: ['Fromkin et al.'],
          pic: 'Fill Ventris’s grid of signs sharing consonants and vowels from inflection patterns; substitute a few place names and the grid reads as early Greek.' },
        { num: '7.7', kind: 'Event', name: 'Maya glyphs: the phonetic breakthrough (Knorozov)', deps: ['ling-7.3'], refs: ['Fromkin et al.'],
          pic: 'Landa’s “alphabet” reinterpreted as a syllabary: combine CV signs with the vowel-harmony convention to read glyphic spellings of words such as “turkey” and “dog”.' },
        { num: '7.8', kind: 'Concept', name: 'Hangul: a featural alphabet', deps: ['ling-7.1', 'ling-2.3'], refs: ['Fromkin et al.'],
          pic: 'Build Hangul syllable blocks from letters whose shapes depict the articulators: added strokes mark aspiration and tensing, mirrored in a feature table.' },
        { num: '7.9', kind: 'Concept', name: 'Orthographic depth', deps: ['ling-7.4', 'ling-2.1'], refs: ['Fromkin et al.'],
          pic: 'Measure how predictable pronunciation is from spelling in Finnish, Spanish, French and English by training a letter-to-sound model on each and plotting its error rate.' },
        { num: '7.10', kind: 'Method', name: 'Statistics of undeciphered scripts', deps: ['ling-4.8', 'ling-7.1'], refs: ['Jurafsky & Martin ch. 3'],
          pic: 'Sign counts and conditional entropy for Linear A, the Indus script and the Voynich manuscript beside known writing systems and non-linguistic symbol sets, with the debates noted.' },
        { num: '7.11', kind: 'Paper', name: 'Evidence for Greek Dialect in the Mycenaean Archives',
          paper: { authors: 'Michael Ventris and John Chadwick', year: 1953, title: 'Evidence for Greek Dialect in the Mycenaean Archives',
                   venue: 'Journal of Hellenic Studies 73: 84–103', doi: '10.2307/628239' },
          introduces: ['ling-7.6'], deps: ['ling-7.1', 'ling-4.7'], refs: [],
          pic: 'Ventris’s grid filled in: Linear B signs sit in a table of shared consonants (rows) and shared vowels (columns) inferred from inflectional alternations; the reader tests sound values for a few signs using Cretan place names (ko-no-so, a-mi-ni-so), watches the values propagate through the grid, and reads tablet words turning into early Greek, ending with the Pylos tripod tablet that clinched the case.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Historical linguistics: how languages change',
      summary: String.raw`Sound change is, to a remarkable degree, regular: a sound changes everywhere it occurs in the same environment. Grimm’s and Verner’s laws turned the correspondences between Germanic and other Indo-European languages into rules, and the comparative method reconstructs unattested ancestors from such correspondences. Change can be watched in progress, spreading through communities along S-shaped curves.`,
      items: [
        { num: '8.1', kind: 'Principle', name: 'Regularity of sound change (Neogrammarians)', deps: ['ling-2.5'], refs: ['Fromkin et al.'],
          pic: 'Apply one historical change to a whole lexicon: every word with the conditioning environment changes at once, while apparent exceptions are flagged for explanation.' },
        { num: '8.2', kind: 'Law', name: 'Grimm’s law', deps: ['ling-8.1'], refs: ['Fromkin et al.'],
          pic: 'Latin pater, tres, genu beside English father, three, knee: a chain of shifts p→f, t→θ, k→h, b→p, d→t, g→k, bʰ→b animates across a cognate table.' },
        { num: '8.3', kind: 'Law', name: 'Verner’s law', deps: ['ling-8.2', 'ling-2.11'], refs: ['Fromkin et al.'],
          pic: 'Mark the original accent in Sanskrit cognates: Grimm’s fricatives voice exactly when the accent did not immediately precede them, resolving pairs like father vs brother.' },
        { num: '8.4', kind: 'Method', name: 'The comparative method', deps: ['ling-8.1'], refs: ['Fromkin et al.'],
          pic: 'Line up cognates from several Romance languages, extract sound correspondences and propose a proto-form; the tool checks that the proposed changes regenerate each daughter.' },
        { num: '8.5', kind: 'Concept', name: 'Proto-Indo-European and its branches', deps: ['ling-8.4'], refs: ['Fromkin et al.'],
          pic: 'Click a reconstructed root such as *ph₂tḗr and see its reflexes across the branches on a map, each derived by that branch’s sound laws.' },
        { num: '8.6', kind: 'Event', name: 'Laryngeal theory: Saussure’s prediction and Hittite', deps: ['ling-8.4'], refs: ['Fromkin et al.'],
          pic: 'Saussure’s 1879 abstract “coefficients” explain vowel alternations; in Hittite, deciphered decades later, a consonant ḫ appears in just the predicted places.' },
        { num: '8.7', kind: 'Event', name: 'The Great Vowel Shift', deps: ['ling-8.1', 'ling-1.9'], refs: ['Fromkin et al.'],
          pic: 'Animate English long vowels moving through the F1–F2 vowel space between Chaucer and Shakespeare: high vowels diphthongise and the rest rise, with words read aloud at each stage.' },
        { num: '8.8', kind: 'Concept', name: 'Chain shifts: push and drag', deps: ['ling-8.7'], refs: ['Fromkin et al.'],
          pic: 'Vowel categories as clouds in the vowel space that repel each other: move one and the others shift to keep their distance, as in the Northern Cities Shift.' },
        { num: '8.9', kind: 'Concept', name: 'Analogy and levelling', deps: ['ling-8.1', 'ling-3.10'], refs: ['Fromkin et al.'],
          pic: 'Track strong verbs over a millennium: infrequent ones regularise (holp → helped) at rates that scale with frequency, in a half-life plot.' },
        { num: '8.10', kind: 'Concept', name: 'Grammaticalisation', deps: ['ling-3.2'], refs: ['Fromkin et al.'],
          pic: 'Follow “going to” from a motion verb to a future marker to “gonna” along a timeline of corpus examples, with meaning bleaching and phonetic reduction marked.' },
        { num: '8.11', kind: 'Phenomenon', name: 'S-curves of language change', deps: ['ling-8.1'], refs: ['Fromkin et al.'],
          pic: 'Fit a logistic curve to the rise of do-support in English: replicate the classic data and slide a parameter to see how fast a change spreads.' },
        { num: '8.12', kind: 'Concept', name: 'Change in progress: Labov’s sociolinguistics', deps: ['ling-8.11'], refs: ['Fromkin et al.'],
          pic: 'Martha’s Vineyard centralisation and New York r-pronunciation by age, class and style: apparent-time plots reveal change under way.' },
        { num: '8.13', kind: 'Paper', name: 'The Third Anniversary Discourse (On the Hindus)',
          paper: { authors: 'William Jones', year: 1786, title: 'The Third Anniversary Discourse, delivered 2 February 1786',
                   venue: 'Asiatick Researches 1: 415–431 (Calcutta, 1788)', url: 'https://archive.org/details/in.gov.ignca.25079' },
          introduces: ['ling-8.5'], deps: [], refs: [],
          pic: 'The words behind Jones’s claim: the reader lines up cognates in Sanskrit, Greek, Latin, Gothic and Old Irish (numerals, kinship terms, the verb “to be”), sees the systematic correspondences that chance or borrowing cannot explain, and compares them with a control list from an unrelated language, where the matches vanish.' },
        { num: '8.14', kind: 'Paper', name: 'Deutsche Grammatik',
          paper: { authors: 'Jacob Grimm', year: 1822, title: 'Deutsche Grammatik, Erster Theil, zweite Ausgabe',
                   venue: 'Göttingen: Dieterich, 1822', url: 'https://archive.org/details/10583671bsb' },
          introduces: ['ling-8.2'], deps: ['ling-8.13'], refs: [],
          pic: 'Grimm’s sound shift as a rotating wheel: voiceless stops become fricatives, voiced stops become voiceless and aspirates become plain voiced; the reader drags Latin, Greek and Sanskrit words (pater, tres, genu, frater) through the wheel and gets the Germanic forms (father, three, knee, brother), with the medial consonant of father flagged as the exception Verner later explained.' },
        { num: '8.15', kind: 'Paper', name: 'Eine Ausnahme der ersten Lautverschiebung',
          paper: { authors: 'Karl Verner', year: 1877, title: 'Eine Ausnahme der ersten Lautverschiebung',
                   venue: 'Zeitschrift für vergleichende Sprachforschung 23: 97–130', url: 'https://archive.org/details/india.history.resource.77512' },
          introduces: ['ling-8.3'], deps: ['ling-8.14', 'ling-2.11'], refs: [],
          pic: 'Verner’s rule as a switch on the accent: the reader moves the inherited accent in a word (Sanskrit pitā́ against bhrā́tā) and watches the Germanic fricative come out voiceless when the accent stood just before it and voiced otherwise (Gothic broþar against fadar), then checks the alternation the rule predicts inside strong verbs (Old English cweþan, cwædon).' },
        { num: '8.16', kind: 'Paper', name: 'The Social Stratification of English in New York City',
          paper: { authors: 'William Labov', year: 1966, title: 'The Social Stratification of English in New York City',
                   venue: 'Washington, DC: Center for Applied Linguistics, 1966', url: 'https://archive.org/details/socialstratifica0000labo' },
          introduces: ['ling-8.12'], deps: ['ling-2.1'], refs: [],
          pic: 'The department-store survey replayed: the reader asks staff at Saks, Macy’s and S. Klein where to find something on the “fourth floor”, in casual and in emphatic repetition, and the share of r pronounced is plotted by store and by style, then by social class across speech styles, where the lower middle class overshoots the class above it in careful speech.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Language families, dating and contact',
      summary: String.raw`Languages descending from a common ancestor form family trees, but contact blurs the branches into waves and continua. Attempts to date splits from rates of vocabulary loss foundered on the fact that rates vary; modern Bayesian methods borrowed from biology model that variation explicitly, with contested results for the Indo-European homeland. Contact also creates new languages, while many existing ones are disappearing.`,
      items: [
        { num: '9.1', kind: 'Concept', name: 'Language family trees', deps: ['ling-8.4'], refs: ['Fromkin et al.'],
          pic: 'An interactive Indo-European tree: collapse and expand branches and compare shared innovations that define each node.' },
        { num: '9.2', kind: 'Model', name: 'The wave model and dialect continua', deps: ['ling-9.1'], refs: ['Fromkin et al.'],
          pic: 'Innovations spread outward from different centres across a map of villages: overlapping waves produce a continuum that no single tree captures.' },
        { num: '9.3', kind: 'Concept', name: 'Isoglosses and dialect maps', deps: ['ling-9.2'], refs: ['Fromkin et al.'],
          pic: 'Toggle dialect features (soda/pop/coke, cot–caught merger) on a map: bundles of isoglosses mark major dialect boundaries.' },
        { num: '9.4', kind: 'Method', name: 'Lexicostatistics and the Swadesh list', deps: ['ling-9.1'], refs: ['Fromkin et al.'],
          pic: 'Mark cognates on a Swadesh list for several languages and build a distance matrix and tree from the shared percentages.' },
        { num: '9.5', kind: 'Method', name: 'Glottochronology', deps: ['ling-9.4', 'pma-8.6', 'popgen-3.9'], refs: ['Fromkin et al.'],
          pic: 'Assume a constant retention rate per millennium: shared cognates decay exponentially and a separation date is computed, with the rate on a slider.' },
        { num: '9.6', kind: 'Phenomenon', name: 'Why glottochronology fails: rates vary', deps: ['ling-9.5'], refs: ['Fromkin et al.'],
          pic: 'Test the constant-rate assumption on languages with known histories (Icelandic vs Norwegian): estimated dates scatter widely, and rate heterogeneity by word frequency is shown.' },
        { num: '9.7', kind: 'Method', name: 'Bayesian phylogenetics of languages', deps: ['ling-9.6', 'stat-10.1'], refs: ['Fromkin et al.'],
          pic: 'Run a small MCMC over trees and rates on cognate data: the posterior sample of trees is drawn as a cloud, with clade support and root-age distribution.' },
        { num: '9.8', kind: 'Hypothesis', name: 'The Indo-European homeland: steppe or Anatolia', deps: ['ling-9.7'], refs: ['Fromkin et al.'],
          pic: 'Compare the steppe and Anatolian hypotheses on a map and timeline: root ages from different phylogenetic analyses and the ancient-DNA and wheel-vocabulary arguments sit side by side.' },
        { num: '9.9', kind: 'Concept', name: 'Isolates and the time depth of the comparative method', deps: ['ling-9.6'], refs: ['Fromkin et al.'],
          pic: 'Simulate random sound change and lexical replacement: chance resemblances swamp true cognates after roughly 6–10 millennia, which bounds deep reconstructions.' },
        { num: '9.10', kind: 'Phenomenon', name: 'Pidgins and creoles', deps: ['ling-9.2'], refs: ['Fromkin et al.'],
          pic: 'Compare lexicon and grammar of Tok Pisin with English and with Austronesian substrates: vocabulary from one source, structure partly from others.' },
        { num: '9.11', kind: 'Phenomenon', name: 'Language endangerment and death', deps: [], refs: ['Fromkin et al.'],
          pic: 'Speaker-number distribution of the world’s ~7,000 languages on a log axis: half of humanity speaks the top few dozen, while thousands have under 1,000 speakers.' },
        { num: '9.12', kind: 'Paper', name: 'Lexico-statistic Dating of Prehistoric Ethnic Contacts',
          paper: { authors: 'Morris Swadesh', year: 1952, title: 'Lexico-statistic dating of prehistoric ethnic contacts',
                   venue: 'Proceedings of the American Philosophical Society 96: 452–463', url: 'https://www.jstor.org/stable/3143802' },
          introduces: ['ling-9.4', 'ling-9.5'], deps: ['ling-8.4', 'geol-2.6'], refs: [],
          pic: 'Swadesh’s decay law: a list of basic meanings loses words at a constant rate, so two related languages keep a shared fraction c = r²ᵗ after t millennia apart; the reader counts shared cognates on the list for chosen language pairs, converts each share to a separation date with a retention rate near 0.8 per millennium, and sees the error bars and the cases where the constant-rate assumption fails.' },
        { num: '9.13', kind: 'Paper', name: 'Language-Tree Divergence Times Support the Anatolian Theory',
          paper: { authors: 'Russell D. Gray and Quentin D. Atkinson', year: 2003, title: 'Language-tree divergence times support the Anatolian theory of Indo-European origin',
                   venue: 'Nature 426 (6965): 435–439', doi: '10.1038/nature02029' },
          introduces: ['ling-9.7'], deps: ['ling-9.4', 'ling-9.6', 'ling-9.8', 'bioinf-6.6'], refs: [],
          pic: 'The paper’s dated tree: cognate sets from basic-vocabulary lists coded as binary characters, a Bayesian sample of trees with rate-smoothed branch lengths calibrated by historically known splits; the reader moves the calibrations and the allowed rate variation and watches the root age, which the paper put at 7,800–9,800 years ago, against the Anatolian-farming and steppe dates.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Acquisition, sign languages and the mind',
      summary: String.raw`Children acquire language quickly and in a regular sequence, tracking statistics in the input and generalising rules to words they have never heard. How much is innate is disputed, as is the strength of any critical period. Sign languages show that language is not tied to speech, and the brain’s language areas can be studied through aphasia. Whether language shapes thought is an old question with a much more modest modern answer.`,
      items: [
        { num: '10.1', kind: 'Phenomenon', name: 'Milestones of first-language acquisition', deps: [], refs: ['Fromkin et al. ch. 9'],
          pic: 'A timeline from cooing through babbling, first words and the vocabulary spurt to two-word combinations, with a growth curve of median vocabulary.' },
        { num: '10.2', kind: 'Phenomenon', name: 'Perceptual narrowing in infancy', deps: ['ling-1.13'], refs: ['Fromkin et al. ch. 9'],
          pic: 'Infants’ discrimination of a Hindi dental–retroflex contrast at 6–8, 8–10 and 10–12 months: English-learning infants lose it while Hindi-learning ones keep it.' },
        { num: '10.3', kind: 'Phenomenon', name: 'Statistical learning of word boundaries', deps: ['ling-4.9'], refs: ['Fromkin et al. ch. 9'],
          pic: 'A continuous syllable stream from an artificial language: transitional probabilities dip at word boundaries, and segmenting at the dips recovers the words (Saffran et al., 1996).' },
        { num: '10.4', kind: 'Phenomenon', name: 'The wug test (Berko)', deps: ['ling-3.5', 'ling-3.7'], refs: ['Fromkin et al. ch. 9'],
          pic: '“This is a wug; now there are two …”: the reader and a rule-learning model produce wugs with [z], and children’s accuracy by age is plotted.' },
        { num: '10.5', kind: 'Phenomenon', name: 'Overregularisation and U-shaped learning', deps: ['ling-10.4', 'ling-3.10'], refs: ['Fromkin et al. ch. 9'],
          pic: 'Track the correctness of a child’s “went” over time: correct, then “goed”, then correct again; a dual-route model reproduces the dip.' },
        { num: '10.6', kind: 'Hypothesis', name: 'Critical period hypothesis', deps: ['ling-10.2'], refs: ['Fromkin et al. ch. 9'],
          pic: 'Grammar-test scores against age of arrival for immigrant learners: the decline is shown with both a discontinuity model and a gradual one, and the fits compared.' },
        { num: '10.7', kind: 'Hypothesis', name: 'Poverty of the stimulus', deps: ['ling-5.12'], refs: ['Fromkin et al. ch. 9'],
          pic: 'Count how often children hear the evidence for structure-dependent question formation in a corpus, and compare a learner that tracks structure with one that tracks linear order.' },
        { num: '10.8', kind: 'Concept', name: 'Sign languages are full languages', deps: ['ling-2.3'], refs: ['Fromkin et al.'],
          pic: 'ASL minimal pairs differing only in handshape, location or movement, shown as video clips with their feature values.' },
        { num: '10.9', kind: 'Phenomenon', name: 'Nicaraguan Sign Language: a language is born', deps: ['ling-10.8', 'ling-10.6'], refs: ['Fromkin et al.'],
          pic: 'Compare signers from successive cohorts since the 1970s: spatial grammar and segmented motion signs increase in younger cohorts, plotted by cohort.' },
        { num: '10.10', kind: 'Phenomenon', name: 'Aphasia: Broca’s and Wernicke’s areas', deps: [], refs: ['Fromkin et al. ch. 10'],
          pic: 'A brain map with clickable regions: each plays a transcript of typical non-fluent (Broca’s) or fluent but empty (Wernicke’s) aphasic speech.' },
        { num: '10.11', kind: 'Hypothesis', name: 'Linguistic relativity (Sapir–Whorf)', deps: ['ling-6.12'], refs: ['Fromkin et al. ch. 1'],
          pic: 'Colour-discrimination reaction times across a lexical category boundary (Russian goluboy/siniy vs English blue) are faster, and the effect vanishes under verbal interference.' },
        { num: '10.12', kind: 'Concept', name: 'Hockett’s design features: language vs animal signals', deps: ['ling-5.5'], refs: ['Fromkin et al. ch. 1'],
          pic: 'A checklist matrix of design features (displacement, productivity, duality of patterning…) for human language, the honeybee dance and vervet alarm calls.' },
      ],
    },
  ],
};
