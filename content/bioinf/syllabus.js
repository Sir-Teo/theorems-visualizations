// Syllabus — Bioinformatics Algorithms (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   - Durbin, Eddy, Krogh & Mitchison, Biological Sequence Analysis — full TOC http://eddylab.org/cupbook.html
//     (ch. 2 pairwise alignment, 3 Markov chains/HMMs, 4 pair HMMs, 5 profile HMMs, 6 multiple alignment,
//     7 building trees, 8 probabilistic phylogeny, 9 transformational grammars, 10 RNA structure, 11 probability/EM)
//   - Compeau & Pevzner, Bioinformatics Algorithms — chapter list https://www.bioinformaticsalgorithms.org/
//     (ch. 1 replication origins, 2 motifs, 3 assembly, 4 antibiotic sequencing, 5 alignment, 6 rearrangements;
//     vol. II ch. 7 evolutionary trees, 8 clustering, 9 pattern matching/BWT, 10 HMMs, 11 proteomics)
//   - MIT 6.047/6.878 Computational Biology calendar (alignment, BLAST, HMMs, clustering, motifs/Gibbs/EM,
//     phylogenetics, gene/species trees) https://ocw.mit.edu/courses/6-047-computational-biology-fall-2015/pages/calendar/
// Gaps filled after comparison: RNA secondary structure (Nussinov, Zuker, SCFGs), multiple alignment by
//   profile HMM training, numerical stability of HMMs, expression clustering, mass-spectrometry sequencing,
//   gene-tree/species-tree discordance.
// Deliberate omissions: epigenomics, Hi-C and CRISPR technology lectures (technologies, not algorithms with
//   crisp statements); GWAS lives in popgen.
// Landmark papers (kind 'Paper', appended Oct 2026): every citation checked against its Crossref DOI record,
//   PubMed/PMC, the BHL OpenURL resolver or archive.org catalogue metadata (books and pre-DOI papers get a `url`).
export default {
  collection: 'bioinf',
  chapters: [
    {
      n: 1,
      title: 'Sequences, k-mers and motifs',
      summary: String.raw`Genomes are strings, and simple counting already finds biology: frequent k-mers and GC skew locate where replication begins. Statistical surprise must be judged carefully — overlapping words behave counter-intuitively — and regulatory motifs are captured by profiles whose information content is drawn as a sequence logo. Finding motifs is hard, so greedy, randomized, Gibbs-sampling and EM searches trade exactness for speed.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'DNA strings, reverse complements and k-mers', deps: [], refs: ['Compeau–Pevzner ch. 1'],
          pic: 'Type or load a DNA sequence; its reverse complement is drawn beneath and a sliding window lists every k-mer with its count as k changes.' },
        { num: '1.2', kind: 'Algorithm', name: 'Frequent k-mers by hash counting', deps: ['bioinf-1.1','algo-5.11','prob-1.6.1'], refs: ['Compeau–Pevzner ch. 1'],
          pic: 'Step through a genome inserting k-mers into a hash table; the most frequent words, allowing reverse complements and mismatches, light up near the Vibrio cholerae origin.' },
        { num: '1.3', kind: 'Phenomenon', name: 'GC skew and the replication origin', deps: ['bioinf-1.1'], refs: ['Compeau–Pevzner ch. 1'],
          pic: 'Plot the running difference between G and C counts along a bacterial genome; the skew falls to a minimum at the origin and rises to a maximum at the terminus.' },
        { num: '1.4', kind: 'Concept', name: 'Hamming distance and k-mer neighbourhoods', deps: ['bioinf-1.1'], refs: ['Compeau–Pevzner ch. 1'],
          pic: 'Pick a k-mer and a distance d; its neighbourhood of all strings within d mismatches is enumerated and its size checked against the binomial count.' },
        { num: '1.5', kind: 'Paradox', name: 'Overlapping-words paradox', deps: ['bioinf-1.2', 'stoch-12.6'], refs: ['Compeau–Pevzner ch. 1'],
          pic: 'Generate random strings and record when “ATA” and “ATG” first appear; self-overlapping “ATA” takes longer on average though both have the same expected count.' },
        { num: '1.6', kind: 'Concept', name: 'Motifs, profiles and position weight matrices', deps: ['bioinf-1.1','prob-2.1.1a','pma-8.6'], refs: ['Compeau–Pevzner ch. 2'],
          pic: 'Align a set of binding sites; the per-column nucleotide frequencies form a profile, and scoring a sequence with log-odds weights finds new candidate sites.' },
        { num: '1.7', kind: 'Concept', name: 'Information content and sequence logos', deps: ['bioinf-1.6', 'info-2.1'], refs: ['Compeau–Pevzner ch. 2'],
          pic: 'The profile is drawn as a logo whose letter stacks have height equal to the column’s relative entropy against background; conserved columns tower, variable ones vanish.' },
        { num: '1.8', kind: 'Algorithm', name: 'Median string and its equivalence to motif finding', deps: ['bioinf-1.6', 'bioinf-1.4'], refs: ['Compeau–Pevzner ch. 2'],
          pic: 'Search all k-mers for the one minimizing total distance to the sequences; its optimal score matches the best motif matrix’s score, illustrating the two formulations’ equivalence.' },
        { num: '1.9', kind: 'Algorithm', name: 'Greedy motif search with pseudocounts', deps: ['bioinf-1.6'], refs: ['Compeau–Pevzner ch. 2'],
          pic: 'Build a profile from one sequence at a time, choosing the most probable k-mer in each next sequence; without pseudocounts a single zero wrecks the search, with Laplace counts it recovers the planted motif.' },
        { num: '1.10', kind: 'Algorithm', name: 'Randomized motif search', deps: ['bioinf-1.9','prob-2.1.1a'], refs: ['Compeau–Pevzner ch. 2'],
          pic: 'Start from random k-mers, iterate profile-building and best-match selection until the score stops improving, and restart many times; the histogram of final scores shows how often the planted motif is found.' },
        { num: '1.11', kind: 'Algorithm', name: 'Gibbs sampling for motifs', deps: ['bioinf-1.10', 'stat-10.18'], refs: ['Compeau–Pevzner ch. 2'],
          pic: 'Remove one sequence’s motif, rebuild the profile and resample its position in proportion to profile probability; the score trace climbs noisily and escapes local optima that trap the greedy method.' },
        { num: '1.12', kind: 'Algorithm', name: 'EM for motif discovery (MEME)', deps: ['bioinf-1.9', 'stat-3.11'], refs: ['Durbin ch. 11'],
          pic: 'Alternate soft assignment of motif positions with profile re-estimation; the expected positions sharpen over iterations and the log-likelihood rises monotonically.' },
        { num: '1.13', kind: 'Paper', name: 'Molecular Structure of Nucleic Acids',
          paper: { authors: 'J. D. Watson and F. H. C. Crick', year: 1953, title: 'Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid',
                   venue: 'Nature 171 (4356): 737–738', doi: '10.1038/171737a0' },
          introduces: ['bioinf-1.1'], deps: ['xtal-8.9'], refs: [],
          pic: 'Build Watson and Crick’s model: two right-handed helical chains run in opposite directions about one axis, bases stacked 3.4 Å apart with ten to a turn (a 34 Å repeat), held together only as A–T and G–C pairs; type one strand and the other is forced, then rotate the helix and see why the pairing “immediately suggests a possible copying mechanism”.' },
        { num: '1.14', kind: 'Paper', name: 'The Replication of DNA in Escherichia coli',
          paper: { authors: 'Matthew Meselson and Franklin W. Stahl', year: 1958, title: 'The replication of DNA in Escherichia coli',
                   venue: 'Proceedings of the National Academy of Sciences 44 (7): 671–682', doi: '10.1073/pnas.44.7.671' },
          introduces: [], deps: ['bioinf-1.13'], refs: [],
          pic: 'Recreate the density-gradient photographs: bacteria grown on heavy ¹⁵N are shifted to ¹⁴N and DNA sampled each generation is spun to equilibrium in caesium chloride; the single heavy band becomes one hybrid band after one generation and equal hybrid and light bands after two — switch between semiconservative, conservative and dispersive replication and only the first reproduces the paper’s bands.' },
      ],
    },
    {
      n: 2,
      title: 'Pairwise sequence alignment',
      summary: String.raw`Comparing two sequences means finding the best path through an edit graph, which dynamic programming does exactly. Scores come from log-odds substitution matrices; Needleman–Wunsch finds global alignments and Smith–Waterman local ones, with affine gaps, fitting and overlap variants for real tasks. Hirschberg’s divide-and-conquer trick cuts memory to linear, and banding speeds alignment of similar sequences. Below about 25% identity, alignments become unreliable.`,
      items: [
        { num: '2.1', kind: 'Concept', name: 'Alignment as a path through the edit graph', deps: ['bioinf-1.4'], refs: ['Durbin ch. 2', 'Compeau–Pevzner ch. 5'],
          pic: 'Two sequences label the axes of a grid; draw a path with diagonal, horizontal and vertical steps and the corresponding alignment with gaps is written out below.' },
        { num: '2.2', kind: 'Algorithm', name: 'Longest common subsequence by dynamic programming', deps: ['bioinf-2.1', 'algo-7.7'], refs: ['Compeau–Pevzner ch. 5'],
          pic: 'Fill the LCS table cell by cell with backtracking arrows; trace back from the corner to read off one longest common subsequence.' },
        { num: '2.3', kind: 'Concept', name: 'Alignment as a longest path in a DAG', deps: ['bioinf-2.2', 'algo-9.5'], refs: ['Compeau–Pevzner ch. 5'],
          pic: 'The edit graph is redrawn as a weighted DAG; a topological-order longest-path computation gives the same scores as the alignment table.' },
        { num: '2.4', kind: 'Concept', name: 'Substitution matrices as log-odds scores (PAM, BLOSUM)', deps: ['bioinf-2.1','info-2.1','pma-8.6'], refs: ['Durbin ch. 2'],
          pic: 'Count substitutions in blocks of aligned proteins and compute log(p_ab / q_a q_b); the resulting BLOSUM heatmap shows high scores for similar amino acids.' },
        { num: '2.5', kind: 'Algorithm', name: 'Needleman–Wunsch global alignment', deps: ['bioinf-2.2', 'bioinf-2.4'], refs: ['Durbin ch. 2'],
          pic: 'Edit two protein sequences and the scoring parameters; the DP table fills, the optimal path is traced and the global alignment and its score update instantly.' },
        { num: '2.6', kind: 'Algorithm', name: 'Smith–Waterman local alignment', deps: ['bioinf-2.5'], refs: ['Durbin ch. 2'],
          pic: 'Allow scores to reset to zero and start the traceback from the table’s maximum; the best-matching local segment pops out of two otherwise unrelated sequences.' },
        { num: '2.7', kind: 'Algorithm', name: 'Affine gap penalties (Gotoh)', deps: ['bioinf-2.5'], refs: ['Durbin ch. 2'],
          pic: 'Switch from linear to affine gap costs; three coupled DP tables are filled, and the optimal alignment consolidates many short gaps into a few long ones.' },
        { num: '2.8', kind: 'Algorithm', name: 'Fitting and overlap alignment', deps: ['bioinf-2.5'], refs: ['Compeau–Pevzner ch. 5', 'Durbin ch. 2'],
          pic: 'Change which table borders are free; the same DP aligns a short read inside a long genome (fitting) or the end of one read to the start of another (overlap).' },
        { num: '2.9', alias: 'algo-7.9', name: 'Linear-space alignment (Hirschberg)' },
        { num: '2.10', kind: 'Algorithm', name: 'Banded alignment', deps: ['bioinf-2.5'], refs: ['Durbin ch. 2'],
          pic: 'Restrict DP to a diagonal band of width w; for similar sequences the alignment is unchanged at a fraction of the cost, but a large indel outside the band is missed.' },
        { num: '2.11', kind: 'Phenomenon', name: 'The twilight zone of sequence identity', deps: ['bioinf-2.6'], refs: ['Durbin ch. 2'],
          pic: 'Plot percent identity of aligned pairs against alignment length for true homologues and shuffled controls; below about 25% identity the two clouds overlap.' },
        { num: '2.12', kind: 'Paper', name: 'A General Method for Similarities in Two Protein Sequences',
          paper: { authors: 'Saul B. Needleman and Christian D. Wunsch', year: 1970, title: 'A general method applicable to the search for similarities in the amino acid sequence of two proteins',
                   venue: 'Journal of Molecular Biology 48 (3): 443–453', doi: '10.1016/0022-2836(70)90057-4' },
          introduces: ['bioinf-2.5'], deps: ['bioinf-2.1', 'algo-7.2'], refs: [],
          pic: 'Fill the Needleman–Wunsch matrix for two short proteins: each cell takes the best of its three predecessors plus a match score or gap penalty, and the traceback draws the optimal global alignment; edit the sequences, scores and gap cost and watch the alignment change.' },
        { num: '2.13', kind: 'Paper', name: 'Identification of Common Molecular Subsequences',
          paper: { authors: 'T. F. Smith and M. S. Waterman', year: 1981, title: 'Identification of common molecular subsequences',
                   venue: 'Journal of Molecular Biology 147 (1): 195–197', doi: '10.1016/0022-2836(81)90087-5' },
          introduces: ['bioinf-2.6'], deps: ['bioinf-2.5', 'bioinf-2.4'], refs: [],
          pic: 'The Smith–Waterman recurrence changes one thing in global alignment — every cell is floored at zero — so the best-scoring local segment stands out wherever it lies; run it on two short RNA strings like the paper’s example, watch the zeros isolate the matching island, and compare with the global alignment of the same pair.' },
      ],
    },
    {
      n: 3,
      title: 'Alignment statistics and database search',
      summary: String.raw`A high alignment score means something only if random sequences rarely reach it. For local alignments, Karlin–Altschul theory shows maximal scores follow an extreme-value law, giving E-values and bit scores; global scores behave very differently, growing linearly. These statistics, combined with seed-and-extend heuristics, make BLAST fast and trustworthy, and spaced seeds improve its sensitivity.`,
      items: [
        { num: '3.1', kind: 'Concept', name: 'Score distribution of random alignments', deps: ['bioinf-2.6'], refs: ['Durbin ch. 2'],
          pic: 'Align a query against thousands of shuffled sequences and histogram the best local scores; the distribution is skewed with a long right tail.' },
        { num: '3.2', kind: 'Theorem', name: 'Chvátal–Sankoff: random LCS length grows linearly', deps: ['bioinf-2.2', 'prob-2.7.1'], refs: ['Compeau–Pevzner ch. 5'],
          pic: 'Compute LCS lengths of random binary strings of increasing length; the ratio LCS/n settles near 0.81, the Chvátal–Sankoff constant, with fluctuations shrinking.' },
        { num: '3.3', kind: 'Theorem', name: 'Linear-to-logarithmic phase transition of local scores', deps: ['bioinf-3.1'], refs: ['Durbin ch. 2'],
          pic: 'Vary the mismatch and gap penalties; when the expected score per aligned pair is negative, best local scores grow like log n, and when positive they grow linearly — the boundary is drawn in parameter space.' },
        { num: '3.4', kind: 'Theorem', name: 'Karlin–Altschul statistics', deps: ['bioinf-3.1', 'bioinf-3.3'], refs: ['Durbin ch. 2'],
          pic: 'Solve Σ q_a q_b e^{λ s_ab} = 1 for λ given the scoring matrix; the predicted E = Kmn e^{−λS} matches the simulated number of random hits above each score.' },
        { num: '3.5', kind: 'Concept', name: 'Extreme-value (Gumbel) distribution of maximal scores', deps: ['bioinf-3.4','prob-1.6.13'], refs: ['Durbin ch. 2'],
          pic: 'Fit a Gumbel curve to the histogram of random maximal scores; on a log-survival plot its tail is a straight line of slope −λ.' },
        { num: '3.6', kind: 'Concept', name: 'Bit scores and E-values', deps: ['bioinf-3.4','prob-1.6.13','pma-8.6'], refs: ['Durbin ch. 2'],
          pic: 'Convert raw scores to bit scores that are comparable across matrices; double the database size and the E-value of the same hit doubles.' },
        { num: '3.7', kind: 'Algorithm', name: 'BLAST seed-and-extend', deps: ['bioinf-3.6', 'bioinf-2.6'], refs: ['Durbin ch. 2'],
          pic: 'Find exact word hits between query and database, extend them without gaps while the score holds up, and report high-scoring pairs; the counter shows how few DP cells are touched.' },
        { num: '3.8', kind: 'Concept', name: 'Spaced seeds and search sensitivity', deps: ['bioinf-3.7','prob-1.6.1','prob-2.1.1a'], refs: ['Durbin ch. 2'],
          pic: 'Compare contiguous and spaced seeds of the same weight on simulated homologous pairs; the spaced seed detects more true pairs at the same number of random hits.' },
        { num: '3.9', kind: 'Paper', name: 'Basic Local Alignment Search Tool',
          paper: { authors: 'Stephen F. Altschul, Warren Gish, Webb Miller, Eugene W. Myers and David J. Lipman', year: 1990, title: 'Basic local alignment search tool',
                   venue: 'Journal of Molecular Biology 215 (3): 403–410', doi: '10.1016/S0022-2836(05)80360-2' },
          introduces: ['bioinf-3.7'], deps: ['bioinf-2.6', 'bioinf-3.4'], refs: [],
          pic: 'BLAST step by step: list the query’s words of length 3 and their high-scoring neighbours above a threshold T, scan the database for exact hits, extend each hit until the score drops X below its best, and report segment pairs with E-values — sliders for T and X trade speed against the hits a full Smith–Waterman search would find.' },
      ],
    },
    {
      n: 4,
      title: 'Hidden Markov models',
      summary: String.raw`Many biological sequences switch between hidden states — CpG islands and background, exons and introns, match and insert positions in a protein family. Markov chains score sequences; hidden Markov models add unobserved states, and dynamic programming answers the main questions: the best state path (Viterbi), the total probability (forward), posterior state probabilities (forward–backward) and parameter learning (Baum–Welch). Pair and profile HMMs recast alignment probabilistically.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Markov chains for sequences: CpG islands', deps: ['bioinf-1.1', 'stoch-1.1'], refs: ['Durbin ch. 3'],
          pic: 'Estimate dinucleotide transition probabilities inside and outside CpG islands; the two 4×4 matrices are shown as heatmaps, with the depleted CG transition highlighted.' },
        { num: '4.2', kind: 'Method', name: 'Log-odds discrimination with Markov chains', deps: ['bioinf-4.1','stat-6.4'], refs: ['Durbin ch. 3'],
          pic: 'Score sequence windows with the log-likelihood ratio of the island and background chains; the score histogram separates the two classes with a shaded overlap.' },
        { num: '4.3', kind: 'Model', name: 'Hidden Markov model', deps: ['bioinf-4.1', 'stoch-14.10'], refs: ['Durbin ch. 3', 'Compeau–Pevzner ch. 10'],
          pic: 'Draw states with transition arrows and emission tables; generating from the model shows the hidden path above the emitted sequence.' },
        { num: '4.4', kind: 'Algorithm', name: 'Viterbi algorithm', deps: ['bioinf-4.3','stoch-14.11','algo-7.2'], refs: ['Durbin ch. 3'],
          pic: 'Fill the Viterbi lattice column by column keeping the best predecessor of each state; the traceback path is drawn over the true hidden path for comparison.' },
        { num: '4.5', kind: 'Phenomenon', name: 'The occasionally dishonest casino', deps: ['bioinf-4.4'], refs: ['Durbin ch. 3'],
          pic: 'A casino switches secretly between fair and loaded dice; roll a long sequence and the Viterbi and posterior decodings mark the loaded stretches with high accuracy.' },
        { num: '4.6', kind: 'Algorithm', name: 'Forward algorithm', deps: ['bioinf-4.3'], refs: ['Durbin ch. 3'],
          pic: 'Replace max by sum in the lattice; the total probability of the sequence is accumulated and verified by brute-force enumeration of all paths for a short sequence.' },
        { num: '4.7', kind: 'Algorithm', name: 'Backward algorithm and posterior decoding', deps: ['bioinf-4.6','stat-2.1','prob-1.6.1'], refs: ['Durbin ch. 3'],
          pic: 'Combine forward and backward tables to plot the posterior probability of each state at each position; it shows uncertainty where Viterbi commits to a single path.' },
        { num: '4.8', kind: 'Algorithm', name: 'Baum–Welch training', deps: ['bioinf-4.7', 'stat-3.12'], refs: ['Durbin ch. 3'],
          pic: 'Start from wrong parameters and iterate expected counts and re-estimation; the log-likelihood rises at every step and the estimated loaded-die probabilities approach the truth.' },
        { num: '4.9', kind: 'Model', name: 'Gene finding with HMMs', deps: ['bioinf-4.4'], refs: ['Compeau–Pevzner ch. 10'],
          pic: 'A model with exon, intron and intergenic states and codon structure decodes a simulated genomic region; predicted gene structures are drawn against the annotation.' },
        { num: '4.10', kind: 'Model', name: 'Pair HMMs for alignment', deps: ['bioinf-4.6', 'bioinf-2.7'], refs: ['Durbin ch. 4'],
          pic: 'Match, insert-X and insert-Y states emit aligned pairs; summing over all alignments gives posterior probabilities that each residue pair is aligned, drawn as a dot plot.' },
        { num: '4.11', kind: 'Model', name: 'Profile HMMs for sequence families', deps: ['bioinf-4.3', 'bioinf-1.6'], refs: ['Durbin ch. 5'],
          pic: 'Build match, insert and delete states from a multiple alignment; scoring new sequences against the profile finds remote family members that pairwise BLAST misses.' },
        { num: '4.12', kind: 'Method', name: 'Log space and scaling for numerical stability', deps: ['bioinf-4.6','pma-8.6'], refs: ['Durbin ch. 3'],
          pic: 'Run the forward algorithm on a long sequence in raw probabilities and watch it underflow to zero; log-space or scaled versions give the correct answer.' },
      ],
    },
    {
      "n": 5,
      "title": "Phylogenetic trees: distances and parsimony",
      "summary": "Distance and character methods ask different questions about a proposed genealogy. Additive and ultrametric distances give exact mathematical recovery results, whereas substitution corrections, parsimony and finite alignments require their own assumptions. The experiments use declared toy inputs; an unread original association table is never replaced by invented historical data.",
      "items": [
        {
          "num": "5.1",
          "kind": "Concept",
          "name": "Trees and the number of topologies",
          "deps": [],
          "refs": [
            "Durbin §7.1, printed pp163–165"
          ],
          "pic": "Switch rooted/unrooted counting, enumerate a selected small taxon set, and inspect individual actual topologies. The count graph uses exact integer products before taking logarithms. Its horizontal $10^{80}$ reference is a chosen comparison, not an astronomical measurement."
        },
        {
          "num": "5.2",
          "kind": "Concept",
          "name": "Additive tree metrics and the four-point condition",
          "deps": [
            "bioinf-5.1"
          ],
          "refs": [
            "Durbin §7.2, additive distances; quartet construction derived here"
          ],
          "pic": "Edit six integer distances in order AB,AC,AD,BC,BD,CD. Compare the three exact sums, triangle tests and reconstructed signed limbs. Try the equal-sum nonmetric counterexample: its negative limb prevents a nonnegative tree representation."
        },
        {
          "num": "5.3",
          "kind": "Algorithm",
          "name": "UPGMA",
          "deps": [
            "bioinf-5.1"
          ],
          "refs": [
            "Durbin §7.3, printed pp166–169"
          ],
          "pic": "Edit a four-taxon distance matrix and step through actual joins, cluster sizes, heights and weighted updates. The unequal-size example gives distance14 from ABC to D; an equal-cluster-weight update would incorrectly give14.5 for that example."
        },
        {
          "num": "5.4",
          "kind": "Concept",
          "name": "Ultrametric trees and the molecular clock",
          "deps": [
            "bioinf-5.3",
            "popgen-3.9"
          ],
          "refs": [
            "Durbin §§7.3–7.4, printed pp166–170"
          ],
          "pic": "Compare a declared clock tree, two long non-sister terminal branches and an earlier sampled tip. Inspect actual path distances, triplet residuals and UPGMA reconstruction rather than a fabricated sequence or a guaranteed monotonic loss of accuracy."
        },
        {
          "num": "5.5",
          "kind": "Algorithm",
          "name": "Neighbour-joining",
          "deps": [
            "bioinf-5.2"
          ],
          "refs": [
            "Durbin §7.4, printed pp169–172; algorithm trace"
          ],
          "pic": "Edit actual distances and inspect every Q matrix, chosen join, limb and reduced matrix through the step player. Compare the three-taxon nonmetric example whose computed limbs are −3,5,5: the signed result and failure of a nonnegative metric interpretation remain visible."
        },
        {
          "num": "5.6",
          "kind": "Theorem",
          "name": "Neighbour-joining recovers additive trees exactly",
          "deps": [
            "bioinf-5.5"
          ],
          "refs": [
            "Durbin appendix §7.8, printed pp190–191; omitted exercise cases completed by the edge-split proof here"
          ],
          "pic": "Select an enumerated exact small tree and change its positive internal and nonnegative terminal lengths. Compare NJ's recovered splits, all pair distances and signed edge values. These finite checks test the implementation; the edge-split proof, rather than the experiment, supplies the all-size guarantee."
        },
        {
          "num": "5.7",
          "kind": "Model",
          "name": "Jukes–Cantor model and distance correction",
          "deps": [
            "stoch-1.2"
          ],
          "see": [
            "popgen-3.1",
            "popgen-3.9"
          ],
          "refs": [
            "Durbin §8.1, printed pp193–197",
            "Felsenstein2019 X.2, printed pp457–460"
          ],
          "pic": "Generate an actual seeded alignment through Poisson substitution events and see which multiple/reverse events disappear from the observed mismatches. Compare its finite correction with the generating expected path length and the exact model curve. Saturated samples are retained and labelled."
        },
        {
          "num": "5.8",
          "kind": "Model",
          "name": "Kimura two-parameter model",
          "deps": [
            "bioinf-5.7"
          ],
          "refs": [
            "Durbin §8.1 Eq8.5–8.6, rendered printed p196"
          ],
          "pic": "Change the two generating rates and inspect actual seeded transition/transversion counts, then enter your own [transition,transversion,total] counts. Compare fitted rates and distance with the generating path. Invalid domains and negative unconstrained rate estimates remain visible; no estimate is silently clipped into the model."
        },
        {
          "num": "5.9",
          "kind": "Phenomenon",
          "name": "Saturation: observed difference plateaus at 3/4",
          "deps": [
            "bioinf-5.7"
          ],
          "refs": [
            "Durbin §§8.1,8.6, multiple substitutions and distance limitations"
          ],
          "pic": "Generate separately seeded finite alignments at the chosen length and site count. Inspect actual mismatch counts, domain failures, Wilson endpoints and the transformed interval. The count histogram retains saturated observations, while the generating curve carries its log-decay separately."
        },
        {
          "num": "5.10",
          "kind": "Algorithm",
          "name": "Fitch’s small-parsimony algorithm",
          "deps": [
            "bioinf-5.1"
          ],
          "refs": [
            "Durbin §7.5, printed pp174–176, including the all-optima warning"
          ],
          "pic": "Edit an actual binary tree and its leaf symbols. Step through intersections/unions and inspect the chosen ancestral states and counted edge changes. IUPAC ambiguity, a missing symbol and the optional gap state have explicit meanings; the table displays the actual postorder sets."
        },
        {
          "num": "5.11",
          "kind": "Algorithm",
          "name": "Sankoff’s weighted parsimony",
          "deps": [
            "bioinf-5.10",
            "algo-7.15"
          ],
          "refs": [
            "Durbin §7.5, weighted-parsimony recurrence pp174–175"
          ],
          "pic": "Edit the supplied tree, observed/ambiguous site and actual5×5 cost matrix. Inspect every conditional table, root minimizer and a backtracked assignment. Directed costs and zero-cost ties are allowed; the readout verifies the chosen assignment cost and counts optima."
        },
        {
          "num": "5.12",
          "kind": "Theorem",
          "name": "Large parsimony is NP-hard; heuristic tree search",
          "verify": true,
          "deps": [
            "bioinf-5.10"
          ],
          "see": [
            "toc-13.2"
          ],
          "refs": [
            "Awasthi–Blum–Morgenstern–Sheffet, Additive Approximation for Near-Perfect Phylogeny Construction, pp1–3 (cited Hamming-Steiner hardness)"
          ],
          "pic": "Edit a small binary alignment. Exhaustively enumerate every unrooted binary topology to certify its toy optimum, then compare genuine seeded nearest-neighbour-interchange descent and restarts. The score landscape and actual search path expose local optima and ties without inventing an exponential-time lower bound for every instance."
        },
        {
          "num": "5.13",
          "kind": "Phenomenon",
          "name": "Long-branch attraction",
          "deps": [
            "bioinf-5.10"
          ],
          "refs": [
            "Durbin §8.6, printed pp224–227, inconsistency and long branches; independent exact fixture derived here"
          ],
          "pic": "Change the three edge-probability settings, inspect all16 computed pattern probabilities and their parsimony contributions, and generate an actual finite sampled alignment. The expected ordering can change as parameters change; finite scores may tie or favour another tree."
        },
        {
          "num": "5.14",
          "kind": "Paper",
          "name": "Phylogenetic Structure of the Prokaryotic Domain",
          "paper": {
            "authors": "Carl R. Woese and George E. Fox",
            "year": 1977,
            "title": "Phylogenetic structure of the prokaryotic domain: The primary kingdoms",
            "venue": "Proceedings of the National Academy of Sciences 74 (11): 5088–5090",
            "doi": "10.1073/pnas.74.11.5088"
          },
          "introduces": [],
          "verify": true,
          "deps": [],
          "see": [
            "bioinf-5.3"
          ],
          "refs": [
            "Woese–Fox1977, official PMC publication metadata and abstract only; original body unverified"
          ],
          "pic": "Select a claim to see which evidence is actually available. The three historical abstract labels are shown as categories without invented distances or connecting tree edges; the source-boundary panel identifies the missing original numerical evidence."
        }
      ]
    },
    {
      n: 6,
      title: "Probabilistic phylogenetics",
      summary: String.raw`A probabilistic tree assigns probabilities to observed sequence columns by summing over unobserved ancestral states. Pruning makes this sum practical, and reversibility explains why a sequence likelihood can leave the root unidentified. Rate mixtures, column bootstraps and a finite Bayesian sampler expose different kinds of uncertainty. A binary long-branch experiment distinguishes likelihood from parsimony, while neutral genealogies explain why even correctly inferred gene trees can disagree with a species history.`,
      items: [
        { num: "6.1", kind: "Concept", name: "Likelihood of a tree", deps: ["bioinf-5.7"], refs: ["Durbin et al. (1998), §8.3, printed pp. 199–201; own JC enumeration"], links: {"source": "https://www.mcb111.org/w06/durbin_book.pdf"},
          pic: String.raw`Change the observed bases, common branch length and split. Inspect one ancestral assignment on the tree and its share of the likelihood among all 64 assignments. At zero length, discordant tips have exactly zero likelihood.` },
        { num: "6.2", kind: "Algorithm", name: "Felsenstein’s pruning algorithm", deps: ["bioinf-6.1", "bioinf-5.11"], refs: ["Durbin et al. (1998), §8.3, printed pp. 200–201, pruning algorithm and equation 8.10; own log-domain implementation"], links: {"source": "https://www.mcb111.org/w06/durbin_book.pdf"},
          pic: String.raw`Step through the actual postorder on balanced or comb-shaped trees. The active node and incoming edge identify the displayed four-component conditional vector; increase taxon count and compare the actual transition-term count with the exponential assignment count.` },
        { num: "6.3", kind: "Theorem", name: "Reversibility and the pulley principle", deps: ["bioinf-6.2", "stoch-4.12"], refs: ["Durbin et al. (1998), §8.3, printed pp. 202–204, detailed balance and root movement; stoch 4.12; own mean-rate normalization"], links: {"source": "https://www.mcb111.org/w06/durbin_book.pdf"},
          pic: String.raw`Slide the root along a fixed internal edge and compare the likelihood curve for reversible equal-input evolution with a stationary directed cycle. Change the composition or cycle imbalance; zero imbalance restores reversibility.` },
        { num: "6.4", kind: "Concept", name: "Rate heterogeneity across sites", deps: ["bioinf-6.1"], refs: ["Durbin et al. (1998), §8.5, printed pp. 214–217, especially equations 8.24–8.25; own pair Laplace-transform derivation"], links: {"source": "https://www.mcb111.org/w06/durbin_book.pdf"},
          pic: String.raw`Draw actual Gamma site rates and matching outcomes, change their shape and path length, and compare shared-rate, constant-rate and separately mixed half-path predictions. Finite rate-bin averages avoid pretending that the density at zero is bounded.` },
        { num: "6.5", kind: "Method", name: "Bootstrap support for clades", deps: ["bioinf-5.5", "stat-9.2"], refs: ["Durbin et al. (1998), printed p. 179 and §8.5 pp. 212–214; actual stat 9.2 column-bootstrap specialization; own quartet NJ tie accounting"], links: {"source": "https://www.mcb111.org/w06/durbin_book.pdf"},
          pic: String.raw`Inspect original or resampled columns, including duplicated source indices, and step through actual bootstrap replicates. The selected unique clade is marked on a tree rooted with D as outgroup; tied replicates show an unresolved tree.` },
        { num: "6.6", kind: "Method", name: "Bayesian phylogenetics by MCMC", deps: ["bioinf-6.1", "stoch-7.2"], refs: ["Durbin et al. (1998), §8.4, printed pp. 206–208; finite-target proof and proposal constructed here"], links: {"source": "https://www.mcb111.org/w06/durbin_book.pdf"},
          pic: String.raw`Compare an actual Metropolis chain prefix with the exactly enumerated finite-grid posterior. Change the discrete prior, chain seed and retained window; repeated states remain in both the trace and the frequency denominator.` },
        { num: "6.7", kind: "Phenomenon", name: "Likelihood is consistent in the Felsenstein zone", deps: ["bioinf-6.2", "bioinf-5.13"], refs: ["Durbin et al. (1998), §8.6, printed pp. 224–227; actual bioinf 5.13 construction; own affine-profile and KL argument"], links: {"source": "https://www.mcb111.org/w06/durbin_book.pdf"},
          pic: String.raw`Accumulate the same actual binary alignment prefixes for parsimony and likelihood. Compare the sample score gaps with their population limits; change long and short branches to enter or leave the region where parsimony favours AC|BD.` },
        { num: "6.8", kind: "Concept", name: "Gene trees versus species trees", deps: ["bioinf-6.1", "popgen-10.2"], refs: ["Felsenstein, Theoretical Evolutionary Genetics (December 2019), X.4, selected printed pp. 464,466–467; own three-lineage species-interval derivation"], links: {"source": "https://felsenst.github.io/pgbook/pgbook.pdf"},
          pic: String.raw`Shorten the internal species-population interval, draw independent locus genealogies and select an actual locus. Compare its correctly ordered coalescence events and the observed topology fractions with the exact probabilities.` },
        { num: "6.9", kind: "Paper", name: "Evolutionary Trees from DNA Sequences", paper: {"authors": "Joseph Felsenstein", "year": 1981, "title": "Evolutionary trees from DNA sequences: A maximum likelihood approach", "venue": "Journal of Molecular Evolution 17 (6): 368–376", "doi": "10.1007/BF01734359"}, introduces: ["bioinf-6.2", "bioinf-6.3"], deps: ["bioinf-6.1", "bioinf-5.7"], refs: ["Felsenstein author CV, 1981 bibliography and DOI; original body inaccessible HTTP 503", "Durbin et al. (1998), §8.3, printed pp. 199–204; own synthetic JC one-edge profiles"], links: {"author": "https://felsenst.github.io/felsenstein.cv.html", "source": "https://www.mcb111.org/w06/durbin_book.pdf"}, verify: true,
          pic: String.raw`Inspect a selected synthetic column, slide the root, vary the candidate internal length and compare all three likelihood profiles and their actual one-edge maxima. The observation seed and column count alone determine the alignment; hypothesis controls do not regenerate it.` },
      ],
    },
    {
      n: 7,
      title: 'Multiple sequence alignment',
      summary: String.raw`Aligning many sequences at once reveals conserved positions invisible in pairs, but exact dynamic programming grows exponentially with the number of sequences. Approximation algorithms and progressive alignment along a guide tree make the problem tractable, at the cost of early errors that propagate, and profile HMMs can be trained to refine the result.`,
      items: [
        { num: '7.1', kind: 'Concept', name: 'Multiple alignment and sum-of-pairs scoring', deps: ['bioinf-2.5'], refs: ['Durbin ch. 6'],
          pic: 'Edit a small multiple alignment; each column’s sum-of-pairs score is shown, and moving a gap changes the total.' },
        { num: '7.2', kind: 'Theorem', name: 'Multidimensional DP is exponential in the number of sequences', deps: ['bioinf-7.1'], refs: ['Durbin ch. 6'],
          pic: 'Align three sequences in a 3D lattice; the cell count readout grows as Lᵏ, and adding a fourth sequence pushes the run time off the chart.' },
        { num: '7.3', kind: 'Algorithm', name: 'Center-star approximation', deps: ['bioinf-7.1'], refs: ['Durbin ch. 6'],
          pic: 'Pick the sequence closest to all others and align each to it; the resulting multiple alignment’s score is compared with the optimum and stays within a factor of two.' },
        { num: '7.4', kind: 'Algorithm', name: 'Progressive alignment with a guide tree', deps: ['bioinf-7.1', 'bioinf-5.5'], refs: ['Durbin ch. 6'],
          pic: 'Build a guide tree from pairwise distances, then align profiles up the tree; each merge is animated, showing how the alignment grows.' },
        { num: '7.5', kind: 'Concept', name: 'Once a gap, always a gap', deps: ['bioinf-7.4'], refs: ['Durbin ch. 6'],
          pic: 'Introduce an early misalignment between two close sequences and continue progressive alignment; the error is frozen in and the final score falls short of a refined alignment.' },
        { num: '7.6', kind: 'Method', name: 'Multiple alignment by profile HMM training', deps: ['bioinf-7.4', 'bioinf-4.11'], refs: ['Durbin ch. 6'],
          pic: 'Train a profile HMM on unaligned sequences with Baum–Welch and align each to it by Viterbi; the resulting alignment is compared column by column with the progressive one.' },
      ],
    },
    {
      n: 8,
      title: 'RNA secondary structure',
      summary: String.raw`RNA molecules fold back on themselves into nested stems and loops, and that nesting makes structure prediction a dynamic programming problem. Nussinov maximizes base pairs, Zuker minimizes free energy with stacking and loop terms, and stochastic context-free grammars give the probabilistic version with inside and CYK algorithms. Covarying mutations across species reveal structure directly.`,
      items: [
        { num: '8.1', kind: 'Concept', name: 'RNA secondary structure as nested base pairs', deps: [], refs: ['Durbin ch. 10'],
          pic: 'Type an RNA sequence and a dot-bracket structure; it is drawn as an arc diagram and as a planar stem-loop picture, and crossing arcs are flagged as pseudoknots.' },
        { num: '8.2', kind: 'Algorithm', name: 'Nussinov base-pair maximization', deps: ['bioinf-8.1', 'algo-7.2'], refs: ['Durbin ch. 10'],
          pic: 'Fill the triangular DP table over subsequences and trace back the structure with the most base pairs; changing one base updates the fold.' },
        { num: '8.3', kind: 'Algorithm', name: 'Zuker minimum free-energy folding', deps: ['bioinf-8.2'], refs: ['Durbin ch. 10'],
          pic: 'Score stacked pairs and loops with nearest-neighbour energies; the minimum-energy structure differs from the maximum-pairing one, and suboptimal structures within a few kcal/mol are listed.' },
        { num: '8.4', kind: 'Model', name: 'Stochastic context-free grammars for RNA', deps: ['bioinf-8.1', 'toc-5.1'], refs: ['Durbin ch. 9'],
          pic: 'A small grammar with pairing and branching rules generates random RNA structures; each derivation tree is drawn next to the structure it produces.' },
        { num: '8.5', kind: 'Algorithm', name: 'Inside and CYK algorithms for SCFGs', deps: ['bioinf-8.4', 'toc-5.10'], refs: ['Durbin ch. 10'],
          pic: 'The inside algorithm sums over all parses to give each base pair’s probability, shown as a dot plot; CYK finds the single most probable structure.' },
        { num: '8.6', kind: 'Method', name: 'Covariation and comparative structure prediction', deps: ['bioinf-8.4'], refs: ['Durbin ch. 10'],
          pic: 'Compute mutual information between alignment columns of a tRNA family; compensatory base changes light up the paired positions of the cloverleaf.' },
      ],
    },
    {
      n: 9,
      title: 'Genome assembly',
      summary: String.raw`Sequencers read short random fragments, and assembly reconstructs the genome from their overlaps. Coverage statistics say how much sequencing is needed. Casting reads as nodes of an overlap graph asks for a Hamiltonian path, which is intractable; breaking them into k-mers and using a de Bruijn graph asks for an Eulerian path, which is easy. Repeats, read pairs and errors determine how close real assemblies get.`,
      items: [
        { num: '9.1', kind: 'Concept', name: 'Shotgun sequencing and string reconstruction', deps: ['bioinf-1.1'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Shred a genome into overlapping reads at random positions and shuffle them; the task of putting them back in order is illustrated by dragging reads into place.' },
        { num: '9.2', kind: 'Model', name: 'Lander–Waterman coverage statistics', deps: ['bioinf-9.1'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Sequence a genome at increasing depth; the fraction uncovered falls as e^{−c} and the number of contigs peaks then declines, matching simulated assemblies.' },
        { num: '9.3', kind: 'Concept', name: 'Overlap graphs and the Hamiltonian-path formulation', deps: ['bioinf-9.1', 'algo-14.9'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Connect reads that overlap; reconstructing the genome means visiting each node once, and the search tree of a brute-force solver explodes as reads are added.' },
        { num: '9.4', kind: 'Concept', name: 'De Bruijn graph of k-mers', deps: ['bioinf-9.1'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Break reads into k-mers and glue identical (k−1)-mer nodes; the genome becomes a walk using each edge once, and changing k makes the graph simpler or more tangled.' },
        { num: '9.5', kind: 'Theorem', name: 'Euler’s theorem on Eulerian paths', deps: ['bioinf-9.4'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Edit a directed graph; in- and out-degrees are shown at every node and an Eulerian cycle exists exactly when all are balanced and the graph is strongly connected.' },
        { num: '9.6', kind: 'Algorithm', name: 'Hierholzer’s algorithm for Eulerian cycles', deps: ['bioinf-9.5', 'algo-8.20'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Walk randomly until stuck, then restart from a node with unused edges and splice the new cycle in; the full cycle is built in linear time.' },
        { num: '9.7', kind: 'Concept', name: 'De Bruijn sequences', deps: ['bioinf-9.5'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Construct the shortest circular binary string containing every k-mer exactly once from an Eulerian cycle in the de Bruijn graph, for k up to 6.' },
        { num: '9.8', kind: 'Algorithm', name: 'Contigs from maximal non-branching paths', deps: ['bioinf-9.6'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Collapse every unambiguous stretch of the de Bruijn graph into a contig; branching nodes caused by repeats split the genome into pieces whose lengths are listed.' },
        { num: '9.9', kind: 'Concept', name: 'Paired reads and paired de Bruijn graphs', deps: ['bioinf-9.4'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Use read pairs a known distance apart; the paired graph resolves a repeat that splits the ordinary de Bruijn graph into ambiguous paths.' },
        { num: '9.10', kind: 'Concept', name: 'Repeats and tangles: why assembly is hard', deps: ['bioinf-9.4'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Insert repeats longer than the read length into a genome; the number of distinct Eulerian paths — equally valid assemblies — is counted and grows rapidly.' },
        { num: '9.11', kind: 'Method', name: 'Error correction and bubble removal', deps: ['bioinf-9.4'], refs: ['Compeau–Pevzner ch. 3'],
          pic: 'Sequencing errors create low-coverage tips and bubbles in the graph; prune edges below a coverage threshold and watch the graph collapse back to the true path.' },
        { num: '9.12', kind: 'Paper', name: 'DNA Sequencing with Chain-Terminating Inhibitors',
          paper: { authors: 'F. Sanger, S. Nicklen and A. R. Coulson', year: 1977, title: 'DNA sequencing with chain-terminating inhibitors',
                   venue: 'Proceedings of the National Academy of Sciences 74 (12): 5463–5467', doi: '10.1073/pnas.74.12.5463' },
          introduces: ['tech-12.13'], deps: ['bioinf-1.13'], refs: [],
          pic: 'Sanger’s four tubes: a polymerase copies a template and stops wherever it incorporates a dideoxy A, C, G or T; run the four reactions in four gel lanes and read the sequence from the bottom up as the fragments sort by length — set the dideoxy-to-normal ratio and watch long reads fade.' },
        { num: '9.13', kind: 'Paper', name: 'Initial Sequencing and Analysis of the Human Genome',
          paper: { authors: 'International Human Genome Sequencing Consortium', year: 2001, title: 'Initial sequencing and analysis of the human genome',
                   venue: 'Nature 409 (6822): 860–921', doi: '10.1038/35057062' },
          introduces: [], deps: ['bioinf-9.1', 'bioinf-9.2', 'bioinf-9.12'], refs: [],
          pic: 'Explore the draft genome as the paper described it: about half the sequence derived from transposable elements, protein-coding exons only about 1–1.5%, an estimated 30,000–40,000 genes, and gene density varying sharply between chromosomes — zoom from the whole genome down to a single gene to feel the scale.' },
      ],
    },
    {
      n: 10,
      title: 'Read mapping and combinatorial pattern matching',
      summary: String.raw`Mapping billions of short reads to a reference needs index structures. Tries, suffix trees and suffix arrays index all substrings; the Burrows–Wheeler transform rearranges a genome so that, with the first–last property, it can be searched backwards in time proportional to the pattern and compressed at the same time. Seeds extend exact search to approximate matches.`,
      items: [
        { num: '10.1', kind: 'Concept', name: 'Tries of patterns', deps: ['bioinf-1.1', 'algo-13.8'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'Insert a set of patterns into a trie and slide the text past it; all pattern occurrences are found in one pass, highlighted as the trie walk proceeds.' },
        { num: '10.2', kind: 'Concept', name: 'Suffix tries and suffix trees', deps: ['bioinf-10.1'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'Build the suffix trie of a text, then compress non-branching paths into edges; the node count shrinks from quadratic to linear in the text length.' },
        { num: '10.3', kind: 'Concept', name: 'Suffix arrays', deps: ['bioinf-10.2', 'algo-13.9'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'List all suffixes in lexicographic order with their start positions; binary search for a pattern finds the block of matching suffixes.' },
        { num: '10.4', kind: 'Algorithm', name: 'Burrows–Wheeler transform', deps: ['bioinf-10.3'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'Form all cyclic rotations of a text, sort them and read off the last column; the BWT of “banana$” is built step by step.' },
        { num: '10.5', kind: 'Theorem', name: 'First–last property and inversion of the BWT', deps: ['bioinf-10.4'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'Colour the i-th occurrence of each symbol in the first and last columns; the colours match up, and following them backwards reconstructs the original text.' },
        { num: '10.6', kind: 'Algorithm', name: 'Backward search with the FM-index', deps: ['bioinf-10.5'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'Match a pattern from its last symbol to its first, narrowing a range of rows with count arrays; the range shrinks to the occurrences, located via a sampled suffix array.' },
        { num: '10.7', kind: 'Algorithm', name: 'Approximate matching with seeds (pigeonhole)', deps: ['bioinf-10.6', 'bioinf-1.4'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'Split a read into d + 1 pieces; any occurrence with at most d mismatches matches one piece exactly, so exact seed hits are extended and verified.' },
        { num: '10.8', kind: 'Phenomenon', name: 'The BWT groups repeats into runs', deps: ['bioinf-10.4', 'info-4.5'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'Compare run-length encodings of a genome and of its BWT; repetitive genomes compress dramatically after the transform, as the compression ratio shows.' },
        { num: '10.9', kind: 'Algorithm', name: 'Longest repeats and shared substrings via suffix trees', deps: ['bioinf-10.2'], refs: ['Compeau–Pevzner ch. 9'],
          pic: 'The deepest internal node of a suffix tree gives the longest repeat; colour leaves by source string in a generalized tree to find the longest shared substring.' },
      ],
    },
    {
      n: 11,
      title: 'Genome rearrangements',
      summary: String.raw`Over evolutionary time chromosomes are cut and rejoined, reversing and moving blocks of genes. Sorting by reversals measures this; breakpoint graphs turn rearrangement distance into counting cycles, and the 2-break distance formula follows. Comparing human and mouse genomes tested whether breaks happen at random or concentrate in fragile regions.`,
      items: [
        { num: '11.1', kind: 'Concept', name: 'Synteny blocks and reversals', deps: [], refs: ['Compeau–Pevzner ch. 6'],
          pic: 'Two genomes are drawn as signed permutations of shared blocks; applying a reversal flips a segment and its signs, animated on the chromosome.' },
        { num: '11.2', kind: 'Algorithm', name: 'Greedy sorting by reversals', deps: ['bioinf-11.1'], refs: ['Compeau–Pevzner ch. 6'],
          pic: 'Bring each block into place with at most two reversals; the step count is compared with the optimum on small permutations and is often far from it.' },
        { num: '11.3', kind: 'Concept', name: 'Breakpoints and the breakpoint graph', deps: ['bioinf-11.2'], refs: ['Compeau–Pevzner ch. 6'],
          pic: 'Overlay the adjacencies of two genomes in different colours; the breakpoint graph decomposes into alternating cycles, which are highlighted one by one.' },
        { num: '11.4', kind: 'Theorem', name: '2-break distance = blocks − cycles', deps: ['bioinf-11.3'], refs: ['Compeau–Pevzner ch. 6'],
          pic: 'Apply 2-breaks that each increase the cycle count by one; the number of steps to reach the target equals blocks minus cycles, verified on random genomes.' },
        { num: '11.5', kind: 'Hypothesis', name: 'Random versus fragile breakage models', deps: ['bioinf-11.4'], refs: ['Compeau–Pevzner ch. 6'],
          pic: 'Simulate genomes rearranged by random breaks and compare the distribution of synteny-block lengths with human–mouse data; the excess of short blocks points to fragile regions.' },
        { num: '11.6', kind: 'Algorithm', name: 'Synteny blocks from shared k-mers', deps: ['bioinf-11.1', 'bioinf-1.2'], refs: ['Compeau–Pevzner ch. 6'],
          pic: 'Plot shared k-mers of two genomes as dots on a grid; diagonal runs are merged into synteny blocks, with reversed blocks appearing as anti-diagonals.' },
      ],
    },
    {
      n: 12,
      title: 'Clustering and computational proteomics',
      summary: String.raw`Gene-expression data are grouped by clustering: Lloyd’s k-means, smarter initialization, soft assignments via EM and hierarchical trees. Mass spectrometry reads proteins rather than genes, and sequencing peptides from spectra is another combinatorial problem — branch-and-bound over masses, spectral convolution to find amino-acid masses, and spectral alignment for identification.`,
      items: [
        { num: '12.1', kind: 'Algorithm', name: 'Lloyd’s k-means algorithm', deps: [], refs: ['Compeau–Pevzner ch. 8'],
          pic: 'Alternate assigning points to the nearest centre and moving centres to cluster means; the squared-error readout falls at every step until convergence.' },
        { num: '12.2', kind: 'Algorithm', name: 'k-means++ initialization', deps: ['bioinf-12.1'], refs: ['Compeau–Pevzner ch. 8'],
          pic: 'Compare random starts with k-means++ seeding over many runs; the histogram of final costs shows k-means++ avoiding the bad local optima.' },
        { num: '12.3', kind: 'Algorithm', name: 'Soft k-means and EM for Gaussian mixtures', deps: ['bioinf-12.1', 'stat-3.11'], refs: ['Compeau–Pevzner ch. 8'],
          pic: 'Points get fractional memberships coloured by mixture; the stiffness parameter interpolates between soft responsibilities and hard k-means assignments.' },
        { num: '12.4', kind: 'Algorithm', name: 'Hierarchical clustering of gene expression', deps: ['bioinf-5.3', 'algo-10.18'], refs: ['Compeau–Pevzner ch. 8'],
          pic: 'Cluster yeast expression profiles with single, complete and average linkage; the dendrogram and reordered heatmap reveal co-expressed gene groups.' },
        { num: '12.5', kind: 'Algorithm', name: 'Cyclopeptide sequencing from mass spectra', deps: [], refs: ['Compeau–Pevzner ch. 4'],
          pic: 'Grow candidate peptides by branch-and-bound, discarding any whose masses are inconsistent with the spectrum; the surviving candidate matches the antibiotic’s theoretical spectrum.' },
        { num: '12.6', kind: 'Method', name: 'Spectral convolution', deps: ['bioinf-12.5'], refs: ['Compeau–Pevzner ch. 4'],
          pic: 'Take all pairwise differences of spectrum masses; peaks in the histogram reveal amino-acid masses, including non-standard ones, even from noisy spectra.' },
        { num: '12.7', kind: 'Algorithm', name: 'Peptide identification by spectral alignment', deps: ['bioinf-12.6', 'bioinf-2.3'], refs: ['Compeau–Pevzner ch. 11'],
          pic: 'Score a spectrum against database peptides allowing modifications as longest paths in a spectral DAG; the best-scoring peptide and its matched peaks are highlighted.' },
      ],
    },
  ],
};
