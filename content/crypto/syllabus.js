// Syllabus — Cryptography (curated course; see collection.js for references)
//
// Sources consulted (Oct 2026):
//   Katz & Lindell, Introduction to Modern Cryptography, 3rd ed. — table of contents (authors’ page):
//     https://www.cs.umd.edu/~jkatz/imc/toc-preface-3rd.pdf
//   Boneh & Shoup, A Graduate Course in Applied Cryptography, v0.6 — chapter list:
//     https://toc.cryptobook.us/
//   Stanford CS255 (Boneh) syllabus: https://crypto.stanford.edu/~dabo/cs255/syllabus.html
//   MIT 6.875 / Berkeley CS276 and MIT 6.876J (lattices) schedules:
//     https://people.csail.mit.edu/vinodv/6876-Fall2017/index.html
// Katz–Lindell refs use 3rd-edition section numbers; Boneh–Shoup is cited by chapter (v0.6).
// Zero knowledge, pairings, threshold cryptography and MPC follow Boneh–Shoup Part III, which
// Katz–Lindell does not cover. The Enigma, unicity distance and side channels are historical or
// practical bridges cited to the nearest chapter. Interactive proofs, BQP and the PCP theorem come
// from `cplx`; entropy and coding from `info`. Deliberately omitted: quantum key distribution
// (left to `qinfo`), specific standards beyond AES/SHA/TLS, and electronic voting.
// Overlaps with parallel collections: Euclid/Bézout, Euler–Fermat, the CRT, the unit group,
// quadratic residues, the elliptic-curve group law, Hasse’s bound, lattices and Minkowski’s theorem
// are owned by `nt` and cited from here (the duplicate items were removed, numbers left as gaps).
// Landmark papers (kind 'Paper', Oct 2026): each citation was checked against its Crossref record (api.crossref.org/works/<doi>)
// or, without a DOI, against the cited record (NASA NTRS, Google Patents, Euler Archive, Smithsonian Libraries).
export default {
  collection: 'crypto',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Classical ciphers and their cryptanalysis',
      summary: String.raw`For two thousand years ciphers were invented and broken in turn. Shift and substitution ciphers fall to brute force and letter frequencies, the Vigenère cipher to periodicity, and even the Enigma to mathematics and machinery. The lessons — publish the method and keep only the key secret, make the key space huge, and measure redundancy — became the principles of modern cryptography: precise definitions, explicit assumptions and proofs.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Private-key encryption schemes', deps: [], refs: ['Katz–Lindell §1.2'],
          pic: 'Three boxes — key generation, encryption, decryption — wired between Alice, Bob and an eavesdropper; the reader types a message and watches it pass through with a chosen key.' },
        { num: '1.2', kind: 'Principle', name: 'Kerckhoffs’s principle', deps: ['crypto-1.1'], refs: ['Katz–Lindell §1.2'],
          pic: 'Toggle between a secret algorithm and a public algorithm with a secret key; compromise scenarios (a leaked design, a leaked key) show which system survives and can be repaired.' },
        { num: '1.3', kind: 'Model', name: 'Shift cipher and exhaustive key search', deps: ['crypto-1.1', 'nt-2.1'], refs: ['Katz–Lindell §1.3'],
          pic: 'Encrypt a typed sentence with a Caesar shift, then watch all 26 decryptions listed, with an English-likeness score picking out the right one instantly.' },
        { num: '1.4', kind: 'Principle', name: 'Sufficient key-space principle', deps: ['crypto-1.3', 'prob-1.6.1'], refs: ['Katz–Lindell §1.3'],
          pic: 'Brute-force time is plotted against key length for a range of attacker budgets; 2⁴⁰ falls in hours, while 2¹²⁸ outlasts the universe at any speed the reader sets.' },
        { num: '1.5', kind: 'Model', name: 'Monoalphabetic substitution cipher', deps: ['crypto-1.4', 'comb-1.5'], refs: ['Katz–Lindell §1.3'],
          pic: 'A random letter permutation encrypts a paragraph; 26! keys defeat brute force, but the letter-frequency histogram of the ciphertext is just a shuffled copy of English’s.' },
        { num: '1.6', kind: 'Method', name: 'Frequency analysis', deps: ['crypto-1.5', 'pma-8.6'], refs: ['Katz–Lindell §1.3'],
          pic: 'Match ciphertext letter frequencies against English and refine with digrams; the reader drags letter assignments and the plaintext emerges word by word.' },
        { num: '1.7', kind: 'Model', name: 'Vigenère cipher', deps: ['crypto-1.6'], refs: ['Katz–Lindell §1.3'],
          pic: 'A repeating keyword shifts each letter differently; the ciphertext histogram flattens as the keyword lengthens, hiding the language’s fingerprint.' },
        { num: '1.8', kind: 'Method', name: 'Index of coincidence and Kasiski examination', deps: ['crypto-1.7'], refs: ['Katz–Lindell §1.3'],
          pic: 'For each guessed period, the index of coincidence of every k-th letter is plotted; it jumps to English’s value at the true key length, after which each column is a shift cipher.' },
        { num: '1.9', kind: 'Invention', name: 'The Enigma machine and its cryptanalysis', deps: ['crypto-1.5', 'alg-1.15'], refs: ['Katz–Lindell §1.3'],
          pic: 'Three rotors, a reflector and a plugboard encrypt typed letters with stepping visible; the reflector means no letter maps to itself, a weakness the reader exploits to place a known crib.' },
        { num: '1.10', kind: 'Concept', name: 'Unicity distance', deps: ['crypto-1.5', 'info-11.9'], refs: ['Boneh–Shoup ch. 2'],
          pic: 'Decrypt a substitution ciphertext of growing length under every key consistent with English statistics; the number of plausible keys collapses to one near H(K)/redundancy letters.' },
        { num: '1.11', kind: 'Principle', name: 'Principles of modern cryptography', deps: ['crypto-1.2'], refs: ['Katz–Lindell §1.4'],
          pic: 'A flowchart from threat model to definition, assumption and proof by reduction; clicking each box shows the historical failure that motivated it.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Perfect secrecy',
      summary: String.raw`Shannon defined secrecy precisely: the ciphertext must reveal nothing about the message, whatever the prior. The one-time pad achieves this, but at a steep price that Shannon showed is unavoidable — the key must be as long as the message and can never be reused. The chapter quantifies the cost with entropy and shows what goes wrong when the rules are broken.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Perfect secrecy', deps: ['crypto-1.1', 'stat-2.1'], refs: ['Katz–Lindell §2.1', 'Boneh–Shoup ch. 2'],
          pic: 'Pick a prior over messages and a cipher; the posterior given each ciphertext is drawn beside the prior, and perfect secrecy holds exactly when the two always coincide.' },
        { num: '2.2', kind: 'Theorem', name: 'Perfect indistinguishability is equivalent', deps: ['crypto-2.1', 'prob-1.6.1'], refs: ['Katz–Lindell §2.1'],
          pic: 'An adversary chooses two messages and guesses which was encrypted; over many trials its success rate is pinned at exactly ½ for the one-time pad and drifts higher for flawed ciphers.' },
        { num: '2.3', kind: 'Theorem', name: 'The one-time pad is perfectly secret', deps: ['crypto-2.1', 'alg-1.20'], refs: ['Katz–Lindell §2.2'],
          pic: 'XOR a typed message with a random key; for any ciphertext the reader picks, every message of that length is explained by exactly one key, displayed as a full table.' },
        { num: '2.4', kind: 'Theorem', name: 'Perfect secrecy requires as many keys as messages', deps: ['crypto-2.3', 'comb-1.2'], refs: ['Katz–Lindell §2.3'],
          pic: 'Shrink the key space below the message space and some message becomes impossible for a given ciphertext; the posterior bar for it drops to zero.' },
        { num: '2.5', kind: 'Theorem', name: 'Shannon’s characterization of perfect secrecy', deps: ['crypto-2.4', 'comb-1.2'], refs: ['Katz–Lindell §2.4'],
          pic: 'When message, key and ciphertext spaces have equal size, the encryption table must be a Latin square with uniformly chosen keys; the reader edits the table and the tool checks both conditions.' },
        { num: '2.6', kind: 'Theorem', name: 'Entropy bound: H(K) ≥ H(M)', deps: ['crypto-2.4', 'info-2.7'], refs: ['Boneh–Shoup ch. 2'],
          pic: 'Stacked entropy bars for message, key and ciphertext show that zero leakage I(M;C) = 0 forces the key bar to be at least as tall as the message bar.' },
        { num: '2.7', kind: 'Phenomenon', name: 'The two-time pad', deps: ['crypto-2.3'], refs: ['Katz–Lindell §2.2'],
          pic: 'Two images encrypted with the same pad look like noise separately, but XORing the ciphertexts reveals the overlay of both images.' },
        { num: '2.8', kind: 'Definition', name: 'Statistical distance', deps: ['crypto-2.1', 'prob-1.1.1a'], refs: ['Boneh–Shoup ch. 2'],
          pic: 'Two distributions are drawn as histograms; the best possible distinguisher’s advantage equals half the total area of their difference, shaded and read out.' },
        { num: '2.9', kind: 'Concept', name: 'Secret splitting by XOR', deps: ['crypto-2.3', 'prob-2.1.11'], refs: ['Katz–Lindell §15.3'],
          pic: 'Split a secret into n random-looking shares whose XOR is the secret; any n − 1 shares the reader collects have a perfectly uniform XOR.' },
        { num: '2.10', kind: 'Paper', name: 'Communication Theory of Secrecy Systems',
          paper: { authors: 'C. E. Shannon', year: 1949, title: 'Communication Theory of Secrecy Systems',
                   venue: 'Bell System Technical Journal 28 (4): 656–715', doi: '10.1002/j.1538-7305.1949.tb00928.x' },
          introduces: ['crypto-2.1', 'crypto-2.3', 'crypto-2.4', 'crypto-2.5', 'crypto-1.10'], deps: ['info-1.2', 'crypto-1.7'], refs: [],
          pic: 'Encrypt a message with a Vigenère key of adjustable length and watch the posterior over plaintexts collapse once the ciphertext passes the unicity distance; switch to a one-time pad and the posterior stays flat.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Computational security and pseudorandomness',
      summary: String.raw`Modern cryptography relaxes perfect secrecy to security against efficient adversaries, allowing a negligible chance of failure. Pseudorandom generators stretch a short key into a long pad that no efficient test can tell from random; pseudorandom functions extend the idea to random-access, giving encryption secure even against chosen-plaintext attacks. Proofs proceed by reduction — breaking the scheme would break the primitive — often through a sequence of hybrid experiments.`,
      items: [
        { num: '3.1', kind: 'Concept', name: 'Concrete versus asymptotic security', deps: ['crypto-1.11', 'pma-3.20'], refs: ['Katz–Lindell §3.1'],
          pic: 'An adversary’s success probability is plotted against its running time for a fixed key size and, alternatively, as a function of the security parameter, with the safe region shaded in each view.' },
        { num: '3.2', kind: 'Definition', name: 'Negligible functions and efficient adversaries', deps: ['crypto-3.1', 'pma-3.20'], refs: ['Katz–Lindell §3.1'],
          pic: 'Plot 2^(−n), n^(−10) and 2^(−√n) on a log scale; every negligible function eventually dips below every inverse polynomial, while n^(−10) does not.' },
        { num: '3.3', kind: 'Definition', name: 'Indistinguishable encryptions (EAV-security)', deps: ['crypto-3.2', 'crypto-2.2'], refs: ['Katz–Lindell §3.2'],
          pic: 'The eavesdropping game is stepped through as a message diagram; an adversary the reader programs is run many times and its advantage over ½ is estimated with error bars.' },
        { num: '3.4', kind: 'Theorem', name: 'Semantic security is equivalent to indistinguishability', deps: ['crypto-3.3'], refs: ['Katz–Lindell §3.2', 'Boneh–Shoup ch. 2'],
          pic: 'Any adversary that learns a function of the message from the ciphertext is converted into a distinguisher with comparable advantage; both advantages are measured side by side.' },
        { num: '3.5', kind: 'Definition', name: 'Pseudorandom generators', deps: ['crypto-3.2', 'comb-1.1'], refs: ['Katz–Lindell §3.3.1', 'Boneh–Shoup ch. 3'],
          pic: 'Stretch short seeds into long strings and run statistical tests (frequency, runs, autocorrelation) on them and on true random strings; a weak generator fails a test the reader selects.' },
        { num: '3.6', kind: 'Method', name: 'Proofs by reduction', deps: ['crypto-3.2', 'toc-13.1'], refs: ['Katz–Lindell §3.3.2'],
          pic: 'An adversary box against the scheme is wrapped inside a reduction box that attacks the primitive; the success probabilities passing through the wrapper are displayed.' },
        { num: '3.7', kind: 'Theorem', name: 'Pseudorandom generators give EAV-secure encryption', deps: ['crypto-3.5', 'crypto-3.6', 'crypto-3.3'], refs: ['Katz–Lindell §3.3.3'],
          pic: 'Replace the one-time pad’s key with generator output: a distinguisher against the cipher is shown converted, step by step, into a test that breaks the generator.' },
        { num: '3.8', kind: 'Method', name: 'The hybrid argument', deps: ['crypto-3.5', 'pma-1.33'], refs: ['Katz–Lindell §8.8'],
          pic: 'A row of hybrid distributions morphs the real experiment into the ideal one, one block at a time; the distinguisher’s advantages between neighbours sum to the total gap.' },
        { num: '3.9', kind: 'Definition', name: 'Chosen-plaintext attacks and CPA-security', deps: ['crypto-3.3'], refs: ['Katz–Lindell §3.4.2', 'Boneh–Shoup ch. 5'],
          pic: 'The adversary may query an encryption oracle before and after the challenge; the message diagram logs every query the reader’s adversary makes.' },
        { num: '3.10', kind: 'Theorem', name: 'Deterministic encryption cannot be CPA-secure', deps: ['crypto-3.9'], refs: ['Katz–Lindell §3.4.2'],
          pic: 'Query the oracle on m₀, then compare with the challenge ciphertext; the attack wins every time against any deterministic scheme, shown over many trials.' },
        { num: '3.11', kind: 'Definition', name: 'Pseudorandom functions and permutations', deps: ['crypto-3.5', 'comb-1.1'], refs: ['Katz–Lindell §3.5.1', 'Boneh–Shoup ch. 4'],
          pic: 'A distinguisher queries a box that is either a keyed function or a truly random table filled lazily on demand; the table grows as queries are made and the advantage is estimated.' },
        { num: '3.12', kind: 'Theorem', name: 'CPA-secure encryption from a pseudorandom function', deps: ['crypto-3.11', 'crypto-3.9', 'prob-1.1.1'], refs: ['Katz–Lindell §3.5.2'],
          pic: 'Encrypt as (r, F_k(r) ⊕ m) with fresh random r; the only way to win is a repeated r, whose probability over the adversary’s queries is plotted.' },
        { num: '3.13', kind: 'Theorem', name: 'The birthday bound', deps: ['prob-1.1.1'], refs: ['Katz–Lindell §6.4.1'],
          pic: 'Throw random values into N bins; the probability of a collision is simulated and plotted against the number of throws, crossing ½ near 1.18√N.' },
        { num: '3.14', kind: 'Theorem', name: 'PRP/PRF switching lemma', deps: ['crypto-3.11', 'crypto-3.13'], refs: ['Boneh–Shoup ch. 4'],
          pic: 'A random permutation and a random function are queried q times; they differ only when the function collides, and the measured distinguishing advantage tracks q²/2N.' },
        { num: '3.15', kind: 'Paper', name: 'Probabilistic Encryption',
          paper: { authors: 'Shafi Goldwasser and Silvio Micali', year: 1984, title: 'Probabilistic Encryption',
                   venue: 'Journal of Computer and System Sciences 28 (2): 270–299', doi: '10.1016/0022-0000(84)90070-9' },
          introduces: ['crypto-3.3', 'crypto-3.4', 'crypto-3.8', 'crypto-9.13'], deps: ['crypto-3.2', 'nt-4.1', 'nt-2.4', 'nt-4.8'], refs: [],
          pic: 'Encrypt the same bit twice and get unrelated ciphertexts (random squares or non-squares modulo N = pq); in the indistinguishability game the reader tries to tell encryptions of two chosen messages apart and sees the advantage stay near zero without the factors.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Stream ciphers, block ciphers and modes of operation',
      summary: String.raw`Practical ciphers are engineered rather than proved, then attacked relentlessly. Linear feedback shift registers are fast but fall to linear algebra; substitution–permutation and Feistel networks build block ciphers like DES and AES from simple rounds that spread every input bit across the output. How a block cipher is used matters as much as the cipher itself: ECB leaks patterns, CBC and counter mode hide them, and careless padding checks can leak the entire plaintext.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Linear-feedback shift registers', deps: ['crypto-3.5'], refs: ['Katz–Lindell §7.1.1'],
          pic: 'Edit the taps of an LFSR and watch the keystream; given 2n output bits, solving a linear system recovers the taps and predicts every later bit.' },
        { num: '4.2', kind: 'Model', name: 'RC4 and ChaCha20', deps: ['crypto-4.1'], refs: ['Katz–Lindell §7.1.4', 'Katz–Lindell §7.1.5'],
          pic: 'Generate many RC4 keystreams and histogram the second output byte: zero appears about twice as often as it should; ChaCha20’s add-rotate-XOR rounds show no such bias.' },
        { num: '4.3', kind: 'Definition', name: 'Substitution–permutation networks and the avalanche effect', deps: ['crypto-3.11', 'alg-1.15'], refs: ['Katz–Lindell §7.2.1'],
          pic: 'Flip one input bit of a toy SPN and trace the difference through S-boxes and permutation layers; after a few rounds about half the output bits differ.' },
        { num: '4.4', kind: 'Theorem', name: 'Feistel networks are invertible', deps: ['crypto-3.11', 'alg-1.20'], refs: ['Katz–Lindell §7.2.2'],
          pic: 'Run a Feistel network forward with an arbitrary, non-invertible round function the reader draws, then backward with the round keys reversed; the input reappears exactly.' },
        { num: '4.5', kind: 'Invention', name: 'The Data Encryption Standard', deps: ['crypto-4.4'], refs: ['Katz–Lindell §7.2.3'],
          pic: 'Sixteen Feistel rounds with expansion, S-boxes and permutation are animated on one block; a cost calculator shows why a 56-bit key fell to exhaustive search in 1998.' },
        { num: '4.6', kind: 'Algorithm', name: 'Meet-in-the-middle attack on double encryption', deps: ['crypto-4.5'], refs: ['Katz–Lindell §7.2.4'],
          pic: 'For a toy cipher with small keys, a table of encryptions from one side meets a table of decryptions from the other; the matching middle values reveal both keys in about 2·2ⁿ work.' },
        { num: '4.7', kind: 'Invention', name: 'AES (Rijndael)', deps: ['crypto-4.3'], refs: ['Katz–Lindell §7.2.5'],
          pic: 'The 4×4 byte state passes through SubBytes, ShiftRows, MixColumns and AddRoundKey with each step highlighted; one changed byte spreads to the whole state in two rounds.' },
        { num: '4.8', kind: 'Method', name: 'Differential and linear cryptanalysis', deps: ['crypto-4.3', 'prob-2.1.13'], refs: ['Katz–Lindell §7.2', 'Boneh–Shoup ch. 4'],
          pic: 'The difference distribution table of an S-box the reader edits is computed; a high-probability differential is chained through rounds to rank candidate last-round keys.' },
        { num: '4.9', kind: 'Phenomenon', name: 'ECB mode leaks patterns', deps: ['crypto-3.10'], refs: ['Katz–Lindell §3.6.3'],
          pic: 'An image encrypted block by block in ECB keeps its outline visible, while the same image in CBC or counter mode becomes uniform noise.' },
        { num: '4.10', kind: 'Algorithm', name: 'CBC and counter modes', deps: ['crypto-3.12'], refs: ['Katz–Lindell §3.6.3'],
          pic: 'Block diagrams for CBC and CTR encrypt a typed message; flipping a ciphertext bit shows how errors propagate differently in each mode.' },
        { num: '4.11', kind: 'Algorithm', name: 'Padding-oracle attack on CBC', deps: ['crypto-4.10'], refs: ['Katz–Lindell §5.1.1'],
          pic: 'A server only answers “padding OK” or “bad padding”; tampering with the previous block byte by byte, the reader’s attack decrypts a whole message in a few thousand queries, counted live.' },
        { num: '4.12', kind: 'Phenomenon', name: 'Side-channel attacks', deps: ['crypto-4.7'], refs: ['Katz–Lindell §12.5.6', 'Boneh–Shoup ch. 4'],
          pic: 'Simulated power traces of a table-lookup AES are correlated with key-byte guesses; the correct guess’s correlation peak rises above the others as more traces are collected.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Message integrity and hash functions',
      summary: String.raw`Authentication asks whether a new accepted message could have come from an attacker. Precise games separate that question from secrecy and distinguish computational reductions from one-time finite-field guarantees. Hash constructions, collision searches and authenticated trees then lead to a careful composition of encryption and integrity.`,
      items: [
        { num: '5.1', kind: 'Definition', name: 'Message authentication codes', deps: ["crypto-3.2"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §6.1, pp.217–219"],
          pic: "Edit a public sample message and choose a candidate tag. A transcript marks replays, rejected changes and new accepted pairs separately. Shortening the displayed HMAC tag makes exhaustive guessing feasible; it does not turn the visible public key into a secure experiment." },
        { num: '5.2', kind: 'Theorem', name: 'A pseudorandom function is a secure MAC', deps: ["crypto-5.1","crypto-3.11"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) Theorem6.2, p.224"],
          pic: "Choose the output bits and a tag guess. The strip exhausts every possible unseen output; exactly one accepts. The query count changes the reduction’s cost, while the ideal success probability stays1/|T| for a single fresh-input guess." },
        { num: '5.3', kind: 'Algorithm', name: 'CBC-MAC', deps: ["crypto-5.2","crypto-3.14","crypto-4.7"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §6.4.1–6.4.3, pp.226–231"],
          pic: "Change the public AES key and one-block message. Compare its actual128-bit CBC-MAC with the constructed two-block forgery. The append uses the raw one-block tag; it is not an oracle forgery on the encoded domain. Adding a length block changes the evaluated domain and defeats this particular splice; the finite comparison is not a general proof of the encoded scheme." },
        { num: '5.4', kind: 'Theorem', name: 'One-time MACs from universal hashing (Carter–Wegman)', deps: ["crypto-5.1","nt-2.2"], see: ["algo-5.16"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §7.4–7.5; supplied affine pairwise-independence proof"],
          pic: "Move the observed and proposed field messages and tag. The histogram exhausts all257 keys consistent with the first observation. Turn on a second distinct tag to recover the exact reused key. Choosing the same message deliberately breaks the fresh-message hypothesis." },
        { num: '5.5', kind: 'Algorithm', name: 'GMAC and Poly1305', deps: ["crypto-5.4","crypto-4.7"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §9.7, pp.381–382 (counter/mask layout; bit-length fields used)","RFC4543 §2 (GMAC definition and nonce restriction)","RFC8452 AppendixA (GHASH field and representation)","RFC8439 §2.5–2.5.2 (Poly1305)"],
          pic: "Switch between actual GMAC and the RFC8439 Poly1305 example. Edit the authenticated text and nonce, then inspect accumulator blocks and the final tag. The reuse toggle marks a violated security condition; it does not simulate a complete forgery." },
        { num: '5.6', kind: 'Definition', name: 'Collision resistance', deps: ["crypto-3.2"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.1, pp.290–291; §8.11.1"],
          pic: "Choose a tiny truncation of actual SHA-256 and a search task. Exhaust a finite two-byte input prefix and see the actual witness or an honest “not found in this budget.” Repeated inputs do not count as collisions." },
        { num: '5.7', kind: 'Algorithm', name: 'Birthday attack on hash functions', deps: ["crypto-5.6","crypto-3.13"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.3, pp.293–295"],
          pic: "Compare the exact random-function collision curve with the exponential approximation, then run a reproducible search on truncated SHA-256. The empirical witness and the model probability are reported separately." },
        { num: '5.8', kind: 'Algorithm', name: 'Small-space collision finding (cycle detection)', deps: ["crypto-5.7"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.3; supplied Floyd orbit argument"],
          pic: "Choose a finite truncated-hash map or an actual permutation and move the starting seed. The orbit is laid out as a tail and a ring. A gold pair appears only when the computed predecessors are distinct; a seed already on a cycle explicitly reports the missing witness." },
        { num: '5.9', kind: 'Theorem', name: 'Merkle–Damgård transform', deps: ["crypto-5.6"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) Theorem8.3, pp.295–298","RFC6234 §§4.1,5.1,6.1–6.2"],
          pic: "Inspect actual SHA-256 padding and chaining states, or switch to a deliberately weak8-bit compression function and inspect a real collision’s backward-extracted compression witness. The toy witness highlights two distinct compression inputs with the same output." },
        { num: '5.10', kind: 'Phenomenon', name: 'Length-extension attacks', deps: ["crypto-5.9","crypto-5.1"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.7, p.307","RFC6234 §§4.1,6.2; supplied continuation calculation"],
          pic: "Change a public teaching secret, message, suffix and guessed secret length. The tool resumes the actual SHA-256 state and compares its forged tag with direct verification. Switch to HMAC to see the same attempted continuation fail on this sample." },
        { num: '5.11', kind: 'Algorithm', name: 'HMAC', deps: ["crypto-5.9","crypto-5.2"], refs: ["RFC2104 §2","RFC4231 §4","Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.7.1–8.7.3, pp.307–311"],
          pic: "Edit a key and message, or use a key longer than64 bytes. Inspect the normalized key, inner digest and final tag, computed by actual SHA-256. The RFC4231 preset reproduces its published first vector." },
        { num: '5.12', kind: 'Algorithm', name: 'Davies–Meyer and the sponge construction', deps: ["crypto-5.9","crypto-4.7"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.5.3 and §8.8","Bertoni et al., Cryptographic sponge functions (2011), §2.2, Algorithm1, PDFpp.12–14"],
          pic: "Switch from an actual AES Davies–Meyer calculation to a declared8-bit sponge. Adjust the rate, typed bits and squeeze length; follow the exact absorption states and emitted bits. The tiny sponge permutation is fully public and deliberately weak." },
        { num: '5.13', kind: 'Model', name: 'The random-oracle model', deps: ["crypto-5.6"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.10.2, pp.327–329"],
          pic: "Type a comma-separated sequence of queries and change the seed/output bits. Repeated strings reuse their earlier entry, while fresh strings add a row. Two distinct strings can still collide in the short output space." },
        { num: '5.14', kind: 'Algorithm', name: 'Merkle trees', deps: ["crypto-5.6"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §8.9–8.9.1, pp.320–324; supplied domain-separated binding proof"],
          pic: "Select a list length and index, then change that leaf while holding the original root and siblings fixed. The highlighted sibling path is the actual proof. At one leaf the proof has zero siblings; an empty list has a root but no valid membership index." },
        { num: '5.15', kind: 'Method', name: 'Password hashing and salting', deps: ["crypto-5.6","crypto-5.11"], refs: ["RFC8018 §5.2 (PBKDF2 recurrence)","RFC9106 §§1,3,7 (Argon2 and memory tradeoffs)"],
          pic: "Compare equal-password records with shared or distinct salts and change a deliberately tiny PBKDF2 iteration count. The tool computes actual digests and exact direct-work counts. No timing benchmark or production parameter recommendation is fabricated." },
        { num: '5.16', kind: 'Definition', name: 'Chosen-ciphertext attacks and malleability', deps: ["crypto-3.9","crypto-3.12","crypto-4.10"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) §9.2.2–9.2.3, pp.361–363; supplied counter-mode attack"],
          pic: "Move the byte and bit to flip in a locally generated AES-counter ciphertext. The decrypted sample changes at exactly the selected plaintext bit. Turning off the edit shows why submitting the exact challenge would be a forbidden CCA query." },
        { num: '5.17', kind: 'Theorem', name: 'Encrypt-then-MAC gives authenticated encryption', deps: ["crypto-5.16","crypto-5.1","crypto-3.12","crypto-5.11"], refs: ["Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (2023) Theorems9.1–9.2, pp.363,367–368"],
          pic: "Modify a nonce byte, ciphertext byte or tag byte of an actual locally generated AES-counter/HMAC packet. The readout counts whether decryption was called. A failed tag is rejected before decryption; selecting no modification verifies and recovers the teaching plaintext." },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      "n": 6,
      "title": "One-way functions and the foundations",
      "summary": "A one-way function is easy to evaluate but hard to invert on a random input. Hard-core predicates turn this search difficulty into unpredictable bits; generator and function constructions then support reusable private-key cryptography. The reductions distinguish worst-case difficulty, average-case difficulty and the additional structure needed for public communication.",
      "items": [
        {
          "num": "6.1",
          "kind": "Definition",
          "name": "One-way functions",
          "deps": [
            "crypto-3.2"
          ],
          "refs": [
            "Arora–Barak, Computational Complexity, author draft 8January2007, chapter10, printed187–202, Definition10.1; HRV2012, Definition2.2"
          ],
          "pic": "Edit the function table, select a sampled input and give sequential search a budget. Step through actual evaluations and compare recovery of any preimage with recovery of the original input."
        },
        {
          "num": "6.2",
          "kind": "Concept",
          "name": "Candidate one-way functions",
          "deps": [
            "crypto-6.1"
          ],
          "refs": [
            "Arora–Barak, Computational Complexity, author draft 8January2007, chapter10, printed187–202, §10.1 candidates and distribution-sensitive assumptions"
          ],
          "pic": "Compute a small product, modular power or subset sum, then inspect a real elementary reverse search. The counters name the operations being counted and the witness actually returned."
        },
        {
          "num": "6.3",
          "kind": "Theorem",
          "name": "One-way functions imply P ≠ NP",
          "deps": [
            "crypto-6.1"
          ],
          "refs": [
            "Arora–Barak, Computational Complexity, author draft 8January2007, chapter10, printed187–202, §10.1; Kabanets–Andrews, Lecture8 (2011), Algorithmica discussion; direct prefix proof supplied"
          ],
          "pic": "Edit the function and choose a target output. A finite exact prefix oracle answers each question; watch the candidate set shrink to a preimage or detect a target outside the image."
        },
        {
          "num": "6.4",
          "kind": "Definition",
          "name": "Hard-core predicates",
          "deps": [
            "crypto-6.1"
          ],
          "refs": [
            "Arora–Barak, Computational Complexity, author draft 8January2007, chapter10, printed187–202, §10.2 hard-core predicates"
          ],
          "pic": "Edit both the predicate and the predictor. Exact per-input scores reveal what the predictor can infer from each fiber; the best finite predictor button performs exhaustive majority decoding."
        },
        {
          "num": "6.5",
          "kind": "Theorem",
          "name": "Goldreich–Levin theorem",
          "deps": [
            "crypto-6.4",
            "prob-1.6.4"
          ],
          "refs": [
            "Arora–Barak, Computational Complexity, author draft 8January2007, chapter10, printed187–202, §10.2.2, with sample-size inequality corrected; noninjective extension and candidate verification supplied"
          ],
          "pic": "Edit a predictor's eight replies, choose reproducible basis shifts and step through guesses for their inner products. The model actually majority-decodes candidates and verifies them against the received function value."
        },
        {
          "num": "6.6",
          "kind": "Theorem",
          "name": "Pseudorandom generators from one-way permutations",
          "deps": [
            "crypto-6.5",
            "crypto-3.5"
          ],
          "refs": [
            "Arora–Barak, Computational Complexity, author draft 8January2007, chapter10, printed187–202, §10.2.3; exact signed predictor reduction supplied"
          ],
          "pic": "Edit a permutation, a predicate and a full distinguisher truth table. Compute the exact real-versus-uniform gap and the prediction success produced by the reduction."
        },
        {
          "num": "6.7",
          "kind": "Theorem",
          "name": "Increasing the expansion of a generator",
          "deps": [
            "crypto-6.6",
            "crypto-3.8"
          ],
          "refs": [
            "Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (January2023), §3.4, Theorems3.2–3.3, printed54–62"
          ],
          "pic": "Edit the one-bit generator and step through exact hybrid distributions. Change the distinguisher and output length; the readout shows the actual emitted bits, terminal state and telescoping probabilities."
        },
        {
          "num": "6.8",
          "kind": "Theorem",
          "name": "Generators from any one-way function (HILL)",
          "deps": [
            "crypto-6.5",
            "crypto-6.7",
            "info-1.2"
          ],
          "refs": [
            "Haitner–Reingold–Vadhan, Efficiency Improvements in Constructing Pseudorandom Generators from One-way Functions, 24May2012, §§2–6 and AppendixA; Theorems4.1,5.1,6.1 and Corollary6.2; uniform-fiber hashing argument supplied"
          ],
          "pic": "Edit a many-to-one function and a binary linear hash. Exact fiber entropies and exhaustive hash-family distances reveal what statistical extraction can and cannot supply to the general generator construction."
        },
        {
          "num": "6.9",
          "kind": "Algorithm",
          "name": "GGM pseudorandom functions from generators",
          "deps": [
            "crypto-6.7",
            "crypto-3.11"
          ],
          "refs": [
            "Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (January2023), §4.6, printed147–153; §3.4.1 parallel-composition proof"
          ],
          "pic": "Edit the doubling generator and type equal-length binary queries. Step along the actual paths and see which generator calls are new and which prefixes reuse cached labels."
        },
        {
          "num": "6.10",
          "kind": "Theorem",
          "name": "Luby–Rackoff: three Feistel rounds give a pseudorandom permutation",
          "deps": [
            "crypto-6.9",
            "crypto-4.4",
            "crypto-3.8"
          ],
          "refs": [
            "Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (January2023), §4.5, printed141–147, forward-only proof; explicit inverse attack derived here"
          ],
          "pic": "Edit three separate round tables and inspect actual round states. Compare forward-query relations with an adaptive inverse-query attack, using exact random-permutation probabilities at the toy block size."
        },
        {
          "num": "6.11",
          "kind": "Theorem",
          "name": "Private-key cryptography is equivalent to one-way functions",
          "deps": [
            "crypto-6.8",
            "crypto-6.10",
            "crypto-5.2",
            "crypto-3.12"
          ],
          "refs": [
            "Boneh–Shoup, A Graduate Course in Applied Cryptography, v0.6 (January2023), §§3.4,4.5–4.6 for the construction chain; Barak, An Intensive Introduction to Cryptography, 17November2021, §24.1, printed401–402, necessity overview (full distributional-inversion proof not supplied there)"
          ],
          "pic": "Choose a source and target primitive to trace actual implication edges. Separately, edit a tiny GGM-based MAC, observe tags, and calculate the exact posterior key set and best fresh-message forgery probability."
        },
        {
          "num": "6.12",
          "kind": "Concept",
          "name": "Impagliazzo’s five worlds",
          "deps": [
            "crypto-6.3",
            "crypto-6.11"
          ],
          "refs": [
            "Kabanets–Andrews, SFU CMPT881 Lecture8 (header16March2011), pp.1–3; Kabanets–Chen Lecture7 (27January2011), randomized samplable-distribution reduction and OWF consequence; Barak2021 §24.1 (historical framing only)"
          ],
          "pic": "Select a logically consistent hypothesis profile. In a separate finite example, edit a function and change the probability of a costly instance to see the difference between average and maximum search work."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Number theory and hardness assumptions',
      summary: String.raw`Public-key cryptography draws its hard problems from number theory. Modular arithmetic, Euler’s theorem and the Chinese remainder theorem make exponentiation and inversion fast; random primes are plentiful and quickly certified. Against this efficient toolkit stand problems believed hard — factoring, extracting e-th roots modulo N, discrete logarithms and their Diffie–Hellman variants — whose precise formulation, in the right groups, underlies every public-key scheme that follows.`,
      items: [
        { num: '7.2', kind: 'Algorithm', name: 'Square-and-multiply exponentiation', deps: [], refs: ['Katz–Lindell §9.1.2'],
          pic: 'Compute a^b mod N by scanning the bits of b; the number of multiplications is plotted against bit length and stays linear, versus b − 1 for repeated multiplication.' },
        { num: '7.6', kind: 'Algorithm', name: 'Generating random primes', deps: ['nt-2.8', 'nt-3.12', 'nt-12.8'], refs: ['Katz–Lindell §9.2.1', 'Katz–Lindell §9.2.2'],
          pic: 'Draw random n-bit odd numbers and test them; the number of draws until a prime is found averages about (n ln 2)/2, as predicted by the density of primes.' },
        { num: '7.7', kind: 'Definition', name: 'The factoring assumption', deps: ['crypto-6.1'], refs: ['Katz–Lindell §9.2.3'],
          pic: 'Factoring records over the years are plotted by bit length, alongside the sizes of moduli in use, leaving a widening safety margin.' },
        { num: '7.8', kind: 'Definition', name: 'The RSA assumption', deps: ['nt-2.8', 'crypto-7.7'], refs: ['Katz–Lindell §9.2.4'],
          pic: 'With the factorization, e-th roots mod N are computed instantly via d = e⁻¹ mod φ(N); without it, the reader’s search for a root takes exponentially long.' },
        { num: '7.9', kind: 'Definition', name: 'Cyclic groups and generators', deps: ['nt-3.4', 'nt-3.2'], refs: ['Katz–Lindell §9.3.1'],
          pic: 'Powers of a chosen element of ℤ_p^* are drawn as a walk around a circle; generators visit all p − 1 points, other elements fall into shorter cycles whose lengths divide p − 1.' },
        { num: '7.10', kind: 'Definition', name: 'Discrete-logarithm, CDH and DDH assumptions', deps: ['crypto-7.9', 'crypto-6.1'], refs: ['Katz–Lindell §9.3.2'],
          pic: 'Given g and gˣ the reader tries to find x; the scattered-looking map x ↦ gˣ is drawn, and the three problems (find x, compute g^(xy), recognize g^(xy)) are posed side by side.' },
        { num: '7.12', kind: 'Concept', name: 'Prime-order subgroups', deps: ['crypto-7.10', 'nt-4.1'], refs: ['Katz–Lindell §9.3.3'],
          pic: 'In the full group ℤ_p^*, the Legendre symbol of g^(xy) is predictable from those of gˣ and gʸ, breaking DDH; moving to the subgroup of squares removes the leak, as the distinguisher’s advantage shows.' },
        { num: '7.13', kind: 'Theorem', name: 'Collision-resistant hashing from discrete logarithms', deps: ['crypto-7.10', 'crypto-5.6'], refs: ['Katz–Lindell §9.4.2'],
          pic: 'Hash (x₁, x₂) to g^x₁ h^x₂; any collision the reader finds is converted, by solving one linear equation, into the discrete logarithm of h.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Algorithms for factoring and discrete logarithms',
      summary: String.raw`Key sizes are set by the best attacks. Pollard’s methods exploit smooth group orders and birthday collisions; the quadratic and number field sieves combine smooth relations by linear algebra to factor in subexponential time. For discrete logarithms, generic algorithms such as baby-step giant-step and Pohlig–Hellman meet a matching square-root lower bound, while index calculus exploits the extra structure of ℤ_p^* — the reason elliptic curves allow much shorter keys.`,
      items: [
        { num: '8.1', kind: 'Algorithm', name: 'Pollard’s p − 1 method', deps: ['nt-2.8'], refs: ['Katz–Lindell §10.1.1'],
          pic: 'Compute gcd(a^B! − 1, N) for growing B; it pops out a factor p as soon as p − 1 is B-smooth, demonstrated on moduli the reader builds from smooth and non-smooth primes.' },
        { num: '8.2', kind: 'Algorithm', name: 'Pollard’s rho factoring', deps: ['crypto-5.8'], refs: ['Katz–Lindell §10.1.2'],
          pic: 'Iterate x ↦ x² + 1 mod N and watch the sequence mod an unknown factor p form a ρ; the gcd with N reveals p after about √p steps, plotted for many N.' },
        { num: '8.3', kind: 'Algorithm', name: 'Quadratic sieve and smooth relations', deps: ['nt-2.4'], refs: ['Katz–Lindell §10.1.3'],
          pic: 'Values x² − N near √N are sieved for small prime factors; smooth ones become exponent vectors mod 2, and a dependency found by Gaussian elimination yields a congruence of squares.' },
        { num: '8.4', kind: 'Concept', name: 'Subexponential complexity and the number field sieve', deps: ['crypto-8.3'], refs: ['Katz–Lindell §10.4'],
          pic: 'The running-time curves exp(c·(ln N)^α (ln ln N)^(1−α)) for trial division, quadratic sieve and number field sieve are plotted against bit length, with factoring records overlaid.' },
        { num: '8.5', kind: 'Algorithm', name: 'Pohlig–Hellman algorithm', deps: ['nt-2.4', 'crypto-7.10'], refs: ['Katz–Lindell §10.2.1'],
          pic: 'When the group order factors into small primes, the logarithm is solved in each small subgroup and recombined by the CRT; timings drop dramatically for smooth orders the reader picks.' },
        { num: '8.6', kind: 'Algorithm', name: 'Baby-step giant-step', deps: ['crypto-7.10'], refs: ['Katz–Lindell §10.2.2'],
          pic: 'A table of √q baby steps meets a walk of giant steps; the collision gives the logarithm, and time and memory both scale as √q on the plot.' },
        { num: '8.7', kind: 'Algorithm', name: 'Pollard’s rho for discrete logarithms', deps: ['crypto-8.6', 'crypto-5.8'], refs: ['Katz–Lindell §10.2.3'],
          pic: 'A pseudo-random walk on gᵃhᵇ is iterated until it cycles; the collision gives a linear equation for log h, found with constant memory.' },
        { num: '8.8', kind: 'Theorem', name: 'Generic-group lower bound', deps: ['crypto-8.6'], refs: ['Boneh–Shoup ch. 16'],
          pic: 'An algorithm that only sees random labels for group elements succeeds with probability about q²/N after q queries; simulated success curves match the bound.' },
        { num: '8.9', kind: 'Algorithm', name: 'Index calculus', deps: ['crypto-8.3', 'crypto-7.10'], refs: ['Katz–Lindell §10.3'],
          pic: 'Logarithms of small primes are solved from smooth powers of g by linear algebra mod p − 1, then the target is shifted until it factors over the base.' },
        { num: '8.10', kind: 'Concept', name: 'Recommended key lengths', deps: ['crypto-8.4', 'crypto-8.9'], refs: ['Katz–Lindell §10.4'],
          pic: 'Equivalent security levels for symmetric keys, RSA moduli, ℤ_p^* groups and elliptic curves are read off curves derived from the attacks above, for a security level the reader chooses.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Key exchange and public-key encryption',
      summary: String.raw`Diffie and Hellman showed that two strangers can agree on a secret over a public channel, and public-key encryption followed. ElGamal is secure under DDH; textbook RSA is deterministic and malleable and must be padded (OAEP) to resist chosen-ciphertext attacks such as Bleichenbacher’s. Hybrid encryption combines a public-key step with fast symmetric encryption, and schemes built on factoring, quadratic residuosity and composite residuosity (Rabin, Goldwasser–Micali, Paillier) show the range of designs.`,
      items: [
        { num: '9.1', kind: 'Concept', name: 'The key-distribution problem', deps: ['crypto-1.1'], refs: ['Katz–Lindell §11.1'],
          pic: 'n users who all want to talk privately need n(n − 1)/2 shared keys; the graph of pairwise keys densifies as the reader adds users, against one key pair each with public keys.' },
        { num: '9.2', kind: 'Algorithm', name: 'Diffie–Hellman key exchange', deps: ['crypto-7.10', 'crypto-9.1'], refs: ['Katz–Lindell §11.3'],
          pic: 'Alice and Bob exchange gᵃ and gᵇ in a message diagram and both compute g^(ab); the eavesdropper’s view is shown, and the colour-mixing analogy runs alongside the real arithmetic.' },
        { num: '9.3', kind: 'Phenomenon', name: 'Man-in-the-middle attack', deps: ['crypto-9.2'], refs: ['Katz–Lindell §11.4', 'Boneh–Shoup ch. 21'],
          pic: 'Mallory intercepts the exchange and runs one Diffie–Hellman session with each party; both believe they share a key with each other, while the reader watches Mallory read every message.' },
        { num: '9.4', kind: 'Definition', name: 'Public-key encryption and CPA-security', deps: ['crypto-3.9'], refs: ['Katz–Lindell §12.2'],
          pic: 'The CPA game with a public key: since anyone can encrypt, the oracle is free, and the reader sees why public-key encryption must be randomized.' },
        { num: '9.5', kind: 'Algorithm', name: 'ElGamal encryption', deps: ['crypto-9.2', 'crypto-9.4'], refs: ['Katz–Lindell §12.4.1'],
          pic: 'Encrypt a group element as (gʳ, hʳ·m); encrypting the same message twice gives unrelated ciphertexts, and multiplying ciphertexts multiplies plaintexts.' },
        { num: '9.6', kind: 'Algorithm', name: 'Textbook RSA', deps: ['crypto-7.8', 'nt-2.4'], refs: ['Katz–Lindell §12.5.1'],
          pic: 'Generate a toy key pair, encrypt a number as m^e mod N and decrypt as c^d mod N; decryption via the CRT is timed against direct exponentiation.' },
        { num: '9.7', kind: 'Phenomenon', name: 'Attacks on textbook RSA', deps: ['crypto-9.6'], refs: ['Katz–Lindell §12.5.1'],
          pic: 'Small messages with e = 3 are decrypted by an ordinary cube root; the same message sent to three recipients is recovered via the CRT; multiplying ciphertexts multiplies plaintexts.' },
        { num: '9.8', kind: 'Algorithm', name: 'Padded RSA and OAEP', deps: ['crypto-9.7', 'crypto-5.13'], refs: ['Katz–Lindell §12.5.2', 'Katz–Lindell §12.5.4'],
          pic: 'The message passes through a two-round Feistel network of hash functions with random padding before exponentiation; the attacks of the previous item are replayed and fail.' },
        { num: '9.9', kind: 'Algorithm', name: 'Bleichenbacher’s attack on PKCS #1 v1.5', deps: ['crypto-9.8', 'crypto-5.16'], refs: ['Katz–Lindell §12.5.2', 'Boneh–Shoup ch. 12'],
          pic: 'A server that reveals whether decrypted padding is well formed lets the attacker narrow the plaintext’s interval with each multiplied ciphertext; the interval shrinks on a log scale.' },
        { num: '9.10', kind: 'Method', name: 'Hybrid encryption (KEM/DEM)', deps: ['crypto-9.4', 'crypto-3.12'], refs: ['Katz–Lindell §12.3'],
          pic: 'A public-key step wraps a fresh symmetric key and the bulk data is encrypted symmetrically; total cost is plotted against message size for pure public-key and hybrid encryption.' },
        { num: '9.11', kind: 'Definition', name: 'Trapdoor permutations', deps: ['crypto-6.1'], refs: ['Katz–Lindell §15.1.1'],
          pic: 'A permutation of a finite set is drawn as arrows; inverting it is a blind search without the trapdoor and a direct lookup with it, timed for growing sets.' },
        { num: '9.12', kind: 'Algorithm', name: 'Rabin encryption is as hard as factoring', deps: ['crypto-9.11', 'nt-4.1'], refs: ['Katz–Lindell §15.5'],
          pic: 'Squaring mod N = pq has four square roots per residue; anyone who can always find a square root is used, in the demo, to factor N from two essentially different roots.' },
        { num: '9.13', kind: 'Algorithm', name: 'Goldwasser–Micali probabilistic encryption', deps: ['nt-4.1', 'crypto-9.4'], refs: ['Katz–Lindell §15.4'],
          pic: 'Encrypt each bit as a random square or a random non-square with Jacobi symbol +1; without the factorization the two kinds look alike, with it the bit is read off instantly.' },
        { num: '9.14', kind: 'Algorithm', name: 'Paillier encryption and additive homomorphism', deps: ['crypto-9.4', 'nt-2.4'], refs: ['Katz–Lindell §15.2'],
          pic: 'Encrypt two numbers, multiply the ciphertexts mod N², and decrypt the sum; an encrypted tally of votes is accumulated without decrypting any single ballot.' },
        { num: '9.15', kind: 'Paper', name: 'New Directions in Cryptography',
          paper: { authors: 'Whitfield Diffie and Martin E. Hellman', year: 1976, title: 'New Directions in Cryptography',
                   venue: 'IEEE Transactions on Information Theory 22 (6): 644–654', doi: '10.1109/TIT.1976.1055638' },
          introduces: ['crypto-9.2', 'crypto-9.4', 'crypto-9.11', 'crypto-10.1'], deps: ['crypto-9.1', 'crypto-7.2', 'nt-3.2'], refs: [],
          pic: 'Alice and Bob mix a public colour with secret ones and exchange the mixtures, then repeat the game with g^a mod p; the reader plays Eve on the public channel and sees the cost of the discrete logarithm grow with the size of p.' },
        { num: '9.16', kind: 'Paper', name: 'Obtaining Digital Signatures and Public-Key Cryptosystems',
          paper: { authors: 'R. L. Rivest, A. Shamir and L. Adleman', year: 1978, title: 'A Method for Obtaining Digital Signatures and Public-Key Cryptosystems',
                   venue: 'Communications of the ACM 21 (2): 120–126', doi: '10.1145/359340.359342' },
          introduces: ['crypto-9.6', 'crypto-7.8', 'alg-7.5'], deps: ['nt-2.8', 'crypto-7.2', 'crypto-9.4'], refs: [],
          pic: 'Pick two small primes, compute n, φ(n), e and d, encrypt by square-and-multiply, sign with d and let anyone verify with e, and watch factoring n by trial division slow down as the primes grow.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Digital signatures and public-key infrastructure',
      summary: String.raw`A digital signature lets anyone verify who sent a message and that it was not changed — the public-key analogue of a MAC, with non-repudiation. Textbook RSA signatures are forgeable, but hashing first repairs them in the random-oracle model. Hash-based signatures need nothing but a one-way function; Schnorr’s identification protocol becomes a signature through the Fiat–Shamir transform, with DSA and ECDSA as its standardized cousins. Certificates bind keys to names, and TLS assembles everything into secure sessions.`,
      items: [
        { num: '10.1', kind: 'Definition', name: 'Digital signatures and unforgeability', deps: ['crypto-5.1', 'crypto-9.4'], refs: ['Katz–Lindell §13.2', 'Boneh–Shoup ch. 13'],
          pic: 'Sign with a private key, verify with the public one; the forgery game lets the reader request signatures on chosen messages and then try to sign a new message.' },
        { num: '10.2', kind: 'Phenomenon', name: 'Forging textbook RSA signatures', deps: ['crypto-9.6', 'crypto-10.1'], refs: ['Katz–Lindell §13.4.1'],
          pic: 'Pick any σ and publish (σ^e mod N, σ) as a valid pair; or multiply two signatures to sign the product of their messages, both verified by the checker.' },
        { num: '10.3', kind: 'Theorem', name: 'Hash-and-sign and RSA-FDH', deps: ['crypto-10.2', 'crypto-5.13'], refs: ['Katz–Lindell §13.3', 'Katz–Lindell §13.4.2'],
          pic: 'Signing H(m) instead of m destroys the algebraic forgeries; the security reduction programs the random oracle to embed an RSA challenge, shown as a table of hash queries.' },
        { num: '10.4', kind: 'Algorithm', name: 'Lamport one-time signatures', deps: ['crypto-10.1', 'crypto-6.1'], refs: ['Katz–Lindell §14.4.1', 'Boneh–Shoup ch. 14'],
          pic: 'The secret key is two columns of random strings; signing reveals one per message bit. Sign two messages with the same key and the reader assembles a forgery from revealed halves.' },
        { num: '10.5', kind: 'Algorithm', name: 'Merkle tree signatures', deps: ['crypto-10.4', 'crypto-5.14'], refs: ['Katz–Lindell §14.4.3'],
          pic: 'Many one-time public keys are hashed into a tree whose root is the long-term public key; each signature carries an authentication path, highlighted, and the tree is used up leaf by leaf.' },
        { num: '10.6', kind: 'Algorithm', name: 'Schnorr identification protocol', deps: ['crypto-7.10'], refs: ['Katz–Lindell §13.5.2', 'Boneh–Shoup ch. 19'],
          pic: 'Commit, challenge, respond: the message diagram runs with the reader as verifier, and an impostor without the secret is caught unless it guesses the challenge.' },
        { num: '10.7', kind: 'Method', name: 'Fiat–Shamir transform and Schnorr signatures', deps: ['crypto-10.6', 'crypto-5.13'], refs: ['Katz–Lindell §13.5.1'],
          pic: 'Replace the verifier’s random challenge by a hash of the commitment and message; the interactive diagram collapses into a single signature that anyone can check.' },
        { num: '10.8', kind: 'Algorithm', name: 'DSA and ECDSA', deps: ['crypto-10.7'], refs: ['Katz–Lindell §13.5.3'],
          pic: 'Sign and verify with toy parameters, each equation of the verification shown balancing; the role of the per-signature nonce is highlighted.' },
        { num: '10.9', kind: 'Phenomenon', name: 'Nonce reuse leaks the signing key', deps: ['crypto-10.8'], refs: ['Katz–Lindell §13.5.3'],
          pic: 'Two signatures made with the same nonce give two linear equations; the reader solves them and recovers the private key, as happened to a games console’s signing key.' },
        { num: '10.10', kind: 'Concept', name: 'Certificates and public-key infrastructure', deps: ['crypto-10.1', 'crypto-9.3'], refs: ['Katz–Lindell §13.6'],
          pic: 'A chain of certificates from a root authority to a website is verified link by link; revoking an intermediate certificate turns the chain red.' },
        { num: '10.11', kind: 'Concept', name: 'The TLS handshake and forward secrecy', deps: ['crypto-10.10', 'crypto-9.2', 'crypto-5.17'], refs: ['Katz–Lindell §13.7', 'Boneh–Shoup ch. 21'],
          pic: 'The handshake is stepped through as a message diagram: ephemeral Diffie–Hellman, certificate check, key derivation, authenticated encryption; a later key compromise leaves past sessions unreadable.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 11
    {
      n: 11,
      title: 'Elliptic curves and pairings',
      summary: String.raw`The points of an elliptic curve form a group under a geometric chord-and-tangent rule. Over finite fields these groups have about as many elements as the field, by Hasse’s bound, and resist index calculus, so Diffie–Hellman and signatures run with much shorter keys. Some curves carry a bilinear pairing that maps two points to a field element, enabling one-round three-party key exchange and very short signatures.`,
      items: [
        { num: '11.3', kind: 'Concept', name: 'Elliptic curves over finite fields', deps: ['nt-13.8'], refs: ['Boneh–Shoup ch. 15'],
          pic: 'The same equation mod a prime gives a scatter of points on a grid; adding points uses the same formulas, and the multiples of a point hop around the grid until they return to infinity.' },
        { num: '11.5', kind: 'Algorithm', name: 'Double-and-add scalar multiplication', deps: ['nt-13.8', 'crypto-7.2'], refs: ['Boneh–Shoup ch. 15'],
          pic: 'Compute kP by scanning the bits of k, doubling and adding; the sequence of intermediate points is animated on the finite-field scatter.' },
        { num: '11.6', kind: 'Algorithm', name: 'Elliptic-curve Diffie–Hellman', deps: ['crypto-11.5', 'crypto-9.2'], refs: ['Boneh–Shoup ch. 15'],
          pic: 'Alice and Bob exchange aP and bP and both arrive at abP, shown on the same scatter; the message diagram mirrors the classic protocol.' },
        { num: '11.7', kind: 'Concept', name: 'Why elliptic curves allow shorter keys', deps: ['crypto-11.6', 'crypto-8.9', 'crypto-8.8'], refs: ['Katz–Lindell §10.4'],
          pic: 'Attack costs on ℤ_p^* (index calculus) and on elliptic curves (only generic attacks) are plotted against key size; a horizontal security line meets them at 3072 and 256 bits.' },
        { num: '11.8', kind: 'Definition', name: 'Bilinear pairings', deps: ['crypto-11.3'], refs: ['Boneh–Shoup ch. 15'],
          pic: 'A table of e(aP, bQ) for small a, b shows each entry equal to e(P, Q)^(ab); the reader checks bilinearity on random multiples.' },
        { num: '11.9', kind: 'Algorithm', name: 'One-round three-party key exchange (Joux)', deps: ['crypto-11.8'], refs: ['Boneh–Shoup ch. 15'],
          pic: 'Three parties broadcast aP, bP, cP once; each pairs the other two values and raises to its own secret, all landing on e(P, P)^(abc).' },
        { num: '11.10', kind: 'Algorithm', name: 'BLS short signatures', deps: ['crypto-11.8', 'crypto-10.3'], refs: ['Boneh–Shoup ch. 15'],
          pic: 'Sign by multiplying the hashed message point by the secret key; verification is one pairing equation, and many signatures aggregate into one point that verifies all at once.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 12
    {
      n: 12,
      title: 'Zero knowledge and secure computation',
      summary: String.raw`A zero-knowledge proof convinces a verifier that a statement is true while revealing nothing else, formalized by a simulator that fakes the transcript. With commitments, every NP statement has such a proof. Sigma protocols and the Fiat–Shamir transform make them practical and non-interactive, and probabilistically checkable proofs make them succinct. Secret sharing, oblivious transfer and garbled circuits go further, letting mutually distrustful parties compute any function of their private inputs.`,
      items: [
        { num: '12.1', kind: 'Definition', name: 'Commitment schemes', deps: ['crypto-5.6'], refs: ['Katz–Lindell §6.6.5'],
          pic: 'Commit to a value by publishing a hash with fresh randomness and open it later; the reader tries to open to a different value (binding) or guess the value early (hiding).' },
        { num: '12.2', kind: 'Algorithm', name: 'Pedersen commitments', deps: ['crypto-12.1', 'crypto-7.10'], refs: ['Boneh–Shoup ch. 20'],
          pic: 'Commit as g^m h^r; for a fixed commitment every message has some opening, so hiding is perfect, while opening two ways would reveal log_g h.' },
        { num: '12.3', kind: 'Definition', name: 'Zero-knowledge proofs and simulators', deps: ['cplx-6.1', 'crypto-3.2'], refs: ['Boneh–Shoup ch. 20'],
          pic: 'Real transcripts of a protocol and transcripts produced by a simulator that never knew the secret are shown side by side; a distinguisher the reader picks cannot tell them apart.' },
        { num: '12.4', kind: 'Algorithm', name: 'Zero-knowledge proof of graph isomorphism', deps: ['crypto-12.3'], refs: ['Boneh–Shoup ch. 20'],
          pic: 'The prover sends a random relabelling and answers the verifier’s coin by revealing one isomorphism; a cheating prover survives k rounds with probability 2^(−k), tallied live.' },
        { num: '12.5', kind: 'Theorem', name: 'Zero knowledge for all of NP via 3-colouring', deps: ['crypto-12.4', 'crypto-12.1', 'toc-13.12'], refs: ['Boneh–Shoup ch. 20'],
          pic: 'The prover permutes the colours and commits to every vertex; the verifier opens one edge, which always shows two different random colours, and a bad colouring is caught over rounds.' },
        { num: '12.6', kind: 'Concept', name: 'Sigma protocols and special soundness', deps: ['crypto-10.6', 'crypto-12.3'], refs: ['Boneh–Shoup ch. 19'],
          pic: 'Rewind a Schnorr prover to answer two different challenges for one commitment; the reader solves for the secret, showing that convincing provers must know it.' },
        { num: '12.7', kind: 'Concept', name: 'Non-interactive and succinct proofs', deps: ['crypto-10.7', 'crypto-12.5', 'cplx-9.6'], refs: ['Boneh–Shoup ch. 20'],
          pic: 'A long computation is committed with a Merkle tree and spot-checked at positions derived from a hash; proof size and verification time stay tiny as the computation grows, both plotted.' },
        { num: '12.8', kind: 'Algorithm', name: 'Shamir secret sharing', deps: ['info-9.6'], refs: ['Katz–Lindell §15.3.1'],
          pic: 'A secret is the constant term of a random degree-(t − 1) polynomial; any t shares the reader selects interpolate it, while t − 1 shares are consistent with every possible secret.' },
        { num: '12.9', kind: 'Concept', name: 'Threshold cryptography', deps: ['crypto-12.8', 'crypto-10.1'], refs: ['Boneh–Shoup ch. 22'],
          pic: 'A signing key is split among five servers; any three produce partial signatures that combine into one valid signature, and two compromised servers learn nothing.' },
        { num: '12.10', kind: 'Definition', name: 'Oblivious transfer', deps: ['crypto-9.4'], refs: ['Boneh–Shoup ch. 23'],
          pic: 'A sender holds two messages and the receiver gets exactly one of its choice; message diagrams show what each party sees, and neither learns the other’s secret.' },
        { num: '12.11', kind: 'Algorithm', name: 'Yao’s garbled circuits', deps: ['crypto-12.10', 'cplx-4.1'], refs: ['Boneh–Shoup ch. 23'],
          pic: 'Two millionaires compare wealth: a comparison circuit is garbled gate by gate into encrypted tables, and the evaluator learns only the output bit, with each table’s rows shuffled.' },
        { num: '12.12', kind: 'Theorem', name: 'Secure multiparty computation', deps: ['crypto-12.11', 'crypto-12.8'], refs: ['Boneh–Shoup ch. 23'],
          pic: 'Parties compute an average salary on secret shares, adding locally and multiplying with a resharing step; the result is revealed while each individual input stays hidden.' },
        { num: '12.13', kind: 'Paper', name: 'The Knowledge Complexity of Interactive Proof Systems',
          paper: { authors: 'Shafi Goldwasser, Silvio Micali and Charles Rackoff', year: 1989, title: 'The Knowledge Complexity of Interactive Proof Systems',
                   venue: 'SIAM Journal on Computing 18 (1): 186–208 (conference version STOC 1985)', doi: '10.1137/0218012' },
          introduces: ['crypto-12.3', 'cplx-6.1'], deps: ['crypto-3.3', 'toc-12.11'], refs: [],
          pic: 'Play verifier against a prover claiming a number is a quadratic residue modulo N: each random challenge catches a cheater with probability ½, and a simulator with no secret produces transcripts that look exactly like real ones.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 13
    {
      n: 13,
      title: 'Lattices and post-quantum cryptography',
      summary: String.raw`Shor’s algorithm would break factoring and discrete-log schemes on a large quantum computer, so cryptography is migrating to problems believed hard even for quantum machines. Lattices are the leading candidate: finding short or close vectors is hard in high dimension, LLL finds only approximately short ones, and the learning-with-errors problem — as hard on average as worst-case lattice problems — supports encryption, key encapsulation and even fully homomorphic encryption. Hash-based signatures and code-based encryption complete the post-quantum toolkit.`,
      items: [
        { num: '13.1', kind: 'Concept', name: 'Quantum threats: Shor and Grover', deps: ['cplx-13.4', 'crypto-8.10', 'qinfo-6.7', 'qinfo-5.6'], refs: ['Katz–Lindell §14.1', 'Katz–Lindell §14.2'],
          pic: 'Key-size tables before and after quantum attacks: Shor collapses RSA and elliptic-curve security entirely, while Grover only halves the effective length of symmetric keys.' },
        { num: '13.4', kind: 'Definition', name: 'Shortest and closest vector problems', deps: ['nt-7.1'], refs: ['Boneh–Shoup ch. 17'],
          pic: 'Click a target point; the closest lattice point and the shortest nonzero vector are found by enumeration in 2D and 3D, and enumeration time is plotted against dimension.' },
        { num: '13.5', kind: 'Algorithm', name: 'Lagrange–Gauss reduction in two dimensions', deps: ['crypto-13.4'], refs: ['Boneh–Shoup ch. 17'],
          pic: 'Starting from a long, skewed basis, repeatedly subtract the rounded projection and swap; the basis becomes short and nearly orthogonal in a few animated steps.' },
        { num: '13.6', kind: 'Algorithm', name: 'LLL lattice basis reduction', deps: ['crypto-13.5', 'ladr-6.32'], refs: ['Boneh–Shoup ch. 17'],
          pic: 'Size-reduction and swap steps run on a basis in a few dimensions; the Gram–Schmidt lengths are plotted as a profile that flattens, and the first vector’s length is compared with the shortest.' },
        { num: '13.7', kind: 'Phenomenon', name: 'Breaking knapsack cryptosystems with LLL', deps: ['crypto-13.6', 'toc-13.11'], refs: ['Boneh–Shoup ch. 17'],
          pic: 'A Merkle–Hellman ciphertext is turned into a lattice whose short vector encodes the subset; LLL finds it and the plaintext bits appear.' },
        { num: '13.8', kind: 'Algorithm', name: 'Babai’s nearest-plane algorithm', deps: ['crypto-13.6'], refs: ['Boneh–Shoup ch. 17'],
          pic: 'With a good basis, rounding coordinates lands on the closest lattice point; with a bad basis of the same lattice it lands far away — the trapdoor idea behind lattice schemes.' },
        { num: '13.9', kind: 'Definition', name: 'Learning with errors', deps: ['crypto-13.4'], refs: ['Katz–Lindell §14.3', 'Boneh–Shoup ch. 17'],
          pic: 'Noisy linear equations mod q: without noise Gaussian elimination recovers the secret instantly; a noise slider makes the same equations look uniformly random.' },
        { num: '13.10', kind: 'Algorithm', name: 'Regev encryption', deps: ['crypto-13.9', 'crypto-9.4'], refs: ['Katz–Lindell §14.3'],
          pic: 'Encrypt a bit by summing random LWE samples and adding q/2 for a one; decryption subtracts the secret’s contribution and rounds, with the accumulated noise drawn as a band that must stay below q/4.' },
        { num: '13.11', kind: 'Theorem', name: 'Worst-case to average-case reductions for lattices', deps: ['crypto-13.9'], refs: ['Boneh–Shoup ch. 17'],
          pic: 'A solver for random LWE instances is used, through Gaussian sampling, to find short vectors in an arbitrary lattice; the chain of reductions is drawn with the approximation factor at each step.' },
        { num: '13.12', kind: 'Concept', name: 'Ring and module LWE', deps: ['crypto-13.10'], refs: ['Katz–Lindell §14.3'],
          pic: 'Replace a random matrix by polynomial multiplication in ℤ_q[x]/(xⁿ + 1); key and ciphertext sizes shrink from n² to n numbers, compared in a bar chart.' },
        { num: '13.13', kind: 'Concept', name: 'Fully homomorphic encryption and bootstrapping', deps: ['crypto-13.10', 'cplx-4.1'], refs: ['Boneh–Shoup ch. 17'],
          pic: 'Evaluate a circuit on ciphertexts: the noise band grows with every multiplication until bootstrapping, which homomorphically decrypts, resets it, plotted gate by gate.' },
        { num: '13.14', kind: 'Algorithm', name: 'McEliece code-based encryption', deps: ['info-8.6', 'crypto-9.4'], refs: ['Katz–Lindell §14.3'],
          pic: 'A scrambled generator matrix of an error-correcting code is the public key; ciphertexts are codewords plus deliberate errors that only the holder of the hidden structure can decode.' },
      ],
    },
  ],
};
